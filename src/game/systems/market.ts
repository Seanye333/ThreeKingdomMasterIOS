/**
 * 市易 — the grain market. Every city quotes its own price for food,
 * moved by season (autumn glut, winter dearth), local scarcity (a
 * garrison eating through its stores pays through the nose) and how
 * developed the commerce pillar is (merchants compete; rates improve).
 * Buy low after harvest, sell into a siege economy — or just convert
 * between the two resources when one runs short.
 *
 * Rates are food-per-gold; the merchant takes a spread both ways.
 */
import type { City, Season } from '../types';

/** Food received for 1 gold at neutral conditions. */
export const BASE_FOOD_RATE = 10;
/** The merchant's cut on every trade. */
export const TRADE_SPREAD = 0.1;

const SEASON_MOD: Record<Season, number> = {
  spring: 0.95, // planting — stores thinning
  summer: 1.05,
  autumn: 1.3,  // harvest glut — grain is cheap
  winter: 0.7,  // dearth — grain is dear
};

/** Food per gold at this city, this season. Higher = cheaper grain. */
export function foodRate(city: City, season: Season): number {
  let rate = BASE_FOOD_RATE * SEASON_MOD[season];
  // Scarcity: stores vs mouths. A garrison outpacing its granary drives
  // the price up (rate down); a glut drives it down.
  const need = Math.max(1, city.troops * 2);
  if (city.food < need) rate *= 0.6;
  else if (city.food > city.troops * 8) rate *= 1.25;
  // Developed commerce = competing merchants = better quotes.
  rate *= 1 + city.commerce / 400;
  return Math.max(4, Math.min(22, rate));
}

/** Food received for spending `gold` (after the spread). */
export function buyQuote(city: City, season: Season, gold: number): number {
  return Math.floor(gold * foodRate(city, season) * (1 - TRADE_SPREAD));
}

/** Gold received for selling `food` (after the spread). */
export function sellQuote(city: City, season: Season, food: number): number {
  return Math.floor((food / foodRate(city, season)) * (1 - TRADE_SPREAD));
}
