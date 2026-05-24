import type { City, Officer, Season } from '../types';
import { cityPolicyEffects } from './policyEffects';
import { citySize, populationDelta } from './citySize';

export const FOOD_PER_TROOP_PER_SEASON = 0.25;

export interface CityEconomyTick {
  goldIncome: number;
  foodIncome: number;
  foodUpkeep: number;
  desertion: number;
  loyaltyDelta: number;
  /** Population change this season (positive = growth, negative = shrink). */
  populationDelta: number;
  /** Brief badges to surface to the UI / report ("屯田 +25% 糧"). */
  policyBadges: string[];
}

/**
 * @param cityOfficers — officers currently located in this city. Their personal
 *                       policies aggregate into modifiers (gold +20%, +1 loyalty/season, etc.)
 */
export function tickCityEconomy(
  city: City,
  season: Season,
  cityOfficers: Officer[] = [],
): CityEconomyTick {
  const eff = cityPolicyEffects(city, cityOfficers);
  const size = citySize(city);

  const baseGold = Math.floor(city.commerce * (city.population / 5000));
  const goldIncome = Math.max(0, Math.floor(baseGold * eff.goldMul * size.goldMul + eff.goldFlat));

  const baseFood =
    season === 'autumn'
      ? Math.floor(city.agriculture * (city.population / 1000))
      : 0;
  const foodIncome = Math.floor(baseFood * eff.foodMul * size.foodMul);

  const foodUpkeep = Math.ceil(city.troops * FOOD_PER_TROOP_PER_SEASON);

  let desertion = 0;
  const netFood = city.food + foodIncome - foodUpkeep;
  if (netFood < 0) {
    desertion = Math.min(city.troops, Math.ceil(-netFood / FOOD_PER_TROOP_PER_SEASON));
  }

  // Population growth/shrink based on loyalty + food surplus (only on autumn harvest).
  const popDelta = season === 'autumn'
    ? populationDelta(city, foodIncome - foodUpkeep)
    : 0;

  return {
    goldIncome, foodIncome, foodUpkeep, desertion,
    loyaltyDelta: eff.loyaltyDelta,
    populationDelta: popDelta,
    policyBadges: eff.badges,
  };
}
