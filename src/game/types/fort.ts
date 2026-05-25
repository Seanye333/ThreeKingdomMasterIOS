import type { BilingualName, EntityId } from './common';

/**
 * Fort = small military installation, smaller and more numerous than 城.
 * Two subtypes:
 *   - 'fort'     永久关砦 (street pavilion 街亭, fixed-mountain 定軍山 etc.) — pre-placed historical
 *   - 'stockade' 塢/壘 — player-buildable temporary wooden fort
 *
 * Forts:
 *   - Have their own HP + ownerForceId (independent of nearby cities)
 *   - Are attacked similarly to ports (officer + troops)
 *   - Block marches through their area until captured
 *   - Stockades expire after N seasons (woodrot) unless garrisoned
 */
export type FortSubtype = 'fort' | 'stockade';

export interface Fort {
  id: EntityId;
  name: BilingualName;
  subtype: FortSubtype;
  /** Real-world (lon, lat) — renderers project to world coords. */
  coords: { lon: number; lat: number };
  ownerForceId: EntityId | null;
  hp: number;
  maxHp: number;
  /** Which cities this fort guards/blocks marches between. Empty = no
   *  blocking effect; informational only. */
  guards: EntityId[];
  /** For 'stockade': seasons before it rots away if ungarrisoned. */
  seasonsRemaining?: number;
  /** Upgrade level — 1 (default) to 3. Each level: +50% maxHp, taller mesh. */
  level?: 1 | 2 | 3;
}

/** Effective maxHp at the fort's current level. */
export function fortMaxHpForLevel(baseMaxHp: number, level: number | undefined): number {
  const lv = level ?? 1;
  return Math.floor(baseMaxHp * (1 + 0.5 * (lv - 1)));
}
