import type { EntityId } from './common';

/**
 * Per-officer heroic deeds tracker — accumulates over a campaign.
 * Used by the 武功榜 leaderboard and end-of-game scoring.
 */
export interface HeroicDeeds {
  officerId: EntityId;
  killsTroops: number;
  duelsWon: number;
  /** 舌戰 won (論辯場 + pre-battle word wars). Optional; old saves default 0. */
  debatesWon?: number;
  captured: number;
  citiesTaken: number;
  espionageSuccess: number;
  civicWorks: number;
  battlesWon: number;
  battlesLost: number;
  /** Training programs they completed (as the trainee, or as mentor). */
  trainingsCompleted: number;
  /** Children they sired (or birthed). */
  childrenSired: number;
  /** Earned deed-titles (epithets), e.g. '万人敌', '百城将'. */
  titles?: string[];
}

export function createDeeds(officerId: EntityId): HeroicDeeds {
  return {
    officerId,
    killsTroops: 0,
    duelsWon: 0,
    captured: 0,
    citiesTaken: 0,
    espionageSuccess: 0,
    civicWorks: 0,
    battlesWon: 0,
    battlesLost: 0,
    trainingsCompleted: 0,
    childrenSired: 0,
  };
}
