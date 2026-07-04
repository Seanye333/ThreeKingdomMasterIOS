import type {
  AchievementProgress,
  AchievementTrigger,
} from '../types';
import { ACHIEVEMENTS, ACHIEVEMENTS_BY_ID } from '../data/achievements';
import { createEmptyAchievementProgress } from '../types';

const STORAGE_KEY = 'tkm-achievements';

/**
 * Load achievement progress from localStorage. Returns a fresh empty
 * progress if missing or corrupt.
 */
export function loadAchievementProgress(): AchievementProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyAchievementProgress();
    const parsed = JSON.parse(raw) as AchievementProgress;
    // Migrate missing counter fields if loading an older shape.
    const defaults = createEmptyAchievementProgress();
    return {
      completed: parsed.completed ?? {},
      counters: { ...defaults.counters, ...(parsed.counters ?? {}) },
    };
  } catch {
    return createEmptyAchievementProgress();
  }
}

export function saveAchievementProgress(p: AchievementProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Mark an achievement complete if not already. Returns whether it newly
 * unlocked (for UI toast purposes).
 */
export function unlock(
  progress: AchievementProgress,
  achId: string,
): { progress: AchievementProgress; newlyUnlocked: boolean } {
  if (progress.completed[achId]) return { progress, newlyUnlocked: false };
  const next: AchievementProgress = {
    ...progress,
    completed: { ...progress.completed, [achId]: Date.now() },
  };
  return { progress: next, newlyUnlocked: true };
}

/**
 * Process a single trigger event. Bumps cumulative counters and checks
 * every achievement whose trigger matches. Returns newly unlocked IDs.
 */
export function processTrigger(
  progress: AchievementProgress,
  trigger: AchievementTrigger,
): { progress: AchievementProgress; newlyUnlocked: string[] } {
  let p = progress;
  const newly: string[] = [];

  // Bump cumulative counters when relevant.
  if (trigger.kind === 'cumulative-kills' && trigger.threshold) {
    p = { ...p, counters: { ...p.counters, kills: p.counters.kills + trigger.threshold } };
  } else if (trigger.kind === 'cumulative-cities' && trigger.threshold) {
    p = { ...p, counters: { ...p.counters, citiesTaken: p.counters.citiesTaken + trigger.threshold } };
  } else if (trigger.kind === 'cumulative-recruits' && trigger.threshold) {
    p = { ...p, counters: { ...p.counters, recruits: p.counters.recruits + trigger.threshold } };
  } else if (trigger.kind === 'cumulative-battles-won' && trigger.threshold) {
    p = { ...p, counters: { ...p.counters, battlesWon: p.counters.battlesWon + trigger.threshold } };
  }

  // Check all achievements that share trigger.kind.
  for (const ach of ACHIEVEMENTS) {
    if (ach.trigger.kind !== trigger.kind) continue;
    if (p.completed[ach.id]) continue;
    const match =
      // Discrete: targetId must match.
      ((['recruit-officer', 'defeat-officer', 'duel-won-vs', 'capture-city',
         'fire-event', 'reach-ending', 'reach-imperial-rank', 'learn-skill',
         'starve-out-city', 'ambush-victory', 'burning-camps'] as const)
        .includes(ach.trigger.kind as never) &&
        ach.trigger.targetId === trigger.targetId) ||
      // Cumulative: counter ≥ threshold.
      (ach.trigger.kind === 'cumulative-kills' &&
        p.counters.kills >= (ach.trigger.threshold ?? Infinity)) ||
      (ach.trigger.kind === 'cumulative-cities' &&
        p.counters.citiesTaken >= (ach.trigger.threshold ?? Infinity)) ||
      (ach.trigger.kind === 'cumulative-recruits' &&
        p.counters.recruits >= (ach.trigger.threshold ?? Infinity)) ||
      (ach.trigger.kind === 'cumulative-battles-won' &&
        p.counters.battlesWon >= (ach.trigger.threshold ?? Infinity));
    if (match) {
      const r = unlock(p, ach.id);
      p = r.progress;
      if (r.newlyUnlocked) newly.push(ach.id);
    }
  }
  return { progress: p, newlyUnlocked: newly };
}

/** Convenience: bump a raw counter value (used after a battle, not threshold). */
export function bumpCounters(
  progress: AchievementProgress,
  delta: Partial<AchievementProgress['counters']>,
): AchievementProgress {
  return {
    ...progress,
    counters: {
      ...progress.counters,
      kills: progress.counters.kills + (delta.kills ?? 0),
      citiesTaken: progress.counters.citiesTaken + (delta.citiesTaken ?? 0),
      recruits: progress.counters.recruits + (delta.recruits ?? 0),
      battlesWon: progress.counters.battlesWon + (delta.battlesWon ?? 0),
      duelsWon: progress.counters.duelsWon + (delta.duelsWon ?? 0),
      careerRuns: progress.counters.careerRuns + (delta.careerRuns ?? 0),
    },
  };
}

/**
 * After bumping counters, check whether cumulative thresholds just passed
 * and unlock the corresponding achievements.
 */
export function checkCumulativeThresholds(
  progress: AchievementProgress,
): { progress: AchievementProgress; newlyUnlocked: string[] } {
  let p = progress;
  const newly: string[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (p.completed[ach.id]) continue;
    const t = ach.trigger;
    const matched =
      (t.kind === 'cumulative-kills'        && p.counters.kills        >= (t.threshold ?? Infinity)) ||
      (t.kind === 'cumulative-cities'       && p.counters.citiesTaken  >= (t.threshold ?? Infinity)) ||
      (t.kind === 'cumulative-recruits'     && p.counters.recruits     >= (t.threshold ?? Infinity)) ||
      (t.kind === 'cumulative-battles-won'  && p.counters.battlesWon   >= (t.threshold ?? Infinity));
    if (matched) {
      const r = unlock(p, ach.id);
      p = r.progress;
      if (r.newlyUnlocked) newly.push(ach.id);
    }
  }
  return { progress: p, newlyUnlocked: newly };
}

export { ACHIEVEMENTS, ACHIEVEMENTS_BY_ID };
