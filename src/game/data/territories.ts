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
import { isLand, terrainMarchCost, WORLD_SCALE, MAP_W, MAP_H } from './geography';
import { cityPos } from './cityGeo';

// ── Terrain-weighted march pathfinding (A*) ───────────────────────
// A coarse navigation grid over the 1000×720 map; A* finds the
// lowest-cost path so columns bend around mountain ranges and hug the
// passes instead of cutting straight through. Cached per route — cities
// don't move, so each (from,to) is solved once per session.
const NAV = 24;
const NAV_COLS = Math.ceil(MAP_W / NAV) + 1;   // spans the full (scaled) map
const NAV_ROWS = Math.ceil(MAP_H / NAV) + 1;
let navCost: Float32Array | null = null;
let navLand: Uint8Array | null = null;
function ensureNav() {
  if (navCost) return;
  navCost = new Float32Array(NAV_COLS * NAV_ROWS);
  navLand = new Uint8Array(NAV_COLS * NAV_ROWS);
  for (let r = 0; r < NAV_ROWS; r++) {
    for (let c = 0; c < NAV_COLS; c++) {
      const x = c * NAV, y = r * NAV;
      navCost[r * NAV_COLS + c] = terrainMarchCost(x, y);
      navLand[r * NAV_COLS + c] = isLand(x, y, -12) ? 1 : 0;
    }
  }
}
/** Nearest land node index to a pixel (spirals out if the cell is sea). */
function nearestLandNode(x: number, y: number): number {
  const c0 = Math.max(0, Math.min(NAV_COLS - 1, Math.round(x / NAV)));
  const r0 = Math.max(0, Math.min(NAV_ROWS - 1, Math.round(y / NAV)));
  for (let ring = 0; ring < 8; ring++) {
    for (let dr = -ring; dr <= ring; dr++) {
      for (let dc = -ring; dc <= ring; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== ring) continue;
        const r = r0 + dr, c = c0 + dc;
        if (r < 0 || c < 0 || r >= NAV_ROWS || c >= NAV_COLS) continue;
        if (navLand![r * NAV_COLS + c]) return r * NAV_COLS + c;
      }
    }
  }
  return r0 * NAV_COLS + c0;
}

const routeCache = new Map<string, Array<{ x: number; y: number }>>();

/**
 * Lowest-terrain-cost path from one point to another, as a simplified
 * pixel poly-line. Falls back to a straight segment if no land path
 * exists. Result cached on rounded endpoints.
 */
export function terrainRoute(fromX: number, fromY: number, toX: number, toY: number): Array<{ x: number; y: number }> {
  const key = `${Math.round(fromX)},${Math.round(fromY)}>${Math.round(toX)},${Math.round(toY)}`;
  const hit = routeCache.get(key);
  if (hit) return hit;
  ensureNav();
  const path = astar(fromX, fromY, toX, toY) ?? [{ x: fromX, y: fromY }, { x: toX, y: toY }];
  routeCache.set(key, path);
  return path;
}

function astar(fromX: number, fromY: number, toX: number, toY: number): Array<{ x: number; y: number }> | null {
  const N = NAV_COLS * NAV_ROWS;
  const start = nearestLandNode(fromX, fromY);
  const goal = nearestLandNode(toX, toY);
  const gx = (goal % NAV_COLS) * NAV, gy = Math.floor(goal / NAV_COLS) * NAV;
  const g = new Float32Array(N).fill(Infinity);
  const f = new Float32Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const open = new Set<number>();
  g[start] = 0;
  f[start] = Math.hypot((start % NAV_COLS) * NAV - gx, Math.floor(start / NAV_COLS) * NAV - gy);
  open.add(start);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let guard = 0;
  while (open.size > 0 && guard++ < 20000) {
    // pop lowest f
    let cur = -1, best = Infinity;
    for (const n of open) { if (f[n] < best) { best = f[n]; cur = n; } }
    if (cur === goal) break;
    open.delete(cur);
    const cc = cur % NAV_COLS, cr = Math.floor(cur / NAV_COLS);
    for (const [dc, dr] of DIRS) {
      const nc = cc + dc, nr = cr + dr;
      if (nc < 0 || nr < 0 || nc >= NAV_COLS || nr >= NAV_ROWS) continue;
      const ni = nr * NAV_COLS + nc;
      if (!navLand![ni]) continue;
      const step = (dc && dr) ? NAV * 1.4142 : NAV;
      const tentative = g[cur] + step * (1 + (navCost![cur] + navCost![ni]) / 2);
      if (tentative < g[ni]) {
        came[ni] = cur;
        g[ni] = tentative;
        f[ni] = tentative + Math.hypot(nc * NAV - gx, nr * NAV - gy);
        open.add(ni);
      }
    }
  }
  if (came[goal] === -1 && start !== goal) return null;
  // Reconstruct grid path → pixel points.
  const nodes: number[] = [];
  for (let n = goal; n !== -1; n = came[n]) { nodes.push(n); if (n === start) break; }
  nodes.reverse();
  const pts: Array<{ x: number; y: number }> = [{ x: fromX, y: fromY }];
  for (const n of nodes) pts.push({ x: (n % NAV_COLS) * NAV, y: Math.floor(n / NAV_COLS) * NAV });
  pts.push({ x: toX, y: toY });
  return simplify(pts);
}

/** Drop near-collinear points so the grid path reads as a clean poly-line. */
function simplify(pts: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (pts.length <= 2) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const len = Math.hypot(c.x - a.x, c.y - a.y) || 1;
    if (Math.abs(cross) / len > 3) out.push(b); // keep only real bends
  }
  out.push(pts[pts.length - 1]);
  return out;
}

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
const SATELLITE_RADIUS = 34 * WORLD_SCALE;   // ring radius scaled with the geo layout (×1.21), then ×WORLD_SCALE

/**
 * Build the full territory list from the current city catalog. Returns
 * (cities.length × TERRITORIES_PER_CITY) entries. Cities of strategic
 * importance (capitals etc) could later get more cells; for 3a we keep
 * it uniform.
 */
/**
 * Destination pixel coords of a march — an open-cell target (targetX/Y)
 * if set, otherwise the target city's coords. Returns null if neither
 * resolves.
 */
export function marchDestCoords(
  cmd: { targetCityId: string; targetX?: number; targetY?: number },
  cities: Record<string, { id: string; coords: { x: number; y: number } }>,
): { x: number; y: number } | null {
  if (cmd.targetX != null && cmd.targetY != null) return { x: cmd.targetX, y: cmd.targetY };
  const city = cities[cmd.targetCityId];
  return city ? cityPos(city) : null;
}

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
  const fp = cityPos(from);
  const tp = cityPos(to);
  const ax = fp.x, ay = fp.y;
  const bx = tp.x, by = tp.y;
  const dx = bx - ax, dy = by - ay;
  const segLen = Math.hypot(dx, dy);
  if (segLen < 1) return [fp, tp];

  const ux = dx / segLen, uy = dy / segLen;
  const CORRIDOR = 22 * WORLD_SCALE;   // scaled ×1.21 with the geo layout, then ×WORLD_SCALE

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
    // Geo-anchored centre — the same position the maps render the city at,
    // so ownership cells, the painted hex grid and the city model agree.
    const c = cityPos(city);
    // Cell 0: the city itself.
    out.push({
      id: `${city.id}-0`,
      parentCityId: city.id,
      coords: { x: c.x, y: c.y },
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
          x: c.x + Math.cos(angle) * r,
          y: c.y + Math.sin(angle) * r,
        },
      });
    }
  }
  return out;
}
