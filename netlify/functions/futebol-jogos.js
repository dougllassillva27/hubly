export const handler = async (event) => {
  const apiKey = event.headers['x-api-key'];

  if (!apiKey) {
    return { statusCode: 401, body: JSON.stringify({ error: 'API Key ausente' }) };
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=America/Sao_Paulo`,
      {
        headers: {
          'x-apisports-key': apiKey,
        },
      }
    );

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      return { statusCode: 400, body: JSON.stringify({ error: Object.values(data.errors)[0] }) };
    }

    const jogosDoBrasil = (data.response || []).filter((j) => {
      const country = j.league.country;
      const name = j.league.name;
      return (
        country === 'Brazil' ||
        name.includes('Libertadores') ||
        name.includes('Sudamericana') ||
        name.includes('Recopa')
      );
    });

    const jogos = jogosDoBrasil.map((j) => ({
      id: String(j.fixture.id),
      campeonato: j.league.name,
      rodada: j.league.round,
      horario: new Date(j.fixture.date).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }),
      status: j.fixture.status.short, // NS, LIVE, HT, FT...
      minuto: j.fixture.status.elapsed,
      mandante: { nome: j.teams.home.name, escudo: j.teams.home.logo },
      visitante: { nome: j.teams.away.name, escudo: j.teams.away.logo },
      placar: { mandante: j.goals.home, visitante: j.goals.away },
    }));

    // Ordenação: Ao vivo (1) > Agendado (2) > Encerrado (3)
    const getPesoStatus = (status) => {
      if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(status)) return 1;
      if (['NS'].includes(status)) return 2;
      return 3;
    };

    jogos.sort((a, b) => {
      const pesoA = getPesoStatus(a.status);
      const pesoB = getPesoStatus(b.status);
      if (pesoA !== pesoB) return pesoA - pesoB;
      return a.horario.localeCompare(b.horario);
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataReferencia: today, jogos }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
