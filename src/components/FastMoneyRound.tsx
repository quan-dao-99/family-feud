import { useState, useEffect, useRef } from 'react';
import type { FastMoneyState } from '../types/game';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  User, 
  Users, 
  Timer,
  Mic
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { matchFastMoneyAnswer } from '../utils/answerMatcher';
import { ChungSucLogo } from './ChungSucLogo';

interface FastMoneyRoundProps {
  fastMoney: FastMoneyState;
  onUpdateFastMoney: (state: FastMoneyState) => void;
}

export const FastMoneyRound: React.FC<FastMoneyRoundProps> = ({
  fastMoney,
  onUpdateFastMoney,
}) => {
  const [activeTab, setActiveTab] = useState<'board' | 'mc'>('board');
  const [listeningQIndex, setListeningQIndex] = useState<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Speech Recognition for Fast Money
  const {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    lang: 'vi-VN',
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal && text && listeningQIndex !== null) {
        const q = fastMoney.questions[listeningQIndex];
        const targetPlayer = fastMoney.activePlayer === 1 ? 'player1' : 'player2';
        if (q) {
          const match = matchFastMoneyAnswer(text, q.answers || []);
          if (match.status === 'MATCH' && match.matchedAnswer) {
            handleEntryChange(targetPlayer, listeningQIndex, 'answer', match.matchedAnswer.text);
            handleEntryChange(targetPlayer, listeningQIndex, 'points', match.matchedAnswer.points);
            soundManager.playDing();
          } else {
            handleEntryChange(targetPlayer, listeningQIndex, 'answer', text);
            handleEntryChange(targetPlayer, listeningQIndex, 'points', 0);
          }
        }
        setListeningQIndex(null);
      }
    },
    onEnd: () => {
      setListeningQIndex(null);
    },
  });

  const handleToggleVoiceForQuestion = (qIndex: number) => {
    if (listeningQIndex === qIndex && isListening) {
      stopListening();
      setListeningQIndex(null);
    } else {
      setListeningQIndex(qIndex);
      startListening('vi-VN');
    }
  };


  // Active player total points calculation
  const p1Total = fastMoney.player1.entries.reduce((sum, e) => sum + (e.revealedPoints ? e.points : 0), 0);
  const p2Total = fastMoney.player2.entries.reduce((sum, e) => sum + (e.revealedPoints ? e.points : 0), 0);
  const combinedTotal = p1Total + p2Total;

  // Check victory (>= 200 points)
  useEffect(() => {
    if (combinedTotal >= 200 && !fastMoney.wonGrandPrize) {
      soundManager.playFanfare();
      try {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 },
        });
      } catch {
        // Ignore
      }
      onUpdateFastMoney({
        ...fastMoney,
        wonGrandPrize: true,
      });
    }
  }, [combinedTotal, fastMoney, onUpdateFastMoney]);

  // Timer logic for active player
  const activePlayerNum = fastMoney.activePlayer;
  const isTimerRunning = activePlayerNum === 1 ? fastMoney.player1.timerActive : fastMoney.player2.timerActive;
  const currentTimer = activePlayerNum === 1 ? fastMoney.player1.timer : fastMoney.player2.timer;

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        const playerKey = activePlayerNum === 1 ? 'player1' : 'player2';
        const currentTime = fastMoney[playerKey].timer;

        if (currentTime > 0) {
          soundManager.playTick();
          onUpdateFastMoney({
            ...fastMoney,
            [playerKey]: {
              ...fastMoney[playerKey],
              timer: currentTime - 1,
            },
          });
        } else {
          // Time's up
          soundManager.playTimeUp();
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          onUpdateFastMoney({
            ...fastMoney,
            [playerKey]: {
              ...fastMoney[playerKey],
              timer: 0,
              timerActive: false,
            },
          });
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, activePlayerNum, fastMoney, onUpdateFastMoney]);

  const toggleTimer = () => {
    const playerKey = activePlayerNum === 1 ? 'player1' : 'player2';
    onUpdateFastMoney({
      ...fastMoney,
      [playerKey]: {
        ...fastMoney[playerKey],
        timerActive: !fastMoney[playerKey].timerActive,
      },
    });
  };

  const resetTimer = (seconds: number) => {
    const playerKey = activePlayerNum === 1 ? 'player1' : 'player2';
    onUpdateFastMoney({
      ...fastMoney,
      [playerKey]: {
        ...fastMoney[playerKey],
        timer: seconds,
        timerActive: false,
      },
    });
  };

  const handleEntryChange = (
    player: 'player1' | 'player2',
    index: number,
    field: 'answer' | 'points',
    val: string | number
  ) => {
    const newEntries = [...fastMoney[player].entries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: val,
    };

    onUpdateFastMoney({
      ...fastMoney,
      [player]: {
        ...fastMoney[player],
        entries: newEntries,
      },
    });
  };

  const toggleRevealAnswer = (player: 'player1' | 'player2', index: number) => {
    const newEntries = [...fastMoney[player].entries];
    const willReveal = !newEntries[index].revealedAnswer;
    newEntries[index] = {
      ...newEntries[index],
      revealedAnswer: willReveal,
    };
    if (willReveal) {
      soundManager.playDing();
    }
    onUpdateFastMoney({
      ...fastMoney,
      [player]: {
        ...fastMoney[player],
        entries: newEntries,
      },
    });
  };

  const toggleRevealPoints = (player: 'player1' | 'player2', index: number) => {
    const newEntries = [...fastMoney[player].entries];
    const willReveal = !newEntries[index].revealedPoints;
    newEntries[index] = {
      ...newEntries[index],
      revealedPoints: willReveal,
    };
    if (willReveal) {
      soundManager.playDing();
    }
    onUpdateFastMoney({
      ...fastMoney,
      [player]: {
        ...fastMoney[player],
        entries: newEntries,
      },
    });
  };

  const revealAllForPlayer = (player: 'player1' | 'player2') => {
    soundManager.playDing();
    const newEntries = fastMoney[player].entries.map((e) => ({
      ...e,
      revealedAnswer: true,
      revealedPoints: true,
    }));
    onUpdateFastMoney({
      ...fastMoney,
      [player]: {
        ...fastMoney[player],
        entries: newEntries,
      },
    });
  };

  const hideAllForPlayer = (player: 'player1' | 'player2') => {
    const newEntries = fastMoney[player].entries.map((e) => ({
      ...e,
      revealedAnswer: false,
      revealedPoints: false,
    }));
    onUpdateFastMoney({
      ...fastMoney,
      [player]: {
        ...fastMoney[player],
        entries: newEntries,
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Top Header with Timer and Score Goal */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-purple-950/80 border border-purple-500/30 rounded-3xl p-5 shadow-2xl backdrop-blur">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Left: Info with Chung Suc Logo */}
          <div className="flex items-center gap-3.5">
            <ChungSucLogo variant="icon" size="lg" animated={true} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-wider border border-purple-500/40">
                  Vòng Đặc Biệt
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  Mục tiêu: Đạt từ 200 điểm trở lên
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
                Fast Money - 2 Người Chơi / 5 Câu Hỏi
              </h1>
            </div>
          </div>

          {/* Center: Big Timer Controller */}
          <div className="flex items-center gap-4 bg-slate-950/90 px-5 py-3 rounded-2xl border border-purple-500/40 shadow-inner">
            <div className="flex items-center gap-2">
              <Timer className="w-6 h-6 text-purple-400 animate-pulse" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Đồng Hồ ({activePlayerNum === 1 ? 'Người 1' : 'Người 2'})
                </span>
                <span className={`font-mono font-black text-4xl tracking-wider ${
                  currentTimer <= 5 ? 'text-red-500 animate-ping' : 'text-purple-300'
                }`}>
                  {currentTimer < 10 ? `0${currentTimer}` : currentTimer}s
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={toggleTimer}
                className={`p-2.5 rounded-xl text-white font-bold transition flex items-center gap-1 shadow-md ${
                  isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={() => resetTimer(activePlayerNum === 1 ? 20 : 25)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title={`Đặt lại ${activePlayerNum === 1 ? '20s' : '25s'}`}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right: Total Combined Points */}
          <div className="bg-slate-950/90 px-6 py-3 rounded-2xl border-2 border-amber-500/60 glow-gold text-center min-w-[170px]">
            <span className="text-xs text-amber-300 font-extrabold uppercase tracking-widest block">
              Tổng Điểm
            </span>
            <div className="font-mono font-black text-4xl md:text-5xl text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]">
              {combinedTotal} <span className="text-xl text-amber-400/80">/ 200</span>
            </div>
          </div>

        </div>
      </div>

      {/* View Switcher: Display Board vs MC Inputs */}
      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === 'board'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Màn Hình Sân Khấu (Board)
          </button>
          <button
            onClick={() => setActiveTab('mc')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === 'mc'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Nhập Đáp Án & Điểm (MC)
          </button>
        </div>

        {/* Player Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Lượt thi:</span>
          <button
            onClick={() => {
              onUpdateFastMoney({ ...fastMoney, activePlayer: 1 });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              fastMoney.activePlayer === 1
                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Người 1 (20s)
          </button>
          <button
            onClick={() => {
              onUpdateFastMoney({ ...fastMoney, activePlayer: 2 });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              fastMoney.activePlayer === 2
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Người 2 (25s)
          </button>
        </div>
      </div>

      {/* Mode 1: Main Stage TV Display Board */}
      {activeTab === 'board' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          
          <div className="grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4 md:col-span-5 text-blue-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> {fastMoney.player1.name}
            </div>
            <div className="col-span-1 text-center text-blue-400">Điểm</div>
            <div className="col-span-4 md:col-span-5 text-purple-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {fastMoney.player2.name}
            </div>
            <div className="col-span-1 text-center text-purple-400">Điểm</div>
          </div>

          {fastMoney.questions.map((q, idx) => {
            const p1 = fastMoney.player1.entries[idx] || { answer: '', points: 0, revealedAnswer: false, revealedPoints: false };
            const p2 = fastMoney.player2.entries[idx] || { answer: '', points: 0, revealedAnswer: false, revealedPoints: false };

            return (
              <div key={q.id || idx} className="grid grid-cols-12 gap-2 md:gap-4 items-center">
                
                {/* Question index */}
                <div className="col-span-1 flex items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>

                {/* Player 1 Answer Box */}
                <div
                  onClick={() => toggleRevealAnswer('player1', idx)}
                  className={`col-span-4 md:col-span-5 h-14 rounded-xl border flex items-center px-4 cursor-pointer select-none transition-all ${
                    p1.revealedAnswer
                      ? 'bg-blue-950/80 border-blue-500/80 text-blue-100'
                      : 'bg-slate-900/60 border-slate-800 text-slate-600 hover:border-slate-700'
                  }`}
                >
                  <span className="font-extrabold text-base md:text-lg uppercase tracking-wide truncate">
                    {p1.revealedAnswer ? p1.answer || '—' : '••••••••••'}
                  </span>
                </div>

                {/* Player 1 Points */}
                <div
                  onClick={() => toggleRevealPoints('player1', idx)}
                  className={`col-span-1 h-14 rounded-xl border flex items-center justify-center cursor-pointer select-none transition-all ${
                    p1.revealedPoints
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-mono font-black text-xl'
                      : 'bg-slate-900/60 border-slate-800 text-slate-600'
                  }`}
                >
                  {p1.revealedPoints ? p1.points : '—'}
                </div>

                {/* Player 2 Answer Box */}
                <div
                  onClick={() => toggleRevealAnswer('player2', idx)}
                  className={`col-span-4 md:col-span-5 h-14 rounded-xl border flex items-center px-4 cursor-pointer select-none transition-all ${
                    p2.revealedAnswer
                      ? 'bg-purple-950/80 border-purple-500/80 text-purple-100'
                      : 'bg-slate-900/60 border-slate-800 text-slate-600 hover:border-slate-700'
                  }`}
                >
                  <span className="font-extrabold text-base md:text-lg uppercase tracking-wide truncate">
                    {p2.revealedAnswer ? p2.answer || '—' : '••••••••••'}
                  </span>
                </div>

                {/* Player 2 Points */}
                <div
                  onClick={() => toggleRevealPoints('player2', idx)}
                  className={`col-span-1 h-14 rounded-xl border flex items-center justify-center cursor-pointer select-none transition-all ${
                    p2.revealedPoints
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-mono font-black text-xl'
                      : 'bg-slate-900/60 border-slate-800 text-slate-600'
                  }`}
                >
                  {p2.revealedPoints ? p2.points : '—'}
                </div>

              </div>
            );
          })}

          {/* Subtotals & Grand Total Bar */}
          <div className="grid grid-cols-12 gap-2 md:gap-4 items-center pt-4 border-t border-slate-800">
            <div className="col-span-1"></div>
            <div className="col-span-4 md:col-span-5 text-right font-bold text-slate-400 text-sm">
              Điểm Người 1:
            </div>
            <div className="col-span-1 text-center font-mono font-black text-2xl text-blue-400">
              {p1Total}
            </div>
            <div className="col-span-4 md:col-span-5 text-right font-bold text-slate-400 text-sm">
              Điểm Người 2:
            </div>
            <div className="col-span-1 text-center font-mono font-black text-2xl text-purple-400">
              {p2Total}
            </div>
          </div>

        </div>
      )}

      {/* Mode 2: MC Input & Controls */}
      {activeTab === 'mc' && (
        <div className="space-y-6">
          
          {/* Quick Reveal Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400">Người 1:</span>
              <button
                onClick={() => revealAllForPlayer('player1')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Hiện Tất Cả
              </button>
              <button
                onClick={() => hideAllForPlayer('player1')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <EyeOff className="w-3.5 h-3.5" /> Ẩn Tất Cả
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400">Người 2:</span>
              <button
                onClick={() => revealAllForPlayer('player2')}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Hiện Tất Cả
              </button>
              <button
                onClick={() => hideAllForPlayer('player2')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <EyeOff className="w-3.5 h-3.5" /> Ẩn Tất Cả
              </button>
            </div>
          </div>

          {/* 5 Questions Input Cards */}
          <div className="space-y-4">
            {fastMoney.questions.map((q, idx) => {
              const p1 = fastMoney.player1.entries[idx] || { answer: '', points: 0, revealedAnswer: false, revealedPoints: false };
              const p2 = fastMoney.player2.entries[idx] || { answer: '', points: 0, revealedAnswer: false, revealedPoints: false };
              
              const isDuplicate = p1.answer && p2.answer && p1.answer.trim().toLowerCase() === p2.answer.trim().toLowerCase();

              return (
                <div key={q.id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <h3 className="font-bold text-slate-200 text-sm md:text-base">
                        "{q.question}"
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Voice input button for this question */}
                      <button
                        type="button"
                        onClick={() => handleToggleVoiceForQuestion(idx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          listeningQIndex === idx && isListening
                            ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/40'
                            : 'bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/40'
                        }`}
                        title="Bấm để nói đáp án (Tự động nhận diện và tính điểm)"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        {listeningQIndex === idx && isListening ? (
                          <span className="truncate max-w-[140px]">{interimTranscript || 'Đang nghe...'}</span>
                        ) : (
                          <span>🎤 Đọc đáp án</span>
                        )}
                      </button>

                      {/* Duplicate alert */}
                      {isDuplicate && (
                        <div className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg animate-pulse font-bold">
                          <AlertCircle className="w-3.5 h-3.5" /> Trùng câu trả lời!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Answers & Points Guide for MC */}
                  {q.answers && q.answers.length > 0 && (
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex flex-wrap gap-2 text-xs">
                      <span className="text-slate-500 font-bold">Đáp án khảo sát:</span>
                      {q.answers.map((ans, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => {
                            const targetPlayer = fastMoney.activePlayer === 1 ? 'player1' : 'player2';
                            handleEntryChange(targetPlayer, idx, 'answer', ans.text);
                            handleEntryChange(targetPlayer, idx, 'points', ans.points);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                          title="Bấm để tự động điền đáp án & điểm cho người chơi đang thi"
                        >
                          <span>{ans.text}</span>
                          <span className="font-mono text-amber-400 font-bold">({ans.points}đ)</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Inputs for Player 1 & Player 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    
                    {/* Player 1 input */}
                    <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-blue-900/40">
                      <span className="text-xs font-bold text-blue-400 shrink-0">P1:</span>
                      <input
                        type="text"
                        placeholder="Câu trả lời Người 1..."
                        value={p1.answer}
                        onChange={(e) => handleEntryChange('player1', idx, 'answer', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm text-white w-full focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Điểm"
                        value={p1.points || ''}
                        onChange={(e) => handleEntryChange('player1', idx, 'points', Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-amber-300 font-mono font-bold w-16 text-center focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => toggleRevealAnswer('player1', idx)}
                        className={`p-1.5 rounded-lg border transition ${
                          p1.revealedAnswer ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                        title="Ẩn/Hiện đáp án trên TV"
                      >
                        {p1.revealedAnswer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Player 2 input */}
                    <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-purple-900/40">
                      <span className="text-xs font-bold text-purple-400 shrink-0">P2:</span>
                      <input
                        type="text"
                        placeholder="Câu trả lời Người 2..."
                        value={p2.answer}
                        onChange={(e) => handleEntryChange('player2', idx, 'answer', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm text-white w-full focus:outline-none focus:border-purple-500"
                      />
                      <input
                        type="number"
                        placeholder="Điểm"
                        value={p2.points || ''}
                        onChange={(e) => handleEntryChange('player2', idx, 'points', Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-amber-300 font-mono font-bold w-16 text-center focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => toggleRevealAnswer('player2', idx)}
                        className={`p-1.5 rounded-lg border transition ${
                          p2.revealedAnswer ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                        title="Ẩn/Hiện đáp án trên TV"
                      >
                        {p2.revealedAnswer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
