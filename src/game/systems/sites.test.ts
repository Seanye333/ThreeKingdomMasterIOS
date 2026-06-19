import { describe, it, expect } from 'vitest';
import { tickWildSites } from './sites';
import { buildInitialSites, RESOURCE_SITE_DEFS } from '../data/sites';
import { buildInitialCities } from '../data/cities';

function cityMap() {
  return Object.fromEntries(buildInitialCities({}).map((c) => [c.id, c]));
}

describe('tickWildSites', () => {
  it('a held resource deposit pays gold into an owned guard city', () => {
    const sites = buildInitialSites();
    const cities = cityMap();
    // Iron mountain guarded by Shangdang/Ye.
    sites['res-taihang-iron'].ownerForceId = 'f1';
    const guard = sites['res-taihang-iron'].guards[0];
    cities[guard] = { ...cities[guard], ownerForceId: 'f1', gold: 1000 };
    // Neutralise every other site so only this one acts.
    for (const s of Object.values(sites)) {
      if (s.id !== 'res-taihang-iron') { s.ownerForceId = null; s.hostile = false; }
    }
    const out = tickWildSites({ sites, cities, rng: () => 0.99 });
    expect(out.cities[guard].gold).toBe(1000 + RESOURCE_SITE_DEFS.iron.goldPerSeason);
    expect(out.entries.some((e) => e.kind === 'income')).toBe(true);
  });

  it('a horse pasture sends remounts (troops) not just gold', () => {
    const sites = buildInitialSites();
    const cities = cityMap();
    for (const s of Object.values(sites)) { s.ownerForceId = null; s.hostile = false; }
    sites['res-hexi-horse'].ownerForceId = 'f1';
    const guard = sites['res-hexi-horse'].guards[0];
    const before = cities[guard].troops;
    cities[guard] = { ...cities[guard], ownerForceId: 'f1' };
    const out = tickWildSites({ sites, cities, rng: () => 0.5 });
    expect(out.cities[guard].troops).toBe(before + RESOURCE_SITE_DEFS.horse.troopsPerSeason);
  });

  it('an unowned deposit pays nobody', () => {
    const sites = buildInitialSites();
    const cities = cityMap();
    for (const s of Object.values(sites)) { s.ownerForceId = null; s.hostile = false; }
    const out = tickWildSites({ sites, cities, rng: () => 0.99 });
    expect(out.entries.filter((e) => e.kind === 'income').length).toBe(0);
  });

  it('a hostile bandit nest sacks a neighbouring owned city', () => {
    const sites = buildInitialSites();
    const cities = cityMap();
    for (const s of Object.values(sites)) {
      if (s.subtype !== 'bandit') { s.ownerForceId = null; s.hostile = false; }
    }
    // Leave only Heishan hostile.
    for (const s of Object.values(sites)) {
      if (s.subtype === 'bandit' && s.id !== 'bandit-heishan') s.hostile = false;
    }
    const guard = sites['bandit-heishan'].guards[0];
    cities[guard] = { ...cities[guard], ownerForceId: 'f1', gold: 5000, troops: 20000 };
    const out = tickWildSites({ sites, cities, rng: () => 0.0 }); // force a raid on guard[0]
    expect(out.cities[guard].gold).toBeLessThan(5000);
    expect(out.cities[guard].troops).toBeLessThan(20000);
    expect(out.entries.some((e) => e.kind === 'tribe-raid')).toBe(true);
  });

  it('a pacified (owned) bandit nest no longer raids', () => {
    const sites = buildInitialSites();
    const cities = cityMap();
    for (const s of Object.values(sites)) {
      if (s.subtype === 'bandit') { s.ownerForceId = 'f1'; s.hostile = false; }
      else { s.ownerForceId = null; s.hostile = false; }
    }
    const out = tickWildSites({ sites, cities, rng: () => 0.0 });
    expect(out.entries.filter((e) => e.kind === 'tribe-raid').length).toBe(0);
  });
});
