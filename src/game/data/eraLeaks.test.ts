import { describe, expect, it } from 'vitest';
import { isLaterHanBoard, SCENARIOS } from './scenarios';
import { tribesOnBoard } from './tribes';

/*
 * 外傳三線的「時代漏法」—— 同一個形狀犯過三次,所以在這裡一起釘住。
 *
 * 戰國/楚漢/隋唐三線借的是三國的曆法軸(`startDate.year = 178`),於是任何
 * **拿絕對年份當觸發**的漢末內容都會在它們身上照演一遍。實際撈到的三次:
 *
 *  1. 林邑國在戰國盤上建國 —— 早四百年。已由 `tribesOnBoard` 擋掉。
 *  2. 流民/宗教叛亂長出太平道、五斗米 —— 已由 `sectsAvailable` 擋掉。
 *  3. **黃巾總爆發**(`rollYellowTurbanRising`)。全 AI 觀察跑戰國七雄盤,
 *     太平道從秦手裡拿走了長安、巴西、犍為 —— 前 294 年的秦昭襄王面對
 *     蒼天已死黃天當立。前兩條都補過了,唯獨這一條的 call site 沒接上守衛。
 *
 * 這條測試不模擬,只釘**判準本身**:哪些盤算漢末、哪些不算。真正的守衛在
 * store.ts 的 endSeason(黃巾總爆發與宗教叛亂各一處)與 tribes.ts。
 */
describe('時代漏法 — 外傳三線不吃漢末專屬內容', () => {
  it('isLaterHanBoard 只認三國線', () => {
    const alt = SCENARIOS.filter((s) => /^scn-(ws|ch|st)-/.test(s.id));
    expect(alt.length).toBeGreaterThan(20);
    for (const s of alt) expect(isLaterHanBoard(s.id), s.id).toBe(false);

    const han = SCENARIOS.filter((s) => !/^scn-(ws|ch|st)-/.test(s.id));
    for (const s of han) expect(isLaterHanBoard(s.id), s.id).toBe(true);
  });

  it('外傳三線借三國曆法軸,所以一定會走過「184 年」', () => {
    // 這正是漏法的成因 —— 記在測試裡,免得有人以為改 startDate 就沒事了。
    const alt = SCENARIOS.filter((s) => /^scn-(ws|ch|st)-/.test(s.id));
    for (const s of alt) expect(s.startDate.year, s.id).toBeLessThanOrEqual(184);
  });

  it('部族也依盤別分時代(同一個形狀的舊修正,一併守住)', () => {
    expect(tribesOnBoard('scn-ws-seven').map((t) => t.id)).not.toContain('linyi');
    expect(tribesOnBoard('scn-208-chibi').map((t) => t.id)).toContain('linyi');
  });
});
