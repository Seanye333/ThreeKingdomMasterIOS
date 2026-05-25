import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../game/state/store';
import { PROVINCE_BY_CITY } from '../../game/data';
import { citySize } from '../../game/systems/citySize';
import type { City, Season } from '../../game/types';
import type { WeatherKind } from '../../game/systems/weather';
import { ObjectivePanel } from './ObjectivePanel';
import { PortPanel } from './PortPanel';
import { FortPanel } from './FortPanel';
import { BuildStockadePicker } from './BuildStockadePicker';
import { useT } from '../i18n';

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
function pxToWorld(x: number, y: number): [number, number] {
  return [x * PIXEL_TO_WORLD - MAP_W / 2, y * PIXEL_TO_WORLD - MAP_D / 2];
}

/* ─── Geographic coordinate system (Phase B) ───────────────────────
 * The painted map roughly covers China from ~96°E to ~125°E (29° wide)
 * and from ~43°N to ~17°N (26° tall, north→south). For each city we
 * may have either:
 *   • a real historical (lat, lon) — looked up below in CITY_GEO_OVERRIDES
 *   • or nothing, in which case we derive geo from the existing pixel
 *     coords using a linear calibration of that bbox.
 * Either way we then re-project that (lat, lon) back to pixel space
 * via the SAME calibration, so the city lands in pixel space — which
 * is what the rest of the 3D rendering (terrain, roads) expects. */
const GEO_LON_MIN = 96, GEO_LON_MAX = 125;   // 29° east-west
const GEO_LAT_MIN = 17, GEO_LAT_MAX = 43;    // 26° north-south
function geoToPixel(lon: number, lat: number): [number, number] {
  const px = ((lon - GEO_LON_MIN) / (GEO_LON_MAX - GEO_LON_MIN)) * 1000;
  const py = (1 - (lat - GEO_LAT_MIN) / (GEO_LAT_MAX - GEO_LAT_MIN)) * 720;
  return [px, py];
}

/** Real historical positions for well-known cities. Values are modern
 *  (lon, lat) — modern equivalent city or the well-known ruin site. */
const CITY_GEO_OVERRIDES: Record<string, [number, number]> = {
  // Three Kingdoms capitals
  'luoyang':   [112.45, 34.65],   // 洛陽 — Eastern Han capital
  'changan':   [108.93, 34.27],   // 長安 — former Western Han capital
  'xuchang':   [113.81, 34.04],   // 許昌 — Cao Cao's capital after 196
  'ye':        [114.62, 36.32],   // 鄴 — Wei capital (modern Linzhang)
  'chengdu':   [104.07, 30.66],   // 成都 — Shu Han capital
  'jianye':    [118.78, 32.05],   // 建業 — Wu capital (modern Nanjing)
  // Major regional centers
  'wuchang':   [114.30, 30.55],   // 武昌 (Sun Quan's earlier capital, mod. Wuhan-Wuchang)
  'jiangling': [112.18, 30.36],   // 江陵 — Jingzhou hub
  'xiangyang': [112.13, 32.01],   // 襄陽
  'hanzhong':  [107.02, 33.07],   // 漢中
  // 'wan' — see 'wancheng' below (same city, different ID)
  'shouchun':  [116.79, 31.92],   // 壽春 (modern Shouxian)
  'hefei':     [117.23, 31.82],   // 合肥
  'chaisang':  [116.00, 29.71],   // 柴桑 (near Jiujiang)
  'yongan':    [109.46, 31.03],   // 永安 (modern Fengjie)
  'jiangxia':  [114.65, 30.95],   // 江夏 (西陵 — slightly NE of Wuchang)
  'pengcheng': [117.20, 34.27],   // 彭城 (modern Xuzhou)
  'xiaopei':   [116.79, 33.96],   // 小沛
  'xiapi':     [117.95, 34.30],   // 下邳
  // North / Yellow River
  'bohai':     [117.50, 37.50],   // 渤海郡
  'pingyuan':  [116.43, 37.16],   // 平原
  'beiping':   [116.41, 39.92],   // 北平 (modern Beijing area)
  'taiyuan':   [112.55, 37.87],   // 太原
  'yanmen':    [112.95, 39.50],   // 雁門 (modern Daixian)
  'shangdang': [113.10, 36.10],   // 上黨 (modern Changzhi)
  // 'liaodong' override removed — real (123.18, 41.27) falls east of our
  // hand-drawn coastline; keep its painted position until Phase B.2 redraws
  // the coast in real geo coords.
  'guandu':    [114.10, 34.78],   // 官渡 (near Zhongmu)
  'hulao':     [112.99, 34.79],   // 虎牢關 (between Luoyang and Xingyang)
  // North-west
  'wuwei':     [102.64, 37.93],   // 武威
  'jincheng':  [103.83, 36.06],   // 金城 (modern Lanzhou)
  'longxi':    [104.62, 35.00],   // 隴西
  'tianshui':  [105.72, 34.58],   // 上邽/天水
  'anding':    [105.65, 36.55],   // 安定 (modern Pingliang)
  'shuofang':  [107.42, 40.79],   // 朔方
  'yangping':  [106.62, 33.13],   // 陽平關
  // South — Jing/Jiao/Yang
  'changsha':  [112.94, 28.23],   // 長沙
  'lingling':  [111.62, 26.43],   // 零陵
  'guiyang':   [112.39, 25.78],   // 桂陽
  'wuling':    [111.69, 29.13],   // 武陵
  'jiaozhi':   [105.85, 21.03],   // 交趾 (modern Hanoi)
  'hepu':      [109.20, 21.69],   // 合浦
  'cangwu':    [111.32, 23.48],   // 蒼梧 (modern Wuzhou)
  'nanhai':    [113.27, 23.13],   // 南海 (modern Guangzhou)
  'jianning':  [102.71, 25.04],   // 建寧 (modern Kunming area)
  // 'yuesui' — see 'yuexi' below (same city)
  // Yi province (Sichuan basin)
  'baxi':      [105.97, 31.85],   // 巴西 (modern Mianyang)
  'jiangzhou': [106.55, 29.56],   // 江州 (modern Chongqing)
  // 'fuling' — no matching city ID in data; removed
  // Misc
  // 'yiyang' — no matching city ID in data; removed
  'lujiang':   [117.30, 31.25],   // 廬江
  'danyang':   [118.81, 31.94],   // 丹陽
  'kuaiji':    [120.58, 30.00],   // 會稽 (modern Shaoxing)
  // ── Additional cities (B.2 continuation) ──
  // Northeast
  'liaodong':  [121.50, 41.00],   // 遼東 — placed inland west of Liaoning
  'xiangping': [122.50, 41.10],   // 襄平 — Han Liaodong seat (modern Liaoyang)
  'wuhuan':    [120.00, 42.00],   // 烏桓 — nomadic territory, NE of map
  'yuyang':    [116.84, 40.37],   // 漁陽 (modern Miyun, north Beijing)
  'yi-county': [115.50, 39.35],   // 易縣
  // Far NW (off-edge but pull into map)
  'dunhuang':  [96.20, 40.14],    // 敦煌 (pulled E to fit)
  'jiuquan':   [98.51, 39.74],    // 酒泉
  'wudu':      [105.16, 33.39],   // 武都
  'shanggui':  [105.72, 34.58],   // 上邽 (same area as Tianshui)
  // Central / Wei core
  'chencang':  [107.37, 34.36],   // 陳倉 (modern Baoji)
  'tongguan':  [110.27, 34.55],   // 潼關
  'wuguan':    [110.42, 33.86],   // 武關
  'mei':       [107.74, 34.28],   // 郿
  'puyang':    [115.04, 35.71],   // 濮陽
  'chenliu':   [114.42, 34.79],   // 陳留 (Cao Cao's early base)
  'nanpi':     [116.70, 38.04],   // 南皮 (Yuan Shao base)
  'boling':    [115.51, 38.23],   // 博陵
  'linzi':     [118.34, 36.83],   // 臨淄
  'langya':    [118.36, 35.10],   // 琅琊 (modern Linyi)
  'guangling': [119.42, 32.39],   // 廣陵 (modern Yangzhou)
  'runan':     [114.65, 32.95],   // 汝南
  // Hubei / Jingzhou
  'wancheng':  [112.53, 33.00],   // 宛城 — alias of 宛
  'bowang':    [112.45, 33.20],   // 博望 (near 宛)
  'xinye':     [112.36, 32.52],   // 新野
  'fancheng':  [112.13, 32.05],   // 樊城 — adjacent to Xiangyang
  'shangyong': [110.23, 32.22],   // 上庸 (modern Zhushan)
  'xincheng':  [110.78, 32.13],   // 新城 (Wei commandery from Shangyong)
  // Yangtze gorges / Jingzhou southwest
  'xiling':    [111.40, 30.75],   // 西陵 (modern Yichang area, Xiling gorge)
  'yiling':    [111.29, 30.69],   // 夷陵 (Yiling battle site)
  'xiaoting':  [111.41, 30.51],   // 猇亭
  'maicheng':  [111.79, 30.85],   // 麥城
  'wuxi':      [109.88, 31.07],   // 巫縣 (Yangtze gorges)
  'yinping':   [104.68, 32.95],   // 陰平 (modern Wenxian, Sichuan-Gansu border)
  // Yangtze valley downstream
  'baqiu':     [113.13, 29.36],   // 巴丘 (modern Yueyang)
  'poyang':    [116.69, 29.00],   // 鄱陽
  'yuzhang':   [115.89, 28.68],   // 豫章 (modern Nanchang)
  'luling':    [114.99, 27.11],   // 廬陵 (modern Ji'an)
  'wu':        [120.62, 31.30],   // 吳 (modern Suzhou)
  'linhai':    [121.13, 28.85],   // 臨海
  // South / Jiao zhou
  'guilin':    [110.30, 25.27],   // 桂林
  'beihai':    [118.79, 36.71],   // 北海國 (孔融太守, Shandong NE — NOT modern Beihai/Guangxi)
  'nanzhong':  [102.50, 25.50],   // 南中 (general SW area, Yunnan)
  'yongchang': [99.16, 25.12],    // 永昌 (modern Baoshan)
  'yunnan':    [101.25, 25.50],   // 雲南郡
  'yuexi':     [102.27, 27.90],   // 越巂 (alias of yuesui)
  // Shanxi/Henan misc
  'hukou':     [113.20, 36.10],   // 壺關 (north Taihang pass)
};

/** Get pixel coords for a city, preferring the geographic override if
 *  available. Falls back to the painted-map pixel coords. */
function cityPixel(cityId: string, fallbackX: number, fallbackY: number): [number, number] {
  const geo = CITY_GEO_OVERRIDES[cityId];
  if (geo) return geoToPixel(geo[0], geo[1]);
  return [fallbackX, fallbackY];
}

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
/** Land = positive distance to coast, sea = negative. */
function landSDF(x: number, y: number): number {
  const eastBoundary  = coastXAt(y);
  const distEast      = eastBoundary - x;
  const distSouth     = 720 - y;
  return Math.min(distEast, distSouth);
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
const C_PLAIN     = new THREE.Color('#7a8a4a');     // 华北/江汉/成都 — fertile
const C_HILL      = new THREE.Color('#6a7038');
const C_FOREST    = new THREE.Color('#3a5a2a');
const C_MOUNTAIN  = new THREE.Color('#6a5440');
const C_PEAK      = new THREE.Color('#9a8870');
const C_SNOW      = new THREE.Color('#f0e0c8');
const C_DESERT    = new THREE.Color('#c0a070');
const C_RIVER     = new THREE.Color('#3a6a98');

/** Sample terrain (height + color) at a pixel coordinate. */
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
  let color = C_PLAIN.clone();
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
    // Blend color: low slopes brown, mid peaks light brown, very tall white snow
    const peakT = Math.min(1, mountainH / 1.8);
    if (peakT < 0.5) {
      color = C_MOUNTAIN.clone().lerp(C_PEAK, peakT * 2);
    } else {
      color = C_PEAK.clone().lerp(C_SNOW, (peakT - 0.5) * 2);
    }
  }

  // 4. Deserts (NW): nudge color, slight dune undulation
  for (const d of DESERTS) {
    const dist = Math.hypot(px - d.x, py - d.y);
    if (dist < d.r) {
      const t = 1 - dist / d.r;
      color = color.lerp(C_DESERT, t * 0.85);
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

  return { h: baseH, color };
}

/* ─── Build a high-res procedural map texture (painted at pixel level)
 * Per-pixel sampling gives **crisp** biome borders + per-pixel grain, instead
 * of the gradient bleed you get from interpolating vertex colors across
 * triangles. Cached after first build. */
function buildTerrainTexture(): THREE.Texture {
  const TEX_W = 3000;
  const TEX_H = 2160;
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(TEX_W, TEX_H);
  const data = img.data;
  for (let y = 0; y < TEX_H; y++) {
    for (let x = 0; x < TEX_W; x++) {
      const px = (x / TEX_W) * 1000;
      const py = (y / TEX_H) * 720;
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
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  return tex;
}

/* ─── Build a normal map from terrain heights — mountain ridges + river
 *  banks get real per-pixel relief under lighting. Lower resolution than
 *  color (1500×1080) since lighting detail doesn't need super high res. */
function buildNormalMap(): THREE.Texture {
  const NM_W = 1500;
  const NM_H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = NM_W;
  canvas.height = NM_H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(NM_W, NM_H);
  const data = img.data;
  const STRENGTH = 12;  // scales the apparent slope — higher = more dramatic
  // Sample heights into a temporary grid first so neighbors share lookups
  const heights = new Float32Array(NM_W * NM_H);
  for (let y = 0; y < NM_H; y++) {
    for (let x = 0; x < NM_W; x++) {
      const px = (x / NM_W) * 1000;
      const py = (y / NM_H) * 720;
      heights[y * NM_W + x] = sampleTerrain(px, py).h;
    }
  }
  // Convert height gradients to RGB-encoded normals
  for (let y = 0; y < NM_H; y++) {
    for (let x = 0; x < NM_W; x++) {
      const xL = Math.max(0, x - 1), xR = Math.min(NM_W - 1, x + 1);
      const yU = Math.max(0, y - 1), yD = Math.min(NM_H - 1, y + 1);
      const dx = (heights[y * NM_W + xR] - heights[y * NM_W + xL]) * STRENGTH;
      const dy = (heights[yD * NM_W + x] - heights[yU * NM_W + x]) * STRENGTH;
      // Normal vector pointing roughly +z (out of texture surface)
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
  return tex;
}

/* ─── Procedural China terrain ───────────────────────────────────── */
function MapTerrain() {
  // Both textures are EXPENSIVE — build once per mount.
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
function Ocean() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
      <planeGeometry args={[MAP_W * 1.5, MAP_D * 1.5, 1, 1]} />
      <meshStandardMaterial
        color="#1a4a72"
        roughness={0.4}
        metalness={0.5}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

/* ─── Render rivers as visible blue ribbons on top of terrain ─── */
function RiverRibbons() {
  const ribbons = useMemo(() => {
    const out: Array<{ geom: THREE.BufferGeometry; width: number }> = [];
    for (const r of RIVERS) {
      const pts: THREE.Vector3[] = [];
      for (const [px, py] of r.points) {
        const [wx, wz] = pxToWorld(px, py);
        const h = sampleTerrain(px, py).h + 0.005;
        if (!Number.isFinite(wx) || !Number.isFinite(wz) || !Number.isFinite(h)) continue;
        pts.push(new THREE.Vector3(wx, h, wz));
      }
      if (pts.length < 2) continue;
      out.push({ geom: new THREE.BufferGeometry().setFromPoints(pts), width: r.width });
    }
    return out;
  }, []);
  return (
    <group>
      {ribbons.map((r, i) => (
        <line key={i}>
          <primitive object={r.geom} attach="geometry" />
          <lineBasicMaterial color="#5a9bc8" transparent opacity={0.85} linewidth={r.width / 2} />
        </line>
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

/** Pass (關): two stone-cliff wedges flanking a tall gate tower with arch. */
function PassGate({ radius, height, forceColor, onClick }: {
  radius: number; height: number; forceColor: string;
  onClick: (e: { stopPropagation: () => void }) => void;
}) {
  return (
    <>
      {/* Left cliff wedge */}
      <mesh position={[-radius * 0.95, height * 0.55, 0]} castShadow>
        <boxGeometry args={[radius * 0.55, height * 1.10, radius * 1.8]} />
        <meshStandardMaterial color="#6a5440" roughness={0.95} />
      </mesh>
      {/* Right cliff wedge */}
      <mesh position={[radius * 0.95, height * 0.55, 0]} castShadow>
        <boxGeometry args={[radius * 0.55, height * 1.10, radius * 1.8]} />
        <meshStandardMaterial color="#6a5440" roughness={0.95} />
      </mesh>
      {/* Central gate base — stone */}
      <mesh
        position={[0, height * 0.35, 0]}
        castShadow receiveShadow
        onClick={onClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <boxGeometry args={[radius * 1.0, height * 0.70, radius * 0.7]} />
        <meshStandardMaterial color="#8a7560" roughness={0.9} />
      </mesh>
      {/* Gate arch — darker opening */}
      <mesh position={[0, height * 0.25, radius * 0.36]}>
        <boxGeometry args={[radius * 0.5, height * 0.45, radius * 0.05]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      {/* Tower above gate — colored by force */}
      <mesh position={[0, height * 0.90, 0]} castShadow>
        <boxGeometry args={[radius * 1.1, height * 0.40, radius * 0.85]} />
        <meshStandardMaterial color={forceColor} roughness={0.75} />
      </mesh>
      {/* Eave above tower */}
      <mesh position={[0, height * 1.13, 0]} castShadow>
        <boxGeometry args={[radius * 1.45, height * 0.05, radius * 1.10]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
      </mesh>
      {/* Pyramidal roof of gate tower */}
      <mesh position={[0, height * 1.25, 0]} castShadow>
        <coneGeometry args={[radius * 0.75, height * 0.32, 4]} />
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

/** Port complex (港): stone pier extending sideways from the city, with a
 *  moored war junk (楼船) + 3 small fishing boats + a few mast poles. The
 *  pier sticks out along +X by convention. */
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
  // gets bigger. 0.7 multiplier = smaller pillars (less crowded look).
  const worldScale = PIXEL_TO_WORLD * 50 * 0.7;   // 0.7 at original scale, ~1.46 at 1/24
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
      {/* Capital flag */}
      {isCapital && (
        <>
          <mesh position={[0, height + 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
            <meshStandardMaterial color="#1a1410" />
          </mesh>
          <mesh position={[0.1, height + 0.5, 0]} castShadow>
            <planeGeometry args={[0.2, 0.13]} />
            <meshStandardMaterial color="#b8442e" side={THREE.DoubleSide} />
          </mesh>
        </>
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
      {/* HTML label — Chinese name + strength bars */}
      <Html position={[0, height + 0.6, 0]} center distanceFactor={8} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
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
function MarchingArmies({ cities, pendingCommands, forces, ports }: {
  cities: Record<string, City>;
  pendingCommands: Record<string, { cityId?: string; type: string; targetCityId?: string; troops?: number }>;
  forces: Record<string, { color: string }>;
  ports: Record<string, import('../../game/types').Port>;
}) {
  const armies = useMemo(() => {
    return Object.values(pendingCommands)
      .filter((cmd): cmd is { cityId: string; type: string; targetCityId: string; troops: number } =>
        cmd.type === 'march' && !!cmd.targetCityId && !!cmd.cityId)
      .map((cmd) => {
        const from = cities[cmd.cityId];
        const to = cities[cmd.targetCityId];
        if (!from || !to) return null;
        const force = forces[from.ownerForceId ?? ''];
        const hostile = to.ownerForceId !== from.ownerForceId;
        return { from, to, color: hostile ? '#b8442e' : (force?.color ?? '#d4a84a') };
      })
      .filter((a): a is NonNullable<typeof a> => !!a);
  }, [cities, pendingCommands, forces]);

  return (
    <group>
      {armies.map((a, i) => (
        <MarchingArmy key={i} from={a.from} to={a.to} color={a.color} ports={ports} />
      ))}
    </group>
  );
}

function MarchingArmy({ from, to, color, ports }: {
  from: City; to: City; color: string;
  ports: Record<string, import('../../game/types').Port>;
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

  // Build waypoint list — for land marches: [from, to] using Bezier mid.
  // For naval: [from, srcPort, dstPort, to] — 3 linear segments.
  const path = useMemo(() => {
    if (naval) {
      const [spx, spy] = pxToWorld(...geoToPixel(naval.srcPort.coords.lon, naval.srcPort.coords.lat));
      const [dpx, dpy] = pxToWorld(...geoToPixel(naval.dstPort.coords.lon, naval.dstPort.coords.lat));
      return {
        kind: 'naval' as const,
        pts: [[fx, fz], [spx, spy], [dpx, dpy], [tx, tz]] as Array<[number, number]>,
      };
    }
    // Land — same Bezier as roads
    const dx = tx - fx, dz = tz - fz;
    const len = Math.hypot(dx, dz);
    const perpX = -dz / len;
    const perpZ = dx / len;
    const seed = from.id < to.id ? from.id + to.id : to.id + from.id;
    const h = hashStr(seed);
    const sign = h < 0.5 ? -1 : 1;
    const amt = (0.10 + (h * 0.15)) * len * sign;
    return {
      kind: 'land' as const,
      mx: (fx + tx) / 2 + perpX * amt,
      mz: (fz + tz) / 2 + perpZ * amt,
    };
  }, [naval, from.id, to.id, fx, fz, tx, tz]);

  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = (clock.elapsedTime * 0.05) % 1;
    let x: number, z: number, heading: number;
    if (path.kind === 'land') {
      const { mx, mz } = path;
      const it = 1 - t;
      x = it * it * fx + 2 * it * t * mx + t * t * tx;
      z = it * it * fz + 2 * it * t * mz + t * t * tz;
      const tx_t = 2 * (1 - t) * (mx - fx) + 2 * t * (tx - mx);
      const tz_t = 2 * (1 - t) * (mz - fz) + 2 * t * (tz - mz);
      heading = Math.atan2(tx_t, tz_t);
    } else {
      // Naval — piecewise linear across 3 segments
      const segCount = path.pts.length - 1;
      const segT = t * segCount;
      const segIdx = Math.min(segCount - 1, Math.floor(segT));
      const localT = segT - segIdx;
      const [ax, az] = path.pts[segIdx];
      const [bx, bz] = path.pts[segIdx + 1];
      x = ax + (bx - ax) * localT;
      z = az + (bz - az) * localT;
      heading = Math.atan2(bx - ax, bz - az);
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

  return (
    <group ref={groupRef}>
      {FORMATION.map(([sx, sz], i) => (
        <Soldier key={i} dx={sx} dz={sz} color={color} phase={i * 0.6} isLeader={i === 0} />
      ))}
    </group>
  );
}

function Soldier({ dx, dz, color, phase, isLeader }: {
  dx: number; dz: number; color: string; phase: number; isLeader: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Walking bounce — different phase per soldier so they don't bob in sync
    groupRef.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 5 + phase)) * 0.04;
  });
  return (
    <group ref={groupRef} position={[dx, 0, dz]}>
      {/* Body — torso */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.10, 6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.155, 0]} castShadow>
        <sphereGeometry args={[0.028, 6, 6]} />
        <meshStandardMaterial color="#e0c498" roughness={0.75} />
      </mesh>
      {/* Spear (or banner pole) */}
      <mesh position={[0.03, 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.004, 0.004, 0.22, 4]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      {/* Leader gets a banner */}
      {isLeader && (
        <mesh position={[0.07, 0.20, 0]} castShadow>
          <planeGeometry args={[0.08, 0.05]} />
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
function Forts3D({ onFortClick }: { onFortClick: (fortId: string) => void }) {
  const forts = useGameStore((s) => s.forts);
  const forces = useGameStore((s) => s.forces);
  return (
    <group>
      {Object.values(forts).map((fort) => {
        const color = fort.ownerForceId ? (forces[fort.ownerForceId]?.color ?? '#5a4530') : '#5a4530';
        const [wx, wz] = pxToWorld(...geoToPixel(fort.coords.lon, fort.coords.lat));
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
      {/* Stone pier — flat slab — click target */}
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
      {/* Owner banner pole + flag */}
      <mesh position={[0.28, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.55, 4]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh position={[0.40, 0.50, 0]} castShadow>
        <planeGeometry args={[0.22, 0.15]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Small moored boat to signal "this is a port" */}
      <mesh position={[-0.28, 0.10, 0.20]} castShadow>
        <boxGeometry args={[0.30, 0.08, 0.10]} />
        <meshStandardMaterial color="#5a4530" roughness={0.85} />
      </mesh>
      <mesh position={[-0.28, 0.25, 0.20]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.32, 4]} />
        <meshStandardMaterial color="#3a2818" />
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

function MapScene({ overlayMode, onPortClick, onFortClick }: {
  overlayMode: OverlayMode;
  onPortClick: (portId: string) => void;
  onFortClick: (fortId: string) => void;
}) {
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const selectedCityId = useGameStore((s) => s.selectedCityId);
  const selectCity = useGameStore((s) => s.selectCity);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const portsForMarch = useGameStore((s) => s.ports);
  const weather = useGameStore((s) => s.weather);
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
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
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

      <Suspense fallback={null}>
        <MapTerrain />
      </Suspense>
      <Ocean />
      <RiverRibbons />
      <Forest3D />

      <Roads cities={cities} />
      <MarchingArmies cities={cities} pendingCommands={pendingCommands} forces={forces} ports={portsForMarch} />
      <Ports3D onPortClick={onPortClick} />
      <Forts3D onFortClick={onFortClick} />

      {Object.values(cities).map((city) => {
        const force = forces[city.ownerForceId ?? ''];
        const color = force?.color ?? NEUTRAL;
        const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
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
            onClick={() => selectCity(city.id)}
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

export function StrategicMap3D({ onSwitch2D }: { onSwitch2D: () => void }) {
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [selectedFortId, setSelectedFortId] = useState<string | null>(null);
  const [showStockadeBuild, setShowStockadeBuild] = useState(false);
  const weather = useGameStore((s) => s.weather);
  const season = useGameStore((s) => s.date.season) as Season;
  const t = useT();

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #88a0c0 0%, #c8b890 100%)',
    }}>
      {/* Toggle button */}
      <button
        onClick={onSwitch2D}
        style={{
          position: 'absolute', top: 12, left: 12, zIndex: 10,
          background: '#3a2818', color: '#f0e0b0',
          border: '1px solid #d4a84a',
          padding: '0.35rem 0.7rem', cursor: 'pointer',
          fontFamily: 'Songti SC, serif',
          boxShadow: '0 0 8px rgba(0,0,0,0.6)',
        }}
        title={t('切換為 2D 視圖', 'Switch to 2D view')}
      >{t('切換 2D', '2D View')} ⇄</button>

      {/* Objective tracker — top-left under the switch button */}
      <div style={{ position: 'absolute', top: 56, left: 12, zIndex: 10, pointerEvents: 'none' }}>
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
          title={t('建造壘寨 (300金，存續10季)', 'Build a stockade (300g, 10 seasons life)')}
        >{t('築壘', 'Build Stockade')}</button>
      </div>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, MAP_D * 0.9, MAP_D * 0.7], fov: 45 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <MapScene
            overlayMode={overlayMode}
            onPortClick={setSelectedPortId}
            onFortClick={setSelectedFortId}
          />
          <OrbitControls
            target={[0, 0, 0]}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={3}
            maxDistance={100}
            enableDamping
            dampingFactor={0.1}
          />
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
