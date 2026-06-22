/**
 * 特產／名產 — each region's signature product. A grounded nod to Han-era
 * economic geography: 涼州 breeds warhorses, 蜀 weaves brocade, 合浦 dives
 * for pearls, 交州 trades ivory. Owning the city that makes a famous good
 * gives a small, permanent trade (gold) or harvest (food) edge — the kind
 * of regional flavour the 三國志 economy screens always carried.
 *
 * Purely a data table consumed by tickCityEconomy (the multiplier) and the
 * city panel (the label). Cities not listed simply have no specialty.
 */
export type SpecialtyId =
  | 'horse'    // 馬 — 涼州/幽州/并州 戰馬
  | 'salt'     // 鹽 — 海鹽/井鹽,歷代官營利源
  | 'iron'     // 鐵 — 冶鐵鍛兵
  | 'silk'     // 絲 — 齊紈魯縞
  | 'brocade'  // 蜀錦 — 益州織造,蜀漢國用所恃
  | 'rice'     // 稻米 — 江南水鄉
  | 'wheat'    // 麥 — 中原糧倉
  | 'pearl'    // 珠 — 合浦珍珠
  | 'copper'   // 銅 — 丹陽銅,鑄錢鑄兵
  | 'timber'   // 木材 — 山林之饒
  | 'fruit'    // 柑橘 — 荊楚千樹橘
  | 'lacquer'  // 漆器 — 巴蜀漆工
  | 'ivory'    // 象牙 — 交南犀象
  | 'fish'     // 魚鹽 — 濱海漁鹽之利
  | 'herb';    // 藥材 — 山中藥圃

export interface SpecialtyDef {
  id: SpecialtyId;
  zh: string;
  glyph: string;
  /** Trade multiplier on a city's gold income. */
  goldMul: number;
  /** Harvest multiplier on a city's autumn food income. */
  foodMul: number;
  noteZh: string;
}

export const SPECIALTY_DEFS: Record<SpecialtyId, SpecialtyDef> = {
  horse:   { id: 'horse',   zh: '名馬',   glyph: '馬', goldMul: 1.12, foodMul: 1.0,  noteZh: '良駒互市,商利 +12%' },
  salt:    { id: 'salt',    zh: '鹽',     glyph: '鹽', goldMul: 1.18, foodMul: 1.0,  noteZh: '鹽政官營,商利 +18%' },
  iron:    { id: 'iron',    zh: '鐵',     glyph: '鐵', goldMul: 1.12, foodMul: 1.0,  noteZh: '冶鐵之饒,商利 +12%' },
  silk:    { id: 'silk',    zh: '絲帛',   glyph: '絲', goldMul: 1.15, foodMul: 1.0,  noteZh: '齊紈魯縞,商利 +15%' },
  brocade: { id: 'brocade', zh: '蜀錦',   glyph: '錦', goldMul: 1.20, foodMul: 1.0,  noteZh: '益州織造,商利 +20%' },
  rice:    { id: 'rice',    zh: '稻米',   glyph: '稻', goldMul: 1.0,  foodMul: 1.15, noteZh: '江南水鄉,糧產 +15%' },
  wheat:   { id: 'wheat',   zh: '宿麥',   glyph: '麥', goldMul: 1.0,  foodMul: 1.12, noteZh: '中原麥倉,糧產 +12%' },
  pearl:   { id: 'pearl',   zh: '珍珠',   glyph: '珠', goldMul: 1.18, foodMul: 1.0,  noteZh: '合浦珠還,商利 +18%' },
  copper:  { id: 'copper',  zh: '銅',     glyph: '銅', goldMul: 1.12, foodMul: 1.0,  noteZh: '丹陽銅冶,商利 +12%' },
  timber:  { id: 'timber',  zh: '木材',   glyph: '木', goldMul: 1.08, foodMul: 1.0,  noteZh: '山林之饒,商利 +8%' },
  fruit:   { id: 'fruit',   zh: '柑橘',   glyph: '橘', goldMul: 1.08, foodMul: 1.06, noteZh: '千樹橘柚,商利 +8%、糧 +6%' },
  lacquer: { id: 'lacquer', zh: '漆器',   glyph: '漆', goldMul: 1.12, foodMul: 1.0,  noteZh: '巴蜀漆工,商利 +12%' },
  ivory:   { id: 'ivory',   zh: '犀象',   glyph: '象', goldMul: 1.16, foodMul: 1.0,  noteZh: '交南犀象,商利 +16%' },
  fish:    { id: 'fish',    zh: '魚鹽',   glyph: '魚', goldMul: 1.10, foodMul: 1.08, noteZh: '濱海漁鹽,商利 +10%、糧 +8%' },
  herb:    { id: 'herb',    zh: '藥材',   glyph: '藥', goldMul: 1.10, foodMul: 1.0,  noteZh: '山中藥圃,商利 +10%' },
};

/** Which city makes which famous good. Grounded in Han economic geography. */
export const CITY_SPECIALTY: Record<string, SpecialtyId> = {
  // ── 馬 — the horse frontier (涼州・幷州・幽州) ──
  wuwei: 'horse', jincheng: 'horse', zhangye: 'horse', anding: 'horse',
  shuofang: 'horse', tianshui: 'horse', longxi: 'horse', dunhuang: 'horse',
  jiuquan: 'horse', beiping: 'horse', yuyang: 'horse', yanmen: 'horse',
  yunzhong: 'horse', wuyuan: 'horse', liaodong: 'horse', xiangping: 'horse',
  wuhuan: 'horse', ji: 'horse',
  // ── 鹽 — salt, the great state monopoly ──
  guangling: 'salt', langya: 'salt', qianwei: 'salt',
  // ── 鐵 — ironworks ──
  wancheng: 'iron', baxi: 'iron', fucheng: 'iron', pengcheng: 'iron',
  // ── 絲帛 — the silk of 齊魯・中原 ──
  linzi: 'silk', chenliu: 'silk', puyang: 'silk', ye: 'silk',
  // ── 蜀錦 — Shu brocade, Liu Bei's treasury ──
  chengdu: 'brocade',
  // ── 稻米 — the rice of 江南 ──
  kuaiji: 'rice', wu: 'rice', yuzhang: 'rice', changsha: 'rice',
  lujiang: 'rice', poyang: 'rice', luling: 'rice',
  // ── 宿麥 — the wheat of the central plain ──
  xuchang: 'wheat', runan: 'wheat', qiao: 'wheat',
  // ── 珠 — pearls of the southern sea ──
  hepu: 'pearl', nanhai: 'pearl', zhuyai: 'pearl',
  // ── 銅 — the copper of 丹陽 ──
  danyang: 'copper',
  // ── 木材 — timber of the southern hills ──
  wuling: 'timber', jianning: 'timber', yongchang: 'timber',
  // ── 柑橘 — the orange groves of 荊楚 ──
  jiangling: 'fruit',
  // ── 漆器 — lacquerware of 巴 ──
  jiangzhou: 'lacquer',
  // ── 犀象 — ivory & rhinoceros of the far south ──
  jiaozhi: 'ivory', rinan: 'ivory', jiuzhen: 'ivory',
  // ── 魚鹽 — coastal fish & salt ──
  linhai: 'fish', beihai: 'fish',
  // ── 藥材 — mountain herbs ──
  hanzhong: 'herb', yinping: 'herb', wudu: 'herb',
};

/**
 * 地利親和 — a city's signature good lends an edge to a matching building
 * category: a horse frontier favours 軍務 (cavalry works), a salt/silk/brocade
 * town favours 經濟, a rice/wheat basin 農政, a herb region 民政 (medicine),
 * timber 城防 (walls & ships). Buildings of the affine category build cheaper
 * and run stronger in that city. (Imported by systems/buildings.ts.)
 */
export const SPECIALTY_AFFINITY: Record<SpecialtyId, import('../types').BuildingCategory> = {
  horse: 'military', iron: 'military',
  salt: 'economy', silk: 'economy', brocade: 'economy', pearl: 'economy',
  copper: 'economy', lacquer: 'economy', ivory: 'economy',
  rice: 'agriculture', wheat: 'agriculture', fruit: 'agriculture', fish: 'agriculture',
  timber: 'defense',
  herb: 'civic',
};

/** A city's building-category affinity from its specialty (null if none). */
export function cityAffinity(cityId: string): import('../types').BuildingCategory | null {
  const sid = CITY_SPECIALTY[cityId];
  return sid ? SPECIALTY_AFFINITY[sid] : null;
}

/** The specialty multipliers for a city's economy (1.0 if it has none). */
export function specialtyEconomy(cityId: string): { goldMul: number; foodMul: number } {
  const sid = CITY_SPECIALTY[cityId];
  if (!sid) return { goldMul: 1, foodMul: 1 };
  const def = SPECIALTY_DEFS[sid];
  return { goldMul: def.goldMul, foodMul: def.foodMul };
}

/** The specialty definition for a city, or null. */
export function citySpecialty(cityId: string): SpecialtyDef | null {
  const sid = CITY_SPECIALTY[cityId];
  return sid ? SPECIALTY_DEFS[sid] : null;
}
