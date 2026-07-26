import { describe, expect, it } from 'vitest';
import {
  rollRemonstrance, pendingCause, findRemonstrator,
  REMONSTRATOR_MIN_LOYALTY, REMONSTRATOR_MIN_POLITICS,
} from './remonstrance';
import type { RemonstranceContext } from './remonstrance';
import type { City, EntityId, Force, Officer } from '../types';

/**
 * 死諫 — the one thing in the realm that objects to you winning.
 *
 * Accepting 九錫 currently RAISES your own officers' loyalty and nothing pushes
 * back; these tests are mostly about when the objection is allowed to appear,
 * because a remonstrance that fires at the wrong moment is worse than none.
 */

const officer = (o: Partial<Officer> & { id: string }): Officer =>
  ({
    id: o.id, name: { zh: o.id, en: o.id }, birthYear: 163,
    stats: { leadership: 70, war: 60, intelligence: 80, politics: 80, charisma: 70, ...(o.stats ?? {}) },
    loyalty: 95, locationCityId: 'c1', forceId: 'F', status: 'idle',
    task: null, equipment: [], skills: [], rank: 'soldier',
    ...o,
  }) as Officer;

const city = (id: string, loyalty = 70, owner: EntityId | null = 'F'): City =>
  ({ id, name: { zh: id, en: id }, ownerForceId: owner, loyalty, gold: 100, food: 100 }) as City;

function ctx(over: Partial<RemonstranceContext> = {}): RemonstranceContext {
  const ruler = officer({ id: 'ruler', loyalty: 100 });
  const sage = officer({ id: 'sage', stats: { politics: 92 }, loyalty: 92 });
  return {
    date: { year: 213, season: 'spring' } as RemonstranceContext['date'],
    cities: { c1: city('c1') },
    officers: { ruler, sage },
    forces: { F: { id: 'F', rulerOfficerId: 'ruler' } as Force },
    playerForceId: 'F',
    firedEventIds: [],
    eventFlags: {},
    rng: () => 0.1,
    ...over,
  };
}

describe('pendingCause — what a man may die over', () => {
  it('stays silent in an ordinary realm', () => {
    expect(pendingCause(ctx())).toBeNull();
    expect(rollRemonstrance(ctx())).toBeNull();
  });

  it('speaks once the Nine Bestowments are taken', () => {
    expect(pendingCause(ctx({ eventFlags: { 'nine-bestowments-F': true } }))).toBe('nine-bestowments');
  });

  it('stops mentioning 九錫 once the throne is taken — that argument is over', () => {
    const c = ctx({
      eventFlags: { 'nine-bestowments-F': true },
      forces: { F: { id: 'F', rulerOfficerId: 'ruler', imperialRank: 'emperor' } as Force },
    });
    expect(pendingCause(c)).not.toBe('nine-bestowments');
  });

  it('objects to the imperial style only while the Son of Heaven is held elsewhere', () => {
    const emperor = { forces: { F: { id: 'F', rulerOfficerId: 'ruler', imperialRank: 'emperor' } as Force } };
    // Nobody holds the Han emperor — the dynasty is gone, so no 僭號 to protest.
    expect(pendingCause(ctx({ ...emperor, emperorHeldByForceId: null }))).toBeNull();
    // Someone else holds him: usurpation.
    expect(pendingCause(ctx({ ...emperor, emperorHeldByForceId: 'OTHER' }))).toBe('usurped-style');
    // You hold him yourself — that is the 挾天子 path, argued elsewhere.
    expect(pendingCause(ctx({ ...emperor, emperorHeldByForceId: 'F' }))).toBeNull();
  });

  it('objects to strict law only once it has visibly stopped working', () => {
    const strict = { lawCode: { F: 'strict' as const } };
    // Content provinces: severity is a policy, not a crime.
    expect(pendingCause(ctx({ ...strict, cities: { c1: city('c1', 70) } }))).toBeNull();
    expect(pendingCause(ctx({ ...strict, cities: { c1: city('c1', 30) } }))).toBe('reign-of-terror');
    // A lenient code never draws it, however sullen the people.
    expect(pendingCause(ctx({ lawCode: { F: 'lenient' }, cities: { c1: city('c1', 10) } }))).toBeNull();
  });

  it('reads the legal code of the player\'s own force, not someone else\'s', () => {
    const c = ctx({ lawCode: { OTHER: 'strict' }, cities: { c1: city('c1', 20) } });
    expect(pendingCause(c)).toBeNull();
  });

  it('says nothing when there is no player', () => {
    expect(pendingCause(ctx({ playerForceId: null }))).toBeNull();
  });
});

describe('findRemonstrator — who steps forward', () => {
  const flagged = { eventFlags: { 'nine-bestowments-F': true } };

  it('picks the most principled voice, never the ruler', () => {
    const c = ctx({
      ...flagged,
      officers: {
        ruler: officer({ id: 'ruler', stats: { politics: 99 }, loyalty: 100 }),
        sage: officer({ id: 'sage', stats: { politics: 92 } }),
        clerk: officer({ id: 'clerk', stats: { politics: 70 } }),
      },
    });
    expect(findRemonstrator(c)?.id).toBe('sage');
  });

  it('needs a man loyal enough to die rather than simply leave', () => {
    const c = ctx({
      ...flagged,
      officers: {
        ruler: officer({ id: 'ruler' }),
        cynic: officer({ id: 'cynic', loyalty: REMONSTRATOR_MIN_LOYALTY - 1 }),
      },
    });
    expect(findRemonstrator(c)).toBeNull();
  });

  it('takes a plain-spoken loyalist even without the office of a statesman', () => {
    const c = ctx({
      ...flagged,
      officers: {
        ruler: officer({ id: 'ruler' }),
        soldier: officer({
          id: 'soldier', stats: { politics: REMONSTRATOR_MIN_POLITICS - 20 }, traits: ['loyal'],
        }),
      },
    });
    expect(findRemonstrator(c)?.id).toBe('soldier');
  });

  it('ignores the dead, the captive, and men of other houses', () => {
    const c = ctx({
      ...flagged,
      officers: {
        ruler: officer({ id: 'ruler' }),
        gone: officer({ id: 'gone', status: 'dead' }),
        held: officer({ id: 'held', status: 'imprisoned' }),
        theirs: officer({ id: 'theirs', forceId: 'OTHER' }),
      },
    });
    expect(findRemonstrator(c)).toBeNull();
  });

  /** A court that has already killed its conscience has nobody left to object. */
  it('a court of yes-men produces no memorial at all', () => {
    const c = ctx({
      ...flagged,
      officers: { ruler: officer({ id: 'ruler' }), yes: officer({ id: 'yes', stats: { politics: 40 }, loyalty: 99 }) },
    });
    expect(rollRemonstrance(c)).toBeNull();
  });
});

describe('rollRemonstrance — the memorial and its two answers', () => {
  const flagged = { eventFlags: { 'nine-bestowments-F': true } };

  it('offers exactly two answers, and the player\'s ruler must choose', () => {
    const e = rollRemonstrance(ctx(flagged))!;
    expect(e).toBeTruthy();
    expect(e.chooserRulerId).toBe('ruler');
    expect(e.choices!.map((c) => c.id)).toEqual(['heed', 'refuse']);
    // All consequence rides on the answer — never on merely receiving it.
    expect(e.effects).toEqual([]);
  });

  it('kills the man only on refusal, and only him', () => {
    const e = rollRemonstrance(ctx(flagged))!;
    const heed = e.choices!.find((c) => c.id === 'heed')!;
    const refuse = e.choices!.find((c) => c.id === 'refuse')!;
    expect(heed.effects.some((f) => f.kind === 'officer-status')).toBe(false);
    const deaths = refuse.effects.filter((f) => f.kind === 'officer-status');
    expect(deaths).toHaveLength(1);
    expect(deaths[0]).toMatchObject({ officerId: 'sage', status: 'dead' });
  });

  it('swings the realm\'s legitimacy symmetrically', () => {
    const e = rollRemonstrance(ctx(flagged))!;
    const md = (id: string) => e.choices!.find((c) => c.id === id)!
      .effects.find((f) => f.kind === 'mandate-ruler') as { delta: number };
    expect(md('heed').delta).toBeGreaterThan(0);
    expect(md('refuse').delta).toBe(-md('heed').delta);
  });

  it('teaches the rest of the court — peers move opposite ways', () => {
    const c = ctx({
      ...flagged,
      officers: {
        ruler: officer({ id: 'ruler' }),
        sage: officer({ id: 'sage', stats: { politics: 92 } }),
        peer: officer({ id: 'peer', stats: { politics: 75 } }),
      },
    });
    const e = rollRemonstrance(c)!;
    const peerDelta = (id: string) => (e.choices!.find((x) => x.id === id)!
      .effects.find((f) => f.kind === 'officer-loyalty' && f.officerId === 'peer') as { delta: number }).delta;
    expect(peerDelta('heed')).toBeGreaterThan(0);
    expect(peerDelta('refuse')).toBeLessThan(0);
  });

  it('names the man in both languages so the card reads as a person, not a rule', () => {
    const e = rollRemonstrance(ctx(flagged))!;
    expect(e.descriptionZh).toContain('sage');
    expect(e.description).toContain('sage');
    expect(e.name.zh).toContain('死諫');
  });

  it('never repeats the same argument twice', () => {
    const c = ctx(flagged);
    const e = rollRemonstrance(c)!;
    expect(rollRemonstrance({ ...c, firedEventIds: [e.id] })).toBeNull();
  });

  it('holds its tongue on an unlucky roll — the court needs its nerve', () => {
    expect(rollRemonstrance(ctx({ ...flagged, rng: () => 0.99 }))).toBeNull();
  });

  it('touches only the player\'s own cities', () => {
    const c = ctx({
      ...flagged,
      cities: { c1: city('c1', 70, 'F'), c2: city('c2', 70, 'OTHER') },
    });
    const e = rollRemonstrance(c)!;
    for (const ch of e.choices!) {
      const ids = ch.effects.filter((f) => f.kind === 'city-loyalty').map((f) => (f as { cityId: string }).cityId);
      expect(ids).toEqual(['c1']);
    }
  });
});
