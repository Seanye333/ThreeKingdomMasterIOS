import type { EntityId, Officer } from '../types';
import { officerGrade, gradeRank } from './officerGrade';

/**
 * 求賢祭 — the collection game's ceremonial "pull". Once a season, the court
 * stages a festival at the capital: one HIDDEN talent (status 'unsearched')
 * steps into the light, moved to the festival city as a free agent. It
 * REVEALS, never recruits — the 訪賢/舌戰/厚禮 game still has to be played.
 * Odds are honest (the pool is just the world's undiscovered roster) and a
 * pity counter guarantees a gold-or-better reveal after enough dry pulls.
 */

export const FESTIVAL_GOLD_COST = 800;
/** Dry pulls (below gold) before the next reveal is forced gold+. */
export const FESTIVAL_PITY = 3;

export interface FestivalPool {
  all: Officer[];
  goldPlus: Officer[];
  /** Display odds: fraction of the pool at each tier. */
  odds: { goldPlus: number; total: number };
}

/** The festival's candidate pool — every living undiscovered officer. */
export function festivalPool(officers: Record<EntityId, Officer>): FestivalPool {
  const all = Object.values(officers).filter((o) => o.status === 'unsearched');
  const goldPlus = all.filter((o) => gradeRank(officerGrade(o).grade) >= gradeRank('gold'));
  return { all, goldPlus, odds: { goldPlus: all.length > 0 ? goldPlus.length / all.length : 0, total: all.length } };
}

/**
 * 名將殘卷 dropped by a festival reveal. A gold-tier name yields more; a 故人
 * — a name already recorded in the codex (seen or recruited in this or a past
 * campaign) — yields a fragment of remembrance on top. So repeated festivals
 * stay worthwhile even when they surface faces you already know.
 */
export function festivalScrollReward(_drawn: Officer, isGoldPlus: boolean, knownInCodex: boolean): number {
  return 1 + (isGoldPlus ? 2 : 0) + (knownInCodex ? 2 : 0);
}

/** Draw the reveal: pity forces a gold+ pick when one exists. */
export function festivalDraw(
  pool: FestivalPool,
  pity: number,
  rng: () => number,
): Officer | null {
  if (pool.all.length === 0) return null;
  const usePity = pity >= FESTIVAL_PITY && pool.goldPlus.length > 0;
  const from = usePity ? pool.goldPlus : pool.all;
  return from[Math.floor(rng() * from.length)] ?? from[0];
}
