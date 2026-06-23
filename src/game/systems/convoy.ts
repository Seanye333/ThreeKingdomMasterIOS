import type { City, EntityId, Officer } from '../types';
import { FOOD_PER_TROOP_PER_SEASON } from './economy';
import { WARHORSE_CITY_CAP } from './market';

/* ─── 押運武将 — a convoy is run by an officer, and his measure decides how
   much it can haul and how fast. 政治 (administration) sets the load a column
   can manage; 政治 + 性情 (traits) set its pace. ──────────────────────────── */

const CONVOY_CAP_BASE = 3000;
const CONVOY_CAP_PER_POL = 220;

/** Most a single officer can shepherd in one column (food + gold + troops). */
export function convoyCapacity(officer: Officer): number {
  return CONVOY_CAP_BASE + Math.max(0, officer.stats.politics) * CONVOY_CAP_PER_POL;
}

/** Travel-time multiplier (lower = faster). A capable, diligent quartermaster
 *  moves a column briskly; a poor or idle one dawdles. Clamped 0.65–1.4×. */
export function convoySpeedMul(officer: Officer): number {
  let mul = 1 - (officer.stats.politics - 50) * 0.004;
  const traits = officer.traits ?? [];
  if (traits.includes('diligent' as never)) mul -= 0.12;
  if (traits.includes('lazy' as never)) mul += 0.18;
  if (traits.includes('cautious' as never)) mul += 0.08;
  if (traits.includes('reckless' as never)) mul -= 0.06;
  return Math.max(0.65, Math.min(1.4, mul));
}

/**
 * Resolve a haul's travel time and road-loss from the route + modifiers — the
 * single source of truth shared by the dispatch action and the UI's ETA
 * preview (so what the player is quoted is exactly what they get).
 */
export function planConvoy(opts: {
  baseSeasons: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  officer?: Officer;
  naval?: boolean;
  woodenOx?: boolean;
  cautious?: boolean;
}): { seasons: number; keepFrac: number } {
  const base = Math.max(1, opts.baseSeasons);
  let lossFrac = Math.min(0.4, 0.06 * (base - 1));
  if (opts.season === 'winter') lossFrac += 0.04;
  if (opts.naval) lossFrac *= 0.5;
  if (opts.woodenOx) lossFrac *= 0.5;
  lossFrac = Math.max(0, Math.min(0.5, lossFrac));
  let seasons = base;
  if (opts.naval) seasons = Math.round(seasons * 0.7);
  if (opts.woodenOx) seasons = Math.round(seasons * 0.6);
  if (opts.officer) seasons = Math.max(1, Math.round(seasons * convoySpeedMul(opts.officer)));
  if (opts.cautious) seasons += 1;
  return { seasons: Math.max(1, seasons), keepFrac: 1 - lossFrac };
}

/** 隨軍糧 — grain a column needs to march its whole planned journey. */
export function provisionNeeded(troops: number, totalSeasons: number): number {
  return Math.ceil(troops * FOOD_PER_TROOP_PER_SEASON * Math.max(1, totalSeasons));
}

/** Spend one season's rations. With enough grain the column just eats; out of
 *  grain it sheds ~10% of its men to desertion and ends the season empty. */
export function consumeRations(food: number, troops: number): { food: number; troops: number; starved: boolean } {
  const consume = Math.ceil(troops * FOOD_PER_TROOP_PER_SEASON);
  if (food >= consume) return { food: food - consume, troops, starved: false };
  return { food: 0, troops: Math.max(0, troops - Math.ceil(troops * 0.1)), starved: true };
}

/**
 * 輜重 — a non-combat supply convoy (運糧車/運金車) crawling the map between two
 * of a force's cities, carrying grain and/or coin. It steps like an army and,
 * on arrival, empties its cargo into the destination city. The road loss (if
 * any) is already taken at dispatch, so what it carries is what arrives.
 */
export interface Convoy {
  id: EntityId;
  forceId: EntityId;
  /** 押運武将 — the officer escorting the column (travels with it). Set on a
   *  player's manual haul; absent on background auto-supply (AI relief,
   *  standing routes), which move as small unled caravans. */
  officerId?: EntityId;
  fromCityId: EntityId;
  toCityId: EntityId;
  /** Cargo as it will ARRIVE. */
  food: number;
  gold: number;
  /** 援兵 — soldiers ferried to reinforce the destination's garrison. */
  troops: number;
  /** 戰馬 — warhorses shipped from horse-country to stable at the destination. */
  warhorses?: number;
  seasonsRemaining: number;
  totalSeasons: number;
  /** 漕運 — shipped by sea/river between linked ports: faster, less spoilage,
   *  and rendered as a junk gliding the water rather than an ox-cart. */
  naval?: boolean;
  /** 謹慎避敵 — took the cautious back-roads: one extra season, but far less
   *  likely to be raided. */
  cautious?: boolean;
}

export interface ConvoyStepResult {
  convoys: Record<EntityId, Convoy>;
  cities: Record<EntityId, City>;
  arrivals: Array<{ convoy: Convoy; toName: string }>;
  /** Columns whose destination was lost mid-haul — cargo (and escort) forfeited. */
  forfeited: Convoy[];
}

/**
 * Advance every convoy by one season and deliver the cargo of those that
 * arrive — but only if the destination is still held by the convoy's force; a
 * city lost mid-haul forfeits the load (the column is captured or scattered).
 */
export function stepConvoys(
  convoys: Record<EntityId, Convoy>,
  cities: Record<EntityId, City>,
): ConvoyStepResult {
  const nextConvoys: Record<EntityId, Convoy> = {};
  let nextCities = cities;
  const arrivals: ConvoyStepResult['arrivals'] = [];
  const forfeited: Convoy[] = [];
  for (const c of Object.values(convoys)) {
    const remaining = c.seasonsRemaining - 1;
    if (remaining > 0) {
      nextConvoys[c.id] = { ...c, seasonsRemaining: remaining };
      continue;
    }
    const dest = nextCities[c.toCityId];
    if (dest && dest.ownerForceId === c.forceId) {
      const horses = c.warhorses ?? 0;
      nextCities = {
        ...nextCities,
        [c.toCityId]: {
          ...dest,
          food: dest.food + c.food,
          gold: dest.gold + c.gold,
          troops: dest.troops + c.troops,
          ...(horses > 0 ? { warhorses: Math.min(WARHORSE_CITY_CAP, (dest.warhorses ?? 0) + horses) } : {}),
        },
      };
      arrivals.push({ convoy: c, toName: dest.name.zh });
    } else {
      forfeited.push(c); // destination lost mid-haul — column captured/scattered
    }
  }
  return { convoys: nextConvoys, cities: nextCities, arrivals, forfeited };
}

export interface ConvoyRaidResult {
  convoys: Record<EntityId, Convoy>;
  raids: Array<{ convoy: Convoy; repelled: boolean; toName: string; raiderCityId?: EntityId }>;
}

/**
 * 劫糧道 — resolve raids on in-transit convoys. `dangers` maps a convoy id to
 * the raid strength bearing down on it this season (absent/0 ⇒ safe). The
 * troops a convoy carries double as its escort: an escort that matches or
 * outnumbers the raiders beats them off (bloodied, −20%); a weaker or absent
 * escort means the whole column — cargo and all — is lost (烏巢之鑑).
 */
export function resolveConvoyRaids(
  convoys: Record<EntityId, Convoy>,
  dangers: Record<EntityId, number>,
  cities: Record<EntityId, City>,
  raiders: Record<EntityId, EntityId> = {},
): ConvoyRaidResult {
  const next: Record<EntityId, Convoy> = {};
  const raids: ConvoyRaidResult['raids'] = [];
  for (const c of Object.values(convoys)) {
    const strength = dangers[c.id] ?? 0;
    const toName = cities[c.toCityId]?.name.zh ?? '?';
    const raiderCityId = raiders[c.id];
    if (strength <= 0) {
      next[c.id] = c;
    } else if (c.troops >= strength) {
      next[c.id] = { ...c, troops: Math.max(0, c.troops - Math.floor(c.troops * 0.2)) };
      raids.push({ convoy: c, repelled: true, toName, raiderCityId });
    } else {
      raids.push({ convoy: c, repelled: false, toName, raiderCityId });
    }
  }
  return { convoys: next, raids };
}
