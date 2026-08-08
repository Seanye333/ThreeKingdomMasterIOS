import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import { cityStatCap, citySize } from './citySize';
import { SCENARIOS } from '../data/scenarios';

/*
 * 關隘的開局城防**高過它的等級上限** —— 這是資料的事實,不是錯誤。
 *
 * `cityStatCap` 按人口分級(邑 60 / 鎮 80 / 城 100 / 都 130 / 京 160),
 * 而一座關本來就人少:劍閣民二萬五而城防 95、函谷關民一萬二而城防 88。
 * 全圖有十三座這樣的城,全部是關。那正是「關」的意思。
 *
 * 於是任何「加城防」的路徑都必須**只往上長、不往下砍**:
 * `Math.min(cap, current + gain)` 對一座 95 防的邑會算出 60,
 * 一鎮守就把自家的劍閣拆矮了。commands.ts 的大築城原本就有這個問題
 * (`Math.min(cap - defense, …)` 取到負數),而它同一行的**預覽字串**
 * 有 `Math.max(0, …)` —— 介面顯示 +0,實際扣分。
 *
 * 這條測試釘的是那個前提:**關的城防本來就超額**。
 * 只要它還成立,加城防的每一條路徑就都要防這一手。
 */
describe('關隘的城防高過等級上限', () => {
  it('全圖確實有一批開局就超額的城,而且都是關', () => {
    const sc = SCENARIOS.find((s) => s.id === 'scn-190-anti-dong-zhuo')!;
    const over = sc.cities.filter((c) => c.defense > cityStatCap(c as City));
    expect(over.length, '超額的城').toBeGreaterThanOrEqual(10);
    // 名字裡帶「關」,或是那幾座眾所周知的隘口。
    // 郿 是唯一一座不叫「關」的例外 —— 郿塢是董卓築的壘,高厚七丈,
    // 積穀三十年,那本來就不是一座普通的邑。
    const PASSES = new Set(['jieting', 'jianmen', 'baishuiguan', 'mei']);
    for (const c of over) {
      const isPass = c.name.zh.includes('關') || PASSES.has(c.id);
      expect(isPass, `${c.name.zh} 超額但不是關 —— 那才需要查`).toBe(true);
    }
  });

  it('劍閣是最極端的一格:邑的上限 60,而它的城防是 95', () => {
    const sc = SCENARIOS.find((s) => s.id === 'scn-190-anti-dong-zhuo')!;
    const jm = sc.cities.find((c) => c.id === 'jianmen')!;
    expect(citySize(jm as City).statCap).toBeLessThan(jm.defense);
  });
});
