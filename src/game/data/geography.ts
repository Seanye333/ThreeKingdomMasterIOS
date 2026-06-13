/**
 * Shared map geography — the China landmass shape, in the same 1000×720
 * pixel space the city coords use. Mirrors the coastline that
 * StrategicMap3D's procedural terrain draws, so the territory hex grid
 * and the 3D terrain agree on where land ends and sea begins.
 *
 * (The coastline data is intentionally duplicated from the 3D terrain
 * module rather than extracted — the 3D file is a large, working
 * procedural system and the ~25-point coastline is cheap to keep in
 * sync by hand. If these ever drift, the hex grid will paint slightly
 * past/short of the rendered coast; adjust here to match.)
 */

/** World-scale dial — stretches the strategic map's coordinate space so
 *  cities sit farther apart (more hex cells between them → room for field
 *  battles, no "instantly at the gates"). Balance is preserved: every
 *  downstream distance threshold (march duration, interception, sally,
 *  merge, territory, AI) multiplies by the SAME factor, and the renderer
 *  derives its size from MAP_W/MAP_H. Set to 1 to restore the old layout. */
export const WORLD_SCALE = 6.0;
export const MAP_W = 1000 * WORLD_SCALE;
export const MAP_H = 720 * WORLD_SCALE;

const GEO_LON_MIN = 96, GEO_LON_MAX = 125;
const GEO_LAT_MIN = 17, GEO_LAT_MAX = 43;
const GEO_LAT_SPAN = GEO_LAT_MAX - GEO_LAT_MIN;

export function geoToPixel(lon: number, lat: number): [number, number] {
  const px = ((lon - GEO_LON_MIN) / (GEO_LON_MAX - GEO_LON_MIN)) * MAP_W;
  const py = (1 - (lat - GEO_LAT_MIN) / (GEO_LAT_MAX - GEO_LAT_MIN)) * MAP_H;
  return [px, py];
}

/** Eastern coastline longitude as a function of latitude. */
function coastLonAt(lat: number): number {
  const pts: [number, number][] = [
    [43, 124], [42, 124], [41, 124],
    [40, 121.5], [39.5, 122], [39, 118.5], [38, 117.5],
    [37.5, 122.5], [36, 121], [35, 120.5],
    [33, 121], [32, 121.5], [31, 122], [30, 122], [29, 121.5],
    [28, 121.5], [26, 120], [24, 118], [23, 117],
    [22, 114], [21.5, 111], [21, 110], [20, 110], [18, 110], [17, 110],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    if (lat <= pts[i][0] && lat >= pts[i + 1][0]) {
      const t = (pts[i][0] - lat) / (pts[i][0] - pts[i + 1][0] || 1);
      return pts[i][1] * (1 - t) + pts[i + 1][1] * t;
    }
  }
  return 122;
}

/** X pixel of the eastern coast at a given screen Y. */
function coastXAt(y: number): number {
  const lat = GEO_LAT_MAX - (y / MAP_H) * GEO_LAT_SPAN;
  const [px] = geoToPixel(coastLonAt(lat), lat);
  return px;
}

// Offshore landmasses the simple eastern-coastline model misses: the
// Korean peninsula (Lelang/Daifang) and Hainan (Zhuyai). Each is an
// axis-aligned region; a point inside reads as land. Positioned to cover
// the geo-anchored city positions (cityGeo.ts): 樂浪 ≈ (976,110),
// 帶方 ≈ (969,130), 朱崖 ≈ (495,636).
const ISLANDS: ReadonlyArray<{ cx: number; cy: number; hw: number; hh: number }> = [
  { cx: 962, cy: 122, hw: 38, hh: 55 }, // Korea — hugs the NE map edge
  { cx: 502, cy: 640, hw: 18, hh: 18 }, // Hainan — thin strait off the Leizhou coast
];
function islandSDF(x: number, y: number): number {
  // ISLANDS are authored in the base 1000×720 space; scale them with the
  // world so cities sitting on them (樂浪/帶方 on "Korea", 朱崖 on Hainan)
  // stay on land at any WORLD_SCALE.
  let best = -Infinity;
  for (const i of ISLANDS) {
    best = Math.max(best, Math.min(
      i.hw * WORLD_SCALE - Math.abs(x - i.cx * WORLD_SCALE),
      i.hh * WORLD_SCALE - Math.abs(y - i.cy * WORLD_SCALE),
    ));
  }
  return best;
}

/**
 * Signed distance to the land boundary in pixels: positive = inland,
 * negative = at sea. Land is bounded on the east by the coastline and
 * on the south by the map edge; north and west run to the map border —
 * plus the offshore islands (Korea, Hainan) unioned in.
 */
export function landSDF(x: number, y: number): number {
  const distEast = coastXAt(y) - x;
  const distSouth = MAP_H - y;
  return Math.max(Math.min(distEast, distSouth), islandSDF(x, y));
}

/** True if the pixel is on land (with an optional inland margin). */
export function isLand(x: number, y: number, margin = 0): boolean {
  return landSDF(x, y) > margin;
}

// ── Hex grid geometry (pointy-top, odd-r offset) ──────────────────
// Shared by the territory overlay (which draws the grid) and the army
// movement code (which snaps units to hex centres), so they always
// agree on cell positions.
// Fine RTK-XIV-style grid: ~145 hexes across the 1000px map width.
export const HEX_SIZE = 4;                        // centre → corner
export const HEX_W = Math.sqrt(3) * HEX_SIZE;     // horizontal spacing
export const HEX_V = 1.5 * HEX_SIZE;              // vertical (row) spacing

/** Six pointy-top corners of the hex centred at (cx, cy). */
export function hexCorners(cx: number, cy: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 180) * (60 * i - 90);
    pts.push([cx + HEX_SIZE * Math.cos(ang), cy + HEX_SIZE * Math.sin(ang)]);
  }
  return pts;
}

/**
 * Snap an arbitrary pixel to the centre of the hex that contains it,
 * on the same odd-r grid the overlay draws. Used to make marching units
 * sit on cells and step cell-to-cell instead of gliding.
 */
export function snapToHexCenter(px: number, py: number): { x: number; y: number } {
  const r = Math.round(py / HEX_V);
  const xOff = (((r % 2) + 2) % 2) === 1 ? HEX_W / 2 : 0;
  const q = Math.round((px - xOff) / HEX_W);
  return { x: q * HEX_W + xOff, y: r * HEX_V };
}

// ── Terrain cost for marching ─────────────────────────────────────
// Mountain ridges + major rivers in pixel space (mirrors the procedural
// terrain in StrategicMap3D). A march that crosses these moves slower.
const DEG_TO_PX = MAP_W / (GEO_LON_MAX - GEO_LON_MIN);
const ridgePx = (ridge: ReadonlyArray<readonly [number, number]>): Array<[number, number]> =>
  ridge.map(([lon, lat]) => geoToPixel(lon, lat));

const MOUNTAINS = ([
  { zh: '岷山', en: 'Min Mountains', ridge: [[96, 31], [98, 29.5], [100, 28]], width: 3.0, cost: 1.6 },           // 青藏东缘
  { zh: '隴山', en: 'Long Mountains', ridge: [[96, 35.5], [100, 36], [104, 36]], width: 2.0, cost: 1.1 },         // 昆仑/陇右
  { zh: '秦嶺', en: 'Qinling', ridge: [[105, 33.8], [108, 33.7], [111, 33.5], [113, 33.4]], width: 0.8, cost: 1.2 },
  { zh: '巴山', en: 'Ba Mountains', ridge: [[105, 32.5], [108, 32], [111, 31.5]], width: 0.7, cost: 1.3 },        // 大巴/巫山
  { zh: '太行山', en: 'Taihang', ridge: [[113.5, 41], [113.8, 38], [113.5, 35]], width: 0.7, cost: 0.9 },
  { zh: '燕山', en: 'Yan Mountains', ridge: [[115, 41.5], [117, 41], [119, 41]], width: 0.6, cost: 0.7 },
  { zh: '武夷山', en: 'Wuyi', ridge: [[117.5, 28], [117, 25]], width: 0.6, cost: 0.8 },
  { zh: '南嶺', en: 'Nanling', ridge: [[110, 25.5], [113, 25], [115, 24.8]], width: 0.6, cost: 0.7 },
  { zh: '橫斷山', en: 'Hengduan', ridge: [[100, 30], [101.5, 27], [102, 24]], width: 1.0, cost: 1.4 },
] as const).map((m) => ({ zh: m.zh, en: m.en, ridge: ridgePx(m.ridge), width: m.width * DEG_TO_PX, cost: m.cost }));

const RIVERS = ([
  { zh: '黃河', en: 'Yellow River', pts: [[96, 35], [103, 37], [106, 39], [109, 40.5], [110, 38], [112, 35], [114, 35], [117, 36], [119, 37.5]], width: 0.20 },
  { zh: '長江', en: 'Yangtze', pts: [[96, 33], [104, 30], [107, 30.5], [110, 30.5], [113, 30.5], [117, 30.8], [120, 31], [122, 31.5]], width: 0.25 },
] as const).map((r) => ({ zh: r.zh, en: r.en, pts: ridgePx(r.pts), width: Math.max(8, r.width * DEG_TO_PX) }));

function distToPolyline(px: number, py: number, pts: Array<[number, number]>): number {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + dx * t, cy = ay + dy * t;
    const d = Math.hypot(px - cx, py - cy);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Extra movement cost at a pixel from terrain: 0 on open plains, rising
 * through mountains (up to ~1.6×) and a bump for river crossings. Used to
 * weight march distance so marches through the mountains take longer.
 */
export function terrainMarchCost(x: number, y: number, opts?: { frozenRivers?: boolean }): number {
  let cost = 0;
  for (const m of MOUNTAINS) {
    const d = distToPolyline(x, y, m.ridge);
    if (d < m.width) cost += m.cost * (1 - d / m.width);
  }
  for (const r of RIVERS) {
    // 冰封 — in deep winter the northern rivers freeze solid and armies
    // simply walk across (曹操渡冰擊馬超). The Yangtze never freezes.
    if (opts?.frozenRivers && r.zh === '黃河') continue;
    const d = distToPolyline(x, y, r.pts);
    if (d < r.width) cost += 0.5 * (1 - d / r.width);
  }
  return cost;
}

/** Does water at this map point freeze in winter? Northern waters only
 *  (lat ≳33.5°N — the 黄河/渭水 belt; the Yangtze never ices over). */
export function isFrozenWater(y: number, season?: string): boolean {
  if (season !== 'winter') return false;
  const lat = GEO_LAT_MAX - (y / MAP_H) * GEO_LAT_SPAN;
  return lat > 33.5;
}

// ── Battlefield sampling (战斗地图写实) ──────────────────────────
// Finer water features that matter on a TACTICAL battlefield but are
// deliberately kept out of terrainMarchCost — strategic march crossings
// stay gated by the two great rivers (黄河/长江) only.
// Courses are nudged so riverside cities sit on the BANK, not in the
// water (襄陽 south of the 漢水, 長安 south of the 渭水, 汝南 north of
// the 淮河) — a siege from across the river crosses it; from the same
// bank it does not.
const RIVERS_DETAIL = ([
  { zh: '漢水', en: 'Han River', pts: [[106.6, 33.15], [108, 32.8], [110, 32.4], [111.3, 32.0], [112.2, 31.95], [113.5, 31.15], [114.3, 30.62]], width: 0.14 }, // 漢中→襄陽北→夏口
  { zh: '淮河', en: 'Huai River', pts: [[112.9, 32.4], [115, 32.6], [117, 32.9], [119, 33.3]], width: 0.12 },     // 桐柏→蚌埠
  { zh: '珠江', en: 'Pearl River', pts: [[104, 24], [108, 23.5], [111, 23], [113, 23], [114.5, 22.5]], width: 0.14 },
  { zh: '湘江', en: 'Xiang River', pts: [[110.5, 25.8], [112, 27], [112.8, 28.2], [113.0, 29.3]], width: 0.10 },  // 零陵→長沙→洞庭
  { zh: '渭水', en: 'Wei River', pts: [[104.5, 35.9], [106, 34.9], [107.2, 34.52], [108.9, 34.45], [110.3, 34.68]], width: 0.10 }, // 隴右→長安北→潼關
] as const).map((r) => ({ zh: r.zh, en: r.en, pts: ridgePx(r.pts), width: Math.max(4, r.width * DEG_TO_PX) }));

// The three great lakes — battlefield water (march routing ignores them;
// they are small next to the 24px nav grid).
const LAKES_GAME: ReadonlyArray<{ zh: string; en: string; x: number; y: number; r: number }> = ([
  { zh: '洞庭湖', en: 'Lake Dongting', lon: 112.9, lat: 29.3, r_deg: 0.92 },
  { zh: '鄱陽湖', en: 'Lake Poyang', lon: 116.3, lat: 29.0, r_deg: 0.70 },
  { zh: '太湖', en: 'Lake Tai', lon: 120.2, lat: 31.2, r_deg: 0.48 },
] as const).map((l) => {
  const [px, py] = geoToPixel(l.lon, l.lat);
  return { zh: l.zh, en: l.en, x: px, y: py, r: l.r_deg * DEG_TO_PX };
});

export type BattleGround = 'sea' | 'lake' | 'river' | 'riverbank' | 'mountain' | 'hill' | 'plain';

/**
 * Classify the real ground at a map pixel for battlefield generation —
 * sea/lakes, the great rivers plus tactical rivers (漢水/淮河/珠江/湘江/
 * 渭水), mountain mass and foothills. The tactical generator maps a
 * battle grid over the strategic map through this, so the battlefield
 * reproduces the actual local geography (a 汉水 crossing when storming
 * 襄陽 from the north; ridges flanking the Shu passes).
 */
export function battleGroundAt(x: number, y: number): BattleGround {
  if (landSDF(x, y) < 0) return 'sea';
  for (const lk of LAKES_GAME) {
    if (Math.hypot(x - lk.x, y - lk.y) < lk.r) return 'lake';
  }
  let riverD = Infinity;
  let riverW = 1;
  for (const r of RIVERS) {
    const d = distToPolyline(x, y, r.pts);
    if (d - r.width < riverD - riverW) { riverD = d; riverW = r.width; }
  }
  for (const r of RIVERS_DETAIL) {
    const d = distToPolyline(x, y, r.pts);
    if (d - r.width < riverD - riverW) { riverD = d; riverW = r.width; }
  }
  if (riverD < riverW) return 'river';
  if (riverD < riverW * 1.9) return 'riverbank';
  let mountainScore = 0;
  for (const m of MOUNTAINS) {
    const d = distToPolyline(x, y, m.ridge);
    if (d < m.width) mountainScore = Math.max(mountainScore, m.cost * (1 - d / m.width));
  }
  if (mountainScore > 0.55) return 'mountain';
  if (mountainScore > 0.28) return 'hill';
  return 'plain';
}

/**
 * Is this map point close enough to a river (or lake) for water-works —
 * gates the 水攻 (dike-breaking flood) siege option: you can only drown
 * a city that actually sits by the water (襄陽/下邳…, not 許昌).
 */
export function isRiverside(x: number, y: number, range = 14): boolean {
  for (const r of [...RIVERS, ...RIVERS_DETAIL]) {
    if (distToPolyline(x, y, r.pts) < r.width + range) return true;
  }
  for (const lk of LAKES_GAME) {
    if (Math.hypot(x - lk.x, y - lk.y) < lk.r + range) return true;
  }
  return false;
}

/**
 * Name the ground a battle is fought on — 「漢水之濱」「秦嶺山中」
 * 「洞庭湖畔」 — for season-report flavour. Returns null on open plain.
 */
export function describeBattleSite(x: number, y: number): { zh: string; en: string } | null {
  for (const lk of LAKES_GAME) {
    if (Math.hypot(x - lk.x, y - lk.y) < lk.r * 1.25) {
      return { zh: `${lk.zh}畔`, en: `on the shores of ${lk.en}` };
    }
  }
  let bestRiver: { zh: string; en: string } | null = null;
  let bestScore = Infinity;
  for (const r of [...RIVERS, ...RIVERS_DETAIL]) {
    const d = distToPolyline(x, y, r.pts);
    if (d < r.width * 1.9 && d / r.width < bestScore) {
      bestScore = d / r.width;
      bestRiver = d < r.width
        ? { zh: `${r.zh}渡口`, en: `at the ${r.en} crossing` }
        : { zh: `${r.zh}之濱`, en: `on the banks of the ${r.en}` };
    }
  }
  if (bestRiver) return bestRiver;
  let bestMountain: { zh: string; en: string } | null = null;
  let mScore = 0;
  for (const m of MOUNTAINS) {
    const d = distToPolyline(x, y, m.ridge);
    if (d < m.width) {
      const score = m.cost * (1 - d / m.width);
      if (score > mScore) {
        mScore = score;
        bestMountain = score > 0.5
          ? { zh: `${m.zh}山中`, en: `deep in the ${m.en}` }
          : { zh: `${m.zh}山麓`, en: `in the foothills of the ${m.en}` };
      }
    }
  }
  if (bestMountain && mScore > 0.28) return bestMountain;
  return null;
}

/**
 * Classify the dominant terrain at a map pixel — used to theme a field
 * battle's tactical battlefield after the real ground the clash happens on.
 * Returns a battlefield-terrain category ('mountain' | 'water' | 'plain').
 */
export function terrainTypeAt(x: number, y: number): 'mountain' | 'water' | 'plain' {
  let mountainScore = 0;
  for (const m of MOUNTAINS) {
    const d = distToPolyline(x, y, m.ridge);
    if (d < m.width) mountainScore = Math.max(mountainScore, m.cost * (1 - d / m.width));
  }
  let riverScore = 0;
  for (const r of RIVERS) {
    const d = distToPolyline(x, y, r.pts);
    if (d < r.width) riverScore = Math.max(riverScore, 1 - d / r.width);
  }
  if (riverScore > 0.4 && riverScore >= mountainScore) return 'water';
  if (mountainScore > 0.3) return 'mountain';
  return 'plain';
}
