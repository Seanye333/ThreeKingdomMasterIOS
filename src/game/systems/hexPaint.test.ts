/** 塗色 — RTK-XIV hex painting: stamp, disc, TTL prune. */
import { describe, expect, it } from 'vitest';
import { hexCenter, hexAt } from '../data/geography';
import {
  isSupplyConnected,
  stampPaintAlongRoute,
  stampPaintDisc,
  prunePaint,
  seasonStampOf,
  hexPaintKey,
  PAINT_TTL_SEASONS,
  type HexPaint,
} from './hexPaint';

describe('stampPaintAlongRoute', () => {
  it('paints the walked corridor plus a neighbour ring', () => {
    const a = hexCenter(60, 40);
    const b = hexCenter(70, 40);
    const paint: HexPaint = {};
    const total = Math.hypot(b.x - a.x, b.y - a.y);
    stampPaintAlongRoute(paint, [a, b], 0, total, 'wei', 100);
    // The cells on the line are painted…
    expect(paint[hexPaintKey(60, 40)]?.f).toBe('wei');
    expect(paint[hexPaintKey(65, 40)]?.f).toBe('wei');
    expect(paint[hexPaintKey(70, 40)]?.f).toBe('wei');
    // …and the ring around the road makes it more than a 1-cell thread.
    expect(Object.keys(paint).length).toBeGreaterThan(11);
  });

  it('a partial slice paints only that stretch', () => {
    const a = hexCenter(60, 40);
    const b = hexCenter(80, 40);
    const total = Math.hypot(b.x - a.x, b.y - a.y);
    const paint: HexPaint = {};
    stampPaintAlongRoute(paint, [a, b], 0, total * 0.25, 'wu', 100);
    expect(paint[hexPaintKey(62, 40)]?.f).toBe('wu');
    expect(paint[hexPaintKey(78, 40)]).toBeUndefined();
  });

  it('later boots overwrite earlier paint', () => {
    const a = hexCenter(60, 40);
    const b = hexCenter(64, 40);
    const total = Math.hypot(b.x - a.x, b.y - a.y);
    const paint: HexPaint = {};
    stampPaintAlongRoute(paint, [a, b], 0, total, 'wei', 100);
    stampPaintAlongRoute(paint, [a, b], 0, total, 'shu', 101);
    expect(paint[hexPaintKey(62, 40)]?.f).toBe('shu');
  });
});

describe('stampPaintDisc', () => {
  it('paints a filled disc of cells', () => {
    const c = hexCenter(60, 40);
    const paint: HexPaint = {};
    stampPaintDisc(paint, c.x, c.y, 3, 'wu', 50);
    expect(paint[hexPaintKey(60, 40)]?.f).toBe('wu');
    expect(Object.keys(paint).length).toBeGreaterThan(20);
  });
});

describe('prunePaint', () => {
  const living = new Set(['wei', 'wu']);
  it('TTL-expired trails grass over; fresh paint stays', () => {
    const paint: HexPaint = {
      old: { f: 'wei', t: 100 },
      fresh: { f: 'wei', t: 104 },
    };
    const out = prunePaint(paint, 100 + PAINT_TTL_SEASONS + 1, living);
    expect(out.old).toBeUndefined();
    expect(out.fresh).toBeDefined();
  });
  it("a dead force's paint sweeps", () => {
    const paint: HexPaint = { a: { f: 'dong-zhuo', t: 100 } };
    expect(prunePaint(paint, 100, living).a).toBeUndefined();
  });
  it('returns the same reference when nothing changed', () => {
    const paint: HexPaint = { a: { f: 'wei', t: 100 } };
    expect(prunePaint(paint, 101, living)).toBe(paint);
  });
});

describe('seasonStampOf', () => {
  it('is monotonic across seasons and years', () => {
    expect(seasonStampOf(200, 'summer')).toBeGreaterThan(seasonStampOf(200, 'spring'));
    expect(seasonStampOf(201, 'spring')).toBeGreaterThan(seasonStampOf(200, 'winter'));
  });
});

describe('isSupplyConnected(補給線)', () => {
  const cells = (pairs: Array<[number, number]>, f = 'wei', t = 100): HexPaint =>
    Object.fromEntries(pairs.map(([c, r]) => [hexPaintKey(c, r), { f, t }]));

  it('an unbroken trail back to a friendly city is supplied', () => {
    const a = hexCenter(60, 40);
    const b = hexCenter(70, 40);
    const paint: HexPaint = {};
    stampPaintAlongRoute(paint, [a, b], 0, Math.hypot(b.x - a.x, b.y - a.y), 'wei', 100);
    expect(isSupplyConnected(paint, 'wei', { col: 70, row: 40 }, [{ col: 60, row: 40 }])).toBe(true);
  });

  it('a repainted gap cuts the corridor', () => {
    const paint = cells([[60, 40], [61, 40], [62, 40], [63, 40], [64, 40]]);
    paint[hexPaintKey(62, 40)] = { f: 'shu', t: 101 }; // enemy boots on the road
    expect(isSupplyConnected(paint, 'wei', { col: 64, row: 40 }, [{ col: 59, row: 40 }])).toBe(false);
  });

  it('standing next to your own city never starves', () => {
    expect(isSupplyConnected({}, 'wei', { col: 60, row: 40 }, [{ col: 61, row: 41 }])).toBe(true);
  });
});
