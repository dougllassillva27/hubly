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

    const startPattern = 'window.dataSportsSchedule = {';
    const startIndex = html.indexOf(startPattern);
    
    if (startIndex === -1) {
      throw new Error('Objeto dataSportsSchedule não encontrado no HTML alvo.');
    }

    // Encontra o início do objeto JSON real (após a atribuição)
    const jsonStartIndex = startIndex + startPattern.length - 1;
    
    // Tenta encontrar o fechamento do objeto principal, mas como é um script complexo,
    // vamos buscar pela tag de fechamento do script ou o final do objeto correspondente
    // Por hora, uma abordagem mais simples: buscar até 'multisport:' e refinar
    const sportsScheduleMatch = html.substring(jsonStartIndex).match(/sport:\s*(\{[\s\S]*?\})\s*,\s*multisport:/);

    if (!sportsScheduleMatch || !sportsScheduleMatch[1]) {
      throw new Error('Nó "sport" do dataSportsSchedule não encontrado no HTML alvo.');
    }

    const sportDates = JSON.parse(sportsScheduleMatch[1]);
    console.log('DEBUG: sportDates extraído:', Object.keys(sportDates));

    // Tenta encontrar a agenda do dia exato (Brasília)
    const hojeDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hojeLocal =
      hojeDate.getFullYear() +
      '-' +
      String(hojeDate.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(hojeDate.getDate()).padStart(2, '0');

    console.log('DEBUG: Data local (Brasília):', hojeLocal);

    let agendasDeHoje = sportDates[hojeLocal]?.championshipsAgenda || [];

    // Fallback defensivo: se não tiver jogos hoje, pega a primeira data com jogos no payload deles
    if (agendasDeHoje.length === 0) {
      const availableDates = Object.keys(sportDates);
      console.log('DEBUG: Sem jogos para hoje, usando fallback:', availableDates[0]);
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

    console.log('DEBUG: Jogos normalizados (total):', jogosNormalizados.length);

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

    console.log('DEBUG: Campeonatos alvo:', campeonatosAlvo);

    // Regra VIP (invisível): Competições gigantes sempre passam no filtro
    const vips = ['copa do mundo', 'eurocopa', 'copa américa', 'recopa gaúcha', 'gauchão', 'campeonato gaúcho'];
    campeonatosAlvo = [...new Set([...campeonatosAlvo, ...vips])];

    // Blocklist invisível: Remove lixo das buscas parciais (base, divisões inferiores estaduais, feminino)
    const blocklist = ['sub-', 'feminino', 'feminina', 'série a2', 'série a3', 'série a4', 'série b2', 'aspirantes'];

    const jogosFiltrados = jogosNormalizados.filter((j) => {
      const nomeCamp = j.campeonato.toLowerCase();
      console.log('DEBUG: Verificando campeonato:', nomeCamp);
      
      if (blocklist.some((blocked) => nomeCamp.includes(blocked))) {
        console.log('DEBUG: Bloqueado:', nomeCamp);
        return false;
      }
      
      // Verifica se algum dos campeonatos alvo está contido no nome do campeonato
      const match = campeonatosAlvo.some((alvo) => nomeCamp.includes(alvo) || nomeCamp.includes(alvo.replace('ã', 'a').replace('é', 'e')));
      
      if (!match) {
        console.log('DEBUG: Não corresponde aos alvos:', nomeCamp);
      }
      return match;
    });

    console.log('DEBUG: Jogos após filtro:', jogosFiltrados.length);

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
