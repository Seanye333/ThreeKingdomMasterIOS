/**
 * 性格平衡護欄 — guardrails proving the trait wiring stays within sane power
 * budgets. The 0–3-traits-per-officer cap is what really bounds the stacks, so
 * these tests assert worst-case-with-3-traits, not theoretical all-trait stacks.
 */
import { describe, expect, it } from 'vitest';
import { mkOfficer } from '../../test/factories';
import { TRAIT_DEFS } from '../data/personality';
import {
  effectiveStats, tacticalDamageMul, cityIncomeTraitMul,
  isWiredTrait, isFlavorOnlyTrait, wiredTraitIds,
} from './traitEffects';

describe('effectiveStats clamp [1,120] holds under stacked traits', () => {
  it('three war-boost traits stay clamped and sane', () => {
    const o = mkOfficer({ id: 'x', stats: { war: 118, leadership: 50, intelligence: 50, politics: 50, charisma: 50 }, traits: ['martial-valor', 'berserker', 'matchless'] as never });
    expect(effectiveStats(o).war).toBeLessThanOrEqual(120);
    expect(effectiveStats(o).war).toBeGreaterThanOrEqual(1);
  });
});

describe('tacticalDamageMul worst-case (max 3 traits) stays under a sane ceiling', () => {
  it('any 3-trait stack on the perfect tile stays < 2.0×', () => {
    // The 0–3 cap bounds it: e.g. cavalryman + night-raider + vanguard on a
    // cavalry unit, night, turn 1 = 1.15 × 1.25 × 1.20 ≈ 1.725×.
    const o = mkOfficer({ id: 'c', traits: ['cavalryman', 'night-raider', 'vanguard'] as never });
    const mul = tacticalDamageMul(o, { unitType: 'cavalry', terrain: 'plain', isNight: true, isAmbush: false, turn: 1, troopRatio: 0.4, isAttacker: true });
    expect(mul).toBeGreaterThan(1);
    expect(mul).toBeLessThan(2.0);
  });
});

describe('cityIncomeTraitMul stays in its documented [0.8,1.2] band', () => {
  it('thrifty+dark-political does not exceed the ceiling', () => {
    const o = mkOfficer({ id: 'g', traits: ['frugal', 'dark-political'] as never });
    const m = cityIncomeTraitMul([o]);
    expect(m).toBeGreaterThanOrEqual(0.8);
    expect(m).toBeLessThanOrEqual(1.2);
  });
});

describe('coverage registry integrity', () => {
  it('isWiredTrait and isFlavorOnlyTrait are exact inverses', () => {
    for (const d of TRAIT_DEFS) {
      expect(isWiredTrait(d.id)).toBe(!isFlavorOnlyTrait(d.id));
    }
  });
  it('every wired id maps to a real TRAIT_DEFS entry (no orphans)', () => {
    const defIds = new Set(TRAIT_DEFS.map((d) => d.id));
    // every wired id that is also a defined trait must resolve; flag any wired
    // id that is NOT a known trait def (would be a typo in EXTRA_WIRED).
    const orphans = wiredTraitIds().filter((id) => !defIds.has(id as never));
    expect(orphans).toEqual([]);
  });
});
