import { describe, expect, it } from 'vitest';
import {
  wallState, wallFraction, fortMaxHp, hitsToBreach, repairsOutpace,
  netAssaultPerTurn, wallReadings, weakestWall, WALL_STATE_LABEL,
} from './wallDamage';
import { FORT_MAX_HP, WALL_REPAIR_PER_ACTION, siegeAssaultPower } from '../../../game/systems/tactical';
import type { TacticalBattle } from '../../../game/types';

/**
 * The bar on screen must never promise a breach the engine won't grant, so
 * these tests check the reading against the engine's own constants rather than
 * against numbers copied into the expectations.
 */

describe('wallFraction / wallState', () => {
  it('reads full strength from the engine table, not a copy', () => {
    expect(fortMaxHp('wall')).toBe(FORT_MAX_HP.wall);
    expect(fortMaxHp('gate')).toBe(FORT_MAX_HP.gate);
    expect(wallFraction(FORT_MAX_HP.wall, 'wall')).toBe(1);
    expect(wallFraction(FORT_MAX_HP.gate, 'gate')).toBe(1);
  });

  it('falls back the same way repairWall does for an unlisted fortification', () => {
    expect(fortMaxHp('rampart')).toBe(1000);
  });

  it('treats an untracked hex as intact — it breaks in one hit, it is not damaged', () => {
    expect(wallFraction(undefined, 'gate')).toBe(1);
    expect(wallState(undefined, 'gate')).toBe('intact');
  });

  it('walks down the four states as the masonry goes', () => {
    const max = FORT_MAX_HP.wall;
    expect(wallState(max, 'wall')).toBe('intact');
    expect(wallState(max * 0.7, 'wall')).toBe('battered');
    expect(wallState(max * 0.4, 'wall')).toBe('crumbling');
    expect(wallState(max * 0.1, 'wall')).toBe('critical');
    expect(wallState(1, 'wall')).toBe('critical');
  });

  it('clamps a hex somehow above full or below zero', () => {
    expect(wallFraction(99999, 'wall')).toBe(1);
    expect(wallFraction(-50, 'wall')).toBe(0);
  });

  it('labels every state bilingually with a colour', () => {
    for (const s of ['intact', 'battered', 'crumbling', 'critical'] as const) {
      const l = WALL_STATE_LABEL[s];
      expect(l.zh.length).toBeGreaterThan(0);
      expect(l.en.length).toBeGreaterThan(0);
      expect(l.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('scales a gate against gate strength, not wall strength', () => {
    // 700 HP on a gate is full; the same figure on a wall is only 70%.
    expect(wallState(FORT_MAX_HP.gate, 'gate')).toBe('intact');
    expect(wallState(FORT_MAX_HP.gate, 'wall')).toBe('battered');
  });
});

describe('hitsToBreach — agrees with what breakGate actually does', () => {
  it('counts assaults using the engine formula', () => {
    const troops = 3000;
    const per = siegeAssaultPower(troops);
    expect(hitsToBreach(per, troops)).toBe(1);
    expect(hitsToBreach(per + 1, troops)).toBe(2);
    expect(hitsToBreach(per * 3, troops)).toBe(3);
  });

  it('never reports zero for a standing wall', () => {
    expect(hitsToBreach(1, 9000)).toBe(1);
  });

  it('says one hit for an untracked hex, matching the legacy gate path', () => {
    expect(hitsToBreach(undefined, 500)).toBe(1);
  });

  /** A wiped-out crew still carries the +120 floor, so this must not divide by zero. */
  it('handles a contingent with no men left', () => {
    expect(hitsToBreach(1000, 0)).toBe(Math.ceil(1000 / siegeAssaultPower(0)));
  });
});

describe('the repair race', () => {
  it('flags when a garrison out-repairs a single small engine', () => {
    // A crew this small chips less than the 180 a repair action restores.
    const feeble = 100;
    expect(siegeAssaultPower(feeble)).toBeLessThan(WALL_REPAIR_PER_ACTION);
    expect(repairsOutpace(feeble)).toBe(true);
    expect(netAssaultPerTurn(feeble, 1)).toBeLessThan(0);
  });

  it('a proper siege train breaks through repairs', () => {
    expect(repairsOutpace(5000)).toBe(false);
    expect(netAssaultPerTurn(5000, 1)).toBeGreaterThan(0);
  });

  it('counts several defenders shoring up the same hex', () => {
    const troops = 2000;
    const need = Math.ceil(siegeAssaultPower(troops) / WALL_REPAIR_PER_ACTION);
    expect(repairsOutpace(troops, need)).toBe(true);
    expect(repairsOutpace(troops, need - 1)).toBe(false);
  });

  it('with nobody repairing, net progress is the raw assault', () => {
    expect(netAssaultPerTurn(4000)).toBe(siegeAssaultPower(4000));
  });
});

const battle = (
  tiles: Array<[number, number, string]>,
  wallHp?: Record<string, number>,
): TacticalBattle =>
  ({
    tiles: tiles.map(([col, row, terrain]) => ({ coord: { col, row }, terrain })),
    wallHp,
  }) as unknown as TacticalBattle;

describe('wallReadings / weakestWall', () => {
  const b = battle(
    [[1, 1, 'wall'], [1, 2, 'gate'], [1, 3, 'wall'], [2, 2, 'plain']],
    { '1,1': 900, '1,2': 140, '1,3': 400 },
  );

  it('returns only tracked fortification hexes, weakest first', () => {
    const r = wallReadings(b);
    expect(r.map((x) => x.hp)).toEqual([140, 400, 900]);
    expect(r.every((x) => x.terrain === 'wall' || x.terrain === 'gate')).toBe(true);
  });

  it('measures each hex against its own maximum', () => {
    const r = wallReadings(b);
    const gate = r.find((x) => x.terrain === 'gate')!;
    expect(gate.max).toBe(FORT_MAX_HP.gate);
    expect(gate.fraction).toBeCloseTo(140 / FORT_MAX_HP.gate);
  });

  it('skips a fortification hex the engine is not tracking', () => {
    const partial = battle([[1, 1, 'wall'], [1, 2, 'wall']], { '1,1': 500 });
    expect(wallReadings(partial).map((x) => x.coord.row)).toEqual([1]);
  });

  it('is empty for a field battle', () => {
    expect(wallReadings(battle([[1, 1, 'plain']]))).toEqual([]);
    expect(weakestWall(battle([[1, 1, 'plain']]))).toBeNull();
  });

  it('names the hex about to fall', () => {
    const w = weakestWall(b)!;
    expect(w.coord).toEqual({ col: 1, row: 2 });
    expect(w.state).toBe('critical');
  });

  it('stays quiet while every wall is still sound', () => {
    const sound = battle([[1, 1, 'wall'], [1, 2, 'gate']], { '1,1': 1000, '1,2': 700 });
    expect(weakestWall(sound)).toBeNull();
  });
});
