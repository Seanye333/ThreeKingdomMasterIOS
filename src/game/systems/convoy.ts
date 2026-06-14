import type { City, EntityId } from '../types';

/**
 * 輜重 — a non-combat supply convoy (運糧車/運金車) crawling the map between two
 * of a force's cities, carrying grain and/or coin. It steps like an army and,
 * on arrival, empties its cargo into the destination city. The road loss (if
 * any) is already taken at dispatch, so what it carries is what arrives.
 */
export interface Convoy {
  id: EntityId;
  forceId: EntityId;
  fromCityId: EntityId;
  toCityId: EntityId;
  /** Cargo as it will ARRIVE. */
  food: number;
  gold: number;
  /** 援兵 — soldiers ferried to reinforce the destination's garrison. */
  troops: number;
  seasonsRemaining: number;
  totalSeasons: number;
}

export interface ConvoyStepResult {
  convoys: Record<EntityId, Convoy>;
  cities: Record<EntityId, City>;
  arrivals: Array<{ convoy: Convoy; toName: string }>;
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
  for (const c of Object.values(convoys)) {
    const remaining = c.seasonsRemaining - 1;
    if (remaining > 0) {
      nextConvoys[c.id] = { ...c, seasonsRemaining: remaining };
      continue;
    }
    const dest = nextCities[c.toCityId];
    if (dest && dest.ownerForceId === c.forceId) {
      nextCities = {
        ...nextCities,
        [c.toCityId]: { ...dest, food: dest.food + c.food, gold: dest.gold + c.gold, troops: dest.troops + c.troops },
      };
      arrivals.push({ convoy: c, toName: dest.name.zh });
    }
    // delivered or forfeited → the convoy is retired (not carried forward)
  }
  return { convoys: nextConvoys, cities: nextCities, arrivals };
}

export interface ConvoyRaidResult {
  convoys: Record<EntityId, Convoy>;
  raids: Array<{ convoy: Convoy; repelled: boolean; toName: string }>;
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
): ConvoyRaidResult {
  const next: Record<EntityId, Convoy> = {};
  const raids: ConvoyRaidResult['raids'] = [];
  for (const c of Object.values(convoys)) {
    const strength = dangers[c.id] ?? 0;
    const toName = cities[c.toCityId]?.name.zh ?? '?';
    if (strength <= 0) {
      next[c.id] = c;
    } else if (c.troops >= strength) {
      next[c.id] = { ...c, troops: Math.max(0, c.troops - Math.floor(c.troops * 0.2)) };
      raids.push({ convoy: c, repelled: true, toName });
    } else {
      raids.push({ convoy: c, repelled: false, toName });
    }
  }
  return { convoys: next, raids };
}
