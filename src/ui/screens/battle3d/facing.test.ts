import { describe, expect, it } from 'vitest';
import { facingRotationY, hitArc, ARC_MUL } from './facing';
import { hexDirection, hexNeighbours } from '../../../game/systems/tactical';

/**
 * 向背 — the arcs the player sees must be the arcs the combat model charges
 * for. `hitArc` duplicates tactical.ts's `dirGap` reckoning (gap 3 = rear,
 * gap 2 = flank), and a drift between the two would be worse than showing
 * nothing: the shield on screen would promise a multiplier the engine does
 * not apply.
 */
describe('facing → world rotation', () => {
  it('maps the six hex directions to six distinct bearings, 60° apart', () => {
    for (const coord of [{ col: 4, row: 4 }, { col: 5, row: 4 }]) {   // both parities
      const deg = [0, 1, 2, 3, 4, 5]
        .map((d) => (facingRotationY(coord, d) * 180) / Math.PI)
        .map((v) => Math.round(v * 10) / 10);
      expect(new Set(deg).size, `col ${coord.col}: distinct`).toBe(6);
      const sorted = [...deg].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        expect(Math.round(sorted[i] - sorted[i - 1]), `col ${coord.col}: even spread`).toBe(60);
      }
    }
  });

  it('returns a neutral rotation when facing is unset', () => {
    expect(facingRotationY({ col: 3, row: 3 }, undefined)).toBe(0);
  });

  it('normalises out-of-range and negative facings', () => {
    const at = { col: 4, row: 4 };
    expect(facingRotationY(at, 6)).toBe(facingRotationY(at, 0));
    expect(facingRotationY(at, -1)).toBe(facingRotationY(at, 5));
  });
});

describe('hitArc — mirrors the engine reckoning', () => {
  const at = { col: 4, row: 4 };
  const byDir = new Map<number, { col: number; row: number }>();
  for (const n of hexNeighbours(at)) byDir.set(hexDirection(at, n), n);

  it('classifies front / flank / rear for every facing', () => {
    for (let f = 0; f < 6; f++) {
      const def = { coord: at, facing: f };
      expect(hitArc(def, byDir.get(f)!), `facing ${f} front`).toBe('front');
      expect(hitArc(def, byDir.get((f + 3) % 6)!), `facing ${f} rear`).toBe('rear');
      expect(hitArc(def, byDir.get((f + 2) % 6)!), `facing ${f} flank`).toBe('flank');
      expect(hitArc(def, byDir.get((f + 4) % 6)!), `facing ${f} flank (other side)`).toBe('flank');
      // gap 1 is still the braced front arc, per tactical.ts.
      expect(hitArc(def, byDir.get((f + 1) % 6)!), `facing ${f} near-front`).toBe('front');
    }
  });

  it('says unknown — never front — when the defender has no facing', () => {
    expect(hitArc({ coord: at }, byDir.get(0)!)).toBe('unknown');
    expect(ARC_MUL.unknown, 'unknown must not promise a bonus').toBe(1.0);
  });

  it('carries the multipliers the engine applies', () => {
    expect(ARC_MUL.rear).toBe(1.25);
    expect(ARC_MUL.flank).toBe(1.12);
    expect(ARC_MUL.front).toBe(1.0);
  });
});
