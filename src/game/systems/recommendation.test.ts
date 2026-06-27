/** 舉薦 — 賢以薦賢: a connected, capable officer surfaces a hidden talent. */
import { describe, expect, it } from 'vitest';
import { mkOfficer } from '../../test/factories';
import { rollRecommendations } from './recommendation';

const always = () => 0; // rng < 0.06 → recommendation fires

describe('rollRecommendations', () => {
  it('a capable serving officer surfaces an 在野 talent', () => {
    const officers = {
      sage: mkOfficer({ id: 'sage', forceId: 'me', status: 'active', stats: { intelligence: 90 } as never }),
      hidden: mkOfficer({ id: 'hidden', forceId: null, status: 'unsearched', locationCityId: 'longzhong' }),
    };
    const recs = rollRecommendations({ officers, forceId: 'me', rng: always });
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({ recommenderId: 'sage', revealedId: 'hidden' });
  });

  it('does nothing without a capable recommender or any hidden talent', () => {
    const noTalent = { sage: mkOfficer({ id: 'sage', forceId: 'me', status: 'active', stats: { intelligence: 90 } as never }) };
    expect(rollRecommendations({ officers: noTalent, forceId: 'me', rng: always })).toHaveLength(0);

    const dullCourt = {
      dull: mkOfficer({ id: 'dull', forceId: 'me', status: 'active', stats: { intelligence: 40, charisma: 40 } as never }),
      hidden: mkOfficer({ id: 'hidden', forceId: null, status: 'unsearched' }),
    };
    expect(rollRecommendations({ officers: dullCourt, forceId: 'me', rng: always })).toHaveLength(0);
  });

  it('works for any force, not just the player (賢以薦賢 is universal)', () => {
    const officers = {
      sage: mkOfficer({ id: 'sage', forceId: 'wei', status: 'active', stats: { intelligence: 90 } as never }),
      hidden: mkOfficer({ id: 'hidden', forceId: null, status: 'unsearched' }),
    };
    const recs = rollRecommendations({ officers, forceId: 'wei', rng: always });
    expect(recs).toHaveLength(1);
    expect(recs[0].recommenderId).toBe('sage');
  });

  it('a discerning recommender (高智) surfaces the stronger of two hidden talents', () => {
    const officers = {
      xun: mkOfficer({ id: 'xun', forceId: 'me', status: 'active', stats: { intelligence: 98, charisma: 80 } as never }),
      gem: mkOfficer({ id: 'gem', forceId: null, status: 'unsearched', stats: { war: 95, leadership: 90, intelligence: 95, politics: 85, charisma: 85 } as never }),
      dud: mkOfficer({ id: 'dud', forceId: null, status: 'unsearched', stats: { war: 30, leadership: 30, intelligence: 30, politics: 30, charisma: 30 } as never }),
    };
    // 智 98 → top ~15% slice → only the gem is in reach (no ties/townsman links here).
    const recs = rollRecommendations({ officers, forceId: 'me', rng: always });
    expect(recs[0].revealedId).toBe('gem');
  });

  it('never recommends without a force', () => {
    const officers = { hidden: mkOfficer({ id: 'hidden', forceId: null, status: 'unsearched' }) };
    expect(rollRecommendations({ officers, forceId: null, rng: always })).toHaveLength(0);
  });
});
