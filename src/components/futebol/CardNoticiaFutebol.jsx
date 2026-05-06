import { ExternalLink } from 'lucide-react';

export default function CardNoticiaFutebol({ noticia }) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor(Math.max(0, now - date) / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHrs < 24) return `há ${diffHrs}h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <a
      href={noticia.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-card border border-border rounded-xl p-4 hover:border-accent transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text group-hover:text-accent transition-colors line-clamp-2">
            {noticia.titulo}
          </h3>
          <p className="text-sm text-muted mt-1">
            {noticia.fonte} {noticia.dataPublicacao ? `· ${formatDate(noticia.dataPublicacao)}` : ''}
          </p>
        </div>
        <ExternalLink
          size={16}
          className="text-muted flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </a>
  );
}
