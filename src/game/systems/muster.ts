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

export const MIN_GARRISON_TO_MUSTER = 3000;
export const MUSTER_FRACTION = 0.7;

/** 選擇性集結 — knobs the player sets before committing a muster. */
export interface MusterOptions {
  /** Troop fraction each city sends (default 0.7). */
  fraction?: number;
  /** Leave at least this many troops home, capping what's sent (default 0 — the
   *  fraction governs, which can strip a 3000-garrison city below the floor). */
  keepGarrison?: number;
  /** Cities to skip (manual exclusions, or the 前線 cities the store resolves
   *  when 排除前線 is on). */
  excludeCityIds?: ReadonlySet<EntityId>;
}

export type MusterExclusion = 'low-garrison' | 'no-officer' | 'no-gold' | 'unreachable' | 'excluded';

export interface MusterPlan {
  orders: MusterOrder[];
  /** Eligible-ish cities that won't march, and why — surfaced in the preview. */
  excluded: Array<{ cityId: EntityId; reason: MusterExclusion }>;
}

/** 持續集結 — a standing muster that re-issues each season, funnelling the realm's
 *  depth forward over time (one muster shuffles troops one hop; a campaign keeps
 *  pushing until the objective falls). With a rally city it 分進合擊: gathers
 *  there first (a few seasons), then strikes the final target together. */
export interface MusterCampaign {
  id: string;
  forceId: EntityId;
  /** Final objective (a hostile city). */
  targetCityId: EntityId;
  /** 集結點 — when set, columns gather here first (phase 1) before the strike. */
  rallyCityId?: EntityId;
  /** Seasons left in the gathering phase; 0/undefined = straight to the strike. */
  gatherSeasonsLeft?: number;
  /** Safety cap so a stalled campaign eventually retires. */
  seasonsLeft: number;
  fraction?: number;
  keepGarrison?: number;
  excludeFrontier?: boolean;
}

/** How many seasons a 集結點 gathers before the combined strike. */
export const MUSTER_GATHER_SEASONS = 2;
/** Default lifespan of a standing campaign before it auto-retires. */
export const MUSTER_CAMPAIGN_SEASONS = 16;

/** 集結之累 — the 民心 a levied city loses to war-weariness when it sends a wave;
 *  the heavier the levy, the deeper the strain (capped). */
export function musterStrain(troopsSent: number): number {
  return Math.min(6, Math.max(1, Math.round(troopsSent / 1500)));
}

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
  /** The city all columns converge on — a hostile target (攻) or one of your
   *  own (勤王 reinforce / 集結點 staging). issueMarch handles either. */
  targetCityId: EntityId;
}, opts?: MusterOptions): MusterPlan {
  const { cities, officers, playerForceId, targetCityId } = input;
  const orders: MusterOrder[] = [];
  const excluded: MusterPlan['excluded'] = [];
  if (!cities[targetCityId]) return { orders, excluded };
  const marchGold = COMMAND_DEFS['march'].goldCost;
  const fraction = opts?.fraction ?? MUSTER_FRACTION;
  const keep = Math.max(0, opts?.keepGarrison ?? 0);
  const excludeSet = opts?.excludeCityIds ?? new Set<EntityId>();

  for (const city of Object.values(cities)) {
    if (city.id === targetCityId || city.ownerForceId !== playerForceId) continue;
    const ex = (reason: MusterExclusion) => excluded.push({ cityId: city.id, reason });
    if (excludeSet.has(city.id)) { ex('excluded'); continue; }
    if (city.troops < MIN_GARRISON_TO_MUSTER || city.troops <= keep) { ex('low-garrison'); continue; }
    if (city.gold < marchGold) { ex('no-gold'); continue; }

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
    if (idle.length === 0) { ex('no-officer'); continue; }

    const marchTo = city.adjacentCityIds.includes(targetCityId)
      ? targetCityId
      : nextHopToward(cities, city.id, targetCityId, playerForceId);
    if (!marchTo) { ex('unreachable'); continue; }

    const troops = Math.min(Math.floor(city.troops * fraction), Math.max(0, city.troops - keep));
    if (troops < 1) { ex('low-garrison'); continue; }

    orders.push({ cityId: city.id, officerId: idle[0].id, troops, marchTo });
  }
  return { orders, excluded };
}
