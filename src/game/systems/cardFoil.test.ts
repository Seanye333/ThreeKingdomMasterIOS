import { describe, it, expect } from 'vitest';
import { rollFoil, foilMeta, FOIL_META } from './cardFoil';

describe('開包閃度 — foil rolls', () => {
  it('maps the roll onto the tier bands', () => {
    expect(rollFoil(() => 0.00)).toBe('rainbow'); // <0.03
    expect(rollFoil(() => 0.10)).toBe('gold');     // <0.15
    expect(rollFoil(() => 0.30)).toBe('silver');   // <0.45
    expect(rollFoil(() => 0.90)).toBe('plain');    // else
  });

  it('覺醒 guarantees gold or better', () => {
    expect(rollFoil(() => 0.10, { minGold: true })).toBe('rainbow'); // <0.25
    expect(rollFoil(() => 0.90, { minGold: true })).toBe('gold');
    // never plain under minGold, across the whole roll range
    for (let r = 0; r < 1; r += 0.05) {
      expect(rollFoil(() => r, { minGold: true })).not.toBe('plain');
    }
  });

  it('foilMeta is null for plain/undefined, set for shiny tiers', () => {
    expect(foilMeta(undefined)).toBeNull();
    expect(foilMeta('plain')).toBeNull();
    expect(foilMeta('gold')).toBe(FOIL_META.gold);
    expect(foilMeta('rainbow')).toBe(FOIL_META.rainbow);
  });
});
