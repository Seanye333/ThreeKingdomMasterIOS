/**
 * 軍團都督 — hand a marshal a cluster of cities and a directive, and the
 * legion runs its own war while you fight yours elsewhere.
 *
 * Directives:
 *  - conquer(target): legion cities keep their garrisons topped up and
 *    throw spare columns at the target — adjacent cities directly, the
 *    hinterland one hop along an in-realm path (the muster pathfinder).
 *  - defend: keep every legion city manned; the strongest city
 *    reinforces the weakest neighbour when the gap turns dangerous.
 *
 * Pure planner: returns orders; the store executes them through the
 * ordinary issueMarch / issueCommand so every validation still applies.
 * Civil administration is NOT the legion's job — pair with 委任太守.
 */
import type { City, EntityId, Officer } from '../types';
import { COMMAND_DEFS } from './commands';
import { nextHopToward } from './muster';

export interface Legion {
  id: string;
  name: string;
  /** 都督 — display only for now; the legion plans with each city's best
   *  idle officer (the marshal "issues" the orders). */
  commanderId: EntityId;
  cityIds: EntityId[];
  directive: { kind: 'conquer'; targetCityId: EntityId } | { kind: 'defend' };
}

export type LegionOrder =
  | { kind: 'march'; cityId: EntityId; officerId: EntityId; troops: number; toCityId: EntityId }
  | { kind: 'recruit'; cityId: EntityId; officerId: EntityId };

const MIN_GARRISON = 3000;
const SPARE_THRESHOLD = 6000;
const ATTACK_FRACTION = 0.65;

function idleOfficersIn(
  officers: Record<EntityId, Officer>,
  cityId: EntityId,
  playerForceId: EntityId,
  busy: ReadonlySet<EntityId>,
): Officer[] {
  return Object.values(officers)
    .filter((o) => o.forceId === playerForceId
      && o.locationCityId === cityId
      && !o.task
      && (o.status === 'active' || o.status === 'idle')
      && !busy.has(o.id))
    .sort((a, b) =>
      (b.stats.leadership * 0.6 + b.stats.war * 0.4)
      - (a.stats.leadership * 0.6 + a.stats.war * 0.4));
}

export function planLegionOrders(input: {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  busyOfficerIds: ReadonlySet<EntityId>;
  playerForceId: EntityId;
  legion: Legion;
}): LegionOrder[] {
  const { cities, officers, playerForceId, legion, busyOfficerIds } = input;
  const orders: LegionOrder[] = [];
  const recruitCost = COMMAND_DEFS['recruit-troops'].goldCost;
  const marchCost = COMMAND_DEFS['march'].goldCost;

  // Cities the legion still actually holds.
  const held = legion.cityIds
    .map((id) => cities[id])
    .filter((c): c is City => !!c && c.ownerForceId === playerForceId);

  for (const city of held) {
    const idle = idleOfficersIn(officers, city.id, playerForceId, busyOfficerIds);
    if (idle.length === 0) continue;

    // Garrison first — a legion that recruits itself hollow helps no one.
    if (city.troops < MIN_GARRISON && city.gold >= recruitCost) {
      orders.push({ kind: 'recruit', cityId: city.id, officerId: idle[0].id });
      continue;
    }

    if (legion.directive.kind === 'conquer') {
      const target = legion.directive.targetCityId;
      if (city.id === target) continue;
      if (city.troops < SPARE_THRESHOLD || city.gold < marchCost) continue;
      const marchTo = city.adjacentCityIds.includes(target)
        ? target
        : nextHopToward(cities, city.id, target, playerForceId);
      if (!marchTo) continue;
      orders.push({
        kind: 'march',
        cityId: city.id,
        officerId: idle[0].id,
        troops: Math.floor(city.troops * ATTACK_FRACTION),
        toCityId: marchTo,
      });
    } else {
      // defend — top up the weakest adjacent legion city from strength.
      const weak = held
        .filter((c) => c.id !== city.id
          && city.adjacentCityIds.includes(c.id)
          && c.troops * 2 < city.troops
          && c.troops < SPARE_THRESHOLD);
      if (weak.length === 0 || city.gold < marchCost) continue;
      weak.sort((a, b) => a.troops - b.troops);
      orders.push({
        kind: 'march',
        cityId: city.id,
        officerId: idle[0].id,
        troops: Math.floor(city.troops * 0.4),
        toCityId: weak[0].id,
      });
    }
  }
  return orders;
}
