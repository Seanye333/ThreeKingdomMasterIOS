/* ─── Hex world-coord math (flat-top, odd-col offset) ────────────────────
 * Same offset-coord system the 2D screen uses, just mapped into 3D world
 * units (radius = 1). Y is height (up). Z replaces 2D row axis. Split out
 * of TacticalBattleScreen3D.tsx as the leaf module every battle-3D file
 * (units, terrain, dioramas) can share without cycles. */
import type { TerrainKind } from '../../../game/types';

const R = 1;
const COL_STEP = 1.5 * R;
const ROW_STEP = Math.sqrt(3) * R;

export function hexWorld(col: number, row: number): [number, number] {
  const x = col * COL_STEP;
  const z = row * ROW_STEP + (col & 1 ? ROW_STEP / 2 : 0);
  return [x, z];
}

export const HEX_R = R;
export const HEX_COL_STEP = COL_STEP;
export const HEX_ROW_STEP = ROW_STEP;

export const TERRAIN_HEIGHT: Record<TerrainKind, number> = {
  river:    -0.08,
  ice:       0.02,
  road:      0.04,
  plain:     0.10,
  forest:    0.14,
  mountain:  0.18,
  hill:       0.16,
  marsh:      -0.05,
  shallows:   -0.04,  // 淺灘 — water, but you can see the bottom
  reeds:      -0.02,  // 蘆葦蕩 — reed banks standing out of the shallows
  desert:     0.09,   // flat open sand
  chokepoint: 0.04,
  bridge:     0.06,
  gate:       0.20,
  wall:       0.32,
  watchtower: 0.20,
  fieldworks: 0.13,   // packed earth bank
};
export const TERRAIN_COLOR: Record<TerrainKind, string> = {
  river:    '#2c5882',
  ice:      '#b8d8e8',
  road:     '#7a6038',
  plain:    '#4a5e30',
  forest:   '#2a4220',
  mountain: '#5a4838',
  hill:       '#6a5a3a',  // tawny earth
  marsh:      '#3a4838',  // boggy green
  shallows:   '#5a86a0',  // 淺灘 — pale silty water over a sand bar
  reeds:      '#5e7a4a',  // 蘆葦蕩 — green reed thicket on the water
  desert:     '#c9b079',  // sand / gobi
  chokepoint: '#5a4530',  // narrow defile (darker road)
  bridge:     '#8a6840',  // timber
  gate:       '#4a2820',  // dark masonry
  wall:       '#6a5650',  // grey rampart stone
  watchtower: '#8a7050',  // stone platform
  fieldworks: '#7a5f3c',  // fresh-dug earth + timber stakes
};
