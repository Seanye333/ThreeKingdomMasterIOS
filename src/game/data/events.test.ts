import { describe, it, expect } from 'vitest';
import { HISTORICAL_EVENTS } from './events';
import { OFFICER_IDS, TALENT_POOL_IDS } from './index';

describe('historical event catalog integrity', () => {
  const known = new Set([...OFFICER_IDS, ...TALENT_POOL_IDS]);

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
      expect(e.yearMin, e.id).toBeGreaterThanOrEqual(180);
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
