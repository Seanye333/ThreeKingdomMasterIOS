import { describe, expect, it } from 'vitest';
import { STATUS_BADGE, plateBadges, derivedBadges, FATIGUE_BADGE_AT, VALIANT_ROUTS, terrainBadge } from './statusBadges';
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

describe('derivedBadges — state that lives outside `effects`', () => {
  it('flags charge momentum only where a charge can actually land', () => {
    const cav = { unitType: 'cavalry', charge: { dist: 3 } };
    expect(derivedBadges(cav)[0].zh).toBe('衝鋒勢');
    // One hex is not a charge (the engine wants dist ≥ 2).
    expect(derivedBadges({ unitType: 'cavalry', charge: { dist: 1 } })).toEqual([]);
    // Siege and navy get no charge bonus, so they must not claim one.
    expect(derivedBadges({ unitType: 'siege', charge: { dist: 4 } })).toEqual([]);
    expect(derivedBadges({ unitType: 'navy', charge: { dist: 4 } })).toEqual([]);
  });

  it('flags an empty quiver, and only for units that carry one', () => {
    expect(derivedBadges({ unitType: 'archers', ammo: 0, maxAmmo: 3 })[0].zh).toBe('矢盡');
    expect(derivedBadges({ unitType: 'archers', ammo: 2, maxAmmo: 3 })).toEqual([]);
    // Infantry have no maxAmmo at all — never show the badge.
    expect(derivedBadges({ unitType: 'infantry' })).toEqual([]);
  });

  it('flags fatigue at the threshold and quotes the real penalty', () => {
    expect(derivedBadges({ unitType: 'infantry', fatigue: FATIGUE_BADGE_AT - 1 })).toEqual([]);
    const spent = derivedBadges({ unitType: 'infantry', fatigue: 333 })[0];
    expect(spent.zh).toBe('疲憊');
    // freshMul caps the loss at 30%, so the tip must not promise more.
    expect(spent.tipZh).toContain('30%');
  });

  /**
   * `kills` counts enemy UNITS routed (+1 per rout), NOT men — it tops out in
   * the low tens. A men-scaled threshold would never fire, which is exactly
   * the bug the first version of this badge shipped with.
   */
  it('honours a unit by routs, or by felling more men than it fields', () => {
    expect(derivedBadges({ unitType: 'infantry', kills: VALIANT_ROUTS })[0].zh).toBe('驍勇');
    expect(derivedBadges({ unitType: 'infantry', kills: VALIANT_ROUTS - 1 })).toEqual([]);
    // Out-fought on troops alone, without routing anything.
    const heavy = derivedBadges({ unitType: 'infantry', damageDealt: 6000, maxTroops: 5000 });
    expect(heavy[0].zh).toBe('驍勇');
    expect(heavy[0].tipZh).toContain('逾本部之數');
    // Below both bars.
    expect(derivedBadges({ unitType: 'infantry', damageDealt: 100, maxTroops: 5000 })).toEqual([]);
  });

  it('never scales the rout count against troop numbers', () => {
    // 3 routs is a lot; 3 men-worth of damage is nothing. The badge must fire
    // on the former and not depend on maxTroops to do it.
    expect(derivedBadges({ unitType: 'infantry', kills: 3 }).length).toBe(1);
  });

  it('can show several at once without collision', () => {
    const out = derivedBadges({
      unitType: 'archers', charge: { dist: 2 }, ammo: 0, maxAmmo: 2, fatigue: 300, kills: 2,
    });
    expect(out.map((b) => b.zh)).toEqual(['衝鋒勢', '矢盡', '驍勇', '疲憊']);
    expect(new Set(out.map((b) => b.glyph)).size).toBe(4);
  });
});

/**
 * 地利 — high ground is a real per-arm mechanic (archers on a hill ×1.25,
 * cavalry ×1.30, defender ×0.9). The badge is fed the engine's own numbers, so
 * these tests are about WHEN it speaks, not about the values themselves.
 */
describe('terrainBadge', () => {
  const T = ['丘陵', 'Hill'] as const;
  it('flags a commanding position', () => {
    const b = terrainBadge(1.25, 0.9, ...T)!;
    expect(b.zh).toBe('得地利');
    expect(b.tipZh).toContain('攻 ×1.25');
    expect(b.tipZh).toContain('受擊 ×0.90');
  });

  it('flags ground that is bad for this arm', () => {
    // Cavalry in a marsh: ×0.4.
    const b = terrainBadge(0.4, 1.0, '沼澤', 'Marsh')!;
    expect(b.zh).toBe('地形不利');
    expect(b.tipZh).toContain('×0.40');
  });

  it('stays quiet on ordinary ground', () => {
    expect(terrainBadge(1.0, 1.0, '平原', 'Plain')).toBeNull();
    // A trivial edge isn't worth a glyph.
    expect(terrainBadge(1.05, 0.98, '道路', 'Road')).toBeNull();
  });

  it('speaks when only one side of the ledger is strong', () => {
    expect(terrainBadge(1.0, 0.85, ...T)?.zh).toBe('得地利');   // defence only
    expect(terrainBadge(1.3, 1.0, ...T)?.zh).toBe('得地利');    // attack only
  });
});
