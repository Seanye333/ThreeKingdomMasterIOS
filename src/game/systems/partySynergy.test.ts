import { describe, it, expect } from 'vitest';
import { partySynergies, PARTY_SYNERGY_CAP } from './partySynergy';
import type { Officer } from '../types';

let seq = 0;
const off = (p: Partial<Officer> & { war?: number; int?: number; lead?: number }): Officer => ({
  id: `o${seq++}`, name: { zh: 'x', en: 'x' }, birthYear: 170,
  stats: { leadership: p.lead ?? 60, war: p.war ?? 60, intelligence: p.int ?? 60, politics: 60, charisma: 60 },
  loyalty: p.loyalty ?? 80, locationCityId: null, forceId: p.forceId ?? 'wei',
  status: 'idle', task: null, equipment: {} as never, skills: [], rank: 'general',
  ...p,
} as Officer);

describe('出陣羈絆 — lineup archetypes', () => {
  it('a lone commander triggers nothing', () => {
    const r = partySynergies([off({ war: 99, int: 99 })]);
    expect(r.synergies).toHaveLength(0);
    expect(r.powerMul).toBe(1);
  });

  it('智勇相濟 needs a valorous AND a keen officer, two different people', () => {
    const both = partySynergies([off({ war: 90, int: 50 }), off({ war: 50, int: 90 })]);
    expect(both.synergies.map((s) => s.id)).toContain('wits-valor');
    // A single 文武全才 does not count as 智勇相濟 (needs a second body).
    const solo = partySynergies([off({ war: 90, int: 90 }), off({ war: 50, int: 50 })]);
    expect(solo.synergies.map((s) => s.id)).not.toContain('wits-valor');
  });

  it('猛虎成群 fires with three fierce generals', () => {
    const r = partySynergies([off({ war: 85 }), off({ war: 83 }), off({ war: 88 })]);
    expect(r.synergies.map((s) => s.id)).toContain('tiger-pack');
  });

  it('諸兵種協同 rewards a spread of arms', () => {
    const r = partySynergies([
      off({ war: 92, lead: 85 }),  // spearmen
      off({ war: 86, lead: 60 }),  // cavalry
      off({ war: 50, int: 82 }),   // archers
    ]);
    expect(r.synergies.map((s) => s.id)).toContain('combined-arms-3');
  });

  it('鄉黨相扶 fires when two share a hometown', () => {
    const r = partySynergies([
      off({ hometownCityId: 'zhuo' }),
      off({ hometownCityId: 'zhuo' }),
    ]);
    expect(r.synergies.map((s) => s.id)).toContain('kinsmen');
  });

  it('the combined bonus is capped', () => {
    // Stack many archetypes at once; the total edge must not exceed the cap.
    const r = partySynergies([
      off({ war: 92, int: 90, lead: 85, hometownCityId: 'x', loyalty: 99, birthYear: 150 }),
      off({ war: 86, int: 85, lead: 60, hometownCityId: 'x', loyalty: 99, birthYear: 155 }),
      off({ war: 84, int: 82, lead: 50, hometownCityId: 'x', loyalty: 99, birthYear: 190 }),
    ]);
    expect(r.synergies.length).toBeGreaterThan(2);
    expect(r.powerMul).toBeLessThanOrEqual(1 + PARTY_SYNERGY_CAP + 1e-9);
    expect(r.powerMul).toBeGreaterThan(1);
  });
});
