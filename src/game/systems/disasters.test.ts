/** 防災工程 — locks the mitigation math on the disaster rolls. */
import { describe, expect, it } from 'vitest';
import type { Building, City } from '../types';
import { rollEvents } from './events';

const mkCity = (over: Partial<City> = {}): City =>
  ({
    id: 'ye', name: { zh: '鄴', en: 'Ye' }, ownerForceId: 'wei',
    population: 100_000, troops: 8000, gold: 2000, food: 40_000,
    loyalty: 70, agriculture: 50, commerce: 40, defense: 60,
    adjacentCityIds: [],
    ...over,
  } as City);

const works = (id: Building['id'], level: number): Building =>
  ({ id, cityId: 'ye', level, progress: 0 } as Building);

/** rng fed from a queue — exhausted queue returns 0.99 (nothing fires). */
const rngFrom = (vals: number[]) => () => vals.shift() ?? 0.99;

describe('flood vs levee', () => {
  it('summer flood washes food and walls without a levee', () => {
    // roll order per city: rebellion? (loyalty ok → skipped), harvest? (not autumn), flood roll.
    const out = rollEvents({
      season: 'summer', cities: { ye: mkCity() }, officers: {}, rng: rngFrom([0.001]),
    });
    expect(out.entries.some((e) => e.kind === 'flood')).toBe(true);
    expect(out.cities.ye.food).toBeLessThan(40_000);
    expect(out.cities.ye.defense).toBe(52);
  });

  it('a level-3 levee stops the river cold', () => {
    const out = rollEvents({
      season: 'summer', cities: { ye: mkCity() }, officers: {},
      buildings: [works('levee', 3)], rng: rngFrom([0.0001]),
    });
    expect(out.entries.some((e) => e.kind === 'flood')).toBe(false);
  });
});

describe('famine vs granary / plague vs infirmary', () => {
  it('granary blunts the famine loss', () => {
    // First roll = the §8.2-deep 地動 gate (0.9 → no quake), then the famine roll.
    const bare = rollEvents({
      season: 'spring', cities: { ye: mkCity() }, officers: {}, rng: rngFrom([0.9, 0.001]),
    });
    const insured = rollEvents({
      season: 'spring', cities: { ye: mkCity() }, officers: {},
      buildings: [works('granary', 3)], rng: rngFrom([0.9, 0.001]),
    });
    const bareLoss = 40_000 - bare.cities.ye.food;
    const insuredLoss = 40_000 - insured.cities.ye.food;
    expect(bare.entries.some((e) => e.kind === 'famine')).toBe(true);
    expect(insuredLoss).toBeLessThan(bareLoss);
  });

  it('infirmary reduces plague odds enough to skip a marginal outbreak', () => {
    // 0.009 < PLAGUE_CHANCE 0.01 fires bare; with L3 infirmary the
    // threshold drops to 0.0025 and the same roll passes safely.
    const mk = () => mkCity({ food: 0 }); // famine roll consumes nothing when food=0
    // First roll = the §8.2-deep 地動 gate (0.9 → no quake), then the plague roll.
    const bare = rollEvents({
      season: 'spring', cities: { ye: mk() }, officers: {}, rng: rngFrom([0.9, 0.009]),
    });
    const treated = rollEvents({
      season: 'spring', cities: { ye: mk() }, officers: {},
      buildings: [works('infirmary', 3)], rng: rngFrom([0.9, 0.009]),
    });
    expect(bare.entries.some((e) => e.kind === 'plague')).toBe(true);
    expect(treated.entries.some((e) => e.kind === 'plague')).toBe(false);
  });
});
