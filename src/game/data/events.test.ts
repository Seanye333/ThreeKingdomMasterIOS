import { describe, it, expect } from 'vitest';
import { HISTORICAL_EVENTS } from './events';
import { OFFICER_IDS, TALENT_POOL_IDS } from './index';
import { HISTORICAL_OFFICER_TEMPLATES } from './historicalOfficers';

describe('historical event catalog integrity', () => {
  /*
   * 外傳三線(戰國/楚漢/隋唐)的人不在三國名冊裡 —— 他們在
   * `historicalOfficers.ts`。垓下、大澤鄉、虎牢那幾條事件鏈引用的是那一批。
   */
  const known = new Set([
    ...OFFICER_IDS, ...TALENT_POOL_IDS,
    ...HISTORICAL_OFFICER_TEMPLATES.map((t) => t.id),
  ]);

  it('event ids are unique', () => {
    const ids = HISTORICAL_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every referenced officer id exists', () => {
    for (const e of HISTORICAL_EVENTS) {
      for (const r of e.requires ?? []) {
        if ('officerId' in r) expect(known.has(r.officerId), `${e.id} requires ${r.officerId}`).toBe(true);
      }
      for (const f of e.effects) {
        if ('officerId' in f) expect(known.has(f.officerId), `${e.id} effect ${f.officerId}`).toBe(true);
        if ('rulerOfficerId' in f) expect(known.has(f.rulerOfficerId), `${e.id} ruler ${f.rulerOfficerId}`).toBe(true);
      }
    }
  });

  it('year windows are sane', () => {
    for (const e of HISTORICAL_EVENTS) {
      expect(e.yearMin, e.id).toBeLessThanOrEqual(e.yearMax);
      /*
       * 下限是 178 而不是 184 —— **外傳三線借三國的曆法軸**(`startDate.year`
       * 都是 178),於是垓下、大澤鄉、虎牢那幾條鏈的窗口從 178 起算。
       * 它們不靠年份鎖住自己,靠的是「只有那條線才有的人」當守衛。
       */
      expect(e.yearMin, e.id).toBeGreaterThanOrEqual(178);
      expect(e.yearMax, e.id).toBeLessThanOrEqual(290);
    }
  });

  it('the six new 列傳 icons are present', () => {
    /*
     * evt-three-heroes-lu-bu → evt-sanying-lubu:虎牢關那一場原本在事件表裡
     * 有兩條,名字一字不差,互斥只做了一半(呂布負傷時後者先演,旗標沒設,
     * 傷癒後前者再演一次)。2026-08 併成一條,保留 evt-sanying-lubu 並收下
     * 另一條的效果與旗標。這裡跟著改指向存活的那個 id。
     */
    const ids = new Set(HISTORICAL_EVENTS.map((e) => e.id));
    for (const id of ['evt-warm-wine-hua-xiong', 'evt-sanying-lubu', 'evt-dingjunshan', 'evt-jieting-ma-su', 'evt-scraping-bone', 'evt-single-blade-meeting']) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});
