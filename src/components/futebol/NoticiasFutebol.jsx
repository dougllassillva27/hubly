import { Newspaper, RefreshCw } from 'lucide-react';
import { useNoticiasFutebol } from '../../hooks/useNoticiasFutebol';
import CardNoticiaFutebol from './CardNoticiaFutebol';

export default function NoticiasFutebol() {
  const { noticias, loading, error, fetchNoticias } = useNoticiasFutebol();

  const header = (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-text flex items-center gap-2">
        <Newspaper size={20} />
        Últimas Notícias
      </h2>
      <button
        onClick={fetchNoticias}
        disabled={loading}
        className="p-2 text-muted hover:text-accent transition-colors disabled:opacity-50"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );

  if (loading && (!noticias || noticias.length === 0)) {
    return (
      <>
        {header}
        <div className="text-muted text-sm py-8 flex flex-col items-center justify-center animate-pulse border border-border/50 rounded-xl bg-card/20">
          Carregando manchetes...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <div className="text-red-400 text-sm py-4 px-4 bg-red-400/10 rounded-xl border border-red-400/20">
          Erro ao carregar notícias: {error}
        </div>
      </>
    );
  }

  if (!noticias || noticias.length === 0) {
    return (
      <>
        {header}
        <div className="text-muted text-sm py-8 flex flex-col items-center justify-center gap-2 border border-border/50 rounded-xl bg-card/20">
          <Newspaper size={24} className="opacity-50" /> Nenhuma notícia recente encontrada.
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="space-y-3">
        {noticias.map((noticia) => (
          <CardNoticiaFutebol key={noticia.id} noticia={noticia} />
        ))}
      </div>
    </>
  );
}
