export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300', // Cache de 5 minutos no edge
  };

  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 8000);

    const response = await fetch('https://ge.globo.com/agenda/', {
      signal: abortController.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Falha ao carregar GE: ${response.status}`);
    }

    const html = await response.text();

    // O GloboEsporte migrou do Next.js padrão para injeção direta via window.dataSportsSchedule
    // Como eles injetam um objeto JS literal (sport: {...}) e não JSON estrito, pegamos direto o nó "sport"
    const sportsScheduleMatch = html.match(/sport:\s*(\{[\s\S]*?\})\s*,\s*multisport:/);

    if (!sportsScheduleMatch || !sportsScheduleMatch[1]) {
      throw new Error('Nó "sport" do dataSportsSchedule não encontrado no HTML alvo.');
    }

    const sportDates = JSON.parse(sportsScheduleMatch[1]);

    // Tenta encontrar a agenda do dia exato (Brasília)
    const hojeDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hojeLocal =
      hojeDate.getFullYear() +
      '-' +
      String(hojeDate.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(hojeDate.getDate()).padStart(2, '0');

    let agendasDeHoje = sportDates[hojeLocal]?.championshipsAgenda || [];

    // Fallback defensivo: se não tiver jogos hoje, pega a primeira data com jogos no payload deles
    if (agendasDeHoje.length === 0) {
      const availableDates = Object.keys(sportDates);
      if (availableDates.length > 0) {
        agendasDeHoje = sportDates[availableDates[0]]?.championshipsAgenda || [];
      }
    }

    const jogosNormalizados = [];

    for (const agenda of agendasDeHoje) {
      const campeonato = agenda.championship?.name || 'Futebol';
      const combinedEvents = [...(agenda.past || []), ...(agenda.now || []), ...(agenda.future || [])];

      for (const event of combinedEvents) {
        if (event.match) {
          const matchData = event.match;
          const mandante = matchData.firstContestant || {};
          const visitante = matchData.secondContestant || {};

          let status = 'agendado';
          if (matchData.moment === 'PAST') status = 'encerrado';
          else if (matchData.moment === 'NOW') status = 'ao_vivo';
          else if (matchData.moment === 'FUTURE') status = 'agendado';

          let horario = '00:00';
          if (matchData.startHour) {
            horario = matchData.startHour.substring(0, 5);
          }

          jogosNormalizados.push({
            id: matchData.id?.toString() || Math.random().toString(36).substring(7),
            campeonato: campeonato,
            rodada: matchData.round ? `Rodada ${matchData.round}` : matchData.phase?.name || null,
            horario: horario,
            status: status,
            minuto: null,
            mandante: {
              nome: mandante.popularName || mandante.name || 'Mandante',
              escudo: mandante.badgeSvg || mandante.badgePng || null,
            },
            visitante: {
              nome: visitante.popularName || visitante.name || 'Visitante',
              escudo: visitante.badgeSvg || visitante.badgePng || null,
            },
            placar: {
              mandante:
                matchData.scoreboard?.home !== undefined && matchData.scoreboard?.home !== null
                  ? matchData.scoreboard.home
                  : null,
              visitante:
                matchData.scoreboard?.away !== undefined && matchData.scoreboard?.away !== null
                  ? matchData.scoreboard.away
                  : null,
            },
          });
        }
      }
    }

    // Filtragem dinâmica por Query String + Regra VIP invisível
    const qsCampeonatos = event.queryStringParameters?.campeonatos;
    let campeonatosAlvo = qsCampeonatos
      ? qsCampeonatos.split(',').map((c) => c.trim().toLowerCase())
      : [
          'série a',
          'série b',
          'copa do brasil',
          'libertadores',
          'sul-americana',
          'champions',
          'premier league',
          'la liga',
        ];

    // Regra VIP (invisível): Competições gigantes sempre passam no filtro
    const vips = ['copa do mundo', 'eurocopa', 'copa américa', 'recopa gaúcha', 'gauchão', 'campeonato gaúcho'];
    campeonatosAlvo = [...new Set([...campeonatosAlvo, ...vips])];

    // Blocklist invisível: Remove lixo das buscas parciais (base, divisões inferiores estaduais, feminino)
    const blocklist = ['sub-', 'feminino', 'feminina', 'série a2', 'série a3', 'série a4', 'série b2', 'aspirantes'];

    const jogosFiltrados = jogosNormalizados.filter((j) => {
      const nomeCamp = j.campeonato.toLowerCase();
      if (blocklist.some((blocked) => nomeCamp.includes(blocked))) return false;
      return campeonatosAlvo.some((alvo) => nomeCamp.includes(alvo));
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        dataReferencia: hojeLocal,
        jogos: jogosFiltrados,
      }),
    };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message, jogos: [] }) };
  }
};
