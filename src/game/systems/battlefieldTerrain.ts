/**
 * Geography-aware battlefield terrain generation.
 *
 * Replaces the old "8% mountain / 22% forest / 28% river" uniform rule
 * with terrain mixes that respect:
 *   - The city's `terrain` field (mountain / forest / water / desert / wetland / pass)
 *   - The city's `port` flag (forces a river column)
 *   - The city's strategic coords (latitude/longitude bias — far north
 *     gets less forest, deep south gets wetland, far west gets desert,
 *     east coast gets water, etc.)
 *
 * Each city generates a distinct-feeling map that matches its real
 * geography (Liaodong feels northern, Jiangling feels riverine,
 * Hanzhong feels mountainous, Wuwei feels arid).
 */
import type { TerrainKind, TacticalTile } from '../types';
import type { Terrain } from '../data/cities';
import { battleGroundAt, isFrozenWater, forestDensityAt, aridityAt, WORLD_SCALE } from '../data/geography';

/**
 * Real-geography placement of a battle on the strategic map — when
 * present, the battlefield grid is laid over the actual map and each
 * tile samples the real ground there.
 */
export interface BattleGeo {
  /** Anchor position on the 1000×720 strategic map. */
  x: number;
  y: number;
  /** Radians, attacker → defender (attacker enters from col 0, so the
   *  grid's +col axis points along this bearing). */
  bearing: number;
  /** Grid column the anchor sits on. Sieges anchor the city just behind
   *  its rampart (width-2); field battles default to the grid centre. */
  anchorCol?: number;
  /** Season — in winter the northern rivers (黄河 belt, lat ≳33.5°N)
   *  freeze into crossable ice. */
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface TerrainHint {
  /** The city's primary terrain category (drives the dominant mix). */
  terrain?: Terrain;
  /** Has a river port — guarantees a river column. */
  port?: boolean;
  /** Map coords (0-1000 east-west, 0-720 north-south). */
  x?: number;
  y?: number;
  /** Naval battle — generate an open-water board (river everywhere, with a
   *  few bridge crossings, shoals/marsh, and the odd island of plain). */
  naval?: boolean;
}

interface TerrainMix {
  mountain: number;   // 0-1 probability per tile
  forest: number;
  river: number;
  road: number;       // forced on middle row when roll succeeds
}

/** Base mixes by city's terrain field. */
const BASE_MIX: Record<Terrain, TerrainMix> = {
  plain:    { mountain: 0.04, forest: 0.12, river: 0.05, road: 0.50 },
  mountain: { mountain: 0.40, forest: 0.18, river: 0.04, road: 0.15 },
  forest:   { mountain: 0.10, forest: 0.55, river: 0.08, road: 0.20 },
  water:    { mountain: 0.02, forest: 0.10, river: 0.40, road: 0.20 },
  desert:   { mountain: 0.18, forest: 0.00, river: 0.01, road: 0.35 },
  wetland:  { mountain: 0.01, forest: 0.22, river: 0.40, road: 0.10 },
  pass:     { mountain: 0.55, forest: 0.12, river: 0.02, road: 0.65 },
};

/** Apply geographic biases on top of the base mix. */
function biased(mix: TerrainMix, x?: number, y?: number): TerrainMix {
  if (x == null || y == null) return mix;
  let { mountain, forest, river, road } = mix;
  // ── Latitude (y) bias ──
  // Far north (y < 250): more mountain, slightly less forest
  // Thresholds are authored in the base 1000×720 space; scale with the world.
  if (y < 230 * WORLD_SCALE) {
    mountain += 0.05;
    forest -= 0.05;
  }
  // Northern China (230-360): standard
  // Central plains (360-480): more road, less mountain
  else if (y >= 360 * WORLD_SCALE && y < 480 * WORLD_SCALE) {
    mountain -= 0.05;
    road += 0.10;
  }
  // Deep south (y >= 480): more forest + river (Jiangnan)
  else if (y >= 480 * WORLD_SCALE) {
    forest += 0.10;
    river += 0.05;
  }
  // ── Longitude (x) bias ──
  // Far west (x < 350): more mountain + desert tendency (already in terrain)
  if (x < 350 * WORLD_SCALE) {
    mountain += 0.05;
    forest -= 0.05;
  }
  // East coast (x > 800): more water tendency
  if (x > 800 * WORLD_SCALE) {
    river += 0.05;
  }
  // Clamp
  return {
    mountain: Math.max(0, Math.min(0.65, mountain)),
    forest:   Math.max(0, Math.min(0.65, forest)),
    river:    Math.max(0, Math.min(0.55, river)),
    road:     Math.max(0, Math.min(1.0,  road)),
  };
}

/** Deterministic xorshift RNG seeded on cityId. */
function makeRng(cityId: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < cityId.length; i++) {
    h = Math.imul(h ^ cityId.charCodeAt(i), 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return ((h >>> 0) % 100000) / 100000;
  };
}

/** Map px per battlefield tile — an 18-wide grid spans ~32px (~0.9°,
 *  ~100km): generous tactically, but wide enough that ridge bands and
 *  river lines from the strategic map appear as coherent features. */
const TILE_PX = 1.8 * WORLD_SCALE;   // world-px per battle tile — scales so a board covers the same geographic area at any WORLD_SCALE

/**
 * Real-geography battlefield: lay the grid over the strategic map along
 * the approach bearing and sample the actual ground per tile. The march
 * road runs along the centre row (the bearing line); forest stays a
 * latitude-themed sprinkle (no strategic forest data); pass/port/naval
 * guarantees are applied by the caller's shared post-pass.
 */
function generateRealTerrain(
  cityId: string,
  width: number,
  height: number,
  geo: BattleGeo,
): TacticalTile[] {
  const rng = makeRng(`${cityId}:${Math.round(geo.x)},${Math.round(geo.y)}`);
  const anchorCol = geo.anchorCol ?? Math.floor(width / 2);
  const midRow = Math.floor(height / 2);
  const ux = Math.cos(geo.bearing), uy = Math.sin(geo.bearing);
  const vx = -uy, vy = ux;
  const tiles: TacticalTile[] = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const dc = col - anchorCol;
      const dr = row - midRow;
      const mx = geo.x + (ux * dc + vx * dr) * TILE_PX;
      const my = geo.y + (uy * dc + vy * dr) * TILE_PX;
      const g = battleGroundAt(mx, my);
      let terrain: TerrainKind = 'plain';
      if (g === 'sea' || g === 'lake' || g === 'river') {
        // 冰封 — northern waters freeze over in winter: crossable ice.
        terrain = (g === 'river' && isFrozenWater(my, geo.season)) ? 'ice' : 'river';
      }
      else if (g === 'riverbank') terrain = rng() < 0.45 ? 'marsh' : 'plain';
      else if (g === 'mountain') terrain = 'mountain';
      else if (g === 'hill') terrain = rng() < 0.7 ? 'hill' : 'mountain';
      else if (aridityAt(mx, my) > 0.35) {
        // Arid NW (河西/塞北/漠南) — open sand & gobi, occasional rocky rise.
        terrain = rng() < 0.18 ? 'hill' : 'desert';
      }
      else {
        // Open ground — forest density follows the REAL region (lush in
        // 江南/楚/蜀, sparse on the northern plains), plus a few light hills.
        const r = rng();
        const fp = 0.05 + forestDensityAt(mx, my) * 0.5;   // 5% baseline … 55% in deep forest
        if (r < fp) terrain = 'forest';
        else if (r < fp + 0.04) terrain = 'hill';
      }
      tiles.push({ coord: { col, row }, terrain });
    }
  }

  // ── Playability guarantees over the real sample ──
  for (const t of tiles) {
    const { col, row } = t.coord;
    // The march road runs along the bearing line through the field — armies
    // clash ON the road they were travelling. Through mountains it is the
    // pass road (陳倉道…); across a river it narrows to a bridge/ford, so
    // crossings become fightable chokepoints instead of a wall of water.
    if (row === midRow) {
      if (t.terrain === 'river') t.terrain = 'bridge';
      else if (t.terrain === 'mountain' || t.terrain === 'hill' || t.terrain === 'plain' || t.terrain === 'desert') t.terrain = 'road';
      // ice stays ice — in winter the frozen river itself is the road.
    }
    // Both armies muster on dry, open ground — entry columns can't be
    // water or cliff (the riverbank camp / beachhead).
    if (col <= 1 || col >= width - 2) {
      if (t.terrain === 'river' || t.terrain === 'mountain') t.terrain = row === midRow ? 'road' : 'plain';
    }
  }
  return tiles;
}

/**
 * Generate the full tile array for a battlefield, respecting the city's
 * terrain hint and geographic position. Optionally honors a per-coord
 * `overrides` map (used by named battlefield maps like 赤壁/虎牢).
 * When `geo` is provided (and no named-map overrides), the grid samples
 * the REAL strategic map along the approach bearing instead of rolling a
 * themed mix — the battlefield reproduces the actual local geography.
 */
export function generateTerrain(
  cityId: string,
  width: number,
  height: number,
  hint: TerrainHint,
  overrides?: Record<string, TerrainKind>,
  geo?: BattleGeo,
): TacticalTile[] {
  const rng = makeRng(cityId);

  // ── Real-geography battlefield (战斗地图写实) ──
  if (geo && !overrides && !hint.naval) {
    const tiles = generateRealTerrain(cityId, width, height, geo);
    // Thematic guarantees on top of the real sample:
    const midRow = Math.floor(height / 2);
    if (hint.terrain === 'pass') {
      // A pass is a corridor — ridge walls top/bottom, chokepoint mid-road.
      for (const t of tiles) {
        if (t.coord.row === 0 || t.coord.row === height - 1) t.terrain = 'mountain';
        else if (t.coord.row === midRow && t.terrain !== 'river') {
          t.terrain = t.coord.col === Math.floor(width / 2) ? 'chokepoint' : 'road';
        }
      }
    }
    if (hint.port) {
      // Port city — the wharf row guarantees water along the south edge.
      for (const t of tiles) {
        if (t.coord.row === height - 1) t.terrain = 'river';
      }
    }
    return tiles;
  }

  // ── Naval board: open water with scattered crossings, shoals and islets ──
  if (hint.naval && !overrides) {
    const tiles: TacticalTile[] = [];
    const midRow = Math.floor(height / 2);
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        let terrain: TerrainKind = 'river';
        const r = rng();
        // A couple of bridge crossings let any straggling land unit traverse.
        if (col === Math.floor(width / 3) || col === Math.floor((2 * width) / 3)) {
          if (row === midRow) terrain = 'bridge';
        }
        if (terrain === 'river') {
          if (r < 0.06) terrain = 'marsh';        // shoals / reed banks
          else if (r < 0.10) terrain = 'plain';   // a small islet
        }
        tiles.push({ coord: { col, row }, terrain });
      }
    }
    return tiles;
  }

  const baseMix = BASE_MIX[hint.terrain ?? 'plain'];
  const mix = biased(baseMix, hint.x, hint.y);
  const tiles: TacticalTile[] = [];

  // Pre-compute special features:
  // - If pass terrain: mountains line top & bottom rows, narrow road across middle
  // - If port: river column along the south edge (or north for inland river cities)
  // - If wetland: river spreads in a cluster
  // - If desert: mostly bare, occasional dunes (use mountain visually)
  const isPass = hint.terrain === 'pass';
  const isWater = hint.terrain === 'water';
  const isWetland = hint.terrain === 'wetland';
  const isPort = hint.port === true;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const key = `${col},${row}`;
      if (overrides?.[key]) {
        tiles.push({ coord: { col, row }, terrain: overrides[key] });
        continue;
      }
      let terrain: TerrainKind = 'plain';

      // ── Pass: mountains line edges, road + chokepoint in middle ──
      if (isPass) {
        if (row === 0 || row === height - 1) terrain = 'mountain';
        else if (row === Math.floor(height / 2)) {
          // Narrow it down — middle column of the road is a chokepoint.
          terrain = col === Math.floor(width / 2) ? 'chokepoint' : 'road';
        }
        else if (rng() < mix.mountain) terrain = 'mountain';
        else if (rng() < mix.forest) terrain = 'forest';
        else if (rng() < 0.05) terrain = 'hill';
        tiles.push({ coord: { col, row }, terrain });
        continue;
      }

      // ── Port: guarantee a river along south edge (or north for landlocked) ──
      if (isPort && row === height - 1) {
        terrain = 'river';
        tiles.push({ coord: { col, row }, terrain });
        continue;
      }

      // ── Water (riverine) cities: dominant river belt across middle ──
      if (isWater && row === Math.floor(height / 2)) {
        terrain = 'river';
        tiles.push({ coord: { col, row }, terrain });
        continue;
      }

      // ── Wetland: clusters of river + marsh hexes ──
      if (isWetland && row >= Math.floor(height / 2) - 1 && row <= Math.floor(height / 2) + 1) {
        const wr = rng();
        if (wr < 0.25) {
          terrain = 'river';
        } else if (wr < 0.50) {
          terrain = 'marsh';
        }
        if (terrain !== 'plain') {
          tiles.push({ coord: { col, row }, terrain });
          continue;
        }
      }

      // ── Standard roll ──
      const r = rng();
      if (r < mix.mountain) terrain = 'mountain';
      else if (r < mix.mountain + mix.forest) terrain = 'forest';
      else if (r < mix.mountain + mix.forest + mix.river) terrain = 'river';
      else if (row === Math.floor(height / 2) && rng() < mix.road) terrain = 'road';
      // Sprinkle hills (~3%) on plains for tactical variety.
      else if (terrain === 'plain' && rng() < 0.03) terrain = 'hill';
      tiles.push({ coord: { col, row }, terrain });
    }
  }
  return tiles;
}
