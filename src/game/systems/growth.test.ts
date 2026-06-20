import { describe, it, expect } from 'vitest';
import { grantXp, awardInternalAffairsXp, xpProgress, MAX_GROWTH_LEVEL, INTERNAL_AFFAIRS_XP, INTERNAL_AFFAIRS_XP_MAJOR } from './growth';
import type { Officer, OfficerStats } from '../types';

function makeOfficer(stats: Partial<OfficerStats> = {}): Officer {
  const base: OfficerStats = {
    leadership: 60, war: 60, intelligence: 60, politics: 60, charisma: 60, ...stats,
  };
  return {
    id: 'test', name: { zh: '測試', en: 'Test' }, forceId: 'p',
    stats: base,
    // Wide latent headroom so growth is never blocked.
    latentStats: { leadership: 120, war: 120, intelligence: 120, politics: 120, charisma: 120 },
    skills: [], traits: [], xp: 0, level: 0, loyalty: 100,
    status: 'idle', task: null, locationCityId: 'c1',
  } as unknown as Officer;
}

describe('grantXp favored growth', () => {
  it('steers all level-up gains into the favoured stats', () => {
    const o = makeOfficer();
    // Enough XP to cross several thresholds in one grant.
    const r = grantXp(o, 1000, () => 0.5, ['intelligence', 'charisma']);
    expect(r.leveled).toBe(true);
    // Only the favoured stats may have grown.
    expect(r.officer.stats.war).toBe(o.stats.war);
    expect(r.officer.stats.leadership).toBe(o.stats.leadership);
    expect(r.officer.stats.politics).toBe(o.stats.politics);
    const grewMind =
      r.officer.stats.intelligence > o.stats.intelligence ||
      r.officer.stats.charisma > o.stats.charisma;
    expect(grewMind).toBe(true);
  });

  it('falls back to the full spread when favoured stats are maxed', () => {
    // Intelligence/charisma already at their latent cap — no headroom.
    const o = makeOfficer({ intelligence: 120, charisma: 120 });
    const r = grantXp(o, 1000, () => 0.5, ['intelligence', 'charisma']);
    expect(r.leveled).toBe(true);
    // Growth had to land on a non-favoured stat instead of stalling.
    const grewOther =
      r.officer.stats.war > o.stats.war ||
      r.officer.stats.leadership > o.stats.leadership ||
      r.officer.stats.politics > o.stats.politics;
    expect(grewOther).toBe(true);
  });

  it('is unchanged from default behaviour when no favoured stats are given', () => {
    const o = makeOfficer();
    const r = grantXp(o, 100, () => 0.5);
    expect(r.officer.xp).toBe(100);
  });
});

describe('awardInternalAffairsXp — civic-duty trickle', () => {
  it('grants the base trickle and steers growth toward the command stat', () => {
    // Start one threshold-crossing away so a single trickle levels the officer
    // and we can see which stat grew.
    const o = { ...makeOfficer(), xp: 100 - INTERNAL_AFFAIRS_XP } as Officer;
    const r = awardInternalAffairsXp(o, 'develop-agriculture', true, () => 0.5);
    expect(r.officer.xp).toBe(100);
    // 開発 exercises 政治 — only politics may have grown.
    expect(r.officer.stats.politics).toBeGreaterThan(o.stats.politics);
    expect(r.officer.stats.war).toBe(o.stats.war);
    expect(r.officer.stats.charisma).toBe(o.stats.charisma);
  });

  it('grants more for major projects and less for a capped no-op', () => {
    const o = makeOfficer();
    const major = awardInternalAffairsXp(o, 'major-agriculture', true, () => 0.5);
    expect(major.officer.xp).toBe(INTERNAL_AFFAIRS_XP_MAJOR);
    const noop = awardInternalAffairsXp(o, 'develop-agriculture', false, () => 0.5);
    expect(noop.officer.xp).toBe(Math.round(INTERNAL_AFFAIRS_XP * 0.4));
    expect(noop.officer.xp).toBeLessThan(INTERNAL_AFFAIRS_XP);
  });

  it('steers people-work commands toward 魅力', () => {
    const o = { ...makeOfficer(), xp: 100 - INTERNAL_AFFAIRS_XP } as Officer;
    const r = awardInternalAffairsXp(o, 'improve-loyalty', true, () => 0.5);
    expect(r.officer.stats.charisma).toBeGreaterThan(o.stats.charisma);
    expect(r.officer.stats.politics).toBe(o.stats.politics);
  });
});

describe('xpProgress — UI level/bar math', () => {
  it('reports a fresh officer at level 0 with progress toward 100', () => {
    const p = xpProgress(0);
    expect(p.level).toBe(0);
    expect(p.atMax).toBe(false);
    expect(p.toNext).toBe(100);
    expect(p.levelSpan).toBe(100);
    expect(p.intoLevel).toBe(0);
  });

  it('measures progress within the current band', () => {
    // 175 XP: level 1 (≥100), band is 100→250, so 75/150 into it.
    const p = xpProgress(175);
    expect(p.level).toBe(1);
    expect(p.intoLevel).toBe(75);
    expect(p.levelSpan).toBe(150);
    expect(p.toNext).toBe(75);
  });

  it('caps out at the top level', () => {
    const p = xpProgress(99999);
    expect(p.level).toBe(MAX_GROWTH_LEVEL);
    expect(p.atMax).toBe(true);
    expect(p.toNext).toBe(0);
  });

  it('treats undefined xp as zero', () => {
    expect(xpProgress(undefined).level).toBe(0);
  });
});
