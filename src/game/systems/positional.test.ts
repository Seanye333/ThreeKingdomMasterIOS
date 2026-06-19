import { describe, it, expect } from 'vitest';
import {
  movementCost,
  canMove,
  moveUnit,
  attackUnits,
  endTurn,
  hexNeighbours,
} from './tactical';
import { mkUnit, mkBattle, mkTiles, officerMap, fixedRng } from '../../test/factories';

describe('zone of control (沾滯)', () => {
  it('charges +1 to break contact with all engaged enemies', () => {
    const me = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 2, row: 2 }, ap: 4 });
    const foe = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 3, row: 2 } });
    const b = mkBattle({ units: [me, foe], tiles: mkTiles(7, 7) });
    // Step to a hex that is NOT adjacent to the foe → disengage surcharge.
    const away = { col: 1, row: 2 };
    expect(movementCost(b, me, away)).toBe(2); // plain(1) + ZOC(1)
  });

  it('is free when repositioning while staying in contact', () => {
    const me = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 2, row: 2 }, ap: 4 });
    const foe = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 3, row: 2 } });
    const b = mkBattle({ units: [me, foe], tiles: mkTiles(7, 7) });
    // A hex adjacent to the mover that is ALSO adjacent to the foe → still engaged.
    const shared = hexNeighbours(me.coord).find(
      (c) => hexNeighbours(foe.coord).some((f) => f.col === c.col && f.row === c.row),
    )!;
    expect(movementCost(b, me, shared)).toBe(1); // plain only, still engaged
  });

  it('a free (unengaged) unit pays only terrain cost', () => {
    const me = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 2, row: 2 }, ap: 4 });
    const b = mkBattle({ units: [me], tiles: mkTiles(7, 7) });
    expect(movementCost(b, me, { col: 1, row: 2 })).toBe(1);
  });

  it('canMove blocks a disengage the unit cannot afford', () => {
    const me = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 2, row: 2 }, ap: 1 });
    const foe = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 3, row: 2 } });
    const b = mkBattle({ units: [me, foe], tiles: mkTiles(7, 7) });
    expect(canMove(b, me, { col: 1, row: 2 })).toBe(false); // needs 2 AP, has 1
  });

  it('moveUnit deducts the surcharge', () => {
    const me = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 2, row: 2 }, ap: 4 });
    const foe = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 3, row: 2 } });
    const b = mkBattle({ units: [me, foe], tiles: mkTiles(7, 7) });
    const after = moveUnit(b, 'A1', { col: 1, row: 2 });
    expect(after.units.find((u) => u.id === 'A1')!.ap).toBe(2); // 4 - (1+1)
  });
});

describe('pincer / 夾擊 bonus', () => {
  it('a target pressed by extra friendlies takes more damage', () => {
    const target = () => mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 3, row: 3 }, troops: 1_000_000, maxTroops: 1_000_000 });
    const attacker = () => mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 2, row: 3 }, troops: 3000 });

    // Solo attack.
    const solo = mkBattle({ units: [attacker(), target()], tiles: mkTiles(7, 7) });
    const soloDmg = 1_000_000 - attackUnits(solo, 'A1', 'D1', officerMap(solo.units), fixedRng(0.5))
      .units.find((u) => u.id === 'D1')!.troops;

    // Same attack, but two more friendlies also surround the target.
    const t = target();
    const helpers = [
      mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', coord: { col: 3, row: 2 } }),
      mkUnit({ id: 'A3', officerId: 'oA3', side: 'attacker', coord: { col: 3, row: 4 } }),
    ];
    const ganged = mkBattle({ units: [attacker(), t, ...helpers], tiles: mkTiles(7, 7) });
    const gangDmg = 1_000_000 - attackUnits(ganged, 'A1', 'D1', officerMap(ganged.units), fixedRng(0.5))
      .units.find((u) => u.id === 'D1')!.troops;

    expect(gangDmg).toBeGreaterThan(soloDmg);
  });
});

describe('escape objective (bug fix)', () => {
  it('does NOT resolve while the commander is mid-field', () => {
    const cmd = mkUnit({ id: 'attacker-cmd', officerId: 'ca', side: 'attacker', isCommander: true, coord: { col: 6, row: 4 } });
    const foe = mkUnit({ id: 'defender-cmd', officerId: 'cd', side: 'defender', isCommander: true, coord: { col: 13, row: 8 } });
    const b = mkBattle({
      units: [cmd, foe], width: 14, height: 10,
      attackerObjective: { kind: 'escape' },
    });
    const after = endTurn(b);
    expect(after.attackerObjective?.resolved).toBeUndefined();
    expect(after.winner).toBeUndefined();
  });

  it('resolves success once the commander reaches the home edge', () => {
    const cmd = mkUnit({ id: 'attacker-cmd', officerId: 'ca', side: 'attacker', isCommander: true, coord: { col: 0, row: 4 } });
    const foe = mkUnit({ id: 'defender-cmd', officerId: 'cd', side: 'defender', isCommander: true, coord: { col: 13, row: 8 } });
    const b = mkBattle({
      units: [cmd, foe], width: 14, height: 10,
      attackerObjective: { kind: 'escape' },
    });
    const after = endTurn(b);
    expect(after.attackerObjective?.resolved).toBe('success');
    expect(after.winner).toBe('attacker');
  });
});
