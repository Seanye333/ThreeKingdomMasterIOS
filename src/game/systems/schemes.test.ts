/** 大局計略 — locks targeting rules and odds. */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import type { DiplomaticState } from '../types/diplomacy';
import { mkOfficer } from '../../test/factories';
import { forcesAdjacent, forceEmbroiled, schemeOdds, schemeExposureChance, validateScheme } from './schemes';

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
  it('離間盟好 is easier the shallower the bond', () => {
    const allied = (score: number): DiplomaticState => ({ relations: { 'shu__wu': { forceA: 'shu', forceB: 'wu', score, status: 'allied' } } });
    expect(schemeOdds('sow-discord', allied(20), sage, 'shu', 'wu'))
      .toBeGreaterThan(schemeOdds('sow-discord', allied(90), sage, 'shu', 'wu'));
  });
});

describe('new schemes (§7.2)', () => {
  it('離間盟好 needs an actual pact between A and B', () => {
    const allied: DiplomaticState = { relations: { 'shu__wu': { forceA: 'shu', forceB: 'wu', score: 60, status: 'allied' } } };
    expect(validateScheme('sow-discord', cities, 'wei', 'shu', 'wu', allied)).toBeNull();
    // shu↔wei are neutral → no pact to break.
    expect(validateScheme('sow-discord', cities, 'wu', 'shu', 'wei', allied)).toBe('二者本無盟可離');
  });
  it('疑兵之計 only works on a bordering rival', () => {
    expect(validateScheme('feign-strength', cities, 'wei', 'wu')).toBeNull();   // wei↔wu adjacent
    expect(validateScheme('feign-strength', cities, 'wei', 'shu')).toBe('其與我不接壤,疑兵無用');
  });
  it('流言亂政 may target any rival realm', () => {
    expect(validateScheme('sow-chaos', cities, 'wei', 'shu')).toBeNull();
    expect(validateScheme('sow-chaos', cities, 'wei', 'wei')).toBe('不可以己方為目標');
  });
  it('趁火打劫 / forceEmbroiled: an unsettled or two-front rival is ripe; a calm one is not', () => {
    const calm: DiplomaticState = { relations: {} };
    // wu (b1) borders both wei (a1) and shu (c1), all neutral → two-front war.
    expect(forceEmbroiled(cities, calm, 'wu', 'wei')).toBe(true);
    // From shu's view, its only neighbour wu — but check a one-neighbour, content force:
    const lone: Record<string, City> = { x1: { id: 'x1', ownerForceId: 'lu', adjacentCityIds: [], loyalty: 90 } as City };
    expect(forceEmbroiled(lone, calm, 'lu', 'wei')).toBe(false);
    // A city in unrest makes it embroiled regardless.
    const unrest: Record<string, City> = { y1: { id: 'y1', ownerForceId: 'lu', adjacentCityIds: [], loyalty: 30 } as City };
    expect(forceEmbroiled(unrest, calm, 'lu', 'wei')).toBe(true);
  });
  it('連環計 needs a pact between A and B, like 離間', () => {
    const allied: DiplomaticState = { relations: { 'shu__wu': { forceA: 'shu', forceB: 'wu', score: 50, status: 'allied' } } };
    expect(validateScheme('chain-link', cities, 'wei', 'shu', 'wu', allied)).toBeNull();
    expect(validateScheme('chain-link', cities, 'wu', 'shu', 'wei', allied)).toBe('二者本無盟可離');
  });
});

describe('抗謀 + 反間敗露 (§7.2 ①)', () => {
  const sage = mkOfficer({ stats: { intelligence: 100 } });
  it('a sharp target counsel shaves the scheme odds (抗謀)', () => {
    const naive = schemeOdds('sow-chaos', diplo(0), sage, 'shu', undefined, 40);
    const wary = schemeOdds('sow-chaos', diplo(0), sage, 'shu', undefined, 100);
    expect(wary).toBeLessThan(naive);
  });
  it('schemeExposureChance: a botched plot leaks far more than a clean one; a sage hides their hand', () => {
    expect(schemeExposureChance('sow-chaos', false, 50)).toBeGreaterThan(schemeExposureChance('sow-chaos', true, 50));
    expect(schemeExposureChance('sow-chaos', false, 100)).toBeLessThan(schemeExposureChance('sow-chaos', false, 50));
    expect(schemeExposureChance('far-friend', false, 0)).toBe(0); // overt courtship hides nothing
  });
});

describe('§7.2 再深化 — 假詔 / 詐敗 / 無中生有', () => {
  const sage = mkOfficer({ stats: { intelligence: 90 } });
  it('假詔討賊 needs two distinct targets (not self), no adjacency required', () => {
    expect(validateScheme('imperial-edict', cities, 'wei', 'wu', 'shu')).toBeNull(); // wu↔shu need not border
    expect(validateScheme('imperial-edict', cities, 'wei', 'wu', 'wu')).toBe('需選兩個不同目標');
    expect(validateScheme('imperial-edict', cities, 'wei', 'wei', 'shu')).toBe('不可以己方為目標');
  });
  it('詐敗誘敵 needs a bordering rival, like 疑兵', () => {
    expect(validateScheme('feign-defeat', cities, 'wei', 'wu')).toBeNull();       // wei↔wu adjacent
    expect(validateScheme('feign-defeat', cities, 'wei', 'shu')).toBe('其與我不接壤,疑兵無用');
  });
  it('無中生有 targets any rival realm', () => {
    expect(validateScheme('fabricate', cities, 'wei', 'shu')).toBeNull();
    expect(validateScheme('fabricate', cities, 'wei', 'wei')).toBe('不可以己方為目標');
  });
  it('all three carry sane odds that reward a clever strategist', () => {
    for (const s of ['imperial-edict', 'feign-defeat', 'fabricate'] as const) {
      const dull = schemeOdds(s, diplo(0), mkOfficer({ stats: { intelligence: 40 } }), 'shu', 'wu');
      const sharp = schemeOdds(s, diplo(0), sage, 'shu', 'wu');
      expect(sharp).toBeGreaterThan(dull);
      expect(sharp).toBeLessThanOrEqual(0.95);
    }
  });
});
