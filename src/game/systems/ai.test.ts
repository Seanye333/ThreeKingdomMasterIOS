import { describe, it, expect } from 'vitest';
import { pickForceTarget, pickReinforcementTarget, forcePosture, findHegemon, chooseDevelopment, planAITurn } from './ai';
import type { City, Force } from '../types';
import type { DiplomaticState } from '../types/diplomacy';
import { mkOfficer } from '../../test/factories';
import { prestigeRecruitBonus } from './officerFate';

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

describe('威名 eases recruitment (prestigeRecruitBonus)', () => {
  it('a no-name lord adds nothing; a famed one adds a real bonus', () => {
    expect(prestigeRecruitBonus(mkOfficer({ stats: { war: 50, leadership: 50, intelligence: 50, politics: 50, charisma: 50 } }))).toBe(0);
    // 虎將 (top tier) → +0.08
    expect(prestigeRecruitBonus(mkOfficer({ prestigeTitleId: 'tiger-general' }))).toBeCloseTo(0.08, 5);
    // 軍師 (lesser title) → +0.04
    expect(prestigeRecruitBonus(mkOfficer({ prestigeTitleId: 'strategist' }))).toBeCloseTo(0.04, 5);
  });
});

describe('AI uses the new systems (private guard + sworn brotherhood)', () => {
  const mkCity = (over: Partial<City> & { id: string }): City =>
    ({ ownerForceId: null, troops: 6000, defense: 20, population: 100_000, adjacentCityIds: [],
       coords: { x: 0, y: 0 }, name: { zh: over.id, en: over.id }, gold: 0, food: 5000,
       commerce: 50, agriculture: 50, ...over } as unknown as City);

  // One isolated AI force (no enemy neighbours → no marches to muddy the test).
  const cap = mkCity({ id: 'cap', ownerForceId: 'A', gold: 50_000, adjacentCityIds: [] });
  const force: Force = { id: 'A', rulerOfficerId: 'r', name: { zh: 'A', en: 'A' }, color: '#fff', capitalCityId: 'cap' } as unknown as Force;
  const ruler = mkOfficer({ id: 'r', forceId: 'A', locationCityId: 'cap', status: 'idle', stats: { war: 92, leadership: 88, intelligence: 70, politics: 60, charisma: 70 } });
  const general = mkOfficer({ id: 'g', forceId: 'A', locationCityId: 'cap', status: 'idle', stats: { war: 85, leadership: 80, intelligence: 60, politics: 50, charisma: 55 } });

  const run = () => planAITurn({
    cities: { cap: { ...cap } }, officers: { r: { ...ruler }, g: { ...general } },
    forces: { A: force }, playerForceId: 'P', pendingCommands: {}, pendingTrainings: [],
    buildings: [], diplomacy: { relations: {} } as DiplomaticState, runtimeBonds: [],
    date: { year: 200, season: 'spring', month: 1, phase: 'upper' },
    rng: () => 0.01, // <0.07 so 結拜 fires; deterministic
  });

  it('levies 私兵 for its top commander when the treasury is flush', () => {
    const out = run();
    const guard = Math.max(out.officers.r.privateTroops ?? 0, out.officers.g.privateTroops ?? 0);
    expect(guard).toBeGreaterThan(0);
  });

  it('forges a sworn-brother bond between its two strongest warriors', () => {
    const out = run();
    const sworn = out.runtimeBonds.find((b) => b.kind === 'sibling' &&
      ((b.officerA === 'r' && b.officerB === 'g') || (b.officerA === 'g' && b.officerB === 'r')));
    expect(sworn).toBeTruthy();
    // Both lifted to the loyalty floor.
    expect(out.officers.r.loyalty).toBeGreaterThanOrEqual(90);
    expect(out.officers.g.loyalty).toBeGreaterThanOrEqual(90);
  });

  it('does not bankrupt itself — spends from the capital, leaving a reserve', () => {
    const out = run();
    expect(out.cities.cap.gold).toBeLessThan(50_000); // spent something
    expect(out.cities.cap.gold).toBeGreaterThan(0);    // but not all
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
