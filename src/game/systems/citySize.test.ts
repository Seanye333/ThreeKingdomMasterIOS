import { describe, it, expect } from 'vitest';
import type { City, Force } from '../types';
import {
  citySize,
  cityMeetsSize,
  cityCarryingCapacity,
  populationDelta,
  reassignLostCapitals,
} from './citySize';

function mkCity(over: Partial<City> = {}): City {
  return {
    id: 'c1',
    name: { zh: '城', en: 'City' },
    coords: { x: 0, y: 0 },
    adjacentCityIds: [],
    ownerForceId: 'f1',
    population: 100000,
    gold: 0,
    food: 0,
    troops: 0,
    agriculture: 50,
    commerce: 50,
    defense: 50,
    loyalty: 90,
    ...over,
  };
}

function mkForce(over: Partial<Force> = {}): Force {
  return {
    id: 'f1',
    name: { zh: '勢', en: 'Force' },
    rulerOfficerId: 'r1',
    capitalCityId: 'c1',
    color: '#fff',
    isPlayer: false,
    ...over,
  };
}

describe('citySize tiers', () => {
  it('derives tier from population', () => {
    expect(citySize(mkCity({ population: 10000 })).id).toBe('hamlet');
    expect(citySize(mkCity({ population: 50000 })).id).toBe('town');
    expect(citySize(mkCity({ population: 100000 })).id).toBe('city');
    expect(citySize(mkCity({ population: 200000 })).id).toBe('large');
    expect(citySize(mkCity({ population: 300000 })).id).toBe('capital');
  });

  it('cityMeetsSize compares rank inclusively', () => {
    const c = mkCity({ population: 200000 }); // large
    expect(cityMeetsSize(c, 'city')).toBe(true);
    expect(cityMeetsSize(c, 'large')).toBe(true);
    expect(cityMeetsSize(c, 'capital')).toBe(false);
  });
});

describe('carrying capacity', () => {
  it('scales with agriculture and is tier-consistent (都 reachable, but not runaway)', () => {
    const lowFarm = cityCarryingCapacity(mkCity({ agriculture: 10 }));
    const richFarm = cityCarryingCapacity(mkCity({ agriculture: 200 }));
    expect(richFarm).toBeGreaterThan(lowFarm);
    // Heavy farming (農業 ~170) clears the 都 threshold (280k)…
    expect(cityCarryingCapacity(mkCity({ agriculture: 170 }))).toBeGreaterThan(280000);
    // …but even a maxed agricultural metropolis stays believable (< 1M).
    expect(cityCarryingCapacity(mkCity({ agriculture: 320 }), 0.05)).toBeLessThan(1_000_000);
  });

  it('civic works raise the ceiling', () => {
    const plain = cityCarryingCapacity(mkCity({ agriculture: 40 }), 0);
    const civic = cityCarryingCapacity(mkCity({ agriculture: 40 }), 0.03);
    expect(civic).toBeGreaterThan(plain);
  });
});

describe('populationDelta carrying-capacity damping', () => {
  it('grows toward the ceiling but tapers near it', () => {
    const farms = 40;
    const cap = cityCarryingCapacity(mkCity({ agriculture: farms }));
    const early = populationDelta(mkCity({ agriculture: farms, population: Math.floor(cap * 0.3), loyalty: 90 }), 99999);
    const nearCap = populationDelta(mkCity({ agriculture: farms, population: Math.floor(cap * 0.95), loyalty: 90 }), 99999);
    expect(early).toBeGreaterThan(0);
    expect(nearCap).toBeGreaterThan(0);
    expect(nearCap).toBeLessThan(early); // damped near the ceiling
  });

  it('emigration pulls an over-capacity city back down', () => {
    const cap = cityCarryingCapacity(mkCity({ agriculture: 20 }));
    const over = populationDelta(mkCity({ agriculture: 20, population: Math.floor(cap * 1.3), loyalty: 90 }), 99999);
    expect(over).toBeLessThan(0);
  });

  it('famine still shrinks regardless of headroom', () => {
    const d = populationDelta(mkCity({ population: 10000, loyalty: 10, agriculture: 80 }), -999999);
    expect(d).toBeLessThan(0);
  });
});

describe('balance — population convergence (no runaway)', () => {
  it('a thriving city converges toward its ceiling without blowing past it', () => {
    const farms = 50;
    const cap = cityCarryingCapacity(mkCity({ agriculture: farms }));
    let pop = 40000;
    for (let i = 0; i < 400; i++) {
      const d = populationDelta(mkCity({ agriculture: farms, population: pop, loyalty: 90 }), 10_000_000);
      pop = Math.max(1000, pop + d);
    }
    // Settles just under the ceiling; never runs away above it.
    expect(pop).toBeGreaterThan(cap * 0.9);
    expect(pop).toBeLessThanOrEqual(cap * 1.02);
  });

  it('an over-stuffed city drains back toward the ceiling', () => {
    const farms = 30;
    const cap = cityCarryingCapacity(mkCity({ agriculture: farms }));
    let pop = Math.floor(cap * 1.5);
    for (let i = 0; i < 400; i++) {
      const d = populationDelta(mkCity({ agriculture: farms, population: pop, loyalty: 90 }), 10_000_000);
      pop = Math.max(1000, pop + d);
    }
    expect(pop).toBeLessThanOrEqual(cap * 1.05);
  });
});

describe('reassignLostCapitals', () => {
  it('relocates the seat to the largest surviving city when the capital is lost', () => {
    const forces = { f1: mkForce({ capitalCityId: 'cap' }) };
    const cities: Record<string, City> = {
      cap: mkCity({ id: 'cap', ownerForceId: 'enemy', population: 200000 }),
      a: mkCity({ id: 'a', ownerForceId: 'f1', population: 90000 }),
      b: mkCity({ id: 'b', ownerForceId: 'f1', population: 150000 }),
    };
    const out = reassignLostCapitals(forces, cities);
    expect(out.forces.f1.capitalCityId).toBe('b'); // largest owned
    expect(out.lost).toHaveLength(1);
    expect(out.lost[0]).toMatchObject({ forceId: 'f1', oldCapitalId: 'cap', newCapitalId: 'b' });
  });

  it('leaves a held capital untouched', () => {
    const forces = { f1: mkForce({ capitalCityId: 'cap' }) };
    const cities: Record<string, City> = {
      cap: mkCity({ id: 'cap', ownerForceId: 'f1' }),
    };
    const out = reassignLostCapitals(forces, cities);
    expect(out.forces).toBe(forces); // unchanged reference
    expect(out.lost).toHaveLength(0);
  });

  it('does not relocate an eliminated (city-less) force', () => {
    const forces = { f1: mkForce({ capitalCityId: 'cap' }) };
    const cities: Record<string, City> = {
      cap: mkCity({ id: 'cap', ownerForceId: 'enemy' }),
    };
    const out = reassignLostCapitals(forces, cities);
    expect(out.forces.f1.capitalCityId).toBe('cap');
    expect(out.lost).toHaveLength(0);
  });
});
