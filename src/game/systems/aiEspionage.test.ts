import { describe, it, expect } from 'vitest';
import type { City, Force, Officer } from '../types';
import { resolveAIEspionage } from './aiEspionage';

const off = (id: string, forceId: string | null, over: Partial<Officer> = {}): Officer => ({
  id, name: { zh: id, en: id }, forceId, status: 'idle',
  stats: { war: 50, leadership: 50, intelligence: 80, politics: 50, charisma: 50 },
  loyalty: 80, locationCityId: `${forceId}-c`, task: null,
  ...over,
} as unknown as Officer);

const force = (id: string, over: Partial<Force> = {}): Force => ({
  id, name: { zh: id, en: id }, rulerOfficerId: `${id}-ruler`, capitalCityId: `${id}-c`,
  color: '#fff', isPlayer: id === 'me', personality: 'opportunist', ...over,
} as Force);

const city = (id: string, owner: string, over: Partial<City> = {}): City =>
  ({ id, name: { zh: id, en: id }, ownerForceId: owner, troops: 5000, gold: 2000, food: 6000, loyalty: 70, population: 100000, adjacentCityIds: [], ...over } as City);

describe('resolveAIEspionage (§7.3 ①)', () => {
  const world = () => ({
    forces: { me: force('me'), wei: force('wei', { personality: 'tyrant' }) } as Record<string, Force>,
    officers: {
      'me-ruler': off('me-ruler', 'me'),
      'p1': off('p1', 'me', { loyalty: 40, locationCityId: 'me-c' }), // a wavering player officer
      'wei-ruler': off('wei-ruler', 'wei', { stats: { war: 50, leadership: 50, intelligence: 92, politics: 50, charisma: 50 } as Officer['stats'] }),
    } as Record<string, Officer>,
    cities: { 'me-c': city('me-c', 'me', { food: 9000, loyalty: 65 }), 'wei-c': city('wei-c', 'wei', { gold: 5000 }) },
  });

  it('a capable, bellicose AI moves against the player and produces a report', () => {
    const w = world();
    const out = resolveAIEspionage({
      forces: w.forces, officers: w.officers, cities: w.cities, embeddedSpies: [],
      playerForceId: 'me', date: { year: 200, season: 'spring' }, rng: () => 0.01,
    });
    // Something happened to the player (an entry, or a planted spy, or a state change).
    expect(out.entries.length + out.newSpies.length).toBeGreaterThan(0);
  });

  it('a recent 肅諜 sweep (counterIntelActive) blunts enemy ops', () => {
    const w = world();
    // With max counter-intel and a guaranteed roll, the ops mostly fail (entries note failure, no defection).
    const out = resolveAIEspionage({
      forces: w.forces, officers: w.officers, cities: w.cities, embeddedSpies: [],
      playerForceId: 'me', counterIntelActive: true, date: { year: 200, season: 'spring' }, rng: () => 0.5,
    });
    // The wavering officer p1 must not have defected away from the player under heavy counter-intel.
    expect(out.officers['p1'].forceId).toBe('me');
  });

  it('no player force → no-op', () => {
    const w = world();
    const out = resolveAIEspionage({ forces: w.forces, officers: w.officers, cities: w.cities, embeddedSpies: [], playerForceId: null, date: { year: 200, season: 'spring' }, rng: () => 0.01 });
    expect(out.entries).toHaveLength(0);
    expect(out.newSpies).toHaveLength(0);
  });

  it('§7.3-deep AI 流言 — the output carries a rumorSeeds array, always on the player\'s own cities', () => {
    const w = world();
    const out = resolveAIEspionage({
      forces: w.forces, officers: w.officers, cities: w.cities, embeddedSpies: [],
      playerForceId: 'me', date: { year: 200, season: 'spring' }, rng: () => 0.05,
    });
    expect(Array.isArray(out.rumorSeeds)).toBe(true);
    for (const s of out.rumorSeeds) expect(w.cities[s.cityId]?.ownerForceId).toBe('me');
  });
});
