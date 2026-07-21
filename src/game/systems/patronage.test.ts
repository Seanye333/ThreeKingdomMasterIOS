import { describe, it, expect } from 'vitest';
import {
  patronDrift, followsPatron, clientsOf, patronageReach,
  PATRON_SOUR, PATRON_CONTENT,
} from './patronage';
import type { EntityId, Officer } from '../types';

const off = (id: string, over: Partial<Officer> = {}): Officer => ({
  id, name: { zh: id, en: id }, forceId: 'f1', loyalty: 70,
  stats: { war: 60, leadership: 60, intelligence: 60, politics: 60, charisma: 60 },
  status: 'idle', locationCityId: 'c1', equipment: [],
  ...over,
} as unknown as Officer);

const corps = (...list: Officer[]): Record<EntityId, Officer> =>
  Object.fromEntries(list.map((o) => [o.id, o]));

describe('主辱臣憂', () => {
  it('an ordinary patron changes nothing', () => {
    expect(patronDrift({ patron: off('p', { loyalty: 65 }), client: off('c') })).toBe(0);
  });

  it('a disaffected patron sours his clients', () => {
    expect(patronDrift({ patron: off('p', { loyalty: PATRON_SOUR }), client: off('c') })).toBe(-1);
  });

  it('a content one steadies them', () => {
    expect(patronDrift({ patron: off('p', { loyalty: PATRON_CONTENT }), client: off('c') })).toBe(0.5);
  });

  it('a dead or departed patron pulls nothing', () => {
    expect(patronDrift({ patron: off('p', { loyalty: 10, status: 'dead' }), client: off('c') })).toBe(0);
    expect(patronDrift({ patron: off('p', { loyalty: 10, forceId: 'f2' }), client: off('c') })).toBe(0);
    expect(patronDrift({ patron: undefined, client: off('c') })).toBe(0);
  });

  it('never applies to himself', () => {
    const same = off('p', { loyalty: 10 });
    expect(patronDrift({ patron: same, client: same })).toBe(0);
  });
});

describe('故吏相隨', () => {
  it('obligation reaches further than discontent', () => {
    // 55 would never move an ordinary sympathiser (the bar there is 45).
    expect(followsPatron({ client: off('c', { loyalty: 55 }), sameCity: true })).toBe(true);
    expect(followsPatron({ client: off('c', { loyalty: 70 }), sameCity: true })).toBe(false);
  });

  it('a 忠義 client never moves', () => {
    expect(followsPatron({ client: off('c', { loyalty: 10 }), sameCity: true, steadfast: true })).toBe(false);
  });

  it('a client posted elsewhere cannot simply walk', () => {
    expect(followsPatron({ client: off('c', { loyalty: 10 }), sameCity: false })).toBe(false);
  });

  it('a captive or a corpse follows nobody', () => {
    expect(followsPatron({ client: off('c', { loyalty: 10, status: 'imprisoned' }), sameCity: true })).toBe(false);
    expect(followsPatron({ client: off('c', { loyalty: 10, status: 'dead' }), sameCity: true })).toBe(false);
  });
});

describe('門生故吏遍天下', () => {
  it('counts only the men he named', () => {
    const c = corps(
      off('yuan'), off('a', { patronId: 'yuan' }), off('b', { patronId: 'yuan' }),
      off('c', { patronId: 'other' }),
    );
    expect(clientsOf('yuan', c).map((o) => o.id)).toEqual(['a', 'b']);
  });

  it('reads the reach in words', () => {
    const none = corps(off('x'));
    expect(patronageReach('x', none).zh).toBe('未嘗舉士');
    const wide = corps(off('yuan'), ...['a', 'b', 'c', 'd', 'e'].map((i) => off(i, { patronId: 'yuan' })));
    expect(patronageReach('yuan', wide).zh).toBe('門生故吏遍天下');
    expect(patronageReach('yuan', wide).clients).toBe(5);
    expect(patronageReach('yuan', wide).sameForce).toBe(5);
  });

  it('counts clients who left the house separately', () => {
    const c = corps(off('yuan'), off('a', { patronId: 'yuan', forceId: 'f2' }), off('b', { patronId: 'yuan' }));
    const reach = patronageReach('yuan', c);
    expect(reach.clients).toBe(2);
    expect(reach.sameForce).toBe(1);
  });
});
