import { describe, it, expect } from 'vitest';
import { accrueArmProficiency, armProficiency, armProficiencyMul, armProficiencyTier, profArmOf, ARM_PROF_MAX, armMasteryPerkOf, armMasteryMul, ARM_MASTERY_TIER } from './armProficiency';
import type { Officer } from '../types';

const mk = (over: Partial<Officer> = {}): Officer => ({
  id: 'o', name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
  loyalty: 80, locationCityId: null, forceId: 'f', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general', ...over,
} as Officer);

describe('兵種熟練 — arm proficiency', () => {
  it('siege and exotics fold to infantry; the four real arms map through', () => {
    expect(profArmOf('siege')).toBe('infantry');
    expect(profArmOf('cavalry')).toBe('cavalry');
    expect(profArmOf('archers')).toBe('archers');
    expect(profArmOf('spearmen')).toBe('spearmen');
  });

  it('accrual grows the fought arm, winners faster, and caps at the ceiling', () => {
    let officers: Record<string, Officer> = { a: mk({ id: 'a' }), b: mk({ id: 'b' }) };
    officers = accrueArmProficiency(officers, [
      { officerId: 'a', unit: 'cavalry', won: true },
      { officerId: 'b', unit: 'cavalry', won: false },
    ]);
    expect(armProficiency(officers.a, 'cavalry')).toBe(3); // winner +3
    expect(armProficiency(officers.b, 'cavalry')).toBe(2); // loser +2
    expect(armProficiency(officers.a, 'infantry')).toBe(0); // other arms untouched

    // Cap holds.
    officers.a = mk({ id: 'a', armProficiency: { cavalry: 99 } });
    officers = accrueArmProficiency(officers, [{ officerId: 'a', unit: 'cavalry', won: true }]);
    expect(armProficiency(officers.a, 'cavalry')).toBe(ARM_PROF_MAX);
  });

  it('the power bonus scales 0 → +4% at mastery, only for the matching arm', () => {
    const grand = mk({ armProficiency: { cavalry: 100 } });
    expect(armProficiencyMul(grand, 'cavalry')).toBeCloseTo(1.04, 5);
    expect(armProficiencyMul(grand, 'infantry')).toBe(1); // wrong arm — no edge
    expect(armProficiencyMul(mk(), 'cavalry')).toBe(1);   // untrained — none
    expect(armProficiencyMul(undefined, 'cavalry')).toBe(1);
  });

  it('tiers climb with the value', () => {
    expect(armProficiencyTier(0).zh).toBe('生疏');
    expect(armProficiencyTier(20).zh).toBe('嫻熟');
    expect(armProficiencyTier(50).zh).toBe('精通');
    expect(armProficiencyTier(80).zh).toBe('宗師');
  });

  it('兵種專精 — 宗師 unlocks a signature perk with a real situational bite', () => {
    const raw = mk({ armProficiency: { cavalry: 79 } });
    const master = mk({ armProficiency: { cavalry: ARM_MASTERY_TIER } });
    // Below the bar: no perk, no bite.
    expect(armMasteryPerkOf(raw, 'cavalry')).toBeNull();
    expect(armMasteryMul(raw, 'cavalry')).toBe(1);
    // At 宗師: the perk unlocks and the lever moves.
    expect(armMasteryPerkOf(master, 'cavalry')?.zh).toBe('衝陣不亂');
    expect(armMasteryMul(master, 'cavalry')).toBeCloseTo(1.12, 5); // offensive perk >1
    // Defensive perks read <1 (applied to damage taken); wrong arm stays neutral.
    expect(armMasteryMul(mk({ armProficiency: { infantry: 90 } }), 'infantry')).toBeCloseTo(0.90, 5);
    expect(armMasteryMul(mk({ armProficiency: { spearmen: 90 } }), 'spearmen')).toBeCloseTo(0.85, 5);
    expect(armMasteryMul(master, 'archers')).toBe(1); // masters horse, not bow
  });
});
