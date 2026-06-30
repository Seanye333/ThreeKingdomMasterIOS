import { describe, it, expect } from 'vitest';
import type { City, Force, Officer } from '../types';
import { STATECRAFT_BY_ID, statecraftScale } from '../data/statecraft';
import { tickStatecraft, statecraftRecruitBonus } from './statecraft';

function mkCity(id: string, over: Partial<City> = {}): City {
  return {
    id, name: { zh: id, en: id }, ownerForceId: 'shu',
    population: 200000, gold: 1000, food: 1000, troops: 5000, loyalty: 50, ...over,
  } as City;
}
function mkOfficer(id: string, over: Partial<Officer> = {}): Officer {
  return {
    id, name: { zh: id, en: id }, forceId: 'shu',
    stats: { leadership: 60, war: 60, intelligence: 60, politics: 60, charisma: 60 },
    loyalty: 60, status: 'idle', locationCityId: 'c1', task: null,
    equipment: {} as Officer['equipment'], skills: [], rank: 'soldier', ...over,
  } as Officer;
}
function mkForce(over: Partial<Force> = {}): Force {
  return { id: 'shu', name: { zh: '蜀', en: 'Shu' }, rulerOfficerId: 'liu-bei', capitalCityId: 'c1', color: '#0a0', isPlayer: true, ...over } as Force;
}

describe('tickStatecraft', () => {
  it('does nothing for a realm with no school', () => {
    const cities = { c1: mkCity('c1') };
    const r = tickStatecraft({ forces: { shu: mkForce() }, cities, officers: {} });
    expect(r.cities.c1.loyalty).toBe(50);
  });

  it('confucian lifts 民心 and rallies royal/ritual scholars', () => {
    const cities = { c1: mkCity('c1', { loyalty: 50 }) };
    const officers = {
      'liu-bei': mkOfficer('liu-bei', { doctrine: 'royal', loyalty: 60 }),
      merc: mkOfficer('merc', { doctrine: 'separatist', loyalty: 60 }), // neither favored nor opposed
    };
    const r = tickStatecraft({
      forces: { shu: mkForce({ statecraft: 'confucian' }) },
      cities,
      officers,
    });
    expect(r.cities.c1.loyalty).toBe(50 + STATECRAFT_BY_ID.confucian.perCity.cityLoyalty);
    expect(r.officers['liu-bei'].loyalty).toBe(61); // favored doctrine
    expect(r.officers['merc'].loyalty).toBe(60);    // not favored
  });

  it('legalist adds tax gold and floors order in a restless city (at full mastery)', () => {
    const cities = { c1: mkCity('c1', { loyalty: 20, gold: 500 }) };
    const r = tickStatecraft({
      forces: { shu: mkForce({ statecraft: 'legalist', statecraftMastery: 100 }) },
      cities,
      officers: {},
    });
    expect(r.cities.c1.gold).toBe(500 + STATECRAFT_BY_ID.legalist.perCity.gold);
    expect(r.cities.c1.loyalty).toBeGreaterThan(20); // order floor lifts it
  });

  it('militarist trickles conscripts but costs 民心 (at full mastery)', () => {
    const cities = { c1: mkCity('c1', { loyalty: 50, troops: 5000 }) };
    const r = tickStatecraft({
      forces: { shu: mkForce({ statecraft: 'militarist', statecraftMastery: 100 }) },
      cities,
      officers: {},
    });
    expect(r.cities.c1.troops).toBe(5000 + STATECRAFT_BY_ID.militarist.perCity.troops);
    expect(r.cities.c1.loyalty).toBe(49);
  });
});

describe('§7.9-deep I 學派造詣 — mastery scales effects & climbs', () => {
  it('a fresh school runs weaker than a mastered one, and mastery climbs', () => {
    const green = tickStatecraft({ forces: { shu: mkForce({ statecraft: 'legalist', statecraftMastery: 0 }) }, cities: { c1: mkCity('c1', { gold: 500 }) }, officers: {} });
    const deep = tickStatecraft({ forces: { shu: mkForce({ statecraft: 'legalist', statecraftMastery: 100 }) }, cities: { c1: mkCity('c1', { gold: 500 }) }, officers: {} });
    expect(green.cities.c1.gold - 500).toBeLessThan(deep.cities.c1.gold - 500);
    expect(green.mastery['shu']).toBeGreaterThan(0); // climbed this season
  });

  it('an academy makes mastery climb faster', () => {
    const noAcad = tickStatecraft({ forces: { shu: mkForce({ statecraft: 'confucian', statecraftMastery: 10 }) }, cities: { c1: mkCity('c1') }, officers: {} });
    const acad = tickStatecraft({ forces: { shu: mkForce({ statecraft: 'confucian', statecraftMastery: 10 }) }, cities: { c1: mkCity('c1') }, officers: {}, academyForces: new Set(['shu']) });
    expect(acad.mastery['shu']).toBeGreaterThan(noAcad.mastery['shu']);
  });

  it('statecraftScale runs 0.4 → 1.0', () => {
    expect(statecraftScale(0)).toBeCloseTo(0.4);
    expect(statecraftScale(100)).toBeCloseTo(1.0);
  });
});

describe('§7.9-deep J 學派相違 — the creed alienates opposed doctrines', () => {
  it('a hegemonic general loses loyalty under Confucianism while a royal one gains', () => {
    const officers = {
      hawk: mkOfficer('hawk', { doctrine: 'hegemonic', loyalty: 60 }),
      sage: mkOfficer('sage', { doctrine: 'royal', loyalty: 60 }),
    };
    const r = tickStatecraft({ forces: { shu: mkForce({ statecraft: 'confucian', statecraftMastery: 80 }) }, cities: { c1: mkCity('c1') }, officers });
    expect(r.officers['hawk'].loyalty).toBeLessThan(60); // opposed → cools
    expect(r.officers['sage'].loyalty).toBeGreaterThan(60); // favored → warms
  });
});

describe('statecraftRecruitBonus', () => {
  it('confucian opens doors, militarist does not', () => {
    expect(statecraftRecruitBonus('confucian')).toBeGreaterThan(0);
    expect(statecraftRecruitBonus('militarist')).toBe(0);
    expect(statecraftRecruitBonus(null)).toBe(0);
  });
});
