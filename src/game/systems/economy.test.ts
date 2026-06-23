import { describe, it, expect } from 'vitest';
import { tickCityEconomy, TAX_EFFECT, tradeTreatyGrants, TRADE_INCOME_PER_TREATY, realmBudget } from './economy';
import type { City, DiplomaticState, Officer } from '../types';
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

describe('度支簿 — realmBudget income statement', () => {
  const baseInput = (over: Partial<Parameters<typeof realmBudget>[0]> = {}): Parameters<typeof realmBudget>[0] => ({
    cities: { c1: { ...makeCity(), id: 'c1', troops: 4000 } },
    officers: {},
    forceId: 'f1',
    season: 'spring',
    tax: 'normal',
    inflation: 0,
    weatherKind: 'clear',
    buildings: [],
    tradePartners: [],
    diplomacy: { relations: {} },
    appointments: [],
    ...over,
  });

  it('sums tax income and subtracts grain upkeep for the bottom line', () => {
    const b = realmBudget(baseInput());
    expect(b.goldLines.tax).toBeGreaterThan(0);
    expect(b.goldNet).toBe(b.goldLines.tax + b.goldLines.tradeTreaty + b.goldLines.tradeRoute + b.goldLines.fief + b.goldLines.office - b.goldLines.stipend);
    // No harvest in spring, so net grain is purely the troop upkeep (negative).
    expect(b.foodLines.harvest).toBe(0);
    expect(b.foodLines.upkeep).toBeGreaterThan(0);
    expect(b.foodNet).toBeLessThan(0);
  });

  it('reports a finite gold runway only when the realm runs a deficit', () => {
    const surplus = realmBudget(baseInput());
    expect(surplus.goldRunway).toBe(Infinity); // tax income, no stipends → surplus
    // A heavy officer payroll with an empty treasury drains fast.
    // Marching (no locationCityId) so it stays out of the per-city prestige path
    // but still owes a rank stipend at season-end.
    const general: Officer = {
      id: 'o1', forceId: 'f1', status: 'active',
      rank: 'general', loyalty: 80,
    } as unknown as Officer;
    const broke = realmBudget(baseInput({
      cities: { c1: { ...makeCity(), id: 'c1', gold: 100, commerce: 1, population: 2000, troops: 100 } },
      officers: { o1: general },
    }));
    if (broke.goldNet < 0) expect(broke.goldRunway).not.toBe(Infinity);
  });

  it('counts a trade treaty into the gold ledger', () => {
    const dip: DiplomaticState = { relations: { [pairKey('f1', 'ally')]: { forceA: 'ally' < 'f1' ? 'ally' : 'f1', forceB: 'ally' < 'f1' ? 'f1' : 'ally', score: 0, status: 'allied' } } };
    const b = realmBudget(baseInput({ tradePartners: ['ally'], diplomacy: dip }));
    expect(b.goldLines.tradeTreaty).toBe(TRADE_INCOME_PER_TREATY);
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

  it('貪腐 skims gold income; a clean city is the baseline, full graft ≈ −40%', () => {
    const clean = tickCityEconomy(makeCity({ corruption: 0 }), 'spring', [], 'normal').goldIncome;
    const dirty = tickCityEconomy(makeCity({ corruption: 50 }), 'spring', [], 'normal').goldIncome;
    const rotten = tickCityEconomy(makeCity({ corruption: 100 }), 'spring', [], 'normal').goldIncome;
    expect(dirty).toBeLessThan(clean);
    expect(rotten).toBeLessThan(dirty);
    expect(rotten).toBeCloseTo(clean * 0.6, 0); // 1 − 100/250 = 0.6
    // omitted corruption matches an explicitly-clean city
    expect(tickCityEconomy(makeCity(), 'spring', [], 'normal').goldIncome).toBe(clean);
  });
});
