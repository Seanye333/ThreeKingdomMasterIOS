import { Suspense, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { getTerritoryCanvas, getTerritorySignature } from './territoryOverlay';
import { positionAlongRoute, marchDestCoords, terrainRoute, generateTerritories } from '../../game/data/territories';
import { snapToHexCenter, geoToPixel, battleGroundAt, MAP_W as PX_W, MAP_H as PX_H, WORLD_SCALE } from '../../game/data/geography';
import { cityPixel, cityPos } from '../../game/data/cityGeo';
import { marchDurationFor } from '../../game/data/cities';
import { NAMED_MAPS_BY_CITY, NAMED_MAPS_BY_ID } from '../../game/data/namedMaps';
import { deriveWeaponType, type WeaponType } from '../../game/data/weaponTypes';
import * as THREE from 'three';
import { useGameStore } from '../../game/state/store';
import { PROVINCE_BY_CITY } from '../../game/data';
import { citySize } from '../../game/systems/citySize';
import type { City, Force, HexCoord, Port, Season } from '../../game/types';
import { FACILITY_DEFS, isHostilePermitted } from '../../game/types';
// The battle diorama reuses the real battle scene (embedded mode) + its hex
// coordinate helper, so the fight on the world map IS the fight.
import { BattleScene, hexWorld as battleHexWorld, stratagemFxKind, FX_DURATION, SIGNATURE_FLAVOR } from '../screens/TacticalBattleScreen3D';
// In-place battle commanding — the SAME pure battle ops the fullscreen uses.
import { unitAt, canMove, canAttack, moveUnit, attackUnits, endTurn, applyStratagem, hexDistance } from '../../game/systems/tactical';
import { canDuel } from '../../game/systems/duel';
import { personalTacticsForUnit } from '../../game/systems/personalTactics';
import { DuelGameModal } from './DuelGameModal';
import { MarchPicker } from './MarchPicker';
import { OfficerPicker } from './OfficerPicker';
import { playSfx, startMapAmbience, setMapAmbienceMode, stopMapAmbience } from '../../game/systems/sound';
import { computeFog } from '../../game/systems/fogOfWar';
import { STRATAGEMS } from '../../game/data';
import type { Officer, StratagemId } from '../../game/types';
import type { WeatherKind } from '../../game/systems/weather';
import { LocatorMap } from './LocatorMap';
import { ObjectivePanel } from './ObjectivePanel';
import { PortPanel } from './PortPanel';
import { FortPanel } from './FortPanel';
import { TribePanel } from './TribePanel';
import { TRIBES } from '../../game/data/tribes';
import { SitePanel } from './SitePanel';
import { BuildStockadePicker } from './BuildStockadePicker';
import { useT } from '../i18n';

/** Coarse-pointer / small-screen device — drop pixel ratio and skip the
 *  post-processing pass so phones keep a playable framerate. */
const IS_MOBILE = typeof window !== 'undefined'
  && (window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth < 700);

type OverlayMode = 'none' | 'gold' | 'food' | 'troops' | 'loyalty' | 'province' | 'supply' | 'diplomacy' | 'threat';

const PROVINCE_COLOR: Record<string, string> = {
  sili: '#d4a84a', yu: '#c19a3b', ji: '#3a5a8a', qing: '#5a8a8a',
  yan: '#8a5a3a', xu: '#6a8a3a', yang: '#2a7a4a', jing: '#7a4a8a',
  liang: '#b8442e', bing: '#5a4a8a', you: '#3a5a3a', yi: '#3a7d4a',
  jiao: '#5a8a4a',
};

/** Deterministic 0..1 hash from a string (same as 2D map's road curve seed). */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/* ─── Pixel↔world mapping ──────────────────────────────────────────
 * StrategicMap.tsx uses (0..1000, 0..720) pixel coords for cities.
 * We scale that to a world that's ~20 units wide × 14.4 deep.
 * X grows east (right), Z grows south (down) — same orientation as the
 * 2D map. Y is height. */
const PIXEL_TO_WORLD = 1 / 24;          // pixel-space → 3D world units
const MAP_W = PX_W * PIXEL_TO_WORLD;   // 3D width — auto-scales with WORLD_SCALE
const MAP_D = PX_H * PIXEL_TO_WORLD;   // 3D depth — auto-scales with WORLD_SCALE
// City models + army tokens are fixed world-size, so a bigger world makes
// them read as tiny dots. Grow them GENTLY (sub-linear) with WORLD_SCALE so
// they stay legible at the strategic overview without dominating up close.
// (At WORLD_SCALE 1 → 1.0, unchanged; 6 → 1.75.) Tune the 0.15 to taste.
const MARKER_SCALE = 1 + (WORLD_SCALE - 1) * 0.15;
/** Stable fallback for selectors that may return undefined on old saves. */
const EMPTY_TERRITORY_OWNERSHIP: Record<string, string | null> = {};
function pxToWorld(x: number, y: number): [number, number] {
  return [x * PIXEL_TO_WORLD - MAP_W / 2, y * PIXEL_TO_WORLD - MAP_D / 2];
}

/* ─── Geographic coordinate system (Phase B) ───────────────────────
 * The map covers China from ~96°E to ~125°E (29° wide) and from ~43°N
 * to ~17°N (26° tall). City positions come from the shared cityGeo
 * module (real lon/lat → pixel via geography.ts geoToPixel) — the same
 * source the gameplay distance system uses, so the rendered map and the
 * simulation always agree. */
const GEO_LON_MIN = 96, GEO_LON_MAX = 125;   // 29° east-west
const GEO_LAT_MIN = 17, GEO_LAT_MAX = 43;    // 26° north-south

/* ─── Geo-space helpers for terrain features (Phase B.2) ─────────
 * All MOUNTAINS / RIVERS / DESERTS / COASTLINE are authored in real
 * (lon, lat) and converted to pixel space at module load. The downstream
 * sampleTerrain still works in pixel space — only the SOURCE OF TRUTH
 * has changed. */
const GEO_LON_SPAN = GEO_LON_MAX - GEO_LON_MIN;   // 29°
const GEO_LAT_SPAN = GEO_LAT_MAX - GEO_LAT_MIN;   // 26°
/** Average px per degree (using lon since pixel map is wider in pixel terms
 *  than lat span, lon scale fits naturally). 1° ≈ 34.5 px. */
const DEG_TO_PX = PX_W / GEO_LON_SPAN;
function geoRidgeToPx(ridge: ReadonlyArray<readonly [number, number]>): [number, number][] {
  return ridge.map(([lon, lat]) => geoToPixel(lon, lat));
}

/* ─── Real China geography (Phase B.2) ─────────────────────────────
 * Authored in real (lon, lat). Converted to pixel space at module load
 * via geoToPixel so downstream sampleTerrain code doesn't change. */

/** Coast: for a given LAT, what's the lon of the easternmost land?
 *  Everything east of this is sea. Bohai bay, Shandong bulge, Hangzhou bay,
 *  Fujian coast, Pearl/Leizhou are roughly captured. */
function coastLonAt(lat: number): number {
  // High lat → low lat
  const pts: [number, number][] = [
    [43, 124],   // off-map north
    [42, 124],   // NE corner / Liaodong + Korea
    [41, 124],
    [40, 121.5], // Liaoxi
    [39.5, 122], // Bohai entrance
    [39, 118.5], // Bohai north (Tianjin opens)
    [38, 117.5], // Bohai deep
    [37.5, 122.5], // Shandong tip bulges out
    [36, 121],
    [35, 120.5],
    [33, 121],   // Jiangsu coast
    [32, 121.5], // Yangtze mouth
    [31, 122],   // Shanghai
    [30, 122],   // Hangzhou bay
    [29, 121.5],
    [28, 121.5], // Wenzhou
    [26, 120],   // Fuzhou
    [24, 118],   // Xiamen
    [23, 117],   // Shantou
    [22, 114],   // Hong Kong / Pearl mouth
    [21.5, 111], // Leizhou
    [21, 110],   // Hainan strait
    [20, 110],   // Hainan
    [18, 110],   // far south
    [17, 110],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    if (lat <= pts[i][0] && lat >= pts[i + 1][0]) {
      const t = (pts[i][0] - lat) / (pts[i][0] - pts[i + 1][0] || 1);
      return pts[i][1] * (1 - t) + pts[i + 1][1] * t;
    }
  }
  return 122;
}
/** Pixel-space `coastXAt(py)` — derived from coastLonAt(lat). */
function coastXAt(y: number): number {
  // py → lat via inverse of geoToPixel: lat = GEO_LAT_MAX - (py/720)*GEO_LAT_SPAN
  const lat = GEO_LAT_MAX - (y / PX_H) * GEO_LAT_SPAN;
  const lon = coastLonAt(lat);
  const [px] = geoToPixel(lon, lat);
  return px;
}
// Offshore islands the eastern-coastline model misses (Korea, Hainan) — kept
// in sync with geography.ts so the 3D terrain raises land under those cities.
// Positioned for the geo-anchored 樂浪/帶方/朱崖 (cityGeo.ts).
const ISLANDS_3D: ReadonlyArray<{ cx: number; cy: number; hw: number; hh: number }> = [
  { cx: 962, cy: 122, hw: 38, hh: 55 }, // Korea — hugs the NE map edge
  { cx: 502, cy: 640, hw: 18, hh: 18 }, // Hainan — thin strait off the Leizhou coast
];

/** Quick land test for ground-click targets. */
function isLandPx(px: number, py: number): boolean {
  return landSDF(px, py) > 2;
}

/** Land = positive distance to coast, sea = negative. */
function landSDF(x: number, y: number): number {
  const eastBoundary  = coastXAt(y);
  const distEast      = eastBoundary - x;
  const distSouth     = PX_H - y;
  let sdf = Math.min(distEast, distSouth);
  for (const i of ISLANDS_3D) {
    sdf = Math.max(sdf, Math.min(i.hw - Math.abs(x - i.cx), i.hh - Math.abs(y - i.cy)));
  }
  return sdf;
}

/** Real Chinese mountain ranges. Each entry's ridge is in (lon, lat).
 *  width_deg is in degrees; peak is the world-unit height contribution. */
const MOUNTAINS_GEO: Array<{
  name: string;
  ridge: ReadonlyArray<readonly [number, number]>;
  width_deg: number;
  peak: number;
}> = [
  // 喜马拉雅/青藏 — east edge of Tibetan plateau (SW corner of map)
  { name: 'tibet',    ridge: [[96, 31], [98, 29.5], [100, 28]],        width_deg: 3.0, peak: 2.6 },
  // 昆仑 — N boundary of Tibet, runs east
  { name: 'kunlun',   ridge: [[96, 35.5], [100, 36], [104, 36]],       width_deg: 2.0, peak: 1.6 },
  // 天山 — far NW (only fringe visible)
  { name: 'tianshan', ridge: [[96, 42], [100, 41.5]],                  width_deg: 1.2, peak: 1.4 },
  // 秦岭 — E-W, divides N and S China
  { name: 'qinling',  ridge: [[105, 33.8], [108, 33.7], [111, 33.5], [113, 33.4]],
                                                                       width_deg: 0.8, peak: 1.3 },
  // 大巴/巫山 — S of Qinling, Yangtze gorges
  { name: 'daba',     ridge: [[105, 32.5], [108, 32], [111, 31.5]],    width_deg: 0.7, peak: 1.5 },
  // 太行 — N-S, Hebei/Shanxi
  { name: 'taihang',  ridge: [[113.5, 41], [113.8, 38], [113.5, 35]],  width_deg: 0.7, peak: 1.1 },
  // 燕山 — N of Beijing
  { name: 'yan',      ridge: [[115, 41.5], [117, 41], [119, 41]],      width_deg: 0.6, peak: 0.9 },
  // 武夷 — Fujian/Jiangxi border
  { name: 'wuyi',     ridge: [[117.5, 28], [117, 25]],                 width_deg: 0.6, peak: 1.0 },
  // 南岭 — S, divides Yangtze and Pearl basins
  { name: 'nanling',  ridge: [[110, 25.5], [113, 25], [115, 24.8]],    width_deg: 0.6, peak: 0.8 },
  // 横断 — Sichuan/Yunnan, N-S running
  { name: 'hengduan', ridge: [[100, 30], [101.5, 27], [102, 24]],      width_deg: 1.0, peak: 1.6 },
  // 长白 — Liaodong/Korea border NE (peeks into map)
  { name: 'changbai', ridge: [[125, 42], [124, 41]],                   width_deg: 0.6, peak: 1.2 },
];
/** Pixel-space mountains derived from MOUNTAINS_GEO. */
const MOUNTAINS = MOUNTAINS_GEO.map((m) => ({
  name: m.name,
  ridge: geoRidgeToPx(m.ridge),
  width: m.width_deg * DEG_TO_PX,
  peak: m.peak,
}));

/** Real Chinese rivers — Yellow / Yangtze / Huai / Pearl. */
const RIVERS_GEO: Array<{
  name: string; nameZh: string;
  points: ReadonlyArray<readonly [number, number]>;
  width_deg: number;
}> = [
  // 黄河 — source in Qinghai → huge northern loop (Ordos) → east to Bohai
  { name: 'yellow', nameZh: '黄河', points: [
    [96, 35], [100, 36], [103, 37], [106, 39], [109, 40.5], [111, 40],
    [110, 38], [110, 36], [112, 35], [114, 35], [117, 36], [119, 37.5],
  ], width_deg: 0.20 },
  // 长江 — source in Tibet → Sichuan → through gorges → East China Sea
  { name: 'yangtze', nameZh: '长江', points: [
    [96, 33], [100, 31], [104, 30], [107, 30.5], [110, 30.5], [113, 30.5],
    [115, 30.5], [117, 30.8], [120, 31], [122, 31.5],
  ], width_deg: 0.25 },
  // 淮河 — between Yellow and Yangtze
  { name: 'huai', nameZh: '淮河', points: [
    [113, 33], [115, 33], [117, 33], [119, 33],
  ], width_deg: 0.14 },
  // 珠江 — southern China
  { name: 'pearl', nameZh: '珠江', points: [
    [104, 24], [108, 23.5], [111, 23], [113, 23], [114.5, 22.5],
  ], width_deg: 0.16 },
];
/** Pixel-space rivers derived from RIVERS_GEO. */
const RIVERS = RIVERS_GEO.map((r) => ({
  name: r.name,
  nameZh: r.nameZh,
  points: geoRidgeToPx(r.points),
  width: r.width_deg * DEG_TO_PX,
}));

/** Deserts: Gobi south fringe + Taklamakan east edge. */
const DESERTS_GEO: Array<{ lon: number; lat: number; r_deg: number }> = [
  { lon: 110, lat: 41.5, r_deg: 6.0 },   // Gobi south
  { lon: 97,  lat: 39,   r_deg: 3.5 },   // Taklamakan east edge
];
const DESERTS = DESERTS_GEO.map((d) => {
  const [px, py] = geoToPixel(d.lon, d.lat);
  return { x: px, y: py, r: d.r_deg * DEG_TO_PX };
});

/** Major inland lakes — painted as water in the terrain + a surface disc. */
const LAKES_GEO: Array<{ name: string; lon: number; lat: number; r_deg: number }> = [
  { name: 'dongting', lon: 112.9, lat: 29.3, r_deg: 0.92 },  // 洞庭湖
  { name: 'poyang',   lon: 116.3, lat: 29.0, r_deg: 0.70 },  // 鄱阳湖
  { name: 'taihu',    lon: 120.2, lat: 31.2, r_deg: 0.48 },  // 太湖
];
const LAKES = LAKES_GEO.map((l) => {
  const [px, py] = geoToPixel(l.lon, l.lat);
  return { name: l.name, x: px, y: py, r: l.r_deg * DEG_TO_PX };
});

/* ─── Geometry-building helpers ──────────────────────────────────── */

function distToSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-6) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const qx = ax + t * dx, qy = ay + t * dy;
  return Math.hypot(px - qx, py - qy);
}
function distToPolyline(px: number, py: number, pts: [number, number][]): number {
  let min = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distToSegment(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (d < min) min = d;
  }
  return min;
}
function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}
function valueNoise(x: number, z: number): number {
  return (
    Math.sin(x * 0.4) * Math.cos(z * 0.5) * 0.07
    + Math.sin(x * 0.9 + 1.2) * Math.cos(z * 1.0 + 0.3) * 0.04
    + Math.sin(x * 0.2 + 2.5) * 0.03
  );
}

/** Color palette per terrain biome. */
const C_SEA       = new THREE.Color('#2c5882');
const C_SHALLOW   = new THREE.Color('#5a8acf');
const C_BEACH     = new THREE.Color('#c8b078');
const C_PLAIN     = new THREE.Color('#7a8a4a');     // 中原/江汉 — fertile olive (mid band)
const C_LOESS     = new THREE.Color('#b8a566');     // 华北/黄土 — wheat-gold north
const C_SOUTH     = new THREE.Color('#577d36');     // 江南 — lush green
const C_TROPIC    = new THREE.Color('#3d6b2c');     // 岭南/交州 — deep tropical green
const C_HILL      = new THREE.Color('#6a7038');
const C_FOREST    = new THREE.Color('#3a5a2a');
const C_MOUNTAIN  = new THREE.Color('#6a5440');
const C_PEAK      = new THREE.Color('#9a8870');
const C_SNOW      = new THREE.Color('#f0e0c8');
const C_DESERT    = new THREE.Color('#c0a070');
const C_RIVER     = new THREE.Color('#3a6a98');
const C_FOAM      = new THREE.Color('#dfe8e8');     // surf line at the shore
const C_LAKE      = new THREE.Color('#356f9a');     // inland lake water

/** Sample terrain (height + color) at a pixel coordinate. */
/** Latitude-banded plain colour: wheat-gold north → olive 中原 → green 江南
 *  → deep tropical 交州. py runs 0 (lat 43, north) … 720 (lat 17, south). A
 *  mild east-west term dries the far west toward loess. Colour only — terrain
 *  height is untouched, so movement/biome geometry is unchanged. */
function plainColor(px: number, py: number): THREE.Color {
  const stops: Array<[number, THREE.Color]> = [
    [120, C_LOESS],   // 北疆/华北   lat ~37.7
    [250, C_PLAIN],   // 中原        lat ~34
    [400, C_SOUTH],   // 江南        lat ~28.5
    [580, C_TROPIC],  // 岭南/交州   lat ~22
  ];
  let col: THREE.Color;
  if (py <= stops[0][0]) col = stops[0][1].clone();
  else if (py >= stops[stops.length - 1][0]) col = stops[stops.length - 1][1].clone();
  else {
    col = stops[0][1].clone();
    for (let i = 0; i < stops.length - 1; i++) {
      if (py >= stops[i][0] && py <= stops[i + 1][0]) {
        const t = (py - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
        col = stops[i][1].clone().lerp(stops[i + 1][1], smoothstep(t));
        break;
      }
    }
  }
  // Far west is drier (rain-shadow / loess) — nudge toward wheat-gold.
  col.lerp(C_LOESS, smoothstep((300 - px) / 300) * 0.25);
  return col;
}

function sampleTerrain(px: number, py: number): { h: number; color: THREE.Color } {
  // 1. Sea / land
  const sdf = landSDF(px, py);
  if (sdf < 0) {
    // Sea — depth grows with distance from coast (clamped)
    const depth = Math.min(40, -sdf);
    const t = depth / 40;
    const col = C_SHALLOW.clone().lerp(C_SEA, t);
    return { h: -0.15 - t * 0.10, color: col };
  }

  // 2. Coastal beach
  let baseH = 0.04 + valueNoise(px * 0.02, py * 0.02);
  let color = plainColor(px, py);
  if (sdf < 12) {
    color = C_BEACH.clone();
    baseH = 0.02;
  }

  // 3. Mountain contribution — accumulate from each range
  let mountainH = 0;
  for (const m of MOUNTAINS) {
    const d = distToPolyline(px, py, m.ridge);
    if (d < m.width) {
      const t = 1 - d / m.width;
      mountainH += m.peak * smoothstep(t);
    }
  }
  if (mountainH > 0.05) {
    // Blend color: low slopes brown, mid peaks light brown, tall caps white.
    // Snowline drops toward the cold north/west so high ranges read snowy.
    const snowBoost = smoothstep((220 - py) / 220) * 0.35 + smoothstep((260 - px) / 260) * 0.25;
    const peakT = Math.min(1, mountainH / 1.5 + snowBoost * 0.4);
    if (peakT < 0.45) {
      color = C_MOUNTAIN.clone().lerp(C_PEAK, peakT / 0.45);
    } else {
      color = C_PEAK.clone().lerp(C_SNOW, (peakT - 0.45) / 0.55);
    }
  }

  // 4. Deserts (NW): nudge color, slight dune undulation
  for (const d of DESERTS) {
    const dist = Math.hypot(px - d.x, py - d.y);
    if (dist < d.r) {
      const t = 1 - dist / d.r;
      color = color.lerp(C_DESERT, smoothstep(t) * 0.95);
      baseH += t * 0.05 * Math.sin(px * 0.06);   // dunes
    }
  }

  // 5. Rivers — carve a groove
  let riverDepress = 0;
  for (const r of RIVERS) {
    const d = distToPolyline(px, py, r.points);
    if (d < r.width * 2.5) {
      const t = 1 - d / (r.width * 2.5);
      riverDepress = Math.max(riverDepress, t);
      if (d < r.width) {
        // Inside the river bed — color blue, set negative-ish height
        color = C_RIVER.clone();
      }
    }
  }

  // 6. Default plain → if no mountains, no desert, no river, give some forest patches
  if (mountainH < 0.05) {
    // South / Yangtze basin tends to forest; far north tends to grassland already (plain)
    const forestPatch = smoothstep(1 - Math.abs(py - 480) / 200)
                      * smoothstep(1 - Math.abs(px - 500) / 350);
    if (forestPatch > 0.4 && !color.equals(C_BEACH) && !color.equals(C_RIVER)) {
      color = color.lerp(C_FOREST, (forestPatch - 0.4) * 0.7);
    }
    // Mid elevations slightly hilly
    baseH += mountainH;
    if (baseH > 0.1 && baseH < 0.3) {
      color = color.lerp(C_HILL, 0.3);
    }
  } else {
    baseH += mountainH;
  }

  // Apply river depression last
  baseH -= riverDepress * 0.10;

  // 7. Coastal surf — a bright foam band on the wet shore (land side of the
  //    waterline), so coastlines get a crisp white edge instead of a hard cut.
  if (sdf >= 0 && sdf < 5 && mountainH < 0.05) {
    color = color.lerp(C_FOAM, smoothstep(1 - sdf / 5) * 0.5);
  }

  // 8. Major lakes — flat inland water, painted over whatever was here.
  for (const lk of LAKES) {
    const dist = Math.hypot(px - lk.x, py - lk.y);
    if (dist < lk.r) {
      const t = smoothstep(1 - dist / lk.r);
      color = C_LAKE.clone().lerp(C_SHALLOW, 0.25);
      baseH = -0.05 - t * 0.06;   // shallow basin
    }
  }

  return { h: baseH, color };
}

/* ─── Build a high-res procedural map texture (painted at pixel level)
 * Per-pixel sampling gives **crisp** biome borders + per-pixel grain.
 *
 * PERF: this is the single most expensive startup computation (millions
 * of sampleTerrain calls), so it is (a) module-cached — built once per
 * SESSION, not per mount (dev StrictMode double-mounts used to pay it
 * twice), and (b) row-chunked behind warmStrategicAssets() so the title
 * screen can pre-bake it in idle slices and entering the map never
 * blocks. If the player outruns the warm-up, the remainder finishes
 * synchronously on mount. */
// Phones get a lighter sheet — sampleTerrain costs the same per pixel
// everywhere, and 2.6× fewer pixels is the difference between the
// warm-up finishing during the title screen or not.
const TEX_W = IS_MOBILE ? 960 : 2000;
const TEX_H = IS_MOBILE ? 691 : 1440;
let terrainTexCache: THREE.Texture | null = null;
let terrainJob: { canvas: HTMLCanvasElement; img: ImageData; row: number } | null = null;

function terrainJobState() {
  if (!terrainJob) {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    terrainJob = { canvas, img: new ImageData(TEX_W, TEX_H), row: 0 };
  }
  return terrainJob;
}

/** Paint scanlines until the time budget runs out; true when the whole
 *  sheet is done. Deadline-based so warm-up ticks never jank the UI. */
function terrainFillFor(budgetMs: number): boolean {
  const job = terrainJobState();
  const data = job.img.data;
  const deadline = performance.now() + budgetMs;
  const end = TEX_H;
  for (let y = job.row; y < end; y++) {
    if (performance.now() > deadline) { job.row = y; return false; }
    const py = (y / TEX_H) * PX_H;
    for (let x = 0; x < TEX_W; x++) {
      const px = (x / TEX_W) * PX_W;
      const { color } = sampleTerrain(px, py);
      // High-freq pixel grain so grass and dirt look textured, not flat
      const grain = (
        Math.sin(px * 5.1 + py * 3.3) * 0.5
        + Math.sin(px * 11.7 + py * 7.9) * 0.3
        + (Math.sin(x * 1.31) * Math.cos(y * 0.97)) * 0.4
      ) * 0.06;
      const i = (y * TEX_W + x) * 4;
      data[i]     = Math.max(0, Math.min(255, (color.r + grain) * 255));
      data[i + 1] = Math.max(0, Math.min(255, (color.g + grain) * 255));
      data[i + 2] = Math.max(0, Math.min(255, (color.b + grain) * 255));
      data[i + 3] = 255;
    }
  }
  job.row = end;
  return true;
}

function buildTerrainTexture(): THREE.Texture {
  if (terrainTexCache) return terrainTexCache;
  while (!terrainFillFor(100)) { /* finish whatever the warm-up left */ }
  const job = terrainJobState();
  job.canvas.getContext('2d')!.putImageData(job.img, 0, 0);
  const tex = new THREE.CanvasTexture(job.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  terrainTexCache = tex;
  terrainJob = null;
  return tex;
}

/* ─── Build a normal map from terrain heights — mountain ridges + river
 *  banks get real per-pixel relief under lighting. Module-cached and
 *  row-chunked, same as the colour sheet. */
const NM_W = IS_MOBILE ? 640 : 1000;
const NM_H = IS_MOBILE ? 461 : 720;
let normalMapCache: THREE.Texture | null = null;
let normalJob: { heights: Float32Array; row: number } | null = null;

function normalFillFor(budgetMs: number): boolean {
  if (!normalJob) normalJob = { heights: new Float32Array(NM_W * NM_H), row: 0 };
  const deadline = performance.now() + budgetMs;
  const end = NM_H;
  for (let y = normalJob.row; y < end; y++) {
    if (performance.now() > deadline) { normalJob.row = y; return false; }
    const py = (y / NM_H) * PX_H;
    for (let x = 0; x < NM_W; x++) {
      normalJob.heights[y * NM_W + x] = sampleTerrain((x / NM_W) * PX_W, py).h;
    }
  }
  normalJob.row = end;
  return true;
}

function buildNormalMap(): THREE.Texture {
  if (normalMapCache) return normalMapCache;
  while (!normalFillFor(100)) { /* finish remainder */ }
  const heights = normalJob!.heights;
  const canvas = document.createElement('canvas');
  canvas.width = NM_W;
  canvas.height = NM_H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(NM_W, NM_H);
  const data = img.data;
  const STRENGTH = 12;  // scales the apparent slope — higher = more dramatic
  for (let y = 0; y < NM_H; y++) {
    for (let x = 0; x < NM_W; x++) {
      const xL = Math.max(0, x - 1), xR = Math.min(NM_W - 1, x + 1);
      const yU = Math.max(0, y - 1), yD = Math.min(NM_H - 1, y + 1);
      const dx = (heights[y * NM_W + xR] - heights[y * NM_W + xL]) * STRENGTH;
      const dy = (heights[yD * NM_W + x] - heights[yU * NM_W + x]) * STRENGTH;
      const nx = -dx;
      const ny = -dy;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * NM_W + x) * 4;
      data[i]     = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  normalMapCache = tex;
  normalJob = null;
  return tex;
}

/**
 * Pre-bake the strategic map's expensive sheets in small slices — call
 * repeatedly from an idle loop (the title screen does); each call does a
 * bounded chunk of work (~15-30ms) and returns true once EVERYTHING the
 * map needs at mount is cached.
 */
export function warmStrategicAssets(): boolean {
  if (!terrainTexCache) {
    if (terrainFillFor(14)) buildTerrainTexture();
    return false;
  }
  if (!normalMapCache) {
    if (normalFillFor(14)) buildNormalMap();
    return false;
  }
  buildWaterAlphaMask();
  // ⬡ hex-world quilt — ground a few columns per call so the first toggle
  // to the board map is instant instead of a 1-2s sampling stall.
  if (!warmHexWorldTiles(8)) return false;
  return true;
}

/* ─── Water alpha-mask — keeps the territory tint off the water ───
 *  White = land (tint shows), black = sea / lake / river bed (tint
 *  hidden). Mirrors exactly the water tests sampleTerrain paints with,
 *  so the mask and the drawn water always agree. Built once (static). */
let waterMaskCache: THREE.Texture | null = null;
function buildWaterAlphaMask(): THREE.Texture {
  if (waterMaskCache) return waterMaskCache;
  // Fixed mask resolution — coastline detail is independent of WORLD_SCALE.
  // Sample at scaled-world coords so one mask covers the whole map at any
  // scale without ballooning the canvas past mobile/GPU texture limits.
  const W = 1000, H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const data = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const wx = (x / W) * PX_W;
      const wy = (y / H) * PX_H;
      let water = landSDF(wx, wy) < 0;
      if (!water) {
        for (const lk of LAKES) {
          if (Math.hypot(wx - lk.x, wy - lk.y) < lk.r) { water = true; break; }
        }
      }
      if (!water) {
        for (const r of RIVERS) {
          if (distToPolyline(wx, wy, r.points) < r.width) { water = true; break; }
        }
      }
      const i = (y * W + x) * 4;
      const v = water ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = true;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.generateMipmaps = false;
  waterMaskCache = tex;
  return tex;
}

/* ─── Phase 3a — territory tint over the terrain ──────────────────
 *  Builds a sibling plane to MapTerrain, displaced to follow the same
 *  heights but lifted by 0.05 so it sits just above the ground, then
 *  textured with the same Voronoi canvas the 2D map uses. The texture
 *  rebuilds on ownership change. */
function TerritoryGroundLayer({
  cities,
  forces,
  territoryOwnership,
}: {
  cities: Record<string, City>;
  forces: Record<string, Force>;
  territoryOwnership: Record<string, string | null>;
}) {
  // Same displaced geometry as MapTerrain — keep them in lockstep.
  const geom = useMemo(() => {
    const subW = 240, subD = 180;
    const g = new THREE.PlaneGeometry(MAP_W, MAP_D, subW, subD);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wy = pos.getY(i);
      const px = (wx + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (MAP_D / 2 - wy) / PIXEL_TO_WORLD;
      pos.setZ(i, sampleTerrain(px, py).h + 0.05 * WORLD_SCALE);   // lift scales with world so it clears the terrain plane (no z-fight) at far zoom
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // CanvasTexture wrapping the cached hex-grid image. Rebuild only when
  // the ownership signature changes. Anisotropic + linear-no-mipmap
  // filtering keeps the crisp hex edges sharp when stretched across the
  // tilted terrain plane instead of mip-blurring into mush.
  const sig = getTerritorySignature(cities, territoryOwnership);
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(getTerritoryCanvas(cities, forces, territoryOwnership));
    tex.flipY = true;
    tex.minFilter = THREE.LinearFilter;   // crisp (no mipmap); the z-fight fix (camera near + lift) is what removed the far-zoom striping, not mipmaps
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      geometry={geom}
      // Render after the terrain so the alpha blend lands on top.
      renderOrder={1}
    >
      <meshBasicMaterial
        map={texture}
        // Hide the ownership tint over sea / lakes / rivers — water should
        // always read as water, not as faction colour.
        alphaMap={buildWaterAlphaMask()}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─── Procedural China terrain ───────────────────────────────────── */
function MapTerrain({ onGroundClick }: { onGroundClick?: (px: number, py: number) => void } = {}) {
  // Both textures are EXPENSIVE — module-cached, see the builders above.
  const texture = useMemo(() => buildTerrainTexture(), []);
  const normalMap = useMemo(() => buildNormalMap(), []);
  const geom = useMemo(() => {
    // Geometry only carries displacement now — colors come from the texture
    const subW = 240, subD = 180;
    const g = new THREE.PlaneGeometry(MAP_W, MAP_D, subW, subD);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wy = pos.getY(i);
      // NOTE: after the -PI/2 X rotation, +Y maps to -Z (north). The COLOR
      // texture (and Three.js flipY=true) places its canvas y=0 (north
      // painted) at the +Y end of the plane too. So we MUST invert wy when
      // sampling — otherwise we sample southern terrain heights for the
      // northern vertices, putting mountains where the texture shows plains.
      const px = (wx + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (MAP_D / 2 - wy) / PIXEL_TO_WORLD;
      pos.setZ(i, sampleTerrain(px, py).h);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      geometry={geom}
      onClick={(e) => {
        if (!onGroundClick) return;
        e.stopPropagation();
        const px = (e.point.x + MAP_W / 2) / PIXEL_TO_WORLD;
        const py = (e.point.z + MAP_D / 2) / PIXEL_TO_WORLD;
        onGroundClick(px, py);
      }}
    >
      <meshStandardMaterial
        map={texture}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.7, 0.7)}
        roughness={0.92}
        metalness={0.02}
      />
    </mesh>
  );
}

/* ─── Ocean plane sitting just below sea-level terrain ─────────── */
/** Living water — a low-subdivision plane whose vertices roll in layered
 *  swells, so the sea shimmers and undulates instead of sitting glassy-flat. */
function Ocean() {
  const ref = useRef<THREE.Mesh>(null);
  const geom = useMemo(() => new THREE.PlaneGeometry(MAP_W * 1.1, MAP_D * 1.1, 24, 24), []);
  const orig = useMemo(() => Float32Array.from(geom.attributes.position.array), [geom]);
  const frame = useRef(0);
  useFrame(({ clock }) => {
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const x = orig[i * 3], y = orig[i * 3 + 1];
      const swell = Math.sin(x * 0.05 + t * 0.7) * 0.06 + Math.cos(y * 0.045 + t * 0.55) * 0.06;
      pos.setZ(i, swell);
    }
    pos.needsUpdate = true;
    // Recompute normals every few frames so the specular highlight travels
    // with the swells without paying the cost every single frame.
    if ((frame.current++ & 3) === 0) geom.computeVertexNormals();
  });
  return (
    <mesh ref={ref} geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
      <meshStandardMaterial
        color="#1a4a72"
        roughness={0.32}
        metalness={0.6}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

/* ─── Render rivers as visible blue ribbons on top of terrain ─── */
function RiverRibbons({ frozen = false }: { frozen?: boolean }) {
  // Real WIDTH — a draped triangle strip following each river's course
  // (lineBasicMaterial linewidth is ignored by most GPUs, so the old
  // ribbons rendered as hairlines). Width tapers from the headwaters to
  // the full lower course.
  const ribbons = useMemo(() => {
    const out: Array<{ geom: THREE.BufferGeometry; freezes: boolean }> = [];
    for (const r of RIVERS) {
      // Densify the polyline so the strip bends smoothly.
      const dense: Array<[number, number]> = [];
      for (let i = 0; i < r.points.length - 1; i++) {
        const [ax, ay] = r.points[i];
        const [bx, by] = r.points[i + 1];
        const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 6));
        for (let k = 0; k < n; k++) dense.push([ax + (bx - ax) * (k / n), ay + (by - ay) * (k / n)]);
      }
      dense.push(r.points[r.points.length - 1]);
      if (dense.length < 2) continue;
      const positions: number[] = [];
      const indices: number[] = [];
      for (let i = 0; i < dense.length; i++) {
        const [px, py] = dense[i];
        const [nx, ny] = dense[Math.min(dense.length - 1, i + 1)];
        const [qx, qy] = dense[Math.max(0, i - 1)];
        // direction from neighbours; perpendicular for the banks
        let dx = nx - qx, dy = ny - qy;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
        const taper = 0.35 + 0.65 * (i / (dense.length - 1));   // grows downstream
        const halfW = (r.width * 0.7 * taper) * PIXEL_TO_WORLD;
        const [wx, wz] = pxToWorld(px, py);
        const h = sampleTerrain(px, py).h + 0.02;
        positions.push(
          wx + (-dy) * halfW, h, wz + dx * halfW,
          wx + dy * halfW, h, wz + (-dx) * halfW,
        );
        if (i > 0) {
          const a = (i - 1) * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      out.push({ geom, freezes: r.name === 'yellow' });
    }
    return out;
  }, []);
  const matRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  useFrame(({ clock }) => {
    // Living water — a slow specular shimmer travelling along the rivers.
    for (const m of matRefs.current) {
      if (m) m.emissiveIntensity = 0.18 + Math.sin(clock.elapsedTime * 1.2) * 0.08;
    }
  });
  return (
    <group>
      {ribbons.map((r, i) => (
        <mesh key={i} geometry={r.geom} renderOrder={1}>
          {/* 冰封 — the frozen Yellow River goes pale ice-blue in winter */}
          <meshStandardMaterial
            ref={(m) => { matRefs.current[i] = m; }}
            color={frozen && r.freezes ? '#cfe8f4' : '#3f7fae'}
            emissive={frozen && r.freezes ? '#e8f4fa' : '#5a9bc8'}
            emissiveIntensity={0.18}
            roughness={frozen && r.freezes ? 0.55 : 0.25}
            metalness={frozen && r.freezes ? 0.1 : 0.5}
            transparent opacity={0.92}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Get terrain height at any (wx, wz) world-space coord — for planting
 *  cities and road waypoints on the actual ground. */
function sampleTerrainHeight(wx: number, wz: number): number {
  const px = (wx + MAP_W / 2) / PIXEL_TO_WORLD;
  const py = (wz + MAP_D / 2) / PIXEL_TO_WORLD;
  return sampleTerrain(px, py).h;
}

/** Plant a city on the terrain. We sample the city's exact point plus a
 *  tiny 0.3-world-unit ring to smooth out single-vertex jitter, then add a
 *  small +0.03 lift so the base disk doesn't z-fight with the ground. */
function cityElevation(wx: number, wz: number): number {
  let maxH = sampleTerrainHeight(wx, wz);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const h = sampleTerrainHeight(wx + Math.cos(a) * 0.3, wz + Math.sin(a) * 0.3);
    if (h > maxH) maxH = h;
  }
  return maxH + 0.03;
}

/* ─── A single city: 3D pillar + label + capital marker ──────── */
/* ─── Chinese-style city model — picks variant by tier + pass check ─
 *  - 關 (pass) → two cliff wedges flanking a gate-tower
 *  - 邑 (hamlet) → wood palisade + 2 small huts, no central tower
 *  - 鎮 (town) → low brick wall + small 1-story pagoda
 *  - 城 (city) → brick wall + 2-story pagoda + 2 corner towers
 *  - 大城 (large) → tall wall + 3-story pagoda + 4 corner towers
 *  - 都 (capital) → grand wall + 5-story pagoda + 4 corner towers + side halls */
function ChineseCity({ city, radius, height, forceColor, onClick }: {
  city: City;
  radius: number;
  height: number;
  forceColor: string;
  onClick: () => void;
}) {
  const isPass = city.name.zh.includes('關');
  const tier = isPass ? 'pass' : citySize(city).id;
  const click = (e: { stopPropagation: () => void }) => { e.stopPropagation(); onClick(); };

  if (tier === 'pass') return <PassGate radius={radius} height={height} forceColor={forceColor} onClick={click} />;
  if (tier === 'hamlet') return <HamletVillage radius={radius} height={height} forceColor={forceColor} onClick={click} />;

  // Walled-city variants — pagoda story count + tower count scale with tier
  const stories  = tier === 'town' ? 1 : tier === 'city' ? 2 : tier === 'large' ? 3 : 5;
  const towers   = tier === 'town' ? 0 : tier === 'city' ? 2 : 4;
  const wallHigh = tier === 'town' ? 0.40 : tier === 'city' ? 0.55 : tier === 'large' ? 0.65 : 0.75;
  return (
    <>
      <ChineseBrickWall
        radius={radius} height={height}
        wallHigh={wallHigh}
        towers={towers}
        forceColor={forceColor}
        onClick={click}
      />
      <Pagoda
        x={0} z={0}
        radius={radius * 0.55}
        baseY={height * wallHigh + 0.02}
        storyH={height * 0.20}
        stories={stories}
        bodyColor="#c8a878"
        roofColor="#3a3a4a"
      />
      {tier === 'capital' && (
        // Two side halls flanking the central pagoda
        <>
          <SideHall x={-radius * 0.7} z={0} radius={radius * 0.3}
            baseY={height * wallHigh + 0.02} h={height * 0.35} />
          <SideHall x={radius * 0.7} z={0} radius={radius * 0.3}
            baseY={height * wallHigh + 0.02} h={height * 0.35} />
        </>
      )}
    </>
  );
}

/** A flared Chinese eave — wide tile slab, raised ridge, four upturned
 *  corner tips (戧脊). The silhouette that says "Chinese roof" at a glance. */
function SweptEave({ y, w, d, h }: { y: number; w: number; d: number; h: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#2a2a35" roughness={0.72} />
      </mesh>
      <mesh position={[0, h * 0.7, 0]} castShadow>
        <boxGeometry args={[w * 0.62, h * 0.5, d * 0.16]} />
        <meshStandardMaterial color="#1d1d27" roughness={0.6} />
      </mesh>
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
        <mesh key={i} position={[sx * w * 0.46, h * 0.32, sz * d * 0.4]} rotation={[sz * 0.45, 0, -sx * 0.45]} castShadow>
          <coneGeometry args={[h * 0.5, h * 1.3, 4]} />
          <meshStandardMaterial color="#2a2a35" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** 城門樓 — a gate opening recessed in the front wall, crowned by a roofed
 *  gatehouse with swept eaves. Grand cities get a double eave (重檐). */
function GateTower({ radius: r, height, wallH, grand }: {
  radius: number; height: number; wallH: number; grand: boolean;
}) {
  const hallH = height * 0.17;
  const hallY = wallH + height * 0.045 + hallH / 2;
  return (
    <group position={[0, 0, r * 1.04]}>
      {/* Gate opening — dark recess in the wall base */}
      <mesh position={[0, wallH * 0.33, -r * 0.04]}>
        <boxGeometry args={[r * 0.5, wallH * 0.6, r * 0.16]} />
        <meshStandardMaterial color="#140f09" roughness={0.95} />
      </mesh>
      {/* Stone platform crowning the wall over the gate */}
      <mesh position={[0, wallH + height * 0.02, 0]} castShadow>
        <boxGeometry args={[r * 1.02, height * 0.045, r * 0.52]} />
        <meshStandardMaterial color="#4a4a56" roughness={0.7} />
      </mesh>
      {/* Wooden gatehouse hall */}
      <mesh position={[0, hallY, 0]} castShadow>
        <boxGeometry args={[r * 0.8, hallH, r * 0.4]} />
        <meshStandardMaterial color="#8a5630" roughness={0.78} />
      </mesh>
      <SweptEave y={wallH + height * 0.045 + hallH} w={r * 1.06} d={r * 0.6} h={height * 0.05} />
      {grand && (
        <>
          <mesh position={[0, wallH + height * 0.045 + hallH + height * 0.08, 0]} castShadow>
            <boxGeometry args={[r * 0.52, height * 0.1, r * 0.3]} />
            <meshStandardMaterial color="#8a5630" roughness={0.78} />
          </mesh>
          <SweptEave y={wallH + height * 0.045 + hallH + height * 0.16} w={r * 0.72} d={r * 0.42} h={height * 0.045} />
        </>
      )}
    </group>
  );
}

/** Chinese brick wall: low rectangular wall, optional corner towers,
 *  with tiled-tile crenellations. */
function ChineseBrickWall({ radius, height, wallHigh, towers, forceColor, onClick }: {
  radius: number; height: number;
  wallHigh: number;
  towers: 0 | 2 | 4;
  forceColor: string;
  onClick: (e: { stopPropagation: () => void }) => void;
}) {
  const wallH = height * wallHigh;
  const cornerPositions: ReadonlyArray<readonly [number, number]> =
    towers === 0 ? []
    : towers === 2 ? [[-1.05, 0], [1.05, 0]]
    : [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  return (
    <>
      {/* Outer wall — terracotta brick */}
      <mesh
        position={[0, wallH / 2, 0]}
        castShadow receiveShadow
        onClick={onClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <boxGeometry args={[radius * 2.2, wallH, radius * 2.2]} />
        <meshStandardMaterial color="#9a7560" roughness={0.92} />
      </mesh>
      {/* Wall cap — dark tile band along the top */}
      <mesh position={[0, wallH + 0.005, 0]} castShadow>
        <boxGeometry args={[radius * 2.3, height * 0.04, radius * 2.3]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.7} />
      </mesh>
      {/* Crenellations along front + back + sides */}
      {([
        [-0.7, 1.1], [0, 1.1], [0.7, 1.1],
        [-0.7, -1.1], [0, -1.1], [0.7, -1.1],
        [1.1, -0.7], [1.1, 0], [1.1, 0.7],
        [-1.1, -0.7], [-1.1, 0], [-1.1, 0.7],
      ] as const).map(([sx, sz], i) => (
        <mesh key={`b${i}`} position={[radius * sx, wallH + 0.045, radius * sz]} castShadow>
          <boxGeometry args={[radius * 0.18, height * 0.08, radius * 0.18]} />
          <meshStandardMaterial color="#7a6550" roughness={0.85} />
        </mesh>
      ))}
      {/* Corner towers with Chinese roofs */}
      {cornerPositions.map(([sx, sz], i) => (
        <group key={`tw${i}`} position={[radius * 1.1 * sx, 0, radius * 1.1 * sz]}>
          {/* Tower body */}
          <mesh position={[0, wallH * 0.85, 0]} castShadow>
            <boxGeometry args={[radius * 0.4, wallH * 1.5, radius * 0.4]} />
            <meshStandardMaterial color={forceColor} roughness={0.7} />
          </mesh>
          {/* Eave — flat wide disc */}
          <mesh position={[0, wallH * 1.62, 0]} castShadow>
            <boxGeometry args={[radius * 0.62, height * 0.025, radius * 0.62]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
          </mesh>
          {/* Pyramidal roof — rotated 45° so the square cone aligns with the
           *  square tower below */}
          <mesh position={[0, wallH * 1.74, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[radius * 0.32, height * 0.20, 4]} />
            <meshStandardMaterial color="#3a3a4a" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* 城門樓 — gate + roofed gatehouse on the front wall (重檐 for grand cities) */}
      <GateTower radius={radius} height={height} wallH={wallH} grand={towers === 4} />
    </>
  );
}

/** Chinese pagoda: stacked stories with wide eaves between, pointed spire. */
function Pagoda({
  x, z, radius, baseY, storyH, stories, bodyColor, roofColor,
}: {
  x: number; z: number;
  radius: number;
  baseY: number;
  storyH: number;
  stories: number;
  bodyColor: string;
  roofColor: string;
}) {
  const meshes: React.ReactNode[] = [];
  let y = baseY;
  for (let s = 0; s < stories; s++) {
    // Each successive story narrower by ~12%
    const r = radius * Math.pow(0.85, s);
    // Story body
    meshes.push(
      <mesh key={`b${s}`} position={[x, y + storyH / 2, z]} castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.92, r, storyH, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.78} />
      </mesh>,
    );
    // Eave — flat wide disc above each story
    const eaveR = r * 1.35;
    const eaveH = storyH * 0.13;
    meshes.push(
      <mesh key={`e${s}`} position={[x, y + storyH + eaveH / 2, z]} castShadow>
        <cylinderGeometry args={[eaveR, eaveR * 1.10, eaveH, 8]} />
        <meshStandardMaterial color={roofColor} roughness={0.75} />
      </mesh>,
    );
    y += storyH + eaveH;
  }
  // Spire — small final cone
  meshes.push(
    <mesh key="spire" position={[x, y + storyH * 0.6, z]} castShadow>
      <coneGeometry args={[radius * 0.10, storyH * 1.2, 6]} />
      <meshStandardMaterial color="#d4a84a" roughness={0.4} metalness={0.4} />
    </mesh>,
  );
  return <>{meshes}</>;
}

/** Hamlet (邑): no walls, just a wood palisade ring + 2-3 huts. */
function HamletVillage({ radius, height, forceColor, onClick }: {
  radius: number; height: number; forceColor: string;
  onClick: (e: { stopPropagation: () => void }) => void;
}) {
  return (
    <>
      {/* Wood palisade ring */}
      <mesh
        position={[0, height * 0.18, 0]}
        castShadow receiveShadow
        onClick={onClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <cylinderGeometry args={[radius * 1.05, radius * 1.05, height * 0.36, 10, 1, true]} />
        <meshStandardMaterial color="#5a4530" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* 3 small huts inside */}
      {([[-0.4, -0.3], [0.4, -0.3], [0, 0.4]] as const).map(([sx, sz], i) => (
        <group key={i} position={[radius * sx, 0, radius * sz]}>
          <mesh position={[0, height * 0.18, 0]} castShadow>
            <boxGeometry args={[radius * 0.45, height * 0.30, radius * 0.45]} />
            <meshStandardMaterial color="#a89070" roughness={0.85} />
          </mesh>
          <mesh position={[0, height * 0.42, 0]} castShadow>
            <coneGeometry args={[radius * 0.36, height * 0.18, 4]} />
            <meshStandardMaterial color={forceColor} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Pass (關): rocky cliffs pinching a crenellated wall, with a double-eave
 *  gatehouse plugging the valley — reads as a fortified mountain gate. */
function PassGate({ radius, height, forceColor, onClick }: {
  radius: number; height: number; forceColor: string;
  onClick: (e: { stopPropagation: () => void }) => void;
}) {
  return (
    <>
      {/* Cliff flanks — rock-grey, slightly skewed so they read as crags */}
      <mesh position={[-radius * 1.05, height * 0.55, 0]} rotation={[0, 0.28, 0.06]} castShadow>
        <boxGeometry args={[radius * 0.60, height * 1.20, radius * 1.9]} />
        <meshStandardMaterial color="#6e6354" roughness={0.97} />
      </mesh>
      <mesh position={[radius * 1.05, height * 0.50, 0]} rotation={[0, -0.22, -0.05]} castShadow>
        <boxGeometry args={[radius * 0.60, height * 1.05, radius * 1.9]} />
        <meshStandardMaterial color="#75695a" roughness={0.97} />
      </mesh>
      {/* Wall stubs tying the gate into both cliffs */}
      <mesh position={[-radius * 0.62, height * 0.30, 0]} castShadow receiveShadow>
        <boxGeometry args={[radius * 0.55, height * 0.60, radius * 0.45]} />
        <meshStandardMaterial color="#8a7560" roughness={0.92} />
      </mesh>
      <mesh position={[radius * 0.62, height * 0.30, 0]} castShadow receiveShadow>
        <boxGeometry args={[radius * 0.55, height * 0.60, radius * 0.45]} />
        <meshStandardMaterial color="#8a7560" roughness={0.92} />
      </mesh>
      {/* Central gate base — stone — click target */}
      <mesh
        position={[0, height * 0.35, 0]}
        castShadow receiveShadow
        onClick={onClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <boxGeometry args={[radius * 1.0, height * 0.70, radius * 0.7]} />
        <meshStandardMaterial color="#907c64" roughness={0.9} />
      </mesh>
      {/* Gate arch — darker opening */}
      <mesh position={[0, height * 0.25, radius * 0.36]}>
        <boxGeometry args={[radius * 0.5, height * 0.45, radius * 0.05]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      {/* Battlements along the gate top */}
      {[-0.36, -0.12, 0.12, 0.36].map((sx, i) => (
        <mesh key={i} position={[radius * sx, height * 0.745, radius * 0.30]} castShadow>
          <boxGeometry args={[radius * 0.13, height * 0.09, radius * 0.08]} />
          <meshStandardMaterial color="#9c8870" roughness={0.9} />
        </mesh>
      ))}
      {/* Gatehouse — force-coloured hall with double swept eaves */}
      <mesh position={[0, height * 0.92, 0]} castShadow>
        <boxGeometry args={[radius * 1.0, height * 0.36, radius * 0.78]} />
        <meshStandardMaterial color={forceColor} roughness={0.75} />
      </mesh>
      <mesh position={[0, height * 1.12, 0]} castShadow>
        <boxGeometry args={[radius * 1.42, height * 0.06, radius * 1.08]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
      </mesh>
      {/* Upper storey + second eave + crown roof */}
      <mesh position={[0, height * 1.26, 0]} castShadow>
        <boxGeometry args={[radius * 0.72, height * 0.22, radius * 0.58]} />
        <meshStandardMaterial color="#7a4a3a" roughness={0.8} />
      </mesh>
      <mesh position={[0, height * 1.40, 0]} castShadow>
        <boxGeometry args={[radius * 1.05, height * 0.05, radius * 0.82]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
      </mesh>
      <mesh position={[0, height * 1.52, 0]} castShadow>
        <coneGeometry args={[radius * 0.55, height * 0.26, 4]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.8} />
      </mesh>
    </>
  );
}

/** Small auxiliary hall (used flanking the capital pagoda). */
function SideHall({ x, z, radius, baseY, h }: {
  x: number; z: number;
  radius: number; baseY: number; h: number;
}) {
  return (
    <>
      <mesh position={[x, baseY + h / 2, z]} castShadow receiveShadow>
        <boxGeometry args={[radius * 1.3, h, radius * 1.0]} />
        <meshStandardMaterial color="#a85040" roughness={0.78} />
      </mesh>
      {/* Curved roof — using cone with 4 sides */}
      <mesh position={[x, baseY + h + h * 0.18, z]} castShadow>
        <coneGeometry args={[radius * 0.95, h * 0.45, 4]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.78} />
      </mesh>
    </>
  );
}

/** Force banner flown over an owned city — a pole + waving flag. */
function CityBanner({ color, baseY, isCapital }: {
  color: string; baseY: number; isCapital: boolean;
}) {
  const flagRef = useRef<THREE.Mesh>(null);
  const poleH = isCapital ? 0.55 : 0.38;
  const flagW = isCapital ? 0.22 : 0.15;
  const flagH = isCapital ? 0.14 : 0.09;
  const flagY = baseY + poleH - flagH * 0.7;
  useFrame(({ clock }) => {
    if (flagRef.current) {
      flagRef.current.rotation.z = Math.sin(clock.elapsedTime * 3.5) * 0.18;
    }
  });
  return (
    <group>
      <mesh position={[0, baseY + poleH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, poleH, 5]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      {/* Gold finial on capital poles. */}
      {isCapital && (
        <mesh position={[0, baseY + poleH + 0.02, 0]} castShadow>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#f0d878" metalness={0.5} roughness={0.4} />
        </mesh>
      )}
      <mesh ref={flagRef} position={[flagW / 2, flagY, 0]} castShadow>
        <planeGeometry args={[flagW, flagH]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** City pillar group: walled city / pagoda / pass / hamlet by tier, with
 *  a force-colored base disk, banner, name label and selection ring. */
/* ─── 標籤分級 — when the camera is pulled far out, the ~120 city name+bar
   labels turn into noise (and DOM cost). A tiny in-canvas tracker quantizes
   camera distance into near/far; far hides labels of ordinary cities, keeping
   capitals and the selection readable. */
const ZoomLODCtx = createContext<'near' | 'far'>('near');
const LOD_FAR_DIST = 30;
function ZoomLODTracker({ onChange }: { onChange: (lod: 'near' | 'far') => void }) {
  const { camera } = useThree();
  const last = useRef<'near' | 'far'>('near');
  useFrame(() => {
    // Hysteresis band so the labels don't flicker right on the threshold.
    const d = camera.position.length();
    const next = last.current === 'far'
      ? (d < LOD_FAR_DIST - 3 ? 'near' : 'far')
      : (d > LOD_FAR_DIST + 3 ? 'far' : 'near');
    if (next !== last.current) {
      last.current = next;
      onChange(next);
    }
  });
  return null;
}

/** 迷你導航 — tracks the camera's view window for the corner minimap, and
 *  executes click-to-jump requests (camera keeps its current offset). */
function MiniNavRig({ controlsRef, onView, jump }: {
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void } | null>;
  onView: (v: { cx: number; cy: number; span: number }) => void;
  jump: { px: number; py: number; seq: number } | null;
}) {
  const { camera } = useThree();
  const lastReport = useRef(0);
  const lastSeq = useRef(0);
  useFrame(({ clock }) => {
    const ctrl = controlsRef.current;
    if (jump && jump.seq !== lastSeq.current && ctrl) {
      lastSeq.current = jump.seq;
      const [wx, wz] = pxToWorld(jump.px, jump.py);
      const offset = camera.position.clone().sub(ctrl.target);
      ctrl.target.set(wx, sampleTerrainHeight(wx, wz), wz);
      camera.position.copy(ctrl.target).add(offset);
      ctrl.update();
    }
    if (clock.elapsedTime - lastReport.current < 0.25) return;
    lastReport.current = clock.elapsedTime;
    const tgt = ctrl?.target ?? new THREE.Vector3();
    const cx = (tgt.x + MAP_W / 2) / PIXEL_TO_WORLD;
    const cy = (tgt.z + MAP_D / 2) / PIXEL_TO_WORLD;
    const span = camera.position.distanceTo(tgt) * 0.9 / PIXEL_TO_WORLD;
    onView({ cx: Math.round(cx), cy: Math.round(cy), span: Math.round(span) });
  });
  return null;
}

function City3D({
  city, forceColor, isCapital, isSelected, terrainY, overlay, onClick,
}: {
  city: City;
  forceColor: string;
  isCapital: boolean;
  isSelected: boolean;
  terrainY: number;
  overlay: { color: string; label: string } | null;
  onClick: () => void;
}) {
  const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
  const [x, z] = pxToWorld(px, py);
  const zoomLod = useContext(ZoomLODCtx);
  // Scale by city size (population or troops) — bigger cities, taller towers.
  const sizeScore = Math.max(1, Math.min(4, city.population / 60000 + city.troops / 30000));
  const height = 0.18 + sizeScore * 0.12;
  const radius = 0.10 + sizeScore * 0.03;
  // World-size compensation: pillars stay visually reasonable as the world
  // gets bigger. The final multiplier shrinks the footprint so neighbouring
  // cities (min ~18px ≈ 2.6 hexes apart) stop overlapping — de-crowds the
  // dense clusters (Luoyang basin, Shu passes, Xiangyang/Fancheng) without
  // moving any city off its real-geography position.
  const worldScale = PIXEL_TO_WORLD * 50 * 0.5 * MARKER_SCALE;   // ~1.04 at base, grows gently with the world
  // Selection pulse
  const ringRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (ringRef.current && isSelected) {
      ringRef.current.opacity = 0.5 + Math.sin(clock.elapsedTime * 3) * 0.3;
    }
  });

  return (
    <group position={[x, terrainY, z]} scale={worldScale}>
      {/* City base — colored disk on the ground */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius + 0.08, 16]} />
        <meshBasicMaterial color={forceColor} transparent opacity={0.45} />
      </mesh>
      <ChineseCity
        city={city}
        radius={radius}
        height={height}
        forceColor={forceColor}
        onClick={onClick}
      />
      {/* Force banner — every owned city flies its colours so ownership
       *  reads from the buildings, not just the ground grid. Capitals get
       *  a taller pole + larger flag. */}
      {city.ownerForceId && (
        <CityBanner color={forceColor} baseY={height} isCapital={isCapital} />
      )}
      {/* Port complex — pier, wharf, war junk + mast forest */}
      {/* Old in-city port docks removed — ports are now independent entities
       *  rendered by <Ports3D />. Cities with city.port=true still pass the
       *  flag for legacy lookup but no longer draw their own dock here. */}
      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius + 0.12, radius + 0.20, 32]} />
          <meshBasicMaterial ref={ringRef} color="#d4a84a" side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
      )}
      {/* Overlay heatmap disk + value label */}
      {overlay && (
        <>
          <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius + 0.32, 16]} />
            <meshBasicMaterial color={overlay.color} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, height + 0.32, 0]} center distanceFactor={IS_MOBILE ? 9 : 6} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '11px',
              color: '#fff',
              fontWeight: 'bold',
              textShadow: '0 0 4px #000, 0 0 2px #000',
              whiteSpace: 'nowrap',
            }}>{overlay.label}</div>
          </Html>
        </>
      )}
      {/* HTML label — Chinese name + strength bars. drei scales Html by
       *  ~distanceFactor/distance, so a smaller distanceFactor keeps the
       *  label from ballooning when the camera zooms in close. Zoomed far,
       *  ordinary cities drop their labels (capitals/selection stay). */}
      {(zoomLod === 'near' || isCapital || isSelected) && (
        <Html position={[0, height + 0.6, 0]} center distanceFactor={5} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontFamily: 'Songti SC, serif',
            textAlign: 'center',
            width: 80,
          }}>
            <div style={{
              fontSize: '13px',
              color: '#1a1410',
              fontWeight: 'bold',
              textShadow: '0 0 4px #f0e0b0, 1px 1px 0 #f0e0b0, -1px -1px 0 #f0e0b0',
              whiteSpace: 'nowrap',
              marginBottom: 2,
            }}>{city.name.zh}</div>
            {/* Strength bars — troops (red), gold (gold), loyalty (blue) */}
            <CityStrengthBars city={city} />
          </div>
        </Html>
      )}
    </group>
  );
}

/** Three thin bars rendered under a city name in the 3D map's HTML overlay.
 *  Normalized against typical max values so a small city has a thin bar and
 *  a big city fills it. Click goes through (parent has pointerEvents none). */
function CityStrengthBars({ city }: { city: City }) {
  const bar = (label: string, value: number, max: number, color: string) => {
    const pct = Math.max(0, Math.min(1, value / max));
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, fontSize: 8,
        color: '#1a1410',
      }}>
        <span style={{ width: 16, textShadow: '0 0 3px #f0e0b0', fontWeight: 'bold' }}>{label}</span>
        <div style={{
          flex: 1, height: 3, background: 'rgba(20,14,8,0.45)',
          border: '0.5px solid rgba(20,14,8,0.7)',
        }}>
          <div style={{ width: `${pct * 100}%`, height: '100%', background: color }} />
        </div>
      </div>
    );
  };
  return (
    <>
      {bar('兵', city.troops,     40_000, '#b8442e')}  {/* troops */}
      {bar('金', city.gold,       20_000, '#d4a84a')}  {/* gold */}
      {bar('忠', city.loyalty,    100,    '#88b7e8')}  {/* loyalty */}
    </>
  );
}

/* ─── Curved roads between adjacent cities (drape on terrain) ──── */
function Roads({ cities }: { cities: Record<string, City> }) {
  // De-dupe edges via canonical key
  const edges = useMemo(() => {
    const set = new Set<string>();
    const list: Array<{ from: City; to: City; seed: string }> = [];
    for (const c of Object.values(cities)) {
      for (const adj of c.adjacentCityIds ?? []) {
        const other = cities[adj];
        if (!other) continue;
        const a = c.id < other.id ? c.id : other.id;
        const b = c.id < other.id ? other.id : c.id;
        const key = `${a}|${b}`;
        if (set.has(key)) continue;
        set.add(key);
        // Seed uses the source city's id + adj id (matches 2D map's curve direction)
        list.push({ from: c, to: other, seed: c.id + adj });
      }
    }
    return list;
  }, [cities]);

  const lineGeoms = useMemo(() => {
    const out: THREE.BufferGeometry[] = [];
    for (const { from, to, seed } of edges) {
      const [fpx, fpy] = cityPixel(from.id, from.coords.x, from.coords.y);
      const [tpx, tpy] = cityPixel(to.id, to.coords.x, to.coords.y);
      const [fx, fz] = pxToWorld(fpx, fpy);
      const [tx, tz] = pxToWorld(tpx, tpy);
      const dx = tx - fx;
      const dz = tz - fz;
      const len = Math.hypot(dx, dz);
      // Skip degenerate zero-length edges (city to itself or coincident coords)
      // — division-by-zero here would produce NaN Vector3s and a console warning.
      if (len < 1e-6) continue;
      // Perpendicular direction
      const px = -dz / len;
      const pz = dx / len;
      // Deterministic curve magnitude (10–25% of length, signed by hash)
      const h = hashStr(seed);
      const sign = h < 0.5 ? -1 : 1;
      const amt = (0.10 + (h * 0.15)) * len * sign;
      const mx = (fx + tx) / 2 + px * amt;
      const mz = (fz + tz) / 2 + pz * amt;
      // Sample 18 points along quadratic Bezier, planted on terrain + small lift
      const SEG = 18;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        const it = 1 - t;
        const x = it * it * fx + 2 * it * t * mx + t * t * tx;
        const z = it * it * fz + 2 * it * t * mz + t * t * tz;
        const y = sampleTerrainHeight(x, z) + 0.02;
        pts.push(new THREE.Vector3(x, y, z));
      }
      out.push(new THREE.BufferGeometry().setFromPoints(pts));
    }
    return out;
  }, [edges, cities]);

  return (
    <group>
      {lineGeoms.map((geom, i) => (
        <line key={i}>
          <primitive object={geom} attach="geometry" />
          <lineBasicMaterial color="#b48c5a" transparent opacity={0.6} linewidth={1} />
        </line>
      ))}
    </group>
  );
}

/* ─── Marching army arrows (animated) ──────────────────────── */
function MarchingArmies({ cities, pendingCommands, forces, officers, ports, selectedArmyId, onArmyClick, hideNearPx }: {
  cities: Record<string, City>;
  pendingCommands: Record<string, { cityId?: string; type: string; targetCityId?: string; troops?: number; officerId?: string; seasonsRemaining?: number; totalSeasons?: number }>;
  forces: Record<string, { color: string }>;
  officers: Record<string, import('../../game/types').Officer>;
  ports: Record<string, import('../../game/types').Port>;
  selectedArmyId: string | null;
  onArmyClick?: (officerId: string) => void;
  /** Suppress tokens near an active battle site (they're IN the diorama). */
  hideNearPx?: { x: number; y: number } | null;
}) {
  const armies = useMemo(() => {
    return Object.values(pendingCommands)
      .filter((cmd): cmd is { cityId: string; type: string; targetCityId: string; troops: number; officerId: string; seasonsRemaining?: number; totalSeasons?: number; targetX?: number; targetY?: number; holding?: boolean } =>
        cmd.type === 'march' && !!cmd.cityId)
      .map((cmd) => {
        const from = cities[cmd.cityId];
        const dest = marchDestCoords(cmd, cities);
        if (!from || !dest) return null;
        const to = cities[cmd.targetCityId];
        const force = forces[from.ownerForceId ?? ''];
        const hostile = !cmd.targetX && to ? to.ownerForceId !== from.ownerForceId : false;
        const commander = officers[cmd.officerId];
        const totalSeasons = Math.max(1, cmd.totalSeasons ?? 1);
        const seasonsRemaining = cmd.seasonsRemaining ?? 1;
        // Route endpoints in geo-pixel space so the marching token lines up
        // with the geo-positioned cities (and the roads, which already use
        // cityPixel) — not the old painted-map coords. A straight segment
        // between the two geo points; matches how the roads are drawn.
        const [fgx, fgy] = cityPixel(cmd.cityId, from.coords.x, from.coords.y);
        const [dgx, dgy] = (cmd.targetX == null && to)
          ? cityPixel(cmd.targetCityId, dest.x, dest.y)
          : [dest.x, dest.y];
        const landRoute = [{ x: fgx, y: fgy }, { x: dgx, y: dgy }];
        // Suppress tokens marching beside an active battle — those columns are
        // IN the diorama; a second flag next to it reads as a phantom army.
        if (hideNearPx) {
          const tEl = Math.min(0.95, Math.max(0.05, (totalSeasons - seasonsRemaining + 0.5) / totalSeasons));
          const ax = fgx + (dgx - fgx) * tEl;
          const ay = fgy + (dgy - fgy) * tEl;
          if (Math.hypot(ax - hideNearPx.x, ay - hideNearPx.y) < 50) return null;
        }
        const weaponType: WeaponType = commander ? deriveWeaponType(commander) : 'none';
        return {
          officerId: cmd.officerId,
          from,
          to,
          color: hostile ? '#b8442e' : (force?.color ?? '#d4a84a'),
          commanderName: commander?.name.zh ?? '',
          troops: cmd.troops,
          seasonsRemaining,
          totalSeasons,
          landRoute,
          weaponType,
          selected: cmd.officerId === selectedArmyId,
          holding: !!cmd.holding,
          cellTarget: cmd.targetX != null,
        };
      })
      .filter((a): a is NonNullable<typeof a> => !!a);
  }, [cities, pendingCommands, forces, officers, selectedArmyId, hideNearPx]);

  return (
    <group>
      {armies.map((a, i) => (
        <MarchingArmy key={i} from={a.from} to={a.to} color={a.color}
          commanderName={a.commanderName} troops={a.troops}
          seasonsRemaining={a.seasonsRemaining} totalSeasons={a.totalSeasons}
          landRoute={a.landRoute} weaponType={a.weaponType}
          selected={a.selected} holding={a.holding} cellTarget={a.cellTarget}
          ports={ports} onClick={onArmyClick ? () => onArmyClick(a.officerId) : undefined} />
      ))}
    </group>
  );
}

/** Short unit-type tag (騎/弓/槍…) + role for the army label. */
const UNIT_TAG: Record<WeaponType, string> = {
  cavalry: '騎', bow: '弓', crossbow: '弩', spear: '槍', halberd: '戟',
  sabre: '刀', sword: '劍', fan: '師', siege: '械', none: '步',
};

// Marching-token scale — kept in step with the city footprint shrink (0.7→0.5)
// so the squad reads as a unit on the map, not larger than the cities it moves
// between.
const ARMY_TOKEN_SCALE = 0.7 * MARKER_SCALE;

function MarchingArmy({ from, to, color, commanderName, troops, seasonsRemaining, totalSeasons, landRoute, weaponType, selected, holding, cellTarget, ports, onClick }: {
  from: City; to: City; color: string;
  commanderName: string; troops: number;
  seasonsRemaining: number; totalSeasons: number;
  landRoute: Array<{ x: number; y: number }>;
  weaponType: WeaponType;
  selected: boolean;
  holding: boolean;
  cellTarget: boolean;
  ports: Record<string, import('../../game/types').Port>;
  onClick?: () => void;
}) {
  const [fpx, fpy] = cityPixel(from.id, from.coords.x, from.coords.y);
  const [tpx, tpy] = cityPixel(to.id, to.coords.x, to.coords.y);
  const [fx, fz] = pxToWorld(fpx, fpy);
  const [tx, tz] = pxToWorld(tpx, tpy);

  // Naval detection: if target is NOT a land-adjacent city of source, and
  // both have linked ports with a direct sea connection, route via ports.
  const naval = useMemo(() => {
    if ((from.adjacentCityIds ?? []).includes(to.id)) return null;
    const srcPort = Object.values(ports).find((p) => p.linkedCityId === from.id);
    const dstPort = Object.values(ports).find((p) => p.linkedCityId === to.id);
    if (!srcPort || !dstPort) return null;
    if (!srcPort.connectedPortIds.includes(dstPort.id)) return null;
    return { srcPort, dstPort };
  }, [from, to, ports]);

  // Build waypoint list — for naval marches: [from, srcPort, dstPort, to].
  // For land marches (Phase 3b): the territory poly-route passed in via
  // props. Both end up as piecewise-linear segments so useFrame below
  // shares one interpolation path.
  const path = useMemo(() => {
    if (naval) {
      const [spx, spy] = pxToWorld(...geoToPixel(naval.srcPort.coords.lon, naval.srcPort.coords.lat));
      const [dpx, dpy] = pxToWorld(...geoToPixel(naval.dstPort.coords.lon, naval.dstPort.coords.lat));
      return {
        kind: 'piecewise' as const,
        pts: [[fx, fz], [spx, spy], [dpx, dpy], [tx, tz]] as Array<[number, number]>,
      };
    }
    // Land — follow the territory route through ~4-8 waypoints. Map the
    // 1000×720 canvas coords through pxToWorld so they land on the 3D plane.
    const pts: Array<[number, number]> = landRoute.length >= 2
      ? landRoute.map((p) => pxToWorld(...cityPixel('_', p.x, p.y)))
      : [[fx, fz], [tx, tz]];
    return { kind: 'piecewise' as const, pts };
  }, [naval, fx, fz, tx, tz, landRoute]);

  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = totalSeasons - seasonsRemaining;
    const t = Math.min(0.95, Math.max(0.05, (elapsed + 0.5) / totalSeasons));
    let x: number, z: number, heading: number;
    if (naval) {
      // Naval marches glide across open water — no hex snapping.
      const segCount = path.pts.length - 1;
      const segT = t * segCount;
      const segIdx = Math.min(segCount - 1, Math.floor(segT));
      const localT = segT - segIdx;
      const [ax, az] = path.pts[segIdx];
      const [bx, bz] = path.pts[segIdx + 1];
      x = ax + (bx - ax) * localT;
      z = az + (bz - az) * localT;
      heading = Math.atan2(bx - ax, bz - az);
    } else {
      // Land — snap to the hex the army occupies this season so it sits
      // on a cell and steps cell-to-cell (RTK-XIV grid march). A dug-in
      // garrison sits on the cell it holds (route end), not a fraction along.
      const raw = (holding && cellTarget && landRoute.length > 0)
        ? landRoute[landRoute.length - 1]
        : positionAlongRoute(landRoute, t);
      const s = snapToHexCenter(raw.x, raw.y);
      const [wx, wz] = pxToWorld(s.x, s.y);
      const rawAhead = positionAlongRoute(landRoute, Math.min(0.99, t + 0.06));
      const sAhead = snapToHexCenter(rawAhead.x, rawAhead.y);
      const [wx2, wz2] = pxToWorld(sAhead.x, sAhead.y);
      x = wx; z = wz;
      heading = (wx2 !== wx || wz2 !== wz)
        ? Math.atan2(wx2 - wx, wz2 - wz)
        : groupRef.current.rotation.y;
    }
    groupRef.current.position.set(x, sampleTerrainHeight(x, z) + 0.05, z);
    groupRef.current.rotation.y = heading;
  });

  // Squad arrow formation: leader + 4 followers behind
  const FORMATION: ReadonlyArray<readonly [number, number]> = [
    [0,     0],     // leader
    [-0.18, -0.25], [0.18, -0.25],
    [-0.36, -0.50], [0.36, -0.50],
  ];

  const troopLabel = troops >= 1000 ? `${(troops / 1000).toFixed(1)}k` : `${troops}`;
  const etaLabel = holding ? '  駐' : totalSeasons > 1 ? `  ${seasonsRemaining}/${totalSeasons}季` : '';
  return (
    <group ref={groupRef} scale={ARMY_TOKEN_SCALE}>
      {/* Click target — a FAT invisible cylinder over the whole squad incl.
          the banner, so columns are easy to tap even zoomed out / on touch.
          (The old 0.55×0.42 disc was why armies felt uncontrollable.) */}
      {onClick && (
        <mesh
          position={[0, 0.5, 0]}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = ''; }}
        >
          <cylinderGeometry args={[1.1, 1.1, 1.3, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      {/* Selection ring on the ground under the squad. */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.32, 0.42, 28]} />
          <meshBasicMaterial color="#fff4d0" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}
      {holding ? (
        <FieldCamp color={color} troops={troops} />
      ) : (
        <>
          {FORMATION.map(([sx, sz], i) => (
            <Soldier key={i} dx={sx} dz={sz} color={color} phase={i * 0.6}
              isLeader={i === 0} weaponType={weaponType} />
          ))}
          <MarchDust />
        </>
      )}
      {commanderName && (
        <Html position={[0, 0.5, 0]} center distanceFactor={10} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(15, 10, 5, 0.82)',
            border: `1px solid ${color}`,
            padding: '2px 6px',
            color: '#ffe9a8',
            fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            textShadow: '0 0 4px rgba(0,0,0,0.9)',
            boxShadow: `0 0 6px ${color}66`,
          }}>
            <span style={{
              display: 'inline-block', minWidth: 13, textAlign: 'center',
              background: color, color: '#1a120a', borderRadius: 2,
              fontSize: '9px', marginRight: 4, padding: '0 1px', fontWeight: 700,
            }}>{UNIT_TAG[weaponType]}</span>
            <span style={{ color: '#ffe9a8' }}>{commanderName}</span>
            <span style={{ color: '#c0a878', marginLeft: 5, fontSize: '9px', fontFamily: 'ui-monospace, monospace' }}>{troopLabel}{etaLabel}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

/** Drifting dust puffs kicked up behind the marching column. */
function MarchDust() {
  const ref = useRef<THREE.Group>(null);
  const N = 5;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    for (let i = 0; i < ref.current.children.length; i++) {
      const m = ref.current.children[i] as THREE.Mesh;
      // Each puff cycles: rises + drifts back + fades, offset per index.
      const t = (clock.elapsedTime * 0.8 + i / N) % 1;
      m.position.set(-0.05 - t * 0.35, 0.02 + t * 0.12, (i - N / 2) * 0.05);
      m.scale.setScalar(0.05 + t * 0.14);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.32 * (1 - t);
    }
  });
  return (
    <group ref={ref}>
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#b8a888" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * A garrison camp drawn in place of the marching column when an army is
 * holding an open cell — a palisade ring, a cluster of tents, and a banner
 * pole flying the force colour, so a dug-in field army reads at a glance.
 */
// Tent slots in a rough cluster — bigger camps light up more of them.
const CAMP_TENTS: ReadonlyArray<readonly [number, number]> = [
  [0, 0.15], [-0.13, -0.04], [0.13, -0.04], [-0.07, 0.06], [0.07, 0.06],
  [-0.18, 0.1], [0.18, 0.1], [0, -0.14], [-0.1, -0.12], [0.1, -0.12],
];

/** Crossed-sabre / broken-stockade markers at recent field-battle sites. */
/** An expanding ground ring marking a fresh battle site — the world reacting to
 *  a fight that just happened (③ causal flow). Loops, with a per-site phase. */
function BattlePulseRing3D({ wx, y, wz, color, phase }: {
  wx: number; y: number; wz: number; color: string; phase: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const t = ((state.clock.elapsedTime + phase) % 1.7) / 1.7; // 0..1 loop
    const s = 0.12 + t * 0.55;
    if (ref.current) ref.current.scale.set(s, s, s);
    if (mat.current) mat.current.opacity = (1 - t) * 0.55;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[wx, y + 0.03, wz]}>
      <ringGeometry args={[0.7, 0.9, 28]} />
      <meshBasicMaterial ref={mat} color={color} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ─── 糧道 — the supply web ──────────────────────────────────────────────
   Overlay mode 糧道: gold supply lines trace every adjacent pair of player
   cities CONNECTED to the capital (BFS over owned adjacency); an owned city
   that cannot reach the capital through friendly territory is cut off —
   marked with a pulsing red ring and a ⚠斷補 chip. Information layer only
   (no gameplay penalty yet), but it answers "can my front be fed?" at a
   glance before a campaign.*/
function SupplyLines3D() {
  const cities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const net = useMemo(() => {
    if (!playerForceId) return null;
    const capitalId = forces[playerForceId]?.capitalCityId;
    const owned = new Set(Object.values(cities).filter((c) => c.ownerForceId === playerForceId).map((c) => c.id));
    if (!capitalId || !owned.has(capitalId)) return { connected: new Set<string>(), owned, edges: [] as Array<[string, string]>, cut: [...owned] };
    const connected = new Set<string>([capitalId]);
    const queue = [capitalId];
    while (queue.length) {
      const id = queue.pop()!;
      for (const adj of cities[id]?.adjacentCityIds ?? []) {
        if (owned.has(adj) && !connected.has(adj)) { connected.add(adj); queue.push(adj); }
      }
    }
    const edges: Array<[string, string]> = [];
    for (const id of connected) {
      for (const adj of cities[id]?.adjacentCityIds ?? []) {
        if (connected.has(adj) && id < adj) edges.push([id, adj]);
      }
    }
    const cut = [...owned].filter((id) => !connected.has(id));
    return { connected, owned, edges, cut };
  }, [cities, forces, playerForceId]);
  if (!net) return null;
  return (
    <group>
      {net.edges.map(([a, b]) => {
        const ca = cities[a], cb = cities[b];
        if (!ca || !cb) return null;
        const [ax, az] = pxToWorld(...cityPixel(ca.id, ca.coords.x, ca.coords.y));
        const [bx, bz] = pxToWorld(...cityPixel(cb.id, cb.coords.x, cb.coords.y));
        const mx = (ax + bx) / 2, mz = (az + bz) / 2;
        const len = Math.hypot(bx - ax, bz - az);
        const y = Math.max(sampleTerrainHeight(ax, az), sampleTerrainHeight(bx, bz), sampleTerrainHeight(mx, mz)) + 0.16;
        return (
          <mesh key={`${a}-${b}`} position={[mx, y, mz]} rotation={[0, Math.atan2(-(bz - az), bx - ax), 0]}>
            <boxGeometry args={[len, 0.025, 0.06]} />
            <meshBasicMaterial color="#e8c060" transparent opacity={0.75} depthWrite={false} />
          </mesh>
        );
      })}
      {net.cut.map((id) => {
        const c = cities[id];
        if (!c) return null;
        const [wx, wz] = pxToWorld(...cityPixel(c.id, c.coords.x, c.coords.y));
        const y = cityElevation(wx, wz);
        return (
          <group key={`cut-${id}`}>
            <BattlePulseRing3D wx={wx} y={y + 0.05} wz={wz} color="#e0552a" phase={0.2} />
            <Html position={[wx, y + 1.0, wz]} center distanceFactor={9} zIndexRange={[40, 30]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(40,14,8,0.9)', border: '1px solid #e0552a', borderRadius: 3,
                padding: '1px 7px', fontFamily: 'Songti SC, serif', fontSize: '11px',
                color: '#f0b0a0', whiteSpace: 'nowrap', letterSpacing: '1px',
              }}>⚠ 斷補 — 不通都城</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 焚城 — burningCities has been tracked in state since forever but never
   drawn: a sacked/burning city now shows licking flames and a leaning smoke
   column for as long as the fire lasts. */
function BurningCities3D() {
  const burning = useGameStore((s) => s.burningCities);
  const cities = useGameStore((s) => s.cities);
  if (!burning || burning.length === 0) return null;
  return (
    <group>
      {burning.map(({ cityId }) => {
        const c = cities[cityId];
        if (!c) return null;
        const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const wy = cityElevation(wx, wz);
        return (
          <group key={cityId} position={[wx, wy, wz]}>
            {[[-0.22, 0.1], [0.18, -0.15], [0, 0.22]].map(([dx, dz], i) => (
              <BeaconFlame3D key={i} wx={dx} wy={0} wz={dz as number} />
            ))}
          </group>
        );
      })}
    </group>
  );
}

/* ─── 烽火預警 — beacons actually light ─────────────────────────────────
   A player city with a built 烽火台 (beacon slot) IGNITES when a hostile
   column is marching on it — and the alarm carries one hop to neighbouring
   player beacons (the chain the towers were built for). Flame + smoke on
   the map; the DOM warning chip lives in the outer shell. */
export function computeBeaconAlerts(
  cities: Record<string, City>,
  armies: Record<string, import('../../game/types').Army>,
  playerForceId: string | null,
): { threatened: Set<string>; lit: Set<string> } {
  const threatened = new Set<string>();
  if (!playerForceId) return { threatened, lit: new Set() };
  for (const a of Object.values(armies)) {
    if (a.forceId === playerForceId) continue;
    const tgt = cities[a.targetCityId];
    if (tgt?.ownerForceId === playerForceId) threatened.add(tgt.id);
  }
  const hasBeacon = (c: City) => (c.buildSlots ?? []).some((sl) => sl.buildingId === 'beacon');
  const lit = new Set<string>();
  for (const id of threatened) {
    const c = cities[id];
    if (!c) continue;
    if (hasBeacon(c)) lit.add(id);
    // The alarm relays one hop to neighbouring player beacons.
    for (const adj of c.adjacentCityIds ?? []) {
      const n = cities[adj];
      if (n?.ownerForceId === playerForceId && hasBeacon(n)) lit.add(adj);
    }
  }
  return { threatened, lit };
}

function BeaconFlame3D({ wx, wy, wz }: { wx: number; wy: number; wz: number }) {
  const flameRef = useRef<THREE.Mesh>(null);
  const smokeRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(t * 9) * 0.3;
      flameRef.current.scale.x = 1 + Math.sin(t * 7 + 1) * 0.15;
    }
    if (smokeRef.current) {
      smokeRef.current.position.y = 0.55 + ((t * 0.25) % 0.5);
      (smokeRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 - ((t * 0.25) % 0.5) * 0.6;
    }
  });
  return (
    <group position={[wx, wy, wz]}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.32, 5]} />
        <meshStandardMaterial color="#4a3a26" roughness={0.9} />
      </mesh>
      <mesh ref={flameRef} position={[0, 0.4, 0]}>
        <coneGeometry args={[0.07, 0.22, 6]} />
        <meshBasicMaterial color="#ff8030" />
      </mesh>
      <mesh ref={smokeRef} position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#5a5a5a" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 0.45, 0]} color="#ff7020" intensity={1.4} distance={2.4} decay={2} />
    </group>
  );
}

function BeaconAlerts3D() {
  const cities = useGameStore((s) => s.cities);
  const armies = useGameStore((s) => s.armies);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const { lit } = useMemo(
    () => computeBeaconAlerts(cities, armies, playerForceId),
    [cities, armies, playerForceId],
  );
  if (lit.size === 0) return null;
  return (
    <group>
      {[...lit].map((id) => {
        const c = cities[id];
        if (!c) return null;
        const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const wy = cityElevation(wx, wz);
        return <BeaconFlame3D key={id} wx={wx + 0.45} wy={wy} wz={wz - 0.45} />;
      })}
    </group>
  );
}

/** 城防一目了然 — a city's BUILT perimeter defences (buildSlots) show as tiny
 *  gold watch-posts around its token at their true compass positions, so the
 *  world map reads which cities are fortified and on which approaches. */
const CITY_SLOT_DIR: Array<[number, number]> = [
  [0, -1], [Math.SQRT1_2, -Math.SQRT1_2], [1, 0], [Math.SQRT1_2, Math.SQRT1_2],
  [0, 1], [-Math.SQRT1_2, Math.SQRT1_2], [-1, 0], [-Math.SQRT1_2, -Math.SQRT1_2],
];
function CityDefenseRing({ city, wx, wz, terrainY }: {
  city: City; wx: number; wz: number; terrainY: number;
}) {
  const built = (city.buildSlots ?? []).filter((s) => s.buildingId);
  if (built.length === 0) return null;
  return (
    <group position={[wx, terrainY, wz]}>
      {built.map((s) => {
        const dir = CITY_SLOT_DIR[s.slot] ?? [0, -1];
        return (
          <group key={s.slot} position={[dir[0] * 0.62, 0, dir[1] * 0.62]}>
            <mesh position={[0, 0.07, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.035, 0.14, 5]} />
              <meshStandardMaterial color="#8a6f3a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
              <coneGeometry args={[0.04, 0.06, 4]} />
              <meshStandardMaterial color="#d4a84a" emissive="#d4a84a" emissiveIntensity={0.25} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** 待戰 — battles queued for this season (AI clashes / siege defences not yet
 *  fought) pulse red at their sites so you can see what's coming before each
 *  one ignites. */
function QueuedBattles3D() {
  const fieldQ = useGameStore((s) => s.pendingFieldBattleQueue);
  const siegeQ = useGameStore((s) => s.pendingSiegeDefenseQueue);
  const armies = useGameStore((s) => s.armies);
  const cities = useGameStore((s) => s.cities);
  const sites: Array<{ x: number; y: number; zh: string }> = [
    // Field clashes erupt at the midpoint between the two armies.
    ...(fieldQ ?? []).flatMap((q) => {
      const a = armies[q.playerArmyId], b = armies[q.enemyArmyId];
      return a && b ? [{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, zh: '野戰待發' }] : [];
    }),
    ...(siegeQ ?? []).flatMap((q) => {
      const c = cities[q.targetCityId];
      return c ? [{ ...cityPos(c), zh: '守城待戰' }] : [];
    }),
  ];
  if (sites.length === 0) return null;
  return (
    <group>
      {sites.map((s, i) => {
        const [wx, wz] = pxToWorld(s.x, s.y);
        const y = sampleTerrainHeight(wx, wz) + 0.06;
        return (
          <group key={i}>
            <BattlePulseRing3D wx={wx} y={y} wz={wz} color="#e0552a" phase={i * 0.31} />
            <Html position={[wx, y + 0.7, wz]} center distanceFactor={10} zIndexRange={[45, 35]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(40, 14, 8, 0.88)', border: '1px solid #e0552a', borderRadius: 3,
                padding: '1px 7px', fontFamily: 'Songti SC, serif', fontSize: '11px',
                color: '#f0b0a0', whiteSpace: 'nowrap', letterSpacing: '1px',
              }}>⚔ {s.zh}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function FieldBattleMarks3D({ marks }: {
  marks: Array<{ x: number; y: number; kind: 'ambush' | 'camp' | 'clash'; seasonsLeft: number }>;
}) {
  if (!marks || marks.length === 0) return null;
  return (
    <group>
      {/* Fresh sites (this season) pulse — "fought here just now". */}
      {marks.filter((m) => m.seasonsLeft >= 2).map((m, i) => {
        const [wx, wz] = pxToWorld(m.x, m.y);
        const y = sampleTerrainHeight(wx, wz) + 0.06;
        const color = m.kind === 'ambush' ? '#e0a83a' : m.kind === 'camp' ? '#e0552a' : '#d4a84a';
        return <BattlePulseRing3D key={`pulse-${i}`} wx={wx} y={y} wz={wz} color={color} phase={i * 0.37} />;
      })}
      {marks.map((m, i) => {
        const [wx, wz] = pxToWorld(m.x, m.y);
        const y = sampleTerrainHeight(wx, wz) + 0.06;
        const fade = Math.min(1, m.seasonsLeft / 2);
        const color = m.kind === 'ambush' ? '#e08a2a' : m.kind === 'camp' ? '#c43a2a' : '#9aa6b4';
        if (m.kind === 'camp') {
          // Broken stockade — a few leaning snapped stakes.
          return (
            <group key={i} position={[wx, y, wz]}>
              {[[-0.1, 0.3], [0.05, -0.25], [0.14, 0.5]].map(([dx, rot], k) => (
                <mesh key={k} position={[dx, 0.08, 0]} rotation={[0, 0, rot]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.16, 4]} />
                  <meshStandardMaterial color="#6b4f2a" transparent opacity={0.9 * fade} />
                </mesh>
              ))}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <circleGeometry args={[0.14, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.4 * fade} />
              </mesh>
            </group>
          );
        }
        // Crossed sabres — two thin crossed bars lying on the ground.
        return (
          <group key={i} position={[wx, y, wz]} rotation={[-Math.PI / 2, 0, 0]}>
            {[Math.PI / 4, -Math.PI / 4].map((rot, k) => (
              <mesh key={k} rotation={[0, 0, rot]}>
                <boxGeometry args={[0.26, 0.025, 0.006]} />
                <meshBasicMaterial color={color} transparent opacity={0.85 * fade} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/* ─── 野戰混戰 — a brief LIVE melee at a fresh clash site (③ causal flow):
 *  two warbands charge together, trade blows, some fall, the loser routs,
 *  then it fades to the static crossed-sabre mark. Plays once on mount, so a
 *  battle you didn't command no longer resolves into a mere doodle. ── */
const CLASH_DURATION = 4.6;   // seconds of brawl before it settles to the mark
const CLASH_PER_SIDE = 6;
const CLASH_A = '#3a7dd9';    // the same blue/red the battle board uses per side
const CLASH_B = '#b8442e';

/** Deterministic 0..1 from site coords + index — stable across the re-renders
 *  the marks array triggers each season, so the brawl never re-rolls midway. */
function clashHash(x: number, y: number, i: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + i * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

type ClashMark = {
  x: number; y: number; kind: 'ambush' | 'camp' | 'clash'; seasonsLeft: number;
  aColor?: string; bColor?: string; winner?: -1 | 1; winName?: string;
  aTroops?: number; bTroops?: number;
};

function FieldClashMelee3D({ marks }: { marks: ClashMark[] }) {
  // Every fresh battle site (this season) replays as a live brawl — clash,
  // ambush and stormed-camp alike.
  const fresh = marks.filter((m) => m.seasonsLeft >= 2);
  if (fresh.length === 0) return null;
  return <group>{fresh.map((m) => <ClashSite key={`${m.x},${m.y}`} m={m} />)}</group>;
}

function ClashSite({ m }: { m: ClashMark }) {
  const startRef = useRef<number | null>(null);
  useFrame(({ clock }) => { if (startRef.current == null) startRef.current = clock.elapsedTime; });
  const [wx, wz] = pxToWorld(m.x, m.y);
  const y = sampleTerrainHeight(wx, wz) + 0.04;
  const colA = m.aColor ?? CLASH_A;
  const colB = m.bColor ?? CLASH_B;
  // m.winner is the WINNING side (−1 = A/left, 1 = B/right); the loser breaks.
  // Falls back to a deterministic pick when an old mark carries no outcome.
  const loser: -1 | 1 = m.winner != null ? (m.winner === -1 ? 1 : -1)
    : (clashHash(m.x, m.y, 99) < 0.5 ? -1 : 1);
  const sizeFor = (tr?: number) => tr != null ? Math.max(3, Math.min(10, Math.round(tr / 2500))) : CLASH_PER_SIDE;
  const nA = sizeFor(m.aTroops), nB = sizeFor(m.bTroops);
  const brawlers = useMemo(() => {
    const out: Array<{ side: -1 | 1; lane: number; laneN: number; phase: number; fallAt: number | null }> = [];
    const build = (side: -1 | 1, n: number) => {
      for (let k = 0; k < n; k++) {
        const h = clashHash(m.x, m.y, side * 17 + k);
        const odds = side === loser ? 0.62 : 0.16;   // the broken side falls far more
        const fallAt = h < odds ? 0.35 + clashHash(m.x, m.y, side * 31 + k) * 0.4 : null;
        out.push({ side, lane: k, laneN: n, phase: h * Math.PI * 2, fallAt });
      }
    };
    build(-1, nA); build(1, nB);
    return out;
  }, [m.x, m.y, loser, nA, nB]);
  return (
    <group position={[wx, y, wz]}>
      {brawlers.map((b, i) => (
        <Brawler key={i} desc={b} loser={loser} color={b.side === -1 ? colA : colB} startRef={startRef} />
      ))}
      <ClashDust startRef={startRef} />
      {m.winName && <ClashResultFlag name={m.winName} color={m.winner === 1 ? colB : colA} startRef={startRef} />}
    </group>
  );
}

function Brawler({ desc, loser, color, startRef }: {
  desc: { side: -1 | 1; lane: number; laneN: number; phase: number; fallAt: number | null };
  loser: -1 | 1;
  color: string;
  startRef: { current: number | null };
}) {
  const ref = useRef<THREE.Group>(null);
  const mBody = useRef<THREE.MeshStandardMaterial>(null);
  const mHead = useRef<THREE.MeshStandardMaterial>(null);
  const mWpn = useRef<THREE.MeshStandardMaterial>(null);
  const startX = desc.side * 0.5;
  const meleeX = desc.side * 0.07;
  const laneZ = (desc.lane - (desc.laneN - 1) / 2) * 0.085;
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || startRef.current == null) return;
    const t = (clock.elapsedTime - startRef.current) / CLASH_DURATION;
    let x = meleeX, lunge = 0, fall = 0, op = 1;
    if (t < 0.26) {
      const p = t / 0.26;
      x = startX + (meleeX - startX) * (p * p * (3 - 2 * p));   // smoothstep charge
      op = Math.min(1, t / 0.05);
    } else {
      lunge = Math.sin(clock.elapsedTime * 9 + desc.phase) * 0.03;  // trading blows
      x = meleeX + lunge;
      if (desc.fallAt != null && t > desc.fallAt) fall = Math.min(1, (t - desc.fallAt) / 0.18);
      if (t > 0.84) {
        op = Math.max(0, 1 - (t - 0.84) / 0.16);                // fade to the mark
        if (desc.side === loser && desc.fallAt == null) x += (t - 0.84) * 1.3 * desc.side; // rout
      }
    }
    g.position.set(x, fall * -0.02, laneZ);
    g.rotation.z = fall * desc.side * -1.4;             // tip over when felled
    g.rotation.x = fall === 0 ? lunge * 4 : 0;          // lean into the lunge
    g.visible = t < 1.02;
    if (mBody.current) mBody.current.opacity = op;
    if (mHead.current) mHead.current.opacity = op;
    if (mWpn.current) mWpn.current.opacity = op;
  });
  return (
    <group ref={ref} position={[startX, 0, laneZ]} scale={0.9}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.03, 0.07, 0.025]} />
        <meshStandardMaterial ref={mBody} color={color} transparent roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.10, 0]} castShadow>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshStandardMaterial ref={mHead} color="#e0c498" transparent roughness={0.75} />
      </mesh>
      {/* weapon thrust toward the enemy line */}
      <mesh position={[-desc.side * 0.03, 0.09, 0]} rotation={[0, 0, desc.side * 0.9]} castShadow>
        <cylinderGeometry args={[0.003, 0.003, 0.10, 4]} />
        <meshStandardMaterial ref={mWpn} color="#cdd2d8" metalness={0.4} transparent />
      </mesh>
    </group>
  );
}

/** A small「X軍 勝」flag that rises over the site as the brawl is decided. */
function ClashResultFlag({ name, color, startRef }: {
  name: string; color: string; startRef: { current: number | null };
}) {
  const [show, setShow] = useState(false);
  useFrame(({ clock }) => {
    if (startRef.current == null) return;
    const t = (clock.elapsedTime - startRef.current) / CLASH_DURATION;
    const v = t > 0.55 && t < 1.3;
    if (v !== show) setShow(v);
  });
  if (!show) return null;
  return (
    <Html position={[0, 0.42, 0]} center distanceFactor={10} zIndexRange={[40, 30]} style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(15, 10, 5, 0.85)', border: `1px solid ${color}`, borderRadius: 3,
        padding: '1px 8px', color: '#ffe9a8', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
        fontSize: '12px', whiteSpace: 'nowrap', boxShadow: `0 0 9px ${color}99`,
      }}>{name}軍 勝</div>
    </Html>
  );
}

/** Dust kicked up by a clash — puffs swelling and fading over the brawl. */
function ClashDust({ startRef }: { startRef: { current: number | null } }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || startRef.current == null) return;
    const t = (clock.elapsedTime - startRef.current) / CLASH_DURATION;
    ref.current.visible = t < 1.0;
    const env = Math.min(1, t < 0.2 ? t / 0.2 : (1 - t) / 0.2);   // ease in/out
    for (let i = 0; i < ref.current.children.length; i++) {
      const mp = ref.current.children[i] as THREE.Mesh;
      const lt = (clock.elapsedTime * 0.6 + i / 6) % 1;
      mp.position.set((i - 2.5) * 0.06, 0.02 + lt * 0.1, 0);
      mp.scale.setScalar(0.04 + lt * 0.1);
      (mp.material as THREE.MeshBasicMaterial).opacity = 0.22 * (1 - lt) * Math.max(0, env);
    }
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#cdbfa8" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── 開戰演出 (stage 3) — when a battle ignites, a war-drum + horn sounds, a
 *  「X軍 ⚔ Y軍」 title card flashes, and dust bursts at the clash site, so the
 *  start of every fight reads as a moment, not a silent state flip. ── */
function BattleIgnitionCard() {
  const battleId = useGameStore((s) => s.tacticalBattle?.id ?? null);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const [card, setCard] = useState<{ a: string; b: string; ac: string; bc: string } | null>(null);
  const lastId = useRef<string | null>(null);
  useEffect(() => {
    if (!battleId || battleId === lastId.current) return;
    lastId.current = battleId;
    const b = useGameStore.getState().tacticalBattle;
    if (!b) return;
    const af = b.attackerForceId ? forces[b.attackerForceId] : undefined;
    const df = b.defenderForceId ? forces[b.defenderForceId] : undefined;
    setCard({
      a: af?.name.zh ?? '討伐軍',
      b: df?.name.zh ?? (cities[b.cityId]?.name.zh ?? '守軍'),
      ac: af?.color ?? '#3a7dd9',
      bc: df?.color ?? '#b8442e',
    });
    playSfx('wardrum');
    const t1 = setTimeout(() => playSfx('horn'), 260);
    const t2 = setTimeout(() => setCard(null), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [battleId, forces, cities]);
  if (!card) return null;
  const side = (c: string): React.CSSProperties => ({
    background: 'rgba(15, 10, 5, 0.86)', border: `2px solid ${c}`, borderRadius: 4,
    padding: '0.45rem 1.1rem', color: '#ffe9a8', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
    fontSize: '1.9rem', letterSpacing: '2px', textShadow: '0 0 8px rgba(0,0,0,0.9)',
    boxShadow: `0 0 18px ${c}aa`, whiteSpace: 'nowrap',
  });
  return (
    <div style={{
      position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)',
      zIndex: 30, pointerEvents: 'none',
    }}>
      <style>{'@keyframes tkm-ignite{0%{opacity:0;transform:scale(0.65)}14%{opacity:1;transform:scale(1.06)}28%{transform:scale(1)}82%{opacity:1}100%{opacity:0;transform:scale(1.02)}}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', animation: 'tkm-ignite 2.2s ease-out forwards' }}>
        <span style={side(card.ac)}>{card.a}軍</span>
        <span style={{ fontSize: '2.6rem', color: '#e0552a', textShadow: '0 0 18px #e0552a, 0 0 4px #fff' }}>⚔</span>
        <span style={side(card.bc)}>{card.b}軍</span>
      </div>
    </div>
  );
}

/** Dust kicked up at a battle's clash point the instant it ignites. */
function IgnitionDust3D() {
  const anchor = useGameStore((s) => s.tacticalBattle?.geoAnchor ?? null);
  const battleId = useGameStore((s) => s.tacticalBattle?.id ?? null);
  const ref = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const startRef = useRef<number | null>(null);
  const idRef = useRef<string | null>(null);
  useFrame(({ clock }) => {
    if (battleId !== idRef.current) {
      idRef.current = battleId;
      startRef.current = battleId ? clock.elapsedTime : null;
    }
    const g = ref.current;
    if (!g) return;
    if (startRef.current == null || !anchor) { g.visible = false; return; }
    const t = (clock.elapsedTime - startRef.current) / 1.3;
    if (t >= 1) { g.visible = false; return; }
    g.visible = true;
    const s = 0.25 + t * 1.7;
    g.scale.set(s, 1, s);
    if (matRef.current) matRef.current.opacity = 0.5 * (1 - t);
  });
  if (!anchor) return null;
  const [wx, wz] = pxToWorld(anchor.x, anchor.y);
  const y = sampleTerrainHeight(wx, wz) + 0.05;
  return (
    <group ref={ref} position={[wx, y, wz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.46, 32]} />
        <meshBasicMaterial ref={matRef} color="#d8c4a0" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function FieldCamp({ color, troops = 0 }: { color: string; troops?: number }) {
  const flagRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flagRef.current) {
      // Gentle flag flutter.
      flagRef.current.rotation.y = Math.sin(clock.elapsedTime * 2.2) * 0.25;
    }
  });
  // Camp footprint scales with the size of the garrison holding it.
  const tentCount = Math.max(3, Math.min(CAMP_TENTS.length, 3 + Math.floor(troops / 2500)));
  const s = Math.max(0.8, Math.min(1.7, 0.8 + troops / 16000));
  return (
    <group scale={[s, 1, s]}>
      {/* Palisade / earthwork ring. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[0.33, 0.4, 24]} />
        <meshStandardMaterial color="#6b4f2a" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Tents — four-sided canvas pyramids; count scales with troops. */}
      {CAMP_TENTS.slice(0, tentCount).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.085, z]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.1, 0.17, 4]} />
          <meshStandardMaterial color={i === 0 ? '#d8c79a' : '#c4b187'} roughness={0.8} />
        </mesh>
      ))}
      {/* Banner pole + force-colour flag at the centre of the camp. */}
      <mesh position={[0, 0.2, -0.02]}>
        <cylinderGeometry args={[0.012, 0.012, 0.4, 6]} />
        <meshStandardMaterial color="#3a2a18" />
      </mesh>
      <mesh ref={flagRef} position={[0.07, 0.34, -0.02]}>
        <planeGeometry args={[0.15, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** A warhorse for cavalry — body, neck, head, tail and four galloping legs. */
function Horse({ color }: { color: string }) {
  const fl = useRef<THREE.Group>(null);
  const fr = useRef<THREE.Group>(null);
  const bl = useRef<THREE.Group>(null);
  const br = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    // Diagonal gait — front-left swings with back-right, etc.
    const a = Math.sin(clock.elapsedTime * 8) * 0.5;
    if (fl.current) fl.current.rotation.x = a;
    if (br.current) br.current.rotation.x = a;
    if (fr.current) fr.current.rotation.x = -a;
    if (bl.current) bl.current.rotation.x = -a;
  });
  const hide = '#5a4030';
  const leg = (ref: { current: THREE.Group | null }, x: number, z: number) => (
    <group ref={ref} position={[x, 0.07, z]}>
      <mesh position={[0, -0.035, 0]} castShadow>
        <boxGeometry args={[0.016, 0.07, 0.016]} />
        <meshStandardMaterial color={hide} roughness={0.85} />
      </mesh>
    </group>
  );
  return (
    <group>
      {/* Barrel */}
      <mesh position={[0, 0.085, 0]} castShadow>
        <boxGeometry args={[0.05, 0.05, 0.15]} />
        <meshStandardMaterial color={hide} roughness={0.82} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.125, 0.085]} rotation={[0.5, 0, 0]} castShadow>
        <boxGeometry args={[0.034, 0.075, 0.03]} />
        <meshStandardMaterial color={hide} roughness={0.82} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.155, 0.118]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.026, 0.03, 0.06]} />
        <meshStandardMaterial color={hide} roughness={0.82} />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 0.095, -0.085]} rotation={[-0.7, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.002, 0.06, 4]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      {/* Caparison — saddle cloth in the force colour */}
      <mesh position={[0, 0.113, 0]} castShadow>
        <boxGeometry args={[0.056, 0.012, 0.09]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {leg(fl, -0.018, 0.058)}
      {leg(fr, 0.018, 0.058)}
      {leg(bl, -0.018, -0.058)}
      {leg(br, 0.018, -0.058)}
    </group>
  );
}

/**
 * An articulated foot/horse soldier built from primitives — head + helmet,
 * torso, two arms (one gripping the weapon), and two legs that stride in a
 * walk cycle. Weapon silhouette varies by class so an army's composition
 * reads at a glance; the leader gets a plumed helm, a cape and a banner.
 */
function Soldier({ dx, dz, color, phase, isLeader, weaponType }: {
  dx: number; dz: number; color: string; phase: number; isLeader: boolean;
  weaponType: WeaponType;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lLeg = useRef<THREE.Group>(null);
  const rLeg = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const bannerRef = useRef<THREE.Mesh>(null);
  const capeRef = useRef<THREE.Mesh>(null);
  const mounted = weaponType === 'cavalry';
  const robed = weaponType === 'fan';           // strategist — robe, no helmet
  const skin = '#e0c498';
  const cloth = robed ? '#cdbd95' : color;
  const dark = '#3a2818';
  const steel = '#c8ccd2';

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 5.5 + phase;
    const sw = Math.sin(t);
    if (groupRef.current) {
      groupRef.current.position.y = mounted
        ? Math.abs(Math.sin(clock.elapsedTime * 8 + phase)) * 0.012   // ride bob
        : Math.abs(Math.cos(t)) * 0.012;                              // foot bob
    }
    if (!mounted && !robed) {
      // Stride: legs swing fore/aft in anti-phase, free arm counter-swings.
      if (lLeg.current) lLeg.current.rotation.x = sw * 0.7;
      if (rLeg.current) rLeg.current.rotation.x = -sw * 0.7;
      if (lArm.current) lArm.current.rotation.x = -sw * 0.5;
    }
    if (bannerRef.current) bannerRef.current.rotation.z = Math.sin(clock.elapsedTime * 4 + phase) * 0.25;
    if (capeRef.current) capeRef.current.rotation.x = 0.1 + Math.sin(clock.elapsedTime * 3 + phase) * 0.12;
  });

  // hips sit higher when mounted so the rider straddles the saddle.
  const hipY = mounted ? 0.135 : 0.06;
  const tall = isLeader ? 1.12 : 1;

  // Weapon, anchored at the right hand and reaching upward.
  const weapon = (() => {
    if (robed) {
      return (
        <mesh position={[0, 0.06, 0.02]} rotation={[0, 0, 0.5]} castShadow>
          <circleGeometry args={[0.032, 12]} />
          <meshStandardMaterial color="#efe6cf" side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
      );
    }
    if (weaponType === 'bow' || weaponType === 'crossbow') {
      return (
        <mesh position={[0, 0.02, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.05, 0.005, 6, 10, Math.PI * 1.2]} />
          <meshStandardMaterial color="#6a4a28" roughness={0.7} />
        </mesh>
      );
    }
    if (weaponType === 'sabre' || weaponType === 'sword') {
      return (
        <mesh position={[0, 0.07, 0]} rotation={[0, 0, 0.12]} castShadow>
          <boxGeometry args={[0.008, 0.14, 0.004]} />
          <meshStandardMaterial color={steel} metalness={0.5} roughness={0.4} />
        </mesh>
      );
    }
    // pole arm — spear / halberd / siege / unarmed: tall shaft from the hand.
    const len = weaponType === 'halberd' ? 0.30 : 0.24;
    return (
      <group>
        <mesh position={[0, len / 2, 0]} castShadow>
          <cylinderGeometry args={[0.004, 0.004, len, 5]} />
          <meshStandardMaterial color={dark} roughness={0.8} />
        </mesh>
        <mesh position={[0, len, 0]} castShadow>
          {weaponType === 'halberd'
            ? <boxGeometry args={[0.03, 0.045, 0.004]} />
            : <coneGeometry args={[0.012, 0.045, 6]} />}
          <meshStandardMaterial color={steel} metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    );
  })();

  return (
    <group ref={groupRef} position={[dx, 0, dz]} scale={[1, tall, 1]}>
      {mounted && <Horse color={color} />}

      {/* ── Legs ── */}
      {robed ? (
        <mesh position={[0, hipY - 0.01, 0]} castShadow>
          <cylinderGeometry args={[0.028, 0.05, 0.12, 8]} />
          <meshStandardMaterial color={cloth} roughness={0.75} />
        </mesh>
      ) : mounted ? (
        <>
          <mesh position={[-0.03, hipY - 0.03, 0]} rotation={[0, 0, -0.5]} castShadow>
            <boxGeometry args={[0.018, 0.07, 0.02]} />
            <meshStandardMaterial color={dark} roughness={0.8} />
          </mesh>
          <mesh position={[0.03, hipY - 0.03, 0]} rotation={[0, 0, 0.5]} castShadow>
            <boxGeometry args={[0.018, 0.07, 0.02]} />
            <meshStandardMaterial color={dark} roughness={0.8} />
          </mesh>
        </>
      ) : (
        <>
          <group ref={lLeg} position={[-0.016, hipY, 0]}>
            <mesh position={[0, -0.03, 0]} castShadow>
              <boxGeometry args={[0.017, 0.06, 0.02]} />
              <meshStandardMaterial color={dark} roughness={0.8} />
            </mesh>
          </group>
          <group ref={rLeg} position={[0.016, hipY, 0]}>
            <mesh position={[0, -0.03, 0]} castShadow>
              <boxGeometry args={[0.017, 0.06, 0.02]} />
              <meshStandardMaterial color={dark} roughness={0.8} />
            </mesh>
          </group>
        </>
      )}

      {/* ── Torso + shoulder armour ── */}
      <mesh position={[0, hipY + 0.045, 0]} castShadow>
        <boxGeometry args={[0.05, 0.085, 0.032]} />
        <meshStandardMaterial color={cloth} roughness={0.72} />
      </mesh>
      {!robed && (
        <mesh position={[0, hipY + 0.082, 0]} castShadow>
          <boxGeometry args={[0.072, 0.018, 0.042]} />
          <meshStandardMaterial color="#caa86a" metalness={0.3} roughness={0.6} />
        </mesh>
      )}

      {/* ── Arms — left swings free, right grips the weapon ── */}
      <group ref={lArm} position={[-0.034, hipY + 0.072, 0]}>
        <mesh position={[0, -0.035, 0]} castShadow>
          <boxGeometry args={[0.014, 0.07, 0.014]} />
          <meshStandardMaterial color={cloth} roughness={0.75} />
        </mesh>
      </group>
      <group position={[0.038, hipY + 0.072, 0]}>
        <mesh position={[0, -0.032, 0]} castShadow>
          <boxGeometry args={[0.014, 0.07, 0.014]} />
          <meshStandardMaterial color={cloth} roughness={0.75} />
        </mesh>
        <group position={[0, -0.062, 0]}>{weapon}</group>
      </group>

      {/* ── Head + helmet / cap ── */}
      <mesh position={[0, hipY + 0.115, 0]} castShadow>
        <sphereGeometry args={[0.024, 7, 7]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      {robed ? (
        <mesh position={[0, hipY + 0.135, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.026, 0.022, 8]} />
          <meshStandardMaterial color="#2c2c34" roughness={0.8} />
        </mesh>
      ) : (
        <>
          <mesh position={[0, hipY + 0.127, 0]} castShadow>
            <sphereGeometry args={[0.027, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#8a8f98" metalness={0.5} roughness={0.45} />
          </mesh>
          {isLeader && (
            <mesh position={[0, hipY + 0.162, 0]} castShadow>
              <coneGeometry args={[0.012, 0.045, 6]} />
              <meshStandardMaterial color="#d23a2a" roughness={0.6} />
            </mesh>
          )}
        </>
      )}

      {/* ── Leader extras: fluttering cape + planted banner ── */}
      {isLeader && (
        <>
          <mesh ref={capeRef} position={[0, hipY + 0.05, -0.022]}>
            <planeGeometry args={[0.07, 0.11]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} />
          </mesh>
          <group position={[-0.052, hipY + 0.06, 0]}>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.22, 5]} />
              <meshStandardMaterial color={dark} />
            </mesh>
            <mesh ref={bannerRef} position={[0.05, 0.13, 0]} castShadow>
              <planeGeometry args={[0.09, 0.06]} />
              <meshStandardMaterial color={color} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.15} />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
}

/* ─── Compute heatmap color + label for a city given the current mode ── */
function overlayForCity(
  city: City,
  mode: OverlayMode,
  maxes: { gold: number; food: number; troops: number },
): { color: string; label: string } | null {
  if (mode === 'none' || mode === 'supply' || mode === 'diplomacy' || mode === 'threat') return null; // these draw their own
  if (mode === 'province') {
    const pid = PROVINCE_BY_CITY[city.id];
    const color = pid ? (PROVINCE_COLOR[pid] ?? '#5a4530') : '#5a4530';
    return { color, label: (pid ?? '?').toUpperCase() };
  }
  const v = mode === 'gold' ? city.gold
    : mode === 'food' ? city.food
    : mode === 'troops' ? city.troops
    : city.loyalty;
  let r = 0, g = 0, b = 0;
  if (mode === 'loyalty') {
    const t = Math.min(1, v / 100);
    if (t < 0.5) { r = 220; g = Math.floor(220 * (t * 2)); b = 60; }
    else { r = Math.floor(220 * (1 - (t - 0.5) * 2)); g = 200; b = Math.floor(220 * (t - 0.5) * 2); }
  } else {
    const max = mode === 'gold' ? maxes.gold : mode === 'food' ? maxes.food : maxes.troops;
    const t = Math.min(1, v / Math.max(1, max));
    r = Math.floor(60 + 180 * t);
    g = Math.floor(40 + 130 * t);
    b = Math.floor(30 + 30 * t);
  }
  const label = mode === 'loyalty' ? `${v}`
    : v >= 10000 ? `${Math.round(v / 1000)}k`
    : `${v}`;
  return { color: `rgb(${r},${g},${b})`, label };
}

/* ─── Top-level scene ─────────────────────────────────────── */
/* ─── 3D forest patches — scattered conifer cones on plains/low hills.
 *  Each patch is an ellipse in (lon, lat) with a target tree count. */
const FOREST_PATCHES: Array<{ lon: number; lat: number; rLon: number; rLat: number; trees: number }> = [
  // 江南 — south of Yangtze, the classic 江湖 forest belt
  { lon: 114, lat: 28.5, rLon: 4.0, rLat: 2.0, trees: 700 },
  // 楚地 — Jingzhou hills north of Yangtze
  { lon: 112, lat: 31.0, rLon: 2.5, rLat: 1.2, trees: 350 },
  // 蜀中 — Sichuan basin edges
  { lon: 105.5, lat: 30.5, rLon: 2.0, rLat: 1.5, trees: 350 },
  // 黔/桂 — south-central karst hills
  { lon: 109, lat: 25.5, rLon: 3.0, rLat: 2.0, trees: 500 },
  // 闽 — Fujian/Jiangxi hills (Wuyi)
  { lon: 117, lat: 27, rLon: 1.5, rLat: 2.5, trees: 300 },
  // 三辅周边 — central Henan/Anhui small patches
  { lon: 115, lat: 32.5, rLon: 2.5, rLat: 1.2, trees: 250 },
];
function Forest3D({ season }: { season: Season }) {
  const positions = useMemo(() => {
    const ps: { x: number; y: number; z: number; rot: number; scale: number }[] = [];
    for (const patch of FOREST_PATCHES) {
      // Phones plant a thinner wood — same patches, 60% of the trees.
      const target = IS_MOBILE ? Math.floor(patch.trees * 0.6) : patch.trees;
      for (let i = 0; i < target; i++) {
        // Random point within ellipse (sqrt for uniform area distribution)
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        const lon = patch.lon + Math.cos(a) * r * patch.rLon;
        const lat = patch.lat + Math.sin(a) * r * patch.rLat;
        const [px, py] = geoToPixel(lon, lat);
        const [wx, wz] = pxToWorld(px, py);
        const y = sampleTerrainHeight(wx, wz);
        // Skip sea, mountain peaks, and underwater spots
        if (y < 0.03 || y > 0.5) continue;
        ps.push({
          x: wx, y, z: wz,
          rot: Math.random() * Math.PI * 2,
          scale: 0.6 + Math.random() * 0.7,
        });
      }
    }
    return ps;
  }, []);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return;
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.y = p.rot;
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);
      canopyRef.current.setMatrixAt(i, dummy.matrix);
    }
    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  // 春華秋實 — the canopy follows the season: spring scatters blossom
  // through fresh green, summer is the old deep green, autumn turns the
  // woods gold and amber with late hold-outs, winter dusts them grey-green.
  // Deterministic per-tree hash so the same trees blossom every year.
  useEffect(() => {
    const canopy = canopyRef.current;
    if (!canopy) return;
    const c = new THREE.Color();
    for (let i = 0; i < positions.length; i++) {
      const h = ((i * 2654435761) >>> 0) % 100 / 100;
      const hex = season === 'spring' ? (h < 0.28 ? '#e0a8be' : '#3d6a34')
        : season === 'summer' ? '#2d4a28'
        : season === 'autumn' ? (h < 0.45 ? '#c8902e' : h < 0.75 ? '#a8651f' : '#56602a')
        : '#8e9a8c';
      canopy.setColorAt(i, c.set(hex));
    }
    if (canopy.instanceColor) canopy.instanceColor.needsUpdate = true;
  }, [positions, season]);

  return (
    <group>
      {/* Trunk — thin brown cylinder */}
      <instancedMesh ref={trunkRef} args={[undefined, undefined, positions.length]} castShadow>
        <cylinderGeometry args={[0.008, 0.012, 0.10, 5]} />
        <meshStandardMaterial color="#3a2818" roughness={0.95} />
      </instancedMesh>
      {/* Canopy — seasonal per-instance colour (white base × instanceColor) */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, positions.length]} castShadow>
        <coneGeometry args={[0.07, 0.30, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.92} />
      </instancedMesh>
    </group>
  );
}

/* ─── Season lighting presets — light/color only, no overlay planes ─
 *  Re-introduced after the overlay-plane bug. These ONLY change the
 *  three lights and the fog tint — no big planes that can occlude. */
interface SeasonPreset {
  ambient: number; ambientColor: string;
  sun: { color: string; intensity: number };
  fillColor: string; hemiSky: string; hemiGround: string; hemiIntensity: number;
  fogColor: string;
}
const SEASON_PRESETS: Record<Season, SeasonPreset> = {
  spring: {
    ambient: 0.80, ambientColor: '#fff5e0',
    sun: { color: '#fff5d8', intensity: 1.45 },
    fillColor: '#c8e0c8', hemiSky: '#a8d0e8', hemiGround: '#6a8a4a',
    hemiIntensity: 0.55, fogColor: '#c8c898',
  },
  summer: {
    ambient: 0.90, ambientColor: '#ffffff',
    sun: { color: '#ffffe8', intensity: 1.60 },
    fillColor: '#d0d0c0', hemiSky: '#a0c0e8', hemiGround: '#5a4530',
    hemiIntensity: 0.45, fogColor: '#c8b890',
  },
  autumn: {
    ambient: 0.72, ambientColor: '#ffe8c8',
    sun: { color: '#ffd8a0', intensity: 1.30 },
    fillColor: '#e0b888', hemiSky: '#c8a880', hemiGround: '#7a5530',
    hemiIntensity: 0.55, fogColor: '#c0a070',
  },
  winter: {
    ambient: 0.58, ambientColor: '#c8d8e8',
    sun: { color: '#e0e8f5', intensity: 1.15 },
    fillColor: '#8098c0', hemiSky: '#a0c0e8', hemiGround: '#607080',
    hemiIntensity: 0.5, fogColor: '#a8b8c8',
  },
};

/* ─── Weather presets ──────────────────────────────────────────── */
interface WeatherPreset {
  particles: 'none' | 'rain' | 'snow';
}
const WEATHER_PRESETS: Record<WeatherKind, WeatherPreset> = {
  clear:   { particles: 'none' },
  rain:    { particles: 'rain' },
  snow:    { particles: 'snow' },
  wind:    { particles: 'none' },
  drought: { particles: 'none' },
};

/* ─── Rain / snow particle components ──────────────────────────── */
function RainParticles({ count = 2000, bounds }: { count?: number; bounds: { x: number; z: number } }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * bounds.x * 1.6,
      z: (Math.random() - 0.5) * bounds.z * 1.6,
      y: Math.random() * 22,
      speed: 18 + Math.random() * 10,
    })),
  [count, bounds.x, bounds.z]);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.y -= s.speed * delta;
      if (s.y < 0) s.y = 22;
      dummy.position.set(s.x, s.y, s.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.018, 0.018, 0.4, 4]} />
      <meshBasicMaterial color="#a8c8e8" transparent opacity={0.5} />
    </instancedMesh>
  );
}
function SnowParticles({ count = 1500, bounds }: { count?: number; bounds: { x: number; z: number } }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * bounds.x * 1.6,
      z: (Math.random() - 0.5) * bounds.z * 1.6,
      y: Math.random() * 22,
      speed: 1.0 + Math.random() * 0.8,
      drift: Math.random() * Math.PI * 2,
    })),
  [count, bounds.x, bounds.z]);
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.y -= s.speed * delta;
      if (s.y < 0) s.y = 22;
      dummy.position.set(
        s.x + Math.sin(t + s.drift) * 0.4,
        s.y,
        s.z + Math.cos(t * 0.7 + s.drift) * 0.4,
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.07, 4, 4]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
    </instancedMesh>
  );
}

/* ─── Independent ports (RTK 14-style) ─────────────────────────────
 *  Placed at real (lon, lat). Owner color independent of any city.
 *  Sea routes drawn as faint blue lines connecting linked ports. */
/* ─── Forts (砦/壘) — small wooden military strongpoints ─────────── */
function Forts3D({ onFortClick, hideNearPx }: {
  onFortClick: (fortId: string) => void;
  hideNearPx?: { x: number; y: number } | null;
}) {
  const forts = useGameStore((s) => s.forts);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  return (
    <group>
      {Object.values(forts).map((fort) => {
        const color = fort.ownerForceId ? (forces[fort.ownerForceId]?.color ?? '#5a4530') : '#5a4530';
        const fac = fort.facility ? FACILITY_DEFS[fort.facility] : null;
        const [fpx, fpy] = geoToPixel(fort.coords.lon, fort.coords.lat);
        // Hidden under the battle diorama (in-range facilities fight ON it).
        if (hideNearPx && Math.hypot(fpx - hideNearPx.x, fpy - hideNearPx.y) < 42) return null;
        const [wx, wz] = pxToWorld(fpx, fpy);
        const wy = sampleTerrainHeight(wx, wz) + 0.04;
        // Scale grows with level: Lv1 ×0.5, Lv2 ×0.62, Lv3 ×0.75
        const levelMul = 0.50 + 0.125 * ((fort.level ?? 1) - 1);
        const s = PIXEL_TO_WORLD * 50 * levelMul;
        const hpPct = Math.max(0, Math.min(1, fort.hp / fort.maxHp));
        return (
          <group key={fort.id} position={[wx, wy, wz]} scale={s}>
            {/* Wooden palisade square base — also the click target */}
            <mesh
              position={[0, 0.15, 0]}
              castShadow receiveShadow
              onClick={(e) => { e.stopPropagation(); onFortClick(fort.id); }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = ''; }}
            >
              <boxGeometry args={[0.5, 0.30, 0.5]} />
              <meshStandardMaterial color="#5a4530" roughness={0.95} />
            </mesh>
            {/* Central watchtower */}
            <mesh position={[0, 0.50, 0]} castShadow>
              <boxGeometry args={[0.20, 0.40, 0.20]} />
              <meshStandardMaterial color={color} roughness={0.75} />
            </mesh>
            {/* Pyramidal roof */}
            <mesh position={[0, 0.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[0.18, 0.20, 4]} />
              <meshStandardMaterial color="#3a3a4a" roughness={0.85} />
            </mesh>
            {/* Banner pole */}
            <mesh position={[0.20, 0.50, 0]} castShadow>
              <cylinderGeometry args={[0.012, 0.012, 0.55, 4]} />
              <meshStandardMaterial color="#1a1410" />
            </mesh>
            <mesh position={[0.30, 0.65, 0]} castShadow>
              <planeGeometry args={[0.16, 0.10]} />
              <meshStandardMaterial color={color} side={THREE.DoubleSide} />
            </mesh>
            {/* 施設 accent + interdiction range ring. The ring radius is the
                facility's range in map-pixels, undone through the group scale so
                it reads at true world size. Own facilities ring brightest. */}
            {fac && (
              <mesh position={[0, 0.96, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[0.13, 0.26, fort.facility === 'catapult' ? 3 : 4]} />
                <meshStandardMaterial color={fac.color} emissive={fac.color} emissiveIntensity={0.25} roughness={0.6} />
              </mesh>
            )}
            {fac && fac.range > 0 && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[fac.range / (50 * levelMul) - 0.06, fac.range / (50 * levelMul), 48]} />
                <meshBasicMaterial
                  color={fac.color}
                  transparent
                  opacity={fort.ownerForceId === playerForceId ? 0.5 : 0.22}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
            {/* Label + HP bar */}
            <Html position={[0, 1.10, 0]} center distanceFactor={10} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                fontFamily: 'Songti SC, serif',
                fontSize: '10px',
                color: '#f0e8d0',
                background: 'rgba(20, 14, 8, 0.78)',
                border: `1px solid ${color}`,
                padding: '1px 5px',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}>
                <div>⚔ {fort.name.zh} <span style={{ color: '#d4a84a' }}>{'★'.repeat(fort.level ?? 1)}</span></div>
                <div style={{ height: 2, marginTop: 2, background: '#1a1410' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round(hpPct * 100)}%`,
                    background: hpPct > 0.5 ? '#7ed68a' : '#b8442e',
                  }} />
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function Ports3D({ onPortClick }: { onPortClick: (portId: string) => void }) {
  const ports = useGameStore((s) => s.ports);
  const forces = useGameStore((s) => s.forces);
  const portList = useMemo(() => Object.values(ports), [ports]);

  // Sea routes geometry (one per connection, dedup'd)
  const routeGeoms = useMemo(() => {
    const seen = new Set<string>();
    const list: THREE.BufferGeometry[] = [];
    for (const p of portList) {
      for (const otherId of p.connectedPortIds) {
        const a = p.id < otherId ? p.id : otherId;
        const b = p.id < otherId ? otherId : p.id;
        const key = `${a}|${b}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const other = ports[otherId];
        if (!other) continue;
        const [fx, fz] = pxToWorld(...geoToPixel(p.coords.lon, p.coords.lat));
        const [tx, tz] = pxToWorld(...geoToPixel(other.coords.lon, other.coords.lat));
        list.push(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(fx, 0.02, fz),
          new THREE.Vector3(tx, 0.02, tz),
        ]));
      }
    }
    return list;
  }, [portList, ports]);

  return (
    <group>
      {/* Sea-route lines — pale blue dashed-look */}
      {routeGeoms.map((g, i) => (
        <line key={`route-${i}`}>
          <primitive object={g} attach="geometry" />
          <lineBasicMaterial color="#5a9bc8" transparent opacity={0.45} />
        </line>
      ))}
      {/* Each port as a small dock structure */}
      {portList.map((p) => {
        const color = p.ownerForceId ? (forces[p.ownerForceId]?.color ?? '#5a4530') : '#5a4530';
        return <Port3D key={p.id} port={p} color={color} onClick={() => onPortClick(p.id)} />;
      })}
    </group>
  );
}

function Port3D({ port, color, onClick }: {
  port: import('../../game/types').Port;
  color: string;
  onClick: () => void;
}) {
  const [wx, wz] = pxToWorld(...geoToPixel(port.coords.lon, port.coords.lat));
  // Scale to match enlarged world
  const s = PIXEL_TO_WORLD * 50 * 0.6;
  const hpPct = Math.max(0, Math.min(1, port.hp / port.maxHp));
  return (
    <group position={[wx, 0, wz]} scale={s}>
      {/* Stone quay — main slab — click target */}
      <mesh
        position={[0, 0.05, 0]}
        castShadow receiveShadow
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <boxGeometry args={[0.6, 0.08, 0.25]} />
        <meshStandardMaterial color="#7a6750" roughness={0.92} />
      </mesh>
      {/* Wooden jetty running out over the water (L-shape) on stilts */}
      <mesh position={[-0.10, 0.045, 0.32]} castShadow receiveShadow>
        <boxGeometry args={[0.14, 0.035, 0.45]} />
        <meshStandardMaterial color="#6b5238" roughness={0.9} />
      </mesh>
      {[0.16, 0.34, 0.50].map((dz, i) => (
        <mesh key={i} position={[-0.10, -0.02, dz]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 4]} />
          <meshStandardMaterial color="#4a3826" roughness={0.95} />
        </mesh>
      ))}
      {/* Warehouse hut on the shore end */}
      <mesh position={[0.18, 0.135, -0.04]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.11, 0.13]} />
        <meshStandardMaterial color="#8a6a4a" roughness={0.85} />
      </mesh>
      <mesh position={[0.18, 0.215, -0.04]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.125, 0.09, 4]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.8} />
      </mesh>
      {/* Beacon — pole with a glowing brazier at the jetty head */}
      <mesh position={[-0.10, 0.16, 0.52]} castShadow>
        <cylinderGeometry args={[0.010, 0.013, 0.24, 4]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh position={[-0.10, 0.30, 0.52]}>
        <sphereGeometry args={[0.030, 8, 6]} />
        <meshStandardMaterial color="#ffb238" emissive="#ff8c1a" emissiveIntensity={1.6} />
      </mesh>
      {/* Breakwater — three stone blocks arcing off the quay */}
      {[[-0.42, 0.30], [-0.52, 0.16], [-0.56, 0.00]].map(([bx, bz], i) => (
        <mesh key={i} position={[bx, 0.015, bz]} rotation={[0, i * 0.5, 0]} castShadow>
          <boxGeometry args={[0.14, 0.07, 0.09]} />
          <meshStandardMaterial color="#6e6354" roughness={0.96} />
        </mesh>
      ))}
      {/* Owner banner pole + flag */}
      <mesh position={[0.28, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.55, 4]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh position={[0.40, 0.50, 0]} castShadow>
        <planeGeometry args={[0.22, 0.15]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* War junk moored at the jetty — hull, raised stern, batten sail */}
      <group position={[-0.30, 0.06, 0.42]} rotation={[0, 0.35, 0]}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <boxGeometry args={[0.34, 0.07, 0.11]} />
          <meshStandardMaterial color="#5a4530" roughness={0.85} />
        </mesh>
        <mesh position={[-0.145, 0.095, 0]} castShadow>
          <boxGeometry args={[0.06, 0.05, 0.10]} />
          <meshStandardMaterial color="#6b5238" roughness={0.85} />
        </mesh>
        <mesh position={[0.02, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.30, 4]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        <mesh position={[0.02, 0.24, 0.015]} rotation={[0, 0, -0.08]}>
          <planeGeometry args={[0.16, 0.20]} />
          <meshStandardMaterial color="#c8b078" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {/* sail battens */}
        {[-0.06, 0, 0.06].map((dy, i) => (
          <mesh key={i} position={[0.02, 0.24 + dy, 0.018]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[0.165, 0.006, 0.004]} />
            <meshStandardMaterial color="#7a5c38" />
          </mesh>
        ))}
      </group>
      {/* Second, smaller sampan */}
      <mesh position={[0.10, 0.075, 0.50]} rotation={[0, -0.4, 0]} castShadow>
        <boxGeometry args={[0.18, 0.05, 0.07]} />
        <meshStandardMaterial color="#6b5238" roughness={0.88} />
      </mesh>
      {/* Label + HP bar — drei Html */}
      <Html position={[0, 0.85, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontFamily: 'Songti SC, serif',
          fontSize: '11px',
          color: '#f0e8d0',
          background: 'rgba(20, 14, 8, 0.78)',
          border: `1px solid ${color}`,
          padding: '1px 5px',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          minWidth: 40,
        }}>
          <div>⚓ {port.name.zh}</div>
          <div style={{ height: 2, marginTop: 2, background: '#1a1410' }}>
            <div style={{
              height: '100%',
              width: `${Math.round(hpPct * 100)}%`,
              background: hpPct > 0.5 ? '#7ed68a' : '#b8442e',
            }} />
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ─── 北疆长城 — Qin/Han Great Wall draped along the northern frontier ─
 *  A stone rampart following the Yinshan/Yan ranges from the Hexi west end
 *  to Liaodong, with watchtowers at intervals. Instanced for cheapness. */
const WALL_GEO: ReadonlyArray<readonly [number, number]> = [
  [102.5, 38.2], [105.5, 39.2], [108.0, 40.3], [110.5, 41.2],
  [113.0, 41.6], [115.5, 41.6], [118.0, 41.2], [120.5, 41.2], [122.5, 41.3],
];
function GreatWall3D() {
  const { segments, towers } = useMemo(() => {
    const pxPts = WALL_GEO.map(([lo, la]) => geoToPixel(lo, la));
    const dense: Array<[number, number]> = [];
    const STEP = 7;                                   // px between rampart blocks
    for (let i = 0; i < pxPts.length - 1; i++) {
      const [ax, ay] = pxPts[i], [bx, by] = pxPts[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / STEP));
      for (let k = 0; k < n; k++) dense.push([ax + (bx - ax) * (k / n), ay + (by - ay) * (k / n)]);
    }
    dense.push(pxPts[pxPts.length - 1]);
    const segments: Array<{ x: number; y: number; z: number; rot: number; len: number }> = [];
    const towers: Array<[number, number, number]> = [];
    for (let i = 0; i < dense.length - 1; i++) {
      const [wax, waz] = pxToWorld(dense[i][0], dense[i][1]);
      const [wbx, wbz] = pxToWorld(dense[i + 1][0], dense[i + 1][1]);
      const mx = (wax + wbx) / 2, mz = (waz + wbz) / 2;
      const len = Math.hypot(wbx - wax, wbz - waz);
      segments.push({ x: mx, y: sampleTerrainHeight(mx, mz), z: mz, rot: Math.atan2(wbz - waz, wbx - wax), len });
      if (i % 9 === 0) towers.push([wax, sampleTerrainHeight(wax, waz), waz]);
    }
    return { segments, towers };
  }, []);
  const wallRef = useRef<THREE.InstancedMesh>(null);
  const towerRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const d = new THREE.Object3D();
    if (wallRef.current) {
      segments.forEach((s, i) => {
        d.position.set(s.x, s.y + 0.15, s.z);
        d.rotation.set(0, -s.rot, 0);
        d.scale.set(s.len * 1.2, 1, 1);
        d.updateMatrix();
        wallRef.current!.setMatrixAt(i, d.matrix);
      });
      wallRef.current.instanceMatrix.needsUpdate = true;
    }
    if (towerRef.current) {
      const e = new THREE.Object3D();
      towers.forEach((p, i) => {
        e.position.set(p[0], p[1] + 0.25, p[2]);
        e.updateMatrix();
        towerRef.current!.setMatrixAt(i, e.matrix);
      });
      towerRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [segments, towers]);
  return (
    <group>
      <instancedMesh ref={wallRef} args={[undefined, undefined, segments.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.30, 0.14]} />
        <meshStandardMaterial color="#7c766c" roughness={0.96} metalness={0.02} />
      </instancedMesh>
      <instancedMesh ref={towerRef} args={[undefined, undefined, towers.length]} castShadow receiveShadow>
        <boxGeometry args={[0.19, 0.50, 0.19]} />
        <meshStandardMaterial color="#b0a896" roughness={0.93} metalness={0.02} />
      </instancedMesh>
    </group>
  );
}

/* ─── 大湖 — 洞庭/鄱阳/太湖, a shimmering water surface over the painted
 *  lake basin so the great lakes read as open water, not just blue ground. */
function Lakes3D() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Gentle opacity shimmer so the lakes feel alive like the sea.
    const o = 0.86 + Math.sin(clock.elapsedTime * 0.8) * 0.05;
    ref.current.children.forEach((m) => {
      const mat = (m as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) mat.opacity = o;
    });
  });
  return (
    <group ref={ref}>
      {LAKES.map((lk, i) => {
        const [wx, wz] = pxToWorld(lk.x, lk.y);
        const r = lk.r * PIXEL_TO_WORLD;
        // Lift the surface above the territory tint plane (terrain +0.05) so
        // the lakes read as open water instead of being painted over by it.
        const y = sampleTerrainHeight(wx, wz) + 0.09;
        return (
          <mesh key={i} position={[wx, y, wz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[r, 40]} />
            <meshStandardMaterial color="#2c6e9c" roughness={0.26} metalness={0.55} transparent opacity={0.86} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ─── 州界虚线 — dashed ink borders between the thirteen provinces ───
 *  A draped texture: sample the map on a coarse grid, assign each land
 *  sample to its nearest city's province (same Voronoi the territory
 *  layer uses), and stipple a dash wherever neighbouring samples belong
 *  to different provinces. Water (sea/lake/river) is skipped so borders
 *  stop at the coast and break at rivers. Static — built once. */
let provinceBorderTexCache: THREE.Texture | null = null;
function buildProvinceBorderTexture(cities: Record<string, City>): THREE.Texture {
  if (provinceBorderTexCache) return provinceBorderTexCache;
  const W = 2000, H = 1440;                    // 2× pixel space, crisper dots
  const STEP = 2;                              // logical-px sampling grid
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // City geo-pixel positions + province ids
  const pts: Array<{ x: number; y: number; pid: string }> = [];
  for (const c of Object.values(cities)) {
    const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
    pts.push({ x: px, y: py, pid: PROVINCE_BY_CITY[c.id] ?? '?' });
  }
  const isWater = (x: number, y: number): boolean => {
    if (landSDF(x, y) < 0) return true;
    for (const lk of LAKES) if (Math.hypot(x - lk.x, y - lk.y) < lk.r) return true;
    for (const r of RIVERS) if (distToPolyline(x, y, r.points) < r.width) return true;
    return false;
  };
  const provAt = (x: number, y: number): string | null => {
    if (isWater(x, y)) return null;
    let best = ''; let bd = Infinity;
    for (const p of pts) {
      const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d < bd) { bd = d; best = p.pid; }
    }
    return best;
  };
  // Cache one row at a time so each sample's province is computed once.
  const cols = Math.floor(1000 / STEP), rows = Math.floor(720 / STEP);
  let prevRow: Array<string | null> = new Array(cols).fill(null);
  for (let gy = 0; gy < rows; gy++) {
    const row: Array<string | null> = new Array(cols);
    for (let gx = 0; gx < cols; gx++) row[gx] = provAt(gx * STEP, gy * STEP);
    for (let gx = 0; gx < cols; gx++) {
      const here = row[gx];
      if (!here) continue;
      const right = gx + 1 < cols ? row[gx + 1] : null;
      const up = prevRow[gx];
      const isBorder = (right && right !== here) || (up && up !== here);
      if (!isBorder) continue;
      const x = gx * STEP, y = gy * STEP;
      // Dash rhythm: ~12px ink, ~6px gap along the border's run.
      if ((x + y) % 18 >= 12) continue;
      // Parchment halo under an ink dot — reads on both dark and gold ground.
      ctx.fillStyle = 'rgba(238, 226, 196, 0.40)';
      ctx.beginPath(); ctx.arc(x * 2, y * 2, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(48, 34, 18, 0.72)';
      ctx.beginPath(); ctx.arc(x * 2, y * 2, 2.0, 0, Math.PI * 2); ctx.fill();
    }
    prevRow = row;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = true;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.anisotropy = 8;
  provinceBorderTexCache = tex;
  return tex;
}

function ProvinceBorders3D({ cities }: { cities: Record<string, City> }) {
  // Same displaced plane as the territory layer, a hair higher so the
  // dashes sit on top of the tint but under lakes/labels.
  const geom = useMemo(() => {
    const subW = 240, subD = 180;
    const g = new THREE.PlaneGeometry(MAP_W, MAP_D, subW, subD);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wy = pos.getY(i);
      const px = (wx + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (MAP_D / 2 - wy) / PIXEL_TO_WORLD;
      pos.setZ(i, sampleTerrain(px, py).h + 0.06);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const texture = useMemo(() => buildProvinceBorderTexture(cities), [cities]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geom} renderOrder={2}>
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/* ─── 州名 — the thirteen Han provinces as faint floating watermarks so
 *  the player can read regions at a glance. Big + translucent, behind the
 *  city labels; they scale with distance so they recede when you zoom in. */
const STATES_GEO: ReadonlyArray<{ zh: string; lon: number; lat: number }> = [
  { zh: '司隸', lon: 110.0, lat: 34.7 },
  { zh: '豫州', lon: 114.4, lat: 33.2 },
  { zh: '冀州', lon: 114.7, lat: 37.9 },
  { zh: '兗州', lon: 116.1, lat: 35.5 },
  { zh: '徐州', lon: 118.4, lat: 34.1 },
  { zh: '青州', lon: 119.4, lat: 36.9 },
  { zh: '荊州', lon: 112.2, lat: 30.0 },
  { zh: '揚州', lon: 118.7, lat: 30.0 },
  { zh: '益州', lon: 104.1, lat: 30.0 },
  { zh: '涼州', lon: 101.4, lat: 37.2 },
  { zh: '并州', lon: 112.4, lat: 38.6 },
  { zh: '幽州', lon: 118.8, lat: 40.6 },
  { zh: '交州', lon: 108.0, lat: 22.6 },
];
function ProvinceLabels3D() {
  return (
    <group>
      {STATES_GEO.map((s) => {
        const [wx, wz] = pxToWorld(...geoToPixel(s.lon, s.lat));
        const y = sampleTerrainHeight(wx, wz) + 1.4;
        return (
          <Html key={s.zh} position={[wx, y, wz]} center distanceFactor={32}
            zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
              fontSize: '46px', fontWeight: 700,
              color: 'rgba(255, 246, 224, 0.30)',
              textShadow: '0 2px 12px rgba(0,0,0,0.55)',
              letterSpacing: '0.22em', whiteSpace: 'nowrap', userSelect: 'none',
            }}>{s.zh}</div>
          </Html>
        );
      })}
    </group>
  );
}

/* ─── 冬雪 — a snow blanket draped over the northern terrain in winter ─
 *  Static latitude/altitude mask (built once), shown only in winter.
 *  The Yellow River freezes too — its ribbon goes pale ice-blue. */
let snowMaskCache: THREE.Texture | null = null;
function buildSnowMask(): THREE.Texture {
  if (snowMaskCache) return snowMaskCache;
  const W = 500, H = 360;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = (x / W) * PX_W, py = (y / H) * PX_H;
      const lat = GEO_LAT_MAX - (py / PX_H) * GEO_LAT_SPAN;
      let alpha = Math.max(0, Math.min(1, (lat - 31) / 6)) * 0.62;   // deep north whitens
      const { h } = sampleTerrain(px, py);
      if (h < 0) alpha = 0;                                          // no snow on water
      else if (h > 0.5) alpha = Math.min(0.85, alpha + 0.35);        // snow-capped ranges
      const i = (y * W + x) * 4;
      d[i] = 245; d[i + 1] = 248; d[i + 2] = 252;
      d[i + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = true;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  snowMaskCache = tex;
  return tex;
}

function SnowBlanket() {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(MAP_W, MAP_D, 240, 180);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wy = pos.getY(i);
      const px = (wx + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (MAP_D / 2 - wy) / PIXEL_TO_WORLD;
      pos.setZ(i, sampleTerrain(px, py).h + 0.04);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const texture = useMemo(() => buildSnowMask(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geom} renderOrder={1}>
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/* ─── 行軍預覽 — glowing route while the march picker is open ─────── */
function MarchPreviewLine({ fromId, toId, cities }: {
  fromId: string; toId: string; cities: Record<string, City>;
}) {
  const data = useMemo(() => {
    const from = cities[fromId];
    const to = cities[toId];
    if (!from || !to) return null;
    const fp = cityPos(from);
    const tp = cityPos(to);
    const route = terrainRoute(fp.x, fp.y, tp.x, tp.y);
    const pts = route.map((p) => {
      const [wx, wz] = pxToWorld(p.x, p.y);
      return new THREE.Vector3(wx, sampleTerrainHeight(wx, wz) + 0.12, wz);
    });
    // Cities the column marches past that could sally out at it.
    const risky: Array<[number, number]> = [];
    for (const c of Object.values(cities)) {
      if (!c.ownerForceId || c.ownerForceId === from.ownerForceId) continue;
      if (c.id === toId || c.id === fromId) continue;
      if (c.troops < 4000) continue;
      const cp = cityPos(c);
      const near = route.some((p) => Math.hypot(p.x - cp.x, p.y - cp.y) < 67);
      if (near) risky.push(pxToWorld(cp.x, cp.y));
    }
    return { pts, risky };
  }, [fromId, toId, cities]);
  const matRef = useRef<THREE.LineDashedMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.75 + Math.sin(clock.elapsedTime * 3) * 0.2;
  });
  const geom = useMemo(() => {
    if (!data) return null;
    const g = new THREE.BufferGeometry().setFromPoints(data.pts);
    return g;
  }, [data]);
  const lineObj = useMemo(() => {
    if (!geom) return null;
    const mat = new THREE.LineDashedMaterial({ color: '#ffd75e', dashSize: 0.5, gapSize: 0.3, transparent: true, opacity: 0.95 });
    const l = new THREE.Line(geom, mat);
    l.computeLineDistances();
    return { l, mat };
  }, [geom]);
  useEffect(() => {
    if (lineObj) matRef.current = lineObj.mat as never;
  }, [lineObj]);
  if (!data || !lineObj) return null;
  return (
    <group>
      <primitive object={lineObj.l} />
      {/* 邀擊 risk — hostile garrisons within sally reach of the route */}
      {data.risky.map(([wx, wz], i) => (
        <mesh key={i} position={[wx, sampleTerrainHeight(wx, wz) + 0.1, wz]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.66, 24]} />
          <meshBasicMaterial color="#ff5040" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── 雲影 — soft clouds drifting over the land, shadows in tow ───── */
function DriftingClouds() {
  const ref = useRef<THREE.Group>(null);
  // Deterministic cloud field: position, scale, speed per cloud.
  const clouds = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    x0: ((i * 137) % 100) / 100 * MAP_W - MAP_W / 2,
    z0: ((i * 71 + 23) % 100) / 100 * MAP_D - MAP_D / 2,
    s: 2.6 + ((i * 53) % 10) / 10 * 2.8,
    v: 0.12 + ((i * 31) % 10) / 10 * 0.1,
    puffs: [[0, 0, 1], [0.8, 0.25, 0.72], [-0.7, 0.18, 0.6]] as Array<[number, number, number]>,
  })), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.children.forEach((g, i) => {
      const c = clouds[i];
      // Drift east, wrap around the map edge.
      const span = MAP_W + 16;
      let x = c.x0 + t * c.v;
      x = ((x + span / 2) % span) - span / 2;
      g.position.x = x;
    });
  });
  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x0, 0, c.z0]}>
          {/* The cloud — soft white puffs high above */}
          {c.puffs.map(([dx, dz, ps], j) => (
            <mesh key={j} position={[dx * c.s, 8.5 + j * 0.1, dz * c.s]} scale={[1, 0.32, 1]}>
              <sphereGeometry args={[c.s * 0.5 * ps, 10, 8]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.2} depthWrite={false} roughness={1} />
            </mesh>
          ))}
          {/* Its shadow — a dark blot gliding over the ground */}
          {c.puffs.map(([dx, dz, ps], j) => (
            <mesh key={`s${j}`} position={[dx * c.s, 0.42, dz * c.s]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[c.s * 0.55 * ps, 18]} />
              <meshBasicMaterial color="#0a0c10" transparent opacity={0.09} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ─── 邦交關係線 — the web of pacts and grudges, capital to capital ────
   The 邦交 overlay arcs every meaningful relation between living forces:
   gold solid = alliance, green dashed = non-aggression pact, red = open
   hostility (neutral status soured to score ≤ -40). Plain neutrals stay
   undrawn or the map turns to spaghetti. Lines involving the player ride
   slightly thicker; the midpoint chip carries the relation score. */
function DiplomacyLines3D({ cities, forces }: {
  cities: Record<string, City>;
  forces: Record<string, Force>;
}) {
  const diplomacy = useGameStore((s) => s.diplomacy);
  const playerForceId = useGameStore((s) => s.playerForceId);

  const links = useMemo(() => {
    // A force is alive if it still holds a city; anchor at its capital,
    // falling back to any city it holds (capitals do fall).
    const holdings = new Map<string, City[]>();
    for (const c of Object.values(cities)) {
      if (!c.ownerForceId) continue;
      if (!holdings.has(c.ownerForceId)) holdings.set(c.ownerForceId, []);
      holdings.get(c.ownerForceId)!.push(c);
    }
    const anchorOf = (forceId: string): City | null => {
      const owned = holdings.get(forceId);
      if (!owned || owned.length === 0) return null;
      const cap = forces[forceId] ? cities[forces[forceId].capitalCityId] : null;
      return cap && cap.ownerForceId === forceId ? cap : owned[0];
    };
    const out: Array<{
      pts: THREE.Vector3[];
      mid: THREE.Vector3;
      kind: 'allied' | 'pact' | 'hostile';
      score: number;
      mine: boolean;
    }> = [];
    for (const rel of Object.values(diplomacy.relations)) {
      const hostile = rel.status === 'neutral' && rel.score <= -40;
      if (rel.status === 'neutral' && !hostile) continue;
      const a = anchorOf(rel.forceA);
      const b = anchorOf(rel.forceB);
      if (!a || !b) continue;
      const [ax, az] = pxToWorld(...cityPixel(a.id, a.coords.x, a.coords.y));
      const [bx, bz] = pxToWorld(...cityPixel(b.id, b.coords.x, b.coords.y));
      const ay = cityElevation(ax, az) + 0.25;
      const by = cityElevation(bx, bz) + 0.25;
      const dist = Math.hypot(bx - ax, bz - az);
      const mid = new THREE.Vector3((ax + bx) / 2, Math.max(ay, by) + 0.7 + dist * 0.16, (az + bz) / 2);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(ax, ay, az), mid, new THREE.Vector3(bx, by, bz),
      );
      out.push({
        pts: curve.getPoints(28),
        mid,
        kind: rel.status === 'allied' ? 'allied' : rel.status === 'non-aggression' ? 'pact' : 'hostile',
        score: rel.score,
        mine: rel.forceA === playerForceId || rel.forceB === playerForceId,
      });
    }
    return out;
  }, [diplomacy, cities, forces, playerForceId]);

  const STYLE = {
    allied:  { color: '#f0c060', zh: '盟' },
    pact:    { color: '#9ed68a', zh: '約' },
    hostile: { color: '#ff5040', zh: '仇' },
  } as const;

  return (
    <group>
      {links.map((l, i) => {
        const st = STYLE[l.kind];
        return (
          <group key={i}>
            <Line
              points={l.pts}
              color={st.color}
              dashed={l.kind === 'pact'}
              dashSize={0.4}
              gapSize={0.22}
              lineWidth={l.mine ? 2.2 : 1.3}
              transparent
              opacity={l.mine ? 0.95 : 0.65}
            />
            <Html position={l.mid} center distanceFactor={11} zIndexRange={[28, 18]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(20,14,8,0.88)', border: `1px solid ${st.color}`, borderRadius: 3,
                padding: '1px 6px', fontFamily: 'Songti SC, serif', fontSize: 10,
                color: st.color, whiteSpace: 'nowrap', letterSpacing: '1px',
              }}>
                {st.zh} {l.score > 0 ? `+${l.score}` : l.score}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 事件地標 — the season's calamities and windfalls, on the map ─────
   The report scrolls past once; the land remembers. Each city the tick
   touched (饑荒/瘟疫/豐收/民變/襲擾) wears a single-character chip until
   the next tick replaces the marks. Tap a chip to select the city. */
const EVENT_MARK_STYLE: Record<string, { ch: string; color: string; border: string }> = {
  harvest:     { ch: '豐', color: '#f0d98a', border: '#d4a84a' },
  famine:      { ch: '饑', color: '#e0b890', border: '#a07040' },
  flood:       { ch: '洪', color: '#9cc8e8', border: '#4a78a8' },
  plague:      { ch: '疫', color: '#d8a8e8', border: '#9060a8' },
  rebellion:   { ch: '亂', color: '#ff9080', border: '#b8584a' },
  'tribe-raid': { ch: '襲', color: '#ffb070', border: '#c87838' },
};

function EventMarks3D({ cities, hidePx, visibleCityIds, onPick }: {
  cities: Record<string, City>;
  hidePx: { x: number; y: number } | null;
  /** 戰爭迷霧 — when set, only marks on in-view cities show. */
  visibleCityIds?: Set<string> | null;
  onPick: (cityId: string) => void;
}) {
  const marks = useGameStore((s) => s.cityEventMarks ?? EMPTY_EVENT_MARKS);
  const byCity = useMemo(() => {
    const m = new Map<string, Array<{ kind: string; text: string }>>();
    for (const mk of marks) {
      if (visibleCityIds && !visibleCityIds.has(mk.cityId)) continue;
      if (!m.has(mk.cityId)) m.set(mk.cityId, []);
      m.get(mk.cityId)!.push(mk);
    }
    return m;
  }, [marks, visibleCityIds]);
  return (
    <group>
      {[...byCity.entries()].map(([cityId, list]) => {
        const city = cities[cityId];
        if (!city) return null;
        const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
        if (hidePx && Math.hypot(px - hidePx.x, py - hidePx.y) < 50) return null;
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        return (
          <Html key={cityId} position={[wx + 0.45, y + 0.62, wz]} center distanceFactor={9} zIndexRange={[36, 26]}>
            <div style={{ display: 'flex', gap: 3 }}>
              {list.map((mk, i) => {
                const st = EVENT_MARK_STYLE[mk.kind];
                if (!st) return null;
                return (
                  <div
                    key={i}
                    onClick={(e) => { e.stopPropagation(); onPick(cityId); }}
                    title={mk.text}
                    style={{
                      width: 20, height: 20, borderRadius: '50%', cursor: 'pointer',
                      background: 'rgba(20,14,8,0.92)', border: `1px solid ${st.border}`,
                      color: st.color, fontFamily: 'Songti SC, serif', fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
                    }}
                  >{st.ch}</div>
                );
              })}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
const EMPTY_EVENT_MARKS: Array<{ cityId: string; kind: string; text: string }> = [];
const EMPTY_THREATS: Record<string, { color: string; label: string }> = {};
const FOG_OVERLAY = { color: '#4a4a48', label: '?' };
const EMPTY_REVEALS: Record<string, number> = {};

/* ─── 漕運商船 — junks plying the busiest sea and river lanes ──────────
   The naval counterpart of the ox-cart caravans: each port-to-port lane
   (the same straight edges naval marches sail) gets a trade junk if it's
   among the realm's busiest, ranked by the linked cities' commerce. The
   junks ping-pong, bob and heel a little; downed ports lose their trade. */
const SHIP_COUNT = IS_MOBILE ? 3 : 7;

function TradeShips3D({ ports, cities }: {
  ports: Record<string, Port>;
  cities: Record<string, City>;
}) {
  const routes = useMemo(() => {
    const seen = new Set<string>();
    const pairs: Array<{ a: Port; b: Port; score: number }> = [];
    for (const p of Object.values(ports)) {
      if (p.hp <= 0) continue;
      for (const qid of p.connectedPortIds) {
        const q = ports[qid];
        if (!q || q.hp <= 0) continue;
        const key = p.id < qid ? p.id + qid : qid + p.id;
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({
          a: p, b: q,
          score: (cities[p.linkedCityId]?.commerce ?? 0) + (cities[q.linkedCityId]?.commerce ?? 0),
        });
      }
    }
    pairs.sort((x, y) => y.score - x.score);
    const out: Array<{ ax: number; az: number; bx: number; bz: number; total: number; speed: number; phase: number }> = [];
    for (const { a, b } of pairs.slice(0, SHIP_COUNT)) {
      const [ax, az] = pxToWorld(...geoToPixel(a.coords.lon, a.coords.lat));
      const [bx, bz] = pxToWorld(...geoToPixel(b.coords.lon, b.coords.lat));
      const total = Math.hypot(bx - ax, bz - az);
      if (total < 0.8) continue;
      out.push({
        ax, az, bx, bz, total,
        speed: 0.18 + ((out.length * 29) % 10) * 0.012,
        phase: ((out.length * 113) % 100) / 100,
      });
    }
    return out;
  }, [ports, cities]);

  const refs = useRef<Array<THREE.Group | null>>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    routes.forEach((r, i) => {
      const g = refs.current[i];
      if (!g) return;
      const d2 = ((t * r.speed) / r.total + r.phase) % 2;
      const back = d2 > 1;
      const f = back ? 2 - d2 : d2;
      g.position.set(
        r.ax + (r.bx - r.ax) * f,
        0.045 + Math.sin(t * 1.7 + i * 2.1) * 0.012,
        r.az + (r.bz - r.az) * f,
      );
      g.rotation.y = Math.atan2((r.bx - r.ax) * (back ? -1 : 1), (r.bz - r.az) * (back ? -1 : 1));
      g.rotation.z = Math.sin(t * 1.1 + i) * 0.05; // gentle heel
    });
  });

  return (
    <group>
      {routes.map((_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          {/* 船身 */}
          <mesh position={[0, 0.025, 0]} castShadow>
            <boxGeometry args={[0.11, 0.05, 0.3]} />
            <meshStandardMaterial color="#6a4a2c" roughness={0.85} />
          </mesh>
          {/* 艉樓 */}
          <mesh position={[0, 0.062, -0.1]}>
            <boxGeometry args={[0.08, 0.035, 0.08]} />
            <meshStandardMaterial color="#7d5a36" roughness={0.85} />
          </mesh>
          {/* 桅杆 */}
          <mesh position={[0, 0.14, 0.02]}>
            <cylinderGeometry args={[0.006, 0.008, 0.2, 6]} />
            <meshStandardMaterial color="#4a3520" roughness={0.9} />
          </mesh>
          {/* 帆 */}
          <mesh position={[0, 0.15, 0.02]}>
            <planeGeometry args={[0.15, 0.16]} />
            <meshStandardMaterial color="#d8c9a0" roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── 入暮燈火 — at dusk every settlement lights its lamps ─────────────
   Pairs with 晝夜隨旬: the lower half-month's warm twilight gets answered
   by window-lights scattered around each city token, more of them the
   bigger the city. One InstancedMesh of over-bright quads so the desktop
   bloom pass gives every lamp a halo; positions are deterministic per
   city, so the same windows light up every evening. */
const LAMPS_BY_TIER: Record<string, number> = {
  hamlet: 3, town: 5, city: 8, large: 12, capital: 16,
};

function DuskCityLights({ cities }: { cities: Record<string, City> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const lamps = useMemo(() => {
    const out: Array<{ x: number; y: number; z: number; s: number }> = [];
    for (const city of Object.values(cities)) {
      const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      const baseY = cityElevation(wx, wz);
      const full = LAMPS_BY_TIER[citySize(city).id] ?? 4;
      const n = IS_MOBILE ? Math.ceil(full / 2) : full; // phones carry half the lamps
      for (let i = 0; i < n; i++) {
        // Deterministic scatter — same hash trick the quilt tint uses.
        const h1 = Math.abs(Math.sin(px * 12.9898 + i * 78.233));
        const h2 = Math.abs(Math.sin(py * 39.346 + i * 11.135));
        const ang = h1 * Math.PI * 2;
        const rad = 0.12 + h2 * 0.4;
        out.push({
          x: wx + Math.cos(ang) * rad,
          y: baseY + 0.08 + h1 * 0.22,
          z: wz + Math.sin(ang) * rad,
          s: 0.022 + h2 * 0.02,
        });
      }
    }
    return out;
  }, [cities]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    lamps.forEach((l, i) => {
      pos.set(l.x, l.y, l.z);
      scl.setScalar(l.s);
      mesh.setMatrixAt(i, m.compose(pos, q, scl));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [lamps]);

  // A slow communal flicker — oil lamps, not LEDs.
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.82 + Math.sin(clock.elapsedTime * 2.3) * 0.08;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, Math.max(1, lamps.length)]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 5]} />
      {/* Over-bright so the bloom pass halos each lamp. */}
      <meshBasicMaterial ref={matRef} color={new THREE.Color(2.2, 1.5, 0.65)} transparent opacity={0.85} toneMapped={false} />
    </instancedMesh>
  );
}

/* ─── 商隊 — trade carts trundling the busiest roads of the realm ──────
   Ambient life: ox-carts ping-pong along the REAL march routes between
   adjacent same-owner cities (internal trade), the busiest first — pair
   count scales with the cities' combined commerce. Pure flavour; carts
   carry no state and answer to no clicks. */
const CARAVAN_COUNT = IS_MOBILE ? 4 : 12;

function Caravans3D({ cities }: { cities: Record<string, City> }) {
  const routes = useMemo(() => {
    // Busiest internal trade pairs — adjacent cities under the same lord
    // (or both masterless — peddlers don't care), ranked by commerce.
    const seen = new Set<string>();
    const pairs: Array<{ a: City; b: City; score: number }> = [];
    for (const a of Object.values(cities)) {
      for (const adjId of a.adjacentCityIds ?? []) {
        const b = cities[adjId];
        if (!b || b.ownerForceId !== a.ownerForceId) continue;
        const key = a.id < adjId ? a.id + adjId : adjId + a.id;
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({ a, b, score: a.commerce + b.commerce });
      }
    }
    pairs.sort((x, y) => y.score - x.score);
    const out: Array<{ pts: THREE.Vector3[]; cum: number[]; total: number; speed: number; phase: number }> = [];
    for (const { a, b } of pairs.slice(0, CARAVAN_COUNT)) {
      const pa = cityPos(a);
      const pb = cityPos(b);
      const route = terrainRoute(pa.x, pa.y, pb.x, pb.y);
      const pts = route.map((p) => {
        const [wx, wz] = pxToWorld(p.x, p.y);
        return new THREE.Vector3(wx, sampleTerrainHeight(wx, wz) + 0.045, wz);
      });
      if (pts.length < 2) continue;
      const cum = [0];
      for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + pts[k].distanceTo(pts[k - 1]));
      const total = cum[cum.length - 1];
      if (total < 0.6) continue; // neighbours practically inside each other
      out.push({
        pts, cum, total,
        speed: 0.22 + ((out.length * 37) % 10) * 0.012,
        phase: ((out.length * 131) % 100) / 100,
      });
    }
    return out;
  }, [cities]);

  const refs = useRef<Array<THREE.Group | null>>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    routes.forEach((r, i) => {
      const g = refs.current[i];
      if (!g) return;
      // Ping-pong along the route — out with goods, back with silver.
      const d2 = ((t * r.speed) / r.total + r.phase) % 2;
      const back = d2 > 1;
      const s = (back ? 2 - d2 : d2) * r.total;
      let k = 1;
      while (k < r.cum.length - 1 && r.cum[k] < s) k++;
      const seg = r.cum[k] - r.cum[k - 1] || 1;
      const f = (s - r.cum[k - 1]) / seg;
      const p0 = r.pts[k - 1];
      const p1 = r.pts[k];
      g.position.lerpVectors(p0, p1, f);
      g.rotation.y = Math.atan2((p1.x - p0.x) * (back ? -1 : 1), (p1.z - p0.z) * (back ? -1 : 1));
    });
  });

  return (
    <group>
      {routes.map((_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }} scale={0.8}>
          {/* 牛 — the ox out front */}
          <mesh position={[0, 0.045, 0.1]} castShadow>
            <boxGeometry args={[0.05, 0.055, 0.1]} />
            <meshStandardMaterial color="#5d4226" roughness={0.9} />
          </mesh>
          {/* 車板 */}
          <mesh position={[0, 0.05, -0.04]} castShadow>
            <boxGeometry args={[0.09, 0.03, 0.15]} />
            <meshStandardMaterial color="#8a6a40" roughness={0.85} />
          </mesh>
          {/* 篷布 */}
          <mesh position={[0, 0.09, -0.05]} castShadow>
            <boxGeometry args={[0.08, 0.05, 0.11]} />
            <meshStandardMaterial color="#cfc09a" roughness={0.95} />
          </mesh>
          {/* 車輪 */}
          {[-0.052, 0.052].map((x) => (
            <mesh key={x} position={[x, 0.03, -0.04]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.012, 10]} />
              <meshStandardMaterial color="#3a2a18" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ─── ⬡ 棋盤世界 — experimental hex-tile world terrain ──────────────────
   The whole strategic map rendered as the same hex-prism quilt the battle
   board and city hinterland use — one visual language from world to battle.
   Each hex samples the REAL geography (battleGroundAt) for its kind and the
   SAME height function the entities already stand on (sampleTerrainHeight),
   so cities/armies/forts sit perfectly without touching any of them. Sea
   hexes are skipped — the animated Ocean shows through. Toggleable; the
   painted scroll map stays as the default/backup. */

type HexWorldTile = { x: number; z: number; topY: number; kind: string; c: number; r: number };

const HEXW_R = IS_MOBILE ? 0.18 : 0.12;       // hex radius (world units) — fine quilt (~22k land tiles desktop)
const HEXW_COL = 1.5 * HEXW_R;
const HEXW_ROW = Math.sqrt(3) * HEXW_R;
const HEXWORLD_COLOR: Record<string, string> = {
  river: '#2c5882', lake: '#27607f', riverbank: '#8a8a5e',
  mountain: '#6f5e4d', hill: '#7c7250', plain: '#5f7a42',
};
// Generated once per session — ~60k geography samples are far too slow per
// render, and even one synchronous build hitches the first toggle. The cache
// builds COLUMN-CHUNKED so the title screen's asset warmer can grind it out
// during idle time before the player ever opens the map.
let HEXWORLD_CACHE: HexWorldTile[] | null = null;
const hexWarmPartial: HexWorldTile[] = [];
let hexWarmCol = 0;
function buildHexColumn(c: number, out: HexWorldTile[]): boolean {
  const x = -MAP_W / 2 + HEXW_R + c * HEXW_COL;
  if (x > MAP_W / 2) return false;
  for (let r = 0; ; r++) {
    const z = -MAP_D / 2 + HEXW_ROW / 2 + r * HEXW_ROW + (c & 1 ? HEXW_ROW / 2 : 0);
    if (z > MAP_D / 2) break;
    const px = (x + MAP_W / 2) / PIXEL_TO_WORLD;
    const py = (z + MAP_D / 2) / PIXEL_TO_WORLD;
    const kind = battleGroundAt(px, py);
    if (kind === 'sea') continue; // let the living ocean show through
    const water = kind === 'river' || kind === 'lake';
    const topY = water ? 0.012 : Math.max(0.05, sampleTerrainHeight(x, z));
    out.push({ x, z, topY, kind, c, r });
  }
  return true;
}
/** Build a slice of the hex world; true once the whole quilt is cached. */
export function warmHexWorldTiles(cols = 10): boolean {
  if (HEXWORLD_CACHE) return true;
  for (let i = 0; i < cols; i++) {
    if (!buildHexColumn(hexWarmCol, hexWarmPartial)) {
      HEXWORLD_CACHE = hexWarmPartial;
      return true;
    }
    hexWarmCol++;
  }
  return false;
}
function buildHexWorldTiles(): HexWorldTile[] {
  while (!warmHexWorldTiles(64)) { /* finish synchronously if still cold */ }
  return HEXWORLD_CACHE!;
}

/** The hex quilt as one InstancedMesh — matrices are written once (tiles never
 *  move), and ownership/season changes only rewrite the instanceColor buffer,
 *  so a conquest recolours ~22k prisms without touching the scene graph. */
function HexQuilt({ tiles, colors }: { tiles: HexWorldTile[]; colors: string[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    tiles.forEach((t, i) => {
      pos.set(t.x, (t.topY - 0.3) / 2, t.z);
      scl.set(HEXW_R * 0.995, t.topY + 0.3, HEXW_R * 0.995);
      mesh.setMatrixAt(i, m.compose(pos, q, scl));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [tiles]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const c = new THREE.Color();
    for (let i = 0; i < colors.length; i++) mesh.setColorAt(i, c.set(colors[i]));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [colors]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, Math.max(1, tiles.length)]}
      receiveShadow
      frustumCulled={false}
    >
      {/* thetaStart π/6 points the hex vertices along ±x — the flat-top
          orientation our 1.5R/√3R column layout tessellates with. Without
          it the hexes sit 30° off and leave diagonal gaps. */}
      <cylinderGeometry args={[1, 1, 1, 6, 1, false, Math.PI / 6]} />
      <meshStandardMaterial roughness={0.93} metalness={0.02} />
    </instancedMesh>
  );
}

function HexWorldTerrain({ winter, cities, forces, territoryOwnership, fogCityIds, onGroundClick }: {
  winter: boolean;
  cities: Record<string, City>;
  forces: Record<string, Force>;
  territoryOwnership: Record<string, string | null>;
  /** 戰爭迷霧 — when set, tiles seeded by an out-of-view city dim. */
  fogCityIds?: Set<string> | null;
  onGroundClick?: (px: number, py: number) => void;
}) {
  const tiles = useMemo(() => buildHexWorldTiles(), []);

  // Shared (c,r) → tile-index lookup for neighbours, roads and hover.
  const tileIndex = useMemo(() => {
    const m = new Map<string, number>();
    tiles.forEach((t, i) => m.set(`${t.c},${t.r}`, i));
    return m;
  }, [tiles]);

  // 道路地塊 — walk every adjacent-city pair's REAL march route and stamp the
  // hexes under it as road, so the network armies actually travel is the one
  // you see paved into the quilt.
  const roadTiles = useMemo(() => {
    const set = new Set<number>();
    const seen = new Set<string>();
    const stepPx = (HEXW_ROW / PIXEL_TO_WORLD) * 0.5;
    for (const a of Object.values(cities)) {
      for (const adjId of a.adjacentCityIds ?? []) {
        const b = cities[adjId];
        if (!b) continue;
        const key = a.id < adjId ? a.id + adjId : adjId + a.id;
        if (seen.has(key)) continue;
        seen.add(key);
        const pa = cityPos(a);
        const pb = cityPos(b);
        const route = terrainRoute(pa.x, pa.y, pb.x, pb.y);
        for (let s = 0; s < route.length - 1; s++) {
          const p0 = route[s], p1 = route[s + 1];
          const steps = Math.max(1, Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y) / stepPx));
          for (let k = 0; k <= steps; k++) {
            const px = p0.x + (p1.x - p0.x) * (k / steps);
            const py = p0.y + (p1.y - p0.y) * (k / steps);
            const x = px * PIXEL_TO_WORLD - MAP_W / 2;
            const z = py * PIXEL_TO_WORLD - MAP_D / 2;
            const c = Math.round((x + MAP_W / 2 - HEXW_R) / HEXW_COL);
            const zoff = c & 1 ? HEXW_ROW / 2 : 0;
            const r = Math.round((z + MAP_D / 2 - HEXW_ROW / 2 - zoff) / HEXW_ROW);
            const i = tileIndex.get(`${c},${r}`);
            if (i !== undefined) set.add(i);
          }
        }
      }
    }
    return set;
  }, [tiles, tileIndex, cities]);

  // 領土歸屬 — each land hex takes its nearest territory centroid's owner
  // (override ?? parent city's lord), the SAME resolution the painted
  // territory layer uses, so both map styles always agree on borders.
  const { tileOwner, tileProvince, tileCity } = useMemo(() => {
    const seeds = generateTerritories(Object.values(cities)).map((t) => ({
      x: t.coords.x,
      y: t.coords.y,
      owner: territoryOwnership[t.id] ?? cities[t.parentCityId]?.ownerForceId ?? null,
      province: PROVINCE_BY_CITY[t.parentCityId] ?? null,
      city: t.parentCityId,
    }));
    const owners: Array<string | null> = [];
    const provinces: Array<string | null> = [];
    const citySeeds: Array<string | null> = [];
    for (const t of tiles) {
      if (t.kind === 'river' || t.kind === 'lake') { owners.push(null); provinces.push(null); citySeeds.push(null); continue; }
      const px = (t.x + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (t.z + MAP_D / 2) / PIXEL_TO_WORLD;
      let best: string | null = null;
      let bestProv: string | null = null;
      let bestCity: string | null = null;
      let bestD = Infinity;
      for (const s of seeds) {
        const d = (s.x - px) * (s.x - px) + (s.y - py) * (s.y - py);
        if (d < bestD) { bestD = d; best = s.owner; bestProv = s.province; bestCity = s.city; }
      }
      owners.push(best);
      provinces.push(bestProv);
      citySeeds.push(bestCity);
    }
    return { tileOwner: owners, tileProvince: provinces, tileCity: citySeeds };
  }, [tiles, cities, territoryOwnership]);

  // 州界 — province seams (decals sink into the prisms, so the quilt carves
  // its own): a land tile whose neighbour belongs to a different province
  // takes a subtle charcoal seam (realm borders win when both apply).
  const tileProvBorder = useMemo(() => {
    const isWater = (k: string) => k === 'river' || k === 'lake';
    return tiles.map((t, i) => {
      if (isWater(t.kind) || !tileProvince[i]) return false;
      const nbs = t.c & 1
        ? [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
        : [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]];
      for (const [dc, dr] of nbs) {
        const j = tileIndex.get(`${t.c + dc},${t.r + dr}`);
        if (j === undefined) continue;
        if (isWater(tiles[j].kind)) continue;
        if (tileProvince[j] && tileProvince[j] !== tileProvince[i]) return true;
      }
      return false;
    });
  }, [tiles, tileIndex, tileProvince]);

  // 國界 — an owned hex bordering a DIFFERENT owner (or unowned wilderness)
  // is a frontier tile: it gets a deeper, more saturated realm colour so the
  // borders cut sharply. Sea/river neighbours don't count (coasts and rivers
  // already outline themselves).
  const tileBorder = useMemo(() => {
    const isWater = (k: string) => k === 'river' || k === 'lake';
    return tiles.map((t, i) => {
      if (isWater(t.kind)) return false;
      const own = tileOwner[i];
      if (!own) return false;
      // Flat-top hex neighbours; odd columns are shifted +half a row.
      const nbs = t.c & 1
        ? [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
        : [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]];
      for (const [dc, dr] of nbs) {
        const j = tileIndex.get(`${t.c + dc},${t.r + dr}`);
        if (j === undefined) continue;          // sea — no edge
        if (isWater(tiles[j].kind)) continue;   // river — no edge
        if (tileOwner[j] !== own) return true;
      }
      return false;
    });
  }, [tiles, tileIndex, tileOwner]);

  // Per-tile colour — terrain base blended toward the owning force's colour
  // (deeper on frontier tiles); seasonal: snow-dusted land in winter.
  const colors = useMemo(() => tiles.map((t, i) => {
    const water = t.kind === 'river' || t.kind === 'lake';
    const ownerId = tileOwner[i];
    const owner = ownerId ? (forces[ownerId]?.color ?? null) : null;
    const border = tileBorder[i];
    if (winter) {
      const roadW = !water && roadTiles.has(i);
      const snow = water ? '#bcd2dc' : roadW ? '#a89878' : t.kind === 'mountain' ? '#cfd4d8' : '#c9cfc3';
      if (!owner || water || roadW) return snow; // packed dirt shows through the snow
      const col = new THREE.Color(snow).lerp(new THREE.Color(owner), border ? 0.5 : 0.26);
      if (border) col.offsetHSL(0, 0, -0.06);
      return `#${col.getHexString()}`;
    }
    const road = !water && roadTiles.has(i);
    const base = road ? '#9a8358' : (HEXWORLD_COLOR[t.kind] ?? HEXWORLD_COLOR.plain);
    const col = new THREE.Color(base);
    // Cheap deterministic tint so the plains read as a quilt, not a slab.
    if (!road && (t.kind === 'plain' || t.kind === 'hill')) {
      const h = Math.abs(Math.sin(t.x * 12.9898 + t.z * 78.233)) * 0.12;
      col.offsetHSL(0, 0, h - 0.06);
    }
    if (owner && !water) {
      // Roads take only a light realm wash so the network stays readable.
      col.lerp(new THREE.Color(owner), road ? 0.18 : border ? 0.68 : 0.38);
      if (border && !road) col.offsetHSL(0, 0.05, -0.08);
    }
    // Province seam — subtle, and only where a realm border isn't already
    // doing the talking.
    if (!water && !border && tileProvBorder[i]) col.offsetHSL(0, 0, -0.07);
    // 戰爭迷霧 — ground seeded by a city you can't see fades toward dusk.
    if (fogCityIds && !water && tileCity[i] && !fogCityIds.has(tileCity[i]!)) col.offsetHSL(0, -0.12, -0.13);
    return `#${col.getHexString()}`;
  }), [tiles, winter, tileOwner, tileBorder, tileProvBorder, roadTiles, forces, fogCityIds, tileCity]);

  // 地塊資訊 — hover (desktop) names the tile: terrain, road, owning realm.
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const hoverTile = hoverIdx != null ? tiles[hoverIdx] : null;
  const KIND_ZH: Record<string, string> = {
    plain: '平原', hill: '丘陵', mountain: '山地', river: '大河', lake: '湖泊', riverbank: '河岸',
  };

  return (
    <group>
      {/* Invisible click/hover-catcher — same click contract as MapTerrain. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          // Touch has no hover — a tap doubles as the tile inspector
          // (auto-dismisses; doesn't interfere with march-to-cell orders).
          if (IS_MOBILE) {
            const c = Math.round((e.point.x + MAP_W / 2 - HEXW_R) / HEXW_COL);
            const zoff = c & 1 ? HEXW_ROW / 2 : 0;
            const r = Math.round((e.point.z + MAP_D / 2 - HEXW_ROW / 2 - zoff) / HEXW_ROW);
            const i = tileIndex.get(`${c},${r}`) ?? null;
            setHoverIdx(i);
            if (i != null) window.setTimeout(() => setHoverIdx((cur) => (cur === i ? null : cur)), 2600);
          }
          if (!onGroundClick) return;
          const px = (e.point.x + MAP_W / 2) / PIXEL_TO_WORLD;
          const py = (e.point.z + MAP_D / 2) / PIXEL_TO_WORLD;
          onGroundClick(px, py);
        }}
        onPointerMove={IS_MOBILE ? undefined : (e) => {
          const c = Math.round((e.point.x + MAP_W / 2 - HEXW_R) / HEXW_COL);
          const zoff = c & 1 ? HEXW_ROW / 2 : 0;
          const r = Math.round((e.point.z + MAP_D / 2 - HEXW_ROW / 2 - zoff) / HEXW_ROW);
          const i = tileIndex.get(`${c},${r}`) ?? null;
          if (i !== hoverIdx) setHoverIdx(i);
        }}
        onPointerOut={IS_MOBILE ? undefined : () => setHoverIdx(null)}
      >
        <planeGeometry args={[MAP_W, MAP_D]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <HexQuilt tiles={tiles} colors={colors} />
      {hoverTile && (() => {
        const ownerId = tileOwner[hoverIdx!];
        const ownerName = ownerId ? forces[ownerId]?.name.zh : null;
        const road = roadTiles.has(hoverIdx!);
        return (
          <Html position={[hoverTile.x, hoverTile.topY + 0.35, hoverTile.z]} center distanceFactor={9} zIndexRange={[30, 20]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(20, 14, 8, 0.88)', border: '1px solid #5a4530', borderRadius: 3,
              padding: '2px 7px', fontFamily: 'Songti SC, serif', fontSize: '11px',
              color: '#e8d9b0', whiteSpace: 'nowrap', letterSpacing: '0.5px',
            }}>
              {KIND_ZH[hoverTile.kind] ?? hoverTile.kind}{road ? ' · 道' : ''}
              {ownerName ? <span style={{ color: forces[ownerId!]?.color ?? '#c0a878' }}> · {ownerName}領</span> : ' · 無主之地'}
            </div>
          </Html>
        );
      })()}
    </group>
  );
}

/* ─── 橋樑 — timber bridges where a road crosses a river/lake. Each
 *  city-adjacency edge is sampled; a crossing run gets one bridge oriented
 *  along the road. ── */
function Bridges3D({ cities }: { cities: Record<string, City> }) {
  const bridges = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ x: number; z: number; rot: number }> = [];
    for (const c of Object.values(cities)) {
      for (const adj of c.adjacentCityIds ?? []) {
        const o = cities[adj]; if (!o) continue;
        const key = c.id < o.id ? `${c.id}|${o.id}` : `${o.id}|${c.id}`;
        if (seen.has(key)) continue; seen.add(key);
        const [fpx, fpy] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [tpx, tpy] = cityPixel(o.id, o.coords.x, o.coords.y);
        const cross: Array<[number, number]> = [];
        const N = 26;
        for (let i = 1; i < N; i++) {
          const t = i / N;
          const px = fpx + (tpx - fpx) * t, py = fpy + (tpy - fpy) * t;
          const g = battleGroundAt(px, py);
          if (g === 'river' || g === 'lake') cross.push([px, py]);
        }
        if (cross.length === 0) continue;
        const [mpx, mpy] = cross[Math.floor(cross.length / 2)];
        const [wx, wz] = pxToWorld(mpx, mpy);
        const [fx, fz] = pxToWorld(fpx, fpy);
        const [tx, tz] = pxToWorld(tpx, tpy);
        out.push({ x: wx, z: wz, rot: Math.atan2(tx - fx, tz - fz) });
      }
    }
    return out;
  }, [cities]);
  if (bridges.length === 0) return null;
  return (
    <group>
      {bridges.map((b, i) => (
        <group key={i} position={[b.x, sampleTerrainHeight(b.x, b.z) + 0.05, b.z]} rotation={[0, b.rot, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.025, 0.9]} />
            <meshStandardMaterial color="#8a6840" roughness={0.85} />
          </mesh>
          <mesh position={[0.08, 0.04, 0]}><boxGeometry args={[0.015, 0.05, 0.9]} /><meshStandardMaterial color="#5f4326" /></mesh>
          <mesh position={[-0.08, 0.04, 0]}><boxGeometry args={[0.015, 0.05, 0.9]} /><meshStandardMaterial color="#5f4326" /></mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── 田疇 — cultivated fields ringing each city, so settlements sit in
 *  farmland rather than bare ground. Instanced flat paddies. ── */
function Farmland3D({ cities }: { cities: Record<string, City> }) {
  const fields = useMemo(() => {
    const out: Array<{ x: number; y: number; z: number; rot: number; s: number }> = [];
    for (const c of Object.values(cities)) {
      if (c.name.zh.includes('關')) continue;   // passes have no fields
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [cx, cz] = pxToWorld(px, py);
      const n = IS_MOBILE ? 4 : 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (px % 1.3);
        const r = 0.42 + (i % 2) * 0.26;       // a couple of rings just outside the wall
        const fx = cx + Math.cos(a) * r, fz = cz + Math.sin(a) * r;
        const y = sampleTerrainHeight(fx, fz);
        if (y < 0.05 || y > 0.28) continue;    // no fields on water or steep ground
        out.push({ x: fx, y, z: fz, rot: a, s: 0.85 + (i % 3) * 0.18 });
      }
    }
    return out;
  }, [cities]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      dummy.position.set(f.x, f.y + 0.02, f.z);
      dummy.rotation.set(0, f.rot, 0);
      dummy.scale.set(f.s, 1, f.s * 0.7);
      dummy.updateMatrix(); ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [fields, dummy]);
  if (fields.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, fields.length]} receiveShadow>
      <boxGeometry args={[0.24, 0.008, 0.18]} />
      <meshStandardMaterial color="#94a24c" roughness={0.95} />
    </instancedMesh>
  );
}

/* ─── 村落 — scattered countryside hamlets (mud-brick body + thatch roof),
 *  instanced across the land so the realm feels inhabited between cities. ── */
function Villages3D() {
  const houses = useMemo(() => {
    const out: Array<{ x: number; y: number; z: number; rot: number; s: number }> = [];
    const N = IS_MOBILE ? 130 : 300;
    let tries = 0;
    while (out.length < N && tries < N * 14) {
      tries++;
      const [wx, wz] = pxToWorld(Math.random() * PX_W, Math.random() * PX_H);
      const y = sampleTerrainHeight(wx, wz);
      if (y < 0.05 || y > 0.30) continue;   // skip sea + steep mountain
      out.push({ x: wx, y, z: wz, rot: Math.random() * Math.PI * 2, s: 0.55 + Math.random() * 0.5 });
    }
    return out;
  }, []);
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const roofRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (!bodyRef.current || !roofRef.current) return;
    for (let i = 0; i < houses.length; i++) {
      const h = houses[i];
      dummy.position.set(h.x, h.y + 0.018 * h.s, h.z);
      dummy.rotation.y = h.rot; dummy.scale.setScalar(h.s);
      dummy.updateMatrix(); bodyRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(h.x, h.y + 0.05 * h.s, h.z);
      dummy.updateMatrix(); roofRef.current.setMatrixAt(i, dummy.matrix);
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
    roofRef.current.instanceMatrix.needsUpdate = true;
  }, [houses, dummy]);
  if (houses.length === 0) return null;
  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, houses.length]} castShadow>
        <boxGeometry args={[0.045, 0.04, 0.055]} />
        <meshStandardMaterial color="#9a8462" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[undefined, undefined, houses.length]} castShadow>
        <coneGeometry args={[0.045, 0.03, 4]} />
        <meshStandardMaterial color="#6a5238" roughness={0.85} />
      </instancedMesh>
    </group>
  );
}

/* ─── 驛站 — a relay post (hut + pennant) at the midpoint of long roads,
 *  on dry ground, so the highways feel travelled. ── */
function PostStations3D({ cities }: { cities: Record<string, City> }) {
  const posts = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ x: number; z: number; rot: number }> = [];
    for (const c of Object.values(cities)) {
      for (const adj of c.adjacentCityIds ?? []) {
        const o = cities[adj]; if (!o) continue;
        const key = c.id < o.id ? `${c.id}|${o.id}` : `${o.id}|${c.id}`;
        if (seen.has(key)) continue; seen.add(key);
        const [fpx, fpy] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [tpx, tpy] = cityPixel(o.id, o.coords.x, o.coords.y);
        const mpx = (fpx + tpx) / 2, mpy = (fpy + tpy) / 2;
        const g = battleGroundAt(mpx, mpy);
        if (g === 'river' || g === 'lake' || g === 'sea') continue;   // not on water (bridges handle that)
        const [fx, fz] = pxToWorld(fpx, fpy);
        const [tx, tz] = pxToWorld(tpx, tpy);
        if (Math.hypot(tx - fx, tz - fz) < 5) continue;               // only the longer hauls
        const [mx, mz] = pxToWorld(mpx, mpy);
        if (sampleTerrainHeight(mx, mz) < 0.06) continue;
        out.push({ x: mx, z: mz, rot: Math.atan2(tx - fx, tz - fz) });
      }
    }
    return out;
  }, [cities]);
  if (posts.length === 0) return null;
  return (
    <group>
      {posts.map((p, i) => (
        <group key={i} position={[p.x, sampleTerrainHeight(p.x, p.z), p.z]} rotation={[0, p.rot, 0]}>
          <mesh position={[0, 0.03, 0]} castShadow><boxGeometry args={[0.07, 0.06, 0.08]} /><meshStandardMaterial color="#a08a64" roughness={0.9} /></mesh>
          <mesh position={[0, 0.075, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.065, 0.035, 4]} /><meshStandardMaterial color="#5f4a2e" roughness={0.85} /></mesh>
          <mesh position={[0.05, 0.1, 0.05]}><cylinderGeometry args={[0.004, 0.004, 0.14, 4]} /><meshStandardMaterial color="#3a2818" /></mesh>
          <mesh position={[0.085, 0.13, 0.05]}><planeGeometry args={[0.06, 0.035]} /><meshStandardMaterial color="#c0502e" side={THREE.DoubleSide} /></mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── 名勝古戰場 — a stone stele + label marking the famous battlefields the
 *  named-map data records (赤壁/官渡/長坂/定軍山…). One per battle. ── */
function Landmarks3D({ cities }: { cities: Record<string, City> }) {
  const sites = useMemo(() => {
    const usedMap = new Set<string>();
    const out: Array<{ x: number; z: number; name: string }> = [];
    for (const [cid, mapId] of Object.entries(NAMED_MAPS_BY_CITY)) {
      if (usedMap.has(mapId)) continue;
      const c = cities[cid]; const m = NAMED_MAPS_BY_ID[mapId];
      if (!c || !m) continue;
      usedMap.add(mapId);
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      out.push({ x: wx, z: wz, name: m.name.zh });
    }
    return out;
  }, [cities]);
  return (
    <group>
      {sites.map((s, i) => {
        const x = s.x + 0.55, z = s.z + 0.55;
        const y = sampleTerrainHeight(x, z);
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 0.12, 0]} castShadow><boxGeometry args={[0.06, 0.24, 0.04]} /><meshStandardMaterial color="#5a554e" roughness={0.85} /></mesh>
            <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[0.085, 0.03, 0.06]} /><meshStandardMaterial color="#46423b" roughness={0.8} /></mesh>
            <Html position={[0, 0.37, 0]} center distanceFactor={13} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(28, 18, 10, 0.8)', border: '1px solid #8a7050', borderRadius: 3,
                padding: '1px 6px', color: '#e0c89a', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                fontSize: '11px', whiteSpace: 'nowrap',
              }}>⚔ {s.name}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 唯一名建築 — landmark monuments at iconic cities ────────────────
 * Each three-kingdoms capital and a handful of legendary sites carry a
 * one-of-a-kind structure that reads instantly from the map: 鄴 flies the
 * Bronze Sparrow Terrace, the Han capitals raise twin-eaved palace halls,
 * 成都 the brocade-roofed Shu palace. Purely cosmetic, geo-anchored to the
 * real city pixel so it sits right beside the city marker. */
type LandmarkKind = 'terrace' | 'palace' | 'brocade';
const UNIQUE_LANDMARKS: ReadonlyArray<{ cityId: string; zh: string; kind: LandmarkKind }> = [
  { cityId: 'ye',      zh: '銅雀臺', kind: 'terrace' },  // 曹操鄴城,銅雀／金鳳／冰井三臺
  { cityId: 'luoyang', zh: '漢宮',   kind: 'palace'  },  // 後漢南北宮、魏都宮城
  { cityId: 'changan', zh: '未央宮', kind: 'palace'  },  // 前漢宮室、董卓遷都
  { cityId: 'xuchang', zh: '許都',   kind: 'palace'  },  // 獻帝行在、曹魏發跡
  { cityId: 'jianye',  zh: '太初宮', kind: 'palace'  },  // 孫吳宮城
  { cityId: 'chengdu', zh: '錦官城', kind: 'brocade' },  // 蜀宮、錦官織造
];

/** A twin-eaved swept roof in a chosen palette (重檐廡殿頂). */
function PalaceRoof3D({ y, w, d, color = '#c9a23c', ridge = '#e8cf6a' }: {
  y: number; w: number; d: number; color?: string; ridge?: string;
}) {
  const eave = (ey: number, ew: number, ed: number, eh: number) => (
    <group position={[0, ey, 0]}>
      <mesh castShadow><boxGeometry args={[ew, eh, ed]} /><meshStandardMaterial color={color} roughness={0.55} metalness={0.25} /></mesh>
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
        <mesh key={i} position={[sx * ew * 0.46, eh * 0.3, sz * ed * 0.4]} rotation={[sz * 0.5, 0, -sx * 0.5]} castShadow>
          <coneGeometry args={[eh * 0.55, eh * 1.4, 4]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.25} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group position={[0, y, 0]}>
      {eave(0, w, d, 0.05)}
      {/* upper tier — 重檐 */}
      <mesh position={[0, 0.07, 0]} castShadow><boxGeometry args={[w * 0.6, 0.06, d * 0.6]} /><meshStandardMaterial color="#8a2f28" roughness={0.8} /></mesh>
      {eave(0.12, w * 0.66, d * 0.66, 0.04)}
      {/* golden ridge acroteria (鴟尾) */}
      <mesh position={[-w * 0.34, 0.05, 0]} rotation={[0, 0, 0.5]} castShadow><coneGeometry args={[0.022, 0.07, 5]} /><meshStandardMaterial color={ridge} roughness={0.4} metalness={0.5} /></mesh>
      <mesh position={[w * 0.34, 0.05, 0]} rotation={[0, 0, -0.5]} castShadow><coneGeometry args={[0.022, 0.07, 5]} /><meshStandardMaterial color={ridge} roughness={0.4} metalness={0.5} /></mesh>
    </group>
  );
}

/** A grand palace hall on a raised stone platform with vermilion columns. */
function PalaceHall3D({ roofColor, roofRidge }: { roofColor?: string; roofRidge?: string }) {
  return (
    <group>
      {/* Raised stone platform (臺基) */}
      <mesh position={[0, 0.04, 0]} receiveShadow castShadow><boxGeometry args={[0.72, 0.08, 0.46]} /><meshStandardMaterial color="#b8a88c" roughness={0.92} /></mesh>
      <mesh position={[0, 0.085, 0.25]} castShadow><boxGeometry args={[0.3, 0.01, 0.06]} /><meshStandardMaterial color="#9a8a70" roughness={0.95} /></mesh>
      {/* Vermilion hall body */}
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow><boxGeometry args={[0.6, 0.16, 0.36]} /><meshStandardMaterial color="#8a2f28" roughness={0.78} /></mesh>
      {/* Front colonnade */}
      {[-0.24, -0.08, 0.08, 0.24].map((cx, i) => (
        <mesh key={i} position={[cx, 0.17, 0.19]} castShadow><cylinderGeometry args={[0.018, 0.018, 0.16, 8]} /><meshStandardMaterial color="#6a1f1a" roughness={0.7} /></mesh>
      ))}
      <PalaceRoof3D y={0.27} w={0.7} d={0.46} color={roofColor} ridge={roofRidge} />
    </group>
  );
}

/** 銅雀臺 — a three-tier stone terrace crowned by a pavilion and the bronze
 *  sparrow that gave it its name. */
function BronzeTerrace3D() {
  return (
    <group>
      {/* Three receding stone tiers */}
      <mesh position={[0, 0.10, 0]} castShadow receiveShadow><boxGeometry args={[0.5, 0.2, 0.42]} /><meshStandardMaterial color="#9a9082" roughness={0.95} /></mesh>
      <mesh position={[0, 0.27, 0]} castShadow receiveShadow><boxGeometry args={[0.37, 0.16, 0.31]} /><meshStandardMaterial color="#a89e8e" roughness={0.95} /></mesh>
      <mesh position={[0, 0.41, 0]} castShadow receiveShadow><boxGeometry args={[0.26, 0.12, 0.22]} /><meshStandardMaterial color="#b4aa98" roughness={0.95} /></mesh>
      {/* Crowning pavilion */}
      <mesh position={[0, 0.52, 0]} castShadow><boxGeometry args={[0.2, 0.1, 0.17]} /><meshStandardMaterial color="#8a2f28" roughness={0.78} /></mesh>
      <PalaceRoof3D y={0.6} w={0.26} d={0.22} color="#c9a23c" />
      {/* 銅雀 — the bronze sparrow perched on the ridge */}
      <group position={[0, 0.74, 0]}>
        <mesh castShadow><sphereGeometry args={[0.035, 10, 8]} /><meshStandardMaterial color="#9c7a3c" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[0, 0.04, -0.02]} castShadow><sphereGeometry args={[0.02, 8, 6]} /><meshStandardMaterial color="#b5894a" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[-0.04, 0.01, 0]} rotation={[0, 0, 0.7]} castShadow><coneGeometry args={[0.02, 0.08, 4]} /><meshStandardMaterial color="#9c7a3c" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[0.04, 0.01, 0]} rotation={[0, 0, -0.7]} castShadow><coneGeometry args={[0.02, 0.08, 4]} /><meshStandardMaterial color="#9c7a3c" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[0, -0.01, 0.05]} rotation={[1.2, 0, 0]} castShadow><coneGeometry args={[0.015, 0.06, 4]} /><meshStandardMaterial color="#b5894a" roughness={0.45} metalness={0.6} /></mesh>
      </group>
    </group>
  );
}

function UniqueLandmarks3D({ cities }: { cities: Record<string, City> }) {
  const sites = useMemo(() => {
    const out: Array<{ x: number; z: number; zh: string; kind: LandmarkKind }> = [];
    for (const lm of UNIQUE_LANDMARKS) {
      const c = cities[lm.cityId];
      if (!c) continue;
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      out.push({ x: wx, z: wz, zh: lm.zh, kind: lm.kind });
    }
    return out;
  }, [cities]);
  const scale = PIXEL_TO_WORLD * 50 * 0.5 * MARKER_SCALE;
  return (
    <group>
      {sites.map((s, i) => {
        // Offset opposite the battle signpost so the two never collide.
        const x = s.x - 0.6, z = s.z - 0.6;
        const y = sampleTerrainHeight(x, z);
        return (
          <group key={i} position={[x, y, z]} scale={scale}>
            {s.kind === 'terrace' ? <BronzeTerrace3D />
              : s.kind === 'brocade' ? <PalaceHall3D roofColor="#3f7d6e" roofRidge="#7fd0b8" />
              : <PalaceHall3D />}
            <Html position={[0, s.kind === 'terrace' ? 0.95 : 0.5, 0]} center distanceFactor={11} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(28, 18, 10, 0.82)', border: '1px solid #c9a23c', borderRadius: 3,
                padding: '1px 6px', color: '#f0d89a', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                fontSize: '11px', whiteSpace: 'nowrap',
              }}>🏯 {s.zh}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 異族部落 — frontier tribe homelands ─────────────────────────────
 * The Nanman jungles, Wuhuan steppe, Qiang highlands… each raid-source
 * tribe now sits as a 部落寨 (tent cluster + totem) just beyond the cities
 * it harries. Clicking opens the 征討/招撫 panel. */
function Tribes3D({ onTribeClick }: { onTribeClick: (tribeId: string) => void }) {
  const aggression = useGameStore((s) => s.tribeState.aggression);
  const sites = useMemo(() => TRIBES.map((tb) => {
    const [px, py] = geoToPixel(tb.homeland.lon, tb.homeland.lat);
    const [wx, wz] = pxToWorld(px, py);
    return { id: tb.id, zh: tb.name.zh, color: tb.color, wx, wz };
  }), []);
  const scale = PIXEL_TO_WORLD * 50 * 0.5 * MARKER_SCALE;
  return (
    <group>
      {sites.map((s) => {
        const y = sampleTerrainHeight(s.wx, s.wz);
        const agg = aggression[s.id] ?? 0.15;
        const restless = agg > 0.22;
        return (
          <group key={s.id} position={[s.wx, y, s.wz]} scale={scale}>
            {/* Click target — a low ground disc */}
            <mesh
              position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => { e.stopPropagation(); onTribeClick(s.id); }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = ''; }}
            >
              <circleGeometry args={[0.55, 20]} />
              <meshBasicMaterial color={s.color} transparent opacity={0.32} />
            </mesh>
            {/* Three hide tents */}
            {([[-0.28, 0.1], [0.26, -0.04], [0.02, 0.3]] as const).map(([tx, tz], i) => (
              <group key={i} position={[tx, 0, tz]}>
                <mesh position={[0, 0.16, 0]} castShadow>
                  <coneGeometry args={[0.17, 0.34, 7]} />
                  <meshStandardMaterial color={i === 1 ? '#8a7256' : '#766350'} roughness={0.92} />
                </mesh>
                {/* Tent-pole tips poking through the top */}
                <mesh position={[0, 0.35, 0]}>
                  <coneGeometry args={[0.02, 0.08, 4]} />
                  <meshStandardMaterial color="#4a3c2c" roughness={0.9} />
                </mesh>
              </group>
            ))}
            {/* Central totem / banner pole in the tribe colour */}
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.022, 0.022, 0.6, 6]} />
              <meshStandardMaterial color="#3a2c1c" roughness={0.85} />
            </mesh>
            <mesh position={[0.09, 0.5, 0]} castShadow>
              <boxGeometry args={[0.16, 0.12, 0.02]} />
              <meshStandardMaterial color={s.color} side={THREE.DoubleSide} roughness={0.7} />
            </mesh>
            {/* Restless tribes smoulder a warning campfire glow */}
            {restless && (
              <mesh position={[0, 0.05, -0.3]}>
                <sphereGeometry args={[0.07, 8, 6]} />
                <meshBasicMaterial color="#e0662a" transparent opacity={0.7} />
              </mesh>
            )}
            <Html position={[0, 0.78, 0]} center distanceFactor={12} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(28, 18, 10, 0.82)', border: `1px solid ${s.color}`, borderRadius: 3,
                padding: '1px 6px', color: '#f0d8a8', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                fontSize: '11px', whiteSpace: 'nowrap',
              }}>⛺ {s.zh}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 野外據點 — bandit nests, river fords, resource deposits ─────────── */
function WildSite3D({ site, color, onClick }: {
  site: import('../../game/types').WildSite;
  color: string;
  onClick: () => void;
}) {
  const [px, py] = geoToPixel(site.coords.lon, site.coords.lat);
  const [wx, wz] = pxToWorld(px, py);
  const y = sampleTerrainHeight(wx, wz);
  const scale = PIXEL_TO_WORLD * 50 * 0.45 * MARKER_SCALE;
  const disc = (
    <mesh
      position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <circleGeometry args={[0.5, 18]} />
      <meshBasicMaterial color={color} transparent opacity={0.34} />
    </mesh>
  );
  let body: React.ReactNode = null;
  if (site.subtype === 'bandit') {
    // Palisade ring + raised black banner.
    body = (
      <group>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.34, 0.16, Math.sin(a) * 0.34]} rotation={[0, -a, 0.12]} castShadow>
              <cylinderGeometry args={[0.03, 0.04, 0.34, 5]} />
              <meshStandardMaterial color="#4a3a28" roughness={0.95} />
            </mesh>
          );
        })}
        <mesh position={[0, 0.34, 0]} castShadow><cylinderGeometry args={[0.022, 0.022, 0.66, 6]} /><meshStandardMaterial color="#2a2018" roughness={0.9} /></mesh>
        <mesh position={[0.1, 0.58, 0]} castShadow><boxGeometry args={[0.18, 0.13, 0.02]} /><meshStandardMaterial color="#1a1a1a" side={THREE.DoubleSide} roughness={0.6} /></mesh>
      </group>
    );
  } else if (site.subtype === 'ford') {
    // A short jetty with two pilings and a moored skiff.
    body = (
      <group>
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow><boxGeometry args={[0.5, 0.05, 0.16]} /><meshStandardMaterial color="#6a553a" roughness={0.9} /></mesh>
        <mesh position={[-0.2, 0.04, 0.12]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.18, 6]} /><meshStandardMaterial color="#4a3a28" roughness={0.92} /></mesh>
        <mesh position={[0.2, 0.04, 0.12]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.18, 6]} /><meshStandardMaterial color="#4a3a28" roughness={0.92} /></mesh>
        <mesh position={[0.3, 0.1, -0.05]} rotation={[0, 0.3, 0]} castShadow><boxGeometry args={[0.34, 0.06, 0.12]} /><meshStandardMaterial color="#5a4a36" roughness={0.85} /></mesh>
      </group>
    );
  } else {
    // Resource — an ore pile + a pick-frame; tint by variant.
    const oreColor = site.variant === 'salt' ? '#e8e4dc'
      : site.variant === 'gold' ? '#d8b13a'
      : site.variant === 'copper' ? '#b5703a'
      : site.variant === 'horse' ? '#7a8a5a'
      : '#6a6a72';   // iron
    body = (
      <group>
        <mesh position={[0, 0.12, 0]} castShadow><coneGeometry args={[0.26, 0.26, 8]} /><meshStandardMaterial color={oreColor} roughness={0.85} metalness={site.variant === 'gold' || site.variant === 'copper' ? 0.4 : 0.1} /></mesh>
        <mesh position={[-0.22, 0.16, 0.06]} rotation={[0, 0, 0.5]} castShadow><cylinderGeometry args={[0.018, 0.018, 0.34, 5]} /><meshStandardMaterial color="#5a4a36" roughness={0.9} /></mesh>
        <mesh position={[-0.28, 0.32, 0.06]} rotation={[0, 0, 1.3]} castShadow><boxGeometry args={[0.16, 0.03, 0.03]} /><meshStandardMaterial color="#7a7a82" roughness={0.6} metalness={0.4} /></mesh>
      </group>
    );
  }
  return (
    <group position={[wx, y, wz]} scale={scale}>
      {disc}
      {body}
      <Html position={[0, 0.8, 0]} center distanceFactor={12} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(28, 18, 10, 0.8)', border: `1px solid ${color}`, borderRadius: 3,
          padding: '1px 6px', color: '#e8d4a0', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
          fontSize: '10.5px', whiteSpace: 'nowrap',
        }}>{site.subtype === 'bandit' ? '🏴' : site.subtype === 'ford' ? '⛵' : '⛏'} {site.name.zh}</div>
      </Html>
    </group>
  );
}

function WildSites3D({ onSiteClick }: { onSiteClick: (siteId: string) => void }) {
  const sites = useGameStore((s) => s.sites);
  const forces = useGameStore((s) => s.forces);
  return (
    <group>
      {Object.values(sites).map((site) => {
        const color = site.ownerForceId
          ? (forces[site.ownerForceId]?.color ?? '#5a4530')
          : site.subtype === 'bandit' ? '#7a2a22' : '#6a6250';
        return <WildSite3D key={site.id} site={site} color={color} onClick={() => onSiteClick(site.id)} />;
      })}
    </group>
  );
}

function MapScene({ overlayMode, onPortClick, onFortClick, onTribeClick, onSiteClick, onQuickAction, mapStyle, dioSelectedId, dioMode, dioCast, dioArcs, dioFx, dioHover, onDioHover, onDioramaTile }: {
  overlayMode: OverlayMode;
  mapStyle: 'classic' | 'hex';
  onPortClick: (portId: string) => void;
  onFortClick: (fortId: string) => void;
  onTribeClick: (tribeId: string) => void;
  onSiteClick: (siteId: string) => void;
  /** 快捷輪盤 — open the march/recruit picker for a city (DOM modals live
   *  in the outer shell, outside the Canvas). */
  onQuickAction: (kind: 'march' | 'recruit', cityId: string) => void;
  /** 原地指揮 — in-place battle commanding state, owned by the outer shell. */
  dioSelectedId: string | null;
  dioMode: 'move' | 'attack';
  dioCast: { id: StratagemId; tacticId?: string } | null;
  dioArcs: Array<{ id: number; from: HexCoord; to: HexCoord; kind: 'melee' | 'ranged'; spawnedAt: number }>;
  dioFx: Array<{ id: number; coord: HexCoord; kind: NonNullable<ReturnType<typeof stratagemFxKind>>; spawnedAt: number }>;
  dioHover: HexCoord | null;
  onDioHover: (c: HexCoord | null) => void;
  onDioramaTile: (c: HexCoord) => void;
}) {
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const territoryOwnership = useGameStore((s) => s.territoryOwnership ?? EMPTY_TERRITORY_OWNERSHIP);
  const selectedCityId = useGameStore((s) => s.selectedCityId);
  const selectCity = useGameStore((s) => s.selectCity);
  const openCityMap = useGameStore((s) => s.openCityMap);
  const massMuster = useGameStore((s) => s.massMuster);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const selectedArmyId3D = useGameStore((s) => s.selectedArmyId);
  const selectArmy = useGameStore((s) => s.selectArmy);
  const redirectArmy = useGameStore((s) => s.redirectArmy);
  const moveArmyToCell = useGameStore((s) => s.moveArmyToCell);
  const mergeArmyInto = useGameStore((s) => s.mergeArmyInto);
  const startFieldBattle = useGameStore((s) => s.startFieldBattle);
  const armiesState = useGameStore((s) => s.armies);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const handleArmyClick = (officerId: string) => {
    const clicked = armiesState[officerId];
    if (!clicked) return;
    // No selection yet → select own column.
    if (!selectedArmyId3D) {
      if (clicked.forceId === playerForceId) selectArmy(officerId);
      return;
    }
    if (officerId === selectedArmyId3D) { selectArmy(null); return; }
    // Friendly column → rendezvous and merge; enemy → ride out and engage.
    if (clicked.forceId === playerForceId) {
      if (mergeArmyInto(selectedArmyId3D, officerId)) selectArmy(null);
      else selectArmy(officerId);
    } else {
      if (startFieldBattle(selectedArmyId3D, officerId)) selectArmy(null);
    }
  };
  const fieldBattleMarks = useGameStore((s) => s.fieldBattleMarks);
  const portsForMarch = useGameStore((s) => s.ports);
  // 戰場立體微縮 — the live battle rendered in place on the world map.
  const tacticalBattle = useGameStore((s) => s.tacticalBattle);
  const battleViewMinimizedScene = useGameStore((s) => s.battleViewMinimized);
  const setBattleViewMinimized = useGameStore((s) => s.setBattleViewMinimized);
  // Mobile perf gate: only render the diorama when it's actually being watched
  // (minimized view) — desktop also gets the fly-in bloom behind the screen.
  const showDiorama = !!tacticalBattle?.geoAnchor && (!IS_MOBILE || battleViewMinimizedScene);
  const battleSitePx = tacticalBattle?.geoAnchor
    ? { x: tacticalBattle.geoAnchor.x, y: tacticalBattle.geoAnchor.y }
    : null;
  const weather = useGameStore((s) => s.weather);
  const marchPreview = useGameStore((s) => s.marchPreview);
  const weatherPreset = WEATHER_PRESETS[weather.kind];
  const season = useGameStore((s) => s.date.season) as Season;
  const seasonPreset = SEASON_PRESETS[season];
  // 晝夜隨旬 — 上旬 plays in daylight, 下旬 sinks into a warm dusk, so time
  // visibly passes as the half-month ticks resolve.
  const dusk = useGameStore((s) => (s.date.phase ?? 'upper') === 'lower');
  // 行程測距 — with a city selected, hovering another shows the march time.
  const [hoverCityId, setHoverCityId] = useState<string | null>(null);

  // Bounds for particle effects
  const particleBounds = useMemo(() => ({ x: MAP_W, z: MAP_D }), []);

  const NEUTRAL = '#5a4530';

  // Identify capital cities by force.capitalCityId
  const capitalCityIds = useMemo(() => {
    const set = new Set<string>();
    for (const f of Object.values(forces)) {
      if (f.capitalCityId) set.add(f.capitalCityId);
    }
    return set;
  }, [forces]);

  // Maxes for heatmap normalization
  const maxes = useMemo(() => {
    const vs = Object.values(cities);
    return {
      gold:   Math.max(1, ...vs.map((c) => c.gold)),
      food:   Math.max(1, ...vs.map((c) => c.food)),
      troops: Math.max(1, ...vs.map((c) => c.troops)),
    };
  }, [cities]);

  // 威脅熱度 — per player city: hostile columns already marching at it
  // (full weight, scarier the closer) + hostile garrisons next door (they
  // could). Coloured by threat-to-garrison ratio: green can hold, red
  // cannot. Allies and pact partners don't count — they may not attack.
  const diplomacyScene = useGameStore((s) => s.diplomacy);
  const threatOverlays = useMemo(() => {
    if (overlayMode !== 'threat' || !playerForceId) return EMPTY_THREATS;
    const hostileForce = (fid: string | null | undefined) =>
      !!fid && fid !== playerForceId && isHostilePermitted(diplomacyScene, fid, playerForceId);
    const out: Record<string, { color: string; label: string }> = {};
    for (const city of Object.values(cities)) {
      if (city.ownerForceId !== playerForceId) continue;
      let inbound = 0;
      for (const a of Object.values(armiesState)) {
        if (!hostileForce(a.forceId)) continue;
        if (a.targetCityId === city.id && !a.holding) inbound += a.troops * (0.7 + 0.3 * a.progress);
      }
      for (const adjId of city.adjacentCityIds ?? []) {
        const nb = cities[adjId];
        if (nb && hostileForce(nb.ownerForceId)) inbound += nb.troops * 0.45;
      }
      const ratio = Math.min(1, inbound / Math.max(1, city.troops));
      const col = new THREE.Color('#3f9a4d').lerp(new THREE.Color('#cc2a1e'), ratio);
      out[city.id] = {
        color: `#${col.getHexString()}`,
        label: inbound >= 1000 ? `${Math.round(inbound / 1000)}k` : inbound > 0 ? `${Math.round(inbound)}` : '安',
      };
    }
    return out;
  }, [overlayMode, cities, armiesState, diplomacyScene, playerForceId]);

  // 戰爭迷霧 — optional intel limit: what your cities and columns can see.
  // View-layer only (the AI plays the same); beacons stay live regardless.
  const fogOfWarOn = useGameStore((s) => s.fogOfWar);
  const espReveals = useGameStore((s) => s.espionageReveals ?? EMPTY_REVEALS);
  const fog = useMemo(
    () => (fogOfWarOn && playerForceId
      ? computeFog(cities, armiesState, playerForceId, Object.keys(espReveals))
      : null),
    [fogOfWarOn, cities, armiesState, playerForceId, espReveals],
  );
  // Hostile columns out of sight simply don't render — filter the command
  // map MarchingArmies feeds on (the army layer mirrors it 1:1 by officer).
  const visibleCommands = useMemo(() => {
    if (!fog) return pendingCommands;
    const out: typeof pendingCommands = {};
    for (const [k, cmd] of Object.entries(pendingCommands)) {
      const a = armiesState[cmd.officerId ?? k];
      if (a && a.forceId !== playerForceId && !fog.isVisiblePx(a.x, a.y)) continue;
      out[k] = cmd;
    }
    return out;
  }, [fog, pendingCommands, armiesState, playerForceId]);

  return (
    <>
      {/* Distance fog — color follows season; far value pushed past max
       *  camera zoom (100) so the world stays visible when fully zoomed out. */}
      <fog attach="fog" args={[dusk ? '#caa37e' : seasonPreset.fogColor, 120 * WORLD_SCALE, 500 * WORLD_SCALE]} />

      {/* Per-season lighting */}
      <ambientLight intensity={seasonPreset.ambient * (dusk ? 0.72 : 1)} color={dusk ? '#d8b890' : seasonPreset.ambientColor} />
      <directionalLight
        position={dusk ? [12, 7, 10] : [8, 16, 6]}
        intensity={seasonPreset.sun.intensity * (dusk ? 0.8 : 1)}
        color={dusk ? '#ffb070' : seasonPreset.sun.color}
        castShadow
        // 2048 halves shadow VRAM/fill on weak GPUs; at map scale the
        // difference is invisible.
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-MAP_W}
        shadow-camera-right={MAP_W}
        shadow-camera-top={MAP_D}
        shadow-camera-bottom={-MAP_D}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-4, 5, -10]} intensity={0.45} color={seasonPreset.fillColor} />
      <hemisphereLight args={[seasonPreset.hemiSky, seasonPreset.hemiGround, seasonPreset.hemiIntensity]} />

      {/* Weather particles (rain / snow) */}
      {weatherPreset.particles === 'rain' && <RainParticles bounds={particleBounds} />}
      {weatherPreset.particles === 'snow' && <SnowParticles bounds={particleBounds} />}

      {mapStyle === 'hex' ? (
        // ⬡ 棋盤世界 — hex-prism quilt; rivers/lakes are blue hexes, the sea
        // is the living Ocean below. Same ground-click contract as the scroll.
        <HexWorldTerrain
          winter={season === 'winter'}
          cities={cities}
          forces={forces}
          territoryOwnership={territoryOwnership}
          fogCityIds={fog ? fog.visibleCityIds : null}
          onGroundClick={(px, py) => {
            if (selectedArmyId3D && isLandPx(px, py) && moveArmyToCell(selectedArmyId3D, px, py)) {
              selectArmy(null);
            }
          }}
        />
      ) : (
        <Suspense fallback={null}>
          <MapTerrain onGroundClick={(px, py) => {
            // With an army selected, clicking open land marches it to that
            // cell and digs in — coords are geo-pixels, the same space the
            // whole simulation runs in (the old 2D path fed painted-map
            // coords here, a cross-space bug retired with it).
            if (selectedArmyId3D && isLandPx(px, py) && moveArmyToCell(selectedArmyId3D, px, py)) {
              selectArmy(null);
            }
          }} />
          <TerritoryGroundLayer cities={cities} forces={forces} territoryOwnership={territoryOwnership} />
        </Suspense>
      )}
      <Ocean />
      {mapStyle === 'classic' && <Lakes3D />}
      {mapStyle === 'classic' && <RiverRibbons frozen={season === 'winter'} />}
      {mapStyle === 'classic' && season === 'winter' && <SnowBlanket />}
      {/* Forests plant at the shared height function, so the same trees stand
          perfectly on the hex quilt too. */}
      <Forest3D season={season} />
      <Farmland3D cities={cities} />
      <Villages3D />
      <GreatWall3D />
      <DriftingClouds />
      <Caravans3D cities={cities} />
      <TradeShips3D ports={portsForMarch} cities={cities} />
      {dusk && <DuskCityLights cities={cities} />}
      {/* Province borders are flat ground decals — they'd sink into the
          raised hex prisms, so the quilt view goes without them. */}
      {mapStyle === 'classic' && <ProvinceBorders3D cities={cities} />}
      {overlayMode === 'province' && <ProvinceLabels3D />}
      {marchPreview && (
        <MarchPreviewLine fromId={marchPreview.fromId} toId={marchPreview.toId} cities={cities} />
      )}

      {/* In hex mode the road network is paved into the quilt itself. */}
      {mapStyle === 'classic' && <Roads cities={cities} />}
      {mapStyle === 'classic' && <Bridges3D cities={cities} />}
      {mapStyle === 'classic' && <PostStations3D cities={cities} />}
      <Landmarks3D cities={cities} />
      <UniqueLandmarks3D cities={cities} />
      <MarchingArmies cities={cities} pendingCommands={visibleCommands} forces={forces} officers={officers} ports={portsForMarch} selectedArmyId={selectedArmyId3D} onArmyClick={handleArmyClick} hideNearPx={battleSitePx} />
      {overlayMode === 'supply' && <SupplyLines3D />}
      {overlayMode === 'diplomacy' && <DiplomacyLines3D cities={cities} forces={forces} />}
      <FieldBattleMarks3D marks={fieldBattleMarks} />
      <FieldClashMelee3D marks={fieldBattleMarks} />
      <IgnitionDust3D />
      <QueuedBattles3D />
      <BeaconAlerts3D />
      <BurningCities3D />
      <EventMarks3D cities={cities} hidePx={battleSitePx} visibleCityIds={fog?.visibleCityIds ?? null} onPick={(id) => selectCity(id)} />
      <Ports3D onPortClick={onPortClick} />
      <Forts3D onFortClick={onFortClick} hideNearPx={battleSitePx} />
      <Tribes3D onTribeClick={onTribeClick} />
      <WildSites3D onSiteClick={onSiteClick} />

      {/* 戰場微縮 — the LIVE battle, embedded on the very ground it's fought
          over (same scene component, same state; rotated to its true bearing,
          anchored on its geoAnchor column). Tap to enter the fullscreen view. */}
      {showDiorama && tacticalBattle?.geoAnchor && (() => {
        const ga = tacticalBattle.geoAnchor;
        const [bwx, bwz] = pxToWorld(ga.x, ga.y);
        const by = sampleTerrainHeight(bwx, bwz) + 0.12;
        const S = 0.16;
        const [acx, acz] = battleHexWorld(
          ga.anchorCol ?? Math.floor(tacticalBattle.width / 2),
          Math.floor(tacticalBattle.height / 2),
        );
        const [bcx, bcz] = battleHexWorld(
          Math.floor(tacticalBattle.width / 2),
          Math.floor(tacticalBattle.height / 2),
        );
        const pSide = tacticalBattle.attackerForceId === playerForceId ? 'attacker' as const
          : tacticalBattle.defenderForceId === playerForceId ? 'defender' as const : null;
        return (
          <group position={[bwx, by, bwz]} rotation={[0, -ga.bearing, 0]} scale={S}>
            <group position={[-acx, 0, -acz]}>
              {/* Dark plinth so the board reads cleanly over sloped terrain */}
              <mesh position={[bcx, -0.7, bcz]} receiveShadow>
                <boxGeometry args={[tacticalBattle.width * 1.5 + 3, 1.3, tacticalBattle.height * Math.sqrt(3) + 3]} />
                <meshStandardMaterial color="#241c12" roughness={0.95} />
              </mesh>
              <BattleScene
                embedded
                battle={tacticalBattle}
                playerSide={pSide}
                actionMode={dioCast && dioSelectedId
                  ? { kind: 'stratagem', id: dioCast.id, tacticId: dioCast.tacticId }
                  : dioSelectedId ? { kind: dioMode } : { kind: 'none' }}
                selectedId={dioSelectedId}
                hovered={dioHover}
                setHovered={onDioHover}
                onTileClick={onDioramaTile}
                attackArcs={dioArcs}
                stratagemFx={dioFx}
                officers={officers}
              />
            </group>
          </group>
        );
      })()}
      {showDiorama && tacticalBattle?.geoAnchor && (() => {
        const [bwx, bwz] = pxToWorld(tacticalBattle.geoAnchor.x, tacticalBattle.geoAnchor.y);
        const by = sampleTerrainHeight(bwx, bwz);
        return (
          <Html position={[bwx, by + 1.15, bwz]} center distanceFactor={10} zIndexRange={[60, 50]}>
            <button
              onClick={() => setBattleViewMinimized(false)}
              style={{
                background: 'rgba(26, 16, 10, 0.92)', color: '#f0d98a',
                border: '1px solid #d4a84a', borderRadius: 3,
                padding: '3px 10px', cursor: 'pointer',
                fontFamily: 'Songti SC, serif', fontSize: '13px',
                letterSpacing: '1px', whiteSpace: 'nowrap',
                boxShadow: '0 0 10px rgba(212,168,74,0.45)',
              }}
            >
              ⚔ 戰鬥進行中 · 第{tacticalBattle.turn}回 ▸ 進入
            </button>
          </Html>
        );
      })()}

      {Object.values(cities).map((city) => {
        const force = forces[city.ownerForceId ?? ''];
        const color = force?.color ?? NEUTRAL;
        const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
        // The battle diorama replaces the local scenery — a besieged city's
        // walls are ON the board, so the giant token underneath would clash.
        if (battleSitePx && Math.hypot(px - battleSitePx.x, py - battleSitePx.y) < 50) return null;
        const [wx, wz] = pxToWorld(px, py);
        const terrainY = cityElevation(wx, wz);
        return (
          <group
            key={city.id}
            onPointerOver={(e) => { e.stopPropagation(); setHoverCityId(city.id); }}
            onPointerOut={() => setHoverCityId((cur) => (cur === city.id ? null : cur))}
          >
            <City3D
              city={city}
              forceColor={color}
              isCapital={capitalCityIds.has(city.id)}
              isSelected={selectedCityId === city.id}
              terrainY={terrainY}
              overlay={fog && city.ownerForceId !== playerForceId && !fog.visibleCityIds.has(city.id)
                ? (overlayMode === 'none' ? null : FOG_OVERLAY)
                : overlayMode === 'threat' ? (threatOverlays[city.id] ?? null) : overlayForCity(city, overlayMode, maxes)}
              onClick={() => {
                // RTS-style: with an army selected, clicking a city re-routes
                // the column there (the 2D map used to own this interaction).
                if (selectedArmyId3D && redirectArmy(selectedArmyId3D, city.id)) {
                  selectArmy(null);
                  return;
                }
                if (selectedCityId === city.id) openCityMap();
                else selectCity(city.id);
              }}
            />
            <CityDefenseRing city={city} wx={wx} wz={wz} terrainY={terrainY} />
          </group>
        );
      })}

      {/* 城市快捷輪盤 — quick actions fanned around the selected city. */}
      {selectedCityId && cities[selectedCityId] && (() => {
        const c = cities[selectedCityId]!;
        const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
        if (battleSitePx && Math.hypot(px - battleSitePx.x, py - battleSitePx.y) < 50) return null;
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        return (
          <Html position={[wx, y + 0.55, wz]} center distanceFactor={9} zIndexRange={[44, 34]}>
            <CityQuickRing
              key={c.id}
              own={c.ownerForceId === playerForceId}
              onEnter={() => openCityMap()}
              onMarch={() => onQuickAction('march', c.id)}
              onRecruit={() => onQuickAction('recruit', c.id)}
              onMuster={() => massMuster(c.id)}
            />
          </Html>
        );
      })()}

      {/* 可達範圍 — with a column selected, concentric rings mark how far
          1/2/3 旬 of marching reach (the same geo thresholds the move order
          uses, centred on the column's source city like the order math). */}
      {selectedArmyId3D && armiesState[selectedArmyId3D] && cities[armiesState[selectedArmyId3D]!.fromCityId] && (() => {
        const src = cities[armiesState[selectedArmyId3D]!.fromCityId]!;
        const sp = cityPos(src);
        const [wx, wz] = pxToWorld(sp.x, sp.y);
        const rings = [
          { rpx: 100, zh: '1旬' },
          { rpx: 195, zh: '2旬' },
          { rpx: 275, zh: '3旬' },
        ];
        return (
          <group>
            {rings.map((r, i) => (
              <mesh key={i} position={[wx, 0.1, wz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={6}>
                <ringGeometry args={[r.rpx * PIXEL_TO_WORLD - 0.045, r.rpx * PIXEL_TO_WORLD + 0.045, 96]} />
                <meshBasicMaterial color="#f0d98a" transparent opacity={0.42 - i * 0.1} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
              </mesh>
            ))}
            {rings.map((r, i) => (
              <Html key={`l${i}`} position={[wx + r.rpx * PIXEL_TO_WORLD * 0.7071, 0.25, wz - r.rpx * PIXEL_TO_WORLD * 0.7071]} center distanceFactor={11} zIndexRange={[26, 16]} style={{ pointerEvents: 'none' }}>
                <div style={{
                  background: 'rgba(20,14,8,0.82)', border: '1px solid #5a4530', borderRadius: 3,
                  padding: '0 5px', fontFamily: 'Songti SC, serif', fontSize: 10, color: '#f0d98a',
                  whiteSpace: 'nowrap',
                }}>{r.zh}</div>
              </Html>
            ))}
          </group>
        );
      })()}

      {/* 改道測距 — column selected + hovering a city: how long the redirect
          would take from the column's source (the order's own math). */}
      {selectedArmyId3D && hoverCityId && armiesState[selectedArmyId3D]
        && cities[armiesState[selectedArmyId3D]!.fromCityId] && cities[hoverCityId] && (() => {
        const src = cities[armiesState[selectedArmyId3D]!.fromCityId]!;
        const to = cities[hoverCityId]!;
        if (to.id === src.id) return null;
        const ticks = marchDurationFor(src, to, season);
        const [px, py] = cityPixel(to.id, to.coords.x, to.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        return (
          <Html position={[wx, y + 1.35, wz]} center distanceFactor={9} zIndexRange={[42, 32]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(20,14,8,0.9)', border: '1px solid #f0d98a', borderRadius: 3,
              padding: '2px 8px', fontFamily: 'Songti SC, serif', fontSize: '11px',
              color: '#f0d98a', whiteSpace: 'nowrap', letterSpacing: '1px',
            }}>
              改道 → {to.name.zh} · 約 {ticks} 旬
            </div>
          </Html>
        );
      })()}

      {/* 行程測距 — selected → hovered march time, in the same 旬 the end-turn
          button counts in. */}
      {!selectedArmyId3D && selectedCityId && hoverCityId && hoverCityId !== selectedCityId
        && cities[selectedCityId] && cities[hoverCityId] && (() => {
        const from = cities[selectedCityId]!;
        const to = cities[hoverCityId]!;
        const ticks = marchDurationFor(from, to, season);
        const [px, py] = cityPixel(to.id, to.coords.x, to.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        return (
          <Html position={[wx, y + 1.35, wz]} center distanceFactor={9} zIndexRange={[42, 32]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(20,14,8,0.9)', border: '1px solid #d4a84a', borderRadius: 3,
              padding: '2px 8px', fontFamily: 'Songti SC, serif', fontSize: '11px',
              color: '#f0d98a', whiteSpace: 'nowrap', letterSpacing: '1px',
            }}>
              {from.name.zh} → {to.name.zh} · 行軍約 {ticks} 旬
            </div>
          </Html>
        );
      })()}
    </>
  );
}

/* ─── 城市快捷輪盤 — radial quick actions on the selected city ──────────
   Own city: 進城 / 出陣 / 徵兵 fan out around the token — the three things
   you actually do every turn, one tap instead of a trip through the city
   screen. Hostile city: a single 全軍集結 button (armed by a first tap so
   a stray click can't commit the whole realm to war). */
function CityQuickRing({ own, onEnter, onMarch, onRecruit, onMuster }: {
  own: boolean;
  onEnter: () => void;
  onMarch: () => void;
  onRecruit: () => void;
  onMuster: () => number;
}) {
  const [armed, setArmed] = useState(false);
  const [sent, setSent] = useState<number | null>(null);
  const t = useT();

  const radial = (emoji: string, zh: string, en: string, deg: number, onClick: () => void) => {
    const rad = (deg * Math.PI) / 180;
    const R = 54;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          position: 'absolute',
          left: Math.cos(rad) * R - 23,
          top: -Math.sin(rad) * R - 23,
          width: 46, height: 46, borderRadius: '50%',
          background: 'rgba(20,14,8,0.92)', border: '1px solid #d4a84a',
          color: '#f0e0b0', cursor: 'pointer', fontFamily: 'Songti SC, serif',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 1, padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
        }}
        title={t(zh, en)}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>{emoji}</span>
        <span style={{ fontSize: 9, letterSpacing: 1 }}>{t(zh, en)}</span>
      </button>
    );
  };

  if (!own) {
    return (
      <div style={{ position: 'relative', width: 0, height: 0 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (sent != null) return;
            if (!armed) {
              setArmed(true);
              window.setTimeout(() => setArmed(false), 2600);
              return;
            }
            setArmed(false);
            setSent(onMuster());
            window.setTimeout(() => setSent(null), 2600);
          }}
          style={{
            position: 'absolute', left: -62, top: -76, width: 124,
            background: armed ? 'rgba(120,30,20,0.94)' : 'rgba(20,14,8,0.92)',
            border: `1px solid ${armed ? '#ff6a50' : '#b8584a'}`,
            color: armed ? '#ffd0c0' : '#e8b0a0', cursor: 'pointer',
            fontFamily: 'Songti SC, serif', fontSize: 12, letterSpacing: 2,
            padding: '0.32rem 0', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
            whiteSpace: 'nowrap',
          }}
        >
          {sent != null
            ? (sent > 0 ? t(`🚩 ${sent} 路兵馬已發`, `🚩 ${sent} columns marching`) : t('無兵可發', 'No troops to send'))
            : armed ? t('確定集結?', 'Confirm muster?') : t('🚩 全軍集結', '🚩 Mass muster')}
        </button>
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', width: 0, height: 0 }}>
      {radial('⛩', '進城', 'Enter', 150, onEnter)}
      {radial('⚔', '出陣', 'March', 90, onMarch)}
      {radial('👥', '徵兵', 'Recruit', 30, onRecruit)}
    </div>
  );
}

/* ─── 城市搜索 — type a name (漢字或拼音), fly there ───────────────────
   Ninety-odd cities is too many to hunt by eye in the late game. Matches
   against zh names and the pinyin-ish en names; Enter takes the first
   match, click takes any. Jumping reuses the locator's camera path and
   selects the city so its panel opens on arrival. */
function CitySearchBox({ onJump, compact }: {
  onJump: (cityId: string, px: number, py: number) => void;
  /** 手機 — collapse to a 🔍 button; the input only exists while open, so
   *  it can't sit on top of the map chrome. */
  compact?: boolean;
}) {
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const t = useT();
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return Object.values(cities)
      .filter((c) => c.name.zh.includes(q.trim()) || c.name.en.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [cities, q]);
  const jump = (c: City) => {
    const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
    onJump(c.id, px, py);
    setQ('');
    setOpen(false);
  };
  if (compact && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(20, 14, 8, 0.88)', color: '#c0a878',
          border: '1px solid #5a4530', cursor: 'pointer', fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title={t('尋城', 'Find city')}
      >🔍</button>
    );
  }
  return (
    <div style={{ position: 'relative', fontFamily: 'Songti SC, serif', display: 'flex', gap: 4 }}>
      {compact && (
        <button
          onClick={() => { setOpen(false); setQ(''); }}
          style={{
            width: 30, background: 'rgba(20, 14, 8, 0.88)', color: '#c0a878',
            border: '1px solid #5a4530', cursor: 'pointer', fontSize: 13, order: 2,
          }}
        >✕</button>
      )}
      <input
        autoFocus={compact}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) jump(matches[0]);
          if (e.key === 'Escape') setQ('');
          e.stopPropagation(); // keep typing out of the map hotkeys
        }}
        placeholder={t('🔍 尋城(漢字/拼音)', '🔍 Find city')}
        style={{
          width: compact ? 'min(56vw, 210px)' : 138,
          background: 'rgba(20, 14, 8, 0.88)', color: '#e8d9b0',
          border: '1px solid #5a4530', padding: '0.3rem 0.5rem', outline: 'none',
          fontFamily: 'inherit', fontSize: '0.75rem',
        }}
      />
      {matches.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 2, minWidth: 170,
          background: 'rgba(20, 14, 8, 0.96)', border: '1px solid #5a4530',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)', zIndex: 30,
        }}>
          {matches.map((c) => {
            const owner = c.ownerForceId ? forces[c.ownerForceId] : null;
            return (
              <div
                key={c.id}
                onClick={() => jump(c)}
                style={{
                  display: 'flex', justifyContent: 'space-between', gap: 10, cursor: 'pointer',
                  padding: '0.3rem 0.55rem', fontSize: '0.78rem', color: '#e8d9b0',
                  borderBottom: '1px solid #2a2014',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(212,168,74,0.14)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <span>{c.name.zh} <span style={{ color: '#8a7050', fontSize: '0.68rem' }}>{c.name.en}</span></span>
                <span style={{ color: owner?.color ?? '#6a6050', fontSize: '0.7rem' }}>
                  {owner ? owner.name.zh : t('無主', 'free')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Top-level component ─────────────────────────────────── */
const OVERLAY_OPTIONS: Array<{ id: OverlayMode; zh: string; en: string }> = [
  { id: 'none',     zh: '關閉', en: 'OFF' },
  { id: 'gold',     zh: '金錢', en: 'GOLD' },
  { id: 'food',     zh: '糧草', en: 'FOOD' },
  { id: 'troops',   zh: '兵力', en: 'TROOPS' },
  { id: 'loyalty',  zh: '民忠', en: 'LOYALTY' },
  { id: 'province', zh: '州郡', en: 'PROVINCE' },
  { id: 'supply',   zh: '糧道', en: 'SUPPLY' },
  { id: 'diplomacy', zh: '邦交', en: 'TIES' },
  { id: 'threat',   zh: '威脅', en: 'THREAT' },
];

const WEATHER_ZH: Record<WeatherKind, string> = {
  clear: '☀ 晴', rain: '☂ 雨', snow: '❄ 雪', wind: '🌀 風', drought: '☼ 旱',
};
const SEASON_ZH: Record<Season, string> = {
  spring: '春', summer: '夏', autumn: '秋', winter: '冬',
};

/**
 * 軍令提示 — when one of the player's columns is selected, a bar spells out
 * what tapping each thing does (the orders existed, but nothing on screen
 * said so). Also the visible way to deselect.
 */
function ArmyOrdersHint() {
  const selectedArmyId = useGameStore((s) => s.selectedArmyId);
  const army = useGameStore((s) => (s.selectedArmyId ? s.armies[s.selectedArmyId] : null));
  const officers = useGameStore((s) => s.officers);
  const selectArmy = useGameStore((s) => s.selectArmy);
  // The in-place battle commander bar owns the bottom slot when up.
  const battleBarUp = useGameStore((s) => !!s.tacticalBattle && s.battleViewMinimized);
  const t = useT();
  if (!selectedArmyId || !army) return null;
  const commander = officers[army.commanderId];
  return (
    <div style={{
      position: 'absolute', bottom: battleBarUp ? 64 : 14, left: '50%', transform: 'translateX(-50%)',
      zIndex: 12, display: 'flex', alignItems: 'center', gap: '0.6rem',
      background: 'rgba(20, 14, 8, 0.92)', border: '1px solid #d4a84a', borderRadius: 4,
      padding: '0.4rem 0.8rem', fontFamily: 'Songti SC, serif',
      boxShadow: '0 2px 12px rgba(0,0,0,0.55)',
      flexWrap: 'wrap', justifyContent: 'center', maxWidth: '94vw',
    }}>
      <span style={{ color: '#f0d98a', letterSpacing: '0.1rem', fontSize: '0.85rem' }}>
        ⚑ {commander?.name.zh ?? '?'}{t('部', '')} {army.troops.toLocaleString()}{t('兵', '')}
      </span>
      <span style={{ color: '#8a7050', fontSize: '0.72rem', letterSpacing: '0.05rem' }}>
        {t('點城市:改道 · 點空地:進駐 · 點友軍:合流 · 點敵軍:野戰',
           'Tap city: redirect · ground: dig in · ally: merge · enemy: engage')}
      </span>
      <button
        onClick={() => selectArmy(null)}
        style={{
          background: 'transparent', border: '1px solid #5a4530', color: '#c0a878',
          padding: '0.15rem 0.5rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem',
        }}
      >✕ {t('取消', 'Cancel')}</button>
    </div>
  );
}

/**
 * 戰場引燃 — when a battle ignites, fly the world camera down to the clash
 * site (its geoAnchor) BEFORE the battle screen drops over the map, and leave
 * it there so the post-battle reveal shows the scar you made. One continuous
 * camera line: world → battle → world.
 */
function BattleFocusFly({ controlsRef, onSettled }: {
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>;
  onSettled: (target: [number, number, number]) => void;
}) {
  const { camera } = useThree();
  const geoAnchor = useGameStore((s) => s.tacticalBattle?.geoAnchor ?? null);
  const anim = useRef<null | {
    from: THREE.Vector3; to: THREE.Vector3;
    fromT: THREE.Vector3; toT: THREE.Vector3; t: number;
  }>(null);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!geoAnchor) { lastKey.current = null; return; }
    const key = `${Math.round(geoAnchor.x)},${Math.round(geoAnchor.y)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    const [wx, wz] = pxToWorld(geoAnchor.x, geoAnchor.y);
    const h = sampleTerrainHeight(wx, wz);
    anim.current = {
      from: camera.position.clone(),
      to: new THREE.Vector3(wx, h + 2.8, wz + 2.3),
      fromT: controlsRef.current?.target.clone() ?? new THREE.Vector3(0, 0, 0),
      toT: new THREE.Vector3(wx, h, wz),
      t: 0,
    };
  }, [geoAnchor, camera, controlsRef]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a) return;
    const ctrl = controlsRef.current;
    if (ctrl) ctrl.enabled = false;
    a.t = Math.min(1, a.t + delta / 0.85);
    const e = a.t < 0.5 ? 2 * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 2) / 2; // easeInOutQuad
    camera.position.lerpVectors(a.from, a.to, e);
    if (ctrl) {
      ctrl.target.lerpVectors(a.fromT, a.toT, e);
      ctrl.update();
    }
    if (a.t >= 1) {
      anim.current = null;
      if (ctrl) ctrl.enabled = true;
      onSettled([a.toT.x, a.toT.y, a.toT.z]);
    }
  });
  return null;
}

export function StrategicMap3D() {
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [selectedFortId, setSelectedFortId] = useState<string | null>(null);
  const [selectedTribeId, setSelectedTribeId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [showStockadeBuild, setShowStockadeBuild] = useState(false);
  // Orbit pivot — held as STATE (stable ref) so re-renders don't snap the
  // target back; BattleFocusFly animates it to a clash site, then locks it in.
  const controlsRef = useRef<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>(null);
  const [orbitTarget, setOrbitTarget] = useState<[number, number, number]>([0, 0, 0]);
  // While a battle diorama is on the map, let the camera dive much closer.
  const battleActive = useGameStore((s) => !!s.tacticalBattle);
  // 標籤分級 — quantized camera distance, provided to City3D labels.
  const [zoomLod, setZoomLod] = useState<'near' | 'far'>('near');
  const duskBg = useGameStore((s) => (s.date.phase ?? 'upper') === 'lower');

  // 環境音 — wind under everything; birds by day, crickets at dusk, war
  // drums while a battle burns. Follows the sound toggle live.
  const soundOn = useGameStore((s) => s.soundEnabled);
  useEffect(() => {
    if (!soundOn) { stopMapAmbience(); return; }
    startMapAmbience(battleActive ? 'war' : duskBg ? 'dusk' : 'day');
    return () => stopMapAmbience();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);
  useEffect(() => {
    setMapAmbienceMode(battleActive ? 'war' : duskBg ? 'dusk' : 'day');
  }, [battleActive, duskBg]);

  // 迷你導航 — camera view window for the corner minimap + click-to-jump.
  const [navView, setNavView] = useState<{ cx: number; cy: number; span: number } | null>(null);
  const [navJump, setNavJump] = useState<{ px: number; py: number; seq: number } | null>(null);
  const selectCityOuter = useGameStore((s) => s.selectCity);
  const fogOfWar = useGameStore((s) => s.fogOfWar);
  const setFogOfWar = useGameStore((s) => s.setFogOfWar);
  // 手機收納 — objective card and the map-tools tray fold away by default.
  const [objOpen, setObjOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  // 鍵盤快捷鍵 — 1..9 switch overlays, Tab cycles own cities (camera in
  // tow), Esc backs out of selections. Typing in any input is exempt.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key >= '1' && e.key <= '9') {
        const opt = OVERLAY_OPTIONS.filter((o) => o.id !== 'none')[Number(e.key) - 1];
        if (opt) setOverlayMode((cur) => (cur === opt.id ? 'none' : opt.id));
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const s = useGameStore.getState();
        const own = Object.values(s.cities)
          .filter((c) => c.ownerForceId === s.playerForceId)
          .sort((a, b) => a.name.zh.localeCompare(b.name.zh));
        if (own.length === 0) return;
        const idx = own.findIndex((c) => c.id === s.selectedCityId);
        const next = own[(idx + 1) % own.length];
        s.selectCity(next.id);
        const [px, py] = cityPixel(next.id, next.coords.x, next.coords.y);
        setNavJump({ px, py, seq: Date.now() });
      } else if (e.key === 'Escape') {
        const s = useGameStore.getState();
        if (s.selectedArmyId) s.selectArmy(null);
        else if (s.selectedCityId) s.selectCity(null);
        setQuickPick(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // 天下大勢 snapshot — grab the WebGL canvas as a PNG.
  const mapRootRef = useRef<HTMLDivElement>(null);
  const snapYear = useGameStore((s) => s.date.year);
  const exportSnapshot = () => {
    const canvas = mapRootRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = (canvas as HTMLCanvasElement).toDataURL('image/png');
    a.download = `天下大勢-${snapYear}年.png`;
    a.click();
  };
  // 烽火示警 — hostile columns marching on player cities (chip top-left).
  const beaconCities = useGameStore((s) => s.cities);
  const beaconArmies = useGameStore((s) => s.armies);
  const beaconSelectCity = useGameStore((s) => s.selectCity);
  const beaconPlayerForceId = useGameStore((s) => s.playerForceId);
  const beaconAlerts = useMemo(
    () => computeBeaconAlerts(beaconCities, beaconArmies, beaconPlayerForceId),
    [beaconCities, beaconArmies, beaconPlayerForceId],
  );
  // ⬡ 棋盤世界 experiment — hex-tile world terrain; the painted scroll map
  // stays the default and is always one tap away (backup).
  const [mapStyle, setMapStyle] = useState<'classic' | 'hex'>(
    () => (localStorage.getItem('tkm-map-style') === 'hex' ? 'hex' : 'classic'),
  );
  const toggleMapStyle = () => {
    const next = mapStyle === 'hex' ? 'classic' : 'hex';
    setMapStyle(next);
    localStorage.setItem('tkm-map-style', next);
  };

  // ── 原地指揮 (stage 3) — command the minimized battle right on the map ──
  // Selection is keyed by battle id so a stale pick can't leak into the next
  // fight (unit ids repeat across battles); validity is derived, no effects.
  const worldBattle = useGameStore((s) => s.tacticalBattle);
  const worldBattleMinimized = useGameStore((s) => s.battleViewMinimized);
  const setBattleViewMinimized = useGameStore((s) => s.setBattleViewMinimized);
  const startBattleUpdate = useGameStore((s) => s.startTacticalBattle);
  const officersAll = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const [dioPick, setDioPick] = useState<{ bid: string; uid: string } | null>(null);
  const [dioMode, setDioMode] = useState<'move' | 'attack'>('move');
  const [dioHover, setDioHoverRaw] = useState<HexCoord | null>(null);
  const setDioHover = (c: HexCoord | null) => {
    setDioHoverRaw((prev) => (prev?.col === c?.col && prev?.row === c?.row ? prev : c));
  };
  // 計謀 — an armed stratagem waiting for its target hex; FX ride the diorama.
  // tacticId set = a personal/signature tactic riding an underlying stratagem.
  const [dioCast, setDioCast] = useState<{ id: StratagemId; tacticId?: string } | null>(null);
  const [dioFx, setDioFx] = useState<Array<{ id: number; coord: HexCoord; kind: NonNullable<ReturnType<typeof stratagemFxKind>>; spawnedAt: number }>>([]);
  // 單挑 — armed duel waiting for an adjacent enemy commander; the bout itself
  // runs in the same DuelGameModal the fullscreen uses.
  const [dioDuelArm, setDioDuelArm] = useState(false);
  const [worldDuel, setWorldDuel] = useState<{ me: Officer; foe: Officer } | null>(null);
  // 快捷輪盤 — which DOM picker (march/recruit) the ring asked for.
  const [quickPick, setQuickPick] = useState<{ kind: 'march' | 'recruit'; cityId: string } | null>(null);
  const [dioArcs, setDioArcs] = useState<Array<{ id: number; from: HexCoord; to: HexCoord; kind: 'melee' | 'ranged'; spawnedAt: number }>>([]);
  const dioSelectedId = worldBattle && dioPick && dioPick.bid === worldBattle.id
    && worldBattle.units.some((u) => u.id === dioPick.uid) ? dioPick.uid : null;
  const worldPlayerSide: 'attacker' | 'defender' | null = worldBattle
    ? (worldBattle.attackerForceId === playerForceId ? 'attacker'
      : worldBattle.defenderForceId === playerForceId ? 'defender' : null)
    : null;
  const worldMyTurn = !!worldBattle && !!worldPlayerSide
    && worldBattle.activeSide === worldPlayerSide && !worldBattle.winner;

  // Same select/move/attack semantics as the fullscreen onTileClick — the
  // deep actions (stratagems, duels, formations) live one ⤢ tap away.
  const handleDioramaTile = (c: HexCoord) => {
    const b = useGameStore.getState().tacticalBattle;
    if (!b) return;
    if (!useGameStore.getState().battleViewMinimized) {
      // Pre-reveal (fly-in) click — just open the fullscreen view.
      setBattleViewMinimized(false);
      return;
    }
    const pSide = b.attackerForceId === playerForceId ? 'attacker'
      : b.defenderForceId === playerForceId ? 'defender' : null;
    if (!pSide || b.activeSide !== pSide || b.winner) return;
    const u = unitAt(b, c);
    // An armed stratagem treats ANY click as its target (incl. friendlies —
    // rally-style buffs), exactly like the fullscreen flow.
    if (dioCast) {
      const sel0 = dioSelectedId ? b.units.find((x) => x.id === dioSelectedId) : null;
      if (!sel0) { setDioCast(null); return; }
      const r = applyStratagem(b, sel0.id, dioCast.id, c, useGameStore.getState().officers, dioCast.tacticId);
      if (r.ok) {
        const fxKind = stratagemFxKind(dioCast.id);
        if (fxKind) {
          const fxId = Date.now();
          const isSelf = ['defend', 'precognition', 'dragon-veil'].includes(dioCast.id);
          const fxCoord = isSelf ? sel0.coord : c;
          setDioFx((arr) => [...arr, { id: fxId, coord: fxCoord, kind: fxKind, spawnedAt: fxId }]);
          const lifeMs = (FX_DURATION[fxKind] ?? 1.5) * 1000 + 200;
          setTimeout(() => setDioFx((arr) => arr.filter((f) => f.id !== fxId)), lifeMs);
        }
        // N6 — signature flavor line for famous personal tactics.
        const flavor = dioCast.tacticId ? SIGNATURE_FLAVOR[dioCast.tacticId] : undefined;
        const next = flavor
          ? { ...r.battle, log: [...(r.battle.log ?? []), { turn: r.battle.turn, text: flavor.en, kind: 'event' as const }] }
          : r.battle;
        startBattleUpdate(next);
      } else if (r.reason) {
        alert(r.reason);
      }
      setDioCast(null);
      return;
    }
    // An armed duel needs an ADJACENT enemy commander — same gates as the
    // fullscreen flow (canDuel both sides, costs the unit's AP).
    if (dioDuelArm && u && u.side !== pSide) {
      const sel0 = dioSelectedId ? b.units.find((x) => x.id === dioSelectedId) : null;
      if (!sel0) { setDioDuelArm(false); return; }
      if (hexDistance(sel0.coord, u.coord) !== 1) { alert('須與敵將相鄰方可單挑'); return; }
      const officers = useGameStore.getState().officers;
      const me = officers[sel0.officerId];
      const foe = officers[u.officerId];
      if (!me || !foe) return;
      const meCheck = canDuel(me);
      const foeCheck = canDuel(foe);
      if (!meCheck.ok) { alert(`我將無法單挑: ${meCheck.reason}`); return; }
      if (!foeCheck.ok) { alert(`敵將無法應戰: ${foeCheck.reason}`); return; }
      startBattleUpdate({ ...b, units: b.units.map((unit) => unit.id === sel0.id ? { ...unit, ap: 0 } : unit) });
      setWorldDuel({ me, foe });
      setDioDuelArm(false);
      return;
    }
    if (u && u.side === pSide) {
      setDioPick({ bid: b.id, uid: u.id });
      setDioMode('move');
      setDioCast(null);
      setDioDuelArm(false);
      return;
    }
    const sel = dioSelectedId ? b.units.find((x) => x.id === dioSelectedId) : null;
    if (!sel) return;
    if (u && u.side !== pSide && canAttack(b, sel, u)) {
      const kind: 'melee' | 'ranged' = sel.unitType === 'archers' || sel.unitType === 'siege' ? 'ranged' : 'melee';
      const aid = Date.now();
      playSfx(kind === 'ranged' ? 'arrow' : 'sword');
      setDioArcs((a) => [...a, { id: aid, from: sel.coord, to: u.coord, kind, spawnedAt: aid }]);
      setTimeout(() => setDioArcs((a) => a.filter((x) => x.id !== aid)), 600);
      startBattleUpdate(attackUnits(b, sel.id, u.id, useGameStore.getState().officers, Math.random));
      return;
    }
    if (!u && dioMode === 'move' && canMove(b, sel, c)) {
      startBattleUpdate(moveUnit(b, sel.id, c));
    }
  };
  const weather = useGameStore((s) => s.weather);
  const season = useGameStore((s) => s.date.season) as Season;
  const t = useT();

  return (
    <div ref={mapRootRef} style={{
      position: 'absolute', inset: 0,
      background: duskBg ? 'linear-gradient(180deg, #6a5a78 0%, #d89060 100%)' : 'linear-gradient(180deg, #88a0c0 0%, #c8b890 100%)',
    }}>
      {/* Objective tracker — top-left. Phones fold it into a chip; the
          full card is a tap away instead of owning a third of the screen. */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, pointerEvents: 'none' }}>
        {IS_MOBILE && !objOpen ? (
          <button
            onClick={() => setObjOpen(true)}
            style={{
              pointerEvents: 'auto', background: 'rgba(20, 14, 8, 0.88)', color: '#d4a84a',
              border: '1px solid #5a4530', padding: '0.3rem 0.55rem', cursor: 'pointer',
              fontFamily: 'Songti SC, serif', fontSize: '0.75rem',
            }}
          >🎯 {t('目標', 'Goal')}</button>
        ) : (
          <div style={{ position: 'relative' }}>
            {IS_MOBILE && (
              <button
                onClick={() => setObjOpen(false)}
                style={{
                  pointerEvents: 'auto', position: 'absolute', top: 2, right: 2, zIndex: 1,
                  background: 'transparent', color: '#8a7050', border: 'none',
                  fontSize: '0.85rem', cursor: 'pointer',
                }}
              >✕</button>
            )}
            <ObjectivePanel />
          </div>
        )}
      </div>

      {/* 開戰字卡 — flashes 「X軍 ⚔ Y軍」 + drums when any battle ignites. */}
      <BattleIgnitionCard />

      {/* Season + weather chip */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', gap: 6,
        flexWrap: 'wrap', justifyContent: 'center', maxWidth: '96vw',
        pointerEvents: 'none',
      }}>
        <span style={{
          background: 'rgba(20, 14, 8, 0.85)', color: '#d4a84a',
          border: '1px solid #5a4530', padding: '0.3rem 0.7rem',
          fontFamily: 'Songti SC, serif', fontSize: '0.85rem',
        }}>{SEASON_ZH[season]} {season}</span>
        <span style={{
          background: 'rgba(20, 14, 8, 0.85)', color: '#a8c4e0',
          border: '1px solid #5a4530', padding: '0.3rem 0.7rem',
          fontFamily: 'Songti SC, serif', fontSize: '0.85rem',
        }}>{WEATHER_ZH[weather.kind]}{weather.windPower >= 2 ? ` ${weather.windPower}` : ''}</span>
      </div>

      {/* Controls hint — desktop only; on touch it was just noise. */}
      {!IS_MOBILE && (
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 10,
          background: 'rgba(20, 14, 8, 0.85)', color: '#a89070',
          border: '1px solid #5a4530',
          padding: '0.3rem 0.6rem',
          fontFamily: 'Songti SC, serif', fontSize: '0.72rem',
          pointerEvents: 'none',
        }}>{t('拖曳旋轉 · 滾輪縮放 · 1-9 圖層 · Tab 巡城 · 空格過旬 · Esc 取消', 'drag rotate · scroll zoom · 1-9 overlays · Tab cycle cities · Space end turn · Esc cancel')}</div>
      )}

      {/* 尋城 — search-and-fly. Desktop: input under the controls hint.
          Phones: a 🔍 button that expands on tap, below the hint chip so
          nothing sits over the season/weather strip. */}
      <div style={{ position: 'absolute', top: IS_MOBILE ? 12 : 46, right: 12, zIndex: 11 }}>
        <CitySearchBox compact={IS_MOBILE} onJump={(cityId, px, py) => {
          setNavJump({ px, py, seq: Date.now() });
          selectCityOuter(cityId);
        }} />
      </div>

      {/* Map tools — bottom-left. Desktop: the full row. Phones: folded
          behind one 🗺 button so the map stays clean; the tray opens above
          it. Buttons are real toggles either way. */}
      {IS_MOBILE && (
        <button
          onClick={() => setToolsOpen((v) => !v)}
          style={{
            position: 'absolute', bottom: 12, left: 12, zIndex: 11,
            width: 40, height: 40, borderRadius: '50%',
            background: toolsOpen ? '#d4a84a' : 'rgba(20, 14, 8, 0.92)',
            color: toolsOpen ? '#1a1410' : '#c0a878',
            border: '1px solid ' + (toolsOpen ? '#d4a84a' : '#5a4530'),
            cursor: 'pointer', fontSize: 17,
            boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
          }}
        >🗺</button>
      )}
      {(!IS_MOBILE || toolsOpen) && (
      <div style={{
        position: 'absolute', bottom: IS_MOBILE ? 60 : 12, left: 12, zIndex: 10,
        display: 'flex', gap: 4,
        flexWrap: 'wrap',
        maxWidth: 'calc(100vw - 24px)',
        background: 'rgba(20, 14, 8, 0.88)',
        border: '1px solid #5a4530',
        padding: 4,
        boxShadow: '0 0 8px rgba(0,0,0,0.6)',
      }}>
        {OVERLAY_OPTIONS.filter((o) => o.id !== 'none').map((opt) => (
          <button
            key={opt.id}
            onClick={() => setOverlayMode((cur) => (cur === opt.id ? 'none' : opt.id))}
            style={{
              background: overlayMode === opt.id ? '#d4a84a' : 'transparent',
              color: overlayMode === opt.id ? '#1a1410' : '#a89070',
              border: '1px solid ' + (overlayMode === opt.id ? '#d4a84a' : '#5a4530'),
              padding: '0.3rem 0.55rem',
              cursor: 'pointer',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              letterSpacing: '0.05rem',
            }}
          >{t(opt.zh, opt.en)}</button>
        ))}
        <button
          onClick={() => setShowStockadeBuild(true)}
          style={{
            marginLeft: 8,
            background: '#3a2818', color: '#a89070',
            border: '1px solid #5a4530',
            padding: '0.3rem 0.55rem',
            cursor: 'pointer',
            fontFamily: 'Songti SC, serif',
            fontSize: '0.78rem',
          }}
          title={t('築壘寨 / 箭樓 / 投石臺 — 施設可轟擊路過敵軍', 'Build stockade / arrow tower / catapult — facilities shell passing enemies')}
        >{t('築堡施設', 'Build')}</button>
        <button
          onClick={toggleMapStyle}
          style={{
            marginLeft: 8,
            background: mapStyle === 'hex' ? 'rgba(212, 168, 74, 0.18)' : '#1a2415',
            color: mapStyle === 'hex' ? '#d4a84a' : '#9ab87a',
            border: `1px solid ${mapStyle === 'hex' ? '#d4a84a' : '#4a5a3a'}`,
            padding: '0.3rem 0.55rem',
            cursor: 'pointer',
            fontFamily: 'Songti SC, serif',
            fontSize: '0.78rem',
          }}
          title={t('切換地圖風格 — 棋盤六角地塊 / 畫卷地圖(實驗)', 'Toggle map style — hex-tile board / painted scroll (experimental)')}
        >{mapStyle === 'hex' ? t('🗺 畫卷地圖', 'Scroll Map') : t('⬡ 棋盤地圖', 'Hex Map')}</button>
        <button
          onClick={() => setFogOfWar(!fogOfWar)}
          style={{
            marginLeft: 8,
            background: fogOfWar ? 'rgba(120, 130, 150, 0.22)' : '#241c12',
            color: fogOfWar ? '#b8c4d8' : '#a89070',
            border: `1px solid ${fogOfWar ? '#8a96ac' : '#5a4530'}`,
            padding: '0.3rem 0.55rem',
            cursor: 'pointer',
            fontFamily: 'Songti SC, serif',
            fontSize: '0.78rem',
          }}
          title={t('戰爭迷霧 — 只看得見自己城池與行軍縱隊周邊的敵情;烽火台照常預警', 'Fog of war — intel limited to what your cities and columns can see; beacons still warn')}
        >🌫 {fogOfWar ? t('迷霧:開', 'Fog ON') : t('迷霧:關', 'Fog OFF')}</button>
        <button
          onClick={exportSnapshot}
          style={{
            marginLeft: 8, background: '#241c12', color: '#c0a878',
            border: '1px solid #5a4530', padding: '0.3rem 0.55rem',
            cursor: 'pointer', fontFamily: 'Songti SC, serif', fontSize: '0.78rem',
          }}
          title={t('把當前天下大勢存成 PNG', 'Save the current realm view as a PNG')}
        >📷 {t('大勢', 'Snap')}</button>
      </div>
      )}

      <Canvas
        // Phones: shadow maps are the single biggest GPU cost on this scene.
        shadows={!IS_MOBILE}
        dpr={IS_MOBILE ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, MAP_D * 0.9, MAP_D * 0.7], fov: 45, near: 0.5, far: 400 * WORLD_SCALE }}
        // preserveDrawingBuffer lets the 📷 button read the frame back.
        gl={{ antialias: !IS_MOBILE, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          <ZoomLODTracker onChange={setZoomLod} />
          <ZoomLODCtx.Provider value={zoomLod}>
          <MapScene
            overlayMode={overlayMode}
            mapStyle={mapStyle}
            onPortClick={setSelectedPortId}
            onFortClick={setSelectedFortId}
            onTribeClick={setSelectedTribeId}
            onSiteClick={setSelectedSiteId}
            onQuickAction={(kind, cityId) => setQuickPick({ kind, cityId })}
            dioSelectedId={worldBattleMinimized ? dioSelectedId : null}
            dioMode={dioMode}
            dioCast={worldBattleMinimized ? dioCast : null}
            dioArcs={dioArcs}
            dioFx={dioFx}
            dioHover={worldBattleMinimized ? dioHover : null}
            onDioHover={setDioHover}
            onDioramaTile={handleDioramaTile}
          />
          </ZoomLODCtx.Provider>
          <OrbitControls
            ref={controlsRef as React.Ref<never>}
            target={orbitTarget}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={battleActive ? 0.9 : 3}
            maxDistance={200 * WORLD_SCALE}
            enableDamping
            dampingFactor={0.1}
          />
          {/* Fly to a battle the moment it ignites — before its screen mounts. */}
          <BattleFocusFly controlsRef={controlsRef} onSettled={setOrbitTarget} />
          <MiniNavRig controlsRef={controlsRef} onView={setNavView} jump={navJump} />
          {/* Gentle bloom — beacons, fires and water shimmer get a halo. */}
          {!IS_MOBILE && (
            <EffectComposer>
              <Bloom luminanceThreshold={0.85} intensity={0.35} mipmapBlur />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>

      {/* 快捷輪盤的 DOM 端 — the pickers the ring opens (ordinary modals,
          they live outside the Canvas). */}
      {quickPick?.kind === 'march' && (
        <MarchPicker cityId={quickPick.cityId} onClose={() => setQuickPick(null)} />
      )}
      {quickPick?.kind === 'recruit' && (
        <OfficerPicker cityId={quickPick.cityId} commandType="recruit-troops" onClose={() => setQuickPick(null)} />
      )}

      {/* 原地指揮 — command the minimized battle right on the map: select,
          move, attack, end turn. Deep actions (stratagems/duels) are one ⤢
          tap away in the fullscreen view. */}
      {worldBattle && worldBattleMinimized && (() => {
        const sel = dioSelectedId ? worldBattle.units.find((u) => u.id === dioSelectedId) : null;
        const off = sel ? officersAll[sel.officerId] : null;
        const hovUnit = dioHover ? unitAt(worldBattle, dioHover) : null;
        const hovOff = hovUnit ? officersAll[hovUnit.officerId] : null;
        const hovIsOwn = hovUnit && worldPlayerSide && hovUnit.side === worldPlayerSide;
        const modeBtn = (mode: 'move' | 'attack', zh: string, en: string) => (
          <button
            onClick={() => setDioMode(mode)}
            style={{
              background: dioMode === mode ? 'rgba(212,168,74,0.22)' : 'transparent',
              border: `1px solid ${dioMode === mode ? '#d4a84a' : '#5a4530'}`,
              color: dioMode === mode ? '#f0d98a' : '#c0a878',
              padding: '0.15rem 0.55rem', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.75rem',
            }}
          >{t(zh, en)}</button>
        );
        return (
          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            zIndex: 13, display: 'flex', alignItems: 'center', gap: IS_MOBILE ? '0.35rem' : '0.55rem',
            background: 'rgba(20, 14, 8, 0.94)', border: '1px solid #b8584a', borderRadius: 4,
            padding: IS_MOBILE ? '0.3rem 0.5rem' : '0.4rem 0.8rem', fontFamily: 'Songti SC, serif',
            boxShadow: '0 2px 14px rgba(0,0,0,0.6)',
            // Phones: wrap the chips instead of overflowing off-screen.
            flexWrap: 'wrap', justifyContent: 'center', maxWidth: '94vw',
          }}>
            <span style={{ color: '#e0a0a0', fontSize: '0.78rem', letterSpacing: '0.1rem' }}>
              ⚔ {t(`第${worldBattle.turn}回`, `T${worldBattle.turn}`)} · {worldBattle.winner
                ? t('勝負已分', 'Decided')
                : worldMyTurn ? t('我方回合', 'YOUR TURN') : t('敵方回合', 'enemy turn')}
            </span>
            {sel && off ? (
              <>
                <span style={{ color: '#f0d98a', fontSize: '0.8rem' }}>
                  {off.name.zh} · AP {sel.ap}/{sel.maxAp} · {sel.troops.toLocaleString()}{t('兵', '')}
                </span>
                {modeBtn('move', '移動', 'Move')}
                {modeBtn('attack', '攻擊', 'Attack')}
                {/* 單挑 — adjacent enemy commander, same gates as fullscreen. */}
                <button
                  onClick={() => { setDioDuelArm(!dioDuelArm); setDioCast(null); }}
                  title={t('單挑 — 點相鄰敵將開打(耗盡AP)', 'Duel — tap an adjacent enemy commander (costs all AP)')}
                  style={{
                    background: dioDuelArm ? 'rgba(214,126,126,0.22)' : 'transparent',
                    border: `1px solid ${dioDuelArm ? '#d67e7e' : '#5a3a3a'}`,
                    color: dioDuelArm ? '#f0bcbc' : '#c88888',
                    padding: '0.15rem 0.45rem', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.72rem',
                  }}
                >{t('單挑', 'Duel')}</button>
                {/* 個人戰術 — signature moves riding underlying stratagems. */}
                {personalTacticsForUnit(off, sel).slice(0, 3).map((pt) => {
                  const armed = dioCast?.id === pt.underlying && dioCast?.tacticId === pt.tacticId;
                  return (
                    <button
                      key={pt.id}
                      onClick={() => { setDioCast(armed ? null : { id: pt.underlying, tacticId: pt.tacticId }); setDioDuelArm(false); }}
                      title={pt.nameEn}
                      style={{
                        background: armed ? 'rgba(193,154,240,0.22)' : 'transparent',
                        border: `1px solid ${armed ? '#c19af0' : '#4a3a5a'}`,
                        color: armed ? '#ddc8f5' : '#a88fc8',
                        padding: '0.15rem 0.45rem', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '0.72rem',
                      }}
                    >{pt.nameZh}</button>
                  );
                })}
                {/* 計謀 — same availability rules as the fullscreen panel. */}
                {STRATAGEMS.filter((s) => {
                  if (s.signatureOf && !s.signatureOf.includes(off.id)) return false;
                  if (s.minIntelligence && off.stats.intelligence < s.minIntelligence) return false;
                  if (s.minWar && off.stats.war < s.minWar) return false;
                  if (s.requiresUnitType && !s.requiresUnitType.includes(sel.unitType)) return false;
                  return true;
                }).slice(0, 4).map((s) => {
                  const armed = dioCast?.id === s.id && !dioCast?.tacticId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setDioCast(armed ? null : { id: s.id }); setDioDuelArm(false); }}
                      title={s.descriptionZh ?? s.description}
                      style={{
                        background: armed ? 'rgba(136,183,232,0.22)' : 'transparent',
                        border: `1px solid ${armed ? '#88b7e8' : '#3a4a5a'}`,
                        color: armed ? '#bcd8f0' : '#88a7c8',
                        padding: '0.15rem 0.45rem', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '0.72rem',
                      }}
                    >{s.name.zh}</button>
                  );
                })}
                {(dioCast || dioDuelArm) && (
                  <span style={{ color: dioDuelArm ? '#d67e7e' : '#88b7e8', fontSize: '0.7rem' }}>
                    {dioDuelArm ? t('點相鄰敵將', 'tap adjacent foe') : t('點目標格施放', 'tap a target hex')}
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: '#8a7050', fontSize: '0.74rem' }}>
                {t('點選棋盤上我方部隊下令', 'Tap one of your units on the board')}
              </span>
            )}
            {hovUnit && hovOff && hovUnit.id !== dioSelectedId && (
              <span style={{
                color: hovIsOwn ? '#9ec9f0' : '#f0a0a0', fontSize: '0.74rem',
                borderLeft: '1px solid #4a3520', paddingLeft: '0.55rem',
              }}>
                {hovIsOwn ? '' : '敵 '}{hovOff.name.zh} · {hovUnit.troops.toLocaleString()}{t('兵', '')} · AP {hovUnit.ap}/{hovUnit.maxAp}
              </span>
            )}
            <button
              onClick={() => {
                const b = useGameStore.getState().tacticalBattle;
                if (!b || !worldMyTurn) return;
                startBattleUpdate(endTurn(b));
                setDioPick(null);
              }}
              disabled={!worldMyTurn}
              style={{
                background: worldMyTurn ? '#5a4530' : '#241c12', color: worldMyTurn ? '#f0e0b0' : '#6a5238',
                border: '1px solid #d4a84a', padding: '0.15rem 0.6rem',
                cursor: worldMyTurn ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', fontSize: '0.75rem',
              }}
            >{t('結束回合', 'End Turn')}</button>
            <button
              onClick={() => setBattleViewMinimized(false)}
              style={{
                background: '#16261a', color: '#9ed68a', border: '1px solid #5a8a3a',
                padding: '0.15rem 0.6rem', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.75rem',
              }}
            >⤢ {t('全屏戰場', 'Fullscreen')}</button>
          </div>
        );
      })()}

      {/* 迷你導航 — the realm at a glance; click to jump the camera there. */}
      {navView && (
        <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 11 }}>
          <LocatorMap
            window={{ cx: navView.cx, cy: navView.cy, spanX: navView.span * 1.6, spanY: navView.span, rotation: 0, kind: 'world' }}
            width={IS_MOBILE ? 108 : 138}
            onPickPx={(px, py) => setNavJump({ px, py, seq: Date.now() })}
          />
        </div>
      )}

      {/* 烽火示警 — who is marching on us, one tap to look. */}
      {beaconAlerts.threatened.size > 0 && (
        <div style={{
          position: 'absolute', top: 56, left: 12, zIndex: 12,
          display: 'flex', flexDirection: 'column', gap: 4,
          fontFamily: 'Songti SC, serif',
        }}>
          {[...beaconAlerts.threatened].slice(0, 4).map((id) => (
            <button
              key={id}
              onClick={() => beaconSelectCity(id)}
              style={{
                background: 'rgba(40, 14, 8, 0.92)', border: '1px solid #e0552a',
                color: '#f0b0a0', borderRadius: 3, padding: '3px 9px',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem',
                letterSpacing: '0.08rem', textAlign: 'left',
                boxShadow: '0 0 10px rgba(224,85,42,0.35)',
              }}
            >
              🔥 {t('烽火示警', 'Beacons lit')} · {beaconCities[id]?.name.zh ?? id}{t('告急', ' under threat')}
            </button>
          ))}
        </div>
      )}

      {/* 單挑 from the world map — same modal & writeback as the fullscreen. */}
      {worldDuel && (
        <DuelGameModal
          attacker={worldDuel.me}
          defender={worldDuel.foe}
          onComplete={(outcome) => {
            const { me, foe } = worldDuel;
            const b = useGameStore.getState().tacticalBattle;
            setWorldDuel(null);
            if (!b) return;
            const killedId = outcome.killedId === 'defender' ? foe.id
              : outcome.killedId === 'attacker' ? me.id : null;
            let next = b;
            if (killedId) {
              const fallen = next.units.find((u) => u.officerId === killedId);
              const prevCas = next.casualties ?? { attacker: [], defender: [] };
              next = {
                ...next,
                units: next.units.filter((u) => u.officerId !== killedId),
                casualties: fallen
                  ? { ...prevCas, [fallen.side]: [...prevCas[fallen.side], killedId] }
                  : prevCas,
              };
            }
            next = {
              ...next,
              log: [...(next.log ?? []), {
                turn: next.turn,
                text: outcome.winner === 'draw'
                  ? `${me.name.en} and ${foe.name.en} fought to a draw — both wounded.`
                  : `${outcome.winner === 'attacker' ? me.name.en : foe.name.en} bested ${outcome.winner === 'attacker' ? foe.name.en : me.name.en} in single combat!`,
                kind: 'event' as const,
              }],
            };
            startBattleUpdate(next);
          }}
        />
      )}

      {/* 軍令提示 — with a column selected, spell out what a tap does. The
          orders existed but were invisible; this makes them discoverable. */}
      <ArmyOrdersHint />

      {selectedPortId && (
        <PortPanel
          portId={selectedPortId}
          onClose={() => setSelectedPortId(null)}
        />
      )}
      {selectedFortId && (
        <FortPanel
          fortId={selectedFortId}
          onClose={() => setSelectedFortId(null)}
        />
      )}
      {selectedTribeId && (
        <TribePanel
          tribeId={selectedTribeId}
          onClose={() => setSelectedTribeId(null)}
        />
      )}
      {selectedSiteId && (
        <SitePanel
          siteId={selectedSiteId}
          onClose={() => setSelectedSiteId(null)}
        />
      )}
      {showStockadeBuild && (
        <BuildStockadePicker onClose={() => setShowStockadeBuild(false)} />
      )}
    </div>
  );
}
