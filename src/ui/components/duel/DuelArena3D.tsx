import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { ContactShadows, Html, Sparkles, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Group } from 'three';
import type { Officer } from '../../../game/types';
import type { DuelRoundFx } from '../DuelGameModal';
import { weaponClassFor, weaponIsTwoHanded, mountEdge, type WeaponClass, type DuelTerrain } from '../../../game/systems/duel';
import { playSfx } from '../../../game/systems/sound';
import {
  DUEL_ASSETS_READY, DUEL_FORMAT, DUEL_PACKS, type DuelAnim, type DuelPackId,
} from './duelAssets';

const packForClass = (c: WeaponClass): DuelPackId =>
  c === 'bow' ? 'long' : c === 'axe' ? 'axe' : weaponIsTwoHanded(c) ? 'great' : 'sword';

// Approximate clip lengths (seconds) for the procedural fallback fighter, which
// has no real clip to read a duration from. The realistic backend instead uses
// each Mixamo clip's own duration via the mixer's 'finished' event.
const PROC_SECONDS: Partial<Record<DuelAnim, number>> = {
  slash: 0.9, cleave: 0.9, sweep: 0.9, power: 1.2,
  guard: 0.7, parry: 0.7, dodge: 0.7, hit: 0.7, death: 1.4, victory: 1.6,
};
const PROC_ATTACK: DuelAnim[] = ['slash', 'cleave', 'sweep', 'power'];
const PROC_BLOCK: DuelAnim[] = ['guard', 'parry', 'dodge'];

/**
 * 寫實單挑競技場 — a self-contained 3D arena that stages a one-on-one bout
 * between two officers. It does NOT run any duel logic: a host feeds it the
 * per-exchange {@link DuelRoundFx} from {@link DuelGameModal} via {@link
 * DuelArena3D}'s `event` prop, and the arena translates each exchange into the
 * matching strike / hit / death animations on the two fighters.
 *
 * Rendering has two backends, chosen by {@link DUEL_ASSETS_READY}:
 *  - realistic: rigged Mixamo GLB characters with mocap clips (see
 *    `public/models/duel/README.md`);
 *  - fallback: a built-in procedural warrior, so the feature runs with no assets.
 */

// Which animation each fighter should currently be playing. `rot` selects which
// clip from the anim's pool (resolved per the fighter's own pack); `stamp` bumps
// to retrigger the same anim.
type FighterAction = { anim: DuelAnim; rot: number; stamp: number };

const RED = '#b8442e';   // the player / challenger (left)
const BLUE = '#3a7dd9';  // the foe / opponent (right)
const SKIN = '#e0c498';
const STEEL = '#c8d0d8';

// ─────────────────────────── procedural fallback fighter ───────────────────
// Built facing +X (toward the opponent). The host mirrors the right-hand
// fighter by rotating the whole group 180° about Y.

/** The procedural fighter's right-hand weapon, rendered per WeaponClass. Local
 *  space is the swing-arm group (grip near the origin; blades hang along −Y). */
function ProcWeapon({ cls }: { cls: WeaponClass }) {
  const steel = { color: STEEL, roughness: 0.25, metalness: 0.85 } as const;
  const wood = { color: '#5a4632', roughness: 0.8 } as const;
  const gold = { color: '#caa64a', metalness: 0.7, roughness: 0.3 } as const;
  if (cls === 'bow') {
    return (
      <group position={[0.18, -0.3, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI * 0.9]}><torusGeometry args={[0.34, 0.016, 6, 18, Math.PI * 1.15]} /><meshStandardMaterial {...wood} /></mesh>
        <mesh><cylinderGeometry args={[0.004, 0.004, 0.62, 4]} /><meshBasicMaterial color="#e8e0c8" /></mesh>
      </group>
    );
  }
  if (cls === 'axe') {
    return (
      <group position={[0.18, -0.5, 0]}>
        <mesh castShadow><cylinderGeometry args={[0.018, 0.018, 0.62, 8]} /><meshStandardMaterial {...wood} /></mesh>
        <mesh position={[0.0, 0.22, 0.1]} castShadow><boxGeometry args={[0.04, 0.2, 0.24]} /><meshStandardMaterial {...steel} /></mesh>
      </group>
    );
  }
  if (cls === 'spear' || cls === 'glaive' || cls === 'halberd') {
    return (
      <group position={[0.18, -0.45, 0]}>
        {/* a long pole reaching well past the hand */}
        <mesh castShadow><cylinderGeometry args={[0.016, 0.016, 1.5, 8]} /><meshStandardMaterial {...wood} /></mesh>
        {cls === 'spear' && <mesh position={[0, 0.82, 0]} castShadow><coneGeometry args={[0.035, 0.2, 8]} /><meshStandardMaterial {...steel} /></mesh>}
        {cls === 'glaive' && <mesh position={[0.07, 0.78, 0]} rotation={[0, 0, -0.35]} castShadow><boxGeometry args={[0.16, 0.34, 0.02]} /><meshStandardMaterial {...steel} /></mesh>}
        {cls === 'halberd' && <>
          <mesh position={[0, 0.84, 0]} castShadow><coneGeometry args={[0.03, 0.2, 8]} /><meshStandardMaterial {...steel} /></mesh>
          <mesh position={[0.09, 0.72, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow><torusGeometry args={[0.09, 0.016, 6, 12, Math.PI]} /><meshStandardMaterial {...steel} /></mesh>
        </>}
      </group>
    );
  }
  // sword / twinblade / greatsword — a straight blade, longer for the greatsword.
  const len = cls === 'greatsword' ? 1.0 : 0.7;
  return (
    <>
      <mesh position={[0.18, -0.28 - len / 2, 0]} castShadow>
        <boxGeometry args={[cls === 'greatsword' ? 0.08 : 0.05, len, 0.02]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[0.18, -0.28, 0]} castShadow>
        <boxGeometry args={[0.16, 0.04, 0.05]} />
        <meshStandardMaterial {...gold} />
      </mesh>
    </>
  );
}

function ProceduralFighter({
  tunic, action, weaponClass = 'sword',
}: { tunic: string; action: FighterAction; weaponClass?: WeaponClass }) {
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const swingArm = useRef<Group>(null);
  const guardArm = useRef<Group>(null);
  const flash = useRef<THREE.MeshBasicMaterial>(null);

  // Latch the clock time at which the current action began (clock-based so we
  // never touch the blocked Date.now / Math.random).
  const start = useRef(0);
  const pending = useRef(true);
  useEffect(() => { pending.current = true; }, [action.stamp, action.anim]);

  useFrame(({ clock }) => {
    const g = root.current; if (!g) return;
    const now = clock.elapsedTime;
    if (pending.current) { start.current = now; pending.current = false; }
    const t = now - start.current;
    const anim = action.anim;

    // Continuous idle breathing underlies everything.
    const breathe = Math.sin(now * 2.2) * 0.02;
    let px = 0, py = 0, rz = 0, lean = 0;
    let swing = -0.35 + Math.sin(now * 2) * 0.05; // relaxed guard
    let guard = 0.2;
    let flashA = 0;

    const dur = PROC_SECONDS[anim] ?? 0.8;
    const p = Math.min(1, t / dur);              // 0→1 over the clip
    const arc = Math.sin(p * Math.PI);            // 0→1→0 impulse
    const easeOut = 1 - (1 - p) * (1 - p);
    // A transient clip that has finished falls back to the idle pose, so the
    // fighter breathes between rounds rather than freezing on the last frame.
    const settled = t >= dur && anim !== 'idle' && anim !== 'death' && anim !== 'victory';

    if (settled) {
      // keep idle defaults computed above
    } else if (PROC_ATTACK.includes(anim)) {
      const reach = anim === 'power' ? 0.62 : 0.42;
      px = arc * reach;                           // lunge in and back
      // Overhead → downward chop.
      swing = THREE.MathUtils.lerp(2.5, -0.25, easeOut);
      lean = arc * (anim === 'power' ? 0.28 : 0.18);
      py = anim === 'power' ? arc * 0.06 : 0;
    } else if (PROC_BLOCK.includes(anim)) {
      guard = THREE.MathUtils.lerp(0.2, 1.5, easeOut); // shield up
      swing = THREE.MathUtils.lerp(-0.35, 0.5, easeOut);
      px = -arc * 0.06; lean = -arc * 0.12;
    } else if (anim === 'hit') {
      px = -arc * 0.3;                            // knocked back
      rz = -arc * 0.35; lean = -arc * 0.2;
      flashA = arc * 0.5;
    } else if (anim === 'death') {
      const d = easeOut;
      rz = -d * 1.45;                             // topple to the side
      py = -d * 0.35;
      px = -d * 0.15;
      flashA = (1 - p) * 0.4;
    } else if (anim === 'victory') {
      swing = -2.3 + Math.sin(now * 4) * 0.08;    // blade raised high
      py = Math.abs(Math.sin(now * 3)) * 0.05;
    }

    g.position.x = px;
    g.position.y = py;
    g.rotation.z = rz;
    if (torso.current) { torso.current.rotation.z = lean; torso.current.position.y = 0.9 + breathe; }
    if (swingArm.current) swingArm.current.rotation.z = swing;
    if (guardArm.current) guardArm.current.rotation.z = guard;
    if (flash.current) flash.current.opacity = flashA;
  });

  const leather = '#5a4632';
  return (
    <group ref={root}>
      {/* legs */}
      <mesh position={[0, 0.28, 0.12]} castShadow>
        <cylinderGeometry args={[0.085, 0.07, 0.56, 8]} />
        <meshStandardMaterial color={leather} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.28, -0.12]} castShadow>
        <cylinderGeometry args={[0.085, 0.07, 0.56, 8]} />
        <meshStandardMaterial color={leather} roughness={0.8} />
      </mesh>

      {/* torso assembly — leans/breathes */}
      <group ref={torso} position={[0, 0.9, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.17, 0.2, 0.5, 10]} />
          <meshStandardMaterial color={tunic} roughness={0.6} metalness={0.15} />
        </mesh>
        {/* shoulder sash for faction read */}
        <mesh position={[0, 0.05, 0]} rotation={[0, 0, 0.5]} castShadow>
          <boxGeometry args={[0.06, 0.5, 0.42]} />
          <meshStandardMaterial color={tunic} roughness={0.5} />
        </mesh>
        {/* head + helmet */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={STEEL} roughness={0.35} metalness={0.7} />
        </mesh>

        {/* guard arm (left, +Z) — raises a small shield */}
        <group ref={guardArm} position={[0, 0.18, 0.2]}>
          <mesh position={[0.12, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.045, 0.4, 8]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
          <mesh position={[0.24, -0.32, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.04, 16]} />
            <meshStandardMaterial color={'#7a5a32'} roughness={0.5} metalness={0.3} />
          </mesh>
        </group>

        {/* sword arm (right, -Z) — swings */}
        <group ref={swingArm} position={[0, 0.2, -0.2]}>
          <mesh position={[0.1, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.045, 0.42, 8]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
          {/* 兵器 — the procedural weapon varies by class (a coarse echo of the
              detailed Mixamo meshes): pole-arms reach far, the axe shows a head,
              the greatsword a longer blade, the bow a curved limb. */}
          <ProcWeapon cls={weaponClass} />
        </group>
      </group>

      {/* hit flash overlay */}
      <mesh position={[0, 1.0, 0]} scale={[0.5, 1.1, 0.5]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial ref={flash} color="#ffffff" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─────────────────────────── realistic Mixamo fighter ──────────────────────
// Loads one rigged character (the mesh) plus every duel clip, all on the same
// rig so clips retarget by bone name. Works for FBX (current) or GLB.

const ASSET_LOADER = (DUEL_FORMAT === 'fbx' ? FBXLoader : GLTFLoader) as unknown as new () => THREE.Loader;
// Mixamo rigs face +Z; turn the model to face +X (toward the opponent), like
// the procedural fighter. (+PI/2 — the X Bot rig faces the opponent this way.)
const MODEL_FACE_OFFSET = Math.PI / 2;

// ── Weapons ─────────────────────────────────────────────────────────────────
// The X Bot mesh is unarmed; we parent a procedural weapon mesh to the right
// hand (and a shield / off-hand sword to the left) so the fighter looks armed.
// The weapon shape comes from the officer's WeaponClass; the grip transform from
// the pack (one-handed sword grip vs two-handed pole grip). Transforms are in
// the model's NATIVE units (≈ height H) — tune these from a screenshot.
const ATTACH_WEAPON = true;
const RIGHT_HAND = 'mixamorigRightHand';
const LEFT_FOREARM = 'mixamorigLeftForeArm';
const LEFT_HAND = 'mixamorigLeftHand';
// Grip per hand pose (rotation radians, offset × H).
const GRIP_ONE: { rot: [number, number, number]; off: [number, number, number] } = { rot: [0, 0, 0], off: [0, 0.04, 0] };
const GRIP_TWO: { rot: [number, number, number]; off: [number, number, number] } = { rot: [0, 0, 0], off: [0, 0.0, 0] };
const SHIELD_ROT: [number, number, number] = [Math.PI / 2, 0, 0];
const SHIELD_OFFSET: [number, number, number] = [0.02, 0.06, 0];

const MAT = {
  steel: () => new THREE.MeshStandardMaterial({ color: '#cdd5dd', metalness: 0.85, roughness: 0.25 }),
  gold: () => new THREE.MeshStandardMaterial({ color: '#caa64a', metalness: 0.7, roughness: 0.3 }),
  wood: () => new THREE.MeshStandardMaterial({ color: '#6b4a2a', roughness: 0.75, metalness: 0.1 }),
  jade: () => new THREE.MeshStandardMaterial({ color: '#2f7d5b', metalness: 0.5, roughness: 0.4 }),
};

function bladeSword(len: number): THREE.Group {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(len * 0.06, len * 0.8, len * 0.02), MAT.steel()); blade.position.y = len * 0.49;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(len * 0.24, len * 0.05, len * 0.06), MAT.gold()); guard.position.y = len * 0.09;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(len * 0.032, len * 0.032, len * 0.18, 8), MAT.wood());
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(len * 0.045, 10, 10), MAT.gold()); pommel.position.y = -len * 0.1;
  g.add(blade, guard, handle, pommel);
  return g;
}

/** A long pole gripped near the middle; `head` is added at the top by callers. */
function poleArm(len: number): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(len * 0.018, len * 0.018, len, 8), MAT.wood());
  pole.position.y = len * 0.15; // grip a bit below centre so more reaches up
  g.add(pole);
  return g;
}

function buildWeapon(cls: WeaponClass, H: number): THREE.Group {
  let g: THREE.Group;
  if (cls === 'sword' || cls === 'twinblade') {
    g = bladeSword(H * 0.5);
  } else if (cls === 'axe') {
    g = new THREE.Group();
    const haft = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.012, H * 0.012, H * 0.42, 8), MAT.wood());
    const head = new THREE.Mesh(new THREE.BoxGeometry(H * 0.04, H * 0.13, H * 0.16), MAT.steel());
    head.position.set(0, H * 0.18, H * 0.08);
    g.add(haft, head);
  } else if (cls === 'greatsword') {
    g = bladeSword(H * 0.95);
  } else if (cls === 'bow') {
    // 弓 — a curved limb (a C-arc) strung top to bottom.
    g = new THREE.Group();
    const limb = new THREE.Mesh(new THREE.TorusGeometry(H * 0.26, H * 0.012, 6, 18, Math.PI * 1.15), MAT.wood());
    limb.rotation.z = Math.PI * 0.92;
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.018, H * 0.018, H * 0.12, 8), MAT.wood());
    const string = new THREE.Mesh(
      new THREE.CylinderGeometry(H * 0.003, H * 0.003, H * 0.5, 4),
      new THREE.MeshBasicMaterial({ color: '#e8e0c8' }),
    );
    string.position.x = H * 0.2;
    g.add(limb, grip, string);
  } else { // two-handed polearms: spear / glaive / halberd
    const len = H * 1.2;
    g = poleArm(len);
    const top = len * 0.65;
    if (cls === 'spear') {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(len * 0.03, len * 0.16, 8), MAT.steel());
      tip.position.y = top + len * 0.06; g.add(tip);
    } else if (cls === 'glaive') {
      // 青龍偃月刀 — a broad curved crescent blade.
      const blade = new THREE.Mesh(new THREE.BoxGeometry(len * 0.13, len * 0.26, len * 0.02), MAT.steel());
      blade.position.set(len * 0.05, top + len * 0.04, 0); blade.rotation.z = -0.35;
      const collar = new THREE.Mesh(new THREE.SphereGeometry(len * 0.03, 8, 8), MAT.gold()); collar.position.y = top - len * 0.08;
      g.add(blade, collar);
    } else { // halberd — 方天畫戟: spear tip + side crescent(s)
      const tip = new THREE.Mesh(new THREE.ConeGeometry(len * 0.028, len * 0.16, 8), MAT.steel()); tip.position.y = top + len * 0.07;
      const moon = new THREE.Mesh(new THREE.TorusGeometry(len * 0.07, len * 0.014, 6, 12, Math.PI), MAT.steel());
      moon.position.set(len * 0.07, top - len * 0.02, 0); moon.rotation.z = -Math.PI / 2;
      g.add(tip, moon);
    }
  }
  g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.castShadow = true; });
  return g;
}

function buildShield(r: number): THREE.Group {
  const g = new THREE.Group();
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r * 0.12, 24), MAT.wood());
  const boss = new THREE.Mesh(new THREE.SphereGeometry(r * 0.22, 12, 12), MAT.gold()); boss.position.y = r * 0.06;
  g.add(disk, boss);
  g.traverse((o) => { (o as THREE.Mesh).castShadow = true; });
  return g;
}

/** Arm the cloned skeleton according to the officer's weapon class. */
function attachWeapons(root: THREE.Object3D, cls: WeaponClass): void {
  if (!ATTACH_WEAPON) return;
  const box = new THREE.Box3().setFromObject(root);
  const H = box.max.y - box.min.y || 100;
  // 弓手 — the bow rides the LEFT hand; the right stays free to draw.
  if (cls === 'bow') {
    const lh = root.getObjectByName(LEFT_HAND) ?? root.getObjectByName(LEFT_FOREARM);
    if (lh) { const w = buildWeapon('bow', H); w.position.set(0, GRIP_ONE.off[1] * H, 0); lh.add(w); }
    return;
  }
  const twoH = weaponIsTwoHanded(cls);
  const grip = twoH ? GRIP_TWO : GRIP_ONE;
  const hand = root.getObjectByName(RIGHT_HAND);
  if (hand) {
    const w = buildWeapon(cls, H);
    w.position.set(grip.off[0] * H, grip.off[1] * H, grip.off[2] * H);
    w.rotation.set(grip.rot[0], grip.rot[1], grip.rot[2]);
    hand.add(w);
  }
  // Left hand: shield for sword/axe, an off-hand sword for the twin blades.
  if (cls === 'sword' || cls === 'axe') {
    const arm = root.getObjectByName(LEFT_FOREARM) ?? root.getObjectByName(LEFT_HAND);
    if (arm) {
      const shield = buildShield(H * 0.16);
      shield.position.set(SHIELD_OFFSET[0] * H, SHIELD_OFFSET[1] * H, SHIELD_OFFSET[2] * H);
      shield.rotation.set(SHIELD_ROT[0], SHIELD_ROT[1], SHIELD_ROT[2]);
      arm.add(shield);
    }
  } else if (cls === 'twinblade') {
    const lh = root.getObjectByName(LEFT_HAND);
    if (lh) {
      const w = buildWeapon('sword', H);
      w.position.set(GRIP_ONE.off[0] * H, GRIP_ONE.off[1] * H, GRIP_ONE.off[2] * H);
      lh.add(w);
    }
  }
}

/** Tint the armour toward a faction colour + add a chest sash so the two sides
 *  read apart (the base X Bot mesh is an identical grey otherwise). */
function applyFaction(root: THREE.Object3D, tint: string): void {
  const armour = new THREE.Color('#8b929b').lerp(new THREE.Color(tint), 0.45);
  const tintMat = (mat: THREE.Material): THREE.Material => {
    const c = mat.clone() as THREE.Material & { color?: THREE.Color };
    if (c.color) c.color.copy(armour);
    return c;
  };
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.material) m.material = Array.isArray(m.material) ? m.material.map(tintMat) : tintMat(m.material);
  });
  const box = new THREE.Box3().setFromObject(root);
  const H = box.max.y - box.min.y || 100;
  const spine = root.getObjectByName('mixamorigSpine2') ?? root.getObjectByName('mixamorigSpine1') ?? root.getObjectByName('mixamorigSpine');
  if (spine) {
    const sash = new THREE.Mesh(
      new THREE.BoxGeometry(H * 0.05, H * 0.34, H * 0.17),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(tint), roughness: 0.5, metalness: 0.1 }),
    );
    sash.position.z = H * 0.05;
    sash.rotation.z = 0.5;
    sash.castShadow = true;
    spine.add(sash);
  }
}

/** Pull the character root + animation clips out of one loaded asset. */
function assetParts(loaded: unknown): { root: THREE.Object3D; clips: THREE.AnimationClip[] } {
  if (DUEL_FORMAT === 'glb') {
    const g = loaded as { scene: THREE.Object3D; animations: THREE.AnimationClip[] };
    return { root: g.scene, clips: g.animations ?? [] };
  }
  const g = loaded as THREE.Object3D & { animations?: THREE.AnimationClip[] };
  return { root: g, clips: g.animations ?? [] };
}

function RealFighter({ action, pack, weaponClass, tint, timeScale }: { action: FighterAction; pack: DuelPackId; weaponClass: WeaponClass; tint: string; timeScale: number }) {
  const group = useRef<Group>(null);
  const packDef = DUEL_PACKS[pack];
  const loaded = useLoader(ASSET_LOADER, packDef.urls) as unknown[];

  // Clone the mesh so two fighters never share one skeleton, tint it, then arm it.
  const scene = useMemo(() => {
    const s = cloneSkeleton(assetParts(loaded[0]).root);
    s.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.frustumCulled = false; } });
    applyFaction(s, tint);
    attachWeapons(s, weaponClass);
    return s;
  }, [loaded, weaponClass, tint]);
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const h = box.max.y - box.min.y || 1;
    const scale = 1.7 / h;
    return { scale, yOffset: -box.min.y * scale };
  }, [scene]);

  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const actions = useMemo(() => {
    const map: Record<string, THREE.AnimationAction> = {};
    packDef.clipKeys.forEach((key, i) => {
      const src = assetParts(loaded[i + 1]).clips[0];
      if (src) { const c = src.clone(); c.name = key; map[key] = mixer.clipAction(c); }
    });
    return map;
  }, [loaded, mixer, packDef]);

  useFrame((_, delta) => mixer.update(delta * timeScale));

  useEffect(() => {
    const { anim, rot } = action;
    const pool = packDef.actionClips[anim] ?? packDef.actionClips.idle;
    const clip = pool[((rot % pool.length) + pool.length) % pool.length];
    const loop = anim === 'idle';
    const hold = anim === 'death' || anim === 'victory'; // stay on the last frame
    const next = actions[clip] ?? actions[packDef.idleKey];
    if (!next) return;
    next.reset();
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.fadeIn(0.18).play();
    for (const [k, act] of Object.entries(actions)) if (k !== clip && act) act.fadeOut(0.2);
    if (!loop && !hold) {
      const back = () => { actions[packDef.idleKey]?.reset().fadeIn(0.25).play(); };
      mixer.addEventListener('finished', back);
      return () => mixer.removeEventListener('finished', back);
    }
  }, [action.anim, action.rot, action.stamp, actions, mixer, packDef]);

  return (
    <group ref={group} position={[0, fit.yOffset, 0]} rotation={[0, MODEL_FACE_OFFSET, 0]} scale={fit.scale}>
      <primitive object={scene} />
    </group>
  );
}

// ─────────────────────────── one positioned fighter ────────────────────────

function Fighter({
  side, tunic, action, name, weaponClass, timeScale, pos,
}: { side: 'left' | 'right'; tunic: string; action: FighterAction; name: string; weaponClass: WeaponClass; timeScale: number;
  /** 團戰站位 — optional (x, z) override so several fighters share the ring. */
  pos?: [number, number] }) {
  const x = pos ? pos[0] : side === 'left' ? -0.95 : 0.95;
  const z = pos ? pos[1] : 0;
  // Procedural model is authored facing +X; the right fighter turns to face it.
  const rotY = side === 'left' ? 0 : Math.PI;
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {DUEL_ASSETS_READY
        ? <RealFighter action={action} pack={packForClass(weaponClass)} weaponClass={weaponClass} tint={tunic} timeScale={timeScale} />
        : <ProceduralFighter tunic={tunic} action={action} weaponClass={weaponClass} />}
      {/* faction ring underfoot */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.46, 32]} />
        <meshBasicMaterial color={tunic} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0, 2.0, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#fff', background: 'rgba(0,0,0,0.45)', padding: '1px 7px', borderRadius: 'var(--tkm-radius-sm)',
          fontFamily: 'var(--tkm-font-body)', fontSize: 13, letterSpacing: '0.05em',
          border: `1px solid ${tunic}`, whiteSpace: 'nowrap',
        }}>{name}</div>
      </Html>
    </group>
  );
}

// ─────────────────────────── camera + strike sparks ────────────────────────

function CameraRig({ shakeKey, big, killKey, killX }: { shakeKey: number; big: boolean; killKey: number; killX: number }) {
  const impulse = useRef(0);
  const seen = useRef(0);
  const kill = useRef(0);
  const killSeen = useRef(0);
  const killAt = useRef(0);
  useFrame(({ camera, clock }) => {
    if (shakeKey !== seen.current) { seen.current = shakeKey; impulse.current = big ? 1 : 0.6; }
    if (killKey !== killSeen.current) { killSeen.current = killKey; kill.current = 1; killAt.current = killX; }
    impulse.current *= 0.9;
    kill.current *= 0.99;            // long, slow hold on the finishing blow
    const k = impulse.current;
    const kc = kill.current;
    const tx = killAt.current * kc * 0.7; // drift toward the slain fighter
    const sway = Math.sin(clock.elapsedTime * 0.4) * 0.12;
    camera.position.set(
      sway + tx * 0.5 + Math.sin(clock.elapsedTime * 23) * k * 0.04,
      1.55 - kc * 0.18 + Math.cos(clock.elapsedTime * 19) * k * 0.03,
      4.0 - k * 0.5 - kc * 1.7,      // strong push-in for the killcam
    );
    camera.lookAt(tx, 1.05, 0);
  });
  return null;
}

/** A punchy multi-part strike burst at a struck fighter: a white core flash, a
 *  ring of radial spark shards and an expanding shock ring. Heavier blows (奮/
 *  連擊/突刺) and kills throw a bigger, redder burst. Remount via `key` to replay. */
const SPARK_SHARDS = 9;
function HitSpark({ position, killed, heavy }: { position: [number, number, number]; killed: boolean; heavy: boolean }) {
  const core = useRef<Group>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const shards = useRef<Group>(null);
  const shardMat = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const start = useRef(0);
  const pending = useRef(true);
  const big = killed || heavy;
  const tint = killed ? '#ff4a2c' : heavy ? '#ffc04a' : '#ffe6a0';
  useFrame(({ clock }) => {
    if (pending.current) { start.current = clock.elapsedTime; pending.current = false; }
    const t = clock.elapsedTime - start.current;
    const dur = killed ? 0.6 : big ? 0.42 : 0.3;
    const p = Math.min(1, t / dur);
    const fade = 1 - p;
    if (core.current) core.current.scale.setScalar(0.1 + p * (big ? 0.9 : 0.55));
    if (coreMat.current) coreMat.current.opacity = fade * 0.95;
    if (shards.current) { shards.current.scale.setScalar(0.2 + p * (big ? 2.4 : 1.5)); shards.current.visible = p < 1; }
    if (shardMat.current) shardMat.current.opacity = fade * fade * 0.95;
    if (ring.current) { const s = 0.2 + p * (big ? 2.2 : 1.4); ring.current.scale.set(s, s, s); ring.current.visible = p < 1; }
    if (ringMat.current) ringMat.current.opacity = fade * 0.7;
    if (core.current) core.current.visible = p < 1;
  });
  const shardEls = useMemo(() => Array.from({ length: SPARK_SHARDS }, (_, i) => {
    const a = (i / SPARK_SHARDS) * Math.PI * 2 + (i % 2) * 0.3;
    const len = 0.16 + (i % 3) * 0.05;
    return (
      <mesh key={i} position={[Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0]} rotation={[0, 0, a]}>
        <boxGeometry args={[len, 0.022, 0.022]} />
        <meshBasicMaterial ref={i === 0 ? shardMat : undefined} color={tint} transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    );
  }), [tint]);
  return (
    <group position={position}>
      {/* core flash */}
      <group ref={core}>
        <mesh>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial ref={coreMat} color={killed ? '#ffd0c0' : '#ffffff'} transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      {/* radial spark shards */}
      <group ref={shards}>{shardEls}</group>
      {/* expanding shock ring */}
      <mesh ref={ring} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.34, 0.46, 24]} />
        <meshBasicMaterial ref={ringMat} color={tint} transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/** 環境借勢 — the terrain itself bursts on the struck foe: a terrain-keyed column
 *  flash, a floor shock-ring and a fan of rising motes (揚沙 dust / 斷喝 golden
 *  shock / 撩泥 clods / 撩火 embers / 借雨 spray). Remount via `key` to replay. */
const EXPLOIT_TINT: Record<DuelTerrain, { core: string; mote: string }> = {
  plain:  { core: '#e8d8a8', mote: '#c8b080' },
  bridge: { core: '#ffd27a', mote: '#caa86a' },
  mud:    { core: '#8a6a3c', mote: '#9a7a4c' },
  fire:   { core: '#ff7a2c', mote: '#ffb44a' },
  rain:   { core: '#7ab4ff', mote: '#a8d0ff' },
};
const EXPLOIT_MOTES = 12;
function ExploitBurst({ x, terrain }: { x: number; terrain: DuelTerrain }) {
  const column = useRef<THREE.Mesh>(null);
  const columnMat = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const motes = useRef<Group>(null);
  const moteMat = useRef<THREE.MeshBasicMaterial>(null);
  const start = useRef(0);
  const pending = useRef(true);
  const tint = EXPLOIT_TINT[terrain] ?? EXPLOIT_TINT.plain;
  useFrame(({ clock }) => {
    if (pending.current) { start.current = clock.elapsedTime; pending.current = false; }
    const t = clock.elapsedTime - start.current;
    const p = Math.min(1, t / 0.7);
    const fade = 1 - p;
    if (column.current) { column.current.scale.set(1 + p * 0.6, 0.2 + p * 1.6, 1 + p * 0.6); column.current.visible = p < 1; }
    if (columnMat.current) columnMat.current.opacity = fade * 0.55;
    if (ring.current) { const s = 0.3 + p * 2.6; ring.current.scale.set(s, s, s); ring.current.visible = p < 1; }
    if (ringMat.current) ringMat.current.opacity = fade * 0.6;
    if (motes.current) {
      motes.current.scale.setScalar(0.3 + p * 2.0);
      motes.current.position.y = 0.25 + p * 1.1;
      motes.current.visible = p < 1;
    }
    if (moteMat.current) moteMat.current.opacity = fade * fade * 0.9;
  });
  const moteEls = useMemo(() => Array.from({ length: EXPLOIT_MOTES }, (_, i) => {
    const a = (i / EXPLOIT_MOTES) * Math.PI * 2 + (i % 3) * 0.21;
    const r = 0.14 + (i % 4) * 0.045;
    const s = 0.035 + (i % 3) * 0.014;
    return (
      <mesh key={i} position={[Math.cos(a) * r, (i % 5) * 0.05, Math.sin(a) * r]}>
        <boxGeometry args={[s, s, s]} />
        <meshBasicMaterial ref={i === 0 ? moteMat : undefined} color={tint.mote} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    );
  }), [tint.mote]);
  return (
    <group position={[x, 0, 0]}>
      {/* rising column flash */}
      <mesh ref={column} position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.26, 0.4, 1.4, 12, 1, true]} />
        <meshBasicMaterial ref={columnMat} color={tint.core} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* expanding floor shock-ring */}
      <mesh ref={ring} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.42, 28]} />
        <meshBasicMaterial ref={ringMat} color={tint.core} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* fan of rising motes */}
      <group ref={motes}>{moteEls}</group>
    </group>
  );
}

// ─────────────────────────── 三國戰場舞台 (themed stage) ────────────────────

function Torch({ position }: { position: [number, number, number] }) {
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!flame.current) return;
    const f = 1 + Math.sin(clock.elapsedTime * 12 + position[0]) * 0.18;
    flame.current.scale.set(f, 1 + Math.sin(clock.elapsedTime * 9 + position[2]) * 0.25, f);
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.055, 1.8, 6]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      <mesh ref={flame} position={[0, 1.95, 0]}>
        <coneGeometry args={[0.13, 0.42, 8]} />
        <meshBasicMaterial color="#ffb44a" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2, 0]} color="#ff9b3a" intensity={7} distance={6.5} decay={2} />
    </group>
  );
}

function Banner({ position, color, rot }: { position: [number, number, number]; color: string; rot: number }) {
  const flag = useRef<Group>(null);
  useFrame(({ clock }) => { if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 2 + position[0]) * 0.28; });
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 3, 6]} />
        <meshStandardMaterial color="#2a1f14" roughness={0.9} />
      </mesh>
      <group ref={flag} position={[0, 2.5, 0]}>
        <mesh position={[0.26, 0, 0]}>
          <planeGeometry args={[0.52, 0.85]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

function Spectators() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 64;
  useEffect(() => {
    const inst = ref.current; if (!inst) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const r = 5.4 + (i % 3) * 0.55;
      m.makeTranslation(Math.cos(a) * r, 0.55, Math.sin(a) * r);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} castShadow>
      <capsuleGeometry args={[0.18, 0.5, 4, 8]} />
      <meshStandardMaterial color="#241c14" roughness={0.95} />
    </instancedMesh>
  );
}

/** Backdrop wall, banners, torches, onlookers and drifting dust. The banners fly
 *  the two combatants' own colours, so the arena reads as *their* contest. */
function ArenaStage({ tint = ['#b8442e', '#3a7dd9'] }: { tint?: [string, string] }) {
  const banners: Array<{ position: [number, number, number]; color: string; rot: number }> = useMemo(() => {
    const cols = [tint[0], tint[1], '#caa64a', tint[0], tint[1], '#caa64a'];
    return Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      return { position: [Math.cos(a) * 4.2, 0, Math.sin(a) * 4.2] as [number, number, number], color: cols[i % cols.length], rot: -a + Math.PI / 2 };
    });
  }, [tint]);
  return (
    <>
      {/* dark stone perimeter wall */}
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[13, 13, 7.2, 32, 1, true]} />
        <meshStandardMaterial color="#181410" side={THREE.BackSide} roughness={1} />
      </mesh>
      <Spectators />
      {banners.map((b, i) => <Banner key={i} {...b} />)}
      <Torch position={[3.4, 0, 3.4]} />
      <Torch position={[-3.4, 0, 3.4]} />
      <Torch position={[3.4, 0, -3.4]} />
      <Torch position={[-3.4, 0, -3.4]} />
      <Sparkles count={40} scale={[8, 4, 8]} position={[0, 2, 0]} size={2} speed={0.3} opacity={0.4} color="#d8c8a0" />
    </>
  );
}

// ─────────────────────────── 長坂橋 (the narrow bridge stage) ───────────────
// 長坂橋 isn't just a tan floor — it's an actual plank bridge over a dark river,
// with rails, piers sunk into the water, and mist curling off it (張飛據水斷橋).

/** A gently rippling dark river beneath the bridge, with a drifting sheen. */
function River() {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => { if (mat.current) mat.current.opacity = 0.86 + Math.sin(clock.elapsedTime * 0.8) * 0.06; });
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.7, 0]}>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial ref={mat} color="#10171f" roughness={0.18} metalness={0.7} transparent opacity={0.9} />
      </mesh>
      <Sparkles count={50} scale={[20, 0.3, 20]} position={[0, -1.55, 0]} size={5} speed={0.25} opacity={0.35} color="#7d97b5" />
      {/* river mist curling off the water */}
      <Sparkles count={40} scale={[16, 1.4, 8]} position={[0, -0.6, 0]} size={9} speed={0.18} opacity={0.22} color="#9fb2c6" />
    </>
  );
}

/** The plank deck + rails + piers that span the gorge. Fighters stand at x≈±0.95. */
function BridgeStage() {
  const planks = useMemo(() => Array.from({ length: 13 }, (_, i) => -7.2 + i * 1.2), []);
  const posts = useMemo(() => Array.from({ length: 11 }, (_, i) => -6.5 + i * 1.3), []);
  return (
    <>
      {/* deck base */}
      <mesh position={[0, -0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[15, 0.22, 2.6]} />
        <meshStandardMaterial color="#5a4228" roughness={0.92} />
      </mesh>
      {/* cross planks for texture */}
      {planks.map((x, i) => (
        <mesh key={i} position={[x, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.05, 2.5]} />
          <meshStandardMaterial color={i % 2 ? '#6a4f30' : '#5e4528'} roughness={0.95} />
        </mesh>
      ))}
      {/* two side rails — posts + a top beam */}
      {([-1.18, 1.18] as const).map((z) => (
        <group key={z}>
          {posts.map((x, i) => (
            <mesh key={i} position={[x, 0.34, z]} castShadow>
              <cylinderGeometry args={[0.055, 0.06, 0.92, 6]} />
              <meshStandardMaterial color="#3f2e1b" roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[0, 0.74, z]} castShadow>
            <boxGeometry args={[14.4, 0.1, 0.12]} />
            <meshStandardMaterial color="#4a371f" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* piers sunk into the river */}
      {[-4.4, 0, 4.4].map((x, i) => (
        <mesh key={i} position={[x, -1.0, 0]} castShadow>
          <boxGeometry args={[0.5, 1.9, 2.2]} />
          <meshStandardMaterial color="#33271a" roughness={0.95} />
        </mesh>
      ))}
      <River />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={9} blur={2.4} far={3} />
    </>
  );
}

// ─────────────────────────── 坐騎 (the general's war-horse) ─────────────────
// A general who rode in on a famed steed (赤兔/的盧/絕影…) has it stand at their
// side in the arena — a low-poly war-horse with a caparison in the rider's colour.
// (The duel itself is fought on foot; the steed waits, tossing its head.)
function WarHorse({ x, faceRight, body, cloth }: { x: number; faceRight: boolean; body: string; cloth: string }) {
  const head = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (head.current) head.current.rotation.x = -0.15 + Math.sin(clock.elapsedTime * 1.4 + x) * 0.12; // toss the head
  });
  const dir = faceRight ? 1 : -1;
  return (
    <group position={[x, 0, 1.5]} rotation={[0, faceRight ? Math.PI / 2 : -Math.PI / 2, 0]}>
      {/* barrel */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.95, 6, 10]} />
        <meshStandardMaterial color={body} roughness={0.7} />
      </mesh>
      {/* caparison cloth in the rider's colour */}
      <mesh position={[0, 0.86, 0]} castShadow>
        <capsuleGeometry args={[0.37, 0.6, 4, 8]} />
        <meshStandardMaterial color={cloth} roughness={0.85} />
      </mesh>
      {/* neck + head */}
      <group ref={head} position={[0, 1.18, dir * 0.62]}>
        <mesh position={[0, 0.18, dir * 0.12]} rotation={[dir * 0.5, 0, 0]} castShadow>
          <capsuleGeometry args={[0.14, 0.5, 4, 8]} />
          <meshStandardMaterial color={body} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.42, dir * 0.34]} rotation={[dir * 0.9, 0, 0]} castShadow>
          <boxGeometry args={[0.2, 0.46, 0.24]} />
          <meshStandardMaterial color={body} roughness={0.7} />
        </mesh>
      </group>
      {/* four legs */}
      {[[0.2, 0.52], [-0.2, 0.52], [0.2, -0.52], [-0.2, -0.52]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.4, lz]} castShadow>
          <cylinderGeometry args={[0.07, 0.05, 0.84, 6]} />
          <meshStandardMaterial color={body} roughness={0.8} />
        </mesh>
      ))}
      {/* tail */}
      <mesh position={[0, 0.95, -dir * 0.7]} rotation={[-dir * 0.7, 0, 0]}>
        <coneGeometry args={[0.1, 0.55, 6]} />
        <meshStandardMaterial color="#1c140c" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** The steed's coat by famous mount id; default a bay-brown war-horse. */
function mountColors(o: Officer): { body: string } | null {
  const e = mountEdge(o);
  if (!e) return null;
  for (const id of o.equipment) {
    if (id === 'red-hare') return { body: '#a13522' };          // 赤兔 — fiery red
    if (id === 'dilu') return { body: '#d6cfbe' };              // 的盧 — pale
    if (id === 'jue-ying') return { body: '#23232b' };          // 絕影 — shadow-black
    if (id === 'zhaoye-yushizi' || id === 'bailong') return { body: '#e2e0d6' }; // 玉獅子/白龍 — white
    if (id === 'wuzhui-ma' || id === 'wuzhui' || id === 'heizhui') return { body: '#2b2620' }; // 烏騅/黑追 — dark
  }
  return { body: '#6b4f32' };
}

// ─────────────────────────── 地形/天候 (terrain & weather) ──────────────────
// The bout's DuelTerrain re-skins the whole stage: floor, sky, fog, ambient
// light and a weather layer. 演武/比武 are on the neutral 校場 (plain); a
// battlefield 單挑 can fall on a bridge, in the mire, in the rain or in fire.
interface TerrainLook {
  floor: string; bg: string; fog: [number, number]; ambient: number;
  key: string; keyColor: string; weather: 'rain' | 'fire' | 'mud' | null;
  descZh: string; descEn: string;
}
const TERRAIN_LOOK: Record<DuelTerrain, TerrainLook> = {
  plain:  { floor: '#3c352a', bg: '#14110c', fog: [7, 16], ambient: 0.35, key: '#ffe0b0', keyColor: '#ffe0b0', weather: null,   descZh: '校場', descEn: 'Open Ground' },
  bridge: { floor: '#6a5236', bg: '#0d1118', fog: [9, 22], ambient: 0.34, key: '#cdd8ea', keyColor: '#cdd8ea', weather: null,   descZh: '長坂橋', descEn: 'Narrow Bridge' },
  mud:    { floor: '#352a1b', bg: '#100d09', fog: [6, 14], ambient: 0.3,  key: '#d8c098', keyColor: '#d8c098', weather: 'mud',  descZh: '泥濘', descEn: 'Mire' },
  fire:   { floor: '#2a1610', bg: '#1c0b05', fog: [5, 12], ambient: 0.52, key: '#ff9050', keyColor: '#ff7a40', weather: 'fire', descZh: '火海', descEn: 'Burning Field' },
  rain:   { floor: '#2c2e30', bg: '#0b0d11', fog: [5, 12], ambient: 0.26, key: '#a8c0e0', keyColor: '#9fb6d8', weather: 'rain', descZh: '雨夜', descEn: 'Rainy Night' },
};

/** Falling-rain streaks (a wrapping instanced field) for the 雨夜 terrain. */
function Rain() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 220;
  const seeds = useMemo(() => Array.from({ length: N }, (_, i) => ({
    x: (((i * 7.31) % 10) - 5), z: (((i * 3.77) % 10) - 5), y: ((i * 1.13) % 6), s: 0.6 + (i % 4) * 0.18,
  })), []);
  useFrame((_, delta) => {
    const inst = ref.current; if (!inst) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < N; i++) {
      const sd = seeds[i];
      sd.y -= delta * 9 * sd.s;
      if (sd.y < 0) sd.y += 6;
      m.makeTranslation(sd.x, sd.y, sd.z);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <boxGeometry args={[0.012, 0.4, 0.012]} />
      <meshBasicMaterial color="#acc4e6" transparent opacity={0.5} />
    </instancedMesh>
  );
}

/** Weather layer keyed to the terrain — rain streaks, fire embers, or a wet sheen. */
function Weather({ kind }: { kind: 'rain' | 'fire' | 'mud' | null }) {
  if (kind === 'rain') return <><Rain /><Sparkles count={30} scale={[9, 0.2, 9]} position={[0, 0.05, 0]} size={3} speed={0.2} opacity={0.25} color="#acc4e6" /></>;
  if (kind === 'fire') return <Sparkles count={70} scale={[9, 5, 9]} position={[0, 2.4, 0]} size={4} speed={1.1} opacity={0.7} color="#ff7a30" />;
  if (kind === 'mud') return <Sparkles count={16} scale={[8, 0.4, 8]} position={[0, 0.1, 0]} size={2} speed={0.1} opacity={0.18} color="#6a5a3a" />;
  return null;
}

// ─── 環境互動物 (interactive props) — braziers/jars that topple on a kill ─────
function KnockProp({ position, kind, knockKey, knockX }: { position: [number, number, number]; kind: 'jar' | 'brazier'; knockKey: number; knockX: number }) {
  const g = useRef<Group>(null);
  const tip = useRef(0);
  const seen = useRef(0);
  // Topple if the kill happened on this prop's side (same sign of x).
  useFrame((_, delta) => {
    if (!g.current) return;
    if (knockKey !== seen.current) {
      seen.current = knockKey;
      if (Math.sign(knockX || 0) === Math.sign(position[0]) || knockX === 0) tip.current = Math.max(tip.current, 1);
    }
    if (tip.current > 0.001) {
      const fall = Math.min(1, (g.current.userData.fall = (g.current.userData.fall ?? 0) + delta * 2.2));
      g.current.rotation.z = -fall * 1.3 * Math.sign(position[0] || 1);
      g.current.position.y = position[1] - fall * 0.1;
    }
  });
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (flame.current) flame.current.scale.y = 1 + Math.sin(clock.elapsedTime * 11 + position[0]) * 0.25; });
  return (
    <group ref={g} position={position}>
      {kind === 'jar' ? (
        <mesh castShadow position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.13, 0.18, 0.44, 12]} />
          <meshStandardMaterial color="#6a4a30" roughness={0.85} />
        </mesh>
      ) : (
        <>
          <mesh castShadow position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.16, 0.1, 0.6, 8]} />
            <meshStandardMaterial color="#3a2a1a" roughness={0.9} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.17, 0.17, 0.08, 12]} /><meshStandardMaterial color="#2a1c12" /></mesh>
          <mesh ref={flame} position={[0, 0.72, 0]}><coneGeometry args={[0.1, 0.3, 8]} /><meshBasicMaterial color="#ffb44a" toneMapped={false} /></mesh>
          <pointLight position={[0, 0.8, 0]} color="#ff9b3a" intensity={4} distance={4} decay={2} />
        </>
      )}
    </group>
  );
}

function StageProps({ knockKey, knockX }: { knockKey: number; knockX: number }) {
  return (
    <>
      <KnockProp position={[-2.6, 0, 1.6]} kind="brazier" knockKey={knockKey} knockX={knockX} />
      <KnockProp position={[2.6, 0, 1.6]} kind="brazier" knockKey={knockKey} knockX={knockX} />
      <KnockProp position={[-2.9, 0, -1.2]} kind="jar" knockKey={knockKey} knockX={knockX} />
      <KnockProp position={[2.9, 0, -1.2]} kind="jar" knockKey={knockKey} knockX={knockX} />
    </>
  );
}

// ─── 伤痕/血迹 (wounds) — a blood spray on a telling hit + a growing stain ─────
function BloodSpray({ position, big }: { position: [number, number, number]; big: boolean }) {
  const grp = useRef<Group>(null);
  const start = useRef(0);
  const pending = useRef(true);
  const drops = useMemo(() => Array.from({ length: big ? 12 : 7 }, (_, i) => {
    const a = (i / (big ? 12 : 7)) * Math.PI * 2 + (i % 2) * 0.4;
    return { a, r: 0.14 + (i % 3) * 0.06, vy: 0.5 + (i % 4) * 0.2 };
  }), [big]);
  useFrame(({ clock }) => {
    if (pending.current) { start.current = clock.elapsedTime; pending.current = false; }
    const t = clock.elapsedTime - start.current;
    const p = Math.min(1, t / 0.5);
    if (grp.current) {
      grp.current.scale.setScalar(0.4 + p * (big ? 1.9 : 1.3));
      grp.current.visible = p < 1;
      grp.current.children.forEach((c, i) => { c.position.y = (drops[i]?.vy ?? 0.5) * p * 0.5 - p * p * 0.6; });
      (grp.current.children[0] as THREE.Mesh | undefined);
    }
  });
  return (
    <group ref={grp} position={position}>
      {drops.map((d, i) => (
        <mesh key={i} position={[Math.cos(d.a) * d.r, 0, Math.sin(d.a) * d.r]}>
          <sphereGeometry args={[0.028, 6, 6]} />
          <meshBasicMaterial color="#8e1c12" transparent opacity={0.85} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** A dark blood stain that pools under a fighter, deepening as wounds mount. */
function WoundStain({ x, wounds }: { x: number; wounds: number }) {
  const opacity = Math.min(0.6, wounds * 0.12);
  const scale = 0.4 + Math.min(1, wounds * 0.16);
  if (wounds <= 0) return null;
  return (
    <mesh position={[x, 0.03, 0.1]} rotation={[-Math.PI / 2, 0, 0]} scale={[scale, scale, scale]}>
      <circleGeometry args={[0.55, 20]} />
      <meshBasicMaterial color="#4a0f08" transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

// ─── 名將終結技 (signature finisher) — a colour-keyed crescent sweep on a kill ─
const FINISHER: Record<string, { color: string }> = {
  'guan-yu': { color: '#3aa05a' }, 'zhang-fei': { color: '#d04030' }, 'zhao-yun': { color: '#e0e0f0' },
  'lu-bu': { color: '#caa64a' }, 'ma-chao': { color: '#d8c0a0' }, 'dian-wei': { color: '#a03020' },
  'xu-chu': { color: '#c08040' }, 'huang-zhong': { color: '#e0b040' }, 'gan-ning': { color: '#40a0d0' },
  'zhang-liao': { color: '#b85020' }, 'taishi-ci': { color: '#50a0b8' }, 'sun-ce': { color: '#d0b040' },
};

// 名將終結動作 — the signature motion a famous warrior delivers the killing blow
// with, drawn from the existing clip pool (no new assets). This map is also the
// slot for real per-officer mocap finishers: point an id at a dedicated clip key
// once it's added to the pack and it plays here automatically.
const SIGNATURE_FINISH: Record<string, DuelAnim> = {
  'guan-yu': 'cleave', 'zhang-fei': 'thrust', 'zhao-yun': 'thrust', 'ma-chao': 'thrust',
  'lu-bu': 'power', 'dian-wei': 'power', 'xu-chu': 'power', 'huang-zhong': 'slash',
  'gan-ning': 'slash', 'taishi-ci': 'slash', 'zhang-liao': 'cleave', 'sun-ce': 'thrust',
};
function FinisherArc({ position, color }: { position: [number, number, number]; color: string }) {
  const ring = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const start = useRef(0);
  const pending = useRef(true);
  useFrame(({ clock }) => {
    if (pending.current) { start.current = clock.elapsedTime; pending.current = false; }
    const t = clock.elapsedTime - start.current;
    const p = Math.min(1, t / 0.55);
    if (ring.current) { const s = 0.3 + p * 3.2; ring.current.scale.set(s, s, s); ring.current.rotation.z = p * 2.4; ring.current.visible = p < 1; }
    if (mat.current) mat.current.opacity = (1 - p) * 0.9;
  });
  return (
    <mesh ref={ring} position={position} rotation={[Math.PI / 2.6, 0, 0]}>
      <torusGeometry args={[0.5, 0.06, 8, 32, Math.PI * 1.3]} />
      <meshBasicMaterial ref={mat} color={color} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

// ─── 拍照模式 (photo mode) — free-orbit the frozen scene for a screenshot ─────
function PhotoControls() {
  return <OrbitControls enablePan={false} minDistance={1.6} maxDistance={8} target={[0, 1.1, 0]} maxPolarAngle={Math.PI * 0.52} />;
}

// ─────────────────────────── arena scene + shell ───────────────────────────

export interface DuelArenaEvent extends DuelRoundFx { key: number }

/** 團戰同場 — an extra fighter beyond the principals, staged at a flank slot.
 *  The host drives each one's animation/state; `gone` empties the slot. */
export interface ArenaExtra {
  officer: Officer;
  name: string;
  anim?: DuelAnim;
  stamp?: number;
  gone?: boolean;
}
/** Flank slots for team extras (index-keyed), mirrored for the right side. */
const EXTRA_SLOTS: Array<[number, number]> = [[-1.85, 0.95], [-1.85, -0.95], [-2.6, 0]];
function extraSlot(side: 'left' | 'right', i: number): [number, number] {
  const [x, z] = EXTRA_SLOTS[Math.min(i, EXTRA_SLOTS.length - 1)];
  return side === 'left' ? [x, z] : [-x, z];
}

/** Keeps a bad asset (e.g. an FBX FBXLoader can't parse) from crashing the whole
 *  game — the 3D arena just disappears and the duel plays on in the 2D panel. */
class ArenaErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.warn('[DuelArena3D] 3D scene disabled after a load error:', err); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Scene({
  left, right, leftName, rightName, leftClass, rightClass, shakeKey, big, timeScale, spark, killKey, killX,
  look, terrain, blood, leftWounds, rightWounds, finisher, photo, leftMount, rightMount, exploitFx, leftGone, rightGone,
  leftExtras, rightExtras,
}: {
  left: FighterAction; right: FighterAction; leftName: string; rightName: string;
  leftClass: WeaponClass; rightClass: WeaponClass; shakeKey: number; big: boolean;
  timeScale: number; spark: { key: number; x: number; killed: boolean; heavy: boolean } | null; killKey: number; killX: number;
  look: TerrainLook; terrain: DuelTerrain; blood: { key: number; x: number; big: boolean } | null;
  leftWounds: number; rightWounds: number; finisher: { key: number; x: number; color: string } | null; photo: boolean;
  leftMount: { body: string } | null; rightMount: { body: string } | null;
  /** 環境借勢 — terrain-gambit burst FX at the struck foe. */
  exploitFx: { key: number; x: number; terrain: DuelTerrain } | null;
  /** 落荒而逃 — a fled fighter has left the arena (stop rendering them). */
  leftGone: boolean; rightGone: boolean;
  /** 團戰同場 — flanking teammates beyond the principals (§6.11). */
  leftExtras?: ArenaExtra[]; rightExtras?: ArenaExtra[];
}) {
  const wet = look.weather === 'rain' || look.weather === 'mud';
  const onBridge = terrain === 'bridge';
  return (
    <>
      {!photo && <CameraRig shakeKey={shakeKey} big={big} killKey={killKey} killX={killX} />}
      {photo && <PhotoControls />}
      {/* Dusk, torch-lit mood — low ambient so the torches and bloom carry it.
          The terrain shifts the key light's colour and the fill. */}
      <ambientLight intensity={look.ambient} />
      <hemisphereLight args={['#5a6b8a', '#2a1c10', 0.4]} />
      <directionalLight
        position={[3, 6, 4]} intensity={1.15} color={look.keyColor} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-4} shadow-camera-right={4}
        shadow-camera-top={4} shadow-camera-bottom={-4}
      />
      <directionalLight position={[-4, 3, -3]} intensity={0.35} color="#7088b0" />

      {/* 長坂橋 swaps the whole stage for a plank bridge over a river; every other
          terrain uses the circular drill-ground floor + themed arena wall. */}
      {onBridge ? (
        <BridgeStage />
      ) : (
        <>
          {/* arena floor — re-coloured per terrain (a wet sheen on rain/mud) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[4.5, 48]} />
            <meshStandardMaterial color={look.floor} roughness={wet ? 0.4 : 0.95} metalness={wet ? 0.3 : 0} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[4.3, 4.5, 48]} />
            <meshBasicMaterial color="#caa64a" transparent opacity={0.4} />
          </mesh>
          <ContactShadows position={[0, 0.02, 0]} opacity={0.5} scale={6} blur={2.2} far={3} />
          <ArenaStage tint={[RED, BLUE]} />
        </>
      )}
      <StageProps knockKey={killKey} knockX={killX} />
      <Weather kind={look.weather} />

      {/* 伤痕 — blood pools deepen beneath each fighter as they take wounds. */}
      <WoundStain x={-0.95} wounds={leftWounds} />
      <WoundStain x={0.95} wounds={rightWounds} />

      {/* 坐騎 — a famed-mount general's steed waits at their side. */}
      {leftMount && <WarHorse x={-2.15} faceRight body={leftMount.body} cloth={RED} />}
      {rightMount && <WarHorse x={2.15} faceRight={false} body={rightMount.body} cloth={BLUE} />}

      {!leftGone && <Fighter side="left" tunic={RED} action={left} name={leftName} weaponClass={leftClass} timeScale={timeScale} />}
      {!rightGone && <Fighter side="right" tunic={BLUE} action={right} name={rightName} weaponClass={rightClass} timeScale={timeScale} />}
      {/* 團戰同場 — teammates hold the flank slots and fall where they stand. */}
      {(leftExtras ?? []).map((e, i) => !e.gone && (
        <Fighter key={`le-${e.officer.id}`} side="left" tunic={RED} pos={extraSlot('left', i)}
          action={{ anim: e.anim ?? 'idle', rot: i + 1, stamp: e.stamp ?? 0 }}
          name={e.name} weaponClass={weaponClassFor(e.officer)} timeScale={timeScale} />
      ))}
      {(rightExtras ?? []).map((e, i) => !e.gone && (
        <Fighter key={`re-${e.officer.id}`} side="right" tunic={BLUE} pos={extraSlot('right', i)}
          action={{ anim: e.anim ?? 'idle', rot: i + 3, stamp: e.stamp ?? 0 }}
          name={e.name} weaponClass={weaponClassFor(e.officer)} timeScale={timeScale} />
      ))}
      {spark && <HitSpark key={spark.key} position={[spark.x, 1.15, 0]} killed={spark.killed} heavy={spark.heavy} />}
      {blood && <BloodSpray key={`b${blood.key}`} position={[blood.x, 1.05, 0.1]} big={blood.big} />}
      {finisher && <FinisherArc key={`f${finisher.key}`} position={[finisher.x, 1.0, 0]} color={finisher.color} />}
      {exploitFx && <ExploitBurst key={`e${exploitFx.key}`} x={exploitFx.x} terrain={exploitFx.terrain} />}

      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.65} luminanceSmoothing={0.25} mipmapBlur />
        <Vignette offset={0.32} darkness={0.72} />
      </EffectComposer>
    </>
  );
}

/**
 * The arena. Feed it the latest exchange via `event` (a {@link DuelRoundFx} with
 * a monotonically increasing `key`) and it animates both fighters accordingly.
 */
export function DuelArena3D({
  attacker, defender, leftName, rightName, event, terrain = 'plain', leftExtras, rightExtras,
}: {
  attacker: Officer; defender: Officer; leftName: string; rightName: string;
  event: DuelArenaEvent | null; terrain?: DuelTerrain;
  /** 團戰同場 (§6.11) — flanking teammates beyond the principals; the host drives
   *  each one's anim/gone state (a downed teammate falls where they stand). */
  leftExtras?: ArenaExtra[]; rightExtras?: ArenaExtra[];
}) {
  // Each officer's 3D weapon (drives both the pack and the hand mesh).
  const leftClass = useMemo(() => weaponClassFor(attacker), [attacker]);
  const rightClass = useMemo(() => weaponClassFor(defender), [defender]);
  // 坐騎 — a general who rode in on a famed steed gets it staged at their side.
  const leftMount = useMemo(() => mountColors(attacker), [attacker]);
  const rightMount = useMemo(() => mountColors(defender), [defender]);
  const look = TERRAIN_LOOK[terrain] ?? TERRAIN_LOOK.plain;
  const idle = (): FighterAction => ({ anim: 'idle', rot: 0, stamp: 0 });
  const [left, setLeft] = useState<FighterAction>(idle);
  const [right, setRight] = useState<FighterAction>(idle);
  const [shakeKey, setShakeKey] = useState(0);
  const [big, setBig] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [spark, setSpark] = useState<{ key: number; x: number; killed: boolean; heavy: boolean } | null>(null);
  const [killKey, setKillKey] = useState(0);
  const [killX, setKillX] = useState(0);
  // 伤痕 — accumulated wounds per side; blood spray on a telling blow.
  const [leftWounds, setLeftWounds] = useState(0);
  const [rightWounds, setRightWounds] = useState(0);
  const [blood, setBlood] = useState<{ key: number; x: number; big: boolean } | null>(null);
  // 名將終結技 — a colour-keyed crescent on the kill.
  const [finisher, setFinisher] = useState<{ key: number; x: number; color: string } | null>(null);
  // 挑落下馬 — which side has been unhorsed (their steed bolts off the arena).
  const [unhorsedSides, setUnhorsedSides] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  // 環境借勢 — the terrain gambit's burst FX at the struck foe.
  const [exploitFx, setExploitFx] = useState<{ key: number; x: number; terrain: DuelTerrain } | null>(null);
  // 落荒而逃 — a broken fighter bolts; their side empties out of the arena.
  const [goneSides, setGoneSides] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  // 拍照模式 — freeze + free-orbit for a screenshot.
  const [photo, setPhoto] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastKey = useRef(0);

  useEffect(() => {
    if (!event || event.key === lastKey.current) return;
    lastKey.current = event.key;
    const k = event.key;
    const { hit, killed, aMove, dMove, over, winner, disarm, ult, unhorsed, exploit, dismount, fate } = event;
    // 棄馬步戰 — a calm, voluntary step down: the steed walks off (no crash, no
    // spark) and the bout carries on afoot. Handled apart from the strike flow.
    if (dismount) {
      if (dismount === 'attacker') setUnhorsedSides((s) => ({ ...s, left: true }));
      else setUnhorsedSides((s) => ({ ...s, right: true }));
      playSfx('whoosh');
      return;
    }
    // 挑落下馬 — the unhorsed rider's steed bolts off; mark the side so the arena
    // stops rendering their horse (and a knock jolts the camera).
    if (unhorsed === 'attacker') setUnhorsedSides((s) => ({ ...s, left: true }));
    if (unhorsed === 'defender') setUnhorsedSides((s) => ({ ...s, right: true }));
    // 環境借勢 — the terrain bursts on the struck foe in its own colour.
    if (exploit) setExploitFx({ key: event.key, x: hit === 'a' ? -0.95 : 0.95, terrain: exploit });
    // 必殺技分型 — each signature finisher sweeps its own colour-keyed crescent:
    // 拖刀計 blood-red, 七進七出 azure, 無雙/斷橋 violet, 百步穿楊 gold, 奮命 amber.
    const ULT_COLOR: Record<string, string> = {
      feint: '#ff3a2c', multi: '#4ab4ff', sunder: '#b86aff', volley: '#ffcf4a', power: '#ffa84a',
    };

    const leftDied = killed && winner === 'defender';
    const rightDied = killed && winner === 'attacker';
    // The 氣-spending strikes (奮/連擊/突刺) hit heavy — they earn the wardrum,
    // the screen shake and the slow-mo punch.
    const heavy = (m?: string) => m === 'power' || m === 'combo' || m === 'thrust';
    const isDef = (m?: string) => m === 'guard' || m === 'dodge' || m === 'parry';
    const landed = hit === 'a' || hit === 'd' || hit === 'both';

    // 音效 — synthesized stings keyed to what happened this exchange.
    if (killed) { playSfx('crash'); window.setTimeout(() => playSfx('dirge'), 220); }
    else if (disarm) { playSfx('forge'); window.setTimeout(() => playSfx('whoosh'), 120); } // weapon clatters away
    else if (aMove === 'taunt' || dMove === 'taunt') { playSfx('shout'); window.setTimeout(() => playSfx('wardrum'), 90); }
    else if (heavy(aMove) || heavy(dMove)) { playSfx('wardrum'); if (landed) window.setTimeout(() => playSfx('thud'), 110); }
    else if (landed) { playSfx('sword'); window.setTimeout(() => playSfx('thud'), 70); }
    else if (aMove === 'dodge' || dMove === 'dodge') playSfx('whoosh');
    else if (isDef(aMove) || isDef(dMove)) playSfx('forge'); // blade turned aside — a clang
    else playSfx('sword');

    // Strike spark at the struck fighter (left −0.95, right +0.95, clash centre).
    setSpark({ key: k, x: hit === 'a' ? -0.95 : hit === 'd' ? 0.95 : 0, killed: !!killed, heavy: heavy(aMove) || heavy(dMove) });

    // 伤痕/血迹 — a single-sided telling blow draws blood + deepens that side's
    // wound stain (a mutual clash/block doesn't). A kill throws a big spray.
    const woundSide: 'left' | 'right' | null = killed ? (leftDied ? 'left' : 'right') : hit === 'a' ? 'left' : hit === 'd' ? 'right' : null;
    if (woundSide) {
      setBlood({ key: k, x: woundSide === 'left' ? -0.95 : 0.95, big: !!killed || heavy(aMove) || heavy(dMove) });
      if (woundSide === 'left') setLeftWounds((w) => w + 1); else setRightWounds((w) => w + 1);
    }

    // Each duel move name is also an animation name, so a fighter plays their
    // chosen move — unless they were hit (flinch) or cut down (fall).
    const animFor = (
      mine: typeof aMove, wasHit: boolean, died: boolean,
    ): DuelAnim => {
      if (died) return 'death';
      if (wasHit) return 'hit';
      return (mine ?? 'idle') as DuelAnim;
    };
    let leftAnim = animFor(aMove, hit === 'a', leftDied);
    let rightAnim = animFor(dMove, hit === 'd', rightDied);
    // 缴械 — the parrier plays the disarming motion; the victim recoils.
    if (!killed && disarm === 'attacker') { leftAnim = 'hit'; rightAnim = 'disarm'; }
    else if (!killed && disarm === 'defender') { rightAnim = 'hit'; leftAnim = 'disarm'; }
    // 名將終結動作 — the victor strikes the killing blow with their own signature
    // motion (the loser already plays 'death' via animFor).
    if (killed && rightDied) leftAnim = SIGNATURE_FINISH[attacker.id] ?? leftAnim;
    else if (killed && leftDied) rightAnim = SIGNATURE_FINISH[defender.id] ?? rightAnim;
    // `rot` picks which clip from the anim's pool (each fighter resolves it
    // against its own pack); the right fighter is offset by 2 so a mutual clash
    // shows two different strikes. `stamp` (= k) retriggers the animation.
    const act = (anim: DuelAnim, rot: number, stamp = k): FighterAction => ({ anim, rot, stamp });

    setLeft(act(leftAnim, k));
    setRight(act(rightAnim, k + 2));
    setBig(heavy(aMove) || heavy(dMove) || killed || !!disarm);
    setShakeKey((s) => s + 1);

    // 必殺 — a landed heavy strike (奮/連擊/突刺) gets a brief slow-mo punch.
    if (!killed && (heavy(aMove) || heavy(dMove)) && landed) {
      setTimeScale(0.5);
      window.setTimeout(() => setTimeScale(1), 600);
    }

    // Finishing blow — killcam push-in on the slain fighter + slow motion + the
    // winner's 名將終結技 crescent (colour-keyed to the victor, faction-tinted
    // for the rank and file).
    if (killed) {
      const slainX = leftDied ? -0.95 : 0.95;
      const victorId = winner === 'attacker' ? attacker.id : defender.id;
      // A finishing 必殺技 sweeps in its own kind-keyed colour; else the victor's.
      const color = (ult && ULT_COLOR[ult.kind]) ?? FINISHER[victorId]?.color ?? (winner === 'attacker' ? RED : BLUE);
      setKillX(slainX);
      setKillKey((s) => s + 1);
      setFinisher({ key: k, x: slainX, color });
      setTimeScale(0.32);
      const tid = window.setTimeout(() => setTimeScale(1), 1300);
      return () => window.clearTimeout(tid);
    }
    // 必殺技未斃敵 — an unleashed finisher that didn't kill still gets the full
    // cinematic beat: its colour-keyed crescent sweeps the foe, the camera kicks,
    // and a half-speed punch lets the blow land (so every 必殺技 reads in 3D).
    if (ult && !killed) {
      const foeX = ult.side === 'attacker' ? 0.95 : -0.95;
      setFinisher({ key: k, x: foeX, color: ULT_COLOR[ult.kind] ?? '#ffa84a' });
      setBig(true);
      setShakeKey((s) => s + 1);
      playSfx('crash');
      setTimeScale(0.45);
      const tid = window.setTimeout(() => setTimeScale(1), 700);
      return () => window.clearTimeout(tid);
    }

    // On a points finish (no kill), strike a victory pose a beat later. 怯戰 —
    // a broken loser 請降 (drops their guard, the victor flourishes) or 落荒而逃
    // (bolts from the arena in a puff of dust, like the steed before them).
    if (over && winner && winner !== 'draw') {
      const loserIsLeft = winner === 'defender';
      const tids: number[] = [];
      if (fate === 'flee') {
        playSfx('whoosh');
        tids.push(window.setTimeout(() => {
          // a dust burst covers the exit; the fled side empties out.
          setExploitFx({ key: k + 7, x: loserIsLeft ? -0.95 : 0.95, terrain: 'plain' });
          setGoneSides((s) => (loserIsLeft ? { ...s, left: true } : { ...s, right: true }));
        }, 700));
      } else if (fate === 'yield') {
        // 請降 — the beaten fighter stands down; a calm bell, no blood.
        tids.push(window.setTimeout(() => playSfx('bell'), 300));
      }
      tids.push(window.setTimeout(() => {
        if (winner === 'attacker') setLeft(act('victory', k, k + 1));
        else setRight(act('victory', k + 1, k + 1));
      }, 850));
      return () => tids.forEach((tid) => window.clearTimeout(tid));
    }
  }, [event]);

  const capture = () => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    try {
      const url = canvas.toDataURL('image/png');
      const stamp = `${leftName}-vs-${rightName}`.replace(/[^\w一-龥-]/g, '');
      const nav = navigator as Navigator & { share?: (d: { files?: File[]; title?: string }) => Promise<void>; canShare?: (d: { files: File[] }) => boolean };
      const blob = dataUrlToBlob(url);
      const file = blob ? new File([blob], `duel-${stamp}.png`, { type: 'image/png' }) : null;
      if (file && nav.canShare?.({ files: [file] }) && nav.share) {
        nav.share({ files: [file], title: 'Three Kingdom Masters' }).catch(() => undefined);
      } else {
        const a = document.createElement('a');
        a.href = url; a.download = `duel-${stamp}.png`; a.click();
      }
      setToast('📸');
      window.setTimeout(() => setToast(null), 1200);
    } catch { /* tainted canvas / unsupported — ignore */ }
  };

  return (
    <ArenaErrorBoundary>
      <div ref={wrapRef} style={{ position: 'fixed', inset: 0, zIndex: 120 }}>
        <Canvas
          shadows dpr={[1, 1.8]}
          camera={{ position: [0, 1.55, 4.0], fov: 38, near: 0.1, far: 100 }}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
        >
          {/* atmospheric backdrop — terrain-tinted */}
          <color attach="background" args={[look.bg]} />
          <fog attach="fog" args={[look.bg, look.fog[0], look.fog[1]]} />
          <Suspense fallback={null}>
            <Scene
              left={left} right={right}
              leftName={leftName} rightName={rightName}
              leftClass={leftClass} rightClass={rightClass}
              timeScale={photo ? 0 : timeScale} spark={spark} killKey={killKey} killX={killX}
              shakeKey={shakeKey} big={big}
              look={look} terrain={terrain} blood={blood} leftWounds={leftWounds} rightWounds={rightWounds} finisher={finisher} photo={photo}
              leftMount={unhorsedSides.left ? null : leftMount} rightMount={unhorsedSides.right ? null : rightMount}
              exploitFx={exploitFx} leftGone={goneSides.left} rightGone={goneSides.right}
              leftExtras={leftExtras} rightExtras={rightExtras}
            />
          </Suspense>
        </Canvas>

        {/* 鏡頭/拍照 — toggle a frozen free-orbit photo mode + capture a card. */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 121 }}>
          <button
            onClick={() => setPhoto((p) => !p)}
            title="Photo mode"
            style={photoBtn(photo ? '#e6c473' : '#5a6470', photo ? '#f2dd9a' : '#c8d0d8')}
          >{photo ? '▶' : '📷'}</button>
          {photo && <button onClick={capture} title="Capture" style={photoBtn('#6aae73', '#cfe8c8')}>⬇</button>}
        </div>
        {toast && <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 121, color: '#fff', fontSize: 22 }}>{toast}</div>}
      </div>
    </ArenaErrorBoundary>
  );
}

function photoBtn(border: string, color: string): React.CSSProperties {
  return {
    width: 34, height: 30, borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer',
    background: 'rgba(20,28,38,0.86)', border: `1px solid ${border}`, color, fontSize: 14,
  };
}

function dataUrlToBlob(url: string): Blob | null {
  try {
    const [head, body] = url.split(',');
    const mime = head.match(/:(.*?);/)?.[1] ?? 'image/png';
    const bin = atob(body);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch { return null; }
}

// Preload both packs when enabled so the first bout opens smoothly.
if (DUEL_ASSETS_READY) {
  for (const p of Object.values(DUEL_PACKS)) useLoader.preload(ASSET_LOADER, p.urls);
}
