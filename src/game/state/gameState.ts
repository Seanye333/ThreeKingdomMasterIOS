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
import { FAMILY_LINEAGE } from '../data/familyLineage';
import { buildHistoricalOfficers } from '../data/officers';
import { bestPrestige } from '../data/prestige';
import type { Dynasty } from '../data/dynasties';

export type VictoryStatus = 'playing' | 'victory' | 'defeat' | 'observing';
export type Difficulty = 'easy' | 'normal' | 'hard';

/** Reasons a game has been won. */
export type EndingKind =
  | 'unify'             // 統一 — control every city
  | 'restore-han'       // 漢室再興 — playing as a Liu, hold Luoyang + Chang'an + Xuchang
  | 'tripartite'        // 三国鼎立 — three kingdoms balanced (each holds 1/3+)
  | 'recluse'           // 隐士退隐 — small force, high loyalty, after year 220
  | 'emperor'           // 即位 — enthronement issued and held for 5 years
  | 'defeat';           // lost

/** A historical event that has fired this session and is awaiting acknowledgement. */
export interface PendingEvent {
  event: HistoricalEvent;
  year: number;
  season: GameDate['season'];
}

export interface GameState {
  date: GameDate;
  scenarioId: EntityId | null;
  playerForceId: EntityId | null;
  selectedCityId: EntityId | null;
  /** Selected in-transit army (for map highlight), or null. */
  selectedArmyId: EntityId | null;
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  pendingCommands: Record<EntityId, Command>;
  /** In-flight academy training tasks. Each entry ticks down each season
   *  and on completion adds a new policy to the officer. */
  pendingTrainings: Array<import('../systems/training').PendingTraining>;
  lastReport: SeasonReport | null;
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
  /** Active tactical battle screen, if any. */
  tacticalBattle: TacticalBattle | null;
  /** Pending espionage ops queued for next season's resolution. */
  pendingEspionage: EspionageOp[];
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
  /** Heroic deeds tracker keyed by officer id. */
  deeds: Record<EntityId, import('../types').HeroicDeeds>;
  /** Fog of war on (player-only flag, cosmetic). */
  fogOfWar: boolean;
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
  fieldBattleMarks: Array<{ x: number; y: number; kind: 'ambush' | 'camp' | 'clash'; seasonsLeft: number }>;
  /** Player-involved field clashes the AI forced this season (AI 亲征),
   *  awaiting interactive tactical resolution after the season report. */
  pendingFieldBattleQueue: Array<{ playerArmyId: EntityId; enemyArmyId: EntityId }>;
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
  cities: {},
  forces: {},
  officers: {},
  pendingCommands: {},
  pendingTrainings: [],
  lastReport: null,
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
  tacticalBattle: null,
  pendingEspionage: [],
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
  deeds: {},
  fogOfWar: false,
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
  seasonBattleDeltas: {},
  weather: { kind: 'clear', wind: 'calm', windPower: 1 },
  courtFactions: {},
  burningCities: [],
  fieldBattleMarks: [],
  pendingFieldBattleQueue: [],
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
      scenario.forces.map((f) => ({ ...f, isPlayer: f.id === playerForceId })),
    ),
    // Seed each officer's cached 威名 title from innate stats so the first
    // season doesn't announce prestige for the entire famous roster at once —
    // only genuine in-play rises fire a notice thereafter.
    officers: indexById(officers.map((o) => ({ ...o, prestigeTitleId: bestPrestige(o)?.id }))),
    pendingCommands: {},
    pendingTrainings: [],
    lastReport: null,
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
    customEvents: state.customEvents ?? [],
    pendingEvent: null,
    tacticalBattle: null,
    pendingEspionage: [],
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
    deeds: {},
    fogOfWar: state.fogOfWar,
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
    seasonBattleDeltas: {},
    weather: rollWeather(scenario.startDate.season, Math.random),
    courtFactions: {},
    burningCities: [],
    fieldBattleMarks: [],
    pendingFieldBattleQueue: [],
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
