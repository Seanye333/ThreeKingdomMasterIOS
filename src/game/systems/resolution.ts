import type {
  City,
  Command,
  DiplomaticState,
  EntityId,
  Force,
  GameDate,
  Officer,
  ReportEntry,
  SeasonReport,
} from '../types';
import { OATH_BONDS, type OathBond } from '../data/bonds';
import { isHostilePermitted } from '../types';
import { generateTerritories, terrainRoute, positionAlongRoute, marchDestCoords, type Territory } from '../data/territories';
import { terrainMarchCost, describeBattleSite, geoToPixel, WORLD_SCALE, isLand } from '../data/geography';
import { navalEngagement } from './navalBattle';
import { cityPos } from '../data/cityGeo';
import { marchDurationFor } from '../data/cities';
import { FACILITY_DEFS, type Fort } from '../types/fort';
import { advanceSeason } from '../state/gameState';
import { processAging } from './aging';
import { evaluateGovernors } from './governorEval';
import { handleSearch, resolveInternalAffairs, type LostItemRef } from './commands';
import { awardInternalAffairsXp, canBreakthrough, breakthroughCost, breakthroughIronCost, applyBreakthrough, defaultBreakthroughPath, grantXp, tickMentorBonds, specialTraining } from './growth';
import { officerGrade, gradeRank, officerLevel } from './officerGrade';
import { handleMarch } from './combat';
import { tickDiplomacy, applyCoalitionPressure } from './diplomacy';
import { tickCityEconomy, tradeTreatyGrants } from './economy';
import { WARHORSE_CITY_CAP, IRON_CITY_CAP, MEDICINE_CITY_CAP } from './market';
import {
  specialtyControl, specialtyRealmEffects, allRoleEffects, embargoedRolesAgainst,
  type SpecialtyControl, type SpecialtyRealmEffects, type SpecialtyRole,
} from '../data/specialties';
import { buildingBonuses, schoolHeadmasterFocus } from './buildings';
import { citySize, citySizeRank, CAPITAL_LOYALTY_BONUS } from './citySize';
import { corruptionAccrualMultiplier } from './traitEffects';
import { rollCivicEvents } from './civicEvents';
import { settleRefugees, REFUGEE_SHED_FRAC } from './refugees';
import { stepConvoys, resolveConvoyRaids, resolveRaidStrike, provisionNeeded, consumeRations, type Convoy, type ConvoyRaid } from './convoy';
import { forcedMarchAttrition, cautiousAttritionMul, paceExposureMul } from './marchPace';
import { stepExpeditions, expeditionSpeedMul } from './expedition';
import { embassyTargets, embassyLegSeasons } from './foreignRealm';
import type { Expedition, ExpeditionMode } from '../types';
import { appointmentBonusFor } from './appointmentEffects';
import { MILITARY_RANKS_BY_ID } from '../data/titles';
import { peerageEffects, peerageTier } from '../data/peerage';
import { honorificEffects } from '../data/honorifics';
import { rollEvents } from './events';
import { generateFictionalOfficer } from './officerGen';
import { resolveAmbitions } from './ambition';
import { tickClans, clanGentryWeight } from './clans';
import { tickStatecraft } from './statecraft';
import { deriveCourtFactions, type FactionId } from './courtFactions';
import { cliqueBackingBoost } from './relationshipEffects';

export interface ResolutionInput {
  date: GameDate;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  pendingCommands: Record<EntityId, Command>;
  diplomacy: DiplomaticState;
  runtimeBonds: OathBond[];
  /** Pairwise officer rapport (好感, −100..100) — flows into combat for graded
   *  same-side synergy/friction beyond forged bonds. */
  rapport?: Record<string, number>;
  /** 君臣好感 — per-officer regard for their lord; feeds ambition (心腹 never
   *  turns; resentment emboldens) and 策反 resistance. */
  lordRapport?: Record<EntityId, number>;
  lostItems: LostItemRef[];
  /** Phase 3c — current per-territory owner overrides (null/missing
   *  means inherit from parent city). */
  territoryOwnership?: Record<EntityId, EntityId | null>;
  /** Player's force — used to summarise their territory gains/losses. */
  playerForceId?: EntityId | null;
  /** Runtime family relations — flow through into combat for kinship bonuses. */
  family?: import('../types/family').FamilyRelation[];
  /** 家門聲望 — clan standings, for 門閥 weighting in court-faction coup math. */
  clanStandings?: Record<string, import('../types').ClanStanding>;
  /** Civic-title appointments — drive force-wide bonuses in commands + combat. */
  appointments?: import('../types').Appointment[];
  /** 考課・連續考績 — prefect officerId → signed streak, compounded each annual review. */
  governorEvalStreaks?: Record<EntityId, number>;
  /** Active 討伐令 marks — combat power +10% from issuer toward target. */
  casusBelliMarks?: Array<{ byForceId: EntityId; targetForceId: EntityId; expiresYear: number; expiresSeason: 'spring' | 'summer' | 'autumn' | 'winter' }>;
  /** Transient 求賢令 recruit multipliers — folded into recruit commands. */
  recruitBonusSeasons?: Record<EntityId, { multiplier: number; seasonsLeft: number }>;
  /** Strategic-map installations (箭樓/投石臺/陣/防壁) that act on passing armies. */
  forts?: Record<EntityId, Fort>;
  /** 野外據點 — a ford (渡口/津) held by a hostile force stalls crossings. */
  sites?: Record<EntityId, import('../types').WildSite>;
  /** City buildings — disaster works mitigate the event rolls. */
  buildings?: import('../types').Building[];
  /** 稅率 — per-force taxation; missing entries resolve to 'normal'. */
  taxPolicy?: Record<EntityId, import('../types').TaxRate>;
  /** 通商條約 — force ids the player has trade treaties with (mutual income). */
  tradePartners?: EntityId[];
  /** 通貨膨脹 — the player's inflation level (0–100); saps player tax income. */
  inflation?: number;
  /** 禁運 — standing 專營 embargoes (monopolist cuts a rival off a good). */
  embargoes?: import('../data/specialties').Embargo[];
  /** 輜重 — supply convoys in transit between the player's cities. */
  convoys?: Record<EntityId, Convoy>;
  /** 主動劫糧 — raiding columns hunting enemy supply convoys. */
  raids?: Record<EntityId, ConvoyRaid>;
  /** 游历 — lone officers roaming abroad (any force), in transit. */
  expeditions?: Record<EntityId, Expedition>;
  /** 細作開眼 — per-city intel ticks; expeditions light fresh intel here. */
  espionageReveals?: Record<EntityId, number>;
  /** 遠邦關係 — player's standing with each distant realm (0–100). */
  realmRelations?: Record<string, number>;
  /** 常運糧道 — player standing routes; each season auto-ships surplus grain. */
  standingRoutes?: Array<{ fromCityId: EntityId; toCityId: EntityId }>;
  /** 流民 — the realm-wide pool of displaced people carried between seasons. */
  refugees?: number;
  rng?: () => number;
  weather?: import('./weather').Weather;
  /** 武將壽命 — old-age death rule (see GameState.lifespanMode). Defaults to
   *  'historical'. */
  lifespanMode?: 'historical' | 'fictionalImmortal' | 'immortal';
  /** 武將壽命長短 — multiplier on the old-age death chance. Default 'historical'. */
  lifespanLength?: 'short' | 'historical' | 'long';
  /** 變老不影響屬性 — when true, aging does not drift the five 圍. Default false. */
  agingStatLock?: boolean;
  /** 不會戰死 — when true, no officer is killed in battle (wounded/captured
   *  instead). Folded into single combat here; tactical/瀕死 handled in store. */
  noBattleDeath?: boolean;
  /** 起死回生 — when true, the yearly tick may return dead officers to life. */
  reviveDeadOfficers?: boolean;
  /** 在野登場 — multiplier on 搜索人才 success chance. Default 1. */
  searchSuccessMul?: number;
  /** 單挑頻率 — multiplier on the field-duel trigger chance. Default 1. */
  duelChanceMul?: number;
  /** 天災頻率 — multiplier on famine/plague/flood chances. Default 1. */
  disasterMul?: number;
  /** 新武將登場 — per-season chance a brand-new fictional officer appears as a
   *  free agent. 0 (default) = off. */
  newOfficerChance?: number;
  /**
   * True when this period transition crosses a season boundary (every 9
   * periods). Per-season ticks (economy, harvest, plague, etc.) only fire
   * when this is true. Defaults to true for backward compat.
   */
  seasonBoundary?: boolean;
}

export interface ResolutionOutput {
  date: GameDate;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  diplomacy: DiplomaticState;
  lostItems: LostItemRef[];
  /** 流民 — the refugee pool after this season's shedding + resettlement. */
  refugees: number;
  report: SeasonReport;
  /**
   * Marches still in transit (seasonsRemaining > 1 at start of resolution).
   * The store assigns these to next season's pendingCommands instead of
   * the usual {} reset, so the army keeps marching.
   */
  keptCommands?: Record<EntityId, Command>;
  /** Phase 3c — territory ownership map after capture stamps applied. */
  territoryOwnership?: Record<EntityId, EntityId | null>;
  /** Persistent field armies still on the map after this season (derived
   *  from in-transit marches — the canonical "unit on the map" layer). */
  armies?: Record<EntityId, import('../types').Army>;
  /** 輜重 — supply convoys still in transit after this season's step. */
  convoys?: Record<EntityId, Convoy>;
  /** 主動劫糧 — raiding columns still hunting after this season's step. */
  raids?: Record<EntityId, ConvoyRaid>;
  /** 游历 — roaming officers still in transit after this season's step. */
  expeditions?: Record<EntityId, Expedition>;
  /** 細作開眼 — per-city intel ticks after expeditions lit fresh intel. */
  espionageReveals?: Record<EntityId, number>;
  /** 安邊 — tribe-aggression deltas from 遠使 embassies (tribeId → delta). */
  expeditionAggressionDeltas?: Record<string, number>;
  /** 邦交 — prestige/天命 deltas from 遠使 embassies (forceId → delta). */
  expeditionMandateDeltas?: Record<string, number>;
  /** 通商 — realms a player embassy opened this step (realmId → frontier city). */
  expeditionRealmsOpened?: Record<string, EntityId>;
  /** 遠邦關係 — relation deltas from player embassies (realmId → delta). */
  expeditionRealmRelationDeltas?: Record<string, number>;
  /** Field-battle sites this season (ambush/camp-storm/clash) to mark on the
   *  map. Coords in 1000×720 map space. */
  fieldBattleMarks?: Array<{
    x: number; y: number; kind: 'ambush' | 'camp' | 'clash';
    aColor?: string; bColor?: string; winner?: -1 | 1; winName?: string;
    aTroops?: number; bTroops?: number;
  }>;
  /** Player-involved field clashes deferred to interactive tactical battles
   *  (AI 亲征) — the store fights these after the season report. */
  pendingFieldBattles?: Array<{ playerArmyId: EntityId; enemyArmyId: EntityId; x: number; y: number }>;
  /** 守城戰 — AI columns arriving at a defended player city this season,
   *  deferred to interactive defence battles (fought after the report).
   *  Troops are already deducted from the source city; survivors return
   *  only if the assault is repelled. */
  pendingSiegeDefenses?: Array<{
    sourceCityId: EntityId; targetCityId: EntityId;
    officerIds: EntityId[]; troops: number;
  }>;
  /** Pending delayed effects from stratagems (e.g. 截糧 troop drain). */
  delayedEffects?: Array<{ targetCityId?: EntityId; seasons: number; perSeason: number }>;
  /**
   * Heroic-deed deltas to apply this turn — bumped by individual systems
   * (combat duels, espionage successes, civic affairs commands, etc.).
   * Store aggregates and applies to state.deeds.
   */
  deedDeltas?: Array<{ officerId: EntityId; patch: Partial<import('../types').HeroicDeeds> }>;
  /** 考課 (annual, winter) — updated 連續考績 streaks to persist. */
  governorEvalStreaks?: Record<EntityId, number>;
  /** 考課罷免 — prefect seats forfeit to chronic 下考 (AI realms only). */
  governorRevocations?: import('./governorEval').GovernorRevocation[];
  /** 治世之效 — 天命 deltas for realms of all-上考 stewards (forceId → delta). */
  governorMandateDeltas?: Record<EntityId, number>;
  /** 考課・去年考績 — per-prefect last grade, for the 考課 panel + 親裁. */
  governorReviewLast?: import('./governorEval').GovernorEvalResult['reviewLast'];
}

export function resolveSeason(input: ResolutionInput): ResolutionOutput {
  const rng = input.rng ?? Math.random;
  let cities: Record<EntityId, City> = { ...input.cities };
  let officers: Record<EntityId, Officer> = { ...input.officers };
  let forces: Record<EntityId, Force> = { ...input.forces };
  let lostItems: LostItemRef[] = [...input.lostItems];
  // 流民 — pool carried in from last season; this season's famine/unrest sheds
  // more into it, then welcoming cities resettle a share of it (see settleRefugees).
  let refugeePool = input.refugees ?? 0;
  let refugeesShed = 0;
  const entries: ReportEntry[] = [];
  // 考課 outputs (annual, winter boundary) — surfaced to the store to commit.
  let governorEvalStreaksOut: Record<EntityId, number> | undefined;
  let governorRevocationsOut: import('./governorEval').GovernorRevocation[] | undefined;
  let governorMandateDeltasOut: Record<EntityId, number> | undefined;
  let governorReviewLastOut: import('./governorEval').GovernorEvalResult['reviewLast'] | undefined;
  // 武功 — deed deltas accumulated this turn
  const deedDeltas: Array<{ officerId: EntityId; patch: Partial<import('../types').HeroicDeeds> }> = [];
  const bumpDeed = (officerId: EntityId, patch: Partial<import('../types').HeroicDeeds>) => {
    deedDeltas.push({ officerId, patch });
  };

  // 1. Process commands. Marches first, then internal affairs.
  // Multi-season march: if seasonsRemaining > 1, the army is still on the
  // road — decrement and keep for next season instead of resolving now.
  const allCmds = Object.values(input.pendingCommands);
  const allMarches = allCmds.filter((c): c is Extract<Command, { type: 'march' }> =>
    c.type === 'march',
  );
  const internals = allCmds.filter((c) => c.type !== 'march');

  // Phase 3i — mid-route interception. Two hostile armies whose current
  // map positions overlap this season clash in the field before either
  // reaches its destination. Loser's march is cancelled (survivors stream
  // back to source); winner takes lighter losses and marches on.
  const armyPosition = (cmd: Extract<Command, { type: 'march' }>) => {
    // A dug-in garrison sits exactly on the cell it is holding, not at a
    // fraction along a route — so split detachments and arrived garrisons
    // stay put where they were placed (otherwise they snap to the route
    // midpoint and re-merge with their parent).
    if (cmd.holding && cmd.targetX != null && cmd.targetY != null) {
      return { x: cmd.targetX, y: cmd.targetY };
    }
    const src = cities[cmd.cityId];
    const dst = marchDestCoords(cmd, cities);
    if (!src || !dst) return null;
    const sp = cityPos(src);
    const route = terrainRoute(sp.x, sp.y, dst.x, dst.y);
    const total = Math.max(1, cmd.totalSeasons ?? 1);
    const remaining = cmd.seasonsRemaining ?? 1;
    const elapsed = total - remaining;
    const t = Math.min(0.95, Math.max(0.05, (elapsed + 0.5) / total));
    return positionAlongRoute(route, t);
  };
  const fieldStats = (cmd: Extract<Command, { type: 'march' }>) => {
    const cmdr = officers[cmd.officerId];
    if (!cmdr) return { blended: 0, power: 0 };
    const pool = [cmdr, ...(cmd.additionalOfficerIds ?? [])
      .map((id) => officers[id])
      .filter((o): o is Officer => !!o)];
    const blended = pool.reduce((s, o) => s + o.stats.war * 0.6 + o.stats.leadership * 0.4, 0) / pool.length;
    return { blended, power: blended * Math.sqrt(Math.max(1, cmd.troops)) };
  };
  // Best intelligence among an army's officers — a wise commander scouts
  // ahead and sees through enemy ambushes (识破伏兵).
  const armyMaxIntel = (cmd: Extract<Command, { type: 'march' }>) =>
    Math.max(0, ...[cmd.officerId, ...(cmd.additionalOfficerIds ?? [])]
      .map((id) => officers[id]?.stats.intelligence ?? 0));
  // Camps stormed this season → the victor seizes the broken camp's ground.
  const campSeizures: Array<{ x: number; y: number; forceId: EntityId }> = [];
  // Field-battle sites to mark on the map this season.
  const fieldBattleMarks: Array<{
    x: number; y: number; kind: 'ambush' | 'camp' | 'clash';
    aColor?: string; bColor?: string; winner?: -1 | 1; winName?: string;
    aTroops?: number; bTroops?: number;
  }> = [];
  // Build a field BattleDetail; `atk` is the victor side, `def` the loser.
  type FieldSide = {
    forceId: EntityId | null; commanderId: EntityId; companionIds: EntityId[];
    troops: number; blended: number; power: number; losses: number;
  };
  const makeFieldBattle = (cityId: EntityId, atk: FieldSide, def: FieldSide) => ({
    cityId,
    attacker: { forceId: atk.forceId, commanderId: atk.commanderId, companionIds: atk.companionIds, troops: atk.troops, bondBonus: 0, blendedStat: Math.round(atk.blended * 10) / 10, power: Math.round(atk.power) },
    defender: { forceId: def.forceId, commanderId: def.commanderId, companionIds: def.companionIds, troops: def.troops, bondBonus: 0, blendedStat: Math.round(def.blended * 10) / 10, power: Math.round(def.power) },
    cityDefense: 0, defenseFactor: 1, attackerWins: true, cityFalls: false,
    attackerLosses: atk.losses, defenderLosses: def.losses, field: true,
  });
  const cancelledMarchOfficers = new Set<EntityId>();
  const troopOverride: Record<EntityId, number> = {};
  // Player-involved clashes deferred to an interactive tactical battle (AI
  // 亲征) — the armies are left intact this season and the battle is fought
  // after the report; these officers are skipped by the abstract passes.
  const deferredOfficers = new Set<EntityId>();
  const pendingFieldBattles: Array<{ playerArmyId: EntityId; enemyArmyId: EntityId; x: number; y: number }> = [];
  const INTERCEPT_DIST = 55 * WORLD_SCALE;   // scaled ×1.21, then ×WORLD_SCALE
  for (let i = 0; i < allMarches.length; i++) {
    for (let j = i + 1; j < allMarches.length; j++) {
      const a = allMarches[i];
      const b = allMarches[j];
      if (cancelledMarchOfficers.has(a.officerId) || cancelledMarchOfficers.has(b.officerId)) continue;
      if (deferredOfficers.has(a.officerId) || deferredOfficers.has(b.officerId)) continue;
      const oa = officers[a.officerId];
      const ob = officers[b.officerId];
      if (!oa?.forceId || !ob?.forceId || oa.forceId === ob.forceId) continue;
      if (!isHostilePermitted(input.diplomacy, oa.forceId, ob.forceId)) continue;
      const pa = armyPosition(a);
      const pb = armyPosition(b);
      if (!pa || !pb) continue;
      // 行軍暴露 — a forced-marched column (strung out) is caught at longer range;
      // a cautious, screened one is harder to run down. Use the more exposed side.
      const catchDist = INTERCEPT_DIST * Math.max(paceExposureMul(a.pace), paceExposureMul(b.pace));
      if (Math.hypot(pa.x - pb.x, pa.y - pb.y) > catchDist) continue;

      // AI 亲征 — a significant clash involving the player is handed off to an
      // interactive tactical battle instead of being auto-resolved here. Both
      // columns are left intact this season; the battle is fought after the
      // season report and its result writes back to the armies. Capped per
      // season so the player isn't dragged into a string of battles in one
      // turn — clashes past the cap resolve abstractly as usual.
      const pf = input.playerForceId;
      const MAX_FIELD_BATTLES = 2;
      if (pf && (oa.forceId === pf || ob.forceId === pf)
        && a.troops >= 2500 && b.troops >= 2500
        && pendingFieldBattles.length < MAX_FIELD_BATTLES) {
        const playerCmd = oa.forceId === pf ? a : b;
        const enemyCmd = oa.forceId === pf ? b : a;
        pendingFieldBattles.push({
          playerArmyId: playerCmd.officerId,
          enemyArmyId: enemyCmd.officerId,
          x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2,
        });
        deferredOfficers.add(a.officerId);
        deferredOfficers.add(b.officerId);
        continue;
      }

      // Field clash. A dug-in army (holding) fights from an earthwork camp,
      // with a power bonus that grows with terrain cover (mountains/forest/
      // river crossings). That bonus is dual-purpose:
      //   • if the dug-in side WINS → it sprang an ambush (设伏破敌);
      //   • if it LOSES despite the cover → its camp was stormed (拔寨).
      // A moving column led by a wise commander scouts ahead and partly sees
      // through the trap, blunting the dug-in bonus (识破伏兵).
      const statsA = fieldStats(a);
      const statsB = fieldStats(b);
      const aHolds = !!a.holding && !b.holding;
      const bHolds = !!b.holding && !a.holding;
      const oneHolds = aHolds || bHolds;
      const AMBUSH_BASE = 0.3, COVER_SCALE = 0.45, COVER_CAP = 0.55;
      // The mover (the side NOT dug in) is the one who can detect the ambush.
      const moverCmd = aHolds ? b : bHolds ? a : null;
      const moverIntel = moverCmd ? armyMaxIntel(moverCmd) : 0;
      const detect = oneHolds ? Math.min(0.5, Math.max(0, (moverIntel - 70) / 80)) : 0;
      const holdBonus = (p: { x: number; y: number }) =>
        (AMBUSH_BASE + Math.min(COVER_CAP, terrainMarchCost(p.x, p.y) * COVER_SCALE)) * (1 - detect);
      const multA = aHolds ? 1 + holdBonus(pa) : 1;
      const multB = bHolds ? 1 + holdBonus(pb) : 1;
      // 水戰 — a clash on open water is a fleet engagement: the abler admiral
      // may loose fire-ships (赤壁) and break the enemy, weather permitting.
      const clashMidX = (pa.x + pb.x) / 2, clashMidY = (pa.y + pb.y) / 2;
      const onWater = !isLand(clashMidX, clashMidY, 0);
      const naval = onWater
        ? navalEngagement({
            aIntel: armyMaxIntel(a), bIntel: armyMaxIntel(b),
            aName: officers[a.officerId]?.name.zh ?? '?',
            bName: officers[b.officerId]?.name.zh ?? '?',
            weatherKind: input.weather?.kind ?? 'clear',
            windPower: input.weather?.windPower ?? 0,
            rng: input.rng ?? Math.random,
          })
        : { aMul: 1, bMul: 1, fire: null as 'a' | 'b' | null, recapZh: undefined as string | undefined, recapEn: undefined as string | undefined };
      const aWins = statsA.power * multA * naval.aMul >= statsB.power * multB * naval.bMul;
      const winner = aWins ? a : b;
      const loser = aWins ? b : a;
      const wStats = aWins ? statsA : statsB;
      const lStats = aWins ? statsB : statsA;
      const holderWon = (aHolds && aWins) || (bHolds && !aWins);
      const ambush = oneHolds && holderWon;        // dug-in sprang the trap
      const campStormed = oneHolds && !holderWon;  // dug-in camp overrun
      const detected = oneHolds && detect >= 0.25; // scout saw it coming
      const winnerCmdr = officers[winner.officerId];
      const loserCmdr = officers[loser.officerId];
      // Sprung ambush: lopsided. Stormed camp: the dug-in defenders are
      // overrun (heavy), the stormers pay a price breaching the earthworks.
      const winnerCasualty = Math.floor(winner.troops * (ambush ? 0.12 : campStormed ? 0.25 : 0.2));
      const loserCasualty = Math.floor(loser.troops * (ambush ? 0.72 : campStormed ? 0.75 : 0.6));
      // Storming a camp seizes the ground it held for the victor.
      if (campStormed && winnerCmdr?.forceId) {
        const lp = aWins ? pb : pa;
        campSeizures.push({ x: lp.x, y: lp.y, forceId: winnerCmdr.forceId });
      }
      // Mark the clash site on the map — carry the real outcome so the
      // world-map melee replays THIS fight (right victor, sizes, colours).
      const aFid = officers[a.officerId]?.forceId;
      const bFid = officers[b.officerId]?.forceId;
      fieldBattleMarks.push({
        x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2,
        kind: ambush ? 'ambush' : campStormed ? 'camp' : 'clash',
        aColor: (aFid && forces[aFid]?.color) || undefined,
        bColor: (bFid && forces[bFid]?.color) || undefined,
        winner: aWins ? -1 : 1,
        winName: winnerCmdr?.name.zh,
        aTroops: a.troops,
        bTroops: b.troops,
      });
      // Casualties are drawn from each army's source city (troops are
      // notionally still there until the march resolves).
      const winSrc = cities[winner.cityId];
      const loseSrc = cities[loser.cityId];
      if (winSrc) cities[winSrc.id] = { ...winSrc, troops: Math.max(0, winSrc.troops - winnerCasualty) };
      if (loseSrc) cities[loseSrc.id] = { ...loseSrc, troops: Math.max(0, loseSrc.troops - loserCasualty) };
      troopOverride[winner.officerId] = Math.max(0, winner.troops - winnerCasualty);
      cancelledMarchOfficers.add(loser.officerId);
      // Free the loser's commander + companions so they idle at source.
      for (const id of [loser.officerId, ...(loser.additionalOfficerIds ?? [])]) {
        const o = officers[id];
        if (o) officers[id] = { ...o, task: null, status: 'idle' };
      }
      const wName = winnerCmdr?.name ?? { en: '?', zh: '？' };
      const lName = loserCmdr?.name ?? { en: '?', zh: '？' };
      // Structured detail so the report entry is clickable → full battle
      // breakdown, reusing the city-battle report UI. Field battle: no
      // walls, so defenseFactor 1 / cityDefense 0. Nominal location = the
      // victor's objective city.
      const fieldBattle = {
        cityId: winner.targetCityId,
        attacker: {
          forceId: winnerCmdr?.forceId ?? null,
          commanderId: winner.officerId,
          companionIds: winner.additionalOfficerIds ?? [],
          troops: winner.troops,
          bondBonus: 0,
          blendedStat: Math.round(wStats.blended * 10) / 10,
          power: Math.round(wStats.power),
        },
        defender: {
          forceId: loserCmdr?.forceId ?? null,
          commanderId: loser.officerId,
          companionIds: loser.additionalOfficerIds ?? [],
          troops: loser.troops,
          bondBonus: 0,
          blendedStat: Math.round(lStats.blended * 10) / 10,
          power: Math.round(lStats.power),
        },
        cityDefense: 0,
        defenseFactor: 1,
        attackerWins: true,
        cityFalls: false,
        attackerLosses: winnerCasualty,
        defenderLosses: loserCasualty,
        field: true,
        ambush,
        campAssault: campStormed,
        detected,
      };
      const detEn = detected ? `${wName.en}'s scouts saw the trap; ` : '';
      const detZh = detected ? `${wName.zh}早察其謀,` : '';
      // 火攻 recap prefix when fire-ships decided a water clash.
      const navEn = naval.fire ? `${naval.recapEn}. ` : '';
      const navZh = naval.fire ? `${naval.recapZh}！` : '';
      // Name the ground the clash was fought on — 「漢水之濱」「秦嶺山中」.
      const site = describeBattleSite((pa.x + pb.x) / 2, (pa.y + pb.y) / 2);
      const siteZh = site ? `於${site.zh}` : '於行軍途中';
      const siteEn = site ? ` ${site.en}` : ' on the march';
      entries.push({
        cityId: winner.targetCityId,
        kind: 'battle',
        text: navEn + (ambush
          ? `Ambush: ${wName.en} lay in wait${siteEn} and fell upon ${lName.en}'s column, shattering it (−${winnerCasualty} vs −${loserCasualty}). ${lName.en}'s advance is broken.`
          : campStormed
            ? `Camp stormed: ${detEn}${wName.en} overran ${lName.en}'s dug-in camp${siteEn} and seized the ground (−${winnerCasualty} vs −${loserCasualty}).`
            : `${onWater ? 'Naval clash' : 'Field clash'}: ${wName.en} intercepted ${lName.en}${siteEn} and routed them (−${winnerCasualty} vs −${loserCasualty}). ${lName.en}'s advance is broken.`),
        textZh: navZh + (ambush
          ? `伏擊：${wName.zh}${siteZh}設伏以待,驟擊${lName.zh}之軍而潰之（我軍 −${winnerCasualty}，敵軍 −${loserCasualty}）。${lName.zh}之進軍受挫。`
          : campStormed
            ? `拔寨：${detZh}${wName.zh}${siteZh}強攻${lName.zh}之營寨,破之而據其地（我軍 −${winnerCasualty}，敵軍 −${loserCasualty}）。`
            : `${onWater ? '水戰' : '野戰'}：${wName.zh}${siteZh}截擊${lName.zh}並擊潰之（我軍 −${winnerCasualty}，敵軍 −${loserCasualty}）。${lName.zh}之進軍受挫。`),
        battle: fieldBattle,
      });
    }
  }

  // ── Garrison sally interception ──────────────────────────────────
  // A column marching through hostile territory can be engaged by the
  // garrison of a defended city it passes near (not its own target). The
  // city sallies part of its garrison under its best warrior for a field
  // battle, so you can't waltz an army past a defended stronghold.
  const SALLY_DIST = 67 * WORLD_SCALE;   // scaled ×1.21, then ×WORLD_SCALE
  const SALLY_MIN_GARRISON = 4000;
  for (const a of allMarches) {
    if (cancelledMarchOfficers.has(a.officerId) || deferredOfficers.has(a.officerId)) continue;
    const oa = officers[a.officerId];
    if (!oa?.forceId) continue;
    const pos = armyPosition(a);
    if (!pos) continue;
    // Nearest hostile, non-target city within sally range. 行軍暴露 — a forced
    // march is sallied on from further off; a cautious one slips past more often.
    let bestCity: City | null = null;
    let bestD = SALLY_DIST * paceExposureMul(a.pace);
    for (const city of Object.values(cities)) {
      if (!city.ownerForceId || city.ownerForceId === oa.forceId) continue;
      if (city.id === a.targetCityId || city.id === a.cityId) continue;
      if (!isHostilePermitted(input.diplomacy, city.ownerForceId, oa.forceId)) continue;
      if (city.troops < SALLY_MIN_GARRISON) continue;
      const cp = cityPos(city);
      const d = Math.hypot(pos.x - cp.x, pos.y - cp.y);
      if (d < bestD) { bestD = d; bestCity = city; }
    }
    if (!bestCity) continue;
    // Sally leader = strongest idle officer garrisoned in the city.
    const leader = Object.values(officers)
      .filter((o) => o.locationCityId === bestCity!.id && o.forceId === bestCity!.ownerForceId
        && o.status !== 'dead' && o.status !== 'unsearched' && !o.task)
      .sort((p, q) => (q.stats.war * 0.6 + q.stats.leadership * 0.4) - (p.stats.war * 0.6 + p.stats.leadership * 0.4))[0];
    if (!leader) continue;
    const sallyTroops = Math.floor(bestCity.troops * 0.5);
    const sallyBlended = leader.stats.war * 0.6 + leader.stats.leadership * 0.4;
    const sallyPower = sallyBlended * Math.sqrt(Math.max(1, sallyTroops));
    const marchStats = fieldStats(a);
    const defWins = sallyPower >= marchStats.power;
    const marchCmdr = officers[a.officerId];
    const mName = marchCmdr?.name ?? { en: '?', zh: '？' };
    if (defWins) {
      // Column routed: heavy losses, march cancelled, sally takes light losses.
      const marchLoss = Math.floor(a.troops * 0.55);
      const defLoss = Math.floor(sallyTroops * 0.2);
      const mSrc = cities[a.cityId];
      if (mSrc) cities[mSrc.id] = { ...mSrc, troops: Math.max(0, mSrc.troops - marchLoss) };
      cities[bestCity.id] = { ...cities[bestCity.id], troops: Math.max(0, cities[bestCity.id].troops - defLoss) };
      cancelledMarchOfficers.add(a.officerId);
      for (const id of [a.officerId, ...(a.additionalOfficerIds ?? [])]) {
        const o = officers[id];
        if (o) officers[id] = { ...o, task: null, status: 'idle' };
      }
      entries.push({
        cityId: bestCity.id, kind: 'battle',
        text: `${leader.name.en} sallied from ${bestCity.name.en} and broke ${mName.en}'s column on the march (−${marchLoss} vs −${defLoss}).`,
        textZh: `${leader.name.zh}自${bestCity.name.zh}出擊,於途中擊潰${mName.zh}之軍（敵 −${marchLoss}，我 −${defLoss}）。`,
        battle: makeFieldBattle(bestCity.id,
          { forceId: leader.forceId ?? null, commanderId: leader.id, companionIds: [], troops: sallyTroops, blended: sallyBlended, power: sallyPower, losses: defLoss },
          { forceId: oa.forceId ?? null, commanderId: a.officerId, companionIds: a.additionalOfficerIds ?? [], troops: a.troops, blended: marchStats.blended, power: marchStats.power, losses: marchLoss }),
      });
    } else {
      // Column fights through: sally repulsed, both bleed, march continues.
      const defLoss = Math.floor(sallyTroops * 0.5);
      const marchLoss = Math.floor(a.troops * 0.2);
      cities[bestCity.id] = { ...cities[bestCity.id], troops: Math.max(0, cities[bestCity.id].troops - defLoss) };
      const mSrc = cities[a.cityId];
      if (mSrc) cities[mSrc.id] = { ...mSrc, troops: Math.max(0, mSrc.troops - marchLoss) };
      troopOverride[a.officerId] = Math.max(0, (troopOverride[a.officerId] ?? a.troops) - marchLoss);
      entries.push({
        cityId: bestCity.id, kind: 'battle',
        text: `${leader.name.en} sallied from ${bestCity.name.en} but was repulsed by ${mName.en}'s column (−${defLoss} vs −${marchLoss}).`,
        textZh: `${leader.name.zh}自${bestCity.name.zh}出擊,反為${mName.zh}之軍所卻（我 −${defLoss}，敵 −${marchLoss}）。`,
        battle: makeFieldBattle(bestCity.id,
          { forceId: oa.forceId ?? null, commanderId: a.officerId, companionIds: a.additionalOfficerIds ?? [], troops: a.troops, blended: marchStats.blended, power: marchStats.power, losses: marchLoss },
          { forceId: leader.forceId ?? null, commanderId: leader.id, companionIds: [], troops: sallyTroops, blended: sallyBlended, power: sallyPower, losses: defLoss }),
      });
    }
  }

  // ── Scout warning ────────────────────────────────────────────────
  // A player column's outriders spot a dug-in enemy camp on the road ahead
  // (a potential ambush) before contact. Sight range scales with the
  // commander's intelligence, so a wise general gets earlier warning — and
  // pairs with the 识破 detection that blunts the ambush if it's sprung.
  if (input.playerForceId) {
    const enemyCamps = allMarches.filter((c) =>
      c.holding && !cancelledMarchOfficers.has(c.officerId)
      && officers[c.officerId]?.forceId
      && officers[c.officerId]!.forceId !== input.playerForceId);
    for (const m of allMarches) {
      if (m.holding || cancelledMarchOfficers.has(m.officerId)) continue;
      const mo = officers[m.officerId];
      if (!mo?.forceId || mo.forceId !== input.playerForceId) continue;
      const mp = armyPosition(m);
      if (!mp) continue;
      const scoutRange = (60 + Math.min(72, Math.max(0, armyMaxIntel(m) - 50) * 1.45)) * WORLD_SCALE;   // scaled ×1.21, then ×WORLD_SCALE
      let best: Extract<Command, { type: 'march' }> | null = null;
      let bestD = Infinity;
      for (const camp of enemyCamps) {
        const co = officers[camp.officerId];
        if (!co?.forceId || !isHostilePermitted(input.diplomacy, mo.forceId, co.forceId)) continue;
        const cp = armyPosition(camp);
        if (!cp) continue;
        const d = Math.hypot(mp.x - cp.x, mp.y - cp.y);
        if (d > INTERCEPT_DIST && d < scoutRange && d < bestD) { bestD = d; best = camp; }
      }
      if (best) {
        const co = officers[best.officerId];
        const cName = co?.name ?? { en: '?', zh: '？' };
        const eForce = co?.forceId ? forces[co.forceId]?.name ?? { en: '?', zh: '？' } : { en: '?', zh: '？' };
        const approx = Math.round((best.troops ?? 0) / 100) * 100;
        entries.push({
          cityId: null,
          kind: 'note',
          text: `Scouts report: ${mo.name.en}'s outriders spotted ${eForce.en}'s dug-in camp ahead (${cName.en}, ~${approx}). Possible ambush — beware.`,
          textZh: `斥候回報：${mo.name.zh}前方發現${eForce.zh}之營寨（${cName.zh}部,約${approx}）,恐有埋伏,宜慎之。`,
        });
      }
    }
  }

  // ── 施設 — strategic-map installations act on columns marching within range:
  //   箭樓/投石臺 (ranged) shell hostile columns (投石臺 reaches further, hits
  //     harder) — damage feeds troopOverride and leaves a battle scar;
  //   陣 (supply) reinforces friendly columns back toward full strength;
  //   防壁 (block) stalls hostile columns in transit for a season.
  const blockedOfficers = new Set<EntityId>();
  const facilities = Object.values(input.forts ?? {}).filter((f) => f.facility && f.ownerForceId);
  // 渡口扼守 — a ford held by a force hostile to the marching column stalls
  // its crossing (same 50%/tick stall as a 防壁, applied near the ford).
  const hostileFords = Object.values(input.sites ?? {}).filter((s) => s.subtype === 'ford' && s.ownerForceId);
  const FORD_BLOCK_RANGE = 18 * WORLD_SCALE;
  // 關隘阻路 — a permanent pass-fort (街亭/定軍山/劍閣…) held by a hostile force
  // gates the corridor: a column trying to push past is held up. A 關 is a
  // stronger chokepoint than a ford — wider reach, higher stall chance.
  const hostilePasses = Object.values(input.forts ?? {}).filter((f) => f.subtype === 'fort' && f.ownerForceId);
  const PASS_BLOCK_RANGE = 24 * WORLD_SCALE;
  const PASS_STALL_CHANCE = 0.6;
  const pf = input.playerForceId ?? null;
  if (facilities.length > 0 || hostileFords.length > 0 || hostilePasses.length > 0) {
    for (const cmd of allMarches) {
      if (cancelledMarchOfficers.has(cmd.officerId) || deferredOfficers.has(cmd.officerId)) continue;
      const force = officers[cmd.officerId]?.forceId;
      if (!force) continue;
      const pos = armyPosition(cmd);
      if (!pos) continue;
      let dmg = 0, heal = 0, blocked = false;
      let byPlayer = false; // a player-owned facility contributed damage/block
      // Distinct messaging for a stalled crossing (渡口) vs a barred pass (關隘).
      let crossBlocked: 'ford' | 'pass' | null = null;
      let crossName: { en: string; zh: string } | null = null;
      for (const fd of hostileFords) {
        const [fx, fy] = geoToPixel(fd.coords.lon, fd.coords.lat);
        if (Math.hypot(pos.x - fx, pos.y - fy) > FORD_BLOCK_RANGE) continue;
        if (!isHostilePermitted(input.diplomacy, fd.ownerForceId!, force)) continue;
        if ((input.rng ?? Math.random)() < 0.5) {
          blocked = true;
          crossBlocked = 'ford';
          crossName = fd.name;
          if (fd.ownerForceId === pf) byPlayer = true;
        }
      }
      for (const ps of hostilePasses) {
        const [px2, py2] = geoToPixel(ps.coords.lon, ps.coords.lat);
        if (Math.hypot(pos.x - px2, pos.y - py2) > PASS_BLOCK_RANGE) continue;
        if (!isHostilePermitted(input.diplomacy, ps.ownerForceId!, force)) continue;
        if ((input.rng ?? Math.random)() < PASS_STALL_CHANCE) {
          blocked = true;
          crossBlocked = 'pass';
          crossName = ps.name;
          if (ps.ownerForceId === pf) byPlayer = true;
        }
      }
      for (const f of facilities) {
        const def = FACILITY_DEFS[f.facility!];
        const [fx, fy] = geoToPixel(f.coords.lon, f.coords.lat);
        if (Math.hypot(pos.x - fx, pos.y - fy) > def.range) continue;
        const own = f.ownerForceId === force;
        const hostile = !own && isHostilePermitted(input.diplomacy, f.ownerForceId!, force);
        if (def.effect === 'ranged' && hostile) { dmg += def.power; if (f.ownerForceId === pf) byPlayer = true; }
        else if (def.effect === 'supply' && own) heal += def.power;
        else if (def.effect === 'block' && hostile) {
          // A barricade STALLS rather than pins — 50%/tick, else the column
          // works around it. (A guaranteed stall would freeze the column in
          // radius forever: stalled → no advance → still in radius next tick.)
          if ((input.rng ?? Math.random)() < 0.5) {
            blocked = true;
            if (f.ownerForceId === pf) byPlayer = true;
          }
        }
      }
      if (dmg > 0 || heal > 0) {
        const base = troopOverride[cmd.officerId] ?? cmd.troops;
        let next = base - dmg + heal;
        if (heal > 0) next = Math.min(next, cmd.troops); // 陣 reinforces back to full, no further
        troopOverride[cmd.officerId] = Math.max(0, next);
        if (dmg > 0) fieldBattleMarks.push({ x: pos.x, y: pos.y, kind: 'ambush' });
      }
      // Player-facing feedback — only surface marches the player cares about.
      const nm = officers[cmd.officerId]?.name;
      if (nm) {
        if (dmg > 0 && force === pf) {
          entries.push({ cityId: null, kind: 'battle',
            text: `Enemy facilities shelled ${nm.en}'s column on the march (−${dmg}).`,
            textZh: `敵軍施設於途中轟擊${nm.zh}部，折兵 ${dmg}。` });
        } else if (dmg > 0 && byPlayer) {
          entries.push({ cityId: null, kind: 'battle',
            text: `Your facilities shelled ${nm.en}'s marching column (−${dmg}).`,
            textZh: `我軍施設轟擊${nm.zh}行軍之眾，殺 ${dmg}。` });
        }
        if (blocked && force === pf) {
          entries.push({ cityId: null, kind: 'command-failure',
            text: crossBlocked === 'ford'
              ? `${nm.en}'s crossing at ${crossName?.en ?? 'a ford'} was held off by the enemy — stalled half a month.`
              : crossBlocked === 'pass'
              ? `${nm.en}'s march was barred at ${crossName?.en ?? 'the pass'} — stalled half a month.`
              : `${nm.en}'s march was stalled half a month by an enemy barricade.`,
            textZh: crossBlocked === 'ford'
              ? `${nm.zh}渡${crossName?.zh ?? '津'}為敵所扼，滯留半月。`
              : crossBlocked === 'pass'
              ? `${nm.zh}為敵據${crossName?.zh ?? '關'}所阻，滯留半月。`
              : `${nm.zh}行軍為敵防壁所阻，滯留半月。` });
        } else if (blocked && byPlayer) {
          entries.push({ cityId: null, kind: 'command-success',
            text: crossBlocked === 'ford'
              ? `Your hold on ${crossName?.en ?? 'the ford'} stalled ${nm.en}'s crossing half a month.`
              : crossBlocked === 'pass'
              ? `Your hold on ${crossName?.en ?? 'the pass'} barred ${nm.en}'s march half a month.`
              : `Your barricade stalled ${nm.en}'s march half a month.`,
            textZh: crossBlocked === 'ford'
              ? `我軍扼守${crossName?.zh ?? '津渡'}，阻${nm.zh}半月不得渡。`
              : crossBlocked === 'pass'
              ? `我軍據${crossName?.zh ?? '關'}阻${nm.zh}之師，滯其半月。`
              : `我軍防壁攔阻${nm.zh}之師，滯其半月。` });
        }
      }
      if (blocked) blockedOfficers.add(cmd.officerId);
    }
  }

  const liveMarches = allMarches.filter((c) => !cancelledMarchOfficers.has(c.officerId));
  const withTroops = (c: Extract<Command, { type: 'march' }>) =>
    troopOverride[c.officerId] !== undefined ? { ...c, troops: troopOverride[c.officerId] } : c;
  // Held armies garrison their cell — they don't advance or resolve.
  const explicitlyHeld = liveMarches.filter((c) => c.holding).map(withTroops);
  const moving = liveMarches.filter((c) => !c.holding);
  const arriving = moving.filter((c) => (c.seasonsRemaining ?? 1) <= 1);
  // City-target arrivals assault/merge; open-cell arrivals become garrisons.
  let marches = arriving.filter((c) => c.targetX == null).map(withTroops);

  // ── 守城戰 — an AI column arriving at a garrisoned player city becomes
  // an interactive defence battle instead of an abstract roll. The column
  // is committed (troops leave its source now); survivors stream home only
  // if the walls hold. Capped at one per season.
  const pendingSiegeDefenses: NonNullable<ResolutionOutput['pendingSiegeDefenses']> = [];
  if (input.playerForceId) {
    for (const cmd of marches) {
      if (pendingSiegeDefenses.length >= 1) break;
      const atkOff = officers[cmd.officerId];
      const target = cities[cmd.targetCityId];
      const src = cities[cmd.cityId];
      if (!atkOff?.forceId || !target || !src) continue;
      if (atkOff.forceId === input.playerForceId) continue;
      if (target.ownerForceId !== input.playerForceId) continue;
      if (!isHostilePermitted(input.diplomacy, atkOff.forceId, target.ownerForceId)) continue;
      if (cmd.troops < 2500) continue;
      // The garrison must be able to man the walls — empty cities still
      // fall abstractly.
      const garrison = Object.values(officers).some((o) =>
        o.locationCityId === target.id && o.forceId === input.playerForceId
        && o.status !== 'dead' && o.status !== 'unsearched' && !o.task);
      if (target.troops < 500 || !garrison) continue;
      cities[src.id] = { ...src, troops: Math.max(0, src.troops - cmd.troops) };
      pendingSiegeDefenses.push({
        sourceCityId: src.id,
        targetCityId: target.id,
        officerIds: [cmd.officerId, ...(cmd.additionalOfficerIds ?? [])],
        troops: cmd.troops,
      });
      entries.push({
        cityId: target.id,
        kind: 'battle',
        text: `${atkOff.name.en}'s host (${cmd.troops.toLocaleString()}) is at the gates of ${target.name.en} — man the walls!`,
        textZh: `${atkOff.name.zh}率軍 ${cmd.troops.toLocaleString()} 兵臨${target.name.zh}城下 — 守城戰開！`,
      });
    }
    if (pendingSiegeDefenses.length > 0) {
      const deferredIds = new Set(pendingSiegeDefenses.map((d) => d.officerIds[0]));
      marches = marches.filter((c) => !deferredIds.has(c.officerId));
    }
  }

  const arrivedCells = arriving
    .filter((c) => c.targetX != null)
    .map(withTroops)
    .map((c) => ({ ...c, holding: true }));
  const heldRaw = [...explicitlyHeld, ...arrivedCells];
  const inTransit = moving.filter((c) => (c.seasonsRemaining ?? 1) > 1).map(withTroops);

  // ── Field army merge ────────────────────────────────────────────
  // Friendly holding armies that end the season on the same cell
  // consolidate into one column: the largest absorbs the others' troops
  // and officers, so you can mass garrisons in the open field and they
  // fight (and capture territory) as a single, stronger unit.
  // Kept TIGHT (≈ one cell) so multi-column operations stay multi-column —
  // at the old 29 two pincer columns a city-gap apart would silently fuse;
  // now only armies truly stacked on the same spot consolidate.
  const MERGE_DIST = 15 * WORLD_SCALE;
  const heldPos = heldRaw.map((c) =>
    armyPosition(c) ?? marchDestCoords(c, cities) ?? { x: 0, y: 0 },
  );
  // Greedy spatial clustering by force.
  const clusters: number[][] = [];
  for (let i = 0; i < heldRaw.length; i++) {
    const oi = officers[heldRaw[i].officerId];
    if (!oi?.forceId) { clusters.push([i]); continue; }
    let placed = false;
    for (const cl of clusters) {
      const head = officers[heldRaw[cl[0]].officerId];
      if (head?.forceId !== oi.forceId) continue;
      if (cl.some((mi) =>
        Math.hypot(heldPos[i].x - heldPos[mi].x, heldPos[i].y - heldPos[mi].y) <= MERGE_DIST)) {
        cl.push(i); placed = true; break;
      }
    }
    if (!placed) clusters.push([i]);
  }
  const absorbed = new Set<EntityId>();
  const mergeTroops: Record<EntityId, number> = {};
  const mergeCompanions: Record<EntityId, EntityId[]> = {};
  for (const cl of clusters) {
    if (cl.length < 2) continue;
    // Host = the member with the most troops; the rest fold into it.
    const ordered = [...cl].sort((a, b) => heldRaw[b].troops - heldRaw[a].troops);
    const host = heldRaw[ordered[0]];
    let troops = host.troops;
    const companions = [...(host.additionalOfficerIds ?? [])];
    for (const mi of ordered.slice(1)) {
      const sub = heldRaw[mi];
      troops += sub.troops;
      companions.push(sub.officerId, ...(sub.additionalOfficerIds ?? []));
      absorbed.add(sub.officerId);
    }
    mergeTroops[host.officerId] = troops;
    mergeCompanions[host.officerId] = companions;
    const hostName = officers[host.officerId]?.name ?? { en: '?', zh: '？' };
    const foldedCount = cl.length - 1;
    entries.push({
      cityId: host.targetX != null ? null : host.targetCityId,
      kind: 'note',
      text: `${hostName.en}'s column absorbed ${foldedCount} friendly ${foldedCount > 1 ? 'units' : 'unit'} in the field — now ${troops} strong.`,
      textZh: `${hostName.zh}於野地併合友軍${foldedCount}支,合兵${troops}。`,
    });
  }
  const held = heldRaw
    .filter((c) => !absorbed.has(c.officerId))
    .map((c) => mergeTroops[c.officerId] != null
      ? { ...c, troops: mergeTroops[c.officerId], additionalOfficerIds: mergeCompanions[c.officerId] }
      : c);

  // 隨軍糧 — provision a march from its source city the first season it
  // persists (enough for the planned journey, if the city can spare it), then
  // spend a season's rations. Run dry and the column bleeds deserters; this is
  // what a convoy resupply (or a short campaign) staves off. Applies to every
  // force, so an overextended AI host starves just the same.
  const supplyMarch = (cmd: Extract<Command, { type: 'march' }>): { food: number; troops: number; starved: boolean } => {
    let food = cmd.food;
    if (food === undefined) {
      const src = cities[cmd.cityId];
      const drawn = src ? Math.min(src.food, provisionNeeded(cmd.troops, cmd.totalSeasons ?? 1)) : 0;
      if (src && drawn > 0) cities[cmd.cityId] = { ...src, food: src.food - drawn };
      food = drawn;
    }
    return consumeRations(food, cmd.troops);
  };
  const pfId = input.playerForceId;
  const noteStarve = (cmd: Extract<Command, { type: 'march' }>, gone: boolean) => {
    const cmdr = officers[cmd.officerId];
    if (!cmdr || cmdr.forceId !== pfId) return;
    entries.push({
      cityId: null,
      kind: 'desertion',
      text: gone ? `${cmdr.name.en}'s column starved and scattered on the march.` : `${cmdr.name.en}'s column is out of provisions — men desert.`,
      textZh: gone ? `${cmdr.name.zh}部糧盡潰散於途。` : `${cmdr.name.zh}部糧盡,士卒逃散。`,
    });
  };
  // 孤軍深入 — a column striking deep into ground it does not own bleeds men to
  // harassment and thin foraging each season it is on the road, on top of any
  // ration shortfall. The further the planned strike, the worse the toll — so
  // short supply lines (or a relief convoy) are rewarded. Flat % (no rng) to
  // keep the main resolution stream deterministic.
  const hostileMarchAttrition = (
    cmd: Extract<Command, { type: 'march' }>,
    troops: number,
  ): { troops: number; lost: number } => {
    const dst = cities[cmd.targetCityId];
    const cmdr = officers[cmd.officerId];
    if (!dst || !cmdr?.forceId) return { troops, lost: 0 };
    const owner = dst.ownerForceId;
    if (!owner || owner === cmdr.forceId) return { troops, lost: 0 }; // own land = safe
    if (cmd.returning) return { troops, lost: 0 }; // streaming home over own/cleared ground
    const total = cmd.totalSeasons ?? 1;
    if (total < 3) return { troops, lost: 0 }; // only genuine deep strikes
    // 緩進 — a cautious column forages & rests, halving the toll.
    const frac = Math.min(0.06, 0.015 + total * 0.005) * cautiousAttritionMul(cmd.pace);
    const lost = Math.floor(troops * frac);
    return lost > 0 ? { troops: Math.max(1, troops - lost), lost } : { troops, lost: 0 };
  };
  const noteHarass = (cmd: Extract<Command, { type: 'march' }>, lost: number) => {
    const cmdr = officers[cmd.officerId];
    if (!cmdr || lost <= 0) return;
    // 知敵虛實 — your own column's losses, AND a notable enemy host bleeding from
    // overextension (≥300 lost), so you can read & exploit a rival's deep strike.
    const mine = cmdr.forceId === pfId;
    if (!mine && lost < 300) return;
    entries.push({
      cityId: null,
      kind: 'desertion',
      text: mine ? `${cmdr.name.en}'s column, deep in hostile country, loses ${lost} men to harassment.` : `${cmdr.name.en}'s host, overextended deep in foreign country, sheds ${lost} men.`,
      textZh: mine ? `${cmdr.name.zh}孤軍深入,沿途遭襲,折兵 ${lost} 名。` : `${cmdr.name.zh}孤軍深入,師老兵疲,折兵 ${lost} 名。`,
    });
  };
  // 累毙 — a forced march outruns its stragglers on any road (own land or not).
  const forcedAttrition = (cmd: Extract<Command, { type: 'march' }>, troops: number): { troops: number; lost: number } => {
    const lost = Math.floor(troops * forcedMarchAttrition(cmd.pace));
    return lost > 0 ? { troops: Math.max(1, troops - lost), lost } : { troops, lost: 0 };
  };
  const noteForced = (cmd: Extract<Command, { type: 'march' }>, lost: number) => {
    const cmdr = officers[cmd.officerId];
    if (!cmdr || cmdr.forceId !== pfId || lost <= 0) return;
    entries.push({
      cityId: null,
      kind: 'desertion',
      text: `${cmdr.name.en}'s forced march outruns ${lost} stragglers.`,
      textZh: `${cmdr.name.zh}急行軍,${lost} 名士卒掉隊脫行。`,
    });
  };

  const keptCommands: Record<EntityId, Command> = {};
  const suppliedTroops: Record<EntityId, number> = {};
  const suppliedFood: Record<EntityId, number> = {};
  for (const cmd of inTransit) {
    const s = supplyMarch(cmd);
    if (s.troops <= 0) { noteStarve(cmd, true); continue; } // whole column melted away
    if (s.starved) noteStarve(cmd, false);
    const h = hostileMarchAttrition(cmd, s.troops);
    if (h.lost > 0) noteHarass(cmd, h.lost);
    if (h.troops <= 0) continue;
    const f = forcedAttrition(cmd, h.troops);
    if (f.lost > 0) noteForced(cmd, f.lost);
    suppliedTroops[cmd.officerId] = f.troops;
    suppliedFood[cmd.officerId] = s.food;
    // 防壁 — a barricade in the column's path stalls it this season (no advance).
    const advance = blockedOfficers.has(cmd.officerId) ? 0 : 1;
    keptCommands[cmd.officerId] = {
      ...cmd,
      troops: f.troops,
      food: s.food,
      seasonsRemaining: (cmd.seasonsRemaining ?? 1) - advance,
    };
  }
  // Held marches are carried forward (frozen in place) but still eat — a
  // garrison far from home starves without resupply.
  for (const cmd of held) {
    const s = supplyMarch(cmd);
    if (s.troops <= 0) { noteStarve(cmd, true); continue; }
    if (s.starved) noteStarve(cmd, false);
    const h = hostileMarchAttrition(cmd, s.troops);
    if (h.lost > 0) noteHarass(cmd, h.lost);
    if (h.troops <= 0) continue;
    suppliedTroops[cmd.officerId] = h.troops;
    suppliedFood[cmd.officerId] = s.food;
    keptCommands[cmd.officerId] = { ...cmd, troops: h.troops, food: s.food };
  }

  // Derive the persistent Army layer from marches still on the map next
  // season — in-transit (advancing) and held (frozen at their cell).
  const outArmies: Record<EntityId, import('../types').Army> = {};
  const deriveArmy = (cmd: Extract<Command, { type: 'march' }>, remainingNext: number, holding: boolean) => {
    if (!keptCommands[cmd.officerId]) return; // starved away this season
    const src = cities[cmd.cityId];
    const dst = marchDestCoords(cmd, cities);
    const cmdr = officers[cmd.officerId];
    if (!src || !dst || !cmdr?.forceId) return;
    const total = Math.max(1, cmd.totalSeasons ?? 1);
    const progress = Math.min(0.95, Math.max(0.05, (total - remainingNext) / total));
    const pos = armyPosition({ ...cmd, seasonsRemaining: remainingNext });
    outArmies[cmd.officerId] = {
      id: cmd.officerId,
      forceId: cmdr.forceId,
      commanderId: cmd.officerId,
      companionIds: cmd.additionalOfficerIds ?? [],
      troops: suppliedTroops[cmd.officerId] ?? cmd.troops,
      fromCityId: cmd.cityId,
      targetCityId: cmd.targetCityId,
      x: pos?.x ?? cityPos(src).x,
      y: pos?.y ?? cityPos(src).y,
      progress,
      totalSeasons: total,
      food: suppliedFood[cmd.officerId],
      holding,
      cellTarget: cmd.targetX != null,
      pace: cmd.pace,
      returning: cmd.returning,
      legionBanner: cmd.legionBanner,
    };
  };
  for (const cmd of inTransit) deriveArmy(cmd, (cmd.seasonsRemaining ?? 1) - (blockedOfficers.has(cmd.officerId) ? 0 : 1), false);
  for (const cmd of held) deriveArmy(cmd, cmd.seasonsRemaining ?? 1, true);

  // Phase 3c — territory capture stamps. Every army on the road this
  // season claims the cells along the slice of route it physically
  // covered. Both in-transit and arriving marches contribute.
  const territoryOwnership: Record<EntityId, EntityId | null> = {
    ...(input.territoryOwnership ?? {}),
  };
  const stampRouteSlice = (cmd: Extract<Command, { type: 'march' }>, tStart: number, tEnd: number) => {
    const src = cities[cmd.cityId];
    const dst = marchDestCoords(cmd, cities);
    const cmdr = officers[cmd.officerId];
    if (!src || !dst || !cmdr || !cmdr.forceId) return;
    const territories = generateTerritories(Object.values(cities));
    const sp = cityPos(src);
    const route = terrainRoute(sp.x, sp.y, dst.x, dst.y);
    if (route.length < 2) return;
    // For each territory whose centroid projects between [tStart, tEnd]
    // along the polyline length, claim it for the marching force.
    const segLens: number[] = [];
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const sl = Math.hypot(route[i + 1].x - route[i].x, route[i + 1].y - route[i].y);
      segLens.push(sl); total += sl;
    }
    const sliceStart = tStart * total;
    const sliceEnd = tEnd * total;
    for (const ter of territories) {
      // Distance of this territory's centroid from the polyline, plus its
      // projected arc length. Reject anything not close to the road.
      let acc = 0;
      let bestArc = -1;
      let bestPerp = Infinity;
      for (let i = 0; i < segLens.length; i++) {
        const a = route[i], b = route[i + 1];
        const sl = segLens[i];
        if (sl < 1) { acc += sl; continue; }
        const dx = (b.x - a.x) / sl, dy = (b.y - a.y) / sl;
        const rx = ter.coords.x - a.x, ry = ter.coords.y - a.y;
        const proj = Math.max(0, Math.min(sl, rx * dx + ry * dy));
        const perp = Math.abs(rx * (-dy) + ry * dx);
        if (perp < bestPerp) {
          bestPerp = perp;
          bestArc = acc + proj;
        }
        acc += sl;
      }
      if (bestArc < 0 || bestPerp > 27 * WORLD_SCALE) continue;   // corridor scaled ×1.21, then ×WORLD_SCALE
      if (bestArc < sliceStart || bestArc > sliceEnd) continue;
      territoryOwnership[ter.id] = cmdr.forceId;
    }
  };
  for (const cmd of liveMarches) {
    const total = Math.max(1, cmd.totalSeasons ?? 1);
    if (cmd.holding) {
      // A garrison holds the cell it sits on — stamp a small slice around
      // its frozen position. A cell-target camp holds the route's end cell;
      // a mid-route hold freezes at the fraction it reached.
      const t = cmd.targetX != null
        ? 0.98
        : (total - (cmd.seasonsRemaining ?? 1) + 0.5) / total;
      stampRouteSlice(cmd, Math.max(0, t - 0.04), Math.min(1, t + 0.04));
      continue;
    }
    const remainingAfter = Math.max(0, (cmd.seasonsRemaining ?? 1) - 1);
    const remainingBefore = cmd.seasonsRemaining ?? 1;
    const tStart = (total - remainingBefore) / total;
    const tEnd = (total - remainingAfter) / total;
    stampRouteSlice(cmd, tStart, tEnd);
  }

  // Storming a camp seizes the cells it held for the victor — the routed
  // garrison no longer stamps them, so flip the ground around each broken
  // camp explicitly.
  if (campSeizures.length > 0) {
    const seizeTerr = generateTerritories(Object.values(cities));
    for (const seizure of campSeizures) {
      for (const ter of seizeTerr) {
        if (Math.hypot(ter.coords.x - seizure.x, ter.coords.y - seizure.y) <= 32 * WORLD_SCALE) {   // scaled ×1.21, then ×WORLD_SCALE
          territoryOwnership[ter.id] = seizure.forceId;
        }
      }
    }
  }

  const delayedEffects: Array<{ targetCityId?: EntityId; seasons: number; perSeason: number }> = [];
  for (const cmd of marches) {
    const citiesBefore = cities;
    const outcome = handleMarch(cmd, {
      cities,
      officers,
      rng,
      weather: input.weather,
      delayedEffectsOut: delayedEffects,
      family: input.family,
      runtimeBonds: input.runtimeBonds,
      rapport: input.rapport,
      appointments: input.appointments,
      casusBelliMarks: input.casusBelliMarks,
      date: input.date,
      playerForceId: input.playerForceId ?? null,
      noBattleDeath: input.noBattleDeath ?? false,
      duelChanceMul: input.duelChanceMul ?? 1,
      buildings: input.buildings,
    });
    cities = outcome.cities;
    officers = outcome.officers;
    entries.push(...outcome.entries);
    // Phase 3d — city fell to a new owner this march: clear any captured
    // sub-territory overrides for that city, so its inner cells follow
    // the new owner instead of showing the previous invader's banner.
    for (const cityId of Object.keys(outcome.cities)) {
      const beforeOwner = citiesBefore[cityId]?.ownerForceId;
      const afterOwner = outcome.cities[cityId]?.ownerForceId;
      if (beforeOwner !== afterOwner) {
        const territories = generateTerritories(Object.values(cities));
        for (const ter of territories) {
          if (ter.parentCityId === cityId) {
            delete territoryOwnership[ter.id];
          }
        }
      }
    }
    // 武功 — duels: scan battle entries for duel winners
    for (const e of outcome.entries) {
      if (e.battle && e.battle.duelWinnerId) {
        bumpDeed(e.battle.duelWinnerId, { duelsWon: 1 });
      }
    }
  }

  for (const cmd of internals) {
    const officer = officers[cmd.officerId];
    const city = cities[cmd.cityId];
    if (!officer || !city) continue;
    if (officer.status !== 'idle') continue;
    if (cmd.type === 'search') {
      const result = handleSearch({ officer, city, officers, lostItems, rng, year: input.date.year, successMul: input.searchSuccessMul });
      officers = result.officers;
      lostItems = result.lostItems;
      entries.push(result.entry);
      // 內政經驗 — scouring the city for talent still hones 魅力 over time.
      const searchXp = awardInternalAffairsXp(officers[cmd.officerId] ?? officer, 'search', true, rng, 1, input.date.year);
      officers[cmd.officerId] = searchXp.officer;
      entries.push(...searchXp.entries);
      continue;
    }
    if (cmd.type === 'garrison') {
      // 鎮守 — clear enemy overrides from this city's own satellite cells
      // (the commander drives the raiders off) and reinforce defense.
      // Reclaim effectiveness scales with leadership.
      if (!city.ownerForceId) continue;
      const sats = generateTerritories(Object.values(cities))
        .filter((t) => t.parentCityId === city.id && !t.id.endsWith('-0'));
      let reclaimed = 0;
      for (const ter of sats) {
        const owner = territoryOwnership[ter.id];
        if (owner && owner !== city.ownerForceId) {
          delete territoryOwnership[ter.id];
          reclaimed++;
        }
      }
      const defBoost = Math.max(2, Math.floor(officer.stats.leadership / 20));
      cities[city.id] = {
        ...city,
        defense: Math.min(200, city.defense + defBoost),
      };
      entries.push({
        cityId: city.id,
        kind: 'command-success',
        text: reclaimed > 0
          ? `${officer.name.en} garrisoned ${city.name.en}: reclaimed ${reclaimed} territory cell(s), defense +${defBoost}.`
          : `${officer.name.en} garrisoned ${city.name.en}: defense +${defBoost}.`,
        textZh: reclaimed > 0
          ? `${officer.name.zh}鎮守${city.name.zh}：收復外圍 ${reclaimed} 格，城防 +${defBoost}。`
          : `${officer.name.zh}鎮守${city.name.zh}：城防 +${defBoost}。`,
      });
      bumpDeed(cmd.officerId, { civicWorks: 1 });
      // 內政經驗 — garrison duty hones 統率.
      const garrisonXp = awardInternalAffairsXp(officers[cmd.officerId] ?? officer, 'garrison', true, rng, 1, input.date.year);
      officers[cmd.officerId] = garrisonXp.officer;
      entries.push(...garrisonXp.entries);
      continue;
    }
    if (cmd.type === 'promote-learning') {
      // 興学 — the lecturer endows the schools and holds 講學: every officer
      // garrisoned in this city gains an XP burst, amplified by a 書院/太學
      // (cityBB.xpMul). Turns a culture city into a talent forge.
      if (!city.ownerForceId) continue;
      const lectureBB = buildingBonuses(city.id, input.buildings ?? [], {
        statecraft: forces[city.ownerForceId]?.statecraft ?? null,
        officers, // 山長 amplifies the 講學 xpMul
      });
      const burst = Math.round((10 + officer.stats.intelligence * 0.4) * lectureBB.xpMul);
      // 山長之偏 — a school's headmaster tilts what 講學 teaches (武學堂→武, 書院→智…).
      const lectureFocus = schoolHeadmasterFocus(city.id, input.buildings ?? [], officers);
      const pupils = Object.values(officers).filter(
        (o) => o.locationCityId === city.id && o.forceId === city.ownerForceId,
      );
      for (const pupil of pupils) {
        const taught = grantXp(officers[pupil.id] ?? pupil, burst, rng, lectureFocus ?? undefined, { year: input.date.year });
        officers[pupil.id] = taught.officer;
        entries.push(...taught.entries);
      }
      entries.push({
        cityId: city.id,
        kind: 'command-success',
        text: `${officer.name.en} promoted learning at ${city.name.en}: ${pupils.length} officer(s) gained ${burst} XP each.`,
        textZh: `${officer.name.zh}興学講學於${city.name.zh}：在城 ${pupils.length} 員各得 ${burst} 歷練。`,
      });
      bumpDeed(cmd.officerId, { civicWorks: 1 });
      continue;
    }
    if (cmd.type === 'special-training') {
      // 特訓 — a whole season poured into one officer: big 歷練 along their focus
      // track, with chances at a skill / 性格 / 潛能, and a 養傷 risk on the
      // martial tracks. Gold was paid at issue.
      const tr = specialTraining(officers[cmd.officerId] ?? officer, rng, input.date.year);
      officers[cmd.officerId] = tr.officer;
      entries.push(...tr.entries);
      bumpDeed(cmd.officerId, { trainingsCompleted: 1 });
      continue;
    }
    const bonus = appointmentBonusFor(
      city.ownerForceId,
      input.appointments ?? [],
      officers,
      city.id,
    );
    // Fold 求賢令 transient recruit multiplier on top of civic title bonus.
    const recruitBoost = city.ownerForceId && input.recruitBonusSeasons
      ? input.recruitBonusSeasons[city.ownerForceId]
      : undefined;
    // 城內建築 — 兵營/馬廄/工房/演武場/糧倉署 speed recruiting (recruitMul) and
    // 兵營/馬廄/武庫/糧倉署/驛站/驛傳 raise the per-season recruit ceiling (troopCapMul).
    const cityBB = buildingBonuses(city.id, input.buildings ?? [], {
      statecraft: city.ownerForceId ? (forces[city.ownerForceId]?.statecraft ?? null) : null,
      officers, // 山長 lifts the city's civic XP output too
    });
    const baseRecruitBonus = recruitBoost
      ? bonus.recruitBonus + (recruitBoost.multiplier - 1)
      : bonus.recruitBonus;
    const finalBonus = {
      ...bonus,
      recruitBonus: baseRecruitBonus + (cityBB.recruitMul - 1),
      troopCapMul: cityBB.troopCapMul,
    };
    // 協同施政 — assistants pour their season into the lead's command (paid
    // once at issue). They boost the effective stat and earn their own XP.
    const assistants = (cmd.assistantOfficerIds ?? [])
      .map((aid) => officers[aid])
      .filter((a): a is Officer => !!a);
    const result = resolveInternalAffairs(cmd.type, officer, city, rng, finalBonus, input.weather?.kind, assistants, input.rapport);
    cities[city.id] = applyDelta(city, result.delta);
    const assistNote = assistants.length
      ? { text: ` (協同 ${assistants.map((a) => a.name.en).join(', ')})`, zh: `(協同 ${assistants.map((a) => a.name.zh).join('、')})` }
      : { text: '', zh: '' };
    entries.push({
      cityId: city.id,
      kind: result.success ? 'command-success' : 'command-failure',
      text: result.message + assistNote.text,
      textZh: result.messageZh + assistNote.zh,
    });
    // 武功 — civicWorks bump on successful internal affairs
    if (result.success) bumpDeed(cmd.officerId, { civicWorks: 1 });
    // 內政經驗 — slow stat growth from the work, steered toward the command's
    // stat (政治 for development, 魅力 for people work). Capped/no-op commands
    // grant a reduced trickle inside awardInternalAffairsXp.
    const iaXp = awardInternalAffairsXp(officers[cmd.officerId] ?? officer, cmd.type, result.success, rng, cityBB.xpMul, input.date.year);
    officers[cmd.officerId] = iaXp.officer;
    entries.push(...iaXp.entries);
    // 襄助歷練 — each assistant earns the internal-affairs XP trickle too (they
    // did the work alongside the lead), steered toward the command's stat.
    for (const a of assistants) {
      const axp = awardInternalAffairsXp(officers[a.id] ?? a, cmd.type, result.success, rng, cityBB.xpMul, input.date.year);
      officers[a.id] = axp.officer;
      entries.push(...axp.entries);
      if (result.success) bumpDeed(a.id, { civicWorks: 1 });
    }
  }

  // Phase 3f-quater — 師徒衣缽. Explicit 拜師 bonds resolve first: a disciple
  // apprenticed to a specific master (and garrisoned with them) earns the richer
  // bond XP toward the master's strongest suit, and may inherit their craft.
  const bondTick = tickMentorBonds(officers, rng);
  Object.assign(officers, bondTick.officers);
  entries.push(...bondTick.entries);
  const bonded = bondTick.bonded;

  // Phase 3f-ter — 名將帶新兵. A 金牌+ officer stationed in a city seasons the
  // junior officers garrisoned with them: a small XP trickle to those clearly
  // below the mentor's 歷練. Turns 品階 into a legacy/teaching loop (all forces).
  // Disciples already fed by an explicit bond this season are skipped (no double-dip).
  const MENTOR_XP = 8;
  for (const city of Object.values(cities)) {
    if (!city.ownerForceId) continue;
    const present = Object.values(officers).filter((o) =>
      o.locationCityId === city.id && o.forceId === city.ownerForceId &&
      (o.status === 'idle' || o.status === 'active'));
    if (present.length < 2) continue;
    // Mentor — the highest-grade officer present, provided they're 金牌 or above.
    let mentor: typeof present[number] | null = null;
    let mentorScore = -1;
    for (const o of present) {
      const gi = officerGrade(o);
      if (gradeRank(gi.grade) >= gradeRank('gold') && gi.score > mentorScore) { mentor = o; mentorScore = gi.score; }
    }
    if (!mentor) continue;
    const mLevel = officerLevel(mentor);
    const students = present
      .filter((o) => o.id !== mentor!.id && !bonded.has(o.id) && officerLevel(o) <= mLevel - 3)
      .sort((a, b) => officerLevel(a) - officerLevel(b))
      .slice(0, 3);
    for (const st of students) {
      const r = grantXp(officers[st.id] ?? st, MENTOR_XP, rng);
      officers[st.id] = r.officer;
      entries.push(...r.entries);
    }
  }

  // Phase 3f-bis — AI 突破. Foreign forces invest in their fully-seasoned
  // officers too, so the player's breakthrough edge doesn't compound into a
  // one-sided power gap over a long game. A force only breaks an officer through
  // when its city can spare double the cost (keep a war reserve) and only some
  // seasons (rng), so it ramps gradually rather than all at once.
  for (const o of Object.values(officers)) {
    if (!o.forceId || o.forceId === input.playerForceId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned' || o.status === 'retired') continue;
    if (!canBreakthrough(o).ok) continue;
    const city = o.locationCityId ? cities[o.locationCityId] : null;
    if (!city || city.ownerForceId !== o.forceId) continue;
    const cost = breakthroughCost(o);
    if (city.gold < cost * 2) continue; // keep a reserve
    const iron = breakthroughIronCost(o);
    if ((city.iron ?? 0) < iron) continue; // 淬鍊之鐵 — needs 鐵 like the player does
    if (rng() > 0.5) continue;          // spread breakthroughs across seasons
    const r = applyBreakthrough(o, defaultBreakthroughPath(o)); // AI picks 道 by strength
    officers[o.id] = r.officer;
    cities[city.id] = { ...city, gold: city.gold - cost, iron: (city.iron ?? 0) - iron };
  }

  const seasonBoundary = input.seasonBoundary ?? true;

  // Phase 3g — territory income: precompute satellite cells per city so the
  // economy tick can add +TERRITORY_GOLD per cell the city still controls.
  // Captured cells stop paying their parent city, so losing ground = losing
  // income (on top of the supply-pressure drain below).
  const TERRITORY_GOLD = 5;
  const satellitesByCity: Record<EntityId, Territory[]> = {};
  if (seasonBoundary) {
    for (const ter of generateTerritories(Object.values(cities))) {
      if (ter.id.endsWith('-0')) continue; // cell 0 is the city itself
      (satellitesByCity[ter.parentCityId] ??= []).push(ter);
    }
  }
  const controlledSatellites = (city: City): number => {
    const sats = satellitesByCity[city.id] ?? [];
    let held = 0;
    for (const ter of sats) {
      const owner = territoryOwnership[ter.id];
      // Held if no override (defaults to parent city's force) or override
      // explicitly equals this city's force.
      if (owner == null || owner === city.ownerForceId) held++;
    }
    return held;
  };

  // 名產版圖 — tally every force's realm-wide grip on the strategic goods once
  // per season: it amplifies 名產所恃 policy yields and 醃漬軍糧 upkeep relief in
  // the tick below, and feeds the wound/ship/mint/tribute bonuses downstream.
  type SpecSnap = { control: SpecialtyControl; realm: SpecialtyRealmEffects; roleStrength: Record<SpecialtyRole, number> };
  const specByForce = new Map<EntityId, SpecSnap>();
  if (seasonBoundary) {
    for (const fid of Object.keys(forces)) {
      const control = specialtyControl(cities, fid, embargoedRolesAgainst(fid, input.embargoes));
      specByForce.set(fid, { control, realm: specialtyRealmEffects(control), roleStrength: allRoleEffects(control) });
    }
  }

  // 2. Economy tick per city — only on season boundary (every 9 periods).
  if (seasonBoundary)
  for (const city of Object.values(cities)) {
    // Gather officers stationed in this city for policy effect aggregation.
    const cityOfficers = Object.values(officers).filter(
      (o) => o.locationCityId === city.id && o.status !== 'dead' && o.status !== 'unsearched',
    );
    const tick = tickCityEconomy(
      city,
      input.date.season,
      cityOfficers,
      city.ownerForceId ? (input.taxPolicy?.[city.ownerForceId] ?? 'normal') : 'normal',
      city.ownerForceId === input.playerForceId ? (input.inflation ?? 0) : 0,
      input.weather?.kind ?? 'clear',
      input.buildings,
      city.ownerForceId ? (forces[city.ownerForceId]?.statecraft ?? null) : null,
      city.ownerForceId ? specByForce.get(city.ownerForceId) : undefined,
    );
    const territoryGold = city.ownerForceId
      ? controlledSatellites(city) * TERRITORY_GOLD
      : 0;
    // 向心 — the realm's seat of power (首都/治所) draws extra loyalty each season.
    const isCapital = city.ownerForceId
      ? forces[city.ownerForceId]?.capitalCityId === city.id
      : false;
    const capitalLoyalty = isCapital ? CAPITAL_LOYALTY_BONUS : 0;
    // 禁軍宿衛 — the seat of power musters its own standing guard each season:
    // ~0.4% of the populace report for 宿衛 duty (only when the city is settled
    // enough, 民忠 ≥ 40), capped by the city's troop ceiling. Makes the capital
    // genuinely harder to storm and gives 選都/守都 strategic weight.
    const troopsAfterDesertion = Math.max(0, city.troops - tick.desertion);
    let capitalGuard = 0;
    if (isCapital && city.loyalty >= 40) {
      const cap = citySize(city).troopCap;
      capitalGuard = Math.max(0, Math.min(Math.round(city.population * 0.004), cap - troopsAfterDesertion));
    }
    // 貪腐滋生 — graft creeps up each season in cities left unaudited, faster the
    // wealthier and busier the city (more coin flowing → more to skim). A clean
    // administrator (high 政治 present) slows the rot; a venal/upright officer
    // posted here further speeds/slows it (corruptionAccrualMultiplier). The
    // 巡查肅貪 command claws it back. Only owned cities accrue it.
    const bestPolitics = cityOfficers.reduce((m, o) => Math.max(m, o.stats.politics), 0);
    // A capable administrator SLOWS graft but can't eliminate it — the politics
    // offset is capped at 0.6, so a wealthy city left to coast still accrues a
    // slow drip even under a top official (it just takes much longer to bite).
    const corruptionAccrual = city.ownerForceId
      ? Math.max(0, 0.6 + city.commerce / 120 - Math.min(0.6, bestPolitics / 130))
        * corruptionAccrualMultiplier(cityOfficers)
      : 0;
    const nextCorruption = corruptionAccrual > 0
      ? Math.min(100, (city.corruption ?? 0) + corruptionAccrual)
      : (city.corruption ?? 0);
    // 貪墨生怨 — entrenched graft (≥60) breeds public resentment: a small loyalty
    // bite on top of the gold it already skims, so it can't be ignored forever.
    const corruptionLoyaltyBite = nextCorruption >= 60 ? -1 : 0;
    // 練度弛 — drill fades when the garrison isn't kept at it (about 2/season).
    const nextDrill = city.drill ? Math.max(0, city.drill - 2) : city.drill;
    const updated: City = {
      ...city,
      gold: city.gold + tick.goldIncome + territoryGold,
      food: Math.max(0, city.food + tick.foodIncome - tick.foodUpkeep),
      troops: troopsAfterDesertion + capitalGuard,
      loyalty: Math.max(0, Math.min(100, city.loyalty + tick.loyaltyDelta + capitalLoyalty + corruptionLoyaltyBite)),
      corruption: city.ownerForceId ? nextCorruption : city.corruption,
      drill: nextDrill,
      population: Math.max(1000, city.population + tick.populationDelta),
      warhorses: tick.warhorseBreed > 0
        ? Math.min(WARHORSE_CITY_CAP, (city.warhorses ?? 0) + tick.warhorseBreed)
        : city.warhorses,
      iron: tick.ironSmelt > 0
        ? Math.min(IRON_CITY_CAP, (city.iron ?? 0) + tick.ironSmelt)
        : city.iron,
      medicine: tick.medicineGather > 0
        ? Math.min(MEDICINE_CITY_CAP, (city.medicine ?? 0) + tick.medicineGather)
        : city.medicine,
    };
    cities[city.id] = updated;
    // 貪腐告警 — warn the player when graft crosses a threshold upward in one of
    // their cities, so the hidden gold drain doesn't go unnoticed (mirrors the
    // loyalty-crisis warnings). Fires once per crossing, player force only.
    if (city.ownerForceId && city.ownerForceId === input.playerForceId) {
      const was = city.corruption ?? 0;
      for (const thr of [50, 75]) {
        if (was < thr && nextCorruption >= thr) {
          entries.push({
            cityId: city.id,
            kind: 'command-failure',
            text: `${city.name.en}: corruption has reached ${Math.round(nextCorruption)} — graft is bleeding the treasury. Order 巡查肅貪 to claw it back.`,
            textZh: `${city.name.zh}：貪腐已達 ${Math.round(nextCorruption)} —— 歲入正被蠹蝕,宜遣員巡查肅貪。`,
          });
          break;
        }
      }
    }
    if (capitalGuard > 0) {
      entries.push({
        cityId: city.id,
        kind: 'income',
        text: `${city.name.en}: capital guard +${capitalGuard.toLocaleString()} troops (宿衛).`,
        textZh: `${city.name.zh}：禁軍宿衛 +${capitalGuard.toLocaleString()} 兵。`,
      });
    }
    // 流民 — a shrinking city sheds part of its loss into the wandering pool
    // (famine/unrest drive people out; they don't simply vanish).
    if (tick.populationDelta < 0) {
      refugeesShed += Math.floor(-tick.populationDelta * REFUGEE_SHED_FRAC);
    }
    // ⑥ 升格/降格 — population crossed a size tier this season. A promotion brings
    // an immigration boost in confidence (a one-off loyalty lift); a demotion is
    // a visible blow. Logged so the player feels the city's status change.
    {
      const before = citySize(city);
      const after = citySize(updated);
      if (after.id !== before.id) {
        const grew = citySizeRank(after.id) > citySizeRank(before.id);
        if (grew) {
          cities[city.id] = { ...updated, loyalty: Math.min(100, updated.loyalty + 2) };
        }
        entries.push({
          cityId: city.id,
          kind: grew ? 'income' : 'desertion',
          text: grew
            ? `${city.name.en} has grown into a ${after.name.en}! (民心歸附 +2 loyalty)`
            : `${city.name.en} has dwindled to a ${after.name.en}.`,
          textZh: grew
            ? `${city.name.zh}人口興旺,升格為「${after.name.zh}」!(民心歸附 +2)`
            : `${city.name.zh}人口流散,跌為「${after.name.zh}」。`,
        });
      }
    }
    if (tick.populationDelta !== 0) {
      entries.push({
        cityId: city.id,
        kind: tick.populationDelta > 0 ? 'income' : 'desertion',
        text: `${city.name.en}: 人口 ${tick.populationDelta > 0 ? '+' : ''}${tick.populationDelta.toLocaleString()}.`,
        textZh: `${city.name.zh}：人口 ${tick.populationDelta > 0 ? '+' : ''}${tick.populationDelta.toLocaleString()}。`,
      });
    }

    if (tick.goldIncome > 0 || tick.foodIncome > 0) {
      entries.push({
        cityId: city.id,
        kind: 'income',
        text: `${city.name.en}: +${tick.goldIncome} gold${
          tick.foodIncome ? `, +${tick.foodIncome} food (harvest)` : ''
        }${tick.policyBadges.length ? ` · ${tick.policyBadges.slice(0, 2).join(' · ')}` : ''}.`,
        textZh: `${city.name.zh}：金 +${tick.goldIncome}${
          tick.foodIncome ? `、糧 +${tick.foodIncome}（秋收）` : ''
        }${tick.policyBadges.length ? ` · ${tick.policyBadges.slice(0, 2).join(' · ')}` : ''}。`,
      });
    }
    if (tick.loyaltyDelta !== 0) {
      entries.push({
        cityId: city.id,
        kind: tick.loyaltyDelta > 0 ? 'income' : 'desertion',
        text: `${city.name.en}: 民忠 ${tick.loyaltyDelta > 0 ? '+' : ''}${tick.loyaltyDelta} (policy effect).`,
        textZh: `${city.name.zh}：民忠 ${tick.loyaltyDelta > 0 ? '+' : ''}${tick.loyaltyDelta}（政令之效）。`,
      });
    }
    if (tick.foodUpkeep > 0) {
      entries.push({
        cityId: city.id,
        kind: 'upkeep',
        text: `${city.name.en}: −${tick.foodUpkeep} food (troop upkeep).`,
        textZh: `${city.name.zh}：糧 −${tick.foodUpkeep}（兵糧支用）。`,
      });
    }
    if (tick.desertion > 0) {
      entries.push({
        cityId: city.id,
        kind: 'desertion',
        text: `${city.name.en}: ${tick.desertion} troops deserted from starvation.`,
        textZh: `${city.name.zh}：因缺糧，逃兵 ${tick.desertion} 名。`,
      });
    }
  }

  // 內政事件 — turn the internal-affairs stats into moments: a graft scandal in
  // a corruption-ridden city (貪腐醜聞), a grand review of a drilled garrison
  // (校場揚威), a bumper soldier-farm harvest (屯田豐收). Runs on the post-economy
  // cities so this season's accrued corruption/drill feed the rolls.
  {
    const civic = rollCivicEvents({
      cities,
      season: input.date.season,
      rng,
      playerForceId: input.playerForceId,
    });
    for (const [cid, c] of Object.entries(civic.cities)) cities[cid] = c;
    entries.push(...civic.entries);
  }

  // 流民安置 — fold this season's shed people into the pool, then let welcoming
  // cities (high 民忠 / 輕稅 / 有餘容) resettle a share of it. Season-bounded.
  if (seasonBoundary) {
    refugeePool += refugeesShed;
    if (refugeePool > 0) {
      const flow = settleRefugees({
        pool: refugeePool,
        cities,
        buildings: input.buildings ?? [],
        taxPolicy: input.taxPolicy,
      });
      cities = flow.cities;
      refugeePool = flow.pool;
      for (const s of flow.settled) {
        const c = cities[s.cityId];
        if (!c) continue;
        entries.push({
          cityId: s.cityId,
          kind: 'income',
          text: `${c.name.en}: ${s.count.toLocaleString()} refugees settle (流民歸附).`,
          textZh: `${c.name.zh}：流民歸附 +${s.count.toLocaleString()} 人。`,
        });
      }
    }
  }

  // 通商歲入 — credit each peaceful trade treaty's mutual income to capitals.
  if (seasonBoundary && input.tradePartners && input.tradePartners.length > 0 && input.playerForceId) {
    const grants = tradeTreatyGrants(input.tradePartners, input.diplomacy, input.playerForceId);
    for (const [fid, gold] of Object.entries(grants)) {
      const cap = forces[fid]?.capitalCityId;
      const c = cap ? cities[cap] : undefined;
      if (!cap || !c || c.ownerForceId !== fid) continue;
      // 市舶司 — a maritime trade office at the capital fattens treaty income.
      const tradeMul = buildingBonuses(cap, input.buildings ?? []).tradeMul;
      const credited = Math.round(gold * tradeMul);
      cities[cap] = { ...c, gold: c.gold + credited };
      if (fid === input.playerForceId) {
        entries.push({
          cityId: cap,
          kind: 'income',
          text: `${c.name.en}: +${credited} gold from trade treaties.`,
          textZh: `${c.name.zh}：通商歲入 金 +${credited}。`,
        });
      }
    }
  }

  // Phase 3f — territory supply pressure. If a city's own satellite
  // territories are occupied by an enemy force, the city loses some
  // troops + gold each season from supply disruption / morale damage.
  // Captured cells around an enemy city → enemy city slowly starves.
  if (seasonBoundary) {
    for (const city of Object.values(cities)) {
      if (!city.ownerForceId) continue;
      const sats = satellitesByCity[city.id] ?? [];
      if (sats.length === 0) continue;
      let enemyCount = 0;
      for (const ter of sats) {
        const owner = territoryOwnership[ter.id];
        if (owner && owner !== city.ownerForceId) enemyCount++;
      }
      if (enemyCount === 0) continue;
      const ratio = enemyCount / sats.length;
      // Encirclement primarily starves the garrison — troop drain up, the steep
      // treasury bleed down, so a siege attrits soldiers more than coin.
      const troopLoss = Math.floor(city.troops * ratio * 0.07);
      const goldLoss = Math.floor(city.gold * ratio * 0.10);
      if (troopLoss === 0 && goldLoss === 0) continue;
      cities[city.id] = {
        ...city,
        troops: Math.max(0, city.troops - troopLoss),
        gold: Math.max(0, city.gold - goldLoss),
      };
      const fully = ratio >= 1;
      entries.push({
        cityId: city.id,
        kind: 'desertion',
        text: `${city.name.en} ${fully ? 'is fully encircled' : 'is harassed'} — ${enemyCount}/${sats.length} surrounding territories enemy-held. −${troopLoss} troops, −${goldLoss}g.`,
        textZh: `${city.name.zh}${fully ? '被圍困' : '受騷擾'}：外圍 ${enemyCount}/${sats.length} 格陷敵。兵 −${troopLoss}、金 −${goldLoss}。`,
      });
    }
  }

  // Player territory summary: net cells captured / lost this season via
  // marching (override transitions involving the player force). Closes the
  // feedback loop on the core grid-conquest mechanic.
  const player = input.playerForceId;
  if (player) {
    const before = input.territoryOwnership ?? {};
    let gained = 0;
    let lost = 0;
    const keys = new Set([...Object.keys(before), ...Object.keys(territoryOwnership)]);
    for (const k of keys) {
      const b = before[k] ?? null;
      const a = territoryOwnership[k] ?? null;
      if (b === a) continue;
      if (a === player) gained++;
      else if (b === player) lost++;
    }
    if (gained > 0 || lost > 0) {
      const parts: string[] = [];
      const partsZh: string[] = [];
      if (gained > 0) { parts.push(`gained ${gained} territory cell(s)`); partsZh.push(`佔領 ${gained} 格領地`); }
      if (lost > 0) { parts.push(`lost ${lost}`); partsZh.push(`失守 ${lost} 格`); }
      entries.push({
        cityId: null,
        kind: gained >= lost ? 'conquest' : 'desertion',
        text: `Your forces ${parts.join(', ')} this season.`,
        textZh: `本季我軍${partsZh.join('、')}。`,
      });
    }
  }

  // 2a. Vassal tribute: each vassal force auto-pays 100g/season to its
  // suzerain's capital. If the vassal can't pay, no penalty — they're
  // already a vassal.
  if (seasonBoundary) {
    for (const vassal of Object.values(forces)) {
      if (!vassal.vassalOfForceId) continue;
      const suzerain = forces[vassal.vassalOfForceId];
      if (!suzerain) continue;
      const vCap = cities[vassal.capitalCityId];
      const sCap = cities[suzerain.capitalCityId];
      if (!vCap || !sCap) continue;
      const tribute = Math.min(vCap.gold, 100);
      if (tribute <= 0) continue;
      cities[vCap.id] = { ...vCap, gold: vCap.gold - tribute };
      cities[sCap.id] = { ...cities[sCap.id], gold: cities[sCap.id].gold + tribute };
    }
  }

  // 2b. Military stipend payment — each force pays its officers' rank
  // stipends out of its capital city's gold. Insufficient funds means
  // unpaid arrears (logged) — over time, this hurts loyalty.
  if (seasonBoundary) {
    for (const force of Object.values(forces)) {
      if (!force.capitalCityId) continue;
      const capital = cities[force.capitalCityId];
      if (!capital) continue;
      let stipend = 0;
      for (const o of Object.values(officers)) {
        if (o.forceId !== force.id) continue;
        if (o.status === 'dead' || o.status === 'imprisoned') continue;
        const rank = MILITARY_RANKS_BY_ID[o.rank];
        if (rank) stipend += rank.stipend;
      }
      if (stipend === 0) continue;
      const paid = Math.min(capital.gold, stipend);
      const owed = stipend - paid;
      cities[capital.id] = { ...capital, gold: capital.gold - paid };
      if (owed > 0) {
        // Unpaid arrears: shave 2 loyalty off every officer of this force.
        // Discontent spreads quickly when the treasury runs dry.
        for (const o of Object.values(officers)) {
          if (o.forceId !== force.id) continue;
          if (o.status === 'dead' || o.status === 'imprisoned') continue;
          officers[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - 2) };
        }
        entries.push({
          cityId: capital.id,
          kind: 'note',
          text: `${force.name.en} treasury fell short of military stipends by ${owed}g — officers' loyalty −2.`,
          textZh: `${force.name.zh}府庫不足，俸祿欠 ${owed} 金，諸將忠誠 −2。`,
        });
      }
    }
  }

  // 2c. 食邑 — enfeoffed nobles' fiefs yield revenue into the realm capital
  // each season (the noble manages productive land for the realm). The land
  // is worked whether or not the noble is idle, so even a campaigning marquis
  // pays in; only death/imprisonment stops the rent.
  if (seasonBoundary) {
    const fiefByForce: Record<EntityId, { gold: number; grain: number }> = {};
    for (const o of Object.values(officers)) {
      if (!o.forceId || !o.peerageId) continue;
      if (o.status === 'dead' || o.status === 'imprisoned') continue;
      const eff = peerageEffects(o);
      if (eff.fiefGold === 0 && eff.fiefGrain === 0) continue;
      const acc = (fiefByForce[o.forceId] ??= { gold: 0, grain: 0 });
      acc.gold += eff.fiefGold;
      acc.grain += eff.fiefGrain;
    }
    for (const force of Object.values(forces)) {
      const fief = fiefByForce[force.id];
      if (!fief || !force.capitalCityId) continue;
      const capital = cities[force.capitalCityId];
      if (!capital) continue;
      cities[capital.id] = {
        ...capital,
        gold: capital.gold + fief.gold,
        food: capital.food + fief.grain,
      };
    }
  }

  // 2d. 官署常俸 — the 九卿/尚書台 yield their offices' season upkeep: the
  // treasury ministers (大司農/少府) pay coin & grain into the capital, the
  // guards minister (衛尉) musters garrison there, and the justice/rites/
  // capital inspectors (廷尉/太常/司隸/尚書令) raise 民心 in every city.
  if (seasonBoundary && input.appointments && input.appointments.length > 0) {
    for (const force of Object.values(forces)) {
      const cb = appointmentBonusFor(force.id, input.appointments, officers);
      if (
        cb.goldPerSeason === 0 && cb.foodPerSeason === 0 &&
        cb.cityLoyaltyPerSeason === 0 && cb.capitalGarrisonPerSeason === 0
      ) continue;
      if (force.capitalCityId) {
        const cap = cities[force.capitalCityId];
        if (cap) {
          cities[cap.id] = {
            ...cap,
            gold: cap.gold + cb.goldPerSeason,
            food: cap.food + cb.foodPerSeason,
            troops: cap.troops + cb.capitalGarrisonPerSeason,
          };
        }
      }
      if (cb.cityLoyaltyPerSeason !== 0) {
        for (const c of Object.values(cities)) {
          if (c.ownerForceId !== force.id) continue;
          const loyalty = Math.max(0, Math.min(100, c.loyalty + cb.cityLoyaltyPerSeason));
          if (loyalty !== c.loyalty) cities[c.id] = { ...cities[c.id], loyalty };
        }
      }
    }
  }

  // 3. Reset officer tasks + loyalty drift toward force strength.
  // Compute per-force city counts once.
  const cityCountByForce: Record<EntityId, number> = {};
  let totalCities = 0;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId) {
      cityCountByForce[c.ownerForceId] =
        (cityCountByForce[c.ownerForceId] ?? 0) + 1;
      totalCities++;
    }
  }
  const avgCities =
    totalCities / Math.max(1, Object.keys(cityCountByForce).length);

  // Oath bonds are imported from data/bonds.ts.

  // Per-force censor loyalty drift bonus (御史中丞): +1 per season to all
  // officers of that force, on top of the cities-balance drift above.
  const censorBonusByForce: Record<EntityId, number> = {};
  if (input.appointments) {
    for (const f of Object.keys(cityCountByForce)) {
      censorBonusByForce[f] = appointmentBonusFor(
        f,
        input.appointments,
        officers,
      ).loyaltyDriftPerSeason;
    }
  }
  for (const o of Object.values(officers)) {
    let next: Officer = o.task ? { ...o, task: null } : o;
    // 失威漸復 — disgrace fades one season at a time (gated on the season boundary,
    // since this loop runs every period); once spent, the officer's 品階招牌 returns
    // (see gradeCombat). Applies to every officer, all forces.
    if (seasonBoundary && (o.disgrace ?? 0) > 0) {
      const d = (o.disgrace ?? 0) - 1;
      next = { ...next };
      if (d > 0) next.disgrace = d; else delete next.disgrace;
    }
    if (o.forceId && o.status === 'idle') {
      const owned = cityCountByForce[o.forceId] ?? 0;
      let drift = 0;
      if (owned > avgCities + 1) drift = 1;
      else if (owned < avgCities - 1) drift = -1;
      else if (owned === 0) drift = -3;
      drift += censorBonusByForce[o.forceId] ?? 0;
      // 食邑加俸 — an enfeoffed noble's standing loyalty bonus.
      if (o.peerageId) drift += peerageEffects(o).loyaltyBonus;
      // 名號將軍 — a conferred honorific's standing loyalty bonus.
      if (o.honorificId) drift += honorificEffects(o).loyaltyBonus;
      // 名將傲氣 — a 金牌+ talent expects rank/peerage befitting their renown. Held
      // beneath it (low 軍階, no 爵), pride curdles into discontent (−1); honoured
      // to a station worthy of them, they're a lion who fights for a true lord (+1).
      // Applies to every force, so a slighted enemy elite drifts toward defection.
      const gRank = gradeRank(officerGrade(o).grade);
      if (gRank >= gradeRank('gold')) {
        const recognition = (MILITARY_RANKS_BY_ID[o.rank]?.tier ?? 0) + peerageTier(o.peerageId) * 1.5;
        const expected = (gRank - 2) * 3; // 金→3, 白金→6, 鑽石→9
        if (recognition < expected) drift -= 1;
        else if (recognition >= expected + 3) drift += 1;
      }
      if (drift !== 0) {
        const newLoyalty = Math.max(0, Math.min(100, o.loyalty + drift));
        if (newLoyalty !== o.loyalty) {
          next = { ...next, loyalty: newLoyalty };
        }
      }
    }
    if (next !== o) officers[o.id] = next;
  }

  // 瑜亮情結 — two peerless (白金+) talents under one banner chafe at sharing the
  // stage. Occasionally a proud one bristles: a small loyalty dip + a note. Rare and
  // temperament-gated, so it's flavour friction among legends, not constant attrition.
  if (seasonBoundary) {
    const topByForce: Record<EntityId, Officer[]> = {};
    for (const o of Object.values(officers)) {
      if (!o.forceId || o.status === 'dead' || o.status === 'imprisoned' || o.status === 'unsearched') continue;
      if (gradeRank(officerGrade(o).grade) >= gradeRank('platinum')) (topByForce[o.forceId] ??= []).push(o);
    }
    const PROUD = ['arrogant', 'vainglorious', 'jealous', 'envious', 'wrathful', 'ambitious'];
    for (const list of Object.values(topByForce)) {
      if (list.length < 2 || rng() >= 0.12) continue;
      const proud = list.find((o) => (o.traits as string[] | undefined ?? []).some((t) => PROUD.includes(t)));
      const sub = proud ?? list[0];
      const rival = list.find((o) => o.id !== sub.id);
      if (!rival) continue;
      officers[sub.id] = { ...officers[sub.id], loyalty: Math.max(0, officers[sub.id].loyalty - 2) };
      entries.push({
        cityId: sub.locationCityId,
        kind: 'note',
        text: `${sub.name.en} chafes at sharing the stage with ${rival.name.en} (瑜亮情結) — loyalty −2.`,
        textZh: `${sub.name.zh}與${rival.name.zh}瑜亮並立,心有未平(忠誠 −2)。`,
      });
    }
  }

  // Apply oath-bond loyalty floors (after drift, so bonds always win).
  // Includes both static historical bonds and runtime marriage bonds.
  const allBonds = [...OATH_BONDS, ...input.runtimeBonds];
  for (const bond of allBonds) {
    const a = officers[bond.officerA];
    const b = officers[bond.officerB];
    if (
      a &&
      b &&
      a.forceId &&
      a.forceId === b.forceId &&
      a.status !== 'dead' &&
      b.status !== 'dead'
    ) {
      if (a.loyalty < bond.floor)
        officers[bond.officerA] = { ...a, loyalty: bond.floor };
      if (b.loyalty < bond.floor)
        officers[bond.officerB] = { ...b, loyalty: bond.floor };
    }
  }

  // Defection: officers with loyalty < 20 abandon their force and become
  // free agents in the city they currently reside in.
  for (const o of Object.values(officers)) {
    if (
      o.status === 'idle' &&
      o.forceId &&
      o.loyalty < 20 &&
      o.locationCityId &&
      cities[o.locationCityId]?.ownerForceId === o.forceId
    ) {
      // 40% chance per season once loyalty is below 20.
      if (rng() < 0.4) {
        const formerForce = forces[o.forceId];
        officers[o.id] = {
          ...o,
          forceId: null,
          loyalty: 50,
          task: null,
        };
        entries.push({
          cityId: o.locationCityId,
          kind: 'note',
          text: `${o.name.en} (${o.name.zh}) abandons ${formerForce?.name.en ?? 'their lord'} and walks away a free agent.`,
          textZh: `${o.name.zh}背棄${formerForce?.name.zh ?? '主公'}，飄然而去，自此為一介游俠。`,
        });
      }
    }
  }

  // 門閥世族 — the realm's 門第政策 tugs scion vs commoner loyalty and lets an
  // over-mighty clan lend its strongman a usurpation push (folded into the
  // ambition factionBoost below). Season-bounded; own date-seeded rng.
  let clanFactionBoost: Record<EntityId, number> = {};
  if (seasonBoundary) {
    const seasonIdx0 = { spring: 0, summer: 1, autumn: 2, winter: 3 }[input.date.season];
    const clanResult = tickClans({
      officers,
      forces,
      cities,
      playerForceId: input.playerForceId,
      seed: ((input.date.year * 4 + seasonIdx0) ^ 0x5c1a) >>> 0,
    });
    officers = clanResult.officers;
    clanFactionBoost = clanResult.factionBoost;
    for (const e of clanResult.entries) {
      entries.push({ cityId: e.cityId, kind: 'note', text: e.text, textZh: e.textZh });
    }

    // 治國理念 — each realm's school of statecraft slants its cities (民心/稅/糧/
    // 耕戰) and rallies doctrine-aligned scholars.
    const craft = tickStatecraft({ forces, cities, officers });
    cities = craft.cities;
    officers = craft.officers;
    for (const e of craft.entries) {
      entries.push({ cityId: e.cityId, kind: 'note', text: e.text, textZh: e.textZh });
    }
  }

  // 權謀 — ambition: once per season, a discontented landed general may usurp
  // his weak lord or break away with the city he holds. Uses its own
  // date-seeded rng (off the main stream), so determinism elsewhere is intact.
  if (seasonBoundary) {
    const seasonIdx = { spring: 0, summer: 1, autumn: 2, winter: 3 }[input.date.season];
    // A general whose own court faction has captured the realm has a clique at
    // his back — fold that into his betrayal odds. 軍方 coups hardest of all.
    const clanWeight = input.clanStandings ? clanGentryWeight(officers, input.clanStandings) : undefined;
    const factionsByForce = deriveCourtFactions(officers, clanWeight);
    const factionBoost: Record<EntityId, number> = {};
    for (const list of Object.values(factionsByForce)) {
      if (list.length < 5) continue;
      const counts: Record<FactionId, number> = { reformer: 0, eunuch: 0, gentry: 0, military: 0 };
      for (const m of list) counts[m.faction]++;
      let dominant: FactionId | null = null;
      let share = 0;
      for (const fid of Object.keys(counts) as FactionId[]) {
        const s = counts[fid] / list.length;
        if (s > share) { share = s; dominant = fid; }
      }
      if (!dominant || share <= 0.5) continue;
      const weight = dominant === 'military' ? 0.045 : dominant === 'gentry' ? 0.025 : 0;
      if (weight === 0) continue;
      for (const m of list) if (m.faction === dominant) factionBoost[m.officerId] = weight;
    }
    // Fold in the 門閥 over-mighty-clan push (stacks with court-faction weight).
    for (const [id, boost] of Object.entries(clanFactionBoost)) {
      factionBoost[id] = Math.min(0.09, (factionBoost[id] ?? 0) + boost);
    }
    // 朋黨 — a discontented general's clique of high-rapport allies emboldens him;
    // feuds isolate. Only the ambition-relevant (low-loyalty) set is scored.
    if (input.rapport) {
      const byForce = new Map<EntityId, Officer[]>();
      for (const o of Object.values(officers)) {
        if (!o.forceId || o.status === 'dead' || o.status === 'imprisoned') continue;
        (byForce.get(o.forceId) ?? byForce.set(o.forceId, []).get(o.forceId)!).push(o);
      }
      for (const o of Object.values(officers)) {
        if (!o.forceId || o.loyalty >= 35) continue;
        const boost = cliqueBackingBoost(o.id, byForce.get(o.forceId) ?? [], input.rapport, input.runtimeBonds);
        if (boost > 0) factionBoost[o.id] = Math.min(0.11, (factionBoost[o.id] ?? 0) + boost);
      }
    }
    const ambitionEvents = resolveAmbitions({
      officers,
      cities,
      forces,
      playerForceId: input.playerForceId,
      seed: (input.date.year * 4 + seasonIdx) >>> 0,
      factionBoost,
      buildings: input.buildings,
      lordRapport: input.lordRapport,
    });
    for (const ev of ambitionEvents) {
      entries.push({ cityId: ev.cityId, kind: ev.kind, text: ev.text, textZh: ev.textZh });
    }
  }

  // 4. Random events — only on season boundary.
  if (seasonBoundary) {
    const eventResult = rollEvents({
      season: input.date.season,
      cities,
      officers,
      buildings: input.buildings,
      rng,
      disasterMul: input.disasterMul,
    });
    cities = eventResult.cities;
    officers = eventResult.officers;
    entries.push(...eventResult.entries);

    // 新武將登場 — fresh fictional talent may step onto the stage (opt-in).
    const newChance = input.newOfficerChance ?? 0;
    if (newChance > 0 && rng() < newChance) {
      const fresh = generateFictionalOfficer(input.date.year, rng, new Set(Object.keys(officers)));
      officers = { ...officers, [fresh.id]: fresh };
      entries.push({
        cityId: null,
        kind: 'note',
        text: `A promising new talent, ${fresh.name.en}, has emerged among the people.`,
        textZh: `江湖新秀 ${fresh.name.zh} 嶄露頭角,現身在野。`,
      });
    }
  }

  // 5. Aging — only at year boundary (winter → spring) + on season boundary.
  if (seasonBoundary && input.date.season === 'winter') {
    const aging = processAging({
      year: input.date.year,
      cities,
      officers,
      forces,
      rng,
      family: input.family,
      runtimeBonds: input.runtimeBonds,
      lifespanMode: input.lifespanMode ?? 'historical',
      lifespanLength: input.lifespanLength ?? 'historical',
      agingStatLock: input.agingStatLock ?? false,
      reviveDeadOfficers: input.reviveDeadOfficers ?? false,
    });
    cities = aging.cities;
    officers = aging.officers;
    forces = aging.forces;
    entries.push(...aging.entries);

    // 考課 — annual review of every realm's 太守. Grade the seat's health,
    // reward/punish the prefect's loyalty. Runs once a year with aging.
    if (input.appointments && input.appointments.length > 0) {
      const kaoke = evaluateGovernors({
        appointments: input.appointments,
        cities,
        officers,
        playerForceId: input.playerForceId,
        streaks: input.governorEvalStreaks,
        year: input.date.year,
        rng,
      });
      officers = kaoke.officers;
      for (const e of kaoke.entries) {
        entries.push({ cityId: e.cityId || null, kind: 'note', text: e.text, textZh: e.textZh });
      }
      governorEvalStreaksOut = kaoke.streaks;
      governorRevocationsOut = kaoke.revoked.length > 0 ? kaoke.revoked : undefined;
      governorMandateDeltasOut = Object.keys(kaoke.mandateDeltas).length > 0 ? kaoke.mandateDeltas : undefined;
      governorReviewLastOut = kaoke.reviewLast;
    }
  }

  // 6. Diplomacy tick (NAP expiry + relation decay on year transitions).
  const dip = tickDiplomacy({
    diplomacy: input.diplomacy,
    date: advanceSeason(input.date),
    isYearTransition: input.date.season === 'winter',
  });
  entries.push(...dip.entries);

  // 動態聯盟 — if one power runs away with the realm, the lesser lords draw
  // together against it (合縱). Pure/deterministic; player pacts untouched,
  // but a player hegemon will face the coalition. Season boundary only.
  let finalDiplomacy = dip.diplomacy;
  if (seasonBoundary) {
    const coalition = applyCoalitionPressure({
      diplomacy: finalDiplomacy,
      cities,
      forces,
      playerForceId: input.playerForceId,
      date: input.date,
    });
    finalDiplomacy = coalition.diplomacy;
    entries.push(...coalition.entries);
  }

  // 7. Advance date.
  const nextDate = advanceSeason(input.date);

  // 8. 輜重 — advance supply convoys; the cargo of those that arrive empties
  // into the destination city (forfeited if it fell mid-haul). Season only.
  let nextConvoys = input.convoys ?? {};
  let nextRaids = input.raids ?? {};
  if (seasonBoundary && Object.keys(nextConvoys).length > 0) {
    const stepped = stepConvoys(nextConvoys, cities, outArmies);
    nextConvoys = stepped.convoys;
    cities = stepped.cities;
    Object.assign(outArmies, stepped.armies); // 直供前線 deliveries relieved sieges
    // Nearest still-friendly city to a map point (for landing a front escort).
    const nearestFriendlyCityId = (x: number, y: number, fid: EntityId): EntityId | null => {
      let best: EntityId | null = null, bd = Infinity;
      for (const c of Object.values(cities)) {
        if (c.ownerForceId !== fid || c.ruined) continue;
        const cp = cityPos(c);
        const d = Math.hypot(cp.x - x, cp.y - y);
        if (d < bd) { bd = d; best = c.id; }
      }
      return best;
    };
    for (const a of stepped.arrivals) {
      // 押運武将抵達 — the escort reappears: at the destination city for a city
      // haul; at the nearest friendly city to the host for a front delivery.
      if (a.convoy.officerId && officers[a.convoy.officerId]) {
        let landAt: EntityId = a.convoy.toCityId;
        if (a.toArmy) {
          const army = a.convoy.toArmyId ? outArmies[a.convoy.toArmyId] : undefined;
          landAt = (army ? nearestFriendlyCityId(army.x, army.y, a.convoy.forceId) : null) ?? a.convoy.fromCityId;
        }
        officers[a.convoy.officerId] = { ...officers[a.convoy.officerId], locationCityId: landAt, status: 'idle' };
      }
      const parts: string[] = [];
      if (a.convoy.food > 0) parts.push(`糧 +${a.convoy.food.toLocaleString()}`);
      if (!a.toArmy && a.convoy.gold > 0) parts.push(`金 +${a.convoy.gold.toLocaleString()}`);
      if (a.convoy.troops > 0) parts.push(`${a.toArmy ? '援兵' : '兵'} +${a.convoy.troops.toLocaleString()}`);
      entries.push({
        cityId: a.toArmy ? null : a.convoy.toCityId,
        kind: 'income',
        text: a.toArmy
          ? `Supply reached the army before ${a.toName}: ${parts.join(', ') || 'empty'}.`
          : `Supply convoy reached ${a.toName}: ${parts.join(', ') || 'empty'}.`,
        textZh: a.toArmy
          ? `輜重直抵前軍(${a.toName}下)：${parts.join('、') || '空車'}。`
          : `輜重抵 ${a.toName}：${parts.join('、') || '空車'}。`,
      });
    }
    // Destination lost mid-haul — the column (and its escort) is taken.
    for (const f of stepped.forfeited) {
      if (f.officerId && officers[f.officerId]) {
        officers[f.officerId] = { ...officers[f.officerId], status: 'imprisoned', locationCityId: f.toCityId, task: null };
        if (f.forceId === input.playerForceId) {
          entries.push({
            cityId: f.toCityId,
            kind: 'desertion',
            text: `${officers[f.officerId].name.en} and his supply column were lost — the destination had fallen.`,
            textZh: `${officers[f.officerId].name.zh}押運之輜重連人帶貨,沒於已陷之地。`,
          });
        }
      }
    }

    // 劫糧道 — convoys passing a hostile stronghold risk a sortie; lawless
    // roads carry a small bandit risk. Escort troops can beat the raiders off.
    const dangers: Record<EntityId, number> = {};
    const raiderByConvoy: Record<EntityId, EntityId> = {};
    for (const cv of Object.values(nextConvoys)) {
      const from = cities[cv.fromCityId];
      const to = cities[cv.toCityId];
      if (!from || !to) continue;
      const sp = cityPos(from);
      const dp = cityPos(to);
      const route = terrainRoute(sp.x, sp.y, dp.x, dp.y);
      const prog = Math.min(0.9, Math.max(0.1, (cv.totalSeasons - cv.seasonsRemaining + 0.5) / Math.max(1, cv.totalSeasons)));
      const pos = positionAlongRoute(route, prog);
      let nearest: typeof from | undefined;
      let nd = Infinity;
      for (const c of Object.values(cities)) {
        const cp = cityPos(c);
        const d = Math.hypot(cp.x - pos.x, cp.y - pos.y);
        if (d < nd) { nd = d; nearest = c; }
      }
      // 謹慎避敵 — the cautious back-roads roughly halve the chance of being found.
      const sortieChance = cv.cautious ? 0.2 : 0.4;
      const banditChance = cv.cautious ? 0.04 : 0.08;
      let strength = 0;
      if (nearest && nearest.ownerForceId && nearest.ownerForceId !== cv.forceId
          && isHostilePermitted(input.diplomacy, cv.forceId, nearest.ownerForceId)) {
        if (rng() < sortieChance) { strength = Math.max(800, Math.floor(nearest.troops * 0.1)); raiderByConvoy[cv.id] = nearest.id; } // sortie from the stronghold
      } else if (rng() < banditChance) {
        strength = 700 + Math.floor(rng() * 800); // 山賊 — lawless roads
      }
      if (strength > 0) dangers[cv.id] = strength;
    }
    if (Object.keys(dangers).length > 0) {
      const raided = resolveConvoyRaids(nextConvoys, dangers, cities, raiderByConvoy);
      nextConvoys = raided.convoys;
      for (const r of raided.raids) {
        const escortId = r.convoy.officerId;
        const raiderCity = r.raiderCityId ? cities[r.raiderCityId] : undefined;
        const captureAt = r.raiderCityId ?? r.convoy.toCityId;
        // A column overrun in a raid loses its escort to capture by the raider.
        if (!r.repelled && escortId && officers[escortId]) {
          officers[escortId] = { ...officers[escortId], status: 'imprisoned', locationCityId: captureAt, task: null };
        }
        // 劫糧得財 — gold is looted by the raiding stronghold; grain is burned.
        if (!r.repelled && raiderCity && r.convoy.gold > 0 && raiderCity.ownerForceId) {
          cities[raiderCity.id] = { ...cities[raiderCity.id], gold: cities[raiderCity.id].gold + r.convoy.gold };
        }
        const esc = escortId ? officers[escortId] : null;
        const cargo = [r.convoy.food > 0 ? `糧${r.convoy.food.toLocaleString()}` : '', r.convoy.gold > 0 ? `金${r.convoy.gold.toLocaleString()}` : '', r.convoy.troops > 0 ? `兵${r.convoy.troops.toLocaleString()}` : ''].filter(Boolean).join('、');
        const playerRaided = r.convoy.forceId === input.playerForceId;       // our column was hit
        const playerCut = !r.repelled && raiderCity?.ownerForceId === input.playerForceId; // we cut enemy supply

        if (playerRaided) {
          entries.push({
            cityId: r.convoy.toCityId,
            kind: r.repelled ? 'income' : 'desertion',
            text: r.repelled
              ? `A convoy bound for ${r.toName} fought off a raid.`
              : `A convoy bound for ${r.toName} was raided — ${cargo} lost${esc ? ` and ${esc.name.en} taken` : ''}!`,
            textZh: r.repelled
              ? `往${r.toName}之輜重擊退劫掠,押運折損。`
              : `往${r.toName}之輜重遭劫 — ${cargo} 盡失${esc ? `,${esc.name.zh}被擒` : ''}!`,
          });
        } else if (playerCut && raiderCity) {
          // 劫糧道 — your garrison cut an enemy supply train (the 烏巢 move).
          const enemy = forces[r.convoy.forceId]?.name;
          entries.push({
            cityId: raiderCity.id,
            kind: 'conquest',
            text: `Your garrison at ${raiderCity.name.en} fell on ${enemy?.en ?? 'an enemy'} supply train — ${cargo} destroyed${esc ? `, ${esc.name.en} captured` : ''}!`,
            textZh: `${raiderCity.name.zh}守軍劫了${enemy?.zh ?? '敵'}糧道 — ${cargo}${esc ? `,生擒${esc.name.zh}` : ''}!`,
          });
        }
      }
    }

    // 途中際遇 — small fortunes of the road befall surviving convoys: grateful
    // villagers add grain, a downpour spoils it, or a washed-out bridge adds a
    // season's detour. Player convoys only; one happening at most.
    for (const cv of Object.values(nextConvoys)) {
      if (cv.forceId !== input.playerForceId) continue;
      const roll = rng();
      if (roll < 0.05 && cv.food > 0) {
        const gift = Math.floor(cv.food * 0.1);
        nextConvoys[cv.id] = { ...cv, food: cv.food + gift };
        entries.push({ cityId: cv.toCityId, kind: 'income', text: `Grateful villagers add ${gift} grain to a convoy.`, textZh: `義民簞食壺漿,輜重添糧 ${gift.toLocaleString()}。` });
      } else if (roll < 0.10 && cv.food > 0) {
        const spoil = Math.floor(cv.food * 0.15);
        nextConvoys[cv.id] = { ...cv, food: Math.max(0, cv.food - spoil) };
        entries.push({ cityId: cv.toCityId, kind: 'desertion', text: `Rain spoils ${spoil} grain in transit.`, textZh: `霖雨壞糧,途中損 ${spoil.toLocaleString()}。` });
      } else if (roll < 0.14 && cv.seasonsRemaining >= 1) {
        nextConvoys[cv.id] = { ...cv, seasonsRemaining: cv.seasonsRemaining + 1, totalSeasons: cv.totalSeasons + 1 };
        entries.push({ cityId: cv.toCityId, kind: 'desertion', text: `A washed-out bridge forces a convoy to detour (+1 season).`, textZh: `橋斷水漲,輜重繞道,多耗一季。` });
      }
    }

    // AI 運輸 — a rival with a glutted city and a starving one runs its own
    // grain convoy between them. These crawl the map too, so they can be raided
    // when they pass a player stronghold (your garrison sorties on their supply).
    const playerFid = input.playerForceId;
    // 木牛流馬 — a force that fields the logistics device (an officer skill)
    // hauls faster and loses less on EVERY column, not just hand-dispatched ones.
    const forceHasWoodenOx = (fid: string | null | undefined): boolean =>
      !!fid && Object.values(officers).some(
        (o) => o.forceId === fid && o.status !== 'dead' && (o.skills ?? []).includes('wooden-ox' as never),
      );
    const woodenOxSeasons = (n: number, ox: boolean) => Math.max(1, Math.round(n * (ox ? 0.6 : 1)));
    const woodenOxKeep = (seasons: number, ox: boolean) => 1 - Math.min(0.4, 0.06 * (seasons - 1)) * (ox ? 0.5 : 1);
    const aiByForce: Record<string, City[]> = {};
    for (const c of Object.values(cities)) {
      if (!c.ownerForceId || c.ownerForceId === playerFid) continue;
      (aiByForce[c.ownerForceId] ??= []).push(c);
    }
    let aiSeq = 0;
    for (const [fid, cs] of Object.entries(aiByForce)) {
      if (cs.length < 2 || rng() >= 0.3) continue;
      if (Object.values(nextConvoys).some((cv) => cv.forceId === fid)) continue; // one at a time
      const sorted = [...cs].sort((a, b) => b.food - a.food);
      const rich = sorted[0];
      const poor = sorted[sorted.length - 1];
      if (rich.food < 8000 || poor.food > 3000) continue;
      const ship = Math.min(rich.food - 5000, 4000);
      if (ship < 1000) continue;
      cities[rich.id] = { ...cities[rich.id], food: cities[rich.id].food - ship };
      const seasons = Math.max(2, woodenOxSeasons(marchDurationFor(rich, poor, input.date.season), forceHasWoodenOx(fid)));
      const id = `ai-convoy-${fid}-${input.date.year}-${input.date.season}-${aiSeq++}`;
      nextConvoys[id] = { id, forceId: fid, fromCityId: rich.id, toCityId: poor.id, food: ship, gold: 0, troops: 0, seasonsRemaining: seasons, totalSeasons: seasons };
    }

    // AI 前運糧秣 — a rival whose host is hungry in the field pushes grain to it
    // from a rich rear city (直供前線), so a long siege need not simply starve.
    // The column crawls the front, so it is exactly the player's 劫糧 quarry.
    for (const [fid, cs] of Object.entries(aiByForce)) {
      if (rng() >= 0.4) continue;
      if (Object.values(nextConvoys).some((cv) => cv.forceId === fid && cv.toArmyId)) continue; // one forward column at a time
      const host = Object.values(outArmies)
        .filter((a) => a.forceId === fid && (a.food ?? 0) < provisionNeeded(a.troops, 2))
        .sort((a, b) => (a.food ?? 0) - (b.food ?? 0))[0];
      if (!host) continue;
      const front = cities[host.targetCityId];
      const rear = [...cs].sort((a, b) => b.food - a.food)[0];
      if (!front || !rear || rear.food < 6000) continue;
      const ship = Math.min(rear.food - 4000, 4000);
      if (ship < 1000) continue;
      // 護糧 — a column bound for a contested front rides with an escort drawn
      // from the rear garrison (a real guard the player must overmatch to raid;
      // the survivors reinforce the host on arrival). Drawn only from true spare.
      const escort = Math.min(Math.max(0, rear.troops - 1200), 1500);
      cities[rear.id] = { ...cities[rear.id], food: cities[rear.id].food - ship, troops: cities[rear.id].troops - escort };
      const ox = forceHasWoodenOx(fid);
      const seasons = woodenOxSeasons(marchDurationFor(rear, front, input.date.season), ox);
      const keep = woodenOxKeep(seasons, ox);
      const id = `ai-fwd-${fid}-${input.date.year}-${input.date.season}-${aiSeq++}`;
      nextConvoys[id] = {
        id, forceId: fid, fromCityId: rear.id, toCityId: front.id, toArmyId: host.id,
        food: Math.floor(ship * keep), gold: 0, troops: Math.floor(escort * keep), seasonsRemaining: seasons, totalSeasons: seasons,
      };
    }

    // 常運糧道 — the player's standing routes auto-ship any surplus grain each
    // season (a basic, no-frills haul; manual convoys still get naval/木牛流馬).
    if (playerFid) {
      let srSeq = 0;
      for (const r of input.standingRoutes ?? []) {
        const src = cities[r.fromCityId];
        const dst = cities[r.toCityId];
        if (!src || !dst || src.ownerForceId !== playerFid || dst.ownerForceId !== playerFid) continue;
        if (Object.values(nextConvoys).some((cv) => cv.forceId === playerFid && cv.fromCityId === r.fromCityId && cv.toCityId === r.toCityId)) continue;
        // Auto-ship any genuine surplus — grain, plus a producer's spare warhorses
        // and iron (each over a reserve), all on one no-frills route convoy.
        const shipFood = src.food > 8000 ? Math.min(src.food - 5000, 5000) : 0;
        const shipHorses = (src.warhorses ?? 0) > 1500 ? Math.min((src.warhorses ?? 0) - 1000, 2000) : 0;
        const shipIron = (src.iron ?? 0) > 1500 ? Math.min((src.iron ?? 0) - 1000, 2000) : 0;
        if (shipFood < 1000 && shipHorses <= 0 && shipIron <= 0) continue;
        const ox = forceHasWoodenOx(playerFid);
        const seasons = woodenOxSeasons(marchDurationFor(src, dst, input.date.season), ox);
        const keep = woodenOxKeep(seasons, ox);
        cities[r.fromCityId] = {
          ...cities[r.fromCityId],
          food: cities[r.fromCityId].food - shipFood,
          ...(shipHorses > 0 ? { warhorses: (cities[r.fromCityId].warhorses ?? 0) - shipHorses } : {}),
          ...(shipIron > 0 ? { iron: (cities[r.fromCityId].iron ?? 0) - shipIron } : {}),
        };
        const id = `route-convoy-${r.fromCityId}-${r.toCityId}-${input.date.year}-${input.date.season}-${srSeq++}`;
        nextConvoys[id] = {
          id, forceId: playerFid, fromCityId: r.fromCityId, toCityId: r.toCityId,
          food: Math.floor(shipFood * keep), gold: 0, troops: 0,
          ...(shipHorses > 0 ? { warhorses: Math.floor(shipHorses * keep) } : {}),
          ...(shipIron > 0 ? { iron: Math.floor(shipIron * keep) } : {}),
          seasonsRemaining: seasons, totalSeasons: seasons,
        };
        const cargoZh = [shipFood > 0 ? `${Math.floor(shipFood * keep).toLocaleString()} 糧` : '', shipHorses > 0 ? `${Math.floor(shipHorses * keep).toLocaleString()} 馬` : '', shipIron > 0 ? `${Math.floor(shipIron * keep).toLocaleString()} 鐵` : ''].filter(Boolean).join('、');
        entries.push({ cityId: r.toCityId, kind: 'income', text: `Standing route ships ${cargoZh} toward ${dst.name.en}.`, textZh: `常運糧道發 ${cargoZh} 往 ${dst.name.zh}。` });
      }
    }
  }

  // 8a. 主動劫糧 — advance the player's raiding columns. A column that runs down
  // its quarry burns the grain, loots the coin home, and takes the escort (or is
  // beaten off by a heavier guard); a quarry already in safety is a dry hole. The
  // raiders then ride home and rejoin the launch city's garrison. 烏巢之火.
  if (seasonBoundary && Object.keys(nextRaids).length > 0) {
    const keptRaids: Record<EntityId, ConvoyRaid> = {};
    for (const raid of Object.values(nextRaids)) {
      const remaining = raid.seasonsRemaining - 1;
      if (remaining > 0) { keptRaids[raid.id] = { ...raid, seasonsRemaining: remaining }; continue; }
      const target = nextConvoys[raid.targetConvoyId];
      const outcome = resolveRaidStrike(raid, target);
      const officer = officers[raid.officerId];
      const home = cities[raid.fromCityId];
      const homeOurs = !!home && home.ownerForceId === raid.forceId;
      if (officer) officers[raid.officerId] = { ...officer, locationCityId: raid.fromCityId, status: 'idle', task: null };
      if (homeOurs && outcome.raiderSurvivors > 0) {
        cities[raid.fromCityId] = { ...cities[raid.fromCityId], troops: cities[raid.fromCityId].troops + outcome.raiderSurvivors };
      }
      const isPlayer = raid.forceId === input.playerForceId;
      const targetWasPlayer = !!target && target.forceId === input.playerForceId; // an AI raid on us
      if (outcome.found && outcome.success && target) {
        delete nextConvoys[raid.targetConvoyId];
        if (homeOurs && outcome.loot > 0) cities[raid.fromCityId] = { ...cities[raid.fromCityId], gold: cities[raid.fromCityId].gold + outcome.loot };
        if (outcome.capturedEscortId && officers[outcome.capturedEscortId]) {
          officers[outcome.capturedEscortId] = { ...officers[outcome.capturedEscortId], status: 'imprisoned', locationCityId: raid.fromCityId, task: null };
        }
        const cargo = [outcome.burnedFood > 0 ? `糧${outcome.burnedFood.toLocaleString()}` : '', outcome.loot > 0 ? `掠金${outcome.loot.toLocaleString()}` : ''].filter(Boolean).join('、');
        if (isPlayer) {
          const enemy = forces[target.forceId]?.name;
          entries.push({
            cityId: raid.fromCityId, kind: 'conquest',
            text: `${officer?.name.en ?? 'Your raiders'} fell on ${enemy?.en ?? 'an enemy'} supply column — ${cargo || 'it'} destroyed${outcome.capturedEscortId ? ', escort captured' : ''}!`,
            textZh: `${officer?.name.zh ?? '遊騎'}劫了${enemy?.zh ?? '敵'}糧道 — ${cargo || '輜重'}盡毀${outcome.capturedEscortId ? ',生擒押運' : ''}!`,
          });
        } else if (targetWasPlayer) {
          const raider = forces[raid.forceId]?.name;
          const esc = outcome.capturedEscortId ? officers[outcome.capturedEscortId]?.name : null;
          entries.push({
            cityId: raid.fromCityId, kind: 'desertion',
            text: `${raider?.en ?? 'Enemy'} raiders cut one of your supply columns — ${cargo || 'cargo'} lost${esc ? `, ${esc.en} taken` : ''}!`,
            textZh: `${raider?.zh ?? '敵'}輕騎劫了我糧道 — ${cargo || '輜重'}盡失${esc ? `,${esc.zh}被擒` : ''}!`,
          });
        }
      } else if (isPlayer) {
        entries.push({
          cityId: raid.fromCityId, kind: 'desertion',
          text: outcome.found
            ? `${officer?.name.en ?? 'Your raiders'} were beaten off an enemy supply column.`
            : `${officer?.name.en ?? 'Your raiders'} found the supply column already gone.`,
          textZh: outcome.found
            ? `${officer?.name.zh ?? '遊騎'}劫糧不成,為護糧之軍所拒。`
            : `${officer?.name.zh ?? '遊騎'}撲空,敵糧已先入城。`,
        });
      } else if (targetWasPlayer && outcome.found) {
        const raider = forces[raid.forceId]?.name;
        entries.push({
          cityId: raid.targetConvoyId in nextConvoys ? nextConvoys[raid.targetConvoyId].toCityId : null, kind: 'income',
          text: `Your escort beat off ${raider?.en ?? 'an enemy'} raiding party on the supply road.`,
          textZh: `護糧之軍擊退${raider?.zh ?? '敵'}輕騎,糧道得保。`,
        });
      }
    }
    nextRaids = keptRaids;
  }

  // 8a′. AI 劫糧 — a rival that spots one of the player's supply columns near its
  // own territory, and can spare a strike force, sends raiders after it (its own
  // 烏巢 move); resolves next season like the player's. This makes a deep 直供前線
  // a genuine risk, not a free siege-saver. The player's counterplay: escort the
  // column (its troops are the guard), take the cautious back-roads, or ship by
  // water — a land raiding party can't catch a junk and is likelier to lose the
  // cautious trail.
  const pfRaidId = input.playerForceId;
  if (seasonBoundary && pfRaidId && Object.keys(nextConvoys).length > 0) {
    let aiRaidSeq = 0;
    const struck = new Set<string>(Object.values(nextRaids).map((r) => r.forceId)); // one strike per force/season
    const hunted = new Set<string>(Object.values(nextRaids).map((r) => r.targetConvoyId));
    for (const cv of Object.values(nextConvoys)) {
      if (cv.forceId !== pfRaidId || cv.naval || hunted.has(cv.id)) continue; // can't catch a water column
      const from = cities[cv.fromCityId], to = cities[cv.toCityId];
      if (!from || !to) continue;
      const sp = cityPos(from), dp = cityPos(to);
      const prog = Math.min(0.9, Math.max(0.1, (cv.totalSeasons - cv.seasonsRemaining + 0.5) / Math.max(1, cv.totalSeasons)));
      const pos = positionAlongRoute(terrainRoute(sp.x, sp.y, dp.x, dp.y), prog);
      let near: City | undefined; let nd = Infinity;
      for (const c of Object.values(cities)) {
        if (c.ruined || !c.ownerForceId) continue;
        const cp = cityPos(c);
        const d = Math.hypot(cp.x - pos.x, cp.y - pos.y);
        if (d < nd) { nd = d; near = c; }
      }
      if (!near || !near.ownerForceId || near.ownerForceId === pfRaidId) continue; // our own ground is nearest → safe
      const fid = near.ownerForceId;
      if (struck.has(fid) || !isHostilePermitted(input.diplomacy, fid, pfRaidId)) continue;
      if (rng() >= (cv.cautious ? 0.25 : 0.5)) continue;
      // Commit only if the nearest stronghold can spare enough to likely overrun the escort.
      const strike = Math.min(Math.max(0, near.troops - 1000), Math.max(1200, cv.troops + 500));
      if (strike < 600 || strike <= cv.troops) continue;
      cities[near.id] = { ...cities[near.id], troops: near.troops - strike };
      struck.add(fid);
      const id = `ai-raid-${fid}-${cv.id}-${input.date.year}-${input.date.season}-${aiRaidSeq++}`;
      nextRaids[id] = { id, forceId: fid, officerId: '', troops: strike, fromCityId: near.id, targetConvoyId: cv.id, seasonsRemaining: 1 };
    }
  }

  // 8b. 游历 — advance roaming officers (探索/出使/策反/刺探). Errands resolve at
  // the destination on the outbound leg (intel lit / relations warmed / a city
  // bled / an officer turned); what the envoy carries is delivered when he gets
  // home. Both the player's and rivals' expeditions step here.
  let nextExpeditions = input.expeditions ?? {};
  let nextEspionageReveals = input.espionageReveals ?? {};
  let expeditionAggressionDeltas: Record<string, number> | undefined;
  let expeditionMandateDeltas: Record<string, number> | undefined;
  let expeditionRealmsOpened: Record<string, EntityId> | undefined;
  let expeditionRealmRelationDeltas: Record<string, number> | undefined;
  if (seasonBoundary && Object.keys(nextExpeditions).length > 0) {
    const stepped = stepExpeditions({
      expeditions: nextExpeditions,
      cities,
      officers,
      forces,
      diplomacy: finalDiplomacy,
      espionageReveals: nextEspionageReveals,
      rng,
      playerForceId: input.playerForceId,
      realmRelations: input.realmRelations,
    });
    nextExpeditions = stepped.expeditions;
    cities = stepped.cities;
    finalDiplomacy = stepped.diplomacy;
    nextEspionageReveals = stepped.espionageReveals;
    Object.assign(officers, stepped.officers); // merge officer mutations in place
    for (const e of stepped.entries) entries.push(e);
    if (Object.keys(stepped.aggressionDeltas).length > 0) expeditionAggressionDeltas = stepped.aggressionDeltas;
    if (Object.keys(stepped.mandateDeltas).length > 0) expeditionMandateDeltas = stepped.mandateDeltas;
    if (Object.keys(stepped.realmsOpened).length > 0) expeditionRealmsOpened = stepped.realmsOpened;
    if (Object.keys(stepped.realmRelationDeltas).length > 0) expeditionRealmRelationDeltas = stepped.realmRelationDeltas;
  }

  // 8c. AI 游历 — each rival may send out one roamer a season: scout a far city,
  // call on a neighbour (出使), or undermine one (策反/刺探, which can even turn
  // or sabotage the PLAYER if his land is the mark). Low odds so the map stays
  // lively without thrashing. The player drives his own.
  if (seasonBoundary) {
    const roamerByForce: Record<string, number> = {};
    for (const e of Object.values(nextExpeditions)) roamerByForce[e.forceId] = (roamerByForce[e.forceId] ?? 0) + 1;
    let aiExpSeq = 0;
    for (const force of Object.values(forces)) {
      if (force.id === input.playerForceId) continue;
      if ((roamerByForce[force.id] ?? 0) > 0) continue; // one roamer abroad at a time
      if (rng() >= 0.25) continue;
      const candidates = Object.values(officers).filter(
        (o) =>
          o.forceId === force.id &&
          o.locationCityId != null &&
          cities[o.locationCityId]?.ownerForceId === force.id &&
          (o.status === 'idle' || o.status === 'active') &&
          !o.task &&
          o.id !== force.rulerOfficerId,
      );
      if (candidates.length === 0) continue;
      // Send the sharpest, most persuasive idler.
      const officer = candidates.sort(
        (a, b) => b.stats.intelligence + b.stats.charisma - (a.stats.intelligence + a.stats.charisma),
      )[0];
      const from = cities[officer.locationCityId!];
      if (!from) continue;
      // 遠使異域 — sometimes a rival court sends a long embassy abroad instead
      // (通西域/出使倭/安撫邊族). Its deltas (force mandate, tribe aggression)
      // bubble up like the player's.
      if (rng() < 0.2) {
        const targets = embassyTargets(input.date.year);
        const target = targets[Math.floor(rng() * targets.length)];
        if (target) {
          const eleg = embassyLegSeasons(target, officer);
          const eid = `emb-ai-${force.id}-${input.date.year}-${input.date.season}-${aiExpSeq++}`;
          nextExpeditions[eid] = {
            id: eid, officerId: officer.id, forceId: force.id, fromCityId: from.id, toCityId: '',
            toRealmId: target.id, mode: 'embassy', phase: 'outbound', seasonsRemaining: eleg, legSeasons: eleg,
          };
          officers[officer.id] = { ...officer, locationCityId: null, task: null, status: 'active' };
          continue;
        }
      }
      const foreignCities = Object.values(cities).filter((c) => c.ownerForceId && c.ownerForceId !== force.id);
      const roll = rng();
      let to: City | undefined;
      let mode: ExpeditionMode;
      if (foreignCities.length > 0 && roll < 0.6) {
        to = foreignCities[Math.floor(rng() * foreignCities.length)];
        mode = roll < 0.3 ? 'envoy' : roll < 0.45 ? 'subvert' : 'infiltrate';
      } else {
        const others = Object.values(cities).filter((c) => c.id !== from.id);
        if (others.length === 0) continue;
        to = others[Math.floor(rng() * others.length)];
        mode = 'explore';
      }
      if (!to || to.id === from.id) continue;
      const leg = Math.max(1, Math.round(Math.max(1, marchDurationFor(from, to, input.date.season)) * expeditionSpeedMul(officer)));
      const id = `exp-ai-${force.id}-${input.date.year}-${input.date.season}-${aiExpSeq++}`;
      nextExpeditions[id] = {
        id, officerId: officer.id, forceId: force.id, fromCityId: from.id, toCityId: to.id,
        mode, phase: 'outbound', seasonsRemaining: leg, legSeasons: leg,
      };
      officers[officer.id] = { ...officer, locationCityId: null, task: null, status: 'active' };
    }
  }

  return {
    date: nextDate,
    cities,
    officers,
    forces,
    diplomacy: finalDiplomacy,
    lostItems,
    refugees: refugeePool,
    report: { date: { year: input.date.year, season: input.date.season }, entries },
    keptCommands: Object.keys(keptCommands).length > 0 ? keptCommands : undefined,
    armies: outArmies,
    convoys: nextConvoys,
    raids: nextRaids,
    expeditions: nextExpeditions,
    espionageReveals: nextEspionageReveals,
    expeditionAggressionDeltas,
    expeditionMandateDeltas,
    expeditionRealmsOpened,
    expeditionRealmRelationDeltas,
    territoryOwnership,
    fieldBattleMarks: fieldBattleMarks.length > 0 ? fieldBattleMarks : undefined,
    pendingFieldBattles: pendingFieldBattles.length > 0 ? pendingFieldBattles : undefined,
    pendingSiegeDefenses: pendingSiegeDefenses.length > 0 ? pendingSiegeDefenses : undefined,
    delayedEffects: delayedEffects.length > 0 ? delayedEffects : undefined,
    deedDeltas: deedDeltas.length > 0 ? deedDeltas : undefined,
    governorEvalStreaks: governorEvalStreaksOut,
    governorRevocations: governorRevocationsOut,
    governorMandateDeltas: governorMandateDeltasOut,
    governorReviewLast: governorReviewLastOut,
  };
}

function applyDelta(
  city: City,
  delta: Partial<{
    agriculture: number;
    commerce: number;
    defense: number;
    troops: number;
    population: number;
    loyalty: number;
    food: number;
    gold: number;
    floodWorks: number;
    wallTier: 1 | 2 | 3;
    corruption: number;
    drill: number;
  }>,
): City {
  // Per-command logic already clamps to the city-tier cap (cityEconCap for
  // agri/commerce, up to 320 at capital; cityStatCap for defense). These are
  // just safety buffers above the highest tier cap.
  return {
    ...city,
    agriculture: Math.max(0, Math.min(400, city.agriculture + (delta.agriculture ?? 0))),
    commerce: Math.max(0, Math.min(400, city.commerce + (delta.commerce ?? 0))),
    defense: Math.max(0, Math.min(200, city.defense + (delta.defense ?? 0))),
    troops: Math.max(0, city.troops + (delta.troops ?? 0)),
    population: Math.max(0, city.population + (delta.population ?? 0)),
    loyalty: clamp(city.loyalty + (delta.loyalty ?? 0), 0, 100),
    food: Math.max(0, city.food + (delta.food ?? 0)),
    gold: Math.max(0, city.gold + (delta.gold ?? 0)),
    floodWorks: delta.floodWorks ?? city.floodWorks,
    wallTier: delta.wallTier ?? city.wallTier,
    corruption: delta.corruption !== undefined
      ? clamp((city.corruption ?? 0) + delta.corruption, 0, 100)
      : city.corruption,
    drill: delta.drill !== undefined
      ? clamp((city.drill ?? 0) + delta.drill, 0, 100)
      : city.drill,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
