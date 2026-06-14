import type { City, Officer, Season, TaxRate, EntityId, DiplomaticState } from '../types';
import { getRelation } from '../types';
import { cityPolicyEffects } from './policyEffects';
import { citySize, populationDelta } from './citySize';
import { aggregateSlotEffects } from '../data/defenseBuildings';
import { effectivePrestigeEffects } from '../data/prestige';
import { specialtyEconomy } from '../data/specialties';

export const FOOD_PER_TROOP_PER_SEASON = 0.25;

/** 通商歲入 — gold each party to a trade treaty earns per season. */
export const TRADE_INCOME_PER_TREATY = 200;

/**
 * 通商條約 — for each of the player's trade treaties that's still at peace
 * (allied or under a non-aggression pact), BOTH the player and the partner earn
 * a steady commerce income. Returns a forceId → gold map to credit to capitals.
 * A treaty falls dormant during open war (neutral status) and revives at peace.
 */
export function tradeTreatyGrants(
  tradePartners: EntityId[],
  diplomacy: DiplomaticState,
  playerForceId: EntityId,
): Record<EntityId, number> {
  const grants: Record<EntityId, number> = {};
  for (const partnerId of tradePartners) {
    const rel = getRelation(diplomacy, playerForceId, partnerId);
    if (rel.status === 'allied' || rel.status === 'non-aggression') {
      grants[playerForceId] = (grants[playerForceId] ?? 0) + TRADE_INCOME_PER_TREATY;
      grants[partnerId] = (grants[partnerId] ?? 0) + TRADE_INCOME_PER_TREATY;
    }
  }
  return grants;
}

/** 稅率之效 — 輕稅得民心而少入,重稅厚斂而失心。'normal' is the historical
 *  baseline, so an untouched force (and every AI) behaves exactly as before. */
export const TAX_EFFECT: Record<TaxRate, { goldMul: number; loyalty: number; zh: string; en: string }> = {
  light:  { goldMul: 0.7, loyalty: 2,  zh: '輕稅', en: 'Light' },
  normal: { goldMul: 1.0, loyalty: 0,  zh: '常稅', en: 'Normal' },
  heavy:  { goldMul: 1.4, loyalty: -3, zh: '重稅', en: 'Heavy' },
};

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
  tax: TaxRate = 'normal',
  inflation = 0,
): CityEconomyTick {
  const eff = cityPolicyEffects(city, cityOfficers);
  const taxEff = TAX_EFFECT[tax] ?? TAX_EFFECT.normal;
  // 通貨膨脹 — debased coin buys less; tax income shrinks up to −40% at peak.
  const inflationMul = 1 - Math.max(0, Math.min(100, inflation)) / 250;
  const size = citySize(city);
  // 特產／名產 — a salt town, horse market or brocade workshop trades richer;
  // a rice basin harvests heavier. A small permanent regional edge.
  const spec = specialtyEconomy(city.id);

  // 稅入基數 — divisor lowered 5000→4000 (≈ +25% gold across the board) to
  // ease the early-game cash crunch. Applies to every force, AI included.
  const baseGold = Math.floor(city.commerce * (city.population / 4000));
  // 能臣/良吏/巨賈 prestige — the ablest administrator present fattens the coffers.
  const prestigeMul = cityOfficers.reduce((m, o) => Math.max(m, effectivePrestigeEffects(o).incomeMul), 1);
  const goldIncome = Math.max(0, Math.floor((baseGold * eff.goldMul * size.goldMul * prestigeMul * spec.goldMul + eff.goldFlat) * taxEff.goldMul * inflationMul));

  const baseFood =
    season === 'autumn'
      ? Math.floor(city.agriculture * (city.population / 1000))
      : 0;
  // 糧倉 (granary-out) lays in extra stores at the autumn harvest — feeds the
  // garrison and staves off starvation desertion under siege.
  const granaryFood = season === 'autumn'
    ? aggregateSlotEffects(city.buildSlots ?? []).extraFood
    : 0;
  const foodIncome = Math.floor(baseFood * eff.foodMul * size.foodMul * spec.foodMul) + granaryFood;

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
    loyaltyDelta: eff.loyaltyDelta + taxEff.loyalty,
    populationDelta: popDelta,
    policyBadges: taxEff.loyalty !== 0 ? [...eff.badges, taxEff.zh] : eff.badges,
  };
}
