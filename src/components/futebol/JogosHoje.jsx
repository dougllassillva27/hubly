import { Trophy } from 'lucide-react';
import { useJogosHoje } from '../../hooks/useJogosHoje';
import CardJogoHoje from './CardJogoHoje';

export default function JogosHoje() {
  const { jogos, loading, error } = useJogosHoje();

  if (loading) {
    return (
      <div className="text-muted text-sm py-8 flex flex-col items-center justify-center animate-pulse border border-border/50 rounded-lg bg-card/20">
        Buscando agenda de jogos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm py-4 px-4 bg-red-400/10 rounded-lg border border-red-400/20">
        Erro ao carregar partidas: {error}
      </div>
    );
  }

  if (!jogos || jogos.length === 0) {
    return (
      <div className="text-muted text-sm py-8 flex flex-col items-center justify-center gap-2 border border-border/50 rounded-lg bg-card/20">
        <Trophy size={24} className="opacity-50" /> Nenhuma partida relevante hoje.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jogos.map((jogo) => (
        <CardJogoHoje key={jogo.id} jogo={jogo} />
      ))}
    </div>
  );
}
