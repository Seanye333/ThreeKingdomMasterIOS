/** 軍團都督 — locks the legion planner. */
import { describe, expect, it } from 'vitest';
import type { City, EntityId, Officer } from '../types';
import { mkOfficer } from '../../test/factories';
import { planLegionOrders, type Legion } from './legion';

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

function world() {
  const cities: Record<EntityId, City> = {
    front: mkCity({ id: 'front', adjacentCityIds: ['target', 'rear'] }),
    rear: mkCity({ id: 'rear', adjacentCityIds: ['front'] }),
    target: mkCity({ id: 'target', ownerForceId: 'wu', adjacentCityIds: ['front'] }),
  };
  const officers: Record<EntityId, Officer> = {
    a: mkOfficer({ id: 'a', forceId: 'wei', locationCityId: 'front' }),
    b: mkOfficer({ id: 'b', forceId: 'wei', locationCityId: 'rear' }),
  };
  return { cities, officers };
}

const legion = (over: Partial<Legion> = {}): Legion => ({
  id: 'L1', name: '第一軍團', commanderId: 'a',
  cityIds: ['front', 'rear'],
  directive: { kind: 'conquer', targetCityId: 'target' },
  ...over,
});

const plan = (cities: Record<EntityId, City>, officers: Record<EntityId, Officer>, lg = legion()) =>
  planLegionOrders({ cities, officers, busyOfficerIds: new Set(), playerForceId: 'wei', legion: lg }).orders;

describe('planLegionOrders — conquer', () => {
  it('adjacent city strikes the target; the hinterland steps toward it', () => {
    const { cities, officers } = world();
    const orders = plan(cities, officers);
    expect(orders).toContainEqual(expect.objectContaining({ cityId: 'front', toCityId: 'target', kind: 'march' }));
    expect(orders).toContainEqual(expect.objectContaining({ cityId: 'rear', toCityId: 'front', kind: 'march' }));
  });

  it('thin garrisons recruit instead of marching', () => {
    const { cities, officers } = world();
    cities.front = { ...cities.front, troops: 2000 };
    const orders = plan(cities, officers);
    expect(orders).toContainEqual(expect.objectContaining({ cityId: 'front', kind: 'recruit' }));
  });

  it('lost cities and busy officers drop out silently', () => {
    const { cities, officers } = world();
    cities.rear = { ...cities.rear, ownerForceId: 'wu' };
    const { orders } = planLegionOrders({
      cities, officers, busyOfficerIds: new Set(['a']), playerForceId: 'wei', legion: legion(),
    });
    expect(orders).toEqual([]);
  });
});

describe('planLegionOrders — 都督做活 / 方略', () => {
  it('a higher-統率 marshal sends a bigger levy (mobilizes more)', () => {
    const { cities, officers } = world();
    officers.a = mkOfficer({ id: 'a', forceId: 'wei', locationCityId: 'front', stats: { leadership: 70, war: 70 } as never });
    const plain = plan(cities, officers).find((o) => o.cityId === 'front' && o.kind === 'march') as { troops: number };
    officers.a = mkOfficer({ id: 'a', forceId: 'wei', locationCityId: 'front', stats: { leadership: 100, war: 70 } as never });
    const great = plan(cities, officers).find((o) => o.cityId === 'front' && o.kind === 'march') as { troops: number };
    expect(great.troops).toBeGreaterThan(plain.troops);
  });

  it('蠶食 — dynamically marches on the softest reachable enemy (no fixed target)', () => {
    const { cities, officers } = world();
    cities.target = { ...cities.target, troops: 4000 };
    cities.soft = mkCity({ id: 'soft', ownerForceId: 'wu', troops: 800, adjacentCityIds: ['front'] });
    cities.front = { ...cities.front, adjacentCityIds: ['target', 'rear', 'soft'] };
    const orders = plan(cities, officers, legion({ directive: { kind: 'consume' } }));
    // The front throws its weight at the weaker 'soft', not the stronger 'target'.
    expect(orders).toContainEqual(expect.objectContaining({ cityId: 'front', toCityId: 'soft', kind: 'march' }));
  });

  it('a clever marshal retargets a fallen objective', () => {
    const { cities, officers } = world();
    cities.target = { ...cities.target, ownerForceId: 'wei' }; // objective already taken
    cities.soft = mkCity({ id: 'soft', ownerForceId: 'wu', troops: 1000, adjacentCityIds: ['front'] });
    cities.front = { ...cities.front, adjacentCityIds: ['target', 'rear', 'soft'] };
    const orders = plan(cities, officers); // conquer 'target' (now ours) → swings to 'soft'
    expect(orders).toContainEqual(expect.objectContaining({ cityId: 'front', toCityId: 'soft', kind: 'march' }));
  });

  it('reports a summary of what it did', () => {
    const { cities, officers } = world();
    const { summary } = planLegionOrders({ cities, officers, busyOfficerIds: new Set(), playerForceId: 'wei', legion: legion() });
    expect(summary.directive).toBe('conquer');
    expect(summary.marched).toBeGreaterThan(0);
    expect(summary.troopsSent).toBeGreaterThan(0);
  });
});

describe('planLegionOrders — defend', () => {
  it('strength reinforces the weak neighbour', () => {
    const { cities, officers } = world();
    cities.front = { ...cities.front, troops: 12000 };
    cities.rear = { ...cities.rear, troops: 2000 };
    officers.b = { ...officers.b, task: 'march' as Officer['task'] }; // rear can't even recruit
    const orders = plan(cities, officers, legion({ directive: { kind: 'defend' } }));
    expect(orders).toContainEqual(expect.objectContaining({ cityId: 'front', toCityId: 'rear', kind: 'march' }));
  });
});
