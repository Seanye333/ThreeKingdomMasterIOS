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
  | 'ally-battle'       // 盟軍來會 — an ally's column joined your battle
  | 'rout-annihilated'  // 追亡逐北 — you hunted a fleeing rout down to the last man
  // 2026-07 event-chain choices — targetId is a flag key the PLAYER's own
  // resolveEventChoice set (AI walking the historical path does not count):
  | 'event-choice'
  // 2026-07 card-game batch — cross-campaign 圖鑑 collection milestones,
  // checked against the codex ledgers at season commit (see achievements.ts
  // checkCodexAchievements). 'codex-collection' compares the recruited count
  // to `threshold`; 'codex-set' fires when the famous set `targetId`
  // completes ('any' = first completed set, 'all' = every set).
  | 'codex-collection'
  | 'codex-set'
  // 2026-07 duel-deepening batch (instant, no targetId):
  | 'peace-duel'    // 一騎定和 — won a 決鬥定和 (duel of peace)
  | 'war-god'       // 武神 — an officer's 武學修為 reached 100
  | 'arena-reign'   // 擂台不倒 — held the arena through 3 straight defenses
  | 'field-melee'   // 群英並擊 — won a field team melee
  // 2026-07 debate-deepening batch (instant, no targetId):
  | 'debate-sage'   // 辯聖 — an officer's 文辯修為 reached 100
  | 'moon-reign'    // 清議領袖 — held the 月旦評 laurel through 3 straight defenses
  | 'persuade-city' // 三寸之舌 — argued an enemy city's gates open (§6.16)
  | 'refute-demand'  // 據理折牒 — argued a foreign ultimatum into withdrawal
  // 2026-07 civic batch (§1.11–§1.14, §3.6) — instant, no targetId:
  | 'clear-docket'   // 訟簡刑清 — a great city's docket worked down to nothing
  | 'amnesty'        // 大赦天下 — proclaimed a general pardon
  | 'registers-whole'// 編戶齊民 — the realm's registers restored to near-honest
  | 'break-hoard'    // 平準抑兼 — broke open a cornered grain market
  | 'open-exam'      // 唯才是舉 — adopted 開科取士
  | 'immortal-verse' // 千古絕唱 — composed a poem of the first rank
  | 'shrine-raised'  // 立祠祭故 — raised a shrine to a fallen officer
  | 'sea-lord';      // 樓船水師 — fought and won a river battle as a master fleet

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
