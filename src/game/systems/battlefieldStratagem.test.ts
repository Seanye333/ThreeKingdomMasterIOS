import { describe, it, expect } from 'vitest';
import { applyOpeningScheme } from './tacticalSchemes';
import { resolveBattle, type BattleSide } from './combat';
import { pickAutoStratagem, mirrorDefenderEffect, DEFENSIVE_SCHEMES, STRATAGEM_DEFS, applicableStratagems } from '../data/stratagems2';
import { mkUnit, mkBattle, mkTiles, seededRng } from '../../test/factories';
import type { Officer, City } from '../types';

const off = (intelligence: number): Officer => ({
  id: `o${intelligence}`, name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 70, war: 70, intelligence, politics: 50, charisma: 60 },
  loyalty: 100, locationCityId: null, forceId: null, status: 'active', task: null,
  equipment: [], skills: [], rank: 'soldier',
} as Officer);

const ctx = (aInt: number, dInt: number, over: Partial<Parameters<typeof pickAutoStratagem>[0]> = {}) => ({
  attacker: off(aInt), defender: off(dInt), attackerTroops: 20000, defenderTroops: 18000,
  city: { id: 'c', terrain: 'mountain', port: false } as unknown as City,
  weather: { kind: 'wind', windPower: 3, wind: 'east' } as never,
  attackerIntelligence: aInt, defenderIntelligence: dInt, defenderAvgLoyalty: 80,
  ...over,
});

describe('守城之計 — defender scheme pool + mirrored effect', () => {
  it('only returns defensive schemes when filtered', () => {
    const sid = pickAutoStratagem(ctx(95, 95), { only: DEFENSIVE_SCHEMES });
    expect(sid == null || DEFENSIVE_SCHEMES.has(sid)).toBe(true);
  });
  it('excludes a scheme already chosen (for 連環)', () => {
    const first = pickAutoStratagem(ctx(95, 60));
    expect(first).not.toBeNull();
    const second = pickAutoStratagem(ctx(95, 60), { exclude: new Set([first!]) });
    expect(second).not.toBe(first);
  });
  it('軍師獻策 — lists deployable schemes (gated + applicable) with odds, best-first', () => {
    const opts = applicableStratagems(ctx(95, 60), 4);
    expect(opts.length).toBeGreaterThan(0);
    expect(opts.length).toBeLessThanOrEqual(4);
    for (const o of opts) {
      expect(STRATAGEM_DEFS[o.id].minIntelligence).toBeLessThanOrEqual(95); // within the commander's wits
      expect(o.odds).toBeGreaterThan(0); expect(o.odds).toBeLessThanOrEqual(0.95);
    }
    // a dullard (INT 55) has few or no schemes to offer
    expect(applicableStratagems(ctx(55, 60)).length).toBeLessThanOrEqual(opts.length);
  });
  it('mirrors a defender scheme to attacker-centric fields', () => {
    const m = mirrorDefenderEffect({ attackerPowerMul: 1.2, defenderPowerMul: 0.8, ownLossMul: 0.7, enemyLossMul: 1.3, surpriseRoll: 0.1 });
    expect(m.defenderPowerMul).toBe(1.2); // defender boosts itself
    expect(m.attackerPowerMul).toBe(0.8); // defender saps the attacker
    expect(m.enemyLossMul).toBe(0.7);     // its own losses shrink
    expect(m.ownLossMul).toBe(1.3);       // the attacker's swell
    expect(m.surpriseRoll).toBe(-0.1);    // tilts the roll back
  });
});

describe('計接戰場 — abstract scheme manifests as a tactical opening', () => {
  const battle = () => mkBattle({
    units: [
      mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 1, row: 2 }, troops: 8000 }),
      mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 5, row: 2 }, troops: 9000 }),
      mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 6, row: 3 }, troops: 5000 }),
    ],
    weather: 'wind', tiles: mkTiles(8, 6),
  });

  it('火攻 → flames on the enemy front', () => {
    const after = applyOpeningScheme(battle(), 'fire-attack');
    expect((after.groundFires ?? []).length).toBeGreaterThan(0);
  });
  it('斷糧 → an enemy host goes hungry', () => {
    const after = applyOpeningScheme(battle(), 'cut-supply');
    expect(after.units.some((u) => u.side === 'defender' && u.effects.some((e) => e.kind === 'starving'))).toBe(true);
  });
  it('埋伏 → a contingent hides; 夜襲 → opens at night', () => {
    expect(applyOpeningScheme(battle(), 'ambush').units.some((u) => u.side === 'attacker' && u.hidden)).toBe(true);
    expect(applyOpeningScheme(battle(), 'night-raid').timeOfDay).toBe('night');
  });
  it('rain smothers a fire opening; an unknown scheme is a no-op', () => {
    const wet = applyOpeningScheme({ ...battle(), weather: 'rain' }, 'fire-attack');
    expect((wet.groundFires ?? []).length).toBe(0);
    const b = battle();
    expect(applyOpeningScheme(b, 'rush')).toBe(b);
  });
});

describe('連環計 sanity — chainable scheme pool is non-trivial at high INT', () => {
  it('a genius can find two distinct applicable schemes', () => {
    const c = ctx(95, 50);
    const first = pickAutoStratagem(c);
    const second = first ? pickAutoStratagem(c, { exclude: new Set([first]) }) : null;
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(STRATAGEM_DEFS[first!]).toBeDefined();
  });
});

describe('resolveBattle 計謀交鋒 — engine integration', () => {
  const side = (int: number): BattleSide => ({ troops: 20000, commander: off(int), companions: [off(int - 5)] });
  const battleCtx = { city: { id: 'c', name: { zh: '城', en: 'C' }, terrain: 'mountain', port: false } as unknown as City, weather: { kind: 'wind', windPower: 3, wind: 'east' } as never, allowPursuit: true };

  it('honours 軍師獻策 (a player-chosen, applicable scheme) over the auto-pick', () => {
    const rng = seededRng(7);
    let forcedHit = 0, n = 0;
    for (let s = 0; s < 60; s++) {
      const r = resolveBattle(side(85), side(60), 22, rng, { ...battleCtx, forcedStratagem: 'fire-attack' });
      if (r.stratagem) { n++; if (r.stratagem.id === 'fire-attack') forcedHit++; }
    }
    expect(forcedHit).toBeGreaterThan(n * 0.8); // mostly the chosen scheme
  });

  it('a genius (智≥90) chains a second scheme (連環)', () => {
    const rng = seededRng(11);
    let chained = 0;
    for (let s = 0; s < 60; s++) if (resolveBattle(side(96), side(60), 22, rng, battleCtx).stratagemChain) chained++;
    expect(chained).toBeGreaterThan(0);
  });

  it('a far wiser defender sees through schemes (看破), and answers with its own', () => {
    const rng = seededRng(3);
    let seen = 0, dScheme = 0;
    for (let s = 0; s < 250; s++) {
      const r = resolveBattle(side(75), side(99), 22, rng, battleCtx);
      if (r.stratagem?.seenThrough) seen++;
      if (r.defenderStratagem) dScheme++;
    }
    expect(seen).toBeGreaterThan(0);   // 看破 actually fires
    expect(dScheme).toBeGreaterThan(0); // 守城計 fires
  });
});
