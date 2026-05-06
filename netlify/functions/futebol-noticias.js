export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=600', // Cache de 10 minutos
  };

  try {
    let xml = '';
    try {
      const c1 = new AbortController();
      const t1 = setTimeout(() => c1.abort(), 4000);
      const res1 = await fetch('https://ge.globo.com/rss/futebol/', {
        signal: c1.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      });
      clearTimeout(t1);
      if (!res1.ok) throw new Error('GE Erro');
      xml = await res1.text();
    } catch (err) {
      // Fallback defensivo Google News (100% blindado contra bloqueios)
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), 4000);
      const res2 = await fetch(
        'https://news.google.com/rss/search?q=futebol+brasileiro&hl=pt-BR&gl=BR&ceid=BR:pt-419',
        {
          signal: c2.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
          },
        }
      );
      clearTimeout(t2);
      if (!res2.ok) throw new Error(`Falha no Fallback Google News: ${res2.status}`);
      xml = await res2.text();
    }

    // Parser rudimentar e leve (sem dependências externas xml2js)
    const itemsMatch = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const limit = 10;

    const itens = itemsMatch.slice(0, limit).map((item) => {
      const title =
        item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || item.match(/<title>([\s\S]*?)<\/title>/);
      const link = item.match(/<link>([\s\S]*?)<\/link>/);
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const content =
        item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
        item.match(/<description>([\s\S]*?)<\/description>/) ||
        item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
      const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      const imgMatch = content ? content[1].match(/src=["'](.*?)["']/) : null;
      let imagem = imgMatch ? imgMatch[1] : null;

      if (!imagem) {
        const mediaMatch = item.match(/url=["'](.*?)["']/i);
        if (mediaMatch) imagem = mediaMatch[1];
      }

      let dataPublicacao = null;
      if (pubDate && pubDate[1]) {
        try {
          dataPublicacao = new Date(pubDate[1].trim()).toISOString();
        } catch (e) {}
      }

      let titleText = title
        ? title[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
        : 'Sem Título';

      // Remove o sufixo " - Nome do Site" injetado pelo Google News
      if (sourceMatch && titleText.endsWith(sourceMatch[1])) {
        titleText = titleText.substring(0, titleText.lastIndexOf(' - ' + sourceMatch[1]));
      }

      return {
        id: link ? link[1].trim() : Math.random().toString(),
        titulo: titleText,
        link: link ? link[1].trim() : '#',
        dataPublicacao,
        fonte: sourceMatch ? sourceMatch[1].trim() : 'Futebol',
        imagem,
      };
    });

    return { statusCode: 200, headers, body: JSON.stringify({ itens }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message, itens: [] }) };
  }
};
