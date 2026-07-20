import { describe, it, expect } from 'vitest';
import {
  GRAND_PROJECTS, PROJECTS_BY_ID, projectSeasonProgress, projectEta,
  canStartProject, projectRealmEffects, projectCityGrants, type GrandProject,
} from './grandProjects';

const proj = (over: Partial<GrandProject> = {}): GrandProject => ({
  id: 'great-weir', cityId: 'chengdu', forceId: 'shu', seasonsLeft: 12, startedYear: 214, ...over,
});

describe('大工目錄', () => {
  it('every project is priced, timed and described in both languages', () => {
    for (const p of GRAND_PROJECTS) {
      expect(p.goldCost).toBeGreaterThan(1000);
      expect(p.baseSeasons).toBeGreaterThanOrEqual(10);
      expect(p.loyaltyPerSeason).toBeLessThan(0);      // a great work always costs patience
      expect(p.effectZh.length).toBeGreaterThan(4);
      expect(p.effectEn.length).toBeGreaterThan(4);
      expect(PROJECTS_BY_ID[p.id]).toBe(p);
    }
  });
});

describe('役夫幾何', () => {
  it('heavy corvée is the whole reason 重役 exists', () => {
    const rest = projectSeasonProgress({ corvee: 'none' });
    const light = projectSeasonProgress({ corvee: 'light' });
    const heavy = projectSeasonProgress({ corvee: 'heavy' });
    expect(rest).toBe(1);
    expect(light).toBeGreaterThan(rest);
    expect(heavy).toBeGreaterThan(light * 1.4);
  });

  it('households you cannot see are households you cannot conscript', () => {
    const honest = projectSeasonProgress({ corvee: 'heavy', hiddenPercent: 0 });
    const rotted = projectSeasonProgress({ corvee: 'heavy', hiddenPercent: 40 });
    expect(rotted).toBeLessThan(honest);
    expect(rotted).toBeGreaterThan(honest * 0.6);      // capped at −35%
  });

  it('an ETA is always at least one season', () => {
    expect(projectEta(12, 2.2)).toBe(6);
    expect(projectEta(0.5, 1)).toBe(1);
    expect(projectEta(12, 0)).toBeGreaterThan(0);      // no division blowup
  });
});

describe('一國一大工', () => {
  it('refuses a second work while one is under way', () => {
    expect(canStartProject([proj()], 'shu', 'long-wall').ok).toBe(false);
  });

  it('refuses to rebuild a work that already stands', () => {
    expect(canStartProject([proj({ done: true })], 'shu', 'great-weir').ok).toBe(false);
  });

  it('allows a different work once the first is finished', () => {
    expect(canStartProject([proj({ done: true })], 'shu', 'long-wall').ok).toBe(true);
  });

  it("does not care about another realm's works", () => {
    expect(canStartProject([proj({ forceId: 'wei' })], 'shu', 'great-weir').ok).toBe(true);
  });
});

describe('工成之利', () => {
  it('nothing finished means nothing changes', () => {
    const e = projectRealmEffects([proj()], 'shu');
    expect(e).toEqual({ convoyLossMul: 1, marchFatigueMul: 1, tribeRaidMul: 1 });
  });

  it('canal and road stack on convoy losses', () => {
    const both = projectRealmEffects([
      proj({ id: 'grand-canal', done: true }),
      proj({ id: 'imperial-road', done: true }),
    ], 'shu');
    expect(both.convoyLossMul).toBeCloseTo(0.56, 2);
    expect(both.marchFatigueMul).toBe(0.75);
  });

  it('the long wall is what keeps the horsemen off', () => {
    expect(projectRealmEffects([proj({ id: 'long-wall', done: true })], 'shu').tribeRaidMul)
      .toBeLessThan(0.6);
  });

  it('the weir feeds the city AND its neighbours, and drowns no more', () => {
    const g = projectCityGrants('great-weir');
    expect(g.self.agriculture).toBe(30);
    expect(g.neighbour.agriculture).toBe(30);
    expect(g.self.floodWorks).toBe(3);
  });

  it('the road grants no city stats — its whole value is realm-wide', () => {
    expect(projectCityGrants('imperial-road')).toEqual({ self: {}, neighbour: {} });
  });
});
