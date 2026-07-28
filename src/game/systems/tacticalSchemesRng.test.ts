import { describe, expect, it } from 'vitest';
import { pickAiBattlePrep, applyAiBattlePreps, applyBattlePrep, applyStratagem } from './tacticalSchemes';
import type { EntityId, Officer, TacticalBattle, TacticalUnit } from '../types';

/**
 * 戰場計略須可重現 — tacticalSchemes rolled bare Math.random in five places
 * while the AI that drives it had a seeded rng sitting right there in scope
 * (tacticalAi threads one through aiTryStratagem/aiActOnce and simply never
 * passed it down). An all-AI harness could therefore never replay the same
 * battle twice: 看破 rolls, 地道 detection, whether an AI schemed at all, and
 * 落雷 confusion all drifted.
 *
 * These pin the seam. The human path still defaults to Math.random — the
 * player's own click is the draw there — but anything the AI casts must be a
 * function of the rng it was handed.
 */

const off = (id: string, extra: Partial<Officer> = {}): Officer =>
  ({
    id, name: { zh: id, en: id }, birthYear: 165,
    stats: { leadership: 70, war: 75, intelligence: 70, politics: 65, charisma: 70 },
    loyalty: 70, locationCityId: 'c1', forceId: 'A', status: 'active',
    task: null, equipment: [], skills: [], rank: 'soldier', ...extra,
  }) as Officer;

const unit = (u: Partial<TacticalUnit> & { id: string; officerId: string }): TacticalUnit =>
  ({
    side: 'attacker', unitType: 'infantry', troops: 3000, maxTroops: 3000,
    coord: { col: 1, row: 1 }, ap: 2, maxAp: 2, morale: 70, effects: [], ...u,
  }) as TacticalUnit;

/** A turn-1 battle on open ground with a forest to hide in. */
function opening(over: Partial<TacticalBattle> = {}): {
  battle: TacticalBattle; officers: Record<EntityId, Officer>;
} {
  const officers: Record<EntityId, Officer> = {
    a1: off('a1', { forceId: 'A', stats: { leadership: 80, war: 80, intelligence: 92, politics: 70, charisma: 80 } }),
    d1: off('d1', { forceId: 'D', stats: { leadership: 75, war: 70, intelligence: 88, politics: 70, charisma: 70 } }),
  };
  const tiles = [];
  for (let col = 0; col < 12; col++) {
    for (let row = 0; row < 8; row++) {
      tiles.push({ coord: { col, row }, terrain: col === 4 ? 'forest' : 'plain', elevation: 0 });
    }
  }
  const battle = {
    id: 'bat-rng', turn: 1, activeSide: 'attacker', width: 12, height: 8, tiles,
    attackerForceId: 'A', defenderForceId: 'D',
    winner: null, attackerLosses: 0, defenderLosses: 0,
    weather: 'clear', timeOfDay: 'day',
    casualties: { attacker: [], defender: [] },
    units: [
      unit({ id: 'u1', officerId: 'a1', side: 'attacker', isCommander: true, coord: { col: 1, row: 3 } }),
      unit({ id: 'u2', officerId: 'd1', side: 'defender', isCommander: true, coord: { col: 9, row: 3 } }),
    ],
    log: [], stratagemCooldowns: {}, prepUsed: {},
    ...over,
  } as unknown as TacticalBattle;
  return { battle, officers };
}

/** Deterministic rng — same seed, same stream. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

describe('pickAiBattlePrep — 是否設謀取決於傳入的 rng', () => {
  it('a low roll lets a sharp commander scheme', () => {
    const { battle, officers } = opening();
    // INT 88 → threshold 0.706; rng 0 is far below, so the AI schemes.
    expect(pickAiBattlePrep(battle, 'defender', officers, () => 0).length).toBeGreaterThan(0);
  });

  it('a high roll makes even a sharp commander stand pat', () => {
    const { battle, officers } = opening();
    // Threshold is capped at 0.9, so 0.99 always declines.
    expect(pickAiBattlePrep(battle, 'defender', officers, () => 0.99)).toEqual([]);
  });

  it('the same seed picks the same preps twice', () => {
    const { battle, officers } = opening();
    const a = pickAiBattlePrep(battle, 'defender', officers, seeded(42));
    const b = pickAiBattlePrep(battle, 'defender', officers, seeded(42));
    expect(a).toEqual(b);
  });
});

describe('applyAiBattlePreps — 整個 AI 開場可重現', () => {
  it('replays identically from the same seed', () => {
    const { battle, officers } = opening();
    const a = applyAiBattlePreps(battle, 'A', officers, seeded(7));
    const b = applyAiBattlePreps(battle, 'A', officers, seeded(7));
    expect(a.prepUsed).toEqual(b.prepUsed);
    expect(a.log).toEqual(b.log);
  });

  it('actually consults the rng — a declining stream sets no prep', () => {
    const { battle, officers } = opening();
    // playerForceId 'A' means only the defender (D) is AI-driven here.
    const declined = applyAiBattlePreps(battle, 'A', officers, () => 0.99);
    expect(declined.prepUsed?.defender).toBeUndefined();
    const eager = applyAiBattlePreps(battle, 'A', officers, () => 0);
    expect(eager.prepUsed?.defender).toBeDefined();
  });

  it('leaves the human side alone whatever the rng says', () => {
    const { battle, officers } = opening();
    const out = applyAiBattlePreps(battle, 'A', officers, () => 0);
    expect(out.prepUsed?.attacker).toBeUndefined();
  });
});

describe('applyBattlePrep — 地道看破吃傳入的 rng', () => {
  it('the same seed detects (or misses) the tunnel the same way', () => {
    // Walls for the tunnel to pass under, and a wary INT-92 defender to spot it.
    const tiles = [];
    for (let col = 0; col < 12; col++) {
      for (let row = 0; row < 8; row++) {
        tiles.push({ coord: { col, row }, terrain: col === 6 ? 'wall' : 'plain', elevation: 0 });
      }
    }
    const { battle, officers } = opening({ tiles } as Partial<TacticalBattle>);
    const a = applyBattlePrep(battle, 'attacker', 'tunnel', officers, seeded(3));
    const b = applyBattlePrep(battle, 'attacker', 'tunnel', officers, seeded(3));
    expect(a.ok).toBe(b.ok);
    expect(a.battle.units).toEqual(b.battle.units);
    expect(a.battle.log).toEqual(b.battle.log);
  });
});

describe('applyStratagem — AI 施法可重現', () => {
  it('the same seed produces the same cast', () => {
    const { battle, officers } = opening();
    const a = applyStratagem(battle, 'u1', 'lightning', { col: 9, row: 3 }, officers, undefined, seeded(11));
    const b = applyStratagem(battle, 'u1', 'lightning', { col: 9, row: 3 }, officers, undefined, seeded(11));
    expect(a.ok).toBe(b.ok);
    expect(a.battle.units).toEqual(b.battle.units);
  });

  it('still defaults to Math.random for the human path', () => {
    // Not a determinism claim — just that omitting rng stays callable, which
    // is what every UI call site does.
    const { battle, officers } = opening();
    expect(() => applyStratagem(battle, 'u1', 'defend', { col: 1, row: 3 }, officers)).not.toThrow();
  });
});
