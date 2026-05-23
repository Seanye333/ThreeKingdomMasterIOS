import type { EntityId } from './common';

export type InternalAffairsType =
  | 'develop-agriculture'
  | 'develop-commerce'
  | 'build-defense'
  | 'recruit-troops'
  | 'improve-loyalty'
  | 'search';

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
}

export interface HistoricBattle extends BattleDetail {
  id: string;
  date: { year: number; season: string };
}

export interface ReportEntry {
  cityId: EntityId | null;
  kind: ReportEntryKind;
  text: string;
  battle?: BattleDetail;
}

export interface SeasonReport {
  date: { year: number; season: string };
  entries: ReportEntry[];
}
