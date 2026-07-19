import type { Officer } from '../types';
import { debateProwess } from './wordWar';
import { debateXiuwei } from './debateArts';

/**
 * 月旦評 (§6.15) — the standing critique of the realm's tongues, after 許劭's
 * famous monthly appraisals: the scholars of the age are ranked by 清議, and one
 * name stands 魁首 (laurel) at the head of the list. Claim it by out-arguing the
 * reigning holder; keep it by answering the challengers who come each season.
 * Holding pays a stipend of 文名 / 文辯心得 (feeds §6.14) / gold; a lost defense
 * hands the laurel on. The 舌戰 mirror of the §6.11 standing arena.
 */

export interface MoonLaurel {
  officerId: string;
  /** Year the current holder took the laurel. */
  sinceYear: number;
  /** Successful defenses of the critique under the current holder. */
  defenses: number;
}

/** Whether an officer can be fielded in the 清議 at all. */
export function canOrate(o: Officer): boolean {
  return o.status !== 'dead' && o.status !== 'imprisoned' && o.status !== 'unsearched';
}

/** 清議分 — how the critique weighs a name: the live tongue, the drilled 修為,
 *  and the weight a famous name carries in any hall. */
export function moonScore(o: Officer): number {
  return Math.round(debateProwess(o) + debateXiuwei(o) / 2 + (o.renown ?? 0) / 10);
}

/** 月旦榜 — the realm's sharpest tongues, keenest first (top n). */
export function moonBoard(officers: Record<string, Officer>, n = 10): Array<{ officer: Officer; score: number }> {
  return Object.values(officers)
    .filter(canOrate)
    .map((officer) => ({ officer, score: moonScore(officer) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/** The keenest eligible tongue to seed / supply the critique (excluding one id). */
export function pickMoonLaurel(officers: Record<string, Officer>, excludeId?: string): Officer | null {
  let best: Officer | null = null;
  let bestP = -Infinity;
  for (const o of Object.values(officers)) {
    if (o.id === excludeId) continue;
    if (!canOrate(o)) continue;
    const p = moonScore(o);
    if (p > bestP) { bestP = p; best = o; }
  }
  return best;
}

/** A random-ish keen challenger for a defense of the critique (deterministic via
 *  rng). Picks from the top slice of eligible tongues so defenses stay meaningful. */
export function pickMoonChallenger(officers: Record<string, Officer>, holderId: string, rng: () => number = Math.random): Officer | null {
  const pool = Object.values(officers)
    .filter((o) => o.id !== holderId && canOrate(o))
    .sort((a, b) => moonScore(b) - moonScore(a))
    .slice(0, 12); // the dozen keenest tongues in the land
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)];
}

export interface MoonReward { insight: number; gold: number; renown: number; }

/** The prize for seizing the 魁首 — steeper the keener the ousted name. */
export function moonTakeReward(holderScore: number): MoonReward {
  const scale = Math.max(0, Math.min(1.4, holderScore / 120));
  return {
    insight: Math.round(6 + scale * 6),   // 6..~14 文辯心得
    gold: Math.round(200 + scale * 200),  // 200..~480 金 (patrons and gifts follow the name)
    renown: 1,                            // a 舌戰勝 deed toward 文名
  };
}

/** The season stipend for holding the laurel through a successful defense. */
export function moonHoldStipend(defenses: number): MoonReward {
  const streak = Math.min(6, defenses);
  return {
    insight: 3 + Math.round(streak * 0.5),
    gold: 100 + streak * 25,
    renown: defenses > 0 && defenses % 3 === 0 ? 1 : 0, // a deed every 3rd defense
  };
}
