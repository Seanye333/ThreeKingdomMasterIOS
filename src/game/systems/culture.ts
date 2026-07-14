/**
 * 文教 — a city's cultural renown (City.culture, 0–100). Schools under a learned
 * governor raise it; without schools it fades. High 文教 curbs corruption
 * (教化息貪) and steadies loyalty (民安其教); a 文化名城 (≥60) is a jewel of the
 * realm. Pure helpers, shared by the civic tick (resolution) and the UI.
 */

export const CULTURE_MAX = 100;
export const CULTURE_FAMED = 60;

/** Season change in 文教: +1..3 with a school (scaled by the best mind present),
 *  −1 (slow fade) without one. */
export function cultureGain(hasSchool: boolean, bestIntellect: number): number {
  return hasSchool ? Math.min(3, Math.max(1, Math.round(1 + bestIntellect / 50))) : -1;
}

/** Corruption-accrual multiplier from 文教 — an educated city resists graft
 *  (down to −35% at full 文教). */
export function cultureGraftCurb(culture: number): number {
  return 1 - Math.min(0.35, Math.max(0, culture) / 100 * 0.35);
}

/** A small per-season loyalty lift once the city is a 文化名城 (≥60). */
export function cultureLoyaltyLift(culture: number): number {
  return culture >= CULTURE_FAMED ? 1 : 0;
}

export interface CultureTier { tier: 0 | 1 | 2 | 3; zh: string; en: string }

export function cultureTier(value: number): CultureTier {
  if (value >= CULTURE_FAMED) return { tier: 3, zh: '文化名城', en: 'Cultural Jewel' };
  if (value >= 30) return { tier: 2, zh: '文教興隆', en: 'Flourishing' };
  if (value >= 1) return { tier: 1, zh: '初興文教', en: 'Rising' };
  return { tier: 0, zh: '文教未興', en: 'Untutored' };
}
