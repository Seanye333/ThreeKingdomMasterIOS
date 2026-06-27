import { describe, it, expect } from 'vitest';
import { attackUnits, formationStrength, pickAiFormation } from './tactical';
import { mkOfficer, mkUnit, mkBattle, mkTiles, officerMap, fixedRng } from '../../test/factories';
import type { TacticalUnit } from '../types';

const HP = 1_000_000;
const dmgOf = (before: number, u: { troops: number }) => before - u.troops;

describe('陣勢 — formation strength (整度 × 精通, 兵敗陣亂)', () => {
  const three = () => [
    mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true, coord: { col: 1, row: 1 } }),
    mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', coord: { col: 1, row: 2 } }),
    mkUnit({ id: 'A3', officerId: 'oA3', side: 'attacker', coord: { col: 1, row: 3 } }),
  ];
  it('full line + a master commander = strong; none = 0', () => {
    const units = three();
    const om = officerMap(units, [mkOfficer({ id: 'oA1', stats: { war: 70, leadership: 70, intelligence: 100, politics: 50, charisma: 60 } })]);
    const b = mkBattle({ units, attackerFormation: 'fish-scale', tiles: mkTiles(6, 6) }); // gate 60
    const s = formationStrength(b, 'attacker', om);
    expect(s).toBeGreaterThan(1.2); // intact + int 100 over gate 60 → mastery ~1.25
    expect(formationStrength(mkBattle({ units, attackerFormation: 'none', tiles: mkTiles(6, 6) }), 'attacker', om)).toBe(0);
  });

  it('shattering the line (兵敗陣亂) collapses the 大陣 to 0', () => {
    const units = three();
    const om = officerMap(units);
    const broken = units.map((u, i) => (i < 2 ? { ...u, morale: 0 } : u)); // 2/3 routing
    expect(formationStrength(mkBattle({ units: broken, attackerFormation: 'square', tiles: mkTiles(6, 6) }), 'attacker', om)).toBe(0);
  });

  it('a higher-intelligence commander wields a stronger formation', () => {
    const units = three();
    const lo = officerMap(units, [mkOfficer({ id: 'oA1', stats: { war: 70, leadership: 70, intelligence: 62, politics: 50, charisma: 60 } })]);
    const hi = officerMap(units, [mkOfficer({ id: 'oA1', stats: { war: 70, leadership: 70, intelligence: 95, politics: 50, charisma: 60 } })]);
    const b = mkBattle({ units, attackerFormation: 'fish-scale', tiles: mkTiles(6, 6) });
    expect(formationStrength(b, 'attacker', hi)).toBeGreaterThan(formationStrength(b, 'attacker', lo));
  });
});

describe('陣形方位 — formations shape flank exposure', () => {
  // Attacker strikes the target's rear (facing away). Compare flank damage by the
  // target's formation: 方圓 seals the flank, 長蛇 is thin on the side.
  const hit = (form: string) => {
    const atk = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 1, row: 1 } });
    const tgt = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 2, row: 1 }, troops: HP, maxTroops: HP, facing: 0 });
    // commander so the defender's formation has strength
    const dc = mkUnit({ id: 'DC', officerId: 'oDC', side: 'defender', isCommander: true, coord: { col: 4, row: 4 } });
    const tc = mkUnit({ id: 'AC', officerId: 'oAC', side: 'attacker', isCommander: true, coord: { col: 0, row: 0 } });
    const units = [atk, tgt, dc, tc];
    const b = mkBattle({ units, defenderFormation: form as never, tiles: mkTiles(8, 8) });
    // ensure the blow is a flank/rear: target faces dir 0; attacker at (1,1) is to its west.
    return dmgOf(HP, attackUnits(b, 'A', 'D', officerMap(units), fixedRng(0.5)).units.find((u) => u.id === 'D')!);
  };
  it('方圓/四象 seal the flank (less); 長蛇/鋒矢 expose it (more)', () => {
    const none = hit('none');
    const square = hit('square');
    const snake = hit('long-snake');
    expect(square).toBeLessThan(none);   // 環陣護側
    expect(snake).toBeGreaterThan(none); // 長陣側薄
  });
});

describe('排兵布陣 — AI formation selection', () => {
  const SPE = 'spearmen' as const, CAV = 'cavalry' as const, ARC = 'archers' as const, INF = 'infantry' as const;
  it('fits the army & wits, and respects the int gate', () => {
    expect(['arrow-tip', 'awl']).toContain(pickAiFormation([CAV, CAV, CAV], 70));
    expect(['wild-goose', 'crescent-withdraw']).toContain(pickAiFormation([ARC, ARC, ARC], 70));
    expect(pickAiFormation([INF, INF], 90)).toBe('eight-trigrams'); // a genius reaches for 八陣
    // low-wit commander can't use a gated formation → falls back to a low-gate one
    const f = pickAiFormation([CAV, CAV], 45);
    expect((['arrow-tip', 'awl', 'eight-trigrams'] as string[])).not.toContain(f);
  });
  it('counters the enemy formation via 陣克陣 (mobile beats offensive)', () => {
    // enemy is offensive (arrow-tip) → we should answer with a mobile form.
    const f = pickAiFormation([INF, INF, INF], 80, { counter: 'arrow-tip' });
    expect(['crane-wing', 'wild-goose', 'yoke', 'spread-out', 'long-snake', 'ten-ambush']).toContain(f);
  });
});

describe('整合 — a defensive formation only protects while the line holds', () => {
  it('square cuts damage when intact, but not once the 大陣 is shattered', () => {
    const mk = (others: TacticalUnit[]) => {
      const tgt = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', isCommander: true, coord: { col: 2, row: 2 }, troops: HP, maxTroops: HP });
      const atk = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 1, row: 2 } });
      const units = [tgt, atk, ...others];
      const b = mkBattle({ units, defenderFormation: 'square', tiles: mkTiles(8, 8) });
      return dmgOf(HP, attackUnits(b, 'A', 'D', officerMap(units), fixedRng(0.5)).units.find((u) => u.id === 'D')!);
    };
    const intact = mk([
      mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 3, row: 2 } }),
      mkUnit({ id: 'D3', officerId: 'oD3', side: 'defender', coord: { col: 3, row: 3 } }),
    ]);
    const shattered = mk([
      mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 3, row: 2 }, morale: 0 }),
      mkUnit({ id: 'D3', officerId: 'oD3', side: 'defender', coord: { col: 3, row: 3 }, morale: 0 }),
    ]);
    expect(intact).toBeLessThan(shattered); // 方圓 shields the intact line; a broken 陣 gives nothing
  });
});
