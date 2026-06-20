/**
 * 演武/論辯冷卻 — a per-officer, per-season cap on friendly in-house sparring and
 * debating. Each officer may take part in a limited number of 1-on-1 spars (and,
 * separately, debates) per season; once spent they are 疲勞 (winded / talked out)
 * until the next season. This stops the 演武場 / 論辯場 from being an infinite XP
 * farm while leaving real-stakes bouts (劇情/踢館/宿敵/群儒) untouched.
 *
 * Reset is lazy: usage is stamped with the season it was logged in, so when the
 * date rolls over the old stamp no longer matches and the count reads as 0 — no
 * season-tick hook needed.
 */

/** How many friendly spars (and, separately, debates) an officer gets per season. */
export const TRAIN_PER_SEASON = 2;

/** One officer's usage: the season it was logged in + how many times that season. */
export type TrainUse = { key: string; count: number };
export type TrainUsage = Record<string, TrainUse>;

/** A stable per-season key. One game turn advances exactly one season, so this
 *  changes every turn — exactly the cadence the player thinks of as "每季". */
export function trainKey(date: { year: number; season: string }): string {
  return `${date.year}-${date.season}`;
}

/** Spars already used by this officer in the current season (0 if last logged
 *  in an earlier season — the lazy reset). */
export function trainsUsed(usage: TrainUsage, id: string, key: string): number {
  const e = usage[id];
  return e && e.key === key ? e.count : 0;
}

/** Spars this officer has left this season (never below 0). */
export function trainsLeft(
  usage: TrainUsage,
  id: string,
  key: string,
  limit: number = TRAIN_PER_SEASON,
): number {
  return Math.max(0, limit - trainsUsed(usage, id, key));
}

/** Whether this officer can still spar this season. */
export function canTrain(
  usage: TrainUsage,
  id: string,
  key: string,
  limit: number = TRAIN_PER_SEASON,
): boolean {
  return trainsLeft(usage, id, key, limit) > 0;
}

/** Log a spar for every officer that took part (both fighters), returning a new
 *  usage map. Re-stamps to the current season on the way (folds in the reset). */
export function recordTrain(usage: TrainUsage, ids: string[], key: string): TrainUsage {
  const next = { ...usage };
  for (const id of ids) {
    next[id] = { key, count: trainsUsed(next, id, key) + 1 };
  }
  return next;
}
