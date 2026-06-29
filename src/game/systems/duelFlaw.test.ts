/** 破綻 — whiffing an attack opens you up; the next blow you take bites deeper. */
import { describe, it, expect } from 'vitest';
import { initDuelBout, duelRound, type DuelBout } from './duel';
import { mkOfficer, seededRng } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 60, intelligence: 50, politics: 50, charisma: 60 });
const fresh = (): DuelBout => initDuelBout(mkOfficer({ id: 'a', stats: W(85) }), mkOfficer({ id: 'd', stats: W(85) }));

describe('破綻 (off-balance meter)', () => {
  it('whiffing an attack into a hold opens the attacker up', () => {
    // 劈 cleave is held by 格 guard (guard isn't cleave's blind spot) → no damage,
    // attacker committed and didn't win → 破綻 builds.
    const r = duelRound(fresh(), 'cleave', 'guard', seededRng(1));
    expect(r.dmgToDefender).toBe(0);        // the cleave was turned aside
    expect(r.bout.aFlaw).toBeGreaterThan(0); // …and the attacker is now exposed
  });

  it('landing or holding keeps you composed (no 破綻)', () => {
    // 斬 slash punished by 閃 dodge → attacker lands clean.
    const r = duelRound(fresh(), 'slash', 'dodge', seededRng(2));
    expect(r.dmgToDefender).toBeGreaterThan(0);
    expect(r.bout.aFlaw).toBe(0);
  });

  it('a blow landed on an off-balance fighter bites deeper than on a composed one', () => {
    // Build the attacker's 破綻 by whiffing, then have them eat a clean slash.
    let exposed = duelRound(fresh(), 'cleave', 'guard', seededRng(3)).bout; // attacker now exposed
    const exposedFlaw = exposed.aFlaw;
    expect(exposedFlaw).toBeGreaterThan(0);
    // Same exchange dealt to a composed attacker vs the exposed one — compare the hit.
    const rng1 = seededRng(7), rng2 = seededRng(7);
    const composedHit = duelRound(fresh(), 'dodge', 'slash', rng1).dmgToAttacker;          // flaw 0
    const exposedHit = duelRound({ ...fresh(), aFlaw: exposedFlaw }, 'dodge', 'slash', rng2).dmgToAttacker; // flaw>0
    expect(exposedHit).toBeGreaterThan(composedHit);
  });
});

import { mountEdge } from './duel';
describe('挑落下馬 — unhorsing a mounted fighter', () => {
  it('a parry-disarm against a mounted fighter unhorses them, voiding the steed savior', () => {
    const rider = mkOfficer({ id: 'rider', stats: W(80), equipment: ['dilu'] }); // 的盧 → savior + mounted
    const foe = mkOfficer({ id: 'foe', stats: W(95) });
    expect(mountEdge(rider)).toBe('savior');
    // rider attacks (cleave), foe parries — cleave is punished by parry, so the
    // rider is NOT parried here; use slash vs parry (parry holds slash) to trigger
    // the disarm/unhorse path with the rider as the parried attacker.
    let sawUnhorse = false;
    for (let s = 0; s < 80 && !sawUnhorse; s++) {
      const bout = initDuelBout(rider, foe);
      expect(bout.aMounted).toBe(true);
      const r = duelRound(bout, 'slash', 'parry', seededRng(s * 5 + 1));
      if (r.unhorsed === 'attacker') {
        sawUnhorse = true;
        expect(r.bout.aUnhorsed).toBe(true);
        expect(r.bout.aMountSavior).toBe(false); // fell off → no 的盧救主 on foot
      }
    }
    expect(sawUnhorse).toBe(true);
  });
});
