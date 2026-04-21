export const getFaviconUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    const isLocal =
      domain === 'localhost' ||
      !domain.includes('.') ||
      /\.(local|lan|test|dashboard|home|corp)$/.test(domain) ||
      domain.match(/^(127|192\.168|10|172\.(1[6-9]|2[0-9]|3[0-1]))\./);

    if (isLocal) {
      return `${urlObj.origin}/favicon.ico`;
    }

    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
};

export const getDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};
