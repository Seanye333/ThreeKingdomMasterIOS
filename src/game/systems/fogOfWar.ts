/**
 * 戰爭迷霧 — what the player can actually see of the realm.
 *
 * Optional (off by default, toggled on the map toolbar). When on:
 *  - Your cities and everything one march away are in view.
 *  - Your marching columns scout as they go — cities and enemy columns
 *    near them come into view.
 *  - Hostile columns outside all of that vanish from the map; unseen
 *    cities keep their name and geography (maps of the land are not a
 *    secret) but their numbers read as「?」.
 *
 * Beacons stay live regardless — that's the whole point of building
 * them: your borders report what your eyes can't reach.
 *
 * Pure module so the visibility rules are testable; renderers consume
 * the returned view.
 */
import type { Army, City, EntityId, Officer } from '../types';
import { cityPos } from '../data/cityGeo';
import { WORLD_SCALE } from '../data/geography';

/** Sight radius around an owned city, in strategic pixels (scales with world). */
export const FOG_CITY_RADIUS = 130 * WORLD_SCALE;
/** Sight radius around an owned marching column. */
export const FOG_ARMY_RADIUS = 110 * WORLD_SCALE;
/** 斥候 — extra sight per point of 智力 above 60 of the keenest watcher (a sharp
 *  mind rides his scouts well ahead). */
export const SCOUT_INTEL_REACH = 0.7 * WORLD_SCALE;
function intelReach(intel: number): number {
  return Math.max(0, intel - 60) * SCOUT_INTEL_REACH;
}

export interface FogView {
  /** Cities whose details (and event marks etc.) are in view. */
  visibleCityIds: Set<EntityId>;
  /** Whether a strategic-pixel point (e.g. an enemy column) is in view. */
  isVisiblePx: (x: number, y: number) => boolean;
}

interface Eye { x: number; y: number; r: number }

export function computeFog(
  cities: Record<EntityId, City>,
  armies: Record<EntityId, Army>,
  playerForceId: EntityId,
  /** 細作開眼 — cities your agents have lit up (espionage reveals);
   *  they see like an own city while the intel stays fresh. */
  revealedCityIds?: Iterable<EntityId>,
  /** 斥候之明 — when given, an eye's reach sharpens with the keenest 智力 watching
   *  (the city's best mind, a column's commander). Omit for the flat base radii. */
  officers?: Record<EntityId, Officer>,
): FogView {
  const ownCities = Object.values(cities).filter((c) => c.ownerForceId === playerForceId);
  const ownArmies = Object.values(armies).filter((a) => a.forceId === playerForceId);

  // 一城之明 — the keenest player mind garrisoned in each city (one pass).
  const cityWatch: Record<EntityId, number> = {};
  if (officers) {
    for (const o of Object.values(officers)) {
      if (o.forceId !== playerForceId || !o.locationCityId || o.status === 'dead') continue;
      cityWatch[o.locationCityId] = Math.max(cityWatch[o.locationCityId] ?? 0, o.stats.intelligence);
    }
  }
  const cityEyes: Eye[] = ownCities.map((c) => ({ ...cityPos(c), r: FOG_CITY_RADIUS + intelReach(cityWatch[c.id] ?? 0) }));
  const armyEyes: Eye[] = ownArmies.map((a) => ({ x: a.x, y: a.y, r: FOG_ARMY_RADIUS + intelReach(officers?.[a.commanderId]?.stats.intelligence ?? 0) }));

  const visibleCityIds = new Set<EntityId>();
  for (const c of ownCities) {
    visibleCityIds.add(c.id);
    for (const adj of c.adjacentCityIds ?? []) visibleCityIds.add(adj);
  }
  for (const cid of revealedCityIds ?? []) {
    const c = cities[cid];
    if (!c) continue;
    visibleCityIds.add(cid);
    cityEyes.push({ ...cityPos(c), r: FOG_CITY_RADIUS }); // the spy ring watches the surroundings too
  }
  for (const c of Object.values(cities)) {
    if (visibleCityIds.has(c.id)) continue;
    const p = cityPos(c);
    if (armyEyes.some((e) => Math.hypot(e.x - p.x, e.y - p.y) < e.r)) {
      visibleCityIds.add(c.id);
    }
  }

  const isVisiblePx = (x: number, y: number): boolean =>
    cityEyes.some((e) => Math.hypot(e.x - x, e.y - y) < e.r)
    || armyEyes.some((e) => Math.hypot(e.x - x, e.y - y) < e.r);

  return { visibleCityIds, isVisiblePx };
}
