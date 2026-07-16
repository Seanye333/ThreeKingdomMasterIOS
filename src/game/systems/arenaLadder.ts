import type { Officer } from '../types';
import { staticProwess, canDuel } from './duel';

/**
 * 打擂・常駐擂台 — a standing arena champion (擂主) the realm's fighters vie for.
 * Climb it by besting the reigning champion; hold it by beating the challengers who
 * come each season (a 坐鎮擂台 defense). Holding pays a stipend of 威名 / 心得 (feeds
 * §6.10 武學) / gold; a lost defense hands the seat on. A persistent, self-contained
 * ladder — the player triggers each challenge/defense (no season-loop surgery).
 */

export interface ArenaChampion {
  officerId: string;
  /** Year the current holder took the seat. */
  sinceYear: number;
  /** Successful title defenses under the current holder. */
  defenses: number;
}

/** The strongest eligible fighter to seed / supply the arena (excluding one id). */
export function pickArenaChampion(officers: Record<string, Officer>, excludeId?: string): Officer | null {
  let best: Officer | null = null;
  let bestP = -Infinity;
  for (const o of Object.values(officers)) {
    if (o.id === excludeId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned') continue;
    if (!canDuel(o).ok) continue;
    const p = staticProwess(o);
    if (p > bestP) { bestP = p; best = o; }
  }
  return best;
}

/** A random-ish strong challenger for a 坐鎮擂台 defense (deterministic via rng).
 *  Picks from the top slice of eligible fighters so defenses stay meaningful. */
export function pickArenaChallenger(officers: Record<string, Officer>, championId: string, rng: () => number = Math.random): Officer | null {
  const pool = Object.values(officers)
    .filter((o) => o.id !== championId && o.status !== 'dead' && o.status !== 'imprisoned' && canDuel(o).ok)
    .sort((a, b) => staticProwess(b) - staticProwess(a))
    .slice(0, 12); // the dozen fiercest arms in the land
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)];
}

export interface ArenaReward { insight: number; gold: number; renown: number; }

/** The prize for seizing the 擂主 seat — steeper the mightier the ousted champion. */
export function arenaTakeReward(champProwess: number): ArenaReward {
  const scale = Math.max(0, Math.min(1.4, champProwess / 100));
  return {
    insight: Math.round(6 + scale * 6),   // 6..~14 心得
    gold: Math.round(250 + scale * 250),  // 250..~600 金
    renown: 1,                            // a 單挑勝 deed toward 威名
  };
}

/** The season stipend for holding the seat through a successful defense. */
export function arenaHoldStipend(defenses: number): ArenaReward {
  const streak = Math.min(6, defenses); // reward a long reign, capped
  return {
    insight: 3 + Math.round(streak * 0.5),
    gold: 120 + streak * 30,
    renown: defenses > 0 && defenses % 3 === 0 ? 1 : 0, // a deed every 3rd defense
  };
}
