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
  | 'minister'   // 司徒 — general civil minister
  | 'grand-marshal' // 太尉 — chief defense minister
  | 'foreign-affairs' // 大鴻臚 — head of foreign relations
  | 'censor'     // 御史中丞 — censor-general (anti-corruption)
  | 'advisor';   // 諫議大夫 — court remonstrator / counselor

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
    /** Multiplier on diplomatic relation gain/loss for the force. */
    diplomacyMultiplier?: number;
    /** Per-season force-wide loyalty drift bonus (anti-corruption). */
    loyaltyDrift?: number;
    /** Multiplier on wish/dialogue-grant loyalty rewards. */
    advisorMultiplier?: number;
  };
  /** One-shot loyalty bump granted to the appointee on appointment. */
  loyaltyOnAppoint?: number;
  /** Other civic titles in this force that get auto-vacated when this
   *  one is appointed. 丞相 supersedes 太尉/司徒/大鴻臚 historically. */
  excludes?: CivicTitleId[];
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
  /** Optional season for finer-grained tenure tracking. */
  appointedSeason?: 'spring' | 'summer' | 'autumn' | 'winter';
}

/**
 * Audit log of appointments + revocations. Used for the 歷任 tab and for
 * the 4-season re-appoint cooldown.
 */
export interface AppointmentHistoryEntry {
  kind: 'appoint' | 'revoke';
  year: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  officerId: EntityId;
  forceId: EntityId;
  titleId: CivicTitleId;
  cityId?: EntityId;
  /** For revokes/pruning: dead/imprisoned/defected/lost-city/missing/replaced. */
  reason?: 'dead' | 'imprisoned' | 'defected' | 'lost-city' | 'missing' | 'replaced' | 'manual';
}
