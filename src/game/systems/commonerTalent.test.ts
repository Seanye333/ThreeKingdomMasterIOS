/** 求賢令出寒門 — locks the commoner generator. */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import { commonerArrivalCity, generateCommonerOfficer } from './commonerTalent';

const seq = (vals: number[]) => () => vals.shift() ?? 0.5;

describe('generateCommonerOfficer', () => {
  it('produces a valid, loyal officer with a fresh id', () => {
    const o = generateCommonerOfficer({
      year: 200, forceId: 'cao', cityId: 'xuchang',
      takenIds: new Set(), rng: seq([0, 0, 0.5, 0.99, 0.5, 0.99, 0.5, 0.99, 0.5, 0.99, 0.5, 0.99, 0.5]),
    });
    expect(o.id.startsWith('commoner-')).toBe(true);
    expect(o.forceId).toBe('cao');
    expect(o.locationCityId).toBe('xuchang');
    expect(o.loyalty).toBe(80);
    expect(o.birthYear).toBeLessThan(200 - 17);
    for (const v of Object.values(o.stats)) expect(v).toBeGreaterThanOrEqual(30);
  });

  it('never reuses a taken id', () => {
    const taken = new Set(['commoner-li-ping']);
    const o = generateCommonerOfficer({
      year: 200, forceId: 'cao', cityId: 'xuchang', takenIds: taken, rng: seq([0, 0]),
    });
    expect(o.id).toBe('commoner-li-ping-2');
  });
});

describe('commonerArrivalCity', () => {
  it('picks among the force cities, or null when landless', () => {
    const cities: Record<string, City> = {
      a: { id: 'a', ownerForceId: 'cao' } as City,
      b: { id: 'b', ownerForceId: 'wu' } as City,
    };
    expect(commonerArrivalCity(cities, 'cao', () => 0)?.id).toBe('a');
    expect(commonerArrivalCity(cities, 'shu', () => 0)).toBeNull();
  });
});
