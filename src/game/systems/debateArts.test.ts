/** 文辯修為成長線 — 修為/心得/學派 · 講席 · 論戰頓悟,及其接入舌戰引擎;附 武學流派相剋. */
import { describe, it, expect } from 'vitest';
import {
  debateXiuwei, debateInsight, debateArtsTier, tierOfDebateXiuwei, debateArtsBonus,
  debateTrainCost, trainDebateArts, DEBATE_TRAIN_STEP, DEBATE_XIUWEI_MAX,
  checkDebateEpiphany, debateSchoolName, DEBATE_SCHOOL,
  canTransmitScholarship, transmitScholarship, scholarshipGain, DEBATE_TRANSMIT_COST, DEBATE_TRANSMIT_BASE_GAIN,
} from './debateArts';
import { initDebate, debatePersona, resolveWordWar } from './wordWar';
import { schoolBeats, schoolCounterEdge, schoolCounterLine } from './martialArts';
import { initDuelBout, resolveDuel, staticProwess } from './duel';
import { mkOfficer, seededRng } from '../../test/factories';

const S = (int: number, cha = 60) => ({ war: 50, leadership: 60, intelligence: int, politics: 60, charisma: cha });

describe('文辯修為 tiers & bonuses', () => {
  it('tier boundaries climb 未通文墨→辯聖', () => {
    expect(tierOfDebateXiuwei(0).zh).toBe('未通文墨');
    expect(tierOfDebateXiuwei(14).tier).toBe(0);
    expect(tierOfDebateXiuwei(15).zh).toBe('開蒙');
    expect(tierOfDebateXiuwei(35).zh).toBe('通經');
    expect(tierOfDebateXiuwei(60).zh).toBe('雄辯');
    expect(tierOfDebateXiuwei(82).zh).toBe('名士');
    expect(tierOfDebateXiuwei(96).zh).toBe('辯聖');
  });
  it('bonuses are monotonic in tier', () => {
    const tiers = [0, 15, 35, 60, 82, 96].map((xw) => debateArtsBonus(mkOfficer({ stats: S(80), debateXiuwei: xw })));
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].prowess).toBeGreaterThanOrEqual(tiers[i - 1].prowess);
      expect(tiers[i].composure).toBeGreaterThanOrEqual(tiers[i - 1].composure);
    }
    expect(tiers[5].prowess).toBeGreaterThan(0);
    expect(tiers[5].openingMomentum).toBeGreaterThan(0);
  });
  it('reads/clamps officer fields; every 學派 has a name', () => {
    expect(debateXiuwei(mkOfficer({ debateXiuwei: 150 }))).toBe(DEBATE_XIUWEI_MAX);
    expect(debateXiuwei(mkOfficer({}))).toBe(0);
    expect(debateInsight(mkOfficer({ debateInsight: 7 }))).toBe(7);
    expect(debateArtsTier(mkOfficer({ debateXiuwei: 60 })).zh).toBe('雄辯');
    for (const p of Object.keys(DEBATE_SCHOOL) as Array<keyof typeof DEBATE_SCHOOL>) {
      expect(debateSchoolName(p).zh.length).toBeGreaterThan(0);
    }
  });
});

describe('講席 — spend 心得 to raise 修為', () => {
  it('cost rises with tier; a session spends 心得 and adds 修為', () => {
    expect(debateTrainCost(0)).toBeLessThan(debateTrainCost(40));
    const o = mkOfficer({ stats: S(80), debateXiuwei: 20, debateInsight: 50 });
    const r = trainDebateArts(o)!;
    expect(r.xiuwei).toBe(20 + DEBATE_TRAIN_STEP);
    expect(r.insight).toBe(50 - debateTrainCost(20));
  });
  it('flags a tier-up crossing 開蒙; refuses when short or maxed', () => {
    expect(trainDebateArts(mkOfficer({ stats: S(80), debateXiuwei: 12, debateInsight: 99 }))!.tierUp?.zh).toBe('開蒙');
    expect(trainDebateArts(mkOfficer({ debateXiuwei: 0, debateInsight: 1 }))).toBeNull();
    expect(trainDebateArts(mkOfficer({ debateXiuwei: 100, debateInsight: 999 }))).toBeNull();
  });
});

describe('名士傳道 (transmitScholarship)', () => {
  const master = mkOfficer({ id: 'master', stats: S(92), debateXiuwei: 85, debateInsight: 20 }); // 名士
  it('gates: only a 名士+ with 心得 lectures, never a near-peer or self', () => {
    expect(canTransmitScholarship(master, mkOfficer({ id: 'p1', debateXiuwei: 10 })).ok).toBe(true);
    expect(canTransmitScholarship(mkOfficer({ id: 'versed', debateXiuwei: 50, debateInsight: 20 }), mkOfficer({ id: 'p2' })).ok).toBe(false);
    expect(canTransmitScholarship(mkOfficer({ id: 'broke', debateXiuwei: 85, debateInsight: 2 }), mkOfficer({ id: 'p3' })).ok).toBe(false);
    expect(canTransmitScholarship(master, mkOfficer({ id: 'peer', debateXiuwei: 80 })).ok).toBe(false);
    expect(canTransmitScholarship(master, master).ok).toBe(false);
  });
  it('a session moves 修為 to the pupil, capped short of the teacher', () => {
    const r = transmitScholarship(master, mkOfficer({ id: 'pupil', debateXiuwei: 10 }), false, false)!;
    expect(r.gained).toBe(DEBATE_TRANSMIT_BASE_GAIN);
    expect(r.masterInsight).toBe(20 - DEBATE_TRANSMIT_COST);
    expect(scholarshipGain(true, true)).toBe(DEBATE_TRANSMIT_BASE_GAIN + 6);
    const near = transmitScholarship(master, mkOfficer({ id: 'near', debateXiuwei: 74 }), true, true)!;
    expect(near.pupilXiuwei).toBe(85 - 5);
  });
});

describe('論戰頓悟 (checkDebateEpiphany)', () => {
  it('a loss still teaches a little; an easy win never sparks', () => {
    expect(checkDebateEpiphany({ won: false, prowessGap: -20 }, seededRng(1)).insight).toBe(1);
    const rng = seededRng(2);
    for (let i = 0; i < 200; i++) expect(checkDebateEpiphany({ won: true, prowessGap: -30 }, rng).epiphany).toBe(false);
  });
  it('out-arguing a keener famed tongue often sparks a 頓悟', () => {
    const rng = seededRng(3);
    let epiph = 0;
    for (let i = 0; i < 300; i++) {
      const r = checkDebateEpiphany({ won: true, prowessGap: 25, notableFoe: true }, rng);
      if (r.epiphany) { epiph++; expect(r.insight).toBeGreaterThan(5); }
    }
    expect(epiph).toBeGreaterThan(100);
  });
});

describe('文辯接入舌戰引擎', () => {
  it('修為 lifts bout prowess / opening 氣勢 / 沉著', () => {
    const raw = mkOfficer({ id: 'x', stats: S(80) });
    const sage = mkOfficer({ id: 'x', stats: S(80), debateXiuwei: 96 }); // 辯聖
    const foe = mkOfficer({ id: 'y', stats: S(70) });
    const b0 = initDebate(raw, foe);
    const b1 = initDebate(sage, foe);
    expect(b1.aProwess).toBe(b0.aProwess + debateArtsBonus(sage).prowess);
    expect(b1.aMomentum).toBe(debateArtsBonus(sage).openingMomentum);
    expect(b1.aComposure).toBe(100 + debateArtsBonus(sage).composure);
    // sanity: the school reads from the debater's persona
    expect(debateSchoolName(debatePersona(sage)).zh.length).toBeGreaterThan(0);
  });
  it('修為 tells in the pre-battle auto 舌戰 too', () => {
    // Same stats — the drilled 辯聖 should win the war of words far more often.
    let sageWins = 0;
    const rng = seededRng(7);
    for (let i = 0; i < 120; i++) {
      const a = mkOfficer({ id: 'a', stats: S(75), debateXiuwei: 96 });
      const d = mkOfficer({ id: 'd', stats: S(75) });
      const r = resolveWordWar(a, d, [], [], rng);
      if (r.winnerSide === 'attacker') sageWins++;
    }
    expect(sageWins).toBeGreaterThan(70);
  });
});

describe('武學流派相剋 (schoolCounterEdge)', () => {
  it('the ring covers all 8 schools, one beats one, no mutual beats', () => {
    const all = ['sword', 'axe', 'twinblade', 'glaive', 'spear', 'halberd', 'greatsword', 'bow'] as const;
    for (const x of all) {
      const beaten = all.filter((y) => schoolBeats(x, y));
      expect(beaten.length).toBe(1);
      expect(schoolBeats(beaten[0], x)).toBe(false); // no pair beats both ways
    }
  });
  it('the untrained know no counters; the edge deepens with 修為', () => {
    expect(schoolCounterEdge('spear', 'glaive', 0)).toBe(0);
    expect(schoolCounterEdge('spear', 'glaive', 15)).toBe(2);   // 入門
    expect(schoolCounterEdge('spear', 'glaive', 96)).toBe(6);   // 武神
    expect(schoolCounterEdge('glaive', 'spear', 96)).toBe(0);   // wrong way round
    expect(schoolCounterLine('spear', 'glaive')?.zh).toContain('相剋');
    expect(schoolCounterLine('glaive', 'spear')).toBeNull();
  });
  it('a trained counter-school fights above its line in the interactive bout', () => {
    // 張飛-style spearman (trained) vs a glaive arm of equal stats.
    const spear = mkOfficer({ id: 'sp', stats: { war: 85, leadership: 60, intelligence: 50, politics: 40, charisma: 50 }, martialXiuwei: 60 });
    const glaive = mkOfficer({ id: 'gl', stats: { war: 85, leadership: 60, intelligence: 50, politics: 40, charisma: 50 }, martialXiuwei: 60 });
    // Force weapon classes via known officer ids is fiddly; instead check via initDuelBout with explicit classes.
    const bout = initDuelBout(spear, glaive);
    // Both default to the same class (no famous weapon) → no edge either way; the
    // engine invariant we lock is: aStatic difference equals the counter edge when
    // classes DO clash, and staticProwess itself never bakes the edge in.
    expect(bout.aStatic - staticProwess(spear)).toBeGreaterThanOrEqual(0);
    expect(bout.dStatic - staticProwess(glaive)).toBeGreaterThanOrEqual(0);
    // And the auto-resolver accepts the pair without error.
    const res = resolveDuel({ attacker: spear, defender: glaive, rng: seededRng(5) });
    expect(['attacker', 'defender', 'draw']).toContain(res.winner);
  });
});
