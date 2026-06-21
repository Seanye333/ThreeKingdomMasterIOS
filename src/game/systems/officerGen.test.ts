import { describe, it, expect } from 'vitest';
import { seededRng } from '../../test/factories';
import { generateFictionalOfficer } from './officerGen';
import { TRAIT_DEFS } from '../data/personality';

const VALID_TRAITS = new Set(TRAIT_DEFS.map((t) => t.id));

describe('generateFictionalOfficer', () => {
  it('produces a valid free-agent officer', () => {
    const o = generateFictionalOfficer(200, seededRng(1), new Set());
    expect(o.name.zh.length).toBeGreaterThanOrEqual(2);
    expect(o.name.en).toContain(' ');
    expect(o.status).toBe('unsearched');
    expect(o.forceId).toBeNull();
    expect(o.locationCityId).toBeNull(); // rootless 在野 pool
    expect(o.deathYear).toBeUndefined(); // fictional — no historical death year
    expect(o.equipment).toEqual([]);
    expect(o.rank).toBe('captain');
    // Age 18–29 on arrival.
    const age = 200 - o.birthYear;
    expect(age).toBeGreaterThanOrEqual(18);
    expect(age).toBeLessThanOrEqual(29);
    // Stats in the believable band.
    for (const v of Object.values(o.stats)) {
      expect(v).toBeGreaterThanOrEqual(22);
      expect(v).toBeLessThanOrEqual(95);
    }
    // Any traits are real trait ids.
    for (const tr of o.traits ?? []) expect(VALID_TRAITS.has(tr)).toBe(true);
  });

  it('never collides with existing ids', () => {
    const rng = seededRng(7);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const o = generateFictionalOfficer(220, rng, seen);
      expect(seen.has(o.id)).toBe(false);
      seen.add(o.id);
    }
    expect(seen.size).toBe(200);
  });
});
