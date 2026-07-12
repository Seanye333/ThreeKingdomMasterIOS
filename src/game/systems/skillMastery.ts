import type { Officer, ReportEntry } from '../types';
import { SKILLS_BY_ID } from '../data/skills';

/**
 * 技能等級 — skills carry a mastery level 1–3 (`officer.skillLevels`,
 * missing = 1). Each level past the first amplifies the skill's numeric
 * combat effects by +15% (Lv.3 = +30%), applied centrally in combat.ts
 * effectsForOfficer and duel.ts prowessParts. Levels rise through 特訓
 * (trainSkillMastery below, rolled inside the special-training resolution)
 * — the AI trains too, so mastery stays symmetric.
 */

export const MAX_SKILL_LEVEL = 3;
export const SKILL_LEVEL_STEP = 0.15;

export function skillLevel(o: Officer, skillId: string): number {
  if (!o.skills.includes(skillId)) return 0;
  const raw = o.skillLevels?.[skillId] ?? 1;
  return Math.max(1, Math.min(MAX_SKILL_LEVEL, raw));
}

/** Multiplier on the skill's numeric combat effects (1 / 1.15 / 1.3). */
export function skillEffectMul(o: Officer, skillId: string): number {
  const lvl = skillLevel(o, skillId);
  return lvl <= 1 ? 1 : 1 + SKILL_LEVEL_STEP * (lvl - 1);
}

/** Roman numeral shown on card chips for a deepened skill ('' at Lv.1). */
export function skillLevelBadge(o: Officer, skillId: string): string {
  const lvl = skillLevel(o, skillId);
  return lvl >= 3 ? 'Ⅲ' : lvl === 2 ? 'Ⅱ' : '';
}

/**
 * 特訓精研 — a season of special training has a 35% chance to deepen one
 * known, not-yet-maxed skill a level. Returns the patched officer and a
 * report entry when it lands; null means no change.
 */
export function trainSkillMastery(
  o: Officer,
  rng: () => number,
): { officer: Officer; entry: ReportEntry } | null {
  if (rng() >= 0.35) return null;
  const climbable = o.skills.filter((sid) => SKILLS_BY_ID[sid] && skillLevel(o, sid) < MAX_SKILL_LEVEL);
  if (climbable.length === 0) return null;
  const sid = climbable[Math.floor(rng() * climbable.length)] ?? climbable[0];
  const next = skillLevel(o, sid) + 1;
  const officer: Officer = { ...o, skillLevels: { ...(o.skillLevels ?? {}), [sid]: next } };
  const sk = SKILLS_BY_ID[sid];
  const badge = next >= 3 ? 'Ⅲ' : 'Ⅱ';
  return {
    officer,
    entry: {
      cityId: o.locationCityId,
      kind: 'command-success',
      text: `${o.name.en} refined ${sk.name.en} to mastery ${badge} in special training`,
      textZh: `${o.name.zh}特訓精研「${sk.name.zh}」至 ${badge} 級,技法更純熟`,
    },
  };
}
