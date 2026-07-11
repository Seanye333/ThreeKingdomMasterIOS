import { describe, it, expect } from 'vitest';
import { attackUnits, endTurn, moveUnit, isRouting } from './tactical';
import { challengeDuel, canChallengeDuel } from './tacticalSchemes';
import { mkOfficer, mkUnit, mkBattle, mkTiles, officerMap, fixedRng, seededRng } from '../../test/factories';

// fixedRng(0.5): no crit (0.5 > 0.22), damage roll factor = 0.85 + 0.5·0.3 = 1.0.
const dmgOf = (before: number, unit: { troops: number }) => before - unit.troops;

describe('士氣轉戰力 — morale feeds fighting power', () => {
  it('a high-morale attacker hits harder than a shaken one', () => {
    const aHigh = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 1, row: 0 }, morale: 100 });
    const tHigh = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 2, row: 0 } });
    const aLow = mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', coord: { col: 1, row: 5 }, morale: 30 });
    const tLow = mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 2, row: 5 } });
    const b = mkBattle({ units: [aHigh, tHigh, aLow, tLow], tiles: mkTiles(14, 10) });
    const omap = officerMap([aHigh, tHigh, aLow, tLow]);
    const hi = attackUnits(b, 'A1', 'D1', omap, fixedRng(0.5)).units.find((u) => u.id === 'D1')!;
    const lo = attackUnits(b, 'A2', 'D2', omap, fixedRng(0.5)).units.find((u) => u.id === 'D2')!;
    expect(dmgOf(10000, hi)).toBeGreaterThan(dmgOf(10000, lo));
  });
});

describe('追擊掩殺 — pursuing a routing foe', () => {
  it('a routing target takes more and cannot riposte', () => {
    // Tanky targets so a single blow is partial and the differential is visible.
    const HP = 1_000_000;
    const aR = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 1, row: 0 }, unitType: 'cavalry' });
    const routed = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 2, row: 0 }, morale: 0, troops: HP, maxTroops: HP });
    const aH = mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', coord: { col: 1, row: 5 }, unitType: 'cavalry' });
    const healthy = mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 2, row: 5 }, morale: 100, troops: HP, maxTroops: HP });
    const b = mkBattle({ units: [aR, routed, aH, healthy], tiles: mkTiles(14, 10) });
    const omap = officerMap([aR, routed, aH, healthy]);
    const afterR = attackUnits(b, 'A1', 'D1', omap, fixedRng(0.5));
    const afterH = attackUnits(b, 'A2', 'D2', omap, fixedRng(0.5));
    // Pursuit hits the router harder...
    expect(dmgOf(HP, afterR.units.find((u) => u.id === 'D1')!))
      .toBeGreaterThan(dmgOf(HP, afterH.units.find((u) => u.id === 'D2')!));
    // ...and the router lands no counter, while the healthy foe ripostes.
    expect(afterR.units.find((u) => u.id === 'A1')!.troops).toBe(10000);
    expect(afterH.units.find((u) => u.id === 'A2')!.troops).toBeLessThan(10000);
  });
});

describe('潰走 — routing units linger and flee, they are not wiped', () => {
  it('a manned unit at morale 0 survives endTurn as a router', () => {
    const router = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 12, row: 1 }, morale: 0, troops: 5000 });
    const acmd = mkUnit({ id: 'A0', officerId: 'oA0', side: 'attacker', isCommander: true, coord: { col: 0, row: 9 } });
    const def = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 13, row: 9 } });
    const b = mkBattle({ units: [router, acmd, def], activeSide: 'attacker', tiles: mkTiles(14, 10) });
    const after = endTurn(b, officerMap([router, acmd, def]));
    const r = after.units.find((u) => u.id === 'A1');
    expect(r).toBeDefined();
    expect(isRouting(r!)).toBe(true);
    expect(after.winner).toBeUndefined();
  });

  it('a router bolts toward its own edge on its turn', () => {
    const router = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 8, row: 4 }, morale: 0, troops: 5000 });
    const acmd = mkUnit({ id: 'A0', officerId: 'oA0', side: 'attacker', isCommander: true, coord: { col: 0, row: 9 } });
    const def = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 13, row: 0 } });
    // activeSide defender → endTurn flips to attacker, processRout flees the router.
    const b = mkBattle({ units: [router, acmd, def], activeSide: 'defender', tiles: mkTiles(14, 10) });
    const after = endTurn(b, officerMap([router, acmd, def]));
    const r = after.units.find((u) => u.id === 'A1')!;
    expect(r.coord.col).toBeLessThan(8); // ran back toward col 0
  });

  it('三軍盡潰 — a side whose every unit is routing loses the day', () => {
    const aRouter = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true, coord: { col: 5, row: 5 }, morale: 0, troops: 3000 });
    const def = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 10, row: 5 }, morale: 100 });
    const b = mkBattle({ units: [aRouter, def], activeSide: 'attacker', tiles: mkTiles(14, 10) });
    expect(endTurn(b, officerMap([aRouter, def])).winner).toBe('defender');
  });
});

describe('衝鋒蓄力 — charge momentum', () => {
  it('a cavalry that ran in deals more than one standing in contact', () => {
    const HP = 1_000_000;
    const cav = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 0, row: 4 }, unitType: 'cavalry' });
    const tgt = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 3, row: 4 }, troops: HP, maxTroops: HP });
    const cav2 = mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', coord: { col: 2, row: 8 }, unitType: 'cavalry' });
    const tgt2 = mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 3, row: 8 }, troops: HP, maxTroops: HP });
    const b = mkBattle({ units: [cav, tgt, cav2, tgt2], tiles: mkTiles(14, 10) });
    const omap = officerMap([cav, tgt, cav2, tgt2]);
    // Charger runs (0,4)→(1,4)→(2,4), then strikes the foe ahead.
    let charged = moveUnit(b, 'A1', { col: 1, row: 4 });
    charged = moveUnit(charged, 'A1', { col: 2, row: 4 });
    const runner = charged.units.find((u) => u.id === 'A1')!;
    expect(runner.charge?.dist).toBe(2);
    const chargedDmg = dmgOf(HP, attackUnits(charged, 'A1', 'D1', omap, fixedRng(0.5)).units.find((u) => u.id === 'D1')!);
    // Control: already adjacent, no run.
    const controlDmg = dmgOf(HP, attackUnits(b, 'A2', 'D2', omap, fixedRng(0.5)).units.find((u) => u.id === 'D2')!);
    expect(chargedDmg).toBeGreaterThan(controlDmg);
  });

  it('a braced spearwall facing the charger ripostes harder (拒馬立防)', () => {
    // Spear faces the charger (toward col 2) and is dug in (defending).
    const mkSpear = (facing: number) => mkUnit({
      id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 3, row: 4 },
      unitType: 'spearmen', facing, effects: [{ kind: 'defending', turnsLeft: 1 }],
    });
    const run = (facing: number) => {
      const cav = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 0, row: 4 }, unitType: 'cavalry' });
      const spear = mkSpear(facing);
      const b = mkBattle({ units: [cav, spear], tiles: mkTiles(14, 10) });
      const omap = officerMap([cav, spear]);
      let s = moveUnit(b, 'A1', { col: 1, row: 4 });
      s = moveUnit(s, 'A1', { col: 2, row: 4 });
      return attackUnits(s, 'A1', 'D1', omap, fixedRng(0.5)).units.find((u) => u.id === 'A1')!.troops;
    };
    // facing 3 (west, toward the charger) = braced; facing 0 (east, away) = not.
    const bracedAttacker = run(3);
    const looseAttacker = run(0);
    expect(bracedAttacker).toBeLessThan(looseAttacker); // braced spears bleed the charger more
  });
});

describe('將旗統率 — command radius & 孤軍 decay', () => {
  it('shelters units in the banner and saps the isolated', () => {
    const cmd = mkUnit({ id: 'A0', officerId: 'oA0', side: 'attacker', isCommander: true, coord: { col: 5, row: 5 }, morale: 100 });
    const near = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 6, row: 5 }, morale: 50 });
    const lone = mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', coord: { col: 12, row: 0 }, morale: 50 });
    const def = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 13, row: 9 } });
    const b = mkBattle({ units: [cmd, near, lone, def], activeSide: 'attacker', tiles: mkTiles(14, 10) });
    const after = endTurn(b, officerMap([cmd, near, lone, def]));
    expect(after.units.find((u) => u.id === 'A1')!.morale).toBeGreaterThan(50); // steadied
    expect(after.units.find((u) => u.id === 'A2')!.morale).toBeLessThan(50);    // 孤軍 wavers
  });
});

describe('陣前單挑 — in-battle challenge', () => {
  it('spends the challenger\'s turn and tallies 車輪戰 fatigue on both', () => {
    const champ = mkUnit({ id: 'A1', officerId: 'oChamp', side: 'attacker', coord: { col: 1, row: 0 } });
    const weak = mkUnit({ id: 'D1', officerId: 'oWeak', side: 'defender', coord: { col: 2, row: 0 } });
    const omap = officerMap([champ, weak], [
      mkOfficer({ id: 'oChamp', stats: { war: 95, leadership: 70, intelligence: 60, politics: 50, charisma: 60 } }),
      mkOfficer({ id: 'oWeak', stats: { war: 55, leadership: 60, intelligence: 60, politics: 50, charisma: 60 } }),
    ]);
    const b = mkBattle({ units: [champ, weak], tiles: mkTiles(14, 10) });
    expect(canChallengeDuel(champ, weak, omap)).toBe(true);
    const after = challengeDuel(b, 'A1', 'D1', omap, seededRng(7));
    expect(after.units.find((u) => u.id === 'A1')!.ap).toBe(0);
    expect(after.units.find((u) => u.id === 'A1')!.duelFatigue).toBe(1);
    expect(after.units.find((u) => u.id === 'D1')!.duelFatigue).toBe(1);
  });

  it('refuses a challenge across a gap or against a router', () => {
    const champ = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 1, row: 0 } });
    const far = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 5, row: 0 } });
    const routed = mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 2, row: 0 }, morale: 0 });
    const omap = officerMap([champ, far, routed]);
    expect(canChallengeDuel(champ, far, omap)).toBe(false);   // not adjacent
    expect(canChallengeDuel(champ, routed, omap)).toBe(false); // already broken
  });
});
