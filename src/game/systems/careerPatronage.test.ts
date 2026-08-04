import { describe, it, expect } from 'vitest';
import { canRecommend, recommendThreshold, rollRecommendation,
         addFavor, spendFavor } from './careerPatronage';
import { patronsAt, favorDelta } from './careerErrands';
import { RANK_COMMONER, RANK_LOWEST_OFFICE } from './career';
import { mkOfficer } from '../../test/factories';
import type { EntityId, Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';

const pool = (list: Officer[]) =>
  Object.fromEntries(list.map((o) => [o.id, o])) as Record<EntityId, Officer>;

const person = (id: string, city: string | null, stats: Partial<Officer['stats']> = {}) => {
  const o = mkOfficer({ id, stats: { war: 50, leadership: 50, intelligence: 50,
                                     politics: 50, charisma: 50, ...stats } });
  (o as { locationCityId?: string | null }).locationCityId = city;
  return o;
};

describe('雇主 — 誰託得起你', () => {
  it('only people standing in the same city can hand you work', () => {
    const got = patronsAt(pool([person('here', 'c1'), person('far', 'c9')]),
                          'c1', 'hero', RANK_COMMONER);
    expect(got.map((o) => o.id)).toEqual(['here']);
  });

  it('a commoner does not get commissions from grandees', () => {
    const grandee = person('lord', 'c1', { politics: 90, leadership: 85, charisma: 80 });
    expect(patronsAt(pool([grandee]), 'c1', 'hero', RANK_COMMONER)).toEqual([]);
    // 同一個人,等你有官身就託得動了
    expect(patronsAt(pool([grandee]), 'c1', 'hero', 5).map((o) => o.id)).toEqual(['lord']);
  });

  it('never commissions the hero themselves', () => {
    expect(patronsAt(pool([person('hero', 'c1')]), 'c1', 'hero', RANK_COMMONER)).toEqual([]);
  });
});

describe('人情的增減', () => {
  it('botching a job costs more than doing it well earns', () => {
    expect(favorDelta(0, 3)).toBeLessThan(-favorDelta(2, 3));
  });

  it('a handsome job is worth more than a merely finished one', () => {
    expect(favorDelta(3, 3)).toBeGreaterThan(favorDelta(2, 3));
  });

  it('accumulates and spends', () => {
    let f = addFavor(undefined, 'p', 5);
    f = addFavor(f, 'p', 4);
    expect(f.p).toBe(9);
    expect(spendFavor(f, 'p', 8).p).toBe(1);
    expect(spendFavor(f, 'p', 99).p).toBe(0);   // 不會變負
  });
});

describe('薦舉', () => {
  const speaker = person('sp', 'c1', { politics: 80, charisma: 70 });
  const nobody = person('nb', 'c1', { politics: 30, charisma: 30 });

  it('takes someone whose word actually carries', () => {
    expect(canRecommend(speaker, RANK_COMMONER)).toBe(true);
    expect(canRecommend(nobody, RANK_COMMONER)).toBe(false);
  });

  it('the bar rises as you rise — a village elder cannot make you a governor', () => {
    expect(canRecommend(speaker, RANK_COMMONER)).toBe(true);
    expect(canRecommend(speaker, 3)).toBe(false);
    expect(recommendThreshold(3)).toBeGreaterThan(recommendThreshold(RANK_COMMONER));
  });

  it('needs real favour, not a single job', () => {
    const thin = rollRecommendation({
      favors: { sp: 3 }, officers: pool([speaker]), heroDeeds: undefined, roll: 0.01,
    });
    expect(thin).toBeNull();
  });

  it('a thick favour with a weighty patron gets you spoken for', () => {
    const got = rollRecommendation({
      favors: { sp: 20 }, officers: pool([speaker]), heroDeeds: undefined, roll: 0.01,
    });
    expect(got?.patronId).toBe('sp');
    expect(got?.merit).toBeGreaterThan(0);
  });

  it('picks the thickest favour, not just any — a recommendation is a solemn thing', () => {
    const other = person('sp2', 'c1', { politics: 85, charisma: 75 });
    const got = rollRecommendation({
      favors: { sp: 12, sp2: 30 }, officers: pool([speaker, other]),
      heroDeeds: undefined, roll: 0.01,
    });
    expect(got?.patronId).toBe('sp2');
  });

  it('is never a certainty however deep the debt', () => {
    const got = rollRecommendation({
      favors: { sp: 200 }, officers: pool([speaker]), heroDeeds: undefined, roll: 0.99,
    });
    expect(got).toBeNull();
  });

  it('a dead patron speaks for nobody', () => {
    const gone = { ...speaker, status: 'dead' as const };
    expect(rollRecommendation({
      favors: { sp: 40 }, officers: pool([gone]), heroDeeds: undefined, roll: 0.01,
    })).toBeNull();
  });

  it('recommendation is help, not a shortcut — merit stays modest', () => {
    const got = rollRecommendation({
      favors: { sp: 40 }, officers: pool([speaker]),
      heroDeeds: { battlesWon: 4 } as HeroicDeeds, roll: 0.01,
    });
    // 九品的門檻 14 → 薦舉約 13 功績,不足以直接跳一級
    expect(got!.merit).toBeLessThan(recommendThreshold(RANK_LOWEST_OFFICE) * 1.2);
  });
});
