import { describe, it, expect } from 'vitest';
import {
  addRapport, getRapport, mingleRapport, growRapportFromProximity, RAPPORT_BOND_THRESHOLD,
  RAPPORT_FEUD_THRESHOLD, clampRapport, decayRapport,
  getLordRapport, addLordRapport, isConfidant, decayLordRapport, CONFIDANT_THRESHOLD,
} from './rapport';
import { mkOfficer } from '../../test/factories';
import { pairKey } from '../types/diplomacy';

describe('rapport (好感 → 義結)', () => {
  it('accumulates and reads back symmetrically', () => {
    let r: Record<string, number> = {};
    r = addRapport(r, 'a', 'b', 30, false).rapport;
    r = addRapport(r, 'b', 'a', 20, false).rapport; // order-independent
    expect(getRapport(r, 'a', 'b')).toBe(50);
  });

  it('forges a bond once the threshold is reached', () => {
    const r = { [Object.keys(addRapport({}, 'a', 'b', 80, false).rapport)[0]]: 80 };
    const res = addRapport(r, 'a', 'b', 25, false);
    expect(getRapport(res.rapport, 'a', 'b')).toBe(RAPPORT_BOND_THRESHOLD); // capped
    expect(res.forged).not.toBeNull();
    expect([res.forged!.officerA, res.forged!.officerB].sort()).toEqual(['a', 'b']);
  });

  it('does not forge when already bonded', () => {
    const res = addRapport({}, 'a', 'b', 100, true);
    expect(res.forged).toBeNull();
  });

  it('mingle raises every pair at a gathering', () => {
    const r = mingleRapport({}, ['a', 'b', 'c'], 10);
    expect(getRapport(r, 'a', 'b')).toBe(10);
    expect(getRapport(r, 'a', 'c')).toBe(10);
    expect(getRapport(r, 'b', 'c')).toBe(10);
  });
});

describe('organic rapport (同袍之誼)', () => {
  const at = (id: string, forceId: string, cityId: string | null, over = {}) =>
    mkOfficer({ id, forceId, locationCityId: cityId, status: 'idle', ...over });

  it('warms only same-force officers sharing a city', () => {
    const officers = {
      a: at('a', 'F', 'c1'), b: at('b', 'F', 'c1'),     // together → warm
      c: at('c', 'F', 'c2'),                            // elsewhere
      d: at('d', 'G', 'c1'),                            // enemy in the same city
    };
    const out = growRapportFromProximity({ rapport: {}, officers, bondedPairs: new Set(), amount: 3 });
    expect(getRapport(out.rapport, 'a', 'b')).toBe(3);
    expect(getRapport(out.rapport, 'a', 'c')).toBe(0); // different city
    expect(getRapport(out.rapport, 'a', 'd')).toBe(0); // different force
  });

  it('forges a bond when a co-serving pair crosses the threshold', () => {
    const officers = { a: at('a', 'F', 'c1'), b: at('b', 'F', 'c1') };
    const seeded = { [pairKey('a', 'b')]: 99 };
    const out = growRapportFromProximity({ rapport: seeded, officers, bondedPairs: new Set(), amount: 2 });
    expect(getRapport(out.rapport, 'a', 'b')).toBe(RAPPORT_BOND_THRESHOLD);
    expect(out.forged).toHaveLength(1);
    expect(out.forged[0].kind).toBe('oath');
  });

  it('does not re-forge an already-bonded pair', () => {
    const officers = { a: at('a', 'F', 'c1'), b: at('b', 'F', 'c1') };
    const seeded = { [pairKey('a', 'b')]: 99 };
    const out = growRapportFromProximity({ rapport: seeded, officers, bondedPairs: new Set([pairKey('a', 'b')]), amount: 5 });
    expect(out.forged).toHaveLength(0);
  });

  it('skips dead / imprisoned / unplaced officers', () => {
    const officers = {
      a: at('a', 'F', 'c1'),
      b: at('b', 'F', 'c1', { status: 'dead' }),
      c: at('c', 'F', null), // no city
    };
    const out = growRapportFromProximity({ rapport: {}, officers, bondedPairs: new Set(), amount: 3 });
    expect(Object.keys(out.rapport)).toHaveLength(0);
  });

  it('leaves bonded/feuding pairs untouched (locked at their pole)', () => {
    const officers = { a: at('a', 'F', 'c1'), b: at('b', 'F', 'c1') };
    const seeded = { [pairKey('a', 'b')]: -100 }; // a feud — must not warm
    const out = growRapportFromProximity({ rapport: seeded, officers, bondedPairs: new Set([pairKey('a', 'b')]), amount: 5 });
    expect(getRapport(out.rapport, 'a', 'b')).toBe(-100);
  });
});

describe('bipolar rapport (好感 / 嫌隙)', () => {
  it('clamps to ±100', () => {
    expect(clampRapport(250)).toBe(100);
    expect(clampRapport(-250)).toBe(-100);
    expect(clampRapport(40)).toBe(40);
  });

  it('addRapport can drive a pair negative and clamps at the feud floor', () => {
    let r: Record<string, number> = {};
    r = addRapport(r, 'a', 'b', -60, false).rapport;
    r = addRapport(r, 'a', 'b', -80, false).rapport;
    expect(getRapport(r, 'a', 'b')).toBe(RAPPORT_FEUD_THRESHOLD); // −100, capped
  });
});

describe('rapport decay (好感維繫)', () => {
  const at = (id: string, forceId: string, cityId: string | null, over = {}) =>
    mkOfficer({ id, forceId, locationCityId: cityId, status: 'idle', ...over });

  it('cools out-of-contact pairs toward 0 and drops zeroed entries', () => {
    const officers = { a: at('a', 'F', 'c1'), b: at('b', 'F', 'c2') }; // different cities
    const seeded = { [pairKey('a', 'b')]: 3, [pairKey('a', 'x')]: -1 };
    const out = decayRapport({ rapport: seeded, officers, bondedPairs: new Set(), amount: 1 });
    expect(getRapport(out, 'a', 'b')).toBe(2);
    expect(out[pairKey('a', 'x')]).toBeUndefined(); // −1 → 0 → dropped
  });

  it('never decays co-located or bonded pairs', () => {
    const officers = { a: at('a', 'F', 'c1'), b: at('b', 'F', 'c1'), c: at('c', 'F', 'c2') };
    const seeded = { [pairKey('a', 'b')]: 40, [pairKey('a', 'c')]: 40 };
    const out = decayRapport({ rapport: seeded, officers, bondedPairs: new Set([pairKey('a', 'c')]), amount: 5 });
    expect(getRapport(out, 'a', 'b')).toBe(40); // co-located → untouched
    expect(getRapport(out, 'a', 'c')).toBe(40); // bonded → untouched even apart
  });
});

describe('君臣好感 (lord rapport)', () => {
  it('accumulates, clamps and reads back', () => {
    let lr: Record<string, number> = {};
    lr = addLordRapport(lr, 'o1', 60);
    lr = addLordRapport(lr, 'o1', 60); // 120 → clamped 100
    expect(getLordRapport(lr, 'o1')).toBe(100);
    expect(getLordRapport(lr, 'o2')).toBe(0);
  });

  it('marks a confidant at the threshold', () => {
    const lr = addLordRapport({}, 'o1', CONFIDANT_THRESHOLD);
    expect(isConfidant(lr, 'o1')).toBe(true);
    expect(isConfidant(addLordRapport({}, 'o2', CONFIDANT_THRESHOLD - 1), 'o2')).toBe(false);
  });

  it('decays toward 0 and drops the dead', () => {
    const officers = {
      o1: mkOfficer({ id: 'o1', status: 'idle' }),
      o2: mkOfficer({ id: 'o2', status: 'dead' }),
    };
    const out = decayLordRapport({ o1: 5, o2: 50 }, officers, 1);
    expect(out.o1).toBe(4);
    expect(out.o2).toBeUndefined(); // dead → dropped
  });
});
