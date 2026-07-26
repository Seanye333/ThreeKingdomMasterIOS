import { describe, expect, it } from 'vitest';
import {
  batterTargets, repairTargets, scaleTargets,
  breakGate, repairWall, scaleWall,
  hexNeighbours, FORT_MAX_HP, WALL_REPAIR_PER_ACTION, siegeAssaultPower,
} from './tactical';
import type { HexCoord, TacticalBattle, TacticalUnit } from '../types';

/**
 * 攻城動作 — the three siege actions existed in the engine but were reachable
 * only from tacticalAi: the player could neither batter a gate, nor scale a
 * wall, nor repair one. Adding player entry points meant adding "where is this
 * legal?" predicates, which necessarily restate the preconditions buried in
 * each action.
 *
 * That duplication is the risk, so every test here checks the PAIR: a coord the
 * predicate lists must change the battle when the action runs on it, and a
 * coord it doesn't list must leave the battle untouched. If the two drift, the
 * player gets a button that does nothing (or is denied one that would work).
 */

let nextId = 0;
const unit = (u: Partial<TacticalUnit> & { coord: HexCoord }): TacticalUnit =>
  ({
    id: `u${nextId++}`, side: 'attacker', unitType: 'infantry', troops: 3000,
    maxTroops: 3000, ap: 2, morale: 100, effects: [], officerId: 'o1',
    ...u,
  }) as TacticalUnit;

const board = (
  tiles: Array<[number, number, string]>,
  units: TacticalUnit[],
  wallHp?: Record<string, number>,
): TacticalBattle =>
  ({
    id: 'b', turn: 1, activeSide: 'attacker',
    tiles: tiles.map(([col, row, terrain]) => ({ coord: { col, row }, terrain })),
    units, wallHp, log: [], stratagemCooldowns: {},
  }) as unknown as TacticalBattle;

/** A 3-wide strip: attacker column 1, wall column 2, city interior column 3. */
const strip = (wallTerrain = 'wall'): Array<[number, number, string]> => {
  const t: Array<[number, number, string]> = [];
  for (let row = 0; row < 5; row++) {
    t.push([1, row, 'plain'], [2, row, wallTerrain], [3, row, 'plain']);
  }
  return t;
};

const changed = (a: TacticalBattle, b: TacticalBattle) => a !== b && JSON.stringify(a) !== JSON.stringify(b);

describe('batterTargets ↔ breakGate', () => {
  it('lists the adjacent masonry, and each listed hex really batters', () => {
    const ram = unit({ coord: { col: 1, row: 2 }, unitType: 'siege' });
    const b = board(strip(), [ram], { '2,2': 1000, '2,1': 1000, '2,3': 1000 });
    const targets = batterTargets(b, ram.id);
    expect(targets.length).toBeGreaterThan(0);
    for (const c of targets) expect(changed(b, breakGate(b, ram.id, c)), `${c.col},${c.row}`).toBe(true);
  });

  it('never lists a hex breakGate would refuse', () => {
    const ram = unit({ coord: { col: 1, row: 2 }, unitType: 'siege' });
    const b = board(strip(), [ram], { '2,2': 1000 });
    const listed = new Set(batterTargets(b, ram.id).map((c) => `${c.col},${c.row}`));
    for (const c of hexNeighbours(ram.coord)) {
      if (listed.has(`${c.col},${c.row}`)) continue;
      expect(changed(b, breakGate(b, ram.id, c)), `${c.col},${c.row}`).toBe(false);
    }
  });

  it('only siege contingents batter — foot beside the same wall get nothing', () => {
    const foot = unit({ coord: { col: 1, row: 2 }, unitType: 'infantry' });
    const b = board(strip(), [foot], { '2,2': 1000 });
    expect(batterTargets(b, foot.id)).toEqual([]);
    expect(changed(b, breakGate(b, foot.id, { col: 2, row: 2 }))).toBe(false);
  });

  it('goes quiet once the contingent has spent its action', () => {
    const ram = unit({ coord: { col: 1, row: 2 }, unitType: 'siege', ap: 0 });
    const b = board(strip(), [ram], { '2,2': 1000 });
    expect(batterTargets(b, ram.id)).toEqual([]);
  });

  it('takes the hex down by exactly the engine assault power', () => {
    const ram = unit({ coord: { col: 1, row: 2 }, unitType: 'siege', troops: 2000 });
    const b = board(strip(), [ram], { '2,2': 1000 });
    const after = breakGate(b, ram.id, { col: 2, row: 2 });
    expect(after.wallHp!['2,2']).toBe(1000 - siegeAssaultPower(2000));
  });
});

describe('repairTargets ↔ repairWall', () => {
  const garrison = () => unit({ coord: { col: 3, row: 2 }, side: 'defender' });

  it('lists battered masonry, and each listed hex really repairs', () => {
    const g = garrison();
    const b = board(strip(), [g], { '2,2': 400, '2,1': 400 });
    const targets = repairTargets(b, g.id);
    expect(targets.length).toBeGreaterThan(0);
    for (const c of targets) {
      const after = repairWall(b, g.id, c);
      expect(after.wallHp![`${c.col},${c.row}`]).toBe(400 + WALL_REPAIR_PER_ACTION);
    }
  });

  it('does not list a wall already at full strength', () => {
    const g = garrison();
    const b = board(strip(), [g], { '2,2': FORT_MAX_HP.wall });
    expect(repairTargets(b, g.id)).toEqual([]);
    expect(changed(b, repairWall(b, g.id, { col: 2, row: 2 }))).toBe(false);
  });

  it('does not list an untracked fortification — there is no HP to restore', () => {
    const g = garrison();
    const b = board(strip(), [g], {});
    expect(repairTargets(b, g.id)).toEqual([]);
  });

  it('is a garrison action only — the besieger cannot repair the wall it is breaking', () => {
    const attacker = unit({ coord: { col: 1, row: 2 }, side: 'attacker' });
    const b = board(strip(), [attacker], { '2,2': 400 });
    expect(repairTargets(b, attacker.id)).toEqual([]);
    expect(changed(b, repairWall(b, attacker.id, { col: 2, row: 2 }))).toBe(false);
  });

  it('never lists a hex repairWall would refuse', () => {
    const g = garrison();
    const b = board(strip(), [g], { '2,2': 400 });
    const listed = new Set(repairTargets(b, g.id).map((c) => `${c.col},${c.row}`));
    for (const c of hexNeighbours(g.coord)) {
      if (listed.has(`${c.col},${c.row}`)) continue;
      expect(changed(b, repairWall(b, g.id, c)), `${c.col},${c.row}`).toBe(false);
    }
  });
});

describe('scaleTargets ↔ scaleWall', () => {
  it('lists a wall only when a friendly engine is braced on it', () => {
    const foot = unit({ coord: { col: 1, row: 2 } });
    const alone = board(strip(), [foot], { '2,2': 1000 });
    expect(scaleTargets(alone, foot.id)).toEqual([]);
    expect(changed(alone, scaleWall(alone, foot.id, { col: 2, row: 2 }))).toBe(false);

    const ram = unit({ coord: { col: 1, row: 3 }, unitType: 'siege' });
    const withLadder = board(strip(), [foot, ram], { '2,2': 1000 });
    const targets = scaleTargets(withLadder, foot.id);
    expect(targets.length).toBeGreaterThan(0);
    for (const c of targets) expect(changed(withLadder, scaleWall(withLadder, foot.id, c))).toBe(true);
  });

  it('puts the climber down on the far side of the wall', () => {
    const foot = unit({ coord: { col: 1, row: 2 } });
    const ram = unit({ coord: { col: 1, row: 2 }, unitType: 'siege' });
    // Engine adjacent to the same wall, from a different hex.
    const b = board(strip(), [foot, { ...ram, coord: { col: 1, row: 3 } }], { '2,2': 1000 });
    const target = scaleTargets(b, foot.id)[0];
    const after = scaleWall(b, foot.id, target);
    const moved = after.units.find((u) => u.id === foot.id)!;
    expect(moved.coord.col).toBeGreaterThan(target.col);
    expect(moved.ap).toBe(0);
  });

  it('an engine cannot climb its own ladder', () => {
    const ram = unit({ coord: { col: 1, row: 2 }, unitType: 'siege' });
    const b = board(strip(), [ram], { '2,2': 1000 });
    expect(scaleTargets(b, ram.id)).toEqual([]);
  });

  it('will not list a gate — ladders go over ramparts, not through doors', () => {
    const foot = unit({ coord: { col: 1, row: 2 } });
    const ram = unit({ coord: { col: 1, row: 3 }, unitType: 'siege' });
    const b = board(strip('gate'), [foot, ram], { '2,2': 700 });
    expect(scaleTargets(b, foot.id)).toEqual([]);
  });

  it('will not list a wall with nowhere to land behind it', () => {
    const foot = unit({ coord: { col: 1, row: 2 } });
    const ram = unit({ coord: { col: 1, row: 3 }, unitType: 'siege' });
    // Fill every interior hex so no landing spot is free.
    const blockers = [0, 1, 2, 3, 4].map((row) =>
      unit({ coord: { col: 3, row }, side: 'defender' }));
    const b = board(strip(), [foot, ram, ...blockers], { '2,2': 1000 });
    expect(scaleTargets(b, foot.id)).toEqual([]);
    expect(changed(b, scaleWall(b, foot.id, { col: 2, row: 2 }))).toBe(false);
  });
});
