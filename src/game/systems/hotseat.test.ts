import { describe, expect, it } from 'vitest';
import { isHotseat, isHumanForce, pruneSeats, seatNumber, isPvpBattle, forceOfSide } from './hotseat';
import type { HotseatConfig } from './hotseat';

/**
 * 熱座 — the seat rotation. The design decision these tests protect is that
 * `playerForceId` stays a single id and simply moves; the only plural fact is
 * WHICH forces are human, and that exists so the AI does not play someone's
 * turn for them while they are waiting for the device.
 */

const cfg = (forceIds: string[], index = 0): HotseatConfig => ({ forceIds, index });

describe('isHotseat / isHumanForce', () => {
  it('a single seat is ordinary play', () => {
    expect(isHotseat(cfg(['A']))).toBe(false);
    expect(isHotseat(cfg([]))).toBe(false);
    expect(isHotseat(null)).toBe(false);
    expect(isHotseat(cfg(['A', 'B']))).toBe(true);
  });

  it('falls back to the lone player when no hotseat is configured', () => {
    expect(isHumanForce('A', null, 'A')).toBe(true);
    expect(isHumanForce('B', null, 'A')).toBe(false);
    expect(isHumanForce('A', cfg([]), 'A')).toBe(true);
  });

  /** The bug this whole field exists to prevent. */
  it('treats EVERY seated force as human, not just the one at the keyboard', () => {
    const c = cfg(['A', 'B'], 0);   // A is playing; B is waiting
    expect(isHumanForce('A', c, 'A')).toBe(true);
    expect(isHumanForce('B', c, 'A'), 'the waiting player must not be AI-played').toBe(true);
    expect(isHumanForce('C', c, 'A')).toBe(false);
  });

  it('is false for an unowned city or a vanished force', () => {
    expect(isHumanForce(null, cfg(['A']), 'A')).toBe(false);
    expect(isHumanForce(undefined, cfg(['A']), 'A')).toBe(false);
  });
});

describe('pruneSeats — someone got conquered', () => {
  it('drops a dead force and keeps the current player in their chair', () => {
    const out = pruneSeats(cfg(['A', 'B', 'C'], 2), ['A', 'C']);
    expect(out.forceIds).toEqual(['A', 'C']);
    expect(out.forceIds[out.index]).toBe('C');
  });

  it('falls back to the first seat when the current player is the one lost', () => {
    const out = pruneSeats(cfg(['A', 'B'], 1), ['A']);
    expect(out.forceIds).toEqual(['A']);
    expect(out.index).toBe(0);
  });

  it('returns the same object when nothing changed, so state stays stable', () => {
    const c = cfg(['A', 'B'], 1);
    expect(pruneSeats(c, ['A', 'B'])).toBe(c);
  });

  it('handles everyone being gone', () => {
    expect(pruneSeats(cfg(['A'], 0), [])).toEqual({ forceIds: [], index: 0 });
  });

  it('accepts a Set as well as a list', () => {
    expect(pruneSeats(cfg(['A', 'B'], 0), new Set(['A'])).forceIds).toEqual(['A']);
  });
});

describe('seatNumber', () => {
  it('counts chairs the way people do', () => {
    expect(seatNumber(cfg(['A', 'B'], 0))).toBe(1);
    expect(seatNumber(cfg(['A', 'B'], 1))).toBe(2);
  });
});

describe('isPvpBattle / forceOfSide — a battle between two seated players', () => {
  it('is true only when BOTH sides are seated', () => {
    expect(isPvpBattle('A', 'B', ['A', 'B'])).toBe(true);
    expect(isPvpBattle('A', 'C', ['A', 'B'])).toBe(false);
    expect(isPvpBattle('C', 'D', ['A', 'B'])).toBe(false);
  });

  it('is false in an ordinary solo game, whatever the sides', () => {
    expect(isPvpBattle('A', 'B', ['A'])).toBe(false);
    expect(isPvpBattle('A', 'B', [])).toBe(false);
    expect(isPvpBattle('A', 'B', undefined)).toBe(false);
  });

  it('tolerates a battle with a side missing', () => {
    expect(isPvpBattle(null, 'B', ['A', 'B'])).toBe(false);
    expect(isPvpBattle('A', undefined, ['A', 'B'])).toBe(false);
  });

  it('names the force holding each side', () => {
    expect(forceOfSide('attacker', 'A', 'B')).toBe('A');
    expect(forceOfSide('defender', 'A', 'B')).toBe('B');
    expect(forceOfSide('defender', 'A', null)).toBeNull();
  });
});
