import { describe, it, expect } from 'vitest';
import { festivalScrollReward } from './festival';
import { scrollStarCost, STAR_SCROLL_COST, MAX_STARS } from './stars';
import type { Officer } from '../types';

const drawn = { id: 'x', name: { zh: 'x', en: 'x' } } as Officer;

describe('名將殘卷 — festival scroll drops', () => {
  it('a plain reveal drops one, gold and 故人 each add two', () => {
    expect(festivalScrollReward(drawn, false, false)).toBe(1);
    expect(festivalScrollReward(drawn, true, false)).toBe(3);
    expect(festivalScrollReward(drawn, false, true)).toBe(3);
    expect(festivalScrollReward(drawn, true, true)).toBe(5);
  });
});

describe('殘卷煉星 — scroll star cost', () => {
  it('escalates and clamps at the top star', () => {
    expect(scrollStarCost(0)).toBe(STAR_SCROLL_COST[0]);
    expect(scrollStarCost(5)).toBe(STAR_SCROLL_COST[5]);
    // At/above the max, clamp to the last index (never reads out of bounds).
    expect(scrollStarCost(MAX_STARS)).toBe(STAR_SCROLL_COST[MAX_STARS - 1]);
    for (let i = 1; i < STAR_SCROLL_COST.length; i++) {
      expect(STAR_SCROLL_COST[i]).toBeGreaterThan(STAR_SCROLL_COST[i - 1]);
    }
  });
});
