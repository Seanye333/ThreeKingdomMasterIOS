import { describe, it, expect } from 'vitest';
import { seedRating, expectedScore, applyBout, ladderBoard, ratingTier } from './warRanking';
import { mkOfficer } from '../../test/factories';

const w = (id: string, war: number) => mkOfficer({ id, stats: { war, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });

describe('武評榜 (ELO ladder)', () => {
  it('seeds rating from 武力', () => {
    expect(seedRating(w('a', 60))).toBe(1000);
    expect(seedRating(w('a', 100))).toBeGreaterThan(seedRating(w('b', 80)));
  });

  it('a favourite is expected to win more often than not', () => {
    expect(expectedScore(1300, 1000)).toBeGreaterThan(0.8);
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 5);
  });

  it('beating a higher-rated foe gains more than beating a weaker one', () => {
    const ratings = { strong: 1300, weak: 900, mid: 1100 };
    const up1 = applyBout(ratings, w('mid', 80), w('strong', 95), 'win');
    const up2 = applyBout(ratings, w('mid', 80), w('weak', 65), 'win');
    const gainVsStrong = up1.winnerDelta;
    const gainVsWeak = up2.winnerDelta;
    expect(gainVsStrong).toBeGreaterThan(gainVsWeak);
  });

  it('is zero-sum: the winner gains what the loser drops', () => {
    const u = applyBout({}, w('a', 80), w('b', 80), 'win');
    expect(u.winnerDelta).toBe(-u.loserDelta);
    expect(u.winnerId).toBe('a');
  });

  it('frames a loss from the actual winner', () => {
    const u = applyBout({}, w('a', 80), w('b', 90), 'loss');
    expect(u.winnerId).toBe('b');
    expect(u.winnerDelta).toBeGreaterThan(0);
  });

  it('a draw barely moves evenly-matched fighters', () => {
    const u = applyBout({}, w('a', 80), w('b', 80), 'draw');
    expect(u.winnerDelta).toBe(0);
  });

  it('boards officers highest-first and names tiers', () => {
    const officers = { a: w('a', 100), b: w('b', 70) };
    const board = ladderBoard({ a: 1340, b: 980 }, officers);
    expect(board[0].id).toBe('a');
    expect(ratingTier(1340).zh).toBe('神將');
  });
});

import { duelCareerBonus } from './warRanking';
import { initDuelBout } from './duel';
import { mkOfficer as _mk } from '../../test/factories';

describe('鬥將生涯 — duelCareerBonus', () => {
  it('rewards a high 段位 and a deep tally of duel wins', () => {
    expect(duelCareerBonus(900, 0).prowess).toBe(0);          // 末將, no wins
    expect(duelCareerBonus(1330, 0).prowess).toBe(10);        // 神將 tier
    expect(duelCareerBonus(900, 40).prowess).toBe(6);         // 百戰 veterancy
    const elite = duelCareerBonus(1330, 40);
    expect(elite.prowess).toBe(16);                            // both stack
    expect(elite.tierZh).toBe('神將');
  });

  it('folds into the bout\'s fixed prowess via initDuelBout', () => {
    const a = _mk({ id: 'a', stats: { war: 85, leadership: 60, intelligence: 60, politics: 50, charisma: 60 } });
    const b = _mk({ id: 'b', stats: { war: 85, leadership: 60, intelligence: 60, politics: 50, charisma: 60 } });
    const base = initDuelBout(a, b);
    const careered = initDuelBout(a, b, 0, 0, 'veteran', 'plain', 12, 0);
    expect(careered.aStatic).toBe(base.aStatic + 12);
    expect(careered.dStatic).toBe(base.dStatic);
  });
});
