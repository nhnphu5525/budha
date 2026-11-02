import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export type DevoteePose = 'pray' | 'bow' | 'meditate' | 'incense';
export type RobeColor = 'lam' | 'nau' | 'trang';
export type DevoteeGender = 'female' | 'male';

interface DevoteeAvatarProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  pose?: DevoteePose;
  robeColor?: RobeColor;
  gender?: DevoteeGender;
  name?: string;
  isMainUser?: boolean;
  scale?: number;
}

export const DevoteeAvatar: React.FC<DevoteeAvatarProps> = ({
  position = [0, 0, 0.8],
  rotation = [0, 0, 0],
  pose = 'pray',
  robeColor = 'lam',
  gender = 'female',
  name = 'Phật tử Diệu Tâm',
  isMainUser = true,
  scale = 1.0,
}) => {
  const avatarGroupRef = useRef<THREE.Group>(null);
  const spineRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const legsRef = useRef<THREE.Group>(null);
  const incenseHoldingRef = useRef<THREE.Group>(null);

  // Robe color themes
  const robeColorHex = useMemo(() => {
    switch (robeColor) {
      case 'nau':
        return '#6B3E1F'; // Áo tràng nâu sòng
      case 'trang':
        return '#EDEDED'; // Bạch y cư sĩ
      case 'lam':
      default:
        return '#4B6B88'; // Áo lam Phật tử truyền thống
    }
  }, [robeColor]);

  const collarColorHex = useMemo(() => {
    switch (robeColor) {
      case 'nau':
        return '#4A2A14';
      case 'trang':
        return '#CBD5E1';
      case 'lam':
      default:
        return '#CBD5E1'; // Viền cổ trắng/nhạt
    }
  }, [robeColor]);

  // Materials
  const skinMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#F3C59D', roughness: 0.6 }),
    []
  );
  const hairMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1A1817', roughness: 0.8 }),
    []
  );
  const robeMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: robeColorHex, roughness: 0.75, metalness: 0.05 }),
    [robeColorHex]
  );
  const collarMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: collarColorHex, roughness: 0.6 }),
    [collarColorHex]
  );

  // Smooth pose transitions & procedural breathing animations
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (!avatarGroupRef.current || !spineRef.current || !headRef.current || !leftArmRef.current || !rightArmRef.current) {
      return;
    }

    // Default targets
    let targetSpineRotX = 0;
    let targetSpinePosY = 0.85;
    let targetHeadRotX = 0.1;
    let targetLeftArmRot = [-0.65, 0.45, -0.6];
    let targetRightArmRot = [-0.65, -0.45, 0.6];
    let targetAvatarPosY = 0;
    let showIncense = false;

    // Apply procedural poses
    if (pose === 'pray') {
      // Chắp tay búp sen niệm Phật (Anjali mudra)
      const breathing = Math.sin(t * 2.2) * 0.02;
      targetSpineRotX = 0.06 + breathing;
      targetHeadRotX = 0.16 + breathing * 0.5;
      targetLeftArmRot = [-0.75, 0.55, -0.65];
      targetRightArmRot = [-0.75, -0.55, 0.65];
      targetAvatarPosY = 0;
    } else if (pose === 'bow') {
      // Lạy Phật (Prostration cycle: 0 -> full bow -> 0)
      const bowCycle = (Math.sin(t * 1.8) + 1) / 2; // 0 to 1
      targetAvatarPosY = -0.38 * bowCycle; // kneel down
      targetSpineRotX = 1.15 * bowCycle; // bend forward deeply
      targetHeadRotX = 0.45 * bowCycle;
      targetLeftArmRot = [-0.75 + 1.2 * bowCycle, 0.45 - 0.2 * bowCycle, -0.65 + 0.3 * bowCycle];
      targetRightArmRot = [-0.75 + 1.2 * bowCycle, -0.45 + 0.2 * bowCycle, 0.65 - 0.3 * bowCycle];
    } else if (pose === 'meditate') {
      // Ngồi thiền kiết già trên bồ đoàn
      const medBreath = Math.sin(t * 1.5) * 0.015;
      targetAvatarPosY = -0.38; // sitting flat on cushion
      targetSpineRotX = 0.02 + medBreath;
      targetHeadRotX = 0.06;
      targetLeftArmRot = [-0.25, 0.2, -0.4];
      targetRightArmRot = [-0.25, -0.2, 0.4];
    } else if (pose === 'incense') {
      // Cầm hương dâng ngang trán xá Phật
      const prayWave = Math.sin(t * 2.5) * 0.08;
      targetSpineRotX = 0.12 + prayWave;
      targetHeadRotX = 0.18 + prayWave * 0.5;
      targetLeftArmRot = [-1.15, 0.4, -0.35];
      targetRightArmRot = [-1.15, -0.4, 0.35];
      showIncense = true;
    }

    // Smooth lerping
    const lerpSpeed = 0.1;
    spineRef.current.rotation.x = THREE.MathUtils.lerp(spineRef.current.rotation.x, targetSpineRotX, lerpSpeed);
    spineRef.current.position.y = THREE.MathUtils.lerp(spineRef.current.position.y, targetSpinePosY, lerpSpeed);
    headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetHeadRotX, lerpSpeed);
    avatarGroupRef.current.position.y = THREE.MathUtils.lerp(avatarGroupRef.current.position.y, position[1] + targetAvatarPosY, lerpSpeed);

    leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, targetLeftArmRot[0], lerpSpeed);
    leftArmRef.current.rotation.y = THREE.MathUtils.lerp(leftArmRef.current.rotation.y, targetLeftArmRot[1], lerpSpeed);
    leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, targetLeftArmRot[2], lerpSpeed);

    rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, targetRightArmRot[0], lerpSpeed);
    rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, targetRightArmRot[1], lerpSpeed);
    rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetRightArmRot[2], lerpSpeed);

    if (incenseHoldingRef.current) {
      incenseHoldingRef.current.visible = showIncense;
    }

    if (legsRef.current) {
      const isSitting = pose === 'meditate' || pose === 'bow';
      legsRef.current.scale.y = THREE.MathUtils.lerp(legsRef.current.scale.y, isSitting ? 0.4 : 1.0, lerpSpeed);
    }
  });

  return (
    <group
      ref={avatarGroupRef}
      position={[position[0], position[1], position[2]]}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {/* 3D Nametag badge for Devotee */}
      <Html position={[0, 1.85, 0]} center distanceFactor={10} zIndexRange={[100, 0]}>
        <div className="flex flex-col items-center pointer-events-none select-none transition-all duration-300">
          <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-lg border backdrop-blur-md ${
            isMainUser
              ? 'bg-amber-950/85 text-amber-200 border-amber-500/50 shadow-amber-900/30 ring-1 ring-amber-400/30'
              : 'bg-stone-900/80 text-stone-300 border-stone-600/40'
          }`}>
            <span className="text-[11px]">{isMainUser ? '🙏' : '🪷'}</span>
            <span>{name}</span>
          </div>
          <div className="w-1.5 h-1.5 rotate-45 -mt-1 bg-amber-900 border-r border-b border-amber-500/50"></div>
        </div>
      </Html>

      {/* ĐỆM BỒ ĐOÀN DƯỚI CHÂN (Meditation cushion) */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.1, 24]} />
        <meshStandardMaterial color="#8A5A36" roughness={0.8} />
      </mesh>
      {/* Viền thêu hoa sen trên bồ đoàn */}
      <mesh position={[0, 0.105, 0]}>
        <ringGeometry args={[0.2, 0.32, 24]} />
        <meshStandardMaterial color="#B8860B" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* CHÂN VÀ TÀ ÁO DƯỚI (Legs & Lower Robe Skirt) */}
      <group ref={legsRef} position={[0, 0.1, 0]}>
        {/* Tà áo dài truyền thống rủ xuống bao quanh chân */}
        <mesh position={[0, 0.35, 0]} material={robeMaterial} castShadow>
          <cylinderGeometry args={[0.26, 0.36, 0.7, 20]} />
        </mesh>
        {/* Hai ống chân kín đáo */}
        <mesh position={[-0.1, 0.15, 0]} material={robeMaterial} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.3, 12]} />
        </mesh>
        <mesh position={[0.1, 0.15, 0]} material={robeMaterial} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.3, 12]} />
        </mesh>
        {/* Đôi tất trắng/giày vải Phật tử */}
        <mesh position={[-0.1, 0.02, 0.04]}>
          <boxGeometry args={[0.1, 0.06, 0.18]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.7} />
        </mesh>
        <mesh position={[0.1, 0.02, 0.04]}>
          <boxGeometry args={[0.1, 0.06, 0.18]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.7} />
        </mesh>
      </group>

      {/* THÂN TRÊN & CỘT SỐNG (Spine & Torso in Devotee Robe) */}
      <group ref={spineRef} position={[0, 0.85, 0]}>
        {/* Thân áo tràng Phật tử */}
        <mesh position={[0, 0.15, 0]} material={robeMaterial} castShadow>
          <cylinderGeometry args={[0.22, 0.25, 0.5, 18]} />
        </mesh>

        {/* Cổ áo vắt chéo truyền thống */}
        <mesh position={[0, 0.32, 0.06]} material={collarMaterial} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.28, 0.12, 0.18]} />
        </mesh>

        {/* Dải đai thắt lưng vải */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.255, 0.255, 0.08, 20]} />
          <meshStandardMaterial color="#2E3C48" roughness={0.6} />
        </mesh>

        {/* CỔ VÀ ĐẦU (Neck & Head) */}
        <group ref={headRef} position={[0, 0.44, 0]}>
          {/* Cổ */}
          <mesh position={[0, 0.04, 0]} material={skinMaterial} castShadow>
            <cylinderGeometry args={[0.085, 0.09, 0.1, 14]} />
          </mesh>

          {/* Đầu Phật tử */}
          <mesh position={[0, 0.19, 0]} material={skinMaterial} castShadow>
            <sphereGeometry args={[0.16, 20, 20]} />
          </mesh>

          {/* Kiểu tóc trang nghiêm */}
          {gender === 'female' ? (
            <group position={[0, 0.22, -0.06]}>
              <mesh position={[0, 0.02, 0]} material={hairMaterial}>
                <sphereGeometry args={[0.165, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
              </mesh>
              <mesh position={[0, 0.03, -0.1]} material={hairMaterial} castShadow>
                <sphereGeometry args={[0.085, 14, 14]} />
              </mesh>
              {/* Trâm cài sen nhỏ bằng gỗ */}
              <mesh position={[0.06, 0.05, -0.1]} rotation={[0, 0, 0.5]}>
                <cylinderGeometry args={[0.01, 0.01, 0.14, 6]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.7} />
              </mesh>
            </group>
          ) : (
            <group position={[0, 0.22, 0]}>
              <mesh material={hairMaterial}>
                <sphereGeometry args={[0.166, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.68]} />
              </mesh>
            </group>
          )}

          {/* Gương mặt an nhiên */}
          <mesh position={[-0.05, 0.19, 0.15]} rotation={[0, 0, 0.08]}>
            <boxGeometry args={[0.035, 0.006, 0.01]} />
            <meshBasicMaterial color="#332418" />
          </mesh>
          <mesh position={[0.05, 0.19, 0.15]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[0.035, 0.006, 0.01]} />
            <meshBasicMaterial color="#332418" />
          </mesh>
          <mesh position={[0, 0.13, 0.155]}>
            <boxGeometry args={[0.04, 0.006, 0.01]} />
            <meshBasicMaterial color="#B0715E" />
          </mesh>
        </group>

        {/* TAY TRÁI (Left Arm & Sleeve) */}
        <group ref={leftArmRef} position={[-0.24, 0.32, 0]}>
          <mesh position={[-0.08, -0.18, 0.06]} material={robeMaterial} rotation={[0.4, 0, -0.2]} castShadow>
            <cylinderGeometry args={[0.1, 0.13, 0.35, 14]} />
          </mesh>
          <mesh position={[-0.03, -0.3, 0.18]} material={robeMaterial} rotation={[0.7, 0.3, -0.3]} castShadow>
            <capsuleGeometry args={[0.055, 0.22, 6, 10]} />
          </mesh>
          <mesh position={[0.12, -0.34, 0.28]} material={skinMaterial} rotation={[-0.3, 0.8, -0.4]}>
            <boxGeometry args={[0.06, 0.11, 0.03]} />
          </mesh>
        </group>

        {/* TAY PHẢI (Right Arm & Sleeve) */}
        <group ref={rightArmRef} position={[0.24, 0.32, 0]}>
          <mesh position={[0.08, -0.18, 0.06]} material={robeMaterial} rotation={[0.4, 0, 0.2]} castShadow>
            <cylinderGeometry args={[0.1, 0.13, 0.35, 14]} />
          </mesh>
          <mesh position={[0.03, -0.3, 0.18]} material={robeMaterial} rotation={[0.7, -0.3, 0.3]} castShadow>
            <capsuleGeometry args={[0.055, 0.22, 6, 10]} />
          </mesh>
          <mesh position={[-0.12, -0.34, 0.28]} material={skinMaterial} rotation={[-0.3, -0.8, 0.4]}>
            <boxGeometry args={[0.06, 0.11, 0.03]} />
          </mesh>
        </group>

        {/* 3 NÉN NHANG CẦM TRÊN TAY */}
        <group ref={incenseHoldingRef} position={[0, 0.25, 0.35]} visible={false}>
          {[-0.02, 0, 0.02].map((x, idx) => (
            <group key={`hand-incense-${idx}`} position={[x, 0, 0]} rotation={[0.15, 0, (idx - 1) * 0.06]}>
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.24, 6]} />
                <meshStandardMaterial color="#B71C1C" />
              </mesh>
              <mesh position={[0, 0.24, 0]}>
                <sphereGeometry args={[0.012, 6, 6]} />
                <meshStandardMaterial color="#FF5722" emissive="#FF3D00" emissiveIntensity={2.5} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
};
