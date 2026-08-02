import type {
  City,
  EntityId,
  Officer,
  ObjectiveGoal,
  ScenarioGoal,
  ScenarioObjective,
} from '../types';
import { PROVINCE_BY_CITY } from '../data/provinces';
import { SCENARIOS } from '../data/scenarios';

/**
 * 開局時這座城歸誰 —— 用來分辨「守成」與「取得」兩種 hold-cities 目標。
 *
 * 一次算好一張表,86 個盤 × 各自的城,只在第一次問的時候建。
 */
const initialOwnerCache = new Map<string, Map<string, string | null>>();
function initialOwnerOf(scenarioId: string | null, cityId: string): string | null {
  if (!scenarioId) return null;
  let m = initialOwnerCache.get(scenarioId);
  if (!m) {
    const sc = SCENARIOS.find((x) => x.id === scenarioId);
    m = new Map((sc?.cities ?? []).map((c) => [c.id, c.ownerForceId ?? null]));
    initialOwnerCache.set(scenarioId, m);
  }
  return m.get(cityId) ?? null;
}

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
      /*
       * 「據有 X,至 N 年」有兩種讀法,而**開局有沒有那座城**決定是哪一種:
       *
       *  - 開局就據有 → **守成**。要撐到期限那一年才算數。原本 allHeld 就
       *    直接判成功,於是守成型目標第 0 回合即完成 —— 盤面體檢一跑,86 盤
       *    裡有 90 條主目標開局就是綠的:鄭「守洛待援」開局據洛陽、趙「鉅鹿
       *    之圍」開局據鉅鹿、三秦「三秦拒漢」開局據三秦……玩家什麼都還沒做。
       *  - 開局不據有 → **取得**。拿到就贏,不必空等到期限
       *    (英雄挑戰「於 217 年前取成都與漢中」正是這一種)。
       *
       * 兩種都對,所以不加旗標讓資料自己說 —— 資料已經說了,說在盤面上。
       * 沒有 scenarioId 的呼叫端(挑戰系統的單元測試、自由模式)取不到開局
       * 盤面,一律當「取得」,與改動前的行為相同。
       */
      const progress = `${owned.length}/${goal.cityIds.length}`;
      const defending =
        goal.byYear !== undefined
        && ctx.playerForceId != null
        && goal.cityIds.every((id) => initialOwnerOf(ctx.scenarioId, id) === ctx.playerForceId);
      if (!defending) {
        return allHeld ? { status: 'success', progress } : { status: 'pending', progress };
      }
      if (ctx.year >= goal.byYear!) {
        return allHeld ? { status: 'success', progress } : { status: 'failure', progress };
      }
      return { status: 'pending', progress };
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
      const progress = `${owned.length}/${cityIds.length}`;
      // 與 hold-cities 同理:開局就全據該州的是守成目標,要撐到期限才算數。
      const defending =
        goal.byYear !== undefined
        && ctx.playerForceId != null
        && cityIds.every((id) => initialOwnerOf(ctx.scenarioId, id) === ctx.playerForceId);
      if (!defending) {
        return allHeld ? { status: 'success', progress } : { status: 'pending', progress };
      }
      return ctx.year >= goal.byYear!
        ? { status: allHeld ? 'success' : 'failure', progress }
        : { status: 'pending', progress };
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
