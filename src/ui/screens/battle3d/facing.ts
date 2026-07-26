import type { HexCoord } from '../../../game/types';
import { hexDirection, hexNeighbours } from '../../../game/systems/tactical';
import { hexWorld } from './battleGrid';

/**
 * 朝向 — turning a unit's hex `facing` (0..5) into a world-space rotation, and
 * naming which arc an attack would come from.
 *
 * `facing` has been load-bearing in combat for a long time — a hit from the
 * rear is ×1.25, from a flank ×1.12, and a spear line that is facing its
 * attacker braces and cuts a cavalry charge to ×0.7 — but nothing in the 3D
 * scene read it. Every unit faced the same way on screen, so the player could
 * neither see where their own line was pointed nor find an exposed back to
 * strike at. A 25% damage swing was invisible.
 *
 * Direction indices come from the engine's own CUBE_DIRS ordering, so rather
 * than duplicating that table (and risking it drifting out of step) this
 * derives the angle geometrically: walk to the neighbour that `hexDirection`
 * agrees is `dir`, and take the bearing between the two hex centres.
 */

/** Cache: the lattice is fixed, so each (parity, dir) pair resolves once. */
const angleCache = new Map<string, number>();

/**
 * World Y-rotation that points a unit's FRONT along `facing`.
 *
 * The unit models are authored facing −Z (the horse's head sits at −z, the
 * boat's prow at −z), so we solve for θ where rotating −Z by θ lands on the
 * bearing: sin θ = dx, −cos θ = dz, i.e. θ = atan2(dx, −dz).
 *
 * If a future model pack is authored facing +X instead, this single expression
 * is the only thing that needs to change.
 */
export function facingRotationY(coord: HexCoord, facing: number | undefined): number {
  if (facing === undefined || facing === null) return 0;
  const dir = ((facing % 6) + 6) % 6;
  // Only column parity affects the offset lattice's neighbour geometry.
  const key = `${coord.col & 1}:${dir}`;
  const hit = angleCache.get(key);
  if (hit !== undefined) return hit;

  const nb = hexNeighbours(coord).find((n) => hexDirection(coord, n) === dir);
  if (!nb) return 0;
  const [ax, az] = hexWorld(coord.col, coord.row);
  const [bx, bz] = hexWorld(nb.col, nb.row);
  const angle = Math.atan2(bx - ax, -(bz - az));
  angleCache.set(key, angle);
  return angle;
}

/** Which arc an attack from `from` lands on, given the defender's facing. */
export type HitArc = 'front' | 'flank' | 'rear' | 'unknown';

/**
 * Classify an incoming attack the same way the combat model does — mirrors
 * the `dirGap` reckoning in tactical.ts so the shield the player sees always
 * matches the multiplier they get.
 */
export function hitArc(
  defender: { coord: HexCoord; facing?: number },
  from: HexCoord,
): HitArc {
  if (defender.facing === undefined || defender.facing === null) return 'unknown';
  const incoming = hexDirection(defender.coord, from);
  const gap = Math.min(
    Math.abs(incoming - defender.facing),
    6 - Math.abs(incoming - defender.facing),
  );
  if (gap === 3) return 'rear';
  if (gap === 2) return 'flank';
  return 'front';
}

/** Damage multiplier the combat model applies for each arc (for tooltips). */
export const ARC_MUL: Record<HitArc, number> = {
  front: 1.0,
  flank: 1.12,
  rear: 1.25,
  unknown: 1.0,
};

export const ARC_LABEL: Record<HitArc, { zh: string; en: string }> = {
  front: { zh: '正面', en: 'Front' },
  flank: { zh: '側翼', en: 'Flank' },
  rear: { zh: '背後', en: 'Rear' },
  unknown: { zh: '未定', en: 'Unset' },
};
