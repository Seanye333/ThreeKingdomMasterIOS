import type { Officer } from '../types';
import type { UnitType } from '../types/tactical';

/**
 * 兵種熟練 — a per-officer proficiency with each arm, earned by fighting on
 * the field AS that arm. Distinct from 星級 (a generic ascension) and 技能等級
 * (a per-skill mastery): this rewards *how* an officer campaigns — a general
 * who has led cavalry through thirty battles handles horse better than a raw
 * one. A slow track (a few points per battle) with a modest ceiling (+4% power
 * at grandmastery), it turns "what you fight with" into a growth axis. Earned
 * only through FOUGHT (tactical) battles, like 戰意; auto-resolves still READ
 * it, so a seasoned arm carries its edge into a paper battle too.
 */

/** The five arms proficiency is tracked against (siege folds to infantry). */
export type ProfArm = 'infantry' | 'cavalry' | 'archers' | 'spearmen' | 'navy';

export const ARM_PROF_MAX = 100;

export const PROF_ARM_LABEL: Record<ProfArm, { zh: string; en: string; glyph: string }> = {
  infantry: { zh: '步戰', en: 'Infantry', glyph: '步' },
  cavalry: { zh: '騎戰', en: 'Cavalry', glyph: '騎' },
  archers: { zh: '弓戰', en: 'Archery', glyph: '弓' },
  spearmen: { zh: '槍戰', en: 'Spear', glyph: '槍' },
  navy: { zh: '水戰', en: 'Naval', glyph: '水' },
};

export function profArmOf(unit: UnitType): ProfArm {
  switch (unit) {
    case 'cavalry': return 'cavalry';
    case 'archers': return 'archers';
    case 'spearmen': return 'spearmen';
    case 'navy': return 'navy';
    default: return 'infantry'; // infantry + siege + anything exotic
  }
}

export function armProficiency(o: Officer, arm: ProfArm): number {
  return Math.max(0, Math.min(ARM_PROF_MAX, o.armProficiency?.[arm] ?? 0));
}

export interface ProfTier { tier: 0 | 1 | 2 | 3; zh: string; en: string }

export function armProficiencyTier(value: number): ProfTier {
  if (value >= 80) return { tier: 3, zh: '宗師', en: 'Grandmaster' };
  if (value >= 50) return { tier: 2, zh: '精通', en: 'Expert' };
  if (value >= 20) return { tier: 1, zh: '嫻熟', en: 'Adept' };
  return { tier: 0, zh: '生疏', en: 'Novice' };
}

/** Power multiplier for leading `unit` with this officer's proficiency in it.
 *  Max +4% at 100 — a polish on a veteran, not a pillar. */
export function armProficiencyMul(o: Officer | undefined | null, unit: UnitType): number {
  if (!o) return 1;
  return 1 + (armProficiency(o, profArmOf(unit)) / ARM_PROF_MAX) * 0.04;
}

/** 宗師 threshold — reaching it unlocks the arm's signature 專精 perk. */
export const ARM_MASTERY_TIER = 80;

/**
 * 兵種專精 — the signature passive a 宗師 (proficiency ≥ 80) of each arm earns.
 * Turns the熟練 curve from a flat +% into a質變: a grandmaster of horse charges
 * unbroken, a grandmaster archer wastes no arrow, and so on. Each folds into an
 * EXISTING combat lever via armMasteryMul, so the effect is real, not cosmetic.
 */
export const ARM_MASTERY_PERKS: Record<ProfArm, { zh: string; en: string; descZh: string; descEn: string }> = {
  cavalry: { zh: '衝陣不亂', en: 'Unbroken Charge', descZh: '衝擊/突貫傷害 +12%', descEn: 'Charge & shock damage +12%' },
  archers: { zh: '矢無虛發', en: 'Every Arrow Tells', descZh: '矢雨傷害 +12%', descEn: 'Volley damage +12%' },
  spearmen: { zh: '拒馬如林', en: 'A Forest of Spears', descZh: '立防拒騎:受衝擊再減 15%', descEn: 'Braced vs a charge: −15% more' },
  infantry: { zh: '陣列如鐵', en: 'Iron Ranks', descZh: '立防時受傷再減 10%', descEn: 'While defending: −10% damage taken' },
  navy: { zh: '操舟若神', en: 'Master of the Waves', descZh: '水戰戰力 +10%', descEn: 'Naval power +10%' },
};

/** The 宗師 perk this officer holds for an arm, or null if not yet mastered. */
export function armMasteryPerkOf(officer: Officer | undefined | null, arm: ProfArm): { zh: string; en: string; descZh: string; descEn: string } | null {
  if (!officer) return null;
  return armProficiency(officer, arm) >= ARM_MASTERY_TIER ? ARM_MASTERY_PERKS[arm] : null;
}

/**
 * The situational multiplier a 宗師 perk grants at its combat lever (1 if the
 * officer hasn't mastered that arm). >1 for offensive perks (charge/volley/
 * naval), <1 for the defensive ones (applied to damage TAKEN).
 */
export function armMasteryMul(officer: Officer | undefined | null, arm: ProfArm): number {
  if (!officer || armProficiency(officer, arm) < ARM_MASTERY_TIER) return 1;
  switch (arm) {
    case 'cavalry': return 1.12; // 衝陣不亂 — more shock
    case 'archers': return 1.12; // 矢無虛發 — more volley
    case 'navy': return 1.10;    // 操舟若神 — more naval power
    case 'infantry': return 0.90; // 陣列如鐵 — less damage taken while defending
    case 'spearmen': return 0.85; // 拒馬如林 — less damage taken when braced vs a charge
  }
}

/**
 * Accrue proficiency for battle participants toward the arm they fought as.
 * Winners learn a touch faster. Returns a new officers map (changed only).
 */
export function accrueArmProficiency(
  officers: Record<string, Officer>,
  entries: Array<{ officerId: string; unit: UnitType; won: boolean }>,
): Record<string, Officer> {
  const out = { ...officers };
  for (const e of entries) {
    const o = out[e.officerId];
    if (!o) continue;
    const arm = profArmOf(e.unit);
    const cur = o.armProficiency?.[arm] ?? 0;
    const next = Math.min(ARM_PROF_MAX, cur + (e.won ? 3 : 2));
    if (next !== cur) out[e.officerId] = { ...o, armProficiency: { ...(o.armProficiency ?? {}), [arm]: next } };
  }
  return out;
}
