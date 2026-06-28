import { describe, it, expect } from 'vitest';
import { terrainSiegeMultiplier, attackerArm, terrainDefenderMultiplier } from './combat';
import type { City, Officer } from '../types';
import type { Weather } from './weather';

const city = (terrain: string): City => ({ terrain, name: { zh: 'c', en: 'c' } } as unknown as City);
const off = (skills: string[]): Officer => ({ id: 's', name: { zh: 'o', en: 'o' }, skills } as unknown as Officer);
const SNOW: Weather = { kind: 'snow', wind: 'north', windPower: 2 };
const RAIN: Weather = { kind: 'rain', wind: 'south', windPower: 1 };
const DROUGHT: Weather = { kind: 'drought', wind: 'calm', windPower: 0 };

describe('§5.6 attackerArm — what leads the assault', () => {
  it('siege takes precedence, then cavalry, then plain foot', () => {
    expect(attackerArm([off(['siegemaster', 'cavalry-master'])])).toBe('siege'); // engines over horses
    expect(attackerArm([off(['cavalry-master'])])).toBe('cavalry');
    expect(attackerArm([off(['war-god'])])).toBe('infantry');
    expect(attackerArm([null, off(['siegemaster'])])).toBe('siege'); // reads companions too
    expect(attackerArm([])).toBe('infantry');
  });
});

describe('§5.6 因兵制地 — arm vs terrain', () => {
  it('cavalry founders on highland & broken ground; foot is the baseline', () => {
    const cav = terrainSiegeMultiplier(city('mountain'), { arm: 'cavalry' });
    const foot = terrainSiegeMultiplier(city('mountain'), { arm: 'infantry' });
    expect(cav).toBeGreaterThan(foot);                 // 騎不能登險
    expect(foot).toBeCloseTo(terrainDefenderMultiplier(city('mountain'))); // foot = the bare terrain edge
    expect(terrainSiegeMultiplier(city('wetland'), { arm: 'cavalry' }))
      .toBeGreaterThan(terrainSiegeMultiplier(city('wetland'), { arm: 'infantry' })); // 涉澤難施
  });

  it('siege engines crack a pass below the bare-terrain edge (器械破關)', () => {
    const siege = terrainSiegeMultiplier(city('pass'), { arm: 'siege' });
    expect(siege).toBeLessThan(terrainDefenderMultiplier(city('pass')));
    expect(siege).toBeLessThan(terrainSiegeMultiplier(city('pass'), { arm: 'infantry' }));
  });

  it('on open plain the arm makes no difference', () => {
    expect(terrainSiegeMultiplier(city('plain'), { arm: 'cavalry' })).toBe(1);
    expect(terrainSiegeMultiplier(city('plain'), { arm: 'siege' })).toBe(1);
  });
});

describe('§5.6 天時地利 — weather works the ground', () => {
  it('snow seals a mountain pass tighter; rain mires a marsh; drought dries a river', () => {
    expect(terrainSiegeMultiplier(city('pass'), { weather: SNOW }))
      .toBeGreaterThan(terrainSiegeMultiplier(city('pass'))); // 冰封棧道
    expect(terrainSiegeMultiplier(city('wetland'), { weather: RAIN }))
      .toBeGreaterThan(terrainSiegeMultiplier(city('wetland'))); // 久雨愈陷
    expect(terrainSiegeMultiplier(city('water'), { weather: DROUGHT }))
      .toBeLessThan(terrainDefenderMultiplier(city('water')) || 1); // 旱涸可涉 (< the base 1.0)
  });

  it('snow does nothing to a marsh; rain nothing to a pass (terrain-specific)', () => {
    expect(terrainSiegeMultiplier(city('wetland'), { weather: SNOW }))
      .toBeCloseTo(terrainSiegeMultiplier(city('wetland')));
    expect(terrainSiegeMultiplier(city('pass'), { weather: RAIN }))
      .toBeCloseTo(terrainSiegeMultiplier(city('pass')));
  });
});

describe('§5.6 險隘寡守 + 沙漠耗師', () => {
  it('a defile multiplies a small garrison’s hold — numbers can’t be brought to bear', () => {
    const even = terrainSiegeMultiplier(city('pass'), { attackerTroops: 10_000, defenderTroops: 10_000 });
    const swarm = terrainSiegeMultiplier(city('pass'), { attackerTroops: 40_000, defenderTroops: 10_000 });
    expect(swarm).toBeGreaterThan(even); // 一夫當關,萬夫莫開
    // The outnumber term doesn't apply on open plain.
    expect(terrainSiegeMultiplier(city('plain'), { attackerTroops: 40_000, defenderTroops: 10_000 })).toBe(1);
  });

  it('the desert saps a host, and a bigger column suffers more', () => {
    const small = terrainSiegeMultiplier(city('desert'), { attackerTroops: 5_000 });
    const huge = terrainSiegeMultiplier(city('desert'), { attackerTroops: 80_000 });
    expect(small).toBeGreaterThan(1);   // the waste itself bites (was a flat ×1.0 before)
    expect(huge).toBeGreaterThan(small); // 大軍長驅,耗師於瀚海
  });

  it('the worst stack is capped at 2× (winter cavalry storming a held pass)', () => {
    const worst = terrainSiegeMultiplier(city('pass'), {
      arm: 'cavalry', weather: SNOW, attackerTroops: 100_000, defenderTroops: 5_000,
    });
    expect(worst).toBeLessThanOrEqual(2.0);
    expect(worst).toBeGreaterThan(1.5); // but still brutal
  });
});
