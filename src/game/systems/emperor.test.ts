/** 奉迎天子 — locks custody resolution and the welcome gate. */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import { canWelcomeEmperor, emperorCustodian } from './emperor';

const cities: Record<string, City> = {
  luoyang: { id: 'luoyang', ownerForceId: 'cao' } as City,
  xuchang: { id: 'xuchang', ownerForceId: 'cao' } as City,
  chengdu: { id: 'chengdu', ownerForceId: 'shu' } as City,
};

describe('emperorCustodian', () => {
  it('custody follows ownership of the emperor city', () => {
    expect(emperorCustodian(cities, 'luoyang')).toBe('cao');
    expect(emperorCustodian(cities, null)).toBeNull();
    expect(emperorCustodian({ ...cities, luoyang: { ...cities.luoyang, ownerForceId: null } as City }, 'luoyang')).toBeNull();
  });
});

describe('canWelcomeEmperor', () => {
  it('only the custodian may welcome, and only into a capital they hold', () => {
    expect(canWelcomeEmperor(cities, 'luoyang', 'cao', 'xuchang')).toBe(true);
    expect(canWelcomeEmperor(cities, 'luoyang', 'shu', 'chengdu')).toBe(false);
    // Already at the capital — nothing to do.
    expect(canWelcomeEmperor(cities, 'xuchang', 'cao', 'xuchang')).toBe(false);
  });
});
