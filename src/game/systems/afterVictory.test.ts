import { describe, expect, it } from 'vitest';
import {
  peaceDepth, postVictoryAmbitionBoost, peaceReport,
  POST_VICTORY_MAX_BOOST, PEACE_SHARE, POST_VICTORY_CONFIDANT_RAPPORT,
} from './afterVictory';
import type { PostVictoryContext } from './afterVictory';
import type { City, EntityId, Force, Officer } from '../types';

/**
 * 承平之亂 — the pressure that makes playing on after victory worth doing.
 * It adds no new engine: everything here feeds `factionBoost`, the per-officer
 * betrayal bonus §7.5 already consumes, so these tests are about WHEN and HOW
 * HARD the thumb presses.
 */

const off = (o: Partial<Officer> & { id: string }): Officer =>
  ({
    id: o.id, name: { zh: o.id, en: o.id }, birthYear: 165,
    stats: { leadership: 85, war: 85, intelligence: 70, politics: 65, charisma: 65, ...(o.stats ?? {}) },
    loyalty: 60, locationCityId: 'c1', forceId: 'P', status: 'idle',
    task: null, equipment: [], skills: [], rank: 'soldier',
    ...o,
  }) as Officer;

/** `mine` of `total` cities held by the player. */
function realm(mine: number, total: number): Record<EntityId, City> {
  const cities: Record<EntityId, City> = {};
  for (let i = 0; i < total; i++) {
    cities[`c${i}`] = { id: `c${i}`, name: { zh: `c${i}`, en: `c${i}` }, ownerForceId: i < mine ? 'P' : 'R' } as City;
  }
  return cities;
}

function ctx(over: Partial<PostVictoryContext> = {}): PostVictoryContext {
  return {
    officers: {
      ruler: off({ id: 'ruler', loyalty: 100 }),
      general: off({ id: 'general' }),
    },
    cities: realm(20, 20),
    forces: { P: { id: 'P', rulerOfficerId: 'ruler' } as Force },
    playerForceId: 'P',
    ...over,
  };
}

describe('peaceDepth — how little is left to fight', () => {
  it('is nothing while a real war is still on', () => {
    expect(peaceDepth(ctx({ cities: realm(10, 20) }))).toBe(0);
    expect(peaceDepth(ctx({ cities: realm(Math.floor(20 * PEACE_SHARE) - 1, 20) }))).toBe(0);
  });

  it('is total once the map is yours', () => {
    expect(peaceDepth(ctx({ cities: realm(20, 20) }))).toBe(1);
  });

  it('ramps between — a hegemon ending still has rivals to point at', () => {
    const d = peaceDepth(ctx({ cities: realm(18, 20) }));
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(1);
  });

  it('is nothing without a player, or on an empty map', () => {
    expect(peaceDepth(ctx({ playerForceId: null }))).toBe(0);
    expect(peaceDepth(ctx({ cities: {} }))).toBe(0);
  });
});

describe('postVictoryAmbitionBoost — who starts weighing their own worth', () => {
  it('says nothing while the war is on', () => {
    expect(postVictoryAmbitionBoost(ctx({ cities: realm(10, 20) }))).toEqual({});
  });

  it('presses on a great captain once the realm is quiet', () => {
    const b = postVictoryAmbitionBoost(ctx());
    expect(b.general).toBeGreaterThan(0);
    expect(b.general).toBeLessThanOrEqual(POST_VICTORY_MAX_BOOST);
  });

  it('never touches the ruler — you do not rebel against yourself', () => {
    expect(postVictoryAmbitionBoost(ctx()).ruler).toBeUndefined();
  });

  it('leaves the loyal and the confidants alone — peace makes no warlord of a 心腹', () => {
    const loyal = ctx({
      officers: { ruler: off({ id: 'ruler' }), steady: off({ id: 'steady', traits: ['loyal'] }) },
    });
    expect(postVictoryAmbitionBoost(loyal).steady).toBeUndefined();

    const trusted = ctx({ lordRapport: { general: POST_VICTORY_CONFIDANT_RAPPORT } });
    expect(postVictoryAmbitionBoost(trusted).general).toBeUndefined();
  });

  it('needs a man who could actually do it — clerks stay clerks', () => {
    const clerk = ctx({
      officers: { ruler: off({ id: 'ruler' }), clerk: off({ id: 'clerk', stats: { leadership: 40, war: 40 } }) },
    });
    expect(postVictoryAmbitionBoost(clerk).clerk).toBeUndefined();
  });

  it('warmth restrains and resentment emboldens', () => {
    const warm = postVictoryAmbitionBoost(ctx({ lordRapport: { general: 55 }, officers: {
      ruler: off({ id: 'ruler' }), general: off({ id: 'general', loyalty: 90 }),
    } }));
    const sour = postVictoryAmbitionBoost(ctx({ lordRapport: { general: -40 }, officers: {
      ruler: off({ id: 'ruler' }), general: off({ id: 'general', loyalty: 90 }),
    } }));
    expect(sour.general ?? 0).toBeGreaterThan(warm.general ?? 0);
  });

  it('a contented realm at peace stays safe', () => {
    const content = ctx({
      officers: { ruler: off({ id: 'ruler' }), general: off({ id: 'general', loyalty: 100 }) },
      lordRapport: { general: 60 },
    });
    expect(postVictoryAmbitionBoost(content).general ?? 0).toBe(0);
  });

  it('ignores men of other houses, the dead and the captive', () => {
    const c = ctx({
      officers: {
        ruler: off({ id: 'ruler' }),
        theirs: off({ id: 'theirs', forceId: 'R' }),
        gone: off({ id: 'gone', status: 'dead' }),
        held: off({ id: 'held', status: 'imprisoned' }),
      },
    });
    expect(postVictoryAmbitionBoost(c)).toEqual({});
  });

  it('stays inside its ceiling so it stacks with §7.5 without swamping it', () => {
    const worst = ctx({
      officers: {
        ruler: off({ id: 'ruler' }),
        warlord: off({ id: 'warlord', loyalty: 0, stats: { leadership: 100, war: 100 } }),
      },
      lordRapport: { warlord: -100 },
    });
    expect(postVictoryAmbitionBoost(worst).warlord).toBeLessThanOrEqual(POST_VICTORY_MAX_BOOST);
  });
});

describe('peaceReport', () => {
  it('says nothing while the war is on', () => {
    expect(peaceReport(ctx({ cities: realm(5, 20) }))).toBeNull();
  });

  it('reports a quiet court when nobody is stirring', () => {
    const calm = ctx({
      officers: { ruler: off({ id: 'ruler' }), steady: off({ id: 'steady', traits: ['loyal'] }) },
    });
    expect(peaceReport(calm)!.zh).toContain('未見異心');
  });

  it('counts the restless when there are any', () => {
    const r = peaceReport(ctx())!;
    expect(r.zh).toContain('1 人');
    expect(r.en).toContain('1 of your commanders');
  });
});
