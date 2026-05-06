export default function CardJogoHoje({ jogo }) {
  const { mandante, visitante, horario, placar, status, campeonato } = jogo;

  const getStatusText = () => {
    if (status === 'ao_vivo' || status === 'intervalo') {
      return (
        <span className="text-red-500 font-bold text-[10px] animate-pulse uppercase">{status.replace('_', ' ')}</span>
      );
    }
    if (status === 'encerrado') {
      return <span className="text-muted text-[10px] font-medium">FIM</span>;
    }
    return <span className="text-muted text-[10px] font-medium">{horario}</span>;
  };

  return (
    <div className="block bg-card border border-border rounded-xl p-4 hover:border-accent transition-colors group cursor-default w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span
            className="text-sm font-medium truncate max-w-[90px] sm:max-w-[120px] text-right group-hover:text-accent transition-colors"
            title={mandante.nome}
          >
            {mandante.nome}
          </span>
          {mandante.escudo ? (
            <img
              src={mandante.escudo}
              alt={mandante.nome}
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain drop-shadow-sm"
              loading="lazy"
            />
          ) : (
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-border/50 rounded-full shrink-0" />
          )}
        </div>

        <div className="flex flex-col items-center justify-center min-w-[70px] gap-1">
          <span className="text-sm font-bold text-text bg-background/50 px-2 py-0.5 rounded border border-border/30 shadow-inner">
            {status === 'agendado' ? horario : `${placar?.mandante ?? '-'} x ${placar?.visitante ?? '-'}`}
          </span>
          {getStatusText()}
        </div>

        <div className="flex items-center gap-2 flex-1 justify-start">
          {visitante.escudo ? (
            <img
              src={visitante.escudo}
              alt={visitante.nome}
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain drop-shadow-sm"
              loading="lazy"
            />
          ) : (
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-border/50 rounded-full shrink-0" />
          )}
          <span
            className="text-sm font-medium truncate max-w-[90px] sm:max-w-[120px] text-left group-hover:text-accent transition-colors"
            title={visitante.nome}
          >
            {visitante.nome}
          </span>
        </div>
      </div>
      <div className="text-center mt-3 pt-3 border-t border-border/30">
        <span className="text-[10px] text-muted uppercase tracking-wider font-medium">{campeonato}</span>
      </div>
    </div>
  );
}
