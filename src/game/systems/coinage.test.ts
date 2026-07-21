import { describe, it, expect } from 'vitest';
import {
  coinEffects, priceMultiplier, inflationDrift, inflationTier, aiCoinStandard,
  COIN_STANDARDS, COIN_NAMES, INFLATION_BASE_EASE,
} from './coinage';

describe('錢法', () => {
  it('大錢 fills the treasury now and costs you later', () => {
    const d = coinEffects('daqian');
    expect(d.goldYieldMul).toBeGreaterThan(1);
    expect(d.inflationPerSeason).toBeGreaterThan(0);
    expect(d.inflationDecayMul).toBeLessThan(1);
    expect(d.commerceDelta).toBeLessThan(0);
  });

  it('穀帛為市 stops the rot and shrinks the economy', () => {
    const g = coinEffects('grainCloth');
    expect(g.goldYieldMul).toBeLessThan(1);
    expect(g.inflationPerSeason).toBe(0);
    expect(g.inflationDecayMul).toBeGreaterThan(1);
    expect(g.mintYieldMul).toBeLessThan(0.5);
  });

  it('五銖錢 is the neutral default', () => {
    const w = coinEffects(undefined);
    expect(w.goldYieldMul).toBe(1);
    expect(w.commerceDelta).toBe(0);
    expect(w.inflationPerSeason).toBe(0);
  });

  it('every standard is named in both languages', () => {
    for (const s of COIN_STANDARDS) {
      expect(COIN_NAMES[s].zh.length).toBeGreaterThan(0);
      expect(COIN_NAMES[s].en.length).toBeGreaterThan(0);
      expect(COIN_NAMES[s].motto.length).toBeGreaterThan(0);
    }
  });
});

describe('物價', () => {
  it('sound coin buys at par; debased coin buys less', () => {
    expect(priceMultiplier(0)).toBe(1);
    expect(priceMultiplier(100)).toBeGreaterThan(priceMultiplier(50));
    expect(priceMultiplier(100)).toBeLessThan(2);
  });

  it('clamps outside 0–100', () => {
    expect(priceMultiplier(-40)).toBe(1);
    expect(priceMultiplier(400)).toBe(priceMultiplier(100));
  });

  it('tiers read from steady to 穀石數萬', () => {
    expect(inflationTier(0).zh).toBe('物價平準');
    expect(inflationTier(25).zh).toBe('錢輕物重');
    expect(inflationTier(50).zh).toBe('物價騰踊');
    expect(inflationTier(90).zh).toBe('穀石數萬');
  });
});

describe('通脹漂移', () => {
  it('五銖錢 lets a spike bleed off', () => {
    expect(inflationDrift({ current: 40, standard: 'wuzhu' })).toBe(40 - INFLATION_BASE_EASE);
  });

  it('大錢 climbs from nothing on its own', () => {
    let v = 0;
    for (let i = 0; i < 12; i++) v = inflationDrift({ current: v, standard: 'daqian' });
    expect(v).toBeGreaterThan(0);
    // ...but it does not run to the ceiling unattended — 3.5 in, 1.2 out.
    expect(v).toBeLessThan(100);
  });

  it('穀帛為市 clears even a ruined currency', () => {
    let v = 100;
    for (let i = 0; i < 20; i++) v = inflationDrift({ current: v, standard: 'grainCloth' });
    expect(v).toBe(0);
  });

  it('平準署 relief is multiplied by the standard, not added after it', () => {
    const plain = inflationDrift({ current: 50, standard: 'daqian' });
    const relieved = inflationDrift({ current: 50, standard: 'daqian', relief: 6 });
    expect(relieved).toBeLessThan(plain);
  });

  it('stays inside 0–100', () => {
    expect(inflationDrift({ current: 0, standard: 'grainCloth' })).toBe(0);
    let v = 99;
    for (let i = 0; i < 30; i++) v = inflationDrift({ current: v, standard: 'daqian' });
    expect(v).toBeLessThanOrEqual(100);
  });
});

describe('AI 錢法', () => {
  it('a merchant lord never leaves the Han standard', () => {
    expect(aiCoinStandard('merchant', true)).toBe('wuzhu');
  });

  it('a broke tyrant debases; a broke steward retreats to grain and silk', () => {
    expect(aiCoinStandard('tyrant', true)).toBe('daqian');
    expect(aiCoinStandard('balanced', true)).toBe('grainCloth');
  });

  it('a full treasury keeps the standard', () => {
    expect(aiCoinStandard('tyrant', false)).toBe('wuzhu');
  });
});
