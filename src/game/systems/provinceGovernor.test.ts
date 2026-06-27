/** 州牧 — locks the stewardship, the 擁兵自重 meter, secession, and AI seating. */
import { describe, it, expect } from 'vitest';
import type { City, Force, Officer } from '../types';
import type { ProvinceId } from '../types/province';
import { mkOfficer } from '../../test/factories';
import { PROVINCES_BY_ID } from '../data/provinces';
import {
  provinceGovernorEffect, provinceWarlordismDelta, seceProvince, planAIProvinceGovernors,
  planProvinceLevy, governorCalibre, WARLORDISM_CAP,
} from './provinceGovernor';

const PV = 'sili' as ProvinceId;
const CIDS = PROVINCES_BY_ID[PV].cityIds; // ≥3 cities

const mkCity = (id: string, over: Partial<City> = {}): City =>
  ({ id, name: { zh: id, en: id }, ownerForceId: 'wei', troops: 8000, gold: 1000, food: 5000,
     loyalty: 70, agriculture: 50, commerce: 50, defense: 60, corruption: 20, ...over } as City);

const mkForce = (over: Partial<Force> = {}): Force =>
  ({ id: 'wei', name: { zh: '魏', en: 'Wei' }, rulerOfficerId: 'cao', capitalCityId: 'ye', color: '#888', isPlayer: false, ...over } as Force);

describe('provinceGovernorEffect — 分權之效', () => {
  it('stewards every held province city, scaled by the four stats', () => {
    const gov = mkOfficer({ id: 'g', forceId: 'wei', stats: { politics: 90, charisma: 85, intelligence: 85, leadership: 85, war: 50 } });
    const cities: Record<string, City> = {
      [CIDS[0]]: mkCity(CIDS[0], { ownerForceId: 'wei' }),
      [CIDS[1]]: mkCity(CIDS[1], { ownerForceId: 'wei' }),
      [CIDS[2]]: mkCity(CIDS[2], { ownerForceId: 'shu' }), // not held → skipped
    };
    const eff = provinceGovernorEffect(gov, PV, cities);
    expect(eff.touched).toBe(2);
    expect(governorCalibre(gov)).toBeGreaterThanOrEqual(80);
    expect(eff.loyaltyGain).toBe(2);             // 治才 ≥ 80
    expect(eff.goldBonus).toBe(Math.round(90 / 12));
    expect(eff.deltas[CIDS[0]].agriculture).toBeGreaterThan(0); // 智 → 勸農
    expect(eff.deltas[CIDS[0]].defense).toBe(1);               // 統 → 防務
    expect(eff.deltas[CIDS[0]].corruption).toBe(-1);           // 智 → 抑貪
    expect(eff.deltas[CIDS[2]]).toBeUndefined();
  });

  it('a middling steward gives only the base loyalty+gold (no 分權之效)', () => {
    const dull = mkOfficer({ id: 'd', forceId: 'wei', stats: { politics: 40, charisma: 40, intelligence: 40, leadership: 40, war: 40 } });
    const cities: Record<string, City> = { [CIDS[0]]: mkCity(CIDS[0]) };
    const eff = provinceGovernorEffect(dull, PV, cities);
    expect(eff.developGain).toBe(0);
    expect(eff.defenseGain).toBe(0);
    expect(eff.deltas[CIDS[0]].loyalty).toBe(1);
  });
});

describe('provinceWarlordismDelta — 擁兵自重', () => {
  it('the faithful never grasp — the meter decays', () => {
    const loyal = mkOfficer({ traits: ['loyal'] as never, loyalty: 30 });
    expect(provinceWarlordismDelta({ gov: loyal, ownedTroops: 60000, ownedCities: 4, tenureYears: 10 })).toBeLessThan(0);
  });
  it('a discontented ambitious steward over a fat, long-held province builds fast', () => {
    const grasping = mkOfficer({ traits: ['ambitious'] as never, loyalty: 20 });
    expect(provinceWarlordismDelta({ gov: grasping, ownedTroops: 60000, ownedCities: 4, tenureYears: 6 })).toBeGreaterThan(0);
  });
  it('a content, trusted steward of a small seat trends down', () => {
    const content = mkOfficer({ loyalty: 90 });
    expect(provinceWarlordismDelta({ gov: content, ownedTroops: 12000, ownedCities: 1, tenureYears: 1, lordRapport: 70 })).toBeLessThan(0);
  });
});

describe('seceProvince — 擁州自立', () => {
  it('the governor carves the province into a new force under him', () => {
    const gov = mkOfficer({ id: 'g', forceId: 'wei', locationCityId: CIDS[0], loyalty: 10 });
    const officers: Record<string, Officer> = { g: gov };
    const cities: Record<string, City> = {
      [CIDS[0]]: mkCity(CIDS[0], { troops: 9000 }),
      [CIDS[1]]: mkCity(CIDS[1], { troops: 4000 }),
    };
    const forces: Record<string, Force> = { wei: mkForce() }; // capital 'ye' is outside 司隷
    const res = seceProvince({ provinceId: PV, gov, officers, cities, forces });
    expect(res).not.toBeNull();
    expect(res!.secededCityIds.length).toBe(2);
    expect(cities[CIDS[0]].ownerForceId).toBe(res!.newForceId);
    expect(officers['g'].forceId).toBe(res!.newForceId);
    expect(forces[res!.newForceId].rulerOfficerId).toBe('g');
  });

  it('leaves the realm capital alone (no decapitation from its seat)', () => {
    const gov = mkOfficer({ id: 'g', forceId: 'wei', locationCityId: CIDS[0] });
    const officers: Record<string, Officer> = { g: gov };
    const cities: Record<string, City> = { [CIDS[0]]: mkCity(CIDS[0]), [CIDS[1]]: mkCity(CIDS[1]) };
    // The realm's capital IS the only held province city → nothing to take.
    const forces: Record<string, Force> = { wei: mkForce({ capitalCityId: CIDS[0] }) };
    const onlyCapital: Record<string, City> = { [CIDS[0]]: mkCity(CIDS[0]), [CIDS[1]]: mkCity(CIDS[1], { ownerForceId: 'shu' }) };
    expect(seceProvince({ provinceId: PV, gov, officers, cities: onlyCapital, forces })).toBeNull();
    // …but with a non-capital city held, it secedes that one.
    const res = seceProvince({ provinceId: PV, gov, officers, cities, forces });
    expect(res!.secededCityIds).toEqual([CIDS[1]]);
  });
});

describe('planAIProvinceGovernors — AI 州牧', () => {
  it('seats a capable steward over a province an AI realm fully holds', () => {
    const forces: Record<string, Force> = { wei: mkForce() };
    const officers: Record<string, Officer> = {
      cao: mkOfficer({ id: 'cao', forceId: 'wei' }),
      adv: mkOfficer({ id: 'adv', forceId: 'wei', status: 'idle', stats: { politics: 85, charisma: 75, intelligence: 80, leadership: 70, war: 50 } }),
    };
    const cities: Record<string, City> = Object.fromEntries(CIDS.map((c) => [c, mkCity(c)]));
    const appts = planAIProvinceGovernors({ forces, officers, cities, provinceGovernors: {}, playerForceId: null, rng: () => 0.1 });
    const sili = appts.find((a) => a.provinceId === PV);
    expect(sili?.officerId).toBe('adv');
  });

  it('never auto-seats for the player', () => {
    const forces: Record<string, Force> = { wei: mkForce({ isPlayer: true }) };
    const officers: Record<string, Officer> = { adv: mkOfficer({ id: 'adv', forceId: 'wei', status: 'idle', stats: { politics: 85, charisma: 75, intelligence: 80, leadership: 70, war: 50 } }) };
    const cities: Record<string, City> = Object.fromEntries(CIDS.map((c) => [c, mkCity(c)]));
    const appts = planAIProvinceGovernors({ forces, officers, cities, provinceGovernors: {}, playerForceId: 'wei', rng: () => 0.1 });
    expect(appts.find((a) => a.provinceId === PV)).toBeUndefined();
  });
});

describe('planProvinceLevy — 州牧辟召', () => {
  it('staffs every undelegated owned city with its ablest resident officer', () => {
    const cities: Record<string, City> = {
      [CIDS[0]]: mkCity(CIDS[0], { population: 120_000 }),
      [CIDS[1]]: mkCity(CIDS[1], { population: 120_000 }),
      [CIDS[2]]: mkCity(CIDS[2], { population: 120_000, ownerForceId: 'shu' }), // not ours → skipped
    };
    const officers: Record<string, Officer> = {
      a: mkOfficer({ id: 'a', forceId: 'wei', locationCityId: CIDS[0], status: 'idle', stats: { politics: 80, charisma: 70, intelligence: 70, leadership: 60, war: 50 } }),
      b: mkOfficer({ id: 'b', forceId: 'wei', locationCityId: CIDS[1], status: 'idle', stats: { politics: 75, charisma: 65, intelligence: 70, leadership: 60, war: 50 } }),
    };
    const pairs = planProvinceLevy({ provinceId: PV, forceId: 'wei', cities, officers, cityDelegations: {} });
    expect(pairs).toEqual(expect.arrayContaining([
      { cityId: CIDS[0], officerId: 'a' },
      { cityId: CIDS[1], officerId: 'b' },
    ]));
    expect(pairs.find((p) => p.cityId === CIDS[2])).toBeUndefined();
  });

  it('skips already-delegated cities and cities with no resident officer', () => {
    const cities: Record<string, City> = { [CIDS[0]]: mkCity(CIDS[0], { population: 120_000 }), [CIDS[1]]: mkCity(CIDS[1], { population: 120_000 }) };
    const officers: Record<string, Officer> = { a: mkOfficer({ id: 'a', forceId: 'wei', locationCityId: CIDS[0], status: 'idle' }) };
    const pairs = planProvinceLevy({ provinceId: PV, forceId: 'wei', cities, officers, cityDelegations: { [CIDS[0]]: 'a' } });
    expect(pairs).toHaveLength(0); // CIDS[0] already delegated, CIDS[1] has nobody home
  });
});

describe('WARLORDISM_CAP sanity', () => {
  it('the cap is the secession threshold', () => {
    expect(WARLORDISM_CAP).toBe(100);
  });
});
