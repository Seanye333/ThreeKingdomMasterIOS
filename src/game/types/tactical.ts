import type { BilingualName, EntityId } from './common';
import type { ShipClass } from './naval';

// ─── Weather, time of day, formations, objectives ────────────────────

export type Weather = 'clear' | 'rain' | 'wind' | 'fog' | 'snow';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export type FormationId =
  | 'none'           // no formation
  | 'fish-scale'     // 魚鱗 — +defense to adjacent allies (Cao Cao style)
  | 'eight-trigrams' // 八陣 — heal aura, slows enemies (Zhuge Liang)
  | 'arrow-tip'      // 鋒矢 — +charge damage, +1 cavalry move
  | 'crane-wing'     // 鶴翼 — encircling, +range bonus
  | 'spread-out'     // 散開 — fire/aoe resistance
  | 'awl'            // 錐行 — first-strike piercing
  | 'wheel'          // 車懸 — rotating attack, lower own losses each turn
  | 'square'         // 方圓 — all-side defense, reduced move
  | 'crescent-moon'  // 偃月 — anti-flank
  | 'wild-goose'     // 雁行 — balanced archer/cavalry
  | 'trinity'        // 三才 — bonus when 3+ allied officers grouped
  | 'back-to-water'  // 背水 — Han Xin death-or-victory
  | 'ten-ambush'     // 十面埋伏 — Han Xin's surround
  | 'long-snake'     // 長蛇 — column for mountain/pass
  | 'crescent-withdraw' // 却月 — Liu Yu's cart-crossbow circle
  | 'yoke'           // 衡軛 — anti-cavalry V-pikes
  | 'armored-cart'   // 武剛車 — Han-era armored cart line
  | 'seven-star'     // 七星 — Daoist Beidou ritual
  | 'five-elements'  // 五行 — five-phase rotating buff
  | 'four-symbols'   // 四象 — 4-quadrant balanced
  | 'rattan-armor'   // 藤甲 — Wuge anti-arrow / fire-vulnerable
  | 'stacked'        // 疊陣 — Song shield-wall 3-layer
  | 'mandarin-duck'; // 鴛鴦 — Qi Jiguang's 11-man squad

export interface FormationDef {
  id: FormationId;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  minIntelligence: number;
}

/**
 * A battle objective other than annihilating the enemy commander. Each side
 * may have a primary objective; the battle ends when one side's objective
 * resolves (success or failure).
 */
export type ObjectiveKind =
  | 'destroy-commander'  // default — kill the enemy commander
  | 'hold-tile'          // hold a specific hex for N turns
  | 'escape'             // get the commander to an edge
  | 'survive-turns'      // last N turns alive (defender win condition)
  | 'escort'             // protect a non-commander unit to an edge
  | 'capture-supply';    // reach a supply tile and hold it 2 turns

export interface BattleObjective {
  kind: ObjectiveKind;
  /** Hex coord for hold/capture objectives. */
  tileCoord?: HexCoord;
  /** Unit ID for escort objectives. */
  protectedUnitId?: EntityId;
  /** Turn count for hold / survive objectives. */
  turnsRequired?: number;
  /** Current progress (turns held / turns survived). */
  progress?: number;
  /** Resolution. */
  resolved?: 'success' | 'failure';
}

/** A pending unit arrival mid-battle. */
export interface Reinforcement {
  arriveTurn: number;
  side: 'attacker' | 'defender';
  officerId: EntityId;
  troops: number;
  unitType: UnitType;
  /** Edge to spawn from. */
  edge: 'north' | 'south' | 'east' | 'west';
  /** Announcement banner text — shown when they arrive. */
  announcement?: string;
}

/** A famous-battle map preset. */
export interface NamedBattleMap {
  id: EntityId;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  width: number;
  height: number;
  /** Special terrain overrides keyed by `col,row`. */
  terrainOverrides: Record<string, TerrainKind>;
  /** Default weather and time. */
  weather: Weather;
  timeOfDay: TimeOfDay;
  /** Optional scripted reinforcements. */
  reinforcements?: Reinforcement[];
  /** Special hex tags for objectives (e.g. supply, bridge). */
  specialTiles?: Array<{
    coord: HexCoord;
    label: BilingualName;
    role: 'supply' | 'bridge' | 'hill' | 'wagon' | 'flag';
  }>;
}

/** A floating damage popup spawned by a hit. */
export interface DamagePopup {
  id: string;
  coord: HexCoord;
  text: string;
  color: string;
  spawnedAt: number;
}

/**
 * Tactical battle: a separate hex-grid skirmish screen that resolves a
 * single field engagement before falling back to the strategic map.
 *
 * Coordinates use offset (col, row) for a "flat-top" hex grid.
 */
export interface HexCoord {
  col: number;
  row: number;
}

export type TerrainKind =
  | 'plain' | 'forest' | 'mountain' | 'river' | 'road'
  | 'hill'        // 高地 — archers gain +1 range, melee gains charge bonus
  | 'marsh'       // 沼澤 — movement halved, cavalry suffers
  | 'chokepoint'  // 隘口 — only 1 unit can pass; defenders +30% defense
  | 'bridge'      // 橋樑 — river-crossing bridge; allows non-navy over rivers
  | 'gate'        // 城門 — siege-only; tougher than wall but a bottleneck
  | 'wall'        // 城牆 — impassable rampart; siege engines batter it down (HP)
  | 'watchtower'; // 瞭望台 — +1 range + reveals hidden adjacent units

/**
 * Unit specialty types. Each has a counter / counter-by relationship:
 *   spearmen   > cavalry > archers > spearmen (RPS)
 *   siege      > city defense  (irrelevant in field)
 *   navy       only effective on rivers
 *   infantry   neutral baseline
 */
export type UnitType =
  | 'infantry'  // 歩兵 — generalist, no bonus, no penalty
  | 'spearmen'  // 槍兵 — strong vs cavalry
  | 'cavalry'   // 騎兵 — fast, strong vs archers
  | 'archers'   // 弓兵 — ranged, strong vs spearmen
  | 'siege'     // 攻城 — slow, strong vs walls
  | 'navy';     // 水軍 — only effective on river tiles

export interface TacticalTile {
  coord: HexCoord;
  terrain: TerrainKind;
}

/** A unit on the tactical map — corresponds to one officer + their troop allotment. */
export interface TacticalUnit {
  id: EntityId;
  officerId: EntityId;
  side: 'attacker' | 'defender';
  coord: HexCoord;
  /** Current troop count (HP). */
  troops: number;
  maxTroops: number;
  /** Action points remaining this turn. Refilled at start of turn. */
  ap: number;
  maxAp: number;
  /** "morale" — drops on damage; if 0, unit routs and is removed. */
  morale: number;
  /** True if this is the army commander — eliminating them = side defeat. */
  isCommander: boolean;
  /** Active status effects, e.g. "burning", "confused", "defending". */
  effects: TacticalStatus[];
  /** Unit type (combat arm). */
  unitType: UnitType;
  /** Ship class — set only for units in a naval battle. Drives hull strength
   *  (ramming/boarding power) and fire vulnerability. */
  shipClass?: ShipClass;
  /** Hidden ambushers — only revealed when an enemy steps adjacent or
   *  the unit attacks. Set when starting in forest with the
   *  ten-ambush formation. */
  hidden?: boolean;
}

export type TacticalStatus =
  | { kind: 'burning'; turnsLeft: number }
  | { kind: 'confused'; turnsLeft: number }
  | { kind: 'defending'; turnsLeft: number }
  | { kind: 'chained'; turnsLeft: number; chainedWith: EntityId[] }
  | { kind: 'revealed'; turnsLeft: number }
  | { kind: 'demoralized'; turnsLeft: number };

/** Stratagem types — single-use special actions during the battle. */
export type StratagemId =
  | 'fire-attack'   // 火計
  | 'confusion'     // 計略
  | 'charge'        // 突撃
  | 'defend'        // 防御
  | 'rally'         // 鼓舞
  | 'rain-of-arrows' // 矢雨齊發
  | 'chain-ships'   // 連環 — link enemies so they share damage
  | 'false-retreat' // 偽計 — fake rout to lure pursuers into a kill zone
  | 'precognition'  // 神算 — reveal enemy AP & cooldowns next turn
  | 'lightning'     // 落雷 — direct damage with chance to confuse
  | 'supply-strike' // 兵糧攻 — sap morale of all enemies on map
  | 'gallop'        // 飛将 — Lü Bu's signature: charge 3 hexes + strike
  | 'dragon-veil'   // 龍威 — Zhao Yun's signature: free hit on every adjacent enemy
  // ── Naval (water battles only) ──
  | 'ram'           // 撞角 — warship rams an adjacent ship; heavy hull damage
  | 'board'         // 接舷 — board an adjacent ship; marine melee, shatters morale
  | 'fire-ship';    // 火船 — fireships; devastating against chained fleets (赤壁)

export interface Stratagem {
  id: StratagemId;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  /** Min intelligence to use. */
  minIntelligence: number;
  /** Range in hexes (Chebyshev). */
  range: number;
  /** Cooldown in turns (0 = once per battle). */
  cooldown: number;
  /** If set, ONLY these specific officer IDs can use this stratagem (signature move). */
  signatureOf?: string[];
  /** If set, the unit must be one of these types. */
  requiresUnitType?: ReadonlyArray<'infantry' | 'spearmen' | 'cavalry' | 'archers' | 'siege' | 'navy'>;
  /** Min war stat (for melee-heavy stratagems like 突撃). */
  minWar?: number;
}

export interface TacticalBattle {
  id: EntityId;
  /** The strategic-map city we're fighting over. */
  cityId: EntityId;
  attackerForceId: EntityId | null;
  defenderForceId: EntityId | null;
  width: number;
  height: number;
  tiles: TacticalTile[];
  units: TacticalUnit[];
  turn: number;
  /** Whose phase it is. */
  activeSide: 'attacker' | 'defender';
  /** Stratagem cooldowns per unit (key: unitId-stratagemId → turn when usable again). */
  stratagemCooldowns: Record<string, number>;
  /** Set when one side is eliminated. */
  winner?: 'attacker' | 'defender';
  /** Casualty totals, computed at end. */
  attackerLosses: number;
  defenderLosses: number;
  /** Per-side primary objective. */
  attackerObjective?: BattleObjective;
  defenderObjective?: BattleObjective;
  /** Per-side formation. */
  attackerFormation?: FormationId;
  defenderFormation?: FormationId;
  /** Weather & time of day. */
  weather: Weather;
  timeOfDay: TimeOfDay;
  /** Wind direction (snapshot of strategic weather). Biases fire spread. */
  windDirection?: 'north' | 'south' | 'east' | 'west' | 'calm';
  /** Scripted reinforcements (consumed when they arrive). */
  reinforcements?: Reinforcement[];
  /** Special tiles for objectives (supply, bridge, etc). */
  specialTiles?: Array<{
    coord: HexCoord;
    label: BilingualName;
    role: 'supply' | 'bridge' | 'hill' | 'wagon' | 'flag';
  }>;
  /** Floating damage popups (UI-only, cleared per frame). */
  damagePopups?: DamagePopup[];
  /** Battle log entries (voice lines, milestones). */
  log?: Array<{
    turn: number;
    text: string;
    speaker?: EntityId;
    kind: 'voice' | 'event' | 'arrival';
  }>;
  /** Captured officer IDs after victory. */
  capturedOfficerIds?: EntityId[];
  /** Loot computed at end (gold, items). */
  loot?: {
    gold: number;
    itemId?: EntityId;
  };
  /**
   * Defensive structures the defender's city has built on its perimeter,
   * placed onto specific hex coords on the battlefield. Visible to both
   * sides; auto-attack attackers each turn (watchtower fires arrows, etc.).
   */
  cityStructures?: TacticalCityStructure[];
  /**
   * Field battle (army-vs-army in the open) rather than a city siege — set
   * when the player leads a field army into battle in person (亲征野战). No
   * city changes hands; casualties write back to the two armies instead.
   */
  field?: boolean;
  /** The player (attacker) army id, for field-battle casualty writeback. */
  attackerArmyId?: EntityId;
  /** The enemy (defender) army id, for field-battle casualty writeback. */
  defenderArmyId?: EntityId;
  /**
   * Naval engagement — the battlefield is open water, every unit is a ship,
   * and fire spreads ruinously through chained fleets. Set automatically when
   * the contested city's terrain is `water`.
   */
  naval?: boolean;
  /**
   * Hit points of destructible 城牆 / 城門 hexes, keyed by "col,row". Siege
   * units batter these down (assaultStructure); at 0 HP the hex becomes a
   * passable breach. Hexes absent from this map (e.g. named-map gates) break
   * in a single hit, preserving the old behaviour.
   */
  wallHp?: Record<string, number>;
}

export interface TacticalCityStructure {
  /** Reference back to the city's slot index (0-7 compass position). */
  slotIndex: number;
  /** Building kind — see DEFENSE_BUILDINGS. */
  buildingId: import('../data/defenseBuildings').DefenseBuildingId;
  /** Current level (1-3). */
  level: number;
  /** Position on the hex grid. */
  coord: HexCoord;
  /** Current HP — destructible. Initial = level * 200. */
  hp: number;
  /** Has the trap been triggered (rockfall etc. are one-shot). */
  triggered?: boolean;
}
