import type { Officer } from '../types';
import type { DebatePersona } from './wordWar';

/**
 * 文辯修煉 — the war of words' mirror of §6.10 武學: a per-officer progression
 * track for 舌戰, distinct from raw 智力/魅力. A debater deepens the 修為
 * (scholarship) of their 學派 (school) by 講席 drilling and hard-won 論戰頓悟,
 * spending 心得 (insight) earned at the lectern. High 修為 tells in EVERY bout:
 * the tongue is sharper, the opening 氣勢 banked, the composure deeper.
 *
 * This module reads ONLY the officer's own fields (debateXiuwei / debateInsight)
 * so it never depends on wordWar.ts at runtime — wordWar imports the bonus reads
 * here (one direction), and DebatePersona is a type-only import. No cycle.
 */

/** 學派 — one debating school per persona (see wordWar.debatePersona). */
export type DebateSchool = DebatePersona;

export interface DebateSchoolInfo { zh: string; en: string; }
export const DEBATE_SCHOOL: Record<DebateSchool, DebateSchoolInfo> = {
  sage:   { zh: '經學', en: 'Classicist' },   // 智者 — 引經據典,義理服人
  fierce: { zh: '骨鯁', en: 'Remonstrator' }, // 猛士 — 直言厲叱,氣奪其人
  sly:    { zh: '縱橫', en: 'Zongheng' },     // 奸雄 — 捭闔機詐,轉圜利害
};
/** The named school for a debater's persona (callers pass debatePersona(o)). */
export function debateSchoolName(p: DebatePersona): DebateSchoolInfo {
  return DEBATE_SCHOOL[p];
}

// ─── 修為 tiers ──────────────────────────────────────────────────────────────
// 修為 is a 0–100 track; six tiers gate the bonuses. A drilled tongue argues
// above its stat line, and a 辯聖 carries a real edge into every hall.
export type DebateTier = 0 | 1 | 2 | 3 | 4 | 5;
export interface DebateTierInfo { tier: DebateTier; zh: string; en: string; min: number; }
export const DEBATE_TIERS: DebateTierInfo[] = [
  { tier: 0, zh: '未通文墨', en: 'Untutored', min: 0 },
  { tier: 1, zh: '開蒙',     en: 'Novice',    min: 15 },
  { tier: 2, zh: '通經',     en: 'Versed',    min: 35 },
  { tier: 3, zh: '雄辯',     en: 'Eloquent',  min: 60 },
  { tier: 4, zh: '名士',     en: 'Luminary',  min: 82 },
  { tier: 5, zh: '辯聖',     en: 'Sage of Debate', min: 96 },
];
export const DEBATE_XIUWEI_MAX = 100;

/** The bonuses a given tier lends in a bout. */
export interface DebateArtsBonus {
  /** 修為入辯 — fixed 口才 folded into the bout prowess. */
  prowess: number;
  /** 腹稿 — banked 氣勢 the debater opens the bout with. */
  openingMomentum: number;
  /** 養氣 — extra 沉著 (composure) the debater opens with. */
  composure: number;
}
const TIER_BONUS: Record<DebateTier, DebateArtsBonus> = {
  0: { prowess: 0,  openingMomentum: 0, composure: 0 },
  1: { prowess: 2,  openingMomentum: 0, composure: 0 },
  2: { prowess: 4,  openingMomentum: 1, composure: 4 },
  3: { prowess: 7,  openingMomentum: 1, composure: 6 },
  4: { prowess: 10, openingMomentum: 2, composure: 8 },
  5: { prowess: 14, openingMomentum: 2, composure: 12 },
};

/** An officer's raw 文辯修為 (0..100). */
export function debateXiuwei(o: Officer): number {
  return Math.max(0, Math.min(DEBATE_XIUWEI_MAX, o.debateXiuwei ?? 0));
}
/** An officer's spendable 文辯心得. */
export function debateInsight(o: Officer): number {
  return Math.max(0, o.debateInsight ?? 0);
}
/** The 修為 tier a raw value falls in. */
export function tierOfDebateXiuwei(xiuwei: number): DebateTierInfo {
  let info = DEBATE_TIERS[0];
  for (const t of DEBATE_TIERS) if (xiuwei >= t.min) info = t;
  return info;
}
/** An officer's 文辯修為 tier. */
export function debateArtsTier(o: Officer): DebateTierInfo {
  return tierOfDebateXiuwei(debateXiuwei(o));
}
/** The bout bonuses an officer's 文辯修為 lends. */
export function debateArtsBonus(o: Officer): DebateArtsBonus {
  return TIER_BONUS[debateArtsTier(o).tier];
}

// ─── 講席 — spend 心得 to raise 修為 ─────────────────────────────────────────
export const DEBATE_TRAIN_STEP = 5; // 修為 gained per 講席 session

/** 心得 needed for one 講席 session — dearer the higher the 修為 already climbs. */
export function debateTrainCost(xiuwei: number): number {
  return 4 + tierOfDebateXiuwei(xiuwei).tier * 4; // 4 / 8 / 12 / 16 / 20 / 24
}

export interface DebateTrainResult { xiuwei: number; insight: number; gained: number; tierUp: DebateTierInfo | null; }
/** Apply one 講席 session: spend 心得 for +修為. Returns the new values (pure).
 *  Returns null if there isn't enough 心得 or 修為 is already maxed. */
export function trainDebateArts(o: Officer): DebateTrainResult | null {
  const xw = debateXiuwei(o);
  if (xw >= DEBATE_XIUWEI_MAX) return null;
  const cost = debateTrainCost(xw);
  const have = debateInsight(o);
  if (have < cost) return null;
  const beforeTier = tierOfDebateXiuwei(xw).tier;
  const nextXw = Math.min(DEBATE_XIUWEI_MAX, xw + DEBATE_TRAIN_STEP);
  const afterTierInfo = tierOfDebateXiuwei(nextXw);
  return {
    xiuwei: nextXw,
    insight: have - cost,
    gained: nextXw - xw,
    tierUp: afterTierInfo.tier > beforeTier ? afterTierInfo : null,
  };
}

// ─── 名士傳道 — a luminary hands their learning down ─────────────────────────
// A 名士+ (tier ≥4) may spend 心得 to lecture a junior directly: the pupil gains
// 修為 without the lectern grind. Same-school pupils learn faster, and a bonded
// 師徒 pair (pupil.mentorId === master.id) faster still — but no pupil is taught
// past the shadow of their teacher (capped short of the master's own 修為).

export const DEBATE_TRANSMIT_COST = 6;      // 心得 the master spends per session
export const DEBATE_TRANSMIT_BASE_GAIN = 8; // pupil 修為 gained (before bonuses)

export function canTransmitScholarship(master: Officer, pupil: Officer): { ok: boolean; reason?: string } {
  if (master.id === pupil.id) return { ok: false, reason: 'self' };
  if (debateArtsTier(master).tier < 4) return { ok: false, reason: 'not-luminary' };
  if (debateInsight(master) < DEBATE_TRANSMIT_COST) return { ok: false, reason: 'no-insight' };
  if (debateXiuwei(pupil) >= debateXiuwei(master) - 10) return { ok: false, reason: 'pupil-too-advanced' };
  return { ok: true };
}

/** 修為 a session confers: base + 同派 (same debating school) + 師徒 bond. */
export function scholarshipGain(sameSchool: boolean, mentorPair: boolean): number {
  return DEBATE_TRANSMIT_BASE_GAIN + (sameSchool ? 2 : 0) + (mentorPair ? 4 : 0);
}

export interface ScholarshipResult { pupilXiuwei: number; masterInsight: number; gained: number; tierUp: DebateTierInfo | null; }
/** Apply one 傳道 session (pure). Returns null if the gate fails. The pupil is
 *  never taught past (master's 修為 − 5) — the learning's edge stays the teacher's. */
export function transmitScholarship(master: Officer, pupil: Officer, sameSchool: boolean, mentorPair: boolean): ScholarshipResult | null {
  if (!canTransmitScholarship(master, pupil).ok) return null;
  const before = debateXiuwei(pupil);
  const beforeTier = tierOfDebateXiuwei(before).tier;
  const cap = Math.min(DEBATE_XIUWEI_MAX, debateXiuwei(master) - 5);
  const after = Math.min(cap, before + scholarshipGain(sameSchool, mentorPair));
  const afterInfo = tierOfDebateXiuwei(after);
  return {
    pupilXiuwei: after,
    masterInsight: debateInsight(master) - DEBATE_TRANSMIT_COST,
    gained: after - before,
    tierUp: afterInfo.tier > beforeTier ? afterInfo : null,
  };
}

// ─── 論戰頓悟 — a hard-won debate deepens a scholar's learning ────────────────
// A clean spar wins a little 心得; a bout hard-fought — a much keener tongue
// bested, a win on the last shred of composure, or a famed name felled — can
// spark a 頓悟 for a deeper draught.
export interface DebateEpiphanyInput {
  won: boolean;
  /** foeProwess − myProwess (positive = you out-argued a keener tongue). */
  prowessGap: number;
  /** true if you finished on a sliver of 沉著 (a near-run thing). */
  survivedThin?: boolean;
  /** true against a named 名士 / famed scholar (a bout that tests you). */
  notableFoe?: boolean;
  /** 清談 spar vs a real stakes-bearing 舌戰 — spars teach a touch less. */
  spar?: boolean;
}
export interface DebateEpiphanyResult { insight: number; epiphany: boolean; noteZh: string; noteEn: string; }

/** How much 心得 a bout yields, and whether it sparked a 頓悟 (bonus + a note). */
export function checkDebateEpiphany(input: DebateEpiphanyInput, rng: () => number = Math.random): DebateEpiphanyResult {
  if (!input.won) {
    // Even a loss teaches — you learn most from those who out-argue you.
    return { insight: 1, epiphany: false, noteZh: '理屈之後,反覆推敲,略有所得', noteEn: 'bested in argument — yet the loss teaches a little' };
  }
  let insight = input.spar ? 1 : 2;
  const hard = input.prowessGap >= 10;      // out-argued a clearly keener tongue
  const thin = !!input.survivedThin;         // won by a hair
  const notable = !!input.notableFoe;        // a famed scholar
  let epiphany = false;
  if (hard || thin || notable) {
    const p = Math.min(0.9, 0.3 + (hard ? 0.3 : 0) + (thin ? 0.2 : 0) + (notable ? 0.25 : 0) + Math.max(0, input.prowessGap) * 0.01);
    if (rng() < p) { epiphany = true; insight += 5 + Math.round(rng() * 3); }
  }
  return epiphany
    ? { insight, epiphany: true, noteZh: '激辯之中豁然貫通,文思泉湧!', noteEn: 'mid-argument the pattern opens — an epiphany deepens your learning!' }
    : { insight, epiphany: false, noteZh: '一辯之後,辭鋒略有所進', noteEn: 'the bout hones your tongue a touch' };
}
