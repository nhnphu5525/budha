import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HumanoidDevotee } from './HumanoidDevotee';

interface BuddhaStatueProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

// ========================================================
// 1. TÒA SEN VÀNG NỞ RỘ UY NGHI (Lotus Throne - Bông Sen)
// Dành riêng cho Tôn Tượng Đức Phật Thích Ca Mâu Ni Trung Tâm
// ========================================================
/**
 * Tạo hình học cánh sen 3D uốn khum tròn mềm mại, uyển chuyển (Sculpted Curved Lotus Petal Geometry)
 * Tuyệt đối không dùng khối chóp nhọn (coneGeometry 4 cạnh):
 * - Bụng cánh sen bầu tròn đầy đặn, đầu cánh sen bo tròn mềm mại như cánh sen thật
 * - Lòng cánh sen khum nhẹ hình lòng thuyền ôm lấy đài sen, lưng cánh sen căng tròn có sống gân mềm
 * - Thân cánh sen uốn cong chữ S uyển chuyển từ gốc đài sen vươn ra đầu cánh
 */
function mergePetalGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalVerts = 0;
  let totalIndices = 0;
  for (const g of geos) {
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : g.attributes.position.count;
  }
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIndices);

  let vOffset = 0;
  let iOffset = 0;
  for (const g of geos) {
    const pos = g.attributes.position;
    if (!g.attributes.normal) g.computeVertexNormals();
    const norm = g.attributes.normal;
    positions.set(pos.array as Float32Array, vOffset * 3);
    normals.set(norm.array as Float32Array, vOffset * 3);
    if (g.index) {
      const idxArr = g.index.array;
      for (let i = 0; i < idxArr.length; i++) {
        indices[iOffset + i] = idxArr[i] + vOffset;
      }
      iOffset += idxArr.length;
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices[iOffset + i] = vOffset + i;
      }
      iOffset += pos.count;
    }
    vOffset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  return merged;
}

function createSculptedLotusPetalGeo(
  width: number,
  height: number,
  thickness: number,
  outwardArch: number,
  cupDepth: number,
  direction: 'up' | 'down' = 'up'
): THREE.BufferGeometry {
  const widthSegments = 14;
  const heightSegments = 10;
  const geo = new THREE.SphereGeometry(1, widthSegments, heightSegments);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  const dirSign = direction === 'up' ? 1 : -1;

  for (let i = 0; i < pos.count; i++) {
    const ox = pos.getX(i); // [-1, 1] theo bề ngang cánh sen
    const oy = pos.getY(i); // [-1, 1] từ gốc tới ngọn
    const oz = pos.getZ(i); // [-1, 1] độ dày mặt trong (-Z) và mặt ngoài (+Z)

    // Chuẩn hóa chiều dọc cánh sen ny từ 0 (gốc cánh sen) đến 1 (đầu cánh sen bo tròn)
    const ny = (oy + 1) * 0.5;
    const sinNy = Math.sin(ny * Math.PI);

    // 1. Biên dạng bề rộng cánh sen: Bầu tròn rộng ở phần bụng trên (ny ~ 0.62) và bo tròn đầy đặn ở đầu cánh (không nhọn)
    const roundedEnvelope = Math.pow(sinNy, 0.55);
    const upperBellyExpand = 0.86 + 0.36 * Math.sin(Math.pow(ny, 0.85) * Math.PI);
    const x = ox * (width * 0.5) * (roundedEnvelope / (sinNy + 1e-5)) * upperBellyExpand;

    // 2. Chiều cao dọc theo cánh sen
    const y = dirSign * ny * height;

    // 3. Độ dày căng mọng + Sống lưng cánh sen mềm mại ở mặt ngoài (+Z)
    const baseThick = oz * (thickness * 0.5) * (0.72 + 0.38 * sinNy);
    const outerRidge =
      oz > 0
        ? Math.pow(Math.max(0, 1 - Math.abs(ox) * 1.35), 2) * thickness * 0.28 * sinNy
        : 0;

    // 4. Độ khum lòng thuyền theo phương ngang: Hai mép cánh sen uốn ôm vào trong đài sen (-Z)
    const horizontalCup = -(ox * ox) * cupDepth * sinNy;

    // 5. Đường cong chữ S uyển chuyển dọc thân cánh sen:
    // Từ gốc vươn bầu ra ngoài (+Z), ôm khum lên trên và hơi uốn mềm ở mép đầu cánh sen
    const mainCurveZ = outwardArch * Math.sin(ny * Math.PI * 0.68);
    const tipGracefulLip =
      ny > 0.72 ? outwardArch * 0.18 * Math.pow((ny - 0.72) / 0.28, 2) : 0;

    const z = baseThick + outerRidge + horizontalCup + mainCurveZ + tipGracefulLip;

    pos.setXYZ(i, x, y, z);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function buildLotusRingGeo(
  basePetal: THREE.BufferGeometry,
  count: number,
  radius: number,
  yPos: number,
  angleOffset = 0
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const mat = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + angleOffset;
    const g = basePetal.clone();
    pos.set(Math.cos(angle) * radius, yPos, Math.sin(angle) * radius);
    quat.setFromEuler(new THREE.Euler(0, -angle + Math.PI / 2, 0));
    mat.compose(pos, quat, scale);
    g.applyMatrix4(mat);
    parts.push(g);
  }
  return mergePetalGeometries(parts);
}

interface SharedLotusThroneResources {
  stoneBaseMat: THREE.MeshLambertMaterial;
  carvedStemMat: THREE.MeshPhongMaterial;
  petalLowerMat: THREE.MeshPhongMaterial;
  petalOuterMat: THREE.MeshPhongMaterial;
  petalMidMat: THREE.MeshPhongMaterial;
  petalInnerMat: THREE.MeshPhongMaterial;
  podMat: THREE.MeshPhongMaterial;
  mergedStoneBaseGeo: THREE.BufferGeometry;
  stemLatheGeo: THREE.BufferGeometry;
  lowerRingGeo: THREE.BufferGeometry;
  outerRingGeo: THREE.BufferGeometry;
  midRingGeo: THREE.BufferGeometry;
  innerRingGeo: THREE.BufferGeometry;
  podGeo: THREE.BufferGeometry;
}
let sharedLotusThroneRes: SharedLotusThroneResources | null = null;

function getSharedLotusThroneResources(): SharedLotusThroneResources {
  if (sharedLotusThroneRes) return sharedLotusThroneRes;

  const stoneBaseMat = new THREE.MeshLambertMaterial({ color: '#2B2119' });
  const carvedStemMat = new THREE.MeshPhongMaterial({
    color: '#8B4A14',
    specular: new THREE.Color('#D49B4B'),
    shininess: 32,
  });
  const petalLowerMat = new THREE.MeshPhongMaterial({
    color: '#E5A32E',
    specular: new THREE.Color('#FFF0A8'),
    shininess: 52,
    emissive: new THREE.Color('#E5A32E'),
    emissiveIntensity: 0.14,
  });
  const petalOuterMat = new THREE.MeshPhongMaterial({
    color: '#F5BE3B',
    specular: new THREE.Color('#FFF4B8'),
    shininess: 56,
    emissive: new THREE.Color('#F5BE3B'),
    emissiveIntensity: 0.16,
  });
  const petalMidMat = new THREE.MeshPhongMaterial({
    color: '#FFCF4D',
    specular: new THREE.Color('#FFF6C4'),
    shininess: 60,
    emissive: new THREE.Color('#FFCF4D'),
    emissiveIntensity: 0.18,
  });
  const petalInnerMat = new THREE.MeshPhongMaterial({
    color: '#FFDD70',
    specular: new THREE.Color('#FFF8D2'),
    shininess: 60,
    emissive: new THREE.Color('#FFDD70'),
    emissiveIntensity: 0.18,
  });
  const podMat = new THREE.MeshPhongMaterial({
    color: '#E8B528',
    specular: new THREE.Color('#FFF0A8'),
    shininess: 48,
    emissive: new THREE.Color('#E8B528'),
    emissiveIntensity: 0.14,
  });

  const base1 = new THREE.CylinderGeometry(1.76, 1.96, 0.3, 24);
  base1.translate(0, 0.15, 0);
  const base2 = new THREE.CylinderGeometry(1.54, 1.72, 0.16, 24);
  base2.translate(0, 0.36, 0);
  const mergedStoneBaseGeo = mergePetalGeometries([base1, base2]);

  const stemCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(1.52, 0.42, 0),
    new THREE.Vector3(1.18, 0.52, 0),
    new THREE.Vector3(1.15, 0.64, 0),
    new THREE.Vector3(1.36, 0.74, 0)
  );
  const stemPts = stemCurve.getPoints(12).map((p) => new THREE.Vector2(p.x, p.y));
  const stemLatheGeo = new THREE.LatheGeometry(stemPts, 24);
  stemLatheGeo.computeVertexNormals();

  const pLower = createSculptedLotusPetalGeo(0.46, 0.36, 0.085, 0.16, 0.09, 'down');
  const pOuter = createSculptedLotusPetalGeo(0.52, 0.46, 0.095, 0.24, 0.11, 'up');
  const pMid = createSculptedLotusPetalGeo(0.48, 0.42, 0.09, 0.2, 0.1, 'up');
  const pInner = createSculptedLotusPetalGeo(0.44, 0.36, 0.085, 0.15, 0.095, 'up');

  const beadRing = new THREE.TorusGeometry(1.34, 0.045, 8, 24);
  beadRing.rotateX(Math.PI / 2);
  beadRing.translate(0, 0.73, 0);

  const lowerRingGeo = mergePetalGeometries([
    beadRing,
    buildLotusRingGeo(pLower, 18, 1.24, 0.74, 0),
  ]);
  const outerRingGeo = buildLotusRingGeo(pOuter, 18, 1.22, 0.74, 0);
  const midRingGeo = buildLotusRingGeo(pMid, 18, 1.15, 0.80, Math.PI / 18);

  const topRim = new THREE.TorusGeometry(1.11, 0.022, 8, 24);
  topRim.rotateX(Math.PI / 2);
  topRim.translate(0, 1.125, 0);
  const innerRingGeo = mergePetalGeometries([
    buildLotusRingGeo(pInner, 16, 1.08, 0.86, 0),
    topRim,
  ]);

  const podGeo = new THREE.CylinderGeometry(1.15, 1.06, 0.14, 24);
  podGeo.translate(0, 1.06, 0);

  sharedLotusThroneRes = {
    stoneBaseMat,
    carvedStemMat,
    petalLowerMat,
    petalOuterMat,
    petalMidMat,
    petalInnerMat,
    podMat,
    mergedStoneBaseGeo,
    stemLatheGeo,
    lowerRingGeo,
    outerRingGeo,
    midRingGeo,
    innerRingGeo,
    podGeo,
  };
  return sharedLotusThroneRes;
}

export const CenterLotusThrone: React.FC = () => {
  const {
    stoneBaseMat,
    carvedStemMat,
    petalLowerMat,
    petalOuterMat,
    petalMidMat,
    petalInnerMat,
    podMat,
    mergedStoneBaseGeo,
    stemLatheGeo,
    lowerRingGeo,
    outerRingGeo,
    midRingGeo,
    innerRingGeo,
    podGeo,
  } = getSharedLotusThroneResources();

  return (
    <group position={[0, 0, 0]}>
      {/* Khối đế đá tròn nhiều tầng vững chãi (đã gộp tối ưu) */}
      <mesh geometry={mergedStoneBaseGeo} material={stoneBaseMat} receiveShadow />

      {/* Thân eo đài sen uốn lượn liền khối (LatheGeometry) */}
      <mesh geometry={stemLatheGeo} material={carvedStemMat} receiveShadow />

      {/* 4 Tầng cánh sen uốn khum tròn mềm mại (gộp 70 cánh sen thành 4 mesh dùng chung GPU) */}
      <mesh geometry={lowerRingGeo} material={petalLowerMat} receiveShadow />
      <mesh geometry={outerRingGeo} material={petalOuterMat} receiveShadow />
      <mesh geometry={midRingGeo} material={petalMidMat} receiveShadow />
      <mesh geometry={innerRingGeo} material={petalInnerMat} receiveShadow />

      {/* Gương đài sen vàng phẳng mịn nơi Đức Phật tọa thiền */}
      <mesh geometry={podGeo} material={podMat} receiveShadow />
    </group>
  );
};

// ========================================================
// 2. TỌA BÌNH THƯỜNG (Stepped Sumeru Pedestal - Tu Di Tòa Bát Giác)
// Dành cho 2 Tôn Tượng Hai Bên (TUYỆT ĐỐI KHÔNG CÓ HOA SEN)
// ========================================================
const SideOrdinaryPedestal: React.FC = () => {
  const graniteMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: '#3A2E26' }),
    []
  );
  const darkTeakMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: '#542610' }),
    []
  );
  const goldTrimMat = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: '#C8972D',
        specular: new THREE.Color('#FFE899'),
        shininess: 48,
      }),
    []
  );
  const cushionMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: '#7E2018' }),
    []
  );

  return (
    <group position={[0, 0, 0]}>
      {/* Cấp 1: Đế bát giác đá nguyên khối dưới cùng */}
      <mesh position={[0, 0.14, 0]} receiveShadow>
        <cylinderGeometry args={[1.36, 1.48, 0.26, 8]} />
        <primitive object={graniteMat} attach="material" />
      </mesh>

      {/* Cấp 2: Chỉ viền giật cấp bát giác đồng thau */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[1.28, 1.34, 0.06, 8]} />
        <primitive object={goldTrimMat} attach="material" />
      </mesh>

      {/* Cấp 3: Gờ chuyển tiếp đá hoa cương */}
      <mesh position={[0, 0.42, 0]} receiveShadow>
        <cylinderGeometry args={[1.18, 1.28, 0.22, 8]} />
        <primitive object={graniteMat} attach="material" />
      </mesh>

      {/* Cấp 4: Thân eo bệ Tu Di bằng gỗ lim chạm trổ kỷ hà trang nghiêm */}
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[1.05, 1.05, 0.28, 8]} />
        <primitive object={darkTeakMat} attach="material" />
      </mesh>
      {/* Nẹp góc đồng trang trí quanh eo */}
      {Array.from({ length: 8 }).map((_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={`corner-strip-${i}`}
            position={[Math.cos(ang) * 1.04, 0.65, Math.sin(ang) * 1.04]}
            rotation={[0, -ang + Math.PI / 8, 0]}
          >
            <boxGeometry args={[0.06, 0.27, 0.06]} />
            <primitive object={goldTrimMat} attach="material" />
          </mesh>
        );
      })}

      {/* Cấp 5: Gờ loe đỉnh bệ Tu Di */}
      <mesh position={[0, 0.86, 0]} receiveShadow>
        <cylinderGeometry args={[1.25, 1.06, 0.18, 8]} />
        <primitive object={graniteMat} attach="material" />
      </mesh>

      {/* Cấp 6: Mặt bàn phẳng bệ bát giác */}
      <mesh position={[0, 0.98, 0]} receiveShadow>
        <cylinderGeometry args={[1.24, 1.24, 0.08, 8]} />
        <primitive object={darkTeakMat} attach="material" />
      </mesh>

      {/* Tấm đệm tọa thiền êm ái trang nghiêm (KHÔNG CÓ CÁNH HOA SEN) */}
      <mesh position={[0, 1.06, 0]} receiveShadow>
        <cylinderGeometry args={[1.08, 1.1, 0.1, 12]} />
        <primitive object={cushionMat} attach="material" />
      </mesh>
    </group>
  );
};

// ========================================================
// 3. THÂN TƯỢNG ĐỨC PHẬT ĐỒNG BỘ TẠO HÌNH LIỀN KHỐI VỚI PHẬT TỬ (KHÔNG CÓ TÓC)
// Sử dụng trực tiếp kiến trúc hình học liền khối của HumanoidDevotee:
// - Áo LatheGeometry, tay chân TubeGeometry, bờ vai nâng cao tròn đầy, bàn tay búp sen, bàn chân chi tiết
// - Đầu Oval an nhiên, từ bi và tuyệt đối KHÔNG CÓ TÓC (hideHair={true}, hairStyle='bald')
// ========================================================
interface BuddhaFigureProps {
  mudra: 'dhyana' | 'vitarka' | 'bhumisparsha';
  robeColor?: string;
  goldColor?: string;
}

const BuddhaFigure: React.FC<BuddhaFigureProps> = ({
  mudra,
  robeColor = '#E6B325',
  goldColor = '#F5C542',
}) => {
  const buddhaConfig = useMemo(
    () => ({
      name: 'Đức Phật',
      gender: 'male' as const,
      robeColor,
      robeName: 'Hoàng Kim Cà Sa',
      bottomType: 'pants' as const,
      hairStyle: 'bald' as const,
    }),
    [robeColor]
  );

  // Tượng trung tâm tọa thiền tĩnh tại (tay đặt trên gối), hai tượng hai bên tọa thiền chắp tay búp sen
  const sittingHandPose = mudra === 'dhyana' ? 'meditate' : 'pray';

  return (
    <group position={[0, -0.05, 0]}>
      <HumanoidDevotee
        config={buddhaConfig}
        pose="meditate"
        sittingHandPose={sittingHandPose}
        hideHair={true}
        isGoldenStatue={true}
        statueGoldColor={goldColor}
        scale={1.85}
        showNameBadge={false}
        animate={false}
        renderLocalCushion={false}
      />
    </group>
  );
};

// ========================================================
// 4. VÒNG HÀO QUANG LINH THIÊNG (Mandorla Aureole Phía Sau Lưng)
// Sử dụng MeshBasicMaterial (tự phát sáng, không tốn phép tính ánh sáng GPU)
// ========================================================
interface HaloProps {
  rayCount?: number;
  outerRadius?: number;
  innerRadius?: number;
}

const MandorlaHalo: React.FC<HaloProps> = ({
  rayCount = 24,
  outerRadius = 1.5,
  innerRadius = 1.15,
}) => {
  const mergedRaysGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const baseCone = new THREE.ConeGeometry(0.045, 0.38, 4);
    const mat = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const euler = new THREE.Euler();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const r = outerRadius + 0.1;

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const g = baseCone.clone();
      pos.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
      euler.set(0, 0, angle + Math.PI / 2);
      quat.setFromEuler(euler);
      mat.compose(pos, quat, scale);
      g.applyMatrix4(mat);
      parts.push(g);
    }
    return mergePetalGeometries(parts);
  }, [rayCount, outerRadius]);

  return (
    <group position={[0, 1.68, -0.35]}>
      {/* Vành đĩa vàng sáng rực */}
      <mesh>
        <ringGeometry args={[innerRadius, outerRadius, 32]} />
        <meshBasicMaterial
          color="#FFC800"
          side={THREE.DoubleSide}
          transparent
          opacity={0.88}
        />
      </mesh>
      {/* Vầng sáng vàng kim bên trong */}
      <mesh position={[0, 0, -0.02]}>
        <circleGeometry args={[innerRadius, 32]} />
        <meshBasicMaterial
          color="#FFD54F"
          side={THREE.DoubleSide}
          transparent
          opacity={0.72}
        />
      </mesh>
      {/* Toàn bộ tia hào quang gộp thành 1 mesh duy nhất */}
      <mesh geometry={mergedRaysGeo}>
        <meshBasicMaterial color="#FFE066" />
      </mesh>
    </group>
  );
};

// ========================================================
// 6. COMPONENT CHÍNH: TAM THẾ PHẬT ĐÀI UY NGHI (3 TƯỢNG PHẬT)
// ========================================================
export const BuddhaStatue: React.FC<BuddhaStatueProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1.0,
}) => {
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* 1 nguồn sáng trung tâm duy nhất chiếu sáng cả 3 pho tượng Tam Thế Phật (thay vì 4 đèn như trước) */}
      <pointLight
        position={[0, 6.2, -3.5]}
        intensity={2.8}
        color="#FFE58F"
        distance={22}
        decay={1.5}
      />

      {/* ========================================================
          A. TƯỢNG ĐỨC PHẬT TRUNG TÂM (TO NHẤT - NGỒI TRÊN BÔNG SEN)
          Kích thước to hùng vĩ để lấp đầy không gian chánh điện mở rộng
          ======================================================== */}
      <group position={[0, 1.6, -6.0]} scale={[2.75, 2.75, 2.75]}>
        {/* 1. ĐÀI SEN VÀNG NỞ RỘ (Cân đối vừa vặn trên bục nâng trung tâm của Đại Phật Đài) */}
        <group scale={[0.58, 0.88, 0.58]}>
          <CenterLotusThrone />
        </group>

        {/* 2. KIM THÂN ĐỨC PHẬT CÓ ĐỘ HOÀN THIỆN GIẢI PHẪU CAO CẤP */}
        <group position={[0, 1.0, 0]}>
          <BuddhaFigure
            mudra="dhyana"
            robeColor="#D89E28"
            goldColor="#F5C342"
          />

          {/* 3. VÒNG HÀO QUANG LINH THIÊNG 24 TIA */}
          <MandorlaHalo
            rayCount={24}
            outerRadius={1.55}
            innerRadius={1.18}
          />
        </group>
      </group>

      {/* ========================================================
          B. TƯỢNG TÔN GIẢ / ĐỨC PHẬT BÊN TRÁI (NGỒI TRÊN TỌA BÌNH THƯỜNG)
          Ngồi trên bệ đá bát giác Tu Di (KHÔNG HOA SEN), hướng nhẹ vào trung tâm
          ======================================================== */}
      <group
        position={[-6.2, 1.38, -6.0]}
        rotation={[0, 0.2, 0]}
        scale={[2.08, 2.08, 2.08]}
      >
        {/* 1. TỌA BÌNH THƯỜNG (Bệ Tu Di Bát Giác Giật Cấp, vừa vặn trên bục nâng trái) */}
        <group scale={[0.68, 0.88, 0.68]}>
          <SideOrdinaryPedestal />
        </group>

        {/* 2. KIM THÂN ĐỨC PHẬT CÓ ĐỘ HOÀN THIỆN GIẢI PHẪU CAO CẤP */}
        <group position={[0, 0.98, 0]}>
          <BuddhaFigure
            mudra="vitarka"
            robeColor="#DF8822"
            goldColor="#F4C03C"
          />

          {/* 3. VÒNG HÀO QUANG LINH THIÊNG 18 TIA */}
          <MandorlaHalo
            rayCount={18}
            outerRadius={1.38}
            innerRadius={1.05}
          />
        </group>
      </group>

      {/* ========================================================
          C. TƯỢNG TÔN GIẢ / ĐỨC PHẬT BÊN PHẢI (NGỒI TRÊN TỌA BÌNH THƯỜNG)
          Ngồi trên bệ đá bát giác Tu Di (KHÔNG HOA SEN), hướng nhẹ vào trung tâm
          ======================================================== */}
      <group
        position={[6.2, 1.38, -6.0]}
        rotation={[0, -0.2, 0]}
        scale={[2.08, 2.08, 2.08]}
      >
        {/* 1. TỌA BÌNH THƯỜNG (Bệ Tu Di Bát Giác Giật Cấp, vừa vặn trên bục nâng phải) */}
        <group scale={[0.68, 0.88, 0.68]}>
          <SideOrdinaryPedestal />
        </group>

        {/* 2. KIM THÂN ĐỨC PHẬT CÓ ĐỘ HOÀN THIỆN GIẢI PHẪU CAO CẤP */}
        <group position={[0, 0.98, 0]}>
          <BuddhaFigure
            mudra="bhumisparsha"
            robeColor="#D28F20"
            goldColor="#F4C03C"
          />

          {/* 3. VÒNG HÀO QUANG LINH THIÊNG 18 TIA */}
          <MandorlaHalo
            rayCount={18}
            outerRadius={1.38}
            innerRadius={1.05}
          />
        </group>
      </group>
    </group>
  );
};
