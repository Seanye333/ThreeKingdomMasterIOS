import { describe, it, expect } from 'vitest';
import { pickForceTarget, pickReinforcementTarget } from './ai';
import type { City } from '../types';
import type { DiplomaticState } from '../types/diplomacy';

const NO_DIPLO = {} as DiplomaticState; // neutral targets never consult it

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: null,
    troops: 5000,
    defense: 20,
    population: 100_000,
    adjacentCityIds: [],
    coords: { x: 0, y: 0 },
    name: { zh: over.id, en: over.id },
    ...over,
  } as unknown as City);

describe('pickForceTarget — force-level offensive focus', () => {
  it('picks the city the border can collectively overwhelm, weighted by prize', () => {
    const c1 = mkCity({ id: 'c1', ownerForceId: 'A', troops: 6000, adjacentCityIds: ['weak', 'strong'] });
    const c2 = mkCity({ id: 'c2', ownerForceId: 'A', troops: 6000, adjacentCityIds: ['weak'] });
    // Two of our cities border the weak one (massable); only one borders the
    // fortress, which is far too strong to take alone.
    const weak = mkCity({ id: 'weak', troops: 1500, defense: 0, population: 120_000 });
    const strong = mkCity({ id: 'strong', troops: 40_000, defense: 90, population: 300_000 });
    const all = { c1, c2, weak, strong };
    expect(pickForceTarget('A', [c1, c2], all, NO_DIPLO)).toBe('weak');
  });

  it('returns null when nothing on the border is collectively takeable', () => {
    const c1 = mkCity({ id: 'c1', ownerForceId: 'A', troops: 3000, adjacentCityIds: ['fortress'] });
    const fortress = mkCity({ id: 'fortress', troops: 50_000, defense: 95 });
    expect(pickForceTarget('A', [c1], { c1, fortress }, NO_DIPLO)).toBeNull();
  });

  it('ignores our own cities and non-bordering ones', () => {
    const c1 = mkCity({ id: 'c1', ownerForceId: 'A', troops: 8000, adjacentCityIds: ['ally', 'weak'] });
    const ally = mkCity({ id: 'ally', ownerForceId: 'A', troops: 1000 }); // ours — skip
    const weak = mkCity({ id: 'weak', troops: 2000, defense: 10 });
    const farAway = mkCity({ id: 'farAway', troops: 100 }); // not adjacent to anyone
    expect(pickForceTarget('A', [c1], { c1, ally, weak, farAway }, NO_DIPLO)).toBe('weak');
  });
});

describe('pickReinforcementTarget — rear-to-front reinforcement', () => {
  it('sends a safe rear city\'s surplus to a weak front-line neighbour', () => {
    const rear = mkCity({ id: 'rear', ownerForceId: 'A', troops: 12000, adjacentCityIds: ['front'] });
    const front = mkCity({ id: 'front', ownerForceId: 'A', troops: 2000, adjacentCityIds: ['rear', 'neutral'] });
    const neutral = mkCity({ id: 'neutral', troops: 5000 }); // enemy on the front's border
    expect(pickReinforcementTarget(rear, { rear, front, neutral }, 'A', NO_DIPLO)).toBe('front');
  });

  it('keeps a front-line city\'s garrison (returns null)', () => {
    const front = mkCity({ id: 'front', ownerForceId: 'A', troops: 12000, adjacentCityIds: ['neutral', 'rear'] });
    const neutral = mkCity({ id: 'neutral', troops: 5000 });
    const rear = mkCity({ id: 'rear', ownerForceId: 'A', troops: 1000, adjacentCityIds: ['front'] });
    expect(pickReinforcementTarget(front, { front, neutral, rear }, 'A', NO_DIPLO)).toBeNull();
  });

  it('does not reinforce a neighbour that is neither weak nor on the front', () => {
    const rear = mkCity({ id: 'rear', ownerForceId: 'A', troops: 12000, adjacentCityIds: ['strong'] });
    const strong = mkCity({ id: 'strong', ownerForceId: 'A', troops: 10000, adjacentCityIds: ['rear'] });
    expect(pickReinforcementTarget(rear, { rear, strong }, 'A', NO_DIPLO)).toBeNull();
  });
});
