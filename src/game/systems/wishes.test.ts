/** 武將心願 — locks the wish grant/reject effects + grievance dynamics. */
import { describe, it, expect } from 'vitest';
import { applyWishGrant, applyWishReject, decayGrievances, expireWishes } from './wishes';
import { mkOfficer } from '../../test/factories';
import type { OfficerWish } from '../types';

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
