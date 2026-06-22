/** 徵兵 — conscription draws population and dents loyalty (民怨). */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import { mkOfficer } from '../../test/factories';
import { resolveInternalAffairs } from './commands';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wei', troops: 4000, gold: 5000, food: 40000,
    loyalty: 80, agriculture: 60, commerce: 60, defense: 60, population: 200000,
    adjacentCityIds: [], name: { zh: over.id, en: over.id },
    ...over,
  } as unknown as City);

describe('徵兵 — conscription costs population and loyalty', () => {
  it('raises troops, draws ~1.4× as many people, and dents loyalty', () => {
    const o = mkOfficer({ id: 'gov', stats: { charisma: 80 } });
    const res = resolveInternalAffairs('recruit-troops', o, mkCity({ id: 'ye', population: 200000, loyalty: 80 }), () => 0.5);
    expect(res.success).toBe(true);
    expect(res.delta?.troops).toBeGreaterThan(0);
    expect(res.delta?.population).toBe(-Math.round(res.delta!.troops! * 1.4));
    expect(res.delta?.loyalty).toBeLessThan(0); // 民怨
    expect(res.delta?.loyalty).toBeGreaterThanOrEqual(-8);
  });

  it('every successful levy stings loyalty by at least 1', () => {
    const o = mkOfficer({ id: 'gov', stats: { charisma: 80 } });
    const res = resolveInternalAffairs('recruit-troops', o, mkCity({ id: 'big', population: 400000 }), () => 0.5);
    expect(res.success).toBe(true);
    expect(res.delta!.loyalty!).toBeLessThanOrEqual(-1);
  });

  it('a near-empty city cannot levy and pays no loyalty', () => {
    const o = mkOfficer({ id: 'gov', stats: { charisma: 60 } });
    const res = resolveInternalAffairs('recruit-troops', o, mkCity({ id: 'hamlet', population: 50, loyalty: 80 }), () => 0.5);
    expect(res.success).toBe(false);
    expect(res.delta?.loyalty ?? 0).toBe(0);
  });
});
