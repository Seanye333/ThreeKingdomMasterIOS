import * as THREE from 'three';

/**
 * Officer-specific visual layers for the shared Mixamo duel skeleton.
 *
 * The animation clips remain shared, but a notable officer can replace the
 * neutral X Bot surface with lightweight armour, clothing and facial geometry.
 * The pieces are parented to Mixamo bones, so they inherit every existing duel
 * animation without adding another rig or a large per-officer model download.
 */

const BONE = {
  hips: 'mixamorigHips',
  spine1: 'mixamorigSpine1',
  spine2: 'mixamorigSpine2',
  head: 'mixamorigHead',
  rightArm: 'mixamorigRightArm',
  leftArm: 'mixamorigLeftArm',
  rightForeArm: 'mixamorigRightForeArm',
  leftForeArm: 'mixamorigLeftForeArm',
  rightHand: 'mixamorigRightHand',
  leftHand: 'mixamorigLeftHand',
  rightUpLeg: 'mixamorigRightUpLeg',
  leftUpLeg: 'mixamorigLeftUpLeg',
  rightLeg: 'mixamorigRightLeg',
  leftLeg: 'mixamorigLeftLeg',
  rightFoot: 'mixamorigRightFoot',
  leftFoot: 'mixamorigLeftFoot',
} as const;

type Vec3 = [number, number, number];

function attach(
  root: THREE.Object3D,
  boneName: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: Vec3 = [0, 0, 0],
  rotation: Vec3 = [0, 0, 0],
  scale: Vec3 = [1, 1, 1],
): THREE.Mesh | null {
  const bone = root.getObjectByName(boneName);
  if (!bone) return null;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  bone.add(mesh);
  return mesh;
}

function mat(
  color: THREE.ColorRepresentation,
  roughness: number,
  metalness = 0,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function hideNeutralBody(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && (mesh.name === 'Beta_Surface' || mesh.name === 'Beta_Joints')) {
      mesh.visible = false;
    }
  });
}

function addLimb(
  root: THREE.Object3D,
  boneName: string,
  length: number,
  radius: number,
  material: THREE.Material,
): void {
  attach(
    root,
    boneName,
    new THREE.CapsuleGeometry(radius, Math.max(radius, length - radius * 2), 5, 10),
    material,
    [0, length * 0.5, 0],
  );
}

/**
 * 關羽 — red-faced veteran, long beard, green robes and dark Han lamellar.
 * Mixamo faces +Z in native space; the arena later rotates the complete model
 * toward its opponent.
 */
function applyGuanYu(root: THREE.Object3D, height: number): void {
  hideNeutralBody(root);

  const H = height;
  const skin = mat('#a85f45', 0.68);
  const skinShade = mat('#7d3f32', 0.72);
  const eyeWhite = mat('#e8dfd2', 0.55);
  const pupil = mat('#17110d', 0.45);
  const hair = mat('#16120f', 0.88);
  const green = mat('#174f39', 0.82);
  const greenDeep = mat('#0d3025', 0.88);
  const bronze = mat('#8d6829', 0.38, 0.72);
  const bronzeBright = mat('#c39a46', 0.32, 0.78);
  const iron = mat('#2c3331', 0.42, 0.62);
  const leather = mat('#3a2418', 0.9);

  // Human head and recognisable face.
  attach(root, BONE.head, new THREE.SphereGeometry(H * 0.048, 24, 18), skin,
    [0, H * 0.054, H * 0.012], [0, 0, 0], [0.83, 1.08, 0.9]);
  for (const side of [-1, 1]) {
    attach(root, BONE.head, new THREE.SphereGeometry(H * 0.012, 12, 10), skinShade,
      [side * H * 0.041, H * 0.055, H * 0.011], [0, 0, 0], [0.55, 1, 0.48]);
    attach(root, BONE.head, new THREE.SphereGeometry(H * 0.008, 12, 8), eyeWhite,
      [side * H * 0.019, H * 0.068, H * 0.052], [0, 0, 0], [1.3, 0.62, 0.48]);
    attach(root, BONE.head, new THREE.SphereGeometry(H * 0.0034, 10, 8), pupil,
      [side * H * 0.019, H * 0.068, H * 0.057], [0, 0, 0], [1, 1, 0.7]);
    attach(root, BONE.head, new THREE.BoxGeometry(H * 0.027, H * 0.004, H * 0.006), hair,
      [side * H * 0.018, H * 0.082, H * 0.055], [0, 0, side * -0.18]);
  }
  attach(root, BONE.head, new THREE.ConeGeometry(H * 0.009, H * 0.029, 10), skinShade,
    [0, H * 0.055, H * 0.061], [Math.PI / 2, 0, 0]);

  // Moustache and the famous chest-length five-strand beard.
  for (const side of [-1, 1]) {
    attach(root, BONE.head, new THREE.CapsuleGeometry(H * 0.006, H * 0.028, 4, 8), hair,
      [side * H * 0.013, H * 0.035, H * 0.057], [0, 0, side * 0.72]);
  }
  const beardStrands = [
    { x: 0, y: -0.018, h: 0.22, r: 0.025 },
    { x: -0.022, y: -0.006, h: 0.19, r: 0.019 },
    { x: 0.022, y: -0.006, h: 0.19, r: 0.019 },
    { x: -0.038, y: 0.006, h: 0.15, r: 0.014 },
    { x: 0.038, y: 0.006, h: 0.15, r: 0.014 },
  ];
  for (const strand of beardStrands) {
    attach(root, BONE.head, new THREE.ConeGeometry(H * strand.r, H * strand.h, 10), hair,
      [H * strand.x, H * strand.y, H * 0.043], [0, 0, Math.PI]);
  }

  // Green scholar-general headcloth, gold brow band and trailing ties.
  attach(root, BONE.head, new THREE.SphereGeometry(H * 0.052, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), green,
    [0, H * 0.105, H * 0.002], [0, 0, 0], [0.9, 0.75, 0.92]);
  attach(root, BONE.head, new THREE.TorusGeometry(H * 0.043, H * 0.0045, 6, 24), bronzeBright,
    [0, H * 0.095, H * 0.012], [Math.PI / 2, 0, 0], [1, 1, 0.76]);
  for (const side of [-1, 1]) {
    attach(root, BONE.head, new THREE.BoxGeometry(H * 0.018, H * 0.16, H * 0.006), greenDeep,
      [side * H * 0.025, -H * 0.015, -H * 0.04], [0.16, 0, side * 0.08]);
  }

  // Torso beneath the armour.
  attach(root, BONE.spine1, new THREE.CapsuleGeometry(H * 0.1, H * 0.12, 6, 14), greenDeep,
    [0, H * 0.075, 0], [0, 0, 0], [1.18, 1, 0.72]);
  const chest = attach(root, BONE.spine1, new THREE.BoxGeometry(H * 0.235, H * 0.22, H * 0.09), iron,
    [0, H * 0.078, H * 0.005], [0, 0, 0]);
  if (chest) {
    // Rows of raised lamellar plates give the armour readable detail at duel distance.
    for (let row = 0; row < 4; row++) {
      for (let col = -3; col <= 3; col++) {
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(H * 0.026, H * 0.035, H * 0.009),
          (row + col) % 2 ? bronze : bronzeBright,
        );
        plate.position.set(col * H * 0.031, H * (0.068 - row * 0.042), H * 0.052);
        plate.rotation.x = -0.08;
        plate.castShadow = true;
        chest.add(plate);
      }
    }
    const medallion = new THREE.Mesh(new THREE.TorusKnotGeometry(H * 0.025, H * 0.006, 48, 8, 2, 3), bronzeBright);
    medallion.position.set(0, H * 0.015, H * 0.058);
    medallion.rotation.x = Math.PI / 2;
    medallion.scale.set(1, 1, 0.45);
    medallion.castShadow = true;
    chest.add(medallion);
  }

  // Broad asymmetrical pauldrons.
  for (const side of [-1, 1]) {
    attach(root, BONE.spine2, new THREE.SphereGeometry(H * 0.09, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), bronze,
      [side * H * 0.112, H * 0.042, 0], [0, 0, side * 0.24], [1.35, 0.62, 0.95]);
  }

  // Robe, belt and hanging armour skirts.
  attach(root, BONE.hips, new THREE.CylinderGeometry(H * 0.115, H * 0.205, H * 0.39, 18, 1, false), green,
    [0, -H * 0.18, 0]);
  attach(root, BONE.hips, new THREE.TorusGeometry(H * 0.12, H * 0.018, 8, 24), bronzeBright,
    [0, -H * 0.015, 0], [Math.PI / 2, 0, 0], [1, 1, 0.68]);
  for (const side of [-1, 1]) {
    attach(root, BONE.hips, new THREE.BoxGeometry(H * 0.085, H * 0.31, H * 0.035), iron,
      [side * H * 0.095, -H * 0.17, H * 0.075], [0.06, 0, side * 0.05]);
  }

  // Bone-following arms, hands and legs.
  for (const side of ['Right', 'Left'] as const) {
    addLimb(root, BONE[`${side.toLowerCase()}Arm` as 'rightArm' | 'leftArm'], H * 0.155, H * 0.043, green);
    addLimb(root, BONE[`${side.toLowerCase()}ForeArm` as 'rightForeArm' | 'leftForeArm'], H * 0.16, H * 0.047, iron);
    attach(root, BONE[`${side.toLowerCase()}Hand` as 'rightHand' | 'leftHand'],
      new THREE.SphereGeometry(H * 0.035, 12, 10), skin, [0, H * 0.018, 0], [0, 0, 0], [0.72, 1.15, 0.74]);
    addLimb(root, BONE[`${side.toLowerCase()}UpLeg` as 'rightUpLeg' | 'leftUpLeg'], H * 0.245, H * 0.064, greenDeep);
    addLimb(root, BONE[`${side.toLowerCase()}Leg` as 'rightLeg' | 'leftLeg'], H * 0.245, H * 0.06, iron);
    attach(root, BONE[`${side.toLowerCase()}Foot` as 'rightFoot' | 'leftFoot'],
      new THREE.BoxGeometry(H * 0.09, H * 0.06, H * 0.17), leather,
      [0, H * 0.015, H * 0.04], [0, 0, 0]);
  }
}

export function applyOfficerAppearance(root: THREE.Object3D, officerId: string): boolean {
  if (officerId !== 'guan-yu') return false;
  const box = new THREE.Box3().setFromObject(root);
  const height = box.max.y - box.min.y || 180;
  applyGuanYu(root, height);
  return true;
}
