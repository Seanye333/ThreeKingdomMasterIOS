import { describe, it, expect } from 'vitest';
import { cityPhysician } from './events';
import type { Officer } from '../types';

const mk = (over: Partial<Officer> & { id: string }): Officer => ({
  name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 60, war: 60, intelligence: 70, politics: 60, charisma: 60 },
  loyalty: 80, locationCityId: 'c', forceId: 'f', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general', traits: [], ...over,
} as Officer);

describe('醫者防疫 — a physician damps a city plague', () => {
  it('picks the best physician in the city and scales mitigation with 醫術', () => {
    expect(cityPhysician('c', { a: mk({ id: 'a', traits: ['brave'] }) })).toBeNull();
    const raw = cityPhysician('c', { a: mk({ id: 'a', traits: ['physician'], medicalSkill: 0 }) });
    expect(raw?.mit).toBeCloseTo(0.1, 5);
    const shen = cityPhysician('c', { a: mk({ id: 'a', traits: ['herbalist'], medicalSkill: 100 }) });
    expect(shen?.mit).toBeCloseTo(0.35, 5);
    // Best-of, and only physicians in THIS city.
    const pick = cityPhysician('c', {
      a: mk({ id: 'a', traits: ['physician'], medicalSkill: 30 }),
      b: mk({ id: 'b', traits: ['physician'], medicalSkill: 90 }),
      c: mk({ id: 'c', traits: ['physician'], medicalSkill: 100, locationCityId: 'elsewhere' }),
    });
    expect(pick?.doc.id).toBe('b');
  });

  it('a dead physician does not count', () => {
    expect(cityPhysician('c', { a: mk({ id: 'a', traits: ['physician'], medicalSkill: 80, status: 'dead' }) })).toBeNull();
  });
});
