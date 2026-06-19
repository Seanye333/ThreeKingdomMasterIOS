/** 舌戰 — locks the counter cycle, damage scaling and the 罵死. */
import { describe, expect, it } from 'vitest';
import { mkOfficer } from '../../test/factories';
import { createDebate, eloquence, pickAiCard, playRound } from './debate';

const sage = mkOfficer({ id: 'kongming', name: { zh: '諸葛亮', en: 'Kongming' }, stats: { intelligence: 100, charisma: 92 } });
const brute = mkOfficer({ id: 'wanglang', name: { zh: '王朗', en: 'Wang Lang' }, stats: { intelligence: 70, charisma: 60 }, traits: ['arrogant'] as never });

const fixed = (v: number) => () => v;

describe('playRound', () => {
  it('counters multiply, walking into one halves', () => {
    // righteous beats taunt: a counters b.
    const s1 = playRound(createDebate(sage, brute), 'righteous', 'taunt', fixed(0.5));
    const dmgToB = 100 - s1.b.composure;
    const dmgToA = 100 - s1.a.composure;
    expect(dmgToB).toBeGreaterThan(dmgToA * 2); // counter + eloquence edge
  });

  it('higher eloquence hits harder', () => {
    expect(eloquence(sage)).toBeGreaterThan(eloquence(brute));
  });

  it('a hot-blooded loser driven deep below zero collapses — 罵死', () => {
    let s = createDebate(sage, brute);
    // Hammer the counter every round until it ends.
    for (let i = 0; i < 12 && !s.winner; i++) {
      s = playRound(s, 'righteous', 'taunt', fixed(0.99));
    }
    expect(s.winner).toBe('a');
    expect(s.collapse).toBe(true);
    expect(s.log.join('')).toContain('罵倒');
  });

  it('the AI counters a repeated card when sharp enough', () => {
    const s = createDebate(brute, sage); // b = sage INT 100 → p=0.5 at rng 0.4
    expect(pickAiCard(s, 'righteous', fixed(0.4))).toBe('sophistry'); // sophistry counters righteous
  });
});
