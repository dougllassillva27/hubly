const getStatusLabel = (status, minuto) => {
  const s = status?.toUpperCase() || '';
  if (['1H', 'HT', '2H', 'ET', 'P', 'LIVE'].includes(s)) return `${minuto || 0}'`;
  if (s === 'FT') return 'Encerrado';
  if (s === 'PST') return 'Adiado';
  if (s === 'CANC') return 'Cancelado';
  return 'Agendado';
};

const isLive = (status) => {
  const s = status?.toUpperCase() || '';
  return ['1H', 'HT', '2H', 'ET', 'P', 'LIVE'].includes(s);
};

export default function JogosHoje({ jogos }) {
  return (
    <div className="space-y-2">
      {jogos.map((jogo) => (
        <div key={jogo.id} className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs text-muted mb-2 truncate">{jogo.campeonato}</div>
          <div className="flex items-center justify-between gap-2">
            {/* Mandante */}
            <div className="flex items-center gap-2 w-[40%]">
              {jogo.mandante.escudo ? (
                <img
                  src={jogo.mandante.escudo}
                  alt={jogo.mandante.nome}
                  className="w-5 h-5 object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-5 h-5 bg-border rounded-full flex items-center justify-center text-[10px] font-bold text-muted flex-shrink-0">
                  {jogo.mandante.nome.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-text truncate">{jogo.mandante.nome}</span>
            </div>

            {/* Placar/Horário */}
            <div className="flex flex-col items-center text-center w-[20%] flex-shrink-0">
              {jogo.placar.mandante !== null ? (
                <div className="text-base font-bold text-text">
                  {jogo.placar.mandante} - {jogo.placar.visitante}
                </div>
              ) : (
                <div className="text-base font-bold text-text">{jogo.horario}</div>
              )}
              <div
                className={`text-xs font-bold ${isLive(jogo.status) ? 'text-green-500 animate-pulse' : 'text-muted'}`}
              >
                {getStatusLabel(jogo.status, jogo.minuto)}
              </div>
            </div>

            {/* Visitante */}
            <div className="flex items-center gap-2 w-[40%] justify-end">
              <span className="text-sm font-medium text-text truncate text-right">{jogo.visitante.nome}</span>
              {jogo.visitante.escudo ? (
                <img
                  src={jogo.visitante.escudo}
                  alt={jogo.visitante.nome}
                  className="w-5 h-5 object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-5 h-5 bg-border rounded-full flex items-center justify-center text-[10px] font-bold text-muted flex-shrink-0">
                  {jogo.visitante.nome.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
