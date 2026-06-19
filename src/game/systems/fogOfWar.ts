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
import type { Army, City, EntityId } from '../types';
import { cityPos } from '../data/cityGeo';
import { WORLD_SCALE } from '../data/geography';

/** Sight radius around an owned city, in strategic pixels (scales with world). */
export const FOG_CITY_RADIUS = 130 * WORLD_SCALE;
/** Sight radius around an owned marching column. */
export const FOG_ARMY_RADIUS = 110 * WORLD_SCALE;

export interface FogView {
  /** Cities whose details (and event marks etc.) are in view. */
  visibleCityIds: Set<EntityId>;
  /** Whether a strategic-pixel point (e.g. an enemy column) is in view. */
  isVisiblePx: (x: number, y: number) => boolean;
}

export function computeFog(
  cities: Record<EntityId, City>,
  armies: Record<EntityId, Army>,
  playerForceId: EntityId,
  /** 細作開眼 — cities your agents have lit up (espionage reveals);
   *  they see like an own city while the intel stays fresh. */
  revealedCityIds?: Iterable<EntityId>,
): FogView {
  const ownCities = Object.values(cities).filter((c) => c.ownerForceId === playerForceId);
  const ownArmies = Object.values(armies).filter((a) => a.forceId === playerForceId);
  const ownCityPts = ownCities.map((c) => cityPos(c));

  const visibleCityIds = new Set<EntityId>();
  for (const c of ownCities) {
    visibleCityIds.add(c.id);
    for (const adj of c.adjacentCityIds ?? []) visibleCityIds.add(adj);
  }
  for (const cid of revealedCityIds ?? []) {
    const c = cities[cid];
    if (!c) continue;
    visibleCityIds.add(cid);
    ownCityPts.push(cityPos(c)); // the spy ring watches the surroundings too
  }
  for (const c of Object.values(cities)) {
    if (visibleCityIds.has(c.id)) continue;
    const p = cityPos(c);
    if (ownArmies.some((a) => Math.hypot(a.x - p.x, a.y - p.y) < FOG_ARMY_RADIUS)) {
      visibleCityIds.add(c.id);
    }
  }

  const isVisiblePx = (x: number, y: number): boolean =>
    ownCityPts.some((p) => Math.hypot(p.x - x, p.y - y) < FOG_CITY_RADIUS)
    || ownArmies.some((a) => Math.hypot(a.x - x, a.y - y) < FOG_ARMY_RADIUS);

  return { visibleCityIds, isVisiblePx };
}
