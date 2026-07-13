/**
 * 存檔遷移回歸 — the 2026-07 map batches added several save fields
 * (worldScars / spottedAmbushIds / streetEncounters / mechanicHints, plus
 * ambush/besieging flags on march commands). This locks two guarantees:
 *   ① a NEW save round-trips those fields;
 *   ② an OLD save (fields absent) loads with safe defaults and the game
 *     still resolves a full season on top of it.
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

const SLOT_KEY = 'tkm-slot-compat-test';

describe('存檔遷移 — new map-batch fields', () => {
  beforeEach(() => {
    useGameStore.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  });

  it('round-trips the new fields through save → load', () => {
    const st = useGameStore;
    st.setState({
      worldScars: { '10,10': { kind: 'scorched', t: 750 } },
      spottedAmbushIds: ['spy-target'],
      streetEncounters: { luoyang: 744 },
      mechanicHints: { besiege: true },
    });
    st.getState().saveSlot('compat-test', '遷移測試');
    const raw = localStorage.getItem(SLOT_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.worldScars['10,10'].kind).toBe('scorched');
    expect(parsed.spottedAmbushIds).toEqual(['spy-target']);
    expect(parsed.streetEncounters.luoyang).toBe(744);
    expect(parsed.mechanicHints.besiege).toBe(true);

    // Clean state, then load — fields come back.
    st.setState({ worldScars: {}, spottedAmbushIds: [], streetEncounters: {}, mechanicHints: {} });
    expect(st.getState().loadSlot('compat-test')).toBe(true);
    const s = st.getState();
    expect(s.worldScars['10,10']?.kind).toBe('scorched');
    expect(s.spottedAmbushIds).toEqual(['spy-target']);
    expect(s.streetEncounters.luoyang).toBe(744);
    expect(s.mechanicHints.besiege).toBe(true);
  });

  it('round-trips 潰軍/避戰/疲勞 march fields through save → load', () => {
    const st = useGameStore;
    const s0 = st.getState();
    const cityId = Object.keys(s0.cities)[0];
    st.setState({
      pendingCommands: {
        'compat-runner': {
          type: 'march', cityId, targetCityId: cityId, officerId: 'compat-runner',
          troops: 900, routed: true, returning: true, fleeX: 400, fleeY: 300,
          totalSeasons: 2, seasonsRemaining: 2, fatigue: 37,
        },
        'compat-sneak': {
          type: 'march', cityId, targetCityId: cityId, officerId: 'compat-sneak',
          troops: 1200, evading: true, totalSeasons: 3, seasonsRemaining: 3,
        },
      } as never,
    });
    st.getState().saveSlot('compat-test', '潰軍欄位');
    const parsed = JSON.parse(localStorage.getItem(SLOT_KEY)!);
    expect(parsed.pendingCommands['compat-runner'].routed).toBe(true);
    expect(parsed.pendingCommands['compat-runner'].fleeX).toBe(400);
    expect(parsed.pendingCommands['compat-runner'].fatigue).toBe(37);
    expect(parsed.pendingCommands['compat-sneak'].evading).toBe(true);

    st.setState({ pendingCommands: {} });
    expect(st.getState().loadSlot('compat-test')).toBe(true);
    const cmds = st.getState().pendingCommands as Record<string, Record<string, unknown>>;
    expect(cmds['compat-runner'].routed).toBe(true);
    expect(cmds['compat-runner'].fleeY).toBe(300);
    expect(cmds['compat-sneak'].evading).toBe(true);
  });

  it('an OLD save (fields absent) loads with defaults and still resolves a season', () => {
    const st = useGameStore;
    st.getState().saveSlot('compat-test', '舊檔模擬');
    const raw = localStorage.getItem(SLOT_KEY)!;
    const parsed = JSON.parse(raw);
    // Simulate a pre-batch save: strip every new field.
    delete parsed.worldScars;
    delete parsed.spottedAmbushIds;
    delete parsed.streetEncounters;
    delete parsed.mechanicHints;
    delete parsed.pendingConquestPolicy;
    for (const cmd of Object.values(parsed.pendingCommands ?? {}) as Array<Record<string, unknown>>) {
      delete cmd.ambush;
      delete cmd.besieging;
      delete cmd.routed;
      delete cmd.fleeX;
      delete cmd.fleeY;
      delete cmd.evading;
      delete cmd.fatigue;
    }
    localStorage.setItem(SLOT_KEY, JSON.stringify(parsed));

    expect(st.getState().loadSlot('compat-test')).toBe(true);
    const s = st.getState();
    expect(s.worldScars).toEqual({});
    expect(s.spottedAmbushIds).toEqual([]);
    expect(s.streetEncounters).toEqual({});
    expect(s.mechanicHints).toEqual({});
    expect(s.pendingConquestPolicy).toBeNull();

    // New-mechanic actions degrade gracefully on the migrated state.
    expect(st.getState().setArmyAmbush('no-such-army').ok).toBe(false);
    expect(st.getState().besiegeCity('no-such-army').ok).toBe(false);
    expect(st.getState().burnBridge('no-such-army').ok).toBe(false);
    expect(st.getState().setArmyEvade('no-such-army').ok).toBe(false);

    // And a full season resolves without touching the missing fields.
    st.getState().endSeason();
    expect(st.getState().date).toBeTruthy();
  });

  it('round-trips the 2026-07 card-batch fields; an old save defaults them', () => {
    const st = useGameStore;
    const officerId = Object.keys(st.getState().officers)[0];
    const o = st.getState().officers[officerId];
    st.setState({
      itemAwakenings: { 'green-dragon': ['edge', 'breaker'] },
      destroyedItems: ['gu-ding'],
      bounties: [{ officerId, kind: 'capture', gold: 1000, renown: 15, expiresYear: 200 }],
      festivalSeason: '190|spring',
      festivalPity: 2,
      itemInscriptions: { 'green-dragon': { name: '冷豔鋸', motto: '刀下不斬無名' } },
      setRewardsClaimed: ['five-tigers'],
      powerBoardPrev: { [officerId]: 3 },
      officers: {
        ...st.getState().officers,
        [officerId]: { ...o, stars: 4, skillLevels: { brave: 2 }, medals: ['medal-duelist'], marrowCleansed: true },
      },
    });
    st.getState().saveSlot('compat-test', '卡牌批欄位');
    const parsed = JSON.parse(localStorage.getItem(SLOT_KEY)!);
    expect(parsed.itemAwakenings['green-dragon']).toEqual(['edge', 'breaker']);
    expect(parsed.itemInscriptions['green-dragon'].name).toBe('冷豔鋸');
    expect(parsed.officers[officerId].stars).toBe(4);
    expect(parsed.officers[officerId].medals).toEqual(['medal-duelist']);

    st.setState({ itemAwakenings: {}, destroyedItems: [], bounties: [], festivalPity: 0, itemInscriptions: {}, setRewardsClaimed: [], powerBoardPrev: {} });
    expect(st.getState().loadSlot('compat-test')).toBe(true);
    const s = st.getState();
    expect(s.itemAwakenings['green-dragon']).toEqual(['edge', 'breaker']);
    expect(s.destroyedItems).toEqual(['gu-ding']);
    expect(s.bounties[0]?.gold).toBe(1000);
    expect(s.festivalPity).toBe(2);
    expect(s.setRewardsClaimed).toEqual(['five-tigers']);
    expect(s.officers[officerId].skillLevels?.brave).toBe(2);
    expect(s.officers[officerId].marrowCleansed).toBe(true);

    // 舊檔 — strip every card-batch field; defaults land, a season resolves.
    const old = JSON.parse(localStorage.getItem(SLOT_KEY)!);
    delete old.itemAwakenings;
    delete old.destroyedItems;
    delete old.bounties;
    delete old.festivalSeason;
    delete old.festivalPity;
    delete old.itemInscriptions;
    delete old.setRewardsClaimed;
    delete old.powerBoardPrev;
    for (const oo of Object.values(old.officers ?? {}) as Array<Record<string, unknown>>) {
      delete oo.stars;
      delete oo.skillLevels;
      delete oo.medals;
      delete oo.marrowCleansed;
    }
    localStorage.setItem(SLOT_KEY, JSON.stringify(old));
    expect(st.getState().loadSlot('compat-test')).toBe(true);
    const s2 = st.getState();
    expect(s2.itemAwakenings).toEqual({});
    expect(s2.destroyedItems).toEqual([]);
    expect(s2.bounties).toEqual([]);
    expect(s2.festivalPity).toBe(0);
    expect(s2.itemInscriptions).toEqual({});
    expect(s2.setRewardsClaimed).toEqual([]);
    st.getState().endSeason();
    expect(st.getState().date).toBeTruthy();
  });
});
