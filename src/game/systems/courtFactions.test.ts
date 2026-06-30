import { describe, it, expect } from 'vitest';
import type { City } from '../types';
import { mkOfficer } from '../../test/factories';
import { deriveCourtFactions, tickCourtPatronage } from './courtFactions';

const mkCity = (id: string, ownerForceId: string, over: Partial<City> = {}): City =>
  ({ id, name: { zh: id, en: id }, ownerForceId, troops: 5000, gold: 1000, food: 4000, loyalty: 60, commerce: 50, population: 100000, ...over } as unknown as City);

describe('deriveCourtFactions', () => {
  it('classifies a pure warrior as 軍方 and a high INT+POL mind as 革新', () => {
    const officers = {
      w: mkOfficer({ id: 'w', forceId: 'me', stats: { war: 90, leadership: 60, intelligence: 40, politics: 30, charisma: 50 } }),
      r: mkOfficer({ id: 'r', forceId: 'me', stats: { war: 40, leadership: 60, intelligence: 90, politics: 80, charisma: 70 } }),
    };
    const out = deriveCourtFactions(officers)['me'] ?? [];
    expect(out.find((f) => f.officerId === 'w')?.faction).toBe('military');
    expect(out.find((f) => f.officerId === 'r')?.faction).toBe('reformer');
  });
});

describe('tickCourtPatronage (§7.4 ①)', () => {
  const officers = () => ({
    w: mkOfficer({ id: 'w', forceId: 'me', loyalty: 60, stats: { war: 90, leadership: 60, intelligence: 40, politics: 30, charisma: 50 } }),
    r: mkOfficer({ id: 'r', forceId: 'me', loyalty: 60, stats: { war: 40, leadership: 60, intelligence: 90, politics: 80, charisma: 70 } }),
  });

  it('favouring 軍方 rallies the warrior and swells the capital guard', () => {
    const cities = { cap: mkCity('cap', 'me', { troops: 5000, population: 200000 }) };
    const out = tickCourtPatronage({ officers: officers(), cities, playerForceId: 'me', capitalCityId: 'cap', patronage: 'military' });
    expect(out.officers['w'].loyalty).toBe(62); // favoured bloc +2
    expect(out.officers['r'].loyalty).toBe(60); // unfavoured unchanged
    expect(out.cities['cap'].troops).toBeGreaterThan(5000); // 禁軍 swelled
  });

  it('favouring 革新 lifts city morale realm-wide', () => {
    const cities = { cap: mkCity('cap', 'me', { loyalty: 60 }), c2: mkCity('c2', 'me', { loyalty: 50 }) };
    const out = tickCourtPatronage({ officers: officers(), cities, playerForceId: 'me', capitalCityId: 'cap', patronage: 'reformer' });
    expect(out.cities['cap'].loyalty).toBe(62);
    expect(out.cities['c2'].loyalty).toBe(52);
    expect(out.officers['r'].loyalty).toBe(62); // reformer bloc rallies
  });

  it('no patronage → no change', () => {
    const cities = { cap: mkCity('cap', 'me') };
    const out = tickCourtPatronage({ officers: officers(), cities, playerForceId: 'me', capitalCityId: 'cap', patronage: null });
    expect(out.officers['w'].loyalty).toBe(60);
    expect(out.cities['cap'].loyalty).toBe(60);
  });
});
