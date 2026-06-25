import type { EntityId } from '../types';
import { HISTORICAL_OATHS } from './historicalRelationships';

export interface OathBond {
  officerA: EntityId;
  officerB: EntityId;
  floor: number; // loyalty floor when both serve the same force
  kind: 'oath' | 'clan' | 'sibling' | 'cousin' | 'parent' | 'feud';
  label: string;
  /**
   * Depth of the tie (1..3), used by the 義結深化 system. For sworn bonds:
   * 1 義交 → 2 義結金蘭 → 3 生死之交 (deeper = higher loyalty floor + battle
   * synergy). For `feud` bonds it is the severity (1 嫌隙 → 2 宿怨 → 3 死敵).
   * Optional so old serialized runtimeBonds load fine — readers default `?? 1`.
   */
  depth?: 1 | 2 | 3;
  /** Seasons the pair has served together since forging — drives deepening. */
  sharedSeasons?: number;
}

/** True if a bond is a 宿怨/私仇 (the negative mirror of a sworn bond). */
export function isFeudKind(kind: OathBond['kind']): boolean {
  return kind === 'feud';
}

/**
 * Static OATH_BONDS used to hold 21 hard-coded famous bonds (桃園結義,
 * Cao–Xiahou clan, Sun brothers, Sima clan, etc.). These are now all
 * covered by FAMILY_LINEAGE + OFFICER_RELATIONSHIPS, and the loyalty
 * floor mechanism is enforced by `loyaltyFloor()` in
 * `relationshipEffects.ts`.
 *
 * The array is intentionally empty — the OathBond type is kept for
 * `runtimeBonds` (dynamic entries: AI marriages, P11 trait bonds,
 * tactical-battle comradeship). New runtime bonds still go into
 * state.runtimeBonds; this static seed is retired.
 */
export const OATH_BONDS: OathBond[] = [
  // ─── 歷代名將 (Historical figures across all 14 dynasties) ───
  ...HISTORICAL_OATHS,
];
