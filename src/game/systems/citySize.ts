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
 *   都 Metropolis  160k–280k
 *   京 Capital     280k+
 *
 * (Display names only — the tier ids 'large'/'capital' are save/data keys
 * and stay as-is.)
 */
import type { City, Force, EntityId } from '../types';

export type CitySize = 'hamlet' | 'town' | 'city' | 'large' | 'capital';

export interface CitySizeDef {
  id: CitySize;
  /** Population threshold to qualify for this tier. */
  popMin: number;
  /** Display name. */
  name: { zh: string; en: string };
  /** Cap on defense (walls don't grow without bound). */
  statCap: number;
  /** Cap on agriculture & commerce — higher, so a developed city becomes
   *  a true economic powerhouse; tiered with city size. */
  econCap: number;
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
    statCap: 60, econCap: 90, loyaltyCap: 100, troopCap: 15000,
    goldMul: 0.85, foodMul: 0.85, buildingSlots: 12,
    color: '#7a7050',
  },
  {
    id: 'town', popMin: 30000,
    name: { zh: '鎮', en: 'Town' },
    statCap: 80, econCap: 140, loyaltyCap: 100, troopCap: 40000,
    goldMul: 1.0, foodMul: 1.0, buildingSlots: 19,
    color: '#a89868',
  },
  {
    id: 'city', popMin: 80000,
    name: { zh: '城', en: 'City' },
    statCap: 100, econCap: 190, loyaltyCap: 100, troopCap: 85000,
    goldMul: 1.15, foodMul: 1.15, buildingSlots: 28,
    color: '#c0a878',
  },
  {
    id: 'large', popMin: 160000,
    name: { zh: '都', en: 'Metropolis' },
    statCap: 130, econCap: 250, loyaltyCap: 100, troopCap: 140000,
    goldMul: 1.35, foodMul: 1.30, buildingSlots: 35,
    color: '#d4a84a',
  },
  {
    id: 'capital', popMin: 280000,
    name: { zh: '京', en: 'Capital' },
    statCap: 160, econCap: 320, loyaltyCap: 100, troopCap: 250000,
    goldMul: 1.60, foodMul: 1.50, buildingSlots: 44,
    color: '#f0e0b0',
  },
];

export const CITY_SIZES_BY_ID: Record<CitySize, CitySizeDef> = Object.fromEntries(
  CITY_SIZES.map((s) => [s.id, s]),
) as Record<CitySize, CitySizeDef>;

/** 向心 — the realm's seat of power (首都/治所) is the most loyal: this much extra
 *  民忠 accrues there each season. Counterweight: losing it shocks the realm. */
export const CAPITAL_LOYALTY_BONUS = 3;

/** 失都動搖 — loyalty lost across every remaining city when a force's capital
 *  (治所) is taken and the court must relocate. */
export const LOST_CAPITAL_LOYALTY_PENALTY = 8;

/** Returns the city's current size tier (auto-derived from population).
 *  京師特例 — the city hosting the Han emperor (`imperialSeat`) is always 京:
 *  許都 outranked its census because the court sat there. The rank travels
 *  with the emperor (奉迎天子), so losing him drops the city back to its
 *  population tier. */
export function citySize(city: City): CitySizeDef {
  if (city.imperialSeat) return CITY_SIZES[CITY_SIZES.length - 1];
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

/** Agriculture & commerce cap (higher than the defense cap). */
export function cityEconCap(city: City): number {
  return citySize(city).econCap;
}

/** Rank of a size tier (0 = 邑 … 4 = 京). */
export function citySizeRank(id: CitySize): number {
  return CITY_SIZES.findIndex((s) => s.id === id);
}

/** True if the city is at least `min` tier (used to gate buildings/commands). */
export function cityMeetsSize(city: City, min: CitySize): boolean {
  return citySizeRank(citySize(city).id) >= citySizeRank(min);
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
 * 失都遷治 — after conquests this season, any force whose capital (治所) is no
 * longer in its hands relocates its seat to its largest surviving city. Returns
 * the (possibly new) forces map plus a list of the forces that lost their seat,
 * so the caller can apply the 民心動搖 morale shock and log it. Forces with no
 * cities left are left untouched (elimination is handled elsewhere).
 */
export function reassignLostCapitals(
  forces: Record<EntityId, Force>,
  cities: Record<EntityId, City>,
): {
  forces: Record<EntityId, Force>;
  lost: { forceId: EntityId; oldCapitalId: EntityId; newCapitalId: EntityId }[];
} {
  const next = { ...forces };
  const lost: { forceId: EntityId; oldCapitalId: EntityId; newCapitalId: EntityId }[] = [];
  let changed = false;
  for (const f of Object.values(forces)) {
    const cap = cities[f.capitalCityId];
    if (cap && cap.ownerForceId === f.id) continue; // seat still held
    const owned = Object.values(cities)
      .filter((c) => c.ownerForceId === f.id && !c.ruined)
      .sort((a, b) => b.population - a.population);
    const newCap = owned[0];
    if (!newCap || newCap.id === f.capitalCityId) continue;
    next[f.id] = { ...f, capitalCityId: newCap.id };
    lost.push({ forceId: f.id, oldCapitalId: f.capitalCityId, newCapitalId: newCap.id });
    changed = true;
  }
  return { forces: changed ? next : forces, lost };
}

/**
 * 承載力 — how many people a city can feed and house. Set by farmland
 * (agriculture) plus civic works (安民坊/水利, via `growthAdd`). Population grows
 * toward this ceiling and stalls (then bleeds) once it overshoots — so reaching
 * 都/京 is an investment in agriculture, not just patience.
 *
 * Caps are deliberately generous: a city with solid farms (農業 ~55+) clears the
 * 京 threshold (280k), and a maxed agricultural powerhouse can swell past 600k.
 */
export function cityCarryingCapacity(city: City, growthAdd = 0): number {
  // 30k floor (a hamlet survives on little) + ~1,500 souls per point of 農業.
  // Tuned to the size-tier table (京 = 280k) so the ceiling stays believable
  // (RoTK-scale, not runaway): a heavily-developed city (農業 ~167) reaches 京,
  // and even a maxed agricultural metropolis tops out well under a million.
  const base = 30000 + city.agriculture * 1500;
  // 安民坊/水利 lift the ceiling further (up to +30%).
  const civicMul = 1 + Math.min(0.3, growthAdd * 6);
  return Math.floor(base * civicMul);
}

/**
 * Each season, population drifts based on loyalty + food surplus, damped by how
 * close the city is to its 承載力 (carrying capacity). High loyalty + food
 * surplus → growth toward the ceiling; low loyalty or famine → shrink.
 * Overshooting the ceiling triggers emigration back toward it.
 */
export function populationDelta(city: City, foodSurplus: number, growthAdd = 0): number {
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

  const capacity = cityCarryingCapacity(city, growthAdd);
  const fill = capacity > 0 ? city.population / capacity : 1;
  // Logistic damping: growth tapers to 0 as the city fills its carrying
  // capacity, so farmland (not time) sets how big a city can get.
  const room = Math.max(0, 1 - fill);

  let effectiveRate: number;
  if (rate > 0) {
    // 安民坊 — civic works add a small flat growth bonus on top, also damped.
    effectiveRate = (rate + growthAdd) * room;
  } else {
    // Famine/revolt shrink regardless of headroom — a collapsing city empties.
    effectiveRate = rate;
  }
  // Overpopulation — past the ceiling, the surplus drifts away (emigration).
  if (fill > 1) effectiveRate += (1 - fill) * 0.03;

  return Math.floor(city.population * effectiveRate);
}
