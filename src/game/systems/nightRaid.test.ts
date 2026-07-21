import { describe, it, expect } from 'vitest';
import {
  willRaid, raidSurpriseChance, resolveNightRaid, MIN_RAIDERS,
} from './nightRaid';

const base = {
  raiders: 1000, raiderWar: 90, raiderIntellect: 70,
  campTroops: 40000, campFatigue: 30, campSeasons: 3,
};

describe('誰肯夜出', () => {
  it('a bold officer will; a mediocre one will not', () => {
    expect(willRaid({ raiders: 1000, raiderWar: 90, raiderIntellect: 50 })).toBe(true);
    expect(willRaid({ raiders: 1000, raiderWar: 50, raiderIntellect: 85 })).toBe(true);
    expect(willRaid({ raiders: 1000, raiderWar: 50, raiderIntellect: 50 })).toBe(false);
  });

  it('a handful of men is not a raid', () => {
    expect(willRaid({ raiders: MIN_RAIDERS - 1, raiderWar: 99, raiderIntellect: 99 })).toBe(false);
  });
});

describe('乘其不備', () => {
  it('頓兵久則懈 — a camp that has stood there for seasons is the soft target', () => {
    expect(raidSurpriseChance({ ...base, campSeasons: 8 }))
      .toBeGreaterThan(raidSurpriseChance({ ...base, campSeasons: 1 }));
  });

  it('a weary camp keeps a bad watch', () => {
    expect(raidSurpriseChance({ ...base, campFatigue: 90 }))
      .toBeGreaterThan(raidSurpriseChance({ ...base, campFatigue: 0 }));
  });

  it('a clever besieger keeps a good one', () => {
    expect(raidSurpriseChance({ ...base, campIntellect: 98 }))
      .toBeLessThan(raidSurpriseChance({ ...base, campIntellect: 40 }));
  });

  it('rain covers the approach', () => {
    expect(raidSurpriseChance({ ...base, covered: true }))
      .toBeGreaterThan(raidSurpriseChance(base));
  });

  it('the leader matters more than the numbers', () => {
    const many = raidSurpriseChance({ ...base, raiders: 40000 });
    const clever = raidSurpriseChance({ ...base, raiderIntellect: 99 });
    expect(clever).toBeGreaterThan(many);
  });

  it('stays inside its bounds', () => {
    const best = raidSurpriseChance({
      ...base, campSeasons: 40, campFatigue: 100, raiderIntellect: 100, raiderWar: 100, covered: true,
    });
    const worst = raidSurpriseChance({
      ...base, campSeasons: 0, campFatigue: 0, raiderIntellect: 0, raiderWar: 0, campIntellect: 100,
    });
    expect(best).toBeLessThanOrEqual(0.85);
    expect(worst).toBeGreaterThanOrEqual(0.02);
  });
});

describe('劫營', () => {
  const always = () => 0;
  const never = () => 0.999;

  it('a mediocre garrison never tries', () => {
    expect(resolveNightRaid({ ...base, raiderWar: 40, raiderIntellect: 40 }, 8, always).success).toBe(false);
  });

  it('a beaten raid costs the garrison most of the party and the camp nothing', () => {
    const r = resolveNightRaid(base, 8, never);
    expect(r.success).toBe(false);
    expect(r.raiderLosses).toBe(600);
    expect(r.campLosses).toBe(0);
    expect(r.enginesBurned).toBe(0);
  });

  it('a successful one burns what the siege was made of', () => {
    const r = resolveNightRaid(base, 10, always);
    expect(r.success).toBe(true);
    expect(r.enginesBurned).toBeGreaterThanOrEqual(6);
    expect(r.foodBurnedFrac).toBeGreaterThan(0.3);
    expect(r.campLosses).toBeGreaterThan(0);
    expect(r.morale).toBeLessThan(0);
    expect(r.fatigue).toBeGreaterThan(0);
    // …and costs far less than a failed one.
    expect(r.raiderLosses).toBeLessThan(resolveNightRaid(base, 10, never).raiderLosses);
  });

  it('a fiercer party bites deeper', () => {
    const fierce = resolveNightRaid({ ...base, raiderWar: 100 }, 8, always);
    const plain = resolveNightRaid({ ...base, raiderWar: 75 }, 8, always);
    expect(fierce.campLosses).toBeGreaterThan(plain.campLosses);
  });

  it('burns no more engines than are standing', () => {
    expect(resolveNightRaid(base, 0, always).enginesBurned).toBe(0);
    expect(resolveNightRaid(base, 2, always).enginesBurned).toBeLessThanOrEqual(2);
  });

  it('never kills more of the camp than is in it', () => {
    const r = resolveNightRaid({ ...base, campTroops: 100, raiderWar: 100 }, 4, always);
    expect(r.campLosses).toBeLessThanOrEqual(100);
  });
});
