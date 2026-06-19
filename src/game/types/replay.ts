import type { EntityId } from './common';
import type { TacticalBattle } from './tactical';

/**
 * Battle replay: store a snapshot of the full tactical battle at the
 * winning state. Replay viewer steps through the turn-by-turn log.
 */
export interface BattleReplay {
  id: EntityId;
  cityId: EntityId;
  cityName: { zh: string; en: string };
  year: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  attackerForceName?: { zh: string; en: string };
  defenderForceName?: { zh: string; en: string };
  finalBattle: TacticalBattle;
  /** Per-turn snapshots, oldest first. Empty if not recorded. */
  snapshots: TacticalBattle[];
}
