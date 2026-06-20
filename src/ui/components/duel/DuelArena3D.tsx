import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { ContactShadows, Html, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Group } from 'three';
import type { Officer } from '../../../game/types';
import type { DuelRoundFx } from '../DuelGameModal';
import { weaponClassFor, weaponIsTwoHanded, type WeaponClass } from '../../../game/systems/duel';
import { playSfx } from '../../../game/systems/sound';
import {
  DUEL_ASSETS_READY, DUEL_FORMAT, DUEL_PACKS, type DuelAnim, type DuelPackId,
} from './duelAssets';

const packForClass = (c: WeaponClass): DuelPackId => (weaponIsTwoHanded(c) ? 'great' : 'sword');

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

function ProceduralFighter({
  tunic, action,
}: { tunic: string; action: FighterAction }) {
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
          {/* blade */}
          <mesh position={[0.18, -0.62, 0]} castShadow>
            <boxGeometry args={[0.05, 0.7, 0.02]} />
            <meshStandardMaterial color={STEEL} roughness={0.25} metalness={0.85} />
          </mesh>
          {/* guard + grip */}
          <mesh position={[0.18, -0.28, 0]} castShadow>
            <boxGeometry args={[0.16, 0.04, 0.05]} />
            <meshStandardMaterial color={'#caa64a'} metalness={0.7} roughness={0.3} />
          </mesh>
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
  side, tunic, action, name, weaponClass, timeScale,
}: { side: 'left' | 'right'; tunic: string; action: FighterAction; name: string; weaponClass: WeaponClass; timeScale: number }) {
  const x = side === 'left' ? -0.95 : 0.95;
  // Procedural model is authored facing +X; the right fighter turns to face it.
  const rotY = side === 'left' ? 0 : Math.PI;
  return (
    <group position={[x, 0, 0]} rotation={[0, rotY, 0]}>
      {DUEL_ASSETS_READY
        ? <RealFighter action={action} pack={packForClass(weaponClass)} weaponClass={weaponClass} tint={tunic} timeScale={timeScale} />
        : <ProceduralFighter tunic={tunic} action={action} />}
      {/* faction ring underfoot */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.46, 32]} />
        <meshBasicMaterial color={tunic} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0, 2.0, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#fff', background: 'rgba(0,0,0,0.45)', padding: '1px 7px', borderRadius: 4,
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

/** A brief spark/flash burst at a struck fighter. Remount via `key` to replay. */
function HitSpark({ position, killed }: { position: [number, number, number]; killed: boolean }) {
  const ref = useRef<Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const start = useRef(0);
  const pending = useRef(true);
  useFrame(({ clock }) => {
    const g = ref.current; if (!g) return;
    if (pending.current) { start.current = clock.elapsedTime; pending.current = false; }
    const t = clock.elapsedTime - start.current;
    const dur = killed ? 0.55 : 0.3;
    const p = Math.min(1, t / dur);
    g.scale.setScalar(0.12 + p * (killed ? 0.85 : 0.5));
    g.visible = p < 1;
    if (mat.current) mat.current.opacity = (1 - p) * 0.9;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial ref={mat} color={killed ? '#ff5a3c' : '#ffe6a0'} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
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

/** Backdrop wall, banners, torches, onlookers and drifting dust. */
function ArenaStage() {
  const banners: Array<{ position: [number, number, number]; color: string; rot: number }> = useMemo(() => {
    const cols = ['#b8442e', '#3a7dd9', '#caa64a', '#5a8f4a'];
    return Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      return { position: [Math.cos(a) * 4.2, 0, Math.sin(a) * 4.2] as [number, number, number], color: cols[i % cols.length], rot: -a + Math.PI / 2 };
    });
  }, []);
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

// ─────────────────────────── arena scene + shell ───────────────────────────

export interface DuelArenaEvent extends DuelRoundFx { key: number }

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
}: {
  left: FighterAction; right: FighterAction; leftName: string; rightName: string;
  leftClass: WeaponClass; rightClass: WeaponClass; shakeKey: number; big: boolean;
  timeScale: number; spark: { key: number; x: number; killed: boolean } | null; killKey: number; killX: number;
}) {
  return (
    <>
      <CameraRig shakeKey={shakeKey} big={big} killKey={killKey} killX={killX} />
      {/* Dusk, torch-lit mood — low ambient so the torches and bloom carry it. */}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#5a6b8a', '#2a1c10', 0.4]} />
      <directionalLight
        position={[3, 6, 4]} intensity={1.15} color="#ffe0b0" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-4} shadow-camera-right={4}
        shadow-camera-top={4} shadow-camera-bottom={-4}
      />
      <directionalLight position={[-4, 3, -3]} intensity={0.35} color="#7088b0" />

      {/* arena floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.5, 48]} />
        <meshStandardMaterial color="#3c352a" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[4.3, 4.5, 48]} />
        <meshBasicMaterial color="#caa64a" transparent opacity={0.4} />
      </mesh>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.5} scale={6} blur={2.2} far={3} />

      <ArenaStage />

      <Fighter side="left" tunic={RED} action={left} name={leftName} weaponClass={leftClass} timeScale={timeScale} />
      <Fighter side="right" tunic={BLUE} action={right} name={rightName} weaponClass={rightClass} timeScale={timeScale} />
      {spark && <HitSpark key={spark.key} position={[spark.x, 1.15, 0]} killed={spark.killed} />}

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
  attacker, defender, leftName, rightName, event,
}: {
  attacker: Officer; defender: Officer; leftName: string; rightName: string;
  event: DuelArenaEvent | null;
}) {
  // Each officer's 3D weapon (drives both the pack and the hand mesh).
  const leftClass = useMemo(() => weaponClassFor(attacker), [attacker]);
  const rightClass = useMemo(() => weaponClassFor(defender), [defender]);
  const idle = (): FighterAction => ({ anim: 'idle', rot: 0, stamp: 0 });
  const [left, setLeft] = useState<FighterAction>(idle);
  const [right, setRight] = useState<FighterAction>(idle);
  const [shakeKey, setShakeKey] = useState(0);
  const [big, setBig] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [spark, setSpark] = useState<{ key: number; x: number; killed: boolean } | null>(null);
  const [killKey, setKillKey] = useState(0);
  const [killX, setKillX] = useState(0);
  const lastKey = useRef(0);

  useEffect(() => {
    if (!event || event.key === lastKey.current) return;
    lastKey.current = event.key;
    const k = event.key;
    const { hit, killed, aMove, dMove, over, winner } = event;

    const leftDied = killed && winner === 'defender';
    const rightDied = killed && winner === 'attacker';

    // 音效 — synthesized stings keyed to what happened this exchange.
    const isDef = (m?: string) => m === 'guard' || m === 'dodge' || m === 'parry';
    const landed = hit === 'a' || hit === 'd' || hit === 'both';
    if (killed) { playSfx('crash'); window.setTimeout(() => playSfx('dirge'), 220); }
    else if (aMove === 'power' || dMove === 'power') { playSfx('wardrum'); if (landed) window.setTimeout(() => playSfx('thud'), 110); }
    else if (landed) { playSfx('sword'); window.setTimeout(() => playSfx('thud'), 70); }
    else if (aMove === 'dodge' || dMove === 'dodge') playSfx('whoosh');
    else if (isDef(aMove) || isDef(dMove)) playSfx('forge'); // blade turned aside — a clang
    else playSfx('sword');

    // Strike spark at the struck fighter (left −0.95, right +0.95, clash centre).
    setSpark({ key: k, x: hit === 'a' ? -0.95 : hit === 'd' ? 0.95 : 0, killed: !!killed });

    // Each duel move name is also an animation name, so a fighter plays their
    // chosen move — unless they were hit (flinch) or cut down (fall).
    const animFor = (
      mine: typeof aMove, wasHit: boolean, died: boolean,
    ): DuelAnim => {
      if (died) return 'death';
      if (wasHit) return 'hit';
      return (mine ?? 'idle') as DuelAnim;
    };
    // `rot` picks which clip from the anim's pool (each fighter resolves it
    // against its own pack); the right fighter is offset by 2 so a mutual clash
    // shows two different strikes. `stamp` (= k) retriggers the animation.
    const act = (anim: DuelAnim, rot: number, stamp = k): FighterAction => ({ anim, rot, stamp });

    setLeft(act(animFor(aMove, hit === 'a', leftDied), k));
    setRight(act(animFor(dMove, hit === 'd', rightDied), k + 2));
    setBig(aMove === 'power' || dMove === 'power' || killed);
    setShakeKey((s) => s + 1);

    // 必殺 — a landed Overpower gets a brief slow-mo punch even without a kill.
    if (!killed && (aMove === 'power' || dMove === 'power') && landed) {
      setTimeScale(0.5);
      window.setTimeout(() => setTimeScale(1), 600);
    }

    // Finishing blow — killcam push-in on the slain fighter + slow motion.
    if (killed) {
      setKillX(leftDied ? -0.95 : 0.95);
      setKillKey((s) => s + 1);
      setTimeScale(0.32);
      const tid = window.setTimeout(() => setTimeScale(1), 1300);
      return () => window.clearTimeout(tid);
    }

    // On a points finish (no kill), strike a victory pose a beat later.
    if (over && winner && winner !== 'draw') {
      const tid = window.setTimeout(() => {
        if (winner === 'attacker') setLeft(act('victory', k, k + 1));
        else setRight(act('victory', k + 1, k + 1));
      }, 850);
      return () => window.clearTimeout(tid);
    }
  }, [event]);

  return (
    <ArenaErrorBoundary>
      <div style={{ position: 'fixed', inset: 0, zIndex: 120 }}>
        <Canvas
          shadows dpr={[1, 1.8]}
          camera={{ position: [0, 1.55, 4.0], fov: 38, near: 0.1, far: 100 }}
          gl={{ antialias: true }}
        >
          {/* atmospheric backdrop */}
          <color attach="background" args={['#14110c']} />
          <fog attach="fog" args={['#14110c', 7, 16]} />
          <Suspense fallback={null}>
            <Scene
              left={left} right={right}
              leftName={leftName} rightName={rightName}
              leftClass={leftClass} rightClass={rightClass}
              timeScale={timeScale} spark={spark} killKey={killKey} killX={killX}
              shakeKey={shakeKey} big={big}
            />
          </Suspense>
        </Canvas>
      </div>
    </ArenaErrorBoundary>
  );
}

// Preload both packs when enabled so the first bout opens smoothly.
if (DUEL_ASSETS_READY) {
  for (const p of Object.values(DUEL_PACKS)) useLoader.preload(ASSET_LOADER, p.urls);
}
