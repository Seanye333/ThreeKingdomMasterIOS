import { describe, expect, it } from 'vitest';
import { STATUS_BADGE, plateBadges } from './statusBadges';
import type { TacticalStatus } from '../../../game/types';

/**
 * Every tactical status must have a badge, or it silently vanishes from the
 * board again — which is the bug this table was written to fix. A new status
 * added to TacticalStatus without an entry here fails the first test by
 * construction, because Record<TacticalStatus['kind'], …> is exhaustive.
 */
const ALL_KINDS: Array<TacticalStatus['kind']> = [
  'burning', 'confused', 'defending', 'chained',
  'revealed', 'demoralized', 'starving', 'disorder', 'feign-rout',
];

const eff = (kind: TacticalStatus['kind'], turnsLeft = 2) =>
  ({ kind, turnsLeft, ...(kind === 'chained' ? { chainedWith: [] } : {}) }) as TacticalStatus;

describe('狀態徽記 STATUS_BADGE', () => {
  it('covers every status, bilingually, with a glyph and a tip', () => {
    for (const kind of ALL_KINDS) {
      const b = STATUS_BADGE[kind];
      expect(b, `${kind} missing`).toBeDefined();
      expect(b.glyph.length, `${kind} glyph`).toBeGreaterThan(0);
      expect(b.zh.length, `${kind} zh`).toBeGreaterThan(0);
      expect(b.en.length, `${kind} en`).toBeGreaterThan(0);
      expect(b.tipZh.length, `${kind} tipZh`).toBeGreaterThan(0);
      expect(b.tipEn.length, `${kind} tipEn`).toBeGreaterThan(0);
      expect(b.color, `${kind} colour`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('gives each status its own glyph, so the plate is unambiguous', () => {
    const glyphs = ALL_KINDS.map((k) => STATUS_BADGE[k].glyph);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });
});

describe('plateBadges — what fits on a nameplate', () => {
  it('puts the most consequential status first', () => {
    // Burning outranks defending; disorder outranks demoralized.
    expect(plateBadges([eff('defending'), eff('burning')])[0].zh).toBe('燃燒');
    expect(plateBadges([eff('demoralized'), eff('disorder')])[0].zh).toBe('陷亂');
  });

  it('caps the plate so a wide status list cannot crowd out the troop count', () => {
    const many = ALL_KINDS.map((k) => eff(k));
    expect(plateBadges(many).length).toBeLessThanOrEqual(3);
    expect(plateBadges(many, 2).length).toBe(2);
  });

  it('omits the two that are already drawn elsewhere on the board', () => {
    // Chained fleets draw a link line; a revealed ambush has its own burst.
    expect(plateBadges([eff('chained')])).toEqual([]);
    expect(plateBadges([eff('revealed')])).toEqual([]);
  });

  it('returns nothing for a clean unit', () => {
    expect(plateBadges([])).toEqual([]);
  });

  it('never repeats a badge when a status is somehow doubled', () => {
    const out = plateBadges([eff('burning'), eff('burning')]);
    expect(out.length).toBe(1);
  });
});
