import { describe, it, expect } from 'vitest';
import { tickCityEconomy, TAX_EFFECT } from './economy';
import type { City } from '../types';

const makeCity = (over: Partial<City> = {}): City => ({
  id: 'test-city',
  name: { zh: '測', en: 'Test' },
  coords: { x: 0, y: 0 },
  adjacentCityIds: [],
  ownerForceId: 'f1',
  population: 100_000,
  gold: 1000,
  food: 5000,
  troops: 2000,
  agriculture: 50,
  commerce: 50,
  defense: 50,
  loyalty: 60,
  ...over,
});

describe('稅率 — tax policy in tickCityEconomy', () => {
  it('heavy yields more gold than normal than light', () => {
    const c = makeCity();
    const light = tickCityEconomy(c, 'spring', [], 'light');
    const normal = tickCityEconomy(c, 'spring', [], 'normal');
    const heavy = tickCityEconomy(c, 'spring', [], 'heavy');
    expect(light.goldIncome).toBeLessThan(normal.goldIncome);
    expect(heavy.goldIncome).toBeGreaterThan(normal.goldIncome);
  });

  it('light eases loyalty, heavy strains it, normal is steady', () => {
    const c = makeCity();
    const light = tickCityEconomy(c, 'spring', [], 'light');
    const normal = tickCityEconomy(c, 'spring', [], 'normal');
    const heavy = tickCityEconomy(c, 'spring', [], 'heavy');
    expect(light.loyaltyDelta).toBeGreaterThan(normal.loyaltyDelta);
    expect(heavy.loyaltyDelta).toBeLessThan(normal.loyaltyDelta);
  });

  it('defaults to normal when the rate is omitted (back-compat)', () => {
    const c = makeCity();
    expect(tickCityEconomy(c, 'spring', []).goldIncome)
      .toBe(tickCityEconomy(c, 'spring', [], 'normal').goldIncome);
  });

  it('TAX_EFFECT.normal is the neutral baseline', () => {
    expect(TAX_EFFECT.normal.goldMul).toBe(1);
    expect(TAX_EFFECT.normal.loyalty).toBe(0);
  });
});
