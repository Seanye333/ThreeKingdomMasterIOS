import { describe, it, expect } from 'vitest';
import { officerGrade, gradeFromScore, officerLevel } from './officerGrade';
import type { Officer, OfficerStats } from '../types';

function makeOfficer(stats: Partial<OfficerStats> = {}): Officer {
  const base: OfficerStats = {
    leadership: 50, war: 50, intelligence: 50, politics: 50, charisma: 50, ...stats,
  };
  return {
    id: 't', name: { zh: '測', en: 'T' }, forceId: 'p',
    stats: base, skills: [], traits: [], equipment: [], xp: 0,
    loyalty: 100, status: 'idle', task: null, locationCityId: 'c1',
  } as unknown as Officer;
}

describe('officerGrade', () => {
  it('cuts tiers at the documented score thresholds', () => {
    expect(gradeFromScore(110)).toBe('diamond');
    expect(gradeFromScore(109)).toBe('platinum');
    expect(gradeFromScore(100)).toBe('platinum');
    expect(gradeFromScore(99)).toBe('gold');
    expect(gradeFromScore(92)).toBe('gold');
    expect(gradeFromScore(91)).toBe('silver');
    expect(gradeFromScore(82)).toBe('silver');
    expect(gradeFromScore(81)).toBe('bronze');
    expect(gradeFromScore(70)).toBe('bronze');
    expect(gradeFromScore(69)).toBe('iron');
  });

  it('reaches 白金/鑽石 only for maxed, well-rounded legends', () => {
    // A fully-broken-through paragon (all five near the cap) tops the ladder.
    const paragon = makeOfficer({ leadership: 112, war: 120, intelligence: 110, politics: 105, charisma: 110 });
    expect(officerGrade(paragon).grade).toBe('diamond');
    const peerless = makeOfficer({ leadership: 100, war: 105, intelligence: 98, politics: 96, charisma: 100 });
    expect(peerless && ['platinum', 'diamond']).toContain(officerGrade(peerless).grade);
  });

  it('rates an elite all-rounder as gold and a green recruit as iron', () => {
    const elite = makeOfficer({ leadership: 95, war: 97, intelligence: 90, politics: 88, charisma: 92 });
    expect(officerGrade(elite).grade).toBe('gold');
    const green = makeOfficer({ leadership: 45, war: 50, intelligence: 40, politics: 48, charisma: 42 });
    expect(officerGrade(green).grade).toBe('iron');
  });

  it('rewards a one-stat specialist via the best-stat weighting', () => {
    // Avg is mediocre, but a 98 war should still pull a duelist above iron.
    const duelist = makeOfficer({ leadership: 60, war: 98, intelligence: 40, politics: 35, charisma: 45 });
    const g = officerGrade(duelist);
    expect(g.grade === 'silver' || g.grade === 'bronze').toBe(true);
  });
});

describe('officerLevel', () => {
  it('honors an explicit stored level (scenario/custom/test override)', () => {
    const o = { ...makeOfficer({ war: 95 }), level: 1 } as Officer;
    expect(officerLevel(o)).toBe(1);
    const vet = { ...makeOfficer({ war: 40 }), level: 20 } as Officer;
    expect(officerLevel(vet)).toBe(20);
  });

  it('derives a real level for a roster officer with no stored level', () => {
    const elite = makeOfficer({ leadership: 90, war: 98, intelligence: 85, politics: 80, charisma: 88 });
    // Elite prowess clears the 必殺 unlock (Lv.14).
    expect(officerLevel(elite)).toBeGreaterThanOrEqual(14);
    const recruit = makeOfficer({ leadership: 35, war: 40, intelligence: 30, politics: 30, charisma: 35 });
    // A green recruit sits below the combo unlock (Lv.10).
    expect(officerLevel(recruit)).toBeLessThan(10);
  });

  it('rises with accumulated growth XP', () => {
    const base = makeOfficer({ war: 70, leadership: 65 });
    const seasoned = { ...base, xp: 1000 } as Officer;
    expect(officerLevel(seasoned)).toBeGreaterThan(officerLevel(base));
  });
});
