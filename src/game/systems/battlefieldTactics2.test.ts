import { describe, it, expect } from 'vitest';
import { attackUnits, endTurn, moveUnit, weaponMatchupMul } from './tactical';
import { applyStratagem } from './tacticalSchemes';
import { mkOfficer, mkUnit, mkBattle, mkTiles, officerMap, fixedRng } from '../../test/factories';

const HP = 1_000_000;
const dmgOf = (before: number, u: { troops: number }) => before - u.troops;
const has = (u: { effects: { kind: string }[] }, k: string) => u.effects.some((e) => e.kind === k);

describe('兵裝相剋 — weapon-class matchups (§5.9 → §5.1)', () => {
  it('halberd hooks cavalry, crossbow punches armour, strategists are soft', () => {
    expect(weaponMatchupMul('halberd', 'sabre', 'cavalry', false).mul).toBeGreaterThan(1);
    expect(weaponMatchupMul('crossbow', 'spear', 'infantry', false).mul).toBeGreaterThan(1);
    expect(weaponMatchupMul('cavalry', 'bow', 'archers', false).mul).toBeGreaterThan(1);
    expect(weaponMatchupMul('sabre', 'fan', 'infantry', false).mul).toBeGreaterThan(1.1); // 襲書生
    expect(weaponMatchupMul('sword', 'sabre', 'infantry', true).mul).toBeGreaterThan(1);  // 劍走側背
    expect(weaponMatchupMul('sword', 'sabre', 'infantry', false).mul).toBe(1);            // no flank → neutral
  });

  it('a halberd officer outdamages a swordsman against cavalry, in real combat', () => {
    const mk = (oid: string, weapon: string) => {
      const cav = mkUnit({ id: 'A', officerId: oid, side: 'attacker', coord: { col: 1, row: 0 }, unitType: 'infantry' });
      const tgt = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 2, row: 0 }, unitType: 'cavalry', troops: HP, maxTroops: HP });
      const b = mkBattle({ units: [cav, tgt], tiles: mkTiles(8, 6) });
      const omap = officerMap([cav, tgt], [mkOfficer({ id: oid, equipment: [weapon] })]);
      return dmgOf(HP, attackUnits(b, 'A', 'D', omap, fixedRng(0.5)).units.find((u) => u.id === 'D')!);
    };
    expect(mk('oHal', 'sky-piercer')).toBeGreaterThan(mk('oSwd', 'seven-star')); // 戟制騎 > 劍(無側背)
  });
});

describe('圍殲與退路 — encirclement', () => {
  // Wall the target (2,2) in on all neighbours but the attacker's hex (2,3). The
  // OPEN control leaves one extra gap (1,2) so the foe has a line of retreat.
  // Both sit inside the same wall box (streetMul equal); only escape differs.
  const WALLS = { '3,1': 'wall', '3,2': 'wall', '1,1': 'wall', '2,1': 'wall' } as const;
  const run = (extra: Record<string, 'wall'>) => {
    const tiles = mkTiles(5, 5, { ...WALLS, ...extra });
    const atk = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 2, row: 3 }, troops: 50000, maxTroops: 50000 });
    const tgt = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 2, row: 2 }, troops: 50000, maxTroops: 50000, morale: 100 });
    const b = mkBattle({ units: [atk, tgt], tiles });
    return attackUnits(b, 'A', 'D', officerMap([atk, tgt]), fixedRng(0.5));
  };
  it('a cornered unbroken unit fights desperately — takes less, ripostes harder (困獸猶鬥)', () => {
    const enc = run({ '1,2': 'wall' }); // (1,2) sealed → 0 escape hexes
    const open = run({});               // (1,2) open → has a line of retreat
    // 困獸: encircled target takes LESS damage (×0.9)…
    expect(dmgOf(50000, enc.units.find((u) => u.id === 'D')!))
      .toBeLessThan(dmgOf(50000, open.units.find((u) => u.id === 'D')!));
    // …and its desperate riposte costs the attacker MORE (×1.35).
    expect(enc.units.find((u) => u.id === 'A')!.troops)
      .toBeLessThan(open.units.find((u) => u.id === 'A')!.troops);
  });
});

describe('隊列陷亂 — disorder', () => {
  it('a disordered attacker hits soft; a disordered target is an open mark', () => {
    const base = (aEff: object[], dEff: object[]) => {
      const a = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 1, row: 0 }, effects: aEff as never });
      const d = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 2, row: 0 }, troops: HP, maxTroops: HP, effects: dEff as never });
      const b = mkBattle({ units: [a, d], tiles: mkTiles(6, 5) });
      return dmgOf(HP, attackUnits(b, 'A', 'D', officerMap([a, d]), fixedRng(0.5)).units.find((u) => u.id === 'D')!);
    };
    const normal = base([], []);
    expect(base([{ kind: 'disorder', turnsLeft: 1 }], [])).toBeLessThan(normal); // 亂者攻弱
    expect(base([], [{ kind: 'disorder', turnsLeft: 1 }])).toBeGreaterThan(normal); // 亂者易擊
  });

  it('a landed charge throws the struck target into disorder', () => {
    const cav = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 0, row: 2 }, unitType: 'cavalry' });
    const tgt = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 3, row: 2 }, troops: HP, maxTroops: HP });
    const b = mkBattle({ units: [cav, tgt], tiles: mkTiles(8, 5) });
    let s = moveUnit(b, 'A', { col: 1, row: 2 });
    s = moveUnit(s, 'A', { col: 2, row: 2 });
    const after = attackUnits(s, 'A', 'D', officerMap([cav, tgt]), fixedRng(0.5));
    expect(has(after.units.find((u) => u.id === 'D')!, 'disorder')).toBe(true);
  });

  it('fording a river lands the unit disordered', () => {
    const u = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 0, row: 0 }, ap: 3 });
    const b = mkBattle({ units: [u], tiles: mkTiles(5, 5, { '1,0': 'river' }) });
    const after = moveUnit(b, 'A', { col: 1, row: 0 });
    expect(has(after.units.find((x) => x.id === 'A')!, 'disorder')).toBe(true);
  });
});

describe('督戰壓陣 — an enforcer keeps the line from breaking', () => {
  it('a unit beside its steady commander is floored above 0 (won\'t rout)', () => {
    const run = (withCmd: boolean) => {
      const atk = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 1, row: 2 }, troops: 100000, maxTroops: 100000 });
      const tgt = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 2, row: 2 }, troops: 100000, maxTroops: 100000, morale: 10 });
      const units = [atk, tgt];
      if (withCmd) units.push(mkUnit({ id: 'DC', officerId: 'oDC', side: 'defender', isCommander: true, coord: { col: 3, row: 2 }, morale: 100 }));
      const b = mkBattle({ units, tiles: mkTiles(8, 6) });
      return attackUnits(b, 'A', 'D', officerMap(units), fixedRng(0.5)).units.find((u) => u.id === 'D')!;
    };
    const guarded = run(true);
    const alone = run(false);
    expect(guarded.morale).toBeGreaterThanOrEqual(10); // 壓陣不潰
    expect(alone.morale).toBe(0);                       // 無督戰 → 軍心崩潰
  });
});

describe('詐敗誘敵 — feign rout springs on the pursuer', () => {
  it('attacking a feigning unit triggers a full counter + disorders the attacker', () => {
    const a = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 1, row: 0 }, troops: 50000, maxTroops: 50000 });
    const feign = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 2, row: 0 }, troops: 50000, maxTroops: 50000, effects: [{ kind: 'feign-rout', turnsLeft: 3 }] });
    const plain = mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', coord: { col: 1, row: 4 }, troops: 50000, maxTroops: 50000 });
    const normal = mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 2, row: 4 }, troops: 50000, maxTroops: 50000 });
    const b = mkBattle({ units: [a, feign, plain, normal], tiles: mkTiles(8, 8) });
    const omap = officerMap([a, feign, plain, normal]);
    const sprung = attackUnits(b, 'A', 'D', omap, fixedRng(0.5));
    const ctrl = attackUnits(b, 'A2', 'D2', omap, fixedRng(0.5));
    const aSprung = sprung.units.find((u) => u.id === 'A')!;
    expect(aSprung.troops).toBeLessThan(ctrl.units.find((u) => u.id === 'A2')!.troops); // fuller riposte
    expect(has(aSprung, 'disorder')).toBe(true);                                         // pursuer thrown into disorder
    expect(has(sprung.units.find((u) => u.id === 'D')!, 'feign-rout')).toBe(false);      // trap consumed
  });

  it('the 偽計 stratagem sets the 詐敗 trap on the caster', () => {
    const caster = mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', coord: { col: 2, row: 2 } });
    const foe = mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 4, row: 2 } });
    const b = mkBattle({ units: [caster, foe], tiles: mkTiles(8, 6) });
    const omap = officerMap([caster, foe], [mkOfficer({ id: 'oA', stats: { war: 70, intelligence: 80, leadership: 70, politics: 60, charisma: 60 } })]);
    const r = applyStratagem(b, 'A', 'false-retreat', caster.coord, omap);
    expect(r.ok).toBe(true);
    expect(has(r.battle.units.find((u) => u.id === 'A')!, 'feign-rout')).toBe(true);
  });
});

describe('寡不敵眾 — local force balance shows in the heart', () => {
  it('a heavily outnumbered unit wavers more than an unpressed one', () => {
    const ac = mkUnit({ id: 'AC', officerId: 'oAC', side: 'attacker', isCommander: true, coord: { col: 0, row: 9 } });
    const dc = mkUnit({ id: 'DC', officerId: 'oDC', side: 'defender', isCommander: true, coord: { col: 13, row: 0 } });
    // D1: hemmed in by three attacker hosts within 2 hexes (heavily outnumbered).
    const d1 = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 5, row: 5 }, troops: 5000, maxTroops: 5000, morale: 80 });
    const g1 = mkUnit({ id: 'G1', officerId: 'oG1', side: 'attacker', coord: { col: 4, row: 5 }, troops: 10000 });
    const g2 = mkUnit({ id: 'G2', officerId: 'oG2', side: 'attacker', coord: { col: 6, row: 5 }, troops: 10000 });
    const g3 = mkUnit({ id: 'G3', officerId: 'oG3', side: 'attacker', coord: { col: 5, row: 3 }, troops: 10000 });
    // D2: off on its own, no foe nearby (same isolation, no outnumber penalty).
    const d2 = mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 5, row: 0 }, troops: 5000, maxTroops: 5000, morale: 80 });
    const units = [ac, dc, d1, g1, g2, g3, d2];
    const b = mkBattle({ units, activeSide: 'attacker', tiles: mkTiles(14, 10) });
    const after = endTurn(b, officerMap(units));
    const m1 = after.units.find((u) => u.id === 'D1')!.morale;
    const m2 = after.units.find((u) => u.id === 'D2')!.morale;
    expect(m1).toBeLessThan(m2); // 寡不敵眾 sapped D1 beyond the shared 孤軍 hit
  });
});
