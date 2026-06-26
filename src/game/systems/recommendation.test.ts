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
    const recs = rollRecommendations({ officers, playerForceId: 'me', rng: always });
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({ recommenderId: 'sage', revealedId: 'hidden' });
  });

  it('does nothing without a capable recommender or any hidden talent', () => {
    const noTalent = { sage: mkOfficer({ id: 'sage', forceId: 'me', status: 'active', stats: { intelligence: 90 } as never }) };
    expect(rollRecommendations({ officers: noTalent, playerForceId: 'me', rng: always })).toHaveLength(0);

    const dullCourt = {
      dull: mkOfficer({ id: 'dull', forceId: 'me', status: 'active', stats: { intelligence: 40, charisma: 40 } as never }),
      hidden: mkOfficer({ id: 'hidden', forceId: null, status: 'unsearched' }),
    };
    expect(rollRecommendations({ officers: dullCourt, playerForceId: 'me', rng: always })).toHaveLength(0);
  });

  it('never recommends without a player force', () => {
    const officers = { hidden: mkOfficer({ id: 'hidden', forceId: null, status: 'unsearched' }) };
    expect(rollRecommendations({ officers, playerForceId: null, rng: always })).toHaveLength(0);
  });
});
