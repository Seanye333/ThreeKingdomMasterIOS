import type { Officer } from '../types';
import type { WeaponClass } from './duel';

/**
 * 武學修煉 — a per-officer progression track for single combat, distinct from the
 * shared 歷練 level (officerLevel). A duellist deepens the 修為 (mastery) of their
 * weapon's 流派 (school) by 演武 drilling and hard-won 頓悟 (epiphany), spending
 * 心得 (insight) earned in the arena. High 修為 tells in EVERY bout: moves come
 * sooner, the arm strikes truer, the fighter opens with the initiative banked.
 *
 * This module reads ONLY the officer's own fields (martialXiuwei / martialInsight)
 * so it never depends on duel.ts at runtime — duel.ts imports the bonus reads here
 * (one direction), and the WeaponClass is a type-only import. No cycle.
 */

/** 流派 — one martial school per weapon class. */
export type MartialSchool = WeaponClass;

export interface SchoolInfo { zh: string; en: string; }
export const MARTIAL_SCHOOL: Record<MartialSchool, SchoolInfo> = {
  sword:      { zh: '劍術', en: 'Swordplay' },
  axe:        { zh: '斧法', en: 'Axe Arts' },
  twinblade:  { zh: '雙劍', en: 'Twin-Blade' },
  glaive:     { zh: '刀法', en: 'Glaive Arts' },
  spear:      { zh: '槍法', en: 'Spearcraft' },
  halberd:    { zh: '戟法', en: 'Halberd Arts' },
  greatsword: { zh: '重兵', en: 'Great-Arm' },
  bow:        { zh: '弓道', en: 'Archery' },
};
/** The named school for a fighter's weapon (callers pass weaponClassFor(o)). */
export function martialSchoolName(cls: WeaponClass): SchoolInfo {
  return MARTIAL_SCHOOL[cls];
}

// ─── 修為 tiers ──────────────────────────────────────────────────────────────
// 修為 is a 0–100 track; six tiers gate the bonuses. A raw-but-drilled fighter
// (高修為·低歷練) fields the flourish moves a green recruit can't, and a 宗師
// carries a real edge into every duel.
export type MartialTier = 0 | 1 | 2 | 3 | 4 | 5;
export interface MartialTierInfo { tier: MartialTier; zh: string; en: string; min: number; }
export const MARTIAL_TIERS: MartialTierInfo[] = [
  { tier: 0, zh: '未入門', en: 'Untrained', min: 0 },
  { tier: 1, zh: '入門',   en: 'Initiate',  min: 15 },
  { tier: 2, zh: '精熟',   en: 'Adept',     min: 35 },
  { tier: 3, zh: '大成',   en: 'Master',    min: 60 },
  { tier: 4, zh: '宗師',   en: 'Grandmaster', min: 82 },
  { tier: 5, zh: '武神',   en: 'War-God',   min: 96 },
];
export const MARTIAL_XIUWEI_MAX = 100;

/** The bonuses a given tier lends in a bout. */
export interface MartialBonus {
  /** 招式修練 — effective extra 歷練 levels for the move-unlock gate (moves sooner). */
  moveUnlockDiscount: number;
  /** 修為入勇 — fixed prowess folded into staticProwess. */
  prowess: number;
  /** 蓄勢 — banked 氣 the fighter opens the bout with. */
  openingGuard: number;
}
const TIER_BONUS: Record<MartialTier, MartialBonus> = {
  0: { moveUnlockDiscount: 0, prowess: 0,  openingGuard: 0 },
  1: { moveUnlockDiscount: 1, prowess: 2,  openingGuard: 0 },
  2: { moveUnlockDiscount: 2, prowess: 4,  openingGuard: 0 },
  3: { moveUnlockDiscount: 4, prowess: 7,  openingGuard: 1 },
  4: { moveUnlockDiscount: 6, prowess: 10, openingGuard: 1 },
  5: { moveUnlockDiscount: 8, prowess: 14, openingGuard: 2 },
};

/** An officer's raw 修為 (0..100). */
export function martialXiuwei(o: Officer): number {
  return Math.max(0, Math.min(MARTIAL_XIUWEI_MAX, o.martialXiuwei ?? 0));
}
/** An officer's spendable 心得. */
export function martialInsight(o: Officer): number {
  return Math.max(0, o.martialInsight ?? 0);
}
/** The 修為 tier a raw value falls in. */
export function tierOfXiuwei(xiuwei: number): MartialTierInfo {
  let info = MARTIAL_TIERS[0];
  for (const t of MARTIAL_TIERS) if (xiuwei >= t.min) info = t;
  return info;
}
/** An officer's 修為 tier. */
export function martialTier(o: Officer): MartialTierInfo {
  return tierOfXiuwei(martialXiuwei(o));
}
/** The bout bonuses an officer's 修為 lends. */
export function martialBonus(o: Officer): MartialBonus {
  return TIER_BONUS[martialTier(o).tier];
}

// ─── 修煉 — spend 心得 to raise 修為 ──────────────────────────────────────────
export const MARTIAL_TRAIN_STEP = 5; // 修為 gained per 修煉 session

/** 心得 needed for one 修煉 session — dearer the higher the 修為 already climbs. */
export function martialTrainCost(xiuwei: number): number {
  return 4 + tierOfXiuwei(xiuwei).tier * 4; // 4 / 8 / 12 / 16 / 20 / 24
}

export interface MartialTrainResult { xiuwei: number; insight: number; gained: number; tierUp: MartialTierInfo | null; }
/** Apply one 修煉 session: spend 心得 for +修為. Returns the new values (pure).
 *  Returns null if there isn't enough 心得 or 修為 is already maxed. */
export function trainMartialArts(o: Officer): MartialTrainResult | null {
  const xw = martialXiuwei(o);
  if (xw >= MARTIAL_XIUWEI_MAX) return null;
  const cost = martialTrainCost(xw);
  const have = martialInsight(o);
  if (have < cost) return null;
  const beforeTier = tierOfXiuwei(xw).tier;
  const nextXw = Math.min(MARTIAL_XIUWEI_MAX, xw + MARTIAL_TRAIN_STEP);
  const afterTierInfo = tierOfXiuwei(nextXw);
  return {
    xiuwei: nextXw,
    insight: have - cost,
    gained: nextXw - xw,
    tierUp: afterTierInfo.tier > beforeTier ? afterTierInfo : null,
  };
}

// ─── 苦戰頓悟 — a hard-won bout deepens a fighter's craft ─────────────────────
// A clean spar wins a little 心得; a bout hard-fought — a much stronger foe bested,
// a win by a hair, or a famed rival felled — can spark a 頓悟 for a deeper draught.
export interface EpiphanyInput {
  won: boolean;
  /** foeProwess − myProwess (positive = you beat a stronger fighter). */
  prowessGap: number;
  /** true if you finished on a sliver of 氣力 (a near-run thing). */
  survivedThin?: boolean;
  /** true against a named champion / 宿敵 (a bout that tests you). */
  notableFoe?: boolean;
  /** 演武 spar (non-lethal) vs a real 單挑 — spars teach a touch less. */
  spar?: boolean;
}
export interface EpiphanyResult { insight: number; epiphany: boolean; noteZh: string; noteEn: string; }

/** How much 心得 a bout yields, and whether it sparked a 頓悟 (bonus + a note). */
export function checkMartialEpiphany(input: EpiphanyInput, rng: () => number = Math.random): EpiphanyResult {
  if (!input.won) {
    // Even a loss teaches a little — you learn most from those who best you.
    return { insight: 1, epiphany: false, noteZh: '敗中求道,略有所得', noteEn: 'even defeat teaches — a little insight' };
  }
  let insight = input.spar ? 1 : 2;
  // Conditions that make a win instructive.
  const hard = input.prowessGap >= 10;      // bested a clearly stronger arm
  const thin = !!input.survivedThin;         // won by a hair
  const notable = !!input.notableFoe;        // a champion / rival
  let epiphany = false;
  if (hard || thin || notable) {
    // The steeper the odds, the surer the epiphany.
    const p = Math.min(0.9, 0.3 + (hard ? 0.3 : 0) + (thin ? 0.2 : 0) + (notable ? 0.25 : 0) + Math.max(0, input.prowessGap) * 0.01);
    if (rng() < p) { epiphany = true; insight += 5 + Math.round(rng() * 3); }
  }
  return epiphany
    ? { insight, epiphany: true, noteZh: '苦戰之中豁然頓悟,武學精進!', noteEn: 'the hard bout sparks an epiphany — your craft deepens!' }
    : { insight, epiphany: false, noteZh: '一戰之後,武藝略有所進', noteEn: 'the bout hones your craft a touch' };
}
