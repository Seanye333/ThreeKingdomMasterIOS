/** 贖俘 — AI lords ransom captured officers back into circulation. */
import { describe, expect, it } from 'vitest';
import type { City, Force } from '../types';
import { mkOfficer } from '../../test/factories';
import { resolveAIRansoms } from './aiRansom';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wei', troops: 6000, gold: 5000, food: 20000,
    loyalty: 60, population: 80_000, agriculture: 50, commerce: 50, defense: 50,
    adjacentCityIds: [], name: { zh: over.id, en: over.id }, terrain: 'plain',
    ...over,
  } as unknown as City);

const forces: Record<string, Force> = {
  wei: { id: 'wei', name: { zh: '魏', en: 'Wei' }, color: '#888', capitalCityId: 'wei-cap', rulerOfficerId: 'wl', isPlayer: false } as Force,
  shu: { id: 'shu', name: { zh: '蜀', en: 'Shu' }, color: '#393', capitalCityId: 'shu-cap', rulerOfficerId: 'sl', isPlayer: false } as Force,
};

describe('resolveAIRansoms', () => {
  it("an AI lord buys his captured officer back from the captor's city", () => {
    let ransomed = false;
    for (let i = 0; i < 80 && !ransomed; i++) {
      const cities = {
        'wei-cap': mkCity({ id: 'wei-cap', ownerForceId: 'wei', gold: 4000 }), // captor (holds prisoner)
        'shu-cap': mkCity({ id: 'shu-cap', ownerForceId: 'shu', gold: 8000 }), // home force (pays)
      };
      const officers = {
        cap: mkOfficer({ id: 'cap', forceId: null, status: 'imprisoned', locationCityId: 'wei-cap', capturedFromForceId: 'shu', loyalty: 30, stats: { war: 95, leadership: 90, intelligence: 80, politics: 70, charisma: 80 } }),
      };
      const out = resolveAIRansoms({ forces, officers, cities, playerForceId: null, rng: () => 0.01 });
      if (out.officers.cap.status === 'idle') {
        ransomed = true;
        expect(out.officers.cap.forceId).toBe('shu');
        expect(out.officers.cap.locationCityId).toBe('shu-cap');
        expect(out.officers.cap.capturedFromForceId).toBeUndefined();
        expect(out.cities['shu-cap'].gold).toBeLessThan(8000); // home paid
        expect(out.cities['wei-cap'].gold).toBeGreaterThan(4000); // captor banked it
      }
    }
    expect(ransomed).toBe(true);
  });

  it("never spends the player's gold to ransom the player's own officer", () => {
    const cities = {
      'wei-cap': mkCity({ id: 'wei-cap', ownerForceId: 'wei', gold: 4000 }),
      'shu-cap': mkCity({ id: 'shu-cap', ownerForceId: 'shu', gold: 8000 }),
    };
    const officers = {
      // The player (shu) had this officer captured by wei — shu must not auto-pay.
      cap: mkOfficer({ id: 'cap', forceId: null, status: 'imprisoned', locationCityId: 'wei-cap', capturedFromForceId: 'shu', loyalty: 30, stats: { war: 95, leadership: 90 } }),
    };
    const out = resolveAIRansoms({ forces, officers, cities, playerForceId: 'shu', rng: () => 0.01 });
    expect(out.officers.cap.status).toBe('imprisoned');
    expect(out.cities['shu-cap'].gold).toBe(8000);
  });

  it('pays the player captor when a rival ransoms an officer the player holds', () => {
    const cities = {
      'wei-cap': mkCity({ id: 'wei-cap', ownerForceId: 'wei', gold: 4000 }), // player captor
      'shu-cap': mkCity({ id: 'shu-cap', ownerForceId: 'shu', gold: 8000 }),
    };
    const officers = {
      cap: mkOfficer({ id: 'cap', forceId: null, status: 'imprisoned', locationCityId: 'wei-cap', capturedFromForceId: 'shu', loyalty: 30, stats: { war: 95, leadership: 90 } }),
    };
    const out = resolveAIRansoms({ forces, officers, cities, playerForceId: 'wei', rng: () => 0.01 });
    expect(out.officers.cap.forceId).toBe('shu');
    expect(out.cities['wei-cap'].gold).toBeGreaterThan(4000); // player profited
    expect(out.entries.some((e) => e.kind === 'income')).toBe(true);
  });
});
