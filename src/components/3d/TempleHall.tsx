import React from 'react';
import * as THREE from 'three';

function mergeLanternGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
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

// Khởi tạo 1 lần duy nhất hình học Đèn Lồng Tròn Truyền Thống Trung Hoa (Bầu tròn dẹt nhẹ có múi nan + Cổ mạ vàng + Tua rua đỏ)
const sharedChineseLantern = (() => {
  // 1. Bầu lụa đỏ tròn truyền thống (Oblate Sphere có 20 múi nan tre mềm mại, tối ưu lưới đa giác)
  const ribCount = 20;
  const widthSegs = ribCount * 2;
  const heightSegs = 16;
  const silkBodyGeo = new THREE.SphereGeometry(0.62, widthSegs, heightSegs);
  const pos = silkBodyGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const angle = Math.atan2(z, x);
    const rRatio = Math.sqrt(x * x + z * z) / 0.62;
    // Tạo độ phồng nhẹ từng múi nan lụa đặc trưng của đèn lồng tròn Trung Hoa
    const ribBulge = 1.0 + Math.abs(Math.sin(angle * (ribCount * 0.5))) * 0.032 * rRatio;
    // Dẹt nhẹ 2 đầu cực tạo dáng bầu tròn đầy đặn (cao ~ 1.02m, đường kính ~ 1.26m)
    pos.setXYZ(i, x * ribBulge, y * 0.82, z * ribBulge);
  }
  pos.needsUpdate = true;
  silkBodyGeo.computeVertexNormals();

  // 2. Các chi tiết mạ vàng: Dây treo + Nắp cổ trên + Vành kim loại + Đế cổ dưới + Chuỗi hạt tua rua
  const cordGeo = new THREE.CylinderGeometry(0.014, 0.014, 2.5, 6);
  cordGeo.translate(0, 1.72, 0);

  const topCapGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.11, 16);
  topCapGeo.translate(0, 0.50, 0);

  const topRimGeo = new THREE.TorusGeometry(0.27, 0.024, 8, 16);
  topRimGeo.rotateX(Math.PI / 2);
  topRimGeo.translate(0, 0.45, 0);

  const bottomCapGeo = new THREE.CylinderGeometry(0.26, 0.22, 0.10, 16);
  bottomCapGeo.translate(0, -0.50, 0);

  const bottomRimGeo = new THREE.TorusGeometry(0.25, 0.022, 8, 16);
  bottomRimGeo.rotateX(Math.PI / 2);
  bottomRimGeo.translate(0, -0.45, 0);

  // Hai đai kim tuyến vàng ôm vòng bụng trên và dưới của bầu đèn tròn
  const upperBandGeo = new THREE.TorusGeometry(0.545, 0.012, 6, 20);
  upperBandGeo.rotateX(Math.PI / 2);
  upperBandGeo.translate(0, 0.24, 0);

  const lowerBandGeo = new THREE.TorusGeometry(0.545, 0.012, 6, 20);
  lowerBandGeo.rotateX(Math.PI / 2);
  lowerBandGeo.translate(0, -0.24, 0);

  const tasselGoldCap = new THREE.CylinderGeometry(0.045, 0.065, 0.07, 10);
  tasselGoldCap.translate(0, -0.68, 0);

  const goldPartsGeo = mergeLanternGeos([
    cordGeo,
    topCapGeo,
    topRimGeo,
    bottomCapGeo,
    bottomRimGeo,
    upperBandGeo,
    lowerBandGeo,
    tasselGoldCap,
  ]);

  // 3. Nút thắt cát tường đỏ phía trên & Chùm tua rua đỏ rủ mềm phía dưới
  const topKnotGeo = new THREE.SphereGeometry(0.06, 8, 8);
  topKnotGeo.scale(1.2, 0.75, 0.75);
  topKnotGeo.translate(0, 0.62, 0);

  const bottomKnotGeo = new THREE.SphereGeometry(0.05, 8, 8);
  bottomKnotGeo.translate(0, -0.60, 0);

  const tasselSkirtGeo = new THREE.CylinderGeometry(0.055, 0.095, 0.52, 10);
  tasselSkirtGeo.translate(0, -0.96, 0);

  const redTasselGeo = mergeLanternGeos([topKnotGeo, bottomKnotGeo, tasselSkirtGeo]);

  const silkMat = new THREE.MeshLambertMaterial({
    color: '#C61A1A',
    emissive: new THREE.Color('#FF6D00'),
    emissiveIntensity: 0.78,
  });

  const goldMat = new THREE.MeshPhongMaterial({
    color: '#E5B83B',
    specular: new THREE.Color('#FFF0A8'),
    shininess: 48,
    emissive: new THREE.Color('#9E6B12'),
    emissiveIntensity: 0.15,
  });

  const tasselMat = new THREE.MeshLambertMaterial({
    color: '#B71C1C',
    emissive: new THREE.Color('#D84315'),
    emissiveIntensity: 0.35,
  });

  return { silkBodyGeo, goldPartsGeo, redTasselGeo, silkMat, goldMat, tasselMat };
})();

export const TempleHall: React.FC = () => {
  // Reusable Lightweight Materials (MeshLambertMaterial & MeshPhongMaterial giảm hơn 65% phép tính GPU pixel shader)
  const vermilionWoodMat = (
    <meshPhongMaterial color="#6B1D1D" specular="#9E3B3B" shininess={24} />
  );
  const darkTeakMat = (
    <meshLambertMaterial color="#24160E" />
  );
  const templeWallMat = (
    <meshLambertMaterial color="#261A13" />
  );
  const roofCeilingMat = (
    <meshLambertMaterial color="#24150D" />
  );
  const goldReliefMat = (
    <meshPhongMaterial color="#D4AF37" specular="#FFF0A8" shininess={52} />
  );
  const stonePlinthMat = (
    <meshLambertMaterial color="#3D352E" />
  );

  return (
    <group>
      {/* ========================================================
          1. SÀN ĐẠI HÙNG BẢO ĐIỆN VĨ ĐẠI MỞ RỘNG (34m x 57m)
          ======================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 16.0]} receiveShadow>
        <planeGeometry args={[34.5, 57.0]} />
        <meshLambertMaterial color="#1B130E" />
      </mesh>

      {/* Thảm đỏ trung tâm dâng lễ dẫn từ cửa Tam Quan đến bàn hương */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 22.0]} receiveShadow>
        <planeGeometry args={[4.0, 42.0]} />
        <meshLambertMaterial color="#541212" />
      </mesh>

      {/* Hoa sen vàng viền thảm trước bàn đảnh lễ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 2.05]}>
        <ringGeometry args={[1.05, 1.3, 24]} />
        <meshBasicMaterial color="#D4AF37" />
      </mesh>

      {/* ========================================================
          2. HỆ THỐNG TƯỜNG BAO 4 PHÍA MỞ RỘNG CAO 14m, RỘNG 34m, DÀI 56m
          ======================================================== */}
      {/* TƯỜNG HẬU (Back Wall at Z = -11.5m, cao 22.0m) */}
      <group position={[0, 11.0, -11.5]}>
        <mesh receiveShadow>
          <boxGeometry args={[34.4, 22.0, 0.5]} />
          {templeWallMat}
        </mesh>
        {/* Khung gỗ ốp viền tường hậu */}
        <mesh position={[0, -1.0, 0.26]}>
          <boxGeometry args={[32.0, 19.5, 0.06]} />
          <meshLambertMaterial color="#3E1A0E" />
        </mesh>
        {/* Phù điêu Bánh xe Pháp Luân mạ vàng uy nghi sau tượng Phật */}
        <group position={[0, 4.2, 0.35]} scale={[1.35, 1.35, 1.35]}>
          <mesh>
            <torusGeometry args={[2.2, 0.1, 10, 32]} />
            {goldReliefMat}
          </mesh>
          <mesh>
            <sphereGeometry args={[0.3, 12, 12]} />
            {goldReliefMat}
          </mesh>
          {Array.from({ length: 8 }).map((_, i) => {
            const ang = (i / 8) * Math.PI * 2;
            return (
              <mesh key={`spoke-${i}`} rotation={[0, 0, ang]}>
                <cylinderGeometry args={[0.04, 0.04, 2.1, 8]} />
                {goldReliefMat}
              </mesh>
            );
          })}
        </group>
      </group>

      {/* TƯỜNG HÔNG TRÁI (Left Wall at X = -17.0m, cao 14.0m, dài 54.4m) */}
      <group position={[-17.0, 7.0, 17.0]}>
        <mesh receiveShadow>
          <boxGeometry args={[0.5, 14.0, 54.4]} />
          {templeWallMat}
        </mesh>
        {/* Chân tường ốp đá hoa sen */}
        <mesh position={[0.26, -6.3, 0]}>
          <boxGeometry args={[0.08, 1.4, 54.2]} />
          {stonePlinthMat}
        </mesh>
        {/* 6 Cửa sổ chấn song chữ Vạn cách điệu */}
        {[-4.0, 4.0, 12.0, 20.0, 28.0, 36.0].map((wz, wi) => (
          <group key={`win-l-${wi}`} position={[0.26, 2.5, wz - 17.0]}>
            <mesh>
              <boxGeometry args={[0.06, 3.2, 2.4]} />
              {vermilionWoodMat}
            </mesh>
            {[-0.8, -0.27, 0.27, 0.8].map((gx, gi) => (
              <mesh key={`grill-l-${gi}`} position={[0.04, 0, gx]}>
                <cylinderGeometry args={[0.03, 0.03, 2.8, 6]} />
                {darkTeakMat}
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* TƯỜNG HÔNG PHẢI (Right Wall at X = 17.0m, cao 14.0m, dài 54.4m) */}
      <group position={[17.0, 7.0, 17.0]}>
        <mesh receiveShadow>
          <boxGeometry args={[0.5, 14.0, 54.4]} />
          {templeWallMat}
        </mesh>
        <mesh position={[-0.26, -6.3, 0]}>
          <boxGeometry args={[0.08, 1.4, 54.2]} />
          {stonePlinthMat}
        </mesh>
        {[-4.0, 4.0, 12.0, 20.0, 28.0, 36.0].map((wz, wi) => (
          <group key={`win-r-${wi}`} position={[-0.26, 2.5, wz - 17.0]}>
            <mesh>
              <boxGeometry args={[0.06, 3.2, 2.4]} />
              {vermilionWoodMat}
            </mesh>
            {[-0.8, -0.27, 0.27, 0.8].map((gx, gi) => (
              <mesh key={`grill-r-${gi}`} position={[-0.04, 0, gx]}>
                <cylinderGeometry args={[0.03, 0.03, 2.8, 6]} />
                {darkTeakMat}
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* TƯỜNG TIỀN / CỬA TAM QUAN (Front Wall at Z = 44.0m, cao 14.0m) */}
      <group position={[0, 7.0, 44.0]}>
        <mesh receiveShadow>
          <boxGeometry args={[34.4, 14.0, 0.5]} />
          {templeWallMat}
        </mesh>
        {/* 3 Bộ Cửa Bức Bàn gỗ lim lớn */}
        {[-8.5, 0, 8.5].map((dx, di) => (
          <group key={`door-${di}`} position={[dx, -1.8, -0.26]}>
            <mesh>
              <boxGeometry args={[5.4, 9.5, 0.08]} />
              {vermilionWoodMat}
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <boxGeometry args={[4.8, 8.8, 0.05]} />
              {darkTeakMat}
            </mesh>
            {[-1.5, 1.5].map((nx, ni) =>
              [-2.8, -0.9, 1.0, 2.9].map((ny, nyi) => (
                <mesh key={`stud-${ni}-${nyi}`} position={[nx, ny, 0.1]}>
                  <sphereGeometry args={[0.08, 8, 8]} />
                  {goldReliefMat}
                </mesh>
              ))
            )}
          </group>
        ))}
      </group>

      {/* ========================================================
          3. MÁI CHÙA TAM GIÁC HƯỚNG LÊN TRÊN CAO VÚT 22.5m (PITCHED ROOF)
          Đỉnh nóc (Y = 22.5m) cao vút ở giữa, dốc xuống 2 bên tường (Y = 14.0m)
          Góc dốc: arctan(8.5 / 17.0) = 0.4636 rad (26.56°)
          ======================================================== */}
      <group>
        {/* MÁI TRÁI: Đỉnh ở giữa (X = 0, Y = 22.5m) dốc xuống tường trái (X = -17m, Y = 14.0m) */}
        <mesh
          position={[-8.5, 18.25, 17.0]}
          rotation={[0, 0, 0.4636]}
          receiveShadow
        >
          <boxGeometry args={[19.2, 0.35, 55.0]} />
          {roofCeilingMat}
        </mesh>

        {/* MÁI PHẢI: Đỉnh ở giữa (X = 0, Y = 22.5m) dốc xuống tường phải (X = 17m, Y = 14.0m) */}
        <mesh
          position={[8.5, 18.25, 17.0]}
          rotation={[0, 0, -0.4636]}
          receiveShadow
        >
          <boxGeometry args={[19.2, 0.35, 55.0]} />
          {roofCeilingMat}
        </mesh>

        {/* XÀ NÓC CHÍNH (THƯỢNG LƯƠNG - Central Ridge Beam) chạy dọc đỉnh mái tại Y = 22.4m */}
        <mesh position={[0, 22.4, 17.0]} castShadow>
          <boxGeometry args={[0.8, 0.8, 55.0]} />
          {vermilionWoodMat}
        </mesh>

        {/* CÁC VÌ KÈO GỖ NGANG HÌNH TAM GIÁC HƯỚNG LÊN TRÊN CHUẨN KIẾN TRÚC Á ĐÔNG */}
        {[-8.0, 0.0, 8.0, 16.0, 24.0, 32.0, 40.0].map((tz, ti) => (
          <group key={`truss-${ti}`} position={[0, 0, tz]}>
            {/* Xà ngang đáy vì kèo spanning 33.8m tại độ cao tường Y = 14.0m */}
            <mesh position={[0, 14.0, 0]} castShadow>
              <boxGeometry args={[33.8, 0.5, 0.45]} />
              {darkTeakMat}
            </mesh>

            {/* Trụ nóc (King post) vươn cao từ Y = 14.0m lên đỉnh thượng lương Y = 22.3m */}
            <mesh position={[0, 18.15, 0]} castShadow>
              <boxGeometry args={[0.48, 8.3, 0.45]} />
              {vermilionWoodMat}
            </mesh>

            {/* Thanh kèo nghiêng trái dốc lên đỉnh */}
            <mesh position={[-8.5, 18.15, 0]} rotation={[0, 0, 0.4636]} castShadow>
              <boxGeometry args={[18.8, 0.42, 0.42]} />
              {darkTeakMat}
            </mesh>

            {/* Thanh kèo nghiêng phải dốc lên đỉnh */}
            <mesh position={[8.5, 18.15, 0]} rotation={[0, 0, -0.4636]} castShadow>
              <boxGeometry args={[18.8, 0.42, 0.42]} />
              {darkTeakMat}
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================
          4. ĐẠI PHẬT ĐÀI TAM THẾ PHẬT NGUY NGA (Z = -6.0m, rộng 19.8m, sâu 8.0m)
          Mở rộng toàn diện bề ngang & chiều sâu để đỡ trọn vẹn cả 3 bàn tọa của 3 Đại Tượng Phật
          ======================================================== */}
      <group position={[0, 0, -6.0]}>
        {/* Khối bệ bàn thờ gỗ gụ đồ sộ trải rộng 19.2m x sâu 7.6m đỡ trọn vẹn cả 3 đại tượng */}
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[19.2, 1.1, 7.6]} />
          {vermilionWoodMat}
        </mesh>
        <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[19.8, 0.1, 8.0]} />
          {darkTeakMat}
        </mesh>

        {/* 3 Bức phù điêu hoa sen & chữ Vạn mạ vàng chạm lộng mặt trước bàn thờ */}
        <mesh position={[0, 0.55, 3.81]}>
          <boxGeometry args={[6.4, 0.75, 0.02]} />
          {goldReliefMat}
        </mesh>
        <mesh position={[-6.2, 0.55, 3.81]}>
          <boxGeometry args={[4.6, 0.75, 0.02]} />
          {goldReliefMat}
        </mesh>
        <mesh position={[6.2, 0.55, 3.81]}>
          <boxGeometry args={[4.6, 0.75, 0.02]} />
          {goldReliefMat}
        </mesh>

        {/* Bục nâng cao trung tâm giật 2 cấp (7.2m x 7.2m và 6.7m x 6.7m) lớn hơn trọn vẹn Tòa Sen Trung Tâm (6.25m) */}
        <mesh position={[0, 1.31, 0]} castShadow receiveShadow>
          <boxGeometry args={[7.2, 0.22, 7.2]} />
          {vermilionWoodMat}
        </mesh>
        <mesh position={[0, 1.51, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.7, 0.18, 6.7]} />
          {darkTeakMat}
        </mesh>

        {/* 2 Bục nâng hai bên giật cấp (4.8m x 5.2m) lớn hơn trọn vẹn Bàn Tọa Bát Giác Hai Bên (4.19m) */}
        <mesh position={[-6.2, 1.29, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.8, 0.18, 5.2]} />
          {darkTeakMat}
        </mesh>
        <mesh position={[6.2, 1.29, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.8, 0.18, 5.2]} />
          {darkTeakMat}
        </mesh>

        {/* Chân trụ gỗ lim vững chãi đỡ các góc bàn */}
        {[-9.2, -3.5, 3.5, 9.2].map((cx, ci) => (
          <mesh key={`altar-leg-f-${ci}`} position={[cx, 0.55, 3.75]}>
            <cylinderGeometry args={[0.12, 0.14, 1.05, 8]} />
            {darkTeakMat}
          </mesh>
        ))}
      </group>

      {/* ========================================================
          5. BÀN ÁN HƯƠNG TIỀN BÁI (BÀN ĐẢNH LỄ) LÙI RA PHÍA TRƯỚC (Z = 0.8m)
          Cách hẳn mặt trước Đại Phật Đài hơn 2m để tuyệt đối không che khuất 3 Tượng Phật
          ======================================================== */}
      <group position={[0, 0, 0.8]}>
        <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.4, 0.88, 1.3]} />
          {vermilionWoodMat}
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.6, 0.08, 1.5]} />
          {darkTeakMat}
        </mesh>
        <mesh position={[0, 0.44, 0.66]}>
          <boxGeometry args={[3.8, 0.6, 0.02]} />
          {goldReliefMat}
        </mesh>

        {[
          [-2.0, -0.5], [2.0, -0.5],
          [-2.0, 0.5], [2.0, 0.5],
        ].map(([cx, cz], ci) => (
          <mesh key={`tbl-leg-${ci}`} position={[cx, 0.2, cz]}>
            <cylinderGeometry args={[0.08, 0.1, 0.42, 8]} />
            {darkTeakMat}
          </mesh>
        ))}

        {/* Nến đồng */}
        <group position={[-1.7, 0.94, 0.1]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.14, 0.45, 10]} />
            {goldReliefMat}
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.03, 0.035, 0.3, 10]} />
            <meshLambertMaterial color="#FFF8E7" />
          </mesh>
          <mesh position={[0, 0.54, 0]}>
            <coneGeometry args={[0.025, 0.09, 6]} />
            <meshBasicMaterial color="#FFB300" />
          </mesh>
        </group>

        <group position={[1.7, 0.94, 0.1]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.14, 0.45, 10]} />
            {goldReliefMat}
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.03, 0.035, 0.3, 10]} />
            <meshLambertMaterial color="#FFF8E7" />
          </mesh>
          <mesh position={[0, 0.54, 0]}>
            <coneGeometry args={[0.025, 0.09, 6]} />
            <meshBasicMaterial color="#FFB300" />
          </mesh>
        </group>

        {/* Lọ sen hồng */}
        <group position={[-1.15, 0.94, 0.15]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.1, 0.42, 10]} />
            <meshLambertMaterial color="#3A7563" />
          </mesh>
          {[-0.06, 0.06, 0].map((dx, idx) => (
            <group key={`lotus-l-${idx}`} position={[dx, 0.32 + idx * 0.06, (idx - 1) * 0.05]}>
              <mesh rotation={[0.1, 0, dx * 2]}>
                <cylinderGeometry args={[0.008, 0.008, 0.3, 6]} />
                <meshLambertMaterial color="#2E5A27" />
              </mesh>
              <mesh position={[0, 0.18, 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshLambertMaterial color="#FF69B4" />
              </mesh>
            </group>
          ))}
        </group>

        <group position={[1.15, 0.94, 0.15]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.1, 0.42, 10]} />
            <meshLambertMaterial color="#3A7563" />
          </mesh>
          {[-0.06, 0.06, 0].map((dx, idx) => (
            <group key={`lotus-r-${idx}`} position={[dx, 0.32 + idx * 0.06, (idx - 1) * 0.05]}>
              <mesh rotation={[0.1, 0, dx * 2]}>
                <cylinderGeometry args={[0.008, 0.008, 0.3, 6]} />
                <meshLambertMaterial color="#2E5A27" />
              </mesh>
              <mesh position={[0, 0.18, 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshLambertMaterial color="#FF69B4" />
              </mesh>
            </group>
          ))}
        </group>

        {/* Mâm ngũ quả */}
        <group position={[0, 0.95, 0.35]}>
          <mesh>
            <cylinderGeometry args={[0.34, 0.2, 0.08, 14]} />
            {goldReliefMat}
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.13, 10, 10]} />
            <meshLambertMaterial color="#FFD54F" />
          </mesh>
          <mesh position={[-0.11, 0.09, 0.09]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshLambertMaterial color="#E53935" />
          </mesh>
          <mesh position={[0.11, 0.09, 0.09]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshLambertMaterial color="#FB8C00" />
          </mesh>
        </group>
      </group>

      {/* ========================================================
          6. PHÁP KHÍ: CHUÔNG GIA TRÌ & MÕ (Đồng trục Z = 0.8m với Bàn Đảnh Lễ)
          ======================================================== */}
      <group position={[3.2, 0, 0.8]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.3, 0.36, 0.8, 12]} />
          {darkTeakMat}
        </mesh>
        <mesh position={[0, 0.84, 0]}>
          <cylinderGeometry args={[0.28, 0.3, 0.1, 14]} />
          <meshLambertMaterial color="#991B1B" />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.28, 0.2, 0.38, 16, 1, true]} />
          {goldReliefMat}
        </mesh>
      </group>

      <group position={[-3.2, 0, 0.8]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.3, 0.36, 0.8, 12]} />
          {darkTeakMat}
        </mesh>
        <mesh position={[0, 0.84, 0]}>
          <cylinderGeometry args={[0.28, 0.3, 0.1, 14]} />
          <meshLambertMaterial color="#991B1B" />
        </mesh>
        <mesh position={[0, 1.02, 0]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshLambertMaterial color="#4A2511" />
        </mesh>
      </group>

      {/* ========================================================
          7. HÀNG CỘT GỖ SƠN SON VĨ ĐẠI CHỐNG ĐỠ VÌ KÈO (CAO 13.5m)
          ======================================================== */}
      {[
        [-11.0, -5.0], [11.0, -5.0],
        [-11.0, 3.0],  [11.0, 3.0],
        [-11.0, 11.0], [11.0, 11.0],
        [-11.0, 19.0], [11.0, 19.0],
        [-11.0, 27.0], [11.0, 27.0],
        [-11.0, 35.0], [11.0, 35.0],
        [-11.0, 42.0], [11.0, 42.0],
      ].map(([x, z], idx) => (
        <group key={`col-pillar-${idx}`} position={[x, 0, z]}>
          <mesh position={[0, 0.22, 0]} receiveShadow>
            <cylinderGeometry args={[0.58, 0.70, 0.44, 12]} />
            {stonePlinthMat}
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <cylinderGeometry args={[0.48, 0.56, 0.20, 12]} />
            {stonePlinthMat}
          </mesh>
          <mesh position={[0, 7.1, 0]}>
            <cylinderGeometry args={[0.42, 0.45, 13.4, 14]} />
            {vermilionWoodMat}
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <torusGeometry args={[0.46, 0.04, 8, 16]} />
            {goldReliefMat}
          </mesh>
        </group>
      ))}

      {/* ========================================================
          8. ĐÈN LỒNG TRÒN ĐỎ TRUYỀN THỐNG TRUNG HOA TREO TỪ XÀ MÁI
          ======================================================== */}
      <pointLight position={[0, 11.5, 16.0]} color="#FFB74D" intensity={2.2} distance={38} decay={1.5} />
      {[-6.0, 6.0].map((x, colIdx) =>
        [0.0, 8.0, 16.0, 24.0, 32.0, 40.0].map((z, rowIdx) => {
          const keyIdx = colIdx * 6 + rowIdx;
          return (
            <group
              key={`lantern-${keyIdx}`}
              position={[x, 11.8, z]}
            >
              {/* Bầu đèn lồng lụa đỏ tròn truyền thống Trung Hoa (có múi nan tre uốn tròn mềm mại) */}
              <mesh geometry={sharedChineseLantern.silkBodyGeo} material={sharedChineseLantern.silkMat} />
              {/* Cổ trên/dưới mạ vàng, đai kim tuyến vàng & dây treo */}
              <mesh geometry={sharedChineseLantern.goldPartsGeo} material={sharedChineseLantern.goldMat} />
              {/* Nút thắt cát tường & Chùm tua rua đỏ rủ xuống dưới đáy đèn */}
              <mesh geometry={sharedChineseLantern.redTasselGeo} material={sharedChineseLantern.tasselMat} />
            </group>
          );
        })
      )}
    </group>
  );
};
