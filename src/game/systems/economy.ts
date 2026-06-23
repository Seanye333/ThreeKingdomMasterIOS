import type { City, Officer, Season, TaxRate, EntityId, DiplomaticState, Building } from '../types';
import type { Appointment } from '../types/title';
import { getRelation } from '../types';
import { cityPolicyEffects } from './policyEffects';
import { buildingBonuses } from './buildings';
import { citySize, populationDelta } from './citySize';
import { aggregateSlotEffects } from '../data/defenseBuildings';
import { effectivePrestigeEffects } from '../data/prestige';
import { specialtyEconomy, CITY_SPECIALTY } from '../data/specialties';
import { officerGrade, gradeRank } from './officerGrade';
import { buildSpecialtyTradeRoutes } from './tradeRoutes';
import { appointmentBonusFor, totalStipendForForce } from './appointmentEffects';
import { peerageEffects } from '../data/peerage';
import type { WeatherKind } from './weather';

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
  /** 馬政 — warhorses bred this season (horse-country cities only; 0 elsewhere). */
  warhorseBreed: number;
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
  weatherKind: import('./weather').WeatherKind = 'clear',
  buildings: Building[] = [],
  statecraft: string | null = null,
): CityEconomyTick {
  const eff = cityPolicyEffects(city, cityOfficers);
  // 城內建築 — 市場/錢莊/常平倉/市舶司 fatten commerce; 屯田/水利/常平倉 the
  // harvest; 寺院/太學/安民坊 民忠; 水利 blunts drought; 安民坊 grows population.
  // 地利(specialty) + 理念(statecraft) further slant each building category.
  const bb = buildingBonuses(city.id, buildings, { statecraft });
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
  // 品階理政 — a high-品階 administrator runs a richer city: +3% gold per grade
  // tier above 銅 (金牌 ≈ +6%, 鑽石 ≈ +12%). Best officer present sets the tone.
  const gradeAdminMul = 1 + 0.03 * cityOfficers.reduce(
    (best, o) => Math.max(best, gradeRank(officerGrade(o).grade) - gradeRank('bronze')),
    0,
  );
  // 貪腐蝕利 — graft skims a slice off the top: clerks pad the books and pocket
  // the difference. Up to −40% at full corruption (100). Cleared by 巡查肅貪.
  const corruptionMul = 1 - Math.max(0, Math.min(100, city.corruption ?? 0)) / 250;
  const goldIncome = Math.max(0, Math.floor((baseGold * eff.goldMul * bb.commerceMul * size.goldMul * prestigeMul * gradeAdminMul * spec.goldMul + eff.goldFlat) * taxEff.goldMul * inflationMul * corruptionMul));

  const baseFood =
    season === 'autumn'
      ? Math.floor(city.agriculture * (city.population / 1000))
      : 0;
  // 糧倉 (granary-out) lays in extra stores at the autumn harvest — feeds the
  // garrison and staves off starvation desertion under siege.
  const granaryFood = season === 'autumn'
    ? aggregateSlotEffects(city.buildSlots ?? []).extraFood
    : 0;
  // 天時 — weather bends the harvest. A drought withers the autumn yield by
  // ~45%; steady rain swells it slightly; snow/wind are neutral. Only the
  // harvest season (autumn) carries a crop to lose.
  const harvestWeatherMul =
    weatherKind === 'drought' ? 0.55 + 0.45 * bb.droughtMitigation :
    weatherKind === 'rain' ? 1.1 :
    1;
  const foodIncome = Math.floor(baseFood * eff.foodMul * bb.agricultureMul * size.foodMul * spec.foodMul * harvestWeatherMul) + granaryFood;

  const foodUpkeep = Math.ceil(city.troops * FOOD_PER_TROOP_PER_SEASON);

  let desertion = 0;
  const netFood = city.food + foodIncome - foodUpkeep;
  if (netFood < 0) {
    desertion = Math.min(city.troops, Math.ceil(-netFood / FOOD_PER_TROOP_PER_SEASON));
  }

  // Population growth/shrink based on loyalty + food surplus (only on autumn harvest).
  const popDelta = season === 'autumn'
    ? populationDelta(city, foodIncome - foodUpkeep, bb.popGrowthAdd)
    : 0;

  // A drought stokes famine fear — the populace grows restive whatever the season.
  const droughtLoyalty = weatherKind === 'drought' ? -2 : 0;

  // 馬政 — horse-country cities breed warhorses each season; 馬廄/牧苑 (recruitMul)
  // and a settled populace swell the herd. Only owned, non-ruined horse-lands breed.
  let warhorseBreed = 0;
  if (city.ownerForceId && !city.ruined && CITY_SPECIALTY[city.id] === 'horse') {
    warhorseBreed = Math.round(40 * bb.recruitMul * (0.6 + city.loyalty / 200));
  }

  return {
    goldIncome, foodIncome, foodUpkeep, desertion,
    loyaltyDelta: eff.loyaltyDelta + taxEff.loyalty + droughtLoyalty + bb.loyaltyPerSeason,
    populationDelta: popDelta,
    policyBadges: taxEff.loyalty !== 0 ? [...eff.badges, taxEff.zh] : eff.badges,
    warhorseBreed,
  };
}

/** One city's line in the realm ledger. */
export interface RealmBudgetRow {
  city: City;
  gold: number;
  foodIn: number;
  foodUp: number;
  netFood: number;
  starving: boolean;
}

/**
 * 度支簿 — the realm's full season income statement for ONE force, netting the
 * tax/harvest the cities raise against the realm-level flows the season engine
 * actually applies: 通商條約 (trade treaties), 名產商路 (specialty routes),
 * 食邑 (peerage fiefs), 官署常俸 (civic-office yields) and 俸祿 (military
 * stipends). The same helpers resolution.ts uses, so the bottom line matches
 * what really happens at season-end — not a gross-income guess.
 */
export interface RealmBudget {
  rows: RealmBudgetRow[];
  treasury: { gold: number; food: number };
  /** Gold income/expense broken into ledger lines (stipend is a positive outflow). */
  goldLines: { tax: number; tradeTreaty: number; tradeRoute: number; fief: number; office: number; stipend: number };
  goldNet: number;
  /** Grain ledger lines (upkeep is a positive outflow). */
  foodLines: { harvest: number; fief: number; office: number; upkeep: number };
  foodNet: number;
  /** Seasons until the coffers run dry at the current burn (Infinity if net ≥ 0). */
  goldRunway: number;
  /** Seasons until grain stores run dry (Infinity if net ≥ 0). */
  foodRunway: number;
}

export interface RealmBudgetInput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forceId: EntityId;
  season: Season;
  tax: TaxRate;
  inflation: number;
  weatherKind: WeatherKind;
  buildings: Building[];
  tradePartners: EntityId[];
  diplomacy: DiplomaticState;
  appointments: Appointment[];
  statecraft?: string | null;
}

export function realmBudget(input: RealmBudgetInput): RealmBudget {
  const { cities, officers, forceId, season, tax, inflation, weatherKind, buildings, tradePartners, diplomacy, appointments } = input;

  const officersByCity: Record<string, Officer[]> = {};
  for (const o of Object.values(officers)) {
    if (!o.locationCityId || o.status === 'dead' || o.status === 'unsearched') continue;
    (officersByCity[o.locationCityId] ??= []).push(o);
  }

  const mine = Object.values(cities).filter((c) => c.ownerForceId === forceId);
  const rows: RealmBudgetRow[] = mine.map((c) => {
    const tick = tickCityEconomy(c, season, officersByCity[c.id] ?? [], tax, inflation, weatherKind, buildings, input.statecraft ?? null);
    const netFood = tick.foodIncome - tick.foodUpkeep;
    return { city: c, gold: tick.goldIncome, foodIn: tick.foodIncome, foodUp: tick.foodUpkeep, netFood, starving: c.food + netFood < 0 };
  }).sort((a, b) => b.gold - a.gold);

  const tax_ = rows.reduce((s, r) => s + r.gold, 0);
  const harvest = rows.reduce((s, r) => s + r.foodIn, 0);
  const upkeep = rows.reduce((s, r) => s + r.foodUp, 0);

  // 通商條約 — the player's standing trade treaties (their share only).
  const treatyGrants = tradeTreatyGrants(tradePartners, diplomacy, forceId);
  const tradeTreaty = treatyGrants[forceId] ?? 0;

  // 名產商路 — premium routes between same-owner adjacent cities, both endpoints credited.
  const tradeRoute = buildSpecialtyTradeRoutes(cities).reduce((s, r) => {
    const a = cities[r.cityAId];
    return a && a.ownerForceId === forceId ? s + r.baseIncome * 2 : s;
  }, 0);

  // 食邑 — enfeoffed nobles' fiefs pay rent (gold + grain) into the treasury.
  let fiefGold = 0, fiefGrain = 0;
  for (const o of Object.values(officers)) {
    if (o.forceId !== forceId || !o.peerageId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned') continue;
    const eff = peerageEffects(o);
    fiefGold += eff.fiefGold;
    fiefGrain += eff.fiefGrain;
  }

  // 官署常俸 — the 九卿/尚書台 ministries yield season coin & grain.
  const ab = appointmentBonusFor(forceId, appointments, officers);
  const officeGold = ab.goldPerSeason;
  const officeFood = ab.foodPerSeason;

  // 俸祿 — military stipends owed to every officer of the force.
  const stipend = totalStipendForForce(forceId, officers);

  const goldLines = { tax: tax_, tradeTreaty, tradeRoute, fief: fiefGold, office: officeGold, stipend };
  const goldNet = tax_ + tradeTreaty + tradeRoute + fiefGold + officeGold - stipend;

  const foodLines = { harvest, fief: fiefGrain, office: officeFood, upkeep };
  const foodNet = harvest + fiefGrain + officeFood - upkeep;

  const treasury = mine.reduce((acc, c) => ({ gold: acc.gold + c.gold, food: acc.food + c.food }), { gold: 0, food: 0 });

  return {
    rows,
    treasury,
    goldLines,
    goldNet,
    foodLines,
    foodNet,
    goldRunway: goldNet < 0 ? Math.floor(treasury.gold / -goldNet) : Infinity,
    foodRunway: foodNet < 0 ? Math.floor(treasury.food / -foodNet) : Infinity,
  };
}
