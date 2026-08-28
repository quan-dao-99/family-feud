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
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentView,
  onViewChange,
  state,
  onToggleSound,
  onResetGame,
  onOpenRules,
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

  const openHostTab = () => {
    window.open(`${window.location.origin}${window.location.pathname}?view=host`, '_blank');
  };

  const openBoardTab = () => {
    window.open(`${window.location.origin}${window.location.pathname}?view=board`, '_blank');
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-50 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Game Title */}
        <ChungSucLogo variant="badge" size="md" animated={true} />

        {/* View Switcher Navigation */}
        <nav className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onViewChange('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'board'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Màn Hình Game</span>
          </button>

          <button
            onClick={() => onViewChange('host')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'host'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Bảng MC (Host)</span>
          </button>

          <button
            onClick={() => onViewChange('fast-money')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'fast-money'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Vòng Đặc Biệt</span>
          </button>

          <button
            onClick={() => onViewChange('buzzer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'buzzer'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Bấm Chuông</span>
          </button>

          <button
            onClick={() => onViewChange('questions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'questions'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quản Lý Câu Hỏi</span>
          </button>
        </nav>

        {/* Action Buttons & Utilities */}
        <div className="flex items-center gap-2">
          {/* Quick Dual Screen Helpers */}
          {currentView === 'board' ? (
            <button
              onClick={openHostTab}
              title="Mở tab MC điều khiển riêng biệt"
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 font-medium transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mở Tab MC</span>
            </button>
          ) : (
            <button
              onClick={openBoardTab}
              title="Mở tab Màn hình chiếu TV"
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 font-medium transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mở Tab TV</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={state.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className={`p-2 rounded-lg border transition ${
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
            className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Rules Guide */}
          <button
            onClick={onOpenRules}
            title="Hướng dẫn luật chơi"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
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
            className="p-2 rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/60 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
