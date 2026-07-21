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
  /** 設伏 — gone to ground in cover (see MarchCommand.ambush). */
  ambush?: boolean;
  /** 長圍 — investing this enemy city (see MarchCommand.besieging). */
  besieging?: EntityId;
  /** True if marching to an open cell (targetX/Y) rather than a city. */
  cellTarget?: boolean;
  /** 行軍節奏 — 急行軍 / 常行 / 緩進 (see MarchCommand.pace). */
  pace?: import('./command').MarchCommand['pace'];
  /** 避戰迂迴 — slipping contacts instead of fighting (see MarchCommand.evading). */
  evading?: boolean;
  /** 師老兵疲 — cumulative campaign fatigue 0..100 (see MarchCommand.fatigue). */
  fatigue?: number;
  /** 攻城器械 (§5.16) — engines standing in this camp's siege park. */
  siegeEngines?: number;
  /** 軍心 — map-level morale 0..100 (see MarchCommand.morale). */
  morale?: number;
  /** 召回 — streaming home to its source (rendered/labelled as a return). */
  returning?: boolean;
  /** 潰走 — beaten in the field, fleeing to shelter (see MarchCommand.routed). */
  routed?: boolean;
  /** 途中錨點 — flight/pursuit leg start (see MarchCommand.fleeX). */
  fleeX?: number;
  fleeY?: number;
  /** 追擊 — hunting this enemy rout (see MarchCommand.pursueTargetId). */
  pursueTargetId?: EntityId;
  /** 候期 — seasons still holding in place before advancing. */
  waitSeasons?: number;
  /** 都督之旗 — opening-morale bonus a legion column carries (§4.3). */
  legionBanner?: number;
}
