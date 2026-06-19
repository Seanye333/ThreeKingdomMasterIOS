/** 潛伏細作 — persistent spies: intel, erosion, exposure, capture, extraction. */
import { describe, expect, it } from 'vitest';
import type { City, EmbeddedSpy } from '../types';
import { mkOfficer } from '../../test/factories';
import { tickEmbeddedSpies } from './spies';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wu', troops: 5000, gold: 2000, food: 30000,
    loyalty: 70, agriculture: 50, commerce: 50, defense: 50, population: 100000,
    adjacentCityIds: [], name: { zh: over.id, en: over.id },
    ...over,
  } as unknown as City);

const spy = (over: Partial<EmbeddedSpy> & { id: string }): EmbeddedSpy => ({
  agentOfficerId: 'agent', targetCityId: 'wu-city', originCityId: 'home',
  targetForceId: 'wu', plantedYear: 200, exposure: 0,
  ...over,
});

describe('tickEmbeddedSpies', () => {
  it('reveals the city, erodes loyalty, and raises exposure', () => {
    const officers = { agent: mkOfficer({ id: 'agent', forceId: 'me', locationCityId: 'wu-city', stats: { intelligence: 90 } }) };
    const cities = { 'wu-city': mkCity({ id: 'wu-city', ownerForceId: 'wu', loyalty: 70 }) };
    const out = tickEmbeddedSpies({ spies: [spy({ id: 's1' })], cities, officers, playerForceId: 'me', rng: () => 0.5 });
    expect(out.spies).toHaveLength(1);
    expect(out.spies[0].exposure).toBeGreaterThan(0);
    expect(out.reveals['wu-city']).toBeGreaterThan(0);
    expect(out.cities['wu-city'].loyalty).toBeLessThan(70);
  });

  it('caught at exposure ≥ 100: agent imprisoned, the lord resents it', () => {
    const officers = { agent: mkOfficer({ id: 'agent', forceId: 'me', locationCityId: 'wu-city', stats: { intelligence: 50 } }) };
    const cities = { 'wu-city': mkCity({ id: 'wu-city', ownerForceId: 'wu' }) };
    const out = tickEmbeddedSpies({ spies: [spy({ id: 's1', exposure: 95 })], cities, officers, playerForceId: 'me', rng: () => 0.5 });
    expect(out.spies).toHaveLength(0);
    expect(out.officers['agent'].status).toBe('imprisoned');
    expect(out.grudgeBumps['wu']).toBeGreaterThan(0);
  });

  it('a city no longer hostile sends the agent safely home', () => {
    const officers = { agent: mkOfficer({ id: 'agent', forceId: 'me', locationCityId: 'wu-city' }) };
    const cities = {
      'wu-city': mkCity({ id: 'wu-city', ownerForceId: 'me' }), // captured by us
      home: mkCity({ id: 'home', ownerForceId: 'me' }),
    };
    const out = tickEmbeddedSpies({ spies: [spy({ id: 's1', originCityId: 'home' })], cities, officers, playerForceId: 'me', rng: () => 0.5 });
    expect(out.spies).toHaveLength(0);
    expect(out.officers['agent'].status).toBe('idle');
    expect(out.officers['agent'].locationCityId).toBe('home');
  });
});
