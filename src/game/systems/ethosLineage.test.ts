/** 風氣與傳承批 — 尚武崇文之風 / 師承譜系 / 同門合擊 / 衣缽傳人. */
import { describe, it, expect } from 'vitest';
import {
  realmEthos, ethosSchoolBonus, ethosLoyaltyAura, ethosDreadBonus, ethosRecruitAffinity,
  ETHOS_FLOOR,
} from './realmEthos';
import {
  recordTeaching, mastersOf, pupilsOf, areFellowStudents, areMasterAndPupil,
  lineageBond, greatSchools, inheritedXiuwei, HEIR_INHERIT_SHARE, type LineageLedger,
} from './lineage';
import { resolveTeamDuel } from './teamDuel';
import { duelDread } from './duelChallenge';
import { mkOfficer, seededRng } from '../../test/factories';
import type { HeroicDeeds, Officer } from '../types';

const S = (war: number, int = 50) => ({ war, leadership: 60, intelligence: int, politics: 50, charisma: 55 });
const deedsFor = (rows: Record<string, Partial<HeroicDeeds>>): Record<string, HeroicDeeds> =>
  Object.fromEntries(Object.entries(rows).map(([id, d]) => [id, { officerId: id, duelsWon: 0, debatesWon: 0, ...d } as HeroicDeeds]));

const roster = (ids: string[], patch: (i: number) => Partial<Officer>): Record<string, Officer> =>
  Object.fromEntries(ids.map((id, i) => [id, mkOfficer({ id, forceId: 'wei', stats: S(70), ...patch(i) })]));

describe('尚武・崇文之風 (realmEthos)', () => {
  it('a house of duellists reads 尚武, a house of scholars 崇文', () => {
    const warlike = roster(['a', 'b', 'c'], () => ({ martialXiuwei: 90 }));
    const lettered = roster(['a', 'b', 'c'], () => ({ debateXiuwei: 90 }));
    expect(realmEthos(warlike, {}, 'wei').lean).toBe('martial');
    expect(realmEthos(lettered, {}, 'wei').lean).toBe('literary');
  });
  it('a court strong in both reads 文武兼修, and balance scores on the weaker arm', () => {
    const both = roster(['a', 'b', 'c'], () => ({ martialXiuwei: 90, debateXiuwei: 90 }));
    const e = realmEthos(both, {}, 'wei');
    expect(e.lean).toBe('balanced');
    expect(e.strength).toBeGreaterThan(0.5);
    // Mediocre at both is balanced but NOT distinguished.
    const meh = roster(['a', 'b', 'c'], () => ({ martialXiuwei: 12, debateXiuwei: 12 }));
    expect(realmEthos(meh, {}, 'wei').lean).toBe('undistinguished');
  });
  it('character is per-head, so a big mediocre empire is not automatically cultured', () => {
    const few = roster(['a', 'b'], () => ({ debateXiuwei: 95 }));
    const manyDiluted = roster(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], (i) => (i < 2 ? { debateXiuwei: 95 } : {}));
    expect(realmEthos(few, {}, 'wei').literary).toBeGreaterThan(realmEthos(manyDiluted, {}, 'wei').literary);
  });
  it('deeds count too, but cultivation counts double', () => {
    const drilled = roster(['a'], () => ({ martialXiuwei: 40 }));
    const decorated = roster(['a'], () => ({}));
    const withDeeds = realmEthos(decorated, deedsFor({ a: { duelsWon: 10 } }), 'wei');
    expect(withDeeds.martial).toBeGreaterThan(0);
    expect(realmEthos(drilled, {}, 'wei').martial).toBeGreaterThan(withDeeds.martial);
  });
  it('an unremarkable or empty realm has no character at all', () => {
    expect(realmEthos({}, {}, 'wei').lean).toBe('undistinguished');
    expect(realmEthos(roster(['a'], () => ({})), {}, null).lean).toBe('undistinguished');
    const faint = roster(['a'], () => ({ martialXiuwei: 4 }));
    expect(realmEthos(faint, {}, 'wei').martial).toBeLessThan(ETHOS_FLOOR);
  });
  it('each character buys only its own perks', () => {
    const martial = realmEthos(roster(['a', 'b'], () => ({ martialXiuwei: 95 })), {}, 'wei');
    const literary = realmEthos(roster(['a', 'b'], () => ({ debateXiuwei: 95 })), {}, 'wei');
    expect(ethosSchoolBonus(martial).martial).toBeGreaterThan(0);
    expect(ethosSchoolBonus(martial).literary).toBe(0);
    expect(ethosDreadBonus(martial)).toBeGreaterThan(0);
    expect(ethosDreadBonus(literary)).toBe(0);   // letters cow nobody at the duelling ground
    expect(ethosLoyaltyAura(literary)).toBeGreaterThan(0);
    expect(ethosLoyaltyAura(martial)).toBe(0);   // and arms do not calm a city
  });
  it('a realm draws its own kind, and 兼修 courts take all comers evenly', () => {
    const martial = realmEthos(roster(['a', 'b'], () => ({ martialXiuwei: 95 })), {}, 'wei');
    const balanced = realmEthos(roster(['a', 'b'], () => ({ martialXiuwei: 90, debateXiuwei: 90 })), {}, 'wei');
    const warrior = mkOfficer({ id: 'w', stats: S(90, 40) });
    const scholar = mkOfficer({ id: 's', stats: S(30, 95) });
    expect(ethosRecruitAffinity(martial, warrior)).toBeGreaterThan(0);
    expect(ethosRecruitAffinity(martial, scholar)).toBeLessThan(0);
    expect(ethosRecruitAffinity(balanced, warrior)).toBe(0);
    expect(ethosRecruitAffinity(balanced, scholar)).toBe(0);
  });
});

describe('師承譜系 (lineage)', () => {
  let led: LineageLedger = [];
  led = recordTeaching(led, { masterId: 'master', pupilId: 'p1', art: 'martial', year: 200 });
  led = recordTeaching(led, { masterId: 'master', pupilId: 'p2', art: 'martial', year: 201 });
  led = recordTeaching(led, { masterId: 'sage', pupilId: 'p1', art: 'debate', year: 202 });

  it('records who taught whom, per art, without duplicating a re-teaching', () => {
    expect(mastersOf(led, 'p1')).toContain('master');
    expect(mastersOf(led, 'p1', 'debate')).toEqual(['sage']);
    expect(pupilsOf(led, 'master', 'martial').sort()).toEqual(['p1', 'p2']);
    const again = recordTeaching(led, { masterId: 'master', pupilId: 'p1', art: 'martial', year: 205 });
    expect(again.filter((e) => e.masterId === 'master' && e.pupilId === 'p1' && e.art === 'martial')).toHaveLength(1);
  });
  it('同門 is fellow students of one master — a master and their own pupil are 師徒', () => {
    expect(areFellowStudents(led, 'p1', 'p2', 'martial')).toBe(true);
    expect(areFellowStudents(led, 'master', 'p1')).toBe(false); // that bond is 師徒
    expect(areMasterAndPupil(led, 'master', 'p1', 'martial')).toBe(true);
    expect(lineageBond(led, 'p1', 'p2', 'martial')).toBe('fellow');
    expect(lineageBond(led, 'master', 'p2', 'martial')).toBe('master-pupil');
    expect(lineageBond(led, 'p1', 'stranger')).toBeNull();
  });
  it('the bond is per-art: fellow spearmen are not fellow scholars', () => {
    expect(areFellowStudents(led, 'p1', 'p2', 'martial')).toBe(true);
    expect(areFellowStudents(led, 'p1', 'p2', 'debate')).toBe(false);
  });
  it('名門 ranks masters by surviving students, and the dead master still counts', () => {
    const officers = {
      p1: mkOfficer({ id: 'p1' }), p2: mkOfficer({ id: 'p2' }),
      master: mkOfficer({ id: 'master', status: 'dead' }),
    };
    const schools = greatSchools(led, officers);
    const martialSchool = schools.find((r) => r.masterId === 'master' && r.art === 'martial');
    expect(martialSchool?.pupils).toBe(2); // lineage outlives the master
  });
  it('同門 actually compounds blows in a team melee', () => {
    // A lone but very tough foe, so the melee goes the distance and the pair's
    // extra bite shows as damage dealt rather than both runs ending at zero.
    const A = [mkOfficer({ id: 'p1', stats: S(40) }), mkOfficer({ id: 'p2', stats: S(40) })];
    const B = [mkOfficer({ id: 'foe', stats: S(100), traits: ['matchless'] })];
    const strangers = resolveTeamDuel(A, B, seededRng(4), []);
    const fellows = resolveTeamDuel(A, B, seededRng(4), led);
    // Same seed, same fighters — the only difference is the shared master.
    expect(strangers.b[0].stamina).toBeGreaterThan(0); // guard: not a degenerate compare
    expect(fellows.b[0].stamina).toBeLessThan(strangers.b[0].stamina);
  });
});

describe('衣缽傳人 (inheritedXiuwei)', () => {
  it('an heir is lifted toward 70% of the master, and never demoted', () => {
    expect(inheritedXiuwei(0, 100)).toBe(Math.round(100 * HEIR_INHERIT_SHARE));
    expect(inheritedXiuwei(40, 90)).toBe(Math.round(90 * HEIR_INHERIT_SHARE));
    // Already the better fighter — the bequest changes nothing.
    expect(inheritedXiuwei(95, 90)).toBe(95);
  });
});

describe('武風懾人 — the realm bonus stacks without breaking the personal cap', () => {
  it('a nobody from a martial realm is still feared a little', () => {
    const nobody = mkOfficer({ id: 'n', stats: S(70) });
    expect(duelDread(nobody)).toBe(0);
    expect(duelDread(nobody, 0.08)).toBeCloseTo(0.08, 5);
  });
  it('personal dread caps where it always did; the realm stacks on top to 0.5', () => {
    const terror = mkOfficer({ id: 't', stats: S(100), renown: 9999, traits: ['matchless', 'bloodthirsty'] });
    expect(duelDread(terror)).toBeLessThanOrEqual(0.42);       // unchanged contract
    expect(duelDread(terror, 0.08)).toBeGreaterThan(0.42);     // the court's repute adds
    expect(duelDread(terror, 0.5)).toBeLessThanOrEqual(0.5);   // hard ceiling
  });
});
