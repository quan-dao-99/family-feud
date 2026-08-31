import { useState } from 'react';
import type { GameState } from '../types/game';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Flame, 
  QrCode
} from 'lucide-react';
import { ChungSucLogo } from './ChungSucLogo';

interface BuzzerQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
}

export const BuzzerQrModal: React.FC<BuzzerQrModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  const [copiedTeamA, setCopiedTeamA] = useState(false);
  const [copiedTeamB, setCopiedTeamB] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const teamAUrl = `${origin}/team-a`;
  const teamBUrl = `${origin}/team-b`;

  const qrTeamA = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(teamAUrl)}`;
  const qrTeamB = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(teamBUrl)}`;

  const copyUrl = (team: 'teamA' | 'teamB') => {
    const url = team === 'teamA' ? teamAUrl : teamBUrl;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        if (team === 'teamA') {
          setCopiedTeamA(true);
          setTimeout(() => setCopiedTeamA(false), 2000);
        } else {
          setCopiedTeamB(true);
          setTimeout(() => setCopiedTeamB(false), 2000);
        }
      }).catch(() => {});
    }
  };

  const openTab = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[95vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="Đóng (Escape)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6 flex flex-col items-center">
          <ChungSucLogo variant="badge" size="md" animated={true} />
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <QrCode className="w-4 h-4" />
            <span>Mã QR Chuông Bấm 2 Đội</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
            Quét Mã QR Để Biến Điện Thoại Thành Chuông Bấm
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Người chơi mỗi đội chỉ cần mở camera điện thoại quét mã QR tương ứng để tham gia tranh chuông với độ trễ siêu thấp!
          </p>
        </div>

        {/* 2 Team Cards (Side by Side on md+, Stacked on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Card Team A */}
          <div className="bg-gradient-to-b from-red-950/70 to-slate-950 border-2 border-red-500/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-xl shadow-red-950/40 glow-red">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500 text-slate-950 font-black text-[11px] uppercase mb-2">
              <Flame className="w-3.5 h-3.5" />
              <span>ĐỘI A</span>
            </div>

            <h3 className="font-extrabold text-lg sm:text-xl text-red-300 mb-3 truncate max-w-full">
              {state.teams.teamA.name}
            </h3>

            {/* QR Code Team A */}
            <div className="bg-white p-3 rounded-2xl shadow-lg mb-3 border-2 border-red-300">
              <img
                src={qrTeamA}
                alt="QR Code Chuông Đội Đỏ"
                className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-lg"
                loading="eager"
              />
            </div>

            {/* URL input box */}
            <div className="w-full bg-slate-900 border border-red-500/30 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-red-200 mb-3 truncate text-center">
              {teamAUrl}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => copyUrl('teamA')}
                className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                {copiedTeamA ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Đã chép link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép link</span>
                  </>
                )}
              </button>

              <button
                onClick={() => openTab(teamAUrl)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95"
                title="Mở tab chuông Đội Đỏ"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mở Tab</span>
              </button>
            </div>
          </div>

          {/* Card Team B */}
          <div className="bg-gradient-to-b from-blue-950/70 to-slate-950 border-2 border-blue-500/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-xl shadow-blue-950/40 glow-blue">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500 text-slate-950 font-black text-[11px] uppercase mb-2">
              <Flame className="w-3.5 h-3.5" />
              <span>ĐỘI B</span>
            </div>

            <h3 className="font-extrabold text-lg sm:text-xl text-blue-300 mb-3 truncate max-w-full">
              {state.teams.teamB.name}
            </h3>

            {/* QR Code Team B */}
            <div className="bg-white p-3 rounded-2xl shadow-lg mb-3 border-2 border-blue-300">
              <img
                src={qrTeamB}
                alt="QR Code Chuông Đội Xanh"
                className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-lg"
                loading="eager"
              />
            </div>

            {/* URL input box */}
            <div className="w-full bg-slate-900 border border-blue-500/30 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-blue-200 mb-3 truncate text-center">
              {teamBUrl}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => copyUrl('teamB')}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                {copiedTeamB ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Đã chép link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép link</span>
                  </>
                )}
              </button>

              <button
                onClick={() => openTab(teamBUrl)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95"
                title="Mở tab chuông Đội Xanh"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mở Tab</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Điện thoại và máy chủ Game cần kết nối chung mạng Wi-Fi (LAN) để đồng bộ tự động.</span>
        </div>

      </div>

    </div>
  );
};
