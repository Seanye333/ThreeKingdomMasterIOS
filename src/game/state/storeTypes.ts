/**
 * GameStore 的動作契約 — every action the store exposes, as types only.
 *
 * store.ts was 19,076 lines, of which this interface was 1,143: a wall of
 * declarations sitting between the module helpers and the store body, re-read
 * on every jump through the file. Types only, so moving it cannot change
 * behaviour — `useGameStore` still types itself against this exact interface.
 *
 * (The store BODY — some 17,000 lines of action implementations — is
 * deliberately left where it is: slicing it into zustand slices touches every
 * action, and that is not a change to make unattended.)
 */
import type { BuildingId, CivicTitleId, EdictKind, EntityId, EspionageKind, ExpeditionMode, ImperialRank, InternalAffairsType, MilitaryRankId, PeerageId, ProvinceId, Scenario, ShipClass, TacticalBattle } from '../types';
import { type Affliction } from '../systems/afflictions';
import { type RoutConsequence } from '../systems/wordWar';
import type { Difficulty } from './gameState';
import { type DemandKind } from '../systems/diplomacyPacts';
import { type SmithTier } from '../systems/forging';
import { type SpecialtyRole } from '../data/specialties';
import { type Legion } from '../systems/legion';
import { type SelectionSystem } from '../systems/officialSelection';
import { type SchemeId } from '../systems/schemes';
import { type FacilityKind } from '../types';
import type { BreakthroughPath } from '../systems/growth';
import type { AnnalsEntry } from '../types/event';
import { type GameState } from './gameState';
import { listSlots } from './saveSlots';

export interface GameStore extends GameState {
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
  /** 避戰迂迴 — toggle a moving column's evade stance (slip contacts instead
   *  of fighting; claims no territory while evading). */
  setArmyEvade: (armyId: EntityId) => { ok: boolean; reason?: string };
  /** 追擊 — set a column to hunt an enemy ROUT: it re-aims at the quarry
   *  every season until it dies or reaches shelter. */
  pursueRout: (armyId: EntityId, targetArmyId: EntityId) => { ok: boolean; reason?: string };
  /** 候期 — hold an in-transit column in place one more season (兩路合擊;
   *  stacks to 3). */
  delayMarch: (armyId: EntityId) => { ok: boolean; reason?: string };
  /** 設伏 — toggle a HOLDING army into ambush stance (needs cover at its
   *  cell). Hidden from the enemy map view; springs harder on contact. */
  setArmyAmbush: (armyId: EntityId) => { ok: boolean; reason?: string };
  /** 焚橋斷渡 — the army torches the crossing it stands beside: nearby river
   *  hexes are stamped with a bridge-broken scar (~1 year), so battles fought
   *  over this ground open with the span already down. */
  burnBridge: (armyId: EntityId) => { ok: boolean; reason?: string };
  /** 軍師點撥 — show a one-shot contextual hint for a new mechanic. */
  maybeHint: (key: string, zh: string, en: string) => void;
  /** 長圍 — toggle a HOLDING army into investing the nearest enemy city:
   *  each turn the town bleeds food + loyalty; dry granaries open the gates
   *  without a fight. The garrison may sortie and rout the besiegers. */
  besiegeCity: (armyId: EntityId) => { ok: boolean; reason?: string };
  /** 火炬燒鎖 — a fleet beside a hostile river boom burns the chain through
   *  (王濬故智): 300g from the capital, the boom is destroyed. */
  burnBoom: (armyId: EntityId) => { ok: boolean; reason?: string };
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
    pace?: import('../systems/marchPace').MarchPace,
    /** Suppress the 大軍出征 慶典彈窗 — set by bulk dispatchers (集結/自動) that
     *  fire their own popup or shouldn't pop at all. Manual marches leave it off. */
    quiet?: boolean,
    /** 軍師獻策 — a battle scheme the player chose for this assault (§5.3). */
    forcedStratagem?: string,
  ) => { ok: boolean; reason?: string };
  /** 召回行軍 — turn a column still on the road back toward its source city; it
   *  abandons the objective and streams home, shedding stragglers (deeper = more).
   *  No-op once it's about to arrive (seasonsRemaining ≤ 1) or already returning. */
  recallMarch: (officerId: EntityId) => { ok: boolean; reason?: string };
  /** 邀擊 — enemy marching columns the player can see & run down (their position's
   *  nearest stronghold is one of yours, and they're not behind the fog). The
   *  launch city is that nearest stronghold. */
  spottedEnemyColumns: () => Array<{ armyId: EntityId; fromCityId: EntityId; x: number; y: number; troops: number; commanderName: { zh: string; en: string } }>;
  /** 邀擊 — sortie an officer + troops from a border city to run down a spotted
   *  enemy column; the intercept march aims ahead of the column and clashes when
   *  the two hosts meet on the road. */
  interceptColumn: (armyId: EntityId, fromCityId: EntityId, officerId: EntityId, troops: number) => { ok: boolean; reason?: string };
  /** 一鍵委派 — auto-assign every idle officer in a self-run city a sensible
   *  internal-affairs task (by city need × aptitude). Returns how many were
   *  dispatched and the gold spent. */
  /** Assign idle officers their best-fit civil order. Pass a cityId to govern
   *  just that one city (the map quick-ring 施政 spoke); omit for all cities. */
  autoAssignIdle: (onlyCityId?: EntityId) => {
    assigned: number;
    goldSpent: number;
    /** Who went where — feeds the 委派錄 summary card in the HUD. */
    details: Array<{ officerId: EntityId; cityId: EntityId; type: InternalAffairsType }>;
  };
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
  dispatchExpedition: (officerId: EntityId, fromCityId: EntityId, toCityId: EntityId, mode: ExpeditionMode, companionId?: EntityId) => { ok: boolean; seasons: number; reason?: string };
  /** 召回游历 — recall a roaming officer; he turns straight for home, errand
   *  abandoned (an officer already on his way back is left to it). */
  recallExpedition: (id: EntityId) => void;
  /** 遠使異域 — send an officer on a long embassy to a distant land (FOREIGN_REALMS:
   *  西域/倭/大秦…) or a border tribe (TribeId). He travels far, opens relations
   *  / placates the frontier, and rides home with coin, exotica, auxiliaries and
   *  prestige — if the road doesn't claim him. Reuses the expedition machinery.
   *  §7.7 ② — an optional 副使 (companionId) steadies the mission and 厚禮
   *  (giftGold, spent up front) warms the court for a richer, safer call. */
  dispatchEmbassy: (officerId: EntityId, fromCityId: EntityId, realmId: EntityId, opts?: { companionId?: EntityId; giftGold?: number }) => { ok: boolean; seasons: number; reason?: string };
  /** §7.7 ③ 西域都護府 — designate (or clear, with null) the player frontier city
   *  that consolidates the Silk Road oases: while it stands, every 西域 caravan
   *  pays half again as much and those routes are far harder to cut. */
  designateProtectorate: (cityId: EntityId | null) => { ok: boolean; reason?: string };
  /** §7.7 ④ 常駐使節 — station a free officer long-term at an opened realm. He
   *  leaves the home rosters but holds the realm's goodwill, smooths its caravan,
   *  and slips intel home each season — until recalled. */
  stationEnvoy: (officerId: EntityId, realmId: EntityId) => { ok: boolean; reason?: string };
  /** §7.7 ④ — recall a resident envoy; he returns idle to the realm's frontier
   *  city (or, if it is lost, to the capital). */
  recallEnvoy: (realmId: EntityId) => { ok: boolean; reason?: string };
  /** §7.7-deep ①(A)異域援軍 — call in a realm's 義従遠征軍 to a held city: the
   *  patron of an opened realm (relation ≥ 50) may, for gold and a dip in
   *  standing, summon its signature host (突騎/象兵/汗血騎…) — once per realm per
   *  cooldown. Cavalry realms also stable warhorses there. */
  summonRealmAid: (realmId: EntityId, toCityId: EntityId) => { ok: boolean; reason?: string };
  /** §7.7-deep ③(C)絹馬互市 — set what an opened caravan trades home: 'gold'
   *  (commerce) or 'horses' (買馬 — horse realms only). */
  setRealmTradeMode: (realmId: EntityId, mode: 'gold' | 'horses') => { ok: boolean; reason?: string };
  /** 借糧 — ask a friendly force to send grain to your capital. Allies and NAP
   *  partners (or anyone you're on good terms with) oblige; the grain comes out
   *  of their own stores. */
  requestGrain: (targetForceId: EntityId) => { ok: boolean; accepted?: boolean; message: string };
  /** 通商條約 — open commerce with a force you're at peace with; both earn a
   *  steady gold income each season while the peace holds. */
  proposeTradeTreaty: (targetForceId: EntityId) => { ok: boolean; accepted?: boolean; message: string };
  /** 招撫稱臣 — demand a weaker realm bow as your vassal (§7.1 ①). On consent it
   *  becomes your protected subordinate: tribute each season, summonable to war. */
  demandVassalage: (targetForceId: EntityId) => { ok: boolean; accepted?: boolean; message: string };
  /** 納款稱臣 — offer yourself as vassal to a stronger protector (§7.1 ①). */
  seekProtection: (targetForceId: EntityId) => { ok: boolean; accepted?: boolean; message: string };
  /** 釋放藩屬 — free a vassal of yours (or, if you are a vassal, renounce your
   *  own submission at a 信譽 cost). */
  releaseVassal: (targetForceId: EntityId) => { ok: boolean; message: string };
  /** 徵召藩屬 — summon a vassal into your war against `foeForceId`: the vassal
   *  goes to war with the foe; over-summoning breeds 叛附 discontent. */
  summonVassal: (vassalForceId: EntityId, foeForceId: EntityId) => { ok: boolean; message: string };
  /** 最後通牒 — extort gold/grain, or demand submission, under threat of war
   *  (§7.1 ③). Refusal is a casus belli; acquiescence stokes their 積怨. */
  demandTribute: (targetForceId: EntityId, kind: DemandKind) => { ok: boolean; accepted?: boolean; message: string };
  /** 共討會盟 — forge a war league against `targetForceId`, inviting friendly
   *  realms to swear in (§7.1 ②). Returns who joined. */
  proposeCoalition: (targetForceId: EntityId, inviteeForceIds: EntityId[]) => { ok: boolean; joined: EntityId[]; message: string };
  /** 援盟參戰 — answer (or refuse) a called ally's plea to join their war against
   *  `foeForceId` (§7.1 ④). Honour lifts your repute; refusal marks you down. */
  answerCallToArms: (allyForceId: EntityId, foeForceId: EntityId, join: boolean) => { ok: boolean; message: string };
  /** 應牒 — yield to (or defy) an AI's ultimatum (§7.1 ③ AI-side). Yielding pays
   *  gold/grain or submits as vassal; defiance is a casus belli for the coercer. */
  answerDemand: (fromForceId: EntityId, comply: boolean) => { ok: boolean; message: string };
  /** 索還質子 — recall a 質子 you placed at another court (§7.1 D). The surety
   *  withdrawn, the officer comes home and that realm cools toward you. */
  recallHostage: (officerId: EntityId) => { ok: boolean; message: string };
  /** 調停斡旋 — pay a respected third realm (`brokerForceId`) to broker a peace
   *  between you and `foeForceId` (§7.1 C). Success signs a NAP and eases the
   *  foe's grudge; failure just spends the silver. */
  requestMediation: (brokerForceId: EntityId, foeForceId: EntityId) => { ok: boolean; accepted?: boolean; message: string };
  /** §7.1-deep AC 歲幣買安 — pay a rival a recurring seasonal tribute to keep a
   *  firm peace (it holds off marching on you while paid). */
  offerTribute: (targetForceId: EntityId, amount: number) => { ok: boolean; reason?: string };
  /** §7.1-deep AC 勒索歲貢 — exact a recurring tribute from a much weaker, cowed
   *  rival (needs a decisive strength edge / a casus belli). */
  exactTribute: (targetForceId: EntityId, amount: number) => { ok: boolean; reason?: string };
  dissolveTribute: (targetForceId: EntityId) => { ok: boolean; reason?: string };
  /** §7.1-deep AE 攻守同盟·連橫 — bind a friendly realm into a standing offensive-
   *  and-defensive bloc: it shares your casus belli against a common foe. */
  proposeDefensivePact: (targetForceId: EntityId) => { ok: boolean; reason?: string };
  dissolveDefensivePact: (targetForceId: EntityId) => { ok: boolean; reason?: string };
  /** §7.1-deep AF 朝聘常駐使 — station one of your officers as a resident envoy at
   *  a rival court (he leaves the rosters): each season he holds the relation,
   *  slips intel home, and warns of the rival's designs. Recall to bring him back. */
  stationCourtEnvoy: (officerId: EntityId, targetForceId: EntityId) => { ok: boolean; reason?: string };
  recallCourtEnvoy: (targetForceId: EntityId) => { ok: boolean; reason?: string };
  /** 假途借道 — ask an ally / NAP partner for leave to march through their land
   *  (§7.1 B). While granted you may strike foes bordering their territory (and,
   *  treacherously, the host itself — 假途滅虢 — at a ruinous cost to your name). */
  requestPassage: (grantorForceId: EntityId) => { ok: boolean; accepted?: boolean; message: string };
  /** 求和 — sue a foe to end a war (§7.1 ②'), offering gold reparations for an
   *  8-season NAP. A foe that's winning fights on; a beaten one settles. */
  sueForPeace: (foeForceId: EntityId) => { ok: boolean; accepted?: boolean; message: string };
  /** 受降 — grant (or refuse) a beaten AI's plea for terms (§7.1 ②'): take their
   *  reparations or their submission and end the war, or fight on. */
  answerPeaceOffer: (fromForceId: EntityId, grant: boolean) => { ok: boolean; message: string };
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
  /** 施政重點 — set a delegated city's governor focus (均衡/富國/強兵/守備/安民). */
  setGovernorStance: (cityId: EntityId, stance: import('../systems/governor').GovernorStance) => void;
  /** 主公親裁・表彰 — reward a prefect (spends 府庫 gold): loyalty + 威望. */
  commendGovernor: (officerId: EntityId) => { ok: boolean; reason?: string };
  /** 主公親裁・問責 — discipline a prefect: a stern loyalty/威望 docking. */
  reprimandGovernor: (officerId: EntityId) => { ok: boolean; reason?: string };
  /** 軍團都督 — form a legion (id auto-assigned). */
  createLegion: (legion: Omit<Legion, 'id'>) => void;
  disbandLegion: (legionId: string) => void;
  /** 軍團改編 — edit a legion in place (directive / target / cities / 都督) without
   *  disband-and-rebuild. A new 都督 must still be 金牌+. */
  updateLegion: (legionId: string, patch: Partial<Omit<Legion, 'id'>>) => void;
  /** 全軍集結令 — every player city that can spare a column marches ~70%
   *  of its garrison toward the target under its best idle officer
   *  (adjacent cities directly, the hinterland one hop along an in-realm
   *  path). Returns how many columns were dispatched. */
  /** 全軍集結令 — converge the realm on a city: a hostile target (攻) or one of
   *  your own (勤王 reinforce / 集結點). Options: troop fraction, garrison floor,
   *  exclude 前線 cities. Returns how many columns actually marched. */
  massMuster: (targetCityId: EntityId, opts?: { fraction?: number; keepGarrison?: number; excludeFrontier?: boolean }) => number;
  /** 集結預覽 — what a muster would do without committing: column count, total
   *  troops & gold, slowest ETA, per-column legs, and which cities are excluded. */
  musterPreview: (targetCityId: EntityId, opts?: { fraction?: number; keepGarrison?: number; excludeFrontier?: boolean }) => {
    relief: boolean; columns: number; totalTroops: number; totalGold: number; slowestSeasons: number;
    orders: Array<{ cityId: EntityId; marchTo: EntityId; troops: number; seasons: number }>;
    excluded: Array<{ cityId: EntityId; reason: string }>;
  };
  /** 持續集結 — start a standing campaign that re-musters toward `targetCityId`
   *  each season until it falls (or is cancelled). With `rallyCityId` it gathers
   *  there first (分進合擊). Fires the first wave at once. Returns the campaign id. */
  startMusterCampaign: (targetCityId: EntityId, opts?: { rallyCityId?: EntityId; fraction?: number; keepGarrison?: number; excludeFrontier?: boolean }) => EntityId | null;
  /** 罷集結 — call off a standing muster campaign. */
  cancelMusterCampaign: (id: EntityId) => void;
  /** Step every standing campaign one season (issue its next wave; advance the
   *  gather→strike phase; retire the spent ones). Called at the season boundary. */
  processMusterCampaigns: () => void;
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
  /** 承平之亂 — play on after a victory ending instead of stopping there. */
  continueAfterVictory: () => void;
  /** 換手完成 — the next player has sat down; reveal the board. */
  hotseatReady: () => void;
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
  /** 訪賢勝算 — the odds a 招攬 would roll against right now, plus the coldest
   *  reason they hold back. Same seam the attempt uses (freeAgentRecruitOdds),
   *  so what the button quotes is what the dice see. */
  estimateFreeAgentRecruit: (
    officerId: EntityId,
    cityId: EntityId,
    opts?: { debateWon?: boolean; bribe?: number; giftItemId?: EntityId },
  ) => { chance: number; reasonZh?: string; reasonEn?: string };
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
  /** 君主彈壓 (§7.5 ①) — pre-empt a brewing rebel among your own officers:
   *  安撫 placate (gold → loyalty), 調離 reassign (to capital, strips the power
   *  base), 下獄 imprison, or 誅殺 execute (decisive, but breeds grudges). */
  disciplineOfficer: (officerId: EntityId, action: 'placate' | 'reassign' | 'imprison' | 'execute') => { ok: boolean; message: string };
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
  /** §7.8-deep E 門第聯姻 — bind a great clan that serves you by marriage: a
   *  one-off gold cost lifts every serving scion's loyalty, holds them to a
   *  floor thereafter, and stays the clan's hand from usurpation. */
  cultivateClan: (clanId: string) => { ok: boolean; reason?: string };
  /** §7.8-deep H 策反世族 — try to turn a rival's whole clan to your side: their
   *  cool faith + your house prestige + the coin you offer set the odds; success
   *  flips every serving scion to you at your capital. */
  subvertClan: (clanId: string) => { ok: boolean; reason?: string; turned?: number };
  /** 治國理念 — set the player realm's school of statecraft (法/儒/道/兵), or
   *  null to revert to 雜糅 (no slant). */
  setStatecraft: (
    school: import('../data/statecraft').StatecraftSchool | null,
  ) => void;
  /** §7.9-deep L 國策大政 — enact the held school's signature decree (變法強國 /
   *  興太學舉孝廉 / 輕徭薄賦 / 屯田耕戰). Needs 造詣 ≥ threshold; effects scale with
   *  mastery; on a cooldown. */
  enactStatecraftDecree: () => { ok: boolean; reason?: string };
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
  /** 演習收功 — conclude a drill: bank 練度 + 武將歷練 scaled by how the garrison
   *  fared (held the walls → more; routed → less; bailed early → token), then
   *  clear the board. Replaces the old flat +3-on-launch. */
  endPracticeDrill: () => void;
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
  /** 名場面入史 — append one line to the running 事件簿 (§6.13): an epic duel, etc. */
  recordAnnal: (entry: AnnalsEntry) => void;
  /** 成就觸發 — fire one achievement trigger (load → process → save → toast). */
  fireAchievement: (trigger: import('../types/achievement').AchievementTrigger) => void;
  /** 代戰認輸金 — move a duel indemnity from the loser's realm to the winner's (§6.13). */
  settleDuelTribute: (loserForceId: EntityId, winnerForceId: EntityId, amount: number) => { moved: number };
  /** 決鬥定和 — propose settling a quarrel by champions (以戰止戰). Spends the envoy
   *  fee and rolls the foe's acceptance; on acceptance the host UI fights the bout. */
  proposePeaceDuel: (targetForceId: EntityId) => { ok: boolean; reason?: string; accepted?: boolean; myChampionId?: EntityId; foeChampionId?: EntityId; message?: string };
  /** 決鬥定和·締約 — bind the settled bout's terms: NAP both ways; loser pays. */
  settlePeaceDuel: (targetForceId: EntityId, myChampionId: EntityId, foeChampionId: EntityId, outcome: import('../systems/duelDiplomacy').PeaceDuelOutcome) => { ok: boolean; message: string };
  /** 名局廊 — archive a notable duel/debate so it can be replayed from the hall. */
  recordBout: (rec: import('../systems/duelHall').BoutRecord) => void;
  /** 武評榜 — fold an interactive duel result into the ELO ladder (a from a's view). */
  recordDuelRating: (aId: EntityId, bId: EntityId, result: 'win' | 'loss' | 'draw') => void;
  /** 恩怨簿 — record a finished duel into the head-to-head history (forges 宿敵). */
  recordRivalry: (aId: EntityId, bId: EntityId, winner: 'attacker' | 'defender' | 'draw', killed: boolean) => void;
  /** 文敵簿 (§6.15) — record a finished 舌戰 into the debate-rivalry ledger; a
   *  pair who keep crossing words become 文敵 (and get writ priority). */
  recordDebateRivalry: (aId: EntityId, bId: EntityId, winner: 'a' | 'd' | 'draw', routed: boolean) => void;
  /** 團戰名局 (§6.11) — archive a finished champion melee into the 名局廊 so it
   *  can be re-staged later (ids only; the live roster rehydrates it). */
  recordMeleeBout: (result: import('../systems/teamDuel').TeamDuelResult) => void;
  /** 約戰 — apply a formal challenge's 威名/忠誠 stakes to challenger + target. */
  applyDuelChallengeStakes: (challengerId: EntityId, targetId: EntityId, outcome: import('../systems/duelChallenge').ChallengeOutcome) => void;
  /** 陣斬 — a non-battlefield duel (約戰/劇情) cuts an officer down for real: mark
   *  them dead and seed 復仇/為兄弟復仇 grudges on their kin (as a field kill does). */
  slayOfficerInDuel: (slayerId: EntityId, victimId: EntityId) => void;
  /** 傷殘 — a brutal single combat leaves a permanent maim (斷臂/目眇/跛足). */
  inflictDuelScar: (officerId: EntityId, scar: import('../systems/duel').DuelScar) => void;
  /** 武學心得 — bank arena insight on an officer (苦戰頓悟 / 演武所得). */
  awardMartialInsight: (officerId: EntityId, amount: number) => void;
  /** 武學修煉 — spend banked 心得 to raise the officer's 修為 one step. */
  trainMartialArts: (officerId: EntityId) => { ok: boolean; reason?: string; xiuwei?: number; gained?: number; tierUpZh?: string; tierUpEn?: string };
  /** 修為直增 — raise an officer's 修為 directly (for AI fighters who never 修煉). */
  growMartialXiuwei: (officerId: EntityId, amount: number) => void;
  /** 宗師傳藝 — a 宗師+ master spends 心得 to drill a same-city junior's 修為 (§6.10). */
  transmitMartialArts: (masterId: EntityId, pupilId: EntityId) => { ok: boolean; reason?: string; gained?: number; tierUpZh?: string; tierUpEn?: string };
  /** 衣缽傳人 (§6.18) — a 宗師/名士 names the pupil who carries their craft on
   *  (pass null to unname). The heir inherits on the master's death. */
  nameArtHeir: (masterId: EntityId, heirId: EntityId | null, art: 'martial' | 'debate') => { ok: boolean; reason?: string };
  /** 悟招 (§6.10) — spend 武學心得 to grasp a duel move ahead of its 歷練 gate. */
  learnDuelMove: (officerId: EntityId, move: import('../systems/duel').DuelMove) => { ok: boolean; reason?: string; cost?: number };
  /** 改換門庭 (§6.10) — spend 心得 to abandon a 流派 for another; 修為 keeps 60%. */
  switchMartialSchool: (officerId: EntityId, school: import('../systems/duel').WeaponClass) => { ok: boolean; reason?: string; cost?: number; xiuwei?: number };
  /** 文辯心得 — bank lectern insight on an officer (論戰頓悟 / 清談所得). */
  awardDebateInsight: (officerId: EntityId, amount: number) => void;
  /** 講席 — spend banked 文辯心得 to raise the officer's 文辯修為 one step (§6.14). */
  trainDebateArts: (officerId: EntityId) => { ok: boolean; reason?: string; xiuwei?: number; gained?: number; tierUpZh?: string; tierUpEn?: string };
  /** 文辯修為直增 — raise an officer's 文辯修為 directly (for AI debaters who never 講席). */
  growDebateXiuwei: (officerId: EntityId, amount: number) => void;
  /** 名士傳道 — a 名士+ scholar spends 心得 to lecture a same-city junior's 文辯修為. */
  transmitDebateArts: (masterId: EntityId, pupilId: EntityId) => { ok: boolean; reason?: string; gained?: number; tierUpZh?: string; tierUpEn?: string };
  /** 折衝樽俎 (§6.16) — propose a war of words at the table: 'concord' (會盟修好,
   *  either way a NAP; the bout decides who pays) or 'tribute' (責讓索貢). Returns
   *  the matchup for the UI to fight out interactively. */
  proposeParley: (kind: 'concord' | 'tribute', targetForceId: EntityId) => { ok: boolean; reason?: string; accepted?: boolean; myVoiceId?: EntityId; foeVoiceId?: EntityId; message?: string };
  /** 折衝樽俎 — settle a fought-out parley (the UI reports the interactive outcome). */
  settleParley: (kind: 'concord' | 'tribute', targetForceId: EntityId, myVoiceId: EntityId, foeVoiceId: EntityId, outcome: import('../systems/debateDiplomacy').ParleyOutcome, routed: boolean) => { ok: boolean; message: string };
  /** 舌戰說降 — send a lone voice to a weakly-held enemy wall; returns the gate-
   *  keeper matchup for the interactive bout (or the refusal). */
  proposePersuadeCity: (cityId: EntityId, envoyId: EntityId) => { ok: boolean; reason?: string; accepted?: boolean; defenderId?: EntityId; message?: string };
  /** 舌戰說降 — settle the bout at the wall: a 罵倒 opens the gates without a corpse;
   *  a points win bleeds the garrison; a loss shames the envoy. */
  settlePersuadeCity: (cityId: EntityId, envoyId: EntityId, defenderId: EntityId, outcome: import('../systems/debateDiplomacy').ParleyOutcome, routed: boolean) => { ok: boolean; message: string };
  /** 說降來使 (§6.16 對稱) — turn the enemy envoy away unheard; the wall's pride
   *  stings a little but no argument is risked. */
  refusePersuasion: () => { ok: boolean; message?: string };
  /** 說降來使 — settle the fought-out defense of your wall. `outcome` is from the
   *  DEFENDER's (your) view; `envoyRouted` = the envoy 罵倒 your defender. */
  settleIncomingPersuasion: (outcome: 'win' | 'loss' | 'draw', envoyRouted: boolean) => { ok: boolean; message: string };
  /** 月旦來辯 (§6.15 對稱) — duck the rival's writ (文名受損), or clear it after
   *  answering it with a real bout. */
  duckMoonWrit: () => { ok: boolean; message?: string };
  clearMoonWrit: () => void;
  /** 索貢來牒·舌戰抗辯 — contest a standing ultimatum at the table instead of
   *  yielding or defying: returns the two courts' voices for the interactive bout. */
  contestDemand: (fromForceId: EntityId) => { ok: boolean; reason?: string; myVoiceId?: EntityId; foeVoiceId?: EntityId };
  /** 舌戰抗辯 — settle the contested ultimatum: win → the demand is withdrawn. */
  settleDemandDebate: (fromForceId: EntityId, outcome: 'win' | 'loss' | 'draw') => { ok: boolean; message: string };
  /** 月旦品題 (§6.15) — the critique pronounces its verdict on a new 魁首: a
   *  standing epithet(「治世之能臣…」)stamped once and kept for life. */
  stampMoonEpithet: (officerId: EntityId) => void;
  /** 月旦奪魁 — an interactive challenge unseated (or failed to unseat) the 魁首;
   *  the UI runs the bout, this settles seat/rewards/annal (§6.15). */
  seizeMoonLaurel: (challengerId: EntityId, won: boolean) => { ok: boolean; reason?: string; insight?: number; gold?: number };
  /** 守評 — the player-held 魁首 answered a challenger: held → stipend, lost → the
   *  laurel passes. The UI runs the interactive bout and reports the outcome. */
  defendMoonLaurel: (held: boolean, challengerId: EntityId) => { ok: boolean; reason?: string; insight?: number; gold?: number };
  /** 打擂 — challenge the standing arena champion (§6.11); win to take the 擂主 seat. */
  challengeArena: (challengerId: EntityId) => { ok: boolean; reason?: string; won?: boolean; championZh?: string; championEn?: string; insight?: number; gold?: number };
  /** 坐鎮擂台 — hold the seat one season against a fresh challenger (stipend / seat risk). */
  holdArena: () => { ok: boolean; reason?: string; held?: boolean; challengerZh?: string; challengerEn?: string; insight?: number; gold?: number };
  /** 折服來投 — a foe bested (and spared) in a 約戰 comes over to the player's side. */
  recruitViaDuel: (officerId: EntityId) => boolean;
  /** 辯服來投 (§6.16) — a foe out-argued in a war of words crosses over. */
  recruitViaDebate: (officerId: EntityId) => boolean;
  /** 天下無雙 — crown the 比武大會 champion: a 武評榜 climb + 威名 for the field.
   *  The steep climb is a once-a-year prize; returns false if already held this year. */
  awardTournamentChampion: (championId: EntityId, finalistIds: EntityId[]) => boolean;
  /** 清談大會 (§6.15) — crown the year's 文魁: a steep 文名 climb + 文辯心得 for
   *  the victor, lesser for the finalists. Returns false if already held this year. */
  awardSalonChampion: (championId: EntityId, finalistIds: EntityId[]) => boolean;
  /** 約戰牽動外交 — shift the 好感 between two forces (e.g. a humbling 約戰 breeds
   *  a grudge; an honourable draw breeds mutual respect). Clamped −100..100. */
  adjustForceFavor: (forceA: EntityId, forceB: EntityId, delta: number) => void;
  /** 單挑戰役 — mark a duel scenario cleared (campaign progress). */
  markDuelScenarioCleared: (scenarioId: EntityId) => void;
  /** 舌戰戰役 — mark a debate scenario cleared (unlocks the chain's next step). */
  markDebateScenarioCleared: (scenarioId: EntityId) => void;
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
    deathAgent?: boolean,
  ) => { ok: boolean; reason?: string };
  /** §7.3-deep X 繡衣校事 — seat (or clear, with null) the intelligence bureau at
   *  a held city: while it stands it runs a free scouting op each season and
   *  stiffens counter-intel. */
  designateSpyBureau: (cityId: EntityId | null) => { ok: boolean; reason?: string };
  cancelEspionage: (opId: EntityId) => void;
  /** 潛伏 — plant one of your officers as a persistent spy in an enemy city. */
  plantSpy: (agentOfficerId: EntityId, targetCityId: EntityId) => { ok: boolean; reason?: string };
  /** Extract an embedded spy safely before they are exposed. */
  recallSpy: (spyId: EntityId) => void;
  /** 眠龍出淵 — activate an embedded spy as an inside agent for one devastating
   *  strike (§7.3 ④): the host city is thrown into chaos (loyalty/food/troops), and
   *  the spy's cover is spent (the agent slips home, burned). */
  activateSpy: (spyId: EntityId) => { ok: boolean; message: string };
  /** 肅諜清查 — sweep your realm for enemy 潛伏細作 (§7.3 ②): each found spy is
   *  rooted out (caught & held), and counter-intel stiffens for a few seasons. */
  counterIntelSweep: () => { ok: boolean; caught: number; message: string };
  /** 反間 — turn a captured enemy spy/officer (§7.3 ②/④). `asDoubleAgent` false →
   *  they join you outright + their realm's cities are laid bare; true → they slip
   *  back into their former realm as YOUR embedded double agent (ongoing intel). */
  turnSpy: (officerId: EntityId, asDoubleAgent?: boolean) => { ok: boolean; message: string };
  issueEdict: (
    kind: EdictKind,
    targetForceId?: EntityId,
  ) => { ok: boolean; reason?: string; message?: string };
  promoteImperialRank: (
    forceId: EntityId,
    rank: ImperialRank,
  ) => { ok: boolean; reason?: string };
  /** 朝政傾向 — patronise a court faction (or null to withdraw), §7.4 ①. Each
   *  season the favoured bloc rallies and the realm reaps that faction's boon. */
  setCourtPatronage: (faction: import('../systems/courtFactions').FactionId | null) => void;
  /** 黨錮 — purge a court faction (§7.4 ①): its members' loyalty craters and the
   *  Mandate dips, but a purged capable officer may defect in fury. */
  purgeFaction: (faction: import('../systems/courtFactions').FactionId) => { ok: boolean; message: string };
  /** §7.4-deep N 外戚干政 — raise an officer's kin as consort-kin (立后納妃): he
   *  and his house grow loyal and lend the court a standing hand. */
  elevateConsort: (officerId: EntityId) => { ok: boolean; reason?: string };
  /** §7.4-deep O 賣官鬻爵 — the inner court sells offices for coin (needs the 天子
   *  and a strong 學官): quick gold, but 民心 and 清流 pay for it. */
  sellOffices: () => { ok: boolean; reason?: string };
  /** §7.4-deep O 盡誅學官 — purge the inner court (袁紹之舉): resets 學官 power, a
   *  one-off shock — 清流 rejoice, the 學官 fall, the palace reels. */
  purgeEunuchs: () => { ok: boolean; reason?: string };
  /** §7.4-deep P 改元 — a sovereign proclaims a new era, swelling the Mandate
   *  (on a cooldown). */
  declareNewEra: (eraName: string) => { ok: boolean; reason?: string };
  /** §7.5-deep T 翦除肘腋 — move against an over-mighty minister climbing toward
   *  your throne: scatter his 心腹黨羽 and knock him down a rung. Costs coin and
   *  risks provoking a premature revolt. */
  curbUsurper: () => { ok: boolean; reason?: string };
  /** §7.5-deep R 清君側 — raise a righteous banner against a realm that invites
   *  one (a usurper / tyrant / runaway inner court): gain a 討逆 casus belli. */
  raiseRighteousBanner: (targetForceId: EntityId) => { ok: boolean; reason?: string };
  /** §7.5-deep S 納流亡客將 — shelter a deposed lord wandering in exile: he and a
   *  few faithful followers enter your service — but a sheltered claimant may one
   *  day turn on his host (鳩占鵲巢). */
  shelterExile: (officerId: EntityId) => { ok: boolean; reason?: string };
  /** §7.10 AH 借兵復國 — cede a border city to install a sheltered guest exile as
   *  his own realm again: a grateful vassal-and-ally puppet state (借荊州). */
  sponsorReclaim: (officerId: EntityId, cityId: EntityId) => { ok: boolean; reason?: string };
  setSoundEnabled: (enabled: boolean) => void;
  setMusicTrack: (track: string | null) => void;
  setLanguage: (lang: 'zh' | 'en' | 'both') => void;
  setPlacementMode: (mode: 'historical' | 'random') => void;
  setEnabledDynasties: (dynasties: import('../data/dynasties').Dynasty[]) => void;
  setFogOfWar: (on: boolean) => void;
  /** 定稅 — set a force's tax rate (defaults apply to the player's force). */
  setTaxPolicy: (forceId: EntityId, rate: import('../types').TaxRate) => void;
  /** 律令 (§1.11) — set the realm's legal code (寬刑/平律/峻法). Takes effect at
   *  the next season tick: loyalty drift, graft, tax yield and docket growth. */
  setLawCode: (severity: import('../systems/law').LawSeverity) => void;
  /** 大工 (§1.15) — begin a great public work at one of your cities. One realm,
   *  one work: it eats gold up front and loyalty every season, and only heavy
   *  corvée (§1.12) makes the calendar bearable. */
  startGrandProject: (id: import('../systems/grandProjects').GrandProjectId, cityId: EntityId)
    => { ok: boolean; message: string };
  /** 罷役 — abandon the work in progress. The gold is spent and gone. */
  abandonGrandProject: () => { ok: boolean; message: string };
  /** 題詠 (§1.13) — an officer of letters composes at his city. Costs gold and
   *  the officer's season; the poem enters the realm's 文集. */
  composePoemAt: (officerId: EntityId, occasion?: import('../systems/culturalWorks').PoemOccasion)
    => { ok: boolean; message: string; poem?: import('../systems/culturalWorks').Poem };
  /** 立祠 (§1.13) — raise a shrine to an officer who has died (one per city). */
  buildShrine: (officerId: EntityId, cityId: EntityId) => { ok: boolean; message: string };
  /** 選官之制 (§3.6) — adopt a recruitment system (察舉/九品中正/開科取士).
   *  Refused when the realm can't support it (太學/中正/疆土). */
  setSelectionSystem: (sys: SelectionSystem) => { ok: boolean; message: string };
  /** 徭役 (§1.12) — set the realm's corvée level (息役/薄役/重役): public works
   *  rise faster, paid for in loyalty, harvest, and households fleeing the
   *  registers into the shelter of the great houses. */
  setCorvee: (level: import('../systems/household').CorveeLevel) => void;
  /** 糴政 (§1.16) — set the realm's grain-trade policy (通糴/平糴/閉糴). */
  setGrainPolicy: (policy: import('../systems/grainTrade').GrainPolicy) => void;
  /** 錢法 (§1.17) — set the realm's coin standard (五銖/大錢/穀帛為市). */
  setCoinStandard: (standard: import('../systems/coinage').CoinStandard) => void;
  /** 兵制 (§4.8) — set the realm's service system (更卒/世兵/募兵). */
  setServiceSystem: (system: import('../systems/conscription').ServiceSystem) => void;
  /** 流民之政 (§8.6) — set the realm's policy on the displaced. */
  setRefugeePolicy: (policy: import('../systems/refugees').RefugeePolicy) => void;
  /** 一代記落幕 — dismiss the career-run epilogue card. */
  dismissCareerEpilogue: () => void;
  /**
   * 接差事 — 一代記主角替人辦一趟活,當場結算。
   * 白身唯一掙得到功績的路;失手會折兵,大敗會傷到自己。
   */
  takeErrand: (errandId: string) => { ok: boolean; message: string };
  /** 主角所在城此刻可接的差事。與 takeErrand 走同一顆種子,兩邊看到的必然同一批。 */
  currentErrands: () => import('../systems/careerErrands').Errand[];
  /** 大赦天下 (§1.11) — empty every court in the realm: loyalty everywhere and
   *  the docket wiped, paid for in gold, in the throne's dignity, and in the
   *  men you just let out. Refused if one was proclaimed too recently. */
  proclaimAmnesty: () => { ok: boolean; message: string };
  /** 行賞 (§4.10) — settle an officer's outstanding merit out of the capital. */
  rewardMerit: (officerId: EntityId) => { ok: boolean; message: string };
  /** 軍法處置 (§4.10) — answer for an officer's defeats. */
  punishOfficer: (officerId: EntityId, punishment: import('../systems/militaryLaw').PunishmentId)
    => { ok: boolean; message: string };
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
  ) => { ok: boolean; reason?: string; plus?: number; smith?: { zh: string; en: string }; smithTier?: SmithTier; bornLore?: number; affixId?: string };
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
  /** 兵器覺醒 — engrave an unlocked 威名-milestone perk into a held item. */
  awakenItem: (itemId: EntityId, perkId: string) => { ok: boolean; reason?: string };
  /** 重鑄分解 — smelt a held item back to iron; gone for the campaign. */
  smeltItem: (itemId: EntityId) => { ok: boolean; reason?: string; iron?: number };
  /** 器魂進化 — awaken a ★5 名器 神兵 into its ·神 final form (gold+iron). */
  evolveItem: (itemId: EntityId) => { ok: boolean; message: string };
  /** 保養 — whet a worn 神兵 back to keen at a forge city (gold scales with wear). */
  whetItem: (itemId: EntityId) => { ok: boolean; message: string };
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
  ) => { ok: boolean; win?: boolean; message: string; mengHuo?: { captures: number; submitted: boolean } };
  /** 招撫異族 — pay tribute/gifts (gold from capital) to cool a tribe's
   *  aggression for a while. Always succeeds if gold available. */
  placateTribe: (tribeId: string) => { ok: boolean; message: string };
  /** §8.3-deep 七擒孟獲 — decide a captured Meng Huo's fate: release (義釋,
   *  cools the frontier and walks the 七擒 road) or execute (ends the chain,
   *  enrages the south). */
  resolveMengHuoCapture: (release: boolean) => { ok: boolean; message: string };
  /** §8.3-deep 和親 — marry a clanswoman to the chieftain: the tribe stops
   *  raiding YOUR cities for a generation (背盟 possible at extreme fervor). */
  proposeTribeMarriage: (tribeId: string) => { ok: boolean; message: string };
  /** §8.3-deep 互市 — open a border horse-market with the tribe: seasonal
   *  coin + occasional horsemen; closes itself if the frontier burns. */
  openTribeMarket: (tribeId: string) => { ok: boolean; message: string };
  /** §8.3-deep 質子 — a pacified tribe sends a hostage-prince who serves as
   *  a real officer; while he serves, tribal aggression stays capped. */
  requestTribeHostage: (tribeId: string) => { ok: boolean; message: string };
  /** §8.3-deep 以夷制夷 — pay a tribe to raid a rival's border cities for
   *  two seasons. */
  inciteTribeRaid: (tribeId: string, targetForceId: EntityId) => { ok: boolean; message: string };
  /** §8.3-deep 二虜相攻 — set two tribes with overlapping ranges at each
   *  other; both bleed and the frontier goes quiet. */
  clashTribes: (tribeIdA: string, tribeIdB: string) => { ok: boolean; message: string };
  /** §8.5 郊祀 — the yearly suburban sacrifice: gold + grain for mandate. */
  performImperialRite: () => { ok: boolean; message: string };
  /** §8.5 祈雨 — in a drought season, pray for rain (politics-led). */
  prayForRain: () => { ok: boolean; success?: boolean; message: string };
  /** 得將開卡 — show/clear the card-reveal flourish for an officer. */
  setCardReveal: (officerId: EntityId | null) => void;
  /** 開包閃度 — roll & stamp a card's foil the first time it is pulled. */
  assignFoil: (officerId: EntityId, opts?: { minGold?: boolean }) => void;
  /** 升星 — buy the officer's next 星級 (gold from their city; stars.ts). */
  investStar: (officerId: EntityId) => { ok: boolean; message: string };
  /** 殘卷煉星 — spend 名將殘卷 (not gold) to buy the next star; level-gated. */
  forgeStar: (officerId: EntityId) => { ok: boolean; message: string };
  /** 圖鑑功勳 — claim a reached codex-coverage milestone into this campaign. */
  claimCodexMilestone: (milestoneId: string) => { ok: boolean; message: string };
  /** 藏珍功勳 — claim a reached item-codex milestone into this campaign (iron+gold). */
  claimItemCodexMilestone: (milestoneId: string) => { ok: boolean; message: string };
  /** 名城功勳 — claim a reached city-codex milestone (capital gold + realm loyalty). */
  claimCityCodexMilestone: (milestoneId: string) => { ok: boolean; message: string };
  /** 求賢祭 — once a season, pay gold at the capital to reveal one hidden
   *  talent (moves to the capital as a free agent; recruit them yourself). */
  holdTalentFestival: () => { ok: boolean; message: string };
  /** 演義重現 — spectate an AI-vs-AI report battle as a live 3D dramatization
   *  (both sides play themselves; nothing writes back to the campaign). */
  spectateBattle: (detail: import('../types').BattleDetail) => boolean;
  /** 演義收場 — dismiss a spectated battle without touching the campaign. */
  dismissSpectate: () => void;
  /** 告老傳承 — retire an elder (60+): full inheritance to the best same-city
   *  disciple (XP, one skill, their gear), master steps down honoured. */
  retireOfficer: (officerId: EntityId) => { ok: boolean; message: string };
  /** 銘刻 — name/inscribe a storied (威名≥60) item held by your officer. */
  inscribeItem: (itemId: EntityId, name: string, motto: string) => { ok: boolean; message: string };
  /** 題跋 — write (or clear, with empty text) a collector's colophon on a card. */
  inscribeOfficer: (officerId: EntityId, text: string) => void;
  /** 洗髓 — a physician's once-per-lifetime latent-cap treatment. */
  marrowCleanse: (officerId: EntityId) => { ok: boolean; message: string };
  /** 日流 — playback controls for the day-by-day turn flow. */
  beginDayFlow: () => void;
  setDayFlowFollow: (on: boolean) => void;
  /** 真日級親征 — fight the currently-fired encounter NOW (mid-flow). */
  engageEncounter: () => boolean;
  dayFlowTick: () => void;
  dayFlowTogglePause: () => void;
  dayFlowSetSpeed: (speed: number, persist?: boolean) => void;
  dayFlowSkip: () => void;
  /** §8.2-deep 賑災 — answer a disaster: 開倉賑濟 / 徙民就食 / 坐視不理. */
  answerRelief: (cityId: EntityId, choice: 'grant' | 'migrate' | 'ignore') => { ok: boolean; message: string };
  /** §8.4-deep 招安 — send an envoy to talk a cult banner into surrender
   *  (張魯 model): success flips its cities and officers to you. */
  pacifyCultForce: (cultForceId: EntityId, envoyOfficerId: EntityId) => { ok: boolean; success?: boolean; message: string };
  /** §8.4-deep 宣撫 — post an officer to a threatened city; his presence
   *  blunts cult contagion there for a few seasons. */
  dispatchPacifyMission: (officerId: EntityId, cityId: EntityId) => { ok: boolean; message: string };
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
  /** 修繕 — repair a siege-damaged building (gold cost ~40% of its level
   *  build price); its bonuses come back immediately. */
  repairBuilding: (cityId: EntityId, buildingId: BuildingId) => { ok: boolean; reason?: string };
  /** 入城三選 — resolve the post-conquest policy for a freshly stormed city:
   *  安民 (loyalty)、犒軍 (recover walking wounded)、搜捕 (hunt down the old
   *  regime's officers, at a loyalty price). */
  resolveConquestPolicy: (kind: 'pacify' | 'reward' | 'roundup') => void;
  /** 街頭際遇 — resolve a city-street encounter (行商/遊俠/相士/說書人).
   *  Consumes this city's encounter for the season either way. */
  resolveStreetEncounter: (
    cityId: EntityId,
    kind: 'merchant' | 'knight' | 'soothsayer' | 'storyteller',
    accept: boolean,
  ) => { ok: boolean; reason?: string };
  appointGovernor: (
    provinceId: ProvinceId,
    officerId: EntityId,
  ) => { ok: boolean; reason?: string };
  /** 召還 — recall a province governor (clears the 割據 meter + tenure). */
  recallGovernor: (provinceId: ProvinceId) => { ok: boolean; reason?: string };
  /** 安撫 — spend gold to cool a restive 州牧's 割據 meter + firm his loyalty. */
  appeaseGovernor: (provinceId: ProvinceId) => { ok: boolean; reason?: string };
  /** 州牧辟召 — one-click 委任太守 for every undelegated city of the province. */
  provinceLevy: (provinceId: ProvinceId) => { ok: boolean; count: number; reason?: string };
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
  /** 序章 — dismiss the campaign's opening page. */
  closePrologue: () => void;
  setHotSeatPlayers: (players: Array<{ forceId: EntityId; label: string }>) => void;
  cycleHotSeat: () => void;
  buildShip: (
    cityId: EntityId,
    shipClass: ShipClass,
  ) => { ok: boolean; reason?: string };
  loadRandomScenario: (forceCount: number, year: number, seed?: number) => void;
  reset: () => void;
}
