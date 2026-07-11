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
  /** 名向之風 — a locked wind direction so the signature mechanic blows true
   *  (赤壁's fire rides the 東南風 onto the chained fleet, not a random way). */
  windDirection?: 'north' | 'south' | 'east' | 'west' | 'calm';
  /** Optional scripted reinforcements. */
  reinforcements?: Reinforcement[];
  /** Special hex tags for objectives (e.g. supply, bridge). */
  specialTiles?: Array<{
    coord: HexCoord;
    label: BilingualName;
    role: 'supply' | 'bridge' | 'hill' | 'wagon' | 'flag';
  }>;
  /** 戰役腳本 — scripted win conditions + opening flavour for famous battles. */
  attackerObjective?: BattleObjective;
  defenderObjective?: BattleObjective;
  introZh?: string;
  introEn?: string;
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
  | 'ice'         // 冰面 — frozen northern river: crossable but slow/slippery
  | 'hill'        // 高地 — archers gain +1 range, melee gains charge bonus
  | 'marsh'       // 沼澤 — movement halved, cavalry suffers
  | 'desert'      // 沙磧 — open sand/gobi (河西/塞北): no cover, slows infantry
  | 'chokepoint'  // 隘口 — only 1 unit can pass; defenders +30% defense
  | 'bridge'      // 橋樑 — river-crossing bridge; allows non-navy over rivers
  | 'gate'        // 城門 — siege-only; tougher than wall but a bottleneck
  | 'wall'        // 城牆 — impassable rampart; siege engines batter it down (HP)
  | 'watchtower'  // 瞭望台 — +1 range + reveals hidden adjacent units
  | 'fieldworks'; // 築壘 — stakes + earthworks raised mid-battle: cover, breaks cavalry charges, burns like tinder

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
  /** 士氣 — drops on damage/rout-shock, recovered by rally/aura/收攏. Feeds
   *  fighting power (氣勢如虹 ↔ 動搖); at 0 the unit is **潰走**: it can't attack
   *  and auto-flees toward its own edge, run down by pursuers (追擊掩殺) until
   *  killed or rallied back above 0. Only troops==0 removes it from the field. */
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
  /** 車輪戰 — duels fought this battle. Each prior bout leaves the officer
   *  more winded, so successive fresh challengers can wear down a strong foe. */
  duelFatigue?: number;
  /** 久戰疲乏 (0..100) — rises with each attack/turn of fighting, recovers when
   *  the unit rests/defends. 一鼓作氣再而衰三而竭: fresh units hit harder, the
   *  spent flag (≥70) loses 1 AP. Absent → treated as 0 (fresh). */
  fatigue?: number;
  /** 弓矢 — remaining volleys for ranged units (archers/siege/navy). Each
   *  矢雨齊發 spends one; resupplied beside a 糧車/補給格. Out of ammo → no volley
   *  until resupplied (forced to close to melee). Absent on melee units. */
  ammo?: number;
  maxAmmo?: number;
  /** 朝向 (0..5 hex direction) — the way the unit faces (set by its last move/
   *  attack). 側背 bonuses read this: a blow from the rear arc lands 1.25×, a
   *  flank 1.12×. Absent → falls back to side-based facing (legacy). */
  facing?: number;
  /** 行軍路線 — queued waypoints from a multi-step move order. The unit walks
   *  these within the turn as AP allows; any leftover auto-resumes at the start
   *  of its side's next turn (unless it's pinned in melee). Cleared on arrival,
   *  on a blocked route, or when the player issues a fresh manual order. */
  path?: HexCoord[];
  /** 糧車 — a supply/grain convoy, not a fighting unit: slow and lightly manned.
   *  Burn it down and the side that fed off it starves (see endTurn's 燒糧). */
  isSupply?: boolean;
  /** 戰功 — cumulative enemy troops this unit has felled, and routs it caused.
   *  Pure bookkeeping for the 戰後復盤 MVP (§5.8); never gates combat. */
  damageDealt?: number;
  kills?: number;
  /** 衝鋒蓄力 — transient run accumulator for this activation. `from` is where
   *  the run began (this turn's first step); `dist` is the NET hex distance run
   *  from there (so doubling back doesn't count). A melee blow after a run
   *  (`dist ≥ 2`) onto a foe that was ≥2 away when the run began lands with
   *  momentum (cavalry hardest); consumed on attack and reset each turn. */
  charge?: { from: HexCoord; dist: number };
}

export type TacticalStatus =
  | { kind: 'burning'; turnsLeft: number }
  | { kind: 'confused'; turnsLeft: number }
  | { kind: 'defending'; turnsLeft: number }
  | { kind: 'chained'; turnsLeft: number; chainedWith: EntityId[] }
  | { kind: 'revealed'; turnsLeft: number }
  | { kind: 'demoralized'; turnsLeft: number }
  | { kind: 'starving'; turnsLeft: number } // 糧盡 — desertion + sapped fighting power
  | { kind: 'disorder'; turnsLeft: number } // 陷亂 — ranks broken by a charge / river crossing: hits weaker, is hit harder, until it re-forms (據守 or a turn)
  | { kind: 'feign-rout'; turnsLeft: number }; // 詐敗 — looks broken to lure pursuers; springs on the first attacker (full counter + disorders them)

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
  | 'fire-ship'     // 火船 — fireships; devastating against chained fleets (赤壁)
  // ── Supply raiding ──
  | 'raid-supply'   // 劫糧道 — from deep in the enemy rear, burn their grain (烏巢)
  | 'rockslide';    // 落石 — from the heights, bury the path below in stone

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
  /** 守城戰 — set when this is an interactive defence of a player city
   *  against an AI column; survivors of a repelled assault stream back
   *  to this city. */
  siegeDefenseSourceCityId?: EntityId;
  /** 馳援 — relief columns marching to this battle from the defender's
   *  neighbouring cities. Troops were deducted at dispatch; survivors
   *  return home afterwards (refunded in full if they never arrived). */
  reliefPlans?: Array<{ cityId: EntityId; officerId: EntityId; troops: number }>;
  /** 會戰 — map columns (either side) that answered the drums: scheduled as
   *  reinforcements entering from their TRUE bearing; at battle end their
   *  survivors are written back to the map armies (never double-counted
   *  into the main sides' writebacks). See planColumnReinforcements. */
  columnPlans?: Array<{ armyId: EntityId; officerIds: EntityId[]; side: 'attacker' | 'defender'; troops: number }>;
  /** 火攻 — ground hexes ablaze: damage whoever stands on them, creep
   *  downwind through flammable terrain, die in the rain, and burn
   *  forests down to open ground. */
  groundFires?: Array<{ coord: HexCoord; turnsLeft: number }>;
  /** 戰場烙印 — lasting terrain mutations this battle carved (a forest burned
   *  to the ground, a bridge dropped into the river). Battle-tile coords;
   *  resolveBattleEnd maps them back to WORLD hexes via geoAnchor so the
   *  strategic map remembers the scar (store.worldScars). */
  terrainScars?: Array<{ coord: HexCoord; kind: 'burned-forest' | 'burned-bridge' }>;
  /** 火燒連營 — fieldworks torched this battle (3+ = the Lu Xun feat). */
  fieldworksBurned?: number;
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
  /** 撤退 — the loser conceded and pulled out in order; survivors escape and
   *  the victor mounts no pursuit (no 掩殺 bonus). */
  withdrew?: boolean;
  /** 戰局氣勢 — the tide of battle (−100..+100, positive favours the attacker).
   *  Swings on kills / a felled commander / objective progress; decays toward 0
   *  each turn. The favoured side hits a touch harder (順勢) and recovers heart,
   *  the losing side bleeds it (頹勢). Absent → 0 (even). */
  momentum?: number;
  /** 決堤 — a dam map-trap has been broken (one-shot flood). */
  damBroken?: boolean;
  /** 燒糧 — a supply convoy has been destroyed and the starvation penalty
   *  already applied (one-shot, so it doesn't re-fire each turn). */
  grainBurned?: boolean;
  /** Casualty totals, computed at end. */
  attackerLosses: number;
  defenderLosses: number;
  /** Officer ids whose unit was destroyed/routed (removed from the field),
   *  accumulated across turns per side. resolveBattleEnd reads this to mark the
   *  losing side's fallen officers dead/captured — units are removed during the
   *  battle, so the final `units` array alone can't reveal who fell. */
  casualties?: { attacker: EntityId[]; defender: EntityId[] };
  /** 單挑生擒/斬殺 — when a duel KOs an officer, the victor may choose their
   *  fate. resolveBattleEnd forces these (skipping the charisma capture roll):
   *  ids here are captured / killed for certain. */
  forcedCaptures?: EntityId[];
  forcedKills?: EntityId[];
  /** Cumulative troops ever fielded per side (initial deployment + arrived
   *  reinforcements). Losses = startTroops − current surviving troops, which
   *  counts damage to survivors and never miscounts a routed-but-not-wiped unit
   *  as a total loss. */
  startTroops?: { attacker: number; defender: number };
  /** Per-side primary objective. */
  attackerObjective?: BattleObjective;
  defenderObjective?: BattleObjective;
  /** Per-side formation. */
  attackerFormation?: FormationId;
  defenderFormation?: FormationId;
  /** Weather & time of day. */
  weather: Weather;
  timeOfDay: TimeOfDay;
  /** 戰前準備 — one preparation per side, spent before the first move. */
  prepUsed?: Partial<Record<'attacker' | 'defender', import('../systems/tacticalSchemes').BattlePrepKind>>;
  /** 致師 — a pre-battle champion's challenge, at most once per side (turn 1). */
  preDuelUsed?: Partial<Record<'attacker' | 'defender', true>>;
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
  /** Battle log entries (voice lines, milestones). `text` is the zh-first
   *  display string; `textEn` is an optional English variant (the log is
   *  zh-first, so most entries omit it and show `text` in either language). */
  log?: Array<{
    turn: number;
    text: string;
    textEn?: string;
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
  /**
   * The board's window into the strategic map: where its centre sits (x,y on the
   * 1000×720 world) and the bearing (radians, attacker→defender) it's rotated to.
   * anchorCol = which board column sits on (x,y) — sieges anchor the city near
   * the defender edge. Lets a shared locator place "you are here", orient the
   * compass, and pin the in-world battle diorama on the right spot.
   */
  geoAnchor?: { x: number; y: number; bearing: number; anchorCol?: number };
  /**
   * 演習 — a sparring drill launched from a city. Casualties, captures, XP and
   * loot are all discarded when it ends; nothing writes back to the campaign.
   */
  practice?: boolean;
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
