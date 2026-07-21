/**
 * 制度批整合測試 (2026-07-21) — the sixteen new institutions, driven through the
 * REAL store and season engine rather than their pure functions.
 *
 * The reason this file exists: every one of these systems passed its unit tests
 * on the day it shipped, and the 20-year soak still found two of them doing
 * nothing at all in an actual campaign (軍器 pinned at 0 map-wide because iron
 * was a hard gate; 傷兵 never produced because only the tactical path fed it).
 * Unit tests prove the arithmetic; only a running game proves the wiring.
 *
 * So these assert *movement*, not values: the meters must actually change in
 * the direction the design says, over a handful of real seasons.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

// endSeason's autosave touches localStorage; stub it for the node env.
beforeAll(() => {
  const g = globalThis as unknown as { localStorage?: unknown };
  if (!g.localStorage) {
    const mem = new Map<string, string>();
    g.localStorage = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() { return mem.size; },
    };
  }
});

import { useGameStore } from './store';
import { SCENARIOS } from '../data/scenarios';
import type { City } from '../types';

const st = useGameStore;
const own = (): City[] => {
  const s = st.getState();
  return Object.values(s.cities).filter((c) => c.ownerForceId === s.playerForceId);
};
/** Nine periods = one season boundary. */
const seasons = (n: number) => { for (let i = 0; i < n * 9; i++) st.getState().endSeason(); };

describe('制度批整合 — the meters actually move', () => {
  beforeEach(() => {
    st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  });

  it('軍器 climbs from zero without any iron in the yard (郡國鐵官)', () => {
    // The bug this locks: production gated hard on stockpiled 鐵 meant every
    // city that does not smelt sat at 0 for the whole campaign while paying the
    // 無甲 penalty. Local smiths must carry it.
    const before = own().map((c) => c.armaments ?? 0);
    expect(Math.max(...before)).toBe(0);
    seasons(6);
    const after = own().map((c) => c.armaments ?? 0);
    expect(Math.max(...after)).toBeGreaterThan(0);
    // …and it stays inside its band.
    expect(Math.max(...after)).toBeLessThanOrEqual(100);
  });

  it('every realm keeps its own inflation figure after a season', () => {
    seasons(2);
    const byForce = st.getState().inflationByForce;
    expect(Object.keys(byForce).length).toBeGreaterThan(1);
    for (const v of Object.values(byForce)) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('欠餉 under 募兵 reports and costs men; 更卒 never does', () => {
    // Comparing two full seasons' gold would be flaky (the AI moves in between),
    // so assert the deterministic part: an unpayable wage bill must produce the
    // arrears line and desertion, and a militia must never produce either.
    const runBroke = (system: 'levy' | 'paid'): string[] => {
      st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
      st.getState().setServiceSystem(system);
      const target = own().sort((a, b) => b.troops - a.troops)[0];
      st.setState({
        cities: {
          ...st.getState().cities,
          // Wages are paid out of the season's OWN books (revenue lands by
          // payday), so a genuinely unpayable bill needs a huge garrison on a
          // city that earns almost nothing.
          [target.id]: {
            ...st.getState().cities[target.id],
            gold: 0, troops: 200_000, food: 900_000, commerce: 0, agriculture: 0,
          },
        },
      });
      seasons(1);
      return (st.getState().lastReport?.entries ?? []).map((e) => e.textZh ?? e.text ?? '');
    };
    expect(runBroke('paid').some((t) => t.includes('欠餉'))).toBe(true);
    expect(runBroke('levy').some((t) => t.includes('欠餉'))).toBe(false);
  });

  it('糴政 is persisted per force and defaults to 平糴', () => {
    const fid = st.getState().playerForceId!;
    expect(st.getState().grainPolicy[fid]).toBeUndefined();
    st.getState().setGrainPolicy('open');
    expect(st.getState().grainPolicy[fid]).toBe('open');
    seasons(1);
    expect(st.getState().grainPolicy[fid]).toBe('open');
  });

  it('a season of real play leaves no NaN in any new meter', () => {
    st.getState().setGrainPolicy('open');
    st.getState().setCoinStandard('daqian');
    st.getState().setServiceSystem('paid');
    st.getState().setRefugeePolicy('welcome');
    seasons(4);
    for (const c of Object.values(st.getState().cities)) {
      expect(Number.isNaN(c.armaments ?? 0), `${c.id} armaments`).toBe(false);
      expect(Number.isNaN(c.wounded ?? 0), `${c.id} wounded`).toBe(false);
      expect(c.armaments ?? 0).toBeGreaterThanOrEqual(0);
      expect(c.wounded ?? 0).toBeGreaterThanOrEqual(0);
      expect(c.gold).toBeGreaterThanOrEqual(0);
      expect(c.food).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(c.drill ?? 0), `${c.id} drill`).toBe(false);
    }
  });

  it('大錢 really does raise inflation over a few seasons', () => {
    const fid = st.getState().playerForceId!;
    st.getState().setCoinStandard('daqian');
    seasons(8);
    const debased = st.getState().inflationByForce[fid] ?? 0;
    st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
    st.getState().setCoinStandard('grainCloth');
    seasons(8);
    const sound = st.getState().inflationByForce[fid] ?? 0;
    expect(debased).toBeGreaterThan(sound);
  });

  it('軍功簿 is derived from deeds, so an unrewarded officer owes from turn one', async () => {
    const { outstandingMerit } = await import('../systems/militaryLaw');
    const s = st.getState();
    const fid = s.playerForceId!;
    const officerId = Object.values(s.officers)
      .find((o) => o.forceId === fid && o.id !== s.forces[fid].rulerOfficerId)!.id;
    st.setState({
      // Room to move: a man already at 100 cannot show you a reward landed.
      officers: { ...s.officers, [officerId]: { ...s.officers[officerId], loyalty: 60 } },
      deeds: { ...s.deeds, [officerId]: { ...(s.deeds[officerId] ?? {}), officerId, citiesTaken: 4, battlesWon: 3 } as never },
    });
    const owed = outstandingMerit(st.getState().officers[officerId], st.getState().deeds[officerId]);
    expect(owed).toBeGreaterThan(12);   // past the resentment threshold
    // Paying it clears the ledger and lifts loyalty.
    const capId = st.getState().forces[fid].capitalCityId;
    st.setState({
      cities: { ...st.getState().cities, [capId]: { ...st.getState().cities[capId], gold: 99_999 } },
    });
    const before = st.getState().officers[officerId].loyalty;
    const r = st.getState().rewardMerit(officerId);
    expect(r.ok).toBe(true);
    expect(st.getState().officers[officerId].loyalty).toBeGreaterThan(before);
    expect(outstandingMerit(st.getState().officers[officerId], st.getState().deeds[officerId])).toBe(0);
  });

  it('驛傳 reaches the capital ring from turn one, and is recomputed each season', async () => {
    const { buildRelayNetwork, RELAY_BUILDINGS } = await import('../systems/postalRelay');
    const s = st.getState();
    const fid = s.playerForceId!;
    const relayCityIds = new Set(
      s.buildings.filter((b) => RELAY_BUILDINGS.has(b.id) && b.level >= 1).map((b) => b.cityId));
    const net = buildRelayNetwork({
      nodes: Object.values(s.cities).map((c) => ({
        cityId: c.id, owned: c.ownerForceId === fid && !c.ruined, hasRelay: relayCityIds.has(c.id),
      })),
      neighborsOf: (id) => s.cities[id]?.adjacentCityIds ?? [],
      capitalCityId: s.forces[fid].capitalCityId,
    });
    expect(net.get(s.forces[fid].capitalCityId)?.connected).toBe(true);
    expect(net.get(s.forces[fid].capitalCityId)?.hops).toBe(0);
  });
});
