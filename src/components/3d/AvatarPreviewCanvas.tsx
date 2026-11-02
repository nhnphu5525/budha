import React, { useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { HumanoidDevotee } from './HumanoidDevotee';
import { DevoteeConfig, DevoteePose } from '../../types/avatar';

interface AvatarPreviewCanvasProps {
  config: DevoteeConfig;
  previewPose: DevoteePose;
}

const ResponsiveCamera: React.FC = () => {
  const { camera, size } = useThree();
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const isPortrait = size.width < size.height;
      camera.fov = isPortrait ? 50 : 42;
      camera.position.set(0, isPortrait ? 1.25 : 1.2, isPortrait ? 3.0 : 2.7);
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height]);
  return null;
};

export const AvatarPreviewCanvas: React.FC<AvatarPreviewCanvasProps> = ({ config, previewPose }) => {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        shadows
        camera={{ position: [0, 1.2, 2.7], fov: 42 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      >
        <ResponsiveCamera />
        <color attach="background" args={['#14100D']} />

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.8}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
          minDistance={1.4}
          maxDistance={5.0}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0.75, 0]}
        />

        {/* 1. HỆ THỐNG ÁNH SÁNG CHÂN THỰC: IBL Sunset Environment */}
        <Suspense fallback={null}>
          <Environment preset="sunset" />
        </Suspense>

        {/* 2. ÁNH SÁNG ĐỔ BÓNG MỀM (Soft Directional Light with shadow-mapSize=1024) */}
        <ambientLight intensity={0.45} color="#FFE8D6" />
        <directionalLight
          position={[3, 5, 4]}
          intensity={1.5}
          color="#FFF8E7"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#D4AF37" />

        {/* 3. TỌA ĐỨNG TRÒN TRANG NGHIÊM (Không có vòng bán nguyệt) */}
        <mesh position={[0, -0.04, 0]} receiveShadow>
          <cylinderGeometry args={[1.05, 1.15, 0.08, 48]} />
          <meshStandardMaterial color="#261A12" roughness={0.65} metalness={0.15} />
        </mesh>

        {/* 4. CONTACT SHADOWS: Đổ bóng mềm tiếp xúc chân thực ở chân đế tọa cụ */}
        <ContactShadows
          position={[0, -0.038, 0]}
          opacity={0.6}
          scale={10}
          blur={2}
          far={4}
          color="#140D08"
        />

        {/* 5. MÔ HÌNH NHÂN VẬT 3D CHUẨN TẢI QUA USEGLTF & USEANIMATIONS */}
        <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <Suspense fallback={null}>
            <HumanoidDevotee
              config={config}
              pose={previewPose}
              position={[0, 0, 0]}
              isMainUser={true}
              showNameBadge={false}
              animate={true}
              renderLocalCushion={previewPose === 'meditate'}
            />
          </Suspense>
        </group>
      </Canvas>
    </div>
  );
};
