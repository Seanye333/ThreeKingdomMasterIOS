/**
 * Test data factories. Build minimal-but-valid game entities for unit tests
 * without dragging in the full historical roster. Excluded from the app TS
 * build (see tsconfig.app.json) — only ever imported by `*.test.ts` files.
 */
import type {
  EntityId,
  Officer,
  OfficerStats,
  TacticalBattle,
  TacticalTile,
  TacticalUnit,
  TerrainKind,
  UnitType,
} from '../game/types';

let officerCounter = 0;

/** A minimal Officer with sensible defaults; override any field. */
export function mkOfficer(over: Partial<Officer> & { id?: EntityId } = {}): Officer {
  const id = over.id ?? `test-officer-${officerCounter++}`;
  const stats: OfficerStats = {
    leadership: 70,
    war: 70,
    intelligence: 70,
    politics: 60,
    charisma: 60,
    ...over.stats,
  };
  return {
    id,
    name: { zh: id, en: id },
    birthYear: 160,
    stats,
    loyalty: 100,
    locationCityId: null,
    forceId: null,
    status: 'active',
    task: null,
    equipment: [],
    skills: [],
    rank: 'soldier',
    ...over,
    stats,
  };
}

/** A single tactical unit with defaults. */
export function mkUnit(over: Partial<TacticalUnit> & { id: EntityId; officerId: EntityId }): TacticalUnit {
  const unitType: UnitType = over.unitType ?? 'infantry';
  const maxAp = over.maxAp ?? (unitType === 'cavalry' ? 4 : unitType === 'siege' ? 2 : 3);
  return {
    side: 'attacker',
    coord: { col: 0, row: 0 },
    troops: 10000,
    maxTroops: 10000,
    ap: maxAp,
    maxAp,
    morale: 100,
    isCommander: false,
    effects: [],
    unitType,
    ...over,
  };
}

/** Build a rectangular all-plain battlefield, then apply terrain overrides. */
export function mkTiles(
  width: number,
  height: number,
  overrides: Record<string, TerrainKind> = {},
): TacticalTile[] {
  const tiles: TacticalTile[] = [];
  for (let col = 0; col < width; col++) {
    for (let row = 0; row < height; row++) {
      const key = `${col},${row}`;
      tiles.push({ coord: { col, row }, terrain: overrides[key] ?? 'plain' });
    }
  }
  return tiles;
}

/** Assemble a TacticalBattle around a unit list. */
export function mkBattle(over: Partial<TacticalBattle> & { units: TacticalUnit[] } = { units: [] }): TacticalBattle {
  const width = over.width ?? 14;
  const height = over.height ?? 10;
  return {
    id: 'test-battle',
    cityId: 'test-city',
    attackerForceId: 'A',
    defenderForceId: 'D',
    width,
    height,
    tiles: over.tiles ?? mkTiles(width, height),
    turn: 1,
    activeSide: 'attacker',
    stratagemCooldowns: {},
    attackerLosses: 0,
    defenderLosses: 0,
    attackerFormation: 'none',
    defenderFormation: 'none',
    weather: 'clear',
    timeOfDay: 'day',
    windDirection: 'calm',
    ...over,
  };
}

/** Build an officer lookup map from a unit list. */
export function officerMap(units: TacticalUnit[], extra: Officer[] = []): Record<EntityId, Officer> {
  const map: Record<EntityId, Officer> = {};
  for (const u of units) map[u.officerId] = mkOfficer({ id: u.officerId });
  for (const o of extra) map[o.id] = o;
  return map;
}

/** A deterministic RNG returning a fixed value (default 0.5) for stable tests. */
export function fixedRng(value = 0.5): () => number {
  return () => value;
}

/** A seeded LCG for tests that need varied-but-deterministic randomness. */
export function seededRng(seed = 12345): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
