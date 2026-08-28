import { useState } from 'react';
import type { GameState } from '../types/game';
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
  Check
} from 'lucide-react';
import { soundManager } from '../utils/audio';


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
}) => {
  const [editingTeam, setEditingTeam] = useState<'teamA' | 'teamB' | null>(null);
  const [teamANameInput, setTeamANameInput] = useState(state.teams.teamA.name);
  const [teamBNameInput, setTeamBNameInput] = useState(state.teams.teamB.name);

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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Top Notification Bar for MC */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
            MC
          </div>
          <div>
            <h1 className="font-bold text-lg text-amber-300">
              Bảng Điều Khiển Dành Cho Người Dẫn Chương Trình (Host)
            </h1>
            <p className="text-xs text-slate-400">
              Bạn thấy toàn bộ đáp án và điểm số. Thao tác tại đây sẽ lập tức đồng bộ lên màn hình TV chiếu cho người chơi.
            </p>
          </div>
        </div>

        {/* Quick round changer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSetRound(Math.max(0, state.currentRoundIndex - 1))}
            disabled={state.currentRoundIndex === 0}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <select
            value={state.currentRoundIndex}
            onChange={(e) => onSetRound(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-amber-300 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-amber-500"
          >
            {state.questions.map((q, idx) => (
              <option key={q.id} value={idx}>
                Vòng {idx + 1} (x{q.multiplier}) - {q.question.slice(0, 30)}...
              </option>
            ))}
          </select>

          <button
            onClick={() => onSetRound(Math.min(state.questions.length - 1, state.currentRoundIndex + 1))}
            disabled={state.currentRoundIndex >= state.questions.length - 1}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Teams & Score Adjusters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Team A Management */}
        <div className={`p-4 rounded-2xl border transition-all ${
          state.controllingTeam === 'teamA'
            ? 'bg-red-950/40 border-red-500/80 shadow-lg shadow-red-500/10'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            {editingTeam === 'teamA' ? (
              <div className="flex items-center gap-2 flex-1 mr-2">
                <input
                  type="text"
                  value={teamANameInput}
                  onChange={(e) => setTeamANameInput(e.target.value)}
                  className="bg-slate-950 border border-red-500 rounded-lg px-2.5 py-1 text-sm text-red-400 font-bold w-full focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => saveTeamName('teamA')}
                  className="p-1.5 bg-red-600 rounded-lg text-white hover:bg-red-500"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <h3 className="font-extrabold text-base text-red-400">{state.teams.teamA.name}</h3>
                <button
                  onClick={() => {
                    setTeamANameInput(state.teams.teamA.name);
                    setEditingTeam('teamA');
                  }}
                  className="p-1 text-slate-500 hover:text-slate-300"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => onSetControllingTeam(state.controllingTeam === 'teamA' ? null : 'teamA')}
              className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 transition ${
                state.controllingTeam === 'teamA'
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-red-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              {state.controllingTeam === 'teamA' ? 'Đang giữ quyền' : 'Gán quyền chơi'}
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-500 block uppercase font-medium">Tổng điểm</span>
              <span className="font-mono font-black text-3xl text-red-400">{state.teams.teamA.score}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateTeamScore('teamA', Math.max(0, state.teams.teamA.score - 10))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="-10 điểm"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdateTeamScore('teamA', state.teams.teamA.score + 10)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="+10 điểm"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAwardBank('teamA')}
                disabled={state.roundBank === 0}
                className="ml-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-600/30 flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                Trao +{state.roundBank}đ
              </button>
            </div>
          </div>
        </div>

        {/* Team B Management */}
        <div className={`p-4 rounded-2xl border transition-all ${
          state.controllingTeam === 'teamB'
            ? 'bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-500/10'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            {editingTeam === 'teamB' ? (
              <div className="flex items-center gap-2 flex-1 mr-2">
                <input
                  type="text"
                  value={teamBNameInput}
                  onChange={(e) => setTeamBNameInput(e.target.value)}
                  className="bg-slate-950 border border-blue-500 rounded-lg px-2.5 py-1 text-sm text-blue-400 font-bold w-full focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => saveTeamName('teamB')}
                  className="p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="font-extrabold text-base text-blue-400">{state.teams.teamB.name}</h3>
                <button
                  onClick={() => {
                    setTeamBNameInput(state.teams.teamB.name);
                    setEditingTeam('teamB');
                  }}
                  className="p-1 text-slate-500 hover:text-slate-300"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => onSetControllingTeam(state.controllingTeam === 'teamB' ? null : 'teamB')}
              className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 transition ${
                state.controllingTeam === 'teamB'
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-blue-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              {state.controllingTeam === 'teamB' ? 'Đang giữ quyền' : 'Gán quyền chơi'}
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-500 block uppercase font-medium">Tổng điểm</span>
              <span className="font-mono font-black text-3xl text-blue-400">{state.teams.teamB.score}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateTeamScore('teamB', Math.max(0, state.teams.teamB.score - 10))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="-10 điểm"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdateTeamScore('teamB', state.teams.teamB.score + 10)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="+10 điểm"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAwardBank('teamB')}
                disabled={state.roundBank === 0}
                className="ml-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/30 flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                Trao +{state.roundBank}đ
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Center Strike Controller & Audio Triggers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Strikes Trigger Box */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 mr-2">Bấm Sai (Strikes):</span>
          
          <button
            onClick={() => onAddStrike(1)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-xl flex items-center gap-1 shadow-lg shadow-red-600/20 active:scale-95 transition"
          >
            <X className="w-4 h-4 stroke-[3]" />
            1X (Sai 1 lần)
          </button>

          <button
            onClick={() => onAddStrike(2)}
            className="px-3.5 py-2 bg-red-700 hover:bg-red-600 text-white font-black text-sm rounded-xl flex items-center gap-1 shadow-lg shadow-red-700/20 active:scale-95 transition"
          >
            <span className="flex"><X className="w-4 h-4 stroke-[3]" /><X className="w-4 h-4 stroke-[3] -ml-2" /></span>
            2X
          </button>

          <button
            onClick={() => onAddStrike(3)}
            className="px-3.5 py-2 bg-red-800 hover:bg-red-700 text-white font-black text-sm rounded-xl flex items-center gap-1 shadow-lg shadow-red-800/20 active:scale-95 transition"
          >
            <span className="flex"><X className="w-4 h-4 stroke-[3]" /><X className="w-4 h-4 stroke-[3] -ml-2" /><X className="w-4 h-4 stroke-[3] -ml-2" /></span>
            3X
          </button>

          <button
            onClick={onClearStrikes}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Xóa Dấu X (0/{state.strikes})
          </button>
        </div>

        {/* Manual Sound Effects Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 mr-1">Thử âm thanh:</span>
          <button
            onClick={() => soundManager.playDing()}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium rounded-lg border border-slate-700"
          >
            Ding!
          </button>
          <button
            onClick={() => soundManager.playStrike()}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-medium rounded-lg border border-slate-700"
          >
            Buzz!
          </button>
          <button
            onClick={() => soundManager.playFanfare()}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 text-xs font-medium rounded-lg border border-slate-700"
          >
            Kèn Thắng
          </button>
        </div>

      </div>

      {/* Active Question & Full Answer Controller */}
      {currentQuestion ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          
          {/* Question title & reveal all / hide all */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-extrabold border border-amber-500/30">
                  VÒNG {state.currentRoundIndex + 1} (Hệ số x{multiplier})
                </span>
                {currentQuestion.category && (
                  <span className="text-xs text-slate-400 font-medium">
                    Chủ đề: {currentQuestion.category}
                  </span>
                )}
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white">
                "{currentQuestion.question}"
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onRevealAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition"
              >
                <Eye className="w-3.5 h-3.5" />
                Lật Tất Cả
              </button>
              <button
                onClick={onHideAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 rounded-xl text-xs font-semibold transition"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Ẩn Tất Cả
              </button>
            </div>
          </div>

          {/* List of answers with single-click reveal/hide buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQuestion.answers.map((answer, index) => {
              const isRevealed = state.revealedAnswers.includes(answer.id);
              const pointsWithMultiplier = answer.points * multiplier;

              return (
                <div
                  key={answer.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isRevealed
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate mr-2">
                    <span className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                      isRevealed ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <p className={`font-bold text-sm md:text-base truncate ${
                        isRevealed ? 'text-amber-200' : 'text-slate-200'
                      }`}>
                        {answer.text}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
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

        </div>
      ) : null}

      {/* MC Rules / Flow Guide Cheat Sheet */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-300 text-sm flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Quy trình dẫn vòng đấu cho MC:
        </h4>
        <ol className="list-decimal list-inside space-y-1 ml-1 text-slate-400 leading-relaxed">
          <li><strong>Mở đầu vòng</strong>: Mời đại diện 2 đội lên bấm chuông (hoặc dùng tab "Bấm Chuông"). Ai bấm trước trả lời trước.</li>
          <li><strong>Chọn quyền chơi</strong>: Đội có câu trả lời cao điểm hơn được chọn "Chơi tiếp" hoặc "Nhường quyền" cho đội bạn.</li>
          <li><strong>Đoán đáp án</strong>: Đội giữ quyền lần lượt nêu đáp án. MC bấm nút <strong>Lật Ô</strong> nếu đúng, hoặc bấm <strong>1X</strong> nếu sai.</li>
          <li><strong>Cướp điểm (Steal)</strong>: Nếu đội chơi bị đủ <strong>3X</strong>, quyền chuyển sang đội bạn. Đội bạn chỉ cần đoán đúng 1 đáp án còn lại để cướp toàn bộ Điểm Tích Lũy!</li>
          <li><strong>Trao điểm</strong>: Bấm nút <strong>Trao điểm</strong> cho đội chiến thắng vòng để cộng điểm tích lũy vào tổng điểm.</li>
        </ol>
      </div>

    </div>
  );
};
