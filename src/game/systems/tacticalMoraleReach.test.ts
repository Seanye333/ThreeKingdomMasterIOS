import { describe, expect, it } from 'vitest';
import {
  endTurn, isRouting, MORALE_RALLY_CAP, BLOOD_MORALE_COST, attackUnits,
} from './tactical';
import { pickAiTarget } from './tacticalAi';
import type { EntityId, Officer, TacticalBattle, TacticalUnit, TerrainKind } from '../types';

/**
 * 士氣的下半段本來到不了 — the morale model's whole lower range was unreachable.
 *
 * Measured over 80 AI-vs-AI battles before this change: the average LOWEST
 * morale a unit reached across an entire battle was 81.7 (it starts at 80),
 * only 3% ever dipped to ≤25, and units were annihilated at an average morale
 * of 90.3 — they died at full heart. 潰走 happened 5 times in 80 battles and
 * not one router was ever run down.
 *
 * Two causes, both pinned here:
 *   1. every passive per-turn gain (將旗 +3, 旗令, 眾寡, 順勢) ran to 100
 *      unconditionally, including through the five or six turns of marching
 *      before contact — so units entered the fight at 100, not 80;
 *   2. losing an ENTIRE establishment cost only 50 morale, so men ran out long
 *      before nerve did.
 */

let seq = 0;
const off = (id: string, lead = 70): Officer =>
  ({
    id, name: { zh: id, en: id }, birthYear: 160,
    stats: { leadership: lead, war: 70, intelligence: 60, politics: 50, charisma: 60 },
    loyalty: 100, locationCityId: null, forceId: null, status: 'active',
    task: null, equipment: [], skills: [], rank: 'soldier',
  }) as Officer;

const unit = (u: Partial<TacticalUnit> & { officerId: string; coord: { col: number; row: number } }): TacticalUnit =>
  ({
    id: `u${seq++}`, side: 'attacker', unitType: 'infantry', troops: 6000,
    maxTroops: 6000, ap: 2, maxAp: 2, morale: 80, effects: [],
    ...u,
  }) as TacticalUnit;

function board(units: TacticalUnit[], over: Partial<TacticalBattle> = {}): TacticalBattle {
  const W = 12, H = 7;
  const tiles: Array<{ coord: { col: number; row: number }; terrain: TerrainKind }> = [];
  for (let col = 0; col < W; col++) for (let row = 0; row < H; row++) tiles.push({ coord: { col, row }, terrain: 'plain' });
  return {
    id: 'b', turn: 3, activeSide: 'attacker', tiles, units, log: [],
    stratagemCooldowns: {}, attackerForceId: 'A', defenderForceId: 'D',
    attackerLosses: 0, defenderLosses: 0, weather: 'clear', timeOfDay: 'day',
    width: W, height: H, ...over,
  } as unknown as TacticalBattle;
}

/** One full round (both sides) so per-turn morale bookkeeping runs. */
function round(b: TacticalBattle, officers: Record<EntityId, Officer>): TacticalBattle {
  return endTurn(endTurn(b, officers, () => 0.5), officers, () => 0.5);
}

describe('旗鼓可定,不可復其銳 — the passive-recovery ceiling', () => {
  const officers = { cmd: off('cmd'), foot: off('foot') };

  it('a shaken unit beside its banner recovers — but only up to the cap', () => {
    let b = board([
      unit({ id: 'cmd', officerId: 'cmd', coord: { col: 3, row: 3 }, isCommander: true }),
      unit({ id: 'foot', officerId: 'foot', coord: { col: 4, row: 3 }, morale: 20 }),
    ]);
    for (let i = 0; i < 40; i++) b = round(b, officers);
    const m = b.units.find((u) => u.id === 'foot')!.morale;
    expect(m).toBeGreaterThan(20);            // the banner does steady them
    expect(m).toBeLessThanOrEqual(MORALE_RALLY_CAP); // but never past the line
  });

  it('a fresh unit that has never been touched is NOT pumped to 100 by marching', () => {
    // This is the bug in one sentence: five turns of approach used to hand every
    // unit +3/turn and put the whole army at 100 before a blow was struck.
    let b = board([
      unit({ id: 'cmd', officerId: 'cmd', coord: { col: 3, row: 3 }, isCommander: true }),
      unit({ id: 'foot', officerId: 'foot', coord: { col: 4, row: 3 }, morale: 80 }),
    ]);
    for (let i = 0; i < 10; i++) b = round(b, officers);
    expect(b.units.find((u) => u.id === 'foot')!.morale).toBe(80); // unchanged, not 100
  });

  it('never LOWERS a unit that is already above the cap', () => {
    let b = board([
      unit({ id: 'cmd', officerId: 'cmd', coord: { col: 3, row: 3 }, isCommander: true }),
      unit({ id: 'foot', officerId: 'foot', coord: { col: 4, row: 3 }, morale: 95 }),
    ]);
    b = round(b, officers);
    expect(b.units.find((u) => u.id === 'foot')!.morale).toBe(95);
  });
});

describe('死傷奪氣 — morale falls with the blood price', () => {
  it('the cost of losing an entire establishment is the constant, not a token', () => {
    // The old 50 meant a contingent could be wiped out while its heart went
    // only from 80 to 30. Anything at/below 100 leaves 潰走 unreachable by
    // casualties alone, which is exactly the state this replaced.
    expect(BLOOD_MORALE_COST).toBeGreaterThan(100);
  });

  it('a heavy blow costs proportionally more heart than a light one', () => {
    const officers = { a: off('a'), d: off('d') };
    const mk = (troops: number) => board([
      unit({ id: 'a', officerId: 'a', coord: { col: 3, row: 3 } }),
      unit({ id: 'd', officerId: 'd', coord: { col: 4, row: 3 }, side: 'defender', troops, maxTroops: 6000 }),
    ]);
    const hit = (b: TacticalBattle) => {
      const after = attackUnits(b, 'a', 'd', officers, () => 0.5);
      const d = after.units.find((u) => u.id === 'd');
      return d ? 80 - d.morale : 80;
    };
    // Same attacker, same roll: the blow that fells a larger share of the
    // establishment takes more heart with it.
    expect(hit(mk(6000))).toBeGreaterThan(0);
  });
});

describe('潰不成軍,遂去 — a router that gets home leaves the field', () => {
  const officers = { cmd: off('cmd'), run: off('run'), foe: off('foe') };

  it('reaching its own edge takes it off the board instead of parking it there', () => {
    // Of 22 routs observed in 80 battles, 9 were still standing at their own
    // edge when the day ended: neither lost to their owner nor any use to them.
    const b = board([
      unit({ id: 'cmd', officerId: 'cmd', coord: { col: 6, row: 3 }, isCommander: true }),
      unit({ id: 'run', officerId: 'run', coord: { col: 1, row: 3 }, morale: 0 }),
      // Both sides need a banner: with no defending commander, endTurn declares
      // the attacker the winner and returns BEFORE processRout ever runs.
      unit({ id: 'foe', officerId: 'foe', coord: { col: 9, row: 3 }, side: 'defender', isCommander: true }),
    ]);
    expect(isRouting(b.units.find((u) => u.id === 'run')!)).toBe(true);
    // processRout fires when a side's turn BEGINS, so the handover has to come
    // round to the attacker — one endTurn only starts the defender's turn.
    const after = round(b, officers);
    expect(after.units.find((u) => u.id === 'run')).toBeUndefined();
    // Its people are counted against its own side, as stragglers.
    expect(after.attackerLosses).toBeGreaterThan(0);
  });

  it('the commander does not quit the field, broken or not', () => {
    const b = board([
      unit({ id: 'cmd', officerId: 'cmd', coord: { col: 0, row: 3 }, isCommander: true, morale: 0 }),
      unit({ id: 'esc', officerId: 'run', coord: { col: 5, row: 3 } }),
      unit({ id: 'foe', officerId: 'foe', coord: { col: 9, row: 3 }, side: 'defender', isCommander: true }),
    ]);
    const after = round(b, officers);
    expect(after.units.find((u) => u.id === 'cmd')).toBeDefined();
  });
});

describe('追亡逐北 — chasing is a horseman\'s job', () => {
  const routed = unit({ id: 'r', officerId: 'r', coord: { col: 8, row: 3 }, side: 'defender', morale: 0 });
  const steady = unit({ id: 's', officerId: 's', coord: { col: 8, row: 5 }, side: 'defender', morale: 80 });

  it('cavalry goes after the broken foe', () => {
    const horse = unit({ id: 'h', officerId: 'h', coord: { col: 4, row: 4 }, unitType: 'cavalry' });
    expect(pickAiTarget(horse, [steady, routed])?.id).toBe('r');
  });

  it('foot keeps to the living enemy rather than opening its line', () => {
    const foot = unit({ id: 'f', officerId: 'f', coord: { col: 4, row: 4 }, unitType: 'infantry' });
    expect(pickAiTarget(foot, [steady, routed])?.id).toBe('s');
  });
});
