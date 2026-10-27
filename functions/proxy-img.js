import dns from 'node:dns/promises';
import { URL } from 'node:url';

const TIMEOUT_MS = 8000;

function isPrivateIP(ip) {
  const v = (ip || '').toLowerCase();
  // IPv4-mapped IPv6
  if (v.startsWith('::ffff:')) {
    return isPrivateIP(v.slice(7));
  }
  const ipv4Match = v.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
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
  if (v === '::1' || v === '::' || v === '::0') return true;
  if (v.startsWith('fc') || v.startsWith('fd')) return true;
  if (v.startsWith('fe80')) return true;
  if (v.startsWith('fec0')) return true;
  return false;
}

export const handler = async (event) => {
  const commonHeaders = {
    'Access-Control-Allow-Origin': 'same-origin',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cache-Control': 'public, max-age=31536000, immutable',
  };

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: commonHeaders,
      body: 'Method Not Allowed' 
    };
  }

  const { url } = event.queryStringParameters || {};
  if (!url) {
    return { 
      statusCode: 400, 
      headers: commonHeaders,
      body: JSON.stringify({ error: 'URL obrigatória' }) 
    };
  }

  try {
    const urlObj = new URL(url);

    // Validação Anti-SSRF rigorosa
    const dnsResult = await dns.lookup(urlObj.hostname).catch(() => ({ address: null }));
    const address = dnsResult?.address;

    if (address && isPrivateIP(address)) {
      return { 
        statusCode: 403, 
        headers: commonHeaders,
        body: JSON.stringify({ error: 'SSRF bloqueado' }) 
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const fetchHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      Referer: urlObj.origin + '/',
    };

    // --- Tentativa 1: Direto na Origem ---
    let response = await fetch(url, {
      signal: controller.signal,
      headers: fetchHeaders,
      redirect: 'manual',
    }).catch(() => null);

    if (response && response.status >= 300 && response.status < 400) {
      clearTimeout(timeoutId);
      return {
        statusCode: 403,
        headers: commonHeaders,
        body: JSON.stringify({ error: 'Redirects não permitidos' }),
      };
    }

    // --- Tentativa 2: Fallback via CDN de Cache ---
    if (!response || !response.ok) {
      const cdnProxyUrl = 'https://images.weserv.nl/?url=' + encodeURIComponent(url);
      response = await fetch(cdnProxyUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': fetchHeaders['User-Agent'] },
        redirect: 'manual',
      }).catch(() => null);
    }

    clearTimeout(timeoutId);

    // Re-valida o host efetivo da resposta (mitigação TOCTOU/DNS rebinding)
    if (response && response.url) {
      try {
        const finalHost = new URL(response.url).hostname;
        // re-resolve
        const r2 = await dns.lookup(finalHost, { family: 0 }).catch(() => ({ address: null }));
        if (r2?.address && isPrivateIP(r2.address)) {
          clearTimeout(timeoutId);
          return {
            statusCode: 403,
            headers: commonHeaders,
            body: JSON.stringify({ error: 'SSRF bloqueado' }),
          };
        }
      } catch {}
    }

    // --- Processamento da Resposta ---
    if (response && response.ok) {
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      return {
        statusCode: 200,
        headers: {
          ...commonHeaders,
          'Content-Type': contentType,
        },
        isBase64Encoded: true,
        body: base64,
      };
    }

    // --- Fallback Final: 404 ---
    return { 
      statusCode: 404, 
      headers: commonHeaders,
      body: 'Imagem não encontrada ou bloqueada' 
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: commonHeaders,
      body: 'Erro interno no proxy',
    };
  }
};