/** §8.2-deep — 地動 & 賑災 queueing in the seasonal disaster roll. */
import { describe, expect, it } from 'vitest';
import type { Building, City } from '../types';
import { rollEvents, rollGreatPlague, reliefFoodCost } from './events';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wei', troops: 6000, gold: 1000, food: 20000,
    loyalty: 60, population: 80_000, agriculture: 0, commerce: 50, defense: 50,
    adjacentCityIds: [], name: { zh: over.id, en: over.id }, terrain: 'plain',
    ...over,
  } as unknown as City);

/** rng sequence helper — pops values in order, then keeps returning the last. */
const seq = (...vals: number[]) => {
  let i = 0;
  return () => vals[Math.min(i++, vals.length - 1)];
};

describe('rollEvents — 地動', () => {
  it('an earthquake cracks walls, panics the people and topples works', () => {
    const buildings: Building[] = [
      { id: 'market', cityId: 'a', level: 2 } as Building,
      { id: 'wall', cityId: 'a', level: 1 } as Building,
    ];
    // rolls: rebellion? (loyalty 60 → skipped), harvest (agri 0 → skipped),
    // flood gate (season spring → skipped), quake roll (0.0001 → hits), then
    // quake magnitude/topple rolls, famine/plague misses, talent miss.
    const out = rollEvents({
      season: 'spring',
      cities: { a: mkCity({ id: 'a' }) },
      officers: {},
      buildings,
      rng: seq(0.0001, 0.5, 0.4, 0.5, 0.99, 0.99, 0.99),
      playerForceId: 'player',
    });
    expect(out.entries.some((e) => e.kind === 'quake')).toBe(true);
    expect(out.cities.a.defense).toBeLessThan(50);
    expect(out.cities.a.loyalty).toBeLessThan(60);
    expect(out.buildingLevelDrops.length).toBeGreaterThan(0);
  });

  it('靈台 shields the loyalty hit (physical loss stands)', () => {
    const withTerrace = rollEvents({
      season: 'spring',
      cities: { a: mkCity({ id: 'a' }) },
      officers: {},
      buildings: [{ id: 'lingtai', cityId: 'a', level: 3 } as Building],
      rng: seq(0.0001, 0.5, 0.4, 0.5, 0.99, 0.99, 0.99),
      playerForceId: 'wei', // the owner — player path: no AI self-relief muddies the shield
    });
    const bare = rollEvents({
      season: 'spring',
      cities: { a: mkCity({ id: 'a' }) },
      officers: {},
      // third roll ≥0.6 so the AI does NOT self-relieve — clean comparison.
      rng: seq(0.0001, 0.5, 0.9, 0.99, 0.99, 0.99),
    });
    const shielded = withTerrace.cities.a.loyalty;
    const unshielded = bare.cities.a.loyalty;
    expect(shielded).toBeGreaterThan(unshielded);
  });
});

describe('rollEvents — 賑災 queue', () => {
  it('a famine in a PLAYER city queues a relief prompt (loyalty already hit)', () => {
    // rolls: rebellion skip (loyalty ok), flood skip (spring), quake miss (0.9),
    // famine roll 0.001 → hits.
    const out = rollEvents({
      season: 'spring',
      cities: { a: mkCity({ id: 'a', ownerForceId: 'player' }) },
      officers: {},
      rng: seq(0.9, 0.001, 0.99, 0.99),
      playerForceId: 'player',
    });
    expect(out.entries.some((e) => e.kind === 'famine')).toBe(true);
    expect(out.reliefPrompts).toEqual([{ cityId: 'a', kind: 'famine' }]);
    expect(out.cities.a.loyalty).toBe(55);
  });

  it('a provisioned AI court self-relieves at a price in food', () => {
    // Same rolls; AI relief roll (0.1 < 0.6) succeeds.
    const out = rollEvents({
      season: 'spring',
      cities: { a: mkCity({ id: 'a', ownerForceId: 'wei', food: 50_000 }) },
      officers: {},
      rng: seq(0.9, 0.001, 0.1, 0.99, 0.99),
      playerForceId: 'player',
    });
    expect(out.reliefPrompts).toHaveLength(0);
    // Half the loyalty hit (−2 instead of −5), food spent beyond the famine loss.
    expect(out.cities.a.loyalty).toBe(58);
  });
});

describe('reliefFoodCost', () => {
  it('scales with mouths to feed, floor 500', () => {
    expect(reliefFoodCost(mkCity({ id: 'a', population: 200_000 }))).toBe(5000);
    expect(reliefFoodCost(mkCity({ id: 'b', population: 10_000 }))).toBe(500);
  });
});

describe('§8.2-deep 大災之後必有大疫', () => {
  it('a struck city carries 3× plague odds the next season', () => {
    // quake miss (0.9), famine skip (food 0 → no roll), plague roll 0.02:
    // bare odds 0.01 → no outbreak; with plague-risk ×3 (0.03) → outbreak.
    const mk = () => mkCity({ id: 'a', food: 0, population: 90_000 });
    const calm = rollEvents({
      season: 'spring', cities: { a: mk() }, officers: {},
      rng: seq(0.9, 0.02, 0.99, 0.99),
    });
    const risky = rollEvents({
      season: 'spring', cities: { a: mk() }, officers: {},
      rng: seq(0.9, 0.02, 0.99, 0.99),
      plagueRiskCityIds: ['a'],
    });
    expect(calm.entries.some((e) => e.kind === 'plague')).toBe(false);
    expect(risky.entries.some((e) => e.kind === 'plague')).toBe(true);
  });

  it('flood/famine/quake mark the city as struck (plague itself does not)', () => {
    const out = rollEvents({
      season: 'spring', cities: { a: mkCity({ id: 'a', ownerForceId: 'player' }) }, officers: {},
      rng: seq(0.9, 0.001, 0.99, 0.99), // quake miss, famine hits
      playerForceId: 'player',
    });
    expect(out.struckCityIds).toContain('a');
  });
});

describe('§8.2-deep 建安大疫(217 冬)', () => {
  const officers = {
    'wang-can': { id: 'wang-can', name: { zh: '王粲', en: 'Wang Can' }, status: 'idle', forceId: 'wei', stats: { leadership: 40, war: 20, intelligence: 85, politics: 80, charisma: 75 } } as never,
  };

  it('sweeps every city and takes the Jian\'an masters', () => {
    const out = rollGreatPlague({
      cities: { a: mkCity({ id: 'a' }), b: mkCity({ id: 'b' }) },
      officers,
      date: { year: 217, season: 'winter' },
      eventFlags: {},
      rng: () => 0.5,
    });
    expect(out.flagSet).toBe(true);
    expect(out.cities.a.population).toBeLessThan(80_000);
    expect(out.cities.b.loyalty).toBe(56);
    expect(out.officers['wang-can'].status).toBe('dead');
    expect(out.entries[0].textZh).toContain('大疫');
  });

  it('fires only in winter 217, and only once', () => {
    const base = { cities: { a: mkCity({ id: 'a' }) }, officers, rng: () => 0.5 };
    expect(rollGreatPlague({ ...base, date: { year: 217, season: 'summer' }, eventFlags: {} }).flagSet).toBe(false);
    expect(rollGreatPlague({ ...base, date: { year: 216, season: 'winter' }, eventFlags: {} }).flagSet).toBe(false);
    expect(rollGreatPlague({ ...base, date: { year: 217, season: 'winter' }, eventFlags: { 'jianan-plague': true } }).flagSet).toBe(false);
  });

  it('醫館 blunts the toll', () => {
    const out = rollGreatPlague({
      cities: { a: mkCity({ id: 'a' }) },
      officers: {},
      date: { year: 217, season: 'winter' },
      buildings: [{ id: 'infirmary', cityId: 'a', level: 3 } as never],
      eventFlags: {},
      rng: () => 0.5,
    });
    const bare = rollGreatPlague({
      cities: { a: mkCity({ id: 'a' }) },
      officers: {},
      date: { year: 217, season: 'winter' },
      eventFlags: {},
      rng: () => 0.5,
    });
    expect(out.cities.a.population).toBeGreaterThan(bare.cities.a.population);
  });
});
