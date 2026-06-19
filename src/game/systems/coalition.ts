import type {
  City,
  DiplomaticState,
  EntityId,
  Force,
  ReportEntry,
} from '../types';

/**
 * Coalition formation: when one force grows past a threshold (40% of cities),
 * the other forces with at least one city automatically sign Non-Aggression
 * Pacts with each other to focus on the hegemon.
 *
 * This runs once per season at end-of-turn. Already-signed pacts are not
 * re-signed.
 */
export interface CoalitionContext {
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  diplomacy: DiplomaticState;
  date: { year: number; season: 'spring' | 'summer' | 'autumn' | 'winter' };
}

export interface CoalitionOutput {
  diplomacy: DiplomaticState;
  entries: ReportEntry[];
}

export function evaluateCoalition(ctx: CoalitionContext): CoalitionOutput {
  const totalCities = Object.keys(ctx.cities).length;
  if (totalCities === 0) {
    return { diplomacy: ctx.diplomacy, entries: [] };
  }
  // Count cities per force.
  const counts: Record<EntityId, number> = {};
  for (const c of Object.values(ctx.cities)) {
    if (!c.ownerForceId) continue;
    counts[c.ownerForceId] = (counts[c.ownerForceId] ?? 0) + 1;
  }
  // Find the hegemon (>40%).
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return { diplomacy: ctx.diplomacy, entries: [] };
  const [hegemonId, hegemonCount] = sorted[0];
  if (hegemonCount / totalCities < 0.4) {
    return { diplomacy: ctx.diplomacy, entries: [] };
  }
  // The other forces sign NAPs.
  const otherForces = sorted.slice(1).map(([id]) => id);
  if (otherForces.length < 2) return { diplomacy: ctx.diplomacy, entries: [] };

  const entries: ReportEntry[] = [];
  const newRelations = { ...ctx.diplomacy.relations };

  for (let i = 0; i < otherForces.length; i++) {
    for (let j = i + 1; j < otherForces.length; j++) {
      const a = otherForces[i];
      const b = otherForces[j];
      const key = pairKey(a, b);
      const cur = newRelations[key];
      // Only sign NAP if currently neutral; don't downgrade an alliance.
      if (cur && (cur.status === 'non-aggression' || cur.status === 'allied')) continue;
      newRelations[key] = {
        forceA: a < b ? a : b,
        forceB: a < b ? b : a,
        status: 'non-aggression',
        // NAP lasts 12 seasons (3 years).
        expiresAt: { year: ctx.date.year + 3, season: ctx.date.season },
        score: 60,
      };
      const fA = ctx.forces[a];
      const fB = ctx.forces[b];
      entries.push({
        cityId: null,
        kind: 'note',
        text: `${fA?.name.en ?? a} and ${fB?.name.en ?? b} sign a non-aggression pact, fearing ${ctx.forces[hegemonId]?.name.en ?? hegemonId}.`,
        textZh: `${fA?.name.zh ?? a}與${fB?.name.zh ?? b}畏${ctx.forces[hegemonId]?.name.zh ?? hegemonId}之勢，遂結互不侵犯之盟。`,
      });
    }
  }
  return { diplomacy: { ...ctx.diplomacy, relations: newRelations }, entries };
}

function pairKey(a: EntityId, b: EntityId): string {
  return [a, b].sort().join('::');
}
