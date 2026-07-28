import { describe, expect, it } from 'vitest';
import { mkOfficer } from '../../test/factories';
import { SKILLS_BY_ID, SKILLS } from '../data/skills';
import { skillCombatEffectLines, skillEffectMul, MAX_SKILL_LEVEL } from './skillMastery';

/**
 * 技能戰效讀出須與引擎同源 — the officer card now prints what a skill is
 * actually worth. The failure mode to guard is the one 訪賢勝算 already shipped
 * once: a hand-written preview that drifts from the engine, so the screen
 * promises a number the resolver does not honour.
 *
 * combat.ts effectsForOfficer folds mastery in as:
 *     flat:       value * m
 *     multiplier: 1 + (value - 1) * m
 * These tests pin the read-out to that exact shape.
 */

describe('skillCombatEffectLines — 與 combat.ts 同一套折算', () => {
  it('a skill with no combat block reads as nothing', () => {
    const civil = SKILLS.find((s) => !s.combat);
    expect(civil, 'fixture needs a non-combat skill').toBeTruthy();
    expect(skillCombatEffectLines(civil!.id)).toEqual([]);
  });

  it('an unknown skill id reads as nothing rather than throwing', () => {
    expect(() => skillCombatEffectLines('no-such-skill')).not.toThrow();
    expect(skillCombatEffectLines('no-such-skill')).toEqual([]);
  });

  it('every combat skill in the catalogue produces at least one line', () => {
    // A skill whose numbers all read as "nothing" would show an empty effects
    // block on the card — either the data is inert or the formatter dropped it.
    for (const s of SKILLS) {
      if (!s.combat) continue;
      const hasAnyNumber = Object.values(s.combat).some((v) => v != null && v !== 1 && v !== 0);
      if (!hasAnyNumber) continue;
      expect(skillCombatEffectLines(s.id).length, `${s.id} produced no lines`).toBeGreaterThan(0);
    }
  });

  it('multiplier lines scale their DISTANCE from 1, matching effectsForOfficer', () => {
    // Find a skill with an ownLossMultiplier below 1 (a discount).
    const disc = SKILLS.find((s) => (s.combat?.ownLossMultiplier ?? 1) < 1);
    expect(disc, 'fixture needs a loss-discount skill').toBeTruthy();
    const raw = disc!.combat!.ownLossMultiplier!;

    const lv1 = mkOfficer({ id: 'a', skills: [disc!.id] as never });
    const lv3 = mkOfficer({ id: 'b', skills: [disc!.id] as never, skillLevels: { [disc!.id]: 3 } } as never);
    const m = skillEffectMul(lv3, disc!.id);
    expect(m).toBeCloseTo(1.3, 5);

    const expected1 = Math.round(((1 + (raw - 1) * 1) - 1) * 100);
    const expected3 = Math.round(((1 + (raw - 1) * m) - 1) * 100);
    // Mastery deepens the discount rather than flipping it past 1.
    expect(expected3).toBeLessThan(expected1);

    const line1 = skillCombatEffectLines(disc!.id, lv1).find((l) => l.zh.includes('我軍損失'));
    const line3 = skillCombatEffectLines(disc!.id, lv3).find((l) => l.zh.includes('我軍損失'));
    expect(line1?.zh).toContain(`${expected1}%`);
    expect(line3?.zh).toContain(`${expected3}%`);
  });

  it('flat bonuses scale linearly with mastery', () => {
    const flat = SKILLS.find((s) => (s.combat?.warBonus ?? 0) > 0);
    expect(flat, 'fixture needs a war-bonus skill').toBeTruthy();
    const raw = flat!.combat!.warBonus!;
    const lv3 = mkOfficer({ id: 'c', skills: [flat!.id] as never, skillLevels: { [flat!.id]: 3 } } as never);
    const line = skillCombatEffectLines(flat!.id, lv3).find((l) => l.zh.includes('武力'));
    expect(line?.zh).toContain(`+${Math.round(raw * 1.3)}`);
  });

  it('omitting the officer reads the catalogue value (mastery ×1)', () => {
    const flat = SKILLS.find((s) => (s.combat?.warBonus ?? 0) > 0)!;
    const bare = skillCombatEffectLines(flat.id);
    const lv1 = skillCombatEffectLines(flat.id, mkOfficer({ id: 'd', skills: [flat.id] as never }));
    expect(bare).toEqual(lv1);
  });

  it('marks a multiplier that works AGAINST its holder', () => {
    // A skill raising own losses (or cutting own power) is a real thing in the
    // catalogue; the card must not read it as a benefit.
    const bad = SKILLS.find((s) => (s.combat?.ownLossMultiplier ?? 1) > 1);
    if (!bad) return; // no such skill today — the branch is still guarded
    const lines = skillCombatEffectLines(bad.id);
    expect(lines.some((l) => l.zh.includes('⚠'))).toBe(true);
  });

  it('both languages are always populated', () => {
    for (const s of SKILLS) {
      for (const l of skillCombatEffectLines(s.id)) {
        expect(l.zh.length, `${s.id} zh empty`).toBeGreaterThan(0);
        expect(l.en.length, `${s.id} en empty`).toBeGreaterThan(0);
      }
    }
  });

  it('mastery never exceeds the documented cap', () => {
    const any = SKILLS.find((s) => s.combat)!;
    const over = mkOfficer({ id: 'e', skills: [any.id] as never, skillLevels: { [any.id]: 99 } } as never);
    expect(skillEffectMul(over, any.id)).toBeCloseTo(1 + 0.15 * (MAX_SKILL_LEVEL - 1), 5);
  });

  it('a skill the officer does not have reads at mastery ×1', () => {
    const any = SKILLS.find((s) => s.combat)!;
    const stranger = mkOfficer({ id: 'f', skills: [] as never });
    expect(skillCombatEffectLines(any.id, stranger)).toEqual(skillCombatEffectLines(any.id));
  });
});

describe('SKILLS_BY_ID 完整性', () => {
  it('every skill resolves to itself', () => {
    for (const s of SKILLS) expect(SKILLS_BY_ID[s.id]?.id).toBe(s.id);
  });
});
