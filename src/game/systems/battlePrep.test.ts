/** 戰前準備 — locks the three preparations and their gates. */
import { describe, expect, it } from 'vitest';
import { mkBattle, mkTiles, mkUnit } from '../../test/factories';
import { applyBattlePrep } from './tacticalSchemes';

const base = () => mkBattle({
  units: [
    mkUnit({ id: 'cmd', officerId: 'o1', side: 'attacker', isCommander: true, coord: { col: 0, row: 0 } }),
    mkUnit({ id: 'big', officerId: 'o2', side: 'attacker', troops: 9000, coord: { col: 1, row: 1 } }),
    mkUnit({ id: 'small', officerId: 'o3', side: 'attacker', troops: 2000, coord: { col: 1, row: 2 } }),
    mkUnit({ id: 'foe', officerId: 'o4', side: 'defender', coord: { col: 9, row: 2 } }),
  ],
  width: 12, height: 6,
});

describe('applyBattlePrep', () => {
  it('夜襲 opens the battle under darkness, once', () => {
    const r = applyBattlePrep(base(), 'attacker', 'night');
    expect(r.ok).toBe(true);
    expect(r.battle.timeOfDay).toBe('night');
    expect(applyBattlePrep(r.battle, 'attacker', 'ambush').ok).toBe(false); // one card per side
    expect(applyBattlePrep(r.battle, 'defender', 'night').ok).toBe(true);   // the other side still may
  });

  it('伏兵 conceals the strongest non-commander contingent', () => {
    const r = applyBattlePrep(base(), 'attacker', 'ambush');
    expect(r.ok).toBe(true);
    expect(r.battle.units.find((u) => u.id === 'big')?.hidden).toBe(true);
    expect(r.battle.units.find((u) => u.id === 'cmd')?.hidden).toBeUndefined();
  });

  it('地道 needs walls, attackers only, and surfaces inside', () => {
    expect(applyBattlePrep(base(), 'attacker', 'tunnel').reason).toBe('no walls to tunnel under');
    expect(applyBattlePrep(base(), 'defender', 'tunnel').reason).toBe('defenders dig no tunnels');
    const walled = mkBattle({
      units: base().units,
      width: 12, height: 6,
      tiles: mkTiles(12, 6, { '6,0': 'wall', '6,1': 'wall', '6,2': 'gate', '6,3': 'wall', '6,4': 'wall', '6,5': 'wall' }),
    });
    const r = applyBattlePrep(walled, 'attacker', 'tunnel');
    expect(r.ok).toBe(true);
    expect(r.battle.units.find((u) => u.id === 'small')?.coord.col).toBe(7);
  });

  it('too late after turn 1', () => {
    expect(applyBattlePrep({ ...base(), turn: 2 }, 'attacker', 'night').ok).toBe(false);
  });
});
