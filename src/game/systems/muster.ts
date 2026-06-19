/**
 * 全軍集結令 — a realm-wide convergence order on one target city.
 *
 * Every player city (except the target itself) that can spare a column —
 * a real garrison, an idle commander, march gold in the treasury — sends
 * ~70% of its troops toward the target under its best idle officer.
 * Cities adjacent to the target march straight at it; the hinterland
 * marches one hop along the shortest path that stays inside the realm
 * (columns never route through foreign cities — only the final step may
 * be hostile ground). Cities with no own-territory path stay home.
 *
 * Pure planner: returns the orders; the store executes them through the
 * ordinary issueMarch so every normal validation still applies.
 */
import type { City, EntityId, Officer } from '../types';
import { COMMAND_DEFS } from './commands';

export interface MusterOrder {
  cityId: EntityId;
  officerId: EntityId;
  troops: number;
  /** Where this column actually marches: the target if adjacent, else the
   *  next own city along the shortest in-realm path toward it. */
  marchTo: EntityId;
}

const MIN_GARRISON_TO_MUSTER = 3000;
const MUSTER_FRACTION = 0.7;

/** First step of the shortest path from `fromId` to `toId` where every
 *  intermediate city belongs to `forceId` (the target itself may not).
 *  Returns null when no such path exists. */
export function nextHopToward(
  cities: Record<EntityId, City>,
  fromId: EntityId,
  toId: EntityId,
  forceId: EntityId,
): EntityId | null {
  const queue: EntityId[] = [fromId];
  const prev = new Map<EntityId, EntityId>();
  prev.set(fromId, fromId);
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const nb of cities[cur]?.adjacentCityIds ?? []) {
      if (prev.has(nb)) continue;
      if (nb === toId) {
        // Walk back to the first step out of `fromId`.
        let step = cur;
        while (prev.get(step) !== fromId) step = prev.get(step)!;
        return step === fromId ? toId : step;
      }
      if (cities[nb]?.ownerForceId !== forceId) continue; // stay in-realm
      prev.set(nb, cur);
      queue.push(nb);
    }
  }
  return null;
}

export function planMassMuster(input: {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  pendingCommandOfficerIds: ReadonlySet<EntityId>;
  trainingOfficerIds: ReadonlySet<EntityId>;
  playerForceId: EntityId;
  targetCityId: EntityId;
}): MusterOrder[] {
  const { cities, officers, playerForceId, targetCityId } = input;
  if (!cities[targetCityId]) return [];
  const marchGold = COMMAND_DEFS['march'].goldCost;
  const orders: MusterOrder[] = [];

  for (const city of Object.values(cities)) {
    if (city.id === targetCityId || city.ownerForceId !== playerForceId) continue;
    if (city.troops < MIN_GARRISON_TO_MUSTER || city.gold < marchGold) continue;

    const idle = Object.values(officers)
      .filter((o) =>
        o.forceId === playerForceId
        && o.locationCityId === city.id
        && !o.task
        && (o.status === 'active' || o.status === 'idle')
        && !input.pendingCommandOfficerIds.has(o.id)
        && !input.trainingOfficerIds.has(o.id))
      .sort((a, b) =>
        (b.stats.leadership * 0.6 + b.stats.war * 0.4)
        - (a.stats.leadership * 0.6 + a.stats.war * 0.4));
    if (idle.length === 0) continue;

    const marchTo = city.adjacentCityIds.includes(targetCityId)
      ? targetCityId
      : nextHopToward(cities, city.id, targetCityId, playerForceId);
    if (!marchTo) continue;

    orders.push({
      cityId: city.id,
      officerId: idle[0].id,
      troops: Math.floor(city.troops * MUSTER_FRACTION),
      marchTo,
    });
  }
  return orders;
}
