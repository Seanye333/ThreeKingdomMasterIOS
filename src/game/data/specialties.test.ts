import { describe, it, expect } from 'vitest';
import {
  specialtyEconomy, specialtyControl, specialtyRealmEffects, roleEffect,
  monopolyTier, canEmbargo, embargoedRolesAgainst, cityRole,
  CITY_SPECIALTY, SPECIALTY_DEV_MAX,
  type Embargo,
} from './specialties';
import type { City } from '../types';

/** Minimal city stub carrying only what the specialty helpers read. */
function city(id: string, ownerForceId: string | null, dev = 0): City {
  return { id, ownerForceId, specialtyDev: dev, ruined: false } as unknown as City;
}

/** Find N city ids that share one SpecialtyId (same strategic role). */
function citiesOfSpecialty(sid: string): string[] {
  return Object.keys(CITY_SPECIALTY).filter((id) => CITY_SPECIALTY[id] === sid);
}

describe('specialty economy + development', () => {
  it('development widens the gold/food premium', () => {
    const brocadeCity = citiesOfSpecialty('brocade')[0]; // 成都, +20% gold
    const base = specialtyEconomy(brocadeCity, 0).goldMul;
    const maxed = specialtyEconomy(brocadeCity, SPECIALTY_DEV_MAX).goldMul;
    expect(base).toBeCloseTo(1.2, 5);
    expect(maxed).toBeGreaterThan(base);
    // +15% of the 0.20 delta per level × 5 → 0.20 × 1.75 = 0.35.
    expect(maxed).toBeCloseTo(1.35, 5);
  });

  it('a city with no specialty has neutral multipliers', () => {
    expect(specialtyEconomy('___nowhere___')).toEqual({ goldMul: 1, foodMul: 1 });
  });
});

describe('specialty control + monopoly', () => {
  it('tallies owned vs world share per role', () => {
    const salt = citiesOfSpecialty('salt'); // role 'rations'
    const cities: Record<string, City> = {};
    salt.forEach((id, i) => { cities[id] = city(id, i === 0 ? 'me' : 'rival'); });
    const ctrl = specialtyControl(cities, 'me');
    expect(ctrl.owned.rations).toBe(1);
    expect(ctrl.share.rations).toBeCloseTo(1 / salt.length, 5);
  });

  it('a dominant share unlocks the monopoly multiplier + embargo', () => {
    const salt = citiesOfSpecialty('salt');
    const cities: Record<string, City> = {};
    salt.forEach((id) => { cities[id] = city(id, 'me'); }); // own them all
    const ctrl = specialtyControl(cities, 'me');
    expect(ctrl.share.rations).toBe(1);
    expect(monopolyTier(1)).toBe(2);
    // effective strength is boosted ×1.6 at full monopoly.
    expect(roleEffect(ctrl, 'rations')).toBeCloseTo(ctrl.strength.rations * 1.6, 5);
    expect(canEmbargo(ctrl, 'rations')).toBe(true);
    const effects = specialtyRealmEffects(ctrl);
    expect(effects.foodUpkeepMul).toBeLessThan(1);            // salt stretches grain
    expect(effects.monopolies.some((m) => m.role === 'rations')).toBe(true);
  });

  it('cannot embargo a good you do not dominate', () => {
    const salt = citiesOfSpecialty('salt');
    const cities: Record<string, City> = {};
    salt.forEach((id, i) => { cities[id] = city(id, i === 0 ? 'me' : 'rival'); });
    const ctrl = specialtyControl(cities, 'me'); // only 1 of N
    expect(canEmbargo(ctrl, 'rations')).toBe(false);
  });

  it('an embargo halves the embargoed force\'s grip on that role', () => {
    const herb = citiesOfSpecialty('herb');
    const cities: Record<string, City> = {};
    herb.forEach((id) => { cities[id] = city(id, 'me'); });
    const free = specialtyControl(cities, 'me').strength.medicine;
    const embargoes: Embargo[] = [{ by: 'rival', against: 'me', role: 'medicine' }];
    const cut = specialtyControl(cities, 'me', embargoedRolesAgainst('me', embargoes)).strength.medicine;
    expect(cut).toBeCloseTo(free * 0.5, 5);
  });

  it('maps cities to their strategic role (and staples to none)', () => {
    expect(cityRole(citiesOfSpecialty('horse')[0])).toBe('warhorse');
    expect(cityRole(citiesOfSpecialty('brocade')[0])).toBe('luxury');
    expect(cityRole(citiesOfSpecialty('rice')[0])).toBeNull();   // staple
  });
});
