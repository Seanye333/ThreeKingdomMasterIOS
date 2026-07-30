import { useRef, useContext, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { surfaceRelief } from '../../materials';
import { FLOWER, HOUSE_ROOF, HOUSE_WALL, ROBE } from './sceneryData';
import { RENDER_HI } from '../../renderQuality';
import { useT } from '../../i18n';
import { shade, ChineseRoof3D, SeasonCtx, NightCtx } from './Folk3D';
import { Banner3D, Smoke3D } from './Architecture3D';
import type { SpecialtyDef } from '../../../game/data/specialties';
import type { Officer } from '../../../game/types';
import { BATCH_STATIC, BATCH_SKIP } from '../../components/StaticBatch';

/**
 * 城中景物 — the props that make a city read as a lived-in place rather than
 * a grid of buildings: dwellings and market stalls, the government hall and
 * barracks, gardens and ponds and pagodas, carts and villagers on the move.
 *
 * Split out of CityMapScreen3D, which had grown past four thousand lines with
 * these ~40 small components taking up a third of it. They are leaf visuals —
 * they take coordinates and draw, holding no city state — so they lift out
 * whole. Companions: Architecture3D (walls, gates, build plots) and Folk3D
 * (people and the season/night contexts).
 */

// Terrains a house can't sit on.
// Wilderness flattened to level city ground (no mountains/hills/trees inside
// the walls); standing water is kept as the odd pond.

// Per-season lighting mood for the city view. The game advances by season (no
// wall-clock), so each season also carries a characteristic sun angle —
// spring soft-morning, summer high-noon, autumn low golden-hour, winter pale
// low — which gives every season its own shadow length/direction and a
// distinct time-of-day feel.
export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';
// nightGlow: how strongly the braziers/lanterns cast warm light — low in the
// bright seasons, high in the dim ones, so winter reads as a lantern-lit dusk.




// Normalised (0..1) city stats the 3D scene scales itself by.
export type CityStats = { fCommerce: number; fAgri: number; fLoyalty: number; fPop: number };

// Tapping a landmark reports a little "what is this" card up to the screen.
// (InspectInfo/InspectCtx live in city3d/Folk3D.tsx — shared with the architecture module.)

/** 城中人物 — officers standing in the city view, bucketed by where they'd
 *  plausibly be found: court officers at the yamen, martial officers on the
 *  drill ground, discovered wanderers at the tavern. `hiddenCount` counts
 *  undiscovered talents rendered as anonymous silhouettes (a 搜索 hint). */
export type CityFigures = { hall: Officer[]; barracks: Officer[]; tavern: Officer[]; hiddenCount: number };
/** Live, city-derived flavour text for the decorative landmarks (報時/瞭望/休憩). */
export type LandmarkInfo = { timeBody: string; pagodaBody: string; gardenBody: string };

/** Which landmarks have an internal-affairs order queued this season (施政中). */
export type CityActivity = { farm: boolean; market: boolean; barracks: boolean; wall: boolean; hall: boolean; tavern: boolean };



/** A townhouse with real detail — stone plinth, plastered walls with timber
 *  corner posts, a door, recessed windows and a swept tiled roof. Three
 *  archetypes (cottage / merchant house / two-storey) chosen by hash. */
export function Dwelling({ x, z, seed }: { x: number; z: number; seed: number }) {
  const season = useContext(SeasonCtx);
  const wall = HOUSE_WALL[seed % HOUSE_WALL.length];
  const roof = HOUSE_ROOF[(seed >> 3) % HOUSE_ROOF.length];
  const type = (seed >> 6) % 3;
  const w = 0.6 + (seed % 3) * 0.06;
  const bodyH = 0.4 + ((seed >> 2) % 3) * 0.08;
  const rot = ((seed >> 4) % 4) * (Math.PI / 12);
  const post = '#5a4530';
  const front = w / 2 + 0.01;
  // Windows glow warm in the dusky seasons (autumn/winter) — and on a
  // moonlit lower-phase night nearly every home is lamplit, brighter.
  const night = useContext(NightCtx);
  const lit = (night ? seed % 7 !== 0 : (season === 'winter' || season === 'autumn') && (seed % 5 !== 0));
  const winColor = lit ? '#ffce82' : '#2a2018';
  const winEmissive = lit ? '#ff9c3a' : '#000000';
  const winGlow = lit ? (night ? 1.4 : 0.9) : 0;
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]} userData={BATCH_STATIC}>
      {/* Stone plinth */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.18, 0.12, w + 0.18]} />
        <meshStandardMaterial color="#8d8270" {...surfaceRelief('stone', 2)} />
      </mesh>
      {/* Plastered walls */}
      <mesh position={[0, bodyH / 2 + 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, w]} />
        <meshStandardMaterial color={wall} {...surfaceRelief('masonry', 2)} />
      </mesh>
      {/* Timber corner posts */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * w / 2, bodyH / 2 + 0.12, sz * w / 2]} castShadow>
          <boxGeometry args={[0.06, bodyH, 0.06]} />
          <meshStandardMaterial color={post} roughness={0.85} />
        </mesh>
      ))}
      {/* Door + windows on the front face */}
      <mesh position={[0, 0.29, front]}>
        <boxGeometry args={[0.18, 0.34, 0.04]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>
      <mesh position={[w * 0.28, bodyH * 0.66 + 0.12, front]}>
        <boxGeometry args={[0.14, 0.14, 0.04]} />
        <meshStandardMaterial color={winColor} emissive={winEmissive} emissiveIntensity={winGlow} roughness={0.6} />
      </mesh>
      {type >= 1 && (
        <mesh position={[-w * 0.28, bodyH * 0.66 + 0.12, front]}>
          <boxGeometry args={[0.14, 0.14, 0.04]} />
          <meshStandardMaterial color={winColor} emissive={winEmissive} emissiveIntensity={winGlow} roughness={0.6} />
        </mesh>
      )}
      {/* Lower roof */}
      <group position={[0, bodyH + 0.12, 0]}>
        <ChineseRoof3D size={w} color={roof} />
      </group>
      {/* Two-storey variant: a smaller upper box + its own roof */}
      {type === 2 && (
        <>
          <mesh position={[0, bodyH + 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[w * 0.78, 0.42, w * 0.78]} />
            <meshStandardMaterial color={wall} {...surfaceRelief('masonry', 2)} />
          </mesh>
          <mesh position={[0, bodyH + 0.42, w * 0.39 + 0.01]}>
            <boxGeometry args={[0.13, 0.13, 0.04]} />
            <meshStandardMaterial color={winColor} emissive={winEmissive} emissiveIntensity={winGlow} roughness={0.6} />
          </mesh>
          <group position={[0, bodyH + 0.64, 0]}>
            <ChineseRoof3D size={w * 0.78} color={roof} />
          </group>
        </>
      )}
    </group>
  );
}

/** A guardian stone lion (石獅) — base, crouching body, maned head, paw ball. */
export function StoneLion3D({ x, z, faceZ }: { x: number; z: number; faceZ: number }) {
  const stone = '#b9b1a0';
  return (
    <group position={[x, 0, z]} rotation={[0, faceZ > 0 ? 0 : Math.PI, 0]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.18, 0.42]} />
        <meshStandardMaterial color="#8f8775" roughness={0.95} />
      </mesh>
      {/* Haunches + chest */}
      <mesh position={[0, 0.34, -0.06]} castShadow>
        <boxGeometry args={[0.22, 0.34, 0.24]} />
        <meshStandardMaterial color={stone} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.46, 0.12]} castShadow>
        <boxGeometry args={[0.2, 0.26, 0.18]} />
        <meshStandardMaterial color={stone} roughness={0.9} />
      </mesh>
      {/* Maned head */}
      <mesh position={[0, 0.62, 0.16]} castShadow>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshStandardMaterial color={stone} roughness={0.85} />
      </mesh>
      {/* Paw ball */}
      <mesh position={[0, 0.12, 0.22]} castShadow>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color="#a89e88" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** A tall flagpole flying the force banner (opaque cloth). */
export function FlagPole3D({ x, z, color, h = 2.4 }: { x: number; z: number; color: string; h?: number }) {
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, h, 6]} />
        <meshStandardMaterial color="#2a2018" roughness={0.8} />
      </mesh>
      <mesh position={[0, h - 0.02, 0]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#d4a84a" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Vertical hanging banner — flutters in the breeze */}
      <group position={[0, h - 0.5, 0]}>
        <Banner3D color={color} w={0.26} h={0.8} phase={x + z} faceX={0.13} />
      </group>
    </group>
  );
}

/** The seat of government — a grand double-eave hall on a stepped platform,
 *  flanked by stone lions and banner poles. */
export function GovernmentHall3D({ x, z, bannerColor, isCapital = false }: { x: number; z: number; bannerColor: string; isCapital?: boolean }) {
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      {/* Paved plaza with a border step */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[3.8, 0.1, 3.8]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[2.7, 0.08, 2.4]} />
        <meshStandardMaterial color="#a89a72" roughness={0.95} />
      </mesh>
      {/* Stepped stone platform */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.2, 0.2, 1.9]} />
        <meshStandardMaterial color="#b0a078" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.36, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.95, 0.18, 1.65]} />
        <meshStandardMaterial color="#bdac82" roughness={0.9} />
      </mesh>
      {/* Front steps */}
      <mesh position={[0, 0.16, 1.0]} receiveShadow>
        <boxGeometry args={[0.9, 0.12, 0.3]} />
        <meshStandardMaterial color="#a89a72" roughness={0.92} />
      </mesh>
      {/* Hall body */}
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.0, 1.3]} />
        <meshStandardMaterial color="#8a3030" roughness={0.68} />
      </mesh>
      {/* Red columns wrapping the front */}
      {[-0.66, -0.22, 0.22, 0.66].map((px, i) => (
        <mesh key={i} position={[px, 0.95, 0.68]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 1.0, 8]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* Name plaque (匾額) over the doorway */}
      <mesh position={[0, 1.28, 0.69]} castShadow>
        <boxGeometry args={[0.7, 0.24, 0.05]} />
        <meshStandardMaterial color="#3a2414" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.28, 0.72]}>
        <boxGeometry args={[0.6, 0.16, 0.02]} />
        <meshStandardMaterial color="#caa24a" emissive="#6a4f18" emissiveIntensity={0.3} roughness={0.5} />
      </mesh>
      {/* Double-eave roof (重檐) */}
      <group position={[0, 1.45, 0]}>
        <ChineseRoof3D size={1.7} color="#2f3a48" ornament beasts />
      </group>
      <group position={[0, 1.95, 0]}>
        <ChineseRoof3D size={1.15} color="#2f3a48" ornament beasts />
      </group>
      {/* Courtyard wall enclosing the compound (gap at the front for the gate) */}
      {[
        [0, -2.05, 4.7, 0.16] as const,      // back
        [-2.25, 0, 0.16, 4.3] as const,      // left
        [2.25, 0, 0.16, 4.3] as const,       // right
        [-1.55, 2.05, 1.5, 0.16] as const,   // front-left of gate
        [1.55, 2.05, 1.5, 0.16] as const,    // front-right of gate
      ].map((w, i) => (
        <group key={`cw${i}`}>
          <mesh position={[w[0], 0.42, w[1]]} castShadow receiveShadow>
            <boxGeometry args={[w[2], 0.78, w[3]]} />
            <meshStandardMaterial color="#b8aa84" roughness={0.92} />
          </mesh>
          <mesh position={[w[0], 0.85, w[1]]} castShadow>
            <boxGeometry args={[w[2] + 0.08, 0.1, w[3] + 0.08]} />
            <meshStandardMaterial color="#39444f" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* 衙門 gatehouse on the front gap */}
      {[-0.7, 0.7].map((px, i) => (
        <mesh key={`gp${i}`} position={[px, 0.55, 2.05]} castShadow>
          <boxGeometry args={[0.26, 1.1, 0.26]} />
          <meshStandardMaterial color="#8a3030" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 1.18, 2.05]} castShadow>
        <boxGeometry args={[1.7, 0.22, 0.3]} />
        <meshStandardMaterial color="#7a2820" roughness={0.7} />
      </mesh>
      <group position={[0, 1.34, 2.05]}><ChineseRoof3D size={1.5} color="#2f3a48" ornament /></group>
      {/* 華表 columns flanking the approach */}
      {[-1.9, 1.9].map((px, i) => (
        <group key={`hb${i}`} position={[px, 0, 2.7]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 2.2, 8]} />
            <meshStandardMaterial color="#d8d2c4" roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.85, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.06, 0.5, 0.06]} />
            <meshStandardMaterial color="#cfc8b8" roughness={0.85} />
          </mesh>
          <mesh position={[0, 2.32, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.14, 0.12, 8]} />
            <meshStandardMaterial color="#cfc8b8" roughness={0.85} />
          </mesh>
          <mesh position={[0, 2.46, 0]} castShadow>
            <coneGeometry args={[0.09, 0.16, 6]} />
            <meshStandardMaterial color="#caa84a" roughness={0.5} metalness={0.3} />
          </mesh>
        </group>
      ))}
      {/* 影壁 spirit screen facing the approach */}
      <group position={[0, 0, 3.4]}>
        <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.1, 0.2, 0.34]} />
          <meshStandardMaterial color="#9a8f78" roughness={0.92} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 1.3, 0.16]} />
          <meshStandardMaterial color="#a83a30" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.85, 0.09]}>
          <boxGeometry args={[1.0, 0.82, 0.04]} />
          <meshStandardMaterial color="#caa24a" emissive="#5a4010" emissiveIntensity={0.25} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[2.1, 0.12, 0.42]} />
          <meshStandardMaterial color="#39444f" roughness={0.6} />
        </mesh>
        {[-1, 1].map((s, i) => (
          <mesh key={i} position={[s * 1.0, 1.7, 0]} rotation={[0, 0, -s * 0.5]}>
            <coneGeometry args={[0.07, 0.2, 4]} />
            <meshStandardMaterial color="#566472" roughness={0.6} />
          </mesh>
        ))}
      </group>
      {/* Guardian lions + banner poles flanking the steps */}
      <StoneLion3D x={-0.7} z={1.15} faceZ={1} />
      <StoneLion3D x={0.7} z={1.15} faceZ={1} />
      <FlagPole3D x={-1.5} z={1.4} color={bannerColor} />
      <FlagPole3D x={1.5} z={1.4} color={bannerColor} />
      {/* ★治所 — the realm's seat flies a grand gilded canopy (華蓋) on a tall
          central mast above the hall, so the capital reads from across the map. */}
      {isCapital && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 3.0, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 3.6, 8]} />
            <meshStandardMaterial color="#7a5a2a" roughness={0.6} metalness={0.3} />
          </mesh>
          {/* tiered gold canopy */}
          <mesh position={[0, 3.5, 0]} castShadow>
            <coneGeometry args={[0.62, 0.4, 12]} />
            <meshStandardMaterial color="#d8b048" metalness={0.6} roughness={0.35} emissive="#6a4f12" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 3.78, 0]} castShadow>
            <coneGeometry args={[0.42, 0.3, 12]} />
            <meshStandardMaterial color="#e6c25a" metalness={0.6} roughness={0.32} emissive="#6a4f12" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0, 4.05, 0]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#ffe08a" metalness={0.7} roughness={0.25} emissive="#8a6a1a" emissiveIntensity={0.5} />
          </mesh>
          <group position={[0, 2.4, 0]}><Banner3D color={bannerColor} w={0.4} h={1.0} phase={x - z} faceX={0.2} /></group>
        </group>
      )}
      <Html position={[0, isCapital ? 4.5 : 2.7, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.85)', border: `1px solid ${isCapital ? '#ffd86a' : '#d4a84a'}`, padding: '1px 6px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px', color: isCapital ? '#ffe69a' : '#f0d98a', borderRadius: 'var(--tkm-radius-xs)', whiteSpace: 'nowrap' }}>
          {isCapital ? '★ 治所' : '府衙'}
        </div>
      </Html>
    </group>
  );
}

/** 兵營 — a drill yard: a long timber barracks hall, a spear rack and a
 *  war banner. The seat of 徵兵 (recruitment). */
export function Barracks3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.7, 0.8]} />
        <meshStandardMaterial color="#6a5236" roughness={0.85} />
      </mesh>
      <group position={[0, 0.72, 0]}><ChineseRoof3D size={1.6} color="#3a3026" /></group>
      {[-0.5, -0.3, -0.1, 0.1, 0.3, 0.5].map((sx, i) => (
        <mesh key={i} position={[sx, 0.35, 0.62]} rotation={[0.18, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.7, 5]} />
          <meshStandardMaterial color="#2a2018" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0.85, 0.3, 0.4]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.6, 6]} />
        <meshStandardMaterial color="#4a3a26" roughness={0.9} />
      </mesh>
      <FlagPole3D x={-0.85} z={0.4} color={bannerColor} h={1.8} />
    </group>
  );
}

/** 酒樓 — a two-storey tavern under a hanging 「酒」 banner: the haunt of
 *  wanderers and unsung talent. The seat of 人材探訪. */
export function Tavern3D({ x, z }: { x: number; z: number }) {
  const t = useT();
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.8, 0.9]} />
        <meshStandardMaterial color="#7d5a36" roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.75]} />
        <meshStandardMaterial color="#8a6a40" roughness={0.82} />
      </mesh>
      <group position={[0, 1.3, 0]}><ChineseRoof3D size={1.0} color="#3a2f24" ornament /></group>
      <mesh position={[0.62, 0.95, 0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 6]} />
        <meshStandardMaterial color="#2a2018" />
      </mesh>
      <Html position={[0.62, 1.35, 0.4]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: '#9a2a2a', border: '1px solid #f0d0a0', color: '#f5e8c8', fontFamily: 'var(--tkm-font-body)', fontSize: '13px', padding: '2px 5px', writingMode: 'vertical-rl' }}>{t('酒', 'INN')}</div>
      </Html>
    </group>
  );
}

/** A stylised low-poly garden tree — leafy, blossom or pine by hash, dressed
 *  for the season (gold in autumn, snow-dusted/bare in winter). */
export function GardenTree3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const season = useContext(SeasonCtx);
  const sway = useRef<THREE.Group>(null);
  const phase = x * 0.8 + z;
  useFrame((s2) => {
    const g = sway.current; if (!g) return;
    const t = s2.clock.elapsedTime;
    g.rotation.z = Math.sin(t * 1.3 + phase) * 0.028;
    g.rotation.x = Math.sin(t * 1.1 + phase) * 0.018;
  });
  const s = 0.82 + (seed % 4) * 0.08;
  const type = (seed >> 5) % 5; // 0-2 leafy, 3 blossom, 4 pine
  const trunk = (
    <mesh position={[0, 0.35, 0]} castShadow>
      <cylinderGeometry args={[0.09, 0.13, 0.7, 6]} />
      <meshStandardMaterial color="#5a3f28" roughness={0.9} />
    </mesh>
  );
  if (type === 4) {
    // Pine — evergreen, with a snow cap in winter.
    return (
      <group ref={sway} position={[x, 0, z]} scale={[s, s, s]}>
        {trunk}
        {[[0.7, 0.55], [1.05, 0.42], [1.35, 0.3]].map(([y, r], i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <coneGeometry args={[r, 0.5, 7]} />
            <meshStandardMaterial color={season === 'winter' ? '#3a5a44' : '#2f5530'} roughness={0.85} flatShading />
          </mesh>
        ))}
        {season === 'winter' && [[0.78, 0.46], [1.13, 0.34]].map(([y, r], i) => (
          <mesh key={`sn${i}`} position={[0, y, 0]} castShadow>
            <coneGeometry args={[r, 0.34, 7]} />
            <meshStandardMaterial color="#eef2f6" roughness={0.85} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  // Deciduous canopy colour by season.
  let canopy: string;
  if (season === 'winter') canopy = '#dfe6ec';                                   // snow-dusted bare
  else if (season === 'autumn') canopy = ['#c87a2a', '#d4972f', '#b8502a'][(seed >> 2) % 3]; // gold/red
  else if (type === 3 && season === 'spring') canopy = '#f0b6d2';                // blossom
  else if (type === 3) canopy = '#e6a8c8';
  else canopy = ['#3f6a32', '#4a7a3a', '#356030'][(seed >> 2) % 3];              // green
  const bare = season === 'winter';
  return (
    <group ref={sway} position={[x, 0, z]} scale={[s, s, s]}>
      {trunk}
      <mesh position={[0, 0.98, 0]} castShadow>
        <icosahedronGeometry args={[bare ? 0.4 : 0.5, 0]} />
        <meshStandardMaterial color={canopy} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.2, 0.76, 0.08]} castShadow>
        <icosahedronGeometry args={[bare ? 0.24 : 0.32, 0]} />
        <meshStandardMaterial color={canopy} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.18, 0.78, -0.1]} castShadow>
        <icosahedronGeometry args={[bare ? 0.2 : 0.28, 0]} />
        <meshStandardMaterial color={shade(canopy, 0.9)} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

/** A warm street lantern — post + glowing lamp + cap, with a soft flicker. */
export function Lantern3D({ x, z }: { x: number; z: number }) {
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  // 燈籠搖曳 — a paper lantern hangs; it should swing, not merely throb. The
  // pivot group sits at the crossbar so the lantern arcs beneath it like a
  // pendulum instead of rotating about its own middle.
  const swing = useRef<THREE.Group>(null);
  const phase = x + z * 1.7;
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (lamp.current) lamp.current.emissiveIntensity = 0.55 + Math.sin(t * 4 + phase) * 0.18;
    const g = swing.current;
    if (g) {
      g.rotation.z = Math.sin(t * 1.15 + phase) * 0.09;
      g.rotation.x = Math.sin(t * 0.83 + phase * 1.3) * 0.055;
    }
  });
  return (
    <group position={[x, 0, z]} userData={BATCH_SKIP}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.8, 6]} />
        <meshStandardMaterial color="#2a1d12" roughness={0.9} />
      </mesh>
      <group ref={swing} position={[0, 1.14, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <boxGeometry args={[0.2, 0.26, 0.2]} />
          <meshStandardMaterial ref={lamp} color="#d4502a" emissive="#e07020" emissiveIntensity={0.6} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.06, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.18, 0.12, 4]} />
          <meshStandardMaterial color="#2a1d12" />
        </mesh>
        {/* 流蘇 — the tassel below, which is what sells the swing. */}
        <mesh position={[0, -0.41, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 4]} />
          <meshStandardMaterial color="#c8a24a" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/** 簷下滴水 — a thin curtain of drips off one eave while it rains. Instanced,
 *  no transparency sorting (the drops are opaque slivers), and only mounted by
 *  the caller when the weather actually calls for it. */
export function EaveDrips3D({ spots }: { spots: Array<{ x: number; z: number }> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const drops = useMemo(() => {
    const out: Array<{ x: number; z: number; y0: number; sp: number; ph: number }> = [];
    spots.forEach((s, i) => {
      for (let k = 0; k < 5; k++) {
        const a = (i * 2.1 + k * 1.7);
        out.push({
          x: s.x + Math.cos(a) * 0.42,
          z: s.z + Math.sin(a) * 0.42,
          y0: 0.92 + ((i + k) % 3) * 0.06,
          sp: 1.5 + ((i * 7 + k * 3) % 5) * 0.28,
          ph: ((i * 13 + k * 5) % 10) / 10,
        });
      }
    });
    return out;
  }, [spots]);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      const f = ((t * d.sp + d.ph) % 1);
      dummy.position.set(d.x, d.y0 - f * d.y0, d.z);
      dummy.scale.set(1, 0.5 + f * 0.9, 1);   // stretches as it falls
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  if (drops.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, drops.length]} userData={BATCH_SKIP} raycast={() => null}>
      <boxGeometry args={[0.012, 0.09, 0.012]} />
      <meshStandardMaterial color="#a8c4d4" emissive="#5a7a90" emissiveIntensity={0.35} roughness={0.25} metalness={0.3} />
    </instancedMesh>
  );
}

/** 六畜 — hens and a goat pottering about a farming ward. Cheap primitives with
 *  a slow peck/graze bob; they read as life at ground level, which the city had
 *  only at human scale. */
export function Livestock3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const grp = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = grp.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.children.forEach((c, i) => {
      // Peck: head-down dip on a staggered cycle, plus a slow turn in place.
      c.rotation.x = Math.max(0, Math.sin(t * 1.6 + i * 2.1)) * 0.32;
      c.rotation.y = Math.sin(t * 0.35 + i * 1.7) * 0.7;
    });
  });
  const hens = 3 + (seed % 3);
  return (
    <group position={[x, 0, z]} ref={grp} userData={BATCH_SKIP}>
      {Array.from({ length: hens }).map((_, i) => {
        const a = (seed * 0.7 + i * 2.4);
        const px = Math.cos(a) * (0.35 + (i % 3) * 0.18);
        const pz = Math.sin(a * 1.3) * (0.35 + (i % 2) * 0.22);
        const white = (seed + i) % 3 === 0;
        return (
          <group key={i} position={[px, 0.09, pz]}>
            <mesh castShadow>
              <sphereGeometry args={[0.075, 6, 5]} />
              <meshStandardMaterial color={white ? '#e8e2d6' : '#8a5a34'} roughness={0.9} />
            </mesh>
            <mesh position={[0.07, 0.05, 0]}>
              <sphereGeometry args={[0.035, 5, 4]} />
              <meshStandardMaterial color={white ? '#e8e2d6' : '#8a5a34'} roughness={0.9} />
            </mesh>
            <mesh position={[0.1, 0.05, 0]}>
              <coneGeometry args={[0.014, 0.04, 4]} />
              <meshStandardMaterial color="#d8a038" roughness={0.6} />
            </mesh>
          </group>
        );
      })}
      {/* 羊 — one goat, larger and paler, grazing off to the side. */}
      <group position={[-0.55, 0.14, 0.4]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 7, 6]} />
          <meshStandardMaterial color="#ddd6c6" roughness={0.95} />
        </mesh>
        <mesh position={[0.13, 0.03, 0]}>
          <boxGeometry args={[0.09, 0.07, 0.07]} />
          <meshStandardMaterial color="#c9c0ad" roughness={0.95} />
        </mesh>
        {[[-0.06, -0.05], [0.06, -0.05], [-0.06, 0.05], [0.06, 0.05]].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, -0.11, lz]}>
            <cylinderGeometry args={[0.016, 0.016, 0.14, 4]} />
            <meshStandardMaterial color="#8a8172" roughness={0.95} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** A flat flagstone tile — paving the streets between buildings. */
export function StonePath3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const shade = ['#8f8470', '#857a66', '#968b76', '#7e7460'][seed % 4];
  return (
    <mesh position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={BATCH_STATIC}>
      <boxGeometry args={[1.28, 1.28, 0.08]} />
      <meshStandardMaterial color={shade} roughness={0.98} />
    </mesh>
  );
}

/** A market stall — counter, posts, a coloured awning, goods and a hanging
 *  shop sign (幌子). */
export function MarketStall3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const awning = ['#b8442e', '#3a6a98', '#c19a3b', '#5a8a3a', '#8a3a7a'][seed % 5];
  const sign = ['#c8362a', '#2f6a3a', '#d4a838', '#8a3a7a'][(seed >> 2) % 4];
  const goods = ['#c8a060', '#9a5a2a', '#d8c050', '#6a8a3a', '#b85040'];
  return (
    <group position={[x, 0, z]} rotation={[0, (seed % 4) * (Math.PI / 8), 0]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.4, 0.5]} />
        <meshStandardMaterial color="#8a6a40" roughness={0.85} />
      </mesh>
      {[[-0.36, -0.2], [0.36, -0.2], [-0.36, 0.2], [0.36, 0.2]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.55, pz]}>
          <cylinderGeometry args={[0.03, 0.03, 1.0, 5]} />
          <meshStandardMaterial color="#4a3520" />
        </mesh>
      ))}
      <mesh position={[0, 1.08, 0]} rotation={[0.16, 0, 0]} castShadow>
        <boxGeometry args={[1.05, 0.06, 0.72]} />
        <meshStandardMaterial color={awning} roughness={0.8} />
      </mesh>
      {/* Goods piled on the counter */}
      <mesh position={[-0.15, 0.5, 0]} castShadow>
        <boxGeometry args={[0.42, 0.16, 0.32]} />
        <meshStandardMaterial color={goods[seed % goods.length]} roughness={0.8} />
      </mesh>
      <mesh position={[0.25, 0.52, 0.05]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 8]} />
        <meshStandardMaterial color={goods[(seed >> 3) % goods.length]} roughness={0.8} />
      </mesh>
      {/* Hanging shop sign (幌子) off a front post */}
      <mesh position={[0.36, 0.78, 0.32]}>
        <boxGeometry args={[0.16, 0.34, 0.03]} />
        <meshStandardMaterial color={sign} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.36, 0.97, 0.32]}>
        <boxGeometry args={[0.02, 0.04, 0.16]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
    </group>
  );
}

/* ─── Street life — villagers, props, water features ─────────────────── */

/** A tiny townsfolk figure — robe, head, conical hat or topknot. Static. */
export function Villager3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const robe = ROBE[seed % ROBE.length];
  const rot = (seed % 8) * (Math.PI / 4);
  const hat = (seed >> 3) % 2 === 0;
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.13, 0.34, 7]} />
        <meshStandardMaterial color={robe} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.07, 8, 7]} />
        <meshStandardMaterial color="#e6c39a" roughness={0.8} />
      </mesh>
      {hat ? (
        <mesh position={[0, 0.47, 0]} castShadow>
          <coneGeometry args={[0.12, 0.1, 10]} />
          <meshStandardMaterial color="#9a8050" roughness={0.8} />
        </mesh>
      ) : (
        <mesh position={[0, 0.46, 0]}>
          <sphereGeometry args={[0.035, 6, 5]} />
          <meshStandardMaterial color="#2a2018" />
        </mesh>
      )}
    </group>
  );
}

/** A stone well with a little tiled roof and a bucket. */
export function Well3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.19, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.37, 0.38, 8]} />
        <meshStandardMaterial color="#8f8775" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.05, 8]} />
        <meshStandardMaterial color="#1f3a4a" roughness={0.3} metalness={0.4} />
      </mesh>
      {[-0.3, 0.3].map((px, i) => (
        <mesh key={i} position={[px, 0.62, 0]} castShadow>
          <boxGeometry args={[0.05, 0.78, 0.05]} />
          <meshStandardMaterial color="#5a4530" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.78, 0.06, 0.34]} />
        <meshStandardMaterial color="#4a3520" />
      </mesh>
      <group position={[0, 1.04, 0]}><ChineseRoof3D size={0.5} color="#39444f" /></group>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.11, 7]} />
        <meshStandardMaterial color="#6e5230" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** A two-wheeled handcart loaded with goods. */
export function Cart3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const rot = (seed % 4) * (Math.PI / 5);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.72, 0.16, 0.46]} />
        <meshStandardMaterial color="#7a5a38" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.5, 0.2, 0.34]} />
        <meshStandardMaterial color="#c2a060" roughness={0.8} />
      </mesh>
      {[-0.24, 0.24].map((pz, i) => (
        <mesh key={i} position={[-0.28, 0.18, pz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.05, 12]} />
          <meshStandardMaterial color="#3a2818" roughness={0.85} />
        </mesh>
      ))}
      {[-0.16, 0.16].map((pz, i) => (
        <mesh key={`h${i}`} position={[0.42, 0.34, pz]} rotation={[0, 0, 0.22]}>
          <boxGeometry args={[0.42, 0.03, 0.03]} />
          <meshStandardMaterial color="#5a4530" />
        </mesh>
      ))}
    </group>
  );
}

/** A townsfolk figure that strolls back and forth between two points along a
 *  street, facing the way it walks with a little gait bob. */
export function Walker3D({ ax, az, bx, bz, seed }: { ax: number; az: number; bx: number; bz: number; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const robe = ROBE[seed % ROBE.length];
  const hat = (seed >> 3) % 2 === 0;
  const speed = 0.16 + (seed % 5) * 0.02;
  useFrame((s) => {
    const g = ref.current; if (!g) return;
    const t = s.clock.elapsedTime * speed + seed;
    const u = (Math.sin(t) + 1) / 2;
    g.position.x = ax + (bx - ax) * u;
    g.position.z = az + (bz - az) * u;
    g.position.y = Math.abs(Math.sin(t * 8)) * 0.04;
    const fwd = Math.cos(t) >= 0 ? 1 : -1;
    g.rotation.y = Math.atan2((bx - ax) * fwd, (bz - az) * fwd);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.17, 0]} castShadow><cylinderGeometry args={[0.08, 0.13, 0.34, 7]} /><meshStandardMaterial color={robe} roughness={0.85} /></mesh>
      <mesh position={[0, 0.4, 0]} castShadow><sphereGeometry args={[0.07, 8, 7]} /><meshStandardMaterial color="#e6c39a" roughness={0.8} /></mesh>
      {hat
        ? <mesh position={[0, 0.47, 0]} castShadow><coneGeometry args={[0.12, 0.1, 10]} /><meshStandardMaterial color="#9a8050" roughness={0.8} /></mesh>
        : <mesh position={[0, 0.46, 0]}><sphereGeometry args={[0.035, 6, 5]} /><meshStandardMaterial color="#2a2018" /></mesh>}
    </group>
  );
}

/** An ox-cart trundling along the avenue between two points. */
export function MovingCart3D({ ax, az, bx, bz, seed }: { ax: number; az: number; bx: number; bz: number; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const g = ref.current; if (!g) return;
    const t = s.clock.elapsedTime * 0.05 + seed;
    const u = (Math.sin(t) + 1) / 2;
    g.position.x = ax + (bx - ax) * u;
    g.position.z = az + (bz - az) * u;
    const fwd = Math.cos(t) >= 0 ? 1 : -1;
    g.rotation.y = Math.atan2((bx - ax) * fwd, (bz - az) * fwd);
  });
  return (
    <group ref={ref}>
      {/* Ox */}
      <mesh position={[0, 0.34, 0.7]} castShadow><boxGeometry args={[0.34, 0.34, 0.6]} /><meshStandardMaterial color="#6a5440" roughness={0.9} /></mesh>
      <mesh position={[0, 0.4, 1.05]} castShadow><boxGeometry args={[0.26, 0.24, 0.24]} /><meshStandardMaterial color="#5a4530" roughness={0.9} /></mesh>
      {[-0.12, 0.12].map((hx, i) => (
        <mesh key={i} position={[hx, 0.54, 1.12]} rotation={[0, 0, hx > 0 ? -0.5 : 0.5]}><cylinderGeometry args={[0.02, 0.02, 0.18, 5]} /><meshStandardMaterial color="#e8e0d0" /></mesh>
      ))}
      {[[-0.12, 0.5], [0.12, 0.5], [-0.12, 0.9], [0.12, 0.9]].map(([lx, lz], i) => (
        <mesh key={`lg${i}`} position={[lx, 0.12, lz]}><cylinderGeometry args={[0.04, 0.04, 0.24, 5]} /><meshStandardMaterial color="#4a3826" /></mesh>
      ))}
      {/* Cart bed + wheels + load */}
      <mesh position={[0, 0.32, 0]} castShadow><boxGeometry args={[0.7, 0.14, 0.5]} /><meshStandardMaterial color="#7a5a38" roughness={0.85} /></mesh>
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[0.5, 0.22, 0.36]} /><meshStandardMaterial color="#b89050" roughness={0.8} /></mesh>
      {[-0.27, 0.27].map((wz, i) => (
        <mesh key={`w${i}`} position={[0, 0.18, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.18, 0.18, 0.05, 12]} /><meshStandardMaterial color="#3a2818" /></mesh>
      ))}
    </group>
  );
}


/** A few birds wheeling slowly over the city, wings flapping. */
export function Birds3D({ cx, cz, radius, y }: { cx: number; cz: number; radius: number; y: number }) {
  const grp = useRef<THREE.Group>(null);
  const N = 5;
  useFrame((s) => {
    const g = grp.current; if (!g) return;
    const t = s.clock.elapsedTime * 0.22;
    g.children.forEach((b, i) => {
      const a = t + (i * Math.PI * 2) / N;
      b.position.set(cx + Math.cos(a) * radius, y + Math.sin(a * 1.7 + i) * 0.8, cz + Math.sin(a) * radius);
      b.rotation.y = -a;
      const flap = Math.sin(s.clock.elapsedTime * 7 + i) * 0.5;
      const wings = b as THREE.Object3D;
      if (wings.children[0]) wings.children[0].rotation.z = 0.3 + flap;
      if (wings.children[1]) wings.children[1].rotation.z = -0.3 - flap;
    });
  });
  return (
    <group ref={grp}>
      {Array.from({ length: N }).map((_, i) => (
        <group key={i}>
          <mesh position={[0.13, 0, 0]}><boxGeometry args={[0.26, 0.02, 0.1]} /><meshStandardMaterial color="#2a2620" /></mesh>
          <mesh position={[-0.13, 0, 0]}><boxGeometry args={[0.26, 0.02, 0.1]} /><meshStandardMaterial color="#2a2620" /></mesh>
        </group>
      ))}
    </group>
  );
}

/** A glowing brazier with a flickering flame (opaque emissive — no transparency). */
export function Brazier3D({ x, z }: { x: number; z: number }) {
  const flame = useRef<THREE.Mesh>(null);
  const coals = useRef<THREE.MeshStandardMaterial>(null);
  const phase = x * 1.7 + z;
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const f = 0.85 + Math.sin(t * 9 + phase) * 0.12 + Math.sin(t * 17 + phase) * 0.06;
    if (flame.current) { flame.current.scale.set(0.9 + (f - 0.9) * 0.5, f, 0.9 + (f - 0.9) * 0.5); }
    if (coals.current) { coals.current.emissiveIntensity = 1.0 + (f - 0.9) * 1.2; }
  });
  return (
    <group position={[x, 0, z]}>
      {[[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.18, pz]}>
          <cylinderGeometry args={[0.022, 0.022, 0.36, 5]} />
          <meshStandardMaterial color="#2a1d12" />
        </mesh>
      ))}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.13, 0.16, 10]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.47, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.05, 10]} />
        <meshStandardMaterial ref={coals} color="#e0641e" emissive="#ff7a1e" emissiveIntensity={1.1} roughness={0.5} />
      </mesh>
      <mesh ref={flame} position={[0, 0.58, 0]}>
        <coneGeometry args={[0.08, 0.2, 7]} />
        <meshStandardMaterial color="#ffb43a" emissive="#ff8a1e" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

/** A raised flower bed — soil box, greenery and bright blossoms. */
export function FlowerBed3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.07, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.72, 0.14, 0.5]} />
        <meshStandardMaterial color="#5a4028" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.62, 0.04, 0.4]} />
        <meshStandardMaterial color="#3f6a32" roughness={0.9} />
      </mesh>
      {[[-0.2, -0.1], [0, 0.08], [0.2, -0.06], [-0.08, -0.13], [0.13, 0.11]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.22, pz]} castShadow>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshStandardMaterial color={FLOWER[(seed + i) % FLOWER.length]} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** An arched stone bridge spanning the moat outside the gate. */
export function StoneBridge3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.18, 2.6]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.14, 1.1]} />
        <meshStandardMaterial color="#a89a78" roughness={0.95} />
      </mesh>
      {[-0.52, 0.52].map((px, i) => (
        <mesh key={i} position={[px, 0.4, 0]} castShadow>
          <boxGeometry args={[0.1, 0.3, 2.5]} />
          <meshStandardMaterial color="#8f8472" roughness={0.92} />
        </mesh>
      ))}
      {/* Support pillars dipping into the moat */}
      {[-0.8, 0.8].map((pz, i) => (
        <mesh key={`p${i}`} position={[0, -0.1, pz]} castShadow>
          <boxGeometry args={[0.9, 0.5, 0.16]} />
          <meshStandardMaterial color="#7e7460" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/** A 水門 water gate set into a wall — twin piers, an arch lintel, a raised
 *  portcullis and a little gatehouse, opening the wall to the moat. The wall
 *  runs along z here, so boats pass through along x. */
export function WaterGate3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      {[-0.78, 0.78].map((pz, i) => (
        <mesh key={i} position={[0, 0.8, pz]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.6, 0.45]} />
          <meshStandardMaterial color="#6a5540" roughness={0.92} />
        </mesh>
      ))}
      {/* Arch lintel spanning the opening */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[1.6, 0.5, 1.5]} />
        <meshStandardMaterial color="#7a6550" roughness={0.9} />
      </mesh>
      {/* Raised portcullis bars */}
      {[-0.45, -0.15, 0.15, 0.45].map((pz, i) => (
        <mesh key={`b${i}`} position={[0, 0.95, pz]}>
          <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
          <meshStandardMaterial color="#3a2a1a" roughness={0.7} />
        </mesh>
      ))}
      {/* Gatehouse + swept roof */}
      <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.55, 1.0]} />
        <meshStandardMaterial color="#8a6a40" roughness={0.8} />
      </mesh>
      <group position={[0, 2.35, 0]}><ChineseRoof3D size={1.4} color="#2f3a48" ornament /></group>
      <mesh position={[0, 3.0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <group position={[0, 3.12, 0]}>
        <Banner3D color={bannerColor} w={0.3} h={0.3} phase={x + z} faceX={0.15} />
      </group>
    </group>
  );
}

/** A timber wharf reaching out over the moat — plank deck on pilings, moored
 *  cargo boats, crates and barrels, and a couple of dockhands. Extends +x. */
export function Dock3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      {/* Plank deck */}
      <mesh position={[1.7, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.12, 1.1]} />
        <meshStandardMaterial color="#7a5e38" roughness={0.85} />
      </mesh>
      {/* Pilings into the water */}
      {[0.4, 1.5, 2.6].flatMap((px) => [-0.42, 0.42].map((pz) => (
        <mesh key={`pl-${px}-${pz}`} position={[px, -0.12, pz]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 6]} />
          <meshStandardMaterial color="#4a3520" roughness={0.9} />
        </mesh>
      )))}
      {/* Cargo */}
      <mesh position={[0.55, 0.4, 0.24]} castShadow>
        <boxGeometry args={[0.34, 0.3, 0.34]} />
        <meshStandardMaterial color="#9a7040" roughness={0.85} />
      </mesh>
      <mesh position={[0.92, 0.36, -0.26]} castShadow>
        <boxGeometry args={[0.3, 0.26, 0.3]} />
        <meshStandardMaterial color="#8a6038" roughness={0.85} />
      </mesh>
      <mesh position={[0.62, 0.72, 0.2]} castShadow>
        <boxGeometry args={[0.28, 0.24, 0.28]} />
        <meshStandardMaterial color="#a87a48" roughness={0.85} />
      </mesh>
      <mesh position={[1.4, 0.4, 0.3]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.36, 10]} />
        <meshStandardMaterial color="#6a4a28" roughness={0.85} />
      </mesh>
      {/* Moored boats alongside (they bob) + dockhands */}
      <SmallBoat3D x={2.7} z={1.0} seed={2.1} />
      <SmallBoat3D x={1.9} z={-1.05} seed={4.3} />
      <Villager3D x={0.7} z={0.05} seed={42} />
      <Villager3D x={1.7} z={0.12} seed={71} />
    </group>
  );
}

/** Hundreds of grass tufts in one draw call (instanced) — ground texture on
 *  the open earth; in winter they become low snow mounds. */
export function GrassTufts3D({ tufts }: { tufts: Array<{ x: number; z: number; s: number; r: number; c: string }> }) {
  const season = useContext(SeasonCtx);
  const snowy = season === 'winter';
  if (!tufts.length) return null;
  return (
    <Instances limit={tufts.length} range={tufts.length} castShadow={false} receiveShadow>
      <coneGeometry args={[0.07, 0.26, 5]} />
      <meshStandardMaterial roughness={0.9} flatShading />
      {tufts.map((t, i) => (
        <Instance
          key={i}
          position={[t.x, snowy ? 0.07 : 0.11, t.z]}
          rotation={[0, t.r, 0]}
          scale={snowy ? [t.s * 1.5, t.s * 0.5, t.s * 1.5] : [t.s, t.s, t.s]}
          color={snowy ? '#eef3f7' : t.c}
        />
      ))}
    </Instances>
  );
}

/** Lily pads floating on the moat, one draw call. */
export function LilyPads3D({ pads }: { pads: Array<{ x: number; z: number; s: number }> }) {
  if (!pads.length) return null;
  return (
    <Instances limit={pads.length} range={pads.length} castShadow={false}>
      <cylinderGeometry args={[0.18, 0.18, 0.03, 7]} />
      <meshStandardMaterial color="#3f7a4a" roughness={0.7} />
      {pads.map((p, i) => (
        <Instance key={i} position={[p.x, -0.07, p.z]} scale={[p.s, 1, p.s]} />
      ))}
    </Instances>
  );
}

/** A reed clump at the water's edge. */
export function Reed3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const n = 4 + (seed % 3);
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + seed;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.1, 0.22, Math.sin(a) * 0.1]} rotation={[0, 0, Math.cos(a) * 0.18]} castShadow>
            <cylinderGeometry args={[0.012, 0.02, 0.5, 4]} />
            <meshStandardMaterial color="#6a7a3a" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

/** A little sampan drifting and bobbing on the moat. */
export function SmallBoat3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const g = ref.current;
    if (!g) return;
    const t = s.clock.elapsedTime;
    g.position.y = -0.04 + Math.sin(t * 1.1 + seed) * 0.04;
    g.rotation.z = Math.sin(t * 0.9 + seed) * 0.05;
    g.rotation.x = Math.sin(t * 1.3 + seed) * 0.04;
  });
  return (
    <group ref={ref} position={[x, -0.04, z]} rotation={[0, seed, 0]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.4, 0.12, 1.0]} />
        <meshStandardMaterial color="#6e5230" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.0, 0.5]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.4, 0.1, 0.3]} />
        <meshStandardMaterial color="#6e5230" roughness={0.85} />
      </mesh>
      {/* awning hoop */}
      <mesh position={[0, 0.28, -0.1]} castShadow>
        <boxGeometry args={[0.36, 0.1, 0.36]} />
        <meshStandardMaterial color="#9a8050" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** A multi-eave pagoda (塔) — the city's vertical landmark. */
export function Pagoda3D({ x, z }: { x: number; z: number }) {
  const t = useT();
  const tiers = 5;
  const topY = 0.4 + tiers * 0.78;
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      {/* Stone base */}
      <mesh position={[0, 0.18, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.7, 0.36, 1.7]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      {Array.from({ length: tiers }).map((_, i) => {
        const y = 0.5 + i * 0.78;
        const w = 1.25 - i * 0.17;
        return (
          <group key={i}>
            <mesh position={[0, y, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, 0.6, w]} />
              <meshStandardMaterial color="#9c3a30" roughness={0.7} />
            </mesh>
            {/* windows on each face */}
            <mesh position={[0, y, w / 2 + 0.01]}>
              <boxGeometry args={[w * 0.32, 0.26, 0.03]} />
              <meshStandardMaterial color="#241c14" roughness={0.6} />
            </mesh>
            <group position={[0, y + 0.34, 0]}>
              <ChineseRoof3D size={w} color="#2f3a48" beasts />
            </group>
          </group>
        );
      })}
      {/* Gilded finial */}
      <mesh position={[0, topY + 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.5, 7]} />
        <meshStandardMaterial color="#d8b450" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, topY + 0.42, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#e8c860" metalness={0.6} roughness={0.35} />
      </mesh>
      <Html position={[0, topY + 0.7, 0]} center distanceFactor={11} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.8)', border: '1px solid #c19a3b', padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: '#e0c060', borderRadius: 'var(--tkm-radius-xs)', whiteSpace: 'nowrap' }}>
          {t('寶塔', 'Pagoda')}
        </div>
      </Html>
    </group>
  );
}

/** A banner on a short pole — strung along the wall-walk at intervals. */
export function WallBanner3D({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      <mesh position={[0, 1.85, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <group position={[0, 1.98, 0]}>
        <Banner3D color={color} w={0.22} h={0.55} phase={x * 1.3 + z} faceX={0.11} />
      </group>
    </group>
  );
}

/** A 牌坊 memorial archway straddling the main avenue. */
export function Paifang3D({ x, z }: { x: number; z: number }) {
  const pillars = [-1.1, -0.4, 0.4, 1.1];
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      {pillars.map((px, i) => (
        <group key={i}>
          <mesh position={[px, 0.13, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.26, 0.34]} />
            <meshStandardMaterial color="#8f8472" roughness={0.92} />
          </mesh>
          <mesh position={[px, 1.05, 0]} castShadow>
            <boxGeometry args={[0.16, 1.9, 0.16]} />
            <meshStandardMaterial color="#9c3a30" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Lintels */}
      <mesh position={[0, 1.68, 0]} castShadow>
        <boxGeometry args={[2.5, 0.13, 0.2]} />
        <meshStandardMaterial color="#a84838" roughness={0.65} />
      </mesh>
      <mesh position={[0, 2.02, 0]} castShadow>
        <boxGeometry args={[2.5, 0.22, 0.24]} />
        <meshStandardMaterial color="#7a2820" roughness={0.7} />
      </mesh>
      {/* Gilded plaque */}
      <mesh position={[0, 1.86, 0.04]}>
        <boxGeometry args={[0.72, 0.26, 0.05]} />
        <meshStandardMaterial color="#caa24a" emissive="#5a4010" emissiveIntensity={0.3} roughness={0.5} />
      </mesh>
      {/* Tiered roofs — tall centre, lower sides */}
      <group position={[0, 2.28, 0]}><ChineseRoof3D size={1.05} color="#2f3a48" ornament beasts /></group>
      <group position={[-1.1, 1.95, 0]}><ChineseRoof3D size={0.5} color="#2f3a48" /></group>
      <group position={[1.1, 1.95, 0]}><ChineseRoof3D size={0.5} color="#2f3a48" /></group>
    </group>
  );
}

/** A 鼓樓 drum tower — stone arch base, a great red drum, double-eave roof. */
export function DrumTower3D({ x, z }: { x: number; z: number }) {
  const t = useT();
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      {/* Stone base with an arched passage */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.0, 1.6]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.44, 0.81]}>
        <boxGeometry args={[0.5, 0.72, 0.05]} />
        <meshStandardMaterial color="#241c14" roughness={0.6} />
      </mesh>
      {/* Upper pavilion */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.9, 1.3]} />
        <meshStandardMaterial color="#9c3a30" roughness={0.7} />
      </mesh>
      {[-0.5, -0.17, 0.17, 0.5].map((px, i) => (
        <mesh key={i} position={[px, 1.5, 0.66]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 7]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* The great drum */}
      <mesh position={[0, 1.5, 0.42]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.34, 16]} />
        <meshStandardMaterial color="#b83020" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.5, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.31, 0.31, 0.1, 16]} />
        <meshStandardMaterial color="#e0c060" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Double-eave roof */}
      <group position={[0, 2.0, 0]}><ChineseRoof3D size={1.45} color="#2f3a48" ornament beasts /></group>
      <group position={[0, 2.45, 0]}><ChineseRoof3D size={0.95} color="#2f3a48" ornament /></group>
      <Html position={[0, 3.0, 0]} center distanceFactor={11} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.8)', border: '1px solid #c19a3b', padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: '#e0c060', borderRadius: 'var(--tkm-radius-xs)', whiteSpace: 'nowrap' }}>
          {t('鼓樓', 'Drum Tower')}
        </div>
      </Html>
    </group>
  );
}

/** A 鐘樓 bell tower — open upper storey with a great bronze bell slung from a
 *  beam, mirroring the drum tower (晨鐘暮鼓). */
export function BellTower3D({ x, z }: { x: number; z: number }) {
  const t = useT();
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      {/* Stone arch base */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.0, 1.6]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.44, 0.81]}>
        <boxGeometry args={[0.5, 0.72, 0.05]} />
        <meshStandardMaterial color="#241c14" roughness={0.6} />
      </mesh>
      {/* Open upper storey — four red columns */}
      {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 1.55, pz]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.0, 8]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* Hanging beam + bronze bell */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <boxGeometry args={[0.9, 0.09, 0.09]} />
        <meshStandardMaterial color="#4a3520" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.3, 0.5, 14]} />
        <meshStandardMaterial color="#8a6a3a" metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.88, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#6a4a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Double-eave roof */}
      <group position={[0, 2.15, 0]}><ChineseRoof3D size={1.45} color="#2f3a48" ornament beasts /></group>
      <group position={[0, 2.6, 0]}><ChineseRoof3D size={0.95} color="#2f3a48" ornament /></group>
      <Html position={[0, 3.15, 0]} center distanceFactor={11} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.8)', border: '1px solid #c19a3b', padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: '#e0c060', borderRadius: 'var(--tkm-radius-xs)', whiteSpace: 'nowrap' }}>
          {t('鐘樓', 'Bell Tower')}
        </div>
      </Html>
    </group>
  );
}

/** An open garden pavilion (亭) — stone base, red columns, low railing, a
 *  swept roof and a finial. */
export function Pavilion3D({ x, z }: { x: number; z: number }) {
  const corners: Array<[number, number]> = [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]];
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.15, 0.24, 1.15]} />
        <meshStandardMaterial color="#a89a78" roughness={0.92} />
      </mesh>
      {corners.map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.7, pz]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 1.0, 8]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* Low railing rails on three sides */}
      {[[0, -0.46, 1.0, 0.05], [-0.46, 0, 0.05, 1.0], [0.46, 0, 0.05, 1.0]].map((r, i) => (
        <mesh key={`rl${i}`} position={[r[0], 0.4, r[1]]}>
          <boxGeometry args={[r[2], 0.12, r[3]]} />
          <meshStandardMaterial color="#8a3a30" roughness={0.7} />
        </mesh>
      ))}
      <group position={[0, 1.22, 0]}><ChineseRoof3D size={1.15} color="#2f3a48" ornament beasts /></group>
      <mesh position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#e8c860" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** A classical garden — a pond with stone rim, lotus pads, a zig-zag plank
 *  bridge, a lakeside pavilion and a pair of willows. */
export function Garden3D({ x, z }: { x: number; z: number }) {
  const season = useContext(SeasonCtx);
  const frozen = season === 'winter';
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      {/* Pond water — frozen pale in winter */}
      <mesh position={[0, 0.0, 0]} receiveShadow>
        <boxGeometry args={[2.6, 0.12, 1.9]} />
        <meshStandardMaterial color={frozen ? '#cfe2ea' : '#2f6a86'} roughness={frozen ? 0.5 : 0.28} metalness={frozen ? 0.2 : 0.45} />
      </mesh>
      {/* Stone rim (four kerbs) */}
      {[[0, -1.02, 2.9, 0.18], [0, 1.02, 2.9, 0.18], [-1.42, 0, 0.18, 2.2], [1.42, 0, 0.18, 2.2]].map((r, i) => (
        <mesh key={i} position={[r[0], 0.1, r[1]]} castShadow receiveShadow>
          <boxGeometry args={[r[2], 0.2, r[3]]} />
          <meshStandardMaterial color="#9a8f78" roughness={0.94} />
        </mesh>
      ))}
      {/* Rim rocks */}
      {[[-1.1, -0.7], [1.2, 0.6], [-0.9, 0.8]].map(([rx, rz], i) => (
        <mesh key={`rk${i}`} position={[rx, 0.16, rz]} castShadow>
          <icosahedronGeometry args={[0.16 + (i % 2) * 0.05, 0]} />
          <meshStandardMaterial color="#7a7468" roughness={0.95} flatShading />
        </mesh>
      ))}
      {/* Lotus pads */}
      {[[-0.5, -0.3], [0.3, 0.2], [0.7, -0.4], [-0.2, 0.5]].map(([px, pz], i) => (
        <mesh key={`lp${i}`} position={[px, 0.07, pz]}>
          <cylinderGeometry args={[0.16, 0.16, 0.03, 7]} />
          <meshStandardMaterial color="#3f7a4a" roughness={0.7} />
        </mesh>
      ))}
      {/* Zig-zag plank bridge across the pond */}
      {[[-0.7, 0.35, 0.2], [0, 0.35, -0.1], [0.7, 0.35, 0.2]].map((b, i) => (
        <mesh key={`bz${i}`} position={[b[0], 0.16, b[2]]} rotation={[0, i === 1 ? 0.4 : -0.4, 0]} castShadow>
          <boxGeometry args={[0.8, 0.06, 0.3]} />
          <meshStandardMaterial color="#8a3a30" roughness={0.7} />
        </mesh>
      ))}
      {/* Lakeside pavilion + two willows */}
      <Pavilion3D x={1.35} z={-0.9} />
      <GardenTree3D x={-1.3} z={0.95} seed={3} />
      <GardenTree3D x={1.4} z={1.0} seed={11} />
    </group>
  );
}

/** A 屯田 farm plot — tilled rows of crops (green sprouts → gold harvest →
 *  bare winter soil), a scarecrow and a farmhand. */
export function Farmland3D({ x, z, lush = 0.5 }: { x: number; z: number; lush?: number }) {
  const t = useT();
  const season = useContext(SeasonCtx);
  const crop = season === 'winter' ? '#cdd6dc' : season === 'autumn' ? '#cba63a' : season === 'summer' ? '#9aa83a' : '#6a9a4a';
  const soil = season === 'winter' ? '#6f6a60' : '#5a4530';
  // More productive farms (higher agriculture) sprout denser, taller rows.
  const rows = Math.max(3, Math.min(7, Math.round(3 + lush * 4)));
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[3.0, 0.1, 2.2]} />
        <meshStandardMaterial color={soil} roughness={0.97} />
      </mesh>
      {Array.from({ length: rows }).map((_, i) => {
        const rz = -0.85 + (i * 1.7) / (rows - 1);
        return (
          <group key={i}>
            <mesh position={[0, 0.13, rz]} receiveShadow>
              <boxGeometry args={[2.8, 0.09, 0.2]} />
              <meshStandardMaterial color={shade(soil, 1.25)} roughness={0.95} />
            </mesh>
            {season !== 'winter' && Array.from({ length: 7 }).map((_, j) => (
              <mesh key={j} position={[-1.2 + j * 0.4, 0.26, rz]} castShadow>
                <coneGeometry args={[0.07, 0.3, 5]} />
                <meshStandardMaterial color={crop} roughness={0.85} flatShading />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* Scarecrow */}
      <group position={[1.25, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.03, 0.03, 1.0, 5]} /><meshStandardMaterial color="#6a5030" /></mesh>
        <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.025, 0.025, 0.7, 5]} /><meshStandardMaterial color="#6a5030" /></mesh>
        <mesh position={[0, 0.93, 0]} castShadow><sphereGeometry args={[0.1, 8, 7]} /><meshStandardMaterial color="#c8a060" roughness={0.9} /></mesh>
        <mesh position={[0, 1.02, 0]}><coneGeometry args={[0.17, 0.13, 8]} /><meshStandardMaterial color="#9a8050" /></mesh>
      </group>
      <Villager3D x={-1.15} z={0.95} seed={88} />
      <Html position={[0, 1.2, 0]} center distanceFactor={11} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.78)', border: '1px solid #7a8a3a', padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: '#bcd07a', borderRadius: 'var(--tkm-radius-xs)', whiteSpace: 'nowrap' }}>
          {t('屯田', 'Farmland')}
        </div>
      </Html>
    </group>
  );
}

/** 焦土 — charred rubble mounds, broken beams and pillars of ruin-smoke laid
 *  over a razed city, on a sampling of its former house plots. */
export function RuinsOverlay({ houses }: { houses: Array<{ x: number; z: number; seed: number; key: string }> }) {
  const sample = houses.filter((_, i) => i % 3 === 0).slice(0, RENDER_HI ? 14 : 8);
  return (
    <>
      {sample.map((h) => (
        <group key={`rb-${h.key}`} position={[h.x, 0, h.z]} rotation={[0, (h.seed % 6) * 0.5, 0]}>
          <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.7 + (h.seed % 3) * 0.1, 0.34, 0.6]} />
            <meshStandardMaterial color="#3a322a" roughness={1} />
          </mesh>
          <mesh position={[0.2, 0.42, 0.1]} rotation={[0, 0, 0.7]} castShadow>
            <boxGeometry args={[0.06, 0.7, 0.06]} />
            <meshStandardMaterial color="#241c14" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {sample.filter((_, i) => i % 4 === 0).map((h) => (
        <Smoke3D key={`rsm-${h.key}`} x={h.x} z={h.z} base={0.6} />
      ))}
    </>
  );
}

/** 名產 — a market consignment (stacked crates/sacks) tagged with the good's
 *  glyph; one adaptable prop stands in for all 15 regional specialties. */
export function SpecialtyProp3D({ specialty, x, z }: { specialty: SpecialtyDef; x: number; z: number }) {
  const tint = specialty.foodMul > 1 ? '#b89a52' : '#9a7a4a';
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow><boxGeometry args={[0.4, 0.36, 0.4]} /><meshStandardMaterial color={tint} roughness={0.9} /></mesh>
      <mesh position={[0.28, 0.14, 0.1]} castShadow><boxGeometry args={[0.3, 0.28, 0.3]} /><meshStandardMaterial color="#8a6a3a" roughness={0.92} /></mesh>
      <mesh position={[-0.1, 0.5, 0]} castShadow><boxGeometry args={[0.34, 0.3, 0.34]} /><meshStandardMaterial color={tint} roughness={0.9} /></mesh>
      <Html position={[0, 0.98, 0]} center distanceFactor={10} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.82)', border: '1px solid #caa24a', padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px', color: '#e8c46a', borderRadius: 'var(--tkm-radius-xs)', whiteSpace: 'nowrap' }}>
          {specialty.glyph} {specialty.zh}
        </div>
      </Html>
    </group>
  );
}

/** 駐軍旌旗 — a rank of force banners by the drill ground, more for a big
 *  garrison (a great host plants a forest of flags). */
export function GarrisonBanners3D({ x, z, troops, color }: { x: number; z: number; troops: number; color: string }) {
  // Each banner is a real draw call; cap lower on low-tier devices.
  const n = Math.max(0, Math.min(RENDER_HI ? 8 : 4, Math.round(troops / 12000)));
  if (n === 0) return null;
  return (
    <group position={[x, 0, z]} userData={BATCH_STATIC}>
      {Array.from({ length: n }, (_, i) => {
        const col = i % 4, row = Math.floor(i / 4);
        return <FlagPole3D key={i} x={-1.2 + col * 0.8} z={1.7 + row * 0.7} color={color} h={1.9} />;
      })}
    </group>
  );
}

/** A pulsing ground ring marking an active work-site (施政中). */
export function ActivityRing3D({ x, z, color }: { x: number; z: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const m = ref.current;
    if (!m) return;
    const t = s.clock.elapsedTime;
    const k = 0.78 + Math.sin(t * 2.2) * 0.16;
    m.scale.set(k, k, 1);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.3 + (Math.sin(t * 2.2) + 1) * 0.12;
  });
  return (
    <mesh ref={ref} position={[x, 0.08, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.85, 1.12, 30]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/** 施政中 — work-in-progress at a landmark: a pulsing ring, a pair of pacing
 *  hands, and a 「…中」 tag. `soldier` adds a spear rank (操演), `build` a small
 *  scaffold (築城). Driven purely off this city's pending orders. */
export function CommandActivity3D({ x, z, color, label, build = false, soldier = false }: {
  x: number; z: number; color: string; label: string; build?: boolean; soldier?: boolean;
}) {
  return (
    <group>
      <ActivityRing3D x={x} z={z} color={color} />
      {/* The pacing figures are the costly part (multi-mesh) — ring + tag carry
          the meaning, so low-tier devices keep those and drop the crowd. */}
      {RENDER_HI && <Walker3D ax={x - 0.85} az={z + 0.5} bx={x + 0.85} bz={z + 0.5} seed={Math.round(x * 13 + z * 7)} />}
      {RENDER_HI && <Walker3D ax={x + 0.7} az={z - 0.6} bx={x - 0.7} bz={z - 0.6} seed={Math.round(x * 5 + z * 17) + 3} />}
      {soldier && [-0.6, -0.2, 0.2, 0.6].map((px, i) => (
        <mesh key={i} position={[x + px, 0.55, z - 0.9]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.1, 5]} />
          <meshStandardMaterial color="#caa24a" roughness={0.6} />
        </mesh>
      ))}
      {build && (
        <group position={[x, 0, z - 0.2]}>
          {[[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]].map((p, i) => (
            <mesh key={i} position={[p[0], 0.55, p[1]]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 1.1, 5]} />
              <meshStandardMaterial color="#7a5a32" roughness={0.9} />
            </mesh>
          ))}
          {[0.45, 0.85].map((hh, i) => (
            <mesh key={`pl${i}`} position={[0, hh, 0]} castShadow>
              <boxGeometry args={[1.2, 0.06, 1.2]} />
              <meshStandardMaterial color="#8a6a3a" roughness={0.92} />
            </mesh>
          ))}
        </group>
      )}
      <Html position={[x, build ? 1.5 : 1.1, z]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(18,26,12,0.86)', border: `1px solid ${color}`, padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: '#dceec4', borderRadius: 'var(--tkm-radius-xs)', whiteSpace: 'nowrap' }}>
          {label}中
        </div>
      </Html>
    </group>
  );
}

/** Scatter dwellings across the inside-city land, leaving gaps for streets. */
