import { describe, it, expect } from 'vitest';
import { buildSpecialtyTradeRoutes, tickSpecialtyTrade, specialtyEntrepotIncome } from './tradeRoutes';
import { buildInitialCities } from '../data/cities';
import { CITY_SPECIALTY, SPECIALTY_CLASS } from '../data/specialties';
import type { City, DiplomaticState, Port } from '../types';

const mkPort = (id: string, linkedCityId: string, connectedPortIds: string[]): Port => ({
  id, name: { zh: id, en: id }, coords: { lon: 0, lat: 0 }, ownerForceId: null,
  hp: 100, maxHp: 100, connectedPortIds, linkedCityId,
});

/** Find two adjacent cities, same owner, carrying CROSS-CLASS specialties (真互通有無). */
function findComplementaryPair(cities: Record<string, ReturnType<typeof buildInitialCities>[number]>) {
  for (const c of Object.values(cities)) {
    const sa = CITY_SPECIALTY[c.id];
    if (!sa) continue;
    for (const adj of c.adjacentCityIds ?? []) {
      const sb = CITY_SPECIALTY[adj];
      if (sb && SPECIALTY_CLASS[sb] !== SPECIALTY_CLASS[sa]) return [c.id, adj] as const;
    }
  }
  return null;
}

const mkCity = (id: string, over: Partial<City> = {}): City => ({
  id, name: { zh: id, en: id }, coords: { x: 0, y: 0 }, adjacentCityIds: [],
  ownerForceId: 'f1', population: 100_000, gold: 0, food: 5000, troops: 2000,
  agriculture: 50, commerce: 50, defense: 50, loyalty: 80, ...over,
});

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

  it('cross-class complementary specialties trade richest, scaled by rarity', () => {
    const cm = Object.fromEntries(buildInitialCities({}).map((c) => [c.id, { ...c, ownerForceId: 'f1' }]));
    const pair = findComplementaryPair(cm);
    expect(pair).not.toBeNull();
    const routes = buildSpecialtyTradeRoutes(cm);
    const key = [pair![0], pair![1]].sort().join('::');
    const route = routes.find((r) => r.id === `spec-${key}`);
    expect(route, 'cross-class pair should have a route').toBeTruthy();
    // Rarity weighting lifts a true 互通有無 route above the 85 cross-class base.
    expect(route!.baseIncome).toBeGreaterThan(85);
  });

  it('互通有無 — cross-class trades richer than same-class, which beats the same good', () => {
    // 馬(war) ⇄ 稻(food) cross-class; 稻(food) ⇄ 麥(food) same-class; 馬 ⇄ 馬 same good.
    const cross = { wuwei: mkCity('wuwei', { adjacentCityIds: ['kuaiji'] }), kuaiji: mkCity('kuaiji') };    // horse ⇄ rice
    const same = { kuaiji: mkCity('kuaiji', { adjacentCityIds: ['xuchang'] }), xuchang: mkCity('xuchang') }; // rice ⇄ wheat (both food)
    const dup = { wuwei: mkCity('wuwei', { adjacentCityIds: ['jincheng'] }), jincheng: mkCity('jincheng') }; // horse ⇄ horse
    const inc = (cm: Record<string, City>) => buildSpecialtyTradeRoutes(cm)[0].baseIncome;
    expect(inc(cross)).toBeGreaterThan(inc(same));
    expect(inc(same)).toBeGreaterThan(inc(dup));
  });

  it('商路風險 — a hostile neighbour and a lawless district throttle the road', () => {
    // Two same-owner specialty cities (互通有無), plus a war-soured neighbour by one end.
    const cm: Record<string, City> = {
      wuwei: mkCity('wuwei', { adjacentCityIds: ['kuaiji', 'enemy'] }), // horse, borders the enemy
      kuaiji: mkCity('kuaiji', { adjacentCityIds: ['wuwei'] }),          // rice
      enemy: mkCity('enemy', { ownerForceId: 'rival' }),
    };
    const peace: DiplomaticState = { relations: {} };
    const war: DiplomaticState = { relations: { [['f1', 'rival'].sort().join('__')]: { forceA: 'f1', forceB: 'rival', score: -60, status: 'neutral' } } };
    const safe = buildSpecialtyTradeRoutes(cm, peace)[0];   // neutral neighbour → no war throttle
    const cut = buildSpecialtyTradeRoutes(cm, war)[0];      // hostile neighbour → throttled
    expect(safe.threatened).toBeFalsy();
    expect(cut.threatened).toBe(true);
    expect(cut.baseIncome).toBeLessThan(safe.baseIncome);

    // 盜匪 — a disaffected (low-loyalty) endpoint also skims the takings.
    const lawless = { ...cm, kuaiji: mkCity('kuaiji', { adjacentCityIds: ['wuwei'], loyalty: 20 }) };
    const banditCut = buildSpecialtyTradeRoutes(lawless, peace)[0];
    expect(banditCut.threatened).toBe(true);
    expect(banditCut.baseIncome).toBeLessThan(safe.baseIncome);
  });

  it('護商 — a 驛傳 depot at an endpoint softens the war/banditry throttle', () => {
    const cm: Record<string, City> = {
      wuwei: mkCity('wuwei', { adjacentCityIds: ['kuaiji', 'enemy'] }),
      kuaiji: mkCity('kuaiji', { adjacentCityIds: ['wuwei'] }),
      enemy: mkCity('enemy', { ownerForceId: 'rival' }),
    };
    const war: DiplomaticState = { relations: { [['f1', 'rival'].sort().join('__')]: { forceA: 'f1', forceB: 'rival', score: -60, status: 'neutral' } } };
    const cut = buildSpecialtyTradeRoutes(cm, war)[0];
    const guarded = buildSpecialtyTradeRoutes(cm, war, { securedCityIds: new Set(['wuwei']) })[0];
    expect(guarded.threatened).toBe(true);              // still contested…
    expect(guarded.baseIncome).toBeGreaterThan(cut.baseIncome); // …but the depot keeps it flowing
  });

  it('水路商路 — sea-linked same-owner ports trade even without a land border', () => {
    const cm: Record<string, City> = {
      wuwei: mkCity('wuwei'),   // horse (war) — no adjacency
      kuaiji: mkCity('kuaiji'), // rice (food)
    };
    const ports: Record<string, Port> = {
      'p-a': mkPort('p-a', 'wuwei', ['p-b']),
      'p-b': mkPort('p-b', 'kuaiji', ['p-a']),
    };
    expect(buildSpecialtyTradeRoutes(cm).length).toBe(0);              // no land border → nothing
    const routes = buildSpecialtyTradeRoutes(cm, undefined, { ports }); // sea link → a route
    expect(routes.length).toBe(1);
    expect(routes[0].baseIncome).toBeGreaterThan(85); // cross-class × rarity × naval premium
  });

  it('萃京分類 — a realm spanning more classes out-earns one of equal count but fewer classes', () => {
    const broad = { wuwei: mkCity('wuwei'), kuaiji: mkCity('kuaiji') };   // horse(war) + rice(food) = 2 classes
    const narrow = { wuwei: mkCity('wuwei'), wancheng: mkCity('wancheng') }; // horse(war) + iron(war) = 1 class
    expect(specialtyEntrepotIncome(broad, 'f1')).toBeGreaterThan(specialtyEntrepotIncome(narrow, 'f1'));
  });

  it('developing a specialty makes its trade route richer', () => {
    const base = Object.fromEntries(buildInitialCities({}).map((c) => [c.id, { ...c, ownerForceId: 'f1' }]));
    const pair = findComplementaryPair(base)!;
    const key = [pair[0], pair[1]].sort().join('::');
    const before = buildSpecialtyTradeRoutes(base).find((r) => r.id === `spec-${key}`)!.baseIncome;
    // Build up one endpoint's 名產發展度 → its route should pay more.
    const dev = { ...base, [pair[0]]: { ...base[pair[0]], specialtyDev: 5 } };
    const after = buildSpecialtyTradeRoutes(dev).find((r) => r.id === `spec-${key}`)!.baseIncome;
    expect(after).toBeGreaterThan(before);
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
