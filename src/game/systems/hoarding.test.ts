import { describe, it, expect } from 'vitest';
import {
  hoardingPressure, hoardTick, hoardEffects, hoardTier, crackdownResult,
  HOARD_CEILING, HOARD_SEVERE,
} from './hoarding';
import { aiCorvee } from './household';
import { aiSelection } from './officialSelection';
import type { Officer } from '../types';

const base = { priceLevel: 'fair' as const, loyalty: 60 };

describe('囤積之勢', () => {
  it('dear grain is the invitation', () => {
    expect(hoardingPressure({ ...base, priceLevel: 'dear' }))
      .toBeGreaterThan(hoardingPressure({ ...base, priceLevel: 'cheap' }));
  });

  it('an ever-normal granary kills the bet outright', () => {
    const open = hoardingPressure({ ...base, priceLevel: 'dear' });
    const stabilised = hoardingPressure({ ...base, priceLevel: 'dear', stability: 0.6 });
    expect(stabilised).toBeLessThan(open);
    expect(hoardTick(20, stabilised)).toBeLessThan(20);
  });

  it('峻法 suppresses it; 寬刑 invites it', () => {
    expect(hoardingPressure({ ...base, lawSeverity: 'strict' }))
      .toBeLessThan(hoardingPressure({ ...base, lawSeverity: 'lenient' }));
  });

  it('a bought magistrate is a partner, not a threat', () => {
    expect(hoardingPressure({ ...base, corruption: 90 }))
      .toBeGreaterThan(hoardingPressure({ ...base, corruption: 0 }));
  });

  it('stays within 0–1', () => {
    expect(hoardingPressure({ priceLevel: 'dear', loyalty: 10, corruption: 100, lawSeverity: 'lenient' }))
      .toBeLessThanOrEqual(1);
    expect(hoardingPressure({ priceLevel: 'cheap', loyalty: 95, lawSeverity: 'strict', stability: 0.6 }))
      .toBe(0);
  });
});

describe('囤積消長', () => {
  it('climbs under pressure and unwinds without it', () => {
    expect(hoardTick(10, 0.8)).toBeGreaterThan(10);
    expect(hoardTick(10, 0.05)).toBeLessThan(10);
  });

  it('never leaves 0–40', () => {
    expect(hoardTick(39, 1)).toBeLessThanOrEqual(HOARD_CEILING);
    expect(hoardTick(1, 0)).toBe(0);
  });
});

describe('囤積之害', () => {
  it('a clear market costs nothing', () => {
    const e = hoardEffects(0);
    expect(e.marketRateMul).toBe(1);
    expect(e.loyaltyDelta).toBe(0);
    expect(e.foodMul).toBe(1);
    expect(hoardTier(0).zh).toBe('市易如常');
  });

  it('a cornered market wrecks quotes and bleeds loyalty', () => {
    const e = hoardEffects(HOARD_CEILING);
    expect(e.marketRateMul).toBeLessThan(0.6);
    expect(e.loyaltyDelta).toBe(-2);
    expect(e.foodMul).toBeLessThan(0.85);
    expect(hoardTier(HOARD_SEVERE).zh).toBe('囤積居奇');
  });
});

describe('抑兼併', () => {
  it('a capable magistrate under a harsh code opens the most', () => {
    const weak = crackdownResult({ hoarded: 40, cityFood: 100_000, politics: 20, lawSeverity: 'lenient' });
    const strong = crackdownResult({ hoarded: 40, cityFood: 100_000, politics: 95, lawSeverity: 'strict' });
    expect(strong.cleared).toBeGreaterThan(weak.cleared);
    expect(strong.foodRecovered).toBeGreaterThan(weak.foodRecovered);
  });

  it('cannot clear more than is actually hoarded', () => {
    const r = crackdownResult({ hoarded: 6, cityFood: 50_000, politics: 95, lawSeverity: 'strict' });
    expect(r.cleared).toBe(6);
  });

  it('always costs trade and goodwill among the great houses', () => {
    const r = crackdownResult({ hoarded: 30, cityFood: 50_000, politics: 70 });
    expect(r.commerceLoss).toBeGreaterThan(0);
    expect(r.clanAnger).toBeGreaterThan(0);
    expect(r.loyaltyGain).toBeGreaterThan(0);
  });
});

describe('AI 制度對稱', () => {
  it('conquerors levy hard, quiet lords let the people rest', () => {
    expect(aiCorvee('tyrant')).toBe('heavy');
    expect(aiCorvee('expansionist')).toBe('heavy');
    expect(aiCorvee('cautious')).toBe('none');
    expect(aiCorvee(undefined)).toBe('none');
  });

  it('a clan-thick court institutionalises itself into 九品', () => {
    const clanCourt = Array.from({ length: 6 }, (_, i) =>
      ({ id: `x${i}`, clanId: 'yingchuan-xun' } as unknown as Officer));
    expect(aiSelection({ officers: clanCourt, cityCount: 8 })).toBe('jiupin');
    expect(aiSelection({ officers: clanCourt, cityCount: 2 })).toBe('chaju');   // too small to grade
  });

  it('a scholar with a humble court reaches for merit', () => {
    const humble = Array.from({ length: 5 }, (_, i) => ({ id: `commoner-${i}` } as unknown as Officer));
    expect(aiSelection({ personality: 'scholar', officers: humble, cityCount: 3 })).toBe('keju');
  });

  it('an empty court keeps to the baseline', () => {
    expect(aiSelection({ officers: [], cityCount: 9 })).toBe('chaju');
  });
});
