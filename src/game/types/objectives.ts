import type { BilingualName, EntityId } from './common';

/**
 * Per-scenario primary/secondary objectives. A scenario can declare a
 * narrative win condition more specific than "unify the realm" — and the
 * objective UI tracks progress live.
 */
export type ObjectiveGoal =
  | { kind: 'hold-cities';     cityIds: EntityId[]; byYear?: number }
  | { kind: 'defeat-force';    forceId: EntityId;   byYear?: number }
  | { kind: 'recruit-officer'; officerId: EntityId; byYear?: number }
  | { kind: 'survive-until';   year: number }
  | { kind: 'control-province'; provinceId: string; byYear?: number }
  | { kind: 'declare-emperor' }
  | { kind: 'unify-realm' };

export interface ScenarioObjective {
  id: EntityId;
  /** Which force this objective applies to. */
  forceId: EntityId;
  primary: ScenarioGoal;
  secondary?: ScenarioGoal[];
}

export interface ScenarioGoal {
  title: BilingualName;
  description: string;
  descriptionZh?: string;
  goal: ObjectiveGoal;
}
