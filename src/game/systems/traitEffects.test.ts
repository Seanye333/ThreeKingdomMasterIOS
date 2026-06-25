/** 性格效果 — internal-affairs & corruption trait modifiers. */
import { describe, expect, it } from 'vitest';
import { mkOfficer } from '../../test/factories';
import { createDeeds } from '../types/deeds';
import {
  internalAffairsMultiplier, corruptionAccrualMultiplier,
  tacticalDamageMul, tacticalDefenseMul, wordWarProwessMul,
  conquestLoyaltyMod, cityIncomeTraitMul, isFlavorOnlyTrait,
  deedTraitCandidate, combatRoleFit,
  physicianRecoveryBonus, plagueDeathTraitMul, isIncapacitated,
} from './traitEffects';

describe('治軍嚴整 — disciplined officers drill / farm better', () => {
  it('iron-discipline boosts 練兵 and 屯田 but not, say, 興商', () => {
    const o = mkOfficer({ id: 'a', traits: ['iron-discipline'] as never });
    expect(internalAffairsMultiplier(o, 'drill-troops')).toBeGreaterThan(1);
    expect(internalAffairsMultiplier(o, 'military-farming')).toBeGreaterThan(1);
    expect(internalAffairsMultiplier(o, 'develop-commerce')).toBe(1);
  });
});

describe('貪腐滋生 — accrual modulated by the officers posted', () => {
  it('a greedy governor speeds graft; an incorruptible one slows it', () => {
    const greedy = mkOfficer({ id: 'g', traits: ['greedy'] as never });
    const clean = mkOfficer({ id: 'c', traits: ['incorruptible'] as never });
    const plain = mkOfficer({ id: 'p', traits: [] as never });
    expect(corruptionAccrualMultiplier([greedy])).toBeCloseTo(1.5, 5);
    expect(corruptionAccrualMultiplier([clean])).toBeCloseTo(0.5, 5);
    expect(corruptionAccrualMultiplier([plain])).toBe(1);
    // both present roughly cancel
    expect(corruptionAccrualMultiplier([greedy, clean])).toBeCloseTo(0.75, 5);
  });
});

describe('戰場專長 — unit/terrain specialist traits now bite', () => {
  it('神槍 boosts spear units, not cavalry', () => {
    const o = mkOfficer({ id: 's', traits: ['spear-master'] as never });
    const ctx = { terrain: 'plain' as const, isNight: false, isAmbush: false, turn: 2, troopRatio: 1, isAttacker: true };
    expect(tacticalDamageMul(o, { ...ctx, unitType: 'spearmen' })).toBeGreaterThan(1);
    expect(tacticalDamageMul(o, { ...ctx, unitType: 'cavalry' })).toBe(1);
  });
  it('山戰 boosts hill terrain only', () => {
    const o = mkOfficer({ id: 'h', traits: ['hill-fighter'] as never });
    const base = { unitType: 'infantry' as const, isNight: false, isAmbush: false, turn: 2, troopRatio: 1, isAttacker: true };
    expect(tacticalDamageMul(o, { ...base, terrain: 'hill' })).toBeGreaterThan(1);
    expect(tacticalDamageMul(o, { ...base, terrain: 'plain' })).toBe(1);
  });
  it('持盾 reduces incoming damage', () => {
    const o = mkOfficer({ id: 'sh', traits: ['shield-bearer'] as never });
    const ctx = { unitType: 'infantry' as const, terrain: 'plain' as const, isNight: false, isAmbush: false, turn: 1, troopRatio: 1, isAttacker: false };
    expect(tacticalDefenseMul(o, ctx)).toBeLessThan(1);
  });
});

describe('舌戰口才 — rhetorical traits scale prowess', () => {
  it('雄辯 raises, 寡黙 lowers', () => {
    expect(wordWarProwessMul(mkOfficer({ id: 'e', traits: ['eloquent'] as never }))).toBeGreaterThan(1);
    expect(wordWarProwessMul(mkOfficer({ id: 't', traits: ['taciturn'] as never }))).toBeLessThan(1);
    expect(wordWarProwessMul(mkOfficer({ id: 'n', traits: [] as never }))).toBe(1);
  });
});

describe('攻陷民忠 — mercy/cruelty graded by magnitude', () => {
  it('慈悲 (+18) outweighs 寬厚 (+12); 嗜殺 (−18) below 暴怒 (−12)', () => {
    expect(conquestLoyaltyMod(mkOfficer({ id: 'm', traits: ['compassionate'] as never }))).toBe(18);
    expect(conquestLoyaltyMod(mkOfficer({ id: 'l', traits: ['lenient'] as never }))).toBe(12);
    expect(conquestLoyaltyMod(mkOfficer({ id: 'b', traits: ['bloodthirsty'] as never }))).toBe(-18);
    expect(conquestLoyaltyMod(mkOfficer({ id: 'w', traits: ['wrathful'] as never }))).toBe(-12);
  });
});

describe('性格金收 — thrifty vs wasteful officers', () => {
  it('儉嗇 lifts, 浪費 lowers city income', () => {
    expect(cityIncomeTraitMul([mkOfficer({ id: 'f', traits: ['frugal'] as never })])).toBeGreaterThan(1);
    expect(cityIncomeTraitMul([mkOfficer({ id: 'sp', traits: ['spendthrift'] as never })])).toBeLessThan(1);
    expect(cityIncomeTraitMul([mkOfficer({ id: 'p', traits: [] as never })])).toBe(1);
  });
});

describe('風味標記 — flavor-only vs wired traits', () => {
  it('a wired trait is not flavor-only; a cosmetic one is', () => {
    expect(isFlavorOnlyTrait('spear-master')).toBe(false); // now wired
    expect(isFlavorOnlyTrait('eloquent')).toBe(false);
    expect(isFlavorOnlyTrait('tall')).toBe(true);          // purely cosmetic
    expect(isFlavorOnlyTrait('red-faced')).toBe(true);
  });
});

describe('戰績習性 — deed-based trait acquisition', () => {
  const D = (over: Partial<import('../types/deeds').HeroicDeeds>) => ({ ...createDeeds('x'), ...over });
  it('grants duelist at 3 duels won, not before', () => {
    const o = mkOfficer({ id: 'd', traits: [] as never });
    expect(deedTraitCandidate(o, D({ duelsWon: 2 }))).toBeNull();
    expect(deedTraitCandidate(o, D({ duelsWon: 3 }))).toBe('duelist');
  });
  it('grants siege-expert/veteran/cunning/shadow-walker at thresholds', () => {
    const o = mkOfficer({ id: 'd2', traits: [] as never });
    expect(deedTraitCandidate(o, D({ citiesTaken: 5 }))).toBe('siege-expert');
    expect(deedTraitCandidate(o, D({ battlesWon: 10 }))).toBe('veteran');
    expect(deedTraitCandidate(o, D({ espionageSuccess: 5 }))).toBe('cunning');
    expect(deedTraitCandidate(o, D({ killsTroops: 2000 }))).toBe('shadow-walker');
  });
  it('does not re-grant a trait already held; null deeds → null', () => {
    const o = mkOfficer({ id: 'd3', traits: ['duelist'] as never });
    expect(deedTraitCandidate(o, D({ duelsWon: 9 }))).not.toBe('duelist');
    expect(deedTraitCandidate(o, undefined)).toBeNull();
  });
});

describe('combatRoleFit — AI specialist selection bias', () => {
  it('neutral officer is 1.0; siege-expert favored in siege; cowardly penalized', () => {
    expect(combatRoleFit(mkOfficer({ id: 'n', traits: [] as never }), { isSiege: true })).toBe(1.0);
    expect(combatRoleFit(mkOfficer({ id: 's', traits: ['siege-expert'] as never }), { isSiege: true })).toBeGreaterThan(1);
    expect(combatRoleFit(mkOfficer({ id: 'nv', traits: ['navy-master'] as never }), { isNaval: true })).toBeGreaterThan(1);
    expect(combatRoleFit(mkOfficer({ id: 'fk', traits: ['fortress-keeper'] as never }), { isDefense: true })).toBeGreaterThan(1);
    expect(combatRoleFit(mkOfficer({ id: 'c', traits: ['cowardly'] as never }), { isSiege: true })).toBeLessThan(1);
  });
});

describe('復仇 vengeful — +20% only vs the force that killed a relative', () => {
  const ctx = { unitType: 'infantry' as const, terrain: 'plain' as const, isNight: false, isAmbush: false, turn: 2, troopRatio: 1, isAttacker: true };
  it('boosts vs killer force, not others', () => {
    const o = mkOfficer({ id: 'v', traits: ['vengeful'] as never, killedRelativesBy: { rel1: 'cao' } });
    expect(tacticalDamageMul(o, { ...ctx, enemyForceId: 'cao' })).toBeGreaterThan(1);
    expect(tacticalDamageMul(o, { ...ctx, enemyForceId: 'sun' })).toBe(1);
  });
  it('no grudge → no bonus', () => {
    const o = mkOfficer({ id: 'v2', traits: ['vengeful'] as never });
    expect(tacticalDamageMul(o, { ...ctx, enemyForceId: 'cao' })).toBe(1);
  });
});

describe('傳奇性格 — legendary traits are wired but not flavor-badged', () => {
  it('sleeping-dragon/phoenix-mind now wired (signature effect)', () => {
    expect(isFlavorOnlyTrait('sleeping-dragon')).toBe(false);
    expect(isFlavorOnlyTrait('phoenix-mind')).toBe(false);
  });
});

describe('§2.4 醫療 — physician/herbalist + plague + incapacitation', () => {
  it('physician in a force boosts wound recovery; absent = 0', () => {
    expect(physicianRecoveryBonus([mkOfficer({ id: 'p', traits: ['physician'] as never })])).toBeGreaterThan(0);
    expect(physicianRecoveryBonus([mkOfficer({ id: 'n', traits: [] as never })])).toBe(0);
  });
  it('plague death factor: frail higher, hale/doctored lower', () => {
    expect(plagueDeathTraitMul(mkOfficer({ id: 's', traits: ['sickly'] as never }))).toBeGreaterThan(1);
    expect(plagueDeathTraitMul(mkOfficer({ id: 'd', traits: ['physician'] as never }))).toBeLessThan(1);
    expect(plagueDeathTraitMul(mkOfficer({ id: 'x', traits: [] as never }))).toBe(1);
  });
  it('isIncapacitated: critical wound yes, minor/none no', () => {
    expect(isIncapacitated(mkOfficer({ id: 'c', status: 'wounded', woundSeverity: 'critical' }))).toBe(true);
    expect(isIncapacitated(mkOfficer({ id: 'm', status: 'wounded', woundSeverity: 'minor' }))).toBe(false);
    expect(isIncapacitated(mkOfficer({ id: 'i', status: 'idle' }))).toBe(false);
  });
  it('new medical traits are wired (not flavor-only)', () => {
    expect(isFlavorOnlyTrait('physician')).toBe(false);
    expect(isFlavorOnlyTrait('herbalist')).toBe(false);
  });
});
