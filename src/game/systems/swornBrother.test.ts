import { describe, it, expect } from 'vitest';
import {
  areSwornBrothers,
  runtimeSwornPair,
  sidePoolRelationshipBonus,
  loyaltyFloor,
} from './relationshipEffects';
import type { OathBond } from '../data/bonds';
import type { Officer } from '../types';

/** Minimal officer stub — only the fields the relationship helpers read. */
function off(id: string, over: Partial<Officer> = {}): Officer {
  return {
    id,
    status: 'idle',
    forceId: 'cao',
    loyalty: 50,
    ...over,
  } as unknown as Officer;
}

const oath = (a: string, b: string, kind: OathBond['kind'] = 'sibling'): OathBond => ({
  officerA: a, officerB: b, floor: 90, kind, label: `${a}-${b}`,
});

describe('runtime sworn brotherhood', () => {
  it('runtimeSwornPair matches sibling/oath bonds in either direction, ignores other kinds', () => {
    const bonds = [oath('x', 'y', 'sibling'), oath('p', 'q', 'oath'), oath('m', 'n', 'clan')];
    expect(runtimeSwornPair('x', 'y', bonds)).toBe(true);
    expect(runtimeSwornPair('y', 'x', bonds)).toBe(true);
    expect(runtimeSwornPair('p', 'q', bonds)).toBe(true);  // rapport-forged oath counts
    expect(runtimeSwornPair('m', 'n', bonds)).toBe(false); // clan is family, not sworn
    expect(runtimeSwornPair('x', 'q', bonds)).toBe(false);
  });

  it('areSwornBrothers honours a runtime bond on top of static lore', () => {
    expect(areSwornBrothers('nobody-1', 'nobody-2')).toBe(false);
    expect(areSwornBrothers('nobody-1', 'nobody-2', [oath('nobody-1', 'nobody-2')])).toBe(true);
  });

  it('sidePoolRelationshipBonus lifts power + morale for a forged pair', () => {
    const pool = [off('a'), off('b')];
    const base = sidePoolRelationshipBonus(pool, []);
    const bonded = sidePoolRelationshipBonus(pool, [], [oath('a', 'b')]);
    expect(base.powerMul).toBe(1.0);
    expect(base.moraleResist).toBe(0);
    expect(bonded.powerMul).toBeGreaterThan(1.0);
    expect(bonded.moraleResist).toBeGreaterThan(0);
  });

  it('loyaltyFloor returns 90 for a runtime sworn pair alive in the same force', () => {
    const a = off('a', { forceId: 'cao' });
    const b = off('b', { forceId: 'cao' });
    const byId = { a, b };
    expect(loyaltyFloor(a, byId, [])).toBe(0);
    expect(loyaltyFloor(a, byId, [], [oath('a', 'b')])).toBe(90);
  });

  it('loyaltyFloor ignores the bond when the brother is in another force or dead', () => {
    const a = off('a', { forceId: 'cao' });
    const bElsewhere = off('b', { forceId: 'liu-bei' });
    const bDead = off('b', { forceId: 'cao', status: 'dead' });
    expect(loyaltyFloor(a, { a, b: bElsewhere }, [], [oath('a', 'b')])).toBe(0);
    expect(loyaltyFloor(a, { a, b: bDead }, [], [oath('a', 'b')])).toBe(0);
  });
});
