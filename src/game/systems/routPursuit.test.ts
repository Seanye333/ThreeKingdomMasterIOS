import { describe, it, expect } from 'vitest';
import { resolveSeason } from './resolution';
import { buildInitialCities } from '../data/cities';
import { cityPos } from '../data/cityGeo';
import { terrainRoute, positionAlongRoute } from '../data/territories';

/** 潰軍與追擊 — a beaten army becomes a fleeing rout on the map instead of
 *  evaporating; hostile armies/garrisons cut routs down (掩殺), absorb
 *  stragglers (收降) and capture officers; a 殿軍 blunts the slaughter;
 *  reaching shelter folds the remnants into the garrison. */

const mkOfficer = (id: string, forceId: string, skills: string[] = []) => ({
  id, name: { zh: id, en: id }, skills, traits: [], equipment: [],
  stats: { war: 80, leadership: 75, intelligence: 60, politics: 50, charisma: 50 },
  forceId, locationCityId: 'luoyang', status: 'idle', task: null,
}) as never;

function fixtures() {
  const list = buildInitialCities({});
  const cities = Object.fromEntries(list.map((c) => [c.id, { ...c }]));
  // luoyang = player shelter (garrison kept < 4000 so it never sallies);
  // changan = the enemy realm's home.
  cities['luoyang'] = { ...cities['luoyang'], ownerForceId: 'me', troops: 3800, food: 90000, gold: 5000 };
  cities['changan'] = { ...cities['changan'], ownerForceId: 'foe', troops: 20000, food: 90000, gold: 5000 };
  return { cities };
}

const baseInput = (cities: Record<string, unknown>, officers: Record<string, unknown>, pendingCommands: Record<string, unknown>, rng: () => number) => ({
  date: { year: 200, season: 'spring', month: 1, phase: 'upper' } as never,
  cities: cities as never,
  officers: officers as never,
  forces: {} as never,
  pendingCommands: pendingCommands as never,
  diplomacy: { relations: {} } as never,
  runtimeBonds: [], lostItems: [],
  playerForceId: 'me',
  rng,
});

describe('潰軍生成 — a broken field army routs instead of evaporating', () => {
  it('the field-clash loser becomes a routed column fleeing to its nearest city', () => {
    const { cities } = fixtures();
    const lp = cityPos(cities['luoyang'] as never);
    const cp = cityPos(cities['chengdu'] as never);
    const campAt = positionAlongRoute(terrainRoute(lp.x, lp.y, cp.x, cp.y), 0.75);
    const out = resolveSeason(baseInput(cities, {
      mover: mkOfficer('mover', 'me'),
      blocker: mkOfficer('blocker', 'foe'),
    }, {
      // Player column (under the 2500 AI-亲征 bar) walks into a massive camp
      // — it loses the clash, and the survivors must ROUT, not vanish.
      mover: {
        type: 'march', cityId: 'luoyang', targetCityId: 'chengdu', officerId: 'mover',
        troops: 2400, totalSeasons: 1, seasonsRemaining: 1,
      },
      blocker: {
        type: 'march', cityId: 'changan', targetCityId: 'luoyang', officerId: 'blocker',
        troops: 20000, holding: true, targetX: campAt.x, targetY: campAt.y,
        totalSeasons: 5, seasonsRemaining: 5,
      },
      // rng 0.5 — above every 陣擒 capture chance, so the beaten commander
      // stays free to hold his survivors together (the rout must form).
    }, () => 0.5) as never);
    const kept = out.keptCommands?.['mover'] as { routed?: boolean; returning?: boolean; targetCityId?: string; fleeX?: number; troops?: number } | undefined;
    expect(kept?.routed).toBe(true);
    expect(kept?.returning).toBe(true);
    expect(kept?.targetCityId).toBe('luoyang'); // nearest (only) friendly city
    expect(kept?.fleeX).toBeTypeOf('number');
    // 2400 − 72% clash toll = 672 survivors, then −8% rout shed = 619 on the books.
    expect(kept?.troops).toBe(619);
    expect(out.armies?.['mover']?.routed).toBe(true);
    // The clash report names the rout's shelter.
    expect(out.report.entries.some((e) => (e.textZh ?? '').includes('潰走,奔'))).toBe(true);
  });

  it('a repulsed city assault routs overland instead of teleporting home', () => {
    const { cities } = fixtures();
    const out = resolveSeason(baseInput(cities, {
      mover: mkOfficer('mover', 'me'),
      wall: mkOfficer('wall', 'foe'),
    }, {
      mover: {
        type: 'march', cityId: 'luoyang', targetCityId: 'changan', officerId: 'mover',
        troops: 5000, totalSeasons: 1, seasonsRemaining: 1,
      },
    }, () => 0.99) as never); // high roll → the assault fails
    const kept = out.keptCommands?.['mover'] as { routed?: boolean; targetCityId?: string } | undefined;
    expect(kept?.routed).toBe(true);
    expect(kept?.targetCityId).toBe('luoyang');
    expect(out.armies?.['mover']?.routed).toBe(true);
    // Survivors were NOT credited back to the source this season — they are
    // still on the road (the rout carries them).
    expect(out.report.entries.some((e) => (e.textZh ?? '').includes('潰走,奔'))).toBe(true);
  });
});

describe('掩殺與收降 — hostile armies ride a rout down', () => {
  const routScene = (routTroops: number, companions?: { id: string; skills: string[] }) => {
    const { cities } = fixtures();
    const lp = cityPos(cities['luoyang'] as never);
    const ap = cityPos(cities['changan'] as never);
    const road = terrainRoute(lp.x, lp.y, ap.x, ap.y);
    const fleeAt = positionAlongRoute(road, 0.55);
    const fleeRoute = terrainRoute(fleeAt.x, fleeAt.y, ap.x, ap.y);
    const campAt = positionAlongRoute(fleeRoute, 0.5); // squarely on the flee path
    const officers: Record<string, unknown> = {
      runner: mkOfficer('runner', 'foe'),
      hunter: mkOfficer('hunter', 'me'),
    };
    if (companions) officers[companions.id] = mkOfficer(companions.id, 'foe', companions.skills);
    const pendingCommands: Record<string, unknown> = {
      // An enemy rout limping home along the luoyang→changan road.
      runner: {
        type: 'march', cityId: 'changan', targetCityId: 'changan', officerId: 'runner',
        troops: routTroops, routed: true, returning: true,
        fleeX: fleeAt.x, fleeY: fleeAt.y,
        totalSeasons: 2, seasonsRemaining: 2, food: 50000,
        ...(companions ? { additionalOfficerIds: [companions.id] } : {}),
      },
      // The player's camp sits squarely on its path.
      hunter: {
        type: 'march', cityId: 'luoyang', targetCityId: 'luoyang', officerId: 'hunter',
        troops: 6000, holding: true, targetX: campAt.x, targetY: campAt.y,
        totalSeasons: 5, seasonsRemaining: 5,
      },
    };
    return { cities, officers, pendingCommands };
  };

  it('a small rout is wiped out — officers captured, stragglers absorbed', () => {
    const { cities, officers, pendingCommands } = routScene(600);
    const out = resolveSeason(baseInput(cities, officers, pendingCommands, () => 0.0) as never);
    // 600 × 0.55 = 330 cut down → 270 left < 300 → annihilated.
    expect(out.keptCommands?.['runner']).toBeUndefined();
    const runner = out.officers['runner'] as { status: string; locationCityId?: string; capturedFromForceId?: string };
    expect(runner.status).toBe('imprisoned'); // rng 0 < 35% capture roll
    expect(runner.locationCityId).toBe('luoyang'); // dragged to the hunter's city
    expect(runner.capturedFromForceId).toBe('foe');
    const strike = out.report.entries.find((e) => e.battle?.routHunt);
    expect(strike?.battle?.routDestroyed).toBe(true);
    expect((strike?.textZh ?? '')).toContain('收降');
  });

  it('殿軍斷後 — a rear-guard officer blunts the strike and escapes capture', () => {
    const { cities, officers, pendingCommands } = routScene(600, { id: 'dianjun', skills: ['rear-guard'] });
    const out = resolveSeason(baseInput(cities, officers, pendingCommands, () => 0.0) as never);
    // killFrac 0.55 × 0.6 = 0.33 → 198 cut down → 402 survive the strike,
    // then −8% shed leaves 370 still fleeing next season.
    const kept = out.keptCommands?.['runner'] as { routed?: boolean; troops?: number } | undefined;
    expect(kept?.routed).toBe(true);
    expect(kept?.troops).toBe(370);
    const strike = out.report.entries.find((e) => e.battle?.routHunt);
    expect(strike).toBeTruthy();
    expect(strike?.battle?.routDestroyed).toBeUndefined();
    expect((strike?.textZh ?? '')).toContain('斷後');
    // Nobody was captured — the column still stands.
    expect((out.officers['runner'] as { status: string }).status).not.toBe('imprisoned');
    expect((out.officers['dianjun'] as { status: string }).status).not.toBe('imprisoned');
  });
});

describe('陣擒 — officers taken in the crush of a broken army', () => {
  const clashScene = (companions?: { id: string; skills: string[] }) => {
    const { cities } = fixtures();
    const lp = cityPos(cities['luoyang'] as never);
    const cp = cityPos(cities['chengdu'] as never);
    const campAt = positionAlongRoute(terrainRoute(lp.x, lp.y, cp.x, cp.y), 0.75);
    const officers: Record<string, unknown> = {
      mover: mkOfficer('mover', 'me'),
      blocker: mkOfficer('blocker', 'foe'),
    };
    if (companions) officers[companions.id] = mkOfficer(companions.id, 'me', companions.skills);
    return {
      cities, officers,
      pendingCommands: {
        mover: {
          type: 'march', cityId: 'luoyang', targetCityId: 'chengdu', officerId: 'mover',
          troops: 2400, totalSeasons: 1, seasonsRemaining: 1,
          ...(companions ? { additionalOfficerIds: [companions.id] } : {}),
        },
        blocker: {
          type: 'march', cityId: 'changan', targetCityId: 'luoyang', officerId: 'blocker',
          troops: 20000, holding: true, targetX: campAt.x, targetY: campAt.y,
          totalSeasons: 5, seasonsRemaining: 5,
        },
      },
    };
  };

  it('a low roll takes the beaten commander captive — the survivors scatter, no rout', () => {
    const { cities, officers, pendingCommands } = clashScene();
    const out = resolveSeason(baseInput(cities, officers, pendingCommands, () => 0.0) as never);
    const mover = out.officers['mover'] as { status: string; locationCityId?: string; capturedFromForceId?: string };
    expect(mover.status).toBe('imprisoned');
    expect(mover.locationCityId).toBe('changan'); // dragged to the victor's city
    expect(mover.capturedFromForceId).toBe('me');
    expect(out.keptCommands?.['mover']).toBeUndefined(); // no commander, no rout
    expect(out.report.entries.some((e) => (e.textZh ?? '').includes('陣擒'))).toBe(true);
  });

  it('殿軍 himself always cuts free of the press', () => {
    const { cities, officers, pendingCommands } = clashScene({ id: 'dianjun', skills: ['rear-guard'] });
    const out = resolveSeason(baseInput(cities, officers, pendingCommands, () => 0.0) as never);
    expect((out.officers['dianjun'] as { status: string }).status).not.toBe('imprisoned');
  });
});

describe('潰軍歸城 — reaching shelter folds the remnants into the garrison', () => {
  it('an arriving rout merges into the city (no source deduction) and frees its officers', () => {
    const { cities } = fixtures();
    const lp = cityPos(cities['luoyang'] as never);
    const ap = cityPos(cities['changan'] as never);
    const fleeAt = positionAlongRoute(terrainRoute(lp.x, lp.y, ap.x, ap.y), 0.4);
    const before = (cities['luoyang'] as { troops: number }).troops;
    const out = resolveSeason(baseInput(cities, {
      runner2: mkOfficer('runner2', 'me'),
    }, {
      runner2: {
        type: 'march', cityId: 'luoyang', targetCityId: 'luoyang', officerId: 'runner2',
        troops: 800, routed: true, returning: true,
        fleeX: fleeAt.x, fleeY: fleeAt.y,
        totalSeasons: 2, seasonsRemaining: 1, food: 50000,
      },
    }, () => 0.0) as never);
    expect(out.keptCommands?.['runner2']).toBeUndefined();
    const runner = out.officers['runner2'] as { status: string; task: string | null; locationCityId?: string };
    expect(runner.locationCityId).toBe('luoyang');
    expect(runner.task).toBeNull();
    // The men fold IN (carried by the column) — the garrison grows.
    expect((out.cities['luoyang'] as { troops: number }).troops).toBeGreaterThan(before);
    expect(out.report.entries.some((e) => (e.textZh ?? '').includes('收容殘卒'))).toBe(true);
  });
});
