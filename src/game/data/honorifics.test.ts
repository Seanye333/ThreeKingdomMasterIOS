import { describe, it, expect } from 'vitest';
import type { Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';
import {
  HONORIFICS,
  HONORIFICS_BY_ID,
  honorificTier,
  highestEligibleHonorific,
  honorificEffects,
} from './honorifics';

function mkOfficer(over: Partial<Officer> = {}): Officer {
  return {
    id: 'o1', name: { zh: '某將', en: 'Officer' }, forceId: 'f1',
    stats: { leadership: 70, war: 80, intelligence: 60, politics: 50, charisma: 60 },
    loyalty: 70, status: 'idle', locationCityId: 'c1', task: null,
    equipment: {} as Officer['equipment'], skills: [], rank: 'soldier', ...over,
  } as Officer;
}
function mkDeeds(over: Partial<HeroicDeeds> = {}): HeroicDeeds {
  return { officerId: 'o1', killsTroops: 0, duelsWon: 0, captured: 0, citiesTaken: 0, espionageSuccess: 0, civicWorks: 0, battlesWon: 0, battlesLost: 0, trainingsCompleted: 0, childrenSired: 0, ...over };
}

describe('honorific roster', () => {
  it('has a varied, themed roster with unique ids', () => {
    expect(HONORIFICS.length).toBeGreaterThanOrEqual(18);
    expect(new Set(HONORIFICS.map((h) => h.id)).size).toBe(HONORIFICS.length);
    expect(new Set(HONORIFICS.map((h) => h.theme)).size).toBeGreaterThanOrEqual(6);
  });
  it('every entry has merit gate, loyalty and renown', () => {
    for (const h of HONORIFICS) {
      expect(h.minMerit).toBeGreaterThan(0);
      expect(h.renownOnGrant).toBeGreaterThan(0);
      expect(h.tier).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('highestEligibleHonorific', () => {
  it('a green officer with little merit clears nothing high', () => {
    const o = mkOfficer({ stats: { leadership: 40, war: 45, intelligence: 40, politics: 40, charisma: 40 } });
    const best = highestEligibleHonorific(o, undefined);
    // war 45 → merit ~ (45+20)*2=130; clears only tier-1 valor/siege entries.
    if (best) expect(best.tier).toBe(1);
  });
  it('a decorated veteran clears an illustrious (tier-3) honorific', () => {
    const o = mkOfficer({ stats: { leadership: 95, war: 98, intelligence: 90, politics: 80, charisma: 85 } });
    const best = highestEligibleHonorific(o, mkDeeds({ duelsWon: 20, citiesTaken: 20, battlesWon: 30, killsTroops: 200000 }));
    expect(best).not.toBeNull();
    expect(best!.tier).toBe(3);
  });
  it('returns nothing higher once the top is held', () => {
    const titan = mkOfficer({ honorificId: 'zhengxi-da', stats: { leadership: 99, war: 99, intelligence: 99, politics: 99, charisma: 99 } });
    expect(highestEligibleHonorific(titan, mkDeeds({ citiesTaken: 99, duelsWon: 99, battlesWon: 99 }))).toBeNull();
  });
});

describe('honorificEffects', () => {
  it('is inert without an honorific', () => {
    expect(honorificEffects(mkOfficer())).toEqual({ loyaltyBonus: 0, combatPowerMul: 1 });
  });
  it('mirrors the held honorific and combat perk defaults to 1', () => {
    const martial = mkOfficer({ honorificId: 'huwei' });
    expect(honorificEffects(martial).combatPowerMul).toBe(HONORIFICS_BY_ID.huwei.combatPowerMul);
    const steward = mkOfficer({ honorificId: 'jianwei' }); // no combat perk
    expect(honorificEffects(steward).combatPowerMul).toBe(1);
    expect(honorificEffects(steward).loyaltyBonus).toBe(HONORIFICS_BY_ID.jianwei.loyaltyBonus);
  });
  it('honorificTier orders held titles', () => {
    expect(honorificTier('zhengxi-da')).toBeGreaterThan(honorificTier('zhechong'));
    expect(honorificTier(undefined)).toBe(0);
  });
});
