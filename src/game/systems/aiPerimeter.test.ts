import { describe, it, expect } from 'vitest';
import { planAIPerimeterDefense } from './aiBuild';
import type { City, Force } from '../types';
import type { DiplomaticState } from '../types/diplomacy';

const NO_DIPLO = { relations: {} } as DiplomaticState;
const mkCity = (over: Partial<City> & { id: string }): City => ({
  ownerForceId: null, troops: 8000, gold: 2000, defense: 20, population: 100_000,
  adjacentCityIds: [], coords: { x: 500, y: 360 }, name: { zh: over.id, en: over.id }, buildSlots: [], ...over,
} as unknown as City);
const mkForce = (over: Partial<Force> & { id: string }): Force => ({
  name: { zh: over.id, en: over.id }, color: '#abc', capitalCityId: over.id, personality: 'defensive', ...over,
} as unknown as Force);

const slotsBuilt = (c: City) => (c.buildSlots ?? []).filter((s) => s.buildingId).length;

describe('§5.5 城防自固 — AI fortifies its frontier cities’ perimeter', () => {
  const ctx = (over: Partial<Parameters<typeof planAIPerimeterDefense>[0]> = {}) => ({
    cities: {
      front: mkCity({ id: 'front', ownerForceId: 'AI', adjacentCityIds: ['edge'] }),
      edge: mkCity({ id: 'edge', ownerForceId: 'P' }), // hostile neighbour (player)
      rear: mkCity({ id: 'rear', ownerForceId: 'AI', adjacentCityIds: ['front'] }), // safe interior
    },
    forces: { AI: mkForce({ id: 'AI' }), P: mkForce({ id: 'P' }) },
    forts: {}, diplomacy: NO_DIPLO, playerForceId: 'P', rng: () => 0, // 0 ⇒ passes the build roll
    ...over,
  });

  it('raises a perimeter defence on a frontier city (paid from its own gold)', () => {
    const out = planAIPerimeterDefense(ctx());
    expect(slotsBuilt(out.cities['front'])).toBe(1);          // built a work
    expect(out.cities['front'].gold).toBeLessThan(2000);      // paid for it
  });

  it('leaves a safe interior city (no hostile border) and the player alone', () => {
    const out = planAIPerimeterDefense(ctx());
    expect(slotsBuilt(out.cities['rear'])).toBe(0);  // not on the frontier
    expect(slotsBuilt(out.cities['edge'])).toBe(0);  // the player's city
  });

  it('holds off when the dice say so, and stops at the cap', () => {
    expect(slotsBuilt(planAIPerimeterDefense(ctx({ rng: () => 0.99 })).cities['front'])).toBe(0);
    // a city already at the cap gets nothing more.
    const capped = ctx();
    capped.cities['front'] = mkCity({ id: 'front', ownerForceId: 'AI', adjacentCityIds: ['edge'],
      buildSlots: [0, 1, 2, 3].map((slot) => ({ slot, buildingId: 'caltrops' as const, level: 1 })) });
    expect(slotsBuilt(planAIPerimeterDefense(capped).cities['front'])).toBe(4); // unchanged
  });
});
