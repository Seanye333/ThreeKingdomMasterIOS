import { describe, it, expect } from 'vitest';
import type { City, Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';
import { holdFounding, FOUNDING_CITY_LOYALTY, FOUNDING_OFFICER_LOYALTY } from './founding';
import { peerageById } from '../data/peerage';

function mkCity(id: string, over: Partial<City> = {}): City {
  return { id, name: { zh: id, en: id }, ownerForceId: 'wei', population: 200000, gold: 1000, food: 1000, troops: 5000, loyalty: 60, ...over } as City;
}
function mkOfficer(id: string, over: Partial<Officer> = {}): Officer {
  return {
    id, name: { zh: id, en: id }, forceId: 'wei',
    stats: { leadership: 90, war: 95, intelligence: 90, politics: 85, charisma: 80 },
    loyalty: 70, status: 'idle', locationCityId: 'c1', task: null,
    equipment: {} as Officer['equipment'], skills: [], rank: 'soldier', ...over,
  } as Officer;
}
function mkDeeds(id: string, over: Partial<HeroicDeeds> = {}): HeroicDeeds {
  return { officerId: id, killsTroops: 0, duelsWon: 0, captured: 0, citiesTaken: 0, espionageSuccess: 0, civicWorks: 0, battlesWon: 0, battlesLost: 0, trainingsCompleted: 0, childrenSired: 0, ...over };
}

describe('holdFounding', () => {
  it('大赦 lifts every owned city, leaves rivals alone', () => {
    const cities = { mine: mkCity('mine', { loyalty: 60 }), rival: mkCity('rival', { ownerForceId: 'shu', loyalty: 60 }) };
    const r = holdFounding({ forceId: 'wei', cities, officers: {}, deeds: {} });
    expect(r.cities.mine.loyalty).toBe(60 + FOUNDING_CITY_LOYALTY);
    expect(r.cities.rival.loyalty).toBe(60);
  });

  it('恩賞 lifts every officer and 封賞 enfeoffs the deserving (公/王 unlocked)', () => {
    const officers = {
      hero: mkOfficer('hero', { loyalty: 70 }),
      rival: mkOfficer('rival', { forceId: 'shu', loyalty: 70 }),
    };
    const deeds = { hero: mkDeeds('hero', { citiesTaken: 40, duelsWon: 30, battlesWon: 40, killsTroops: 300000 }) };
    const r = holdFounding({ forceId: 'wei', cities: {}, officers, deeds });
    // Our hero got loyalty + a peerage; rival untouched.
    expect(r.officers['hero'].loyalty).toBeGreaterThan(70 + FOUNDING_OFFICER_LOYALTY - 1);
    expect(r.officers['hero'].peerageId).toBeTruthy();
    expect(r.officers['rival'].loyalty).toBe(70);
    // A titan with sovereign unlocked can reach 公/王.
    const granted = r.enfeoffed.find((e) => e.officerId === 'hero');
    expect(granted).toBeTruthy();
    expect(peerageById(granted!.peerageId as never)).not.toBeNull();
    expect(r.mandateGain).toBeGreaterThan(0);
  });
});
