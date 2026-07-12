import { describe, it, expect } from 'vitest';
import { setupTacticalBattle } from './tacticalSetup';
import { moveUnit, forecastAttack } from './tactical';
import type { Officer, TacticalBattle, UnitType } from '../types';

/** 槍陣對騎 — the two positional counters to shock cavalry (§5.1 懸案):
 *  ① 槍林戒備: cavalry riding INTO a standing spearman's reach takes a
 *    thrust (once per spearman per turn) and loses its built-up charge;
 *  ② 槍陣如林: a braced spear line has no naked flank to a horseman —
 *    cavalry gets no flank/rear bonus on ordered spears. */

const mk = (id: string): Officer => ({
  id, name: { zh: id, en: id }, birthYear: 150,
  stats: { leadership: 70, war: 70, intelligence: 60, politics: 50, charisma: 50 },
  loyalty: 80, locationCityId: null, forceId: 'x', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general',
});

const OFFICERS: Record<string, Officer> = { att: mk('att'), def: mk('def') };

function duelBoard(attArm: UnitType, defArm: UnitType): TacticalBattle {
  let b = setupTacticalBattle({
    cityId: 'luoyang', width: 12, height: 8,
    attackers: [{ officer: mk('att'), troops: 5000, unitType: attArm }],
    defenders: [{ officer: mk('def'), troops: 5000, unitType: defArm }],
    field: true, weather: 'clear', timeOfDay: 'day',
  } as never);
  // Park them on known clear hexes, two apart, with fresh AP.
  const att = b.units.find((u) => u.side === 'attacker')!;
  const def = b.units.find((u) => u.side === 'defender')!;
  b = {
    ...b,
    tiles: b.tiles.map((t) =>
      (t.coord.row === 4 && t.coord.col >= 4 && t.coord.col <= 8) ? { ...t, terrain: 'plain' as const } : t),
    units: b.units.map((u) =>
      u.id === att.id ? { ...u, coord: { col: 5, row: 4 }, ap: 4, facing: undefined }
      : u.id === def.id ? { ...u, coord: { col: 7, row: 4 }, facing: undefined } : u),
  };
  return b;
}

describe('槍林戒備 — the spear reaction thrust', () => {
  it('cavalry entering a spearman\'s reach bleeds and loses its charge', () => {
    let b = duelBoard('cavalry', 'spearmen');
    const cav = b.units.find((u) => u.side === 'attacker')!;
    b = moveUnit(b, cav.id, { col: 6, row: 4 }); // ride into the hedge
    const after = b.units.find((u) => u.id === cav.id)!;
    expect(after.troops).toBe(5000 - 600); // 12% of the spearman's 5000
    expect(after.charge?.dist ?? 0).toBe(0); // 挫其鋒 — momentum broken
    expect((b.log ?? []).some((l) => l.text.includes('槍林戒備'))).toBe(true);
  });

  it('each spearman reacts once per turn; infantry pass unpricked', () => {
    let b = duelBoard('cavalry', 'spearmen');
    const cav = b.units.find((u) => u.side === 'attacker')!;
    b = moveUnit(b, cav.id, { col: 6, row: 4 });
    const mid = b.units.find((u) => u.id === cav.id)!.troops;
    // Sidestep within the hedge — same spearman, same turn: no second thrust.
    b = moveUnit(b, cav.id, { col: 6, row: 3 });
    expect(b.units.find((u) => u.id === cav.id)!.troops).toBe(mid);

    let b2 = duelBoard('infantry', 'spearmen');
    const inf = b2.units.find((u) => u.side === 'attacker')!;
    b2 = moveUnit(b2, inf.id, { col: 6, row: 4 });
    expect(b2.units.find((u) => u.id === inf.id)!.troops).toBe(5000); // foot are no prey
  });
});

describe('槍陣如林 — no cavalry flank bonus on braced spears', () => {
  it('a rear ride on ordered spears forecasts no better than a frontal one', () => {
    const base = duelBoard('cavalry', 'spearmen');
    const cav = base.units.find((u) => u.side === 'attacker')!;
    const spear = base.units.find((u) => u.side === 'defender')!;
    // Frontal: attacker west of the (attacker-facing) defender = its front.
    const front = { ...base, units: base.units.map((u) => (u.id === cav.id ? { ...u, coord: { col: 6, row: 4 } } : u)) };
    // Rear: hop behind the spear line.
    const rear = { ...base, units: base.units.map((u) => (u.id === cav.id ? { ...u, coord: { col: 8, row: 4 } } : u)) };
    const fFront = forecastAttack(front, front.units.find((u) => u.id === cav.id)!, spear, OFFICERS);
    const fRear = forecastAttack(rear, rear.units.find((u) => u.id === cav.id)!, { ...spear }, OFFICERS);
    expect(fRear.dmgMax).toBeLessThanOrEqual(fFront.dmgMax); // no rear payoff vs pikes
    // Control: against INFANTRY the rear bonus is alive and well.
    const infBoard = duelBoard('cavalry', 'infantry');
    const cav2 = infBoard.units.find((u) => u.side === 'attacker')!;
    const inf = infBoard.units.find((u) => u.side === 'defender')!;
    const iFront = forecastAttack({ ...infBoard, units: infBoard.units.map((u) => (u.id === cav2.id ? { ...u, coord: { col: 6, row: 4 } } : u)) }, { ...cav2, coord: { col: 6, row: 4 } }, inf, OFFICERS);
    const iRear = forecastAttack({ ...infBoard, units: infBoard.units.map((u) => (u.id === cav2.id ? { ...u, coord: { col: 8, row: 4 } } : u)) }, { ...cav2, coord: { col: 8, row: 4 } }, inf, OFFICERS);
    expect(iRear.dmgMax).toBeGreaterThan(iFront.dmgMax);
  });
});
