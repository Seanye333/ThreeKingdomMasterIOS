import type { BilingualName, EntityId } from './common';

/**
 * Cross-campaign achievement — persists across games in a separate
 * localStorage entry. Players unlock these by completing famous events,
 * recruiting key officers, or hitting milestone counts.
 *
 * Triggered server-side at relevant moments (battle resolution, recruit
 * success, ending fired, event applied).
 */
export type AchievementTriggerKind =
  | 'recruit-officer'
  | 'defeat-officer'
  | 'duel-won-vs'
  | 'capture-city'
  | 'fire-event'
  | 'reach-ending'
  | 'cumulative-kills'
  | 'cumulative-cities'
  | 'cumulative-recruits'
  | 'cumulative-battles-won'
  | 'reach-imperial-rank'
  | 'learn-skill'
  // 2026-07 map-batch feats (instant, no targetId):
  | 'starve-out-city'   // 兵不血刃 — a besieged city opened its gates
  | 'ambush-victory'    // 十面埋伏 — a laid ambush sprang and won
  | 'burning-camps'     // 火燒連營 — 3+ fieldworks torched in one won battle
  | 'boom-stall'        // 鐵鎖橫江 — your chain-boom stalled a hostile fleet
  | 'beacon-relay'      // 烽火傳京 — a frontier alarm relayed to the capital
  | 'bridge-burned'     // 據水斷橋 — you torched a crossing on the march
  | 'ally-battle';      // 盟軍來會 — an ally's column joined your battle

export interface AchievementTrigger {
  kind: AchievementTriggerKind;
  /** Most variants reference a specific officer / city / event / skill id. */
  targetId?: EntityId;
  /** For cumulative achievements, the threshold count. */
  threshold?: number;
}

export interface Achievement {
  id: EntityId;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  /** Visual tier — sets the gold/silver/bronze glow on the badge. */
  tier: 'bronze' | 'silver' | 'gold' | 'legendary';
  trigger: AchievementTrigger;
  /** Unlocked rewards (cosmetic only) — list of force colors or portrait
   *  archetypes that become available in custom officer creation. */
  unlockReward?: { type: 'color' | 'archetype' | 'flair'; value: string };
}

/**
 * Persistent counter state used by cumulative achievements. Lives in its
 * own localStorage entry (`tkm-achievements`) so it survives starting a
 * new game.
 */
export interface AchievementProgress {
  /** Map of achievement id → completed timestamp (epoch ms). */
  completed: Record<EntityId, number>;
  /** Running counters across all games. */
  counters: {
    kills: number;
    citiesTaken: number;
    recruits: number;
    battlesWon: number;
    duelsWon: number;
    /** Each Career-mode death increments this. */
    careerRuns: number;
  };
}

export function createEmptyAchievementProgress(): AchievementProgress {
  return {
    completed: {},
    counters: {
      kills: 0,
      citiesTaken: 0,
      recruits: 0,
      battlesWon: 0,
      duelsWon: 0,
      careerRuns: 0,
    },
  };
}
