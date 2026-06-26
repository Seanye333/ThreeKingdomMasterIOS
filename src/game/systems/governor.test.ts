/** 委任太守 — locks the magistrate logic. */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import { mkOfficer } from '../../test/factories';
import { planGovernorCommand, governorMisruleEffect } from './governor';

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

describe('施政重點 — governor stance', () => {
  const balanced = mkCity({ agriculture: 30, commerce: 60, defense: 30, troops: 25_000, drill: 0, wallTier: 1, gold: 6000, population: 300_000 });
  it('balanced develops the weakest pillar (default)', () => {
    expect(planGovernorCommand(balanced, civil)).toMatch(/agriculture/); // major- or develop-
  });
  it('military steers to garrison/drill even when the economy lags', () => {
    expect(planGovernorCommand(mkCity({ ...balanced, troops: 1000 }), civil, 'military')).toBe('recruit-troops');
    expect(planGovernorCommand(balanced, civil, 'military')).toBe('drill-troops');
  });
  it('walls raises the ramparts first', () => {
    expect(planGovernorCommand(balanced, civil, 'walls')).toBe('upgrade-wall');
  });
  it('loyalty tops up 民心 first', () => {
    expect(planGovernorCommand(mkCity({ ...balanced, loyalty: 70 }), civil, 'loyalty')).toBe('improve-loyalty');
  });
});

describe('太守做活 — talents move the thresholds', () => {
  it('a charismatic governor acts on simmering unrest a dullard would ignore', () => {
    const city = mkCity({ loyalty: 60, agriculture: 40 }); // above the flat 55 floor
    const dull = mkOfficer({ stats: { politics: 70, charisma: 60 } as never });
    const charming = mkOfficer({ stats: { politics: 70, charisma: 100 } as never });
    expect(planGovernorCommand(city, dull)).not.toBe('improve-loyalty');
    expect(planGovernorCommand(city, charming)).toBe('improve-loyalty');
  });
  it('a sharp governor sweeps graft that a dullard lets fester', () => {
    const city = mkCity({ corruption: 30 }); // below the flat 40 floor
    const dull = mkOfficer({ stats: { politics: 70, intelligence: 60 } as never });
    const sharp = mkOfficer({ stats: { politics: 70, intelligence: 100 } as never });
    expect(planGovernorCommand(city, dull)).not.toBe('anti-corruption');
    expect(planGovernorCommand(city, sharp)).toBe('anti-corruption');
  });
});

describe('太守之弊 — misrule', () => {
  it('a greedy governor lets graft fester and skims the coffers', () => {
    const greedy = mkOfficer({ traits: ['greedy'] as never, loyalty: 80 });
    const m = governorMisruleEffect(greedy, 1, false);
    expect(m.corruption).toBeGreaterThan(0);
    expect(m.skim).toBeGreaterThan(0);
  });
  it('an upright governor exacts no toll', () => {
    const honest = mkOfficer({ loyalty: 80 });
    expect(governorMisruleEffect(honest, 1, false)).toEqual({ corruption: 0, skim: 0, govLoyaltyDelta: 0 });
  });
  it('久任 — a long-seated ambitious governor drifts disloyal (yearly); a loyal one is reassured', () => {
    const ambitious = mkOfficer({ traits: ['ambitious'] as never, loyalty: 70 });
    expect(governorMisruleEffect(ambitious, 5, true).govLoyaltyDelta).toBeLessThan(0);
    const trusty = mkOfficer({ loyalty: 90 });
    expect(governorMisruleEffect(trusty, 5, true).govLoyaltyDelta).toBeGreaterThan(0);
    // …only at the annual tick.
    expect(governorMisruleEffect(ambitious, 5, false).govLoyaltyDelta).toBe(0);
  });
});
