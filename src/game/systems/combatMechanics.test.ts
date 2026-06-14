import { describe, it, expect } from 'vitest';
import { formationCounterMul, areBonded, insideWalls } from './tactical';
import { mkBattle, mkTiles } from '../../test/factories';

describe('陣克陣 — formationCounterMul', () => {
  it('offence beats defence, defence beats mobility, mobility beats offence', () => {
    expect(formationCounterMul('awl', 'fish-scale')).toBeGreaterThan(1);     // 攻破守
    expect(formationCounterMul('fish-scale', 'crane-wing')).toBeGreaterThan(1); // 守克機動
    expect(formationCounterMul('crane-wing', 'awl')).toBeGreaterThan(1);     // 機動繞攻
  });
  it('the losing side of a matchup is penalised, mirror/mystic/none are neutral', () => {
    expect(formationCounterMul('fish-scale', 'awl')).toBeLessThan(1);
    expect(formationCounterMul('awl', 'wheel')).toBe(1);          // both offensive
    expect(formationCounterMul('eight-trigrams', 'awl')).toBe(1); // mystic neutral
    expect(formationCounterMul('none', 'awl')).toBe(1);
  });
});

describe('連携 — areBonded', () => {
  it('recognises sworn pairs in either order, rejects strangers', () => {
    expect(areBonded('liu-bei', 'guan-yu')).toBe(true);
    expect(areBonded('guan-yu', 'liu-bei')).toBe(true);
    expect(areBonded('sun-ce', 'zhou-yu')).toBe(true);
    expect(areBonded('liu-bei', 'cao-cao')).toBe(false);
  });
});

describe('巷戰 — insideWalls', () => {
  it('flags interior hexes past the wall line, not the open field', () => {
    const tiles = mkTiles(12, 8, {
      '3,2': 'wall', '3,3': 'gate', '3,4': 'wall',
      '8,2': 'wall', '8,3': 'wall', '8,4': 'wall',
    });
    const b = mkBattle({ units: [], tiles, width: 12, height: 8 });
    expect(insideWalls(b, { col: 6, row: 3 })).toBe(true);   // inside the enclosure
    expect(insideWalls(b, { col: 1, row: 3 })).toBe(false);  // outside, west of the wall
  });
  it('returns false when there are no walls', () => {
    const b = mkBattle({ units: [], width: 10, height: 8 });
    expect(insideWalls(b, { col: 5, row: 4 })).toBe(false);
  });
});
