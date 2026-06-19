/**
 * Geo-anchored city positions — THE single source of truth for where a
 * city sits on the 1000×720 strategic map.
 *
 * Every city has a real historical (lon, lat) — the modern equivalent
 * city or the well-known ruin site, lightly relaxed so close neighbours
 * (襄陽/樊城, 天水/上邽…) don't overlap on screen. `cityPixel` projects
 * it into the shared pixel space via the same calibration geography.ts
 * uses for mountains/rivers/coast, so city positions, terrain features
 * and the hex grid all agree.
 *
 * Used by BOTH the renderers (3D map) and the gameplay systems (march
 * duration, interception, sally, merges, territory cells) — what you see
 * is what the simulation computes. The painted-map coords in cities.ts
 * remain only as a fallback for ids missing here, and as the 2D map's
 * legacy layout.
 */
import { geoToPixel } from './geography';

/** Real historical positions. Values are modern (lon, lat). */
export const CITY_GEO_OVERRIDES: Record<string, [number, number]> = {
  'luoyang': [112.45, 34.65],
  'changan': [108.93, 34.27],
  'xuchang': [113.81, 34.04],
  'ye': [114.66, 36.5],
  'chengdu': [103.98, 30.53],
  'jianye': [118.71, 32.3],
  'wuchang': [114.28, 30.53],
  'jiangling': [112.24, 30.47],
  'xiangyang': [112.2, 31.74],
  'hanzhong': [107.08, 33.06],
  'shouchun': [116.79, 32.58],   // 壽春=壽縣,淮河邊、合肥正北(原 31.93 偏南)
  'hefei': [117.24, 31.87],
  'chaisang': [116, 29.71],
  'yongan': [109.41, 31.03],
  'jiangxia': [114.67, 30.97],
  'pengcheng': [117.22, 34.28],
  'xiaopei': [116.94, 34.73],   // 小沛=沛縣,在徐州(彭城)正北(原 33.95 放到了南邊)
  'xiapi': [117.95, 34.3],
  'bohai': [117.5, 37.5],
  'pingyuan': [116.43, 37.16],
  'beiping': [116.46, 40.17],
  'taiyuan': [112.55, 37.87],
  'yanmen': [112.95, 39.5],
  'shangdang': [112.89, 36.1],
  'guandu': [113.99, 34.65],
  'hulao': [112.99, 34.79],
  'wuwei': [102.64, 37.93],
  'jincheng': [103.83, 36.06],
  'longxi': [104.62, 35],
  'tianshui': [105.42, 34.24],
  'anding': [107.2, 35.68],   // 安定郡治臨涇=鎮原(原 105.65,36.55 偏西北)
  'shuofang': [107.42, 40.79],
  'yangping': [106.56, 33.14],
  'changsha': [112.94, 28.23],
  'lingling': [111.62, 26.43],
  'guiyang': [112.39, 25.78],
  'wuling': [111.69, 29.13],
  'jiaozhi': [105.85, 21.03],
  'hepu': [109.2, 21.69],
  'cangwu': [111.32, 23.48],
  'nanhai': [113.27, 23.13],
  'jianning': [102.73, 24.99],
  'baxi': [105.97, 31.77],
  'jiangzhou': [106.55, 29.56],
  'lujiang': [117.3, 31.21],
  'danyang': [118.88, 31.69],
  'kuaiji': [120.58, 30],
  'liaodong': [121.5, 41],
  'xiangping': [122.5, 41.1],
  'wuhuan': [120, 42],
  'yuyang': [116.94, 40.44],
  'yi-county': [115.5, 39.35],
  'dunhuang': [96.2, 40.14],
  'jiuquan': [98.51, 39.74],
  'wudu': [105.16, 33.39],
  'shanggui': [105.8, 34.67],
  'chencang': [107.33, 34.39],
  'tongguan': [110.27, 34.55],
  'wuguan': [110.42, 33.86],
  'mei': [107.84, 34.26],
  'puyang': [115.06, 35.72],
  'chenliu': [114.51, 34.67],
  'nanpi': [116.7, 38.04],
  'boling': [115.51, 38.23],
  'linzi': [118.31, 36.84],
  'langya': [118.36, 35.1],
  'guangling': [119.42, 32.39],
  'runan': [114.65, 32.95],
  'wancheng': [112.75, 32.99],
  'bowang': [112.34, 33.38],
  'xinye': [112.41, 32.51],
  'fancheng': [111.92, 32.28],
  'shangyong': [110.23, 32.22],
  'xincheng': [110.78, 32.13],
  'xiling': [111.35, 31.1],
  'yiling': [111.01, 30.61],
  'xiaoting': [111.38, 30.16],
  'maicheng': [112.1, 31.1],
  'wuxi': [120.12, 31.85],   // 無錫 — Taihu north shore (was mislabelled at 巫溪 in the gorges)
  'yinping': [104.68, 32.95],
  'baqiu': [113.13, 29.36],
  'poyang': [116.69, 29],
  'yuzhang': [115.89, 28.68],
  'luling': [114.99, 27.11],
  'wu': [120.62, 31.3],
  'linhai': [121.13, 28.85],
  'guilin': [110.3, 25.27],
  'beihai': [118.82, 36.7],
  'nanzhong': [102.48, 25.55],
  'yongchang': [99.16, 25.12],
  'yunnan': [101.25, 25.5],
  'yuexi': [102.27, 27.9],
  'hukou': [113.41, 36.1],
  // ── cities that previously fell back to painted-map pixels ──
  'jieting': [106.19, 35.11],   // 街亭(=壘)
  'mianzhu': [104.14, 31.51],   // 綿竹(=壘)
  'ruxu': [117.72, 31.63],   // 濡須(≈濡須塢)
  'jiameng': [106.02, 32.42],   // 葭萌
  'zitong': [105.19, 31.65],   // 梓潼
  'fucheng': [104.68, 31.47],   // 涪城
  'luocheng': [104.39, 30.94],   // 雒城
  'jianmen': [105.54, 32.14],   // 劍閣
  'ji': [116.25, 39.58],   // 薊(北京)
  'liucheng': [120.45, 41.57],   // 柳城
  'yunzhong': [111.2, 40.27],   // 雲中
  'wuyuan': [109.99, 40.6],   // 五原
  'wan': [116.58, 30.63],   // 皖城
  'gongan': [112.26, 29.82],   // 公安
  'lelang': [124.3, 39.02],   // 樂浪(贴东缘)
  'daifang': [124.1, 38.3],   // 帶方(贴东缘)
  'zhuyai': [110.35, 20.05],   // 朱崖(海南)
  'jiuzhen': [105.78, 19.8],   // 九真
  'rinan': [107.6, 17.3],   // 日南(贴南缘)
  'sanguan': [106.81, 34.29],   // 散關
  'baishuiguan': [105.22, 32.65],   // 白水關
  'xiaoguan': [106.28, 36],   // 蕭關
  'chibi': [113.93, 29.72],   // 赤壁
  'changban': [111.73, 30.65],   // 長阪坡
  'baima': [114.66, 35.29],   // 白馬
  'yanjin': [114.12, 35.27],   // 延津
  'liyang': [114.46, 35.9],   // 黎陽
  // ── 三國志標配補城 ──
  'qiao': [115.78, 33.84],      // 譙(亳州,曹操故鄉、沛國治)
  'changshan': [114.57, 38.14], // 常山(真定/正定,趙雲故鄉)
  'xindu': [115.58, 37.55],     // 信都(冀州治,袁紹據點)
  'zhongshan': [114.99, 38.52], // 中山(盧奴/定州)
  'zhangye': [100.45, 38.93],   // 張掖(河西走廊)
  'qianwei': [103.9, 30.0],     // 犍為(武陽,益州南)
  'juyongguan': [116.07, 40.29],// 居庸關(薊北門戶,禦烏桓/鮮卑)
  'hanguguan': [110.87, 34.62], // 函谷關(洛陽西、潼關東)
};

/** Pixel coords for a city, preferring the geographic override.
 *  Falls back to the supplied painted-map pixel coords. */
export function cityPixel(cityId: string, fallbackX: number, fallbackY: number): [number, number] {
  const geo = CITY_GEO_OVERRIDES[cityId];
  if (geo) return geoToPixel(geo[0], geo[1]);
  return [fallbackX, fallbackY];
}

/** Convenience: the geo-anchored map position of a city object. */
export function cityPos(city: { id: string; coords: { x: number; y: number } }): { x: number; y: number } {
  const [x, y] = cityPixel(city.id, city.coords.x, city.coords.y);
  return { x, y };
}
