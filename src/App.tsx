import { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import type { ViewMode } from './types/game';

import { HeaderNav } from './components/HeaderNav';
import { GameBoard } from './components/GameBoard';
import { HostControlPanel } from './components/HostControlPanel';
import { FastMoneyRound } from './components/FastMoneyRound';
import { QuestionManager } from './components/QuestionManager';
import { BuzzerModal } from './components/BuzzerModal';
import { RulesModal } from './components/RulesModal';

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

  // Initialize view from URL param if available (e.g. ?view=host or ?view=board)
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') as ViewMode;
      if (['board', 'host', 'fast-money', 'questions', 'buzzer'].includes(viewParam)) {
        return viewParam;
      }
    }
    return 'board';
  });

  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Update URL search param on view change for bookmarking / sharing
  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('view', view);
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navigation Bar */}
      <HeaderNav
        currentView={currentView}
        onViewChange={handleViewChange}
        state={state}
        onToggleSound={toggleSound}
        onResetGame={resetGame}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {currentView === 'board' && (
          <GameBoard
            state={state}
            onRevealAnswer={revealAnswer}
            onHideAnswer={hideAnswer}
            onAddStrike={addStrike}
            onAwardBank={awardBank}
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
