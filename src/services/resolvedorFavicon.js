import { storage } from '../utils/storage';
import { getDomain } from '../utils/favicon';

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

  fetch(`${RESOLVER_API}?url=${encodeURIComponent(url)}`)
    .then((res) => {
      if (!res.ok) throw new Error('Falha na API de favicon');
      return res.json();
    })
    .then((data) => {
      if (data.favicon_url) {
        storage.set(`${CACHE_PREFIX}${domain}`, {
          url: data.favicon_url,
          timestamp: Date.now(),
        });
        resolve(data.favicon_url);
      } else {
        resolve(null);
      }
    })
    .catch(() => {
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

export const resolverFavicon = (url) => {
  return new Promise((resolve) => {
    const domain = getDomain(url);
    const cached = storage.get(`${CACHE_PREFIX}${domain}`);

    if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
      return resolve(cached.url);
    }

    queue.push({ resolve, url, domain });
    processQueue();
  });
};
