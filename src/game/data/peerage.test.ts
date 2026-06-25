import { describe, it, expect } from 'vitest';
import type { Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';
import {
  PEERAGES,
  PEERAGES_BY_ID,
  peerageTier,
  meritScore,
  highestEligiblePeerage,
  peerageEffects,
  demotedPeerage,
} from './peerage';

function mkOfficer(over: Partial<Officer> = {}): Officer {
  return {
    id: 'o1',
    name: { zh: '某將', en: 'Officer' },
    forceId: 'f1',
    stats: { leadership: 70, war: 80, intelligence: 60, politics: 50, charisma: 60 },
    loyalty: 70,
    status: 'idle',
    locationCityId: 'c1',
    task: null,
    equipment: {} as Officer['equipment'],
    skills: [],
    rank: 'soldier',
    ...over,
  } as Officer;
}

function mkDeeds(over: Partial<HeroicDeeds> = {}): HeroicDeeds {
  return {
    officerId: 'o1',
    killsTroops: 0,
    duelsWon: 0,
    captured: 0,
    citiesTaken: 0,
    espionageSuccess: 0,
    civicWorks: 0,
    battlesWon: 0,
    battlesLost: 0,
    trainingsCompleted: 0,
    childrenSired: 0,
    ...over,
  };
}

describe('peerage ladder', () => {
  it('is an ordered ladder with strictly rising gates', () => {
    for (let i = 1; i < PEERAGES.length; i++) {
      expect(PEERAGES[i].tier).toBeGreaterThan(PEERAGES[i - 1].tier);
      expect(PEERAGES[i].minMerit).toBeGreaterThan(PEERAGES[i - 1].minMerit);
      expect(PEERAGES[i].fiefGold).toBeGreaterThan(PEERAGES[i - 1].fiefGold);
    }
  });

  it('only 公/王 require a sovereign', () => {
    expect(PEERAGES_BY_ID.gong.requiresSovereign).toBe(true);
    expect(PEERAGES_BY_ID.wang.requiresSovereign).toBe(true);
    expect(PEERAGES_BY_ID.guannei.requiresSovereign).toBeFalsy();
    expect(PEERAGES_BY_ID.xian.requiresSovereign).toBeFalsy();
  });
});

describe('meritScore', () => {
  it('rewards deeds on top of raw ability', () => {
    const o = mkOfficer();
    const bare = meritScore(o);
    const decorated = meritScore(o, mkDeeds({ citiesTaken: 5, duelsWon: 10, battlesWon: 10 }));
    expect(decorated).toBeGreaterThan(bare);
  });
});

describe('highestEligiblePeerage', () => {
  it('caps a stat-only officer below the great fiefs', () => {
    const o = mkOfficer({ stats: { leadership: 90, war: 95, intelligence: 70, politics: 60, charisma: 70 } });
    const best = highestEligiblePeerage(o, undefined, false);
    expect(best).not.toBeNull();
    // No deeds → can't reach 縣侯/公/王.
    expect(best!.tier).toBeLessThan(PEERAGES_BY_ID.xian.tier);
  });

  it('locks 公/王 behind sovereignty even for a titan', () => {
    const o = mkOfficer({ stats: { leadership: 100, war: 100, intelligence: 100, politics: 100, charisma: 100 } });
    const deeds = mkDeeds({ citiesTaken: 30, duelsWon: 30, battlesWon: 40, killsTroops: 200000 });
    const noSov = highestEligiblePeerage(o, deeds, false);
    const withSov = highestEligiblePeerage(o, deeds, true);
    expect(noSov!.requiresSovereign).toBeFalsy();
    expect(withSov!.tier).toBeGreaterThan(noSov!.tier);
    expect(['gong', 'wang']).toContain(withSov!.id);
  });

  it('returns null when an officer already holds the best they qualify for', () => {
    const o = mkOfficer({ stats: { leadership: 50, war: 55, intelligence: 50, politics: 50, charisma: 50 }, peerageId: 'guannei' });
    // Low merit, already 關內侯 → nothing higher available.
    expect(highestEligiblePeerage(o, undefined, false)).toBeNull();
  });
});

describe('peerageEffects', () => {
  it('returns zeroes for an un-enfeoffed officer', () => {
    expect(peerageEffects(mkOfficer())).toEqual({
      fiefGold: 0, fiefGrain: 0, loyaltyBonus: 0, prestige: 0, ambitionPressure: 0,
    });
  });

  it('mirrors the held peerage definition', () => {
    const o = mkOfficer({ peerageId: 'ting' });
    const eff = peerageEffects(o);
    expect(eff.fiefGold).toBe(PEERAGES_BY_ID.ting.fiefGold);
    expect(eff.loyaltyBonus).toBe(PEERAGES_BY_ID.ting.loyaltyBonus);
  });

  it('peerageTier orders held peerages', () => {
    expect(peerageTier('wang')).toBeGreaterThan(peerageTier('guannei'));
    expect(peerageTier(undefined)).toBe(0);
  });
});

describe('demotedPeerage (遞降襲爵)', () => {
  it('an heir inherits the title one tier lower', () => {
    const lower = demotedPeerage('wang');
    expect(lower).not.toBeNull();
    expect(peerageTier(lower)).toBe(peerageTier('wang') - 1);
  });

  it('the lowest rung leaves nothing to inherit', () => {
    expect(demotedPeerage('wudafu')).toBeNull(); // tier 1 — line ends
    expect(demotedPeerage(undefined)).toBeNull();
  });
});
