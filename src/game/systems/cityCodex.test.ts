import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cityCodexRecord, loadCityCodex, cityAchievementsNow, cityCodexCount,
  CITY_ACHIEVEMENTS,
} from './cityCodex';
import type { City } from '../types';

function stubStorage() {
  const map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
  });
}
beforeEach(() => { vi.unstubAllGlobals(); stubStorage(); });

const city = (over: Partial<City> & { id: string }): City => ({
  name: { zh: over.id, en: over.id }, ownerForceId: 'f',
  population: 100_000, gold: 0, food: 0, troops: 0,
  agriculture: 50, commerce: 50, defense: 50, loyalty: 50,
  ...over,
} as City);

describe('名城錄 — the atlas of great cities', () => {
  it('a city qualifies for the distinctions it currently meets', () => {
    const jewel = city({ id: 'a', culture: 70 });
    expect(cityAchievementsNow(jewel)).toContain('cultural-jewel');
    expect(cityAchievementsNow(city({ id: 'b' }))).toEqual([]);
    const bastion = city({ id: 'c', veterancy: 90, population: 500_000 });
    expect(cityAchievementsNow(bastion).sort()).toEqual(['battle-worn', 'metropolis'].sort());
  });

  it('records new distinctions once, cross-campaign; re-recording finds nothing fresh', () => {
    const c = city({ id: 'luoyang', culture: 65 });
    const fresh1 = cityCodexRecord([c]);
    expect(fresh1).toEqual([{ cityId: 'luoyang', achId: 'cultural-jewel' }]);
    // Recording the same state again yields nothing new.
    expect(cityCodexRecord([c])).toEqual([]);
    // Add a second distinction later — only the new one is fresh.
    const fresh2 = cityCodexRecord([{ ...c, veterancy: 85 }]);
    expect(fresh2).toEqual([{ cityId: 'luoyang', achId: 'battle-worn' }]);
    const codex = loadCityCodex();
    expect(codex.earned['luoyang'].sort()).toEqual(['battle-worn', 'cultural-jewel'].sort());
    expect(cityCodexCount(codex)).toBe(2);
  });

  it('achievement ids are unique and every one has a predicate', () => {
    const ids = CITY_ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of CITY_ACHIEVEMENTS) expect(typeof a.test).toBe('function');
  });
});
