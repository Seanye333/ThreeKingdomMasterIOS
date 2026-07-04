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

    // And a full season resolves without touching the missing fields.
    st.getState().endSeason();
    expect(st.getState().date).toBeTruthy();
  });
});
