import React, { useState, useMemo, useEffect } from 'react';
import { TempleCanvas, CameraView } from './components/3d/TempleCanvas';
import { DevoteeConfig, DevoteePose, generateRandomDevotee } from './types/avatar';
import { Header } from './components/ui/Header';
import { CameraToolbar } from './components/ui/CameraToolbar';
import { ActionPanel } from './components/ui/ActionPanel';
import { CharacterCustomizer } from './components/ui/CharacterCustomizer';
import { WisdomModal } from './components/ui/WisdomModal';
import { PrayerModal } from './components/ui/PrayerModal';
import { sound } from './audio/soundEngine';
import { Eye } from 'lucide-react';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  // Query parameters support for TikTok Live Studio & Streamers:
  // ?clean=1 or ?stream=1 -> Pure clean HUD (hides UI buttons for clean livestream)
  // ?view=hall|devotee|altar|free -> Initial camera view
  // ?audio=1 -> Auto-start ambient sound
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);

  // Avatar Configuration: Random appearance, gender, hairstyle and robe color on every load
  const [userConfig, setUserConfig] = useState<DevoteeConfig>(() => generateRandomDevotee());

  // Clean stream mode: Hides UI overlays (Header, Toolbar, Action Panel) for clean broadcast
  const [isCleanStreamMode, setIsCleanStreamMode] = useState<boolean>(() => {
    return queryParams.get('clean') === '1' || queryParams.get('stream') === '1';
  });

  // 3D Scene States
  const [cameraView, setCameraView] = useState<CameraView>(() => {
    const qView = queryParams.get('view') as CameraView;
    if (qView && ['hall', 'devotee', 'altar', 'free'].includes(qView)) {
      return qView;
    }
    return 'hall';
  });
  const [userPose, setUserPose] = useState<DevoteePose>('meditate');
  const [incenseCount, setIncenseCount] = useState<number>(3);

  // Audio State
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);

  // Modals
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isWisdomOpen, setIsWisdomOpen] = useState<boolean>(false);
  const [isPrayerOpen, setIsPrayerOpen] = useState<boolean>(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Keyboard shortcut: Press 'H' to toggle Clean Stream Mode (Ẩn/Hiện HUD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setIsCleanStreamMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autoplay ambient audio if ?audio=1 in URL
  useEffect(() => {
    if (queryParams.get('audio') === '1') {
      const startAudio = () => {
        const isPlaying = sound.toggleAmbient(true);
        setIsAmbientPlaying(isPlaying);
      };
      startAudio();
      window.addEventListener('click', startAudio, { once: true });
    }
  }, [queryParams]);

  // Offering Incense Action with Full Walking & 3-Bow Ritual
  const handleOfferIncense = () => {
    if (userPose === 'incense') return;
    setUserPose('incense');
    sound.playChime();
    showToast('🙏 Đang bước lên trước bàn lễ Phật đảnh lễ 3 lạy và dâng tâm hương...');
  };

  // Triggered right when the character plants the incense sticks into the burner after 3 bows
  const handlePlantIncense = () => {
    sound.playBell();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#FFD700', '#FFA500', '#FF69B4', '#FFF8DC'],
    });
    setIncenseCount((prev) => Math.min(prev + 1, 9));
    showToast('🙏 Đã thành kính lạy 3 lạy và cắm 3 nén tâm hương vào lư hương.');
  };

  // Triggered when the character walks back to their cushion and finishes the ritual
  const handleCompleteIncenseRitual = () => {
    setUserPose('meditate');
  };

  const handlePoseChange = (newPose: DevoteePose) => {
    setUserPose(newPose);
    if (newPose === 'meditate') {
      showToast('🧘 Đang ngồi thiền kiết già, chân xếp bằng, hai tay đặt lên gối nắm hờ.');
    } else if (newPose === 'pray') {
      showToast('🙏 Hai tay búp sen chắp trước ngực cung kính niệm Phật.');
    } else if (newPose === 'bow') {
      showToast('🙇 Thành kính đảnh lễ mười phương chư Phật.');
    }
  };

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-[#070504] flex items-center justify-center relative select-none">
      {/* Outer ambient gradient (visible only on desktop displays wider than 9:16) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1d1510] via-[#0c0907] to-[#040302]" />

      {/* Main 9:16 Viewport Container:
          100% full-bleed fit for TikTok Live Studio browser source (1080x1920 or 720x1280)
          Zero borders, zero rounded corners, zero notches, zero margins! */}
      <div
        className="relative w-full h-full max-h-[100dvh] aspect-[9/16] overflow-hidden bg-[#0a0807] flex flex-col mx-auto"
        style={{
          maxWidth: 'calc(100dvh * 9 / 16)',
          maxHeight: 'calc(100vw * 16 / 9)',
        }}
      >
        {/* 3D Grand 100-Devotee Sanctuary (Chánh Điện) */}
        <div className="relative w-full h-full overflow-hidden bg-[#0a0807] flex flex-col">
          {/* 1. Header Bar (Hidden in Clean Stream Mode) */}
          {!isCleanStreamMode && (
            <Header
              onOpenCustomizer={() => setIsCustomizerOpen(true)}
              onOpenWisdom={() => setIsWisdomOpen(true)}
              onToggleCleanMode={() => setIsCleanStreamMode(true)}
              userConfig={userConfig}
              isAmbientPlaying={isAmbientPlaying}
              setIsAmbientPlaying={setIsAmbientPlaying}
            />
          )}

          {/* 2. Camera View Toolbar (Hidden in Clean Stream Mode) */}
          {!isCleanStreamMode && (
            <CameraToolbar currentView={cameraView} onSelectView={setCameraView} />
          )}

          {/* 3. Floating Button to Restore HUD when in Clean Stream Mode */}
          {isCleanStreamMode && (
            <button
              onClick={() => setIsCleanStreamMode(false)}
              className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-amber-500/40 text-amber-200 text-[11px] font-medium shadow-xl backdrop-blur-md transition-all active:scale-95 opacity-60 hover:opacity-100"
              title="Hiện lại thanh điều khiển (Phím tắt: H)"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Hiện Menu</span>
            </button>
          )}

          {/* 4. Main 3D Viewport with 100 Devotees in Enclosed Grand Sanctuary */}
          <div className="w-full h-full">
            <TempleCanvas
              cameraView={cameraView}
              userConfig={userConfig}
              userPose={userPose}
              incenseCount={incenseCount}
              onPlantIncense={handlePlantIncense}
              onCompleteIncenseRitual={handleCompleteIncenseRitual}
            />
          </div>

          {/* 5. Action Panel (Hidden in Clean Stream Mode) */}
          {!isCleanStreamMode && (
            <ActionPanel
              currentPose={userPose}
              onSetPose={handlePoseChange}
              onOfferIncense={handleOfferIncense}
              onOpenPrayerModal={() => setIsPrayerOpen(true)}
              onOpenWisdomModal={() => setIsWisdomOpen(true)}
            />
          )}

          {/* 6. Notification Toast */}
          {toastMessage && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce max-w-[90%]">
              <div className="px-3 py-1.5 rounded-full bg-amber-950/95 text-amber-100 text-[11px] font-medium border border-amber-500/50 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-center">
                <span className="flex-shrink-0">🪷</span>
                <span className="truncate">{toastMessage}</span>
              </div>
            </div>
          )}

          {/* 7. Chanting ticker */}
          <div className="absolute bottom-0 left-0 right-0 z-10 py-0.5 bg-black/75 text-[8.5px] text-amber-300/70 text-center tracking-wider font-serif pointer-events-none truncate px-2">
            NAM MÔ BỔN SƯ THÍCH CA MÂU NI PHẬT • NAM MÔ A DI ĐÀ PHẬT • NAM MÔ ĐẠI BI QUÁN THẾ ÂM BỒ TÁT
          </div>

          {/* 8. Interactive Modals */}
          <CharacterCustomizer
            isOpen={isCustomizerOpen}
            onClose={() => setIsCustomizerOpen(false)}
            userConfig={userConfig}
            onUpdateConfig={setUserConfig}
          />

          <WisdomModal isOpen={isWisdomOpen} onClose={() => setIsWisdomOpen(false)} />

          <PrayerModal
            isOpen={isPrayerOpen}
            onClose={() => setIsPrayerOpen(false)}
            devoteeName={userConfig.name}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
