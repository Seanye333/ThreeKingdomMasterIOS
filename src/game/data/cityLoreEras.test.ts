import { describe, it, expect } from 'vitest';
import { CITY_LORE, cityLore, cityLoreBrief } from './cityLore';
import { eraCityLore, eraLoreCityIds, loreEraFor, type LoreEra } from './cityLoreEras';
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
