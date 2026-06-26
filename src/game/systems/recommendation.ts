/**
 * 舉薦 — 賢以薦賢. Each season a capable serving officer may put a hidden talent
 * forward (history's chief talent pipeline: 徐庶薦諸葛亮, 荀彧薦郭嘉…). It surfaces
 * an 在野 officer — preferring one the recommender is TIED to (師承/義結/同門 via
 * OFFICER_RELATIONSHIPS) or a fellow townsman, else one they've merely heard of —
 * as a free agent for the lord to court. Saves blind 探訪 and rewards a
 * well-connected court. Pure; returns at most one recommendation per call.
 */
import type { EntityId, Officer } from '../types';
import { relationsOf } from './relationshipEffects';

export interface Recommendation {
  recommenderId: EntityId;
  revealedId: EntityId;
  /** Where the talent surfaces (recommender's seat, else the talent's hometown). */
  cityId: EntityId | null;
}

export function rollRecommendations(ctx: {
  officers: Record<EntityId, Officer>;
  playerForceId: EntityId | null;
  rng: () => number;
}): Recommendation[] {
  if (!ctx.playerForceId) return [];
  const all = Object.values(ctx.officers);
  const unsearched = all.filter(
    (o) => o.status === 'unsearched' && !o.id.startsWith('commoner-') && !o.id.startsWith('custom-'),
  );
  if (unsearched.length === 0) return [];
  const unsearchedById = new Map(unsearched.map((o) => [o.id, o]));
  // A recommender must be serving the lord and be of real discernment (智 or 魅).
  const recommenders = all.filter(
    (o) =>
      o.forceId === ctx.playerForceId &&
      (o.status === 'idle' || o.status === 'active') &&
      (o.stats.intelligence >= 72 || o.stats.charisma >= 72),
  );
  for (const rec of recommenders) {
    if (ctx.rng() >= 0.06) continue; // ~6% per qualified officer per season
    // 1) someone they're tied to, 2) a fellow townsman, 3) one they've heard of.
    const tied = relationsOf(rec.id)
      .map((r) => (r.a === rec.id ? r.b : r.a))
      .find((id) => unsearchedById.has(id));
    let target = tied ? unsearchedById.get(tied)! : null;
    if (!target && rec.hometownCityId) {
      target = unsearched.find((o) => o.hometownCityId && o.hometownCityId === rec.hometownCityId) ?? null;
    }
    if (!target) target = unsearched[Math.floor(ctx.rng() * unsearched.length)] ?? null;
    if (!target) continue;
    const cityId = rec.locationCityId ?? target.hometownCityId ?? target.locationCityId ?? null;
    return [{ recommenderId: rec.id, revealedId: target.id, cityId }];
  }
  return [];
}
