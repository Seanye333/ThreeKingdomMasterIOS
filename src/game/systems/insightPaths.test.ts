/** 對稱與出路批 — 辯服來投 / 心得出路(悟招·改換門庭) / 臨陣觀敵. */
import { describe, it, expect } from 'vitest';
import { debateRecruitChance } from './debateDiplomacy';
import {
  insightMoveCost, schoolSwitchCost, schoolSwitchXiuwei, SCHOOL_SWITCH_KEEP,
  readFoe, MARTIAL_SCHOOL,
} from './martialArts';
import { isDuelMoveUnlocked, duelMoveUnlockLevel, weaponClassFor } from './duel';
import { mkOfficer } from '../../test/factories';

const S = (war: number, int = 60, cha = 60) => ({ war, leadership: 60, intelligence: int, politics: 50, charisma: cha });

describe('辯服來投 (debateRecruitChance)', () => {
  const persuader = mkOfficer({ id: 'p', stats: S(40, 95, 92), debateXiuwei: 80, renown: 60 });
  it('the unswervingly loyal never turn, however neatly the argument lands', () => {
    expect(debateRecruitChance(mkOfficer({ id: 'x', loyalty: 10, traits: ['loyal'] }), persuader)).toBe(0);
    expect(debateRecruitChance(mkOfficer({ id: 'y', loyalty: 10, traits: ['principled'] }), persuader)).toBe(0);
  });
  it('a shaky loyalty is far more open than a firm one', () => {
    const shaky = debateRecruitChance(mkOfficer({ id: 'a', loyalty: 20, stats: S(50) }), persuader);
    const firm = debateRecruitChance(mkOfficer({ id: 'b', loyalty: 90, stats: S(50) }), persuader);
    expect(shaky).toBeGreaterThan(firm);
    expect(shaky).toBeLessThanOrEqual(0.45);
  });
  it('being out-thought matters: a wide 清議 gap persuades harder', () => {
    const dull = mkOfficer({ id: 'c', loyalty: 40, stats: S(50, 30, 30) });
    const nearPeer = mkOfficer({ id: 'd', loyalty: 40, stats: S(50, 93, 90), debateXiuwei: 78 });
    expect(debateRecruitChance(dull, persuader)).toBeGreaterThan(debateRecruitChance(nearPeer, persuader));
  });
  it('the ambitious weigh the offer; the stubborn dig in', () => {
    const base = mkOfficer({ id: 'e', loyalty: 40, stats: S(50) });
    const ambitious = mkOfficer({ id: 'f', loyalty: 40, stats: S(50), traits: ['ambitious'] });
    const stubborn = mkOfficer({ id: 'g', loyalty: 40, stats: S(50), traits: ['stubborn'] });
    expect(debateRecruitChance(ambitious, persuader)).toBeGreaterThan(debateRecruitChance(base, persuader));
    expect(debateRecruitChance(stubborn, persuader)).toBeLessThan(debateRecruitChance(base, persuader));
  });
});

describe('心得出路 — 悟招 / 改換門庭', () => {
  it('a grasped move unlocks regardless of level, but a maim still bars it', () => {
    const raw = mkOfficer({ id: 'r', stats: S(80), level: 1 });
    expect(isDuelMoveUnlocked(raw, 'combo')).toBe(false);
    const learned = mkOfficer({ id: 'r', stats: S(80), level: 1, duelMovesLearned: ['combo'] });
    expect(isDuelMoveUnlocked(learned, 'combo')).toBe(true);
    // 傷殘 outranks study — a severed arm cannot flurry.
    const maimed = mkOfficer({ id: 'r', stats: S(80), level: 1, duelMovesLearned: ['combo'], duelScars: ['maimed-arm'] });
    expect(isDuelMoveUnlocked(maimed, 'combo')).toBe(false);
  });
  it('later moves cost more insight', () => {
    expect(insightMoveCost(duelMoveUnlockLevel('taunt'))).toBeLessThan(insightMoveCost(duelMoveUnlockLevel('ultimate')));
    expect(insightMoveCost(1)).toBeGreaterThanOrEqual(4);
  });
  it('changing schools costs more the deeper the craft, and keeps 60%', () => {
    expect(schoolSwitchCost(0)).toBeLessThan(schoolSwitchCost(96));
    expect(schoolSwitchXiuwei(100)).toBe(Math.floor(100 * SCHOOL_SWITCH_KEEP));
    expect(schoolSwitchXiuwei(50)).toBeLessThan(50);
  });
  it('an explicit school overrides whatever the weapon would imply', () => {
    const base = mkOfficer({ id: 'o', stats: S(80) });
    // Pick a school the officer would NOT otherwise be read as, so the override is provable.
    const target = weaponClassFor(base) === 'halberd' ? 'bow' : 'halberd';
    const switched = mkOfficer({ id: 'o', stats: S(80), martialSchool: target });
    expect(weaponClassFor(base)).not.toBe(target);
    expect(weaponClassFor(switched)).toBe(target);
  });
});

describe('臨陣觀敵 (readFoe)', () => {
  const foe = mkOfficer({ id: 'foe', stats: S(88), martialXiuwei: 70 }); // 大成 → carries a secret
  it('a dull eye sees only the weapon', () => {
    const dullard = mkOfficer({ id: 'd', stats: S(80, 30) });
    const r = readFoe(dullard, foe, 'spear', 'glaive');
    expect(r.depth).toBe('glance');
    expect(r.tier).toBeUndefined();
    expect(r.school.zh).toBe(MARTIAL_SCHOOL.glaive.zh);
  });
  it('a sharp eye reads the school matchup and the depth of training', () => {
    const sharp = mkOfficer({ id: 's', stats: S(80, 72) });
    const r = readFoe(sharp, foe, 'spear', 'glaive');
    expect(r.depth).toBe('read');
    expect(r.tier?.zh).toBe('大成');
    expect(r.counter).toBe('favourable'); // 槍剋刀
    expect(r.hasSecret).toBeUndefined();  // not keen enough to spot the art
  });
  it('a keen eye also spots a signature art, and reads an unfavourable matchup', () => {
    const keen = mkOfficer({ id: 'k', stats: S(80, 96) });
    const r = readFoe(keen, foe, 'glaive', 'spear');
    expect(r.depth).toBe('full');
    expect(r.hasSecret).toBe(true);
    expect(r.counter).toBe('unfavourable'); // 槍剋刀, read from the glaive's side
  });
  it("one's own mastery sharpens the read — a master recognises a master", () => {
    const plain = mkOfficer({ id: 'p', stats: S(80, 56) });
    const adept = mkOfficer({ id: 'a', stats: S(80, 56), martialXiuwei: 96 });
    expect(readFoe(plain, foe, 'spear', 'glaive').depth).toBe('glance');
    expect(readFoe(adept, foe, 'spear', 'glaive').depth).not.toBe('glance');
  });
});
