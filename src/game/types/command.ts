import type { EntityId } from './common';

export type InternalAffairsType =
  | 'develop-agriculture'
  | 'develop-commerce'
  | 'build-defense'
  | 'recruit-troops'
  | 'improve-loyalty'
  | 'search'
  // ── Tier-2 mass development (requires city tier ≥ 城) ──
  | 'major-agriculture'   // 大農政 — heavy ag investment
  | 'major-commerce'      // 大商政 — heavy commerce
  | 'major-defense'       // 大築城 — heavy fortification
  // ── Specialist actions ──
  | 'encourage-migration' // 招撫流民 — boost population
  | 'upgrade-wall'        // 城壁強化 — upgrade wallTier 1→2→3
  | 'garrison';           // 鎮守 — reclaim surrounding territory + boost defense

export type CommandType = InternalAffairsType | 'march';

interface CommandBase {
  cityId: EntityId;
  officerId: EntityId;
}

export interface InternalAffairsCommand extends CommandBase {
  type: InternalAffairsType;
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
  /** Holding position: the army stops advancing at its current cell and
   *  garrisons it (still fights enemies that reach it). Cleared on
   *  redirect. */
  holding?: boolean;
  /** Free-cell destination (pixel coords). When set the army marches to
   *  this open cell instead of `targetCityId` and garrisons it on arrival
   *  rather than assaulting a city. */
  targetX?: number;
  targetY?: number;
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
  | 'plague'
  | 'talent'
  | 'espionage'
  | 'tribe-raid'
  | 'edict'
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
  stratagem?: { id: string; nameZh: string; nameEn: string; succeeded: boolean };
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
