import { describe, it, expect } from 'vitest';
import { attackUnits, endTurn } from './tactical';
import { applyBattlePrep, applyAiBattlePreps, pickAiBattlePrep } from './tacticalSchemes';
import { mkOfficer, mkUnit, mkBattle, mkTiles, officerMap, fixedRng } from '../../test/factories';
import type { Officer, EntityId } from '../types';

/** Run a body with Math.random pinned to a constant (restored after). */
function withRandom<T>(v: number, fn: () => T): T {
  const orig = Math.random;
  Math.random = () => v;
  try { return fn(); } finally { Math.random = orig; }
}

const off = (int: number, over: Partial<Officer> = {}): Officer => mkOfficer({
  stats: { leadership: 70, war: 70, intelligence: int, politics: 50, charisma: 50 }, ...over,
});

// ───────────────────── Batch B/D — the new preps ─────────────────────────────

describe('§5.7 new preps — 拒馬陷坑 / 火計 / 疑兵', () => {
  const base = () => mkBattle({
    units: [
      mkUnit({ id: 'acmd', officerId: 'oa', side: 'attacker', isCommander: true, coord: { col: 1, row: 6 } }),
      mkUnit({ id: 'dcmd', officerId: 'od', side: 'defender', isCommander: true, coord: { col: 16, row: 6 } }),
      mkUnit({ id: 'dfoe', officerId: 'od2', side: 'defender', troops: 8000, coord: { col: 15, row: 6 } }),
    ],
    tiles: mkTiles(18, 12), width: 18, height: 12,
  });

  it('拒馬陷坑 is the defender’s exclusive prep — lays a caltrops line mid-field', () => {
    const r = applyBattlePrep(base(), 'defender', 'caltrops-trap');
    expect(r.ok).toBe(true);
    expect((r.battle.cityStructures ?? []).some((s) => s.buildingId === 'caltrops')).toBe(true);
    expect(applyBattlePrep(base(), 'attacker', 'caltrops-trap').ok).toBe(false); // attackers can't
  });

  it('火計 seeds a fire on the enemy front — attacker only, doused by rain', () => {
    const fire = applyBattlePrep(base(), 'attacker', 'fire-prep');
    expect(fire.ok).toBe(true);
    expect((fire.battle.groundFires ?? []).length).toBeGreaterThan(0);
    expect(applyBattlePrep({ ...base(), weather: 'rain' }, 'attacker', 'fire-prep').ok).toBe(false);
    expect(applyBattlePrep(base(), 'defender', 'fire-prep').ok).toBe(false);
  });

  it('疑兵 shakes the whole enemy line (−10 morale), either side', () => {
    const r = applyBattlePrep(base(), 'defender', 'decoy');
    expect(r.ok).toBe(true);
    expect(r.battle.units.find((u) => u.id === 'acmd')!.morale).toBe(90); // attacker (the foe) hesitates
    expect(r.battle.units.find((u) => u.id === 'dfoe')!.morale).toBe(100); // own side untouched
  });
});

// ───────────────────── Batch B — 地道破解 (tunnel counterplay) ────────────────

describe('§5.7 地道破解 — a wary defender turns the tunnel into a trap', () => {
  const walled = () => mkBattle({
    units: [
      mkUnit({ id: 'acmd', officerId: 'oa', side: 'attacker', isCommander: true, coord: { col: 0, row: 1 } }),
      mkUnit({ id: 'sap', officerId: 'os', side: 'attacker', troops: 1500, coord: { col: 1, row: 2 }, morale: 100 }),
      mkUnit({ id: 'dcmd', officerId: 'od', side: 'defender', isCommander: true, coord: { col: 11, row: 2 } }),
    ],
    width: 12, height: 6,
    tiles: mkTiles(12, 6, { '6,0': 'wall', '6,1': 'wall', '6,2': 'gate', '6,3': 'wall', '6,4': 'wall', '6,5': 'wall' }),
  });
  const officers = (dInt: number): Record<EntityId, Officer> => ({ oa: off(70), os: off(60), od: off(dInt) });

  it('a sharp defender (高智) springs a counter-ambush — tunnellers arrive shaken & disordered', () => {
    const r = withRandom(0, () => applyBattlePrep(walled(), 'attacker', 'tunnel', officers(99)));
    expect(r.ok).toBe(true);
    const sap = r.battle.units.find((u) => u.id === 'sap')!;
    expect(sap.coord.col).toBe(7);                  // still surfaced inside the wall
    expect(sap.morale).toBeLessThan(100);           // but battered on arrival
    expect(sap.effects.some((e) => e.kind === 'disorder')).toBe(true);
  });

  it('a dull defender never hears the digging — the tunnellers arrive fresh', () => {
    const r = withRandom(0, () => applyBattlePrep(walled(), 'attacker', 'tunnel', officers(45)));
    const sap = r.battle.units.find((u) => u.id === 'sap')!;
    expect(sap.coord.col).toBe(7);
    expect(sap.morale).toBe(100);                   // no counter
    expect(sap.effects.some((e) => e.kind === 'disorder')).toBe(false);
  });
});

// ───────────────────── Batch C — ambush disorder + scout + caltrops vs horse ──

describe('§5.7 伏兵驟起 — a sprung ambush disorders the victim', () => {
  it('a hidden striker throws the ambushed ranks into disorder, not just damage', () => {
    const atk = mkUnit({ id: 'A', officerId: 'oa', side: 'attacker', hidden: true, troops: 6000, coord: { col: 4, row: 3 } });
    const tgt = mkUnit({ id: 'D', officerId: 'od', side: 'defender', troops: 8000, coord: { col: 5, row: 3 } });
    const b = mkBattle({ units: [atk, tgt], tiles: mkTiles(10, 6), width: 10, height: 6, activeSide: 'attacker' });
    const after = attackUnits(b, 'A', 'D', officerMap([atk, tgt]), fixedRng(0.5));
    expect(after.units.find((u) => u.id === 'D')!.effects.some((e) => e.kind === 'disorder')).toBe(true);
  });
});

describe('§5.7 斥候識破伏兵 — a sharp scout uncovers a hidden enemy', () => {
  const field = (scoutInt: number) => {
    const scout = mkUnit({ id: 'S', officerId: 'os', side: 'attacker', isCommander: true, coord: { col: 4, row: 3 } });
    const hider = mkUnit({ id: 'H', officerId: 'oh', side: 'defender', hidden: true, coord: { col: 5, row: 3 } });
    const b = mkBattle({ units: [scout, hider], tiles: mkTiles(10, 6), width: 10, height: 6, activeSide: 'attacker' });
    return endTurn(b, { os: off(scoutInt), oh: off(60) });
  };
  it('a genius commander reveals the ambush; a dullard walks past it', () => {
    expect(withRandom(0, () => field(99)).units.find((u) => u.id === 'H')!.hidden).toBe(false);
    expect(withRandom(0, () => field(40)).units.find((u) => u.id === 'H')!.hidden).toBe(true);
  });
});

describe('§5.7 鐵蒺藜挫銳騎 — caltrops bite cavalry far harder than foot', () => {
  const cross = (arm: 'cavalry' | 'infantry') => {
    const mover = mkUnit({ id: 'M', officerId: 'om', side: 'attacker', unitType: arm, troops: 9000, coord: { col: 5, row: 3 } });
    const dcmd = mkUnit({ id: 'D', officerId: 'od', side: 'defender', isCommander: true, coord: { col: 9, row: 3 } });
    const b = mkBattle({
      units: [mover, dcmd], tiles: mkTiles(12, 6), width: 12, height: 6, activeSide: 'attacker',
      cityStructures: [{ slotIndex: 0, buildingId: 'caltrops', level: 2, coord: { col: 6, row: 3 }, hp: 200 }],
    });
    const after = endTurn(b, officerMap([mover, dcmd]));
    return 9000 - after.units.find((u) => u.id === 'M')!.troops;
  };
  it('a cavalry charge onto the trap line bleeds ~2.5× a foot column', () => {
    const cav = cross('cavalry'), foot = cross('infantry');
    expect(cav).toBeGreaterThan(foot * 2);
  });
});

// ───────────────────── Batch A — AI picks & applies preps ────────────────────

describe('§5.7 廟算 — the AI now lays its own preps', () => {
  const armies = (terrain: Record<string, string> = {}) => mkBattle({
    units: [
      mkUnit({ id: 'acmd', officerId: 'oa', side: 'attacker', isCommander: true, coord: { col: 1, row: 6 } }),
      mkUnit({ id: 'abig', officerId: 'oab', side: 'attacker', troops: 9000, coord: { col: 2, row: 6 } }),
      mkUnit({ id: 'dcmd', officerId: 'od', side: 'defender', isCommander: true, coord: { col: 16, row: 6 } }),
      mkUnit({ id: 'dbig', officerId: 'odb', side: 'defender', troops: 9000, coord: { col: 15, row: 6 } }),
    ],
    tiles: mkTiles(18, 12, terrain), width: 18, height: 12,
    attackerForceId: 'AI', defenderForceId: 'P',
  });

  it('pickAiBattlePrep offers schemes to a clever marshal, nothing to a dullard', () => {
    const offs = { oa: off(92), oab: off(80), od: off(60), odb: off(60) };
    expect(withRandom(0, () => pickAiBattlePrep(armies(), 'attacker', offs)).length).toBeGreaterThan(0);
    const dull = { oa: off(40), oab: off(40), od: off(60), odb: off(60) };
    expect(withRandom(0.95, () => pickAiBattlePrep(armies(), 'attacker', dull)).length).toBe(0);
  });

  it('applyAiBattlePreps preps the AI side but leaves the human’s side for the prep UI', () => {
    const offs = { oa: off(92), oab: off(80), od: off(88), odb: off(70) };
    const r = withRandom(0, () => applyAiBattlePreps(armies(), 'P', offs)); // player force is 'P'
    expect(r.prepUsed?.attacker).toBeTruthy();   // AI attacker laid a prep
    expect(r.prepUsed?.defender).toBeUndefined(); // human defender left to choose
  });

  it('a practice drill is never auto-prepped', () => {
    const offs = { oa: off(92), oab: off(80), od: off(88), odb: off(70) };
    const drill = { ...armies(), practice: true };
    expect(withRandom(0, () => applyAiBattlePreps(drill, 'P', offs)).prepUsed).toBeUndefined();
  });
});
