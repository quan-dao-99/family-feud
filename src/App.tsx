import { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import type { ViewMode } from './types/game';

import { HeaderNav } from './components/HeaderNav';
import { GameBoard } from './components/GameBoard';
import { HostControlPanel } from './components/HostControlPanel';
import { FastMoneyRound } from './components/FastMoneyRound';
import { QuestionManager } from './components/QuestionManager';
import { BuzzerModal } from './components/BuzzerModal';
import { RulesModal } from './components/RulesModal';

function checkHostInLocation(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'host' || params.has('host')) return true;
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.endsWith('/host') || pathname.endsWith('/host/')) return true;
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
  if (hash === 'host' || hash === 'view=host') return true;
  return false;
}

function resolveInitialView(): ViewMode {
  if (typeof window === 'undefined') return 'board';
  if (checkHostInLocation()) {
    try {
      sessionStorage.setItem('cs_host_authorized', 'true');
    } catch {}
    return 'host';
  }
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view') as ViewMode;
  if (['board', 'fast-money', 'questions', 'buzzer'].includes(viewParam)) {
    return viewParam;
  }
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
  if (['board', 'fast-money', 'questions', 'buzzer'].includes(hash as ViewMode)) {
    return hash as ViewMode;
  }
  return 'board';
}

export function App() {
  const {
    state,
    revealAnswer,
    hideAnswer,
    revealAll,
    hideAll,
    addStrike,
    clearStrikes,
    awardBank,
    setRound,
    updateTeamName,
    updateTeamScore,
    setControllingTeam,
    triggerBuzzer,
    resetBuzzer,
    updateFastMoney,
    updateQuestions,
    resetGame,
    toggleSound,
  } = useGameState();

  const [currentView, setCurrentView] = useState<ViewMode>(resolveInitialView);

  const [isHostAuthorized, setIsHostAuthorized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (checkHostInLocation()) return true;
    try {
      return sessionStorage.getItem('cs_host_authorized') === 'true';
    } catch {
      return false;
    }
  });

  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Listen to popstate and hashchange for direct navigation (e.g. back/forward or typing ?view=host)
  useEffect(() => {
    const handleLocationChange = () => {
      if (checkHostInLocation()) {
        setIsHostAuthorized(true);
        try {
          sessionStorage.setItem('cs_host_authorized', 'true');
        } catch {}
        setCurrentView('host');
      } else {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view') as ViewMode;
        if (['board', 'host', 'fast-money', 'questions', 'buzzer'].includes(viewParam)) {
          setCurrentView(viewParam);
        } else {
          const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
          if (['board', 'host', 'fast-money', 'questions', 'buzzer'].includes(hash as ViewMode)) {
            setCurrentView(hash as ViewMode);
          }
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Update URL search param on view change for bookmarking / sharing
  const handleViewChange = (view: ViewMode) => {
    if (view === 'host') {
      setIsHostAuthorized(true);
      try {
        sessionStorage.setItem('cs_host_authorized', 'true');
      } catch {}
    }
    setCurrentView(view);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('view', view);
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className="h-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 overflow-hidden">
      
      {/* Top Navigation Bar */}
      <HeaderNav
        currentView={currentView}
        onViewChange={handleViewChange}
        state={state}
        onToggleSound={toggleSound}
        onResetGame={resetGame}
        onOpenRules={() => setIsRulesOpen(true)}
        isHostAuthorized={isHostAuthorized}
      />

      {/* Main View Area */}
      <main className={`flex-1 flex flex-col ${currentView === 'board' ? 'overflow-hidden' : 'overflow-y-auto'} pb-16 md:pb-0`}>
        {currentView === 'board' && (
          <GameBoard
            state={state}
            onRevealAnswer={revealAnswer}
            onHideAnswer={hideAnswer}
            onAddStrike={addStrike}
            onAwardBank={awardBank}
            onSetRound={setRound}
            onViewChange={handleViewChange}
          />
        )}

        {currentView === 'host' && (
          <HostControlPanel
            state={state}
            onRevealAnswer={revealAnswer}
            onHideAnswer={hideAnswer}
            onRevealAll={revealAll}
            onHideAll={hideAll}
            onAddStrike={addStrike}
            onClearStrikes={clearStrikes}
            onAwardBank={awardBank}
            onSetRound={setRound}
            onUpdateTeamName={updateTeamName}
            onUpdateTeamScore={updateTeamScore}
            onSetControllingTeam={setControllingTeam}
            onViewChange={handleViewChange}
          />
        )}


        {currentView === 'fast-money' && (
          <FastMoneyRound
            fastMoney={state.fastMoney}
            onUpdateFastMoney={updateFastMoney}
          />
        )}

        {currentView === 'buzzer' && (
          <BuzzerModal
            state={state}
            onTriggerBuzzer={triggerBuzzer}
            onResetBuzzer={resetBuzzer}
          />
        )}

        {currentView === 'questions' && (
          <QuestionManager
            questions={state.questions}
            fastMoneyQuestions={state.fastMoney.questions}
            onSaveQuestions={(newQ, newFM) => {
              updateQuestions(newQ, newFM);
            }}
          />
        )}
      </main>

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

    </div>
  );
}

export default App;
