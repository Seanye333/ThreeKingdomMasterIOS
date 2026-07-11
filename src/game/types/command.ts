import type { EntityId } from './common';

export type InternalAffairsType =
  | 'develop-agriculture'
  | 'develop-commerce'
  | 'build-defense'
  | 'recruit-troops'
  | 'improve-loyalty'
  | 'relief'              // 賑濟 — spend food (not gold) to raise loyalty
  | 'search'
  // ── Tier-2 mass development (requires city tier ≥ 城) ──
  | 'major-agriculture'   // 大農政 — heavy ag investment
  | 'major-commerce'      // 大商政 — heavy commerce
  | 'major-defense'       // 大築城 — heavy fortification
  // ── Specialist actions ──
  | 'encourage-migration' // 招撫流民 — boost population
  | 'upgrade-wall'        // 城壁強化 — upgrade wallTier 1→2→3
  | 'promote-learning'    // 興学 — XP burst to stationed officers (教化)
  | 'anti-corruption'     // 巡查肅貪 — claw back graft → city gold + loyalty
  | 'flood-control'       // 治水 — raise flood works (stacks with levee) + irrigation
  | 'military-farming'    // 屯田 — soldiers till state land: food without drawing population
  | 'drill-troops'        // 練兵 — drill the garrison: raise the city's 練度 (drill) → defense
  | 'garrison'            // 鎮守 — reclaim surrounding territory + boost defense
  | 'special-training';   // 特訓 — drill ONE officer hard: big XP + chance of skill/性格/潛能, martial tracks risk 養傷

export type CommandType = InternalAffairsType | 'march';

interface CommandBase {
  cityId: EntityId;
  officerId: EntityId;
}

export interface InternalAffairsCommand extends CommandBase {
  type: InternalAffairsType;
  /**
   * 協同施政 — up to 2 assistant officers who pour their season into the lead's
   * command instead of running their own. The gold cost is paid ONCE (by the
   * lead); each assistant adds a diminishing fraction of their effective stat
   * to the output (0.5×, 0.3×) and earns an internal-affairs XP trickle of
   * their own — a gold-efficient single push that also seasons junior officers.
   * Assistants are marked busy (task set) exactly like the lead.
   */
  assistantOfficerIds?: EntityId[];
}

export interface MarchCommand extends CommandBase {
  type: 'march';
  targetCityId: EntityId;
  troops: number;
  /** Additional officers accompanying the commander, max 2. */
  additionalOfficerIds?: EntityId[];
  /**
   * Multi-season march timing. `totalSeasons` is set at issue based on
   * straight-line distance; `seasonsRemaining` decrements each season-end
   * and only when it reaches 1 does the army arrive and fight. Old
   * (one-shot) marches resolve immediately when undefined.
   */
  seasonsRemaining?: number;
  totalSeasons?: number;
  /** 隨軍糧 — provisions the column carries. Drawn from the source city when the
   *  march first sets out (enough for its planned journey, if the city can
   *  spare it), spent each season on the road. When it runs dry the army bleeds
   *  deserters. `undefined` = not yet provisioned (provisioned on first step). */
  food?: number;
  /** Holding position: the army stops advancing at its current cell and
   *  garrisons it (still fights enemies that reach it). Cleared on
   *  redirect. */
  holding?: boolean;
  /** 設伏 — the holding army has gone to ground (only meaningful with
   *  `holding`): hidden from the enemy's map view, a stronger spring bonus
   *  when a column blunders in, and harder to scout out (識破減半). Needs
   *  cover at the cell (forest/hill/mountain); cleared on redirect. */
  ambush?: boolean;
  /** 長圍 — the holding army has invested a nearby enemy city (city id):
   *  the town's markets and fields are cut each turn (loyalty + food drain);
   *  when the granaries run dry it opens its gates without a fight. The
   *  garrison may sortie; relief columns lift the siege by driving the
   *  besieger off. Only meaningful with `holding`; cleared on redirect. */
  besieging?: import('./common').EntityId;
  /** Free-cell destination (pixel coords). When set the army marches to
   *  this open cell instead of `targetCityId` and garrisons it on arrival
   *  rather than assaulting a city. */
  targetX?: number;
  targetY?: number;
  /** 行軍節奏 — 急行軍 (faster, but 累毙 + 疲勞) / 常行 / 緩進 (slower, rested).
   *  Defaults to 'normal' when unset (old saves). */
  pace?: import('../systems/marchPace').MarchPace;
  /** 召回 — the column has abandoned its objective and is streaming home to its
   *  source city (targetCityId is then the source; it merges on arrival). */
  returning?: boolean;
  /** 潰走 — beaten in the field, the column flees toward targetCityId (its
   *  nearest friendly city) with no fight left in it. Its troops are CARRIED
   *  (already struck from the source city's books, unlike a normal march);
   *  hostile armies and garrisons that catch it cut it down (掩殺) rather
   *  than fight it. Cleared when it reaches shelter. */
  routed?: boolean;
  /** 潰走起點 — where the defeat happened; the flee route runs from here to
   *  the shelter city (only meaningful with `routed`). */
  fleeX?: number;
  fleeY?: number;
  /** 都督之旗 — extra opening morale a legion column carries from its marshal's
   *  renown (§4.3). Applied to the arrival battle. */
  legionBanner?: number;
  /** 軍師獻策 — a battle scheme the player picked for this assault (§5.3). Honoured
   *  by handleMarch only if its INT gate & conditions are met. */
  forcedStratagem?: string;
}

export type Command = InternalAffairsCommand | MarchCommand;

export type ReportEntryKind =
  | 'income'
  | 'upkeep'
  | 'desertion'
  | 'command-success'
  | 'command-failure'
  | 'march'
  | 'battle'
  | 'conquest'
  | 'defeat'
  | 'death'
  | 'succession'
  | 'dissolution'
  | 'rebellion'
  | 'harvest'
  | 'famine'
  | 'flood'
  | 'plague'
  | 'talent'
  | 'espionage'
  | 'expedition'
  | 'tribe-raid'
  | 'edict'
  | 'quake'
  | 'note';

export interface BattleSideDetail {
  forceId: EntityId | null;
  commanderId: EntityId;
  companionIds: EntityId[];
  troops: number;
  bondBonus: number;
  blendedStat: number; // 60% war + 40% leadership averaged across officers
  power: number; // blendedStat × √troops (defender × defenseFactor)
}

export interface BattlePhaseSummary {
  phase: 'formation' | 'skirmish' | 'mainEngagement' | 'pursuit';
  attackerMorale: number;
  defenderMorale: number;
  text: string;
}

export interface BattleDetail {
  cityId: EntityId;
  attacker: BattleSideDetail;
  defender: BattleSideDetail;
  cityDefense: number;
  defenseFactor: number; // 1 + cityDefense / 150
  attackerWins: boolean;
  cityFalls: boolean;
  attackerLosses: number;
  defenderLosses: number;
  duelWinnerId?: EntityId;
  duelLoserId?: EntityId;
  // ── Phase 68: Battle theater data ──
  phases?: BattlePhaseSummary[];
  stratagem?: { id: string; nameZh: string; nameEn: string; succeeded: boolean; seenThrough?: boolean };
  /** 連環計 — the attacker's chained second scheme. */
  stratagemChain?: { nameZh: string; nameEn: string; succeeded: boolean };
  /** 守城之計 — the defender's own counter-scheme. */
  defenderStratagem?: { nameZh: string; nameEn: string; succeeded: boolean; seenThrough?: boolean };
  attackerMoraleEnd?: number;
  defenderMoraleEnd?: number;
  woundedIds?: EntityId[];
  capturedIds?: EntityId[];
  pursued?: boolean;
  /** True for a mid-march interception (no city/walls); cityId is the
   *  victor's objective, used only as a location label. */
  field?: boolean;
  /** True when the victor was a dug-in army lying in wait — a sprung
   *  ambush (terrain-amplified field clash). */
  ambush?: boolean;
  /** True when the victor stormed a dug-in enemy camp (拔寨) — the loser was
   *  the holding side, overrun despite its earthworks. */
  campAssault?: boolean;
  /** True when the moving side's scouts saw through the ambush (识破伏兵),
   *  blunting the dug-in bonus. */
  detected?: boolean;
  /** True for a world-map pursuit strike on a routed column (掩殺潰兵) —
   *  the "defender" was a fleeing rout, not a fighting army. */
  routHunt?: boolean;
  /** True when the pursuit wiped the routed column out entirely (追亡逐北). */
  routDestroyed?: boolean;
}

export interface HistoricBattle extends BattleDetail {
  id: string;
  date: { year: number; season: string };
}

export interface ReportEntry {
  cityId: EntityId | null;
  kind: ReportEntryKind;
  text: string;
  /** Optional Chinese variant — preferred when language === 'zh'. */
  textZh?: string;
  battle?: BattleDetail;
  /** 晉牌 — set when this entry marks an officer crossing into a 金牌+ 品階 tier,
   *  so the loop can fire a 封賞 ceremony for the player's own officers. */
  promotion?: { officerId: EntityId; grade: import('../systems/officerGrade').OfficerGrade };
}

export interface SeasonReport {
  date: { year: number; season: string };
  entries: ReportEntry[];
  /**
   * Snapshot of the player's queued commands at the moment endSeason fired,
   * captured BEFORE resolution clears `pendingCommands`. Surfaced in the
   * season report so the player can see what their officers did this turn
   * without scanning the per-city income/upkeep noise.
   */
  executedCommands?: Command[];
}
