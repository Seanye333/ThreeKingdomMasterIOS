import { describe, it, expect } from 'vitest';
import {
  initDuelSeries, advanceDuelSeries, seriesTarget, seriesOver, seriesWinner, seriesBoutsPlayed,
} from './duelSeries';

describe('duel series (best-of)', () => {
  it('needs a majority of bouts to clinch', () => {
    expect(seriesTarget(1)).toBe(1);
    expect(seriesTarget(3)).toBe(2);
    expect(seriesTarget(5)).toBe(3);
  });

  it('ends the moment a side clinches the majority (a 2-0 sweep of a Bo3)', () => {
    let s = initDuelSeries(3);
    expect(seriesOver(s)).toBe(false);
    s = advanceDuelSeries(s, 'attacker');
    expect(seriesOver(s)).toBe(false);
    s = advanceDuelSeries(s, 'attacker');
    expect(seriesOver(s)).toBe(true);
    expect(seriesWinner(s)).toBe('attacker');
    expect(seriesBoutsPlayed(s)).toBe(2); // the 3rd bout is never fought
  });

  it('carries fatigue between bouts — the loser flags harder', () => {
    let s = initDuelSeries(5);
    s = advanceDuelSeries(s, 'attacker');
    expect(s.aFatigue).toBeLessThan(s.dFatigue); // winner is less winded
    expect(s.aFatigue).toBeGreaterThan(0);       // …but still tires
  });

  it('decides a draw-laden series on total wins once all bouts are fought', () => {
    let s = initDuelSeries(3);
    s = advanceDuelSeries(s, 'draw');
    s = advanceDuelSeries(s, 'attacker');
    s = advanceDuelSeries(s, 'draw');
    expect(seriesBoutsPlayed(s)).toBe(3);
    expect(seriesOver(s)).toBe(true);
    expect(seriesWinner(s)).toBe('attacker'); // 1 win to 0 carries it
  });

  it('caps carried fatigue so the decider is still a real fight', () => {
    let s = initDuelSeries(5);
    for (let i = 0; i < 4; i++) s = advanceDuelSeries(s, 'defender'); // a tires every bout
    expect(s.aFatigue).toBeLessThanOrEqual(55);
  });
});
