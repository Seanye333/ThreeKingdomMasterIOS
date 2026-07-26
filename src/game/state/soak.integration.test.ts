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
/**
 * 長程 — 48 turns only reaches 179 AD with seven forces still standing and two
 * sieges ever seen: the whole late game (consolidation, succession, mass
 * defection, the imperial court, 承平之亂) is never touched by the short soak.
 * Ten years of turns gets there. Kept as a separate case so its cost is visible
 * and the fast one still guards every commit.
 */
const LONG_TURNS = 240;

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
    // 府庫不為負 — every unclamped subtraction in the store sits behind an
    // affordability check, so this is a real contract rather than a hope.
    expect(c.gold, `t${turn} ${c.id} gold ≥ 0`).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(c.population), `t${turn} ${c.id} population finite`).toBe(true);
    if (c.corruption != null) {
      expect(c.corruption, `t${turn} ${c.id} corruption ≥ 0`).toBeGreaterThanOrEqual(0);
      expect(c.corruption, `t${turn} ${c.id} corruption ≤ 100`).toBeLessThanOrEqual(100);
    }
    if (c.ownerForceId) {
      expect(s.forces[c.ownerForceId], `t${turn} ${c.id} owned by a live force`).toBeTruthy();
    }
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
  // ── Armies, cross-referenced ──
  // 一將一營 — a commander leads at most one column. A duplicate here is the
  // exact shape of the 2026-07-26 siege bug (a column counted twice because the
  // invest conversion mutated a shared command object), and nothing asserted it.
  const byCommander = new Map<string, string>();
  for (const a of Object.values(s.armies)) {
    const prev = byCommander.get(a.commanderId);
    expect(prev, `t${turn} 一將一營 — ${a.commanderId} leads both ${prev} and ${a.id}`).toBeUndefined();
    byCommander.set(a.commanderId, a.id);
    // 統帥須在世 — a column led by a corpse keeps marching and fighting.
    const cmdr = s.officers[a.commanderId];
    expect(cmdr, `t${turn} army ${a.id} commander ${a.commanderId} exists`).toBeTruthy();
    expect(cmdr?.status, `t${turn} army ${a.id} commander alive`).not.toBe('dead');
    expect(s.forces[a.forceId], `t${turn} army ${a.id} belongs to a live force`).toBeTruthy();
    // 歸師不圍城 — a column streaming home is not also investing a city.
    if (a.returning) {
      expect(a.besieging ?? null, `t${turn} army ${a.id} returning ⇒ not besieging`).toBeNull();
    }
    // 追擊之的須存在 — a hunter chasing a vanished army never gives up.
    if (a.pursueTargetId) {
      expect(s.armies[a.pursueTargetId], `t${turn} army ${a.id} pursues a real army`).toBeTruthy();
    }
  }

  // ── Officers ──
  for (const o of Object.values(s.officers)) {
    expect(['active', 'idle', 'imprisoned', 'dead', 'unsearched', 'wounded', 'retired'],
      `t${turn} officer ${o.id} status valid`).toContain(o.status);
    // 忠誠有界 — checked nowhere before, though a dozen systems nudge it.
    expect(Number.isFinite(o.loyalty), `t${turn} officer ${o.id} loyalty finite`).toBe(true);
    expect(o.loyalty, `t${turn} officer ${o.id} loyalty ≥ 0`).toBeGreaterThanOrEqual(0);
    expect(o.loyalty, `t${turn} officer ${o.id} loyalty ≤ 100`).toBeLessThanOrEqual(100);
    // 五圍為數 — a NaN stat poisons every multiplier downstream in silence.
    for (const [k, v] of Object.entries(o.stats)) {
      expect(Number.isFinite(v), `t${turn} officer ${o.id} stat ${k} finite`).toBe(true);
    }
    // 死者不仕 — the contract every death path writes (forceId: null).
    if (o.status === 'dead') {
      expect(o.forceId ?? null, `t${turn} dead officer ${o.id} serves nobody`).toBeNull();
    } else if (o.forceId) {
      expect(s.forces[o.forceId], `t${turn} officer ${o.id} serves a live force`).toBeTruthy();
    }
  }

  // ── Forces ──
  for (const f of Object.values(s.forces)) {
    const ruler = s.officers[f.rulerOfficerId];
    if (!ruler) continue;
    // 君不可為屍 — succession runs every season, and a late-tick sweep promotes
    // a survivor after it. The one case left alone is a force whose ENTIRE
    // roster is dead or captive: there is genuinely nobody to raise, and that
    // is a realm out of people rather than a bookkeeping slip.
    const hasSomeone = Object.values(s.officers).some(
      (o) => o.forceId === f.id && o.status !== 'dead' && o.status !== 'imprisoned');
    if (!hasSomeone) continue;
    expect(ruler.status, `t${turn} force ${f.id} ruled by a corpse (${ruler.id})`).not.toBe('dead');
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

  /**
   * 長程浸泡 — ten years, to reach the states the short soak never sees:
   * forces being swallowed, rulers dying and being succeeded, the court filling
   * up, and (if the AI gets there) a realm consolidating toward one banner.
   * Late-game systems are otherwise exercised only by their own unit tests,
   * which cannot produce the cross-system states that break invariants.
   */
  it('grinds 240 turns of the late game without breaking an invariant', () => {
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
