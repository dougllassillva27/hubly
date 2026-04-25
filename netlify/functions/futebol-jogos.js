export const handler = async (event) => {
  let apiKey = event.headers['x-api-key'];
  if (!apiKey || apiKey === 'null' || apiKey === 'undefined' || apiKey.trim() === '') {
    apiKey = '3'; // Tier grátis/teste TheSportsDB
  }
  const ligasParam = event.queryStringParameters?.ligas;

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD

  try {
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsday.php?d=${today}&s=Soccer`);

    const data = await response.json();

    if (!data.events) {
      return { statusCode: 200, body: JSON.stringify({ dataReferencia: today, jogos: [] }) };
    }

    let jogosFiltrados = data.events;

    if (ligasParam && ligasParam.trim() !== '') {
      const ligasDesejadas = ligasParam
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      jogosFiltrados = jogosFiltrados.filter((j) => {
        const nameLower = j.strLeague?.toLowerCase() || '';
        const leagueId = String(j.idLeague);
        return ligasDesejadas.some((liga) => {
          if (/^\d+$/.test(liga)) {
            return leagueId === liga;
          }
          return nameLower.includes(liga);
        });
      });
    } else {
      // Padrão Brasil e ligas globais principais se não houver filtro
      jogosFiltrados = jogosFiltrados.filter((j) => {
        return (
          ['4351', '4352', '4354', '4406', '4480', '4328'].includes(String(j.idLeague)) ||
          (j.strLeague && j.strLeague.toLowerCase().includes('brazil'))
        );
      });
    }

    const normalizeStatus = (status) => {
      const s = (status || '').toUpperCase();
      if (s === 'NOT STARTED') return 'NS';
      if (s === 'MATCH FINISHED') return 'FT';
      if (s === 'IN PROGRESS') return 'LIVE';
      if (s === 'POSTPONED') return 'PST';
      if (s === 'CANCELLED') return 'CANC';
      if (s === 'HALFTIME') return 'HT';
      return s || 'NS';
    };

    const jogos = jogosFiltrados.map((j) => {
      let horarioFormatado = '';
      try {
        const d = new Date(`${j.dateEvent}T${j.strTime || '00:00:00'}`);
        horarioFormatado = d.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        });
      } catch {
        horarioFormatado = j.strTime ? j.strTime.substring(0, 5) : '00:00';
      }

      return {
        id: String(j.idEvent),
        campeonato: j.strLeague,
        rodada: j.intRound || '',
        horario: horarioFormatado,
        status: normalizeStatus(j.strStatus),
        minuto: j.strProgress || null,
        mandante: { nome: j.strHomeTeam, escudo: j.strHomeTeamBadge || null },
        visitante: { nome: j.strAwayTeam, escudo: j.strAwayTeamBadge || null },
        placar: {
          mandante: j.intHomeScore !== null ? parseInt(j.intHomeScore) : null,
          visitante: j.intAwayScore !== null ? parseInt(j.intAwayScore) : null,
        },
      };
    });

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
