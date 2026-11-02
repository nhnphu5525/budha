import React, { useState } from 'react';
import { DevoteePose } from '../../types/avatar';
import { sound } from '../../audio/soundEngine';
import { Bell, FileText } from 'lucide-react';

interface ActionPanelProps {
  currentPose: DevoteePose;
  onSetPose: (p: DevoteePose) => void;
  onOfferIncense: () => void;
  onOpenPrayerModal: () => void;
  onOpenWisdomModal: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  currentPose,
  onSetPose,
  onOfferIncense,
  onOpenPrayerModal,
  onOpenWisdomModal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleStrikeBell = () => {
    sound.playBell();
  };

  const handleStrikeWoodblock = () => {
    sound.playWoodBlock();
  };

  const handleBow = () => {
    onSetPose('bow');
    sound.playChime();
    // After 4 seconds of bowing, return to prayer pose smoothly
    setTimeout(() => {
      onSetPose('pray');
    }, 4500);
  };

  const handleIncense = () => {
    onOfferIncense();
  };

  // Nút mở lại khi đã ẩn thanh công cụ: hoàn toàn không chứa Icon
  if (isCollapsed) {
    return (
      <div className="absolute bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all duration-300">
        <button
          onClick={() => {
            sound.playChime();
            setIsCollapsed(false);
          }}
          className="flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-stone-950/90 hover:bg-stone-900 border border-amber-500/40 hover:border-amber-400 text-amber-200 text-[11px] sm:text-xs font-semibold uppercase tracking-wider shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          title="Mở thanh chức năng hành lễ"
        >
          <span>Hiện Thanh Hành Lễ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-[96%] sm:w-[94%] max-w-2xl pointer-events-auto transition-all duration-300">
      <div className="p-1.5 sm:p-2.5 rounded-2xl bg-stone-950/90 border border-amber-500/30 backdrop-blur-md shadow-2xl shadow-stone-950/80 flex flex-col gap-1.5 sm:gap-2">
        {/* Thanh tiêu đề nhỏ có nút ẩn thanh công cụ */}
        <div className="flex items-center justify-between pb-1 px-1 border-b border-amber-500/15">
          <span className="text-[10px] sm:text-[11px] font-serif text-amber-300/80 tracking-wide">
            Nghi Thức Hành Lễ
          </span>
          <button
            onClick={() => {
              sound.playChime();
              setIsCollapsed(true);
            }}
            className="flex items-center justify-center px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-medium text-stone-300 hover:text-amber-200 bg-stone-900/80 hover:bg-amber-950/60 border border-stone-700/60 hover:border-amber-500/50 transition-all active:scale-95"
            title="Ẩn thanh công cụ để tránh vướng màn hình"
          >
            <span>Ẩn thanh công cụ</span>
          </button>
        </div>

        {/* Main Devotee Poses & Offerings */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          {/* Chắp tay */}
          <button
            onClick={() => onSetPose('pray')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-xl text-xs font-medium border transition-all ${
              currentPose === 'pray'
                ? 'bg-amber-600/40 text-amber-200 border-amber-400/70 shadow-sm shadow-amber-500/20'
                : 'bg-stone-900/60 text-stone-300 border-stone-800 hover:border-amber-500/40 hover:bg-stone-800/60'
            }`}
          >
            <span className="text-base sm:text-lg">🙏</span>
            <span className="text-[10px] sm:text-xs truncate">Chắp Tay</span>
          </button>

          {/* Lạy Phật */}
          <button
            onClick={handleBow}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-xl text-xs font-medium border transition-all ${
              currentPose === 'bow'
                ? 'bg-amber-600/40 text-amber-200 border-amber-400/70 shadow-sm shadow-amber-500/20 animate-pulse'
                : 'bg-stone-900/60 text-stone-300 border-stone-800 hover:border-amber-500/40 hover:bg-stone-800/60'
            }`}
          >
            <span className="text-base sm:text-lg">🙇</span>
            <span className="text-[10px] sm:text-xs truncate">Lạy Phật</span>
          </button>

          {/* Dâng hương */}
          <button
            onClick={handleIncense}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-xl text-xs font-medium border transition-all ${
              currentPose === 'incense'
                ? 'bg-amber-600/40 text-amber-200 border-amber-400/70 shadow-sm shadow-amber-500/20'
                : 'bg-stone-900/60 text-stone-300 border-stone-800 hover:border-amber-500/40 hover:bg-stone-800/60'
            }`}
          >
            <span className="text-base sm:text-lg">🕯️</span>
            <span className="text-[10px] sm:text-xs truncate">Thắp Hương</span>
          </button>

          {/* Ngồi thiền */}
          <button
            onClick={() => onSetPose('meditate')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-xl text-xs font-medium border transition-all ${
              currentPose === 'meditate'
                ? 'bg-amber-600/40 text-amber-200 border-amber-400/70 shadow-sm shadow-amber-500/20'
                : 'bg-stone-900/60 text-stone-300 border-stone-800 hover:border-amber-500/40 hover:bg-stone-800/60'
            }`}
          >
            <span className="text-base sm:text-lg">🧘</span>
            <span className="text-[10px] sm:text-xs truncate">Ngồi Thiền</span>
          </button>
        </div>

        {/* Sacred Instruments & Devotion */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 pt-1 border-t border-amber-500/15">
          {/* Thỉnh chuông */}
          <button
            onClick={handleStrikeBell}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-0.5 sm:px-1 rounded-lg text-xs font-medium text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 hover:border-amber-400 transition-all active:scale-95"
            title="Thỉnh tiếng chuông bát thanh tịnh ngân vang"
          >
            <Bell className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-300 flex-shrink-0" />
            <span className="text-[10px] sm:text-[11px] truncate">Thỉnh Chuông</span>
          </button>

          {/* Gõ mõ */}
          <button
            onClick={handleStrikeWoodblock}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-0.5 sm:px-1 rounded-lg text-xs font-medium text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 hover:border-amber-400 transition-all active:scale-95"
            title="Gõ tiếng mõ tụng kinh"
          >
            <span className="text-xs flex-shrink-0">🪵</span>
            <span className="text-[10px] sm:text-[11px] truncate">Gõ Mõ</span>
          </button>

          {/* Dâng sớ cầu an */}
          <button
            onClick={onOpenPrayerModal}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-0.5 sm:px-1 rounded-lg text-xs font-medium text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 hover:border-amber-400 transition-all active:scale-95"
            title="Viết lời nguyện cầu an dâng lên Tam Bảo"
          >
            <FileText className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-300 flex-shrink-0" />
            <span className="text-[10px] sm:text-[11px] truncate">Dâng Sớ</span>
          </button>

          {/* Xin xăm / Pháp Cú */}
          <button
            onClick={onOpenWisdomModal}
            className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-0.5 sm:px-1 rounded-lg text-xs font-medium text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 hover:border-amber-400 transition-all active:scale-95"
            title="Rút thẻ lời Phật dạy an lạc"
          >
            <span className="text-xs flex-shrink-0">📜</span>
            <span className="text-[10px] sm:text-[11px] truncate">Pháp Cú</span>
          </button>
        </div>
      </div>
    </div>
  );
};
