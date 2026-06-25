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
