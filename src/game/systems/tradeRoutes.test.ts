import { describe, it, expect } from 'vitest';
import { buildSpecialtyTradeRoutes, tickSpecialtyTrade } from './tradeRoutes';
import { buildInitialCities } from '../data/cities';
import { CITY_SPECIALTY } from '../data/specialties';

/** Find two adjacent cities, same owner, with DIFFERENT specialties. */
function findComplementaryPair(cities: Record<string, ReturnType<typeof buildInitialCities>[number]>) {
  for (const c of Object.values(cities)) {
    const sa = CITY_SPECIALTY[c.id];
    if (!sa) continue;
    for (const adj of c.adjacentCityIds ?? []) {
      const sb = CITY_SPECIALTY[adj];
      if (sb && sb !== sa) return [c.id, adj] as const;
    }
  }
  return null;
}

describe('specialty trade routes', () => {
  it('builds routes only between same-owner cities where a specialty exists', () => {
    const cm = Object.fromEntries(buildInitialCities({}).map((c) => [c.id, { ...c }]));
    // Neutral world → no owned pairs → no routes.
    expect(buildSpecialtyTradeRoutes(cm).length).toBe(0);
    // Own everything → routes appear where specialties touch.
    for (const id of Object.keys(cm)) cm[id] = { ...cm[id], ownerForceId: 'f1' };
    const routes = buildSpecialtyTradeRoutes(cm);
    expect(routes.length).toBeGreaterThan(0);
    // Every route endpoint is owned and at least one carries a specialty.
    for (const r of routes) {
      expect(cm[r.cityAId].ownerForceId).toBe('f1');
      expect(cm[r.cityBId].ownerForceId).toBe('f1');
      expect(!!CITY_SPECIALTY[r.cityAId] || !!CITY_SPECIALTY[r.cityBId]).toBe(true);
    }
  });

  it('complementary (different) specialties trade richest', () => {
    const cm = Object.fromEntries(buildInitialCities({}).map((c) => [c.id, { ...c, ownerForceId: 'f1' }]));
    const pair = findComplementaryPair(cm);
    expect(pair).not.toBeNull();
    const routes = buildSpecialtyTradeRoutes(cm);
    const key = [pair![0], pair![1]].sort().join('::');
    const route = routes.find((r) => r.id === `spec-${key}`);
    expect(route, 'complementary pair should have a route').toBeTruthy();
    expect(route!.baseIncome).toBe(75); // the complementary premium
  });

  it('tick credits both endpoints and sums the player take', () => {
    const cm = Object.fromEntries(buildInitialCities({}).map((c) => [c.id, { ...c, ownerForceId: 'f1' }]));
    const routes = buildSpecialtyTradeRoutes(cm);
    const before = Object.values(cm).reduce((s, c) => s + c.gold, 0);
    const out = tickSpecialtyTrade({ cities: cm, routes, playerForceId: 'f1' });
    const after = Object.values(out.cities).reduce((s, c) => s + c.gold, 0);
    const expected = routes.reduce((s, r) => s + r.baseIncome * 2, 0);
    expect(after - before).toBe(expected);
    expect(out.entries.some((e) => e.kind === 'income')).toBe(true);
  });

  it('routes to a non-player owner credit no player summary', () => {
    const cm = Object.fromEntries(buildInitialCities({}).map((c) => [c.id, { ...c, ownerForceId: 'ai' }]));
    const routes = buildSpecialtyTradeRoutes(cm);
    const out = tickSpecialtyTrade({ cities: cm, routes, playerForceId: 'me' });
    expect(out.entries.length).toBe(0);
  });
});
