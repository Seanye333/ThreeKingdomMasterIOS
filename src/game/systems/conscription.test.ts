import { describe, it, expect } from 'vitest';
import {
  serviceEffects, seasonPay, payGarrison, aiServiceSystem,
  SERVICE_SYSTEMS, SERVICE_NAMES,
} from './conscription';

describe('兵制', () => {
  it('更卒 is the neutral Han default', () => {
    const e = serviceEffects(undefined);
    expect(e.recruitMul).toBe(1);
    expect(e.payPerThousand).toBe(0);
    expect(e.foodUpkeepMul).toBe(1);
  });

  it('世兵 is cheap and steady but a closed pool', () => {
    const h = serviceEffects('hereditary');
    expect(h.foodUpkeepMul).toBeLessThan(1);
    expect(h.desertionMul).toBeLessThan(1);
    expect(h.drillDelta).toBeGreaterThan(0);
    expect(h.recruitMul).toBeLessThan(1);     // the caste is only so big
    expect(h.payPerThousand).toBe(0);
  });

  it('募兵 raises more men, spares the countryside, and bills you', () => {
    const p = serviceEffects('paid');
    expect(p.recruitMul).toBeGreaterThan(1);
    expect(p.popDrawMul).toBeLessThan(0.5);
    expect(p.loyaltyHitMul).toBeLessThan(0.5);
    expect(p.payPerThousand).toBeGreaterThan(0);
    expect(p.desertionMul).toBeGreaterThan(2);
  });

  it('every system is named in both languages', () => {
    for (const s of SERVICE_SYSTEMS) {
      expect(SERVICE_NAMES[s].zh.length).toBeGreaterThan(0);
      expect(SERVICE_NAMES[s].en.length).toBeGreaterThan(0);
    }
  });
});

describe('軍餉', () => {
  it('only 募兵 costs coin', () => {
    expect(seasonPay(20000, 'levy')).toBe(0);
    expect(seasonPay(20000, 'hereditary')).toBe(0);
    expect(seasonPay(20000, 'paid')).toBe(280);
  });

  it('a paid army in a full treasury costs gold and nothing else', () => {
    const r = payGarrison({ troops: 10000, gold: 5000, system: 'paid' });
    expect(r.paid).toBe(140);
    expect(r.arrears).toBe(0);
    expect(r.deserted).toBe(0);
    expect(r.loyaltyDelta).toBe(0);
  });

  it('arrears turn straight into desertion', () => {
    const r = payGarrison({ troops: 10000, gold: 0, system: 'paid' });
    expect(r.arrears).toBeGreaterThan(0);
    expect(r.deserted).toBeGreaterThan(0);
    expect(r.loyaltyDelta).toBeLessThan(0);
  });

  it('paying half is better than paying none', () => {
    const half = payGarrison({ troops: 10000, gold: 70, system: 'paid' });
    const none = payGarrison({ troops: 10000, gold: 0, system: 'paid' });
    expect(half.deserted).toBeLessThan(none.deserted);
  });

  it('an unpaid militia never deserts over wages it was never owed', () => {
    expect(payGarrison({ troops: 40000, gold: 0, system: 'levy' }))
      .toEqual({ paid: 0, arrears: 0, deserted: 0, loyaltyDelta: 0 });
  });

  it('never loses more men than are there', () => {
    const r = payGarrison({ troops: 50, gold: 0, system: 'paid' });
    expect(r.deserted).toBeLessThanOrEqual(50);
  });
});

describe('AI 兵制', () => {
  it('a rich aggressive lord hires', () => {
    expect(aiServiceSystem('aggressive', 5000)).toBe('paid');
  });

  it('a poor entrenched lord settles military households', () => {
    expect(aiServiceSystem('defensive', 300)).toBe('hereditary');
  });

  it('everyone else runs the Han levy', () => {
    expect(aiServiceSystem('balanced', 1500)).toBe('levy');
    expect(aiServiceSystem('aggressive', 800)).toBe('levy');
  });
});
