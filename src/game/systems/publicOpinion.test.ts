import { describe, it, expect } from 'vitest';
import { localEsteem, esteemTier, esteemEffects } from './publicOpinion';
import type { City, Officer } from '../types';

const city = (over: Partial<City> = {}): City => ({
  id: 'c1', name: { zh: '城', en: 'City' }, coords: { x: 0, y: 0 }, adjacentCityIds: [],
  ownerForceId: 'f1', population: 200000, gold: 1000, food: 20000, troops: 5000,
  agriculture: 50, commerce: 50, defense: 50, loyalty: 50,
  ...over,
} as City);

const sage = (int: number, cha: number): Officer => ({
  id: 'o', name: { zh: '士', en: 'Scholar' }, forceId: 'f1', loyalty: 80,
  stats: { war: 30, leadership: 40, intelligence: int, politics: 70, charisma: cha },
  status: 'idle', locationCityId: 'c1', equipment: [],
} as unknown as Officer);

describe('鄉論', () => {
  it('an ordinary district sits near the middle', () => {
    const v = localEsteem({ city: city() });
    expect(v).toBeGreaterThan(25);
    expect(v).toBeLessThan(55);
  });

  it('good governance raises it and graft sinks it', () => {
    const base = localEsteem({ city: city() });
    expect(localEsteem({ city: city({ loyalty: 90, culture: 80 }) })).toBeGreaterThan(base);
    expect(localEsteem({ city: city({ corruption: 90 }) })).toBeLessThan(base);
    expect(localEsteem({ city: city({ caseload: 90 }) })).toBeLessThan(base);
  });

  it('峻法之下無清議;寬刑稍寬之', () => {
    const strict = localEsteem({ city: city(), lawSeverity: 'strict' });
    const lenient = localEsteem({ city: city(), lawSeverity: 'lenient' });
    expect(strict).toBeLessThan(lenient);
  });

  it('名士坐鎮 — a man of parts gathers the district talk to himself', () => {
    const bare = localEsteem({ city: city() });
    const withSage = localEsteem({ city: city(), residents: [sage(95, 90)] });
    expect(withSage).toBeGreaterThan(bare);
    // A mediocrity in residence changes nothing.
    expect(localEsteem({ city: city(), residents: [sage(45, 40)] })).toBe(bare);
  });

  it('stays inside 0–100 at both extremes', () => {
    const best = localEsteem({
      city: city({ loyalty: 100, culture: 100, corruption: 0, caseload: 0 }),
      residents: [sage(100, 100)], lawSeverity: 'lenient',
    });
    const worst = localEsteem({
      city: city({ loyalty: 0, culture: 0, corruption: 100, caseload: 100 }),
      lawSeverity: 'strict',
    });
    expect(best).toBeLessThanOrEqual(100);
    expect(worst).toBeGreaterThanOrEqual(0);
    expect(best).toBeGreaterThan(worst);
  });

  it('tiers read from 為鄉里所鄙 to 衣冠淵藪', () => {
    expect(esteemTier(10).zh).toBe('為鄉里所鄙');
    expect(esteemTier(30).zh).toBe('士人不至');
    expect(esteemTier(50).zh).toBe('鄉里尋常');
    expect(esteemTier(65).zh).toBe('鄉論稱美');
    expect(esteemTier(85).zh).toBe('衣冠淵藪');
  });
});

describe('鄉論之效', () => {
  it('50 is the neutral point', () => {
    const e = esteemEffects(50);
    expect(e.searchMul).toBe(1);
    expect(e.recruitBonus).toBe(0);
    expect(e.recommendBonus).toBe(0);
  });

  it('a celebrated district finds talent and keeps it', () => {
    const e = esteemEffects(100);
    expect(e.searchMul).toBeGreaterThan(1.3);
    expect(e.recruitBonus).toBeGreaterThan(0.09);
    expect(e.recommendBonus).toBeGreaterThan(5);
  });

  it('a despised one repels it', () => {
    const e = esteemEffects(0);
    expect(e.searchMul).toBeLessThan(0.7);
    expect(e.recruitBonus).toBeLessThan(0);
    expect(e.badgeZh).toContain('裹足');
  });
});
