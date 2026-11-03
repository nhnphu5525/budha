import React from 'react';
import { Volume2, VolumeX, User, Sparkles, Maximize2, EyeOff } from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { DevoteeConfig } from '../../types/avatar';

interface HeaderProps {
  onOpenCustomizer: () => void;
  onOpenWisdom: () => void;
  onToggleCleanMode?: () => void;
  userConfig: DevoteeConfig;
  isAmbientPlaying: boolean;
  setIsAmbientPlaying: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCustomizer,
  onOpenWisdom,
  onToggleCleanMode,
  userConfig,
  isAmbientPlaying,
  setIsAmbientPlaying,
}) => {
  const toggleSound = () => {
    const newState = sound.toggleAmbient();
    setIsAmbientPlaying(newState);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-stone-950/95 via-stone-950/60 to-transparent pointer-events-auto">
      {/* Left Temple Brand Badge */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-base">🪷</span>
        <span className="text-xs font-serif font-bold text-amber-200 tracking-wider uppercase">
          Chánh Điện
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Live Stream Clean Mode Toggle */}
        {onToggleCleanMode && (
          <button
            onClick={onToggleCleanMode}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-amber-200/90 bg-stone-900/80 hover:bg-stone-800/80 border border-stone-700/60 backdrop-blur-md transition-all shadow-sm active:scale-95"
            title="Ẩn thanh công cụ để Live Stream sạch (Phím tắt: H)"
          >
            <EyeOff className="w-3 h-3 text-amber-400" />
            <span>Ẩn HUD</span>
          </button>
        )}

        {/* Lời Phật dạy */}
        <button
          onClick={onOpenWisdom}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-amber-200/90 bg-stone-900/80 hover:bg-amber-900/40 border border-amber-500/30 backdrop-blur-md transition-all shadow-sm active:scale-95"
          title="Rút thẻ lời Phật dạy (Pháp Cú)"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Pháp Cú</span>
        </button>

        {/* Ambient music toggle */}
        <button
          onClick={toggleSound}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border backdrop-blur-md transition-all shadow-sm active:scale-95 ${
            isAmbientPlaying
              ? 'bg-amber-600/30 text-amber-200 border-amber-400/60 shadow-amber-500/20'
              : 'bg-stone-900/80 text-stone-300 border-stone-700/50 hover:bg-stone-800/80'
          }`}
          title="Nhạc chuông thiền nền"
        >
          {isAmbientPlaying ? (
            <>
              <Volume2 className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>Nhạc</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3 h-3 text-stone-400" />
              <span>Nhạc</span>
            </>
          )}
        </button>

        {/* Devotee Profile Customizer */}
        <button
          onClick={onOpenCustomizer}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-amber-200 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 backdrop-blur-md transition-all shadow-sm active:scale-95"
          title="Tùy biến diện mạo"
        >
          <User className="w-3 h-3 text-amber-300" />
          <span className="max-w-[65px] truncate">{userConfig.name}</span>
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-full text-stone-300 hover:text-amber-200 bg-stone-900/80 border border-stone-700/50 backdrop-blur-md transition-colors active:scale-95"
          title="Toàn màn hình"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
