import React, { useMemo } from 'react';
import { HumanoidDevotee } from './HumanoidDevotee';
import { DevoteeConfig, DevoteePose, Gender, HairStyle, BottomType } from '../../types/avatar';
import * as THREE from 'three';

interface DevoteeCongregationProps {
  userConfig: DevoteeConfig;
  userPose: DevoteePose;
  onPlantIncense?: () => void;
  onCompleteIncenseRitual?: () => void;
}

interface FellowDevoteeData {
  id: number;
  config: DevoteeConfig;
  position: [number, number, number];
  isUser: boolean;
}

export const DevoteeCongregation: React.FC<DevoteeCongregationProps> = ({
  userConfig,
  userPose,
  onPlantIncense,
  onCompleteIncenseRitual,
}) => {
  // Cushion materials (MeshLambertMaterial & MeshBasicMaterial giảm tải GPU shader)
  const cushionBaseMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: '#743E1F' }),
    []
  );
  const cushionLotusMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#C59B27', side: THREE.DoubleSide }),
    []
  );

  // Generate 100 devotee positions and variations (50 on left, 50 on right)
  const devotees = useMemo<FellowDevoteeData[]>(() => {
    const list: FellowDevoteeData[] = [];
    const robePalettes = ['#4B6B88', '#633B1E', '#E2E8F0', '#B8860B', '#475569'];
    const genders: Gender[] = ['female', 'male'];
    const hairStyles: HairStyle[] = ['bald', 'short', 'long'];
    const bottomTypes: BottomType[] = ['pants'];

    const dharmaNames = [
      'Diệu Âm', 'Tuệ Minh', 'Chân Thiện', 'Thanh Tâm', 'Phúc Hưng',
      'Vạn An', 'Tịnh Độ', 'Trí Dũng', 'Minh Đức', 'An Nhiên',
      'Quang Chiếu', 'Diệu Hạnh', 'Thiện Trí', 'Bảo Quang', 'Pháp Đăng',
      'Viên Mãn', 'Đại Huệ', 'Như Ý', 'Tâm An', 'Liên Hoa',
      'Bảo An', 'Diệu Huệ', 'Thanh Trúc', 'Chân Như', 'Huệ Chi',
      'Trí Hải', 'Huyền Trang', 'Minh Châu', 'Phổ Tịnh', 'Trí Quang',
      'Tâm Đức', 'Diệu Tịnh', 'Bảo Ngọc', 'Như Nguyện', 'Quang Minh',
      'Thiện Ý', 'An Lạc', 'Tịnh Tâm', 'Vạn Hạnh', 'Diệu Pháp',
      'Giác Nhiên', 'Chân Tâm', 'Huệ Đức', 'Thanh Lương', 'Trí Nhã',
      'Diệu Hải', 'Minh Tuệ', 'Bảo Đăng', 'Quang Hoa', 'Như Pháp'
    ];

    let count = 0;

    // 10 rows × 10 columns (5 on left side of aisle, 5 on right side of aisle)
    for (let row = 0; row < 10; row++) {
      const z = 3.2 + row * 1.6; // Lùi về sau bàn đảnh lễ (Z = 0.8m) từ 3.2m đến 17.6m

      // Left wing: 5 columns
      for (let col = 0; col < 5; col++) {
        const x = -(2.2 + col * 1.4); // -2.2m to -7.8m
        const isUser = row === 0 && col === 0;

        const fellowGender: Gender = Math.random() > 0.5 ? 'male' : 'female';
        const fellowHair: HairStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];
        const fellowRobe = robePalettes[Math.floor(Math.random() * robePalettes.length)];
        const nameIdx = Math.floor(Math.random() * dharmaNames.length);
        const fellowName = dharmaNames[nameIdx];

        list.push({
          id: count++,
          config: isUser
            ? userConfig
            : {
                name: fellowName,
                gender: fellowGender,
                hairStyle: fellowHair,
                bottomType: 'pants',
                robeColor: fellowRobe,
                robeName: 'Áo Tràng',
              },
          position: [x, 0, z],
          isUser,
        });
      }

      // Right wing: 5 columns
      for (let col = 0; col < 5; col++) {
        const x = 2.2 + col * 1.4; // 2.2m to 7.8m
        const fellowGender: Gender = Math.random() > 0.5 ? 'male' : 'female';
        const fellowHair: HairStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];
        const fellowRobe = robePalettes[Math.floor(Math.random() * robePalettes.length)];
        const nameIdx = Math.floor(Math.random() * dharmaNames.length);
        const fellowName = dharmaNames[nameIdx];

        list.push({
          id: count++,
          config: {
            name: fellowName,
            gender: fellowGender,
            hairStyle: fellowHair,
            bottomType: 'pants',
            robeColor: fellowRobe,
            robeName: 'Áo Tràng',
          },
          position: [x, 0, z],
          isUser: false,
        });
      }
    }

    return list;
  }, []);

  // Gộp toàn bộ 100 đệm bồ đoàn và 100 viền hoa sen thành 2 mesh duy nhất để giảm 198 draw calls
  const { mergedCushionBasesGeo, mergedCushionRingsGeo } = useMemo(() => {
    const baseProto = new THREE.CylinderGeometry(0.44, 0.48, 0.1, 20);
    const ringProto = new THREE.RingGeometry(0.22, 0.38, 20);
    ringProto.rotateX(-Math.PI / 2);

    const mergeList = (proto: THREE.BufferGeometry, yOffset: number) => {
      const count = devotees.length;
      const vCount = proto.attributes.position.count;
      const idxAttr = proto.index;
      const iCount = idxAttr ? idxAttr.count : vCount;

      const positions = new Float32Array(count * vCount * 3);
      const normals = new Float32Array(count * vCount * 3);
      const indices = new Uint32Array(count * iCount);

      const srcPos = proto.attributes.position.array as Float32Array;
      const srcNorm = proto.attributes.normal.array as Float32Array;

      for (let dIdx = 0; dIdx < count; dIdx++) {
        const [dx, , dz] = devotees[dIdx].position;
        const vBase = dIdx * vCount;
        for (let v = 0; v < vCount; v++) {
          const s3 = v * 3;
          const d3 = (vBase + v) * 3;
          positions[d3] = srcPos[s3] + dx;
          positions[d3 + 1] = srcPos[s3 + 1] + yOffset;
          positions[d3 + 2] = srcPos[s3 + 2] + dz;

          normals[d3] = srcNorm[s3];
          normals[d3 + 1] = srcNorm[s3 + 1];
          normals[d3 + 2] = srcNorm[s3 + 2];
        }

        const iBase = dIdx * iCount;
        if (idxAttr) {
          const srcIdx = idxAttr.array;
          for (let k = 0; k < iCount; k++) {
            indices[iBase + k] = srcIdx[k] + vBase;
          }
        } else {
          for (let k = 0; k < iCount; k++) {
            indices[iBase + k] = vBase + k;
          }
        }
      }

      const merged = new THREE.BufferGeometry();
      merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      merged.setIndex(new THREE.BufferAttribute(indices, 1));
      return merged;
    };

    return {
      mergedCushionBasesGeo: mergeList(baseProto, 0.05),
      mergedCushionRingsGeo: mergeList(ringProto, 0.102),
    };
  }, [devotees]);

  return (
    <group>
      {/* 1. ĐỆM BỒ ĐOÀN CỐ ĐỊNH TRÊN SÀN CHO 100 PHẬT TỬ (Đã gộp thành 2 mesh duy nhất) */}
      <mesh geometry={mergedCushionBasesGeo} material={cushionBaseMat} receiveShadow />
      <mesh geometry={mergedCushionRingsGeo} material={cushionLotusMat} />

      {/* 2. 100 NHÂN VẬT PHẬT TỬ HÀNH LỄ TRÊN TỪNG ĐỆM BỒ ĐOÀN */}
      {devotees.map((d) => {
        // Tất cả quay mặt về phía Phật (rotation = [0, Math.PI, 0])
        if (d.isUser) {
          return (
            <HumanoidDevotee
              key={`user-${d.id}`}
              config={userConfig}
              pose={userPose}
              position={d.position}
              rotation={[0, Math.PI, 0]}
              isMainUser={true}
              showNameBadge={true}
              animate={true}
              onPlantIncense={onPlantIncense}
              onCompleteIncenseRitual={onCompleteIncenseRitual}
            />
          );
        }

        const fellowPose = userPose === 'bow' ? 'bow' : 'meditate';

        return (
          <HumanoidDevotee
            key={`fellow-${d.id}`}
            config={d.config}
            pose={fellowPose}
            position={d.position}
            rotation={[0, Math.PI, 0]}
            isMainUser={false}
            showNameBadge={d.id < 6}
            animate={fellowPose === 'bow'}
          />
        );
      })}
    </group>
  );
};
