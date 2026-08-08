import { describe, it, expect } from 'vitest';
import { HISTORICAL_EVENTS } from './events';
import { SCENARIOS } from './scenarios';

/**
 * 外傳三線的事件鏈不能外漏到三國盤上 —— 而年份鎖不住它們。
 *
 * 戰國/楚漢/隋唐三線借三國的曆法軸(`startDate.year = 178`),所以
 * 「垓下之戰」那條鏈的 `yearMin: 178` 在 184 黃巾盤上照樣落在窗口裡。
 * 唯一擋得住的是**只有那條線才有的人**:`officer-alive` 對不存在的人直接
 * 回 false(見 `historicalEvents.ts` 的 `resolveForceId` 那一段)。
 *
 * 這條測試釘的就是那個約定 —— 每一條 178 起算的事件都必須有一個
 * **三國盤上不存在**的人當守衛。這與 §7.4 的 `isLaterHanBoard` 是同一個
 * 問題的兩種解法,而這一種靠資料自己說話,不必再開一個旗標。
 */
describe('外傳事件鏈的守衛', () => {
  /** 三國線任何一張盤上出現過的人。 */
  const threeKingdomsOfficers = new Set<string>();
  for (const s of SCENARIOS) {
    if (!/^scn-(ws|ch|st)-/.test(s.id)) {
      for (const o of s.officers) threeKingdomsOfficers.add(o.id);
    }
  }

  const altEra = HISTORICAL_EVENTS.filter((e) => e.yearMin < 184);

  it('有 178 起算的事件(否則這條測試是空的)', () => {
    expect(altEra.length).toBeGreaterThan(0);
  });

  /** 只有外傳盤才會種的鏈旗標(`Scenario.eventFlags`),本身就是一道守衛。 */
  const chainFlags = new Set<string>();
  for (const s of SCENARIOS) for (const f of s.eventFlags ?? []) {
    if (/^scn-(ws|ch|st)-/.test(s.id)) chainFlags.add(f);
  }

  it('每一條都以三國盤上沒有的人、或只有外傳盤才種的鏈旗標當守衛', () => {
    const leaky = altEra.filter((e) => {
      const reqs = e.requires ?? [];
      const officerGuard = reqs.some(
        (r) => (r.kind === 'officer-alive' || r.kind === 'officer-active')
          && !threeKingdomsOfficers.has(r.officerId),
      );
      const flagGuard = reqs.some((r) => r.kind === 'flag-set' && chainFlags.has(r.key));
      return !officerGuard && !flagGuard;
    });
    expect(
      leaky.map((e) => `${e.id}(${e.name.zh})`),
      '這幾條會在三國盤上照演一遍 —— 加一個只有外傳線才有的人當 officer-alive 守衛,'
      + '或把它掛在該盤 eventFlags 宣告的鏈旗標上。',
    ).toEqual([]);
  });
});
