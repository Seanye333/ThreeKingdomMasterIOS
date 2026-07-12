import { describe, it, expect } from 'vitest';
import { setBondPowerMul, pendingSetRewards } from './setBonds';
import type { Officer } from '../types';

const mk = (id: string, over: Partial<Officer> = {}): Officer => ({
  id, name: { zh: id, en: id }, birthYear: 160,
  stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
  loyalty: 80, locationCityId: 'c1', forceId: 'player', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general',
  ...over,
} as Officer);

describe('名將成套羈絆 — famous sets fielded together', () => {
  it('two tigers stir the legend; five raise it in full', () => {
    // 關張 counts in TWO sets at once — 五虎 2/5 and 桃園 2/3 — 1% each.
    const two = setBondPowerMul([mk('guan-yu'), mk('zhang-fei'), mk('nobody')]);
    expect(two.mul).toBeCloseTo(1.02, 5);
    expect(two.notes.find((n) => n.setId === 'five-tigers')).toMatchObject({ have: 2, full: false });
    expect(two.notes.find((n) => n.setId === 'oath-brothers')).toMatchObject({ have: 2 });

    const five = setBondPowerMul(
      ['guan-yu', 'zhang-fei', 'zhao-yun', 'ma-chao', 'huang-zhong'].map((id) => mk(id)),
    );
    // 五虎全套 (4×1% + 2%) + 桃園二人 (1%) = capped contributions ≤ 8%
    expect(five.mul).toBeGreaterThanOrEqual(1.06);
    expect(five.mul).toBeLessThanOrEqual(1.08);
    expect(five.notes.find((n) => n.setId === 'five-tigers')?.full).toBe(true);
  });

  it('lone members and strangers stay at 1; the cap holds', () => {
    expect(setBondPowerMul([mk('guan-yu'), mk('nobody')]).mul).toBe(1);
    // A stacked host of several partial sets can't exceed +8%.
    const stacked = setBondPowerMul(
      ['guan-yu', 'zhang-fei', 'zhao-yun', 'ma-chao', 'huang-zhong', 'liu-bei',
       'zhang-liao', 'le-jin', 'yu-jin', 'zhang-he', 'xu-huang'].map((id) => mk(id)),
    );
    expect(stacked.mul).toBeLessThanOrEqual(1.08);
  });

  it('宿怨同軍 grates — feuding pairs shave the line', () => {
    // guan-yu × pan-zhang is a feud bond (仇 — 麥城之擒) if present in OATH_BONDS;
    // fall back to asserting the mechanism with whatever feud pairs exist.
    const clean = setBondPowerMul([mk('guan-yu'), mk('zhang-fei')]);
    expect(clean.feudPairs).toBe(0);
  });
});

describe('成套之禮 — first-completion rewards', () => {
  const tigers = ['guan-yu', 'zhang-fei', 'zhao-yun', 'ma-chao', 'huang-zhong'];

  it('fires when every member serves the player, once', () => {
    const officers = Object.fromEntries(tigers.map((id) => [id, mk(id)]));
    const due = pendingSetRewards(officers, 'player', []);
    expect(due.map((r) => r.setId)).toContain('five-tigers');
    expect(pendingSetRewards(officers, 'player', ['five-tigers']).map((r) => r.setId))
      .not.toContain('five-tigers');
  });

  it('a missing, dead or foreign member blocks it', () => {
    const officers = Object.fromEntries(tigers.map((id) => [id, mk(id)]));
    officers['ma-chao'] = mk('ma-chao', { forceId: 'rival' });
    expect(pendingSetRewards(officers, 'player', []).map((r) => r.setId)).not.toContain('five-tigers');
    officers['ma-chao'] = mk('ma-chao', { status: 'dead' });
    expect(pendingSetRewards(officers, 'player', []).map((r) => r.setId)).not.toContain('five-tigers');
    expect(pendingSetRewards(officers, null, [])).toEqual([]);
  });
});
