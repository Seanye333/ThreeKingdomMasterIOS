/** 大局計略 — locks targeting rules and odds. */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import type { DiplomaticState } from '../types/diplomacy';
import { mkOfficer } from '../../test/factories';
import { forcesAdjacent, schemeOdds, validateScheme } from './schemes';

const cities: Record<string, City> = {
  a1: { id: 'a1', ownerForceId: 'wei', adjacentCityIds: ['b1'] } as City,
  b1: { id: 'b1', ownerForceId: 'wu', adjacentCityIds: ['a1', 'c1'] } as City,
  c1: { id: 'c1', ownerForceId: 'shu', adjacentCityIds: ['b1'] } as City,
};
const diplo = (score: number): DiplomaticState => ({
  relations: { 'shu__wu': { forceA: 'shu', forceB: 'wu', score, status: 'neutral' } },
});

describe('validateScheme', () => {
  it('驅虎吞狼 needs the two beasts to share a border', () => {
    expect(validateScheme('tiger-wolf', cities, 'wei', 'wu', 'shu')).toBeNull();
    expect(validateScheme('tiger-wolf', cities, 'wu', 'wei', 'shu')).toBe('兩家無接壤,驅之不動');
    expect(validateScheme('tiger-wolf', cities, 'wei', 'wei', 'wu')).toBe('不可以己方為目標');
  });
  it('遠交近攻 refuses neighbours', () => {
    expect(validateScheme('far-friend', cities, 'wei', 'shu')).toBeNull(); // wei↔shu not adjacent
    expect(validateScheme('far-friend', cities, 'wei', 'wu')).toBe('遠交者不可接壤');
  });
  it('forcesAdjacent reads the map honestly', () => {
    expect(forcesAdjacent(cities, 'wei', 'wu')).toBe(true);
    expect(forcesAdjacent(cities, 'wei', 'shu')).toBe(false);
  });
});

describe('schemeOdds', () => {
  const sage = mkOfficer({ stats: { intelligence: 100 } });
  it('bad blood makes the push easier; friendship resists it', () => {
    expect(schemeOdds('tiger-wolf', diplo(-60), sage, 'shu', 'wu'))
      .toBeGreaterThan(schemeOdds('tiger-wolf', diplo(50), sage, 'shu', 'wu'));
  });
  it('遠交近攻 is mostly a formality with a good envoy', () => {
    expect(schemeOdds('far-friend', diplo(0), sage, 'shu')).toBeGreaterThan(0.8);
  });
});
