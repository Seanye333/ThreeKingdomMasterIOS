import type {
  Appointment,
  Building,
  City,
  ClanStanding,
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
  PopupEvent,
  ProvinceId,
  Scenario,
  SeasonReport,
  ShipBuildOrder,
  TacticalBattle,
  TradeRoute,
  TribeState,
} from '../types';
import type { OathBond } from '../data/bonds';
import { MONTH_PHASES, firstMonthOfSeason, seasonFromMonth, pairKey } from '../types';
import type { Relation } from '../types/diplomacy';
import { generateFictionalOfficer } from '../systems/officerGen';
import type { MonthPhase } from '../types';
import { createInitialTribeState } from '../systems/tribes';
import { rollWeather, type Weather } from '../systems/weather';
import { createInitialMandate, type MandateState } from '../systems/mandate';
import { ITEMS } from '../data/items';
import { STARTER_RECIPE_IDS } from '../systems/forging';
import { buildInitialPorts } from '../data/ports';
import { buildInitialForts } from '../data/forts';
import { distinctForceColors } from '../data/forceColors';
import { buildInitialSites } from '../data/sites';
import { FAMILY_LINEAGE } from '../data/familyLineage';
import { deriveInitialClanStandings } from '../systems/clans';
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
  /** 遷都 — true once the player has used their one free capital relocation this
   *  game; subsequent 遷都 cost gold. Reset on every new game. */
  capitalMoveUsed?: boolean;
  /** 流民 — realm-wide pool of displaced people, carried between seasons. Famine
   *  and unrest feed it; welcoming cities resettle a share each season. */
  refugees?: number;
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
  /** 慶典彈窗佇列 — celebratory image/video popups waiting to be shown (city
   *  tier-ups, capital moves, great works…). Shown one at a time; not persisted. */
  popupQueue: PopupEvent[];
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
  /** 聯姻同盟 — binding marriage alliances the player has sealed. */
  marriageAlliances: import('../types/diplomacy').MarriageAlliance[];
  /** Pairwise officer rapport (好感, −100..100) — positive grown via social
   *  actions/co-service, negative accrued from friction (嫌隙) and 離間計. */
  rapport: Record<string, number>;
  /** 君臣好感 — each officer's feeling toward their CURRENT lord (−100..100).
   *  Keyed by officerId (follows whoever they serve). High → 心腹 (defection-proof,
   *  pre-warns of plots); low/negative → feeds ambition, eases enemy 策反. */
  lordRapport: Record<EntityId, number>;
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
  /** 家門聲望 — accrued clan standing keyed by clan id (curated id or an
   *  emergent `house-<founderId>`). Recomputed yearly. See systems/clans.ts. */
  clanStandings: Record<string, ClanStanding>;
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
  /** 精煉 — per-item refinement level (+0…REFINE_MAX). Keyed by itemId since
   *  every item is globally unique. Absent/0 = unrefined. */
  itemRefinements: Record<EntityId, number>;
  /** 突破 — per-item breakthrough stars (★0…BREAKTHROUGH_MAX), beyond full 精煉. */
  itemBreakthroughs: Record<EntityId, number>;
  /** 鑲嵌 — per-item socketed gem ids (length ≤ socketsFor(item)). */
  itemGems: Record<EntityId, string[]>;
  /** 名器威名 — per-item accumulated battle-renown (人器合一). Grows as the item is
   *  carried through battle; lifts its effects + eases 兵器駕馭. Absent/0 = unblooded. */
  itemLore: Record<EntityId, number>;
  /** 寶石庫存 — gems on hand (from 熔毀 drops etc.); socketing spends these
   *  before buying with gold. Keyed by gem id → count. */
  gemStock: Record<EntityId, number>;
  /** 鑄法圖譜 — forging recipes the player has learned. Basic (lv≤1) designs are
   *  seeded at game start; 神兵 blueprints are discovered via 研發 at a foundry
   *  staffed by an 巧思 tinkerer. A recipe absent here cannot be forged. */
  knownRecipes: EntityId[];
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
  /** 禁運 — standing 專營 embargoes a monopolist force has imposed on rivals,
   *  cutting them off a strategic good. Empty/undefined = free trade. */
  embargoes?: import('../data/specialties').Embargo[];
  /** 度支沿革 — the player realm's treasury gold at each season-end, newest
   *  last, capped at 8. Powers the 度支簿 trend sparkline. */
  treasuryHistory?: number[];
  /** 募捐冷卻 — absolute season index (year×4 + seasonOrder) of the last 劝募
   *  appeal. Donations may only be solicited once a year (4 seasons). */
  lastDonationAt?: number;
  /** 富商借餉 — an outstanding merchant war-loan: `owed` is the gold still to
   *  repay (principal + baked-in interest), `perSeason` the fixed amount auto-
   *  drawn from the capital each season until cleared. null/absent = no debt;
   *  a new loan can't be taken while one is outstanding. */
  merchantLoan?: { owed: number; perSeason: number } | null;
  /** 輜重 — supply convoys (運糧/運金車) crawling between your cities. */
  convoys: Record<EntityId, import('../systems/convoy').Convoy>;
  /** 主動劫糧 — raiding columns (遊騎) sent out to run down a spotted enemy supply
   *  convoy; they intercept after a season, then ride home (the 烏巢 move). */
  raids: Record<EntityId, import('../systems/convoy').ConvoyRaid>;
  /** 游历 — lone officers roaming abroad (探索/出使/策反/刺探), in transit. */
  expeditions: Record<EntityId, import('../types').Expedition>;
  /** 絲路通商 — distant realms a 遠使 embassy has opened (realmId → frontier
   *  cityId). Each opened realm pays seasonal trade gold to its city. */
  openedRealms: Record<string, EntityId>;
  /** 遠邦關係 — standing with each distant realm (realmId → 0–100), built by
   *  repeated embassies. Higher = safer journeys, richer rewards, and the
   *  realm more likely to send a tribute envoy of its own (反向來使). */
  realmRelations: Record<string, number>;
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
  /** 武將壽命 — old-age / lifespan death rule.
   *  'historical' (default): officers die clustered around their 史實 death
   *    year; fictional officers (no deathYear) die from age 60+.
   *  'fictionalImmortal': fictional / self-created officers never die of old
   *    age; historical officers still pass at their appointed year.
   *  'immortal': no officer ever dies of old age. */
  lifespanMode: 'historical' | 'fictionalImmortal' | 'immortal';
  /** 不會戰死 — when true, officers are never KILLED in battle (single combat,
   *  瀕死 wounds, tactical defeat). They are wounded or captured instead. */
  noBattleDeath: boolean;
  /** 起死回生 — when true, dead officers (including those who fell before the
   *  campaign began) may return to life over the years as free agents. */
  reviveDeadOfficers: boolean;
  /** AI 強度 — how hard the AI plays, independent of `difficulty` (which mainly
   *  handicaps starting troops). 1 = 保守/弱, 3 = 普通, 5 = 狂攻/強. Scales the
   *  strategic attack appetite and tactical-battle skill. Default 3. */
  aiStrength: number;
  /** 起始國力 — player's starting-resource补正 (gold/food/troops multiplier),
   *  independent of difficulty. 'weak' = 劣勢(×0.7), 'even' = 均衡(×1),
   *  'strong' = 優勢(×1.4). Applied once at scenario load. Default 'even'. */
  startHandicap: 'weak' | 'even' | 'strong';
  /** 勝利條件 — the campaign's win goal. 'free' (default) ends on ANY of the
   *  nine endings; the others end the game ONLY on the chosen path (plus
   *  defeat always applies). */
  victoryGoal: 'free' | 'unify' | 'hegemon' | 'tripartite';
  /** 起始稅率 — the player force's tax rate at scenario start (a tradeoff
   *  preset, still changeable in-game). Default 'normal'. */
  startTaxRate: 'light' | 'normal' | 'heavy';
  /** 起始通脹 — the player's starting 通貨膨脹 level (0–100; saps tax income).
   *  A starting economic headwind that decays over time. Default 0. */
  startInflation: number;
  /** AI 兵力補正 — AI forces' starting-troops multiplier, layered ON TOP of the
   *  difficulty troop handicap so it can be tuned independently. 'fewer' ×0.8,
   *  'even' ×1, 'more' ×1.2. Default 'even'. */
  aiStartTroops: 'fewer' | 'even' | 'more';
  /** 戰鬥難度 — tactical-AI competence baseline, decoupled from campaign
   *  `difficulty`. null = follow the campaign difficulty. */
  battleDifficulty: 'easy' | 'normal' | 'hard' | null;
  /** 武將壽命長短 — multiplier on old-age death chance, layered on top of
   *  `lifespanMode`. 'short' = die sooner, 'long' = live longer. Default
   *  'historical' (×1). */
  lifespanLength: 'short' | 'historical' | 'long';
  /** 變老不影響屬性 — when true, the §2.4 age-driven stat drift is disabled:
   *  no 遲暮 武力/統率 decline AND no 智政晚成 智力/政治 growth. Officers still
   *  age, gain/shed traits, and die — only their five 圍 are frozen vs age.
   *  Default false. */
  agingStatLock: boolean;
  /** 在野登場 — how readily 搜索人才 turns up hidden officers. 'scarce' ×0.6,
   *  'normal', 'plentiful' ×1.4 on the search success chance. Default 'normal'. */
  talentDiscovery: 'scarce' | 'normal' | 'plentiful';
  /** 單挑頻率 — multiplier on the field-duel trigger (base 12% when both
   *  commanders 武≥80). 'rare' ×0.5, 'normal', 'frequent' ×2. Default 'normal'. */
  duelFrequency: 'rare' | 'normal' | 'frequent';
  /** 天災頻率 — multiplier on famine/plague/flood event chances. 'low' ×0.5,
   *  'normal', 'high' ×1.7. Default 'normal'. */
  disasterFrequency: 'low' | 'normal' | 'high';
  /** 鐵人模式 — when true, manual save is disabled (only the per-season
   *  autosave remains), discouraging save-scumming. Default false. */
  ironman: boolean;
  /** 新武將登場 — how often brand-new FICTIONAL officers enter the world as
   *  free agents over time. 'off' (default) / 'rare' / 'normal' / 'common'. */
  newOfficers: 'off' | 'rare' | 'normal' | 'common';
  /** 虛構人才庫 — a batch of generated fictional officers seeded into the
   *  initial 在野 pool at scenario start. 'off' (default) / 'some' (20) /
   *  'many' (50). For an ahistorical opening. */
  fictionalPool: 'off' | 'some' | 'many';
  /** 初始外交 — opening relations between forces. 'neutral' (default, all free
   *  to war) / 'warring' (亂世死敵 — negative scores, AI shuns pacts) /
   *  'coalitions' (群雄結盟 — AI forces sprinkle non-aggression blocs). */
  initialDiplomacy: 'neutral' | 'warring' | 'coalitions';
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
  popupQueue: [],
  cityEventMarks: [],
  victoryStatus: 'playing',
  difficulty: 'normal',
  activeChallenge: null,
  challengeRecords: {},
  diplomacy: { relations: {} },
  runtimeBonds: [],
    marriageAlliances: [],
  rapport: {},
  lordRapport: {},
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
  clanStandings: {},
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
  itemRefinements: {},
  itemBreakthroughs: {},
  itemGems: {},
  itemLore: {},
  gemStock: {},
  knownRecipes: STARTER_RECIPE_IDS.slice(),
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
  treasuryHistory: [],
  convoys: {},
  raids: {},
  expeditions: {},
  openedRealms: {},
  realmRelations: {},
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
  lifespanMode: 'historical',
  noBattleDeath: false,
  reviveDeadOfficers: false,
  aiStrength: 3,
  startHandicap: 'even',
  victoryGoal: 'free',
  startTaxRate: 'normal',
  startInflation: 0,
  aiStartTroops: 'even',
  battleDifficulty: null,
  lifespanLength: 'historical',
  agingStatLock: false,
  talentDiscovery: 'normal',
  duelFrequency: 'normal',
  disasterFrequency: 'normal',
  ironman: false,
  newOfficers: 'off',
  fictionalPool: 'off',
  initialDiplomacy: 'neutral',
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
  capitalOverride?: EntityId,
): GameState {
  // 開局治所 — honour a player-chosen starting capital, but only if it's a city
  // the player force actually owns. Otherwise fall back to the scenario default.
  const playerForce = scenario.forces.find((f) => f.id === playerForceId);
  const validOverride =
    capitalOverride &&
    scenario.cities.some((c) => c.id === capitalOverride && c.ownerForceId === playerForceId)
      ? capitalOverride
      : null;
  const playerCapitalId = validOverride ?? playerForce?.capitalCityId ?? null;
  const playerTroopMul = difficulty === 'easy' ? 1.2 : 1.0;
  // AI 兵力補正 — independent multiplier layered on the difficulty handicap.
  const aiTroopBonusMul =
    state.aiStartTroops === 'fewer' ? 0.8 :
    state.aiStartTroops === 'more' ? 1.2 : 1.0;
  const aiTroopMul = (difficulty === 'hard' ? 1.2 : 1.0) * aiTroopBonusMul;
  // 起始國力補正 — player's starting gold/food/troops, layered on top of the
  // difficulty troop handicap. Independent so a player can pick e.g. 普通難度
  // but an underdog start.
  const handicapMul =
    state.startHandicap === 'weak' ? 0.7 :
    state.startHandicap === 'strong' ? 1.4 : 1.0;

  const capitalIds = new Set(scenario.forces.map((f) => f.capitalCityId));
  if (validOverride) capitalIds.add(validOverride);
  const scaledCities: City[] = scenario.cities.map((c) => {
    const isPlayer = c.ownerForceId === playerForceId;
    const isAI = c.ownerForceId !== null && c.ownerForceId !== playerForceId;
    const mul = isPlayer ? playerTroopMul : isAI ? aiTroopMul : 1.0;
    // Auto-tier walls: capital + cities ≥ 200k pop are tier 3, pop ≥ 100k tier 2.
    const wallTier: 1 | 2 | 3 =
      capitalIds.has(c.id) || c.population >= 200_000 ? 3 :
      c.population >= 100_000 ? 2 : 1;
    let base = mul === 1.0 ? c : { ...c, troops: Math.floor(c.troops * mul) };
    // Player-only starting-resource補正 (gold/food/troops).
    if (isPlayer && handicapMul !== 1.0) {
      base = {
        ...base,
        troops: Math.floor(base.troops * handicapMul),
        gold: Math.floor(base.gold * handicapMul),
        food: Math.floor(base.food * handicapMul),
      };
    }
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

  // 虛構人才庫 — seed a batch of generated fictional officers into the rootless
  // 在野 pool for an ahistorical opening.
  if (state.fictionalPool && state.fictionalPool !== 'off') {
    const count = state.fictionalPool === 'many' ? 50 : 20;
    const ids = new Set(officers.map((o) => o.id));
    const extras = [];
    for (let i = 0; i < count; i++) {
      const o = generateFictionalOfficer(scenario.startDate.year, Math.random, ids);
      ids.add(o.id);
      extras.push(o);
    }
    officers = [...officers, ...extras];
  }

  // 初始外交 — opening relations between forces.
  const initialRelations: Record<string, Relation> = {};
  const rel = (a: EntityId, b: EntityId, score: number, status: Relation['status']): void => {
    initialRelations[pairKey(a, b)] = { forceA: a < b ? a : b, forceB: a < b ? b : a, score, status };
  };
  const allForceIds = scenario.forces.map((f) => f.id);
  if (state.initialDiplomacy === 'warring') {
    // 亂世死敵 — every pair starts soured; the AI shuns NAPs/marriages.
    for (let i = 0; i < allForceIds.length; i++)
      for (let j = i + 1; j < allForceIds.length; j++)
        rel(allForceIds[i], allForceIds[j], -50, 'neutral');
  } else if (state.initialDiplomacy === 'coalitions') {
    // 群雄結盟 — AI forces sprinkle non-aggression blocs (player excluded, so
    // the human faces coalitions rather than a free-for-all).
    const aiIds = allForceIds.filter((id) => id !== playerForceId);
    for (let i = 0; i < aiIds.length; i++)
      for (let j = i + 1; j < aiIds.length; j++)
        if (Math.random() < 0.4) rel(aiIds[i], aiIds[j], 65, 'non-aggression');
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
    selectedCityId: playerCapitalId,
    capitalMoveUsed: false, // 首次遷都免費 — fresh game grants one free 遷都
    refugees: 0, // 流民 — fresh game starts with no displaced pool
    cities: indexById(scaledCities),
    forces: indexById(
      distinctForceColors(
        scenario.forces.map((f) => ({
          ...f,
          isPlayer: f.id === playerForceId,
          // Apply the player's chosen starting capital, if any.
          capitalCityId: f.id === playerForceId && validOverride ? validOverride : f.capitalCityId,
        })),
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
    popupQueue: [],
  cityEventMarks: [],
    victoryStatus: 'playing',
    activeChallenge: null,
    // Challenge records are meta-progression — carry across games.
    challengeRecords: state.challengeRecords ?? {},
    diplomacy: { relations: initialRelations },
    runtimeBonds: [],
    marriageAlliances: [],
    rapport: {},
    lordRapport: {},
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
    // 家門聲望 — seed each clan house's standing from its starting members.
    clanStandings: deriveInitialClanStandings(
      Object.fromEntries(officers.map((o) => [o.id, o])),
    ),
    officerWishes: [],
  pendingWishEntries: [],
    endingsAchieved: state.endingsAchieved,
    hotSeatPlayers: state.hotSeatPlayers,
    hotSeatActiveIndex: 0,
    tutorialStep: null,
    musicTrack: state.musicTrack,
    lostItems: computeLostItems(officers, scaledCities, state.placementMode),
    itemRefinements: {},
  itemBreakthroughs: {},
  itemGems: {},
  itemLore: {},
  gemStock: {},
    knownRecipes: STARTER_RECIPE_IDS.slice(),
    itemHistory: [],
    battleReplays: [],
    duelHall: [],
    warRatings: {},
    clearedDuelScenarios: [],
  currentBattleSnapshots: [],
    deeds: {},
    fogOfWar: state.fogOfWar,
    // 起始稅率 — seed the player force's tax rate from the start setting.
    taxPolicy: (state.startTaxRate && state.startTaxRate !== 'normal')
      ? { [playerForceId]: state.startTaxRate }
      : {},
    credibility: state.credibility ?? {},
    grudges: state.grudges ?? {},
    tradePartners: state.tradePartners ?? [],
    inflation: state.startInflation ?? 0,
    merchantLoan: null,
    convoys: state.convoys ?? {},
    raids: state.raids ?? {},
    expeditions: state.expeditions ?? {},
    openedRealms: state.openedRealms ?? {},
    realmRelations: state.realmRelations ?? {},
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
    lifespanMode: state.lifespanMode ?? 'historical',
    noBattleDeath: state.noBattleDeath ?? false,
    reviveDeadOfficers: state.reviveDeadOfficers ?? false,
    aiStrength: state.aiStrength ?? 3,
    startHandicap: state.startHandicap ?? 'even',
    victoryGoal: state.victoryGoal ?? 'free',
    startTaxRate: state.startTaxRate ?? 'normal',
    startInflation: state.startInflation ?? 0,
    aiStartTroops: state.aiStartTroops ?? 'even',
    battleDifficulty: state.battleDifficulty ?? null,
    lifespanLength: state.lifespanLength ?? 'historical',
    agingStatLock: state.agingStatLock ?? false,
    talentDiscovery: state.talentDiscovery ?? 'normal',
    duelFrequency: state.duelFrequency ?? 'normal',
    disasterFrequency: state.disasterFrequency ?? 'normal',
    ironman: state.ironman ?? false,
    newOfficers: state.newOfficers ?? 'off',
    fictionalPool: state.fictionalPool ?? 'off',
    initialDiplomacy: state.initialDiplomacy ?? 'neutral',
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
    // 鍛造專屬名品永不散落 —— 只能在鐵工坊鍛出,撿不到。
    if (item.forgeOnly) continue;
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
