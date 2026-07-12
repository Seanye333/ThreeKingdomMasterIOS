import { describe, it, expect } from 'vitest';
import { bpLeaderboard, topBoardIds } from './powerBoard';
import type { Officer } from '../types';

const mk = (id: string, war: number, over: Partial<Officer> = {}): Officer => ({
  id, name: { zh: id, en: id }, birthYear: 160,
  stats: { leadership: 70, war, intelligence: 70, politics: 70, charisma: 70 },
  loyalty: 80, locationCityId: 'c1', forceId: 'f', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general',
  ...over,
} as Officer);

describe('天下武評榜 — the BP power board', () => {
  it('ranks by BP, hides the dead and the undiscovered', () => {
    const officers = {
      strong: mk('strong', 98),
      mid: mk('mid', 80),
      ghost: mk('ghost', 99, { status: 'dead' }),
      hidden: mk('hidden', 99, { status: 'unsearched' }),
    };
    const rows = bpLeaderboard(officers, 0);
    expect(rows.map((r) => r.officer.id)).toEqual(['strong', 'mid']);
    expect(rows[0].rank).toBe(1);
    expect(rows[0].bp).toBeGreaterThan(rows[1].bp);
  });

  it('limit trims and topBoardIds maps id → rank', () => {
    const officers = Object.fromEntries(
      Array.from({ length: 15 }, (_, i) => [`o${i}`, mk(`o${i}`, 60 + i)]),
    );
    expect(bpLeaderboard(officers, 5)).toHaveLength(5);
    const top = topBoardIds(officers, 3);
    expect(top.size).toBe(3);
    expect(top.get('o14')).toBe(1); // highest war → highest BP
  });
});
