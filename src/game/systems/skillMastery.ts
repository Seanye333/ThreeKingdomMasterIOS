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
 * 技能戰效讀出 — turn a skill's `combat` block into readable lines.
 *
 * Every one of SkillCombatEffects' seven multipliers was read by combat.ts and
 * duel.ts and shown by nothing: the officer card printed the skill's flavour
 * description and its mastery badge, but never what the skill was actually
 * worth. "Is 神算 better than 鬼謀 on this officer" had no answer on screen.
 *
 * Generated from the data rather than hand-listed (the way traitMechanicalEffects
 * has to be), so a skill whose numbers are retuned reads correctly for free and
 * a new skill needs no UI change at all.
 *
 * Pass `officer` to fold in 特訓精研 mastery — the same ×1/×1.15/×1.3 combat.ts
 * applies — so the card shows what THIS officer's copy of the skill is worth,
 * not the catalogue value.
 */
export function skillCombatEffectLines(
  skillId: string,
  officer?: Officer,
): Array<{ zh: string; en: string }> {
  const c = SKILLS_BY_ID[skillId]?.combat;
  if (!c) return [];
  const mul = officer ? skillEffectMul(officer, skillId) : 1;
  const out: Array<{ zh: string; en: string }> = [];

  /** Flat point bonuses scale with mastery and read as "+N". */
  const flat = (v: number | undefined, zh: string, en: string) => {
    if (!v) return;
    const n = Math.round(v * mul);
    if (n !== 0) out.push({ zh: `${zh} ${n > 0 ? '+' : ''}${n}`, en: `${en} ${n > 0 ? '+' : ''}${n}` });
  };
  /**
   * Multipliers read as a percentage swing from 1.0. Mastery amplifies the
   * DEVIATION, not the multiplier itself — a ×0.9 own-loss skill at Lv.3
   * becomes ×0.87, not ×1.17. Matches how combat.ts folds skillEffectMul in.
   */
  const pct = (v: number | undefined, zh: string, en: string, lowerIsBetter = false) => {
    if (v == null || v === 1) return;
    const scaled = 1 + (v - 1) * mul;
    const delta = Math.round((scaled - 1) * 100);
    if (delta === 0) return;
    const sign = delta > 0 ? '+' : '';
    const mark = lowerIsBetter === (delta < 0) ? '' : ' ⚠';
    out.push({ zh: `${zh} ${sign}${delta}%${mark}`, en: `${en} ${sign}${delta}%${mark}` });
  };

  flat(c.warBonus, '武力', 'WAR');
  flat(c.leadershipBonus, '統率', 'LDR');
  pct(c.powerMultiplier, '我軍戰力', 'own power');
  pct(c.enemyLossMultiplier, '敵軍損失', 'enemy losses');
  pct(c.ownLossMultiplier, '我軍損失', 'own losses', true);
  pct(c.defenseMultiplier, '守城防禦', 'city defence');
  if (c.duelChanceBonus) {
    const n = Math.round(c.duelChanceBonus * mul * 100);
    if (n !== 0) out.push({ zh: `單挑勝率 ${n > 0 ? '+' : ''}${n}%`, en: `duel odds ${n > 0 ? '+' : ''}${n}%` });
  }
  return out;
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
