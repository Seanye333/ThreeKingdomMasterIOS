/** P0 統一格網 — the canonical flat-top lattice all layers share. */
import { describe, expect, it } from 'vitest';
import {
  hexAt,
  hexCenter,
  hexNeighbors,
  hexDistance,
  snapToHexCenter,
  battleGroundAt,
  HEX_R,
  HEX_COL_SPACING,
  HEX_ROW_SPACING,
  HEX_COLS,
  MAP_W,
} from './geography';
import { cityPixel } from './cityGeo';
import { generateTerrain, battleWindow } from '../systems/battlefieldTerrain';

describe('canonical lattice geometry', () => {
  it('hexAt/hexCenter round-trip for every cell in a patch', () => {
    for (let col = 10; col < 20; col++) {
      for (let row = 10; row < 20; row++) {
        const c = hexCenter(col, row);
        expect(hexAt(c.x, c.y)).toEqual({ col, row });
      }
    }
  });

  it('snapToHexCenter is idempotent and lands on a lattice centre', () => {
    const s = snapToHexCenter(1234.5, 987.6);
    const s2 = snapToHexCenter(s.x, s.y);
    expect(s2).toEqual(s);
    const h = hexAt(s.x, s.y);
    expect(hexCenter(h.col, h.row)).toEqual(s);
  });

  it('every point snaps no farther than one hex radius', () => {
    for (let i = 0; i < 50; i++) {
      const x = (i * 97.3) % MAP_W;
      const y = (i * 131.7) % 3000;
      const s = snapToHexCenter(x, y);
      expect(Math.hypot(x - s.x, y - s.y)).toBeLessThanOrEqual(HEX_R + 1e-6);
    }
  });

  it('neighbours are exactly one cell away and mutually adjacent', () => {
    for (const base of [{ col: 12, row: 8 }, { col: 13, row: 8 }]) { // even + odd col
      const nbs = hexNeighbors(base.col, base.row);
      expect(nbs).toHaveLength(6);
      for (const nb of nbs) {
        expect(hexDistance(base, nb)).toBe(1);
        // centre spacing of true neighbours is uniform on a hex lattice
        const a = hexCenter(base.col, base.row);
        const b = hexCenter(nb.col, nb.row);
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(HEX_ROW_SPACING, 5);
      }
    }
  });

  it('grid density is RTK-XIV-ish (~139 columns across the map)', () => {
    expect(HEX_COLS).toBeGreaterThan(120);
    expect(HEX_COLS).toBeLessThan(160);
    expect(HEX_COL_SPACING * HEX_COLS).toBeGreaterThanOrEqual(MAP_W);
  });
});

describe('cities occupy lattice cells', () => {
  it('cityPixel returns a snapped centre for geo-anchored and fallback cities', () => {
    for (const [id, fx, fy] of [
      ['luoyang', 0, 0],
      ['no-such-city', 2345.6, 1789.1],
    ] as const) {
      const [x, y] = cityPixel(id, fx, fy);
      const s = snapToHexCenter(x, y);
      expect(s.x).toBeCloseTo(x, 6);
      expect(s.y).toBeCloseTo(y, 6);
    }
  });
});

describe('battle board = axis-aligned lattice window (P0 吻合)', () => {
  const W = 18, H = 12;

  it('each battle tile samples the world cell it claims to be', () => {
    const anchorPx = hexCenter(60, 40);
    const geo = { x: anchorPx.x, y: anchorPx.y, bearing: 0, season: 'summer' as const };
    const tiles = generateTerrain('align-test', W, H, { terrain: 'plain' }, undefined, geo);
    // Use the SAME shared window (flip + slide + parity lock) the generator used.
    const win = battleWindow(geo, W, H);
    let checked = 0;
    for (const t of tiles) {
      const wc = win.anchor.col + win.flip * (t.coord.col - win.anchorCol);
      const wr = win.anchor.row + (t.coord.row - win.anchorRow);
      const { x, y } = hexCenter(wc, wr);
      const g = battleGroundAt(x, y);
      // Hard mappings only (rng embellishments and road/entry guarantees skipped):
      if (g === 'mountain' && t.coord.col > 1 && t.coord.col < W - 2) {
        if (t.terrain === 'mountain') checked++;
        expect(['mountain', 'road']).toContain(t.terrain); // road only if on the bearing line
      }
      if ((g === 'river' || g === 'lake' || g === 'sea') && t.coord.col > 1 && t.coord.col < W - 2) {
        expect(['river', 'ice', 'bridge']).toContain(t.terrain);
        checked++;
      }
    }
    // The window must actually contain some hard-mapped features to be a
    // meaningful alignment check — if not, move the anchor in this test.
    expect(checked).toBeGreaterThan(0);
  });

  it('an east-approach board samples the mirrored window (flip, no rotation)', () => {
    const anchorPx = hexCenter(60, 40);
    const geo = { x: anchorPx.x, y: anchorPx.y, bearing: Math.PI }; // attacker from the east
    const east = generateTerrain('flip-test', W, H, { terrain: 'plain' }, undefined, geo);
    const win = battleWindow(geo, W, H);
    expect(win.flip).toBe(-1); // east approach → board +col walks WEST
    let checked = 0;
    for (const t of east) {
      const wc = win.anchor.col + win.flip * (t.coord.col - win.anchorCol);
      const wr = win.anchor.row + (t.coord.row - win.anchorRow);
      const { x, y } = hexCenter(wc, wr);
      const g = battleGroundAt(x, y);
      if (g === 'mountain' && t.coord.col > 1 && t.coord.col < W - 2) {
        expect(['mountain', 'road']).toContain(t.terrain);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
