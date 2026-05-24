import type {
  City,
  Command,
  DiplomaticState,
  EntityId,
  Force,
  GameDate,
  Officer,
  ReportEntry,
  SeasonReport,
} from '../types';
import { OATH_BONDS, type OathBond } from '../data/bonds';
import { advanceSeason } from '../state/gameState';
import { processAging } from './aging';
import { handleSearch, resolveInternalAffairs, type LostItemRef } from './commands';
import { handleMarch } from './combat';
import { tickDiplomacy } from './diplomacy';
import { tickCityEconomy } from './economy';
import { rollEvents } from './events';

export interface ResolutionInput {
  date: GameDate;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  pendingCommands: Record<EntityId, Command>;
  diplomacy: DiplomaticState;
  runtimeBonds: OathBond[];
  lostItems: LostItemRef[];
  rng?: () => number;
  weather?: import('./weather').Weather;
  /**
   * True when this period transition crosses a season boundary (every 9
   * periods). Per-season ticks (economy, harvest, plague, etc.) only fire
   * when this is true. Defaults to true for backward compat.
   */
  seasonBoundary?: boolean;
}

export interface ResolutionOutput {
  date: GameDate;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  diplomacy: DiplomaticState;
  lostItems: LostItemRef[];
  report: SeasonReport;
  /** Pending delayed effects from stratagems (e.g. 截糧 troop drain). */
  delayedEffects?: Array<{ targetCityId?: EntityId; seasons: number; perSeason: number }>;
}

export function resolveSeason(input: ResolutionInput): ResolutionOutput {
  const rng = input.rng ?? Math.random;
  let cities: Record<EntityId, City> = { ...input.cities };
  let officers: Record<EntityId, Officer> = { ...input.officers };
  let forces: Record<EntityId, Force> = { ...input.forces };
  let lostItems: LostItemRef[] = [...input.lostItems];
  const entries: ReportEntry[] = [];

  // 1. Process commands. Marches first, then internal affairs.
  const allCmds = Object.values(input.pendingCommands);
  const marches = allCmds.filter((c): c is Extract<Command, { type: 'march' }> =>
    c.type === 'march',
  );
  const internals = allCmds.filter((c) => c.type !== 'march');

  const delayedEffects: Array<{ targetCityId?: EntityId; seasons: number; perSeason: number }> = [];
  for (const cmd of marches) {
    const outcome = handleMarch(cmd, {
      cities,
      officers,
      rng,
      weather: input.weather,
      delayedEffectsOut: delayedEffects,
    });
    cities = outcome.cities;
    officers = outcome.officers;
    entries.push(...outcome.entries);
  }

  for (const cmd of internals) {
    const officer = officers[cmd.officerId];
    const city = cities[cmd.cityId];
    if (!officer || !city) continue;
    if (officer.status !== 'idle') continue;
    if (cmd.type === 'search') {
      const result = handleSearch({ officer, city, officers, lostItems, rng });
      officers = result.officers;
      lostItems = result.lostItems;
      entries.push(result.entry);
      continue;
    }
    const result = resolveInternalAffairs(cmd.type, officer, city, rng);
    cities[city.id] = applyDelta(city, result.delta);
    entries.push({
      cityId: city.id,
      kind: result.success ? 'command-success' : 'command-failure',
      text: result.message,
    });
  }

  const seasonBoundary = input.seasonBoundary ?? true;

  // 2. Economy tick per city — only on season boundary (every 9 periods).
  if (seasonBoundary)
  for (const city of Object.values(cities)) {
    // Gather officers stationed in this city for policy effect aggregation.
    const cityOfficers = Object.values(officers).filter(
      (o) => o.locationCityId === city.id && o.status !== 'dead' && o.status !== 'unsearched',
    );
    const tick = tickCityEconomy(city, input.date.season, cityOfficers);
    const updated: City = {
      ...city,
      gold: city.gold + tick.goldIncome,
      food: Math.max(0, city.food + tick.foodIncome - tick.foodUpkeep),
      troops: Math.max(0, city.troops - tick.desertion),
      loyalty: Math.max(0, Math.min(100, city.loyalty + tick.loyaltyDelta)),
      population: Math.max(1000, city.population + tick.populationDelta),
    };
    cities[city.id] = updated;
    if (tick.populationDelta !== 0) {
      entries.push({
        cityId: city.id,
        kind: tick.populationDelta > 0 ? 'income' : 'desertion',
        text: `${city.name.en}: 人口 ${tick.populationDelta > 0 ? '+' : ''}${tick.populationDelta.toLocaleString()}.`,
      });
    }

    if (tick.goldIncome > 0 || tick.foodIncome > 0) {
      entries.push({
        cityId: city.id,
        kind: 'income',
        text: `${city.name.en}: +${tick.goldIncome} gold${
          tick.foodIncome ? `, +${tick.foodIncome} food (harvest)` : ''
        }${tick.policyBadges.length ? ` · ${tick.policyBadges.slice(0, 2).join(' · ')}` : ''}.`,
      });
    }
    if (tick.loyaltyDelta !== 0) {
      entries.push({
        cityId: city.id,
        kind: tick.loyaltyDelta > 0 ? 'income' : 'desertion',
        text: `${city.name.en}: 民忠 ${tick.loyaltyDelta > 0 ? '+' : ''}${tick.loyaltyDelta} (policy effect).`,
      });
    }
    if (tick.foodUpkeep > 0) {
      entries.push({
        cityId: city.id,
        kind: 'upkeep',
        text: `${city.name.en}: −${tick.foodUpkeep} food (troop upkeep).`,
      });
    }
    if (tick.desertion > 0) {
      entries.push({
        cityId: city.id,
        kind: 'desertion',
        text: `${city.name.en}: ${tick.desertion} troops deserted from starvation.`,
      });
    }
  }

  // 3. Reset officer tasks + loyalty drift toward force strength.
  // Compute per-force city counts once.
  const cityCountByForce: Record<EntityId, number> = {};
  let totalCities = 0;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId) {
      cityCountByForce[c.ownerForceId] =
        (cityCountByForce[c.ownerForceId] ?? 0) + 1;
      totalCities++;
    }
  }
  const avgCities =
    totalCities / Math.max(1, Object.keys(cityCountByForce).length);

  // Oath bonds are imported from data/bonds.ts.

  for (const o of Object.values(officers)) {
    let next: Officer = o.task ? { ...o, task: null } : o;
    if (o.forceId && o.status === 'idle') {
      const owned = cityCountByForce[o.forceId] ?? 0;
      let drift = 0;
      if (owned > avgCities + 1) drift = 1;
      else if (owned < avgCities - 1) drift = -1;
      else if (owned === 0) drift = -3;
      if (drift !== 0) {
        const newLoyalty = Math.max(0, Math.min(100, o.loyalty + drift));
        if (newLoyalty !== o.loyalty) {
          next = { ...next, loyalty: newLoyalty };
        }
      }
    }
    if (next !== o) officers[o.id] = next;
  }

  // Apply oath-bond loyalty floors (after drift, so bonds always win).
  // Includes both static historical bonds and runtime marriage bonds.
  const allBonds = [...OATH_BONDS, ...input.runtimeBonds];
  for (const bond of allBonds) {
    const a = officers[bond.officerA];
    const b = officers[bond.officerB];
    if (
      a &&
      b &&
      a.forceId &&
      a.forceId === b.forceId &&
      a.status !== 'dead' &&
      b.status !== 'dead'
    ) {
      if (a.loyalty < bond.floor)
        officers[bond.officerA] = { ...a, loyalty: bond.floor };
      if (b.loyalty < bond.floor)
        officers[bond.officerB] = { ...b, loyalty: bond.floor };
    }
  }

  // Defection: officers with loyalty < 20 abandon their force and become
  // free agents in the city they currently reside in.
  for (const o of Object.values(officers)) {
    if (
      o.status === 'idle' &&
      o.forceId &&
      o.loyalty < 20 &&
      o.locationCityId &&
      cities[o.locationCityId]?.ownerForceId === o.forceId
    ) {
      // 40% chance per season once loyalty is below 20.
      if (rng() < 0.4) {
        const formerForce = forces[o.forceId];
        officers[o.id] = {
          ...o,
          forceId: null,
          loyalty: 50,
          task: null,
        };
        entries.push({
          cityId: o.locationCityId,
          kind: 'note',
          text: `${o.name.en} (${o.name.zh}) abandons ${formerForce?.name.en ?? 'their lord'} and walks away a free agent.`,
        });
      }
    }
  }

  // 4. Random events — only on season boundary.
  if (seasonBoundary) {
    const eventResult = rollEvents({
      season: input.date.season,
      cities,
      officers,
      rng,
    });
    cities = eventResult.cities;
    officers = eventResult.officers;
    entries.push(...eventResult.entries);
  }

  // 5. Aging — only at year boundary (winter → spring) + on season boundary.
  if (seasonBoundary && input.date.season === 'winter') {
    const aging = processAging({
      year: input.date.year,
      cities,
      officers,
      forces,
      rng,
    });
    cities = aging.cities;
    officers = aging.officers;
    forces = aging.forces;
    entries.push(...aging.entries);
  }

  // 6. Diplomacy tick (NAP expiry + relation decay on year transitions).
  const dip = tickDiplomacy({
    diplomacy: input.diplomacy,
    date: advanceSeason(input.date),
    isYearTransition: input.date.season === 'winter',
  });
  entries.push(...dip.entries);

  // 7. Advance date.
  const nextDate = advanceSeason(input.date);

  return {
    date: nextDate,
    cities,
    officers,
    forces,
    diplomacy: dip.diplomacy,
    lostItems,
    report: { date: { year: input.date.year, season: input.date.season }, entries },
    delayedEffects: delayedEffects.length > 0 ? delayedEffects : undefined,
  };
}

function applyDelta(
  city: City,
  delta: Partial<Pick<
    City,
    'agriculture' | 'commerce' | 'defense' | 'troops' | 'population' | 'loyalty'
  >>,
): City {
  return {
    ...city,
    agriculture: clamp(city.agriculture + (delta.agriculture ?? 0), 0, 100),
    commerce: clamp(city.commerce + (delta.commerce ?? 0), 0, 100),
    defense: clamp(city.defense + (delta.defense ?? 0), 0, 100),
    troops: Math.max(0, city.troops + (delta.troops ?? 0)),
    population: Math.max(0, city.population + (delta.population ?? 0)),
    loyalty: clamp(city.loyalty + (delta.loyalty ?? 0), 0, 100),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
