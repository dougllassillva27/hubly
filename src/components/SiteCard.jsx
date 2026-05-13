import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash2 } from 'lucide-react';
import useStore from '../store/useStore';
import { getFaviconUrls, getDomain, isLocalDomain, getProxiedUrl } from '../utils/favicon';
import { salvarFaviconDb } from '../utils/faviconDb';
import { resolverFavicon, getCachedFavicon, setCachedFavicon } from '../services/resolvedorFavicon';

const getAvatarColor = (name) => {
  const colors = [
    'from-red-400 to-red-600 text-white',
    'from-blue-400 to-blue-600 text-white',
    'from-green-400 to-green-600 text-white',
    'from-yellow-400 to-yellow-600 text-neutral-900',
    'from-purple-400 to-purple-600 text-white',
    'from-pink-400 to-pink-600 text-white',
    'from-indigo-400 to-indigo-600 text-white',
    'from-teal-400 to-teal-600 text-white',
    'from-orange-400 to-orange-600 text-white',
  ];
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function SiteCard({ site, disableDrag, isDraggingGlobal, lastDropTime }) {
  const {
    confirmDeleteSite,
    openAddSite,
    setEditingSite,
    setFaviconDb,
    syncToken,
    faviconsDb,
    registerSiteVisit,
    linkTarget,
    loadedIcons,
    markIconAsLoaded,
  } = useStore();
  const [showActions, setShowActions] = useState(false);

  const domain = getDomain(site.url);
  const isLocal = isLocalDomain(domain);
  const dbUrl = faviconsDb[domain];

  // Lê o cache local de forma síncrona para evitar delays de promises ao transitar categorias
  const localCachedUrl = getCachedFavicon(domain);

  const [faviconUrls, setFaviconUrls] = useState(() => {
    if (site.customIcon) return [site.customIcon];
    if (dbUrl) return [dbUrl];
    if (localCachedUrl) return [localCachedUrl];
    return [];
  });
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const [isResolving, setIsResolving] = useState(() => !site.customIcon && !dbUrl && !localCachedUrl && !isLocal);
  
  // Inicialização robusta do estado de carregamento
  const [isImageLoaded, setIsImageLoaded] = useState(() => {
    const currentUrl = faviconUrls[currentUrlIndex];
    if (!currentUrl) return false;
    return loadedIcons.has(getProxiedUrl(currentUrl));
  });


  const timerRef = useRef(null);
  const isTouchRef = useRef(false);
  const ignoreNextClickRef = useRef(false);

    useEffect(() => {
    let mounted = true;

    const checkLoaded = (url) => {
      if (!url) return false;
      return loadedIcons.has(getProxiedUrl(url));
    };

    if (site.customIcon) {
      setFaviconUrls([site.customIcon]);
      setCurrentUrlIndex(0);
      setImgFailed(false);
      setIsResolving(false);
      setIsImageLoaded(checkLoaded(site.customIcon));
      return ;
    }

    if (dbUrl) {
      setFaviconUrls([dbUrl]);
      setCurrentUrlIndex(0);
      setImgFailed(false);
      setIsResolving(false);
      setIsImageLoaded(checkLoaded(dbUrl));
      return ;
    }

    const cachedUrl = getCachedFavicon(domain);
    if (cachedUrl) {
      setFaviconUrls([cachedUrl]);
      setCurrentUrlIndex(0);
      setImgFailed(false);
      setIsResolving(false);
      setIsImageLoaded(checkLoaded(cachedUrl));
      return ;
    }

    if (isLocal) {
      const localUrls = getFaviconUrls(site.url);
      setFaviconUrls(localUrls);
      setCurrentUrlIndex(0);
      setImgFailed(localUrls.length === 0);
      setIsResolving(false);
      setIsImageLoaded(localUrls.length > 0 ? checkLoaded(localUrls[0]) : false);
      return ;
    }

    setIsResolving(true);
    setImgFailed(false);
    
    // Não resetamos isImageLoaded para false se a URL atual já estiver no cache global
    // Isso evita o flicker ao trocar de abas
    const currentUrl = faviconUrls[currentUrlIndex];
    if (currentUrl && !checkLoaded(currentUrl)) {
      setIsImageLoaded(false);
    }

    resolverFavicon(site.url).then((resolvedUrl) => {
      if (!mounted) return;
      const fallbacks = getFaviconUrls(site.url);
      const finalUrls = resolvedUrl ? [resolvedUrl, ...fallbacks] : fallbacks;
      setFaviconUrls(finalUrls);
      setCurrentUrlIndex(0);
      setImgFailed(finalUrls.length === 0);
      setIsResolving(false);
      if (finalUrls.length > 0) {
        setIsImageLoaded(checkLoaded(finalUrls[0]));
      }
    });

    return () => {
      mounted = false;
    };
  }, [site.url, site.customIcon, dbUrl, isLocal, loadedIcons]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: site.id,
    disabled: disableDrag,
  });

  useEffect(() => {
    if (isDragging) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShowActions(false);
    }
  }, [isDragging]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
    cursor: isDragging ? 'grabbing' : 'auto',
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingSite(site);
    openAddSite();
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    confirmDeleteSite(site.id);
  };

  const handleMouseEnter = () => {
    const isRecentlyDropped = lastDropTime?.current && (Date.now() - lastDropTime.current < 500);
    if (isTouchRef.current || isDragging || isDraggingGlobal?.current || isRecentlyDropped) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowActions(true);
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (isTouchRef.current) return ;
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowActions(false);
  };

  const handleTouchStart = (e) => {
    const isRecentlyDropped = lastDropTime?.current && (Date.now() - lastDropTime.current < 500);
    if (isDragging || isDraggingGlobal?.current || isRecentlyDropped) return ;
    isTouchRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      setShowActions(true);
      ignoreNextClickRef.current = true;
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);

    if (listeners?.onTouchStart) listeners.onTouchStart(e);
  };

  const handleTouchEnd = (e) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => {
      ignoreNextClickRef.current = false;
    }, 300);
    if (listeners?.onTouchEnd) listeners.onTouchEnd(e);
  };

  const handleTouchMove = (e) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (listeners?.onTouchMove) listeners.onTouchMove(e);
  };

  const handleMouseDown = (e) => {
    if (listeners?.onMouseDown) listeners.onMouseDown(e);
  };

  const handleContextMenu = (e) => {
    if (isTouchRef.current || ignoreNextClickRef.current) {
      e.preventDefault();
    }
  };

  const handleInteraction = (e) => {
    const isRecentlyDropped = lastDropTime?.current && (Date.now() - lastDropTime.current < 500);
    
    if (isDraggingGlobal?.current || isDragging || isRecentlyDropped) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    if (ignoreNextClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    if (showActions && isTouchRef.current) {
      e.preventDefault();
      e.stopPropagation();
      setShowActions(false);
      return false;
    }
    return true;
  };

  const handleCaptureClick = (e) => {
    const isRecentlyDropped = lastDropTime?.current && (Date.now() - lastDropTime.current < 500);
    if (isDraggingGlobal?.current || isDragging || isRecentlyDropped) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleRegularClick = (e) => {
    const shouldNavigate = handleInteraction(e);
    if (shouldNavigate) {
      registerSiteVisit(site.id);
    }
  };

  const handleAuxClick = (e) => {
    if (e.button !== 1) return ; // Not a middle click
    const shouldNavigate = handleInteraction(e);
    if (shouldNavigate) {
      registerSiteVisit(site.id);
    }
  };

  const handleImageError = () => {
    if (currentUrlIndex < faviconUrls.length - 1) {
      const nextIndex = currentUrlIndex + 1;
      setCurrentUrlIndex(nextIndex);
      const nextUrl = faviconUrls[nextIndex];
      setIsImageLoaded(nextUrl ? loadedIcons.has(getProxiedUrl(nextUrl)) : false);
    } else {
      setImgFailed(true);
    }
  };

  const handleImageLoad = () => {
    const currentUrl = faviconUrls[currentUrlIndex];
    if (!currentUrl) return ;

    const proxiedUrl = getProxiedUrl(currentUrl);
    setIsImageLoaded(true);
    markIconAsLoaded(proxiedUrl);

    const cached = getCachedFavicon(domain);
    if (cached !== currentUrl) {
      setCachedFavicon(domain, currentUrl);
    }

    if (syncToken && faviconsDb[domain] !== currentUrl) {
      setFaviconDb(domain, currentUrl);
      salvarFaviconDb(syncToken, domain, currentUrl);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`relative group flex flex-col items-center select-none ${isDragging ? 'z-50' : 'z-0'}`}
      {...attributes}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <a
        href={site.url}
        target={linkTarget}
        rel="noopener noreferrer"
        onClickCapture={handleCaptureClick}
        onClick={handleRegularClick}
        onAuxClick={handleAuxClick}
        onContextMenu={handleContextMenu}
        className="group/card relative w-16 h-16 sm:w-24 sm:h-24 mb-3 mx-auto flex items-center justify-center pointer-events-auto"
        style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

        {/* Card Body */}
        <div className="relative w-full h-full bg-card/80 backdrop-blur-md border border-border/50 group-hover/card:border-accent/50 rounded-2xl flex items-center justify-center shadow-sm group-hover/card:shadow-md transition-all duration-300 group-hover/card:-translate-y-1 overflow-hidden">
          {/* Fallback base (Oculto via opacity-0 quando a imagem carrega para suportar transparência PNG) */}
          <span
            className={`absolute flex w-10 h-10 sm:w-14 sm:h-14 items-center justify-center text-xl sm:text-3xl font-bold bg-gradient-to-br ${getAvatarColor(
              site.name
            )} rounded-xl transition-all duration-300 group-hover/card:scale-110 shadow-inner ${
              isImageLoaded ? 'opacity-0 scale-90' : 'opacity-100'
            } ${isResolving && !isImageLoaded ? 'animate-pulse opacity-50' : ''}`}
          >
            {site.name?.[0]?.toUpperCase()}
          </span>

          {/* Imagem Real (em absoluto sobre o fallback) */}
          {!imgFailed && (
            <img
              src={getProxiedUrl(faviconUrls[currentUrlIndex])}
              alt={site.name}
              className={`absolute w-10 h-10 sm:w-14 sm:h-14 object-contain transition-all duration-300 group-hover/card:scale-110 drop-shadow-md ${
              isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </a>

      {/* Name below card */}
      <h3 className="text-xs sm:text-sm font-medium text-muted text-center line-clamp-1 w-full px-1 group-hover:text-text transition-colors drop-shadow-sm">
        {site.name}
      </h3>

      {/* Action Buttons */}
      {showActions && (
        <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 animate-slideIn z-20">
          <button
            onClick={handleEdit}
            className="p-2 bg-amber-500 border border-amber-600 rounded-xl text-white hover:bg-amber-600 transition-all hover:scale-110 shadow-lg"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-red-500 border border-red-600 rounded-xl text-white hover:bg-red-600 transition-all hover:scale-110 shadow-lg"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
