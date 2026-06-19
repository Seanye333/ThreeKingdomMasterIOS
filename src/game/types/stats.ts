import type { EntityId } from './common';

/**
 * Per-campaign statistics tracker. Records superlatives that get shown
 * on the end-of-campaign report.
 */
export interface CampaignStats {
  /** Biggest single battle by total troops involved. */
  biggestBattle?: {
    cityId: EntityId;
    year: number;
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    attackerTroops: number;
    defenderTroops: number;
  };
  /** Longest siege turn count in tactical battles. */
  longestSiege?: { cityId: EntityId; turns: number };
  /** Highest single-attack damage in tactical battle. */
  biggestHit?: {
    attackerId: EntityId;
    defenderId: EntityId;
    damage: number;
    cityId: EntityId;
  };
  /** Highest total casualties from one battle. */
  worstCasualties?: { cityId: EntityId; troopsLost: number };
  /** Best officer this campaign (most cities taken). */
  topOfficerByCities?: { officerId: EntityId; count: number };
  /** Total seasons played. */
  seasonsPlayed: number;
  /** Total battles fought. */
  totalBattles: number;
}

export function createEmptyCampaignStats(): CampaignStats {
  return { seasonsPlayed: 0, totalBattles: 0 };
}
