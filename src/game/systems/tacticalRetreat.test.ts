/**
 * 脫離戰場 — the player-facing predicate must agree with what the action does.
 *
 * Written as a pair on purpose. `retreatUnit` signals "not allowed" by
 * returning the battle unchanged, which is enough for the AI (it just tries
 * something else) but useless for a player: a button that silently does
 * nothing reads as a broken game. So the rule is: everywhere canRetreatUnit
 * says yes, the action must change the battle; everywhere it says no, the
 * action must be a no-op. Same contract as the siege actions.
 */
import { describe, expect, it } from 'vitest';
import { canRetreatUnit, retreatUnit } from './tactical';
import { mkUnit, mkBattle } from '../../test/factories';

describe('canRetreatUnit / retreatUnit — 說可以就真的做得到', () => {
  it('a unit back at its own edge leaves, and 10% is written off as stragglers', () => {
    const u = mkUnit({ id: 'r1', officerId: 'o1', side: 'attacker', coord: { col: 1, row: 2 }, troops: 5000 });
    const foe = mkUnit({ id: 'r2', officerId: 'o2', side: 'defender', coord: { col: 8, row: 2 } });
    const b = mkBattle({ units: [u, foe] });
    expect(canRetreatUnit(b, u)).toBe(true);
    const after = retreatUnit(b, 'r1');
    expect(after.units.find((x) => x.id === 'r1')).toBeUndefined();
    expect(after.attackerLosses ?? 0).toBe(500);
  });

  it('deep in enemy ground it cannot, and the action is a no-op', () => {
    const u = mkUnit({ id: 'deep', officerId: 'o1', side: 'attacker', coord: { col: 7, row: 2 }, troops: 5000 });
    const b = mkBattle({ units: [u] });
    expect(canRetreatUnit(b, u)).toBe(false);
    expect(retreatUnit(b, 'deep')).toBe(b);
  });

  it('主將不走 — the commander is refused by both', () => {
    const cmdr = mkUnit({ id: 'cmd', officerId: 'o1', side: 'attacker', coord: { col: 0, row: 2 }, troops: 5000, isCommander: true });
    const b = mkBattle({ units: [cmdr] });
    expect(canRetreatUnit(b, cmdr)).toBe(false);
    expect(retreatUnit(b, 'cmd')).toBe(b);
  });

  it('a wiped-out unit is not offered the option', () => {
    const dead = mkUnit({ id: 'gone', officerId: 'o1', side: 'attacker', coord: { col: 1, row: 1 }, troops: 0 });
    expect(canRetreatUnit(mkBattle({ units: [dead] }), dead)).toBe(false);
  });
});
