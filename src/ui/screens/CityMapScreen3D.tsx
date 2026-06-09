import { useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../game/state/store';
import {
  DEFENSE_BUILDINGS,
  type DefenseBuildingId,
  aggregateSlotEffects,
} from '../../game/data/defenseBuildings';
import { previewBattlefield } from '../../game/systems/tactical';
import { citySize } from '../../game/systems/citySize';
import { BUILDING_DEFS, BUILDING_DEFS_BY_ID } from '../../game/data/buildings';
import type { EntityId, BuildingId } from '../../game/types';
import { useLanguage } from '../i18n';
// Reuse the polished 3D primitives from the tactical battle scene so the
// city map matches its visual fidelity — terrain art, lighting, walls.
import {
  hexWorld,
  HEX_COL_STEP,
  HEX_ROW_STEP,
  HexTile,
  DefenseStructure,
} from './TacticalBattleScreen3D';

/**
 * 3D version of CityMapScreen — uses the same hex tile / lighting /
 * structure primitives as the live tactical battle, so what you see
 * planning defenses is what you get when sieged.
 */

const INSIDE_BUILDING_DEF: Record<BuildingId, { glyph: string; color: string; height: number; nameZh: string }> = {
  barracks: { glyph: '營', color: '#a87858', height: 1.4, nameZh: '兵營' },
  market:   { glyph: '市', color: '#d4a84a', height: 1.0, nameZh: '市場' },
  foundry:  { glyph: '鐵', color: '#7a6750', height: 1.5, nameZh: '鐵工坊' },
  academy:  { glyph: '書', color: '#88b7e8', height: 1.6, nameZh: '書院' },
  temple:   { glyph: '寺', color: '#c19a3b', height: 1.8, nameZh: '寺院' },
  farm:     { glyph: '田', color: '#b8c87a', height: 0.5, nameZh: '農田' },
  wall:     { glyph: '壁', color: '#5a4530', height: 0.8, nameZh: '城壁' },
  shipyard: { glyph: '渠', color: '#3a6a98', height: 1.0, nameZh: '船廠' },
};

/* ─── Inside-city building (3D block + roof + glyph label) ──────────── */
function InsideBuilding3D({ coord, buildingId, level }: {
  coord: { col: number; row: number };
  buildingId: BuildingId;
  level: number;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const def = INSIDE_BUILDING_DEF[buildingId];
  const h = def.height + level * 0.15;
  // Temple & academy get a gilded, ornamented roof; the rest tile-blue.
  const grand = buildingId === 'temple' || buildingId === 'academy';
  const roofColor = grand ? '#b9952f' : '#39444f';
  return (
    <group position={[x, 0, z]}>
      {/* Stone plinth */}
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.28, 0.18, 1.28]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      {/* Main block */}
      <mesh position={[0, h / 2 + 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, h, 1.05]} />
        <meshStandardMaterial color={def.color} roughness={0.7} />
      </mesh>
      {/* Front colonnade */}
      {[-0.36, -0.12, 0.12, 0.36].map((px, i) => (
        <mesh key={`col${i}`} position={[px, h / 2 + 0.18, 0.54]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, h, 7]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* Recessed windows along the front */}
      {[-0.3, 0.3].map((px, i) => (
        <mesh key={`win${i}`} position={[px, h * 0.6 + 0.18, 0.53]}>
          <boxGeometry args={[0.18, 0.2, 0.04]} />
          <meshStandardMaterial color="#241c14" roughness={0.6} />
        </mesh>
      ))}
      {/* Swept tiled roof */}
      <group position={[0, h + 0.18, 0]}>
        <ChineseRoof3D size={1.05} color={roofColor} ornament={grand} />
      </group>
      {/* Floating label */}
      <Html position={[0, h + 0.9, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(20, 14, 8, 0.85)',
          border: `1px solid ${def.color}`,
          padding: '1px 5px',
          fontFamily: 'Songti SC, serif',
          fontSize: '11px',
          color: def.color,
          textAlign: 'center',
          borderRadius: 2,
          whiteSpace: 'nowrap',
        }}>
          {def.nameZh} <span style={{ opacity: 0.7 }}>lv{level}</span>
        </div>
      </Html>
    </group>
  );
}

/* ─── Tower range ring (gold circle on the ground) ──────────────────── */
function RangeRing3D({ coord, range, color }: {
  coord: { col: number; row: number };
  range: number;
  color: string;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const radius = range * HEX_ROW_STEP * 0.95;
  return (
    <mesh position={[x, 0.22, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.05, radius, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ─── Available-slot marker (golden octagonal floor disc) ───────────── */
function SlotMarker3D({ coord, occupied }: {
  coord: { col: number; row: number };
  occupied: boolean;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  if (occupied) return null;
  return (
    <mesh position={[x, 0.22, z]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
      <ringGeometry args={[0.55, 0.78, 8]} />
      <meshBasicMaterial color="#d4a84a" transparent opacity={0.55} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ─── The full 3D scene ─────────────────────────────────────────────── */
/* ─── Perimeter wall + gate ──────────────────────────────────────────── */
/** A lightweight crenellated wall block (no per-segment banner/animation, so
 *  a full perimeter stays cheap on mobile). */
function WallSegment3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.3, 1.5]} />
        <meshStandardMaterial color="#6a5540" roughness={0.92} />
      </mesh>
      {[-0.5, 0, 0.5].map((px, i) => (
        <mesh key={i} position={[px, 1.4, 0]} castShadow>
          <boxGeometry args={[0.34, 0.3, 1.5]} />
          <meshStandardMaterial color="#7a6550" roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

/** A city gate — twin pillars, lintel, gatehouse roof, a wooden door and the
 *  force banner. Sits in the perimeter where a wall block would otherwise be. */
function CityGate3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
  return (
    <group position={[x, 0, z]}>
      {/* Gate pillars */}
      {[-0.55, 0.55].map((px, i) => (
        <mesh key={i} position={[px, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 1.8, 1.5]} />
          <meshStandardMaterial color="#6a5540" roughness={0.92} />
        </mesh>
      ))}
      {/* Lintel */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <boxGeometry args={[1.6, 0.4, 1.55]} />
        <meshStandardMaterial color="#7a6550" roughness={0.9} />
      </mesh>
      {/* Upper gatehouse storey (城樓) */}
      <mesh position={[0, 2.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.85, 1.2]} />
        <meshStandardMaterial color="#8a6a40" roughness={0.78} />
      </mesh>
      {[-0.55, -0.18, 0.18, 0.55].map((px, i) => (
        <mesh key={`c${i}`} position={[px, 2.0, 0.62]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 6]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* Swept double-eave gatehouse roof */}
      <group position={[0, 2.82, 0]}>
        <ChineseRoof3D size={1.7} color="#2f3a48" ornament beasts />
      </group>
      <group position={[0, 3.28, 0]}>
        <ChineseRoof3D size={1.15} color="#2f3a48" ornament beasts />
      </group>
      {/* Wooden door in the opening */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.62, 1.3, 0.16]} />
        <meshStandardMaterial color="#4a2f1a" roughness={0.8} />
      </mesh>
      {/* Pennant on the ridge */}
      <mesh position={[0, 4.05, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh position={[0.18, 4.18, 0]}>
        <boxGeometry args={[0.32, 0.34, 0.02]} />
        <meshStandardMaterial color={bannerColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** A taller corner tower (角樓) anchoring each corner of the wall ring. */
function CornerTower3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.75, 2.3, 1.75]} />
        <meshStandardMaterial color="#6a5540" roughness={0.92} />
      </mesh>
      {[[-0.62, -0.62], [0.62, -0.62], [-0.62, 0.62], [0.62, 0.62]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 2.45, pz]} castShadow>
          <boxGeometry args={[0.4, 0.36, 0.4]} />
          <meshStandardMaterial color="#7a6550" roughness={0.92} />
        </mesh>
      ))}
      {/* Swept tile roof */}
      <group position={[0, 2.62, 0]}>
        <ChineseRoof3D size={1.95} color="#33404e" ornament beasts />
      </group>
      {/* Flag mast + banner */}
      <mesh position={[0, 3.85, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh position={[0.22, 4.05, 0]}>
        <boxGeometry args={[0.4, 0.34, 0.02]} />
        <meshStandardMaterial color={bannerColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Surrounding water — a moat ringing the city, seen beyond the walls. */
function Moat3D({ W, H }: { W: number; H: number }) {
  const cx = (W * HEX_COL_STEP) / 2, cz = (H * HEX_ROW_STEP) / 2;
  return (
    <mesh position={[cx, -0.1, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[W * HEX_COL_STEP + 8, H * HEX_ROW_STEP + 8]} />
      <meshStandardMaterial color="#2c5882" roughness={0.35} metalness={0.45} />
    </mesh>
  );
}

/* ─── Building foundations (地基) — the CoC-style build plots ─────────── */
/** A regular sub-grid of buildable plots inside the wall ring. Deterministic
 *  so a city's layout is stable across views. */
function cityBuildPlots(W: number, H: number): Array<{ col: number; row: number }> {
  const plots: Array<{ col: number; row: number }> = [];
  for (let col = 2; col <= W - 3; col += 3) {
    for (let row = 2; row <= H - 3; row += 3) {
      plots.push({ col, row });
    }
  }
  return plots;
}

/** A raised stone foundation plinth. Empty plots show a gold "buildable" ring;
 *  tapping an empty one opens the build menu. */
function FoundationPlot3D({ x, z, occupied, selected, onClick }: {
  x: number; z: number; occupied: boolean; selected: boolean;
  onClick?: () => void;
}) {
  return (
    <group
      position={[x, 0, z]}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={!occupied && onClick ? (e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; } : undefined}
      onPointerOut={!occupied && onClick ? () => { document.body.style.cursor = 'default'; } : undefined}
    >
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.35, 0.18, 1.35]} />
        <meshStandardMaterial color={occupied ? '#7a6a52' : selected ? '#cdb888' : '#9a8a68'} roughness={0.96} />
      </mesh>
      {!occupied && (
        <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <ringGeometry args={[0.42, 0.56, 4]} />
          <meshBasicMaterial color={selected ? '#ffe9a8' : '#d4a84a'} transparent opacity={selected ? 0.85 : 0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
      {selected && (
        <mesh position={[0, 0.75, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.22, 0.4, 4]} />
          <meshStandardMaterial color="#ffe9a8" emissive="#d4a84a" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

/** Scaffolding shown on a plot whose building is still under construction
 *  (level 0, progress > 0) — wooden frame + a 建造中 banner. */
function ConstructionSite3D({ x, z, nameZh }: { x: number; z: number; nameZh: string }) {
  const posts: Array<[number, number]> = [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]];
  return (
    <group position={[x, 0, z]}>
      {/* Stacked-stone base under construction */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.5, 0.95]} />
        <meshStandardMaterial color="#8a7558" roughness={0.95} />
      </mesh>
      {/* Scaffold posts */}
      {posts.map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.55, pz]} castShadow>
          <boxGeometry args={[0.08, 1.1, 0.08]} />
          <meshStandardMaterial color="#6e5230" roughness={0.9} />
        </mesh>
      ))}
      {/* Cross beams */}
      <mesh position={[0, 1.0, -0.45]} castShadow>
        <boxGeometry args={[1.0, 0.07, 0.07]} />
        <meshStandardMaterial color="#7a5e38" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.0, 0.45]} castShadow>
        <boxGeometry args={[1.0, 0.07, 0.07]} />
        <meshStandardMaterial color="#7a5e38" roughness={0.9} />
      </mesh>
      <Html position={[0, 1.5, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(20, 14, 8, 0.85)', border: '1px solid #c19a3b',
          padding: '1px 5px', fontFamily: 'Songti SC, serif', fontSize: '11px',
          color: '#e0c060', whiteSpace: 'nowrap', borderRadius: 2,
        }}>
          🔨 {nameZh}·建造中
        </div>
      </Html>
    </group>
  );
}

/* ─── Living-city decoration — earthen dwellings + a central 府衙 ─────── */
function dwellingHash(col: number, row: number): number {
  let h = (col * 73856093) ^ (row * 19349663);
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}
const HOUSE_WALL = ['#c8b48a', '#bfa980', '#cdbb95', '#b8a276', '#d0bd97'];
const HOUSE_ROOF = ['#3a2818', '#46342a', '#2f4a55', '#403020', '#34404a'];
// Terrains a house can't sit on.
const NO_BUILD_TERRAIN = new Set(['river', 'water', 'lake', 'sea', 'mountain', 'deep-water']);
// Wilderness flattened to level city ground (no mountains/hills/trees inside
// the walls); standing water is kept as the odd pond.
const WILDERNESS_TERRAIN = new Set(['mountain', 'hill', 'forest', 'wetland', 'river', 'marsh', 'rocky']);

// Per-season lighting mood for the city view. The game advances by season (no
// wall-clock), so each season also carries a characteristic sun angle —
// spring soft-morning, summer high-noon, autumn low golden-hour, winter pale
// low — which gives every season its own shadow length/direction and a
// distinct time-of-day feel.
type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';
const SEASON_LIGHT: Record<SeasonKey, { ambient: number; ambientColor: string; sun: string; sunI: number; sunPos: [number, number, number]; fog: string; sky: string }> = {
  spring: { ambient: 0.62, ambientColor: '#fdf3e0', sun: '#fff0d8', sunI: 1.2, sunPos: [10, 17, 8], fog: '#bcd2e4', sky: 'linear-gradient(180deg, #6f9fd8 0%, #a8c8e0 100%)' },
  summer: { ambient: 0.72, ambientColor: '#fffaf0', sun: '#fff8e8', sunI: 1.5, sunPos: [6, 23, 4], fog: '#c8dcec', sky: 'linear-gradient(180deg, #4f93d8 0%, #9fc8ee 100%)' },
  autumn: { ambient: 0.55, ambientColor: '#f6e6c4', sun: '#ffd49a', sunI: 1.08, sunPos: [15, 10, 6], fog: '#d8c6a4', sky: 'linear-gradient(180deg, #b8946a 0%, #e0c89a 100%)' },
  winter: { ambient: 0.5, ambientColor: '#e8f0f8', sun: '#e8eef8', sunI: 0.82, sunPos: [12, 9, -4], fog: '#cdd8e6', sky: 'linear-gradient(180deg, #8aa6c0 0%, #cdd9e6 100%)' },
};

/** Multiply an #rrggbb colour by a factor (>1 lightens, <1 darkens). Cheap
 *  helper so ridges/eaves can be tinted off a base roof colour. */
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/** A swept Chinese hip roof (廡殿頂) from opaque primitives — overhanging eave
 *  slab + 4-sided pyramid + ridge beam + upturned corner tips, optional 鴟吻
 *  ridge-end ornaments. Caller positions the group at eave height. */
function ChineseRoof3D({ size, color, ornament = false, beasts = false }: {
  size: number; color: string; ornament?: boolean; beasts?: boolean;
}) {
  const eave = size + 0.3;
  const roofH = 0.26 + eave * 0.16;
  const ridgeC = shade(color, 1.4);
  return (
    <group>
      {/* Overhanging eave slab — the shadow line */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[eave, 0.1, eave]} />
        <meshStandardMaterial color={shade(color, 0.85)} roughness={0.66} metalness={0.12} />
      </mesh>
      {/* Hip roof body */}
      <mesh position={[0, roofH / 2 + 0.08, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[eave * 0.72, roofH, 4]} />
        <meshStandardMaterial color={color} roughness={0.62} metalness={0.16} />
      </mesh>
      {/* Main ridge beam */}
      <mesh position={[0, roofH + 0.05, 0]} castShadow>
        <boxGeometry args={[eave * 0.5, 0.09, 0.12]} />
        <meshStandardMaterial color={ridgeC} roughness={0.55} />
      </mesh>
      {/* Upturned corner tips */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * eave * 0.45, 0.13, sz * eave * 0.45]} rotation={[sz * 0.5, 0, -sx * 0.5]} castShadow>
          <coneGeometry args={[0.08, 0.24, 4]} />
          <meshStandardMaterial color={ridgeC} roughness={0.6} />
        </mesh>
      ))}
      {/* 鴟吻 ridge-end ornaments for important halls */}
      {ornament && [-1, 1].map((s, i) => (
        <mesh key={`o${i}`} position={[s * eave * 0.24, roofH + 0.16, 0]} rotation={[0, 0, s * 0.5]}>
          <coneGeometry args={[0.07, 0.22, 4]} />
          <meshStandardMaterial color="#d8b450" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      {/* Ridge beasts (脊獸) marching down the ridge of grand roofs */}
      {beasts && [-0.16, 0, 0.16].map((px, i) => (
        <mesh key={`b${i}`} position={[px * eave, roofH + 0.11, 0]} castShadow>
          <coneGeometry args={[0.04, 0.13, 5]} />
          <meshStandardMaterial color={shade(color, 1.7)} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** A townhouse with real detail — stone plinth, plastered walls with timber
 *  corner posts, a door, recessed windows and a swept tiled roof. Three
 *  archetypes (cottage / merchant house / two-storey) chosen by hash. */
function Dwelling({ x, z, seed }: { x: number; z: number; seed: number }) {
  const wall = HOUSE_WALL[seed % HOUSE_WALL.length];
  const roof = HOUSE_ROOF[(seed >> 3) % HOUSE_ROOF.length];
  const type = (seed >> 6) % 3;
  const w = 0.6 + (seed % 3) * 0.06;
  const bodyH = 0.4 + ((seed >> 2) % 3) * 0.08;
  const rot = ((seed >> 4) % 4) * (Math.PI / 12);
  const post = '#5a4530';
  const front = w / 2 + 0.01;
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* Stone plinth */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.18, 0.12, w + 0.18]} />
        <meshStandardMaterial color="#8d8270" roughness={0.96} />
      </mesh>
      {/* Plastered walls */}
      <mesh position={[0, bodyH / 2 + 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, w]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
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
        <meshStandardMaterial color="#2a2018" roughness={0.6} />
      </mesh>
      {type >= 1 && (
        <mesh position={[-w * 0.28, bodyH * 0.66 + 0.12, front]}>
          <boxGeometry args={[0.14, 0.14, 0.04]} />
          <meshStandardMaterial color="#2a2018" roughness={0.6} />
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
            <meshStandardMaterial color={wall} roughness={0.9} />
          </mesh>
          <mesh position={[0, bodyH + 0.42, w * 0.39 + 0.01]}>
            <boxGeometry args={[0.13, 0.13, 0.04]} />
            <meshStandardMaterial color="#2a2018" roughness={0.6} />
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
function StoneLion3D({ x, z, faceZ }: { x: number; z: number; faceZ: number }) {
  const stone = '#b9b1a0';
  return (
    <group position={[x, 0, z]} rotation={[0, faceZ > 0 ? 0 : Math.PI, 0]}>
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
function FlagPole3D({ x, z, color, h = 2.4 }: { x: number; z: number; color: string; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, h, 6]} />
        <meshStandardMaterial color="#2a2018" roughness={0.8} />
      </mesh>
      <mesh position={[0, h - 0.02, 0]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#d4a84a" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Vertical hanging banner */}
      <mesh position={[0.16, h - 0.5, 0]} castShadow>
        <boxGeometry args={[0.26, 0.8, 0.03]} />
        <meshStandardMaterial color={color} roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** The seat of government — a grand double-eave hall on a stepped platform,
 *  flanked by stone lions and banner poles. */
function GovernmentHall3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
  return (
    <group position={[x, 0, z]}>
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
      {/* Guardian lions + banner poles flanking the steps */}
      <StoneLion3D x={-0.7} z={1.15} faceZ={1} />
      <StoneLion3D x={0.7} z={1.15} faceZ={1} />
      <FlagPole3D x={-1.5} z={1.4} color={bannerColor} />
      <FlagPole3D x={1.5} z={1.4} color={bannerColor} />
      <Html position={[0, 2.7, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.85)', border: '1px solid #d4a84a', padding: '1px 6px', fontFamily: 'Songti SC, serif', fontSize: '11px', color: '#f0d98a', borderRadius: 2, whiteSpace: 'nowrap' }}>
          府衙
        </div>
      </Html>
    </group>
  );
}

/** A stylised low-poly garden tree — leafy, blossom or pine by hash. */
function GardenTree3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const s = 0.82 + (seed % 4) * 0.08;
  const type = (seed >> 5) % 5; // 0-2 leafy, 3 blossom, 4 pine
  const trunk = (
    <mesh position={[0, 0.35, 0]} castShadow>
      <cylinderGeometry args={[0.09, 0.13, 0.7, 6]} />
      <meshStandardMaterial color="#5a3f28" roughness={0.9} />
    </mesh>
  );
  if (type === 4) {
    // Pine — three stacked cones.
    return (
      <group position={[x, 0, z]} scale={[s, s, s]}>
        {trunk}
        {[[0.7, 0.55], [1.05, 0.42], [1.35, 0.3]].map(([y, r], i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <coneGeometry args={[r, 0.5, 7]} />
            <meshStandardMaterial color="#2f5530" roughness={0.85} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  const canopy = type === 3 ? '#e6a8c8' : ['#3f6a32', '#4a7a3a', '#356030'][(seed >> 2) % 3];
  return (
    <group position={[x, 0, z]} scale={[s, s, s]}>
      {trunk}
      <mesh position={[0, 0.98, 0]} castShadow>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={canopy} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.2, 0.76, 0.08]} castShadow>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color={canopy} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.18, 0.78, -0.1]} castShadow>
        <icosahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color={shade(canopy, 0.9)} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

/** A warm street lantern — post + glowing lamp + cap. */
function Lantern3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.8, 6]} />
        <meshStandardMaterial color="#2a1d12" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.2, 0.26, 0.2]} />
        <meshStandardMaterial color="#d4502a" emissive="#e07020" emissiveIntensity={0.6} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.08, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.18, 0.12, 4]} />
        <meshStandardMaterial color="#2a1d12" />
      </mesh>
    </group>
  );
}

/** A flat flagstone tile — paving the streets between buildings. */
function StonePath3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const shade = ['#8f8470', '#857a66', '#968b76', '#7e7460'][seed % 4];
  return (
    <mesh position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <boxGeometry args={[1.28, 1.28, 0.08]} />
      <meshStandardMaterial color={shade} roughness={0.98} />
    </mesh>
  );
}

/** A market stall — counter, posts, a coloured awning and a crate of goods. */
function MarketStall3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const awning = ['#b8442e', '#3a6a98', '#c19a3b', '#5a8a3a', '#8a3a7a'][seed % 5];
  return (
    <group position={[x, 0, z]} rotation={[0, (seed % 4) * (Math.PI / 8), 0]}>
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
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.5, 0.16, 0.32]} />
        <meshStandardMaterial color="#c8a060" roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ─── Street life — villagers, props, water features ─────────────────── */
const ROBE = ['#b8442e', '#3a6a98', '#5a8a3a', '#8a6a40', '#7a4a8a', '#c2a23a', '#4a6a6a', '#a85838'];
const FLOWER = ['#d24a6a', '#e0a83a', '#c85ad0', '#e85a3a', '#f0d040', '#e86aa0'];

/** A tiny townsfolk figure — robe, head, conical hat or topknot. Static. */
function Villager3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const robe = ROBE[seed % ROBE.length];
  const rot = (seed % 8) * (Math.PI / 4);
  const hat = (seed >> 3) % 2 === 0;
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
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
function Well3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
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
function Cart3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const rot = (seed % 4) * (Math.PI / 5);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
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

/** A glowing brazier (opaque emissive coals — no transparency). */
function Brazier3D({ x, z }: { x: number; z: number }) {
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
        <meshStandardMaterial color="#e0641e" emissive="#ff7a1e" emissiveIntensity={1.1} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <coneGeometry args={[0.08, 0.2, 7]} />
        <meshStandardMaterial color="#ffb43a" emissive="#ff8a1e" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

/** A raised flower bed — soil box, greenery and bright blossoms. */
function FlowerBed3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  return (
    <group position={[x, 0, z]}>
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
function StoneBridge3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
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

/** Hundreds of grass tufts in one draw call (instanced) — ground texture on
 *  the open earth between buildings. */
function GrassTufts3D({ tufts }: { tufts: Array<{ x: number; z: number; s: number; r: number; c: string }> }) {
  if (!tufts.length) return null;
  return (
    <Instances limit={tufts.length} range={tufts.length} castShadow={false} receiveShadow>
      <coneGeometry args={[0.07, 0.26, 5]} />
      <meshStandardMaterial roughness={0.9} flatShading />
      {tufts.map((t, i) => (
        <Instance key={i} position={[t.x, 0.11, t.z]} rotation={[0, t.r, 0]} scale={[t.s, t.s, t.s]} color={t.c} />
      ))}
    </Instances>
  );
}

/** Lily pads floating on the moat, one draw call. */
function LilyPads3D({ pads }: { pads: Array<{ x: number; z: number; s: number }> }) {
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
function Reed3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const n = 4 + (seed % 3);
  return (
    <group position={[x, 0, z]}>
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

/** A little sampan drifting on the moat. */
function SmallBoat3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  return (
    <group position={[x, -0.04, z]} rotation={[0, seed, 0]}>
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
function Pagoda3D({ x, z }: { x: number; z: number }) {
  const tiers = 5;
  const topY = 0.4 + tiers * 0.78;
  return (
    <group position={[x, 0, z]}>
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
        <div style={{ background: 'rgba(20,14,8,0.8)', border: '1px solid #c19a3b', padding: '0 5px', fontFamily: 'Songti SC, serif', fontSize: '10px', color: '#e0c060', borderRadius: 2, whiteSpace: 'nowrap' }}>
          寶塔
        </div>
      </Html>
    </group>
  );
}

/** A banner on a short pole — strung along the wall-walk at intervals. */
function WallBanner3D({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.85, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh position={[0.13, 1.95, 0]}>
        <boxGeometry args={[0.22, 0.55, 0.02]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.75} />
      </mesh>
    </group>
  );
}

/** Scatter dwellings across the inside-city land, leaving gaps for streets. */
function CityDwellings3D({ preview, cityWallCol, occupied, bannerColor }: {
  preview: ReturnType<typeof previewBattlefield>;
  cityWallCol: number;
  occupied: Set<string>;
  bannerColor: string;
}) {
  // A small market cluster near the centre — reserved before houses so nothing
  // overlaps it.
  const market = useMemo(() => {
    const W = preview.width, H = preview.height;
    const out: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const baseCol = Math.min(W - 2, Math.round(cityWallCol * 0.62));
    const baseRow = Math.max(1, Math.round(H * 0.6));
    for (const [dc, dr] of [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0]] as const) {
      const col = baseCol + dc, row = baseRow + dr;
      if (col < 1 || col >= W - 1 || row < 1 || row >= H - 1) continue;
      const key = `${col},${row}`;
      if (occupied.has(key)) continue;
      const [x, z] = hexWorld(col, row);
      out.push({ x, z, seed: dwellingHash(col, row), key });
    }
    return out;
  }, [preview.width, preview.height, cityWallCol, occupied]);

  const { houses, trees, paths, villagers, flowers, avenue, grass } = useMemo(() => {
    const houses: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const trees: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const paths: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const villagers: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const flowers: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const avenue: Array<{ x: number; z: number; key: string }> = [];
    const grass: Array<{ x: number; z: number; s: number; r: number; c: string }> = [];
    const GRASSC = ['#4a7a3a', '#3f6e34', '#56833f', '#5f8a44'];
    const sow = (cx: number, cz: number, seed: number) => {
      const n = 3 + (seed % 3);
      for (let i = 0; i < n && grass.length < 280; i++) {
        const a = seed * 0.7 + i * 2.4;
        grass.push({
          x: cx + Math.cos(a) * 0.42, z: cz + Math.sin(a * 1.3) * 0.42,
          s: 0.7 + ((seed >> i) % 3) * 0.18, r: a, c: GRASSC[(seed + i) % 4],
        });
      }
    };
    const marketKeys = new Set(market.map((m) => m.key));
    const W = preview.width, H = preview.height;
    // Main avenue straight in from the south gate — paved, kept clear of houses.
    const gateCol = Math.floor(W / 2);
    const avenueKeys = new Set<string>();
    for (let r = 1; r <= H - 2; r++) avenueKeys.add(`${gateCol},${r}`);
    for (const tile of preview.tiles) {
      const { col, row } = tile.coord;
      // Strictly inside the perimeter wall ring.
      if (col < 1 || col >= W - 1 || row < 1 || row >= H - 1) continue;
      if (NO_BUILD_TERRAIN.has(tile.terrain as string)) continue;
      const key = `${col},${row}`;
      if (occupied.has(key)) continue; // slots / buildings / foundations
      const [x, z] = hexWorld(col, row);
      if (avenueKeys.has(key)) { avenue.push({ x, z, key }); continue; } // main road
      if (marketKeys.has(key)) continue;
      const seed = dwellingHash(col, row);
      const bucket = seed % 100;
      if (bucket < 23 && paths.length < 34) paths.push({ x, z, seed, key });            // paved street
      else if (bucket < 56 && houses.length < 30) houses.push({ x, z, seed, key });     // houses
      else if (bucket < 73 && trees.length < 16) { trees.push({ x, z, seed, key }); sow(x, z, seed); } // gardens
      else if (bucket < 88 && villagers.length < 16) { villagers.push({ x, z, seed, key }); sow(x, z, seed); } // townsfolk
      else if (bucket < 95 && flowers.length < 9) flowers.push({ x, z, seed, key });    // flower beds
      else sow(x, z, seed);                                                              // open ground → grass
    }
    return { houses, trees, paths, villagers, flowers, avenue, grass };
  }, [preview, occupied, market]);

  const hall = useMemo(() => {
    const col = Math.max(1, Math.round(cityWallCol * 0.42));
    const row = Math.round(preview.height / 2);
    const [x, z] = hexWorld(col, row);
    return { x, z };
  }, [preview.height, cityWallCol]);

  // A few lanterns flanking the hall + just inside the gate.
  const lanterns = useMemo(() => {
    const W = preview.width, H = preview.height;
    const spots: Array<[number, number]> = [
      [Math.round(cityWallCol * 0.42) - 2, Math.round(H / 2)],
      [Math.round(cityWallCol * 0.42) + 2, Math.round(H / 2)],
      [Math.floor(W / 2), H - 3], // inside the south gate
    ];
    return spots.map(([c, r]) => {
      const cc = Math.max(1, Math.min(W - 2, c));
      const rr = Math.max(1, Math.min(H - 2, r));
      const [x, z] = hexWorld(cc, rr);
      return { x, z, key: `${cc},${rr}` };
    });
  }, [preview.width, preview.height, cityWallCol]);

  // Hero props clustered around the civic centre + market.
  const props = useMemo(() => {
    const braziers = [
      { x: hall.x - 1.8, z: hall.z + 1.8 },
      { x: hall.x + 1.8, z: hall.z + 1.8 },
    ];
    const m0 = market[0];
    const well = m0 ? { x: m0.x - 1.3, z: m0.z + 1.0 } : { x: hall.x + 2.6, z: hall.z + 1.7 };
    const cart = m0 ? { x: m0.x + 1.5, z: m0.z + 0.5, seed: m0.seed >> 1 } : null;
    const folk = market.slice(0, 4).map((m, i) => ({
      x: m.x + (i % 2 ? 0.72 : -0.72), z: m.z - 0.72, seed: (m.seed >> 2) + i * 7,
    }));
    // Pagoda landmark in a back corner, clear of the plot grid.
    const W = preview.width;
    const [pgx, pgz] = hexWorld(Math.max(3, W - 4), 3);
    const pagoda = { x: pgx, z: pgz };
    // Lanterns lining the main avenue (every other tile, both sides).
    const avenueLanterns: Array<{ x: number; z: number }> = [];
    avenue.forEach((a, i) => {
      if (i % 2 === 0) {
        avenueLanterns.push({ x: a.x - 0.92, z: a.z });
        avenueLanterns.push({ x: a.x + 0.92, z: a.z });
      }
    });
    return { braziers, well, cart, folk, pagoda, avenueLanterns };
  }, [hall, market, preview.width, preview.height, avenue]);

  return (
    <>
      {/* Main avenue first so other paving/props sit on top of it */}
      {avenue.map((a) => (
        <mesh key={`av-${a.key}`} position={[a.x, 0.045, a.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[1.46, 1.46, 0.07]} />
          <meshStandardMaterial color="#a89c84" roughness={0.97} />
        </mesh>
      ))}
      <GrassTufts3D tufts={grass} />
      {paths.map((p) => <StonePath3D key={`pa-${p.key}`} x={p.x} z={p.z} seed={p.seed} />)}
      {flowers.map((f) => <FlowerBed3D key={`fb-${f.key}`} x={f.x} z={f.z} seed={f.seed} />)}
      {houses.map((h) => <Dwelling key={`dw-${h.key}`} x={h.x} z={h.z} seed={h.seed} />)}
      {trees.map((tr) => <GardenTree3D key={`tr-${tr.key}`} x={tr.x} z={tr.z} seed={tr.seed} />)}
      {market.map((m) => <MarketStall3D key={`mk-${m.key}`} x={m.x} z={m.z} seed={m.seed} />)}
      {villagers.map((v) => <Villager3D key={`vl-${v.key}`} x={v.x} z={v.z} seed={v.seed} />)}
      {props.folk.map((v, i) => <Villager3D key={`mf-${i}`} x={v.x} z={v.z} seed={v.seed} />)}
      {props.cart && <Cart3D x={props.cart.x} z={props.cart.z} seed={props.cart.seed} />}
      <Well3D x={props.well.x} z={props.well.z} />
      {props.braziers.map((b, i) => <Brazier3D key={`bz-${i}`} x={b.x} z={b.z} />)}
      {lanterns.map((l) => <Lantern3D key={`ln-${l.key}`} x={l.x} z={l.z} />)}
      {props.avenueLanterns.map((l, i) => <Lantern3D key={`al-${i}`} x={l.x} z={l.z} />)}
      <Pagoda3D x={props.pagoda.x} z={props.pagoda.z} />
      <GovernmentHall3D x={hall.x} z={hall.z} bannerColor={bannerColor} />
    </>
  );
}

function CityScene({
  preview, slots, buildings, construction, plots, cityWallCol, bannerColor, light,
  selectedPlot, onPlotClick, hovered, onHover, onClick, showOverlays,
}: {
  preview: ReturnType<typeof previewBattlefield>;
  slots: ReturnType<typeof useGameStore.getState>['cities'][string]['buildSlots'];
  buildings: Array<{ coord: { col: number; row: number }; buildingId: BuildingId; level: number }>;
  construction: Array<{ coord: { col: number; row: number }; nameZh: string }>;
  plots: Array<{ col: number; row: number }>;
  cityWallCol: number;
  light: typeof SEASON_LIGHT[SeasonKey];
  bannerColor: string;
  selectedPlot: number | null;
  onPlotClick: (plotIndex: number) => void;
  hovered: { col: number; row: number } | null;
  onHover: (c: { col: number; row: number } | null) => void;
  onClick: (c: { col: number; row: number }) => void;
  showOverlays: boolean;
}) {
  const slotIndexAtHex = new Map<string, number>();
  preview.slotPositions.forEach((pos, idx) => slotIndexAtHex.set(`${pos.col},${pos.row}`, idx));
  const slotMap = new Map((slots ?? []).map((s) => [s.slot, s]));

  // Hexes that already hold something — a finished building OR a site under
  // construction. Empty foundations (not in this set) stay tappable to build.
  const buildingHexes = new Set([
    ...buildings.map((b) => `${b.coord.col},${b.coord.row}`),
    ...construction.map((c) => `${c.coord.col},${c.coord.row}`),
  ]);
  const occupiedHexes = new Set<string>();
  preview.slotPositions.forEach((pos) => occupiedHexes.add(`${pos.col},${pos.row}`));
  for (const b of buildings) occupiedHexes.add(`${b.coord.col},${b.coord.row}`);
  for (const p of plots) occupiedHexes.add(`${p.col},${p.row}`); // foundations

  // Tower range circles for visualization
  const towerRanges: Array<{ coord: { col: number; row: number }; range: number; color: string }> = [];
  for (const s of slots ?? []) {
    if (!s.buildingId) continue;
    const pos = preview.slotPositions[s.slot];
    if (!pos) continue;
    let range = 0; let color = '#d4a84a';
    switch (s.buildingId) {
      case 'watchtower':     range = 4; color = '#d4a84a'; break;
      case 'arrow-platform': range = 5; color = '#c19a3b'; break;
      case 'rockfall':       range = 1; color = '#4a3a30'; break;
      case 'caltrops':       range = 1; color = '#7a6750'; break;
      case 'iron-chains':    range = 1; color = '#3a6a98'; break;
    }
    if (range > 0) towerRanges.push({ coord: pos, range, color });
  }

  // Season-driven lighting mood.
  return (
    <>
      <ambientLight intensity={light.ambient * 0.7} color={light.ambientColor} />
      {/* Sky/ground hemisphere fill for richer ambient colour grading */}
      <hemisphereLight args={[light.ambientColor, '#6a5a3e', 0.45]} />
      <directionalLight
        position={light.sunPos} intensity={light.sunI} color={light.sun}
        castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.25} color={light.sun} />
      <fog attach="fog" args={[light.fog, 35, 80]} />

      {/* Terrain tiles — uses shared HexTile from tactical for full fidelity */}
      {preview.tiles.map((tile) => {
        const isHovered = !!hovered && hovered.col === tile.coord.col && hovered.row === tile.coord.row;
        const slotIdx = slotIndexAtHex.get(`${tile.coord.col},${tile.coord.row}`);
        return (
          <group
            key={`${tile.coord.col},${tile.coord.row}`}
            onPointerOver={(e) => { e.stopPropagation(); onHover(tile.coord); }}
            onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
          >
            <HexTile
              tile={tile}
              hovered={isHovered}
              highlight={slotIdx !== undefined && !slotMap.get(slotIdx)?.buildingId ? 'move' : undefined}
              windStrength={0.4}
              onClick={() => onClick(tile.coord)}
            />
          </group>
        );
      })}

      {/* Surrounding moat, seen beyond the walls. */}
      <Moat3D W={preview.width} H={preview.height} />

      {/* Moat life — lily pads, reed clumps, a drifting sampan */}
      {(() => {
        const W = preview.width, H = preview.height;
        const [ax, az] = hexWorld(0, 0);
        const [bx, bz] = hexWorld(W - 1, H - 1);
        const minX = Math.min(ax, bx), maxX = Math.max(ax, bx);
        const minZ = Math.min(az, bz), maxZ = Math.max(az, bz);
        const pads: Array<{ x: number; z: number; s: number }> = [];
        const N = 10;
        for (let i = 0; i < N; i++) {
          const t = i / (N - 1);
          const s1 = i * 97 + 11, s2 = i * 53 + 29;
          pads.push({ x: minX - 1.7 - (s1 % 8) * 0.12, z: minZ + t * (maxZ - minZ) + ((s1 % 7) - 3) * 0.18, s: 0.7 + (s1 % 4) * 0.14 });
          pads.push({ x: maxX + 1.7 + (s2 % 8) * 0.12, z: minZ + t * (maxZ - minZ) + ((s2 % 7) - 3) * 0.18, s: 0.7 + (s2 % 4) * 0.14 });
          pads.push({ x: minX + t * (maxX - minX) + ((s2 % 7) - 3) * 0.18, z: minZ - 1.7 - (s1 % 8) * 0.12, s: 0.7 + (s1 % 3) * 0.16 });
        }
        const reeds = [
          { x: minX - 1.5, z: minZ - 1.3, seed: 2 },
          { x: maxX + 1.5, z: minZ - 1.3, seed: 5 },
          { x: minX - 1.5, z: maxZ + 1.3, seed: 8 },
        ];
        return (
          <>
            <LilyPads3D pads={pads} />
            {reeds.map((r, i) => <Reed3D key={`rd-${i}`} x={r.x} z={r.z} seed={r.seed} />)}
            <SmallBoat3D x={minX - 2.1} z={(minZ + maxZ) / 2} seed={1.2} />
          </>
        );
      })()}

      {/* City walls — full perimeter ring, towers at the corners, gate south. */}
      {(() => {
        const W = preview.width, H = preview.height;
        const gateCol = Math.floor(W / 2), gateRow = H - 1;
        const corners = new Set([`0,0`, `${W - 1},0`, `0,${H - 1}`, `${W - 1},${H - 1}`]);
        const segs: Array<{ col: number; row: number }> = [];
        for (let c = 0; c < W; c++) { segs.push({ col: c, row: 0 }); segs.push({ col: c, row: H - 1 }); }
        for (let r = 1; r < H - 1; r++) { segs.push({ col: 0, row: r }); segs.push({ col: W - 1, row: r }); }
        const [gx, gz] = hexWorld(gateCol, gateRow);
        return (
          <>
            {segs.filter((s) => !(s.col === gateCol && s.row === gateRow) && !corners.has(`${s.col},${s.row}`)).map((s) => {
              const [x, z] = hexWorld(s.col, s.row);
              return <WallSegment3D key={`wall-${s.col}-${s.row}`} x={x} z={z} />;
            })}
            {/* Banners flying from the wall-walk at intervals */}
            {segs.filter((s) => !corners.has(`${s.col},${s.row}`) && !(s.col === gateCol && s.row === gateRow) && (s.col + s.row) % 5 === 0).map((s) => {
              const [x, z] = hexWorld(s.col, s.row);
              return <WallBanner3D key={`wb-${s.col}-${s.row}`} x={x} z={z} color={bannerColor} />;
            })}
            {[...corners].map((c) => {
              const [col, row] = c.split(',').map(Number);
              const [x, z] = hexWorld(col, row);
              return <CornerTower3D key={`tower-${c}`} x={x} z={z} bannerColor={bannerColor} />;
            })}
            <CityGate3D x={gx} z={gz} bannerColor={bannerColor} />
            {/* Stone bridge crossing the moat out from the gate */}
            <StoneBridge3D x={gx} z={gz + 2.1} />
          </>
        );
      })()}

      {/* Slot markers — golden octagon discs showing buildable hexes */}
      {preview.slotPositions.map((pos, idx) => (
        <SlotMarker3D
          key={`slot-${idx}`}
          coord={pos}
          occupied={!!slotMap.get(idx)?.buildingId}
        />
      ))}

      {/* Building foundations (地基) — real buildings sit on their plots, empty
          ones show a gold buildable ring; tap one to open the build menu. */}
      {plots.map((p, i) => {
        const [x, z] = hexWorld(p.col, p.row);
        const occupied = buildingHexes.has(`${p.col},${p.row}`);
        return (
          <FoundationPlot3D
            key={`plot-${p.col}-${p.row}`}
            x={x} z={z}
            occupied={occupied}
            selected={selectedPlot === i}
            onClick={occupied ? undefined : () => onPlotClick(i)}
          />
        );
      })}

      {/* Buildings still under construction — scaffolding + 建造中 banner. */}
      {construction.map((c) => {
        const [x, z] = hexWorld(c.coord.col, c.coord.row);
        return <ConstructionSite3D key={`cons-${c.coord.col}-${c.coord.row}`} x={x} z={z} nameZh={c.nameZh} />;
      })}

      {/* Living-city dwellings + central 府衙 (cosmetic) */}
      <CityDwellings3D preview={preview} cityWallCol={cityWallCol} occupied={occupiedHexes} bannerColor={bannerColor} />

      {/* Inside-city buildings */}
      {buildings.map((b) => (
        <InsideBuilding3D
          key={`bld-${b.coord.col},${b.coord.row}`}
          coord={b.coord}
          buildingId={b.buildingId}
          level={b.level}
        />
      ))}

      {/* Defense structures on slots — reuse tactical's DefenseStructure */}
      {(slots ?? []).map((s) => {
        if (!s.buildingId) return null;
        const pos = preview.slotPositions[s.slot];
        if (!pos) return null;
        // Synthesize hp/maxHp from level for the shared component.
        const maxHp = 100 * s.level + 100;
        return (
          <DefenseStructure
            key={`def-${s.slot}`}
            coord={pos}
            buildingId={s.buildingId}
            level={s.level}
            hp={maxHp}
            maxHp={maxHp}
          />
        );
      })}

      {/* Range rings overlay */}
      {showOverlays && towerRanges.map((tr, i) => (
        <RangeRing3D key={`rr-${i}`} coord={tr.coord} range={tr.range} color={tr.color} />
      ))}
    </>
  );
}

/* ─── Top-level screen ──────────────────────────────────────────────── */
export function CityMapScreen3D({ cityId, onClose, onSwitch2D }: {
  cityId: EntityId;
  onClose: () => void;
  onSwitch2D: () => void;
}) {
  const city = useGameStore((s) => s.cities[cityId]);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const allBuildings = useGameStore((s) => s.buildings);
  const buildAction = useGameStore((s) => s.buildDefenseStructure);
  const upgradeAction = useGameStore((s) => s.upgradeDefenseStructure);
  const demolishAction = useGameStore((s) => s.demolishDefenseStructure);
  const startBuilding = useGameStore((s) => s.startBuilding);
  const season = useGameStore((s) => s.date.season) as SeasonKey;
  const light = SEASON_LIGHT[season] ?? SEASON_LIGHT.spring;
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [buildMsg, setBuildMsg] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{ col: number; row: number } | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lang = useLanguage();

  const rawPreview = useMemo(
    () => previewBattlefield(cityId, {
      terrain: city?.terrain, port: city?.port,
      x: city?.coords.x, y: city?.coords.y,
    }, 18, 13), // city view uses a roomier grid than a battle slice
    [cityId, city?.terrain, city?.port, city?.coords.x, city?.coords.y],
  );
  // Inside the walls the ground is a city, not a battlefield — flatten the
  // wilderness (mountains, hills, trees) to level ground, keeping only water
  // as the odd pond/canal.
  const preview = useMemo(() => ({
    ...rawPreview,
    tiles: rawPreview.tiles.map((tl) =>
      WILDERNESS_TERRAIN.has(tl.terrain as string) ? { ...tl, terrain: 'plain' as typeof tl.terrain } : tl,
    ),
  }), [rawPreview]);

  if (!city) return null;
  const isPlayer = city.ownerForceId === playerForceId;
  const slots = city.buildSlots ?? [];
  const size = citySize(city);
  const total = aggregateSlotEffects(slots);
  const builtCount = slots.filter((s) => s.buildingId).length;
  const cityWallCol = preview.width - 1;
  const ownerForce = city.ownerForceId ? forces[city.ownerForceId] : null;
  const bannerColor = ownerForce?.color ?? '#5a4530';

  const cityBuildingsAll = useMemo(
    () => allBuildings.filter((b) => b.cityId === cityId),
    [allBuildings, cityId],
  );
  // Buildable foundations (地基) inside the walls. Each building remembers the
  // plot it was placed on (b.plot); legacy/AI buildings without one fall back
  // to the first free plot in a deterministic order.
  const plots = useMemo(
    () => cityBuildPlots(preview.width, preview.height),
    [preview.width, preview.height],
  );
  const placed = useMemo(() => {
    const taken = new Set<number>();
    for (const b of cityBuildingsAll) if (typeof b.plot === 'number') taken.add(b.plot);
    let next = 0;
    const claim = () => { while (taken.has(next)) next++; taken.add(next); return next; };
    return cityBuildingsAll.map((b) => {
      const idx = typeof b.plot === 'number' ? b.plot : claim();
      return { building: b, plotIndex: idx, coord: plots[idx] };
    }).filter((p) => !!p.coord);
  }, [cityBuildingsAll, plots]);
  // Completed buildings get a real 3D block; in-progress ones (level 0,
  // progress > 0) show scaffolding so you can watch them go up.
  const insideBuildings = useMemo(
    () => placed.filter((p) => p.building.level > 0)
      .map((p) => ({ coord: p.coord, buildingId: p.building.id, level: p.building.level })),
    [placed],
  );
  const construction = useMemo(
    () => placed.filter((p) => p.building.level === 0 && p.building.progress > 0)
      .map((p) => ({ coord: p.coord, nameZh: INSIDE_BUILDING_DEF[p.building.id]?.nameZh ?? p.building.id })),
    [placed],
  );
  const presentTypes = useMemo(() => new Set(cityBuildingsAll.map((b) => b.id)), [cityBuildingsAll]);
  const plotByHex = useMemo(() => {
    const m = new Map<string, number>();
    plots.forEach((p, i) => m.set(`${p.col},${p.row}`, i));
    return m;
  }, [plots]);
  const buildingAtPlot = useMemo(() => {
    const m = new Map<number, typeof placed[number]['building']>();
    placed.forEach((p) => m.set(p.plotIndex, p.building));
    return m;
  }, [placed]);

  const slotIndexAtHex = useMemo(() => {
    const m = new Map<string, number>();
    preview.slotPositions.forEach((p, i) => m.set(`${p.col},${p.row}`, i));
    return m;
  }, [preview]);

  const handleTileClick = (coord: { col: number; row: number }) => {
    if (!isPlayer) return;
    const slotIdx = slotIndexAtHex.get(`${coord.col},${coord.row}`);
    if (slotIdx !== undefined) {
      setSelectedSlot(slotIdx);
      setSelectedPlot(null);
      setError(null);
      return;
    }
    // Tapping a foundation hex opens the build menu for that plot.
    const plotIdx = plotByHex.get(`${coord.col},${coord.row}`);
    if (plotIdx !== undefined) {
      handlePlotClick(plotIdx);
      return;
    }
    setSelectedSlot(null);
    setSelectedPlot(null);
  };

  const handlePlotClick = (plotIndex: number) => {
    if (!isPlayer) return;
    setSelectedSlot(null);
    setBuildMsg(null);
    setSelectedPlot(plotIndex);
  };

  const tryStartBuilding = (plotIndex: number, id: BuildingId) => {
    setBuildMsg(null);
    const r = startBuilding(cityId, id, plotIndex);
    if (!r.ok) {
      const reasons: Record<string, string> = {
        'not enough gold': '城内存金不足',
        'max level': '已達最高等級',
        'already in progress': '已在建造中',
        'not your city': '非我方城池',
      };
      setBuildMsg(reasons[r.reason ?? ''] ?? r.reason ?? '無法建造');
    } else {
      setSelectedPlot(null);
    }
  };

  const tryUpgradeBuilding = (id: BuildingId) => {
    setBuildMsg(null);
    const r = startBuilding(cityId, id);
    if (!r.ok) {
      const reasons: Record<string, string> = {
        'not enough gold': '城内存金不足',
        'max level': '已達最高等級',
        'already in progress': '已在建造中',
      };
      setBuildMsg(reasons[r.reason ?? ''] ?? r.reason ?? '無法升級');
    }
  };

  const tryBuild = (slot: number, id: DefenseBuildingId) => {
    setError(null);
    const r = buildAction(cityId, slot, id);
    if (!r.ok) setError(r.reason ?? 'Failed');
    else setSelectedSlot(null);
  };
  const tryUpgrade = (slot: number) => {
    setError(null);
    const r = upgradeAction(cityId, slot);
    if (!r.ok) setError(r.reason ?? 'Failed');
  };
  const tryDemolish = (slot: number) => {
    demolishAction(cityId, slot);
    setSelectedSlot(null);
  };

  const centerX = (preview.width * HEX_COL_STEP) / 2;
  const centerZ = (preview.height * HEX_ROW_STEP) / 2;

  const ALL_BUILDINGS: DefenseBuildingId[] = [
    'watchtower', 'beacon', 'caltrops', 'lookout',
    'barracks-out', 'granary-out',
    'iron-chains', 'rockfall', 'arrow-platform',
  ];

  const currentSlot = selectedSlot !== null ? slots.find((s) => s.slot === selectedSlot) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="tkm-city-enter" style={{
      position: 'fixed', inset: 0, background: '#0a0805', zIndex: 320,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header bar */}
      <header style={{
        padding: '0.6rem 1rem',
        background: 'linear-gradient(180deg, #1f1610 0%, rgba(31,22,16,0.85) 100%)',
        borderBottom: '1px solid #4a3520',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 10,
      }}>
        <div style={{ color: '#d4a84a', fontFamily: 'Songti SC, serif', letterSpacing: '0.3rem' }}>
          <span style={{ fontSize: '1.3rem' }}>{city.name.zh}</span>
          <span style={{ fontSize: '0.85rem', color: size.color, marginLeft: '0.6rem' }}>{size.name.zh}</span>
          <span style={{ fontSize: '0.7rem', color: '#8a7050', marginLeft: '0.8rem' }}>
            {builtCount}/8 防禦
            {total.defenseBonus > 0 && ` · +${total.defenseBonus} 守備`}
            {total.rangedPrestrike > 0 && ` · 預射 ${total.rangedPrestrike}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            style={{
              background: showOverlays ? 'rgba(212, 168, 74, 0.2)' : 'transparent',
              border: '1px solid #5a4530',
              color: showOverlays ? '#d4a84a' : '#8a7050',
              padding: '0.3rem 0.6rem',
              fontFamily: 'Songti SC, serif', fontSize: '0.7rem', cursor: 'pointer',
              letterSpacing: '0.1rem',
            }}
          >
            {showOverlays ? '✓' : ''} 戰術疊加
          </button>
          <button
            onClick={onSwitch2D}
            style={{
              background: '#1a3a5a', color: '#88b7e8',
              border: '1px solid #88b7e8', padding: '0.3rem 0.7rem',
              cursor: 'pointer', fontFamily: 'Songti SC, serif', fontSize: '0.7rem',
              letterSpacing: '0.1rem',
            }}
          >
            ⇄ 切換 2D
          </button>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#d4a84a',
            fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem',
          }}>×</button>
        </div>
      </header>

      {/* 3D canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ position: [centerX, 16, centerZ + 16], fov: 50 }}
          shadows
          style={{ background: light.sky }}
        >
          <CityScene
            preview={preview}
            slots={slots}
            buildings={insideBuildings}
            construction={construction}
            plots={plots}
            cityWallCol={cityWallCol}
            bannerColor={bannerColor}
            light={light}
            selectedPlot={selectedPlot}
            onPlotClick={handlePlotClick}
            hovered={hovered}
            onHover={setHovered}
            onClick={handleTileClick}
            showOverlays={showOverlays}
          />
          <OrbitControls
            target={[centerX, 0, centerZ]}
            enablePan
            maxPolarAngle={Math.PI / 2.2}
            minDistance={6}
            maxDistance={40}
          />
        </Canvas>

        {/* Slot editor overlay */}
        {selectedSlot !== null && isPlayer && (
          <div
            style={{
              position: 'absolute', right: 12, top: 12, width: 320,
              background: 'rgba(20, 14, 8, 0.95)',
              border: '1px solid #d4a84a',
              padding: '0.8rem',
              color: '#c0a878',
              fontFamily: 'Songti SC, serif',
              fontSize: '0.78rem',
              maxHeight: 'calc(100vh - 80px)',
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <div style={{ color: '#d4a84a', letterSpacing: '0.2rem' }}>
                {lang === 'en' ? `Slot ${selectedSlot + 1}` : `第 ${selectedSlot + 1} 號位`}
              </div>
              <button onClick={() => setSelectedSlot(null)} style={{
                background: 'transparent', border: 'none', color: '#8a7050', cursor: 'pointer',
              }}>×</button>
            </div>
            {currentSlot?.buildingId ? (
              <div>
                <div style={{ color: DEFENSE_BUILDINGS[currentSlot.buildingId].color, marginBottom: '0.3rem' }}>
                  {DEFENSE_BUILDINGS[currentSlot.buildingId].name.zh} lv{currentSlot.level}
                </div>
                <div style={{ color: '#8a7050', fontSize: '0.72rem', marginBottom: '0.5rem' }}>
                  {DEFENSE_BUILDINGS[currentSlot.buildingId].description}
                </div>
                {currentSlot.level < DEFENSE_BUILDINGS[currentSlot.buildingId].maxLevel && (
                  <button
                    onClick={() => tryUpgrade(selectedSlot)}
                    style={{
                      width: '100%', padding: '0.4rem',
                      background: '#1a3a5a', color: '#88b7e8',
                      border: '1px solid #88b7e8', marginBottom: '0.3rem',
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    升級 → lv{currentSlot.level + 1}
                  </button>
                )}
                <button
                  onClick={() => tryDemolish(selectedSlot)}
                  style={{
                    width: '100%', padding: '0.4rem',
                    background: '#3a1a1a', color: '#b8442e',
                    border: '1px solid #b8442e',
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  拆除
                </button>
              </div>
            ) : (
              <div>
                <div style={{ color: '#8a7050', marginBottom: '0.4rem' }}>選擇建築:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {ALL_BUILDINGS.map((id) => {
                    const def = DEFENSE_BUILDINGS[id];
                    return (
                      <button
                        key={id}
                        onClick={() => tryBuild(selectedSlot, id)}
                        title={def.description}
                        style={{
                          padding: '0.35rem 0.5rem',
                          background: 'rgba(212, 168, 74, 0.08)',
                          border: `1px solid ${def.color}`,
                          color: def.color,
                          fontFamily: 'inherit', fontSize: '0.75rem',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        {def.name.zh} <span style={{ float: 'right', opacity: 0.7 }}>{def.goldCost}g</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {error && (
              <div style={{ color: '#b8442e', marginTop: '0.4rem', fontSize: '0.72rem' }}>{error}</div>
            )}
          </div>
        )}

        {/* Build-menu overlay — opens when a foundation (地基) is tapped. */}
        {selectedPlot !== null && isPlayer && (() => {
          const existing = buildingAtPlot.get(selectedPlot);
          const buildable = BUILDING_DEFS.filter((d) => d.id !== 'wall' && !presentTypes.has(d.id));
          return (
            <div
              style={{
                position: 'absolute', right: 12, top: 12, width: 320,
                background: 'rgba(20, 14, 8, 0.95)',
                border: '1px solid #d4a84a',
                padding: '0.8rem',
                color: '#c0a878',
                fontFamily: 'Songti SC, serif',
                fontSize: '0.78rem',
                maxHeight: 'calc(100vh - 80px)',
                overflow: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ color: '#d4a84a', letterSpacing: '0.2rem' }}>
                  {existing ? '城内設施' : '營建新設施'}
                </div>
                <button onClick={() => setSelectedPlot(null)} style={{
                  background: 'transparent', border: 'none', color: '#8a7050', cursor: 'pointer',
                }}>×</button>
              </div>
              <div style={{ color: '#8a7050', fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                💰 城内存金 <span style={{ color: '#e0c060' }}>{city.gold}</span>
              </div>

              {existing ? (() => {
                const def = BUILDING_DEFS_BY_ID[existing.id];
                const vis = INSIDE_BUILDING_DEF[existing.id];
                const building = existing.progress > 0 && existing.level === 0;
                const upgrading = existing.progress > 0 && existing.level > 0;
                return (
                  <div>
                    <div style={{ color: vis?.color ?? '#d4a84a', marginBottom: '0.3rem' }}>
                      {vis?.nameZh ?? existing.id} lv{existing.level}
                      {building && <span style={{ color: '#e0c060', marginLeft: 6 }}>· 建造中</span>}
                      {upgrading && <span style={{ color: '#e0c060', marginLeft: 6 }}>· 升級中</span>}
                    </div>
                    <div style={{ color: '#8a7050', fontSize: '0.72rem', marginBottom: '0.5rem' }}>
                      {def?.descriptionZh}
                    </div>
                    {def && existing.level < def.maxLevel && existing.progress === 0 && (
                      <button
                        onClick={() => tryUpgradeBuilding(existing.id)}
                        style={{
                          width: '100%', padding: '0.45rem',
                          background: '#1a3a5a', color: '#88b7e8',
                          border: '1px solid #88b7e8',
                          fontFamily: 'inherit', cursor: 'pointer',
                        }}
                      >
                        升級 → lv{existing.level + 1}
                        <span style={{ float: 'right', opacity: 0.8 }}>{def.goldPerLevel}g · {def.seasonsPerLevel}季</span>
                      </button>
                    )}
                    {def && existing.level >= def.maxLevel && (
                      <div style={{ color: '#8a7050', textAlign: 'center', fontSize: '0.72rem' }}>已達最高等級</div>
                    )}
                  </div>
                );
              })() : (
                <div>
                  <div style={{ color: '#8a7050', marginBottom: '0.4rem' }}>選擇建築 → 蓋在此地基:</div>
                  {buildable.length === 0 && (
                    <div style={{ color: '#8a7050', textAlign: 'center', fontSize: '0.72rem' }}>所有設施已建齊</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
                    {buildable.map((def) => {
                      const vis = INSIDE_BUILDING_DEF[def.id];
                      const afford = city.gold >= def.goldPerLevel;
                      return (
                        <button
                          key={def.id}
                          onClick={() => tryStartBuilding(selectedPlot, def.id)}
                          disabled={!afford}
                          title={def.descriptionZh}
                          style={{
                            padding: '0.4rem 0.5rem',
                            background: 'rgba(212, 168, 74, 0.08)',
                            border: `1px solid ${vis?.color ?? '#5a4530'}`,
                            color: afford ? (vis?.color ?? '#c0a878') : '#6a5a44',
                            opacity: afford ? 1 : 0.55,
                            fontFamily: 'inherit', fontSize: '0.75rem',
                            cursor: afford ? 'pointer' : 'not-allowed', textAlign: 'left',
                          }}
                        >
                          <div>
                            {vis?.glyph} {vis?.nameZh ?? def.id}
                            <span style={{ float: 'right', opacity: 0.8 }}>{def.goldPerLevel}g · {def.seasonsPerLevel}季</span>
                          </div>
                          <div style={{ fontSize: '0.66rem', color: '#8a7050', marginTop: 2 }}>{def.descriptionZh}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {buildMsg && (
                <div style={{ color: '#b8442e', marginTop: '0.4rem', fontSize: '0.72rem' }}>{buildMsg}</div>
              )}
            </div>
          );
        })()}

        {/* Hint when nothing selected */}
        {selectedSlot === null && selectedPlot === null && isPlayer && (
          <div style={{
            position: 'absolute', bottom: 14, left: 14,
            background: 'rgba(20, 14, 8, 0.8)',
            border: '1px solid #5a4530',
            padding: '0.3rem 0.6rem',
            color: '#8a7050', fontFamily: 'Songti SC, serif',
            fontSize: '0.7rem', letterSpacing: '0.15rem',
          }}>
            點金色八角位 → 城外防禦　·　點地基(金框) → 城内營建
          </div>
        )}
      </div>
    </div>
  );
}
