import type { Officer } from '../types';
import { effectiveStats } from './traitEffects';
import { totalLevel } from './growth';

/**
 * 品階 — an at-a-glance quality tier for an officer, derived from their
 * *effective* stats (base + traits + equipment). It is descriptive, not a
 * separate upgrade currency: as an officer's stats climb through leveling and
 * training, their grade climbs 鐵 → 銅 → 銀 → 金 with them. Weighted toward the
 * officer's single best stat (a one-trick specialist still reads as elite) with
 * the average as a tie-breaker so well-rounded officers aren't undersold.
 */
export type OfficerGrade = 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'iron';

export interface GradeInfo {
  grade: OfficerGrade;
  /** 0–100ish blended score the tier was cut from. */
  score: number;
  name: { zh: string; en: string };
  /** Short rank label in the RTK 一流/二流 idiom. */
  rank: { zh: string; en: string };
  color: string;
}

const GRADE_META: Record<OfficerGrade, Omit<GradeInfo, 'grade' | 'score'>> = {
  diamond:  { name: { zh: '鑽石', en: 'Diamond' },  rank: { zh: '神品', en: 'Mythic' },   color: '#8ee8ff' },
  platinum: { name: { zh: '白金', en: 'Platinum' }, rank: { zh: '超一流', en: 'Peerless' }, color: '#eaf0f4' },
  gold:     { name: { zh: '金牌', en: 'Gold' },     rank: { zh: '一流', en: 'Elite' },    color: '#e6c473' },
  silver:   { name: { zh: '銀牌', en: 'Silver' },   rank: { zh: '二流', en: 'Veteran' },  color: '#cfd8e0' },
  bronze:   { name: { zh: '銅牌', en: 'Bronze' },   rank: { zh: '三流', en: 'Capable' },  color: '#c8884e' },
  iron:     { name: { zh: '鐵牌', en: 'Iron' },     rank: { zh: '末流', en: 'Green' },    color: '#7a8893' },
};

/** Blended quality score: 55% best stat, 45% average across the five, plus a
 *  capped 戰功威望 (renown) bonus so deeds — not only raw stats — push an
 *  officer up a 品階 (晉品評定). */
export function gradeScore(officer: Officer): number {
  const s = effectiveStats(officer);
  const vals = [s.leadership, s.war, s.intelligence, s.politics, s.charisma];
  const max = Math.max(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  // Diminishing returns, capped at +8 (≈ enough to cross one tier near a
  // boundary): ~64 renown to max it, so it's a long campaign's reward.
  const renownBonus = Math.min(8, Math.sqrt(Math.max(0, officer.renown ?? 0)));
  return Math.round(max * 0.55 + avg * 0.45 + renownBonus);
}

export function gradeFromScore(score: number): OfficerGrade {
  // 白金/鑽石 sit above 金牌 — natural stats top out around 金, so these upper
  // tiers are reached mainly by well-rounded legends and 轉生/突破 growth.
  if (score >= 110) return 'diamond';
  if (score >= 100) return 'platinum';
  if (score >= 92) return 'gold';
  if (score >= 82) return 'silver';
  if (score >= 70) return 'bronze';
  return 'iron';
}

/** Ascending tier order — lets callers tell whether one grade outranks another. */
const GRADE_ORDER: OfficerGrade[] = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
export function gradeRank(grade: OfficerGrade): number {
  return GRADE_ORDER.indexOf(grade);
}

/** Display meta (name/rank/color) for a bare grade key — no officer needed. */
export function gradeMeta(grade: OfficerGrade): Omit<GradeInfo, 'grade' | 'score'> {
  return GRADE_META[grade];
}

export function officerGrade(officer: Officer): GradeInfo {
  const score = gradeScore(officer);
  const grade = gradeFromScore(score);
  return { grade, score, ...GRADE_META[grade] };
}

/**
 * 歷練 — the officer's overall level. This is the single canonical level used
 * for display *and* for gating (e.g. duel-move unlocks). An explicit
 * `officer.level` (set by scenario data / the custom-officer creator / tests)
 * always wins; otherwise it's derived from capability (品階 score) plus growth
 * level, so it rises as the officer trains and seasons in battle.
 *
 * Scale is roughly 1–25: a green recruit lands ~6–8, a solid officer ~12–15,
 * an elite ~16–20 — which is what the duel skill-tree thresholds
 * (taunt 3 / thrust 6 / combo 10 / 必殺 14) were cut against.
 */
export function officerLevel(officer: Officer): number {
  if (officer.level !== undefined) return officer.level;
  return Math.max(1, Math.round(gradeScore(officer) / 5) + totalLevel(officer.xp ?? 0));
}
