import { describe, it, expect } from 'vitest';
import { errandsAt, resolveErrand, mergeDeeds, takesErrands, errandCap,
         type Errand } from './careerErrands';
import { RANK_COMMONER, RANK_RETAINER } from './career';
import { mkOfficer } from '../../test/factories';
import type { HeroicDeeds } from '../types/deeds';

const seq = (...xs: number[]) => { let i = 0; return () => xs[i++ % xs.length]; };

// 差事只讀城的四個欄位,其餘不必湊
const city = (over: Record<string, unknown> = {}) =>
  ({ id: 'c1', loyalty: 70, commerce: 40, food: 40000, population: 90000, ...over } as never);

const hero = (over: Record<string, unknown> = {}) =>
  mkOfficer({
    id: 'h',
    stats: { war: 70, leadership: 60, intelligence: 50, politics: 45, charisma: 55 },
    ...over,
  });

describe('差事從城的處境長出來', () => {
  it('a peaceful, poor county still offers house guard — the commoner’s floor', () => {
    const list = errandsAt({ city: city(), year: 190, season: 'spring',
                             rank: RANK_COMMONER, roll: seq(0.5) });
    expect(list.map((e) => e.kind)).toEqual(['guard']);
  });

  it('lawlessness breeds bandit work, and the worse it is the higher the tier', () => {
    const mild = errandsAt({ city: city({ loyalty: 60 }), year: 190, season: 'spring',
                             rank: RANK_COMMONER, roll: seq(0.5) });
    const dire = errandsAt({ city: city({ loyalty: 20 }), year: 190, season: 'spring',
                             rank: RANK_COMMONER, roll: seq(0.5) });
    expect(mild.find((e) => e.kind === 'bandits')?.tier).toBe(2);
    expect(dire.find((e) => e.kind === 'bandits')?.tier).toBe(4);
  });

  it('trade brings escorts; famine brings grain convoys', () => {
    const rich = errandsAt({ city: city({ commerce: 80 }), year: 190, season: 'spring',
                             rank: RANK_COMMONER, roll: seq(0.5) });
    const hungry = errandsAt({ city: city({ food: 4000 }), year: 190, season: 'spring',
                               rank: RANK_COMMONER, roll: seq(0.5) });
    expect(rich.some((e) => e.kind === 'escort')).toBe(true);
    expect(hungry.some((e) => e.kind === 'relief')).toBe(true);
  });

  it('a governor has real duties and stops taking odd jobs', () => {
    expect(takesErrands(5)).toBe(false);
    expect(errandsAt({ city: city({ loyalty: 20 }), year: 190, season: 'spring',
                       rank: 5, roll: seq(0.5) })).toEqual([]);
    expect(errandCap(RANK_COMMONER)).toBeGreaterThan(errandCap(RANK_RETAINER));
  });

  it('the same county in the same season offers the same work — no reroll farming', () => {
    const a = errandsAt({ city: city({ loyalty: 20 }), year: 190, season: 'spring',
                          rank: RANK_COMMONER, roll: seq(0.5) });
    const b = errandsAt({ city: city({ loyalty: 20 }), year: 190, season: 'spring',
                          rank: RANK_COMMONER, roll: seq(0.5) });
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id));
  });
});

const errand = (over: Partial<Errand> = {}): Errand => ({
  id: 'e', kind: 'bandits', cityId: 'c1', tier: 3, patronId: null,
  goldReward: 200, wantTroops: 120, ...over,
});

describe('辦差的判定', () => {
  it('going in undermanned gets men killed', () => {
    const out = resolveErrand({
      errand: errand(), hero: hero({ privateTroops: 10 }),
      deeds: undefined, roll: seq(0.99, 0.9, 0.9),
    });
    expect(out.grade).toBeLessThan(2);
    expect(out.losses).toBeGreaterThan(0);
  });

  it('a rout can maim the hero personally', () => {
    const out = resolveErrand({
      errand: errand(), hero: hero({ privateTroops: 5 }),
      deeds: undefined, roll: seq(0.999, 0.01, 0.1),
    });
    expect(out.grade).toBe(0);
    expect(out.wounded).toBeGreaterThan(0);
  });

  it('bringing enough men and skill turns it into merit and coin', () => {
    const out = resolveErrand({
      errand: errand(), hero: hero({ privateTroops: 140 }),
      deeds: undefined, roll: seq(0.01, 0.2),
    });
    expect(out.grade).toBe(3);
    expect(out.gold).toBeGreaterThan(200);
    expect(out.deeds.battlesWon).toBe(1);
    expect(out.deeds.killsTroops).toBeGreaterThan(0);
    expect(out.renown).toBeGreaterThan(0);
  });

  it('a commoner’s first job counts for more than the same job later', () => {
    const asCommoner = resolveErrand({
      errand: errand(), hero: hero({ privateTroops: 140 }),
      deeds: undefined, roll: seq(0.01, 0.2),
    });
    const asOfficer = resolveErrand({
      errand: errand(), hero: hero({ privateTroops: 140 }),
      deeds: { battlesWon: 20 } as HeroicDeeds, roll: seq(0.01, 0.2),
    });
    expect(asCommoner.deeds.killsTroops!).toBeGreaterThan(asOfficer.deeds.killsTroops!);
  });

  it('a manhunt tests wits, not arms', () => {
    const brawn = resolveErrand({
      errand: errand({ kind: 'manhunt', wantTroops: 10 }),
      hero: hero({ stats: { war: 95, leadership: 90, intelligence: 30, politics: 30, charisma: 50 },
                   privateTroops: 20 }),
      deeds: undefined, roll: seq(0.5, 0.5),
    });
    const brains = resolveErrand({
      errand: errand({ kind: 'manhunt', wantTroops: 10 }),
      hero: hero({ stats: { war: 30, leadership: 30, intelligence: 95, politics: 80, charisma: 50 },
                   privateTroops: 20 }),
      deeds: undefined, roll: seq(0.5, 0.5),
    });
    expect(brains.grade).toBeGreaterThan(brawn.grade);
  });
});

describe('mergeDeeds', () => {
  it('adds onto whatever was already recorded', () => {
    const out = mergeDeeds({ battlesWon: 2, killsTroops: 300 } as HeroicDeeds,
                           { battlesWon: 1, civicWorks: 4 });
    expect(out.battlesWon).toBe(3);
    expect(out.killsTroops).toBe(300);
    expect(out.civicWorks).toBe(4);
  });

  it('works from nothing', () => {
    expect(mergeDeeds(undefined, { battlesWon: 1 }).battlesWon).toBe(1);
  });
});
