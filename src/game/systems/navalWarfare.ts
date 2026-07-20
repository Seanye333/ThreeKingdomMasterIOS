/**
 * 水戰深化 (§5.14) — what makes a river battle *not* a field battle.
 *
 * The tactical layer already knows how to fight on water (naval boards, ship
 * classes, 撞角/接舷/火船, 連環). What it did not know is the thing every
 * account of 赤壁 turns on: **northern armies cannot stand on a deck.**
 *
 * Four pure pieces, no state, no imports from tactical.ts (so tacticalSetup
 * and tactical.ts can both use them without a cycle):
 *
 *   1. 水軍熟練度 navalDrill — a force-level 0–100 derived from how much of
 *      its realm touches water, how good its shipyards are, whether it has
 *      trained marines (水軍都督府 policy), and whether the marshal on the
 *      field is an admiral. A landlocked northern host sits near 10; Wu sits
 *      near 90.
 *   2. 暈船 seasickness — what a low drill costs you: fighting power, opening
 *      morale, and at the very bottom an action point. **Chained hulls are
 *      steady** (that is exactly why 龐統's counsel was so persuasive) — and
 *      exactly why they burn together.
 *   3. 艦隊編成 — the hulls actually docked at your ports get handed to your
 *      contingents, biggest ship to biggest command, instead of every fleet
 *      being conjured from troop counts alone.
 *   4. 淺灘擱淺 / 搶灘登陸 — heavy hulls run aground in the shoals; crews that
 *      splash ashore fight in disorder for a turn.
 */

import type { ShipClass } from '../types/naval';
import type { TerrainKind } from '../types/tactical';
import { SHIP_CLASSES_BY_ID } from '../data/ships';

// ─── 1. 水軍熟練度 ─────────────────────────────────────────────────────

export interface NavalDrillInput {
  /** Cities the force holds — only `terrain` and `port` matter. */
  ownedCities: ReadonlyArray<{ terrain?: string; port?: boolean }>;
  /** Ports the force holds (docked shipyards). */
  ownedPorts: ReadonlyArray<{ navalTier?: number }>;
  /** 水軍都督府 — the naval-academy policy is researched. */
  navalAcademy?: boolean;
  /** The marshal leading this side carries the 舟戰 tactic. */
  commanderIsAdmiral?: boolean;
}

/** 水鄉 — a city whose people live on the water and can crew a hull. */
function isWaterCity(c: { terrain?: string; port?: boolean }): boolean {
  return c.terrain === 'water' || c.terrain === 'wetland' || c.port === true;
}

/**
 * 水軍熟練度 0–100. 50 is the neutral line where ships neither help nor hurt.
 *
 * Riverine holdings dominate (a realm of fishermen crews itself), shipyards
 * and the academy add trained hands, and an admiral on the day is worth a
 * good deal on top. A purely inland force with no ports lands around 8–12 —
 * which is where 曹操's host belongs the day it reaches the Yangtze.
 */
export function navalDrill(i: NavalDrillInput): number {
  const total = Math.max(1, i.ownedCities.length);
  const waterRatio = i.ownedCities.filter(isWaterCity).length / total;
  const bestYard = i.ownedPorts.reduce((m, p) => Math.max(m, p.navalTier ?? 1), 0);
  const yards = Math.min(3, i.ownedPorts.length) * 3;

  let d = 6                       // every army can pole a raft across a ford
    + waterRatio * 52             // 水鄉之民,生而在舟
    + bestYard * 7                // 船塢等級
    + yards                       // sheer number of harbours
    + (i.navalAcademy ? 12 : 0)   // 水軍都督府
    + (i.commanderIsAdmiral ? 14 : 0); // 舟戰之將

  return Math.max(0, Math.min(100, Math.round(d)));
}

/**
 * What a force brings to a river fight, read straight off the campaign state:
 * its seamanship, and the hulls its harbours at this city have ready.
 *
 * Deliberately typed on the shapes it actually touches (not City/Port/Officer)
 * so both the store and the battle-prep screen can call it without either one
 * dragging the other's imports along.
 */
export function navalContextFor(args: {
  forceId: string | null;
  cityId: string;
  cities: ReadonlyArray<{ ownerForceId: string | null; terrain?: string; port?: boolean }>;
  ports: ReadonlyArray<{
    ownerForceId: string | null; linkedCityId: string;
    navalTier?: number; dockedShips?: Partial<Record<ShipClass, number>>;
  }>;
  /** Officers on this side — commander first. */
  officers: ReadonlyArray<{ policies?: readonly string[]; tactics?: readonly string[] }>;
}): { drill: number; fleet: Partial<Record<ShipClass, number>> } {
  if (!args.forceId) return { drill: 50, fleet: {} };
  const ownedCities = args.cities.filter((c) => c.ownerForceId === args.forceId);
  const ownedPorts = args.ports.filter((p) => p.ownerForceId === args.forceId);
  const drill = navalDrill({
    ownedCities,
    ownedPorts,
    navalAcademy: args.officers.some((o) => o.policies?.includes('naval-academy')),
    commanderIsAdmiral: args.officers[0]?.tactics?.includes('naval-war'),
  });
  const fleet: Partial<Record<ShipClass, number>> = {};
  for (const p of ownedPorts) {
    if (p.linkedCityId !== args.cityId) continue;
    for (const [cls, n] of Object.entries(p.dockedShips ?? {})) {
      fleet[cls as ShipClass] = (fleet[cls as ShipClass] ?? 0) + (n ?? 0);
    }
  }
  return { drill, fleet };
}

export type DrillTier = 'landlubber' | 'green' | 'trained' | 'seasoned' | 'master';

export function drillTier(drill: number): DrillTier {
  if (drill < 25) return 'landlubber';
  if (drill < 45) return 'green';
  if (drill < 65) return 'trained';
  if (drill < 85) return 'seasoned';
  return 'master';
}

export const DRILL_TIER_NAMES: Record<DrillTier, { zh: string; en: string }> = {
  landlubber: { zh: '不習水戰', en: 'Landlubbers' },
  green:      { zh: '略習舟楫', en: 'Green Crews' },
  trained:    { zh: '訓練有素', en: 'Trained' },
  seasoned:   { zh: '慣戰江湖', en: 'Seasoned' },
  master:     { zh: '樓船水師', en: 'Master Fleet' },
};

export interface Seasickness {
  /** Multiplier on fighting power for units on this side. */
  powerMul: number;
  /** Opening morale delta (negative = shaken before a blow is struck). */
  moraleDelta: number;
  /** Action points shaved off each ship (0 or 1). */
  apPenalty: number;
  noteZh?: string;
  noteEn?: string;
}

/**
 * 暈船 — what standing on a rolling deck does to a crew that has never done it.
 *
 * `chained` is the cure and the trap: linked hulls stop rocking, so the crews
 * fight as if drilled to the neutral line — and then a single fireship takes
 * the whole fleet (see the fire rules in tactical.ts).
 */
export function seasickness(drill: number, chained = false): Seasickness {
  const effective = chained ? Math.max(drill, 50) : drill;
  const powerMul = Math.round((0.72 + (effective / 100) * 0.5) * 100) / 100; // 0.72 … 1.22
  const moraleDelta = effective >= 40 ? 0 : -Math.round((40 - effective) * 0.45);
  const apPenalty = effective < 18 ? 1 : 0;
  if (effective >= 40) return { powerMul, moraleDelta, apPenalty };
  return {
    powerMul, moraleDelta, apPenalty,
    noteZh: chained ? '連環穩舟,人馬得立' : '北軍不習水戰,舟中暈眩',
    noteEn: chained ? 'Chained hulls hold steady' : 'The crews are sick on the rolling deck',
  };
}

// ─── 2. 艦隊編成 ───────────────────────────────────────────────────────

/** Heaviest hull first — the order contingents are handed ships in. */
const HULL_ORDER: ShipClass[] = [
  'flagship', 'da-yi', 'hai-hu', 'warship', 'ge-chuan', 'dou-jian', 'transport', 'zou-ge',
];

/**
 * Hand the hulls actually docked at your ports to the contingents sailing out,
 * heaviest ship to the largest command (the marshal always takes the best hull
 * afloat). Contingents left over after the fleet runs dry fall back to
 * `improvise` — the troop-count guess tacticalSetup used before ports existed.
 *
 * Pure: `docked` is not mutated.
 */
export function assignFleetShipClasses(
  contingents: ReadonlyArray<{ troops: number; isCommander?: boolean }>,
  docked: Partial<Record<ShipClass, number>> | undefined,
  improvise: (troops: number, isCommander: boolean) => ShipClass,
): ShipClass[] {
  const pool: Partial<Record<ShipClass, number>> = { ...(docked ?? {}) };
  const out: ShipClass[] = new Array(contingents.length);

  // Biggest command first, but the commander always gets first pick.
  const order = contingents
    .map((c, i) => ({ i, troops: c.troops, cmd: !!c.isCommander }))
    .sort((a, b) => (a.cmd === b.cmd ? b.troops - a.troops : a.cmd ? -1 : 1));

  for (const c of order) {
    const hull = HULL_ORDER.find((h) => (pool[h] ?? 0) > 0);
    if (hull) {
      pool[hull] = (pool[hull] ?? 0) - 1;
      out[c.i] = hull;
    } else {
      out[c.i] = improvise(c.troops, c.cmd);
    }
  }
  return out;
}

/** Total hulls in a dock map — used for UI ("艦隊 12 艘") and gating. */
export function fleetSize(docked: Partial<Record<ShipClass, number>> | undefined): number {
  return Object.values(docked ?? {}).reduce((a: number, b) => a + (b ?? 0), 0);
}

// ─── 3. 淺灘擱淺 / 搶灘登陸 ────────────────────────────────────────────

/** Hulls deep enough to touch bottom in the shoals. */
const DEEP_HULLS: ReadonlyArray<ShipClass> = ['flagship', 'da-yi', 'hai-hu'];

/**
 * 擱淺 — a tower-ship in the shoals is a fort that cannot move: it fights at a
 * fraction of its strength until it warps back into the channel. Skiffs and
 * battle-junks draw little water and are unaffected (their whole advantage).
 *
 * Returns a multiplier on fighting power (1 = no effect).
 */
export function groundingMul(shipClass: ShipClass | undefined, terrain: TerrainKind): number {
  if (terrain !== 'shallows') return 1;
  if (!shipClass) return 1;
  if (DEEP_HULLS.includes(shipClass)) return 0.55;
  const cap = SHIP_CLASSES_BY_ID[shipClass]?.combatStrength ?? 150;
  return cap >= 200 ? 0.8 : 1;   // 艨艟 scrapes; 走舸/鬥艦 skim over
}

/** True when a grounded hull also loses its move (deep hulls only). */
export function isGrounded(shipClass: ShipClass | undefined, terrain: TerrainKind): boolean {
  return terrain === 'shallows' && !!shipClass && DEEP_HULLS.includes(shipClass);
}

/** Water the ships live on (both open channel and the shoals/reeds fringe). */
export function isWaterTerrain(t: TerrainKind): boolean {
  return t === 'river' || t === 'shallows' || t === 'reeds';
}

/**
 * 搶灘登陸 — a crew that beaches its boat and wades ashore lands in ranks that
 * do not exist yet. Returns the disorder turns and the morale hit; 0/0 when the
 * move is not actually a landing.
 *
 * `drill` softens it: marines who have done this before re-form faster.
 */
export function landingShock(args: {
  fromTerrain: TerrainKind;
  toTerrain: TerrainKind;
  isShip: boolean;
  drill?: number;
}): { disorderTurns: number; moraleDelta: number } {
  if (!args.isShip) return { disorderTurns: 0, moraleDelta: 0 };
  if (!isWaterTerrain(args.fromTerrain)) return { disorderTurns: 0, moraleDelta: 0 };
  if (isWaterTerrain(args.toTerrain) || args.toTerrain === 'bridge') {
    return { disorderTurns: 0, moraleDelta: 0 };
  }
  const drilled = (args.drill ?? 50) >= 65;
  return { disorderTurns: drilled ? 1 : 2, moraleDelta: drilled ? -4 : -10 };
}
