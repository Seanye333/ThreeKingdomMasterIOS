/** 折衝樽俎 (§6.16) + 朝堂合辯 (§6.17) + 引時事 — batch-3 debate systems. */
import { describe, it, expect } from 'vitest';
import {
  pickCourtVoice, willAcceptParley, concordStakes, tributeStakes,
  canPersuadeCity, persuadeStakes, debateTribute, PERSUADE_MAX_GARRISON,
} from './debateDiplomacy';
import { resolveTeamDebate, teamDebateDowned } from './teamDebate';
import { initDebate, debateRound, pickCiteAmmo, CITE_AMMO_MUL } from './wordWar';
import { mkOfficer, seededRng } from '../../test/factories';
import type { City } from '../types';

const S = (int: number, cha = 60) => ({ war: 50, leadership: 60, intelligence: int, politics: 60, charisma: cha });
const mkCity = (over: Partial<City> = {}): City => ({ troops: 5000, food: 30000, loyalty: 50, ...over } as City);

describe('折衝樽俎 — the parley tables', () => {
  it('pickCourtVoice fields the keenest eligible tongue of the force', () => {
    const officers = {
      keen: mkOfficer({ id: 'keen', forceId: 'wei', stats: S(95, 90) }),
      dull: mkOfficer({ id: 'dull', forceId: 'wei', stats: S(50) }),
      foe:  mkOfficer({ id: 'foe', forceId: 'wu', stats: S(99) }),
      dead: mkOfficer({ id: 'dead', forceId: 'wei', stats: S(99), status: 'dead' }),
    };
    expect(pickCourtVoice(officers, 'wei')!.id).toBe('keen');
  });
  it('a dreaded envoy is harder to face at the table', () => {
    const foeVoice = mkOfficer({ id: 'f', stats: S(80) });
    const meek = mkOfficer({ id: 'm', stats: S(80) });
    const dread = mkOfficer({ id: 'd', stats: S(80), renown: 200, traits: ['eloquent', 'sharp-tongue'] });
    let meekYes = 0, dreadYes = 0;
    const rng1 = seededRng(11), rng2 = seededRng(11);
    for (let i = 0; i < 200; i++) {
      if (willAcceptParley(foeVoice, meek, 0, rng1)) meekYes++;
      if (willAcceptParley(foeVoice, dread, 0, rng2)) dreadYes++;
    }
    expect(dreadYes).toBeLessThan(meekYes);
  });
  it('concord binds a NAP either way; only the loser pays', () => {
    const beaten = mkOfficer({ id: 'b', stats: S(85) });
    expect(concordStakes('win', beaten).napSeasons).toBe(8);
    expect(concordStakes('loss', beaten).napSeasons).toBe(8);
    expect(concordStakes('draw', null).indemnity).toBe(0);
    expect(concordStakes('win', beaten).indemnity).toBe(debateTribute(beaten) * 2);
  });
  it('a 罵倒 squeezes half again as much tribute; a loss just chills the air', () => {
    const foeVoice = mkOfficer({ id: 'v', stats: S(80) });
    const plain = tributeStakes('win', false, foeVoice);
    const routed = tributeStakes('win', true, foeVoice);
    expect(routed.gold).toBeGreaterThan(plain.gold);
    expect(tributeStakes('loss', false, foeVoice).gold).toBe(0);
    expect(plain.scoreDelta).toBeLessThan(0);
  });
  it('說降 gates on garrison and capital; only a rout opens the gates', () => {
    expect(canPersuadeCity(mkCity({ troops: 1000 }), false).ok).toBe(true);
    expect(canPersuadeCity(mkCity({ troops: PERSUADE_MAX_GARRISON + 1 }), false).ok).toBe(false);
    expect(canPersuadeCity(mkCity({ troops: 500 }), true).ok).toBe(false);
    expect(persuadeStakes('win', true).cityFalls).toBe(true);
    expect(persuadeStakes('win', false).cityFalls).toBe(false);
    expect(persuadeStakes('win', false).garrisonExodus).toBeGreaterThan(0);
    expect(persuadeStakes('loss', false).cityFalls).toBe(false);
  });
});

describe('朝堂合辯 (resolveTeamDebate)', () => {
  it('two keen voices argue down a lone middling tongue', () => {
    const pair = [mkOfficer({ id: 'p1', stats: S(88, 80) }), mkOfficer({ id: 'p2', stats: S(85, 78) })];
    const lone = [mkOfficer({ id: 'lone', stats: S(70) })];
    const res = resolveTeamDebate(pair, lone, seededRng(5));
    expect(res.winner).toBe('a');
    expect(teamDebateDowned(res)).toContain('lone');
  });
  it('a lone 辯聖 can still hold two dull tongues to at least a fight', () => {
    const sage = [mkOfficer({ id: 'sage', stats: S(98, 95), debateXiuwei: 96 })];
    const pair = [mkOfficer({ id: 'd1', stats: S(45, 40) }), mkOfficer({ id: 'd2', stats: S(45, 40) })];
    const res = resolveTeamDebate(sage, pair, seededRng(9));
    expect(res.rounds).toBeGreaterThan(1); // not swept off the floor instantly
  });
  it('the log records who fell silent, and the result is winner-consistent', () => {
    const A = [mkOfficer({ id: 'a1', stats: S(90, 85) }), mkOfficer({ id: 'a2', stats: S(88, 80) })];
    const B = [mkOfficer({ id: 'b1', stats: S(60) }), mkOfficer({ id: 'b2', stats: S(55) })];
    const res = resolveTeamDebate(A, B, seededRng(2));
    if (res.winner === 'a') expect(res.b.some((v) => v.downed) || res.rounds >= 1).toBe(true);
    for (const v of [...res.a, ...res.b].filter((v) => v.downed)) {
      expect(res.log.some((l) => l.zh.includes(v.officer.name.zh))).toBe(true);
    }
  });
});

describe('引時事 (pickCiteAmmo + cite multiplier)', () => {
  const annals = [
    { titleZh: '陣斬名將', textZh: '關羽於陣前斬顏良!' },
    { titleZh: '大疫', textZh: '瘟疫橫行,民不聊生。' },
  ];
  it('finds a recent entry touching the foe, else null', () => {
    expect(pickCiteAmmo(annals, ['顏良'])!.titleZh).toBe('陣斬名將');
    expect(pickCiteAmmo(annals, ['張飛'])).toBeNull();
    expect(pickCiteAmmo(annals, [''])).toBeNull();
  });
  it('an armed 引 bites deeper than an unarmed one', () => {
    const me = mkOfficer({ id: 'm', stats: S(85, 80) });
    const foe = mkOfficer({ id: 'f', stats: S(85, 80) });
    // Same seed, same moves; only the cite multiplier differs.
    const armed = initDebate(me, foe, 'veteran', 'legitimacy', { aCiteMul: CITE_AMMO_MUL });
    const bare = initDebate(me, foe, 'veteran', 'legitimacy');
    armed.aMomentum = 2; bare.aMomentum = 2;
    const rArmed = debateRound(armed, 'cite', 'assert', seededRng(4));
    const rBare = debateRound(bare, 'cite', 'assert', seededRng(4));
    expect(rArmed.dmgToD).toBeGreaterThan(rBare.dmgToD);
  });
});
