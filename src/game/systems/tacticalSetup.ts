/**
 * 戰鬥組建 — everything that BUILDS a tactical battle before the first turn:
 * SetupParams, the peacetime battlefield preview, siege-relief and converging-
 * column planning (會戰/馳援), time-of-day, the big setupTacticalBattle
 * assembler and deployment slots. Split out of tactical.ts (which keeps the
 * core loop: movement / combat / turn end). Entry-point layer: the store and
 * screens call in; the core never calls back.
 */
import type {
  BattleObjective,
  City,
  EntityId,
  FormationId,
  HexCoord,
  NamedBattleMap,
  Officer,
  Reinforcement,
  TacticalBattle,
  TacticalTile,
  TacticalUnit,
  TerrainKind,
  TimeOfDay,
  UnitType,
  Weather,
} from '../types';
import {
  assignShipClass, hexDirection, inferUnitType,
  type WindDirection,
} from './tactical';
import { cityPos } from '../data/cityGeo';
import { getRelation } from '../types/diplomacy';
import { geoToPixel, WORLD_SCALE } from '../data/geography';
import { FACILITY_DEFS, type Fort } from '../types/fort';
import { NAMED_MAPS_BY_CITY, NAMED_MAPS_BY_ID } from '../data/namedMaps';
import { generateTerrain, type TerrainHint } from './battlefieldTerrain';
import { pickVoiceLine } from '../data/voiceLines';

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
  /** Strategic 施設 — nearby ranged facilities (箭樓/投石臺) owned by the
   *  defender appear on the board as auto-firing emplacements. */
  forts?: Record<EntityId, Fort>;
  /** Geography hint (terrain category, port flag, coords) — drives terrain generation. */
  terrainHint?: TerrainHint;
  /** Real-map placement (anchor + approach bearing) — when set, the
   *  battlefield samples the actual strategic-map geography. */
  battleGeo?: import('./battlefieldTerrain').BattleGeo;
  /** 戰場烙印 — world-hex scars from earlier battles; the sampled ground
   *  inherits them (burned wood stays bare, dropped spans stay cut). */
  worldScars?: import('./worldScars').WorldScars;
  /** Siege approach (攻城方略): storm the walls as-is (default), invest
   *  the city until the granaries run dry (圍困 — defenders start the
   *  assault starving and shaken), or break the dikes and flood it
   *  (水攻 — riverside cities only: washed-out wall breaches, floodwater
   *  at the foot of the walls, drowned and demoralised garrison). */
  siegeWorks?: 'storm' | 'invest' | 'flood';
  /** 城壁強化 — the defender city's wall tier: 2 raises an inner wall ring
   *  (內城) behind the rampart, 3 also digs a moat along the western
   *  assault face (bridge causeway at the gate). 所建即所戰. */
  wallTier?: 1 | 2 | 3;
  /** Field battle (army vs army in the open) — no city, so no rampart wall. */
  field?: boolean;
  /** 疲勞 — points the attacker's units open at below full morale (a forced-marched
   *  column arrives weary; 以逸待勞). Default 0. */
  attackerFatigue?: number;
  /** 疲勞(守方) — same for the defender's units (a worn enemy column you
   *  bring to battle opens shaken; 師老兵疲 made visible in person). */
  defenderFatigue?: number;
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
  // When true, ignore any named tactical map and use the fallback size — the
  // city-interior view wants a consistently large grid for every city.
  forceSize = false,
): BattlefieldPreview {
  const namedMapId = forceSize ? undefined : NAMED_MAPS_BY_CITY[cityId];
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


/**
 * 馳援 — plan relief columns for a besieged city: up to two neighbouring
 * cities of the defender's force each dispatch ~30% of their garrison
 * under their best idle officer, arriving mid-battle from the map edge
 * that matches their true direction (battle grid is oriented along the
 * approach bearing). The caller deducts the troops and records the plans
 * on the battle for the post-battle return trip.
 */
export function planSiegeRelief(args: {
  target: City;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  defenderForceId: EntityId | null;
  bearing: number;
}): { reinforcements: Reinforcement[]; plans: Array<{ cityId: EntityId; officerId: EntityId; troops: number }> } {
  const out: { reinforcements: Reinforcement[]; plans: Array<{ cityId: EntityId; officerId: EntityId; troops: number }> } = { reinforcements: [], plans: [] };
  if (!args.defenderForceId) return out;
  const tp = cityPos(args.target);
  const neighbours = (args.target.adjacentCityIds ?? [])
    .map((id) => args.cities[id])
    .filter((c): c is City => !!c && c.ownerForceId === args.defenderForceId && c.troops >= 3000)
    .sort((a, b) => b.troops - a.troops)
    .slice(0, 2);
  for (const relief of neighbours) {
    const officer = Object.values(args.officers)
      .filter((o) => o.locationCityId === relief.id && o.forceId === args.defenderForceId
        && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned' && !o.task)
      .sort((a, b) => (b.stats.war * 0.6 + b.stats.leadership * 0.4) - (a.stats.war * 0.6 + a.stats.leadership * 0.4))[0];
    if (!officer) continue;
    const troops = Math.floor(relief.troops * 0.3);
    if (troops < 800) continue;
    // Map the relief city's true direction into battle-grid space (the
    // grid's +col axis runs along the approach bearing).
    const rp = cityPos(relief);
    const rel = Math.atan2(rp.y - tp.y, rp.x - tp.x) - args.bearing;
    const dc = Math.cos(rel);
    const dr = Math.sin(rel);
    const edge: Reinforcement['edge'] = Math.abs(dc) > Math.abs(dr)
      ? (dc > 0 ? 'east' : 'west')
      : (dr > 0 ? 'south' : 'north');
    out.reinforcements.push({
      arriveTurn: out.reinforcements.length === 0 ? 4 : 6,
      side: 'defender',
      officerId: officer.id,
      troops,
      unitType: inferUnitType(officer),
      edge,
      announcement: `${relief.name.zh}馳援！${officer.name.zh}率 ${troops.toLocaleString()} 殺到！`,
    });
    out.plans.push({ cityId: relief.id, officerId: officer.id, troops });
  }
  return out;
}

/** 會戰 — marching columns of EITHER belligerent near the battle site ride
 *  to the sound of the drums: each nearby column (not dug-in, not homebound,
 *  not afloat) is scheduled as reinforcements that enter from its TRUE
 *  bearing to the field, one unit per officer, arriving later the farther
 *  out it started (turn 3 / 5 / 7). The battle records which armies joined
 *  (columnPlans) so the store writes survivors back to the map afterwards.
 *  At most two columns per side — a battle, not a stampede. */
export function planColumnReinforcements(args: {
  site: { x: number; y: number };
  /** Attacker→defender bearing (radians) — the board's +col axis. */
  bearing: number;
  attackerForceId: EntityId | null;
  defenderForceId: EntityId | null;
  armies: Record<EntityId, import('../types').Army>;
  officers: Record<EntityId, Officer>;
  /** Armies already ON the field (the two main columns) — never re-invited. */
  excludeArmyIds?: EntityId[];
  /** 盟軍會戰 — with diplomacy given, columns of a belligerent's ALLIES also
   *  ride to that side's drums (a realm allied to both stays home). */
  diplomacy?: import('../types/diplomacy').DiplomaticState;
}): { reinforcements: Reinforcement[]; columnPlans: NonNullable<TacticalBattle['columnPlans']> } {
  const REACH = 90 * WORLD_SCALE;
  const out = {
    reinforcements: [] as Reinforcement[],
    columnPlans: [] as NonNullable<TacticalBattle['columnPlans']>,
  };
  const excluded = new Set(args.excludeArmyIds ?? []);
  const perSide: Record<'attacker' | 'defender', number> = { attacker: 0, defender: 0 };
  // 水陸協同 — fleets within reach now beach and march to the drums too
  // (棄舟登岸): they join like any column, only slower (see arriveTurn).
  const columns = Object.values(args.armies)
    .filter((a) => !excluded.has(a.id) && !a.holding && !a.returning && a.troops >= 500)
    .map((a) => ({ a, dist: Math.hypot(a.x - args.site.x, a.y - args.site.y) }))
    .filter((c) => c.dist <= REACH)
    .sort((x, y) => x.dist - y.dist);
  const sideOfForce = (fid: EntityId | null): 'attacker' | 'defender' | null => {
    if (!fid) return null;
    if (fid === args.attackerForceId) return 'attacker';
    if (fid === args.defenderForceId) return 'defender';
    if (args.diplomacy) {
      const alliedAtk = !!args.attackerForceId
        && getRelation(args.diplomacy, fid, args.attackerForceId).status === 'allied';
      const alliedDef = !!args.defenderForceId
        && getRelation(args.diplomacy, fid, args.defenderForceId).status === 'allied';
      if (alliedAtk && !alliedDef) return 'attacker';
      if (alliedDef && !alliedAtk) return 'defender';
    }
    return null;
  };
  for (const { a, dist } of columns) {
    const side = sideOfForce(a.forceId);
    if (!side || perSide[side] >= 2) continue;
    const isAlly = a.forceId !== args.attackerForceId && a.forceId !== args.defenderForceId;
    const officerIds = [a.commanderId, ...a.companionIds].filter((id) => args.officers[id]);
    if (officerIds.length === 0) continue;
    // True direction of the column, mapped into battle-grid space (same
    // maths as planSiegeRelief) — a column to the north enters from north.
    const rel = Math.atan2(a.y - args.site.y, a.x - args.site.x) - args.bearing;
    const dc = Math.cos(rel), dr = Math.sin(rel);
    const edge: Reinforcement['edge'] = Math.abs(dc) > Math.abs(dr)
      ? (dc > 0 ? 'east' : 'west')
      : (dr > 0 ? 'south' : 'north');
    // 棄舟登岸 — a fleet must beach and form up before it can march to the
    // guns: +2 turns on top of the distance-based arrival.
    const arriveTurn = 3 + Math.min(2, Math.floor(dist / (30 * WORLD_SCALE))) * 2 + (a.naval ? 2 : 0);
    const per = Math.floor(a.troops / officerIds.length);
    officerIds.forEach((oid, i) => {
      const o = args.officers[oid];
      out.reinforcements.push({
        arriveTurn: arriveTurn + (i > 0 ? 1 : 0),
        side,
        officerId: oid,
        troops: i === 0 ? a.troops - per * (officerIds.length - 1) : per,
        unitType: inferUnitType(o),
        edge,
        announcement: i === 0
          ? (a.naval
            ? `${isAlly ? '盟' : ''}舟師來會!${o.name.zh}引軍 ${a.troops.toLocaleString()} 棄舟登岸,赴戰場馳到!`
            : isAlly
              ? `盟軍來會!${o.name.zh}引軍 ${a.troops.toLocaleString()} 應盟而至!`
              : `會戰!${o.name.zh}引軍 ${a.troops.toLocaleString()} 赴戰場馳到!`)
          : undefined,
      });
    });
    out.columnPlans.push({ armyId: a.id, officerIds, side, troops: a.troops });
    perSide[side] += 1;
  }
  return out;
}

/** Roll the hour a battle opens at — most assaults go in by day, but
 *  some come at dusk or in the dead of night (夜戰). */
export function rollTimeOfDay(r: number = Math.random()): TimeOfDay {
  if (r < 0.15) return 'night';
  if (r < 0.27) return 'dusk';
  if (r < 0.34) return 'dawn';
  return 'day';
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
  // With battleGeo (and no scripted named map) the grid samples the REAL
  // strategic map along the approach bearing.
  const tiles = generateTerrain(
    p.cityId,
    width,
    height,
    { ...(p.terrainHint ?? {}), naval: isNaval },
    namedMap?.terrainOverrides,
    namedMap ? undefined : p.battleGeo,
    p.worldScars,
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
    // Spawn placement is terrain-aware: a land unit must not materialise in a
    // river or inside a wall (map-ruxukou's mid-field river caught commanders
    // standing in the water). Nearest standable row wins; taken rows skip.
    const tileTerrainAt = new Map(tiles.map((t) => [`${t.coord.col},${t.coord.row}`, t.terrain]));
    const takenSpawns = new Set<string>();
    const standable = (col: number, row: number) => {
      if (isNaval) return true; // every contingent is a ship — water is home
      const g = tileTerrainAt.get(`${col},${row}`);
      return g !== 'river' && g !== 'wall' && g !== 'gate';
    };
    const settleRow = (col: number, wantRow: number): number => {
      for (let d = 0; d < height; d++) {
        for (const candidate of d === 0 ? [wantRow] : [wantRow - d, wantRow + d]) {
          if (candidate < 0 || candidate >= height) continue;
          const key = `${col},${candidate}`;
          if (takenSpawns.has(key)) continue;
          if (!standable(col, candidate)) continue;
          takenSpawns.add(key);
          return candidate;
        }
      }
      return Math.max(0, Math.min(height - 1, wantRow)); // pathological map — give up gracefully
    };
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
      const uCol = isBackRank ? backCol : frontCol;
      const coord = { col: uCol, row: settleRow(uCol, Math.max(0, Math.min(height - 1, row))) };
      // 朝向 — units open facing the enemy edge (attacker rightward, defender left).
      const facing = hexDirection(coord, { col: coord.col + (side === 'attacker' ? 2 : -2), row: coord.row });
      // 弓矢 — only ranged arms carry a volley count.
      const maxAmmo = unitType === 'archers' ? 3 : unitType === 'siege' ? 3 : unitType === 'navy' ? 3 : 0;
      return {
        id: `${side}-${entry.officer.id}`,
        officerId: entry.officer.id,
        side,
        coord,
        troops: entry.troops,
        maxTroops: entry.troops,
        ap: maxAp,
        maxAp,
        // 疲勞 / 都督之旗 — a forced-marched attacker opens below full morale; a
        // legion banner offsets it (negative fatigue) but can't exceed full.
        morale: Math.min(100, Math.max(40,
          100 - (side === 'attacker' ? (p.attackerFatigue ?? 0) : (p.defenderFatigue ?? 0)))),
        isCommander,
        effects: [],
        unitType,
        fatigue: 0,
        facing,
        ...(maxAmmo > 0 ? { ammo: maxAmmo, maxAmmo } : {}),
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
  // 戰役腳本 — a named historical battle opens with its scene-setting line
  // (zh-first display, English variant kept for en players).
  if (namedMap?.introZh || namedMap?.introEn) {
    log.push({ turn: 1, text: namedMap.introZh ?? namedMap.introEn ?? '', textEn: namedMap.introEn ?? namedMap.introZh, kind: 'event' });
  }
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
    // Real-geo battlefields can put water inside the city's band — no
    // towers in the river (the water itself is the defence there).
    const tileTerrain = new Map(tiles.map((t) => [`${t.coord.col},${t.coord.row}`, t.terrain]));
    for (const slot of p.buildSlots) {
      if (!slot.buildingId) continue;
      const target = SLOT_TO_HEX[slot.slot];
      if (!target) continue;
      const key = `${target.col},${target.row}`;
      if (taken.has(key)) continue;  // skip if conflicting with a unit
      const ground = tileTerrain.get(key);
      if (ground === 'river' || ground === 'bridge') continue; // no building in the water
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

  // 施設參戰 — strategic ranged facilities (箭樓/投石臺) the defender has built
  // within range of this battlefield join the fight as auto-firing emplacements,
  // exactly like the city's own perimeter defences. (Built directly into the
  // cityStructures list so the existing auto-attack handles them.)
  const facilityWallCoords: HexCoord[] = [];
  if (p.forts && p.battleGeo && p.defenderForceId) {
    const FACILITY_TO_BUILDING: Partial<Record<import('../types/fort').FacilityKind, import('../data/defenseBuildings').DefenseBuildingId>> = {
      tower: 'watchtower',
      catapult: 'arrow-platform',
      camp: 'barracks-out', // 陣 — rallies adjacent defenders each turn
    };
    const taken = new Set([
      ...units.map((u) => `${u.coord.col},${u.coord.row}`),
      ...cityStructures.map((s) => `${s.coord.col},${s.coord.row}`),
    ]);
    const tileTerrain2 = new Map(tiles.map((t) => [`${t.coord.col},${t.coord.row}`, t.terrain]));
    // Candidate emplacement hexes on the defender's side (right band), inland a
    // little from the very edge so they sit behind the line.
    const candidates: HexCoord[] = [];
    for (let col = width - 2; col >= width - 4 && col >= 0; col--) {
      for (let row = 1; row < height - 1; row += 2) candidates.push({ col, row });
    }
    let ci = 0;
    for (const f of Object.values(p.forts)) {
      if (!f.facility || f.ownerForceId !== p.defenderForceId) continue;
      const [fx, fy] = geoToPixel(f.coords.lon, f.coords.lat);
      if (Math.hypot(fx - p.battleGeo.x, fy - p.battleGeo.y) > FACILITY_DEFS[f.facility].range) continue;
      // 防壁 — a barricade in range throws a short destructible wall line
      // across the mid-field instead of an emplacement.
      if (f.facility === 'wall') {
        const wallCol = Math.max(2, width - 6);
        const midRow = Math.floor(height / 2);
        for (const row of [midRow - 1, midRow, midRow + 1]) {
          const key = `${wallCol},${row}`;
          if (taken.has(key)) continue;
          const g = tileTerrain2.get(key);
          if (g === 'river' || g === 'bridge' || g === 'wall' || g === 'gate') continue;
          facilityWallCoords.push({ col: wallCol, row });
          taken.add(key);
        }
        continue;
      }
      const buildingId = FACILITY_TO_BUILDING[f.facility];
      if (!buildingId) continue;
      // Find the next free, dry candidate hex.
      while (ci < candidates.length) {
        const c = candidates[ci++];
        const key = `${c.col},${c.row}`;
        if (taken.has(key)) continue;
        const g = tileTerrain2.get(key);
        if (g === 'river' || g === 'bridge' || g === 'wall' || g === 'gate') continue;
        taken.add(key);
        cityStructures.push({
          slotIndex: 100 + cityStructures.length, // synthetic — not a city slot
          buildingId,
          level: 2,
          coord: c,
          hp: 300,
        });
        break;
      }
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

  // ── City walls. A procedural siege raises a walled town on the defender
  // side: west face (toward the attacker) with the main gate on the road
  // row, north + south faces each with their own gate, the back open to the
  // map edge (the far city sprawls off-field — also the long flanking route,
  // so an army without siege gear never hard-stalls). Pass cities (劍閣/
  // 虎牢…) keep the single wall line plugging their corridor. Named maps,
  // field battles and naval engagements stay unwalled.
  let battleTiles = tiles;
  let wallHp: Record<string, number> | undefined;
  let enclosure: { westCol: number; r0: number; r1: number; gateRow: number } | null = null;
  if (!isNaval && !p.field && !namedMap && width >= 8 && height >= 6) {
    const occupied = new Set(finalUnits.map((u) => `${u.coord.col},${u.coord.row}`));
    const hp: Record<string, number> = {};
    const gateRow = Math.floor(height / 2);
    if (p.terrainHint?.terrain === 'pass') {
      // Mountain fort — one wall line across the corridor.
      const wallCol = Math.max(2, width - 3);
      const r0 = Math.floor(height * 0.28);
      const r1 = Math.ceil(height * 0.72) - 1;
      battleTiles = tiles.map((t) => {
        if (t.coord.col !== wallCol || t.coord.row < r0 || t.coord.row > r1) return t;
        const key = `${t.coord.col},${t.coord.row}`;
        if (occupied.has(key)) return t; // never wall over a unit
        if (t.coord.row === gateRow) {
          hp[key] = 700;
          return { ...t, terrain: 'gate' as TerrainKind };
        }
        if (t.terrain === 'river') return t;
        hp[key] = 1000;
        return { ...t, terrain: 'wall' as TerrainKind };
      });
    } else {
      // Walled town (城郭) — three faces + gates; 贴水而建: any face the
      // real map runs a river along stays open water (the river is that
      // side's defence — 襄陽 on the 漢水), so which faces you can assault
      // depends on the actual geography. 四面看地形.
      const westCol = Math.max(2, width - 4);
      const r0 = Math.floor(height * 0.28);          // north face row
      const r1 = Math.ceil(height * 0.72) - 1;       // south face row
      const sideGateCol = Math.min(width - 2, westCol + 2);
      enclosure = { westCol, r0, r1, gateRow };
      battleTiles = tiles.map((t) => {
        const { col, row } = t.coord;
        const key = `${col},${row}`;
        const onWest = col === westCol && row >= r0 && row <= r1;
        // North/south faces stop one column short of the map edge — the
        // rear corners stay open as back alleys into the far quarter, so
        // an army without siege gear can still flank in (and the garrison
        // can sally out) instead of hard-stalling at sealed walls.
        const onNorth = row === r0 && col > westCol && col < width - 1;
        const onSouth = row === r1 && col > westCol && col < width - 1;
        if (!onWest && !onNorth && !onSouth) {
          // Interior streets — the town is built on level ground.
          if (col > westCol && row > r0 && row < r1
            && (t.terrain === 'mountain' || t.terrain === 'hill' || t.terrain === 'forest')) {
            return { ...t, terrain: 'plain' as TerrainKind };
          }
          return t;
        }
        if (occupied.has(key)) return t; // never wall over a unit
        const isGate = (onWest && row === gateRow) || ((onNorth || onSouth) && col === sideGateCol);
        if (t.terrain === 'river' && !isGate) return t;  // water face
        hp[key] = isGate ? 700 : 1000;
        return { ...t, terrain: (isGate ? 'gate' : 'wall') as TerrainKind };
      });
      // 城壁強化入戰場(所建即所戰)— tier 2 raises an INNER wall ring:
      // breach the outer rampart and a second, weaker ring still bars the
      // keep. tier 3 also digs a MOAT along the western assault face —
      // open water save for the causeway bridge at the gate, so the
      // attacker funnels over the bridge or flanks through the back alleys.
      const tier = p.wallTier ?? 1;
      if (tier >= 2) {
        const innerCol = Math.min(width - 2, westCol + 2);
        battleTiles = battleTiles.map((t) => {
          const { col, row } = t.coord;
          if (col !== innerCol || row <= r0 || row >= r1) return t;
          const key = `${col},${row}`;
          if (occupied.has(key)) return t;
          if (t.terrain === 'river' || t.terrain === 'gate' || t.terrain === 'wall') return t;
          if (row === gateRow) { hp[key] = 600; return { ...t, terrain: 'gate' as TerrainKind }; }
          hp[key] = 800;
          return { ...t, terrain: 'wall' as TerrainKind };
        });
      }
      if (tier >= 3 && westCol - 1 >= 1) {
        const moatCol = westCol - 1;
        battleTiles = battleTiles.map((t) => {
          const { col, row } = t.coord;
          if (col !== moatCol || row < r0 || row > r1) return t;
          if (occupied.has(`${col},${row}`)) return t;
          if (row === gateRow) return { ...t, terrain: 'bridge' as TerrainKind };
          return { ...t, terrain: 'river' as TerrainKind };
        });
      }
    }
    if (Object.keys(hp).length > 0) wallHp = hp;
  }

  // ── 攻城方略 — siege works applied over the raised defences ──
  let workedUnits = finalUnits;
  // (No !namedMap here — the invest debuff touches only units, and the
  // attacker already paid the grain; scripted fields starve the same. Same
  // precedent as the flood fallback below.)
  if (!isNaval && !p.field && p.siegeWorks === 'invest') {
    // 圍困 — the city was invested until the granaries ran dry: the
    // garrison opens the assault starving and shaken.
    workedUnits = workedUnits.map((u) => u.side === 'defender'
      ? {
          ...u,
          morale: Math.max(30, u.morale - 30),
          effects: [...u.effects, { kind: 'starving' as const, turnsLeft: 99 }],
        }
      : u);
    log.push({ turn: 1, text: '圍困日久，城中糧盡 — 守軍飢疲，士氣大墮。', kind: 'event' });
  }
  if (p.siegeWorks === 'flood' && enclosure && wallHp) {
    // 水攻 — the dikes are broken upstream: floodwater pools at the foot
    // of the walls, washes out wall segments, and drowns part of the
    // garrison (水淹七軍).
    const { westCol, r0, r1, gateRow } = enclosure;
    const washed = battleTiles
      .filter((t) => t.terrain === 'wall')
      .sort((a, b) => ((a.coord.row * 31 + a.coord.col * 7) % 11) - ((b.coord.row * 31 + b.coord.col * 7) % 11))
      .slice(0, 3)
      .map((t) => `${t.coord.col},${t.coord.row}`);
    const washedSet = new Set(washed);
    battleTiles = battleTiles.map((t) => {
      const key = `${t.coord.col},${t.coord.row}`;
      if (washedSet.has(key)) return { ...t, terrain: 'river' as TerrainKind };
      // Floodwater pooled along the western approach — the causeway (road
      // row) stays above the water.
      if (t.coord.col === westCol - 1 && t.coord.row >= r0 && t.coord.row <= r1
        && t.coord.row !== gateRow
        && (t.terrain === 'plain' || t.terrain === 'road' || t.terrain === 'marsh' || t.terrain === 'forest')) {
        return { ...t, terrain: 'river' as TerrainKind };
      }
      return t;
    });
    const nextHp = { ...wallHp };
    for (const key of washed) delete nextHp[key];
    wallHp = Object.keys(nextHp).length > 0 ? nextHp : undefined;
    workedUnits = workedUnits.map((u) => u.side === 'defender'
      ? {
          ...u,
          troops: Math.max(1, Math.floor(u.troops * 0.88)),
          maxTroops: Math.max(1, Math.floor(u.maxTroops * 0.88)),
          morale: Math.max(30, u.morale - 20),
        }
      : u);
    log.push({ turn: 1, text: '決堤！洪水灌城，城牆崩毀數段 — 守軍溺損，軍心動搖。', kind: 'event' });
  } else if (p.siegeWorks === 'flood') {
    // Scripted (named) battlefields have no procedural enclosure to wash out —
    // but the attacker still PAID for breaking the dikes, so the drowning
    // debuff lands regardless (the famous fields are riverside cities anyway).
    workedUnits = workedUnits.map((u) => u.side === 'defender'
      ? {
          ...u,
          troops: Math.max(1, Math.floor(u.troops * 0.88)),
          maxTroops: Math.max(1, Math.floor(u.maxTroops * 0.88)),
          morale: Math.max(30, u.morale - 20),
        }
      : u);
    log.push({ turn: 1, text: '決堤！洪水漫野 — 守軍溺損，軍心動搖。', kind: 'event' });
  }

  // 防壁參戰 — a strategic barricade in range throws a short destructible
  // wall line across the mid-field (siege gear batters it down like any wall).
  if (facilityWallCoords.length > 0) {
    const wallKeys = new Set(facilityWallCoords.map((c) => `${c.col},${c.row}`));
    battleTiles = battleTiles.map((t) =>
      wallKeys.has(`${t.coord.col},${t.coord.row}`) ? { ...t, terrain: 'wall' as TerrainKind } : t);
    const hp = { ...(wallHp ?? {}) };
    for (const key of wallKeys) hp[key] = 400;
    wallHp = hp;
    log.push({ turn: 1, text: '防壁橫亙中野 — 敵軍須拔除方可長驅。', kind: 'event' });
  }

  // 糧車 — a named map's wagon/supply tile fields a slow, lightly-manned grain
  // convoy for the defender. Reduce it to nothing and the garrison starves
  // (endTurn's 燒糧 handler). Opt-in via map design, so procedural sieges are
  // untouched. The cart has no real officer (defends at baseline stats).
  const supplyTiles = (namedMap?.specialTiles ?? []).filter((s) => s.role === 'wagon' || s.role === 'supply');
  if (supplyTiles.length > 0) {
    const occupied = new Set(workedUnits.map((u) => `${u.coord.col},${u.coord.row}`));
    supplyTiles.forEach((st, i) => {
      const key = `${st.coord.col},${st.coord.row}`;
      if (occupied.has(key)) return;
      occupied.add(key);
      workedUnits = [
        ...workedUnits,
        {
          id: `defender-supply-${i}`,
          officerId: `supply-${i}`,
          side: 'defender',
          coord: st.coord,
          troops: 1500,
          maxTroops: 1500,
          ap: 1,
          maxAp: 1,
          morale: 100,
          isCommander: false,
          effects: [],
          unitType: 'infantry',
          isSupply: true,
        },
      ];
    });
    if (workedUnits.some((u) => u.isSupply)) {
      log.push({ turn: 1, text: '糧車屯於陣後 — 守之則安,失之則餓。', kind: 'event' });
    }
  }

  return {
    id: `tac-${p.cityId}-${Date.now()}`,
    cityId: p.cityId,
    attackerForceId: p.attackerForceId,
    defenderForceId: p.defenderForceId,
    width,
    height,
    tiles: battleTiles,
    units: workedUnits,
    turn: 1,
    activeSide: 'attacker',
    stratagemCooldowns: {},
    attackerLosses: 0,
    defenderLosses: 0,
    startTroops: {
      attacker: workedUnits.filter((u) => u.side === 'attacker').reduce((s, u) => s + u.maxTroops, 0),
      defender: workedUnits.filter((u) => u.side === 'defender').reduce((s, u) => s + u.maxTroops, 0),
    },
    attackerFormation: p.attackerFormation ?? 'none',
    defenderFormation: p.defenderFormation ?? 'none',
    attackerObjective: p.attackerObjective ?? namedMap?.attackerObjective,
    defenderObjective: p.defenderObjective ?? namedMap?.defenderObjective,
    weather,
    timeOfDay,
    // 名向之風 — a named battlefield can lock the wind so its signature fire
    // (赤壁/夷陵/新野) blows true, rather than inheriting a random strategic gust.
    windDirection: namedMap?.windDirection ?? p.windDirection ?? 'calm',
    reinforcements: [...(namedMap?.reinforcements ?? []), ...(p.reinforcements ?? [])],
    specialTiles: namedMap?.specialTiles ?? [],
    damagePopups: [],
    log,
    cityStructures: cityStructures.length > 0 ? cityStructures : undefined,
    naval: isNaval || undefined,
    wallHp,
    field: p.field || undefined,
    // The board's window into the strategic map — lets every view (this battle,
    // the city map, the world map) describe where it sits in one coordinate
    // space, so a "you are here" locator and zoom transitions line up.
    geoAnchor: p.battleGeo
      ? { x: p.battleGeo.x, y: p.battleGeo.y, bearing: p.battleGeo.bearing, anchorCol: p.battleGeo.anchorCol }
      : undefined,
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

