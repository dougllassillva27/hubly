import { storage } from '../utils/storage';
import { getDomain, isLocalDomain } from '../utils/favicon';

const RESOLVER_API = '/.netlify/functions/resolver-favicon';
const CACHE_PREFIX = 'sp_favicon_cache_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias

let activeRequests = 0;
const MAX_CONCURRENCY = 5;
const queue = [];

function processQueue() {
  if (activeRequests >= MAX_CONCURRENCY || queue.length === 0) return;
  const { resolve, url, domain } = queue.shift();
  activeRequests++;

  console.log(`[FaviconResolver] Chamando API para: ${domain} (Ativas: ${activeRequests})`);

  fetch(`${RESOLVER_API}?url=${encodeURIComponent(url)}`)
    .then((res) => {
      console.log(`[FaviconResolver] Resposta API (${domain}): ${res.status} ${res.statusText}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    })
    .then((data) => {
      if (data.favicon_url) {
        console.log(`[FaviconResolver] Sucesso para ${domain}: ${data.favicon_url}`);
        storage.set(`${CACHE_PREFIX}${domain}`, {
          url: data.favicon_url,
          timestamp: Date.now(),
        });
        resolve(data.favicon_url);
      } else {
        console.warn(`[FaviconResolver] API não retornou ícone para ${domain}`);
        resolve(null);
      }
    })
    .catch((err) => {
      console.error(`[FaviconResolver] Erro na requisição para ${domain}:`, err);
      resolve(null);
    })
    .finally(() => {
      activeRequests--;
      processQueue();
    });
}

export const getCachedFavicon = (domain) => {
  const cached = storage.get(`${CACHE_PREFIX}${domain}`);
  if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }
  return null;
};

export const setCachedFavicon = (domain, url) => {
  storage.set(`${CACHE_PREFIX}${domain}`, {
    url,
    timestamp: Date.now(),
  });
};

export const resolverFavicon = (url) => {
  return new Promise((resolve) => {
    const domain = getDomain(url);

    // Se for domínio local, resolvemos direto sem passar pelo backend (evita erro 403 SSRF)
    if (isLocalDomain(domain)) {
      try {
        const urlObj = new URL(url);
        return resolve(`${urlObj.origin}/favicon.ico`);
      } catch {
        return resolve(null);
      }
    }

    const cached = storage.get(`${CACHE_PREFIX}${domain}`);

    if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
      return resolve(cached.url);
    }

    queue.push({ resolve, url, domain });
    processQueue();
  });
};
);
    queue.push({ resolve, url, domain });
    processQueue();
  });
};
