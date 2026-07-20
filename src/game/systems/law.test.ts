import { describe, it, expect } from 'vitest';
import {
  lawEffects, caseloadTick, caseloadPenalty, caseloadTier, adjudicateClear,
  wrongfulConvictionChance, amnestyEffect, aiLawCode, CASELOAD_HEAVY,
} from './law';

describe('律令三途', () => {
  it('寬刑 buys loyalty with tax and graft', () => {
    const e = lawEffects('lenient');
    expect(e.loyaltyDelta).toBeGreaterThan(0);
    expect(e.taxYieldMul).toBeLessThan(1);
    expect(e.corruptionMul).toBeGreaterThan(1);
    expect(e.banditRisk).toBeGreaterThan(0);
  });

  it('峻法 buys revenue and order with public faith', () => {
    const e = lawEffects('strict');
    expect(e.loyaltyDelta).toBeLessThan(0);
    expect(e.taxYieldMul).toBeGreaterThan(1);
    expect(e.corruptionMul).toBeLessThan(1);
    expect(e.caseloadMul).toBeGreaterThan(1);
  });

  it('平律 and an absent code are the same thing (old saves are neutral)', () => {
    expect(lawEffects(undefined)).toEqual(lawEffects('standard'));
    expect(lawEffects('standard').taxYieldMul).toBe(1);
    expect(lawEffects('standard').loyaltyDelta).toBe(0);
  });
});

describe('訟獄積案', () => {
  const base = { current: 0, population: 200_000, severity: 'standard' as const, judgePolitics: 0 };

  it('an unattended great city fills its courts fast', () => {
    expect(caseloadTick(base)).toBeGreaterThan(3);
  });

  it('a capable administrator holds the line', () => {
    const neglected = caseloadTick(base);
    const governed = caseloadTick({ ...base, judgePolitics: 90 });
    expect(governed).toBeLessThan(neglected);
    expect(governed).toBe(0);   // 政治 90 disposes of more than arrives
  });

  it('a court to sit in helps further', () => {
    const bare = caseloadTick({ ...base, current: 50, judgePolitics: 40 });
    const withCourt = caseloadTick({ ...base, current: 50, judgePolitics: 40, hasCourt: true });
    expect(withCourt).toBeLessThan(bare);
  });

  it('峻法 fills the docket faster than 寬刑', () => {
    const strict = caseloadTick({ ...base, severity: 'strict' });
    const lenient = caseloadTick({ ...base, severity: 'lenient' });
    expect(strict).toBeGreaterThan(lenient);
  });

  it('a small town generates fewer suits than a metropolis', () => {
    expect(caseloadTick({ ...base, population: 20_000 }))
      .toBeLessThan(caseloadTick({ ...base, population: 600_000 }));
  });

  it('never leaves 0–100', () => {
    expect(caseloadTick({ ...base, current: 99, population: 900_000 })).toBeLessThanOrEqual(100);
    expect(caseloadTick({ ...base, current: 0, judgePolitics: 100 })).toBe(0);
  });
});

describe('積案之弊', () => {
  it('a clear docket costs nothing', () => {
    expect(caseloadPenalty(10)).toEqual({ loyaltyDelta: 0, unrestRisk: 0 });
    expect(caseloadTier(10).zh).toBe('訟簡刑清');
  });

  it('bites harder the higher it climbs', () => {
    const mild = caseloadPenalty(40), heavy = caseloadPenalty(CASELOAD_HEAVY + 5), dire = caseloadPenalty(95);
    expect(mild.loyaltyDelta).toBeGreaterThan(heavy.loyaltyDelta);
    expect(heavy.loyaltyDelta).toBeGreaterThan(dire.loyaltyDelta);
    expect(dire.unrestRisk).toBeGreaterThan(mild.unrestRisk);
    expect(caseloadTier(95).zh).toBe('獄訟山積');
  });
});

describe('決獄', () => {
  it('scales with the official and the courthouse', () => {
    expect(adjudicateClear(90, true)).toBeGreaterThan(adjudicateClear(90, false));
    expect(adjudicateClear(90, false)).toBeGreaterThan(adjudicateClear(20, false));
  });

  it('even a poor official clears something', () => {
    expect(adjudicateClear(0, false)).toBeGreaterThan(0);
  });
});

describe('冤獄', () => {
  it('never happens with a light docket', () => {
    expect(wrongfulConvictionChance({ caseload: 20, severity: 'strict', judgePolitics: 10 })).toBe(0);
  });

  it('峻法 + 積案 + 庸吏 is the dangerous combination', () => {
    const worst = wrongfulConvictionChance({ caseload: 95, severity: 'strict', judgePolitics: 10 });
    const better = wrongfulConvictionChance({ caseload: 95, severity: 'strict', judgePolitics: 95 });
    const lenient = wrongfulConvictionChance({ caseload: 95, severity: 'lenient', judgePolitics: 10 });
    expect(worst).toBeGreaterThan(better);
    expect(worst).toBeGreaterThan(lenient);
    expect(worst).toBeLessThanOrEqual(0.35);
  });
});

describe('大赦', () => {
  it('gives more relief where the courts are fuller, and costs by realm size', () => {
    const small = amnestyEffect({ cityCount: 2, meanCaseload: 10 });
    const wide = amnestyEffect({ cityCount: 20, meanCaseload: 80 });
    expect(wide.loyaltyGain).toBeGreaterThan(small.loyaltyGain);
    expect(wide.goldCost).toBeGreaterThan(small.goldCost);
    expect(wide.loyaltyGain).toBeLessThanOrEqual(12);
    expect(wide.banditSpike).toBeGreaterThan(0);
  });
});

describe('AI 自有其法', () => {
  it('tyrants rule by terror, scholars by lenience, the rest by the book', () => {
    expect(aiLawCode('tyrant')).toBe('strict');
    expect(aiLawCode('scholar')).toBe('lenient');
    expect(aiLawCode('opportunist')).toBe('standard');
    expect(aiLawCode(undefined)).toBe('standard');
  });
});
