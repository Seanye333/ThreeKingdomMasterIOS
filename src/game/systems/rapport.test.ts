import { describe, it, expect } from 'vitest';
import { addRapport, getRapport, mingleRapport, growRapportFromProximity, RAPPORT_BOND_THRESHOLD } from './rapport';
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
});
