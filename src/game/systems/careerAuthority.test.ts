import { describe, it, expect } from 'vitest';
import { careerStanding, careerGuardCap, rankForMerit,
         RANK_COMMONER, RANK_RETAINER, RANK_LOWEST_OFFICE } from './career';
import { canCommand, cityAuthority, commandGateHint } from './careerAuthority';
import type { HeroicDeeds } from '../types/deeds';

const deeds = (d: Partial<HeroicDeeds>) => d as HeroicDeeds;

describe('career ladder — the rungs below office', () => {
  it('a fresh career starts as 白身, not as an officer', () => {
    const s = careerStanding(undefined);
    expect(s.rank).toBe(RANK_COMMONER);
    expect(s.status.zh).toBe('白身');
    expect(s.commoner).toBe(true);
  });

  it('the first rungs are cheap enough to move within one campaign', () => {
    // 一場勝仗(5)加一場單挑(4) 就該離開白身
    expect(rankForMerit(9)).toBe(RANK_RETAINER);
    // 三場勝仗 + 幾場單挑進得了九品
    expect(rankForMerit(20)).toBe(RANK_LOWEST_OFFICE);
  });

  it('the top of the ladder still takes a career', () => {
    expect(rankForMerit(819)).toBeGreaterThan(1);
    expect(rankForMerit(820)).toBe(1);
  });

  it('leaving 白身 clears the commoner flag', () => {
    expect(careerStanding(deeds({ battlesWon: 4 })).commoner).toBe(false);
  });
});

describe('私兵上限 — rank is the ceiling, leadership only decides if you reach it', () => {
  it('a commoner keeps a few guests, not a company', () => {
    expect(careerGuardCap(careerStanding(undefined), 95)).toBe(10);
  });

  it('a retainer commands fifty, not a legion', () => {
    const s = careerStanding(deeds({ battlesWon: 2 }));
    expect(s.rank).toBe(RANK_RETAINER);
    expect(careerGuardCap(s, 95)).toBe(50);
  });

  it('the ninth rank is a hundred men even for a great captain', () => {
    const s = careerStanding(deeds({ battlesWon: 5 }));
    expect(s.rank).toBeLessThanOrEqual(RANK_LOWEST_OFFICE);
    expect(careerGuardCap(s, 95)).toBe(100);
  });

  it('a viceroy finally scales with leadership', () => {
    const s = careerStanding(deeds({ citiesTaken: 16 }));
    expect(s.rank).toBeLessThanOrEqual(3);
    expect(careerGuardCap(s, 80)).toBe(80 * 100 + 6000);
  });
});

describe('權限閘門', () => {
  it('personal pursuits are open to a commoner', () => {
    for (const id of ['training', 'duel-hall', 'wiki', 'advisor', 'career', 'errands']) {
      expect(canCommand(id, RANK_COMMONER)).toBe(true);
    }
  });

  it('a commoner cannot run the realm', () => {
    for (const id of ['governors', 'schemes', 'relations', 'titles', 'legions']) {
      expect(canCommand(id, RANK_COMMONER)).toBe(false);
    }
  });

  it('authority arrives rung by rung, not all at once', () => {
    expect(canCommand('guard', RANK_RETAINER)).toBe(true);
    expect(canCommand('legions', RANK_RETAINER)).toBe(false);
    expect(canCommand('legions', RANK_LOWEST_OFFICE)).toBe(true);
    expect(canCommand('governors', RANK_LOWEST_OFFICE)).toBe(false);
    expect(canCommand('governors', 5)).toBe(true);
    expect(canCommand('relations', 5)).toBe(false);
    expect(canCommand('relations', 1)).toBe(true);
  });

  it('unknown ids stay open — new personal features need no table entry', () => {
    expect(canCommand('some-new-personal-screen', RANK_COMMONER)).toBe(true);
  });

  it('a blocked command explains what office it needs', () => {
    expect(commandGateHint('governors')?.zh).toBe('需太守之位');
    expect(commandGateHint('training')).toBeNull();
  });
});

describe('城池指令', () => {
  it('a commoner governs nothing, not even where they stand', () => {
    expect(cityAuthority(RANK_COMMONER, true, true)).toEqual({ domestic: false, military: false });
  });

  it('an officer may raise troops only where they are stationed', () => {
    expect(cityAuthority(RANK_LOWEST_OFFICE, true, true).military).toBe(true);
    expect(cityAuthority(RANK_LOWEST_OFFICE, true, false).military).toBe(false);
  });

  it('domestic orders wait for 太守', () => {
    expect(cityAuthority(6, true, true).domestic).toBe(false);
    expect(cityAuthority(5, true, true).domestic).toBe(true);
  });

  it('another force’s city is closed regardless of rank', () => {
    expect(cityAuthority(1, false, true)).toEqual({ domestic: false, military: false });
  });
});
