import { describe, it, expect } from 'vitest';
import { stratagemFxKind, tacticFxKind, FX_COLOR, FX_DURATION, type StratagemFxKind } from './stratagemFx';
import { STRATAGEMS } from './stratagems';

describe('戰法可視化 — stratagem battle FX', () => {
  it('every tactical-battle stratagem has its own cast FX', () => {
    for (const s of STRATAGEMS) {
      const kind = stratagemFxKind(s.id);
      expect(kind, `${s.id} (${s.name.zh}) has no FX kind`).not.toBeNull();
    }
  });

  it('no two stratagems share the same effect (all distinct)', () => {
    const kinds = STRATAGEMS.map((s) => stratagemFxKind(s.id)).filter(Boolean) as StratagemFxKind[];
    expect(new Set(kinds).size, 'FX kinds collide across stratagems').toBe(kinds.length);
  });

  it('every FX kind has a colour and a lifetime', () => {
    for (const s of STRATAGEMS) {
      const kind = stratagemFxKind(s.id);
      if (!kind) continue;
      expect(FX_COLOR[kind], `${kind} missing colour`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(FX_DURATION[kind], `${kind} missing/zero duration`).toBeGreaterThan(0);
    }
  });

  it('unknown ids fall through to null', () => {
    // a strategic-map-only id that has no battle cast FX
    expect(stratagemFxKind('beauty-plot' as never)).toBeNull();
  });
});

describe('戰法可視化 — tacticFxKind (589 tactics route to an effect)', () => {
  it('legendary named tactics get their OWN signature visual, not the underlying', () => {
    // 借東風 routes through fire-attack, but must show 'wind' not 'fire'
    expect(tacticFxKind('borrow-wind', 'fire-attack')).toBe('wind');
    // 八門遁甲 / 空城計 route through precognition, but must NOT both show 'rune'
    expect(tacticFxKind('eight-gates', 'precognition')).toBe('gate');
    expect(tacticFxKind('empty-fort', 'precognition')).toBe('empty');
    expect(tacticFxKind('seven-lamp', 'precognition')).toBe('lamp');
    // 七擒 / 美人計 route through rally / confusion, but get distinct looks
    expect(tacticFxKind('seven-grab', 'rally')).toBe('net');
    expect(tacticFxKind('beauty', 'confusion')).toBe('charm');
    // 五雷 upgrades a single bolt into a barrage
    expect(tacticFxKind('thunder', 'lightning')).toBe('thunderstorm');
  });

  it('an ordinary tactic inherits its underlying stratagem effect', () => {
    expect(tacticFxKind('some-random-tactic', 'charge')).toBe('shockwave');
    expect(tacticFxKind(undefined, 'rain-of-arrows')).toBe('arrows');
  });

  it('every signature FX kind has a colour and a lifetime', () => {
    const SIGNATURES: StratagemFxKind[] = ['wind', 'gate', 'empty', 'lamp', 'net', 'charm', 'thunderstorm'];
    for (const kind of SIGNATURES) {
      expect(FX_COLOR[kind], `${kind} missing colour`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(FX_DURATION[kind], `${kind} missing/zero duration`).toBeGreaterThan(0);
    }
  });
});
