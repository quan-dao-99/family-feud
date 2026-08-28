import { useEffect, useState } from 'react';
import type { GameState } from '../types/game';
import { Bell, RotateCcw, Trophy } from 'lucide-react';
import { ChungSucLogo } from './ChungSucLogo';

interface BuzzerModalProps {
  state: GameState;
  onTriggerBuzzer: (team: 'teamA' | 'teamB') => void;
  onResetBuzzer: () => void;
}

export const BuzzerModal: React.FC<BuzzerModalProps> = ({
  state,
  onTriggerBuzzer,
  onResetBuzzer,
}) => {
  const [buzzerTime, setBuzzerTime] = useState<string | null>(null);

  // Keyboard shortcut listener for buzzers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      
      // Team A keys: 'a' or 'z'
      if ((key === 'a' || key === 'z') && !state.buzzerLocked) {
        setBuzzerTime(new Date().toLocaleTimeString('vi-VN', { hour12: false, minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }));
        onTriggerBuzzer('teamA');
      }

      // Team B keys: 'l' or 'm' or 'enter'
      if ((key === 'l' || key === 'm' || key === 'enter') && !state.buzzerLocked) {
        setBuzzerTime(new Date().toLocaleTimeString('vi-VN', { hour12: false, minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }));
        onTriggerBuzzer('teamB');
      }

      // Spacebar to reset
      if (key === ' ' && state.buzzerLocked) {
        e.preventDefault();
        onResetBuzzer();
        setBuzzerTime(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.buzzerLocked, onTriggerBuzzer, onResetBuzzer]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* Header with Chung Suc Logo */}
      <div className="text-center space-y-3 flex flex-col items-center">
        <ChungSucLogo variant="full" size="sm" animated={true} className="mb-1" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
          <Bell className="w-4 h-4 animate-bounce" />
          <span>Tranh Quyền Bấm Chuông Đầu Vòng</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide">
          Ai Nhanh Tay Hơn?
        </h1>
        <p className="text-slate-400 text-sm">
          Đại diện 2 đội bấm nút trên màn hình hoặc phím tắt để tranh quyền trả lời đầu tiên!
        </p>
      </div>

      {/* Winner Banner */}
      {state.buzzerWinner && (
        <div className={`p-6 rounded-3xl border-2 text-center animate-strike ${
          state.buzzerWinner === 'teamA'
            ? 'bg-red-950/80 border-red-500 glow-red shadow-2xl'
            : 'bg-blue-950/80 border-blue-500 glow-blue shadow-2xl'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-7 h-7 text-yellow-400 animate-bounce" />
            <span className="text-sm font-bold uppercase tracking-widest text-amber-300">
              ĐÃ GIÀNH QUYỀN TRẢ LỜI!
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-wider">
            {state.teams[state.buzzerWinner].name}
          </h2>
          {buzzerTime && (
            <p className="text-xs text-slate-300 mt-2 font-mono">
              Thời điểm bấm: {buzzerTime}
            </p>
          )}
        </div>
      )}

      {/* 2 Big Buzzer Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Team A Buzzer */}
        <button
          onClick={() => {
            if (!state.buzzerLocked) {
              setBuzzerTime(new Date().toLocaleTimeString('vi-VN', { hour12: false, minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }));
              onTriggerBuzzer('teamA');
            }
          }}
          disabled={state.buzzerLocked && state.buzzerWinner !== 'teamA'}
          className={`h-64 rounded-3xl p-6 flex flex-col items-center justify-between border-4 transition-all select-none active:scale-95 ${
            state.buzzerWinner === 'teamA'
              ? 'bg-red-600 border-red-300 glow-red shadow-2xl scale-105'
              : state.buzzerLocked
              ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
              : 'bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border-red-400 shadow-xl shadow-red-600/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-white animate-ping" />
            <span className="font-extrabold text-white text-xl uppercase tracking-wider">
              {state.teams.teamA.name}
            </span>
          </div>

          <div className="w-24 h-24 rounded-full bg-red-950/60 border-4 border-red-300 flex items-center justify-center shadow-inner">
            <Bell className="w-12 h-12 text-white stroke-[2.5]" />
          </div>

          <div className="text-center">
            <span className="text-xs font-mono font-bold text-red-200 bg-red-950/80 px-3 py-1 rounded-full border border-red-400/40">
              Phím tắt: [ A ] hoặc [ Z ]
            </span>
          </div>
        </button>

        {/* Team B Buzzer */}
        <button
          onClick={() => {
            if (!state.buzzerLocked) {
              setBuzzerTime(new Date().toLocaleTimeString('vi-VN', { hour12: false, minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }));
              onTriggerBuzzer('teamB');
            }
          }}
          disabled={state.buzzerLocked && state.buzzerWinner !== 'teamB'}
          className={`h-64 rounded-3xl p-6 flex flex-col items-center justify-between border-4 transition-all select-none active:scale-95 ${
            state.buzzerWinner === 'teamB'
              ? 'bg-blue-600 border-blue-300 glow-blue shadow-2xl scale-105'
              : state.buzzerLocked
              ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
              : 'bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 border-blue-400 shadow-xl shadow-blue-600/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-white animate-ping" />
            <span className="font-extrabold text-white text-xl uppercase tracking-wider">
              {state.teams.teamB.name}
            </span>
          </div>

          <div className="w-24 h-24 rounded-full bg-blue-950/60 border-4 border-blue-300 flex items-center justify-center shadow-inner">
            <Bell className="w-12 h-12 text-white stroke-[2.5]" />
          </div>

          <div className="text-center">
            <span className="text-xs font-mono font-bold text-blue-200 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-400/40">
              Phím tắt: [ L ] hoặc [ M ]
            </span>
          </div>
        </button>

      </div>

      {/* Reset Action */}
      <div className="flex items-center justify-center pt-4">
        <button
          onClick={() => {
            onResetBuzzer();
            setBuzzerTime(null);
          }}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-sm font-bold border border-slate-700 flex items-center gap-2 shadow-lg transition active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Đặt Lại Chuông Bấm (Phím Space)</span>
        </button>
      </div>

    </div>
  );
};
