import { Trophy } from 'lucide-react';
import JogosHoje from './JogosHoje';

export default function FutebolWidget() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text flex items-center gap-2">
          <Trophy size={20} />
          Jogos de Hoje
        </h2>
      </div>
      <JogosHoje />
    </div>
  );
}
