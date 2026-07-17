/**
 * Integration tests for the §2.2 store actions: 突破之道 + 突破物資化 (path + iron),
 * 品階硬門檻 (governor/legion grade gates), and 洗點退養 (gear respec refund) —
 * driven through the REAL store.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  const g = globalThis as unknown as { localStorage?: unknown };
  if (!g.localStorage) {
    const mem = new Map<string, string>();
    g.localStorage = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(), key: (i: number) => [...mem.keys()][i] ?? null, get length() { return mem.size; },
    };
  }
});

import { useGameStore } from './store';
import { SCENARIOS } from '../data/scenarios';
import type { City, Officer, OfficerStats } from '../types';

const s = () => useGameStore.getState();
const pid = () => s().playerForceId!;
const ELITE: OfficerStats = { leadership: 95, war: 97, intelligence: 92, politics: 90, charisma: 93 }; // 金牌+
const GREEN: OfficerStats = { leadership: 45, war: 50, intelligence: 42, politics: 44, charisma: 43 }; // 鐵牌

function myCity(patch: Partial<City> = {}) {
  const c = Object.values(s().cities).find((x) => x.ownerForceId === pid())!;
  useGameStore.setState({ cities: { ...s().cities, [c.id]: { ...c, ownerForceId: pid(), gold: 5000, ...patch } } });
  return c.id;
}
function setOfficer(id: string, cityId: string, stats: OfficerStats, patch: Partial<Officer> = {}) {
  const o = s().officers[id];
  useGameStore.setState({ officers: { ...s().officers, [id]: { ...o, forceId: pid(), locationCityId: cityId, status: 'idle', task: null, stats, ...patch } } });
  return id;
}

describe('§2.2 store actions', () => {
  beforeEach(() => {
    useGameStore.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  });

  it('突破之道 + 物資化: needs 鐵, applies the chosen 道', () => {
    const city = myCity({ gold: 5000, iron: 0 });
    const champ = Object.values(s().officers).find((o) => o.forceId === pid())!.id;
    setOfficer(champ, city, ELITE, { xp: 8000, breakthroughs: 0, latentStats: { leadership: 150, war: 150, intelligence: 150, politics: 150, charisma: 150 } });
    // No iron → refused.
    expect(s().breakthroughOfficer(champ, 'governance').reason).toBe('no-iron');
    useGameStore.setState({ cities: { ...s().cities, [city]: { ...s().cities[city], iron: 500 } } });
    const before = { ...s().officers[champ].stats };
    const r = s().breakthroughOfficer(champ, 'governance');
    expect(r.ok).toBe(true);
    expect(s().officers[champ].breakthroughs).toBe(1);
    expect(s().officers[champ].stats.politics).toBeGreaterThan(before.politics); // 治道 grew 政治
    expect(s().cities[city].iron).toBeLessThan(500);                              // 鐵 consumed
  });

  it('品階硬門檻: a 軍團 needs a 金牌+ 都督', () => {
    const city = myCity();
    const green = Object.values(s().officers).find((o) => o.forceId === pid())!.id;
    setOfficer(green, city, GREEN);
    const n0 = (s().legions ?? []).length;
    s().createLegion({ name: '雜號軍', commanderId: green, cityIds: [city], directive: { kind: 'defend' } });
    expect((s().legions ?? []).length).toBe(n0); // rejected — commander too green
    useGameStore.setState({ officers: { ...s().officers, [green]: { ...s().officers[green], stats: ELITE } } });
    s().createLegion({ name: '精銳軍', commanderId: green, cityIds: [city], directive: { kind: 'defend' } });
    expect((s().legions ?? []).length).toBe(n0 + 1); // now a 金牌 commander — allowed
  });

  it('品階硬門檻: a 都/京 needs a 金牌+ 太守', () => {
    const city = myCity({ population: 320000 }); // → 都 tier
    const green = Object.values(s().officers).find((o) => o.forceId === pid())!.id;
    setOfficer(green, city, GREEN);
    s().delegateCity(city, green);
    expect(s().cityDelegations[city]).toBeUndefined(); // rejected
    useGameStore.setState({ officers: { ...s().officers, [green]: { ...s().officers[green], stats: ELITE } } });
    s().delegateCity(city, green);
    expect(s().cityDelegations[city]).toBe(green); // 金牌 governor accepted
  });

  it('洗點退養: strips growth, returns gems to stock, refunds gold', () => {
    const city = myCity({ gold: 1000 });
    const champ = Object.values(s().officers).find((o) => o.forceId === pid())!.id;
    setOfficer(champ, city, ELITE, { equipment: ['green-dragon'] });
    useGameStore.setState({ itemRefinements: { 'green-dragon': 3 }, itemGems: { 'green-dragon': ['gem-war'] }, gemStock: {} });
    const goldBefore = s().cities[city].gold;
    const r = s().resetItemGrowth('green-dragon');
    expect(r.ok).toBe(true);
    expect(s().itemRefinements['green-dragon']).toBeUndefined();          // stripped
    expect(s().gemStock['gem-war']).toBe(1);                              // gem returned
    expect(s().cities[city].gold).toBeGreaterThan(goldBefore);           // gold refunded
  });
});
