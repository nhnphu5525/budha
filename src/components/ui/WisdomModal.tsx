import React, { useState } from 'react';
import { X, RefreshCw, BookmarkCheck } from 'lucide-react';
import { sound } from '../../audio/soundEngine';

interface WisdomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Verse {
  chapter: string;
  verseNum: number;
  pali?: string;
  vietnamese: string;
  meaning: string;
}

const DHAMMAPADA_VERSES: Verse[] = [
  {
    chapter: 'Phẩm Song Yếu',
    verseNum: 1,
    vietnamese: 'Ý dẫn đầu các pháp, ý làm chủ, ý tạo. Nếu với ý thanh tịnh, nói lên hay hành động, an lạc bước theo sau, như bóng không rời hình.',
    meaning: 'Tâm ý thanh tịnh sinh khởi lời nói và hành động an lành, đưa đến quả báo an vui bền vững.',
  },
  {
    chapter: 'Phẩm Song Yếu',
    verseNum: 5,
    vietnamese: 'Hận thù diệt hận thù, đời này không thể có. Từ bi diệt hận thù, là định luật ngàn thu.',
    meaning: 'Chỉ có tình thương, lòng bao dung và sự thấu hiểu mới hóa giải được mọi oán kết hận thù.',
  },
  {
    chapter: 'Phẩm Tâm',
    verseNum: 35,
    vietnamese: 'Tâm khó thấy, tế nhị, theo các dục quay cuồng. Người trí phòng hộ tâm, tâm hộ mang an lạc.',
    meaning: 'Lắng đọng tâm tư, thực tập chánh niệm để làm chủ cảm xúc, mang lại sự bình yên nội tại.',
  },
  {
    chapter: 'Phẩm Hoa',
    verseNum: 50,
    vietnamese: 'Không nên nhìn lỗi người, người làm hay không làm. Nên nhìn việc chính mình, đã làm hay chưa làm.',
    meaning: 'Tự soi chiếu và hoàn thiện bản thân mỗi ngày, tránh phán xét và thị phi trần thế.',
  },
  {
    chapter: 'Phẩm Ngàn',
    verseNum: 103,
    vietnamese: 'Dù tại bãi chiến trường, thắng ngàn ngàn quân địch. Tự thắng mình tốt hơn, thật chiến thắng oanh liệt.',
    meaning: 'Chiến thắng lớn nhất của đời người là chiến thắng bản ngã, tham ái và sân hận của chính mình.',
  },
  {
    chapter: 'Phẩm An Lạc',
    verseNum: 204,
    vietnamese: 'Không bệnh: phúc tối thượng. Biết đủ: tiền tối cao. Thành tín: bạn tối hảo. Niết bàn: lạc tối thượng.',
    meaning: 'Sức khỏe, sự biết đủ và tấm lòng chân thành chính là kho báu quý giá nhất của đời sống.',
  },
];

export const WisdomModal: React.FC<WisdomModalProps> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  if (!isOpen) return null;

  const currentVerse = DHAMMAPADA_VERSES[currentIndex];

  const handleNextVerse = () => {
    setIsRotating(true);
    sound.playChime();
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % DHAMMAPADA_VERSES.length);
      setIsRotating(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
      <div className="relative w-full max-w-lg bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl p-4 sm:p-6 text-stone-100 overflow-hidden max-h-[94vh] overflow-y-auto">
        {/* Top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div>
              <h2 className="text-lg font-bold text-amber-200 font-serif">
                Kinh Pháp Cú (Dhammapada)
              </h2>
              <p className="text-[11px] text-amber-200/60 font-serif">
                Lời Phật Dạy - Nguồn Năng Lượng An Lạc Hàng Ngày
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Content */}
        <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-[#1E1914] to-[#14100D] border border-amber-500/30 shadow-inner relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-7xl text-amber-500/10 pointer-events-none select-none font-serif">
            🪷
          </div>

          <div className="flex items-center justify-between text-xs text-amber-400/80 mb-3 font-semibold uppercase tracking-wider">
            <span>{currentVerse.chapter}</span>
            <span>Kệ số {currentVerse.verseNum}</span>
          </div>

          <blockquote className="text-base sm:text-lg text-amber-100 font-serif leading-relaxed italic border-l-2 border-amber-400/60 pl-4 my-4">
            "{currentVerse.vietnamese}"
          </blockquote>

          <div className="mt-4 pt-3 border-t border-amber-500/20 text-xs text-stone-400 flex items-start gap-2">
            <BookmarkCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-amber-200/90 font-medium">Ý nghĩa: </strong>
              {currentVerse.meaning}
            </span>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-stone-400">
            Thẻ {currentIndex + 1} / {DHAMMAPADA_VERSES.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleNextVerse}
              disabled={isRotating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-amber-200 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
              <span>Rút Thẻ Khác</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all"
            >
              Lĩnh Hội
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
