import { describe, it, expect } from 'vitest';
import { CITY_LORE, cityLore, cityLoreBrief, loreYearGate } from './cityLore';
import {
  eraCityLore, eraLoreCityIds, loreEraFor, type LoreEra,
  lateHanCityLore, lateHanCityIds, POST_184_MARKERS,
} from './cityLoreEras';
import { SCENARIOS } from './scenarios';

/**
 * 分代風物志 — the guard against telling a Warring States player about 李傕郭汜.
 *
 * `cityLore.ts` is Three-Kingdoms prose end to end. The bug it caused was
 * visible on the first screen of a 戰國 campaign: 長安's gazetteer note quoted
 * a civil war four hundred years in its future. The fix is not to soften the
 * text but to make the fallback impossible — off-era, a city either has an
 * era note or shows nothing.
 */
const ERAS: LoreEra[] = ['warring-states', 'chu-han', 'sui-tang'];

describe('分代風物志', () => {
  it('maps scenario ids to eras, and leaves Three Kingdoms / what-if alone', () => {
    expect(loreEraFor('scn-ws-changping')).toBe('warring-states');
    expect(loreEraFor('scn-ch-gaixia')).toBe('chu-han');
    expect(loreEraFor('scn-st-hulao')).toBe('sui-tang');
    expect(loreEraFor('scn-184-yellow-turban')).toBeNull();
    expect(loreEraFor(null)).toBeNull();
    expect(loreEraFor(undefined)).toBeNull();
  });

  /** 這是整條線的重點:**不可以**回退到三國文本。 */
  it('never falls back to the Three Kingdoms note on a cross-era board', () => {
    const crossEra = SCENARIOS.filter((s) => loreEraFor(s.id));
    expect(crossEra.length).toBeGreaterThan(20);
    for (const s of crossEra) {
      for (const cityId of Object.keys(CITY_LORE)) {
        const note = cityLore(cityId, s.id);
        if (note === null) continue;           // 尚未撰寫 — 顯示空白,正確
        expect(note, `${s.id}/${cityId} fell back to the Three Kingdoms note`)
          .not.toBe(CITY_LORE[cityId]);
      }
    }
  });

  it('still serves the Three Kingdoms note on its own boards', () => {
    expect(cityLore('luoyang', 'scn-184-yellow-turban')).toBe(CITY_LORE.luoyang);
    expect(cityLore('luoyang')).toBe(CITY_LORE.luoyang);
    expect(cityLoreBrief('luoyang', 'zh')).toBeTruthy();
  });

  it('brief follows the era too', () => {
    const zhWs = cityLoreBrief('changan', 'zh', 64, 'scn-ws-changping');
    const zh3k = cityLoreBrief('changan', 'zh', 64, 'scn-184-yellow-turban');
    expect(zhWs).toBeTruthy();
    expect(zh3k).toBeTruthy();
    expect(zhWs).not.toBe(zh3k);
    // 戰國的長安不該提三國人物。
    expect(zhWs).not.toContain('李傕');
  });

  /**
   * 每一代**每個盤上的都城**都必須有風物志 —— 玩家開局第一眼看的就是自己的
   * 都城,那裡空白最刺眼。其餘的城可以慢慢隨戰役補。
   */
  it('covers every capital that a cross-era board actually uses', () => {
    for (const s of SCENARIOS) {
      const era = loreEraFor(s.id);
      if (!era) continue;
      for (const f of s.forces) {
        if (!f.capitalCityId) continue;
        expect(
          eraCityLore(era, f.capitalCityId),
          `${s.name.zh} (${era}): capital ${f.capitalCityId} has no era lore`,
        ).not.toBeNull();
      }
    }
  });

  it('has both languages, and no era note left as a stub', () => {
    for (const era of ERAS) {
      for (const id of eraLoreCityIds(era)) {
        const note = eraCityLore(era, id)!;
        expect(note.zh.length, `${era}/${id} zh too short`).toBeGreaterThan(20);
        expect(note.en.length, `${era}/${id} en too short`).toBeGreaterThan(40);
      }
    }
  });
});

/**
 * 漢末風物志 —— 同一條線上的第二個洞:三國盤自己也有早晚。
 *
 * 分代表管的是「別在戰國盤講三國」,而 2026-08-02 試玩黃巾之亂時,開局點開鄴,
 * 風物志寫著「曹操破之而營之,築銅雀、金鳳、冰井三臺」—— 曹操 204 年才取鄴、
 * 210 年才築臺,而這是 184 年的盤。128 城裡這樣的有 64 座。
 *
 * 修法不是逐城標年份,而是讓文本自己說:三國文本裡出現後世人事的詞,就表示
 * 它要到那一年才成立(POST_184_MARKERS)。於是同一座鄴,184 年講西門豹鑿渠,
 * 打到 210 年再點開,講的就是銅雀臺 —— 方志隨著歷史推進而改寫。
 */
describe('漢末風物志', () => {
  /** 有劇透的城必須有漢末版 —— 否則玩家在 184 年仍讀到 210 年的事。 */
  it('every city whose Three-Kingdoms note is post-dated has a late-Han version', () => {
    const gated = Object.keys(CITY_LORE).filter((id) => Number.isFinite(loreYearGate(id)));
    expect(gated.length).toBeGreaterThan(90);
    const missing = gated.filter((id) => !lateHanCityLore(id));
    expect(
      missing,
      `這些城的三國文本提到 184 年之後的人事,卻沒有漢末版:\n  ${missing.join(', ')}\n`
      + `補在 cityLoreEras.ts 的 LATE_HAN。`,
    ).toEqual([]);
  });

  /** 反向自檢:漢末版自己不准帶劇透。這條是我寫那 64 段時的安全網。 */
  it('no late-Han note quotes anything from after 184', () => {
    const bad: string[] = [];
    for (const id of lateHanCityIds()) {
      const zh = lateHanCityLore(id)!.zh;
      for (const [term, year] of Object.entries(POST_184_MARKERS)) {
        if (year > 184 && zh.includes(term)) bad.push(`${id}: 「${term}」(${year})`);
      }
    }
    expect(bad, `漢末版裡出現後世人事:\n  ${bad.join('\n  ')}`).toEqual([]);
  });

  it('serves the late-Han note in 184 and the Three-Kingdoms note once history catches up', () => {
    // 鄴:銅雀臺 210 年才有
    expect(loreYearGate('ye')).toBe(210);
    expect(cityLore('ye', 'scn-184-yellow-turban', 184)!.zh).toContain('西門豹');
    expect(cityLore('ye', 'scn-184-yellow-turban', 184)!.zh).not.toContain('銅雀');
    expect(cityLore('ye', 'scn-184-yellow-turban', 210)!.zh).toContain('銅雀');
    // 不給年份的呼叫端行為不變
    expect(cityLore('ye', 'scn-184-yellow-turban')!.zh).toContain('銅雀');
    // 洛陽:「董卓一炬,宮闕成墟」是 190 年,184 年該講的是靈帝西園賣官
    expect(cityLore('luoyang', 'scn-184-yellow-turban', 184)!.zh).toContain('西園');
    expect(cityLore('luoyang', 'scn-184-yellow-turban', 190)!.zh).toContain('宮闕成墟');
    // 沒有劇透的城,任何年份都拿同一段 —— 汝南的「四世三公」「月旦評」在 184 年正是當下
    expect(loreYearGate('runan')).toBe(Infinity);
    expect(cityLore('runan', 'scn-184-yellow-turban', 184))
      .toEqual(cityLore('runan', 'scn-184-yellow-turban'));
  });

  it('keeps both languages, and keeps them the length of a gazetteer note', () => {
    for (const id of lateHanCityIds()) {
      const l = lateHanCityLore(id)!;
      expect(l.zh.length, `${id} 中文過短`).toBeGreaterThan(30);
      expect(l.zh.length, `${id} 中文過長`).toBeLessThan(200);
      expect(l.en.length, `${id} 英文過短`).toBeGreaterThan(60);
    }
  });

  /** 跨代盤不吃這條線:它們走各自的分代表,漢末閘不該插手。 */
  it('leaves cross-era boards to their own tables', () => {
    expect(cityLore('changan', 'scn-ws-changping', 260)!.zh).toContain('商君');
  });
});
