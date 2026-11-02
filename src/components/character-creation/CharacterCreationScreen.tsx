import React, { useState } from 'react';
import { DevoteeConfig, Gender, HairStyle, BottomType, DevoteePose, PRESET_ROBES } from '../../types/avatar';
import { AvatarPreviewCanvas } from '../3d/AvatarPreviewCanvas';
import { Shuffle, Info } from 'lucide-react';
import { sound } from '../../audio/soundEngine';

interface CharacterCreationScreenProps {
  initialConfig: DevoteeConfig;
  onConfirm: (config: DevoteeConfig) => void;
}

export const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({
  initialConfig,
  onConfirm,
}) => {
  const [config, setConfig] = useState<DevoteeConfig>(initialConfig);
  const [previewPose, setPreviewPose] = useState<DevoteePose>('pray');

  const randomNames = [
    'Diệu Tâm',
    'Thiện Nhân',
    'Tuệ Minh',
    'Vạn An',
    'An Nhiên',
    'Diệu Hạnh',
    'Chân Thiện',
    'Phúc Quang',
    'Thanh Tâm',
    'Minh Đức',
  ];

  const handleRandomize = () => {
    const rName = randomNames[Math.floor(Math.random() * randomNames.length)];
    const rGender: Gender = Math.random() > 0.5 ? 'male' : 'female';
    const rHair: HairStyle = ['bald', 'short', 'long'][Math.floor(Math.random() * 3)] as HairStyle;
    const rBottom: BottomType = 'pants';
    const rRobe = PRESET_ROBES[Math.floor(Math.random() * PRESET_ROBES.length)];

    setConfig({
      name: rName,
      gender: rGender,
      hairStyle: rHair,
      bottomType: rBottom,
      robeColor: rRobe.hex,
      robeName: rRobe.name,
    });
    sound.playChime();
  };

  const handleConfirm = () => {
    let finalName = (config.name || '').trim().replace(/^(phật tử|phật\s*tử)\s*/i, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '');
    if (!finalName) finalName = 'Diệu Tâm';
    if (finalName.length > 15) finalName = finalName.slice(0, 15).trim();
    sound.playBell();
    onConfirm({ ...config, name: finalName });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0e0b09] text-stone-100 flex flex-col">
      {/* Top Header */}
      <header className="z-10 px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between border-b border-amber-500/20 bg-stone-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-900/60 border border-amber-500/40 flex items-center justify-center shadow-lg text-base sm:text-xl flex-shrink-0">
            🪷
          </div>
          <div>
            <h1 className="text-sm sm:text-lg font-bold text-amber-200 tracking-wider font-serif uppercase">
              Cổng Tam Quan • Khởi Tạo Phật Tử
            </h1>
            <p className="hidden sm:block text-xs text-amber-100/70 font-serif">
              Tùy chỉnh sắc phục và diện mạo trang nghiêm trước khi bước vào Chánh Điện
            </p>
          </div>
        </div>

        <button
          onClick={handleRandomize}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-amber-200 bg-stone-900/80 hover:bg-amber-900/40 border border-amber-500/30 transition-all active:scale-95 flex-shrink-0"
          title="Chọn ngẫu nhiên"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xs:inline">Ngẫu Nhiên</span>
        </button>
      </header>

      {/* Main Container: 3D Stage on Left, Options on Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 relative">
        {/* Left: 3D Live Interactive Avatar Viewport (7 cols) */}
        <div className="lg:col-span-7 h-[38vh] sm:h-[42vh] lg:h-full relative flex flex-col bg-gradient-to-b from-[#181310] via-[#120e0c] to-[#0a0807]">
          {/* 3D Canvas */}
          <div className="flex-1 w-full h-full">
            <AvatarPreviewCanvas config={config} previewPose={previewPose} />
          </div>

          {/* Floating Instructions & Pose Switcher */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-950/70 border border-amber-500/20 text-[11px] text-amber-200/80 backdrop-blur-sm pointer-events-none">
            <Info className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span>Chạm vuốt để xoay 360°</span>
          </div>

          {/* Pose Selector for Preview */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 p-1 rounded-full bg-stone-950/85 border border-amber-500/30 backdrop-blur-md shadow-xl max-w-[94vw]">
            <button
              onClick={() => setPreviewPose('pray')}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all ${
                previewPose === 'pray'
                  ? 'bg-amber-600/40 text-amber-200 border border-amber-400/60'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              🙏 Đứng Chắp Tay
            </button>
            <button
              onClick={() => setPreviewPose('meditate')}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all ${
                previewPose === 'meditate'
                  ? 'bg-amber-600/40 text-amber-200 border border-amber-400/60'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              🧘 Ngồi Thiền
            </button>
          </div>
        </div>

        {/* Right: Customization Controls (5 cols) */}
        <div className="lg:col-span-5 h-[62vh] sm:h-[58vh] lg:h-full overflow-y-auto p-4 sm:p-7 pb-10 sm:pb-7 bg-[#15110E] border-t lg:border-t-0 lg:border-l border-amber-500/20 flex flex-col justify-between">
          <div className="space-y-5">
            {/* 1. Tên / Pháp danh (Tối đa 15 ký tự, không icon, không tiền tố Phật tử) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                  1. Tên / Pháp Danh
                </label>
                <span className="text-[10px] text-amber-400/80">
                  {config.name.length}/15 ký tự
                </span>
              </div>
              <input
                type="text"
                value={config.name}
                onChange={(e) => {
                  let val = e.target.value.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '');
                  val = val.replace(/^(phật tử|phật\s*tử)\s*/i, '');
                  setConfig({ ...config, name: val.slice(0, 15) });
                }}
                maxLength={15}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-amber-500/40 text-amber-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm font-medium"
                placeholder="Nhập tên / pháp danh..."
              />
            </div>

            {/* 2. Giới tính: 2 option Nam, Nữ, không chứa icon */}
            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1.5 uppercase tracking-wider">
                2. Giới Tính
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, gender: 'male' })}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center text-xs font-semibold transition-all ${
                    config.gender === 'male'
                      ? 'bg-amber-600/35 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  Nam
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, gender: 'female' })}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center text-xs font-semibold transition-all ${
                    config.gender === 'female'
                      ? 'bg-amber-600/35 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  Nữ
                </button>
              </div>
            </div>

            {/* 3. Kiểu tóc: 3 option Xuất gia, Gọn gàng, Búi sen, không chứa icon */}
            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1.5 uppercase tracking-wider">
                3. Kiểu Tóc
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, hairStyle: 'bald' })}
                  className={`py-2.5 px-2 rounded-xl border flex items-center justify-center text-xs transition-all ${
                    config.hairStyle === 'bald'
                      ? 'bg-amber-600/35 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/40 font-semibold'
                      : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700 font-medium'
                  }`}
                >
                  Xuất gia
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, hairStyle: 'short' })}
                  className={`py-2.5 px-2 rounded-xl border flex items-center justify-center text-xs transition-all ${
                    config.hairStyle === 'short'
                      ? 'bg-amber-600/35 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/40 font-semibold'
                      : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700 font-medium'
                  }`}
                >
                  Gọn gàng
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, hairStyle: 'long' })}
                  className={`py-2.5 px-2 rounded-xl border flex items-center justify-center text-xs transition-all ${
                    config.hairStyle === 'long'
                      ? 'bg-amber-600/35 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/40 font-semibold'
                      : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700 font-medium'
                  }`}
                >
                  Búi sen
                </button>
              </div>
            </div>

            {/* 4. Sắc phục áo tràng */}
            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>4. Sắc Phục Áo Tràng</span>
                <span className="text-[11px] text-amber-200 font-normal">
                  {PRESET_ROBES.find((r) => r.hex === config.robeColor)?.name || 'Màu tùy chọn'}
                </span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_ROBES.map((r) => {
                  const isSelected = config.robeColor === r.hex;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setConfig({ ...config, robeColor: r.hex, robeName: r.name })}
                      className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-400/40 shadow-md'
                          : 'border-stone-800 bg-stone-900/60 hover:border-stone-700'
                      }`}
                      title={r.desc}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-white/25 shadow-inner"
                        style={{ backgroundColor: r.hex }}
                      />
                      <span className="text-[10px] text-stone-300 truncate max-w-full font-medium">
                        {r.name.replace('Áo ', '')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Picker input */}
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="color"
                  value={config.robeColor}
                  onChange={(e) => setConfig({ ...config, robeColor: e.target.value, robeName: 'Màu tự chọn' })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  title="Chọn màu tự do"
                />
                <span className="text-[11px] text-stone-400">
                  Hoặc bấm vào ô màu để chọn sắc thái tùy thích ({config.robeColor})
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Button: Không có 100 phật tử, không chứa icon */}
          <div className="pt-4 sm:pt-6 border-t border-amber-500/20 mt-4 sm:mt-6">
            <button
              onClick={handleConfirm}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm tracking-wider shadow-xl shadow-amber-950/60 flex items-center justify-center transition-all active:scale-[0.98]"
            >
              VÀO CHÁNH ĐIỆN
            </button>
            <p className="text-[11px] text-stone-400 text-center mt-2 font-serif italic">
              "Thành tâm quy hướng Tam Bảo • Thân tâm thường an lạc"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
