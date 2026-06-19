import { describe, it, expect } from 'vitest';
import { GEO_LABELS } from './mapLabels';
import { geoToPixel, MAP_W, MAP_H } from './geography';

describe('geo labels', () => {
  it('every label projects inside the map', () => {
    for (const g of GEO_LABELS) {
      const [x, y] = geoToPixel(g.lon, g.lat);
      expect(x, g.zh).toBeGreaterThanOrEqual(0);
      expect(x, g.zh).toBeLessThanOrEqual(MAP_W);
      expect(y, g.zh).toBeGreaterThanOrEqual(0);
      expect(y, g.zh).toBeLessThanOrEqual(MAP_H);
    }
  });

  it('has mountains, rivers and seas', () => {
    const kinds = new Set(GEO_LABELS.map((g) => g.kind));
    expect(kinds.has('mountain')).toBe(true);
    expect(kinds.has('river')).toBe(true);
    expect(kinds.has('sea')).toBe(true);
  });
});
