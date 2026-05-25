import type { BilingualName, EntityId } from './common';

/**
 * City building types. Each city can host buildings up to a per-type max level.
 * Buildings give multiplicative bonuses to local production / capacity.
 */
export type BuildingId =
  | 'barracks'   // 兵營 — boosts troop training (recruit) and troop cap
  | 'market'     // 市場 — boosts commerce gold per season
  | 'foundry'    // 鉄工坊 — boosts equipment quality, slight commerce
  | 'academy'    // 書院 — boosts officer XP and recruit chance
  | 'temple'     // 寺院 — boosts loyalty per season and resistance to instigate
  | 'farm'       // 屯田 — boosts agriculture food yield
  | 'wall'       // 城壁 — increases city defense
  | 'shipyard';  // 船渠 — required to build ships; only on river-adjacent cities

export interface BuildingDef {
  id: BuildingId;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  /** Gold cost per level. */
  goldPerLevel: number;
  /** Seasons to build one level. */
  seasonsPerLevel: number;
  /** Maximum level. */
  maxLevel: number;
  /** Effect description by level. */
  effect: string;
}

/**
 * A built structure in a city, with its current level and progress
 * (0 → seasonsPerLevel; when full, level increments).
 */
export interface Building {
  id: BuildingId;
  cityId: EntityId;
  level: number;
  /** Progress in seasons toward the next level. */
  progress: number;
}
