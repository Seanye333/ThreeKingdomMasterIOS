import { describe, it, expect } from 'vitest';
import { CHALLENGES, findChallenge, evaluateChallenge, challengeStars, totalStars, effectiveDeadline } from './challenges';
import { SCENARIOS } from './index';
import type { ObjectiveContext } from '../systems/objectives';

/** Build a minimal ObjectiveContext from sparse overrides. */
function ctx(overrides: Partial<ObjectiveContext>): ObjectiveContext {
  return {
    scenarioId: null,
    playerForceId: 'cao',
    cities: {},
    officers: {},
    year: 200,
    liveForceIds: new Set(['cao']),
    isEmperor: false,
    ...overrides,
  };
}

describe('challenge catalog', () => {
  it('every challenge points at a real scenario and force', () => {
    for (const c of CHALLENGES) {
      const scn = SCENARIOS.find((s) => s.id === c.scenarioId);
      expect(scn, `scenario ${c.scenarioId} for ${c.id}`).toBeTruthy();
      const force = scn!.forces.find((f) => f.id === c.forceId);
      expect(force, `force ${c.forceId} in ${c.scenarioId} for ${c.id}`).toBeTruthy();
    }
  });

  it('every hold-cities goal references cities present in its scenario', () => {
    for (const c of CHALLENGES) {
      if (c.goal.kind !== 'hold-cities') continue;
      const scn = SCENARIOS.find((s) => s.id === c.scenarioId)!;
      const cityIds = new Set(scn.cities.map((city) => city.id));
      for (const id of c.goal.cityIds) {
        expect(cityIds.has(id), `city ${id} in ${c.scenarioId} for ${c.id}`).toBe(true);
      }
    }
  });

  it('every defeat-force goal references a force present in its scenario', () => {
    for (const c of CHALLENGES) {
      if (c.goal.kind !== 'defeat-force') continue;
      const scn = SCENARIOS.find((s) => s.id === c.scenarioId)!;
      const forceIds = new Set(scn.forces.map((f) => f.id));
      expect(forceIds.has(c.goal.forceId), `force ${c.goal.forceId} in ${c.scenarioId}`).toBe(true);
    }
  });

  it('challenge ids are unique', () => {
    const ids = CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('findChallenge resolves ids and rejects unknowns', () => {
    expect(findChallenge('ch-guandu-cao')?.id).toBe('ch-guandu-cao');
    expect(findChallenge('nope')).toBeNull();
    expect(findChallenge(null)).toBeNull();
  });
});

describe('evaluateChallenge', () => {
  const defeatGuandu = findChallenge('ch-guandu-cao')!; // defeat yuan-shao by 204

  it('wins when the defeat-force goal is met before the deadline', () => {
    const status = evaluateChallenge(
      defeatGuandu,
      ctx({ year: 202, liveForceIds: new Set(['cao']) }), // yuan-shao gone
    );
    expect(status).toBe('won');
  });

  it('stays ongoing while the target lives and the clock runs', () => {
    const status = evaluateChallenge(
      defeatGuandu,
      ctx({ year: 202, liveForceIds: new Set(['cao', 'yuan-shao']) }),
    );
    expect(status).toBe('ongoing');
  });

  it('loses when the goal deadline lapses unmet', () => {
    const status = evaluateChallenge(
      defeatGuandu,
      ctx({ year: 205, liveForceIds: new Set(['cao', 'yuan-shao']) }),
    );
    expect(status).toBe('lost');
  });

  it('loses instantly when the player force is wiped out', () => {
    const status = evaluateChallenge(
      defeatGuandu,
      ctx({ year: 201, liveForceIds: new Set(['yuan-shao']) }),
    );
    expect(status).toBe('lost');
  });

  it('survive-until challenges win on reaching the year, lose only if wiped', () => {
    const survive = findChallenge('ch-chibi-sun')!; // survive to 211
    expect(
      evaluateChallenge(survive, ctx({ playerForceId: 'sun', year: 210, liveForceIds: new Set(['sun']) })),
    ).toBe('ongoing');
    expect(
      evaluateChallenge(survive, ctx({ playerForceId: 'sun', year: 211, liveForceIds: new Set(['sun']) })),
    ).toBe('won');
    expect(
      evaluateChallenge(survive, ctx({ playerForceId: 'sun', year: 209, liveForceIds: new Set(['cao']) })),
    ).toBe('lost');
  });

  it('scores stars by how early an objective challenge is won', () => {
    const guandu = findChallenge('ch-guandu-cao')!; // defeat by 204
    expect(effectiveDeadline(guandu)).toBe(204);
    expect(challengeStars(guandu, 197)).toBe(3); // 7 years early
    expect(challengeStars(guandu, 201)).toBe(2); // 3 years early
    expect(challengeStars(guandu, 204)).toBe(1); // just made it
  });

  it('awards survive-until challenges full stars (cannot finish early)', () => {
    const chibi = findChallenge('ch-chibi-sun')!; // survive to 211
    expect(effectiveDeadline(chibi)).toBe(211);
    expect(challengeStars(chibi, 211)).toBe(3);
  });

  it('totalStars sums best stars across records', () => {
    expect(totalStars({})).toBe(0);
    expect(totalStars({ a: { bestYear: 200, bestStars: 3 }, b: { bestYear: 210, bestStars: 2 } })).toBe(5);
  });

  it('hold-cities challenges win only when every city is held', () => {
    const seizeShu = findChallenge('ch-chibi-liu')!; // chengdu + hanzhong by 217
    const both = {
      chengdu: { id: 'chengdu', ownerForceId: 'liu-bei' },
      hanzhong: { id: 'hanzhong', ownerForceId: 'liu-bei' },
    } as unknown as ObjectiveContext['cities'];
    const one = {
      chengdu: { id: 'chengdu', ownerForceId: 'liu-bei' },
      hanzhong: { id: 'hanzhong', ownerForceId: 'cao' },
    } as unknown as ObjectiveContext['cities'];
    expect(
      evaluateChallenge(seizeShu, ctx({ playerForceId: 'liu-bei', year: 215, liveForceIds: new Set(['liu-bei']), cities: both })),
    ).toBe('won');
    expect(
      evaluateChallenge(seizeShu, ctx({ playerForceId: 'liu-bei', year: 215, liveForceIds: new Set(['liu-bei']), cities: one })),
    ).toBe('ongoing');
  });
});
