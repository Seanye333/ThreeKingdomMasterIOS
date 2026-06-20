import { describe, it, expect } from 'vitest';
import { DUEL_SCENARIOS, DUEL_SCENARIOS_BY_ID, duelScenarioOutcome, duelScenarioResultLine } from './duelScenarios';

describe('劇情單挑 (duel scenarios)', () => {
  it('every scenario names an opponent and win/lose effects', () => {
    for (const s of DUEL_SCENARIOS) {
      expect(s.opponentId).toBeTruthy();
      expect(s.winEffects.length).toBeGreaterThan(0);
      expect(s.loseEffects.length).toBeGreaterThan(0);
      expect(DUEL_SCENARIOS_BY_ID[s.id]).toBe(s);
    }
  });

  it('a loss yields the lose effects', () => {
    const s = DUEL_SCENARIOS[0];
    expect(duelScenarioOutcome(s, { won: false, slain: false })).toEqual(s.loseEffects);
  });

  it('a win adds the slay effects only on a kill', () => {
    const s = DUEL_SCENARIOS.find((x) => x.slayEffects)!;
    const onPoints = duelScenarioOutcome(s, { won: true, slain: false });
    const withKill = duelScenarioOutcome(s, { won: true, slain: true });
    expect(onPoints).toEqual(s.winEffects);
    expect(withKill.length).toBe(s.winEffects.length + s.slayEffects!.length);
  });

  it('the result headline reflects win / slay / loss', () => {
    const s = DUEL_SCENARIOS.find((x) => x.slayEffects)!;
    expect(duelScenarioResultLine(s, { won: false, slain: false }).zh).toContain('功敗垂成');
    expect(duelScenarioResultLine(s, { won: true, slain: true }).zh).toContain('陣斬');
  });
});
