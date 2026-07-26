import type { EntityId, Force, Officer } from '../types';

/**
 * 故主之義 — a turncoat remembers the house he served.
 *
 * The realm already models the ORIGINAL retainer well (`retinueOfLordId`, set
 * once by fillRetinues at scenario start: a loyalty floor while that lord
 * lives, grief when he falls, an eager 舊部歸心 if he ever calls). But that
 * field is never written again, so the far more common case — a man you took
 * prisoner and talked round, or one you turned with silver — carried no memory
 * whatsoever. You could capture 于禁 at breakfast and march him against his own
 * capital by noon, and nothing in him objected.
 *
 * This is the missing half: whoever a man served LAST, and how recently.
 *
 * ── Why a season-tick diff instead of hooks at the join sites
 *
 * Officers change house through many doors (captive recruit, persuasion, mass
 * defection, scripted events, tribal submission, hostage exchange…). Patching
 * each one is a standing invitation to miss the next door someone adds. Instead
 * `trackService` diffs `forceId` against a shadow field every season and
 * records whatever it finds, so a path added tomorrow is covered for free.
 *
 * The one-season lag is harmless: the qualm only matters when you order the man
 * to war, and that is next season's decision anyway.
 */

/** How long the qualm lingers, in seasons — roughly three years' service. */
export const QUALM_SEASONS = 12;
/** Deepest power penalty a fresh, cold defector suffers against his old house. */
export const QUALM_MAX_PENALTY = 0.18;
/** At or above this loyalty a man has genuinely thrown in with you. */
export const QUALM_LOYALTY_SETTLED = 90;

/**
 * Record house changes and age existing qualms by one season.
 *
 * Pure. Returns a new officers map; officers with nothing to record are passed
 * through by reference so this is cheap to run every tick.
 */
export function trackService(
  officers: Record<EntityId, Officer>,
  forces: Record<EntityId, Force>,
): Record<EntityId, Officer> {
  const next: Record<EntityId, Officer> = {};
  for (const [id, o] of Object.entries(officers)) {
    const shadow = o.servingForceId;
    const now = o.forceId ?? undefined;

    if (shadow === now) {
      // Same house as last season — let any standing qualm cool by one.
      const q = o.qualmSeasons ?? 0;
      next[id] = q > 0 ? { ...o, qualmSeasons: q - 1 } : o;
      continue;
    }

    // He has moved. Only a move OUT of a real house leaves anything behind:
    // a masterless man taking service for the first time owes nobody.
    if (shadow && shadow !== now) {
      next[id] = {
        ...o,
        servingForceId: now,
        formerForceId: shadow,
        formerLordId: forces[shadow]?.rulerOfficerId,
        qualmSeasons: QUALM_SEASONS,
      };
    } else {
      next[id] = { ...o, servingForceId: now };
    }
  }
  return next;
}

/**
 * How badly this man does not want to do this, 0..1.
 *
 * Fades with the seasons he has served you and with the loyalty he has come to
 * feel; a settled, contented officer fights his old house without flinching,
 * which is exactly how 于禁 and 黃權 read in the histories once time had passed.
 */
export function qualmStrength(officer: Officer, targetForceId: EntityId | null | undefined): number {
  if (!targetForceId) return 0;
  if (officer.formerForceId !== targetForceId) return 0;
  const seasons = officer.qualmSeasons ?? 0;
  if (seasons <= 0) return 0;
  const freshness = Math.min(1, seasons / QUALM_SEASONS);
  // Loyalty 50 → full weight; 90+ → nothing left of it.
  const loyaltyFactor = Math.max(0, Math.min(1, (QUALM_LOYALTY_SETTLED - officer.loyalty) / 40));
  return Math.max(0, Math.min(1, freshness * loyaltyFactor));
}

/** Officers in this party who are being pointed at the house they just left. */
export function qualmedOfficers(
  pool: Array<Officer | undefined | null>,
  targetForceId: EntityId | null | undefined,
): Officer[] {
  return pool.filter((o): o is Officer => !!o && qualmStrength(o, targetForceId) > 0);
}

/**
 * Power multiplier for a party marching on a house one of them served.
 *
 * Averaged rather than summed: a single reluctant man in a large staff drags on
 * the whole column a little, he does not halve it. The commander's own qualm
 * counts double — it is his column.
 */
export function formerLordQualmsMul(
  pool: Array<Officer | undefined | null>,
  targetForceId: EntityId | null | undefined,
  commander?: Officer | null,
): number {
  const live = pool.filter((o): o is Officer => !!o);
  if (live.length === 0 || !targetForceId) return 1;
  let weight = 0;
  let total = 0;
  for (const o of live) {
    const w = commander && o.id === commander.id ? 2 : 1;
    weight += w;
    total += qualmStrength(o, targetForceId) * w;
  }
  if (weight === 0) return 1;
  return 1 - (total / weight) * QUALM_MAX_PENALTY;
}

/** Bilingual note for the season report, or null when nobody hesitated. */
export function qualmReport(
  pool: Array<Officer | undefined | null>,
  targetForceId: EntityId | null | undefined,
  forceName: { zh: string; en: string } | undefined,
): { zh: string; en: string } | null {
  const hesitant = qualmedOfficers(pool, targetForceId)
    .sort((a, b) => qualmStrength(b, targetForceId) - qualmStrength(a, targetForceId));
  if (hesitant.length === 0) return null;
  const who = hesitant[0];
  const house = forceName?.zh ?? '故主';
  const houseEn = forceName?.en ?? 'his old house';
  const more = hesitant.length > 1 ? `(另有 ${hesitant.length - 1} 人同此心)` : '';
  const moreEn = hesitant.length > 1 ? ` (and ${hesitant.length - 1} more of the same mind)` : '';
  return {
    zh: `${who.name.zh}舊事${house},臨陣不能無所顧 —— 部伍進退稍緩。${more}`,
    en: `${who.name.en} once served ${houseEn}, and cannot draw on them with a whole heart — the column is slower to close.${moreEn}`,
  };
}
