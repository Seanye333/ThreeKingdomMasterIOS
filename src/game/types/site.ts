import type { BilingualName, EntityId } from './common';

/**
 * 野外據點 — discrete, ownable map sites that aren't cities, passes or ports,
 * filling out the same "place you interact with" class the 三國志 series carries:
 *
 *  - 'bandit'   山賊山寨 — a neutral, hostile nest that raids nearby cities
 *               until a force storms it (loot reward, then it's pacified).
 *  - 'ford'     渡口/關津 — a river-crossing control point. Whoever holds it
 *               commands the crossing (and can deny it to the enemy).
 *  - 'resource' 礦場/鹽鐵 — a wilderness deposit (salt lake, iron mountain,
 *               gold mine, horse pasture…) that pays its holder each season.
 */
export type SiteSubtype = 'bandit' | 'ford' | 'resource';

export interface WildSite {
  id: EntityId;
  name: BilingualName;
  subtype: SiteSubtype;
  /** Real (lon, lat) — renderers project to world coords. */
  coords: { lon: number; lat: number };
  /** Resource kind for 'resource' (salt/iron/gold/copper/horse); '' otherwise. */
  variant: string;
  /** null = neutral (uncleared bandit nest / unclaimed ford or deposit). */
  ownerForceId: EntityId | null;
  hp: number;
  maxHp: number;
  /** Garrison/defensive strength — assault difficulty + (bandit) raid power. */
  strength: number;
  /** Nearby cities — used for reach (who may attack), raid targeting and
   *  income routing. */
  guards: EntityId[];
  /** Bandit nests keep raiding until cleared. Set false once subdued. */
  hostile: boolean;
}
