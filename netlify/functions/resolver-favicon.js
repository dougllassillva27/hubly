import dns from 'node:dns/promises';
import { URL } from 'node:url';

const MAX_BYTES = 150 * 1024; // 150KB - Early Abort Stream Threshold
const TIMEOUT_MS = 8000;

function isPrivateIP(ip) {
  const ipv4Match = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const parts = ipv4Match.slice(1).map(Number);
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 127) return true; // 127.0.0.0/8
    if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 0) return true; // 0.0.0.0/8
    return false;
  }
  if (ip === '::1') return true;
  if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true;
  if (ip.toLowerCase().startsWith('fe80')) return true;
  if (ip === '::') return true;
  return false;
}

function extractIcons(html, baseUrl) {
  const anyLinkRegex = /<link[^>]+>/gi;
  const matches = html.match(anyLinkRegex) || [];

  const icons = [];
  let manifestUrl = null;

  for (const match of matches) {
    const relMatch = match.match(/rel=["']([^"']+)["']/i);
    if (!relMatch) continue;
    const rels = relMatch[1].toLowerCase().split(/\s+/);

    const hrefMatch = match.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    let href = hrefMatch[1];

    if (rels.includes('manifest')) {
      try {
        manifestUrl = new URL(href, baseUrl).href;
      } catch (e) {}
    } else if (rels.includes('icon') || rels.includes('apple-touch-icon') || rels.includes('shortcut')) {
      const sizesMatch = match.match(/sizes=["']([^"']+)["']/i);
      const typeMatch = match.match(/type=["']([^"']+)["']/i);

      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        icons.push({
          url: absoluteUrl,
          rel: relMatch[1].toLowerCase(),
          sizes: sizesMatch ? sizesMatch[1] : '',
          type: typeMatch ? typeMatch[1] : '',
        });
      } catch (e) {}
    }
  }

  return { icons, manifestUrl };
}

function getBestIcon(icons) {
  let best = null;
  let bestScore = -1;

  for (const icon of icons) {
    let score = 0;
    if (icon.url.endsWith('.svg')) score += 100;
    if (icon.rel.includes('apple-touch-icon')) score += 80;

    if (icon.sizes) {
      const sizeMatch = icon.sizes.match(/(\d+)x\d+/);
      if (sizeMatch) {
        const size = parseInt(sizeMatch[1], 10);
        score += size / 10;
      }
    }

    if (icon.type === 'image/png' || icon.url.endsWith('.png')) score += 10;
    if (icon.url.endsWith('.ico')) score -= 10;

    if (score > bestScore) {
      bestScore = score;
      best = icon;
    }
  }
  return best;
}

export const handler = async (event) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Request iniciada: ${event.queryStringParameters?.url}`);

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let { url } = event.queryStringParameters || {};
  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'URL obrigatória' }) };
  }

  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    console.log(`[${requestId}] Hostname: ${urlObj.hostname}`);
    
    const { address } = await dns.lookup(urlObj.hostname).catch((err) => {
      console.error(`[${requestId}] DNS Lookup falhou:`, err.message);
      return { address: null };
    });

    if (address) {
      const privateIP = isPrivateIP(address);
      console.log(`[${requestId}] IP resolvido: ${address} (Privado: ${privateIP})`);
      if (privateIP) {
        console.warn(`[${requestId}] SSRF detectado para IP privado: ${address}`);
        return { statusCode: 403, body: JSON.stringify({ error: 'SSRF bloqueado', ip: address }) };
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let html = '';
    let finalUrl = url;

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (response.ok) {
        finalUrl = response.url;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html') || contentType.includes('text/xml')) {
          if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let bytesRead = 0;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              bytesRead += value.length;
              html += decoder.decode(value, { stream: true });

              if (html.includes('</head>') || html.includes('</HEAD>') || bytesRead > MAX_BYTES) {
                reader.cancel();
                break;
              }
            }
          } else {
            html = await response.text();
          }
        }
      }
    } catch (err) {
      // Fallback em caso de erro na extração
    } finally {
      clearTimeout(timeoutId);
    }

    let { icons, manifestUrl } = extractIcons(html, finalUrl);
    let bestIcon = getBestIcon(icons);

    if (bestIcon) {
      const isHighQuality =
        bestIcon.url.endsWith('.svg') ||
        bestIcon.rel.includes('apple-touch-icon') ||
        (bestIcon.sizes && parseInt(bestIcon.sizes.match(/(\d+)x/)?.[1] || 0) >= 144);
      if (isHighQuality) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favicon_url: bestIcon.url }),
        };
      }
    }

    if (manifestUrl) {
      try {
        const manifestRes = await fetch(manifestUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        if (manifestRes.ok) {
          const manifest = await manifestRes.json();
          if (manifest.icons && Array.isArray(manifest.icons) && manifest.icons.length > 0) {
            let bestManifestIcon = manifest.icons[0];
            let maxSize = 0;
            for (const mIcon of manifest.icons) {
              const sizeMatch = mIcon.sizes?.match(/(\d+)x/);
              if (sizeMatch) {
                const size = parseInt(sizeMatch[1], 10);
                if (size > maxSize) {
                  maxSize = size;
                  bestManifestIcon = mIcon;
                }
              }
            }
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ favicon_url: new URL(bestManifestIcon.src, manifestUrl).href }),
            };
          }
        }
      } catch (e) {}
    }

    if (bestIcon) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favicon_url: bestIcon.url }),
      };
    }

    // Fallback absoluto se HTML não tiver nada
    const fallbackUrl = new URL('/favicon.ico', finalUrl).href;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favicon_url: fallbackUrl }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
