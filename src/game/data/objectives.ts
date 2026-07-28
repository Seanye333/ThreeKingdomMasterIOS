import type { ScenarioObjective } from '../types';
import { OBJ_THREEKINGDOMS } from './objectives/threeKingdoms';
import { OBJ_WHATIF } from './objectives/whatif';
import { OBJ_WARRINGSTATES } from './objectives/warringStates';
import { OBJ_CHUHAN } from './objectives/chuHan';
import { OBJ_SUITANG } from './objectives/suiTang';

/**
 * Per-scenario, per-force objectives. The objectives system reads this map
 * by scenarioId.forceId to find the player's current goal.
 *
 * Each scenario can declare multiple force-specific objectives so a single
 * scenario plays differently as Cao vs Liu vs Sun.
 *
 * Split by BOARD (三國 / what-if / 春秋戰國 / 楚漢 / 隋唐) purely for file size;
 * this file stays the single entry point, so every importer is unchanged.
 *
 * ⚠ A scenario id appearing in two parts would be SILENTLY swallowed by the
 * spread, leaving one set of objectives unreachable — the same shape as the
 * 2026-07 items.ts duplicate-id bug. objectiveIds.test.ts keeps them disjoint.
 */
export const SCENARIO_OBJECTIVES: Record<string, ScenarioObjective[]> = {
  ...OBJ_THREEKINGDOMS,
  ...OBJ_WHATIF,
  ...OBJ_WARRINGSTATES,
  ...OBJ_CHUHAN,
  ...OBJ_SUITANG,
};
