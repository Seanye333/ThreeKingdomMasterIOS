import type { EntityId, GameDate } from './common';

export type RelationStatus = 'neutral' | 'non-aggression' | 'allied';

export interface Relation {
  forceA: EntityId;
  forceB: EntityId;
  score: number; // -100 to +100
  status: RelationStatus;
  expiresAt?: GameDate; // for non-aggression pacts
}

export interface DiplomaticState {
  relations: Record<string, Relation>;
}

/**
 * 聯姻同盟 — a binding marriage alliance between two realms. Distinct from a
 * mere relation boost: while it stands the two forces are 'allied' (hostility
 * blocked by isHostilePermitted) and their relation is floored; dissolving it
 * to make war brands the breaker an 背信 oathbreaker (see systems/marriageAlliance).
 */
export interface MarriageAlliance {
  forceA: EntityId;
  forceB: EntityId;
  /** The two wed officers (officerA serves forceA, officerB serves forceB). */
  officerA: EntityId;
  officerB: EntityId;
  /** Year the union was sealed. */
  sinceYear: number;
  /** 人質 — a child/heir married OUT lives in the partner's court as surety;
   *  the leverage tightens the bond. Optional — most unions aren't hostages. */
  hostage?: boolean;
  /** 外戚 — the maternal clan key whose prestige rises from the union (the
   *  bride's house becoming in-laws of the partner realm). */
  maternalClanId?: string;
}

/**
 * 共討會盟 — a player-led war league against one target realm (the 反董卓聯盟
 * archetype). Distinct from the *reactive* 合縱 in systems/diplomacy.ts (which
 * the AI forms automatically against a hegemon): a coalition is *proactively*
 * organised by a 盟主, who persuades friendly realms to jointly declare war on a
 * common foe for a fixed window. While it stands its members bias their attacks
 * toward `targetForceId` (see ai.pickForceTarget). Resolved in
 * systems/diplomacyPacts.tickCoalitions: the foe's fall crowns the 盟主, its
 * survival to the deadline shames them. See GUIDE §7.1.
 */
export interface WarCoalition {
  /** 盟主 — usually the player; gains/loses face on the outcome. */
  leaderForceId: EntityId;
  /** 討伐對象 — the realm the league is sworn to bring down. */
  targetForceId: EntityId;
  /** Every sworn member, the 盟主 included. */
  memberForceIds: EntityId[];
  /** Year the oath was sworn (for the chronicle). */
  startedYear: number;
  /** Season the league disbands if the foe still stands. */
  expiresAt: GameDate;
}

/**
 * 援盟之請 — a standing plea for the player to honour an alliance (§7.1 ④). Raised
 * each season for a player-allied realm menaced by a stronger hostile neighbour;
 * answered (or spurned) via store.answerCallToArms. Expires so stale calls clear.
 */
export interface CallToArms {
  /** The allied realm begging aid. */
  allyForceId: EntityId;
  /** The aggressor the ally wants the player to march against. */
  foeForceId: EntityId;
  /** Season the unanswered plea drops off the list. */
  expiresAt: GameDate;
}

/**
 * 索貢來牒 — a standing ultimatum an AI realm has pressed on the player (§7.1 ③,
 * the AI-side mirror of store.demandTribute). Surfaced in DiplomacyModal; the
 * player yields or defies via store.answerDemand. Expires so stale threats clear.
 */
export interface DiplomaticDemand {
  /** The coercer pressing the demand. */
  fromForceId: EntityId;
  /** What is demanded — gold/grain, or outright submission. */
  kind: 'gold' | 'grain' | 'submit';
  /** Season the unanswered threat lapses (a snub the coercer resents). */
  expiresAt: GameDate;
}

/**
 * 假途・借道 — a grant of passage through one realm's territory to another (§7.1 B).
 * While it stands the grantee may stage attacks on cities bordering the grantor's
 * land (reaching foes it couldn't otherwise touch) — or turn on the host itself
 * (假途滅虢), seizing the very land it was lent at a ruinous cost to its name.
 */
export interface PassageGrant {
  /** The realm lending its roads. */
  grantorForceId: EntityId;
  /** The realm marching through. */
  granteeForceId: EntityId;
  /** Season the leave-to-pass lapses. */
  expiresAt: GameDate;
}

/**
 * 求和乞降 — a beaten AI realm's plea to the player to end a war (§7.1 ②'), the
 * counterpart to the player's own store.sueForPeace. Surfaced in DiplomacyModal;
 * the player grants terms (reparations / the foe's submission) or fights on.
 */
export interface PeaceOffer {
  /** The realm suing the player for terms. */
  fromForceId: EntityId;
  /** What it offers to end the war — coin (reparations) or its submission (vassal). */
  kind: 'reparations' | 'vassal';
  /** Season the unanswered plea lapses. */
  expiresAt: GameDate;
}

export function pairKey(a: EntityId, b: EntityId): string {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

export function getRelation(
  diplomacy: DiplomaticState,
  a: EntityId,
  b: EntityId,
): Relation {
  if (a === b) {
    return { forceA: a, forceB: b, score: 100, status: 'allied' };
  }
  const key = pairKey(a, b);
  return (
    diplomacy.relations[key] ?? {
      forceA: a < b ? a : b,
      forceB: a < b ? b : a,
      score: 0,
      status: 'neutral',
    }
  );
}

export function isHostilePermitted(
  diplomacy: DiplomaticState,
  attacker: EntityId,
  target: EntityId,
): boolean {
  if (attacker === target) return false;
  const rel = getRelation(diplomacy, attacker, target);
  return rel.status === 'neutral';
}
