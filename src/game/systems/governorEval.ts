import type { Appointment, City, EntityId, Officer } from '../types';
import { cityEconCap } from './citySize';

/**
 * 考課 — the annual performance review of appointed governors (太守). A seat's
 * health is read as a proxy for its prefect's stewardship: a thriving, loyal,
 * well-garrisoned, full-coffered city marks a 上 (superior) official; a
 * neglected one marks a 下 (inferior) one. The grade then feeds back as
 * loyalty (賞罰): able stewards grow content, failures grow restless — and a
 * chronically failing prefect drifts toward the defection threshold the
 * ordinary loyalty rules already enforce.
 */
export type KaoKeGrade = 'shang' | 'zhong' | 'xia'; // 上 / 中 / 下

export interface GovernorReview {
  officerId: EntityId;
  cityId: EntityId;
  score: number; // 0..100
  grade: KaoKeGrade;
}

/** Score one governor's seat. Pure. 0..100. */
export function scoreGovernorSeat(city: City, governor: Officer): number {
  const econCap = cityEconCap(city);
  // Coffers & granary relative to what a city this size can hold.
  const coffer = Math.min(1, city.gold / Math.max(1, econCap));
  const granary = Math.min(1, city.food / Math.max(1, econCap * 1.5));
  // Garrison relative to a healthy 20k benchmark.
  const garrison = Math.min(1, city.troops / 20000);
  // Order in the streets.
  const order = Math.min(1, city.loyalty / 100);
  // The steward's own administrative calibre.
  const calibre = Math.min(1, governor.stats.politics / 100);
  const score =
    order * 34 + coffer * 22 + granary * 16 + garrison * 14 + calibre * 14;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function gradeFromScore(score: number): KaoKeGrade {
  if (score >= 66) return 'shang';
  if (score >= 38) return 'zhong';
  return 'xia';
}

export const GRADE_NAME: Record<KaoKeGrade, { zh: string; en: string }> = {
  shang: { zh: '上考', en: 'Superior' },
  zhong: { zh: '中考', en: 'Satisfactory' },
  xia: { zh: '下考', en: 'Inferior' },
};

/** Loyalty 賞罰 a grade earns its governor. */
export const GRADE_LOYALTY: Record<KaoKeGrade, number> = {
  shang: 4,
  zhong: 0,
  xia: -4,
};

export interface GovernorEvalResult {
  officers: Record<EntityId, Officer>;
  reviews: GovernorReview[];
  entries: Array<{ cityId: EntityId; text: string; textZh: string }>;
}

/**
 * Review every seated 太守 (prefect) and apply the loyalty 賞罰. Pure; the
 * caller commits. Only prefects with a still-held seat in their force are graded.
 */
export function evaluateGovernors(input: {
  appointments: Appointment[];
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  /** Only review this force's prefects (e.g. the player's), or all if omitted. */
  forceId?: EntityId | null;
}): GovernorEvalResult {
  const officers = { ...input.officers };
  const reviews: GovernorReview[] = [];
  const entries: GovernorEvalResult['entries'] = [];

  for (const appt of input.appointments) {
    if (appt.titleId !== 'prefect' || !appt.cityId) continue;
    if (input.forceId && appt.forceId !== input.forceId) continue;
    const city = input.cities[appt.cityId];
    const gov = officers[appt.officerId];
    if (!city || !gov) continue;
    if (gov.status === 'dead' || gov.status === 'imprisoned') continue;
    if (city.ownerForceId !== appt.forceId) continue; // seat lost — no review

    const score = scoreGovernorSeat(city, gov);
    const grade = gradeFromScore(score);
    reviews.push({ officerId: gov.id, cityId: city.id, score, grade });

    const delta = GRADE_LOYALTY[grade];
    if (delta !== 0) {
      officers[gov.id] = { ...gov, loyalty: Math.max(0, Math.min(100, gov.loyalty + delta)) };
    }
    const gn = GRADE_NAME[grade];
    entries.push({
      cityId: city.id,
      text: `考課 (annual review): ${gov.name.en}, prefect of ${city.name.en} — ${gn.en} (${score}). Loyalty ${delta >= 0 ? '+' : ''}${delta}.`,
      textZh: `考課:${city.name.zh}太守 ${gov.name.zh} 評 ${gn.zh}(${score}),忠誠 ${delta >= 0 ? '+' : ''}${delta}。`,
    });
  }

  return { officers, reviews, entries };
}
