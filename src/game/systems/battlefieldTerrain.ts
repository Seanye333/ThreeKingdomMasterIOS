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

export interface TerrainHint {
  /** The city's primary terrain category (drives the dominant mix). */
  terrain?: Terrain;
  /** Has a river port — guarantees a river column. */
  port?: boolean;
  /** Map coords (0-1000 east-west, 0-720 north-south). */
  x?: number;
  y?: number;
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
  if (y < 230) {
    mountain += 0.05;
    forest -= 0.05;
  }
  // Northern China (230-360): standard
  // Central plains (360-480): more road, less mountain
  else if (y >= 360 && y < 480) {
    mountain -= 0.05;
    road += 0.10;
  }
  // Deep south (y >= 480): more forest + river (Jiangnan)
  else if (y >= 480) {
    forest += 0.10;
    river += 0.05;
  }
  // ── Longitude (x) bias ──
  // Far west (x < 350): more mountain + desert tendency (already in terrain)
  if (x < 350) {
    mountain += 0.05;
    forest -= 0.05;
  }
  // East coast (x > 800): more water tendency
  if (x > 800) {
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

/**
 * Generate the full tile array for a battlefield, respecting the city's
 * terrain hint and geographic position. Optionally honors a per-coord
 * `overrides` map (used by named battlefield maps like 赤壁/虎牢).
 */
export function generateTerrain(
  cityId: string,
  width: number,
  height: number,
  hint: TerrainHint,
  overrides?: Record<string, TerrainKind>,
): TacticalTile[] {
  const rng = makeRng(cityId);
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

      // ── Pass: mountains line edges, road in middle ──
      if (isPass) {
        if (row === 0 || row === height - 1) terrain = 'mountain';
        else if (row === Math.floor(height / 2)) terrain = 'road';
        else if (rng() < mix.mountain) terrain = 'mountain';
        else if (rng() < mix.forest) terrain = 'forest';
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

      // ── Wetland: clusters of river hexes ──
      if (isWetland && row >= Math.floor(height / 2) - 1 && row <= Math.floor(height / 2) + 1) {
        if (rng() < 0.35) {
          terrain = 'river';
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
      tiles.push({ coord: { col, row }, terrain });
    }
  }
  return tiles;
}
