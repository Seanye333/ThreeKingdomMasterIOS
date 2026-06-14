import { describe, it, expect } from 'vitest';
import { stratagemFxKind, FX_COLOR, FX_DURATION, type StratagemFxKind } from './stratagemFx';
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
