import { describe, it, expect } from 'vitest';
import { duelWinChance, wagerMultiplier, wagerPayout, wagerProfit } from './wager';
import { mkOfficer } from '../../test/factories';

const fighter = (war: number) => mkOfficer({ stats: { war, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });

describe('duel wagers', () => {
  it('a favourite is likely to win but pays little; an underdog pays richly', () => {
    const strong = fighter(95);
    const weak = fighter(60);
    expect(duelWinChance(strong, weak)).toBeGreaterThan(0.6);
    expect(wagerMultiplier(strong, weak)).toBeLessThan(1.6); // short odds on the favourite
    expect(wagerMultiplier(weak, strong)).toBeGreaterThan(2); // long odds on the underdog
  });

  it('keeps the win chance away from certainty (the dice always have a say)', () => {
    const titan = fighter(100);
    const novice = fighter(50);
    expect(duelWinChance(titan, novice)).toBeLessThanOrEqual(0.88);
    expect(duelWinChance(novice, titan)).toBeGreaterThanOrEqual(0.12);
  });

  it('an even match pays about even money', () => {
    const a = fighter(80);
    const b = fighter(80);
    expect(duelWinChance(a, b)).toBeCloseTo(0.5, 1);
    expect(wagerMultiplier(a, b)).toBeGreaterThanOrEqual(1.2);
  });

  it('payout returns the stake plus profit', () => {
    expect(wagerPayout(100, 2.5)).toBe(250);
    expect(wagerProfit(100, 2.5)).toBe(150);
  });
});
