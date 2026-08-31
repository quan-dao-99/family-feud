import { useEffect, useState, useCallback } from 'react';
import type { GameState, ViewMode } from '../types/game';
import { Bell, RotateCcw, Trophy, Users, User, RotateCw, QrCode, Smartphone } from 'lucide-react';
import { ChungSucLogo } from './ChungSucLogo';

interface BuzzerModalProps {
  state: GameState;
  onTriggerBuzzer: (team: 'teamA' | 'teamB') => void;
  onResetBuzzer: () => void;
  onTriggerFaceOffBuzzer?: (team: 'teamA' | 'teamB') => void;
  onOpenBuzzerQr?: () => void;
  onViewChange?: (view: ViewMode) => void;
}

type BuzzerMode = 'split' | 'single-a' | 'single-b' | 'desktop';

export const BuzzerModal: React.FC<BuzzerModalProps> = ({
  state,
  onTriggerBuzzer,
  onResetBuzzer,
  onTriggerFaceOffBuzzer,
  onOpenBuzzerQr,
  onViewChange,
}) => {
  const [buzzerTime, setBuzzerTime] = useState<string | null>(null);
  const [mobileMode, setMobileMode] = useState<BuzzerMode>('split');
  const [flipTopPlayer, setFlipTopPlayer] = useState(true); // Rotate top player text 180deg for face-to-face table play

  const handleBuzz = useCallback((team: 'teamA' | 'teamB') => {
    if (!state.buzzerLocked) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      setBuzzerTime(new Date().toLocaleTimeString('vi-VN', { hour12: false, minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }));
      
      if (state.faceOff && state.faceOff.status === 'buzzer_waiting' && onTriggerFaceOffBuzzer) {
        onTriggerFaceOffBuzzer(team);
      } else {
        onTriggerBuzzer(team);
      }
    }
  }, [state.buzzerLocked, state.faceOff, onTriggerFaceOffBuzzer, onTriggerBuzzer]);

  // Keyboard shortcut listener for buzzers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      
      // Team A keys: 'a' or 'z'
      if ((key === 'a' || key === 'z') && !state.buzzerLocked) {
        handleBuzz('teamA');
      }

      // Team B keys: 'l' or 'm' or 'enter'
      if ((key === 'l' || key === 'm' || key === 'enter') && !state.buzzerLocked) {
        handleBuzz('teamB');
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
  }, [state.buzzerLocked, handleBuzz, onResetBuzzer]);

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      
      {/* Header with Chung Suc Logo */}
      <div className="text-center space-y-2 flex flex-col items-center">
        <ChungSucLogo variant="full" size="sm" animated={true} className="mb-0.5" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] sm:text-xs font-bold border border-emerald-500/30">
          <Bell className="w-3.5 h-3.5 animate-bounce" />
          <span>Tranh Quyền Bấm Chuông Đầu Vòng</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">
          Ai Nhanh Tay Hơn?
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {onOpenBuzzerQr && (
            <button
              onClick={onOpenBuzzerQr}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Quét Mã QR Chuông 2 Đội (Mở Camera Điện Thoại)</span>
            </button>
          )}

          {onViewChange && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onViewChange('buzzer-a')}
                className="px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 text-xs font-bold transition flex items-center gap-1"
                title="Mở toàn màn hình chuông Đội Đỏ"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Trang Chuông Đội Đỏ</span>
              </button>

              <button
                onClick={() => onViewChange('buzzer-b')}
                className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold transition flex items-center gap-1"
                title="Mở toàn màn hình chuông Đội Xanh"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Trang Chuông Đội Xanh</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Mode Switcher Selector */}
      <div className="flex items-center justify-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 max-w-md mx-auto text-xs font-bold">
        <button
          onClick={() => setMobileMode('split')}
          className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 ${
            mobileMode === 'split'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
          title="2 người ngồi đối diện nhau đặt điện thoại ở giữa"
        >
          <Users className="w-3.5 h-3.5" />
          <span>2 Đội / 1 Máy</span>
        </button>

        <button
          onClick={() => setMobileMode('single-a')}
          className={`py-1.5 px-2.5 rounded-xl transition flex items-center justify-center gap-1 ${
            mobileMode === 'single-a'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-red-300'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Remote Đỏ</span>
        </button>

        <button
          onClick={() => setMobileMode('single-b')}
          className={`py-1.5 px-2.5 rounded-xl transition flex items-center justify-center gap-1 ${
            mobileMode === 'single-b'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-blue-300'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Remote Xanh</span>
        </button>
      </div>

      {/* Winner Banner */}
      {state.buzzerWinner && (
        <div className={`p-4 sm:p-6 rounded-3xl border-2 text-center animate-strike ${
          state.buzzerWinner === 'teamA'
            ? 'bg-red-950/85 border-red-500 glow-red shadow-2xl'
            : 'bg-blue-950/85 border-blue-500 glow-blue shadow-2xl'
        }`}>
          <div className="flex items-center justify-center gap-1.5 mb-1 sm:mb-2">
            <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-400 animate-bounce" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-300">
              ĐÃ GIÀNH QUYỀN TRẢ LỜI!
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-wider">
            {state.teams[state.buzzerWinner].name}
          </h2>
          {buzzerTime && (
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5 font-mono">
              Thời điểm bấm: {buzzerTime}
            </p>
          )}
        </div>
      )}

      {/* Mode 1: Split Screen 2 Players on 1 Screen (Face to face) */}
      {mobileMode === 'split' && (
        <div className="space-y-3 pt-1">
          {/* Flip toggle for face-to-face player */}
          <div className="flex justify-end">
            <button
              onClick={() => setFlipTopPlayer(!flipTopPlayer)}
              className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800 transition"
            >
              <RotateCw className="w-3 h-3" />
              <span>{flipTopPlayer ? 'Đang xoay 180° người ngồi đối diện' : 'Xoay 180° người ngồi đối diện'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Team A Button (Top Half) */}
            <button
              onClick={() => handleBuzz('teamA')}
              disabled={state.buzzerLocked && state.buzzerWinner !== 'teamA'}
              className={`h-40 sm:h-56 rounded-3xl p-4 flex flex-col items-center justify-center border-4 transition-all select-none active:scale-[0.97] touch-manipulation ${
                flipTopPlayer ? 'rotate-180' : ''
              } ${
                state.buzzerWinner === 'teamA'
                  ? 'bg-red-600 border-red-300 glow-red shadow-2xl'
                  : state.buzzerLocked
                  ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
                  : 'bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border-red-400 shadow-xl shadow-red-600/30'
              }`}
            >
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-red-950/60 border-2 sm:border-4 border-red-300 flex items-center justify-center shadow-inner mb-2">
                <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[2.5]" />
              </div>
              <span className="font-black text-white text-lg sm:text-2xl uppercase tracking-wider">
                {state.teams.teamA.name}
              </span>
              <span className="text-[10px] text-red-200 font-mono mt-0.5">
                Bấm vào đây!
              </span>
            </button>

            {/* Team B Button (Bottom Half) */}
            <button
              onClick={() => handleBuzz('teamB')}
              disabled={state.buzzerLocked && state.buzzerWinner !== 'teamB'}
              className={`h-40 sm:h-56 rounded-3xl p-4 flex flex-col items-center justify-center border-4 transition-all select-none active:scale-[0.97] touch-manipulation ${
                state.buzzerWinner === 'teamB'
                  ? 'bg-blue-600 border-blue-300 glow-blue shadow-2xl'
                  : state.buzzerLocked
                  ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
                  : 'bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 border-blue-400 shadow-xl shadow-blue-600/30'
              }`}
            >
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-blue-950/60 border-2 sm:border-4 border-blue-300 flex items-center justify-center shadow-inner mb-2">
                <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[2.5]" />
              </div>
              <span className="font-black text-white text-lg sm:text-2xl uppercase tracking-wider">
                {state.teams.teamB.name}
              </span>
              <span className="text-[10px] text-blue-200 font-mono mt-0.5">
                Bấm vào đây!
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: Single Team Remote (Full Screen Team A) */}
      {mobileMode === 'single-a' && (
        <div className="pt-2">
          <button
            onClick={() => handleBuzz('teamA')}
            disabled={state.buzzerLocked && state.buzzerWinner !== 'teamA'}
            className={`w-full h-80 sm:h-96 rounded-3xl p-6 flex flex-col items-center justify-center border-4 transition-all select-none active:scale-[0.96] touch-manipulation ${
              state.buzzerWinner === 'teamA'
                ? 'bg-red-600 border-red-300 glow-red shadow-2xl'
                : state.buzzerLocked
                ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
                : 'bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border-red-400 shadow-2xl shadow-red-600/40'
            }`}
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-red-950/60 border-4 border-red-300 flex items-center justify-center shadow-inner mb-4 animate-pulse">
              <Bell className="w-14 h-14 sm:w-18 sm:h-18 text-white stroke-[2.5]" />
            </div>
            <h3 className="font-black text-white text-2xl sm:text-4xl uppercase tracking-wider">
              {state.teams.teamA.name}
            </h3>
            <p className="text-xs sm:text-sm text-red-200 mt-2 font-bold">
              Chạm bất kỳ đâu trên nút này để BẤM CHUÔNG!
            </p>
          </button>
        </div>
      )}

      {/* Mode 3: Single Team Remote (Full Screen Team B) */}
      {mobileMode === 'single-b' && (
        <div className="pt-2">
          <button
            onClick={() => handleBuzz('teamB')}
            disabled={state.buzzerLocked && state.buzzerWinner !== 'teamB'}
            className={`w-full h-80 sm:h-96 rounded-3xl p-6 flex flex-col items-center justify-center border-4 transition-all select-none active:scale-[0.96] touch-manipulation ${
              state.buzzerWinner === 'teamB'
                ? 'bg-blue-600 border-blue-300 glow-blue shadow-2xl'
                : state.buzzerLocked
                ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
                : 'bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 border-blue-400 shadow-2xl shadow-blue-600/40'
            }`}
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-blue-950/60 border-4 border-blue-300 flex items-center justify-center shadow-inner mb-4 animate-pulse">
              <Bell className="w-14 h-14 sm:w-18 sm:h-18 text-white stroke-[2.5]" />
            </div>
            <h3 className="font-black text-white text-2xl sm:text-4xl uppercase tracking-wider">
              {state.teams.teamB.name}
            </h3>
            <p className="text-xs sm:text-sm text-blue-200 mt-2 font-bold">
              Chạm bất kỳ đâu trên nút này để BẤM CHUÔNG!
            </p>
          </button>
        </div>
      )}

      {/* Reset Action */}
      <div className="flex items-center justify-center pt-3">
        <button
          onClick={() => {
            onResetBuzzer();
            setBuzzerTime(null);
          }}
          className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs sm:text-sm font-bold border border-slate-700 flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Đặt Lại Chuông Bấm (Phím Space)</span>
        </button>
      </div>

    </div>
  );
};
