import { describe, it, expect } from 'vitest';
import { pickForceTarget, pickReinforcementTarget, forcePosture, findHegemon, chooseDevelopment } from './ai';
import type { City } from '../types';
import type { DiplomaticState } from '../types/diplomacy';

const NO_DIPLO = { relations: {} } as DiplomaticState; // everyone defaults to neutral

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

  it('prioritises a death blow — an enemy force\'s last city — over a bigger neutral prize', () => {
    const c1 = mkCity({ id: 'c1', ownerForceId: 'A', troops: 12000, adjacentCityIds: ['rump', 'bigNeutral'] });
    // 'B' holds only this one city → taking it eliminates the force.
    const rump = mkCity({ id: 'rump', ownerForceId: 'B', troops: 1500, defense: 0, population: 50_000 });
    // Bigger population prize, but neutral (no force to wipe out).
    const bigNeutral = mkCity({ id: 'bigNeutral', troops: 1500, defense: 0, population: 300_000 });
    expect(pickForceTarget('A', [c1], { c1, rump, bigNeutral }, NO_DIPLO)).toBe('rump');
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

describe('forcePosture — consolidate when outmatched', () => {
  it('turns defensive when a bordering force overshadows us (≥1.5×)', () => {
    const a1 = mkCity({ id: 'a1', ownerForceId: 'A', troops: 5000, adjacentCityIds: ['b1'] });
    const b1 = mkCity({ id: 'b1', ownerForceId: 'B', troops: 9000, adjacentCityIds: ['a1'] });
    expect(forcePosture('A', [a1], { a1, b1 })).toBe('defensive');
  });

  it('stays aggressive against a comparable neighbour', () => {
    const a1 = mkCity({ id: 'a1', ownerForceId: 'A', troops: 10000, adjacentCityIds: ['b1'] });
    const b1 = mkCity({ id: 'b1', ownerForceId: 'B', troops: 8000, adjacentCityIds: ['a1'] });
    expect(forcePosture('A', [a1], { a1, b1 })).toBe('aggressive');
  });

  it('stays aggressive with no bordering force', () => {
    const a1 = mkCity({ id: 'a1', ownerForceId: 'A', troops: 5000, adjacentCityIds: [] });
    expect(forcePosture('A', [a1], { a1 })).toBe('aggressive');
  });
});

describe('findHegemon — runaway-power detection', () => {
  it('flags a force that dominates (>1.3× the next strongest)', () => {
    const a = mkCity({ id: 'a', ownerForceId: 'A', troops: 30000 });
    const b = mkCity({ id: 'b', ownerForceId: 'B', troops: 10000 });
    const c = mkCity({ id: 'c', ownerForceId: 'C', troops: 8000 });
    expect(findHegemon({ a, b, c })).toBe('A');
  });

  it('returns null when the top two are close', () => {
    const a = mkCity({ id: 'a', ownerForceId: 'A', troops: 12000 });
    const b = mkCity({ id: 'b', ownerForceId: 'B', troops: 10000 });
    expect(findHegemon({ a, b })).toBeNull();
  });

  it('returns null with only one force', () => {
    const a = mkCity({ id: 'a', ownerForceId: 'A', troops: 5000 });
    expect(findHegemon({ a })).toBeNull();
  });
});

describe('pickForceTarget — 合縱抗霸 hegemon bias', () => {
  it('prefers the hegemon\'s city over an equal non-hegemon target', () => {
    const c1 = mkCity({ id: 'c1', ownerForceId: 'A', troops: 6000, adjacentCityIds: ['hcity', 'ncity'] });
    const hcity = mkCity({ id: 'hcity', ownerForceId: 'H', troops: 1500, defense: 0, population: 100_000 });
    const ncity = mkCity({ id: 'ncity', ownerForceId: 'N', troops: 1500, defense: 0, population: 100_000 });
    expect(pickForceTarget('A', [c1], { c1, hcity, ncity }, NO_DIPLO, 'H')).toBe('hcity');
  });
});

describe('chooseDevelopment — front fortifies, rear grows', () => {
  it('a poorly-walled front city builds defence', () => {
    const c = mkCity({ id: 'c', defense: 40, commerce: 60, agriculture: 50 });
    expect(chooseDevelopment(c, true)).toBe('build-defense');
  });

  it('a well-walled front city funds the economy', () => {
    const c = mkCity({ id: 'c', defense: 90, commerce: 30, agriculture: 50 });
    expect(chooseDevelopment(c, true)).toBe('develop-commerce'); // commerce is the lower
  });

  it('a rear city grows the economy even with weak walls', () => {
    const c = mkCity({ id: 'c', defense: 10, commerce: 60, agriculture: 40 });
    expect(chooseDevelopment(c, false)).toBe('develop-agriculture'); // never wastes on walls
  });
});
