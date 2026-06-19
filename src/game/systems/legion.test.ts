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
  planLegionOrders({ cities, officers, busyOfficerIds: new Set(), playerForceId: 'wei', legion: lg });

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
    const orders = planLegionOrders({
      cities, officers, busyOfficerIds: new Set(['a']), playerForceId: 'wei', legion: legion(),
    });
    expect(orders).toEqual([]);
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
