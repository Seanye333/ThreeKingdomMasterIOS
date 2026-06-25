import type { DiplomaticState, EntityId, MarriageAlliance, Officer } from '../types';
import { pairKey } from '../types/diplomacy';
import type { OathBond } from '../data/bonds';

/** Relation can't sink below this while a marriage alliance stands. */
export const ALLIANCE_RELATION_FLOOR = 60;
/** Per-season warmth a standing alliance accrues, up to 100. */
export const ALLIANCE_DRIFT = 2;

/** The marriage alliance between two forces, if any. */
export function allianceBetween(
  alliances: MarriageAlliance[],
  a: EntityId,
  b: EntityId,
): MarriageAlliance | null {
  return (
    alliances.find(
      (m) =>
        (m.forceA === a && m.forceB === b) || (m.forceA === b && m.forceB === a),
    ) ?? null
  );
}

function setRelation(
  relations: DiplomaticState['relations'],
  a: EntityId,
  b: EntityId,
  mutate: (r: { forceA: EntityId; forceB: EntityId; score: number; status: 'neutral' | 'non-aggression' | 'allied' }) => { score: number; status: 'neutral' | 'non-aggression' | 'allied' },
): void {
  const key = pairKey(a, b);
  const base = relations[key] ?? {
    forceA: a < b ? a : b,
    forceB: a < b ? b : a,
    score: 0,
    status: 'neutral' as const,
  };
  const next = mutate(base);
  relations[key] = { ...base, score: next.score, status: next.status };
}

export interface AllianceTickResult {
  diplomacy: DiplomaticState;
  alliances: MarriageAlliance[];
  entries: Array<{ cityId: EntityId | null; text: string; textZh: string }>;
}

/**
 * Season upkeep for marriage alliances: hold each standing pact's relation at
 * or above the floor, drift it warmer, and prune pacts whose partner realm has
 * been wiped off the map (the tie simply lapses — no betrayal). Pure.
 */
export function tickMarriageAlliances(input: {
  alliances: MarriageAlliance[];
  diplomacy: DiplomaticState;
  livingForceIds: ReadonlySet<EntityId>;
}): AllianceTickResult {
  const relations = { ...input.diplomacy.relations };
  const entries: AllianceTickResult['entries'] = [];
  const kept: MarriageAlliance[] = [];

  for (const m of input.alliances) {
    if (!input.livingForceIds.has(m.forceA) || !input.livingForceIds.has(m.forceB)) {
      // A partner realm fell — the alliance quietly lapses.
      continue;
    }
    kept.push(m);
    setRelation(relations, m.forceA, m.forceB, (r) => ({
      score: Math.min(100, Math.max(ALLIANCE_RELATION_FLOOR, r.score + ALLIANCE_DRIFT)),
      status: 'allied',
    }));
  }

  return { diplomacy: { ...input.diplomacy, relations }, alliances: kept, entries };
}

export interface AllianceBreakResult {
  diplomacy: DiplomaticState;
  alliances: MarriageAlliance[];
  officers: Record<EntityId, Officer>;
  runtimeBonds: OathBond[];
  entries: Array<{ cityId: EntityId | null; text: string; textZh: string }>;
}

/**
 * 背信棄義 — the breaker dissolves a marriage alliance to free its hand for war.
 * The spurned realm's relation craters and everyone else marks the oathbreaker
 * down too (an untrustworthy neighbour); the breaker's own wedded officer,
 * shamed, loses loyalty. Pure — caller commits the result.
 */
export function breakAlliance(input: {
  breakerForceId: EntityId;
  targetForceId: EntityId;
  alliances: MarriageAlliance[];
  diplomacy: DiplomaticState;
  officers: Record<EntityId, Officer>;
  runtimeBonds: OathBond[];
  livingForceIds: ReadonlySet<EntityId>;
  /** Current year — stamped on a 質子's death if a hostage union is betrayed. */
  year?: number;
}): AllianceBreakResult {
  const alliance = allianceBetween(input.alliances, input.breakerForceId, input.targetForceId);
  const relations = { ...input.diplomacy.relations };
  const officers = { ...input.officers };
  const entries: AllianceBreakResult['entries'] = [];

  // Spurned realm: status back to neutral (war re-enabled), relation craters.
  setRelation(relations, input.breakerForceId, input.targetForceId, () => ({
    score: -50,
    status: 'neutral',
  }));

  // Everyone else: an oathbreaker is a poor ally. −15 with each living force.
  for (const fid of input.livingForceIds) {
    if (fid === input.breakerForceId || fid === input.targetForceId) continue;
    setRelation(relations, input.breakerForceId, fid, (r) => ({
      score: Math.max(-100, r.score - 15),
      status: r.status === 'allied' ? 'allied' : r.status,
    }));
  }

  // The wedded officer on the breaker's side pays. A 質子 union betrayed costs
  // the hostage's life (the spurned realm executes them); otherwise just shame.
  if (alliance) {
    const ownId = alliance.forceA === input.breakerForceId ? alliance.officerA : alliance.officerB;
    const own = officers[ownId];
    if (own) {
      if (alliance.hostage && own.status !== 'dead') {
        officers[ownId] = { ...own, status: 'dead', ...(input.year !== undefined ? { deathYear: input.year } : {}) };
        entries.push({
          cityId: own.locationCityId,
          text: `${own.name.en}, held as a 質子, is put to the sword when the alliance is betrayed.`,
          textZh: `${own.name.zh}本為質子,盟約一毀,身死他鄉。`,
        });
      } else {
        officers[ownId] = { ...own, loyalty: Math.max(0, own.loyalty - 25) };
      }
    }
  }

  const runtimeBonds = alliance
    ? input.runtimeBonds.filter(
        (b) =>
          !(
            (b.officerA === alliance.officerA && b.officerB === alliance.officerB) ||
            (b.officerB === alliance.officerA && b.officerA === alliance.officerB)
          ),
      )
    : input.runtimeBonds;

  const alliances = input.alliances.filter(
    (m) => !(
      (m.forceA === input.breakerForceId && m.forceB === input.targetForceId) ||
      (m.forceA === input.targetForceId && m.forceB === input.breakerForceId)
    ),
  );

  entries.push({
    cityId: null,
    text: 'A marriage alliance is cast aside — the realm is branded an oathbreaker.',
    textZh: '聯姻之盟一朝撕毀,背信之名播於四鄰。',
  });

  return { diplomacy: { ...input.diplomacy, relations }, alliances, officers, runtimeBonds, entries };
}
