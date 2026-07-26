import type { City, EntityId, Force, Officer } from '../types';

/**
 * 承平之亂 — playing on after you have already won.
 *
 * Winning used to be a wall. `checkEndings` flips `victoryStatus` to 'victory',
 * the endings card comes up, and it cannot be dismissed (MapScreen renders it on
 * `victoryStatus === 'victory'`, so the card's own Continue button has nothing
 * to close) while every input path is gated on `victoryStatus === 'playing'`.
 * The campaign simply stops at its most interesting moment: you hold everything,
 * and the men who won it for you are still standing there.
 *
 * Continuing is only worth offering if there is something left to play, so this
 * supplies the pressure rather than an empty sandbox. It invents no new engine:
 * the realm already models ambition, over-mighty ministers, garrison mutiny and
 * usurpation in full (§7.5). What changes after unification is only that the
 * army has nowhere else to point.
 *
 *   外無強敵,則內生嫌隙。
 *
 * So the whole system is one number folded into `factionBoost`, the per-officer
 * betrayal bonus that resolution.ts already assembles from court factions and
 * over-mighty clans. Same rolls, same events, same reports — a heavier thumb.
 */

/** Ceiling on the post-victory push, so it stacks without swamping §7.5. */
export const POST_VICTORY_MAX_BOOST = 0.055;
/** Below this share of the realm there is still a war on; ambition waits. */
export const PEACE_SHARE = 0.85;
/** A man this close to his lord never moves, however quiet the borders. */
export const POST_VICTORY_CONFIDANT_RAPPORT = 80;

export interface PostVictoryContext {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  playerForceId: EntityId | null | undefined;
  /** 君臣好感 — the same map §7.5 consults. */
  lordRapport?: Record<EntityId, number>;
}

/**
 * How thoroughly the realm is at peace, 0..1 — the share of all cities the
 * player holds, rescaled so it only starts biting past PEACE_SHARE.
 *
 * A campaign continued after a *hegemon* or *tripartite* ending still has rivals
 * on the map and gets little or nothing from this; a fully unified realm gets
 * the lot. That is the intended shape: the danger is idleness, not victory.
 */
export function peaceDepth(ctx: PostVictoryContext): number {
  const total = Object.keys(ctx.cities).length;
  if (total === 0 || !ctx.playerForceId) return 0;
  const mine = Object.values(ctx.cities).filter((c) => c.ownerForceId === ctx.playerForceId).length;
  const share = mine / total;
  if (share < PEACE_SHARE) return 0;
  return Math.min(1, (share - PEACE_SHARE) / (1 - PEACE_SHARE));
}

/**
 * Per-officer betrayal bonus to fold into `factionBoost`.
 *
 * Weighted by what a man would actually be giving up — a general with real
 * troops and a seat of his own has something to rebel WITH — and damped by the
 * regard he holds his lord in. Deliberately silent for the ruler, the loyal,
 * and confidants: peace does not turn a 心腹 into a warlord.
 */
export function postVictoryAmbitionBoost(ctx: PostVictoryContext): Record<EntityId, number> {
  const out: Record<EntityId, number> = {};
  const depth = peaceDepth(ctx);
  if (depth <= 0 || !ctx.playerForceId) return out;
  const force = ctx.forces[ctx.playerForceId];
  if (!force) return out;

  const rapport = ctx.lordRapport ?? {};
  for (const o of Object.values(ctx.officers)) {
    if (o.forceId !== ctx.playerForceId) continue;
    if (o.id === force.rulerOfficerId) continue;
    if (o.status !== 'idle' && o.status !== 'active') continue;
    if ((o.traits ?? []).includes('loyal')) continue;
    if ((rapport[o.id] ?? 0) >= POST_VICTORY_CONFIDANT_RAPPORT) continue;

    // 手握重兵 — the men who could actually do it.
    const stature = Math.min(1, ((o.stats.leadership + o.stats.war) / 2 - 60) / 35);
    if (stature <= 0) continue;
    // 君臣之間 — warmth restrains, resentment emboldens.
    const regard = Math.max(0, Math.min(1, (60 - (rapport[o.id] ?? 0)) / 60));
    // Loyalty still governs; a contented realm at peace is safe.
    const discontent = Math.max(0, Math.min(1, (85 - o.loyalty) / 55));

    const boost = POST_VICTORY_MAX_BOOST * depth * stature * Math.max(regard, discontent);
    if (boost > 0.001) out[o.id] = boost;
  }
  return out;
}

/** The realm's own reading of how quiet — and how brittle — the peace is. */
export function peaceReport(ctx: PostVictoryContext): { zh: string; en: string } | null {
  const depth = peaceDepth(ctx);
  if (depth <= 0) return null;
  const at = postVictoryAmbitionBoost(ctx);
  const restless = Object.keys(at).length;
  if (restless === 0) {
    return {
      zh: '四海既定,朝野無事 —— 諸將各安其位,一時未見異心。',
      en: 'The realm is settled and the court is quiet — for now, no one is looking sideways.',
    };
  }
  return {
    zh: `四海既定,而兵鋒無所向 —— 朝中 ${restless} 人漸有自重之意。承平之世,患不在外。`,
    en: `The realm is settled and the army has nowhere to point — ${restless} of your commanders are beginning to weigh their own worth. In peacetime the danger is not on the border.`,
  };
}
