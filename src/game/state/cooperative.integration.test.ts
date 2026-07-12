/**
 * Integration test for 協同施政 (cooperative internal affairs) through the REAL
 * store: issueCommand with assistants → busy bookkeeping → a full endSeason
 * resolution → cancelCommand frees everyone. Exercises the path the unit tests
 * (which only cover the resolveInternalAffairs math) cannot reach.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

// 定數行軍 — the store's endSeason runs the FULL world (AI wars, upset dice,
// weather) on Math.random; a rare bad roll could sack the very city under
// test. Pin a seeded LCG so this bookkeeping test is deterministic.
beforeAll(() => {
  let seed = 42;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  });
});
afterAll(() => vi.restoreAllMocks());

// The store's autosave touches localStorage during endSeason; vitest runs in a
// `node` environment without it, so provide a minimal in-memory stub.
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
import type { City, EntityId, Officer } from '../types';

/** Seat three idle player officers in one player-owned city; return ids. */
function seatThree(): { cityId: EntityId; lead: EntityId; a1: EntityId; a2: EntityId } {
  const st = useGameStore;
  const s = st.getState();
  const pid = s.playerForceId!;
  const city = Object.values(s.cities).find((c) => c.ownerForceId === pid)!;
  // Pick three of the player's officers and station them idle in this city.
  const mine = Object.values(s.officers).filter((o) => o.forceId === pid).slice(0, 3);
  const officers = { ...s.officers };
  for (const o of mine) {
    officers[o.id] = { ...o, locationCityId: city.id, status: 'idle', task: null } as Officer;
  }
  // Ensure the treasury can fund the command.
  const cities = { ...s.cities, [city.id]: { ...city, gold: 5000, agriculture: 40 } as City };
  st.setState({ officers, cities });
  return { cityId: city.id, lead: mine[0].id, a1: mine[1].id, a2: mine[2].id };
}

describe('協同施政 — store integration', () => {
  // Fresh scenario per test so pending commands from one don't bleed into the next.
  beforeEach(() => {
    useGameStore.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  });

  it('issues a cooperative command: assistants marked busy, ONE gold cost, stored on the command', () => {
    const st = useGameStore;
    const { cityId, lead, a1, a2 } = seatThree();
    const goldBefore = st.getState().cities[cityId].gold;

    const r = st.getState().issueCommand(cityId, 'develop-agriculture', lead, [a1, a2]);
    expect(r.ok).toBe(true);

    const s = st.getState();
    // One cost, not three.
    expect(s.cities[cityId].gold).toBe(goldBefore - 300);
    // Command carries the assistants.
    const cmd = s.pendingCommands[lead];
    expect(cmd.type).toBe('develop-agriculture');
    expect((cmd as { assistantOfficerIds?: EntityId[] }).assistantOfficerIds).toEqual([a1, a2]);
    // Lead AND assistants are busy (task set) — so nothing else can grab them.
    expect(s.officers[lead].task).toBe('develop-agriculture');
    expect(s.officers[a1].task).toBe('develop-agriculture');
    expect(s.officers[a2].task).toBe('develop-agriculture');
    // No separate pending command was created for the assistants.
    expect(s.pendingCommands[a1]).toBeUndefined();
    expect(s.pendingCommands[a2]).toBeUndefined();
  });

  it('cancelling the lead command frees the assistants and refunds the one cost', () => {
    const st = useGameStore;
    const { cityId, lead, a1, a2 } = seatThree();
    const goldBefore = st.getState().cities[cityId].gold;
    st.getState().issueCommand(cityId, 'develop-agriculture', lead, [a1, a2]);
    st.getState().cancelCommand(lead);

    const s = st.getState();
    expect(s.pendingCommands[lead]).toBeUndefined();
    expect(s.cities[cityId].gold).toBe(goldBefore); // refunded
    expect(s.officers[lead].task).toBeNull();
    expect(s.officers[a1].task).toBeNull();
    expect(s.officers[a2].task).toBeNull();
  });

  it('resolves end-to-end through endSeason: city develops, report notes the 協同 party', () => {
    const st = useGameStore;
    const { cityId, lead, a1, a2 } = seatThree();
    const agriBefore = st.getState().cities[cityId].agriculture;
    st.getState().issueCommand(cityId, 'develop-agriculture', lead, [a1, a2]);

    st.getState().endSeason();

    const s = st.getState();
    // The command actually applied — agriculture climbed.
    expect(s.cities[cityId].agriculture).toBeGreaterThan(agriBefore);
    // task cleared for everyone after the season.
    expect(s.officers[lead].task).toBeNull();
    expect(s.officers[a1].task).toBeNull();
    // The season report names the cooperative party.
    const hit = (s.lastReport?.entries ?? []).some((e) => (e.textZh ?? '').includes('協同'));
    expect(hit).toBe(true);
  });
});
