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
import { officerGrade, gradeRank } from './officerGrade';
import { cityPos } from '../data/cityGeo';
import { terrainMarchCost, isLand } from '../data/geography';

/** 都督之旗 — the morale a renowned marshal's banner lends the legion's columns
 *  on the battlefield (名帥坐鎮、旗鼓肅然): from 武力, 品階 and 威望. */
export function legionBannerBonus(marshal?: Officer): number {
  if (!marshal) return 0;
  const warB = Math.max(0, Math.round((marshal.stats.war - 70) * 0.2));   // 0..~6
  const gradeB = gradeRank(officerGrade(marshal).grade);                  // iron 0 … diamond 5
  const renownB = Math.min(6, Math.round((marshal.renown ?? 0) / 12));    // 0..6
  return Math.min(16, warB + gradeB + renownB);
}

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
  | { kind: 'recruit'; cityId: EntityId; officerId: EntityId }
  /** 迎伏 — a threatened legion city sends a detachment to cover on the
   *  enemy's approach road; it digs in and goes to ground on arrival. */
  | { kind: 'ambush-camp'; cityId: EntityId; officerId: EntityId; troops: number; x: number; y: number };

/** 軍團戰報 — what a legion did this season, for the player's report. */
export interface LegionSummary {
  directive: LegionDirective['kind'];
  targetCityId?: EntityId;
  marched: number;
  recruited: number;
  troopsSent: number;
}

export const MIN_GARRISON = 3000;
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
  /** 應敵 — legion cities a hostile column is marching on; 固守 rushes these
   *  reinforcements pre-emptively rather than only topping up the weakest. */
  threatenedCityIds?: ReadonlySet<EntityId>;
  /** 來犯縱隊 — current positions of the columns behind those threats, so a
   *  clever marshal can lay an ambush on their approach road (迎伏). */
  threatColumns?: ReadonlyArray<{ x: number; y: number; toCityId: EntityId }>;
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

  // 分進合擊 — a great coordinator (統率 ≥85) gathers the hinterland at the
  // spearhead city bordering the target first, then strikes together, rather
  // than feeding columns in piecemeal.
  const coordinated = (d.kind === 'conquer' || d.kind === 'consume') && lead >= 85 && attackTarget != null;
  const stagingCity = coordinated ? (held.find((c) => c.id !== attackTarget && c.adjacentCityIds.includes(attackTarget!))?.id ?? null) : null;
  const threats = input.threatenedCityIds ?? new Set<EntityId>();

  // 迎伏 — a clever marshal (智 ≥75) answers an incoming column with an
  // ambush on its own road: the threatened city sends a detachment to a
  // covered point (forest/hills) on the approach, where it digs in and goes
  // to ground. One trap per legion per season — 兵不厭詐,亦不濫用.
  let ambushLaid = false;

  for (const city of held) {
    const idle = idleOfficersIn(officers, city.id, playerForceId, busyOfficerIds);
    if (idle.length === 0) continue;

    // Garrison first — a legion that recruits itself hollow helps no one.
    if (city.troops < MIN_GARRISON && city.gold >= recruitCost) {
      orders.push({ kind: 'recruit', cityId: city.id, officerId: idle[0].id });
      continue;
    }

    if (!ambushLaid && intel >= 75 && threats.has(city.id)
      && city.troops >= MIN_GARRISON + 2000 && city.gold >= marchCost) {
      const column = (input.threatColumns ?? []).find((k) => k.toCityId === city.id);
      if (column) {
        const cp = cityPos(city);
        // Sample the approach road for ground that hides an army.
        let spot: { x: number; y: number } | null = null;
        for (const t of [0.35, 0.5, 0.65]) {
          const x = column.x + (cp.x - column.x) * t;
          const y = column.y + (cp.y - column.y) * t;
          if (isLand(x, y, 0) && terrainMarchCost(x, y) >= 0.3) { spot = { x, y }; break; }
        }
        if (spot) {
          const troops = Math.min(Math.floor(city.troops * 0.4), city.troops - MIN_GARRISON);
          orders.push({ kind: 'ambush-camp', cityId: city.id, officerId: idle[0].id, troops, x: spot.x, y: spot.y });
          ambushLaid = true;
          continue;
        }
      }
    }

    if (d.kind === 'defend') {
      if (city.gold < marchCost) continue;
      // 應敵 — a threatened adjacent legion city gets help first (pre-empt the
      // blow); otherwise top up the weakest neighbour from strength.
      const adj = held.filter((c) => c.id !== city.id && city.adjacentCityIds.includes(c.id));
      const threatened = adj.filter((c) => threats.has(c.id) && c.troops < city.troops);
      const weak = adj.filter((c) => c.troops * 2 < city.troops && c.troops < SPARE_THRESHOLD);
      const pool = threatened.length > 0 ? threatened : weak;
      if (pool.length === 0) continue;
      pool.sort((a, b) => a.troops - b.troops);
      // Rush a heavier column to a city actually under threat.
      const frac = threatened.length > 0 ? 0.5 : 0.4;
      orders.push({ kind: 'march', cityId: city.id, officerId: idle[0].id, troops: Math.floor(city.troops * frac), toCityId: pool[0].id });
    } else {
      // attack directives (conquer / consume / raid) — march on the target,
      // or gather at the staging city first when coordinating (分進合擊).
      if (attackTarget == null) continue;
      const dest = stagingCity && city.id !== stagingCity ? stagingCity : attackTarget;
      if (city.id === dest) continue;
      if (city.troops < spareThreshold || city.gold < marchCost) continue;
      const marchTo = city.adjacentCityIds.includes(dest)
        ? dest
        : nextHopToward(cities, city.id, dest, playerForceId);
      if (!marchTo) continue;
      orders.push({ kind: 'march', cityId: city.id, officerId: idle[0].id, troops: Math.floor(city.troops * fraction), toCityId: marchTo });
    }
  }

  const marched = orders.filter(
    (o): o is Extract<LegionOrder, { kind: 'march' | 'ambush-camp' }> =>
      o.kind === 'march' || o.kind === 'ambush-camp');
  return {
    orders,
    summary: {
      directive: d.kind,
      targetCityId: attackTarget ?? undefined,
      marched: marched.length,
      recruited: orders.length - marched.length,
      troopsSent: marched.reduce((s, o) => s + o.troops, 0),
    },
  };
}

/** 軍團內調度 — a capable 都督 (政治 ≥60) shifts a slice of a comfortable rear
 *  city's coffers (and surplus grain) to the neediest frontier legion city that
 *  can't yet pay its way, so the front keeps moving. One transfer per season.
 *  Returns the move, or null if none is warranted. Pure. */
export function planLegionLogistics(
  legion: Legion,
  cities: Record<EntityId, City>,
  officers: Record<EntityId, Officer>,
): { fromCityId: EntityId; toCityId: EntityId; gold: number; food: number } | null {
  const marshal = officers[legion.commanderId];
  if ((marshal?.stats.politics ?? 0) < 60) return null; // needs a real administrator
  const held = legion.cityIds.map((id) => cities[id]).filter((c): c is City => !!c);
  if (held.length < 2) return null;
  const marchCost = COMMAND_DEFS['march'].goldCost;
  const donor = [...held].sort((a, b) => b.gold - a.gold)[0];
  if (!donor || donor.gold < marchCost * 3) return null; // donor must be comfortable
  const needy = held
    .filter((c) => c.id !== donor.id && c.gold < marchCost && c.troops >= 3000)
    .sort((a, b) => a.gold - b.gold)[0];
  if (!needy) return null;
  const gold = Math.min(Math.floor(donor.gold * 0.3), 400);
  const food = needy.food < needy.troops * 2 && donor.food > donor.troops * 4
    ? Math.min(Math.floor(donor.food * 0.2), 1500) : 0;
  if (gold < marchCost && food === 0) return null;
  return { fromCityId: donor.id, toCityId: needy.id, gold, food };
}
