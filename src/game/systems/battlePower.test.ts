import { describe, it, expect } from 'vitest';
import { combatBP, cardCondition } from './battlePower';
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

    const starred = combatBP(mk({ stars: 4 }));
    expect(starred.parts.stars).toBe(320);
  });
});

describe('品相 — card condition grade', () => {
  it('climbs with BP and floors on ascension', () => {
    expect(cardCondition(0).id).toBe('raw');
    expect(cardCondition(500).id).toBe('fair');
    expect(cardCondition(1000).id).toBe('good');
    expect(cardCondition(1400).id).toBe('fine');
    expect(cardCondition(1800).id).toBe('gem');
    expect(cardCondition(2400).id).toBe('divine');
    // A 6★ card is never below 極美品, a 4★ never below 上品 — regardless of BP.
    expect(cardCondition(500, 6).id).toBe('gem');
    expect(cardCondition(500, 4).id).toBe('fine');
    // Ascension only lifts, never lowers a already-higher tier.
    expect(cardCondition(2400, 4).id).toBe('divine');
  });
});
