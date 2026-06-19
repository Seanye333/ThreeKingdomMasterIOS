import { describe, it, expect } from 'vitest';
import { razedCity, rebuiltCity, rebuildCost, REBUILD_BASE_COST } from './cityRuin';
import { buildInitialCities } from '../data/cities';

const sample = () => ({ ...buildInitialCities({})[0] });

describe('city ruin / rebuild', () => {
  it('razing guts population, production, garrison and flags the ruin', () => {
    const c = sample();
    const r = razedCity(c);
    expect(r.ruined).toBe(true);
    expect(r.population).toBeLessThan(c.population);
    expect(r.commerce).toBeLessThan(c.commerce);
    expect(r.agriculture).toBeLessThan(c.agriculture);
    expect(r.troops).toBeLessThanOrEqual(Math.floor(c.troops * 0.5));
    expect(r.commerce).toBeGreaterThanOrEqual(1); // never fully zero
  });

  it('rebuild cost scales with population and has a floor', () => {
    const c = sample();
    expect(rebuildCost(c)).toBe(REBUILD_BASE_COST + Math.floor(c.population / 100));
  });

  it('rebuilding clears the ruin and restores workable production', () => {
    const ruined = razedCity(sample());
    const back = rebuiltCity(ruined);
    expect(back.ruined).toBe(false);
    expect(back.population).toBeGreaterThan(ruined.population);
    expect(back.commerce).toBeGreaterThanOrEqual(35);
    expect(back.agriculture).toBeGreaterThanOrEqual(35);
  });
});
