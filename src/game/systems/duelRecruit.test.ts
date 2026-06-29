/** 折服來投 — best-and-spare a wavering foe and he may come over to your side. */
import { describe, it, expect } from 'vitest';
import { duelRecruitChance } from './duelChallenge';
import { mkOfficer } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 60, intelligence: 50, politics: 50, charisma: 60 });

describe('duelRecruitChance', () => {
  const champion = mkOfficer({ id: 'champ', stats: W(95) });

  it('the unswervingly loyal never turn from a single duel', () => {
    expect(duelRecruitChance(mkOfficer({ id: 'a', stats: W(80), loyalty: 20, traits: ['loyal'] }), champion)).toBe(0);
    expect(duelRecruitChance(mkOfficer({ id: 'b', stats: W(80), loyalty: 20, traits: ['principled'] }), champion)).toBe(0);
  });

  it('a wavering foe is far likelier to defect than a content one', () => {
    const wavering = mkOfficer({ id: 'w', stats: W(80), loyalty: 20 });
    const content = mkOfficer({ id: 'c', stats: W(80), loyalty: 90 });
    expect(duelRecruitChance(wavering, champion)).toBeGreaterThan(duelRecruitChance(content, champion));
    expect(duelRecruitChance(content, champion)).toBeLessThan(0.1);
  });

  it('being bested by a far mightier hand, and an ambitious streak, both sway him more', () => {
    const lowLoyal = (traits: string[] = []) => mkOfficer({ id: 'x', stats: W(70), loyalty: 30, traits: traits as never[] });
    const baseChance = duelRecruitChance(lowLoyal(), champion);                 // big prowess gap already
    const ambitious = duelRecruitChance(lowLoyal(['ambitious']), champion);
    expect(ambitious).toBeGreaterThan(baseChance);
    expect(baseChance).toBeGreaterThan(0);
    expect(duelRecruitChance(lowLoyal(), champion)).toBeLessThanOrEqual(0.5); // capped
  });
});
