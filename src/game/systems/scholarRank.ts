import type { Officer } from '../types';
import { debateProwess } from './wordWar';
import { debateXiuwei } from './debateArts';
import { ladderBoard, ratingTier } from './warRanking';

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

// ─── 出將入相 — a name on BOTH boards of the age ─────────────────────────────
// The 武評榜 crowns the realm's arms, the 月旦榜 its tongues; the rare officer
// ranked high on BOTH carries the 出將入相 laurel — fit to lead in the field
// and to stand at court. Their presence steadies whichever city they garrison
// (a small loyalty aura each season), for any realm — the talent, not the flag.
export const DUAL_LUMINARY_TOP = 8;
export const DUAL_LUMINARY_LOYALTY = 2; // per-season loyalty aura on their city

/** Officers ranked in the top slice of BOTH the 武評榜 and the 月旦榜. */
export function dualLuminaries(officers: Record<string, Officer>, warRatings: Record<string, number>): Set<string> {
  const arms = new Set(ladderBoard(warRatings, officers).slice(0, DUAL_LUMINARY_TOP).map((r) => r.id));
  return new Set(moonBoard(officers, DUAL_LUMINARY_TOP).filter((r) => arms.has(r.officer.id)).map((r) => r.officer.id));
}

// ─── 歲末雙榜 — the year's honour roll of arms and tongues ────────────────────
// At year's end the court publishes both boards' top names: the 武評榜 crowns
// the year's fiercest arms, the 月旦榜 its keenest tongues. A place on either
// roll is a real feather (a little 威名), and the whole thing is written into
// the annals — a yearly beat that makes the two ladders feel like living
// institutions rather than menu screens.

export interface HonorEntry { officerId: string; rank: number; scoreZh: string; scoreEn: string; }
export interface AnnualHonors { year: number; arms: HonorEntry[]; tongues: HonorEntry[]; }

/** The year-end top-n of both boards (default 3), with a short tier gloss. */
export function annualHonors(officers: Record<string, Officer>, warRatings: Record<string, number>, year: number, top = 3): AnnualHonors {
  const arms = ladderBoard(warRatings, officers).slice(0, top).map((r, i) => {
    const tier = ratingTier(r.rating);
    return { officerId: r.id, rank: i + 1, scoreZh: `${tier.zh}·評 ${Math.round(r.rating)}`, scoreEn: `${tier.en} · ${Math.round(r.rating)}` };
  });
  const tongues = moonBoard(officers, top).map((r, i) => ({
    officerId: r.officer.id, rank: i + 1, scoreZh: `清議 ${r.score}`, scoreEn: `score ${r.score}`,
  }));
  return { year, arms, tongues };
}

/** 褒賞 — the renown a year-end placing confers (1st/2nd/3rd). */
export function honorRenown(rank: number): number {
  return rank === 1 ? 3 : rank === 2 ? 2 : 1;
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
