import { describe, it, expect } from 'vitest';
import { applyStarUp, nextStarRequirement, planAiStarInvestments, MAX_STARS, STAR_GOLD_COST } from './stars';
import { gradeCombatBonus } from './gradeCombat';
import type { City, Officer } from '../types';

const mk = (over: Partial<Officer>): Officer => ({
  id: 'x', name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 70, war: 82, intelligence: 70, politics: 70, charisma: 70 },
  loyalty: 80, locationCityId: 'c1', forceId: 'f', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general',
  ...over,
} as Officer);

describe('星級覺醒軌 — the ascension track', () => {
  it('gates each star on growth level and prices it', () => {
    const fresh = mk({}); // no xp → level 1
    const r0 = nextStarRequirement(fresh);
    expect(r0.ok).toBe(false); // star 1 needs Lv.2
    const grown = mk({ xp: 8000 }); // deep XP → high level
    const r1 = nextStarRequirement(grown);
    expect(r1.ok).toBe(true);
    expect(r1.cost).toBe(STAR_GOLD_COST[0]);
    const maxed = mk({ stars: MAX_STARS });
    expect(nextStarRequirement(maxed).ok).toBe(false);
  });

  it('the sixth star awakens: +2 to the strongest stat, once', () => {
    const o = mk({ stars: 5, xp: 8000 });
    const { officer: up, awakened } = applyStarUp(o);
    expect(awakened).toBe(true);
    expect(up.stars).toBe(6);
    expect(up.stats.war).toBe(84); // war was the strongest (82)
    const again = applyStarUp(up);
    expect(again.awakened).toBe(false);
    expect(again.officer.stars).toBe(6); // capped
  });

  it('stars amplify the grade combat passive', () => {
    const plain = mk({});
    const starred = mk({ stars: 6 });
    const a = gradeCombatBonus(plain);
    const b = gradeCombatBonus(starred);
    expect(b.powerMul).toBeCloseTo(a.powerMul + 0.03, 5);
    expect(b.duelBonus).toBe(a.duelBonus + 6);
    expect(b.duelStamina).toBe(a.duelStamina + 12);
  });

  it('AI invests in its ace from its richest city, never the player', () => {
    const officers: Record<string, Officer> = {
      ace: mk({ id: 'ace', forceId: 'ai', xp: 8000, stats: { leadership: 90, war: 95, intelligence: 70, politics: 60, charisma: 65 } }),
      minor: mk({ id: 'minor', forceId: 'ai', xp: 8000 }),
      mine: mk({ id: 'mine', forceId: 'player', xp: 8000 }),
    };
    const cities = {
      c1: { id: 'c1', ownerForceId: 'ai', gold: 99999 } as City,
      c2: { id: 'c2', ownerForceId: 'player', gold: 99999 } as City,
    };
    const acts = planAiStarInvestments({ officers, cities, playerForceId: 'player', rng: () => 0 });
    expect(acts).toEqual([{ officerId: 'ace', cityId: 'c1', cost: STAR_GOLD_COST[0] }]);
    // Below the 30% roll → no investment this season.
    expect(planAiStarInvestments({ officers, cities, playerForceId: 'player', rng: () => 0.9 })).toEqual([]);
  });
});
