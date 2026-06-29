/** 致師 — the pre-battle champion's challenge. */
import { describe, expect, it } from 'vitest';
import { mkBattle, mkUnit, mkOfficer } from '../../test/factories';
import { pickDuelChampion, canIssuePreBattleDuel, applyPreBattleDuel, aiMaybePreBattleDuel } from './tactical';
import { seededRng } from '../../test/factories';
import type { Officer } from '../types';

const officers: Record<string, Officer> = {
  hero: mkOfficer({ id: 'hero', stats: { war: 95, leadership: 80, intelligence: 60, politics: 50, charisma: 70 } }),
  cmd:  mkOfficer({ id: 'cmd', stats: { war: 80, leadership: 85, intelligence: 70, politics: 60, charisma: 70 } }),
  weak: mkOfficer({ id: 'weak', stats: { war: 40, leadership: 50, intelligence: 60, politics: 60, charisma: 50 } }), // can't duel
  foe:  mkOfficer({ id: 'foe', stats: { war: 88, leadership: 75, intelligence: 55, politics: 50, charisma: 60 } }),
};

const base = () => mkBattle({
  units: [
    mkUnit({ id: 'u-cmd', officerId: 'cmd', side: 'attacker', isCommander: true, coord: { col: 0, row: 0 } }),
    mkUnit({ id: 'u-hero', officerId: 'hero', side: 'attacker', coord: { col: 1, row: 1 } }),
    mkUnit({ id: 'u-weak', officerId: 'weak', side: 'attacker', coord: { col: 1, row: 2 } }),
    mkUnit({ id: 'u-foe', officerId: 'foe', side: 'defender', coord: { col: 9, row: 2 } }),
  ],
  width: 12, height: 6,
});

describe('致師 — champion selection', () => {
  it('fields the strongest duel-capable, non-supply fighter (not the weak one)', () => {
    const champ = pickDuelChampion(base(), 'attacker', officers);
    expect(champ?.officerId).toBe('hero'); // war 95 beats the commander's 80
  });

  it('returns null when a side has no able champion', () => {
    const b = mkBattle({ units: [mkUnit({ id: 'u-weak', officerId: 'weak', side: 'attacker', coord: { col: 0, row: 0 } }), mkUnit({ id: 'u-foe', officerId: 'foe', side: 'defender', coord: { col: 5, row: 0 } })], width: 8, height: 4 });
    expect(pickDuelChampion(b, 'attacker', officers)).toBeNull();
  });
});

describe('致師 — eligibility', () => {
  it('allowed on turn 1 when both sides have a champion and the special is unspent', () => {
    expect(canIssuePreBattleDuel(base(), 'attacker', officers)).toBe(true);
  });
  it('blocked after turn 1', () => {
    expect(canIssuePreBattleDuel({ ...base(), turn: 2 }, 'attacker', officers)).toBe(false);
  });
  it('blocked once the side has spent its 致師 or a 戰前準備', () => {
    expect(canIssuePreBattleDuel({ ...base(), preDuelUsed: { attacker: true } }, 'attacker', officers)).toBe(false);
    expect(canIssuePreBattleDuel({ ...base(), prepUsed: { attacker: 'ambush' } }, 'attacker', officers)).toBe(false);
  });
});

describe('致師 — outcome morale', () => {
  it('a win lifts the victor\'s host and cows the bested host, spending the special', () => {
    // Start everyone at 60 so the ±swing is observable (winner side caps at 100).
    const b = applyPreBattleDuel({ ...base(), units: base().units.map((u) => ({ ...u, morale: 60 })) }, 'attacker', 'attacker');
    expect(b.units.find((u) => u.id === 'u-hero')!.morale).toBe(78); // attacker +18
    expect(b.units.find((u) => u.id === 'u-foe')!.morale).toBe(38);  // defender −22
    expect(b.preDuelUsed?.attacker).toBe(true);
  });

  it('a draw leaves both armies tense (small dip), no edge', () => {
    const b = applyPreBattleDuel({ ...base(), units: base().units.map((u) => ({ ...u, morale: 60 })) }, 'attacker', 'draw');
    expect(b.units.every((u) => u.morale === 55)).toBe(true); // −5 both sides
  });
});

describe('致師 — AI-initiated challenge', () => {
  it('a clearly outmatched AI champion never throws itself away at the gate', () => {
    // Make the defender (AI) much weaker than the attacker's champion.
    const weakFoe: Record<string, Officer> = { ...officers, foe: mkOfficer({ id: 'foe', stats: { war: 55, leadership: 60, intelligence: 50, politics: 50, charisma: 50 } }) };
    const b = mkBattle({
      units: [
        mkUnit({ id: 'u-hero', officerId: 'hero', side: 'attacker', coord: { col: 0, row: 0 } }),
        mkUnit({ id: 'u-foe', officerId: 'foe', side: 'defender', isCommander: true, coord: { col: 9, row: 2 } }),
      ], width: 12, height: 6,
    });
    let everIssued = false;
    for (let s = 0; s < 40; s++) {
      const r = aiMaybePreBattleDuel(b, 'defender', weakFoe, seededRng(s * 5 + 1));
      if (r.issued) everIssued = true;
    }
    expect(everIssued).toBe(false); // edge −40 → never challenges
  });

  it('a strong AI champion eagerly challenges, marking it used + a banner line', () => {
    // Defender (AI) fields the mighty 'hero' (war 95); attacker only the weaker 'foe' (88).
    const b = mkBattle({
      units: [
        mkUnit({ id: 'u-foe', officerId: 'foe', side: 'attacker', isCommander: true, coord: { col: 0, row: 0 } }),
        mkUnit({ id: 'u-hero', officerId: 'hero', side: 'defender', coord: { col: 9, row: 2 } }),
      ], width: 12, height: 6,
    });
    let issued = 0;
    for (let s = 0; s < 40; s++) {
      const r = aiMaybePreBattleDuel(b, 'defender', officers, seededRng(s * 7 + 3));
      if (r.issued) {
        issued++;
        expect(r.line).toBeTruthy();
        expect(r.battle.preDuelUsed?.defender).toBe(true);
      } else {
        expect(r.battle).toBe(b); // unchanged when not issued
      }
    }
    expect(issued).toBeGreaterThan(5); // ~+7 edge → challenges often
  });
});
