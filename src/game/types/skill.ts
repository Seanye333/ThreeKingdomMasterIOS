import type { BilingualName, EntityId } from './common';

export type SkillCategory =
  | 'combat'    // Affects battle math
  | 'command'   // Affects troop capacity / cohesion
  | 'wisdom'    // Affects stratagems / intelligence
  | 'civil'     // Affects internal affairs / loyalty
  | 'special';  // Unique narrative or once-per-X effects

/**
 * Effects a skill has on combat math. The combat system reads these flat
 * numbers off the (commander + companions) pool: it sums the relevant
 * modifiers across the side and applies them.
 */
export interface SkillCombatEffects {
  /** Flat bonus added to blended war/leadership rating (applied once per officer). */
  warBonus?: number;
  leadershipBonus?: number;
  /** Multiplier on the *power* (blended × √troops) for the side this officer is on. */
  powerMultiplier?: number;
  /** Multiplier on troop losses on the *enemy* side. */
  enemyLossMultiplier?: number;
  /** Multiplier on *own* losses (lower = better defence). */
  ownLossMultiplier?: number;
  /** Adds to the chance of winning a duel (raw additive 0..1). */
  duelChanceBonus?: number;
  /** Multiplies city defenseFactor when defending. */
  defenseMultiplier?: number;
}

export interface SkillCivilEffects {
  /** Loyalty leak from neighbours: +N loyalty per season when stationed in a city. */
  loyaltyAura?: number;
  /** Recruit success chance bonus (additive 0..1). */
  recruitBonus?: number;
  /** Boost to internal affairs effect (1.2 = +20%). */
  internalMultiplier?: number;
}

export interface Skill {
  id: EntityId;
  name: BilingualName;
  category: SkillCategory;
  description: string;
  descriptionZh?: string;
  combat?: SkillCombatEffects;
  civil?: SkillCivilEffects;
}
