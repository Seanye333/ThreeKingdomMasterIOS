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
    const ids = new Set(HISTORICAL_EVENTS.map((e) => e.id));
    for (const id of ['evt-warm-wine-hua-xiong', 'evt-three-heroes-lu-bu', 'evt-dingjunshan', 'evt-jieting-ma-su', 'evt-scraping-bone', 'evt-single-blade-meeting']) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});
