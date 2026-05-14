export const isLocalDomain = (domainOrUrl) => {
  if (!domainOrUrl) return false;
  
  let domain = domainOrUrl;
  try {
    // Se for uma URL completa, extrai apenas o hostname
    if (domainOrUrl.includes('://')) {
      domain = new URL(domainOrUrl).hostname;
    } else if (domainOrUrl.includes('/')) {
      domain = domainOrUrl.split('/')[0];
    }
    
    // Remove porta se presente (ex: localhost:3000 -> localhost)
    if (domain.includes(':')) {
      domain = domain.split(':')[0];
    }
  } catch (e) {
    // Fallback manual se URL falhar
    domain = domainOrUrl.replace(/^https?:\/\//, '').split(/[:\/]/)[0];
  }

  if (!domain) return false;
  domain = domain.toLowerCase();

  return (
    domain === 'localhost' ||
    domain === '127.0.0.1' ||
    !domain.includes('.') ||
    /\.(local|lan|test|dashboard|home|corp)$/.test(domain) ||
    /^(127|192\.168|10|172\.(1[6-9]|2[0-9]|3[0-1]))(\.|$)/.test(domain)
  );
};

export const getProxiedUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  
  // NUNCA passar domínios locais pelo proxy do Netlify (evita 403 SSRF)
  if (isLocalDomain(url)) return url;
  
  if (url.includes('google.com/s2/favicons')) return url;
  if (url.includes('icon.horse')) return url;
  
  // Se for uma URL direta ou de terceiros restritiva, passa pelo proxy do Netlify
  return `/.netlify/functions/proxy-img?url=${encodeURIComponent(url)}`;
};

export const getFaviconUrls = (url) => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    if (isLocalDomain(domain)) {
      return [`${urlObj.origin}/favicon.ico`, `${urlObj.origin}/favicon.png`];
    }

    let rootDomain = domain;
    const parts = domain.split('.');
    if (parts.length > 2) {
      if (parts[parts.length - 2].length <= 3 && parts[parts.length - 1].length <= 3) {
        rootDomain = parts.slice(-3).join('.');
      } else {
        rootDomain = parts.slice(-2).join('.');
      }
    }

    // Fontes confiáveis
    const urls = [`https://www.google.com/s2/favicons?domain=${domain}&sz=128`];

    if (rootDomain !== domain) {
      urls.push(`https://www.google.com/s2/favicons?domain=${rootDomain}&sz=128`);
    }

    urls.push(`https://icon.horse/icon/${domain}`, `${urlObj.origin}/favicon.ico`);

    return urls;
  } catch {
    return [];
  }
};

export const getDomain = (url) => {
  if (!url) return '';
  try {
    return new URL(url).hostname || url;
  } catch {
    return url.replace(/^https?:\/\//, '').split(/[:\/]/)[0] || url;
  }
};
