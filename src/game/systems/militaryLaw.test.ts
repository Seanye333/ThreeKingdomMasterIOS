import { describe, it, expect } from 'vitest';
import {
  meritScore, faultScore, outstandingMerit, outstandingFault, meritResentment,
  rewardQuote, PUNISHMENTS, PUNISHMENT_ORDER, fittingPunishments, ledgerHealth,
  MERIT_GRUDGE, MERIT_GRUDGE_HEAVY,
} from './militaryLaw';
import { createDeeds } from '../types/deeds';
import type { Officer } from '../types';

const officer = (over: Partial<Officer> = {}): Officer => ({
  id: 'o1', name: { zh: '將', en: 'General' }, forceId: 'f1', loyalty: 70,
  stats: { war: 80, leadership: 80, intelligence: 60, politics: 50, charisma: 60 },
  status: 'idle', locationCityId: 'c1', equipment: [],
  ...over,
} as unknown as Officer);

const deeds = (over: Partial<ReturnType<typeof createDeeds>> = {}) => ({ ...createDeeds('o1'), ...over });

describe('軍功', () => {
  it('a blank record is worth nothing', () => {
    expect(meritScore(createDeeds('o1'))).toBe(0);
    expect(meritScore(undefined)).toBe(0);
  });

  it('cities weigh heaviest, then battles', () => {
    expect(meritScore(deeds({ citiesTaken: 1 }))).toBeGreaterThan(meritScore(deeds({ battlesWon: 1 })));
    expect(meritScore(deeds({ battlesWon: 1 }))).toBeGreaterThan(meritScore(deeds({ duelsWon: 1 })));
  });

  it('defeats are their own ledger', () => {
    expect(faultScore(deeds({ battlesLost: 4 }))).toBe(12);
    expect(meritScore(deeds({ battlesLost: 4 }))).toBe(0);
  });

  it('what is owed is the record minus what was paid', () => {
    const d = deeds({ citiesTaken: 2, battlesWon: 3 }); // 16 + 9 = 25
    expect(outstandingMerit(officer(), d)).toBe(25);
    expect(outstandingMerit(officer({ meritRewarded: 20 }), d)).toBe(5);
    // Over-paid never goes negative.
    expect(outstandingMerit(officer({ meritRewarded: 99 }), d)).toBe(0);
  });

  it('faults likewise', () => {
    const d = deeds({ battlesLost: 5 });
    expect(outstandingFault(officer({ faultPunished: 6 }), d)).toBe(9);
  });
});

describe('賞不逾時', () => {
  it('a settled ledger costs nothing', () => {
    expect(meritResentment(0)).toBe(0);
    expect(meritResentment(MERIT_GRUDGE - 1)).toBe(0);
  });

  it('an open one erodes loyalty, and worse as it grows', () => {
    expect(meritResentment(MERIT_GRUDGE)).toBe(-1);
    expect(meritResentment(MERIT_GRUDGE_HEAVY)).toBe(-2);
  });

  it('settling costs gold in proportion and is capped in loyalty', () => {
    const small = rewardQuote(5);
    const huge = rewardQuote(200);
    expect(huge.gold).toBeGreaterThan(small.gold);
    expect(huge.loyalty).toBeLessThanOrEqual(18);
    expect(small.loyalty).toBeGreaterThan(0);
    expect(rewardQuote(0)).toEqual({ gold: 0, loyalty: 0, xp: 0, merit: 0 });
  });
});

describe('軍法處置', () => {
  it('每一等都更重,也更能服眾', () => {
    let prevOthers = -1;
    for (const id of PUNISHMENT_ORDER) {
      const p = PUNISHMENTS[id];
      expect(p.loyaltyOthers).toBeGreaterThanOrEqual(prevOthers);
      prevOthers = p.loyaltyOthers;
    }
    expect(PUNISHMENTS.execute.clears).toBe(Infinity);
    expect(PUNISHMENTS.admonish.defectionRisk).toBe(0);
    expect(PUNISHMENTS.demote.defectionRisk).toBeGreaterThan(PUNISHMENTS.flog.defectionRisk);
  });

  it('揮淚斬馬謖 costs you the general and convinces everyone else', () => {
    expect(PUNISHMENTS.execute.loyaltyOthers).toBe(5);
    expect(PUNISHMENTS.execute.motto).toContain('馬謖');
  });

  it('nothing fits a clean record', () => {
    expect(fittingPunishments(0)).toEqual([]);
  });

  it('a single defeat only warrants a rebuke (or the axe, if you insist)', () => {
    const fits = fittingPunishments(2);
    expect(fits).toContain('admonish');
    expect(fits).not.toContain('flog');
    expect(fits).toContain('execute');
  });

  it('every punishment is named in both languages', () => {
    for (const id of PUNISHMENT_ORDER) {
      expect(PUNISHMENTS[id].zh.length).toBeGreaterThan(0);
      expect(PUNISHMENTS[id].en.length).toBeGreaterThan(0);
      expect(PUNISHMENTS[id].descZh.length).toBeGreaterThan(0);
    }
  });
});

describe('賞罰分明', () => {
  it('reads the realm at a glance', () => {
    expect(ledgerHealth([]).zh).toBe('賞罰分明');
    expect(ledgerHealth([{ merit: 50, fault: 0 }]).zh).toBe('功高不賞,人心已動');
    expect(ledgerHealth([{ merit: 20, fault: 0 }]).zh).toBe('賞有逾時');
    expect(ledgerHealth([{ merit: 0, fault: 15 }]).zh).toBe('罰不及過');
  });

  it('sums across the whole officer corps', () => {
    const h = ledgerHealth([{ merit: 10, fault: 3 }, { merit: 8, fault: 6 }]);
    expect(h.owed).toBe(18);
    expect(h.unanswered).toBe(9);
  });
});
