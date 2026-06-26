import { describe, it, expect } from 'vitest';
import { mkOfficer } from '../../test/factories';
import {
  marchSpeedMul, adjustMarchSeasons, forcedMarchAttrition, cautiousAttritionMul, arrivalFatigueMorale,
} from './marchPace';

describe('行軍節奏 — march pace', () => {
  it('forced shaves a 旬, cautious adds one, normal holds (never below 1)', () => {
    expect(adjustMarchSeasons(3, 'forced', 1)).toBe(2);
    expect(adjustMarchSeasons(3, 'cautious', 1)).toBe(4);
    expect(adjustMarchSeasons(3, 'normal', 1)).toBe(3);
    expect(adjustMarchSeasons(1, 'forced', 1)).toBe(1); // floored
  });

  it('forced march sheds stragglers; normal/cautious do not', () => {
    expect(forcedMarchAttrition('forced')).toBeGreaterThan(0);
    expect(forcedMarchAttrition('normal')).toBe(0);
    expect(forcedMarchAttrition('cautious')).toBe(0);
  });

  it('a cautious column halves its 孤軍深入 toll', () => {
    expect(cautiousAttritionMul('cautious')).toBe(0.5);
    expect(cautiousAttritionMul('normal')).toBe(1);
    expect(cautiousAttritionMul('forced')).toBe(1);
  });

  it('only a forced march arrives weary (疲勞 morale hit)', () => {
    expect(arrivalFatigueMorale('forced')).toBeGreaterThan(0);
    expect(arrivalFatigueMorale('cautious')).toBe(0);
    expect(arrivalFatigueMorale('normal')).toBe(0);
  });
});

describe('行軍捷疾 — march speed from traits & 驛站', () => {
  it('健行 / 嚴峻 / 騎將 / 鐵律 / 驛站 quicken; 鈍重 lead drags', () => {
    expect(marchSpeedMul([mkOfficer({ traits: ['tireless-march'] as never })])).toBeCloseTo(1.15);
    expect(marchSpeedMul([mkOfficer({ traits: ['stern'] as never })])).toBeCloseTo(1.10);
    expect(marchSpeedMul([mkOfficer({ policies: ['post-roads'] as never })])).toBeCloseTo(1.10);
    expect(marchSpeedMul([mkOfficer({})])).toBe(1);
    expect(marchSpeedMul([mkOfficer({ traits: ['ponderous'] as never })])).toBeCloseTo(0.90);
  });

  it('best single facilitator counts (no stacking), but the lead 鈍重 still drags', () => {
    // tireless (0.15) is the best; a second stern officer doesn't add.
    const pool = [mkOfficer({ traits: ['tireless-march'] as never }), mkOfficer({ traits: ['stern'] as never })];
    expect(marchSpeedMul(pool)).toBeCloseTo(1.15);
  });

  it('a fast column shaves a 旬 off a long road; a plodder adds one', () => {
    const fast = marchSpeedMul([mkOfficer({ traits: ['tireless-march'] as never })]); // 1.15
    expect(adjustMarchSeasons(3, 'normal', fast)).toBe(2); // ≥1.12 on base≥2 → −1
    const slow = marchSpeedMul([mkOfficer({ traits: ['ponderous'] as never })]); // 0.90
    expect(adjustMarchSeasons(2, 'normal', slow)).toBe(3); // ≤0.92 → +1
  });
});
