/** 權謀 — ambition: usurpation & breakaway. Pure, date-seeded, off the main rng. */
import { describe, expect, it } from 'vitest';
import type { City, Force } from '../types';
import { mkOfficer } from '../../test/factories';
import { resolveAmbitions } from './ambition';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wei', troops: 8000, gold: 2000, food: 40000,
    loyalty: 70, agriculture: 50, commerce: 50, defense: 60,
    adjacentCityIds: [], name: { zh: over.id, en: over.id },
    ...over,
  } as unknown as City);

const mkForce = (over: Partial<Force> & { id: string }): Force =>
  ({
    name: { zh: over.id, en: over.id }, rulerOfficerId: 'lord', capitalCityId: 'cap',
    color: '#888', isPlayer: false,
    ...over,
  } as Force);

describe('resolveAmbitions', () => {
  it('a loyal / content roster never rebels, at any seed', () => {
    for (let seed = 0; seed < 200; seed++) {
      const cities = {
        cap: mkCity({ id: 'cap', ownerForceId: 'wei' }),
        border: mkCity({ id: 'border', ownerForceId: 'wei' }),
      };
      const forces = { wei: mkForce({ id: 'wei', rulerOfficerId: 'lord', capitalCityId: 'cap' }) };
      const officers = {
        lord: mkOfficer({ id: 'lord', forceId: 'wei', locationCityId: 'cap', loyalty: 100 }),
        // disloyal but 'loyal' trait → immune
        faithful: mkOfficer({ id: 'faithful', forceId: 'wei', locationCityId: 'border', loyalty: 8, traits: ['loyal', 'ambitious'] as never }),
        // ambitious but content (loyalty high) → no motive
        content: mkOfficer({ id: 'content', forceId: 'wei', locationCityId: 'border', loyalty: 85, traits: ['ambitious'] as never }),
      };
      expect(resolveAmbitions({ officers, cities, forces, playerForceId: null, seed })).toHaveLength(0);
    }
  });

  it('a disloyal ambitious landed general can break away with his city', () => {
    let broke = false;
    for (let seed = 0; seed < 300 && !broke; seed++) {
      const cities = {
        cap: mkCity({ id: 'cap', ownerForceId: 'wei' }),
        border: mkCity({ id: 'border', ownerForceId: 'wei', troops: 6000 }),
      };
      const forces = { wei: mkForce({ id: 'wei', rulerOfficerId: 'lord', capitalCityId: 'cap' }) };
      const officers = {
        lord: mkOfficer({ id: 'lord', forceId: 'wei', locationCityId: 'cap', loyalty: 100, stats: { war: 88, leadership: 88, intelligence: 85, politics: 85, charisma: 85 } }),
        rebel: mkOfficer({ id: 'rebel', forceId: 'wei', locationCityId: 'border', loyalty: 8, grievanceCount: 4, traits: ['ambitious'] as never }),
      };
      const ev = resolveAmbitions({ officers, cities, forces, playerForceId: null, seed });
      if (ev.length && !ev[0].usurp) {
        broke = true;
        const nf = forces['breakaway-rebel'];
        expect(nf).toBeTruthy();
        expect(nf.rulerOfficerId).toBe('rebel');
        expect(cities.border.ownerForceId).toBe('breakaway-rebel');
        expect(officers.rebel.forceId).toBe('breakaway-rebel');
        expect(officers.rebel.loyalty).toBe(100);
        expect(cities.cap.ownerForceId).toBe('wei'); // capital stays put
      }
    }
    expect(broke).toBe(true);
  });

  it('a dominant general usurps a weak AI lord (force changes hands)', () => {
    let usurped = false;
    for (let seed = 0; seed < 400 && !usurped; seed++) {
      const cities = { cap: mkCity({ id: 'cap', ownerForceId: 'wei' }), b: mkCity({ id: 'b', ownerForceId: 'wei' }) };
      const forces = { wei: mkForce({ id: 'wei', rulerOfficerId: 'weakling', capitalCityId: 'cap' }) };
      const officers = {
        weakling: mkOfficer({ id: 'weakling', forceId: 'wei', locationCityId: 'cap', loyalty: 100, stats: { war: 30, leadership: 30, intelligence: 30, politics: 30, charisma: 30 } }),
        sima: mkOfficer({ id: 'sima', forceId: 'wei', locationCityId: 'cap', loyalty: 8, grievanceCount: 4, traits: ['ambitious'] as never, stats: { war: 92, leadership: 96, intelligence: 95, politics: 90, charisma: 88 } }),
      };
      const ev = resolveAmbitions({ officers, cities, forces, playerForceId: null, seed });
      if (ev.length && ev[0].usurp) {
        usurped = true;
        expect(forces.wei.rulerOfficerId).toBe('sima');
        expect(officers.sima.loyalty).toBe(100);
        expect(officers.weakling.forceId).toBeNull(); // old lord cast out
      }
    }
    expect(usurped).toBe(true);
  });

  it("the player's force can be broken away from but never usurped", () => {
    let sawUsurp = false;
    let sawBreakaway = false;
    for (let seed = 0; seed < 400; seed++) {
      const cities = { cap: mkCity({ id: 'cap', ownerForceId: 'wei' }), b: mkCity({ id: 'b', ownerForceId: 'wei' }) };
      const forces = { wei: mkForce({ id: 'wei', rulerOfficerId: 'me', capitalCityId: 'cap', isPlayer: true }) };
      const officers = {
        me: mkOfficer({ id: 'me', forceId: 'wei', locationCityId: 'cap', loyalty: 100, stats: { war: 30, leadership: 30 } }),
        sima: mkOfficer({ id: 'sima', forceId: 'wei', locationCityId: 'b', loyalty: 8, grievanceCount: 4, traits: ['ambitious'] as never, stats: { war: 95, leadership: 95, intelligence: 95, politics: 92, charisma: 90 } }),
      };
      const ev = resolveAmbitions({ officers, cities, forces, playerForceId: 'wei', seed });
      if (ev.length) {
        if (ev[0].usurp) sawUsurp = true;
        else sawBreakaway = true;
      }
    }
    expect(sawUsurp).toBe(false);
    expect(sawBreakaway).toBe(true);
  });
});
