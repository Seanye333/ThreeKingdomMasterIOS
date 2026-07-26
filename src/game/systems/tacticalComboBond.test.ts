import { describe, it, expect } from 'vitest';
import { comboBondMul, comboBondLabel, areBonded, COMBO_MUL } from './tactical';
import type { OathBond } from '../data/bonds';
import type { FamilyRelation } from '../types/family';

/**
 * 連携合擊 — the battlefield combo used to consult ONE hard-coded list of eleven
 * canonical pairs, while `teamDuel` and the duel modal both already widened it
 * with `areSwornBrothers`. So an oath the player swore in-game counted in a duel
 * and not in a battle. These tests pin the widened contract, and in particular
 * the two orderings that are easy to get backwards: a feud beats every other
 * tie, and a canonical pair must not get *weaker* than it was before.
 */

const oath = (a: string, b: string, depth: 1 | 2 | 3): OathBond =>
  ({ officerA: a, officerB: b, floor: 70, kind: 'oath', label: '結拜', depth });
const feud = (a: string, b: string): OathBond =>
  ({ officerA: a, officerB: b, floor: 0, kind: 'feud', label: '宿怨', depth: 2 });
const spouse = (a: string, b: string): FamilyRelation =>
  ({ officerA: a, officerB: b, kind: 'spouse' } as FamilyRelation);

describe('連携合擊 — comboBondMul', () => {
  it('two strangers get nothing', () => {
    expect(comboBondMul('nobody-a', 'nobody-b')).toBe(1.0);
    expect(comboBondLabel('nobody-a', 'nobody-b')).toBeNull();
  });

  it('the canonical pairs keep exactly the bonus they had (no balance drift)', () => {
    expect(areBonded('liu-bei', 'guan-yu')).toBe(true);
    expect(comboBondMul('liu-bei', 'guan-yu')).toBe(1.3);
    expect(comboBondMul('guan-yu', 'liu-bei')).toBe(1.3); // symmetric
  });

  it('an oath sworn IN GAME now counts — this is the whole point', () => {
    const bonds = [oath('made-up-a', 'made-up-b', 1)];
    expect(comboBondMul('made-up-a', 'made-up-b')).toBe(1.0);          // without the bond list
    expect(comboBondMul('made-up-a', 'made-up-b', bonds)).toBe(COMBO_MUL.sworn[0]);
  });

  it('the bonus deepens as the oath does (義交 → 金蘭 → 生死之交)', () => {
    const at = (d: 1 | 2 | 3) => comboBondMul('x', 'y', [oath('x', 'y', d)]);
    expect(at(1)).toBe(1.15);
    expect(at(2)).toBe(1.25);
    expect(at(3)).toBe(1.35);
    expect(at(1)).toBeLessThan(at(2));
    expect(at(2)).toBeLessThan(at(3));
    expect(comboBondLabel('x', 'y', [oath('x', 'y', 3)])?.zh).toBe('生死之交');
  });

  it('blood and marriage count, but less than an oath', () => {
    const fam = [spouse('h', 'w')];
    expect(comboBondMul('h', 'w', [], fam)).toBe(COMBO_MUL.family);
    expect(COMBO_MUL.family).toBeLessThan(COMBO_MUL.sworn[1]);
    expect(comboBondLabel('h', 'w', [], fam)?.zh).toBe('骨肉同陣');
  });

  it('a feud cancels the combo outright, whatever else ties them', () => {
    // Same pair, sworn AND feuding: they will not fight as one.
    const bonds = [oath('p', 'q', 3), feud('p', 'q')];
    expect(comboBondMul('p', 'q', bonds)).toBe(1.0);
    expect(comboBondLabel('p', 'q', bonds)).toBeNull();
    // Even a canonical pair, if the game has driven a feud between them.
    expect(comboBondMul('liu-bei', 'guan-yu', [feud('liu-bei', 'guan-yu')])).toBe(1.0);
  });

  it('a bond between OTHER officers does not leak onto this pair', () => {
    expect(comboBondMul('a', 'b', [oath('c', 'd', 3)])).toBe(1.0);
  });
});
