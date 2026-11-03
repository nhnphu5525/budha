import React, { useState } from 'react';
import { DevoteeConfig, HairStyle, PRESET_ROBES, generateRandomDevotee } from '../../types/avatar';
import { X, Shuffle } from 'lucide-react';
import { sound } from '../../audio/soundEngine';

interface CharacterCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  userConfig: DevoteeConfig;
  onUpdateConfig: (config: DevoteeConfig) => void;
}

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  isOpen,
  onClose,
  userConfig,
  onUpdateConfig,
}) => {
  const [form, setForm] = useState<DevoteeConfig>(userConfig);

  if (!isOpen) return null;

  const suggestions = [
    'Diệu Tâm',
    'Thiện Nhân',
    'An Lạc',
    'Tuệ Minh',
    'Vạn Hạnh',
    'Diệu Âm',
  ];

  const handleRandomize = () => {
    const random = generateRandomDevotee();
    setForm(random);
    sound.playChime();
  };

  const handleSave = () => {
    let finalName = (form.name || '').trim().replace(/^(phật tử|phật\s*tử)\s*/i, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '');
    if (!finalName) finalName = 'Diệu Tâm';
    if (finalName.length > 15) finalName = finalName.slice(0, 15).trim();
    onUpdateConfig({ ...form, name: finalName });
    sound.playChime();
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm pointer-events-auto">
      <div className="relative w-full max-w-[94%] bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl p-4 text-stone-100 overflow-hidden max-h-[90%] flex flex-col">
        {/* Top glow border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪷</span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-amber-200 font-serif">
                Tùy Biến Diện Mạo
              </h2>
              <p className="text-[10px] text-amber-200/60 font-serif">
                Hình hài, pháp danh & y phục
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRandomize}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-amber-200 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/35 transition-all active:scale-95"
              title="Đổi diện mạo ngẫu nhiên"
            >
              <Shuffle className="w-3 h-3 text-amber-400" />
              <span>Ngẫu Nhiên</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1">
          {/* Pháp danh / Tên (Tối đa 15 ký tự, không icon, không tiền tố Phật tử) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider">
                Tên / Pháp Danh
              </label>
              <span className="text-[10px] text-amber-400/80">
                {form.name.length}/15 ký tự
              </span>
            </div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                let val = e.target.value.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '');
                val = val.replace(/^(phật tử|phật\s*tử)\s*/i, '');
                setForm({ ...form, name: val.slice(0, 15) });
              }}
              maxLength={15}
              className="w-full px-3.5 py-2 rounded-xl bg-stone-950/80 border border-amber-500/30 text-amber-100 focus:outline-none focus:border-amber-400 text-sm"
              placeholder="Nhập tên / pháp danh..."
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, name: s })}
                  className="px-2 py-0.5 rounded-md text-[11px] bg-stone-800/80 hover:bg-amber-900/40 text-stone-300 hover:text-amber-200 border border-stone-700/60 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Giới tính: 2 option Nam, Nữ, không chứa icon */}
          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1 uppercase tracking-wider">
              Giới Tính
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, gender: 'male' })}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center text-xs font-semibold transition-all ${
                  form.gender === 'male'
                    ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-sm'
                    : 'bg-stone-950/50 border-stone-800 text-stone-300 hover:border-stone-700'
                }`}
              >
                Nam
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, gender: 'female' })}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center text-xs font-semibold transition-all ${
                  form.gender === 'female'
                    ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-sm'
                    : 'bg-stone-950/50 border-stone-800 text-stone-300 hover:border-stone-700'
                }`}
              >
                Nữ
              </button>
            </div>
          </div>

          {/* Kiểu tóc: 3 option Xuất gia, Gọn gàng, Búi sen, không chứa icon */}
          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1 uppercase tracking-wider">
              Kiểu Tóc
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bald', label: 'Xuất gia' },
                { id: 'short', label: 'Gọn gàng' },
                { id: 'long', label: 'Búi sen' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setForm({ ...form, hairStyle: item.id as HairStyle })}
                  className={`py-2 px-1 rounded-xl border flex items-center justify-center text-xs transition-all ${
                    form.hairStyle === item.id
                      ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-sm font-semibold'
                      : 'bg-stone-950/50 border-stone-800 text-stone-300 hover:border-stone-700 font-medium'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sắc phục áo tràng */}
          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1 uppercase tracking-wider">
              Sắc Phục Áo Tràng
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_ROBES.map((r) => {
                const isSelected = form.robeColor === r.hex;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setForm({ ...form, robeColor: r.hex, robeName: r.name })}
                    className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/60 ring-1 ring-amber-400/40'
                        : 'border-stone-800 bg-stone-950/40'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-inner"
                      style={{ backgroundColor: r.hex }}
                    />
                    <span className="text-[10px] text-stone-300 truncate max-w-full">
                      {r.name.replace('Áo ', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-900/40 transition-all active:scale-95"
          >
            Cập Nhật Diện Mạo
          </button>
        </div>
      </div>
    </div>
  );
};
