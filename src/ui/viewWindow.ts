// ─── Unified view-window model ──────────────────────────────────────────
// The strategic map, the city map and the battle board are three lenses on
// ONE world. Each is a rectangular window into the strategic coordinate space
// (the 1000×720 board geography.ts defines): a centre, a span, and a rotation.
// Describing all three in the same coordinates lets a shared locator draw
// "you are here", keep a common compass, and (later) drive zoom transitions.

import { MAP_W, MAP_H } from '../game/data/geography';

export interface ViewWindow {
  /** Window centre on the strategic map. */
  cx: number;
  cy: number;
  /** Window size in strategic units (spanX runs along the rotation axis). */
  spanX: number;
  spanY: number;
  /** Rotation in radians; 0 = north-up. */
  rotation: number;
  kind: 'world' | 'city' | 'battle';
}

/** The whole world — what the strategic map shows. */
export const WORLD_WINDOW: ViewWindow = {
  cx: MAP_W / 2, cy: MAP_H / 2, spanX: MAP_W, spanY: MAP_H, rotation: 0, kind: 'world',
};

// Battle board geometry — 18×12 hexes at TILE_PX strategic units per hex
// (kept in sync with battlefieldTerrain.ts).
const BATTLE_TILE_PX = 1.8;
const BATTLE_COLS = 18;
const BATTLE_ROWS = 12;

/** Where a tactical battle sits & how it's oriented on the strategic map. */
export function battleViewWindow(
  b: { geoAnchor?: { x: number; y: number; bearing: number } } | null | undefined,
): ViewWindow | null {
  if (!b?.geoAnchor) return null;
  return {
    cx: b.geoAnchor.x,
    cy: b.geoAnchor.y,
    spanX: BATTLE_COLS * BATTLE_TILE_PX,
    spanY: BATTLE_ROWS * BATTLE_TILE_PX,
    rotation: b.geoAnchor.bearing,
    kind: 'battle',
  };
}

/** Strategic units the city map's hinterland roughly spans (≈ reach × 2). */
export const CITY_VIEW_SPAN = 150;

/** Where a city map sits on the strategic map (north-up). */
export function cityViewWindow(
  city: { coords: { x: number; y: number } },
): ViewWindow {
  return {
    cx: city.coords.x,
    cy: city.coords.y,
    spanX: CITY_VIEW_SPAN,
    spanY: CITY_VIEW_SPAN,
    rotation: 0,
    kind: 'city',
  };
}
