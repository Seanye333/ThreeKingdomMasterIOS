/**
 * 勢力消長 — one number per force per season, so the realm's rise and
 * fall draws as a line. Power is deliberately simple and stable:
 * cities anchor it, troops fill it, treasure rounds it.
 */
import type { City, EntityId } from '../types';

export interface PowerSnapshot {
  year: number;
  season: string;
  byForce: Record<EntityId, number>;
}

export const POWER_HISTORY_CAP = 240; // ~60 years of seasons

export function forcePower(cities: Record<EntityId, City>, forceId: EntityId): number {
  let p = 0;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== forceId) continue;
    p += 5000 + c.troops + Math.floor(c.gold / 4);
  }
  return p;
}

export function takePowerSnapshot(
  cities: Record<EntityId, City>,
  year: number,
  season: string,
): PowerSnapshot {
  const byForce: Record<EntityId, number> = {};
  for (const c of Object.values(cities)) {
    if (!c.ownerForceId) continue;
    byForce[c.ownerForceId] = (byForce[c.ownerForceId] ?? 0) + 5000 + c.troops + Math.floor(c.gold / 4);
  }
  return { year, season, byForce };
}

export function appendPowerHistory(
  history: PowerSnapshot[],
  snap: PowerSnapshot,
): PowerSnapshot[] {
  const next = [...history, snap];
  return next.length > POWER_HISTORY_CAP ? next.slice(-POWER_HISTORY_CAP) : next;
}
