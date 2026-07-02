import type { EntityId } from '../types';
import {
  hexAt,
  hexNeighbors,
  hexCenter,
  isLand,
  HEX_ROW_SPACING,
} from '../data/geography';

/**
 * 塗色 — RTK-XIV-style hex painting. Every column on the road claims the
 * lattice cells it physically walks (plus one ring), overriding the default
 * nearest-city ownership tint on the board. Deviations only: the map keeps
 * a small dictionary of walked cells, not 48k entries.
 *
 * Rules (kept deliberately coarse):
 *  - later boots overwrite earlier paint (no contest resolution);
 *  - paint fades after PAINT_TTL_SEASONS unless re-walked (old campaign
 *    trails grass over);
 *  - a dead force's paint is swept at the next season prune.
 */

export interface HexPaintCell {
  /** The painting force. */
  f: EntityId;
  /** Absolute season stamp (see seasonStampOf) of the last walk. */
  t: number;
}
export type HexPaint = Record<string, HexPaintCell>;

/** 舊轍還草 — paint older than this many seasons reverts. */
export const PAINT_TTL_SEASONS = 4;

const SEASON_IDX: Record<string, number> = { spring: 0, summer: 1, autumn: 2, winter: 3 };

/** Monotonic season counter for TTL math. */
export function seasonStampOf(year: number, season: string): number {
  return year * 4 + (SEASON_IDX[season] ?? 0);
}

export const hexPaintKey = (col: number, row: number): string => `${col},${row}`;

/**
 * Paint the cells under a slice of a march route (arc lengths
 * [sliceStart, sliceEnd] along the polyline) plus one neighbour ring.
 * Mutates `paint` in place — callers hand in their working copy.
 */
export function stampPaintAlongRoute(
  paint: HexPaint,
  route: Array<{ x: number; y: number }>,
  sliceStart: number,
  sliceEnd: number,
  forceId: EntityId,
  seasonStamp: number,
): void {
  if (route.length < 2 || sliceEnd <= sliceStart) return;
  const step = HEX_ROW_SPACING / 2;
  const mark = (col: number, row: number) => {
    const c = hexCenter(col, row);
    if (!isLand(c.x, c.y, 0)) return;
    paint[hexPaintKey(col, row)] = { f: forceId, t: seasonStamp };
  };
  let acc = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i], b = route[i + 1];
    const sl = Math.hypot(b.x - a.x, b.y - a.y);
    if (sl < 1e-6) continue;
    const segStart = acc;
    acc += sl;
    if (acc < sliceStart || segStart > sliceEnd) continue;
    const from = Math.max(sliceStart, segStart);
    const to = Math.min(sliceEnd, acc);
    const n = Math.max(1, Math.ceil((to - from) / step));
    for (let k = 0; k <= n; k++) {
      const arc = from + ((to - from) * k) / n;
      const t = (arc - segStart) / sl;
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;
      const h = hexAt(px, py);
      mark(h.col, h.row);
      for (const nb of hexNeighbors(h.col, h.row)) mark(nb.col, nb.row);
    }
  }
}

/** Paint a disc of cells around a point (camp seizures, city falls). */
export function stampPaintDisc(
  paint: HexPaint,
  x: number,
  y: number,
  radiusCells: number,
  forceId: EntityId,
  seasonStamp: number,
): void {
  const c0 = hexAt(x, y);
  for (let dc = -radiusCells; dc <= radiusCells; dc++) {
    for (let dr = -radiusCells - 1; dr <= radiusCells + 1; dr++) {
      const col = c0.col + dc, row = c0.row + dr;
      const cc = hexCenter(col, row);
      const p0 = hexCenter(c0.col, c0.row);
      if (Math.hypot(cc.x - p0.x, cc.y - p0.y) > radiusCells * HEX_ROW_SPACING + 1) continue;
      if (!isLand(cc.x, cc.y, 0)) continue;
      paint[hexPaintKey(col, row)] = { f: forceId, t: seasonStamp };
    }
  }
}

/**
 * Season prune: TTL-expired trails grass over; dead forces' paint sweeps.
 * Returns the same reference when nothing changed (cheap signature checks).
 */
export function prunePaint(
  paint: HexPaint,
  nowStamp: number,
  livingForceIds: Set<EntityId>,
): HexPaint {
  let changed = false;
  const next: HexPaint = {};
  for (const [k, v] of Object.entries(paint)) {
    if (nowStamp - v.t > PAINT_TTL_SEASONS || !livingForceIds.has(v.f)) {
      changed = true;
      continue;
    }
    next[k] = v;
  }
  return changed ? next : paint;
}
