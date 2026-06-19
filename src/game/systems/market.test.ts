/** 市易 — locks the grain market maths. */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import { buyQuote, foodRate, sellQuote } from './market';

const mkCity = (over: Partial<City> = {}): City =>
  ({ troops: 5000, food: 30000, commerce: 40, ...over } as City);

describe('foodRate', () => {
  it('autumn grain is cheap, winter grain is dear', () => {
    expect(foodRate(mkCity(), 'autumn')).toBeGreaterThan(foodRate(mkCity(), 'winter'));
  });
  it('scarcity drives the price up; glut drives it down', () => {
    const starving = mkCity({ food: 5000, troops: 8000 });
    const glutted = mkCity({ food: 90000, troops: 5000 });
    expect(foodRate(starving, 'summer')).toBeLessThan(foodRate(mkCity(), 'summer'));
    expect(foodRate(glutted, 'summer')).toBeGreaterThan(foodRate(mkCity(), 'summer'));
  });
  it('commerce improves quotes and the rate stays clamped', () => {
    expect(foodRate(mkCity({ commerce: 100 }), 'summer')).toBeGreaterThan(foodRate(mkCity({ commerce: 10 }), 'summer'));
    expect(foodRate(mkCity({ commerce: 999, food: 999999 }), 'autumn')).toBeLessThanOrEqual(22);
  });
});

describe('quotes', () => {
  it('the spread makes a buy-sell round trip lose money', () => {
    const c = mkCity();
    const food = buyQuote(c, 'summer', 1000);
    expect(sellQuote(c, 'summer', food)).toBeLessThan(1000);
  });
});
