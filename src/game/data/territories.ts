/**
 * Phase 3a — Territory grid layer (visual only, no gameplay impact yet).
 *
 * For each city we synthesise 3 small sub-territories at deterministic
 * radial offsets. The owner of each territory is just inherited from its
 * parent city, so this file adds *visual* granularity (~350 cells across
 * the map) without changing any game logic. Phases 3b/3c will graduate
 * these from "render hints" into real gameplay state.
 */

import type { City } from '../types';

export interface Territory {
  id: string;
  /** Owning city — controls who controls this cell for now. */
  parentCityId: string;
  /** World-space centroid on the 1000×720 canvas. */
  coords: { x: number; y: number };
}

// Stable hash → deterministic offsets per city id. We don't want the
// territories to jitter across sessions, so the generator is pure.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

const TERRITORIES_PER_CITY = 3;
const SATELLITE_RADIUS = 28;

/**
 * Build the full territory list from the current city catalog. Returns
 * (cities.length × TERRITORIES_PER_CITY) entries. Cities of strategic
 * importance (capitals etc) could later get more cells; for 3a we keep
 * it uniform.
 */
/**
 * Phase 3b — march route through territory cells.
 *
 * Given a from-city and a to-city, returns the sequence of territory
 * centroids the army visibly walks through. Cells are picked by
 * projecting onto the from→to segment and keeping only those whose
 * perpendicular distance to the segment is small (i.e. cells the road
 * physically passes near). The result is sorted by projection so the
 * army moves monotonically toward the destination.
 *
 * Always starts at the source city's centroid and ends at the target's
 * — so even short hops yield a well-formed 2-point polyline.
 */
export function computeMarchRoute(
  territories: Territory[],
  from: { id: string; coords: { x: number; y: number } },
  to: { id: string; coords: { x: number; y: number } },
): Array<{ x: number; y: number }> {
  const ax = from.coords.x, ay = from.coords.y;
  const bx = to.coords.x, by = to.coords.y;
  const dx = bx - ax, dy = by - ay;
  const segLen = Math.hypot(dx, dy);
  if (segLen < 1) return [from.coords, to.coords];

  const ux = dx / segLen, uy = dy / segLen;
  const CORRIDOR = 18;

  // Project every territory onto the segment, keep those near the line
  // and between the endpoints.
  type ScoredT = { t: number; coords: { x: number; y: number }; parentCityId: string };
  const picks: ScoredT[] = [];
  for (const ter of territories) {
    const rx = ter.coords.x - ax;
    const ry = ter.coords.y - ay;
    const proj = rx * ux + ry * uy;
    if (proj <= 0 || proj >= segLen) continue;
    const perp = Math.abs(rx * (-uy) + ry * ux);
    if (perp > CORRIDOR) continue;
    picks.push({ t: proj, coords: ter.coords, parentCityId: ter.parentCityId });
  }
  picks.sort((a, b) => a.t - b.t);

  // Walk the picks but never include consecutive cells from the same
  // parent city — keeps the polyline from doing tight zig-zags around
  // a single city's three sub-territories.
  const route: Array<{ x: number; y: number }> = [{ x: ax, y: ay }];
  let lastParent: string | null = from.id;
  for (const p of picks) {
    if (p.parentCityId === lastParent) continue;
    if (p.parentCityId === to.id) continue; // we'll close on the city itself below
    route.push(p.coords);
    lastParent = p.parentCityId;
  }
  route.push({ x: bx, y: by });
  return route;
}

/** Interpolate a position along a poly-line at progress t (0..1). */
export function positionAlongRoute(
  route: Array<{ x: number; y: number }>,
  t: number,
): { x: number; y: number } {
  if (route.length === 0) return { x: 0, y: 0 };
  if (route.length === 1) return route[0];
  // Total length to support uniform-speed interpolation.
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const sl = Math.hypot(route[i + 1].x - route[i].x, route[i + 1].y - route[i].y);
    segLens.push(sl);
    total += sl;
  }
  if (total < 1) return route[0];
  const target = Math.max(0, Math.min(1, t)) * total;
  let acc = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (acc + segLens[i] >= target) {
      const localT = (target - acc) / segLens[i];
      const a = route[i], b = route[i + 1];
      return {
        x: a.x + (b.x - a.x) * localT,
        y: a.y + (b.y - a.y) * localT,
      };
    }
    acc += segLens[i];
  }
  return route[route.length - 1];
}

export function generateTerritories(cities: City[]): Territory[] {
  const out: Territory[] = [];
  for (const city of cities) {
    // Cell 0: the city itself.
    out.push({
      id: `${city.id}-0`,
      parentCityId: city.id,
      coords: { x: city.coords.x, y: city.coords.y },
    });
    // Cells 1..N-1: satellites at fixed angular offsets, deterministic
    // per-city rotation so the layout is stable but cities don't all align.
    const baseAngle = hash(city.id) * Math.PI * 2;
    for (let i = 1; i < TERRITORIES_PER_CITY; i++) {
      const angle = baseAngle + (i / TERRITORIES_PER_CITY) * Math.PI * 2;
      const r = SATELLITE_RADIUS * (0.7 + hash(city.id + '/' + i) * 0.5);
      out.push({
        id: `${city.id}-${i}`,
        parentCityId: city.id,
        coords: {
          x: city.coords.x + Math.cos(angle) * r,
          y: city.coords.y + Math.sin(angle) * r,
        },
      });
    }
  }
  return out;
}
