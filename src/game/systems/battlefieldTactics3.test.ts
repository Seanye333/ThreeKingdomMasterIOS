import { describe, it, expect } from 'vitest';
import {
  attackUnits, endTurn, canAttack, attackRange, hasLineOfSight, weatherMoveSurcharge, moveCost,
} from './tactical';
import { mkOfficer, mkUnit, mkBattle, mkTiles, officerMap, fixedRng } from '../../test/factories';

const HP = 1_000_000;
const dmgOf = (before: number, u: { troops: number }) => before - u.troops;

describe('指揮繼承 — chain of command', () => {
  it('the steadiest survivor takes the banner and the crash is softened', () => {
    const atk = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 1, row: 2 }, troops: 200000, maxTroops: 200000 });
    const cmd = mkUnit({ id: 'C', officerId: 'oC', side: 'defender', isCommander: true, coord: { col: 2, row: 2 }, troops: 3000, maxTroops: 200000 });
    const heir = mkUnit({ id: 'H', officerId: 'oH', side: 'defender', coord: { col: 5, row: 5 }, morale: 100 });
    const witness = mkUnit({ id: 'W', officerId: 'oW', side: 'defender', coord: { col: 6, row: 6 }, morale: 100 });
    const units = [atk, cmd, heir, witness];
    const omap = officerMap(units, [
      mkOfficer({ id: 'oH', stats: { war: 70, leadership: 90, intelligence: 60, politics: 50, charisma: 60 } }),
      mkOfficer({ id: 'oW', stats: { war: 70, leadership: 60, intelligence: 60, politics: 50, charisma: 60 } }),
    ]);
    const b = mkBattle({ units, tiles: mkTiles(10, 8) });
    const after = attackUnits(b, 'A', 'C', omap, fixedRng(0.5));
    expect(after.units.find((u) => u.id === 'C')!.troops).toBe(0); // commander felled
    expect(after.units.find((u) => u.id === 'H')!.isCommander).toBe(true); // 接掌帥旗 (higher LED)
    expect(after.units.find((u) => u.id === 'W')!.isCommander).toBe(false);
    expect(after.units.find((u) => u.id === 'W')!.morale).toBe(85); // −15 mitigated, not −30
  });
});

describe('戰局氣勢 — battle momentum', () => {
  it('felling a unit swings the tide toward the striker; a commander swings it more', () => {
    const atk = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 1, row: 0 }, troops: HP });
    const grunt = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 2, row: 0 }, troops: 1000, maxTroops: 1000 });
    const b = mkBattle({ units: [atk, grunt], tiles: mkTiles(6, 5) });
    expect(attackUnits(b, 'A', 'D', officerMap([atk, grunt]), fixedRng(0.5)).momentum).toBe(9);
    const cmd = { ...grunt, isCommander: true };
    const b2 = mkBattle({ units: [atk, cmd], tiles: mkTiles(6, 5) });
    expect(attackUnits(b2, 'A', 'D', officerMap([atk, cmd]), fixedRng(0.5)).momentum).toBe(22);
  });

  it('the favoured side hits harder (順勢)', () => {
    const mk = (mom: number) => {
      const a = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 1, row: 0 } });
      const d = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 2, row: 0 }, troops: HP, maxTroops: HP });
      const b = mkBattle({ units: [a, d], momentum: mom, tiles: mkTiles(6, 5) });
      return dmgOf(HP, attackUnits(b, 'A', 'D', officerMap([a, d]), fixedRng(0.5)).units.find((u) => u.id === 'D')!);
    };
    expect(mk(80)).toBeGreaterThan(mk(0));
  });

  it('endTurn decays the tide and feeds the favoured side\'s morale', () => {
    const ac = mkUnit({ id: 'AC', officerId: 'oAC', side: 'attacker', isCommander: true, coord: { col: 1, row: 1 }, morale: 70 });
    const dc = mkUnit({ id: 'DC', officerId: 'oDC', side: 'defender', isCommander: true, coord: { col: 8, row: 8 }, morale: 70 });
    const b = mkBattle({ units: [ac, dc], momentum: 80, activeSide: 'attacker', tiles: mkTiles(12, 10) });
    const after = endTurn(b, officerMap([ac, dc]));
    expect(after.momentum).toBe(68); // trunc(80 × 0.85)
    expect(after.units.find((u) => u.id === 'AC')!.morale).toBeGreaterThan(70); // 順勢 — attacker rises
    expect(after.units.find((u) => u.id === 'DC')!.morale).toBeLessThan(70);    // 頹勢 — defender bleeds
  });
});

describe('天候泥濘 — weather drags on the march', () => {
  it('rain/snow mud open ground; firm footing is spared', () => {
    expect(weatherMoveSurcharge('rain', 'plain')).toBe(1);
    expect(weatherMoveSurcharge('snow', 'road')).toBe(1);
    expect(weatherMoveSurcharge('rain', 'forest')).toBe(0);
    expect(weatherMoveSurcharge('clear', 'plain')).toBe(0);
    const wet = mkBattle({ units: [], weather: 'rain', tiles: mkTiles(4, 4) });
    const dry = mkBattle({ units: [], weather: 'clear', tiles: mkTiles(4, 4) });
    expect(moveCost(wet, { col: 1, row: 1 })).toBe(2); // plain 1 + mud 1
    expect(moveCost(dry, { col: 1, row: 1 })).toBe(1);
  });
});

describe('射擊縱深 — ranged depth (range / LoS / cover / no-counter)', () => {
  it('ranged arms reach; melee arms do not', () => {
    const archer = mkUnit({ id: 'R', officerId: 'oR', side: 'attacker', unitType: 'archers', coord: { col: 0, row: 2 }, ammo: 3, maxAmmo: 3 });
    const foot = mkUnit({ id: 'F', officerId: 'oF', side: 'attacker', unitType: 'infantry', coord: { col: 0, row: 0 } });
    const tgt = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 3, row: 2 } });
    const tgt2 = mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 3, row: 0 } });
    const b = mkBattle({ units: [archer, foot, tgt, tgt2], tiles: mkTiles(8, 6) });
    expect(attackRange(archer)).toBe(3);
    expect(canAttack(b, archer, tgt)).toBe(true);   // dist 3, in range, clear LoS, has ammo
    expect(canAttack(b, foot, tgt2)).toBe(false);   // melee can't reach dist 3
  });

  it('a wall on the line blocks the shot; an empty lane does not', () => {
    const clear = mkBattle({ units: [], tiles: mkTiles(6, 6) });
    const walled = mkBattle({ units: [], tiles: mkTiles(6, 6, { '1,0': 'wall', '1,1': 'wall', '1,2': 'wall', '1,3': 'wall', '1,4': 'wall', '1,5': 'wall' }) });
    expect(hasLineOfSight(clear, { col: 0, row: 2 }, { col: 3, row: 2 })).toBe(true);
    expect(hasLineOfSight(walled, { col: 0, row: 2 }, { col: 3, row: 2 })).toBe(false);
  });

  it('a ranged shot spends an arrow and draws no riposte from an out-of-reach foe', () => {
    const archer = mkUnit({ id: 'R', officerId: 'oR', side: 'attacker', unitType: 'archers', coord: { col: 0, row: 2 }, ammo: 3, maxAmmo: 3, troops: 8000, maxTroops: 8000 });
    const tgt = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', unitType: 'infantry', coord: { col: 3, row: 2 }, troops: HP, maxTroops: HP });
    const b = mkBattle({ units: [archer, tgt], tiles: mkTiles(8, 6) });
    const after = attackUnits(b, 'R', 'D', officerMap([archer, tgt]), fixedRng(0.5));
    expect(after.units.find((u) => u.id === 'D')!.troops).toBeLessThan(HP); // shot landed
    expect(after.units.find((u) => u.id === 'R')!.troops).toBe(8000);       // no counter
    expect(after.units.find((u) => u.id === 'R')!.ammo).toBe(2);            // arrow spent
  });

  it('cover (forest) blunts a ranged shot', () => {
    const shoot = (terrain: Record<string, string>) => {
      const archer = mkUnit({ id: 'R', officerId: 'oR', side: 'attacker', unitType: 'archers', coord: { col: 0, row: 2 }, ammo: 3, maxAmmo: 3 });
      const tgt = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 3, row: 2 }, troops: HP, maxTroops: HP });
      const b = mkBattle({ units: [archer, tgt], tiles: mkTiles(8, 6, terrain as never) });
      return dmgOf(HP, attackUnits(b, 'R', 'D', officerMap([archer, tgt]), fixedRng(0.5)).units.find((u) => u.id === 'D')!);
    };
    expect(shoot({ '3,2': 'forest' })).toBeLessThan(shoot({})); // 林木遮蔽
  });
});
