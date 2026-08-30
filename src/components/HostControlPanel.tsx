import { useState } from 'react';
import type { GameState, ViewMode } from '../types/game';
import { 
  Eye, 
  EyeOff, 
  X, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus, 
  Shield, 
  HelpCircle,
  Edit2,
  Check,
  Copy,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { VoiceAnswerWidget } from './VoiceAnswerWidget';
import { ChungSucLogo } from './ChungSucLogo';

interface HostControlPanelProps {
  state: GameState;
  onRevealAnswer: (id: string) => void;
  onHideAnswer: (id: string) => void;
  onRevealAll: () => void;
  onHideAll: () => void;
  onAddStrike: (count?: number) => void;
  onClearStrikes: () => void;
  onAwardBank: (team: 'teamA' | 'teamB') => void;
  onSetRound: (index: number) => void;
  onUpdateTeamName: (team: 'teamA' | 'teamB', name: string) => void;
  onUpdateTeamScore: (team: 'teamA' | 'teamB', score: number) => void;
  onSetControllingTeam: (team: 'teamA' | 'teamB' | null) => void;
  onViewChange?: (view: ViewMode) => void;
}

export const HostControlPanel: React.FC<HostControlPanelProps> = ({
  state,
  onRevealAnswer,
  onHideAnswer,
  onRevealAll,
  onHideAll,
  onAddStrike,
  onClearStrikes,
  onAwardBank,
  onSetRound,
  onUpdateTeamName,
  onUpdateTeamScore,
  onSetControllingTeam,
  onViewChange,
}) => {
  const [editingTeam, setEditingTeam] = useState<'teamA' | 'teamB' | null>(null);
  const [teamANameInput, setTeamANameInput] = useState(state.teams.teamA.name);
  const [teamBNameInput, setTeamBNameInput] = useState(state.teams.teamB.name);
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentQuestion = state.questions[state.currentRoundIndex];
  const multiplier = currentQuestion?.multiplier || 1;

  const saveTeamName = (team: 'teamA' | 'teamB') => {
    if (team === 'teamA') {
      onUpdateTeamName('teamA', teamANameInput.trim() || 'Đội Đỏ');
    } else {
      onUpdateTeamName('teamB', teamBNameInput.trim() || 'Đội Xanh');
    }
    setEditingTeam(null);
  };

  const handleCopyHostLink = () => {
    const hostUrl = `${window.location.origin}${window.location.pathname}?view=host`;
    navigator.clipboard.writeText(hostUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {});
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      
      {/* Top Header & Round Switcher for MC */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <ChungSucLogo variant="icon" size="md" animated={true} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base md:text-lg text-amber-300">
                Bảng Điều Khiển Dành Cho MC (Host)
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black uppercase shadow-sm">
                MC
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Thao tác tại đây tự động đồng bộ ngay lên màn hình TV của người chơi.
            </p>
          </div>
        </div>

        {/* Action button & Quick round changer */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleCopyHostLink}
            title="Sao chép đường dẫn bí mật của tab MC"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition active:scale-95 shadow-sm"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Đã chép link MC!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép link MC</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSetRound(Math.max(0, state.currentRoundIndex - 1))}
              disabled={state.currentRoundIndex === 0}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 shrink-0"
              title="Vòng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <select
              value={state.currentRoundIndex}
              onChange={(e) => onSetRound(Number(e.target.value))}
              className="flex-1 md:flex-none bg-slate-900 border border-slate-700 text-amber-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500 max-w-[220px] truncate"
            >
              {state.questions.map((q, idx) => (
                <option key={q.id} value={idx}>
                  Vòng {idx + 1} (x{q.multiplier}) - {q.question.slice(0, 25)}...
                </option>
              ))}
            </select>

            <button
              onClick={() => onSetRound(Math.min(state.questions.length - 1, state.currentRoundIndex + 1))}
              disabled={state.currentRoundIndex >= state.questions.length - 1}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 shrink-0"
              title="Vòng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Teams & Score Adjusters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        
        {/* Team A Management */}
        <div className={`p-3 sm:p-4 rounded-2xl border transition-all ${
          state.controllingTeam === 'teamA'
            ? 'bg-red-950/40 border-red-500/80 shadow-lg shadow-red-500/10'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2.5">
            {editingTeam === 'teamA' ? (
              <div className="flex items-center gap-1.5 flex-1 mr-2">
                <input
                  type="text"
                  value={teamANameInput}
                  onChange={(e) => setTeamANameInput(e.target.value)}
                  className="bg-slate-950 border border-red-500 rounded-lg px-2.5 py-1 text-sm text-red-400 font-bold w-full focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => saveTeamName('teamA')}
                  className="p-1.5 bg-red-600 rounded-lg text-white hover:bg-red-500 shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 truncate mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <h3 className="font-extrabold text-sm sm:text-base text-red-400 truncate">{state.teams.teamA.name}</h3>
                <button
                  onClick={() => {
                    setTeamANameInput(state.teams.teamA.name);
                    setEditingTeam('teamA');
                  }}
                  className="p-1 text-slate-500 hover:text-slate-300 shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => onSetControllingTeam(state.controllingTeam === 'teamA' ? null : 'teamA')}
              className={`text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 transition shrink-0 ${
                state.controllingTeam === 'teamA'
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-red-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              {state.controllingTeam === 'teamA' ? 'Đang giữ quyền' : 'Gán quyền'}
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 gap-2">
            <div>
              <span className="text-[10px] sm:text-xs text-slate-500 block uppercase font-medium">Tổng điểm</span>
              <span className="font-mono font-black text-2xl sm:text-3xl text-red-400">{state.teams.teamA.score}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateTeamScore('teamA', Math.max(0, state.teams.teamA.score - 10))}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95"
                title="-10 điểm"
              >
                <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => onUpdateTeamScore('teamA', state.teams.teamA.score + 10)}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95"
                title="+10 điểm"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => onAwardBank('teamA')}
                disabled={state.roundBank === 0}
                className="ml-1 sm:ml-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] sm:text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-600/30 flex items-center gap-1 active:scale-95 transition"
              >
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Trao +{state.roundBank}đ
              </button>
            </div>
          </div>
        </div>

        {/* Team B Management */}
        <div className={`p-3 sm:p-4 rounded-2xl border transition-all ${
          state.controllingTeam === 'teamB'
            ? 'bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-500/10'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2.5">
            {editingTeam === 'teamB' ? (
              <div className="flex items-center gap-1.5 flex-1 mr-2">
                <input
                  type="text"
                  value={teamBNameInput}
                  onChange={(e) => setTeamBNameInput(e.target.value)}
                  className="bg-slate-950 border border-blue-500 rounded-lg px-2.5 py-1 text-sm text-blue-400 font-bold w-full focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => saveTeamName('teamB')}
                  className="p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 truncate mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <h3 className="font-extrabold text-sm sm:text-base text-blue-400 truncate">{state.teams.teamB.name}</h3>
                <button
                  onClick={() => {
                    setTeamBNameInput(state.teams.teamB.name);
                    setEditingTeam('teamB');
                  }}
                  className="p-1 text-slate-500 hover:text-slate-300 shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => onSetControllingTeam(state.controllingTeam === 'teamB' ? null : 'teamB')}
              className={`text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 transition shrink-0 ${
                state.controllingTeam === 'teamB'
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-blue-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              {state.controllingTeam === 'teamB' ? 'Đang giữ quyền' : 'Gán quyền'}
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 gap-2">
            <div>
              <span className="text-[10px] sm:text-xs text-slate-500 block uppercase font-medium">Tổng điểm</span>
              <span className="font-mono font-black text-2xl sm:text-3xl text-blue-400">{state.teams.teamB.score}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateTeamScore('teamB', Math.max(0, state.teams.teamB.score - 10))}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95"
                title="-10 điểm"
              >
                <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => onUpdateTeamScore('teamB', state.teams.teamB.score + 10)}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95"
                title="+10 điểm"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => onAwardBank('teamB')}
                disabled={state.roundBank === 0}
                className="ml-1 sm:ml-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] sm:text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/30 flex items-center gap-1 active:scale-95 transition"
              >
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Trao +{state.roundBank}đ
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Strikes Controller & Audio Triggers Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Strikes Trigger Box */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase text-slate-400 hidden xs:inline">Sai:</span>
          
          <button
            onClick={() => onAddStrike(1)}
            className="flex-1 sm:flex-none px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-red-600/20 active:scale-95 transition"
          >
            <X className="w-4 h-4 stroke-[3]" />
            1X
          </button>

          <button
            onClick={() => onAddStrike(2)}
            className="flex-1 sm:flex-none px-3 py-2 bg-red-700 hover:bg-red-600 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-red-700/20 active:scale-95 transition"
          >
            <span className="flex"><X className="w-3.5 h-3.5 stroke-[3]" /><X className="w-3.5 h-3.5 stroke-[3] -ml-2" /></span>
            2X
          </button>

          <button
            onClick={() => onAddStrike(3)}
            className="flex-1 sm:flex-none px-3 py-2 bg-red-800 hover:bg-red-700 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-red-800/20 active:scale-95 transition"
          >
            <span className="flex"><X className="w-3.5 h-3.5 stroke-[3]" /><X className="w-3.5 h-3.5 stroke-[3] -ml-2" /><X className="w-3.5 h-3.5 stroke-[3] -ml-2" /></span>
            3X
          </button>

          <button
            onClick={onClearStrikes}
            className="flex-1 sm:flex-none px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Xóa ({state.strikes}/3)
          </button>
        </div>

        {/* Manual Sound Effects Buttons */}
        <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Âm:</span>
          <button
            onClick={() => soundManager.playDing()}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium rounded-lg border border-slate-700"
          >
            Ding!
          </button>
          <button
            onClick={() => soundManager.playStrike()}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-medium rounded-lg border border-slate-700"
          >
            Buzz!
          </button>
          <button
            onClick={() => soundManager.playFanfare()}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 text-xs font-medium rounded-lg border border-slate-700"
          >
            Kèn Thắng
          </button>
        </div>

      </div>

      {/* Active Question & Full Answer Controller */}
      {currentQuestion ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
          
          {/* Question title & reveal all / hide all */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] sm:text-xs font-extrabold border border-amber-500/30">
                  VÒNG {state.currentRoundIndex + 1} (Hệ số x{multiplier})
                </span>
                {currentQuestion.category && (
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                    Chủ đề: {currentQuestion.category}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-white leading-snug">
                "{currentQuestion.question}"
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={onRevealAll}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition"
              >
                <Eye className="w-3.5 h-3.5" />
                Lật Tất Cả
              </button>
              <button
                onClick={onHideAll}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 rounded-xl text-xs font-semibold transition"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Ẩn Tất Cả
              </button>
            </div>
          </div>

          {/* Speech Recognition & Smart Answer Matcher for Current Question */}
          <VoiceAnswerWidget
            answers={currentQuestion.answers}
            revealedAnswerIds={state.revealedAnswers}
            multiplier={multiplier}
            onRevealAnswer={onRevealAnswer}
            onAddStrike={onAddStrike}
          />

          {/* List of answers with single-click reveal/hide buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
            {currentQuestion.answers.map((answer, index) => {
              const isRevealed = state.revealedAnswers.includes(answer.id);
              const pointsWithMultiplier = answer.points * multiplier;

              return (
                <div
                  key={answer.id}
                  className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isRevealed
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                      isRevealed ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <p className={`font-bold text-xs sm:text-sm md:text-base truncate ${
                        isRevealed ? 'text-amber-200' : 'text-slate-200'
                      }`}>
                        {answer.text}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-mono">
                        {answer.points} điểm {multiplier > 1 && `(x${multiplier} = ${pointsWithMultiplier}đ)`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (isRevealed) {
                        onHideAnswer(answer.id);
                      } else {
                        onRevealAnswer(answer.id);
                      }
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition shrink-0 active:scale-95 ${
                      isRevealed
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {isRevealed ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Đang Hiện
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Lật Ô #{index + 1}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Dedicated Round Transition & Completion Action Card */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 mt-3 shadow-inner">
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                {state.currentRoundIndex + 1}/{state.questions.length}
              </div>
              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  Đổi Vòng Đấu:
                </h4>
                <p className="text-[11px] text-slate-400">
                  {state.currentRoundIndex < state.questions.length - 1
                    ? `Vòng tiếp theo: Vòng ${state.currentRoundIndex + 2} (x${state.questions[state.currentRoundIndex + 1]?.multiplier || 1})`
                    : 'Đây là vòng bảng cuối cùng! Sẵn sàng vào Vòng Đặc Biệt.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {/* Previous Round Button */}
              <button
                onClick={() => onSetRound(state.currentRoundIndex - 1)}
                disabled={state.currentRoundIndex === 0}
                className="flex-1 md:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-1 transition active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                Vòng Trước
              </button>

              {/* Next Round or Fast Money Button */}
              {state.currentRoundIndex < state.questions.length - 1 ? (
                <button
                  onClick={() => onSetRound(state.currentRoundIndex + 1)}
                  className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <span>Chuyển Sang Vòng {state.currentRoundIndex + 2}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => onViewChange ? onViewChange('fast-money') : null}
                  className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5 transition active:scale-95 animate-pulse"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Vào Vòng Đặc Biệt</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>
      ) : null}

      {/* MC Rules / Flow Guide Cheat Sheet (Collapsible on Mobile) */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 sm:p-4 text-xs text-slate-400 space-y-2">
        <button
          onClick={() => setIsRulesExpanded(!isRulesExpanded)}
          className="w-full flex items-center justify-between font-bold text-slate-300 text-xs sm:text-sm text-left"
        >
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Quy trình dẫn vòng đấu cho MC</span>
          </div>
          {isRulesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isRulesExpanded && (
          <ol className="list-decimal list-inside space-y-1.5 ml-1 text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
            <li><strong>Mở đầu vòng</strong>: Mời đại diện 2 đội lên bấm chuông (hoặc dùng tab "Bấm Chuông"). Ai bấm trước trả lời trước.</li>
            <li><strong>Chọn quyền chơi</strong>: Đội có câu trả lời cao điểm hơn được chọn "Chơi tiếp" hoặc "Nhường quyền" cho đội bạn.</li>
            <li><strong>Đoán đáp án</strong>: Đội giữ quyền lần lượt nêu đáp án. MC bấm nút <strong>Lật Ô</strong> nếu đúng, hoặc bấm <strong>1X</strong> nếu sai.</li>
            <li><strong>Cướp điểm (Steal)</strong>: Nếu đội chơi bị đủ <strong>3X</strong>, quyền chuyển sang đội bạn. Đội bạn chỉ cần đoán đúng 1 đáp án còn lại để cướp toàn bộ Điểm Tích Lũy!</li>
            <li><strong>Trao điểm</strong>: Bấm nút <strong>Trao điểm</strong> cho đội chiến thắng vòng để cộng điểm tích lũy vào tổng điểm.</li>
          </ol>
        )}
      </div>

    </div>
  );
};
