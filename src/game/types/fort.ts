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
  /**
   * 施設 — a strategic-map installation (built on a stockade footprint) that
   * acts on armies marching nearby (RTK-XIV 櫓/投石臺/陣/防壁). Undefined = a
   * plain stockade (blocks/assault only, no field effect).
   */
  facility?: FacilityKind;
}

/** Strategic facilities that act on passing armies each season. */
export type FacilityKind = 'tower' | 'catapult' | 'camp' | 'wall' | 'depot' | 'boom';

export interface FacilityDef {
  name: BilingualName;
  /** 'ranged' shells hostile columns in range; 'supply' heals friendly ones;
   *  'block' bars the route (no field damage). */
  effect: 'ranged' | 'supply' | 'block';
  cost: number;        // gold to build
  hp: number;
  seasons: number;     // woodrot timer (like a stockade)
  /** Strategic-map units of effect radius (0 for a pure blocker). */
  range: number;
  /**
   * Troops per HALF-MONTH TICK (the strategic sim resolves 6× per season:
   * 3 months × 上/下旬): damage to hostile columns (ranged) or healing to
   * friendly ones (supply). A column crossing a tower's reach typically eats
   * 2-4 ticks of fire.
   */
  power: number;
  /** Map accent colour. */
  color: string;
}

export const FACILITY_DEFS: Record<FacilityKind, FacilityDef> = {
  tower: {
    name: { zh: '箭樓', en: 'Arrow Tower' },
    effect: 'ranged', cost: 250, hp: 300, seasons: 12, range: 30, power: 180,
    color: '#d4a84a',
  },
  catapult: {
    name: { zh: '投石臺', en: 'Catapult' },
    effect: 'ranged', cost: 450, hp: 220, seasons: 10, range: 52, power: 320,
    color: '#c46a3a',
  },
  camp: {
    name: { zh: '陣', en: 'Camp' },
    effect: 'supply', cost: 200, hp: 280, seasons: 14, range: 26, power: 150,
    color: '#7ed68a',
  },
  wall: {
    name: { zh: '防壁', en: 'Barricade' },
    effect: 'block', cost: 350, hp: 520, seasons: 14, range: 16, power: 0,
    color: '#9aa6b4',
  },
  boom: {
    // 攔江鎖 — an iron chain-boom strung across the water: hostile FLEETS
    // within reach stall (~70%/half-month) until the boom is broken. Land
    // columns walk past it. 王濬樓船,鐵鎖橫江.
    name: { zh: '攔江鎖', en: 'River Boom' },
    effect: 'block', cost: 500, hp: 400, seasons: 20, range: 20, power: 0,
    color: '#6a8ab8',
  },
  depot: {
    // 兵站 — a supply anchor: the hex-paint corridor counts as connected
    // when it reaches a friendly depot (see resolution's supply pass), so a
    // depot chain lets a deep expedition keep its grain flowing. Also heals
    // passing friendly columns a little, like a small 陣.
    name: { zh: '兵站', en: 'Supply Depot' },
    effect: 'supply', cost: 320, hp: 260, seasons: 16, range: 24, power: 60,
    color: '#e8c56a',
  },
};

/** Effective maxHp at the fort's current level. */
export function fortMaxHpForLevel(baseMaxHp: number, level: number | undefined): number {
  const lv = level ?? 1;
  return Math.floor(baseMaxHp * (1 + 0.5 * (lv - 1)));
}
