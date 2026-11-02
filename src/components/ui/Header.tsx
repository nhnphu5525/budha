import React from 'react';
import { Volume2, VolumeX, User, Sparkles, Maximize2 } from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { DevoteeConfig } from '../../types/avatar';

interface HeaderProps {
  onOpenCustomizer: () => void;
  onOpenWisdom: () => void;
  userConfig: DevoteeConfig;
  isAmbientPlaying: boolean;
  setIsAmbientPlaying: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCustomizer,
  onOpenWisdom,
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
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-end px-3 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-b from-stone-950/90 via-stone-950/50 to-transparent pointer-events-auto">
      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Lời Phật dạy */}
        <button
          onClick={onOpenWisdom}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium text-amber-200/90 bg-stone-900/80 hover:bg-amber-900/40 border border-amber-500/30 backdrop-blur-md transition-all shadow-sm hover:border-amber-400"
          title="Rút thẻ lời Phật dạy (Pháp Cú)"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Pháp Cú</span>
        </button>

        {/* Ambient music toggle */}
        <button
          onClick={toggleSound}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition-all shadow-sm ${
            isAmbientPlaying
              ? 'bg-amber-600/30 text-amber-200 border-amber-400/60 shadow-amber-500/20'
              : 'bg-stone-900/80 text-stone-300 border-stone-700/50 hover:bg-stone-800/80'
          }`}
          title="Nhạc chuông thiền nền"
        >
          {isAmbientPlaying ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">Nhạc Thiền</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Nhạc Thiền</span>
            </>
          )}
        </button>

        {/* Devotee Profile Customizer */}
        <button
          onClick={onOpenCustomizer}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium text-amber-200 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 backdrop-blur-md transition-all shadow-sm hover:ring-2 hover:ring-amber-500/20"
          title="Tùy biến diện mạo"
        >
          <User className="w-3.5 h-3.5 text-amber-300" />
          <span className="max-w-[100px] truncate hidden sm:inline">{userConfig.name}</span>
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-full text-stone-300 hover:text-amber-200 bg-stone-900/80 border border-stone-700/50 backdrop-blur-md transition-colors"
          title="Toàn màn hình"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
