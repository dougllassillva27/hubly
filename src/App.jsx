import { useEffect, useState } from 'react';
import useStore from './store/useStore';
import { applyTheme } from './themes/themes';
import Clock from './components/Clock';
import SearchBar from './components/SearchBar';
import CategoryFilter from './components/CategoryFilter';
import SiteGrid from './components/SiteGrid';
import WeatherWidget from './components/WeatherWidget';
import NotesWidget from './components/NotesWidget';
import BottomSection from './components/BottomSection';
import SettingsModal from './components/SettingsModal';
import AddSiteModal from './components/AddSiteModal';
import ConfirmModal from './components/ConfirmModal';
import AIChatModal from './components/AIChatModal';
import StarCanvas from './components/StarCanvas';
import ImportBookmarksModal from './components/ImportBookmarksModal';
import FloatingMenu from './components/FloatingMenu';
import OnboardingModal from './components/OnboardingModal';

export default function App() {
  const { theme, settingsOpen, addSiteOpen, chatOpen, deleteConfirmId, importBookmarksOpen, onboardingShown } =
    useStore();

  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const { autoSync, syncToken, pullFromCloud, carregarFaviconsDb, warmUpFavicons } = useStore.getState(); 

    const init = async () => {
      if (autoSync && syncToken) {
        try {
          await pullFromCloud();
        } catch (erro) {
          console.error('Erro no auto-pull:', erro);
        }
      }

      await carregarFaviconsDb();
      // Inicia o Warm Cache em background para domínios não resolvidos
      warmUpFavicons();
    };

    init();

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      new URLSearchParams(window.location.search).get('focus') === 'true'
    ) {
      setIsFocusMode(true);
    }
  }, []);
  useEffect(() => {
    if (settingsOpen || addSiteOpen || chatOpen || importBookmarksOpen || deleteConfirmId) {
      document.body.style.overflow = 'hidden';
      return;
    }

    document.body.style.overflow = 'unset';
  }, [settingsOpen, addSiteOpen, chatOpen, importBookmarksOpen, deleteConfirmId]);

  return (
    <div className="min-h-screen relative">
      <StarCanvas />

      <div className="relative z-10">
        <div
          className={`container mx-auto px-4 flex flex-col ${
            isFocusMode ? 'min-h-screen justify-center' : 'min-h-[85vh]'
          }`}
        >
          <div className={`flex-1 flex flex-col ${isFocusMode ? 'justify-center mb-20' : 'pt-8'}`}>
            {!isFocusMode && (
              <>
                <div className="text-center animate-fadeIn px-4 mt-2 sm:mt-4">
                  <h1 className="text-xl md:text-2xl text-text mb-2 tracking-tight">
                    <strong className="font-bold">Hubly</strong>{' '}
                    <span className="opacity-80 font-normal">
                      — sua página inicial pessoal, inteligente e organizada
                    </span>
                  </h1>

                  <p className="text-sm md:text-base text-text opacity-60 max-w-2xl mx-auto">
                    Acesse seus sites, organize por categorias, busque mais rápido, acompanhe notícias e use IA em um só
                    lugar.
                  </p>
                </div>

                <div className="relative w-screen left-1/2 right-1/2 -mx-[50vw] mt-6 mb-10">
                  <div className="md:hidden flex justify-center px-4">
                    <Clock />
                  </div>

                  <div className="hidden md:grid grid-cols-[1fr_420px_1fr] items-center min-h-[230px] px-10 xl:px-20">
                    <div className="flex justify-center">
                      <div
                        className="
                          w-[360px] xl:w-[440px] 2xl:w-[520px]
                          shrink-0
                          origin-center
                          scale-[1.08] xl:scale-[1.14] 2xl:scale-[1.2]
                          [&>*]:w-full
                          [&>*]:max-w-none
                        "
                      >
                        <WeatherWidget />
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Clock />
                    </div>

                    <div className="flex justify-center">
                      <div
                        className="
                          w-[360px] xl:w-[440px] 2xl:w-[520px]
                          shrink-0
                          origin-center
                          scale-[1.08] xl:scale-[1.14] 2xl:scale-[1.2]
                          [&>*]:w-full
                          [&>*]:max-w-none
                        "
                      >
                        <NotesWidget />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <SearchBar />

            {!isFocusMode && (
              <>
                <CategoryFilter />
                <SiteGrid />

                <div className="md:hidden flex flex-col items-center gap-6 mt-6 mb-12 pb-2">
                  <WeatherWidget />
                  <NotesWidget />
                </div>
              </>
            )}
          </div>
        </div>

        {!isFocusMode && (
          <>
            <BottomSection />

            <footer className="text-center py-6 text-muted text-sm">
              <p>Hubly · Sua página inicial personalizada</p>
            </footer>
          </>
        )}
      </div>

      {!isFocusMode && <FloatingMenu />}

      <SettingsModal />
      <AddSiteModal />
      <ConfirmModal />
      <AIChatModal />
      <ImportBookmarksModal />
      {!onboardingShown && <OnboardingModal />}
    </div>
  );
}
