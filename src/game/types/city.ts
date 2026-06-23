import type { BilingualName, EntityId } from './common';

export interface CityCoords {
  x: number;
  y: number;
}

export interface BuildSlot {
  /** Position index 0–7 (N, NE, E, SE, S, SW, W, NW). */
  slot: number;
  /** What's built here (undefined if empty). */
  buildingId?: import('../data/defenseBuildings').DefenseBuildingId;
  /** Current level (1-3 typically). */
  level: number;
  /** If currently being built, how many periods left. */
  buildSeasonsLeft?: number;
}

export interface City {
  id: EntityId;
  name: BilingualName;
  coords: CityCoords;
  adjacentCityIds: EntityId[];

  ownerForceId: EntityId | null;

  population: number;
  gold: number;
  food: number;
  troops: number;
  agriculture: number;
  commerce: number;
  defense: number;
  loyalty: number;

  /** Razed to ruins (焦土) — population/production gutted until 重建. A ruined
   *  city flies no banner, builds nothing, and yields almost no income. */
  ruined?: boolean;
  /** 治水之功 — flood works raised by the 治水 command (officer labour, as
   *  opposed to the gold-built 堤防 levee). Stacks with the levee building level
   *  toward the flood-immunity cap (3) in events.ts. Default/omitted = 0. */
  floodWorks?: number;
  /**
   * 貪腐 — accumulated graft (0–100). Creeps up each season in wealthy/large
   * cities left unaudited; skims a slice off gold income (up to −40% at 100).
   * The 巡查肅貪 command claws it back to near-zero AND recovers the embezzled
   * gold (scaling with how much had piled up). Default/omitted = 0 (clean).
   */
  corruption?: number;
  /**
   * 練度 — the garrison's drill/training level (0–100). Raised by the 練兵
   * command and by 演習 sparring drills; decays slowly each season. Lifts the
   * city's defensive fighting power when besieged (well-drilled defenders hold
   * the walls better). Default/omitted = 0 (raw levies).
   */
  drill?: number;
  /** Terrain category — see TERRAIN_DEFS in cities.ts. */
  terrain?: import('../data/cities').Terrain;
  /** Has river/sea port — unlocks naval movement to other ports. */
  port?: boolean;
  /**
   * 異域義從 — foreign auxiliaries (象兵/突騎/汗血騎) stationed here by 遠使
   * embassies. Counted within `troops` for raw strength, but ALSO grant a
   * defence-power bonus (elite quality on top of quantity) — see
   * `foreignAuxDefenseMultiplier` in combat.ts. Default/omitted = 0.
   */
  foreignAux?: number;
  /**
   * Wall fortification tier (1 = village wall, 2 = inner-walled city,
   * 3 = three-tier citadel like Hefei/Luoyang/Chang'an).
   * Each tier multiplies city defense and increases siege duration.
   */
  wallTier?: 1 | 2 | 3;
  /**
   * Outer-perimeter defense build slots — 8 positions around the city
   * (N, NE, E, SE, S, SW, W, NW). Each can hold one structure that
   * provides siege/combat bonuses (箭樓/拒馬/烽火台 etc.).
   */
  buildSlots?: BuildSlot[];
}
