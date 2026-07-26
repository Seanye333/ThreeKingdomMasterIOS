import { describe, expect, it } from 'vitest';
import { setupTacticalBattle } from './tacticalSetup';
import { pickAiFormation } from './tactical';
import { FORMATIONS_BY_ID } from '../data/formations';
import type { Officer, UnitType } from '../types';

/**
 * 十面埋伏 — a formation named for ambush that put nobody in ambush.
 *
 * The old rule was "a unit that HAPPENS to be deployed onto a forest tile
 * starts hidden". Deployment lines are laid out by rank, not by cover, so in
 * 120 observed AI battles the mechanic sprang exactly zero times. Two separate
 * holes fed that: the picker never offered the formation at all, and even when
 * the store forced it (a dug-in army), nobody walked into the trees.
 */

let oc = 0;
const mk = (int: number): Officer => {
  const id = `am${oc++}`;
  return {
    id, name: { zh: id, en: id }, birthYear: 160,
    stats: { leadership: 70, war: 70, intelligence: int, politics: 55, charisma: 65 },
    loyalty: 70, locationCityId: null, forceId: null, status: 'active',
    task: null, equipment: [], skills: [], rank: 'soldier',
  } as Officer;
};

function fight(defenderFormation: string, cityId = 'ambush-field') {
  oc = 0;
  const officers: Record<string, Officer> = {};
  const side = () => [0, 1, 2, 3].map(() => {
    const o = mk(80);
    officers[o.id] = o;
    return { officer: o, troops: 6000, unitType: 'infantry' as UnitType };
  });
  return setupTacticalBattle({
    cityId, width: 14, height: 10,
    attackerForceId: 'A', defenderForceId: 'D',
    attackers: side(), defenders: side(),
    attackerFormation: 'fish-scale',
    defenderFormation: defenderFormation as never,
    field: true,
  });
}

describe('十面埋伏 — the wing actually goes to ground', () => {
  it('without the formation nobody is hidden', () => {
    expect(fight('fish-scale').units.some((u) => u.hidden)).toBe(false);
  });

  it('with it, part of the defending contingent is in the trees before turn 1', () => {
    const b = fight('ten-ambush');
    const hidden = b.units.filter((u) => u.hidden);
    expect(hidden.length).toBeGreaterThan(0);
    // Everyone hidden really is in cover — not merely flagged.
    for (const u of hidden) {
      const tile = b.tiles.find((t) => t.coord.col === u.coord.col && t.coord.row === u.coord.row);
      expect(tile?.terrain).toBe('forest');
    }
  });

  it('is an ambush WING, not a vanishing army — the commander stays in the line', () => {
    const b = fight('ten-ambush');
    const defenders = b.units.filter((u) => u.side === 'defender');
    const hidden = defenders.filter((u) => u.hidden);
    expect(hidden.length).toBeLessThanOrEqual(Math.ceil(defenders.length / 2));
    expect(hidden.some((u) => u.isCommander)).toBe(false);
    // The other side, which did not use the formation, is untouched.
    expect(b.units.filter((u) => u.side === 'attacker').some((u) => u.hidden)).toBe(false);
  });

  it('never stacks two units on the same hex when relocating them', () => {
    const b = fight('ten-ambush');
    const seen = new Set(b.units.map((u) => `${u.coord.col},${u.coord.row}`));
    expect(seen.size).toBe(b.units.length);
  });
});

describe('十面埋伏 — the AI can finally choose it', () => {
  const arms: UnitType[] = ['infantry', 'infantry', 'infantry'];
  const wits = FORMATIONS_BY_ID['ten-ambush']!.minIntelligence;

  it('needs cover AND a defender\'s stance AND the formation\'s own wits gate', () => {
    expect(pickAiFormation(arms, wits + 1, { defensive: true, wooded: true })).toBe('ten-ambush');
    expect(pickAiFormation(arms, wits + 1, { defensive: true, wooded: false })).not.toBe('ten-ambush');
    expect(pickAiFormation(arms, wits + 1, { wooded: true })).not.toBe('ten-ambush');
    expect(pickAiFormation(arms, wits - 1, { defensive: true, wooded: true })).not.toBe('ten-ambush');
  });

  it('is offered ahead of the plain defensive picks — first usable candidate wins', () => {
    // The bug this pins: pushing it after the 因軍制宜 block meant 魚鱗 always
    // won the `cands.find(usable)` race and the ambush was unreachable.
    expect(pickAiFormation(arms, wits + 1, { defensive: true, wooded: true })).not.toBe('fish-scale');
  });
});
