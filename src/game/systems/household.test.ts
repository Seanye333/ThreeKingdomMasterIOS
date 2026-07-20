import { describe, it, expect } from 'vitest';
import {
  corveeEffects, hiddenDrift, registryYieldMul, hiddenTier, householdAudit,
  HIDDEN_FLOOR, HIDDEN_CEILING,
} from './household';

describe('徭役三等', () => {
  it('息役 rests the people and draws households back', () => {
    const e = corveeEffects('none');
    expect(e.buildSpeed).toBe(0);
    expect(e.loyaltyDelta).toBeGreaterThan(0);
    expect(e.hidingPressure).toBeLessThan(0);
  });

  it('重役 builds fast and wrecks everything else', () => {
    const e = corveeEffects('heavy');
    expect(e.buildSpeed).toBe(2);
    expect(e.loyaltyDelta).toBeLessThan(0);
    expect(e.farmMul).toBeLessThan(1);
    expect(e.hidingPressure).toBeGreaterThan(1);
  });

  it('an absent setting is 息役 (old saves levy nothing)', () => {
    expect(corveeEffects(undefined)).toEqual(corveeEffects('none'));
  });
});

describe('隱戶消長', () => {
  const base = { current: 10, corvee: 'none' as const, bestPolitics: 0, loyalty: 50 };

  it('heavy levies drive people off the registers', () => {
    expect(hiddenDrift({ ...base, corvee: 'heavy' })).toBeGreaterThan(base.current);
  });

  it('resting them brings people back — when somebody is actually governing', () => {
    expect(hiddenDrift({ ...base, bestPolitics: 75 })).toBeLessThan(base.current);
  });

  it('an unattended city leaks even at rest — nobody is counting', () => {
    expect(hiddenDrift({ ...base, bestPolitics: 0 })).toBeGreaterThan(base.current);
  });

  it('大邑難稽 — a metropolis leaks faster than a market town under the same官', () => {
    const town = hiddenDrift({ ...base, bestPolitics: 70, population: 60_000 });
    const metropolis = hiddenDrift({ ...base, bestPolitics: 70, population: 700_000 });
    expect(metropolis).toBeGreaterThan(town);
  });

  it('峻法 pushes people to hide; 寬刑 pulls them back', () => {
    const strict = hiddenDrift({ ...base, corvee: 'light', lawSeverity: 'strict' });
    const lenient = hiddenDrift({ ...base, corvee: 'light', lawSeverity: 'lenient' });
    expect(strict).toBeGreaterThan(lenient);
  });

  it('a capable resident administrator keeps the rolls honest even under levy', () => {
    const unattended = hiddenDrift({ ...base, corvee: 'heavy', bestPolitics: 0 });
    const governed = hiddenDrift({ ...base, corvee: 'heavy', bestPolitics: 95 });
    expect(governed).toBeLessThan(unattended);
  });

  it('a miserable city hides more than a contented one', () => {
    expect(hiddenDrift({ ...base, corvee: 'light', loyalty: 20 }))
      .toBeGreaterThan(hiddenDrift({ ...base, corvee: 'light', loyalty: 85 }));
  });

  it('stays inside the floor/ceiling', () => {
    expect(hiddenDrift({ ...base, current: 0, corvee: 'none', bestPolitics: 100 })).toBe(HIDDEN_FLOOR);
    expect(hiddenDrift({ ...base, current: 45, corvee: 'heavy', loyalty: 10 })).toBeLessThanOrEqual(HIDDEN_CEILING);
  });
});

describe('稅基', () => {
  it('fully registered realms lose nothing', () => {
    expect(registryYieldMul(0)).toBe(1);
    expect(hiddenTier(0).zh).toBe('編戶齊民');
  });

  it('a gutted register costs most of the yield', () => {
    expect(registryYieldMul(45)).toBeCloseTo(0.64, 2);
    expect(hiddenTier(35).zh).toBe('編戶大壞');
  });
});

describe('括戶', () => {
  it('recovers more under a better official', () => {
    const dull = householdAudit({ hiddenPercent: 30, politics: 20, population: 200_000 });
    const able = householdAudit({ hiddenPercent: 30, politics: 95, population: 200_000 });
    expect(able.recovered).toBeGreaterThan(dull.recovered);
    expect(able.households).toBeGreaterThan(dull.households);
    expect(able.clanAnger).toBeGreaterThan(dull.clanAnger);
  });

  it('cannot dig below the floor of concealment', () => {
    const r = householdAudit({ hiddenPercent: HIDDEN_FLOOR, politics: 100, population: 200_000 });
    expect(r.recovered).toBe(0);
  });

  it('recovers real heads proportional to the city', () => {
    const small = householdAudit({ hiddenPercent: 30, politics: 60, population: 50_000 });
    const big = householdAudit({ hiddenPercent: 30, politics: 60, population: 500_000 });
    expect(big.households).toBe(small.households * 10);
  });
});
