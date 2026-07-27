/**
 * 名品 id 必須唯一。
 *
 * `ITEMS_BY_ID` 是 Object.fromEntries(ITEMS.map(...)),後者覆蓋前者 —— 兩個
 * 不同道具共用一個 id 時,先定義的那個**在查表上直接消失**,但仍留在陣列裡:
 * 於是它照樣被撒到地圖上、照樣計入圖鑑,而任何人拿到它,吃到的是另一個道具的
 * 效果。這是靜默失效,沒有任何一處會報錯。
 *
 * 實際抓到三對(孫子兵法/戰國策/公羊傳):可裝備的兵書與後來新增的「研讀」消耗
 * 書撞名,結果鍾會開局所配的孫子兵法 +智9 +統5 變成 effects: {},而同一本書
 * 同時躺在兩座城的無主寶物堆裡。
 */
import { describe, expect, it } from 'vitest';
import { ITEMS, ITEMS_BY_ID } from './items';

describe('ITEMS — id 唯一性', () => {
  it('no two items share an id', () => {
    const seen = new Map<string, number>();
    for (const it of ITEMS) seen.set(it.id, (seen.get(it.id) ?? 0) + 1);
    const dups = [...seen.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id} ×${n}`);
    expect(dups, 'duplicate item ids silently shadow each other in ITEMS_BY_ID').toEqual([]);
  });

  it('every item is reachable through the lookup it was defined for', () => {
    // The array and the map must describe the same catalogue — a definition
    // that cannot be looked up by its own id is unreachable to every system
    // that resolves items by id (equipment, forging, sets, provenance).
    for (const it of ITEMS) {
      expect(ITEMS_BY_ID[it.id]?.name.zh, `${it.id} resolves to itself`).toBe(it.name.zh);
    }
  });
});
