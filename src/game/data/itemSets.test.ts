import { describe, it, expect } from 'vitest';
import { ITEM_SETS, itemSetBonuses } from './itemSets';
import { GEM_FUSION, GEMS_BY_ID } from './items';
import type { Officer } from '../types';

const wearer = (equipment: string[]) => ({ id: 'o', forceId: 'f', equipment } as unknown as Officer);

describe('itemSetBonuses — differentiated effect axes', () => {
  it('a power set lifts powerMul; guard/naval untouched', () => {
    const set = ITEM_SETS.find((s) => (s.effect ?? 'power') === 'power')!;
    const b = itemSetBonuses(wearer(set.members));
    expect(b.powerMul).toBeGreaterThan(1);
    expect(b.guardMul).toBe(1);
    expect(b.navalMul).toBe(1);
  });

  it('a guard set cuts own-casualties (guardMul<1), not power', () => {
    const set = ITEM_SETS.find((s) => s.effect === 'guard')!;
    const b = itemSetBonuses(wearer(set.members));
    expect(b.guardMul).toBeLessThan(1);
    expect(b.powerMul).toBe(1);
  });

  it('a naval set lifts navalMul only', () => {
    const set = ITEM_SETS.find((s) => s.effect === 'naval');
    if (!set) return; // none defined → skip
    const b = itemSetBonuses(wearer(set.members));
    expect(b.navalMul).toBeGreaterThan(1);
    expect(b.powerMul).toBe(1);
  });

  it('stacking many power sets is capped at +25%', () => {
    const allPowerMembers = ITEM_SETS
      .filter((s) => (s.effect ?? 'power') === 'power')
      .flatMap((s) => s.members);
    const b = itemSetBonuses(wearer(allPowerMembers));
    expect(b.powerMul).toBeLessThanOrEqual(1.25 + 1e-9);
  });
});

describe('gem fusion data', () => {
  it('every fusion input and output is a real gem', () => {
    for (const [from, to] of Object.entries(GEM_FUSION)) {
      expect(GEMS_BY_ID[from]).toBeTruthy();
      expect(GEMS_BY_ID[to]).toBeTruthy();
      // the output should be a strictly stronger (costlier) gem
      expect(GEMS_BY_ID[to].cost).toBeGreaterThan(GEMS_BY_ID[from].cost);
    }
  });
});
