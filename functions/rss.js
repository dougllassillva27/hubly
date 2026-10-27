import dns from 'node:dns/promises';
import { URL } from 'node:url';

const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024;

function isPrivateIP(ip) {
  const ipv4Match = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const parts = ipv4Match.slice(1).map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    if (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19)) return true;
    return false;
  }
  const v6 = ip.toLowerCase();
  if (v6 === '::1' || v6 === '::') return true;
  if (v6.startsWith('fc') || v6.startsWith('fd')) return true;
  if (v6.startsWith('fe80')) return true;
  if (v6.startsWith('::ffff:')) {
    const mapped = v6.slice(7);
    return isPrivateIP(mapped);
  }
  return false;
}

const ALLOWED_HOSTS = new Set([
  'www.tabnews.com.br',
  'tabnews.com.br',
  'www.sciencedaily.com',
  'feeds.bbci.co.uk',
  'news.google.com',
]);

export const handler = async (event) => {
  const { url } = event.queryStringParameters || {};

  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'URL obrigatória' }) };
  }

  let urlObj;
  try {
    urlObj = new URL(url);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'URL inválida' }) };
  }

  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Protocolo não permitido' }) };
  }

  if (!ALLOWED_HOSTS.has(urlObj.hostname.toLowerCase())) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Host não permitido' }) };
  }

  let address;
  try {
    const res = await dns.lookup(urlObj.hostname, { family: 0 });
    address = res?.address;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Host não resolvível' }) };
  }
  if (address && isPrivateIP(address)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'SSRF bloqueado' }) };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'manual' });
    clearTimeout(timeoutId);

    if (response.status >= 300 && response.status < 400) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Redirects não permitidos' }) };
    }

    const xml = await response.text();
    if (xml.length > MAX_BYTES) {
      return { statusCode: 413, body: JSON.stringify({ error: 'Resposta muito grande' }) };
    }

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const content = match[1];
      const getTag = (tag) => {
        const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\]>)?<\\/${tag}>`);
        return content.match(regex)?.[1]?.trim() || '';
      };
      items.push({
        title: getTag('title'),
        link: getTag('link'),
        pubDate: getTag('pubDate'),
        author: 'TabNews',
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno' }) };
  }
};
