import type {
  BattleObjective,
  DamagePopup,
  EntityId,
  FormationId,
  HexCoord,
  NamedBattleMap,
  Officer,
  Reinforcement,
  ShipClass,
  StratagemId,
  TacticalBattle,
  TacticalStatus,
  TacticalTile,
  TacticalUnit,
  TerrainKind,
  TimeOfDay,
  UnitType,
  Weather,
} from '../types';
import { NAMED_MAPS_BY_CITY, NAMED_MAPS_BY_ID } from '../data/namedMaps';
import { SHIP_CLASSES_BY_ID } from '../data/ships';
import { pickVoiceLine } from '../data/voiceLines';
import { generateTerrain, type TerrainHint } from './battlefieldTerrain';
import { effectiveStats } from './traitEffects';
import { SIGNATURE_OVERRIDES } from './personalTactics';

/**
 * Unit-type counter matrix. counterBonus[attacker][defender] = multiplier on
 * damage dealt by attacker to defender. 1.0 = neutral, >1.0 = strong, <1.0 = weak.
 */
const COUNTER_MATRIX: Record<UnitType, Partial<Record<UnitType, number>>> = {
  spearmen: { cavalry: 1.5, archers: 0.75 },
  cavalry: { archers: 1.5, spearmen: 0.75 },
  archers: { spearmen: 1.5, cavalry: 0.75 },
  siege: { spearmen: 0.6, cavalry: 0.5, archers: 0.6 },
  navy: {}, // bonuses come from river terrain
  infantry: {},
};

export function counterMultiplier(a: UnitType, d: UnitType): number {
  return COUNTER_MATRIX[a][d] ?? 1.0;
}

/** Per-terrain multiplier on damage dealt by attacker. */
const TERRAIN_DAMAGE_MOD: Record<UnitType, Partial<Record<TerrainKind, number>>> = {
  cavalry: { forest: 0.6, mountain: 0.4, river: 0.5, road: 1.2, plain: 1.1, hill: 1.3, marsh: 0.4, chokepoint: 0.7, bridge: 0.8 },
  archers: { forest: 1.1, mountain: 1.15, hill: 1.25, watchtower: 1.25 },
  navy: { river: 1.6, plain: 0.4, mountain: 0.2, forest: 0.5, road: 0.6, bridge: 1.0 },
  siege: { mountain: 0.5, forest: 0.7, river: 0.5, gate: 1.4, hill: 1.1 },
  spearmen: { chokepoint: 1.25 },
  infantry: { chokepoint: 1.1, hill: 1.1 },
};

export function terrainDamageMod(t: UnitType, terrain: TerrainKind): number {
  return TERRAIN_DAMAGE_MOD[t][terrain] ?? 1.0;
}

/** Defender's terrain shield — multiplier on damage TAKEN. <1 = harder to hurt. */
export function defenderTerrainShield(terrain: TerrainKind): number {
  switch (terrain) {
    case 'chokepoint': return 0.7;  // narrow defile — only 1 file can engage
    case 'watchtower': return 0.85; // elevated bowmen
    case 'hill':       return 0.9;  // high ground
    case 'mountain':   return 0.85;
    case 'forest':     return 0.92;
    case 'gate':       return 0.6;  // city gate is tough to crack
    case 'wall':       return 0.5;  // rampart — brutal to assault directly
    default:           return 1.0;
  }
}

/**
 * Pick an appropriate unit type for an officer based on their stats
 * and any unit-type signaling skills.
 */
export function inferUnitType(o: Officer | undefined): UnitType {
  if (!o) return 'infantry';
  if (o.skills.includes('cavalry-master')) return 'cavalry';
  if (o.skills.includes('archer-master')) return 'archers';
  if (o.skills.includes('navy-master')) return 'navy';
  if (o.skills.includes('siegemaster')) return 'siege';
  // Stat-based fallback.
  if (o.stats.war >= 88 && o.stats.leadership >= 80) return 'spearmen';
  if (o.stats.war >= 85) return 'cavalry';
  if (o.stats.intelligence >= 80) return 'archers';
  return 'infantry';
}

// ─── Naval helpers ──────────────────────────────────────────────────────

/**
 * Pick a ship class for a contingent by its size — the flagship anchors the
 * line, big detachments crew proper warships, small ones ride fast skiffs.
 */
export function assignShipClass(troops: number, isCommander: boolean): ShipClass {
  if (isCommander) return 'flagship';
  if (troops >= 6000) return 'da-yi';
  if (troops >= 4000) return 'hai-hu';
  if (troops >= 2500) return 'warship';
  if (troops >= 1200) return 'dou-jian';
  return 'zou-ge';
}

/**
 * Hull-strength multiplier on a ship's combat output, derived from its class'
 * combat strength (warship = 200 = 1.0× baseline). A 樓船 flagship hits ~1.4×,
 * a 走舸 skiff ~0.85×.
 */
export function shipPowerMul(shipClass: ShipClass | undefined): number {
  if (!shipClass) return 1;
  const cs = SHIP_CLASSES_BY_ID[shipClass]?.combatStrength ?? 200;
  return Math.max(0.85, Math.min(1.6, 1 + (cs - 200) / 1000));
}

// ─── Hex grid helpers (offset coordinates, "odd-q" flat-top) ──────────

/** Distance between two hexes in offset coords. */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const [ax, ay, az] = offsetToCube(a);
  const [bx, by, bz] = offsetToCube(b);
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

function offsetToCube(h: HexCoord): [number, number, number] {
  const x = h.col;
  const z = h.row - (h.col - (h.col & 1)) / 2;
  const y = -x - z;
  return [x, y, z];
}

/** Neighbours in offset coords for odd-q flat-top hexes. */
export function hexNeighbours(h: HexCoord): HexCoord[] {
  const odd = (h.col & 1) === 1;
  const deltas = odd
    ? [
        { col: +1, row: 0 }, { col: +1, row: +1 },
        { col: 0,  row: +1 }, { col: -1, row: +1 },
        { col: -1, row: 0 }, { col: 0,  row: -1 },
      ]
    : [
        { col: +1, row: -1 }, { col: +1, row: 0 },
        { col: 0,  row: +1 },  { col: -1, row: 0 },
        { col: -1, row: -1 }, { col: 0,  row: -1 },
      ];
  return deltas.map((d) => ({ col: h.col + d.col, row: h.row + d.row }));
}

// ─── Battle setup ─────────────────────────────────────────────────────

export type WindDirection = 'north' | 'south' | 'east' | 'west' | 'calm';

export interface SetupParams {
  cityId: EntityId;
  width: number;
  height: number;
  attackerForceId: EntityId | null;
  defenderForceId: EntityId | null;
  attackers: Array<{ officer: Officer; troops: number; unitType?: UnitType }>;
  defenders: Array<{ officer: Officer; troops: number; unitType?: UnitType }>;
  attackerFormation?: FormationId;
  defenderFormation?: FormationId;
  attackerObjective?: BattleObjective;
  defenderObjective?: BattleObjective;
  weather?: Weather;
  timeOfDay?: TimeOfDay;
  /** Wind direction (snapshot of strategic weather). Biases fire spread. */
  windDirection?: WindDirection;
  reinforcements?: Reinforcement[];
  /** Pre-rolled scripted map (overrides city-based lookup). */
  namedMapId?: EntityId;
  /** Build slots from the defender's city — placed on the hex grid as fixed structures. */
  buildSlots?: ReadonlyArray<{ slot: number; buildingId?: import('../data/defenseBuildings').DefenseBuildingId; level: number }>;
  /** Geography hint (terrain category, port flag, coords) — drives terrain generation. */
  terrainHint?: TerrainHint;
  /** Field battle (army vs army in the open) — no city, so no rampart wall. */
  field?: boolean;
}

// (Legacy TERRAIN_RNG_SEED removed — terrain generation now lives in
// battlefieldTerrain.ts which seeds its own RNG from the cityId.)

/**
 * Peace-time preview of the same battlefield a tactical battle would use,
 * without any units. Used by CityMapScreen to show players where their
 * defense structures will appear in actual combat.
 */
export interface BattlefieldPreview {
  width: number;
  height: number;
  tiles: TacticalTile[];
  weather: Weather;
  timeOfDay: TimeOfDay;
  specialTiles: NamedBattleMap['specialTiles'];
  /** Hex coords where the 8 build slots map to. */
  slotPositions: HexCoord[];
  namedMapName?: { zh: string; en: string };
}

export function previewBattlefield(
  cityId: EntityId,
  hint: TerrainHint = {},
  fallbackWidth = 14,
  fallbackHeight = 10,
): BattlefieldPreview {
  const namedMapId = NAMED_MAPS_BY_CITY[cityId];
  const namedMap: NamedBattleMap | undefined = namedMapId
    ? NAMED_MAPS_BY_ID[namedMapId]
    : undefined;
  const width = namedMap?.width ?? fallbackWidth;
  const height = namedMap?.height ?? fallbackHeight;
  const tiles = generateTerrain(cityId, width, height, hint, namedMap?.terrainOverrides);
  return {
    width, height, tiles,
    weather: namedMap?.weather ?? 'clear',
    timeOfDay: namedMap?.timeOfDay ?? 'day',
    specialTiles: namedMap?.specialTiles ?? [],
    slotPositions: computeSlotPositions(width, height),
    namedMapName: namedMap?.name,
  };
}


export function setupTacticalBattle(p: SetupParams): TacticalBattle {
  // Named map override?
  const namedMapId = p.namedMapId ?? NAMED_MAPS_BY_CITY[p.cityId];
  const namedMap: NamedBattleMap | undefined = namedMapId
    ? NAMED_MAPS_BY_ID[namedMapId]
    : undefined;
  const width = namedMap?.width ?? p.width;
  const height = namedMap?.height ?? p.height;
  const weather: Weather = namedMap?.weather ?? p.weather ?? 'clear';
  const timeOfDay: TimeOfDay = namedMap?.timeOfDay ?? p.timeOfDay ?? 'day';

  // A water city (and no scripted named-map terrain) makes this a naval
  // engagement: open-water board, every contingent crews a ship.
  const isNaval = !namedMap && p.terrainHint?.terrain === 'water';

  // Geography-aware terrain — uses the city's terrain/port/coords if provided.
  const tiles = generateTerrain(
    p.cityId,
    width,
    height,
    { ...(p.terrainHint ?? {}), naval: isNaval },
    namedMap?.terrainOverrides,
  );

  const placeUnits = (
    pool: Array<{ officer: Officer; troops: number; unitType?: UnitType }>,
    side: 'attacker' | 'defender',
  ): TacticalUnit[] => {
    // Front column at the edge; back column one hex inland for larger armies.
    const frontCol = side === 'attacker' ? 0 : width - 1;
    const backCol  = side === 'attacker' ? 1 : width - 2;
    // Front rank takes the most units height permits; overflow goes to back rank.
    const frontRankCapacity = height; // can fill the whole column if needed
    return pool.slice(0, frontRankCapacity * 2).map((entry, i) => {
      const isBackRank = i >= frontRankCapacity;
      const rankIndex = isBackRank ? i - frontRankCapacity : i;
      // Interleave around the vertical center: 0, +1, -1, +2, -2, ...
      const row = Math.floor(height / 2)
        + (rankIndex % 2 === 0 ? -Math.floor(rankIndex / 2) : Math.floor((rankIndex + 1) / 2));
      // In a naval battle every contingent is a ship crew, regardless of the
      // officer's land specialty.
      const unitType = isNaval ? 'navy' : (entry.unitType ?? inferUnitType(entry.officer));
      const isCommander = i === 0;
      const shipClass = isNaval ? assignShipClass(entry.troops, isCommander) : undefined;
      const maxAp = unitType === 'cavalry' ? 4 : unitType === 'siege' ? 2 : 3;
      return {
        id: `${side}-${entry.officer.id}`,
        officerId: entry.officer.id,
        side,
        coord: {
          col: isBackRank ? backCol : frontCol,
          row: Math.max(0, Math.min(height - 1, row)),
        },
        troops: entry.troops,
        maxTroops: entry.troops,
        ap: maxAp,
        maxAp,
        morale: 100,
        isCommander,
        effects: [],
        unitType,
        ...(shipClass ? { shipClass } : {}),
      };
    });
  };

  const units = [
    ...placeUnits(p.attackers, 'attacker'),
    ...placeUnits(p.defenders, 'defender'),
  ];

  // Generate spawn voice lines for famous officers.
  const log: TacticalBattle['log'] = [];
  for (const u of units) {
    const voice = pickVoiceLine(u.officerId, 'spawn', Math.random);
    if (voice) {
      log.push({ turn: 1, text: voice, speaker: u.officerId, kind: 'voice' });
    }
  }

  // Place city defense structures on the defender's edge — 8 compass-rose
  // slots map to a 2-column band on the right (defender) side of the map.
  const cityStructures: TacticalBattle['cityStructures'] = [];
  if (p.buildSlots && p.buildSlots.length > 0) {
    // Even-distributed positions in the rightmost 2 columns.
    const SLOT_TO_HEX = computeSlotPositions(width, height);
    // Track which hex coords are already occupied by units so we don't overlap.
    const taken = new Set(units.map((u) => `${u.coord.col},${u.coord.row}`));
    for (const slot of p.buildSlots) {
      if (!slot.buildingId) continue;
      const target = SLOT_TO_HEX[slot.slot];
      if (!target) continue;
      const key = `${target.col},${target.row}`;
      if (taken.has(key)) continue;  // skip if conflicting with a unit
      taken.add(key);
      cityStructures.push({
        slotIndex: slot.slot,
        buildingId: slot.buildingId,
        level: slot.level,
        coord: target,
        hp: 100 * slot.level + 100,
      });
    }
  }

  // Ambush setup: units of a side using the ten-ambush formation that
  // begin on forest tiles start hidden. Revealed when an enemy moves
  // adjacent, or when the hidden unit itself attacks.
  const ambushSides = new Set<'attacker' | 'defender'>();
  if (p.attackerFormation === 'ten-ambush') ambushSides.add('attacker');
  if (p.defenderFormation === 'ten-ambush') ambushSides.add('defender');
  // Defender prep advantage: starts the fight with +10 morale (they had
  // time to dig in, brief troops, post lookouts).
  const finalUnits = units.map((u) => {
    let next: TacticalUnit = u;
    if (ambushSides.has(u.side)) {
      const tile = tiles.find((t) => t.coord.col === u.coord.col && t.coord.row === u.coord.row);
      if (tile?.terrain === 'forest') next = { ...next, hidden: true };
    }
    if (u.side === 'defender') {
      next = { ...next, morale: Math.min(100, next.morale + 10) };
    }
    return next;
  });

  // ── City rampart: procedural sieges get a battered wall line just in front
  // of the defender with a central gate. The wall spans only the middle rows,
  // so an army without siege gear can still flow around the flanks (just
  // slower) and the fight never hard-stalls. Named maps (their own terrain),
  // field battles and naval engagements stay unwalled.
  let battleTiles = tiles;
  let wallHp: Record<string, number> | undefined;
  if (!isNaval && !p.field && !namedMap && width >= 8 && height >= 6) {
    const wallCol = Math.max(2, width - 3);
    const r0 = Math.floor(height * 0.28);
    const r1 = Math.ceil(height * 0.72) - 1;
    const gateRow = Math.floor(height / 2);
    const occupied = new Set(finalUnits.map((u) => `${u.coord.col},${u.coord.row}`));
    const hp: Record<string, number> = {};
    battleTiles = tiles.map((t) => {
      if (t.coord.col !== wallCol || t.coord.row < r0 || t.coord.row > r1) return t;
      const key = `${t.coord.col},${t.coord.row}`;
      if (occupied.has(key)) return t; // never wall over a unit
      if (t.coord.row === gateRow) {
        hp[key] = 700;
        return { ...t, terrain: 'gate' as TerrainKind };
      }
      hp[key] = 1000;
      return { ...t, terrain: 'wall' as TerrainKind };
    });
    if (Object.keys(hp).length > 0) wallHp = hp;
  }

  return {
    id: `tac-${p.cityId}-${Date.now()}`,
    cityId: p.cityId,
    attackerForceId: p.attackerForceId,
    defenderForceId: p.defenderForceId,
    width,
    height,
    tiles: battleTiles,
    units: finalUnits,
    turn: 1,
    activeSide: 'attacker',
    stratagemCooldowns: {},
    attackerLosses: 0,
    defenderLosses: 0,
    attackerFormation: p.attackerFormation ?? 'none',
    defenderFormation: p.defenderFormation ?? 'none',
    attackerObjective: p.attackerObjective,
    defenderObjective: p.defenderObjective,
    weather,
    timeOfDay,
    windDirection: p.windDirection ?? 'calm',
    reinforcements: [...(namedMap?.reinforcements ?? []), ...(p.reinforcements ?? [])],
    specialTiles: namedMap?.specialTiles ?? [],
    damagePopups: [],
    log,
    cityStructures: cityStructures.length > 0 ? cityStructures : undefined,
    naval: isNaval || undefined,
    wallHp,
    field: p.field || undefined,
  };
}

/**
 * Maps the 8 compass-rose slot indices (N/NE/E/SE/S/SW/W/NW) to hex coords
 * on the defender's side of the battlefield (rightmost 2 columns).
 */
export function computeSlotPositions(width: number, height: number): HexCoord[] {
  const colA = width - 1;       // defender's edge column
  const colB = Math.max(0, width - 2); // one hex inland
  const rows = {
    top:    Math.max(0, Math.floor(height * 0.15)),
    upper:  Math.max(0, Math.floor(height * 0.30)),
    mid:    Math.floor(height / 2),
    lower:  Math.min(height - 1, Math.floor(height * 0.70)),
    bottom: Math.min(height - 1, Math.floor(height * 0.85)),
  };
  // Index order matches SLOT_POSITIONS in defenseBuildings.ts: N, NE, E, SE, S, SW, W, NW
  return [
    { col: colB, row: rows.top },     // 0 N
    { col: colA, row: rows.top },     // 1 NE
    { col: colA, row: rows.mid },     // 2 E
    { col: colA, row: rows.bottom },  // 3 SE
    { col: colB, row: rows.bottom },  // 4 S
    { col: colB, row: rows.lower },   // 5 SW
    { col: colB, row: rows.mid },     // 6 W
    { col: colB, row: rows.upper },   // 7 NW
  ];
}

// ─── Action processing ────────────────────────────────────────────────

const TERRAIN_MOVE_COST: Record<TerrainKind, number> = {
  plain: 1,
  road: 1,    // road cost = 1 (no bonus in this simple model)
  forest: 2,
  mountain: 3,
  river: 3,
  hill: 2,
  marsh: 3,       // boggy ground
  chokepoint: 1,  // narrow but flat
  bridge: 1,      // crosses river cheaply
  gate: 99,       // impassable until siege breaks it (handled elsewhere)
  wall: 99,       // impassable rampart until battered down (handled elsewhere)
  watchtower: 2,  // climbable
};

export function tileAt(b: TacticalBattle, c: HexCoord): TacticalTile | undefined {
  return b.tiles.find((t) => t.coord.col === c.col && t.coord.row === c.row);
}

export function unitAt(b: TacticalBattle, c: HexCoord): TacticalUnit | undefined {
  return b.units.find(
    (u) =>
      u.coord.col === c.col &&
      u.coord.row === c.row &&
      u.troops > 0,
  );
}

export function moveCost(b: TacticalBattle, to: HexCoord): number {
  const t = tileAt(b, to);
  if (!t) return Infinity;
  return TERRAIN_MOVE_COST[t.terrain];
}

export function canMove(
  b: TacticalBattle,
  unit: TacticalUnit,
  to: HexCoord,
): boolean {
  if (unit.ap <= 0) return false;
  const dist = hexDistance(unit.coord, to);
  if (dist !== 1) return false;
  const cost = moveCost(b, to);
  if (cost > unit.ap) return false;
  if (unitAt(b, to)) return false;
  return true;
}

export function moveUnit(
  b: TacticalBattle,
  unitId: EntityId,
  to: HexCoord,
): TacticalBattle {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit || !canMove(b, unit, to)) return b;
  const cost = moveCost(b, to);
  // Reveal any hidden enemy that just became adjacent to the moved unit
  // (and any hidden unit adjacent to a watchtower the moved unit reveals).
  const adj = hexNeighbours(to);
  return {
    ...b,
    units: b.units.map((u) => {
      if (u.id === unitId) return { ...u, coord: to, ap: u.ap - cost };
      // Hidden enemy of the moving unit, now adjacent? Reveal.
      if (u.hidden && u.side !== unit.side &&
          adj.some((n) => n.col === u.coord.col && n.row === u.coord.row)) {
        return { ...u, hidden: false };
      }
      return u;
    }),
  };
}

/**
 * Battering power a siege contingent brings to bear on a wall or gate per
 * assault — scales with the size of the engine crew.
 */
export function siegeAssaultPower(troops: number): number {
  return Math.floor(troops * 0.15) + 120;
}

/**
 * Siege units adjacent to a 城門 gate or 城牆 wall hex spend an attack action to
 * batter it. Destructible hexes (those tracked in `wallHp`) chip down over
 * several assaults and only become a passable breach at 0 HP; hexes without
 * tracked HP (e.g. named-map gates) break in a single hit, as they always did.
 * Non-siege units cannot batter fortifications.
 *
 * Kept named `breakGate` for its existing callers; it now handles walls too.
 */
export function breakGate(b: TacticalBattle, unitId: EntityId, coord: HexCoord): TacticalBattle {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit || unit.unitType !== 'siege') return b;
  if (unit.ap <= 0) return b;
  const tile = tileAt(b, coord);
  if (!tile || (tile.terrain !== 'gate' && tile.terrain !== 'wall')) return b;
  if (hexDistance(unit.coord, coord) !== 1) return b;

  const key = `${coord.col},${coord.row}`;
  const isGate = tile.terrain === 'gate';
  const curHp = b.wallHp?.[key];
  const spendAp = (u: TacticalUnit) => (u.id === unitId ? { ...u, ap: 0 } : u);

  // Tracked HP — chip it down; breach only at 0.
  if (curHp !== undefined) {
    const newHp = curHp - siegeAssaultPower(unit.troops);
    if (newHp > 0) {
      return {
        ...b,
        wallHp: { ...b.wallHp, [key]: newHp },
        units: b.units.map(spendAp),
        log: [
          ...(b.log ?? []),
          { turn: b.turn, text: isGate ? '攻城槌猛撞城門！' : '投石轟擊城牆！', kind: 'event' },
        ],
      };
    }
    const nextWallHp = { ...(b.wallHp ?? {}) };
    delete nextWallHp[key];
    return {
      ...b,
      tiles: b.tiles.map((t) =>
        t.coord.col === coord.col && t.coord.row === coord.row ? { ...t, terrain: 'plain' } : t,
      ),
      wallHp: Object.keys(nextWallHp).length > 0 ? nextWallHp : undefined,
      units: b.units.map(spendAp),
      log: [
        ...(b.log ?? []),
        { turn: b.turn, text: isGate ? '城門告破！' : '城牆崩塌，缺口洞開！', kind: 'event' },
      ],
    };
  }

  // No tracked HP — one-shot (legacy named-map gate behaviour).
  return {
    ...b,
    tiles: b.tiles.map((t) =>
      t.coord.col === coord.col && t.coord.row === coord.row ? { ...t, terrain: 'plain' } : t,
    ),
    units: b.units.map(spendAp),
    log: [...(b.log ?? []), { turn: b.turn, text: 'Siege engine smashes the gate down!', kind: 'event' }],
  };
}

/**
 * 雲梯登城 — a (non-siege) foot unit adjacent to a 城牆 wall can scale it and
 * drop onto the far side, *if* a friendly siege engine (the ladder/tower) is
 * also adjacent to that same wall hex. Spends all AP. Lets an assault pour
 * through the rampart without first reducing it to rubble.
 */
export function scaleWall(b: TacticalBattle, unitId: EntityId, wallCoord: HexCoord): TacticalBattle {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit || unit.ap <= 0 || unit.unitType === 'siege') return b;
  const tile = tileAt(b, wallCoord);
  if (!tile || tile.terrain !== 'wall') return b;
  if (hexDistance(unit.coord, wallCoord) !== 1) return b;
  // Need a siege engine of our side braced against the same wall.
  const hasLadder = b.units.some(
    (u) => u.side === unit.side && u.unitType === 'siege' && u.troops > 0 &&
      hexDistance(u.coord, wallCoord) === 1,
  );
  if (!hasLadder) return b;
  // Land on a free, passable hex on the far side of the wall.
  const landing = hexNeighbours(wallCoord).find((c) => {
    const t = tileAt(b, c);
    if (!t || TERRAIN_MOVE_COST[t.terrain] >= 99) return false;
    if (unitAt(b, c)) return false;
    return unit.side === 'attacker' ? c.col > wallCoord.col : c.col < wallCoord.col;
  });
  if (!landing) return b;
  return {
    ...b,
    units: b.units.map((u) => (u.id === unitId ? { ...u, coord: landing, ap: 0 } : u)),
    log: [...(b.log ?? []), { turn: b.turn, text: '雲梯架起，士卒踏牆而入！', kind: 'event' }],
  };
}

/**
 * Voluntary retreat: a unit walks off the battlefield with its remaining
 * troops intact. Removes the unit from the battle (counted as a loss
 * since they're no longer engaged, but at full troops — no rout).
 * Commanders cannot retreat — they must be the last to leave.
 */
export function retreatUnit(b: TacticalBattle, unitId: EntityId): TacticalBattle {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) return b;
  if (unit.isCommander) return b; // commander stays
  // Must be at the appropriate edge (close to a side edge) — within 2 hexes.
  const myEdgeCol = unit.side === 'attacker' ? 0 : b.width - 1;
  if (Math.abs(unit.coord.col - myEdgeCol) > 2) return b;
  const remaining = b.units.filter((u) => u.id !== unitId);
  const lossKey = unit.side === 'attacker' ? 'attackerLosses' : 'defenderLosses';
  return {
    ...b,
    units: remaining,
    [lossKey]: (b[lossKey] ?? 0) + Math.floor(unit.troops * 0.1), // 10% counted as stragglers
  };
}

export function canAttack(
  _b: TacticalBattle,
  unit: TacticalUnit,
  target: TacticalUnit,
): boolean {
  if (unit.ap <= 0 || unit.side === target.side) return false;
  return hexDistance(unit.coord, target.coord) === 1;
}

/**
 * Compute damage as a function of stat × troops modified by terrain, status,
 * formation, weather, and unit-type counters. Also emits damage popups and
 * fires voice lines for the attacker.
 */
export function attackUnits(
  b: TacticalBattle,
  attackerId: EntityId,
  targetId: EntityId,
  officers: Record<EntityId, Officer>,
  rng: () => number,
): TacticalBattle {
  const attacker = b.units.find((u) => u.id === attackerId);
  const target = b.units.find((u) => u.id === targetId);
  if (!attacker || !target) return b;
  if (!canAttack(b, attacker, target)) return b;
  // Ambush bonus + reveal: hidden attacker striking from concealment
  // gets +30% damage this hit, then is revealed.
  const ambushBonus = attacker.hidden ? 1.3 : 1.0;
  if (attacker.hidden) {
    b = { ...b, units: b.units.map((u) => u.id === attackerId ? { ...u, hidden: false } : u) };
  }

  const ao = officers[attacker.officerId];
  const To = officers[target.officerId];
  // Wounded officers fight at reduced effectiveness — 受傷帶兵.
  const aWoundedMul = ao?.status === 'wounded' ? 0.85 : 1.0;
  const dWoundedMul = To?.status === 'wounded' ? 1.15 : 1.0;
  const aWar = ao ? effectiveStats(ao).war : 50;
  const dLead = To ? effectiveStats(To).leadership : 50;

  // Defending status halves incoming damage.
  const targetDefending = target.effects.some((e) => e.kind === 'defending');
  // Burning status: 5% troops of attacker added to damage (the flames keep eating).
  const attackerBurning = attacker.effects.some((e) => e.kind === 'burning');
  const attackerDemoralized = attacker.effects.some((e) => e.kind === 'demoralized');

  const counter = counterMultiplier(attacker.unitType, target.unitType);
  const aTerrainTile = tileAt(b, attacker.coord);
  const aTerrainMod = aTerrainTile ? terrainDamageMod(attacker.unitType, aTerrainTile.terrain) : 1;

  // Formation effects on defense.
  const targetFormation =
    target.side === 'attacker' ? b.attackerFormation : b.defenderFormation;
  const defenseMul = defensiveFormationBonus(b, target, targetFormation ?? 'none');

  // Attacker's formation offensive bonus.
  const attackerFormation =
    attacker.side === 'attacker' ? b.attackerFormation : b.defenderFormation;
  const offenseMul = offensiveFormationBonus(
    attackerFormation ?? 'none',
    attacker.unitType,
    b.turn,
  );

  // Weather effects.
  const weatherMul = weatherDamageMul(b.weather, attacker.unitType);

  // Defender's terrain shield (chokepoint, watchtower, hill, mountain,
  // forest, gate) reduces incoming damage.
  const dTerrainTile = tileAt(b, target.coord);
  const dShield = dTerrainTile ? defenderTerrainShield(dTerrainTile.terrain) : 1.0;
  // 糧道枯竭：turn ≥ 10 both sides start to suffer 5% per turn beyond,
  // capped at -40% so battles still resolve.
  const fatigueMul = b.turn >= 10
    ? Math.max(0.6, 1 - 0.05 * (b.turn - 9))
    : 1.0;

  // Naval: a bigger hull (樓船/大翼) hits harder than a 走舸 skiff.
  const shipMul = shipPowerMul(attacker.shipClass);

  const base =
    Math.floor((attacker.troops * (aWar + 30) * (0.85 + rng() * 0.3)) / (dLead + 50));
  let damage = Math.floor(
    base * counter * aTerrainMod * weatherMul * defenseMul * offenseMul *
    dShield * ambushBonus * fatigueMul * aWoundedMul * dWoundedMul * shipMul,
  );
  if (targetDefending) damage = Math.floor(damage / 2);
  if (attackerBurning) damage = Math.floor(damage * 0.9);
  if (attackerDemoralized) damage = Math.floor(damage * 0.8);

  // Critical hit on natural high roll.
  const isCrit = rng() < 0.12;
  if (isCrit) damage = Math.floor(damage * 1.6);

  const newTroops = Math.max(0, target.troops - damage);
  const moraleLoss = Math.floor((damage / Math.max(1, target.maxTroops)) * 50);

  // Counter-attack: target deals back ~40% if still alive.
  let counterTroops = attacker.troops;
  let counterDamage = 0;
  if (newTroops > 0) {
    const dWar = To ? effectiveStats(To).war : 50;
    const aLead = ao ? effectiveStats(ao).leadership : 50;
    const counterBase = Math.floor(
      (target.troops * (dWar + 30) * (0.85 + rng() * 0.3) * 0.4) / (aLead + 50),
    );
    counterTroops = Math.max(0, attacker.troops - counterBase);
    counterDamage = counterBase;
  }

  // Damage popups.
  const popups: DamagePopup[] = [
    {
      id: `dmg-${Date.now()}-1`,
      coord: target.coord,
      text: `-${damage.toLocaleString()}${isCrit ? '!' : ''}`,
      color: isCrit ? '#ffce4a' : '#ff6a4a',
      spawnedAt: Date.now(),
    },
  ];
  if (counterDamage > 0) {
    popups.push({
      id: `dmg-${Date.now()}-2`,
      coord: attacker.coord,
      text: `-${counterDamage.toLocaleString()}`,
      color: '#88b7e8',
      spawnedAt: Date.now() + 1,
    });
  }

  // Voice lines.
  const log = b.log ? [...b.log] : [];
  const attackVoice = pickVoiceLine(attacker.officerId, isCrit ? 'critical' : 'attack', rng);
  if (attackVoice) {
    log.push({ turn: b.turn, text: attackVoice, speaker: attacker.officerId, kind: 'voice' });
  }
  if (newTroops === 0) {
    const killVoice = pickVoiceLine(attacker.officerId, 'kill', rng);
    if (killVoice) {
      log.push({ turn: b.turn, text: killVoice, speaker: attacker.officerId, kind: 'voice' });
    }
  } else if (newTroops < target.maxTroops * 0.3) {
    const lowVoice = pickVoiceLine(target.officerId, 'lowHp', rng);
    if (lowVoice) {
      log.push({ turn: b.turn, text: lowVoice, speaker: target.officerId, kind: 'voice' });
    }
  }

  // Chained-unit damage spread.
  const chainEffect = target.effects.find((e) => e.kind === 'chained') as
    | { kind: 'chained'; turnsLeft: number; chainedWith: EntityId[] }
    | undefined;
  const chainSpread = Math.floor(damage * 0.5);
  const units = b.units.map((u) => {
    if (u.id === targetId) {
      return {
        ...u,
        troops: newTroops,
        morale: Math.max(0, u.morale - moraleLoss),
      };
    }
    if (u.id === attackerId) {
      return { ...u, ap: u.ap - 1, troops: counterTroops };
    }
    // Chain damage to linked units.
    if (chainEffect && chainEffect.chainedWith.includes(u.id) && u.side === target.side) {
      const tr = Math.max(0, u.troops - chainSpread);
      popups.push({
        id: `dmg-${Date.now()}-chain-${u.id}`,
        coord: u.coord,
        text: `-${chainSpread.toLocaleString()}`,
        color: '#ff9070',
        spawnedAt: Date.now() + 2,
      });
      return { ...u, troops: tr };
    }
    return u;
  });

  return {
    ...b,
    units,
    damagePopups: [...(b.damagePopups ?? []), ...popups],
    log,
  };
}

function defensiveFormationBonus(
  b: TacticalBattle,
  target: TacticalUnit,
  formation: FormationId,
): number {
  if (formation === 'fish-scale') {
    const adjAllies = b.units.filter(
      (u) =>
        u.side === target.side &&
        u.id !== target.id &&
        hexDistance(u.coord, target.coord) === 1,
    );
    if (adjAllies.length > 0) return 0.85; // 15% damage reduction
  }
  if (formation === 'spread-out') return 0.9;
  // ── New formations ──
  if (formation === 'square') return 0.80;             // all-side defense
  if (formation === 'crescent-moon') return 0.85;      // anti-flank
  if (formation === 'wheel') {
    // Compounding: each turn elapsed shaves more losses. floor 0.65.
    return Math.max(0.65, 0.95 - b.turn * 0.05);
  }
  if (formation === 'back-to-water') return 0.70;      // -30% own losses
  if (formation === 'trinity') {
    const sameSide = b.units.filter((u) => u.side === target.side).length;
    if (sameSide >= 3) return 0.90;                    // -10% when 3+ officers
  }
  if (formation === 'crescent-withdraw') {
    if (target.unitType === 'archers') return 0.75;    // crossbow corps protected
    return 0.95;
  }
  if (formation === 'long-snake') {
    // Strong from front, weak from flank — approximated as flat +5% bonus.
    return 0.95;
  }
  // ── Phase 53 additions ──
  if (formation === 'armored-cart') {
    // The cart wall — extra strong vs cavalry attackers.
    // (Attacker's unit type is unknown here; approximate as flat 0.80 defense.)
    return 0.80;
  }
  if (formation === 'stacked') {
    // Layered shield wall — strong frontal defense.
    return 0.60;
  }
  if (formation === 'four-symbols') {
    // Balanced — +15% on all sides translates to defense ~0.85.
    return 0.85;
  }
  if (formation === 'rattan-armor') {
    // Arrows skid off — but caller for fire-attack must double damage elsewhere.
    if (b.weather === 'rain') return 0.95; // wet rattan loses springiness
    return 0.70;
  }
  if (formation === 'five-elements') {
    // Cycle: earth turn (turn % 5 == 4) reduces losses heavily.
    const phase = b.turn % 5;
    if (phase === 4) return 0.75; // 土 — loss reduction
    if (phase === 1) return 0.85; // 木 — defense
    return 0.92;
  }
  return 1.0;
}

/**
 * Offensive multiplier from the attacker's formation.
 */
export function offensiveFormationBonus(
  formation: FormationId,
  unitType: UnitType,
  turn: number,
): number {
  if (formation === 'awl') {
    return turn === 1 ? 1.35 : 1.0;                    // first-strike piercing
  }
  if (formation === 'arrow-tip') {
    if (unitType === 'cavalry') return 1.15;
    return 1.05;
  }
  if (formation === 'wild-goose') {
    if (unitType === 'archers') return 1.15;
    return 1.05;
  }
  if (formation === 'back-to-water') return 1.20;      // death-or-victory
  if (formation === 'ten-ambush') return 1.25;         // multi-axis surprise
  if (formation === 'crescent-withdraw' && unitType === 'archers') return 1.25;
  if (formation === 'long-snake') return 1.05;
  if (formation === 'trinity') return 1.10;
  // ── Phase 53 additions ──
  if (formation === 'yoke' && unitType === 'spearmen') return 1.50; // anti-cavalry pikes
  if (formation === 'armored-cart' && unitType === 'infantry') return 1.15;
  if (formation === 'mandarin-duck' && unitType === 'infantry') return 1.25;
  if (formation === 'four-symbols') return 1.15;
  if (formation === 'seven-star') {
    // Stratagem-focused formation; small generic +5% melee.
    return 1.05;
  }
  if (formation === 'five-elements') {
    const phase = turn % 5;
    if (phase === 0 && (unitType === 'infantry' || unitType === 'spearmen')) return 1.20; // 金 — weapons
    if (phase === 2 && unitType === 'cavalry') return 1.20; // 水 — flow
    if (phase === 3 && unitType === 'archers') return 1.25; // 火 — archers (fire arrows)
    return 1.05;
  }
  return 1.0;
}

function weatherDamageMul(w: Weather, unitType: UnitType): number {
  if (w === 'rain' && unitType === 'archers') return 0.75;
  if (w === 'fog' && unitType === 'archers') return 0.7;
  if (w === 'snow') return 0.9;
  if (w === 'wind' && unitType === 'navy') return 1.15;
  return 1.0;
}

// ─── Stratagems ──────────────────────────────────────────────────────

export function applyStratagem(
  b: TacticalBattle,
  unitId: EntityId,
  stratagem: StratagemId,
  targetCoord: HexCoord,
  officers: Record<EntityId, Officer>,
): { battle: TacticalBattle; ok: boolean; reason?: string } {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) return { battle: b, ok: false, reason: 'no unit' };
  const cooldownKey = `${unitId}-${stratagem}`;
  const onCd = (b.stratagemCooldowns[cooldownKey] ?? 0) > b.turn;
  if (onCd) return { battle: b, ok: false, reason: 'on cooldown' };
  if (unit.ap < 1) return { battle: b, ok: false, reason: 'no AP' };

  const off = officers[unit.officerId];
  switch (stratagem) {
    case 'fire-attack': {
      if ((off?.stats.intelligence ?? 0) < 70)
        return { battle: b, ok: false, reason: 'requires INT 70' };
      if (hexDistance(unit.coord, targetCoord) > 3)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // Wind doubles fire duration; rain halves it.
      const turns = b.weather === 'wind' ? 5 : b.weather === 'rain' ? 1 : 3;
      const updated = setStatus(b, target.id, { kind: 'burning', turnsLeft: turns });
      return finalize(updated, unitId, stratagem, 0);
    }
    case 'confusion': {
      if ((off?.stats.intelligence ?? 0) < 75)
        return { battle: b, ok: false, reason: 'requires INT 75' };
      if (hexDistance(unit.coord, targetCoord) > 4)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const updated = setStatus(b, target.id, { kind: 'confused', turnsLeft: 2 });
      return finalize(updated, unitId, stratagem, 0);
    }
    case 'defend': {
      const updated = setStatus(b, unit.id, { kind: 'defending', turnsLeft: 1 });
      return finalize(updated, unitId, stratagem, 0);
    }
    case 'rally': {
      if ((off?.stats.intelligence ?? 0) < 60)
        return { battle: b, ok: false, reason: 'requires INT 60' };
      if (hexDistance(unit.coord, targetCoord) > 2)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side !== unit.side)
        return { battle: b, ok: false, reason: 'must be friendly' };
      const restored = Math.floor(target.maxTroops * 0.15);
      const updated: TacticalBattle = {
        ...b,
        units: b.units.map((u) =>
          u.id === target.id
            ? {
                ...u,
                troops: Math.min(u.maxTroops, u.troops + restored),
                morale: Math.min(100, u.morale + 25),
              }
            : u,
        ),
      };
      return finalize(updated, unitId, stratagem, 2);
    }
    case 'charge': {
      if (hexDistance(unit.coord, targetCoord) > 1)
        return { battle: b, ok: false, reason: 'adjacent only' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // Charge: +50% damage, spend all AP.
      const aWar = off?.stats.war ?? 50;
      const dLead = officers[target.officerId]?.stats.leadership ?? 50;
      const damage = Math.floor(
        (unit.troops * (aWar + 30) * 1.5) / (dLead + 50),
      );
      const updated: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id)
            return { ...u, troops: Math.max(0, u.troops - damage), morale: Math.max(0, u.morale - 25) };
          if (u.id === unit.id) return { ...u, ap: 0 };
          return u;
        }),
      };
      return finalize(updated, unitId, stratagem, 2);
    }
    case 'rain-of-arrows': {
      const maxRange = b.timeOfDay === 'night' ? 2 : 4;
      const d = hexDistance(unit.coord, targetCoord);
      if (d > maxRange || d < 2)
        return { battle: b, ok: false, reason: `range 2–${maxRange}` };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const damage = Math.floor(target.troops * 0.12);
      const popup: DamagePopup = {
        id: `dmg-${Date.now()}-arrows`,
        coord: target.coord,
        text: `-${damage.toLocaleString()}`,
        color: '#88b7e8',
        spawnedAt: Date.now(),
      };
      const updated: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id)
            return { ...u, troops: Math.max(0, u.troops - damage) };
          if (u.id === unit.id) return { ...u, ap: u.ap - 1 };
          return u;
        }),
        damagePopups: [...(b.damagePopups ?? []), popup],
      };
      return finalize(updated, unitId, stratagem, 1);
    }
    case 'chain-ships': {
      if ((off?.stats.intelligence ?? 0) < 80)
        return { battle: b, ok: false, reason: 'requires INT 80' };
      if (hexDistance(unit.coord, targetCoord) > 3)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // Chain target + its adjacent allies.
      const chained = b.units.filter(
        (u) => u.side === target.side && hexDistance(u.coord, target.coord) <= 1,
      );
      const chainedIds = chained.map((u) => u.id);
      let next = b;
      for (const c of chained) {
        next = setStatus(next, c.id, {
          kind: 'chained',
          turnsLeft: 4,
          chainedWith: chainedIds.filter((id) => id !== c.id),
        });
      }
      return finalize(next, unitId, stratagem, 0);
    }
    case 'false-retreat': {
      if ((off?.stats.intelligence ?? 0) < 70)
        return { battle: b, ok: false, reason: 'requires INT 70' };
      // Confuse the closest enemy.
      const enemies = b.units
        .filter((u) => u.side !== unit.side)
        .sort((a, c) => hexDistance(unit.coord, a.coord) - hexDistance(unit.coord, c.coord));
      const closest = enemies[0];
      if (!closest) return { battle: b, ok: false, reason: 'no enemies' };
      const next = setStatus(b, closest.id, { kind: 'confused', turnsLeft: 2 });
      return finalize(next, unitId, stratagem, 0);
    }
    case 'precognition': {
      if ((off?.stats.intelligence ?? 0) < 90)
        return { battle: b, ok: false, reason: 'requires INT 90' };
      let next = b;
      for (const e of b.units.filter((u) => u.side !== unit.side)) {
        next = setStatus(next, e.id, { kind: 'revealed', turnsLeft: 2 });
      }
      return finalize(next, unitId, stratagem, 0);
    }
    case 'lightning': {
      if ((off?.stats.intelligence ?? 0) < 85)
        return { battle: b, ok: false, reason: 'requires INT 85' };
      if (hexDistance(unit.coord, targetCoord) > 4)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target) return { battle: b, ok: false, reason: 'no target' };
      const damage = Math.floor(target.troops * 0.15);
      const confuse = Math.random() < 0.3;
      let next: TacticalBattle = {
        ...b,
        units: b.units.map((u) =>
          u.id === target.id ? { ...u, troops: Math.max(0, u.troops - damage) } : u,
        ),
        damagePopups: [
          ...(b.damagePopups ?? []),
          {
            id: `dmg-${Date.now()}-lightning`,
            coord: target.coord,
            text: `-${damage.toLocaleString()}⚡`,
            color: '#e0d090',
            spawnedAt: Date.now(),
          },
        ],
      };
      if (confuse) next = setStatus(next, target.id, { kind: 'confused', turnsLeft: 2 });
      return finalize(next, unitId, stratagem, 0);
    }
    case 'supply-strike': {
      if ((off?.stats.intelligence ?? 0) < 75)
        return { battle: b, ok: false, reason: 'requires INT 75' };
      let next = b;
      for (const e of b.units.filter((u) => u.side !== unit.side)) {
        next = setStatus(next, e.id, { kind: 'demoralized', turnsLeft: 3 });
      }
      return finalize(next, unitId, stratagem, 0);
    }
    case 'gallop': {
      // Lü Bu's signature: charge up to 3 hexes in a straight line.
      if (hexDistance(unit.coord, targetCoord) > 3 || hexDistance(unit.coord, targetCoord) < 1)
        return { battle: b, ok: false, reason: 'range 1–3' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // Move adjacent to target, deal 1.75× damage.
      const neighbours = hexNeighbours(target.coord);
      const landing = neighbours.find(
        (c) => tileAt(b, c) && !unitAt(b, c),
      );
      const aWar = off?.stats.war ?? 80;
      const dLead = officers[target.officerId]?.stats.leadership ?? 50;
      const damage = Math.floor(
        (unit.troops * (aWar + 30) * 1.75) / (dLead + 50),
      );
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === unit.id && landing) {
            return { ...u, coord: landing, ap: 0 };
          }
          if (u.id === target.id) {
            return { ...u, troops: Math.max(0, u.troops - damage) };
          }
          return u;
        }),
        damagePopups: [
          ...(b.damagePopups ?? []),
          {
            id: `dmg-${Date.now()}-gallop`,
            coord: target.coord,
            text: `-${damage.toLocaleString()}!`,
            color: '#ff6a4a',
            spawnedAt: Date.now(),
          },
        ],
        log: [
          ...(b.log ?? []),
          {
            turn: b.turn,
            text: '飛将，突貫!',
            speaker: unit.officerId,
            kind: 'voice',
          },
        ],
      };
      return finalize(next, unitId, stratagem, 3);
    }
    case 'dragon-veil': {
      // Zhao Yun's signature: hit every adjacent enemy.
      const adjEnemies = b.units.filter(
        (u) => u.side !== unit.side && hexDistance(u.coord, unit.coord) === 1,
      );
      if (adjEnemies.length === 0)
        return { battle: b, ok: false, reason: 'no adjacent enemies' };
      const aWar = off?.stats.war ?? 80;
      const popups: DamagePopup[] = [];
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          const enemy = adjEnemies.find((e) => e.id === u.id);
          if (enemy) {
            const dLead = officers[u.officerId]?.stats.leadership ?? 50;
            const dmg = Math.floor(
              (unit.troops * (aWar + 30) * 0.6) / (dLead + 50),
            );
            popups.push({
              id: `dmg-${Date.now()}-veil-${u.id}`,
              coord: u.coord,
              text: `-${dmg.toLocaleString()}`,
              color: '#ff6a4a',
              spawnedAt: Date.now(),
            });
            return { ...u, troops: Math.max(0, u.troops - dmg) };
          }
          return u;
        }),
        damagePopups: [...(b.damagePopups ?? []), ...popups],
        log: [
          ...(b.log ?? []),
          {
            turn: b.turn,
            text: '龍威在此!',
            speaker: unit.officerId,
            kind: 'voice',
          },
        ],
      };
      return finalize(next, unitId, stratagem, 3);
    }
    case 'ram': {
      // 撞角 — drive the prow into an adjacent ship. Heavy hull damage scaled
      // by this ship's class; spends all AP like a charge.
      if (hexDistance(unit.coord, targetCoord) > 1)
        return { battle: b, ok: false, reason: 'adjacent only' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const aWar = off?.stats.war ?? 60;
      const dLead = officers[target.officerId]?.stats.leadership ?? 50;
      const damage = Math.floor(
        (unit.troops * (aWar + 30) * 1.6 * shipPowerMul(unit.shipClass)) / (dLead + 50),
      );
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id)
            return { ...u, troops: Math.max(0, u.troops - damage), morale: Math.max(0, u.morale - 20) };
          if (u.id === unit.id) return { ...u, ap: 0 };
          return u;
        }),
        damagePopups: [
          ...(b.damagePopups ?? []),
          { id: `dmg-${Date.now()}-ram`, coord: target.coord, text: `-${damage.toLocaleString()}!`, color: '#ff6a4a', spawnedAt: Date.now() },
        ],
      };
      return finalize(next, unitId, stratagem, 2);
    }
    case 'board': {
      // 接舷 — grapple an adjacent ship and fight it out on the decks. War-based
      // marine melee that shatters morale and costs the boarder little.
      if (hexDistance(unit.coord, targetCoord) > 1)
        return { battle: b, ok: false, reason: 'adjacent only' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const aWar = off?.stats.war ?? 60;
      const dWar = officers[target.officerId]?.stats.war ?? 50;
      const damage = Math.floor((unit.troops * (aWar + 30) * 1.1) / (dWar + 60));
      const selfLoss = Math.floor(damage * 0.25);
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id)
            return { ...u, troops: Math.max(0, u.troops - damage), morale: Math.max(0, u.morale - 35) };
          if (u.id === unit.id) return { ...u, troops: Math.max(0, u.troops - selfLoss) };
          return u;
        }),
        damagePopups: [
          ...(b.damagePopups ?? []),
          { id: `dmg-${Date.now()}-board`, coord: target.coord, text: `-${damage.toLocaleString()}`, color: '#ff8a4a', spawnedAt: Date.now() },
        ],
      };
      return finalize(next, unitId, stratagem, 1);
    }
    case 'fire-ship': {
      // 火船 — send blazing hulks downwind into the enemy line. Sets fire (long
      // in wind, doused in rain) plus immediate damage; ruinous against a fleet
      // chained together (連環計 + 火船 = 赤壁).
      if ((off?.stats.intelligence ?? 0) < 65)
        return { battle: b, ok: false, reason: 'requires INT 65' };
      if (hexDistance(unit.coord, targetCoord) > 3)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const turns = b.weather === 'wind' ? 5 : b.weather === 'rain' ? 1 : 4;
      const damage = Math.floor(target.troops * 0.12);
      let next: TacticalBattle = {
        ...b,
        units: b.units.map((u) =>
          u.id === target.id ? { ...u, troops: Math.max(0, u.troops - damage) } : u,
        ),
        damagePopups: [
          ...(b.damagePopups ?? []),
          { id: `dmg-${Date.now()}-fireship`, coord: target.coord, text: `-${damage.toLocaleString()}🔥`, color: '#ff7a3a', spawnedAt: Date.now() },
        ],
      };
      next = setStatus(next, target.id, { kind: 'burning', turnsLeft: turns });
      return finalize(next, unitId, stratagem, 3);
    }
  }
}

function setStatus(
  b: TacticalBattle,
  unitId: EntityId,
  status: TacticalStatus,
): TacticalBattle {
  return {
    ...b,
    units: b.units.map((u) => {
      if (u.id !== unitId) return u;
      const filtered = u.effects.filter((e) => e.kind !== status.kind);
      return { ...u, effects: [...filtered, status] };
    }),
  };
}

function finalize(
  b: TacticalBattle,
  unitId: EntityId,
  stratagem: StratagemId,
  cooldownTurns: number,
): { battle: TacticalBattle; ok: boolean } {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) return { battle: b, ok: false };
  const newAp = stratagem === 'charge' ? 0 : Math.max(0, unit.ap - 1);
  const next: TacticalBattle = {
    ...b,
    units: b.units.map((u) => (u.id === unitId ? { ...u, ap: newAp } : u)),
    stratagemCooldowns: {
      ...b.stratagemCooldowns,
      [`${unitId}-${stratagem}`]: b.turn + cooldownTurns,
    },
  };
  return { battle: next, ok: true };
}

// ─── Turn end ────────────────────────────────────────────────────────

export function endTurn(b: TacticalBattle): TacticalBattle {
  // Eight-trigrams aura: friendly units in formation regen 4% per turn.
  const inFormation = (side: 'attacker' | 'defender') =>
    (side === 'attacker' ? b.attackerFormation : b.defenderFormation) === 'eight-trigrams';

  // Apply ongoing effects (burning), tick durations, then flip side.
  let tickedUnits = b.units.map((u) => {
    let troops = u.troops;
    const newEffects: TacticalStatus[] = [];
    // Rattan-armor doubles fire damage (oil-cured rattan ignites); so do
    // pitch-caulked wooden ships — fire is death on the water (赤壁).
    const uSideFormation = u.side === 'attacker' ? b.attackerFormation : b.defenderFormation;
    const fireMul = uSideFormation === 'rattan-armor' || u.unitType === 'navy' ? 2.0 : 1.0;
    for (const e of u.effects) {
      if (e.kind === 'burning') {
        const burn = Math.floor(u.maxTroops * 0.08 * fireMul);
        troops = Math.max(0, troops - burn);
      }
      if (e.turnsLeft > 1) {
        newEffects.push({ ...e, turnsLeft: e.turnsLeft - 1 });
      }
    }
    // Eight Trigrams heal.
    if (inFormation(u.side)) {
      troops = Math.min(u.maxTroops, troops + Math.floor(u.maxTroops * 0.04));
    }
    return { ...u, troops, effects: newEffects, ap: u.maxAp };
  });

  // ── Fire spread: each burning unit may set an adjacent unit alight.
  // Rain blocks spread entirely; wind doubles the chance and biases the
  // spread direction. Forest hexes and rattan-armor units catch fire most
  // readily.
  if (b.weather !== 'rain') {
    const baseSpreadChance = b.weather === 'wind' ? 0.45 : 0.22;
    // Map wind direction to a delta vector preference. East wind = fire
    // spreads west-to-east; south wind = north-to-south, etc.
    const windDelta: Record<NonNullable<TacticalBattle['windDirection']>, { col: number; row: number }> = {
      north: { col: 0, row: -1 },
      south: { col: 0, row: 1 },
      east:  { col: 1, row: 0 },
      west:  { col: -1, row: 0 },
      calm:  { col: 0, row: 0 },
    };
    const wd = windDelta[b.windDirection ?? 'calm'];
    const burningIds = tickedUnits
      .filter((u) => u.effects.some((e) => e.kind === 'burning'))
      .map((u) => u.id);
    for (const bid of burningIds) {
      const src = tickedUnits.find((u) => u.id === bid);
      if (!src) continue;
      const neighbours = hexNeighbours(src.coord);
      // Score each adjacent occupied hex by alignment with wind, then pick
      // the highest-scored to bias spread direction.
      const adjUnits = tickedUnits.filter(
        (u) => neighbours.some((n) => n.col === u.coord.col && n.row === u.coord.row) &&
               !u.effects.some((e) => e.kind === 'burning'),
      );
      if (adjUnits.length === 0) continue;
      // Higher score = better match with wind direction.
      const scored = adjUnits.map((u) => {
        const dx = u.coord.col - src.coord.col;
        const dy = u.coord.row - src.coord.row;
        const align = wd.col * dx + wd.row * dy;
        return { u, score: align };
      });
      scored.sort((a, b1) => b1.score - a.score);
      const adjUnit = scored[0].u;
      const tile = b.tiles.find(
        (t) => t.coord.col === adjUnit.coord.col && t.coord.row === adjUnit.coord.row,
      );
      const adjFormation = adjUnit.side === 'attacker' ? b.attackerFormation : b.defenderFormation;
      let chance = baseSpreadChance;
      if (tile?.terrain === 'forest') chance *= 1.6;
      if (adjFormation === 'rattan-armor') chance *= 2.0;
      if (adjUnit.unitType === 'navy') chance *= 2.0; // fire leaps hull to hull
      // Strong wind alignment bonus when picked unit is downwind.
      if (scored[0].score > 0 && b.windDirection !== 'calm') chance *= 1.3;
      if (Math.random() < chance) {
        tickedUnits = tickedUnits.map((u) =>
          u.id === adjUnit.id
            ? { ...u, effects: [...u.effects, { kind: 'burning', turnsLeft: 2 }] }
            : u,
        );
      }
    }
  }

  // ── Morale chain: any unit whose troops just dropped to 0 (routing this
  // turn) drags adjacent ALLY morale down by 15 — panic spreads.
  const justRouted = tickedUnits.filter(
    (u) => u.troops <= 0 && b.units.find((x) => x.id === u.id)!.troops > 0,
  );
  if (justRouted.length > 0) {
    tickedUnits = tickedUnits.map((u) => {
      if (u.troops <= 0) return u;
      let drop = 0;
      for (const r of justRouted) {
        if (r.side !== u.side) continue;
        const adj = hexNeighbours(r.coord).some((n) => n.col === u.coord.col && n.row === u.coord.row);
        if (adj) drop += 15;
      }
      if (drop === 0) return u;
      return { ...u, morale: Math.max(0, u.morale - drop) };
    });
  }

  // Spawn reinforcements scheduled for this turn.
  const arrivedUnits: TacticalUnit[] = [];
  const arrivalLog: NonNullable<TacticalBattle['log']> = [];
  const remaining = (b.reinforcements ?? []).filter((r) => {
    if (r.arriveTurn !== b.turn + 1) return true;
    // Spawn one unit at the chosen edge.
    const spawnCol =
      r.edge === 'west' ? 0
      : r.edge === 'east' ? b.width - 1
      : Math.floor(b.width / 2);
    const spawnRow =
      r.edge === 'north' ? 0
      : r.edge === 'south' ? b.height - 1
      : Math.floor(b.height / 2);
    arrivedUnits.push({
      id: `${r.side}-reinforce-${r.officerId}-t${b.turn + 1}`,
      officerId: r.officerId,
      side: r.side,
      coord: { col: spawnCol, row: spawnRow },
      troops: r.troops,
      maxTroops: r.troops,
      ap: r.unitType === 'cavalry' ? 4 : r.unitType === 'siege' ? 2 : 3,
      maxAp: r.unitType === 'cavalry' ? 4 : r.unitType === 'siege' ? 2 : 3,
      morale: 100,
      isCommander: false,
      effects: [],
      unitType: r.unitType,
    });
    if (r.announcement) {
      arrivalLog.push({
        turn: b.turn + 1,
        text: r.announcement,
        kind: 'arrival',
      });
    }
    return false;
  });

  // Remove routed units (troops 0 or morale 0).
  const allUnits = [...tickedUnits, ...arrivedUnits];
  const surviving = allUnits.filter((u) => u.troops > 0 && u.morale > 0);
  const removed = allUnits.filter((u) => u.troops <= 0 || u.morale <= 0);
  const newAttackerLoss = removed
    .filter((u) => u.side === 'attacker')
    .reduce((s, u) => s + u.maxTroops, 0);
  const newDefenderLoss = removed
    .filter((u) => u.side === 'defender')
    .reduce((s, u) => s + u.maxTroops, 0);

  // Objective progress.
  let attackerObj = b.attackerObjective;
  let defenderObj = b.defenderObjective;
  attackerObj = tickObjective(attackerObj, surviving, 'attacker', b.turn + 1);
  defenderObj = tickObjective(defenderObj, surviving, 'defender', b.turn + 1);

  // Winner check.
  const attackerLeft = surviving.some((u) => u.side === 'attacker');
  const defenderLeft = surviving.some((u) => u.side === 'defender');
  const attackerCommanderDown = !surviving.some(
    (u) => u.side === 'attacker' && u.isCommander,
  );
  const defenderCommanderDown = !surviving.some(
    (u) => u.side === 'defender' && u.isCommander,
  );

  let winner: 'attacker' | 'defender' | undefined;
  if (attackerObj?.resolved === 'success') winner = 'attacker';
  else if (defenderObj?.resolved === 'success') winner = 'defender';
  else if (!attackerLeft || attackerCommanderDown) winner = 'defender';
  else if (!defenderLeft || defenderCommanderDown) winner = 'attacker';
  else if (b.turn + 1 > 30) {
    // 糧盡兵疲 — beyond turn 30, force resolution by remaining troop strength.
    // Tie favors defender (they held).
    const aTroops = surviving
      .filter((u) => u.side === 'attacker')
      .reduce((s, u) => s + u.troops, 0);
    const dTroops = surviving
      .filter((u) => u.side === 'defender')
      .reduce((s, u) => s + u.troops, 0);
    winner = aTroops > dTroops * 1.1 ? 'attacker' : 'defender';
  }

  // ── City defense structures auto-act at end of attacker's turn ──
  // Watchtowers + arrow-platforms fire at closest attacker.
  // Caltrops damage adjacent attacker units.
  // Rockfalls trigger when an attacker is on the trap hex.
  const turnEndingForAttacker = b.activeSide === 'attacker';
  const structurePopups: DamagePopup[] = [];
  const structureLog: NonNullable<TacticalBattle['log']> = [];
  let updatedStructures = b.cityStructures;
  let unitsAfterStructures = surviving;
  let additionalAttackerLoss = 0;
  if (turnEndingForAttacker && b.cityStructures && b.cityStructures.length > 0) {
    const next = b.cityStructures.map((s) => ({ ...s }));
    for (const s of next) {
      if (s.hp <= 0 || s.triggered) continue;
      const attackerUnits = unitsAfterStructures.filter((u) => u.side === 'attacker' && u.troops > 0);
      if (attackerUnits.length === 0) continue;
      // Range and damage per kind.
      let range = 0, dmg = 0, oneShot = false;
      switch (s.buildingId) {
        case 'watchtower':       range = 4; dmg = 80 * s.level; break;
        case 'arrow-platform':   range = 5; dmg = 100 * s.level; break;
        case 'rockfall':         range = 1; dmg = 200 * s.level; oneShot = true; break;
        case 'caltrops':         range = 1; dmg = 40 * s.level; break;
        case 'beacon':           range = 0; dmg = 0; break;  // intel-only, no auto-fire
        case 'iron-chains':      range = 1; dmg = 60 * s.level; break;
        default:                 range = 0; dmg = 0;
      }
      if (range === 0 || dmg === 0) continue;
      // Find closest attacker in range.
      let target: typeof attackerUnits[0] | null = null;
      let targetDist = Infinity;
      for (const u of attackerUnits) {
        const d = hexDistance(s.coord, u.coord);
        if (d <= range && d < targetDist) {
          targetDist = d;
          target = u;
        }
      }
      if (!target) continue;
      unitsAfterStructures = unitsAfterStructures.map((u) =>
        u.id === target!.id ? { ...u, troops: Math.max(0, u.troops - dmg) } : u,
      );
      additionalAttackerLoss += Math.min(target.troops, dmg);
      // UI popup at the target's hex.
      const popupId = `struct-${s.slotIndex}-t${b.turn}`;
      structurePopups.push({
        id: popupId,
        coord: target.coord,
        text: `−${dmg}`,
        color: '#d4a84a',
        spawnedAt: Date.now(),
      });
      const ZH: Record<string, string> = {
        'watchtower': '箭樓', 'arrow-platform': '箭台', 'rockfall': '落石',
        'caltrops': '拒馬', 'iron-chains': '鐵索',
      };
      structureLog.push({
        turn: b.turn,
        text: `${ZH[s.buildingId] ?? s.buildingId} 射出！${dmg} 兵傷亡。`,
        kind: 'event',
      });
      if (oneShot) s.triggered = true;
    }
    updatedStructures = next;
  }

  return {
    ...b,
    units: unitsAfterStructures.filter((u) => u.troops > 0 && u.morale > 0),
    turn: b.turn + 1,
    activeSide: b.activeSide === 'attacker' ? 'defender' : 'attacker',
    attackerLosses: b.attackerLosses + newAttackerLoss + additionalAttackerLoss,
    defenderLosses: b.defenderLosses + newDefenderLoss,
    winner: winner ?? b.winner,
    attackerObjective: attackerObj,
    defenderObjective: defenderObj,
    reinforcements: remaining,
    log: [...(b.log ?? []), ...arrivalLog, ...structureLog],
    damagePopups: structurePopups, // visible briefly on turn flip
    cityStructures: updatedStructures,
  };
}

function tickObjective(
  obj: BattleObjective | undefined,
  units: TacticalUnit[],
  side: 'attacker' | 'defender',
  _nextTurn: number,
): BattleObjective | undefined {
  if (!obj || obj.resolved) return obj;
  if (obj.kind === 'hold-tile' && obj.tileCoord) {
    const holding = units.some(
      (u) =>
        u.side === side &&
        u.coord.col === obj.tileCoord!.col &&
        u.coord.row === obj.tileCoord!.row,
    );
    const progress = (obj.progress ?? 0) + (holding ? 1 : 0);
    if (progress >= (obj.turnsRequired ?? 5)) {
      return { ...obj, progress, resolved: 'success' };
    }
    return { ...obj, progress };
  }
  if (obj.kind === 'survive-turns') {
    const progress = (obj.progress ?? 0) + 1;
    if (progress >= (obj.turnsRequired ?? 8)) {
      return { ...obj, progress, resolved: 'success' };
    }
    return { ...obj, progress };
  }
  if (obj.kind === 'escape') {
    const cmd = units.find((u) => u.side === side && u.isCommander);
    if (!cmd) return { ...obj, resolved: 'failure' };
    const atEdge = cmd.coord.col === 0 || cmd.coord.col === cmd.coord.col; // placeholder
    if (atEdge) return { ...obj, resolved: 'success' };
  }
  return obj;
}

// ─── AI ───────────────────────────────────────────────────────────────

/**
 * Compute the post-battle resolution: surviving officer IDs by side,
 * captured officers (defeated commanders kept alive), loot.
 */
export interface BattleResolution {
  winner: 'attacker' | 'defender' | null;
  attackerSurvivors: EntityId[];
  defenderSurvivors: EntityId[];
  attackerDead: EntityId[];
  defenderDead: EntityId[];
  capturedOfficerIds: EntityId[];
  attackerLosses: number;
  defenderLosses: number;
  lootGold: number;
}

export function resolveBattleEnd(
  battle: TacticalBattle,
  officers: Record<EntityId, Officer>,
): BattleResolution {
  const surviving = battle.units;
  const startingIds = new Set([
    ...(battle.units.map((u) => u.officerId)),
  ]);
  // Capture logic: officers who lost their unit but the *side* won are captured.
  const winner = battle.winner ?? null;
  const survivorsBySide = (side: 'attacker' | 'defender') =>
    surviving.filter((u) => u.side === side).map((u) => u.officerId);
  const attackerSurvivors = survivorsBySide('attacker');
  const defenderSurvivors = survivorsBySide('defender');

  const captured: EntityId[] = [];
  const dead: EntityId[] = [];

  // Loser-side: each missing officer is captured (with charisma roll), else killed.
  const lostOfficers = (side: 'attacker' | 'defender') => {
    const survivingSet = new Set(survivorsBySide(side));
    return battle.units
      .filter((u) => u.side === side && !survivingSet.has(u.officerId))
      .map((u) => u.officerId);
  };
  void startingIds;

  if (winner === 'attacker') {
    for (const id of lostOfficers('defender')) {
      const o = officers[id];
      if (!o) continue;
      // Capture chance based on attacker's charisma (commander).
      const acc = surviving.find((u) => u.side === 'attacker' && u.isCommander);
      const cmdCha = acc ? (officers[acc.officerId]?.stats.charisma ?? 60) : 60;
      if (Math.random() < cmdCha / 130) captured.push(id);
      else dead.push(id);
    }
  } else if (winner === 'defender') {
    for (const id of lostOfficers('attacker')) {
      const dc = surviving.find((u) => u.side === 'defender' && u.isCommander);
      const cmdCha = dc ? (officers[dc.officerId]?.stats.charisma ?? 60) : 60;
      if (Math.random() < cmdCha / 130) captured.push(id);
      else dead.push(id);
    }
  }

  // Loot: 10–25% of loser's troop value as gold-equivalent.
  const lootGold = winner
    ? Math.floor(
        ((winner === 'attacker' ? battle.defenderLosses : battle.attackerLosses) *
          (0.1 + Math.random() * 0.15)) /
          10,
      )
    : 0;

  return {
    winner,
    attackerSurvivors,
    defenderSurvivors,
    attackerDead: winner === 'attacker' ? [] : dead,
    defenderDead: winner === 'defender' ? [] : dead,
    capturedOfficerIds: captured,
    attackerLosses: battle.attackerLosses,
    defenderLosses: battle.defenderLosses,
    lootGold,
  };
}

/**
 * N1 — AI stratagem heuristic. Returns the battle after using a stratagem,
 * or null if none was applicable. Higher-INT officers get to attempt this
 * with a higher probability.
 */
function aiTryStratagem(
  b: TacticalBattle,
  unit: TacticalUnit,
  officers: Record<EntityId, Officer>,
  rng: () => number,
  skill = 0.7,
): TacticalBattle | null {
  if (unit.ap < 1) return null;
  const off = officers[unit.officerId];
  if (!off) return null;
  // Probability to attempt a stratagem at all (high INT casts more; a more
  // skilled AI reaches for its tricks more readily).
  const baseChance = (0.20 + Math.max(0, (off.stats.intelligence - 60)) / 200) * (0.6 + 0.6 * skill);
  if (rng() > baseChance) return null;

  const enemies = b.units.filter((u) => u.side !== unit.side);
  const friends = b.units.filter((u) => u.side === unit.side);
  if (enemies.length === 0) return null;

  // Candidate stratagems in priority order, with target picker for each.
  type Cand = { id: StratagemId; target: HexCoord };
  const candidates: Cand[] = [];

  // 1. defend self if our troops are low
  if (unit.troops / Math.max(1, unit.maxTroops) < 0.4) {
    candidates.push({ id: 'defend', target: unit.coord });
  }
  // 2. rally a wounded friend within 2
  if (off.stats.intelligence >= 60) {
    const wounded = friends
      .filter((f) => f.id !== unit.id && f.troops / Math.max(1, f.maxTroops) < 0.5)
      .sort((a, b1) => hexDistance(unit.coord, a.coord) - hexDistance(unit.coord, b1.coord))
      .filter((f) => hexDistance(unit.coord, f.coord) <= 2);
    if (wounded.length > 0) candidates.push({ id: 'rally', target: wounded[0].coord });
  }
  // 3. fire-attack the nearest enemy in range 3
  if (off.stats.intelligence >= 70) {
    const inRange = enemies
      .filter((e) => hexDistance(unit.coord, e.coord) <= 3)
      .sort((a, b1) => b1.troops - a.troops); // hit strongest first
    if (inRange.length > 0) candidates.push({ id: 'fire-attack', target: inRange[0].coord });
  }
  // 4. confusion on the nearest enemy in range 4
  if (off.stats.intelligence >= 75) {
    const inRange = enemies
      .filter((e) => hexDistance(unit.coord, e.coord) <= 4)
      .sort((a, b1) => hexDistance(unit.coord, a.coord) - hexDistance(unit.coord, b1.coord));
    if (inRange.length > 0) candidates.push({ id: 'confusion', target: inRange[0].coord });
  }
  // 5. lightning on the nearest enemy in range 4 (very high INT)
  if (off.stats.intelligence >= 90) {
    const inRange = enemies
      .filter((e) => hexDistance(unit.coord, e.coord) <= 4)
      .sort((a, b1) => b1.troops - a.troops);
    if (inRange.length > 0) candidates.push({ id: 'lightning', target: inRange[0].coord });
  }
  // 6. dragon-veil if multiple adjacent enemies
  const adjEnemies = enemies.filter((e) => hexDistance(unit.coord, e.coord) === 1);
  if (adjEnemies.length >= 2 && off.stats.war >= 80) {
    candidates.push({ id: 'dragon-veil', target: unit.coord });
  }
  // 7. charge an adjacent enemy
  if (adjEnemies.length > 0) {
    candidates.push({ id: 'charge', target: adjEnemies[0].coord });
  }
  // 8. rain-of-arrows for archers/siege/navy
  if (['archers', 'siege', 'navy'].includes(unit.unitType) && off.stats.intelligence >= 60) {
    const inRange = enemies
      .filter((e) => hexDistance(unit.coord, e.coord) <= 4)
      .sort((a, b1) => b1.troops - a.troops);
    if (inRange.length > 0) candidates.push({ id: 'rain-of-arrows', target: inRange[0].coord });
  }
  // 9. gallop for cavalry
  if (unit.unitType === 'cavalry' && off.stats.war >= 70) {
    const inRange = enemies
      .filter((e) => hexDistance(unit.coord, e.coord) <= 3)
      .sort((a, b1) => hexDistance(unit.coord, a.coord) - hexDistance(unit.coord, b1.coord));
    if (inRange.length > 0) candidates.push({ id: 'gallop', target: inRange[0].coord });
  }
  // 10. naval play for ships — fireships (best vs a chained/clustered fleet),
  //     then ram or board an adjacent enemy ship.
  if (unit.unitType === 'navy') {
    if (off.stats.intelligence >= 65) {
      const inRange = enemies
        .filter((e) => hexDistance(unit.coord, e.coord) <= 3)
        .sort((a, b1) => {
          // Prefer chained targets (fire will spread through the whole fleet).
          const ac = a.effects.some((x) => x.kind === 'chained') ? 1 : 0;
          const bc = b1.effects.some((x) => x.kind === 'chained') ? 1 : 0;
          return bc - ac || b1.troops - a.troops;
        });
      if (inRange.length > 0) candidates.push({ id: 'fire-ship', target: inRange[0].coord });
    }
    if (adjEnemies.length > 0) {
      const ramTarget = [...adjEnemies].sort((a, b1) => b1.troops - a.troops)[0];
      if (off.stats.war >= 60) candidates.push({ id: 'board', target: ramTarget.coord });
      if (off.stats.war >= 55) candidates.push({ id: 'ram', target: ramTarget.coord });
    }
  }

  for (const c of candidates) {
    const r = applyStratagem(b, unit.id, c.id, c.target, officers);
    if (r.ok) return r.battle;
  }
  return null;
}

export interface AITurnResult {
  battle: TacticalBattle;
  /** Each entry: a stratagem an AI unit used this turn. For signature
   *  tactics the officer owns, `tacticId` resolves to the named tactic. */
  signatures: Array<{ tacticId: string; coord: HexCoord; unitId: EntityId; stratagemId: StratagemId }>;
}

/** Reverse-lookup: for a stratagem id, find the most signature-worthy
 *  tactic in the officer's list that maps to that underlying stratagem. */
function inferSignatureTactic(
  officer: Officer | undefined,
  stratagemId: StratagemId,
): string {
  if (!officer) return stratagemId;
  const owned = ((officer as Officer & { tactics?: string[] }).tactics) ?? [];
  // Try exact tactics owned by officer that map to this underlying.
  for (const tid of owned) {
    const ov = SIGNATURE_OVERRIDES[tid];
    if (ov && ov.underlying === stratagemId) return tid;
  }
  return stratagemId;
}

// ─── AI movement & role helpers ────────────────────────────────────────

/** Map the global game difficulty onto the tactical AI's competence knob. */
export function aiSkillForDifficulty(difficulty: 'easy' | 'normal' | 'hard'): number {
  return difficulty === 'easy' ? 0.35 : difficulty === 'hard' ? 1.0 : 0.7;
}

/** Battlefield role drives how the AI positions and fights a unit. */
export type TacticalRole = 'melee' | 'ranged' | 'strategist' | 'siege';

/** Classify a unit: siege heads for gates, ranged kite, fragile high-INT
 *  officers hang back and cast, everyone else brawls on the front line. */
export function unitRole(o: Officer | undefined, unitType: UnitType): TacticalRole {
  if (unitType === 'siege') return 'siege';
  if (unitType === 'archers' || unitType === 'navy') return 'ranged';
  const war = o?.stats.war ?? 60;
  const int = o?.stats.intelligence ?? 60;
  if (war < 65 && int >= 75) return 'strategist';
  return 'melee';
}

/** Acting order: front line first so the squishy units can react. */
function roleRank(role: TacticalRole): number {
  return role === 'melee' ? 0 : role === 'siege' ? 1 : role === 'ranged' ? 2 : 3;
}

/** How much a tile suits this unit type — rewards attack-boosting terrain and
 *  cover (low incoming-damage terrain). Higher is better for positioning. */
function terrainAffinity(type: UnitType, terrain: TerrainKind): number {
  return terrainDamageMod(type, terrain) + (1 - defenderTerrainShield(terrain));
}

/**
 * Dijkstra cost field flowing outward from `goal` over passable terrain.
 * Other units block their hex (you can't march through a stack) — except the
 * goal hex itself, so we can path *up to* an enemy and stop adjacent. Gates
 * (cost ≥ 99) are impassable. Returns cost keyed by "col,row".
 */
function costFieldTo(b: TacticalBattle, goal: HexCoord, mover: TacticalUnit): Map<string, number> {
  const key = (c: HexCoord) => `${c.col},${c.row}`;
  const goalKey = key(goal);
  const blocked = new Set(
    b.units
      .filter((u) => u.troops > 0 && u.id !== mover.id && key(u.coord) !== goalKey)
      .map((u) => key(u.coord)),
  );
  const dist = new Map<string, number>([[goalKey, 0]]);
  const frontier: Array<{ c: HexCoord; d: number }> = [{ c: goal, d: 0 }];
  while (frontier.length > 0) {
    // Grid is small — a linear scan for the cheapest node is plenty fast.
    let bi = 0;
    for (let i = 1; i < frontier.length; i++) if (frontier[i].d < frontier[bi].d) bi = i;
    const { c, d } = frontier.splice(bi, 1)[0];
    if (d > (dist.get(key(c)) ?? Infinity)) continue;
    for (const n of hexNeighbours(c)) {
      const t = tileAt(b, n);
      if (!t) continue;
      const nk = key(n);
      if (blocked.has(nk)) continue;
      const step = TERRAIN_MOVE_COST[t.terrain];
      if (step >= 99) continue; // gate / impassable
      const nd = d + step;
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        frontier.push({ c: n, d: nd });
      }
    }
  }
  return dist;
}

/**
 * Best single step toward a goal: follows the cost field so the unit routes
 * *around* mountains, rivers and friendly stacks instead of stalling against
 * them, breaking ties toward terrain that suits the unit.
 */
export function bestStepToward(
  b: TacticalBattle,
  unit: TacticalUnit,
  goal: HexCoord,
): HexCoord | null {
  const field = costFieldTo(b, goal, unit);
  const key = (c: HexCoord) => `${c.col},${c.row}`;
  let best: HexCoord | null = null;
  let bestScore = Infinity;
  for (const n of hexNeighbours(unit.coord)) {
    if (!canMove(b, unit, n)) continue;
    const d = field.get(key(n));
    if (d === undefined) continue;
    const tile = tileAt(b, n);
    const aff = tile ? terrainAffinity(unit.unitType, tile.terrain) : 0;
    const score = d - aff * 0.1; // mild terrain tie-break
    if (score < bestScore) {
      bestScore = score;
      best = n;
    }
  }
  return best;
}

/**
 * Reposition a kiting unit to sit in its preferred [lo,hi] distance band from
 * the nearest enemy, favouring terrain that boosts it. Returns the chosen
 * hex, or null if simply holding position is already best.
 */
export function bandRepositionStep(
  b: TacticalBattle,
  unit: TacticalUnit,
  enemies: TacticalUnit[],
  lo: number,
  hi: number,
): HexCoord | null {
  if (enemies.length === 0) return null;
  const score = (c: HexCoord): number => {
    const nd = Math.min(...enemies.map((e) => hexDistance(c, e.coord)));
    let band: number;
    if (nd < lo) band = (nd - lo) * 2; // too close → strong penalty
    else if (nd <= hi) band = 2; // sweet spot
    else band = (hi - nd) * 0.5; // too far → mild penalty
    const tile = tileAt(b, c);
    return band + (tile ? terrainAffinity(unit.unitType, tile.terrain) : 0);
  };
  let best: HexCoord | null = null;
  let bestScore = score(unit.coord);
  for (const n of hexNeighbours(unit.coord)) {
    if (!canMove(b, unit, n)) continue;
    const s = score(n);
    if (s > bestScore) {
      bestScore = s;
      best = n;
    }
  }
  return best;
}

/** Pick the juiciest target: nearby, countered by us, wounded, or a commander.
 *  Weighting wounded enemies low makes the side gang up (focus fire). */
export function pickAiTarget(
  unit: TacticalUnit,
  candidates: TacticalUnit[],
): TacticalUnit | undefined {
  if (candidates.length === 0) return undefined;
  const score = (e: TacticalUnit): number => {
    const counter = counterMultiplier(unit.unitType, e.unitType);
    let s = hexDistance(unit.coord, e.coord);
    if (e.isCommander) s *= 0.5;
    if (counter >= 1.4) s *= 0.6; // we counter them — pursue
    if (counter <= 0.8) s *= 1.8; // they counter us — avoid
    const woundedRatio = e.troops / Math.max(1, e.maxTroops);
    s *= 0.4 + woundedRatio; // weaker = juicier → focus fire
    return s;
  };
  return [...candidates].sort((a, c) => score(a) - score(c))[0];
}

/** A commander steers toward an unresolved movement objective. */
function objectiveStep(b: TacticalBattle, unit: TacticalUnit): HexCoord | null {
  if (!unit.isCommander) return null;
  const obj = unit.side === 'attacker' ? b.attackerObjective : b.defenderObjective;
  if (!obj || obj.resolved) return null;
  let goal: HexCoord | null = null;
  if ((obj.kind === 'hold-tile' || obj.kind === 'capture-supply') && obj.tileCoord) {
    goal = obj.tileCoord;
  } else if (obj.kind === 'escape') {
    goal = { col: unit.side === 'attacker' ? 0 : b.width - 1, row: unit.coord.row };
  }
  if (!goal || hexDistance(unit.coord, goal) === 0) return null;
  return bestStepToward(b, unit, goal);
}

/** Diff stratagem cooldowns to recover which (signature) tactic a unit fired. */
function detectSignature(
  prev: TacticalBattle,
  next: TacticalBattle,
  unit: TacticalUnit,
  officers: Record<EntityId, Officer>,
): AITurnResult['signatures'] {
  const out: AITurnResult['signatures'] = [];
  const prefix = `${unit.id}-`;
  for (const [k, val] of Object.entries(next.stratagemCooldowns)) {
    if (!k.startsWith(prefix)) continue;
    if ((prev.stratagemCooldowns[k] ?? -1) >= val) continue;
    const stratagemId = k.slice(prefix.length) as StratagemId;
    const after = next.units.find((u) => u.id === unit.id);
    if (!after) continue;
    const tacticId = inferSignatureTactic(officers[after.officerId], stratagemId);
    out.push({ tacticId, coord: after.coord, unitId: after.id, stratagemId });
  }
  return out;
}

/** One AI decision for a single unit. Returns the (possibly unchanged) battle,
 *  whether it actually acted, and any signature tactics fired. */
function aiActOnce(
  b: TacticalBattle,
  unit: TacticalUnit,
  officers: Record<EntityId, Officer>,
  rng: () => number,
  skill: number,
): { battle: TacticalBattle; acted: boolean; signatures: AITurnResult['signatures'] } {
  const hold = { battle: b, acted: false, signatures: [] as AITurnResult['signatures'] };
  const off = officers[unit.officerId];

  // Ambusher lies in wait — springs only when an enemy is adjacent (landing
  // the +30% ambush bonus); otherwise holds its concealed position.
  if (unit.hidden) {
    const adj = b.units.find(
      (e) => e.side !== unit.side && !e.hidden && e.troops > 0 && hexDistance(unit.coord, e.coord) === 1,
    );
    if (adj) return { battle: attackUnits(b, unit.id, adj.id, officers, rng), acted: true, signatures: [] };
    return hold;
  }

  const enemies = b.units.filter((u) => u.side !== unit.side && !u.hidden && u.troops > 0);
  if (enemies.length === 0) return hold;
  const role = unitRole(off, unit.unitType);
  const fragile = role === 'ranged' || role === 'strategist';

  // Reach for a stratagem first (skill-gated). Ranged units lob arrows here;
  // casters unleash fire / confusion / lightning.
  const stratResult = aiTryStratagem(b, unit, officers, rng, skill);
  if (stratResult) {
    return { battle: stratResult, acted: true, signatures: detectSignature(b, stratResult, unit, officers) };
  }

  // Siege engines batter an adjacent wall or gate.
  if (unit.unitType === 'siege') {
    const fort = hexNeighbours(unit.coord)
      .map((c) => tileAt(b, c))
      .find((t) => t?.terrain === 'gate' || t?.terrain === 'wall');
    if (fort) return { battle: breakGate(b, unit.id, fort.coord), acted: true, signatures: [] };
  }

  // Broken units flee off their own edge instead of dying in place.
  if (!unit.isCommander && unit.troops < unit.maxTroops * 0.3 && unit.morale < 30) {
    const edgeCol = unit.side === 'attacker' ? 0 : b.width - 1;
    if (Math.abs(unit.coord.col - edgeCol) <= 2) {
      return { battle: retreatUnit(b, unit.id), acted: true, signatures: [] };
    }
  }

  const adjEnemies = enemies.filter((e) => hexDistance(unit.coord, e.coord) === 1);

  // Fragile units (archers, casters) keep their distance once the AI is
  // skilled enough to micro; a clumsy low-skill AI just brawls in line.
  const micro = skill >= 0.4;
  if (fragile && micro) {
    const lo = role === 'strategist' ? 3 : 2;
    const hi = role === 'strategist' ? 6 : 4;
    if (adjEnemies.length > 0) {
      // Enemy in our face — back off if we can, else fight.
      const step = bandRepositionStep(b, unit, enemies, lo, hi);
      if (step) return { battle: moveUnit(b, unit.id, step), acted: true, signatures: [] };
      const t = pickAiTarget(unit, adjEnemies);
      if (t) return { battle: attackUnits(b, unit.id, t.id, officers, rng), acted: true, signatures: [] };
    }
    // Drifted out of the firing band — slide back into it.
    const nearest = Math.min(...enemies.map((e) => hexDistance(unit.coord, e.coord)));
    if (nearest < lo || nearest > hi + 1) {
      const step = bandRepositionStep(b, unit, enemies, lo, hi);
      if (step) return { battle: moveUnit(b, unit.id, step), acted: true, signatures: [] };
    }
    return hold; // in a good spot — don't charge into melee
  }

  // Melee: strike an adjacent target if there is one.
  if (adjEnemies.length > 0) {
    const t = pickAiTarget(unit, adjEnemies);
    if (t) return { battle: attackUnits(b, unit.id, t.id, officers, rng), acted: true, signatures: [] };
  }

  // Foot troops scale an adjacent wall when a friendly engine braces it.
  if (!fragile) {
    const wall = hexNeighbours(unit.coord)
      .map((c) => tileAt(b, c))
      .find((t) => t?.terrain === 'wall');
    if (wall) {
      const scaled = scaleWall(b, unit.id, wall.coord);
      if (scaled !== b) return { battle: scaled, acted: true, signatures: [] };
    }
  }

  // Pursue a battlefield objective (commander only) before chasing kills.
  const objStep = objectiveStep(b, unit);
  if (objStep) return { battle: moveUnit(b, unit.id, objStep), acted: true, signatures: [] };

  // Approach the best target via terrain-aware pathfinding.
  const target = pickAiTarget(unit, enemies);
  if (target) {
    const step = bestStepToward(b, unit, target.coord);
    if (step) return { battle: moveUnit(b, unit.id, step), acted: true, signatures: [] };
  }

  return hold;
}

/**
 * Run a full AI side-turn. `opts.skill` (0–1) scales competence: below 0.4 the
 * AI brawls without kiting; higher values micro ranged units, lean on
 * stratagems, and path intelligently. Maps from game difficulty by the caller.
 */
export function aiTakeTurn(
  b: TacticalBattle,
  officers: Record<EntityId, Officer>,
  rng: () => number,
  opts?: { skill?: number },
): AITurnResult {
  const skill = Math.max(0, Math.min(1, opts?.skill ?? 0.7));
  let cur = b;
  const signatures: AITurnResult['signatures'] = [];
  let safety = 120;
  while (safety-- > 0) {
    const myUnits = cur.units.filter((u) => u.side === cur.activeSide && u.ap > 0 && u.troops > 0);
    if (myUnits.length === 0) break;
    // Front line acts before ranged/casters so the squishy units can react to
    // how the melee shapes up.
    const ordered = [...myUnits].sort(
      (a, c) =>
        roleRank(unitRole(officers[a.officerId], a.unitType)) -
        roleRank(unitRole(officers[c.officerId], c.unitType)),
    );
    let acted = false;
    for (const unit of ordered) {
      const r = aiActOnce(cur, unit, officers, rng, skill);
      if (r.acted) {
        cur = r.battle;
        signatures.push(...r.signatures);
        acted = true;
        break; // recompute the board after every action
      }
    }
    if (!acted) break;
  }
  return { battle: endTurn(cur), signatures };
}
