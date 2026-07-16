/** 批 D 涟漪大地圖 — 威名威懾(duelDread)· 代戰認輸金(duelTribute). */
import { describe, it, expect } from 'vitest';
import { duelDread, duelTribute, willAcceptChallenge } from './duelChallenge';
import { staticProwess } from './duel';
import { mkOfficer, seededRng } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 60, intelligence: 55, politics: 50, charisma: 55 });

describe('威名威懾 (duelDread)', () => {
  it('a famed / terror-trait champion cows foes far more than a nobody', () => {
    const nobody = mkOfficer({ id: 'n', stats: W(80) });
    const terror = mkOfficer({ id: 't', stats: W(98), renown: 400, traits: ['matchless', 'tiger-roar', 'bloodthirsty'] });
    expect(duelDread(nobody)).toBe(0);
    expect(duelDread(terror)).toBeGreaterThan(0.3);
  });
  it('is capped', () => {
    const god = mkOfficer({ id: 'g', stats: W(100), renown: 9999, traits: ['matchless', 'tiger-roar', 'bloodthirsty', 'berserker'] });
    expect(duelDread(god)).toBeLessThanOrEqual(0.42);
  });
});

describe('威名威懾 makes foes duck (willAcceptChallenge)', () => {
  it('an evenly-matched foe rides out far less against a dreaded name', () => {
    const target = mkOfficer({ id: 'foe', stats: W(84) }); // ordinary, not a 鬥將
    const plain = mkOfficer({ id: 'p', stats: W(84) });
    const terror = mkOfficer({ id: 't', stats: W(84), renown: 500, traits: ['matchless', 'bloodthirsty'] }); // same prowess-ish, fearsome name
    const acceptRate = (challenger: ReturnType<typeof mkOfficer>) => {
      const rng = seededRng(9);
      let yes = 0;
      for (let i = 0; i < 400; i++) if (willAcceptChallenge(target, challenger, rng)) yes++;
      return yes / 400;
    };
    // Note: matchless adds prowess too, so gate on the DREAD dropping acceptance,
    // holding prowess roughly comparable by construction.
    expect(acceptRate(terror)).toBeLessThan(acceptRate(plain));
  });
  it('a 鬥將 never ducks, dread or no', () => {
    const bravo = mkOfficer({ id: 'b', stats: W(80), traits: ['duelist'] });
    const terror = mkOfficer({ id: 't', stats: W(100), renown: 800, traits: ['matchless', 'tiger-roar'] });
    expect(willAcceptChallenge(bravo, terror, seededRng(1))).toBe(true);
  });
});

describe('代戰認輸金 (duelTribute)', () => {
  it('scales with the beaten champion\'s mettle', () => {
    const weak = mkOfficer({ id: 'w', stats: W(60) });
    const strong = mkOfficer({ id: 's', stats: W(95), traits: ['matchless'] });
    expect(duelTribute(strong)).toBeGreaterThan(duelTribute(weak));
    expect(duelTribute(weak)).toBeGreaterThan(150); // a floor + prowess
    // sanity: tied to staticProwess
    expect(duelTribute(strong)).toBe(Math.round(150 + Math.max(0, staticProwess(strong)) * 2));
  });
});
