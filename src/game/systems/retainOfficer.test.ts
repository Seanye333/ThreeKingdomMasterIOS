import { describe, it, expect } from 'vitest';
import { evaluateGoal } from './objectives';
import type { ObjectiveGoal } from '../types/objectives';

/**
 * `retain-officer`:**「別讓他走」是一種目標,而它原本沒有形狀。**
 *
 * 全庫十三條次要目標寫的是這件事(呂布的「公臺不去」、袁紹的「田豐之言」、
 * 朱儁的「織席販履之徒」……),而它們一律寫成 `recruit-officer` ——
 * 那型問「他歸你了沒」,人本來就在麾下,於是**第 0 旬就成功**,十三條全是白送的分。
 * 是把 `objectiveOwnership` 擴到次要目標之後才看見的:那支原本只掃 primary,
 * 而全庫 972 條目標裡有 432 條是次要的,從來沒被掃過。
 */
const ctx = (o: { forceId?: string; status?: string; year: number }) => ({
  scenarioId: 'scn-test',
  playerForceId: 'wei',
  cities: {},
  officers: o.forceId === undefined ? {}
    : { x: { id: 'x', forceId: o.forceId, status: o.status ?? 'active' } },
  year: o.year,
  liveForceIds: new Set(['wei']),
  isEmperor: false,
});

describe('目標判定:留住某個人', () => {
  const keep: ObjectiveGoal = { kind: 'retain-officer', officerId: 'x', byYear: 205 };

  it('人還在手上而未到期 → 進行中;到期仍在 → 成功', () => {
    expect(evaluateGoal(keep, ctx({ forceId: 'wei', year: 200 }) as never).status).toBe('pending');
    expect(evaluateGoal(keep, ctx({ forceId: 'wei', year: 205 }) as never).status).toBe('success');
  });

  it('死了或換了主,當場判敗 —— 不等到期限', () => {
    // 田豐之言的戲就在他會被殺:那一刻就是這條目標的結局。
    expect(evaluateGoal(keep, ctx({ forceId: 'wei', status: 'dead', year: 200 }) as never).status)
      .toBe('failure');
    expect(evaluateGoal(keep, ctx({ forceId: 'yuan', year: 200 }) as never).status).toBe('failure');
    // 人根本不在名單上也是失敗,不是「還沒到期」。
    expect(evaluateGoal(keep, ctx({ year: 200 }) as never).status).toBe('failure');
  });

  it('跟 recruit-officer 的差別:同一個盤面,一個第0旬就成功,一個還在跑', () => {
    const recruit: ObjectiveGoal = { kind: 'recruit-officer', officerId: 'x', byYear: 205 };
    const now = ctx({ forceId: 'wei', year: 190 }) as never;
    expect(evaluateGoal(recruit, now).status).toBe('success');   // ← 白送的那一分
    expect(evaluateGoal(keep, now).status).toBe('pending');
  });
});
