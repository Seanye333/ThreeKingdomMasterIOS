/** 性格效果 — internal-affairs & corruption trait modifiers. */
import { describe, expect, it } from 'vitest';
import { mkOfficer } from '../../test/factories';
import { internalAffairsMultiplier, corruptionAccrualMultiplier } from './traitEffects';

describe('治軍嚴整 — disciplined officers drill / farm better', () => {
  it('iron-discipline boosts 練兵 and 屯田 but not, say, 興商', () => {
    const o = mkOfficer({ id: 'a', traits: ['iron-discipline'] as never });
    expect(internalAffairsMultiplier(o, 'drill-troops')).toBeGreaterThan(1);
    expect(internalAffairsMultiplier(o, 'military-farming')).toBeGreaterThan(1);
    expect(internalAffairsMultiplier(o, 'develop-commerce')).toBe(1);
  });
});

describe('貪腐滋生 — accrual modulated by the officers posted', () => {
  it('a greedy governor speeds graft; an incorruptible one slows it', () => {
    const greedy = mkOfficer({ id: 'g', traits: ['greedy'] as never });
    const clean = mkOfficer({ id: 'c', traits: ['incorruptible'] as never });
    const plain = mkOfficer({ id: 'p', traits: [] as never });
    expect(corruptionAccrualMultiplier([greedy])).toBeCloseTo(1.5, 5);
    expect(corruptionAccrualMultiplier([clean])).toBeCloseTo(0.5, 5);
    expect(corruptionAccrualMultiplier([plain])).toBe(1);
    // both present roughly cancel
    expect(corruptionAccrualMultiplier([greedy, clean])).toBeCloseTo(0.75, 5);
  });
});
