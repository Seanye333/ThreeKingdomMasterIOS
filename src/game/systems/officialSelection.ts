/**
 * 選官之制 (§3.6) — how a realm decides who gets to serve.
 *
 * The Han recruited by 察舉: a commandery grandee recommended a man of virtue,
 * and virtue turned out to run overwhelmingly in the families of commandery
 * grandees. 陳群's 九品中正 systematised that — an appointed Rectifier graded
 * every candidate, and within two generations "上品無寒門,下品無勢族". The
 * examination that finally broke the great houses was centuries away, but a
 * warlord with a 太學 and the nerve to ignore the gentry could reach for it
 * early — and pay for it.
 *
 * The three systems are a genuine strategic choice, not a ladder:
 *
 *   察舉 — the baseline. A well-connected court surfaces talent; mild clan tilt.
 *   九品中正 — a talent *pipeline*: far more recommendations, better graded,
 *              the clans delighted. And 寒門 stops arriving at all.
 *   開科取士 — commoners flood in, brilliance from nowhere; the great houses
 *              take it as the insult it is.
 *
 * Pure functions; the season tick in the store reads them.
 */

import type { Officer } from '../types';
import { isAristocrat, isCommoner } from '../data/clans';

export type SelectionSystem = 'chaju' | 'jiupin' | 'keju';

export const SELECTION_SYSTEMS: SelectionSystem[] = ['chaju', 'jiupin', 'keju'];

export const SELECTION_NAMES: Record<SelectionSystem, { zh: string; en: string; motto: string }> = {
  chaju:  { zh: '察舉', en: 'Recommendation', motto: '舉孝廉' },
  jiupin: { zh: '九品中正', en: 'Nine-Rank System', motto: '上品無寒門' },
  keju:   { zh: '開科取士', en: 'Open Examination', motto: '唯才是舉' },
};

export interface SelectionEffects {
  /** Multiplier on the per-officer 舉薦 roll. */
  recommendMul: number;
  /** Added discernment (0–1) when the recommender picks from the talent pool. */
  discernBonus: number;
  /** Multiplier on the 寒門 (commoner) arrival chance. */
  commonerMul: number;
  /** Added quality to a commoner arrival's stat rolls (0–1 scale). */
  commonerQuality: number;
  /** Per-season loyalty drift for great-clan officers of this realm. */
  aristocratLoyalty: number;
  /** Per-season loyalty drift for humble-born officers of this realm. */
  commonerLoyalty: number;
  badgeZh: string;
  badgeEn: string;
}

const EFFECTS: Record<SelectionSystem, SelectionEffects> = {
  chaju: {
    recommendMul: 1, discernBonus: 0, commonerMul: 1, commonerQuality: 0,
    aristocratLoyalty: 0, commonerLoyalty: 0,
    badgeZh: '常制 — 舉孝廉,賢以薦賢',
    badgeEn: 'Baseline — worthies recommend worthies',
  },
  jiupin: {
    recommendMul: 1.9, discernBonus: 0.3, commonerMul: 0.4, commonerQuality: -0.15,
    aristocratLoyalty: 1, commonerLoyalty: -1,
    badgeZh: '舉薦 ×1.9 且品評更精 · 寒門幾絕(×0.4)· 世家將 +1 忠/季,寒門 −1',
    badgeEn: 'Recommendations ×1.9, better graded · commoners nearly shut out (×0.4) · clan officers +1 loyalty/season, humble-born −1',
  },
  keju: {
    recommendMul: 0.7, discernBonus: 0, commonerMul: 2.4, commonerQuality: 0.25,
    aristocratLoyalty: -1, commonerLoyalty: 2,
    badgeZh: '寒門 ×2.4 且才質更高 · 舉薦 ×0.7 · 世家將 −1 忠/季,寒門 +2',
    badgeEn: 'Commoners ×2.4 and abler · recommendations ×0.7 · clan officers −1 loyalty/season, humble-born +2',
  },
};

export function selectionEffects(sys: SelectionSystem | undefined): SelectionEffects {
  return EFFECTS[sys ?? 'chaju'];
}

/**
 * 中正之公 — under 九品, one man grades every candidate in the realm. The
 * highest 政治 officer serving the lord holds the office by default; a Rectifier
 * of real integrity (剛直/清廉-type traits, read via the officer's own record)
 * blunts the system's bias against humble birth by half. 曹魏 had 陳群; most
 * realms had somebody's cousin.
 *
 * Returns the officer who acts as Rectifier, or null when the court has nobody
 * fit to hold the office.
 */
export function rectifierOf(officers: Officer[]): Officer | null {
  const eligible = officers.filter((o) => o.stats.politics >= 60);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, o) => (o.stats.politics > best.stats.politics ? o : best));
}

/** Traits that make a Rectifier grade honestly rather than by pedigree. */
const UPRIGHT_TRAITS = new Set(['incorruptible', 'principled', 'legalist', 'stern']);

export function rectifierIsUpright(rectifier: Officer | null): boolean {
  if (!rectifier) return false;
  return (rectifier.traits ?? []).some((t) => UPRIGHT_TRAITS.has(t));
}

/**
 * The realm's effective selection effects, after the Rectifier's character is
 * taken into account. Only 九品 cares who holds the office.
 */
export function effectiveSelection(
  sys: SelectionSystem | undefined,
  rectifier: Officer | null,
): SelectionEffects {
  const base = selectionEffects(sys);
  if (sys !== 'jiupin' || !rectifierIsUpright(rectifier)) return base;
  // 中正得人 — an upright Rectifier halves the shutting-out of humble birth.
  return {
    ...base,
    commonerMul: (base.commonerMul + 1) / 2,
    commonerQuality: base.commonerQuality / 2,
    commonerLoyalty: 0,
    badgeZh: `${base.badgeZh} · 中正得人,寒門猶有一線`,
    badgeEn: `${base.badgeEn} · an upright Rectifier keeps a door open`,
  };
}

/**
 * Whether a realm may adopt a system at all.
 *
 *   九品中正 needs a court large enough to be worth grading (≥5 cities) and a
 *   man fit to be Rectifier (政治 ≥ 60).
 *   開科取士 needs somewhere to examine them: a 太學 (grandacademy).
 */
export function selectionAvailable(sys: SelectionSystem, ctx: {
  cityCount: number;
  hasRectifier: boolean;
  hasGrandAcademy: boolean;
}): { ok: boolean; reasonZh?: string; reasonEn?: string } {
  if (sys === 'jiupin') {
    if (ctx.cityCount < 5) return { ok: false, reasonZh: '疆土未廣(需 5 城),中正無所施', reasonEn: 'Needs 5 cities' };
    if (!ctx.hasRectifier) return { ok: false, reasonZh: '朝中無人可任中正(需政治 ≥60 之臣)', reasonEn: 'Needs an officer with Politics ≥ 60' };
  }
  if (sys === 'keju' && !ctx.hasGrandAcademy) {
    return { ok: false, reasonZh: '未建太學,無所考校', reasonEn: 'Needs a 太學 (Grand Academy)' };
  }
  return { ok: true };
}

/** Per-season loyalty drift this system applies to one officer. */
export function selectionLoyaltyDrift(eff: SelectionEffects, o: Officer): number {
  if (isAristocrat(o)) return eff.aristocratLoyalty;
  if (isCommoner(o)) return eff.commonerLoyalty;
  return 0;
}
