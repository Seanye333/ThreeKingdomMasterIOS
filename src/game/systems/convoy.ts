import type { Army, City, EntityId, Officer } from '../types';
import { FOOD_PER_TROOP_PER_SEASON } from './economy';
import { WARHORSE_CITY_CAP, IRON_CITY_CAP, MEDICINE_CITY_CAP } from './market';

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
  // 嚴峻治軍 / 鐵律 / 健行 — a hard-driving, disciplined or tireless quartermaster
  // hustles the column along the road.
  if (traits.includes('stern' as never)) mul -= 0.10;
  if (traits.includes('tireless-march' as never)) mul -= 0.10;
  if (traits.includes('iron-discipline' as never)) mul -= 0.05;
  if (traits.includes('sleepy' as never)) mul += 0.08;
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
  /** 大工 (§1.15) — realm-wide convoy-loss multiplier from finished works
   *  (運渠 ×0.7, 馳道 ×0.8, both ×0.56). Default 1. */
  worksLossMul?: number;
}): { seasons: number; keepFrac: number } {
  const base = Math.max(1, opts.baseSeasons);
  let lossFrac = Math.min(0.4, 0.06 * (base - 1));
  if (opts.season === 'winter') lossFrac += 0.04;
  if (opts.naval) lossFrac *= 0.5;
  if (opts.woodenOx) lossFrac *= 0.5;
  lossFrac *= Math.max(0, Math.min(1, opts.worksLossMul ?? 1));
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
  /** 直供前線 — if set, the column is bound for a friendly FIELD ARMY (keyed by
   *  its commander id), not the city. `toCityId` then holds the army's objective
   *  city (used only for routing the march + reckoning road raids). On arrival the
   *  grain/troops empty into the army (relieving a siege / 孤軍深入); if the army is
   *  no longer afoot the load falls back to that city, or is forfeit if it fell. */
  toArmyId?: EntityId;
  /** Cargo as it will ARRIVE. */
  food: number;
  gold: number;
  /** 援兵 — soldiers ferried to reinforce the destination's garrison. */
  troops: number;
  /** 戰馬 — warhorses shipped from horse-country to stable at the destination. */
  warhorses?: number;
  /** 鐵 — iron shipped from iron-country to stock at the destination. */
  iron?: number;
  /** 藥材 — medicine shipped from herb-country to stock at the destination. */
  medicine?: number;
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
  /** Field armies after any direct-to-front deliveries (relieved sieges). */
  armies: Record<EntityId, Army>;
  arrivals: Array<{ convoy: Convoy; toName: string; toArmy?: boolean }>;
  /** Columns whose destination was lost mid-haul — cargo (and escort) forfeited. */
  forfeited: Convoy[];
}

/** Empty a column's cargo into a destination city (caps strategic goods). */
function deliverToCity(city: City, c: Convoy): City {
  const horses = c.warhorses ?? 0;
  const ore = c.iron ?? 0;
  const med = c.medicine ?? 0;
  return {
    ...city,
    food: city.food + c.food,
    gold: city.gold + c.gold,
    troops: city.troops + c.troops,
    ...(horses > 0 ? { warhorses: Math.min(WARHORSE_CITY_CAP, (city.warhorses ?? 0) + horses) } : {}),
    ...(ore > 0 ? { iron: Math.min(IRON_CITY_CAP, (city.iron ?? 0) + ore) } : {}),
    ...(med > 0 ? { medicine: Math.min(MEDICINE_CITY_CAP, (city.medicine ?? 0) + med) } : {}),
  };
}

/**
 * Advance every convoy by one season and deliver the cargo of those that
 * arrive — but only if the destination is still held by the convoy's force; a
 * city lost mid-haul forfeits the load (the column is captured or scattered).
 *
 * A column bound for a field army (`toArmyId`) instead empties its grain/troops
 * into that army if it is still afoot under the same banner (relieving a siege /
 * 孤軍深入); if the army has dispersed it falls back to its objective city, or is
 * forfeit if that city has fallen.
 */
export function stepConvoys(
  convoys: Record<EntityId, Convoy>,
  cities: Record<EntityId, City>,
  armies: Record<EntityId, Army> = {},
): ConvoyStepResult {
  const nextConvoys: Record<EntityId, Convoy> = {};
  let nextCities = cities;
  let nextArmies = armies;
  const arrivals: ConvoyStepResult['arrivals'] = [];
  const forfeited: Convoy[] = [];
  for (const c of Object.values(convoys)) {
    const remaining = c.seasonsRemaining - 1;
    if (remaining > 0) {
      nextConvoys[c.id] = { ...c, seasonsRemaining: remaining };
      continue;
    }
    // 直供前線 — bound for a field army: relieve it if it still stands.
    if (c.toArmyId) {
      const army = nextArmies[c.toArmyId];
      if (army && army.forceId === c.forceId) {
        nextArmies = {
          ...nextArmies,
          [army.id]: { ...army, food: (army.food ?? 0) + c.food, troops: army.troops + c.troops },
        };
        arrivals.push({ convoy: c, toName: nextCities[c.toCityId]?.name.zh ?? '前軍', toArmy: true });
        continue;
      }
      // The host has dispersed — drop the load at its objective city if we still
      // hold it, otherwise the column is lost.
      const fallback = nextCities[c.toCityId];
      if (fallback && fallback.ownerForceId === c.forceId) {
        nextCities = { ...nextCities, [c.toCityId]: deliverToCity(fallback, c) };
        arrivals.push({ convoy: c, toName: fallback.name.zh });
      } else {
        forfeited.push(c);
      }
      continue;
    }
    const dest = nextCities[c.toCityId];
    if (dest && dest.ownerForceId === c.forceId) {
      nextCities = { ...nextCities, [c.toCityId]: deliverToCity(dest, c) };
      arrivals.push({ convoy: c, toName: dest.name.zh });
    } else {
      forfeited.push(c); // destination lost mid-haul — column captured/scattered
    }
  }
  return { convoys: nextConvoys, cities: nextCities, armies: nextArmies, arrivals, forfeited };
}

/**
 * 主動劫糧 — a player-aimed raiding column (遊騎/輕騎) sent out to hunt a spotted
 * enemy supply convoy, as opposed to the passive garrison sortie of
 * resolveConvoyRaids. An officer leads `troops` out of a launch city and runs
 * down the quarry after `seasonsRemaining` seasons — the 烏巢 move made deliberate.
 */
export interface ConvoyRaid {
  id: EntityId;
  forceId: EntityId;
  officerId: EntityId;
  troops: number;
  /** Launch city — the raiders ride back here. */
  fromCityId: EntityId;
  /** The enemy column being hunted. */
  targetConvoyId: EntityId;
  seasonsRemaining: number;
}

export interface RaidStrikeOutcome {
  /** Was the quarry still on the road when the raiders arrived? */
  found: boolean;
  /** Did the raiders overrun its escort? */
  success: boolean;
  /** Raiders still standing afterwards. */
  raiderSurvivors: number;
  /** Coin carried home from an overrun column. */
  loot: number;
  /** Grain put to the torch (烏巢之火). */
  burnedFood: number;
  /** The quarry's escorting officer, taken on an overrun. */
  capturedEscortId?: EntityId;
}

/**
 * Resolve a raiding column's strike on its quarry. A column the raiders can
 * match or outnumber is overrun — its grain burned, coin looted home, escort
 * taken; the raiders' own losses scale with the resistance met (none against an
 * unescorted baggage train, up to ~20% against a matched guard). A heavier
 * escort beats them off (−35%, the convoy rolls on). A quarry already delivered
 * or destroyed is a dry hole (the raiders return whole, empty-handed).
 */
export function resolveRaidStrike(raider: { troops: number }, target: Convoy | undefined): RaidStrikeOutcome {
  if (!target) {
    return { found: false, success: false, raiderSurvivors: raider.troops, loot: 0, burnedFood: 0 };
  }
  if (raider.troops >= target.troops) {
    const resistance = Math.min(1, target.troops / Math.max(1, raider.troops));
    return {
      found: true,
      success: true,
      raiderSurvivors: Math.max(1, raider.troops - Math.floor(raider.troops * 0.2 * resistance)),
      loot: target.gold,
      burnedFood: target.food,
      capturedEscortId: target.officerId,
    };
  }
  return {
    found: true,
    success: false,
    raiderSurvivors: Math.max(0, raider.troops - Math.floor(raider.troops * 0.35)),
    loot: 0,
    burnedFood: 0,
  };
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
