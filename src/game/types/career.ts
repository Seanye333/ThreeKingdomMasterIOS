import type { EntityId } from './common';

/**
 * Officer career mode — play as a single officer rather than a warlord.
 * The "career officer" is one of the regular Officer entries, but the
 * player's view + controls are restricted: only orders involving them.
 *
 * When their force's ruler dies and they're a high-ranking officer (rank ≥
 * general), they may inherit the force.
 */
export interface CareerState {
  /** Officer the player controls. */
  officerId: EntityId;
  /** Career milestones reached this campaign. */
  milestones: Array<{
    title: { zh: string; en: string };
    year: number;
    season: 'spring' | 'summer' | 'autumn' | 'winter';
  }>;
}
