import type { EntityId, Officer } from '../types';
import { isHostilePermitted, type DiplomaticState } from '../types';
import { terrainRoute, positionAlongRoute, marchDestCoords } from '../data/territories';
import { cityPos } from '../data/cityGeo';
import { WORLD_SCALE } from '../data/geography';
import { paceExposureMul, type MarchPace } from './marchPace';

/**
 * 真日級遭遇 — day-by-day interception geometry, shared by BOTH the
 * pre-resolution day-flow playback (store) and season resolution
 * (resolution.ts). One function decides "which day do these two columns
 * meet, and where" — so what the player watches at day 8 is exactly what
 * the season resolves at day 15. ROTK14 semantics: reroute BEFORE the
 * contact day and you slip away; once the banner is up, you're engaged.
 *
 * The old test sampled each pair once per season at the slice midpoint —
 * two columns could "phase through" each other between samples. The
 * day-sweep closes that gap.
 */

/** Days per half-month turn — must match dayFlow.total. */
export const DAY_TICKS = 15;

/** Base intercept radius (was resolution-local). */
export const INTERCEPT_DIST = 55 * WORLD_SCALE;

/** The structural subset of a march command the geometry needs. */
export interface MarchGeom {
  officerId: EntityId;
  cityId: EntityId;
  targetCityId: EntityId;
  targetX?: number;
  targetY?: number;
  totalSeasons?: number;
  seasonsRemaining?: number;
  holding?: boolean;
  pace?: MarchPace;
  routed?: boolean;
  fleeX?: number;
  fleeY?: number;
  /** 候期 — a waiting column marks time: its day-walk is frozen in place. */
  waitSeasons?: number;
}

/** 途中錨點 — a rout flees from its defeat site, a pursuit chases from its
 *  own boots: any march with a flee anchor walks anchor→destination instead
 *  of the source-city road. */
function marchRoute(cmd: MarchGeom, cities: CitiesLike): Array<{ x: number; y: number }> | null {
  const dst = marchDestCoords(cmd, cities);
  if (!dst) return null;
  if (cmd.fleeX != null && cmd.fleeY != null) {
    return terrainRoute(cmd.fleeX, cmd.fleeY, dst.x, dst.y);
  }
  const src = cities[cmd.cityId];
  if (!src) return null;
  const sp = cityPos(src);
  return terrainRoute(sp.x, sp.y, dst.x, dst.y);
}

export interface DayContact<M extends MarchGeom> {
  a: M;
  b: M;
  /** First day (0..DAY_TICKS) the two columns come within catch range. */
  day: number;
  pa: { x: number; y: number };
  pb: { x: number; y: number };
}

type CitiesLike = Record<string, { id: string; coords: { x: number; y: number } }>;

/**
 * Position of a marching column at day `d` of the CURRENT half-month
 * (d=0 matches the classic season-resolution sample; d=DAY_TICKS is the
 * next slice midpoint). Dug-in garrisons sit on their held cell.
 */
export function marchPositionAtDay(
  cmd: MarchGeom,
  cities: CitiesLike,
  day: number,
  route?: Array<{ x: number; y: number }>,
): { x: number; y: number } | null {
  if (cmd.holding && cmd.targetX != null && cmd.targetY != null) {
    return { x: cmd.targetX, y: cmd.targetY };
  }
  if (!route) {
    route = marchRoute(cmd, cities) ?? undefined;
    if (!route) return null;
  }
  const total = Math.max(1, cmd.totalSeasons ?? 1);
  const remaining = cmd.seasonsRemaining ?? 1;
  const elapsed = total - remaining;
  // 候期 — a waiting column marks time in place (no day-walk this month).
  const dayTerm = (cmd.waitSeasons ?? 0) > 0 ? 0 : day / DAY_TICKS;
  const t = Math.min(0.95, Math.max(0.05, (elapsed + 0.5 + dayTerm) / total));
  return positionAlongRoute(route, t);
}

/**
 * Sweep all hostile march pairs day by day; return each pair's FIRST
 * contact, sorted by day (earliest clash resolves first — a column broken
 * on day 3 never makes its day 11 rendezvous).
 */
export function computeDayEncounters<M extends MarchGeom>(
  marches: M[],
  officers: Record<EntityId, Officer>,
  cities: CitiesLike,
  diplomacy: DiplomaticState,
): Array<DayContact<M>> {
  // Route + per-day positions cached per march (routes are the cost).
  const routes = marches.map((m) => {
    if (m.holding && m.targetX != null && m.targetY != null) return null;
    return marchRoute(m, cities);
  });
  const posAt = (i: number, d: number) =>
    marchPositionAtDay(marches[i], cities, d, routes[i] ?? undefined);

  const contacts: Array<DayContact<M>> = [];
  for (let i = 0; i < marches.length; i++) {
    for (let j = i + 1; j < marches.length; j++) {
      const a = marches[i];
      const b = marches[j];
      const oa = officers[a.officerId];
      const ob = officers[b.officerId];
      if (!oa?.forceId || !ob?.forceId || oa.forceId === ob.forceId) continue;
      if (!isHostilePermitted(diplomacy, oa.forceId, ob.forceId)) continue;
      const catchDist = INTERCEPT_DIST * Math.max(paceExposureMul(a.pace), paceExposureMul(b.pace));
      // Two dug-in camps never walk into each other.
      const bothHold = !!a.holding && !!b.holding;
      const lastDay = bothHold ? 0 : DAY_TICKS;
      for (let d = 0; d <= lastDay; d++) {
        const pa = posAt(i, d);
        const pb = posAt(j, d);
        if (!pa || !pb) break;
        if (Math.hypot(pa.x - pb.x, pa.y - pb.y) <= catchDist) {
          contacts.push({ a, b, day: d, pa, pb });
          break;
        }
      }
    }
  }
  contacts.sort((x, y) => x.day - y.day);
  return contacts;
}

/**
 * 兵臨之日 — the day (1..DAY_TICKS) an arriving column reaches its
 * destination this half-month, or null if it isn't arriving yet. Derived
 * from the same clamped walk the playback plays: t caps at 0.95, so a
 * final-slice column stands at the gates when (elapsed+0.5+d/15)/total
 * crosses it — assault day, not assault turn.
 */
export function arrivalDayOf(cmd: MarchGeom): number | null {
  if (cmd.holding) return null;
  const total = Math.max(1, cmd.totalSeasons ?? 1);
  const remaining = cmd.seasonsRemaining ?? 1;
  if (remaining > 1) return null;
  const elapsed = total - remaining;
  const d = Math.ceil(DAY_TICKS * (0.95 * total - elapsed - 0.5));
  return Math.max(1, Math.min(DAY_TICKS, d));
}
