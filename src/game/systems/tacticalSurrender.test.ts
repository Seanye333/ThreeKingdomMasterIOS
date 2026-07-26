import { describe, expect, it } from 'vitest';
import {
  surrenderCheck, surrenderTargets, callSurrender, isBroken,
  SURRENDER_RANGE, SURRENDER_LOYALTY_WALL, SURRENDER_REFUSAL_MORALE, SURRENDER_CONTAGION,
} from './tacticalSurrender';
import { resolveBattleEnd } from './tactical';
import type { EntityId, Officer, TacticalBattle, TacticalUnit } from '../types';
import type { OathBond } from '../data/bonds';

/**
 * 陣前招降 — the battlefield had no way to accept a surrender at all: a foe
 * whose heart had gone could only be run down. These tests pin the two things
 * that make it a decision rather than a free button — a foe who is NOT broken
 * will not listen, and a refusal costs you (the action, and their renewed
 * heart) — plus the ownership rule at the end of the day.
 */

let seq = 0;
const off = (id: string, over: Partial<Officer> = {}): Officer =>
  ({
    id, name: { zh: id, en: id }, birthYear: 160,
    stats: { leadership: 70, war: 70, intelligence: 60, politics: 50, charisma: 70 },
    loyalty: 60, locationCityId: null, forceId: null, status: 'active',
    task: null, equipment: [], skills: [], rank: 'soldier',
    ...over,
  }) as Officer;

const unit = (u: Partial<TacticalUnit> & { officerId: string; coord: { col: number; row: number } }): TacticalUnit =>
  ({
    id: `u${seq++}`, side: 'attacker', unitType: 'infantry', troops: 5000,
    maxTroops: 5000, ap: 2, maxAp: 2, morale: 80, effects: [],
    ...u,
  }) as TacticalUnit;

const board = (units: TacticalUnit[], over: Partial<TacticalBattle> = {}): TacticalBattle =>
  ({
    id: 'b', turn: 4, activeSide: 'attacker', tiles: [], units, log: [],
    stratagemCooldowns: {}, attackerForceId: 'F-A', defenderForceId: 'F-D',
    attackerLosses: 0, defenderLosses: 0, weather: 'clear', timeOfDay: 'day',
    width: 12, height: 8, ...over,
  }) as unknown as TacticalBattle;

/** A caller at (5,5) and one enemy one hex away, broken by default. */
function scene(opts: {
  targetMorale?: number; targetTroops?: number; targetLoyalty?: number;
  callerCharisma?: number; distance?: number; targetCommander?: boolean;
  bonds?: OathBond[]; formerForceId?: string;
} = {}) {
  seq = 0;
  const officers: Record<EntityId, Officer> = {};
  const me = off('caller', { stats: { leadership: 70, war: 70, intelligence: 60, politics: 50, charisma: opts.callerCharisma ?? 70 } });
  const foe = off('foe', { loyalty: opts.targetLoyalty ?? 50, formerForceId: opts.formerForceId });
  officers[me.id] = me; officers[foe.id] = foe;
  const caller = unit({ officerId: me.id, coord: { col: 5, row: 5 }, side: 'attacker' });
  const target = unit({
    officerId: foe.id, side: 'defender',
    coord: { col: 5 + (opts.distance ?? 1), row: 5 },
    morale: opts.targetMorale ?? 10,
    troops: opts.targetTroops ?? 5000,
    isCommander: opts.targetCommander ?? false,
  });
  return { officers, caller, target, b: board([caller, target], { oathBonds: opts.bonds }) };
}

describe('陣前招降 — eligibility', () => {
  it('a foe still in good heart will not listen', () => {
    const { b, caller, target, officers } = scene({ targetMorale: 80, targetTroops: 5000 });
    expect(isBroken(target)).toBe(false);
    expect(surrenderCheck(b, caller, target, officers).reason).toBe('not-broken');
  });

  it('routing, shaken, or nearly wiped out all count as broken', () => {
    expect(isBroken(unit({ officerId: 'x', coord: { col: 0, row: 0 }, morale: 0 }))).toBe(true);
    expect(isBroken(unit({ officerId: 'x', coord: { col: 0, row: 0 }, morale: 20 }))).toBe(true);
    expect(isBroken(unit({ officerId: 'x', coord: { col: 0, row: 0 }, morale: 90, troops: 900 }))).toBe(true);
  });

  it('a shout only carries so far', () => {
    const near = scene({ distance: SURRENDER_RANGE });
    expect(surrenderCheck(near.b, near.caller, near.target, near.officers).ok).toBe(true);
    const far = scene({ distance: SURRENDER_RANGE + 1 });
    expect(surrenderCheck(far.b, far.caller, far.target, far.officers).reason).toBe('too-far');
  });

  it('an officer of unbreakable loyalty does not even hear it', () => {
    const { b, caller, target, officers } = scene({ targetLoyalty: SURRENDER_LOYALTY_WALL });
    expect(surrenderCheck(b, caller, target, officers).reason).toBe('unshakeable');
  });

  it('a blood feud with the caller refuses outright, however broken they are', () => {
    const feud: OathBond = { officerA: 'caller', officerB: 'foe', floor: 0, kind: 'feud', label: '宿怨', depth: 3 };
    const { b, caller, target, officers } = scene({ targetMorale: 0, targetLoyalty: 10, bonds: [feud] });
    expect(surrenderCheck(b, caller, target, officers).reason).toBe('bad-blood');
  });

  it('no action points, no call', () => {
    const { b, caller, target, officers } = scene();
    const spent = { ...caller, ap: 0 };
    expect(surrenderCheck(b, spent, target, officers).reason).toBe('no-ap');
  });

  it('each foe can be called on ONCE — a refusal cannot be re-rolled', () => {
    const { b, caller, target, officers } = scene();
    const after = callSurrender(b, caller.id, target.id, officers, () => 0.99); // refuses
    expect(after.yielded).toBe(false);
    const c2 = surrenderCheck(after.battle, after.battle.units.find((u) => u.id === caller.id)!, target, officers);
    expect(c2.reason).toBe('already-called');
  });
});

describe('陣前招降 — the odds', () => {
  const chanceOf = (o: Parameters<typeof scene>[0]) => {
    const { b, caller, target, officers } = scene(o);
    return surrenderCheck(b, caller, target, officers).chance;
  };

  it('charisma helps, loyalty hurts', () => {
    expect(chanceOf({ callerCharisma: 95 })).toBeGreaterThan(chanceOf({ callerCharisma: 45 }));
    expect(chanceOf({ targetLoyalty: 20 })).toBeGreaterThan(chanceOf({ targetLoyalty: 85 }));
  });

  it('a man who once followed your banner is far likelier to come over', () => {
    expect(chanceOf({ formerForceId: 'F-A' })).toBeGreaterThan(chanceOf({}));
    // ...but only YOUR banner — his old service to someone else means nothing.
    expect(chanceOf({ formerForceId: 'F-X' })).toBe(chanceOf({}));
  });

  it('a sworn brother on the other side is the hardest call to refuse', () => {
    const sworn: OathBond = { officerA: 'caller', officerB: 'foe', floor: 80, kind: 'oath', label: '結拜', depth: 3 };
    expect(chanceOf({ bonds: [sworn] })).toBeGreaterThan(chanceOf({}));
  });

  it('a commander does not abandon the host they lead', () => {
    expect(chanceOf({ targetCommander: true })).toBeLessThan(chanceOf({ targetCommander: false }));
  });

  it('the more finished they are, the likelier — and it never exceeds 75%', () => {
    expect(chanceOf({ targetMorale: 0, targetTroops: 400 })).toBeGreaterThan(chanceOf({ targetMorale: 24 }));
    expect(chanceOf({
      targetMorale: 0, targetTroops: 200, targetLoyalty: 1, callerCharisma: 100, formerForceId: 'F-A',
    })).toBeLessThanOrEqual(0.75);
  });
});

describe('陣前招降 — outcomes', () => {
  it('a refusal steels them and costs the caller the action', () => {
    const { b, caller, target, officers } = scene({ targetMorale: 10 });
    const res = callSurrender(b, caller.id, target.id, officers, () => 0.99);
    expect(res.yielded).toBe(false);
    expect(res.battle.units.find((u) => u.id === caller.id)!.ap).toBe(caller.ap - 1);
    expect(res.battle.units.find((u) => u.id === target.id)!.morale)
      .toBe(10 + SURRENDER_REFUSAL_MORALE);
    expect(res.battle.log!.some((l) => l.text.includes('拒'))).toBe(true);
  });

  it('a yield takes the unit off the field and records who it went to', () => {
    const { b, caller, target, officers } = scene();
    const res = callSurrender(b, caller.id, target.id, officers, () => 0);
    expect(res.yielded).toBe(true);
    expect(res.battle.units.find((u) => u.id === target.id)).toBeUndefined();
    expect(res.battle.surrendered).toEqual([{ officerId: 'foe', toSide: 'attacker' }]);
  });

  it('a banner going over shakes whoever watched it', () => {
    seq = 0;
    const officers: Record<EntityId, Officer> = {};
    for (const id of ['caller', 'foe', 'witness', 'faraway']) officers[id] = off(id, { loyalty: 50 });
    const caller = unit({ officerId: 'caller', coord: { col: 5, row: 5 }, side: 'attacker' });
    const target = unit({ officerId: 'foe', coord: { col: 6, row: 5 }, side: 'defender', morale: 5 });
    const witness = unit({ officerId: 'witness', coord: { col: 7, row: 5 }, side: 'defender', morale: 70 });
    const faraway = unit({ officerId: 'faraway', coord: { col: 11, row: 5 }, side: 'defender', morale: 70 });
    const b = board([caller, target, witness, faraway]);
    const res = callSurrender(b, caller.id, target.id, officers, () => 0);
    expect(res.battle.units.find((u) => u.id === witness.id)!.morale).toBe(70 - SURRENDER_CONTAGION);
    expect(res.battle.units.find((u) => u.id === faraway.id)!.morale).toBe(70);
  });

  it('surrenderTargets lists exactly the foes a check would allow', () => {
    seq = 0;
    const officers: Record<EntityId, Officer> = {
      caller: off('caller'),
      broken: off('broken', { loyalty: 40 }),
      steady: off('steady', { loyalty: 40 }),
      diehard: off('diehard', { loyalty: 99 }),
    };
    const caller = unit({ officerId: 'caller', coord: { col: 5, row: 5 } });
    const broken = unit({ officerId: 'broken', coord: { col: 6, row: 5 }, side: 'defender', morale: 4 });
    const steady = unit({ officerId: 'steady', coord: { col: 5, row: 6 }, side: 'defender', morale: 90 });
    const diehard = unit({ officerId: 'diehard', coord: { col: 4, row: 5 }, side: 'defender', morale: 4 });
    const b = board([caller, broken, steady, diehard]);
    expect(surrenderTargets(b, caller.id, officers).map((u) => u.officerId)).toEqual(['broken']);
  });
});

describe('陣前招降 — who keeps the prisoner', () => {
  const settled = (winner: 'attacker' | 'defender') => {
    const officers: Record<EntityId, Officer> = { caller: off('caller'), foe: off('foe') };
    const b = board([unit({ officerId: 'caller', coord: { col: 5, row: 5 } })], {
      winner,
      surrendered: [{ officerId: 'foe', toSide: 'attacker' }],
      casualties: { attacker: [], defender: [] },
    });
    return resolveBattleEnd(b, officers);
  };

  it('holding the field keeps them', () => {
    expect(settled('attacker').capturedOfficerIds).toContain('foe');
  });

  it('losing the day gives them back — a prisoner is only as good as the ground you hold', () => {
    expect(settled('defender').capturedOfficerIds).not.toContain('foe');
  });
});
