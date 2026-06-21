/** Terrain now drives combat from the authored city.terrain field, not name regex. */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import { cityCombatTerrain, terrainDefenderMultiplier } from './combat';

const mk = (over: Partial<City>): City =>
  ({ id: 'x', name: { zh: '城', en: 'City' }, ...over } as unknown as City);

describe('cityCombatTerrain', () => {
  it('prefers the authored terrain field over the name', () => {
    expect(cityCombatTerrain(mk({ terrain: 'mountain', name: { zh: '平', en: 'Plainsville' } }))).toBe('mountain');
    expect(cityCombatTerrain(mk({ terrain: 'water' }))).toBe('river');
    expect(cityCombatTerrain(mk({ terrain: 'pass' }))).toBe('mountain');
    expect(cityCombatTerrain(mk({ terrain: 'plain' }))).toBe('plain');
    expect(cityCombatTerrain(mk({ terrain: 'desert' }))).toBe('plain');
  });
  it('falls back to name inference when terrain is absent', () => {
    expect(cityCombatTerrain(mk({ name: { zh: '漢中', en: 'Hanzhong' } }))).toBe('mountain');
    expect(cityCombatTerrain(mk({ name: { zh: '江陵', en: 'Jiangling on the river' } }))).toBe('river');
    expect(cityCombatTerrain(mk({ name: { zh: '許昌', en: 'Xuchang' } }))).toBe('plain');
  });
});

describe('terrainDefenderMultiplier', () => {
  it('passes and mountains favour the defender; plains and water do not', () => {
    expect(terrainDefenderMultiplier(mk({ terrain: 'pass' }))).toBeGreaterThan(terrainDefenderMultiplier(mk({ terrain: 'mountain' })));
    expect(terrainDefenderMultiplier(mk({ terrain: 'mountain' }))).toBeGreaterThan(1);
    expect(terrainDefenderMultiplier(mk({ terrain: 'plain' }))).toBe(1);
    expect(terrainDefenderMultiplier(mk({ terrain: 'water' }))).toBe(1);
  });
});
