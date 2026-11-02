import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DevoteeConfig, DevoteePose } from '../../types/avatar';

export interface HumanoidDevoteeProps {
  config: DevoteeConfig;
  pose?: DevoteePose;
  sittingHandPose?: 'meditate' | 'pray';
  hideHair?: boolean;
  isGoldenStatue?: boolean;
  statueGoldColor?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  isMainUser?: boolean;
  showNameBadge?: boolean;
  animate?: boolean;
  renderLocalCushion?: boolean;
  modelUrl?: string;
  onPlantIncense?: () => void;
  onCompleteIncenseRitual?: () => void;
}

/**
 * Gộp nhiều BufferGeometry cùng vật liệu thành 1 BufferGeometry duy nhất để giảm 90% số lượng Draw Calls WebGL
 */
function mergeBufferGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
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
    const pos = g.attributes.position as THREE.BufferAttribute;
    const norm = g.attributes.normal as THREE.BufferAttribute;
    positions.set(pos.array as Float32Array, vOffset * 3);
    if (norm) {
      normals.set(norm.array as Float32Array, vOffset * 3);
    }
    if (g.index) {
      const idxArr = g.index.array;
      for (let k = 0; k < idxArr.length; k++) {
        indices[iOffset + k] = idxArr[k] + vOffset;
      }
      iOffset += idxArr.length;
    } else {
      for (let k = 0; k < pos.count; k++) {
        indices[iOffset + k] = vOffset + k;
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

const footGeoCache = new Map<string, { sockBodyGeo: THREE.BufferGeometry; sockSoleGeo: THREE.BufferGeometry }>();
function getSharedFootGeos(side: 'left' | 'right') {
  const cached = footGeoCache.get(side);
  if (cached) return cached;

  const sign = side === 'left' ? 1 : -1;

  // 1. Thân bàn chân uốn liền khối từ cổ chân qua mu bàn chân tới mũi chân
  const footCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0.062, -0.022),
    new THREE.Vector3(0, 0.015, -0.03),
    new THREE.Vector3(0, 0.002, 0.035),
    new THREE.Vector3(0, -0.008, 0.092)
  );
  const fGeo = new THREE.TubeGeometry(footCurve, 10, 0.038, 10, false);
  fGeo.scale(1.08, 0.82, 1.0);
  fGeo.computeVertexNormals();

  // 2. Cổ tất trắng
  const cGeo = new THREE.CylinderGeometry(0.043, 0.046, 0.065, 12, 1);
  cGeo.translate(0, 0.058, -0.022);
  cGeo.computeVertexNormals();

  // Viền gân thun cổ tất
  const r1Geo = new THREE.TorusGeometry(0.044, 0.0045, 6, 12);
  r1Geo.rotateX(Math.PI / 2);
  r1Geo.translate(0, 0.086, -0.022);
  r1Geo.computeVertexNormals();

  const r2Geo = new THREE.TorusGeometry(0.0445, 0.004, 6, 12);
  r2Geo.rotateX(Math.PI / 2);
  r2Geo.translate(0, 0.074, -0.022);
  r2Geo.computeVertexNormals();

  // 3. Gót chân bo tròn
  const hGeo = new THREE.SphereGeometry(0.042, 10, 8);
  hGeo.scale(0.96, 0.88, 1.08);
  hGeo.translate(0, 0.004, -0.042);
  hGeo.computeVertexNormals();

  // 4. Hai mắt cá chân
  const aGeo1 = new THREE.SphereGeometry(0.016, 8, 8);
  aGeo1.translate(-0.038 * sign, 0.036, -0.02);
  aGeo1.computeVertexNormals();

  const aGeo2 = new THREE.SphereGeometry(0.016, 8, 8);
  aGeo2.translate(0.038 * sign, 0.032, -0.022);
  aGeo2.computeVertexNormals();

  // 5. Đế tất
  const sGeo = new THREE.CapsuleGeometry(0.036, 0.085, 4, 8);
  sGeo.rotateX(Math.PI / 2);
  sGeo.scale(1.1, 0.26, 1.0);
  sGeo.translate(0, -0.021, 0.032);
  sGeo.computeVertexNormals();

  // 6. 5 ngón chân
  const tConfigs = [
    { x: -0.025 * sign, y: -0.008, z: 0.106, rad: 0.0135, len: 0.026, rotY: 0.04 * sign },
    { x: -0.010 * sign, y: -0.009, z: 0.110, rad: 0.0115, len: 0.026, rotY: 0.01 * sign },
    { x: 0.003 * sign, y: -0.010, z: 0.107, rad: 0.0108, len: 0.023, rotY: -0.02 * sign },
    { x: 0.015 * sign, y: -0.011, z: 0.102, rad: 0.0100, len: 0.020, rotY: -0.05 * sign },
    { x: 0.026 * sign, y: -0.012, z: 0.095, rad: 0.0090, len: 0.017, rotY: -0.08 * sign },
  ];
  const toeGeos = tConfigs.map((cfg) => {
    const g = new THREE.CapsuleGeometry(cfg.rad, cfg.len, 4, 6);
    g.rotateX(Math.PI / 2 + 0.1);
    g.rotateY(cfg.rotY);
    g.translate(cfg.x, cfg.y, cfg.z);
    g.computeVertexNormals();
    return g;
  });

  const sockBodyGeo = mergeBufferGeometries([cGeo, aGeo1, aGeo2, hGeo, fGeo, ...toeGeos]);
  const sockSoleGeo = mergeBufferGeometries([r1Geo, r2Geo, sGeo]);

  const res = { sockBodyGeo, sockSoleGeo };
  footGeoCache.set(side, res);
  return res;
}

/**
 * Bàn chân mang tất trắng điêu khắc chi tiết, rõ ràng (gộp thành 2 mesh dùng chung bộ nhớ GPU)
 */
const WhiteSockFoot: React.FC<{
  side: 'left' | 'right';
  material: THREE.Material;
  soleMaterial: THREE.Material;
}> = ({ side, material, soleMaterial }) => {
  const { sockBodyGeo, sockSoleGeo } = getSharedFootGeos(side);
  return (
    <group>
      <mesh geometry={sockBodyGeo} material={material} />
      <mesh geometry={sockSoleGeo} material={soleMaterial} />
    </group>
  );
};

const handGeoCache = new Map<string, THREE.BufferGeometry>();
function getSharedHandGeo(side: 'left' | 'right', isMeditate: boolean): THREE.BufferGeometry {
  const key = `${side}_${isMeditate ? 'meditate' : 'pray'}`;
  const cached = handGeoCache.get(key);
  if (cached) return cached;

  const isLeft = side === 'left';
  const palmSign = isMeditate ? (isLeft ? 1 : -1) : isLeft ? -1 : 1;

  const wGeo = new THREE.CylinderGeometry(0.032, 0.030, 0.044, 10, 1);
  wGeo.translate(0, -0.005, 0);
  wGeo.computeVertexNormals();

  const pGeo = new THREE.SphereGeometry(0.037, 10, 8);
  pGeo.scale(0.98, 1.24, 0.42);
  pGeo.translate(0, -0.036, 0);
  pGeo.computeVertexNormals();

  const thumbCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0.022, -0.020, 0.004 * palmSign),
    new THREE.Vector3(0.029, -0.036, 0.007 * palmSign),
    new THREE.Vector3(0.030, -0.056, 0.008 * palmSign),
    new THREE.Vector3(0.026, -0.074, 0.006 * palmSign)
  );
  const tGeo = new THREE.TubeGeometry(thumbCurve, 6, 0.0098, 6, false);
  tGeo.computeVertexNormals();

  const thumbTip = thumbCurve.getPoint(1);
  const tCap = new THREE.SphereGeometry(0.0092, 6, 6);
  tCap.translate(thumbTip.x, thumbTip.y, thumbTip.z);
  tCap.computeVertexNormals();

  const fSpecs = [
    { name: 'index', x: 0.0175, len: 0.065, r: 0.0092 },
    { name: 'middle', x: 0.0058, len: 0.073, r: 0.0096 },
    { name: 'ring', x: -0.0058, len: 0.066, r: 0.0092 },
    { name: 'pinky', x: -0.0170, len: 0.053, r: 0.0082 },
  ];

  const fingerParts: THREE.BufferGeometry[] = [];
  for (const f of fSpecs) {
    const midZ = (isMeditate ? 0.008 : -0.0015) * palmSign;
    const tipZ = (isMeditate ? 0.022 : 0.0045) * palmSign;
    const fCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(f.x, -0.054, 0),
      new THREE.Vector3(f.x * 0.99, -0.054 - f.len * 0.35, midZ),
      new THREE.Vector3(f.x * 0.96, -0.054 - f.len * 0.72, tipZ * 0.5),
      new THREE.Vector3(f.x * 0.93, -0.054 - f.len, tipZ)
    );
    const g = new THREE.TubeGeometry(fCurve, 6, f.r, 6, false);
    g.computeVertexNormals();
    fingerParts.push(g);

    const tipPos = fCurve.getPoint(1);
    const cap = new THREE.SphereGeometry(f.r * 0.92, 6, 6);
    cap.translate(tipPos.x, tipPos.y, tipPos.z);
    cap.computeVertexNormals();
    fingerParts.push(cap);
  }

  const merged = mergeBufferGeometries([wGeo, pGeo, tGeo, tCap, ...fingerParts]);
  handGeoCache.set(key, merged);
  return merged;
}

/**
 * Bàn tay búp sen liền mạch (gộp thành 1 mesh duy nhất dùng chung bộ nhớ GPU)
 */
const ContinuousLotusHand: React.FC<{
  side: 'left' | 'right';
  pose: DevoteePose;
  material: THREE.Material;
}> = ({ side, pose, material }) => {
  const geo = getSharedHandGeo(side, pose === 'meditate');
  return <mesh geometry={geo} material={material} />;
};

// ============================================================================
// MODULE-LEVEL GEOMETRY & MATERIAL CACHES (Tối ưu hóa hiệu năng Chánh Điện)
// Khởi tạo 1 lần duy nhất và tái sử dụng cho toàn bộ 100 Phật tử + 15 Tượng Phật
// ============================================================================
const materialCache = new Map<string, THREE.Material>();

function getCachedMaterial(key: string, factory: () => THREE.Material): THREE.Material {
  let mat = materialCache.get(key);
  if (!mat) {
    mat = factory();
    materialCache.set(key, mat);
  }
  return mat;
}

interface LowerBodyGeos {
  mergedPantsGeo: THREE.BufferGeometry;
  pelvisStandGeo: THREE.BufferGeometry;
  leftStandLegPivotGeo: THREE.BufferGeometry;
  rightStandLegPivotGeo: THREE.BufferGeometry;
}
const lowerBodyGeoCache = new Map<string, LowerBodyGeos>();

function getSharedLowerBodyGeos(isSitting: boolean): LowerBodyGeos {
  const key = isSitting ? 'sit' : 'stand';
  const cached = lowerBodyGeoCache.get(key);
  if (cached) return cached;

  // Khối hông & mông tròn trịa liền mạch nối từ đáy áo xuống hai đùi (Zero Gap)
  const pGeo = new THREE.SphereGeometry(0.155, 16, 12);
  pGeo.scale(1.22, 0.78, 0.92);
  pGeo.translate(0, isSitting ? 0.17 : 0.62, -0.01);
  pGeo.computeVertexNormals();

  const buildLeg = (side: 'left' | 'right') => {
    const s = side === 'left' ? -1 : 1;

    if (isSitting) {
      const zOffset = side === 'left' ? 0.0 : 0.025;
      const yOffset = side === 'left' ? 0.0 : 0.022;
      const legCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.105 * s, 0.175, -0.02),
        new THREE.Vector3(0.22 * s, 0.135, 0.06),
        new THREE.Vector3(0.295 * s, 0.105, 0.15),
        new THREE.Vector3(0.16 * s, 0.095 + yOffset, 0.225 + zOffset),
        new THREE.Vector3(0.02 * s, 0.105 + yOffset, 0.245 + zOffset),
      ]);

      const tubularSegments = 16;
      const radialSegments = 10;
      const baseR = 0.078;
      const geo = new THREE.TubeGeometry(legCurve, tubularSegments, baseR, radialSegments, false);

      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i <= tubularSegments; i++) {
        const u = i / tubularSegments;
        const c = legCurve.getPointAt(u);
        const rScale =
          u < 0.45
            ? 1.14 - u * 0.42
            : u < 0.75
            ? 0.95 + Math.sin(((u - 0.45) / 0.3) * Math.PI) * 0.06
            : 0.95 - ((u - 0.75) / 0.25) * 0.2;

        for (let j = 0; j <= radialSegments; j++) {
          const idx = i * (radialSegments + 1) + j;
          v.fromBufferAttribute(posAttr, idx);
          v.sub(c).multiplyScalar(rScale).add(c);
          posAttr.setXYZ(idx, v.x, v.y, v.z);
        }
      }
      geo.computeVertexNormals();

      const endPt = legCurve.getPoint(1);
      const endTan = legCurve.getTangent(1).normalize();
      const cuff = new THREE.TorusGeometry(baseR * 0.72, 0.011, 6, 12);
      cuff.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), endTan));
      cuff.translate(endPt.x, endPt.y, endPt.z);
      cuff.computeVertexNormals();

      return [geo, cuff];
    } else {
      const legX = 0.105 * s;
      const legCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(legX * 0.95, 0.64, -0.01),
        new THREE.Vector3(legX * 1.04, 0.47, 0.012),
        new THREE.Vector3(legX * 1.0, 0.28, -0.008),
        new THREE.Vector3(legX * 1.0, 0.095, -0.015)
      );

      const tubularSegments = 14;
      const radialSegments = 10;
      const baseR = 0.078;
      const geo = new THREE.TubeGeometry(legCurve, tubularSegments, baseR, radialSegments, false);

      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i <= tubularSegments; i++) {
        const u = i / tubularSegments;
        const c = legCurve.getPointAt(u);
        const rScale =
          u < 0.5
            ? 1.15 - (u / 0.5) * 0.23
            : u < 0.75
            ? 0.92 + Math.sin(((u - 0.5) / 0.25) * Math.PI) * 0.07
            : 0.92 - ((u - 0.75) / 0.25) * 0.14;

        for (let j = 0; j <= radialSegments; j++) {
          const idx = i * (radialSegments + 1) + j;
          v.fromBufferAttribute(posAttr, idx);
          v.sub(c).multiplyScalar(rScale).add(c);
          posAttr.setXYZ(idx, v.x, v.y, v.z);
        }
      }
      geo.computeVertexNormals();

      const cuff = new THREE.TorusGeometry(baseR * 0.76, 0.011, 6, 12);
      cuff.rotateX(Math.PI / 2);
      cuff.translate(legX, 0.095, -0.015);
      cuff.computeVertexNormals();

      return [geo, cuff];
    }
  };

  const leftGeos = buildLeg('left');
  const rightGeos = buildLeg('right');
  const mergedPantsGeo = mergeBufferGeometries([pGeo.clone(), ...leftGeos.map((g) => g.clone()), ...rightGeos.map((g) => g.clone())]);

  const leftPivot = mergeBufferGeometries(leftGeos);
  leftPivot.translate(0.105, -0.62, 0);
  const rightPivot = mergeBufferGeometries(rightGeos);
  rightPivot.translate(-0.105, -0.62, 0);

  const res: LowerBodyGeos = {
    mergedPantsGeo,
    pelvisStandGeo: pGeo,
    leftStandLegPivotGeo: leftPivot,
    rightStandLegPivotGeo: rightPivot,
  };
  lowerBodyGeoCache.set(key, res);
  return res;
}

interface UpperBodyAndArmsGeos {
  mergedRobeAndSleevesGeo: THREE.BufferGeometry;
  collarTorusGeo: THREE.BufferGeometry;
  leftHandPos: [number, number, number];
  rightHandPos: [number, number, number];
  leftHandQuat: THREE.Quaternion;
  rightHandQuat: THREE.Quaternion;
}
const upperBodyGeoCache = new Map<string, UpperBodyAndArmsGeos>();

function getSharedUpperBodyGeos(
  pose: DevoteePose,
  sittingHandPose: 'meditate' | 'pray',
  shoulderScaleX: number
): UpperBodyAndArmsGeos {
  const key = `${pose}_${sittingHandPose}_${shoulderScaleX}`;
  const cached = upperBodyGeoCache.get(key);
  if (cached) return cached;

  const isSitting = pose === 'meditate' || pose === 'bow';
  const profilePoints: THREE.Vector2[] = [];

  if (isSitting) {
    const curve1HipHemToWaist = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.001, 0.20, 0),
      new THREE.Vector3(0.195, 0.19, 0),
      new THREE.Vector3(0.205, 0.25, 0),
      new THREE.Vector3(0.168, 0.40, 0)
    );
    const curve2WaistToChest = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.168, 0.40, 0),
      new THREE.Vector3(0.165, 0.49, 0),
      new THREE.Vector3(0.195, 0.59, 0),
      new THREE.Vector3(0.212, 0.67, 0)
    );
    const curve3ChestToCollar = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.212, 0.67, 0),
      new THREE.Vector3(0.228, 0.76, 0),
      new THREE.Vector3(0.155, 0.815, 0),
      new THREE.Vector3(0.074, 0.82, 0)
    );

    [
      ...curve1HipHemToWaist.getPoints(9),
      ...curve2WaistToChest.getPoints(9).slice(1),
      ...curve3ChestToCollar.getPoints(10).slice(1),
    ].forEach((p) => profilePoints.push(new THREE.Vector2(p.x, p.y)));
    profilePoints.push(new THREE.Vector2(0.058, 0.79));
  } else {
    const curve1HipHemToWaist = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.001, 0.62, 0),
      new THREE.Vector3(0.202, 0.61, 0),
      new THREE.Vector3(0.198, 0.71, 0),
      new THREE.Vector3(0.165, 0.82, 0)
    );
    const curve2WaistToChest = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.165, 0.82, 0),
      new THREE.Vector3(0.165, 0.91, 0),
      new THREE.Vector3(0.195, 1.00, 0),
      new THREE.Vector3(0.212, 1.08, 0)
    );
    const curve3ChestToCollar = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.212, 1.08, 0),
      new THREE.Vector3(0.228, 1.175, 0),
      new THREE.Vector3(0.155, 1.235, 0),
      new THREE.Vector3(0.074, 1.24, 0)
    );

    [
      ...curve1HipHemToWaist.getPoints(9),
      ...curve2WaistToChest.getPoints(9).slice(1),
      ...curve3ChestToCollar.getPoints(10).slice(1),
    ].forEach((p) => profilePoints.push(new THREE.Vector2(p.x, p.y)));
    profilePoints.push(new THREE.Vector2(0.058, 1.21));
  }

  const lathe = new THREE.LatheGeometry(profilePoints, 24);
  lathe.scale(shoulderScaleX, 1.0, 0.76);
  lathe.computeVertexNormals();

  const collarY = isSitting ? 0.81 : 1.23;
  const cTorus = new THREE.TorusGeometry(0.074, 0.016, 8, 18);
  cTorus.rotateX(Math.PI / 2 + 0.12);
  cTorus.scale(1.05, 0.92, 1.0);
  cTorus.translate(0, collarY, 0.008);
  cTorus.computeVertexNormals();

  const lapelCurve = isSitting
    ? new THREE.CubicBezierCurve3(
        new THREE.Vector3(-0.055, 0.805, 0.062),
        new THREE.Vector3(0.02, 0.71, 0.148),
        new THREE.Vector3(0.11, 0.56, 0.162),
        new THREE.Vector3(0.15, 0.32, 0.14)
      )
    : new THREE.CubicBezierCurve3(
        new THREE.Vector3(-0.055, 1.225, 0.062),
        new THREE.Vector3(0.02, 1.13, 0.148),
        new THREE.Vector3(0.11, 0.98, 0.162),
        new THREE.Vector3(0.15, 0.73, 0.14)
      );
  const lTube = new THREE.TubeGeometry(lapelCurve, 10, 0.011, 6, false);
  lTube.computeVertexNormals();

  const buildArmSide = (side: 'left' | 'right') => {
    const s = side === 'left' ? -1 : 1;
    const sx = shoulderScaleX * 0.165 * s;

    let armPoints: THREE.Vector3[];
    let pEnd: THREE.Vector3;
    let handFingerDir: THREE.Vector3 | null = null;
    let thumbDir: THREE.Vector3;

    if (pose === 'pray') {
      pEnd = new THREE.Vector3(0.018 * s, 0.96, 0.25);
      armPoints = [
        new THREE.Vector3(sx * 0.72, 1.165, -0.01),
        new THREE.Vector3(sx * 1.16, 1.145, 0.005),
        new THREE.Vector3(sx * 1.26, 0.91, 0.045),
        new THREE.Vector3(0.056 * s, 0.87, 0.195),
        pEnd,
      ];
      handFingerDir = new THREE.Vector3(-0.05 * s, 0.95, 0.30).normalize();
      thumbDir = new THREE.Vector3(0, 0.30, -0.95).normalize();
    } else if (pose === 'incense') {
      pEnd = new THREE.Vector3(0.019 * s, 1.04, 0.27);
      armPoints = [
        new THREE.Vector3(sx * 0.72, 1.165, -0.01),
        new THREE.Vector3(sx * 1.16, 1.145, 0.01),
        new THREE.Vector3(sx * 1.25, 0.95, 0.065),
        new THREE.Vector3(0.056 * s, 0.95, 0.215),
        pEnd,
      ];
      handFingerDir = new THREE.Vector3(-0.05 * s, 0.95, 0.30).normalize();
      thumbDir = new THREE.Vector3(0, 0.30, -0.95).normalize();
    } else if (pose === 'bow' || (pose === 'meditate' && sittingHandPose === 'pray')) {
      pEnd = new THREE.Vector3(0.018 * s, 0.56, 0.25);
      armPoints = [
        new THREE.Vector3(sx * 0.72, 0.745, -0.01),
        new THREE.Vector3(sx * 1.16, 0.725, 0.005),
        new THREE.Vector3(sx * 1.26, 0.49, 0.045),
        new THREE.Vector3(0.056 * s, 0.46, 0.195),
        pEnd,
      ];
      handFingerDir = new THREE.Vector3(-0.05 * s, 0.95, 0.30).normalize();
      thumbDir = new THREE.Vector3(0, 0.30, -0.95).normalize();
    } else {
      pEnd = new THREE.Vector3(0.24 * s, 0.21, 0.16);
      armPoints = [
        new THREE.Vector3(sx * 0.72, 0.745, -0.01),
        new THREE.Vector3(sx * 1.16, 0.725, 0.005),
        new THREE.Vector3(sx * 1.36, 0.52, 0.03),
        new THREE.Vector3(sx * 1.32, 0.33, 0.10),
        pEnd,
      ];
      thumbDir = new THREE.Vector3(-s, 0.25, 0.1).normalize();
    }

    const armCurve = new THREE.CatmullRomCurve3(armPoints);
    const tubularSegments = 16;
    const radialSegments = 10;
    const baseRadius = 0.066;

    const tubeGeo = new THREE.TubeGeometry(armCurve, tubularSegments, baseRadius, radialSegments, false);

    const posAttr = tubeGeo.attributes.position as THREE.BufferAttribute;
    const vertex = new THREE.Vector3();
    for (let i = 0; i <= tubularSegments; i++) {
      const u = i / tubularSegments;
      const center = armCurve.getPointAt(u);
      const radiusScale =
        u < 0.25
          ? 0.98 + Math.sin((u / 0.25) * (Math.PI * 0.5)) * 0.14
          : u < 0.7
          ? 1.12 - ((u - 0.25) / 0.45) * 0.08
          : 1.04 - ((u - 0.7) / 0.3) * 0.28;

      for (let j = 0; j <= radialSegments; j++) {
        const idx = i * (radialSegments + 1) + j;
        vertex.fromBufferAttribute(posAttr, idx);
        vertex.sub(center).multiplyScalar(radiusScale).add(center);
        posAttr.setXYZ(idx, vertex.x, vertex.y, vertex.z);
      }
    }
    tubeGeo.computeVertexNormals();

    const tangentEnd = armCurve.getTangent(1).normalize();
    const cuffTorus = new THREE.TorusGeometry(baseRadius * 0.66, 0.013, 6, 12);
    const cuffQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangentEnd);
    cuffTorus.applyQuaternion(cuffQuat);
    cuffTorus.translate(pEnd.x, pEnd.y, pEnd.z);
    cuffTorus.computeVertexNormals();

    const effectiveFingerDir = handFingerDir ?? tangentEnd;
    const yAxis = effectiveFingerDir.clone().negate().normalize();
    const xAxis = thumbDir
      .clone()
      .sub(yAxis.clone().multiplyScalar(thumbDir.dot(yAxis)))
      .normalize();
    const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
    const basisMat = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
    const handQuat = new THREE.Quaternion().setFromRotationMatrix(basisMat);

    return {
      sleeveGeo: tubeGeo,
      cuffGeo: cuffTorus,
      handPos: [pEnd.x, pEnd.y, pEnd.z] as [number, number, number],
      handQuat,
    };
  };

  const left = buildArmSide('left');
  const right = buildArmSide('right');

  const mergedRobeAndSleevesGeo = mergeBufferGeometries([
    lathe,
    lTube,
    left.sleeveGeo,
    right.sleeveGeo,
    left.cuffGeo,
    right.cuffGeo,
  ]);

  const res: UpperBodyAndArmsGeos = {
    mergedRobeAndSleevesGeo,
    collarTorusGeo: cTorus,
    leftHandPos: left.handPos,
    rightHandPos: right.handPos,
    leftHandQuat: left.handQuat,
    rightHandQuat: right.handQuat,
  };
  upperBodyGeoCache.set(key, res);
  return res;
}

interface SharedHeadGeos {
  neckGeo: THREE.BufferGeometry;
  mergedHeadSkinGeo: THREE.BufferGeometry;
  mergedEyesAndBrowsGeo: THREE.BufferGeometry;
  lipGeo: THREE.BufferGeometry;
  shortHairCrownGeo: THREE.BufferGeometry;
  mergedLongHairGeo: THREE.BufferGeometry;
  mergedHairPinGeo: THREE.BufferGeometry;
}
let cachedHeadGeos: SharedHeadGeos | null = null;

function getSharedHeadGeos(): SharedHeadGeos {
  if (cachedHeadGeos) return cachedHeadGeos;

  const nGeo = new THREE.CylinderGeometry(0.062, 0.072, 0.16, 12, 1);
  nGeo.computeVertexNormals();

  const hGeo = new THREE.SphereGeometry(0.15, 20, 16);
  hGeo.scale(0.92, 1.07, 0.96);
  hGeo.computeVertexNormals();

  const earL = new THREE.CapsuleGeometry(0.02, 0.058, 4, 8);
  earL.rotateZ(0.08);
  earL.translate(-0.138, -0.005, -0.008);
  earL.computeVertexNormals();

  const earR = new THREE.CapsuleGeometry(0.02, 0.058, 4, 8);
  earR.rotateZ(-0.08);
  earR.translate(0.138, -0.005, -0.008);
  earR.computeVertexNormals();

  const nsGeo = new THREE.CapsuleGeometry(0.011, 0.048, 4, 8);
  nsGeo.rotateX(-0.08);
  nsGeo.translate(0, 0.012, 0.142);
  nsGeo.computeVertexNormals();

  const mergedHeadSkinGeo = mergeBufferGeometries([hGeo, earL, earR, nsGeo]);

  // Mắt và chân mày gộp thành 1 geometry duy nhất
  const makeBox = (
    args: [number, number, number],
    pos: [number, number, number],
    rot: [number, number, number]
  ) => {
    const g = new THREE.BoxGeometry(...args);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
      new THREE.Vector3(1, 1, 1)
    );
    g.applyMatrix4(m);
    return g;
  };

  const eyeL = makeBox([0.028, 0.0042, 0.006], [-0.042, 0.028, 0.134], [0.08, -0.26, 0.04]);
  const eyeR = makeBox([0.028, 0.0042, 0.006], [0.042, 0.028, 0.134], [0.08, 0.26, -0.04]);
  const browL = makeBox([0.03, 0.0035, 0.006], [-0.042, 0.052, 0.1285], [0.16, -0.26, 0.06]);
  const browR = makeBox([0.03, 0.0035, 0.006], [0.042, 0.052, 0.1285], [0.16, 0.26, -0.06]);
  const mergedEyesAndBrowsGeo = mergeBufferGeometries([eyeL, eyeR, browL, browR]);

  const lipGeo = new THREE.CapsuleGeometry(0.0045, 0.026, 4, 6);
  lipGeo.translate(0, -0.045, 0.138);
  lipGeo.computeVertexNormals();

  // Mũ tóc liền khối (Unified Continuous Hair Cap - tinh giản lưới đa giác giảm tải GPU)
  const buildUnifiedHairGeo = () => {
    const widthSegments = 24;
    const heightSegments = 16;
    const geo = new THREE.SphereGeometry(
      1,
      widthSegments,
      heightSegments,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.5
    );
    const pos = geo.attributes.position as THREE.BufferAttribute;

    const headRx = 0.15 * 0.92;
    const headRy = 0.15 * 1.07;
    const headRz = 0.15 * 0.96;

    for (let i = 0; i < pos.count; i++) {
      const iy = Math.floor(i / (widthSegments + 1));
      const ix = i % (widthSegments + 1);
      const u = ix / widthSegments;
      const v = iy / heightSegments;

      const phi = u * Math.PI * 2;
      const dirX = -Math.cos(phi);
      const dirZ = Math.sin(phi);

      const s = (1 - dirZ) * 0.5;
      const backCurve = Math.pow(s, 1.85);

      const frontTheta = Math.PI * 0.305;
      const backTheta = Math.PI * 0.78;
      const thetaMax = frontTheta + (backTheta - frontTheta) * backCurve;

      const theta = v * thetaMax;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      const edgeTaper = v > 0.82 ? 1 - Math.pow((v - 0.82) / 0.18, 2) : 1.0;
      const baseInflate = 1.036 + 0.014 * backCurve;
      const inflate = 1.001 + (baseInflate - 1.001) * edgeTaper;

      pos.setXYZ(
        i,
        dirX * sinTheta * headRx * inflate,
        cosTheta * headRy * inflate,
        dirZ * sinTheta * headRz * inflate
      );
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  };

  const sCrown = buildUnifiedHairGeo();

  const lBun = new THREE.SphereGeometry(0.074, 12, 10);
  lBun.scale(1.05, 0.95, 0.95);
  lBun.translate(0, 0.025, -0.158);
  lBun.computeVertexNormals();

  const lRing = new THREE.TorusGeometry(0.062, 0.022, 8, 14);
  lRing.rotateX(Math.PI / 2);
  lRing.translate(0, 0.025, -0.158);
  lRing.computeVertexNormals();

  const mergedLongHairGeo = mergeBufferGeometries([sCrown.clone(), lBun, lRing]);

  const pinStick = new THREE.CylinderGeometry(0.0045, 0.0045, 0.18, 6);
  const pinBead = new THREE.SphereGeometry(0.014, 8, 8);
  pinBead.translate(0, 0.092, 0);
  const mergedPinLocal = mergeBufferGeometries([pinStick, pinBead]);
  mergedPinLocal.rotateZ(0.45);
  mergedPinLocal.translate(0, 0.025, -0.158);
  mergedPinLocal.computeVertexNormals();

  cachedHeadGeos = {
    neckGeo: nGeo,
    mergedHeadSkinGeo,
    mergedEyesAndBrowsGeo,
    lipGeo,
    shortHairCrownGeo: sCrown,
    mergedLongHairGeo,
    mergedHairPinGeo: mergedPinLocal,
  };
  return cachedHeadGeos;
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export const HumanoidDevotee: React.FC<HumanoidDevoteeProps> = ({
  config,
  pose = 'meditate',
  sittingHandPose = 'meditate',
  hideHair = false,
  isGoldenStatue = false,
  statueGoldColor = '#F5C542',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1.0,
  isMainUser = false,
  showNameBadge = true,
  animate = true,
  renderLocalCushion = false,
  onPlantIncense,
  onCompleteIncenseRitual,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const breathGroupRef = useRef<THREE.Group>(null);
  const leftLegGroupRef = useRef<THREE.Group>(null);
  const rightLegGroupRef = useRef<THREE.Group>(null);
  const handSmokeRef = useRef<THREE.Points>(null);

  // Quản lý tiến trình Nghi Thức Dâng Hương:
  // 'holding_incense': Đứng dậy -> Đi bộ tới trước bàn lễ -> Lạy 3 lạy -> Cắm hương vào lư
  // 'returning': Đã cắm hương vào lư (tay chuyển sang chắp búp sen) -> Đi bộ quay về bồ đoàn
  const [ritualPhase, setRitualPhase] = useState<'holding_incense' | 'returning'>('holding_incense');
  const ritualStartRef = useRef<number | null>(null);
  const plantedTriggeredRef = useRef<boolean>(false);
  const completedTriggeredRef = useRef<boolean>(false);

  const isWalkingIncenseRitual = pose === 'incense' && isMainUser && !renderLocalCushion;

  useEffect(() => {
    if (pose === 'incense') {
      setRitualPhase('holding_incense');
      ritualStartRef.current = null;
      plantedTriggeredRef.current = false;
      completedTriggeredRef.current = false;
    } else {
      ritualStartRef.current = null;
      if (rootGroupRef.current) {
        rootGroupRef.current.position.set(position[0], position[1], position[2]);
        rootGroupRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
      }
      if (leftLegGroupRef.current) leftLegGroupRef.current.rotation.x = 0;
      if (rightLegGroupRef.current) rightLegGroupRef.current.rotation.x = 0;
    }
  }, [pose, position, rotation]);

  const effectivePose: DevoteePose =
    isWalkingIncenseRitual && ritualPhase === 'returning' ? 'pray' : pose;
  const showHandheldIncense =
    pose === 'incense' && (!isWalkingIncenseRitual || ritualPhase === 'holding_incense');

  const isSitting = effectivePose === 'meditate' || effectivePose === 'bow';
  const shoulderScaleX = config.gender === 'male' ? 1.22 : 1.14;
  const castDynamicShadow = isMainUser || isGoldenStatue || renderLocalCushion;

  // ============================================================================
  // SHARED LIGHTWEIGHT MATERIALS (MeshLambertMaterial cho Phật tử & MeshPhongMaterial cho Tượng Phật giảm 70% tải GPU)
  // ============================================================================
  const skinMaterial = getCachedMaterial(`skin_${isGoldenStatue}_${statueGoldColor}`, () =>
    isGoldenStatue
      ? new THREE.MeshPhongMaterial({
          color: statueGoldColor,
          specular: '#FFF3B0',
          shininess: 85,
          emissive: '#B87D14',
          emissiveIntensity: 0.22,
        })
      : new THREE.MeshLambertMaterial({ color: '#F1C7A5' })
  );

  const hairMaterial = getCachedMaterial('hair_default', () =>
    new THREE.MeshLambertMaterial({ color: '#1B1715' })
  );

  const robeColorKey = config.robeColor || '#E5AD28';
  const robeMaterial = getCachedMaterial(`robe_${isGoldenStatue}_${robeColorKey}`, () =>
    isGoldenStatue
      ? new THREE.MeshPhongMaterial({
          color: robeColorKey,
          specular: '#FFE89E',
          shininess: 75,
          emissive: '#9E6810',
          emissiveIntensity: 0.2,
          side: THREE.DoubleSide,
        })
      : new THREE.MeshLambertMaterial({
          color: robeColorKey,
          side: THREE.DoubleSide,
        })
  );

  const pantsMaterial = getCachedMaterial(`pants_${isGoldenStatue}_${robeColorKey}`, () => {
    const c = new THREE.Color(robeColorKey).multiplyScalar(isGoldenStatue ? 0.96 : 0.92);
    return isGoldenStatue
      ? new THREE.MeshPhongMaterial({
          color: c,
          specular: '#FFE89E',
          shininess: 70,
          emissive: '#9E6810',
          emissiveIntensity: 0.2,
          side: THREE.DoubleSide,
        })
      : new THREE.MeshLambertMaterial({
          color: c,
          side: THREE.DoubleSide,
        });
  });

  const collarMaterial = getCachedMaterial(`collar_${isGoldenStatue}_${statueGoldColor}`, () =>
    isGoldenStatue
      ? new THREE.MeshPhongMaterial({
          color: statueGoldColor,
          specular: '#FFF3B0',
          shininess: 85,
          emissive: '#B87D14',
          emissiveIntensity: 0.22,
        })
      : new THREE.MeshLambertMaterial({ color: '#E2E8F0' })
  );

  const sockMaterial = getCachedMaterial(`sock_${isGoldenStatue}_${statueGoldColor}`, () =>
    isGoldenStatue
      ? new THREE.MeshPhongMaterial({
          color: statueGoldColor,
          specular: '#FFF3B0',
          shininess: 85,
          emissive: '#B87D14',
          emissiveIntensity: 0.22,
        })
      : new THREE.MeshLambertMaterial({ color: '#FFFFFF' })
  );

  const sockSoleMaterial = getCachedMaterial(`sockSole_${isGoldenStatue}_${statueGoldColor}`, () =>
    isGoldenStatue
      ? new THREE.MeshPhongMaterial({
          color: new THREE.Color(statueGoldColor).multiplyScalar(0.92),
          specular: '#FFE89E',
          shininess: 75,
          emissive: '#9E6810',
          emissiveIntensity: 0.18,
        })
      : new THREE.MeshLambertMaterial({ color: '#E2DDD5' })
  );

  const facialFeatureMaterial = getCachedMaterial(`face_${isGoldenStatue}`, () =>
    isGoldenStatue
      ? new THREE.MeshPhongMaterial({
          color: '#8C5C12',
          specular: '#FFD54F',
          shininess: 65,
        })
      : new THREE.MeshBasicMaterial({ color: '#1E130B' })
  );

  const lipMaterial = getCachedMaterial(`lip_${isGoldenStatue}`, () =>
    isGoldenStatue
      ? new THREE.MeshPhongMaterial({
          color: '#9E6814',
          specular: '#FFD54F',
          shininess: 70,
        })
      : new THREE.MeshLambertMaterial({ color: '#C46E5D' })
  );

  const goldMaterial = getCachedMaterial('gold_pin', () =>
    new THREE.MeshPhongMaterial({ color: '#D4AF37', specular: '#FFF59D', shininess: 85 })
  );

  // ============================================================================
  // SHARED GEOMETRIES (Lấy tức thì từ bộ nhớ đệm Module-Level)
  // ============================================================================
  const {
    mergedPantsGeo,
    pelvisStandGeo,
    leftStandLegPivotGeo,
    rightStandLegPivotGeo,
  } = getSharedLowerBodyGeos(isSitting);
  const {
    mergedRobeAndSleevesGeo,
    collarTorusGeo,
    leftHandPos,
    rightHandPos,
    leftHandQuat,
    rightHandQuat,
  } = getSharedUpperBodyGeos(effectivePose, sittingHandPose, shoulderScaleX);
  const {
    neckGeo,
    mergedHeadSkinGeo,
    mergedEyesAndBrowsGeo,
    lipGeo,
    shortHairCrownGeo,
    mergedLongHairGeo,
    mergedHairPinGeo,
  } = getSharedHeadGeos();

  useFrame((state) => {
    if (!animate || !breathGroupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (isWalkingIncenseRitual && rootGroupRef.current) {
      if (ritualStartRef.current === null) {
        ritualStartRef.current = t;
      }
      const tau = t - ritualStartRef.current;

      const startX = position[0];
      const startY = position[1];
      const startZ = position[2];
      // Vị trí đứng hành lễ ngay trên vòng hoa sen vàng trước Bàn Đảnh Lễ (Z = 2.05m)
      const altarX = 0;
      const altarZ = 2.05;
      // Vị trí tiến sát mép Bàn Đảnh Lễ để cắm hương vào Lư Hương (Z = 1.50m)
      const plantZ = 1.50;

      const walkToAltarYaw = Math.atan2(altarX - startX, altarZ - startZ);
      const walkBackYaw = Math.atan2(startX - altarX, startZ - altarZ);
      const faceBuddhaYaw = Math.PI;

      let curX = startX;
      let curY = startY;
      let curZ = startZ;
      let curYaw = faceBuddhaYaw;
      let legSwing = 0;
      let upperBow = 0.03;

      if (tau < 0.6) {
        // Giai đoạn 1 (0.0s -> 0.6s): Đứng dậy tại bồ đoàn và xoay người hướng về phía Bàn Lễ Phật
        const p = THREE.MathUtils.smoothstep(tau, 0.0, 0.6);
        curYaw = lerpAngle(faceBuddhaYaw, walkToAltarYaw, p);
      } else if (tau < 3.0) {
        // Giai đoạn 2 (0.6s -> 3.0s): Đi bộ từ bồ đoàn đến trước Bàn Lễ Phật
        const u = THREE.MathUtils.smoothstep(tau, 0.6, 2.85);
        curX = THREE.MathUtils.lerp(startX, altarX, u);
        curZ = THREE.MathUtils.lerp(startZ, altarZ, u);

        const walkEnv = Math.sin(u * Math.PI);
        const stepPhase = (tau - 0.6) * 9.5;
        legSwing = Math.sin(stepPhase) * 0.44 * walkEnv;
        curY = startY + Math.abs(Math.sin(stepPhase)) * 0.022 * walkEnv;

        if (tau < 2.55) {
          curYaw = walkToAltarYaw;
        } else {
          const turnP = THREE.MathUtils.smoothstep(tau, 2.55, 3.0);
          curYaw = lerpAngle(walkToAltarYaw, faceBuddhaYaw, turnP);
        }
      } else if (tau < 7.2) {
        // Giai đoạn 3 (3.0s -> 7.2s): Đứng trang nghiêm trước Bàn Lễ Phật và thành kính lạy 3 lạy
        curX = altarX;
        curZ = altarZ;
        curYaw = faceBuddhaYaw;
        const bowProgress = ((tau - 3.0) / 4.2) * 3.0; // 3 lạy (mỗi lạy 1.4s)
        const singleBow = Math.sin((bowProgress % 1) * Math.PI);
        upperBow = 0.03 + 0.58 * Math.pow(Math.max(0, singleBow), 1.15);
      } else if (tau < 8.5) {
        // Giai đoạn 4 (7.2s -> 8.5s): Tiến lên sát Bàn Lễ Phật và cắm 3 nén hương vào Lư Hương
        curX = altarX;
        curYaw = faceBuddhaYaw;

        if (tau < 7.9) {
          const f = THREE.MathUtils.smoothstep(tau, 7.2, 7.85);
          curZ = THREE.MathUtils.lerp(altarZ, plantZ, f);
          legSwing = Math.sin(f * Math.PI) * 0.25;
          upperBow = 0.03 + 0.48 * Math.sin(f * Math.PI * 0.5);
        } else {
          if (!plantedTriggeredRef.current) {
            plantedTriggeredRef.current = true;
            setRitualPhase('returning');
            onPlantIncense?.();
          }
          const b = THREE.MathUtils.smoothstep(tau, 7.9, 8.5);
          curZ = THREE.MathUtils.lerp(plantZ, altarZ, b);
          legSwing = -Math.sin(b * Math.PI) * 0.22;
          upperBow = THREE.MathUtils.lerp(0.51, 0.04, b);
        }
      } else if (tau < 10.9) {
        // Giai đoạn 5 (8.5s -> 10.9s): Xoay người và đi bộ quay về bồ đoàn của mình
        const u = THREE.MathUtils.smoothstep(tau, 8.7, 10.9);
        curX = THREE.MathUtils.lerp(altarX, startX, u);
        curZ = THREE.MathUtils.lerp(altarZ, startZ, u);

        const walkEnv = Math.sin(u * Math.PI);
        const stepPhase = (tau - 8.7) * 9.5;
        legSwing = Math.sin(stepPhase) * 0.44 * walkEnv;
        curY = startY + Math.abs(Math.sin(stepPhase)) * 0.022 * walkEnv;

        const turnP = THREE.MathUtils.smoothstep(tau, 8.5, 8.85);
        curYaw = lerpAngle(faceBuddhaYaw, walkBackYaw, turnP);
      } else {
        // Giai đoạn 6 (10.9s -> 11.4s): Về tới bồ đoàn, xoay mặt hướng về Phật và ngồi xuống tọa thiền
        curX = startX;
        curZ = startZ;
        const turnBackP = THREE.MathUtils.smoothstep(tau, 10.9, 11.35);
        curYaw = lerpAngle(walkBackYaw, faceBuddhaYaw, turnBackP);

        if (tau >= 11.4 && !completedTriggeredRef.current) {
          completedTriggeredRef.current = true;
          onCompleteIncenseRitual?.();
        }
      }

      rootGroupRef.current.position.set(curX, curY, curZ);
      rootGroupRef.current.rotation.set(0, curYaw, 0);
      breathGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        breathGroupRef.current.rotation.x,
        upperBow,
        0.22
      );
      if (leftLegGroupRef.current) leftLegGroupRef.current.rotation.x = legSwing;
      if (rightLegGroupRef.current) rightLegGroupRef.current.rotation.x = -legSwing;
      return;
    }

    if (pose === 'bow') {
      const cycle = (Math.sin(t * 1.8) + 1) / 2;
      breathGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        breathGroupRef.current.rotation.x,
        0.55 * cycle,
        0.1
      );
    } else {
      const breath = Math.sin(t * 1.8) * 0.012;
      breathGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        breathGroupRef.current.rotation.x,
        0.02 + breath,
        0.1
      );
    }

    if (handSmokeRef.current && showHandheldIncense) {
      const geo = handSmokeRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < 20; i++) {
        const idx = i * 3;
        arr[idx + 1] += 0.008;
        arr[idx] += Math.sin(t * 3.0 + i) * 0.0015;
        if (arr[idx + 1] > 0.85) {
          arr[idx + 1] = 0.42;
          arr[idx] = (Math.random() - 0.5) * 0.03;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  const formattedName = useMemo(() => {
    let s = (config.name || 'Diệu Tâm').trim();
    s = s.replace(/^(phật tử|phật\s*tử)\s*/i, '').trim();
    s = s
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '')
      .trim();
    if (s.length > 15) {
      s = s.slice(0, 15).trim();
    }
    return s || 'Diệu Tâm';
  }, [config.name]);

  const neckY = isSitting ? 0.835 : 1.255;
  const headY = isSitting ? 0.995 : 1.415;

  return (
    <group ref={rootGroupRef} position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* 1. THẺ TÊN HÌNH CHỮ NHẬT BO GÓC (Loại bỏ backdrop-blur & transition để tránh lag GPU/DOM) */}
      {showNameBadge && (
        <Html position={[0, isSitting ? 1.38 : 1.80, 0]} center distanceFactor={11} zIndexRange={[100, 0]}>
          <div className="flex flex-col items-center pointer-events-none select-none">
            <div
              className={`px-3 py-1 rounded-md text-[11px] font-semibold tracking-wide shadow-md border text-center whitespace-nowrap min-w-[48px] ${
                isMainUser
                  ? 'bg-amber-950 text-amber-200 border-amber-400/80 ring-1 ring-amber-400/50'
                  : 'bg-stone-900/95 text-stone-200 border-stone-600/50'
              }`}
            >
              <span>{formattedName}</span>
            </div>
            <div
              className={`w-1.5 h-1.5 rotate-45 -mt-0.5 border-r border-b ${
                isMainUser ? 'bg-amber-950 border-amber-400/80' : 'bg-stone-900 border-stone-600/50'
              }`}
            />
          </div>
        </Html>
      )}

      {/* 2. ĐỆM BỒ ĐOÀN TRÒN (Chỉ hiển thị khi ngồi thiền ở màn hình Preview) */}
      {renderLocalCushion && isSitting && (
        <mesh position={[0, 0.04, 0]} receiveShadow>
          <cylinderGeometry args={[0.44, 0.48, 0.08, 36]} />
          <meshStandardMaterial color="#743E1F" roughness={0.8} />
        </mesh>
      )}

      {/* 3. PHẦN HÔNG, ĐÔI CHÂN QUẦN DÀI LỊCH SỰ LIỀN MẠCH & ĐÔI BÀN CHÂN TẤT TRẮNG RÕ NÉT */}
      {isSitting ? (
        <group>
          <mesh
            geometry={mergedPantsGeo}
            material={pantsMaterial}
            castShadow={castDynamicShadow}
            receiveShadow={castDynamicShadow}
          />
          <group position={[-0.02, 0.105, 0.245]} rotation={[0.15, 1.15, 1.35]}>
            <WhiteSockFoot side="left" material={sockMaterial} soleMaterial={sockSoleMaterial} />
          </group>
          <group position={[0.02, 0.128, 0.27]} rotation={[0.15, -1.15, -1.35]}>
            <WhiteSockFoot side="right" material={sockMaterial} soleMaterial={sockSoleMaterial} />
          </group>
        </group>
      ) : (
        <group>
          {/* Khối hông cố định */}
          <mesh
            geometry={pelvisStandGeo}
            material={pantsMaterial}
            castShadow={castDynamicShadow}
            receiveShadow={castDynamicShadow}
          />
          {/* Chân trái + bàn chân tất trắng xoay quanh khớp hông khi bước đi */}
          <group ref={leftLegGroupRef} position={[-0.105, 0.62, 0]}>
            <mesh
              geometry={leftStandLegPivotGeo}
              material={pantsMaterial}
              castShadow={castDynamicShadow}
              receiveShadow={castDynamicShadow}
            />
            <group position={[0, -0.595, 0.008]}>
              <WhiteSockFoot side="left" material={sockMaterial} soleMaterial={sockSoleMaterial} />
            </group>
          </group>
          {/* Chân phải + bàn chân tất trắng xoay quanh khớp hông khi bước đi */}
          <group ref={rightLegGroupRef} position={[0.105, 0.62, 0]}>
            <mesh
              geometry={rightStandLegPivotGeo}
              material={pantsMaterial}
              castShadow={castDynamicShadow}
              receiveShadow={castDynamicShadow}
            />
            <group position={[0, -0.595, 0.008]}>
              <WhiteSockFoot side="right" material={sockMaterial} soleMaterial={sockSoleMaterial} />
            </group>
          </group>
        </group>
      )}

      {/* 4. THÂN ÁO TRÊN LIỀN KHỐI, ỐNG TAY UỐN LƯỢN VÀ ĐẦU OVAL */}
      <group ref={breathGroupRef}>
        {/* 4.1 & 4.2. Thân áo trên + nẹp áo + hai ống tay áo gộp thành 1 mesh duy nhất */}
        <mesh
          geometry={mergedRobeAndSleevesGeo}
          material={robeMaterial}
          castShadow={castDynamicShadow}
          receiveShadow={castDynamicShadow}
        />

        {/* Cổ áo lót */}
        <mesh geometry={collarTorusGeo} material={collarMaterial} castShadow={castDynamicShadow} />

        {/* 4.3. Hai bàn tay búp sen nối thẳng theo tiếp tuyến cuối ống tay áo */}
        <group position={leftHandPos} quaternion={leftHandQuat}>
          <ContinuousLotusHand
            side="left"
            pose={effectivePose === 'meditate' && sittingHandPose === 'pray' ? 'pray' : effectivePose}
            material={skinMaterial}
          />
        </group>
        <group position={rightHandPos} quaternion={rightHandQuat}>
          <ContinuousLotusHand
            side="right"
            pose={effectivePose === 'meditate' && sittingHandPose === 'pray' ? 'pray' : effectivePose}
            material={skinMaterial}
          />
        </group>

        {/* 4.4. Cổ ngắn gắn chìm vào bên trong cổ áo */}
        <mesh geometry={neckGeo} position={[0, neckY, 0]} material={skinMaterial} castShadow={castDynamicShadow} />

        {/* 4.5. Đầu Oval liền mạch + Tai + Mũi + Ngũ quan đã gộp tối ưu */}
        <group position={[0, headY, 0]} rotation={[0.05, 0, 0]}>
          <mesh
            geometry={mergedHeadSkinGeo}
            material={skinMaterial}
            castShadow={castDynamicShadow}
            receiveShadow={castDynamicShadow}
          />
          <mesh geometry={mergedEyesAndBrowsGeo} material={facialFeatureMaterial} />
          <mesh geometry={lipGeo} material={lipMaterial} />

          {/* 4.6. Mái tóc liền khối kín kẽ (Xuất gia / Không tóc / Gọn gàng / Búi sen) */}
          {hideHair || config.hairStyle === 'bald' ? null : config.hairStyle === 'short' ? (
            <mesh geometry={shortHairCrownGeo} material={hairMaterial} castShadow={castDynamicShadow} />
          ) : (
            <group>
              <mesh geometry={mergedLongHairGeo} material={hairMaterial} castShadow={castDynamicShadow} />
              <mesh geometry={mergedHairPinGeo} material={goldMaterial} />
            </group>
          )}
        </group>

        {/* 5. HIỆU ỨNG DÂNG HƯƠNG KHI ĐANG CẦM 3 NÉN NHANG TRƯỚC KHI CẮM VÀO LƯ */}
        {showHandheldIncense && (
          <group position={[0, 1.08, 0.285]}>
            {[-0.014, 0, 0.014].map((x, idx) => (
              <group key={`incense-${idx}`} position={[x, 0, 0]} rotation={[0.08, 0, (idx - 1) * 0.05]}>
                <mesh position={[0, 0.08, 0]}>
                  <cylinderGeometry args={[0.004, 0.004, 0.22, 8]} />
                  <meshStandardMaterial color="#B71C1C" />
                </mesh>
                <mesh position={[0, 0.24, 0]}>
                  <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
                  <meshStandardMaterial color="#4E342E" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.35, 0]}>
                  <sphereGeometry args={[0.011, 10, 10]} />
                  <meshStandardMaterial color="#FF5722" emissive="#FF3D00" emissiveIntensity={3.2} />
                </mesh>
                <pointLight position={[0, 0.36, 0]} color="#FF6D00" intensity={0.6} distance={1.2} />
              </group>
            ))}
          </group>
        )}
      </group>
    </group>
  );
};
