import { describe, it, expect } from 'vitest';
import { tickCityEconomy, TAX_EFFECT, tradeTreatyGrants, TRADE_INCOME_PER_TREATY } from './economy';
import type { City, DiplomaticState } from '../types';
import { pairKey } from '../types/diplomacy';

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

describe('通商條約 — trade treaty income', () => {
  const withStatus = (a: string, b: string, status: 'allied' | 'non-aggression' | 'neutral'): DiplomaticState => {
    const key = pairKey(a, b);
    return { relations: { [key]: { forceA: a < b ? a : b, forceB: a < b ? b : a, score: 0, status } } };
  };

  it('credits both parties while at peace (allied or NAP)', () => {
    for (const status of ['allied', 'non-aggression'] as const) {
      const g = tradeTreatyGrants(['rival'], withStatus('me', 'rival', status), 'me');
      expect(g['me']).toBe(TRADE_INCOME_PER_TREATY);
      expect(g['rival']).toBe(TRADE_INCOME_PER_TREATY);
    }
  });

  it('pays nothing while at war (neutral status = hostilities permitted)', () => {
    const g = tradeTreatyGrants(['rival'], withStatus('me', 'rival', 'neutral'), 'me');
    expect(g['me']).toBeUndefined();
    expect(g['rival']).toBeUndefined();
  });

  it('stacks income across multiple active treaties', () => {
    const dip: DiplomaticState = {
      relations: {
        ...withStatus('me', 'a', 'allied').relations,
        ...withStatus('me', 'b', 'non-aggression').relations,
      },
    };
    const g = tradeTreatyGrants(['a', 'b'], dip, 'me');
    expect(g['me']).toBe(TRADE_INCOME_PER_TREATY * 2);
  });
});

describe('通貨膨脹 — inflation saps tax income', () => {
  const makeCity = (over: Partial<City> = {}): City => ({
    id: 'c', name: { zh: '城', en: 'C' }, coords: { x: 0, y: 0 }, adjacentCityIds: [],
    ownerForceId: 'f1', population: 100_000, gold: 1000, food: 5000, troops: 2000,
    agriculture: 50, commerce: 50, defense: 50, loyalty: 60, ...over,
  });

  it('higher inflation yields less gold; zero inflation is the baseline', () => {
    const c = makeCity();
    const none = tickCityEconomy(c, 'spring', [], 'normal', 0).goldIncome;
    const mild = tickCityEconomy(c, 'spring', [], 'normal', 40).goldIncome;
    const peak = tickCityEconomy(c, 'spring', [], 'normal', 100).goldIncome;
    expect(mild).toBeLessThan(none);
    expect(peak).toBeLessThan(mild);
    // baseline unchanged when omitted
    expect(tickCityEconomy(c, 'spring', [], 'normal').goldIncome).toBe(none);
  });
});
