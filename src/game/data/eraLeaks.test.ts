import { describe, expect, it } from 'vitest';
import { isLaterHanBoard, SCENARIOS } from './scenarios';
import { tribesOnBoard } from './tribes';
import { HISTORICAL_EVENTS } from './events';

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

  /*
   * 反方向的漏法(2026-08-09):外傳事件漏進三國盤。
   *
   * 外傳三線借三國曆法軸,所以年份**擋不住任何東西** —— 戰國那批的窗口寫的是
   * 178–192,而三國盤同樣走過那幾年。真正鎖住它們的是**只有那條線才有的人**:
   * `officer-alive` 查不到人就回 false(historicalEvents.ts:135)。
   *
   * 於是規矩是:**外傳事件的 requires 至少要有一條 `hist-` 開頭的人物條件。**
   * 忘了寫就會在赤壁盤上演「徙木立信」,而那不會有任何測試自然地紅 ——
   * 所以在這裡明寫。
   */
  /*
   * 守衛之所以有效,靠的是這一條:**三國盤的人物池裡一個 `hist-` 都沒有。**
   * 沒有這一條,上面那條「帶了守衛就安全」只是一半的論證 —— 而風險是真的:
   * 184/189/190/192 這幾張早期盤的十年窗口(184–194)正好蓋住外傳線的
   * 178–192,靜態列表裡戰國楚漢隋唐那四十幾條全在。實測零污染,原因就在這裡。
   */
  it('三國盤的人物池裡沒有外傳人物(這才是守衛有效的理由)', () => {
    for (const sid of ['scn-184-yellow-turban', 'scn-190-anti-dong-zhuo', 'scn-208-chibi']) {
      const s = SCENARIOS.find((x) => x.id === sid)!;
      const hist = (s.officers ?? [])
        .map((o) => (typeof o === 'string' ? o : o.id))
        .filter((id) => String(id).startsWith('hist-'));
      expect(hist, `${sid} 混進了外傳人物`).toEqual([]);
    }
  });

  it('外傳事件一定帶得動它自己的時代守衛', () => {
    const alt = HISTORICAL_EVENTS.filter((e) => /^evt-(ws|ch|st)-/.test(e.id));
    expect(alt.length, '外傳事件一條都沒有?判準或 id 命名變了').toBeGreaterThan(10);
    const naked = alt.filter((e) => !(e.requires ?? []).some(
      (r) => 'officerId' in r && String(r.officerId).startsWith('hist-'),
    ));
    expect(naked.map((e) => `${e.id} ${e.name.zh}`)).toEqual([]);
  });
});
