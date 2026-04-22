import { useState, useRef, useEffect } from 'react';
import { Settings, Plus } from 'lucide-react';
import useStore from '../store/useStore';

export default function FloatingMenu() {
  const { openSettings, openAddSite } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={menuRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 md:w-14 md:h-14 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-border/50 overflow-hidden hover:scale-105 hover:border-accent transition-all focus:outline-none"
      >
        <img src="/hubly-toggle.webp" alt="Menu" className="w-full h-full object-cover" />
      </button>

      {/* Expanded Menu */}
      <div
        className={`flex flex-col items-end gap-3 transition-all duration-200 origin-bottom ${
          isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <button
          onClick={() => {
            openAddSite();
            setIsOpen(false);
          }}
          className="flex items-center gap-3 px-4 py-2.5 bg-card border border-border rounded-xl text-text hover:border-accent hover:text-accent shadow-lg transition-all"
        >
          <span className="text-sm font-medium">Adicionar Site</span>
          <div className="p-1 bg-accent/10 rounded-lg">
            <Plus size={18} />
          </div>
        </button>
        <button
          onClick={() => {
            openSettings();
            setIsOpen(false);
          }}
          className="flex items-center gap-3 px-4 py-2.5 bg-card border border-border rounded-xl text-text hover:border-accent hover:text-accent shadow-lg transition-all"
        >
          <span className="text-sm font-medium">Configurações</span>
          <div className="p-1 bg-accent/10 rounded-lg">
            <Settings size={18} />
          </div>
        </button>
      </div>
    </div>
  );
}
