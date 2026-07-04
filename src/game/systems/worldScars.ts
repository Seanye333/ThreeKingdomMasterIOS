import type { TacticalBattle } from '../types';
import { battleWindow, type BattleGeo } from './battlefieldTerrain';

/**
 * 戰場烙印 — battles carve lasting marks into the WORLD hex lattice.
 *
 * The tactical board is a 1:1 window of the strategic lattice
 * (battleWindow), so a forest torched mid-battle or a bridge dropped into
 * the river maps back to a real world hex. Those hexes stay scarred for a
 * few seasons: the strategic map shows charred ground, and any NEW battle
 * fought over the same window inherits the scar (the wood is already gone,
 * the crossing already cut) — see generateRealTerrain's scars parameter.
 *
 * Storage follows hexPaint's conventions: a small dictionary of deviations
 * keyed "col,row", season-stamped, pruned at season boundaries.
 */

export type WorldScarKind = 'scorched' | 'bridge-broken';

export interface WorldScar {
  kind: WorldScarKind;
  /** Absolute season stamp (seasonStampOf) when the scar was carved. */
  t: number;
}

export type WorldScars = Record<string, WorldScar>;

/** How many seasons each scar lasts before the land heals. */
export const SCAR_TTL: Record<WorldScarKind, number> = {
  scorched: 8,        // a torched wood takes two years to green over
  'bridge-broken': 4, // a dropped span is rebuilt within a year
};

export const worldScarKey = (col: number, row: number): string => `${col},${row}`;

/**
 * Map a finished battle's in-board terrainScars back to WORLD hexes via its
 * geoAnchor + the shared battleWindow. Drills (practice) leave no scars.
 */
export function scarsFromBattle(b: TacticalBattle, seasonStamp: number): WorldScars {
  if (!b.terrainScars?.length || !b.geoAnchor || b.practice) return {};
  const geo: BattleGeo = {
    x: b.geoAnchor.x, y: b.geoAnchor.y,
    bearing: b.geoAnchor.bearing, anchorCol: b.geoAnchor.anchorCol,
  };
  const { anchorCol, anchorRow, flip, anchor } = battleWindow(geo, b.width, b.height);
  const out: WorldScars = {};
  for (const s of b.terrainScars) {
    const wc = anchor.col + flip * (s.coord.col - anchorCol);
    const wr = anchor.row + (s.coord.row - anchorRow);
    out[worldScarKey(wc, wr)] = {
      kind: s.kind === 'burned-forest' ? 'scorched' : 'bridge-broken',
      t: seasonStamp,
    };
  }
  return out;
}

/**
 * Season prune — TTL-expired scars heal (forest regrows, spans are
 * rebuilt). Returns the same reference when nothing changed.
 */
export function pruneScars(scars: WorldScars, nowStamp: number): WorldScars {
  let changed = false;
  const next: WorldScars = {};
  for (const [k, v] of Object.entries(scars)) {
    if (nowStamp - v.t > SCAR_TTL[v.kind]) { changed = true; continue; }
    next[k] = v;
  }
  return changed ? next : scars;
}
