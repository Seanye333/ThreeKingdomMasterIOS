import { describe, it, expect } from 'vitest';
import { sideSurgeonMitigation } from './combat';
import type { Officer } from '../types';

const mk = (over: Partial<Officer> = {}): Officer => ({
  id: 'o', name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 60, war: 70, intelligence: 60, politics: 60, charisma: 60 },
  loyalty: 80, locationCityId: null, forceId: 'f', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general', traits: [], ...over,
} as Officer);

describe('軍醫隨軍 — field-surgeon casualty mitigation (N1)', () => {
  it('no physician → no mitigation', () => {
    expect(sideSurgeonMitigation([mk(), mk({ traits: ['brave'] })])).toBe(0);
  });

  it('a raw medic already helps; a 神醫 halves the toll; takes the best in the party', () => {
    expect(sideSurgeonMitigation([mk({ traits: ['physician'], medicalSkill: 0 })])).toBeCloseTo(0.1, 5);
    expect(sideSurgeonMitigation([mk({ traits: ['physician'], medicalSkill: 100 })])).toBeCloseTo(0.4, 5);
    // Best physician in a mixed party wins.
    expect(sideSurgeonMitigation([
      mk({ id: 'a', traits: ['physician'], medicalSkill: 20 }),
      mk({ id: 'b', traits: ['herbalist'], medicalSkill: 80 }),
      mk({ id: 'c', traits: ['brave'] }),
    ])).toBeCloseTo(0.1 + 0.8 * 0.3, 5);
  });
});
