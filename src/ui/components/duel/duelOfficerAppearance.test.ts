import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyOfficerAppearance } from './duelOfficerAppearance';

const BONES = [
  'mixamorigHips',
  'mixamorigSpine1',
  'mixamorigSpine2',
  'mixamorigHead',
  'mixamorigRightArm',
  'mixamorigLeftArm',
  'mixamorigRightForeArm',
  'mixamorigLeftForeArm',
  'mixamorigRightHand',
  'mixamorigLeftHand',
  'mixamorigRightUpLeg',
  'mixamorigLeftUpLeg',
  'mixamorigRightLeg',
  'mixamorigLeftLeg',
  'mixamorigRightFoot',
  'mixamorigLeftFoot',
];

function mockMixamoRoot(): { root: THREE.Group; neutral: THREE.Mesh } {
  const root = new THREE.Group();
  const neutral = new THREE.Mesh(
    new THREE.BoxGeometry(80, 180, 30),
    new THREE.MeshStandardMaterial(),
  );
  neutral.name = 'Beta_Surface';
  neutral.position.y = 90;
  root.add(neutral);
  for (const name of BONES) {
    const bone = new THREE.Bone();
    bone.name = name;
    root.add(bone);
  }
  root.updateMatrixWorld(true);
  return { root, neutral };
}

describe('duel officer appearance', () => {
  it('builds Guan Yu on the shared Mixamo skeleton', () => {
    const { root, neutral } = mockMixamoRoot();

    expect(applyOfficerAppearance(root, 'guan-yu')).toBe(true);
    expect(neutral.visible).toBe(false);

    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
    expect(meshes.length).toBeGreaterThan(45);
    expect(root.getObjectByName('mixamorigHead')?.children.length).toBeGreaterThan(15);
    expect(root.getObjectByName('mixamorigSpine1')?.children.length).toBeGreaterThan(1);
  });

  it('leaves officers without a bespoke look on the neutral body', () => {
    const { root, neutral } = mockMixamoRoot();

    expect(applyOfficerAppearance(root, 'zhao-yun')).toBe(false);
    expect(neutral.visible).toBe(true);
  });
});
