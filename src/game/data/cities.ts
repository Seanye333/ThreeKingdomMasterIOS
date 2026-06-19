import type { City } from '../types';
import { terrainMarchCost, WORLD_SCALE } from './geography';
import { cityPos } from './cityGeo';

/** RTK14-style terrain category for each city. Pure-display today. */
export type Terrain =
  | 'plain'    // 平原 — fertile lowland (default)
  | 'mountain' // 山地 — mountainous, hard to attack
  | 'forest'   // 山林 — wooded hills
  | 'water'    // 水郷 — riverine / lakeside
  | 'desert'   // 砂漠 — arid frontier
  | 'wetland'  // 湿地 — marshy lowland
  | 'pass';    // 關 — narrow chokepoint

export const TERRAIN_DEFS: Record<Terrain, { zh: string; en: string; color: string }> = {
  plain:    { zh: '平原', en: 'Plain',    color: '#a8c87a' },
  mountain: { zh: '山地', en: 'Mountain', color: '#7a5a3a' },
  forest:   { zh: '山林', en: 'Forest',   color: '#5a7a3a' },
  water:    { zh: '水郷', en: 'Riverine', color: '#88b7e8' },
  desert:   { zh: '砂漠', en: 'Desert',   color: '#c19a3b' },
  wetland:  { zh: '湿地', en: 'Wetland',  color: '#5a8a7a' },
  pass:     { zh: '關',   en: 'Pass',     color: '#a8442e' },
};

interface CityTemplate {
  id: string;
  name: { en: string; zh: string };
  coords: { x: number; y: number };
  adjacentCityIds: string[];
  /** Terrain category — affects display + future combat modifiers. */
  terrain?: Terrain;
  /** River/sea port — unlocks naval movement to other ports. */
  port?: boolean;
  base: {
    population: number;
    gold: number;
    food: number;
    troops: number;
    agriculture: number;
    commerce: number;
    defense: number;
    loyalty: number;
  };
}

// Coordinates target a 1000 × 720 canvas, mapped to Han-dynasty China.
const CITY_TEMPLATES: CityTemplate[] = [
  // ── Far north / Liaodong corridor ──
  {
    id: 'liaodong',
    name: { en: 'Liaodong', zh: '遼東' },
    coords: { x: 795, y: 195 },
    adjacentCityIds: ['beiping', 'wuhuan', 'xiangping', 'liucheng'],
    base: { population: 100_000, gold: 1500, food: 40_000, troops: 6000, agriculture: 30, commerce: 25, defense: 60, loyalty: 70 },
  },
  {
    id: 'beiping',
    name: { en: 'Beiping', zh: '北平' },
    coords: { x: 705, y: 225 },
    adjacentCityIds: ['liaodong', 'yanmen', 'bohai', 'ye', 'pingyuan', 'yi-county', 'wuhuan', 'yuyang', 'ji', 'liucheng'],
    base: { population: 180_000, gold: 3000, food: 60_000, troops: 12_000, agriculture: 40, commerce: 35, defense: 55, loyalty: 75 },
  },
  {
    id: 'yanmen',
    name: { en: 'Yanmen', zh: '雁門' },
    coords: { x: 570, y: 215 },
    adjacentCityIds: ['beiping', 'taiyuan', 'shangdang', 'yuyang', 'shuofang', 'yunzhong'],
    base: { population: 90_000, gold: 1500, food: 40_000, troops: 7000, agriculture: 35, commerce: 30, defense: 65, loyalty: 60 },
  },
  {
    id: 'taiyuan',
    name: { en: 'Taiyuan', zh: '太原' },
    coords: { x: 555, y: 250 },
    adjacentCityIds: ['yanmen', 'changan', 'luoyang', 'ye', 'shangdang', 'hukou'],
    base: { population: 130_000, gold: 2500, food: 55_000, troops: 10_000, agriculture: 50, commerce: 45, defense: 60, loyalty: 60 },
  },
  {
    id: 'ye',
    name: { en: 'Ye', zh: '鄴' },
    coords: { x: 615, y: 280 },
    adjacentCityIds: ['beiping', 'taiyuan', 'luoyang', 'xuchang', 'pengcheng', 'bohai', 'pingyuan', 'shangdang', 'guandu', 'hulao', 'baima', 'yanjin', 'liyang', 'puyang'],
    base: { population: 280_000, gold: 6000, food: 110_000, troops: 22_000, agriculture: 75, commerce: 65, defense: 70, loyalty: 80 },
  },
  {
    id: 'bohai',
    name: { en: 'Bohai', zh: '渤海' },
    coords: { x: 730, y: 270 },
    adjacentCityIds: ['beiping', 'ye', 'beihai', 'pengcheng', 'pingyuan', 'linzi', 'nanpi', 'liyang'],
    port: true,
    base: { population: 150_000, gold: 3000, food: 65_000, troops: 11_000, agriculture: 55, commerce: 60, defense: 50, loyalty: 70 },
  },
  {
    id: 'beihai',
    name: { en: 'Beihai', zh: '北海' },
    coords: { x: 815, y: 295 },
    adjacentCityIds: ['bohai', 'pengcheng', 'pingyuan', 'linzi', 'langya'],
    base: { population: 120_000, gold: 2500, food: 55_000, troops: 9000, agriculture: 60, commerce: 60, defense: 45, loyalty: 75 },
  },

  // ── Western frontier (Liang) ──
  {
    id: 'wuwei',
    name: { en: 'Wuwei', zh: '武威' },
    coords: { x: 295, y: 285 },
    adjacentCityIds: ['jincheng', 'jiuquan', 'longxi'],
    terrain: 'desert',
    base: { population: 90_000, gold: 1500, food: 40_000, troops: 7000, agriculture: 35, commerce: 30, defense: 60, loyalty: 55 },
  },
  {
    id: 'jincheng',
    name: { en: 'Jincheng', zh: '金城' },
    coords: { x: 365, y: 320 },
    adjacentCityIds: ['wuwei', 'changan', 'anding', 'wudu', 'longxi'],
    base: { population: 80_000, gold: 1000, food: 35_000, troops: 5000, agriculture: 25, commerce: 20, defense: 50, loyalty: 50 },
  },

  // ── Sili (capital region) ──
  {
    id: 'changan',
    name: { en: "Chang'an", zh: '長安' },
    coords: { x: 460, y: 360 },
    adjacentCityIds: ['jincheng', 'taiyuan', 'luoyang', 'hanzhong', 'anding', 'tongguan', 'mei', 'wuguan', 'chencang', 'tianshui', 'xiaoguan'],
    base: { population: 220_000, gold: 5500, food: 95_000, troops: 18_000, agriculture: 65, commerce: 70, defense: 80, loyalty: 60 },
  },
  {
    id: 'luoyang',
    name: { en: 'Luoyang', zh: '洛陽' },
    coords: { x: 555, y: 350 },
    adjacentCityIds: ['taiyuan', 'changan', 'ye', 'xuchang', 'wancheng', 'chenliu', 'shangdang', 'tongguan', 'hulao', 'guandu'],
    base: { population: 320_000, gold: 8000, food: 100_000, troops: 25_000, agriculture: 70, commerce: 85, defense: 85, loyalty: 50 },
  },

  // ── Yu / Yan provinces (central plain) ──
  {
    id: 'xuchang',
    name: { en: 'Xuchang', zh: '許昌' },
    coords: { x: 635, y: 395 },
    adjacentCityIds: ['luoyang', 'ye', 'wancheng', 'runan', 'pengcheng', 'chenliu', 'guandu', 'shouchun'],
    base: { population: 200_000, gold: 4500, food: 80_000, troops: 16_000, agriculture: 70, commerce: 60, defense: 50, loyalty: 70 },
  },
  {
    id: 'pengcheng',
    name: { en: 'Pengcheng', zh: '彭城' },
    coords: { x: 695, y: 375 },
    adjacentCityIds: ['ye', 'bohai', 'beihai', 'xuchang', 'xiapi', 'shouchun', 'chenliu', 'puyang', 'langya', 'xiaopei'],
    base: { population: 170_000, gold: 3500, food: 70_000, troops: 13_000, agriculture: 60, commerce: 55, defense: 45, loyalty: 70 },
  },
  {
    id: 'xiapi',
    name: { en: 'Xiapi', zh: '下邳' },
    coords: { x: 735, y: 385 },
    adjacentCityIds: ['pengcheng', 'shouchun', 'hefei', 'langya', 'guangling', 'xiaopei'],
    base: { population: 150_000, gold: 3000, food: 65_000, troops: 11_000, agriculture: 65, commerce: 55, defense: 50, loyalty: 70 },
  },
  {
    id: 'runan',
    name: { en: 'Runan', zh: '汝南' },
    coords: { x: 635, y: 425 },
    adjacentCityIds: ['xuchang', 'wancheng', 'shouchun', 'xinye'],
    base: { population: 200_000, gold: 4000, food: 90_000, troops: 14_000, agriculture: 70, commerce: 60, defense: 50, loyalty: 70 },
  },

  // ── Yi province (Sichuan) ──
  {
    id: 'hanzhong',
    name: { en: 'Hanzhong', zh: '漢中' },
    coords: { x: 455, y: 405 },
    adjacentCityIds: ['changan', 'chengdu', 'wancheng', 'xiangyang', 'anding', 'wudu', 'mei', 'yangping', 'shangyong', 'baxi', 'yinping', 'xincheng', 'jiameng', 'sanguan'],
    terrain: 'mountain',
    base: { population: 120_000, gold: 2000, food: 60_000, troops: 8000, agriculture: 60, commerce: 40, defense: 70, loyalty: 75 },
  },
  {
    id: 'wancheng',
    name: { en: 'Wancheng', zh: '宛城' },
    coords: { x: 555, y: 425 },
    adjacentCityIds: ['luoyang', 'xuchang', 'runan', 'hanzhong', 'xinye', 'lujiang', 'wuguan', 'shangyong', 'fancheng', 'xiangyang'],
    base: { population: 160_000, gold: 3500, food: 70_000, troops: 12_000, agriculture: 65, commerce: 55, defense: 50, loyalty: 70 },
  },
  {
    id: 'xinye',
    name: { en: 'Xinye', zh: '新野' },
    coords: { x: 580, y: 440 },
    adjacentCityIds: ['wancheng', 'runan', 'xiangyang', 'bowang', 'changban'],
    base: { population: 80_000, gold: 1500, food: 40_000, troops: 6000, agriculture: 55, commerce: 40, defense: 45, loyalty: 75 },
  },
  {
    id: 'chengdu',
    name: { en: 'Chengdu', zh: '成都' },
    coords: { x: 350, y: 415 },
    adjacentCityIds: ['hanzhong', 'yongan', 'jiangzhou', 'nanzhong', 'yangping', 'baxi', 'luocheng', 'mianzhu'],
    terrain: 'mountain',
    base: { population: 260_000, gold: 5500, food: 130_000, troops: 16_000, agriculture: 85, commerce: 50, defense: 75, loyalty: 80 },
  },
  {
    id: 'yongan',
    name: { en: "Yong'an", zh: '永安' },
    coords: { x: 510, y: 440 },
    adjacentCityIds: ['chengdu', 'xiangyang', 'jiangzhou', 'yiling', 'xiaoting'],
    port: true,
    base: { population: 100_000, gold: 1500, food: 50_000, troops: 7000, agriculture: 55, commerce: 30, defense: 70, loyalty: 75 },
  },

  // ── Jing province (south Han) ──
  {
    id: 'xiangyang',
    name: { en: 'Xiangyang', zh: '襄陽' },
    coords: { x: 590, y: 420 },
    adjacentCityIds: ['hanzhong', 'wancheng', 'xinye', 'yongan', 'jiangxia', 'changsha', 'wuling', 'jiangling', 'maicheng', 'shangyong', 'fancheng', 'bowang', 'changban'],
    base: { population: 230_000, gold: 5000, food: 100_000, troops: 18_000, agriculture: 75, commerce: 65, defense: 65, loyalty: 75 },
  },
  {
    id: 'jiangxia',
    name: { en: 'Jiangxia', zh: '江夏' },
    coords: { x: 640, y: 465 },
    adjacentCityIds: ['xiangyang', 'yuzhang', 'changsha', 'jiangling', 'wuchang', 'chibi'],
    terrain: 'water',
    port: true,
    base: { population: 150_000, gold: 3000, food: 70_000, troops: 11_000, agriculture: 65, commerce: 55, defense: 50, loyalty: 70 },
  },

  // ── Yang province (Yangtze) ──
  {
    id: 'shouchun',
    name: { en: 'Shouchun', zh: '壽春' },
    coords: { x: 685, y: 410 },
    adjacentCityIds: ['xuchang', 'pengcheng', 'xiapi', 'runan', 'hefei', 'jianye', 'lujiang', 'guangling', 'xiaopei', 'danyang'],
    base: { population: 200_000, gold: 4500, food: 95_000, troops: 18_000, agriculture: 70, commerce: 60, defense: 55, loyalty: 65 },
  },
  {
    id: 'hefei',
    name: { en: 'Hefei', zh: '合肥' },
    coords: { x: 720, y: 425 },
    adjacentCityIds: ['xiapi', 'shouchun', 'jianye', 'lujiang', 'ruxu'],
    port: true,
    base: { population: 130_000, gold: 2500, food: 60_000, troops: 10_000, agriculture: 60, commerce: 55, defense: 60, loyalty: 65 },
  },
  {
    id: 'jianye',
    name: { en: 'Jianye', zh: '建業' },
    coords: { x: 745, y: 430 },
    adjacentCityIds: ['shouchun', 'hefei', 'wu', 'yuzhang', 'wuxi', 'wuchang', 'guangling', 'danyang', 'ruxu'],
    terrain: 'water',
    port: true,
    base: { population: 180_000, gold: 4000, food: 85_000, troops: 14_000, agriculture: 65, commerce: 60, defense: 50, loyalty: 70 },
  },
  {
    id: 'wu',
    name: { en: 'Wu', zh: '吳郡' },
    coords: { x: 780, y: 445 },
    adjacentCityIds: ['jianye', 'wuxi', 'linhai', 'kuaiji', 'danyang'],
    terrain: 'water',
    port: true,
    base: { population: 140_000, gold: 3000, food: 70_000, troops: 10_000, agriculture: 70, commerce: 65, defense: 40, loyalty: 70 },
  },
  {
    id: 'yuzhang',
    name: { en: 'Yuzhang', zh: '豫章' },
    coords: { x: 700, y: 490 },
    adjacentCityIds: ['jianye', 'jiangxia', 'changsha', 'chaisang', 'poyang', 'luling'],
    base: { population: 120_000, gold: 2500, food: 60_000, troops: 9000, agriculture: 65, commerce: 50, defense: 45, loyalty: 70 },
  },

  // ── Far south ──
  {
    id: 'changsha',
    name: { en: 'Changsha', zh: '長沙' },
    coords: { x: 615, y: 520 },
    adjacentCityIds: ['xiangyang', 'jiangxia', 'yuzhang', 'lingling', 'wuling', 'guiyang', 'baqiu'],
    base: { population: 160_000, gold: 3500, food: 80_000, troops: 12_000, agriculture: 70, commerce: 55, defense: 50, loyalty: 70 },
  },
  {
    id: 'lingling',
    name: { en: 'Lingling', zh: '零陵' },
    coords: { x: 595, y: 555 },
    adjacentCityIds: ['changsha', 'jiaozhi', 'guiyang', 'hepu', 'cangwu', 'guilin'],
    base: { population: 90_000, gold: 1500, food: 50_000, troops: 7000, agriculture: 60, commerce: 40, defense: 45, loyalty: 65 },
  },
  {
    id: 'jiaozhi',
    name: { en: 'Jiaozhi', zh: '交趾' },
    coords: { x: 480, y: 570 },
    adjacentCityIds: ['lingling', 'nanhai', 'hepu', 'cangwu', 'jiuzhen'],
    terrain: 'wetland',
    port: true,
    base: { population: 90_000, gold: 1500, food: 50_000, troops: 6000, agriculture: 60, commerce: 45, defense: 35, loyalty: 55 },
  },

  // ── New cities (Phase 12) ──
  {
    id: 'chenliu',
    name: { en: 'Chenliu', zh: '陳留' },
    coords: { x: 645, y: 365 },
    adjacentCityIds: ['luoyang', 'xuchang', 'pengcheng', 'guandu', 'hulao', 'puyang'],
    base: { population: 170_000, gold: 3500, food: 75_000, troops: 13_000, agriculture: 65, commerce: 60, defense: 50, loyalty: 70 },
  },
  {
    id: 'pingyuan',
    name: { en: 'Pingyuan', zh: '平原' },
    coords: { x: 735, y: 295 },
    adjacentCityIds: ['beiping', 'bohai', 'beihai', 'ye', 'linzi', 'boling'],
    port: true,
    base: { population: 140_000, gold: 2500, food: 60_000, troops: 10_000, agriculture: 55, commerce: 50, defense: 45, loyalty: 70 },
  },
  {
    id: 'anding',
    name: { en: 'Anding', zh: '安定' },
    coords: { x: 410, y: 345 },
    adjacentCityIds: ['jincheng', 'changan', 'hanzhong', 'wudu', 'mei', 'tianshui', 'longxi', 'shuofang', 'xiaoguan'],
    base: { population: 100_000, gold: 1800, food: 45_000, troops: 7500, agriculture: 45, commerce: 35, defense: 60, loyalty: 60 },
  },
  {
    id: 'shangdang',
    name: { en: 'Shangdang', zh: '上黨' },
    coords: { x: 565, y: 295 },
    adjacentCityIds: ['yanmen', 'taiyuan', 'luoyang', 'ye', 'hukou'],
    base: { population: 110_000, gold: 2000, food: 50_000, troops: 8500, agriculture: 50, commerce: 40, defense: 60, loyalty: 60 },
  },
  {
    id: 'wuling',
    name: { en: 'Wuling', zh: '武陵' },
    coords: { x: 565, y: 500 },
    adjacentCityIds: ['xiangyang', 'changsha', 'jiangling', 'gongan', 'baqiu'],
    base: { population: 110_000, gold: 2000, food: 55_000, troops: 8000, agriculture: 60, commerce: 45, defense: 45, loyalty: 70 },
  },
  {
    id: 'guiyang',
    name: { en: 'Guiyang', zh: '桂陽' },
    coords: { x: 640, y: 545 },
    adjacentCityIds: ['changsha', 'lingling', 'nanhai', 'guilin'],
    base: { population: 90_000, gold: 1500, food: 50_000, troops: 7000, agriculture: 55, commerce: 45, defense: 40, loyalty: 65 },
  },
  {
    id: 'nanhai',
    name: { en: 'Nanhai', zh: '南海' },
    coords: { x: 649, y: 572 },
    adjacentCityIds: ['guiyang', 'hepu', 'jiaozhi', 'cangwu', 'zhuyai'],
    terrain: 'water',
    port: true,
    base: { population: 100_000, gold: 2000, food: 50_000, troops: 7000, agriculture: 55, commerce: 55, defense: 35, loyalty: 60 },
  },
  {
    id: 'hepu',
    name: { en: 'Hepu', zh: '合浦' },
    coords: { x: 547, y: 591 },
    adjacentCityIds: ['lingling', 'nanhai', 'jiaozhi', 'cangwu', 'guilin', 'zhuyai'],
    terrain: 'water',
    port: true,
    base: { population: 80_000, gold: 1500, food: 45_000, troops: 6000, agriculture: 55, commerce: 50, defense: 35, loyalty: 60 },
  },
  {
    id: 'wudu',
    name: { en: 'Wudu', zh: '武都' },
    coords: { x: 370, y: 395 },
    adjacentCityIds: ['jincheng', 'anding', 'hanzhong', 'jiangzhou', 'tianshui', 'yinping', 'baishuiguan'],
    base: { population: 85_000, gold: 1500, food: 45_000, troops: 6500, agriculture: 50, commerce: 30, defense: 65, loyalty: 65 },
  },
  {
    id: 'jiangzhou',
    name: { en: 'Jiangzhou', zh: '江州' },
    coords: { x: 425, y: 445 },
    adjacentCityIds: ['chengdu', 'yongan', 'wudu', 'baxi', 'yinping', 'fucheng'],
    base: { population: 110_000, gold: 2000, food: 60_000, troops: 8000, agriculture: 60, commerce: 40, defense: 60, loyalty: 70 },
  },

  // ── Phase 18 cities (battlefields and key chokepoints) ──
  {
    id: 'guandu',
    name: { en: 'Guandu', zh: '官渡' },
    coords: { x: 605, y: 335 },
    adjacentCityIds: ['xuchang', 'ye', 'luoyang', 'chenliu', 'puyang'],
    base: { population: 80_000, gold: 1500, food: 50_000, troops: 8000, agriculture: 55, commerce: 45, defense: 65, loyalty: 65 },
  },
  {
    id: 'hulao',
    name: { en: 'Hulao Pass', zh: '虎牢關' },
    coords: { x: 540, y: 350 },
    adjacentCityIds: ['luoyang', 'ye', 'chenliu'],
    terrain: 'pass',
    base: { population: 50_000, gold: 1200, food: 35_000, troops: 7000, agriculture: 40, commerce: 35, defense: 85, loyalty: 65 },
  },
  {
    id: 'tongguan',
    name: { en: 'Tongguan', zh: '潼關' },
    coords: { x: 510, y: 360 },
    adjacentCityIds: ['changan', 'luoyang'],
    terrain: 'pass',
    base: { population: 55_000, gold: 1200, food: 40_000, troops: 7000, agriculture: 45, commerce: 40, defense: 88, loyalty: 65 },
  },
  {
    id: 'jiangling',
    name: { en: 'Jiangling', zh: '江陵' },
    coords: { x: 590, y: 460 },
    adjacentCityIds: ['xiangyang', 'jiangxia', 'wuling', 'yiling', 'maicheng', 'chaisang', 'baqiu', 'xiling', 'gongan', 'chibi', 'changban'],
    terrain: 'water',
    port: true,
    base: { population: 160_000, gold: 3500, food: 80_000, troops: 13_000, agriculture: 70, commerce: 60, defense: 55, loyalty: 72 },
  },
  {
    id: 'linzi',
    name: { en: 'Linzi', zh: '臨淄' },
    coords: { x: 785, y: 320 },
    adjacentCityIds: ['bohai', 'beihai', 'pingyuan', 'langya'],
    base: { population: 150_000, gold: 3200, food: 65_000, troops: 11_000, agriculture: 60, commerce: 65, defense: 50, loyalty: 72 },
  },
  {
    id: 'lujiang',
    name: { en: 'Lujiang', zh: '廬江' },
    coords: { x: 670, y: 445 },
    adjacentCityIds: ['wancheng', 'shouchun', 'hefei', 'chaisang', 'danyang', 'ruxu', 'wan'],
    base: { population: 120_000, gold: 2500, food: 60_000, troops: 9000, agriculture: 60, commerce: 50, defense: 55, loyalty: 70 },
  },
  {
    id: 'mei',
    name: { en: 'Mei', zh: '郿' },
    coords: { x: 465, y: 375 },
    adjacentCityIds: ['changan', 'anding', 'hanzhong', 'sanguan'],
    base: { population: 70_000, gold: 1500, food: 45_000, troops: 7000, agriculture: 50, commerce: 40, defense: 75, loyalty: 60 },
  },
  {
    id: 'wuxi',
    name: { en: 'Wuxi', zh: '無錫' },
    coords: { x: 765, y: 450 },
    adjacentCityIds: ['jianye', 'wu'],
    base: { population: 110_000, gold: 2500, food: 55_000, troops: 8500, agriculture: 65, commerce: 60, defense: 45, loyalty: 70 },
  },

  // ── Phase 22 cities ──
  {
    id: 'yiling',
    name: { en: 'Yiling', zh: '夷陵' },
    coords: { x: 575, y: 480 },
    adjacentCityIds: ['yongan', 'jiangling', 'xiling', 'xiaoting'],
    base: { population: 80_000, gold: 1500, food: 45_000, troops: 7000, agriculture: 55, commerce: 40, defense: 70, loyalty: 70 },
  },
  {
    id: 'maicheng',
    name: { en: 'Maicheng', zh: '麥城' },
    coords: { x: 605, y: 460 },
    adjacentCityIds: ['xiangyang', 'jiangling'],
    base: { population: 60_000, gold: 1200, food: 35_000, troops: 5500, agriculture: 50, commerce: 35, defense: 60, loyalty: 65 },
  },
  {
    id: 'nanpi',
    name: { en: 'Nanpi', zh: '南皮' },
    coords: { x: 690, y: 260 },
    adjacentCityIds: ['bohai'],
    base: { population: 100_000, gold: 2000, food: 50_000, troops: 8000, agriculture: 55, commerce: 50, defense: 60, loyalty: 70 },
  },
  {
    id: 'wuchang',
    name: { en: 'Wuchang', zh: '武昌' },
    coords: { x: 665, y: 475 },
    adjacentCityIds: ['jianye', 'jiangxia', 'chaisang', 'chibi'],
    terrain: 'water',
    port: true,
    base: { population: 160_000, gold: 3500, food: 80_000, troops: 13_000, agriculture: 70, commerce: 65, defense: 60, loyalty: 75 },
  },
  {
    id: 'yi-county',
    name: { en: 'Yi County', zh: '易縣' },
    coords: { x: 690, y: 240 },
    adjacentCityIds: ['beiping', 'wuhuan', 'yuyang', 'ji'],
    base: { population: 70_000, gold: 1500, food: 40_000, troops: 7000, agriculture: 45, commerce: 35, defense: 75, loyalty: 65 },
  },
  {
    id: 'nanzhong',
    name: { en: 'Nanzhong', zh: '南中' },
    coords: { x: 275, y: 485 },
    adjacentCityIds: ['chengdu', 'yuexi', 'jianning'],
    base: { population: 90_000, gold: 1500, food: 50_000, troops: 7000, agriculture: 50, commerce: 35, defense: 60, loyalty: 55 },
  },

  // ── Phase 23 cities ──
  {
    id: 'yangping',
    name: { en: 'Yangping Pass', zh: '陽平關' },
    coords: { x: 415, y: 395 },
    adjacentCityIds: ['hanzhong', 'chengdu', 'baxi', 'chencang', 'jiameng'],
    terrain: 'pass',
    base: { population: 55_000, gold: 1200, food: 35_000, troops: 6500, agriculture: 45, commerce: 30, defense: 85, loyalty: 70 },
  },
  {
    id: 'shangyong',
    name: { en: 'Shangyong', zh: '上庸' },
    coords: { x: 530, y: 425 },
    adjacentCityIds: ['hanzhong', 'xiangyang', 'wancheng', 'xincheng'],
    base: { population: 90_000, gold: 1800, food: 50_000, troops: 8000, agriculture: 55, commerce: 40, defense: 65, loyalty: 65 },
  },
  {
    id: 'wuguan',
    name: { en: 'Wuguan', zh: '武關' },
    coords: { x: 525, y: 395 },
    adjacentCityIds: ['changan', 'wancheng', 'chencang'],
    terrain: 'pass',
    base: { population: 55_000, gold: 1200, food: 35_000, troops: 6500, agriculture: 45, commerce: 35, defense: 80, loyalty: 65 },
  },
  {
    id: 'hukou',
    name: { en: 'Hukou', zh: '壺關' },
    coords: { x: 545, y: 305 },
    adjacentCityIds: ['taiyuan', 'shangdang'],
    base: { population: 60_000, gold: 1300, food: 38_000, troops: 6800, agriculture: 45, commerce: 35, defense: 80, loyalty: 65 },
  },
  {
    id: 'boling',
    name: { en: 'Boling', zh: '博陵' },
    coords: { x: 660, y: 275 },
    adjacentCityIds: ['pingyuan'],
    base: { population: 90_000, gold: 1700, food: 45_000, troops: 7500, agriculture: 50, commerce: 45, defense: 50, loyalty: 70 },
  },
  {
    id: 'linhai',
    name: { en: 'Linhai', zh: '臨海' },
    coords: { x: 784, y: 504 },
    adjacentCityIds: ['wu', 'kuaiji'],
    terrain: 'water',
    port: true,
    base: { population: 80_000, gold: 1500, food: 45_000, troops: 6500, agriculture: 55, commerce: 50, defense: 40, loyalty: 70 },
  },

  // ── Phase 36 — Nanman southern frontier (added for 225 Southern Campaign) ──
  {
    id: 'yuexi',
    name: { en: 'Yuexi', zh: '越巂' },
    coords: { x: 320, y: 455 },
    adjacentCityIds: ['nanzhong', 'jianning'],
    base: { population: 55_000, gold: 800, food: 28_000, troops: 4500, agriculture: 35, commerce: 20, defense: 55, loyalty: 45 },
  },
  {
    id: 'jianning',
    name: { en: 'Jianning', zh: '建寧' },
    coords: { x: 320, y: 490 },
    adjacentCityIds: ['nanzhong', 'yuexi', 'yunnan'],
    base: { population: 80_000, gold: 1100, food: 38_000, troops: 6500, agriculture: 40, commerce: 25, defense: 60, loyalty: 45 },
  },
  {
    id: 'yunnan',
    name: { en: 'Yunnan', zh: '雲南' },
    coords: { x: 240, y: 480 },
    adjacentCityIds: ['jianning', 'yongchang'],
    base: { population: 50_000, gold: 700, food: 25_000, troops: 4000, agriculture: 35, commerce: 20, defense: 50, loyalty: 45 },
  },
  {
    id: 'yongchang',
    name: { en: 'Yongchang', zh: '永昌' },
    coords: { x: 185, y: 470 },
    adjacentCityIds: ['yunnan'],
    base: { population: 45_000, gold: 600, food: 22_000, troops: 3500, agriculture: 30, commerce: 18, defense: 45, loyalty: 50 },
  },

  // ── Phase 36 — Wuhuan / Xianbei frontier (north of Beiping) ──
  {
    id: 'wuhuan',
    name: { en: 'Wuhuan', zh: '烏丸' },
    coords: { x: 770, y: 180 },
    adjacentCityIds: ['liaodong', 'yi-county', 'beiping', 'ji', 'liucheng'],
    base: { population: 50_000, gold: 800, food: 26_000, troops: 5500, agriculture: 25, commerce: 20, defense: 50, loyalty: 50 },
  },

  // ── Phase 49 — RTK14-inspired city additions ──
  // You province / northeast — fix orphan refs and add Liaodong neighbor
  {
    id: 'yuyang',
    name: { en: 'Yuyang', zh: '漁陽' },
    coords: { x: 730, y: 215 },
    adjacentCityIds: ['beiping', 'yi-county', 'yanmen', 'ji'],
    base: { population: 110_000, gold: 2000, food: 45_000, troops: 8500, agriculture: 45, commerce: 40, defense: 55, loyalty: 70 },
  },
  {
    id: 'xiangping',
    name: { en: 'Xiangping', zh: '襄平' },
    coords: { x: 815, y: 170 },
    adjacentCityIds: ['liaodong', 'lelang'],
    base: { population: 90_000, gold: 1500, food: 38_000, troops: 6500, agriculture: 35, commerce: 30, defense: 60, loyalty: 70 },
  },

  // Yang province — fix kuaiji orphan ref
  {
    id: 'kuaiji',
    name: { en: 'Kuaiji', zh: '會稽' },
    coords: { x: 790, y: 475 },
    adjacentCityIds: ['wu', 'linhai', 'poyang'],
    terrain: 'water',
    port: true,
    base: { population: 200_000, gold: 3800, food: 90_000, troops: 13_000, agriculture: 70, commerce: 65, defense: 50, loyalty: 75 },
  },

  // Jing province — siege sites & Wu strongholds
  {
    id: 'fancheng',
    name: { en: 'Fancheng', zh: '樊城' },
    coords: { x: 599, y: 441 },
    adjacentCityIds: ['xiangyang', 'wancheng'],
    base: { population: 130_000, gold: 2500, food: 55_000, troops: 9500, agriculture: 60, commerce: 50, defense: 75, loyalty: 70 },
  },
  {
    id: 'chaisang',
    name: { en: 'Chaisang', zh: '柴桑' },
    coords: { x: 695, y: 475 },
    adjacentCityIds: ['jiangling', 'yuzhang', 'wuchang', 'lujiang', 'wan'],
    terrain: 'water',
    port: true,
    base: { population: 130_000, gold: 2400, food: 58_000, troops: 10_000, agriculture: 60, commerce: 55, defense: 55, loyalty: 75 },
  },
  {
    id: 'baqiu',
    name: { en: 'Baqiu', zh: '巴丘' },
    coords: { x: 620, y: 485 },
    adjacentCityIds: ['jiangling', 'changsha', 'wuling', 'gongan', 'chibi'],
    base: { population: 90_000, gold: 1600, food: 42_000, troops: 7500, agriculture: 55, commerce: 45, defense: 60, loyalty: 70 },
  },
  {
    id: 'xiling',
    name: { en: 'Xiling', zh: '西陵' },
    coords: { x: 571, y: 466 },
    adjacentCityIds: ['jiangling', 'yiling', 'gongan'],
    base: { population: 100_000, gold: 1900, food: 48_000, troops: 8500, agriculture: 55, commerce: 45, defense: 80, loyalty: 75 },
  },
  {
    id: 'xiaoting',
    name: { en: 'Xiaoting', zh: '猇亭' },
    coords: { x: 594, y: 484 },
    adjacentCityIds: ['yiling', 'yongan'],
    base: { population: 50_000, gold: 1000, food: 30_000, troops: 5000, agriculture: 40, commerce: 30, defense: 70, loyalty: 65 },
  },
  {
    id: 'bowang',
    name: { en: 'Bowang', zh: '博望' },
    coords: { x: 575, y: 415 },
    adjacentCityIds: ['xinye', 'xiangyang'],
    base: { population: 55_000, gold: 1100, food: 32_000, troops: 5500, agriculture: 45, commerce: 35, defense: 65, loyalty: 65 },
  },

  // Yang/Jiao border lakes
  {
    id: 'poyang',
    name: { en: 'Poyang', zh: '鄱陽' },
    coords: { x: 720, y: 490 },
    adjacentCityIds: ['yuzhang', 'kuaiji', 'luling'],
    base: { population: 100_000, gold: 1800, food: 48_000, troops: 8000, agriculture: 60, commerce: 50, defense: 50, loyalty: 70 },
  },

  // Xu / Yan / Bing province additions
  {
    id: 'puyang',
    name: { en: 'Puyang', zh: '濮陽' },
    coords: { x: 640, y: 340 },
    adjacentCityIds: ['chenliu', 'pengcheng', 'guandu', 'ye', 'baima', 'yanjin'],
    base: { population: 120_000, gold: 2200, food: 50_000, troops: 9000, agriculture: 65, commerce: 55, defense: 60, loyalty: 70 },
  },
  {
    id: 'langya',
    name: { en: 'Langya', zh: '琅琊' },
    coords: { x: 765, y: 355 },
    adjacentCityIds: ['linzi', 'pengcheng', 'xiapi', 'beihai'],
    base: { population: 130_000, gold: 2500, food: 55_000, troops: 9500, agriculture: 60, commerce: 55, defense: 55, loyalty: 75 },
  },
  {
    id: 'guangling',
    name: { en: 'Guangling', zh: '廣陵' },
    coords: { x: 760, y: 410 },
    adjacentCityIds: ['xiapi', 'jianye', 'shouchun'],
    port: true,
    base: { population: 110_000, gold: 2200, food: 50_000, troops: 8500, agriculture: 60, commerce: 60, defense: 55, loyalty: 70 },
  },

  // Yi (Shu) commanderies
  {
    id: 'baxi',
    name: { en: 'Baxi', zh: '巴西' },
    coords: { x: 410, y: 425 },
    adjacentCityIds: ['hanzhong', 'chengdu', 'jiangzhou', 'yangping', 'jiameng', 'jianmen'],
    base: { population: 100_000, gold: 1800, food: 50_000, troops: 8000, agriculture: 55, commerce: 40, defense: 65, loyalty: 75 },
  },
  {
    id: 'yinping',
    name: { en: 'Yinping', zh: '陰平' },
    coords: { x: 385, y: 405 },
    adjacentCityIds: ['hanzhong', 'wudu', 'jiangzhou', 'mianzhu', 'baishuiguan'],
    base: { population: 50_000, gold: 900, food: 28_000, troops: 5000, agriculture: 35, commerce: 25, defense: 75, loyalty: 70 },
  },
  {
    id: 'xincheng',
    name: { en: 'Xincheng', zh: '新城' },
    coords: { x: 552, y: 437 },
    adjacentCityIds: ['shangyong', 'hanzhong'],
    base: { population: 75_000, gold: 1500, food: 38_000, troops: 6500, agriculture: 50, commerce: 35, defense: 70, loyalty: 65 },
  },

  // Liang frontier — Wei vs Shu corridor
  {
    id: 'chencang',
    name: { en: 'Chencang', zh: '陳倉' },
    coords: { x: 435, y: 365 },
    adjacentCityIds: ['changan', 'tianshui', 'wuguan', 'yangping', 'jieting', 'sanguan', 'shanggui'],
    terrain: 'pass',
    base: { population: 85_000, gold: 1700, food: 42_000, troops: 7500, agriculture: 50, commerce: 40, defense: 88, loyalty: 70 },
  },
  {
    id: 'tianshui',
    name: { en: 'Tianshui', zh: '天水' },
    coords: { x: 390, y: 365 },
    adjacentCityIds: ['changan', 'chencang', 'wudu', 'anding', 'longxi', 'jieting', 'shanggui'],
    base: { population: 110_000, gold: 2100, food: 48_000, troops: 8500, agriculture: 50, commerce: 40, defense: 65, loyalty: 65 },
  },
  {
    id: 'longxi',
    name: { en: 'Longxi', zh: '隴西' },
    coords: { x: 345, y: 350 },
    adjacentCityIds: ['tianshui', 'jincheng', 'wuwei', 'anding'],
    base: { population: 80_000, gold: 1500, food: 38_000, troops: 7000, agriculture: 40, commerce: 30, defense: 65, loyalty: 60 },
  },
  {
    id: 'shanggui',
    name: { en: 'Shanggui', zh: '上邽' },
    coords: { x: 376, y: 359 },
    adjacentCityIds: ['tianshui', 'chencang', 'jieting'],
    base: { population: 70_000, gold: 1400, food: 35_000, troops: 6500, agriculture: 45, commerce: 35, defense: 70, loyalty: 65 },
  },

  // Far west — Hexi corridor
  {
    id: 'jiuquan',
    name: { en: 'Jiuquan', zh: '酒泉' },
    coords: { x: 210, y: 270 },
    adjacentCityIds: ['wuwei', 'dunhuang'],
    terrain: 'desert',
    base: { population: 55_000, gold: 1100, food: 28_000, troops: 5000, agriculture: 30, commerce: 40, defense: 60, loyalty: 60 },
  },
  {
    id: 'dunhuang',
    name: { en: 'Dunhuang', zh: '敦煌' },
    coords: { x: 130, y: 280 },
    adjacentCityIds: ['jiuquan'],
    terrain: 'desert',
    base: { population: 45_000, gold: 1300, food: 22_000, troops: 4500, agriculture: 25, commerce: 50, defense: 55, loyalty: 60 },
  },

  // Shuofang / 北地
  {
    id: 'shuofang',
    name: { en: 'Shuofang', zh: '朔方' },
    coords: { x: 485, y: 180 },
    adjacentCityIds: ['yanmen', 'anding', 'yunzhong', 'wuyuan'],
    terrain: 'desert',
    base: { population: 60_000, gold: 1100, food: 30_000, troops: 5500, agriculture: 35, commerce: 25, defense: 60, loyalty: 55 },
  },

  // ── Phase 50 — Final RTK14 city alignment ──
  {
    id: 'xiaopei',
    name: { en: 'Xiaopei', zh: '小沛' },
    coords: { x: 680, y: 390 },
    adjacentCityIds: ['xiapi', 'pengcheng', 'shouchun'],
    terrain: 'plain',
    base: { population: 100_000, gold: 1900, food: 48_000, troops: 8500, agriculture: 65, commerce: 50, defense: 50, loyalty: 70 },
  },
  {
    id: 'luling',
    name: { en: 'Luling', zh: '廬陵' },
    coords: { x: 695, y: 525 },
    adjacentCityIds: ['yuzhang', 'poyang'],
    terrain: 'forest',
    base: { population: 90_000, gold: 1700, food: 45_000, troops: 7500, agriculture: 55, commerce: 45, defense: 50, loyalty: 70 },
  },
  {
    id: 'cangwu',
    name: { en: 'Cangwu', zh: '蒼梧' },
    coords: { x: 622, y: 580 },
    adjacentCityIds: ['hepu', 'nanhai', 'lingling', 'jiaozhi', 'guilin'],
    terrain: 'forest',
    base: { population: 100_000, gold: 1800, food: 50_000, troops: 7500, agriculture: 60, commerce: 50, defense: 45, loyalty: 65 },
  },
  {
    id: 'danyang',
    name: { en: 'Danyang', zh: '丹陽' },
    coords: { x: 730, y: 445 },
    adjacentCityIds: ['jianye', 'wu', 'shouchun', 'lujiang'],
    port: true,
    terrain: 'mountain',
    base: { population: 120_000, gold: 2200, food: 55_000, troops: 9500, agriculture: 60, commerce: 50, defense: 60, loyalty: 72 },
  },
  {
    id: 'guilin',
    name: { en: 'Guilin', zh: '桂林' },
    coords: { x: 605, y: 580 },
    adjacentCityIds: ['lingling', 'guiyang', 'cangwu', 'hepu'],
    terrain: 'forest',
    base: { population: 80_000, gold: 1500, food: 40_000, troops: 6500, agriculture: 55, commerce: 40, defense: 45, loyalty: 65 },
  },

  // ── RTK XIII/XIV additions ──

  // Yi province (Sichuan) attack route — historical 劉備入蜀 / 諸葛瞻決戰 path
  {
    id: 'jiameng',
    name: { en: 'Jiameng', zh: '葭萌' },
    coords: { x: 425, y: 420 },
    adjacentCityIds: ['hanzhong', 'yangping', 'baxi', 'zitong', 'jianmen', 'baishuiguan'],
    terrain: 'mountain',
    base: { population: 55_000, gold: 1300, food: 35_000, troops: 5000, agriculture: 40, commerce: 25, defense: 65, loyalty: 70 },
  },
  {
    id: 'zitong',
    name: { en: 'Zitong', zh: '梓潼' },
    coords: { x: 397, y: 422 },
    adjacentCityIds: ['jiameng', 'fucheng', 'jianmen'],
    terrain: 'mountain',
    base: { population: 50_000, gold: 1100, food: 32_000, troops: 4500, agriculture: 45, commerce: 25, defense: 55, loyalty: 70 },
  },
  {
    id: 'fucheng',
    name: { en: 'Fucheng', zh: '涪城' },
    coords: { x: 388, y: 432 },
    adjacentCityIds: ['zitong', 'mianzhu', 'luocheng', 'jiangzhou'],
    base: { population: 95_000, gold: 1800, food: 50_000, troops: 7000, agriculture: 60, commerce: 45, defense: 55, loyalty: 72 },
  },
  {
    id: 'mianzhu',
    name: { en: 'Mianzhu', zh: '綿竹' },
    coords: { x: 372, y: 425 },
    adjacentCityIds: ['fucheng', 'luocheng', 'chengdu', 'yinping'],
    base: { population: 80_000, gold: 1500, food: 45_000, troops: 6500, agriculture: 55, commerce: 40, defense: 60, loyalty: 75 },
  },
  {
    id: 'luocheng',
    name: { en: 'Luocheng', zh: '雒城' },
    coords: { x: 362, y: 418 },
    adjacentCityIds: ['fucheng', 'mianzhu', 'chengdu'],
    base: { population: 110_000, gold: 2000, food: 55_000, troops: 9000, agriculture: 70, commerce: 50, defense: 70, loyalty: 75 },
  },

  // Youzhou (northeast) — RTK XIII has 薊 as You-province capital
  {
    id: 'ji',
    name: { en: 'Ji', zh: '薊' },
    coords: { x: 679, y: 231 },
    adjacentCityIds: ['beiping', 'yi-county', 'yuyang', 'wuhuan'],
    base: { population: 150_000, gold: 2800, food: 55_000, troops: 10_000, agriculture: 50, commerce: 45, defense: 60, loyalty: 70 },
  },
  {
    id: 'liucheng',
    name: { en: 'Liucheng', zh: '柳城' },
    coords: { x: 755, y: 200 },
    adjacentCityIds: ['wuhuan', 'liaodong', 'beiping'],
    terrain: 'mountain',
    base: { population: 40_000, gold: 900, food: 22_000, troops: 5000, agriculture: 25, commerce: 20, defense: 60, loyalty: 60 },
  },

  // Yangzi naval / contested zone
  {
    id: 'ruxu',
    name: { en: 'Ruxu', zh: '濡須' },
    coords: { x: 705, y: 445 },
    adjacentCityIds: ['hefei', 'jianye', 'lujiang', 'wan'],
    terrain: 'water',
    port: true,
    base: { population: 60_000, gold: 1400, food: 30_000, troops: 8000, agriculture: 40, commerce: 35, defense: 80, loyalty: 75 },
  },
  {
    id: 'wan',
    name: { en: 'Wan', zh: '皖城' },
    coords: { x: 656, y: 461 },
    adjacentCityIds: ['lujiang', 'chaisang', 'ruxu'],
    terrain: 'water',
    base: { population: 80_000, gold: 1600, food: 45_000, troops: 6500, agriculture: 55, commerce: 40, defense: 55, loyalty: 70 },
  },

  // Jingzhou west — 劉備 base after借荊州
  {
    id: 'gongan',
    name: { en: "Gong'an", zh: '公安' },
    coords: { x: 587, y: 473 },
    adjacentCityIds: ['jiangling', 'wuling', 'baqiu', 'xiling'],
    terrain: 'water',
    port: true,
    base: { population: 70_000, gold: 1500, food: 38_000, troops: 6000, agriculture: 50, commerce: 50, defense: 60, loyalty: 75 },
  },

  // Korean peninsula — RTK XIV unique additions
  {
    id: 'lelang',
    name: { en: 'Lelang', zh: '樂浪' },
    coords: { x: 875, y: 195 },
    adjacentCityIds: ['xiangping', 'daifang'],
    terrain: 'forest',
    base: { population: 50_000, gold: 900, food: 24_000, troops: 4000, agriculture: 30, commerce: 30, defense: 50, loyalty: 60 },
  },
  {
    id: 'daifang',
    name: { en: 'Daifang', zh: '帶方' },
    coords: { x: 880, y: 245 },
    adjacentCityIds: ['lelang'],
    terrain: 'forest',
    base: { population: 35_000, gold: 700, food: 18_000, troops: 3000, agriculture: 25, commerce: 25, defense: 40, loyalty: 55 },
  },

  // Pass — 諸葛亮 first 北伐 (失街亭)
  {
    id: 'jieting',
    name: { en: 'Jieting', zh: '街亭' },
    coords: { x: 408, y: 380 },
    adjacentCityIds: ['tianshui', 'shanggui', 'chencang'],
    terrain: 'pass',
    base: { population: 25_000, gold: 600, food: 14_000, troops: 5000, agriculture: 30, commerce: 15, defense: 80, loyalty: 70 },
  },

  // ── D-set: famous passes (4), battle sites (5), frontier (5) ──

  // Passes
  {
    id: 'jianmen',
    name: { en: 'Jianmen Pass', zh: '劍閣' },
    coords: { x: 425, y: 432 },
    adjacentCityIds: ['jiameng', 'zitong', 'baxi'],
    terrain: 'pass',
    base: { population: 25_000, gold: 700, food: 15_000, troops: 6500, agriculture: 30, commerce: 15, defense: 95, loyalty: 75 },
  },
  {
    id: 'sanguan',
    name: { en: 'Sanguan Pass', zh: '散關' },
    coords: { x: 445, y: 388 },
    adjacentCityIds: ['hanzhong', 'chencang', 'mei'],
    terrain: 'pass',
    base: { population: 22_000, gold: 600, food: 13_000, troops: 5500, agriculture: 25, commerce: 12, defense: 85, loyalty: 70 },
  },
  {
    id: 'baishuiguan',
    name: { en: 'Baishui Pass', zh: '白水關' },
    coords: { x: 400, y: 410 },
    adjacentCityIds: ['wudu', 'jiameng', 'yinping'],
    terrain: 'pass',
    base: { population: 20_000, gold: 500, food: 12_000, troops: 4500, agriculture: 25, commerce: 10, defense: 80, loyalty: 70 },
  },
  {
    id: 'xiaoguan',
    name: { en: 'Xiaoguan Pass', zh: '蕭關' },
    coords: { x: 435, y: 335 },
    adjacentCityIds: ['changan', 'anding'],
    terrain: 'pass',
    base: { population: 25_000, gold: 600, food: 14_000, troops: 5500, agriculture: 28, commerce: 15, defense: 80, loyalty: 65 },
  },

  // Battle-site cities
  {
    id: 'chibi',
    name: { en: 'Chibi', zh: '赤壁' },
    coords: { x: 609, y: 474 },
    adjacentCityIds: ['jiangling', 'jiangxia', 'wuchang', 'baqiu'],
    terrain: 'water',
    port: true,
    base: { population: 50_000, gold: 1000, food: 28_000, troops: 6000, agriculture: 40, commerce: 35, defense: 55, loyalty: 70 },
  },
  {
    id: 'changban',
    name: { en: 'Changban', zh: '長阪坡' },
    coords: { x: 579, y: 454 },
    adjacentCityIds: ['xinye', 'jiangling', 'xiangyang'],
    base: { population: 35_000, gold: 700, food: 18_000, troops: 4500, agriculture: 40, commerce: 25, defense: 50, loyalty: 70 },
  },
  {
    id: 'baima',
    name: { en: 'Baima', zh: '白馬' },
    coords: { x: 635, y: 320 },
    adjacentCityIds: ['puyang', 'liyang', 'ye', 'yanjin'],
    base: { population: 55_000, gold: 1100, food: 30_000, troops: 5500, agriculture: 50, commerce: 35, defense: 50, loyalty: 65 },
  },
  {
    id: 'yanjin',
    name: { en: 'Yanjin', zh: '延津' },
    coords: { x: 620, y: 328 },
    adjacentCityIds: ['baima', 'puyang', 'ye'],
    base: { population: 45_000, gold: 900, food: 25_000, troops: 5000, agriculture: 50, commerce: 30, defense: 45, loyalty: 65 },
  },
  {
    id: 'liyang',
    name: { en: 'Liyang', zh: '黎陽' },
    coords: { x: 625, y: 305 },
    adjacentCityIds: ['ye', 'baima', 'bohai'],
    base: { population: 70_000, gold: 1400, food: 35_000, troops: 7000, agriculture: 55, commerce: 40, defense: 65, loyalty: 70 },
  },

  // Frontier — northern (匈奴 borderlands)
  {
    id: 'yunzhong',
    name: { en: 'Yunzhong', zh: '雲中' },
    coords: { x: 520, y: 200 },
    adjacentCityIds: ['wuyuan', 'yanmen', 'shuofang'],
    terrain: 'desert',
    base: { population: 50_000, gold: 900, food: 22_000, troops: 5500, agriculture: 25, commerce: 20, defense: 55, loyalty: 55 },
  },
  {
    id: 'wuyuan',
    name: { en: 'Wuyuan', zh: '五原' },
    coords: { x: 495, y: 195 },
    adjacentCityIds: ['yunzhong', 'shuofang'],
    terrain: 'desert',
    base: { population: 40_000, gold: 700, food: 18_000, troops: 4500, agriculture: 20, commerce: 18, defense: 50, loyalty: 55 },
  },

  // Frontier — southern (Hainan + Vietnam)
  {
    id: 'zhuyai',
    name: { en: 'Zhuyai', zh: '朱崖' },
    coords: { x: 625, y: 695 },
    adjacentCityIds: ['nanhai', 'hepu'],
    terrain: 'forest',
    port: true,
    base: { population: 30_000, gold: 600, food: 16_000, troops: 3000, agriculture: 30, commerce: 30, defense: 40, loyalty: 50 },
  },
  {
    id: 'jiuzhen',
    name: { en: 'Jiuzhen', zh: '九真' },
    coords: { x: 470, y: 605 },
    adjacentCityIds: ['jiaozhi', 'rinan'],
    terrain: 'wetland',
    base: { population: 35_000, gold: 600, food: 18_000, troops: 3500, agriculture: 35, commerce: 25, defense: 35, loyalty: 50 },
  },
  {
    id: 'rinan',
    name: { en: 'Rinan', zh: '日南' },
    coords: { x: 460, y: 640 },
    adjacentCityIds: ['jiuzhen'],
    terrain: 'wetland',
    base: { population: 25_000, gold: 500, food: 14_000, troops: 2500, agriculture: 30, commerce: 25, defense: 30, loyalty: 45 },
  },
  // ── 三國志標配補城(neighbour links are one-way here; buildInitialCities symmetrises them) ──
  {
    id: 'qiao',
    name: { en: 'Qiao', zh: '譙' },
    coords: { x: 682, y: 254 },
    adjacentCityIds: ['chenliu', 'xuchang', 'runan', 'pengcheng', 'xiaopei'],
    base: { population: 120_000, gold: 2000, food: 50_000, troops: 9000, agriculture: 50, commerce: 45, defense: 45, loyalty: 60 },
  },
  {
    id: 'changshan',
    name: { en: 'Changshan', zh: '常山' },
    coords: { x: 640, y: 135 },
    adjacentCityIds: ['ye', 'boling', 'taiyuan', 'zhongshan', 'xindu'],
    base: { population: 110_000, gold: 1800, food: 48_000, troops: 8000, agriculture: 50, commerce: 40, defense: 50, loyalty: 60 },
  },
  {
    id: 'xindu',
    name: { en: 'Xindu', zh: '信都' },
    coords: { x: 675, y: 151 },
    adjacentCityIds: ['ye', 'nanpi', 'pingyuan', 'boling', 'zhongshan', 'changshan'],
    base: { population: 130_000, gold: 2200, food: 52_000, troops: 9500, agriculture: 55, commerce: 45, defense: 50, loyalty: 65 },
  },
  {
    id: 'zhongshan',
    name: { en: 'Zhongshan', zh: '中山' },
    coords: { x: 655, y: 124 },
    adjacentCityIds: ['changshan', 'xindu', 'boling', 'yi-county', 'beiping'],
    base: { population: 100_000, gold: 1700, food: 45_000, troops: 7000, agriculture: 50, commerce: 40, defense: 50, loyalty: 60 },
  },
  {
    id: 'zhangye',
    name: { en: 'Zhangye', zh: '張掖' },
    coords: { x: 153, y: 113 },
    adjacentCityIds: ['wuwei', 'jiuquan'],
    base: { population: 60_000, gold: 1200, food: 32_000, troops: 5000, agriculture: 40, commerce: 35, defense: 55, loyalty: 60 },
  },
  {
    id: 'qianwei',
    name: { en: 'Qianwei', zh: '犍為' },
    coords: { x: 272, y: 360 },
    adjacentCityIds: ['chengdu', 'jiangzhou', 'yuexi'],
    base: { population: 95_000, gold: 1600, food: 48_000, troops: 6500, agriculture: 58, commerce: 35, defense: 40, loyalty: 65 },
  },
  {
    id: 'juyongguan',
    name: { en: 'Juyong Pass', zh: '居庸關' },
    coords: { x: 692, y: 75 },
    adjacentCityIds: ['ji', 'beiping', 'yuyang'],
    terrain: 'pass',
    base: { population: 15_000, gold: 400, food: 12_000, troops: 4500, agriculture: 10, commerce: 10, defense: 78, loyalty: 60 },
  },
  {
    id: 'hanguguan',
    name: { en: 'Hangu Pass', zh: '函谷關' },
    coords: { x: 513, y: 232 },
    adjacentCityIds: ['luoyang', 'tongguan'],
    terrain: 'pass',
    base: { population: 12_000, gold: 350, food: 10_000, troops: 4500, agriculture: 8, commerce: 8, defense: 82, loyalty: 60 },
  },
];

export function buildInitialCities(
  ownership: Record<string, string | null>,
): City[] {
  // Cities a scenario doesn't list inherit the owner of the NEAREST listed
  // city within ~60px (real-geography positions) — so the passes, forts and
  // satellite towns added to the map after the scenario tables were written
  // (劍閣/街亭/潼關/白馬…) belong to the power whose heartland surrounds
  // them, instead of standing as ahistorical neutral gaps. Anything farther
  // than the cap stays neutral, preserving deliberately unclaimed regions.
  const FILL_RANGE = 60 * WORLD_SCALE;
  const listed = CITY_TEMPLATES
    .filter((t) => ownership[t.id] != null)
    .map((t) => ({ id: t.id, owner: ownership[t.id]!, pos: cityPos({ id: t.id, coords: t.coords }) }));
  const effectiveOwner = (t: CityTemplate): string | null => {
    const explicit = ownership[t.id];
    if (explicit !== undefined) return explicit;
    if (listed.length === 0) return null;
    const p = cityPos({ id: t.id, coords: t.coords });
    let best: { owner: string; d: number } | null = null;
    for (const l of listed) {
      const d = Math.hypot(l.pos.x - p.x, l.pos.y - p.y);
      if (d <= FILL_RANGE && (!best || d < best.d)) best = { owner: l.owner, d };
    }
    return best?.owner ?? null;
  };
  // Roads are two-way — symmetrise adjacency so a city added with a neighbour
  // link is reachable both ways without hand-editing every neighbour's list.
  // (Existing data is already ~symmetric, so this is effectively a no-op for
  // it and just auto-wires newly-added cities.)
  const adj = new Map<string, Set<string>>();
  for (const t of CITY_TEMPLATES) {
    if (!adj.has(t.id)) adj.set(t.id, new Set());
    for (const a of t.adjacentCityIds) {
      adj.get(t.id)!.add(a);
      if (!adj.has(a)) adj.set(a, new Set());
      adj.get(a)!.add(t.id);
    }
  }
  return CITY_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    coords: t.coords,
    adjacentCityIds: [...(adj.get(t.id) ?? [])],
    ownerForceId: effectiveOwner(t),
    terrain: t.terrain ?? 'plain',
    port: t.port ?? false,
    ...t.base,
  }));
}

export const CITY_IDS = CITY_TEMPLATES.map((t) => t.id);

/**
 * Multi-season march duration. Distance sets the baseline, but the path is
 * weighted by terrain — crossing mountain ranges (秦岭, 大巴, 横断…) or a
 * major river slows the column, so 漢中↔成都 through the passes takes longer
 * than a flat march of the same distance. Pass-terrain endpoints (劍閣,
 * 散關…) add a chokepoint season. Capped at 4 seasons.
 */
export function marchDurationFor(from: City, to: City, season?: 'spring' | 'summer' | 'autumn' | 'winter'): number {
  // Geo-anchored positions — the same ones the 3D map renders and the
  // terrain layer (geography.ts) is authored in, so the cost integral
  // below samples the mountains the column actually crosses.
  const a = cityPos(from);
  const b = cityPos(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);

  // Integrate terrain cost along the straight line: average extra cost
  // scales the effective distance (mountains can ~2× it).
  const STEPS = 10;
  let costSum = 0;
  for (let i = 0; i < STEPS; i++) {
    const t = (i + 0.5) / STEPS;
    costSum += terrainMarchCost(a.x + dx * t, a.y + dy * t, { frozenRivers: season === 'winter' });
  }
  const terrainMul = 1 + (costSum / STEPS); // 1 (plains) … ~2.3 (deep mountains)
  let effDist = dist * terrainMul;

  // A pass endpoint is a chokepoint — funnelling through it costs time.
  if (from.terrain === 'pass' || to.terrain === 'pass') effDist += 20;

  // Thresholds re-tuned for the geo layout (median neighbour ≈56px vs the
  // painted map's ≈46px) — picked by grid search to keep the duration of
  // existing adjacent-pair marches as close to the old values as possible.
  if (effDist < 100 * WORLD_SCALE) return 1;
  if (effDist < 195 * WORLD_SCALE) return 2;
  if (effDist < 275 * WORLD_SCALE) return 3;
  return 4;
}

/** Static city-id → bilingual name lookup. Used by UI components that
 *  show city names without access to the runtime game state (e.g.
 *  the items browser on the title screen referencing each item's origin). */
export const CITY_NAMES_BY_ID: Record<string, { zh: string; en: string }> =
  Object.fromEntries(CITY_TEMPLATES.map((t) => [t.id, t.name]));
