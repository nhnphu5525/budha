import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const AuraParticles: React.FC<{ count?: number }> = ({ count = 90 }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      pos[idx] = (Math.random() - 0.5) * 8; // X range
      pos[idx + 1] = 0.5 + Math.random() * 4.5; // Y height range
      pos[idx + 2] = -5 + Math.random() * 8; // Z depth range
      ph[i] = Math.random() * Math.PI * 2;
    }
    return [pos, ph];
  }, [count]);

  const circleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
      grad.addColorStop(0, 'rgba(255, 230, 140, 1.0)');
      grad.addColorStop(0.4, 'rgba(255, 200, 80, 0.6)');
      grad.addColorStop(1, 'rgba(255, 180, 50, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        // Gentle bobbing and floating
        arr[idx + 1] += Math.sin(t * 0.8 + phases[i]) * 0.003;
        arr[idx] += Math.cos(t * 0.5 + phases[i]) * 0.002;

        // Keep inside bounds
        if (arr[idx + 1] > 5.2) arr[idx + 1] = 0.6;
        if (arr[idx + 1] < 0.4) arr[idx + 1] = 5.0;
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        map={circleTexture}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
