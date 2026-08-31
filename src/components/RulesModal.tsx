import { X, SlidersHorizontal, Zap, HelpCircle, Monitor } from 'lucide-react';
import { ChungSucLogo } from './ChungSucLogo';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto p-4 sm:p-6 shadow-2xl text-slate-200 space-y-4 sm:space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ChungSucLogo variant="icon" size="sm" animated={true} />
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-white">
                Cẩm Nang & Luật Chơi Chung Sức
              </h2>
              <span className="text-[10px] sm:text-[11px] text-amber-400 font-medium">
                Quy chuẩn gameshow truyền hình Family Feud
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 sm:space-y-5 text-xs sm:text-sm leading-relaxed">
          
          {/* Section 1: Cách Host bằng 2 Màn Hình */}
          <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
            <h3 className="font-bold text-blue-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Monitor className="w-4 h-4 shrink-0" /> 1. Mẹo Chiếu 2 Màn Hình (TV / Máy chiếu / Zoom)
            </h3>
            <p className="text-slate-300 text-[11px] sm:text-xs">
              - <strong>Màn hình TV / Máy chiếu / Khán giả</strong>: Mở màn hình game mặc định (chỉ hiển thị ô số ẩn, bảng điểm, không lộ đáp án).
              <br />
              - <strong>Máy tính / Điện thoại của MC</strong>: Truy cập đường dẫn riêng <code>?view=host</code> để mở bảng điều khiển MC (tab MC được ẩn tự động trên màn hình chính).
              <br />
              - Cả 2 tab tự động đồng bộ thời gian thực qua công nghệ <em>BroadcastChannel</em>, không cần cấu hình mạng phức tạp!
            </p>
          </div>

          {/* Section 2: Luật chơi các Vòng bảng */}
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="font-bold text-amber-400 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <SlidersHorizontal className="w-4 h-4 shrink-0" /> 2. Luật Chơi Vòng Bảng (Rounds 1 - 4)
            </h3>
            <ul className="list-disc list-inside space-y-1 text-[11px] sm:text-xs text-slate-300 ml-1">
              <li><strong>Tranh quyền mở đầu (Face-Off Buzzer)</strong>: Mỗi vòng bảng luôn bắt đầu bằng phần bấm chuông giữa 2 đội. Đội bấm trước trả lời trước:
                <ul className="list-circle list-inside ml-4 mt-0.5 space-y-0.5 text-amber-200/90">
                  <li>Nếu đoán đúng <strong>đáp án số 1 cao nhất</strong> &rarr; Thắng ngay phần tranh chuông và giữ quyền chơi cả vòng!</li>
                  <li>Nếu đoán đáp án thấp hơn (hoặc sai) &rarr; Đội bạn có cơ hội trả lời. Đội nào có đáp án cao hơn (thứ hạng điểm cao hơn) sẽ giành quyền đoán các câu còn lại!</li>
                </ul>
              </li>
              <li><strong>Đoán đáp án</strong>: Đội giữ quyền lần lượt nêu đáp án để tích lũy điểm vào <strong>Điểm Tích Lũy Vòng</strong>.</li>
              <li><strong>Dấu X (Sai)</strong>: Đoán sai nhận 1 dấu X. Đủ <strong>3X</strong> chuyển quyền cướp điểm sang đội bạn.</li>
              <li><strong>Cướp điểm (Steal)</strong>: Đội bạn đoán đúng 1 đáp án còn lại sẽ cướp toàn bộ điểm của vòng!</li>
              <li><strong>Hệ số nhân</strong>: Vòng 1, 2 (x1) &rarr; Vòng 3 (x2) &rarr; Vòng 4 (x3).</li>
            </ul>
          </div>

          {/* Section 3: Vòng Đặc Biệt */}
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="font-bold text-purple-400 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Zap className="w-4 h-4 shrink-0" /> 3. Luật Vòng Đặc Biệt (Fast Money)
            </h3>
            <ul className="list-disc list-inside space-y-1 text-[11px] sm:text-xs text-slate-300 ml-1">
              <li>Đội chiến thắng cử <strong>2 thành viên</strong> tham gia.</li>
              <li><strong>Người thứ nhất</strong>: Trả lời 5 câu hỏi trong <strong>20 giây</strong>.</li>
              <li><strong>Người thứ hai</strong>: Cách ly, trả lời cùng 5 câu hỏi trong <strong>25 giây</strong> (không được trùng đáp án với người 1).</li>
              <li><strong>Mục tiêu</strong>: Tổng điểm của 2 người đạt từ <strong>200 điểm</strong> trở lên để chiến thắng!</li>
            </ul>
          </div>

          {/* Section 4: Phím tắt & Thao tác cảm ứng */}
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="font-bold text-slate-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <HelpCircle className="w-4 h-4 shrink-0" /> 4. Phím Tắt & Thao Tác Cảm Ứng
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-mono text-amber-400 font-bold">[ 1 ] - [ 8 ]</span>: Lật / Ẩn ô đáp án (hoặc chạm trực tiếp vào ô)
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-mono text-red-400 font-bold">[ X ]</span>: Bấm sai (hoặc chạm nút +1X trên thanh công cụ)
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-mono text-indigo-400 font-bold">[ Space ]</span>: Bật Micro nhận diện giọng nói
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-mono text-amber-400 font-bold">[ N ] / [ P ]</span>: Chuyển Vòng tiếp / Vòng trước
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition active:scale-95 text-center"
          >
            Đã Hiểu & Bắt Đầu Chơi
          </button>
        </div>

      </div>
    </div>
  );
};
