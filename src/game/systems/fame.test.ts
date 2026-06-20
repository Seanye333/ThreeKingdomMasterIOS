import { describe, it, expect } from 'vitest';
import { mkOfficer } from '../../test/factories';
import { createDeeds } from '../types/deeds';
import { renownFromDeeds, fameTier, nextTierThreshold, rollChallenger } from './fame';

describe('fame ladder', () => {
  it('weights duel & debate wins into renown and climbs tiers', () => {
    expect(renownFromDeeds(undefined)).toBe(0);
    expect(fameTier(0).id).toBe('unknown');
    const d = { ...createDeeds('x'), duelsWon: 12, debatesWon: 5, citiesTaken: 1 };
    // 12*5 + 5*4 + 1*8 = 88 → 小有名氣 (known, min 50)
    expect(renownFromDeeds(d)).toBe(88);
    expect(fameTier(88).id).toBe('known');
    expect(nextTierThreshold(88)).toBe(100);
    expect(nextTierThreshold(9999)).toBeNull();
  });

  it('a renowned warrior draws a fair duelist challenger; an unknown draws none', () => {
    const champ = mkOfficer({ id: 'champ', stats: { war: 92, leadership: 70, intelligence: 60, politics: 50, charisma: 60 } });
    const peer = mkOfficer({ id: 'peer', stats: { war: 88, leadership: 70, intelligence: 60, politics: 50, charisma: 60 } });
    const weakling = mkOfficer({ id: 'weak', stats: { war: 40, leadership: 50, intelligence: 50, politics: 50, charisma: 50 } });
    // Renowned (≥100) + rng below the chance → a challenger appears, war-matched.
    const ch = rollChallenger(champ, 150, [peer, weakling], () => 0.0);
    expect(ch?.challengerId).toBe('peer');
    expect(ch?.kind).toBe('duel');
    expect(ch?.bounty).toBeGreaterThan(0);
    // An unknown champion (renown < 50) draws nobody.
    expect(rollChallenger(champ, 10, [peer], () => 0.0)).toBeNull();
  });

  it('a strategist champion draws a 舌戰 challenger', () => {
    const sage = mkOfficer({ id: 'sage', stats: { war: 50, leadership: 60, intelligence: 95, politics: 80, charisma: 80 } });
    const rival = mkOfficer({ id: 'rival', stats: { war: 50, leadership: 60, intelligence: 90, politics: 80, charisma: 80 } });
    const ch = rollChallenger(sage, 220, [rival], () => 0.0);
    expect(ch?.kind).toBe('debate');
    expect(ch?.challengerId).toBe('rival');
  });
});
