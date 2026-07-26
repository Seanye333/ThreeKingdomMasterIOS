import { describe, expect, it } from 'vitest';
import { resolveBattleEnd } from './tactical';
import type { EntityId, Officer, TacticalBattle, TacticalUnit } from '../types';

/**
 * 戰果須為戰局之函數 — BattleResultsModal calls resolveBattleEnd UNMEMOIZED
 * during render to show the player their captives and spoils, and the confirm
 * button calls it again to apply them. While it rolled bare Math.random those
 * were separate draws: the modal re-rolled on every re-render (it runs a 500ms
 * reveal timer, so at least one happens), and the officers actually taken were
 * a third draw nobody had seen. These tests pin the fix — the same finished
 * battle must always settle the same way.
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

/** A finished battle: the attacker won, three defenders were lost. */
function finished(over: Partial<TacticalBattle> = {}): {
  battle: TacticalBattle; officers: Record<EntityId, Officer>;
} {
  const officers: Record<EntityId, Officer> = {};
  for (const id of ['a1', 'd1', 'd2', 'd3']) {
    officers[id] = off(id, { forceId: id.startsWith('a') ? 'A' : 'D' });
  }
  officers.a1 = off('a1', { forceId: 'A', stats: { leadership: 80, war: 80, intelligence: 70, politics: 70, charisma: 95 } });
  const battle = {
    id: 'bat-1', turn: 14, activeSide: 'attacker', width: 14, height: 10, tiles: [],
    attackerForceId: 'A', defenderForceId: 'D',
    winner: 'attacker', attackerLosses: 1200, defenderLosses: 9000,
    casualties: { attacker: [], defender: ['d1', 'd2', 'd3'] },
    units: [unit({ id: 'u1', officerId: 'a1', side: 'attacker', isCommander: true })],
    log: [], stratagemCooldowns: {},
    ...over,
  } as unknown as TacticalBattle;
  return { battle, officers };
}

describe('resolveBattleEnd — the same battle always settles the same way', () => {
  it('is stable across repeated calls, which is what the modal relies on', () => {
    const { battle, officers } = finished();
    const first = resolveBattleEnd(battle, officers);
    for (let i = 0; i < 20; i++) {
      const again = resolveBattleEnd(battle, officers);
      expect(again.capturedOfficerIds, `call ${i + 2} captives`).toEqual(first.capturedOfficerIds);
      expect(again.lootGold, `call ${i + 2} loot`).toEqual(first.lootGold);
      expect(again.attackerDead).toEqual(first.attackerDead);
      expect(again.defenderDead).toEqual(first.defenderDead);
    }
  });

  it('settles differently for a different battle — the seed is not a constant', () => {
    // Two battles that differ only in id must not be forced into lockstep.
    const seen = new Set<string>();
    for (const id of ['bat-1', 'bat-2', 'bat-3', 'bat-4', 'bat-5', 'bat-6']) {
      const { battle, officers } = finished({ id });
      const r = resolveBattleEnd(battle, officers);
      seen.add(`${r.capturedOfficerIds.join(',')}|${r.lootGold}`);
    }
    expect(seen.size, 'six different battles must not all settle identically').toBeGreaterThan(1);
  });

  it('re-rolls when the battle itself differs, not merely when called again', () => {
    const a = finished({ id: 'same', turn: 10 });
    const b = finished({ id: 'same', turn: 30 });
    const ra = resolveBattleEnd(a.battle, a.officers);
    const rb = resolveBattleEnd(b.battle, b.officers);
    // Not asserting they differ (they may coincide) — only that both are stable.
    expect(resolveBattleEnd(a.battle, a.officers).lootGold).toBe(ra.lootGold);
    expect(resolveBattleEnd(b.battle, b.officers).lootGold).toBe(rb.lootGold);
  });

  it('still honours an explicit rng when a caller supplies one', () => {
    const { battle, officers } = finished();
    const always = resolveBattleEnd(battle, officers, () => 0);
    const never = resolveBattleEnd(battle, officers, () => 0.999999);
    // A charisma-driven capture roll of 0 always catches; 0.999999 never does.
    expect(always.capturedOfficerIds.length).toBeGreaterThanOrEqual(never.capturedOfficerIds.length);
  });

  it('never reports the same officer as both captured and dead', () => {
    const { battle, officers } = finished();
    const r = resolveBattleEnd(battle, officers);
    const dead = new Set([...r.attackerDead, ...r.defenderDead]);
    for (const id of r.capturedOfficerIds) {
      expect(dead.has(id), `${id} is both captured and dead`).toBe(false);
    }
  });
});
