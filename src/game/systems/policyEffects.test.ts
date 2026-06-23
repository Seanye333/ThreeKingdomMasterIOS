import { describe, it, expect } from 'vitest';
import {
  cityPolicyEffects,
  combatPolicyEffects,
  recruitmentPolicyEffects,
  lockedPolicies,
} from './policyEffects';
import type { City, Officer, PolicyId } from '../types';

/** Minimal officer carrying just a policy list — the resolvers only read `.policies`. */
const off = (...policies: PolicyId[]) => ({ policies } as unknown as Officer);
const CITY = {} as City;

describe('cityPolicyEffects — table-driven economy/defense', () => {
  it('sums multiplier deltas onto a base of 1', () => {
    const e = cityPolicyEffects(CITY, [off('tuntian', 'commerce')]);
    expect(e.foodMul).toBeCloseTo(1.25);
    expect(e.goldMul).toBeCloseTo(1.20);
    expect(e.badges).toContain('屯田 +25% 糧');
    expect(e.badges).toContain('商業 +20% 金');
  });

  it('tax-light trades gold for loyalty (prereq: legalism)', () => {
    const e = cityPolicyEffects(CITY, [off('legalism', 'tax-light')]);
    expect(e.goldMul).toBeCloseTo(0.80);
    expect(e.loyaltyDelta).toBe(2);
  });

  it('salt-monopoly: flat gold but a loyalty cost (prereq: legalism)', () => {
    const e = cityPolicyEffects(CITY, [off('legalism', 'salt-monopoly')]);
    expect(e.goldFlat).toBe(60);
    expect(e.loyaltyDelta).toBe(-1);
  });

  it('formerly-cosmetic gold policies now pay flat gold', () => {
    expect(cityPolicyEffects(CITY, [off('sericulture-tax')]).goldFlat).toBe(35);
    expect(cityPolicyEffects(CITY, [off('frontier-market')]).goldFlat).toBe(50);
    expect(cityPolicyEffects(CITY, [off('tribute-system')]).goldFlat).toBe(50);
    expect(cityPolicyEffects(CITY, [off('nanman-tribute')]).goldFlat).toBe(40);
    expect(cityPolicyEffects(CITY, [off('rites', 'frontier-pacification', 'xiongnu-tribute')]).goldFlat).toBe(30);
  });

  it('granary-family loyalty matches its blurb (+3)', () => {
    // include each policy's prereq (tuntian / poor-relief) so it's active.
    expect(cityPolicyEffects(CITY, [off('tuntian', 'community-granary')]).loyaltyDelta).toBe(3);
    expect(cityPolicyEffects(CITY, [off('rites', 'poor-relief', 'charity-house')]).loyaltyDelta).toBe(1 + 1 + 3);
  });

  it('conscription boosts troop cap and dents loyalty', () => {
    const e = cityPolicyEffects(CITY, [off('conscription')]);
    expect(e.troopCapMul).toBeCloseTo(1.35);
    expect(e.loyaltyDelta).toBe(-1);
  });

  it('defense policies add flat city defense', () => {
    const e = cityPolicyEffects(CITY, [off('fortifications', 'tuntian', 'corvee', 'engineering')]);
    expect(e.defenseBonus).toBe(30);
  });

  it('stacks the same policy held by different officers only once (set semantics)', () => {
    const e = cityPolicyEffects(CITY, [off('commerce'), off('commerce')]);
    expect(e.goldMul).toBeCloseTo(1.20);
  });

  it('a policy whose prereq is absent does not fire', () => {
    const gated = cityPolicyEffects(CITY, [off('silk-trade')]); // commerce missing
    expect(gated.goldMul).toBeCloseTo(1.0);
    const met = cityPolicyEffects(CITY, [off('commerce', 'silk-trade')]);
    expect(met.goldMul).toBeCloseTo(1.45); // +0.20 +0.25
    expect(lockedPolicies([off('silk-trade')]).some((l) => l.id === 'silk-trade')).toBe(true);
  });
});

describe('combatPolicyEffects — table-driven, terrain-aware', () => {
  it('unconditional attack/defense doctrines apply anywhere', () => {
    const e = combatPolicyEffects([off('military-theory', 'horse-armor', 'smithing', 'horse-stewardship')]);
    expect(e.attackMul).toBeCloseTo(1.10);
    expect(e.defenseMul).toBeCloseTo(0.80);
  });

  it('naval-fireships: +50% on water, +20% on land', () => {
    const water = combatPolicyEffects([off('naval-fireships')], { terrain: 'river' });
    expect(water.fireMul).toBeCloseTo(1.50);
    expect(water.badges).toContain('火船 +50% 火攻');
    const land = combatPolicyEffects([off('naval-fireships')], { terrain: 'plain' });
    expect(land.fireMul).toBeCloseTo(1.20);
    expect(land.badges).toContain('火船 +20% 火攻');
  });

  it('mountain-warfare only fires on mountain terrain', () => {
    const onMtn = combatPolicyEffects([off('mountain-warfare')], { terrain: 'mountain' });
    expect(onMtn.attackMul).toBeCloseTo(1.20);
    expect(onMtn.defenseMul).toBeCloseTo(0.90);
    const onPlain = combatPolicyEffects([off('mountain-warfare')], { terrain: 'plain' });
    expect(onPlain.attackMul).toBeCloseTo(1.0);
  });

  it('naval-academy attack bonus is water-only', () => {
    expect(combatPolicyEffects([off('naval-academy')], { terrain: 'naval' }).attackMul).toBeCloseTo(1.20);
    expect(combatPolicyEffects([off('naval-academy')], { terrain: 'plain' }).attackMul).toBeCloseTo(1.0);
  });

  it('morale floor takes the max, not the sum', () => {
    const e = combatPolicyEffects([off('camp-discipline', 'recruitment', 'supply-train')]);
    expect(e.moraleFloor).toBe(30); // max(30, 25)
  });
});

describe('recruitmentPolicyEffects — table-driven', () => {
  it('search-success bonuses are additive', () => {
    const e = recruitmentPolicyEffects([off('scholarship', 'examination')]);
    expect(e.searchSuccessBonus).toBeCloseTo(0.30);
    expect(e.badges).toContain('學問 招攬 +20%');
  });

  it('troop-quality multiplier stacks onto a base of 1', () => {
    const e = recruitmentPolicyEffects([off('recruitment', 'horse-breeding', 'horse-stewardship')]);
    expect(e.recruitTroopMul).toBeCloseTo(1.30);
  });
});
