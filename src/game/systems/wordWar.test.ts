import { describe, it, expect } from 'vitest';
import { mkOfficer } from '../../test/factories';
import {
  debateProwess, initDebate, debateRound, aiDebateMove,
  personaEdge, routConsequence, topicFavors, defaultTopicFor,
  debatePersona, TOPIC_DMG_MUL, PERSONA_EDGE,
  type DebateBout, type DebateMove,
} from './wordWar';

const seq = (vals: number[]) => { let i = 0; return () => vals[Math.min(i++, vals.length - 1)]; };

describe('舌戰 — 口才性格 (rhetorical traits in the interactive game)', () => {
  it('debateProwess folds in the wordWarProwessMul trait multiplier', () => {
    const plain = mkOfficer({ stats: { war: 60, leadership: 60, intelligence: 90, politics: 60, charisma: 70 } });
    const eloquent = mkOfficer({ traits: ['eloquent'] as never, stats: { war: 60, leadership: 60, intelligence: 90, politics: 60, charisma: 70 } });
    // Same stats; 雄辯 (×1.12) makes the sharper tongue measurably keener.
    expect(debateProwess(eloquent)).toBeGreaterThan(debateProwess(plain));
    expect(debateProwess(eloquent)).toBe(Math.round(debateProwess(plain) * 1.12));
  });

  it('a trait-less officer is unaffected (multiplier = 1)', () => {
    const o = mkOfficer({ stats: { war: 50, leadership: 60, intelligence: 80, politics: 60, charisma: 70 } });
    expect(debateProwess(o)).toBe(Math.round(80 + 70 * 0.5));
  });
});

describe('舌戰 — 流派相剋 (persona ring)', () => {
  it('sage answers sly, sly answers fierce, fierce answers sage', () => {
    expect(personaEdge('sage', 'sly')).toBe(PERSONA_EDGE);
    expect(personaEdge('sly', 'fierce')).toBe(PERSONA_EDGE);
    expect(personaEdge('fierce', 'sage')).toBe(PERSONA_EDGE);
    // No edge the other way, nor in a mirror.
    expect(personaEdge('sly', 'sage')).toBe(0);
    expect(personaEdge('sage', 'sage')).toBe(0);
  });

  it('initDebate folds the favourable matchup into 口才', () => {
    // A measured sage (high INT) vs a sly schemer (high CHA, cunning).
    const sage = mkOfficer({ stats: { war: 40, leadership: 60, intelligence: 95, politics: 70, charisma: 50 } });
    const sly = mkOfficer({ traits: ['cunning'] as never, stats: { war: 50, leadership: 60, intelligence: 70, politics: 60, charisma: 90 } });
    expect(debatePersona(sage)).toBe('sage');
    expect(debatePersona(sly)).toBe('sly');
    const bout = initDebate(sage, sly, 'veteran');
    // sage beats sly → the sage carries the edge, the sly side does not.
    expect(bout.aProwess).toBe(debateProwess(sage) + PERSONA_EDGE);
    expect(bout.dProwess).toBe(debateProwess(sly));
  });
});

describe('舌戰 — 論題 (topic) rewards apt arguments', () => {
  it('topicFavors reflects each topic\'s favoured moves', () => {
    expect(topicFavors('legitimacy', 'cite')).toBe(true);   // 引經據典
    expect(topicFavors('legitimacy', 'rebuke')).toBe(false);
    expect(topicFavors('honor', 'rebuke')).toBe(true);      // 厲叱
    expect(topicFavors(undefined, 'cite')).toBe(false);     // no topic → no bonus
  });

  it('an apt argument bites harder than the same argument off-topic', () => {
    const me = mkOfficer({ stats: { war: 40, leadership: 60, intelligence: 80, politics: 60, charisma: 60 } });
    const foe = mkOfficer({ stats: { war: 40, leadership: 60, intelligence: 80, politics: 60, charisma: 60 } });
    // 論 (assert) beats 諷 (provoke). assert is apt on 'legitimacy', not on 'honor'.
    const apt: DebateBout = { ...initDebate(me, foe, 'veteran', 'legitimacy') };
    const off: DebateBout = { ...initDebate(me, foe, 'veteran', 'honor') };
    const rng = () => 0.5; // fixed roll → deterministic damage but for the topic mul
    const aptDmg = debateRound(apt, 'assert', 'provoke', rng).dmgToD;
    const offDmg = debateRound(off, 'assert', 'provoke', rng).dmgToD;
    expect(aptDmg).toBeGreaterThan(offDmg);
    expect(aptDmg).toBe(Math.round(offDmg * TOPIC_DMG_MUL));
  });

  it('every bout carries a default 論題 from the sharper tongue', () => {
    // The fierce general is also the sharper tongue here (higher INT+½CHA).
    const fierce = mkOfficer({ stats: { war: 90, leadership: 70, intelligence: 80, politics: 50, charisma: 75 } });
    const sage = mkOfficer({ stats: { war: 40, leadership: 60, intelligence: 70, politics: 60, charisma: 55 } });
    expect(debatePersona(fierce)).toBe('fierce');
    expect(defaultTopicFor(fierce, sage)).toBe('honor'); // a fierce lead → 忠義氣節
    expect(initDebate(fierce, sage).topic).toBe('honor');
  });
});

describe('舌戰 — 罵死 (rout consequence)', () => {
  it('the young & steady shrug off a rout', () => {
    const calm = mkOfficer({ birthYear: 200, stats: { war: 50, leadership: 60, intelligence: 80, politics: 60, charisma: 70 } });
    expect(routConsequence(calm, 30, () => 0)).toBe('none');
  });

  it('a hot-tempered foe is at mortal risk (low roll → death), else shame', () => {
    const hot = mkOfficer({ traits: ['wrathful'] as never });
    expect(routConsequence(hot, 40, () => 0)).toBe('death');   // rolled under the chance
    expect(routConsequence(hot, 40, () => 0.99)).toBe('shame'); // rolled over → only shamed
  });

  it('the aged are frail even when even-tempered', () => {
    const old = mkOfficer();
    expect(routConsequence(old, 72, () => 0)).toBe('death');
    expect(routConsequence(old, 72, () => 0.99)).toBe('shame');
  });
});

describe('舌戰 — AI 連辯 (chain setups by tier)', () => {
  it('a master sets up 論→引 off its own last 論 when it can afford 引', () => {
    const me = mkOfficer({ stats: { intelligence: 80, charisma: 70, war: 50, leadership: 60, politics: 60 } });
    const foe = mkOfficer({ stats: { intelligence: 80, charisma: 70, war: 50, leadership: 60, politics: 60 } });
    const bout = initDebate(me, foe, 'peerless');
    // Foe (side 'd') just played 論 and has the 氣勢 for 引.
    const primed: DebateBout = { ...bout, dLastMove: 'assert', dMomentum: 2 };
    const move = aiDebateMove(primed, 'd', () => 0.1); // low roll → takes the chain
    expect(move).toBe('cite');
  });

  it('a 學徒 never plans a chain (falls through to its usual play)', () => {
    const me = mkOfficer({ stats: { intelligence: 80, charisma: 70, war: 50, leadership: 60, politics: 60 } });
    const foe = mkOfficer({ stats: { intelligence: 80, charisma: 70, war: 50, leadership: 60, politics: 60 } });
    const bout = initDebate(me, foe, 'rookie');
    const primed: DebateBout = { ...bout, dLastMove: 'assert', dMomentum: 2 };
    // With every loaded-move roll forced high, a rookie won't spend on a chain.
    const move = aiDebateMove(primed, 'd', seq([0.99, 0.99, 0.99, 0.99, 0.99, 0.99]));
    expect(['assert', 'provoke', 'retort'] as DebateMove[]).toContain(move);
  });
});
