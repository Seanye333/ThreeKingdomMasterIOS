import { describe, expect, it } from 'vitest';
import {
  trackService, qualmStrength, qualmedOfficers, formerLordQualmsMul, qualmReport,
  QUALM_SEASONS, QUALM_MAX_PENALTY, QUALM_LOYALTY_SETTLED,
} from './formerLord';
import type { EntityId, Force, Officer } from '../types';

/**
 * 故主之義 — the memory a turncoat carries. `retinueOfLordId` already covered
 * the original retainer; nothing covered the man you captured last spring.
 */

const off = (o: Partial<Officer> & { id: string }): Officer =>
  ({
    id: o.id, name: { zh: o.id, en: o.id }, birthYear: 165,
    stats: { leadership: 70, war: 75, intelligence: 70, politics: 65, charisma: 65 },
    loyalty: 60, locationCityId: 'c1', forceId: 'NEW', status: 'idle',
    task: null, equipment: [], skills: [], rank: 'soldier',
    ...o,
  }) as Officer;

const forces: Record<EntityId, Force> = {
  OLD: { id: 'OLD', rulerOfficerId: 'old-lord' } as Force,
  NEW: { id: 'NEW', rulerOfficerId: 'new-lord' } as Force,
};

const tick = (officers: Record<EntityId, Officer>, n = 1) => {
  let cur = officers;
  for (let i = 0; i < n; i++) cur = trackService(cur, forces);
  return cur;
};

describe('trackService — noticing that a man changed houses', () => {
  it('records nothing the first time it sees an officer, only the shadow', () => {
    const out = tick({ a: off({ id: 'a', forceId: 'OLD' }) });
    expect(out.a.servingForceId).toBe('OLD');
    expect(out.a.formerForceId).toBeUndefined();
    expect(out.a.qualmSeasons ?? 0).toBe(0);
  });

  it('a masterless man taking service owes nobody', () => {
    let s = tick({ a: off({ id: 'a', forceId: undefined }) });
    s = { a: { ...s.a, forceId: 'NEW' } };
    s = tick(s);
    expect(s.a.formerForceId).toBeUndefined();
    expect(s.a.qualmSeasons ?? 0).toBe(0);
  });

  it('remembers the house — and the man — when he changes sides', () => {
    let s = tick({ a: off({ id: 'a', forceId: 'OLD' }) });
    s = { a: { ...s.a, forceId: 'NEW' } };          // captured & turned, any path
    s = tick(s);
    expect(s.a.formerForceId).toBe('OLD');
    expect(s.a.formerLordId).toBe('old-lord');
    expect(s.a.qualmSeasons).toBe(QUALM_SEASONS);
    expect(s.a.servingForceId).toBe('NEW');
  });

  /** The whole reason this is a diff and not a set of hooks at the join sites. */
  it('catches a change no matter which door he came through', () => {
    let s = tick({ a: off({ id: 'a', forceId: 'OLD' }) });
    // Some future recruitment path nobody told this module about:
    s = { a: { ...s.a, forceId: 'NEW', loyalty: 80 } };
    s = tick(s);
    expect(s.a.formerForceId).toBe('OLD');
  });

  it('cools the qualm by exactly one season at a time', () => {
    let s = tick({ a: off({ id: 'a', forceId: 'OLD' }) });
    s = tick({ a: { ...s.a, forceId: 'NEW' } });
    expect(s.a.qualmSeasons).toBe(QUALM_SEASONS);
    s = tick(s, 3);
    expect(s.a.qualmSeasons).toBe(QUALM_SEASONS - 3);
    s = tick(s, 99);
    expect(s.a.qualmSeasons).toBe(0);
  });

  it('re-arms in full if he changes houses again', () => {
    let s = tick({ a: off({ id: 'a', forceId: 'OLD' }) });
    s = tick({ a: { ...s.a, forceId: 'NEW' } });
    s = tick(s, 5);
    s = tick({ a: { ...s.a, forceId: 'OLD' } });      // back to his old colours
    expect(s.a.formerForceId).toBe('NEW');
    expect(s.a.qualmSeasons).toBe(QUALM_SEASONS);
  });

  it('passes settled officers through untouched, so a tick is cheap', () => {
    const settled = { ...off({ id: 'a', forceId: 'NEW' }), servingForceId: 'NEW' as EntityId };
    const out = trackService({ a: settled }, forces);
    expect(out.a).toBe(settled);
  });

  it('does not mutate the map it was handed', () => {
    const input = { a: off({ id: 'a', forceId: 'OLD' }) };
    const snapshot = JSON.stringify(input);
    trackService(input, forces);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('qualmStrength — how badly he does not want to', () => {
  const fresh = off({ id: 'a', formerForceId: 'OLD', qualmSeasons: QUALM_SEASONS, loyalty: 50 });

  it('bites hardest on a fresh, cold defector', () => {
    expect(qualmStrength(fresh, 'OLD')).toBeCloseTo(1);
  });

  it('is felt only toward the house he actually left', () => {
    expect(qualmStrength(fresh, 'THIRD')).toBe(0);
    expect(qualmStrength(fresh, null)).toBe(0);
    expect(qualmStrength(off({ id: 'b' }), 'OLD')).toBe(0);
  });

  it('fades as the seasons pass', () => {
    const half = { ...fresh, qualmSeasons: QUALM_SEASONS / 2 };
    expect(qualmStrength(half, 'OLD')).toBeLessThan(qualmStrength(fresh, 'OLD'));
    expect(qualmStrength({ ...fresh, qualmSeasons: 0 }, 'OLD')).toBe(0);
  });

  it('fades as he comes to mean it — a contented man does not flinch', () => {
    expect(qualmStrength({ ...fresh, loyalty: QUALM_LOYALTY_SETTLED }, 'OLD')).toBe(0);
    expect(qualmStrength({ ...fresh, loyalty: 75 }, 'OLD'))
      .toBeLessThan(qualmStrength({ ...fresh, loyalty: 55 }, 'OLD'));
  });

  it('never runs past its bounds', () => {
    expect(qualmStrength({ ...fresh, loyalty: 0 }, 'OLD')).toBeLessThanOrEqual(1);
    expect(qualmStrength({ ...fresh, loyalty: 100 }, 'OLD')).toBe(0);
    expect(qualmStrength({ ...fresh, qualmSeasons: 999 }, 'OLD')).toBeLessThanOrEqual(1);
  });
});

describe('formerLordQualmsMul — what it costs the column', () => {
  const loyalMan = off({ id: 'clean' });
  const turncoat = off({ id: 'turn', formerForceId: 'OLD', qualmSeasons: QUALM_SEASONS, loyalty: 50 });

  it('leaves an untainted party alone', () => {
    expect(formerLordQualmsMul([loyalMan, loyalMan], 'OLD')).toBe(1);
    expect(formerLordQualmsMul([], 'OLD')).toBe(1);
    expect(formerLordQualmsMul([turncoat], null)).toBe(1);
  });

  it('caps the worst case at the stated penalty', () => {
    expect(formerLordQualmsMul([turncoat], 'OLD', turncoat))
      .toBeCloseTo(1 - QUALM_MAX_PENALTY);
  });

  it('one reluctant man in a big staff drags, but does not halve', () => {
    const mul = formerLordQualmsMul([turncoat, loyalMan, loyalMan, loyalMan], 'OLD', loyalMan);
    expect(mul).toBeLessThan(1);
    expect(mul).toBeGreaterThan(1 - QUALM_MAX_PENALTY);
  });

  it('weighs the commander double — it is his column', () => {
    const asLeader = formerLordQualmsMul([turncoat, loyalMan], 'OLD', turncoat);
    const asFollower = formerLordQualmsMul([turncoat, loyalMan], 'OLD', loyalMan);
    expect(asLeader).toBeLessThan(asFollower);
  });

  it('tolerates gaps in the roster', () => {
    expect(formerLordQualmsMul([null, undefined, loyalMan], 'OLD')).toBe(1);
  });
});

describe('qualmedOfficers / qualmReport', () => {
  const turncoat = off({ id: 'yu-jin', formerForceId: 'OLD', qualmSeasons: QUALM_SEASONS, loyalty: 50 });
  const other = off({ id: 'huang-quan', formerForceId: 'OLD', qualmSeasons: 4, loyalty: 70 });

  it('names the most reluctant man first', () => {
    const r = qualmReport([other, turncoat], 'OLD', { zh: '曹', en: 'Cao' })!;
    expect(r.zh).toContain('yu-jin');
    expect(r.en).toContain('yu-jin');
    expect(r.zh).toContain('曹');
    expect(r.en).toContain('Cao');
  });

  it('counts the others without listing them all', () => {
    expect(qualmReport([turncoat, other], 'OLD', undefined)!.en).toContain('1 more');
    expect(qualmReport([turncoat], 'OLD', undefined)!.en).not.toContain('more');
  });

  it('stays silent when nobody hesitated', () => {
    expect(qualmReport([off({ id: 'clean' })], 'OLD', undefined)).toBeNull();
    expect(qualmedOfficers([off({ id: 'clean' })], 'OLD')).toEqual([]);
  });
});
