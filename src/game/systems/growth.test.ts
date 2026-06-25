import { describe, it, expect } from 'vitest';
import {
  grantXp, awardInternalAffairsXp, xpProgress, MAX_GROWTH_LEVEL, INTERNAL_AFFAIRS_XP, INTERNAL_AFFAIRS_XP_MAJOR,
  statAptitude, growthAptitude, ageGrowthBias, deedFavoredStats, EPIPHANY_THRESHOLD,
  tickMentorBonds, inheritLegacyOnDeath, specialTraining, applyBreakthrough, MAX_BREAKTHROUGHS,
  defaultBreakthroughPath, breakthroughIronCost,
} from './growth';
import { SKILLS } from '../data/skills';
import type { HeroicDeeds } from '../types/deeds';
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

describe('成長資質 — per-stat aptitude', () => {
  it('grades a stat by its latent ceiling (天/上/中/常)', () => {
    expect(statAptitude(120)).toBe('S');
    expect(statAptitude(100)).toBe('A');
    expect(statAptitude(90)).toBe('B');
    expect(statAptitude(70)).toBe('C');
  });
  it('reads aptitude per stat off the officer latent caps', () => {
    const o = makeOfficer();
    o.latentStats = { leadership: 120, war: 100, intelligence: 90, politics: 70, charisma: 70 };
    const apt = growthAptitude(o);
    expect(apt.leadership).toBe('S');
    expect(apt.war).toBe('A');
    expect(apt.intelligence).toBe('B');
    expect(apt.politics).toBe('C');
  });
});

describe('年齡軸 / 戰績驅動 — soft growth tilts', () => {
  it('leans young officers martial and old officers toward 智/政', () => {
    expect(ageGrowthBias(25)).toEqual(['war', 'leadership']);
    expect(ageGrowthBias(40)).toEqual([]); // 巔峰 — no tilt
    expect(ageGrowthBias(50)).toEqual(['leadership', 'intelligence']);
    expect(ageGrowthBias(60)).toEqual(['intelligence', 'politics']);
    expect(ageGrowthBias(NaN)).toEqual([]);
  });
  it('reads the dominant stat off an officer’s deeds', () => {
    const base = (): HeroicDeeds => ({
      officerId: 'x', killsTroops: 0, duelsWon: 0, captured: 0, citiesTaken: 0,
      espionageSuccess: 0, civicWorks: 0, battlesWon: 0, battlesLost: 0,
      trainingsCompleted: 0, childrenSired: 0,
    });
    expect(deedFavoredStats({ ...base(), killsTroops: 20000, duelsWon: 5 })).toBe('war');
    expect(deedFavoredStats({ ...base(), espionageSuccess: 10 })).toBe('intelligence');
    expect(deedFavoredStats({ ...base(), civicWorks: 20 })).toBe('politics');
    expect(deedFavoredStats(base())).toBeNull(); // a blank record gives no bias
    expect(deedFavoredStats(undefined)).toBeNull();
  });
});

describe('瓶頸 → 頓悟 — overflow XP past the ceiling', () => {
  it('banks overflow into 頓悟 and lifts a latent ceiling when it fills', () => {
    // A maxed officer (xp at the ceiling) with room below STAT_CAP.
    const o = { ...makeOfficer({ war: 100 }), xp: 8000 } as Officer;
    o.latentStats = { leadership: 120, war: 120, intelligence: 120, politics: 120, charisma: 120 };
    // rng ≥ 0.3 so 頓悟 takes the latent path (not the skill path).
    const r = grantXp(o, EPIPHANY_THRESHOLD, () => 0.9);
    expect(r.officer.epiphany ?? 0).toBe(0); // gauge fully consumed (omitted when 0)
    // war is the top stat, so its latent (and the stat) deepened.
    expect(r.officer.latentStats!.war).toBeGreaterThan(120);
    expect(r.officer.stats.war).toBeGreaterThan(100);
  });
  it('does not bank anything below the ceiling', () => {
    const o = makeOfficer();
    const r = grantXp(o, 50, () => 0.5);
    expect(r.officer.epiphany ?? 0).toBe(0);
  });
});

describe('師徒衣缽 — explicit mentor bonds', () => {
  function bondPair() {
    const master = { ...makeOfficer({ war: 80 }), id: 'master', skills: [SKILLS[0].id] } as Officer;
    const pupil = { ...makeOfficer(), id: 'pupil', mentorId: 'master', skills: [] } as Officer;
    return { master, pupil };
  }
  it('feeds the disciple XP and can pass on the master’s craft (rng=0 → inherit)', () => {
    const { master, pupil } = bondPair();
    const { officers, bonded } = tickMentorBonds({ master, pupil }, () => 0);
    expect(bonded.has('pupil')).toBe(true);
    expect(officers.pupil.xp).toBeGreaterThan(0);
    expect(officers.pupil.skills).toContain(SKILLS[0].id); // 衣缽相傳
  });
  it('skips the bond when master and disciple are not in the same city', () => {
    const { master, pupil } = bondPair();
    const farMaster = { ...master, locationCityId: 'elsewhere' } as Officer;
    const { bonded } = tickMentorBonds({ master: farMaster, pupil }, () => 0.5);
    expect(bonded.has('pupil')).toBe(false);
  });
  it('繼承遺志 — a disciple is lifted when the master dies', () => {
    const { master, pupil } = bondPair();
    const { officers, entries } = inheritLegacyOnDeath(master, { master, pupil });
    expect(officers.pupil.stats.war).toBeGreaterThan(pupil.stats.war); // master’s top stat
    expect(officers.pupil.mentorId).toBeUndefined(); // bond ends with the master
    expect(officers.pupil.loyalty).toBeGreaterThanOrEqual(pupil.loyalty);
    expect(entries.length).toBeGreaterThan(0);
  });
});

describe('特訓 — a season of focused training', () => {
  it('grants a big XP burst (and never crashes on the safe path)', () => {
    const o = makeOfficer();
    // rng=0.9 dodges every bonus/injury roll → a clean XP-only outcome.
    const r = specialTraining(o, () => 0.9, 200);
    expect((r.officer.xp ?? 0)).toBeGreaterThan(40);
    expect(r.entries.length).toBeGreaterThan(0);
  });
});

describe('突破之道 — breakthrough path choice', () => {
  it('a chosen 道 sharpens its own 圍, redirecting away from the default top stats', () => {
    // War/leadership-heavy officer, but pick 治道 (governance: politics+charisma).
    const o = makeOfficer({ war: 120, leadership: 110, intelligence: 80, politics: 70, charisma: 72 });
    o.breakthroughs = 0;
    o.latentStats = { leadership: 150, war: 150, intelligence: 150, politics: 150, charisma: 150 };
    const before = { ...o.stats };
    const r = applyBreakthrough(o, 'governance');
    expect(r.officer.stats.politics).toBeGreaterThan(before.politics); // 治道 stat grew
    // leadership would have grown under the default top-3, but the path redirected it.
    expect(r.officer.stats.leadership).toBe(before.leadership);
  });
  it('defaultBreakthroughPath picks the path of the strongest 圍', () => {
    expect(defaultBreakthroughPath(makeOfficer({ war: 120 }))).toBe('martial');
    expect(defaultBreakthroughPath(makeOfficer({ intelligence: 120 }))).toBe('strategy');
    expect(defaultBreakthroughPath(makeOfficer({ politics: 120 }))).toBe('governance');
  });
  it('breakthroughIronCost scales with breakthroughs already taken', () => {
    expect(breakthroughIronCost(makeOfficer())).toBe(80);
    expect(breakthroughIronCost({ ...makeOfficer(), breakthroughs: 2 } as Officer)).toBe(240);
  });
});

describe('神品覺醒 — the final-breakthrough capstone', () => {
  it('a 鑽石 officer’s 5th breakthrough sharpens ALL five 圍 (not just the top 3)', () => {
    const o = makeOfficer({ leadership: 120, war: 125, intelligence: 118, politics: 110, charisma: 115 });
    o.breakthroughs = MAX_BREAKTHROUGHS - 1; // next one is the 5th
    o.latentStats = { leadership: 150, war: 150, intelligence: 150, politics: 150, charisma: 150 };
    const before = { ...o.stats };
    const r = applyBreakthrough(o);
    expect(r.officer.breakthroughs).toBe(MAX_BREAKTHROUGHS);
    // 政治/魅力 aren't top-3, so only the capstone's all-圍 +2 can have grown them.
    expect(r.officer.stats.politics).toBeGreaterThan(before.politics);
    expect(r.officer.stats.charisma).toBeGreaterThan(before.charisma);
  });
  it('a non-鑽石 5th breakthrough gets no capstone (lowest 圍 untouched)', () => {
    // Spread so the officer is gold/platinum, not diamond, and politics is far behind.
    const o = makeOfficer({ leadership: 90, war: 95, intelligence: 88, politics: 60, charisma: 62 });
    o.breakthroughs = MAX_BREAKTHROUGHS - 1;
    o.latentStats = { leadership: 150, war: 150, intelligence: 150, politics: 150, charisma: 150 };
    const before = { ...o.stats };
    const r = applyBreakthrough(o);
    expect(r.officer.stats.politics).toBe(before.politics); // not top-3, no capstone → unchanged
  });
});
