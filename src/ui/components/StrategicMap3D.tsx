import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Instances, Instance } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { getTerritoryCanvas, getTerritorySignature } from './territoryOverlay';
import { positionAlongRoute, marchDestCoords, terrainRoute, generateTerritories } from '../../game/data/territories';
import { snapToHexCenter, geoToPixel, battleGroundAt } from '../../game/data/geography';
import { cityPixel, cityPos } from '../../game/data/cityGeo';
import { deriveWeaponType, type WeaponType } from '../../game/data/weaponTypes';
import * as THREE from 'three';
import { useGameStore } from '../../game/state/store';
import { PROVINCE_BY_CITY } from '../../game/data';
import { citySize } from '../../game/systems/citySize';
import type { City, Force, Season } from '../../game/types';
import { FACILITY_DEFS } from '../../game/types';
// The battle diorama reuses the real battle scene (embedded mode) + its hex
// coordinate helper, so the fight on the world map IS the fight.
import { BattleScene, hexWorld as battleHexWorld } from '../screens/TacticalBattleScreen3D';
import type { WeatherKind } from '../../game/systems/weather';
import { ObjectivePanel } from './ObjectivePanel';
import { PortPanel } from './PortPanel';
import { FortPanel } from './FortPanel';
import { BuildStockadePicker } from './BuildStockadePicker';
import { useT } from '../i18n';

/** Coarse-pointer / small-screen device — drop pixel ratio and skip the
 *  post-processing pass so phones keep a playable framerate. */
const IS_MOBILE = typeof window !== 'undefined'
  && (window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth < 700);

type OverlayMode = 'none' | 'gold' | 'food' | 'troops' | 'loyalty' | 'province';

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
const PIXEL_TO_WORLD = 1 / 24;          // bigger world → more room between cities
const MAP_W = 1000 * PIXEL_TO_WORLD;   // 41.67
const MAP_D = 720  * PIXEL_TO_WORLD;   // 30
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
const DEG_TO_PX = 1000 / GEO_LON_SPAN;
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
  const lat = GEO_LAT_MAX - (y / 720) * GEO_LAT_SPAN;
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
  const distSouth     = 720 - y;
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
    const py = (y / TEX_H) * 720;
    for (let x = 0; x < TEX_W; x++) {
      const px = (x / TEX_W) * 1000;
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
    const py = (y / NM_H) * 720;
    for (let x = 0; x < NM_W; x++) {
      normalJob.heights[y * NM_W + x] = sampleTerrain((x / NM_W) * 1000, py).h;
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
  return true;
}

/* ─── Water alpha-mask — keeps the territory tint off the water ───
 *  White = land (tint shows), black = sea / lake / river bed (tint
 *  hidden). Mirrors exactly the water tests sampleTerrain paints with,
 *  so the mask and the drawn water always agree. Built once (static). */
let waterMaskCache: THREE.Texture | null = null;
function buildWaterAlphaMask(): THREE.Texture {
  if (waterMaskCache) return waterMaskCache;
  const W = 1000, H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const data = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let water = landSDF(x, y) < 0;
      if (!water) {
        for (const lk of LAKES) {
          if (Math.hypot(x - lk.x, y - lk.y) < lk.r) { water = true; break; }
        }
      }
      if (!water) {
        for (const r of RIVERS) {
          if (distToPolyline(x, y, r.points) < r.width) { water = true; break; }
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
      pos.setZ(i, sampleTerrain(px, py).h + 0.05);
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
    tex.minFilter = THREE.LinearFilter;
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
  const geom = useMemo(() => new THREE.PlaneGeometry(MAP_W * 1.5, MAP_D * 1.5, 24, 24), []);
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
  // Scale by city size (population or troops) — bigger cities, taller towers.
  const sizeScore = Math.max(1, Math.min(4, city.population / 60000 + city.troops / 30000));
  const height = 0.18 + sizeScore * 0.12;
  const radius = 0.10 + sizeScore * 0.03;
  // World-size compensation: pillars stay visually reasonable as the world
  // gets bigger. The final multiplier shrinks the footprint so neighbouring
  // cities (min ~18px ≈ 2.6 hexes apart) stop overlapping — de-crowds the
  // dense clusters (Luoyang basin, Shu passes, Xiangyang/Fancheng) without
  // moving any city off its real-geography position.
  const worldScale = PIXEL_TO_WORLD * 50 * 0.5;   // 0.5 → ~1.04 at 1/24
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
          <Html position={[0, height + 0.32, 0]} center distanceFactor={6} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
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
       *  label from ballooning when the camera zooms in close. */}
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
const ARMY_TOKEN_SCALE = 0.7;

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
      {/* Click target — generous invisible disc over the squad. */}
      {onClick && (
        <mesh
          position={[0, 0.18, 0]}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = ''; }}
        >
          <cylinderGeometry args={[0.55, 0.55, 0.42, 10]} />
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

function Soldier({ dx, dz, color, phase, isLeader, weaponType }: {
  dx: number; dz: number; color: string; phase: number; isLeader: boolean;
  weaponType: WeaponType;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bannerRef = useRef<THREE.Mesh>(null);
  const mounted = weaponType === 'cavalry';
  const lift = mounted ? 0.10 : 0;
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Walking bounce — phase-shifted; mounted units ride steadier.
      const amp = mounted ? 0.02 : 0.04;
      groupRef.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 5 + phase)) * amp;
    }
    if (bannerRef.current) {
      // Banner ripples in the wind.
      bannerRef.current.rotation.z = Math.sin(clock.elapsedTime * 4 + phase) * 0.25;
    }
  });
  return (
    <group ref={groupRef} position={[dx, 0, dz]}>
      {/* Mount for cavalry — a simple horse body + legs under the rider. */}
      {mounted && (
        <group position={[0, 0.02, 0]}>
          <mesh position={[0, 0.07, 0]} castShadow>
            <boxGeometry args={[0.07, 0.05, 0.14]} />
            <meshStandardMaterial color="#5a4030" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.10, 0.09]} castShadow>
            <boxGeometry args={[0.04, 0.06, 0.04]} />
            <meshStandardMaterial color="#5a4030" roughness={0.8} />
          </mesh>
        </group>
      )}
      {/* Body — torso */}
      <mesh position={[0, 0.07 + lift, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.10, 6]} />
        <meshStandardMaterial color={weaponType === 'fan' ? '#caa' : color} roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.155 + lift, 0]} castShadow>
        <sphereGeometry args={[0.028, 6, 6]} />
        <meshStandardMaterial color="#e0c498" roughness={0.75} />
      </mesh>

      {/* Type-specific gear */}
      {weaponType === 'fan' ? (
        // Strategist — holds a round fan, no weapon pole.
        <mesh position={[0.06, 0.15 + lift, 0]} rotation={[0, 0, 0.4]} castShadow>
          <circleGeometry args={[0.035, 12]} />
          <meshStandardMaterial color="#e8dcc0" side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
      ) : (weaponType === 'bow' || weaponType === 'crossbow') ? (
        // Archer — a curved bow arc.
        <mesh position={[0.05, 0.13 + lift, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.05, 0.005, 6, 10, Math.PI * 1.2]} />
          <meshStandardMaterial color="#6a4a28" roughness={0.7} />
        </mesh>
      ) : (
        // Infantry / cavalry — pole arm (taller for halberd/spear).
        <mesh position={[0.035, (weaponType === 'halberd' ? 0.16 : 0.13) + lift, 0]} castShadow>
          <cylinderGeometry args={[0.004, 0.004, weaponType === 'halberd' ? 0.28 : 0.22, 4]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
      )}

      {/* Leader carries the force banner (waving). */}
      {isLeader && (
        <mesh ref={bannerRef} position={[0.075, 0.22 + lift, 0]} castShadow>
          <planeGeometry args={[0.09, 0.055]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
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
  if (mode === 'none') return null;
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
function Forest3D() {
  const positions = useMemo(() => {
    const ps: { x: number; y: number; z: number; rot: number; scale: number }[] = [];
    for (const patch of FOREST_PATCHES) {
      for (let i = 0; i < patch.trees; i++) {
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

  return (
    <group>
      {/* Trunk — thin brown cylinder */}
      <instancedMesh ref={trunkRef} args={[undefined, undefined, positions.length]} castShadow>
        <cylinderGeometry args={[0.008, 0.012, 0.10, 5]} />
        <meshStandardMaterial color="#3a2818" roughness={0.95} />
      </instancedMesh>
      {/* Canopy — dark green cone */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, positions.length]} castShadow>
        <coneGeometry args={[0.07, 0.30, 6]} />
        <meshStandardMaterial color="#2d4a28" roughness={0.92} />
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
      const px = (x / W) * 1000, py = (y / H) * 720;
      const lat = GEO_LAT_MAX - (py / 720) * GEO_LAT_SPAN;
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
// Generated once per session — ~5k geography samples are too slow per render.
let HEXWORLD_CACHE: HexWorldTile[] | null = null;
function buildHexWorldTiles(): HexWorldTile[] {
  if (HEXWORLD_CACHE) return HEXWORLD_CACHE;
  const out: HexWorldTile[] = [];
  for (let c = 0; ; c++) {
    const x = -MAP_W / 2 + HEXW_R + c * HEXW_COL;
    if (x > MAP_W / 2) break;
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
  }
  HEXWORLD_CACHE = out;
  return out;
}

function HexWorldTerrain({ winter, cities, forces, territoryOwnership, onGroundClick }: {
  winter: boolean;
  cities: Record<string, City>;
  forces: Record<string, Force>;
  territoryOwnership: Record<string, string | null>;
  onGroundClick?: (px: number, py: number) => void;
}) {
  const tiles = useMemo(() => buildHexWorldTiles(), []);

  // 領土歸屬 — each land hex takes its nearest territory centroid's owner
  // (override ?? parent city's lord), the SAME resolution the painted
  // territory layer uses, so both map styles always agree on borders.
  const tileOwner = useMemo(() => {
    const seeds = generateTerritories(Object.values(cities)).map((t) => ({
      x: t.coords.x,
      y: t.coords.y,
      owner: territoryOwnership[t.id] ?? cities[t.parentCityId]?.ownerForceId ?? null,
    }));
    return tiles.map((t) => {
      if (t.kind === 'river' || t.kind === 'lake') return null; // water stays water
      const px = (t.x + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (t.z + MAP_D / 2) / PIXEL_TO_WORLD;
      let best: string | null = null;
      let bestD = Infinity;
      for (const s of seeds) {
        const d = (s.x - px) * (s.x - px) + (s.y - py) * (s.y - py);
        if (d < bestD) { bestD = d; best = s.owner; }
      }
      return best;
    });
  }, [tiles, cities, territoryOwnership]);

  // 國界 — an owned hex bordering a DIFFERENT owner (or unowned wilderness)
  // is a frontier tile: it gets a deeper, more saturated realm colour so the
  // borders cut sharply. Sea/river neighbours don't count (coasts and rivers
  // already outline themselves).
  const tileBorder = useMemo(() => {
    const idx = new Map<string, number>();
    tiles.forEach((t, i) => idx.set(`${t.c},${t.r}`, i));
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
        const j = idx.get(`${t.c + dc},${t.r + dr}`);
        if (j === undefined) continue;          // sea — no edge
        if (isWater(tiles[j].kind)) continue;   // river — no edge
        if (tileOwner[j] !== own) return true;
      }
      return false;
    });
  }, [tiles, tileOwner]);

  // Per-tile colour — terrain base blended toward the owning force's colour
  // (deeper on frontier tiles); seasonal: snow-dusted land in winter.
  const colors = useMemo(() => tiles.map((t, i) => {
    const water = t.kind === 'river' || t.kind === 'lake';
    const ownerId = tileOwner[i];
    const owner = ownerId ? (forces[ownerId]?.color ?? null) : null;
    const border = tileBorder[i];
    if (winter) {
      const snow = water ? '#bcd2dc' : t.kind === 'mountain' ? '#cfd4d8' : '#c9cfc3';
      if (!owner || water) return snow;
      const col = new THREE.Color(snow).lerp(new THREE.Color(owner), border ? 0.5 : 0.26);
      if (border) col.offsetHSL(0, 0, -0.06);
      return `#${col.getHexString()}`;
    }
    const base = HEXWORLD_COLOR[t.kind] ?? HEXWORLD_COLOR.plain;
    const col = new THREE.Color(base);
    // Cheap deterministic tint so the plains read as a quilt, not a slab.
    if (t.kind === 'plain' || t.kind === 'hill') {
      const h = Math.abs(Math.sin(t.x * 12.9898 + t.z * 78.233)) * 0.12;
      col.offsetHSL(0, 0, h - 0.06);
    }
    if (owner && !water) {
      col.lerp(new THREE.Color(owner), border ? 0.68 : 0.38);
      if (border) col.offsetHSL(0, 0.05, -0.08);
    }
    return `#${col.getHexString()}`;
  }), [tiles, winter, tileOwner, tileBorder, forces]);

  return (
    <group>
      {/* Invisible click-catcher — same contract as the painted MapTerrain. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={(e) => {
          if (!onGroundClick) return;
          e.stopPropagation();
          const px = (e.point.x + MAP_W / 2) / PIXEL_TO_WORLD;
          const py = (e.point.z + MAP_D / 2) / PIXEL_TO_WORLD;
          onGroundClick(px, py);
        }}
      >
        <planeGeometry args={[MAP_W, MAP_D]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Instances limit={Math.max(1, tiles.length)} receiveShadow frustumCulled={false}>
        {/* thetaStart π/6 points the hex vertices along ±x — the flat-top
            orientation our 1.5R/√3R column layout tessellates with. Without
            it the hexes sit 30° off and leave diagonal gaps. */}
        <cylinderGeometry args={[1, 1, 1, 6, 1, false, Math.PI / 6]} />
        <meshStandardMaterial roughness={0.93} metalness={0.02} />
        {tiles.map((t, i) => (
          <Instance
            key={i}
            position={[t.x, (t.topY - 0.3) / 2, t.z]}
            scale={[HEXW_R * 0.995, t.topY + 0.3, HEXW_R * 0.995]}
            color={colors[i]}
          />
        ))}
      </Instances>
    </group>
  );
}

function MapScene({ overlayMode, onPortClick, onFortClick, mapStyle }: {
  overlayMode: OverlayMode;
  mapStyle: 'classic' | 'hex';
  onPortClick: (portId: string) => void;
  onFortClick: (fortId: string) => void;
}) {
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const territoryOwnership = useGameStore((s) => s.territoryOwnership ?? EMPTY_TERRITORY_OWNERSHIP);
  const selectedCityId = useGameStore((s) => s.selectedCityId);
  const selectCity = useGameStore((s) => s.selectCity);
  const openCityMap = useGameStore((s) => s.openCityMap);
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
  const setBattleViewMinimized = useGameStore((s) => s.setBattleViewMinimized);
  const battleSitePx = tacticalBattle?.geoAnchor
    ? { x: tacticalBattle.geoAnchor.x, y: tacticalBattle.geoAnchor.y }
    : null;
  const weather = useGameStore((s) => s.weather);
  const marchPreview = useGameStore((s) => s.marchPreview);
  const weatherPreset = WEATHER_PRESETS[weather.kind];
  const season = useGameStore((s) => s.date.season) as Season;
  const seasonPreset = SEASON_PRESETS[season];

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

  return (
    <>
      {/* Distance fog — color follows season; far value pushed past max
       *  camera zoom (100) so the world stays visible when fully zoomed out. */}
      <fog attach="fog" args={[seasonPreset.fogColor, 60, 250]} />

      {/* Per-season lighting */}
      <ambientLight intensity={seasonPreset.ambient} color={seasonPreset.ambientColor} />
      <directionalLight
        position={[8, 16, 6]}
        intensity={seasonPreset.sun.intensity}
        color={seasonPreset.sun.color}
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
      {mapStyle === 'classic' && <Forest3D />}
      <GreatWall3D />
      <DriftingClouds />
      {/* Province borders are flat ground decals — they'd sink into the
          raised hex prisms, so the quilt view goes without them. */}
      {mapStyle === 'classic' && <ProvinceBorders3D cities={cities} />}
      <ProvinceLabels3D />
      {marchPreview && (
        <MarchPreviewLine fromId={marchPreview.fromId} toId={marchPreview.toId} cities={cities} />
      )}

      <Roads cities={cities} />
      <MarchingArmies cities={cities} pendingCommands={pendingCommands} forces={forces} officers={officers} ports={portsForMarch} selectedArmyId={selectedArmyId3D} onArmyClick={handleArmyClick} hideNearPx={battleSitePx} />
      <FieldBattleMarks3D marks={fieldBattleMarks} />
      <Ports3D onPortClick={onPortClick} />
      <Forts3D onFortClick={onFortClick} hideNearPx={battleSitePx} />

      {/* 戰場微縮 — the LIVE battle, embedded on the very ground it's fought
          over (same scene component, same state; rotated to its true bearing,
          anchored on its geoAnchor column). Tap to enter the fullscreen view. */}
      {tacticalBattle?.geoAnchor && (() => {
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
                actionMode={{ kind: 'none' }}
                selectedId={null}
                hovered={null}
                setHovered={() => {}}
                onTileClick={() => setBattleViewMinimized(false)}
                attackArcs={[]}
                stratagemFx={[]}
                officers={officers}
              />
            </group>
          </group>
        );
      })()}
      {tacticalBattle?.geoAnchor && (() => {
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
          <City3D
            key={city.id}
            city={city}
            forceColor={color}
            isCapital={capitalCityIds.has(city.id)}
            isSelected={selectedCityId === city.id}
            terrainY={terrainY}
            overlay={overlayForCity(city, overlayMode, maxes)}
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
        );
      })}
    </>
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
];

const WEATHER_ZH: Record<WeatherKind, string> = {
  clear: '☀ 晴', rain: '☂ 雨', snow: '❄ 雪', wind: '🌀 風', drought: '☼ 旱',
};
const SEASON_ZH: Record<Season, string> = {
  spring: '春', summer: '夏', autumn: '秋', winter: '冬',
};

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
  const [showStockadeBuild, setShowStockadeBuild] = useState(false);
  // Orbit pivot — held as STATE (stable ref) so re-renders don't snap the
  // target back; BattleFocusFly animates it to a clash site, then locks it in.
  const controlsRef = useRef<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>(null);
  const [orbitTarget, setOrbitTarget] = useState<[number, number, number]>([0, 0, 0]);
  // While a battle diorama is on the map, let the camera dive much closer.
  const battleActive = useGameStore((s) => !!s.tacticalBattle);
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
  const weather = useGameStore((s) => s.weather);
  const season = useGameStore((s) => s.date.season) as Season;
  const t = useT();

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #88a0c0 0%, #c8b890 100%)',
    }}>
      {/* Objective tracker — top-left */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, pointerEvents: 'none' }}>
        <ObjectivePanel />
      </div>

      {/* Season + weather chip */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', gap: 6,
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

      {/* Controls hint */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        background: 'rgba(20, 14, 8, 0.85)', color: '#a89070',
        border: '1px solid #5a4530',
        padding: '0.3rem 0.6rem',
        fontFamily: 'Songti SC, serif', fontSize: '0.72rem',
        pointerEvents: 'none',
      }}>{t('拖曳 = 旋轉 · 滾輪 = 縮放 · 右鍵拖曳 = 平移 · 點擊城池檢視', 'drag = rotate · scroll = zoom · right-drag = pan · click city to inspect')}</div>

      {/* Overlay mode buttons — bottom-left */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 10,
        display: 'flex', gap: 4,
        background: 'rgba(20, 14, 8, 0.88)',
        border: '1px solid #5a4530',
        padding: 4,
        boxShadow: '0 0 8px rgba(0,0,0,0.6)',
      }}>
        {OVERLAY_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setOverlayMode(opt.id)}
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
      </div>

      <Canvas
        shadows
        dpr={IS_MOBILE ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, MAP_D * 0.9, MAP_D * 0.7], fov: 45 }}
        gl={{ antialias: !IS_MOBILE }}
      >
        <Suspense fallback={null}>
          <MapScene
            overlayMode={overlayMode}
            mapStyle={mapStyle}
            onPortClick={setSelectedPortId}
            onFortClick={setSelectedFortId}
          />
          <OrbitControls
            ref={controlsRef as React.Ref<never>}
            target={orbitTarget}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={battleActive ? 0.9 : 3}
            maxDistance={100}
            enableDamping
            dampingFactor={0.1}
          />
          {/* Fly to a battle the moment it ignites — before its screen mounts. */}
          <BattleFocusFly controlsRef={controlsRef} onSettled={setOrbitTarget} />
          {/* Gentle bloom — beacons, fires and water shimmer get a halo. */}
          {!IS_MOBILE && (
            <EffectComposer>
              <Bloom luminanceThreshold={0.85} intensity={0.35} mipmapBlur />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>

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
      {showStockadeBuild && (
        <BuildStockadePicker onClose={() => setShowStockadeBuild(false)} />
      )}
    </div>
  );
}
