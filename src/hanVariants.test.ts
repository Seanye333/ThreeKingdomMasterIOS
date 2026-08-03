import { describe, it, expect } from 'vitest';
import { scanAll, AMBIGUOUS } from '../scripts/scan-han-variants';

/**
 * 全庫只准出現繁體 —— 硬性歸零,不是棘輪。
 *
 * 這條測試存在的理由,是 2026-08-02 試玩截圖裡的新手教學第一屏:
 * 「你是一方**势**力的君主。目标是统一天下…」整套九步都是簡體。往下查發現
 * 不是一處:最有名的那幾位(曹操/劉備/孫權/關羽/張飛)的列傳是簡體,後補的
 * 冷門武將反而是繁體;官職表寫著「車騎**将**軍」;對話資料裡有「地**図**」
 * 「何**処**」「紛込噂」—— 那是日文漢字,甚至是和製漢字。
 *
 * 共 1,372 個字、95 個檔。這種東西**靠人看是看不完的**,所以釘在這裡:
 * 新資料一旦帶進簡體或日文字形,這條先紅。
 *
 * 字表與「刻意不收的歧義字」都在 scripts/scan-han-variants.ts。後者更重要 ——
 * 范疆/咸陽/岳飛/子曰詩云/并州/太后 這些字兩邊都合法,自動轉換會當場改壞,
 * 所以工具只收「繁體裡根本不會這樣寫」的字。
 */
describe('漢字字體一致性', () => {
  it('src 全庫不含簡體字或日文新字體', () => {
    const hits = scanAll('src');
    expect(
      hits,
      `非繁體字行 ${hits.length} 條:\n`
      + hits.slice(0, 40).map((h) => `  ${h.file}:${h.line} [${h.chars.join(' ')}${h.kokuji.join('')}] ${h.text}`).join('\n')
      // 訊息裡不要舉實際的字為例 —— 這支測試會掃到自己。
      + `\n\n就地修:node --import tsx scripts/scan-han-variants.ts --fix src`
      + `\n和製漢字沒有對應的中文字(見該檔 KOKUJI),只能人工重寫。`,
    ).toEqual([]);
  });

  /** 歧義字名單是這支工具的安全底線,每條都要有理由,否則等於默默放行。 */
  it('歧義字名單每條都寫了理由', () => {
    expect(Object.keys(AMBIGUOUS).length).toBeGreaterThan(30);
    for (const [ch, why] of Object.entries(AMBIGUOUS)) {
      expect(why.length, `歧義字「${ch}」沒寫理由`).toBeGreaterThan(4);
    }
  });
});
