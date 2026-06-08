import { describe, it, expect } from 'vitest';
import {
  mintCustomEventId,
  validateDraft,
  buildCustomEvent,
  isCustomEventId,
  type CustomEventDraft,
} from './customEvents';
import { findFiringEventIn, applyEventEffects } from './historicalEvents';
import type { City, Force, GameDate } from '../types';

const draft = (over: Partial<CustomEventDraft> = {}): CustomEventDraft => ({
  nameZh: '黃河氾濫',
  nameEn: 'Yellow River Flood',
  yearMin: 200,
  yearMax: 205,
  descriptionZh: '黃河決堤。',
  descriptionEn: 'The Yellow River breaks its banks.',
  effects: [{ kind: 'force-gold', forceId: 'cao', delta: -500 }],
  ...over,
});

describe('custom event authoring', () => {
  it('mints unique prefixed ids that dodge collisions', () => {
    const id1 = mintCustomEventId([]);
    expect(id1).toBe('custom-1');
    expect(isCustomEventId(id1)).toBe(true);
    const e1 = buildCustomEvent(draft(), []);
    const id2 = mintCustomEventId([e1]);
    expect(id2).toBe('custom-2');
    // Collision: an existing event already squats custom-2.
    const squat = { ...e1, id: 'custom-2' };
    expect(mintCustomEventId([e1, squat])).toBe('custom-3');
  });

  it('validates names, year order, and at least one effect', () => {
    expect(validateDraft(draft()).ok).toBe(true);
    expect(validateDraft(draft({ nameZh: '', nameEn: '' })).ok).toBe(false);
    expect(validateDraft(draft({ yearMin: 210, yearMax: 200 })).ok).toBe(false);
    expect(validateDraft(draft({ effects: [] })).ok).toBe(false);
  });

  it('builds a firing-ready HistoricalEvent from a draft', () => {
    const evt = buildCustomEvent(draft(), []);
    expect(evt.id).toBe('custom-1');
    expect(evt.name).toEqual({ zh: '黃河氾濫', en: 'Yellow River Flood' });
    expect(evt.yearMin).toBe(200);
    expect(evt.effects).toHaveLength(1);
  });
});

describe('custom event firing through the shared engine', () => {
  const evt = buildCustomEvent(draft(), []);
  const ctx = (over: Partial<{ year: number; fired: string[] }> = {}) => ({
    date: { year: over.year ?? 202, season: 'spring', month: 1, phase: 'upper' } as GameDate,
    cities: {} as Record<string, City>,
    officers: {},
    forces: {} as Record<string, Force>,
    eventFlags: {},
    firedEventIds: over.fired ?? [],
  });

  it('fires deterministically with alwaysFire when in the year window', () => {
    expect(findFiringEventIn([evt], ctx({ year: 202 }), { alwaysFire: true })?.id).toBe('custom-1');
  });

  it('does not fire outside the year window', () => {
    expect(findFiringEventIn([evt], ctx({ year: 210 }), { alwaysFire: true })).toBeNull();
  });

  it('does not re-fire once its id is in firedEventIds', () => {
    expect(findFiringEventIn([evt], ctx({ year: 202, fired: ['custom-1'] }), { alwaysFire: true })).toBeNull();
  });

  it('applies its effects through applyEventEffects (gold lands in the capital)', () => {
    const forces = { cao: { id: 'cao', capitalCityId: 'xuchang' } as unknown as Force };
    const cities = { xuchang: { id: 'xuchang', gold: 1000 } as unknown as City };
    const out = applyEventEffects(evt, { ...ctx({ year: 202 }), forces, cities });
    expect(out.cities.xuchang.gold).toBe(500); // 1000 - 500
  });
});
