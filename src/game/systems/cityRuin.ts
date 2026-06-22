import type { City } from '../types';

/**
 * 焦土與重建 — scorched-earth denial and reconstruction. Pure transforms so
 * the store stays a thin caller and the maths is unit-testable.
 *
 * Razing guts a city: the populace scatters, markets burn, granaries empty,
 * the garrison is disbanded. A ruined city yields almost nothing (the economy
 * reads commerce/agriculture/population directly) and can't build until rebuilt.
 */
export function razedCity(city: City): City {
  return {
    ...city,
    ruined: true,
    population: Math.floor(city.population * 0.3),
    commerce: Math.max(1, Math.floor(city.commerce * 0.2)),
    agriculture: Math.max(1, Math.floor(city.agriculture * 0.2)),
    food: Math.floor(city.food * 0.3),
    troops: Math.floor(city.troops * 0.5),
    defense: Math.floor(city.defense * 0.3),
    loyalty: Math.max(20, city.loyalty - 30),
  };
}

/**
 * 兵燹 — a city that falls by storm loses people: siege dead, and townsfolk who
 * flee the sack toward kin in the countryside. Roughly a fifth of the populace
 * is lost outright; a portion of that flees as 流民 (the caller may resettle
 * them in an adjacent friendly city). So a hard-won metropolis is left scarred —
 * not instantly the prize it was — and may slip a size tier until it recovers.
 */
export const CONQUEST_POP_LOSS_FRAC = 0.2;
export const CONQUEST_REFUGEE_FRAC = 0.4; // of the lost, this share flees (rest perish/scatter)

export function conquestPopulationLoss(population: number): {
  survivors: number;
  lost: number;
  refugees: number;
} {
  const lost = Math.floor(population * CONQUEST_POP_LOSS_FRAC);
  const refugees = Math.floor(lost * CONQUEST_REFUGEE_FRAC);
  return { survivors: Math.max(1000, population - lost), lost, refugees };
}

export const REBUILD_BASE_COST = 800;

/** Gold to rebuild — scales gently with the (reduced) population to repopulate. */
export function rebuildCost(city: City): number {
  return REBUILD_BASE_COST + Math.floor(city.population / 100);
}

/**
 * Reconstruction kickstart: clears the ruin, repopulates by half, and floors
 * commerce/agriculture/defense back to workable levels. Natural growth then
 * carries the recovery the rest of the way.
 */
export function rebuiltCity(city: City): City {
  return {
    ...city,
    ruined: false,
    population: city.population + Math.floor(city.population * 0.5),
    commerce: Math.max(city.commerce, 35),
    agriculture: Math.max(city.agriculture, 35),
    defense: city.defense + 20,
    loyalty: Math.min(100, city.loyalty + 10),
  };
}
