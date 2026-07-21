/**
 * 軍中疫疾 (§5.15) — what actually destroyed the armies of this period.
 *
 * 曹公至赤壁, 與備戰不利, 於是大疫, 吏士多死者, 乃引軍還. The single most famous
 * campaign of the era was decided by disease, and the chronicles are full of the
 * same sentence: an army sat in one place too long, in the wrong season, in the
 * wrong country, and dissolved without a battle.
 *
 * The game already models a besieging camp's hunger, its cold and its fatigue.
 * It has never modelled the thing that killed more soldiers than all of them:
 * a standing camp of tens of thousands with no drains.
 *
 *   — Risk climbs with how long the column has been in the field and with sheer
 *     size (a big camp is a worse camp);
 *   — summer and marsh/river ground are the classic conditions;
 *   — a southern campaign fought by northerners is the 赤壁 case: 不習水土;
 *   — a physician in the train and 藥材 in the baggage cut it down hard.
 *
 * Deterministic given the rng passed in. Pure; resolution.ts rolls it once per
 * season for each column that is holding or besieging.
 */
import type { Season } from '../types';

/** Seasons in the field before sickness is a serious concern at all. */
export const CAMP_GRACE_SEASONS = 2;

const SEASON_WEIGHT: Record<Season, number> = {
  spring: 0.9,
  summer: 1.5,   // 暑疫
  autumn: 0.8,
  winter: 1.1,   // cold camps sicken too, differently
};

export interface CampRiskInput {
  /** Seasons this column has been standing in the field. */
  seasonsInField: number;
  troops: number;
  season: Season;
  /** Camped on marsh, river or shore — the classic ground for it. */
  wetGround?: boolean;
  /** 不習水土 — a northern army campaigning in the far south (or vice versa). */
  alienClimate?: boolean;
  /** Best 智力 in the column — the man who knows to boil the water. */
  physicianIntellect?: number;
  /** 藥材 carried with the baggage. */
  medicine?: number;
  /** The camp is already starving — hunger and sickness compound. */
  starving?: boolean;
}

/** Chance this column is struck this season, 0–0.40. */
export function campSicknessRisk(input: CampRiskInput): number {
  const idle = Math.max(0, input.seasonsInField - CAMP_GRACE_SEASONS);
  if (idle <= 0) return 0;
  let risk = Math.min(0.26, idle * 0.045);
  risk *= SEASON_WEIGHT[input.season];
  // A camp of eighty thousand is not four camps of twenty thousand.
  risk *= 1 + Math.min(0.6, Math.max(0, input.troops - 20000) / 100000);
  if (input.wetGround) risk *= 1.4;
  if (input.alienClimate) risk *= 1.35;   // 不習水土
  if (input.starving) risk *= 1.3;
  // 良醫在軍 — someone who knows what to do about it.
  const care = Math.min(0.5, Math.max(0, (input.physicianIntellect ?? 0) - 60) / 90)
    + (Math.max(0, input.medicine ?? 0) >= input.troops * 0.05 ? 0.25 : 0);
  risk *= 1 - Math.min(0.7, care);
  return Math.max(0, Math.min(0.4, Math.round(risk * 1000) / 1000));
}

export interface CampPlagueResult {
  struck: boolean;
  /** Men lost to sickness. */
  lost: number;
  /** 藥材 spent fighting it. */
  medicineUsed: number;
  /** Added campaign fatigue. */
  fatigue: number;
}

/**
 * Roll it. A strike costs 6–14% of the column, less where there is medicine to
 * spend on it — and the medicine is spent whether or not it saves anyone.
 */
export function rollCampPlague(
  input: CampRiskInput,
  rng: () => number,
): CampPlagueResult {
  const risk = campSicknessRisk(input);
  if (risk <= 0 || rng() >= risk) {
    return { struck: false, lost: 0, medicineUsed: 0, fatigue: 0 };
  }
  const stock = Math.max(0, input.medicine ?? 0);
  const wanted = Math.round(input.troops * 0.05);
  const medicineUsed = Math.min(stock, wanted);
  const dosed = wanted > 0 ? medicineUsed / wanted : 0;
  const frac = 0.14 - dosed * 0.08;              // 14% untreated → 6% with medicine
  return {
    struck: true,
    lost: Math.max(1, Math.round(input.troops * frac)),
    medicineUsed,
    fatigue: 8,
  };
}

export function campSicknessTier(risk: number): { zh: string; en: string } {
  if (risk >= 0.25) return { zh: '疫氣大作', en: 'Plague in the camp' };
  if (risk >= 0.12) return { zh: '營中多病', en: 'Sickness spreading' };
  if (risk > 0) return { zh: '略有病卒', en: 'A few sick' };
  return { zh: '營中無恙', en: 'Camp healthy' };
}
