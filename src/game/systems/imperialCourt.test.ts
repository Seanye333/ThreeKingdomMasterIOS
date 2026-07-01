import { describe, it, expect } from 'vitest';
import type { Force, Officer } from '../types';
import {
  officerAge, isMinorRuler, pickRegent, regentAmbitionBoost,
  consortAmbitionBoost, orthodoxyScore, isProclaimed, COMING_OF_AGE,
} from './imperialCourt';
import type { MandateState } from './mandate';

function mkOfficer(id: string, over: Partial<Officer> = {}): Officer {
  return {
    id, name: { zh: id, en: id }, forceId: 'wei', birthYear: 180,
    stats: { leadership: 70, war: 60, intelligence: 80, politics: 80, charisma: 70 },
    loyalty: 70, status: 'idle', locationCityId: 'c1', task: null,
    equipment: {} as Officer['equipment'], skills: [], rank: 'soldier', ...over,
  } as Officer;
}
function mkForce(over: Partial<Force> = {}): Force {
  return { id: 'wei', name: { zh: '魏', en: 'Wei' }, rulerOfficerId: 'ruler', capitalCityId: 'c1', color: '#00f', isPlayer: false, ...over } as Force;
}

describe('§7.4 帝室朝政 — age & regency', () => {
  it('officerAge / isMinorRuler read the ruler\'s years', () => {
    const child = mkOfficer('ruler', { birthYear: 215 });
    const adult = mkOfficer('ruler', { birthYear: 190 });
    expect(officerAge(child, 228)).toBe(13);
    expect(isMinorRuler(mkForce(), { ruler: child }, 228)).toBe(true);   // age 13 < 18
    expect(isMinorRuler(mkForce(), { ruler: adult }, 228)).toBe(false);  // age 38
  });

  it('pickRegent chooses an able grown official, never the child ruler', () => {
    const officers: Record<string, Officer> = {
      ruler: mkOfficer('ruler', { birthYear: 216 }),
      sima: mkOfficer('sima', { birthYear: 179, stats: { leadership: 90, war: 70, intelligence: 95, politics: 95, charisma: 80 } }),
      kid: mkOfficer('kid', { birthYear: 214, stats: { leadership: 99, war: 99, intelligence: 99, politics: 99, charisma: 99 } }), // too young
    };
    const r = pickRegent(mkForce(), officers, 228);
    expect(r?.id).toBe('sima');
  });

  it('an able DISLOYAL regent/consort strains the throne; a devoted one does not', () => {
    const loyalStrong = mkOfficer('a', { loyalty: 90, stats: { leadership: 95, war: 80, intelligence: 90, politics: 90, charisma: 80 } });
    const disloyalStrong = mkOfficer('b', { loyalty: 20, stats: { leadership: 95, war: 80, intelligence: 90, politics: 90, charisma: 80 } });
    expect(regentAmbitionBoost(disloyalStrong)).toBeGreaterThan(regentAmbitionBoost(loyalStrong));
    expect(regentAmbitionBoost(loyalStrong)).toBe(0); // loyalty ≥ 60 → no push
    expect(consortAmbitionBoost(disloyalStrong)).toBeGreaterThan(0);
  });
});

describe('§7.4 帝室朝政 — orthodoxy (正統)', () => {
  const mandate: MandateState = { byForce: { wei: 60, shu: 55 } };
  it('holding the 天子 and higher 天命 lift a claimant\'s legitimacy', () => {
    const wei = mkForce({ id: 'wei', imperialRank: 'emperor', foundingYear: 220 });
    const withEmperor = orthodoxyScore({ force: wei, mandate, holdsEmperor: true, cityCount: 10, year: 226 });
    const without = orthodoxyScore({ force: wei, mandate, holdsEmperor: false, cityCount: 10, year: 226 });
    expect(withEmperor).toBeGreaterThan(without);
  });
  it('isProclaimed spots a self-proclaimed emperor', () => {
    expect(isProclaimed(mkForce({ imperialRank: 'emperor' }))).toBe(true);
    expect(isProclaimed(mkForce({ imperialRank: 'king' }))).toBe(false);
  });
  it('COMING_OF_AGE is a sane threshold', () => {
    expect(COMING_OF_AGE).toBeGreaterThanOrEqual(14);
    expect(COMING_OF_AGE).toBeLessThanOrEqual(20);
  });
});
