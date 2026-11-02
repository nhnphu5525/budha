import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IncenseBurnerProps {
  position?: [number, number, number];
  scale?: number;
  incenseCount?: number;
}

export const IncenseBurner: React.FC<IncenseBurnerProps> = ({
  position = [0, 1.05, -1.8],
  scale = 1.0,
  incenseCount = 3,
}) => {
  const smokeRef = useRef<THREE.Points>(null);

  // Number of smoke particles (tinh giản 70% để giảm overdraw trong suốt trên GPU)
  const particleCount = 24;

  // Particle positions, velocities, and initial states
  const [particles] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const orig = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Start near the burning tip of the incense sticks
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.08;
      const height = Math.random() * 2.5; // distributed along rising column

      pos[idx] = Math.cos(angle) * radius;
      pos[idx + 1] = 0.55 + height;
      pos[idx + 2] = Math.sin(angle) * radius;

      orig[idx] = pos[idx];
      orig[idx + 1] = pos[idx + 1];
      orig[idx + 2] = pos[idx + 2];
    }
    return [pos, orig];
  }, [particleCount]);

  // Texture for smoke puff
  const smokeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
      grad.addColorStop(0, 'rgba(235, 235, 245, 0.85)');
      grad.addColorStop(0.35, 'rgba(215, 215, 230, 0.45)');
      grad.addColorStop(0.75, 'rgba(190, 190, 205, 0.15)');
      grad.addColorStop(1, 'rgba(170, 170, 190, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Animate rising smoke curling upwards
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (smokeRef.current) {
      const geometry = smokeRef.current.geometry;
      const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
      const arr = positionAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        // Rise speed
        arr[idx + 1] += 0.016 + (i % 7) * 0.002;

        // Swirling drift effect
        const h = arr[idx + 1];
        const drift = (h - 0.55) * 0.18;
        arr[idx] = Math.sin(t * 1.4 + i * 0.8) * drift + (Math.sin(t * 0.5) * 0.06);
        arr[idx + 2] = Math.cos(t * 1.1 + i * 0.7) * drift + (Math.cos(t * 0.6) * 0.06);

        // Reset particle when it reaches top height
        if (arr[idx + 1] > 3.2) {
          arr[idx + 1] = 0.55;
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 0.06;
          arr[idx] = Math.cos(a) * r;
          arr[idx + 2] = Math.sin(a) * r;
        }
      }
      positionAttr.needsUpdate = true;
    }
  });

  // Lightweight Bronze material (MeshPhongMaterial thay vì PBR MeshStandardMaterial)
  const bronzeMaterial = (
    <meshPhongMaterial
      color="#A37E36"
      specular="#FFE49E"
      shininess={42}
    />
  );

  const darkBronzeMaterial = (
    <meshPhongMaterial
      color="#5E431B"
      specular="#B88E44"
      shininess={28}
    />
  );

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* ĐĨA ĐỒNG LÓT DƯỚI (Underplate) */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.52, 0.56, 0.06, 20]} />
        {bronzeMaterial}
      </mesh>

      {/* 3 CHÂN LƯ HƯƠNG ĐỠ ĐÁY BẦU NỬA HÌNH CẦU (Tripod Feet) */}
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => (
        <group
          key={`foot-${i}`}
          position={[Math.cos(angle) * 0.28, 0.13, Math.sin(angle) * 0.28]}
          rotation={[0, -angle, 0]}
        >
          <mesh rotation={[0, 0, -0.22]}>
            <cylinderGeometry args={[0.065, 0.05, 0.2, 10]} />
            {darkBronzeMaterial}
          </mesh>
          <mesh position={[0.02, -0.08, 0]}>
            <sphereGeometry args={[0.065, 8, 8]} />
            {bronzeMaterial}
          </mesh>
        </group>
      ))}

      {/* BẦU LƯ HƯƠNG DẠNG NỬA HÌNH CẦU NGỬA LÊN (Lower Hemisphere: thetaStart = Math.PI/2, thetaLength = Math.PI/2)
          Đáy tròn bên dưới (Y = 0.14), mặt cắt phẳng nằm ngang ở đỉnh miệng lư (Y = 0.48) */}
      <mesh position={[0, 0.48, 0]} scale={[1, 0.82, 1]} receiveShadow>
        <sphereGeometry args={[0.42, 24, 14, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
        <meshPhongMaterial
          color="#A37E36"
          specular="#FFE49E"
          shininess={42}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Đai đồng trang trí ôm ngang thân nửa cầu */}
      <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.395, 0.016, 8, 24]} />
        {darkBronzeMaterial}
      </mesh>

      {/* VÀNH MIỆNG LƯ NẰM NGANG BAO QUANH MẶT CẮT PHẲNG (Horizontal Flat Rim at Y = 0.48) */}
      <mesh position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[0.415, 0.032, 10, 24]} />
        {bronzeMaterial}
      </mesh>

      {/* MẶT CẮT PHẲNG TRO HƯƠNG NẰM NGANG ĐỂ CẮM NHANG (Flat Horizontal Ash Surface at Y = 0.475) */}
      <mesh position={[0, 0.468, 0]} receiveShadow>
        <cylinderGeometry args={[0.40, 0.38, 0.03, 20]} />
        <meshLambertMaterial color="#C8C2B8" />
      </mesh>
      {/* Vòng tàn nhang mịn ở tâm mặt phẳng tro */}
      <mesh position={[0, 0.484, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.385, 20]} />
        <meshLambertMaterial color="#D6D1C7" />
      </mesh>

      {/* HAI QUAI ĐỒNG BÊN HÔNG LƯ HƯƠNG (Side Bronze Handles) */}
      <mesh position={[-0.43, 0.38, 0]} rotation={[0, 0, Math.PI * 0.55]}>
        <torusGeometry args={[0.095, 0.026, 8, 14, Math.PI]} />
        {bronzeMaterial}
      </mesh>
      <mesh position={[0.43, 0.38, 0]} rotation={[0, 0, -Math.PI * 0.55]}>
        <torusGeometry args={[0.095, 0.026, 8, 14, Math.PI]} />
        {bronzeMaterial}
      </mesh>

      {/* CÁC NÉN HƯƠNG CẮM TRỰC TIẾP TRÊN MẶT PHẲNG TRO (Joss / Incense Sticks on Flat Cut Surface) */}
      {Array.from({ length: Math.min(incenseCount, 9) }).map((_, i) => {
        const offsetAngle = (i / Math.max(incenseCount - 1, 1)) * 0.5 - 0.25;
        const xOff = (i - (incenseCount - 1) / 2) * 0.075;
        const zOff = (i % 2 === 0 ? -0.02 : 0.025);

        return (
          <group key={`stick-${i}`} position={[xOff, 0.484, zOff]} rotation={[0.03, 0, offsetAngle * 0.3]}>
            {/* Chân nhang đỏ cắm xuống mặt phẳng tro (Red stick base) */}
            <mesh position={[0, 0.11, 0]}>
              <cylinderGeometry args={[0.009, 0.009, 0.22, 6]} />
              <meshLambertMaterial color="#C62828" />
            </mesh>

            {/* Thân nhang trầm thơm (Incense body) */}
            <mesh position={[0, 0.31, 0]}>
              <cylinderGeometry args={[0.011, 0.011, 0.32, 6]} />
              <meshLambertMaterial color="#6D4C41" />
            </mesh>

            {/* Đầu đóm nhang đang cháy đỏ (Glowing red ember tip) */}
            <mesh position={[0, 0.48, 0]}>
              <sphereGeometry args={[0.016, 6, 6]} />
              <meshBasicMaterial color="#FF4500" />
            </mesh>
          </group>
        );
      })}

      {/* KHÓI HƯƠNG NGHI NGÚT BAY LÊN (Rising Smoke Particle System) */}
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.28}
          map={smokeTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  );
};
