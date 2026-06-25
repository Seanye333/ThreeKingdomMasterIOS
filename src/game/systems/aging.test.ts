/** §2.4 — death-risk read-out + high-age milestones. */
import { describe, expect, it } from 'vitest';
import { mkOfficer } from '../../test/factories';
import { annualDeathChance, processAging } from './aging';

describe('annualDeathChance — the yearly mortality read-out (D1)', () => {
  it('is 0 under immortal mode; non-zero for an old fictional officer', () => {
    const old = mkOfficer({ id: 'o', birthYear: 100 }); // age 75 at year 175
    expect(annualDeathChance(old, 175, 'immortal', 'historical')).toBe(0);
    expect(annualDeathChance(old, 175, 'historical', 'historical')).toBeGreaterThan(0);
  });
  it('sickly raises, robust lowers, vs a plain peer', () => {
    const base = mkOfficer({ id: 'b', birthYear: 100, traits: [] as never });
    const sickly = mkOfficer({ id: 's', birthYear: 100, traits: ['sickly'] as never });
    const robust = mkOfficer({ id: 'r', birthYear: 100, traits: ['robust'] as never });
    const p = annualDeathChance(base, 175, 'historical', 'historical');
    expect(annualDeathChance(sickly, 175, 'historical', 'historical')).toBeGreaterThan(p);
    expect(annualDeathChance(robust, 175, 'historical', 'historical')).toBeLessThan(p);
  });
  it('短命 raises vs 長壽', () => {
    const o = mkOfficer({ id: 'l', birthYear: 100 });
    expect(annualDeathChance(o, 175, 'historical', 'short'))
      .toBeGreaterThan(annualDeathChance(o, 175, 'historical', 'long'));
  });
});

describe('高齡里程碑 — milestone at 60 (C3)', () => {
  it('a serving 60-year-old earns +loyalty and a milestone report; no death with high rng', () => {
    const elder = mkOfficer({ id: 'e', birthYear: 100, forceId: 'wei', loyalty: 50, status: 'idle' });
    const out = processAging({
      year: 160, cities: {}, officers: { e: elder }, forces: {},
      rng: () => 0.99, family: [], lifespanMode: 'historical', lifespanLength: 'historical',
    });
    expect(out.officers.e.status).not.toBe('dead');
    expect(out.officers.e.loyalty).toBeGreaterThan(50);
    expect(out.entries.some((x) => x.textZh.includes('元老'))).toBe(true);
  });
});

describe('變老不影響屬性 — agingStatLock freezes the five 圍', () => {
  it('an old strong officer loses no 武力 when locked, regardless of rng', () => {
    const vet = mkOfficer({ id: 'v', birthYear: 100, forceId: 'wei', status: 'idle',
      stats: { war: 95, leadership: 90, intelligence: 60, politics: 60, charisma: 60 } });
    const locked = processAging({
      year: 160, cities: {}, officers: { v: { ...vet } }, forces: {},
      rng: () => 0.0, family: [], lifespanMode: 'immortal', lifespanLength: 'historical', agingStatLock: true,
    });
    expect(locked.officers.v.stats.war).toBe(95);
    expect(locked.officers.v.stats.intelligence).toBe(60); // no late-bloom either
    // Without the lock, the same rng would erode 武力.
    const unlocked = processAging({
      year: 160, cities: {}, officers: { v: { ...vet } }, forces: {},
      rng: () => 0.0, family: [], lifespanMode: 'immortal', lifespanLength: 'historical', agingStatLock: false,
    });
    expect(unlocked.officers.v.stats.war).toBeLessThan(95);
  });
});

describe('託孤 — a dying elder entrusts their cause (C1)', () => {
  it('on a 70+ ruler-less elder death, a surviving colleague is steadied', () => {
    const dying = mkOfficer({ id: 'd', birthYear: 90, deathYear: 160, forceId: 'shu', status: 'idle' });
    const heir = mkOfficer({ id: 'h', birthYear: 140, forceId: 'shu', loyalty: 50, status: 'idle' });
    const out = processAging({
      year: 160, cities: {}, officers: { d: dying, h: heir }, forces: {},
      rng: () => 0.01, family: [], lifespanMode: 'historical', lifespanLength: 'historical',
    });
    expect(out.officers.d.status).toBe('dead');
    expect(out.officers.h.loyalty).toBeGreaterThan(50);
    expect(out.entries.some((x) => x.textZh.includes('託孤'))).toBe(true);
  });
});
