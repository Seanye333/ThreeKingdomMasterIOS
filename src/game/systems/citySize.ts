/**
 * City size tiers, in the Romance of the Three Kingdoms tradition.
 *
 * Population determines tier. Each tier raises the cap on development
 * stats (agriculture/commerce/defense/loyalty), scales raw income, and
 * dictates how much troops the city can sustain.
 *
 * Tiers (low → high):
 *   邑 Hamlet      <  30,000
 *   鎮 Town        30k–80k
 *   城 City        80k–160k
 *   大城 Large     160k–280k
 *   都 Capital     280k+
 */
import type { City } from '../types';

export type CitySize = 'hamlet' | 'town' | 'city' | 'large' | 'capital';

export interface CitySizeDef {
  id: CitySize;
  /** Population threshold to qualify for this tier. */
  popMin: number;
  /** Display name. */
  name: { zh: string; en: string };
  /** Cap on agriculture/commerce/defense. */
  statCap: number;
  /** Cap on loyalty (always 100). */
  loyaltyCap: 100;
  /** Cap on troop garrison (separates "城內" from "外駐"). */
  troopCap: number;
  /** Multiplier on the base gold income (1.0 = baseline). */
  goldMul: number;
  /** Multiplier on the base food (autumn) income. */
  foodMul: number;
  /** Building slot count. */
  buildingSlots: number;
  /** Color used by the badge. */
  color: string;
}

export const CITY_SIZES: CitySizeDef[] = [
  {
    id: 'hamlet', popMin: 0,
    name: { zh: '邑', en: 'Hamlet' },
    statCap: 60, loyaltyCap: 100, troopCap: 8000,
    goldMul: 0.85, foodMul: 0.85, buildingSlots: 4,
    color: '#7a7050',
  },
  {
    id: 'town', popMin: 30000,
    name: { zh: '鎮', en: 'Town' },
    statCap: 80, loyaltyCap: 100, troopCap: 20000,
    goldMul: 1.0, foodMul: 1.0, buildingSlots: 6,
    color: '#a89868',
  },
  {
    id: 'city', popMin: 80000,
    name: { zh: '城', en: 'City' },
    statCap: 100, loyaltyCap: 100, troopCap: 40000,
    goldMul: 1.15, foodMul: 1.15, buildingSlots: 8,
    color: '#c0a878',
  },
  {
    id: 'large', popMin: 160000,
    name: { zh: '大城', en: 'Large City' },
    statCap: 130, loyaltyCap: 100, troopCap: 70000,
    goldMul: 1.35, foodMul: 1.30, buildingSlots: 10,
    color: '#d4a84a',
  },
  {
    id: 'capital', popMin: 280000,
    name: { zh: '都', en: 'Capital' },
    statCap: 160, loyaltyCap: 100, troopCap: 120000,
    goldMul: 1.60, foodMul: 1.50, buildingSlots: 12,
    color: '#f0e0b0',
  },
];

export const CITY_SIZES_BY_ID: Record<CitySize, CitySizeDef> = Object.fromEntries(
  CITY_SIZES.map((s) => [s.id, s]),
) as Record<CitySize, CitySizeDef>;

/** Returns the city's current size tier (auto-derived from population). */
export function citySize(city: City): CitySizeDef {
  let best = CITY_SIZES[0];
  for (const s of CITY_SIZES) {
    if (city.population >= s.popMin) best = s;
  }
  return best;
}

/** Stat cap (agriculture/commerce/defense) for this city. */
export function cityStatCap(city: City): number {
  return citySize(city).statCap;
}

/** Population needed to reach the NEXT tier (or null if at top tier). */
export function nextTierPop(city: City): { def: CitySizeDef; popNeeded: number } | null {
  const current = citySize(city);
  const idx = CITY_SIZES.findIndex((s) => s.id === current.id);
  if (idx < 0 || idx >= CITY_SIZES.length - 1) return null;
  const next = CITY_SIZES[idx + 1];
  return { def: next, popNeeded: next.popMin - city.population };
}

/**
 * Each season, population drifts based on loyalty + food surplus.
 * High loyalty + food surplus → +0.5-2% growth. Low loyalty or famine → -1-3%.
 */
export function populationDelta(city: City, foodSurplus: number): number {
  // Loyalty 80+ contributes growth; below 40 contributes shrink.
  const loyaltyFactor =
    city.loyalty >= 80 ? 0.015 :
    city.loyalty >= 60 ? 0.008 :
    city.loyalty >= 40 ? 0.002 :
    city.loyalty >= 20 ? -0.005 :
    -0.012;
  // Food surplus (positive) helps; deficit hurts severely.
  const foodFactor =
    foodSurplus > city.population * 0.05 ? 0.005 :
    foodSurplus > 0 ? 0.002 :
    foodSurplus > -city.population * 0.05 ? -0.005 :
    -0.020;
  const rate = loyaltyFactor + foodFactor;
  return Math.floor(city.population * rate);
}
