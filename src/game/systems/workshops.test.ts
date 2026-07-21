import { describe, it, expect } from 'vitest';
import {
  armamentEffects, armamentTier, armamentCapacity, armamentsTick, armWorksResult,
  ARM_CEILING, IRON_PER_ARM_POINT, ARM_NEUTRAL,
} from './workshops';

describe('軍器之效', () => {
  it('the ordinary city\'s fill is the neutral point', () => {
    const e = armamentEffects(ARM_NEUTRAL);
    expect(e.defenseMul).toBe(1);
    expect(e.recruitMul).toBe(1);
    expect(e.drillDelta).toBe(0);
  });

  it('無甲不成軍 — an empty armoury guts recruiting and the walls', () => {
    const e = armamentEffects(0);
    expect(e.recruitMul).toBeLessThan(0.86);
    expect(e.defenseMul).toBeLessThan(0.9);
    expect(e.drillDelta).toBeLessThan(0);
  });

  it('a full armoury helps, but an empty one hurts more — and takes longer', () => {
    const full = armamentEffects(100);
    const empty = armamentEffects(0);
    expect(full.recruitMul).toBeGreaterThan(1);
    expect(full.recruitMul - 1).toBeLessThan(1 - empty.recruitMul);
    // The bonus saturates at ARM_NEUTRAL + ARM_SPAN, the penalty at 0.
    expect(armamentEffects(ARM_NEUTRAL + 40)).toEqual(armamentEffects(100));
  });

  it('clamps and defaults', () => {
    expect(armamentEffects(undefined).recruitMul).toBeLessThan(1); // 0 = ill armed
    expect(armamentEffects(500)).toEqual(armamentEffects(ARM_CEILING));
  });

  it('tiers read from 無甲不成軍 to 甲堅兵利', () => {
    expect(armamentTier(0).zh).toBe('無甲不成軍');
    expect(armamentTier(20).zh).toBe('器械不齊');
    expect(armamentTier(40).zh).toBe('軍器足用');
    expect(armamentTier(90).zh).toBe('甲堅兵利');
  });
});

describe('工官之力', () => {
  it('an armoury and an iron province both raise the ceiling', () => {
    const bare = armamentCapacity({});
    expect(armamentCapacity({ arsenalLevel: 3 })).toBeGreaterThan(bare);
    expect(armamentCapacity({ ironProducer: true })).toBeGreaterThan(bare);
    expect(armamentCapacity({ arsenalLevel: 4, ironProducer: true, politics: 90, population: 500000 }))
      .toBeLessThanOrEqual(ARM_CEILING);
  });

  it('郡國鐵官 — local smiths work with no stockpile at all', () => {
    // The 20-year soak caught the opposite: with iron as a hard gate, every city
    // that does not smelt sat at 0 forever while paying the 無甲 penalty.
    const t = armamentsTick({ current: 10, iron: 0, troops: 9000, arsenalLevel: 1, population: 200000 });
    expect(t.ironUsed).toBe(0);
    expect(t.armaments).toBeGreaterThan(10);
  });

  it('…but a stockpile of iron builds far faster than smiths alone', () => {
    const bare = armamentsTick({ current: 10, iron: 0, troops: 9000, arsenalLevel: 3, population: 200000 });
    const stocked = armamentsTick({ current: 10, iron: 9000, troops: 9000, arsenalLevel: 3, population: 200000 });
    expect(stocked.armaments).toBeGreaterThan(bare.armaments);
    expect(stocked.ironUsed).toBeGreaterThan(0);
  });

  it('a huge garrison still outpaces a bare workshop', () => {
    const t = armamentsTick({ current: 50, iron: 0, troops: 200000, population: 50000 });
    expect(t.armaments).toBeLessThan(50);
  });

  it('iron in the yard fills the armoury toward its ceiling', () => {
    let v = 10;
    for (let i = 0; i < 20; i++) {
      v = armamentsTick({ current: v, iron: 5000, troops: 3000, arsenalLevel: 3, ironProducer: true }).armaments;
    }
    expect(v).toBeGreaterThan(40);
    expect(v).toBeLessThanOrEqual(armamentCapacity({ arsenalLevel: 3, ironProducer: true }));
  });

  it('a big garrison eats the armoury faster than a small one', () => {
    const small = armamentsTick({ current: 60, iron: 0, troops: 1000 }).armaments;
    const huge = armamentsTick({ current: 60, iron: 0, troops: 40000 }).armaments;
    expect(huge).toBeLessThan(small);
  });

  it('重役 presses more hands into the workshops', () => {
    const rest = armamentsTick({ current: 20, iron: 9000, troops: 3000, arsenalLevel: 2, corvee: 'none' });
    const heavy = armamentsTick({ current: 20, iron: 9000, troops: 3000, arsenalLevel: 2, corvee: 'heavy' });
    expect(heavy.armaments).toBeGreaterThan(rest.armaments);
    expect(heavy.ironUsed).toBeGreaterThan(rest.ironUsed);
  });

  it('never overspends iron it does not have', () => {
    const t = armamentsTick({ current: 0, iron: IRON_PER_ARM_POINT, troops: 0, arsenalLevel: 4 });
    expect(t.ironUsed).toBeLessThanOrEqual(IRON_PER_ARM_POINT);
  });

  it('stays inside 0–100 whatever you throw at it', () => {
    expect(armamentsTick({ current: 100, iron: 99999, troops: 0, arsenalLevel: 4 }).armaments)
      .toBeLessThanOrEqual(ARM_CEILING);
    expect(armamentsTick({ current: 0, iron: 0, troops: 99999 }).armaments).toBe(0);
  });
});

describe('督造軍器', () => {
  it('iron is the hard constraint, not coin', () => {
    const rich = armWorksResult({ armaments: 0, iron: 100000, politics: 90, arsenalLevel: 4 });
    const dry = armWorksResult({ armaments: 0, iron: 100, politics: 90, arsenalLevel: 4 });
    expect(dry.gained).toBeLessThan(rich.gained);
    expect(dry.ironUsed).toBeLessThanOrEqual(100);
  });

  it('a capable officer with a real armoury does more', () => {
    const clerk = armWorksResult({ armaments: 0, iron: 100000, politics: 20 });
    const master = armWorksResult({ armaments: 0, iron: 100000, politics: 95, arsenalLevel: 4 });
    expect(master.gained).toBeGreaterThan(clerk.gained);
  });

  it('never overfills a full armoury', () => {
    expect(armWorksResult({ armaments: 100, iron: 100000, politics: 90 }).gained).toBe(0);
  });
});
