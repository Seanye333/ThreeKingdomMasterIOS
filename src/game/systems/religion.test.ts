/** 流民四起 — cult faith contagion to neighbouring cities. */
import { describe, expect, it } from 'vitest';
import type { City, Force, Officer } from '../types';
import {
  spreadCultUnrest,
  isCultForce,
  cultPacifyChance,
  resolveCultPacify,
  rollYellowTurbanRising,
  YELLOW_TURBAN_FLAG,
} from './religion';

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

describe('§8.4-deep 招安歸正', () => {
  const mkEnvoy = (charisma: number): Officer =>
    ({ id: 'env', name: { zh: '使', en: 'Envoy' }, forceId: 'player', status: 'idle',
       stats: { leadership: 50, war: 40, intelligence: 70, politics: 70, charisma } } as unknown as Officer);
  const cult = forces['cult-taiping-z-184-spring'];

  it('odds rise with charisma and legitimacy, fall with a sprawling sect', () => {
    const small = cultPacifyChance({ envoyCharisma: 90, cultCityCount: 1, cultTroops: 5000, mandate: 70 });
    const big = cultPacifyChance({ envoyCharisma: 90, cultCityCount: 3, cultTroops: 20000, mandate: 40 });
    expect(small).toBeGreaterThan(big);
    expect(small).toBeLessThanOrEqual(0.85);
    expect(big).toBeGreaterThanOrEqual(0.05);
  });

  it('a silver tongue brings the sect over (張魯模式)', () => {
    const r = resolveCultPacify({
      cultForce: cult, envoy: mkEnvoy(95), cultCityCount: 1, cultTroops: 4000, mandate: 70, rng: () => 0.01,
    });
    expect(r.success).toBe(true);
    expect(r.messageZh).toContain('開城歸命');
  });

  it('a botched embassy hardens the sect and may cost the envoy', () => {
    const r = resolveCultPacify({
      cultForce: cult, envoy: mkEnvoy(30), cultCityCount: 3, cultTroops: 30000, mandate: 20, rng: () => 0.99,
    });
    expect(r.success).toBe(false);
    expect(r.envoySeized).toBe(false); // second roll 0.99 ≥ 0.25 — walks free
  });
});

describe('§8.4-deep 宣撫使', () => {
  it('a posted envoy blunts the contagion and holds the city back from rising', () => {
    const envoy = { id: 'env', name: { zh: '使', en: 'E' }, forceId: 'wei', status: 'active',
      stats: { leadership: 50, war: 40, intelligence: 70, politics: 70, charisma: 90 } } as unknown as Officer;
    const mk = () => ({
      z: mkCity({ id: 'z', ownerForceId: 'cult-taiping-z-184-spring', adjacentCityIds: ['a'] }),
      a: mkCity({ id: 'a', ownerForceId: 'wei', adjacentCityIds: ['z'], loyalty: 23, population: 90_000 }),
    });
    const guarded = spreadCultUnrest({
      cities: mk(), forces, officers: { env: envoy }, date: { year: 185, season: 'summer' }, rng: () => 0.1,
      pacifyMissions: { env: { cityId: 'a', seasonsLeft: 2 } },
    });
    // The pacified city neither flips nor bleeds at the bare rate.
    expect(guarded.cities.a.ownerForceId).toBe('wei');
    const bare = spreadCultUnrest({
      cities: mk(), forces, officers: {}, date: { year: 185, season: 'summer' }, rng: () => 0.99,
    });
    expect(guarded.cities.a.loyalty).toBeGreaterThanOrEqual(bare.cities.a.loyalty);
  });
});

describe('§8.4-deep 黃巾總爆發', () => {
  const mkOfficerYT = (id: string): Officer =>
    ({ id, name: { zh: id, en: id }, forceId: null, status: 'unsearched', locationCityId: null,
       stats: { leadership: 70, war: 60, intelligence: 80, politics: 60, charisma: 90 },
       task: null, equipment: [], skills: [], rank: 'general', loyalty: 0, birthYear: 145 } as unknown as Officer);

  const bigRestless = (id: string, loyalty: number) =>
    mkCity({ id, ownerForceId: 'wei', population: 100_000, loyalty });

  it('spring 184: the Way of Great Peace rises in several cities under 張角', () => {
    const out = rollYellowTurbanRising({
      cities: { a: bigRestless('a', 40), b: bigRestless('b', 45), c: bigRestless('c', 50), d: bigRestless('d', 55), e: bigRestless('e', 69) },
      forces, officers: { 'zhang-jiao': mkOfficerYT('zhang-jiao'), 'zhang-bao-yt': mkOfficerYT('zhang-bao-yt') },
      date: { year: 184, season: 'spring' }, rng: () => 0.5, eventFlags: {},
    });
    expect(out.flagSet).toBe(true);
    const risen = Object.values(out.cities).filter((c) => c.ownerForceId === 'cult-taiping-184');
    expect(risen.length).toBe(4); // capped at four
    expect(out.officers['zhang-jiao'].forceId).toBe('cult-taiping-184');
    expect(out.forces['cult-taiping-184'].rulerOfficerId).toBe('zhang-jiao');
  });

  it('fires once, and never outside 184', () => {
    const base = {
      cities: { a: bigRestless('a', 40) }, forces, officers: {},
      rng: () => 0.5,
    };
    expect(rollYellowTurbanRising({ ...base, date: { year: 190, season: 'spring' }, eventFlags: {} }).flagSet).toBe(false);
    expect(rollYellowTurbanRising({ ...base, date: { year: 184, season: 'spring' }, eventFlags: { [YELLOW_TURBAN_FLAG]: true } }).flagSet).toBe(false);
  });
});
