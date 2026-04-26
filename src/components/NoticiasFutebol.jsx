import { ExternalLink } from 'lucide-react';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMins = Math.floor(Math.max(0, now - date) / 60000);
  const diffHrs = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHrs < 24) return `há ${diffHrs}h`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export default function NoticiasFutebol({ noticias }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {noticias.map((item) => (
        <a
          key={item.id}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-card border border-border rounded-xl p-3 hover:border-accent transition-colors group"
        >
          <div className="flex items-center gap-4">
            {item.imagem && (
              <img
                src={item.imagem}
                alt=""
                className="w-24 h-16 object-cover rounded-lg flex-shrink-0 bg-bg"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text group-hover:text-accent transition-colors line-clamp-2 text-sm">
                {item.titulo}
              </h3>
              <p className="text-xs text-muted mt-1">
                {item.fonte} · {formatDate(item.dataPublicacao)}
              </p>
            </div>
            <ExternalLink
              size={14}
              className="text-muted flex-shrink-0 self-start mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </a>
      ))}
    </div>
  );
}
