/** 委任太守 — locks the magistrate logic. */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import { mkOfficer } from '../../test/factories';
import { planGovernorCommand } from './governor';

const mkCity = (over: Partial<City>): City =>
  ({
    population: 100_000,
    troops: 8000,
    gold: 2000,
    loyalty: 75,
    agriculture: 50,
    commerce: 50,
    defense: 70,
    ...over,
  } as City);

const civil = mkOfficer({ stats: { war: 50, politics: 85 } });
const martial = mkOfficer({ stats: { war: 90, politics: 40 } });

describe('planGovernorCommand', () => {
  it('puts out unrest before anything else', () => {
    expect(planGovernorCommand(mkCity({ loyalty: 40, agriculture: 10 }), civil)).toBe('improve-loyalty');
  });

  it('a martial governor mans a thin garrison first', () => {
    expect(planGovernorCommand(mkCity({ troops: 1000 }), martial)).toBe('recruit-troops');
    // The civil governor develops instead…
    expect(planGovernorCommand(mkCity({ troops: 1000, agriculture: 20 }), civil)).toBe('develop-agriculture');
  });

  it('develops the weakest pillar; low walls join the race', () => {
    expect(planGovernorCommand(mkCity({ agriculture: 30, commerce: 60 }), civil)).toBe('develop-agriculture');
    expect(planGovernorCommand(mkCity({ agriculture: 60, commerce: 30 }), civil)).toBe('develop-commerce');
    expect(planGovernorCommand(mkCity({ agriculture: 60, commerce: 60, defense: 20 }), civil)).toBe('build-defense');
  });

  it('returns null when the treasury cannot fund anything', () => {
    expect(planGovernorCommand(mkCity({ gold: 0 }), civil)).toBeNull();
  });

  it('sweeps entrenched graft before tending the economy', () => {
    expect(planGovernorCommand(mkCity({ corruption: 70 }), civil)).toBe('anti-corruption');
  });

  it('reaches advanced works once every pillar is built out to its cap', () => {
    // Economy/walls maxed, loyalty steady, a real garrison → the magistrate now
    // pulls migrants / drills / upgrades walls instead of idling.
    const built = mkCity({ agriculture: 400, commerce: 400, defense: 200, gold: 6000, loyalty: 80, drill: 0 });
    const order = planGovernorCommand(built, civil);
    expect(order).not.toBeNull();
    expect(['upgrade-wall', 'drill-troops', 'encourage-migration', 'flood-control']).toContain(order);
  });
});
