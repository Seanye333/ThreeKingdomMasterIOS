/** 每日挑戰 — locks determinism and best-run recording. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Scenario } from '../types';
import { dailyShareString, loadDailyResults, recentChallengeDays, recordDailyResult, rollDailyChallenge, seededRng, winStreak } from './dailyChallenge';

const scenarios = [
  { id: 's1', forces: [{ id: 'a' }, { id: 'b' }], cities: [] },
  { id: 's2', forces: [{ id: 'c' }], cities: [] },
] as unknown as Scenario[];

describe('rollDailyChallenge', () => {
  it('same date → identical challenge; different date → can differ', () => {
    const x = rollDailyChallenge('2026-06-12', scenarios);
    const y = rollDailyChallenge('2026-06-12', scenarios);
    expect(x).toEqual(y);
    expect(x?.modifiers.map((m) => m.id)).toContain('hard');
    expect(x?.modifiers.map((m) => m.id)).toContain('fog');
    // Determinism of the underlying stream:
    const r1 = seededRng('abc');
    const r2 = seededRng('abc');
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()]);
  });
});

describe('daily results', () => {
  beforeEach(() => {
    const map = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => { map.set(k, v); },
    });
  });

  it('keeps the best run of the day', () => {
    recordDailyResult('2026-06-12', { victory: false, seasons: 30 });
    recordDailyResult('2026-06-12', { victory: true, seasons: 80 });
    recordDailyResult('2026-06-12', { victory: true, seasons: 99 });  // worse — ignored
    recordDailyResult('2026-06-12', { victory: true, seasons: 50 });  // better — kept
    expect(loadDailyResults()['2026-06-12']).toEqual({ victory: true, seasons: 50 });
  });

  it('share string reads like a brag', () => {
    const c = rollDailyChallenge('2026-06-12', scenarios)!;
    expect(dailyShareString(c, '曹操軍', { victory: true, seasons: 42 })).toContain('42旬制霸');
  });
});

describe('挑戰日曆', () => {
  it('counts the win streak, tolerating an unplayed today', () => {
    const today = new Date('2026-06-12T12:00:00Z');
    const results = {
      '2026-06-11': { victory: true, seasons: 40 },
      '2026-06-10': { victory: true, seasons: 50 },
      '2026-06-09': { victory: false, seasons: 10 },
    };
    expect(winStreak(results, today)).toBe(2);
    expect(winStreak({ ...results, '2026-06-12': { victory: true, seasons: 30 } }, today)).toBe(3);
    expect(winStreak({}, today)).toBe(0);
  });

  it('the replay window is exactly the last seven days', () => {
    const days = recentChallengeDays(new Date('2026-06-12T12:00:00Z'));
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-06-12');
    expect(days[6]).toBe('2026-06-06');
  });
});
