import type { BilingualName, EntityId } from './common';

/**
 * Types of covert operation a player can run against rival forces.
 * Most ops cost gold + an officer-season, take a season to resolve,
 * and have a success chance keyed off the officer's intelligence vs
 * target's defensive intelligence (or an aggregate).
 */
export type EspionageKind =
  | 'gather-intel'  // 諜報 — reveal enemy stats; +knowledge
  | 'instigate'     // 煽動 — drop city loyalty to provoke rebellion
  | 'sabotage'      // 破壊 — destroy food stocks at target city
  | 'assassinate'   // 暗殺 — attempt to kill a specific enemy officer
  | 'defect'        // 寝返 — turn an enemy officer to your side
  | 'frame';        // 離間 — drop loyalty of an enemy officer toward their lord

export interface EspionageDef {
  kind: EspionageKind;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  description: string;
  descriptionZh?: string;
  /** Base gold cost paid up-front. */
  goldCost: number;
  /** Min intelligence the executing officer needs. */
  minIntelligence: number;
  /** Whether the op targets a specific enemy officer (true) or a city/force (false). */
  targetsOfficer: boolean;
  /** Base success chance (0..1); modified by stats + relations. */
  baseSuccess: number;
}

/** A pending operation queued for the next season's resolution. */
export interface EspionageOp {
  id: EntityId;
  kind: EspionageKind;
  /** Officer running the op (one of yours). */
  agentOfficerId: EntityId;
  /** Targeted force. */
  targetForceId: EntityId;
  /** Targeted city, if applicable. */
  targetCityId?: EntityId;
  /** Targeted officer, if applicable. */
  targetOfficerId?: EntityId;
  /** Season the op was issued. */
  issuedYear: number;
  issuedSeason: 'spring' | 'summer' | 'autumn' | 'winter';
}

/** Result of a resolved op — feed into the season report. */
export interface EspionageResult {
  op: EspionageOp;
  success: boolean;
  message: string;
}
