import type { City, EntityId, Force, Officer } from '../types';
import type { ProvinceId } from '../types/province';
import { PROVINCES_BY_ID } from '../data/provinces';
import { citySize, citySizeRank } from './citySize';
import { officerGrade, gradeRank } from './officerGrade';

/**
 * 州牧 — provincial governors, made to matter.
 *
 * A 州牧 runs a whole 州 as one unit. No longer a mild player-only sweetener:
 *   • 分權之效 — his four stats steward the province each season (政→府庫,
 *     魅→安境, 統→防務, 智→開發/抑貪), tiered by 治才, not a flat threshold.
 *   • 擁兵自重 — total power under one man + low loyalty + 久任 build a 割據
 *     meter; left to fester it ends in 擁州自立 — the province secedes into a
 *     new force under the governor (the very thing that broke the Han).
 *   • AI realms appoint 州牧 too, and theirs can break away just the same.
 */

export const WARLORDISM_WARN = 50;
export const WARLORDISM_CAP = 100;

const REBEL_PALETTE = ['#8a5a2a', '#6a3a5a', '#3a6a5a', '#7a5a8a', '#5a6a3a', '#9a4a3a', '#3a5a7a', '#6a6a3a'];

/** A small seeded PRNG so AI 州牧 appointment stays off the main rng stream. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function hasTrait(o: Officer, t: string): boolean {
  return !!o.traits?.includes(t as never);
}

/** 治才 — administrative calibre, 政 0.6 + 魅 0.4. */
export function governorCalibre(o: Officer): number {
  return o.stats.politics * 0.6 + o.stats.charisma * 0.4;
}

/** 州兵 — a martial 州牧 keeps the province militia topped up toward this floor. */
export const MILITIA_FLOOR = 6000;

/** Per-city season delta a 州牧 confers (added + clamped by the caller). */
export interface ProvinceCityDelta {
  loyalty: number; gold: number; agriculture: number; defense: number; corruption: number; troops: number;
}

export interface ProvinceEffect {
  /** cityId → delta, for every province city the governor's force still holds. */
  deltas: Record<EntityId, ProvinceCityDelta>;
  loyaltyGain: number; goldBonus: number; developGain: number; defenseGain: number; antiGraft: number;
  /** 州兵動員 — whether the governor tops up thin garrisons this season. */
  militia: boolean;
  touched: number;
}

/**
 * 分權之效 — the per-season stewardship a province governor lays over the
 * cities of his 州 that his force still holds. Scales with all four stats;
 * the deeper effects (開發/防務/抑貪) need a capable steward (治才 ≥ 55).
 */
export function provinceGovernorEffect(
  gov: Officer, provinceId: ProvinceId, cities: Record<EntityId, City>,
): ProvinceEffect {
  const province = PROVINCES_BY_ID[provinceId];
  const cal = governorCalibre(gov);
  const loyaltyGain = cal >= 80 ? 2 : 1;                                          // 魅/治才 → 安境
  const goldBonus = Math.round(gov.stats.politics / 12);                          // 政 → 府庫
  const capable = cal >= 55;                                                      // 分權之效 unlocks for a real steward
  const developGain = capable ? Math.min(2, Math.max(0, Math.round((gov.stats.intelligence - 50) / 30))) : 0; // 智 → 勸課農桑
  const antiGraft = capable && gov.stats.intelligence >= 75 ? 1 : 0;              // 智 → 抑貪
  const defenseGain = capable && gov.stats.leadership >= 75 ? 1 : 0;              // 統 → 防務
  // 州兵動員 — a martial steward (統 ≥ 70) keeps thin garrisons topped up toward
  // a militia floor; he tops up faster but never overfills (so it can't snowball).
  const militia = gov.stats.leadership >= 70;
  const deltas: Record<EntityId, ProvinceCityDelta> = {};
  let touched = 0;
  if (province) {
    for (const cid of province.cityIds) {
      const c = cities[cid];
      if (!c || c.ownerForceId !== gov.forceId) continue;
      const topUp = militia && c.troops < MILITIA_FLOOR
        ? Math.min(Math.round(gov.stats.leadership * 2), MILITIA_FLOOR - c.troops)
        : 0;
      deltas[cid] = { loyalty: loyaltyGain, gold: goldBonus, agriculture: developGain, defense: defenseGain, corruption: -antiGraft, troops: topUp };
      touched++;
    }
  }
  return { deltas, loyaltyGain, goldBonus, developGain, defenseGain, antiGraft, militia, touched };
}

/**
 * 擁兵自重 — how fast a governor's 割據 designs grow this season. Returns a
 * signed delta to add to his province's warlordism meter (0..100). The faithful
 * never grasp; a trusted, content steward sees the meter decay.
 */
export function provinceWarlordismDelta(input: {
  gov: Officer;
  ownedTroops: number;
  ownedCities: number;
  tenureYears: number;
  lordRapport?: number;
}): number {
  const { gov } = input;
  if (hasTrait(gov, 'loyal')) return -8;                       // 忠義之士 never grasp
  // 兵權城池歸於一人 — the raw autonomous power the seat concentrates.
  const power = input.ownedTroops / 10000 + input.ownedCities * 0.5;
  let d = power * 0.4;
  d += Math.max(0, 70 - gov.loyalty) * 0.06;                  // discontent feeds it
  if (hasTrait(gov, 'ambitious')) d += 1.5;
  if (hasTrait(gov, 'arrogant')) d += 0.8;
  d += Math.min(3, input.tenureYears * 0.3);                  // 久任尾大不掉
  // 制衡 — a loyal heart or a warm bond with the lord stays his hand.
  if (gov.loyalty >= 80) d -= 3;
  if ((input.lordRapport ?? 0) >= 60) d -= 2;
  d -= 1.5;                                                    // base decay — a healthy seat trends down
  return d;
}

export interface SecessionResult {
  newForceId: EntityId;
  capitalCityId: EntityId;
  secededCityIds: EntityId[];
  event: { cityId: EntityId; text: string; textZh: string };
}

/**
 * 擁州自立 — the governor raises his own banner over the whole province,
 * seceding every province city his old force held (bar its capital) into a new
 * force under him, dragging shaky local officers along. Mutates the passed
 * records in place (mirrors systems/ambition.ts). Returns null if nothing to take.
 */
export function seceProvince(input: {
  provinceId: ProvinceId;
  gov: Officer;
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
}): SecessionResult | null {
  const { provinceId, gov, officers, cities, forces } = input;
  const province = PROVINCES_BY_ID[provinceId];
  const forceId = gov.forceId;
  if (!province || !forceId) return null;
  const force = forces[forceId];
  if (!force) return null;
  // Take every owned province city except the realm's own capital (a 州牧
  // can carve out a province, but not behead the dynasty from its seat).
  const secede = province.cityIds
    .map((id) => cities[id])
    .filter((c) => c && c.ownerForceId === forceId && c.id !== force.capitalCityId);
  if (secede.length === 0) return null;
  const newForceId = `province-rebel-${gov.id}`;
  if (forces[newForceId]) return null; // already broke away once
  const capital = secede.slice().sort((a, b) => b.troops - a.troops)[0];
  forces[newForceId] = {
    id: newForceId,
    name: { zh: `${gov.name.zh}軍`, en: `${gov.name.en}'s Host` },
    rulerOfficerId: gov.id,
    capitalCityId: capital.id,
    color: REBEL_PALETTE[hashId(gov.id) % REBEL_PALETTE.length],
    isPlayer: false,
    imperialRank: 'commoner',
    personality: 'opportunist',
  };
  const secededCityIds: EntityId[] = [];
  for (const c of secede) {
    cities[c.id] = { ...c, ownerForceId: newForceId, loyalty: Math.max(30, Math.min(70, c.loyalty)) };
    secededCityIds.push(c.id);
  }
  officers[gov.id] = { ...gov, forceId: newForceId, loyalty: 100, grievanceCount: 0, task: null };
  // Drag along shaky officers stationed in the seceding cities.
  const tookCities = new Set(secededCityIds);
  let pulled = 0;
  for (const other of Object.values(officers)) {
    if (pulled >= 3) break;
    if (other.id === gov.id || other.forceId !== forceId) continue;
    if (!other.locationCityId || !tookCities.has(other.locationCityId)) continue;
    if (other.status !== 'idle' && other.status !== 'active') continue;
    if (hasTrait(other, 'loyal') || other.loyalty >= 60) continue;
    officers[other.id] = { ...other, forceId: newForceId, loyalty: Math.max(60, other.loyalty), task: null };
    pulled++;
  }
  return {
    newForceId,
    capitalCityId: capital.id,
    secededCityIds,
    event: {
      cityId: capital.id,
      text: `${gov.name.en} (${gov.name.zh}) raises his own banner over ${province.name.en}, seceding ${secededCityIds.length} cities from ${force.name.en}!`,
      textZh: `${gov.name.zh}擁${province.name.zh}自立,裂${force.name.zh}之地而去 — 全州 ${secededCityIds.length} 城改幟!`,
    },
  };
}

/**
 * AI 州牧 — a stable AI realm that fully holds a province names a capable
 * steward to it (off the main rng so determinism elsewhere is intact). Returns
 * the appointments to commit; the caller mutates the slot map + tenure record.
 */
/**
 * 太守→州牧 — a proven prefect (a 連上考 record) is 州牧 material. Returns a
 * 0+ bonus that sorts him ahead of an unblooded officer of similar calibre.
 */
export function governorReadiness(officerId: EntityId, streaks?: Record<EntityId, number>): number {
  const s = streaks?.[officerId] ?? 0;
  return s > 0 ? s * 5 : 0; // each consecutive 上考 is worth ~5 calibre points of preference
}

export function planAIProvinceGovernors(input: {
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  provinceGovernors: Partial<Record<ProvinceId, EntityId>>;
  playerForceId?: EntityId | null;
  /** 太守→州牧 — proven prefects (連上考) are preferred for the post. */
  streaks?: Record<EntityId, number>;
  rng: () => number;
}): Array<{ provinceId: ProvinceId; officerId: EntityId; forceId: EntityId }> {
  const appoints: Array<{ provinceId: ProvinceId; officerId: EntityId; forceId: EntityId }> = [];
  const taken = new Set(Object.values(input.provinceGovernors));
  for (const province of Object.values(PROVINCES_BY_ID)) {
    if (input.provinceGovernors[province.id]) continue; // already seated
    // Which force, if any, holds a majority (≥ half, ≥3 cities) of this province?
    const byForce: Record<string, number> = {};
    for (const cid of province.cityIds) {
      const owner = input.cities[cid]?.ownerForceId;
      if (owner) byForce[owner] = (byForce[owner] ?? 0) + 1;
    }
    let holder: string | null = null;
    for (const [fid, n] of Object.entries(byForce)) {
      if (fid === input.playerForceId) { holder = null; break; }     // never auto-appoint for the player
      if (n >= 3 && n * 2 >= province.cityIds.length) holder = fid;
    }
    if (!holder) continue;
    const force = input.forces[holder];
    if (!force) continue;
    if (input.rng() >= 0.25) continue;                               // measured: ~1 in 4 eligible provinces/season
    // Best capable, non-ruler, idle/active officer not already a 州牧 elsewhere.
    const cand = Object.values(input.officers)
      .filter((o) => o.forceId === holder && o.id !== force.rulerOfficerId
        && (o.status === 'idle' || o.status === 'active')
        && !taken.has(o.id) && governorCalibre(o) >= 60)
      // 太守→州牧 — a proven prefect outranks an unblooded officer of like calibre.
      .sort((a, b) => (governorCalibre(b) + governorReadiness(b.id, input.streaks))
        - (governorCalibre(a) + governorReadiness(a.id, input.streaks)))[0];
    if (!cand) continue;
    appoints.push({ provinceId: province.id, officerId: cand.id, forceId: holder });
    taken.add(cand.id);
  }
  return appoints;
}

/**
 * 州牧辟召 — a province governor commissions stewards for the cities of his 州
 * that his realm holds but has left undelegated, each to the ablest officer
 * stationed there (great cities still need a 金牌 hand). One-click 州統諸郡:
 * the 州牧 staffs his whole province in a stroke. Pure — the caller commits via
 * the ordinary delegateCity pipeline.
 */
export function planProvinceLevy(input: {
  provinceId: ProvinceId;
  forceId: EntityId;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  cityDelegations: Record<EntityId, EntityId>;
  busyOfficerIds?: ReadonlySet<EntityId>;
}): Array<{ cityId: EntityId; officerId: EntityId }> {
  const province = PROVINCES_BY_ID[input.provinceId];
  if (!province) return [];
  const used = new Set<EntityId>(Object.values(input.cityDelegations));
  const out: Array<{ cityId: EntityId; officerId: EntityId }> = [];
  for (const cid of province.cityIds) {
    const city = input.cities[cid];
    if (!city || city.ownerForceId !== input.forceId) continue;
    if (input.cityDelegations[cid]) continue;                 // already delegated
    const needsGold = citySizeRank(citySize(city).id) >= citySizeRank('large');
    const cand = Object.values(input.officers)
      .filter((o) => o.forceId === input.forceId
        && o.locationCityId === cid
        && (o.status === 'idle' || o.status === 'active')
        && !o.task
        && !used.has(o.id)
        && !(input.busyOfficerIds?.has(o.id))
        && (!needsGold || gradeRank(officerGrade(o).grade) >= gradeRank('gold')))
      .sort((a, b) => governorCalibre(b) - governorCalibre(a))[0];
    if (!cand) continue;
    out.push({ cityId: cid, officerId: cand.id });
    used.add(cand.id);
  }
  return out;
}
