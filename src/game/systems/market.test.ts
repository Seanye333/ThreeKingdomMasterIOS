/** 市易 — locks the grain market maths. */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import {
  buyQuote, foodRate, sellQuote, marketOutlook, borderTariff,
  horseRate, buyHorses, sellHorses,
  ironRate, buyIron, sellIron,
} from './market';

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

  it('a big buy walks the price — fewer food per gold than a small one', () => {
    const c = mkCity();
    const small = buyQuote(c, 'summer', 500) / 500;
    const big = buyQuote(c, 'summer', 20000) / 20000;
    expect(big).toBeLessThan(small);
  });

  it('a big sell depresses the price — fewer gold per food than a small one', () => {
    const c = mkCity({ food: 200000 });
    const small = sellQuote(c, 'summer', 1000) / 1000;
    const big = sellQuote(c, 'summer', 80000) / 80000;
    expect(big).toBeLessThan(small);
  });

  it('busy commerce tightens the spread (better round trip)', () => {
    const sleepy = mkCity({ commerce: 10 });
    const bustling = mkCity({ commerce: 300 });
    const rtSleepy = sellQuote(sleepy, 'summer', buyQuote(sleepy, 'summer', 1000));
    const rtBustling = sellQuote(bustling, 'summer', buyQuote(bustling, 'summer', 1000));
    expect(rtBustling).toBeGreaterThan(rtSleepy);
  });
});

describe('price stabilisation (常平倉/平準署)', () => {
  it('flattens the seasonal swing — autumn cheaper, winter dearer, both pulled to neutral', () => {
    const c = mkCity();
    const swingPlain = foodRate(c, 'autumn') - foodRate(c, 'winter');
    const swingStable = foodRate(c, 'autumn', { stability: 0.6 }) - foodRate(c, 'winter', { stability: 0.6 });
    expect(swingStable).toBeLessThan(swingPlain);
  });

  it('softens slippage so a big order clears closer to spot', () => {
    const c = mkCity();
    const plain = buyQuote(c, 'summer', 20000);
    const stable = buyQuote(c, 'summer', 20000, { stability: 0.6 });
    expect(stable).toBeGreaterThan(plain);
  });

  it('tightens the spread — a round trip loses less', () => {
    const c = mkCity();
    const rtPlain = sellQuote(c, 'summer', buyQuote(c, 'summer', 1000));
    const rtStable = sellQuote(c, 'summer', buyQuote(c, 'summer', 1000, { stability: 0.6 }), { stability: 0.6 });
    expect(rtStable).toBeGreaterThan(rtPlain);
  });
});

describe('market outlook (行情)', () => {
  it('reads autumn as cheap grain and winter as dear', () => {
    const c = mkCity();
    expect(marketOutlook(c, 'autumn').level).toBe('cheap');
    expect(marketOutlook(c, 'winter').level).toBe('dear');
  });
  it('forecasts the next season direction', () => {
    // summer (1.05) → autumn (1.3): grain getting cheaper.
    expect(marketOutlook(mkCity(), 'summer').nextDir).toBe('cheaper');
    // autumn (1.3) → winter (0.7): grain getting dearer.
    expect(marketOutlook(mkCity(), 'autumn').nextDir).toBe('dearer');
  });
  it('surfaces shock warnings only when flagged', () => {
    expect(marketOutlook(mkCity(), 'spring').warnings).toHaveLength(0);
    expect(marketOutlook(mkCity(), 'spring', {}, { underSiege: true, drought: true }).warnings).toHaveLength(2);
  });
});

describe('榷場 border tariff', () => {
  it('a developed 市舶司 (higher tradeMul) shaves the tariff toward the floor', () => {
    expect(borderTariff(1)).toBeCloseTo(0.12);
    expect(borderTariff(1.05)).toBeLessThan(borderTariff(1));
    expect(borderTariff(2)).toBe(0.04); // floored
  });
});

describe('馬市 warhorse market', () => {
  it('horse-country breeds cheap — more horses per gold than the grain south', () => {
    const nw = mkCity({ warhorses: 800 });
    expect(horseRate(nw, true)).toBeGreaterThan(horseRate(nw, false));
  });
  it('buy-sell round trip loses money (spread), and a big buy walks the price', () => {
    const c = mkCity({ warhorses: 800 });
    const horses = buyHorses(c, true, 1000);
    expect(sellHorses(c, true, horses)).toBeLessThan(1000);
    const small = buyHorses(c, true, 200) / 200;
    const big = buyHorses(c, true, 8000) / 8000;
    expect(big).toBeLessThan(small);
  });
});

describe('鐵市 iron market', () => {
  it('iron-country smelts cheap — more iron per gold than the iron-poor', () => {
    const ic = mkCity({ iron: 1000 });
    expect(ironRate(ic, true)).toBeGreaterThan(ironRate(ic, false));
  });
  it('buy-sell round trip loses money (spread), and a big buy walks the price', () => {
    const c = mkCity({ iron: 1000 });
    const iron = buyIron(c, true, 1000);
    expect(sellIron(c, true, iron)).toBeLessThan(1000);
    const small = buyIron(c, true, 200) / 200;
    const big = buyIron(c, true, 10000) / 10000;
    expect(big).toBeLessThan(small);
  });
});
