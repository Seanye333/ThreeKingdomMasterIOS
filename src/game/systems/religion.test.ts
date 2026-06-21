/** 流民四起 — cult faith contagion to neighbouring cities. */
import { describe, expect, it } from 'vitest';
import type { City, Force } from '../types';
import { spreadCultUnrest, isCultForce } from './religion';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wei', troops: 6000, gold: 1000, food: 20000,
    loyalty: 60, population: 80_000, agriculture: 50, commerce: 50, defense: 50,
    adjacentCityIds: [], name: { zh: over.id, en: over.id }, terrain: 'plain',
    ...over,
  } as unknown as City);

const forces: Record<string, Force> = {
  wei: { id: 'wei', name: { zh: '魏', en: 'Wei' }, color: '#888', capitalCityId: 'a', rulerOfficerId: 'r', isPlayer: false } as Force,
  'cult-taiping-z-184-spring': { id: 'cult-taiping-z-184-spring', name: { zh: '太平道', en: 'Great Peace' }, color: '#88b7e8', capitalCityId: 'z', rulerOfficerId: 'm', isPlayer: false } as Force,
};

describe('isCultForce', () => {
  it('recognises cult banners by id', () => {
    expect(isCultForce('cult-taiping-z-184-spring')).toBe(true);
    expect(isCultForce('wei')).toBe(false);
    expect(isCultForce(null)).toBe(false);
  });
});

describe('spreadCultUnrest', () => {
  it('erodes loyalty in non-cult neighbours of a cult city', () => {
    const cities = {
      z: mkCity({ id: 'z', ownerForceId: 'cult-taiping-z-184-spring', adjacentCityIds: ['a'] }),
      a: mkCity({ id: 'a', ownerForceId: 'wei', adjacentCityIds: ['z'], loyalty: 60 }),
    };
    const out = spreadCultUnrest({ cities, forces, officers: {}, date: { year: 185, season: 'summer' }, rng: () => 0.99 });
    expect(out.cities.a.loyalty).toBeLessThan(60); // faith bled the neighbour
    expect(out.cities.a.ownerForceId).toBe('wei'); // but a content-ish city does not flip
  });

  it('a brink city adjacent to a cult can rise and join it', () => {
    let flipped = false;
    for (let i = 0; i < 50 && !flipped; i++) {
      const cities = {
        z: mkCity({ id: 'z', ownerForceId: 'cult-taiping-z-184-spring', adjacentCityIds: ['a'] }),
        a: mkCity({ id: 'a', ownerForceId: 'wei', adjacentCityIds: ['z'], loyalty: 23, population: 90_000 }),
      };
      const out = spreadCultUnrest({ cities, forces, officers: {}, date: { year: 185, season: 'summer' }, rng: () => 0.1 });
      if (out.cities.a.ownerForceId === 'cult-taiping-z-184-spring') flipped = true;
    }
    expect(flipped).toBe(true);
  });

  it('does nothing when there are no cults', () => {
    const cities = { a: mkCity({ id: 'a', ownerForceId: 'wei', loyalty: 30 }) };
    const out = spreadCultUnrest({ cities, forces, officers: {}, date: { year: 200, season: 'spring' }, rng: () => 0 });
    expect(out.cities.a.loyalty).toBe(30);
    expect(out.entries).toHaveLength(0);
  });
});
