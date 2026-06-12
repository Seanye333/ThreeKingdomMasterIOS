/**
 * 每日挑戰 — one fixed puzzle a day, the same for everyone.
 *
 * The date seeds a deterministic roll: scenario, force, and a handicap
 * set (hard difficulty and forced fog always; the third twist varies).
 * Results live locally per date; the share string lets players compare
 * runs without any backend — same seed, same start, fair race.
 */
import type { Scenario } from '../types';

export interface DailyChallenge {
  dateStr: string;
  scenarioId: string;
  forceId: string;
  /** Human-readable handicaps; the launcher applies them. */
  modifiers: Array<{ id: 'fog' | 'hard' | 'romance' | 'poverty'; zh: string; en: string }>;
}

export interface DailyResult {
  victory: boolean;
  seasons: number;
}

const RESULTS_KEY = 'tkm-daily-v1';

export function dailySeedString(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** mulberry32 over a string hash — tiny, deterministic, good enough. */
export function seededRng(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollDailyChallenge(dateStr: string, scenarios: Scenario[]): DailyChallenge | null {
  if (scenarios.length === 0) return null;
  const rng = seededRng(dateStr);
  const scenario = scenarios[Math.floor(rng() * scenarios.length)];
  const playable = scenario.forces;
  const force = playable[Math.floor(rng() * playable.length)];
  if (!force) return null;
  const third = rng() < 0.5
    ? { id: 'romance' as const, zh: '演義劇本(史實事件必發)', en: 'Romance events always fire' }
    : { id: 'poverty' as const, zh: '草鞋起家(開局金半)', en: 'Start with half gold' };
  return {
    dateStr,
    scenarioId: scenario.id,
    forceId: force.id,
    modifiers: [
      { id: 'hard', zh: '困難難度', en: 'Hard difficulty' },
      { id: 'fog', zh: '戰爭迷霧強制開', en: 'Fog of war forced on' },
      third,
    ],
  };
}

export function loadDailyResults(): Record<string, DailyResult> {
  try {
    return JSON.parse(localStorage.getItem(RESULTS_KEY) ?? '{}') as Record<string, DailyResult>;
  } catch {
    return {};
  }
}

export function recordDailyResult(dateStr: string, result: DailyResult): void {
  try {
    const all = loadDailyResults();
    // Keep the best run of the day (a victory beats any defeat; fewer
    // seasons beats more).
    const prev = all[dateStr];
    if (prev && prev.victory && (!result.victory || prev.seasons <= result.seasons)) return;
    all[dateStr] = result;
    localStorage.setItem(RESULTS_KEY, JSON.stringify(all));
  } catch { /* quota */ }
}

export function dailyShareString(c: DailyChallenge, forceNameZh: string, r: DailyResult): string {
  return `三國志大師 每日挑戰 ${c.dateStr} · ${forceNameZh} · ${r.victory ? `${r.seasons}旬制霸 🏆` : '敗北 ☠'}`;
}

/** 連勝 — consecutive victorious days ending today (or yesterday, if
 *  today hasn't been won yet). */
export function winStreak(results: Record<string, DailyResult>, today = new Date()): number {
  let streak = 0;
  const day = new Date(today);
  // Today may still be unplayed — a pending day doesn't break the streak.
  if (!results[dailySeedString(day)]?.victory) day.setDate(day.getDate() - 1);
  for (;;) {
    const key = dailySeedString(day);
    if (!results[key]?.victory) break;
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

/** The replayable window — today and the six days before it. */
export function recentChallengeDays(today = new Date()): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(dailySeedString(d));
  }
  return out;
}
