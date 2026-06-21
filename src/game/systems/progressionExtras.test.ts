import { describe, it, expect } from 'vitest';
import { applyBreakthrough, breakthroughTitle } from './growth';
import { ageBand } from './aging';
import { activeItemSets, itemSetPowerMul } from '../data/itemSets';
import { CIVIC_TITLES_BY_ID } from '../data/titles';
import { gradeRank } from './officerGrade';
import type { Officer, OfficerStats } from '../types';

function makeOfficer(stats: Partial<OfficerStats> = {}, extra: Partial<Officer> = {}): Officer {
  const base: OfficerStats = { leadership: 60, war: 90, intelligence: 50, politics: 50, charisma: 50, ...stats };
  return {
    id: 't', name: { zh: '測', en: 'T' }, forceId: 'p',
    stats: base, skills: [], traits: [], equipment: [], xp: 3000,
    loyalty: 100, status: 'idle', task: null, locationCityId: 'c1', birthYear: 180,
    ...extra,
  } as unknown as Officer;
}

describe('breakthrough milestones', () => {
  it('awakens a signature trait at the 3rd breakthrough, legendary at the 5th', () => {
    const at3 = applyBreakthrough(makeOfficer({}, { breakthroughs: 2 }));
    expect(at3.officer.breakthroughs).toBe(3);
    expect((at3.officer.traits as string[]).includes('martial-valor')).toBe(true);

    const at5 = applyBreakthrough(makeOfficer({}, { breakthroughs: 4 }));
    expect(at5.officer.breakthroughs).toBe(5);
    expect((at5.officer.traits as string[]).includes('matchless')).toBe(true);
  });

  it('non-milestone breakthroughs grant no trait', () => {
    const at2 = applyBreakthrough(makeOfficer({}, { breakthroughs: 1 }));
    expect(at2.officer.breakthroughs).toBe(2);
    expect(at2.officer.traits?.length ?? 0).toBe(0);
  });

  it('breakthroughTitle climbs and is null below the first', () => {
    expect(breakthroughTitle(undefined)).toBeNull();
    expect(breakthroughTitle(3)?.zh).toBe('大成');
    expect(breakthroughTitle(5)?.zh).toBe('通神');
    expect(breakthroughTitle(99)?.zh).toBe('通神'); // clamps to the top
  });
});

describe('神兵譜 item sets', () => {
  it('activates only when the full set is held', () => {
    const partial = makeOfficer({}, { equipment: ['green-dragon', 'snake-spear'] });
    expect(activeItemSets(partial)).toHaveLength(0);
    const full = makeOfficer({}, { equipment: ['green-dragon', 'snake-spear', 'dragon-gut'] });
    const sets = activeItemSets(full);
    expect(sets.map((s) => s.id)).toContain('taoyuan-tigers');
    expect(itemSetPowerMul(full)).toBeCloseTo(1.1, 5);
  });
});

describe('ageBand', () => {
  it('marks prime years and flags decline in twilight', () => {
    expect(ageBand(35).id).toBe('prime');
    expect(ageBand(35).declining).toBe(false);
    expect(ageBand(60).declining).toBe(true);
    expect(ageBand(70).id).toBe('venerable');
  });
});

describe('appointment grade gates (data)', () => {
  it('top offices demand a higher 品階 than minor ones', () => {
    expect(gradeRank(CIVIC_TITLES_BY_ID['chancellor'].minGrade!))
      .toBeGreaterThan(gradeRank(CIVIC_TITLES_BY_ID['prefect'].minGrade!));
  });
});
