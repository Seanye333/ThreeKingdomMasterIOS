import { describe, it, expect } from 'vitest';
import { evaluateGoal } from './objectives';
import type { ObjectiveGoal } from '../types/objectives';

/**
 * `protect-force` —— 「救援」這件事此前沒有形狀可以裝。
 *
 * 竊符救趙、毛遂自薦、春申君北救、吳救壽春,都被寫成了「取下你要救的那一家的城」,
 * 而那幾對還是 allied —— 從第 0 旬就自相矛盾(見 objectiveDiplomacy.test.ts)。
 */
const cities = (owners: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(owners).map(([id, ownerForceId]) => [id, { id, ownerForceId }]),
  );

const ctx = (o: { year: number; owners: Record<string, string> }) => ({
  scenarioId: 'scn-test',
  playerForceId: 'wei',
  cities: cities(o.owners),
  officers: {},
  year: o.year,
  liveForceIds: new Set(Object.values(o.owners)),
  isEmperor: false,
});

const goal: ObjectiveGoal = { kind: 'protect-force', forceId: 'zhao', minCities: 2, byYear: 184 };

describe('protect-force(保住某一家)', () => {
  it('期限之前一律進行中 —— 中途被打殘又收復,仍算救成了', () => {
    const alive = { a: 'zhao', b: 'zhao', c: 'wei' };
    expect(evaluateGoal(goal, ctx({ year: 180, owners: alive }) as never).status).toBe('pending');
    // 只剩一座,還沒到期 —— 仍是進行中,不是失敗。
    expect(evaluateGoal(goal, ctx({ year: 182, owners: { a: 'zhao', b: 'wei', c: 'wei' } }) as never).status)
      .toBe('pending');
  });

  it('到期那一年結算:城數夠就成', () => {
    const r = evaluateGoal(goal, ctx({ year: 184, owners: { a: 'zhao', b: 'zhao', c: 'wei' } }) as never);
    expect(r.status).toBe('success');
    expect(r.progress).toBe('2→≥2');
  });

  it('到期那一年城數不夠就敗 —— 反向驗過:把 minCities 拿掉(視為 1)這一條會轉成功', () => {
    const owners = { a: 'zhao', b: 'wei', c: 'wei' };
    expect(evaluateGoal(goal, ctx({ year: 184, owners }) as never).status).toBe('failure');
    const lenient: ObjectiveGoal = { kind: 'protect-force', forceId: 'zhao', byYear: 184 };
    expect(evaluateGoal(lenient, ctx({ year: 184, owners }) as never).status).toBe('success');
  });

  it('那一家整個沒了就是敗,期限之後也不會翻回來', () => {
    const gone = { a: 'wei', b: 'wei', c: 'wei' };
    expect(evaluateGoal(goal, ctx({ year: 184, owners: gone }) as never).status).toBe('failure');
    expect(evaluateGoal(goal, ctx({ year: 190, owners: gone }) as never).status).toBe('failure');
  });
});
