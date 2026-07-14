import { describe, it, expect } from 'vitest';
import {
  isPhysician, medicalSkillOf, medicalTier, medicalCureBonus, medicalWoundBonus,
  accrueMedicalSkill, MEDICAL_SKILL_MAX,
} from './medicalSkill';
import type { Officer } from '../types';

const mk = (over: Partial<Officer> = {}): Officer => ({
  id: 'o', name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 60, war: 60, intelligence: 70, politics: 60, charisma: 60 },
  loyalty: 80, locationCityId: 'c', forceId: 'f', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general', traits: [], ...over,
} as Officer);

describe('名醫養成 — medical skill', () => {
  it('only 醫者/藥師 count as physicians', () => {
    expect(isPhysician(mk({ traits: ['physician'] }))).toBe(true);
    expect(isPhysician(mk({ traits: ['herbalist'] }))).toBe(true);
    expect(isPhysician(mk({ traits: ['brave'] }))).toBe(false);
  });

  it('grows +2 a season, +6 more on a cure, capped; a non-physician never gains', () => {
    let doc = mk({ traits: ['physician'] });
    doc = accrueMedicalSkill(doc, false);
    expect(medicalSkillOf(doc)).toBe(2);
    doc = accrueMedicalSkill(doc, true);
    expect(medicalSkillOf(doc)).toBe(2 + 8); // +2 base +6 cure
    doc = { ...doc, medicalSkill: 99 };
    expect(medicalSkillOf(accrueMedicalSkill(doc, true))).toBe(MEDICAL_SKILL_MAX);
    // A non-physician is untouched.
    const soldier = mk({ traits: ['brave'] });
    expect(accrueMedicalSkill(soldier, true)).toBe(soldier);
  });

  it('tiers + bonuses scale with skill, and are zero for non-physicians', () => {
    expect(medicalTier(0).zh).toBe('醫工');
    expect(medicalTier(20).zh).toBe('良醫');
    expect(medicalTier(50).zh).toBe('名醫');
    expect(medicalTier(80).zh).toBe('神醫');
    const shen = mk({ traits: ['physician'], medicalSkill: 100 });
    expect(medicalCureBonus(shen)).toBeCloseTo(0.15, 5);
    expect(medicalWoundBonus(shen)).toBe(2);
    expect(medicalWoundBonus(mk({ traits: ['physician'], medicalSkill: 60 }))).toBe(1);
    expect(medicalCureBonus(mk({ medicalSkill: 100 }))).toBe(0); // not a physician
  });
});
