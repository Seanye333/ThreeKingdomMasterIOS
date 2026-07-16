/** 批 C 武學成長線 — 修為/心得/流派 · 修煉 · 苦戰頓悟,及其接入單挑引擎. */
import { describe, it, expect } from 'vitest';
import {
  martialXiuwei, martialInsight, martialTier, tierOfXiuwei, martialBonus,
  martialTrainCost, trainMartialArts, MARTIAL_TRAIN_STEP, MARTIAL_XIUWEI_MAX,
  checkMartialEpiphany, martialSchoolName, MARTIAL_SCHOOL,
  canTransmitArts, transmitArts, transmitGain, TRANSMIT_COST, TRANSMIT_BASE_GAIN,
} from './martialArts';
import { staticProwess, isDuelMoveUnlocked, initDuelBout, weaponClassFor } from './duel';
import { mkOfficer, seededRng } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 60, intelligence: 60, politics: 50, charisma: 60 });

describe('修為 tiers & bonuses', () => {
  it('tier boundaries climb 未入門→武神', () => {
    expect(tierOfXiuwei(0).zh).toBe('未入門');
    expect(tierOfXiuwei(14).tier).toBe(0);
    expect(tierOfXiuwei(15).zh).toBe('入門');
    expect(tierOfXiuwei(35).zh).toBe('精熟');
    expect(tierOfXiuwei(60).zh).toBe('大成');
    expect(tierOfXiuwei(82).zh).toBe('宗師');
    expect(tierOfXiuwei(96).zh).toBe('武神');
  });
  it('bonuses are monotonic in tier', () => {
    const tiers = [0, 15, 35, 60, 82, 96].map((xw) => martialBonus(mkOfficer({ stats: W(80), martialXiuwei: xw })));
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].moveUnlockDiscount).toBeGreaterThanOrEqual(tiers[i - 1].moveUnlockDiscount);
      expect(tiers[i].prowess).toBeGreaterThanOrEqual(tiers[i - 1].prowess);
    }
    expect(tiers[5].prowess).toBeGreaterThan(0);
  });
  it('reads/clamps officer fields', () => {
    expect(martialXiuwei(mkOfficer({ martialXiuwei: 150 }))).toBe(MARTIAL_XIUWEI_MAX);
    expect(martialXiuwei(mkOfficer({}))).toBe(0);
    expect(martialInsight(mkOfficer({ martialInsight: 7 }))).toBe(7);
    expect(martialTier(mkOfficer({ martialXiuwei: 60 })).zh).toBe('大成');
  });
  it('every weapon school has a name', () => {
    for (const cls of Object.keys(MARTIAL_SCHOOL) as Array<keyof typeof MARTIAL_SCHOOL>) {
      expect(martialSchoolName(cls).zh.length).toBeGreaterThan(0);
    }
  });
});

describe('修煉 — spend 心得 to raise 修為', () => {
  it('cost rises with tier', () => {
    expect(martialTrainCost(0)).toBeLessThan(martialTrainCost(40));
    expect(martialTrainCost(40)).toBeLessThan(martialTrainCost(90));
  });
  it('a session spends 心得 and adds 修為', () => {
    const o = mkOfficer({ stats: W(80), martialXiuwei: 20, martialInsight: 50 });
    const r = trainMartialArts(o);
    expect(r).not.toBeNull();
    expect(r!.xiuwei).toBe(20 + MARTIAL_TRAIN_STEP);
    expect(r!.insight).toBe(50 - martialTrainCost(20));
    expect(r!.gained).toBe(MARTIAL_TRAIN_STEP);
  });
  it('flags a tier-up when it crosses a threshold', () => {
    const o = mkOfficer({ stats: W(80), martialXiuwei: 12, martialInsight: 99 }); // 12→17 crosses 15 (入門)
    const r = trainMartialArts(o);
    expect(r!.tierUp?.zh).toBe('入門');
  });
  it('refuses when 心得 is short or 修為 maxed', () => {
    expect(trainMartialArts(mkOfficer({ martialXiuwei: 0, martialInsight: 1 }))).toBeNull();
    expect(trainMartialArts(mkOfficer({ martialXiuwei: 100, martialInsight: 999 }))).toBeNull();
  });
});

describe('宗師傳藝 (transmitArts)', () => {
  const master = mkOfficer({ id: 'master', stats: W(92), martialXiuwei: 85, martialInsight: 20 }); // 宗師
  it('gates: only a 宗師+ with 心得 teaches, and never a near-peer', () => {
    expect(canTransmitArts(master, mkOfficer({ id: 'p1', martialXiuwei: 10 })).ok).toBe(true);
    expect(canTransmitArts(mkOfficer({ id: 'adept', martialXiuwei: 50, martialInsight: 20 }), mkOfficer({ id: 'p2' })).ok).toBe(false); // not grandmaster
    expect(canTransmitArts(mkOfficer({ id: 'broke', martialXiuwei: 85, martialInsight: 2 }), mkOfficer({ id: 'p3' })).ok).toBe(false);   // no insight
    expect(canTransmitArts(master, mkOfficer({ id: 'peer', martialXiuwei: 80 })).ok).toBe(false); // pupil too advanced
    expect(canTransmitArts(master, master).ok).toBe(false); // self
  });
  it('a session moves 修為 to the pupil and 心得 off the master', () => {
    const pupil = mkOfficer({ id: 'pupil', martialXiuwei: 10 });
    const r = transmitArts(master, pupil, false, false)!;
    expect(r.gained).toBe(TRANSMIT_BASE_GAIN);
    expect(r.pupilXiuwei).toBe(10 + TRANSMIT_BASE_GAIN);
    expect(r.masterInsight).toBe(20 - TRANSMIT_COST);
  });
  it('同門 and 師徒 learn faster; never taught past the teacher', () => {
    expect(transmitGain(true, true)).toBe(TRANSMIT_BASE_GAIN + 6);
    // cap: a pupil close to the ceiling only gains up to master − 5
    const nearly = mkOfficer({ id: 'near', martialXiuwei: 74 });
    const r = transmitArts(master, nearly, true, true)!; // 74 + 14 → capped at 80
    expect(r.pupilXiuwei).toBe(85 - 5);
    expect(r.gained).toBe(6);
  });
});

describe('苦戰頓悟 (checkMartialEpiphany)', () => {
  it('a loss still teaches a little', () => {
    const r = checkMartialEpiphany({ won: false, prowessGap: -20 }, seededRng(1));
    expect(r.insight).toBe(1);
    expect(r.epiphany).toBe(false);
  });
  it('an easy win over a weakling never sparks a 頓悟', () => {
    const rng = seededRng(2);
    let epiph = 0;
    for (let i = 0; i < 200; i++) if (checkMartialEpiphany({ won: true, prowessGap: -30 }, rng).epiphany) epiph++;
    expect(epiph).toBe(0);
  });
  it('besting a far stronger foe often sparks a 頓悟 (bonus 心得)', () => {
    const rng = seededRng(3);
    let epiph = 0, total = 0;
    for (let i = 0; i < 300; i++) {
      const r = checkMartialEpiphany({ won: true, prowessGap: 25, notableFoe: true }, rng);
      if (r.epiphany) { epiph++; expect(r.insight).toBeGreaterThan(5); }
      total += r.insight;
    }
    expect(epiph).toBeGreaterThan(100);
    expect(total / 300).toBeGreaterThan(2);
  });
});

describe('武學接入單挑引擎', () => {
  it('修為 lifts staticProwess', () => {
    const raw = mkOfficer({ id: 'r', stats: W(80) });
    const master = mkOfficer({ id: 'r', stats: W(80), martialXiuwei: 82 }); // 宗師
    expect(staticProwess(master)).toBeGreaterThan(staticProwess(raw));
    expect(staticProwess(master) - staticProwess(raw)).toBe(martialBonus(master).prowess);
  });
  it('high 修為 unlocks flourish moves earlier than level alone', () => {
    // level 1 fighter normally can't combo (Lv.10); a 宗師 (discount +6) still can't,
    // but a level-4 大成 (discount +4 → effective 8) is much closer than a raw level-4.
    const rawLv4 = mkOfficer({ id: 'a', stats: W(80), level: 4 });
    const masterLv4 = mkOfficer({ id: 'a', stats: W(80), level: 4, martialXiuwei: 60 }); // 大成 +4
    // taunt unlocks at Lv.3 — both have it; thrust at Lv.6 — only the master (4+4≥6).
    expect(isDuelMoveUnlocked(rawLv4, 'thrust')).toBe(false);
    expect(isDuelMoveUnlocked(masterLv4, 'thrust')).toBe(true);
  });
  it('a 大成+ master opens the bout with banked 氣', () => {
    const master = mkOfficer({ id: 'm', stats: W(85), martialXiuwei: 60 });
    const foe = mkOfficer({ id: 'f', stats: W(80) });
    const bout = initDuelBout(master, foe);
    expect(bout.aGuard).toBeGreaterThanOrEqual(1);
    expect(martialBonus(master).openingGuard).toBeGreaterThanOrEqual(1);
    // sanity: the school reads from the fighter's weapon class
    expect(martialSchoolName(weaponClassFor(master)).zh.length).toBeGreaterThan(0);
  });
});
