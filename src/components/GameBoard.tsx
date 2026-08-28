import { useEffect } from 'react';
import type { GameState } from '../types/game';
import { X, Shield } from 'lucide-react';


interface GameBoardProps {
  state: GameState;
  onRevealAnswer: (id: string) => void;
  onHideAnswer: (id: string) => void;
  onAddStrike: (count?: number) => void;
  onAwardBank: (team: 'teamA' | 'teamB') => void;
  isHostControlled?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  onRevealAnswer,
  onHideAnswer,
  onAddStrike,
  onAwardBank,
}) => {
  const currentQuestion = state.questions[state.currentRoundIndex];
  const multiplier = currentQuestion?.multiplier || 1;

  // Keyboard shortcut listener for seamless single-screen play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key.toLowerCase();
      // Numbers 1-8 to toggle answers
      if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(key)) {
        const index = parseInt(key, 10) - 1;
        if (currentQuestion && currentQuestion.answers[index]) {
          const ans = currentQuestion.answers[index];
          if (state.revealedAnswers.includes(ans.id)) {
            onHideAnswer(ans.id);
          } else {
            onRevealAnswer(ans.id);
          }
        }
      }

      // 'x' key for strike
      if (key === 'x') {
        onAddStrike(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, state.revealedAnswers, onRevealAnswer, onHideAnswer, onAddStrike]);

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md">
          <p className="text-xl font-bold text-amber-400 mb-2">Chưa có câu hỏi nào!</p>
          <p className="text-slate-400 text-sm">Vui lòng vào tab "Quản Lý Câu Hỏi" để thêm câu hỏi cho chương trình.</p>
        </div>
      </div>
    );
  }

  // Ensure up to 8 tiles layout (Family Feud standard board)
  const totalSlots = Math.max(6, Math.min(8, Math.ceil(currentQuestion.answers.length / 2) * 2));
  const slots = Array.from({ length: totalSlots }).map((_, i) => currentQuestion.answers[i] || null);

  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-radial from-slate-900 via-slate-950 to-black p-4 md:p-6 flex flex-col justify-between overflow-hidden">
      
      {/* Background Decorative TV Studio Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Banner: Round Multiplier & Round Bank */}
      <div className="relative z-10 max-w-6xl mx-auto w-full mb-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Team A Score Box */}
          <div 
            onClick={() => onAwardBank('teamA')}
            title="Bấm để cộng điểm tích lũy vòng cho Đội A"
            className={`w-full md:w-64 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
              state.controllingTeam === 'teamA'
                ? 'bg-red-950/80 border-red-500 shadow-lg shadow-red-500/30 ring-2 ring-red-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-red-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-sm tracking-wide text-red-400 truncate max-w-[120px]">
                  {state.teams.teamA.name}
                </span>
              </div>
              {state.controllingTeam === 'teamA' && (
                <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                  <Shield className="w-3 h-3" /> Quyền chơi
                </span>
              )}
            </div>
            <div className="bg-slate-950/90 rounded-xl py-2 px-4 border border-slate-800 text-center">
              <span className="font-mono font-black text-3xl md:text-4xl text-red-400 tracking-wider">
                {state.teams.teamA.score}
              </span>
            </div>
          </div>

          {/* Center: Round Bank & Multiplier */}
          <div className="flex flex-col items-center">
            {/* Round info */}
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                Vòng {state.currentRoundIndex + 1}
              </span>
              {multiplier > 1 && (
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 text-xs font-black uppercase tracking-wider animate-bounce">
                  Điểm x{multiplier}
                </span>
              )}
            </div>

            {/* Round Bank Board */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-2 md:p-3 rounded-2xl border-2 border-amber-500/60 glow-gold shadow-2xl min-w-[180px] md:min-w-[220px] text-center">
              <p className="text-[11px] uppercase tracking-widest text-amber-300/80 font-bold mb-0.5">
                Điểm Tích Lũy Vòng
              </p>
              <div className="font-mono font-black text-4xl md:text-5xl text-yellow-300 tracking-wider drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]">
                {state.roundBank}
              </div>
            </div>

            {/* Strike Indicators */}
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border font-black text-sm transition-all ${
                    state.strikes >= num
                      ? 'bg-red-600 border-red-400 text-white glow-red shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 text-slate-700'
                  }`}
                >
                  <X className="w-4 h-4 stroke-[3]" />
                </div>
              ))}
            </div>
          </div>

          {/* Team B Score Box */}
          <div 
            onClick={() => onAwardBank('teamB')}
            title="Bấm để cộng điểm tích lũy vòng cho Đội B"
            className={`w-full md:w-64 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
              state.controllingTeam === 'teamB'
                ? 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-bold text-sm tracking-wide text-blue-400 truncate max-w-[120px]">
                  {state.teams.teamB.name}
                </span>
              </div>
              {state.controllingTeam === 'teamB' && (
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                  <Shield className="w-3 h-3" /> Quyền chơi
                </span>
              )}
            </div>
            <div className="bg-slate-950/90 rounded-xl py-2 px-4 border border-slate-800 text-center">
              <span className="font-mono font-black text-3xl md:text-4xl text-blue-400 tracking-wider">
                {state.teams.teamB.score}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Question Display Banner */}
      <div className="relative z-10 max-w-5xl mx-auto w-full my-2">
        <div className="bg-gradient-to-r from-blue-950/90 via-slate-900/90 to-blue-950/90 border border-blue-500/30 rounded-2xl p-4 text-center shadow-xl backdrop-blur">
          {currentQuestion.category && (
            <span className="inline-block text-xs font-semibold text-amber-400/90 uppercase tracking-widest mb-1">
              Chủ đề: {currentQuestion.category}
            </span>
          )}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-wide leading-snug">
            "{currentQuestion.question}"
          </h2>
        </div>
      </div>

      {/* 8-Tile Answer Board */}
      <div className="relative z-10 max-w-5xl mx-auto w-full my-auto py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {slots.map((answer, index) => {
            if (!answer) {
              // Empty inactive slot
              return (
                <div
                  key={`empty-${index}`}
                  className="h-16 md:h-20 rounded-xl bg-slate-950/40 border border-slate-900 flex items-center justify-center opacity-30"
                >
                  <span className="text-slate-700 font-mono text-lg font-bold">{index + 1}</span>
                </div>
              );
            }

            const isRevealed = state.revealedAnswers.includes(answer.id);

            return (
              <div
                key={answer.id}
                onClick={() => {
                  if (isRevealed) {
                    onHideAnswer(answer.id);
                  } else {
                    onRevealAnswer(answer.id);
                  }
                }}
                className="perspective-1000 h-16 md:h-20 cursor-pointer select-none group"
              >
                <div
                  className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${
                    isRevealed ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Front: Hidden Tile with Number */}
                  <div className="absolute inset-0 backface-hidden rounded-xl bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950 border-2 border-blue-500/40 group-hover:border-amber-400/70 shadow-lg flex items-center justify-center px-4 transition-all">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-950 border-2 border-blue-400/50 group-hover:border-amber-400 group-hover:bg-amber-500/20 flex items-center justify-center shadow-inner transition-colors">
                      <span className="font-mono font-black text-xl md:text-2xl text-blue-300 group-hover:text-amber-300">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Back: Revealed Answer and Points */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border-2 border-amber-400 glow-gold shadow-xl flex items-center justify-between px-3 md:px-5 overflow-hidden">
                    {/* Left: Answer Text */}
                    <div className="flex items-center space-x-2 md:space-x-3 truncate mr-2">
                      <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs md:text-sm flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-bold text-base md:text-xl lg:text-2xl text-slate-100 tracking-wide uppercase truncate">
                        {answer.text}
                      </span>
                    </div>

                    {/* Right: Points Badge */}
                    <div className="bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-mono font-black text-lg md:text-2xl px-3 md:px-4 py-1 rounded-lg shrink-0 shadow-md">
                      {answer.points * multiplier}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Quick Controls / Shortcut Hints */}
      <div className="relative z-10 max-w-4xl mx-auto w-full mt-2 pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">1-8</kbd> Lật đáp án
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">X</kbd> Bấm sai (Strike)
          </span>
        </div>
        <div className="text-slate-400">
          Tip: Bấm trực tiếp vào ô để lật, hoặc bấm vào điểm của đội để cộng điểm tích lũy!
        </div>
      </div>

      {/* Giant Strike Overlay Animation (X / XX / XXX) */}
      {state.strikeOverlay.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="animate-strike animate-shake flex items-center gap-4 md:gap-8 p-8 md:p-12 rounded-3xl bg-red-950/90 border-4 border-red-500 glow-red shadow-2xl">
            {Array.from({ length: state.strikeOverlay.count || 1 }).map((_, i) => (
              <X key={i} className="w-24 h-24 md:w-40 md:h-40 text-red-500 stroke-[4] drop-shadow-[0_0_25px_rgba(239,68,68,0.9)]" />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
