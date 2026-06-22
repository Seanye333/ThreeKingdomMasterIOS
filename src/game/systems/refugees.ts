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

export interface RefugeeSettleInput {
  pool: number;
  cities: Record<EntityId, City>;
  buildings: Building[];
  taxPolicy?: Record<EntityId, TaxRate>;
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
    const growthAdd = buildingBonuses(city.id, buildings).popGrowthAdd;
    const headroom = Math.max(0, cityCarryingCapacity(city, growthAdd) - city.population);
    if (headroom <= 0) continue;
    const loyaltyFactor = Math.max(0, Math.min(1, (city.loyalty - 40) / 60));
    const tax = taxPolicy?.[city.ownerForceId] ?? 'normal';
    const weight = headroom * loyaltyFactor * (TAX_ATTRACT[tax] ?? 1);
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
