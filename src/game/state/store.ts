import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  BuildingId,
  CivicTitleId,
  Command,
  EdictKind,
  EntityId,
  EspionageKind,
  HistoricalEvent,
  ImperialRank,
  InternalAffairsType,
  MilitaryRankId,
  Officer,
  ProvinceId,
  Scenario,
  ShipClass,
  TacticalBattle,
} from '../types';
import { isHostilePermitted } from '../types';
import { createDeeds } from '../types/deeds';
import { grantDeedTitles } from '../systems/deedTitles';
import type { Difficulty } from './gameState';
import { CIVIC_TITLES_BY_ID, MILITARY_RANKS_BY_ID } from '../data/titles';
import { FORGE_RECIPES_BY_ID } from '../data/forging';
import { EDICTS_BY_KIND, IMPERIAL_RANKS_BY_ID } from '../data/imperial';
import { ESPIONAGE_DEFS_BY_KIND } from '../data/espionage';
import { ITEMS_BY_ID } from '../data/items';
import { FAMILY_LINEAGE } from '../data/familyLineage';
import { POLICY_DEFS, TACTIC_DEFS } from '../data/officerAttributes';
import {
  applyEventEffects,
  findFiringEvent,
} from '../systems/historicalEvents';
import { resolveEspionage } from '../systems/espionage';
import { resolveTribeRaids } from '../systems/tribes';
import { planAITurn } from '../systems/ai';
import { planAIAppointments } from '../systems/aiAppointments';
import { planAICourt } from '../systems/aiCourt';
import { rollFactionEvents } from '../systems/factionEvents';
import { rollAIWishFlavor } from '../systems/aiWishesFlavor';
import { appointmentBonusFor, pruneStaleAppointments, traitRefusal, isOnCooldown } from '../systems/appointmentEffects';
import { canPromoteToRank } from '../systems/imperialEffects';
import { COMMAND_DEFS } from '../systems/commands';
import { canTrain, trainingCost, tickTrainings, trainingDurationSeasons, sweepStaleTrainings, mentorDurationSeasons, isParentMentor, canTrainTactic, tacticTrainingCost, tacticDurationSeasons, tacticMentorDurationSeasons } from '../systems/training';
import { loyaltyDriftPerSeason, rollFlavorEvent, defectionChance, sharedBondableTrait, maritalCompatibility, itemResonanceCandidate, policyResonanceCandidate, rollMarriageAssimilation, itemTacticCandidate } from '../systems/traitEffects';
import { loyaltyFloor, rollMentorPolicyTransfer, mentorsOf } from '../systems/relationshipEffects';
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
  FREE_AGENT_COST,
  RECRUIT_COST,
  applyExecute,
  applyRelease,
  attemptFreeAgentRecruit,
  attemptRecruit,
} from '../systems/officerFate';
import { resolveSeason } from '../systems/resolution';
import { BUILDING_DEFS_BY_ID } from '../data/buildings';
import { DEFENSE_BUILDINGS } from '../data/defenseBuildings';
import { SHIP_CLASSES_BY_ID } from '../data/ships';
import { canPlayerAttackPort, migratePorts } from '../data/ports';
import { canPlayerAttackFort, migrateForts } from '../data/forts';
import { fortMaxHpForLevel } from '../types';
import { awardBattleXp } from '../systems/growth';
import { tickBuildings } from '../systems/buildings';
import { evaluateCoalition } from '../systems/coalition';
import { rollDialogue } from '../systems/dialogueRoll';
import { DIALOGUE_EVENTS_BY_ID } from '../data/dialogues';
import { applyAutoBuild } from '../systems/autoBuild';
import { planAIBuildOrders } from '../systems/aiBuild';
import { SCENARIO_OBJECTIVES } from '../data/objectives';
import { evaluateGoal, findObjectiveFor } from '../systems/objectives';
import { applySuccession } from '../systems/succession';
import {
  bumpCounters,
  checkCumulativeThresholds,
  loadAchievementProgress,
  processTrigger,
  saveAchievementProgress,
} from '../systems/achievements';
import { tickFamily, addSpouse } from '../systems/family';
import { rollWishes, applyWishGrant, applyWishReject, expireWishes, maybeWoundedRetireWish } from '../systems/wishes';
import { checkEndings } from '../systems/endings';
import { generateRandomScenario } from '../systems/randomScenario';
import { rollWeather, describeWeather } from '../systems/weather';
import { rollPlagueOutbreak, rollIntrigue } from '../systems/intrigue';
import { rollOmen } from '../systems/mandate';
import { rollReligiousRebellion } from '../systems/religion';

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
  ) => void;
  selectCity: (cityId: EntityId | null) => void;
  issueCommand: (
    cityId: EntityId,
    type: InternalAffairsType,
    officerId: EntityId,
  ) => { ok: boolean; reason?: string };
  issueMarch: (
    sourceId: EntityId,
    targetId: EntityId,
    officerId: EntityId,
    troops: number,
    additionalOfficerIds?: EntityId[],
  ) => { ok: boolean; reason?: string };
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
  dismissBattleTheater: () => void;
  recruitOfficer: (
    officerId: EntityId,
    cityId: EntityId,
  ) => { ok: boolean; message: string };
  recruitFreeAgent: (
    officerId: EntityId,
    cityId: EntityId,
  ) => { ok: boolean; message: string };
  executeOfficer: (officerId: EntityId) => void;
  releaseOfficer: (officerId: EntityId) => void;
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
  ) => { ok: boolean; message: string };
  transferOfficer: (
    officerId: EntityId,
    destinationCityId: EntityId,
  ) => { ok: boolean; reason?: string };
  assignItem: (
    itemId: EntityId,
    toOfficerId: EntityId,
  ) => { ok: boolean; reason?: string };
  unequipSlot: (
    officerId: EntityId,
    slot: 'weapon' | 'horse' | 'treasure' | 'book',
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
  dismissEvent: () => void;
  startTacticalBattle: (battle: TacticalBattle) => void;
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
  ) => { ok: boolean; reason?: string };
  cancelEspionage: (opId: EntityId) => void;
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
  setFogOfWar: (on: boolean) => void;
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
  forgeItem: (
    cityId: EntityId,
    recipeId: EntityId,
  ) => { ok: boolean; reason?: string };
  acknowledgeAchievements: () => void;
  acknowledgeDeedTitles: () => void;
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
  saveSlot: (slotId: string, label: string) => void;
  loadSlot: (slotId: string) => boolean;
  deleteSlot: (slotId: string) => void;
  listSlots: () => ReturnType<typeof listSlots>;
  startBuilding: (
    cityId: EntityId,
    buildingId: BuildingId,
  ) => { ok: boolean; reason?: string };
  appointGovernor: (
    provinceId: ProvinceId,
    officerId: EntityId,
  ) => { ok: boolean; reason?: string };
  proposeMarriagePair: (
    aId: EntityId,
    bId: EntityId,
  ) => { ok: boolean; reason?: string };
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

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      loadScenario: (scenario, playerForceId, difficulty, customOfficer) =>
        set((s) => loadScenario(s, scenario, playerForceId, difficulty, customOfficer)),

      selectCity: (cityId) => set(() => ({ selectedCityId: cityId })),

      issueCommand: (cityId, type, officerId) => {
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
        // pendingCommands keyed by officerId — one task per officer, many per city.
        if (state.pendingCommands[officerId])
          return { ok: false, reason: 'officer already has a pending command' };
        if (state.pendingTrainings.some((t) => t.officerId === officerId))
          return { ok: false, reason: 'officer is training at the academy' };
        if (city.gold < def.goldCost)
          return { ok: false, reason: 'not enough gold' };

        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - def.goldCost },
          },
          officers: {
            ...state.officers,
            [officerId]: { ...officer, task: type },
          },
          pendingCommands: {
            ...state.pendingCommands,
            [officerId]: { type, cityId, officerId },
          },
        });
        return { ok: true };
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
        if (!source.adjacentCityIds.includes(targetId))
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

        set({
          cities: {
            ...state.cities,
            [sourceId]: { ...source, gold: source.gold - def.goldCost },
          },
          officers: officersUpdate,
          pendingCommands: {
            ...state.pendingCommands,
            [officerId]: {
              type: 'march',
              cityId: sourceId,
              officerId,
              targetCityId: targetId,
              troops,
              additionalOfficerIds: extras.length > 0 ? extras : undefined,
            },
          },
        });
        return { ok: true };
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

        set({
          cities: city
            ? { ...state.cities, [cmd.cityId]: { ...city, gold: city.gold + def.goldCost } }
            : state.cities,
          officers: officersUpdate,
          pendingCommands: next,
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
          diplomacy: state.diplomacy,
          runtimeBonds: state.runtimeBonds,
          family: state.family,
          appointments: appointmentsAfterAI,
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
          forces: forcesAfterCourt,
          pendingCommands: planned.pendingCommands,
          diplomacy: planned.diplomacy,
          runtimeBonds: planned.runtimeBonds,
          lostItems: state.lostItems,
          family: state.family,
          appointments: appointmentsAfterAI,
          casusBelliMarks: casusBelliAfterCourt,
          recruitBonusSeasons: state.recruitBonusSeasons,
          weather: state.weather,
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

        // Victory/defeat check
        const totalCities = Object.values(result.cities).length;
        const playerCities = playerForceId
          ? Object.values(result.cities).filter(
              (c) => c.ownerForceId === playerForceId,
            ).length
          : 0;
        let victoryStatus: VictoryStatus = state.victoryStatus;
        if (playerCities === 0) {
          victoryStatus = 'defeat';
        } else if (playerCities === totalCities) {
          victoryStatus = 'victory';
        }

        // Capture battle details from this season into persistent history.
        const newBattles = result.report.entries
          .filter((e) => !!e.battle)
          .map((e, idx) => ({
            ...e.battle!,
            id: `${state.date.year}-${state.date.season}-${idx}`,
            date: { year: state.date.year, season: state.date.season },
          }));

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

        // Historical event check. Fires at most one event per season.
        let firingEvent: HistoricalEvent | null = null;
        let postCities = tribeResult.cities;
        let postOfficers = espResult.officers;
        let postForces = result.forces;
        let postFlags = eventFlagsAfterCourt;
        let postFiredIds = state.firedEventIds;
        const eventCheck = findFiringEvent({
          date: result.date,
          cities: postCities,
          officers: postOfficers,
          forces: postForces,
          eventFlags: state.eventFlags,
          firedEventIds: state.firedEventIds,
          romanceMode: state.romanceMode,
        });
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

        // Family tick (births + activations) — only on year boundary roughly.
        const fam = tickFamily({
          date: result.date,
          officers: postOfficers,
          family: state.family,
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
        });
        postForces = succession.forces;
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

        // ── Season-bound rolls (every 9 periods only) ──
        let nextWeather = state.weather;
        let nextMandate = state.mandate;
        if (seasonBoundary) {
          const plagueOut = rollPlagueOutbreak({
            cities: postCities,
            officers: postOfficers,
            currentYear: result.date.year,
            rng: Math.random,
          });
          postCities = plagueOut.cities;
          postOfficers = plagueOut.officers;
          if (plagueOut.entries.length > 0) result.report.entries.push(...plagueOut.entries);

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
            rng: Math.random,
          });
          postOfficers = facOut.officers;
          postCities = facOut.cities;
          nextMandate = facOut.mandate;
          if (facOut.entries.length > 0) result.report.entries.push(...facOut.entries);
          // AI court wish flavor: 0-2 random AI petitions resolved per season.
          const aiWishFlavor = rollAIWishFlavor(postOfficers, postForces, state.playerForceId, Math.random);
          postOfficers = aiWishFlavor.officers;
          if (aiWishFlavor.entries.length > 0) result.report.entries.push(...aiWishFlavor.entries);
        }

        // ── Wounded recovery tick: decrement woundedSeasons, restore to idle at 0 ──
        // Newly wounded with cautious/sickly trait or age ≥ 55 may petition
        // to retire — generated as a `retire` wish for the player only.
        const tickedOfficers: Record<string, typeof postOfficers[string]> = {};
        const woundedRetireWishes: import('../types').OfficerWish[] = [];
        for (const o of Object.values(postOfficers)) {
          if (o.status === 'wounded' && o.woundedSeasons !== undefined) {
            const left = o.woundedSeasons - 1;
            if (left <= 0) {
              tickedOfficers[o.id] = { ...o, status: 'idle', woundedSeasons: undefined };
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
        postOfficers = tickedOfficers;

        // ── Delayed effects (截糧 troop drain) tick ──
        const remainingDelayed: typeof state.pendingDelayedEffects = [];
        // Add fresh effects from this season's battles.
        const freshDelayed = (result.delayedEffects ?? []);
        const allDelayed = [...state.pendingDelayedEffects, ...freshDelayed];
        for (const d of allDelayed) {
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
            remainingDelayed.push({ ...d, seasons: d.seasons - 1 });
          }
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
        }

        // ── T3 — Per-season loyalty drift from personality traits ──
        // Loyal officers slowly regenerate loyalty; ambitious/oath-breakers
        // drift down. Runs every period (small per-tick effect).
        {
          const driftedOfficers: Record<EntityId, Officer> = { ...postOfficers };
          let anyChange = false;
          for (const o of Object.values(postOfficers)) {
            if (o.status === 'dead' || !o.forceId) continue;
            const drift = loyaltyDriftPerSeason(o);
            // R1 — Relationship-based loyalty floor (folds in what 絆/OATH_BONDS
            // used to do): sworn brothers 95, close family 95, siblings 90,
            // master-servant 90, mentor-student 90 — all conditional on the
            // bonded officer being alive in the same force.
            const floor = loyaltyFloor(o, postOfficers, state.family);
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
        }

        // ── P11 — Same-trait bond formation (season boundary, rare) ──
        // Two officers in the same force/city sharing an idealistic trait
        // (chivalrous, scholar, mystical, etc.) occasionally form an oath
        // bond. Adds to runtimeBonds with a moderate loyalty floor.
        let bondsAfterTraits = planned.runtimeBonds;
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
                }
              }
            }
          }
          if (newBonds.length > 0) {
            bondsAfterTraits = [...bondsAfterTraits, ...newBonds];
          }
        }

        // ── Burning-city decay (animation lifetime) ──
        // Newly fallen cities ignite for 2 seasons; existing ones tick down.
        const conqueredThisTurn = result.report.entries
          .filter((e) => e.kind === 'conquest' && e.cityId)
          .map((e) => e.cityId as EntityId);
        const decayed = state.burningCities
          .map((b) => ({ ...b, seasonsLeft: b.seasonsLeft - 1 }))
          .filter((b) => b.seasonsLeft > 0);
        const newIgnitions = conqueredThisTurn
          .filter((id) => !decayed.some((b) => b.cityId === id))
          .map((id) => ({ cityId: id, seasonsLeft: 2 }));
        const nextBurning = [...decayed, ...newIgnitions];

        // Endings check (only if not in tactical/event states).
        const ending = checkEndings({
          cities: postCities,
          officers: postOfficers,
          forces: postForces,
          playerForceId: state.playerForceId,
          date: result.date,
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

        set({
          date: result.date,
          cities: postCities,
          officers: postOfficers,
          forces: postForces,
          runtimeBonds: bondsAfterTraits,
          pendingCommands: {},
          pendingTrainings: nextTrainings,
          lastReport: result.report,
          deeds: nextDeeds,
          recentDeedTitles: [...state.recentDeedTitles, ...titleGrant.grants],
          // Battle deltas only feed MVPs at season boundaries — reset
          // then so the next season starts fresh; otherwise keep them
          // accumulating across mid-season ticks.
          seasonBattleDeltas: seasonBoundary ? {} : state.seasonBattleDeltas,
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
          tribeState: tribeResult.state,
          buildings: bld.buildings,
          family: fam.family,
          pendingHeirs: fam.pendingHeirs,
          officerWishes: [
            ...(consumedWishIds.size > 0
              ? newWishes.filter((w) => !consumedWishIds.has(w.id))
              : newWishes),
            ...woundedRetireWishes,
          ],
          pendingWishEntries: [],
          shipOrders: remainingOrders,
          fleets: updatedFleets,
          ports: nextPorts,
          forts: nextForts,
          endingsAchieved,
          campaignStats: {
            ...state.campaignStats,
            seasonsPlayed: (state.campaignStats.seasonsPlayed ?? 0) + 1,
          },
          lostItems: result.lostItems,
          diplomacy: coalitionResult.diplomacy,
          autoBuildQueues: auto.queues,
          pendingDialogue: dlg ?? state.pendingDialogue,
          dialogueFollowups: nextFollowups,
          achievedObjectives: newAchieved,
          pendingEvent: firingEvent
            ? {
                event: firingEvent,
                year: result.date.year,
                season: result.date.season,
              }
            : state.pendingEvent,
          weather: nextWeather,
          burningCities: nextBurning,
          mandate: nextMandate,
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
            ? casusBelliAfterCourt.filter((m) => {
                const seasonIdx = { spring: 0, summer: 1, autumn: 2, winter: 3 } as const;
                const nextAbs = result.date.year * 4 + seasonIdx[result.date.season];
                const expAbs = m.expiresYear * 4 + seasonIdx[m.expiresSeason];
                return nextAbs <= expAbs;
              })
            : state.casusBelliMarks,
          // 求賢令 recruit bonus tick: decrement seasonsLeft, drop expired.
          recruitBonusSeasons: seasonBoundary
            ? Object.fromEntries(
                Object.entries(state.recruitBonusSeasons)
                  .map(([k, v]) => [k, { ...v, seasonsLeft: v.seasonsLeft - 1 }] as const)
                  .filter(([, v]) => v.seasonsLeft > 0),
              )
            : state.recruitBonusSeasons,
        });
      },

      dismissReport: () => set(() => ({ lastReport: null })),

      dismissBattleTheater: () => {
        const state = get();
        const rest = state.pendingBattleTheaters.slice(1);
        set({ pendingBattleTheaters: rest });
      },

      recruitOfficer: (officerId, cityId) => {
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
        const result = attemptRecruit({
          officer,
          city,
          recruiterForce: force,
          recruiterRuler: ruler,
          recruiterReputation: { citiesOwned },
        });

        const updates: Partial<GameState> = {
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - RECRUIT_COST },
          },
        };
        if (result.ok && result.recruitedOfficer) {
          updates.officers = {
            ...state.officers,
            [officerId]: result.recruitedOfficer,
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
        }
        set(updates);
        return { ok: result.ok, message: result.message };
      },

      recruitFreeAgent: (officerId, cityId) => {
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

        const citiesOwned2 = Object.values(state.cities).filter(
          (c) => c.ownerForceId === state.playerForceId,
        ).length;
        const result = attemptFreeAgentRecruit({
          officer,
          city,
          recruiterForce: force,
          recruiterRuler: ruler,
          recruiterReputation: { citiesOwned: citiesOwned2 },
        });

        const updates: Partial<GameState> = {
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - FREE_AGENT_COST },
          },
        };
        if (result.ok && result.recruitedOfficer) {
          updates.officers = {
            ...state.officers,
            [officerId]: result.recruitedOfficer,
          };
        }
        set(updates);
        return { ok: result.ok, message: result.message };
      },

      executeOfficer: (officerId) => {
        const state = get();
        const officer = state.officers[officerId];
        if (!officer || officer.status !== 'imprisoned') return;
        set({
          officers: {
            ...state.officers,
            [officerId]: applyExecute(officer),
          },
        });
      },

      releaseOfficer: (officerId) => {
        const state = get();
        const officer = state.officers[officerId];
        if (!officer || officer.status !== 'imprisoned') return;
        set({
          officers: {
            ...state.officers,
            [officerId]: applyRelease(officer),
          },
        });
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
          diplomacyMultiplier: appointmentBonusFor(player.id, state.appointments, state.officers).diplomacyMultiplier,
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
          diplomacyMultiplier: appointmentBonusFor(player.id, state.appointments, state.officers).diplomacyMultiplier,
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
            diplomacyMultiplier: appointmentBonusFor(player.id, state.appointments, state.officers).diplomacyMultiplier,
          },
          amount,
        );

        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - amount },
          },
          diplomacy: outcome.diplomacy,
        });
        return { ok: true, message: outcome.message };
      },

      breakAlliance: (targetForceId) => {
        const state = get();
        if (!state.playerForceId) return;
        set({
          diplomacy: breakAlliance(
            state.diplomacy,
            state.playerForceId,
            targetForceId,
          ),
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
          diplomacyMultiplier: appointmentBonusFor(player.id, state.appointments, state.officers).diplomacyMultiplier,
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

      proposeMarriage: (targetForceId, yourOfficerId, theirOfficerId) => {
        const MARRIAGE_COST = 1000;
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
          floor: 80,
          kind: 'oath' as const,
          label: `${yours.name.en} ⚭ ${theirs.name.en} Marriage`,
        };

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
            },
          },
        };

        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - MARRIAGE_COST },
          },
          runtimeBonds: [...state.runtimeBonds, newBond],
          diplomacy: nextDiplomacy,
        });

        return {
          ok: true,
          message: `${yours.name.en} and ${theirs.name.en} are now bonded by marriage. Relations with ${target.name.en} improved.`,
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
        updates[toOfficerId] = {
          ...target,
          equipment: [...target.equipment, itemId],
        };

        set({ officers: { ...state.officers, ...updates } });
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

      dismissEvent: () => {
        const state = get();
        if (!state.pendingEvent) return;
        set({ pendingEvent: null });
      },

      startTacticalBattle: (battle) => set({ tacticalBattle: battle }),
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
      cancelTacticalBattle: () => set({ tacticalBattle: null }),

      applyTacticalResolution: (captured, dead, lootGold, winner) => {
        const state = get();
        const tb = state.tacticalBattle;
        if (!tb) return;
        let officers = { ...state.officers };
        const cities = { ...state.cities };
        const careerMilestones: Array<{ title: { zh: string; en: string }; year: number; season: typeof state.date.season }> = [];

        // Award XP to all participants.
        const participantIds = tb.units.map((u) => u.officerId);
        const victorIds = winner
          ? tb.units.filter((u) => u.side === winner).map((u) => u.officerId)
          : [];
        const xpResult = awardBattleXp(officers, participantIds, victorIds);
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

        // Save replay (snapshot of final battle state only — turn-by-turn would
        // require more plumbing, so we record the end state.).
        const force = winner === 'attacker' ? tb.attackerForceId : tb.defenderForceId;
        const replays = [...state.battleReplays, {
          id: `replay-${tb.id}`,
          cityId: tb.cityId,
          cityName: state.cities[tb.cityId]?.name ?? { zh: '?', en: '?' },
          year: state.date.year,
          season: state.date.season,
          attackerForceName: tb.attackerForceId ? state.forces[tb.attackerForceId]?.name : undefined,
          defenderForceName: tb.defenderForceId ? state.forces[tb.defenderForceId]?.name : undefined,
          finalBattle: tb,
          snapshots: [tb],
        }];
        void force;

        // Apply officer fates.
        for (const id of dead) {
          const o = officers[id];
          if (o) {
            officers[id] = { ...o, status: 'dead', forceId: null, task: null };
          }
        }
        for (const id of captured) {
          const o = officers[id];
          if (o) {
            officers[id] = { ...o, status: 'imprisoned', forceId: null, task: null };
          }
        }

        // Apply troop losses to the source/target cities.
        const target = cities[tb.cityId];
        if (target) {
          // Defender losses are taken from target city.
          cities[tb.cityId] = {
            ...target,
            troops: Math.max(0, target.troops - tb.defenderLosses),
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

        // If attacker won, city falls (taken with attacker's surviving troops).
        if (winner === 'attacker' && target) {
          const attackerCmd = tb.units.find((u) => u.side === 'attacker' && u.isCommander);
          if (attackerCmd) {
            const survivingTroops = tb.units
              .filter((u) => u.side === 'attacker')
              .reduce((s, u) => s + u.troops, 0);
            cities[tb.cityId] = {
              ...cities[tb.cityId],
              ownerForceId: tb.attackerForceId,
              troops: survivingTroops,
              loyalty: Math.max(20, Math.floor(target.loyalty * 0.5)),
            };
            bumpDeeds(attackerCmd.officerId, { citiesTaken: 1 });
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
            alert(`Your career officer ${careerOff.name.en} has fallen in battle. The campaign ends here. (Roguelike run #${ach.counters.careerRuns})`);
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
        if (winner === 'attacker') {
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

        set({
          officers: titleGrant.officers,
          cities,
          tacticalBattle: null,
          deeds: titleGrant.deeds,
          battleReplays: replays,
          careerMode,
          campaignStats: newStats,
          recentAchievementUnlocks: [...state.recentAchievementUnlocks, ...newlyAch],
          recentDeedTitles: [...state.recentDeedTitles, ...titleGrant.grants],
          seasonBattleDeltas: nextSeasonBattle,
        });
      },

      queueEspionage: (kind, agentOfficerId, targetForceId, targetCityId, targetOfficerId) => {
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

      issueEdict: (kind, targetForceId) => {
        const state = get();
        const def = EDICTS_BY_KIND[kind];
        if (!def) return { ok: false, reason: 'invalid edict' };
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
        if (!capital || capital.gold < def.goldCost)
          return { ok: false, reason: `need ${def.goldCost}g at capital` };

        const updates: Partial<typeof state> = {};
        let message: string | undefined;

        if (kind === 'tax-amnesty') {
          const cities = { ...state.cities };
          for (const c of Object.values(cities)) {
            if (c.ownerForceId === state.playerForceId) {
              cities[c.id] = { ...c, loyalty: Math.min(100, c.loyalty + 10) };
            }
          }
          cities[capital.id] = { ...cities[capital.id], gold: cities[capital.id].gold - def.goldCost };
          updates.cities = cities;
          message = 'Grand amnesty proclaimed. Loyalty +10 across the realm.';
        } else if (kind === 'denounce' && targetForceId) {
          const cities = { ...state.cities };
          cities[capital.id] = { ...capital, gold: capital.gold - def.goldCost };
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
          cities[capital.id] = { ...cities[capital.id], gold: cities[capital.id].gold - def.goldCost };
          updates.cities = cities;
          updates.edictCooldowns = {}; // wipe all cooldowns
          message = 'A new era is proclaimed. Loyalty +5; all edict cooldowns reset.';
        } else if (kind === 'reward-merit') {
          // 賞功：选武功榜分最高的本国武将，+15 忠诚 + 一个特殊 deed-title
          const cities = { ...state.cities };
          cities[capital.id] = { ...capital, gold: capital.gold - def.goldCost };
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
          cities[capital.id] = { ...capital, gold: capital.gold - def.goldCost };
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
              cities[capital.id] = { ...capital, gold: capital.gold - def.goldCost + tribute };
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
          cities[capital.id] = { ...capital, gold: capital.gold - def.goldCost };
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
      setFogOfWar: (on) => set({ fogOfWar: on }),

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
        if (!foundry || foundry.level < recipe.minFoundryLevel)
          return { ok: false, reason: `need foundry lv${recipe.minFoundryLevel}` };
        if (city.gold < recipe.goldCost)
          return { ok: false, reason: 'not enough gold' };
        // Verify all ingredients are present as lost items in this city.
        const ingredientsInCity = state.lostItems.filter(
          (li) => li.cityId === cityId && recipe.ingredients.includes(li.itemId),
        );
        const have = new Set(ingredientsInCity.map((li) => li.itemId));
        if (!recipe.ingredients.every((id) => have.has(id)))
          return { ok: false, reason: 'missing ingredients' };

        // Consume gold, consume ingredients, place result in the lost-items pool of this city.
        const newLostItems = state.lostItems.filter((li) => {
          if (li.cityId !== cityId) return true;
          if (!recipe.ingredients.includes(li.itemId)) return true;
          // Remove only one instance (since items are unique global anyway).
          return false;
        });
        newLostItems.push({ itemId: recipe.resultItemId, cityId });
        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - recipe.goldCost },
          },
          lostItems: newLostItems,
        });
        return { ok: true };
      },

      acknowledgeAchievements: () => set({ recentAchievementUnlocks: [] }),
      acknowledgeDeedTitles: () => set({ recentDeedTitles: [] }),

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
        // Place ~0.4° offset from city center in a random compass direction
        const angle = Math.random() * Math.PI * 2;
        // City coords are in painted px; we need geo. Use the GEO calibration
        // helper that lives in StrategicMap3D… actually we want geo here.
        // Reverse the geoToPixel calibration: lon = 96 + px/1000 * 29 etc.
        const cityLon = 96 + (city.coords.x / 1000) * 29;
        const cityLat = 43 - (city.coords.y / 720) * 26;
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
        const player = state.forces[state.playerForceId];
        const capital = player ? state.cities[player.capitalCityId] : null;
        if (!capital || capital.gold < def.goldCost)
          return { ok: false, message: `Need ${def.goldCost} gold in capital.` };
        const queue = [...(port.buildQueue ?? []), { shipClass, seasonsLeft: def.seasonsToBuild }];
        set({
          cities: {
            ...state.cities,
            [capital.id]: { ...capital, gold: capital.gold - def.goldCost },
          },
          ports: {
            ...state.ports,
            [portId]: { ...port, buildQueue: queue },
          },
        });
        return {
          ok: true,
          message: `${def.name.zh} build started at ${port.name.zh} (${def.seasonsToBuild} seasons, −${def.goldCost}g).`,
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

      startBuilding: (cityId, buildingId) => {
        const state = get();
        const city = state.cities[cityId];
        const def = BUILDING_DEFS_BY_ID[buildingId];
        if (!city || !def) return { ok: false, reason: 'invalid' };
        if (city.ownerForceId !== state.playerForceId) return { ok: false, reason: 'not your city' };
        if (city.gold < def.goldPerLevel) return { ok: false, reason: 'not enough gold' };
        const existing = state.buildings.find((b) => b.cityId === cityId && b.id === buildingId);
        if (existing && existing.level >= def.maxLevel)
          return { ok: false, reason: 'max level' };
        if (existing && existing.progress > 0)
          return { ok: false, reason: 'already in progress' };
        // Shipyard needs river/coastal — check if the city has a 'river' route hint.
        // (We use specialTiles in named maps; for now allow all.)
        const newBuilding = existing
          ? state.buildings.map((b) =>
              b.id === buildingId && b.cityId === cityId ? { ...b, progress: 1 } : b,
            )
          : [...state.buildings, { id: buildingId, cityId, level: 0, progress: 1 }];
        set({
          cities: {
            ...state.cities,
            [cityId]: { ...city, gold: city.gold - def.goldPerLevel },
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
        const state = get();
        const a = state.officers[aId];
        const b = state.officers[bId];
        if (!a || !b) return { ok: false, reason: 'invalid officer' };
        if (a.forceId !== state.playerForceId && b.forceId !== state.playerForceId)
          return { ok: false, reason: 'must be your officers' };
        const family = addSpouse(state.family, aId, bId);
        set({ family });
        return { ok: true };
      },

      grantWish: (wishId) => {
        const state = get();
        const wish = state.officerWishes.find((w) => w.id === wishId);
        if (!wish) return;
        const wishOfficer = state.officers[wish.officerId];
        const advisorMul = wishOfficer
          ? appointmentBonusFor(wishOfficer.forceId, state.appointments, state.officers).advisorMultiplier
          : 1;
        const r = applyWishGrant(wish, {
          officers: state.officers,
          cities: state.cities,
          advisorMultiplier: advisorMul,
        });
        set({
          officers: r.officers,
          cities: r.cities,
          officerWishes: state.officerWishes.filter((w) => w.id !== wishId),
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
          edictHistory: loaded.edictHistory ?? [],
          edictCooldowns: loaded.edictCooldowns ?? {},
          appointments: loaded.appointments ?? [],
          appointmentHistory: loaded.appointmentHistory ?? [],
          casusBelliMarks: loaded.casusBelliMarks ?? [],
          recruitBonusSeasons: loaded.recruitBonusSeasons ?? {},
          pendingWishEntries: loaded.pendingWishEntries ?? [],
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
        };
        set(fresh);
        return true;
      },

      deleteSlot: (slotId) => deleteSlot(slotId),
      listSlots: () => listSlots(),

      reset: () => set(() => ({ ...EMPTY_STATE })),
    }),
    {
      name: 'tkm-save-v26',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        date: state.date,
        scenarioId: state.scenarioId,
        playerForceId: state.playerForceId,
        selectedCityId: state.selectedCityId,
        cities: state.cities,
        forces: state.forces,
        officers: state.officers,
        pendingCommands: state.pendingCommands,
        pendingTrainings: state.pendingTrainings,
        lastReport: state.lastReport,
        victoryStatus: state.victoryStatus,
        difficulty: state.difficulty,
        diplomacy: state.diplomacy,
        runtimeBonds: state.runtimeBonds,
        battleHistory: state.battleHistory,
        appointments: state.appointments,
        appointmentHistory: state.appointmentHistory,
        casusBelliMarks: state.casusBelliMarks,
        recruitBonusSeasons: state.recruitBonusSeasons,
        eventFlags: state.eventFlags,
        firedEventIds: state.firedEventIds,
        pendingEspionage: state.pendingEspionage,
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
        family: state.family,
        pendingHeirs: state.pendingHeirs,
        officerWishes: state.officerWishes,
        pendingWishEntries: state.pendingWishEntries,
        endingsAchieved: state.endingsAchieved,
        hotSeatPlayers: state.hotSeatPlayers,
        hotSeatActiveIndex: state.hotSeatActiveIndex,
        musicTrack: state.musicTrack,
        language: state.language,
        placementMode: state.placementMode,
        lostItems: state.lostItems,
        battleReplays: state.battleReplays,
        deeds: state.deeds,
        fogOfWar: state.fogOfWar,
        commandTemplates: state.commandTemplates,
        autoBuildQueues: state.autoBuildQueues,
        dialogueFollowups: state.dialogueFollowups,
        achievedObjectives: state.achievedObjectives,
        careerMode: state.careerMode,
        battleSpeed: state.battleSpeed,
        romanceMode: state.romanceMode,
        roguelikeMode: state.roguelikeMode,
        campaignStats: state.campaignStats,
      }),
      onRehydrateStorage: () => (state) => {
        // Always rebuild ports from PORT_TEMPLATES on auto-load, preserving
        // only owner + hp from the persisted snapshot. This lets us tweak
        // port coords / connections / maxHp without breaking existing saves.
        if (!state) return;
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
