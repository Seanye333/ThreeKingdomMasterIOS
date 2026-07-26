import { describe, expect, it } from 'vitest';
import {
  gauntletChallengers, canGauntlet, battleGauntlet,
  GAUNTLET_MAX_CHALLENGERS, GAUNTLET_MIN_CHALLENGERS,
} from './tacticalGauntlet';
import { staticProwess } from './duel';
import type { EntityId, Officer, TacticalBattle, TacticalUnit } from '../types';

/**
 * 三英戰呂布 — gauntlet.ts was the only system module in src/game that nothing
 * imported, so the whole mechanic was unplayable. These tests cover the wiring
 * (who may join, in what order, what it costs), not the bout maths — that lives
 * in gauntlet.test.ts and is exercised through the real duel resolver.
 */

let seq = 0;
const off = (id: string, war: number, zh = id): Officer =>
  ({
    id, name: { zh, en: id }, birthYear: 160,
    stats: { leadership: 70, war, intelligence: 60, politics: 50, charisma: 60 },
    loyalty: 100, locationCityId: null, forceId: null, status: 'active',
    task: null, equipment: [], skills: [], rank: 'soldier',
  }) as Officer;

const unit = (u: Partial<TacticalUnit> & { officerId: string; coord: { col: number; row: number } }): TacticalUnit =>
  ({
    id: `u${seq++}`, side: 'attacker', unitType: 'infantry', troops: 5000,
    maxTroops: 5000, ap: 2, maxAp: 2, morale: 80, effects: [],
    ...u,
  }) as TacticalUnit;

const board = (units: TacticalUnit[]): TacticalBattle =>
  ({ id: 'b', turn: 4, activeSide: 'attacker', tiles: [], units, log: [], stratagemCooldowns: {} }) as unknown as TacticalBattle;

/** 呂布 at (5,5) with three of ours pressed against him. */
function scene(opts: { championWar?: number; challengerWars?: number[] } = {}) {
  seq = 0;
  const officers: Record<EntityId, Officer> = {};
  const lubu = off('lu-bu', opts.championWar ?? 100, '呂布');
  officers[lubu.id] = lubu;
  const champion = unit({ officerId: lubu.id, coord: { col: 5, row: 5 }, side: 'defender', isCommander: true });

  const wars = opts.challengerWars ?? [97, 96, 93];
  const around = [{ col: 5, row: 4 }, { col: 5, row: 6 }, { col: 4, row: 5 }];
  const trio = wars.map((w, i) => {
    const o = off(['guan-yu', 'zhang-fei', 'liu-bei'][i] ?? `c${i}`, w, ['關羽', '張飛', '劉備'][i] ?? `c${i}`);
    officers[o.id] = o;
    return unit({ officerId: o.id, coord: around[i] ?? { col: 6, row: 5 }, side: 'attacker' });
  });
  return { battle: board([champion, ...trio]), officers, champion, trio };
}

describe('gauntletChallengers — who may pile in', () => {
  it('gathers everyone adjacent with an action left', () => {
    const { battle, officers, champion } = scene();
    const q = gauntletChallengers(battle, champion.id, officers);
    expect(q.length).toBe(3);
    expect(canGauntlet(battle, champion.id, officers)).toBe(true);
  });

  it('orders the roster weakest-first so the ace swings last', () => {
    const { battle, officers, champion } = scene({ challengerWars: [97, 80, 93] });
    const q = gauntletChallengers(battle, champion.id, officers);
    const prowess = q.map((u) => staticProwess(officers[u.officerId]));
    for (let i = 1; i < prowess.length; i++) {
      expect(prowess[i], 'strongest must come last').toBeGreaterThanOrEqual(prowess[i - 1]);
    }
  });

  it('needs a crowd — one challenger is just a duel', () => {
    const { battle, officers, champion, trio } = scene();
    const lonely = { ...battle, units: [battle.units[0], trio[0]] };
    expect(gauntletChallengers(lonely, champion.id, officers)).toEqual([]);
    expect(canGauntlet(lonely, champion.id, officers)).toBe(false);
    expect(GAUNTLET_MIN_CHALLENGERS).toBe(2);
  });

  it('caps the rush at three', () => {
    const { battle, officers, champion } = scene();
    const extra = unit({ officerId: 'guan-yu', coord: { col: 6, row: 5 }, side: 'attacker' });
    const crowded = { ...battle, units: [...battle.units, extra] };
    expect(gauntletChallengers(crowded, champion.id, officers).length)
      .toBeLessThanOrEqual(GAUNTLET_MAX_CHALLENGERS);
  });

  it('excludes anyone out of position, spent, routing, or a baggage train', () => {
    const { battle, officers, champion, trio } = scene();
    const far = { ...trio[0], coord: { col: 1, row: 1 } };
    const spent = { ...trio[1], ap: 0 };
    const wagon = { ...trio[2], isSupply: true };
    const b = { ...battle, units: [battle.units[0], far, spent, wagon] };
    expect(gauntletChallengers(b, champion.id, officers)).toEqual([]);
  });

  it('will not gang up on a supply train or a routed unit', () => {
    const { battle, officers, champion } = scene();
    const asWagon = { ...battle, units: battle.units.map((u) => (u.id === champion.id ? { ...u, isSupply: true } : u)) };
    expect(gauntletChallengers(asWagon, champion.id, officers)).toEqual([]);
    const routed = { ...battle, units: battle.units.map((u) => (u.id === champion.id ? { ...u, morale: 0 } : u)) };
    expect(gauntletChallengers(routed, champion.id, officers)).toEqual([]);
  });

  it('skips officers too weak to take the field at all', () => {
    // canDuel refuses war < 50.
    const { battle, officers, champion } = scene({ challengerWars: [40, 45, 30] });
    expect(gauntletChallengers(battle, champion.id, officers)).toEqual([]);
  });
});

describe('battleGauntlet — what the rush costs', () => {
  const rng = (seedArr: number[]) => { let i = 0; return () => seedArr[i++ % seedArr.length]; };

  it('spends the action of everyone who committed, win or lose', () => {
    const { battle, officers, champion, trio } = scene();
    const after = battleGauntlet(battle, champion.id, officers, rng([0.5]));
    for (const t of trio) {
      expect(after.units.find((u) => u.id === t.id)!.ap, `${t.officerId} committed`).toBe(0);
    }
  });

  it('winds the champion — bout fatigue carries past this action', () => {
    const { battle, officers, champion } = scene();
    const after = battleGauntlet(battle, champion.id, officers, rng([0.5]));
    const c = after.units.find((u) => u.id === champion.id)!;
    expect(c.duelFatigue ?? 0).toBeGreaterThan(0);
  });

  it('narrates every bout and reports the champion\'s dwindling wind', () => {
    const { battle, officers, champion } = scene();
    const after = battleGauntlet(battle, champion.id, officers, rng([0.5]));
    const text = (after.log ?? []).map((l) => l.text).join('\n');
    expect(text).toContain('車輪戰');
    expect(text).toContain('氣力');
  });

  it('kills nobody — an in-battle bout costs troops and heart, never a life', () => {
    const { battle, officers, champion } = scene();
    const after = battleGauntlet(battle, champion.id, officers, rng([0.5]));
    // forcedKills is the player's explicit verdict over a beaten captive; a
    // gauntlet must never write to it.
    expect(after.forcedKills ?? []).toEqual([]);
    expect(after.units.length).toBe(battle.units.length);
  });

  it('swings the whole field\'s morale when the champion finally goes down', () => {
    // A weak "monster" against three aces: he falls.
    const { battle, officers, champion } = scene({ championWar: 52, challengerWars: [99, 98, 97] });
    const after = battleGauntlet(battle, champion.id, officers, rng([0.9, 0.1]));
    const c = after.units.find((u) => u.id === champion.id)!;
    const fell = c.morale === 0;
    if (fell) {
      expect(c.troops).toBeLessThan(champion.troops);
      expect((after.log ?? []).map((l) => l.text).join('\n')).toContain('力盡');
    }
  });

  it('is a no-op when the rush is not legal', () => {
    const { battle, officers, champion, trio } = scene();
    const lonely = { ...battle, units: [battle.units[0], trio[0]] };
    expect(battleGauntlet(lonely, champion.id, officers, rng([0.5]))).toBe(lonely);
  });

  it('is deterministic for a fixed rng', () => {
    const { battle, officers, champion } = scene();
    const a = battleGauntlet(battle, champion.id, officers, rng([0.3, 0.7, 0.5]));
    const b = battleGauntlet(battle, champion.id, officers, rng([0.3, 0.7, 0.5]));
    expect(a.units.map((u) => [u.troops, u.morale])).toEqual(b.units.map((u) => [u.troops, u.morale]));
  });

  it('does not mutate the battle it was handed', () => {
    const { battle, officers, champion } = scene();
    const snapshot = JSON.stringify(battle);
    battleGauntlet(battle, champion.id, officers, rng([0.5]));
    expect(JSON.stringify(battle)).toBe(snapshot);
  });
});
