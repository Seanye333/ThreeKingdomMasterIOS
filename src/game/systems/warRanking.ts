import type { Officer } from '../types';

/**
 * 武評榜 (warrior ladder) — an ELO rating for single combat. Every interactive
 * 單挑 nudges both fighters' ratings: beat someone above you and you climb fast;
 * lose to someone below and you tumble. A general with no bouts yet is seeded
 * from their 武力 so the board reads sensibly from turn one — the realm's idea
 * of who the 天下第一 is, earned in the arena rather than declared by a stat.
 */

/** Seed rating for an officer who hasn't dueled yet, from their 武力. */
export function seedRating(o: Officer): number {
  return Math.round(1000 + (o.stats.war - 60) * 12);
}

/** The officer's current ladder rating (seeded if they have no record yet). */
export function ratingOf(ratings: Record<string, number>, o: Officer): number {
  return ratings[o.id] ?? seedRating(o);
}

/** Expected score (win probability) of A vs B under the ELO curve. */
export function expectedScore(ra: number, rb: number): number {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

const K = 32;

export interface RatingUpdate { winnerId: string; loserId: string; winnerRating: number; loserRating: number; winnerDelta: number; loserDelta: number; }

/**
 * Apply one bout result to the ladder. `result` is from the first officer's
 * view: 'win' | 'loss' | 'draw'. Returns the new ratings + deltas so a UI can
 * show "+18 / −18". Pure: pass the current rating map, get the changes back.
 */
export function applyBout(
  ratings: Record<string, number>,
  a: Officer,
  b: Officer,
  result: 'win' | 'loss' | 'draw',
): RatingUpdate {
  const ra = ratingOf(ratings, a);
  const rb = ratingOf(ratings, b);
  const sa = result === 'win' ? 1 : result === 'loss' ? 0 : 0.5;
  const ea = expectedScore(ra, rb);
  const deltaA = Math.round(K * (sa - ea));
  const ra2 = Math.max(100, ra + deltaA);
  const rb2 = Math.max(100, rb - deltaA);
  // Frame the return from the winner's side for a clean "+/−" readout.
  if (result === 'loss') {
    return { winnerId: b.id, loserId: a.id, winnerRating: rb2, loserRating: ra2, winnerDelta: -deltaA, loserDelta: deltaA };
  }
  return { winnerId: a.id, loserId: b.id, winnerRating: ra2, loserRating: rb2, winnerDelta: deltaA, loserDelta: -deltaA };
}

/** Rank entries for the board: officers with a real rating, highest first. */
export function ladderBoard(
  ratings: Record<string, number>,
  officers: Record<string, Officer>,
): Array<{ id: string; rating: number; seeded: boolean }> {
  return Object.values(officers)
    .filter((o) => o.status !== 'dead' && o.status !== 'unsearched')
    .map((o) => ({ id: o.id, rating: ratingOf(ratings, o), seeded: ratings[o.id] === undefined }))
    .sort((x, y) => y.rating - x.rating);
}

/** 段位 — a rank tier name from a rating, for a little flavour on the board. */
export function ratingTier(rating: number): { zh: string; en: string } {
  if (rating >= 1320) return { zh: '神將', en: 'Divine' };
  if (rating >= 1220) return { zh: '虎將', en: 'Tiger' };
  if (rating >= 1120) return { zh: '驍將', en: 'Valiant' };
  if (rating >= 1020) return { zh: '健將', en: 'Able' };
  if (rating >= 920) return { zh: '偏將', en: 'Journeyman' };
  return { zh: '末將', en: 'Novice' };
}

/**
 * 鬥將生涯 — the duel prowess a fighter has earned over a career, NOT from raw
 * 武力 but from the arena itself: a high 段位 on the 武評榜 (climbed by beating
 * worthy foes) and a deep tally of 單挑勝 (百戰宿將). The bonus folds into the
 * bout's fixed prowess, so the realm's recognised duellists actually fight better
 * than their stat line — single combat becomes its own ladder of growth.
 */
export function duelCareerBonus(rating: number, duelsWon: number): { prowess: number; tierZh: string; tierEn: string } {
  const tier = rating >= 1320 ? 10 : rating >= 1220 ? 7 : rating >= 1120 ? 5 : rating >= 1020 ? 3 : 0;
  const veterancy = duelsWon >= 30 ? 6 : duelsWon >= 15 ? 4 : duelsWon >= 6 ? 2 : 0;
  const t = ratingTier(rating);
  return { prowess: tier + veterancy, tierZh: t.zh, tierEn: t.en };
}
