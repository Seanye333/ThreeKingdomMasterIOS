import { describe, it, expect } from 'vitest';
import { forecastAttack, attackUnits } from './tactical';
import { battleRecap } from './battleRecap';
import { mkUnit, mkBattle, mkTiles, officerMap, fixedRng } from '../../test/factories';
import type { TacticalBattle } from '../types';

// ───────────────────── Batch B — forecast: hidden guard + new multipliers ────

describe('§5.8 傷害預估 — no free X-ray of a concealed foe', () => {
  it('a hidden target yields a fuzzed, flagged forecast (伏兵未察), not exact intel', () => {
    const a = mkUnit({ id: 'A', officerId: 'oa', side: 'attacker', coord: { col: 2, row: 2 } });
    const hidden = mkUnit({ id: 'D', officerId: 'od', side: 'defender', hidden: true, coord: { col: 3, row: 2 } });
    const f = forecastAttack(mkBattle({ units: [a, hidden] }), a, hidden, officerMap([a, hidden]));
    expect(f.hidden).toBe(true);
    expect(f.dmgMax).toBe(0);
    expect(f.willKill).toBe(false);
  });

  it('an ambushing attacker’s preview folds in the ambush bonus', () => {
    const tgt = mkUnit({ id: 'D', officerId: 'od', side: 'defender', troops: 9000, coord: { col: 3, row: 2 } });
    const seen = mkUnit({ id: 'A', officerId: 'oa', side: 'attacker', troops: 6000, coord: { col: 2, row: 2 } });
    const lurking = { ...seen, hidden: true };
    const off = officerMap([seen, tgt]);
    const fSeen = forecastAttack(mkBattle({ units: [seen, tgt] }), seen, tgt, off);
    const fLurk = forecastAttack(mkBattle({ units: [lurking, tgt] }), lurking, tgt, off);
    expect(fLurk.dmgMax).toBeGreaterThan(fSeen.dmgMax); // 伏擊加成 now shows in the preview
  });

  it('the preview still brackets the real blow (calibration holds with the new mults)', () => {
    const a = mkUnit({ id: 'A', officerId: 'oa', unitType: 'infantry', side: 'attacker', troops: 8000, coord: { col: 2, row: 2 } });
    const d = mkUnit({ id: 'D', officerId: 'od', unitType: 'infantry', side: 'defender', troops: 8000, coord: { col: 3, row: 2 } });
    const b = mkBattle({ units: [a, d], tiles: mkTiles(8, 6), activeSide: 'attacker' });
    const off = officerMap([a, d]);
    const f = forecastAttack(b, a, d, off);
    const actual = 8000 - attackUnits(b, 'A', 'D', off, fixedRng(0.5)).units.find((u) => u.id === 'D')!.troops;
    expect(actual).toBeGreaterThanOrEqual(f.dmgMin - 1);
    expect(actual).toBeLessThanOrEqual(f.dmgMax + 1);
  });
});

// ───────────────────── Batch D — 戰功 tally → data-driven MVP ─────────────────

describe('§5.8 戰功 — attackUnits tallies what each unit fells', () => {
  it('accumulates damageDealt, and a rout counts as a kill', () => {
    const a = mkUnit({ id: 'A', officerId: 'oa', unitType: 'cavalry', side: 'attacker', troops: 20000, coord: { col: 2, row: 2 } });
    const tiny = mkUnit({ id: 'D', officerId: 'od', unitType: 'archers', side: 'defender', troops: 90, coord: { col: 3, row: 2 } });
    const after = attackUnits(mkBattle({ units: [a, tiny], activeSide: 'attacker' }), 'A', 'D', officerMap([a, tiny]), fixedRng(0.5));
    const atk = after.units.find((u) => u.id === 'A')!;
    expect(atk.damageDealt).toBeGreaterThan(0);
    expect(atk.kills).toBe(1); // wiped the 90 archers
  });
});

describe('§5.8 中流砥柱 — battleRecap crowns the MVP by deeds', () => {
  it('picks the unit that felled the most, breaking ties by routs', () => {
    const finished = {
      ...mkBattle({
        units: [
          mkUnit({ id: 'star', officerId: 'guan', side: 'attacker', troops: 7000, damageDealt: 9000, kills: 2 }),
          mkUnit({ id: 'mid', officerId: 'zhang', side: 'attacker', troops: 9000, damageDealt: 3000, kills: 1 }),
          mkUnit({ id: 'foe', officerId: 'cao', side: 'defender', troops: 0, damageDealt: 1500, kills: 0 }),
        ],
      }),
      winner: 'attacker' as const, attackerLosses: 1500, defenderLosses: 12000,
    } as TacticalBattle;
    const recap = battleRecap(finished, officerMap(finished.units));
    expect(recap.mvp?.officerId).toBe('guan');
    expect(recap.mvp?.damageDealt).toBe(9000);
    expect(recap.mvp?.kills).toBe(2);
    // 中流砥柱 (pillar) is a separate, troop-count award — not the same field.
    expect(recap.pillar?.officerId).toBe('zhang'); // most troops still standing
  });

  it('no MVP when no one struck a blow', () => {
    const bloodless = { ...mkBattle({ units: [mkUnit({ id: 'a', officerId: 'oa', side: 'attacker' })] }), winner: 'attacker' as const } as TacticalBattle;
    expect(battleRecap(bloodless, officerMap(bloodless.units)).mvp).toBeNull();
  });
});
