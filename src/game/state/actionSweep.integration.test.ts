/**
 * 無參 action 全掃 —— store 有 **390 個 action,而覆蓋率只有 21% 的函式**
 * (實測:`vitest --coverage --coverage.include=src/game/state/store.ts`,
 * 26.17% 行 / 20.96% 函式)。也就是說,大約三百個 action 從來沒有被任何測試
 * 呼叫過一次。
 *
 * ## 為什麼只掃無參的那 57 個
 *
 * 其餘 333 個要參數,而**猜參數的測試是會騙自己的**:傳錯型別讓 action 拋
 * TypeError,測試於是「抓到一個錯」—— 那不是遊戲的 bug,是測試自己造的。
 * 把門檻定在「猜對參數」上,結果就是一堆假紅或(更糟)一堆 try/catch 吞掉
 * 全部例外的空轉斷言。
 *
 * 無參的那一批沒有這個問題:**無參呼叫就是它們被設計的用法**(UI 上的按鈕
 * 就是這樣按的)。所以這裡的判準可以是硬的:
 *
 *  1. 不准拋 —— 在任何時機按下去都不該炸,包括「現在沒有圍城可打」這種
 *     前置條件不成立的時候(那應該是 no-op,不是例外)。
 *  2. 呼叫之後世界仍然自洽 —— 沿用 `assertInvariants` 那套規則,
 *     它專門抓「動作改了一半就跑掉、留下屍體佔著職位」這類殘留。
 *
 * ## 這不是完整的覆蓋
 *
 * 掃完只覆蓋 57/390。有參數的那 333 個仍然是空白 —— 這件事寫在這裡,
 * 是為了不讓這支測試的存在被誤讀成「store 測過了」。
 */
import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  const g = globalThis as unknown as { localStorage?: unknown };
  if (!g.localStorage) {
    const mem = new Map<string, string>();
    g.localStorage = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() { return mem.size; },
    };
  }
});

import { useGameStore } from './store';
import { SCENARIOS } from '../data/scenarios';
import { assertInvariants, resetTroopTracking } from '../../test/worldInvariants';

/**
 * 不掃這幾個,各有各的理由 —— **不是因為它們會紅**。
 *
 * `reset` 會把整個 store 清空,而空世界照樣滿足所有不變量:掃到它之後
 * 剩下的每一個 action 都在空盤上跑,測試看起來全過,其實什麼都沒測。
 * 這正是「測試自己騙自己」最常見的那個形狀,所以它必須被排除而不是被容忍。
 */
const SKIP = new Set<string>(['reset']);

/**
 * 至少要真的按下去這麼多個 —— 防的是掃描自己失效(改名、重構、
 * `fn.length` 因為預設參數而歸零)之後,測試安靜地縮成一句 `expect(true)`。
 */
const FLOOR = 40;

describe('無參 action 全掃 —— 按下去不該炸,按完世界仍要自洽', () => {
  it('每一個無參 action 都能在活的戰役上被呼叫,而不破壞任何不變量', () => {
    resetTroopTracking();
    const st = useGameStore;
    st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');

    // 先走幾旬,好讓報告/事件/戰鬥劇場這些「有東西可關掉」的狀態真的存在 ——
    // 開局第一旬所有 dismiss* 都無事可做,掃了等於沒掃。
    for (let t = 0; t < 3; t++) st.getState().endSeason();

    const names = Object.entries(st.getState())
      .filter(([k, v]) => typeof v === 'function' && (v as (...a: unknown[]) => unknown).length === 0 && !SKIP.has(k))
      .map(([k]) => k)
      .sort(); // 固定順序,免得同一份程式碼兩次跑出不同結果

    const threw: Array<{ name: string; err: string }> = [];
    let called = 0;
    for (const name of names) {
      const fn = (st.getState() as unknown as Record<string, () => unknown>)[name];
      if (typeof fn !== 'function') continue;
      try {
        fn();
        called++;
      } catch (e) {
        threw.push({ name, err: e instanceof Error ? e.message : String(e) });
        continue;
      }
      // 每一個都當場驗,好讓失敗訊息指得出是哪一個 action 留下的殘局。
      assertInvariants(0);
    }

    expect(
      threw.map((t) => `${t.name}: ${t.err}`).join('\n'),
      '無參 action 被無參呼叫時拋例外 —— 前置條件不成立應該 no-op,不是炸',
    ).toBe('');
    expect(called, `只按到 ${called} 個 action,掃描大概自己失效了`).toBeGreaterThanOrEqual(FLOOR);
  });
});
