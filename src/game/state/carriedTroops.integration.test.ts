/**
 * 兵隨軍行 — the carried-troops convention: marching men leave the source
 * city's books at issue (調虎離山成立), return on disband, and never
 * double-count on arrival. Legacy (unmarked) marches keep the old flow.
 */
import { describe, it, expect, beforeAll } from 'vitest';

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
import { resolveSeason } from '../systems/resolution';
import { buildInitialCities } from '../data/cities';

describe('兵隨軍行 — troops leave the books at issue', () => {
  it('issueMarch deducts at once; cancelCommand walks the men back on', () => {
    const st = useGameStore;
    st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
    const s = st.getState();
    const pid = s.playerForceId!;
    // Any owned city with an owned neighbour and an idle officer at home.
    const src = Object.values(s.cities).find((c) =>
      c.ownerForceId === pid && c.troops >= 3000 && c.gold >= 200
      && c.adjacentCityIds.some((n) => s.cities[n]?.ownerForceId === pid)
      && Object.values(s.officers).some((o) => o.forceId === pid && o.locationCityId === c.id && !o.task && (o.status === 'idle' || o.status === 'active')));
    expect(src).toBeTruthy();
    const dstId = src!.adjacentCityIds.find((n) => s.cities[n]?.ownerForceId === pid)!;
    const officer = Object.values(s.officers).find((o) =>
      o.forceId === pid && o.locationCityId === src!.id && !o.task && (o.status === 'idle' || o.status === 'active'))!;
    const before = src!.troops;
    const r = st.getState().issueMarch(src!.id, dstId, officer.id, 1000);
    expect(r.ok).toBe(true);
    expect(st.getState().cities[src!.id].troops).toBe(before - 1000); // 空城真空
    const cmd = st.getState().pendingCommands[officer.id] as { carried?: boolean };
    expect(cmd.carried).toBe(true);
    st.getState().cancelCommand(officer.id);
    expect(st.getState().cities[src!.id].troops).toBe(before); // 罷兵退帳
  });
});

describe('兵隨軍行 — arrival folds carried men in without double-counting', () => {
  it('a carried transfer adds to the target and leaves the source alone', () => {
    const list = buildInitialCities({});
    const cities = Object.fromEntries(list.map((c) => [c.id, { ...c }]));
    cities['luoyang'] = { ...cities['luoyang'], ownerForceId: 'me', troops: 3800, food: 90000, gold: 5000 };
    cities['chengdu'] = { ...cities['chengdu'], ownerForceId: 'me', troops: 2000, food: 90000, gold: 5000 };
    const out = resolveSeason({
      date: { year: 200, season: 'spring', month: 1, phase: 'upper' },
      cities,
      officers: {
        mover: {
          id: 'mover', name: { zh: 'mover', en: 'mover' }, skills: [], traits: [], equipment: [],
          stats: { war: 80, leadership: 75, intelligence: 60, politics: 50, charisma: 50 },
          forceId: 'me', locationCityId: 'luoyang', status: 'idle', task: null,
        },
      },
      forces: {},
      pendingCommands: {
        mover: {
          type: 'march', cityId: 'luoyang', targetCityId: 'chengdu', officerId: 'mover',
          troops: 1500, totalSeasons: 1, seasonsRemaining: 1, carried: true,
        },
      },
      diplomacy: { relations: {} },
      runtimeBonds: [], lostItems: [],
      playerForceId: 'me',
      rng: () => 0.5,
    } as never);
    expect(out.cities['chengdu'].troops).toBe(3500);  // 2000 + carried 1500
    expect(out.cities['luoyang'].troops).toBe(3800);  // untouched — men left at issue
  });
});
