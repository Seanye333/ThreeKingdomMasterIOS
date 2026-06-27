/**
 * 舉薦 — 賢以薦賢. Each season a capable serving officer may put a hidden talent
 * forward (history's chief talent pipeline: 徐庶薦諸葛亮, 荀彧薦郭嘉…). It surfaces
 * an 在野 officer — preferring one the recommender is TIED to (師承/義結/同門 via
 * OFFICER_RELATIONSHIPS) or a fellow townsman, else one they've heard of (the
 * more discerning the recommender, the better the talent they name, 識人之明) —
 * as a free agent the recommending lord can court. Works for ANY force (the
 * player courts the surfaced talent by hand; an AI grabs them via 群雄競聘),
 * so the player no longer holds an exclusive talent pipeline. Saves blind 探訪
 * and rewards a well-connected court. Pure; returns at most one per call.
 */
import type { EntityId, Officer } from '../types';
import { relationsOf } from './relationshipEffects';

export interface Recommendation {
  recommenderId: EntityId;
  revealedId: EntityId;
  /** Where the talent surfaces (recommender's seat, else the talent's hometown). */
  cityId: EntityId | null;
}

const statSum = (o: Officer) =>
  o.stats.war + o.stats.leadership + o.stats.intelligence + o.stats.politics + o.stats.charisma;

export function rollRecommendations(ctx: {
  officers: Record<EntityId, Officer>;
  /** The force whose court is recommending (player or AI). */
  forceId: EntityId | null;
  rng: () => number;
}): Recommendation[] {
  if (!ctx.forceId) return [];
  const all = Object.values(ctx.officers);
  const unsearched = all.filter(
    (o) => o.status === 'unsearched' && !o.id.startsWith('commoner-') && !o.id.startsWith('custom-'),
  );
  if (unsearched.length === 0) return [];
  const unsearchedById = new Map(unsearched.map((o) => [o.id, o]));
  // A recommender must be serving the lord and be of real discernment (智 or 魅).
  const recommenders = all.filter(
    (o) =>
      o.forceId === ctx.forceId &&
      (o.status === 'idle' || o.status === 'active') &&
      (o.stats.intelligence >= 72 || o.stats.charisma >= 72),
  );
  // 識人 — rank the open pool by raw quality once; a discerning recommender draws
  // from a narrow top slice, a dull one from the whole field.
  const ranked = [...unsearched].sort((a, b) => statSum(b) - statSum(a));
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
    if (!target) {
      // 識人之明 — 智 60 → whole pool; 智 100 → top ~15%. 荀彧薦郭嘉,庸者薦庸者.
      const discern = Math.max(0, Math.min(1, (rec.stats.intelligence - 60) / 40));
      const topFrac = 0.15 + (1 - discern) * 0.85;
      const cut = Math.max(1, Math.floor(ranked.length * topFrac));
      target = ranked[Math.floor(ctx.rng() * cut)] ?? null;
    }
    if (!target) continue;
    const cityId = rec.locationCityId ?? target.hometownCityId ?? target.locationCityId ?? null;
    return [{ recommenderId: rec.id, revealedId: target.id, cityId }];
  }
  return [];
}
