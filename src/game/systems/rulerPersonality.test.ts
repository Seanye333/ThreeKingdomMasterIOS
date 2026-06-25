/** 君主性格 — personality strategic knobs. */
import { describe, expect, it } from 'vitest';
import { personalityAttackMul, personalityDiplomacyAppetite } from './rulerPersonality';

describe('personalityAttackMul', () => {
  it('warmongers attack on thinner margins than cautious lords', () => {
    expect(personalityAttackMul('tyrant')).toBeGreaterThan(personalityAttackMul('opportunist'));
    expect(personalityAttackMul('cautious')).toBeLessThan(1);
    expect(personalityAttackMul(undefined)).toBe(personalityAttackMul('opportunist')); // default
  });
});

describe('personalityDiplomacyAppetite', () => {
  it('tyrants scorn peace; cautious rulers court it; default is opportunist', () => {
    expect(personalityDiplomacyAppetite('tyrant')).toBeLessThan(1);
    expect(personalityDiplomacyAppetite('cautious')).toBeGreaterThan(1);
    expect(personalityDiplomacyAppetite(undefined)).toBe(personalityDiplomacyAppetite('opportunist'));
  });
});
