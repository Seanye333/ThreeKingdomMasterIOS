import type {
  City,
  EntityId,
  Officer,
  ObjectiveGoal,
  ScenarioGoal,
  ScenarioObjective,
} from '../types';
import { PROVINCE_BY_CITY } from '../data/provinces';

export interface ObjectiveContext {
  scenarioId: EntityId | null;
  playerForceId: EntityId | null;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  year: number;
  /** Forces that still own at least one city. */
  liveForceIds: Set<EntityId>;
  /** True if the player has declared themselves emperor. */
  isEmperor: boolean;
}

/**
 * Evaluates a single goal against current state.
 * Returns 'success' if met, 'failure' if a deadline passed without meeting,
 * 'pending' if still possible.
 */
export function evaluateGoal(
  goal: ObjectiveGoal,
  ctx: ObjectiveContext,
): { status: 'success' | 'failure' | 'pending'; progress?: string } {
  switch (goal.kind) {
    case 'hold-cities': {
      const owned = goal.cityIds.filter(
        (id) => ctx.cities[id]?.ownerForceId === ctx.playerForceId,
      );
      const allHeld = owned.length === goal.cityIds.length;
      const expired = goal.byYear !== undefined && ctx.year > goal.byYear;
      if (allHeld) return { status: 'success', progress: `${owned.length}/${goal.cityIds.length}` };
      if (expired) return { status: 'failure', progress: `${owned.length}/${goal.cityIds.length}` };
      return { status: 'pending', progress: `${owned.length}/${goal.cityIds.length}` };
    }
    case 'defeat-force': {
      const dead = !ctx.liveForceIds.has(goal.forceId);
      const expired = goal.byYear !== undefined && ctx.year > goal.byYear;
      if (dead) return { status: 'success' };
      if (expired) return { status: 'failure' };
      return { status: 'pending' };
    }
    case 'recruit-officer': {
      const o = ctx.officers[goal.officerId];
      const recruited = !!o && o.forceId === ctx.playerForceId;
      const expired = goal.byYear !== undefined && ctx.year > goal.byYear;
      if (recruited) return { status: 'success' };
      if (expired || (o?.status === 'dead')) return { status: 'failure' };
      return { status: 'pending' };
    }
    case 'survive-until':
      return ctx.year >= goal.year ? { status: 'success' } : { status: 'pending' };
    case 'control-province': {
      const cityIds = Object.entries(PROVINCE_BY_CITY)
        .filter(([, pid]) => pid === goal.provinceId)
        .map(([cid]) => cid);
      if (cityIds.length === 0) return { status: 'pending' };
      const owned = cityIds.filter((id) => ctx.cities[id]?.ownerForceId === ctx.playerForceId);
      const allHeld = owned.length === cityIds.length;
      const expired = goal.byYear !== undefined && ctx.year > goal.byYear;
      if (allHeld) return { status: 'success', progress: `${owned.length}/${cityIds.length}` };
      if (expired) return { status: 'failure', progress: `${owned.length}/${cityIds.length}` };
      return { status: 'pending', progress: `${owned.length}/${cityIds.length}` };
    }
    case 'declare-emperor':
      return ctx.isEmperor ? { status: 'success' } : { status: 'pending' };
    case 'unify-realm': {
      const allCities = Object.values(ctx.cities);
      const ours = allCities.filter((c) => c.ownerForceId === ctx.playerForceId);
      const success = ours.length === allCities.length && allCities.length > 0;
      return success ? { status: 'success' } : { status: 'pending', progress: `${ours.length}/${allCities.length}` };
    }
  }
}

export function describeGoalText(goal: ScenarioGoal): string {
  return goal.description;
}

export function findObjectiveFor(
  scenarioId: EntityId | null,
  forceId: EntityId | null,
  objectives: Record<string, ScenarioObjective[]>,
): ScenarioObjective | null {
  if (!scenarioId || !forceId) return null;
  const list = objectives[scenarioId] ?? [];
  return list.find((o) => o.forceId === forceId) ?? null;
}
