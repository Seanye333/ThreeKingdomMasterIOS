import { describe, it, expect } from 'vitest';
import { cultureGain, cultureGraftCurb, cultureLoyaltyLift, cultureTier, CULTURE_FAMED } from './culture';

describe('文教 — cultural renown', () => {
  it('grows with a school (scaled by the best mind), fades without one', () => {
    expect(cultureGain(false, 100)).toBe(-1);          // no school → slow fade
    expect(cultureGain(true, 40)).toBe(2);             // 1 + round(40/50)=1 → 2
    expect(cultureGain(true, 100)).toBe(3);            // capped at +3
    expect(cultureGain(true, 0)).toBe(1);              // floored at +1
  });

  it('教化息貪 — culture curbs graft, down to −35% at full', () => {
    expect(cultureGraftCurb(0)).toBeCloseTo(1, 5);
    expect(cultureGraftCurb(100)).toBeCloseTo(0.65, 5);
    expect(cultureGraftCurb(50)).toBeCloseTo(1 - 0.175, 5);
  });

  it('民安其教 — only a 文化名城 (≥60) lifts loyalty', () => {
    expect(cultureLoyaltyLift(59)).toBe(0);
    expect(cultureLoyaltyLift(CULTURE_FAMED)).toBe(1);
  });

  it('tiers climb with 文教', () => {
    expect(cultureTier(0).zh).toBe('文教未興');
    expect(cultureTier(1).zh).toBe('初興文教');
    expect(cultureTier(30).zh).toBe('文教興隆');
    expect(cultureTier(60).zh).toBe('文化名城');
  });
});
