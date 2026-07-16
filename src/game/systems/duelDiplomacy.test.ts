/** 批 H 決鬥定和 — 以戰止戰: champions, acceptance, and the binding terms. */
import { describe, it, expect } from 'vitest';
import { pickPeaceChampion, willAcceptPeaceDuel, peaceDuelStakes, PEACE_DUEL_COST } from './duelDiplomacy';
import { duelTribute } from './duelChallenge';
import { mkOfficer, seededRng } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 60, intelligence: 55, politics: 50, charisma: 55 });

describe('pickPeaceChampion', () => {
  it('sends the realm\'s strongest duel-able officer', () => {
    const officers = {
      a: mkOfficer({ id: 'a', stats: W(72), forceId: 'wei' }),
      b: mkOfficer({ id: 'b', stats: W(94), forceId: 'wei' }),
      c: mkOfficer({ id: 'c', stats: W(99), forceId: 'shu' }),        // other realm
      d: mkOfficer({ id: 'd', stats: W(96), forceId: 'wei', status: 'dead' }),
      e: mkOfficer({ id: 'e', stats: W(45), forceId: 'wei' }),        // can't duel
    };
    expect(pickPeaceChampion(officers, 'wei')?.id).toBe('b');
    expect(pickPeaceChampion(officers, 'wu')).toBeNull();
  });
});

describe('willAcceptPeaceDuel — pride answers, dread declines', () => {
  const rate = (foe: ReturnType<typeof mkOfficer>, me: ReturnType<typeof mkOfficer>, grudge = 0) => {
    const rng = seededRng(11);
    let yes = 0;
    for (let i = 0; i < 400; i++) if (willAcceptPeaceDuel(foe, me, grudge, rng)) yes++;
    return yes / 400;
  };
  it('a confident champion\'s court accepts far oftener than an outmatched one', () => {
    const strong = mkOfficer({ id: 's', stats: W(96) });
    const weak = mkOfficer({ id: 'w', stats: W(62) });
    expect(rate(strong, weak)).toBeGreaterThan(rate(weak, strong) + 0.2);
  });
  it('a dreaded challenger thins the resolve to meet him', () => {
    const foe = mkOfficer({ id: 'f', stats: W(84) });
    const plain = mkOfficer({ id: 'p', stats: W(84) });
    const terror = mkOfficer({ id: 't', stats: W(84), renown: 500, traits: ['matchless', 'bloodthirsty'] });
    expect(rate(foe, terror)).toBeLessThan(rate(foe, plain));
  });
  it('a deep 積怨 wants its satisfaction (acceptance rises)', () => {
    const foe = mkOfficer({ id: 'f', stats: W(80) });
    const me = mkOfficer({ id: 'm', stats: W(84) });
    expect(rate(foe, me, 60)).toBeGreaterThan(rate(foe, me, 0));
  });
  it('is clamped to a sane band', () => {
    const god = mkOfficer({ id: 'g', stats: W(100), renown: 900, traits: ['matchless', 'tiger-roar', 'bloodthirsty'] });
    const mook = mkOfficer({ id: 'k', stats: W(52) });
    const r = rate(mook, god);
    expect(r).toBeGreaterThan(0.05); // never quite zero — some courts still answer
  });
});

describe('peaceDuelStakes — the pact binds either way', () => {
  const champ = mkOfficer({ id: 'c', stats: W(90) });
  it('every outcome yields a non-aggression term and goodwill', () => {
    for (const oc of ['win', 'loss', 'draw'] as const) {
      const s = peaceDuelStakes(oc, oc === 'draw' ? null : champ);
      expect(s.napSeasons).toBeGreaterThan(0);
      expect(s.scoreDelta).toBeGreaterThan(0);
    }
  });
  it('the loser pays; a draw pays nothing', () => {
    expect(peaceDuelStakes('win', champ).indemnity).toBe(duelTribute(champ) * 2);
    expect(peaceDuelStakes('loss', champ).indemnity).toBe(duelTribute(champ) * 2);
    expect(peaceDuelStakes('draw', null).indemnity).toBe(0);
  });
  it('a win settles warmest', () => {
    expect(peaceDuelStakes('win', champ).scoreDelta).toBeGreaterThan(peaceDuelStakes('draw', null).scoreDelta);
    expect(peaceDuelStakes('win', champ).grudgeEase).toBeGreaterThan(peaceDuelStakes('loss', champ).grudgeEase);
  });
  it('the envoy fee is a real cost', () => {
    expect(PEACE_DUEL_COST).toBeGreaterThan(0);
  });
});
