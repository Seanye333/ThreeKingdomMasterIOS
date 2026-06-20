import { describe, it, expect } from 'vitest';
import { DEBATE_SCENARIOS, DEBATE_SCENARIOS_BY_ID, scenarioOutcome, scenarioResultLine } from './debateScenarios';

describe('debate scenarios', () => {
  it('each scenario is well-formed (opponent + win/lose effects)', () => {
    for (const s of DEBATE_SCENARIOS) {
      expect(s.opponentId).toBeTruthy();
      expect(s.winEffects.length).toBeGreaterThan(0);
      expect(s.loseEffects.length).toBeGreaterThan(0);
      expect(DEBATE_SCENARIOS_BY_ID[s.id]).toBe(s);
    }
  });

  it('a win yields the win effects; a rout adds the rout bonus', () => {
    const wang = DEBATE_SCENARIOS_BY_ID['shout-down-wang-lang'];
    const pointsWin = scenarioOutcome(wang, { won: true, routed: false });
    expect(pointsWin.some((e) => e.kind === 'afflict')).toBe(false);
    const rout = scenarioOutcome(wang, { won: true, routed: true });
    expect(rout.some((e) => e.kind === 'afflict' && e.targetId === 'wang-lang')).toBe(true);
  });

  it('a defection scenario recruits the opponent on a win, sours them on a loss', () => {
    const defect = DEBATE_SCENARIOS_BY_ID['persuade-defect'];
    expect(scenarioOutcome(defect, { won: true, routed: false }).some((e) => e.kind === 'recruit')).toBe(true);
    expect(scenarioOutcome(defect, { won: false, routed: false }).some((e) => e.kind === 'relationship')).toBe(true);
  });

  it('produces a result headline', () => {
    const wang = DEBATE_SCENARIOS_BY_ID['shout-down-wang-lang'];
    expect(scenarioResultLine(wang, { won: true, routed: true }).zh).toContain('大獲全勝');
    expect(scenarioResultLine(wang, { won: false, routed: false }).en).toContain('fall short');
  });
});
