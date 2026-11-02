import React, { useState } from 'react';
import { X, Send, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import confetti from 'canvas-confetti';

interface PrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  devoteeName: string;
  onPrayerSubmitted?: (prayerText: string) => void;
}

export const PrayerModal: React.FC<PrayerModalProps> = ({
  isOpen,
  onClose,
  devoteeName,
  onPrayerSubmitted,
}) => {
  const [prayerType, setPrayerType] = useState<'cau_an' | 'cau_sieu' | 'phat_nguyen'>('cau_an');
  const [author, setAuthor] = useState(devoteeName || 'Diệu Tâm');
  const [content, setContent] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    sound.playBell();

    // Golden sparkles celebration
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#FFF8DC', '#FF69B4'],
    });

    setIsSuccess(true);
    if (onPrayerSubmitted) {
      onPrayerSubmitted(content);
    }

    setTimeout(() => {
      setIsSuccess(false);
      setContent('');
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl p-4 sm:p-6 text-stone-100 overflow-hidden max-h-[94vh] overflow-y-auto">
        {/* Top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div>
              <h2 className="text-lg font-bold text-amber-200 font-serif">
                Dâng Sớ Lễ Phật
              </h2>
              <p className="text-[11px] text-amber-200/60 font-serif">
                Thành tâm phát nguyện - Hồi hướng công đức
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

        {isSuccess ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-amber-400 animate-bounce" />
            <h3 className="text-lg font-bold text-amber-200 font-serif">
              Đã Thành Kính Dâng Lên Tam Bảo
            </h3>
            <p className="text-xs text-stone-300 max-w-xs leading-relaxed">
              Nguyện mười phương chư Phật gia hộ cho sở nguyện của quý đạo hữu được viên thành, thân tâm thường an lạc.
            </p>
            <span className="text-xs text-amber-300/80 italic font-serif">Nam Mô A Di Đà Phật 🙏</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            {/* Loại sớ */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1.5 uppercase tracking-wider">
                Mục Đích Dâng Sớ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cau_an', label: 'Cầu An' },
                  { id: 'cau_sieu', label: 'Cầu Siêu' },
                  { id: 'phat_nguyen', label: 'Phát Nguyện' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPrayerType(item.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                      prayerType === item.id
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-sm'
                        : 'bg-stone-950/40 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Đệ tử dâng sớ */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1.5 uppercase tracking-wider">
                Đệ Tử / Gia Chủ
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-stone-950/80 border border-amber-500/30 text-amber-100 focus:outline-none focus:border-amber-400 text-sm"
                placeholder="Pháp danh hoặc họ tên..."
              />
            </div>

            {/* Nội dung sớ */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1.5 uppercase tracking-wider">
                Nội Dung Lời Cầu Nguyện
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                required
                placeholder="Cầu cho gia đạo bình an, sức khỏe dồi dào, tai qua nạn khỏi, tâm trí an nhiên..."
                className="w-full px-3.5 py-2 rounded-xl bg-stone-950/80 border border-amber-500/30 text-amber-100 focus:outline-none focus:border-amber-400 text-sm resize-none"
              ></textarea>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-900/40 transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Thành Kính Dâng Lên</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
