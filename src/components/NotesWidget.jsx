import { useState, useEffect, useRef } from 'react';
import { StickyNote } from 'lucide-react';
import useStore from '../store/useStore';

export default function NotesWidget() {
  const { notesContent, setNotesContent } = useStore();
  const [localNotes, setLocalNotes] = useState(notesContent);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalNotes(notesContent);
  }, [notesContent]);

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setLocalNotes(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setNotesContent(val);
    }, 1000);
  };

  return (
    <div className="w-full max-w-md bg-card/80 backdrop-blur-md border border-border rounded-2xl p-5 flex flex-col group hover:border-accent/50 transition-colors h-[16.5rem] animate-fadeIn">
      <textarea
        value={localNotes}
        onChange={handleNotesChange}
        placeholder="Suas anotações rápidas..."
        className="flex-1 w-full bg-transparent resize-none outline-none text-sm text-text placeholder-muted focus:ring-0 scrollbar-hide"
        spellCheck="false"
      />
    </div>
  );
}
