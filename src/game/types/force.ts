import type { BilingualName, EntityId } from './common';
import type { ImperialRank } from './imperial';
import type { RulerPersonality } from './personality';

export interface Force {
  id: EntityId;
  name: BilingualName;
  rulerOfficerId: EntityId;
  capitalCityId: EntityId;
  color: string;
  isPlayer: boolean;
  /** Imperial standing. Defaults to 'commoner' if absent on legacy saves. */
  imperialRank?: ImperialRank;
  /** Vassal-of relationship: set if this force is the vassal of another. */
  vassalOfForceId?: EntityId;
  /** AI personality; defaults to 'opportunist' if absent. */
  personality?: RulerPersonality;
}
