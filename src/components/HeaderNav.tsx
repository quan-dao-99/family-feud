import { useState } from 'react';
import type { ViewMode, GameState } from '../types/game';
import { ChungSucLogo } from './ChungSucLogo';

import { 
  Tv, 
  SlidersHorizontal, 
  Zap, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  RotateCcw,
  BookOpen,
  Bell
} from 'lucide-react';

interface HeaderNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  state: GameState;
  onToggleSound: () => void;
  onResetGame: () => void;
  onOpenRules: () => void;
  isHostAuthorized?: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentView,
  onViewChange,
  state,
  onToggleSound,
  onResetGame,
  onOpenRules,
  isHostAuthorized = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const openBoardTab = () => {
    window.open(`${window.location.origin}${window.location.pathname}?view=board`, '_blank');
  };

  const showHostTab = isHostAuthorized || currentView === 'host';

  const navItems = [
    { id: 'board' as ViewMode, label: 'Sân Khấu', fullLabel: 'Màn Hình Game', icon: Tv, color: 'blue' },
    ...(showHostTab ? [{ id: 'host' as ViewMode, label: 'Bảng MC', fullLabel: 'Bảng MC (Host)', icon: SlidersHorizontal, color: 'amber' }] : []),
    { id: 'fast-money' as ViewMode, label: 'Đặc Biệt', fullLabel: 'Vòng Đặc Biệt', icon: Zap, color: 'purple' },
    { id: 'buzzer' as ViewMode, label: 'Chuông', fullLabel: 'Bấm Chuông', icon: Bell, color: 'emerald' },
    { id: 'questions' as ViewMode, label: 'Câu Hỏi', fullLabel: 'Quản Lý Câu Hỏi', icon: HelpCircle, color: 'rose' },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-4 py-1.5 sm:py-2 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Logo & Game Title */}
          <div className="flex items-center gap-2">
            <ChungSucLogo variant="badge" size="sm" animated={true} />
          </div>

          {/* Desktop View Switcher Navigation (md+) */}
          <nav className="hidden md:flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              let activeClass = 'bg-blue-600 text-white shadow-md shadow-blue-500/30';
              if (item.color === 'amber') activeClass = 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30';
              if (item.color === 'purple') activeClass = 'bg-purple-600 text-white shadow-md shadow-purple-500/30';
              if (item.color === 'emerald') activeClass = 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30';
              if (item.color === 'rose') activeClass = 'bg-rose-600 text-white shadow-md shadow-rose-500/30';

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                    isActive ? `${activeClass} font-bold` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.fullLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Buttons & Utilities */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Live LAN Sync Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium" title="Hệ thống đồng bộ trực tiếp qua mạng LAN giữa Điện Thoại và TV">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Đồng Bộ LAN</span>
            </div>
            {/* Quick Dual Screen Helpers (Desktop only, shown only when in Host mode) */}
            {currentView === 'host' && (
              <div className="hidden lg:flex items-center">
                <button
                  onClick={openBoardTab}
                  title="Mở tab Màn hình chiếu TV"
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 font-medium transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Tab TV</span>
                </button>
              </div>
            )}

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={state.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className={`p-1.5 sm:p-2 rounded-lg border transition ${
                state.soundEnabled
                  ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {state.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title="Toàn màn hình"
              className="p-1.5 sm:p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Rules Guide */}
            <button
              onClick={onOpenRules}
              title="Hướng dẫn luật chơi"
              className="p-1.5 sm:p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Reset Game */}
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn làm mới điểm số và vòng chơi về ban đầu không?')) {
                  onResetGame();
                }
              }}
              title="Reset Game"
              className="p-1.5 sm:p-2 rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/60 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed bottom for screens < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          let activeTextColor = 'text-blue-400';
          let activeBg = 'bg-blue-500/15 border-blue-500/40';
          if (item.color === 'amber') {
            activeTextColor = 'text-amber-400';
            activeBg = 'bg-amber-500/15 border-amber-500/40';
          } else if (item.color === 'purple') {
            activeTextColor = 'text-purple-400';
            activeBg = 'bg-purple-500/15 border-purple-500/40';
          } else if (item.color === 'emerald') {
            activeTextColor = 'text-emerald-400';
            activeBg = 'bg-emerald-500/15 border-emerald-500/40';
          } else if (item.color === 'rose') {
            activeTextColor = 'text-rose-400';
            activeBg = 'bg-rose-500/15 border-rose-500/40';
          }

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                isActive
                  ? `${activeTextColor} font-extrabold ${activeBg} border shadow-sm`
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              {isActive && (
                <span className={`absolute -top-1 w-5 h-1 rounded-full ${
                  item.color === 'amber' ? 'bg-amber-400' :
                  item.color === 'purple' ? 'bg-purple-400' :
                  item.color === 'emerald' ? 'bg-emerald-400' :
                  item.color === 'rose' ? 'bg-rose-400' : 'bg-blue-400'
                }`} />
              )}
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'scale-110' : 'opacity-80'} transition-transform`} />
              <span className="text-[10px] tracking-tight truncate max-w-[62px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
