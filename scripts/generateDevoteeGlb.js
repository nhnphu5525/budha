import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

class FileReader {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    if (this.onloadend) this.onloadend();
  }
}
global.FileReader = FileReader;

console.log('Generating continuous-geometry devotee.glb with visible legs and detailed white-socked feet...');

const root = new THREE.Group();
root.name = 'Devotee_Continuous_Character';

const robeMat = new THREE.MeshStandardMaterial({
  name: 'Robe_Material',
  color: 0x4b6b88,
  roughness: 0.72,
  metalness: 0.06,
  side: THREE.DoubleSide,
});

const pantsMat = new THREE.MeshStandardMaterial({
  name: 'Pants_Material',
  color: 0x43607a,
  roughness: 0.76,
  metalness: 0.04,
  side: THREE.DoubleSide,
});

const skinMat = new THREE.MeshStandardMaterial({
  name: 'Skin_Material',
  color: 0xf1c7a5,
  roughness: 0.52,
  metalness: 0.04,
});

const hairMat = new THREE.MeshStandardMaterial({
  name: 'Hair_Material',
  color: 0x1b1715,
  roughness: 0.82,
});

const sockMat = new THREE.MeshStandardMaterial({
  name: 'Sock_Material',
  color: 0xffffff,
  roughness: 0.75,
});

// 1. Upper Tunic (Áo Lam Cư Sĩ cân đối: thân dưới 0.00 -> 0.62 = 0.62m, thân trên 0.62 -> 1.24 = 0.62m)
const profilePoints = [];
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
  ...curve1HipHemToWaist.getPoints(18),
  ...curve2WaistToChest.getPoints(18).slice(1),
  ...curve3ChestToCollar.getPoints(20).slice(1),
].forEach((p) => profilePoints.push(new THREE.Vector2(p.x, p.y)));
profilePoints.push(new THREE.Vector2(0.058, 1.21));

const robeLatheGeo = new THREE.LatheGeometry(profilePoints, 56);
robeLatheGeo.scale(1.18, 1.0, 0.76);
robeLatheGeo.computeVertexNormals();
root.add(new THREE.Mesh(robeLatheGeo, robeMat));

// 2. Pelvis & Visible Continuous Legs (TubeGeometry) + White Sock Feet
const pelvisGeo = new THREE.SphereGeometry(0.155, 32, 24);
pelvisGeo.scale(1.22, 0.78, 0.92);
pelvisGeo.translate(0, 0.62, -0.01);
pelvisGeo.computeVertexNormals();
root.add(new THREE.Mesh(pelvisGeo, pantsMat));

[-1, 1].forEach((s) => {
  const legX = 0.105 * s;
  const legCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(legX * 0.95, 0.64, -0.01),
    new THREE.Vector3(legX * 1.04, 0.47, 0.012),
    new THREE.Vector3(legX * 1.0, 0.28, -0.008),
    new THREE.Vector3(legX * 1.0, 0.095, -0.015)
  );
  const legGeo = new THREE.TubeGeometry(legCurve, 36, 0.074, 24, false);
  legGeo.computeVertexNormals();
  root.add(new THREE.Mesh(legGeo, pantsMat));

  // White Sock Foot
  const footCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(legX, 0.087, -0.014),
    new THREE.Vector3(legX, 0.04, -0.022),
    new THREE.Vector3(legX, 0.027, 0.043),
    new THREE.Vector3(legX, 0.017, 0.10)
  );
  const footGeo = new THREE.TubeGeometry(footCurve, 24, 0.038, 20, false);
  footGeo.computeVertexNormals();
  root.add(new THREE.Mesh(footGeo, sockMat));

  // Sleeves with raised shoulder cap
  const sx = 1.18 * 0.165 * s;
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sx * 0.72, 1.165, -0.01),
    new THREE.Vector3(sx * 1.16, 1.145, 0.005),
    new THREE.Vector3(sx * 1.26, 0.91, 0.045),
    new THREE.Vector3(0.056 * s, 0.87, 0.195),
    new THREE.Vector3(0.018 * s, 0.96, 0.25),
  ]);
  const sleeveGeo = new THREE.TubeGeometry(armCurve, 40, 0.066, 24, false);
  sleeveGeo.computeVertexNormals();
  root.add(new THREE.Mesh(sleeveGeo, robeMat));
});

// 3. Neck & Oval Head
const neckGeo = new THREE.CylinderGeometry(0.062, 0.072, 0.16, 32, 4);
neckGeo.computeVertexNormals();
const neckMesh = new THREE.Mesh(neckGeo, skinMat);
neckMesh.position.set(0, 1.255, 0);
root.add(neckMesh);

const headGeo = new THREE.SphereGeometry(0.15, 36, 32);
headGeo.scale(0.92, 1.07, 0.96);
headGeo.computeVertexNormals();
const headMesh = new THREE.Mesh(headGeo, skinMat);
headMesh.position.set(0, 1.415, 0);
root.add(headMesh);

const widthSegments = 64;
const heightSegments = 48;
const hairCrownGeo = new THREE.SphereGeometry(1, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI * 0.5);
const pos = hairCrownGeo.attributes.position;
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
  const thetaMax = Math.PI * 0.305 + (Math.PI * 0.78 - Math.PI * 0.305) * backCurve;
  const theta = v * thetaMax;
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);
  const edgeTaper = v > 0.82 ? 1 - Math.pow((v - 0.82) / 0.18, 2) : 1.0;
  const baseInflate = 1.036 + 0.014 * backCurve;
  const inflate = 1.001 + (baseInflate - 1.001) * edgeTaper;
  pos.setXYZ(i, dirX * sinTheta * headRx * inflate, cosTheta * headRy * inflate, dirZ * sinTheta * headRz * inflate);
}
pos.needsUpdate = true;
hairCrownGeo.computeVertexNormals();
const hairMesh = new THREE.Mesh(hairCrownGeo, hairMat);
hairMesh.position.set(0, 1.415, 0);
root.add(hairMesh);

const exporter = new GLTFExporter();
exporter.parse(
  root,
  (glb) => {
    const outPath = path.resolve('public/models/devotee.glb');
    fs.writeFileSync(outPath, Buffer.from(glb));
    const stats = fs.statSync(outPath);
    console.log(`✅ Successfully generated ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  },
  (err) => {
    console.error('❌ Error exporting GLB:', err);
  },
  { binary: true }
);
