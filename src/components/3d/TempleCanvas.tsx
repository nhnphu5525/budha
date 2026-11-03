import React, { useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TempleHall } from './TempleHall';
import { BuddhaStatue } from './BuddhaStatue';
import { IncenseBurner } from './IncenseBurner';
import { DevoteeCongregation } from './DevoteeCongregation';
import { SideBodhisattvaStatues } from './SideBodhisattvaStatues';
import { AuraParticles } from './AuraParticles';
import { DevoteeConfig, DevoteePose } from '../../types/avatar';

export type CameraView = 'devotee' | 'hall' | 'altar' | 'free';

interface TempleCanvasProps {
  cameraView: CameraView;
  userConfig: DevoteeConfig;
  userPose: DevoteePose;
  incenseCount: number;
  onPlantIncense?: () => void;
  onCompleteIncenseRitual?: () => void;
}

const CameraDirector: React.FC<{ view: CameraView }> = ({ view }) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<any>(null);

  const isPortrait = size.width < size.height;

  // Responsive FOV: Tự động mở rộng FOV trên màn hình điện thoại dọc (Portrait)
  // để bao quát 100% trọn vẹn 100 Phật tử và các hàng tượng Bồ Tát hai bên
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = isPortrait ? 76 : 48;
      camera.updateProjectionMatrix();
    }
  }, [camera, isPortrait]);

  // Enclosed Grand Sanctuary Camera Presets (Tối ưu riêng cho cả Màn hình Ngang & Dọc trên chánh điện mở rộng)
  const presets: Record<CameraView, { pos: [number, number, number]; lookAt: [number, number, number] }> = useMemo(() => ({
    // Góc nhìn qua vai Phật tử
    devotee: {
      pos: isPortrait ? [-2.2, 1.85, 6.0] : [-2.2, 1.68, 5.4],
      lookAt: isPortrait ? [-2.2, 1.35, -6.0] : [-2.2, 1.25, -6.0],
    },
    // Toàn cảnh 100 Phật tử trong chánh điện (bao quát 100% toàn bộ 100 vị Phật tử cùng lúc trên màn hình điện thoại)
    hall: {
      pos: isPortrait ? [0, 18.0, 38.0] : [0, 12.0, 31.5],
      lookAt: isPortrait ? [0, 1.8, 5.0] : [0, 2.5, 3.5],
    },
    // Cận cảnh bàn đảnh lễ và Tam Thế Phật Đài
    altar: {
      pos: isPortrait ? [0, 5.2, 11.2] : [0, 4.0, 6.8],
      lookAt: [0, 4.2, -6.0],
    },
    // Góc tự do
    free: {
      pos: isPortrait ? [0, 10.0, 22.0] : [0, 8.0, 18.0],
      lookAt: [0, 2.5, 4.0],
    },
  }), [isPortrait]);

  const isTransitioningRef = useRef(false);
  const targetPosRef = useRef(new THREE.Vector3(...presets[view].pos));
  const targetLookAtRef = useRef(new THREE.Vector3(...presets[view].lookAt));

  useEffect(() => {
    targetPosRef.current.set(...presets[view].pos);
    targetLookAtRef.current.set(...presets[view].lookAt);
    isTransitioningRef.current = true;
  }, [view, presets]);

  useFrame(() => {
    if (isTransitioningRef.current && controlsRef.current) {
      camera.position.lerp(targetPosRef.current, 0.05);
      controlsRef.current.target.lerp(targetLookAtRef.current, 0.05);

      if (camera.position.distanceTo(targetPosRef.current) < 0.08) {
        isTransitioningRef.current = false;
      }
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={isPortrait ? 0.8 : 1.0}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minDistance={1.2}
      maxDistance={50}
      target={presets[view].lookAt}
    />
  );
};

export const TempleCanvas: React.FC<TempleCanvasProps> = ({
  cameraView,
  userConfig,
  userPose,
  incenseCount,
  onPlantIncense,
  onCompleteIncenseRitual,
}) => {
  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows="basic"
        dpr={1}
        camera={{ position: [0, 18.0, 38.0], fov: 76 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        {/* Warm spiritual interior ambiance */}
        <color attach="background" args={['#140E0A']} />
        <fog attach="fog" args={['#1A120C', 26, 55]} />

        <CameraDirector view={cameraView} />

        {/* Hệ thống ánh sáng tinh gọn nhẹ GPU: 1 HemisphereLight + 1 DirectionalLight */}
        <hemisphereLight args={['#FFF2D6', '#3D271A', 1.4]} />

        <directionalLight
          position={[0, 15, 8]}
          intensity={1.75}
          color="#FFF4DC"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={2}
          shadow-camera-far={36}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-bias={-0.0008}
        />

        {/* 1. Kiến trúc Chánh Điện Khép Kín: Tường bao 4 hướng & Mái ngói tam giác hướng lên trời */}
        <TempleHall />

        {/* 2. Dãy Tôn Tượng Chư Vị Bồ Tát Dọc Hai Bên (Hướng Mặt Ra Ngoài Vào Phật Tử) */}
        <SideBodhisattvaStatues />

        {/* 3. Tôn Tượng Tam Thế Phật 3D (Đức Phật Thích Ca ngồi đài sen ở giữa + 2 Tôn Tượng ngồi tòa bình thường hai bên) */}
        <BuddhaStatue />

        {/* 4. Lư Hương Đồng 3D Khói Bay Nghi Ngút (Đặt trên bàn đảnh lễ lùi ra phía trước tại Z = 0.8m) */}
        <IncenseBurner position={[0, 0.94, 0.8]} scale={1.05} incenseCount={incenseCount} />

        {/* 5. Hào quang và các hạt bụi vàng thanh tịnh (Tinh giản số lượng hạt giảm tải GPU) */}
        <AuraParticles count={36} />

        {/* 6. ĐOÀN 100 PHẬT TỬ TỌA THIỀN (Mỗi vị trí đều có đệm bồ đoàn tròn riêng) */}
        <Suspense fallback={null}>
          <DevoteeCongregation
            userConfig={userConfig}
            userPose={userPose}
            onPlantIncense={onPlantIncense}
            onCompleteIncenseRitual={onCompleteIncenseRitual}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
