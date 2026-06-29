/** AI 把握戰機 — a seasoned foe holds its 必殺 for the kill and presses a low foe. */
import { describe, it, expect } from 'vitest';
import { initDuelBout, aiDuelMove, SPIRIT_MAX, type DuelBout } from './duel';
import { mkOfficer, seededRng } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 60, intelligence: 80, politics: 50, charisma: 60 });

// A bout with the defender's 武魂 full and a chosen foe (attacker) stamina.
const boutWithUlt = (foeStamina: number, difficulty: 'rookie' | 'veteran' | 'peerless'): DuelBout => {
  const d = mkOfficer({ id: 'd', stats: W(88) });
  const a = mkOfficer({ id: 'a', stats: W(88) });
  return { ...initDuelBout(a, d, 0, 0, difficulty), dSpirit: SPIRIT_MAX, aStamina: foeStamina };
};

const ultRate = (foeStamina: number, difficulty: 'rookie' | 'veteran' | 'peerless') => {
  const rng = seededRng(99); // one shared stream so the distribution is exercised
  let ults = 0;
  for (let s = 0; s < 400; s++) {
    if (aiDuelMove(boutWithUlt(foeStamina, difficulty), 'defender', rng) === 'ultimate') ults++;
  }
  return ults / 400;
};

describe('AI ult timing', () => {
  it('a peerless foe HOLDS the 必殺 when the foe is healthy', () => {
    const healthy = ultRate(90, 'peerless');
    expect(healthy).toBeLessThan(0.6); // not the old ~0.85 spam
  });

  it('…but unleashes it almost always when it can finish a low foe', () => {
    const finishable = ultRate(30, 'peerless');
    expect(finishable).toBeGreaterThan(0.85);
  });

  it('a rookie just lets the finisher fly regardless', () => {
    const rookieHealthy = ultRate(90, 'rookie');
    expect(rookieHealthy).toBeGreaterThan(0.7);
  });
});
