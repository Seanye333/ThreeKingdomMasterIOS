/**
 * 隨季節奏 — the wiring-layer guard for §6.10–§6.18.
 *
 * Every one of those batches added a block to `store.endSeason`. The pure
 * logic in each is unit-tested, but the bug that actually shipped was in the
 * WIRING: seven "per-season" blocks were written without an `if (seasonBoundary)`
 * gate, so they fired every 旬 (~36×/year instead of 4×). No pure test could
 * catch that — the functions were all correct.
 *
 * These tests drive the REAL store and assert on cadence and persistence:
 *   · a per-season system must not fire on a mid-season 旬
 *   · the year-end honours must fire once a year, not once a season
 *   · everything the batches added must survive a save/load round-trip
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

const st = useGameStore;
const boot = () => st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
/** True when the CURRENT date is the last 旬 of a season (what endSeason gates on). */
const atSeasonBoundary = () => {
  const d = st.getState().date;
  return (d.phase ?? 'lower') === 'lower' && [3, 6, 9, 12].includes(d.month ?? 0);
};

describe('隨季節奏 — per-season blocks must not fire every 旬', () => {
  it('endSeason advances by 旬, so a season spans several calls', () => {
    boot();
    const before = st.getState().date;
    st.getState().endSeason();
    const after = st.getState().date;
    // The date moved, but a single call must NOT have skipped a whole season.
    expect(after).not.toEqual(before);
    // Sanity: it takes more than one call to cross a season boundary from a
    // non-boundary date — this is the fact the gating bug got wrong.
    let calls = 0;
    while (!atSeasonBoundary() && calls < 12) { st.getState().endSeason(); calls++; }
    expect(calls, 'a season boundary is reached within a year of 旬').toBeLessThan(12);
  });

  it('學宮養士 drips insight per SEASON, not per 旬', () => {
    boot();
    // The starting map has no seats of learning, so plant one of each in every
    // player city — otherwise this test would pass vacuously whether the block
    // is gated or not (which is exactly how the original bug slipped through).
    const s0 = st.getState();
    const playerCities = Object.values(s0.cities).filter((c) => c.ownerForceId === s0.playerForceId);
    expect(playerCities.length, 'player must hold a city to school anyone').toBeGreaterThan(0);
    st.setState({
      buildings: [
        ...s0.buildings,
        ...playerCities.flatMap((c) => ([
          { id: 'academy' as const, cityId: c.id, level: 3, progress: 0 },
          { id: 'drillground' as const, cityId: c.id, level: 3, progress: 0 },
        ])),
      ],
    });

    const insightTotal = () => Object.values(st.getState().officers)
      .reduce((n, o) => n + (o.martialInsight ?? 0) + (o.debateInsight ?? 0), 0);

    // Walk to a season boundary and cross it — the schools MUST pay out here,
    // which proves the drip is observable at all before we test the silence.
    let guard = 0;
    while (!atSeasonBoundary() && guard++ < 40) st.getState().endSeason();
    const beforeBoundary = insightTotal();
    st.getState().endSeason(); // cross the boundary
    const afterBoundary = insightTotal();
    expect(afterBoundary, '學宮 must actually drip ON a season boundary').toBeGreaterThan(beforeBoundary);

    // Now the mid-season 旬 — the schools must stay completely quiet.
    let midCalls = 0;
    while (!atSeasonBoundary() && midCalls < 2) { st.getState().endSeason(); midCalls++; }
    expect(midCalls, 'test needs at least one mid-season 旬').toBeGreaterThan(0);
    expect(insightTotal(), '學宮 must not drip mid-season').toBe(afterBoundary);
  });

  it('歲末雙榜 fires once a year, not once a season', () => {
    boot();
    const honorTitles = () => (st.getState().annals ?? [])
      .filter((a) => a.titleZh === '歲末武評' || a.titleZh === '歲末月旦').length;
    const startYear = st.getState().date.year;
    // Grind a bit over one full year of 旬 (36 per year).
    for (let i = 0; i < 40; i++) st.getState().endSeason();
    const yearsPassed = st.getState().date.year - startYear;
    const fired = honorTitles();
    expect(yearsPassed, 'a year should have turned').toBeGreaterThanOrEqual(1);
    // At most two entries (武評 + 月旦) per year that turned — never per season.
    expect(fired, '雙榜 must not fire per season').toBeLessThanOrEqual(yearsPassed * 2);
  });

  it('the standing seats change hands at a season pace, not a 旬 pace', () => {
    boot();
    // Seed both seats, then grind a season's worth of mid-season 旬 and assert
    // the churn blocks stayed quiet outside the boundary.
    for (let i = 0; i < 6; i++) st.getState().endSeason();
    let guard = 0;
    while (!atSeasonBoundary() && guard++ < 40) st.getState().endSeason();
    st.getState().endSeason(); // cross it
    const seatAfterBoundary = st.getState().arenaChampion?.officerId;
    const laurelAfterBoundary = st.getState().moonLaurel?.officerId;
    let mid = 0;
    while (!atSeasonBoundary() && mid < 2) { st.getState().endSeason(); mid++; }
    expect(st.getState().arenaChampion?.officerId, '擂主 must not churn mid-season').toBe(seatAfterBoundary);
    expect(st.getState().moonLaurel?.officerId, '魁首 must not churn mid-season').toBe(laurelAfterBoundary);
  });
});

describe('§6.10–§6.18 state survives a save/load round-trip', () => {
  it('carries the seats, ledgers and lineage across a slot save', () => {
    boot();
    // Grind enough to seed the season-driven systems.
    for (let i = 0; i < 40; i++) st.getState().endSeason();

    // Plant a value in every field the batches added that isn't guaranteed to
    // occur naturally within the grind, so the round-trip is actually testing
    // the persistence wiring rather than empty defaults.
    const anyOfficer = Object.values(st.getState().officers)[0];
    const other = Object.values(st.getState().officers)[1];
    st.setState({
      lineage: [{ masterId: anyOfficer.id, pupilId: other.id, art: 'martial', year: 200 }],
      debateRivalries: { [`${anyOfficer.id}|${other.id}`]: {
        aId: anyOfficer.id, bId: other.id, bouts: 3, aWins: 2, bWins: 1, draws: 0, lastYear: 200, lastSeason: 0,
      } },
      lastSalonYear: 199,
      clearedDebateScenarios: ['refute-zhang-zhao'],
    });

    const snap = st.getState();
    const expected = {
      lineage: snap.lineage.length,
      debateRivalries: Object.keys(snap.debateRivalries ?? {}).length,
      lastSalonYear: snap.lastSalonYear,
      clearedDebateScenarios: [...(snap.clearedDebateScenarios ?? [])],
      arenaChampion: snap.arenaChampion?.officerId,
      moonLaurel: snap.moonLaurel?.officerId,
      annals: (snap.annals ?? []).length,
    };

    st.getState().saveSlot('cadence-test', 'round-trip'); // void — the load below is the real assertion
    // Scrub the live state so a failed load can't silently "pass".
    st.setState({ lineage: [], debateRivalries: {}, lastSalonYear: 0, clearedDebateScenarios: [] });
    expect(st.getState().loadSlot('cadence-test')).toBe(true);

    const after = st.getState();
    expect(after.lineage.length, '師承譜系 persisted').toBe(expected.lineage);
    expect(Object.keys(after.debateRivalries ?? {}).length, '文敵簿 persisted').toBe(expected.debateRivalries);
    expect(after.lastSalonYear, '清談大會年份 persisted').toBe(expected.lastSalonYear);
    expect(after.clearedDebateScenarios, '舌戰戰役進度 persisted').toEqual(expected.clearedDebateScenarios);
    expect(after.arenaChampion?.officerId, '擂主 persisted').toBe(expected.arenaChampion);
    expect(after.moonLaurel?.officerId, '月旦魁首 persisted').toBe(expected.moonLaurel);
    expect((after.annals ?? []).length, '史書 persisted').toBe(expected.annals);
  }, 60_000);
});

describe('§6.18 國風 stays consistent with the roster that produces it', () => {
  it('is derived, so it tracks the live roster without any stored field', async () => {
    boot();
    const { realmEthos } = await import('../systems/realmEthos');
    const s = st.getState();
    const pid = s.playerForceId!;
    const before = realmEthos(s.officers, s.deeds ?? {}, pid);

    // Drill every officer of the realm to the peak of the martial art.
    const officers = { ...s.officers };
    for (const o of Object.values(officers)) {
      if (o.forceId === pid) officers[o.id] = { ...o, martialXiuwei: 100 };
    }
    st.setState({ officers });

    const after = realmEthos(st.getState().officers, st.getState().deeds ?? {}, pid);
    expect(after.martial, 'cultivation raises 武風').toBeGreaterThan(before.martial);
    expect(after.lean, 'a court of duellists reads 尚武').toBe('martial');
  });
});
