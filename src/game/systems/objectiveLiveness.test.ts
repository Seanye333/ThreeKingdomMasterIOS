import { describe, it, expect } from 'vitest';
import { evaluateGoal } from './objectives';
import type { ObjectiveGoal } from '../types/objectives';

/**
 * **一座城都不剩的人,什麼目標都不算達成。**
 *
 * 這條規則原本只寫在 `evaluateChallenge`(挑戰系統)裡,而劇本目標走的是
 * `evaluateGoal` 這一條路 —— 於是 `survive-until` 只看年份:「存續至 220 年」
 * 在勢力早已被抹掉之後,到了 220 年照樣判成功。掃描裡「曹操贏赤壁」的吳殘部
 * 3/3、「若袁紹勝官渡」的曹操殘部 3/3,有一部分就是這麼來的 ——
 * 那兩條主目標寫的正是「存續」。
 *
 * `defeat-force` / `break-force` / `protect-force` 是同一個形狀:那三型問的都是
 * **別人**的城數。「我救了趙國」不能由一個已經亡了的國家來說。
 */
const ctx = (o: { live: string[]; year: number }) => ({
  scenarioId: 'scn-test',
  playerForceId: 'wei',
  cities: {
    a: { id: 'a', ownerForceId: 'zhao' },
    b: { id: 'b', ownerForceId: 'zhao' },
  },
  officers: {},
  year: o.year,
  liveForceIds: new Set(o.live),
  isEmperor: true,
});

describe('目標判定:勢力已亡', () => {
  const survive: ObjectiveGoal = { kind: 'survive-until', year: 220 };

  it('存續型:活著到那一年才算,亡了就是敗', () => {
    expect(evaluateGoal(survive, ctx({ live: ['wei', 'zhao'], year: 220 }) as never).status)
      .toBe('success');
    expect(evaluateGoal(survive, ctx({ live: ['wei', 'zhao'], year: 219 }) as never).status)
      .toBe('pending');
    // 同一年、同一份盤面,差別只在自己還在不在。
    expect(evaluateGoal(survive, ctx({ live: ['zhao'], year: 220 }) as never).status)
      .toBe('failure');
  });

  it('救援型:自己亡了就不能說救成了 —— 即使被救的那一家好好的', () => {
    const protect: ObjectiveGoal = { kind: 'protect-force', forceId: 'zhao', minCities: 2, byYear: 200 };
    expect(evaluateGoal(protect, ctx({ live: ['wei', 'zhao'], year: 200 }) as never).status)
      .toBe('success');
    expect(evaluateGoal(protect, ctx({ live: ['zhao'], year: 200 }) as never).status)
      .toBe('failure');
  });

  it('稱帝型同理 —— 沒有城的皇帝不是皇帝', () => {
    const emperor: ObjectiveGoal = { kind: 'declare-emperor' };
    expect(evaluateGoal(emperor, ctx({ live: ['wei'], year: 200 }) as never).status).toBe('success');
    expect(evaluateGoal(emperor, ctx({ live: ['zhao'], year: 200 }) as never).status).toBe('failure');
  });
});
