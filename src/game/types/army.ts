import type { EntityId } from './common';

/**
 * A persistent field army — a unit that physically occupies the map and
 * marches cell-by-cell toward its objective, rather than a fire-and-forget
 * march command. Created when a march is issued; stepped each season; it
 * resolves on arrival (assault / merge) or on contact with an enemy army.
 */
export interface Army {
  id: string;
  forceId: EntityId;
  commanderId: EntityId;
  companionIds: EntityId[];
  troops: number;
  /** Origin city (where the troops were drawn from). */
  fromCityId: EntityId;
  /** Objective city the army is marching to. */
  targetCityId: EntityId;
  /** Current pixel position on the 1000×720 map. */
  x: number;
  y: number;
  /** Progress along the terrain route, 0 (just left source) → 1 (arrived). */
  progress: number;
  /** Seasons the full route takes; speed = 1 / totalSeasons per season. */
  totalSeasons: number;
  /** Whether this army crosses water (rendered gliding, no hex snap). */
  naval?: boolean;
  /** 隨軍糧 — provisions carried; spent each season, refillable by convoy.
   *  An army that runs out starts shedding deserters. */
  food?: number;
  /** Holding its current cell as a garrison (not advancing). */
  holding?: boolean;
  /** True if marching to an open cell (targetX/Y) rather than a city. */
  cellTarget?: boolean;
}
