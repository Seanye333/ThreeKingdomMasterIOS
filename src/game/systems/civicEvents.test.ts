/** 內政事件 — stat-driven civic events fire and apply their effects. */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import { rollCivicEvents } from './civicEvents';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wei', troops: 4000, gold: 5000, food: 40000,
    loyalty: 70, agriculture: 60, commerce: 60, defense: 60, population: 200000,
    name: { zh: over.id, en: over.id },
    ...over,
  } as unknown as City);

const cityMap = (c: City) => ({ [c.id]: c });

describe('貪腐醜聞 — a graft scandal in a corruption-ridden city', () => {
  it('absconds with gold and craters loyalty when corruption is high', () => {
    const c = mkCity({ id: 'x', corruption: 80, gold: 5000, loyalty: 70 });
    const out = rollCivicEvents({ cities: cityMap(c), season: 'spring', rng: () => 0 });
    const after = out.cities['x'];
    expect(out.entries).toHaveLength(1);
    expect(after.gold).toBeLessThan(5000);
    expect(after.loyalty).toBeLessThan(70);
    expect(after.corruption!).toBeLessThan(80); // partially exposed
  });

  it('never fires in a clean city', () => {
    const c = mkCity({ id: 'x', corruption: 0 });
    const out = rollCivicEvents({ cities: cityMap(c), season: 'spring', rng: () => 0 });
    expect(out.entries).toHaveLength(0);
  });
});

describe('校場揚威 — a grand review of a well-drilled garrison', () => {
  it('lifts loyalty when drill is high', () => {
    const c = mkCity({ id: 'x', drill: 90, corruption: 0, loyalty: 70 });
    const out = rollCivicEvents({ cities: cityMap(c), season: 'spring', rng: () => 0 });
    expect(out.entries).toHaveLength(1);
    expect(out.cities['x'].loyalty).toBeGreaterThan(70);
  });
});

describe('屯田豐收 — a bumper soldier-farm harvest', () => {
  it('adds food in autumn for a big garrison with sound agriculture', () => {
    const c = mkCity({ id: 'x', troops: 12000, agriculture: 70, corruption: 0, drill: 0, food: 1000 });
    const out = rollCivicEvents({ cities: cityMap(c), season: 'autumn', rng: () => 0 });
    expect(out.entries).toHaveLength(1);
    expect(out.cities['x'].food).toBeGreaterThan(1000);
  });

  it('does not fire outside autumn', () => {
    const c = mkCity({ id: 'x', troops: 12000, agriculture: 70, corruption: 0, drill: 0 });
    const out = rollCivicEvents({ cities: cityMap(c), season: 'summer', rng: () => 0 });
    expect(out.entries).toHaveLength(0);
  });
});

describe('one event per city per season', () => {
  it('a corrupt city fires the scandal, not also a review', () => {
    const c = mkCity({ id: 'x', corruption: 80, drill: 90 });
    const out = rollCivicEvents({ cities: cityMap(c), season: 'spring', rng: () => 0 });
    expect(out.entries).toHaveLength(1);
    expect(out.entries[0].textZh).toContain('貪腐醜聞');
  });

  it('unowned cities are skipped', () => {
    const c = mkCity({ id: 'x', corruption: 80, ownerForceId: null as never });
    const out = rollCivicEvents({ cities: cityMap(c), season: 'spring', rng: () => 0 });
    expect(out.entries).toHaveLength(0);
  });
});
