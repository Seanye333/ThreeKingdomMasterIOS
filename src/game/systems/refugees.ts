import type { Building, City, EntityId, TaxRate } from '../types';
import { cityCarryingCapacity } from './citySize';
import { buildingBonuses } from './buildings';

/**
 * 流民 — a realm-agnostic pool of displaced people. Famine, unrest and war
 * uproot townsfolk (they don't simply vanish — they wander); each season the
 * pool drifts toward the most *welcoming* cities: high 民忠, light tax, and room
 * to grow (under 承載力). A prosperous, lightly-taxed realm thus passively
 * "poaches" the population that misrule elsewhere drives out.
 *
 * Pure + injectable so it stays unit-testable.
 */

/** How welcoming a city is to migrants by its tax burden. */
const TAX_ATTRACT: Record<TaxRate, number> = { light: 1.3, normal: 1.0, heavy: 0.6 };

/** Share of the standing pool that resettles each season (rest carries over). */
export const REFUGEE_SETTLE_FRAC = 0.5;
/** Share of a shrinking city's loss that becomes wandering 流民 (rest is gone). */
export const REFUGEE_SHED_FRAC = 0.5;
/** Per-season attrition on the un-resettled pool — refugees with nowhere to go
 *  eventually perish or disperse, so the pool stays bounded even when every city
 *  is full (no headroom to absorb them). */
export const REFUGEE_DECAY = 0.15;

/**
 * 流民之政 (§8.6) — what a realm DOES about the people arriving at its gates.
 *
 * The pool above already wanders toward whoever is least cruel. That is the
 * physics. This is the politics, and the period is unambiguous that it was a
 * politics: 招撫流民 built Cao Cao's 屯田 and Liu Bei's following; it also
 * imported famine, plague and banditry into towns that had neither.
 *
 *   招撫 (welcome) — throw the gates open. Twice the intake, and every city
 *                    that takes them pays for it in order and in disease.
 *   安置 (settle)  — the default: absorb what fits, quietly.
 *   閉關 (expel)   — turn them away at the gate. Your townsfolk approve; the
 *                    displaced go to your neighbour, along with their labour,
 *                    and 仁 is not what anyone will call you.
 */
export type RefugeePolicy = 'welcome' | 'settle' | 'expel';

export const REFUGEE_POLICIES: RefugeePolicy[] = ['welcome', 'settle', 'expel'];

export const REFUGEE_POLICY_NAMES: Record<RefugeePolicy, { zh: string; en: string; motto: string }> = {
  welcome: { zh: '招撫', en: 'Open the Gates', motto: '流民歸之如市' },
  settle:  { zh: '安置', en: 'Settle Quietly', motto: '量力而納' },
  expel:   { zh: '閉關', en: 'Turn Them Away', motto: '閉門不納' },
};

export interface RefugeePolicyEffects {
  /** Multiplier on how much of the pool this realm's cities absorb. */
  intakeMul: number;
  /** Per-season loyalty drift in every city that took migrants. */
  loyaltyDelta: number;
  /** Added plague weight in cities that took migrants (0–1 scale). */
  plagueRisk: number;
  /** Standing loyalty drift in ALL cities of the realm (locals' opinion). */
  realmLoyaltyDelta: number;
  badgeZh: string;
  badgeEn: string;
}

const POLICY_EFFECTS: Record<RefugeePolicy, RefugeePolicyEffects> = {
  welcome: {
    intakeMul: 2, loyaltyDelta: -2, plagueRisk: 0.35, realmLoyaltyDelta: 0,
    badgeZh: '納入 ×2 · 收容之城民心 −2/季、疫病風險大增 —— 人口與亂源一併進門',
    badgeEn: 'Intake ×2 · receiving cities −2 loyalty/season and far likelier plague',
  },
  settle: {
    intakeMul: 1, loyaltyDelta: 0, plagueRisk: 0, realmLoyaltyDelta: 0,
    badgeZh: '量力而納 —— 無得無失',
    badgeEn: 'Absorb what fits — no edge either way',
  },
  expel: {
    intakeMul: 0, loyaltyDelta: 0, plagueRisk: 0, realmLoyaltyDelta: 0.5,
    badgeZh: '寸民不納 · 全境民心 +0.5/季(鄉里稱便)· 流民盡歸鄰國,勞力與人望俱失',
    badgeEn: 'None admitted · +0.5 loyalty realm-wide · the displaced (and their labour) go next door',
  },
};

export function refugeePolicyEffects(policy: RefugeePolicy | undefined): RefugeePolicyEffects {
  return POLICY_EFFECTS[policy ?? 'settle'];
}

/** An AI lord's standing policy on the displaced, by temperament. */
export function aiRefugeePolicy(personality: string | undefined): RefugeePolicy {
  switch (personality) {
    case 'benevolent': case 'diplomat': return 'welcome';
    case 'tyrant': case 'defensive': return 'expel';
    default: return 'settle';
  }
}

export interface RefugeeSettleInput {
  pool: number;
  cities: Record<EntityId, City>;
  buildings: Building[];
  taxPolicy?: Record<EntityId, TaxRate>;
  /** 流民之政 (§8.6) — per-force policy; missing resolves to 安置. */
  policyOf?: (forceId: EntityId) => RefugeePolicy;
}

export interface RefugeeSettleOutput {
  pool: number;
  cities: Record<EntityId, City>;
  settled: { cityId: EntityId; count: number }[];
}

/**
 * Distribute part of the refugee pool into welcoming cities (weighted by
 * headroom × loyalty × low-tax). Returns the new pool, updated cities, and a
 * per-city settled tally for reporting.
 */
/** Apply per-season attrition to a leftover pool (bounds it when cities are full). */
const decay = (pool: number): number => Math.floor(pool * (1 - REFUGEE_DECAY));

export function settleRefugees(input: RefugeeSettleInput): RefugeeSettleOutput {
  const { pool, buildings, taxPolicy } = input;
  if (pool <= 0) return { pool: 0, cities: input.cities, settled: [] };

  // Score every owned, settled, not-overfull city.
  const candidates: { city: City; weight: number; headroom: number }[] = [];
  for (const city of Object.values(input.cities)) {
    if (city.ownerForceId == null || city.ruined) continue;
    if (city.loyalty < 50) continue; // a restive city repels migrants
    // 閉關 — a realm that bars its gates takes none, however welcoming its towns.
    const policy = input.policyOf?.(city.ownerForceId) ?? 'settle';
    const intake = refugeePolicyEffects(policy).intakeMul;
    if (intake <= 0) continue;
    const growthAdd = buildingBonuses(city.id, buildings).popGrowthAdd;
    const headroom = Math.max(0, cityCarryingCapacity(city, growthAdd) - city.population);
    if (headroom <= 0) continue;
    const loyaltyFactor = Math.max(0, Math.min(1, (city.loyalty - 40) / 60));
    const tax = taxPolicy?.[city.ownerForceId] ?? 'normal';
    const weight = headroom * loyaltyFactor * (TAX_ATTRACT[tax] ?? 1) * intake;
    if (weight <= 0) continue;
    candidates.push({ city, weight, headroom });
  }

  const totalWeight = candidates.reduce((s, c) => s + c.weight, 0);
  if (totalWeight <= 0) return { pool: decay(pool), cities: input.cities, settled: [] };

  const toDistribute = Math.floor(pool * REFUGEE_SETTLE_FRAC);
  if (toDistribute <= 0) return { pool: decay(pool), cities: input.cities, settled: [] };

  const cities = { ...input.cities };
  const settled: { cityId: EntityId; count: number }[] = [];
  let used = 0;
  for (const { city, weight, headroom } of candidates) {
    const share = Math.min(headroom, Math.floor((toDistribute * weight) / totalWeight));
    if (share <= 0) continue;
    cities[city.id] = { ...cities[city.id], population: cities[city.id].population + share };
    settled.push({ cityId: city.id, count: share });
    used += share;
  }

  return { pool: decay(pool - used), cities, settled };
}
