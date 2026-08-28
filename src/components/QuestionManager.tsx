import { useState } from 'react';
import type { Question, FastMoneyQuestion } from '../types/game';
import { DEFAULT_QUESTIONS, DEFAULT_FAST_MONEY_QUESTIONS } from '../data/defaultQuestions';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  X, 
  Sparkles, 
  Code,
  Layers
} from 'lucide-react';


interface QuestionManagerProps {
  questions: Question[];
  fastMoneyQuestions: FastMoneyQuestion[];
  onSaveQuestions: (questions: Question[], fastMoneyQuestions?: FastMoneyQuestion[]) => void;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  questions,
  fastMoneyQuestions,
  onSaveQuestions,
}) => {
  const [currentTab, setCurrentTab] = useState<'main' | 'fast-money' | 'json-raw'>('main');
  
  // State for Main Questions
  const [localQuestions, setLocalQuestions] = useState<Question[]>(questions);
  const [localFMQuestions, setLocalFMQuestions] = useState<FastMoneyQuestion[]>(fastMoneyQuestions);
  
  // Editing state for main question
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Question | null>(null);

  // Raw JSON state
  const [rawJsonText, setRawJsonText] = useState(
    JSON.stringify({ questions, fastMoneyQuestions }, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const showSuccess = () => {
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Start adding a new question
  const handleAddNewQuestion = () => {
    const newId = 'q_' + Date.now();
    const newQ: Question = {
      id: newId,
      question: 'Câu hỏi mới của bạn là gì?',
      multiplier: 1,
      category: 'Đời sống',
      answers: [
        { id: `${newId}_a1`, text: 'Đáp án 1', points: 40 },
        { id: `${newId}_a2`, text: 'Đáp án 2', points: 30 },
        { id: `${newId}_a3`, text: 'Đáp án 3', points: 20 },
        { id: `${newId}_a4`, text: 'Đáp án 4', points: 10 },
      ],
    };
    setEditFormData(newQ);
    setEditingQId(newId);
  };

  // Start editing an existing question
  const handleStartEdit = (q: Question) => {
    setEditingQId(q.id);
    setEditFormData(JSON.parse(JSON.stringify(q)));
  };

  // Save edited question
  const handleSaveEdit = () => {
    if (!editFormData) return;
    if (!editFormData.question.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    let updatedList: Question[];
    const exists = localQuestions.some((q) => q.id === editFormData.id);
    if (exists) {
      updatedList = localQuestions.map((q) => (q.id === editFormData.id ? editFormData : q));
    } else {
      updatedList = [...localQuestions, editFormData];
    }

    setLocalQuestions(updatedList);
    onSaveQuestions(updatedList, localFMQuestions);
    setEditingQId(null);
    setEditFormData(null);
    showSuccess();
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    if (localQuestions.length <= 1) {
      alert('Bạn cần giữ lại ít nhất 1 câu hỏi!');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      const updated = localQuestions.filter((q) => q.id !== id);
      setLocalQuestions(updated);
      onSaveQuestions(updated, localFMQuestions);
      showSuccess();
    }
  };

  // Helper for answer editing inside edit form
  const handleAnswerChange = (ansIndex: number, field: 'text' | 'points', val: string | number) => {
    if (!editFormData) return;
    const newAnswers = [...editFormData.answers];
    newAnswers[ansIndex] = {
      ...newAnswers[ansIndex],
      [field]: val,
    };
    setEditFormData({
      ...editFormData,
      answers: newAnswers,
    });
  };

  const handleAddAnswerRow = () => {
    if (!editFormData) return;
    if (editFormData.answers.length >= 8) {
      alert('Mỗi câu hỏi tối đa 8 đáp án theo chuẩn Chung Sức!');
      return;
    }
    const ansId = `${editFormData.id}_a_${Date.now()}`;
    setEditFormData({
      ...editFormData,
      answers: [...editFormData.answers, { id: ansId, text: '', points: 0 }],
    });
  };

  const handleDeleteAnswerRow = (index: number) => {
    if (!editFormData) return;
    if (editFormData.answers.length <= 2) {
      alert('Mỗi câu hỏi nên có tối thiểu 2 đáp án!');
      return;
    }
    const newAnswers = editFormData.answers.filter((_, i) => i !== index);
    setEditFormData({
      ...editFormData,
      answers: newAnswers,
    });
  };

  // Export JSON file
  const handleExportJson = () => {
    const data = {
      exportDate: new Date().toISOString(),
      questions: localQuestions,
      fastMoneyQuestions: localFMQuestions,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `chungsuc_questions_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            // Simple array of questions
            setLocalQuestions(parsed);
            onSaveQuestions(parsed, localFMQuestions);
          } else if (parsed.questions && Array.isArray(parsed.questions)) {
            // Full pack
            setLocalQuestions(parsed.questions);
            const fm = parsed.fastMoneyQuestions || localFMQuestions;
            setLocalFMQuestions(fm);
            onSaveQuestions(parsed.questions, fm);
          } else {
            alert('File JSON không đúng cấu trúc bộ câu hỏi!');
            return;
          }
          showSuccess();
          alert('Nhập câu hỏi từ file JSON thành công!');
        } catch {
          alert('Lỗi đọc file JSON. Vui lòng kiểm tra lại cú pháp tệp!');
        }
      };
    }
  };

  // Save Raw JSON text
  const handleSaveRawJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(rawJsonText);
      if (Array.isArray(parsed)) {
        setLocalQuestions(parsed);
        onSaveQuestions(parsed, localFMQuestions);
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        setLocalQuestions(parsed.questions);
        if (parsed.fastMoneyQuestions) {
          setLocalFMQuestions(parsed.fastMoneyQuestions);
          onSaveQuestions(parsed.questions, parsed.fastMoneyQuestions);
        } else {
          onSaveQuestions(parsed.questions, localFMQuestions);
        }
      }
      showSuccess();
      alert('Đã cập nhật bộ câu hỏi từ mã JSON!');
    } catch (err: unknown) {
      setJsonError((err as Error).message);
    }
  };

  // Reset to default sample pack
  const handleResetToDefaults = () => {
    if (window.confirm('Bạn có muốn khôi phục lại bộ câu hỏi tiếng Việt mẫu ban đầu không?')) {
      setLocalQuestions(DEFAULT_QUESTIONS);
      setLocalFMQuestions(DEFAULT_FAST_MONEY_QUESTIONS);
      onSaveQuestions(DEFAULT_QUESTIONS, DEFAULT_FAST_MONEY_QUESTIONS);
      setRawJsonText(
        JSON.stringify(
          { questions: DEFAULT_QUESTIONS, fastMoneyQuestions: DEFAULT_FAST_MONEY_QUESTIONS },
          null,
          2
        )
      );
      showSuccess();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Top Header & Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
              Ngân Hàng Dữ Liệu
            </span>
            {saveSuccessNotice && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                <Check className="w-3.5 h-3.5" /> Đã lưu thay đổi!
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white">Quản Lý & Tự Thêm Câu Hỏi</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dễ dàng thêm câu hỏi mới, chỉnh sửa đáp án, hoặc xuất/nhập file JSON để chuẩn bị cho Game Night.
          </p>
        </div>

        {/* Global import / export buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* File Upload Input */}
          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer transition shadow-sm">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Nạp File JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          {/* Export JSON Button */}
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Tải File JSON</span>
          </button>

          {/* Reset to defaults */}
          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-medium border border-slate-700 transition"
            title="Khôi phục lại các câu hỏi mẫu ban đầu"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Khôi Phục Mẫu</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('main')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              currentTab === 'main'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Câu Hỏi Vòng Bảng ({localQuestions.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('fast-money')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              currentTab === 'fast-money'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Vòng Đặc Biệt ({localFMQuestions.length})</span>
          </button>

          <button
            onClick={() => {
              setRawJsonText(
                JSON.stringify(
                  { questions: localQuestions, fastMoneyQuestions: localFMQuestions },
                  null,
                  2
                )
              );
              setCurrentTab('json-raw');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              currentTab === 'json-raw'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Soạn Mã JSON Trực Tiếp</span>
          </button>
        </div>

        {currentTab === 'main' && (
          <button
            onClick={handleAddNewQuestion}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Thêm Câu Hỏi Mới
          </button>
        )}
      </div>

      {/* Tab 1: Main Questions List & Visual Form */}
      {currentTab === 'main' && (
        <div className="space-y-4">
          
          {/* Modal / Form Edit Question */}
          {editingQId && editFormData && (
            <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-lg text-rose-400 flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  {localQuestions.some((q) => q.id === editFormData.id) ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
                </h3>
                <button
                  onClick={() => {
                    setEditingQId(null);
                    setEditFormData(null);
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Question Text & Multiplier */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nội dung câu hỏi:
                  </label>
                  <input
                    type="text"
                    value={editFormData.question}
                    onChange={(e) => setEditFormData({ ...editFormData, question: e.target.value })}
                    placeholder="Ví dụ: Kể tên một món ăn sáng phổ biến của người Việt?"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium text-base focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Chủ đề:
                  </label>
                  <input
                    type="text"
                    value={editFormData.category || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    placeholder="Ẩm thực, Đời sống..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Hệ số điểm:
                  </label>
                  <select
                    value={editFormData.multiplier}
                    onChange={(e) => setEditFormData({ ...editFormData, multiplier: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-amber-400 font-bold text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value={1}>Điểm x1 (Vòng 1, 2)</option>
                    <option value={2}>Điểm x2 (Vòng 3)</option>
                    <option value={3}>Điểm x3 (Vòng 4)</option>
                  </select>
                </div>
              </div>

              {/* Answers Grid */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Danh sách đáp án & số điểm khảo sát (Tổng điểm khảo sát nên là ~100 điểm):
                  </label>
                  <div className="text-xs font-mono">
                    Tổng điểm:{' '}
                    <span className="font-bold text-amber-400">
                      {editFormData.answers.reduce((s, a) => s + (Number(a.points) || 0), 0)} / 100
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {editFormData.answers.map((ans, idx) => (
                    <div
                      key={ans.id || idx}
                      className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800"
                    >
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`Đáp án #${idx + 1}...`}
                        value={ans.text}
                        onChange={(e) => handleAnswerChange(idx, 'text', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm text-white w-full focus:outline-none focus:border-rose-500"
                      />
                      <input
                        type="number"
                        placeholder="Điểm"
                        value={ans.points || ''}
                        onChange={(e) => handleAnswerChange(idx, 'points', Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-amber-300 font-mono font-bold w-16 text-center focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteAnswerRow(idx)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                        title="Xóa đáp án này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAddAnswerRow}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm hàng đáp án
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQId(null);
                        setEditFormData(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Lưu Câu Hỏi
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Questions Cards List */}
          <div className="space-y-3">
            {localQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-mono font-black text-sm shrink-0">
                      V{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                          Điểm x{q.multiplier}
                        </span>
                        {q.category && (
                          <span className="text-xs text-slate-400">
                            Chủ đề: {q.category}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base md:text-lg text-white">
                        "{q.question}"
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleStartEdit(q)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" /> Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded-xl text-xs border border-slate-700 transition"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Answers preview pill list */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                  {q.answers.map((a, aIdx) => (
                    <div
                      key={a.id || aIdx}
                      className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs flex items-center gap-1.5"
                    >
                      <span className="font-bold text-slate-300">{a.text}</span>
                      <span className="font-mono text-amber-400 font-bold">({a.points}đ)</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Tab 2: Fast Money Questions */}
      {currentTab === 'fast-money' && (
        <div className="space-y-4">
          <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-4 text-xs text-purple-300">
            Vòng Đặc Biệt sử dụng 5 câu hỏi khảo sát nhanh để 2 người chơi cùng trả lời trong 20s và 25s.
          </div>

          <div className="space-y-4">
            {localFMQuestions.map((q, idx) => (
              <div key={q.id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...localFMQuestions];
                      updated[idx].question = e.target.value;
                      setLocalFMQuestions(updated);
                      onSaveQuestions(localQuestions, updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium text-sm focus:outline-none focus:border-purple-500"
                    placeholder={`Nội dung câu hỏi Vòng Đặc Biệt #${idx + 1}...`}
                  />
                </div>

                {/* List answers */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                  {q.answers.map((ans, aIdx) => (
                    <div
                      key={aIdx}
                      className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs flex items-center gap-1.5"
                    >
                      <span className="text-slate-300">{ans.text}</span>
                      <span className="font-mono text-amber-400 font-bold">({ans.points}đ)</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Direct Raw JSON Text Editor */}
      {currentTab === 'json-raw' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">
                Soạn thảo nhanh qua định dạng JSON
              </h3>
              <p className="text-xs text-slate-400">
                Bạn có thể sao chép dữ liệu từ ChatGPT hoặc một tệp text rồi dán trực tiếp vào đây để nạp nhanh hàng loạt câu hỏi!
              </p>
            </div>

            <button
              onClick={handleSaveRawJson}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Lưu & Áp Dụng Mã JSON
            </button>
          </div>

          {jsonError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500 text-red-300 text-xs font-mono">
              Lỗi cú pháp JSON: {jsonError}
            </div>
          )}

          <textarea
            rows={18}
            value={rawJsonText}
            onChange={(e) => setRawJsonText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-amber-500 leading-relaxed"
            spellCheck={false}
          />
        </div>
      )}

    </div>
  );
};
