import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState, ViewMode } from '../types/game';
import { X, Shield, Mic, CheckCircle2, XCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { matchAnswer } from '../utils/answerMatcher';
import { ChungSucLogo } from './ChungSucLogo';

interface GameBoardProps {
  state: GameState;
  onRevealAnswer: (id: string) => void;
  onHideAnswer: (id: string) => void;
  onAddStrike: (count?: number) => void;
  onAwardBank: (team: 'teamA' | 'teamB') => void;
  onSetRound?: (index: number) => void;
  onViewChange?: (view: ViewMode) => void;
  isHostControlled?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  onRevealAnswer,
  onHideAnswer,
  onAddStrike,
  onAwardBank,
  onSetRound,
  onViewChange,
}) => {
  const [voiceToast, setVoiceToast] = useState<{
    type: 'success' | 'error' | 'warning';

    title: string;
    detail: string;
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const currentQuestion = state.questions[state.currentRoundIndex];
  const multiplier = currentQuestion?.multiplier || 1;

  const showToast = useCallback((toast: { type: 'success' | 'error' | 'warning'; title: string; detail: string }) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setVoiceToast(toast);
    toastTimerRef.current = window.setTimeout(() => {
      setVoiceToast(null);
    }, 3500);
  }, []);

  // Speech Recognition for GameBoard
  const {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: 'vi-VN',
    continuous: true,
    interimResults: true,
    silenceTimeoutMs: 1100,
    onResult: (text, isFinal) => {
      if (isFinal && text && currentQuestion) {
        const result = matchAnswer(text, currentQuestion.answers, state.revealedAnswers);
        if (result.status === 'MATCH_NEW' && result.matchedAnswer) {
          onRevealAnswer(result.matchedAnswer.id);
          showToast({
            type: 'success',
            title: `CHÍNH XÁC: "${result.matchedAnswer.text}"`,
            detail: `+${result.matchedAnswer.points * multiplier} điểm`,
          });
        } else if (result.status === 'NO_MATCH') {
          onAddStrike(1);
          showToast({
            type: 'error',
            title: `SAI: "${text}"`,
            detail: `Không có trong bảng (+1 Dấu X)`,
          });
        } else if (result.status === 'MATCH_ALREADY_REVEALED' && result.matchedAnswer) {
          showToast({
            type: 'warning',
            title: `ĐÃ LẬT RỒI: "${result.matchedAnswer.text}"`,
            detail: `Vui lòng nêu đáp án khác`,
          });
        }
        stopListening();
      }
    },
  });

  const handleToggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
      setVoiceToast(null);
    } else {
      setVoiceToast(null);
      resetTranscript();
      startListening('vi-VN');
    }
  }, [isListening, stopListening, resetTranscript, startListening]);

  // Keyboard shortcut listener for seamless single-screen play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Space key for voice recognition toggle
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleToggleVoice();
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

      // 'n' key for next round
      if (key === 'n' && onSetRound) {
        if (state.currentRoundIndex < state.questions.length - 1) {
          onSetRound(state.currentRoundIndex + 1);
        } else if (onViewChange) {
          onViewChange('fast-money');
        }
      }

      // 'p' key for previous round
      if (key === 'p' && onSetRound && state.currentRoundIndex > 0) {
        onSetRound(state.currentRoundIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, state.revealedAnswers, state.currentRoundIndex, state.questions.length, onRevealAnswer, onHideAnswer, onAddStrike, onSetRound, onViewChange, handleToggleVoice]);


  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md flex flex-col items-center">
          <ChungSucLogo variant="icon" size="lg" className="mb-4" />
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
    <div className="relative h-full flex-1 bg-radial from-slate-900 via-slate-950 to-black p-2 sm:p-3 md:p-4 flex flex-col justify-between overflow-hidden">
      
      {/* Background Decorative TV Studio Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Banner (Desktop Version - md+) */}
      <div className="hidden md:block relative z-10 max-w-7xl mx-auto w-full mb-1.5 shrink-0">
        <div className="flex items-center justify-between gap-3 lg:gap-4">
          
          {/* Team A Score Box */}
          <div 
            onClick={() => onAwardBank('teamA')}
            title="Bấm để cộng điểm tích lũy vòng cho Đội A"
            className={`w-52 lg:w-60 p-2 lg:p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
              state.controllingTeam === 'teamA'
                ? 'bg-red-950/80 border-red-500 shadow-lg shadow-red-500/30 ring-2 ring-red-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-red-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-xs lg:text-sm tracking-wide text-red-400 truncate max-w-[120px]">
                  {state.teams.teamA.name}
                </span>
              </div>
              {state.controllingTeam === 'teamA' && (
                <span className="text-[9px] bg-red-500/20 text-red-300 px-1 py-0.5 rounded flex items-center gap-0.5 font-semibold">
                  <Shield className="w-2.5 h-2.5" /> Quyền
                </span>
              )}
            </div>
            <div className="bg-slate-950/90 rounded-lg py-1 px-3 border border-slate-800 text-center">
              <span className="font-mono font-black text-2xl lg:text-3xl xl:text-4xl text-red-400 tracking-wider">
                {state.teams.teamA.score}
              </span>
            </div>
          </div>

          {/* Center: Chung Sức Logo, Round Bank & Multiplier */}
          <div className="flex flex-col items-center">
            {/* Chung Sức Show Logo */}
            <div className="mb-1 transition-transform hover:scale-105">
              <ChungSucLogo variant="full" size="xs" animated={true} />
            </div>

            {/* Round info & switcher */}
            <div className="flex items-center gap-1.5 mb-1">
              {onSetRound && (
                <button
                  onClick={() => onSetRound(state.currentRoundIndex - 1)}
                  disabled={state.currentRoundIndex === 0}
                  className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 transition"
                  title="Vòng trước (Phím P)"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
              )}

              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                Vòng {state.currentRoundIndex + 1} / {state.questions.length}
              </span>

              {multiplier > 1 && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 text-[10px] font-black uppercase tracking-wider animate-bounce">
                  x{multiplier}
                </span>
              )}

              {onSetRound && (
                <button
                  onClick={() => {
                    if (state.currentRoundIndex < state.questions.length - 1) {
                      onSetRound(state.currentRoundIndex + 1);
                    } else if (onViewChange) {
                      onViewChange('fast-money');
                    }
                  }}
                  className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
                  title={state.currentRoundIndex < state.questions.length - 1 ? "Vòng tiếp theo (Phím N)" : "Vào Vòng Đặc Biệt (Phím N)"}
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Round Bank Board */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 py-1 px-3 md:py-1.5 md:px-4 rounded-xl border-2 border-amber-500/60 glow-gold shadow-xl min-w-[150px] md:min-w-[180px] text-center">
              <p className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold">
                Điểm Tích Lũy Vòng
              </p>
              <div className="font-mono font-black text-2xl lg:text-3xl xl:text-4xl text-yellow-300 tracking-wider drop-shadow-[0_0_12px_rgba(253,224,71,0.5)] leading-tight">
                {state.roundBank}
              </div>
            </div>

            {/* Strike Indicators */}
            <div className="flex items-center gap-1.5 mt-1">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-6 h-6 rounded-md flex items-center justify-center border font-black text-xs transition-all ${
                    state.strikes >= num
                      ? 'bg-red-600 border-red-400 text-white glow-red shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-700'
                  }`}
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ))}
            </div>
          </div>

          {/* Team B Score Box */}
          <div 
            onClick={() => onAwardBank('teamB')}
            title="Bấm để cộng điểm tích lũy vòng cho Đội B"
            className={`w-52 lg:w-60 p-2 lg:p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
              state.controllingTeam === 'teamB'
                ? 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-bold text-xs lg:text-sm tracking-wide text-blue-400 truncate max-w-[120px]">
                  {state.teams.teamB.name}
                </span>
              </div>
              {state.controllingTeam === 'teamB' && (
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded flex items-center gap-0.5 font-semibold">
                  <Shield className="w-2.5 h-2.5" /> Quyền
                </span>
              )}
            </div>
            <div className="bg-slate-950/90 rounded-lg py-1 px-3 border border-slate-800 text-center">
              <span className="font-mono font-black text-2xl lg:text-3xl xl:text-4xl text-blue-400 tracking-wider">
                {state.teams.teamB.score}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Top Banner (Mobile Dedicated 3-Column Scoreboard - < md) */}
      <div className="md:hidden relative z-10 w-full mb-1.5 bg-slate-950/90 border border-slate-800 rounded-xl p-1.5 shadow-lg backdrop-blur shrink-0">
        <div className="grid grid-cols-12 gap-1 items-center">
          
          {/* Team A (Col 1-4) */}
          <div 
            onClick={() => onAwardBank('teamA')}
            className={`col-span-4 p-1.5 rounded-lg border text-center transition-all cursor-pointer select-none active:scale-95 ${
              state.controllingTeam === 'teamA'
                ? 'bg-red-950/90 border-red-500 shadow-md shadow-red-500/20 ring-1 ring-red-400'
                : 'bg-slate-900/80 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="font-bold text-[11px] text-red-300 truncate max-w-[70px]">
                {state.teams.teamA.name}
              </span>
            </div>
            <div className="font-mono font-black text-xl text-red-400 leading-none">
              {state.teams.teamA.score}
            </div>
            {state.controllingTeam === 'teamA' && (
              <span className="inline-block mt-0.5 text-[8px] bg-red-500/30 text-red-200 px-1 rounded font-bold">
                Quyền
              </span>
            )}
          </div>

          {/* Center Info: Bank, Multiplier & Strikes (Col 5-8) */}
          <div className="col-span-4 flex flex-col items-center justify-center text-center px-1">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="text-[9px] font-extrabold text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30">
                V{state.currentRoundIndex + 1}
              </span>
              {multiplier > 1 && (
                <span className="text-[8px] font-black text-slate-950 bg-amber-400 px-1 rounded animate-pulse">
                  x{multiplier}
                </span>
              )}
            </div>

            {/* Round Bank */}
            <div className="font-mono font-black text-xl text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)] leading-tight">
              {state.roundBank}
            </div>

            {/* Strikes */}
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-4 h-4 rounded flex items-center justify-center border font-black text-[10px] transition-all ${
                    state.strikes >= num
                      ? 'bg-red-600 border-red-400 text-white glow-red shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-700'
                  }`}
                >
                  <X className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ))}
            </div>
          </div>

          {/* Team B (Col 9-12) */}
          <div 
            onClick={() => onAwardBank('teamB')}
            className={`col-span-4 p-1.5 rounded-lg border text-center transition-all cursor-pointer select-none active:scale-95 ${
              state.controllingTeam === 'teamB'
                ? 'bg-blue-950/90 border-blue-500 shadow-md shadow-blue-500/20 ring-1 ring-blue-400'
                : 'bg-slate-900/80 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-bold text-[11px] text-blue-300 truncate max-w-[70px]">
                {state.teams.teamB.name}
              </span>
            </div>
            <div className="font-mono font-black text-xl text-blue-400 leading-none">
              {state.teams.teamB.score}
            </div>
            {state.controllingTeam === 'teamB' && (
              <span className="inline-block mt-0.5 text-[8px] bg-blue-500/30 text-blue-200 px-1 rounded font-bold">
                Quyền
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Main Question Display Banner */}
      <div className="relative z-10 max-w-7xl mx-auto w-full my-1 shrink-0">
        <div className="bg-gradient-to-r from-blue-950/90 via-slate-900/90 to-blue-950/90 border border-blue-500/30 rounded-xl p-2 sm:p-2.5 md:p-3 text-center shadow-lg backdrop-blur">
          {currentQuestion.category && (
            <span className="inline-block text-[9px] sm:text-[10px] md:text-xs font-semibold text-amber-400/90 uppercase tracking-widest mb-0.5">
              Chủ đề: {currentQuestion.category}
            </span>
          )}
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-extrabold text-slate-100 tracking-wide leading-snug">
            "{currentQuestion.question}"
          </h2>
        </div>
      </div>

      {/* 8-Tile Answer Board (Responsive 2-Column x 4-Row Grid, dynamically fills remaining screen height) */}
      <div className="relative z-10 max-w-7xl mx-auto w-full my-auto py-1 flex-1 flex flex-col justify-center min-h-0">
        <div className="grid grid-cols-2 grid-rows-4 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 w-full h-full min-h-0">
          {slots.map((answer, index) => {
            if (!answer) {
              // Empty inactive slot
              return (
                <div
                  key={`empty-${index}`}
                  className="w-full h-full min-h-[38px] sm:min-h-[46px] md:min-h-[52px] rounded-xl bg-slate-950/40 border border-slate-900 flex items-center justify-center opacity-30"
                >
                  <span className="text-slate-700 font-mono text-sm sm:text-base md:text-lg lg:text-xl font-bold">{index + 1}</span>
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
                className="perspective-1000 w-full h-full min-h-[38px] sm:min-h-[46px] md:min-h-[52px] cursor-pointer select-none group relative block"
              >
                <div
                  className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${
                    isRevealed ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Front: Hidden Tile with Number */}
                  <div className="absolute top-0 left-0 w-full h-full backface-hidden rounded-xl bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950 border-2 border-blue-500/40 group-hover:border-amber-400/70 shadow-lg flex items-center justify-center px-3 sm:px-5 transition-all">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full bg-blue-950 border-2 border-blue-400/50 group-hover:border-amber-400 group-hover:bg-amber-500/20 flex items-center justify-center shadow-inner transition-colors">
                      <span className="font-mono font-black text-base sm:text-lg md:text-xl lg:text-2xl text-blue-300 group-hover:text-amber-300">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Back: Revealed Answer and Points */}
                  <div className="absolute top-0 left-0 w-full h-full backface-hidden rotate-y-180 rounded-xl bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border-2 border-amber-400 glow-gold shadow-xl flex items-center justify-between px-2.5 sm:px-3 md:px-5 lg:px-6 overflow-hidden">
                    {/* Left: Answer Text */}
                    <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1 mr-2">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] sm:text-xs md:text-sm flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-slate-100 tracking-wide uppercase truncate">
                        {answer.text}
                      </span>
                    </div>

                    {/* Right: Points Badge */}
                    <div className="bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-mono font-black text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl px-2 sm:px-3 md:px-4 py-0.5 sm:py-1 rounded-md sm:rounded-lg shrink-0 shadow-md">
                      {answer.points * multiplier}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Dedicated Quick Touch Toolbar (< md) */}
      <div className="md:hidden relative z-10 w-full mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between gap-1.5 shrink-0">
        {/* Prev Round */}
        {onSetRound && (
          <button
            onClick={() => onSetRound(state.currentRoundIndex - 1)}
            disabled={state.currentRoundIndex === 0}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-30 border border-slate-700 active:scale-95 transition"
            title="Vòng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Strike Button */}
        <button
          onClick={() => onAddStrike(1)}
          className="flex-1 py-2.5 px-2 bg-gradient-to-r from-red-600 to-red-700 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-red-600/30 transition border border-red-400/50"
        >
          <X className="w-4 h-4 stroke-[3]" />
          <span>+1X (Sai)</span>
        </button>

        {/* Speech / Voice button */}
        <button
          onClick={handleToggleVoice}
          className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition active:scale-95 shadow-md ${
            isListening
              ? 'bg-red-600 text-white border border-red-400 shadow-red-600/40 animate-pulse'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-400/50'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>{isListening ? 'Đang nghe' : 'Micro'}</span>
        </button>

        {/* Next Round */}
        {onSetRound && (
          <button
            onClick={() => {
              if (state.currentRoundIndex < state.questions.length - 1) {
                onSetRound(state.currentRoundIndex + 1);
              } else if (onViewChange) {
                onViewChange('fast-money');
              }
            }}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 active:scale-95 transition"
            title="Vòng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Desktop Footer Quick Controls / Shortcut Hints (md+) */}
      <div className="hidden md:flex relative z-10 max-w-4xl mx-auto w-full mt-2 pt-2 border-t border-slate-900 flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">1-8</kbd> Lật đáp án
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">X</kbd> Bấm sai (Strike)
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">N/P</kbd> Đổi vòng
          </span>
          <button
            onClick={handleToggleVoice}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition ${
              isListening
                ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
            }`}
            title="Bấm hoặc nhấn phím Space để nghe người chơi đọc đáp án"
          >
            <Mic className="w-3.5 h-3.5" />
            <kbd className="px-1.5 py-0.5 bg-slate-900/80 rounded border border-slate-700 text-[10px] font-mono">Space</kbd>
            <span>{isListening ? 'Đang nghe...' : 'Giọng nói'}</span>
          </button>
        </div>
        <div className="text-slate-400">
          Tip: Bấm trực tiếp vào ô để lật, hoặc bấm <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">Space</kbd> để đọc câu trả lời!
        </div>
      </div>

      {/* Floating Real-time Voice Listening Indicator (No Popup) */}
      {isListening && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-indigo-500/80 rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-3 backdrop-blur animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <Mic className="w-4 h-4 text-indigo-400" />
          <span className="text-xs md:text-sm font-bold text-white max-w-xs md:max-w-md truncate">
            {interimTranscript || transcript || 'Đang lắng nghe câu trả lời... (Nói vào micro)'}
          </span>
          {audioLevel > 5 && (
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
              {audioLevel}%
            </span>
          )}
          <button
            onClick={handleToggleVoice}
            className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 font-semibold ml-1 shrink-0"
          >
            Dừng (Space)
          </button>
        </div>
      )}

      {/* Voice Answer Result Toast (No Popup) */}
      {voiceToast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur border flex items-center gap-3 animate-bounce transition-all ${
          voiceToast.type === 'success'
            ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200 shadow-emerald-500/20'
            : voiceToast.type === 'error'
            ? 'bg-red-950/95 border-red-500 text-red-200 shadow-red-500/20'
            : 'bg-amber-950/95 border-amber-500 text-amber-200 shadow-amber-500/20'
        }`}>
          {voiceToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {voiceToast.type === 'error' && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
          {voiceToast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          <div>
            <p className="text-xs md:text-sm font-extrabold text-white">{voiceToast.title}</p>
            <p className="text-[11px] opacity-80">{voiceToast.detail}</p>
          </div>
        </div>
      )}

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
