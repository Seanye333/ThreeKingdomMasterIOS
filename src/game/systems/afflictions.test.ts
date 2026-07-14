import { describe, it, expect } from 'vitest';
import { mkOfficer } from '../../test/factories';
import {
  afflictionDelta, hasAffliction, withAffliction, tickAfflictions,
  duelWound, debateShame, isEmotional,
  rollChronicAilment, cureChronicAilments, hasChronicAilment, chronicAilmentOf,
} from './afflictions';
import { staticProwess } from './duel';
import { debateProwess } from './wordWar';

describe('afflictions', () => {
  it('folds a 養傷 wound into duel prowess and lifts when ticked out', () => {
    const o = mkOfficer({ stats: { war: 90, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });
    const base = staticProwess(o);
    const hurt = withAffliction(o, duelWound(true)); // war −10, 3 seasons
    expect(hasAffliction(hurt, 'wound')).toBe(true);
    expect(afflictionDelta(hurt, 'war')).toBe(-10);
    expect(staticProwess(hurt)).toBe(base - 10);

    let cur = hurt;
    for (let i = 0; i < 3; i++) cur = tickAfflictions(cur);
    expect(hasAffliction(cur, 'wound')).toBe(false);
    expect(staticProwess(cur)).toBe(base);
  });

  it('a 羞憤 shame saps debate prowess (智力 + ½魅力)', () => {
    const o = mkOfficer({ stats: { war: 50, leadership: 60, intelligence: 80, politics: 60, charisma: 70 } });
    const base = debateProwess(o);
    const shamed = withAffliction(o, debateShame()); // int −4, cha −6
    // INT −4 and CHA −6 (×0.5) → −7 to prowess.
    expect(debateProwess(shamed)).toBe(base - 7);
  });

  it('refreshing an affliction keeps the longer duration; isEmotional reads traits', () => {
    const o = mkOfficer({ traits: ['wrathful'] as never });
    expect(isEmotional(o)).toBe(true);
    const a = withAffliction(o, { kind: 'wound', seasons: 1, war: -6 });
    const b = withAffliction(a, { kind: 'wound', seasons: 3, war: -6 });
    expect(b.afflictions?.filter((x) => x.kind === 'wound').length).toBe(1);
    expect(b.afflictions?.find((x) => x.kind === 'wound')?.seasons).toBe(3);
  });
});

describe('宿疾 — chronic ailments from a grievous wound', () => {
  it('never ticks away on its own, and folds into effective stats', () => {
    const o = withAffliction(mkOfficer({ stats: { war: 90, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } }), rollChronicAilment(() => 0));
    expect(hasChronicAilment(o)).toBe(true);
    const ail = chronicAilmentOf(o)!;
    expect(ail.kind).toBe('chronic');
    // The penalty is real (some stat is sapped).
    expect((ail.war ?? 0) + (ail.intelligence ?? 0) + (ail.charisma ?? 0)).toBeLessThan(0);
    // Ten seasons pass — a 宿疾 does not heal itself.
    let ticked = o;
    for (let i = 0; i < 10; i++) ticked = tickAfflictions(ticked);
    expect(hasChronicAilment(ticked)).toBe(true);
  });

  it('洗髓/名醫 purges it — but leaves other afflictions alone', () => {
    let o = withAffliction(mkOfficer({}), rollChronicAilment(() => 0.5));
    o = withAffliction(o, { kind: 'wound', seasons: 2, war: -6 });
    const cured = cureChronicAilments(o);
    expect(hasChronicAilment(cured)).toBe(false);
    expect(hasAffliction(cured, 'wound')).toBe(true); // short-lived wound untouched
  });
});
