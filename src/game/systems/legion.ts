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

export type LegionDirective =
  | { kind: 'conquer'; targetCityId: EntityId } // strike a fixed enemy city
  | { kind: 'consume' }   // 蠶食 — each season throw weight at the softest reachable enemy
  | { kind: 'raid' }      // 略地 — harass the softest reachable enemy (a lighter levy)
  | { kind: 'defend' };

export interface Legion {
  id: string;
  name: string;
  /** 都督 — the marshal now SHAPES the legion: 統率 → mobilization (bigger/sooner
   *  columns), 智力 → 方略 (a clever marshal swings to softer targets / retargets a
   *  fallen objective). */
  commanderId: EntityId;
  cityIds: EntityId[];
  directive: LegionDirective;
}

export type LegionOrder =
  | { kind: 'march'; cityId: EntityId; officerId: EntityId; troops: number; toCityId: EntityId }
  | { kind: 'recruit'; cityId: EntityId; officerId: EntityId };

/** 軍團戰報 — what a legion did this season, for the player's report. */
export interface LegionSummary {
  directive: LegionDirective['kind'];
  targetCityId?: EntityId;
  marched: number;
  recruited: number;
  troopsSent: number;
}

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
  /** Which cities the legion may attack (hostility-aware). Defaults to any
   *  city owned by another force — the store passes a diplomacy-aware one. */
  isEnemyCity?: (city: City) => boolean;
}): { orders: LegionOrder[]; summary: LegionSummary } {
  const { cities, officers, playerForceId, legion, busyOfficerIds } = input;
  const orders: LegionOrder[] = [];
  const recruitCost = COMMAND_DEFS['recruit-troops'].goldCost;
  const marchCost = COMMAND_DEFS['march'].goldCost;
  const isEnemy = input.isEnemyCity ?? ((c: City) => !!c.ownerForceId && c.ownerForceId !== playerForceId);

  // Cities the legion still actually holds.
  const held = legion.cityIds
    .map((id) => cities[id])
    .filter((c): c is City => !!c && c.ownerForceId === playerForceId);

  // 都督本事 — the marshal shapes the legion. 統率 mobilizes more & sooner; 智力
  // sharpens the 方略 (target choice).
  const marshal = officers[legion.commanderId];
  const lead = marshal?.stats.leadership ?? 70;
  const intel = marshal?.stats.intelligence ?? 70;
  const spareThreshold = Math.max(4200, Math.round(SPARE_THRESHOLD - Math.max(0, lead - 70) * 30)); // 6000 → ~5100 @100
  const baseFraction = Math.min(0.85, ATTACK_FRACTION + Math.max(0, lead - 70) * 0.004);             // 0.65 → ~0.77 @100

  // 智将自行擇敵 — the softest enemy city adjacent to any legion city.
  const softestReachableEnemy = (): EntityId | null => {
    let best: { id: EntityId; troops: number } | null = null;
    for (const c of held) {
      for (const nid of c.adjacentCityIds) {
        const n = cities[nid];
        if (!n || !isEnemy(n)) continue;
        if (!best || n.troops < best.troops) best = { id: n.id, troops: n.troops };
      }
    }
    return best?.id ?? null;
  };

  // Resolve the attack target & levy from the directive (defend handled below).
  let attackTarget: EntityId | null = null;
  let fraction = baseFraction;
  const d = legion.directive;
  if (d.kind === 'conquer') {
    const fixed = cities[d.targetCityId];
    // 不死磕 — if the objective has fallen/turned friendly, or a clever marshal
    // spots a far softer reachable city, swing the legion onto that instead.
    attackTarget = fixed && isEnemy(fixed) ? d.targetCityId : softestReachableEnemy();
    if (intel >= 80) {
      const soft = softestReachableEnemy();
      if (soft && cities[soft] && fixed && cities[soft].troops * 1.5 < fixed.troops) attackTarget = soft;
    }
  } else if (d.kind === 'consume') {
    attackTarget = softestReachableEnemy();
  } else if (d.kind === 'raid') {
    attackTarget = softestReachableEnemy();
    fraction = Math.min(0.5, baseFraction * 0.6); // a lighter, harassing levy
  }

  for (const city of held) {
    const idle = idleOfficersIn(officers, city.id, playerForceId, busyOfficerIds);
    if (idle.length === 0) continue;

    // Garrison first — a legion that recruits itself hollow helps no one.
    if (city.troops < MIN_GARRISON && city.gold >= recruitCost) {
      orders.push({ kind: 'recruit', cityId: city.id, officerId: idle[0].id });
      continue;
    }

    if (d.kind === 'defend') {
      // top up the weakest adjacent legion city from strength.
      const weak = held
        .filter((c) => c.id !== city.id
          && city.adjacentCityIds.includes(c.id)
          && c.troops * 2 < city.troops
          && c.troops < SPARE_THRESHOLD);
      if (weak.length === 0 || city.gold < marchCost) continue;
      weak.sort((a, b) => a.troops - b.troops);
      orders.push({ kind: 'march', cityId: city.id, officerId: idle[0].id, troops: Math.floor(city.troops * 0.4), toCityId: weak[0].id });
    } else {
      // attack directives (conquer / consume / raid) — march on the target.
      if (attackTarget == null || city.id === attackTarget) continue;
      if (city.troops < spareThreshold || city.gold < marchCost) continue;
      const marchTo = city.adjacentCityIds.includes(attackTarget)
        ? attackTarget
        : nextHopToward(cities, city.id, attackTarget, playerForceId);
      if (!marchTo) continue;
      orders.push({ kind: 'march', cityId: city.id, officerId: idle[0].id, troops: Math.floor(city.troops * fraction), toCityId: marchTo });
    }
  }

  const marched = orders.filter((o) => o.kind === 'march');
  return {
    orders,
    summary: {
      directive: d.kind,
      targetCityId: attackTarget ?? undefined,
      marched: marched.length,
      recruited: orders.length - marched.length,
      troopsSent: marched.reduce((s, o) => s + (o.kind === 'march' ? o.troops : 0), 0),
    },
  };
}
