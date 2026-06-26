/**
 * 全軍集結令 — locks the realm-wide muster planner: who marches, with how
 * many troops, and which way the hinterland routes toward the target.
 */
import { describe, it, expect } from 'vitest';
import type { City, EntityId, Officer } from '../types';
import { mkOfficer } from '../../test/factories';
import { nextHopToward, planMassMuster, musterStrain } from './muster';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wei',
    troops: 8000,
    gold: 2000,
    adjacentCityIds: [],
    coords: { x: 500, y: 360 },
    name: { zh: over.id, en: over.id },
    ...over,
  } as unknown as City);

const idleIn = (id: string, cityId: string, lead = 70, war = 70): Officer =>
  mkOfficer({ id, forceId: 'wei', locationCityId: cityId, stats: { leadership: lead, war } });

// A small realm: cap — mid — front, with the enemy target past the front
// and an isolated enclave that can't reach it through own land.
//   cap ↔ mid ↔ front ↔ target(enemy)
//   enclave ↔ foreign ↔ target
function realm() {
  const cities: Record<EntityId, City> = {
    cap: mkCity({ id: 'cap', adjacentCityIds: ['mid'] }),
    mid: mkCity({ id: 'mid', adjacentCityIds: ['cap', 'front'] }),
    front: mkCity({ id: 'front', adjacentCityIds: ['mid', 'target'] }),
    target: mkCity({ id: 'target', ownerForceId: 'wu', adjacentCityIds: ['front', 'foreign'] }),
    enclave: mkCity({ id: 'enclave', adjacentCityIds: ['foreign'] }),
    foreign: mkCity({ id: 'foreign', ownerForceId: 'shu', adjacentCityIds: ['enclave', 'target'] }),
  };
  const officers: Record<EntityId, Officer> = {
    a: idleIn('a', 'cap'),
    b: idleIn('b', 'mid'),
    c: idleIn('c', 'front'),
    d: idleIn('d', 'enclave'),
  };
  return { cities, officers };
}

const plan = (over: Partial<Parameters<typeof planMassMuster>[0]> = {}, opts?: Parameters<typeof planMassMuster>[1]) => {
  const { cities, officers } = realm();
  return planMassMuster({
    cities,
    officers,
    pendingCommandOfficerIds: new Set<EntityId>(),
    trainingOfficerIds: new Set<EntityId>(),
    playerForceId: 'wei',
    targetCityId: 'target',
    ...over,
  }, opts).orders;
};

describe('nextHopToward', () => {
  it('routes the hinterland one own-city hop toward the target', () => {
    const { cities } = realm();
    expect(nextHopToward(cities, 'cap', 'target', 'wei')).toBe('mid');
    expect(nextHopToward(cities, 'mid', 'target', 'wei')).toBe('front');
  });

  it('adjacent source goes straight to the target even though it is enemy-held', () => {
    const { cities } = realm();
    expect(nextHopToward(cities, 'front', 'target', 'wei')).toBe('target');
  });

  it('refuses paths that would route through foreign cities', () => {
    const { cities } = realm();
    expect(nextHopToward(cities, 'enclave', 'target', 'wei')).toBeNull();
  });
});

describe('planMassMuster', () => {
  it('musters every reachable city at 70% strength under its best idle officer', () => {
    const orders = plan();
    expect(orders.map((o) => o.cityId).sort()).toEqual(['cap', 'front', 'mid']);
    const byCity = Object.fromEntries(orders.map((o) => [o.cityId, o]));
    expect(byCity.front.marchTo).toBe('target');
    expect(byCity.mid.marchTo).toBe('front');
    expect(byCity.cap.marchTo).toBe('mid');
    expect(byCity.cap.troops).toBe(Math.floor(8000 * 0.7));
  });

  it('skips thin garrisons, empty treasuries and the target itself', () => {
    const { cities, officers } = realm();
    cities.cap = { ...cities.cap, troops: 2000 };       // below the 3000 floor
    cities.mid = { ...cities.mid, gold: 50 };           // can't pay the march
    const { orders, excluded } = planMassMuster({
      cities, officers,
      pendingCommandOfficerIds: new Set(), trainingOfficerIds: new Set(),
      playerForceId: 'wei', targetCityId: 'target',
    });
    expect(orders.map((o) => o.cityId)).toEqual(['front']);
    // …and the skips are reported with reasons for the preview.
    expect(excluded.find((e) => e.cityId === 'cap')?.reason).toBe('low-garrison');
    expect(excluded.find((e) => e.cityId === 'mid')?.reason).toBe('no-gold');
  });

  it('skips cities whose only officers are busy, training or already ordered', () => {
    const { cities, officers } = realm();
    officers.c = { ...officers.c, task: 'march' };
    const { orders } = planMassMuster({
      cities, officers,
      pendingCommandOfficerIds: new Set(['b']),
      trainingOfficerIds: new Set(['a']),
      playerForceId: 'wei', targetCityId: 'target',
    });
    expect(orders).toEqual([]);
  });

  it('picks the strongest idle commander when several are home', () => {
    const { cities, officers } = realm();
    officers.c2 = idleIn('c2', 'front', 95, 90);
    const { orders } = planMassMuster({
      cities, officers,
      pendingCommandOfficerIds: new Set(), trainingOfficerIds: new Set(),
      playerForceId: 'wei', targetCityId: 'target',
    });
    expect(orders.find((o) => o.cityId === 'front')?.officerId).toBe('c2');
  });

  it('returns nothing for an unknown target', () => {
    expect(plan({ targetCityId: 'nowhere' })).toEqual([]);
  });
});

describe('planMassMuster — 選擇性 / 勤王', () => {
  it('a custom fraction & garrison floor cap what each city sends', () => {
    const half = plan({}, { fraction: 0.5 });
    expect(half.find((o) => o.cityId === 'cap')?.troops).toBe(Math.floor(8000 * 0.5));
    // Keep 7000 home of an 8000 garrison → only 1000 marches.
    const kept = plan({}, { keepGarrison: 7000 });
    expect(kept.find((o) => o.cityId === 'cap')?.troops).toBe(1000);
  });

  it('exclusions keep a city home (and report it)', () => {
    const { cities, officers } = realm();
    const out = planMassMuster(
      { cities, officers, pendingCommandOfficerIds: new Set(), trainingOfficerIds: new Set(), playerForceId: 'wei', targetCityId: 'target' },
      { excludeCityIds: new Set(['front']) },
    );
    expect(out.orders.map((o) => o.cityId).sort()).toEqual(['cap', 'mid']);
    expect(out.excluded.find((e) => e.cityId === 'front')?.reason).toBe('excluded');
  });

  it('勤王 — musters toward an OWN city (reinforce), the others converging on it', () => {
    // Target the front (own) instead of the enemy — cap/mid march to reinforce it.
    const orders = plan({ targetCityId: 'front' });
    expect(orders.map((o) => o.cityId).sort()).toEqual(['cap', 'mid']);
    expect(orders.find((o) => o.cityId === 'mid')?.marchTo).toBe('front');
  });

  it('集結之累 — a heavier levy weighs more on 民心 (capped)', () => {
    expect(musterStrain(1500)).toBeLessThan(musterStrain(9000));
    expect(musterStrain(100)).toBeGreaterThanOrEqual(1);
    expect(musterStrain(99999)).toBeLessThanOrEqual(6);
  });
});
