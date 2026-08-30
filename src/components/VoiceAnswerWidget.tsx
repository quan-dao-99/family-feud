import React, { useState, useRef } from 'react';
import type { Answer } from '../types/game';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { matchAnswer, type MatchResult } from '../utils/answerMatcher';
import { 
  Mic, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Settings2, 
  Eye, 
  X,
  Volume2,
  RefreshCw,
  Send
} from 'lucide-react';

interface VoiceAnswerWidgetProps {
  answers: Answer[];
  revealedAnswerIds: string[];
  multiplier?: number;
  onRevealAnswer: (id: string) => void;
  onAddStrike?: (count?: number) => void;
  className?: string;
}

export const VoiceAnswerWidget: React.FC<VoiceAnswerWidgetProps> = ({
  answers,
  revealedAnswerIds,
  multiplier = 1,
  onRevealAnswer,
  onAddStrike,
  className = '',
}) => {
  const [selectedLang, setSelectedLang] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const [autoReveal, setAutoReveal] = useState(true);
  const [autoStrike, setAutoStrike] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [lastSpokenText, setLastSpokenText] = useState('');

  const matchProcessedRef = useRef(false);

  // Speech Recognition Hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: selectedLang,
    continuous: true,
    interimResults: true,
    silenceTimeoutMs: 1100,
    onResult: (text, isFinal) => {
      if (isFinal && text) {
        setLastSpokenText(text);
        processSpokenAnswer(text);
      }
    },
  });

  // Process and evaluate spoken text
  const processSpokenAnswer = (text: string) => {
    if (!text.trim()) return;

    const result = matchAnswer(text, answers, revealedAnswerIds);
    setMatchResult(result);
    matchProcessedRef.current = true;

    // Auto actions if configured
    if (result.status === 'MATCH_NEW' && result.matchedAnswer) {
      if (autoReveal) {
        onRevealAnswer(result.matchedAnswer.id);
      }
    } else if (result.status === 'NO_MATCH') {
      if (autoStrike && onAddStrike) {
        onAddStrike(1);
      }
    }
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      setMatchResult(null);
      resetTranscript();
      matchProcessedRef.current = false;
      startListening(selectedLang);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setLastSpokenText(manualInput.trim());
    processSpokenAnswer(manualInput.trim());
    setManualInput('');
  };

  const handleManualReveal = () => {
    if (matchResult?.matchedAnswer) {
      onRevealAnswer(matchResult.matchedAnswer.id);
      setMatchResult({
        ...matchResult,
        status: 'MATCH_ALREADY_REVEALED',
        message: `Đã lật ô "${matchResult.matchedAnswer.text}"!`,
      });
    }
  };

  const handleManualStrike = () => {
    if (onAddStrike) {
      onAddStrike(1);
    }
  };

  // Find index of matching answer in current answers list
  const matchedAnswerIndex = matchResult?.matchedAnswer
    ? answers.findIndex((a) => a.id === matchResult.matchedAnswer?.id)
    : -1;

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl ${className}`}>
      
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3 pb-2 sm:pb-2.5 border-b border-indigo-500/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-xs sm:text-sm md:text-base text-slate-100 flex items-center gap-1">
                Nhận Diện Giọng Nói
              </h3>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-bold border border-indigo-500/40 uppercase">
                AI Match
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400">
              Bấm Micro để nghe câu trả lời và tự động so khớp
            </p>
          </div>
        </div>

        {/* Quick Settings Toggle Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 sm:p-2 rounded-xl border transition ${
            showSettings
              ? 'bg-indigo-600 text-white border-indigo-400'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Tùy chọn nhận diện giọng nói"
        >
          <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Expandable Settings */}
      {showSettings && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Language Selection */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">Ngôn ngữ:</label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as 'vi-VN' | 'en-US')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="vi-VN">Tiếng Việt (vi-VN)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </div>

            {/* Auto Reveal Toggle */}
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
              <label className="text-slate-400 font-bold">Tự động lật ô đúng:</label>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={autoReveal}
                  onChange={(e) => setAutoReveal(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-2 text-[11px] font-semibold text-slate-300">
                  {autoReveal ? 'Bật (Tự lật)' : 'Tắt (MC duyệt)'}
                </span>
              </label>
            </div>

            {/* Auto Strike Toggle */}
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
              <label className="text-slate-400 font-bold">Tự động phạt khi sai:</label>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={autoStrike}
                  onChange={(e) => setAutoStrike(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                <span className="ml-2 text-[11px] font-semibold text-slate-300">
                  {autoStrike ? 'Bật (+1X)' : 'Tắt (MC bấm)'}
                </span>
              </label>
            </div>

          </div>
        </div>
      )}

      {/* Browser Support Warning */}
      {!isSupported && (
        <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-bold">Trình duyệt không hỗ trợ Web Speech API!</p>
            <p className="text-slate-400">
              Vui lòng dùng Google Chrome, Microsoft Edge hoặc Safari để sử dụng Micro. Bạn vẫn có thể dùng ô gõ thử bên dưới.
            </p>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-2.5 text-xs text-amber-300 flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="truncate">{error}</span>
          </div>
          <button
            onClick={() => handleToggleMic()}
            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded font-bold shrink-0"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Main Mic Button & Live Waveform Controller */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        
        {/* Big Interactive Mic Button */}
        <button
          onClick={handleToggleMic}
          disabled={!isSupported}
          className={`px-5 py-3.5 rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg select-none ${
            isListening
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 ring-4 ring-red-500/30 animate-pulse'
              : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isListening ? (
            <>
              <div className="relative">
                <Mic className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-300 rounded-full animate-ping" />
              </div>
              <span>Đang Lắng Nghe... (Bấm để dừng)</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>🎤 Bấm Để Nghe Đáp Án</span>
            </>
          )}
        </button>

        {/* Live Audio Visualizer / Status Indicator */}
        <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 flex flex-col justify-center min-h-[52px] space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 truncate mr-2">
              {isListening ? (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-4 bg-red-500 rounded-full animate-[bounce_0.8s_infinite_100ms]" />
                  <span className="w-1.5 h-5 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_200ms]" />
                  <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-[bounce_0.8s_infinite_300ms]" />
                </div>
              ) : (
                <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
              )}

              <div className="truncate">
                {isListening ? (
                  <span className="text-xs md:text-sm font-semibold text-amber-300 italic truncate block">
                    {interimTranscript || transcript || 'Mời người chơi nói (Hệ thống đang nghe)...'}
                  </span>
                ) : lastSpokenText ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs text-slate-400">Vừa nói:</span>
                    <span className="text-xs md:text-sm font-bold text-white truncate">
                      "{lastSpokenText}"
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">
                    Chưa có giọng nói nào được ghi nhận.
                  </span>
                )}
              </div>
            </div>

            {lastSpokenText && (
              <button
                onClick={() => {
                  setLastSpokenText('');
                  setMatchResult(null);
                  resetTranscript();
                }}
                className="p-1 text-slate-500 hover:text-slate-300 shrink-0"
                title="Xóa kết quả"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Real-time Mic Audio Volume Meter */}
          {isListening && (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[10px] text-slate-500 font-mono shrink-0">Tín hiệu Mic:</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    audioLevel > 50
                      ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500'
                      : audioLevel > 15
                      ? 'bg-emerald-400'
                      : 'bg-slate-600'
                  }`}
                  style={{ width: `${Math.max(4, audioLevel)}%` }}
                />
              </div>
              <span className={`text-[10px] font-mono font-bold shrink-0 ${audioLevel > 5 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {audioLevel > 5 ? `${audioLevel}%` : 'Chờ âm...'}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Match Result Banner Display */}
      {matchResult && (
        <div className="mt-3">
          {matchResult.status === 'MATCH_NEW' && matchResult.matchedAnswer && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border-2 border-emerald-500/80 shadow-lg shadow-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-xs">
                      ĐÚNG ĐÁP ÁN #{matchedAnswerIndex + 1}
                    </span>
                    <span className="text-xs text-emerald-300 font-mono">
                      (Độ khớp: {Math.round(matchResult.similarity * 100)}%)
                    </span>
                  </div>
                  <p className="font-extrabold text-white text-base md:text-lg mt-0.5">
                    "{matchResult.matchedAnswer.text}" — <span className="text-yellow-400 font-mono">{matchResult.matchedAnswer.points * multiplier} điểm</span>
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {autoReveal ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã tự động lật ô!
                  </span>
                ) : (
                  <button
                    onClick={handleManualReveal}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> Lật Ô Này Ngay
                  </button>
                )}
              </div>
            </div>
          )}

          {matchResult.status === 'MATCH_ALREADY_REVEALED' && matchResult.matchedAnswer && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/60 flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-200">
                    Đáp án "#{matchedAnswerIndex + 1}: {matchResult.matchedAnswer.text}" đã được lật trước đó!
                  </p>
                  <p className="text-xs text-amber-300/70">
                    Người chơi cần nêu một đáp án khác chưa mở.
                  </p>
                </div>
              </div>
            </div>
          )}

          {matchResult.status === 'NO_MATCH' && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/70 shadow-lg shadow-red-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-xs">
                      KHÔNG CÓ TRONG BẢNG
                    </span>
                    {matchResult.similarity > 0 && (
                      <span className="text-xs text-red-300 font-mono">
                        (Khớp cao nhất: {Math.round(matchResult.similarity * 100)}%)
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 mt-0.5">
                    Câu trả lời "{lastSpokenText}" không khớp với bất kỳ đáp án nào của câu hỏi này.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              {onAddStrike && (
                <button
                  onClick={handleManualStrike}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md transition shrink-0 self-end sm:self-auto"
                >
                  <X className="w-4 h-4 stroke-[3]" /> Phạt 1X (Bấm sai)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Text Tester Bar (For typing test or testing without mic) */}
      <form onSubmit={handleManualSubmit} className="mt-3 pt-2.5 border-t border-indigo-500/20 flex items-center gap-2">
        <span className="text-slate-500 text-xs hidden md:inline shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Hoặc gõ thử:
        </span>
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Nhập câu trả lời để kiểm tra so khớp..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
        />
        <button
          type="submit"
          disabled={!manualInput.trim()}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
        >
          <Send className="w-3 h-3" />
          Thử So Khớp
        </button>
      </form>

    </div>
  );
};
