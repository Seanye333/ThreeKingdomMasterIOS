import { describe, it, expect } from 'vitest';
import { mkOfficer } from '../../test/factories';
import type { FamilyRelation } from '../types';
import {
  isMartyr, executionRenownCost, markSlainVendetta, aiCaptiveVerdict, aiRecruitChance,
} from './captiveFate';
import { estimateRecruitChance } from './officerFate';
import type { City, Force } from '../types';

describe('俘虜 — 寧死不降 (martyr)', () => {
  it('the ironhearted / iron-boned refuse captivity', () => {
    expect(isMartyr(mkOfficer({ traits: ['ironhearted'] as never }))).toBe(true);
    expect(isMartyr(mkOfficer({ traits: ['iron-bones'] as never }))).toBe(true);
    expect(isMartyr(mkOfficer({ traits: ['loyal'] as never }))).toBe(false);
  });

  it('a martyr cannot be persuaded at all (estimateRecruitChance = 0)', () => {
    const pangde = mkOfficer({ id: 'pang-de', status: 'imprisoned', loyalty: 70, traits: ['ironhearted'] as never });
    const city = { id: 'c', gold: 9999 } as City;
    const force = { id: 'shu', name: { zh: '蜀', en: 'Shu' } } as Force;
    const ruler = mkOfficer({ id: 'liu-bei', stats: { charisma: 95 } as never });
    // Even a silver-tongued lord with a won debate gets nowhere.
    const chance = estimateRecruitChance({ officer: pangde, city, recruiterForce: force, recruiterRuler: ruler, approach: 'righteous', debateWon: true } as never);
    expect(chance).toBe(0);
  });
});

describe('俘虜 — 殺降之累 (execution renown cost)', () => {
  it('killing a man of honour/fame/martyrdom costs far more than a nobody', () => {
    const nobody = mkOfficer({ stats: { war: 50, leadership: 50, intelligence: 50, politics: 50, charisma: 50 } as never });
    const hero = mkOfficer({ renown: 60, traits: ['loyal', 'noble'] as never, stats: { war: 95, leadership: 88, intelligence: 70, politics: 60, charisma: 80 } as never });
    const martyr = mkOfficer({ renown: 40, traits: ['ironhearted', 'loyal'] as never, stats: { war: 92, leadership: 80, intelligence: 50, politics: 40, charisma: 70 } as never });
    expect(executionRenownCost(hero)).toBeGreaterThan(executionRenownCost(nobody));
    expect(executionRenownCost(martyr)).toBeGreaterThan(executionRenownCost(nobody));
    expect(executionRenownCost(hero)).toBeLessThanOrEqual(20); // capped
  });
});

describe('俘虜 — 宿怨 (vendetta marking)', () => {
  it('marks the slain man’s kin with the killer’s force', () => {
    const officers = {
      victim: mkOfficer({ id: 'victim', status: 'imprisoned' }),
      son: mkOfficer({ id: 'son', forceId: 'wu', status: 'active' }),
    };
    const family: FamilyRelation[] = [{ kind: 'parent-child', officerA: 'victim', officerB: 'son' } as never];
    const next = markSlainVendetta(officers, 'victim', 'wei', family, []);
    expect(next.son.killedRelativesBy?.victim).toBe('wei');
    // The original map is untouched (pure).
    expect(officers.son.killedRelativesBy).toBeUndefined();
  });
});

describe('俘虜 — AI 處置判定 (verdict)', () => {
  const merciful = mkOfficer({ id: 'liu-bei', traits: ['benevolent'] as never, stats: { charisma: 90 } as never });
  const cruel = mkOfficer({ id: 'dong-zhuo', traits: ['cruel'] as never, stats: { charisma: 40 } as never });
  const dangerous = mkOfficer({ id: 'big', stats: { war: 95, leadership: 90, intelligence: 60, politics: 50, charisma: 60 } as never });

  it('a high recruit chance turns the prisoner', () => {
    expect(aiCaptiveVerdict({ ruler: merciful, victim: dangerous, recruitChance: 1, rng: () => 0.1 })).toBe('recruit');
  });

  it('a benevolent lord frees rather than kills', () => {
    expect(aiCaptiveVerdict({ ruler: merciful, victim: dangerous, recruitChance: 0, rng: () => 0.99 })).toBe('release');
  });

  it('a cruel lord cuts down the dangerous', () => {
    expect(aiCaptiveVerdict({ ruler: cruel, victim: dangerous, recruitChance: 0, rng: () => 0.1 })).toBe('execute');
  });

  it('a martyr / kin-killer yields zero recruit chance for the captor', () => {
    const martyr = mkOfficer({ traits: ['ironhearted'] as never, loyalty: 10 });
    expect(aiRecruitChance(cruel, martyr, 'wei')).toBe(0);
    const grudged = mkOfficer({ loyalty: 10, killedSwornBy: { x: 'wei' } as never });
    expect(aiRecruitChance(cruel, grudged, 'wei')).toBe(0);
  });
});
