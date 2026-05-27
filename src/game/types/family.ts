import type { EntityId } from './common';

/**
 * Officer family relationships. Spouses get married; couples roll annually
 * for children. Children grow into officers at age 14.
 */
export interface FamilyRelation {
  officerA: EntityId;
  officerB: EntityId;
  kind: 'spouse' | 'parent-child' | 'sibling';
}

/**
 * A pending officer (a child of a married couple) that will join the roster
 * when they reach a coming-of-age year.
 */
export interface PendingHeir {
  id: EntityId;
  parentAId: EntityId;
  parentBId: EntityId;
  birthYear: number;
  /** Pre-rolled stats with mild parental inheritance. */
  baseStats: {
    leadership: number;
    war: number;
    intelligence: number;
    politics: number;
    charisma: number;
  };
  name: { zh: string; en: string };
  /** True if female (only affects portrait archetype + recruit logic). */
  female: boolean;
}

/**
 * A request an officer makes of their lord. Resolved next season; rejection
 * lowers their loyalty.
 */
export type WishKind =
  | 'transfer'         // wants to be transferred to a specific city
  | 'reinforce'        // wants more troops in their city
  | 'item'             // wants a specific item
  | 'promote'          // wants a higher rank
  | 'dismiss-rival'    // wants a rival officer dismissed
  | 'learn-policy'     // wants to be trained in a specific policy
  | 'retire'           // wants to retire (only old / wounded officers)
  | 'info';            // 上書 — informational letter, no grant/reject choice

export interface OfficerWish {
  id: EntityId;
  officerId: EntityId;
  kind: WishKind;
  /** Free-text bilingual description. */
  text: { zh: string; en: string };
  /** Target reference (city / item / rival officer). */
  targetId?: EntityId;
  issuedYear: number;
  issuedSeason: 'spring' | 'summer' | 'autumn' | 'winter';
  /** Loyalty penalty if rejected. */
  rejectPenalty: number;
  /** Loyalty bonus if granted. */
  grantBonus: number;
  /** Auto-expires after this many seasons of inaction (default 6). */
  expiresAfterSeasons?: number;
}
