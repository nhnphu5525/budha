import React from 'react';
import * as THREE from 'three';
import { HumanoidDevotee } from './HumanoidDevotee';
import { CenterLotusThrone } from './BuddhaStatue';

interface BodhisattvaInfo {
  name: string;
  side: 'left' | 'right';
  x: number;
  z: number;
  mudra: 'lotus' | 'vase' | 'staff' | 'wish' | 'meditate';
}

const sharedHaloRingGeo = new THREE.RingGeometry(0.58, 0.76, 24);
const sharedHaloRingMat = new THREE.MeshBasicMaterial({
  color: '#FFC828',
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.85,
});

export const SideBodhisattvaStatues: React.FC = () => {
  // Statues placed along the expanded side walls (X = ±15.0m, Z spans -3.5m to 31.5m)
  // Both sides angled inward/forward to look across the 100 devotees!
  const statues: BodhisattvaInfo[] = [
    // Left Aisle (Cánh Tả - X = -15.0m)
    { name: 'Quán Thế Âm Bồ Tát', side: 'left', x: -15.0, z: -3.5, mudra: 'vase' },
    { name: 'Đại Thế Chí Bồ Tát', side: 'left', x: -15.0, z: 3.5, mudra: 'lotus' },
    { name: 'Văn Thù Sư Lợi Bồ Tát', side: 'left', x: -15.0, z: 10.5, mudra: 'wish' },
    { name: 'Phổ Hiền Bồ Tát', side: 'left', x: -15.0, z: 17.5, mudra: 'meditate' },
    { name: 'Hộ Pháp Vi Đà Bồ Tát', side: 'left', x: -15.0, z: 24.5, mudra: 'staff' },
    { name: 'Tiêu Diện Đại Sĩ', side: 'left', x: -15.0, z: 31.5, mudra: 'wish' },

    // Right Aisle (Cánh Hữu - X = +15.0m)
    { name: 'Địa Tạng Vương Bồ Tát', side: 'right', x: 15.0, z: -3.5, mudra: 'staff' },
    { name: 'Phật Dược Sư Lưu Ly', side: 'right', x: 15.0, z: 3.5, mudra: 'vase' },
    { name: 'Phật A Di Đà', side: 'right', x: 15.0, z: 10.5, mudra: 'meditate' },
    { name: 'Di Lặc Bồ Tát', side: 'right', x: 15.0, z: 17.5, mudra: 'wish' },
    { name: 'Già Lam Bồ Tát', side: 'right', x: 15.0, z: 24.5, mudra: 'staff' },
    { name: 'Kim Cang Mật Tích', side: 'right', x: 15.0, z: 31.5, mudra: 'lotus' },
  ];

  return (
    <group>
      {statues.map((st, idx) => {
        // HƯỚNG MẶT RA NGOÀI VÀO PHẬT TỬ:
        // Cánh tả (trái) quay 68° vào chánh điện (rotY = +Math.PI * 0.38)
        // Cánh hữu (phải) quay -68° vào chánh điện (rotY = -Math.PI * 0.38)
        const rotY = st.side === 'left' ? Math.PI * 0.38 : -Math.PI * 0.38;

        return (
          <group key={`bodhisattva-${idx}`} position={[st.x, 0, st.z]} rotation={[0, rotY, 0]}>
            {/* 1. Bàn tọa Đài Sen Vàng 4 tầng cánh uốn khum tròn mềm mại, uyển chuyển */}
            <group scale={[0.72, 0.9, 0.72]}>
              <CenterLotusThrone />
            </group>

            {/* 2. Tôn Tượng Bồ Tát / Chư Phật Uy Nghi Hướng Ra Phật Tử (Đồng bộ tạo hình liền khối với Phật tử, không có tóc) */}
            <group position={[0, 0.98, 0]}>
              <HumanoidDevotee
                config={{
                  name: st.name,
                  gender: 'male',
                  robeColor: '#D89E28',
                  robeName: 'Hoàng Kim Cà Sa',
                  bottomType: 'pants',
                  hairStyle: 'bald',
                }}
                pose="meditate"
                sittingHandPose={st.mudra === 'meditate' ? 'meditate' : 'pray'}
                hideHair={true}
                isGoldenStatue={true}
                statueGoldColor="#F5C542"
                scale={1.45}
                showNameBadge={false}
                animate={false}
                renderLocalCushion={false}
              />

              {/* Vòng Hào Quang phát sáng tự thân sau lưng Tôn Tượng (-Z) */}
              <group position={[0, 1.35, -0.3]}>
                <mesh geometry={sharedHaloRingGeo} material={sharedHaloRingMat} />
              </group>
            </group>
          </group>
        );
      })}
    </group>
  );
};
