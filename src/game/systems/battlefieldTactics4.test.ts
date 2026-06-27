import { describe, it, expect } from 'vitest';
import { attackUnits, forecastAttack, changeFormation, canChangeFormation } from './tactical';
import { battleRecap } from './battleRecap';
import { mkUnit, mkBattle, mkTiles, officerMap, fixedRng } from '../../test/factories';

const HP = 1_000_000;

describe('傷害預估校準 — the forecast now brackets the real hit', () => {
  it('an average-roll blow lands inside the previewed range (incl. 兵種剋 + 側背)', () => {
    // cavalry > archers (×1.5) and a rear strike — factors the old forecast ignored.
    const me = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 1, row: 0 }, unitType: 'cavalry', troops: 8000, facing: 1 });
    const tgt = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 2, row: 0 }, unitType: 'archers', troops: HP, maxTroops: HP, facing: 1 });
    const b = mkBattle({ units: [me, tgt], tiles: mkTiles(6, 5) });
    const om = officerMap([me, tgt]);
    const f = forecastAttack(b, me, tgt, om);
    const actual = HP - attackUnits(b, 'A', 'D', om, fixedRng(0.5)).units.find((u) => u.id === 'D')!.troops;
    expect(actual).toBeGreaterThanOrEqual(f.dmgMin);
    expect(actual).toBeLessThanOrEqual(f.dmgMax);
    expect(f.dmgMin).toBeGreaterThan(0);
  });

  it('forecasts no riposte from a foe struck beyond its reach', () => {
    const archer = mkUnit({ id: 'R', officerId: 'oR', side: 'attacker', unitType: 'archers', coord: { col: 0, row: 2 }, ammo: 3, maxAmmo: 3 });
    const foot = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', unitType: 'infantry', coord: { col: 3, row: 2 }, troops: HP, maxTroops: HP });
    const b = mkBattle({ units: [archer, foot], tiles: mkTiles(8, 6) });
    const f = forecastAttack(b, archer, foot, officerMap([archer, foot]));
    expect(f.counterMax).toBe(0); // melee foot can't shoot back at range 3
  });
});

describe('臨陣變陣 — re-form mid-battle', () => {
  it('switches shape, disorders the whole side, and goes on cooldown', () => {
    const a1 = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 1, row: 1 } });
    const a2 = mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', coord: { col: 1, row: 2 } });
    const d1 = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 5, row: 1 } });
    const b = mkBattle({ units: [a1, a2, d1], attackerFormation: 'none', tiles: mkTiles(8, 6) });
    expect(canChangeFormation(b, 'attacker')).toBe(true);
    const after = changeFormation(b, 'attacker', 'fish-scale');
    expect(after.attackerFormation).toBe('fish-scale');
    expect(after.units.find((u) => u.id === 'A1')!.effects.some((e) => e.kind === 'disorder')).toBe(true);
    expect(after.units.find((u) => u.id === 'A2')!.effects.some((e) => e.kind === 'disorder')).toBe(true);
    expect(after.units.find((u) => u.id === 'D1')!.effects.some((e) => e.kind === 'disorder')).toBe(false); // enemy untouched
    expect(canChangeFormation(after, 'attacker')).toBe(false); // on cooldown
    expect(changeFormation(b, 'attacker', 'none')).toBe(b); // same shape = no-op
  });
});

describe('戰報復盤 — turning points + final tide', () => {
  it('pulls the decisive beats from the log and reports the closing momentum', () => {
    const win = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 1, row: 1 }, troops: 9000, maxTroops: 10000 });
    const b = mkBattle({
      units: [win], winner: 'attacker', momentum: 70,
      attackerLosses: 1000, defenderLosses: 9000,
      log: [
        { turn: 2, text: '某某軍心崩潰 — 棄陣潰走!', kind: 'event' },
        { turn: 3, text: '敵將陣亡 — 全軍動搖!', kind: 'event' },
        { turn: 3, text: '副將臨危接掌帥旗,代領全軍 — 陣腳暫穩。', kind: 'event' },
        { turn: 4, text: '一般語音', kind: 'voice' },
      ],
      tiles: mkTiles(6, 6),
    });
    const r = battleRecap(b, officerMap([win]));
    expect(r.finalMomentum).toBe(70);
    expect(r.keyMoments.length).toBe(3); // the three event beats, not the voice line
    expect(r.keyMoments.some((m) => m.text.includes('接掌帥旗'))).toBe(true);
  });
});
