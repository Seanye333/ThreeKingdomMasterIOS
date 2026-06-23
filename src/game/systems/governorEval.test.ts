import { describe, it, expect } from 'vitest';
import type { Appointment, City, Officer } from '../types';
import { scoreGovernorSeat, gradeFromScore, evaluateGovernors } from './governorEval';

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
