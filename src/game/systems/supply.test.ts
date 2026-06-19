import { describe, it, expect } from 'vitest';
import { applyStratagem, attackUnits, endTurn } from './tactical';
import { mkUnit, mkBattle, mkTiles, officerMap, fixedRng } from '../../test/factories';

describe('raid-supply (劫糧道 / 烏巢)', () => {
  const W = 14;

  function raider(col: number, side: 'attacker' | 'defender' = 'attacker') {
    const r = mkUnit({ id: 'raider', officerId: 'or', side, coord: { col, row: 0 }, unitType: 'cavalry', ap: 4 });
    const e1 = mkUnit({ id: 'enemy-1', officerId: 'oe1', side: side === 'attacker' ? 'defender' : 'attacker', coord: { col: side === 'attacker' ? W - 1 : 0, row: 4 } });
    const e2 = mkUnit({ id: 'enemy-2', officerId: 'oe2', side: side === 'attacker' ? 'defender' : 'attacker', coord: { col: side === 'attacker' ? W - 1 : 0, row: 5 } });
    const b = mkBattle({ units: [r, e1, e2], width: W, height: 10, tiles: mkTiles(W, 10) });
    return { b, officers: officerMap([r, e1, e2]) };
  }

  it('burns the grain when the attacker reaches the enemy rear — all foes starve', () => {
    const { b, officers } = raider(W - 2); // deep in defender rear
    const r = applyStratagem(b, 'raider', 'raid-supply', { col: W - 2, row: 0 }, officers);
    expect(r.ok).toBe(true);
    for (const u of r.battle.units.filter((u) => u.side === 'defender')) {
      expect(u.effects.some((e) => e.kind === 'starving')).toBe(true);
    }
  });

  it('refuses unless the raider is deep in the enemy rear', () => {
    const { b, officers } = raider(0); // still at own edge
    const r = applyStratagem(b, 'raider', 'raid-supply', { col: 0, row: 0 }, officers);
    expect(r.ok).toBe(false);
  });

  it('works symmetrically for a defender raiding the attacker rear', () => {
    const { b, officers } = raider(2, 'defender'); // defender deep in attacker rear (col <= 2)
    const r = applyStratagem(b, 'raider', 'raid-supply', { col: 2, row: 0 }, officers);
    expect(r.ok).toBe(true);
    for (const u of r.battle.units.filter((u) => u.side === 'attacker')) {
      expect(u.effects.some((e) => e.kind === 'starving')).toBe(true);
    }
  });
});

describe('starving (糧盡) attrition', () => {
  it('bleeds troops and morale each turn', () => {
    const cmdA = mkUnit({ id: 'attacker-cmd', officerId: 'ca', side: 'attacker', isCommander: true, coord: { col: 0, row: 0 } });
    const cmdD = mkUnit({ id: 'defender-cmd', officerId: 'cd', side: 'defender', isCommander: true, coord: { col: 9, row: 9 } });
    const hungry = mkUnit({
      id: 'defender-hungry', officerId: 'dh', side: 'defender', coord: { col: 9, row: 0 },
      troops: 10000, maxTroops: 10000, morale: 80,
      effects: [{ kind: 'starving', turnsLeft: 5 }],
    });
    const after = endTurn(mkBattle({ units: [cmdA, cmdD, hungry], width: 11, height: 11 }));
    const h = after.units.find((u) => u.id === 'defender-hungry')!;
    expect(h.troops).toBeLessThan(10000); // deserters
    expect(h.morale).toBeLessThan(80);    // losing heart
  });

  it('saps the damage a starving unit deals', () => {
    const mk = (starving: boolean) => {
      const a = mkUnit({
        id: 'attacker-a', officerId: 'oa', side: 'attacker', coord: { col: 0, row: 0 }, troops: 3000,
        effects: starving ? [{ kind: 'starving', turnsLeft: 3 }] : [],
      });
      const d = mkUnit({ id: 'defender-d', officerId: 'od', side: 'defender', coord: { col: 0, row: 1 }, troops: 1000000, maxTroops: 1000000 });
      const b = mkBattle({ units: [a, d], tiles: mkTiles(5, 5) });
      const after = attackUnits(b, 'attacker-a', 'defender-d', officerMap([a, d]), fixedRng(0.5));
      return 1000000 - after.units.find((u) => u.id === 'defender-d')!.troops;
    };
    expect(mk(true)).toBeLessThan(mk(false));
  });
});
