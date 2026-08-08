import { describe, expect, it } from 'vitest';
import type { City, Officer } from '../types';
import { resolveInternalAffairs, previewCommandGain } from './commands';

/*
 * 內政指令**只往上長,不往下砍**。
 *
 * 三條「大」字指令(大築城/大農/大商)原本都寫成
 * `Math.min(cap - 現值, applyDevelopment(...) * 3)`。`applyDevelopment` 對超額
 * 的城已經回 0,於是 `Math.min(負, 0)` 取到**負數** —— 指令把自家的數值做低。
 *
 * 兩種到得了超額的路:
 *  - **城防**:開局就超額。`cityStatCap` 按人口分級(邑 60),而關本來就
 *    人少而城高(劍閣民二萬五、城防 95)。見 `passDefense.test.ts`。
 *  - **農商**:開局沒有超額的城,但**人口掉一級上限就跟著掉** ——
 *    189 盤的洛陽民三十二萬(京,上限 320)打到剩十九萬(都,上限 250),
 *    而它那時的農業是 288。
 *
 * 而**預覽字串一直是對的**(它有 `Math.max(0, …)`)—— 所以介面顯示 +0、
 * 實際扣分,兩邊對不上。這條測試同時釘住「不倒扣」與「預覽與實際一致」。
 */
const mkOfficer = (): Officer => ({
  id: 'o', name: { zh: 'o', en: 'o' }, forceId: 'f', birthYear: 180,
  stats: { leadership: 80, war: 60, intelligence: 80, politics: 90, charisma: 70 },
  loyalty: 90, status: 'idle', locationCityId: 'c', task: null,
  equipment: [] as unknown as Officer['equipment'], skills: [], rank: 'soldier',
} as Officer);

/** 一座邑(人口小 → 上限低),而三項數值都被推到上限之上。 */
const overCapCity = (): City => ({
  id: 'c', name: { zh: '劍閣', en: 'Jianmen' }, ownerForceId: 'f', adjacentCityIds: [],
  population: 25_000,          // 邑:statCap 60 / econCap 90
  troops: 5000, food: 20_000, gold: 5000,
  loyalty: 70, defense: 95, agriculture: 120, commerce: 110, order: 70,
} as unknown as City);

describe('內政指令不會把超過上限的數值做低', () => {
  for (const [type, field] of [
    ['major-defense', 'defense'],
    ['major-agriculture', 'agriculture'],
    ['major-commerce', 'commerce'],
  ] as const) {
    it(`${type} 對超額的城至多不動,絕不倒扣`, () => {
      const city = overCapCity();
      const before = city[field] as number;
      let sawNegative = false;
      for (let i = 0; i < 40; i++) {
        const r = resolveInternalAffairs(type as never, mkOfficer(), city, () => (i % 7) / 7);
        const d = (r?.delta as Record<string, number> | undefined)?.[field] ?? 0;
        // 失手(civicMishap)本來就會扣 —— 那是設計,不在此列;
        // 這裡釘的是**成功**的那一路不該倒扣。
        if (r?.success && d < 0) sawNegative = true;
      }
      expect(sawNegative, `${type} 成功時倒扣了 ${field}(開局 ${before})`).toBe(false);
    });

    it(`${type} 的預覽對超額的城顯示 0`, () => {
      const p = previewCommandGain(type, mkOfficer(), overCapCity());
      expect(p?.delta).toBe(0);
    });
  }
});
