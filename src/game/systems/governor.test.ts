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
});
