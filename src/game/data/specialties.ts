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
import type { City, EntityId } from '../types';

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

/**
 * 互通有無 — a good's complementarity class, the axis along which trade is rich.
 * 遠物為貴 says a route earns its margin by carrying what the other end LACKS, so
 * goods that serve *different* needs (兵甲 ⇄ 糧, 藥材 ⇄ anything) trade richest;
 * two goods of the SAME class (兩種糧、兩種名品) still trade, but compete as much
 * as they complement, so they ride at a lesser premium. Consumed by tradeRoutes.ts.
 *   war   兵甲之資 — mounts, arms, ships, war-coin (馬鐵木銅)
 *   food  飽腹之資 — the staples + the salt that keeps them (稻麥橘魚鹽)
 *   craft 工巧名品 — what a court covets (絲錦漆珠象)
 *   physic 藥石之資 — physic, complementary to all (藥材)
 */
export type SpecialtyClass = 'war' | 'food' | 'craft' | 'physic';

export const SPECIALTY_CLASS: Record<SpecialtyId, SpecialtyClass> = {
  horse: 'war', iron: 'war', timber: 'war', copper: 'war',
  rice: 'food', wheat: 'food', fruit: 'food', fish: 'food', salt: 'food',
  silk: 'craft', brocade: 'craft', lacquer: 'craft', pearl: 'craft', ivory: 'craft',
  herb: 'physic',
};

/** A city's complementarity class from its signature good (null if none). */
export function specialtyClass(cityId: string): SpecialtyClass | null {
  const sid = CITY_SPECIALTY[cityId];
  return sid ? SPECIALTY_CLASS[sid] : null;
}

/**
 * 名產發展度 — investing in a city's signature trade (名產作坊/匠籍) sharpens its
 * edge. Each development level widens the gold/food premium by SPECIALTY_DEV_GAIN
 * of the base delta (蜀錦 +20% climbs toward +35% at max dev) and likewise swells
 * the strategic good it produces.
 */
export const SPECIALTY_DEV_MAX = 5;
export const SPECIALTY_DEV_GAIN = 0.15;

/** The specialty multipliers for a city's economy (1.0 if it has none). */
export function specialtyEconomy(cityId: string, dev = 0): { goldMul: number; foodMul: number } {
  const sid = CITY_SPECIALTY[cityId];
  if (!sid) return { goldMul: 1, foodMul: 1 };
  const def = SPECIALTY_DEFS[sid];
  const scale = 1 + Math.max(0, Math.min(SPECIALTY_DEV_MAX, dev)) * SPECIALTY_DEV_GAIN;
  return {
    goldMul: 1 + (def.goldMul - 1) * scale,
    foodMul: 1 + (def.foodMul - 1) * scale,
  };
}

/** The specialty definition for a city, or null. */
export function citySpecialty(cityId: string): SpecialtyDef | null {
  const sid = CITY_SPECIALTY[cityId];
  return sid ? SPECIALTY_DEFS[sid] : null;
}

// ════════════════════════════════════════════════════════════════════════
// 戰略物資 — beyond a gold/food premium, most signature goods feed a real
// downstream system. 馬 breeds cavalry and 鐵 forges arms (both already
// stockpiled on the city as warhorses/iron); 藥材 yields medicine, 鹽 cures
// rations, 木材 floats ships, 銅 mints coin, and the fine luxuries (絲/錦/珠/
// 象/漆) buy prestige and tribute. 稻/麥/橘/魚 stay pure staples.
// ════════════════════════════════════════════════════════════════════════
export type SpecialtyRole =
  | 'warhorse'   // 馬 → cavalry        (city.warhorses)
  | 'iron'       // 鐵 → forge          (city.iron)
  | 'medicine'   // 藥材 → wound recovery + plague resist (city.medicine)
  | 'rations'    // 鹽 → grain endurance (realm passive)
  | 'lumber'     // 木材 → ships & siege  (realm passive)
  | 'coin'       // 銅 → mint & anti-inflation (realm passive)
  | 'luxury';    // 絲/錦/珠/象/漆 → tribute & court prestige (realm passive)

export const SPECIALTY_ROLE: Partial<Record<SpecialtyId, SpecialtyRole>> = {
  horse: 'warhorse', iron: 'iron', herb: 'medicine',
  salt: 'rations', timber: 'lumber', copper: 'coin',
  silk: 'luxury', brocade: 'luxury', pearl: 'luxury', ivory: 'luxury', lacquer: 'luxury',
};

const ALL_ROLES: SpecialtyRole[] = ['warhorse', 'iron', 'medicine', 'rations', 'lumber', 'coin', 'luxury'];

export const ROLE_ZH: Record<SpecialtyRole, string> = {
  warhorse: '戰馬', iron: '鐵', medicine: '藥材', rations: '軍糧',
  lumber: '木料', coin: '錢', luxury: '名品',
};

/** The strategic role a city's specialty plays (null for staples / none). */
export function cityRole(cityId: string): SpecialtyRole | null {
  const sid = CITY_SPECIALTY[cityId];
  return sid ? (SPECIALTY_ROLE[sid] ?? null) : null;
}

/** A single producer's output weight: 1 at dev 0, scaling with development. */
export function producerWeight(dev = 0): number {
  return 1 + Math.max(0, Math.min(SPECIALTY_DEV_MAX, dev)) * SPECIALTY_DEV_GAIN;
}

/** 專營 — a near-monopoly multiplies the realm-wide edge a good confers. */
export function monopolyMul(share: number): number {
  if (share >= 0.85) return 1.6;
  if (share >= 0.6) return 1.3;
  return 1;
}
export function monopolyTier(share: number): 0 | 1 | 2 {
  if (share >= 0.85) return 2;
  if (share >= 0.6) return 1;
  return 0;
}

function emptyRoleMap(): Record<SpecialtyRole, number> {
  return { warhorse: 0, iron: 0, medicine: 0, rations: 0, lumber: 0, coin: 0, luxury: 0 };
}

export interface SpecialtyControl {
  /** Per role: weighted production (Σ producerWeight over the force's producers). */
  strength: Record<SpecialtyRole, number>;
  /** Per role: world share of (owned) producers this force holds, 0..1. */
  share: Record<SpecialtyRole, number>;
  /** Per role: raw count of producers this force owns. */
  owned: Record<SpecialtyRole, number>;
}

/**
 * 名產版圖 — tally one force's grip on each strategic good across the whole map:
 * weighted production (count × development), raw producer count, and the world
 * share that drives 專營 (monopoly). A role this force has been embargoed on (a
 * rival monopolist cut it off — see embargoedRoles) contributes at half weight.
 */
export function specialtyControl(
  cities: Record<string, City>,
  forceId: EntityId | null,
  embargoedRoles?: ReadonlySet<SpecialtyRole>,
): SpecialtyControl {
  const strength = emptyRoleMap();
  const share = emptyRoleMap();
  const owned = emptyRoleMap();
  const worldTotal = emptyRoleMap();
  for (const c of Object.values(cities)) {
    if (c.ruined || c.ownerForceId == null) continue;
    const sid = CITY_SPECIALTY[c.id];
    if (!sid) continue;
    const role = SPECIALTY_ROLE[sid];
    if (!role) continue;
    worldTotal[role] += 1;
    if (forceId != null && c.ownerForceId === forceId) {
      owned[role] += 1;
      const w = producerWeight(c.specialtyDev ?? 0);
      strength[role] += embargoedRoles?.has(role) ? w * 0.5 : w;
    }
  }
  for (const r of ALL_ROLES) share[r] = worldTotal[r] > 0 ? owned[r] / worldTotal[r] : 0;
  return { strength, share, owned };
}

export interface SpecialtyRealmEffects {
  foodUpkeepMul: number;     // 鹽 — <1 stretches grain (lower troop upkeep)
  siegeEnduranceMul: number; // 鹽 — >1 a besieged garrison holds out longer
  shipBuildMul: number;      // 木 — <1 cheaper/faster ships
  siegeBuildMul: number;     // 木 — <1 cheaper siege engines
  inflationRelief: number;   // 銅 — flat inflation eased per season
  mintMul: number;           // 銅 — >1 richer 鑄錢
  woundRecoveryMul: number;  // 藥 — >1 faster wound recovery
  plagueResist: number;      // 藥 — 0..1 chance a plague tick is shrugged off
  tributeMul: number;        // 名品 — >1 weightier diplomatic gifts
  courtPrestige: number;     // 名品 — prestige/season earned at the capital
  monopolies: Array<{ role: SpecialtyRole; tier: 1 | 2 }>;
}

/** Effective per-role strength after the 專營 (monopoly-share) multiplier. */
export function roleEffect(ctrl: SpecialtyControl, role: SpecialtyRole): number {
  return ctrl.strength[role] * monopolyMul(ctrl.share[role]);
}

/** Every role's monopoly-adjusted strength as a map (for policy scaling, AI, UI). */
export function allRoleEffects(ctrl: SpecialtyControl): Record<SpecialtyRole, number> {
  const m = emptyRoleMap();
  for (const r of ALL_ROLES) m[r] = roleEffect(ctrl, r);
  return m;
}

/**
 * 禁運 — a force that holds a 專營 (≥60% world share) of a good may cut a rival
 * off from it. The embargoed rival's grip on that role is halved (it relied on
 * the monopolist's refined product / specialist labour), and its own production
 * of that good slows. Only a standing monopoly can impose or sustain one.
 */
export interface Embargo {
  by: EntityId;       // the monopolist imposing it
  against: EntityId;  // the rival being cut off
  role: SpecialtyRole;
}

/** Roles `forceId` has been embargoed on by any rival, as a set (or undefined). */
export function embargoedRolesAgainst(
  forceId: EntityId,
  embargoes?: readonly Embargo[],
): ReadonlySet<SpecialtyRole> | undefined {
  if (!embargoes || embargoes.length === 0) return undefined;
  const set = new Set<SpecialtyRole>();
  for (const e of embargoes) if (e.against === forceId) set.add(e.role);
  return set.size ? set : undefined;
}

/** Whether `by` currently holds a strong enough monopoly to embargo `role`. */
export function canEmbargo(ctrl: SpecialtyControl, role: SpecialtyRole): boolean {
  return monopolyTier(ctrl.share[role]) >= 1 && ctrl.owned[role] > 0;
}

/** Translate a force's specialty grip into the realm-wide bonuses it confers. */
export function specialtyRealmEffects(ctrl: SpecialtyControl): SpecialtyRealmEffects {
  const salt = roleEffect(ctrl, 'rations');
  const timber = roleEffect(ctrl, 'lumber');
  const copper = roleEffect(ctrl, 'coin');
  const herb = roleEffect(ctrl, 'medicine');
  const lux = roleEffect(ctrl, 'luxury');
  const monopolies: Array<{ role: SpecialtyRole; tier: 1 | 2 }> = [];
  for (const r of ALL_ROLES) {
    const t = monopolyTier(ctrl.share[r]);
    if (t > 0 && ctrl.owned[r] > 0) monopolies.push({ role: r, tier: t as 1 | 2 });
  }
  return {
    foodUpkeepMul: 1 - Math.min(0.25, salt * 0.04),
    siegeEnduranceMul: 1 + Math.min(0.6, salt * 0.08),
    shipBuildMul: 1 - Math.min(0.4, timber * 0.08),
    siegeBuildMul: 1 - Math.min(0.3, timber * 0.06),
    inflationRelief: Math.min(8, copper * 1.5),
    mintMul: 1 + Math.min(0.6, copper * 0.12),
    woundRecoveryMul: 1 + Math.min(0.8, herb * 0.14),
    plagueResist: Math.min(0.6, herb * 0.1),
    tributeMul: 1 + Math.min(1.2, lux * 0.14),
    courtPrestige: Math.floor(Math.min(10, lux * 1.2)),
    monopolies,
  };
}
