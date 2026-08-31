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
import { TeamBuzzerSite } from './components/TeamBuzzerSite';
import { BuzzerQrModal } from './components/BuzzerQrModal';

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

  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  if (pathname === '/team-a' || pathname.endsWith('/team-a') || pathname === '/teama') return 'buzzer-a';
  if (pathname === '/team-b' || pathname.endsWith('/team-b') || pathname === '/teamb') return 'buzzer-b';
  if (pathname.includes('/buzzer-a') || pathname.includes('/buzzer/a')) return 'buzzer-a';
  if (pathname.includes('/buzzer-b') || pathname.includes('/buzzer/b')) return 'buzzer-b';

  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view')?.toLowerCase();
  if (viewParam === 'team-a' || viewParam === 'buzzer-a') return 'buzzer-a';
  if (viewParam === 'team-b' || viewParam === 'buzzer-b') return 'buzzer-b';
  if (['board', 'host', 'fast-money', 'questions', 'buzzer', 'buzzer-a', 'buzzer-b'].includes(viewParam as ViewMode)) {
    return viewParam as ViewMode;
  }
  const buzzerParam = params.get('buzzer')?.toLowerCase();
  const teamParam = params.get('team')?.toLowerCase();
  if (buzzerParam === 'a' || buzzerParam === 'teama' || teamParam === 'a' || teamParam === 'teama' || teamParam === 'team-a') {
    return 'buzzer-a';
  }
  if (buzzerParam === 'b' || buzzerParam === 'teamb' || teamParam === 'b' || teamParam === 'teamb' || teamParam === 'team-b') {
    return 'buzzer-b';
  }

  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
  if (hash === 'team-a' || hash === 'teama' || hash === 'buzzer-a' || hash === 'buzzer/a') return 'buzzer-a';
  if (hash === 'team-b' || hash === 'teamb' || hash === 'buzzer-b' || hash === 'buzzer/b') return 'buzzer-b';
  if (['board', 'host', 'fast-money', 'questions', 'buzzer'].includes(hash as ViewMode)) {
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
    triggerFaceOffBuzzer,
    processFaceOffAnswer,
    resetFaceOff,
    skipFaceOff,
    playRoundStart,
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
  const [isBuzzerQrOpen, setIsBuzzerQrOpen] = useState(false);

  // Listen to popstate and hashchange for direct navigation (e.g. back/forward or typing ?view=buzzer-a)
  useEffect(() => {
    const handleLocationChange = () => {
      if (checkHostInLocation()) {
        setIsHostAuthorized(true);
        try {
          sessionStorage.setItem('cs_host_authorized', 'true');
        } catch {}
        setCurrentView('host');
      } else {
        const nextView = resolveInitialView();
        setCurrentView(nextView);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Update URL on view change for bookmarking / sharing
  const handleViewChange = (view: ViewMode) => {
    if (view === 'host') {
      setIsHostAuthorized(true);
      try {
        sessionStorage.setItem('cs_host_authorized', 'true');
      } catch {}
    }
    setCurrentView(view);
    if (typeof window !== 'undefined' && window.history) {
      if (view === 'buzzer-a') {
        window.history.replaceState({}, '', '/team-a');
      } else if (view === 'buzzer-b') {
        window.history.replaceState({}, '', '/team-b');
      } else if (view === 'board') {
        window.history.replaceState({}, '', '/');
      } else {
        const url = new URL(window.location.href);
        url.pathname = '/';
        url.searchParams.set('view', view);
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  // Dedicated standalone mobile buzzer site for Team A
  if (currentView === 'buzzer-a') {
    return (
      <TeamBuzzerSite
        teamId="teamA"
        state={state}
        onTriggerBuzzer={triggerBuzzer}
        onResetBuzzer={resetBuzzer}
        onTriggerFaceOffBuzzer={triggerFaceOffBuzzer}
        onViewChange={handleViewChange}
        onToggleSound={toggleSound}
      />
    );
  }

  // Dedicated standalone mobile buzzer site for Team B
  if (currentView === 'buzzer-b') {
    return (
      <TeamBuzzerSite
        teamId="teamB"
        state={state}
        onTriggerBuzzer={triggerBuzzer}
        onResetBuzzer={resetBuzzer}
        onTriggerFaceOffBuzzer={triggerFaceOffBuzzer}
        onViewChange={handleViewChange}
        onToggleSound={toggleSound}
      />
    );
  }

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
        onOpenBuzzerQr={() => setIsBuzzerQrOpen(true)}
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
            onTriggerFaceOffBuzzer={triggerFaceOffBuzzer}
            onProcessFaceOffAnswer={processFaceOffAnswer}
            onResetFaceOff={resetFaceOff}
            onSkipFaceOff={skipFaceOff}
            onOpenBuzzerQr={() => setIsBuzzerQrOpen(true)}
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
            onTriggerFaceOffBuzzer={triggerFaceOffBuzzer}
            onProcessFaceOffAnswer={processFaceOffAnswer}
            onResetFaceOff={resetFaceOff}
            onSkipFaceOff={skipFaceOff}
            onPlayRoundStart={playRoundStart}
            onOpenBuzzerQr={() => setIsBuzzerQrOpen(true)}
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
            onTriggerFaceOffBuzzer={triggerFaceOffBuzzer}
            onOpenBuzzerQr={() => setIsBuzzerQrOpen(true)}
            onViewChange={handleViewChange}
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

      {/* Buzzer QR Code Modal */}
      <BuzzerQrModal
        isOpen={isBuzzerQrOpen}
        onClose={() => setIsBuzzerQrOpen(false)}
        state={state}
      />

    </div>
  );
}

export default App;
