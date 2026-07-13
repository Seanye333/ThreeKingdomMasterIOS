import { describe, it, expect } from 'vitest';
import { checkCodexAchievements } from './achievements';
import { CODEX_SETS } from './codex';
import { createEmptyAchievementProgress } from '../types';

import { OFFICER_IDS, TALENT_POOL_IDS } from '../data/officers';
import { HISTORICAL_OFFICER_TEMPLATES } from '../data/historicalOfficers';

describe('名將套名冊 — every set member is a real officer', () => {
  it('CODEX_SETS members all resolve to roster ids', () => {
    const ids = new Set([...OFFICER_IDS, ...TALENT_POOL_IDS, ...HISTORICAL_OFFICER_TEMPLATES.map((t) => t.id)]);
    for (const set of CODEX_SETS) {
      for (const m of set.members) expect(ids.has(m), `${set.id}:${m}`).toBe(true);
    }
  });
});

describe('圖鑑功業 — codex collection milestones', () => {
  it('nothing unlocks on an empty album', () => {
    const r = checkCodexAchievements(createEmptyAchievementProgress(), { recruited: [] });
    expect(r.newlyUnlocked).toEqual([]);
  });

  it('30 recruits unlock the bronze tier only', () => {
    const recruited = Array.from({ length: 30 }, (_, i) => `officer-${i}`);
    const r = checkCodexAchievements(createEmptyAchievementProgress(), { recruited });
    expect(r.newlyUnlocked).toContain('ach-codex-30');
    expect(r.newlyUnlocked).not.toContain('ach-codex-100');
  });

  it('completing the Five Tigers fires the set achievements', () => {
    const tigers = CODEX_SETS.find((s) => s.id === 'five-tigers')!.members;
    const r = checkCodexAchievements(createEmptyAchievementProgress(), { recruited: [...tigers] });
    expect(r.newlyUnlocked).toContain('ach-codex-five-tigers');
    expect(r.newlyUnlocked).toContain('ach-codex-set-any');   // first set complete
    expect(r.newlyUnlocked).not.toContain('ach-codex-all-sets');
  });

  it('every set complete → the grand album; already-done ones stay silent', () => {
    const recruited = [...new Set(CODEX_SETS.flatMap((s) => s.members))];
    const first = checkCodexAchievements(createEmptyAchievementProgress(), { recruited });
    expect(first.newlyUnlocked).toContain('ach-codex-all-sets');
    const again = checkCodexAchievements(first.progress, { recruited });
    expect(again.newlyUnlocked).toEqual([]);
  });
});
