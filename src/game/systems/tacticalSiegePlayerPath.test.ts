import { describe, expect, it } from 'vitest';
import {
  batterTargets, repairTargets, scaleTargets,
  breakGate, repairWall, scaleWall,
  bestStepToward, moveUnit, hexDistance, tileAt, FORT_MAX_HP,
} from './tactical';
import { setupTacticalBattle } from './tacticalSetup';
import { mkOfficer } from '../../test/factories';
import type { TacticalBattle, TacticalUnit } from '../types';

/**
 * 玩家攻城全程 — the unit tests for the target predicates use synthetic strips.
 * This one walks a REAL generated siege board end to end, because the bug being
 * fixed was never about the rules: `breakGate`/`repairWall`/`scaleWall` all
 * worked, they simply had no caller outside tacticalAi, so nothing verified
 * that a player-driven sequence could actually open a city.
 */

const walledCity = (): TacticalBattle =>
  setupTacticalBattle({
    cityId: 'siege-player-path',
    width: 14,
    height: 10,
    attackerForceId: 'A',
    defenderForceId: 'D',
    attackers: [
      { officer: mkOfficer({ id: 'ram' }), troops: 6000 },
      { officer: mkOfficer({ id: 'foot' }), troops: 5000 },
    ],
    defenders: [{ officer: mkOfficer({ id: 'garrison' }), troops: 6000 }],
    terrainHint: { terrain: 'plain' },
  });

/** March a unit at a coord until it is adjacent, refilling AP each "turn". */
function marchAdjacent(b: TacticalBattle, unitId: string, target: { col: number; row: number }): TacticalBattle {
  let cur = b;
  for (let i = 0; i < 60; i++) {
    const u = cur.units.find((x) => x.id === unitId)!;
    if (hexDistance(u.coord, target) === 1) return cur;
    const step = bestStepToward(cur, u, target);
    if (!step) break;
    cur = moveUnit(cur, unitId, step);
    // Refill so the walk isn't rationed by AP — this test is about the siege
    // actions, not about movement economy.
    cur = { ...cur, units: cur.units.map((x) => (x.id === unitId ? { ...x, ap: 4 } : x)) };
  }
  return cur;
}

const setType = (b: TacticalBattle, id: string, unitType: TacticalUnit['unitType']): TacticalBattle =>
  ({ ...b, units: b.units.map((u) => (u.id === id ? { ...u, unitType } : u)) });

const unitIdOf = (b: TacticalBattle, officerId: string) =>
  b.units.find((u) => u.officerId === officerId)!.id;

describe('a player can actually take a walled city', () => {
  it('batters a real gate down to a breach, one assault at a time', () => {
    let b = walledCity();
    const ramId = unitIdOf(b, 'ram');
    b = setType(b, ramId, 'siege');

    const gate = b.tiles.find((t) => t.terrain === 'gate')!;
    b = marchAdjacent(b, ramId, gate.coord);
    expect(hexDistance(b.units.find((u) => u.id === ramId)!.coord, gate.coord)).toBe(1);

    // The button would now be offered, and it must name this gate.
    const targets = batterTargets(b, ramId);
    expect(targets.some((c) => c.col === gate.coord.col && c.row === gate.coord.row)).toBe(true);

    // Hammer it until it opens; each assault costs the turn's action.
    let assaults = 0;
    while (tileAt(b, gate.coord)!.terrain === 'gate' && assaults < 30) {
      b = breakGate(b, ramId, gate.coord);
      b = { ...b, units: b.units.map((u) => (u.id === ramId ? { ...u, ap: 2 } : u)) };
      assaults++;
    }
    expect(tileAt(b, gate.coord)!.terrain).toBe('plain');
    expect(b.wallHp?.[`${gate.coord.col},${gate.coord.row}`]).toBeUndefined();
    // A 6000-strong train should not take all day about it.
    expect(assaults).toBeLessThanOrEqual(3);
    // Once it is a breach there is nothing left to batter there.
    expect(batterTargets(b, ramId).some((c) =>
      c.col === gate.coord.col && c.row === gate.coord.row)).toBe(false);
  });

  it('lets the garrison undo the damage, and stops offering it at full strength', () => {
    let b = walledCity();
    const ramId = unitIdOf(b, 'ram');
    const defId = unitIdOf(b, 'garrison');
    b = setType(b, ramId, 'siege');

    // A light crew: `siegeAssaultPower` gives the full 6000-strong train 1020,
    // which is more than the wall's 1000 HP — it would breach in one blow and
    // delete the very entry this test wants to see repaired.
    b = { ...b, units: b.units.map((u) => (u.id === ramId ? { ...u, troops: 800 } : u)) };
    const wall = b.tiles.find((t) => t.terrain === 'wall')!;
    const key = `${wall.coord.col},${wall.coord.row}`;
    b = marchAdjacent(b, ramId, wall.coord);
    b = breakGate(b, ramId, wall.coord);
    const battered = b.wallHp![key];
    expect(battered).toBeLessThan(FORT_MAX_HP.wall);

    b = marchAdjacent(b, defId, wall.coord);
    const repairable = repairTargets(b, defId);
    expect(repairable.some((c) => c.col === wall.coord.col && c.row === wall.coord.row)).toBe(true);

    // Repair until sound, then the action must stop being offered.
    for (let i = 0; i < 20 && b.wallHp![key] < FORT_MAX_HP.wall; i++) {
      b = repairWall(b, defId, wall.coord);
      b = { ...b, units: b.units.map((u) => (u.id === defId ? { ...u, ap: 2 } : u)) };
    }
    expect(b.wallHp![key]).toBe(FORT_MAX_HP.wall);
    expect(repairTargets(b, defId).some((c) =>
      c.col === wall.coord.col && c.row === wall.coord.row)).toBe(false);
  });

  it('sends foot over the rampart once an engine is braced against it', () => {
    let b = walledCity();
    const ramId = unitIdOf(b, 'ram');
    const footId = unitIdOf(b, 'foot');
    b = setType(b, ramId, 'siege');
    b = setType(b, footId, 'infantry');

    const wall = b.tiles.find((t) => t.terrain === 'wall')!;
    b = marchAdjacent(b, ramId, wall.coord);
    b = marchAdjacent(b, footId, wall.coord);
    b = { ...b, units: b.units.map((u) => (u.id === footId ? { ...u, ap: 2 } : u)) };

    const climbable = scaleTargets(b, footId);
    expect(climbable.length).toBeGreaterThan(0);

    const before = b.units.find((u) => u.id === footId)!.coord;
    const target = climbable[0];
    b = scaleWall(b, footId, target);
    const after = b.units.find((u) => u.id === footId)!.coord;
    expect(after).not.toEqual(before);
    // Landed on the city side of the wall it climbed.
    expect(after.col).toBeGreaterThan(target.col);
  });

  it('offers nothing on an open field — no masonry, no siege actions', () => {
    const field = setupTacticalBattle({
      cityId: 'siege-player-path-field',
      width: 12,
      height: 8,
      attackerForceId: 'A',
      defenderForceId: 'D',
      attackers: [{ officer: mkOfficer({ id: 'ram' }), troops: 6000 }],
      defenders: [{ officer: mkOfficer({ id: 'garrison' }), troops: 6000 }],
      terrainHint: { terrain: 'plain' },
      field: true,
    });
    const ramId = unitIdOf(field, 'ram');
    const b = setType(field, ramId, 'siege');
    expect(batterTargets(b, ramId)).toEqual([]);
    expect(scaleTargets(b, unitIdOf(b, 'garrison'))).toEqual([]);
    expect(repairTargets(b, unitIdOf(b, 'garrison'))).toEqual([]);
  });
});
