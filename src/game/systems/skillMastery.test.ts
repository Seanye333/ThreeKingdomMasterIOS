import { describe, it, expect } from 'vitest';
import { skillLevel, skillEffectMul, trainSkillMastery, MAX_SKILL_LEVEL } from './skillMastery';
import { itemMasteryMul } from './gradeCombat';
import { isSignaturePair, SIGNATURE_ITEMS } from '../data/signatureItems';
import { ITEMS_BY_ID } from '../data/items';
import { OFFICER_IDS, TALENT_POOL_IDS } from '../data/officers';
import { HISTORICAL_OFFICER_TEMPLATES } from '../data/historicalOfficers';
import { combatBP } from './battlePower';
import type { Officer } from '../types';

const mk = (over: Partial<Officer>): Officer => ({
  id: 'x', name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
  loyalty: 80, locationCityId: 'c1', forceId: 'f', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general',
  ...over,
} as Officer);

describe('技能等級 — skill mastery', () => {
  it('levels clamp 1–3 and scale the effect multiplier', () => {
    const o = mk({ skills: ['brave', 'pursuit'], skillLevels: { brave: 3, pursuit: 9 } });
    expect(skillLevel(o, 'brave')).toBe(3);
    expect(skillLevel(o, 'pursuit')).toBe(MAX_SKILL_LEVEL); // clamped
    expect(skillLevel(o, 'navy-master')).toBe(0);           // unknown skill
    expect(skillEffectMul(o, 'brave')).toBeCloseTo(1.3, 5);
    expect(skillEffectMul(mk({ skills: ['brave'] }), 'brave')).toBe(1);
  });

  it('特訓精研 deepens one known skill (rng-gated) and reports it', () => {
    const o = mk({ skills: ['brave'] });
    expect(trainSkillMastery(o, () => 0.9)).toBeNull();         // missed the 35% roll
    const hit = trainSkillMastery(o, () => 0.1)!;
    expect(hit.officer.skillLevels?.brave).toBe(2);
    expect(hit.entry.textZh).toContain('特訓精研');
    const maxed = mk({ skills: ['brave'], skillLevels: { brave: 3 } });
    expect(trainSkillMastery(maxed, () => 0.1)).toBeNull();     // nothing left to climb
  });

  it('deepened skills raise BP', () => {
    const base = combatBP(mk({ skills: ['brave'] }));
    const deep = combatBP(mk({ skills: ['brave'], skillLevels: { brave: 3 } }));
    expect(deep.parts.skills).toBe(base.parts.skills + 40);
  });
});

describe('神兵共鳴 — signature arms', () => {
  it('every signature pair points at a real item', () => {
    for (const p of SIGNATURE_ITEMS) expect(ITEMS_BY_ID[p.itemId], p.itemId).toBeTruthy();
  });

  it('every signature pair points at a real officer', () => {
    const ids = new Set([...OFFICER_IDS, ...TALENT_POOL_IDS, ...HISTORICAL_OFFICER_TEMPLATES.map((t) => t.id)]);
    for (const p of SIGNATURE_ITEMS) expect(ids.has(p.officerId), p.officerId).toBe(true);
  });

  it('本命神兵 resonates at 115% even in an iron-grade hand', () => {
    const weakGuanYu = mk({ id: 'guan-yu', stats: { leadership: 40, war: 45, intelligence: 40, politics: 30, charisma: 40 } });
    const blade = ITEMS_BY_ID['green-dragon'];
    expect(isSignaturePair('guan-yu', 'green-dragon')).toBe(true);
    expect(itemMasteryMul(weakGuanYu, blade)).toBe(1.15);
    // The same low grade without the resonance suffers the shortfall.
    const stranger = mk({ id: 'nobody', stats: weakGuanYu.stats });
    expect(itemMasteryMul(stranger, blade)).toBeLessThan(1);
  });
});
