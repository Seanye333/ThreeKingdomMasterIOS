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
import type { DebateRoundFx } from '../DebateGameModal';
import type { DebateMove } from '../../../game/systems/wordWar';
import { playSfx } from '../../../game/systems/sound';
import { DEBATE_ASSETS_READY, DEBATE_FORMAT, DEBATE_PACK, type DebateAnim } from './debateAssets';

/**
 * 寫實舌戰朝堂 — a self-contained 3D hall that stages a war of words between two
 * strategists. It runs NO debate logic: a host feeds it each exchange's {@link
 * DebateRoundFx} from {@link DebateGameModal} via the `event` prop, and the
 * hall translates the exchange into the matching declamation / mockery / recoil
 * animations, a flying 字 (the winning argument), and an ink-splash on the mind
 * that lost composure.
 *
 * Rendering has two backends, chosen by {@link DEBATE_ASSETS_READY}:
 *  - realistic: a rigged Mixamo character animated with Pro-Magic-Pack casts
 *    (read as oratory) + Gestures-Pack body language;
 *  - fallback: a built-in procedural scholar, so the feature runs with no assets.
 */

const ME = '#5aa45a';    // the player / challenger (left) — 青衫
const FOE = '#b070b8';   // the opponent (right) — 紫袍
const SKIN = '#e0c498';
const INK = '#15131b';

// The 字 that flashes for each argument (matches DebateGameModal's labels).
const MOVE_GLYPH: Record<DebateMove, string> = { assert: '論', retort: '駁', provoke: '諷', press: '詰' };

// Approximate clip lengths (seconds) for the procedural fallback, which has no
// real clip to read a duration from. The realistic backend uses each Mixamo
// clip's own duration via the mixer's 'finished' event.
const PROC_SECONDS: Partial<Record<DebateAnim, number>> = {
  assert: 1.1, retort: 0.9, provoke: 1.0, press: 1.3,
  flinch: 0.7, recoil: 0.9, rout: 1.5, win: 1.6,
};
const PROC_DECLAIM: DebateAnim[] = ['assert', 'press'];
const PROC_GESTURE: DebateAnim[] = ['retort', 'provoke'];

// Which animation each scholar should currently be playing. `rot` selects which
// clip from the anim's pool; `stamp` bumps to retrigger the same anim.
type ScholarAction = { anim: DebateAnim; rot: number; stamp: number };

// ─────────────────────────── procedural fallback scholar ───────────────────
// A robed figure built facing +X (toward the opponent). The host mirrors the
// right scholar by rotating the whole group 180° about Y.

function ProceduralScholar({ robe, action }: { robe: string; action: ScholarAction }) {
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const gestureArm = useRef<Group>(null);
  const sleeve = useRef<Group>(null);
  const start = useRef(0);
  const pending = useRef(true);
  useEffect(() => { pending.current = true; }, [action.stamp, action.anim]);

  useFrame(({ clock }) => {
    const g = root.current; if (!g) return;
    const now = clock.elapsedTime;
    if (pending.current) { start.current = now; pending.current = false; }
    const t = now - start.current;
    const anim = action.anim;

    const breathe = Math.sin(now * 2.0) * 0.018;
    let px = 0, py = 0, rz = 0, lean = 0;
    let arm = -0.3 + Math.sin(now * 1.6) * 0.04;   // sleeve at rest
    const dur = PROC_SECONDS[anim] ?? 0.9;
    const p = Math.min(1, t / dur);
    const arc = Math.sin(p * Math.PI);
    const easeOut = 1 - (1 - p) * (1 - p);
    const settled = t >= dur && anim !== 'idle' && anim !== 'rout' && anim !== 'win';

    if (settled) {
      // hold idle defaults
    } else if (PROC_DECLAIM.includes(anim)) {
      arm = THREE.MathUtils.lerp(-0.3, -1.9, easeOut);  // sweep an arm forward/up
      px = arc * (anim === 'press' ? 0.34 : 0.16);       // step in to press
      lean = arc * (anim === 'press' ? 0.2 : 0.12);
    } else if (PROC_GESTURE.includes(anim)) {
      arm = -0.3 + Math.sin(p * Math.PI * 3) * 0.5;      // a dismissive flick
      lean = anim === 'provoke' ? arc * -0.12 : 0;        // lean back, cocky
      rz = Math.sin(p * Math.PI * 4) * 0.05;
    } else if (anim === 'flinch') {
      px = -arc * 0.12; lean = -arc * 0.14; rz = -arc * 0.1;
    } else if (anim === 'recoil') {
      px = -arc * 0.28; lean = -arc * 0.24; rz = -arc * 0.18;
    } else if (anim === 'rout') {
      const d = easeOut;
      px = -d * 0.4; rz = -d * 0.5; lean = -d * 0.4; py = -d * 0.12;
    } else if (anim === 'win') {
      arm = -1.6 + Math.sin(now * 3) * 0.1;
      py = Math.abs(Math.sin(now * 2.5)) * 0.03;
    }

    g.position.x = px; g.position.y = py; g.rotation.z = rz;
    if (torso.current) { torso.current.rotation.z = lean; torso.current.position.y = 0.92 + breathe; }
    if (gestureArm.current) gestureArm.current.rotation.z = arm;
    if (sleeve.current) sleeve.current.rotation.z = arm * 0.6;
  });

  return (
    <group ref={root}>
      {/* long robe skirt */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.34, 0.86, 12]} />
        <meshStandardMaterial color={robe} roughness={0.75} />
      </mesh>
      <group ref={torso} position={[0, 0.92, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.17, 0.2, 0.5, 10]} />
          <meshStandardMaterial color={robe} roughness={0.65} />
        </mesh>
        {/* crossed-collar sash */}
        <mesh position={[0, 0.06, 0.02]} rotation={[0, 0, 0.5]} castShadow>
          <boxGeometry args={[0.06, 0.46, 0.4]} />
          <meshStandardMaterial color="#efe7d2" roughness={0.6} />
        </mesh>
        {/* head + scholar's cap */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.54, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.12, 10]} />
          <meshStandardMaterial color="#23201a" roughness={0.7} />
        </mesh>
        {/* still left arm with hanging sleeve */}
        <mesh position={[0, 0.12, 0.2]} rotation={[0, 0, 0.2]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.5, 8]} />
          <meshStandardMaterial color={robe} roughness={0.7} />
        </mesh>
        {/* gesturing right arm (-Z) */}
        <group ref={gestureArm} position={[0, 0.2, -0.2]}>
          <mesh position={[0.1, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.07, 0.46, 8]} />
            <meshStandardMaterial color={robe} roughness={0.7} />
          </mesh>
          <group ref={sleeve}>
            <mesh position={[0.16, -0.44, 0]} castShadow>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.7} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

// ─────────────────────────── realistic Mixamo scholar ──────────────────────

const ASSET_LOADER = (DEBATE_FORMAT === 'fbx' ? FBXLoader : GLTFLoader) as unknown as new () => THREE.Loader;
// Mixamo rigs face +Z; turn the model to face +X (toward the opponent).
const MODEL_FACE_OFFSET = Math.PI / 2;

/** Tint the robe toward a side colour + add a sash so the two minds read apart
 *  (the base X Bot mesh is an identical grey otherwise). */
function applyRobe(root: THREE.Object3D, tint: string): void {
  const robe = new THREE.Color('#8b929b').lerp(new THREE.Color(tint), 0.5);
  const tintMat = (mat: THREE.Material): THREE.Material => {
    const c = mat.clone() as THREE.Material & { color?: THREE.Color };
    if (c.color) c.color.copy(robe);
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
      new THREE.BoxGeometry(H * 0.05, H * 0.34, H * 0.18),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(tint), roughness: 0.55, metalness: 0.05 }),
    );
    sash.position.z = H * 0.05;
    sash.rotation.z = 0.5;
    sash.castShadow = true;
    spine.add(sash);
  }
}

/** Pull the character root + animation clips out of one loaded asset. */
function assetParts(loaded: unknown): { root: THREE.Object3D; clips: THREE.AnimationClip[] } {
  if (DEBATE_FORMAT === 'glb') {
    const g = loaded as { scene: THREE.Object3D; animations: THREE.AnimationClip[] };
    return { root: g.scene, clips: g.animations ?? [] };
  }
  const g = loaded as THREE.Object3D & { animations?: THREE.AnimationClip[] };
  return { root: g, clips: g.animations ?? [] };
}

function RealScholar({ action, tint, timeScale }: { action: ScholarAction; tint: string; timeScale: number }) {
  const group = useRef<Group>(null);
  const loaded = useLoader(ASSET_LOADER, DEBATE_PACK.urls) as unknown[];

  // Clone the mesh so two scholars never share one skeleton, then tint the robe.
  const scene = useMemo(() => {
    const s = cloneSkeleton(assetParts(loaded[0]).root);
    s.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.frustumCulled = false; } });
    applyRobe(s, tint);
    return s;
  }, [loaded, tint]);
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const h = box.max.y - box.min.y || 1;
    const scale = 1.7 / h;
    return { scale, yOffset: -box.min.y * scale };
  }, [scene]);

  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const actions = useMemo(() => {
    const map: Record<string, THREE.AnimationAction> = {};
    DEBATE_PACK.clipKeys.forEach((key, i) => {
      const src = assetParts(loaded[i + 1]).clips[0];
      if (src) { const c = src.clone(); c.name = key; map[key] = mixer.clipAction(c); }
    });
    return map;
  }, [loaded, mixer]);

  useFrame((_, delta) => mixer.update(delta * timeScale));

  useEffect(() => {
    const { anim, rot } = action;
    const pool = DEBATE_PACK.actionClips[anim] ?? DEBATE_PACK.actionClips.idle;
    const clip = pool[((rot % pool.length) + pool.length) % pool.length];
    const loop = anim === 'idle';
    const hold = anim === 'rout' || anim === 'win'; // stay on the last frame
    const next = actions[clip] ?? actions[DEBATE_PACK.idleKey];
    if (!next) return;
    next.reset();
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.fadeIn(0.18).play();
    for (const [k, act] of Object.entries(actions)) if (k !== clip && act) act.fadeOut(0.22);
    if (!loop && !hold) {
      const back = () => { actions[DEBATE_PACK.idleKey]?.reset().fadeIn(0.28).play(); };
      mixer.addEventListener('finished', back);
      return () => mixer.removeEventListener('finished', back);
    }
  }, [action.anim, action.rot, action.stamp, actions, mixer]);

  return (
    <group ref={group} position={[0, fit.yOffset, 0]} rotation={[0, MODEL_FACE_OFFSET, 0]} scale={fit.scale}>
      <primitive object={scene} />
    </group>
  );
}

// ─────────────────────────── one positioned scholar ────────────────────────

function Scholar({
  side, robe, action, name, timeScale,
}: { side: 'left' | 'right'; robe: string; action: ScholarAction; name: string; timeScale: number }) {
  const x = side === 'left' ? -0.95 : 0.95;
  const rotY = side === 'left' ? 0 : Math.PI;
  return (
    <group position={[x, 0, 0]} rotation={[0, rotY, 0]}>
      {DEBATE_ASSETS_READY
        ? <RealScholar action={action} tint={robe} timeScale={timeScale} />
        : <ProceduralScholar robe={robe} action={action} />}
      {/* side ring underfoot */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.46, 32]} />
        <meshBasicMaterial color={robe} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0, 2.0, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#fff', background: 'rgba(0,0,0,0.45)', padding: '1px 7px', borderRadius: 4,
          fontFamily: 'var(--tkm-font-body)', fontSize: 13, letterSpacing: '0.05em',
          border: `1px solid ${robe}`, whiteSpace: 'nowrap',
        }}>{name}</div>
      </Html>
    </group>
  );
}

// ─────────────────────────── camera + verbal effects ───────────────────────

function CameraRig({ shakeKey, big, routKey, routX }: { shakeKey: number; big: boolean; routKey: number; routX: number }) {
  const impulse = useRef(0);
  const seen = useRef(0);
  const rout = useRef(0);
  const routSeen = useRef(0);
  const routAt = useRef(0);
  useFrame(({ camera, clock }) => {
    if (shakeKey !== seen.current) { seen.current = shakeKey; impulse.current = big ? 0.8 : 0.45; }
    if (routKey !== routSeen.current) { routSeen.current = routKey; rout.current = 1; routAt.current = routX; }
    impulse.current *= 0.9;
    rout.current *= 0.99;
    const k = impulse.current;
    const rc = rout.current;
    const tx = routAt.current * rc * 0.6;
    const sway = Math.sin(clock.elapsedTime * 0.35) * 0.1;
    camera.position.set(
      sway + tx * 0.5 + Math.sin(clock.elapsedTime * 21) * k * 0.03,
      1.5 - rc * 0.14 + Math.cos(clock.elapsedTime * 17) * k * 0.025,
      3.9 - k * 0.35 - rc * 1.5,   // push in on the broken mind
    );
    camera.lookAt(tx, 1.05, 0);
  });
  return null;
}

/** A dark ink-splash where a mind lost composure. Remount via `key` to replay. */
function InkBurst({ position, big }: { position: [number, number, number]; big: boolean }) {
  const ref = useRef<Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const start = useRef(0);
  const pending = useRef(true);
  useFrame(({ clock }) => {
    const g = ref.current; if (!g) return;
    if (pending.current) { start.current = clock.elapsedTime; pending.current = false; }
    const t = clock.elapsedTime - start.current;
    const dur = big ? 0.5 : 0.32;
    const p = Math.min(1, t / dur);
    g.scale.setScalar(0.1 + p * (big ? 0.8 : 0.45));
    g.visible = p < 1;
    if (mat.current) mat.current.opacity = (1 - p) * 0.85;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial ref={mat} color={INK} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** The winning argument's 字 flies from the speaker toward the mind it struck. */
function WordGlyph({ glyph, fromX, toX, color, stamp }: { glyph: string; fromX: number; toX: number; color: string; stamp: number }) {
  const ref = useRef<Group>(null);
  const start = useRef(0);
  const pending = useRef(true);
  useEffect(() => { pending.current = true; }, [stamp]);
  useFrame(({ clock }) => {
    const g = ref.current; if (!g) return;
    if (pending.current) { start.current = clock.elapsedTime; pending.current = false; }
    const t = clock.elapsedTime - start.current;
    const dur = 0.72;
    const p = Math.min(1, t / dur);
    g.position.x = THREE.MathUtils.lerp(fromX, toX, p);
    g.position.y = 1.55 + Math.sin(p * Math.PI) * 0.35;
    g.visible = p < 1;
    g.scale.setScalar(p < 1 ? 1 + Math.sin(p * Math.PI) * 0.45 : 0);
  });
  return (
    <group ref={ref} position={[fromX, 1.55, 0]}>
      <Html center distanceFactor={5} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontSize: 44, fontWeight: 800, color,
          fontFamily: 'var(--tkm-font-display, "Noto Serif SC", serif)',
          textShadow: `0 0 16px ${color}, 0 2px 5px #000`, whiteSpace: 'nowrap',
        }}>{glyph}</div>
      </Html>
    </group>
  );
}

// ─────────────────────────── 朝堂舞台 (court hall stage) ────────────────────

function Lantern({ position }: { position: [number, number, number] }) {
  const glow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!glow.current) return;
    const f = 1 + Math.sin(clock.elapsedTime * 5 + position[0]) * 0.08;
    glow.current.scale.set(f, f, f);
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.6, 4]} />
        <meshStandardMaterial color="#2a1f14" />
      </mesh>
      <mesh ref={glow}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshBasicMaterial color="#ff7a4a" toneMapped={false} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.17, 0.17, 0.26, 12, 1, true]} />
        <meshStandardMaterial color="#c23a2a" emissive="#ff6a3a" emissiveIntensity={0.5} side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
      <pointLight position={[0, -0.1, 0]} color="#ff9b5a" intensity={5} distance={6} decay={2} />
    </group>
  );
}

/** A vertical hanging calligraphy scroll (掛軸) along the back wall. */
function HangingScroll({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[0.5, 2.0]} />
        <meshStandardMaterial color="#efe6d0" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.56, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, -1.02, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.56, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* a stroke of ink down the scroll */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[0.08, 1.5]} />
        <meshBasicMaterial color="#181016" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/** Two flanking rows of seated onlookers — 群儒 watching the debate. */
function Onlookers() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 28;
  useEffect(() => {
    const inst = ref.current; if (!inst) return;
    const m = new THREE.Matrix4();
    let i = 0;
    for (const sideZ of [-1, 1]) {
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 7 && i < N; col++) {
          const x = -2.4 + col * 0.8;
          const z = sideZ * (2.4 + row * 0.7);
          m.makeTranslation(x, 0.36, z);
          inst.setMatrixAt(i, m);
          i += 1;
        }
      }
    }
    inst.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} castShadow>
      {/* short capsule = a kneeling/seated figure */}
      <capsuleGeometry args={[0.16, 0.3, 4, 8]} />
      <meshStandardMaterial color="#2a2118" roughness={0.95} />
    </instancedMesh>
  );
}

/** Folding screen, hanging scrolls, lanterns, onlookers and incense haze. */
function HallStage() {
  const scrolls: Array<{ position: [number, number, number]; color: string }> = useMemo(() => {
    const cols = [ME, '#caa64a', FOE];
    return cols.map((color, i) => ({ position: [(i - 1) * 1.5, 2.5, -3.6] as [number, number, number], color }));
  }, []);
  return (
    <>
      {/* lacquered back wall + folding screen (屏風) */}
      <mesh position={[0, 2.6, -3.9]}>
        <planeGeometry args={[16, 7]} />
        <meshStandardMaterial color="#1d160f" roughness={1} />
      </mesh>
      {[-1.6, -0.55, 0.55, 1.6].map((x, i) => (
        <mesh key={i} position={[x, 1.5, -3.7]}>
          <planeGeometry args={[1.0, 2.8]} />
          <meshStandardMaterial color={i % 2 ? '#2a2014' : '#241a10'} roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
      {scrolls.map((s, i) => <HangingScroll key={i} {...s} />)}
      <Onlookers />
      <Lantern position={[2.6, 2.7, 1.0]} />
      <Lantern position={[-2.6, 2.7, 1.0]} />
      <Lantern position={[2.6, 2.7, -1.6]} />
      <Lantern position={[-2.6, 2.7, -1.6]} />
      {/* a low table between the debaters */}
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.08, 0.5]} />
        <meshStandardMaterial color="#3a2616" roughness={0.7} />
      </mesh>
      {[[-0.38, -0.18], [0.38, -0.18], [-0.38, 0.18], [0.38, 0.18]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.16, z]} castShadow>
          <boxGeometry args={[0.06, 0.32, 0.06]} />
          <meshStandardMaterial color="#2a1c10" roughness={0.8} />
        </mesh>
      ))}
      <Sparkles count={26} scale={[7, 4, 5]} position={[0, 2, -0.5]} size={2} speed={0.18} opacity={0.3} color="#d8c8a0" />
    </>
  );
}

// ─────────────────────────── arena scene + shell ───────────────────────────

export interface DebateArenaEvent extends DebateRoundFx { key: number }

/** Keeps a bad asset from crashing the whole game — the 3D hall just disappears
 *  and the debate plays on in the 2D staged panel. */
class ArenaErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.warn('[DebateArena3D] 3D scene disabled after a load error:', err); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Scene({
  left, right, leftName, rightName, shakeKey, big, timeScale, ink, glyph, routKey, routX,
}: {
  left: ScholarAction; right: ScholarAction; leftName: string; rightName: string;
  shakeKey: number; big: boolean; timeScale: number;
  ink: { key: number; x: number; big: boolean } | null;
  glyph: { key: number; glyph: string; fromX: number; toX: number; color: string } | null;
  routKey: number; routX: number;
}) {
  return (
    <>
      <CameraRig shakeKey={shakeKey} big={big} routKey={routKey} routX={routX} />
      {/* warm, lantern-lit interior — low ambient so the lanterns + bloom carry it. */}
      <ambientLight intensity={0.38} />
      <hemisphereLight args={['#6a5a48', '#1a1208', 0.45]} />
      <directionalLight
        position={[2.5, 6, 4]} intensity={1.0} color="#ffe2b4" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-4} shadow-camera-right={4}
        shadow-camera-top={4} shadow-camera-bottom={-4}
      />
      <directionalLight position={[-4, 3, 2]} intensity={0.3} color="#b08050" />

      {/* hall floor — dark polished boards + a central mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#2c241a" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[3.4, 2.4]} />
        <meshStandardMaterial color="#5a3a26" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.66, 1.72, 4]} />
        <meshBasicMaterial color="#caa64a" transparent opacity={0.4} />
      </mesh>
      <ContactShadows position={[0, 0.03, 0]} opacity={0.5} scale={6} blur={2.2} far={3} />

      <HallStage />

      <Scholar side="left" robe={ME} action={left} name={leftName} timeScale={timeScale} />
      <Scholar side="right" robe={FOE} action={right} name={rightName} timeScale={timeScale} />
      {ink && <InkBurst key={`ink-${ink.key}`} position={[ink.x, 1.2, 0]} big={ink.big} />}
      {glyph && <WordGlyph key={`glyph-${glyph.key}`} glyph={glyph.glyph} fromX={glyph.fromX} toX={glyph.toX} color={glyph.color} stamp={glyph.key} />}

      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.7} luminanceSmoothing={0.25} mipmapBlur />
        <Vignette offset={0.3} darkness={0.74} />
      </EffectComposer>
    </>
  );
}

/**
 * The hall. Feed it the latest exchange via `event` (a {@link DebateRoundFx}
 * with a monotonically increasing `key`) and it animates both minds accordingly.
 */
export function DebateArena3D({
  me, foe, leftName, rightName, event,
}: {
  me: Officer; foe: Officer; leftName: string; rightName: string;
  event: DebateArenaEvent | null;
}) {
  void me; void foe; // reserved for future per-officer flavour
  const idle = (): ScholarAction => ({ anim: 'idle', rot: 0, stamp: 0 });
  const [left, setLeft] = useState<ScholarAction>(idle);
  const [right, setRight] = useState<ScholarAction>(idle);
  const [shakeKey, setShakeKey] = useState(0);
  const [big, setBig] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [ink, setInk] = useState<{ key: number; x: number; big: boolean } | null>(null);
  const [glyph, setGlyph] = useState<{ key: number; glyph: string; fromX: number; toX: number; color: string } | null>(null);
  const [routKey, setRoutKey] = useState(0);
  const [routX, setRoutX] = useState(0);
  const lastKey = useRef(0);

  useEffect(() => {
    if (!event || event.key === lastKey.current) return;
    lastKey.current = event.key;
    const k = event.key;
    const { hit, aMove, dMove, dmg, over, winner, routed } = event;

    // Who broke? (composure to 0). 'a' = me/left won → foe/right broke.
    const leftRouted = !!routed && winner === 'd';
    const rightRouted = !!routed && winner === 'a';
    const leftHit = hit === 'a' || hit === 'both';
    const rightHit = hit === 'd' || hit === 'both';
    const heavy = dmg >= 22;

    // 音效 — synthesized verbal stings keyed to the exchange.
    if (routed) { playSfx('shout'); window.setTimeout(() => playSfx('crash'), 180); window.setTimeout(() => playSfx('victory'), 460); }
    else if (aMove === 'press' || dMove === 'press') { playSfx('wardrum'); window.setTimeout(() => playSfx('shout'), 120); }
    else if (hit === 'both') playSfx('forge');                 // both pressed home — a clash
    else if (leftHit || rightHit) playSfx('shout');            // a jab landed
    else playSfx('whoosh');                                    // turned aside

    // Ink-splash on the struck mind (left −0.95, right +0.95, mutual = centre).
    // A 0-damage stalemate (各執一詞) draws no ink — nobody's composure broke.
    setInk(dmg > 0 || routed
      ? { key: k, x: hit === 'a' ? -0.95 : hit === 'd' ? 0.95 : 0, big: heavy || !!routed }
      : null);

    // The winning argument's 字 flies toward the mind it struck.
    if (winner === 'a' || winner === 'd' || (!winner && hit !== 'both')) {
      const winSide = winner ?? (hit === 'd' ? 'a' : 'd');
      const wMove = winSide === 'a' ? aMove : dMove;
      setGlyph({
        key: k, glyph: MOVE_GLYPH[wMove],
        fromX: winSide === 'a' ? -0.95 : 0.95,
        toX: winSide === 'a' ? 0.95 : -0.95,
        color: winSide === 'a' ? ME : FOE,
      });
    } else {
      setGlyph(null);
    }

    // Each move name is also an animation name: a mind performs its argument —
    // unless it was struck (recoil/flinch) or routed (undone).
    const animFor = (mine: DebateMove, wasHit: boolean, broke: boolean): DebateAnim => {
      if (broke) return 'rout';
      if (wasHit) return heavy ? 'recoil' : 'flinch';
      return mine;
    };
    const act = (anim: DebateAnim, rot: number, stamp = k): ScholarAction => ({ anim, rot, stamp });

    setLeft(act(animFor(aMove, leftHit && !leftRouted, leftRouted), k));
    setRight(act(animFor(dMove, rightHit && !rightRouted, rightRouted), k + 2));
    setBig(aMove === 'press' || dMove === 'press' || !!routed);
    setShakeKey((s) => s + 1);

    // 詰 — a landed Press gets a brief slow-mo punch even without a rout.
    if (!routed && (aMove === 'press' || dMove === 'press') && (leftHit || rightHit)) {
      setTimeScale(0.55);
      window.setTimeout(() => setTimeScale(1), 600);
    }

    // 罵倒 — composure broken: push-in on the broken mind + slow motion.
    if (routed) {
      setRoutX(leftRouted ? -0.95 : 0.95);
      setRoutKey((s) => s + 1);
      setTimeScale(0.4);
      const tid = window.setTimeout(() => setTimeScale(1), 1200);
      return () => window.clearTimeout(tid);
    }

    // 折服 — a points win (no rout): strike a cocky victory pose a beat later.
    if (over && winner && winner !== 'draw') {
      const tid = window.setTimeout(() => {
        if (winner === 'a') setLeft(act('win', k, k + 1));
        else setRight(act('win', k + 1, k + 1));
      }, 800);
      return () => window.clearTimeout(tid);
    }
  }, [event]);

  return (
    <ArenaErrorBoundary>
      <div style={{ position: 'fixed', inset: 0, zIndex: 120 }}>
        <Canvas
          shadows dpr={[1, 1.8]}
          camera={{ position: [0, 1.5, 3.9], fov: 40, near: 0.1, far: 100 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#120f0a']} />
          <fog attach="fog" args={['#120f0a', 7, 15]} />
          <Suspense fallback={null}>
            <Scene
              left={left} right={right}
              leftName={leftName} rightName={rightName}
              timeScale={timeScale} ink={ink} glyph={glyph}
              shakeKey={shakeKey} big={big} routKey={routKey} routX={routX}
            />
          </Suspense>
        </Canvas>
      </div>
    </ArenaErrorBoundary>
  );
}

// Preload the pack when enabled so the first debate opens smoothly.
if (DEBATE_ASSETS_READY) {
  useLoader.preload(ASSET_LOADER, DEBATE_PACK.urls);
}
