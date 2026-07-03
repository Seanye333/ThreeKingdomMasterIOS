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
  /** 真日級 — field interceptions won by the player (abstract + 親征). */
  fieldClashesWon?: number;
  /** 親征 — encounters fought interactively mid-flow (迎戰 pressed). */
  engagementsFought?: number;
  /** 斷糧 — enemy columns bled by a cut supply ribbon. */
  enemyColumnsStarved?: number;
  /** Total seasons played. */
  seasonsPlayed: number;
  /** Total battles fought. */
  totalBattles: number;
}

export function createEmptyCampaignStats(): CampaignStats {
  return { seasonsPlayed: 0, totalBattles: 0 };
}
