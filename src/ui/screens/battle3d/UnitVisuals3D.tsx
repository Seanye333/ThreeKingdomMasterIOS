/* ─── 單位視覺 — everything that draws ONE unit on the battle board:
 * mount & rider, weapon models, the retinue crowd, flags/capes/battle-wear,
 * the selection marker, the adaptive-FX degrader and the top-level UnitMesh.
 * Extracted verbatim from TacticalBattleScreen3D.tsx (mechanical split);
 * imports the shared grid from ./battleGrid — no cycles. */
import { useContext, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { HexCoord, TacticalUnit, UnitType } from '../../../game/types';
import { eliteUnitOf } from '../../../game/systems/tactical';
import { groundNormalTexture } from '../battleTextures';
import { SelectionRing3D } from '../../components/SelectionRing3D';
import { useT } from '../../i18n';
import { hexWorld } from './battleGrid';
import { EmbeddedSceneCtx, IS_MOBILE } from './shared';

/** Subtler grain for armour plate so it catches light without looking pitted. */
const ARMOR_NORMAL_SCALE = new THREE.Vector2(0.35, 0.35);
const armorNormal = groundNormalTexture();

export const UNIT_GLYPH: Record<UnitType, string> = {
  infantry: '歩', spearmen: '槍', cavalry: '騎',
  archers: '弓', siege: '攻', navy: '水',
};

/* ─── Per-unit-type mount (horse / cart / boat) under the rider ──── */
function UnitMount({ unit, onClick }: { unit: TacticalUnit; onClick: () => void }) {
  const click = (e: { stopPropagation: () => void }) => { e.stopPropagation(); onClick(); };
  if (unit.isSupply) {
    // 糧車 — a tarp-covered grain wagon: a fat box on wheels, sacks heaped on top.
    return (
      <>
        <mesh position={[0, 0.26, 0]} onClick={click} castShadow>
          <boxGeometry args={[0.6, 0.34, 0.92]} />
          <meshStandardMaterial color="#7a5a32" roughness={0.9} />
        </mesh>
        {/* heaped grain sacks under a tarp */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.52, 0.22, 0.8]} />
          <meshStandardMaterial color="#d8c88a" roughness={0.95} />
        </mesh>
        {/* two wheels each side */}
        {([[-0.34, 0.3], [-0.34, -0.3], [0.34, 0.3], [0.34, -0.3]] as const).map(([sx, sz], i) => (
          <mesh key={i} position={[sx, 0.12, sz]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.06, 8]} />
            <meshStandardMaterial color="#3a2818" />
          </mesh>
        ))}
      </>
    );
  }
  if (unit.unitType === 'cavalry') {
    return (
      <>
        {/* Horse body — box */}
        <mesh position={[0, 0.30, 0]} onClick={click} castShadow>
          <boxGeometry args={[0.45, 0.32, 0.95]} />
          <meshStandardMaterial color="#6a4830" roughness={0.85} />
        </mesh>
        {/* Horse head/neck — forward and slightly down */}
        <mesh position={[0, 0.42, -0.55]} castShadow>
          <boxGeometry args={[0.18, 0.22, 0.28]} />
          <meshStandardMaterial color="#6a4830" roughness={0.85} />
        </mesh>
        {/* 4 legs */}
        {([[-0.18, 0.4], [0.18, 0.4], [-0.18, -0.4], [0.18, -0.4]] as const).map(([sx, sz], i) => (
          <mesh key={i} position={[sx, 0.09, sz]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.18, 4]} />
            <meshStandardMaterial color="#3a2818" />
          </mesh>
        ))}
        {/* Tail */}
        <mesh position={[0, 0.40, 0.55]} rotation={[0.3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.012, 0.25, 4]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'siege') {
    return (
      <>
        {/* Cart body */}
        <mesh position={[0, 0.18, 0]} onClick={click} castShadow>
          <boxGeometry args={[0.70, 0.32, 0.85]} />
          <meshStandardMaterial color="#5a4530" roughness={0.85} />
        </mesh>
        {/* 4 wheels */}
        {([[-0.35, 0.30], [0.35, 0.30], [-0.35, -0.30], [0.35, -0.30]] as const).map(([sx, sz], i) => (
          <mesh key={i} position={[sx, 0.12, sz]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.06, 8]} />
            <meshStandardMaterial color="#3a2818" />
          </mesh>
        ))}
        {/* Catapult arm tilted up */}
        <mesh position={[0, 0.65, -0.10]} rotation={[Math.PI / 3.5, 0, 0]} castShadow>
          <boxGeometry args={[0.05, 0.65, 0.05]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        {/* Stone projectile in sling */}
        <mesh position={[0, 0.95, -0.40]} castShadow>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#5a5040" />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'navy') {
    return (
      <>
        {/* Boat hull */}
        <mesh position={[0, 0.10, 0]} onClick={click} castShadow>
          <boxGeometry args={[0.50, 0.18, 0.95]} />
          <meshStandardMaterial color="#5a4530" roughness={0.85} />
        </mesh>
        {/* Boat prow — pointed forward */}
        <mesh position={[0, 0.13, -0.55]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.22, 0.30, 4]} />
          <meshStandardMaterial color="#5a4530" roughness={0.85} />
        </mesh>
        {/* Mast */}
        <mesh position={[0, 0.85, 0.10]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 1.10, 5]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        {/* Sail */}
        <mesh position={[0, 1.10, 0.10]} castShadow>
          <planeGeometry args={[0.42, 0.55]} />
          <meshStandardMaterial color="#e0d0a8" side={THREE.DoubleSide} roughness={0.85} />
        </mesh>
      </>
    );
  }
  return null;  // infantry, spearmen, archers stand on foot — no mount
}

/* ─── Per-unit-type weapon (sword/spear/bow) in the rider's hand ──── */
function UnitWeapon({ unit, yLift }: { unit: TacticalUnit; yLift: number }) {
  if (unit.unitType === 'spearmen') {
    return (
      <>
        {/* Long spear pole */}
        <mesh position={[-0.34, 0.85 + yLift, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.45, 6]} />
          <meshStandardMaterial color="#3a2818" roughness={0.8} />
        </mesh>
        {/* Tassel below the head */}
        <mesh position={[-0.34, 1.46 + yLift, 0]} castShadow>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color="#b8442e" roughness={0.7} />
        </mesh>
        {/* Spearhead — broad leaf blade */}
        <mesh position={[-0.34, 1.66 + yLift, 0]} castShadow>
          <coneGeometry args={[0.075, 0.26, 6]} />
          <meshStandardMaterial color="#c4ccd4" metalness={0.7} roughness={0.3} />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'archers') {
    return (
      <>
        {/* Bow — curved torus half, recurve tips */}
        <mesh position={[-0.42, 0.55 + yLift, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.30, 0.03, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#4a2e18" roughness={0.6} />
        </mesh>
        {/* Bowstring */}
        <mesh position={[-0.42, 0.55 + yLift, 0]} castShadow>
          <cylinderGeometry args={[0.006, 0.006, 0.60, 3]} />
          <meshStandardMaterial color="#d8c090" />
        </mesh>
        {/* Nocked arrow */}
        <mesh position={[-0.36, 0.55 + yLift, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.42, 4]} />
          <meshStandardMaterial color="#6a5230" />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'infantry') {
    return (
      <>
        {/* Sword blade — angled across body */}
        <mesh position={[-0.36, 0.50 + yLift, 0]} rotation={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[0.05, 0.54, 0.014]} />
          <meshStandardMaterial color="#cdd2d8" metalness={0.65} roughness={0.3} />
        </mesh>
        {/* Crossguard */}
        <mesh position={[-0.30, 0.27 + yLift, 0]} rotation={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[0.14, 0.03, 0.03]} />
          <meshStandardMaterial color="#3a2818" metalness={0.3} roughness={0.6} />
        </mesh>
        {/* Round shield in front, with a central boss */}
        <mesh position={[0.31, 0.45 + yLift, 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.23, 0.23, 0.05, 14]} />
          <meshStandardMaterial color="#6a3024" metalness={0.1} roughness={0.7} />
        </mesh>
        <mesh position={[0.34, 0.45 + yLift, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#d4a84a" metalness={0.6} roughness={0.35} />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'cavalry') {
    return (
      // Lance held forward — couched, with a steel head and a pennon
      <group position={[-0.30, 0.70 + yLift, -0.10]} rotation={[Math.PI / 2 - 0.1, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.026, 0.026, 1.35, 6]} />
          <meshStandardMaterial color="#3a2818" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.74, 0]} castShadow>
          <coneGeometry args={[0.05, 0.20, 6]} />
          <meshStandardMaterial color="#c4ccd4" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.07, 0.5, 0]} rotation={[0, 0, 0.5]} castShadow>
          <planeGeometry args={[0.16, 0.1]} />
          <meshStandardMaterial color="#b8442e" side={THREE.DoubleSide} roughness={0.85} />
        </mesh>
      </group>
    );
  }
  return null; // siege/navy already have their own props on the mount
}


/* ─── FPS 自適應 — sustained sub-26fps drops the cinematic post stack for
 *  the rest of the battle (one-way: no oscillating on/off flicker). ─── */
export function AdaptiveFx({ onDegrade }: { onDegrade: () => void }) {
  const acc = useRef({ t: 0, n: 0, bad: 0 });
  useFrame((_, delta) => {
    const a = acc.current;
    a.t += delta; a.n++;
    if (a.t >= 1) {
      const fps = a.n / a.t;
      a.bad = fps < 26 ? a.bad + 1 : 0;
      a.t = 0; a.n = 0;
      if (a.bad >= 3) onDegrade();
    }
  });
  return null;
}

/* ─── A unit standing on a hex ─────────────────────────────────────── */
/* ─── 千軍萬馬 — a small block of rank-and-file behind the hero figure so a
 *  unit reads as a host, not a lone general. Count scales with troop strength;
 *  they idle-bob in formation. Skipped for navy (footmen on a boat read wrong). */
/* 千軍萬馬 — the rank-and-file host massed behind each unit's hero, rendered
 * as one instanced crowd (bodies + heads + a forest of spears) so a strong
 * stack reads as an ARMY, not a lone general. Count scales with troops; each
 * soldier idle-bobs in formation. Instanced → dozens cost almost nothing. */
const HOST_MAX = IS_MOBILE ? 16 : 48;
function UnitRetinue({ troops, color, unitType, formation }: { troops: number; color: string; unitType?: string; formation?: string }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const helmetRef = useRef<THREE.InstancedMesh>(null);
  const spearRef = useRef<THREE.InstancedMesh>(null);
  const horseRef = useRef<THREE.InstancedMesh>(null);
  const mounted = unitType === 'cavalry';
  const rideLift = mounted ? 0.26 : 0;   // riders sit above their horses
  // 兵種立繪 — the host's weapon reads its type: a long pike forest for 槍兵,
  // short sabres for 騎兵, sparse light arms for 弓兵, medium for the rest.
  const spearLen = unitType === 'spearmen' ? 1.1 : unitType === 'archers' ? 0.3
    : unitType === 'cavalry' ? 0.5 : 0.5;
  const spearColor = unitType === 'archers' ? '#6a5230' : '#3a2818';
  // 陣形佈列 — the rank-and-file REARRANGES with the side's formation, so a
  // formation switch is visible on the field: wedge for 錐行/鋒矢, ring for
  // 方圓/八卦, deep column for 長蛇/衝軛, wide crescent for 鶴翼/雁行/偃月,
  // loose skirmish scatter for 疏開, tight block otherwise.
  const shape = useMemo(() => {
    switch (formation) {
      case 'arrow-tip': case 'awl': case 'fish-scale': return 'wedge';
      case 'wheel': case 'eight-trigrams': case 'square': return 'ring';
      case 'crane-wing': case 'wild-goose': case 'crescent-moon': return 'crescent';
      case 'spread-out': case 'ten-ambush': return 'scatter';
      case 'back-to-water': case 'trinity': return 'column';
      default: return 'block';
    }
  }, [formation]);
  const slots = useMemo(() => {
    const count = Math.min(HOST_MAX, Math.max(6, Math.round(troops / 420)));
    const out: Array<{ x: number; z: number; ph: number; spear: boolean }> = [];
    for (let i = 0; i < count; i++) {
      const h1 = Math.abs(Math.sin(i * 12.9898 + 1.3));
      const h2 = Math.abs(Math.sin(i * 78.233 + 0.7));
      const jx = (h1 - 0.5) * 0.07, jz = (h2 - 0.5) * 0.07;
      let x = 0, z = 0;
      if (shape === 'wedge') {
        // rows of 1,2,3… — the point faces the enemy (forward = -z? host sits behind hero at -z, point toward hero)
        let row = 0, acc = 0;
        while (acc + row + 1 < i + 1) { acc += row + 1; row++; }
        const idxInRow = i - acc;
        x = (idxInRow - row / 2) * 0.19;
        z = -0.42 - row * 0.17;
      } else if (shape === 'ring') {
        const ang = (i / count) * Math.PI * 2;
        const ringR = 0.34 + 0.12 * (i % 2);
        x = Math.cos(ang) * ringR;
        z = -0.62 + Math.sin(ang) * ringR * 0.8;
      } else if (shape === 'crescent') {
        const tArc = i / Math.max(1, count - 1) - 0.5;       // -0.5..0.5
        x = tArc * 1.35;
        z = -0.78 + Math.abs(tArc) * 0.55; // wings swept forward, centre held back
      } else if (shape === 'scatter') {
        x = (h1 - 0.5) * 1.3;
        z = -0.35 - h2 * 0.9;
      } else if (shape === 'column') {
        const colW = 2;
        x = ((i % colW) - (colW - 1) / 2) * 0.19;
        z = -0.45 - Math.floor(i / colW) * 0.15;
      } else {
        const cols = Math.max(4, Math.round(Math.sqrt(count * 2.4)));
        const r = Math.floor(i / cols), c = i % cols;
        x = (c - (cols - 1) / 2) * 0.165;
        z = -0.5 - r * 0.17;
      }
      out.push({ x: x + jx, z: z + jz, ph: (i * 0.9) % (Math.PI * 2), spear: i % 4 !== 0 });
    }
    return out;
  }, [troops, shape]);
  const spearCount = useMemo(() => slots.filter((s) => s.spear).length, [slots]);

  useFrame(({ clock }) => {
    if (!bodyRef.current || !headRef.current) return;
    const t = clock.elapsedTime;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const S = 0.42;
    sc.setScalar(S);
    let si = 0;
    for (let i = 0; i < slots.length; i++) {
      const sl = slots[i];
      const bob = Math.abs(Math.sin(t * 4 + sl.ph)) * 0.03;
      const lift = bob + rideLift * S;
      if (horseRef.current) {
        p.set(sl.x, 0.13 * S + bob * 0.4, sl.z);
        horseRef.current.setMatrixAt(i, m.compose(p, q, sc));
      }
      p.set(sl.x, 0.18 * S + lift, sl.z);
      bodyRef.current.setMatrixAt(i, m.compose(p, q, sc));
      p.set(sl.x, 0.42 * S + lift, sl.z);
      headRef.current.setMatrixAt(i, m.compose(p, q, sc));
      if (helmetRef.current) {
        p.set(sl.x, 0.5 * S + lift, sl.z);
        helmetRef.current.setMatrixAt(i, m.compose(p, q, sc));
      }
      if (sl.spear && spearRef.current) {
        // Taller pikes stand up from the shoulder; short arms sit at the hand.
        p.set(sl.x + 0.12 * S, (0.42 * S + lift) + (spearLen - 0.5) * 0.42 * S, sl.z);
        spearRef.current.setMatrixAt(si++, m.compose(p, q, sc));
      }
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
    if (helmetRef.current) helmetRef.current.instanceMatrix.needsUpdate = true;
    if (spearRef.current) spearRef.current.instanceMatrix.needsUpdate = true;
    if (horseRef.current) horseRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {mounted && (
        <instancedMesh ref={horseRef} args={[undefined, undefined, slots.length]} castShadow>
          <boxGeometry args={[0.16, 0.18, 0.42]} />
          <meshStandardMaterial color="#6a4a32" roughness={0.85} />
        </instancedMesh>
      )}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, slots.length]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.34, 6]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, slots.length]} castShadow>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color="#e0c498" roughness={0.75} />
      </instancedMesh>
      {/* 兜鍪 — an iron helmet on every footman so the host reads as armoured. */}
      <instancedMesh ref={helmetRef} args={[undefined, undefined, slots.length]} castShadow>
        <coneGeometry args={[0.13, 0.16, 6]} />
        <meshStandardMaterial color="#2a2018" roughness={0.5} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={spearRef} args={[undefined, undefined, Math.max(1, spearCount)]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, spearLen, 4]} />
        <meshStandardMaterial color={spearColor} />
      </instancedMesh>
    </group>
  );
}

/** 旌旗 — a flag that swings from its pole, each on its own phase so a line of
 *  banners ripples rather than flapping in lockstep. */
function FlutterFlag({ color, poleX, y, big }: { color: string; poleX: number; y: number; big?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const ph = useMemo(() => Math.sin(poleX * 12.9 + y * 7.7) * 6.28, [poleX, y]);
  const w = big ? 0.6 : 0.42, h = big ? 0.42 : 0.28;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 4 + ph;
    ref.current.rotation.y = -0.2 + Math.sin(t) * 0.5;
    ref.current.rotation.z = Math.sin(t * 1.4) * 0.12;
  });
  return (
    <group ref={ref} position={[poleX, y, 0]}>
      <mesh position={[w / 2, 0, 0]} castShadow>
        <planeGeometry args={[w, h, 4, 1]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.85} />
      </mesh>
    </group>
  );
}

/** 戰袍 — a war-cloak draped from the shoulders that billows as it hangs, giving
 *  commanders and riders a heavier, more heroic silhouette. */
function UnitCape({ color, yLift, big }: { color: string; yLift: number; big?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const ph = useMemo(() => Math.sin(yLift * 13.1 + 2.4) * 6.28, [yLift]);
  const cloth = useMemo(() => new THREE.Color(color).multiplyScalar(0.7), [color]);
  const w = big ? 0.52 : 0.44, h = big ? 0.7 : 0.56;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 2.1 + ph;
    ref.current.rotation.x = 0.2 + Math.sin(t) * 0.07;       // billow off the back
    ref.current.rotation.z = Math.sin(t * 0.8) * 0.05;
  });
  return (
    <group ref={ref} position={[-0.18, 0.74 + yLift, 0]}>
      <mesh position={[0, -h / 2, 0]} castShadow>
        <planeGeometry args={[w, h, 2, 3]} />
        <meshStandardMaterial color={cloth} side={THREE.DoubleSide} roughness={0.82} metalness={0.05} />
      </mesh>
    </group>
  );
}

/** 浴血 — battle wear scaled by how much a unit has bled: blood streaks on the
 *  armor, and arrows lodged in it once badly hurt. Static (derived from state). */
function BattleWear({ unit, yLift }: { unit: TacticalUnit; yLift: number }) {
  const dmg = 1 - unit.troops / Math.max(1, unit.maxTroops);
  if (dmg < 0.18) return null;
  const ph = unit.coord.col * 7 + unit.coord.row * 13;
  return (
    <group raycast={() => null}>
      {[0, 1].map((i) => (
        <mesh key={`bl${i}`} position={[i ? -0.13 : 0.15, (0.52 - i * 0.2) + yLift, 0.31]} rotation={[0, 0, i ? -0.5 : 0.4]}>
          <planeGeometry args={[0.08, 0.2]} />
          <meshBasicMaterial color="#5a0f0a" transparent opacity={Math.min(0.85, 0.3 + dmg * 0.6)} depthWrite={false} />
        </mesh>
      ))}
      {dmg > 0.45 && [0, 1, 2].map((i) => {
        const a = ((ph + i * 97) % 360) * Math.PI / 180;
        return (
          <mesh key={`ar${i}`} position={[Math.cos(a) * 0.22, 0.55 + yLift + Math.sin(i * 1.3) * 0.12, Math.sin(a) * 0.22]} rotation={[Math.PI / 2 - 0.4, a, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.34, 4]} />
            <meshStandardMaterial color="#6a5230" roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

/** 選定標記 — a pulsing twin ground ring plus a bobbing down-chevron over the
 *  head, so the picked unit is unmistakable even on a small phone screen.
 *  Self-animating (own useFrame) and non-raycasting so it never eats taps. */
function SelectionMarker({ yLift }: { yLift: number }) {
  return <SelectionRing3D radius={0.66} y={0.05} chevronY={1.5 + yLift} />;
}

/** 武將立繪 — a properly proportioned low-poly warrior to replace the old
 *  cylinder-and-sphere "snowman": armoured legs + boots, a layered lamellar
 *  cuirass with tassets, broad curved pauldrons, posed arms with hands, a
 *  gorget and a bowl helmet (commanders add a face beard + a plumed crest).
 *  Faction colour rides on the chest/pauldrons; everything else is iron/leather.
 *  onClick lives on the whole group so the entire figure is one tap target. */
function WarriorFigure({
  color, yLift, isCommander, onClick,
}: {
  color: string;
  yLift: number;
  isCommander: boolean;
  onClick: (e: { stopPropagation: () => void }) => void;
}) {
  const IRON = '#2a2018';
  const LEATHER = '#3a2818';
  const SKIN = '#e0c498';
  const GOLD = '#d4a84a';
  return (
    <group position={[0, yLift, 0]} onClick={onClick}>
      {/* Legs — armoured greaves */}
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={`leg${i}`} position={[x, 0.17, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.058, 0.34, 8]} />
          <meshStandardMaterial color={IRON} roughness={0.8} metalness={0.18} />
        </mesh>
      ))}
      {/* War boots */}
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={`boot${i}`} position={[x, 0.035, 0.05]} castShadow>
          <boxGeometry args={[0.13, 0.08, 0.22]} />
          <meshStandardMaterial color="#1a120a" roughness={0.85} />
        </mesh>
      ))}
      {/* 戰裙 — tapered armoured skirt (tassets), main tap target */}
      <mesh position={[0, 0.36, 0]} castShadow onClick={onClick}>
        <cylinderGeometry args={[0.30, 0.43, 0.34, 12]} />
        <meshStandardMaterial color={LEATHER} roughness={0.82} metalness={0.1}
          normalMap={armorNormal ?? undefined} normalScale={ARMOR_NORMAL_SCALE} />
      </mesh>
      {/* Front tasset plate — a hanging armour flap */}
      <mesh position={[0, 0.32, 0.36]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.26, 0.3, 0.04]} />
        <meshStandardMaterial color={IRON} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.54, 0]} castShadow>
        <cylinderGeometry args={[0.33, 0.33, 0.08, 12]} />
        <meshStandardMaterial color={GOLD} roughness={0.5} metalness={0.45} />
      </mesh>
      {/* 鎧甲 — layered lamellar cuirass (two stacked tapers), faction colour */}
      <mesh position={[0, 0.68, 0]} castShadow onClick={onClick}>
        <cylinderGeometry args={[0.27, 0.32, 0.28, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3}
          normalMap={armorNormal ?? undefined} normalScale={ARMOR_NORMAL_SCALE} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.28, 0.12, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Chest cross-strap — gold for a commander, leather otherwise */}
      <mesh position={[0, 0.68, 0.26]} rotation={[0, 0, 0.5]} castShadow>
        <boxGeometry args={[0.07, 0.4, 0.04]} />
        <meshStandardMaterial color={isCommander ? GOLD : LEATHER} roughness={0.5} metalness={isCommander ? 0.5 : 0.2} />
      </mesh>
      {/* 肩甲 — broad curved pauldrons */}
      {[-0.31, 0.31].map((x, i) => (
        <mesh key={`pauld${i}`} position={[x, 0.86, 0]} scale={[1.1, 0.7, 1.1]} castShadow>
          <sphereGeometry args={[0.15, 10, 8]} />
          <meshStandardMaterial color={color} roughness={0.45} metalness={0.35} />
        </mesh>
      ))}
      {/* Arms — upper arm + hand, angled out from the pauldrons */}
      {[-1, 1].map((s, i) => (
        <group key={`arm${i}`} position={[0.28 * s, 0.82, 0.02]} rotation={[0.1, 0, s * 0.2]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.055, 0.32, 8]} />
            <meshStandardMaterial color={IRON} roughness={0.75} metalness={0.2} />
          </mesh>
          <mesh position={[0, -0.34, 0.03]} castShadow>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* 護頸 — gorget */}
      <mesh position={[0, 0.94, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.14, 0.08, 10]} />
        <meshStandardMaterial color={IRON} roughness={0.55} metalness={0.35} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.04, 0]} castShadow>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* 美髯 — a general's beard */}
      {isCommander && (
        <mesh position={[0, 0.99, 0.07]} rotation={[0.3, 0, 0]} castShadow>
          <coneGeometry args={[0.07, 0.16, 6]} />
          <meshStandardMaterial color="#2a1c10" roughness={0.85} />
        </mesh>
      )}
      {/* 兜鍪 — bowl helmet for everyone */}
      <mesh position={[0, 1.13, 0]} castShadow>
        <sphereGeometry args={[0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={IRON} roughness={0.45} metalness={0.45} />
      </mesh>
      {/* Helmet neck flap */}
      <mesh position={[0, 1.08, -0.1]} rotation={[0.5, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.03]} />
        <meshStandardMaterial color={LEATHER} roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Commander crest — gold finial + tall red plume */}
      {isCommander && (
        <>
          <mesh position={[0, 1.27, 0]} castShadow>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.38, -0.02]} rotation={[0.2, 0, 0]} castShadow>
            <coneGeometry args={[0.05, 0.22, 6]} />
            <meshStandardMaterial color="#c0301c" roughness={0.55} />
          </mesh>
        </>
      )}
    </group>
  );
}

export function UnitMesh({
  unit, terrainH, isPlayer, selected, onClick, isWounded, lunge, formation,
}: {
  unit: TacticalUnit;
  terrainH: number;
  isPlayer: boolean;
  selected: boolean;
  onClick: () => void;
  isWounded?: boolean;
  /** 突刺 — when this unit just struck a melee blow, thrust toward the target. */
  lunge?: { to: HexCoord; at: number } | null;
  /** 陣形 — the side's active formation shapes the rank-and-file layout. */
  formation?: string;
}) {
  const t = useT();
  const [tx, tz] = hexWorld(unit.coord.col, unit.coord.row);
  const color = isPlayer ? '#3a7dd9' : '#b8442e';
  const embedded = useContext(EmbeddedSceneCtx);
  // Animated position — lerps to target hex when unit moves
  const groupRef = useRef<THREE.Group>(null);
  const prevTarget = useRef<{ x: number; z: number }>({ x: tx, z: tz });
  // 受擊反應 — when this unit's troops drop, it flinches and flashes red so
  // every blow visibly LANDS (not just a number popping).
  const prevTroops = useRef(unit.troops);
  const hitAt = useRef(-1);
  const deathAt = useRef(-1);
  const flashRef = useRef<THREE.MeshBasicMaterial>(null);
  const bloodRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.MeshBasicMaterial>(null);
  const dustRef = useRef<THREE.Group>(null);
  const navyFoamRef = useRef<THREE.Group>(null);
  const lastMoveAt = useRef(-10);
  const HIT_DUR = 0.34;
  const DEATH_DUR = 0.85;
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    const tgt = g.position;
    // Lerp x/z toward target hex
    tgt.x += (tx - tgt.x) * Math.min(1, delta * 6);
    tgt.z += (tz - tgt.z) * Math.min(1, delta * 6);
    // Idle bob + selected hover
    const moving = Math.abs(tgt.x - tx) > 0.01 || Math.abs(tgt.z - tz) > 0.01;
    const bobBase = terrainH + 0.02;
    tgt.y = bobBase
      + (selected ? Math.sin(clock.elapsedTime * 3) * 0.05 : 0)
      + (moving ? Math.abs(Math.sin(clock.elapsedTime * 10)) * 0.08 : 0);  // walking bounce
    prevTarget.current = { x: tx, z: tz };
    // 行軍揚塵 — kick up dust while on the move; it lingers ~0.4s after halting.
    if (moving) lastMoveAt.current = clock.elapsedTime;
    if (dustRef.current && unit.unitType !== 'navy') {
      const dustAmt = Math.max(0, 1 - (clock.elapsedTime - lastMoveAt.current) / 0.4);
      let i = 0;
      dustRef.current.traverse((o) => {
        const mesh = o as THREE.Mesh;
        const m = mesh.material as THREE.MeshBasicMaterial | undefined;
        if (m && 'opacity' in m) {
          const churn = 0.55 + 0.45 * Math.sin(clock.elapsedTime * 9 + i * 1.7);
          m.opacity = dustAmt * 0.4 * churn;
          mesh.position.y = 0.04 + ((clock.elapsedTime * 0.6 + i * 0.3) % 0.25);
          i++;
        }
      });
    }
    // 水戰 — navy units rock on the swell and trail foam (stronger when rowing).
    if (unit.unitType === 'navy') {
      g.rotation.z += Math.sin(clock.elapsedTime * 1.5 + tx) * 0.045;
      tgt.y += Math.sin(clock.elapsedTime * 1.2 + tz) * 0.02;
      if (navyFoamRef.current) {
        const wake = moving ? 0.5 : 0.26;
        navyFoamRef.current.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
          if (m && 'opacity' in m) m.opacity = wake * (0.6 + 0.4 * Math.sin(clock.elapsedTime * 5));
        });
      }
    }
    // Detect a troop loss since last frame → trigger the hit reaction.
    if (unit.troops < prevTroops.current) hitAt.current = clock.elapsedTime;
    prevTroops.current = unit.troops;
    const hitT = hitAt.current >= 0
      ? Math.max(0, 1 - (clock.elapsedTime - hitAt.current) / HIT_DUR)
      : 0;
    // Flinch: a quick recoil wobble + scale punch, then settle.
    g.rotation.z = hitT > 0 ? Math.sin((clock.elapsedTime - hitAt.current) * 70) * hitT * 0.16 : 0;
    const s = 1 + hitT * 0.10;
    g.scale.set(s, s, s);
    if (flashRef.current) flashRef.current.opacity = hitT * 0.55;
    // 主將光環 — gentle breathing pulse on the command-range ring.
    if (auraRef.current) auraRef.current.opacity = 0.16 + Math.sin(clock.elapsedTime * 2) * 0.07;
    // 血霧 — on a hit, specks of blood burst outward and fade.
    if (bloodRef.current) {
      const out = (1 - hitT) * 0.55;
      bloodRef.current.children.forEach((c, i) => {
        const a = (i / 7) * Math.PI * 2;
        c.position.set(Math.cos(a) * out, 0.55 + yLift + (1 - hitT) * 0.35 - (1 - hitT) * (1 - hitT) * 0.5, Math.sin(a) * out);
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (m) m.opacity = hitT > 0 ? hitT * 0.9 : 0;
      });
    }
    // 士氣低落 — a unit near breaking sways nervously, so you can SEE which
    // line is about to rout (and which enemy to push).
    if (unit.troops > 0 && hitT === 0 && unit.morale < 35) {
      const fear = (35 - unit.morale) / 35;
      g.rotation.z = Math.sin(clock.elapsedTime * 5.5 + tx * 3) * fear * 0.07;
      // 潰逃姿態 — near-broken units recoil/lean back as if about to bolt.
      g.rotation.x = unit.morale < 20 ? -0.18 * ((20 - unit.morale) / 20) : 0;
    } else if (hitT === 0 && unit.troops > 0) {
      g.rotation.x = 0;
    }
    // 突刺 — strike motion toward the melee target, shaped by unit type:
    // 騎兵踐踏遠衝、槍兵急促突刺、餘者中庸。
    if (lunge && unit.troops > 0) {
      const [lx, lz] = hexWorld(lunge.to.col, lunge.to.row);
      const dx = lx - tx, dz = lz - tz;
      const len = Math.hypot(dx, dz) || 1;
      const reach = unit.unitType === 'cavalry' ? 0.58 : unit.unitType === 'spearmen' ? 0.46 : 0.38;
      const dur = unit.unitType === 'cavalry' ? 0.5 : unit.unitType === 'spearmen' ? 0.28 : 0.36;
      const since = (Date.now() - lunge.at) / 1000;
      const lungeT = since >= 0 && since < dur ? Math.sin((since / dur) * Math.PI) : 0;
      tgt.x += (dx / len) * lungeT * reach;
      tgt.z += (dz / len) * lungeT * reach;
      // Cavalry dips forward as it tramples through.
      if (unit.unitType === 'cavalry') tgt.y -= lungeT * 0.12;
    }
    // 陣亡 — once wiped out, the husk topples, sinks and fades before it's
    // pruned, instead of blinking out of existence.
    if (unit.troops <= 0) {
      if (deathAt.current < 0) deathAt.current = clock.elapsedTime;
      const dT = Math.min(1, (clock.elapsedTime - deathAt.current) / DEATH_DUR);
      g.position.y = bobBase - dT * 0.42;
      g.rotation.x = dT * 1.05;
      g.rotation.z = 0;
      const ds = 1 - dT * 0.28;
      g.scale.set(ds, ds, ds);
      const op = 1 - dT;
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as (THREE.Material & { opacity?: number; transparent?: boolean }) | undefined;
        if (m && 'opacity' in m) { m.transparent = true; m.opacity = op; }
      });
      if (flashRef.current) flashRef.current.opacity = 0;
    }
  });
  // Mount lifts the rider/driver/sailor above the ground feature
  const yLift =
    unit.unitType === 'cavalry' ? 0.30 :
    unit.unitType === 'siege'   ? 0.32 :
    unit.unitType === 'navy'    ? 0.18 :
    0;

  return (
    <group ref={groupRef} position={[tx, terrainH + 0.02, tz]}>
      {/* 受擊紅光 — flares on every troop loss (opacity driven in useFrame). */}
      <mesh position={[0, 0.55 + yLift, 0]} raycast={() => null}>
        <sphereGeometry args={[0.52, 12, 10]} />
        <meshBasicMaterial ref={flashRef} color="#ff3018" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* 血霧 — burst specks driven in useFrame on each hit. */}
      <group ref={bloodRef} raycast={() => null}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.04 + (i % 3) * 0.015, 5, 5]} />
            <meshBasicMaterial color={i % 2 ? '#9a0f0a' : '#c41810'} transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {/* 水戰浪沫 — foam ring + wake trail under a warship. */}
      {unit.unitType === 'navy' && (
        <group ref={navyFoamRef} raycast={() => null}>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.34, 0.6, 20]} />
            <meshBasicMaterial color="#dff2fa" transparent opacity={0.3} depthWrite={false} />
          </mesh>
          {[0, 1].map((i) => (
            <mesh key={i} position={[0, 0.02, 0.55 + i * 0.28]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.5 - i * 0.16, 0.12]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.25} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}
      {/* 行軍揚塵 — ground dust puffs, opacity driven by movement in useFrame. */}
      {unit.unitType !== 'navy' && (
        <group ref={dustRef} raycast={() => null}>
          {[[-0.22, -0.18], [0.2, -0.22], [-0.05, 0.24], [0.26, 0.1], [-0.28, 0.06]].map(([dx, dz], i) => (
            <mesh key={i} position={[dx, 0.04, dz]}>
              <sphereGeometry args={[0.1 + (i % 3) * 0.03, 6, 5]} />
              <meshBasicMaterial color={unit.unitType === 'cavalry' ? '#b6a07a' : '#a89878'} transparent opacity={0} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}
      {/* 主將光環 — a command-presence ring marks the general's rallying reach. */}
      {unit.isCommander && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} raycast={() => null}>
          <ringGeometry args={[1.05, 1.28, 40]} />
          <meshBasicMaterial ref={auraRef} color={color} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {/* Mount or vehicle (cavalry horse / siege cart / navy boat) */}
      <UnitMount unit={unit} onClick={onClick} />
      {/* Rank-and-file host behind the hero (footmen read wrong on a boat). */}
      {unit.unitType !== 'navy' && <UnitRetinue troops={unit.troops} color={color} unitType={unit.unitType} formation={formation} />}
      {/* 戰袍 — war-cloak for generals and riders. */}
      {(unit.isCommander || unit.unitType === 'cavalry') && (
        <UnitCape color={color} yLift={yLift} big={unit.isCommander} />
      )}
      {/* 武將本體 — properly proportioned warrior figure (legs, lamellar armour,
          pauldrons, arms, helmet); the whole group is one tap target. */}
      <WarriorFigure
        color={color}
        yLift={yLift}
        isCommander={!!unit.isCommander}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      />
      {/* Per-unit-type weapon */}
      <UnitWeapon unit={unit} yLift={yLift} />
      {/* 浴血 — blood + lodged arrows scaled by damage taken. */}
      <BattleWear unit={unit} yLift={yLift} />
      {/* Banner pole + fluttering flag — commanders fly a taller 大纛. */}
      <mesh position={[0.28, (unit.isCommander ? 1.2 : 1.05) + yLift, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, unit.isCommander ? 1.25 : 0.95, 6]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      <FlutterFlag color={color} poleX={0.29} y={(unit.isCommander ? 1.62 : 1.40) + yLift} big={unit.isCommander} />
      {/* Commander 大纛 finial — a small gold ball atop the standard. */}
      {unit.isCommander && (
        <mesh position={[0.28, 1.84 + yLift, 0]} castShadow>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#d4a84a" metalness={0.6} roughness={0.3} />
        </mesh>
      )}
      {/* 選定標記 — pulsing ground ring + bobbing head chevron. */}
      {selected && <SelectionMarker yLift={yLift} />}
      {/* HTML overlay — unit info, always-upright crisp text. Skipped in the
          embedded diorama, and dropped the instant the unit is wiped out so a
          floating label doesn't hover over the toppling corpse. */}
      {!embedded && unit.troops > 0 && <Html
        position={[0, 1.6, 0]}
        center
        distanceFactor={8}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(20, 14, 8, 0.88)',
          border: `1.5px solid ${unit.isCommander ? '#d4a84a' : color}`,
          padding: '2px 6px',
          fontFamily: 'var(--tkm-font-body)',
          fontSize: '12px',
          color: '#f0e0b0',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          borderRadius: 'var(--tkm-radius-xs)',
          boxShadow: unit.isCommander
            ? `0 0 14px rgba(212,168,74,0.7)`
            : `0 0 8px ${color}`,
        }}>
          <div style={{ fontWeight: 'bold' }}>
            {unit.isCommander && <span style={{ color: '#d4a84a' }}>主 </span>}
            {UNIT_GLYPH[unit.unitType]} {unit.troops.toLocaleString()}
            {isWounded && <span style={{ color: '#b8442e', marginLeft: 3 }}>傷</span>}
            {unit.effects.some((e) => e.kind === 'burning') && (
              <span style={{ color: '#f55a20', marginLeft: 3 }}>🔥</span>
            )}
            {unit.effects.some((e) => e.kind === 'starving') && (
              <span style={{ color: '#caa45a', marginLeft: 3 }} title={t('糧盡兵疲', 'Out of supply')}>糧</span>
            )}
          </div>
          {/* 精銳/異族 — elite-corps banner under the name. */}
          {eliteUnitOf(unit.officerId) && (
            <div style={{ fontSize: '10px', color: '#e0b860', letterSpacing: '1px', marginTop: 1 }}>
              ❖ {eliteUnitOf(unit.officerId)!.zh}
            </div>
          )}
          <div style={{
            height: 2,
            background: '#1a1410',
            marginTop: 2,
            width: 40,
          }}>
            <div style={{
              height: '100%',
              width: `${Math.round((unit.troops / unit.maxTroops) * 100)}%`,
              background: unit.troops / unit.maxTroops > 0.5 ? '#7ed68a'
                : unit.troops / unit.maxTroops > 0.25 ? '#d4a84a' : '#b8442e',
              transition: 'width 0.4s ease, background 0.3s',
            }} />
          </div>
          {/* AP pips — filled gold = action points still left this turn. */}
          <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 3 }}>
            {Array.from({ length: Math.min(6, unit.maxAp) }).map((_, i) => (
              <span key={i} style={{
                width: 4, height: 4, borderRadius: '50%',
                background: i < unit.ap ? '#f0d070' : '#4a3a24',
                boxShadow: i < unit.ap ? '0 0 2px #f0d070' : 'none',
              }} />
            ))}
          </div>
        </div>
      </Html>}
    </group>
  );
}

/* ─── City wall — thick stone wall block standing on a hex ──────── */
/** Multiply an #rrggbb colour by a factor (>1 lightens). */
