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
