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

/*
 * 一座**城**(人口 8.5 萬 → statCap 100 / econCap 190),而三項都在上限之上。
 *
 * ⚠ 人口必須夠大。「大」字指令有 `minSize: 'city'` 的門檻 —— 第一版我拿劍閣
 * (邑,兩萬五)當樣本,於是指令在算 gain 之前就被門檻擋掉,測試永遠是綠的:
 * 把修正拿掉也照樣過。**寫完要反向驗一次:拿掉修正,它必須紅。**
 *
 * 這樣的城在盤上到得了:洛陽民三十二萬(京)打到剩十九萬(都)時,
 * 它的農業還停在 288,而都的上限是 250。
 */
const overCapCity = (): City => ({
  id: 'c', name: { zh: '殘破的都', en: 'A Battered Capital' }, ownerForceId: 'f', adjacentCityIds: [],
  population: 85_000,          // 城:statCap 100 / econCap 190
  troops: 9000, food: 40_000, gold: 8000,
  loyalty: 70, defense: 130, agriculture: 250, commerce: 240, order: 70,
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
      /*
       * ⚠ 這裡本來寫 `if (r?.success && d < 0)` —— 而倒扣的那一路 `success`
       * 正好是 false(`success: gain > 0`),於是條件永遠不成立,測試怎麼改
       * 都是綠的。反向驗(拿掉修正)才看得出來:它一次也沒有紅過。
       *
       * delta 是**不論成敗都會套用**的(resolution 直接加 delta.defense),
       * 所以要驗的是 delta 本身。rng 取高值以避開 civicMishap ——
       * 失手扣分是設計,不在此列。
       */
      let worst = 0;
      for (let i = 0; i < 20; i++) {
        const r = resolveInternalAffairs(type as never, mkOfficer(), city, () => 0.9);
        const d = (r?.delta as Record<string, number> | undefined)?.[field] ?? 0;
        if (d < worst) worst = d;
      }
      expect(worst, `${type} 把 ${field} 倒扣了(開局 ${before})`).toBe(0);
    });

    it(`${type} 的預覽對超額的城顯示 0`, () => {
      const p = previewCommandGain(type, mkOfficer(), overCapCity());
      expect(p?.delta).toBe(0);
    });
  }
});
