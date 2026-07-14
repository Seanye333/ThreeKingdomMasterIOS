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
import { emptyTribeDiplomacy } from '../systems/tribesDiplomacy';
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
  /** §7.1-deep AC 歲幣納貢 — standing seasonal tribute pacts. Paying a stronger
   *  rival buys a firm peace (it holds off while paid); extorting a cowed weaker
   *  one milks a steady stream into your coffers. (互市 mutual-trade income is the
   *  separate 通商條約 / tradePartners system.) */
  tributePacts: Array<{ payerForceId: EntityId; payeeForceId: EntityId; amount: number; sinceYear: number }>;
  /** §7.1-deep AE 攻守同盟·連橫 — standing offensive-and-defensive pacts (pairs):
   *  a bloc member share a common foe's casus belli and rally harder to a
   *  partner under attack — a step beyond a mere alliance/NAP. */
  defensivePacts: Array<{ forceA: EntityId; forceB: EntityId; sinceYear: number }>;
  /** §7.1-deep AF 朝聘常駐使 — officers the player has stationed as resident
   *  envoys at rival courts (targetForceId → posting): each season they hold the
   *  relation, slip intel home, and give advance warning of the rival's designs. */
  courtEnvoys: Record<EntityId, { officerId: EntityId; targetForceId: EntityId; sinceYear: number }>;
  /** 共討會盟 — active player-led war leagues (§7.1). Each names a 盟主, a foe,
   *  and the sworn members; resolved/expired in systems/diplomacyPacts. */
  warCoalitions: import('../types/diplomacy').WarCoalition[];
  /** 附庸不臣 — per-vassal discontent (0..100). Rises when a suzerain over-levies
   *  (索貢) or summons a vassal to war (徵召); high discontent + a vassal that has
   *  outgrown its lord feeds 叛附 (systems/diplomacyPacts.tickVassalRevolt). */
  vassalDiscontent: Record<EntityId, number>;
  /** 援盟之請 — standing calls to arms from menaced player allies (§7.1 ④),
   *  refreshed each season; answered via store.answerCallToArms. */
  pendingCallsToArms: import('../types/diplomacy').CallToArms[];
  /** 索貢來牒 — ultimatums AI realms have pressed on the player (§7.1 ③ AI-side);
   *  yielded to or defied via store.answerDemand. */
  pendingDemands: import('../types/diplomacy').DiplomaticDemand[];
  /** 假途・借道 — active grants of passage (§7.1 B). Each lets its grantee stage
   *  attacks through the grantor's land; expired/pruned each season. */
  passageGrants: import('../types/diplomacy').PassageGrant[];
  /** 求和乞降 — standing pleas from beaten AI realms to end a war (§7.1 ②');
   *  granted/refused via store.answerPeaceOffer. */
  pendingPeaceOffers: import('../types/diplomacy').PeaceOffer[];
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
  /** 疑兵之計 — bluffed deterrences (§7.2). `byForceId` has cowed `targetForceId`
   *  into NOT marching on byForceId's cities while active (read by ai.pickForceTarget). */
  deterrences: Array<{ byForceId: EntityId; targetForceId: EntityId; expiresYear: number; expiresSeason: 'spring' | 'summer' | 'autumn' | 'winter' }>;
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
  cityCaptured: { key: number; cityId: EntityId; surrender?: boolean } | null;
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
  /** 肅諜 — seasons of heightened counter-intel remaining (§7.3 ②), set by a
   *  counter-intel sweep; while >0, enemy espionage against the player is blunted. */
  counterIntelSeasons?: number;
  /** §7.3-deep U 細作網絡 — the player's standing spy network into each rival
   *  realm (forceId → 0–100): grows with successful ops & embedded spies, decays
   *  when idle. A deep network sharpens ops, lights a city each season, and warns
   *  of the rival's own schemes. */
  spyNetwork: Record<EntityId, number>;
  /** §7.3-deep V 流言惑眾 — cities where a rumour is loose (cityId → the spread):
   *  each season it saps 民心 and may leap to a neighbouring enemy city. */
  rumorCities: Record<EntityId, { seasonsLeft: number; byForceId: EntityId }>;
  /** §7.3-deep X 繡衣校事 — the city seated as the realm's intelligence bureau
   *  (校事府): while held it runs a free scouting op each season and stiffens
   *  counter-intel realm-wide. */
  spyBureauCityId: EntityId | null;
  /** 朝政傾向 — the court faction the player patronises (§7.4 ①), if any: each
   *  season the favoured bloc rallies and the realm reaps that faction's boon. */
  courtPatronage?: import('../systems/courtFactions').FactionId | null;
  /** Historical record of all issued edicts. */
  edictHistory: IssuedEdict[];
  /** Per-edict cooldown tracking: season-count when each kind is available again. */
  edictCooldowns: Partial<Record<EdictKind, { year: number; season: GameDate['season'] }>>;
  /** Foreign tribe pressure state. */
  tribeState: TribeState;
  /** §8.3-deep 異族內交 — 和親/互市/質子 pacts, 以夷制夷 incitements, 入主建國
   *  foundings, 七擒 submission state. */
  tribeDiplomacy: import('../systems/tribesDiplomacy').TribeDiplomacyState;
  /** §8.5 郊祀 — the year the great suburban sacrifice was last performed. */
  lastSuburbanRiteYear: number | null;
  /** §8.5 祈雨 — one rain-prayer per season (reset at season boundary). */
  rainRiteDone: boolean;
  /** §8.2-deep 賑災 — disasters in player cities awaiting an answer (開倉/
   *  徙民/坐視); unanswered prompts lapse at the next season boundary. */
  pendingRelief: import('../systems/events').ReliefPrompt[];
  /** §8.2-deep 大災之後必有大疫 — cities struck by flood/famine/quake last
   *  season; they carry 3× plague odds this season. Replaced each season. */
  plagueRiskCityIds: EntityId[];
  /** §8.4-deep 宣撫 — standing missions (officerId → posted city). */
  pacifyMissions: Record<EntityId, import('../systems/religion').PacifyMission>;
  /** §8.1-deep 事件簿 — the browsable 災異志 annals (capped at 500). */
  annals: import('../types/event').AnnalsEntry[];
  /** Sound on/off — persisted preference. */
  soundEnabled: boolean;
  /** All buildings in all cities. */
  buildings: Building[];
  /** Trade routes between cities. */
  tradeRoutes: TradeRoute[];
  /** Provincial governor appointments keyed by province id. */
  provinceGovernors: Partial<Record<ProvinceId, EntityId>>;
  /** 州牧・擁兵自重 — provinceId → 割據 meter (0..100). At 100 the 州牧 secedes. */
  provinceWarlordism: Partial<Record<ProvinceId, number>>;
  /** 州牧任期 — provinceId → year the steward took the province (久任尾大不掉). */
  provinceGovernorSince: Partial<Record<ProvinceId, number>>;
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
  /** 三顧 — how many times the player has called on each 名所's recluse, so a
   *  hermit's sincerity test (一訪不遇 → 三顧乃出) escalates across visits. */
  scenicVisits: Record<string, number>;
  /** 持續集結 — active standing muster campaigns (player + AI 總動員), each
   *  re-issuing a wave toward its objective every season until it falls. */
  musters: Record<string, import('../systems/muster').MusterCampaign>;
  /** 得將開卡 — transient: officer id whose card-reveal flourish should play
   *  (a gold-or-better name newly under the player's banner). Not saved. */
  cardReveal: EntityId | null;
  /** 開卡緣由 — 得將 / 六星覺醒 / 求賢祭現身; styles the flourish. */
  cardRevealKind: 'recruit' | 'awaken' | 'festival';
  /** 武評前席 — last season's top-50 BP board (id → rank), for the ↑↓ arrows
   *  and NEW badges on the 武評 tab. */
  powerBoardPrev: Record<EntityId, number>;
  /** 求賢祭 — the season key of the last festival held (one per season). */
  festivalSeason: string | null;
  /** 求賢祭保底 — consecutive reveals below gold; ≥3 forces a gold+ draw. */
  festivalPity: number;
  /** 名將殘卷 — collection currency dropped by 求賢祭 reveals (more for gold-tier
   *  names, and a 故人 bonus when the revealed name is already in the codex).
   *  Spent to 煉星 (buy a star without gold, still level-gated). See stars.ts. */
  generalScrolls: number;
  /** 天下懸賞榜 — active wanted notices (bounty.ts), re-rolled each spring. */
  bounties: import('../systems/bounty').Bounty[];
  /** 銘刻 — player-given names/mottoes engraved on storied items (lore ≥60). */
  itemInscriptions: Record<EntityId, { name?: string; motto?: string }>;
  /** 史官年鑑 — the page awaiting the player's eyes (composed each spring). */
  pendingChronicle: import('../systems/chronicle').YearChronicle | null;
  /** 年鑑基線 — last spring's per-force city counts (rise/fall deltas). */
  yearbookCounts: Record<EntityId, number>;
  /** 成套之禮 — famous sets already celebrated this campaign (setBonds.ts);
   *  each set pays out once when it first stands complete under the player. */
  setRewardsClaimed: string[];
  /** 日流 — turn playback: after 進行, the half-month plays out day by day
   *  (armies step cell-to-cell); pausable/speedable. Transient, not saved. */
  dayFlow: {
    key: number; day: number; total: number; playing: boolean; speed: number;
    /** 真日級遭遇 — player-involved first contacts predicted for this
     *  half-month (same geometry the resolution uses). `fired` = the flow
     *  reached that day: banner up, pair engaged — no rerouting out. */
    encounters?: Array<{
      aId: string; bId: string; day: number; x: number; y: number;
      aZh: string; aEn: string; bZh: string; bEn: string; fired?: boolean;
      /** 已於日播中親征此遭遇(結算不再重打這一對)。 */
      fought?: boolean;
    }>;
    /** 兵臨之日 — arrivals landing this half-month (own assaults/garrisons
     *  and hostile columns reaching YOUR city); playback pauses on the day. */
    arrivals?: Array<{
      id: string; day: number; x: number; y: number;
      kind: 'assault' | 'garrison' | 'incoming';
      zh: string; en: string; fired?: boolean;
    }>;
  } | null;
  /** 跟拍 — during the day flow the camera glides after your lead column. */
  dayFlowFollow: boolean;
  /** 真日級親征 — pairs already fought mid-flow this turn; the commit's
   *  interception pass skips them. Transient. */
  foughtPairs: Array<[string, string]> | null;
  /** 塗色 (RTK-XIV) — lattice cells walked by marching columns (deviation
   *  dictionary "col,row" → {force, seasonStamp}); TTL-pruned each season. */
  hexPaint: import('../systems/hexPaint').HexPaint;
  /** 戰場烙印 — world hexes scarred by battles (燒林→焦土、焚橋→斷渡),
   *  keyed "col,row"; new battles over the same ground inherit the scar,
   *  and the land heals after a TTL (see systems/worldScars.ts). */
  worldScars: import('../systems/worldScars').WorldScars;
  /** 入城三選 — pending post-conquest policy choice for a city the player
   *  just stormed interactively (安民/犒軍/搜捕). Transient (not saved). */
  pendingConquestPolicy: { cityId: EntityId; attackerLosses: number; formerOwnerForceId: EntityId | null } | null;
  /** 斥候偵騎 — enemy ambush armies your scouts have flushed out (army ids):
   *  they render on your map (⚠伏), appear in march forecasts, and their
   *  spring bonus is blunted on contact. Pruned each season commit. */
  spottedAmbushIds: EntityId[];
  /** 街頭際遇 — per-city season stamp of the last street encounter consumed
   *  (行商/遊俠/相士/說書人). One encounter per city per season at most. */
  streetEncounters: Record<EntityId, number>;
  /** 軍師點撥 — one-shot contextual mechanic hints already shown (keyed by
   *  hint id), so each new-system tip fires exactly once per campaign. */
  mechanicHints: Record<string, true>;
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
  /** §7.8-deep E 門第聯姻 — great clans the realm has bound by marriage
   *  (clanId → forceId). A bound clan holds a loyalty floor and its strongmen
   *  are far less apt to grow over-mighty (聯姻之家不易簒). */
  clanBonds: Record<string, EntityId>;
  /** §7.8-deep G 部曲莊園 — private retainer troops a content clan currently
   *  fields at its anchor city (clanId → {cityId, troops}). A disaffected clan
   *  withdraws them; an over-mighty one can march them. */
  clanLevies: Record<string, { cityId: EntityId; troops: number }>;
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
  /** 兵器覺醒 — per-item chosen awakening perks (items.ts AWAKENING_PERKS),
   *  unlocked one pick per 威名 milestone (12/30/60). */
  itemAwakenings: Record<EntityId, string[]>;
  /** 回爐 — items smelted back to iron this campaign; gone from circulation. */
  destroyedItems: EntityId[];
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
  /** 恩怨簿 — head-to-head single-combat history per pair (forges 宿敵 in play). */
  rivalries: import('../systems/rivalries').RivalryMap;
  /** 天下武道會 — the year the realm's tournament last crowned a champion; the
   *  steep 武評榜 climb is a once-a-year prize (not farmable). 0 = never held. */
  lastTournamentYear: number;
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
  /** §7.7 ① 邦交競逐·封號獨占 — who currently holds each titled realm's 封號
   *  (realmId → forceId). The latest force to send a successful embassy holds
   *  it; the patron draws standing 天命 and is the only one a realm will lend
   *  troops to (借兵). A rival who out-courts you takes the title away. */
  realmPatron: Record<string, EntityId>;
  /** §7.7 ③ 西域都護府 — the player city designated Protectorate of the Western
   *  Regions (null = none). While it stands and is held, every 西域 caravan pays
   *  half again as much and those routes are far harder to cut. */
  protectorateCityId: EntityId | null;
  /** §7.7 ③ 絲路風險 — opened caravans cut by tribe raids or a lost frontier
   *  city (realmId → seasons the route stays severed; absent/0 = flowing). No
   *  trade income or tribute crosses a severed route until it heals. */
  realmRouteDisruption: Record<string, number>;
  /** §7.7 ④ 常駐使節 — officers stationed long-term at an opened realm
   *  (realmId → posting). A resident envoy is off the home rosters, but holds
   *  the realm's goodwill, eases its caravan, and sends intel home each season. */
  residentEnvoys: Record<string, { officerId: EntityId; realmId: string; sinceYear: number; sinceSeason: GameDate['season'] }>;
  /** §7.7-deep ①(A)異域援軍 — last time each realm answered a call for its
   *  義従遠征軍 (realmId → when), so the favour can't be summoned every season. */
  realmAidCooldown: Record<string, { year: number; season: GameDate['season'] }>;
  /** §7.7-deep ②(B)遠邦之怒 — how aggrieved each realm is with the player
   *  (realmId → 0–100). Built by losing a 封號 to a rival, letting standing rot,
   *  or leaving a caravan severed; bled down by courting. High enmity → 邊釁
   *  (frontier raids) and 禁運 (embargo). */
  realmHostility: Record<string, number>;
  /** §7.7-deep ③(C)絹馬互市 — what each opened caravan trades home: 'gold'
   *  (default commerce) or 'horses' (買馬 — horse realms stable warhorses at the
   *  frontier city, raising its cavalry ceiling, in place of coin). */
  realmTradeMode: Record<string, 'gold' | 'horses'>;
  /** 常運糧道 — standing supply routes: each season any surplus grain at the
   *  source auto-ships to the destination. */
  standingRoutes: Array<{ fromCityId: EntityId; toCityId: EntityId }>;
  /** 細作開眼 — cities lit by successful espionage, ticks of intel left.
   *  Decremented each half-month; consumed by the fog-of-war view. */
  espionageReveals: Record<EntityId, number>;
  /** 委任太守 — cityId → governor officerId. A delegated city auto-issues
   *  its governor's internal command at the start of every tick. */
  cityDelegations: Record<EntityId, EntityId>;
  /** 施政重點 — cityId → the focus the player set its governor (default balanced). */
  governorStances: Record<EntityId, import('../systems/governor').GovernorStance>;
  /** 太守任期 — cityId → year the seat was delegated, for 久任尾大不掉 effects. */
  governorSince: Record<EntityId, number>;
  /** 考課・連續考績 — prefect officerId → signed streak (+N consecutive 上考,
   *  −N consecutive 下考). Drives 殿最閉環 (grooming / 罷免) in governorEval. */
  governorEvalStreaks: Record<EntityId, number>;
  /** 考課・去年考績 — prefect officerId → last annual review, for the 考課 panel
   *  + 主公親裁 (恩威黜陟). */
  governorReviewLast: Record<EntityId, { score: number; grade: import('../systems/governorEval').KaoKeGrade; year: number }>;
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
  recruitState: Record<EntityId, { season: string; stage: 'declined' | 'locked'; attempts?: number }>;
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
    /** 師老兵疲 — the besieging column arrives worn (opens at lower morale). */
    fatigue?: number;
  }>;
  /** 行軍預覽 — transient route highlight while the march picker is open. */
  marchPreview: { fromId: EntityId; toId: EntityId } | null;
  /** 本局戰史 — the campaign chronicle: conquests, siege works, famous
   *  events, rebellions. Shown as the epic recap on victory/defeat. */
  chronicle: Array<{ year: number; season: string; zh: string; en: string; kind: 'conquest' | 'works' | 'event' | 'rebellion' | 'defense' }>;
  /** Heaven's Mandate per force (0-100). */
  mandate: MandateState;
  /** §7.4-deep N 外戚干政 — the officer whose kin the realm has raised as
   *  consort-kin (forceId → anchor officerId). They lend the court a boon and
   *  counterweight, but an over-mighty 大將軍 strains the throne. */
  consortKin: Record<EntityId, EntityId>;
  /** §7.4-deep O 學官專權 — the inner court's grip in the realm that holds the
   *  天子 (forceId → 0–100). High power sells offices but drives off 清流. */
  eunuchPower: Record<EntityId, number>;
  /** §7.4-deep M 太后臨朝·幼主輔政 — active regencies for realms whose ruler is a
   *  minor (forceId → the 輔政 regent). */
  regencies: Record<EntityId, { regentId: EntityId; sinceYear: number }>;
  /** §7.4-deep P 改元 — the year each realm last declared a new era (cooldown). */
  eraChangedYear: Record<EntityId, number>;
  /** §7.5-deep Q/T 禪代之階 — an over-mighty minister climbing toward the throne
   *  in a realm (forceId → the climb). The player is not immune: an unchecked
   *  權臣 in your own court can reach 受禪 and take the realm. */
  usurpLadder: Record<EntityId, { officerId: EntityId; stage: number; sinceYear: number; cabal: EntityId[] }>;
  /** §7.5-deep S 流亡君主 — lords deposed by usurpation/conquest who wander as
   *  guest-generals with a lingering claim (ex-ruler officerId → the exile). */
  exiledLords: Record<EntityId, { formerForceId: EntityId; formerNameZh: string; formerNameEn: string; sinceYear: number }>;
  /** §7.10 客將寄寓 — deposed lords the player has sheltered, now serving as guest
   *  generals (officerId → posting). A guest keeps his own faith and a claim to
   *  his lost realm: treat him ill and he leaves; sponsor his return (借兵復國)
   *  and he becomes a grateful vassal; neglect a strong, ambitious one and he may
   *  turn on his host (鳩占鵲巢). */
  guestGenerals: Record<EntityId, { hostForceId: EntityId; formerForceId: EntityId; formerNameZh: string; formerNameEn: string; sinceYear: number }>;
  /** §7.5-deep R 清君側 — realms that invite a righteous war this season (a
   *  usurper / tyrant / runaway inner court), with the cause (forceId → reason).
   *  Recomputed each season; drives the 討逆 casus belli. */
  righteousTargets: Record<EntityId, { reasonZh: string; reasonEn: string }>;
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
    tributePacts: [],
    defensivePacts: [],
    courtEnvoys: {},
  warCoalitions: [],
  vassalDiscontent: {},
  pendingCallsToArms: [],
  pendingDemands: [],
  passageGrants: [],
  pendingPeaceOffers: [],
  rapport: {},
  lordRapport: {},
  battleHistory: [],
  appointments: [],
  appointmentHistory: [],
  casusBelliMarks: [],
  deterrences: [],
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
  spyNetwork: {},
  rumorCities: {},
  spyBureauCityId: null,
  edictHistory: [],
  edictCooldowns: {},
  tribeState: createInitialTribeState(),
  tribeDiplomacy: emptyTribeDiplomacy(),
  lastSuburbanRiteYear: null,
  rainRiteDone: false,
  pendingRelief: [],
  plagueRiskCityIds: [],
  pacifyMissions: {},
  annals: [],
  customEvents: [],
  soundEnabled: true,
  buildings: [],
  tradeRoutes: [],
  provinceGovernors: {},
  provinceWarlordism: {},
  provinceGovernorSince: {},
  fleets: [],
  shipOrders: [],
  ports: {},
  forts: {},
  sites: {},
  scenicLooted: {},
  scenicVisits: {},
  musters: {},
  cardReveal: null,
  cardRevealKind: 'recruit',
  powerBoardPrev: {},
  festivalSeason: null,
  festivalPity: 0,
  generalScrolls: 0,
  bounties: [],
  itemInscriptions: {},
  pendingChronicle: null,
  yearbookCounts: {},
  setRewardsClaimed: [],
  dayFlow: null,
  dayFlowFollow: false,
  foughtPairs: null,
  hexPaint: {},
  worldScars: {},
  pendingConquestPolicy: null,
  spottedAmbushIds: [],
  streetEncounters: {},
  mechanicHints: {},
  territoryOwnership: {},
  armies: {},
  family: [],
  pendingHeirs: [],
  clanStandings: {},
  clanBonds: {},
  clanLevies: {},
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
  itemAwakenings: {},
  destroyedItems: [],
  gemStock: {},
  knownRecipes: STARTER_RECIPE_IDS.slice(),
  itemHistory: [],
  battleReplays: [],
  duelHall: [],
  warRatings: {},
  rivalries: {},
  lastTournamentYear: 0,
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
  realmPatron: {},
  protectorateCityId: null,
  realmRouteDisruption: {},
  residentEnvoys: {},
  realmAidCooldown: {},
  realmHostility: {},
  realmTradeMode: {},
  standingRoutes: [],
  espionageReveals: {},
  cityDelegations: {},
  governorStances: {},
  governorSince: {},
  governorEvalStreaks: {},
  governorReviewLast: {},
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
  consortKin: {},
  eunuchPower: {},
  regencies: {},
  eraChangedYear: {},
  usurpLadder: {},
  exiledLords: {},
  guestGenerals: {},
  righteousTargets: {},
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
    tributePacts: [],
    defensivePacts: [],
    courtEnvoys: {},
    warCoalitions: [],
    vassalDiscontent: {},
    pendingCallsToArms: [],
    pendingDemands: [],
    passageGrants: [],
    pendingPeaceOffers: [],
    rapport: {},
    lordRapport: {},
    battleHistory: [],
    appointments: [],
  appointmentHistory: [],
  casusBelliMarks: [],
  deterrences: [],
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
    spyNetwork: {},
    rumorCities: {},
    spyBureauCityId: null,
    espionageReveals: {},
    cityDelegations: {},
    governorStances: {},
    governorSince: {},
    governorEvalStreaks: {},
    governorReviewLast: {},
    legions: [],
    emperorCityId: 'luoyang',
    dailyChallengeDate: null,
    powerHistory: [],
    recruitState: {},
    edictHistory: [],
    edictCooldowns: {},
    tribeState: createInitialTribeState(),
    tribeDiplomacy: emptyTribeDiplomacy(),
    lastSuburbanRiteYear: null,
    rainRiteDone: false,
    pendingRelief: [],
    plagueRiskCityIds: [],
    pacifyMissions: {},
    annals: [],
    soundEnabled: state.soundEnabled,
    buildings: [],
    tradeRoutes: [],
    provinceGovernors: {},
    provinceWarlordism: {},
    provinceGovernorSince: {},
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
    cardReveal: null,
    cardRevealKind: 'recruit',
    powerBoardPrev: {},
    festivalSeason: null,
    festivalPity: 0,
    generalScrolls: 0,
    bounties: [],
    itemInscriptions: {},
    pendingChronicle: null,
    yearbookCounts: {},
    setRewardsClaimed: [],
    dayFlow: null,
  dayFlowFollow: false,
  foughtPairs: null,
  hexPaint: {},
  worldScars: {},
  pendingConquestPolicy: null,
  spottedAmbushIds: [],
  streetEncounters: {},
  mechanicHints: {},
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
    clanBonds: {},
    clanLevies: {},
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
  itemAwakenings: {},
  destroyedItems: [],
  gemStock: {},
    knownRecipes: STARTER_RECIPE_IDS.slice(),
    itemHistory: [],
    battleReplays: [],
    duelHall: [],
    warRatings: {},
    rivalries: {},
  lastTournamentYear: 0,
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
    realmPatron: state.realmPatron ?? {},
    protectorateCityId: state.protectorateCityId ?? null,
    realmRouteDisruption: state.realmRouteDisruption ?? {},
    residentEnvoys: state.residentEnvoys ?? {},
    realmAidCooldown: state.realmAidCooldown ?? {},
    realmHostility: state.realmHostility ?? {},
    realmTradeMode: state.realmTradeMode ?? {},
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
    consortKin: {},
    eunuchPower: {},
    regencies: {},
    eraChangedYear: {},
    usurpLadder: {},
    exiledLords: {},
    guestGenerals: {},
    righteousTargets: {},
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
