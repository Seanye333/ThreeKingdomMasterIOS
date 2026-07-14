import type { Officer } from '../types';

/**
 * 名醫養成 — a physician's craft deepens with practice. A 醫者/藥師 accumulates
 * 醫術 (0–100) each season they tend the sick, faster on a real cure, climbing
 * 醫工 → 良醫 → 名醫 → 神醫. Skill widens the wound-recovery a city's healer
 * grants AND the chance they mend a lasting 宿疾 — so a 神醫 in your capital is
 * worth a hospital of raw hands. Stored on the officer (no registry), like
 * 兵種熟練 / 人馬合一.
 */

export const MEDICAL_SKILL_MAX = 100;

export function isPhysician(o: Officer | undefined | null): boolean {
  return !!o && (o.traits ?? []).some((t) => t === 'physician' || t === 'herbalist');
}

export function medicalSkillOf(o: Officer): number {
  return Math.max(0, Math.min(MEDICAL_SKILL_MAX, o.medicalSkill ?? 0));
}

export interface MedicalTier { tier: 0 | 1 | 2 | 3; zh: string; en: string }

export function medicalTier(value: number): MedicalTier {
  if (value >= 80) return { tier: 3, zh: '神醫', en: 'Miracle Healer' };
  if (value >= 50) return { tier: 2, zh: '名醫', en: 'Renowned Physician' };
  if (value >= 20) return { tier: 1, zh: '良醫', en: 'Able Physician' };
  return { tier: 0, zh: '醫工', en: 'Field Medic' };
}

/** Extra chronic-cure chance a physician's skill lends (0 → +0.15 at 神醫). */
export function medicalCureBonus(o: Officer | undefined | null): number {
  return isPhysician(o) ? (medicalSkillOf(o!) / MEDICAL_SKILL_MAX) * 0.15 : 0;
}

/** Extra 養傷 seasons a skilled healer mends per season (0 / 1 / 2), folded into
 *  the affliction tick's woundHealBonus. */
export function medicalWoundBonus(o: Officer | undefined | null): number {
  return isPhysician(o) ? Math.floor(medicalSkillOf(o!) / 50) : 0;
}

/** Accrue a physician's 醫術: +2 each season practised, +6 more on a real cure. */
export function accrueMedicalSkill(o: Officer, cured: boolean): Officer {
  if (!isPhysician(o)) return o;
  const next = Math.min(MEDICAL_SKILL_MAX, medicalSkillOf(o) + 2 + (cured ? 6 : 0));
  return next !== (o.medicalSkill ?? 0) ? { ...o, medicalSkill: next } : o;
}
