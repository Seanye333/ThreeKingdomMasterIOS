/** 月旦評 (§6.15) — 清議榜/魁首挑戰/隨季獎賞;附 文名威懾 未辯先怯. */
import { describe, it, expect } from 'vitest';
import { moonScore, moonBoard, pickMoonLaurel, pickMoonChallenger, moonTakeReward, moonHoldStipend, canOrate } from './scholarRank';
import { debateDread, dreadComposureDock, initDebate } from './wordWar';
import { mkOfficer, seededRng } from '../../test/factories';

const S = (int: number, cha = 60) => ({ war: 50, leadership: 60, intelligence: int, politics: 60, charisma: cha });

describe('月旦評 — 清議榜與魁首', () => {
  const officers = {
    sharp: mkOfficer({ id: 'sharp', stats: S(96, 90), debateXiuwei: 80, renown: 50 }),
    mid:   mkOfficer({ id: 'mid', stats: S(80) }),
    dull:  mkOfficer({ id: 'dull', stats: S(40, 30) }),
    dead:  mkOfficer({ id: 'dead', stats: S(99, 99), status: 'dead' }),
  };
  it('清議分 weighs tongue + 修為 + 威名; the dead cannot orate', () => {
    expect(moonScore(officers.sharp)).toBeGreaterThan(moonScore(officers.mid));
    expect(canOrate(officers.dead)).toBe(false);
  });
  it('the board ranks keenest first and skips the fallen', () => {
    const board = moonBoard(officers, 10);
    expect(board[0].officer.id).toBe('sharp');
    expect(board.some((r) => r.officer.id === 'dead')).toBe(false);
  });
  it('pickMoonLaurel finds the keenest (with exclusion); challenger comes from the top slice', () => {
    expect(pickMoonLaurel(officers)!.id).toBe('sharp');
    expect(pickMoonLaurel(officers, 'sharp')!.id).toBe('mid');
    const ch = pickMoonChallenger(officers, 'sharp', seededRng(3));
    expect(ch).not.toBeNull();
    expect(ch!.id).not.toBe('sharp');
  });
  it('rewards scale with the ousted holder and the defense streak', () => {
    expect(moonTakeReward(140).gold).toBeGreaterThan(moonTakeReward(40).gold);
    expect(moonHoldStipend(6).insight).toBeGreaterThan(moonHoldStipend(0).insight);
    expect(moonHoldStipend(3).renown).toBe(1); // a deed every 3rd defense
    expect(moonHoldStipend(2).renown).toBe(0);
  });
});

describe('文名威懾 (§6.15) — 未辯先怯', () => {
  it('a famous, eloquent tongue casts dread; a nobody none', () => {
    const famous = mkOfficer({ id: 'f', stats: S(90), renown: 120, traits: ['eloquent', 'sharp-tongue'] });
    const nobody = mkOfficer({ id: 'n', stats: S(90) });
    expect(debateDread(famous)).toBeGreaterThan(0.1);
    expect(debateDread(nobody)).toBe(0);
    expect(dreadComposureDock(debateDread(famous))).toBeGreaterThan(0);
  });
  it('facing a dreaded name, the foe opens with 沉著 shaved (floored at 60)', () => {
    const famous = mkOfficer({ id: 'f', stats: S(90), renown: 200, traits: ['eloquent'] });
    const nobody = mkOfficer({ id: 'n', stats: S(90) });
    const bout = initDebate(nobody, famous);
    expect(bout.aComposure).toBeLessThan(100);
    expect(bout.aComposure).toBeGreaterThanOrEqual(60);
    expect(bout.dComposure).toBe(100); // the nobody casts no dread back
  });
});
