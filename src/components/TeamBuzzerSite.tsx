import { useState, useEffect, useCallback } from 'react';
import type { GameState, ViewMode } from '../types/game';
import { 
  Bell, 
  Trophy, 
  Wifi, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ArrowRightLeft, 
  Tv, 
  Volume2, 
  VolumeX,
  Flame,
  AlertCircle
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { ChungSucLogo } from './ChungSucLogo';
import confetti from 'canvas-confetti';

interface TeamBuzzerSiteProps {
  teamId: 'teamA' | 'teamB';
  state: GameState;
  onTriggerBuzzer: (team: 'teamA' | 'teamB') => void;
  onResetBuzzer: () => void;
  onTriggerFaceOffBuzzer?: (team: 'teamA' | 'teamB') => void;
  onViewChange?: (view: ViewMode) => void;
  onToggleSound?: () => void;
}

export const TeamBuzzerSite: React.FC<TeamBuzzerSiteProps> = ({
  teamId,
  state,
  onTriggerBuzzer,
  onResetBuzzer,
  onTriggerFaceOffBuzzer,
  onViewChange,
  onToggleSound,
}) => {
  const [buzzerTime, setBuzzerTime] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tapRipple, setTapRipple] = useState(false);

  const isTeamA = teamId === 'teamA';
  const team = isTeamA ? state.teams.teamA : state.teams.teamB;
  const opponentTeam = isTeamA ? state.teams.teamB : state.teams.teamA;
  const isWinner = state.buzzerWinner === teamId;
  const isOpponentWinner = state.buzzerWinner && state.buzzerWinner !== teamId;
  const isLocked = state.buzzerLocked;
  const currentQuestion = state.questions[state.currentRoundIndex];
  const isFaceOffActive = state.faceOff && state.faceOff.status === 'buzzer_waiting';

  const triggerBuzz = useCallback(() => {
    if (isLocked) return;

    // Trigger haptic vibration on mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {}
    }

    // Record tap time
    const nowStr = new Date().toLocaleTimeString('vi-VN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
    setBuzzerTime(nowStr);

    // Ripple visual effect
    setTapRipple(true);
    setTimeout(() => setTapRipple(false), 500);

    // Sound effect
    soundManager.playBuzzer();

    // Fire confetti if this tap won
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}

    // Dispatch game action
    if (isFaceOffActive && onTriggerFaceOffBuzzer) {
      onTriggerFaceOffBuzzer(teamId);
    } else {
      onTriggerBuzzer(teamId);
    }
  }, [isLocked, isFaceOffActive, onTriggerFaceOffBuzzer, onTriggerBuzzer, teamId]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();

      // Team A shortcut: 'a', 'z', '1'
      if (isTeamA && (key === 'a' || key === 'z' || key === '1') && !isLocked) {
        triggerBuzz();
      }

      // Team B shortcut: 'l', 'm', 'enter', '0'
      if (!isTeamA && (key === 'l' || key === 'm' || key === 'enter' || key === '0') && !isLocked) {
        triggerBuzz();
      }

      // Spacebar to reset if locked
      if (key === ' ' && isLocked) {
        e.preventDefault();
        onResetBuzzer();
        setBuzzerTime(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTeamA, isLocked, triggerBuzz, onResetBuzzer]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Switch team view
  const switchTeam = () => {
    const nextView: ViewMode = isTeamA ? 'buzzer-b' : 'buzzer-a';
    if (onViewChange) {
      onViewChange(nextView);
    }
  };

  return (
    <div className={`min-h-screen max-h-screen h-screen flex flex-col justify-between overflow-hidden select-none touch-manipulation ${
      isTeamA 
        ? 'bg-radial from-red-950 via-slate-950 to-black text-red-100' 
        : 'bg-radial from-blue-950 via-slate-950 to-black text-blue-100'
    }`}>
      
      {/* Background Decorative Neon Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
        isWinner
          ? 'bg-yellow-500/25 animate-pulse scale-125'
          : isTeamA
          ? 'bg-red-600/15'
          : 'bg-blue-600/15'
      }`} />

      {/* Top Header Bar */}
      <header className="relative z-20 px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-white/10 bg-slate-950/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <ChungSucLogo variant="badge" size="sm" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-xs font-semibold">
            <Wifi className="w-3 h-3 animate-pulse" />
            <span>LAN Live</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5">
          {/* Switch Team Remote Button */}
          <button
            onClick={switchTeam}
            title={isTeamA ? 'Đổi sang Chuông Đội Xanh' : 'Đổi sang Chuông Đội Đỏ'}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm ${
              isTeamA
                ? 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40'
                : 'bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{isTeamA ? 'Sang Đội Xanh' : 'Sang Đội Đỏ'}</span>
          </button>

          {/* Sound Toggle */}
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-slate-900/80 text-slate-300 border border-white/10 hover:bg-slate-800 transition"
              title={state.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {state.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/80 text-slate-300 border border-white/10 hover:bg-slate-800 transition"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Return to Game Board Button */}
          {onViewChange && (
            <button
              onClick={() => onViewChange('board')}
              className="p-2 rounded-xl bg-slate-900/80 text-slate-300 border border-white/10 hover:bg-slate-800 transition"
              title="Xem Sân Khấu Game (TV)"
            >
              <Tv className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Team Info Banner */}
      <div className="relative z-10 px-4 pt-3 pb-1 text-center flex flex-col items-center shrink-0">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border mb-1.5 shadow-lg ${
          isTeamA
            ? 'bg-red-500/20 text-red-300 border-red-500/40 glow-red'
            : 'bg-blue-500/20 text-blue-300 border-blue-500/40 glow-blue'
        }`}>
          <Flame className="w-3.5 h-3.5" />
          <span>CHUÔNG BẤM {isTeamA ? 'ĐỘI ĐỎ' : 'ĐỘI XANH'}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
          {team.name}
        </h1>

        <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm font-semibold opacity-90">
          <span className="bg-slate-900/80 px-2.5 py-0.5 rounded-lg border border-white/10">
            Điểm số: <strong className="font-mono text-amber-400 font-bold">{team.score}</strong>
          </span>
          <span className="bg-slate-900/80 px-2.5 py-0.5 rounded-lg border border-white/10">
            Vòng {state.currentRoundIndex + 1}
            {currentQuestion?.multiplier && currentQuestion.multiplier > 1 ? ` (x${currentQuestion.multiplier})` : ''}
          </span>
        </div>
      </div>

      {/* Center Status Feedback Area */}
      <div className="relative z-10 px-4 py-1 flex flex-col items-center justify-center shrink-0 min-h-[50px]">
        {/* State 1: WINNER (This team buzzed first!) */}
        {isWinner && (
          <div className="animate-strike bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-500/30 border-2 border-yellow-400 rounded-2xl px-4 py-2 shadow-2xl glow-gold text-center max-w-md w-full">
            <div className="flex items-center justify-center gap-1.5 text-yellow-300 font-black text-sm sm:text-base uppercase tracking-wider">
              <Trophy className="w-5 h-5 animate-bounce text-yellow-400" />
              <span>XUẤT SẮC! BẠN ĐÃ BẤM ĐẦU TIÊN!</span>
            </div>
            {buzzerTime && (
              <p className="text-[11px] font-mono text-amber-200 mt-0.5">
                Thời điểm ghi nhận: {buzzerTime}
              </p>
            )}
          </div>
        )}

        {/* State 2: OPPONENT WON */}
        {isOpponentWinner && (
          <div className="bg-slate-900/90 border border-slate-700 rounded-2xl px-4 py-2 text-center max-w-md w-full shadow-lg">
            <div className="flex items-center justify-center gap-1.5 text-slate-300 font-bold text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>{opponentTeam.name} đã bấm trước!</span>
            </div>
          </div>
        )}

        {/* State 3: READY TO BUZZ */}
        {!isLocked && (
          <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm animate-pulse bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>SẴN SÀNG! CHẠM BẤT KỲ ĐÂU ĐỂ BẤM CHUÔNG</span>
          </div>
        )}

        {/* State 4: LOCKED / IDLE */}
        {isLocked && !isWinner && !isOpponentWinner && (
          <div className="text-slate-400 font-medium text-xs bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
            Chuông đang tạm khóa
          </div>
        )}
      </div>

      {/* Massive Interactive Buzzer Button */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 min-h-0">
        <button
          onClick={triggerBuzz}
          disabled={isLocked && !isWinner}
          className={`relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square rounded-full flex flex-col items-center justify-center p-6 transition-all duration-150 transform select-none active:scale-90 active:brightness-125 focus:outline-none ${
            tapRipple ? 'scale-95 brightness-125' : ''
          } ${
            isWinner
              ? 'bg-gradient-to-b from-yellow-400 via-amber-500 to-yellow-600 border-8 border-yellow-200 glow-gold shadow-2xl scale-105 animate-pulse'
              : isLocked
              ? 'bg-slate-900 border-4 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed shadow-inner'
              : isTeamA
              ? 'bg-gradient-to-b from-red-500 via-red-600 to-red-800 hover:from-red-400 hover:to-red-700 border-6 sm:border-8 border-red-300 glow-red shadow-2xl shadow-red-600/50 cursor-pointer active:shadow-none'
              : 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-800 hover:from-blue-400 hover:to-blue-700 border-6 sm:border-8 border-blue-300 glow-blue shadow-2xl shadow-blue-600/50 cursor-pointer active:shadow-none'
          }`}
        >
          {/* Animated Pulsing Ring when Ready */}
          {!isLocked && (
            <div className={`absolute -inset-3 sm:-inset-4 rounded-full border-4 animate-ping opacity-30 pointer-events-none ${
              isTeamA ? 'border-red-400' : 'border-blue-400'
            }`} />
          )}

          {/* Inner Glossy Dome / Highlight */}
          <div className={`w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full flex items-center justify-center shadow-inner border-2 sm:border-4 transition-transform duration-150 ${
            isWinner
              ? 'bg-yellow-600/40 border-yellow-200'
              : isLocked
              ? 'bg-slate-950 border-slate-800'
              : isTeamA
              ? 'bg-red-950/70 border-red-300/80 group-hover:scale-105'
              : 'bg-blue-950/70 border-blue-300/80 group-hover:scale-105'
          }`}>
            <Bell className={`w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 stroke-[2.5] transition-transform ${
              isWinner
                ? 'text-yellow-100 animate-bounce'
                : isLocked
                ? 'text-slate-600'
                : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.7)] animate-pulse'
            }`} />
          </div>

          {/* Button Text */}
          <div className="mt-3 sm:mt-4 text-center">
            <span className={`font-black text-lg sm:text-2xl md:text-3xl uppercase tracking-wider block drop-shadow-md ${
              isWinner
                ? 'text-slate-950 font-extrabold'
                : isLocked
                ? 'text-slate-500'
                : 'text-white'
            }`}>
              {isWinner ? 'ĐÃ GIÀNH QUYỀN!' : isLocked ? 'ĐÃ KHÓA' : 'BẤM CHUÔNG!'}
            </span>
            <span className={`text-[10px] sm:text-xs font-semibold block mt-0.5 ${
              isWinner ? 'text-slate-900 font-bold' : isLocked ? 'text-slate-600' : 'text-white/80'
            }`}>
              {isWinner ? 'Chúc mừng bạn!' : isLocked ? 'Chờ lượt mới' : 'Chạm để giành quyền'}
            </span>
          </div>
        </button>
      </div>

      {/* Bottom Footer Controls */}
      <footer className="relative z-20 px-4 py-3 flex items-center justify-between border-t border-white/10 bg-slate-950/80 backdrop-blur shrink-0 safe-area-bottom">
        <div className="text-[11px] text-slate-400 font-mono">
          Phím tắt: <strong>{isTeamA ? '[A] / [Z]' : '[L] / [Enter]'}</strong>
        </div>

        {/* Reset / Unlock Button */}
        <button
          onClick={() => {
            onResetBuzzer();
            setBuzzerTime(null);
          }}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Đặt lại chuông</span>
        </button>
      </footer>

    </div>
  );
};
