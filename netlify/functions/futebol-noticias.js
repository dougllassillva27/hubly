import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

export const handler = async (event) => {
  const rssUrl = event.queryStringParameters?.url || 'https://www.ogol.com.br/rss/noticias.php';

  try {
    const response = await fetch(rssUrl);
    const buffer = await response.arrayBuffer();

    let xml = new TextDecoder('utf-8').decode(buffer);
    if (xml.includes('encoding="ISO-8859-1"') || xml.includes('encoding="iso-8859-1"')) {
      xml = new TextDecoder('iso-8859-1').decode(buffer);
    }

    const feed = await parser.parseString(xml);
    const items = [];

    for (const item of feed.items.slice(0, 16)) {
      let imagem = null;

      if (item.media && item.media.$ && item.media.$.url) {
        imagem = item.media.$.url;
      } else {
        const html = item.content || item.contentEncoded || item.contentSnippet || '';
        const imgMatch = html.match(/<img[^>]+src="([^">]+)"/i);
        if (imgMatch) {
          imagem = imgMatch[1];
        }
      }

      items.push({
        id: item.guid || item.id || item.link,
        titulo: item.title,
        link: item.link,
        dataPublicacao: item.pubDate || item.isoDate,
        fonte: feed.title || 'Futebol Notícias',
        imagem: imagem,
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens: items }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
