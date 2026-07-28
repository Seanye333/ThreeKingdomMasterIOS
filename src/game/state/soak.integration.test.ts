/**
 * 長跑浸泡 — a passive (spectator-style) campaign ground through 48 turns
 * (~2 years) on the REAL store, asserting state invariants every turn. The
 * seven 2026-07 map batches added many interacting systems (sieges, ambushes,
 * depots, booms, scars, weather, converging battles); this is the test that
 * shakes out cross-system NaNs, negative stocks and stuck states that
 * single-feature tests can't reach.
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
import { assertInvariants, resetTroopTracking } from '../../test/worldInvariants';

const TURNS = 48;
/**
 * 長程 — 48 turns only reaches 179 AD with seven forces still standing and two
 * sieges ever seen: the whole late game (consolidation, succession, mass
 * defection, the imperial court, 承平之亂) is never touched by the short soak.
 * Ten years of turns gets there. Kept as a separate case so its cost is visible
 * and the fast one still guards every commit.
 */
const LONG_TURNS = 240;

describe('長跑浸泡 — 48 旬被動戰役', () => {
  it('grinds 48 turns without breaking a single invariant, and save/load round-trips', () => {
    resetTroopTracking();
    const st = useGameStore;
    st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');

    const siegesSeen = new Set<string>();
    let facilitiesBuilt = 0;
    for (let t = 1; t <= TURNS; t++) {
      st.getState().endSeason();
      assertInvariants(t);
      const s = st.getState();
      for (const a of Object.values(s.armies)) if (a.besieging) siegesSeen.add(`${a.id}→${a.besieging}`);
      facilitiesBuilt = Math.max(facilitiesBuilt,
        Object.values(s.forts).filter((f) => f.facility).length);
      // 存檔輪轉 — every 12 turns the whole state must survive a round-trip.
      if (t % 12 === 0) {
        st.getState().saveSlot('soak-test', `soak t${t}`);
        expect(st.getState().loadSlot('soak-test'), `t${t} save/load round-trip`).toBe(true);
        assertInvariants(t);
      }
    }

    // 軟訊號 — not hard requirements, but log the emergent activity so a
    // silent regression (AI never building, sieges never happening) shows
    // up in the test output for a human eye.
    console.log(`soak: ${TURNS} turns · AI sieges seen: ${siegesSeen.size} · facilities on map: ${facilitiesBuilt}`);
    console.log('soak: final date', st.getState().date, '· living forces:',
      new Set(Object.values(st.getState().cities).map((c) => c.ownerForceId).filter(Boolean)).size);
    expect(true).toBe(true);
  }, 120_000);

  /**
   * 長程浸泡 — ten years, to reach the states the short soak never sees:
   * forces being swallowed, rulers dying and being succeeded, the court filling
   * up, and (if the AI gets there) a realm consolidating toward one banner.
   * Late-game systems are otherwise exercised only by their own unit tests,
   * which cannot produce the cross-system states that break invariants.
   */
  it('grinds 240 turns of the late game without breaking an invariant', () => {
    resetTroopTracking();
    const st = useGameStore;
    st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');

    let ended = 0;
    for (let t = 1; t <= LONG_TURNS; t++) {
      const before = st.getState().victoryStatus;
      st.getState().endSeason();
      assertInvariants(t);
      // Victory/defeat latches the campaign; note where it happened and play
      // on through 承平之亂 so the post-victory pressure is exercised too.
      const after = st.getState().victoryStatus;
      if (before === 'playing' && after !== 'playing') {
        ended = t;
        st.getState().continueAfterVictory();
        assertInvariants(t);
      }
    }

    const s = st.getState();
    const forcesLeft = new Set(
      Object.values(s.cities).map((c) => c.ownerForceId).filter(Boolean)).size;
    const dead = Object.values(s.officers).filter((o) => o.status === 'dead').length;
    console.log(`soak-long: ${LONG_TURNS} turns · final`, s.date,
      `· forces left: ${forcesLeft} · officers dead: ${dead}`,
      ended ? `· campaign latched at t${ended}` : '· never latched');
    // 長程仍須有人在場 — a world that quietly empties itself would pass every
    // per-entity invariant above while being completely broken.
    expect(forcesLeft, 'someone must still hold the map').toBeGreaterThan(0);
    expect(Object.keys(s.cities).length, 'cities must not vanish').toBeGreaterThan(0);
  }, 300_000);
});
