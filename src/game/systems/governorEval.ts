import type { Appointment, City, EntityId, Officer } from '../types';
import type { ProvinceId } from '../types/province';
import { cityEconCap } from './citySize';
import { grantXp } from './growth';
import { PROVINCES_BY_ID, PROVINCE_BY_CITY } from '../data/provinces';

/**
 * 考課 — the annual performance review of appointed governors (太守). A seat's
 * health is read as a proxy for its prefect's stewardship: a thriving, loyal,
 * well-garrisoned, full-coffered city marks a 上 (superior) official; a
 * neglected one marks a 下 (inferior) one. The grade then feeds back as
 * loyalty (賞罰), 考績陞遷 XP, and 威望 (renown) for the abler stewards.
 *
 * 考課做活 — the review is no longer a blind yearly tick:
 *   • 殿最閉環   — 連續考績 streaks compound: chronic 下考 bleeds loyalty
 *                  faster and (for AI realms) ends in 罷免換賢; sustained
 *                  上考 grooms a steward (renown + extra XP toward 品階).
 *   • 因城而異   — a frontier seat is judged more on its garrison & walls,
 *                  a heartland seat more on its coffers & people.
 *   • 治世之效   — a realm whose stewards all earn 上考 gains 天命 (mandate);
 *                  the single best steward in the land is 表彰 (天下治最).
 * A chronically failing prefect still drifts toward the defection threshold
 * the ordinary loyalty rules already enforce.
 */
export type KaoKeGrade = 'shang' | 'zhong' | 'xia'; // 上 / 中 / 下

export interface GovernorReview {
  officerId: EntityId;
  cityId: EntityId;
  score: number; // 0..100
  grade: KaoKeGrade;
}

/** The full breakdown behind a seat's score — drives the 考課 panel bars. */
export interface SeatScoreDetail {
  score: number;
  grade: KaoKeGrade;
  frontier: boolean;
  /** Weighted points each pillar contributed (already × its weight). */
  parts: { order: number; coffer: number; granary: number; garrison: number; defense: number; calibre: number };
  /** Raw 0..1 fill of each pillar, for bar rendering. */
  fill: { order: number; coffer: number; granary: number; garrison: number; defense: number; calibre: number };
  graft: number;        // corruption 0..100
  graftPenalty: number; // points subtracted
}

/** 因城而異 — frontier seats are weighed toward the spear, heartland toward
 *  the plough. Heartland weights are the historical 5-pillar formula (so a
 *  non-frontier seat scores exactly as before; defense unused). */
const W_HEARTLAND = { order: 34, coffer: 22, granary: 16, garrison: 14, defense: 0, calibre: 14 };
const W_FRONTIER = { order: 26, coffer: 14, granary: 12, garrison: 24, defense: 10, calibre: 14 };

/** A seat is a 邊城 if it borders a city held by another force (or unowned). */
export function isFrontierCity(city: City, cities: Record<EntityId, City>): boolean {
  for (const adj of city.adjacentCityIds ?? []) {
    const nb = cities[adj];
    if (nb && nb.ownerForceId !== city.ownerForceId) return true;
  }
  return false;
}

/** Score one governor's seat, with the full breakdown. Pure. 0..100. */
export function scoreGovernorSeatDetail(city: City, governor: Officer, frontier = false): SeatScoreDetail {
  const econCap = cityEconCap(city);
  const fill = {
    order: Math.min(1, city.loyalty / 100),
    coffer: Math.min(1, city.gold / Math.max(1, econCap)),
    granary: Math.min(1, city.food / Math.max(1, econCap * 1.5)),
    garrison: Math.min(1, city.troops / 20000),         // healthy 20k benchmark
    defense: Math.min(1, (city.defense ?? 0) / 150),    // ramparts toward the cap
    calibre: Math.min(1, governor.stats.politics / 100),
  };
  const w = frontier ? W_FRONTIER : W_HEARTLAND;
  const parts = {
    order: fill.order * w.order,
    coffer: fill.coffer * w.coffer,
    granary: fill.granary * w.granary,
    garrison: fill.garrison * w.garrison,
    defense: fill.defense * w.defense,
    calibre: fill.calibre * w.calibre,
  };
  const raw = parts.order + parts.coffer + parts.granary + parts.garrison + parts.defense + parts.calibre;
  // 貪墨之累 — graft on the steward's watch drags the review down (up to −15 at
  // full corruption). A clean-handed prefect is judged the higher for it.
  const graft = city.corruption ?? 0;
  const graftPenalty = graft * 0.15;
  const score = Math.round(Math.max(0, Math.min(100, raw - graftPenalty)));
  return { score, grade: gradeFromScore(score), frontier, parts, fill, graft, graftPenalty };
}

/** Score one governor's seat. Pure. 0..100. (Heartland weighting.) */
export function scoreGovernorSeat(city: City, governor: Officer, frontier = false): number {
  return scoreGovernorSeatDetail(city, governor, frontier).score;
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

/** Base loyalty 賞罰 a grade earns its governor (before streak scaling). */
export const GRADE_LOYALTY: Record<KaoKeGrade, number> = {
  shang: 4,
  zhong: 0,
  xia: -4,
};

/** 考績陞遷 — base XP a grade earns its governor. Steers toward 政治. */
export const GRADE_XP: Record<KaoKeGrade, number> = {
  shang: 16,
  zhong: 4,
  xia: 0,
};

/** 連續 N 年下考 → the post is forfeit (AI realms 罷免換賢 automatically;
 *  the player is merely flagged, to 親裁 黜陟 as they see fit). */
export const CHRONIC_FAIL_STREAK = 3;

export interface GovernorRevocation {
  officerId: EntityId;
  cityId: EntityId;
  forceId: EntityId;
}

export interface GovernorEvalResult {
  officers: Record<EntityId, Officer>;
  reviews: GovernorReview[];
  entries: Array<{ cityId: EntityId; text: string; textZh: string }>;
  /** Updated 連續考績 streaks (signed: +N consecutive 上考, −N consecutive 下考). */
  streaks: Record<EntityId, number>;
  /** Seats forfeit to chronic failure (AI only — the player decides their own). */
  revoked: GovernorRevocation[];
  /** 治世之效 — 天命 nudges for realms of able stewards, keyed by forceId. */
  mandateDeltas: Record<EntityId, number>;
  /** This year's grade per officer, for the panel + 親裁. */
  reviewLast: Record<EntityId, { score: number; grade: KaoKeGrade; year: number }>;
}

/**
 * Review every seated 太守 (prefect) and apply the 賞罰. Pure; the caller
 * commits. Only prefects with a still-held seat in their force are graded.
 */
export function evaluateGovernors(input: {
  appointments: Appointment[];
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  /** Only review this force's prefects (e.g. the player's), or all if omitted. */
  forceId?: EntityId | null;
  /** Whose chronic failures are flagged (親裁) rather than auto-罷免. */
  playerForceId?: EntityId | null;
  /** Prior 連續考績 streaks, to compound. */
  streaks?: Record<EntityId, number>;
  /** Year stamp for the 去年考績 record. */
  year?: number;
  /** 牧守一體 — province governors (provinceId → officerId): a capable 州牧
   *  lifts his prefects' 考課 (督課), and is himself judged by their aggregate
   *  showing (政績歸牧). */
  provinceGovernors?: Partial<Record<ProvinceId, EntityId>>;
  rng?: () => number;
}): GovernorEvalResult {
  const officers = { ...input.officers };
  const rng = input.rng ?? Math.random;
  const reviews: GovernorReview[] = [];
  const entries: GovernorEvalResult['entries'] = [];
  const streaks: Record<EntityId, number> = { ...(input.streaks ?? {}) };
  const revoked: GovernorRevocation[] = [];
  const mandateDeltas: Record<EntityId, number> = {};
  const reviewLast: GovernorEvalResult['reviewLast'] = {};
  const year = input.year ?? 0;

  // Per-force tally for 治世之效, plus the realm-wide best for 天下治最.
  const tally: Record<EntityId, { shang: number; total: number }> = {};
  let topGov: { officerId: EntityId; cityName: { zh: string; en: string }; score: number } | null = null;

  for (const appt of input.appointments) {
    if (appt.titleId !== 'prefect' || !appt.cityId) continue;
    if (input.forceId && appt.forceId !== input.forceId) continue;
    const city = input.cities[appt.cityId];
    const gov = officers[appt.officerId];
    if (!city || !gov) continue;
    if (gov.status === 'dead' || gov.status === 'imprisoned') continue;
    if (city.ownerForceId !== appt.forceId) continue; // seat lost — no review

    const frontier = isFrontierCity(city, input.cities);
    const detail = scoreGovernorSeatDetail(city, gov, frontier);
    let score = detail.score;
    let grade = detail.grade;
    // 州牧督課 — a capable same-realm 州牧 over this city's province backstops
    // the seat, lifting the review (up to +5 at a masterful steward).
    const supId = input.provinceGovernors?.[PROVINCE_BY_CITY[city.id] as ProvinceId];
    const sup = supId ? officers[supId] : null;
    if (sup && sup.id !== gov.id && sup.forceId === appt.forceId
        && sup.status !== 'dead' && sup.status !== 'imprisoned') {
      const oversight = Math.min(5, Math.max(0, Math.round((sup.stats.politics * 0.6 + sup.stats.charisma * 0.4 - 60) / 8)));
      if (oversight > 0) { score = Math.min(100, score + oversight); grade = gradeFromScore(score); }
    }
    reviews.push({ officerId: gov.id, cityId: city.id, score, grade });
    reviewLast[gov.id] = { score, grade, year };

    // 連續考績 — a streak compounds with the grade, resets on a 中考.
    const prev = streaks[gov.id] ?? 0;
    let streak: number;
    if (grade === 'shang') streak = prev >= 0 ? prev + 1 : 1;
    else if (grade === 'xia') streak = prev <= 0 ? prev - 1 : -1;
    else streak = 0;
    streaks[gov.id] = streak;

    const t = (tally[appt.forceId] ??= { shang: 0, total: 0 });
    t.total += 1;
    if (grade === 'shang') t.shang += 1;
    if (!topGov || score > topGov.score) topGov = { officerId: gov.id, cityName: city.name, score };

    // 賞罰 — loyalty, 考績陞遷 XP, and 威望. A run of 下考 bleeds loyalty ever
    // faster; a run of 上考 grooms the steward (renown + extra XP toward 品階).
    let delta = GRADE_LOYALTY[grade];
    if (grade === 'xia' && streak <= -2) delta = Math.max(-10, -4 - 2 * (Math.abs(streak) - 1));
    let xp = GRADE_XP[grade];
    if (grade === 'shang' && streak >= 2) xp += Math.min(16, 8 * (streak - 1));
    let renownDelta = grade === 'shang' ? 1 : 0;
    if (grade === 'shang' && streak >= CHRONIC_FAIL_STREAK) renownDelta += 2; // 久任稱職,堪膺方面

    let updated: Officer = gov;
    if (delta !== 0) updated = { ...updated, loyalty: Math.max(0, Math.min(100, updated.loyalty + delta)) };
    if (renownDelta !== 0) updated = { ...updated, renown: (updated.renown ?? 0) + renownDelta };
    if (xp > 0) updated = grantXp(updated, xp, rng, 'politics').officer;
    if (updated !== gov) officers[gov.id] = updated;

    const gn = GRADE_NAME[grade];
    const graft = detail.graft;
    const graftEn = graft >= 40 ? ` Graft is rife here (corruption ${Math.round(graft)}).` : '';
    const graftZh = graft >= 40 ? `(此城貪腐 ${Math.round(graft)},宜肅之)` : '';
    const frontierZh = frontier ? '〔邊城·重戎守〕' : '';
    const xpNote = xp > 0 ? `, +${xp} XP` : '';
    const streakZh = streak >= 2 ? `,連 ${streak} 上考` : streak <= -2 ? `,連 ${Math.abs(streak)} 下考` : '';
    const streakEn = streak >= 2 ? ` (${streak}× 上考 streak)` : streak <= -2 ? ` (${Math.abs(streak)}× 下考 streak)` : '';

    // 連續下考至期 — the post is forfeit. AI realms 罷免換賢 on the spot; the
    // player is flagged to 親裁 instead (their officers, their call).
    const chronicFail = grade === 'xia' && streak <= -CHRONIC_FAIL_STREAK;
    const isPlayer = input.playerForceId && appt.forceId === input.playerForceId;
    if (chronicFail && !isPlayer) {
      revoked.push({ officerId: gov.id, cityId: city.id, forceId: appt.forceId });
      delete streaks[gov.id];
      entries.push({
        cityId: city.id,
        text: `考課: ${gov.name.en} forfeited the prefecture of ${city.name.en} — ${CHRONIC_FAIL_STREAK} years 下考. The seat is vacated for an abler hand.`,
        textZh: `考課:${city.name.zh}太守 ${gov.name.zh} 連 ${CHRONIC_FAIL_STREAK} 年下考,罷其任,另擇賢守。`,
      });
      continue;
    }
    const flagZh = chronicFail && isPlayer ? `(連年下考,宜親裁黜陟)` : '';
    const flagEn = chronicFail && isPlayer ? ` (chronic failure — consider 親裁.)` : '';

    entries.push({
      cityId: city.id,
      text: `考課 (annual review): ${gov.name.en}, prefect of ${city.name.en} — ${gn.en} (${score})${streakEn}. Loyalty ${delta >= 0 ? '+' : ''}${delta}${xpNote}.${graftEn}${flagEn}`,
      textZh: `考課:${frontierZh}${city.name.zh}太守 ${gov.name.zh} 評 ${gn.zh}(${score})${streakZh},忠誠 ${delta >= 0 ? '+' : ''}${delta}${xp > 0 ? `,歷練 +${xp}` : ''}。${graftZh}${flagZh}`,
    });
  }

  // 政績歸牧 — a 州牧's own 考課 is the aggregate showing of his province's
  // prefects: a province of 上考 stewards reflects a steward who governs well
  // (renown + 歷練 + content loyalty, which in turn cools his 割據); a province
  // of failures is laid at his door (失察問責).
  if (input.provinceGovernors) {
    for (const [pid, sgId] of Object.entries(input.provinceGovernors)) {
      const sg = sgId ? officers[sgId] : null;
      if (!sg || sg.status === 'dead' || sg.status === 'imprisoned') continue;
      if (input.forceId && sg.forceId !== input.forceId) continue;
      const province = PROVINCES_BY_ID[pid];
      if (!province) continue;
      const provReviews = reviews.filter((r) => PROVINCE_BY_CITY[r.cityId] === pid
        && input.cities[r.cityId]?.ownerForceId === sg.forceId);
      if (provReviews.length === 0) continue;
      const shang = provReviews.filter((r) => r.grade === 'shang').length;
      const xia = provReviews.filter((r) => r.grade === 'xia').length;
      const fracShang = shang / provReviews.length;
      const fracXia = xia / provReviews.length;
      const cur = officers[sg.id] ?? sg;
      if (fracShang >= 0.6) {
        const up = grantXp({ ...cur, loyalty: Math.min(100, cur.loyalty + 3), renown: (cur.renown ?? 0) + 2 }, 10, rng, 'politics').officer;
        officers[sg.id] = up;
        reviewLast[sg.id] = { score: Math.round(fracShang * 100), grade: 'shang', year };
        entries.push({
          cityId: '' as EntityId,
          text: `考課: ${sg.name.en}, 州牧 of ${province.name.en}, governs well — his prefects mostly earn 上考 (renown + loyalty).`,
          textZh: `考課:${province.name.zh}牧 ${sg.name.zh} 牧守有方,部屬太守多評上考 — 賜威望、歷練,忠誠 +3。`,
        });
      } else if (fracXia >= 0.5) {
        officers[sg.id] = { ...cur, loyalty: Math.max(0, cur.loyalty - 2) };
        reviewLast[sg.id] = { score: Math.round((1 - fracXia) * 100), grade: 'xia', year };
        entries.push({
          cityId: '' as EntityId,
          text: `考課: ${sg.name.en}, 州牧 of ${province.name.en}, oversees a failing province — his prefects mostly earn 下考 (失察問責).`,
          textZh: `考課:${province.name.zh}牧 ${sg.name.zh} 督課失察,部屬太守多評下考,忠誠 −2,當問其責。`,
        });
      }
    }
  }

  // 治世之效 — a realm whose seated stewards (≥2) all earned 上考 governs in
  // harmony: a small 天命 trickle. 政通人和。
  for (const [fid, t] of Object.entries(tally)) {
    if (t.total >= 2 && t.shang === t.total) {
      mandateDeltas[fid] = (mandateDeltas[fid] ?? 0) + 2;
      entries.push({
        cityId: '' as EntityId,
        text: `考課: every steward of the realm earned 上考 — 政通人和, the Mandate strengthens (+2).`,
        textZh: `考課:闔境太守皆評上考,政通人和,天命 +2。`,
      });
    }
  }

  // 天下治最 — the single finest steward in the land (≥3 reviewed) is 表彰:
  // honoured with renown, an example to all.
  if (topGov && reviews.length >= 3) {
    const honoree = officers[topGov.officerId];
    if (honoree) {
      officers[honoree.id] = { ...honoree, renown: (honoree.renown ?? 0) + 2, loyalty: Math.min(100, honoree.loyalty + 1) };
      entries.push({
        cityId: '' as EntityId,
        text: `考課: ${honoree.name.en}, prefect of ${topGov.cityName.en}, is named 天下治最 — the realm's finest steward (score ${topGov.score}).`,
        textZh: `考課:${topGov.cityName.zh}太守 ${honoree.name.zh} 考績冠絕天下,表為「天下治最」(${topGov.score})。`,
      });
    }
  }

  return { officers, reviews, entries, streaks, revoked, mandateDeltas, reviewLast };
}
