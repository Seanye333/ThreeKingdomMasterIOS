/* Shared module-level constants + pure helpers for the strategic 3D map.
 * Extracted verbatim from StrategicMap3D.tsx (pure mechanical split). */
import * as THREE from 'three';
import { geoToPixel, MAP_W as PX_W, MAP_H as PX_H, WORLD_SCALE } from '../../../game/data/geography';

/** Coarse-pointer / small-screen device — drop pixel ratio and skip the
 *  post-processing pass so phones keep a playable framerate. */
export const IS_MOBILE = typeof window !== 'undefined'
  && (window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth < 700);

/* ─── Pixel↔world mapping ──────────────────────────────────────────
 * StrategicMap.tsx uses (0..1000, 0..720) pixel coords for cities.
 * We scale that to a world that's ~20 units wide × 14.4 deep.
 * X grows east (right), Z grows south (down) — same orientation as the
 * 2D map. Y is height. */
export const PIXEL_TO_WORLD = 1 / 24;          // pixel-space → 3D world units
export const MAP_W = PX_W * PIXEL_TO_WORLD;   // 3D width — auto-scales with WORLD_SCALE
export const MAP_D = PX_H * PIXEL_TO_WORLD;   // 3D depth — auto-scales with WORLD_SCALE

// City models + army tokens are fixed world-size, so a bigger world makes
// them read as tiny dots. Grow them GENTLY (sub-linear) with WORLD_SCALE so
// they stay legible at the strategic overview without dominating up close.
// (At WORLD_SCALE 1 → 1.0, unchanged; 6 → 1.75.) Tune the 0.15 to taste.
export const MARKER_SCALE = 1 + (WORLD_SCALE - 1) * 0.15;
/** Stable fallback for selectors that may return undefined on old saves. */
export const EMPTY_HEX_PAINT: Record<string, { f: string; t: number }> = {};
export const EMPTY_TERRITORY_OWNERSHIP: Record<string, string | null> = {};
export function pxToWorld(x: number, y: number): [number, number] {
  return [x * PIXEL_TO_WORLD - MAP_W / 2, y * PIXEL_TO_WORLD - MAP_D / 2];
}

/* ─── Geographic coordinate system (Phase B) ───────────────────────
 * The map covers China from ~96°E to ~125°E (29° wide) and from ~43°N
 * to ~17°N (26° tall). City positions come from the shared cityGeo
 * module (real lon/lat → pixel via geography.ts geoToPixel) — the same
 * source the gameplay distance system uses, so the rendered map and the
 * simulation always agree. */
export const GEO_LON_MIN = 96, GEO_LON_MAX = 125;   // 29° east-west
export const GEO_LAT_MIN = 17, GEO_LAT_MAX = 43;    // 26° north-south

/* ─── Geo-space helpers for terrain features (Phase B.2) ─────────
 * All MOUNTAINS / RIVERS / DESERTS / COASTLINE are authored in real
 * (lon, lat) and converted to pixel space at module load. The downstream
 * sampleTerrain still works in pixel space — only the SOURCE OF TRUTH
 * has changed. */
export const GEO_LON_SPAN = GEO_LON_MAX - GEO_LON_MIN;   // 29°
export const GEO_LAT_SPAN = GEO_LAT_MAX - GEO_LAT_MIN;   // 26°
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
export function isLandPx(px: number, py: number): boolean {
  return landSDF(px, py) > 2;
}

/** Land = positive distance to coast, sea = negative. */
export function landSDF(x: number, y: number): number {
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
export const RIVERS = RIVERS_GEO.map((r) => ({
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
export const LAKES = LAKES_GEO.map((l) => {
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
export function distToPolyline(px: number, py: number, pts: [number, number][]): number {
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
export function valueNoise(x: number, z: number): number {
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

export function sampleTerrain(px: number, py: number): { h: number; color: THREE.Color } {
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
    if (peakT < 0.55) {
      color = C_MOUNTAIN.clone().lerp(C_PEAK, peakT / 0.55);
    } else {
      // Crisp snowcap — smoothstep tightens the rock→snow line so high peaks
      // read as clearly snow-mantled rather than fading to grey.
      color = C_PEAK.clone().lerp(C_SNOW, smoothstep((peakT - 0.55) / 0.45));
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

/** Get terrain height at any (wx, wz) world-space coord — for planting
 *  cities and road waypoints on the actual ground. */
export function sampleTerrainHeight(wx: number, wz: number): number {
  const px = (wx + MAP_W / 2) / PIXEL_TO_WORLD;
  const py = (wz + MAP_D / 2) / PIXEL_TO_WORLD;
  return sampleTerrain(px, py).h;
}

/** Plant a city on the terrain. We sample the city's exact point plus a
 *  tiny 0.3-world-unit ring to smooth out single-vertex jitter, then add a
 *  small +0.03 lift so the base disk doesn't z-fight with the ground. */
export function cityElevation(wx: number, wz: number): number {
  let maxH = sampleTerrainHeight(wx, wz);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const h = sampleTerrainHeight(wx + Math.cos(a) * 0.3, wz + Math.sin(a) * 0.3);
    if (h > maxH) maxH = h;
  }
  return maxH + 0.03;
}

// Marching-token scale — kept in step with the city footprint shrink (0.7→0.5)
// so the squad reads as a unit on the map, not larger than the cities it moves
// between.
export const ARMY_TOKEN_SCALE = 0.7 * MARKER_SCALE;

/* ─── 疊圖模式 + 季節標籤 — shared by the main map and the split modules ── */
export type OverlayMode = 'none' | 'gold' | 'food' | 'troops' | 'loyalty' | 'province' | 'supply' | 'diplomacy' | 'threat' | 'specialty' | 'intent';
export const SEASON_ZH: Record<import('../../../game/types').Season, string> = {
  spring: '春', summer: '夏', autumn: '秋', winter: '冬',
};
export const SEASON_EN: Record<import('../../../game/types').Season, string> = {
  spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter',
};
