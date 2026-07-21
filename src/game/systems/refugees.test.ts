import { describe, it, expect } from 'vitest';
import type { City } from '../types';
import { settleRefugees, refugeePolicyEffects, aiRefugeePolicy } from './refugees';

function mkCity(over: Partial<City> = {}): City {
  return {
    id: 'c1',
    name: { zh: '城', en: 'City' },
    coords: { x: 0, y: 0 },
    adjacentCityIds: [],
    ownerForceId: 'f1',
    population: 50000,
    gold: 0,
    food: 0,
    troops: 0,
    agriculture: 50, // capacity ≈ 340k → lots of headroom
    commerce: 50,
    defense: 50,
    loyalty: 90,
    ...over,
  };
}

describe('settleRefugees', () => {
  it('returns the pool untouched when empty', () => {
    const r = settleRefugees({ pool: 0, cities: { c1: mkCity() }, buildings: [] });
    expect(r.pool).toBe(0);
    expect(r.settled).toHaveLength(0);
  });

  it('settles part of the pool into a welcoming city; the rest carries over (decayed)', () => {
    const r = settleRefugees({ pool: 10000, cities: { c1: mkCity() }, buildings: [] });
    expect(r.settled).toHaveLength(1);
    expect(r.settled[0].cityId).toBe('c1');
    // Half of 10000 settles; the un-settled remainder carries over minus attrition.
    expect(r.settled[0].count).toBe(5000);
    expect(r.cities.c1.population).toBe(55000);
    expect(r.pool).toBe(Math.floor(5000 * 0.85)); // 4250
  });

  it('skips restive cities (loyalty < 50) but the pool still attrits', () => {
    const r = settleRefugees({ pool: 10000, cities: { c1: mkCity({ loyalty: 30 }) }, buildings: [] });
    expect(r.settled).toHaveLength(0);
    expect(r.pool).toBe(Math.floor(10000 * 0.85)); // nothing settled, but attrition applies
  });

  it('skips ruined and unowned cities', () => {
    const cities = {
      a: mkCity({ id: 'a', ruined: true }),
      b: mkCity({ id: 'b', ownerForceId: null }),
    };
    const r = settleRefugees({ pool: 10000, cities, buildings: [] });
    expect(r.settled).toHaveLength(0);
  });

  it('does not overfill a city past its carrying capacity', () => {
    // Tiny farms → small capacity; a near-full city has little headroom.
    const city = mkCity({ agriculture: 1, population: 45000 }); // cap ≈ 46000
    const r = settleRefugees({ pool: 1_000_000, cities: { c1: city }, buildings: [] });
    expect(r.cities.c1.population).toBeLessThanOrEqual(46000);
  });

  it('balance — a steady refugee inflow stays bounded and never goes negative', () => {
    // Two roomy welcoming cities; every season 3000 new refugees arrive.
    let pool = 0;
    let cities: Record<string, City> = {
      a: mkCity({ id: 'a', ownerForceId: 'f1', agriculture: 80, population: 50000 }),
      b: mkCity({ id: 'b', ownerForceId: 'f1', agriculture: 80, population: 50000 }),
    };
    let max = 0;
    for (let i = 0; i < 200; i++) {
      pool += 3000;
      const r = settleRefugees({ pool, cities, buildings: [], taxPolicy: { f1: 'light' } });
      pool = r.pool;
      cities = r.cities;
      expect(pool).toBeGreaterThanOrEqual(0);
      max = Math.max(max, pool);
    }
    // The pool drains as fast as it fills — it never balloons unboundedly.
    expect(max).toBeLessThan(30000);
  });

  it('favours the more welcoming city when both compete', () => {
    const cities = {
      light: mkCity({ id: 'light', ownerForceId: 'f1', loyalty: 100 }),
      heavy: mkCity({ id: 'heavy', ownerForceId: 'f2', loyalty: 60 }),
    };
    const r = settleRefugees({
      pool: 20000,
      cities,
      buildings: [],
      taxPolicy: { f1: 'light', f2: 'heavy' },
    });
    const light = r.settled.find((s) => s.cityId === 'light')?.count ?? 0;
    const heavy = r.settled.find((s) => s.cityId === 'heavy')?.count ?? 0;
    expect(light).toBeGreaterThan(heavy);
  });
});

describe('流民之政 (§8.6)', () => {
  it('招撫 doubles the intake and charges for it', () => {
    const w = refugeePolicyEffects('welcome');
    expect(w.intakeMul).toBe(2);
    expect(w.loyaltyDelta).toBeLessThan(0);
    expect(w.plagueRisk).toBeGreaterThan(0);
  });

  it('閉關 takes none and pleases the locals', () => {
    const e = refugeePolicyEffects('expel');
    expect(e.intakeMul).toBe(0);
    expect(e.realmLoyaltyDelta).toBeGreaterThan(0);
  });

  it('安置 is the neutral default', () => {
    const s = refugeePolicyEffects(undefined);
    expect(s.intakeMul).toBe(1);
    expect(s.loyaltyDelta).toBe(0);
    expect(s.realmLoyaltyDelta).toBe(0);
  });

  it('AI lords choose by temperament', () => {
    expect(aiRefugeePolicy('benevolent')).toBe('welcome');
    expect(aiRefugeePolicy('tyrant')).toBe('expel');
    expect(aiRefugeePolicy('balanced')).toBe('settle');
  });
});
