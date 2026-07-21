import { describe, it, expect } from 'vitest';
import {
  engineBuildRate, enginePartyMul, burnEngines, enginePartyTier, ENGINE_PARK_CAP,
} from './siegeWorks';

const base = { standing: 0, engineerIntellect: 70, troops: 20000 };

describe('營造攻具', () => {
  it('a camp with hands and a joiner builds', () => {
    expect(engineBuildRate(base)).toBeGreaterThan(0);
  });

  it('a clever engineer builds faster than a dullard', () => {
    expect(engineBuildRate({ ...base, engineerIntellect: 95 }))
      .toBeGreaterThan(engineBuildRate({ ...base, engineerIntellect: 40 }));
  });

  it('timber country builds far faster', () => {
    expect(engineBuildRate({ ...base, timberRich: true })).toBeGreaterThan(engineBuildRate(base));
  });

  it('a bigger camp builds faster, up to a point', () => {
    expect(engineBuildRate({ ...base, troops: 40000 }))
      .toBeGreaterThan(engineBuildRate({ ...base, troops: 5000 }));
    expect(engineBuildRate({ ...base, troops: 400000 }))
      .toBe(engineBuildRate({ ...base, troops: 24000 }));   // hands cap at 2
  });

  it('stops at the park cap', () => {
    expect(engineBuildRate({ ...base, standing: ENGINE_PARK_CAP })).toBe(0);
    expect(engineBuildRate({ ...base, standing: ENGINE_PARK_CAP - 0.2 }))
      .toBeLessThanOrEqual(0.2);
  });
});

describe('器械之利', () => {
  it('no engines, no help', () => {
    expect(enginePartyMul(0)).toBe(1);
  });

  it('the first engines matter most', () => {
    const first = 1 - enginePartyMul(2);
    const later = enginePartyMul(8) - enginePartyMul(10);
    expect(first).toBeGreaterThan(later);
  });

  it('never makes a wall irrelevant', () => {
    expect(enginePartyMul(ENGINE_PARK_CAP)).toBeGreaterThan(0.6);
    expect(enginePartyMul(999)).toBe(enginePartyMul(ENGINE_PARK_CAP));
  });
});

describe('焚其攻具 — 郝昭守陳倉', () => {
  const always = () => 0;
  const never = () => 0.999;

  it('an empty park cannot burn', () => {
    expect(burnEngines({ standing: 0, defenderIntellect: 90, defenderTroops: 5000 }, always).burned).toBe(0);
  });

  it('a dead garrison sets nothing alight', () => {
    expect(burnEngines({ standing: 10, defenderIntellect: 90, defenderTroops: 0 }, always).burned).toBe(0);
  });

  it('a clever defender burns a real share of the park', () => {
    const r = burnEngines({ standing: 10, defenderIntellect: 95, defenderTroops: 8000 }, always);
    expect(r.burned).toBeGreaterThanOrEqual(3);
    expect(r.notable).toBe(true);
  });

  it('a dull one burns less', () => {
    const clever = burnEngines({ standing: 10, defenderIntellect: 95, defenderTroops: 8000 }, always);
    const dull = burnEngines({ standing: 10, defenderIntellect: 40, defenderTroops: 8000 }, always);
    expect(dull.burned).toBeLessThan(clever.burned);
  });

  it('rain damps the fire arrows', () => {
    // With rng at 0.25 a dry garrison gets its fire away; a wet one does not.
    const rng = () => 0.25;
    expect(burnEngines({ standing: 10, defenderIntellect: 90, defenderTroops: 8000 }, rng).notable).toBe(true);
    expect(burnEngines({ standing: 10, defenderIntellect: 90, defenderTroops: 8000, wet: true }, rng).notable).toBe(false);
  });

  it('a quiet season still costs a big park to wear', () => {
    expect(burnEngines({ standing: 8, defenderIntellect: 60, defenderTroops: 5000 }, never).burned).toBe(1);
    expect(burnEngines({ standing: 2, defenderIntellect: 60, defenderTroops: 5000 }, never).burned).toBe(0);
  });

  it('never burns more than is standing', () => {
    const r = burnEngines({ standing: 1, defenderIntellect: 100, defenderTroops: 9000 }, always);
    expect(r.burned).toBeLessThanOrEqual(1);
  });
});

describe('攻具之況', () => {
  it('reads the park at a glance', () => {
    expect(enginePartyTier(0).zh).toBe('無攻城之具');
    expect(enginePartyTier(2).zh).toBe('始造攻具');
    expect(enginePartyTier(6).zh).toBe('攻具略備');
    expect(enginePartyTier(10).zh).toBe('器械如林');
  });
});
