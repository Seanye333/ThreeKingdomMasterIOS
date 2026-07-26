import { describe, it, expect } from 'vitest';
import { resolveSeason } from './resolution';
import { buildInitialCities } from '../data/cities';

/**
 * 長圍轉化 — an AI (or delegated) column that reaches a strongly-walled city
 * it cannot storm digs in and INVESTS it instead. The camp has to survive
 * into the next turn as a `besieging` command, or the siege pass (food drain
 * / sortie / 開城) never runs and the whole system is inert.
 *
 * This is the regression these tests were written for: the conversion set
 * `targetX` on the shared command object, after which the arrived-cells
 * filter picked the same command up a SECOND time. Two entries with one
 * officerId then clustered together in the field-merge pass, which added
 * that id to `absorbed` — and the `!absorbed.has(officerId)` filter dropped
 * BOTH copies. The siege command vanished on the turn it was created, so in
 * 1,100+ observed turns not one investment ever reached 開城 or 突圍.
 */

const mkOfficer = (id: string, forceId: string, locationCityId: string) => ({
  id, name: { zh: id, en: id }, skills: [], traits: [], equipment: [],
  stats: { war: 80, leadership: 75, intelligence: 60, politics: 50, charisma: 50 },
  forceId, locationCityId, status: 'idle', task: null,
}) as never;

/** A defender strong enough to trip `garrisonHolds`, behind tier-3 walls. */
function fixtures() {
  const list = buildInitialCities({});
  const cities = Object.fromEntries(list.map((c) => [c.id, { ...c }]));
  cities['luoyang'] = { ...cities['luoyang'], ownerForceId: 'atk', troops: 20_000, food: 200_000, gold: 5000 };
  cities['changan'] = {
    ...cities['changan'], ownerForceId: 'def',
    // Garrison under 1.3× the besiegers (so no sortie) but strong enough that
    // troops*(1+defense/150) >= besiegers*0.95 — the invest condition.
    troops: 9000, defense: 95, wallTier: 3, food: 300_000, gold: 5000,
  };
  return cities;
}

const input = (cities: Record<string, unknown>, rng: () => number) => ({
  date: { year: 200, season: 'spring', month: 1, phase: 'upper' } as never,
  cities: cities as never,
  officers: {
    zhang: mkOfficer('zhang', 'atk', 'luoyang'),
    guard: mkOfficer('guard', 'def', 'changan'),
  } as never,
  forces: {} as never,
  pendingCommands: {
    zhang: {
      type: 'march', officerId: 'zhang', cityId: 'luoyang', targetCityId: 'changan',
      troops: 12_000, seasonsRemaining: 1, totalSeasons: 1, food: 200_000,
    },
  } as never,
  diplomacy: { relations: {} } as never,
  runtimeBonds: [], lostItems: [],
  // No player force — the column is a pure AI host, which is what invests.
  playerForceId: null,
  rng,
});

describe('長圍轉化 — the invested camp must survive the turn that creates it', () => {
  it('carries the besieging command into next turn', () => {
    const cities = fixtures();
    // rng < 0.6 makes the conversion fire; it also keeps the sortie roll低.
    const out = resolveSeason(input(cities, () => 0.1));

    const invested = (out.report?.entries ?? []).filter((e) => e.textZh?.includes('長圍'));
    expect(invested.length, 'the column should invest rather than storm').toBeGreaterThan(0);

    const kept = out.keptCommands ?? {};
    const cmd = kept['zhang'] as { besieging?: string; holding?: boolean } | undefined;
    expect(cmd, 'the siege camp must be carried forward, not dropped').toBeDefined();
    expect(cmd?.besieging).toBe('changan');
    expect(cmd?.holding).toBe(true);
  });

  it('leaves a live army on the map for the camp', () => {
    const cities = fixtures();
    const out = resolveSeason(input(cities, () => 0.1));
    const armies = Object.values(out.armies ?? {}) as Array<{ besieging?: string }>;
    expect(armies.some((a) => a.besieging === 'changan'),
      'the besieging column must still exist as an army').toBe(true);
  });

  it('a besieging camp fed back in keeps besieging (the siege actually runs)', () => {
    const cities = fixtures();
    const first = resolveSeason(input(cities, () => 0.1));
    const carried = first.keptCommands ?? {};
    expect(carried['zhang']).toBeDefined();

    // Feed the carried command back in, exactly as the store does.
    const second = resolveSeason({
      ...input(first.cities as never, () => 0.1),
      cities: first.cities as never,
      officers: first.officers as never,
      pendingCommands: carried as never,
    });
    const cmd2 = (second.keptCommands ?? {})['zhang'] as { besieging?: string } | undefined;
    expect(cmd2?.besieging, 'the siege must persist across turns').toBe('changan');
    // And it must be doing something: the invested city loses food each turn.
    const before = (first.cities as Record<string, { food: number }>)['changan'].food;
    const after = (second.cities as Record<string, { food: number }>)['changan'].food;
    expect(after, 'an invested city should be drained').toBeLessThan(before);
  });
});
