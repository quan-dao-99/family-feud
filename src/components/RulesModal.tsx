import { X, BookOpen, SlidersHorizontal, Zap, HelpCircle, Monitor } from 'lucide-react';


interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-slate-200 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Cẩm Nang & Luật Chơi Chung Sức
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 text-sm leading-relaxed">
          
          {/* Section 1: Cách Host bằng 2 Màn Hình */}
          <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-blue-300 flex items-center gap-2">
              <Monitor className="w-4 h-4" /> 1. Mẹo Chiếu 2 Màn Hình (TV / Máy chiếu / Zoom)
            </h3>
            <p className="text-slate-300 text-xs">
              - <strong>Màn hình TV/Máy chiếu/Chia sẻ Zoom</strong>: Mở tab <strong>Màn Hình Game</strong> (chỉ hiện ô số ẩn và điểm số).
              <br />
              - <strong>Máy tính của MC/Host</strong>: Mở tab <strong>Bảng MC (Host)</strong> để xem toàn bộ đáp án trước và bấm lật ô/bấm sai.
              <br />
              - Cả 2 tab tự động đồng bộ thời gian thực qua công nghệ <em>BroadcastChannel</em>, không cần kết nối mạng phức tạp!
            </p>
          </div>

          {/* Section 2: Luật chơi các Vòng bảng */}
          <div className="space-y-2">
            <h3 className="font-bold text-amber-400 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> 2. Luật Chơi Vòng Bảng (Rounds 1 - 4)
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 ml-1">
              <li><strong>Tranh quyền mở đầu</strong>: Đại diện 2 đội lên bấm chuông. Đội bấm trước được trả lời. Nếu đoán được đáp án số #1 (nhiều điểm nhất), đội đó được chọn Chơi hoặc Nhường.</li>
              <li><strong>Đoán đáp án</strong>: Đội giữ quyền lần lượt nêu đáp án. Mỗi đáp án đúng sẽ lật mở ô và tích lũy điểm vào <strong>Điểm Tích Lũy Vòng</strong>.</li>
              <li><strong>Dấu X (Sai)</strong>: Nếu đoán sai hoặc lặp lại đáp án đã có, đội chơi nhận 1 dấu X.</li>
              <li><strong>Cướp điểm (Steal)</strong>: Khi đội chơi bị <strong>3X</strong>, đội đối thủ chỉ cần cử 1 người đoán đúng 1 đáp án còn lại chưa lật là cướp toàn bộ điểm của vòng đó! Nếu đoán sai, điểm thuộc về đội chơi ban đầu.</li>
              <li><strong>Hệ số nhân</strong>: Vòng 1, 2 (x1 điểm) &rarr; Vòng 3 (x2 điểm) &rarr; Vòng 4 (x3 điểm).</li>
            </ul>
          </div>

          {/* Section 3: Vòng Đặc Biệt */}
          <div className="space-y-2">
            <h3 className="font-bold text-purple-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> 3. Luật Vòng Đặc Biệt (Fast Money)
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 ml-1">
              <li>Đội có tổng điểm cao nhất sau các vòng bảng cử <strong>2 thành viên</strong> tham gia.</li>
              <li><strong>Người thứ nhất</strong>: Trả lời 5 câu hỏi trong vòng <strong>20 giây</strong>.</li>
              <li><strong>Người thứ hai</strong>: Phải đeo tai nghe hoặc cách ly. Trả lời cùng 5 câu hỏi trong <strong>25 giây</strong> và không được trùng đáp án với người thứ nhất (nếu trùng sẽ nghe tiếng còi và phải đổi ngay).</li>
              <li><strong>Mục tiêu chiến thắng</strong>: Tổng điểm của 2 người đạt từ <strong>200 điểm</strong> trở lên để rinh Giải Thưởng Đặc Biệt!</li>
            </ul>
          </div>

          {/* Section 4: Phím tắt */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-300 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> 4. Bảng Phím Tắt Nhanh (Keyboard Shortcuts)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-mono text-amber-400 font-bold">[ 1 ] - [ 8 ]</span>: Lật / Ẩn ô đáp án
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-mono text-red-400 font-bold">[ X ]</span>: Bấm sai (Thêm 1 Strike)
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-mono text-indigo-400 font-bold">[ Space ]</span>: Bật/Tắt nhận diện giọng nói
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-mono text-emerald-400 font-bold">[ A ] / [ Z ]</span>: Chuông Đội Đỏ
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-mono text-blue-400 font-bold">[ L ] / [ M ]</span>: Chuông Đội Xanh
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Đã Hiểu & Bắt Đầu Chơi
          </button>
        </div>

      </div>
    </div>
  );
};
