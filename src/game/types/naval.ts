import type { BilingualName, EntityId } from './common';

/**
 * Naval system: shipyards in coastal/river-adjacent cities build fleets;
 * fleets occupy water-tile cities or move along water routes between cities.
 */

export type ShipClass =
  | 'transport'   // 運船 — moves troops + officers across water
  | 'warship'     // 艨艟 — combat ships; counts for naval battle
  | 'flagship';   // 楼船 — large command ship; +leadership in battle

export interface ShipClassDef {
  id: ShipClass;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  goldCost: number;
  seasonsToBuild: number;
  /** Combat strength of one ship in naval battle. */
  combatStrength: number;
  /** Troop carrying capacity. */
  capacity: number;
}

/** A fleet stationed at a city. */
export interface Fleet {
  id: EntityId;
  cityId: EntityId;
  forceId: EntityId;
  ships: Partial<Record<ShipClass, number>>;
}

/** A pending ship build at a shipyard. */
export interface ShipBuildOrder {
  id: EntityId;
  cityId: EntityId;
  shipClass: ShipClass;
  /** Seasons remaining. */
  seasonsLeft: number;
}
