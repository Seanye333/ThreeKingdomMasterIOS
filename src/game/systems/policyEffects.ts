/**
 * Real gameplay effects of officers' personal policies.
 *
 * Each officer carries a list of policies (their lifelong expertise). When
 * stationed at a city or fighting in a battle, those policies are aggregated
 * into modifiers that actually change the game's numbers — not just labels.
 *
 * Effects are kept conservative on purpose: 1 policy = ~5–25% change so
 * stacking 3-5 makes a clear difference without breaking the game.
 */
import type { City, Officer, PolicyId } from '../types';
import { POLICY_PREREQ } from '../data/officerAttributes';
import type { SpecialtyRole } from '../data/specialties';

export interface CityPolicyEffects {
  /** Multiplier applied to gold income (1.0 = unchanged). */
  goldMul: number;
  /** Flat gold added/subtracted per season. */
  goldFlat: number;
  /** Multiplier applied to food (autumn) income. */
  foodMul: number;
  /** Loyalty delta per season (positive = recover toward 100). */
  loyaltyDelta: number;
  /** Defense bonus added to city.defense for siege calc. */
  defenseBonus: number;
  /** Troop cap multiplier (default 1.0 — used when training/recruiting). */
  troopCapMul: number;
  /** Description badges to show on city HUD ("★ 屯田 +25% 糧"). */
  badges: string[];
}

export interface CombatPolicyEffects {
  /** Damage multiplier for attacker. */
  attackMul: number;
  /** Damage taken multiplier for defender (>1 = take more damage). */
  defenseMul: number;
  /** Morale floor — minimum morale this side keeps. */
  moraleFloor: number;
  /** Bonus to fire-attack stratagem damage. */
  fireMul: number;
  /** Bonus to ranged stratagem (arrows/crossbow). */
  rangedMul: number;
  /** Badges to display. */
  badges: string[];
}

/**
 * Gather a list of all PolicyIds active in a given officer pool.
 * Each policy counts once per officer who carries it.
 *
 * RTK 14-style tech tree: a policy's effect only counts if all its
 * prerequisites (`POLICY_PREREQ`) are ALSO present in the pool. This lets
 * us model "advanced civic art that builds on basics" — e.g. 大農政 only
 * fires if 屯田 is also held by someone in the same city.
 */
function aggregatePolicies(officers: Officer[]): Set<PolicyId> {
  // First pass — collect every raw policy.
  const raw = new Set<PolicyId>();
  for (const o of officers) {
    for (const p of o.policies ?? []) raw.add(p);
  }
  // Second pass — drop any policy whose prereqs are not met.
  // Iterate to a fixed point so chains (A → B → C) resolve correctly.
  let active = new Set(raw);
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of [...active]) {
      const prereqs = POLICY_PREREQ[p];
      if (!prereqs) continue;
      if (!prereqs.every((req) => active.has(req))) {
        active.delete(p);
        changed = true;
      }
    }
  }
  return active;
}

/** Public helper — which policies in a pool are gated by unmet prereqs? */
export function lockedPolicies(officers: Officer[]): Array<{ id: PolicyId; missing: PolicyId[] }> {
  const raw = new Set<PolicyId>();
  for (const o of officers) for (const p of o.policies ?? []) raw.add(p);
  const active = aggregatePolicies(officers);
  const locked: Array<{ id: PolicyId; missing: PolicyId[] }> = [];
  for (const p of raw) {
    if (active.has(p)) continue;
    const prereqs = POLICY_PREREQ[p] ?? [];
    locked.push({ id: p, missing: prereqs.filter((req) => !raw.has(req)) });
  }
  return locked;
}

export type CombatTerrain = 'river' | 'naval' | 'mountain' | 'plain';

/**
 * Data tables — the single source of truth for what each policy does.
 *
 * Both the runtime resolvers below AND the docs catalog generator
 * (`scripts/gen-catalog.ts`) read these, so the design reference can never
 * drift from the live numbers. Multiplier fields are stored as the *delta*
 * from 1.0 (e.g. `goldMul: 0.20` means ×1.20); the resolver sums deltas onto
 * a base of 1. Insertion order is preserved for badge display order.
 */
export interface CityPolicyEffect {
  goldMul?: number;     // additive delta to gold-income multiplier
  goldFlat?: number;    // flat gold per season
  foodMul?: number;     // additive delta to food multiplier
  loyaltyDelta?: number;
  defenseBonus?: number;
  troopCapMul?: number; // additive delta to troop-cap multiplier
  /**
   * 名產所恃 — if set, this policy's gold yield is AMPLIFIED by how much of the
   * matching strategic good the owning force actually controls. A 鹽政官營 run by
   * a realm that holds the salt is worth far more than the same edict on paper.
   * The base value still applies (administrative skill); ownership adds upside.
   */
  specialtyRole?: SpecialtyRole;
  badge: string;
}

export const CITY_POLICY_EFFECTS: Partial<Record<PolicyId, CityPolicyEffect>> = {
  // ── ECONOMY ──
  tuntian:        { foodMul: 0.25, badge: '屯田 +25% 糧' },
  'ox-plowing':   { foodMul: 0.12, badge: '牛耕 +12% 糧' },
  'iron-tools':   { foodMul: 0.20, badge: '鐵具 +20% 糧' },
  'water-mill':   { foodMul: 0.12, badge: '水車 +12% 糧' },
  hydraulics:     { foodMul: 0.15, badge: '治水 +15% 糧' },
  commerce:       { goldMul: 0.20, badge: '商業 +20% 金' },
  'silk-trade':   { goldMul: 0.25, specialtyRole: 'luxury', badge: '絲綢 +25% 金' },
  'maritime-trade': { goldMul: 0.30, badge: '海貿 +30% 金' },
  'salt-monopoly': { goldFlat: 60, loyaltyDelta: -1, specialtyRole: 'rations', badge: '鹽政 +60 金/-1 忠' },
  'iron-monopoly': { goldFlat: 40, specialtyRole: 'iron', badge: '鐵政 +40 金' },
  'gold-mining':  { goldFlat: 120, badge: '金礦 +120 金' },
  'silver-mining': { goldFlat: 90, badge: '銀礦 +90 金' },
  'copper-mining': { goldFlat: 50, specialtyRole: 'coin', badge: '銅礦 +50 金' },
  'pearl-trade':  { goldFlat: 60, specialtyRole: 'luxury', badge: '珍珠貿 +60 金' },
  'jade-trade':   { goldFlat: 40, badge: '玉貿 +40 金' },
  'river-customs': { goldFlat: 50, badge: '関稅 +50 金' },
  'tea-trade':    { goldMul: 0.10, badge: '茶馬 +10% 金' },
  'fish-salt':    { goldFlat: 40, foodMul: 0.15, specialtyRole: 'rations', badge: '漁鹽 +40 金 +15% 糧' },
  'sericulture-tax':  { goldFlat: 35, specialtyRole: 'luxury', badge: '桑稅 +35 金' },
  'frontier-market':  { goldFlat: 50, badge: '邊市 +50 金' },
  'tribute-system':   { goldFlat: 50, specialtyRole: 'luxury', badge: '朝貢 +50 金' },
  'nanman-tribute':   { goldFlat: 40, badge: '南蠻納貢 +40 金' },
  'xiongnu-tribute':  { goldFlat: 30, badge: '匈奴納貢 +30 金' },
  // ── LOYALTY / SOCIAL ──
  rites:          { loyaltyDelta: 1, badge: '禮樂 +1 忠/季' },
  'poor-relief':  { loyaltyDelta: 1, badge: '賑災 +1 忠/季' },
  'community-granary': { loyaltyDelta: 3, badge: '義倉 +3 忠/季' },
  'charity-house': { loyaltyDelta: 3, badge: '養濟院 +3 忠' },
  mediation:      { loyaltyDelta: 1, badge: '鄉約 +1 忠' },
  'tax-light':    { loyaltyDelta: 2, goldMul: -0.20, badge: '輕徭 +2 忠/-20% 金' },
  'frontier-pacification': { loyaltyDelta: 2, badge: '撫夷 +2 忠' },
  corvee:         { loyaltyDelta: -2, badge: '力役 −2 忠' },
  conscription:   { loyaltyDelta: -1, troopCapMul: 0.35, badge: '徵兵 −1 忠 +35% 兵' },
  watchnight:     { loyaltyDelta: -1, badge: '夜禁 −1 忠' },
  // ── DEFENSE ──
  fortifications: { defenseBonus: 30, badge: '城防 +30 守' },
  'moat-construction': { defenseBonus: 15, badge: '護城河 +15 守' },
  'watch-towers': { defenseBonus: 10, badge: '烽燧 +10 守' },
  'mountain-passes': { defenseBonus: 20, badge: '關隘 +20 守' },
  'coastal-fortress': { defenseBonus: 20, badge: '海防 +20 守' },
  'imperial-guard': { defenseBonus: 25, badge: '禁衛 +25 守' },
  // ── RECRUITMENT / TROOPS ──
  recruitment:    { troopCapMul: 0.20, badge: '養兵 +20% 兵' },
  'horse-breeding': { troopCapMul: 0.10, badge: '牧苑 +10% 兵' },
};

export interface CombatPolicyEffect {
  attackMul?: number;   // additive delta to attack multiplier
  defenseMul?: number;  // additive delta to damage-taken multiplier (<0 = tougher)
  fireMul?: number;     // additive delta to fire-stratagem multiplier
  rangedMul?: number;   // additive delta to ranged-stratagem multiplier
  moraleFloor?: number; // morale floor (applied via max, not sum)
  /** If set, the effect only applies when the battle terrain is in this list. */
  terrain?: CombatTerrain[];
  /** Naval-fireships: stronger fire bonus when fighting on water. */
  waterFireMul?: number;
  waterBadge?: string;
  badge: string;
}

const WATER: CombatTerrain[] = ['naval', 'river'];

export const COMBAT_POLICY_EFFECTS: Partial<Record<PolicyId, CombatPolicyEffect>> = {
  'military-theory':  { attackMul: 0.10, badge: '軍学 +10% 攻' },
  'camp-discipline':  { moraleFloor: 30, badge: '軍紀 士氣保底 30' },
  'military-academy': { attackMul: 0.08, badge: '武備堂 +8% 攻' },
  'elite-guards':     { defenseMul: -0.15, badge: '親衛 −15% 受傷' },
  'horse-armor':      { defenseMul: -0.20, badge: '馬鎧 −20% 受傷' },
  'shield-wall':      { rangedMul: -0.25, defenseMul: -0.10, badge: '盾陣 抗箭' },
  'crossbow-corps':   { rangedMul: 0.30, badge: '弩兵 +30% 射' },
  'archery-school':   { rangedMul: 0.15, badge: '射禮 +15% 射' },
  'naval-fireships':  { fireMul: 0.20, waterFireMul: 0.50, badge: '火船 +20% 火攻', waterBadge: '火船 +50% 火攻' },
  'supply-train':     { moraleFloor: 25, badge: '輜重 士氣保底 25' },
  'frontier-pacification': { attackMul: 0.15, terrain: ['mountain'], badge: '撫夷 山地 +15% 攻' },
  'mountain-warfare': { attackMul: 0.20, defenseMul: -0.10, terrain: ['mountain'], badge: '山戰 山地 +20% 攻' },
  'naval-academy':    { attackMul: 0.20, terrain: WATER, badge: '水軍 +20% 攻' },
};

export interface RecruitPolicyEffect {
  searchSuccessBonus?: number; // additive % to search success
  recruitTroopMul?: number;    // additive delta to troops-per-recruit multiplier
  badge?: string;
}

export const RECRUIT_POLICY_EFFECTS: Partial<Record<PolicyId, RecruitPolicyEffect>> = {
  scholarship:      { searchSuccessBonus: 0.20, badge: '學問 招攬 +20%' },
  'seek-talent':    { searchSuccessBonus: 0.15 },  // tactic alias if ever — no badge
  'nine-grade':     { searchSuccessBonus: 0.15, badge: '九品 招攬 +15%' },
  examination:      { searchSuccessBonus: 0.10, badge: '察舉 招攬 +10%' },
  'school-village':  { searchSuccessBonus: 0.10, badge: '鄉學 +10%' },
  'imperial-academy': { searchSuccessBonus: 0.15, badge: '太學 +15%' },
  'defector-reward': { searchSuccessBonus: 0.10, badge: '招降 +10%' },
  'noble-titles':   { searchSuccessBonus: 0.10, badge: '封爵 +10%' },
  propaganda:       { searchSuccessBonus: 0.05, badge: '檄文 +5%' },
  recruitment:      { recruitTroopMul: 0.20 },
  'horse-breeding': { recruitTroopMul: 0.10 },
  'military-drill': { recruitTroopMul: 0.05, badge: '演武 兵質 +5%' },
} as Partial<Record<PolicyId, RecruitPolicyEffect>>;

/**
 * Compute economic + defense effects for one city, given the officers
 * currently stationed there.
 */
export function cityPolicyEffects(
  _city: City,
  cityOfficers: Officer[],
  /** Owning force's monopoly-adjusted grip on each strategic good (see
   *  allRoleEffects). Amplifies 名產所恃 policies; omit for a paper estimate. */
  roleStrength?: Record<SpecialtyRole, number>,
): CityPolicyEffects {
  const pol = aggregatePolicies(cityOfficers);
  let goldMul = 1, goldFlat = 0, foodMul = 1, loyaltyDelta = 0;
  let defenseBonus = 0, troopCapMul = 1;
  const badges: string[] = [];

  for (const [id, eff] of Object.entries(CITY_POLICY_EFFECTS) as Array<[PolicyId, CityPolicyEffect]>) {
    if (!pol.has(id)) continue;
    // 名產所恃 — owning the matching good adds upside on top of the base value:
    // ~4 weighted producers ≈ doubles the policy's gold yield (capped at ×2).
    let boost = 0;
    if (eff.specialtyRole && roleStrength) {
      boost = Math.min(1, (roleStrength[eff.specialtyRole] ?? 0) * 0.25);
    }
    goldMul += (eff.goldMul ?? 0) * (1 + boost);
    goldFlat += (eff.goldFlat ?? 0) * (1 + boost);
    foodMul += eff.foodMul ?? 0;
    loyaltyDelta += eff.loyaltyDelta ?? 0;
    defenseBonus += eff.defenseBonus ?? 0;
    troopCapMul += eff.troopCapMul ?? 0;
    badges.push(boost >= 0.5 ? `${eff.badge} ▲專營` : eff.badge);
  }

  return {
    goldMul, goldFlat, foodMul, loyaltyDelta,
    defenseBonus, troopCapMul, badges,
  };
}

/**
 * Compute combat effects for a side based on the officers participating.
 */
export function combatPolicyEffects(
  sideOfficers: Officer[],
  context?: { weather?: string; terrain?: CombatTerrain },
): CombatPolicyEffects {
  const pol = aggregatePolicies(sideOfficers);
  let attackMul = 1, defenseMul = 1, fireMul = 1, rangedMul = 1, moraleFloor = 0;
  const badges: string[] = [];
  const onWater = context?.terrain === 'naval' || context?.terrain === 'river';

  for (const [id, eff] of Object.entries(COMBAT_POLICY_EFFECTS) as Array<[PolicyId, CombatPolicyEffect]>) {
    if (!pol.has(id)) continue;
    // Terrain-gated doctrines only fire on matching ground.
    if (eff.terrain && (!context?.terrain || !eff.terrain.includes(context.terrain))) continue;
    // Naval-fireships: stronger on water, weaker on land — but always fires.
    if (eff.waterFireMul != null) {
      if (onWater) { fireMul += eff.waterFireMul; badges.push(eff.waterBadge ?? eff.badge); }
      else { fireMul += eff.fireMul ?? 0; badges.push(eff.badge); }
      continue;
    }
    attackMul += eff.attackMul ?? 0;
    defenseMul += eff.defenseMul ?? 0;
    fireMul += eff.fireMul ?? 0;
    rangedMul += eff.rangedMul ?? 0;
    if (eff.moraleFloor != null) moraleFloor = Math.max(moraleFloor, eff.moraleFloor);
    badges.push(eff.badge);
  }

  return { attackMul, defenseMul, moraleFloor, fireMul, rangedMul, badges };
}

/**
 * Recruitment-related effects. Used when searching for talent or recruiting troops.
 */
export function recruitmentPolicyEffects(forceOfficers: Officer[]): {
  searchSuccessBonus: number;  // additive % to search success
  recruitTroopMul: number;     // multiplier on troops gained per recruit action
  badges: string[];
} {
  const pol = aggregatePolicies(forceOfficers);
  let searchSuccessBonus = 0, recruitTroopMul = 1;
  const badges: string[] = [];
  for (const [id, eff] of Object.entries(RECRUIT_POLICY_EFFECTS) as Array<[PolicyId, RecruitPolicyEffect]>) {
    if (!pol.has(id)) continue;
    searchSuccessBonus += eff.searchSuccessBonus ?? 0;
    recruitTroopMul += eff.recruitTroopMul ?? 0;
    if (eff.badge) badges.push(eff.badge);
  }
  return { searchSuccessBonus, recruitTroopMul, badges };
}
