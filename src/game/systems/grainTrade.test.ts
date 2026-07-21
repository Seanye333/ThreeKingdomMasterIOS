import { describe, it, expect } from 'vitest';
import {
  grainPrice, grainPolicyEffects, aiGrainPolicy, planGrainFlows, priceTier,
  PRICE_GAP_TRIGGER, MERCHANT_MARGIN, BUYER_PURSE_SHARE,
  type GrainNode,
} from './grainTrade';
import type { City } from '../types';

const city = (over: Partial<City> = {}): City => ({
  id: 'c1', name: { zh: '城', en: 'City' }, coords: { x: 0, y: 0 }, adjacentCityIds: [],
  ownerForceId: 'f1', population: 200000, gold: 1000, food: 20000, troops: 5000,
  agriculture: 50, commerce: 50, defense: 50, loyalty: 60,
  ...over,
} as City);

const node = (over: Partial<GrainNode> = {}): GrainNode => ({
  cityId: 'a', ownerForceId: 'f1', price: 10, food: 20000, troops: 1000,
  commerce: 50, loyalty: 60, ...over,
});

describe('米價', () => {
  it('a starving garrison pays more than a full granary', () => {
    const starving = grainPrice(city({ food: 2000, troops: 5000 }), 'summer');
    const glutted = grainPrice(city({ food: 60000, troops: 5000 }), 'summer');
    expect(starving).toBeGreaterThan(glutted);
  });

  it('winter dearth is dearer than the autumn glut', () => {
    expect(grainPrice(city(), 'winter')).toBeGreaterThan(grainPrice(city(), 'autumn'));
  });

  it('a hoard takes the good stuff off the market', () => {
    expect(grainPrice(city(), 'summer', { hoardMul: 0.6 }))
      .toBeGreaterThan(grainPrice(city(), 'summer'));
  });

  it('an ever-normal granary flattens the season swing', () => {
    const swingOpen = grainPrice(city(), 'winter') - grainPrice(city(), 'autumn');
    const swingStab = grainPrice(city(), 'winter', { stability: 0.6 })
      - grainPrice(city(), 'autumn', { stability: 0.6 });
    expect(swingStab).toBeLessThan(swingOpen);
  });

  it('tiers read cheap / fair / dear', () => {
    expect(priceTier(6).level).toBe('cheap');
    expect(priceTier(10).level).toBe('fair');
    expect(priceTier(18).level).toBe('dear');
  });
});

describe('糴政', () => {
  it('閉糴 stops every sack and costs the merchants', () => {
    const e = grainPolicyEffects('closed');
    expect(e.allowExport).toBe(false);
    expect(e.commerceDelta).toBeLessThan(0);
    expect(e.hoardPressure).toBeGreaterThan(0);
  });

  it('平糴 keeps grain in the realm, 通糴 lets it cross and taxes it', () => {
    expect(grainPolicyEffects('guided').allowCrossBorder).toBe(false);
    expect(grainPolicyEffects('open').allowCrossBorder).toBe(true);
    expect(grainPolicyEffects('open').tradeTax).toBeGreaterThan(0);
    expect(grainPolicyEffects(undefined).allowCrossBorder).toBe(false); // default 平糴
  });

  it('AI lords pick by temperament', () => {
    expect(aiGrainPolicy('merchant')).toBe('open');
    expect(aiGrainPolicy('tyrant')).toBe('closed');
    expect(aiGrainPolicy('unknown-kind')).toBe('guided');
  });
});

const twoCity = (over: { from?: Partial<GrainNode>; to?: Partial<GrainNode> } = {}) => ({
  nodes: [
    node({ cityId: 'rich', price: 7, food: 40000, troops: 1000, ...over.from }),
    node({ cityId: 'hungry', price: 16, food: 500, troops: 8000, ...over.to }),
  ],
  neighborsOf: (id: string) => (id === 'rich' ? ['hungry'] : ['rich']),
  canTrade: () => true,
});

describe('商旅轉輸', () => {
  it('grain walks from the cheap granary to the hungry fortress', () => {
    const { flows } = planGrainFlows({ ...twoCity(), policyOf: () => 'guided' });
    expect(flows).toHaveLength(1);
    expect(flows[0].fromCityId).toBe('rich');
    expect(flows[0].toCityId).toBe('hungry');
    expect(flows[0].food).toBeGreaterThan(0);
    // The merchant is paid out of the spread, so the buyer always pays more.
    expect(flows[0].buyerGold).toBeGreaterThan(flows[0].sellerGold);
    const margin = flows[0].buyerGold / flows[0].sellerGold - 1;
    expect(margin).toBeGreaterThan(0);
    expect(margin).toBeLessThan(MERCHANT_MARGIN * 1.5);
  });

  it('no gap, no caravan', () => {
    const flat = twoCity({ to: { price: 7 * PRICE_GAP_TRIGGER * 0.9, food: 500, troops: 8000 } });
    expect(planGrainFlows({ ...flat, policyOf: () => 'guided' }).flows).toHaveLength(0);
  });

  it('閉糴 keeps every sack at home', () => {
    expect(planGrainFlows({ ...twoCity(), policyOf: () => 'closed' }).flows).toHaveLength(0);
  });

  it('平糴 will not cross a border; 通糴 will, and takes a duty', () => {
    const cross = twoCity({ to: { cityId: 'hungry', ownerForceId: 'f2' } });
    expect(planGrainFlows({ ...cross, policyOf: () => 'guided' }).flows).toHaveLength(0);
    const open = planGrainFlows({ ...cross, policyOf: () => 'open' });
    expect(open.flows).toHaveLength(1);
    expect(open.flows[0].crossBorder).toBe(true);
    expect(open.duties['f1']).toBeGreaterThan(0);
    expect(open.duties['f2']).toBeGreaterThan(0);
  });

  it('a closed neighbour shuts the gate from its own side', () => {
    const cross = twoCity({ to: { cityId: 'hungry', ownerForceId: 'f2' } });
    const flows = planGrainFlows({
      ...cross,
      policyOf: (f) => (f === 'f2' ? 'closed' : 'open'),
    }).flows;
    expect(flows).toHaveLength(0);
  });

  it('war shuts the road even under 通糴', () => {
    const cross = twoCity({ to: { cityId: 'hungry', ownerForceId: 'f2' } });
    expect(planGrainFlows({ ...cross, canTrade: () => false, policyOf: () => 'open' }).flows)
      .toHaveLength(0);
  });

  it('one granary cannot be sold twice over', () => {
    const nodes = [
      node({ cityId: 'rich', price: 7, food: 3200, troops: 500 }),
      node({ cityId: 'h1', price: 18, food: 0, troops: 9000 }),
      node({ cityId: 'h2', price: 17, food: 0, troops: 9000 }),
    ];
    const { flows } = planGrainFlows({
      nodes,
      neighborsOf: (id) => (id === 'rich' ? ['h1', 'h2'] : ['rich']),
      canTrade: () => true,
      policyOf: () => 'guided',
    });
    const shipped = flows.reduce((s, f) => s + f.food, 0);
    // 3200 stored, 2000 held back as the garrison reserve → at most 1200 moves.
    expect(shipped).toBeLessThanOrEqual(1200);
    expect(flows.every((f) => f.fromCityId === 'rich')).toBe(true);
  });

  it('banditry thins the caravans, a 驛傳 fattens them', () => {
    const lawless = planGrainFlows({
      ...twoCity({ from: { cityId: 'rich', price: 7, food: 40000, troops: 1000, loyalty: 20 } }),
      policyOf: () => 'guided',
    }).flows[0];
    const guarded = planGrainFlows({
      ...twoCity({ from: { cityId: 'rich', price: 7, food: 40000, troops: 1000, depot: true } }),
      policyOf: () => 'guided',
    }).flows[0];
    expect(guarded.food).toBeGreaterThan(lawless.food);
  });

  it('a broke fortress starves next to the barge it cannot pay for', () => {
    const poor = twoCity({ to: { cityId: 'hungry', price: 16, food: 500, troops: 8000, gold: 0 } });
    expect(planGrainFlows({ ...poor, policyOf: () => 'guided' }).flows).toHaveLength(0);
    const flush = twoCity({ to: { cityId: 'hungry', price: 16, food: 500, troops: 8000, gold: 100000 } });
    expect(planGrainFlows({ ...flush, policyOf: () => 'guided' }).flows[0].food).toBeGreaterThan(0);
  });

  it('never spends more than the purse share on grain', () => {
    const thin = twoCity({ to: { cityId: 'hungry', price: 16, food: 500, troops: 8000, gold: 1000 } });
    const { flows } = planGrainFlows({ ...thin, policyOf: () => 'guided' });
    const paid = flows.reduce((s, f) => s + f.buyerGold, 0);
    expect(paid).toBeLessThanOrEqual(1000 * BUYER_PURSE_SHARE + 1);
  });

  it('is deterministic — same board, same plan', () => {
    const a = planGrainFlows({ ...twoCity(), policyOf: () => 'guided' });
    const b = planGrainFlows({ ...twoCity(), policyOf: () => 'guided' });
    expect(a).toEqual(b);
  });

  it('respects the season cap on caravans', () => {
    const nodes: GrainNode[] = [];
    for (let i = 0; i < 30; i++) {
      nodes.push(node({ cityId: `r${i}`, price: 6, food: 40000, troops: 100 }));
      nodes.push(node({ cityId: `h${i}`, price: 18, food: 0, troops: 9000 }));
    }
    const { flows } = planGrainFlows({
      nodes,
      neighborsOf: (id) => (id.startsWith('r') ? [`h${id.slice(1)}`] : [`r${id.slice(1)}`]),
      canTrade: () => true,
      policyOf: () => 'guided',
      maxFlows: 5,
    });
    expect(flows).toHaveLength(5);
  });
});
