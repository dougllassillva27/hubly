import useStore from '../store/useStore';
import { ArrowRight } from 'lucide-react';

export default function OnboardingModal() {
  const setOnboardingShown = useStore((state) => state.setOnboardingShown);

  const handleStart = () => {
    setOnboardingShown(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 p-8 text-center animate-slideIn">
        <h2 className="text-3xl font-bold text-text mb-4">Bem-vindo ao Hubly! ✨</h2>
        <p className="text-text/80 mb-6 text-lg">Sua página inicial inteligente, organizada e personalizável.</p>
        <p className="text-muted text-sm mb-8">
          Acesse seus sites favoritos, organize-os por categorias, use um buscador inteligente, acompanhe as últimas
          notícias, veja a agenda de jogos e converse com uma IA — tudo em um só lugar.
        </p>
        <button
          onClick={handleStart}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-bg font-semibold rounded-xl text-lg hover:opacity-90 transition-opacity"
        >
          Começar a usar
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
