import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from './idbStorage';
import type {
  Building,
  BuildingId,
  City,
  CivicTitleId,
  Command,
  EdictKind,
  EntityId,
  EspionageKind,
  ExpeditionMode,
  HistoricalEvent,
  ImperialRank,
  InternalAffairsType,
  MarchCommand,
  MilitaryRankId,
  Officer,
  PeerageId,
  ProvinceId,
  ReportEntryKind,
  Scenario,
  ShipClass,
  TacticalBattle,
} from '../types';
import { isHostilePermitted } from '../types';
import { createDeeds } from '../types/deeds';
import { grantDeedTitles } from '../systems/deedTitles';
import { pushBoutRecord } from '../systems/duelHall';
import { applyBout } from '../systems/warRanking';
import { tickAfflictions, withAffliction, type Affliction } from '../systems/afflictions';
import { routConsequence, type RoutConsequence } from '../systems/wordWar';
import { canAppraise, appraisalVerdict, appraisalRenownGain, discernment, isLegendaryCritic, legendaryVerdict, appraisalMisread, pickMonthlyAppraisal } from '../systems/appraisal';
import { executionRenownCost, markSlainVendetta } from '../systems/captiveFate';
import { trainKey, recordTrain } from '../systems/sparLimit';
import type { Difficulty } from './gameState';
import { CIVIC_TITLES_BY_ID, MILITARY_RANKS_BY_ID } from '../data/titles';
import { PEERAGES_BY_ID, meritScore, peerageTier } from '../data/peerage';
import { HONORIFICS_BY_ID, honorificTier } from '../data/honorifics';
import { stanceRecruitModifier, deriveInitialClanStandings, tickClanStandings, clanPrestigeBonus } from '../systems/clans';
import { statecraftRecruitBonus } from '../systems/statecraft';
import { holdFounding } from '../systems/founding';
import { allianceBetween, breakAlliance as breakMarriageTie, tickMarriageAlliances } from '../systems/marriageAlliance';
import { FORGE_RECIPES_BY_ID } from '../data/forging';
import { STARTER_RECIPE_IDS, forgeQualityPlus, discoverableRecipe, dismantleYield } from '../systems/forging';
import { assignAiGear } from '../systems/aiGear';
import { planAiForging } from '../systems/aiForge';
import { EDICTS_BY_KIND, IMPERIAL_RANKS_BY_ID } from '../data/imperial';
import { ESPIONAGE_DEFS_BY_KIND } from '../data/espionage';
import { ITEMS_BY_ID, refineCost, REFINE_MAX, setRefineRegistry, itemRarity,
  BREAKTHROUGH_MAX, breakthroughCost as itemBreakthroughCost, socketsFor, GEMS_BY_ID,
  GEM_FUSION, GEM_FUSION_COST, setBreakthroughRegistry, setGemRegistry, setLoreRegistry, accrueWeaponLore,
  itemGrowthGoldSpent } from '../data/items';
import { SKILLS_BY_ID } from '../data/skills';
import { marchDurationFor } from '../data/cities';
import { terrainRoute, positionAlongRoute, marchDestCoords } from '../data/territories';
import { cityPos, CITY_GEO_OVERRIDES } from '../data/cityGeo';
import { provisionNeeded, convoyCapacity, planConvoy } from '../systems/convoy';
import { citySize, citySizeRank, cityMeetsSize, reassignLostCapitals, LOST_CAPITAL_LOYALTY_PENALTY } from '../systems/citySize';
import { buildingBonuses, SCHOOL_BUILDINGS } from '../systems/buildings';
import { BUILDING_CATEGORY, BUILDING_PREREQ, BUILDING_MIN_SIZE } from '../data/buildings';
import {
  cityAffinity, CITY_SPECIALTY, citySpecialty, ROLE_ZH,
  specialtyControl, specialtyRealmEffects, embargoedRolesAgainst, canEmbargo,
  SPECIALTY_DEV_MAX, SPECIALTY_DEV_GAIN,
  type SpecialtyControl, type SpecialtyRealmEffects, type Embargo, type SpecialtyRole,
} from '../data/specialties';
import { expeditionLegSeasons } from '../systems/expedition';
import { getEmbassyTarget, embassyLegSeasons, realmTradeIncome } from '../systems/foreignRealm';
import { FOREIGN_REALMS_BY_ID } from '../data/foreignRealms';
import { terrainTypeAt, isRiverside, WORLD_SCALE } from '../data/geography';
import { FAMILY_LINEAGE } from '../data/familyLineage';
import { POLICY_DEFS, TACTIC_DEFS } from '../data/officerAttributes';
import {
  applyEventEffects,
  findFiringEvent,
  findFiringEventIn,
} from '../systems/historicalEvents';
import { resolveEspionage } from '../systems/espionage';
import { tickEmbeddedSpies, PLANT_SPY_COST } from '../systems/spies';
import {
  resolveTribeRaids,
  canCampaignTribe,
  resolveTribePunitive,
  tickTribeMercenaries,
  TRIBE_PLACATE_COST,
  TRIBE_PLACATE_AGGRESSION_DROP,
} from '../systems/tribes';
import { TRIBES_BY_ID } from '../data/tribes';
import { addRapport, mingleRapport, getRapport, growRapportFromProximity, decayRapport, addLordRapport, decayLordRapport, getLordRapport } from '../systems/rapport';
import { growFrictionFromProximity, reconcilePair } from '../systems/friction';
import { pairKey, getRelation } from '../types/diplomacy';
import { OATH_BONDS } from '../data';
import { planAITurn } from '../systems/ai';
import { planAIAppointments } from '../systems/aiAppointments';
import { planAICourt } from '../systems/aiCourt';
import { rollFactionEvents } from '../systems/factionEvents';
import { rollBehaviorEvent } from '../systems/behaviorEvents';
import { rollAIWishFlavor } from '../systems/aiWishesFlavor';
import { appointmentBonusFor, pruneStaleAppointments, traitRefusal, isOnCooldown } from '../systems/appointmentEffects';
import { canPromoteToRank } from '../systems/imperialEffects';
import { COMMAND_DEFS } from '../systems/commands';
import { planMassMuster } from '../systems/muster';
import { planGovernorCommand } from '../systems/governor';
import { planLegionOrders, type Legion } from '../systems/legion';
import { buyQuote, sellQuote, borderTariff, buyHorses, sellHorses, WARHORSE_CITY_CAP, buyIron, sellIron, IRON_CITY_CAP, MEDICINE_CITY_CAP, IRON_FORGE_COST, FORGE_IRON_DISCOUNT } from '../systems/market';
import { EDICT_DISCOUNT, EMPEROR_HOME, MANDATE_PER_SEASON, RESENTMENT_PER_SEASON, canWelcomeEmperor, emperorCustodian } from '../systems/emperor';
import { commonerArrivalCity, generateCommonerOfficer, lordTalentDraw, commonerArrivalChance } from '../systems/commonerTalent';
import { rollRecommendations } from '../systems/recommendation';
import { codexMarkRecruited, codexMarkRecruitedMany, codexMarkSeen, codexMarkSlain } from '../systems/codex';
import { itemCodexMarkCarried } from '../systems/itemCodex';
import { recordDailyResult } from '../systems/dailyChallenge';
import { SCHEME_DEFS, schemeOdds, validateScheme, type SchemeId } from '../systems/schemes';
import { resolveAISchemes } from '../systems/aiSchemes';
import { appendPowerHistory, takePowerSnapshot } from '../systems/powerHistory';
import { pickAdvisor } from '../systems/advisor';
import { canTrain, trainingCost, tickTrainings, trainingDurationSeasons, sweepStaleTrainings, mentorDurationSeasons, isParentMentor, canTrainTactic, tacticTrainingCost, tacticDurationSeasons, tacticMentorDurationSeasons } from '../systems/training';
import { loyaltyDriftPerSeason, rollFlavorEvent, defectionChance, sharedBondableTrait, maritalCompatibility, itemResonanceCandidate, policyResonanceCandidate, rollMarriageAssimilation, itemTacticCandidate, deedTraitCandidate, isIncapacitated } from '../systems/traitEffects';
import { loyaltyFloor, rollMentorPolicyTransfer, mentorsOf, deepenBonds, camaraderieLoyaltyDelta } from '../systems/relationshipEffects';
import { TRAIT_DEFS_BY_ID } from '../data/personality';
import {
  ALLIANCE_PROPOSAL_COST,
  NAP_PROPOSAL_COST,
  breakAlliance,
  computeTotalTroops,
  payTribute,
  proposeAlliance,
  proposeHostage,
  proposeNonAggression,
} from '../systems/diplomacy';
import {
  applyExecute,
  applyRelease,
  attemptFreeAgentRecruit,
  attemptRecruit,
  estimateRecruitChance,
  recruitCostFor,
  giftRecruitValue,
} from '../systems/officerFate';
import { resolveSeason } from '../systems/resolution';

/** Total buildings per category (computed once) — for "complete a 群" achievements. */
const CATEGORY_TOTAL: Record<string, number> = (() => {
  const t: Record<string, number> = {};
  for (const id of Object.keys(BUILDING_CATEGORY) as Array<keyof typeof BUILDING_CATEGORY>) {
    const c = BUILDING_CATEGORY[id];
    t[c] = (t[c] ?? 0) + 1;
  }
  return t;
})();

/**
 * 建築成就 — scan the player's completed buildings each season and fire the
 * milestone achievements (first build, a full 經濟/軍務 群, a 30-building 巨城,
 * an all-category city). Uses synthetic fire-event triggers; already-unlocked
 * ones no-op. Returns newly unlocked ids.
 */
function checkBuildingAchievements(
  buildings: Building[],
  cities: Record<string, City>,
  playerForceId: string | null,
): string[] {
  if (!playerForceId) return [];
  const mine = new Set(
    Object.values(cities).filter((c) => c.ownerForceId === playerForceId).map((c) => c.id),
  );
  const perCity = new Map<string, { total: number; cat: Record<string, number> }>();
  let anyBuilt = false;
  for (const b of buildings) {
    if (b.level < 1 || !mine.has(b.cityId)) continue;
    anyBuilt = true;
    const e = perCity.get(b.cityId) ?? { total: 0, cat: {} };
    e.total += 1;
    const c = BUILDING_CATEGORY[b.id];
    if (c) e.cat[c] = (e.cat[c] ?? 0) + 1;
    perCity.set(b.cityId, e);
  }
  const fire = new Set<string>();
  if (anyBuilt) fire.add('evt-build-first');
  for (const e of perCity.values()) {
    if (e.total >= 30) fire.add('evt-grand-city');
    if ((e.cat.economy ?? 0) >= CATEGORY_TOTAL.economy) fire.add('evt-economy-hub');
    if ((e.cat.military ?? 0) >= CATEGORY_TOTAL.military) fire.add('evt-military-fortress');
    if (Object.keys(CATEGORY_TOTAL).every((cat) => (e.cat[cat] ?? 0) >= 1)) fire.add('evt-all-rounder');
  }
  if (fire.size === 0) return [];
  let ach = loadAchievementProgress();
  const newly: string[] = [];
  for (const id of fire) {
    const r = processTrigger(ach, { kind: 'fire-event', targetId: id });
    ach = r.progress;
    newly.push(...r.newlyUnlocked);
  }
  if (newly.length > 0) saveAchievementProgress(ach);
  return newly;
}

/** Highest rapport between an officer and anyone serving the player —
 *  the 以情動人 lever (old friends across the lines). */
function bestRapportWith(state: { officers: Record<string, Officer>; rapport: Record<string, number>; playerForceId: string | null }, officerId: string): number {
  if (!state.playerForceId) return 0;
  let best = 0;
  for (const o of Object.values(state.officers)) {
    if (o.forceId !== state.playerForceId || o.id === officerId) continue;
    const r = getRapport(state.rapport, o.id, officerId);
    if (r > best) best = r;
  }
  return best;
}
import { setupTacticalBattle, inferUnitType, planSiegeRelief, rollTimeOfDay } from '../systems/tactical';
import { BUILDING_DEFS_BY_ID } from '../data/buildings';
import { DEFENSE_BUILDINGS } from '../data/defenseBuildings';
import { SHIP_CLASSES_BY_ID, shipMeetsTier, shipBuildSeasons, portUpgradeCost, SHIP_MIN_TIER, PORT_MAX_NAVAL_TIER } from '../data/ships';
import { canPlayerAttackPort, migratePorts, navalReachableCityIds } from '../data/ports';
import { canPlayerAttackFort, migrateForts } from '../data/forts';
import { canPlayerSeizeSite, migrateSites } from '../data/sites';
import { tickWildSites } from '../systems/sites';
import { SCENIC_BY_ID, canVisitScenic, rollHermitRecruit } from '../data/scenicSites';
import { razedCity, rebuiltCity, rebuildCost, conquestPopulationLoss } from '../systems/cityRuin';
import { buildSpecialtyTradeRoutes, tickSpecialtyTrade, specialtyEntrepotIncome } from '../systems/tradeRoutes';
import { fortMaxHpForLevel, FACILITY_DEFS, type FacilityKind } from '../types';
import { awardBattleXp, grantXp, applyBreakthrough, canBreakthrough, breakthroughCost, breakthroughIronCost, defaultLatent, STAT_CAP } from '../systems/growth';
import type { BreakthroughPath } from '../systems/growth';
import { officerGrade, gradeRank, gradeMeta } from '../systems/officerGrade';
import { tickBuildings } from '../systems/buildings';
import { tickBuildingEvents } from '../systems/buildingEvents';
import { evaluateCoalition } from '../systems/coalition';
import { rollDialogue } from '../systems/dialogueRoll';
import { DIALOGUE_EVENTS_BY_ID } from '../data/dialogues';
import { applyAutoBuild } from '../systems/autoBuild';
import { planAIBuildOrders, planAIFacilities, planAIFortAssaults, planAISiteSeizures, planAIFrontierExploits } from '../systems/aiBuild';
import { SCENARIO_OBJECTIVES } from '../data/objectives';
import { SCENARIOS } from '../data';
import { PROVINCES_BY_ID } from '../data/provinces';
import { findChallenge, evaluateChallenge, challengeStars } from '../data/challenges';
import { MAX_CUSTOM_EVENTS } from '../systems/customEvents';
import { refreshPrestige, prestigeTitleById, TOP_PRESTIGE_IDS } from '../data/prestige';
import { peerageById } from '../data/peerage';
import { careerStanding, careerGuardCapBonus } from '../systems/career';
import { evaluateGoal, findObjectiveFor } from '../systems/objectives';
import { applySuccession } from '../systems/succession';
import {
  bumpCounters,
  checkCumulativeThresholds,
  loadAchievementProgress,
  processTrigger,
  saveAchievementProgress,
} from '../systems/achievements';
import { tickFamily, addSpouse, addParentChild, aiArrangeMarriages } from '../systems/family';
import { clanOf } from '../data/clans';
import { rollWishes, applyWishGrant, applyWishReject, expireWishes, maybeWoundedRetireWish, decayGrievances } from '../systems/wishes';
import { checkEndings } from '../systems/endings';
import { generateRandomScenario } from '../systems/randomScenario';
import { rollWeather, describeWeather } from '../systems/weather';
import { rollPlagueOutbreak, rollIntrigue } from '../systems/intrigue';
import { rollSpecialtyEvents } from '../systems/specialtyEvents';
import { rollOmen } from '../systems/mandate';
import { rollReligiousRebellion, spreadCultUnrest } from '../systems/religion';
import { resolveAIRansoms } from '../systems/aiRansom';
import { resolveAICaptives } from '../systems/aiCaptiveFate';

const SEASON_INDEX: Record<string, number> = {
  spring: 0,
  summer: 1,
  autumn: 2,
  winter: 3,
};
const SEASONS_ORDER: Array<'spring' | 'summer' | 'autumn' | 'winter'> = [
  'spring', 'summer', 'autumn', 'winter',
];

function nextSeasonAfter(
  date: { year: number; season: 'spring' | 'summer' | 'autumn' | 'winter' },
  delta: number,
): { year: number; season: 'spring' | 'summer' | 'autumn' | 'winter' } {
  const abs = date.year * 4 + SEASON_INDEX[date.season] + delta;
  return { year: Math.floor(abs / 4), season: SEASONS_ORDER[abs % 4] };
}
import {
  EMPTY_STATE,
  loadScenario,
  type GameState,
  type VictoryStatus,
} from './gameState';
import { loadFromSlot, saveToSlot, deleteSlot, listSlots } from './saveSlots';

interface GameStore extends GameState {
  /** 演義模擬器 — spectate the AI playing every force from turn one. */
  observeScenario: (scenario: Scenario, difficulty: Difficulty) => void;
  loadScenario: (
    scenario: Scenario,
    playerForceId: EntityId,
    difficulty: Difficulty,
    customOfficer?: {
      id: string;
      name: { zh: string; en: string };
      courtesyName?: { zh: string; en: string };
      stats: import('../types').OfficerStats;
      skills: string[];
      affiliationForceId: EntityId | null;
    },
    /** 開局治所 — optional player-chosen starting capital (must be one of the
     *  player force's cities). Falls back to the scenario's default capital. */
    capitalOverride?: EntityId,
  ) => void;
  /** Start a Hero Mode challenge by id — loads its scenario/force at the
   *  recommended difficulty and arms the pass/fail season-end check. */
  startChallenge: (challengeId: string) => void;
  selectCity: (cityId: EntityId | null) => void;
  /** Open / close the city-interior map for the selected city. */
  openCityMap: () => void;
  closeCityMap: () => void;
  /** 觀戰 — minimize the fullscreen battle to its world-map diorama (or
   *  restore it). The battle keeps running headless while minimized. */
  setBattleViewMinimized: (minimized: boolean) => void;
  /** 戰鬥運鏡/特效 — the headless AI driver pushes the tactics it cast this turn
   *  so the big-map diorama can play the same FX/sound/shake. Keyed for dedup. */
  pushBattleFx: (events: NonNullable<GameState['battleFxBatch']>['events']) => void;
  /** 戰略層回饋 — flash a transient confirmation toast in the strategic HUD. */
  notify: (zh: string, en: string, tone?: 'ok' | 'warn') => void;
  selectArmy: (armyId: EntityId | null) => void;
  redirectArmy: (armyId: EntityId, newTargetId: EntityId) => boolean;
  holdArmy: (armyId: EntityId) => boolean;
  /** 補給野戰軍 — rush provisions from the nearest stocked friendly city to a
   *  field army, topping up its baggage so it doesn't starve in the field. */
  resupplyArmy: (armyId: EntityId) => { ok: boolean; sent: number };
  moveArmyToCell: (armyId: EntityId, x: number, y: number) => boolean;
  /** Merge the source army into the destination army (both must be the
   *  player's and close enough to rendezvous). Returns false if not allowed. */
  mergeArmyInto: (sourceArmyId: EntityId, destArmyId: EntityId) => boolean;
  /** Split a detachment off an army under one of its companion officers;
   *  the detachment garrisons the army's current cell so it can be redirected.
   *  Returns the new army id (= detach officer id) or null if not allowed. */
  splitArmy: (armyId: EntityId, detachOfficerId?: EntityId) => EntityId | null;
  issueCommand: (
    cityId: EntityId,
    type: InternalAffairsType,
    officerId: EntityId,
    /** 協同施政 — up to 2 assistant officers (paid once, diminishing boost). */
    assistantOfficerIds?: EntityId[],
  ) => { ok: boolean; reason?: string };
  issueMarch: (
    sourceId: EntityId,
    targetId: EntityId,
    officerId: EntityId,
    troops: number,
    additionalOfficerIds?: EntityId[],
  ) => { ok: boolean; reason?: string };
  /** 一鍵委派 — auto-assign every idle officer in a self-run city a sensible
   *  internal-affairs task (by city need × aptitude). Returns how many were
   *  dispatched and the gold spent. */
  autoAssignIdle: () => { assigned: number; goldSpent: number };
  /** 大局計略 — 驅虎吞狼 / 二虎競食 / 遠交近攻. */
  executeScheme: (schemeId: SchemeId, targetA: EntityId, targetB?: EntityId)
    => { ok: boolean; message: string };
  /** 每日挑戰 — mark the current run as today's challenge / apply the
   *  poverty handicap (half gold in every player city). */
  startDailyChallenge: (dateStr: string) => void;
  applyPovertyHandicap: () => void;
  /** 奉迎天子 — move the emperor from a held city into your capital. */
  welcomeEmperor: () => { ok: boolean; reason?: string };
  /** 市易 — convert gold↔food at the city's current market rate. */
  tradeFood: (cityId: EntityId, kind: 'buy' | 'sell', amount: number) => { ok: boolean; got: number };
  /** 榷場 — cross-border grain trade with a neighbouring force you are at peace
   *  with (allied / non-aggression). Priced by THEIR city's conditions so you can
   *  arbitrage cross-border price gaps; a 榷場 tariff (eased by 市舶司) applies, and
   *  the resources move between the two cities' treasuries. `kind` is from the
   *  player's side: 'buy' = buy their grain for gold, 'sell' = sell them grain. */
  borderTrade: (
    myCityId: EntityId,
    theirCityId: EntityId,
    kind: 'buy' | 'sell',
    amount: number,
  ) => { ok: boolean; got: number; reason?: string };
  /** 馬市 — convert gold↔戰馬 at the city's horse-market rate (cheap in
   *  horse-country, dear elsewhere). `kind` is from the player's side. */
  tradeHorses: (cityId: EntityId, kind: 'buy' | 'sell', amount: number) => { ok: boolean; got: number };
  /** 鐵市 — convert gold↔鐵 at the city's iron-market rate (cheap in
   *  iron-country, dear elsewhere). `kind` is from the player's side. */
  tradeIron: (cityId: EntityId, kind: 'buy' | 'sell', amount: number) => { ok: boolean; got: number };
  /** 運糧/運金 — dispatch a supply convoy carrying grain and/or gold from one of
   *  your cities to another. It crawls the map over `seasons` and empties its
   *  cargo on arrival; adjacent hauls arrive in full, longer ones lose 12% on
   *  the road. Cargo is deducted from the source at dispatch. */
  dispatchConvoy: (fromCityId: EntityId, toCityId: EntityId, food: number, gold: number, troops: number, officerId: EntityId, cautious?: boolean, warhorses?: number, iron?: number, medicine?: number, toArmyId?: EntityId) => { ok: boolean; seasons: number; reason?: string };
  /** 召回輜重 — turn a convoy around; its cargo returns to the origin city (lost
   *  if that city has since fallen). */
  recallConvoy: (id: EntityId) => void;
  /** 常運糧道 — toggle a standing supply route (auto-ships surplus grain each
   *  season from → to). */
  setStandingRoute: (fromCityId: EntityId, toCityId: EntityId, on: boolean) => void;
  /** 主動劫糧 — enemy supply convoys the player can see (their nearest city is
   *  yours) and so may run down with a raiding column, plus the launch city. */
  spottedEnemyConvoys: () => Array<{ convoy: import('../systems/convoy').Convoy; fromCityId: EntityId; x: number; y: number }>;
  /** 主動劫糧 — send a raiding column (officer + troops) out of `fromCityId` to
   *  run down a spotted enemy supply convoy; it intercepts next season. */
  raidConvoy: (targetConvoyId: EntityId, fromCityId: EntityId, officerId: EntityId, troops: number) => { ok: boolean; reason?: string };
  /** 游历 — send a lone officer roaming from one of your cities to another city
   *  (yours or a rival's) on an errand: 探索 (intel + windfalls), 出使 (warm
   *  relations), 策反 (turn an enemy officer), 刺探 (deep intel + sabotage). He
   *  travels alone, resolves the errand on arrival, and rides home. The foreign
   *  errands (envoy/subvert/infiltrate) require a target held by another force. */
  dispatchExpedition: (officerId: EntityId, fromCityId: EntityId, toCityId: EntityId, mode: ExpeditionMode) => { ok: boolean; seasons: number; reason?: string };
  /** 召回游历 — recall a roaming officer; he turns straight for home, errand
   *  abandoned (an officer already on his way back is left to it). */
  recallExpedition: (id: EntityId) => void;
  /** 遠使異域 — send an officer on a long embassy to a distant land (FOREIGN_REALMS:
   *  西域/倭/大秦…) or a border tribe (TribeId). He travels far, opens relations
   *  / placates the frontier, and rides home with coin, exotica, auxiliaries and
   *  prestige — if the road doesn't claim him. Reuses the expedition machinery. */
  dispatchEmbassy: (officerId: EntityId, fromCityId: EntityId, realmId: EntityId) => { ok: boolean; seasons: number; reason?: string };
  /** 借糧 — ask a friendly force to send grain to your capital. Allies and NAP
   *  partners (or anyone you're on good terms with) oblige; the grain comes out
   *  of their own stores. */
  requestGrain: (targetForceId: EntityId) => { ok: boolean; accepted?: boolean; message: string };
  /** 通商條約 — open commerce with a force you're at peace with; both earn a
   *  steady gold income each season while the peace holds. */
  proposeTradeTreaty: (targetForceId: EntityId) => { ok: boolean; accepted?: boolean; message: string };
  /** 鑄錢 — debase the coinage for an immediate windfall in the capital at the
   *  cost of rising inflation (which saps future tax income until it eases). */
  mintCoin: () => { ok: boolean; gold: number; inflation: number };
  /** 名產作坊 — invest the holding city's gold to raise its 特產發展度 by one
   *  (cap SPECIALTY_DEV_MAX), widening the gold/food premium + strategic-good yield. */
  developSpecialty: (cityId: EntityId) => { ok: boolean; message: string };
  /** 禁運 — a 專營 (≥60% world share) monopolist cuts a rival off a strategic
   *  good, halving the rival's grip on it. Toggle on/off. */
  setEmbargo: (targetForceId: EntityId, role: SpecialtyRole, on: boolean) => { ok: boolean; message: string };
  /** 劝募/募捐 — appeal to the people for an immediate gold windfall (scaled by
   *  realm size & loyalty) at the cost of 民忠. Once a year (4 seasons). */
  solicitDonations: () => { ok: boolean; gold: number; message?: string };
  /** 富商借餉 — borrow a war-chest from the realm's merchants: a large lump of
   *  gold now, auto-repaid (principal + ~25% interest) over 8 seasons from the
   *  capital. No new loan while one is outstanding. */
  borrowWarFunds: () => { ok: boolean; gold: number; owed?: number; message?: string };
  /** 委任太守 — set (or clear with null) a city's standing governor. */
  delegateCity: (cityId: EntityId, officerId: EntityId | null) => void;
  /** 軍團都督 — form a legion (id auto-assigned). */
  createLegion: (legion: Omit<Legion, 'id'>) => void;
  disbandLegion: (legionId: string) => void;
  /** 全軍集結令 — every player city that can spare a column marches ~70%
   *  of its garrison toward the target under its best idle officer
   *  (adjacent cities directly, the hinterland one hop along an in-realm
   *  path). Returns how many columns were dispatched. */
  massMuster: (targetCityId: EntityId) => number;
  cancelCommand: (cityId: EntityId) => void;
  /** Start training an officer in a new policy. If `mentorOfficerId` is
   *  provided, runs in mentor mode (no academy needed, 0 gold, +1 season).
   *  Otherwise uses the city's academy. */
  startTraining: (
    officerId: EntityId,
    cityId: EntityId,
    policyId: import('../data/officerAttributes').PolicyId,
    mentorOfficerId?: EntityId,
  ) => { ok: boolean; reason?: string };
  /** Start training an officer in a new battle tactic. Same modes as
   *  startTraining (academy / mentor). */
  startTacticTraining: (
    officerId: EntityId,
    cityId: EntityId,
    tacticId: import('../data/officerAttributes').TacticId,
    mentorOfficerId?: EntityId,
  ) => { ok: boolean; reason?: string };
  /** Cancel an in-flight training and refund 50% of the gold spent. */
  cancelTraining: (officerId: EntityId) => void;
  /** Build or upgrade a defense structure at a city's perimeter slot. */
  buildDefenseStructure: (
    cityId: EntityId,
    slot: number,
    buildingId: import('../data/defenseBuildings').DefenseBuildingId,
  ) => { ok: boolean; reason?: string };
  upgradeDefenseStructure: (cityId: EntityId, slot: number) => { ok: boolean; reason?: string };
  demolishDefenseStructure: (cityId: EntityId, slot: number) => void;
  endSeason: () => void;
  dismissReport: () => void;
  /** 慶典彈窗 — enqueue a celebratory image/video popup; shown one at a time. */
  pushPopup: (event: import('../types').PopupEvent) => void;
  /** Dismiss the front popup (advance the queue). */
  dismissPopup: () => void;
  dismissBattleTheater: () => void;
  recruitOfficer: (
    officerId: EntityId,
    cityId: EntityId,
    approach?: import('../systems/officerFate').PersuasionApproach,
    debateWon?: boolean,
    /** 名品禮聘 — an unclaimed treasure pressed on the captive (joins them on success). */
    giftItemId?: EntityId,
  ) => { ok: boolean; message: string };
  /** 舌戰 — apply the aftermath: a collapse cracks the captive's resolve. */
  applyDebateCollapse: (officerId: EntityId) => void;
  /** 勸降三策 — the odds each approach would roll against, for the UI. */
  estimatePersuasion: (
    officerId: EntityId,
    cityId: EntityId,
    approach?: import('../systems/officerFate').PersuasionApproach,
  ) => number;
  /** 訪賢招攬 — invite a free agent (free). opts: a won debate or a paid
   *  bribe raises the odds after a first refusal. */
  recruitFreeAgent: (
    officerId: EntityId,
    cityId: EntityId,
    opts?: { debateWon?: boolean; bribe?: number; giftItemId?: EntityId },
  ) => { ok: boolean; message: string };
  /** 舌戰失利 — lock a free agent until next season (lost the war of words). */
  lockFreeAgentRecruit: (officerId: EntityId) => void;
  executeOfficer: (officerId: EntityId) => void;
  /** 釋放俘虜。`honorable`(義釋)→ the freed officer remembers the kindness
   *  (`freedByForceId`, easier to recruit later) and the lord earns renown. */
  releaseOfficer: (officerId: EntityId, honorable?: boolean) => void;
  acknowledgeVictory: () => void;
  proposeAlliance: (
    targetForceId: EntityId,
  ) => { ok: boolean; message: string; accepted?: boolean };
  proposeNonAggression: (
    targetForceId: EntityId,
  ) => { ok: boolean; message: string; accepted?: boolean };
  payTribute: (
    targetForceId: EntityId,
    amount: number,
  ) => { ok: boolean; message: string };
  breakAlliance: (targetForceId: EntityId) => void;
  /** Send a hostage to seal a long peace. The officer becomes 'imprisoned'
   *  at the target's court; the relation jumps and a 16-season NAP is sworn. */
  proposeHostage: (
    targetForceId: EntityId,
    officerId: EntityId,
  ) => { ok: boolean; message: string; accepted?: boolean };
  proposeMarriage: (
    targetForceId: EntityId,
    yourOfficerId: EntityId,
    theirOfficerId: EntityId,
    /** 人質 — your officer lives in the partner's court; tightens the bond and
     *  lends the partner extra surety. */
    opts?: { hostage?: boolean },
  ) => { ok: boolean; message: string };
  /** 背信棄義 — renounce a marriage alliance to free your hand for war. Brands
   *  you an oathbreaker: relation crash with the spurned realm + all others. */
  breakMarriageAlliance: (
    targetForceId: EntityId,
  ) => { ok: boolean; message: string };
  transferOfficer: (
    officerId: EntityId,
    destinationCityId: EntityId,
  ) => { ok: boolean; reason?: string };
  assignItem: (
    itemId: EntityId,
    toOfficerId: EntityId,
  ) => { ok: boolean; reason?: string };
  unequipItem: (officerId: EntityId, itemId: EntityId) => { ok: boolean; reason?: string };
  unequipSlot: (
    officerId: EntityId,
    slot: 'weapon' | 'horse' | 'treasure' | 'book' | 'armor',
  ) => { ok: boolean; reason?: string };
  appointTitle: (
    officerId: EntityId,
    titleId: CivicTitleId,
    cityId?: EntityId,
  ) => { ok: boolean; reason?: string };
  revokeTitle: (officerId: EntityId) => { ok: boolean; reason?: string };
  promoteOfficer: (
    officerId: EntityId,
    rankId: MilitaryRankId,
  ) => { ok: boolean; reason?: string };
  /** 封爵 — confer a peerage on one of your officers. Gated by 功勳積分 (merit)
   *  and, for 公/王, by the realm having reached 王/帝 standing. Pays a one-shot
   *  loyalty bump; the standing 食邑 income + loyalty kick in at season turn. */
  grantPeerage: (
    officerId: EntityId,
    peerageId: PeerageId,
  ) => { ok: boolean; reason?: string };
  /** 削爵 — strip an officer's peerage to curb an over-mighty retainer. Removes
   *  the fief (and its 野心 pressure) at the cost of a sharp loyalty drop +
   *  grievance. A blunt lever against a noble grown too dangerous. */
  revokePeerage: (officerId: EntityId) => { ok: boolean; reason?: string };
  /** 賜名號 — confer a martial honorific (名號將軍) on one of your officers.
   *  Gated by 功勳積分; pays a one-shot loyalty + 戰功威望 bump. */
  grantHonorific: (
    officerId: EntityId,
    honorificId: string,
  ) => { ok: boolean; reason?: string };
  /** 奪號 — strip an officer's martial honorific (its standing loyalty + battle
   *  perk go with it), at the cost of a loyalty drop + grievance. */
  revokeHonorific: (officerId: EntityId) => { ok: boolean; reason?: string };
  /** 門第政策 — set the player realm's talent-selection stance. Drives the
   *  門閥世族 loop (重門第 / 唯才是舉 / 並用). */
  setRecruitmentStance: (
    stance: 'aristocratic' | 'meritocratic' | 'balanced',
  ) => void;
  /** 治國理念 — set the player realm's school of statecraft (法/儒/道/兵), or
   *  null to revert to 雜糅 (no slant). */
  setStatecraft: (
    school: import('../data/statecraft').StatecraftSchool | null,
  ) => void;
  /** 建國大典 — hold the founding ceremony (requires 王/帝 standing, once only):
   *  proclaim 國號/年號, 大赦天下, 封賞百官 (mass enfeoffment), swell 天命. */
  holdFoundingCeremony: (
    dynastyTitle: string,
    eraName: string,
  ) => { ok: boolean; message: string; enfeoffed?: number };
  /** 抉擇 — resolve a choice-bearing event with the picked branch. */
  resolveEventChoice: (choiceId: string) => void;
  dismissEvent: () => void;
  startTacticalBattle: (battle: TacticalBattle) => void;
  /** 亲征野战 — lead a player field army into an interactive tactical battle
   *  against an adjacent enemy army. Returns false if not allowed. */
  startFieldBattle: (playerArmyId: EntityId, enemyArmyId: EntityId) => boolean;
  /** 演習 — launch a sparring drill on the city's own battlefield using its
   *  garrison, against a mirror sparring force. Optional `bearing` (radians,
   *  attacker→city) aims the assault from a chosen approach so the board shows
   *  that direction's real terrain. Nothing writes back to the campaign.
   *  Returns false if the city has no officers to field. */
  startPracticeBattle: (cityId: EntityId, bearing?: number, officerIds?: EntityId[]) => boolean;
  /** 演武 — two of your officers spar (non-lethal). Both gain XP (the winner
   *  more), which can grow stats / learn skills via the normal growth path.
   *  Returns a summary for the UI; null if either officer is missing. */
  grantSparXp: (winnerId: EntityId, loserId: EntityId, draw?: boolean, favored?: keyof import('../types').OfficerStats | Array<keyof import('../types').OfficerStats>) => {
    winnerName: string; loserName: string; winnerLeveled: boolean; loserLeveled: boolean; notes: string[];
  } | null;
  /** 演武/論辯冷卻 — log a friendly 1-on-1 spar/debate for both participants so
   *  each officer's per-season allowance ticks down (anti XP-farm). 'spar' and
   *  'debate' draw from separate pools. See systems/sparLimit. */
  recordTrainingUse: (kind: 'spar' | 'debate', ids: EntityId[]) => void;
  /** Award XP to a single officer (比武大會 prizes, etc.). Grows stats / skills
   *  via the normal growth path. Returns level-up notes; null if missing. */
  grantOfficerXp: (officerId: EntityId, amount: number, favored?: keyof import('../types').OfficerStats | Array<keyof import('../types').OfficerStats>) => { leveled: boolean; notes: string[] } | null;
  /** 練兵/拜師 — set (or clear, with null) the stat an officer's growth biases
   *  toward. Persists on the officer; every later XP gain honours it. */
  setTrainingFocus: (officerId: EntityId, stat: keyof import('../types').OfficerStats | null) => void;
  /** 轉生/突破 — a max-level officer breaks through: latent caps rise and their
   *  signature stats sharpen. Costs gold from their current city. Returns the
   *  growth notes, or a reason when it can't be done. */
  breakthroughOfficer: (officerId: EntityId, path?: BreakthroughPath) => { ok: boolean; reason?: string; notes?: string[] };
  /** 拜師 — apprentice an officer to a master (or clear the bond with null). While
   *  both serve the same force and are garrisoned together the disciple grows
   *  faster toward the master's strongest suit and may inherit their craft; a
   *  遺志 boost lands when the master dies. See growth.tickMentorBonds. */
  assignMentor: (studentId: EntityId, mentorId: EntityId | null) => { ok: boolean; reason?: string };
  /** 研讀兵書 — an officer studies a consumable manual (兵書/秘笈) they carry:
   *  applies its one-time growth (歷練 / 潛能 / 技能) and the book is destroyed. */
  studyManual: (officerId: EntityId, itemId: EntityId) => { ok: boolean; reason?: string; notes?: string[] };
  /** 山長 — assign (or clear, with null) an officer to head a school building in a
   *  city you own. The headmaster's 智力 lifts the school's XP output and their
   *  strongest 圍 tilts what 講學 teaches. See systems/buildings. */
  assignHeadmaster: (cityId: EntityId, buildingId: import('../types').BuildingId, officerId: EntityId | null) => { ok: boolean; reason?: string };
  /** 洗點退養 — strip an item's 精煉/突破/鑲嵌 to redeploy the investment: gems
   *  return to stock, half the sunk gold is refunded to the holder's city. The
   *  item's 名器威名 (earned, not bought) is kept. */
  resetItemGrowth: (itemId: EntityId) => { ok: boolean; reason?: string; refund?: number };
  /** 後遺 — lay a short-lived affliction on an officer (養傷 from a duel, 羞憤
   *  from a lost debate). Ticks down each season; folds into effective stats. */
  afflictOfficer: (officerId: EntityId, affliction: Affliction) => void;
  /** 罵死 — apply the consequence of routing a foe in a war of words: a
   *  hot-tempered or aged mind may break (death, 王朗墜馬), else it stews in a
   *  heavy 羞憤 (−魅/−智); the young & steady are unharmed. Returns the outcome. */
  debateRout: (officerId: EntityId, rng?: () => number) => RoutConsequence;
  /** 民心 — nudge a city's loyalty (公開舌戰的餘波撼動守城民心). Clamped 0..100. */
  shiftCityLoyalty: (cityId: EntityId, delta: number) => void;
  /** Spend gold from a city's coffers (e.g. mounting a 说客 embassy). Returns
   *  false and deducts nothing if the city can't afford it. */
  spendCityGold: (cityId: EntityId, amount: number) => boolean;
  /** 月旦評 — your sharpest 名士 appraises an officer (§3.5): records a 定評,
   *  reveals their 成長資質, and makes a name (renown for both). Returns the
   *  verdict, or a reason it can't be done (no appraiser / already appraised). */
  appraiseOfficer: (targetId: EntityId) => { ok: boolean; reason?: string; verdictZh?: string; verdictEn?: string; appraiserName?: { zh: string; en: string }; renownGain?: number; misread?: boolean; legendary?: boolean };
  /** 名聲榜 — accumulate heroic deeds (duel/debate wins, etc.) for an officer.
   *  Numeric fields add; others overwrite. Feeds renown in systems/fame.ts. */
  recordDeed: (officerId: EntityId, patch: Partial<import('../types').HeroicDeeds>) => void;
  /** 名局廊 — archive a notable duel/debate so it can be replayed from the hall. */
  recordBout: (rec: import('../systems/duelHall').BoutRecord) => void;
  /** 武評榜 — fold an interactive duel result into the ELO ladder (a from a's view). */
  recordDuelRating: (aId: EntityId, bId: EntityId, result: 'win' | 'loss' | 'draw') => void;
  /** 單挑戰役 — mark a duel scenario cleared (campaign progress). */
  markDuelScenarioCleared: (scenarioId: EntityId) => void;
  /** 劇情舌戰 — apply a scripted scenario's outcome effects to live state
   *  (gold to the capital, recruiting a won-over officer, shaming a routed one).
   *  Relationship/morale/note effects are display-only. */
  applyScenarioEffects: (effects: import('../systems/debateScenarios').ScenarioEffect[]) => void;
  /** Pay for siege works (圍困糧耗 / 水攻決堤) from the attacking city's
   *  stores before an assault. Returns false (and deducts nothing) if the
   *  city can't afford it. */
  spendSiegeWorks: (cityId: EntityId, gold: number, food: number) => boolean;
  /** 馳援 — deduct a relief column's troops from its home city when it
   *  marches for a besieged neighbour (survivors return after battle). */
  dispatchRelief: (cityId: EntityId, troops: number) => void;
  /** 行軍預覽 — highlight a prospective march route on the 3D map. */
  setMarchPreview: (preview: { fromId: EntityId; toId: EntityId } | null) => void;
  /** Start the next AI-initiated field battle queued from season resolution
   *  (the player fights clashes the AI forced). No-op if the queue is empty. */
  startNextFieldBattle: () => void;
  /** Start the next queued 守城戰 — an AI column at the player's gates,
   *  fought interactively with the player as DEFENDER. */
  startNextSiegeDefense: () => void;
  endTacticalBattle: (
    winner: 'attacker' | 'defender',
    attackerLosses: number,
    defenderLosses: number,
  ) => void;
  cancelTacticalBattle: () => void;
  applyTacticalResolution: (
    captured: EntityId[],
    dead: EntityId[],
    lootGold: number,
    winner: 'attacker' | 'defender' | null,
  ) => void;
  queueEspionage: (
    kind: EspionageKind,
    agentOfficerId: EntityId,
    targetForceId: EntityId,
    targetCityId?: EntityId,
    targetOfficerId?: EntityId,
    targetOfficerId2?: EntityId,
  ) => { ok: boolean; reason?: string };
  cancelEspionage: (opId: EntityId) => void;
  /** 潛伏 — plant one of your officers as a persistent spy in an enemy city. */
  plantSpy: (agentOfficerId: EntityId, targetCityId: EntityId) => { ok: boolean; reason?: string };
  /** Extract an embedded spy safely before they are exposed. */
  recallSpy: (spyId: EntityId) => void;
  issueEdict: (
    kind: EdictKind,
    targetForceId?: EntityId,
  ) => { ok: boolean; reason?: string; message?: string };
  promoteImperialRank: (
    forceId: EntityId,
    rank: ImperialRank,
  ) => { ok: boolean; reason?: string };
  setSoundEnabled: (enabled: boolean) => void;
  setMusicTrack: (track: string | null) => void;
  setLanguage: (lang: 'zh' | 'en' | 'both') => void;
  setPlacementMode: (mode: 'historical' | 'random') => void;
  setEnabledDynasties: (dynasties: import('../data/dynasties').Dynasty[]) => void;
  setFogOfWar: (on: boolean) => void;
  /** 定稅 — set a force's tax rate (defaults apply to the player's force). */
  setTaxPolicy: (forceId: EntityId, rate: import('../types').TaxRate) => void;
  saveCommandTemplate: (label: string) => void;
  applyCommandTemplate: (id: EntityId) => void;
  deleteCommandTemplate: (id: EntityId) => void;
  setAutoBuildQueue: (cityId: EntityId, queue: import('../types').BuildingId[]) => void;
  acceptDialogue: (choiceIdx: number) => void;
  dismissDialogue: () => void;
  setBattleSpeed: (speed: number) => void;
  enterCareerMode: (officerId: EntityId) => void;
  exitCareerMode: () => void;
  addCareerMilestone: (title: { zh: string; en: string }) => void;
  setRomanceMode: (on: boolean) => void;
  setRoguelikeMode: (on: boolean) => void;
  setLifespanMode: (mode: 'historical' | 'fictionalImmortal' | 'immortal') => void;
  setNoBattleDeath: (on: boolean) => void;
  setReviveDeadOfficers: (on: boolean) => void;
  setAiStrength: (level: number) => void;
  setStartHandicap: (h: 'weak' | 'even' | 'strong') => void;
  setVictoryGoal: (goal: 'free' | 'unify' | 'hegemon' | 'tripartite') => void;
  setStartTaxRate: (rate: 'light' | 'normal' | 'heavy') => void;
  setStartInflation: (level: number) => void;
  setAiStartTroops: (v: 'fewer' | 'even' | 'more') => void;
  setBattleDifficulty: (d: 'easy' | 'normal' | 'hard' | null) => void;
  setLifespanLength: (l: 'short' | 'historical' | 'long') => void;
  setAgingStatLock: (on: boolean) => void;
  setTalentDiscovery: (v: 'scarce' | 'normal' | 'plentiful') => void;
  setDuelFrequency: (v: 'rare' | 'normal' | 'frequent') => void;
  setDisasterFrequency: (v: 'low' | 'normal' | 'high') => void;
  setIronman: (on: boolean) => void;
  setNewOfficers: (v: 'off' | 'rare' | 'normal' | 'common') => void;
  setFictionalPool: (v: 'off' | 'some' | 'many') => void;
  setInitialDiplomacy: (v: 'neutral' | 'warring' | 'coalitions') => void;
  forgeItem: (
    cityId: EntityId,
    recipeId: EntityId,
  ) => { ok: boolean; reason?: string; plus?: number; smith?: { zh: string; en: string } };
  /** 熔毀 — melt a lost item in a foundry city back into iron + gold. */
  dismantleItem: (
    cityId: EntityId,
    itemId: EntityId,
  ) => { ok: boolean; reason?: string; iron?: number; gold?: number; gem?: EntityId };
  /** Learn a forging blueprint (研發 / event grant). No-op if already known. */
  learnRecipe: (recipeId: EntityId) => { ok: boolean; reason?: string };
  /** 精煉 — raise an item one refinement level (+1), charged from the city that
   *  holds it (its wielder's city, or the lost-item city). A foundry there
   *  discounts the cost. */
  refineItem: (itemId: EntityId) => { ok: boolean; reason?: string; cost?: number };
  /** 突破 — push a fully-refined item one ★ further, charged gold + iron from the
   *  holding city (needs a foundry). */
  breakthroughItem: (itemId: EntityId) => { ok: boolean; reason?: string; cost?: number; iron?: number };
  /** 鑲嵌 — socket a gem into an item (up to socketsFor), charged from the holding city. */
  socketGem: (itemId: EntityId, gemId: EntityId) => { ok: boolean; reason?: string; cost?: number };
  /** 卸下寶石 — pry a socketed gem out (no refund). */
  unsocketGem: (itemId: EntityId, index: number) => { ok: boolean; reason?: string };
  /** 寶石合成 — fuse 3 stocked gems into 1 of the next grade. */
  fuseGems: (gemId: EntityId) => { ok: boolean; reason?: string; gem?: EntityId };
  /** 敵軍軍備 — seed AI-held gear with 精煉/突破/鑲嵌 scaled by difficulty. */
  seedAiGear: () => void;
  acknowledgeAchievements: () => void;
  acknowledgeDeedTitles: () => void;
  acknowledgePrestige: () => void;
  /** Dequeue the front bond awaiting its on-map 義結金蘭 ceremony. */
  acknowledgeBond: () => void;
  /** Dequeue the front 威名 promotion awaiting its on-map 封號 ceremony. */
  acknowledgePrestigeCeremony: () => void;
  /** Dequeue the front 品階 promotion awaiting its on-map 晉牌封賞 ceremony. */
  acknowledgePromotion: () => void;
  // ─── Port (港) actions ────────────────────────────────────────────
  /** Queue a ship build at the given port. Player pays gold from capital
   *  immediately; ship is added to dockedShips when seasonsLeft hits 0. */
  buildShipAtPort: (
    portId: EntityId,
    shipClass: import('../types').ShipClass,
  ) => { ok: boolean; message: string };
  /** Build a player stockade (塢/壘) near a city. Costs 300g + 1 season.
   *  Stockade rots after 10 seasons unless garrisoned. */
  buildStockade: (
    nearCityId: EntityId,
    label: string,
  ) => { ok: boolean; message: string };
  /** Build a strategic facility (箭樓/投石臺/陣/防壁) near a city. Costs gold
   *  from the capital; acts on armies marching nearby each season. */
  buildFacility: (
    nearCityId: EntityId,
    kind: FacilityKind,
    label: string,
  ) => { ok: boolean; message: string };
  /** Officer-led attack on a fort. Same pattern as attackPort. */
  attackFort: (
    fortId: EntityId,
    attackerOfficerId: EntityId,
    troops: number,
  ) => { ok: boolean; captured?: boolean; message: string };
  /** Spend gold from capital to restore fort HP (own fort only). */
  repairFort: (fortId: EntityId) => { ok: boolean; message: string };
  /** Upgrade an owned fort one level (max 3). Lv2: 500g, Lv3: 1200g.
   *  Each level adds +50% to maxHp. */
  upgradeFort: (fortId: EntityId) => { ok: boolean; message: string };
  /** 征討異族 — punitive expedition against a frontier tribe. Officer leads
   *  troops from a bordering city; victory collapses the tribe's aggression
   *  and yields tribute gold + auxiliary cavalry. */
  subjugateTribe: (
    tribeId: string,
    attackerOfficerId: EntityId,
    troops: number,
  ) => { ok: boolean; win?: boolean; message: string };
  /** 招撫異族 — pay tribute/gifts (gold from capital) to cool a tribe's
   *  aggression for a while. Always succeeds if gold available. */
  placateTribe: (tribeId: string) => { ok: boolean; message: string };
  /** 剿賊/取津/佔礦 — officer-led assault on a wild site. Same flow as
   *  attackFort; on capture the site flips to the player (bandit nests are
   *  pacified + drop loot, fords/deposits come under control). */
  seizeSite: (
    siteId: EntityId,
    attackerOfficerId: EntityId,
    troops: number,
  ) => { ok: boolean; captured?: boolean; message: string };
  /** 訪賢尋寶 — send an envoy officer to a 名所. Loots its treasure once and
   *  may coax a reclusive worthy (still a free agent) into your service. */
  visitScenicSite: (
    siteId: string,
    envoyOfficerId: EntityId,
  ) => { ok: boolean; recruited?: boolean; message: string };
  /** 焦土 — raze your own city to ruins, denying it to the enemy (gutted
   *  population/production, garrison disbanded). Irreversible without 重建. */
  razeCity: (cityId: EntityId) => { ok: boolean; message: string };
  /** 重建 — rebuild an owned ruined city (gold from that city's coffers). */
  rebuildCity: (cityId: EntityId) => { ok: boolean; message: string };
  /** 遷都 — move the realm's seat (治所) to another owned city. Costs gold from
   *  the new capital and unsettles both cities briefly; the new seat then earns
   *  the standing capital loyalty bonus each season. */
  relocateCapital: (cityId: EntityId) => { ok: boolean; message: string };
  /** Officer-led attack on a port. Damage scales with attacker WAR + LED;
   *  attacker takes casualties proportional to defender officer's WAR.
   *  Captures the port if HP drops to 0. */
  attackPort: (
    portId: EntityId,
    attackerOfficerId: EntityId,
    troops: number,
  ) => {
    ok: boolean;
    captured?: boolean;
    message: string;
    /** Battle outcome details for the report. */
    report?: {
      attacker: { officerName: string; troopsSent: number; troopsLost: number };
      defender: { officerName: string | null; portHpBefore: number; portHpAfter: number };
    };
  };
  /** Spend gold from the player's capital to restore port HP. */
  repairPort: (portId: EntityId) => { ok: boolean; message: string };
  /** 擴建船塢 (水軍養成) — raise a port's naval tier (max 3). Unlocks heavier
   *  hulls (樓船/大翼), speeds builds, and hardens the port. */
  upgradePort: (portId: EntityId) => { ok: boolean; message: string };
  saveSlot: (slotId: string, label: string) => void;
  loadSlot: (slotId: string) => boolean;
  deleteSlot: (slotId: string) => void;
  listSlots: () => ReturnType<typeof listSlots>;
  startBuilding: (
    cityId: EntityId,
    buildingId: BuildingId,
    plot?: number,
  ) => { ok: boolean; reason?: string };
  appointGovernor: (
    provinceId: ProvinceId,
    officerId: EntityId,
  ) => { ok: boolean; reason?: string };
  /** 府內結親 — arrange a marriage between two of your own officers (500 gold):
   *  steadies their loyalty and lets the couple raise heirs over the years. */
  proposeMarriagePair: (
    aId: EntityId,
    bId: EntityId,
  ) => { ok: boolean; reason?: string; message?: string };
  /** 西席 — assign (or clear, with null) a tutor for a pending heir; the tutor's
   *  strengths bias the child's upbringing each year before it comes of age. */
  assignTutor: (heirId: EntityId, tutorId: EntityId | null) => { ok: boolean; message?: string };
  /** 立世子 — designate one of your pending heirs as the house's chosen heir. */
  designateHeir: (heirId: EntityId) => { ok: boolean; message?: string };
  /** 收養 — adopt one of your officers into another's bloodline (家門): adds a
   *  parent-child bond and brings the child into the parent's clan. */
  adoptHeir: (childOfficerId: EntityId, parentOfficerId: EntityId) => { ok: boolean; message?: string };
  /** 結交 — grow rapport between two of your officers; they swear a bond at 100. */
  socializeOfficers: (aId: EntityId, bId: EntityId) => { ok: boolean; message: string; forged?: boolean };
  /** 宴請 — host a banquet at an owned city: mingles rapport + lifts loyalty. */
  hostBanquet: (cityId: EntityId) => { ok: boolean; message: string };
  /** 結拜 — two of your officers swear brotherhood (義兄弟): a permanent runtime
   *  bond granting same-side combat synergy + a 90 loyalty floor. Costs gold.
   *  Requires 好感 ≥ 60 between the pair. */
  swearBrotherhood: (aId: EntityId, bId: EntityId) => { ok: boolean; message: string };
  /** 桃園三結義 — three of your officers swear brotherhood together (pairwise
   *  好感 ≥ 60), forging three sibling bonds at once. Costs gold. */
  swearThreeWay: (aId: EntityId, bId: EntityId, cId: EntityId) => { ok: boolean; message: string };
  /** 調解 — a respected mediator warms two soured/feuding officers back toward
   *  neutrality (好感 ↑); a 宿怨 may dissolve once rapport recovers enough. Gold. */
  reconcileOfficers: (aId: EntityId, bId: EntityId) => { ok: boolean; message: string };
  /** 私兵 — fund a personal-guard corps for one of your officers (2 gold/unit,
   *  drawn from their current city; capped at leadership×100). */
  levyPrivateTroops: (officerId: EntityId, amount: number) => { ok: boolean; message: string };
  /** Disband an officer's 私兵 back into nothing (no refund). */
  disbandPrivateTroops: (officerId: EntityId) => { ok: boolean; message: string };
  /** 事件編輯器 — add a player-authored event (caps at MAX_CUSTOM_EVENTS). */
  addCustomEvent: (event: import('../types/event').HistoricalEvent) => { ok: boolean; message: string };
  /** Remove a player-authored event by id. */
  removeCustomEvent: (id: EntityId) => void;
  grantWish: (wishId: EntityId) => void;
  rejectWish: (wishId: EntityId) => void;
  setTutorialStep: (step: number | null) => void;
  setHotSeatPlayers: (players: Array<{ forceId: EntityId; label: string }>) => void;
  cycleHotSeat: () => void;
  buildShip: (
    cityId: EntityId,
    shipClass: ShipClass,
  ) => { ok: boolean; reason?: string };
  loadRandomScenario: (forceCount: number, year: number, seed?: number) => void;
  reset: () => void;
}

/**
 * Build an interactive field-battle (亲征野战) TacticalBattle between a player
 * army and an enemy army, themed to the clash terrain and with no city walls.
 * Returns null if the engagement is not valid. Shared by the player-initiated
 * trigger (enforceRange) and the AI-initiated deferred queue (no range check).
 */
function buildFieldBattle(
  s: GameState,
  playerArmyId: EntityId,
  enemyArmyId: EntityId,
  enforceRange: boolean,
): TacticalBattle | null {
  const pArmy = s.armies[playerArmyId];
  const eArmy = s.armies[enemyArmyId];
  if (!pArmy || !eArmy) return null;
  if (pArmy.forceId !== s.playerForceId) return null;
  if (eArmy.forceId === s.playerForceId) return null;
  if (!isHostilePermitted(s.diplomacy, pArmy.forceId, eArmy.forceId)) return null;
  if (enforceRange && Math.hypot(pArmy.x - eArmy.x, pArmy.y - eArmy.y) > 120) return null;

  const sideOf = (army: typeof pArmy) => {
    const offs = [army.commanderId, ...army.companionIds]
      .map((id) => s.officers[id])
      .filter((o): o is Officer => !!o);
    const n = Math.max(1, offs.length);
    const base = Math.floor(army.troops / n);
    return offs.map((o, i) => ({
      officer: o,
      troops: i === 0 ? army.troops - base * (n - 1) : base,
      unitType: inferUnitType(o),
    }));
  };
  const attackers = sideOf(pArmy);
  const defenders = sideOf(eArmy);
  if (attackers.length === 0 || defenders.length === 0) return null;

  const midX = (pArmy.x + eArmy.x) / 2, midY = (pArmy.y + eArmy.y) / 2;
  let nominalCity = pArmy.targetCityId, bestD = Infinity;
  for (const c of Object.values(s.cities)) {
    const cp = cityPos(c);
    const d = Math.hypot(cp.x - midX, cp.y - midY);
    if (d < bestD) { bestD = d; nominalCity = c.id; }
  }
  const stratWeather = s.weather?.kind ?? 'clear';
  const tacticalWeather = stratWeather === 'drought' ? 'clear' : stratWeather;

  const battle = setupTacticalBattle({
    cityId: nominalCity,
    width: 18,
    height: 12,
    attackerForceId: pArmy.forceId,
    defenderForceId: eArmy.forceId,
    attackers,
    defenders,
    // Whichever side is dug in fights from an ambush formation.
    attackerFormation: pArmy.holding ? 'ten-ambush' : undefined,
    defenderFormation: eArmy.holding ? 'ten-ambush' : undefined,
    weather: tacticalWeather as 'clear' | 'rain' | 'wind' | 'fog' | 'snow',
    timeOfDay: rollTimeOfDay(),
    windDirection: s.weather?.wind ?? 'calm',
    terrainHint: { terrain: terrainTypeAt(midX, midY), x: midX, y: midY },
    // Real-map battlefield: anchored at the clash point, oriented along
    // the player army's line of advance toward the enemy.
    battleGeo: {
      x: midX, y: midY,
      bearing: Math.atan2(eArmy.y - pArmy.y, eArmy.x - pArmy.x),
      season: s.date.season,
    },
    forts: s.forts,
    field: true,
  });
  battle.attackerArmyId = playerArmyId;
  battle.defenderArmyId = enemyArmyId;
  return battle;
}

/**
 * A force's realm-wide 名產 bonuses (ship/siege discounts, mint, tribute, …),
 * honouring any standing 禁運 against it. Used by the action handlers that spend
 * or earn outside the per-season resolution loop (鑄錢, 造船, 招撫…).
 */
function forceSpecialtyRealm(
  cities: Record<EntityId, City>,
  forceId: EntityId | null,
  embargoes?: Embargo[],
): SpecialtyRealmEffects {
  const ctrl = specialtyControl(cities, forceId, forceId ? embargoedRolesAgainst(forceId, embargoes) : undefined);
  return specialtyRealmEffects(ctrl);
}

/**
 * Where a convoy is on the map right now — the same prog/route maths the season
 * loop uses to reckon road raids, so the player's 劫糧 reach matches reality.
 */
function convoyMapPos(
  cv: { fromCityId: EntityId; toCityId: EntityId; totalSeasons: number; seasonsRemaining: number },
  cities: Record<EntityId, City>,
): { x: number; y: number } {
  const from = cities[cv.fromCityId];
  const to = cities[cv.toCityId];
  if (!from || !to) return { x: 0, y: 0 };
  const sp = cityPos(from), dp = cityPos(to);
  const prog = Math.min(0.9, Math.max(0.1, (cv.totalSeasons - cv.seasonsRemaining + 0.5) / Math.max(1, cv.totalSeasons)));
  return positionAlongRoute(terrainRoute(sp.x, sp.y, dp.x, dp.y), prog);
}

/** The owned city nearest a map point (any owner if forceId omitted). */
function nearestCityTo(
  x: number, y: number,
  cities: Record<EntityId, City>,
  forceId?: EntityId | null,
): City | null {
  let best: City | null = null, bd = Infinity;
  for (const c of Object.values(cities)) {
    if (c.ruined || !c.ownerForceId) continue;
    if (forceId !== undefined && c.ownerForceId !== forceId) continue;
    const cp = cityPos(c);
    const d = Math.hypot(cp.x - x, cp.y - y);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

/** 名駒 — the famous mounts (赤兔/的盧/汗血…) a developed 名馬 city can foal. */
const NAMED_MOUNTS = Object.values(ITEMS_BY_ID).filter((i) => (i as { kind?: string }).kind === 'horse');

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      loadScenario: (scenario, playerForceId, difficulty, customOfficer, capitalOverride) => {
        setRefineRegistry({}); setBreakthroughRegistry({}); setGemRegistry({}); setLoreRegistry({}); // fresh game → drop any prior 精煉/名器 registry
        set((s) => loadScenario(s, scenario, playerForceId, difficulty, customOfficer, capitalOverride));
        get().seedAiGear();
      },

      // 演義模擬器 — load a scenario with NO player force and start in
      // observe mode, so the AI runs every realm and the season tick
      // simulates history while you watch.
      observeScenario: (scenario, difficulty) => {
        setRefineRegistry({}); setBreakthroughRegistry({}); setGemRegistry({}); setLoreRegistry({});
        set((s) => ({
          ...loadScenario(s, scenario, scenario.forces[0].id, difficulty),
          playerForceId: null,
          victoryStatus: 'observing' as const,
          tutorialStep: null,
        }));
        get().seedAiGear();
      },

      startChallenge: (challengeId) => {
        const challenge = findChallenge(challengeId);
        if (!challenge) return;
        const scenario = SCENARIOS.find((s) => s.id === challenge.scenarioId);
        if (!scenario) return;
        const hasForce = scenario.forces.some((f) => f.id === challenge.forceId);
        if (!hasForce) return;
        setRefineRegistry({}); setBreakthroughRegistry({}); setGemRegistry({}); setLoreRegistry({});
        set((s) => ({
          ...loadScenario(s, scenario, challenge.forceId, challenge.difficulty),
          activeChallenge: challenge.id,
        }));
        get().seedAiGear();
      },

      // 敵軍軍備 — seed AI-held gear with 精煉/突破/鑲嵌 scaled by difficulty.
      // Shared by loadScenario / observeScenario / startChallenge.
      seedAiGear: () => {
        const s = get();
        const ai = assignAiGear({
          officers: s.officers, playerForceId: s.playerForceId, difficulty: s.difficulty,
          aiStrength: s.aiStrength, refine: s.itemRefinements, breakthrough: s.itemBreakthroughs, gems: s.itemGems,
        });
        setRefineRegistry(ai.refine); setBreakthroughRegistry(ai.breakthrough); setGemRegistry(ai.gems);
        set({ itemRefinements: ai.refine, itemBreakthroughs: ai.breakthrough, itemGems: ai.gems });
      },

      selectCity: (cityId) => set(() => ({ selectedCityId: cityId })),

      openCityMap: () => set(() => ({ cityMapOpen: true })),
      closeCityMap: () => set(() => ({ cityMapOpen: false })),

      setBattleViewMinimized: (minimized) => set(() => ({ battleViewMinimized: minimized })),
      pushBattleFx: (events) => set((s) => (
        events.length === 0 ? {} : { battleFxBatch: { key: (s.battleFxBatch?.key ?? 0) + 1, events } }
      )),
      notify: (zh, en, tone = 'ok') => set((s) => ({
        actionToast: { key: (s.actionToast?.key ?? 0) + 1, zh, en, tone },
      })),

      selectArmy: (armyId) => set(() => ({ selectedArmyId: armyId })),

      redirectArmy: (armyId, newTargetId) => {
        const state = get();
        const cmd = state.pendingCommands[armyId];
        const army = state.armies[armyId];
        if (!cmd || cmd.type !== 'march' || !army) return false;
        if (army.forceId !== state.playerForceId) return false;
        const src = state.cities[cmd.cityId];
        const tgt = state.cities[newTargetId];
        if (!src || !tgt) return false;
        if (newTargetId === cmd.targetCityId || newTargetId === cmd.cityId) return false;
        // New leg length source→newTarget; preserve how far the army has come
        // so it "turns" toward the new objective rather than restarting.
        // Redirecting also lifts any hold.
        const total = marchDurationFor(src, tgt, state.date.season);
        const remaining = Math.max(1, Math.ceil((1 - army.progress) * total));
        set({
          pendingCommands: {
            ...state.pendingCommands,
            [armyId]: { ...cmd, targetCityId: newTargetId, totalSeasons: total, seasonsRemaining: remaining, holding: false },
          },
          armies: {
            ...state.armies,
            [armyId]: { ...army, targetCityId: newTargetId, totalSeasons: total, holding: false },
          },
        });
        return true;
      },

      moveArmyToCell: (armyId, x, y) => {
        const state = get();
        const cmd = state.pendingCommands[armyId];
        const army = state.armies[armyId];
        if (!cmd || cmd.type !== 'march' || !army) return false;
        if (army.forceId !== state.playerForceId) return false;
        const src = state.cities[cmd.cityId];
        if (!src) return false;
        const sp = cityPos(src);
        const dist = Math.hypot(x - sp.x, y - sp.y);
        const total = dist < 100 ? 1 : dist < 195 ? 2 : dist < 275 ? 3 : 4;   // geo thresholds
        const remaining = Math.max(1, Math.ceil((1 - army.progress) * total));
        set({
          pendingCommands: {
            ...state.pendingCommands,
            [armyId]: { ...cmd, targetX: x, targetY: y, totalSeasons: total, seasonsRemaining: remaining, holding: false },
          },
          armies: {
            ...state.armies,
            [armyId]: { ...army, totalSeasons: total, holding: false, cellTarget: true },
          },
        });
        return true;
      },

      holdArmy: (armyId) => {
        const state = get();
        const cmd = state.pendingCommands[armyId];
        const army = state.armies[armyId];
        if (!cmd || cmd.type !== 'march' || !army) return false;
        if (army.forceId !== state.playerForceId) return false;
        const next = !army.holding;
        set({
          pendingCommands: { ...state.pendingCommands, [armyId]: { ...cmd, holding: next } },
          armies: { ...state.armies, [armyId]: { ...army, holding: next } },
        });
        return true;
      },

      resupplyArmy: (armyId) => {
        const state = get();
        const army = state.armies[armyId];
        const cmd = state.pendingCommands[armyId];
        if (!army || !cmd || cmd.type !== 'march' || army.forceId !== state.playerForceId) return { ok: false, sent: 0 };
        // Nearest stocked friendly city sends a baggage train.
        let best: (typeof state.cities)[string] | null = null;
        let bd = Infinity;
        for (const c of Object.values(state.cities)) {
          if (c.ownerForceId !== state.playerForceId || c.food < 1000) continue;
          const cp = cityPos(c);
          const d = Math.hypot(cp.x - army.x, cp.y - army.y);
          if (d < bd) { bd = d; best = c; }
        }
        if (!best) return { ok: false, sent: 0 };
        const want = provisionNeeded(army.troops, 3); // top up ~3 seasons' worth
        const draw = Math.min(best.food - 500, want);
        if (draw < 200) return { ok: false, sent: 0 };
        const sent = Math.floor(draw * (bd < 120 ? 1 : 0.85)); // distance spoilage
        set({
          cities: { ...state.cities, [best.id]: { ...best, food: best.food - draw } },
          armies: { ...state.armies, [armyId]: { ...army, food: (army.food ?? 0) + sent } },
          pendingCommands: { ...state.pendingCommands, [armyId]: { ...cmd, food: (cmd.food ?? 0) + sent } },
        });
        get().notify(`補給 · ${best.name.zh} 輸糧 ${sent.toLocaleString()} 至前軍`, `Supplied the army with ${sent.toLocaleString()} grain from ${best.name.en}`);
        return { ok: true, sent };
      },

      mergeArmyInto: (sourceArmyId, destArmyId) => {
        const state = get();
        if (sourceArmyId === destArmyId) return false;
        const srcCmd = state.pendingCommands[sourceArmyId];
        const dstCmd = state.pendingCommands[destArmyId];
        const srcArmy = state.armies[sourceArmyId];
        const dstArmy = state.armies[destArmyId];
        if (!srcCmd || srcCmd.type !== 'march' || !srcArmy) return false;
        if (!dstCmd || dstCmd.type !== 'march' || !dstArmy) return false;
        if (srcArmy.forceId !== state.playerForceId) return false;
        if (dstArmy.forceId !== state.playerForceId) return false;

        // Current on-map positions (same math the renderer uses) — the two
        // columns must be close enough to rendezvous this season.
        const armyPos = (cmd: typeof srcCmd, army: typeof srcArmy) => {
          const from = state.cities[cmd.cityId];
          const dest = marchDestCoords(cmd, state.cities);
          if (!from || !dest) return { x: army.x, y: army.y };
          const fp = cityPos(from);
          const route = terrainRoute(fp.x, fp.y, dest.x, dest.y);
          const total = Math.max(1, cmd.totalSeasons ?? 1);
          const remaining = cmd.seasonsRemaining ?? 1;
          const t = Math.min(0.95, Math.max(0.05, (total - remaining + 0.5) / total));
          return positionAlongRoute(route, t);
        };
        const ps = armyPos(srcCmd, srcArmy);
        const pd = armyPos(dstCmd, dstArmy);
        const MERGE_RANGE = 145 * WORLD_SCALE; // a few cells — scaled ×1.21, then ×WORLD_SCALE
        if (Math.hypot(ps.x - pd.x, ps.y - pd.y) > MERGE_RANGE) return false;

        // Fold source troops + officers into the destination column. The
        // source's commander and companions become destination companions
        // (they stay busy — the carry-forward loop keeps their march task).
        const mergedCompanions = [
          ...(dstCmd.additionalOfficerIds ?? []),
          srcCmd.officerId,
          ...(srcCmd.additionalOfficerIds ?? []),
        ];
        const mergedTroops = dstArmy.troops + srcArmy.troops;

        const nextCommands = { ...state.pendingCommands };
        delete nextCommands[sourceArmyId];
        nextCommands[destArmyId] = {
          ...dstCmd,
          troops: mergedTroops,
          additionalOfficerIds: mergedCompanions,
        };
        const nextArmies = { ...state.armies };
        delete nextArmies[sourceArmyId];
        nextArmies[destArmyId] = {
          ...dstArmy,
          troops: mergedTroops,
          companionIds: mergedCompanions,
        };
        set({
          pendingCommands: nextCommands,
          armies: nextArmies,
          selectedArmyId: destArmyId,
        });
        return true;
      },

      splitArmy: (armyId, detachOfficerId) => {
        const state = get();
        const cmd = state.pendingCommands[armyId];
        const army = state.armies[armyId];
        if (!cmd || cmd.type !== 'march' || !army) return null;
        if (army.forceId !== state.playerForceId) return null;
        const companions = cmd.additionalOfficerIds ?? [];
        if (companions.length === 0) return null; // no officer to lead a detachment
        // Detach under the chosen companion (default: the first).
        const detachId = detachOfficerId && companions.includes(detachOfficerId)
          ? detachOfficerId : companions[0];
        if (army.troops < 2) return null;
        const detachTroops = Math.floor(army.troops / 2);
        const keepTroops = army.troops - detachTroops;
        if (detachTroops < 1) return null;

        // Current on-map position (same math the renderer uses) — the
        // detachment garrisons the cell the column is standing on.
        const from = state.cities[cmd.cityId];
        const dest = marchDestCoords(cmd, state.cities);
        let px = army.x, py = army.y;
        if (from && dest) {
          const fp = cityPos(from);
          const route = terrainRoute(fp.x, fp.y, dest.x, dest.y);
          const total = Math.max(1, cmd.totalSeasons ?? 1);
          const remaining = cmd.seasonsRemaining ?? 1;
          const t = Math.min(0.95, Math.max(0.05, (total - remaining + 0.5) / total));
          const pos = positionAlongRoute(route, t);
          px = pos.x; py = pos.y;
        }

        const remainingCompanions = companions.filter((id) => id !== detachId);
        const nextCommands = { ...state.pendingCommands };
        // Parent keeps its orders, minus the detached troops & officer.
        nextCommands[armyId] = {
          ...cmd,
          troops: keepTroops,
          additionalOfficerIds: remainingCompanions.length > 0 ? remainingCompanions : undefined,
        };
        // Detachment: a holding garrison on the current cell, ready to be
        // redirected. Keyed by the detached officer (one command per officer).
        nextCommands[detachId] = {
          type: 'march',
          cityId: cmd.cityId,
          officerId: detachId,
          targetCityId: cmd.targetCityId,
          targetX: px,
          targetY: py,
          troops: detachTroops,
          seasonsRemaining: 1,
          totalSeasons: 1,
          holding: true,
        } as MarchCommand;

        const nextArmies = { ...state.armies };
        nextArmies[armyId] = { ...army, troops: keepTroops, companionIds: remainingCompanions };
        nextArmies[detachId] = {
          id: detachId,
          forceId: army.forceId,
          commanderId: detachId,
          companionIds: [],
          troops: detachTroops,
          fromCityId: cmd.cityId,
          targetCityId: cmd.targetCityId,
          x: px,
          y: py,
          progress: army.progress,
          totalSeasons: 1,
          holding: true,
          cellTarget: true,
        };
        set({
          pendingCommands: nextCommands,
          armies: nextArmies,
          selectedArmyId: detachId,
        });
        return detachId;
      },

      issueCommand: (cityId, type, officerId, assistantOfficerIds) => {
        const state = get();
        const city = state.cities[cityId];
        const officer = state.officers[officerId];
        const def = COMMAND_DEFS[type];
        if (!city || !officer || !def) return { ok: false, reason: 'invalid' };
        if (city.ownerForceId !== state.playerForceId)
          return { ok: false, reason: 'not your city' };
        if (officer.locationCityId !== cityId)
          return { ok: false, reason: 'officer not in this city' };
        if (officer.task)
          return { ok: false, reason: 'officer already assigned' };
        // 重傷不能理事 — a critically wounded officer is bed-bound until they heal.
        if (isIncapacitated(officer))
          return { ok: false, reason: 'officer gravely wounded' };
        // pendingCommands keyed by officerId — one task per officer, many per city.
        if (state.pendingCommands[officerId])
          return { ok: false, reason: 'officer already has a pending command' };
        if (state.pendingTrainings.some((t) => t.officerId === officerId))
          return { ok: false, reason: 'officer is training at the academy' };
        if (city.gold < def.goldCost)
          return { ok: false, reason: 'not enough gold' };

        // 協同施政 — validate up to 2 assistants: idle officers in this city,
        // not the lead, not already busy/training, deduped.
        const trainingIds = new Set(state.pendingTrainings.map((t) => t.officerId));
        const assistants: typeof officer[] = [];
        const seen = new Set<EntityId>([officerId]);
        for (const aid of assistantOfficerIds ?? []) {
          if (assistants.length >= 2) break;
          if (seen.has(aid)) continue;
          const a = state.officers[aid];
          if (!a || a.locationCityId !== cityId || a.forceId !== city.ownerForceId) continue;
          if (a.status !== 'idle' || a.task) continue;
          if (state.pendingCommands[aid] || trainingIds.has(aid)) continue;
          seen.add(aid);
          assistants.push(a);
        }
        const assistIds = assistants.map((a) => a.id);

        const nextOfficers = {
          ...state.officers,
          [officerId]: { ...officer, task: type },
        };
        for (const a of assistants) nextOfficers[a.id] = { ...a, task: type };

        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - def.goldCost },
          },
          officers: nextOfficers,
          pendingCommands: {
            ...state.pendingCommands,
            [officerId]: {
              type, cityId, officerId,
              ...(assistIds.length ? { assistantOfficerIds: assistIds } : {}),
            },
          },
        });
        const assistZh = assistIds.length ? `(協同 ${assistants.map((a) => a.name.zh).join('、')})` : '';
        const assistEn = assistIds.length ? ` (+${assistIds.length} assisting)` : '';
        get().notify(
          `委派 · ${officer.name.zh}　${def.label.zh}（${city.name.zh}）${assistZh}`,
          `Dispatched · ${officer.name.en} — ${def.label.en} (${city.name.en})${assistEn}`,
        );
        return { ok: true };
      },

      autoAssignIdle: () => {
        const state = get();
        const pid = state.playerForceId;
        if (!pid) return { assigned: 0, goldSpent: 0 };
        const delegated = new Set(Object.keys(state.cityDelegations ?? {}));
        const training = new Set(state.pendingTrainings.map((tr) => tr.officerId));
        const cities = { ...state.cities };
        const officers = { ...state.officers };
        const pending = { ...state.pendingCommands };
        let assigned = 0;
        let goldSpent = 0;

        const idle = Object.values(state.officers).filter((o) =>
          o.forceId === pid && !o.task && !pending[o.id] && !training.has(o.id) &&
          !!o.locationCityId && cities[o.locationCityId]?.ownerForceId === pid &&
          !delegated.has(o.locationCityId),
        );

        for (const o of idle) {
          const cid = o.locationCityId!;
          const c = cities[cid];
          if (!c) continue;
          // Candidate tasks ordered by city need × officer aptitude; 'search'
          // (cost 0) is the guaranteed fallback so no idle hand stays idle.
          const best = Math.max(o.stats.politics, o.stats.war, o.stats.intelligence);
          const cand: InternalAffairsType[] = [];
          // 賑濟 — a food-rich city pacifies by opening the granaries (saves gold);
          // gated on food since the picker below only checks gold affordability.
          const reliefFood = Math.max(500, Math.round(c.population * 0.02));
          if (c.loyalty < 50 && c.food >= reliefFood * 2) cand.push('relief');
          if (c.loyalty < 50) cand.push('improve-loyalty');
          if (o.stats.war === best) cand.push('recruit-troops', 'build-defense');
          if (o.stats.politics === best) cand.push(c.agriculture <= c.commerce ? 'develop-agriculture' : 'develop-commerce');
          if (o.stats.intelligence === best) cand.push('develop-commerce', 'develop-agriculture');
          cand.push('develop-agriculture', 'develop-commerce', 'build-defense', 'recruit-troops', 'improve-loyalty', 'search');

          let chosen: InternalAffairsType | null = null;
          for (const type of [...new Set(cand)]) {
            const def = COMMAND_DEFS[type];
            if (def && c.gold >= def.goldCost) { chosen = type; break; }
          }
          if (!chosen) continue;
          const def = COMMAND_DEFS[chosen]!;
          cities[cid] = { ...c, gold: c.gold - def.goldCost };
          officers[o.id] = { ...o, task: chosen };
          pending[o.id] = { type: chosen, cityId: cid, officerId: o.id };
          assigned++;
          goldSpent += def.goldCost;
        }

        if (assigned > 0) {
          set({ cities, officers, pendingCommands: pending });
          get().notify(
            `一鍵委派 · ${assigned} 名武將就任（耗金 ${goldSpent}）`,
            `Auto-assigned ${assigned} officers (−${goldSpent} gold)`,
          );
        }
        return { assigned, goldSpent };
      },

      issueMarch: (sourceId, targetId, officerId, troops, additionalOfficerIds) => {
        const state = get();
        const source = state.cities[sourceId];
        const target = state.cities[targetId];
        const officer = state.officers[officerId];
        const def = COMMAND_DEFS['march'];
        if (!source || !target || !officer)
          return { ok: false, reason: 'invalid' };
        if (source.ownerForceId !== state.playerForceId)
          return { ok: false, reason: 'not your city' };
        // 漕運 — non-adjacent targets are reachable when both cities have
        // linked ports on a connected sea/river route (the picker lists
        // them with 🚢). The fleet does the marching.
        const isNaval = !source.adjacentCityIds.includes(targetId);
        if (isNaval && !navalReachableCityIds(sourceId, state.ports).has(targetId))
          return { ok: false, reason: 'not adjacent' };
        if (officer.locationCityId !== sourceId)
          return { ok: false, reason: 'officer not in this city' };
        if (officer.task)
          return { ok: false, reason: 'officer already assigned' };
        if (state.pendingCommands[officerId])
          return { ok: false, reason: 'officer already has a pending command' };
        if (state.pendingTrainings.some((t) => t.officerId === officerId))
          return { ok: false, reason: 'officer is training at the academy' };
        if (troops <= 0 || troops > source.troops)
          return { ok: false, reason: 'invalid troop count' };
        if (source.gold < def.goldCost)
          return { ok: false, reason: 'not enough gold' };
        if (
          target.ownerForceId &&
          target.ownerForceId !== source.ownerForceId &&
          !isHostilePermitted(
            state.diplomacy,
            source.ownerForceId!,
            target.ownerForceId,
          )
        )
          return {
            ok: false,
            reason: 'diplomatic agreement forbids attack',
          };

        // Validate accompanying officers (max 2, all in same city, all idle).
        const extras = (additionalOfficerIds ?? []).slice(0, 2);
        for (const extraId of extras) {
          const extra = state.officers[extraId];
          if (!extra) return { ok: false, reason: 'invalid accompany' };
          if (extra.locationCityId !== sourceId)
            return { ok: false, reason: 'accompany not in this city' };
          if (extra.task)
            return { ok: false, reason: 'accompany already assigned' };
          if (state.pendingTrainings.some((t) => t.officerId === extraId))
            return { ok: false, reason: 'accompany is training at the academy' };
          if (extra.id === officerId)
            return { ok: false, reason: 'duplicate officer' };
        }

        // Mark all officers busy.
        const officersUpdate = {
          ...state.officers,
          [officerId]: { ...officer, task: 'march' as const },
        };
        for (const extraId of extras) {
          officersUpdate[extraId] = {
            ...state.officers[extraId],
            task: 'march' as const,
          };
        }

        // Sea legs run on the fleet's schedule — two seasons however far
        // the route, which beats any long land march (長江是高速路).
        const dur = isNaval ? 2 : marchDurationFor(source, state.cities[targetId], state.date.season);
        set({
          cities: {
            ...state.cities,
            [sourceId]: { ...source, gold: source.gold - def.goldCost },
          },
          officers: officersUpdate,
          // 出征 — signal the map to play a departure flourish at the origin.
          marchDeparture: {
            key: (state.marchDeparture?.key ?? 0) + 1,
            cityId: sourceId,
            hostile: !!(target.ownerForceId && target.ownerForceId !== source.ownerForceId),
          },
          pendingCommands: {
            ...state.pendingCommands,
            [officerId]: {
              type: 'march',
              cityId: sourceId,
              officerId,
              targetCityId: targetId,
              troops,
              additionalOfficerIds: extras.length > 0 ? extras : undefined,
              seasonsRemaining: dur,
              totalSeasons: dur,
            } as MarchCommand,
          },
          // Mirror the order into the persistent army layer at the source
          // (progress 0) so it shows up as a unit immediately, even before
          // the season resolves.
          armies: {
            ...state.armies,
            [officerId]: {
              id: officerId,
              forceId: source.ownerForceId!,
              commanderId: officerId,
              companionIds: extras,
              troops,
              fromCityId: sourceId,
              targetCityId: targetId,
              x: cityPos(source).x,
              y: cityPos(source).y,
              progress: 0,
              totalSeasons: dur,
            },
          },
          // 積怨 — marching on a force's own city stokes its lasting resentment.
          ...(target.ownerForceId && target.ownerForceId !== source.ownerForceId
            ? { grudges: { ...state.grudges, [target.ownerForceId]: Math.min(100, (state.grudges[target.ownerForceId] ?? 0) + 6) } }
            : {}),
        });
        get().notify(
          `出兵 · ${officer.name.zh} 領 ${troops.toLocaleString()} 兵 → ${target.name.zh}（${dur}季抵達）`,
          `March · ${officer.name.en} leads ${troops.toLocaleString()} → ${target.name.en} (${dur} seasons)`,
        );
        return { ok: true };
      },

      executeScheme: (schemeId, targetA, targetB) => {
        const state = get();
        const def = SCHEME_DEFS.find((d) => d.id === schemeId);
        if (!def || !state.playerForceId) return { ok: false, message: 'invalid' };
        const force = state.forces[state.playerForceId];
        const capital = force ? state.cities[force.capitalCityId] : null;
        if (!capital || capital.gold < def.goldCost)
          return { ok: false, message: `國庫不足(需${def.goldCost}金於首都)` };
        const bad = validateScheme(schemeId, state.cities, state.playerForceId, targetA, targetB);
        if (bad) return { ok: false, message: bad };
        const strategist = pickAdvisor(state.officers, state.playerForceId);
        const odds = schemeOdds(schemeId, state.diplomacy, strategist, targetA, targetB);
        // Pay either way — schemes spend silver before they spend luck.
        const cities = { ...state.cities, [capital.id]: { ...capital, gold: capital.gold - def.goldCost } };
        if (Math.random() >= odds) {
          set({ cities });
          return { ok: false, message: `計不售 — ${state.forces[targetA]?.name.zh ?? targetA}未為所動(耗${def.goldCost}金)` };
        }
        const relations = { ...state.diplomacy.relations };
        const drop = (x: EntityId, y: EntityId, delta: number) => {
          const key = pairKey(x, y);
          const rel = relations[key] ?? { forceA: x < y ? x : y, forceB: x < y ? y : x, score: 0, status: 'neutral' as const };
          relations[key] = { ...rel, score: Math.max(-100, Math.min(100, rel.score + delta)) };
        };
        const seasonNow = state.date.season as 'spring' | 'summer' | 'autumn' | 'winter';
        const marks = [...(state.casusBelliMarks ?? [])];
        let message = '';
        if (schemeId === 'far-friend') {
          drop(state.playerForceId, targetA, +25);
          message = `遠交近攻得售 — 與${state.forces[targetA]?.name.zh ?? targetA}交好(+25)。`;
        } else if (schemeId === 'tiger-wolf') {
          drop(targetA, targetB!, -50);
          marks.push({ byForceId: targetA, targetForceId: targetB!, expiresYear: state.date.year + 2, expiresSeason: seasonNow });
          message = `驅虎吞狼得售 — ${state.forces[targetA]?.name.zh}與${state.forces[targetB!]?.name.zh}交惡,虎已出柙。`;
        } else {
          drop(targetA, targetB!, -30);
          marks.push(
            { byForceId: targetA, targetForceId: targetB!, expiresYear: state.date.year + 2, expiresSeason: seasonNow },
            { byForceId: targetB!, targetForceId: targetA, expiresYear: state.date.year + 2, expiresSeason: seasonNow },
          );
          message = `二虎競食得售 — 兩虎相向,皆得討伐之名。`;
        }
        set({ cities, diplomacy: { ...state.diplomacy, relations }, casusBelliMarks: marks });
        return { ok: true, message };
      },

      startDailyChallenge: (dateStr) => set({ dailyChallengeDate: dateStr }),

      applyPovertyHandicap: () => {
        const state = get();
        if (!state.playerForceId) return;
        const cities = { ...state.cities };
        for (const c of Object.values(cities)) {
          if (c.ownerForceId === state.playerForceId) {
            cities[c.id] = { ...c, gold: Math.floor(c.gold / 2) };
          }
        }
        set({ cities });
      },

      welcomeEmperor: () => {
        const state = get();
        const force = state.playerForceId ? state.forces[state.playerForceId] : null;
        if (!force || !state.playerForceId) return { ok: false, reason: 'no force' };
        if (!canWelcomeEmperor(state.cities, state.emperorCityId ?? EMPEROR_HOME, state.playerForceId, force.capitalCityId))
          return { ok: false, reason: 'not the custodian (or already at your capital)' };
        set({
          emperorCityId: force.capitalCityId,
          mandate: {
            ...state.mandate,
            byForce: {
              ...state.mandate.byForce,
              [state.playerForceId]: Math.min(100, (state.mandate.byForce[state.playerForceId] ?? 50) + 10),
            },
          },
        });
        return { ok: true };
      },

      tradeFood: (cityId, kind, amount) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city || city.ownerForceId !== state.playerForceId || amount <= 0) return { ok: false, got: 0 };
        const season = state.date.season;
        const mkt = { stability: buildingBonuses(cityId, state.buildings).priceStability };
        if (kind === 'buy') {
          if (city.gold < amount) return { ok: false, got: 0 };
          const food = buyQuote(city, season, amount, mkt);
          set({ cities: { ...state.cities, [cityId]: { ...city, gold: city.gold - amount, food: city.food + food } } });
          return { ok: true, got: food };
        }
        if (city.food < amount) return { ok: false, got: 0 };
        const gold = sellQuote(city, season, amount, mkt);
        set({ cities: { ...state.cities, [cityId]: { ...city, food: city.food - amount, gold: city.gold + gold } } });
        return { ok: true, got: gold };
      },

      tradeHorses: (cityId, kind, amount) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city || city.ownerForceId !== state.playerForceId || amount <= 0) return { ok: false, got: 0 };
        const producer = CITY_SPECIALTY[cityId] === 'horse';
        const mkt = { stability: buildingBonuses(cityId, state.buildings).priceStability };
        const held = city.warhorses ?? 0;
        if (kind === 'buy') {
          if (city.gold < amount) return { ok: false, got: 0 };
          const horses = Math.min(buyHorses(city, producer, amount, mkt), WARHORSE_CITY_CAP - held);
          if (horses <= 0) return { ok: false, got: 0 };
          set({ cities: { ...state.cities, [cityId]: { ...city, gold: city.gold - amount, warhorses: held + horses } } });
          return { ok: true, got: horses };
        }
        if (held < amount) return { ok: false, got: 0 };
        const gold = sellHorses(city, producer, amount, mkt);
        set({ cities: { ...state.cities, [cityId]: { ...city, warhorses: held - amount, gold: city.gold + gold } } });
        return { ok: true, got: gold };
      },

      tradeIron: (cityId, kind, amount) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city || city.ownerForceId !== state.playerForceId || amount <= 0) return { ok: false, got: 0 };
        const producer = CITY_SPECIALTY[cityId] === 'iron';
        const mkt = { stability: buildingBonuses(cityId, state.buildings).priceStability };
        const held = city.iron ?? 0;
        if (kind === 'buy') {
          if (city.gold < amount) return { ok: false, got: 0 };
          const iron = Math.min(buyIron(city, producer, amount, mkt), IRON_CITY_CAP - held);
          if (iron <= 0) return { ok: false, got: 0 };
          set({ cities: { ...state.cities, [cityId]: { ...city, gold: city.gold - amount, iron: held + iron } } });
          return { ok: true, got: iron };
        }
        if (held < amount) return { ok: false, got: 0 };
        const gold = sellIron(city, producer, amount, mkt);
        set({ cities: { ...state.cities, [cityId]: { ...city, iron: held - amount, gold: city.gold + gold } } });
        return { ok: true, got: gold };
      },

      borderTrade: (myCityId, theirCityId, kind, amount) => {
        const state = get();
        const pid = state.playerForceId;
        const mine = state.cities[myCityId];
        const theirs = state.cities[theirCityId];
        if (!pid || !mine || !theirs || amount <= 0) return { ok: false, got: 0 };
        if (mine.ownerForceId !== pid) return { ok: false, got: 0, reason: '非我城' };
        if (theirs.ownerForceId === pid || theirs.ownerForceId == null) return { ok: false, got: 0, reason: '無外邦' };
        if (!mine.adjacentCityIds.includes(theirCityId)) return { ok: false, got: 0, reason: '不接壤' };
        // Peace gate — 榷場 only opens to allies / non-aggression partners.
        const rel = getRelation(state.diplomacy, pid, theirs.ownerForceId);
        if (rel.status !== 'allied' && rel.status !== 'non-aggression') return { ok: false, got: 0, reason: '需通好' };
        const season = state.date.season;
        // Priced by THEIR market (their glut/scarcity) plus a border tariff that a
        // developed 市舶司 (in my border city) whittles down.
        const theirMkt = { stability: buildingBonuses(theirCityId, state.buildings).priceStability };
        const tariff = borderTariff(buildingBonuses(myCityId, state.buildings).tradeMul);
        if (kind === 'buy') {
          // I buy their grain: I pay `amount` gold, they ship grain from their stores.
          if (mine.gold < amount) return { ok: false, got: 0, reason: '府庫金不足' };
          const food = Math.floor(buyQuote(theirs, season, amount, theirMkt) * (1 - tariff));
          // The seller won't strip its own garrison bare.
          const spareFood = Math.max(0, theirs.food - theirs.troops * 2);
          if (food <= 0 || spareFood < food) return { ok: false, got: 0, reason: '對方無餘糧' };
          set({ cities: { ...state.cities,
            [myCityId]: { ...mine, gold: mine.gold - amount, food: mine.food + food },
            [theirCityId]: { ...theirs, food: theirs.food - food, gold: theirs.gold + amount },
          } });
          return { ok: true, got: food };
        }
        // I sell them grain: I ship `amount` food, they pay gold from their treasury.
        if (mine.food < amount) return { ok: false, got: 0, reason: '存糧不足' };
        const gold = Math.floor(sellQuote(theirs, season, amount, theirMkt) * (1 - tariff));
        if (gold <= 0 || theirs.gold < gold) return { ok: false, got: 0, reason: '對方金不足' };
        set({ cities: { ...state.cities,
          [myCityId]: { ...mine, food: mine.food - amount, gold: mine.gold + gold },
          [theirCityId]: { ...theirs, gold: theirs.gold - gold, food: theirs.food + amount },
        } });
        return { ok: true, got: gold };
      },

      dispatchConvoy: (fromCityId, toCityId, food, gold, troops = 0, officerId, cautious = false, warhorses = 0, iron = 0, medicine = 0, toArmyId) => {
        const state = get();
        const pid = state.playerForceId;
        if (!pid) return { ok: false, seasons: 0 };
        const from = state.cities[fromCityId];
        if (!from || from.ownerForceId !== pid) return { ok: false, seasons: 0 };
        // 直供前線 — a column may be bound for a friendly field army instead of a
        // city; it then routes to (and reckons road raids by) the army's objective
        // city, but empties into the army on arrival. Army hauls carry only grain
        // and reinforcements.
        const targetArmy = toArmyId ? state.armies[toArmyId] : undefined;
        if (toArmyId && (!targetArmy || targetArmy.forceId !== pid)) return { ok: false, seasons: 0, reason: 'army not afoot' };
        const to = targetArmy ? state.cities[targetArmy.targetCityId] : state.cities[toCityId];
        if (!to) return { ok: false, seasons: 0 };
        if (!targetArmy) {
          if (fromCityId === toCityId) return { ok: false, seasons: 0 };
          if (to.ownerForceId !== pid) return { ok: false, seasons: 0 };
        }
        // 押運武将 — a column must be run by an available officer standing in the
        // source city; his 政治 caps the load and (with his temperament) sets the pace.
        const officer = state.officers[officerId];
        if (!officer || officer.forceId !== pid) return { ok: false, seasons: 0, reason: 'need an officer' };
        if (officer.locationCityId !== fromCityId) return { ok: false, seasons: 0, reason: 'officer not in this city' };
        if (officer.task || state.pendingCommands[officerId]) return { ok: false, seasons: 0, reason: 'officer is busy' };
        if (state.pendingTrainings.some((tr) => tr.officerId === officerId)) return { ok: false, seasons: 0, reason: 'officer is training' };
        let shipFood = Math.min(Math.max(0, Math.floor(food)), from.food);
        let shipGold = Math.min(Math.max(0, Math.floor(gold)), from.gold);
        // Keep a token garrison behind — never ship the city's last 100 men.
        let shipTroops = Math.min(Math.max(0, Math.floor(troops)), Math.max(0, from.troops - 100));
        let shipHorses = Math.min(Math.max(0, Math.floor(warhorses)), from.warhorses ?? 0);
        let shipIron = Math.min(Math.max(0, Math.floor(iron)), from.iron ?? 0);
        let shipMed = Math.min(Math.max(0, Math.floor(medicine)), from.medicine ?? 0);
        // A column to a field army carries only grain and reinforcements — coin
        // and strategic goods have no granary to land in out in the field.
        if (targetArmy) { shipGold = 0; shipHorses = 0; shipIron = 0; shipMed = 0; }
        // 載量 — clamp the total to what this officer can shepherd (scaling down
        // proportionally if the player asked for more than his 政治 allows).
        // 驛傳 — a supply depot in the dispatching city widens the convoy.
        const cap = Math.floor(convoyCapacity(officer) * buildingBonuses(fromCityId, state.buildings).convoyMul);
        const total = shipFood + shipGold + shipTroops + shipHorses + shipIron + shipMed;
        if (total > cap && total > 0) {
          const scale = cap / total;
          shipFood = Math.floor(shipFood * scale);
          shipGold = Math.floor(shipGold * scale);
          shipTroops = Math.floor(shipTroops * scale);
          shipHorses = Math.floor(shipHorses * scale);
          shipIron = Math.floor(shipIron * scale);
          shipMed = Math.floor(shipMed * scale);
        }
        if (shipFood <= 0 && shipGold <= 0 && shipTroops <= 0 && shipHorses <= 0 && shipIron <= 0 && shipMed <= 0) return { ok: false, seasons: 0 };
        // 木牛流馬 — Zhuge Liang's logistics device (an officer skill). In a
        // force's service it speeds transport ~40% and halves road spoilage.
        const woodenOx = Object.values(state.officers).some(
          (o) => o.forceId === pid && o.status !== 'dead' && (o.skills ?? []).includes('wooden-ox'),
        );
        // 漕運損耗 — spoilage/attrition grows with the haul (≈6% per season past
        // the first), winter roads add a little, all capped; 木牛流馬 halves it.
        // 漕運 — port-to-port over water (and not already land-adjacent): faster
        // and gentler on the cargo than an overland haul.
        const naval = !from.adjacentCityIds.includes(to.id) && navalReachableCityIds(fromCityId, state.ports).has(to.id);
        const baseSeasons = Math.max(1, marchDurationFor(from, to, state.date.season));
        const plan = planConvoy({ baseSeasons, season: state.date.season, officer, naval, woodenOx, cautious });
        const keep = plan.keepFrac;
        const arriveFood = Math.floor(shipFood * keep);
        const arriveGold = Math.floor(shipGold * keep);
        const arriveTroops = Math.floor(shipTroops * keep);
        const arriveHorses = Math.floor(shipHorses * keep);
        const arriveIron = Math.floor(shipIron * keep);
        const arriveMed = Math.floor(shipMed * keep);
        const seasons = plan.seasons;
        const id = `convoy-${fromCityId}-${to.id}-${state.date.year}-${state.date.season}-${Object.keys(state.convoys ?? {}).length}`;
        set({
          cities: {
            ...state.cities,
            [fromCityId]: {
              ...from,
              food: from.food - shipFood,
              gold: from.gold - shipGold,
              troops: from.troops - shipTroops,
              ...(shipHorses > 0 ? { warhorses: (from.warhorses ?? 0) - shipHorses } : {}),
              ...(shipIron > 0 ? { iron: (from.iron ?? 0) - shipIron } : {}),
              ...(shipMed > 0 ? { medicine: (from.medicine ?? 0) - shipMed } : {}),
            },
          },
          // The escorting officer rides out with the column (off the rosters
          // until it arrives, where they reappear).
          officers: {
            ...state.officers,
            [officerId]: { ...officer, locationCityId: null, task: null },
          },
          convoys: {
            ...state.convoys,
            [id]: {
              id, forceId: pid, officerId,
              fromCityId, toCityId: to.id,
              ...(targetArmy ? { toArmyId } : {}),
              food: arriveFood, gold: arriveGold, troops: arriveTroops,
              ...(arriveHorses > 0 ? { warhorses: arriveHorses } : {}),
              ...(arriveIron > 0 ? { iron: arriveIron } : {}),
              ...(arriveMed > 0 ? { medicine: arriveMed } : {}),
              seasonsRemaining: seasons, totalSeasons: seasons,
              ...(naval ? { naval: true } : {}),
              ...(cautious ? { cautious: true } : {}),
            },
          },
        });
        const cargo = [arriveFood > 0 ? `糧 ${arriveFood.toLocaleString()}` : '', arriveGold > 0 ? `金 ${arriveGold.toLocaleString()}` : '', arriveTroops > 0 ? `兵 ${arriveTroops.toLocaleString()}` : '', arriveHorses > 0 ? `馬 ${arriveHorses.toLocaleString()}` : '', arriveIron > 0 ? `鐵 ${arriveIron.toLocaleString()}` : '', arriveMed > 0 ? `藥 ${arriveMed.toLocaleString()}` : ''].filter(Boolean).join('、');
        const destZh = targetArmy ? `${state.officers[targetArmy.commanderId]?.name.zh ?? ''}前軍(${to.name.zh}下)` : to.name.zh;
        const destEn = targetArmy ? `${state.officers[targetArmy.commanderId]?.name.en ?? 'the army'} (at ${to.name.en})` : to.name.en;
        get().notify(
          `輜重啟運 · ${from.name.zh} → ${destZh}(${cargo},${seasons}季抵達)`,
          `Convoy dispatched · ${from.name.en} → ${destEn} (${seasons} seasons)`,
        );
        return { ok: true, seasons };
      },

      recallConvoy: (id) => {
        const state = get();
        const c = state.convoys[id];
        if (!c) return;
        const convoys = { ...state.convoys };
        delete convoys[id];
        const home = state.cities[c.fromCityId];
        // The escort rides home with the column (back onto the roster).
        const oid = c.officerId;
        const escort = oid ? state.officers[oid] : null;
        const officersBack = oid && escort
          ? { ...state.officers, [oid]: { ...escort, locationCityId: c.fromCityId, status: 'idle' as const, task: null } }
          : state.officers;
        if (home && home.ownerForceId === c.forceId) {
          set({
            convoys,
            officers: officersBack,
            cities: { ...state.cities, [c.fromCityId]: {
              ...home,
              food: home.food + c.food,
              gold: home.gold + c.gold,
              troops: home.troops + c.troops,
              ...((c.warhorses ?? 0) > 0 ? { warhorses: Math.min(WARHORSE_CITY_CAP, (home.warhorses ?? 0) + (c.warhorses ?? 0)) } : {}),
              ...((c.iron ?? 0) > 0 ? { iron: Math.min(IRON_CITY_CAP, (home.iron ?? 0) + (c.iron ?? 0)) } : {}),
              ...((c.medicine ?? 0) > 0 ? { medicine: Math.min(MEDICINE_CITY_CAP, (home.medicine ?? 0) + (c.medicine ?? 0)) } : {}),
            } },
          });
          get().notify(`輜重召回 · 貨返 ${home.name.zh}`, `Convoy recalled to ${home.name.en}`);
        } else {
          set({ convoys, officers: officersBack });
        }
      },

      setStandingRoute: (fromCityId, toCityId, on) => {
        const state = get();
        const routes = (state.standingRoutes ?? []).filter((r) => !(r.fromCityId === fromCityId && r.toCityId === toCityId));
        set({ standingRoutes: on ? [...routes, { fromCityId, toCityId }] : routes });
      },

      spottedEnemyConvoys: () => {
        const state = get();
        const pid = state.playerForceId;
        if (!pid) return [];
        const out: Array<{ convoy: import('../systems/convoy').Convoy; fromCityId: EntityId; x: number; y: number }> = [];
        for (const cv of Object.values(state.convoys)) {
          if (cv.forceId === pid) continue;
          if (!isHostilePermitted(state.diplomacy, pid, cv.forceId)) continue;
          // Spotted when the column's nearest stronghold is one of ours — the same
          // geometry by which our garrison would sortie on it (the launch city).
          const pos = convoyMapPos(cv, state.cities);
          const near = nearestCityTo(pos.x, pos.y, state.cities);
          if (!near || near.ownerForceId !== pid) continue;
          out.push({ convoy: cv, fromCityId: near.id, x: pos.x, y: pos.y });
        }
        return out;
      },

      raidConvoy: (targetConvoyId, fromCityId, officerId, troops) => {
        const state = get();
        const pid = state.playerForceId;
        if (!pid) return { ok: false };
        const target = state.convoys[targetConvoyId];
        if (!target || target.forceId === pid) return { ok: false, reason: 'not an enemy convoy' };
        if (!isHostilePermitted(state.diplomacy, pid, target.forceId)) return { ok: false, reason: 'not at war' };
        const from = state.cities[fromCityId];
        if (!from || from.ownerForceId !== pid) return { ok: false, reason: 'not your city' };
        // The launch city must be the stronghold nearest the spotted column.
        const pos = convoyMapPos(target, state.cities);
        if (nearestCityTo(pos.x, pos.y, state.cities)?.id !== fromCityId) return { ok: false, reason: 'out of reach' };
        const officer = state.officers[officerId];
        if (!officer || officer.forceId !== pid || officer.locationCityId !== fromCityId || officer.task || state.pendingCommands[officerId]) {
          return { ok: false, reason: 'officer unavailable' };
        }
        if (state.pendingTrainings.some((tr) => tr.officerId === officerId)) return { ok: false, reason: 'officer is training' };
        const send = Math.min(Math.max(0, Math.floor(troops)), Math.max(0, from.troops - 100));
        if (send < 1) return { ok: false, reason: 'no troops to spare' };
        const id = `raid-${fromCityId}-${targetConvoyId}-${state.date.year}-${state.date.season}`;
        set({
          cities: { ...state.cities, [fromCityId]: { ...from, troops: from.troops - send } },
          officers: { ...state.officers, [officerId]: { ...officer, locationCityId: null, task: null } },
          raids: { ...state.raids, [id]: { id, forceId: pid, officerId, troops: send, fromCityId, targetConvoyId, seasonsRemaining: 1 } },
        });
        get().notify(
          `遣 ${officer.name.zh} 將 ${send.toLocaleString()} 騎截劫敵糧道`,
          `${officer.name.en} rides out to raid the supply column`,
        );
        return { ok: true };
      },

      dispatchExpedition: (officerId, fromCityId, toCityId, mode) => {
        const state = get();
        const pid = state.playerForceId;
        if (!pid) return { ok: false, seasons: 0 };
        const from = state.cities[fromCityId];
        const to = state.cities[toCityId];
        if (!from || !to || fromCityId === toCityId) return { ok: false, seasons: 0, reason: 'bad route' };
        if (from.ownerForceId !== pid) return { ok: false, seasons: 0, reason: 'not your city' };
        const officer = state.officers[officerId];
        if (!officer || officer.forceId !== pid) return { ok: false, seasons: 0, reason: 'need an officer' };
        if (officer.locationCityId !== fromCityId) return { ok: false, seasons: 0, reason: 'officer not in this city' };
        if (officer.task || state.pendingCommands[officerId]) return { ok: false, seasons: 0, reason: 'officer is busy' };
        if (state.pendingTrainings.some((tr) => tr.officerId === officerId)) return { ok: false, seasons: 0, reason: 'officer is training' };
        // 出使/策反/刺探 act on a foreign power — the target must be someone else's.
        const foreign = to.ownerForceId != null && to.ownerForceId !== pid;
        if (mode !== 'explore' && !foreign) return { ok: false, seasons: 0, reason: 'target must be a foreign city' };
        const baseSeasons = Math.max(1, marchDurationFor(from, to, state.date.season));
        const legSeasons = expeditionLegSeasons(baseSeasons, officer);
        const id = `exp-${officerId}-${toCityId}-${state.date.year}-${state.date.season}-${Object.keys(state.expeditions ?? {}).length}`;
        set({
          // The officer rides out alone (off the city rosters until he returns).
          officers: { ...state.officers, [officerId]: { ...officer, locationCityId: null, task: null, status: 'active' } },
          expeditions: {
            ...state.expeditions,
            [id]: { id, officerId, forceId: pid, fromCityId, toCityId, mode, phase: 'outbound', seasonsRemaining: legSeasons, legSeasons },
          },
        });
        get().notify(
          `游历啟程 · ${officer.name.zh} → ${to.name.zh}(來回約 ${legSeasons * 2} 季)`,
          `${officer.name.en} sets out for ${to.name.en} (~${legSeasons * 2} seasons round trip)`,
        );
        return { ok: true, seasons: legSeasons };
      },

      recallExpedition: (id) => {
        const state = get();
        const exp = state.expeditions[id];
        if (!exp) return;
        const expeditions = { ...state.expeditions };
        // Still outbound — turn him around now, the errand abandoned. Already
        // homeward — leave him to finish the leg.
        if (exp.phase === 'outbound') {
          expeditions[id] = { ...exp, phase: 'returning', seasonsRemaining: exp.legSeasons, haul: undefined };
        }
        set({ expeditions });
        const o = state.officers[exp.officerId];
        get().notify(`游历召回 · ${o?.name.zh ?? ''}啟程歸返`, `Recalled ${o?.name.en ?? 'officer'} — heading home`);
      },

      dispatchEmbassy: (officerId, fromCityId, realmId) => {
        const state = get();
        const pid = state.playerForceId;
        if (!pid) return { ok: false, seasons: 0 };
        const from = state.cities[fromCityId];
        if (!from || from.ownerForceId !== pid) return { ok: false, seasons: 0, reason: 'not your city' };
        const officer = state.officers[officerId];
        if (!officer || officer.forceId !== pid) return { ok: false, seasons: 0, reason: 'need an officer' };
        if (officer.locationCityId !== fromCityId) return { ok: false, seasons: 0, reason: 'officer not in this city' };
        if (officer.task || state.pendingCommands[officerId]) return { ok: false, seasons: 0, reason: 'officer is busy' };
        if (state.pendingTrainings.some((tr) => tr.officerId === officerId)) return { ok: false, seasons: 0, reason: 'officer is training' };
        const target = getEmbassyTarget(realmId);
        if (!target) return { ok: false, seasons: 0, reason: 'unknown realm' };
        const leg = embassyLegSeasons(target, officer);
        const id = `emb-${officerId}-${realmId}-${state.date.year}-${state.date.season}-${Object.keys(state.expeditions ?? {}).length}`;
        set({
          officers: { ...state.officers, [officerId]: { ...officer, locationCityId: null, task: null, status: 'active' } },
          expeditions: {
            ...state.expeditions,
            [id]: { id, officerId, forceId: pid, fromCityId, toCityId: '', toRealmId: realmId, mode: 'embassy', phase: 'outbound', seasonsRemaining: leg, legSeasons: leg },
          },
        });
        get().notify(
          `遠使啟程 · ${officer.name.zh} → ${target.name.zh}(來回約 ${leg * 2} 季)`,
          `${officer.name.en} sets out for ${target.name.en} (~${leg * 2} seasons round trip)`,
        );
        return { ok: true, seasons: leg };
      },

      createLegion: (legion) => {
        const st = get();
        // 品階門檻 — only a 金牌+ 名將 may serve as 軍團都督.
        const cmdr = st.officers[legion.commanderId];
        if (!cmdr || gradeRank(officerGrade(cmdr).grade) < gradeRank('gold')) {
          st.notify('品階不足 · 軍團都督須金牌+', 'A legion commander must be Gold grade or above', 'warn');
          return;
        }
        const id = `legion-${(st.legions ?? []).reduce((m, l) => Math.max(m, Number(l.id.split('-')[1] ?? 0)), 0) + 1}`;
        set({ legions: [...(st.legions ?? []), { ...legion, id }] });
      },

      disbandLegion: (legionId) => {
        set({ legions: (get().legions ?? []).filter((l) => l.id !== legionId) });
      },

      delegateCity: (cityId, officerId) => {
        const s = get();
        const city = s.cities[cityId];
        const gov = officerId ? s.officers[officerId] : null;
        // 品階門檻 — a 大城/都 demands a 金牌+ 太守; lesser officers may govern smaller seats.
        if (gov && city && citySizeRank(citySize(city).id) >= citySizeRank('large')
            && gradeRank(officerGrade(gov).grade) < gradeRank('gold')) {
          s.notify(`品階不足 · ${gov.name.zh} 難當大城太守(須金牌+)`, `${gov.name.en} lacks the grade to govern a great city (needs Gold+)`, 'warn');
          return;
        }
        const next = { ...s.cityDelegations };
        if (officerId) next[cityId] = officerId;
        else delete next[cityId];
        set({ cityDelegations: next });
        if (city) {
          if (gov) s.notify(`委任太守 · ${gov.name.zh} 治 ${city.name.zh}`, `Governor · ${gov.name.en} now runs ${city.name.en}`);
          else s.notify(`撤太守 · ${city.name.zh} 收歸親理`, `Governor recalled · ${city.name.en}`, 'warn');
        }
      },

      massMuster: (targetCityId) => {
        const state = get();
        if (!state.playerForceId) return 0;
        const orders = planMassMuster({
          cities: state.cities,
          officers: state.officers,
          pendingCommandOfficerIds: new Set(Object.keys(state.pendingCommands)),
          trainingOfficerIds: new Set(state.pendingTrainings.map((t) => t.officerId)),
          playerForceId: state.playerForceId,
          targetCityId,
        });
        // Execute through the ordinary march so every validation (diplomacy,
        // gold, naval reach) still applies; a refused column just stays home.
        let dispatched = 0;
        for (const o of orders) {
          if (get().issueMarch(o.cityId, o.marchTo, o.officerId, o.troops).ok) dispatched++;
        }
        return dispatched;
      },

      cancelCommand: (idOrOfficerId) => {
        // Backwards-compatible: accepts either an officerId (preferred) or a cityId
        // (legacy — finds the first command in that city if any).
        const state = get();
        let cmd: Command | undefined = state.pendingCommands[idOrOfficerId];
        if (!cmd) {
          // Legacy: try as cityId
          cmd = Object.values(state.pendingCommands).find((c) => c.cityId === idOrOfficerId);
        }
        if (!cmd) return;
        const officerKey = cmd.officerId;
        const city = state.cities[cmd.cityId];
        const officer = state.officers[cmd.officerId];
        const def = COMMAND_DEFS[cmd.type];
        const next = { ...state.pendingCommands };
        delete next[officerKey];

        // Free up all officers (including march accompaniers).
        const officersUpdate = { ...state.officers };
        if (officer)
          officersUpdate[cmd.officerId] = { ...officer, task: null };
        if (cmd.type === 'march' && cmd.additionalOfficerIds) {
          for (const xId of cmd.additionalOfficerIds) {
            const x = state.officers[xId];
            if (x) officersUpdate[xId] = { ...x, task: null };
          }
        }
        // 協同施政 — free the assistants too.
        if (cmd.type !== 'march' && cmd.assistantOfficerIds) {
          for (const xId of cmd.assistantOfficerIds) {
            const x = state.officers[xId];
            if (x) officersUpdate[xId] = { ...x, task: null };
          }
        }

        const nextArmies = { ...state.armies };
        delete nextArmies[officerKey];
        set({
          cities: city
            ? { ...state.cities, [cmd.cityId]: { ...city, gold: city.gold + def.goldCost } }
            : state.cities,
          officers: officersUpdate,
          pendingCommands: next,
          armies: nextArmies,
        });
      },

      startTraining: (officerId, cityId, policyId, mentorOfficerId) => {
        const state = get();
        const officer = state.officers[officerId];
        const city = state.cities[cityId];
        const mentor = mentorOfficerId ? state.officers[mentorOfficerId] : undefined;
        if (!officer || !city) return { ok: false, reason: 'invalid' };
        if (city.ownerForceId !== state.playerForceId)
          return { ok: false, reason: 'not your city' };
        if (mentorOfficerId && !mentor) return { ok: false, reason: 'invalid mentor' };
        const check = canTrain(officer, city, policyId, state.buildings, state.pendingTrainings, mentor);
        if (!check.ok) return { ok: false, reason: check.reasonZh };

        // X2 — if the officer has a wish to learn this exact policy, they
        // get a 50% tuition discount; the loyalty bonus is granted on
        // completion (handled in the training tick).
        const matchingWish = state.officerWishes.find(
          (w) => w.officerId === officerId && w.kind === 'learn-policy' && w.targetId === policyId,
        );

        // Mentor mode — no academy, no gold, +1 season vs academy equivalent.
        if (mentor) {
          const duration = mentorDurationSeasons(officer, city, policyId, mentor, state.family);
          set({
            pendingTrainings: [
              ...state.pendingTrainings,
              { officerId, cityId, policyId, seasonsLeft: duration, goldSpent: 0, mentorOfficerId: mentor.id },
            ],
          });
          return { ok: true };
        }

        const baseCost = trainingCost(officer);
        const cost = matchingWish ? Math.floor(baseCost / 2) : baseCost;
        const duration = trainingDurationSeasons(officer, city, policyId, state.buildings);
        // Imperial Academy (lv3) — instant learning. Apply the policy now,
        // no pendingTraining entry, so the player sees immediate effect.
        if (duration <= 0) {
          const have = officer.policies ?? [];
          if (have.includes(policyId)) return { ok: false, reason: '已通此政策' };
          const advisorMul = appointmentBonusFor(
            officer.forceId,
            state.appointments,
            state.officers,
          ).advisorMultiplier;
          const newLoyalty = matchingWish
            ? Math.min(100, officer.loyalty + Math.ceil(matchingWish.grantBonus * advisorMul))
            : officer.loyalty;
          set({
            cities: {
              ...state.cities,
              [cityId]: { ...city, gold: city.gold - cost },
            },
            officers: {
              ...state.officers,
              [officerId]: { ...officer, policies: [...have, policyId], loyalty: newLoyalty },
            },
            officerWishes: matchingWish
              ? state.officerWishes.filter((w) => w.id !== matchingWish.id)
              : state.officerWishes,
          });
          return { ok: true };
        }
        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - cost },
          },
          pendingTrainings: [
            ...state.pendingTrainings,
            { officerId, cityId, policyId, seasonsLeft: duration, goldSpent: cost },
          ],
        });
        return { ok: true };
      },

      startTacticTraining: (officerId, cityId, tacticId, mentorOfficerId) => {
        const state = get();
        const officer = state.officers[officerId];
        const city = state.cities[cityId];
        const mentor = mentorOfficerId ? state.officers[mentorOfficerId] : undefined;
        if (!officer || !city) return { ok: false, reason: 'invalid' };
        if (city.ownerForceId !== state.playerForceId) return { ok: false, reason: 'not your city' };
        if (mentorOfficerId && !mentor) return { ok: false, reason: 'invalid mentor' };
        const check = canTrainTactic(officer, city, tacticId, state.buildings, state.pendingTrainings, mentor);
        if (!check.ok) return { ok: false, reason: check.reasonZh };

        if (mentor) {
          const duration = tacticMentorDurationSeasons(officer, city, tacticId, mentor, state.family);
          set({
            pendingTrainings: [
              ...state.pendingTrainings,
              { officerId, cityId, kind: 'tactic', policyId: 'tuntian' as never, tacticId, seasonsLeft: duration, goldSpent: 0, mentorOfficerId: mentor.id },
            ],
          });
          return { ok: true };
        }

        const cost = tacticTrainingCost(officer);
        const duration = tacticDurationSeasons(officer, city, tacticId, state.buildings);
        if (duration <= 0) {
          // Imperial Academy — instant
          const have = officer.tactics ?? [];
          if (have.includes(tacticId)) return { ok: false, reason: '已通此戰法' };
          set({
            cities: { ...state.cities, [cityId]: { ...city, gold: city.gold - cost } },
            officers: { ...state.officers, [officerId]: { ...officer, tactics: [...have, tacticId] } },
          });
          return { ok: true };
        }
        set({
          cities: { ...state.cities, [cityId]: { ...city, gold: city.gold - cost } },
          pendingTrainings: [
            ...state.pendingTrainings,
            { officerId, cityId, kind: 'tactic', policyId: 'tuntian' as never, tacticId, seasonsLeft: duration, goldSpent: cost },
          ],
        });
        return { ok: true };
      },

      cancelTraining: (officerId) => {
        const state = get();
        const idx = state.pendingTrainings.findIndex((t) => t.officerId === officerId);
        if (idx < 0) return;
        const t = state.pendingTrainings[idx];
        const city = state.cities[t.cityId];
        const refund = Math.floor(t.goldSpent / 2);
        const next = state.pendingTrainings.filter((x) => x.officerId !== officerId);
        set({
          pendingTrainings: next,
          cities: city
            ? { ...state.cities, [t.cityId]: { ...city, gold: city.gold + refund } }
            : state.cities,
        });
      },

      buildDefenseStructure: (cityId, slot, buildingId) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city) return { ok: false, reason: 'no city' };
        if (city.ownerForceId !== state.playerForceId)
          return { ok: false, reason: 'not your city' };
        if (slot < 0 || slot > 7) return { ok: false, reason: 'invalid slot' };
const def = DEFENSE_BUILDINGS[buildingId];
        if (!def) return { ok: false, reason: 'unknown building' };
        if (def.requiresTerrain === 'river' && !city.port)
          return { ok: false, reason: 'requires river/port city' };
        if (def.requiresTerrain === 'mountain' && city.terrain !== 'mountain')
          return { ok: false, reason: 'requires mountain terrain' };
        if (city.gold < def.goldCost) return { ok: false, reason: 'not enough gold' };
        const slots = city.buildSlots ?? [];
        const existingIdx = slots.findIndex((s) => s.slot === slot);
        if (existingIdx >= 0 && slots[existingIdx].buildingId)
          return { ok: false, reason: 'slot already built' };
        const newSlot = { slot, buildingId, level: 1 } as import('../types').BuildSlot;
        const newSlots = existingIdx >= 0
          ? slots.map((s, i) => (i === existingIdx ? newSlot : s))
          : [...slots, newSlot];
        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - def.goldCost, buildSlots: newSlots },
          },
        });
        return { ok: true };
      },

      upgradeDefenseStructure: (cityId, slot) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city) return { ok: false, reason: 'no city' };
        if (city.ownerForceId !== state.playerForceId)
          return { ok: false, reason: 'not your city' };
        const slots = city.buildSlots ?? [];
        const idx = slots.findIndex((s) => s.slot === slot);
        if (idx < 0 || !slots[idx].buildingId)
          return { ok: false, reason: 'nothing to upgrade' };
        const current = slots[idx];
const def = DEFENSE_BUILDINGS[current.buildingId!];
        if (current.level >= def.maxLevel)
          return { ok: false, reason: 'already at max level' };
        // Upgrade cost = base cost × (current level + 1).
        const upgradeCost = def.goldCost * (current.level + 1);
        if (city.gold < upgradeCost) return { ok: false, reason: 'not enough gold' };
        const newSlots = slots.map((s, i) =>
          i === idx ? { ...s, level: s.level + 1 } : s,
        );
        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - upgradeCost, buildSlots: newSlots },
          },
        });
        return { ok: true };
      },

      demolishDefenseStructure: (cityId, slot) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city || city.ownerForceId !== state.playerForceId) return;
        const slots = city.buildSlots ?? [];
        const newSlots = slots.filter((s) => s.slot !== slot);
        set({
          cities: { ...state.cities, [cityId]: { ...city, buildSlots: newSlots } },
        });
      },

      endSeason: () => {
        // 委任太守 — delegated cities file their governor's order first,
        // through the ordinary command pipeline (costs, report and all).
        {
          const s0 = get();
          if (s0.victoryStatus !== 'playing' && s0.victoryStatus !== 'observing') return;
          for (const [cid, govId] of Object.entries(s0.cityDelegations ?? {})) {
            const c = get().cities[cid];
            const gov = get().officers[govId];
            if (!c || !gov || c.ownerForceId !== s0.playerForceId) continue;
            if (gov.locationCityId !== cid || gov.task || get().pendingCommands[govId]) continue;
            if (s0.pendingTrainings.some((t) => t.officerId === govId)) continue;
            const type = planGovernorCommand(c, gov);
            if (type) get().issueCommand(cid, type, govId);
          }
          // 軍團都督 — each legion files its marshal's orders the same way.
          for (const legion of s0.legions ?? []) {
            const cur = get();
            const busy = new Set<EntityId>([
              ...Object.keys(cur.pendingCommands),
              ...cur.pendingTrainings.map((t) => t.officerId),
            ]);
            const orders = planLegionOrders({
              cities: cur.cities,
              officers: cur.officers,
              busyOfficerIds: busy,
              playerForceId: s0.playerForceId ?? '',
              legion,
            });
            for (const o of orders) {
              if (o.kind === 'march') get().issueMarch(o.cityId, o.toCityId, o.officerId, o.troops);
              else get().issueCommand(o.cityId, 'recruit-troops', o.officerId);
            }
          }
        }
        const state = get();
        if (state.victoryStatus !== 'playing' && state.victoryStatus !== 'observing')
          return;
        // AI rulers issue their commands for the season.
        // AI civic appointments + military promotions — runs before the AI
        // turn so the resulting force bonuses (e.g. 軍師 +10% power) apply
        // this very season.
        const aiAppts = planAIAppointments({
          forces: state.forces,
          officers: state.officers,
          cities: state.cities,
          appointments: state.appointments,
          deeds: state.deeds,
          playerForceId: state.playerForceId,
          year: state.date.year,
        });
        const officersAfterAppts = aiAppts.officers;
        let appointmentsAfterAI = aiAppts.appointments;

        // AI court: imperial-rank promotions + edict issuance. Runs after
        // appointments so a freshly-appointed 丞相 unlocks 公爵 this turn.
        const aiCourt = planAICourt({
          forces: state.forces,
          officers: officersAfterAppts,
          cities: state.cities,
          appointments: appointmentsAfterAI,
          edictCooldowns: state.edictCooldowns,
          deeds: state.deeds,
          diplomacy: state.diplomacy,
          eventFlags: state.eventFlags,
          mandate: state.mandate,
          date: state.date,
          playerForceId: state.playerForceId,
          rng: Math.random,
        });
        const forcesAfterCourt = aiCourt.forces;
        const officersAfterCourt = aiCourt.officers;
        const citiesAfterCourt = aiCourt.cities;
        const edictHistoryAfterCourt = [...state.edictHistory, ...aiCourt.edictHistory];
        const edictCooldownsAfterCourt = aiCourt.edictCooldowns;
        const casusBelliAfterCourt = [...state.casusBelliMarks, ...aiCourt.casusBelliMarks];
        // Enthronement flags for AI emperors (gates further promotion).
        const eventFlagsAfterCourt = { ...state.eventFlags };
        for (const eid of aiCourt.newEnthronements) {
          eventFlagsAfterCourt['enthroned-' + eid] = true;
        }

        const planned = planAITurn({
          cities: citiesAfterCourt,
          officers: officersAfterCourt,
          forces: forcesAfterCourt,
          playerForceId: state.playerForceId,
          pendingCommands: state.pendingCommands,
          pendingTrainings: state.pendingTrainings,
          buildings: state.buildings,
          difficulty: state.difficulty,
          aiStrength: state.aiStrength ?? 3,
          diplomacy: state.diplomacy,
          runtimeBonds: state.runtimeBonds,
          rapport: state.rapport,
          family: state.family,
          appointments: appointmentsAfterAI,
          territoryOwnership: state.territoryOwnership ?? {},
          armies: state.armies,
          taxPolicy: state.taxPolicy,
          date: state.date,
        });
        // Compute whether this period transition crosses a season boundary.
        // Boundary = the period BEFORE advance is the last (lower) phase of
        // the last month of a season (months 3/6/9/12).
        const isLastMonthOfSeason =
          state.date.month === 3 || state.date.month === 6 ||
          state.date.month === 9 || state.date.month === 12;
        const seasonBoundary =
          (state.date.phase ?? 'lower') === 'lower' && isLastMonthOfSeason;

        const result = resolveSeason({
          date: state.date,
          cities: planned.cities,
          officers: planned.officers,
          buildings: state.buildings,
          forces: forcesAfterCourt,
          pendingCommands: planned.pendingCommands,
          diplomacy: planned.diplomacy,
          runtimeBonds: planned.runtimeBonds,
          rapport: planned.rapport ?? state.rapport,
          lordRapport: state.lordRapport,
          lostItems: state.lostItems,
          territoryOwnership: state.territoryOwnership ?? {},
          playerForceId: state.playerForceId,
          family: state.family,
          clanStandings: state.clanStandings,
          appointments: appointmentsAfterAI,
          casusBelliMarks: casusBelliAfterCourt,
          recruitBonusSeasons: state.recruitBonusSeasons,
          weather: state.weather,
          forts: state.forts,
          sites: state.sites,
          taxPolicy: planned.taxPolicy,
          tradePartners: state.tradePartners,
          inflation: state.inflation,
          embargoes: state.embargoes,
          convoys: state.convoys,
          raids: state.raids,
          expeditions: state.expeditions,
          realmRelations: state.realmRelations,
          standingRoutes: state.standingRoutes,
          refugees: state.refugees ?? 0,
          lifespanMode: state.lifespanMode ?? 'historical',
          lifespanLength: state.lifespanLength ?? 'historical',
          agingStatLock: state.agingStatLock ?? false,
          noBattleDeath: state.noBattleDeath ?? false,
          reviveDeadOfficers: state.reviveDeadOfficers ?? false,
          searchSuccessMul: state.talentDiscovery === 'scarce' ? 0.6 : state.talentDiscovery === 'plentiful' ? 1.4 : 1,
          duelChanceMul: state.duelFrequency === 'rare' ? 0.5 : state.duelFrequency === 'frequent' ? 2 : 1,
          disasterMul: state.disasterFrequency === 'low' ? 0.5 : state.disasterFrequency === 'high' ? 1.7 : 1,
          newOfficerChance: state.newOfficers === 'rare' ? 0.05 : state.newOfficers === 'normal' ? 0.12 : state.newOfficers === 'common' ? 0.25 : 0,
          seasonBoundary,
        });
        // Prepend AI diplomatic announcements to the report.
        if (planned.entries.length > 0) {
          result.report.entries.unshift(...planned.entries);
        }
        // Surface AI court actions (rank promotions + edict issuances).
        if (aiCourt.entries.length > 0) {
          result.report.entries.unshift(...aiCourt.entries);
        }
        // Flush any wish grant/reject entries queued mid-season.
        if ((state.pendingWishEntries ?? []).length > 0) {
          result.report.entries.unshift(...(state.pendingWishEntries ?? []));
        }
        // Surface AI appointment/promotion changes so the player can see
        // what rival courts did this season. Also log to appointmentHistory.
        const aiHistoryAppends: import('../types').AppointmentHistoryEntry[] = [];
        for (const ch of aiAppts.changes) {
          const o = officersAfterAppts[ch.officerId];
          const force = state.forces[ch.forceId];
          if (!o || !force) continue;
          if (ch.kind === 'appoint' && ch.titleId) {
            const def = CIVIC_TITLES_BY_ID[ch.titleId];
            if (!def) continue;
            result.report.entries.push({
              cityId: o.locationCityId,
              kind: 'note',
              text: `${force.name.en} appointed ${o.name.en} as ${def.name.en}.`,
              textZh: `${force.name.zh}拜${o.name.zh}為${def.name.zh}。`,
            });
            aiHistoryAppends.push({
              kind: 'appoint', year: state.date.year, season: state.date.season,
              officerId: ch.officerId, forceId: ch.forceId, titleId: ch.titleId,
            });
          } else if (ch.kind === 'promote' && ch.rankId) {
            const rankDef = MILITARY_RANKS_BY_ID[ch.rankId];
            if (!rankDef) continue;
            result.report.entries.push({
              cityId: o.locationCityId,
              kind: 'note',
              text: `${force.name.en} promoted ${o.name.en} to ${rankDef.name.en}.`,
              textZh: `${force.name.zh}晉${o.name.zh}為${rankDef.name.zh}。`,
            });
          } else if (ch.kind === 'enfeoff' && ch.peerageId) {
            const peerDef = PEERAGES_BY_ID[ch.peerageId];
            if (!peerDef) continue;
            result.report.entries.push({
              cityId: o.locationCityId,
              kind: 'note',
              text: `${force.name.en} enfeoffed ${o.name.en} as ${peerDef.name.en}.`,
              textZh: `${force.name.zh}封${o.name.zh}為${peerDef.name.zh}。`,
            });
          } else if (ch.kind === 'honor' && ch.honorificId) {
            const honDef = HONORIFICS_BY_ID[ch.honorificId];
            if (!honDef) continue;
            result.report.entries.push({
              cityId: o.locationCityId,
              kind: 'note',
              text: `${force.name.en} named ${o.name.en} ${honDef.name.en}.`,
              textZh: `${force.name.zh}拜${o.name.zh}為${honDef.name.zh}。`,
            });
          }
        }

        // Snapshot the player's queued commands (captured pre-resolution,
        // since pendingCommands gets cleared at the end of this tick). The
        // SeasonReportModal renders these as a "本季令" summary so the
        // player can see what their officers did this period at a glance.
        const playerCmds = state.playerForceId
          ? Object.values(state.pendingCommands).filter((c) => {
              const o = state.officers[c.officerId];
              return o?.forceId === state.playerForceId;
            })
          : [];
        if (playerCmds.length > 0) {
          result.report.executedCommands = playerCmds;
        }

        // Re-select capital if previously selected city changed hands.
        const playerForceId = state.playerForceId;
        const stillOwned =
          state.selectedCityId &&
          result.cities[state.selectedCityId]?.ownerForceId === playerForceId;
        const fallback = playerForceId
          ? Object.values(result.cities).find(
              (c) => c.ownerForceId === playerForceId,
            )?.id ?? null
          : null;

        // Victory/defeat check — only a real player force is judged. In observe
        // mode (playerForceId === null) the season tick just simulates history
        // for the watcher; it must never resolve to victory/defeat (which would
        // freeze the loop, since the observer owns 0 cities by definition).
        const totalCities = Object.values(result.cities).length;
        const playerCities = playerForceId
          ? Object.values(result.cities).filter(
              (c) => c.ownerForceId === playerForceId,
            ).length
          : 0;
        let victoryStatus: VictoryStatus = state.victoryStatus;
        if (playerForceId) {
          if (playerCities === 0) {
            victoryStatus = 'defeat';
          } else if (playerCities === totalCities) {
            victoryStatus = 'victory';
          }
        }

        // Capture battle details from this season into persistent history.
        const newBattles = result.report.entries
          .filter((e) => !!e.battle)
          .map((e, idx) => ({
            ...e.battle!,
            id: `${state.date.year}-${state.date.season}-${idx}`,
            date: { year: state.date.year, season: state.date.season },
          }));

        // 名器養成(戰略戰)— every officer who fought an auto-resolved battle this
        // season also seasons their weapon/armour/mount, mirroring the tactical-battle
        // hook so a force that fights mostly on the strategic map still earns 名器.
        const seasonEquipLists: string[][] = [];
        for (const b of newBattles) {
          for (const oid of [b.attacker.commanderId, ...b.attacker.companionIds, b.defender.commanderId, ...b.defender.companionIds]) {
            const o = result.officers[oid];
            if (o) seasonEquipLists.push(o.equipment);
          }
        }
        const loreAfterSeason = accrueWeaponLore(state.itemLore, seasonEquipLists);
        setLoreRegistry(loreAfterSeason);

        // Queue player-involved battles for theater playback.
        const playerBattleTheaters = newBattles.filter(
          (b) =>
            b.attacker.forceId === state.playerForceId ||
            b.defender.forceId === state.playerForceId,
        );

        // Resolve espionage ops.
        const espResult = resolveEspionage({
          ops: state.pendingEspionage,
          cities: result.cities,
          officers: result.officers,
          playerForceId: state.playerForceId,
          rng: Math.random,
          buildings: state.buildings,
          family: state.family,
          lordRapport: state.lordRapport,
          rapport: planned.rapport ?? state.rapport,
          runtimeBonds: planned.runtimeBonds,
        });
        // Free agents.
        for (const o of Object.values(espResult.officers)) {
          if (state.pendingEspionage.some((op) => op.agentOfficerId === o.id)) {
            espResult.officers[o.id] = { ...o, task: null };
          }
        }
        if (espResult.entries.length > 0) {
          result.report.entries.push(...espResult.entries);
        }
        // Track espionage successes for 武功榜 (謀略 column).
        const espionageSuccesses: EntityId[] = espResult.results
          .filter((r) => r.success)
          .map((r) => r.op.agentOfficerId);

        // 細作開眼 — each successful op lights its target city for a season
        // of half-month ticks; older intel fades one tick at a time.
        const espionageRevealsNext: Record<EntityId, number> = {};
        for (const [cid, ticks] of Object.entries(state.espionageReveals ?? {})) {
          if (ticks > 1) espionageRevealsNext[cid] = ticks - 1;
        }
        for (const r of espResult.results) {
          if (!r.success) continue;
          const cid = r.op.targetCityId
            ?? (r.op.targetOfficerId ? espResult.officers[r.op.targetOfficerId]?.locationCityId : null);
          if (cid) espionageRevealsNext[cid] = 6;
        }

        // 潛伏細作 — persistent agents tick each season: ongoing intel, quiet
        // loyalty erosion, rising exposure, and capture at 100. Mutations fold
        // back into espResult so postCities/postOfficers inherit them.
        let embeddedSpiesNext = state.embeddedSpies ?? [];
        let spyGrudgeBumps: Record<EntityId, number> = {};
        if (seasonBoundary && embeddedSpiesNext.length > 0) {
          const spyTick = tickEmbeddedSpies({
            spies: embeddedSpiesNext,
            cities: espResult.cities,
            officers: espResult.officers,
            playerForceId: state.playerForceId,
            rng: Math.random,
          });
          Object.assign(espResult.cities, spyTick.cities);
          Object.assign(espResult.officers, spyTick.officers);
          for (const [cid, ticks] of Object.entries(spyTick.reveals)) {
            espionageRevealsNext[cid] = Math.max(espionageRevealsNext[cid] ?? 0, ticks);
          }
          if (spyTick.entries.length > 0) result.report.entries.push(...spyTick.entries);
          embeddedSpiesNext = spyTick.spies;
          spyGrudgeBumps = spyTick.grudgeBumps;
        }
        // 游历細探 — intel an expedition (探索/刺探) lit on the cities it reached.
        for (const [cid, ticks] of Object.entries(result.espionageReveals ?? {})) {
          espionageRevealsNext[cid] = Math.max(espionageRevealsNext[cid] ?? 0, ticks);
        }
        // 行刺敗露 — fold a botched assassination's blowback into the same grudge merge.
        for (const [fid, d] of Object.entries(espResult.grudgeDelta)) {
          spyGrudgeBumps[fid] = (spyGrudgeBumps[fid] ?? 0) + d;
        }
        const grudgesAfterSpies: Record<EntityId, number> = Object.keys(spyGrudgeBumps).length > 0
          ? (() => {
              const g = { ...(state.grudges ?? {}) };
              for (const [fid, d] of Object.entries(spyGrudgeBumps)) {
                g[fid] = Math.max(0, Math.min(100, (g[fid] ?? 0) + d));
              }
              return g;
            })()
          : (state.grudges ?? {});

        // Resolve tribe raids.
        const tribeResult = resolveTribeRaids({
          state: state.tribeState,
          cities: espResult.cities,
          date: result.date,
          rng: Math.random,
        });
        if (tribeResult.entries.length > 0) {
          result.report.entries.push(...tribeResult.entries);
        }
        // Tribe aggression carried forward; AI 征討 may beat it down below.
        let nextAggression: Record<string, number> = { ...tribeResult.state.aggression };
        // 安邊 — a 遠使 embassy to a border tribe placates it (raids subside).
        if (result.expeditionAggressionDeltas) {
          for (const [tid, d] of Object.entries(result.expeditionAggressionDeltas)) {
            nextAggression[tid] = Math.max(0, Math.min(1, (nextAggression[tid] ?? 0) + d));
          }
        }

        // 野外據點 — resource deposits pay their holders; still-hostile bandit
        // nests sack a neighbouring city. Once per season.
        let siteCities = tribeResult.cities;
        // 名產商路 — regenerated each season from current ownership/adjacency.
        let nextTradeRoutes = state.tradeRoutes;
        if (seasonBoundary) {
          const siteTick = tickWildSites({
            sites: state.sites,
            cities: tribeResult.cities,
            rng: Math.random,
          });
          siteCities = siteTick.cities;
          if (siteTick.entries.length > 0) {
            result.report.entries.push(...siteTick.entries);
          }
          // 異族雇傭 — thoroughly pacified tribes send auxiliaries to the
          // border city that holds their frontier quiet.
          const merc = tickTribeMercenaries({
            aggression: nextAggression,
            cities: siteCities,
            rng: Math.random,
          });
          siteCities = merc.cities;
          if (merc.entries.length > 0) result.report.entries.push(...merc.entries);

          // 名產商路 — connect same-owner specialty cities (land + 漕運) and pay
          // the margins, throttled where war/banditry threatens the road and
          // eased where a 驛傳 depot patrols it (護商).
          const securedCityIds = new Set(
            Object.keys(siteCities).filter((id) => buildingBonuses(id, state.buildings).convoyMul > 1),
          );
          nextTradeRoutes = buildSpecialtyTradeRoutes(siteCities, state.diplomacy, { ports: state.ports, securedCityIds });
          const trade = tickSpecialtyTrade({
            cities: siteCities,
            routes: nextTradeRoutes,
            playerForceId: state.playerForceId,
          });
          siteCities = trade.cities;
          if (trade.entries.length > 0) result.report.entries.push(...trade.entries);

          // 名物萃京 — the demand side: each realm's DISTINCT goods funnel to its
          // seat and fetch a premium at the great central market (互通有無).
          for (const f of Object.values(state.forces)) {
            const cap = f.capitalCityId ? siteCities[f.capitalCityId] : null;
            if (!cap || cap.ownerForceId !== f.id || cap.ruined) continue;
            const inc = specialtyEntrepotIncome(siteCities, f.id);
            if (inc <= 0) continue;
            siteCities = { ...siteCities, [cap.id]: { ...cap, gold: cap.gold + inc } };
            if (f.id === state.playerForceId) {
              result.report.entries.push({
                cityId: cap.id,
                kind: 'income',
                text: `Entrepôt trade funneled ${inc.toLocaleString()} gold to ${cap.name.en}.`,
                textZh: `${cap.name.zh}:名物萃京,通都大邑商利 +${inc.toLocaleString()} 金。`,
              });
            }
          }
        }

        // Historical event check. Fires at most one event per season.
        let firingEvent: HistoricalEvent | null = null;
        let playerAwaitsChoice = false;
        let postCities = siteCities;
        let postOfficers = espResult.officers;
        let postForces = result.forces;
        let postFlags = eventFlagsAfterCourt;
        let postFiredIds = state.firedEventIds;
        const forcedEventWishes: import('../types').OfficerWish[] = [];
        const eventCtx = {
          date: result.date,
          cities: postCities,
          officers: postOfficers,
          forces: postForces,
          eventFlags: state.eventFlags,
          firedEventIds: state.firedEventIds,
          romanceMode: state.romanceMode,
        };
        // Historical events first; player-authored custom events fill the
        // season if none scripted fired, and fire deterministically.
        const eventCheck =
          findFiringEvent(eventCtx) ??
          // 動態事件 — emergent beats from how the player governs (treasury,
          // taxation, idle talent). Behind scripted history, ahead of custom.
          rollBehaviorEvent({
            date: result.date,
            cities: postCities,
            officers: postOfficers,
            forces: postForces,
            taxPolicy: state.taxPolicy,
            playerForceId: state.playerForceId,
            firedEventIds: state.firedEventIds,
            rng: Math.random,
          }) ??
          (state.customEvents.length > 0
            ? findFiringEventIn(state.customEvents, eventCtx, { alwaysFire: true })
            : null);
        if (eventCheck) {
          // Achievement trigger.
          let ach = loadAchievementProgress();
          const r = processTrigger(ach, { kind: 'fire-event', targetId: eventCheck.id });
          ach = r.progress;
          saveAchievementProgress(ach);
          if (r.newlyUnlocked.length > 0) {
            // Will merge into final set below.
          }
          const after = applyEventEffects(eventCheck, {
            date: result.date,
            cities: postCities,
            officers: postOfficers,
            forces: postForces,
            eventFlags: state.eventFlags,
            firedEventIds: state.firedEventIds,
          });
          postCities = after.cities;
          postOfficers = after.officers;
          postForces = after.forces;
          postFlags = after.eventFlags;
          postFiredIds = [...state.firedEventIds, eventCheck.id];
          firingEvent = eventCheck;
          // 抉擇 — if the player rules the chooser's force the decision
          // waits for the modal; anyone else walks the historical path
          // (first choice) right now.
          if (eventCheck.choices && eventCheck.choices.length > 0) {
            const chooserForce = eventCheck.chooserRulerId
              ? Object.values(postForces).find((f) => f.rulerOfficerId === eventCheck.chooserRulerId)
              : null;
            playerAwaitsChoice = !!chooserForce && chooserForce.id === state.playerForceId;
            if (!playerAwaitsChoice) {
              const histPath = applyEventEffects(
                { ...eventCheck, effects: eventCheck.choices[0].effects, choices: undefined },
                {
                  date: result.date,
                  cities: postCities,
                  officers: postOfficers,
                  forces: postForces,
                  eventFlags: postFlags,
                  firedEventIds: postFiredIds,
                },
              );
              postCities = histPath.cities;
              postOfficers = histPath.officers;
              postForces = histPath.forces;
              postFlags = histPath.eventFlags;
            }
          }
          // Apply any 'grant-title' effects emitted by this event. These
          // bypass cooldowns + trait refusals — scripted history wins.
          for (const grant of after.appointmentGrants ?? []) {
            const grantee = postOfficers[grant.officerId];
            const titleDef = CIVIC_TITLES_BY_ID[grant.titleId];
            if (!grantee || !titleDef || grantee.status === 'dead') continue;
            // Drop conflicts: same titleId (if unique) or excludes list.
            const ex = new Set<string>([grant.titleId, ...(titleDef.excludes ?? [])]);
            appointmentsAfterAI = appointmentsAfterAI.filter((a) => {
              if (a.officerId === grant.officerId) return false;
              if (a.forceId === grantee.forceId && ex.has(a.titleId)) return false;
              if (grant.titleId === 'prefect' && a.titleId === 'prefect' && a.cityId === grant.cityId) return false;
              return true;
            });
            appointmentsAfterAI.push({
              officerId: grant.officerId,
              forceId: grantee.forceId!,
              titleId: grant.titleId,
              cityId: grant.cityId,
              appointedYear: result.date.year,
              appointedSeason: result.date.season,
            });
            aiHistoryAppends.push({
              kind: 'appoint', year: result.date.year, season: result.date.season,
              officerId: grant.officerId, forceId: grantee.forceId!,
              titleId: grant.titleId, cityId: grant.cityId,
            });
            result.report.entries.push({
              cityId: grantee.locationCityId,
              kind: 'talent',
              text: `By edict, ${grantee.name.en} is named ${titleDef.name.en}.`,
              textZh: `奉詔拜${grantee.name.zh}為${titleDef.name.zh}。`,
            });
          }
          // Forced wishes from 'force-wish' effects — only show to player
          // when the targeted officer belongs to the player force.
          for (const fw of after.forcedWishes ?? []) {
            const target = postOfficers[fw.officerId];
            if (!target || target.forceId !== state.playerForceId) continue;
            forcedEventWishes.push({
              id: `wish-event-${fw.officerId}-${result.date.year}-${result.date.season}`,
              officerId: fw.officerId,
              kind: fw.wishKind,
              text: fw.text,
              issuedYear: result.date.year,
              issuedSeason: result.date.season,
              rejectPenalty: fw.rejectPenalty ?? 8,
              grantBonus: fw.grantBonus ?? 10,
              expiresAfterSeasons: 6,
            });
          }
        }

        // Player's auto-build queues — start any new projects.
        const auto = applyAutoBuild({
          cities: postCities,
          buildings: state.buildings,
          queues: state.autoBuildQueues,
          playerForceId: state.playerForceId,
        });
        postCities = auto.cities;
        if (auto.entries.length > 0) result.report.entries.push(...auto.entries);

        // AI build orders (personality-driven).
        const aiBuild = planAIBuildOrders({
          cities: postCities,
          buildings: auto.buildings,
          forces: postForces,
          playerForceId: state.playerForceId,
        });
        postCities = aiBuild.cities;
        if (aiBuild.entries.length > 0) result.report.entries.push(...aiBuild.entries);

        // Buildings tick (player + AI projects both progress).
        const bld = tickBuildings({ buildings: aiBuild.buildings, cities: postCities });
        if (bld.entries.length > 0) result.report.entries.push(...bld.entries);
        // 城建興廢 — seasonal building mishaps (火災/坍塌) and boons (名匠).
        const bldEvt = tickBuildingEvents({
          buildings: bld.buildings,
          cities: postCities,
          playerForceId: state.playerForceId,
          rng: Math.random,
        });
        if (bldEvt.entries.length > 0) result.report.entries.push(...bldEvt.entries);
        // 建築成就 — milestones from the player's completed buildings.
        const bldAch = checkBuildingAchievements(bldEvt.buildings, postCities, state.playerForceId);

        // AI 養世家 — AI realms wed their officers each spring so their lines
        // raise heirs too (mirrors the player's 府內結親).
        let familyForTick = state.family;
        if (seasonBoundary && state.date.season === 'spring') {
          const aiMar = aiArrangeMarriages({
            officers: postOfficers,
            family: state.family,
            playerForceId: state.playerForceId,
            year: result.date.year,
            rng: Math.random,
          });
          familyForTick = aiMar.family;
          if (aiMar.entries.length > 0) result.report.entries.push(...aiMar.entries);
        }

        // Family tick (births + activations) — only on year boundary roughly.
        const fam = tickFamily({
          date: result.date,
          officers: postOfficers,
          family: familyForTick,
          pendingHeirs: state.pendingHeirs,
          rng: Math.random,
        });
        postOfficers = fam.officers;
        if (fam.entries.length > 0) result.report.entries.push(...fam.entries);

        // Expire stale wishes (6+ seasons old) with a small loyalty penalty.
        const expireOut = expireWishes(state.officerWishes, postOfficers, result.date.year, result.date.season);
        postOfficers = expireOut.officers;
        if (expireOut.entries.length > 0) result.report.entries.push(...expireOut.entries);

        // Roll new wishes.
        const newWishes = rollWishes({
          officers: postOfficers,
          cities: postCities,
          playerForceId: state.playerForceId,
          existing: expireOut.wishes,
          date: result.date,
          rng: Math.random,
        });
        // 怨氣漸消 — content officers with no pending petition let old grudges fade.
        postOfficers = decayGrievances(postOfficers, newWishes, Math.random);

        // Ship build orders tick.
        const newOrders = state.shipOrders.map((o) => ({
          ...o,
          seasonsLeft: o.seasonsLeft - 1,
        }));
        const completed = newOrders.filter((o) => o.seasonsLeft <= 0);
        const remainingOrders = newOrders.filter((o) => o.seasonsLeft > 0);
        let updatedFleets = state.fleets;
        for (const o of completed) {
          const city = postCities[o.cityId];
          if (!city || !city.ownerForceId) continue;
          const existing = updatedFleets.find(
            (f) => f.cityId === o.cityId && f.forceId === city.ownerForceId,
          );
          if (existing) {
            updatedFleets = updatedFleets.map((f) =>
              f.id === existing.id
                ? {
                    ...f,
                    ships: {
                      ...f.ships,
                      [o.shipClass]: (f.ships[o.shipClass] ?? 0) + 1,
                    },
                  }
                : f,
            );
          } else {
            updatedFleets = [
              ...updatedFleets,
              {
                id: `fleet-${o.cityId}-${city.ownerForceId}`,
                cityId: o.cityId,
                forceId: city.ownerForceId,
                ships: { [o.shipClass]: 1 },
              },
            ];
          }
          result.report.entries.push({
            cityId: o.cityId,
            kind: 'command-success',
            text: `A ${o.shipClass} has been completed at ${city.name.en}.`,
          });
        }

        // Succession — replace dead rulers with heirs / top officers.
        const succession = applySuccession({
          forces: postForces,
          officers: postOfficers,
          family: fam.family,
          careerOfficerId: state.careerMode?.officerId ?? null,
          deeds: state.deeds,
        });
        postForces = succession.forces;
        postOfficers = succession.officers;
        if (succession.entries.length > 0) {
          result.report.entries.push(...succession.entries);
        }

        // Coalition AI — opposing forces sign NAPs against the hegemon.
        const coalitionResult = evaluateCoalition({
          cities: postCities,
          forces: postForces,
          diplomacy: result.diplomacy,
          date: result.date,
        });
        if (coalitionResult.entries.length > 0) {
          result.report.entries.push(...coalitionResult.entries);
        }
        // Diplomacy threads through coalition → AI schemes → final commit.
        let postDiplomacy = coalitionResult.diplomacy;
        const aiSchemeMarks: typeof state.casusBelliMarks = [];

        // Dialogue roll. Branching follow-ups fire deterministically before
        // any random roll — they were queued by an earlier choice.
        let nextFollowups = state.dialogueFollowups;
        let dlg: ReturnType<typeof rollDialogue> = null;
        if (!state.pendingDialogue) {
          if (state.dialogueFollowups.length > 0) {
            const [headId, ...rest] = state.dialogueFollowups;
            const followup = DIALOGUE_EVENTS_BY_ID[headId];
            if (followup) {
              dlg = followup;
              nextFollowups = rest;
            } else {
              nextFollowups = rest;
            }
          } else {
            dlg = rollDialogue({
              year: result.date.year,
              officers: postOfficers,
              eventFlags: postFlags,
              rng: Math.random,
            });
          }
        }

        // 名產版圖 — each force's realm-wide grip on the strategic goods, tallied
        // for this season's medicine (wounds/plague), 鑄錢/抑通膨 (copper) and 名品
        // court prestige. Memoised per force; ownership/dev are stable this phase.
        const specCtrlCache = new Map<string, SpecialtyControl>();
        const specOf = (fid?: string | null): SpecialtyControl | null => {
          if (!fid) return null;
          let c = specCtrlCache.get(fid);
          if (!c) {
            c = specialtyControl(postCities, fid, embargoedRolesAgainst(fid, state.embargoes));
            specCtrlCache.set(fid, c);
          }
          return c;
        };
        const realmOf = (fid?: string | null) => {
          const c = specOf(fid);
          return c ? specialtyRealmEffects(c) : null;
        };

        // ── Season-bound rolls (every 9 periods only) ──
        let nextWeather = state.weather;
        let nextMandate = state.mandate;
        let nextEmbargoes = state.embargoes;
        if (seasonBoundary) {
          // 禁運失依 — an embargo lapses once its imposer no longer holds the 專營.
          if (nextEmbargoes && nextEmbargoes.length > 0) {
            const kept = nextEmbargoes.filter((e) => { const c = specOf(e.by); return c ? canEmbargo(c, e.role) : false; });
            if (kept.length !== nextEmbargoes.length) nextEmbargoes = kept.length ? kept : undefined;
          }
          // 敵國禁榷 — an AI force that holds a 專營 occasionally cuts a hostile
          // rival off the good — the AI side of the player's 禁運 lever.
          {
            const cityCount: Record<string, number> = {};
            for (const c of Object.values(postCities)) if (c.ownerForceId) cityCount[c.ownerForceId] = (cityCount[c.ownerForceId] ?? 0) + 1;
            const list = nextEmbargoes ? [...nextEmbargoes] : [];
            const grew = (() => {
              let changed = false;
              for (const fid of Object.keys(postForces)) {
                if (fid === state.playerForceId || Math.random() > 0.2) continue;
                const ctrl = specOf(fid);
                if (!ctrl) continue;
                const role = (Object.keys(ctrl.strength) as SpecialtyRole[]).find((r) => canEmbargo(ctrl, r));
                if (!role) continue;
                const targets = Object.keys(postForces)
                  .filter((t) => t !== fid && isHostilePermitted(postDiplomacy, fid, t))
                  .sort((a, b) => (cityCount[b] ?? 0) - (cityCount[a] ?? 0));
                const target = targets[0];
                if (!target || list.some((e) => e.by === fid && e.against === target && e.role === role)) continue;
                list.push({ by: fid, against: target, role });
                changed = true;
                if (target === state.playerForceId) {
                  result.report.entries.push({
                    cityId: null, kind: 'note',
                    text: `${postForces[fid]?.name.en ?? fid} embargoes your realm's ${ROLE_ZH[role]} (專營禁榷).`,
                    textZh: `${postForces[fid]?.name.zh ?? fid}挾${ROLE_ZH[role]}專營,斷我商路(禁榷)。`,
                  });
                }
              }
              return changed;
            })();
            if (grew) nextEmbargoes = list;
          }
          // 採藥備疫 — a herb-rich realm shrugs off part of a plague's toll.
          const plagueResistByForce: Record<string, number> = {};
          for (const fid of Object.keys(postForces)) plagueResistByForce[fid] = realmOf(fid)?.plagueResist ?? 0;

          const plagueOut = rollPlagueOutbreak({
            cities: postCities,
            officers: postOfficers,
            currentYear: result.date.year,
            rng: Math.random,
            plagueResist: plagueResistByForce,
          });
          postCities = plagueOut.cities;
          postOfficers = plagueOut.officers;
          if (plagueOut.entries.length > 0) result.report.entries.push(...plagueOut.entries);

          // 名物盛衰 — a regional shock or windfall keyed to a city's signature
          // good (馬瘟/珠枯/蝗災/豐年). Makes the specialty map dynamic; AI too.
          const specEvt = rollSpecialtyEvents({
            cities: postCities,
            rng: Math.random,
            season: result.date.season,
            calamityMul: state.disasterFrequency === 'low' ? 0.5 : state.disasterFrequency === 'high' ? 1.7 : 1,
          });
          postCities = specEvt.cities;
          if (specEvt.entries.length > 0) result.report.entries.push(...specEvt.entries);

          // 名駒入廄 — a well-developed 名馬 city now and then foals a famous mount,
          // appearing in its 藏寶池 (lostItems) to be assigned to an officer for a
          // war/leadership edge. Player realm only; at most one foaled per season.
          if (state.playerForceId && NAMED_MOUNTS.length > 0) {
            const inPlay = new Set<string>([
              ...result.lostItems.map((li) => li.itemId),
              ...Object.values(postOfficers).flatMap((o) => o.equipment ?? []),
            ]);
            const available = NAMED_MOUNTS.filter((m) => !inPlay.has(m.id));
            if (available.length > 0) {
              for (const c of Object.values(postCities)) {
                if (c.ownerForceId !== state.playerForceId || c.ruined) continue;
                if (CITY_SPECIALTY[c.id] !== 'horse') continue;
                const dev = c.specialtyDev ?? 0;
                if (dev < 2) continue;                       // only a built-up stud farm
                if (Math.random() >= 0.04 + dev * 0.03) continue; // dev2 ≈10% … dev5 ≈19%
                const foal = available.find((m) => (m as { originCityId?: string }).originCityId === c.id)
                  ?? available[Math.floor(Math.random() * available.length)];
                result.lostItems = [...result.lostItems, { itemId: foal.id, cityId: c.id }];
                result.report.entries.push({
                  cityId: c.id, kind: 'note',
                  text: `名駒入廄 — ${c.name.en} foaled ${foal.name.en}; assign it to an officer.`,
                  textZh: `名駒入廄 — ${c.name.zh}牧得${foal.name.zh},可賜予武將。`,
                });
                break; // one realm-wide per season keeps it special
              }
            }
          }

          const intrigueOut = rollIntrigue({
            officers: postOfficers,
            forces: postForces,
            date: result.date,
            rng: Math.random,
          });
          postOfficers = intrigueOut.officers;
          if (intrigueOut.entries.length > 0) result.report.entries.push(...intrigueOut.entries);

          // Re-roll weather for the new season. 借東風 flag overrides.
          nextWeather = rollWeather(result.date.season, Math.random);
          if (postFlags['east-wind-borrowed']) {
            nextWeather = { kind: 'wind', wind: 'east', windPower: 3 };
            postFlags = { ...postFlags, 'east-wind-borrowed': false };
            result.report.entries.unshift({
              cityId: null,
              kind: 'note',
              text: '七星壇借得東風 — 東南風起，火攻可成！',
            });
          }
          result.report.entries.unshift(describeWeather(nextWeather));

          const omenOut = rollOmen({
            forces: postForces,
            mandate: state.mandate,
            date: result.date,
            rng: Math.random,
          });
          nextMandate = omenOut.mandate;
          if (omenOut.entry) result.report.entries.push(omenOut.entry);
          // Faction-imbalance events: 黨錮/武人干政/九品官人/新政
          const facOut = rollFactionEvents({
            forces: postForces,
            officers: postOfficers,
            cities: postCities,
            mandate: nextMandate,
            clanStandings: state.clanStandings,
            rng: Math.random,
          });
          postOfficers = facOut.officers;
          postCities = facOut.cities;
          nextMandate = facOut.mandate;
          if (facOut.entries.length > 0) result.report.entries.push(...facOut.entries);
          // 邦交 — prestige a 遠使 embassy won at a foreign court (受封親魏倭王…).
          if (result.expeditionMandateDeltas) {
            const byForce = { ...nextMandate.byForce };
            for (const [fid, d] of Object.entries(result.expeditionMandateDeltas)) {
              byForce[fid] = Math.max(0, Math.min(100, (byForce[fid] ?? 50) + d));
            }
            nextMandate = { ...nextMandate, byForce };
          }
          // 名品充府 — a realm flush with fine goods (絲/錦/珠/象/漆) lends its court
          // lustre and legitimacy: a small 天命 trickle each season (≤ +2).
          {
            const byForce = { ...nextMandate.byForce };
            let touched = false;
            for (const fid of Object.keys(postForces)) {
              const cp = realmOf(fid)?.courtPrestige ?? 0;
              if (cp > 0) { byForce[fid] = Math.max(0, Math.min(100, (byForce[fid] ?? 50) + Math.min(2, cp * 0.2))); touched = true; }
            }
            if (touched) nextMandate = { ...nextMandate, byForce };
          }
          // AI 大局計略 — rival courts plot against each other and the player.
          const schemeOut = resolveAISchemes({
            forces: postForces,
            officers: postOfficers,
            cities: postCities,
            diplomacy: postDiplomacy,
            playerForceId: state.playerForceId,
            date: { year: result.date.year, season: result.date.season as 'spring' | 'summer' | 'autumn' | 'winter' },
            rng: Math.random,
          });
          postDiplomacy = schemeOut.diplomacy;
          postCities = schemeOut.cities;
          aiSchemeMarks.push(...schemeOut.marks);
          if (schemeOut.entries.length > 0) result.report.entries.push(...schemeOut.entries);
          // AI court wish flavor: 0-2 random AI petitions resolved per season.
          const aiWishFlavor = rollAIWishFlavor(postOfficers, postForces, state.playerForceId, Math.random);
          postOfficers = aiWishFlavor.officers;
          if (aiWishFlavor.entries.length > 0) result.report.entries.push(...aiWishFlavor.entries);
        }

        // ── Wounded recovery tick: decrement woundedSeasons, restore to idle at 0 ──
        // Newly wounded with cautious/sickly trait or age ≥ 55 may petition
        // to retire — generated as a `retire` wish for the player only.
        // 良醫療傷 — a herb-rich realm heals the wounded faster and pulls more of
        // the critically hurt through, spending medicine from its 藥圃 to do it.
        const forceMedicine: Record<string, number> = {};
        for (const c of Object.values(postCities)) {
          if (c.ownerForceId && (c.medicine ?? 0) > 0) forceMedicine[c.ownerForceId] = (forceMedicine[c.ownerForceId] ?? 0) + (c.medicine ?? 0);
        }
        // 醫者在側 — a force with a 醫術 officer in service heals its wounded faster.
        const forceHasPhysician = new Set<string>();
        for (const o of Object.values(postOfficers)) {
          if (o.forceId && o.status !== 'dead' && (o.traits as string[] | undefined ?? []).includes('physician')) {
            forceHasPhysician.add(o.forceId);
          }
        }
        const recoveryMulOf = (fid?: string | null) => {
          if (!fid) return 1;
          const base = realmOf(fid)?.woundRecoveryMul ?? 1;
          return base + Math.min(0.4, (forceMedicine[fid] ?? 0) / 3000) // stockpile sweetens it
            + (forceHasPhysician.has(fid) ? 0.2 : 0);
        };
        const medicineSpend: Record<string, number> = {};
        const tickedOfficers: Record<string, typeof postOfficers[string]> = {};
        const woundedRetireWishes: import('../types').OfficerWish[] = [];
        for (const o of Object.values(postOfficers)) {
          if (o.status === 'wounded' && o.woundedSeasons !== undefined) {
            const recoveryMul = recoveryMulOf(o.forceId);
            // 瀕死 — a critical wound can still carry the officer off. Chance
            // rises with age; the young and hale usually pull through — and good
            // physic (藥材) pulls more through still.
            if (o.woundSeverity === 'critical' && !(state.noBattleDeath ?? false)) {
              const age = result.date.year - o.birthYear;
              const mortal = (0.05 + Math.max(0, age - 45) * 0.004) / recoveryMul;
              if (Math.random() < mortal) {
                tickedOfficers[o.id] = { ...o, status: 'dead', task: null, woundedSeasons: undefined, woundSeverity: undefined };
                result.report.entries.push({
                  cityId: o.locationCityId,
                  kind: 'death',
                  text: `傷重不治 — ${o.name.zh}（${o.name.en}） succumbed to his wounds.`,
                  textZh: `傷重不治 — ${o.name.zh}創甚而卒。`,
                });
                continue;
              }
            }
            // 藥到病除 — at each season's turn, strong physic can heal a whole
            // extra period of convalescence in one go (spending medicine when it
            // does). Gated to the season boundary so it fires once, not per period.
            let dec = 1;
            if (seasonBoundary && o.forceId && Math.random() < Math.min(0.85, recoveryMul - 1)) {
              dec = 2;
              medicineSpend[o.forceId] = (medicineSpend[o.forceId] ?? 0) + 60;
            }
            const left = o.woundedSeasons - dec;
            if (left <= 0) {
              tickedOfficers[o.id] = { ...o, status: 'idle', woundedSeasons: undefined, woundSeverity: undefined };
              result.report.entries.push({
                cityId: o.locationCityId,
                kind: 'note',
                text: `傷癒復出 — ${o.name.zh} has recovered and returns to service.`,
              });
            } else {
              tickedOfficers[o.id] = { ...o, woundedSeasons: left };
              // First season after the wound, roll for retirement petition.
              if (
                o.forceId === state.playerForceId &&
                left === o.woundedSeasons - 1 &&
                left > 0 &&
                !newWishes.some((w) => w.officerId === o.id)
              ) {
                const retire = maybeWoundedRetireWish(o, result.date, Math.random);
                if (retire) woundedRetireWishes.push(retire);
              }
            }
          } else {
            tickedOfficers[o.id] = o;
          }
        }
        // 後遺 — tick down duel/debate afflictions (養傷 / 羞憤) each season.
        // 傷兵營 — a field hospital in the officer's city heals wounds faster.
        for (const id of Object.keys(tickedOfficers)) {
          const ofc = tickedOfficers[id];
          const heal = ofc.locationCityId
            ? buildingBonuses(ofc.locationCityId, state.buildings).woundRecovery
            : 0;
          const ticked = tickAfflictions(ofc, heal);
          if (ticked !== tickedOfficers[id]) tickedOfficers[id] = ticked;
        }
        postOfficers = tickedOfficers;

        // 用藥 — draw the medicine the season's healing consumed from each force's
        // 藥圃 cities (best-effort; the passive 採藥備疫 edge applies regardless).
        for (const [fid, amt] of Object.entries(medicineSpend)) {
          let remaining = amt;
          for (const c of Object.values(postCities)) {
            if (remaining <= 0) break;
            if (c.ownerForceId !== fid || (c.medicine ?? 0) <= 0) continue;
            const take = Math.min(c.medicine ?? 0, remaining);
            postCities = { ...postCities, [c.id]: { ...c, medicine: (c.medicine ?? 0) - take } };
            remaining -= take;
          }
        }

        // ── Delayed effects (截糧 troop drain) tick ──
        // Always absorb fresh effects from this period's battles so none are
        // lost, but the drain itself ticks once per SEASON — not once per game
        // period (~9/season), which drained ~9× too fast and burned the whole
        // 3-season effect out within a single season.
        let remainingDelayed: typeof state.pendingDelayedEffects =
          [...state.pendingDelayedEffects, ...(result.delayedEffects ?? [])];
        if (seasonBoundary) {
          const ticked: typeof state.pendingDelayedEffects = [];
          for (const d of remainingDelayed) {
            if (d.targetCityId && postCities[d.targetCityId]) {
              const c = postCities[d.targetCityId];
              postCities = {
                ...postCities,
                [d.targetCityId]: {
                  ...c,
                  troops: Math.max(0, c.troops - d.perSeason),
                },
              };
              result.report.entries.push({
                cityId: d.targetCityId,
                kind: 'note',
                text: `截糧之計 — ${c.name.zh} loses ${d.perSeason.toLocaleString()} troops to starvation. ${d.seasons - 1} season(s) remaining.`,
              });
            }
            if (d.seasons - 1 > 0) {
              ticked.push({ ...d, seasons: d.seasons - 1 });
            }
          }
          remainingDelayed = ticked;
        }

        // ── Religious rebellion roll (season boundary only) ──
        if (seasonBoundary) {
          const religion = rollReligiousRebellion({
            cities: postCities,
            forces: postForces,
            officers: postOfficers,
            date: result.date,
            rng: Math.random,
          });
          postCities = religion.cities;
          postForces = religion.forces;
          postOfficers = religion.officers;
          if (religion.entries.length > 0) result.report.entries.push(...religion.entries);
          // 流民四起 — an active cult erodes its neighbours and may spread.
          const contagion = spreadCultUnrest({
            cities: postCities,
            forces: postForces,
            officers: postOfficers,
            date: result.date,
            rng: Math.random,
            buildings: state.buildings,
          });
          postCities = contagion.cities;
          if (contagion.entries.length > 0) result.report.entries.push(...contagion.entries);
          // 俘虜處置 — AI captors pass verdict on their prisoners (招降/義釋/處決),
          // bearing the same costs the player does, before the ransom clears the rest.
          const captiveFate = resolveAICaptives({
            forces: postForces,
            officers: postOfficers,
            cities: postCities,
            family: state.family,
            runtimeBonds: state.runtimeBonds ?? [],
            playerForceId: state.playerForceId,
            rng: Math.random,
          });
          postOfficers = captiveFate.officers;
          if (captiveFate.entries.length > 0) result.report.entries.push(...captiveFate.entries);
          if (captiveFate.relationDeltas.length > 0) {
            const relations = { ...postDiplomacy.relations };
            for (const d of captiveFate.relationDeltas) {
              const key = pairKey(d.a, d.b);
              const rel = relations[key] ?? { forceA: d.a < d.b ? d.a : d.b, forceB: d.a < d.b ? d.b : d.a, score: 0, status: 'neutral' as const };
              relations[key] = { ...rel, score: Math.max(-100, Math.min(100, rel.score + d.delta)) };
            }
            postDiplomacy = { ...postDiplomacy, relations };
          }
          // 贖俘 — rival lords buy their captured officers back into circulation.
          const ransom = resolveAIRansoms({
            forces: postForces,
            officers: postOfficers,
            cities: postCities,
            playerForceId: state.playerForceId,
            rng: Math.random,
          });
          postOfficers = ransom.officers;
          postCities = ransom.cities;
          if (ransom.entries.length > 0) result.report.entries.push(...ransom.entries);
        }

        // ── T3 — Per-season loyalty drift from personality traits ──
        // Loyal officers slowly regenerate loyalty; ambitious/oath-breakers
        // drift down. Runs every period (small per-tick effect).
        {
          const driftedOfficers: Record<EntityId, Officer> = { ...postOfficers };
          let anyChange = false;
          // Group officers by force once for the 同袍/嫌隙 camaraderie nudge.
          const byForce = new Map<EntityId, Officer[]>();
          for (const o of Object.values(postOfficers)) {
            if (o.status === 'dead' || !o.forceId) continue;
            (byForce.get(o.forceId) ?? byForce.set(o.forceId, []).get(o.forceId)!).push(o);
          }
          const curRapport = espResult.rapport ?? state.rapport;
          for (const o of Object.values(postOfficers)) {
            if (o.status === 'dead' || !o.forceId) continue;
            let drift = loyaltyDriftPerSeason(o);
            // 同袍／嫌隙 — warmth among peers steadies loyalty; friction gnaws.
            drift += camaraderieLoyaltyDelta(o, byForce.get(o.forceId) ?? [], curRapport);
            // 君臣相得 — an officer who esteems their lord recovers loyalty faster.
            const lr = getLordRapport(state.lordRapport, o.id);
            if (lr > 0) drift += Math.min(2, lr * 0.02);
            // R1 — Relationship-based loyalty floor (folds in what 絆/OATH_BONDS
            // used to do): sworn brothers 95, close family 95, siblings 90,
            // master-servant 90, mentor-student 90 — all conditional on the
            // bonded officer being alive in the same force.
            const floor = loyaltyFloor(o, postOfficers, state.family, state.runtimeBonds);
            const next = Math.max(floor, Math.max(0, Math.min(100, o.loyalty + drift)));
            if (next !== o.loyalty) {
              driftedOfficers[o.id] = { ...o, loyalty: next };
              anyChange = true;
            }
          }
          if (anyChange) postOfficers = driftedOfficers;
        }

        // ── P2 — Defection roll (season boundary only) ──
        // Low-loyalty, non-unshakeable officers can defect to a neighbor or
        // become free agents. Loyal/honor-bound/ironhearted/pious immune.
        if (seasonBoundary) {
          const defectedOfficers: Record<EntityId, Officer> = { ...postOfficers };
          let anyDefect = false;
          for (const o of Object.values(postOfficers)) {
            if (o.status === 'dead' || !o.forceId) continue;
            const chance = defectionChance(o);
            if (chance === 0 || Math.random() >= chance) continue;
            // Defect — become a free agent in the current city.
            defectedOfficers[o.id] = {
              ...o,
              forceId: null,
              task: null,
              status: 'idle',
              loyalty: 30, // reset for next recruiter
            };
            anyDefect = true;
            const wasPlayer = o.forceId === state.playerForceId;
            result.report.entries.push({
              cityId: o.locationCityId,
              kind: wasPlayer ? 'desertion' : 'note',
              text: `${o.name.en} has deserted! (loyalty too low.)`,
              textZh: `${o.name.zh}棄職而去!(忠誠過低)`,
            });
          }
          if (anyDefect) postOfficers = defectedOfficers;
        }

        // ── T10 — Personality flavor events (season boundary only) ──
        // Mystical / poetic / drunkard / troublemaker officers occasionally
        // trigger a small event (loyalty + tiny stat tweak).
        if (seasonBoundary) {
          const evolved: Record<EntityId, Officer> = { ...postOfficers };
          let anyEvolve = false;
          for (const o of Object.values(postOfficers)) {
            if (o.status === 'dead' || !o.forceId) continue;
            const ev = rollFlavorEvent(o, Math.random);
            if (!ev) continue;
            const newLoyalty = Math.max(0, Math.min(100, o.loyalty + ev.loyaltyDelta));
            const nextStats = { ...o.stats };
            if (ev.statDelta) {
              for (const [k, v] of Object.entries(ev.statDelta)) {
                const key = k as keyof typeof nextStats;
                nextStats[key] = Math.max(1, Math.min(120, nextStats[key] + (v ?? 0)));
              }
            }
            evolved[o.id] = { ...o, loyalty: newLoyalty, stats: nextStats };
            anyEvolve = true;
            if (o.forceId === state.playerForceId) {
              result.report.entries.push({
                cityId: o.locationCityId,
                kind: 'note',
                text: ev.textEn,
                textZh: ev.textZh,
              });
            }
          }
          if (anyEvolve) postOfficers = evolved;
        }

        // ── R1 — Mentor passive policy transfer (season boundary) ──
        // A student in the same city + force as their mentor occasionally
        // absorbs one of the mentor's policies through exposure.
        if (seasonBoundary) {
          const learned: Record<EntityId, Officer> = { ...postOfficers };
          let anyLearn = false;
          for (const o of Object.values(postOfficers)) {
            if (o.status === 'dead' || !o.forceId) continue;
            for (const mentorId of mentorsOf(o.id)) {
              const m = postOfficers[mentorId];
              if (!m) continue;
              const transferred = rollMentorPolicyTransfer(o, m, Math.random);
              if (transferred) {
                const cur = learned[o.id].policies ?? [];
                if (!cur.includes(transferred)) {
                  learned[o.id] = {
                    ...learned[o.id],
                    policies: [...cur, transferred],
                  };
                  anyLearn = true;
                  if (o.forceId === state.playerForceId) {
                    const polDef = POLICY_DEFS[transferred];
                    result.report.entries.push({
                      cityId: o.locationCityId,
                      kind: 'talent',
                      text: `${o.name.en} learned ${polDef?.en ?? transferred} by following ${m.name.en}.`,
                      textZh: `${o.name.zh}從${m.name.zh}習得「${polDef?.zh ?? transferred}」。`,
                    });
                  }
                  break; // one transfer per officer per season
                }
              }
            }
          }
          if (anyLearn) postOfficers = learned;
        }

        // ── C + H — Item / policy resonance (season boundary, rare) ──
        // Officers holding a book of strategy for long enough may pick up
        // `strategist`; officers practicing 法家 may pick up `stern`, etc.
        if (seasonBoundary) {
          const resonated: Record<EntityId, Officer> = { ...postOfficers };
          let anyResonance = false;
          for (const o of Object.values(postOfficers)) {
            if (o.status === 'dead' || !o.forceId) continue;
            // C — item resonance ~1.5% per season per held resonant item
            const itemTrait = itemResonanceCandidate(o);
            if (itemTrait && Math.random() < 0.015) {
              const cur = (resonated[o.id].traits ?? []) as string[];
              if (!cur.includes(itemTrait)) {
                resonated[o.id] = {
                  ...resonated[o.id],
                  traits: [...cur, itemTrait] as Officer['traits'],
                };
                anyResonance = true;
                if (o.forceId === state.playerForceId) {
                  const def = TRAIT_DEFS_BY_ID[itemTrait];
                  result.report.entries.push({
                    cityId: o.locationCityId,
                    kind: 'talent',
                    text: `${o.name.en} attuned to a treasured item — gained ${def?.name.en ?? itemTrait}.`,
                    textZh: `${o.name.zh}日夜把玩寶物,習得「${def?.name.zh ?? itemTrait}」之性。`,
                  });
                }
                continue; // one resonance per officer per season
              }
            }
            // T9 — item tactic grant ~0.8% per season per held tactic-item
            const itemTactic = itemTacticCandidate(o);
            if (itemTactic && Math.random() < 0.008) {
              const curT = (resonated[o.id].tactics ?? []) as string[];
              if (!curT.includes(itemTactic)) {
                resonated[o.id] = {
                  ...resonated[o.id],
                  tactics: [...curT, itemTactic] as Officer['tactics'],
                };
                anyResonance = true;
                if (o.forceId === state.playerForceId) {
                  const def = TACTIC_DEFS[itemTactic as keyof typeof TACTIC_DEFS];
                  result.report.entries.push({
                    cityId: o.locationCityId,
                    kind: 'talent',
                    text: `${o.name.en} divined a battle tactic from their treasured item: ${def?.en ?? itemTactic}.`,
                    textZh: `${o.name.zh}由寶物中悟出戰法「${def?.zh ?? itemTactic}」。`,
                  });
                }
                continue;
              }
            }
            // H — policy resonance ~1% per season per known resonant policy
            const polTrait = policyResonanceCandidate(o);
            if (polTrait && Math.random() < 0.01) {
              const cur = (resonated[o.id].traits ?? []) as string[];
              if (!cur.includes(polTrait)) {
                resonated[o.id] = {
                  ...resonated[o.id],
                  traits: [...cur, polTrait] as Officer['traits'],
                };
                anyResonance = true;
                if (o.forceId === state.playerForceId) {
                  const def = TRAIT_DEFS_BY_ID[polTrait];
                  result.report.entries.push({
                    cityId: o.locationCityId,
                    kind: 'talent',
                    text: `${o.name.en} embodied their policies — gained ${def?.name.en ?? polTrait}.`,
                    textZh: `${o.name.zh}久行其政,習得「${def?.name.zh ?? polTrait}」之性。`,
                  });
                }
              }
            }
          }
          if (anyResonance) postOfficers = resonated;
        }

        // ── P12 — Marriage compatibility events (season boundary, rare) ──
        // Spouses with conflicting traits occasionally quarrel (loyalty −2);
        // harmonious spouses occasionally celebrate (loyalty +3).
        if (seasonBoundary) {
          const couples = state.family.filter((rel) => rel.kind === 'spouse');
          const updated: Record<EntityId, Officer> = { ...postOfficers };
          let anyCouple = false;
          for (const rel of couples) {
            const a = updated[rel.officerA];
            const b = updated[rel.officerB];
            if (!a || !b || a.status === 'dead' || b.status === 'dead') continue;
            const comp = maritalCompatibility(a, b);
            if (comp === 'neutral') continue;
            if (Math.random() > 0.04) continue; // 4% per season per couple
            anyCouple = true;
            if (comp === 'discordant') {
              updated[a.id] = { ...a, loyalty: Math.max(0, a.loyalty - 2) };
              updated[b.id] = { ...b, loyalty: Math.max(0, b.loyalty - 2) };
              const isPlayer = a.forceId === state.playerForceId || b.forceId === state.playerForceId;
              if (isPlayer) {
                result.report.entries.push({
                  cityId: a.locationCityId,
                  kind: 'note',
                  text: `${a.name.en} and ${b.name.en} quarreled — loyalty −2 each.`,
                  textZh: `${a.name.zh}與${b.name.zh}夫妻反目,兩人忠誠 −2。`,
                });
              }
            } else {
              updated[a.id] = { ...a, loyalty: Math.min(100, a.loyalty + 3) };
              updated[b.id] = { ...b, loyalty: Math.min(100, b.loyalty + 3) };
              const isPlayer = a.forceId === state.playerForceId || b.forceId === state.playerForceId;
              if (isPlayer) {
                result.report.entries.push({
                  cityId: a.locationCityId,
                  kind: 'note',
                  text: `${a.name.en} and ${b.name.en} found joy in shared spirit — loyalty +3.`,
                  textZh: `${a.name.zh}與${b.name.zh}志趣相投,夫妻和睦,忠誠 +3。`,
                });
              }
              // E — marriage assimilation: small chance one spouse absorbs
              // a bondable trait from the other.
              const assim = rollMarriageAssimilation(updated[a.id], updated[b.id], Math.random);
              if (assim) {
                const target = assim.recipient === 'a' ? updated[a.id] : updated[b.id];
                const cur = (target.traits ?? []) as string[];
                if (!cur.includes(assim.trait)) {
                  const updatedTarget = {
                    ...target,
                    traits: [...cur, assim.trait] as Officer['traits'],
                  };
                  if (assim.recipient === 'a') updated[a.id] = updatedTarget;
                  else updated[b.id] = updatedTarget;
                  const isPlayer2 = target.forceId === state.playerForceId;
                  if (isPlayer2) {
                    const def = TRAIT_DEFS_BY_ID[assim.trait];
                    result.report.entries.push({
                      cityId: target.locationCityId,
                      kind: 'talent',
                      text: `${target.name.en} absorbed their spouse's ${def?.name.en ?? assim.trait} nature.`,
                      textZh: `${target.name.zh}受配偶薰陶,習得「${def?.name.zh ?? assim.trait}」之性。`,
                    });
                  }
                }
              }
            }
          }
          if (anyCouple) postOfficers = updated;

          // ── D — 戰績習性 — officers earn a specialist trait from a sustained
          // record of deeds (3 duels → 鬥將, 5 cities → 攻城, 10 battles → 老兵,
          // 5 espionage → 老謀, 2000 kills → 影行). One per officer per season.
          {
            const deeded = { ...postOfficers };
            let anyDeed = false;
            for (const o of Object.values(postOfficers)) {
              if (o.status === 'dead' || !o.forceId) continue;
              const deedTrait = deedTraitCandidate(o, state.deeds[o.id]);
              if (!deedTrait) continue;
              const cur = (deeded[o.id].traits ?? []) as string[];
              if (cur.includes(deedTrait)) continue;
              deeded[o.id] = { ...deeded[o.id], traits: [...cur, deedTrait] as Officer['traits'] };
              anyDeed = true;
              if (o.forceId === state.playerForceId) {
                const def = TRAIT_DEFS_BY_ID[deedTrait];
                result.report.entries.push({
                  cityId: o.locationCityId,
                  kind: 'talent',
                  text: `${o.name.en} earned the ${def?.name.en ?? deedTrait} trait through repeated deeds.`,
                  textZh: `${o.name.zh}因戰績卓著,習得「${def?.name.zh ?? deedTrait}」之性。`,
                });
              }
            }
            if (anyDeed) postOfficers = deeded;
          }
        }

        // ── P11 — Same-trait bond formation (season boundary, rare) ──
        // Two officers in the same force/city sharing an idealistic trait
        // (chivalrous, scholar, mystical, etc.) occasionally form an oath
        // bond. Adds to runtimeBonds with a moderate loyalty floor.
        // Seed from any 離間計 (sow-discord) fallout this season — a poisoned
        // rapport / severed 義結 must carry into the rest of the social tick.
        // Chain: AI changes (planned) → espionage (espResult) → social tick.
        let bondsAfterTraits = espResult.runtimeBonds ?? planned.runtimeBonds;
        let rapportAfter = espResult.rapport ?? planned.rapport ?? state.rapport;
        let lordRapportAfter = state.lordRapport;
        // Player-relevant bonds forged organically this season → at most one
        // gets a ceremony on the map (kept rare so it stays momentous).
        const seasonBonds: Array<{ aId: EntityId; bId: EntityId; titleZh: string; titleEn: string }> = [];
        if (seasonBoundary) {
          const byCity = new Map<EntityId, Officer[]>();
          for (const o of Object.values(postOfficers)) {
            if (o.status === 'dead' || !o.forceId || !o.locationCityId) continue;
            const key = `${o.forceId}::${o.locationCityId}`;
            const arr = byCity.get(key) ?? [];
            arr.push(o);
            byCity.set(key, arr);
          }
          const existingBondKey = (a: EntityId, b: EntityId) =>
            a < b ? `${a}|${b}` : `${b}|${a}`;
          const existing = new Set(
            bondsAfterTraits.map((b) => existingBondKey(b.officerA, b.officerB)),
          );
          const newBonds: typeof bondsAfterTraits = [];
          for (const officers of byCity.values()) {
            for (let i = 0; i < officers.length; i++) {
              for (let j = i + 1; j < officers.length; j++) {
                const a = officers[i], b = officers[j];
                const key = existingBondKey(a.id, b.id);
                if (existing.has(key)) continue;
                const shared = sharedBondableTrait(a, b);
                if (!shared) continue;
                if (Math.random() > 0.02) continue; // 2% per season per shared pair
                newBonds.push({
                  officerA: a.id,
                  officerB: b.id,
                  floor: 80,
                  kind: 'oath',
                  label: `${shared}-kin`,
                });
                existing.add(key);
                if (a.forceId === state.playerForceId) {
                  result.report.entries.push({
                    cityId: a.locationCityId,
                    kind: 'note',
                    text: `${a.name.en} and ${b.name.en} bonded over shared ${shared} — sworn friends.`,
                    textZh: `${a.name.zh}與${b.name.zh}因同有「${shared}」之性而結為知交。`,
                  });
                  seasonBonds.push({ aId: a.id, bId: b.id, titleZh: '義結金蘭', titleEn: 'A Bond is Sworn' });
                }
              }
            }
          }
          if (newBonds.length > 0) {
            bondsAfterTraits = [...bondsAfterTraits, ...newBonds];
          }

          // 同袍之誼 — officers serving together in a city warm to one another;
          // a pair that crosses the threshold swears a bond of its own accord.
          const bondedPairs = new Set<string>([
            ...OATH_BONDS.map((b) => pairKey(b.officerA, b.officerB)),
            ...bondsAfterTraits.map((b) => pairKey(b.officerA, b.officerB)),
          ]);
          const grown = growRapportFromProximity({
            rapport: rapportAfter, officers: postOfficers, bondedPairs, amount: 2,
            buildings: state.buildings,
          });
          rapportAfter = grown.rapport;
          if (grown.forged.length > 0) {
            bondsAfterTraits = [...bondsAfterTraits, ...grown.forged];
            for (const fb of grown.forged) {
              const a = postOfficers[fb.officerA], b = postOfficers[fb.officerB];
              if (a && a.forceId === state.playerForceId) {
                result.report.entries.push({
                  cityId: a.locationCityId, kind: 'note',
                  text: `${a.name.en} and ${b?.name.en} forge a bond serving side by side.`,
                  textZh: `${a.name.zh}與${b?.name.zh}同袍共事,日久情深,義結金蘭。`,
                });
                if (b) seasonBonds.push({ aId: a.id, bId: b.id, titleZh: '義結金蘭', titleEn: 'A Bond is Sworn' });
              }
            }
          }

          // 嫌隙與宿怨 — the cold half: abrasive egos, lore rivals/enemies and the
          // aggrieved sour on one another. A pair that sinks to −100 forges a 宿怨.
          const feudSkip = new Set<string>([
            ...OATH_BONDS.map((b) => pairKey(b.officerA, b.officerB)),
            ...bondsAfterTraits.map((b) => pairKey(b.officerA, b.officerB)),
          ]);
          const soured = growFrictionFromProximity({
            rapport: rapportAfter, officers: postOfficers, bondedPairs: feudSkip,
            amount: 2, buildings: state.buildings,
          });
          rapportAfter = soured.rapport;
          if (soured.forged.length > 0) {
            bondsAfterTraits = [...bondsAfterTraits, ...soured.forged];
            for (const fb of soured.forged) {
              const a = postOfficers[fb.officerA], b = postOfficers[fb.officerB];
              if (a && a.forceId === state.playerForceId) {
                result.report.entries.push({
                  cityId: a.locationCityId, kind: 'note',
                  text: `${a.name.en} and ${b?.name.en} can no longer abide each other — a bitter feud forms.`,
                  textZh: `${a.name.zh}與${b?.name.zh}積怨難解,結為宿怨 —— 同陣則貌合神離。`,
                });
              }
            }
          }

          // 好感維繫 — pairs no longer serving together cool toward indifference.
          // Bonds and feuds are exempt (they don't fade with distance).
          rapportAfter = decayRapport({
            rapport: rapportAfter, officers: postOfficers, bondedPairs: feudSkip, amount: 1,
          });

          // 君臣好感維繫 — lord rapport eases toward 0; the throne must keep
          // earning it (and the dead drop out).
          lordRapportAfter = decayLordRapport(lordRapportAfter, postOfficers, 1);

          // 義結深化 — sworn bonds grow with shared service (義交 → 金蘭 → 生死之交).
          const deepenRes = deepenBonds(bondsAfterTraits, postOfficers);
          bondsAfterTraits = deepenRes.bonds;
          for (const d of deepenRes.deepened) {
            const a = postOfficers[d.a], b = postOfficers[d.b];
            if (a && a.forceId === state.playerForceId) {
              const tierZh = d.depth >= 3 ? '生死之交' : '義結金蘭';
              result.report.entries.push({
                cityId: a.locationCityId, kind: 'note',
                text: `${a.name.en} and ${b?.name.en}'s bond deepens (${d.depth >= 3 ? 'sworn unto death' : 'sworn brothers'}).`,
                textZh: `${a.name.zh}與${b?.name.zh}情誼日篤,結為${tierZh}。`,
              });
            }
          }

          // 心腹密報 — a confidant (君臣好感 ≥80) keeps the lord's ear: he names a
          // brewing traitor within the realm, or recommends an able man in the wild.
          if (state.playerForceId) {
            const pf = state.playerForceId;
            const hasT = (o: Officer, t: string) => (o.traits as string[] | undefined ?? []).includes(t);
            const confidant = Object.values(postOfficers)
              .filter((o) => o.forceId === pf && o.status !== 'dead' && getLordRapport(lordRapportAfter, o.id) >= 80)
              .sort((a, b) => b.stats.intelligence - a.stats.intelligence)[0];
            if (confidant) {
              const risk = Object.values(postOfficers)
                .filter((o) => o.forceId === pf && o.status !== 'dead' && o.id !== confidant.id &&
                  o.loyalty < 24 && getLordRapport(lordRapportAfter, o.id) < 80 &&
                  (hasT(o, 'ambitious') || hasT(o, 'arrogant') || (o.grievanceCount ?? 0) >= 2))
                .sort((a, b) => a.loyalty - b.loyalty)[0];
              if (risk && Math.random() < 0.5) {
                result.report.entries.push({
                  cityId: confidant.locationCityId, kind: 'note',
                  text: `${confidant.name.en} (心腹) warns the throne: ${risk.name.en} harbours disloyal designs (loyalty ${risk.loyalty}).`,
                  textZh: `心腹${confidant.name.zh}密奏:${risk.name.zh}心懷異志,主公宜早為之備(忠誠 ${risk.loyalty})。`,
                });
              } else if (!risk && Math.random() < 0.2) {
                const talent = Object.values(postOfficers)
                  .filter((o) => o.forceId === null && o.status !== 'dead' && o.status !== 'unsearched' && o.locationCityId &&
                    (o.stats.war + o.stats.leadership + o.stats.intelligence + o.stats.politics) >= 320)
                  .sort((a, b) => (b.stats.war + b.stats.leadership + b.stats.intelligence + b.stats.politics) - (a.stats.war + a.stats.leadership + a.stats.intelligence + a.stats.politics))[0];
                if (talent) {
                  result.report.entries.push({
                    cityId: talent.locationCityId, kind: 'note',
                    text: `${confidant.name.en} (心腹) recommends ${talent.name.en}, an able man living in the wild — worth recruiting.`,
                    textZh: `心腹${confidant.name.zh}舉薦在野賢才${talent.name.zh},主公可遣使招攬。`,
                  });
                }
              }
            }
          }
        }
        // Queue at most one organic-bond ceremony onto the toast-style queue.
        const recentBondsAfter = seasonBonds.length > 0
          ? [...state.recentBonds, seasonBonds[0]]
          : state.recentBonds;

        // ── Burning-city decay (animation lifetime) ──
        // Newly fallen cities ignite for 2 seasons; existing ones tick down.
        const conqueredThisTurn = result.report.entries
          .filter((e) => e.kind === 'conquest' && e.cityId)
          .map((e) => e.cityId as EntityId);
        // 克城 — the first city the player took this turn drives a flag-planting
        // flourish on the map. (Only player conquests; AI gains stay quiet.)
        const playerConquest = conqueredThisTurn.find(
          (id) => postCities[id]?.ownerForceId === state.playerForceId,
        );
        // 失守 — the first city the player held but lost this turn.
        const playerLoss = conqueredThisTurn.find(
          (id) => state.cities[id]?.ownerForceId === state.playerForceId &&
            postCities[id]?.ownerForceId !== state.playerForceId,
        );
        const decayed = state.burningCities
          .map((b) => ({ ...b, seasonsLeft: b.seasonsLeft - 1 }))
          .filter((b) => b.seasonsLeft > 0);
        const newIgnitions = conqueredThisTurn
          .filter((id) => !decayed.some((b) => b.cityId === id))
          .map((id) => ({ cityId: id, seasonsLeft: 2 }));
        const nextBurning = [...decayed, ...newIgnitions];

        // ── Field-battle site marks (ambush/camp-storm/clash) ──
        // New clashes mark the map for 2 seasons; existing marks tick down.
        const decayedMarks = (state.fieldBattleMarks ?? [])
          .map((m) => ({ ...m, seasonsLeft: m.seasonsLeft - 1 }))
          .filter((m) => m.seasonsLeft > 0);
        const nextFieldMarks = [
          ...decayedMarks,
          ...(result.fieldBattleMarks ?? []).map((m) => ({ ...m, seasonsLeft: 2 })),
        ].slice(-40); // cap so the array can't grow unbounded


        // Endings check (only if not in tactical/event states).
        const ending = checkEndings({
          cities: postCities,
          officers: postOfficers,
          forces: postForces,
          playerForceId: state.playerForceId,
          date: result.date,
          victoryGoal: state.victoryGoal ?? 'free',
        });
        let endVS = victoryStatus;
        let endingsAchieved = state.endingsAchieved;
        if (ending && ending.kind !== 'defeat' && !state.endingsAchieved.includes(ending.kind)) {
          endVS = 'victory';
          endingsAchieved = [...state.endingsAchieved, ending.kind];
        }

        // Scenario objective check.
        const objective = findObjectiveFor(
          state.scenarioId,
          state.playerForceId,
          SCENARIO_OBJECTIVES,
        );
        let newAchieved = state.achievedObjectives;
        if (objective) {
          const liveForceIds = new Set<string>();
          for (const c of Object.values(postCities)) {
            if (c.ownerForceId) liveForceIds.add(c.ownerForceId);
          }
          const playerForce = state.playerForceId ? postForces[state.playerForceId] : null;
          const isEmperor = playerForce?.imperialRank === 'emperor';
          const ctx = {
            scenarioId: state.scenarioId,
            playerForceId: state.playerForceId,
            cities: postCities,
            officers: postOfficers,
            year: result.date.year,
            liveForceIds,
            isEmperor,
          };
          const allGoals = [objective.primary, ...(objective.secondary ?? [])];
          for (let i = 0; i < allGoals.length; i++) {
            const goalId = `${objective.id}-${i}`;
            if (newAchieved.includes(goalId)) continue;
            const r = evaluateGoal(allGoals[i].goal, ctx);
            if (r.status === 'success') {
              newAchieved = [...newAchieved, goalId];
              result.report.entries.push({
                cityId: null,
                kind: 'note',
                text: `Objective achieved: ${allGoals[i].title.en}!`,
              });
            }
          }
        }

        // Hero Mode (英雄模式) — score the active challenge; pass/fail ends the run.
        let challengeRecordsAfter = state.challengeRecords;
        if (state.activeChallenge) {
          const challenge = findChallenge(state.activeChallenge);
          if (challenge) {
            const liveForceIds = new Set<string>();
            for (const c of Object.values(postCities)) {
              if (c.ownerForceId) liveForceIds.add(c.ownerForceId);
            }
            const playerForce = state.playerForceId ? postForces[state.playerForceId] : null;
            const status = evaluateChallenge(challenge, {
              scenarioId: state.scenarioId,
              playerForceId: state.playerForceId,
              cities: postCities,
              officers: postOfficers,
              year: result.date.year,
              liveForceIds,
              isEmperor: playerForce?.imperialRank === 'emperor',
            });
            if (status === 'won' && endVS !== 'defeat') {
              endVS = 'victory';
              // Record the win for meta-progression: earliest year + best stars.
              const stars = challengeStars(challenge, result.date.year);
              const prev = state.challengeRecords[challenge.id];
              challengeRecordsAfter = {
                ...state.challengeRecords,
                [challenge.id]: {
                  bestYear: prev ? Math.min(prev.bestYear, result.date.year) : result.date.year,
                  bestStars: Math.max(prev?.bestStars ?? 0, stars),
                },
              };
              result.report.entries.unshift({
                cityId: null,
                kind: 'note',
                text: `Challenge complete — ${challenge.name.en}! (${'★'.repeat(stars)})`,
                textZh: `英雄模式達成 — ${challenge.name.zh}!（${'★'.repeat(stars)}）`,
              });
            } else if (status === 'lost') {
              endVS = 'defeat';
              result.report.entries.unshift({
                cityId: null,
                kind: 'note',
                text: `Challenge failed — ${challenge.name.en}.`,
                textZh: `英雄模式失敗 — ${challenge.name.zh}。`,
              });
            }
          }
        }

        // Port ship-build queue tick — decrement seasonsLeft, complete on 0
        const nextPorts: typeof state.ports = {};
        for (const [id, port] of Object.entries(state.ports)) {
          if (!port.buildQueue || port.buildQueue.length === 0) {
            nextPorts[id] = port;
            continue;
          }
          const ticked = port.buildQueue.map((b) => ({
            ...b, seasonsLeft: b.seasonsLeft - 1,
          }));
          const completed = ticked.filter((b) => b.seasonsLeft <= 0);
          const stillBuilding = ticked.filter((b) => b.seasonsLeft > 0);
          const docked = { ...(port.dockedShips ?? {}) };
          for (const c of completed) {
            docked[c.shipClass] = (docked[c.shipClass] ?? 0) + 1;
          }
          nextPorts[id] = { ...port, buildQueue: stillBuilding, dockedShips: docked };
          if (completed.length > 0 && port.ownerForceId === state.playerForceId) {
            result.report.entries.push({
              kind: 'command-success',
              cityId: port.linkedCityId,
              text: `${port.name.zh}: ${completed.length} ship${completed.length > 1 ? 's' : ''} ready.`,
            });
          }
        }

        // 野外據點 — carried forward; AI may seize neutral ones below.
        let nextSites = state.sites;
        // 名所 loot carried forward; AI 訪賢 may claim a recluse below.
        let nextScenicLooted = state.scenicLooted;
        // Fort tick — stockades rot if their timer hits 0 (skip permanent forts)
        const nextForts: typeof state.forts = {};
        for (const [id, fort] of Object.entries(state.forts)) {
          if (fort.subtype === 'stockade' && fort.seasonsRemaining !== undefined) {
            const seasonsLeft = fort.seasonsRemaining - 1;
            if (seasonsLeft <= 0) {
              if (fort.ownerForceId === state.playerForceId) {
                result.report.entries.push({
                  kind: 'command-failure',
                  cityId: fort.guards[0] ?? null,
                  text: `${fort.name.zh} has rotted away.`,
                });
              }
              continue;   // remove
            }
            nextForts[id] = { ...fort, seasonsRemaining: seasonsLeft };
          } else {
            nextForts[id] = fort;
          }
        }

        // AI 施設 — frontier forces fortify with strategic facilities (箭樓/投石臺/
        // 防壁) once a season; built from their capital's coffers, capped so the
        // map can't fill up. The same forts then interdict marches & join battles.
        if (seasonBoundary) {
          const aiFac = planAIFacilities({
            cities: postCities,
            forces: postForces,
            forts: nextForts,
            diplomacy: planned.diplomacy,
            playerForceId: state.playerForceId,
            rng: Math.random,
          });
          postCities = aiFac.cities;
          Object.assign(nextForts, aiFac.newForts);
          if (aiFac.entries.length > 0) result.report.entries.push(...aiFac.entries);

          // AI 拔點 — hostile forces storm the player's nearby forts/facilities
          // (HP damage, razed at 0; the assaulting garrison bleeds for it).
          const assault = planAIFortAssaults({
            cities: postCities,
            forces: postForces,
            forts: nextForts,
            diplomacy: planned.diplomacy,
            playerForceId: state.playerForceId,
            rng: Math.random,
          });
          postCities = assault.cities;
          for (const k of Object.keys(nextForts)) delete nextForts[k];
          Object.assign(nextForts, assault.forts);
          if (assault.entries.length > 0) result.report.entries.push(...assault.entries);

          // AI 拓野 — hostile forces grab neutral mines/fords/bandit nests
          // near their garrisons (income/control; clears raiders on their land).
          const aiSeize = planAISiteSeizures({
            cities: postCities,
            forces: postForces,
            sites: nextSites,
            playerForceId: state.playerForceId,
            rng: Math.random,
          });
          postCities = aiSeize.cities;
          nextSites = aiSeize.sites;
          if (aiSeize.entries.length > 0) result.report.entries.push(...aiSeize.entries);

          // AI 邊功 — rivals also 訪賢 (court recluses), 征討異族 (punish border
          // tribes) and 擴建船塢 (grow their navy). Parity with the player.
          const fx = planAIFrontierExploits({
            cities: postCities,
            officers: postOfficers,
            forces: postForces,
            ports: nextPorts,
            aggression: nextAggression,
            scenicLooted: nextScenicLooted,
            playerForceId: state.playerForceId,
            rng: Math.random,
          });
          postCities = fx.cities;
          postOfficers = fx.officers;
          nextAggression = fx.aggression;
          nextScenicLooted = fx.scenicLooted;
          for (const k of Object.keys(nextPorts)) delete nextPorts[k];
          Object.assign(nextPorts, fx.ports);
          if (fx.entries.length > 0) result.report.entries.push(...fx.entries);
        }

        // Wishes consumed by training completions this tick — filtered out
        // of officerWishes when state is set below.
        const consumedWishIds = new Set<string>();
        // ── Academy training: merge AI's new trainings, sweep stale, then tick ──
        // AI may have started new trainings this turn — merge them in first
        // so they get the same lifecycle treatment as player trainings.
        let nextTrainings: typeof state.pendingTrainings = planned.newTrainings.length > 0
          ? [...state.pendingTrainings, ...planned.newTrainings]
          : state.pendingTrainings;
        // Sweep so trainings whose officer died / whose city was lost
        // this turn get cleaned up before the tick runs. No refund.
        if (nextTrainings.length > 0) {
          const swept = sweepStaleTrainings(nextTrainings, postOfficers, postCities);
          nextTrainings = swept.remaining;
          for (const dropped of swept.dropped) {
            // Only surface player-side cancellations to the report — AI's
            // own interrupted trainings would be noise.
            const o = state.officers[dropped.officerId];
            if (o?.forceId !== state.playerForceId) continue;
            const polDef = POLICY_DEFS[dropped.policyId];
            result.report.entries.push({
              cityId: dropped.cityId,
              kind: 'command-failure',
              text: `Academy training of ${polDef?.en ?? dropped.policyId} was interrupted.`,
              textZh: `「${polDef?.zh ?? dropped.policyId}」書院培訓中斷。`,
            });
          }
        }
        // Officers (and mentors) credited with completing a training this
        // season — fed into 武功榜 (育成 column) below.
        const trainingsCompletedIds: EntityId[] = [];
        // Trainings only count down on season boundaries (every 9 periods).
        // When a training completes, push the policy onto the officer.
        if (seasonBoundary && nextTrainings.length > 0) {
          // Cities that saw combat this period — siege / battle disrupts study.
          const besiegedCityIds = new Set<EntityId>();
          for (const e of result.report.entries) {
            if ((e.kind === 'battle' || e.kind === 'defeat' || e.kind === 'conquest') && e.cityId) {
              besiegedCityIds.add(e.cityId);
            }
          }
          const ticked = tickTrainings(nextTrainings, besiegedCityIds);
          nextTrainings = ticked.remaining;
          // Surface paused trainings to player so they know why nothing progressed.
          for (const p of ticked.paused) {
            const o = state.officers[p.officerId];
            if (o?.forceId !== state.playerForceId) continue;
            const polDef = POLICY_DEFS[p.policyId];
            result.report.entries.push({
              cityId: p.cityId,
              kind: 'note',
              text: `Training of ${polDef?.en ?? p.policyId} paused (city under attack).`,
              textZh: `「${polDef?.zh ?? p.policyId}」培訓暫停 (城遭兵燹)。`,
            });
          }
          if (ticked.completed.length > 0) {
            const officersUpd = { ...postOfficers };
            for (const t of ticked.completed) {
              const o = officersUpd[t.officerId];
              if (!o || o.status === 'dead') continue;
              // Credit the trainee — and mentor, if any — with the 育成 deed.
              trainingsCompletedIds.push(t.officerId);
              if (t.mentorOfficerId) trainingsCompletedIds.push(t.mentorOfficerId);
              // Tactic completion path
              if (t.kind === 'tactic' && t.tacticId) {
                const haveT = o.tactics ?? [];
                if (haveT.includes(t.tacticId)) continue;
                officersUpd[t.officerId] = { ...o, tactics: [...haveT, t.tacticId] };
                const tacDef = TACTIC_DEFS[t.tacticId];
                result.report.entries.push({
                  cityId: t.cityId,
                  kind: 'talent',
                  text: `${o.name.en} mastered the ${tacDef?.en ?? t.tacticId} tactic.`,
                  textZh: `${o.name.zh}習得戰法「${tacDef?.zh ?? t.tacticId}」。`,
                });
                continue;
              }
              const have = o.policies ?? [];
              if (have.includes(t.policyId)) continue;
              // X2 — wish bonus on completion (loyalty + report note)
              const wish = state.officerWishes.find(
                (w) =>
                  w.officerId === t.officerId &&
                  w.kind === 'learn-policy' &&
                  w.targetId === t.policyId &&
                  !consumedWishIds.has(w.id),
              );
              const advisorMul = appointmentBonusFor(
                o.forceId,
                state.appointments,
                officersUpd,
              ).advisorMultiplier;
              const wishBonus = wish ? Math.ceil(wish.grantBonus * advisorMul) : 0;
              const newLoyalty = wish
                ? Math.min(100, o.loyalty + wishBonus)
                : o.loyalty;
              officersUpd[t.officerId] = { ...o, policies: [...have, t.policyId], loyalty: newLoyalty };
              if (wish) consumedWishIds.add(wish.id);
              const polDef = POLICY_DEFS[t.policyId];
              result.report.entries.push({
                cityId: t.cityId,
                kind: 'talent',
                text: `${o.name.en} completed academy training and learned ${polDef?.en ?? t.policyId}.${wish ? ` (Wish granted, loyalty +${wishBonus}.)` : ''}`,
                textZh: `${o.name.zh}書院培訓畢業,習得「${polDef?.zh ?? t.policyId}」。${wish ? `(夙願得償,忠誠 +${wishBonus}。)` : ''}`,
              });
              // X1 — Parent mentor: ~15% chance the parent gains 'erudite'
              // trait from teaching their child (only if they don't have it).
              if (t.mentorOfficerId) {
                const mentor = officersUpd[t.mentorOfficerId];
                if (mentor && mentor.status !== 'dead' && isParentMentor(mentor, o, state.family)) {
                  const mTraits = mentor.traits ?? [];
                  if (!mTraits.includes('erudite') && Math.random() < 0.15) {
                    officersUpd[t.mentorOfficerId] = {
                      ...mentor,
                      traits: [...mTraits, 'erudite'],
                    };
                    if (mentor.forceId === state.playerForceId) {
                      result.report.entries.push({
                        cityId: t.cityId,
                        kind: 'talent',
                        text: `${mentor.name.en} grew in wisdom from teaching ${o.name.en} — gained the Erudite trait.`,
                        textZh: `${mentor.name.zh}教導${o.name.zh}有成,自身亦增博學,習得「博學」之性。`,
                      });
                    }
                  }
                }
              }
            }
            postOfficers = officersUpd;
          }
        }

        // Merge deed deltas from resolveSeason + espionage successes +
        // training completions + births into 武功榜 tracking.
        const nextDeeds = { ...state.deeds };
        // Track per-season deltas separately so we can crown season MVPs.
        const seasonDeltas: Record<EntityId, Partial<import('../types').HeroicDeeds>> = {};
        const bumpDeed = (id: string, patch: Partial<import('../types').HeroicDeeds>) => {
          const cur = nextDeeds[id] ?? createDeeds(id);
          nextDeeds[id] = { ...cur, ...Object.fromEntries(
            Object.entries(patch).map(([k, v]) => [k, ((cur[k as keyof typeof cur] as number) ?? 0) + (v as number)]),
          ) } as import('../types').HeroicDeeds;
          const prev = seasonDeltas[id] ?? {};
          const merged: Partial<import('../types').HeroicDeeds> = { ...prev };
          for (const [k, v] of Object.entries(patch)) {
            const prevVal = (prev[k as keyof typeof prev] as number) ?? 0;
            (merged as Record<string, number>)[k] = prevVal + (v as number);
          }
          seasonDeltas[id] = merged;
        };
        for (const delta of result.deedDeltas ?? []) {
          bumpDeed(delta.officerId, delta.patch);
        }
        for (const agentId of espionageSuccesses) {
          bumpDeed(agentId, { espionageSuccess: 1 });
        }
        for (const officerId of trainingsCompletedIds) {
          bumpDeed(officerId, { trainingsCompleted: 1 });
        }
        for (const heir of fam.pendingHeirs) {
          // Credit only newly-added heirs this tick (not the carryover).
          if (state.pendingHeirs.some((h) => h.id === heir.id)) continue;
          bumpDeed(heir.parentAId, { childrenSired: 1 });
          bumpDeed(heir.parentBId, { childrenSired: 1 });
        }
        // Fold transient battlefield deltas into the per-officer season
        // map so 殲敵/生擒/攻陷 also get MVPs.
        for (const [id, b] of Object.entries(state.seasonBattleDeltas)) {
          const prev = seasonDeltas[id] ?? {};
          seasonDeltas[id] = {
            ...prev,
            killsTroops: ((prev.killsTroops as number) ?? 0) + b.killsTroops,
            captured:    ((prev.captured as number) ?? 0)    + b.captured,
            citiesTaken: ((prev.citiesTaken as number) ?? 0) + b.citiesTaken,
          };
        }
        // Season-MVP highlights: for each category that saw activity this
        // tick, name the top officer. Surfaces in the season report.
        if (seasonBoundary) {
          const mvpCategories: Array<{
            key: keyof import('../types').HeroicDeeds;
            labelZh: string; labelEn: string; min: number;
          }> = [
            { key: 'killsTroops',        labelZh: '殲敵之最', labelEn: 'Kills MVP',    min: 500 },
            { key: 'captured',           labelZh: '生擒之最', labelEn: 'Captures MVP', min: 1 },
            { key: 'citiesTaken',        labelZh: '攻陷之最', labelEn: 'Sieges MVP',   min: 1 },
            { key: 'duelsWon',           labelZh: '一騎之最', labelEn: 'Duel MVP',     min: 1 },
            { key: 'civicWorks',         labelZh: '内政之最', labelEn: 'Civic MVP',    min: 2 },
            { key: 'espionageSuccess',   labelZh: '謀略之最', labelEn: 'Plot MVP',     min: 1 },
            { key: 'trainingsCompleted', labelZh: '育才之最', labelEn: 'Training MVP', min: 1 },
            { key: 'childrenSired',      labelZh: '麟趾之慶', labelEn: 'Heir MVP',     min: 1 },
          ];
          for (const cat of mvpCategories) {
            let bestId: EntityId | null = null;
            let bestVal = 0;
            for (const [id, delta] of Object.entries(seasonDeltas)) {
              const v = (delta[cat.key] as number) ?? 0;
              if (v > bestVal) { bestVal = v; bestId = id; }
            }
            if (!bestId || bestVal < cat.min) continue;
            const winner = postOfficers[bestId];
            if (!winner) continue;
            result.report.entries.push({
              cityId: winner.locationCityId,
              kind: 'talent',
              text: `${cat.labelEn}: ${winner.name.en} (${bestVal} this season).`,
              textZh: `「${cat.labelZh}」: ${winner.name.zh} (本季 ${bestVal})。`,
            });
          }
        }
        // After deed bumps, grant any newly-earned epithets.
        const titleGrant = grantDeedTitles(nextDeeds, postOfficers);
        Object.assign(nextDeeds, titleGrant.deeds);
        postOfficers = titleGrant.officers;
        if (titleGrant.entries.length > 0) {
          result.report.entries.push(...titleGrant.entries);
        }

        // 威名 — refresh each officer's cached prestige title from the freshly
        // updated stats + deeds, and announce anyone who rose to a new rank.
        const prestigeRefresh = refreshPrestige(postOfficers, nextDeeds);
        postOfficers = prestigeRefresh.officers;
        const newPrestige = prestigeRefresh.awards;
        const prestigeCeremonies: Array<{ officerId: EntityId; titleId: string }> = [];
        for (const aw of newPrestige) {
          const o = postOfficers[aw.officerId];
          const title = prestigeTitleById(aw.titleId);
          if (!o || !title) continue;
          result.report.entries.push({
            cityId: o.locationCityId,
            kind: 'talent',
            text: `${o.name.en} earns the prestige of ${title.name.en}!`,
            textZh: `${o.name.zh}威名遠播,獲「${title.name.zh}」之譽!`,
          });
          // A player officer rising to a top-tier title earns a 封號 ceremony.
          if (o.forceId === state.playerForceId && TOP_PRESTIGE_IDS.includes(aw.titleId)) {
            prestigeCeremonies.push({ officerId: aw.officerId, titleId: aw.titleId });
          }
        }
        const recentPrestigeCeremonyAfter = prestigeCeremonies.length > 0
          ? [...state.recentPrestigeCeremony, prestigeCeremonies[0]]
          : state.recentPrestigeCeremony;

        // 晉牌封賞 — a player officer who crossed into a 金牌+ 品階 this season
        // (tagged on the report entry by grantXp) earns a ceremony flourish.
        const promotionCeremonies = result.report.entries
          // NOTE: read postOfficers, not officersWithMarchTask — the latter is
          // declared further below (TDZ); the march-task tag doesn't change forceId.
          .filter((e) => e.promotion && postOfficers[e.promotion.officerId]?.forceId === state.playerForceId)
          .map((e) => e.promotion!);
        const recentPromotionsAfter = promotionCeremonies.length > 0
          ? [...state.recentPromotions, ...promotionCeremonies]
          : state.recentPromotions;

        // 一代記 — auto-record chronicle milestones: prestige attained and
        // career rank promotions for the player's chronicle hero.
        let careerModeAfterSeason = state.careerMode;
        if (state.careerMode) {
          const cid = state.careerMode.officerId;
          const ms: Array<{ title: { zh: string; en: string }; year: number; season: 'spring' | 'summer' | 'autumn' | 'winter' }> = [];
          const pr = newPrestige.find((a) => a.officerId === cid);
          if (pr) {
            const title = prestigeTitleById(pr.titleId);
            if (title) ms.push({
              title: { zh: `威名 — ${title.name.zh}`, en: `Prestige: ${title.name.en}` },
              year: result.date.year, season: result.date.season,
            });
          }
          // 封爵 / 拜將 — a new peerage or honorific is a milestone too.
          const oldOff = state.officers[cid];
          const newOff = postOfficers[cid];
          if (newOff?.peerageId && newOff.peerageId !== oldOff?.peerageId) {
            const peer = peerageById(newOff.peerageId);
            if (peer) ms.push({
              title: { zh: `封爵 — ${peer.name.zh}`, en: `Enfeoffed: ${peer.name.en}` },
              year: result.date.year, season: result.date.season,
            });
          }
          if (newOff?.honorificId && newOff.honorificId !== oldOff?.honorificId) {
            const hon = HONORIFICS_BY_ID[newOff.honorificId];
            if (hon) ms.push({
              title: { zh: `拜將 — ${hon.name.zh}`, en: `Honorific: ${hon.name.en}` },
              year: result.date.year, season: result.date.season,
            });
          }
          const oldRank = careerStanding(state.deeds[cid]).rank;
          const newStanding = careerStanding(nextDeeds[cid]);
          if (newStanding.rank < oldRank) {
            ms.push({
              title: { zh: `晉升 — ${newStanding.status.zh}（品 ${newStanding.rank}）`, en: `Promoted: ${newStanding.status.en} (rank ${newStanding.rank})` },
              year: result.date.year, season: result.date.season,
            });
            result.report.entries.push({
              cityId: postOfficers[cid]?.locationCityId ?? null,
              kind: 'note',
              text: `${postOfficers[cid]?.name.en ?? 'You'} rise to ${newStanding.status.en}.`,
              textZh: `${postOfficers[cid]?.name.zh ?? '主角'}晉升為${newStanding.status.zh}。`,
            });
          }
          if (ms.length > 0) {
            careerModeAfterSeason = { ...state.careerMode, milestones: [...state.careerMode.milestones, ...ms] };
          }
        }

        // Prune appointments whose holders died / were captured / defected
        // / lost their city this season. Emit a vacancy notice + history.
        const prune = pruneStaleAppointments(appointmentsAfterAI, postOfficers, postCities);
        const prunedAppointments = prune.appointments;
        const pruneHistoryAppends: import('../types').AppointmentHistoryEntry[] = prune.dropped.map((d) => ({
          kind: 'revoke',
          year: state.date.year,
          season: state.date.season,
          officerId: d.appointment.officerId,
          forceId: d.appointment.forceId,
          titleId: d.appointment.titleId,
          cityId: d.appointment.cityId,
          reason: d.reason,
        }));
        for (const drop of prune.dropped) {
          const def = CIVIC_TITLES_BY_ID[drop.appointment.titleId];
          const oName = postOfficers[drop.appointment.officerId]?.name;
          if (!def || !oName) continue;
          const reasonZh: Record<typeof drop.reason, string> = {
            'dead': '薨', 'imprisoned': '被擒', 'defected': '叛去',
            'lost-city': '失城', 'missing': '不知所終',
          };
          const reasonEn: Record<typeof drop.reason, string> = {
            'dead': 'died', 'imprisoned': 'captured', 'defected': 'defected',
            'lost-city': 'lost city', 'missing': 'vanished',
          };
          result.report.entries.push({
            cityId: drop.appointment.cityId ?? null,
            kind: 'note',
            text: `${oName.en} (${def.name.en}) ${reasonEn[drop.reason]} — post vacant.`,
            textZh: `${oName.zh}（${def.name.zh}）${reasonZh[drop.reason]}，職位空缺。`,
          });
        }

        // In-transit multi-season marches stay in pendingCommands; their
        // commanders also need `task: 'march'` preserved so they can't be
        // reassigned to other duties while the army is on the road.
        const carriedCommands = result.keptCommands ?? {};
        let officersWithMarchTask = postOfficers;
        if (Object.keys(carriedCommands).length > 0) {
          officersWithMarchTask = { ...postOfficers };
          for (const cmd of Object.values(carriedCommands)) {
            if (cmd.type !== 'march') continue;
            const o = officersWithMarchTask[cmd.officerId];
            if (o) officersWithMarchTask[cmd.officerId] = { ...o, task: 'march' };
            for (const xId of cmd.additionalOfficerIds ?? []) {
              const x = officersWithMarchTask[xId];
              if (x) officersWithMarchTask[xId] = { ...x, task: 'march' };
            }
          }
        }

        // 圖鑑 — everyone on the stage this season is "seen"; your own
        // roster counts as having carried your colors (cross-campaign album).
        if (seasonBoundary) {
          const staged = Object.values(officersWithMarchTask).filter((o) => o.forceId && o.status !== 'dead');
          codexMarkSeen(staged.map((o) => o.id));
          if (state.playerForceId) {
            codexMarkRecruitedMany(staged.filter((o) => o.forceId === state.playerForceId).map((o) => o.id));
          }
        }

        // 求賢令出寒門 — while a force's call rings, commoners answer:
        // a generated officer of humble birth may join one of its cities.
        if (seasonBoundary) {
          for (const fid of Object.keys(state.recruitBonusSeasons)) {
            // 名聲招賢 — a famed, humane lord draws more & better talent.
            const force = state.forces[fid];
            const ruler = force ? (officersWithMarchTask[force.rulerOfficerId] ?? state.officers[force.rulerOfficerId]) : undefined;
            const cityCount = Object.values(postCities).filter((c) => c.ownerForceId === fid).length;
            const draw = lordTalentDraw({
              cityCount,
              rulerCharisma: ruler?.stats.charisma ?? 50,
              rulerRenown: ruler?.renown,
            });
            if (Math.random() >= commonerArrivalChance(draw)) continue;
            const arrivalCity = commonerArrivalCity(postCities, fid, Math.random);
            if (!arrivalCity) continue;
            const newcomer = generateCommonerOfficer({
              year: result.date.year,
              forceId: fid,
              cityId: arrivalCity.id,
              takenIds: new Set(Object.keys(officersWithMarchTask)),
              rng: Math.random,
              quality: draw,
            });
            officersWithMarchTask[newcomer.id] = newcomer;
            const grand = draw >= 0.6;
            result.report.entries.push({
              cityId: arrivalCity.id,
              kind: 'talent',
              text: `${newcomer.name.en}, ${grand ? 'a gifted talent' : 'a commoner of promise'}, answers the Call for Talent at ${arrivalCity.name.en}.`,
              textZh: `求賢令下,${grand ? '豪傑之士' : '寒門之士'}${newcomer.name.zh}至${arrivalCity.name.zh}投效。`,
            });
          }

          // 舉薦 — a connected, capable officer surfaces a hidden talent (賢以薦賢).
          // Every court does this now, not just the player's: a rival's 荀彧 can
          // name a 郭嘉 into their own city — which 群雄競聘 (below) then courts —
          // so the player no longer holds an exclusive talent pipeline.
          for (const force of Object.values(state.forces)) {
            const isPlayer = force.id === state.playerForceId;
            for (const r of rollRecommendations({ officers: officersWithMarchTask, forceId: force.id, rng: Math.random })) {
              const rec = officersWithMarchTask[r.recommenderId];
              const found = officersWithMarchTask[r.revealedId];
              if (!rec || !found) continue;
              const city = r.cityId ? postCities[r.cityId] : null;
              officersWithMarchTask[found.id] = {
                ...found, status: 'idle', forceId: null, loyalty: 0,
                locationCityId: r.cityId ?? found.locationCityId,
                recommended: true, // 舉薦作保 — easier to recruit while flagged.
              };
              // The player gets the courtship prompt; an AI's recommendation is
              // surfaced quietly (it reports when 群雄競聘 lands the recruit).
              if (isPlayer) {
                result.report.entries.push({
                  cityId: r.cityId ?? null,
                  kind: 'talent',
                  text: `${rec.name.en} recommends a hidden talent — ${found.name.en} surfaces${city ? ` at ${city.name.en}` : ''}, awaiting your courtship.`,
                  textZh: `${rec.name.zh}薦舉賢才,${found.name.zh}現身${city ? `於${city.name.zh}` : ''},待主公延攬。`,
                });
              }
            }
          }

          // 月旦評(公開評議)— each season your keenest 名士 publicly sizes up the
          // realm's strongest unread 在野 talent: a name made (renown), and a
          // glowing read inclines that worthy toward your house (知遇之恩).
          {
            const pick = pickMonthlyAppraisal(officersWithMarchTask, state.playerForceId);
            if (pick) {
              const { critic, target } = pick;
              const verdict = legendaryVerdict(target) ?? appraisalVerdict(target);
              const gain = appraisalRenownGain(critic, target);
              officersWithMarchTask[target.id] = {
                ...officersWithMarchTask[target.id],
                appraisal: verdict,
                renown: (target.renown ?? 0) + gain.target,
                ...(verdict.grade === 'upper' && state.playerForceId ? { recognizedByForceId: state.playerForceId } : {}),
              };
              officersWithMarchTask[critic.id] = { ...officersWithMarchTask[critic.id], renown: (critic.renown ?? 0) + gain.appraiser };
              result.report.entries.push({
                cityId: critic.locationCityId ?? null,
                kind: 'talent',
                text: `月旦評 — ${critic.name.en} pronounces ${target.name.en} ${verdict.grade === 'upper' ? 'a talent of the first rank' : 'worth the realm’s notice'}; the worthy is flattered to be known.`,
                textZh: `月旦評 — ${critic.name.zh}品${target.name.zh}為${verdict.grade === 'upper' ? '上品令器' : '可觀之才'},士林傾慕,其人感知遇之意。`,
              });
            }
          }

          // 群雄競聘 — rival lords also court free agents idling in their own
          // cities; dither too long and a talent slips into an enemy's service.
          for (const force of Object.values(state.forces)) {
            if (force.id === state.playerForceId) continue;
            if (Math.random() >= 0.5) continue; // not every court every season
            const aiRuler = officersWithMarchTask[force.rulerOfficerId];
            if (!aiRuler) continue;
            const candidates = Object.values(officersWithMarchTask).filter(
              (o) => o.forceId === null && o.status === 'idle' && o.locationCityId
                && postCities[o.locationCityId]?.ownerForceId === force.id,
            );
            if (candidates.length === 0) continue;
            // Court the most capable one in town.
            const prospect = candidates.sort((a, b) => {
              const sum = (o: typeof a) => o.stats.war + o.stats.leadership + o.stats.intelligence + o.stats.politics + o.stats.charisma;
              return sum(b) - sum(a);
            })[0];
            const pCity = postCities[prospect.locationCityId!];
            if (!pCity) continue;
            const aiCities = Object.values(postCities).filter((c) => c.ownerForceId === force.id).length;
            const r = attemptFreeAgentRecruit({
              officer: prospect, city: pCity, recruiterForce: force, recruiterRuler: aiRuler,
              recruiterReputation: { citiesOwned: aiCities }, family: state.family, free: true, rng: Math.random,
            });
            if (r.ok && r.recruitedOfficer) {
              officersWithMarchTask[prospect.id] = { ...r.recruitedOfficer, recommended: undefined };
              result.report.entries.push({
                cityId: pCity.id,
                kind: 'talent',
                text: `${force.name.en} wins the free agent ${prospect.name.en} into service at ${pCity.name.en}.`,
                textZh: `${force.name.zh}延攬在野之士${prospect.name.zh}於${pCity.name.zh}。`,
              });
            }
          }
        }

        // 絲路商路 — a 遠使 that opened a distant realm establishes a standing
        // caravan; opened realms pay seasonal trade gold to their frontier city.
        const nextOpenedRealms = { ...(state.openedRealms ?? {}), ...(result.expeditionRealmsOpened ?? {}) };
        if (result.expeditionRealmsOpened) {
          for (const [realmId, cid] of Object.entries(result.expeditionRealmsOpened)) {
            if (state.openedRealms?.[realmId]) continue; // already open — no fanfare
            const c = postCities[cid];
            const realm = FOREIGN_REALMS_BY_ID[realmId];
            if (c && realm) result.report.entries.push({
              cityId: cid,
              kind: 'expedition',
              text: `A standing caravan now links ${c.name.en} to ${realm.name.en} — trade flows each season.`,
              textZh: `${c.name.zh}通${realm.name.zh},絲路商隊往來,歲歲有利。`,
            });
          }
        }
        if (seasonBoundary) {
          for (const [realmId, cid] of Object.entries(nextOpenedRealms)) {
            const c = postCities[cid];
            if (!c || c.ownerForceId !== state.playerForceId) continue;
            const inc = realmTradeIncome(realmId);
            if (inc > 0) postCities = { ...postCities, [cid]: { ...c, gold: c.gold + inc } };
          }
        }

        // 遠邦關係 — fold in relation gained by this season's embassies (cap 100).
        const nextRealmRelations = { ...(state.realmRelations ?? {}) };
        if (result.expeditionRealmRelationDeltas) {
          for (const [rid, d] of Object.entries(result.expeditionRealmRelationDeltas)) {
            nextRealmRelations[rid] = Math.max(0, Math.min(100, (nextRealmRelations[rid] ?? 0) + d));
          }
        }

        // 反向來使 — a realm the player has opened may send a tribute embassy of
        // its own (the warmer the standing, the likelier). 受其朝貢、得異寶。
        let nextMandateAfterEnvoy = nextMandate;
        if (seasonBoundary) {
          for (const [realmId, cid] of Object.entries(nextOpenedRealms)) {
            const c = postCities[cid];
            const realm = FOREIGN_REALMS_BY_ID[realmId];
            if (!c || !realm || c.ownerForceId !== state.playerForceId) continue;
            const rel = nextRealmRelations[realmId] ?? 0;
            if (Math.random() >= 0.06 + rel / 500) continue; // ~6–26%/season
            const tribute = realmTradeIncome(realmId) * 2 + Math.floor(Math.random() * 400);
            postCities = { ...postCities, [cid]: { ...c, gold: c.gold + tribute } };
            const parts: string[] = [`金 ${tribute.toLocaleString()}`];
            const partsEn: string[] = [`${tribute.toLocaleString()} gold`];
            const pfid = state.playerForceId;
            if (pfid && realm.reward.prestige) {
              const m = { ...nextMandateAfterEnvoy.byForce };
              m[pfid] = Math.max(0, Math.min(100, (m[pfid] ?? 50) + 2));
              nextMandateAfterEnvoy = { ...nextMandateAfterEnvoy, byForce: m };
              parts.push('天命 +2'); partsEn.push('prestige +2');
            }
            result.report.entries.push({
              cityId: cid,
              kind: 'expedition',
              text: `An envoy from ${realm.name.en} arrives at ${c.name.en} bearing tribute: ${partsEn.join(', ')}.`,
              textZh: `${realm.name.zh}遣使來朝${c.name.zh},奉貢:${parts.join('、')}。`,
            });
          }
        }
        nextMandate = nextMandateAfterEnvoy;

        // 遠使勳功 — embassy achievements (reuse the fire-event trigger pipeline).
        const embassyAchUnlocks: string[] = [];
        if (result.expeditionRealmsOpened) {
          let achE = loadAchievementProgress();
          const newlyOpened = Object.keys(result.expeditionRealmsOpened).filter((rid) => !state.openedRealms?.[rid]);
          for (const rid of newlyOpened) {
            const realm = FOREIGN_REALMS_BY_ID[rid];
            if (!realm) continue;
            for (const tgt of [`embassy-${realm.region}`, `embassy-realm-${rid}`]) {
              const r = processTrigger(achE, { kind: 'fire-event', targetId: tgt });
              achE = r.progress; embassyAchUnlocks.push(...r.newlyUnlocked);
            }
          }
          if (Object.keys(nextOpenedRealms).length >= 5) {
            const r = processTrigger(achE, { kind: 'fire-event', targetId: 'embassy-open-5' });
            achE = r.progress; embassyAchUnlocks.push(...r.newlyUnlocked);
          }
          if (newlyOpened.length > 0) saveAchievementProgress(achE);
        }

        // 聯姻同盟 upkeep — hold standing alliances' relations at/above floor and
        // prune any whose partner realm has fallen. Season-bounded.
        const allianceTick = seasonBoundary
          ? tickMarriageAlliances({
              alliances: state.marriageAlliances,
              diplomacy: postDiplomacy,
              livingForceIds: new Set(
                Object.values(postCities).map((c) => c.ownerForceId).filter(Boolean) as EntityId[],
              ),
            })
          : { diplomacy: postDiplomacy, alliances: state.marriageAlliances, entries: [] };
        postDiplomacy = allianceTick.diplomacy;

        // 失都遷治 — any force whose 治所 changed hands this season relocates its
        // seat to its largest surviving city, and its whole realm's 民忠 reels
        // from the shock. Covers conquests from every path (AI, interactive,
        // assault, seizure) since it runs on the final cities/forces.
        {
          const capFix = reassignLostCapitals(postForces, postCities);
          postForces = capFix.forces;
          for (const l of capFix.lost) {
            const f = postForces[l.forceId];
            const updated: Record<EntityId, City> = {};
            for (const c of Object.values(postCities)) {
              if (c.ownerForceId === l.forceId) {
                updated[c.id] = { ...c, loyalty: Math.max(0, c.loyalty - LOST_CAPITAL_LOYALTY_PENALTY) };
              }
            }
            if (Object.keys(updated).length > 0) postCities = { ...postCities, ...updated };
            const newName = postCities[l.newCapitalId]?.name;
            result.report.entries.push({
              cityId: l.newCapitalId,
              kind: 'rebellion',
              text: `${f?.name.en ?? 'A realm'} lost its capital — the court relocates to ${newName?.en ?? '?'} (realm-wide loyalty −${LOST_CAPITAL_LOYALTY_PENALTY}).`,
              textZh: `${f?.name.zh ?? '某勢力'}失其治所,遷都${newName?.zh ?? '?'}。失都動搖,全境民忠 −${LOST_CAPITAL_LOYALTY_PENALTY}。`,
            });
          }
        }

        // 州牧 — a provincial governor (player-appointed) runs his province as a
        // unit: every season his cities gain order (民忠) and a little revenue,
        // scaled by his administrative talent (政 0.6 + 魅 0.4). A dead/lost
        // governor simply yields nothing until reassigned. Player-only (the AI
        // doesn't appoint 州牧). Modest by design — it rewards holding a whole
        // province under one trusted name without occupying him elsewhere.
        if (seasonBoundary && state.playerForceId && Object.keys(state.provinceGovernors ?? {}).length > 0) {
          const govPatch: Record<string, City> = {};
          for (const [provinceId, officerId] of Object.entries(state.provinceGovernors)) {
            const gov = officerId ? postOfficers[officerId] : null;
            if (!gov || gov.status === 'dead' || gov.forceId !== state.playerForceId) continue;
            const province = PROVINCES_BY_ID[provinceId];
            if (!province) continue;
            const admin = gov.stats.politics * 0.6 + gov.stats.charisma * 0.4;
            const loyaltyGain = admin >= 80 ? 2 : 1;
            const goldBonus = Math.round(gov.stats.politics / 12);
            let touched = 0;
            for (const cid of province.cityIds) {
              const c = (govPatch[cid] ?? postCities[cid]);
              if (!c || c.ownerForceId !== state.playerForceId) continue;
              govPatch[cid] = {
                ...c,
                loyalty: Math.min(100, c.loyalty + loyaltyGain),
                gold: c.gold + goldBonus,
              };
              touched++;
            }
            if (touched > 0) {
              result.report.entries.push({
                cityId: null,
                kind: 'income',
                text: `${gov.name.en} governs ${province.name.en}: +${loyaltyGain} loyalty & +${goldBonus} gold across ${touched} cities.`,
                textZh: `${gov.name.zh}牧${province.name.zh}:全境 ${touched} 城 民忠 +${loyaltyGain}、金 +${goldBonus}。`,
              });
            }
          }
          if (Object.keys(govPatch).length > 0) postCities = { ...postCities, ...govPatch };
        }

        // 升城慶典 — queue a celebratory popup for each player city that crossed
        // UP a size tier this season (邑→鎮→城→大城→都).
        const sizePopups: import('../types').PopupEvent[] = [];
        for (const c of Object.values(postCities)) {
          if (c.ownerForceId !== state.playerForceId) continue;
          const before = state.cities[c.id];
          if (!before || before.ownerForceId !== state.playerForceId) continue;
          const a = citySize(c);
          if (citySizeRank(a.id) > citySizeRank(citySize(before).id)) {
            sizePopups.push({
              key: `city-upgrade-${a.id}`,
              media: 'image',
              titleZh: `升格・${a.name.zh}`,
              titleEn: `Risen to ${a.name.en}`,
              captionZh: `${c.name.zh} 人口興旺,晉為「${a.name.zh}」`,
              captionEn: `${c.name.en} has grown into a ${a.name.en}`,
            });
          }
        }

        // 堅城落成 — a player city's 城壁 reached the top tier (3) this season.
        const wallPopups: import('../types').PopupEvent[] = [];
        for (const c of Object.values(postCities)) {
          if (c.ownerForceId !== state.playerForceId) continue;
          const before = state.cities[c.id];
          if (!before || before.ownerForceId !== state.playerForceId) continue;
          if ((c.wallTier ?? 1) >= 3 && (before.wallTier ?? 1) < 3) {
            wallPopups.push({
              key: 'wall-citadel',
              media: 'image',
              titleZh: '堅城落成',
              titleEn: 'A Great Citadel',
              captionZh: `${c.name.zh} 城壁臻於極致(三級堅城)`,
              captionEn: `${c.name.en}'s walls rise to a citadel (tier 3)`,
            });
          }
        }

        // 大興土木 — queue a popup for each player-city building that finished
        // construction this season (level 0 → ≥1; upgrades don't re-fire).
        const buildPopups: import('../types').PopupEvent[] = [];
        {
          const beforeLevel = new Map<string, number>();
          for (const b of state.buildings) beforeLevel.set(`${b.cityId}:${b.id}`, b.level);
          for (const b of bldEvt.buildings) {
            if (b.level < 1) continue;
            if ((beforeLevel.get(`${b.cityId}:${b.id}`) ?? 0) >= 1) continue; // already built
            const c = postCities[b.cityId];
            if (!c || c.ownerForceId !== state.playerForceId) continue;
            const def = BUILDING_DEFS_BY_ID[b.id];
            buildPopups.push({
              key: 'building-complete',
              media: 'image',
              titleZh: '大興土木',
              titleEn: 'A Great Work Raised',
              captionZh: `${c.name.zh} 新建「${def?.name.zh ?? b.id}」落成`,
              captionEn: `${def?.name.en ?? b.id} completed at ${c.name.en}`,
            });
          }
        }

        // 富商借餉償還 — each season-end, a fixed instalment is drawn from the
        // capital toward any outstanding war-loan (interest is baked into `owed`).
        // A capital too poor to cover the instalment pays what it can and takes a
        // small 民忠 ding (信用受損); the balance simply rolls to next season.
        let nextMerchantLoan = state.merchantLoan ?? null;
        if (seasonBoundary && nextMerchantLoan && nextMerchantLoan.owed > 0 && state.playerForceId) {
          const capId = state.forces[state.playerForceId]?.capitalCityId;
          const cap = capId ? postCities[capId] : null;
          if (cap) {
            const due = Math.min(nextMerchantLoan.perSeason, nextMerchantLoan.owed);
            const paid = Math.min(due, cap.gold);
            const short = due - paid;
            postCities = { ...postCities, [capId]: { ...cap, gold: cap.gold - paid, loyalty: short > 0 ? Math.max(0, cap.loyalty - 1) : cap.loyalty } };
            const owedLeft = nextMerchantLoan.owed - paid;
            nextMerchantLoan = owedLeft > 0 ? { ...nextMerchantLoan, owed: owedLeft } : null;
          }
        }

        // 研發圖譜 — a foundry city (lv≥2) staffed by an 巧思 tinkerer may puzzle
        // out a new 鑄法 each season, within the foundry's reach. This is the
        // path by which 神兵 blueprints (beyond the seeded basics) enter play.
        let knownRecipesNext = state.knownRecipes ?? STARTER_RECIPE_IDS.slice();
        if (seasonBoundary && state.playerForceId) {
          const known = new Set(knownRecipesNext);
          const learned: EntityId[] = [];
          for (const c of Object.values(postCities)) {
            if (c.ownerForceId !== state.playerForceId) continue;
            const foundry = state.buildings.find((b) => b.cityId === c.id && b.id === 'foundry');
            if (!foundry || foundry.level < 2) continue;
            const smith = Object.values(state.officers).find(
              (o) => o.forceId === state.playerForceId && o.locationCityId === c.id
                && o.status !== 'dead' && (o.traits ?? []).includes('inventive'),
            );
            if (!smith) continue;
            if (Math.random() >= 0.22 + 0.04 * foundry.level) continue;
            const id = discoverableRecipe(known, foundry.level, Math.random);
            if (!id) continue;
            known.add(id);
            learned.push(id);
            const item = ITEMS_BY_ID[FORGE_RECIPES_BY_ID[id]?.resultItemId];
            result.report.entries.push({
              cityId: c.id,
              kind: 'note',
              text: `${smith.name.en} unlocked the forging method for ${item?.name.en ?? id} at ${c.name.en}.`,
              textZh: `${smith.name.zh}於${c.name.zh}鑽研得「${item?.name.zh ?? id}」鑄法。`,
            });
          }
          if (learned.length > 0) knownRecipesNext = [...knownRecipesNext, ...learned];
        }

        // 軍備漸長 — each season boundary, re-scale AI-held gear from the current
        // roster so newly recruited/born enemy officers also get armed (never
        // lowers existing levels). Player gear is untouched.
        let aiGearNext: { refine: typeof state.itemRefinements; breakthrough: typeof state.itemBreakthroughs; gems: typeof state.itemGems } | null = null;
        if (seasonBoundary) {
          const g = assignAiGear({
            officers: officersWithMarchTask, playerForceId: state.playerForceId, difficulty: state.difficulty,
            aiStrength: state.aiStrength, refine: state.itemRefinements, breakthrough: state.itemBreakthroughs, gems: state.itemGems,
          });
          setRefineRegistry(g.refine); setBreakthroughRegistry(g.breakthrough); setGemRegistry(g.gems);
          aiGearNext = g;
        }

        // 敵國鑄兵 — AI foundry cities arm their best still-unforged commanders
        // with a fresh 神兵 (uniqueness-respecting; deducts the city's gold+iron).
        if (seasonBoundary) {
          const forgeActions = planAiForging({
            officers: officersWithMarchTask, cities: postCities, buildings: state.buildings,
            lostItems: result.lostItems, playerForceId: state.playerForceId, rng: Math.random,
          });
          if (forgeActions.length > 0) {
            postCities = { ...postCities };
            officersWithMarchTask = { ...officersWithMarchTask };
            for (const a of forgeActions) {
              const c = postCities[a.cityId];
              if (c) postCities[a.cityId] = { ...c, gold: c.gold - a.goldCost, iron: Math.max(0, (c.iron ?? 0) - a.ironCost) };
              const o = officersWithMarchTask[a.officerId];
              if (o) officersWithMarchTask[a.officerId] = { ...o, equipment: [...o.equipment, a.itemId] };
            }
          }
        }

        // 家門聲望 — recompute clan standing once a year (winter), after this
        // season's births/出仕, deaths and succession have all landed, then let
        // great/gentry-house scions gain a touch of loyalty (世家蔭澤).
        let clanStandingsNext = state.clanStandings;
        if (seasonBoundary && state.date.season === 'winter') {
          const clanTick = tickClanStandings(officersWithMarchTask, state.clanStandings);
          clanStandingsNext = clanTick.clanStandings;
          if (clanTick.entries.length > 0) result.report.entries.push(...clanTick.entries);
          let loyaltyMutated = false;
          const bumped = { ...officersWithMarchTask };
          for (const o of Object.values(officersWithMarchTask)) {
            if (o.status === 'dead' || !o.forceId) continue;
            const bump = clanPrestigeBonus(o, clanStandingsNext).loyalty;
            if (bump > 0 && o.loyalty < 100) {
              bumped[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bump) };
              loyaltyMutated = true;
            }
          }
          if (loyaltyMutated) officersWithMarchTask = bumped;
        }

        set({
          date: result.date,
          cities: postCities,
          knownRecipes: knownRecipesNext,
          ...(aiGearNext ? { itemRefinements: aiGearNext.refine, itemBreakthroughs: aiGearNext.breakthrough, itemGems: aiGearNext.gems } : {}),
          itemLore: loreAfterSeason, // 名器威名 grown by this season's strategic battles
          merchantLoan: nextMerchantLoan,
          popupQueue: [...state.popupQueue, ...sizePopups, ...wallPopups, ...buildPopups],
          officers: officersWithMarchTask,
          marriageAlliances: allianceTick.alliances,
          forces: postForces,
          refugees: result.refugees,
          runtimeBonds: bondsAfterTraits,
          rapport: rapportAfter,
          lordRapport: lordRapportAfter,
          recentBonds: recentBondsAfter,
          pendingCommands: carriedCommands,
          pendingTrainings: nextTrainings,
          lastReport: result.report,
          espionageReveals: espionageRevealsNext,
          // 事件地標 — settle the season's per-city calamities/windfalls into
          // map marks that outlive the dismissed report (replaced each tick).
          cityEventMarks: (() => {
            const kinds = new Set(['famine', 'flood', 'plague', 'harvest', 'rebellion', 'tribe-raid']);
            const seen = new Set<string>();
            const marks: Array<{ cityId: EntityId; kind: ReportEntryKind; text: string }> = [];
            for (const e of result.report.entries) {
              if (!e.cityId || !kinds.has(e.kind)) continue;
              const key = `${e.cityId}:${e.kind}`;
              if (seen.has(key)) continue;
              seen.add(key);
              marks.push({ cityId: e.cityId, kind: e.kind, text: e.textZh ?? e.text });
            }
            return marks.slice(0, 40);
          })(),
          deeds: nextDeeds,
          recentDeedTitles: [...state.recentDeedTitles, ...titleGrant.grants],
          recentPrestige: [...state.recentPrestige, ...newPrestige],
          recentPrestigeCeremony: recentPrestigeCeremonyAfter,
          recentPromotions: recentPromotionsAfter,
          careerMode: careerModeAfterSeason,
          challengeRecords: challengeRecordsAfter,
          // Battle deltas only feed MVPs at season boundaries — reset
          // then so the next season starts fresh; otherwise keep them
          // accumulating across mid-season ticks.
          seasonBattleDeltas: seasonBoundary ? {} : state.seasonBattleDeltas,
          // 通脹漸消 — inflation eases each season as coin re-stabilises; a 平準署
          // at the capital quickens it, and a 銅 (copper) realm's sound coinage
          // steadies prices further (specialtyRealmEffects.inflationRelief).
          inflation: seasonBoundary
            ? Math.max(0, (state.inflation ?? 0) - 3
                - buildingBonuses(state.forces[state.playerForceId ?? '']?.capitalCityId ?? '', state.buildings).inflationRelief
                - (realmOf(state.playerForceId)?.inflationRelief ?? 0))
            : state.inflation,
          // 度支沿革 — snapshot the player's total treasury gold each season so
          // the 度支簿 can chart whether the realm is bleeding or building.
          treasuryHistory: seasonBoundary && state.playerForceId
            ? [
                ...(state.treasuryHistory ?? []),
                Object.values(postCities).reduce((sum, c) => (c.ownerForceId === state.playerForceId ? sum + c.gold : sum), 0),
              ].slice(-8)
            : state.treasuryHistory,
          // 定稅 — persist the AI's tax decisions (player's entry untouched).
          taxPolicy: planned.taxPolicy,
          selectedCityId: stillOwned ? state.selectedCityId : fallback,
          victoryStatus: endVS,
          battleHistory: [...state.battleHistory, ...newBattles],
          pendingBattleTheaters: [
            ...state.pendingBattleTheaters,
            ...playerBattleTheaters,
          ],
          eventFlags: postFlags,
          firedEventIds: postFiredIds,
          pendingEspionage: [],
          embeddedSpies: embeddedSpiesNext,
          grudges: grudgesAfterSpies,
          tribeState: { ...tribeResult.state, aggression: nextAggression as typeof tribeResult.state.aggression },
          scenicLooted: nextScenicLooted,
          buildings: bldEvt.buildings,
          family: fam.family,
          pendingHeirs: fam.pendingHeirs,
          clanStandings: clanStandingsNext,
          officerWishes: [
            ...(consumedWishIds.size > 0
              ? newWishes.filter((w) => !consumedWishIds.has(w.id))
              : newWishes),
            ...woundedRetireWishes,
            ...forcedEventWishes,
          ],
          pendingWishEntries: [],
          shipOrders: remainingOrders,
          fleets: updatedFleets,
          ports: nextPorts,
          forts: nextForts,
          sites: nextSites,
          tradeRoutes: nextTradeRoutes,
          territoryOwnership: result.territoryOwnership ?? state.territoryOwnership ?? {},
          armies: result.armies ?? {},
          convoys: result.convoys ?? {},
          raids: result.raids ?? {},
          expeditions: result.expeditions ?? {},
          openedRealms: nextOpenedRealms,
          realmRelations: nextRealmRelations,
          recentAchievementUnlocks: (embassyAchUnlocks.length > 0 || bldAch.length > 0)
            ? [...state.recentAchievementUnlocks, ...embassyAchUnlocks, ...bldAch]
            : state.recentAchievementUnlocks,
          endingsAchieved,
          campaignStats: {
            ...state.campaignStats,
            seasonsPlayed: (state.campaignStats.seasonsPlayed ?? 0) + 1,
          },
          lostItems: result.lostItems,
          diplomacy: (() => {
            // 奉迎天子 — the realm resents whoever speaks with the
            // emperor's voice: -1/season with every other living force.
            if (!seasonBoundary) return postDiplomacy;
            const custodian = emperorCustodian(postCities, state.emperorCityId ?? null);
            if (!custodian) return postDiplomacy;
            const living = new Set(Object.values(postCities).map((c) => c.ownerForceId).filter(Boolean) as EntityId[]);
            const relations = { ...postDiplomacy.relations };
            for (const fid of living) {
              if (fid === custodian) continue;
              const key = pairKey(custodian, fid);
              const rel = relations[key] ?? { forceA: custodian < fid ? custodian : fid, forceB: custodian < fid ? fid : custodian, score: 0, status: 'neutral' as const };
              relations[key] = { ...rel, score: Math.max(-100, rel.score + RESENTMENT_PER_SEASON) };
            }
            return { ...postDiplomacy, relations };
          })(),
          autoBuildQueues: auto.queues,
          pendingDialogue: dlg ?? state.pendingDialogue,
          dialogueFollowups: nextFollowups,
          achievedObjectives: newAchieved,
          pendingEvent: firingEvent
            ? {
                event: firingEvent,
                year: result.date.year,
                season: result.date.season,
                awaitingChoice: playerAwaitsChoice,
              }
            : state.pendingEvent,
          weather: nextWeather,
          burningCities: nextBurning,
          cityCaptured: playerConquest
            ? { key: (state.cityCaptured?.key ?? 0) + 1, cityId: playerConquest }
            : state.cityCaptured,
          cityLost: playerLoss
            ? { key: (state.cityLost?.key ?? 0) + 1, cityId: playerLoss }
            : state.cityLost,
          fieldBattleMarks: nextFieldMarks,
          pendingFieldBattleQueue: [
            ...(state.pendingFieldBattleQueue ?? []),
            ...(result.pendingFieldBattles ?? []).map((b) => ({
              playerArmyId: b.playerArmyId, enemyArmyId: b.enemyArmyId,
            })),
          ],
          pendingSiegeDefenseQueue: [
            ...(state.pendingSiegeDefenseQueue ?? []),
            ...(result.pendingSiegeDefenses ?? []),
          ],
          // 本局戰史 — append this season's chronicle-worthy moments.
          chronicle: (() => {
            const log = [...(state.chronicle ?? [])];
            const push = (zh: string, en: string, kind: 'conquest' | 'works' | 'event' | 'rebellion' | 'defense') => {
              if (log.length >= 240) return;
              log.push({ year: result.date.year, season: result.date.season, zh, en, kind });
            };
            for (const e of result.report.entries) {
              const zhText = e.textZh ?? '';
              if (e.battle?.cityFalls && e.battle.attacker.forceId) {
                const f = result.forces[e.battle.attacker.forceId];
                const c = result.cities[e.battle.cityId];
                if (f && c) push(`${f.name.zh}攻陷${c.name.zh}`, `${f.name.en} took ${c.name.en}`, 'conquest');
              } else if (zhText.includes('【水攻】') || zhText.includes('【圍困】')) {
                push(zhText.replace(/（[^）]*）/g, ''), e.text, 'works');
              } else if (e.kind === 'rebellion') {
                push(zhText, e.text, 'rebellion');
              } else if (zhText.includes('守城戰開')) {
                push(zhText, e.text, 'defense');
              }
            }
            if (firingEvent) {
              push(`【${firingEvent.name.zh}】`, firingEvent.name.en, 'event');
            }
            return log;
          })(),
          // 勢力消長 — chart point per season.
          powerHistory: seasonBoundary
            ? appendPowerHistory(state.powerHistory ?? [], takePowerSnapshot(postCities, result.date.year, result.date.season))
            : (state.powerHistory ?? []),
          mandate: (() => {
            if (!seasonBoundary) return nextMandate;
            const custodian = emperorCustodian(postCities, state.emperorCityId ?? null);
            if (!custodian) return nextMandate;
            return {
              ...nextMandate,
              byForce: {
                ...nextMandate.byForce,
                [custodian]: Math.min(100, (nextMandate.byForce[custodian] ?? 50) + MANDATE_PER_SEASON),
              },
            };
          })(),
          embargoes: nextEmbargoes,
          pendingDelayedEffects: remainingDelayed,
          appointments: prunedAppointments,
          appointmentHistory: [
            ...state.appointmentHistory,
            ...aiHistoryAppends,
            ...pruneHistoryAppends,
          ],
          // AI court actions persist into edictHistory + cooldowns.
          edictHistory: edictHistoryAfterCourt,
          edictCooldowns: edictCooldownsAfterCourt,
          // 討伐令 marks expire by season — drop any past their date.
          casusBelliMarks: seasonBoundary
            ? [...casusBelliAfterCourt, ...aiSchemeMarks].filter((m) => {
                const seasonIdx = { spring: 0, summer: 1, autumn: 2, winter: 3 } as const;
                const nextAbs = result.date.year * 4 + seasonIdx[result.date.season];
                const expAbs = m.expiresYear * 4 + seasonIdx[m.expiresSeason];
                return nextAbs <= expAbs;
              })
            : state.casusBelliMarks,
          // 求賢令 recruit bonus tick: decrement seasonsLeft, drop expired; then
          // fold in any AI 求賢令 issued this tick (so it rings next season too).
          recruitBonusSeasons: (() => {
            const next: Record<EntityId, { multiplier: number; seasonsLeft: number }> = seasonBoundary
              ? Object.fromEntries(
                  Object.entries(state.recruitBonusSeasons)
                    .map(([k, v]) => [k, { ...v, seasonsLeft: v.seasonsLeft - 1 }] as const)
                    .filter(([, v]) => v.seasonsLeft > 0),
                )
              : { ...state.recruitBonusSeasons };
            for (const fid of aiCourt.talentEdicts) next[fid] = { multiplier: 1.5, seasonsLeft: 1 };
            return next;
          })(),
        });

        // 自動存檔 — every season boundary writes one of three rolling
        // autosave slots, so a bad turn (or a crash) costs at most a season.
        if (seasonBoundary) {
          try {
            // 每日挑戰 — the day's run settles the moment the realm is won
            // or lost; only the best result of the day is kept.
            {
              const after = get();
              if (after.dailyChallengeDate
                && (after.victoryStatus === 'victory' || after.victoryStatus === 'defeat')) {
                recordDailyResult(after.dailyChallengeDate, {
                  victory: after.victoryStatus === 'victory',
                  seasons: after.campaignStats.seasonsPlayed ?? 0,
                });
                set({ dailyChallengeDate: null });
              }
            }
            const cursorKey = 'tkm-autosave-cursor';
            const n = ((parseInt(localStorage.getItem(cursorKey) ?? '0', 10) || 0) % 3) + 1;
            localStorage.setItem(cursorKey, String(n));
            const fresh = get();
            const force = fresh.playerForceId ? fresh.forces[fresh.playerForceId] : null;
            const SEASON_LABEL: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
            saveToSlot(
              `autosave-${n}`,
              `🕒 自動存檔 ${fresh.date.year}年${SEASON_LABEL[fresh.date.season] ?? fresh.date.season}`,
              fresh,
              force?.name.en ?? 'Unknown',
            );
          } catch {
            // localStorage full / private mode — autosave is best-effort.
          }
        }
      },

      dismissReport: () => set(() => ({ lastReport: null })),
      pushPopup: (event) => set((s) => ({ popupQueue: [...s.popupQueue, event] })),
      dismissPopup: () => set((s) => ({ popupQueue: s.popupQueue.slice(1) })),

      dismissBattleTheater: () => {
        const state = get();
        const rest = state.pendingBattleTheaters.slice(1);
        set({ pendingBattleTheaters: rest });
      },

      applyDebateCollapse: (officerId) => {
        const o = get().officers[officerId];
        if (!o) return;
        // 失威 — being 罵死 (out-argued to collapse) is humiliating: dock 威望 and
        // mark a few seasons of disgrace (品階招牌 suppressed until recovered).
        set({ officers: { ...get().officers, [officerId]: {
          ...o,
          loyalty: Math.max(0, o.loyalty - 15),
          renown: Math.max(0, (o.renown ?? 0) - 3),
          disgrace: Math.max(o.disgrace ?? 0, 3),
        } } });
      },

      recruitOfficer: (officerId, cityId, approach, debateWon, giftItemId) => {
        const state = get();
        const officer = state.officers[officerId];
        const city = state.cities[cityId];
        const force = state.playerForceId
          ? state.forces[state.playerForceId]
          : null;
        const ruler = force ? state.officers[force.rulerOfficerId] : null;
        if (!officer || !city || !force || !ruler)
          return { ok: false, message: 'Invalid state.' };

        const citiesOwned = Object.values(state.cities).filter(
          (c) => c.ownerForceId === state.playerForceId,
        ).length;
        // 名品禮聘 — a treasure from the realm's unclaimed hoard sweetens the plea.
        const giftEntry = giftItemId ? state.lostItems.find((li) => li.itemId === giftItemId) : undefined;
        const giftItem = giftEntry ? ITEMS_BY_ID[giftEntry.itemId] : undefined;
        const giftBonus = giftItem ? giftRecruitValue(giftItem, officer) : 0;
        const result = attemptRecruit({
          officer,
          city,
          recruiterForce: force,
          recruiterRuler: ruler,
          recruiterReputation: { citiesOwned },
          approach,
          bestRapportWithCaptors: bestRapportWith(state, officerId),
          debateWon,
          giftBonus,
          stanceModifier:
            stanceRecruitModifier(state.officers, force.id, force.recruitmentStance) +
            statecraftRecruitBonus(force.statecraft) +
            // 招賢館 — a hall of worthies in the recruiting city sweetens the offer.
            buildingBonuses(cityId, state.buildings).recruitOfficerBonus +
            // 世家蔭澤 — a scion of a great house is easier to bring on board.
            clanPrestigeBonus(officer, state.clanStandings).recruit,
        });

        const updates: Partial<GameState> = {
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - recruitCostFor(approach) },
          },
        };
        if (result.ok && result.recruitedOfficer) {
          codexMarkRecruited(officerId);
          let recruited = result.recruitedOfficer;
          if (giftItem && giftEntry) {
            recruited = { ...recruited, equipment: [...(recruited.equipment ?? []), giftItem.id] };
            updates.lostItems = state.lostItems.filter((li) => li !== giftEntry);
          }
          updates.officers = {
            ...state.officers,
            [officerId]: recruited,
          };
          // Achievement trigger.
          let ach = loadAchievementProgress();
          const r = processTrigger(ach, { kind: 'recruit-officer', targetId: officerId });
          ach = r.progress;
          ach = bumpCounters(ach, { recruits: 1 });
          const cum = checkCumulativeThresholds(ach);
          saveAchievementProgress(cum.progress);
          if (r.newlyUnlocked.length + cum.newlyUnlocked.length > 0) {
            updates.recentAchievementUnlocks = [
              ...state.recentAchievementUnlocks,
              ...r.newlyUnlocked,
              ...cum.newlyUnlocked,
            ];
          }
          updates.popupQueue = [...state.popupQueue, {
            key: 'officer-recruited',
            media: 'image',
            titleZh: '訪賢得士',
            titleEn: 'A Worthy Joins',
            captionZh: `${result.recruitedOfficer.name.zh} 來投(${city.name.zh})`,
            captionEn: `${result.recruitedOfficer.name.en} has joined your cause`,
          }];
        }
        set(updates);
        return { ok: result.ok, message: result.message };
      },

      estimatePersuasion: (officerId, cityId, approach) => {
        const state = get();
        const officer = state.officers[officerId];
        const city = state.cities[cityId];
        const force = state.playerForceId ? state.forces[state.playerForceId] : null;
        const ruler = force ? state.officers[force.rulerOfficerId] : null;
        if (!officer || !city || !force || !ruler) return 0;
        const citiesOwned = Object.values(state.cities).filter(
          (c) => c.ownerForceId === state.playerForceId,
        ).length;
        return estimateRecruitChance({
          officer,
          city,
          recruiterForce: force,
          recruiterRuler: ruler,
          recruiterReputation: { citiesOwned },
          approach,
          bestRapportWithCaptors: bestRapportWith(state, officerId),
        });
      },

      recruitFreeAgent: (officerId, cityId, opts) => {
        const state = get();
        const officer = state.officers[officerId];
        const city = state.cities[cityId];
        const force = state.playerForceId
          ? state.forces[state.playerForceId]
          : null;
        const ruler = force ? state.officers[force.rulerOfficerId] : null;
        if (!officer || !city || !force || !ruler)
          return { ok: false, message: 'Invalid state.' };
        if (city.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'Not your city.' };

        const seasonKey = `${state.date.year}|${state.date.season}`;
        const rec = state.recruitState[officerId];
        // 舌戰失利後本季不可再訪。
        if (rec && rec.season === seasonKey && rec.stage === 'locked')
          return { ok: false, message: '舌戰失利,此人本回合不願再見 — 下回合再訪。' };

        // 賄賂 — pay now (must afford); gold buys flat goodwill.
        const bribe = Math.max(0, Math.floor(opts?.bribe ?? 0));
        if (bribe > 0 && city.gold < bribe)
          return { ok: false, message: '國庫不足以行賄。' };
        const bribeBonus = bribe > 0 ? Math.min(0.35, bribe / 1200) : 0;

        const citiesOwned2 = Object.values(state.cities).filter(
          (c) => c.ownerForceId === state.playerForceId,
        ).length;
        // 三顧之誠 — each prior refusal builds a little cumulative warmth.
        const priorAttempts = state.recruitState[officerId]?.attempts ?? 0;
        const persistenceBonus = Math.min(0.20, priorAttempts * 0.05);
        // 名品禮聘 — a treasure from the realm's unclaimed hoard sweetens the offer.
        const giftEntry = opts?.giftItemId ? state.lostItems.find((li) => li.itemId === opts.giftItemId) : undefined;
        const giftItem = giftEntry ? ITEMS_BY_ID[giftEntry.itemId] : undefined;
        const giftBonus = giftItem ? giftRecruitValue(giftItem, officer) : 0;
        const result = attemptFreeAgentRecruit({
          officer,
          city,
          recruiterForce: force,
          recruiterRuler: ruler,
          recruiterReputation: { citiesOwned: citiesOwned2 },
          family: state.family,
          free: true,            // 邀請免費 — only a bribe spends gold.
          debateWon: opts?.debateWon,
          bribeBonus,
          persistenceBonus,
          recommendedBonus: officer.recommended ? 0.15 : 0, // 舉薦作保
          giftBonus,
        });

        const updates: Partial<GameState> = {};
        if (bribe > 0) {
          updates.cities = { ...state.cities, [cityId]: { ...city, gold: city.gold - bribe } };
        }
        const nextRecruitState = { ...state.recruitState };
        if (result.ok && result.recruitedOfficer) {
          codexMarkRecruited(officerId);
          // 名品隨之 — a gift given on success goes to the new officer (consumed
          // from the hoard); a refused offer keeps the treasure.
          let recruited = { ...result.recruitedOfficer, recommended: undefined };
          if (giftItem && giftEntry) {
            recruited = { ...recruited, equipment: [...(recruited.equipment ?? []), giftItem.id] };
            updates.lostItems = state.lostItems.filter((li) => li !== giftEntry);
          }
          updates.officers = { ...state.officers, [officerId]: recruited };
          delete nextRecruitState[officerId];
          updates.popupQueue = [...state.popupQueue, {
            key: 'officer-recruited',
            media: 'image',
            titleZh: '訪賢得士',
            titleEn: 'A Worthy Joins',
            captionZh: `${result.recruitedOfficer.name.zh} 應招入幕(${city.name.zh})`,
            captionEn: `${result.recruitedOfficer.name.en} answers your call`,
          }];
        } else {
          // A refusal opens escalation (舌戰/賄賂) this season AND counts toward
          // 三顧之誠 — persistence across seasons warms a reluctant talent.
          nextRecruitState[officerId] = { season: seasonKey, stage: 'declined', attempts: priorAttempts + 1 };
        }
        updates.recruitState = nextRecruitState;
        set(updates);
        return { ok: result.ok, message: result.message };
      },

      lockFreeAgentRecruit: (officerId) => {
        const state = get();
        const seasonKey = `${state.date.year}|${state.date.season}`;
        set({ recruitState: { ...state.recruitState, [officerId]: { season: seasonKey, stage: 'locked' } } });
      },

      executeOfficer: (officerId) => {
        const state = get();
        const officer = state.officers[officerId];
        if (!officer || officer.status !== 'imprisoned') return;
        codexMarkSlain(officerId);
        const pid = state.playerForceId;
        // 宿怨 — the slain man's kin & sworn brothers mark your house (near-
        // unrecruitable thereafter, a grudge in battle).
        const officers = pid
          ? markSlainVendetta(state.officers, officerId, pid, state.family, state.runtimeBonds ?? [])
          : { ...state.officers };
        officers[officerId] = applyExecute(officer);
        // 殺降之累 — the executing lord forfeits 威望 (heavier for a man of honour
        // or renown; killing one who chose death over surrender weighs heaviest).
        const player = pid ? state.forces[pid] : null;
        const ruler = player ? officers[player.rulerOfficerId] : null;
        if (ruler) officers[ruler.id] = { ...ruler, renown: Math.max(0, (ruler.renown ?? 0) - executionRenownCost(officer)) };
        // 積怨 — the victim's old court resents the killing.
        let diplomacy = state.diplomacy;
        const former = officer.capturedFromForceId;
        if (pid && former && former !== pid && state.forces[former]) {
          const relations = { ...state.diplomacy.relations };
          const key = pairKey(pid, former);
          const rel = relations[key] ?? { forceA: pid < former ? pid : former, forceB: pid < former ? former : pid, score: 0, status: 'neutral' as const };
          relations[key] = { ...rel, score: Math.max(-100, rel.score - 12) };
          diplomacy = { ...state.diplomacy, relations };
        }
        set({ officers, diplomacy });
      },

      releaseOfficer: (officerId, honorable) => {
        const state = get();
        const officer = state.officers[officerId];
        if (!officer || officer.status !== 'imprisoned') return;
        const released = applyRelease(officer);
        const officers = { ...state.officers, [officerId]: released };
        if (honorable && state.playerForceId) {
          // 義釋 — magnanimity remembered: the freed officer is far easier for
          // your house to win later (報恩), and your lord earns a name for it.
          officers[officerId] = { ...released, freedByForceId: state.playerForceId };
          const force = state.forces[state.playerForceId];
          const ruler = force ? officers[force.rulerOfficerId] : null;
          if (ruler) officers[ruler.id] = { ...ruler, renown: (ruler.renown ?? 0) + 5 };
        }
        set({ officers });
      },

      acknowledgeVictory: () =>
        set(() => ({ victoryStatus: 'observing' })),

      proposeAlliance: (targetForceId) => {
        const state = get();
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        const player = state.forces[state.playerForceId];
        const target = state.forces[targetForceId];
        const ruler = state.officers[player?.rulerOfficerId ?? ''];
        if (!player || !target || !ruler)
          return { ok: false, message: 'Invalid forces.' };
        const capital = state.cities[player.capitalCityId];
        if (!capital || capital.gold < ALLIANCE_PROPOSAL_COST)
          return {
            ok: false,
            message: `Need ${ALLIANCE_PROPOSAL_COST} gold in the capital.`,
          };

        const outcome = proposeAlliance({
          player,
          playerRulerCharisma: ruler.stats.charisma,
          playerRuler: ruler,
          target,
          targetRuler: state.officers[target.rulerOfficerId],
          targetTotalTroops: computeTotalTroops(target.id, state.cities),
          playerTotalTroops: computeTotalTroops(player.id, state.cities),
          diplomacy: state.diplomacy,
          date: state.date,
          diplomacyMultiplier: appointmentBonusFor(player.id, state.appointments, state.officers).diplomacyMultiplier * (1 + buildingBonuses(state.forces[player.id]?.capitalCityId ?? '', state.buildings).diploRelMul),
          proposerCredibility: state.credibility[state.playerForceId] ?? 100,
          targetGrudge: state.grudges[targetForceId] ?? 0,
        });

        if (outcome.ok) {
          set({
            cities: {
              ...state.cities,
              [capital.id]: {
                ...capital,
                gold: capital.gold - ALLIANCE_PROPOSAL_COST,
              },
            },
            diplomacy: outcome.diplomacy,
            // Honoured dealings rebuild a tarnished name and mend old grudges.
            ...(outcome.accepted
              ? {
                  credibility: { ...state.credibility, [state.playerForceId]: Math.min(100, (state.credibility[state.playerForceId] ?? 100) + 5) },
                  grudges: { ...state.grudges, [targetForceId]: Math.max(0, (state.grudges[targetForceId] ?? 0) - 15) },
                }
              : {}),
          });
        }
        return {
          ok: outcome.ok,
          accepted: outcome.accepted,
          message: outcome.message,
        };
      },

      proposeNonAggression: (targetForceId) => {
        const state = get();
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        const player = state.forces[state.playerForceId];
        const target = state.forces[targetForceId];
        const ruler = state.officers[player?.rulerOfficerId ?? ''];
        if (!player || !target || !ruler)
          return { ok: false, message: 'Invalid forces.' };
        const capital = state.cities[player.capitalCityId];
        if (!capital || capital.gold < NAP_PROPOSAL_COST)
          return {
            ok: false,
            message: `Need ${NAP_PROPOSAL_COST} gold in the capital.`,
          };

        const outcome = proposeNonAggression({
          player,
          playerRulerCharisma: ruler.stats.charisma,
          playerRuler: ruler,
          target,
          targetRuler: state.officers[target.rulerOfficerId],
          targetTotalTroops: computeTotalTroops(target.id, state.cities),
          playerTotalTroops: computeTotalTroops(player.id, state.cities),
          diplomacy: state.diplomacy,
          date: state.date,
          diplomacyMultiplier: appointmentBonusFor(player.id, state.appointments, state.officers).diplomacyMultiplier * (1 + buildingBonuses(state.forces[player.id]?.capitalCityId ?? '', state.buildings).diploRelMul),
          proposerCredibility: state.credibility[state.playerForceId] ?? 100,
          targetGrudge: state.grudges[targetForceId] ?? 0,
        });

        if (outcome.ok) {
          set({
            cities: {
              ...state.cities,
              [capital.id]: {
                ...capital,
                gold: capital.gold - NAP_PROPOSAL_COST,
              },
            },
            diplomacy: outcome.diplomacy,
            ...(outcome.accepted
              ? {
                  credibility: { ...state.credibility, [state.playerForceId]: Math.min(100, (state.credibility[state.playerForceId] ?? 100) + 5) },
                  grudges: { ...state.grudges, [targetForceId]: Math.max(0, (state.grudges[targetForceId] ?? 0) - 15) },
                }
              : {}),
          });
        }
        return {
          ok: outcome.ok,
          accepted: outcome.accepted,
          message: outcome.message,
        };
      },

      payTribute: (targetForceId, amount) => {
        const state = get();
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        const player = state.forces[state.playerForceId];
        const target = state.forces[targetForceId];
        const ruler = state.officers[player?.rulerOfficerId ?? ''];
        if (!player || !target || !ruler)
          return { ok: false, message: 'Invalid forces.' };
        const capital = state.cities[player.capitalCityId];
        if (!capital || capital.gold < amount)
          return { ok: false, message: 'Not enough gold in the capital.' };

        const outcome = payTribute(
          {
            player,
            playerRulerCharisma: ruler.stats.charisma,
            target,
            targetTotalTroops: computeTotalTroops(target.id, state.cities),
            playerTotalTroops: computeTotalTroops(player.id, state.cities),
            diplomacy: state.diplomacy,
            date: state.date,
            diplomacyMultiplier: appointmentBonusFor(player.id, state.appointments, state.officers).diplomacyMultiplier * (1 + buildingBonuses(state.forces[player.id]?.capitalCityId ?? '', state.buildings).diploRelMul),
          },
          amount,
        );

        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - amount },
          },
          diplomacy: outcome.diplomacy,
          // Silver soothes resentment — a tribute takes the edge off a grudge.
          grudges: { ...state.grudges, [targetForceId]: Math.max(0, (state.grudges[targetForceId] ?? 0) - 10) },
        });
        return { ok: true, message: outcome.message };
      },

      requestGrain: (targetForceId) => {
        const state = get();
        if (!state.playerForceId) return { ok: false, message: 'No player force.' };
        const player = state.forces[state.playerForceId];
        const target = state.forces[targetForceId];
        if (!player || !target) return { ok: false, message: 'Invalid forces.' };
        const myCap = state.cities[player.capitalCityId];
        const theirCap = state.cities[target.capitalCityId];
        if (!myCap || !theirCap) return { ok: false, message: 'No capital city.' };
        const rel = getRelation(state.diplomacy, player.id, target.id);
        // Allies and pact-partners share freely; a friendly neutral may too.
        const willing = rel.status === 'allied' || rel.status === 'non-aggression' || rel.score >= 20;
        if (!willing) {
          return { ok: true, accepted: false, message: `${target.name.en} declines to share grain.` };
        }
        const spare = Math.max(0, theirCap.food - 3000); // they keep a reserve
        if (spare < 500) {
          return { ok: true, accepted: false, message: `${target.name.en} has no grain to spare.` };
        }
        const grant = Math.min(spare, rel.status === 'allied' ? 6000 : 3000);
        set({
          cities: {
            ...state.cities,
            [theirCap.id]: { ...theirCap, food: theirCap.food - grant },
            [myCap.id]: { ...myCap, food: myCap.food + grant },
          },
        });
        get().notify(
          `借糧 · ${target.name.zh} 濟糧 ${grant.toLocaleString()}（入 ${myCap.name.zh}）`,
          `${target.name.en} sends ${grant.toLocaleString()} grain to ${myCap.name.en}`,
        );
        return { ok: true, accepted: true, message: `${target.name.zh} 濟糧 ${grant.toLocaleString()}。` };
      },

      proposeTradeTreaty: (targetForceId) => {
        const state = get();
        if (!state.playerForceId) return { ok: false, message: 'No player force.' };
        const target = state.forces[targetForceId];
        if (!target) return { ok: false, message: 'Invalid force.' };
        const rel = getRelation(state.diplomacy, state.playerForceId, targetForceId);
        if (rel.status !== 'allied' && rel.status !== 'non-aggression') {
          return { ok: false, message: '需先締盟或締結互不侵犯,方可通商。' };
        }
        if ((state.tradePartners ?? []).includes(targetForceId)) {
          return { ok: true, accepted: true, message: '通商條約已在。' };
        }
        // Allies trade readily; a NAP partner needs to be on decent terms.
        const accepted = rel.status === 'allied' || rel.score >= 10;
        if (!accepted) {
          return { ok: true, accepted: false, message: `${target.name.zh}婉拒通商之議。` };
        }
        set({ tradePartners: [...(state.tradePartners ?? []), targetForceId] });
        get().notify(`通商條約 · 與 ${target.name.zh} 互市`, `Trade treaty signed with ${target.name.en}`);
        return { ok: true, accepted: true, message: `通商條約締成 — 商旅互通,兩國歲入俱增。` };
      },

      mintCoin: () => {
        const state = get();
        if (!state.playerForceId) return { ok: false, gold: 0, inflation: state.inflation ?? 0 };
        const force = state.forces[state.playerForceId];
        const capital = force ? state.cities[force.capitalCityId] : null;
        if (!capital) return { ok: false, gold: 0, inflation: state.inflation ?? 0 };
        // Windfall scales with the capital's commerce; inflation jumps +18 (cap 100).
        // 丹陽銅冶 — a 銅 (copper) realm mints richer coin (mintMul) and, with sound
        // metal, debases less (a touch less inflation per mint).
        const mintRealm = forceSpecialtyRealm(state.cities, state.playerForceId, state.embargoes);
        const windfall = Math.round((1000 + Math.floor(capital.commerce * 30)) * mintRealm.mintMul);
        const inflationJump = Math.round(18 / Math.max(1, mintRealm.mintMul));
        const nextInflation = Math.min(100, (state.inflation ?? 0) + inflationJump);
        set({
          cities: { ...state.cities, [capital.id]: { ...capital, gold: capital.gold + windfall } },
          inflation: nextInflation,
        });
        get().notify(
          `鑄錢 · ${capital.name.zh} 入金 ${windfall.toLocaleString()}（通脹 ${nextInflation}）`,
          `Minted ${windfall.toLocaleString()} gold (inflation ${nextInflation})`,
        );
        return { ok: true, gold: windfall, inflation: nextInflation };
      },

      developSpecialty: (cityId) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city) return { ok: false, message: 'City not found.' };
        if (city.ownerForceId !== state.playerForceId) return { ok: false, message: '非我所轄。' };
        const spec = citySpecialty(cityId);
        if (!spec) return { ok: false, message: '此城無名產可興。' };
        const dev = city.specialtyDev ?? 0;
        if (dev >= SPECIALTY_DEV_MAX) return { ok: false, message: `${spec.zh}已臻極盛。` };
        // 興作之費 — each tier costs more; a busy city (high commerce) builds the
        // workshop cheaper. A settled populace (loyalty ≥ 40) is required.
        if (city.loyalty < 40) return { ok: false, message: '民心未附,難興名產。' };
        const cost = Math.round((600 + 600 * dev) * (1 - Math.min(0.3, city.commerce / 400)));
        if (city.gold < cost) return { ok: false, message: `需 ${cost} 金（${city.name.zh}）。` };
        set({
          cities: { ...state.cities, [cityId]: { ...city, gold: city.gold - cost, specialtyDev: dev + 1 } },
        });
        const pct = Math.round((dev + 1) * SPECIALTY_DEV_GAIN * 100);
        get().notify(
          `名產作坊 · ${city.name.zh}${spec.zh}興旺至 ${dev + 1} 級(名產之利 +${pct}%,−${cost} 金)`,
          `${spec.zh} workshop at ${city.name.en} raised to tier ${dev + 1} (+${pct}% specialty edge, −${cost}g)`,
        );
        return { ok: true, message: `${spec.zh} → ${dev + 1} 級` };
      },

      setEmbargo: (targetForceId, role, on) => {
        const state = get();
        if (!state.playerForceId) return { ok: false, message: 'No player force.' };
        if (targetForceId === state.playerForceId) return { ok: false, message: '不能禁運自身。' };
        const existing = state.embargoes ?? [];
        if (on) {
          // Only a standing 專營 (≥60% world share) can impose one.
          const ctrl = specialtyControl(state.cities, state.playerForceId);
          if (!canEmbargo(ctrl, role)) return { ok: false, message: `未握${ROLE_ZH[role]}專營(需占天下六成),不能禁運。` };
          if (existing.some((e) => e.by === state.playerForceId && e.against === targetForceId && e.role === role))
            return { ok: false, message: '已在禁運中。' };
          set({ embargoes: [...existing, { by: state.playerForceId, against: targetForceId, role }] });
          const tname = state.forces[targetForceId]?.name.zh ?? targetForceId;
          get().notify(`禁運 · 斷${tname}之${ROLE_ZH[role]}`, `Embargo: cut ${targetForceId} off ${role}`);
          return { ok: true, message: `已對${tname}行${ROLE_ZH[role]}禁運。` };
        }
        set({ embargoes: existing.filter((e) => !(e.by === state.playerForceId && e.against === targetForceId && e.role === role)) });
        return { ok: true, message: '已解禁運。' };
      },

      solicitDonations: () => {
        const state = get();
        if (!state.playerForceId) return { ok: false, gold: 0, message: 'No player force.' };
        // 募捐冷卻 — once a year. Absolute season index = year×4 + season order.
        const order = { spring: 0, summer: 1, autumn: 2, winter: 3 }[state.date.season];
        const abs = state.date.year * 4 + order;
        if (state.lastDonationAt != null && abs - state.lastDonationAt < 4) {
          const wait = 4 - (abs - state.lastDonationAt);
          return { ok: false, gold: 0, message: `民力未復,需待 ${wait} 季方可再勸募。` };
        }
        const mine = Object.values(state.cities).filter((c) => c.ownerForceId === state.playerForceId);
        if (mine.length === 0) return { ok: false, gold: 0, message: 'No cities.' };
        // Windfall scales with each city's commerce, population AND loyalty — a
        // content, prosperous populace gives freely; a resentful one little.
        const DONATION_LOYALTY_COST = 8;
        let windfall = 0;
        const nextCities = { ...state.cities };
        for (const c of mine) {
          windfall += Math.floor((c.commerce * 12 + c.population / 3000) * (c.loyalty / 100));
          nextCities[c.id] = { ...c, loyalty: Math.max(0, c.loyalty - DONATION_LOYALTY_COST) };
        }
        const force = state.forces[state.playerForceId];
        const capital = force ? nextCities[force.capitalCityId] : null;
        if (!capital) return { ok: false, gold: 0, message: 'No capital.' };
        nextCities[capital.id] = { ...capital, gold: capital.gold + windfall };
        set({ cities: nextCities, lastDonationAt: abs });
        get().notify(
          `勸募 · ${capital.name.zh} 入金 ${windfall.toLocaleString()}(民忠 −${DONATION_LOYALTY_COST}/城)`,
          `Donations raised ${windfall.toLocaleString()} gold (loyalty −${DONATION_LOYALTY_COST}/city)`,
        );
        return { ok: true, gold: windfall };
      },

      borrowWarFunds: () => {
        const state = get();
        if (!state.playerForceId) return { ok: false, gold: 0, message: 'No player force.' };
        if (state.merchantLoan && state.merchantLoan.owed > 0) {
          return { ok: false, gold: 0, message: `舊債未清(尚欠 ${state.merchantLoan.owed.toLocaleString()} 金),富商不肯再借。` };
        }
        const mine = Object.values(state.cities).filter((c) => c.ownerForceId === state.playerForceId);
        if (mine.length === 0) return { ok: false, gold: 0, message: 'No cities.' };
        const force = state.forces[state.playerForceId];
        const capital = force ? state.cities[force.capitalCityId] : null;
        if (!capital) return { ok: false, gold: 0, message: 'No capital.' };
        // Principal scales with the realm's commercial weight (richer merchants
        // lend more), clamped to a sane band; interest baked in at ~25%, repaid
        // over 8 seasons (2 years).
        const principal = Math.max(2000, Math.min(25000, Math.floor(mine.reduce((s, c) => s + c.commerce * 18 + c.population / 2500, 0))));
        const owed = Math.round(principal * 1.25);
        const perSeason = Math.ceil(owed / 8);
        set({
          cities: { ...state.cities, [capital.id]: { ...capital, gold: capital.gold + principal } },
          merchantLoan: { owed, perSeason },
        });
        get().notify(
          `富商借餉 · ${capital.name.zh} 入金 ${principal.toLocaleString()}(分 8 季償 ${owed.toLocaleString()},每季 ${perSeason.toLocaleString()})`,
          `War-loan of ${principal.toLocaleString()} gold (repay ${owed.toLocaleString()} over 8 seasons, ${perSeason.toLocaleString()}/season)`,
        );
        return { ok: true, gold: principal, owed };
      },

      breakAlliance: (targetForceId) => {
        const state = get();
        if (!state.playerForceId) return;
        // 背盟 — tearing up a pact brands you an oath-breaker (−25 信譽) and
        // the jilted force nurses a lasting grudge (+30 積怨).
        const cur = state.credibility[state.playerForceId] ?? 100;
        set({
          diplomacy: breakAlliance(
            state.diplomacy,
            state.playerForceId,
            targetForceId,
          ),
          credibility: { ...state.credibility, [state.playerForceId]: Math.max(0, cur - 25) },
          grudges: { ...state.grudges, [targetForceId]: Math.min(100, (state.grudges[targetForceId] ?? 0) + 30) },
        });
      },

      proposeHostage: (targetForceId, officerId) => {
        const state = get();
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        const player = state.forces[state.playerForceId];
        const target = state.forces[targetForceId];
        const ruler = state.officers[player?.rulerOfficerId ?? ''];
        const hostage = state.officers[officerId];
        if (!player || !target || !ruler || !hostage)
          return { ok: false, message: 'Invalid forces or officer.' };
        if (hostage.forceId !== state.playerForceId)
          return { ok: false, message: 'Hostage must be your own officer.' };
        if (hostage.status !== 'idle' && hostage.status !== 'active')
          return { ok: false, message: 'Officer is not available to send.' };
        if (hostage.id === player.rulerOfficerId)
          return { ok: false, message: 'You cannot send your ruler as a hostage.' };

        const outcome = proposeHostage({
          player,
          playerRulerCharisma: ruler.stats.charisma,
          playerRuler: ruler,
          target,
          targetRuler: state.officers[target.rulerOfficerId],
          targetTotalTroops: computeTotalTroops(target.id, state.cities),
          playerTotalTroops: computeTotalTroops(player.id, state.cities),
          diplomacy: state.diplomacy,
          date: state.date,
          diplomacyMultiplier: appointmentBonusFor(player.id, state.appointments, state.officers).diplomacyMultiplier * (1 + buildingBonuses(state.forces[player.id]?.capitalCityId ?? '', state.buildings).diploRelMul),
        });

        if (!outcome.ok) {
          return { ok: false, message: outcome.message };
        }
        set({
          diplomacy: outcome.diplomacy,
          officers: {
            ...state.officers,
            [hostage.id]: {
              ...hostage,
              status: 'imprisoned',
              locationCityId: target.capitalCityId,
            },
          },
        });
        return {
          ok: true,
          accepted: outcome.accepted,
          message: `${hostage.name.en} is sent as hostage to ${target.name.en}. ${outcome.message}`,
        };
      },

      proposeMarriage: (targetForceId, yourOfficerId, theirOfficerId, opts) => {
        const MARRIAGE_COST = 1000;
        const hostage = !!opts?.hostage;
        const state = get();
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        const player = state.forces[state.playerForceId];
        const target = state.forces[targetForceId];
        const yours = state.officers[yourOfficerId];
        const theirs = state.officers[theirOfficerId];
        if (!player || !target || !yours || !theirs)
          return { ok: false, message: 'Invalid forces or officers.' };
        if (yours.forceId !== state.playerForceId)
          return { ok: false, message: 'Officer must be yours.' };
        if (theirs.forceId !== targetForceId)
          return { ok: false, message: 'Officer must belong to the target force.' };
        const capital = state.cities[player.capitalCityId];
        if (!capital || capital.gold < MARRIAGE_COST)
          return {
            ok: false,
            message: `Need ${MARRIAGE_COST} gold in the capital.`,
          };
        // Already married?
        if (
          state.runtimeBonds.some(
            (b) =>
              (b.officerA === yourOfficerId && b.officerB === theirOfficerId) ||
              (b.officerB === yourOfficerId && b.officerA === theirOfficerId),
          )
        ) {
          return { ok: false, message: 'These officers are already bonded.' };
        }

        const newBond = {
          officerA: yourOfficerId,
          officerB: theirOfficerId,
          floor: hostage ? 88 : 80,
          kind: 'oath' as const,
          label: `${yours.name.en} ⚭ ${theirs.name.en} Marriage`,
        };

        // 外戚 — the wedded officer's house becomes in-laws of the partner realm;
        // its prestige rises a notch from the union.
        const maternalClanId = clanOf(yours) ?? undefined;
        let clanStandingsNext = state.clanStandings;
        if (maternalClanId && state.clanStandings[maternalClanId]) {
          const cl = state.clanStandings[maternalClanId];
          const gain = hostage ? 30 : 18;
          clanStandingsNext = {
            ...state.clanStandings,
            [maternalClanId]: {
              ...cl,
              prestige: Math.min(1000, cl.prestige + gain),
              peakPrestige: Math.max(cl.peakPrestige ?? 0, cl.prestige + gain),
            },
          };
        }

        const relKey =
          state.playerForceId < targetForceId
            ? `${state.playerForceId}__${targetForceId}`
            : `${targetForceId}__${state.playerForceId}`;
        const currentRel = state.diplomacy.relations[relKey] ?? {
          forceA: state.playerForceId < targetForceId ? state.playerForceId : targetForceId,
          forceB: state.playerForceId < targetForceId ? targetForceId : state.playerForceId,
          score: 0,
          status: 'neutral' as const,
        };
        const nextDiplomacy = {
          relations: {
            ...state.diplomacy.relations,
            [relKey]: {
              ...currentRel,
              score: Math.min(100, currentRel.score + 50),
              // 聯姻同盟 — a binding tie: 'allied' blocks hostility both ways.
              status: 'allied' as const,
            },
          },
        };

        const newAlliance = {
          forceA: state.playerForceId,
          forceB: targetForceId,
          officerA: yourOfficerId,
          officerB: theirOfficerId,
          sinceYear: state.date.year,
          ...(hostage ? { hostage: true } : {}),
          ...(maternalClanId ? { maternalClanId } : {}),
        };

        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - MARRIAGE_COST },
          },
          runtimeBonds: [...state.runtimeBonds, newBond],
          diplomacy: nextDiplomacy,
          marriageAlliances: [...state.marriageAlliances, newAlliance],
          clanStandings: clanStandingsNext,
        });

        return {
          ok: true,
          message: hostage
            ? `${yours.name.en} ⚭ ${theirs.name.en}: sealed as a 質子 union with ${target.name.en} — a tighter bond, and ${yours.name.en}'s house rises as in-laws of the realm.`
            : `${yours.name.en} ⚭ ${theirs.name.en}: a binding marriage alliance with ${target.name.en} is sealed — neither realm may take up arms against the other while it stands.`,
        };
      },

      breakMarriageAlliance: (targetForceId) => {
        const state = get();
        if (!state.playerForceId) return { ok: false, message: 'No player force.' };
        const existing = allianceBetween(state.marriageAlliances, state.playerForceId, targetForceId);
        if (!existing) return { ok: false, message: 'No marriage alliance with that realm.' };
        const livingForceIds = new Set(
          Object.values(state.cities).map((c) => c.ownerForceId).filter(Boolean) as EntityId[],
        );
        const r = breakMarriageTie({
          breakerForceId: state.playerForceId,
          targetForceId,
          alliances: state.marriageAlliances,
          diplomacy: state.diplomacy,
          officers: state.officers,
          runtimeBonds: state.runtimeBonds,
          livingForceIds,
          year: state.date.year,
        });
        // 外戚失勢 — betraying an in-law tie shames the maternal house.
        let clanStandingsNext = state.clanStandings;
        if (existing.maternalClanId && state.clanStandings[existing.maternalClanId]) {
          const cl = state.clanStandings[existing.maternalClanId];
          clanStandingsNext = {
            ...state.clanStandings,
            [existing.maternalClanId]: { ...cl, prestige: Math.max(0, cl.prestige - 25) },
          };
        }
        set({
          diplomacy: r.diplomacy,
          marriageAlliances: r.alliances,
          officers: r.officers,
          runtimeBonds: r.runtimeBonds,
          clanStandings: clanStandingsNext,
        });
        return {
          ok: true,
          message: existing.hostage
            ? 'You renounce a 質子 alliance — the hostage pays with their life, your house is shamed, and your word is suspect across the realm.'
            : 'You renounce the marriage alliance. War is once more permitted — but your word is now suspect across the realm.',
        };
      },

      transferOfficer: (officerId, destinationCityId) => {
        const TRANSFER_COST = 50;
        const state = get();
        const officer = state.officers[officerId];
        const dest = state.cities[destinationCityId];
        if (!officer || !dest) return { ok: false, reason: 'invalid' };
        if (officer.forceId !== state.playerForceId)
          return { ok: false, reason: 'not your officer' };
        if (officer.status !== 'idle' || officer.task)
          return { ok: false, reason: 'officer busy or not idle' };
        if (dest.ownerForceId !== state.playerForceId)
          return { ok: false, reason: 'destination not yours' };
        if (officer.locationCityId === destinationCityId)
          return { ok: false, reason: 'already there' };
        const source = officer.locationCityId
          ? state.cities[officer.locationCityId]
          : null;
        if (!source || !source.adjacentCityIds.includes(destinationCityId))
          return { ok: false, reason: 'must be adjacent' };
        if (source.gold < TRANSFER_COST)
          return { ok: false, reason: `need ${TRANSFER_COST} gold` };

        set({
          cities: {
            ...state.cities,
            [source.id]: { ...source, gold: source.gold - TRANSFER_COST },
          },
          officers: {
            ...state.officers,
            [officerId]: { ...officer, locationCityId: destinationCityId },
          },
        });
        return { ok: true };
      },

      assignItem: (itemId, toOfficerId) => {
        const state = get();
        const target = state.officers[toOfficerId];
        if (!target) return { ok: false, reason: 'invalid officer' };
        if (target.forceId !== state.playerForceId)
          return { ok: false, reason: 'not your officer' };
        const item = ITEMS_BY_ID[itemId];
        if (!item) return { ok: false, reason: 'invalid item' };

        // Already on this officer? No-op.
        if (target.equipment.includes(itemId)) return { ok: true };

        // Find current holder (any officer that already has this item).
        const currentHolder = Object.values(state.officers).find(
          (o) => o.equipment.includes(itemId) && o.id !== toOfficerId,
        );
        if (currentHolder && currentHolder.forceId !== state.playerForceId) {
          return { ok: false, reason: 'item held by another force' };
        }

        const updates: Record<EntityId, typeof target> = {};
        if (currentHolder) {
          updates[currentHolder.id] = {
            ...currentHolder,
            equipment: currentHolder.equipment.filter((id) => id !== itemId),
          };
        }
        // Apply one-shot grants from the item (book teaches policy, etc.).
        let nextTarget: typeof target = { ...target, equipment: [...target.equipment, itemId] };
        const grants = (item as import('../data/items').Item).grants;
        if (grants) {
          if (grants.policy) {
            const have = nextTarget.policies ?? [];
            if (!have.includes(grants.policy as import('../types').PolicyId)) {
              nextTarget = { ...nextTarget, policies: [...have, grants.policy as import('../types').PolicyId] };
            }
          }
          if (grants.tactic) {
            const have = nextTarget.tactics ?? [];
            if (!have.includes(grants.tactic as import('../types').TacticId)) {
              nextTarget = { ...nextTarget, tactics: [...have, grants.tactic as import('../types').TacticId] };
            }
          }
          if (grants.trait) {
            const have = nextTarget.traits ?? [];
            if (!have.includes(grants.trait as import('../types').PersonalityTrait)) {
              nextTarget = { ...nextTarget, traits: [...have, grants.trait as import('../types').PersonalityTrait] };
            }
          }
          if (grants.formation) {
            const have = nextTarget.formations ?? [];
            if (!have.includes(grants.formation as import('../types').OfficerFormationId)) {
              nextTarget = { ...nextTarget, formations: [...have, grants.formation as import('../types').OfficerFormationId] };
            }
          }
        }
        updates[toOfficerId] = nextTarget;
        // Track item-holder history.
        const histEntry = {
          itemId,
          fromOfficerId: currentHolder?.id ?? null,
          toOfficerId,
          year: state.date.year,
          season: state.date.season,
        };
        set({
          officers: { ...state.officers, ...updates },
          itemHistory: [...(state.itemHistory ?? []), histEntry],
        });
        // 名品圖鑑 — record that this treasure has been in your armoury.
        itemCodexMarkCarried(itemId);
        return { ok: true };
      },

      unequipItem: (officerId: EntityId, itemId: EntityId) => {
        const state = get();
        const officer = state.officers[officerId];
        if (!officer) return { ok: false, reason: 'invalid officer' };
        if (officer.forceId !== state.playerForceId)
          return { ok: false, reason: 'not your officer' };
        if (!officer.equipment.includes(itemId)) return { ok: true };
        set({
          officers: {
            ...state.officers,
            [officerId]: {
              ...officer,
              equipment: officer.equipment.filter((id) => id !== itemId),
            },
          },
          itemHistory: [
            ...(state.itemHistory ?? []),
            {
              itemId,
              fromOfficerId: officerId,
              toOfficerId: officerId, // sentinel: unequipped, no new holder
              year: state.date.year,
              season: state.date.season,
            },
          ],
        });
        return { ok: true };
      },

      unequipSlot: (officerId, slot) => {
        // The `slot` argument now identifies *which item kind to unequip*.
        // Kept the name for back-compat; functionally it removes the first
        // item of the given kind. To remove a specific item, callers should
        // use the new `unequipItem` action instead.
        const state = get();
        const officer = state.officers[officerId];
        if (!officer) return { ok: false, reason: 'invalid officer' };
        if (officer.forceId !== state.playerForceId)
          return { ok: false, reason: 'not your officer' };
        const itemId = officer.equipment.find(
          (id) => ITEMS_BY_ID[id]?.kind === slot,
        );
        if (!itemId)
          return { ok: false, reason: 'no item of that kind' };
        set({
          officers: {
            ...state.officers,
            [officerId]: {
              ...officer,
              equipment: officer.equipment.filter((id) => id !== itemId),
            },
          },
        });
        return { ok: true };
      },

      appointTitle: (officerId, titleId, cityId) => {
        const state = get();
        const officer = state.officers[officerId];
        const def = CIVIC_TITLES_BY_ID[titleId];
        if (!officer || !def) return { ok: false, reason: 'invalid' };
        if (officer.forceId !== state.playerForceId)
          return { ok: false, reason: 'not your officer' };
        if (officer.status !== 'idle' && officer.status !== 'active')
          return { ok: false, reason: 'officer unavailable' };
        if (titleId === 'prefect') {
          if (!cityId) return { ok: false, reason: 'prefect needs a city' };
          const city = state.cities[cityId];
          if (!city || city.ownerForceId !== state.playerForceId)
            return { ok: false, reason: 'not your city' };
        }
        // Personality refuses (proud/humble/lazy block certain posts).
        const refusal = traitRefusal(officer, def);
        if (refusal) return { ok: false, reason: refusal.zh };
        // 品階門檻 — a great office demands a proven officer.
        if (def.minGrade) {
          const g = officerGrade(officer);
          if (gradeRank(g.grade) < gradeRank(def.minGrade)) {
            return { ok: false, reason: `品階不足：${def.name.zh}需${gradeMeta(def.minGrade).name.zh}以上（${officer.name.zh}為${g.name.zh}）。` };
          }
        }
        // 4-season cooldown after a prior revoke of (officer, title).
        const cd = isOnCooldown(state.appointmentHistory, officerId, titleId, state.date.year, state.date.season);
        if (cd.onCooldown) {
          return { ok: false, reason: `罷免未滿，餘 ${cd.seasonsLeft} 季方可復任。` };
        }
        // Apply title exclusions: appointing 丞相 also auto-revokes the
        // superseded posts (太尉/司徒/大鴻臚). Pre-empted holders go into
        // the history log as 'replaced'.
        const excludes = new Set<string>([titleId, ...(def.excludes ?? [])]);
        const replacedHistory: import('../types').AppointmentHistoryEntry[] = [];
        const filtered = state.appointments.filter((a) => {
          if (a.officerId === officerId) return false;
          if (a.forceId === state.playerForceId && excludes.has(a.titleId)) {
            if (a.titleId !== titleId) {
              replacedHistory.push({
                kind: 'revoke', year: state.date.year, season: state.date.season,
                officerId: a.officerId, forceId: a.forceId, titleId: a.titleId,
                cityId: a.cityId, reason: 'replaced',
              });
            }
            // Same-titled unique post conflict: same logic.
            if (def.uniquePerForce && a.titleId === titleId) return false;
            return false;
          }
          if (titleId === 'prefect' && a.titleId === 'prefect' && a.cityId === cityId)
            return false;
          return true;
        });
        const appt = {
          officerId,
          forceId: state.playerForceId!,
          titleId,
          cityId,
          appointedYear: state.date.year,
          appointedSeason: state.date.season,
        };
        // Apply loyalty bump on appointment; emit jealousy reactions for
        // higher-stat envious/jealous peers in the same force.
        const nextOfficers = { ...state.officers };
        const loyaltyBump = def.loyaltyOnAppoint ?? 0;
        if (loyaltyBump > 0) {
          nextOfficers[officerId] = {
            ...officer,
            loyalty: Math.min(100, officer.loyalty + loyaltyBump),
          };
        }
        // Jealousy: peers with `envious` or `jealous` trait whose
        // primaryStat exceeds the appointee's lose 5 loyalty.
        const apptStat = officer.stats[def.primaryStat];
        for (const o of Object.values(state.officers)) {
          if (o.id === officerId) continue;
          if (o.forceId !== state.playerForceId) continue;
          if (o.status === 'dead' || o.status === 'imprisoned') continue;
          const tr = o.traits ?? [];
          if (!tr.includes('envious') && !tr.includes('jealous')) continue;
          if (o.stats[def.primaryStat] <= apptStat) continue;
          const prev = nextOfficers[o.id] ?? o;
          nextOfficers[o.id] = { ...prev, loyalty: Math.max(0, prev.loyalty - 5) };
        }
        set({
          appointments: [...filtered, appt],
          officers: nextOfficers,
          appointmentHistory: [
            ...state.appointmentHistory,
            ...replacedHistory,
            {
              kind: 'appoint',
              year: state.date.year,
              season: state.date.season,
              officerId,
              forceId: state.playerForceId!,
              titleId,
              cityId,
            },
          ],
        });
        return { ok: true };
      },

      revokeTitle: (officerId) => {
        const state = get();
        const revokedAppts = state.appointments.filter((a) => a.officerId === officerId);
        if (revokedAppts.length === 0)
          return { ok: false, reason: 'no title held' };
        const after = state.appointments.filter((a) => a.officerId !== officerId);
        // Losing a post stings: drop the officer's loyalty by half of the
        // (original) appointment bump. 罷免之恥。
        const officer = state.officers[officerId];
        let nextOfficers = state.officers;
        if (officer) {
          const bumpSum = revokedAppts.reduce(
            (s, a) => s + (CIVIC_TITLES_BY_ID[a.titleId]?.loyaltyOnAppoint ?? 0),
            0,
          );
          const penalty = Math.ceil(bumpSum / 2);
          if (penalty > 0) {
            nextOfficers = {
              ...state.officers,
              [officerId]: {
                ...officer,
                loyalty: Math.max(0, officer.loyalty - penalty),
              },
            };
          }
        }
        const newHistory: import('../types').AppointmentHistoryEntry[] = revokedAppts.map((a) => ({
          kind: 'revoke',
          year: state.date.year,
          season: state.date.season,
          officerId: a.officerId,
          forceId: a.forceId,
          titleId: a.titleId,
          cityId: a.cityId,
          reason: 'manual',
        }));
        set({
          appointments: after,
          officers: nextOfficers,
          appointmentHistory: [...state.appointmentHistory, ...newHistory],
        });
        return { ok: true };
      },

      promoteOfficer: (officerId, rankId) => {
        const state = get();
        const officer = state.officers[officerId];
        const rankDef = MILITARY_RANKS_BY_ID[rankId];
        if (!officer || !rankDef) return { ok: false, reason: 'invalid' };
        if (officer.forceId !== state.playerForceId)
          return { ok: false, reason: 'not your officer' };
        const best = Math.max(officer.stats.war, officer.stats.leadership);
        if (best < rankDef.minStat)
          return { ok: false, reason: `requires ${rankDef.minStat} war/lead` };
        const nextOfficers = {
          ...state.officers,
          [officerId]: {
            ...officer,
            rank: rankId,
            loyalty: Math.min(100, officer.loyalty + rankDef.loyaltyBonus),
          },
        };
        // Jealousy reactions — same logic as appointTitle.
        const apptStat = best;
        for (const o of Object.values(state.officers)) {
          if (o.id === officerId) continue;
          if (o.forceId !== state.playerForceId) continue;
          if (o.status === 'dead' || o.status === 'imprisoned') continue;
          const tr = o.traits ?? [];
          if (!tr.includes('envious') && !tr.includes('jealous')) continue;
          const oBest = Math.max(o.stats.war, o.stats.leadership);
          if (oBest <= apptStat) continue;
          const prev = nextOfficers[o.id] ?? o;
          nextOfficers[o.id] = { ...prev, loyalty: Math.max(0, prev.loyalty - 5) };
        }
        set({ officers: nextOfficers });
        return { ok: true };
      },

      grantPeerage: (officerId, peerageId) => {
        const state = get();
        const officer = state.officers[officerId];
        const def = PEERAGES_BY_ID[peerageId];
        if (!officer || !def) return { ok: false, reason: 'invalid' };
        if (officer.forceId !== state.playerForceId)
          return { ok: false, reason: 'not your officer' };
        if (officer.status === 'dead' || officer.status === 'imprisoned')
          return { ok: false, reason: 'unavailable' };
        if (peerageTier(officer.peerageId) >= def.tier)
          return { ok: false, reason: 'already holds an equal or higher peerage' };
        const force = state.playerForceId ? state.forces[state.playerForceId] : undefined;
        const sovereign =
          force?.imperialRank === 'king' || force?.imperialRank === 'emperor';
        if (def.requiresSovereign && !sovereign)
          return { ok: false, reason: 'requires 稱王/稱帝 to confer 公/王' };
        const merit = meritScore(officer, state.deeds[officerId]);
        if (merit < def.minMerit)
          return { ok: false, reason: `requires ${def.minMerit} merit (has ${merit})` };
        const nextOfficers = {
          ...state.officers,
          [officerId]: {
            ...officer,
            peerageId,
            loyalty: Math.min(100, officer.loyalty + def.loyaltyOnGrant),
          },
        };
        // Jealousy — high-merit rivals without a peerage of their own resent
        // an enfeoffment they feel they earned.
        for (const o of Object.values(state.officers)) {
          if (o.id === officerId) continue;
          if (o.forceId !== state.playerForceId) continue;
          if (o.status === 'dead' || o.status === 'imprisoned') continue;
          const tr = o.traits ?? [];
          if (!tr.includes('envious') && !tr.includes('jealous')) continue;
          if (peerageTier(o.peerageId) >= def.tier) continue;
          if (meritScore(o, state.deeds[o.id]) <= merit) continue;
          const prev = nextOfficers[o.id] ?? o;
          nextOfficers[o.id] = { ...prev, loyalty: Math.max(0, prev.loyalty - 5) };
        }
        set({ officers: nextOfficers });
        return { ok: true };
      },

      revokePeerage: (officerId) => {
        const state = get();
        const officer = state.officers[officerId];
        if (!officer) return { ok: false, reason: 'invalid' };
        if (officer.forceId !== state.playerForceId)
          return { ok: false, reason: 'not your officer' };
        if (!officer.peerageId) return { ok: false, reason: 'holds no peerage' };
        // 削爵之辱 — losing one's fief is a grave humiliation: a heavy loyalty
        // blow and a grievance, scaled by how great the fief was.
        const tier = peerageTier(officer.peerageId);
        const penalty = 10 + tier * 2;
        set({
          officers: {
            ...state.officers,
            [officerId]: {
              ...officer,
              peerageId: undefined,
              loyalty: Math.max(0, officer.loyalty - penalty),
              grievanceCount: (officer.grievanceCount ?? 0) + 1,
            },
          },
        });
        return { ok: true };
      },

      grantHonorific: (officerId, honorificId) => {
        const state = get();
        const officer = state.officers[officerId];
        const def = HONORIFICS_BY_ID[honorificId];
        if (!officer || !def) return { ok: false, reason: 'invalid' };
        if (officer.forceId !== state.playerForceId)
          return { ok: false, reason: 'not your officer' };
        if (officer.status === 'dead' || officer.status === 'imprisoned')
          return { ok: false, reason: 'unavailable' };
        if (honorificTier(officer.honorificId) >= def.tier)
          return { ok: false, reason: 'already holds an equal or higher honorific' };
        const merit = meritScore(officer, state.deeds[officerId]);
        if (merit < def.minMerit)
          return { ok: false, reason: `requires ${def.minMerit} merit (has ${merit})` };
        set({
          officers: {
            ...state.officers,
            [officerId]: {
              ...officer,
              honorificId,
              loyalty: Math.min(100, officer.loyalty + def.loyaltyOnGrant),
              renown: (officer.renown ?? 0) + def.renownOnGrant,
            },
          },
        });
        return { ok: true };
      },

      revokeHonorific: (officerId) => {
        const state = get();
        const officer = state.officers[officerId];
        if (!officer) return { ok: false, reason: 'invalid' };
        if (officer.forceId !== state.playerForceId)
          return { ok: false, reason: 'not your officer' };
        if (!officer.honorificId) return { ok: false, reason: 'holds no honorific' };
        // 奪號之辱 — stripping a martial title stings (scaled by its tier).
        const penalty = 6 + honorificTier(officer.honorificId) * 3;
        set({
          officers: {
            ...state.officers,
            [officerId]: {
              ...officer,
              honorificId: undefined,
              loyalty: Math.max(0, officer.loyalty - penalty),
              grievanceCount: (officer.grievanceCount ?? 0) + 1,
            },
          },
        });
        return { ok: true };
      },

      setRecruitmentStance: (stance) => {
        const state = get();
        const fid = state.playerForceId;
        if (!fid) return;
        const force = state.forces[fid];
        if (!force) return;
        set({ forces: { ...state.forces, [fid]: { ...force, recruitmentStance: stance } } });
      },

      setStatecraft: (school) => {
        const state = get();
        const fid = state.playerForceId;
        if (!fid) return;
        const force = state.forces[fid];
        if (!force) return;
        set({ forces: { ...state.forces, [fid]: { ...force, statecraft: school ?? undefined } } });
      },

      holdFoundingCeremony: (dynastyTitle, eraName) => {
        const state = get();
        const fid = state.playerForceId;
        if (!fid) return { ok: false, message: 'No player force.' };
        const force = state.forces[fid];
        if (!force) return { ok: false, message: 'No player force.' };
        if (force.imperialRank !== 'king' && force.imperialRank !== 'emperor')
          return { ok: false, message: '須先稱王或稱帝方可行建國大典。 (Requires 王/帝 standing.)' };
        if (force.foundingYear !== undefined)
          return { ok: false, message: '建國大典已行,不可再行。 (Already held.)' };
        if (!dynastyTitle.trim() || !eraName.trim())
          return { ok: false, message: '須定國號與年號。 (Pick a dynasty title and era name.)' };
        const r = holdFounding({
          forceId: fid,
          cities: state.cities,
          officers: state.officers,
          deeds: state.deeds,
        });
        const mandate = {
          ...state.mandate,
          byForce: {
            ...state.mandate.byForce,
            [fid]: Math.min(100, (state.mandate.byForce[fid] ?? 50) + r.mandateGain),
          },
        };
        set({
          cities: r.cities,
          officers: r.officers,
          mandate,
          forces: {
            ...state.forces,
            [fid]: { ...force, dynastyTitle: dynastyTitle.trim(), eraName: eraName.trim(), foundingYear: state.date.year },
          },
        });
        return {
          ok: true,
          message: `${dynastyTitle.trim()}・${eraName.trim()} 元年:大典告成,大赦天下,封賞百官 ${r.enfeoffed.length} 人,天命大盛。`,
          enfeoffed: r.enfeoffed.length,
        };
      },

      resolveEventChoice: (choiceId) => {
        const state = get();
        const pending = state.pendingEvent;
        const choice = pending?.event.choices?.find((c) => c.id === choiceId);
        if (!pending || !choice) return;
        const after = applyEventEffects(
          { ...pending.event, effects: choice.effects, choices: undefined },
          {
            date: state.date,
            cities: state.cities,
            officers: state.officers,
            forces: state.forces,
            eventFlags: state.eventFlags,
            firedEventIds: state.firedEventIds,
          },
        );
        set({
          cities: after.cities,
          officers: after.officers,
          forces: after.forces,
          eventFlags: after.eventFlags,
          pendingEvent: null,
        });
      },

      dismissEvent: () => {
        const state = get();
        if (!state.pendingEvent) return;
        set({ pendingEvent: null });
      },

      startTacticalBattle: (battle) => set((s) => {
        // 回放採集 — when a NEW TURN begins, snapshot the outgoing state (slim:
        // no popups, trimmed log) so the replay viewer can scrub the battle
        // turn by turn. Capped; reset whenever a different battle starts.
        const prev = s.tacticalBattle;
        let snaps = s.currentBattleSnapshots;
        if (!prev || prev.id !== battle.id) snaps = [];
        else if (battle.turn > prev.turn) {
          snaps = [...snaps, { ...prev, damagePopups: [], log: (prev.log ?? []).slice(-20) }].slice(-60);
        }
        return { tacticalBattle: battle, currentBattleSnapshots: snaps };
      }),

      setMarchPreview: (preview) => set({ marchPreview: preview }),

      dispatchRelief: (cityId, troops) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city) return;
        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, troops: Math.max(0, city.troops - troops) },
          },
        });
      },

      spendSiegeWorks: (cityId, gold, food) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city || city.gold < gold || city.food < food) return false;
        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - gold, food: city.food - food },
          },
        });
        return true;
      },

      startFieldBattle: (playerArmyId, enemyArmyId) => {
        const battle = buildFieldBattle(get(), playerArmyId, enemyArmyId, true);
        if (!battle) return false;
        set({ tacticalBattle: battle, selectedArmyId: null });
        return true;
      },

      grantSparXp: (winnerId, loserId, draw = false, favored) => {
        const state = get();
        const w = state.officers[winnerId];
        const l = state.officers[loserId];
        if (!w || !l) return null;
        // 演武 — a non-lethal bout. Both improve; the winner a little more. A
        // draw splits the middle. Growth is still capped by each officer's latent.
        // `favored` steers growth (a 舌戰 grows 知力/魅力 rather than 武力).
        const rw = grantXp(w, draw ? 32 : 42, Math.random, favored);
        const rl = grantXp(l, draw ? 32 : 26, Math.random, favored);
        // 切磋情誼 — crossing blades in friendship warms the pair, and lets two
        // who'd soured vent the grudge: a 宿怨 can even be laid to rest this way.
        const rec = reconcilePair(state.rapport, state.runtimeBonds, winnerId, loserId, 8);
        set({
          officers: { ...state.officers, [winnerId]: rw.officer, [loserId]: rl.officer },
          rapport: rec.rapport,
          runtimeBonds: rec.runtimeBonds,
        });
        return {
          winnerName: w.name.zh, loserName: l.name.zh,
          winnerLeveled: rw.leveled, loserLeveled: rl.leveled,
          notes: [...rw.entries, ...rl.entries].map((e) => e.textZh ?? e.text),
        };
      },
      recordTrainingUse: (kind, ids) => {
        const state = get();
        const key = trainKey(state.date);
        if (kind === 'debate') {
          set({ debateUsage: recordTrain(state.debateUsage ?? {}, ids, key) });
        } else {
          set({ sparUsage: recordTrain(state.sparUsage ?? {}, ids, key) });
        }
      },
      afflictOfficer: (officerId, affliction) => {
        const state = get();
        const o = state.officers[officerId];
        if (!o || o.status === 'dead') return;
        set({ officers: { ...state.officers, [officerId]: withAffliction(o, affliction) } });
      },
      debateRout: (officerId, rng = Math.random) => {
        const state = get();
        const o = state.officers[officerId];
        if (!o || o.status === 'dead') return 'none';
        const age = state.date.year - o.birthYear;
        const outcome = routConsequence(o, age, rng);
        if (outcome === 'death') {
          set({ officers: { ...state.officers, [officerId]: { ...o, status: 'dead', forceId: null, task: null, woundedSeasons: undefined, woundSeverity: undefined } } });
        } else if (outcome === 'shame') {
          set({ officers: { ...state.officers, [officerId]: withAffliction(o, { kind: 'shame', seasons: 4, charisma: -10, intelligence: -8 }) } });
        }
        return outcome;
      },
      shiftCityLoyalty: (cityId, delta) => {
        const state = get();
        const c = state.cities[cityId];
        if (!c) return;
        set({ cities: { ...state.cities, [cityId]: { ...c, loyalty: Math.max(0, Math.min(100, c.loyalty + delta)) } } });
      },
      spendCityGold: (cityId, amount) => {
        const state = get();
        const c = state.cities[cityId];
        if (!c || c.gold < amount) return false;
        set({ cities: { ...state.cities, [cityId]: { ...c, gold: c.gold - amount } } });
        return true;
      },
      appraiseOfficer: (targetId) => {
        const state = get();
        const target = state.officers[targetId];
        if (!target || target.status === 'dead') return { ok: false, reason: 'no-target' };
        // 名士 — the player's keenest eye for talent (idle/active, INT ≥ bar).
        const appraiser = Object.values(state.officers)
          .filter((o) => o.forceId === state.playerForceId && (o.status === 'idle' || o.status === 'active') && canAppraise(o) && o.id !== targetId)
          .sort((a, b) => discernment(b) - discernment(a))[0];
        if (!appraiser) return { ok: false, reason: 'no-appraiser' };
        // An accurate read is final; a 走眼 one may be retried — but only by a
        // strictly sharper eye than the judge who last misjudged him.
        if (target.appraisal) {
          if (!target.appraisal.misread) return { ok: false, reason: 'appraised' };
          if (appraiser.stats.intelligence <= (target.appraisal.byInt ?? 0)) return { ok: false, reason: 'no-better-eye' };
        }
        // 識人造詣 — a legend never errs; a middling eye may 走眼.
        const accurate = isLegendaryCritic(appraiser) || Math.random() < discernment(appraiser);
        const verdict: typeof target.appraisal = accurate
          ? { ...(legendaryVerdict(target) ?? appraisalVerdict(target)) }
          : { ...appraisalMisread(Math.random), byInt: appraiser.stats.intelligence };
        const gain = accurate ? appraisalRenownGain(appraiser, target) : { target: 0, appraiser: 0 };
        const officers = {
          ...state.officers,
          [target.id]: { ...target, appraisal: verdict, renown: (target.renown ?? 0) + gain.target },
          [appraiser.id]: { ...state.officers[appraiser.id], renown: (appraiser.renown ?? 0) + gain.appraiser },
        };
        if (accurate && verdict.grade === 'upper') {
          // 知遇之恩 — a glowing read of an in-the-wild talent inclines them to you;
          // a glowing read of your OWN officer heartens them (受知遇,+忠誠).
          if (target.forceId !== state.playerForceId && state.playerForceId) {
            officers[target.id] = { ...officers[target.id], recognizedByForceId: state.playerForceId };
          } else if (target.forceId === state.playerForceId) {
            officers[target.id] = { ...officers[target.id], loyalty: Math.min(100, target.loyalty + 4) };
          }
        }
        set({ officers });
        return { ok: true, verdictZh: verdict.zh, verdictEn: verdict.en, appraiserName: appraiser.name, renownGain: gain.target, misread: !accurate, legendary: accurate && !!legendaryVerdict(target) };
      },
      recordDeed: (officerId, patch) => {
        const state = get();
        const cur = state.deeds[officerId] ?? createDeeds(officerId);
        const curRec = cur as unknown as Record<string, number>;
        const merged = { ...cur } as unknown as Record<string, unknown>;
        for (const [k, v] of Object.entries(patch)) {
          merged[k] = typeof v === 'number' ? (curRec[k] ?? 0) + v : v;
        }
        set({ deeds: { ...state.deeds, [officerId]: merged as unknown as import('../types').HeroicDeeds } });
      },
      recordBout: (rec) => {
        set({ duelHall: pushBoutRecord(get().duelHall, rec) });
      },
      recordDuelRating: (aId, bId, result) => {
        const state = get();
        const a = state.officers[aId];
        const b = state.officers[bId];
        if (!a || !b) return;
        const u = applyBout(state.warRatings, a, b, result);
        set({ warRatings: { ...state.warRatings, [u.winnerId]: u.winnerRating, [u.loserId]: u.loserRating } });
      },
      markDuelScenarioCleared: (scenarioId) => {
        const cur = get().clearedDuelScenarios ?? [];
        if (cur.includes(scenarioId)) return;
        set({ clearedDuelScenarios: [...cur, scenarioId] });
      },
      applyScenarioEffects: (effects) => {
        const state = get();
        const player = state.forces[state.playerForceId ?? ''];
        if (!player) return;
        const officers = { ...state.officers };
        const cities = { ...state.cities };
        const capId = player.capitalCityId;
        let relations = state.diplomacy.relations;
        let diploTouched = false;
        for (const e of effects) {
          if (e.kind === 'gold' && e.amount && cities[capId]) {
            cities[capId] = { ...cities[capId], gold: cities[capId].gold + e.amount };
          } else if (e.kind === 'recruit' && e.targetId) {
            const o = officers[e.targetId];
            if (o && o.status !== 'dead' && o.forceId !== state.playerForceId) {
              officers[e.targetId] = { ...o, forceId: state.playerForceId, status: 'idle', task: null, locationCityId: capId, loyalty: Math.max(o.loyalty, 65) };
            }
          } else if (e.kind === 'afflict' && e.targetId) {
            const o = officers[e.targetId];
            if (o && o.status !== 'dead') officers[e.targetId] = withAffliction(o, { kind: 'shame', seasons: 4, charisma: -10, intelligence: -8 });
          } else if (e.kind === 'slay' && e.targetId) {
            // 罵死 — a scripted rout that actually breaks the foe (王朗墜馬而亡).
            const o = officers[e.targetId];
            if (o && o.status !== 'dead') officers[e.targetId] = { ...o, status: 'dead', forceId: null, task: null, woundedSeasons: undefined, woundSeverity: undefined };
          } else if (e.kind === 'ally' && e.targetId && state.playerForceId) {
            // 游说结盟 — shift diplomacy with the target force; a decisive win
            // (amount ≥20) seals the alliance, a loss merely sours the score.
            relations = diploTouched ? relations : { ...relations };
            diploTouched = true;
            const x = state.playerForceId, y = e.targetId;
            const key = pairKey(x, y);
            const rel = relations[key] ?? { forceA: x < y ? x : y, forceB: x < y ? y : x, score: 0, status: 'neutral' as const };
            const score = Math.max(-100, Math.min(100, rel.score + (e.amount ?? 0)));
            relations[key] = { ...rel, score, status: (e.amount ?? 0) >= 20 ? 'allied' : rel.status };
          }
          // 'relationship' / 'morale' / 'note' are display-only here.
        }
        set({ officers, cities, ...(diploTouched ? { diplomacy: { ...state.diplomacy, relations } } : {}) });
      },
      grantOfficerXp: (officerId, amount, favored) => {
        const state = get();
        const o = state.officers[officerId];
        if (!o) return null;
        const r = grantXp(o, amount, Math.random, favored);
        set({ officers: { ...state.officers, [officerId]: r.officer } });
        return { leveled: r.leveled, notes: r.entries.map((e) => e.textZh ?? e.text) };
      },
      setTrainingFocus: (officerId, stat) => {
        const state = get();
        const o = state.officers[officerId];
        if (!o) return;
        const next = { ...o };
        if (stat) next.trainingFocus = stat;
        else delete next.trainingFocus;
        set({ officers: { ...state.officers, [officerId]: next } });
      },
      breakthroughOfficer: (officerId, path) => {
        const state = get();
        const o = state.officers[officerId];
        if (!o) return { ok: false, reason: 'no-officer' };
        const gate = canBreakthrough(o);
        if (!gate.ok) return { ok: false, reason: gate.reason };
        const cityId = o.locationCityId;
        const city = cityId ? state.cities[cityId] : null;
        if (!city || city.ownerForceId !== state.playerForceId) return { ok: false, reason: 'no-city' };
        const cost = breakthroughCost(o);
        if (city.gold < cost) return { ok: false, reason: 'no-gold' };
        const iron = breakthroughIronCost(o); // 淬鍊之鐵 — 突破 also consumes the city's 鐵
        if ((city.iron ?? 0) < iron) return { ok: false, reason: 'no-iron' };
        const r = applyBreakthrough(o, path);
        set({
          officers: { ...state.officers, [officerId]: r.officer },
          cities: { ...state.cities, [city.id]: { ...city, gold: city.gold - cost, iron: (city.iron ?? 0) - iron } },
        });
        return { ok: true, notes: r.entries.map((e) => e.textZh ?? e.text) };
      },
      assignMentor: (studentId, mentorId) => {
        const state = get();
        const student = state.officers[studentId];
        if (!student) return { ok: false, reason: 'no-student' };
        if (student.forceId !== state.playerForceId) return { ok: false, reason: 'not-yours' };
        if (mentorId === null) {
          if (!student.mentorId) return { ok: true };
          const next = { ...student };
          delete next.mentorId;
          set({ officers: { ...state.officers, [studentId]: next } });
          return { ok: true };
        }
        if (mentorId === studentId) return { ok: false, reason: 'self' };
        const master = state.officers[mentorId];
        if (!master) return { ok: false, reason: 'no-master' };
        if (master.forceId !== state.playerForceId) return { ok: false, reason: 'not-yours' };
        // No two-way bonds (would make the XP loop circular).
        if (master.mentorId === studentId) return { ok: false, reason: 'cycle' };
        set({ officers: { ...state.officers, [studentId]: { ...student, mentorId } } });
        return { ok: true };
      },
      studyManual: (officerId, itemId) => {
        const state = get();
        const o = state.officers[officerId];
        if (!o) return { ok: false, reason: 'no-officer' };
        if (o.forceId !== state.playerForceId) return { ok: false, reason: 'not-yours' };
        if (!o.equipment.includes(itemId)) return { ok: false, reason: 'not-carried' };
        const c = ITEMS_BY_ID[itemId]?.consumable;
        if (!c) return { ok: false, reason: 'not-consumable' };
        const statZh: Record<string, string> = { leadership: '統率', war: '武力', intelligence: '智力', politics: '政治', charisma: '魅力' };
        // The book is spent the moment it's opened — remove it first.
        let officer: Officer = { ...o, equipment: o.equipment.filter((id) => id !== itemId) };
        const notes: string[] = [];
        if (c.skill && !officer.skills.includes(c.skill)) {
          officer = { ...officer, skills: [...officer.skills, c.skill] };
          notes.push(`習得「${SKILLS_BY_ID[c.skill]?.name.zh ?? c.skill}」之技`);
        }
        if (c.latent) {
          const latent = { ...(officer.latentStats ?? defaultLatent(officer.stats)) };
          const k = c.latent.stat;
          const before = latent[k];
          latent[k] = Math.min(STAT_CAP, before + c.latent.amount);
          officer = { ...officer, latentStats: latent };
          if (latent[k] > before) notes.push(`${statZh[k]}潛能 +${latent[k] - before}`);
        }
        if (c.xp) {
          const r = grantXp(officer, c.xp, Math.random, undefined, { year: state.date.year });
          officer = r.officer;
          notes.push(`歷練 +${c.xp}`, ...r.entries.map((e) => e.textZh ?? e.text));
        }
        set({ officers: { ...state.officers, [officerId]: officer } });
        return { ok: true, notes };
      },
      assignHeadmaster: (cityId, buildingId, officerId) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city || city.ownerForceId !== state.playerForceId) return { ok: false, reason: 'no-city' };
        if (!SCHOOL_BUILDINGS.has(buildingId)) return { ok: false, reason: 'not-school' };
        const idx = state.buildings.findIndex((b) => b.cityId === cityId && b.id === buildingId);
        if (idx < 0) return { ok: false, reason: 'no-building' };
        if (officerId !== null) {
          const o = state.officers[officerId];
          if (!o || o.forceId !== state.playerForceId) return { ok: false, reason: 'not-yours' };
          if (o.locationCityId !== cityId) return { ok: false, reason: 'not-here' };
        }
        const buildings = state.buildings.slice();
        const next = { ...buildings[idx] };
        if (officerId === null) delete next.headmasterId; else next.headmasterId = officerId;
        buildings[idx] = next;
        set({ buildings });
        return { ok: true };
      },
      resetItemGrowth: (itemId) => {
        const state = get();
        const base = ITEMS_BY_ID[itemId];
        if (!base) return { ok: false, reason: 'no-item' };
        const plus = state.itemRefinements[itemId] ?? 0;
        const stars = state.itemBreakthroughs[itemId] ?? 0;
        const gems = state.itemGems[itemId] ?? [];
        if (plus === 0 && stars === 0 && gems.length === 0) return { ok: false, reason: 'nothing' };
        // Half the sunk gold is refunded to the holder's city (if you own it); gems
        // return to stock in full. 名器威名 (itemLore) is earned, so it's untouched.
        const refund = Math.round(0.5 * itemGrowthGoldSpent(base, plus, stars));
        const holder = Object.values(state.officers).find(
          (o) => o.forceId === state.playerForceId && o.equipment.includes(itemId),
        );
        const city = holder?.locationCityId ? state.cities[holder.locationCityId] : null;
        const itemRefinements = { ...state.itemRefinements }; delete itemRefinements[itemId];
        const itemBreakthroughs = { ...state.itemBreakthroughs }; delete itemBreakthroughs[itemId];
        const itemGems = { ...state.itemGems }; delete itemGems[itemId];
        setRefineRegistry(itemRefinements); setBreakthroughRegistry(itemBreakthroughs); setGemRegistry(itemGems);
        const gemStock = { ...state.gemStock };
        for (const gid of gems) gemStock[gid] = (gemStock[gid] ?? 0) + 1;
        const cities = (city && city.ownerForceId === state.playerForceId)
          ? { ...state.cities, [city.id]: { ...city, gold: city.gold + refund } }
          : state.cities;
        set({ itemRefinements, itemBreakthroughs, itemGems, gemStock, cities });
        return { ok: true, refund };
      },
      startPracticeBattle: (cityId, bearing = 0, officerIds) => {
        const state = get();
        if (state.tacticalBattle) return false; // one battle at a time
        const city = state.cities[cityId];
        if (!city || city.ownerForceId !== state.playerForceId) return false;
        // 守城演習 — the player defends this city's REAL battlefield: its walls,
        // its terrain, and the perimeter defences it has actually built. A
        // mirror of the garrison plays the sparring assault force (AI-driven).
        const eligible = (o: Officer | undefined): o is Officer => !!o
          && o.locationCityId === cityId && o.forceId === state.playerForceId
          && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned';
        // Hand-picked roster if given; otherwise the garrison's best six.
        const garrison = officerIds && officerIds.length > 0
          ? officerIds.map((id) => state.officers[id]).filter(eligible).slice(0, 6)
          : Object.values(state.officers)
              .filter(eligible)
              .sort((a, b) => (b.stats.war * 0.6 + b.stats.leadership * 0.4) - (a.stats.war * 0.6 + a.stats.leadership * 0.4))
              .slice(0, 6);
        if (garrison.length === 0) return false;
        // A drill always fields a meaningful body of troops even if the city's
        // larder is empty — split the garrison's strength evenly per officer.
        const drillTroops = Math.max(city.troops, garrison.length * 2000);
        const n = garrison.length;
        const base = Math.floor(drillTroops / n);
        const teamOf = (offs: Officer[]) => offs.map((o, i) => ({
          officer: o,
          troops: i === 0 ? drillTroops - base * (n - 1) : base,
          unitType: inferUnitType(o),
        }));
        const tp = cityPos(city);
        const stratWeather = state.weather?.kind ?? 'clear';
        const battle = setupTacticalBattle({
          cityId,
          width: 18,
          height: 12,
          // Player holds the walls (defender); the sparring assault is AI-run
          // under a sentinel force id so playerSide resolves to 'defender'.
          attackerForceId: '__spar__',
          defenderForceId: state.playerForceId,
          attackers: teamOf(garrison),
          defenders: teamOf(garrison),
          weather: (stratWeather === 'drought' ? 'clear' : stratWeather) as 'clear' | 'rain' | 'wind' | 'fog' | 'snow',
          timeOfDay: rollTimeOfDay(),
          windDirection: state.weather?.wind ?? 'calm',
          // The city's own perimeter defences (箭樓 / 拒馬 / 鐵索…) man the walls
          // and fire on the AI attacker — exactly as in a live 守城戰.
          buildSlots: city.buildSlots,
          forts: state.forts,
          terrainHint: { terrain: city.terrain, port: city.port, x: city.coords.x, y: city.coords.y },
          // The assault rolls in along the chosen approach — so the board samples
          // the real ground in that direction (the same geography the city map's
          // hinterland shows there) and the attackers enter from that bearing.
          battleGeo: { x: tp.x, y: tp.y, bearing, anchorCol: 16, season: state.date.season },
        });
        battle.practice = true;
        // 演習練兵 — hands-on sparring builds the garrison's 練度 (drill level),
        // the same stat the 練兵 command raises (feeds defensive power in a real
        // siege; see cityDrillDefenseMultiplier in combat.ts).
        const drilled = Math.min(100, (city.drill ?? 0) + 3);
        set({
          tacticalBattle: battle,
          selectedCityId: cityId,
          cities: { ...state.cities, [cityId]: { ...city, drill: drilled } },
        });
        return true;
      },

      startNextSiegeDefense: () => {
        const state = get();
        if (state.tacticalBattle) return; // one battle at a time
        const queue = state.pendingSiegeDefenseQueue ?? [];
        if (queue.length === 0) return;
        const [item, ...rest] = queue;
        const src = state.cities[item.sourceCityId];
        const tgt = state.cities[item.targetCityId];
        const offs = item.officerIds
          .map((id) => state.officers[id])
          .filter((o): o is Officer => !!o && o.status !== 'dead' && o.status !== 'imprisoned');
        // Stale entry (city changed hands, attackers gone) — drop and retry.
        if (!src || !tgt || tgt.ownerForceId !== state.playerForceId || offs.length === 0 || !offs[0].forceId) {
          set({ pendingSiegeDefenseQueue: rest });
          return;
        }
        const n = offs.length;
        const base = Math.floor(item.troops / n);
        const attackers = offs.map((o, i) => ({
          officer: o,
          troops: i === 0 ? item.troops - base * (n - 1) : base,
          unitType: inferUnitType(o),
        }));
        const defOffs = Object.values(state.officers)
          .filter((o) => o.locationCityId === tgt.id && o.forceId === state.playerForceId
            && o.status !== 'dead' && o.status !== 'unsearched' && !o.task)
          .sort((a, b) => (b.stats.war * 0.6 + b.stats.leadership * 0.4) - (a.stats.war * 0.6 + a.stats.leadership * 0.4))
          .slice(0, 6);
        if (defOffs.length === 0 || tgt.troops < 1) {
          set({ pendingSiegeDefenseQueue: rest });
          return;
        }
        const dn = defOffs.length;
        const dbase = Math.floor(tgt.troops / dn);
        const defenders = defOffs.map((o, i) => ({
          officer: o,
          troops: i === 0 ? tgt.troops - dbase * (dn - 1) : dbase,
          unitType: inferUnitType(o),
        }));
        // The AI prosecutes its siege like a player would — works picked by
        // the same gates as the abstract layer.
        const tp = cityPos(tgt);
        const sp = cityPos(src);
        let works: 'storm' | 'invest' | 'flood' = 'storm';
        if (tgt.troops >= 5000) {
          if (isRiverside(tp.x, tp.y) && state.weather?.kind !== 'drought' && src.gold >= 1000) works = 'flood';
          else if (tgt.food < tgt.troops * 6 && src.food >= Math.max(800, item.troops) + 5000) works = 'invest';
        }
        const stratWeather = state.weather?.kind ?? 'clear';
        const bearing = Math.atan2(tp.y - sp.y, tp.x - sp.x);
        // 馳援 — the player's neighbouring cities ride to the rescue.
        const relief = planSiegeRelief({
          target: tgt, cities: state.cities, officers: state.officers,
          defenderForceId: state.playerForceId, bearing,
        });
        const battle = setupTacticalBattle({
          cityId: tgt.id,
          width: 18,
          height: 12,
          attackerForceId: offs[0].forceId,
          defenderForceId: state.playerForceId,
          attackers,
          defenders,
          weather: (stratWeather === 'drought' ? 'clear' : stratWeather) as 'clear' | 'rain' | 'wind' | 'fog' | 'snow',
          timeOfDay: rollTimeOfDay(),
          windDirection: state.weather?.wind ?? 'calm',
          buildSlots: tgt.buildSlots,
          forts: state.forts,
          terrainHint: { terrain: tgt.terrain, port: tgt.port, x: tgt.coords.x, y: tgt.coords.y },
          battleGeo: { x: tp.x, y: tp.y, bearing, anchorCol: 16, season: state.date.season },
          siegeWorks: works,
          reinforcements: relief.reinforcements,
        });
        battle.siegeDefenseSourceCityId = item.sourceCityId;
        battle.reliefPlans = relief.plans;
        const citiesAfterRelief = { ...state.cities };
        for (const plan of relief.plans) {
          const c = citiesAfterRelief[plan.cityId];
          if (c) citiesAfterRelief[plan.cityId] = { ...c, troops: Math.max(0, c.troops - plan.troops) };
        }
        set({ tacticalBattle: battle, pendingSiegeDefenseQueue: rest, selectedCityId: null, cities: citiesAfterRelief });
      },

      startNextFieldBattle: () => {
        const state = get();
        if (state.tacticalBattle) return; // one battle at a time
        const queue = state.pendingFieldBattleQueue ?? [];
        if (queue.length === 0) return;
        // Start the first still-valid queued clash; drop any whose armies have
        // since vanished (resolved another way).
        for (let i = 0; i < queue.length; i++) {
          const battle = buildFieldBattle(state, queue[i].playerArmyId, queue[i].enemyArmyId, false);
          if (battle) {
            set({
              tacticalBattle: battle,
              selectedArmyId: null,
              pendingFieldBattleQueue: [...queue.slice(0, i), ...queue.slice(i + 1)],
            });
            return;
          }
        }
        set({ pendingFieldBattleQueue: [] });
      },
      endTacticalBattle: (winner, attackerLosses, defenderLosses) => {
        const state = get();
        const tb = state.tacticalBattle;
        if (!tb) return;
        set({
          tacticalBattle: {
            ...tb,
            winner,
            attackerLosses,
            defenderLosses,
          },
        });
      },
      cancelTacticalBattle: () => {
        const tb = get().tacticalBattle;
        // 守城戰 cannot simply be dismissed — walking away abandons the
        // walls and the city falls to the besieger (棄城).
        if (tb?.siegeDefenseSourceCityId) {
          get().applyTacticalResolution([], [], 0, 'attacker');
          return;
        }
        set({ tacticalBattle: null });
      },

      applyTacticalResolution: (captured, dead, lootGold, winner) => {
        const state = get();
        const tb = state.tacticalBattle;
        if (!tb) return;
        let officers = { ...state.officers };
        const cities = { ...state.cities };
        const careerMilestones: Array<{ title: { zh: string; en: string }; year: number; season: typeof state.date.season }> = [];
        const chronicleAppend: Array<{ year: number; season: string; zh: string; en: string; kind: 'conquest' | 'works' | 'event' | 'rebellion' | 'defense' }> = [];

        // Award XP to all participants.
        const participantIds = tb.units.map((u) => u.officerId);
        const victorIds = winner
          ? tb.units.filter((u) => u.side === winner).map((u) => u.officerId)
          : [];
        // 年齡軸 + 戰績驅動 — feed the current year (so age shapes each officer's
        // growth arc) and their career deeds so far (so growth drifts toward what
        // they actually do on the field).
        const xpResult = awardBattleXp(officers, participantIds, victorIds, undefined, {
          year: state.date.year,
          deedsById: state.deeds,
        });
        officers = xpResult.officers;

        // Heroic deeds tracking.
        const deeds = { ...state.deeds };
        // Also accumulate the battlefield deltas into a transient
        // per-season tracker so endSeason can compute MVPs for these
        // columns (which don't pass through resolveSeason's deedDeltas).
        const nextSeasonBattle: Record<EntityId, { killsTroops: number; captured: number; citiesTaken: number }> =
          { ...state.seasonBattleDeltas };
        const bumpSeasonBattle = (id: string, patch: { killsTroops?: number; captured?: number; citiesTaken?: number }) => {
          const cur = nextSeasonBattle[id] ?? { killsTroops: 0, captured: 0, citiesTaken: 0 };
          nextSeasonBattle[id] = {
            killsTroops: cur.killsTroops + (patch.killsTroops ?? 0),
            captured:    cur.captured    + (patch.captured ?? 0),
            citiesTaken: cur.citiesTaken + (patch.citiesTaken ?? 0),
          };
        };
        const bumpDeeds = (id: string, patch: Partial<import('../types').HeroicDeeds>) => {
          const cur = deeds[id] ?? createDeeds(id);
          deeds[id] = { ...cur, ...Object.fromEntries(
            Object.entries(patch).map(([k, v]) => [k, ((cur[k as keyof typeof cur] as number) ?? 0) + (v as number)]),
          ) } as import('../types').HeroicDeeds;
          if (patch.killsTroops || patch.captured || patch.citiesTaken) {
            bumpSeasonBattle(id, {
              killsTroops: patch.killsTroops,
              captured: patch.captured,
              citiesTaken: patch.citiesTaken,
            });
          }
        };
        const enemyLosses = winner === 'attacker' ? tb.defenderLosses : winner === 'defender' ? tb.attackerLosses : 0;
        for (const id of victorIds) {
          bumpDeeds(id, { battlesWon: 1, killsTroops: Math.floor(enemyLosses / victorIds.length) });
        }
        const loserIds = tb.units.filter((u) => u.side !== winner).map((u) => u.officerId);
        for (const id of loserIds) {
          bumpDeeds(id, { battlesLost: 1 });
        }
        if (captured.length > 0) {
          // The winning commander gets credit for the captures.
          const cmd = tb.units.find((u) => u.side === winner && u.isCommander);
          if (cmd) bumpDeeds(cmd.officerId, { captured: captured.length });
        }

        // 名器養成 — every weapon / armour / mount carried into this battle earns a
        // sliver of renown (人器合一): its legend grows, and so does its wielder's
        // familiarity with it. Persisted via the itemLore map + registry.
        const nextItemLore = accrueWeaponLore(
          state.itemLore,
          participantIds.map((id) => officers[id]?.equipment ?? []),
        );
        setLoreRegistry(nextItemLore);
        set({ itemLore: nextItemLore });

        // Save replay (snapshot of final battle state only — turn-by-turn would
        // require more plumbing, so we record the end state.).
        const force = winner === 'attacker' ? tb.attackerForceId : tb.defenderForceId;
        // Capped — replays carry per-turn snapshot trails now; an uncapped
        // list (persisted on every set()) eventually torpedoes localStorage.
        const replays = [...state.battleReplays, {
          id: `replay-${tb.id}`,
          cityId: tb.cityId,
          cityName: state.cities[tb.cityId]?.name ?? { zh: '?', en: '?' },
          year: state.date.year,
          season: state.date.season,
          attackerForceName: tb.attackerForceId ? state.forces[tb.attackerForceId]?.name : undefined,
          defenderForceName: tb.defenderForceId ? state.forces[tb.defenderForceId]?.name : undefined,
          finalBattle: tb,
          // The per-turn trail captured during play, closed out by the final state.
          snapshots: [...state.currentBattleSnapshots.filter((s2) => s2.id === tb.id), tb],
        }].slice(-10);
        void force;

        // Apply officer fates. 不會戰死 — fallen officers are taken captive
        // instead of slain.
        const spareTheFallen = state.noBattleDeath ?? false;
        for (const id of dead) {
          const o = officers[id];
          if (o) {
            officers[id] = spareTheFallen
              ? { ...o, status: 'imprisoned', forceId: null, task: null }
              : { ...o, status: 'dead', forceId: null, task: null };
          }
        }
        for (const id of captured) {
          const o = officers[id];
          if (o) {
            // 失威 — capture is a humiliation: dock 威望 and mark disgrace (招牌 suppressed).
            officers[id] = {
              ...o, status: 'imprisoned', forceId: null, task: null,
              renown: Math.max(0, (o.renown ?? 0) - 2),
              disgrace: Math.max(o.disgrace ?? 0, 2),
            };
          }
        }

        // 馳援 — relief columns return home with their survivors (refunded
        // in full if the battle ended before they arrived). Their losses
        // belong to the relief city, not the besieged one.
        let reliefLosses = 0;
        if (tb.reliefPlans?.length) {
          for (const plan of tb.reliefPlans) {
            const unit = tb.units.find((u) => u.officerId === plan.officerId && u.id.includes('-reinforce-'));
            const back = unit ? Math.max(0, unit.troops) : plan.troops;
            if (unit) reliefLosses += Math.max(0, plan.troops - Math.max(0, unit.troops));
            const home = cities[plan.cityId];
            if (home) cities[plan.cityId] = { ...home, troops: home.troops + back };
            const o = officers[plan.officerId];
            if (o && o.status !== 'dead' && o.status !== 'imprisoned') {
              officers[plan.officerId] = { ...o, locationCityId: plan.cityId, task: null, status: 'idle' };
            }
          }
        }

        // Apply troop losses to the source/target cities (siege only — a
        // field battle's casualties write back to the armies below).
        const target = cities[tb.cityId];
        if (target && !tb.field) {
          // Defender losses are taken from target city — minus what the
          // relief columns bled (those came out of their home garrisons).
          cities[tb.cityId] = {
            ...target,
            troops: Math.max(0, target.troops - Math.max(0, tb.defenderLosses - reliefLosses)),
          };
        }

        // Winner gets loot deposited in their force's capital.
        if (winner && lootGold > 0) {
          const winnerForceId =
            winner === 'attacker' ? tb.attackerForceId : tb.defenderForceId;
          const winnerForce = winnerForceId ? state.forces[winnerForceId] : null;
          if (winnerForce) {
            const cap = cities[winnerForce.capitalCityId];
            if (cap) {
              cities[winnerForce.capitalCityId] = { ...cap, gold: cap.gold + lootGold };
            }
          }
        }

        // ── Field battle writeback (亲征野战) — casualties to the two armies,
        // the routed army removed, no city changes hands. ──
        let nextArmies = state.armies;
        let nextFieldPending = state.pendingCommands;
        if (tb.field) {
          const armies = { ...state.armies };
          const pending = { ...state.pendingCommands };
          const survivorsOf = (side: 'attacker' | 'defender') =>
            tb.units.filter((u) => u.side === side).reduce((s, u) => s + Math.max(0, u.troops), 0);
          const cmdAlive = (side: 'attacker' | 'defender') =>
            tb.units.some((u) => u.side === side && u.isCommander && u.troops > 0);
          const resolveArmy = (armyId: EntityId | undefined, side: 'attacker' | 'defender') => {
            if (!armyId) return;
            const army = armies[armyId];
            if (!army) return;
            const survivors = survivorsOf(side);
            const routed = (winner && winner !== side) || !cmdAlive(side) || survivors <= 0;
            if (routed) {
              // Column broken — remove it; free any officers not slain/taken.
              delete armies[armyId];
              delete pending[armyId];
              for (const id of [army.commanderId, ...army.companionIds]) {
                const o = officers[id];
                if (o && o.status !== 'dead' && o.status !== 'imprisoned') {
                  officers[id] = { ...o, task: null, status: 'idle' };
                }
              }
            } else {
              // Bloodied but intact — carry on with the survivors.
              armies[armyId] = { ...army, troops: survivors };
              const cmd = pending[armyId];
              if (cmd && cmd.type === 'march') pending[armyId] = { ...cmd, troops: survivors };
            }
          };
          resolveArmy(tb.attackerArmyId, 'attacker');
          resolveArmy(tb.defenderArmyId, 'defender');
          nextArmies = armies;
          nextFieldPending = pending;
        }

        // 守城戰 — assault repelled: surviving besiegers stream back to
        // their home city, their officers stand down there.
        if (tb.siegeDefenseSourceCityId && winner === 'defender') {
          const homeId = tb.siegeDefenseSourceCityId;
          const home = cities[homeId];
          const survivors = tb.units
            .filter((u) => u.side === 'attacker')
            .reduce((s, u) => s + Math.max(0, u.troops), 0);
          if (home) cities[homeId] = { ...home, troops: home.troops + survivors };
          for (const u of tb.units.filter((u) => u.side === 'attacker')) {
            const o = officers[u.officerId];
            if (o && o.status !== 'dead' && o.status !== 'imprisoned') {
              officers[u.officerId] = { ...o, locationCityId: homeId, task: null, status: 'idle' };
            }
          }
        }

        // If attacker won, city falls (taken with attacker's surviving troops).
        if (winner === 'attacker' && target && !tb.field) {
          const attackerCmd = tb.units.find((u) => u.side === 'attacker' && u.isCommander);
          if (attackerCmd) {
            const survivingTroops = tb.units
              .filter((u) => u.side === 'attacker')
              .reduce((s, u) => s + u.troops, 0);
            // 兵燹 — the storm costs the city a fifth of its people; some flee
            // as 流民 to an adjacent city still held by the former owner.
            const formerOwner = target.ownerForceId;
            const popLoss = conquestPopulationLoss(cities[tb.cityId].population);
            cities[tb.cityId] = {
              ...cities[tb.cityId],
              ownerForceId: tb.attackerForceId,
              troops: survivingTroops,
              population: popLoss.survivors,
              loyalty: Math.max(20, Math.floor(target.loyalty * 0.5)),
            };
            if (popLoss.refugees > 0 && formerOwner) {
              const haven = (cities[tb.cityId].adjacentCityIds ?? []).find(
                (cid) => cities[cid] && cities[cid].ownerForceId === formerOwner && !cities[cid].ruined,
              );
              if (haven) {
                cities[haven] = { ...cities[haven], population: cities[haven].population + popLoss.refugees };
              }
            }
            bumpDeeds(attackerCmd.officerId, { citiesTaken: 1 });
            // Chronicle the conquest (interactive sieges bypass endSeason's scan).
            {
              const f = tb.attackerForceId ? state.forces[tb.attackerForceId] : null;
              const cn = state.cities[tb.cityId]?.name;
              if (f && cn) {
                chronicleAppend.push({
                  year: state.date.year, season: state.date.season,
                  zh: `${f.name.zh}攻陷${cn.zh}`, en: `${f.name.en} took ${cn.en}`, kind: 'conquest',
                });
              }
            }
            // Career milestone: career officer took a city.
            if (state.careerMode?.officerId === attackerCmd.officerId) {
              const cityName = state.cities[tb.cityId]?.name ?? { zh: '?', en: '?' };
              careerMilestones.push({
                title: { zh: `${cityName.zh}陥落`, en: `Took ${cityName.en}` },
                year: state.date.year,
                season: state.date.season,
              });
            }
            // Move all attacker officers to the conquered city.
            for (const u of tb.units.filter((u) => u.side === 'attacker')) {
              const o = officers[u.officerId];
              if (o && o.status !== 'dead' && o.status !== 'imprisoned') {
                officers[u.officerId] = {
                  ...o,
                  locationCityId: tb.cityId,
                  task: null,
                };
              }
            }
          }
        }

        // If a battle happened and the career officer participated, record it.
        if (state.careerMode && tb.units.some((u) => u.officerId === state.careerMode!.officerId)) {
          const cityName = state.cities[tb.cityId]?.name ?? { zh: '?', en: '?' };
          if (winner) {
            const playerSide =
              tb.attackerForceId === state.playerForceId ? 'attacker' : 'defender';
            const won = winner === playerSide;
            careerMilestones.push({
              title: won
                ? { zh: `${cityName.zh}之戰勝`, en: `Victory at ${cityName.en}` }
                : { zh: `${cityName.zh}敗北`, en: `Defeat at ${cityName.en}` },
              year: state.date.year,
              season: state.date.season,
            });
          }
        }
        let careerMode = state.careerMode && careerMilestones.length > 0
          ? { ...state.careerMode, milestones: [...state.careerMode.milestones, ...careerMilestones] }
          : state.careerMode;

        // Roguelike — career officer death.
        if (state.roguelikeMode && state.careerMode) {
          const careerOff = officers[state.careerMode.officerId];
          if (careerOff?.status === 'dead') {
            // Bump cross-run counter, then exit career mode.
            let ach = loadAchievementProgress();
            ach = bumpCounters(ach, { careerRuns: 1 });
            saveAchievementProgress(ach);
            // 蓋棺論定 — a closing epilogue summing up the life that just ended.
            const d = state.deeds[state.careerMode.officerId];
            const st = careerStanding(d);
            const epilogue =
              `${careerOff.name.zh} 的一代記就此落幕 — 終為${st.status.zh}(品 ${st.rank})。\n` +
              `歷戰勝 ${d?.battlesWon ?? 0}・殲敵 ${(d?.killsTroops ?? 0).toLocaleString()}・拔城 ${d?.citiesTaken ?? 0}・單挑勝 ${d?.duelsWon ?? 0}。\n\n` +
              `${careerOff.name.en} has fallen — they died as ${st.status.en}. The campaign ends here. (Roguelike run #${ach.counters.careerRuns})`;
            alert(epilogue);
            careerMode = null;
          }
        }

        // Campaign stats updates.
        const newStats = { ...state.campaignStats };
        newStats.totalBattles = (newStats.totalBattles ?? 0) + 1;
        const battleTotalTroops =
          tb.units.reduce((s, u) => s + u.maxTroops, 0);
        if (
          !newStats.biggestBattle ||
          tb.attackerLosses + tb.defenderLosses > 0 &&
            (newStats.biggestBattle.attackerTroops + newStats.biggestBattle.defenderTroops) <
              battleTotalTroops
        ) {
          newStats.biggestBattle = {
            cityId: tb.cityId,
            year: state.date.year,
            season: state.date.season,
            attackerTroops: tb.units.filter((u) => u.side === 'attacker').reduce((s, u) => s + u.maxTroops, 0),
            defenderTroops: tb.units.filter((u) => u.side === 'defender').reduce((s, u) => s + u.maxTroops, 0),
          };
        }
        if (!newStats.longestSiege || newStats.longestSiege.turns < tb.turn) {
          newStats.longestSiege = { cityId: tb.cityId, turns: tb.turn };
        }
        const totalCasualties = tb.attackerLosses + tb.defenderLosses;
        if (!newStats.worstCasualties || newStats.worstCasualties.troopsLost < totalCasualties) {
          newStats.worstCasualties = { cityId: tb.cityId, troopsLost: totalCasualties };
        }
        // Top conqueror by total cities taken.
        const sortedByCity = Object.values(deeds).sort((a, b) => b.citiesTaken - a.citiesTaken);
        if (sortedByCity[0] && (!newStats.topOfficerByCities || newStats.topOfficerByCities.count < sortedByCity[0].citiesTaken)) {
          newStats.topOfficerByCities = { officerId: sortedByCity[0].officerId, count: sortedByCity[0].citiesTaken };
        }

        // Achievement triggers for this battle.
        let ach = loadAchievementProgress();
        const newlyAch: string[] = [];
        const recordTrigger = (kind: 'defeat-officer' | 'capture-city' | 'duel-won-vs', targetId: string) => {
          const r = processTrigger(ach, { kind, targetId });
          ach = r.progress;
          newlyAch.push(...r.newlyUnlocked);
        };
        for (const id of dead) recordTrigger('defeat-officer', id);
        if (winner === 'attacker' && !tb.field) {
          recordTrigger('capture-city', tb.cityId);
        }
        // Cumulative kills (loser's troop loss).
        const enemyLossesForCounters = winner === 'attacker' ? tb.defenderLosses : winner === 'defender' ? tb.attackerLosses : 0;
        if (enemyLossesForCounters > 0) {
          ach = bumpCounters(ach, { kills: enemyLossesForCounters });
        }
        if (winner) ach = bumpCounters(ach, { battlesWon: 1 });
        const cum = checkCumulativeThresholds(ach);
        ach = cum.progress;
        newlyAch.push(...cum.newlyUnlocked);
        saveAchievementProgress(ach);

        // Grant any newly-earned deed-titles from this battle's deed bumps.
        const titleGrant = grantDeedTitles(deeds, officers);

        // ③ 戰局因果流 — an interactively-fought battle leaves a scar on the
        // strategic map at its real location, so returning to the world view
        // shows where you just fought (decays over 2 seasons like field marks).
        const markPos = tb.geoAnchor
          ?? (() => { const c = state.cities[tb.cityId]; return c ? cityPos(c) : null; })();
        const atkWon = tb.winner === 'attacker';
        const winFid = atkWon ? tb.attackerForceId : tb.defenderForceId;
        const battleSiteMarks = markPos
          ? [...state.fieldBattleMarks, {
              x: markPos.x, y: markPos.y, kind: 'clash' as const, seasonsLeft: 2,
              aColor: (tb.attackerForceId && state.forces[tb.attackerForceId]?.color) || undefined,
              bColor: (tb.defenderForceId && state.forces[tb.defenderForceId]?.color) || undefined,
              winner: (atkWon ? -1 : 1) as -1 | 1,
              winName: (winFid && state.forces[winFid]?.name.zh) || undefined,
              aTroops: tb.startTroops?.attacker,
              bTroops: tb.startTroops?.defender,
            }].slice(-40)
          : state.fieldBattleMarks;

        set({
          officers: titleGrant.officers,
          cities,
          armies: nextArmies,
          pendingCommands: nextFieldPending,
          fieldBattleMarks: battleSiteMarks,
          currentBattleSnapshots: [],
          tacticalBattle: null,
          deeds: titleGrant.deeds,
          battleReplays: replays,
          careerMode,
          campaignStats: newStats,
          recentAchievementUnlocks: [...state.recentAchievementUnlocks, ...newlyAch],
          recentDeedTitles: [...state.recentDeedTitles, ...titleGrant.grants],
          seasonBattleDeltas: nextSeasonBattle,
          chronicle: chronicleAppend.length > 0
            ? [...(state.chronicle ?? []), ...chronicleAppend].slice(0, 240)
            : state.chronicle,
        });
      },

      queueEspionage: (kind, agentOfficerId, targetForceId, targetCityId, targetOfficerId, targetOfficerId2) => {
        const state = get();
        const def = ESPIONAGE_DEFS_BY_KIND[kind];
        const agent = state.officers[agentOfficerId];
        if (!def || !agent) return { ok: false, reason: 'invalid' };
        if (agent.forceId !== state.playerForceId)
          return { ok: false, reason: 'not your officer' };
        if (agent.task) return { ok: false, reason: 'officer is busy' };
        if (agent.stats.intelligence < def.minIntelligence)
          return { ok: false, reason: `requires INT ${def.minIntelligence}` };
        if (def.targetsOfficer && !targetOfficerId)
          return { ok: false, reason: 'needs a target officer' };
        if (kind === 'sow-discord' && (!targetOfficerId2 || targetOfficerId2 === targetOfficerId))
          return { ok: false, reason: 'needs two distinct target officers' };
        if (!def.targetsOfficer && !targetCityId)
          return { ok: false, reason: 'needs a target city' };

        // Pay gold from agent's city.
        const city = agent.locationCityId ? state.cities[agent.locationCityId] : null;
        if (!city || city.gold < def.goldCost)
          return { ok: false, reason: `need ${def.goldCost}g at ${city?.name.en ?? 'agent city'}` };

        // Lock the officer for the season.
        const op = {
          id: `esp-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
          kind,
          agentOfficerId,
          targetForceId,
          targetCityId,
          targetOfficerId,
          targetOfficerId2,
          issuedYear: state.date.year,
          issuedSeason: state.date.season,
        };
        set({
          pendingEspionage: [...state.pendingEspionage, op],
          cities: {
            ...state.cities,
            [city.id]: { ...city, gold: city.gold - def.goldCost },
          },
          officers: {
            ...state.officers,
            [agentOfficerId]: { ...agent, task: 'search' },
          },
        });
        return { ok: true };
      },

      cancelEspionage: (opId) => {
        const state = get();
        const op = state.pendingEspionage.find((o) => o.id === opId);
        if (!op) return;
        const agent = state.officers[op.agentOfficerId];
        set({
          pendingEspionage: state.pendingEspionage.filter((o) => o.id !== opId),
          officers: agent
            ? {
                ...state.officers,
                [op.agentOfficerId]: { ...agent, task: null },
              }
            : state.officers,
        });
      },

      plantSpy: (agentOfficerId, targetCityId) => {
        const state = get();
        if (!state.playerForceId) return { ok: false, reason: 'no force' };
        const agent = state.officers[agentOfficerId];
        if (!agent) return { ok: false, reason: 'invalid' };
        if (agent.forceId !== state.playerForceId) return { ok: false, reason: 'not your officer' };
        if (agent.status !== 'idle' && agent.status !== 'active') return { ok: false, reason: 'officer unavailable' };
        if (agent.task) return { ok: false, reason: 'officer is busy' };
        if (state.embeddedSpies.some((s) => s.agentOfficerId === agentOfficerId))
          return { ok: false, reason: 'already undercover' };
        const target = state.cities[targetCityId];
        if (!target || !target.ownerForceId || target.ownerForceId === state.playerForceId)
          return { ok: false, reason: 'must target an enemy city' };
        const origin = agent.locationCityId ? state.cities[agent.locationCityId] : null;
        if (!origin || origin.ownerForceId !== state.playerForceId)
          return { ok: false, reason: 'agent must be in one of your cities' };
        if (origin.gold < PLANT_SPY_COST)
          return { ok: false, reason: `need ${PLANT_SPY_COST}g at ${origin.name.en}` };
        set({
          embeddedSpies: [
            ...state.embeddedSpies,
            {
              id: `spy-${agentOfficerId}`,
              agentOfficerId,
              targetCityId,
              originCityId: origin.id,
              targetForceId: target.ownerForceId,
              plantedYear: state.date.year,
              exposure: 0,
            },
          ],
          cities: { ...state.cities, [origin.id]: { ...origin, gold: origin.gold - PLANT_SPY_COST } },
          officers: { ...state.officers, [agentOfficerId]: { ...agent, task: null, locationCityId: targetCityId } },
        });
        return { ok: true };
      },

      recallSpy: (spyId) => {
        const state = get();
        const spy = state.embeddedSpies.find((s) => s.id === spyId);
        if (!spy) return;
        const agent = state.officers[spy.agentOfficerId];
        let home: City | null = state.cities[spy.originCityId] ?? null;
        if (!home || home.ownerForceId !== state.playerForceId) {
          home = Object.values(state.cities).find((c) => c.ownerForceId === state.playerForceId) ?? null;
        }
        set({
          embeddedSpies: state.embeddedSpies.filter((s) => s.id !== spyId),
          officers: agent
            ? {
                ...state.officers,
                [spy.agentOfficerId]: { ...agent, status: 'idle', task: null, locationCityId: home ? home.id : agent.locationCityId },
              }
            : state.officers,
        });
      },

      issueEdict: (kind, targetForceId) => {
        const state = get();
        const def = EDICTS_BY_KIND[kind];
        if (!def) return { ok: false, reason: 'invalid edict' };
        // 奉迎天子 — the custodian of the Son of Heaven issues edicts at a
        // 30% discount: the seal is the emperor's, the cost is optics.
        const holdsEmperor = emperorCustodian(get().cities, get().emperorCityId) === get().playerForceId;
        const edictCost = Math.round(def.goldCost * (holdsEmperor ? EDICT_DISCOUNT : 1));
        if (!state.playerForceId) return { ok: false, reason: 'no player force' };

        const force = state.forces[state.playerForceId];
        if (!force) return { ok: false, reason: 'no force' };
        const rank = force.imperialRank ?? 'commoner';
        const minRankDef = IMPERIAL_RANKS_BY_ID[def.minRank];
        const curRankDef = IMPERIAL_RANKS_BY_ID[rank];
        if (!minRankDef || !curRankDef || curRankDef.tier < minRankDef.tier)
          return { ok: false, reason: `requires ${minRankDef?.name.en ?? def.minRank}` };

        const cd = state.edictCooldowns[kind];
        if (cd) {
          const seasonOrder: Record<string, number> = { spring: 0, summer: 1, autumn: 2, winter: 3 };
          const cdAbs = cd.year * 4 + seasonOrder[cd.season];
          const nowAbs = state.date.year * 4 + seasonOrder[state.date.season];
          if (cdAbs > nowAbs)
            return { ok: false, reason: 'still on cooldown' };
        }

        const capital = state.cities[force.capitalCityId];
        if (!capital || capital.gold < edictCost)
          return { ok: false, reason: `need ${edictCost}g at capital` };

        const updates: Partial<typeof state> = {};
        let message: string | undefined;

        if (kind === 'tax-amnesty') {
          const cities = { ...state.cities };
          for (const c of Object.values(cities)) {
            if (c.ownerForceId === state.playerForceId) {
              cities[c.id] = { ...c, loyalty: Math.min(100, c.loyalty + 10) };
            }
          }
          cities[capital.id] = { ...cities[capital.id], gold: cities[capital.id].gold - edictCost };
          updates.cities = cities;
          message = 'Grand amnesty proclaimed. Loyalty +10 across the realm.';
        } else if (kind === 'denounce' && targetForceId) {
          const cities = { ...state.cities };
          cities[capital.id] = { ...capital, gold: capital.gold - edictCost };
          const officers = { ...state.officers };
          for (const o of Object.values(officers)) {
            if (o.forceId === targetForceId) {
              officers[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - 5) };
            }
          }
          updates.cities = cities;
          updates.officers = officers;
          // 桃园誓师式的「逆贼」标记：相对该势力作战 +10% power，持续 8 季。
          const expiresAbs = state.date.year * 4 + ['spring', 'summer', 'autumn', 'winter'].indexOf(state.date.season) + 8;
          const expiresYear = Math.floor(expiresAbs / 4);
          const expiresSeason = (['spring', 'summer', 'autumn', 'winter'] as const)[expiresAbs % 4];
          updates.casusBelliMarks = [
            ...state.casusBelliMarks.filter(
              (m) => !(m.byForceId === state.playerForceId && m.targetForceId === targetForceId),
            ),
            { byForceId: state.playerForceId!, targetForceId, expiresYear, expiresSeason },
          ];
          const target = state.forces[targetForceId];
          message = `${target?.name.en ?? 'Target'} denounced. Their officers lose 5 loyalty. Combat power +10% vs them for 8 seasons.`;
        } else if (kind === 'era-change') {
          // 改元：全国 +5 城忠诚 + 所有诏令冷却清零
          const cities = { ...state.cities };
          for (const c of Object.values(cities)) {
            if (c.ownerForceId === state.playerForceId) {
              cities[c.id] = { ...c, loyalty: Math.min(100, c.loyalty + 5) };
            }
          }
          cities[capital.id] = { ...cities[capital.id], gold: cities[capital.id].gold - edictCost };
          updates.cities = cities;
          updates.edictCooldowns = {}; // wipe all cooldowns
          message = 'A new era is proclaimed. Loyalty +5; all edict cooldowns reset.';
        } else if (kind === 'reward-merit') {
          // 賞功：选武功榜分最高的本国武将，+15 忠诚 + 一个特殊 deed-title
          const cities = { ...state.cities };
          cities[capital.id] = { ...capital, gold: capital.gold - edictCost };
          updates.cities = cities;
          let bestId: EntityId | null = null;
          let bestScore = 0;
          for (const o of Object.values(state.officers)) {
            if (o.forceId !== state.playerForceId) continue;
            if (o.status === 'dead' || o.status === 'imprisoned') continue;
            const d = state.deeds[o.id];
            if (!d) continue;
            const score = d.killsTroops / 100 + d.duelsWon * 5 + d.captured * 8 +
              d.citiesTaken * 15 + d.espionageSuccess * 4 + d.civicWorks * 1 + d.battlesWon * 3;
            if (score > bestScore) { bestScore = score; bestId = o.id; }
          }
          if (!bestId) {
            return { ok: false, reason: '尚無功業可賞。' };
          }
          const honored = state.officers[bestId];
          const honoredDeed = state.deeds[bestId] ?? { titles: [] };
          updates.officers = {
            ...state.officers,
            [bestId]: { ...honored, loyalty: Math.min(100, honored.loyalty + 15) },
          };
          updates.deeds = {
            ...state.deeds,
            [bestId]: { ...honoredDeed, officerId: bestId, titles: [...(honoredDeed.titles ?? []), 'royal-honor'] } as import('../types').HeroicDeeds,
          };
          message = `${honored.name.en} is honored at court — +15 loyalty.`;
        } else if (kind === 'call-for-talent') {
          // 求贤令：下一季 recruit ×1.5
          const cities = { ...state.cities };
          cities[capital.id] = { ...capital, gold: capital.gold - edictCost };
          updates.cities = cities;
          updates.recruitBonusSeasons = {
            ...state.recruitBonusSeasons,
            [state.playerForceId!]: { multiplier: 1.5, seasonsLeft: 1 },
          };
          message = 'A call for sages goes out. Next season recruit ×1.5.';
        } else if (kind === 'self-deprecation') {
          // 罪己诏：mandate −5 换全国 +15 忠诚
          const cities = { ...state.cities };
          for (const c of Object.values(cities)) {
            if (c.ownerForceId === state.playerForceId) {
              cities[c.id] = { ...c, loyalty: Math.min(100, c.loyalty + 15) };
            }
          }
          updates.cities = cities;
          const mandateForForce = state.mandate.byForce[state.playerForceId!] ?? 50;
          updates.mandate = {
            ...state.mandate,
            byForce: {
              ...state.mandate.byForce,
              [state.playerForceId!]: Math.max(0, mandateForForce - 5),
            },
          };
          message = 'You shoulder the blame. Mandate −5; loyalty +15 throughout the realm.';
        } else if (kind === 'declare-vassal' && targetForceId) {
          const forces = { ...state.forces };
          const target = forces[targetForceId];
          if (target) {
            forces[targetForceId] = { ...target, vassalOfForceId: state.playerForceId };
            updates.forces = forces;
            message = `${target.name.en} bestowed vassalage.`;
          }
        } else if (kind === 'levy-tribute' && targetForceId) {
          const targetForce = state.forces[targetForceId];
          if (targetForce?.vassalOfForceId === state.playerForceId) {
            const cities = { ...state.cities };
            const vCap = cities[targetForce.capitalCityId];
            const tribute = Math.min(vCap.gold, 800);
            if (vCap && tribute > 0) {
              cities[targetForce.capitalCityId] = { ...vCap, gold: vCap.gold - tribute };
              cities[capital.id] = { ...capital, gold: capital.gold - edictCost + tribute };
              updates.cities = cities;
              message = `Levied ${tribute}g tribute from ${targetForce.name.en}.`;
            } else {
              message = `${targetForce.name.en} has no gold to pay.`;
            }
          } else {
            return { ok: false, reason: 'target is not your vassal' };
          }
        } else if (kind === 'enthronement') {
          const forces = { ...state.forces };
          forces[state.playerForceId] = { ...force, imperialRank: 'emperor' as ImperialRank };
          const officers = { ...state.officers };
          const playerId = state.playerForceId;
          // All non-vassal force officers lose loyalty (toward you).
          for (const o of Object.values(officers)) {
            if (o.forceId && o.forceId !== playerId) {
              const otherForce = forces[o.forceId];
              if (!otherForce || otherForce.vassalOfForceId !== playerId) {
                officers[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - 10) };
              }
            }
          }
          const cities = { ...state.cities };
          cities[capital.id] = { ...capital, gold: capital.gold - edictCost };
          updates.forces = forces;
          updates.officers = officers;
          updates.cities = cities;
          // Auto-grant 丞相 to the new emperor's ruler if vacant. (帝即位
          // 必有相輔。) Bypasses cooldowns / refusals — imperial fiat.
          const ruler = officers[force.rulerOfficerId];
          const hasChancellor = state.appointments.some(
            (a) => a.forceId === playerId && a.titleId === 'chancellor',
          );
          if (ruler && !hasChancellor) {
            const chancellorDef = CIVIC_TITLES_BY_ID['chancellor'];
            const excludes = new Set<string>(['chancellor', ...(chancellorDef?.excludes ?? [])]);
            const filteredAppts = state.appointments.filter(
              (a) => !(a.forceId === playerId && (a.officerId === ruler.id || excludes.has(a.titleId))),
            );
            updates.appointments = [
              ...filteredAppts,
              {
                officerId: ruler.id,
                forceId: playerId,
                titleId: 'chancellor',
                appointedYear: state.date.year,
                appointedSeason: state.date.season,
              },
            ];
            updates.appointmentHistory = [
              ...state.appointmentHistory,
              {
                kind: 'appoint', year: state.date.year, season: state.date.season,
                officerId: ruler.id, forceId: playerId, titleId: 'chancellor',
              },
            ];
          }
          updates.eventFlags = {
            ...state.eventFlags,
            ['enthroned-' + state.playerForceId]: true,
          };
          message = 'You have proclaimed yourself Emperor. All non-vassal rivals lose 10 loyalty.';
        }

        const issued = {
          id: `edict-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
          kind,
          issuingForceId: state.playerForceId,
          targetForceId,
          issuedYear: state.date.year,
          issuedSeason: state.date.season,
        };
        // 天命 modifier on cooldown: low mandate (<30) adds +1 season,
        // high mandate (>70) shaves 1 off (min 1). Era-change ignores
        // since it already resets every cooldown.
        const playerMandate = state.mandate.byForce[state.playerForceId] ?? 50;
        let cooldownSeasons = def.cooldownSeasons;
        if (kind !== 'era-change') {
          if (playerMandate < 30) cooldownSeasons += 1;
          else if (playerMandate > 70) cooldownSeasons = Math.max(1, cooldownSeasons - 1);
        }
        const nextSeason = nextSeasonAfter(state.date, cooldownSeasons);
        set({
          ...updates,
          edictHistory: [...state.edictHistory, issued],
          edictCooldowns: kind === 'era-change'
            ? { [kind]: nextSeason }
            : {
                ...state.edictCooldowns,
                [kind]: nextSeason,
              },
        });
        return { ok: true, message };
      },

      promoteImperialRank: (forceId, rank) => {
        const state = get();
        const force = state.forces[forceId];
        if (!force) return { ok: false, reason: 'invalid force' };
        const check = canPromoteToRank(
          rank,
          force,
          state.cities,
          state.appointments,
          state.date.year,
          state.eventFlags,
        );
        if (!check.ok) return { ok: false, reason: check.reason };
        set({
          forces: {
            ...state.forces,
            [forceId]: { ...force, imperialRank: rank },
          },
        });
        return { ok: true };
      },

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setMusicTrack: (track) => set({ musicTrack: track }),
      setLanguage: (lang) => set({ language: lang }),
      setPlacementMode: (mode) => set({ placementMode: mode }),
      setEnabledDynasties: (dynasties) => set({ enabledDynasties: dynasties }),
      setFogOfWar: (on) => set({ fogOfWar: on }),
      setTaxPolicy: (forceId, rate) => set((s) => ({ taxPolicy: { ...s.taxPolicy, [forceId]: rate } })),

      saveCommandTemplate: (label) => {
        const state = get();
        // Snapshot current pending commands as a template.
        const commands = Object.values(state.pendingCommands)
          .filter((c) => c.type !== 'march')
          .map((c) => ({ cityId: c.cityId, type: c.type as import('../types').InternalAffairsType }));
        if (commands.length === 0) return;
        set({
          commandTemplates: [
            ...state.commandTemplates,
            { id: `tmpl-${Date.now()}`, label, commands },
          ],
        });
      },
      applyCommandTemplate: (id) => {
        const state = get();
        const tmpl = state.commandTemplates.find((t) => t.id === id);
        if (!tmpl || !state.playerForceId) return;
        // Apply each command via issueCommand (which validates).
        for (const c of tmpl.commands) {
          const city = state.cities[c.cityId];
          if (!city || city.ownerForceId !== state.playerForceId) continue;
          // Find an idle officer in the city to assign the command to.
          const officer = Object.values(state.officers).find(
            (o) =>
              o.locationCityId === c.cityId &&
              o.forceId === state.playerForceId &&
              o.status === 'idle' &&
              !o.task,
          );
          if (officer) {
            get().issueCommand(c.cityId, c.type, officer.id);
          }
        }
      },
      deleteCommandTemplate: (id) =>
        set({ commandTemplates: get().commandTemplates.filter((t) => t.id !== id) }),

      setAutoBuildQueue: (cityId, queue) => {
        const state = get();
        const next = { ...state.autoBuildQueues };
        if (queue.length === 0) delete next[cityId];
        else next[cityId] = queue;
        set({ autoBuildQueues: next });
      },

      acceptDialogue: (choiceIdx) => {
        const state = get();
        const dlg = state.pendingDialogue;
        if (!dlg) return;
        const choice = dlg.choices[choiceIdx];
        if (!choice) return;
        // Apply effects.
        let officers = { ...state.officers };
        let cities = { ...state.cities };
        let eventFlags = state.eventFlags;
        const playerCapital = state.playerForceId
          ? state.forces[state.playerForceId]?.capitalCityId
          : null;
        for (const eff of choice.effects) {
          if (eff.kind === 'gold' && playerCapital) {
            const c = cities[playerCapital];
            if (c) cities[playerCapital] = { ...c, gold: Math.max(0, c.gold + eff.delta) };
          } else if (eff.kind === 'loyalty' && officers[eff.officerId]) {
            const o = officers[eff.officerId];
            officers[eff.officerId] = {
              ...o,
              loyalty: Math.max(0, Math.min(100, o.loyalty + eff.delta)),
            };
          } else if (eff.kind === 'city-loyalty' && cities[eff.cityId]) {
            const c = cities[eff.cityId];
            cities[eff.cityId] = {
              ...c,
              loyalty: Math.max(0, Math.min(100, c.loyalty + eff.delta)),
            };
          } else if (eff.kind === 'food' && eff.cityId && cities[eff.cityId]) {
            const c = cities[eff.cityId];
            cities[eff.cityId] = { ...c, food: Math.max(0, c.food + eff.delta) };
          } else if (eff.kind === 'troops' && eff.cityId && cities[eff.cityId]) {
            const c = cities[eff.cityId];
            cities[eff.cityId] = { ...c, troops: Math.max(0, c.troops + eff.delta) };
          } else if (eff.kind === 'set-flag') {
            if (eventFlags === state.eventFlags) eventFlags = { ...eventFlags };
            eventFlags[eff.flag] = true;
          }
          // Other effects: noop here, just flavor.
        }
        // Queue a branching follow-up if the choice has one.
        const dialogueFollowups = choice.followupEventId
          ? [...state.dialogueFollowups, choice.followupEventId]
          : state.dialogueFollowups;
        set({ pendingDialogue: null, officers, cities, eventFlags, dialogueFollowups });
      },
      dismissDialogue: () => set({ pendingDialogue: null }),

      setBattleSpeed: (speed) => set({ battleSpeed: speed }),

      enterCareerMode: (officerId) => {
        const state = get();
        const o = state.officers[officerId];
        if (!o) return;
        set({
          careerMode: {
            officerId,
            milestones: [
              {
                title: { zh: '出仕', en: 'Began Service' },
                year: state.date.year,
                season: state.date.season,
              },
            ],
          },
        });
      },
      exitCareerMode: () => set({ careerMode: null }),

      addCareerMilestone: (title: { zh: string; en: string }) => {
        const state = get();
        if (!state.careerMode) return;
        set({
          careerMode: {
            ...state.careerMode,
            milestones: [
              ...state.careerMode.milestones,
              { title, year: state.date.year, season: state.date.season },
            ],
          },
        });
      },

      setRomanceMode: (on) => set({ romanceMode: on }),
      setRoguelikeMode: (on) => set({ roguelikeMode: on }),
      setLifespanMode: (mode) => set({ lifespanMode: mode }),
      setNoBattleDeath: (on) => set({ noBattleDeath: on }),
      setReviveDeadOfficers: (on) => set({ reviveDeadOfficers: on }),
      setAiStrength: (level) => set({ aiStrength: Math.max(1, Math.min(5, Math.round(level))) }),
      setStartHandicap: (h) => set({ startHandicap: h }),
      setVictoryGoal: (goal) => set({ victoryGoal: goal }),
      setStartTaxRate: (rate) => set({ startTaxRate: rate }),
      setStartInflation: (level) => set({ startInflation: Math.max(0, Math.min(100, Math.round(level))) }),
      setAiStartTroops: (v) => set({ aiStartTroops: v }),
      setBattleDifficulty: (d) => set({ battleDifficulty: d }),
      setLifespanLength: (l) => set({ lifespanLength: l }),
      setAgingStatLock: (on) => set({ agingStatLock: on }),
      setTalentDiscovery: (v) => set({ talentDiscovery: v }),
      setDuelFrequency: (v) => set({ duelFrequency: v }),
      setDisasterFrequency: (v) => set({ disasterFrequency: v }),
      setIronman: (on) => set({ ironman: on }),
      setNewOfficers: (v) => set({ newOfficers: v }),
      setFictionalPool: (v) => set({ fictionalPool: v }),
      setInitialDiplomacy: (v) => set({ initialDiplomacy: v }),

      forgeItem: (cityId, recipeId) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city) return { ok: false, reason: 'invalid city' };
        if (city.ownerForceId !== state.playerForceId)
          return { ok: false, reason: 'not your city' };
        // Need a foundry in the city.
        const foundry = state.buildings.find(
          (b) => b.cityId === cityId && b.id === 'foundry',
        );
        const recipe = FORGE_RECIPES_BY_ID[recipeId];
        if (!recipe) return { ok: false, reason: 'invalid recipe' };
        // 鑄法圖譜 — the blueprint must be known (basic designs are seeded; 神兵
        // blueprints are discovered via 研發, see endSeason).
        if (!(state.knownRecipes ?? STARTER_RECIPE_IDS).includes(recipeId))
          return { ok: false, reason: 'recipe not learned' };
        // 名品唯一 — a REPEATABLE recipe (empty ingredients → iron/gold only) must
        // NOT mint a second copy of a result that already exists in play, or two
        // officers could equip the same itemId and share its (itemId-keyed)
        // refine/突破/gem registries. Sacrifice recipes are naturally one-shot
        // (their unique ingredient is consumed), so they're exempt.
        const resultId = recipe.resultItemId;
        if (recipe.ingredients.length === 0
            && (state.lostItems.some((li) => li.itemId === resultId)
              || Object.values(state.officers).some((o) => o.equipment.includes(resultId))))
          return { ok: false, reason: 'already exists' };
        if (!foundry || foundry.level < recipe.minFoundryLevel)
          return { ok: false, reason: `need foundry lv${recipe.minFoundryLevel}` };
        // 鐵料配方 vs 鐵料自給.
        //  • An ironCost recipe forges from the city's iron stock as its material
        //    (renewable — not bound to the finite pool of unique weapons). Iron is
        //    required and consumed; gold is paid in full (iron IS the discount).
        //  • Otherwise the legacy path: holding ≥300 iron just shaves 30% off gold.
        const ironRecipe = (recipe.ironCost ?? 0) > 0;
        let goldCost: number;
        let ironSpend: number;
        if (ironRecipe) {
          if ((city.iron ?? 0) < recipe.ironCost!)
            return { ok: false, reason: `need ${recipe.ironCost} iron` };
          goldCost = recipe.goldCost;
          ironSpend = recipe.ironCost!;
        } else {
          const ironFed = (city.iron ?? 0) >= IRON_FORGE_COST;
          goldCost = ironFed ? Math.round(recipe.goldCost * (1 - FORGE_IRON_DISCOUNT)) : recipe.goldCost;
          ironSpend = ironFed ? IRON_FORGE_COST : 0;
        }
        if (city.gold < goldCost)
          return { ok: false, reason: 'not enough gold' };
        // Verify all ingredients are present as lost items in this city.
        const ingredientsInCity = state.lostItems.filter(
          (li) => li.cityId === cityId && recipe.ingredients.includes(li.itemId),
        );
        const have = new Set(ingredientsInCity.map((li) => li.itemId));
        if (!recipe.ingredients.every((id) => have.has(id)))
          return { ok: false, reason: 'missing ingredients' };

        // 工匠手藝 — the most capable smith stationed here presides over the forge.
        // A sharp-minded (or 巧思) master turns out a piece born pre-refined.
        const smith = Object.values(state.officers)
          .filter((o) => o.forceId === state.playerForceId && o.locationCityId === cityId && o.status !== 'dead')
          .sort((a, b) => b.stats.intelligence - a.stats.intelligence)[0];
        const armsBB = buildingBonuses(cityId, state.buildings);
        // 匠籍神品 — an iron-land's smithing tradition (宛城/巴西…) tempers a finer
        // piece: the 冶鐵 specialty lifts the masterwork (神品) chance, more so the
        // better the 名產作坊 is developed.
        const forgeSpecialtyBonus = CITY_SPECIALTY[cityId] === 'iron'
          ? 0.1 + (city.specialtyDev ?? 0) * 0.05
          : 0;
        const plus = forgeQualityPlus({
          smithIntelligence: smith?.stats.intelligence ?? 0,
          inventive: (smith?.traits ?? []).includes('inventive'),
          refineUpgradeChance: armsBB.refineUpgradeChance + forgeSpecialtyBonus,
        });

        // Consume gold, consume ingredients, place result in the lost-items pool of this city.
        const newLostItems = state.lostItems.filter((li) => {
          if (li.cityId !== cityId) return true;
          if (!recipe.ingredients.includes(li.itemId)) return true;
          // Remove only one instance (since items are unique global anyway).
          return false;
        });
        newLostItems.push({ itemId: recipe.resultItemId, cityId });
        // The forged piece is born with the smith's quality baked into 精煉.
        const itemRefinements = plus > 0
          ? { ...state.itemRefinements, [recipe.resultItemId]: Math.max(state.itemRefinements[recipe.resultItemId] ?? 0, plus) }
          : state.itemRefinements;
        if (plus > 0) setRefineRegistry(itemRefinements);
        set({
          cities: {
            ...state.cities,
            [cityId]: {
              ...city,
              gold: city.gold - goldCost,
              ...(ironSpend > 0 ? { iron: (city.iron ?? 0) - ironSpend } : {}),
            },
          },
          lostItems: newLostItems,
          itemRefinements,
        });
        return { ok: true, plus, smith: smith?.name };
      },

      dismantleItem: (cityId, itemId) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city) return { ok: false, reason: 'invalid city' };
        if (city.ownerForceId !== state.playerForceId)
          return { ok: false, reason: 'not your city' };
        const foundry = state.buildings.find((b) => b.cityId === cityId && b.id === 'foundry');
        if (!foundry || foundry.level < 1) return { ok: false, reason: 'need foundry' };
        const base = ITEMS_BY_ID[itemId];
        if (!base) return { ok: false, reason: 'invalid item' };
        // Must be a loose item sitting in this city's 藏寶池 (not equipped).
        const idx = state.lostItems.findIndex((li) => li.cityId === cityId && li.itemId === itemId);
        if (idx < 0) return { ok: false, reason: 'item not here' };
        const plus = state.itemRefinements[itemId] ?? 0;
        const { iron, gold } = dismantleYield(base, plus);
        const newLostItems = state.lostItems.filter((_, i) => i !== idx);
        // Melting it down clears ALL养成 that rode on the item — refine, 突破 AND
        // 鑲嵌 — so a later re-forge of the same id can't inherit stale upgrades.
        const itemRefinements = { ...state.itemRefinements };
        const itemBreakthroughs = { ...state.itemBreakthroughs };
        const itemGems = { ...state.itemGems };
        let touched = false;
        if (itemId in itemRefinements) { delete itemRefinements[itemId]; setRefineRegistry(itemRefinements); touched = true; }
        if (itemId in itemBreakthroughs) { delete itemBreakthroughs[itemId]; setBreakthroughRegistry(itemBreakthroughs); touched = true; }
        if (itemId in itemGems) { delete itemGems[itemId]; setGemRegistry(itemGems); touched = true; }
        // 寶石析出 — a 神兵-grade melt sometimes yields a basic gem (寶石來源).
        const GEM_DROPS = ['gem-war', 'gem-lead', 'gem-int', 'gem-pol', 'gem-cha', 'gem-warlead'];
        let gemStock = state.gemStock;
        let gemDrop: string | undefined;
        if (itemRarity(base) === 'gold' && Math.random() < 0.4) {
          gemDrop = GEM_DROPS[Math.floor(Math.random() * GEM_DROPS.length)];
          gemStock = { ...state.gemStock, [gemDrop]: (state.gemStock[gemDrop] ?? 0) + 1 };
        }
        const newIron = Math.min(IRON_CITY_CAP, (city.iron ?? 0) + iron);
        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold + gold, iron: newIron },
          },
          lostItems: newLostItems,
          ...(touched ? { itemRefinements, itemBreakthroughs, itemGems } : {}),
          gemStock,
        });
        // Report the iron actually credited (capped), not the raw yield.
        return { ok: true, iron: newIron - (city.iron ?? 0), gold, gem: gemDrop };
      },

      learnRecipe: (recipeId) => {
        const state = get();
        if (!FORGE_RECIPES_BY_ID[recipeId]) return { ok: false, reason: 'invalid recipe' };
        const known = state.knownRecipes ?? STARTER_RECIPE_IDS.slice();
        if (known.includes(recipeId)) return { ok: false, reason: 'already known' };
        set({ knownRecipes: [...known, recipeId] });
        return { ok: true };
      },

      refineItem: (itemId) => {
        const state = get();
        const base = ITEMS_BY_ID[itemId];
        if (!base) return { ok: false, reason: 'no-item' };
        const plus = state.itemRefinements[itemId] ?? 0;
        if (plus >= REFINE_MAX) return { ok: false, reason: 'maxed' };
        // Charge the city that holds the item: its wielder's city if equipped,
        // else the city its lost-item copy sits in.
        const holder = Object.values(state.officers).find(
          (o) => o.forceId === state.playerForceId && o.equipment.includes(itemId),
        );
        let city = holder?.locationCityId ? state.cities[holder.locationCityId] : undefined;
        if (!city) {
          const lost = state.lostItems.find((li) => li.itemId === itemId);
          if (lost) city = state.cities[lost.cityId];
        }
        if (!city || city.ownerForceId !== state.playerForceId) return { ok: false, reason: 'no-city' };
        // 鍛爐相助 — a foundry in the city shaves 25% off the refining cost;
        // 軍器監 (arms bureau) discounts further and may temper a bonus grade.
        const hasFoundry = state.buildings.some((b) => b.cityId === city!.id && b.id === 'foundry');
        const armsBB = buildingBonuses(city.id, state.buildings);
        const cost = Math.round(refineCost(base, plus) * (hasFoundry ? 0.75 : 1) * (1 - armsBB.refineDiscount));
        if (city.gold < cost) return { ok: false, reason: 'no-gold', cost };
        const masterwork = armsBB.refineUpgradeChance > 0
          && plus + 2 <= REFINE_MAX
          && Math.random() < armsBB.refineUpgradeChance;
        const itemRefinements = { ...state.itemRefinements, [itemId]: plus + (masterwork ? 2 : 1) };
        setRefineRegistry(itemRefinements);
        set({
          itemRefinements,
          cities: { ...state.cities, [city.id]: { ...city, gold: city.gold - cost } },
        });
        return { ok: true, cost };
      },

      // 城邑 — locate the player city that holds an item (wielder's city, else its
      // lost-item pile). Shared by 突破 / 鑲嵌.
      breakthroughItem: (itemId) => {
        const state = get();
        const base = ITEMS_BY_ID[itemId];
        if (!base) return { ok: false, reason: 'no-item' };
        // 突破 only after full 精煉 — a piece must be maxed before it can break through.
        if ((state.itemRefinements[itemId] ?? 0) < REFINE_MAX) return { ok: false, reason: 'refine-first' };
        const stars = state.itemBreakthroughs[itemId] ?? 0;
        if (stars >= BREAKTHROUGH_MAX) return { ok: false, reason: 'maxed' };
        const holder = Object.values(state.officers).find(
          (o) => o.forceId === state.playerForceId && o.equipment.includes(itemId),
        );
        let city = holder?.locationCityId ? state.cities[holder.locationCityId] : undefined;
        if (!city) {
          const lost = state.lostItems.find((li) => li.itemId === itemId);
          if (lost) city = state.cities[lost.cityId];
        }
        if (!city || city.ownerForceId !== state.playerForceId) return { ok: false, reason: 'no-city' };
        // 突破爐 — needs a foundry; consumes gold + iron (玄鐵淬煉).
        if (!state.buildings.some((b) => b.cityId === city!.id && b.id === 'foundry'))
          return { ok: false, reason: 'need-foundry' };
        const { gold, iron } = itemBreakthroughCost(base, stars);
        if (city.gold < gold) return { ok: false, reason: 'no-gold', cost: gold };
        if ((city.iron ?? 0) < iron) return { ok: false, reason: 'no-iron', iron };
        const itemBreakthroughs = { ...state.itemBreakthroughs, [itemId]: stars + 1 };
        setBreakthroughRegistry(itemBreakthroughs);
        set({
          itemBreakthroughs,
          cities: { ...state.cities, [city.id]: { ...city, gold: city.gold - gold, iron: (city.iron ?? 0) - iron } },
        });
        return { ok: true, cost: gold, iron };
      },

      socketGem: (itemId, gemId) => {
        const state = get();
        const base = ITEMS_BY_ID[itemId];
        if (!base) return { ok: false, reason: 'no-item' };
        const gem = GEMS_BY_ID[gemId];
        if (!gem) return { ok: false, reason: 'no-gem' };
        const current = state.itemGems[itemId] ?? [];
        if (current.length >= socketsFor(base)) return { ok: false, reason: 'no-socket' };
        const holder = Object.values(state.officers).find(
          (o) => o.forceId === state.playerForceId && o.equipment.includes(itemId),
        );
        let city = holder?.locationCityId ? state.cities[holder.locationCityId] : undefined;
        if (!city) {
          const lost = state.lostItems.find((li) => li.itemId === itemId);
          if (lost) city = state.cities[lost.cityId];
        }
        if (!city || city.ownerForceId !== state.playerForceId) return { ok: false, reason: 'no-city' };
        // 寶石庫存優先 — spend a stocked gem (from 熔毀 etc.) for free; else buy with gold.
        const fromStock = (state.gemStock[gemId] ?? 0) > 0;
        if (!fromStock && city.gold < gem.cost) return { ok: false, reason: 'no-gold', cost: gem.cost };
        const itemGems = { ...state.itemGems, [itemId]: [...current, gemId] };
        setGemRegistry(itemGems);
        set({
          itemGems,
          gemStock: fromStock ? { ...state.gemStock, [gemId]: state.gemStock[gemId] - 1 } : state.gemStock,
          ...(fromStock ? {} : { cities: { ...state.cities, [city.id]: { ...city, gold: city.gold - gem.cost } } }),
        });
        return { ok: true, cost: fromStock ? 0 : gem.cost };
      },

      unsocketGem: (itemId, index) => {
        const state = get();
        const current = state.itemGems[itemId] ?? [];
        if (index < 0 || index >= current.length) return { ok: false, reason: 'no-gem' };
        // 卸下寶石 — pried out and discarded (no refund); the socket reopens.
        const next = current.filter((_, i) => i !== index);
        const itemGems = { ...state.itemGems, [itemId]: next };
        setGemRegistry(itemGems);
        set({ itemGems });
        return { ok: true };
      },

      fuseGems: (gemId) => {
        const state = get();
        const out = GEM_FUSION[gemId];
        if (!out) return { ok: false, reason: 'no-recipe' };
        if ((state.gemStock[gemId] ?? 0) < GEM_FUSION_COST) return { ok: false, reason: 'no-gems' };
        // 寶石合成 — 3 of a grade → 1 of the next.
        const gemStock = {
          ...state.gemStock,
          [gemId]: (state.gemStock[gemId] ?? 0) - GEM_FUSION_COST,
          [out]: (state.gemStock[out] ?? 0) + 1,
        };
        set({ gemStock });
        return { ok: true, gem: out };
      },

      acknowledgeAchievements: () => set({ recentAchievementUnlocks: [] }),
      acknowledgeDeedTitles: () => set({ recentDeedTitles: [] }),
      acknowledgePrestige: () => set({ recentPrestige: [] }),
      acknowledgeBond: () => set((s) => ({ recentBonds: s.recentBonds.slice(1) })),
      acknowledgePrestigeCeremony: () => set((s) => ({ recentPrestigeCeremony: s.recentPrestigeCeremony.slice(1) })),
      acknowledgePromotion: () => set((s) => ({ recentPromotions: s.recentPromotions.slice(1) })),

      attackPort: (portId, attackerOfficerId, troops) => {
        const state = get();
        const port = state.ports[portId];
        if (!port) return { ok: false, message: 'Port not found.' };
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        if (port.ownerForceId === state.playerForceId)
          return { ok: false, message: 'You already own this port.' };
        // Reachability gate — must have a path (land-adjacent or sea-connected)
        const reach = canPlayerAttackPort(port, state.cities, state.ports, state.playerForceId);
        if (!reach.ok)
          return { ok: false, message: reach.reason ?? 'Cannot reach this port.' };
        const attacker = state.officers[attackerOfficerId];
        if (!attacker || attacker.forceId !== state.playerForceId)
          return { ok: false, message: 'Attacker officer must be yours.' };
        if (attacker.status !== 'idle' && attacker.status !== 'active')
          return { ok: false, message: 'Officer is not available.' };

        // Source city = the city the attacker is at (must own enough troops)
        const sourceCity = attacker.locationCityId ? state.cities[attacker.locationCityId] : null;
        if (!sourceCity)
          return { ok: false, message: 'Attacker has no current city.' };
        if (sourceCity.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'Attacker is not in your city.' };
        if (sourceCity.troops < troops || troops <= 0)
          return { ok: false, message: `Need at least ${troops} troops in ${sourceCity.name.en}.` };

        // The attacker's own city must also be a valid launching point — either
        // adjacent to the linked city (land), the linked city itself, or have
        // a port that's sea-connected to the target.
        const linkedCity = state.cities[port.linkedCityId];
        const landAdjacent = !!linkedCity && (
          linkedCity.id === sourceCity.id
          || (linkedCity.adjacentCityIds ?? []).includes(sourceCity.id)
        );
        const sourcePort = Object.values(state.ports).find(
          (p) => p.linkedCityId === sourceCity.id
            && p.ownerForceId === state.playerForceId
            && p.connectedPortIds.includes(port.id),
        );
        if (!landAdjacent && !sourcePort) {
          return {
            ok: false,
            message: `${sourceCity.name.zh} is not a valid launching point — it must neighbor ${linkedCity?.name.zh ?? port.linkedCityId} or own a sea-connected port.`,
          };
        }

        // Defender: pick the highest-WAR officer at the port's linked city
        // belonging to the port's owner force.
        const defenderOfficer = port.ownerForceId
          ? Object.values(state.officers)
              .filter((o) =>
                o.forceId === port.ownerForceId
                && o.locationCityId === port.linkedCityId
                && (o.status === 'idle' || o.status === 'active'),
              )
              .sort((a, b) => b.stats.war - a.stats.war)[0]
          : null;

        // Damage calc — atk WAR boosts, def WAR + docked ships resist
        const atkWar = attacker.stats.war;
        const atkLed = attacker.stats.leadership;
        const defWar = defenderOfficer?.stats.war ?? 30;   // neutral defenders fight at 30
        // Ship defense — sum of (count × combatStrength) of all docked ships
        const dockedShips = port.dockedShips ?? {};
        let shipDefense = 0;
        for (const [cls, count] of Object.entries(dockedShips)) {
          const def = SHIP_CLASSES_BY_ID[cls as import('../types').ShipClass];
          if (def && count) shipDefense += def.combatStrength * count;
        }
        const effectiveTroops = Math.floor(troops * (1 + atkLed / 200));  // LED boosts effective strength
        const baseDmg = Math.floor(effectiveTroops / 6);               // base ~16% of troops as dmg
        const warBonus = Math.floor(baseDmg * (atkWar - defWar) / 100);  // skill differential
        // Ships absorb damage — each shipDefense point shaves ~0.5 dmg
        const shipMitigation = Math.floor(shipDefense * 0.5);
        const portDmg = Math.max(20, baseDmg + warBonus - shipMitigation + Math.floor(Math.random() * 80));
        // Attacker casualties — higher when defender is skilled or has ships
        const attackerLosses = Math.floor(
          troops * (0.05 + (defWar / 400) + (shipDefense / 10000) + (Math.random() * 0.08))
        );

        const hpBefore = port.hp;
        const newHp = Math.max(0, port.hp - portDmg);
        const captured = newHp === 0;

        const nextPort = {
          ...port,
          hp: captured ? Math.floor(port.maxHp * 0.5) : newHp,
          ownerForceId: captured ? state.playerForceId : port.ownerForceId,
        };
        const sentBack = Math.max(0, troops - attackerLosses);
        // Net troop change to source city: send out `troops`, get back `sentBack`
        const nextCity = {
          ...sourceCity,
          troops: sourceCity.troops - troops + sentBack,
        };
        set({
          ports: { ...state.ports, [portId]: nextPort },
          cities: { ...state.cities, [sourceCity.id]: nextCity },
        });
        return {
          ok: true,
          captured,
          message: captured
            ? `${attacker.name.zh} captures ${port.name.zh}! Lost ${attackerLosses} troops.`
            : `${attacker.name.zh} damages ${port.name.zh}: −${portDmg} HP. Lost ${attackerLosses} troops.`,
          report: {
            attacker: {
              officerName: attacker.name.zh,
              troopsSent: troops,
              troopsLost: attackerLosses,
            },
            defender: {
              officerName: defenderOfficer?.name.zh ?? null,
              portHpBefore: hpBefore,
              portHpAfter: nextPort.hp,
            },
          },
        };
      },

      buildStockade: (nearCityId, label) => {
        const STOCKADE_COST = 300;
        const STOCKADE_HP = 350;
        const STOCKADE_SEASONS = 10;
        const state = get();
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        const city = state.cities[nearCityId];
        if (!city) return { ok: false, message: 'City not found.' };
        if (city.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'You must own the host city.' };
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        if (!capital || capital.gold < STOCKADE_COST)
          return { ok: false, message: `Need ${STOCKADE_COST}g in capital.` };
        // Place ~0.4° offset from city center in a random compass direction.
        const angle = Math.random() * Math.PI * 2;
        // Exact geo position from the shared table; reverse-calibrate the
        // painted px only for cities missing an override.
        const geo = CITY_GEO_OVERRIDES[city.id];
        const cityLon = geo ? geo[0] : 96 + (city.coords.x / 1000) * 29;
        const cityLat = geo ? geo[1] : 43 - (city.coords.y / 720) * 26;
        const lon = cityLon + Math.cos(angle) * 0.4;
        const lat = cityLat + Math.sin(angle) * 0.4;
        const id = `stockade-${Date.now()}`;
        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - STOCKADE_COST },
          },
          forts: {
            ...state.forts,
            [id]: {
              id,
              name: { zh: label || '壘', en: label || 'Stockade' },
              subtype: 'stockade',
              coords: { lon, lat },
              ownerForceId: state.playerForceId,
              hp: STOCKADE_HP,
              maxHp: STOCKADE_HP,
              guards: [nearCityId],
              seasonsRemaining: STOCKADE_SEASONS,
            },
          },
        });
        return {
          ok: true,
          message: `Stockade "${label || '壘'}" built near ${city.name.zh} (10 seasons before rot).`,
        };
      },

      buildFacility: (nearCityId, kind, label) => {
        const def = FACILITY_DEFS[kind];
        const state = get();
        if (!state.playerForceId) return { ok: false, message: 'No player force.' };
        const city = state.cities[nearCityId];
        if (!city) return { ok: false, message: 'City not found.' };
        if (city.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'You must own the host city.' };
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        if (!capital || capital.gold < def.cost)
          return { ok: false, message: `Need ${def.cost}g in capital.` };
        // Offset ~0.4° from the city in a random compass direction (same as 築壘).
        const angle = Math.random() * Math.PI * 2;
        const geo = CITY_GEO_OVERRIDES[city.id];
        const cityLon = geo ? geo[0] : 96 + (city.coords.x / 1000) * 29;
        const cityLat = geo ? geo[1] : 43 - (city.coords.y / 720) * 26;
        const lon = cityLon + Math.cos(angle) * 0.4;
        const lat = cityLat + Math.sin(angle) * 0.4;
        const id = `facility-${kind}-${Date.now()}`;
        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - def.cost },
          },
          forts: {
            ...state.forts,
            [id]: {
              id,
              name: { zh: label || def.name.zh, en: label || def.name.en },
              subtype: 'stockade',
              facility: kind,
              coords: { lon, lat },
              ownerForceId: state.playerForceId,
              hp: def.hp,
              maxHp: def.hp,
              guards: [nearCityId],
              seasonsRemaining: def.seasons,
            },
          },
        });
        return {
          ok: true,
          message: `${def.name.zh} built near ${city.name.zh}.`,
        };
      },

      buildShipAtPort: (portId, shipClass) => {
        const state = get();
        const port = state.ports[portId];
        if (!port) return { ok: false, message: 'Port not found.' };
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        if (port.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'You do not own this port.' };
        const def = SHIP_CLASSES_BY_ID[shipClass];
        if (!def) return { ok: false, message: 'Unknown ship class.' };
        const tier = port.navalTier ?? 1;
        if (!shipMeetsTier(shipClass, tier))
          return { ok: false, message: `${def.name.zh}需 ${SHIP_MIN_TIER[shipClass]} 級船塢(此港 ${tier} 級)。` };
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        // 山林之饒 — a 木材 (timber) realm builds ships cheaper and faster.
        const timber = forceSpecialtyRealm(state.cities, state.playerForceId, state.embargoes);
        const goldCost = Math.round(def.goldCost * timber.shipBuildMul);
        if (!capital || capital.gold < goldCost)
          return { ok: false, message: `Need ${goldCost} gold in capital.` };
        const seasons = Math.max(1, Math.round(shipBuildSeasons(def, tier) * timber.shipBuildMul));
        const queue = [...(port.buildQueue ?? []), { shipClass, seasonsLeft: seasons }];
        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - goldCost },
          },
          ports: {
            ...state.ports,
            [portId]: { ...port, buildQueue: queue },
          },
        });
        return {
          ok: true,
          message: `${def.name.zh} build started at ${port.name.zh} (${seasons} seasons, −${goldCost}g).`,
        };
      },

      repairPort: (portId) => {
        const REPAIR_COST = 200;
        const REPAIR_HP = 400;
        const state = get();
        const port = state.ports[portId];
        if (!port) return { ok: false, message: 'Port not found.' };
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        if (port.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'You do not own this port.' };
        if (port.hp >= port.maxHp)
          return { ok: false, message: 'Port is already at full HP.' };
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        if (!capital || capital.gold < REPAIR_COST)
          return { ok: false, message: `Need ${REPAIR_COST} gold in capital.` };
        const newHp = Math.min(port.maxHp, port.hp + REPAIR_HP);
        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - REPAIR_COST },
          },
          ports: { ...state.ports, [portId]: { ...port, hp: newHp } },
        });
        return {
          ok: true,
          message: `${port.name.zh} repaired (+${newHp - port.hp} HP, −${REPAIR_COST}g).`,
        };
      },

      upgradePort: (portId) => {
        const state = get();
        const port = state.ports[portId];
        if (!port) return { ok: false, message: 'Port not found.' };
        if (!state.playerForceId || port.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'You do not own this port.' };
        const tier = port.navalTier ?? 1;
        if (tier >= PORT_MAX_NAVAL_TIER)
          return { ok: false, message: '船塢已達最高等級。' };
        const cost = portUpgradeCost(tier);
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        if (!capital || capital.gold < cost)
          return { ok: false, message: `擴建需 ${cost} 金(治所不足)。` };
        const nextTier = (tier + 1) as 1 | 2 | 3;
        // Scale the current maxHp by the ratio of tier multipliers (m: 1→1, 2→1.4, 3→1.8).
        const mult = (tt: number) => (tt === 3 ? 1.8 : tt === 2 ? 1.4 : 1);
        const newMaxHp = Math.round(port.maxHp * (mult(nextTier) / mult(tier)));
        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - cost },
          },
          ports: {
            ...state.ports,
            [portId]: { ...port, navalTier: nextTier, maxHp: newMaxHp, hp: port.hp + (newMaxHp - port.maxHp) },
          },
        });
        return {
          ok: true,
          message: `${port.name.zh}擴建為 ${nextTier} 級船塢,水軍益壯(−${cost}g)。`,
        };
      },

      attackFort: (fortId, attackerOfficerId, troops) => {
        const state = get();
        const fort = state.forts[fortId];
        if (!fort) return { ok: false, message: 'Fort not found.' };
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        if (fort.ownerForceId === state.playerForceId)
          return { ok: false, message: 'You already own this fort.' };
        const reach = canPlayerAttackFort(fort, state.cities, state.playerForceId);
        if (!reach.ok) return { ok: false, message: reach.reason ?? 'Cannot reach.' };
        const attacker = state.officers[attackerOfficerId];
        if (!attacker || attacker.forceId !== state.playerForceId)
          return { ok: false, message: 'Attacker officer must be yours.' };
        if (attacker.status !== 'idle' && attacker.status !== 'active')
          return { ok: false, message: 'Officer is not available.' };
        const sourceCity = attacker.locationCityId ? state.cities[attacker.locationCityId] : null;
        if (!sourceCity || sourceCity.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'Attacker is not in your city.' };
        if (sourceCity.troops < troops || troops <= 0)
          return { ok: false, message: `Need at least ${troops} troops in ${sourceCity.name.en}.` };

        // Defender: best-WAR officer at any of fort.guards owned by fort owner
        const defenderOfficer = fort.ownerForceId
          ? Object.values(state.officers)
              .filter((o) =>
                o.forceId === fort.ownerForceId
                && o.locationCityId
                && fort.guards.includes(o.locationCityId)
                && (o.status === 'idle' || o.status === 'active'),
              )
              .sort((a, b) => b.stats.war - a.stats.war)[0]
          : null;

        const atkWar = attacker.stats.war;
        const atkLed = attacker.stats.leadership;
        const defWar = defenderOfficer?.stats.war ?? 25;
        const effectiveTroops = Math.floor(troops * (1 + atkLed / 200));
        const baseDmg = Math.floor(effectiveTroops / 6);
        const warBonus = Math.floor(baseDmg * (atkWar - defWar) / 100);
        const fortDmg = Math.max(20, baseDmg + warBonus + Math.floor(Math.random() * 80));
        const attackerLosses = Math.floor(
          troops * (0.04 + (defWar / 400) + (Math.random() * 0.07))
        );
        const newHp = Math.max(0, fort.hp - fortDmg);
        const captured = newHp === 0;
        const nextFort = {
          ...fort,
          hp: captured ? Math.floor(fort.maxHp * 0.5) : newHp,
          ownerForceId: captured ? state.playerForceId : fort.ownerForceId,
        };
        const sentBack = Math.max(0, troops - attackerLosses);
        set({
          forts: { ...state.forts, [fortId]: nextFort },
          cities: {
            ...state.cities,
            [sourceCity.id]: { ...sourceCity, troops: sourceCity.troops - troops + sentBack },
          },
        });
        return {
          ok: true,
          captured,
          message: captured
            ? `${attacker.name.zh} seizes ${fort.name.zh}! Lost ${attackerLosses} troops.`
            : `${attacker.name.zh} batters ${fort.name.zh}: −${fortDmg} HP. Lost ${attackerLosses} troops.`,
        };
      },

      subjugateTribe: (tribeId, attackerOfficerId, troops) => {
        const state = get();
        const tribe = TRIBES_BY_ID[tribeId];
        if (!tribe) return { ok: false, message: 'Tribe not found.' };
        if (!state.playerForceId) return { ok: false, message: 'No player force.' };
        const reach = canCampaignTribe(tribe, state.cities, state.playerForceId);
        if (!reach.ok) return { ok: false, message: reach.reason ?? 'Cannot reach.' };
        const attacker = state.officers[attackerOfficerId];
        if (!attacker || attacker.forceId !== state.playerForceId)
          return { ok: false, message: 'Attacker officer must be yours.' };
        if (attacker.status !== 'idle' && attacker.status !== 'active')
          return { ok: false, message: 'Officer is not available.' };
        const sourceCity = attacker.locationCityId ? state.cities[attacker.locationCityId] : null;
        if (!sourceCity || sourceCity.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'Attacker is not in your city.' };
        if (troops <= 0 || sourceCity.troops < troops)
          return { ok: false, message: `Need ${troops} troops in ${sourceCity.name.zh}.` };

        const r = resolveTribePunitive({
          tribe,
          aggression: state.tribeState.aggression[tribe.id] ?? tribe.baseAggression,
          troops,
          officerWar: attacker.stats.war,
          officerLeadership: attacker.stats.leadership,
          rng: Math.random,
        });
        const prevAgg = state.tribeState.aggression[tribe.id] ?? tribe.baseAggression;
        const nextAgg = Math.max(0, prevAgg + r.aggressionDelta);
        const survivors = Math.max(0, troops - r.attackerLosses) + r.auxTroops;
        const updates: Partial<GameState> = {
          tribeState: {
            ...state.tribeState,
            aggression: { ...state.tribeState.aggression, [tribe.id]: nextAgg },
          },
          cities: {
            ...state.cities,
            [sourceCity.id]: {
              ...sourceCity,
              troops: sourceCity.troops - troops + survivors,
              gold: sourceCity.gold + r.tributeGold,
            },
          },
        };
        // 招降 — a crushing win may win the tribe's chieftain to your banner,
        // if he's still a free agent (孟獲/蹋頓/軻比能).
        let recruited: string | null = null;
        if (r.win && tribe.chieftainId) {
          const chief = state.officers[tribe.chieftainId];
          if (chief && chief.forceId === null && (chief.status === 'idle' || chief.status === 'unsearched')
              && Math.random() < 0.45) {
            codexMarkRecruited(chief.id);
            updates.officers = {
              ...state.officers,
              [chief.id]: {
                ...chief,
                forceId: state.playerForceId,
                locationCityId: sourceCity.id,
                status: 'idle',
                loyalty: 70,
              },
            };
            recruited = chief.name.zh;
          }
        }
        set(updates);
        return {
          ok: true,
          win: r.win,
          message: r.win
            ? `${attacker.name.zh}大破${tribe.name.zh}!獲貢金 ${r.tributeGold}、附庸騎兵 ${r.auxTroops},損兵 ${r.attackerLosses}。${recruited ? `${recruited}感服來降!` : ''}`
            : `${attacker.name.zh}討${tribe.name.zh}不利,損兵 ${r.attackerLosses},其勢稍挫。`,
        };
      },

      placateTribe: (tribeId) => {
        const state = get();
        const tribe = TRIBES_BY_ID[tribeId];
        if (!tribe) return { ok: false, message: 'Tribe not found.' };
        if (!state.playerForceId) return { ok: false, message: 'No player force.' };
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        if (!capital || capital.gold < TRIBE_PLACATE_COST)
          return { ok: false, message: `Need ${TRIBE_PLACATE_COST}g in capital.` };
        const prevAgg = state.tribeState.aggression[tribe.id] ?? tribe.baseAggression;
        // 名品結好 — fine goods (絲/錦/珠/象) from a luxury realm impress the chiefs
        // far more than coin alone, cooling the frontier deeper (tributeMul).
        const tribute = forceSpecialtyRealm(state.cities, state.playerForceId, state.embargoes);
        const nextAgg = Math.max(0, prevAgg - Math.round(TRIBE_PLACATE_AGGRESSION_DROP * tribute.tributeMul));
        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - TRIBE_PLACATE_COST },
          },
          tribeState: {
            ...state.tribeState,
            aggression: { ...state.tribeState.aggression, [tribe.id]: nextAgg },
          },
        });
        return {
          ok: true,
          message: `賜物招撫${tribe.name.zh},邊釁暫息(−${TRIBE_PLACATE_COST}g)。`,
        };
      },

      seizeSite: (siteId, attackerOfficerId, troops) => {
        const state = get();
        const site = state.sites[siteId];
        if (!site) return { ok: false, message: 'Site not found.' };
        if (!state.playerForceId) return { ok: false, message: 'No player force.' };
        if (site.ownerForceId === state.playerForceId)
          return { ok: false, message: 'You already hold this site.' };
        const reach = canPlayerSeizeSite(site, state.cities, state.playerForceId);
        if (!reach.ok) return { ok: false, message: reach.reason ?? 'Cannot reach.' };
        const attacker = state.officers[attackerOfficerId];
        if (!attacker || attacker.forceId !== state.playerForceId)
          return { ok: false, message: 'Attacker officer must be yours.' };
        if (attacker.status !== 'idle' && attacker.status !== 'active')
          return { ok: false, message: 'Officer is not available.' };
        const sourceCity = attacker.locationCityId ? state.cities[attacker.locationCityId] : null;
        if (!sourceCity || sourceCity.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'Attacker is not in your city.' };
        if (troops <= 0 || sourceCity.troops < troops)
          return { ok: false, message: `Need ${troops} troops in ${sourceCity.name.zh}.` };

        const atkWar = attacker.stats.war;
        const atkLed = attacker.stats.leadership;
        const effectiveTroops = Math.floor(troops * (1 + atkLed / 200) * (1 + (atkWar - 50) / 300));
        const dmg = Math.max(150, Math.floor(effectiveTroops / 3) + Math.floor(Math.random() * 300));
        const newHp = Math.max(0, site.hp - dmg);
        const captured = newHp === 0;
        // Casualties scale with the site's remaining defence.
        const attackerLosses = Math.floor(troops * (0.05 + (site.strength / 40000) + Math.random() * 0.06));
        const survivors = Math.max(0, troops - attackerLosses);

        // Loot — only bandit nests pay out (sacked stockpile + freed captives).
        const loot = captured && site.subtype === 'bandit'
          ? Math.floor(site.strength * 0.5 + Math.random() * 400)
          : 0;
        const freedPeasants = captured && site.subtype === 'bandit'
          ? Math.floor(site.strength * 2 + Math.random() * 2000)
          : 0;

        const nextSite = {
          ...site,
          hp: captured ? site.maxHp : newHp,
          ownerForceId: captured ? state.playerForceId : site.ownerForceId,
          hostile: captured ? false : site.hostile,
        };
        const nextSource = {
          ...sourceCity,
          troops: sourceCity.troops - troops + survivors,
          gold: sourceCity.gold + loot,
          population: sourceCity.population + freedPeasants,
        };
        set({
          sites: { ...state.sites, [siteId]: nextSite },
          cities: { ...state.cities, [sourceCity.id]: nextSource },
        });
        const tail = loot > 0 ? `,獲財 ${loot}、附民 ${freedPeasants.toLocaleString()}` : '';
        return {
          ok: true,
          captured,
          message: captured
            ? `${attacker.name.zh}攻克${site.name.zh}!損兵 ${attackerLosses}${tail}。`
            : `${attacker.name.zh}強攻${site.name.zh}:−${dmg},損兵 ${attackerLosses}。`,
        };
      },

      visitScenicSite: (siteId, envoyOfficerId) => {
        const state = get();
        const site = SCENIC_BY_ID[siteId];
        if (!site) return { ok: false, message: 'Site not found.' };
        if (!state.playerForceId) return { ok: false, message: 'No player force.' };
        const reach = canVisitScenic(site, state.cities, state.playerForceId);
        if (!reach.ok) return { ok: false, message: reach.reason ?? 'Cannot reach.' };
        const envoy = state.officers[envoyOfficerId];
        if (!envoy || envoy.forceId !== state.playerForceId)
          return { ok: false, message: 'Envoy must be your officer.' };
        if (envoy.status !== 'idle' && envoy.status !== 'active')
          return { ok: false, message: 'Envoy is not available.' };
        const envoyCity = envoy.locationCityId ? state.cities[envoy.locationCityId] : null;
        if (!envoyCity || envoyCity.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'Envoy is not in your city.' };

        const updates: Partial<GameState> = {};
        const msgs: string[] = [];

        // 尋寶 — loot the treasure + gold once per site (per game).
        const alreadyLooted = !!state.scenicLooted[siteId];
        if (!alreadyLooted) {
          let cities = state.cities;
          if (site.gold > 0) {
            cities = { ...cities, [envoyCity.id]: { ...envoyCity, gold: envoyCity.gold + site.gold } };
            msgs.push(`獲資 ${site.gold} 金`);
          }
          updates.cities = cities;
          if (site.itemId) {
            updates.lostItems = [...state.lostItems, { itemId: site.itemId, cityId: envoyCity.id }];
            msgs.push(`得寶物入${envoyCity.name.zh}`);
          }
          updates.scenicLooted = { ...state.scenicLooted, [siteId]: state.playerForceId };
        }

        // 訪賢 — court the recluse if he's still a free agent. 三顧之誠 — each
        // call is one of the famous three visits: sincerity tells, so the odds
        // (and the flavour) escalate from 一訪不遇 to 三顧乃出.
        let recruited = false;
        if (site.hermitId) {
          const hermit = state.officers[site.hermitId];
          if (hermit && hermit.forceId === null && (hermit.status === 'idle' || hermit.status === 'unsearched')) {
            const force = state.forces[state.playerForceId];
            const ruler = force ? state.officers[force.rulerOfficerId] : null;
            const visit = (state.scenicVisits[siteId] ?? 0) + 1;
            updates.scenicVisits = { ...state.scenicVisits, [siteId]: visit };
            recruited = rollHermitRecruit({
              envoyCharisma: envoy.stats.charisma,
              rulerCharisma: ruler?.stats.charisma ?? 50,
              hermitIntelligence: hermit.stats.intelligence,
              visit,
              rng: Math.random,
            });
            if (recruited) {
              codexMarkRecruited(hermit.id);
              updates.officers = {
                ...state.officers,
                [hermit.id]: {
                  ...hermit,
                  forceId: state.playerForceId,
                  locationCityId: envoyCity.id,
                  status: 'idle',
                  loyalty: 75,
                },
              };
              msgs.push(visit >= 3
                ? `三顧之誠,${hermit.name.zh}感而出山,願效犬馬!`
                : `${hermit.name.zh}感誠來投!`);
            } else {
              // 一訪不遇 / 二訪留書 / 仍避而不出 — distinct flavour per visit.
              msgs.push(visit === 1
                ? `一訪不遇 — 童子應門:先生雲遊未歸,來日再訪。`
                : visit === 2
                  ? `二訪不值 — ${hermit.name.zh}適有他出,留書而返。`
                  : `${hermit.name.zh}避而不出 — 精誠所至,來日再訪。`);
            }
          }
        }

        if (msgs.length === 0) {
          return { ok: false, message: `${site.name.zh}已無所獲。` };
        }
        set(updates);
        return { ok: true, recruited, message: `訪${site.name.zh}:${msgs.join(',')}。` };
      },

      razeCity: (cityId) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city) return { ok: false, message: 'City not found.' };
        if (!state.playerForceId || city.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'Not your city.' };
        if (city.ruined) return { ok: false, message: '此城已成廢墟。' };
        const force = state.forces[state.playerForceId];
        if (force && force.capitalCityId === cityId)
          return { ok: false, message: '不可焚毀本軍治所。' };
        set({ cities: { ...state.cities, [cityId]: razedCity(city) } });
        return { ok: true, message: `${city.name.zh}已焚為焦土,堅壁清野,不予資敵。` };
      },

      rebuildCity: (cityId) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city) return { ok: false, message: 'City not found.' };
        if (!state.playerForceId || city.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'Not your city.' };
        if (!city.ruined) return { ok: false, message: '此城無須重建。' };
        const cost = rebuildCost(city);
        if (city.gold < cost)
          return { ok: false, message: `重建需 ${cost} 金(城內不足)。` };
        const rebuilt = { ...rebuiltCity(city), gold: city.gold - cost };
        set({ cities: { ...state.cities, [cityId]: rebuilt } });
        return { ok: true, message: `${city.name.zh}重建興復,流民歸附(−${cost}g)。` };
      },

      relocateCapital: (cityId) => {
        const RELOCATE_COST = 800;
        const state = get();
        const city = state.cities[cityId];
        if (!city) return { ok: false, message: 'City not found.' };
        if (!state.playerForceId || city.ownerForceId !== state.playerForceId)
          return { ok: false, message: '只能遷都至本軍城池。' };
        if (city.ruined) return { ok: false, message: '廢墟不可為治所。' };
        const force = state.forces[state.playerForceId];
        if (!force) return { ok: false, message: 'No player force.' };
        if (force.capitalCityId === cityId)
          return { ok: false, message: `${city.name.zh}已是本軍治所。` };
        // 首次遷都免費 — the first relocation each game is free; later ones cost gold.
        const free = !state.capitalMoveUsed;
        const cost = free ? 0 : RELOCATE_COST;
        if (city.gold < cost)
          return { ok: false, message: `遷都需 ${cost} 金(${city.name.zh}府庫不足)。` };
        const oldCap = state.cities[force.capitalCityId];
        const nextCities = { ...state.cities };
        // 新都 — pays the cost, but the court's arrival lifts morale (+5).
        nextCities[cityId] = {
          ...city,
          gold: city.gold - cost,
          loyalty: Math.min(100, city.loyalty + 5),
        };
        // 舊都 — losing the seat dims its standing a touch (−3).
        if (oldCap && oldCap.ownerForceId === state.playerForceId) {
          nextCities[oldCap.id] = { ...oldCap, loyalty: Math.max(0, oldCap.loyalty - 3) };
        }
        set({
          cities: nextCities,
          forces: { ...state.forces, [force.id]: { ...force, capitalCityId: cityId } },
          capitalMoveUsed: true,
          popupQueue: [...state.popupQueue, {
            key: 'capital-set',
            media: 'image',
            titleZh: '遷都之喜',
            titleEn: 'A New Capital',
            captionZh: `${city.name.zh} 立為治所`,
            captionEn: `${city.name.en} is now the seat of the realm`,
          }],
        });
        const costNote = free ? '首遷免費' : `耗 ${cost} 金`;
        return { ok: true, message: `遷都${city.name.zh}!新都民心歸附(+5 忠),舊都失寵(−3 忠),${costNote}。` };
      },

      repairFort: (fortId) => {
        const REPAIR_COST = 150;
        const REPAIR_HP = 300;
        const state = get();
        const fort = state.forts[fortId];
        if (!fort) return { ok: false, message: 'Fort not found.' };
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        if (fort.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'You do not own this fort.' };
        if (fort.hp >= fort.maxHp)
          return { ok: false, message: 'Fort is at full HP.' };
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        if (!capital || capital.gold < REPAIR_COST)
          return { ok: false, message: `Need ${REPAIR_COST}g in capital.` };
        const newHp = Math.min(fort.maxHp, fort.hp + REPAIR_HP);
        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - REPAIR_COST },
          },
          forts: { ...state.forts, [fortId]: { ...fort, hp: newHp } },
        });
        return {
          ok: true,
          message: `${fort.name.zh} repaired (+${newHp - fort.hp} HP, −${REPAIR_COST}g).`,
        };
      },

      upgradeFort: (fortId) => {
        const state = get();
        const fort = state.forts[fortId];
        if (!fort) return { ok: false, message: 'Fort not found.' };
        if (!state.playerForceId)
          return { ok: false, message: 'No player force.' };
        if (fort.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'You do not own this fort.' };
        const currentLevel = (fort.level ?? 1) as 1 | 2 | 3;
        if (currentLevel >= 3)
          return { ok: false, message: 'Fort already at max level.' };
        // Determine the BASE maxHp (level 1) so we can recompute for new level
        const baseMaxHp = Math.floor(fort.maxHp / (1 + 0.5 * (currentLevel - 1)));
        const nextLevel = (currentLevel + 1) as 2 | 3;
        const upgradeCost = nextLevel === 2 ? 500 : 1200;
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        if (!capital || capital.gold < upgradeCost)
          return { ok: false, message: `Need ${upgradeCost}g in capital.` };
        const newMaxHp = fortMaxHpForLevel(baseMaxHp, nextLevel);
        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - upgradeCost },
          },
          forts: {
            ...state.forts,
            [fortId]: { ...fort, level: nextLevel, maxHp: newMaxHp, hp: newMaxHp },
          },
        });
        return {
          ok: true,
          message: `${fort.name.zh} upgraded to Lv${nextLevel} (maxHp ${newMaxHp}, −${upgradeCost}g).`,
        };
      },

      startBuilding: (cityId, buildingId, plot) => {
        const state = get();
        const city = state.cities[cityId];
        const def = BUILDING_DEFS_BY_ID[buildingId];
        if (!city || !def) return { ok: false, reason: 'invalid' };
        if (city.ownerForceId !== state.playerForceId) return { ok: false, reason: 'not your city' };
        const existing = state.buildings.find((b) => b.cityId === cityId && b.id === buildingId);
        // 建築前置 — a new tier-2 work needs its foundation built first.
        if (!existing) {
          const prereq = BUILDING_PREREQ[buildingId];
          if (prereq && !state.buildings.some((b) => b.cityId === cityId && b.id === prereq && b.level >= 1))
            return { ok: false, reason: `need ${prereq}` };
          // 城格解鎖 — grand works need a city of sufficient size (人口 tier).
          const minSize = BUILDING_MIN_SIZE[buildingId];
          if (minSize && !cityMeetsSize(city, minSize))
            return { ok: false, reason: `need ${minSize} city` };
        }
        // 將作監 discounts construction; 地利 (specialty affinity) discounts a
        // matching-category building further.
        const affineDiscount = cityAffinity(cityId) === BUILDING_CATEGORY[buildingId] ? 0.15 : 0;
        const buildCost = Math.round(def.goldPerLevel
          * (1 - buildingBonuses(cityId, state.buildings).buildDiscount)
          * (1 - affineDiscount));
        if (city.gold < buildCost) return { ok: false, reason: 'not enough gold' };
        if (existing && existing.level >= def.maxLevel)
          return { ok: false, reason: 'max level' };
        if (existing && existing.progress > 0)
          return { ok: false, reason: 'already in progress' };
        // Build-slot cap: a city can host only as many distinct buildings as its
        // size allows (邑6 → 都20). Upgrading an existing one is always fine.
        if (!existing) {
          const slotsUsed = state.buildings.filter((b) => b.cityId === cityId).length;
          if (slotsUsed >= citySize(city).buildingSlots)
            return { ok: false, reason: 'no free build slot' };
        }
        // Shipyard needs river/coastal — check if the city has a 'river' route hint.
        // (We use specialTiles in named maps; for now allow all.)
        const newBuilding = existing
          ? state.buildings.map((b) =>
              b.id === buildingId && b.cityId === cityId ? { ...b, progress: 1 } : b,
            )
          : [...state.buildings, { id: buildingId, cityId, level: 0, progress: 1, plot }];
        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - buildCost },
          },
          buildings: newBuilding,
        });
        return { ok: true };
      },

      appointGovernor: (provinceId, officerId) => {
        const state = get();
        const officer = state.officers[officerId];
        if (!officer) return { ok: false, reason: 'invalid officer' };
        if (officer.forceId !== state.playerForceId) return { ok: false, reason: 'not your officer' };
        set({
          provinceGovernors: {
            ...state.provinceGovernors,
            [provinceId]: officerId,
          },
        });
        return { ok: true };
      },

      proposeMarriagePair: (aId, bId) => {
        const MARRIAGE_COST = 500;
        const state = get();
        const a = state.officers[aId];
        const b = state.officers[bId];
        if (!a || !b || aId === bId) return { ok: false, reason: 'invalid officer', message: 'Invalid officers.' };
        if (!state.playerForceId || a.forceId !== state.playerForceId || b.forceId !== state.playerForceId)
          return { ok: false, reason: 'must be your officers', message: 'Both must be your officers.' };
        if (a.status === 'dead' || b.status === 'dead')
          return { ok: false, reason: 'must be living', message: 'Both must be living.' };
        if (state.family.some((r) => r.kind === 'spouse' && ((r.officerA === aId && r.officerB === bId) || (r.officerA === bId && r.officerB === aId))))
          return { ok: false, reason: 'already wed', message: `${a.name.en} and ${b.name.en} are already wed.` };
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        if (!capital || capital.gold < MARRIAGE_COST)
          return { ok: false, reason: 'no gold', message: `Need ${MARRIAGE_COST} gold in the capital.` };
        const family = addSpouse(state.family, aId, bId);
        // 結親 — wedding lifts both spouses to a steadfast loyalty (couples bond).
        const officers = { ...state.officers };
        officers[aId] = { ...a, loyalty: Math.max(a.loyalty ?? 0, 90) };
        officers[bId] = { ...b, loyalty: Math.max(b.loyalty ?? 0, 90) };
        set({
          family,
          officers,
          cities: { ...state.cities, [capital.id]: { ...capital, gold: capital.gold - MARRIAGE_COST } },
        });
        return { ok: true, message: `${a.name.en} ⚭ ${b.name.en}: a marriage is arranged within your house — their loyalty steadies, and they may in time raise heirs.` };
      },

      assignTutor: (heirId, tutorId) => {
        const state = get();
        const heir = state.pendingHeirs.find((h) => h.id === heirId);
        if (!heir) return { ok: false, message: 'No such child.' };
        if (tutorId) {
          const tutor = state.officers[tutorId];
          if (!tutor || tutor.status === 'dead' || tutor.status === 'unsearched')
            return { ok: false, message: 'Invalid tutor.' };
          if (tutor.forceId !== state.playerForceId)
            return { ok: false, message: 'Tutor must be your officer.' };
        }
        const pendingHeirs = state.pendingHeirs.map((h) =>
          h.id === heirId ? { ...h, tutorId: tutorId ?? undefined } : h,
        );
        set({ pendingHeirs });
        const tutorName = tutorId ? state.officers[tutorId]?.name.en : null;
        return { ok: true, message: tutorName ? `${tutorName} will tutor ${heir.name.en}.` : `Tutor cleared for ${heir.name.en}.` };
      },

      designateHeir: (heirId) => {
        const state = get();
        const target = state.pendingHeirs.find((h) => h.id === heirId);
        if (target) {
          // One designated heir per parent line — clear siblings sharing a parent.
          const pendingHeirs = state.pendingHeirs.map((h) => {
            if (h.id === heirId) return { ...h, designatedHeir: true };
            const sharesParent = h.parentAId === target.parentAId || h.parentAId === target.parentBId
              || h.parentBId === target.parentAId || h.parentBId === target.parentBId;
            return sharesParent && h.designatedHeir ? { ...h, designatedHeir: false } : h;
          });
          set({ pendingHeirs });
          return { ok: true, message: `${target.name.en} is named the house's chosen heir (世子).` };
        }
        // Grown child: set the flag on the officer, clearing siblings (same parents).
        const child = state.officers[heirId];
        if (!child) return { ok: false, message: 'No such child.' };
        if (child.forceId !== state.playerForceId) return { ok: false, message: 'Must be your officer.' };
        const parentIds = state.family
          .filter((r) => r.kind === 'parent-child' && (r.officerA === heirId || r.officerB === heirId))
          .map((r) => (r.officerA === heirId ? r.officerB : r.officerA));
        if (parentIds.length === 0) return { ok: false, message: 'Not part of a bloodline.' };
        const siblingIds = new Set<string>();
        for (const r of state.family) {
          if (r.kind !== 'parent-child') continue;
          const c = parentIds.includes(r.officerA) ? r.officerB : parentIds.includes(r.officerB) ? r.officerA : null;
          if (c) siblingIds.add(c);
        }
        const officers = { ...state.officers };
        for (const sid of siblingIds) {
          if (sid === heirId) continue;
          const s = officers[sid];
          if (s?.designatedHeir) officers[sid] = { ...s, designatedHeir: false };
        }
        officers[heirId] = { ...child, designatedHeir: true };
        set({ officers });
        return { ok: true, message: `${child.name.en} is named the house's chosen heir (世子).` };
      },

      adoptHeir: (childOfficerId, parentOfficerId) => {
        const state = get();
        const child = state.officers[childOfficerId];
        const parent = state.officers[parentOfficerId];
        if (!child || !parent || childOfficerId === parentOfficerId)
          return { ok: false, message: 'Invalid officers.' };
        if (!state.playerForceId || child.forceId !== state.playerForceId || parent.forceId !== state.playerForceId)
          return { ok: false, message: 'Both must be your officers.' };
        if (child.status === 'dead' || parent.status === 'dead')
          return { ok: false, message: 'Both must be living.' };
        if (state.family.some((r) => r.kind === 'parent-child' && ((r.officerA === childOfficerId && r.officerB === parentOfficerId) || (r.officerA === parentOfficerId && r.officerB === childOfficerId))))
          return { ok: false, message: 'Already kin.' };
        const family = addParentChild(state.family, parentOfficerId, childOfficerId);
        // The adoptee joins the parent's house; if the parent has none, it founds one.
        const officers = { ...state.officers };
        let clanId = clanOf(parent) ?? undefined;
        if (!clanId) {
          clanId = `house-${parent.id}`;
          officers[parent.id] = { ...parent, clanId };
        }
        officers[childOfficerId] = { ...child, clanId, loyalty: Math.max(child.loyalty ?? 0, 90) };
        set({ family, officers });
        return { ok: true, message: `${child.name.en} is adopted into ${parent.name.en}'s house (收養) — bound by blood-oath and clan.` };
      },

      socializeOfficers: (aId, bId) => {
        const state = get();
        const a = state.officers[aId];
        const b = state.officers[bId];
        if (!a || !b || aId === bId) return { ok: false, message: 'Invalid officers.' };
        if (!state.playerForceId || a.forceId !== state.playerForceId || b.forceId !== state.playerForceId)
          return { ok: false, message: 'Both must be your officers.' };
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        const COST = 100;
        if (!capital || capital.gold < COST) return { ok: false, message: `Need ${COST} gold in the capital.` };
        const bonded = [...OATH_BONDS, ...state.runtimeBonds].some((bd) =>
          (bd.officerA === aId && bd.officerB === bId) || (bd.officerA === bId && bd.officerB === aId));
        const { rapport, forged } = addRapport(state.rapport, aId, bId, 25, bonded,
          `${a.name.en} & ${b.name.en} Sworn Bond`);
        // 君臣相得 — if the lord personally 結交 an officer, that officer warms
        // to their sovereign (君臣好感), building toward 心腹 status.
        const rulerId = player?.rulerOfficerId;
        let lordRapport = state.lordRapport;
        if (rulerId === aId) lordRapport = addLordRapport(lordRapport, bId, 25);
        else if (rulerId === bId) lordRapport = addLordRapport(lordRapport, aId, 25);
        set({
          rapport,
          lordRapport,
          cities: { ...state.cities, [capital.id]: { ...capital, gold: capital.gold - COST } },
          runtimeBonds: forged ? [...state.runtimeBonds, forged] : state.runtimeBonds,
        });
        return {
          ok: true,
          forged: !!forged,
          message: forged
            ? `${a.name.en} and ${b.name.en} swear a bond of brotherhood!`
            : `${a.name.en} & ${b.name.en} grow closer (${getRapport(rapport, aId, bId)}/100).`,
        };
      },

      hostBanquet: (cityId) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city || city.ownerForceId !== state.playerForceId) return { ok: false, message: 'Not your city.' };
        const COST = 300;
        if (city.gold < COST) return { ok: false, message: `Need ${COST} gold here.` };
        const here = Object.values(state.officers).filter(
          (o) => o.forceId === state.playerForceId && o.locationCityId === cityId && o.status !== 'dead');
        if (here.length < 2) return { ok: false, message: 'Need at least two officers present.' };
        const rapport = mingleRapport(state.rapport, here.map((o) => o.id), 10);
        const officers = { ...state.officers };
        for (const o of here) officers[o.id] = { ...o, loyalty: Math.min(100, (o.loyalty ?? 0) + 4) };
        // 君臣同歡 — the lord's hospitality warms each guest toward the throne.
        let lordRapport = state.lordRapport;
        for (const o of here) lordRapport = addLordRapport(lordRapport, o.id, 3);
        set({
          rapport,
          lordRapport,
          officers,
          cities: { ...state.cities, [cityId]: { ...city, gold: city.gold - COST } },
        });
        return { ok: true, message: `Banquet at ${city.name.en} — ${here.length} officers mingle (+loyalty, +rapport, +君臣好感).` };
      },

      swearBrotherhood: (aId, bId) => {
        const state = get();
        const a = state.officers[aId];
        const b = state.officers[bId];
        if (!a || !b || aId === bId) return { ok: false, message: 'Invalid officers.' };
        if (!state.playerForceId || a.forceId !== state.playerForceId || b.forceId !== state.playerForceId)
          return { ok: false, message: 'Both must be your officers.' };
        if (a.status === 'dead' || b.status === 'dead') return { ok: false, message: 'Both must be living.' };
        const already = [...OATH_BONDS, ...state.runtimeBonds].some((bd) =>
          (bd.kind === 'sibling' || bd.kind === 'oath') &&
          ((bd.officerA === aId && bd.officerB === bId) || (bd.officerA === bId && bd.officerB === aId)));
        if (already) return { ok: false, message: `${a.name.en} and ${b.name.en} are already sworn brothers.` };
        // Brotherhood is earned through fellowship, not bought cold — they must
        // already hold each other in some regard (好感 ≥ 60).
        const SWEAR_RAPPORT_MIN = 60;
        if (getRapport(state.rapport, aId, bId) < SWEAR_RAPPORT_MIN)
          return { ok: false, message: `${a.name.en} and ${b.name.en} aren't close enough yet (need 好感 ≥ ${SWEAR_RAPPORT_MIN}).` };
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        const COST = 300;
        if (!capital || capital.gold < COST) return { ok: false, message: `Need ${COST} gold in the capital.` };
        const newBond = {
          officerA: aId,
          officerB: bId,
          floor: 90,
          kind: 'sibling' as const,
          label: `${a.name.en} & ${b.name.en} 義兄弟`,
          depth: 1 as const,
          sharedSeasons: 0,
        };
        // Forging a brotherhood also lifts both officers to the loyalty floor now.
        const officers = { ...state.officers };
        officers[aId] = { ...a, loyalty: Math.max(a.loyalty ?? 0, 90) };
        officers[bId] = { ...b, loyalty: Math.max(b.loyalty ?? 0, 90) };
        set({
          officers,
          runtimeBonds: [...state.runtimeBonds, newBond],
          cities: { ...state.cities, [capital.id]: { ...capital, gold: capital.gold - COST } },
        });
        return { ok: true, message: `${a.name.en} and ${b.name.en} swear an oath of brotherhood! 義結金蘭` };
      },

      swearThreeWay: (aId, bId, cId) => {
        const state = get();
        const ids = [aId, bId, cId];
        if (new Set(ids).size !== 3) return { ok: false, message: 'Pick three distinct officers.' };
        const os = ids.map((id) => state.officers[id]);
        if (os.some((o) => !o)) return { ok: false, message: 'Invalid officers.' };
        const [a, b, c] = os as [Officer, Officer, Officer];
        if (!state.playerForceId || os.some((o) => o!.forceId !== state.playerForceId))
          return { ok: false, message: 'All three must be your officers.' };
        if (os.some((o) => o!.status === 'dead')) return { ok: false, message: 'All must be living.' };
        const pairs: Array<[EntityId, EntityId]> = [[aId, bId], [aId, cId], [bId, cId]];
        const SWEAR_RAPPORT_MIN = 60;
        for (const [x, y] of pairs) {
          const already = [...OATH_BONDS, ...state.runtimeBonds].some((bd) =>
            (bd.kind === 'sibling' || bd.kind === 'oath') &&
            ((bd.officerA === x && bd.officerB === y) || (bd.officerA === y && bd.officerB === x)));
          if (already) continue; // an existing tie is fine — just bind the rest
          if (getRapport(state.rapport, x, y) < SWEAR_RAPPORT_MIN)
            return { ok: false, message: `Not all three are close enough yet (each pair needs 好感 ≥ ${SWEAR_RAPPORT_MIN}).` };
        }
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        const COST = 600;
        if (!capital || capital.gold < COST) return { ok: false, message: `Need ${COST} gold in the capital.` };
        const newBonds = pairs
          .filter(([x, y]) => ![...OATH_BONDS, ...state.runtimeBonds].some((bd) =>
            (bd.kind === 'sibling' || bd.kind === 'oath') &&
            ((bd.officerA === x && bd.officerB === y) || (bd.officerA === y && bd.officerB === x))))
          .map(([x, y]) => ({
            officerA: x, officerB: y, floor: 90, kind: 'sibling' as const,
            label: `${state.officers[x]!.name.en} & ${state.officers[y]!.name.en} 桃園`,
            depth: 1 as const, sharedSeasons: 0,
          }));
        const officers = { ...state.officers };
        for (const o of [a, b, c]) officers[o.id] = { ...o, loyalty: Math.max(o.loyalty ?? 0, 90) };
        set({
          officers,
          runtimeBonds: [...state.runtimeBonds, ...newBonds],
          cities: { ...state.cities, [capital.id]: { ...capital, gold: capital.gold - COST } },
        });
        return { ok: true, message: `${a.name.en}, ${b.name.en} and ${c.name.en} swear brotherhood in the peach garden! 桃園結義` };
      },

      reconcileOfficers: (aId, bId) => {
        const state = get();
        const a = state.officers[aId];
        const b = state.officers[bId];
        if (!a || !b || aId === bId) return { ok: false, message: 'Invalid officers.' };
        if (!state.playerForceId || a.forceId !== state.playerForceId || b.forceId !== state.playerForceId)
          return { ok: false, message: 'Both must be your officers.' };
        if (a.status === 'dead' || b.status === 'dead') return { ok: false, message: 'Both must be living.' };
        const cur = getRapport(state.rapport, aId, bId);
        const feuding = state.runtimeBonds.some((bd) => bd.kind === 'feud' &&
          ((bd.officerA === aId && bd.officerB === bId) || (bd.officerA === bId && bd.officerB === aId)));
        if (cur >= 0 && !feuding) return { ok: false, message: `${a.name.en} and ${b.name.en} are on fine terms — nothing to mend.` };
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        const COST = 200;
        if (!capital || capital.gold < COST) return { ok: false, message: `Need ${COST} gold in the capital.` };
        // The ablest impartial peer (politics+charisma) mediates; better envoys mend more.
        let mediator: Officer | null = null;
        for (const o of Object.values(state.officers)) {
          if (o.id === aId || o.id === bId) continue;
          if (o.forceId !== state.playerForceId || o.status === 'dead' || o.status === 'imprisoned') continue;
          if (!mediator || (o.stats.politics + o.stats.charisma) > (mediator.stats.politics + mediator.stats.charisma)) mediator = o;
        }
        const amount = 25 + Math.round(((mediator?.stats.politics ?? 0) + (mediator?.stats.charisma ?? 0)) / 8);
        const res = reconcilePair(state.rapport, state.runtimeBonds, aId, bId, amount);
        set({
          rapport: res.rapport,
          runtimeBonds: res.runtimeBonds,
          cities: { ...state.cities, [capital.id]: { ...capital, gold: capital.gold - COST } },
        });
        const via = mediator ? `${mediator.name.en} mediates; ` : '';
        return {
          ok: true,
          message: res.dissolved
            ? `${via}the feud between ${a.name.en} and ${b.name.en} is laid to rest (好感 ${getRapport(res.rapport, aId, bId)}).`
            : `${via}${a.name.en} and ${b.name.en} are partly reconciled (好感 ${getRapport(res.rapport, aId, bId)}).`,
        };
      },

      levyPrivateTroops: (officerId, amount) => {
        const state = get();
        const officer = state.officers[officerId];
        if (!officer || officer.status === 'dead') return { ok: false, message: 'Invalid officer.' };
        if (!state.playerForceId || officer.forceId !== state.playerForceId)
          return { ok: false, message: 'Not your officer.' };
        const cityId = officer.locationCityId;
        const city = cityId ? state.cities[cityId] : null;
        if (!city || city.ownerForceId !== state.playerForceId)
          return { ok: false, message: 'Officer must be in one of your cities.' };
        const amt = Math.floor(amount);
        if (!Number.isFinite(amt) || amt <= 0) return { ok: false, message: 'Enter a positive amount.' };
        // Chronicle heroes raise a larger household guard as they rise in rank.
        const careerBonus = state.careerMode?.officerId === officerId
          ? careerGuardCapBonus(careerStanding(state.deeds[officerId]))
          : 0;
        const cap = officer.stats.leadership * 100 + careerBonus;
        const current = officer.privateTroops ?? 0;
        const room = cap - current;
        if (room <= 0) return { ok: false, message: `${officer.name.en}'s guard is already at capacity (${cap}).` };
        const take = Math.min(amt, room);
        const GOLD_PER_UNIT = 2;
        const cost = take * GOLD_PER_UNIT;
        if (city.gold < cost) return { ok: false, message: `Need ${cost} gold here (have ${city.gold}).` };
        set({
          officers: { ...state.officers, [officerId]: { ...officer, privateTroops: current + take } },
          cities: { ...state.cities, [city.id]: { ...city, gold: city.gold - cost } },
        });
        return { ok: true, message: `${officer.name.en} levies ${take} 私兵 (now ${current + take}/${cap}).` };
      },

      disbandPrivateTroops: (officerId) => {
        const state = get();
        const officer = state.officers[officerId];
        if (!officer) return { ok: false, message: 'Invalid officer.' };
        const current = officer.privateTroops ?? 0;
        if (current <= 0) return { ok: false, message: 'No private guard to disband.' };
        set({ officers: { ...state.officers, [officerId]: { ...officer, privateTroops: 0 } } });
        return { ok: true, message: `${officer.name.en} disbands ${current} 私兵.` };
      },

      addCustomEvent: (event) => {
        const state = get();
        if (state.customEvents.length >= MAX_CUSTOM_EVENTS) {
          return { ok: false, message: `Reached the ${MAX_CUSTOM_EVENTS}-event limit.` };
        }
        set({ customEvents: [...state.customEvents, event] });
        return { ok: true, message: `Custom event saved: ${event.name.en}` };
      },

      removeCustomEvent: (id) =>
        set((s) => ({ customEvents: s.customEvents.filter((e) => e.id !== id) })),

      grantWish: (wishId) => {
        const state = get();
        const wish = state.officerWishes.find((w) => w.id === wishId);
        if (!wish) return;
        const wishOfficer = state.officers[wish.officerId];
        const advisorMul = wishOfficer
          ? appointmentBonusFor(wishOfficer.forceId, state.appointments, state.officers).advisorMultiplier
          : 1;
        // Compute unequipped item pool for `item` wishes — items in inventory
        // not held by any officer.
        const equippedSet = new Set<EntityId>();
        for (const o of Object.values(state.officers)) {
          for (const it of (o.equipment ?? [])) equippedSet.add(it);
        }
        // ITEMS_BY_ID has every defined item; subtract equipped + lost.
        const lostSet = new Set(state.lostItems.map((l) => l.itemId));
        const unequippedItemIds: EntityId[] = [];
        for (const id of Object.keys(ITEMS_BY_ID)) {
          if (!equippedSet.has(id) && !lostSet.has(id)) unequippedItemIds.push(id);
        }
        const r = applyWishGrant(wish, {
          officers: state.officers,
          cities: state.cities,
          advisorMultiplier: advisorMul,
          unequippedItemIds,
          lostItems: state.lostItems,
        });
        // Granting also resets grievance — the lord acknowledged them.
        if (wishOfficer && (wishOfficer.grievanceCount ?? 0) > 0) {
          r.officers[wishOfficer.id] = { ...r.officers[wishOfficer.id], grievanceCount: 0 };
        }
        // If an item was drawn from lostItems, remove it from the pool.
        const newLostItems = r.consumedFromLost
          ? state.lostItems.filter((l) => !(l.itemId === r.consumedItemId && l.cityId === r.consumedFromLost))
          : state.lostItems;
        set({
          officers: r.officers,
          cities: r.cities,
          lostItems: newLostItems,
          officerWishes: state.officerWishes.filter((w) => w.id !== wishId),
          // 君臣相得 — granting a petition is the lord's fairest gesture; it
          // deepens the officer's regard for the throne.
          lordRapport: addLordRapport(state.lordRapport, wish.officerId, 12),
          // Queue the report entry so it shows up in the next season report.
          pendingWishEntries: [...(state.pendingWishEntries ?? []), r.entry],
        });
      },

      rejectWish: (wishId) => {
        const state = get();
        const wish = state.officerWishes.find((w) => w.id === wishId);
        if (!wish) return;
        const r = applyWishReject(wish, { officers: state.officers, cities: state.cities });
        set({
          officers: r.officers,
          cities: r.cities,
          officerWishes: state.officerWishes.filter((w) => w.id !== wishId),
          // Spurning a petition cools the officer toward their lord (君臣好感 −10).
          lordRapport: addLordRapport(state.lordRapport, wish.officerId, -10),
          pendingWishEntries: [...(state.pendingWishEntries ?? []), r.entry],
        });
      },

      setTutorialStep: (step) => set({ tutorialStep: step }),

      setHotSeatPlayers: (players) =>
        set({ hotSeatPlayers: players, hotSeatActiveIndex: 0 }),

      cycleHotSeat: () => {
        const state = get();
        if (state.hotSeatPlayers.length === 0) return;
        const next = (state.hotSeatActiveIndex + 1) % state.hotSeatPlayers.length;
        const player = state.hotSeatPlayers[next];
        set({
          hotSeatActiveIndex: next,
          playerForceId: player.forceId,
        });
      },

      buildShip: (cityId, shipClass) => {
        const state = get();
        const city = state.cities[cityId];
        if (!city) return { ok: false, reason: 'invalid city' };
        if (city.ownerForceId !== state.playerForceId) return { ok: false, reason: 'not your city' };
        const shipyard = state.buildings.find((b) => b.cityId === cityId && b.id === 'shipyard');
        if (!shipyard || shipyard.level === 0)
          return { ok: false, reason: 'need a shipyard' };
        const cost = shipClass === 'flagship' ? 1200 : shipClass === 'warship' ? 600 : 300;
        if (city.gold < cost) return { ok: false, reason: 'not enough gold' };
        const seasons = Math.max(1, 4 - shipyard.level);
        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - cost },
          },
          shipOrders: [
            ...state.shipOrders,
            {
              id: `ship-${Date.now()}`,
              cityId,
              shipClass,
              seasonsLeft: seasons,
            },
          ],
        });
        return { ok: true };
      },

      loadRandomScenario: (forceCount, year, seed) => {
        const scenario = generateRandomScenario({ forceCount, year, seed });
        // Pick the first force as default player.
        const playerForceId = scenario.forces[0]?.id;
        if (!playerForceId) return;
        set((s) => loadScenario(s, scenario, playerForceId, s.difficulty));
      },

      saveSlot: (slotId, label) => {
        const state = get();
        const force = state.playerForceId ? state.forces[state.playerForceId] : null;
        const playerForceName = force?.name.en ?? 'Unknown';
        saveToSlot(slotId, label, state, playerForceName);
      },

      loadSlot: (slotId) => {
        const loaded = loadFromSlot(slotId);
        if (!loaded) return false;
        // Refresh tribe state if missing (legacy save).
        const fresh = {
          ...loaded,
          tribeState: loaded.tribeState ?? EMPTY_STATE.tribeState,
          pendingEspionage: loaded.pendingEspionage ?? [],
          embeddedSpies: loaded.embeddedSpies ?? [],
          edictHistory: loaded.edictHistory ?? [],
          edictCooldowns: loaded.edictCooldowns ?? {},
          appointments: loaded.appointments ?? [],
          appointmentHistory: loaded.appointmentHistory ?? [],
          casusBelliMarks: loaded.casusBelliMarks ?? [],
          recruitBonusSeasons: loaded.recruitBonusSeasons ?? {},
          pendingWishEntries: loaded.pendingWishEntries ?? [],
          itemHistory: loaded.itemHistory ?? [],
          eventFlags: loaded.eventFlags ?? {},
          firedEventIds: loaded.firedEventIds ?? [],
          ports: migratePorts(
            loaded.ports,
            Object.fromEntries(
              Object.values(loaded.cities ?? {}).map((c) => [c.id, c.ownerForceId]),
            ),
          ),
          forts: migrateForts(
            loaded.forts,
            Object.fromEntries(
              Object.values(loaded.cities ?? {}).map((c) => [c.id, c.ownerForceId]),
            ),
          ),
          sites: migrateSites(loaded.sites),
          scenicLooted: loaded.scenicLooted ?? {},
          scenicVisits: loaded.scenicVisits ?? {},
          itemRefinements: loaded.itemRefinements ?? {},
          itemBreakthroughs: loaded.itemBreakthroughs ?? {},
          itemGems: loaded.itemGems ?? {},
          gemStock: loaded.gemStock ?? {},
          // 家門聲望 — backfill from the loaded roster for legacy saves.
          clanStandings: loaded.clanStandings ?? deriveInitialClanStandings(loaded.officers ?? {}),
        };
        // 精煉/突破/鑲嵌登記 — re-point the denormalized registries at the loaded maps.
        setRefineRegistry(fresh.itemRefinements);
        setBreakthroughRegistry(fresh.itemBreakthroughs);
        setGemRegistry(fresh.itemGems);
        set(fresh);
        return true;
      },

      deleteSlot: (slotId) => deleteSlot(slotId),
      listSlots: () => listSlots(),

      reset: () => set(() => ({ ...EMPTY_STATE })),
    }),
    {
      name: 'tkm-save-v26',
      // 存檔遷移 IndexedDB — the live campaign blob leaves the 5MB
      // localStorage budget to the save slots; transparent fallback +
      // one-time migration live in idbStorage.
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        chronicle: state.chronicle,
        date: state.date,
        scenarioId: state.scenarioId,
        playerForceId: state.playerForceId,
        selectedCityId: state.selectedCityId,
        cities: state.cities,
        forces: state.forces,
        officers: state.officers,
        pendingCommands: state.pendingCommands,
        sparUsage: state.sparUsage,
        debateUsage: state.debateUsage,
        pendingTrainings: state.pendingTrainings,
        lastReport: state.lastReport,
        cityEventMarks: state.cityEventMarks,
        victoryStatus: state.victoryStatus,
        difficulty: state.difficulty,
        activeChallenge: state.activeChallenge,
        challengeRecords: state.challengeRecords,
        diplomacy: state.diplomacy,
        runtimeBonds: state.runtimeBonds,
        rapport: state.rapport,
        battleHistory: state.battleHistory,
        appointments: state.appointments,
        appointmentHistory: state.appointmentHistory,
        casusBelliMarks: state.casusBelliMarks,
        recruitBonusSeasons: state.recruitBonusSeasons,
        eventFlags: state.eventFlags,
        firedEventIds: state.firedEventIds,
        customEvents: state.customEvents,
        pendingEspionage: state.pendingEspionage,
        embeddedSpies: state.embeddedSpies,
        edictHistory: state.edictHistory,
        edictCooldowns: state.edictCooldowns,
        tribeState: state.tribeState,
        soundEnabled: state.soundEnabled,
        buildings: state.buildings,
        tradeRoutes: state.tradeRoutes,
        provinceGovernors: state.provinceGovernors,
        fleets: state.fleets,
        shipOrders: state.shipOrders,
        ports: state.ports,
        forts: state.forts,
        sites: state.sites,
        scenicLooted: state.scenicLooted,
        scenicVisits: state.scenicVisits,
        family: state.family,
        pendingHeirs: state.pendingHeirs,
        clanStandings: state.clanStandings,
        officerWishes: state.officerWishes,
        pendingWishEntries: state.pendingWishEntries,
        itemHistory: state.itemHistory,
        endingsAchieved: state.endingsAchieved,
        hotSeatPlayers: state.hotSeatPlayers,
        hotSeatActiveIndex: state.hotSeatActiveIndex,
        musicTrack: state.musicTrack,
        language: state.language,
        placementMode: state.placementMode,
        enabledDynasties: state.enabledDynasties,
        lostItems: state.lostItems,
        itemRefinements: state.itemRefinements,
        itemBreakthroughs: state.itemBreakthroughs,
        itemGems: state.itemGems,
        itemLore: state.itemLore,
        gemStock: state.gemStock,
        knownRecipes: state.knownRecipes,
        // Persist replays WITHOUT their turn-by-turn trails — a single battle
        // trail can run ~0.5-1MB and partialize stringifies on every set().
        // The trail stays watchable for the current session; reloaded replays
        // fall back to the final frame (the viewer already handles that).
        battleReplays: state.battleReplays.map((r) => ({ ...r, snapshots: [] })),
        // 名局廊 — small fx-only records, safe to persist in full.
        duelHall: state.duelHall,
        warRatings: state.warRatings,
        clearedDuelScenarios: state.clearedDuelScenarios,
        deeds: state.deeds,
        fogOfWar: state.fogOfWar,
        espionageReveals: state.espionageReveals,
        cityDelegations: state.cityDelegations,
        legions: state.legions,
        emperorCityId: state.emperorCityId,
        dailyChallengeDate: state.dailyChallengeDate,
        powerHistory: state.powerHistory,
        recruitState: state.recruitState,
        commandTemplates: state.commandTemplates,
        autoBuildQueues: state.autoBuildQueues,
        dialogueFollowups: state.dialogueFollowups,
        achievedObjectives: state.achievedObjectives,
        careerMode: state.careerMode,
        battleSpeed: state.battleSpeed,
        romanceMode: state.romanceMode,
        roguelikeMode: state.roguelikeMode,
        lifespanMode: state.lifespanMode,
        noBattleDeath: state.noBattleDeath,
        reviveDeadOfficers: state.reviveDeadOfficers,
        aiStrength: state.aiStrength,
        startHandicap: state.startHandicap,
        victoryGoal: state.victoryGoal,
        startTaxRate: state.startTaxRate,
        startInflation: state.startInflation,
        aiStartTroops: state.aiStartTroops,
        battleDifficulty: state.battleDifficulty,
        lifespanLength: state.lifespanLength,
        agingStatLock: state.agingStatLock,
        talentDiscovery: state.talentDiscovery,
        duelFrequency: state.duelFrequency,
        disasterFrequency: state.disasterFrequency,
        ironman: state.ironman,
        newOfficers: state.newOfficers,
        fictionalPool: state.fictionalPool,
        initialDiplomacy: state.initialDiplomacy,
        campaignStats: state.campaignStats,
      }),
      onRehydrateStorage: () => (state) => {
        // Always rebuild ports from PORT_TEMPLATES on auto-load, preserving
        // only owner + hp from the persisted snapshot. This lets us tweak
        // port coords / connections / maxHp without breaking existing saves.
        if (!state) return;
        if (!state.enabledDynasties) state.enabledDynasties = [];
        if (!state.rapport) state.rapport = {};
        if (!state.lordRapport) state.lordRapport = {};
        if (state.activeChallenge === undefined) state.activeChallenge = null;
        if (!state.challengeRecords) state.challengeRecords = {};
        if (!state.sparUsage) state.sparUsage = {};
        if (!state.debateUsage) state.debateUsage = {};
        if (!state.duelHall) state.duelHall = [];
        if (!state.warRatings) state.warRatings = {};
        if (!state.clearedDuelScenarios) state.clearedDuelScenarios = [];
        if (!state.customEvents) state.customEvents = [];
        if (!state.recentPrestige) state.recentPrestige = [];
        if (!state.recentBonds) state.recentBonds = [];
        if (!state.recentPrestigeCeremony) state.recentPrestigeCeremony = [];
        if (!state.recentPromotions) state.recentPromotions = [];
        if (!state.itemRefinements) state.itemRefinements = {};
        if (!state.itemBreakthroughs) state.itemBreakthroughs = {};
        if (!state.itemGems) state.itemGems = {};
        if (!state.gemStock) state.gemStock = {};
        // 鑄法圖譜 — pre-blueprint saves know the basic designs by default.
        if (!state.knownRecipes) state.knownRecipes = STARTER_RECIPE_IDS.slice();
        // 精煉/突破/鑲嵌登記 — sync the denormalized registries the pure
        // item-effect read sites resolve through.
        if (!state.itemLore) state.itemLore = {}; // 名器威名 — pre-feature saves start unblooded
        setRefineRegistry(state.itemRefinements);
        setBreakthroughRegistry(state.itemBreakthroughs);
        setGemRegistry(state.itemGems);
        setLoreRegistry(state.itemLore);
        const cityOwnerByCityId = Object.fromEntries(
          Object.values(state.cities ?? {}).map((c) => [c.id, c.ownerForceId]),
        );
        state.ports = migratePorts(state.ports, cityOwnerByCityId);
        state.forts = migrateForts(state.forts, cityOwnerByCityId);
        // Backfill historical family lineage into pre-existing saves that
        // were created before FAMILY_LINEAGE existed (family was empty).
        // Filter to entries where both officers are in the loaded roster.
        const officersMap = state.officers ?? {};
        const existing = new Set(
          (state.family ?? []).map((r) => `${r.officerA}|${r.officerB}|${r.kind}`),
        );
        const additions = FAMILY_LINEAGE.filter(
          (r) =>
            officersMap[r.officerA] &&
            officersMap[r.officerB] &&
            !existing.has(`${r.officerA}|${r.officerB}|${r.kind}`),
        );
        if (additions.length > 0) {
          state.family = [...(state.family ?? []), ...additions];
        }
        // Backfill deed-titles for officers whose accumulated stats already
        // cross thresholds — silent mode so loading an old save doesn't
        // retroactively gift loyalty bonuses.
        if (state.deeds && state.officers) {
          const grant = grantDeedTitles(state.deeds, state.officers, { silent: true });
          state.deeds = grant.deeds;
        }
      },
    },
  ),
);
