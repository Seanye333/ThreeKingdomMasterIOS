import { describe, it, expect } from 'vitest';
import { combatBP } from './battlePower';
import type { Officer } from '../types';

const mk = (over: Partial<Officer>): Officer => ({
  id: 'x', name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
  loyalty: 80, locationCityId: null, forceId: 'f', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general',
  ...over,
} as Officer);

describe('綜合戰力 BP — the card\'s big number', () => {
  it('parts sum to the total and every axis moves it', () => {
    const base = combatBP(mk({}));
    expect(base.bp).toBe(Object.values(base.parts).reduce((a, b) => a + b, 0));

    const stronger = combatBP(mk({ stats: { leadership: 95, war: 97, intelligence: 90, politics: 80, charisma: 85 } }));
    expect(stronger.bp).toBeGreaterThan(base.bp);
    expect(stronger.parts.grade).toBeGreaterThan(base.parts.grade); // grade follows stats

    const skilled = combatBP(mk({ skills: ['brave', 'pursuit', 'rear-guard'] }));
    expect(skilled.parts.skills).toBe(3 * 45);

    const famous = combatBP(mk({ renown: 100 }));
    expect(famous.parts.renown).toBe(100);

    const starred = combatBP(mk({ stars: 4 } as never));
    expect(starred.parts.stars).toBe(320);
  });
});
