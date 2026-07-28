/**
 * 一局須可重播 — the end-to-end proof for the campaign rng seam.
 *
 * The unit tests in campaignRng.test.ts show the generator is deterministic.
 * That is necessary but not sufficient: the season resolver used to roll bare
 * randomness in 67 places AND hand bare randomness to 41 subsystems that each
 * had a perfectly good `rng` parameter sitting unused. Either of those alone
 * is enough to make a run unrepeatable.
 *
 * So this test does the only thing that actually settles the question: boots
 * the same scenario twice, resolves the same ticks, and compares the worlds.
 * If any roll anywhere under endSeason still escapes the seam, these diverge.
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

const TURNS = 72; // 一旬一次,72 旬 = 8 季

/**
 * The parts of the world worth comparing: everything the season resolver
 * touches, reduced to a comparable shape. Deliberately excludes the report
 * (prose, and rebuilt each turn) and keeps to hard numbers, so a failure
 * points at a diverged ROLL rather than a diverged string.
 */
function worldFingerprint(): string {
  const s = useGameStore.getState();
  const cities = Object.values(s.cities)
    .map((c) => [c.id, c.ownerForceId ?? '-', c.gold, c.food, c.troops, c.population,
      c.loyalty, c.agriculture, c.commerce, c.defense, c.corruption ?? 0].join(':'))
    .sort();
  const officers = Object.values(s.officers)
    .map((o) => [o.id, o.forceId ?? '-', o.status, o.loyalty, o.locationCityId ?? '-',
      o.stats.war, o.stats.leadership, o.stats.intelligence].join(':'))
    .sort();
  const forces = Object.values(s.forces)
    .map((f) => [f.id, f.gold ?? 0, f.capitalCityId ?? '-'].join(':'))
    .sort();
  return JSON.stringify({
    date: s.date, cities, officers, forces,
    annals: (s.annals ?? []).length,
    chronicle: (s.chronicle ?? []).length,
  });
}

/**
 * One booted campaign, captured before any season runs.
 *
 * `loadScenario` itself draws bare randomness (generated fictional officers,
 * starting weather, force colours) and is deliberately NOT seeded — it happens
 * once, outside the loop this seam is about. So both runs start from the SAME
 * captured world; otherwise the comparison would be testing scenario setup,
 * not the resolver.
 */
function bootOnce(): string {
  const st = useGameStore;
  st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  return JSON.stringify(st.getState());
}

/** Restore the captured world, force a seed, and grind `turns` seasons. */
function replay(snapshot: string, seed: number, turns: number): string {
  const st = useGameStore;
  st.setState({ ...JSON.parse(snapshot), rngSeed: seed });
  for (let i = 0; i < turns; i++) st.getState().endSeason();
  return worldFingerprint();
}

describe('戰役重播 — 同種子同世界', () => {
  it('two runs from the same seed resolve to an identical world', () => {
    const world = bootOnce();
    const a = replay(world, 20260727, TURNS);
    const b = replay(world, 20260727, TURNS);
    expect(a).toBe(b);
  });

  it('a different seed produces a different world', () => {
    // Guards the opposite failure: a seam that "works" because nothing is
    // random any more would pass the test above and fail this one.
    const world = bootOnce();
    const a = replay(world, 1111, TURNS);
    const b = replay(world, 9999, TURNS);
    expect(a).not.toBe(b);
  });

  it('the seed rides in the save so a reload keeps the stream', () => {
    const st = useGameStore;
    st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
    const seed = st.getState().rngSeed;
    expect(seed, 'loadScenario must mint a campaign seed').toBeTypeOf('number');
    expect(seed).not.toBe(0);
  });

  /**
   * 裸隨機零容忍 — the fingerprint comparison above proves the seasons this
   * run happened to exercise are seeded. This one is stricter and much better
   * at catching a REGRESSION: it intercepts Math.random itself and asserts
   * nobody under endSeason reaches for it at all.
   *
   * This is the check that actually found the last four leaks — resolveSeason
   * and planAITurn were never handed an rng despite both exposing the seam,
   * and seasonBouts called resolveDuel/resolveWordWar/tickAIPersuasions bare.
   * A fingerprint test can miss those (a rare event may not fire in the ticks a run happens to cover);
   * the interceptor cannot.
   */
  it('nothing under endSeason reaches for bare Math.random', () => {
    const st = useGameStore;
    st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
    const orig = Math.random;
    const callers = new Map<string, number>();
    Math.random = () => {
      const frame = (new Error().stack ?? '').split('\n').slice(2, 6)
        .map((l) => l.trim())
        .find((l) => l.includes('/src/game/'));
      if (frame) {
        const at = frame.replace(/.*\/src\/game\//, '').replace(/\?.*/, '');
        callers.set(at, (callers.get(at) ?? 0) + 1);
      }
      return orig();
    };
    try {
      for (let i = 0; i < TURNS; i++) st.getState().endSeason();
    } finally {
      Math.random = orig;
    }
    const leaks = [...callers.entries()].map(([k, n]) => `${k} ×${n}`);
    expect(leaks, `these still bypass the campaign rng:\n${leaks.join('\n')}`).toEqual([]);
  });
});
