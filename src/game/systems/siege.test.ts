import { describe, it, expect } from 'vitest';
import {
  setupTacticalBattle,
  breakGate,
  scaleWall,
  siegeAssaultPower,
  moveCost,
  bestStepToward,
  hexDistance,
} from './tactical';
import { mkOfficer, mkUnit, mkBattle, mkTiles } from '../../test/factories';

describe('setupTacticalBattle — city rampart', () => {
  const battle = setupTacticalBattle({
    cityId: 'test-walled-city-abc',
    width: 14,
    height: 10,
    attackerForceId: 'A',
    defenderForceId: 'D',
    attackers: [{ officer: mkOfficer({ id: 'a1' }), troops: 8000 }],
    defenders: [{ officer: mkOfficer({ id: 'd1' }), troops: 6000 }],
    terrainHint: { terrain: 'plain' },
  });

  it('raises a wall line with a central gate and tracks HP', () => {
    const walls = battle.tiles.filter((t) => t.terrain === 'wall');
    const gates = battle.tiles.filter((t) => t.terrain === 'gate');
    expect(walls.length).toBeGreaterThan(0);
    expect(gates.length).toBe(1);
    expect(battle.wallHp).toBeTruthy();
    // Every wall/gate hex has tracked HP.
    for (const w of [...walls, ...gates]) {
      expect(battle.wallHp![`${w.coord.col},${w.coord.row}`]).toBeGreaterThan(0);
    }
  });

  it('leaves the flanks open so the field never hard-stalls', () => {
    const wallCol = battle.tiles.find((t) => t.terrain === 'wall')!.coord.col;
    const colTiles = battle.tiles.filter((t) => t.coord.col === wallCol);
    const passable = colTiles.filter((t) => t.terrain !== 'wall' && t.terrain !== 'gate');
    expect(passable.length).toBeGreaterThan(0); // top/bottom rows stay open
  });

  it('does not wall field battles or naval battles', () => {
    const field = setupTacticalBattle({
      cityId: 'test-field-xyz', width: 14, height: 10,
      attackerForceId: 'A', defenderForceId: 'D',
      attackers: [{ officer: mkOfficer({ id: 'fa' }), troops: 5000 }],
      defenders: [{ officer: mkOfficer({ id: 'fd' }), troops: 5000 }],
      terrainHint: { terrain: 'plain' }, field: true,
    });
    expect(field.tiles.some((t) => t.terrain === 'wall')).toBe(false);
    expect(field.wallHp).toBeUndefined();

    const naval = setupTacticalBattle({
      cityId: 'test-water-xyz', width: 14, height: 10,
      attackerForceId: 'A', defenderForceId: 'D',
      attackers: [{ officer: mkOfficer({ id: 'na' }), troops: 5000 }],
      defenders: [{ officer: mkOfficer({ id: 'nd' }), troops: 5000 }],
      terrainHint: { terrain: 'water' },
    });
    expect(naval.tiles.some((t) => t.terrain === 'wall')).toBe(false);
  });
});

describe('walls and gates are impassable', () => {
  it('cost Infinity-equivalent (99) to enter', () => {
    const b = mkBattle({ units: [], tiles: mkTiles(6, 6, { '2,2': 'wall', '3,2': 'gate' }) });
    expect(moveCost(b, { col: 2, row: 2 })).toBe(99);
    expect(moveCost(b, { col: 3, row: 2 })).toBe(99);
  });

  it('pathfinding routes around a wall it cannot cross', () => {
    // Wall blocks (1,*) for several rows; the mover must detour through the gap.
    const overrides: Record<string, import('../types').TerrainKind> = {
      '1,0': 'wall', '1,1': 'wall', '1,2': 'wall', '1,3': 'wall',
      // row 4 left open as the gap
    };
    const mover = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 0, row: 2 }, ap: 3 });
    const goal = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 3, row: 2 } });
    const b = mkBattle({ units: [mover, goal], tiles: mkTiles(5, 6, overrides) });
    const step = bestStepToward(b, mover, goal.coord);
    expect(step).not.toBeNull();
    // Must not try to step onto a wall hex.
    expect(b.tiles.find((t) => t.coord.col === step!.col && t.coord.row === step!.row)!.terrain).not.toBe('wall');
  });
});

describe('breakGate / assaultStructure', () => {
  const wallAt = { col: 2, row: 2 };
  function siegeVsWall(hp: number) {
    const siege = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', unitType: 'siege', coord: { col: 1, row: 2 }, troops: 3000, ap: 2 });
    const b = mkBattle({
      units: [siege],
      tiles: mkTiles(6, 6, { '2,2': 'wall' }),
      wallHp: { '2,2': hp },
    });
    return b;
  }

  it('chips a tracked wall down without breaching while HP remains', () => {
    const b = siegeVsWall(100000);
    const after = breakGate(b, 'A1', wallAt);
    expect(after.tiles.find((t) => t.coord.col === 2 && t.coord.row === 2)!.terrain).toBe('wall');
    expect(after.wallHp!['2,2']).toBeLessThan(100000);
    expect(after.units.find((u) => u.id === 'A1')!.ap).toBe(0); // spent all AP
  });

  it('breaches the wall into plain at 0 HP', () => {
    const b = siegeVsWall(100); // low HP → one assault breaches
    const after = breakGate(b, 'A1', wallAt);
    expect(after.tiles.find((t) => t.coord.col === 2 && t.coord.row === 2)!.terrain).toBe('plain');
    expect(after.wallHp?.['2,2']).toBeUndefined();
  });

  it('non-siege units cannot assault', () => {
    const foot = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', unitType: 'infantry', coord: { col: 1, row: 2 }, ap: 3 });
    const b = mkBattle({ units: [foot], tiles: mkTiles(6, 6, { '2,2': 'wall' }), wallHp: { '2,2': 500 } });
    const after = breakGate(b, 'A1', wallAt);
    expect(after.wallHp!['2,2']).toBe(500); // unchanged
  });

  it('untracked gates (named maps) still break in one hit', () => {
    const siege = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', unitType: 'siege', coord: { col: 1, row: 2 }, ap: 2 });
    const b = mkBattle({ units: [siege], tiles: mkTiles(6, 6, { '2,2': 'gate' }) }); // no wallHp
    const after = breakGate(b, 'A1', { col: 2, row: 2 });
    expect(after.tiles.find((t) => t.coord.col === 2 && t.coord.row === 2)!.terrain).toBe('plain');
  });

  it('siegeAssaultPower scales with crew size', () => {
    expect(siegeAssaultPower(6000)).toBeGreaterThan(siegeAssaultPower(1000));
  });
});

describe('scaleWall (雲梯登城)', () => {
  it('lets a supported foot unit cross a wall to the far side', () => {
    const wallAt = { col: 2, row: 2 };
    const foot = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', unitType: 'infantry', coord: { col: 1, row: 2 }, ap: 3 });
    const ladder = mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', unitType: 'siege', coord: { col: 1, row: 1 }, troops: 2000 });
    const b = mkBattle({ units: [foot, ladder], tiles: mkTiles(6, 6, { '2,2': 'wall' }) });
    // ladder must be adjacent to the wall too
    expect(hexDistance(ladder.coord, wallAt)).toBe(1);
    const after = scaleWall(b, 'A1', wallAt);
    const moved = after.units.find((u) => u.id === 'A1')!;
    expect(moved.coord.col).toBeGreaterThan(wallAt.col); // landed past the wall
    expect(moved.ap).toBe(0);
  });

  it('refuses without a friendly siege engine bracing the wall', () => {
    const wallAt = { col: 2, row: 2 };
    const foot = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', unitType: 'infantry', coord: { col: 1, row: 2 }, ap: 3 });
    const b = mkBattle({ units: [foot], tiles: mkTiles(6, 6, { '2,2': 'wall' }) });
    const after = scaleWall(b, 'A1', wallAt);
    expect(after).toBe(b); // no change
  });

  it('siege units do not scale (they batter)', () => {
    const wallAt = { col: 2, row: 2 };
    const siege = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', unitType: 'siege', coord: { col: 1, row: 2 }, ap: 2 });
    const ladder = mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', unitType: 'siege', coord: { col: 1, row: 1 }, troops: 2000 });
    const b = mkBattle({ units: [siege, ladder], tiles: mkTiles(6, 6, { '2,2': 'wall' }) });
    expect(scaleWall(b, 'A1', wallAt)).toBe(b);
  });
});
