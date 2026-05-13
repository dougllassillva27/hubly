import { useMemo, useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import useStore from '../store/useStore';
import SiteCard from './SiteCard';

export default function SiteGrid() {
  const { sites, activeCategory, searchQuery, reorderSites, homeSortMethod } = useStore();
  const [visibleCount, setVisibleCount] = useState(30);
  const [isBlockingClicks, setIsBlockingClicks] = useState(false);
  const isDraggingRef = useRef(false);
  const lastDropTimeRef = useRef(0);

  useEffect(() => {
    setVisibleCount(30);
  }, [activeCategory, searchQuery]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 800,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredSites = useMemo(() => {
    let result = [...sites];

    if (activeCategory === 'all' && homeSortMethod === 'recent') {
      result.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    } else {
      result.sort((a, b) => a.order - b.order);
    }

    if (activeCategory !== 'all') {
      result = result.filter((s) => s.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(query) || s.url.toLowerCase().includes(query));
    }

    return result;
  }, [sites, activeCategory, searchQuery, homeSortMethod]);

  const isAllCategory = activeCategory === 'all' && !searchQuery.trim();
  const disableDrag = activeCategory === 'all' && homeSortMethod === 'recent';
  const displayedSites = isAllCategory ? filteredSites.slice(0, visibleCount) : filteredSites;
  const hasMore = isAllCategory && visibleCount < filteredSites.length;

  const handleDragStart = (event) => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'grabbing';
  };

  const handleDragCancel = (event) => {
    isDraggingRef.current = false;
    document.body.style.cursor = '';
    activateClickKiller();
  };

  const activateClickKiller = () => {
    lastDropTimeRef.current = Date.now();
    setIsBlockingClicks(true);
    
    // Função "Matadora" de cliques nativos (Nuclear Option)
    const clickKiller = (e) => {
      e.stopImmediatePropagation();
      e.preventDefault();
    };

    // Adiciona o interceptor na fase de captura (antes de qualquer elemento receber o evento)
    window.addEventListener('click', clickKiller, true);
    
    // Remove o interceptor após 500ms
    setTimeout(() => {
      window.removeEventListener('click', clickKiller, true);
      setIsBlockingClicks(false);
    }, 500);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    isDraggingRef.current = false;
    document.body.style.cursor = '';
    
    activateClickKiller();

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = filteredSites.findIndex((s) => s.id === active.id);
    const newIndex = filteredSites.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...filteredSites];
    const [removed] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, removed);

    // OTIMIZAÇÃO VISUAL: A atualização do estado agora ocorre imediatamente.
    // O Click Killer nativo já está protegendo a janela de clique.
    reorderSites(newOrder.map((s) => s.id));
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-12 relative">
      {/* Glass Shield: Bloqueia todos os cliques na área após um drag */}
      {isBlockingClicks && (
        <div 
          className="fixed inset-0 z-[9999] cursor-wait"
          style={{ pointerEvents: 'all' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={displayedSites.map((s) => s.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8 justify-items-center">
            {displayedSites.map((site) => (
              <SiteCard 
                key={site.id} 
                site={site} 
                disableDrag={disableDrag} 
                isDraggingGlobal={isDraggingRef} 
                lastDropTime={lastDropTimeRef}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setVisibleCount((prev) => prev + 30)}
            className="px-6 py-2.5 bg-card border border-border rounded-xl text-text hover:border-accent hover:text-accent shadow-sm transition-all text-sm font-medium"
          >
            Ver mais sites
          </button>
        </div>
      )}

      {filteredSites.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p>Nenhum site encontrado</p>
        </div>
      )}
    </div>
  );
}
