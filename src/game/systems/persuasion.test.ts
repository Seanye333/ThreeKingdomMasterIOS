/** 勸降三策 — locks the approach math against the trait table. */
import { describe, expect, it } from 'vitest';
import type { City, Force } from '../types';
import { mkOfficer } from '../../test/factories';
import { estimateRecruitChance, recruitCostFor } from './officerFate';

const city = { id: 'xuchang', gold: 5000 } as City;
const force = { id: 'cao', name: { zh: '曹', en: 'Cao' } } as Force;
const ruler = mkOfficer({ id: 'cao-cao', stats: { charisma: 80 } });

const base = (officer: ReturnType<typeof mkOfficer>, approach?: 'righteous' | 'riches' | 'feeling', rapport = 0) =>
  estimateRecruitChance({
    officer, city, recruiterForce: force, recruiterRuler: ruler,
    approach, bestRapportWithCaptors: rapport,
  });

describe('勸降三策', () => {
  it('曉以大義 halves a loyal resistance and lifts the noble cap', () => {
    const zealot = mkOfficer({ status: 'imprisoned', loyalty: 80, traits: ['loyal', 'noble'] as never });
    expect(base(zealot, 'righteous')).toBeGreaterThan(base(zealot));
    expect(base(zealot, 'righteous')).toBeLessThanOrEqual(0.35);
    expect(base(zealot)).toBeLessThanOrEqual(0.15); // gold-flavored cap holds
  });

  it('許以重利 sways the greedy, insults the incorruptible, costs double', () => {
    const venal = mkOfficer({ status: 'imprisoned', loyalty: 60, traits: ['greedy'] as never });
    expect(base(venal, 'riches')).toBeGreaterThan(base(venal));
    const monk = mkOfficer({ status: 'imprisoned', loyalty: 60, traits: ['incorruptible'] as never });
    expect(base(monk, 'riches')).toBeLessThan(base(monk));
    expect(recruitCostFor('riches')).toBe(recruitCostFor() * 2);
  });

  it('以情動人 converts rapport into odds', () => {
    const friend = mkOfficer({ status: 'imprisoned', loyalty: 70 });
    expect(base(friend, 'feeling', 90)).toBeGreaterThan(base(friend, 'feeling', 0));
  });
});
