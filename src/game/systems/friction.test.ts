import { describe, it, expect } from 'vitest';
import { growFrictionFromProximity, addFriction, frictionDriversFor, reconcilePair, FEUD_MEND_THRESHOLD } from './friction';
import { getRapport } from './rapport';
import { mkOfficer } from '../../test/factories';
import { pairKey } from '../types/diplomacy';
import type { OathBond } from '../data/bonds';

const at = (id: string, forceId: string, cityId: string | null, over = {}) =>
  mkOfficer({ id, forceId, locationCityId: cityId, status: 'idle', ...over });

describe('friction drivers (嫌隙來源)', () => {
  it('two abrasive egos clash hardest; a calm pair not at all', () => {
    const arrA = at('a', 'F', 'c1', { traits: ['arrogant'] as never });
    const arrB = at('b', 'F', 'c1', { traits: ['haughty'] as never });
    const calmA = at('x', 'F', 'c1', { traits: [] as never });
    const calmB = at('y', 'F', 'c1', { traits: [] as never });
    expect(frictionDriversFor(arrA, arrB, 2)).toBeGreaterThan(0);
    expect(frictionDriversFor(calmA, calmB, 2)).toBe(0);
    // both-abrasive friction exceeds one-sided friction
    expect(frictionDriversFor(arrA, arrB, 2)).toBeGreaterThan(frictionDriversFor(arrA, calmA, 2));
  });

  it('grudge-holders add friction', () => {
    const a = at('a', 'F', 'c1', { grievanceCount: 3 });
    const b = at('b', 'F', 'c1', { grievanceCount: 2 });
    expect(frictionDriversFor(a, b, 2)).toBeGreaterThan(0);
  });
});

describe('growFrictionFromProximity (嫌隙 → 宿怨)', () => {
  it('sours co-serving abrasive peers toward the negative pole', () => {
    const officers = {
      a: at('a', 'F', 'c1', { traits: ['arrogant'] as never }),
      b: at('b', 'F', 'c1', { traits: ['vainglorious'] as never }),
    };
    const out = growFrictionFromProximity({ rapport: {}, officers, bondedPairs: new Set(), amount: 2 });
    expect(getRapport(out.rapport, 'a', 'b')).toBeLessThan(0);
  });

  it('forges a 宿怨 (feud) when a pair crosses −100', () => {
    const officers = {
      a: at('a', 'F', 'c1', { traits: ['arrogant'] as never }),
      b: at('b', 'F', 'c1', { traits: ['cruel'] as never }),
    };
    const seeded = { [pairKey('a', 'b')]: -99 };
    const out = growFrictionFromProximity({ rapport: seeded, officers, bondedPairs: new Set(), amount: 2 });
    expect(getRapport(out.rapport, 'a', 'b')).toBe(-100);
    expect(out.forged).toHaveLength(1);
    expect(out.forged[0].kind).toBe('feud');
  });

  it('skips pairs already bonded/feuding', () => {
    const officers = {
      a: at('a', 'F', 'c1', { traits: ['arrogant'] as never }),
      b: at('b', 'F', 'c1', { traits: ['arrogant'] as never }),
    };
    const out = growFrictionFromProximity({ rapport: {}, officers, bondedPairs: new Set([pairKey('a', 'b')]), amount: 2 });
    expect(getRapport(out.rapport, 'a', 'b')).toBe(0);
  });
});

describe('addFriction (one-off)', () => {
  it('drives a pair negative and forges a feud at −100', () => {
    let r: Record<string, number> = { [pairKey('a', 'b')]: -90 };
    const res = addFriction(r, 'a', 'b', 20, false);
    expect(getRapport(res.rapport, 'a', 'b')).toBe(-100);
    expect(res.forged?.kind).toBe('feud');
  });

  it('does not re-forge when already feuding', () => {
    const res = addFriction({ [pairKey('a', 'b')]: -100 }, 'a', 'b', 20, true);
    expect(res.forged).toBeNull();
  });
});

describe('reconcilePair (化解宿怨)', () => {
  const feud = (a: string, b: string): OathBond =>
    ({ officerA: a, officerB: b, floor: 0, kind: 'feud', label: 'feud', depth: 1, sharedSeasons: 0 });

  it('raises rapport but keeps the feud while still deep', () => {
    const r = { [pairKey('a', 'b')]: -100 };
    const res = reconcilePair(r, [feud('a', 'b')], 'a', 'b', 20); // → −80, still < mend threshold
    expect(getRapport(res.rapport, 'a', 'b')).toBe(-80);
    expect(res.dissolved).toBe(false);
    expect(res.runtimeBonds.some((b) => b.kind === 'feud')).toBe(true);
  });

  it('dissolves the feud once rapport recovers past the mend threshold', () => {
    const r = { [pairKey('a', 'b')]: -100 };
    const res = reconcilePair(r, [feud('a', 'b')], 'a', 'b', 60); // → −40 ≥ −50
    expect(getRapport(res.rapport, 'a', 'b')).toBeGreaterThanOrEqual(FEUD_MEND_THRESHOLD);
    expect(res.dissolved).toBe(true);
    expect(res.runtimeBonds.some((b) => b.kind === 'feud')).toBe(false);
  });
});
