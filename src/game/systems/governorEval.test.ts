import { describe, it, expect } from 'vitest';
import type { Appointment, City, Officer } from '../types';
import { scoreGovernorSeat, scoreGovernorSeatDetail, isFrontierCity, gradeFromScore, evaluateGovernors } from './governorEval';
import { PROVINCES_BY_ID } from '../data/provinces';

function mkCity(over: Partial<City> = {}): City {
  return {
    id: 'c1', name: { zh: '城', en: 'City' }, ownerForceId: 'shu',
    population: 200000, gold: 3000, food: 5000, troops: 15000, loyalty: 70,
    ...over,
  } as City;
}
function mkGov(over: Partial<Officer> = {}): Officer {
  return {
    id: 'gov1', name: { zh: '守', en: 'Gov' }, forceId: 'shu',
    stats: { leadership: 60, war: 50, intelligence: 70, politics: 85, charisma: 60 },
    loyalty: 60, status: 'idle', locationCityId: 'c1', task: null,
    equipment: {} as Officer['equipment'], skills: [], rank: 'soldier', ...over,
  } as Officer;
}

describe('scoreGovernorSeat + gradeFromScore', () => {
  it('a thriving loyal seat scores 上, a neglected one 下', () => {
    const thriving = scoreGovernorSeat(
      mkCity({ gold: 9000, food: 14000, troops: 25000, loyalty: 95 }),
      mkGov({ stats: { leadership: 70, war: 60, intelligence: 80, politics: 95, charisma: 70 } }),
    );
    const neglected = scoreGovernorSeat(
      mkCity({ gold: 50, food: 50, troops: 500, loyalty: 12 }),
      mkGov({ stats: { leadership: 40, war: 40, intelligence: 40, politics: 35, charisma: 40 } }),
    );
    expect(gradeFromScore(thriving)).toBe('shang');
    expect(gradeFromScore(neglected)).toBe('xia');
    expect(thriving).toBeGreaterThan(neglected);
  });

  it('graft on the watch drags the review score down', () => {
    const base = mkCity({ gold: 9000, food: 14000, troops: 25000, loyalty: 95 });
    const gov = mkGov({ stats: { leadership: 70, war: 60, intelligence: 80, politics: 95, charisma: 70 } });
    const clean = scoreGovernorSeat({ ...base, corruption: 0 } as City, gov);
    const dirty = scoreGovernorSeat({ ...base, corruption: 100 } as City, gov);
    expect(dirty).toBeLessThan(clean);
    expect(clean - dirty).toBeCloseTo(15, 0); // up to −15 at full corruption
  });
});

describe('evaluateGovernors', () => {
  const cities = {
    good: mkCity({ id: 'good', gold: 9000, food: 14000, troops: 25000, loyalty: 95 }),
    bad: mkCity({ id: 'bad', gold: 20, food: 20, troops: 300, loyalty: 10 }),
  };
  const officers = {
    able: mkGov({ id: 'able', loyalty: 60, locationCityId: 'good' }),
    poor: mkGov({ id: 'poor', loyalty: 60, locationCityId: 'bad', stats: { leadership: 40, war: 40, intelligence: 40, politics: 35, charisma: 40 } }),
  };
  const appts: Appointment[] = [
    { officerId: 'able', forceId: 'shu', titleId: 'prefect', cityId: 'good', appointedYear: 200 },
    { officerId: 'poor', forceId: 'shu', titleId: 'prefect', cityId: 'bad', appointedYear: 200 },
  ];

  it('rewards able stewards and punishes failures via loyalty', () => {
    const r = evaluateGovernors({ appointments: appts, cities, officers });
    expect(r.officers['able'].loyalty).toBeGreaterThan(60);
    expect(r.officers['poor'].loyalty).toBeLessThan(60);
    expect(r.reviews).toHaveLength(2);
    expect(r.entries).toHaveLength(2);
  });

  it('skips prefects whose seat was lost', () => {
    const lost = { ...cities, good: mkCity({ id: 'good', ownerForceId: 'wei' }) };
    const r = evaluateGovernors({ appointments: appts, cities: lost, officers });
    expect(r.reviews.find((x) => x.officerId === 'able')).toBeUndefined();
  });

  it('honours the forceId filter', () => {
    const r = evaluateGovernors({ appointments: appts, cities, officers, forceId: 'wei' });
    expect(r.reviews).toHaveLength(0);
  });

  it('grooms a 上考 steward with XP (steered to 政治)', () => {
    const r = evaluateGovernors({ appointments: appts, cities, officers, rng: () => 0.5 });
    // 'able' scored 上 → gains XP; the entry advertises it.
    const ableReview = r.reviews.find((x) => x.officerId === 'able')!;
    expect(ableReview.grade).toBe('shang');
    expect(r.entries.find((e) => e.textZh.includes('歷練 +'))).toBeTruthy();
  });
});

describe('因城而異 — frontier vs heartland weighting', () => {
  it('isFrontierCity flags a seat bordering another force', () => {
    const cs = {
      home: mkCity({ id: 'home', ownerForceId: 'shu', adjacentCityIds: ['enemy', 'friend'] } as never),
      enemy: mkCity({ id: 'enemy', ownerForceId: 'wei' }),
      friend: mkCity({ id: 'friend', ownerForceId: 'shu' }),
    };
    expect(isFrontierCity(cs.home, cs)).toBe(true);
    expect(isFrontierCity(cs.friend, cs)).toBe(false);
  });

  it('a strong-garrison weak-economy seat scores higher as a frontier', () => {
    const martial = mkCity({ gold: 100, food: 100, troops: 25000, defense: 140, loyalty: 60 } as never);
    const gov = mkGov();
    expect(scoreGovernorSeat(martial, gov, true)).toBeGreaterThan(scoreGovernorSeat(martial, gov, false));
    // the breakdown surfaces both garrison and walls for the panel.
    const d = scoreGovernorSeatDetail(martial, gov, true);
    expect(d.fill.garrison).toBeGreaterThan(0.9);
    expect(d.fill.defense).toBeGreaterThan(0.9);
  });
});

describe('殿最閉環 — streaks compound and forfeit AI seats', () => {
  const cities = {
    bad: mkCity({ id: 'bad', gold: 20, food: 20, troops: 300, loyalty: 10 }),
  };
  const officers = {
    poor: mkGov({ id: 'poor', loyalty: 60, locationCityId: 'bad', stats: { leadership: 40, war: 40, intelligence: 40, politics: 35, charisma: 40 } }),
  };
  const appt = [{ officerId: 'poor', forceId: 'shu', titleId: 'prefect', cityId: 'bad', appointedYear: 200 }] as Appointment[];

  it('a 下考 streak bleeds loyalty faster than a one-off', () => {
    const fresh = evaluateGovernors({ appointments: appt, cities, officers });
    const onStreak = evaluateGovernors({ appointments: appt, cities, officers, streaks: { poor: -1 } });
    expect(onStreak.officers['poor'].loyalty).toBeLessThan(fresh.officers['poor'].loyalty);
  });

  it('three years of 下考 forfeits an AI prefect’s seat', () => {
    const r = evaluateGovernors({ appointments: appt, cities, officers, streaks: { poor: -2 } });
    expect(r.revoked.map((x) => x.officerId)).toContain('poor');
  });

  it('a chronically-failing PLAYER prefect is flagged, never auto-removed', () => {
    const r = evaluateGovernors({ appointments: appt, cities, officers, streaks: { poor: -2 }, playerForceId: 'shu' });
    expect(r.revoked).toHaveLength(0);
    expect(r.entries.some((e) => e.textZh.includes('親裁'))).toBe(true);
  });
});

describe('治世之效 — an able realm earns 天命 and crowns 天下治最', () => {
  const great = (id: string, loyalty: number): City =>
    mkCity({ id, gold: 9000, food: 14000, troops: 25000, loyalty } as never);
  const cities = { a: great('a', 95), b: great('b', 92), c: great('c', 90) };
  const sharp = { leadership: 70, war: 60, intelligence: 80, politics: 95, charisma: 70 };
  const officers = {
    g1: mkGov({ id: 'g1', locationCityId: 'a', stats: sharp }),
    g2: mkGov({ id: 'g2', locationCityId: 'b', stats: sharp }),
    g3: mkGov({ id: 'g3', locationCityId: 'c', stats: sharp }),
  };
  const appts: Appointment[] = [
    { officerId: 'g1', forceId: 'shu', titleId: 'prefect', cityId: 'a', appointedYear: 200 },
    { officerId: 'g2', forceId: 'shu', titleId: 'prefect', cityId: 'b', appointedYear: 200 },
    { officerId: 'g3', forceId: 'shu', titleId: 'prefect', cityId: 'c', appointedYear: 200 },
  ];

  it('grants 天命 when all stewards earn 上考 and names a 天下治最', () => {
    const r = evaluateGovernors({ appointments: appts, cities, officers });
    expect(r.reviews.every((x) => x.grade === 'shang')).toBe(true);
    expect(r.mandateDeltas['shu']).toBeGreaterThanOrEqual(2);
    expect(r.entries.some((e) => e.textZh.includes('天下治最'))).toBe(true);
  });
});

describe('牧守一體 — 州牧 oversees his prefects', () => {
  const SILI = PROVINCES_BY_ID['sili'].cityIds;
  const mkPrefectCity = (id: string) =>
    mkCity({ id, ownerForceId: 'shu', gold: 1000, food: 5000, troops: 12000, loyalty: 70, population: 120_000 } as never);

  it('州牧督課 — a capable 州牧 lifts his prefects’ review', () => {
    const cityId = SILI[0];
    const cities = { [cityId]: mkPrefectCity(cityId) };
    const officers = {
      p: mkGov({ id: 'p', locationCityId: cityId, loyalty: 60 }),
      sg: mkGov({ id: 'sg', loyalty: 60, stats: { leadership: 60, war: 40, intelligence: 80, politics: 95, charisma: 90 } }),
    };
    const appts: Appointment[] = [{ officerId: 'p', forceId: 'shu', titleId: 'prefect', cityId, appointedYear: 200 }];
    const without = evaluateGovernors({ appointments: appts, cities, officers }).reviews[0].score;
    const withSup = evaluateGovernors({ appointments: appts, cities, officers, provinceGovernors: { sili: 'sg' } }).reviews[0].score;
    expect(withSup).toBeGreaterThan(without);
  });

  it('政績歸牧 — a province of 上考 prefects rewards its 州牧 (renown + loyalty)', () => {
    const [c1, c2] = SILI;
    const great = (id: string) => mkCity({ id, ownerForceId: 'shu', gold: 9000, food: 14000, troops: 25000, loyalty: 95, population: 200_000 } as never);
    const cities = { [c1]: great(c1), [c2]: great(c2) };
    const sharp = { leadership: 70, war: 60, intelligence: 80, politics: 95, charisma: 70 };
    const officers = {
      p1: mkGov({ id: 'p1', locationCityId: c1, stats: sharp }),
      p2: mkGov({ id: 'p2', locationCityId: c2, stats: sharp }),
      sg: mkGov({ id: 'sg', loyalty: 60, stats: sharp }),
    };
    const appts: Appointment[] = [
      { officerId: 'p1', forceId: 'shu', titleId: 'prefect', cityId: c1, appointedYear: 200 },
      { officerId: 'p2', forceId: 'shu', titleId: 'prefect', cityId: c2, appointedYear: 200 },
    ];
    const r = evaluateGovernors({ appointments: appts, cities, officers, provinceGovernors: { sili: 'sg' }, year: 205 });
    expect(r.officers['sg'].loyalty).toBeGreaterThan(60);
    expect(r.reviewLast['sg']?.grade).toBe('shang');
    expect(r.entries.some((e) => e.textZh.includes('牧守有方'))).toBe(true);
  });
});
