import { describe, it, expect } from 'vitest';
import { dueMedals, grantMedals, MEDALS } from './medals';
import { liveItem, awakeningSlots, smeltIronYield, ITEMS_BY_ID, AWAKENING_PERKS } from './items';
import { createDeeds } from '../types/deeds';
import type { Officer } from '../types';

const mk = (over: Partial<Officer> = {}): Officer => ({
  id: 'x', name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
  loyalty: 80, locationCityId: 'c1', forceId: 'f', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general',
  ...over,
} as Officer);

describe('歷戰勳章 — deed milestones mint medals', () => {
  it('grants at threshold, once, with the +1 stat', () => {
    const o = mk({});
    const deeds = { ...createDeeds('x'), duelsWon: 10, citiesTaken: 5 };
    const due = dueMedals(o, deeds);
    expect(due.map((m) => m.id).sort()).toEqual(['medal-conqueror', 'medal-duelist']);
    const granted = grantMedals(o, due);
    expect(granted.stats.war).toBe(71);        // 鬥將
    expect(granted.stats.leadership).toBe(71); // 拔城將
    expect(dueMedals(granted, deeds)).toEqual([]); // no double mint
  });

  it('caps at 150 and handles missing deeds', () => {
    const capped = mk({ stats: { leadership: 70, war: 150, intelligence: 70, politics: 70, charisma: 70 } });
    const deeds = { ...createDeeds('x'), duelsWon: 99 };
    const granted = grantMedals(capped, dueMedals(capped, deeds));
    expect(granted.stats.war).toBe(150);
    expect(dueMedals(mk({}), undefined)).toEqual([]);
  });

  it('every medal reads its deed field safely (optional fields default 0)', () => {
    const d = createDeeds('x');
    for (const m of MEDALS) expect(typeof ((d[m.deed] as number | undefined) ?? 0), m.id).toBe('number');
    expect(dueMedals(mk({}), d)).toEqual([]); // a fresh ledger mints nothing
  });
});

describe('兵器覺醒 + 回爐 — item pipelines', () => {
  it('awakening perks fold into liveItem effects', () => {
    const blade = ITEMS_BY_ID['green-dragon'];
    const base = liveItem(blade, 0, 0, [], 0, []);
    const awake = liveItem(blade, 0, 0, [], 0, ['edge', 'edge']);
    expect((awake.effects.war ?? 0) - (base.effects.war ?? 0)).toBe(6);
    expect(AWAKENING_PERKS.length).toBe(3);
  });

  it('威名 milestones unlock 0→3 picks', () => {
    expect(awakeningSlots(0)).toBe(0);
    expect(awakeningSlots(12)).toBe(1);
    expect(awakeningSlots(30)).toBe(2);
    expect(awakeningSlots(60)).toBe(3);
  });

  it('smelt yield scales with rarity and sunk growth', () => {
    const blade = ITEMS_BY_ID['green-dragon'];
    const base = smeltIronYield(blade, 0, 0);
    expect([60, 120, 240]).toContain(base);
    expect(smeltIronYield(blade, 4, 1)).toBe(base + 4 * 25 + 1 * 80);
  });
});
