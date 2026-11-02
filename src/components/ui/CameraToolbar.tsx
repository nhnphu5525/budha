import React from 'react';
import { CameraView } from '../3d/TempleCanvas';
import { User, Users, Flame, Compass } from 'lucide-react';

interface CameraToolbarProps {
  currentView: CameraView;
  onSelectView: (v: CameraView) => void;
}

export const CameraToolbar: React.FC<CameraToolbarProps> = ({ currentView, onSelectView }) => {
  const views: { id: CameraView; label: string; shortLabel: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'hall',
      label: 'Toàn Cảnh 100 Phật Tử',
      shortLabel: 'Toàn Cảnh',
      desc: 'Bao quát đại hùng bảo điện và 100 Phật tử tọa thiền',
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      id: 'devotee',
      label: 'Phật Tử Của Bạn',
      shortLabel: 'Của Bạn',
      desc: 'Cận cảnh nhân vật Phật tử của bạn hành lễ',
      icon: <User className="w-3.5 h-3.5" />,
    },
    {
      id: 'altar',
      label: 'Phật Đài & Lư Hương',
      shortLabel: 'Phật Đài',
      desc: 'Cận cảnh Đức Phật Thích Ca Mâu Ni & Lư hương',
      icon: <Flame className="w-3.5 h-3.5" />,
    },
    {
      id: 'free',
      label: 'Tự Do 360°',
      shortLabel: '360°',
      desc: 'Xoay và phóng to thu nhỏ góc nhìn tùy ý',
      icon: <Compass className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="absolute top-14 sm:top-18 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[96vw]">
      <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-full bg-stone-950/85 border border-amber-500/35 backdrop-blur-md shadow-2xl shadow-stone-950/80 overflow-x-auto scrollbar-none">
        {views.map((v) => {
          const isActive = currentView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onSelectView(v.id)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? 'bg-amber-600/40 text-amber-200 border border-amber-400/70 shadow-sm shadow-amber-500/30'
                  : 'text-stone-300 hover:text-amber-200 hover:bg-white/5 border border-transparent'
              }`}
              title={v.desc}
            >
              <span className={isActive ? 'text-amber-300' : 'text-stone-400'}>{v.icon}</span>
              <span className="text-[11px] sm:text-[12px]">
                <span className="sm:hidden">{v.shortLabel}</span>
                <span className="hidden sm:inline">{v.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
