import { describe, it, expect } from 'vitest';
import { endTurn } from './tactical';
import { mkUnit, mkBattle, mkTiles } from '../../test/factories';

/**
 * Boiling-oil / rolling-logs wall reaction. Triggers at the end of the
 * attacker's turn for intact, manned wall/gate hexes against attackers hugging
 * the wall.
 */
function siegeBoard(opts: { manned: boolean; wallHp?: number; attackerCol: number }) {
  const wallAt = { col: 5, row: 3 };
  // Attacker hugging (col 4) or standing off (further away).
  const atk = mkUnit({
    id: 'attacker-sap', officerId: 'oa', side: 'attacker', unitType: 'siege',
    coord: { col: opts.attackerCol, row: 3 }, troops: 10000, maxTroops: 10000,
  });
  const atkCmd = mkUnit({ id: 'attacker-cmd', officerId: 'oac', side: 'attacker', isCommander: true, coord: { col: 0, row: 0 } });
  const units = [atk, atkCmd];
  // Defender garrison within 2 hexes of the wall (manning it) or far away.
  const defCmd = mkUnit({
    id: 'defender-cmd', officerId: 'odc', side: 'defender', isCommander: true,
    coord: opts.manned ? { col: 6, row: 3 } : { col: 9, row: 9 },
  });
  units.push(defCmd);
  const b = mkBattle({
    units,
    width: 11,
    height: 11,
    tiles: mkTiles(11, 11, { '5,3': 'wall' }),
    wallHp: { '5,3': opts.wallHp ?? 1000 },
    activeSide: 'attacker', // ending the attacker's turn
  });
  return { b };
}

describe('wall reaction (滾木礌石 / 金汁)', () => {
  it('scorches an attacker hugging a manned wall at the end of its turn', () => {
    const { b } = siegeBoard({ manned: true, attackerCol: 4 });
    const after = endTurn(b);
    const sap = after.units.find((u) => u.id === 'attacker-sap')!;
    expect(sap.troops).toBeLessThan(10000);
    expect(after.attackerLosses).toBeGreaterThan(0);
  });

  it('an abandoned (unmanned) wall pours nothing', () => {
    const { b } = siegeBoard({ manned: false, attackerCol: 4 });
    const after = endTurn(b);
    expect(after.units.find((u) => u.id === 'attacker-sap')!.troops).toBe(10000);
  });

  it('spares attackers who keep their distance from the wall', () => {
    const { b } = siegeBoard({ manned: true, attackerCol: 1 });
    const after = endTurn(b);
    expect(after.units.find((u) => u.id === 'attacker-sap')!.troops).toBe(10000);
  });

  it('a battered wall pours less than a pristine one', () => {
    const strong = endTurn(siegeBoard({ manned: true, attackerCol: 4, wallHp: 1000 }).b);
    const weak = endTurn(siegeBoard({ manned: true, attackerCol: 4, wallHp: 300 }).b);
    const strongLoss = 10000 - strong.units.find((u) => u.id === 'attacker-sap')!.troops;
    const weakLoss = 10000 - weak.units.find((u) => u.id === 'attacker-sap')!.troops;
    expect(weakLoss).toBeLessThan(strongLoss);
    expect(weakLoss).toBeGreaterThan(0);
  });

  it('does not fire on the defender turn', () => {
    const { b } = siegeBoard({ manned: true, attackerCol: 4 });
    const after = endTurn({ ...b, activeSide: 'defender' });
    expect(after.units.find((u) => u.id === 'attacker-sap')!.troops).toBe(10000);
  });
});
