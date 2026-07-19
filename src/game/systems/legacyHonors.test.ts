/** 傳承與歲時批 — 遺譜傳世 / 歲末雙榜 / 文敵先至 / 團戰名局廊. */
import { describe, it, expect } from 'vitest';
import { legacyManualDrops, legacyDropLine } from './legacyManual';
import { annualHonors, honorRenown } from './scholarRank';
import { tickMoonWrit } from './aiParley';
import { recordRivalryBout } from './rivalries';
import { resolveTeamDuel, meleeReplayFighters, meleeResultFromRecord } from './teamDuel';
import { mkOfficer, seededRng } from '../../test/factories';
import type { GameDate } from '../types';

const DATE: GameDate = { year: 200, season: 'spring' } as GameDate;
const S = (war: number, int = 60) => ({ war, leadership: 60, intelligence: int, politics: 50, charisma: 60 });

describe('遺譜傳世 (legacyManualDrops)', () => {
  it('only a 宗師+/名士+ leaves a volume, and only where they were posted', () => {
    const journeyman = mkOfficer({ id: 'j', stats: S(80), martialXiuwei: 40, locationCityId: 'c1' });
    expect(legacyManualDrops(journeyman, 'c1')).toEqual([]);
    const master = mkOfficer({ id: 'm', stats: S(90), martialXiuwei: 85 }); // 宗師
    expect(legacyManualDrops(master, 'c1')).toHaveLength(1);
    expect(legacyManualDrops(master, null)).toEqual([]); // died landless — nothing gathered
  });
  it('the peerless leave the weightier book', () => {
    const grand = legacyManualDrops(mkOfficer({ id: 'g', martialXiuwei: 85 }), 'c1')[0];
    const godly = legacyManualDrops(mkOfficer({ id: 'w', martialXiuwei: 100 }), 'c1')[0];
    expect(grand.itemId).toBe('jianjing-manual');
    expect(godly.itemId).toBe('wuwu-mijue');
    expect(grand.kind).toBe('martial');
  });
  it('a master of BOTH arts leaves two volumes, one of each', () => {
    const both = mkOfficer({ id: 'b', martialXiuwei: 96, debateXiuwei: 96 });
    const drops = legacyManualDrops(both, 'c1');
    expect(drops).toHaveLength(2);
    expect(new Set(drops.map((d) => d.kind))).toEqual(new Set(['martial', 'debate']));
    expect(legacyDropLine(drops[0], '關羽', '荊州').textZh).toContain('關羽');
  });
});

describe('歲末雙榜 (annualHonors)', () => {
  const officers = {
    arm: mkOfficer({ id: 'arm', stats: { war: 98, leadership: 80, intelligence: 40, politics: 30, charisma: 40 } }),
    tongue: mkOfficer({ id: 'tongue', stats: { war: 20, leadership: 40, intelligence: 97, politics: 85, charisma: 95 } }),
    mid: mkOfficer({ id: 'mid', stats: S(70, 70) }),
    dead: mkOfficer({ id: 'dead', stats: S(99, 99), status: 'dead' }),
  };
  it('crowns the top of each board and skips the fallen', () => {
    const h = annualHonors(officers, {}, 205);
    expect(h.year).toBe(205);
    expect(h.arms[0].officerId).toBe('arm');
    expect(h.tongues[0].officerId).toBe('tongue');
    expect(h.arms.every((e) => e.officerId !== 'dead')).toBe(true);
    expect(h.tongues.every((e) => e.officerId !== 'dead')).toBe(true);
  });
  it('ranks are 1-based and renown falls off with placing', () => {
    const h = annualHonors(officers, {}, 205);
    expect(h.arms.map((e) => e.rank)).toEqual([1, 2, 3]);
    expect(honorRenown(1)).toBeGreaterThan(honorRenown(2));
    expect(honorRenown(2)).toBeGreaterThan(honorRenown(3));
    expect(h.arms[0].scoreZh.length).toBeGreaterThan(0);
  });
});

describe('文敵先至 (tickMoonWrit with 文敵簿)', () => {
  const officers = {
    holder: mkOfficer({ id: 'holder', forceId: 'me', stats: S(50, 92) }),
    feud: mkOfficer({ id: 'feud', forceId: 'wei', stats: S(50, 70) }),   // weaker, but an old foe
    keener: mkOfficer({ id: 'keener', forceId: 'wu', stats: S(50, 96) }), // the sharper stranger
  };
  it('an unfinished word-feud writs ahead of a keener stranger', () => {
    const ledger = recordRivalryBout({}, 'holder', 'feud', 'a', false, 200, 0);
    const w = tickMoonWrit({
      officers, holderId: 'holder', playerForceId: 'me', existing: undefined,
      expiresAt: DATE, debateRivalries: ledger, rng: seededRng(2),
    });
    expect(w?.challengerId).toBe('feud');
    expect(w?.feud).toBe(true);
  });
  it('a feud already settled by a 罵倒 is spent — the stranger writs instead', () => {
    const closed = recordRivalryBout({}, 'holder', 'feud', 'a', true, 200, 0); // routed = closed
    const w = tickMoonWrit({
      officers, holderId: 'holder', playerForceId: 'me', existing: undefined,
      expiresAt: DATE, debateRivalries: closed, rng: seededRng(2),
    });
    expect(w?.feud).toBeUndefined();
    expect(w?.challengerId).not.toBe('feud');
  });
});

describe('團戰名局廊 (melee record round-trip)', () => {
  const A = [mkOfficer({ id: 'a1', stats: S(92) }), mkOfficer({ id: 'a2', stats: S(88) })];
  const B = [mkOfficer({ id: 'b1', stats: S(60) }), mkOfficer({ id: 'b2', stats: S(55) })];
  const officers = Object.fromEntries([...A, ...B].map((o) => [o.id, o]));

  it('flattens every fighter with their side, station and fate', () => {
    const res = resolveTeamDuel(A, B, seededRng(5));
    const flat = meleeReplayFighters(res);
    expect(flat).toHaveLength(4);
    expect(new Set(flat.map((f) => f.id))).toEqual(new Set(['a1', 'a2', 'b1', 'b2']));
    for (const f of flat) expect(['a', 'b']).toContain(f.side);
  });
  it('rehydrates into a playable result that preserves the verdict', () => {
    const res = resolveTeamDuel(A, B, seededRng(5));
    const rec = { winner: res.winner, rounds: res.rounds, fighters: meleeReplayFighters(res), log: res.log };
    const back = meleeResultFromRecord(rec, officers)!;
    expect(back).not.toBeNull();
    expect(back.winner).toBe(res.winner);
    expect(back.rounds).toBe(res.rounds);
    expect(back.a.map((f) => f.id)).toEqual(res.a.map((f) => f.id));
    // The downed stay downed on replay, with their fate intact.
    for (const f of res.b) {
      const mirror = back.b.find((x) => x.id === f.id)!;
      expect(mirror.downed).toBe(f.downed);
      expect(mirror.fate).toBe(f.fate);
    }
  });
  it('returns null when a side\'s champions are all gone from the world', () => {
    const res = resolveTeamDuel(A, B, seededRng(5));
    const rec = { winner: res.winner, rounds: res.rounds, fighters: meleeReplayFighters(res), log: res.log };
    const onlyA = Object.fromEntries(A.map((o) => [o.id, o]));
    expect(meleeResultFromRecord(rec, onlyA)).toBeNull();
  });
});
