import React, { useState } from 'react';
import { TempleCanvas, CameraView } from './components/3d/TempleCanvas';
import { DevoteeConfig, DevoteePose, DEFAULT_DEVOTEE } from './types/avatar';
import { CharacterCreationScreen } from './components/character-creation/CharacterCreationScreen';
import { Header } from './components/ui/Header';
import { CameraToolbar } from './components/ui/CameraToolbar';
import { ActionPanel } from './components/ui/ActionPanel';
import { CharacterCustomizer } from './components/ui/CharacterCustomizer';
import { WisdomModal } from './components/ui/WisdomModal';
import { PrayerModal } from './components/ui/PrayerModal';
import { sound } from './audio/soundEngine';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  // Navigation: false = Character Creation Onboarding; true = Inside Grand 100-Devotee Sanctuary
  const [hasEnteredSanctuary, setHasEnteredSanctuary] = useState<boolean>(false);

  // Avatar Configuration
  const [userConfig, setUserConfig] = useState<DevoteeConfig>(DEFAULT_DEVOTEE);

  // 3D Scene States
  const [cameraView, setCameraView] = useState<CameraView>('hall');
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

  // Called when user clicks "Xác Nhận & Vào Chánh Điện" in the onboarding screen
  const handleConfirmCreation = (newConfig: DevoteeConfig) => {
    setUserConfig(newConfig);
    setHasEnteredSanctuary(true);
    setCameraView('hall');
    showToast(`🪷 Kính chào ${newConfig.name} đã bước vào Chánh Điện cùng 100 Phật tử tọa thiền.`);
  };

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

  // IF USER HAS NOT ENTERED SANCTUARY YET -> SHOW DEDICATED CHARACTER CREATION SCREEN
  if (!hasEnteredSanctuary) {
    return (
      <CharacterCreationScreen
        initialConfig={userConfig}
        onConfirm={handleConfirmCreation}
      />
    );
  }

  // ONCE ENTERED -> SHOW FULL 100-DEVOTEE 3D SANCTUARY
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0807] select-none">
      {/* 1. Header Bar */}
      <Header
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenWisdom={() => setIsWisdomOpen(true)}
        userConfig={userConfig}
        isAmbientPlaying={isAmbientPlaying}
        setIsAmbientPlaying={setIsAmbientPlaying}
      />

      {/* 2. Camera View Toolbar */}
      <CameraToolbar currentView={cameraView} onSelectView={setCameraView} />

      {/* 3. Main 3D Viewport with 100 Devotees in Enclosed Grand Sanctuary */}
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

      {/* 4. Action Panel */}
      <ActionPanel
        currentPose={userPose}
        onSetPose={handlePoseChange}
        onOfferIncense={handleOfferIncense}
        onOpenPrayerModal={() => setIsPrayerOpen(true)}
        onOpenWisdomModal={() => setIsWisdomOpen(true)}
      />

      {/* 5. Notification Toast */}
      {toastMessage && (
        <div className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce max-w-[92vw]">
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-amber-950/95 text-amber-100 text-[11px] sm:text-xs font-medium border border-amber-500/50 shadow-xl backdrop-blur-md flex items-center gap-1.5 sm:gap-2 text-center">
            <span className="flex-shrink-0">🪷</span>
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 6. Chanting ticker */}
      <div className="absolute bottom-0 left-0 right-0 z-10 py-0.5 bg-black/60 text-[8px] sm:text-[10px] text-amber-300/60 text-center tracking-wider font-serif pointer-events-none truncate px-2">
        NAM MÔ BỔN SƯ THÍCH CA MÂU NI PHẬT • NAM MÔ A DI ĐÀ PHẬT • NAM MÔ ĐẠI BI QUÁN THẾ ÂM BỒ TÁT
      </div>

      {/* 7. Interactive Modals */}
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
  );
};

export default App;
