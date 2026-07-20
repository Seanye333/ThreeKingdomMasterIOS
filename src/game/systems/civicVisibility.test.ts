/**
 * 民政可見性 — the §1.11–§1.14 systems only matter if the player can SEE them
 * going wrong. These lock the three surfacing paths: the advisor names the rot
 * and hands over the command, and the achievement ledger knows the new kinds.
 */
import { describe, it, expect } from 'vitest';
import { adviseTips } from './advisor';
import { ACHIEVEMENTS } from '../data/achievements';
import type { City, Officer } from '../types';

function city(over: Partial<City> & { id: string }): City {
  return {
    id: over.id, name: { zh: '城', en: 'City' }, coords: { x: 0, y: 0 },
    adjacentCityIds: [], ownerForceId: 'me',
    population: 200_000, gold: 5000, food: 50_000, troops: 5000,
    agriculture: 100, commerce: 100, defense: 100, loyalty: 70,
    ...over,
  } as City;
}

function officer(id: string, cityId: string): Officer {
  return {
    id, name: { zh: '吏', en: 'Clerk' }, forceId: 'me', status: 'idle',
    loyalty: 80, birthYear: 180, locationCityId: cityId,
    stats: { war: 40, leadership: 40, intelligence: 70, politics: 80, charisma: 50 },
    skills: [],
  } as unknown as Officer;
}

const baseInput = (c: City, o: Officer) => ({
  cities: { [c.id]: c },
  officers: { [o.id]: o },
  armies: {},
  busyOfficerIds: new Set<string>(),
  playerForceId: 'me',
  season: 'spring' as const,
});

describe('軍師點出民政三患', () => {
  it('names a docket that has outgrown the court, and hands over 決獄', () => {
    const c = city({ id: 'a', caseload: 70 });
    const tips = adviseTips(baseInput(c, officer('o1', 'a')));
    const tip = tips.find((t) => t.id === 'docket-a');
    expect(tip).toBeTruthy();
    expect(tip!.zh).toContain('決獄');
    expect(tip!.action).toEqual({ kind: 'command', cityId: 'a', type: 'adjudicate', officerId: 'o1' });
  });

  it('names a gutted register and hands over 括戶', () => {
    const c = city({ id: 'b', hiddenHouseholds: 33 });
    const tip = adviseTips(baseInput(c, officer('o1', 'b'))).find((t) => t.id === 'hidden-b');
    expect(tip).toBeTruthy();
    expect(tip!.action).toMatchObject({ type: 'household-audit' });
  });

  it('names a cornered grain market and hands over 抑兼併', () => {
    const c = city({ id: 'c', hoardedGrain: 26 });
    const tip = adviseTips(baseInput(c, officer('o1', 'c'))).find((t) => t.id === 'hoard-c');
    expect(tip).toBeTruthy();
    expect(tip!.action).toMatchObject({ type: 'curb-hoarding' });
  });

  it('stays quiet while the books are in order — no nagging', () => {
    const c = city({ id: 'd', caseload: 10, hiddenHouseholds: 5, hoardedGrain: 2 });
    const tips = adviseTips(baseInput(c, officer('o1', 'd')));
    expect(tips.some((t) => t.id.startsWith('docket-') || t.id.startsWith('hidden-') || t.id.startsWith('hoard-')))
      .toBe(false);
  });

  it('falls back to 參考 (no button) when nobody is free to send', () => {
    const c = city({ id: 'e', caseload: 70 });
    const o = officer('o1', 'e');
    const tips = adviseTips({ ...baseInput(c, o), busyOfficerIds: new Set(['o1']) });
    expect(tips.find((t) => t.id === 'docket-e')!.action).toEqual({ kind: 'none' });
  });
});

describe('民政功業', () => {
  const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
  const kinds = new Set(ACHIEVEMENTS.map((a) => a.trigger.kind));

  it('registers all eight civic achievements', () => {
    for (const id of ['ach-clear-docket', 'ach-amnesty', 'ach-registers-whole', 'ach-break-hoard',
      'ach-open-exam', 'ach-immortal-verse', 'ach-shrine-raised', 'ach-sea-lord']) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('each new trigger kind is claimed by exactly one achievement', () => {
    for (const k of ['clear-docket', 'amnesty', 'registers-whole', 'break-hoard',
      'open-exam', 'immortal-verse', 'shrine-raised', 'sea-lord']) {
      expect(kinds.has(k as never)).toBe(true);
      expect(ACHIEVEMENTS.filter((a) => a.trigger.kind === k).length).toBe(1);
    }
  });
});
