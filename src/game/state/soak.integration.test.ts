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

const TURNS = 48;

function assertInvariants(turn: number): void {
  const s = useGameStore.getState();
  // ── Cities ──
  for (const c of Object.values(s.cities)) {
    expect(Number.isFinite(c.gold), `t${turn} ${c.id} gold finite`).toBe(true);
    expect(Number.isFinite(c.food), `t${turn} ${c.id} food finite`).toBe(true);
    expect(c.troops, `t${turn} ${c.id} troops ≥ 0`).toBeGreaterThanOrEqual(0);
    expect(c.food, `t${turn} ${c.id} food ≥ 0`).toBeGreaterThanOrEqual(0);
    expect(c.population, `t${turn} ${c.id} population > 0`).toBeGreaterThan(0);
    expect(c.loyalty, `t${turn} ${c.id} loyalty ≥ 0`).toBeGreaterThanOrEqual(0);
    expect(c.loyalty, `t${turn} ${c.id} loyalty ≤ 100`).toBeLessThanOrEqual(100);
  }
  // ── Armies ──
  for (const a of Object.values(s.armies)) {
    expect(a.troops, `t${turn} army ${a.id} troops > 0`).toBeGreaterThan(0);
    expect(Number.isFinite(a.x) && Number.isFinite(a.y), `t${turn} army ${a.id} position finite`).toBe(true);
    if (a.food != null) expect(Number.isFinite(a.food), `t${turn} army ${a.id} food finite`).toBe(true);
    // A besieging army must be holding, and its target must exist.
    if (a.besieging) {
      expect(a.holding, `t${turn} army ${a.id} besieging ⇒ holding`).toBe(true);
      expect(s.cities[a.besieging], `t${turn} army ${a.id} besieging a real city`).toBeTruthy();
    }
    // 潰軍 — a rout is always streaming home with a flee anchor, never dug in.
    if (a.routed) {
      expect(a.returning, `t${turn} army ${a.id} routed ⇒ returning`).toBe(true);
      expect(a.holding ?? false, `t${turn} army ${a.id} routed ⇒ not holding`).toBe(false);
      expect(Number.isFinite(a.fleeX ?? 0) && Number.isFinite(a.fleeY ?? 0),
        `t${turn} army ${a.id} flee anchor finite`).toBe(true);
    }
    // 避戰 — only meaningful on the move.
    if (a.evading) expect(a.holding ?? false, `t${turn} army ${a.id} evading ⇒ not holding`).toBe(false);
    // 師老兵疲 — clamped 0..100.
    if (a.fatigue != null) {
      expect(a.fatigue, `t${turn} army ${a.id} fatigue ≥ 0`).toBeGreaterThanOrEqual(0);
      expect(a.fatigue, `t${turn} army ${a.id} fatigue ≤ 100`).toBeLessThanOrEqual(100);
    }
  }
  // ── Officers ──
  for (const o of Object.values(s.officers)) {
    expect(['active', 'idle', 'imprisoned', 'dead', 'unsearched', 'wounded', 'retired'],
      `t${turn} officer ${o.id} status valid`).toContain(o.status);
  }
  // ── World scars / paint keys parse as "col,row" ──
  for (const k of Object.keys(s.worldScars ?? {})) {
    expect(/^-?\d+,-?\d+$/.test(k), `t${turn} scar key ${k}`).toBe(true);
  }
  // ── Forts ──
  for (const f of Object.values(s.forts)) {
    expect(f.hp, `t${turn} fort ${f.id} hp ≥ 0`).toBeGreaterThanOrEqual(0);
  }
}

describe('長跑浸泡 — 48 旬被動戰役', () => {
  it('grinds 48 turns without breaking a single invariant, and save/load round-trips', () => {
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
});
