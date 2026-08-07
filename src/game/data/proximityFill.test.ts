import { describe, expect, it } from 'vitest';
import { SCENARIOS } from './scenarios';
import { PROVINCE_BY_CITY } from './provinces';

/*
 * 鄰近補位的回歸釘 —— 2026-08-07 追「張魯守不住漢中」查出來的一類錯。
 *
 * `buildInitialCities` 對劇本沒明列的城,採「最近的已列城之主」補位(60px 內)。
 * 規則本身是對的 —— 後來加進地圖的關隘與衛星城才不會變成無主空洞 —— 但它會
 * **跨過山川與州界**:
 *
 *  - 207 盤張魯只明列漢中一座,補位就把**關中的陳倉、散關**給了他。一個四城
 *    小國因此直接與曹操本土接壤,實測第 1 旬丟陳倉、第 12 旬丟漢中,一年亡國。
 *  - 208/211 盤:益州北部的劍閣、白水關離武都(馬騰/韓遂)比離成都近,於是
 *    涼州軍閥憑空得了劉璋的門戶。
 *  - 213/215 盤:天水、上邽離漢中最近,張魯憑空得了隴右。
 *
 * ⚠ 修法是把這些城明列進歸屬表,而**補位是連鎖的** —— 明列葭萌之後,巴西的
 * 「最近已列城」從漢中變成葭萌,張魯的縱深又沒了。所以這裡把每一格都釘死:
 * 動了任何一張盤的歸屬表,這條會告訴你有沒有連帶把別的城推到別人手上。
 */

const OWNER_OF = (scenarioId: string, cityId: string): string | null => {
  const sc = SCENARIOS.find((s) => s.id === scenarioId);
  if (!sc) throw new Error(`no scenario ${scenarioId}`);
  const c = sc.cities.find((x) => x.id === cityId);
  if (!c) throw new Error(`no city ${cityId} on ${scenarioId}`);
  return c.ownerForceId ?? null;
};

describe('鄰近補位 — 城不該落到山那一邊的人手上', () => {
  it('關中的陳倉與散關不屬於漢中的張魯', () => {
    for (const board of ['scn-207-three-visits', 'scn-208-chibi']) {
      for (const city of ['chencang', 'sanguan']) {
        expect(OWNER_OF(board, city), `${board}/${city}`).not.toBe('zhang-lu');
      }
    }
  });

  it('益州北部的門戶不屬於涼州的軍閥', () => {
    for (const [board, warlord] of [['scn-208-chibi', 'ma-teng'], ['scn-211-weinan', 'han-sui']] as const) {
      for (const city of ['jianmen', 'baishuiguan', 'zitong', 'jiameng', 'yinping']) {
        expect(OWNER_OF(board, city), `${board}/${city}`).not.toBe(warlord);
      }
    }
  });

  it('隴右的天水與上邽不屬於漢中的張魯', () => {
    for (const board of ['scn-213-fengpo', 'scn-215-hefei']) {
      for (const city of ['tianshui', 'shanggui']) {
        expect(OWNER_OF(board, city), `${board}/${city}`).not.toBe('zhang-lu');
      }
    }
  });

  it('張魯仍有他該有的縱深 —— 修補位不該把他修沒了', () => {
    // 朴胡、杜濩為其巴夷之帥;漢中之外還有巴西,他才守得住。
    for (const board of ['scn-207-three-visits', 'scn-208-chibi', 'scn-211-weinan']) {
      const mine = SCENARIOS.find((s) => s.id === board)!.cities
        .filter((c) => c.ownerForceId === 'zhang-lu').map((c) => c.id);
      expect(mine, board).toContain('hanzhong');
      expect(mine, board).toContain('yangping');
      expect(mine.length, `${board} 張魯城數`).toBeGreaterThanOrEqual(3);
    }
  });
});
