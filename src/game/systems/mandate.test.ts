import { describe, it, expect } from 'vitest';
import { forceVirtue, rollOmen, OMEN_LABEL } from './mandate';
import type { City, Force } from '../types';

const city = (over: Partial<City> & { id: string; ownerForceId: string | null }): City => ({
  name: { zh: over.id, en: over.id },
  population: 100_000, gold: 0, food: 0, troops: 0,
  agriculture: 50, commerce: 50, defense: 50, loyalty: 50,
  ...over,
} as City);

const force = (id: string): Force => ({ id, name: { zh: id, en: id } } as Force);

describe('善政招祥瑞 — governance-weighted omens', () => {
  it('forceVirtue rewards 文化名城 + 政清人和, capped', () => {
    const cities: Record<string, City> = {
      a: city({ id: 'a', ownerForceId: 'good', culture: 70 }),                    // 文化名城 +2
      b: city({ id: 'b', ownerForceId: 'good', corruption: 0, loyalty: 95 }),     // 政清人和 +2
      c: city({ id: 'c', ownerForceId: 'good', culture: 40 }),                    // 文教興隆 +1
      d: city({ id: 'd', ownerForceId: 'bad' }),                                  // nothing
    };
    expect(forceVirtue('good', cities)).toBe(5);
    expect(forceVirtue('bad', cities)).toBe(0);
    // Both distinctions on one city stack.
    const both = { x: city({ id: 'x', ownerForceId: 'g', culture: 70, corruption: 1, loyalty: 92 }) };
    expect(forceVirtue('g', both)).toBe(4);
  });

  it('an auspicious omen favours the more virtuous of two equal-mandate realms', () => {
    // rng sequence: [0.0] < 0.08 → fires; [pick omen index]; then target choice.
    // Pin the omen to an auspicious one by choosing the index deterministically.
    const auspiciousIdx = Object.keys(OMEN_LABEL).findIndex((k) => OMEN_LABEL[k as keyof typeof OMEN_LABEL].auspicious);
    const omenPick = (auspiciousIdx + 0.5) / Object.keys(OMEN_LABEL).length;
    const forces = { virtuous: force('virtuous'), plain: force('plain') };
    const cities: Record<string, City> = {
      a: city({ id: 'a', ownerForceId: 'virtuous', culture: 80, corruption: 0, loyalty: 95 }),
      b: city({ id: 'b', ownerForceId: 'plain' }),
    };
    // rng calls: gate(0), omen(omenPick), target-among-top(0 → first = most favored).
    const seq = [0, omenPick, 0];
    let i = 0;
    const rng = () => seq[Math.min(i++, seq.length - 1)];
    const out = rollOmen({ forces, mandate: { byForce: { virtuous: 50, plain: 50 } }, date: { year: 200, season: 'spring' }, rng, cities });
    expect(out.entry).not.toBeNull();
    // The virtuous realm (same mandate, higher 德政) is picked first.
    expect(out.mandate.byForce.virtuous).toBeGreaterThan(50);
    expect(out.mandate.byForce.plain).toBe(50);
  });
});
