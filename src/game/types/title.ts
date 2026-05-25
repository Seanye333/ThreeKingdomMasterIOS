import type { BilingualName, EntityId } from './common';

/**
 * Military ranks: an ordered ladder. Higher rank gives stat caps, loyalty
 * boost, and unlocks command of larger armies. One officer carries exactly
 * one military rank at a time.
 */
export type MilitaryRankId =
  | 'soldier'        // 兵卒
  | 'captain'        // 都尉
  | 'colonel'        // 校尉
  | 'lt-general'     // 偏将軍
  | 'general'        // 将軍
  | 'grand-general'  // 大将軍
  | 'chancellor';    // 丞相 (rank-equivalent, top tier)

export interface MilitaryRank {
  id: MilitaryRankId;
  name: BilingualName;
  /** Sort order; higher = more senior. */
  tier: number;
  /** Bonus added to officer loyalty toward their force per season (capped). */
  loyaltyBonus: number;
  /** Multiplier on max troops a single commander can lead in march. */
  troopCapMultiplier: number;
  /** Stipend in gold per season (paid from treasury). */
  stipend: number;
  /** Required minimum war or leadership to be promoted to this rank. */
  minStat: number;
}

/**
 * Civic / appointed posts. Each post is unique within a force — only one
 * officer can hold it at a time.
 */
export type CivicTitleId =
  | 'prefect'    // 太守 — governor of a specific city (one per city)
  | 'strategist' // 軍師 — chief strategist
  | 'chancellor' // 丞相 — chief minister (cao-cao, zhuge-liang, etc.)
  | 'inspector'  // 刺史 — inspector general
  | 'minister';  // 司徒 — general civil minister

export interface CivicTitle {
  id: CivicTitleId;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  /** Unique per force (true) or per city (false — prefect is per-city). */
  uniquePerForce: boolean;
  /** Stat focus for bonuses. */
  primaryStat: 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma';
  /** Force-wide bonus this title grants while held by a competent officer. */
  forceBonus: {
    /** Multiplier on internal-affairs effects. */
    internalMultiplier?: number;
    /** Bonus to recruit success. */
    recruitBonus?: number;
    /** Multiplier on power for the entire force in battle. */
    powerMultiplier?: number;
  };
}

/**
 * Held appointment: which officer holds which post in which force,
 * and for prefect, which city.
 */
export interface Appointment {
  officerId: EntityId;
  forceId: EntityId;
  titleId: CivicTitleId;
  /** Only set when titleId === 'prefect'. */
  cityId?: EntityId;
  appointedYear: number;
}
