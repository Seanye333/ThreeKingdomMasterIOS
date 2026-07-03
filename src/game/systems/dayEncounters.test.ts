import { describe, it, expect } from 'vitest';
import { computeDayEncounters, marchPositionAtDay, INTERCEPT_DIST } from './dayEncounters';
import { resolveSeason } from './resolution';
import { buildInitialCities } from '../data/cities';
import { cityPos } from '../data/cityGeo';
import { terrainRoute, positionAlongRoute } from '../data/territories';

/** 真日級遭遇 — the day-sweep must catch columns that pass THROUGH each
 *  other mid-slice (the old once-per-season midpoint sample missed them),
 *  and rerouting before contact must dodge the clash. */

const mkOfficer = (id: string, forceId: string) => ({
  id, name: { zh: id, en: id }, skills: [], traits: [], equipment: [],
  stats: { war: 80, leadership: 75, intelligence: 60, politics: 50, charisma: 50 },
  forceId, locationCityId: 'luoyang', status: 'idle', task: null,
}) as never;

function fixtures() {
  const list = buildInitialCities({});
  const cities = Object.fromEntries(list.map((c) => [c.id, { ...c }]));
  const lp = cityPos(cities['luoyang']);
  const cp = cityPos(cities['chengdu']);
  const route = terrainRoute(lp.x, lp.y, cp.x, cp.y);
  // A camp squatting at 75% of the 洛陽→成都 road — far beyond the old
  // midpoint sample's reach on a road this long.
  const campAt = positionAlongRoute(route, 0.75);
  return { cities, campAt };
}

describe('computeDayEncounters — 真日級接触扫描', () => {
  const officers = { mover: mkOfficer('mover', 'me'), blocker: mkOfficer('blocker', 'foe') };
  const diplomacy = { relations: {} } as never;

  it('catches a mid-slice pass-through the old midpoint sample missed', () => {
    const { cities, campAt } = fixtures();
    const mover = {
      type: 'march', officerId: 'mover', cityId: 'luoyang', targetCityId: 'chengdu',
      troops: 6000, totalSeasons: 1, seasonsRemaining: 1,
    } as never;
    const blocker = {
      type: 'march', officerId: 'blocker', cityId: 'changan', targetCityId: 'luoyang',
      troops: 2000, holding: true, targetX: campAt.x, targetY: campAt.y,
      totalSeasons: 5, seasonsRemaining: 5,
    } as never;
    // Old behaviour = a single day-0 sample: too far apart to trigger.
    const p0 = marchPositionAtDay(mover as never, cities, 0)!;
    expect(Math.hypot(p0.x - campAt.x, p0.y - campAt.y)).toBeGreaterThan(INTERCEPT_DIST);
    // Day sweep: the walk closes the gap later in the half-month.
    const contacts = computeDayEncounters([mover, blocker] as never[], officers as never, cities, diplomacy);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].day).toBeGreaterThan(0);
    // Contact point sits by the camp, not at the slice midpoint.
    expect(Math.hypot(contacts[0].pb.x - campAt.x, contacts[0].pb.y - campAt.y)).toBeLessThan(1);
  });

  it('rerouting away from the camp dodges the encounter entirely', () => {
    const { cities, campAt } = fixtures();
    const mover = {
      type: 'march', officerId: 'mover', cityId: 'luoyang', targetCityId: 'jianye',
      troops: 6000, totalSeasons: 1, seasonsRemaining: 1,
    } as never;
    const blocker = {
      type: 'march', officerId: 'blocker', cityId: 'changan', targetCityId: 'luoyang',
      troops: 2000, holding: true, targetX: campAt.x, targetY: campAt.y,
      totalSeasons: 5, seasonsRemaining: 5,
    } as never;
    const contacts = computeDayEncounters([mover, blocker] as never[], officers as never, cities, diplomacy);
    expect(contacts).toHaveLength(0);
  });

  it('same-force and friendly pairs never register contacts', () => {
    const { cities, campAt } = fixtures();
    const friendly = { mover: mkOfficer('mover', 'me'), blocker: mkOfficer('blocker', 'me') };
    const mover = {
      type: 'march', officerId: 'mover', cityId: 'luoyang', targetCityId: 'chengdu',
      troops: 6000, totalSeasons: 1, seasonsRemaining: 1,
    } as never;
    const blocker = {
      type: 'march', officerId: 'blocker', cityId: 'changan', targetCityId: 'luoyang',
      troops: 2000, holding: true, targetX: campAt.x, targetY: campAt.y,
      totalSeasons: 5, seasonsRemaining: 5,
    } as never;
    expect(computeDayEncounters([mover, blocker] as never[], friendly as never, cities, diplomacy)).toHaveLength(0);
  });
});

describe('resolveSeason — 真日級拦截接入', () => {
  it('a mid-slice ambush resolves with a 「第X日」 clash entry', () => {
    const { cities, campAt } = fixtures();
    cities['luoyang'] = { ...cities['luoyang'], ownerForceId: 'me', troops: 20000 };
    cities['changan'] = { ...cities['changan'], ownerForceId: 'foe', troops: 20000 };
    const out = resolveSeason({
      date: { year: 200, season: 'spring', month: 1, phase: 'upper' } as never,
      cities: cities as never,
      officers: {
        mover: mkOfficer('mover', 'me'),
        blocker: mkOfficer('blocker', 'foe'),
      } as never,
      forces: {} as never,
      pendingCommands: {
        mover: {
          type: 'march', cityId: 'luoyang', targetCityId: 'chengdu', officerId: 'mover',
          troops: 6000, totalSeasons: 1, seasonsRemaining: 1,
        } as never,
        // Under the 2500-troop bar so the clash resolves abstractly (not
        // deferred to an interactive battle) and writes a report entry.
        blocker: {
          type: 'march', cityId: 'changan', targetCityId: 'luoyang', officerId: 'blocker',
          troops: 2000, holding: true, targetX: campAt.x, targetY: campAt.y,
          totalSeasons: 5, seasonsRemaining: 5,
        } as never,
      },
      diplomacy: { relations: {} } as never,
      runtimeBonds: [], lostItems: [],
      playerForceId: 'me',
      rng: () => 0.0,
    });
    const clash = out.report.entries.find((e) => /第\d+日,/.test(e.textZh ?? ''));
    expect(clash).toBeTruthy();
    expect(clash!.kind).toBe('battle');
  });
});
