import { describe, it, expect } from 'vitest';
import {
  duelChallengeTargets, willAcceptChallenge, challengeStakes, CHALLENGE_MIN_WAR,
  findIncomingChallenge,
} from './duelChallenge';
import { recordRivalryBout, NEMESIS_THRESHOLD, type RivalryMap } from './rivalries';
import { mkOfficer, seededRng } from '../../test/factories';
import type { Officer } from '../types';

const W = (war: number) => ({ war, leadership: 60, intelligence: 50, politics: 50, charisma: 60 });

describe('約戰 — target list', () => {
  const officers: Record<string, Officer> = {
    mine:  mkOfficer({ id: 'mine', forceId: 'P', stats: W(90) }),
    strong: mkOfficer({ id: 'strong', forceId: 'E', stats: W(95) }),
    weak:  mkOfficer({ id: 'weak', forceId: 'E', stats: W(60) }), // below war floor
    capt:  mkOfficer({ id: 'capt', forceId: 'E', status: 'imprisoned', stats: W(88) }), // captured
    ally:  mkOfficer({ id: 'ally', forceId: 'P', stats: W(92) }), // same force
    wild:  mkOfficer({ id: 'wild', forceId: undefined, stats: W(85) }), // in the wild (no force)
  };

  it('lists only hostile, free, martial-enough champions, strongest first', () => {
    const targets = duelChallengeTargets(officers, 'P');
    expect(targets.map((o) => o.id)).toEqual(['strong']); // weak<floor, capt imprisoned, ally same force, wild forceless
  });

  it('respects a custom war floor and limit', () => {
    const targets = duelChallengeTargets(officers, 'P', { minWar: 55, limit: 1 });
    expect(targets.length).toBe(1);
    expect(targets[0].id).toBe('strong'); // still strongest first
    expect(CHALLENGE_MIN_WAR).toBe(70);
  });
});

describe('約戰 — acceptance', () => {
  // A modest challenger, so a craven CAN out-stat them without tripping the
  // war≥88 "aggressive by stat shape" rule (kept timid via a high 智力).
  const challenger = mkOfficer({ id: 'ch', stats: W(70) });
  it('a 鬥將 / aggressive foe never ducks', () => {
    const brave = mkOfficer({ id: 'b', stats: W(95), traits: ['duelist'] });
    for (let s = 0; s < 20; s++) expect(willAcceptChallenge(brave, challenger, seededRng(s + 1))).toBe(true);
  });
  it('a coward only fights when clearly stronger, and even then not always', () => {
    // One rng stream sampled many times, so the distribution is actually exercised.
    const rng = seededRng(7);
    const craven = mkOfficer({ id: 'c', stats: { war: 72, leadership: 60, intelligence: 80, politics: 50, charisma: 60 }, traits: ['cautious'] });
    let accepts = 0;
    for (let s = 0; s < 60; s++) if (willAcceptChallenge(craven, challenger, rng)) accepts++;
    expect(accepts).toBe(0); // edge only ~+2 → never a sure thing → always ducks
    const cravenStrong = mkOfficer({ id: 'cs', stats: { war: 90, leadership: 60, intelligence: 78, politics: 50, charisma: 60 }, traits: ['cautious'] });
    let acc2 = 0;
    for (let s = 0; s < 60; s++) if (willAcceptChallenge(cravenStrong, challenger, rng)) acc2++;
    expect(acc2).toBeGreaterThan(0);   // a big edge (+16) tempts even a wary foe…
    expect(acc2).toBeLessThan(60);     // …but not every time
  });
});

describe('敵將約戰 — incoming challenge', () => {
  const officers: Record<string, Officer> = {
    mine:  mkOfficer({ id: 'mine', forceId: 'P', stats: W(85) }),
    // An aggressive, confident foe (war-shape triggers 'aggressive', strong enough).
    bully: mkOfficer({ id: 'bully', forceId: 'E', stats: { war: 95, leadership: 60, intelligence: 50, politics: 50, charisma: 60 } }),
    // A timid foe who would never call anyone out.
    meek:  mkOfficer({ id: 'meek', forceId: 'E', stats: { war: 80, leadership: 60, intelligence: 88, politics: 50, charisma: 60 }, traits: ['cautious'] }),
  };

  it('an aggressive, confident foe calls out a player champion', () => {
    const ch = findIncomingChallenge(officers, 'P', {});
    expect(ch).not.toBeNull();
    expect(ch!.foeId).toBe('bully');
    expect(ch!.championId).toBe('mine');
    expect(ch!.sworn).toBe(false);
  });

  it('no challenge when the only foes are timid and not sworn rivals', () => {
    const timidOnly = { mine: officers.mine, meek: officers.meek };
    expect(findIncomingChallenge(timidOnly, 'P', {})).toBeNull();
  });

  it('a sworn 宿敵 always calls you out, and takes precedence', () => {
    let m: RivalryMap = {};
    for (let i = 0; i < NEMESIS_THRESHOLD; i++) m = recordRivalryBout(m, 'mine', 'meek', 'draw', false, 200, 0);
    const ch = findIncomingChallenge({ mine: officers.mine, meek: officers.meek }, 'P', m);
    expect(ch).not.toBeNull();
    expect(ch!.foeId).toBe('meek'); // even the timid one, once sworn, rides out
    expect(ch!.sworn).toBe(true);
  });
});

describe('約戰 — stakes', () => {
  it('a win lifts the challenger and humbles the foe; a refusal shames the foe', () => {
    expect(challengeStakes('win').challengerRenown).toBeGreaterThan(0);
    expect(challengeStakes('win').targetRenown).toBeLessThan(0);
    expect(challengeStakes('win').targetLoyalty).toBeLessThan(0);
    expect(challengeStakes('refused').targetRenown).toBeLessThan(0);
    expect(challengeStakes('loss').challengerRenown).toBeLessThan(0);
    expect(challengeStakes('draw').challengerRenown).toBeGreaterThanOrEqual(0);
  });
});
