/** 批 B 打擂 — arena champion seeding, challengers & purses. */
import { describe, it, expect } from 'vitest';
import { pickArenaChampion, pickArenaChallenger, arenaTakeReward, arenaHoldStipend } from './arenaLadder';
import { mkOfficer, seededRng } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 60, intelligence: 55, politics: 50, charisma: 55 });

describe('pickArenaChampion', () => {
  it('picks the mightiest eligible fighter, skipping the excluded/ineligible', () => {
    const officers = {
      a: mkOfficer({ id: 'a', stats: W(70) }),
      b: mkOfficer({ id: 'b', stats: W(95) }),           // strongest
      c: mkOfficer({ id: 'c', stats: W(88), status: 'dead' }), // dead — skip
      d: mkOfficer({ id: 'd', stats: W(40) }),           // too weak to duel
    };
    expect(pickArenaChampion(officers)?.id).toBe('b');
    // excluding the strongest falls back to the next
    expect(pickArenaChampion(officers, 'b')?.id).toBe('a');
  });
  it('returns null when nobody can fight', () => {
    expect(pickArenaChampion({ x: mkOfficer({ id: 'x', stats: W(30) }) })).toBeNull();
  });
});

describe('pickArenaChallenger', () => {
  it('draws from the top slice and never the champion', () => {
    const officers: Record<string, ReturnType<typeof mkOfficer>> = {};
    for (let i = 0; i < 20; i++) officers[`o${i}`] = mkOfficer({ id: `o${i}`, stats: W(60 + i) });
    const rng = seededRng(4);
    for (let i = 0; i < 30; i++) {
      const c = pickArenaChallenger(officers, 'o19', rng);
      expect(c).not.toBeNull();
      expect(c!.id).not.toBe('o19');
    }
  });
});

describe('purses', () => {
  it('taking the seat pays more for ousting a mightier champion', () => {
    expect(arenaTakeReward(100).insight).toBeGreaterThan(arenaTakeReward(60).insight);
    expect(arenaTakeReward(100).gold).toBeGreaterThan(arenaTakeReward(60).gold);
    expect(arenaTakeReward(90).renown).toBe(1);
  });
  it('the hold stipend grows with a longer reign, then caps', () => {
    expect(arenaHoldStipend(5).insight).toBeGreaterThan(arenaHoldStipend(0).insight);
    expect(arenaHoldStipend(100).insight).toBe(arenaHoldStipend(6).insight); // capped at 6
    expect(arenaHoldStipend(3).renown).toBe(1); // a deed every 3rd defense
    expect(arenaHoldStipend(1).renown).toBe(0);
  });
});
