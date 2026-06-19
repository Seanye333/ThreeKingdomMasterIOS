import { describe, it, expect } from 'vitest';
import { navalEngagement } from './navalBattle';

const base = { aName: '周瑜', bName: '曹操', rng: () => 0.0 };

describe('navalEngagement (水戰火攻)', () => {
  it('a brilliant admiral on a windy day looses fire-ships', () => {
    const r = navalEngagement({ ...base, aIntel: 96, bIntel: 70, weatherKind: 'wind', windPower: 3, rng: () => 0.0 });
    expect(r.fire).toBe('a');
    expect(r.aMul).toBeGreaterThan(1);
    expect(r.bMul).toBe(1);
    expect(r.recapZh).toContain('火');
  });

  it('rain douses any fire attack', () => {
    const r = navalEngagement({ ...base, aIntel: 100, bIntel: 50, weatherKind: 'rain', windPower: 3, rng: () => 0.0 });
    expect(r.fire).toBeNull();
    expect(r.aMul).toBe(1);
    expect(r.bMul).toBe(1);
  });

  it('the higher-intellect side is the one who burns the other', () => {
    const r = navalEngagement({ ...base, aIntel: 60, bIntel: 95, weatherKind: 'clear', windPower: 2, rng: () => 0.0 });
    expect(r.fire).toBe('b');
    expect(r.bMul).toBeGreaterThan(1);
  });

  it('a dull commander in dead calm rarely manages it (high rng roll fails)', () => {
    const r = navalEngagement({ ...base, aIntel: 62, bIntel: 50, weatherKind: 'clear', windPower: 0, rng: () => 0.99 });
    expect(r.fire).toBeNull();
  });

  it('fire power scales with wind strength', () => {
    const calm = navalEngagement({ ...base, aIntel: 95, bIntel: 50, weatherKind: 'clear', windPower: 0, rng: () => 0.0 });
    const gale = navalEngagement({ ...base, aIntel: 95, bIntel: 50, weatherKind: 'wind', windPower: 3, rng: () => 0.0 });
    expect(gale.aMul).toBeGreaterThan(calm.aMul);
  });
});
