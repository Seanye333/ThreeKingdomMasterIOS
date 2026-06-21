import type {
  Appointment,
  Building,
  City,
  Command,
  DiplomaticState,
  EdictKind,
  EntityId,
  EspionageOp,
  FamilyRelation,
  Fleet,
  Force,
  GameDate,
  HistoricalEvent,
  HistoricBattle,
  IssuedEdict,
  Officer,
  OfficerWish,
  Fort,
  PendingHeir,
  Port,
  ProvinceId,
  Scenario,
  SeasonReport,
  ShipBuildOrder,
  TacticalBattle,
  TradeRoute,
  TribeState,
} from '../types';
import type { OathBond } from '../data/bonds';
import { MONTH_PHASES, firstMonthOfSeason, seasonFromMonth } from '../types';
import type { MonthPhase } from '../types';
import { createInitialTribeState } from '../systems/tribes';
import { rollWeather, type Weather } from '../systems/weather';
import { createInitialMandate, type MandateState } from '../systems/mandate';
import { ITEMS } from '../data/items';
import { buildInitialPorts } from '../data/ports';
import { buildInitialForts } from '../data/forts';
import { distinctForceColors } from '../data/forceColors';
import { buildInitialSites } from '../data/sites';
import { FAMILY_LINEAGE } from '../data/familyLineage';
import { buildHistoricalOfficers } from '../data/officers';
import { loadMods, modEventsForStart, modOfficersForStart } from '../systems/mods';
import { bestPrestige } from '../data/prestige';
import type { Dynasty } from '../data/dynasties';

export type VictoryStatus = 'playing' | 'victory' | 'defeat' | 'observing';
export type Difficulty = 'easy' | 'normal' | 'hard';

/** Reasons a game has been won. */
export type EndingKind =
  | 'unify'             // 統一 — control every city, people content (avg loyalty ≥ 50)
  | 'unify-tyrant'      // 霸道一統 — control every city, but ruled by fear (avg loyalty < 50)
  | 'restore-han'       // 漢室再興 — playing as a Liu, hold Luoyang + Chang'an + Xuchang
  | 'hegemon'           // 霸業 — NON-Liu holding all three Han capitals (rule by the sword)
  | 'tripartite'        // 三国鼎立 — three kingdoms balanced (each holds 1/3+)
  | 'recluse'           // 隐士退隐 — small force, high loyalty, after year 220
  | 'emperor'           // 即位 — enthronement issued and held for 5 years
  | 'endured'           // 久御四海 — outlasted the age: year ≥ 265, still holding ≥ 4 cities
  | 'defeat';           // lost

/** A historical event that has fired this session and is awaiting acknowledgement. */
export interface PendingEvent {
  event: HistoricalEvent;
  year: number;
  season: GameDate['season'];
  /** 抉擇 — the player rules the chooser's force; the modal must offer
   *  the event's choices and the pick resolves via resolveEventChoice. */
  awaitingChoice?: boolean;
}

export interface GameState {
  date: GameDate;
  scenarioId: EntityId | null;
  playerForceId: EntityId | null;
  selectedCityId: EntityId | null;
  /** Selected in-transit army (for map highlight), or null. */
  selectedArmyId: EntityId | null;
  /** Whether the city-interior map is open for the selected city (UI flag). */
  cityMapOpen: boolean;
  /** 觀戰 — the fullscreen battle view is minimized to its world-map diorama
   *  (the battle keeps running headless; tap the diorama to re-enter). */
  battleViewMinimized: boolean;
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  pendingCommands: Record<EntityId, Command>;
  /** 演武/論辯冷卻 — per-officer count of friendly 1-on-1 spars (and, separately,
   *  debates) taken this season, stamped with the season so it self-resets each
   *  turn. Caps in-house 演武場/論辯場 XP farming. See systems/sparLimit. */
  sparUsage: import('../systems/sparLimit').TrainUsage;
  debateUsage: import('../systems/sparLimit').TrainUsage;
  /** In-flight academy training tasks. Each entry ticks down each season
   *  and on completion adds a new policy to the officer. */
  pendingTrainings: Array<import('../systems/training').PendingTraining>;
  lastReport: SeasonReport | null;
  /** 事件地標 — this tick's per-city calamities/windfalls (famine, plague,
   *  harvest, rebellion, tribe raid), kept for map markers after the season
   *  report is dismissed. Replaced wholesale each tick. */
  cityEventMarks: Array<{ cityId: EntityId; kind: import('../types').ReportEntryKind; text: string }>;
  victoryStatus: VictoryStatus;
  difficulty: Difficulty;
  /** Active Hero Mode challenge id (英雄模式), or null in free play. When set,
   *  the season-end check scores it pass/fail and ends the game accordingly. */
  activeChallenge: string | null;
  /** Persisted best results per Hero Mode challenge — meta-progression that
   *  survives across games (not reset on scenario load). */
  challengeRecords: Record<string, import('../data/challenges').ChallengeRecord>;
  diplomacy: DiplomaticState;
  runtimeBonds: OathBond[];
  /** Pairwise officer rapport (好感, 0–100) grown via social actions. */
  rapport: Record<string, number>;
  battleHistory: HistoricBattle[];
  /** Civic title appointments — one entry per held post. */
  appointments: Appointment[];
  /** Audit log of appointments + revocations, for tenure cooldowns and the 歷任 tab. */
  appointmentHistory: import('../types').AppointmentHistoryEntry[];
  /** Per-force casus-belli marks set by 討伐令 — combat power +10% vs targets while active. */
  casusBelliMarks: Array<{ byForceId: EntityId; targetForceId: EntityId; expiresYear: number; expiresSeason: 'spring' | 'summer' | 'autumn' | 'winter' }>;
  /** Transient recruit multipliers from 求賢令. Decrements each season. */
  recruitBonusSeasons: Record<EntityId, { multiplier: number; seasonsLeft: number }>;
  /** Generic event flags (e.g. "luoyang-burned", "emperor-with-cao"). */
  eventFlags: Record<string, boolean>;
  /** IDs of historical events that have already fired. */
  firedEventIds: EntityId[];
  /** Player-authored events (事件編輯器). Shaped like HistoricalEvent with a
   *  `custom-` id; fire through the same engine. Persist across scenarios. */
  customEvents: import('../types/event').HistoricalEvent[];
  /** Event currently displayed to the player; null if none. */
  pendingEvent: PendingEvent | null;
  /** 戰略層回饋 — transient confirmation for the player's last issued order
   *  (委派/march/委任). Not persisted; the HUD pops it and auto-expires it. */
  actionToast: { key: number; zh: string; en: string; tone: 'ok' | 'warn' } | null;
  /** 出征 — transient signal that the player just dispatched an army, so the
   *  map can play a one-off departure flourish at the origin city. Not persisted. */
  marchDeparture: { key: number; cityId: EntityId; hostile: boolean } | null;
  /** 克城 — transient signal that the player just took a city, so the map can
   *  play a flag-planting flourish there. Not persisted. */
  cityCaptured: { key: number; cityId: EntityId } | null;
  /** 失守 — transient signal that the player just lost a city, for a somber
   *  banner-toppling beat there. Not persisted. */
  cityLost: { key: number; cityId: EntityId } | null;
  /** Active tactical battle screen, if any. */
  tacticalBattle: TacticalBattle | null;
  /** 戰鬥運鏡/特效 — transient batch the headless AI driver pushes each turn so
   *  the big-map diorama can play the same cast FX/sound/shake the fullscreen
   *  battle does. Not persisted; replaced wholesale, keyed for dedup. */
  battleFxBatch: { key: number; events: Array<{ tacticId?: string; stratagemId: import('../types').StratagemId; coord: import('../types').HexCoord }> } | null;
  /** Pending espionage ops queued for next season's resolution. */
  pendingEspionage: EspionageOp[];
  /** 潛伏細作 — persistent undercover agents embedded in enemy cities. */
  embeddedSpies: import('../types').EmbeddedSpy[];
  /** Historical record of all issued edicts. */
  edictHistory: IssuedEdict[];
  /** Per-edict cooldown tracking: season-count when each kind is available again. */
  edictCooldowns: Partial<Record<EdictKind, { year: number; season: GameDate['season'] }>>;
  /** Foreign tribe pressure state. */
  tribeState: TribeState;
  /** Sound on/off — persisted preference. */
  soundEnabled: boolean;
  /** All buildings in all cities. */
  buildings: Building[];
  /** Trade routes between cities. */
  tradeRoutes: TradeRoute[];
  /** Provincial governor appointments keyed by province id. */
  provinceGovernors: Partial<Record<ProvinceId, EntityId>>;
  /** Active fleets. */
  fleets: Fleet[];
  /** Pending ship build orders. */
  shipOrders: ShipBuildOrder[];
  /** Independent ports (RTK 14-style — captured separately from cities). */
  ports: Record<EntityId, Port>;
  /** Forts: historical 砦/關 + player-built 塢/壘. */
  forts: Record<EntityId, Fort>;
  /** 野外據點 — bandit nests, river fords, resource deposits. */
  sites: Record<EntityId, import('../types').WildSite>;
  /** 名所 loot claimed: scenic-site id → the force that took the treasure. */
  scenicLooted: Record<string, EntityId>;
  /** Phase 3c — territory ownership keyed by territory id. Null/missing
   *  means the cell inherits from its parent city. Set explicitly when
   *  an army marches through it, regardless of march outcome. */
  territoryOwnership: Record<EntityId, EntityId | null>;
  /** Persistent field armies marching on the map (keyed by army id). */
  armies: Record<EntityId, import('../types').Army>;
  /** Family relationships. */
  family: FamilyRelation[];
  /** Pending heirs that will activate when they come of age. */
  pendingHeirs: PendingHeir[];
  /** Officer wishes awaiting player response. */
  officerWishes: OfficerWish[];
  /** Pending grant/reject report entries to prepend to next season report. */
  pendingWishEntries: import('../types').ReportEntry[];
  /** Realized endings (for repeat-playthrough tracking). */
  endingsAchieved: EndingKind[];
  /** Hot-seat: which player slots are active (1 = solo). */
  hotSeatPlayers: Array<{ forceId: EntityId; label: string }>;
  /** Hot-seat: index of the current player whose turn it is. */
  hotSeatActiveIndex: number;
  /** Tutorial mode: which step is currently shown (null = off). */
  tutorialStep: number | null;
  /** Background music track name (null = ambience only). */
  musicTrack: string | null;
  /** UI language: 'zh' shows only Chinese, 'en' shows only English, 'both'
   *  (legacy default) shows the bilingual mix. */
  language: 'zh' | 'en' | 'both';
  /** Where talents and famous items start.
   *  'historical' (default) — undiscovered officers wait at their hometown;
   *    items not held by any starting officer fall to their origin city.
   *  'random' — both are scattered uniformly. Same scenario plays out
   *    very differently because Zhuge Liang isn't waiting in Langya, etc. */
  placementMode: 'historical' | 'random';
  /** Per-dynasty toggles for the "Historical Officers" pool. When non-empty,
   *  officers from these eras are added as 'unsearched' free agents at their
   *  hometown cities on scenario load. Set on the title screen. */
  enabledDynasties: Dynasty[];
  /** Items hidden in cities, awaiting discovery via Search. */
  lostItems: Array<{ itemId: EntityId; cityId: EntityId }>;
  /** Item-holder history — append-only log of equip transfers. */
  itemHistory: Array<{
    itemId: EntityId;
    fromOfficerId: EntityId | null;
    toOfficerId: EntityId;
    year: number;
    season: 'spring' | 'summer' | 'autumn' | 'winter';
  }>;
  /** Saved battle replays. */
  battleReplays: import('../types').BattleReplay[];
  /** 名局廊 — replayable records of notable duels & debates (newest first). */
  duelHall: import('../systems/duelHall').BoutRecord[];
  /** 武評榜 — per-officer ELO rating for single combat (seeded from 武力 if absent). */
  warRatings: Record<EntityId, number>;
  /** 單挑戰役 — ids of duel scenarios the player has cleared (campaign progress). */
  clearedDuelScenarios: EntityId[];
  /** Per-turn snapshots of the CURRENT battle (transient, not persisted) —
   *  harvested into the replay when the battle resolves. */
  currentBattleSnapshots: import('../types').TacticalBattle[];
  /** Heroic deeds tracker keyed by officer id. */
  deeds: Record<EntityId, import('../types').HeroicDeeds>;
  /** Fog of war on (player-only flag, cosmetic). */
  fogOfWar: boolean;
  /** 稅率 — per-force taxation (gold↔loyalty trade-off). Absent ⇒ 'normal',
   *  so existing saves and every AI force keep historical behaviour. */
  taxPolicy: Record<EntityId, import('../types').TaxRate>;
  /** 信譽 — a force's reputation for keeping its word (0–100, absent ⇒ 100).
   *  Breaking an alliance burns it; honoured pacts slowly rebuild it. Low
   *  credibility makes others wary of the player's future proposals. */
  credibility: Record<EntityId, number>;
  /** 積怨 — how much each AI force resents the PLAYER (0–100, absent ⇒ 0).
   *  Rises when you march on their cities or tear up a pact; soothed by tribute
   *  and honoured agreements. A bitter foe is far harder to make peace with. */
  grudges: Record<EntityId, number>;
  /** 通商條約 — force ids the player holds a trade treaty with. Both parties
   *  earn steady commerce income each season while at peace. */
  tradePartners: EntityId[];
  /** 通貨膨脹 — debasing the coinage (鑄小錢) buys quick gold but drives
   *  inflation (0–100), which saps every city's tax income until it eases. 0 by
   *  default, so a realm that never mints is wholly unaffected. */
  inflation: number;
  /** 輜重 — supply convoys (運糧/運金車) crawling between your cities. */
  convoys: Record<EntityId, import('../systems/convoy').Convoy>;
  /** 常運糧道 — standing supply routes: each season any surplus grain at the
   *  source auto-ships to the destination. */
  standingRoutes: Array<{ fromCityId: EntityId; toCityId: EntityId }>;
  /** 細作開眼 — cities lit by successful espionage, ticks of intel left.
   *  Decremented each half-month; consumed by the fog-of-war view. */
  espionageReveals: Record<EntityId, number>;
  /** 委任太守 — cityId → governor officerId. A delegated city auto-issues
   *  its governor's internal command at the start of every tick. */
  cityDelegations: Record<EntityId, EntityId>;
  /** 軍團都督 — player legions: a marshal, a city cluster, a directive.
   *  Their orders auto-issue at the start of every tick. */
  legions: import('../systems/legion').Legion[];
  /** 奉迎天子 — the city the Han emperor currently resides in. Owner of
   *  that city is his custodian (挾天子以令諸侯). */
  emperorCityId: EntityId | null;
  /** 每日挑戰 — the seed date of the run in progress (null outside one). */
  dailyChallengeDate: string | null;
  /** 勢力消長 — one power snapshot per season, capped, for the graph. */
  powerHistory: import('../systems/powerHistory').PowerSnapshot[];
  /** 訪賢招攬 — per free-agent recruit state, keyed by season:
   *  'declined' (offer escalation this season) / 'locked' (lost a debate,
   *  no retry until next season). Stale entries (old season) are ignored. */
  recruitState: Record<EntityId, { season: string; stage: 'declined' | 'locked' }>;
  /** Saved command templates the player can re-apply each season. */
  commandTemplates: Array<{
    id: EntityId;
    label: string;
    commands: Array<{ cityId: EntityId; type: import('../types').InternalAffairsType }>;
  }>;
  /** Auto-build orders per city — applied at season-end if city is owned + idle. */
  autoBuildQueues: Record<EntityId, Array<import('../types').BuildingId>>;
  /** Pending dialogue event shown to the player; null when idle. */
  pendingDialogue: import('../types').DialogueEvent | null;
  /** Queue of branching follow-up dialogues to fire deterministically before random rolls. */
  dialogueFollowups: EntityId[];
  /** Objective completion state: which scenario goal IDs have been achieved. */
  achievedObjectives: EntityId[];
  /** Career mode state (player plays a single officer, not a force). */
  careerMode: import('../types').CareerState | null;
  /** Battle speed multiplier (1 = normal, 2/4 = faster AI turns). */
  battleSpeed: number;
  /** Romance-mode toggle: when true, historical events fire 100% on schedule. */
  romanceMode: boolean;
  /** Roguelike mode: when true and the career officer dies, game resets to
   *  title and increments the cross-run counter. */
  roguelikeMode: boolean;
  /** Per-campaign superlatives. */
  campaignStats: import('../types').CampaignStats;
  /** Achievements unlocked this session (toast queue). */
  recentAchievementUnlocks: string[];
  /** Deed-titles newly earned since last acknowledgement (toast queue). */
  recentDeedTitles: Array<{ officerId: EntityId; titleId: string }>;
  /** 威名 titles newly attained since last acknowledgement (toast queue). */
  recentPrestige: Array<{ officerId: EntityId; titleId: string }>;
  /** Player bonds forged in-play, awaiting a 義結金蘭 ceremony on the map. */
  recentBonds: Array<{ aId: EntityId; bId: EntityId; titleZh: string; titleEn: string }>;
  /** Player officers who rose to a top-tier 威名 title, awaiting a 封號 ceremony. */
  recentPrestigeCeremony: Array<{ officerId: EntityId; titleId: string }>;
  /** Player officers who crossed into a 金牌+ 品階 this season, awaiting a 晉牌封賞 ceremony. */
  recentPromotions: Array<{ officerId: EntityId; grade: import('../systems/officerGrade').OfficerGrade }>;
  /** Per-officer battle-source deed deltas accumulated during the current
   *  season (殲敵/生擒/攻陷). Reset at season-end after MVP computation. */
  seasonBattleDeltas: Record<EntityId, { killsTroops: number; captured: number; citiesTaken: number }>;
  /** Current-season weather (wind direction + kind). Rolled at season-end. */
  weather: Weather;
  /** Court factions per force — who plots against whom. Keyed by forceId. */
  courtFactions: Record<EntityId, Array<{ officerId: EntityId; faction: 'reformer' | 'eunuch' | 'gentry' | 'military' }>>;
  /** Cities currently visibly burning on the map (decays over seasons). */
  burningCities: Array<{ cityId: EntityId; seasonsLeft: number }>;
  /** Recent field-battle sites marked on the map (ambush/camp-storm/clash),
   *  decaying over seasons. Coords are in the 1000×720 map space. */
  fieldBattleMarks: Array<{
    x: number; y: number; kind: 'ambush' | 'camp' | 'clash'; seasonsLeft: number;
    // ── Enrichment so the on-map melee can replay the REAL outcome ──
    aColor?: string; bColor?: string;   // the two sides' force colours
    winner?: -1 | 1;                    // -1 = side A (left) prevailed, 1 = side B
    winName?: string;                   // victor's name for the on-site result flag
    aTroops?: number; bTroops?: number; // scale each side's brawler count
  }>;
  /** Player-involved field clashes the AI forced this season (AI 亲征),
   *  awaiting interactive tactical resolution after the season report. */
  pendingFieldBattleQueue: Array<{ playerArmyId: EntityId; enemyArmyId: EntityId }>;
  /** 守城戰 queue — AI columns at the player's gates, fought interactively
   *  after the season report. */
  pendingSiegeDefenseQueue: Array<{
    sourceCityId: EntityId; targetCityId: EntityId;
    officerIds: EntityId[]; troops: number;
  }>;
  /** 行軍預覽 — transient route highlight while the march picker is open. */
  marchPreview: { fromId: EntityId; toId: EntityId } | null;
  /** 本局戰史 — the campaign chronicle: conquests, siege works, famous
   *  events, rebellions. Shown as the epic recap on victory/defeat. */
  chronicle: Array<{ year: number; season: string; zh: string; en: string; kind: 'conquest' | 'works' | 'event' | 'rebellion' | 'defense' }>;
  /** Heaven's Mandate per force (0-100). */
  mandate: MandateState;
  /** Active 截糧 / delayed stratagem effects ticking down per season. */
  pendingDelayedEffects: Array<{
    targetCityId?: EntityId;
    seasons: number;
    perSeason: number;
  }>;
  /**
   * Player-side battles queued for theater playback. Shown one at a time
   * after the season report is dismissed.
   */
  pendingBattleTheaters: import('../types').HistoricBattle[];
}

export const EMPTY_STATE: GameState = {
  date: { year: 190, season: 'spring', month: 1, phase: 'upper' },
  scenarioId: null,
  playerForceId: null,
  selectedCityId: null,
  selectedArmyId: null,
  cityMapOpen: false,
  battleViewMinimized: false,
  cities: {},
  forces: {},
  officers: {},
  pendingCommands: {},
  sparUsage: {},
  debateUsage: {},
  pendingTrainings: [],
  lastReport: null,
  cityEventMarks: [],
  victoryStatus: 'playing',
  difficulty: 'normal',
  activeChallenge: null,
  challengeRecords: {},
  diplomacy: { relations: {} },
  runtimeBonds: [],
  rapport: {},
  battleHistory: [],
  appointments: [],
  appointmentHistory: [],
  casusBelliMarks: [],
  recruitBonusSeasons: {},
  eventFlags: {},
  firedEventIds: [],
  pendingEvent: null,
  actionToast: null,
  marchDeparture: null,
  cityCaptured: null,
  cityLost: null,
  tacticalBattle: null,
  battleFxBatch: null,
  pendingEspionage: [],
  embeddedSpies: [],
  edictHistory: [],
  edictCooldowns: {},
  tribeState: createInitialTribeState(),
  customEvents: [],
  soundEnabled: true,
  buildings: [],
  tradeRoutes: [],
  provinceGovernors: {},
  fleets: [],
  shipOrders: [],
  ports: {},
  forts: {},
  sites: {},
  scenicLooted: {},
  territoryOwnership: {},
  armies: {},
  family: [],
  pendingHeirs: [],
  officerWishes: [],
  pendingWishEntries: [],
  endingsAchieved: [],
  hotSeatPlayers: [],
  hotSeatActiveIndex: 0,
  tutorialStep: null,
  musicTrack: null,
  language: 'zh',
  placementMode: 'historical',
  enabledDynasties: [],
  lostItems: [],
  itemHistory: [],
  battleReplays: [],
  duelHall: [],
  warRatings: {},
  clearedDuelScenarios: [],
  currentBattleSnapshots: [],
  deeds: {},
  fogOfWar: false,
  taxPolicy: {},
  credibility: {},
  grudges: {},
  tradePartners: [],
  inflation: 0,
  convoys: {},
  standingRoutes: [],
  espionageReveals: {},
  cityDelegations: {},
  legions: [],
  emperorCityId: 'luoyang',
  dailyChallengeDate: null,
  powerHistory: [],
  recruitState: {},
  commandTemplates: [],
  autoBuildQueues: {},
  pendingDialogue: null,
  dialogueFollowups: [],
  achievedObjectives: [],
  careerMode: null,
  battleSpeed: 1,
  romanceMode: false,
  roguelikeMode: false,
  campaignStats: { seasonsPlayed: 0, totalBattles: 0 },
  recentAchievementUnlocks: [],
  recentDeedTitles: [],
  recentPrestige: [],
  recentBonds: [],
  recentPrestigeCeremony: [],
  recentPromotions: [],
  seasonBattleDeltas: {},
  weather: { kind: 'clear', wind: 'calm', windPower: 1 },
  courtFactions: {},
  burningCities: [],
  fieldBattleMarks: [],
  pendingFieldBattleQueue: [],
  pendingSiegeDefenseQueue: [],
  marchPreview: null,
  chronicle: [],
  mandate: { byForce: {} },
  pendingDelayedEffects: [],
  pendingBattleTheaters: [],
};

export interface CustomOfficerInit {
  id: string;
  name: { zh: string; en: string };
  courtesyName?: { zh: string; en: string };
  stats: import('../types').OfficerStats;
  skills: string[];
  affiliationForceId: EntityId | null;
}

export function loadScenario(
  state: GameState,
  scenario: Scenario,
  playerForceId: EntityId,
  difficulty: Difficulty,
  customOfficer?: CustomOfficerInit,
): GameState {
  const playerTroopMul = difficulty === 'easy' ? 1.2 : 1.0;
  const aiTroopMul = difficulty === 'hard' ? 1.2 : 1.0;

  const capitalIds = new Set(scenario.forces.map((f) => f.capitalCityId));
  const scaledCities: City[] = scenario.cities.map((c) => {
    const isPlayer = c.ownerForceId === playerForceId;
    const isAI = c.ownerForceId !== null && c.ownerForceId !== playerForceId;
    const mul = isPlayer ? playerTroopMul : isAI ? aiTroopMul : 1.0;
    // Auto-tier walls: capital + cities ≥ 200k pop are tier 3, pop ≥ 100k tier 2.
    const wallTier: 1 | 2 | 3 =
      capitalIds.has(c.id) || c.population >= 200_000 ? 3 :
      c.population >= 100_000 ? 2 : 1;
    const base = mul === 1.0 ? c : { ...c, troops: Math.floor(c.troops * mul) };
    return { ...base, wallTier };
  });

  // Pull in historical officers from enabled dynasties — these arrive as
  // unsearched free agents at their hometown city.
  const historicalOfficers = buildHistoricalOfficers(state.enabledDynasties);
  // De-dupe by id so a scenario shipping its own copies of historical officers
  // (e.g. the Warring States board, where they start already enfeoffed to a
  // state) wins over the unsearched free-agent injection of the same ids.
  const inScenario = new Set(scenario.officers.map((o) => o.id));
  const baseOfficers = historicalOfficers.length > 0
    ? [...scenario.officers, ...historicalOfficers.filter((o) => !inScenario.has(o.id))]
    : scenario.officers;

  // If the player chose 'random' placement, scrub the historical hometowns
  // off undiscovered officers so they don't all sit at Langya / Tianshui etc.
  // Officers waiting at hometown have `status: 'unsearched'` and
  // `locationCityId === hometownCityId`; setting `locationCityId: null`
  // puts them in the "rootless wanderer" pool so search finds them anywhere.
  let officers = state.placementMode === 'random'
    ? baseOfficers.map((o) =>
        o.status === 'unsearched' && o.locationCityId === o.hometownCityId
          ? { ...o, locationCityId: null }
          : o,
      )
    : baseOfficers;
  // Mod 數據包 — installed bundles contribute officers on every new game.
  {
    const mods = loadMods();
    if (mods.length > 0) {
      const validForces = new Set(scenario.forces.map((f) => f.id));
      const existing = new Set(officers.map((o) => o.id));
      const extras = modOfficersForStart(mods, scenario.startDate.year, validForces)
        .filter((o) => !existing.has(o.id));
      if (extras.length > 0) officers = [...officers, ...extras];
    }
  }

  if (customOfficer) {
    // Place custom officer either in their chosen force's capital, or in a
    // random owned city as a free agent.
    let cityId: EntityId | null = null;
    let forceId: EntityId | null = null;
    let status: 'idle' | 'unsearched' = 'idle';
    if (customOfficer.affiliationForceId) {
      const f = scenario.forces.find((x) => x.id === customOfficer.affiliationForceId);
      if (f) {
        forceId = f.id;
        cityId = f.capitalCityId;
      }
    } else {
      const ownedCities = scaledCities.filter((c) => c.ownerForceId !== null);
      cityId = ownedCities[Math.floor(Math.random() * ownedCities.length)]?.id ?? null;
      status = 'unsearched';
    }
    officers = [
      ...officers,
      {
        id: customOfficer.id,
        name: customOfficer.name,
        courtesyName: customOfficer.courtesyName,
        birthYear: scenario.startDate.year - 25,
        stats: customOfficer.stats,
        loyalty: forceId ? 95 : 0,
        locationCityId: cityId,
        forceId,
        status,
        task: null,
        equipment: [],
        skills: customOfficer.skills,
        rank: 'captain',
      },
    ];
  }

  return {
    ...state,
    date: {
      ...scenario.startDate,
      month: scenario.startDate.month ?? firstMonthOfSeason(scenario.startDate.season),
      phase: scenario.startDate.phase ?? 'upper',
    },
    scenarioId: scenario.id,
    playerForceId,
    difficulty,
    selectedCityId:
      scenario.forces.find((f) => f.id === playerForceId)?.capitalCityId ??
      null,
    cities: indexById(scaledCities),
    forces: indexById(
      distinctForceColors(
        scenario.forces.map((f) => ({ ...f, isPlayer: f.id === playerForceId })),
      ),
    ),
    // Seed each officer's cached 威名 title from innate stats so the first
    // season doesn't announce prestige for the entire famous roster at once —
    // only genuine in-play rises fire a notice thereafter.
    officers: indexById(officers.map((o) => ({ ...o, prestigeTitleId: bestPrestige(o)?.id }))),
    pendingCommands: {},
    sparUsage: {},
    debateUsage: {},
    pendingTrainings: [],
    lastReport: null,
  cityEventMarks: [],
    victoryStatus: 'playing',
    activeChallenge: null,
    // Challenge records are meta-progression — carry across games.
    challengeRecords: state.challengeRecords ?? {},
    diplomacy: { relations: {} },
    runtimeBonds: [],
    rapport: {},
    battleHistory: [],
    appointments: [],
  appointmentHistory: [],
  casusBelliMarks: [],
  recruitBonusSeasons: {},
    eventFlags: {},
    firedEventIds: [],
    // Authored events carry across scenarios (firedEventIds resets, so they
    // can fire again in the new game).
    customEvents: (() => {
      // Mod 數據包 — mod events ride the customEvents pipeline; de-dupe by id.
      const base = state.customEvents ?? [];
      const have = new Set(base.map((e) => e.id));
      return [...base, ...modEventsForStart(loadMods()).filter((e) => !have.has(e.id))];
    })(),
    pendingEvent: null,
    tacticalBattle: null,
    battleFxBatch: null,
    pendingEspionage: [],
    embeddedSpies: [],
    espionageReveals: {},
    cityDelegations: {},
    legions: [],
    emperorCityId: 'luoyang',
    dailyChallengeDate: null,
    powerHistory: [],
    recruitState: {},
    edictHistory: [],
    edictCooldowns: {},
    tribeState: createInitialTribeState(),
    soundEnabled: state.soundEnabled,
    buildings: [],
    tradeRoutes: [],
    provinceGovernors: {},
    fleets: [],
    shipOrders: [],
    ports: buildInitialPorts(
      Object.fromEntries(scaledCities.map((c) => [c.id, c.ownerForceId])),
    ),
    forts: buildInitialForts(
      Object.fromEntries(scaledCities.map((c) => [c.id, c.ownerForceId])),
    ),
    sites: buildInitialSites(),
    scenicLooted: {},
    territoryOwnership: {},
    armies: {},
    // Pre-populate canonical Three Kingdoms family lineages — filtered
    // to entries where BOTH officers are in the loaded roster.
    family: (() => {
      const idSet = new Set(officers.map((o) => o.id));
      return FAMILY_LINEAGE.filter((r) => idSet.has(r.officerA) && idSet.has(r.officerB));
    })(),
    pendingHeirs: [],
    officerWishes: [],
  pendingWishEntries: [],
    endingsAchieved: state.endingsAchieved,
    hotSeatPlayers: state.hotSeatPlayers,
    hotSeatActiveIndex: 0,
    tutorialStep: null,
    musicTrack: state.musicTrack,
    lostItems: computeLostItems(officers, scaledCities, state.placementMode),
    itemHistory: [],
    battleReplays: [],
    duelHall: [],
    warRatings: {},
    clearedDuelScenarios: [],
  currentBattleSnapshots: [],
    deeds: {},
    fogOfWar: state.fogOfWar,
    taxPolicy: state.taxPolicy ?? {},
    credibility: state.credibility ?? {},
    grudges: state.grudges ?? {},
    tradePartners: state.tradePartners ?? [],
    inflation: state.inflation ?? 0,
    convoys: state.convoys ?? {},
    standingRoutes: state.standingRoutes ?? [],
    commandTemplates: state.commandTemplates,
    autoBuildQueues: {},
    pendingDialogue: null,
    dialogueFollowups: [],
    achievedObjectives: [],
    careerMode: null,
    battleSpeed: state.battleSpeed,
    romanceMode: state.romanceMode,
    roguelikeMode: state.roguelikeMode,
    campaignStats: { seasonsPlayed: 0, totalBattles: 0 },
    recentAchievementUnlocks: [],
    recentDeedTitles: [],
    recentPrestige: [],
    recentBonds: [],
    recentPrestigeCeremony: [],
    recentPromotions: [],
    seasonBattleDeltas: {},
    weather: rollWeather(scenario.startDate.season, Math.random),
    courtFactions: {},
    burningCities: [],
    fieldBattleMarks: [],
    pendingFieldBattleQueue: [],
  pendingSiegeDefenseQueue: [],
  marchPreview: null,
  chronicle: [],
    mandate: createInitialMandate(scenario.forces.map((f) => f.id)),
    pendingDelayedEffects: [],
    pendingBattleTheaters: [],
  };
}

/**
 * Items not equipped by any starting officer are scattered as "lost in the
 * world", hidden in random cities. They can be found by the Search command.
 */
function computeLostItems(
  officers: import('../types').Officer[],
  cities: import('../types').City[],
  placementMode: 'historical' | 'random' = 'historical',
): Array<{ itemId: import('../types').EntityId; cityId: import('../types').EntityId }> {
  const equippedIds = new Set<string>();
  for (const o of officers) {
    for (const id of Object.values(o.equipment)) {
      if (id) equippedIds.add(id);
    }
  }
  const cityIds = cities.filter((c) => c.ownerForceId !== null).map((c) => c.id);
  const ownedCityIds = cityIds.length > 0 ? cityIds : cities.map((c) => c.id);
  const ownedCitySet = new Set(ownedCityIds);
  const allCityIds = new Set(cities.map((c) => c.id));
  const lost: Array<{ itemId: string; cityId: string }> = [];
  // Stable LCG so the same scenario hides items the same way each run.
  let seed = 1;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (const item of ITEMS) {
    if (equippedIds.has(item.id)) continue;
    if (ownedCityIds.length === 0) continue;
    // In 'historical' mode, prefer the item's recorded origin city
    // (whether currently owned or not). In 'random' mode, ignore origins
    // entirely and let the LCG decide for full surprise.
    let cityId: string;
    if (placementMode === 'historical' && item.originCityId && ownedCitySet.has(item.originCityId)) {
      cityId = item.originCityId;
    } else if (placementMode === 'historical' && item.originCityId && allCityIds.has(item.originCityId)) {
      cityId = item.originCityId;
    } else {
      cityId = ownedCityIds[Math.floor(rand() * ownedCityIds.length)];
    }
    lost.push({ itemId: item.id, cityId });
  }
  return lost;
}

/**
 * Advance one period (1/3 of a month — 上/中/下).
 * Order: 上 → 中 → 下 → next month 上 → ...
 * Season auto-derives from month. Year ticks at month 12 → 1.
 */
export function advanceSeason(date: GameDate): GameDate {
  // Bootstrap legacy season-only dates with month / phase first.
  const curMonth = date.month ?? firstMonthOfSeason(date.season);
  const curPhase: MonthPhase = date.phase ?? 'upper';

  const phaseIdx = MONTH_PHASES.indexOf(curPhase);
  const nextPhaseIdx = (phaseIdx + 1) % MONTH_PHASES.length;
  const nextPhase = MONTH_PHASES[nextPhaseIdx];

  let nextMonth = curMonth;
  let nextYear = date.year;
  if (nextPhaseIdx === 0) {
    // Wrapped past 下 → next month upper.
    nextMonth = curMonth + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = date.year + 1;
    }
  }

  return {
    year: nextYear,
    month: nextMonth,
    phase: nextPhase,
    season: seasonFromMonth(nextMonth),
  };
}

function indexById<T extends { id: EntityId }>(items: T[]): Record<EntityId, T> {
  const out: Record<EntityId, T> = {};
  for (const item of items) out[item.id] = item;
  return out;
}
