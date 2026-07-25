/** 武將心願 — locks the wish grant/reject effects + grievance dynamics. */
import { describe, it, expect } from 'vitest';
import { applyWishGrant, applyWishReject, composeInfoLetters, decayGrievances, expireWishes } from './wishes';
import { mkOfficer } from '../../test/factories';
import type { City, GameDate, OfficerWish } from '../types';

const wish = (over: Partial<OfficerWish> & { officerId: string; kind: OfficerWish['kind'] }): OfficerWish => ({
  id: `w-${over.officerId}`,
  text: { zh: '', en: '' },
  issuedYear: 200,
  issuedSeason: 'spring',
  rejectPenalty: 8,
  grantBonus: 10,
  ...over,
});

describe('wish grants — new kinds', () => {
  it('求爵 enfeoffs the officer to the requested peerage tier', () => {
    const o = mkOfficer({ id: 'a', forceId: 'F', status: 'idle', loyalty: 70 });
    const out = applyWishGrant(wish({ officerId: 'a', kind: 'peerage', targetId: 'guanzhong' }), { officers: { a: o }, cities: {} });
    expect(out.officers.a.peerageId).toBe('guanzhong');
    expect(out.officers.a.loyalty).toBeGreaterThan(70);
  });

  it('求師 apprentices the petitioner to the named colleague', () => {
    const o = mkOfficer({ id: 'a', forceId: 'F', status: 'idle' });
    const m = mkOfficer({ id: 'kongming', forceId: 'F', status: 'idle' });
    const out = applyWishGrant(wish({ officerId: 'a', kind: 'mentor', targetId: 'kongming' }), { officers: { a: o, kongming: m }, cities: {} });
    expect(out.officers.a.mentorId).toBe('kongming');
  });

  it('求賜 rewards renown and loyalty', () => {
    const o = mkOfficer({ id: 'a', forceId: 'F', status: 'idle', loyalty: 50, renown: 10 });
    const out = applyWishGrant(wish({ officerId: 'a', kind: 'gift', grantBonus: 8 }), { officers: { a: o }, cities: {} });
    expect(out.officers.a.renown).toBe(30);
    expect(out.officers.a.loyalty).toBe(58);
  });
});

describe('grievance dynamics', () => {
  it('rejection escalates with accrued grievance', () => {
    const o0 = mkOfficer({ id: 'a', forceId: 'F', status: 'idle', loyalty: 90, grievanceCount: 0 });
    const first = applyWishReject(wish({ officerId: 'a', kind: 'promote', rejectPenalty: 10 }), { officers: { a: o0 }, cities: {} });
    const drop1 = 90 - first.officers.a.loyalty;
    expect(first.officers.a.grievanceCount).toBe(1);

    const o3 = mkOfficer({ id: 'a', forceId: 'F', status: 'idle', loyalty: 90, grievanceCount: 3 });
    const later = applyWishReject(wish({ officerId: 'a', kind: 'promote', rejectPenalty: 10 }), { officers: { a: o3 }, cities: {} });
    const drop2 = 90 - later.officers.a.loyalty;
    expect(drop2).toBeGreaterThan(drop1);
  });

  it('content officers with no open wish let grievances fade', () => {
    const o = mkOfficer({ id: 'a', forceId: 'F', status: 'idle', loyalty: 80, grievanceCount: 2 });
    const out = decayGrievances({ a: o }, [], () => 0); // rng 0 < 0.25 → always fades
    expect(out.a.grievanceCount).toBe(1);
  });

  it('a pending wish keeps the grudge fresh (no decay)', () => {
    const o = mkOfficer({ id: 'a', forceId: 'F', status: 'idle', loyalty: 80, grievanceCount: 2 });
    const out = decayGrievances({ a: o }, [wish({ officerId: 'a', kind: 'promote' })], () => 0);
    expect(out.a.grievanceCount).toBe(2);
  });
});

describe('wish expiry', () => {
  it('an unanswered non-info wish costs a small loyalty penalty after its window', () => {
    const o = mkOfficer({ id: 'a', forceId: 'F', status: 'idle', loyalty: 80 });
    const stale = wish({ officerId: 'a', kind: 'promote', issuedYear: 200, issuedSeason: 'spring', expiresAfterSeasons: 6 });
    const out = expireWishes([stale], { a: o }, 202, 'spring'); // 8 seasons later
    expect(out.wishes).toHaveLength(0);
    expect(out.officers.a.loyalty).toBeLessThan(80);
  });
});

describe('老病告退 — a chronic-ailment veteran petitions to retire (E3)', () => {
  it('a maimed officer raises a retire wish; a hale one does not', async () => {
    const { rollWishes } = await import('./wishes');
    const maimed = mkOfficer({ id: 'vet', forceId: 'F', status: 'idle', loyalty: 70, birthYear: 150 });
    // Give them a lasting 宿疾.
    maimed.afflictions = [{ kind: 'chronic', seasons: 9999, war: -3, ailmentId: 'arm', labelZh: '折肱之痛', labelEn: 'A Crippled Arm' }];
    const hale = mkOfficer({ id: 'fit', forceId: 'F', status: 'idle', loyalty: 70, birthYear: 180 });
    const ctx = {
      officers: { vet: maimed, fit: hale }, cities: {}, playerForceId: 'F',
      existing: [], date: { year: 200, season: 'spring' as const }, rng: () => 0, // pass every gate
    };
    const wishes = rollWishes(ctx);
    const vetWish = wishes.find((w) => w.officerId === 'vet');
    expect(vetWish?.kind).toBe('retire');
    expect(vetWish?.text.zh).toContain('宿疾');
    // The hale officer might still wish something, but never a chronic-retire.
    const fitWish = wishes.find((w) => w.officerId === 'fit');
    if (fitWish?.kind === 'retire') expect(fitWish.text.zh).not.toContain('宿疾');
  });
});

/**
 * 上書 — the letter pool used to be three conditional lines plus a generic
 * greeting, so most letters read "sends a courtly letter of greeting" no
 * matter who wrote them or from where. These pin the pool to the posting.
 */
describe('上書 — letters report the posting the officer actually holds', () => {
  const date: GameDate = { year: 200, season: 'spring', phase: 'early' } as GameDate;
  const city = (over: Partial<City>): City => ({
    id: 'c', name: { zh: '許昌', en: 'Xuchang' },
    population: 100_000, gold: 1000, food: 20_000, troops: 5000,
    agriculture: 50, commerce: 50, defense: 50, loyalty: 70,
    ownerForceId: 'F', coords: { x: 0, y: 0 }, adjacentCityIds: [],
    ...over,
  } as City);
  const at = (c: City, o = mkOfficer({ id: 'a', forceId: 'F', status: 'idle' })) =>
    composeInfoLetters({ ...o, locationCityId: 'c' }, { cities: { c }, date })
      .map((r) => r.zh).join('\n');

  it('reads the granary both ways', () => {
    expect(at(city({ food: 1000, troops: 5000 }))).toContain('存糧不足');
    expect(at(city({ food: 100_000, troops: 5000 }))).toContain('倉廩皆盈');
  });

  it('notices graft, sheltered households and crumbling walls', () => {
    expect(at(city({ corruption: 60 }))).toContain('出入之數不相應');
    expect(at(city({ hiddenHouseholds: 30 }))).toContain('版籍所載不及其半');
    expect(at(city({ defense: 10 }))).toContain('城堞頹圮');
  });

  it('reports the imbalance between fields and markets', () => {
    expect(at(city({ commerce: 90, agriculture: 20 }))).toContain('末富而本貧');
    expect(at(city({ agriculture: 90, commerce: 20 }))).toContain('物賤傷農');
  });

  it('writes to the season', () => {
    const c = city({});
    const inSeason = (s: GameDate['season']) =>
      composeInfoLetters({ ...mkOfficer({ id: 'a', forceId: 'F' }), locationCityId: 'c' },
        { cities: { c }, date: { ...date, season: s } }).map((r) => r.zh).join('\n');
    expect(inSeason('spring')).toContain('春耕方始');
    expect(inSeason('summer')).toContain('夏雨連旬');
    expect(inSeason('autumn')).toContain('秋熟已登');
    expect(inSeason('winter')).toContain('歲暮苦寒');
  });

  it('lets the man himself speak — age, wounds, and idle hands', () => {
    const old = mkOfficer({ id: 'a', forceId: 'F', status: 'idle', birthYear: 130 });
    expect(at(city({}), old)).toContain('齒髮衰矣');
    const hurt = mkOfficer({ id: 'a', forceId: 'F', status: 'wounded' });
    expect(at(city({}), hurt)).toContain('創處未合');
    const warrior = mkOfficer({
      id: 'a', forceId: 'F', status: 'idle',
      stats: { leadership: 80, war: 95, intelligence: 50, politics: 40, charisma: 60 },
    });
    expect(at(city({}), warrior)).toContain('髀肉復生');
  });

  it('falls back on the bare greeting only when nothing else applies', () => {
    const nobody = mkOfficer({
      id: 'a', forceId: 'F', status: 'idle', birthYear: 180, loyalty: 80,
      stats: { leadership: 60, war: 60, intelligence: 60, politics: 60, charisma: 60 },
    });
    const letters = composeInfoLetters({ ...nobody, locationCityId: null }, { cities: {}, date });
    expect(letters).toHaveLength(1);
    expect(letters[0].zh).toContain('上書問安');
  });
});
