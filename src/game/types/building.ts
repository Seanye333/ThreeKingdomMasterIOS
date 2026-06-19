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
  | 'shipyard'   // 船渠 — required to build ships; only on river-adjacent cities
  | 'granary'    // 義倉 — famine insurance: rarer famines, smaller losses
  | 'infirmary'  // 醫館 — plague control: rarer outbreaks, fewer dead
  | 'levee'      // 堤防 — flood works: a L3 levee stops the river cold
  | 'stable'     // 馬廄 — breeds warhorses: boosts recruit + troop cap (cavalry)
  | 'workshop'   // 工房 — arms & siege works: city defense + slight recruit
  | 'mint'       // 錢莊 — coin minting: strong commerce gold boost
  | 'arsenal';   // 武庫 — armoury: city defense + troop cap

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
  /** Which city-view foundation plot this building sits on (index into the
   *  city's build-plot grid). Optional — legacy/AI buildings without one fall
   *  back to deterministic order placement in the 3D city view. */
  plot?: number;
}
