/** 批三 — 流派絕學 / 舌戰戰役鏈 / 出將入相. */
import { describe, it, expect } from 'vitest';
import { schoolSecretArt, SCHOOL_SECRET_TIER, MARTIAL_SCHOOL, tierOfXiuwei } from './martialArts';
import { initDuelBout } from './duel';
import { DEBATE_CAMPAIGNS, debateCampaignSteps, DEBATE_SCENARIOS_BY_ID } from './debateScenarios';
import { dualLuminaries, DUAL_LUMINARY_TOP } from './scholarRank';
import { mkOfficer } from '../../test/factories';

const S = (war: number, int = 60) => ({ war, leadership: 60, intelligence: int, politics: 50, charisma: 60 });

describe('流派絕學 (schoolSecretArt)', () => {
  it('every school has a named art, gated at 大成', () => {
    for (const cls of Object.keys(MARTIAL_SCHOOL) as Array<keyof typeof MARTIAL_SCHOOL>) {
      expect(schoolSecretArt(cls, 0)).toBeNull();                       // 未入門
      expect(schoolSecretArt(cls, 35)).toBeNull();                      // 精熟 — not yet
      const art = schoolSecretArt(cls, 60);                             // 大成
      expect(art).not.toBeNull();
      expect(art!.zh.length).toBeGreaterThan(0);
      expect(tierOfXiuwei(60).tier).toBeGreaterThanOrEqual(SCHOOL_SECRET_TIER);
    }
  });
  it('a 大成 arm with a plain blade carries the school art into the bout; a famed weapon still wins', () => {
    const drilled = mkOfficer({ id: 'd', stats: S(85), martialXiuwei: 60 });
    const raw = mkOfficer({ id: 'r', stats: S(85) });
    const bout = initDuelBout(drilled, raw);
    expect(bout.aArt).not.toBeNull();  // 流派絕學 fills the empty hand
    expect(bout.dArt).toBeNull();      // the untrained carry nothing
    const armed = mkOfficer({ id: 'a', stats: S(85), martialXiuwei: 60, equipment: ['sky-piercer'] });
    const bout2 = initDuelBout(armed, raw);
    expect(bout2.aArt!.zh).toContain('畫戟'); // the legendary weapon's own art takes precedence
  });
});

describe('舌戰戰役鏈 (debateCampaignSteps)', () => {
  it('every campaign step resolves to a real scenario', () => {
    for (const camp of DEBATE_CAMPAIGNS) {
      for (const id of camp.steps) expect(DEBATE_SCENARIOS_BY_ID[id], `${camp.id}:${id}`).toBeDefined();
    }
  });
  it('steps unlock in order as wins accrue', () => {
    const camp = DEBATE_CAMPAIGNS[0];
    const fresh = debateCampaignSteps(camp, new Set());
    expect(fresh[0].unlocked).toBe(true);
    expect(fresh[1].unlocked).toBe(false);
    const after = debateCampaignSteps(camp, new Set([camp.steps[0]]));
    expect(after[0].cleared).toBe(true);
    expect(after[1].unlocked).toBe(true);
    expect(after[2].unlocked).toBe(false);
  });
});

describe('出將入相 (dualLuminaries)', () => {
  it('only a name high on BOTH boards earns the laurel', () => {
    const officers: Record<string, ReturnType<typeof mkOfficer>> = {};
    // A dual talent, a pure warrior, a pure scholar, and filler.
    officers.both = mkOfficer({ id: 'both', stats: { war: 95, leadership: 80, intelligence: 92, politics: 80, charisma: 90 } });
    officers.arm = mkOfficer({ id: 'arm', stats: { war: 97, leadership: 80, intelligence: 40, politics: 30, charisma: 40 } });
    officers.tongue = mkOfficer({ id: 'tongue', stats: { war: 20, leadership: 40, intelligence: 96, politics: 80, charisma: 92 } });
    for (let i = 0; i < DUAL_LUMINARY_TOP; i++) {
      officers[`f${i}`] = mkOfficer({ id: `f${i}`, stats: { war: 50, leadership: 50, intelligence: 50, politics: 50, charisma: 50 } });
    }
    const dual = dualLuminaries(officers, {});
    expect(dual.has('both')).toBe(true);
    expect(dual.has('arm')).toBe(false);    // war ladder only
    expect(dual.has('tongue')).toBe(false); // moon board only
  });
});
