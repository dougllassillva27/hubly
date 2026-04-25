import Parser from 'rss-parser';

const parser = new Parser();

const fetchAndParse = async (url) => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  let xml = new TextDecoder('utf-8').decode(buffer);
  if (xml.includes('encoding="ISO-8859-1"') || xml.includes('encoding="iso-8859-1"')) {
    xml = new TextDecoder('iso-8859-1').decode(buffer);
  }
  return parser.parseString(xml);
};

export const handler = async (event) => {
  const { urlProx, urlRes } = event.queryStringParameters || {};
  const rssProx = urlProx || 'https://www.ogol.com.br/rss/proxjogos.php';
  const rssRes = urlRes || 'https://www.ogol.com.br/rss/resultados.php';

  try {
    const [feedProx, feedRes] = await Promise.all([
      fetchAndParse(rssProx).catch(() => ({ items: [] })),
      fetchAndParse(rssRes).catch(() => ({ items: [] })),
    ]);

    const jogos = [];

    // Próximos Jogos (Agendados)
    feedProx.items.forEach((item, index) => {
      // Ex: [Brasileirão] Flamengo x Vasco
      const match = item.title.match(/^\[(.*?)\]\s+(.*?)\s+(?:x|-|vs)\s+(.*)$/i);
      if (match) {
        let horarioFormatado = '';
        try {
          const d = new Date(item.pubDate || item.isoDate);
          if (!isNaN(d.getTime())) {
            horarioFormatado = d.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Sao_Paulo',
            });
          }
        } catch (e) {}

        jogos.push({
          id: `prox-${index}`,
          campeonato: match[1].trim(),
          rodada: '',
          horario: horarioFormatado || '00:00',
          status: 'NS',
          minuto: null,
          mandante: { nome: match[2].trim(), escudo: null },
          visitante: { nome: match[3].trim(), escudo: null },
          placar: { mandante: null, visitante: null },
        });
      }
    });

    // Resultados (Encerrados)
    feedRes.items.forEach((item, index) => {
      // Ex: [Brasileirão] Flamengo 2-1 Vasco ou Flamengo 2 - 1 Vasco
      const match = item.title.match(/^\[(.*?)\]\s+(.*?)\s+(\d+)\s*-\s*(\d+)\s+(.*)$/i);
      if (match) {
        jogos.push({
          id: `res-${index}`,
          campeonato: match[1].trim(),
          rodada: '',
          horario: 'Encerrado',
          status: 'FT',
          minuto: null,
          mandante: { nome: match[2].trim(), escudo: null },
          visitante: { nome: match[5].trim(), escudo: null },
          placar: { mandante: parseInt(match[3], 10), visitante: parseInt(match[4], 10) },
        });
      }
    });

    jogos.sort((a, b) => {
      if (a.status === 'NS' && b.status === 'FT') return -1;
      if (a.status === 'FT' && b.status === 'NS') return 1;
      return 0;
    });

    // Limita para não estourar a interface
    const limitados = jogos.slice(0, 15);

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataReferencia: today, jogos: limitados }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
