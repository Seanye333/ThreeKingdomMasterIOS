import { describe, it, expect } from 'vitest';
import { marchLedger, armyEndurance, enduranceTag } from './campaignLedger';
import { provisionNeeded } from './convoy';

describe('糧秣簿', () => {
  const base = { troops: 10000, seasonsPlanned: 3, cityFood: 60000, cityTroops: 20000 };

  it('a full granary provisions the journey and says so', () => {
    const l = marchLedger(base);
    expect(l.need).toBe(provisionNeeded(10000, 3));
    expect(l.drawn).toBe(l.need);
    expect(l.shortfall).toBe(0);
    expect(l.seasonsCovered).toBeGreaterThanOrEqual(3);
    expect(l.verdict).toBe('ample');
  });

  it('an empty granary is called short before you march, not after', () => {
    const l = marchLedger({ ...base, cityFood: 1000 });
    expect(l.shortfall).toBeGreaterThan(0);
    expect(l.seasonsCovered).toBeLessThan(3);
    expect(l.verdict).toBe('short');
    expect(l.noteZh).toContain('乏食');
  });

  it('counts what a standing army already carries', () => {
    const fresh = marchLedger({ ...base, cityFood: 3000 });
    const laden = marchLedger({ ...base, cityFood: 3000, carried: 9000 });
    expect(laden.drawn).toBeLessThan(fresh.drawn + 9000);
    expect(laden.seasonsCovered).toBeGreaterThan(fresh.seasonsCovered);
  });

  it('warns when the city itself is left hungry behind you', () => {
    // Provisioning strips the granary; the garrison left behind eats too.
    const l = marchLedger({ troops: 4000, seasonsPlanned: 4, cityFood: 4200, cityTroops: 30000 });
    expect(l.cityFoodLeft).toBeLessThan(1000);
    expect(l.citySeasonsLeft).toBe(0);
    expect(l.verdict).not.toBe('ample');
  });

  it('never draws more grain than the city has', () => {
    const l = marchLedger({ ...base, cityFood: 500 });
    expect(l.drawn).toBeLessThanOrEqual(500);
    expect(l.cityFoodLeft).toBeGreaterThanOrEqual(0);
  });

  it('a garrisonless city can wait forever', () => {
    const l = marchLedger({ troops: 1000, seasonsPlanned: 1, cityFood: 90000, cityTroops: 1000 });
    expect(l.citySeasonsLeft).toBe(Infinity);
  });

  it('rounds a fractional journey up to whole seasons', () => {
    expect(marchLedger({ ...base, seasonsPlanned: 0 }).seasonsPlanned).toBe(1);
  });
});

describe('餘糧幾季', () => {
  it('counts whole seasons only — half a season of grain is none', () => {
    expect(armyEndurance(2500, 10000)).toBe(1);   // 10k troops eat 2500/season
    expect(armyEndurance(2499, 10000)).toBe(0);
  });

  it('flags the column that starves this season', () => {
    expect(enduranceTag(0, 10000).urgent).toBe(true);
    expect(enduranceTag(2500, 10000).urgent).toBe(true);
    expect(enduranceTag(25000, 10000).urgent).toBe(false);
  });

  it('handles a column with no grain field at all', () => {
    expect(armyEndurance(undefined, 5000)).toBe(0);
  });
});
