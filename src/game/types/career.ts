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
  /**
   * 人情 — 誰欠你多少。替雇主辦成差事會累積,辦砸會倒扣。
   * 夠厚時那個人會在上頭替你薦舉(careerPatronage.ts)。
   */
  favors?: Record<EntityId, number>;
  /** Career milestones reached this campaign. */
  milestones: Array<{
    title: { zh: string; en: string };
    year: number;
    season: 'spring' | 'summer' | 'autumn' | 'winter';
  }>;
}
