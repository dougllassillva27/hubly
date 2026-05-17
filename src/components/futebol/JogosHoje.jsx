import { useMemo } from 'react';
import { Trophy, Heart } from 'lucide-react';
import { useJogosHoje } from '../../hooks/useJogosHoje';
import useStore from '../../store/useStore';
import CardJogoHoje from './CardJogoHoje';

export default function JogosHoje() {
  const { jogos, loading, error } = useJogosHoje();
  const { favoriteTeam } = useStore();

  const { jogosFavoritos, jogosGerais } = useMemo(() => {
    const list = jogos || [];
    if (!favoriteTeam) return { jogosFavoritos: [], jogosGerais: list };

    const searchTerms = favoriteTeam
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (searchTerms.length === 0) return { jogosFavoritos: [], jogosGerais: list };

    const favoritos = list.filter((j) => {
      const mandante = j.mandante?.nome?.toLowerCase() || '';
      const visitante = j.visitante?.nome?.toLowerCase() || '';
      return searchTerms.some((term) => mandante.includes(term) || visitante.includes(term));
    });

    const gerais = list.filter((j) => !favoritos.some((f) => f.id === j.id));

    return { jogosFavoritos: favoritos, jogosGerais: gerais };
  }, [jogos, favoriteTeam]);

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

  return (
    <div className="space-y-6">
      {/* Seção Time do Coração */}
      <div className="bg-card/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4 text-accent">
          <Heart size={18} fill="currentColor" className="text-red-500" />
          <h3 className="font-semibold text-sm uppercase tracking-wider">Time do Coração</h3>
        </div>

        {!favoriteTeam ? (
          <p className="text-muted text-sm italic py-2">
            Defina seu time do coração nas configurações do Sistema para visualizar os jogos.
          </p>
        ) : jogosFavoritos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jogosFavoritos.map((jogo) => (
              <CardJogoHoje key={`fav-${jogo.id}`} jogo={jogo} />
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm italic py-2">Sem jogos do {favoriteTeam} hoje.</p>
        )}
      </div>

      <div className="border-t border-border/30 pt-4">
        <div className="flex items-center gap-2 mb-4 text-muted">
          <Trophy size={18} />
          <h3 className="font-semibold text-sm uppercase tracking-wider">Jogos de Hoje</h3>
        </div>

        {jogosGerais.length === 0 ? (
          <div className="text-muted text-sm py-8 flex flex-col items-center justify-center gap-2 border border-border/50 rounded-lg bg-card/20">
            <Trophy size={24} className="opacity-50" /> Nenhuma outra partida relevante hoje.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jogosGerais.map((jogo) => (
              <CardJogoHoje key={jogo.id} jogo={jogo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
