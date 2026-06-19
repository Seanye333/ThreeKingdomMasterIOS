import { describe, it, expect } from 'vitest';
import { privateGuardMultiplier, prestigeCombatMultiplier, resolveBattle, type BattleSide } from './combat';
import { mkOfficer, seededRng } from '../../test/factories';
import type { Officer } from '../types';

const withGuard = (n: number): Officer[] => [mkOfficer({ id: 'g', privateTroops: n })];

describe('privateGuardMultiplier', () => {
  it('is 1.0 with no private troops', () => {
    expect(privateGuardMultiplier([mkOfficer()])).toBe(1);
    expect(privateGuardMultiplier(withGuard(0))).toBe(1);
  });

  it('scales +1% per 1,000 troops', () => {
    expect(privateGuardMultiplier(withGuard(5000))).toBeCloseTo(1.05, 5);
    expect(privateGuardMultiplier(withGuard(9000))).toBeCloseTo(1.09, 5);
  });

  it('caps at +18%', () => {
    expect(privateGuardMultiplier(withGuard(18000))).toBeCloseTo(1.18, 5);
    expect(privateGuardMultiplier(withGuard(500000))).toBeCloseTo(1.18, 5);
  });

  it('pools the guard across all officers on a side', () => {
    const pool = [mkOfficer({ id: 'a', privateTroops: 4000 }), mkOfficer({ id: 'b', privateTroops: 3000 })];
    expect(privateGuardMultiplier(pool)).toBeCloseTo(1.07, 5);
  });

  it('ignores negative/garbage values', () => {
    expect(privateGuardMultiplier([mkOfficer({ privateTroops: -5000 })])).toBe(1);
  });
});

describe('private guard in battle', () => {
  const stats = { war: 80, leadership: 80, intelligence: 70, politics: 50, charisma: 60 };
  const sideWith = (guard: number): BattleSide => ({
    troops: 10000,
    commander: mkOfficer({ id: 'cmd', stats, privateTroops: guard }),
  });
  const foe: BattleSide = { troops: 10000, commander: mkOfficer({ id: 'foe', stats }) };

  it('raises the commanding side’s combat power', () => {
    const plain = resolveBattle(sideWith(0), foe, 25, seededRng(7));
    const guarded = resolveBattle(sideWith(9000), foe, 25, seededRng(7));
    expect(guarded.aPower).toBeGreaterThan(plain.aPower);
    // ~+9% at 9000 guard.
    expect(guarded.aPower / plain.aPower).toBeCloseTo(1.09, 2);
  });

  it('tips an even fight in the guarded side’s favour over many seeds', () => {
    let plainWins = 0, guardedWins = 0;
    for (let s = 0; s < 40; s++) {
      if (resolveBattle(sideWith(0), foe, 25, seededRng(s * 3 + 1)).attackerWins) plainWins++;
      if (resolveBattle(sideWith(9000), foe, 25, seededRng(s * 3 + 1)).attackerWins) guardedWins++;
    }
    expect(guardedWins).toBeGreaterThanOrEqual(plainWins);
  });
});

describe('prestigeCombatMultiplier (威名 in battle)', () => {
  it('is 1.0 with no prestige and uses the cached title id', () => {
    expect(prestigeCombatMultiplier([mkOfficer()])).toBe(1);
    // 虎將 cached → +8% combat power.
    expect(prestigeCombatMultiplier([mkOfficer({ prestigeTitleId: 'tiger-general' })])).toBeCloseTo(1.08, 5);
  });

  it('takes the strongest single title, capped near +12%', () => {
    const pool = [
      mkOfficer({ id: 'x', prestigeTitleId: 'fierce-general' }), // +4%
      mkOfficer({ id: 'y', prestigeTitleId: 'tiger-general' }),  // +8%
    ];
    expect(prestigeCombatMultiplier(pool)).toBeCloseTo(1.08, 5); // strongest, not stacked
  });

  it('falls back to innate stats when no title is cached', () => {
    const o = mkOfficer({ stats: { war: 95, leadership: 80, intelligence: 70, politics: 50, charisma: 60 } });
    expect(prestigeCombatMultiplier([o])).toBeCloseTo(1.08, 5); // innate 虎將
  });

  it('raises a famed commander’s battle power', () => {
    const stats = { war: 80, leadership: 80, intelligence: 70, politics: 50, charisma: 60 };
    const plain: BattleSide = { troops: 10000, commander: mkOfficer({ id: 'p', stats }) };
    const famed: BattleSide = { troops: 10000, commander: mkOfficer({ id: 'f', stats, prestigeTitleId: 'tiger-general' }) };
    const foe: BattleSide = { troops: 10000, commander: mkOfficer({ id: 'o', stats }) };
    const a = resolveBattle(plain, foe, 25, seededRng(11));
    const b = resolveBattle(famed, foe, 25, seededRng(11));
    expect(b.aPower).toBeGreaterThan(a.aPower);
  });
});
