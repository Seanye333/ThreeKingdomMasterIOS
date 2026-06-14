import { describe, it, expect } from 'vitest';
import { stratagemFxKind, tacticFxKind, tacticFxSpec, FX_COLOR, FX_DURATION, type StratagemFxKind } from './stratagemFx';
import { STRATAGEMS } from './stratagems';
import { TACTIC_DEFS, categoryOfTactic } from './officerAttributes';

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

describe('戰法可視化 — tacticFxKind (legendary signatures)', () => {
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

  it('a themeless tactic still gets a deterministic, valid effect', () => {
    const k = tacticFxKind('qqxx-none', 'charge');
    expect(k, 'a themeless tactic must still resolve to some effect').not.toBeNull();
    expect(tacticFxKind('qqxx-none', 'charge'), 'must be pure/stable').toBe(k);
    // a plain stratagem button (no tacticId) keeps the stratagem's canonical effect
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

describe('戰法可視化 — all 589 戰法 are visualised and pairwise distinct', () => {
  const ALL = Object.keys(TACTIC_DEFS);

  it('there really are ~589 named 戰法', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(580);
  });

  it('every single 戰法 resolves to a renderable spec (no blanks)', () => {
    for (const id of ALL) {
      const spec = tacticFxSpec(id, 'charge', categoryOfTactic);
      expect(spec, `${id} produced no FX spec`).not.toBeNull();
      expect(FX_COLOR[spec!.kind], `${id} → ${spec!.kind} has no base colour`).toBeTruthy();
      expect(FX_DURATION[spec!.kind], `${id} → ${spec!.kind} has no lifetime`).toBeGreaterThan(0);
      expect(spec!.color, `${id} colour malformed`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('no two 戰法 share the exact same effect (kind+colour+motion all considered)', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const id of ALL) {
      const s = tacticFxSpec(id, 'charge', categoryOfTactic)!;
      const sig = `${s.kind}|${s.color}|${s.variant}|${s.spin.toFixed(2)}|${s.scale.toFixed(2)}|${s.density.toFixed(2)}`;
      if (seen.has(sig)) collisions.push(`${id} ≡ ${seen.get(sig)} (${sig})`);
      else seen.set(sig, id);
    }
    expect(collisions, `戰法 sharing an identical effect:\n${collisions.join('\n')}`).toEqual([]);
  });

  it('the spec is pure — same id always yields the same look', () => {
    for (const id of ['guan-yu-pardon', 'fire-attack', 'heavy-cav', 'gu-poison']) {
      expect(tacticFxSpec(id, 'charge', categoryOfTactic)).toEqual(tacticFxSpec(id, 'charge', categoryOfTactic));
    }
  });
});
