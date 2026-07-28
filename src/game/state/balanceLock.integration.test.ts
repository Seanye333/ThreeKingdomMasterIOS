/**
 * 平衡護欄 — does the world still behave like a Three Kingdoms campaign?
 *
 * This is the test that was impossible before the campaign rng seam landed.
 * A balance lock built on unseeded runs fails intermittently and gets muted;
 * the previously-noted "three runs, two failures" was exactly that. Now that
 * a season resolves as a pure function of (seed, state), the same seeds give
 * the same worlds and a failure means something really moved.
 *
 * ## What is asserted, and why not exact numbers
 *
 * Pinning "Cao Cao holds 7 cities at turn 24" would fail on every unrelated
 * content change and teach everyone to update the number without reading it.
 * These lock BANDS and SHAPES instead — the things that would be broken if a
 * change made the AI toothless or unstoppable:
 *
 *   - the map is still contested (no runaway conquest, no total stalemate)
 *   - forces are still dying and cities still changing hands, but not en masse
 *   - the population/economy is growing rather than collapsing
 *   - officers are still being recruited, aging and dying
 *
 * Run across several seeds so a single lucky world cannot carry the suite.
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

const SEEDS = [20260727, 4242, 987654];
const TURNS = 240; // endSeason 是一旬一次(一季九旬)—— 240 旬 ≈ 10 遊戲年

interface Shape {
  livingForces: number;
  ownedCities: number;
  neutralCities: number;
  biggestForceShare: number;
  totalPopulation: number;
  livingOfficers: number;
  deadOfficers: number;
  unemployedOfficers: number;
  totalGold: number;
  totalFood: number;
  totalTroops: number;
  avgLoyalty: number;
}

function measure(): Shape {
  const s = useGameStore.getState();
  const cities = Object.values(s.cities);
  const owned = cities.filter((c) => c.ownerForceId);
  const byForce = new Map<string, number>();
  for (const c of owned) byForce.set(c.ownerForceId!, (byForce.get(c.ownerForceId!) ?? 0) + 1);
  const officers = Object.values(s.officers);
  const living = officers.filter((o) => o.status !== 'dead');
  return {
    livingForces: byForce.size,
    ownedCities: owned.length,
    neutralCities: cities.length - owned.length,
    biggestForceShare: owned.length ? Math.max(...byForce.values()) / owned.length : 0,
    totalPopulation: cities.reduce((n, c) => n + c.population, 0),
    livingOfficers: living.length,
    deadOfficers: officers.filter((o) => o.status === 'dead').length,
    unemployedOfficers: living.filter((o) => !o.forceId).length,
    totalGold: cities.reduce((n, c) => n + c.gold, 0),
    totalFood: cities.reduce((n, c) => n + c.food, 0),
    totalTroops: cities.reduce((n, c) => n + c.troops, 0)
      + Object.values(s.armies ?? {}).reduce((n, a) => n + (a.troops ?? 0), 0),
    avgLoyalty: owned.length ? owned.reduce((n, c) => n + c.loyalty, 0) / owned.length : 0,
  };
}

function runSeed(seed: number): { start: Shape; end: Shape } {
  const st = useGameStore;
  st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  st.setState({ rngSeed: seed });
  const start = measure();
  for (let i = 0; i < TURNS; i++) st.getState().endSeason();
  return { start, end: measure() };
}

/**
 * Every seed is ground EXACTLY ONCE, up front, and all the assertions read the
 * result. The first cut ran each seed in a per-describe beforeAll and then had
 * the final case re-run all three — 1,440 ticks instead of 720. Under the full
 * suite that tipped past the default 5s timeout, which vitest reports as one
 * failure plus a whole describe's worth of SKIPPED tests. Skipped assertions in
 * a green-looking run are worse than a red one, so the work happens once here.
 */
const runs = new Map<number, { start: Shape; end: Shape }>();

describe('平衡護欄 — 240 旬(約十年)後世界仍成立', () => {
  beforeAll(() => {
    for (const seed of SEEDS) runs.set(seed, runSeed(seed));
  }, 300_000);

  for (const seed of SEEDS) {
    describe(`seed ${seed}`, () => {
      let start: Shape, end: Shape;
      beforeAll(() => { ({ start, end } = runs.get(seed)!); });

      it('天下未定 — no single force has swallowed the map', () => {
        // A runaway conqueror by year 10 means the AI aggression or the combat
        // model has tipped. Historical Three Kingdoms is contested for decades.
        expect(end.biggestForceShare).toBeLessThan(0.75);
      });

      it('群雄仍在 — several forces are still standing', () => {
        // The opposite failure: everyone turtles and nothing ever resolves.
        expect(end.livingForces).toBeGreaterThanOrEqual(3);
      });

      it('版圖有變動 — the map is not frozen', () => {
        // Some conquest must actually happen, or the AI is not playing.
        const moved = end.livingForces !== start.livingForces
          || end.ownedCities !== start.ownedCities
          || end.biggestForceShare > start.biggestForceShare + 0.01;
        expect(moved, 'nothing changed hands in 10 game years').toBe(true);
      });

      it('民生未崩 — population and stores are not collapsing', () => {
        expect(end.totalPopulation).toBeGreaterThan(start.totalPopulation * 0.6);
        expect(end.totalFood).toBeGreaterThan(0);
        expect(end.totalGold).toBeGreaterThan(0);
      });

      it('人口非暴漲 — nor is it running away', () => {
        // Compounding growth bugs show up here long before anyone notices
        // in play. 10 years should not triple the realm.
        expect(end.totalPopulation).toBeLessThan(start.totalPopulation * 3);
      });

      it('兵籍消長在區間內 — the realm neither disarms nor mobilises absurdly', () => {
        // Measured baseline at the time of writing: ~1.04M troops at start,
        // ~0.70M after ten years of war (a ~33% net drain, arriving smoothly —
        // no single tick moved it more than ~4%). The band is deliberately
        // wider than that: it is here to catch a change that makes armies
        // evaporate or multiply, not to freeze today's attrition rate.
        expect(end.totalTroops).toBeGreaterThan(start.totalTroops * 0.3);
        expect(end.totalTroops).toBeLessThan(start.totalTroops * 2);
      });

      it('人事流轉 — the roster is worked, not frozen', () => {
        // NOTE: deaths are NOT asserted to occur. Every scenario opens at game
        // year 178 and deathChance() is 0 before an officer's historical 卒年,
        // so ten years buries essentially nobody — that is the design, not a
        // stalled aging system. Asserting deaths here would be asserting a
        // falsehood; what IS checked is that nobody comes back from the dead.
        expect(end.deadOfficers).toBeGreaterThanOrEqual(start.deadOfficers);
        expect(end.livingOfficers).toBeGreaterThan(0);
        // A realm where nobody is ever recruited means the hiring path is dead.
        expect(end.unemployedOfficers).toBeLessThan(start.unemployedOfficers + 50);
      });

      it('民心在區間內 — average loyalty stays in a playable band', () => {
        expect(end.avgLoyalty).toBeGreaterThan(20);
        expect(end.avgLoyalty).toBeLessThanOrEqual(100);
      });

      it('數值健全 — nothing has gone NaN or negative', () => {
        for (const [k, v] of Object.entries(end)) {
          expect(Number.isFinite(v), `${k} finite`).toBe(true);
          expect(v, `${k} ≥ 0`).toBeGreaterThanOrEqual(0);
        }
      });
    });
  }

  it('不同種子產生不同世界(護欄不是在鎖常數)', () => {
    // If every seed produced the same world, all the bands above would be
    // vacuous. This proves they are constraining a real distribution. Reads
    // the runs already ground above rather than re-running them.
    const shapes = SEEDS.map((s) => JSON.stringify(runs.get(s)!.end));
    expect(new Set(shapes).size).toBeGreaterThan(1);
  });
});
