import { describe, it, expect } from 'vitest';
import {
  poemQuality, composePoem, poemEffects, shrineCost, shrineEffects, canBuildShrine,
  POEM_MEMORABLE, type Shrine,
} from './culturalWorks';
import type { Officer } from '../types';

function poet(intelligence: number, charisma: number, renown = 0): Officer {
  return {
    id: 'cao-zhi', name: { zh: '曹植', en: 'Cao Zhi' }, forceId: 'wei', status: 'idle',
    loyalty: 80, birthYear: 192, renown,
    stats: { war: 40, leadership: 40, intelligence, politics: 60, charisma },
    skills: [],
  } as unknown as Officer;
}

/** A deterministic rng that always returns the same point in [0,1). */
const fixed = (v: number) => () => v;

describe('詩才', () => {
  it('a great mind writes better than a dull one', () => {
    const good = poemQuality({ author: poet(95, 90), occasion: 'scenic', rng: fixed(0.5) });
    const dull = poemQuality({ author: poet(35, 30), occasion: 'scenic', rng: fixed(0.5) });
    expect(good).toBeGreaterThan(dull);
  });

  it('a famous site and a lettered city lift the same man', () => {
    const bare = poemQuality({ author: poet(75, 70), occasion: 'scenic', rng: fixed(0.5) });
    const inspired = poemQuality({
      author: poet(75, 70), occasion: 'scenic', occasionWeight: 1, culture: 80, rng: fixed(0.5),
    });
    expect(inspired).toBeGreaterThan(bare);
  });

  it('renown counts, but only so far', () => {
    const unknown = poemQuality({ author: poet(70, 70, 0), occasion: 'banquet', rng: fixed(0.5) });
    const famed = poemQuality({ author: poet(70, 70, 200), occasion: 'banquet', rng: fixed(0.5) });
    expect(famed - unknown).toBeLessThanOrEqual(20);
    expect(famed).toBeGreaterThan(unknown);
  });

  it('inspiration varies the same man run to run, inside 0–100', () => {
    const low = poemQuality({ author: poet(80, 80), occasion: 'scenic', rng: fixed(0) });
    const high = poemQuality({ author: poet(80, 80), occasion: 'scenic', rng: fixed(0.999) });
    expect(high).toBeGreaterThan(low);
    expect(low).toBeGreaterThanOrEqual(0);
    expect(high).toBeLessThanOrEqual(100);
  });
});

describe('成篇', () => {
  const base = {
    author: poet(90, 85), cityId: 'ye', cityNameZh: '鄴', year: 210,
    season: 'autumn' as const, quality: 80,
  };

  it('writes four distinct lines and titles a scenic poem after the city', () => {
    const p = composePoem({ ...base, occasion: 'scenic', rng: fixed(0.1) });
    expect(p.titleZh).toContain('鄴');
    expect(p.linesZh.length).toBeGreaterThanOrEqual(3);
    expect(new Set(p.linesZh).size).toBe(p.linesZh.length);
  });

  it('is deterministic for a given roll — no save-scumming a masterpiece', () => {
    const a = composePoem({ ...base, occasion: 'banquet', rng: fixed(0.42) });
    const b = composePoem({ ...base, occasion: 'banquet', rng: fixed(0.42) });
    expect(a).toEqual(b);
  });

  it('a mourning poem is not titled after a place', () => {
    const p = composePoem({ ...base, occasion: 'mourning', rng: fixed(0.3) });
    expect(p.titleZh).not.toContain('鄴');
  });
});

describe('詩之所值', () => {
  it('a trifle changes almost nothing; a masterpiece is remembered', () => {
    const trifle = poemEffects(20);
    const great = poemEffects(92);
    expect(trifle.memorable).toBe(false);
    expect(trifle.loyaltyGain).toBe(0);
    expect(great.memorable).toBe(true);
    expect(great.cultureGain).toBeGreaterThan(trifle.cultureGain);
    expect(great.renownGain).toBeGreaterThan(trifle.renownGain);
    expect(great.tierZh).toBe('千古絕唱');
  });

  it('the memorable threshold is where the annals begin', () => {
    expect(poemEffects(POEM_MEMORABLE - 1).memorable).toBe(false);
    expect(poemEffects(POEM_MEMORABLE).memorable).toBe(true);
  });
});

describe('立祠', () => {
  it('a greater name costs more and gives more', () => {
    expect(shrineCost(80)).toBeGreaterThan(shrineCost(10));
    const great = shrineEffects(80), lesser = shrineEffects(20);
    expect(great.loyaltyPerSeason).toBeGreaterThan(lesser.loyaltyPerSeason);
    expect(great.culturePerSeason).toBeGreaterThan(lesser.culturePerSeason);
    expect(great.clanLoyalty).toBeGreaterThan(lesser.clanLoyalty);
  });

  it('cost stops climbing past the top of the renown scale', () => {
    expect(shrineCost(200)).toBe(shrineCost(80));
  });

  it('one shrine per city, one shrine per man', () => {
    const existing: Shrine[] = [{ id: 's1', officerId: 'guan-yu', cityId: 'jiangling', year: 220, renown: 90 }];
    expect(canBuildShrine(existing, 'jiangling', 'zhang-fei').ok).toBe(false);
    expect(canBuildShrine(existing, 'chengdu', 'guan-yu').ok).toBe(false);
    expect(canBuildShrine(existing, 'chengdu', 'zhang-fei').ok).toBe(true);
  });
});
