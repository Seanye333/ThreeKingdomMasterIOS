import type { BilingualName, EntityId } from './common';

/**
 * A historical event is a scripted narrative beat that fires when its
 * conditions are met (typically a date threshold + game-state predicates).
 * Effects mutate state via a typed payload that the event runner applies.
 */
export type EventEffect =
  | { kind: 'force-troops-multiplier'; forceId: EntityId; multiplier: number }
  | { kind: 'force-gold'; forceId: EntityId; delta: number }
  | { kind: 'city-loyalty'; cityId: EntityId; delta: number }
  | { kind: 'officer-loyalty'; officerId: EntityId; delta: number }
  | { kind: 'officer-status'; officerId: EntityId; status: 'dead' | 'idle' | 'imprisoned' }
  | { kind: 'officer-join'; officerId: EntityId; forceId: EntityId }
  | { kind: 'spawn-rebel-force'; cityId: EntityId; troops: number; label: BilingualName }
  | { kind: 'flag'; key: string }; // sets a flag in state.eventFlags

export interface HistoricalEvent {
  id: EntityId;
  name: BilingualName;
  /** Earliest year the event may fire (inclusive). */
  yearMin: number;
  /** Latest year the event may fire (inclusive). */
  yearMax: number;
  /** If set, only fires in this season. */
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  /**
   * Predicate keyed by simple condition names — evaluated by the event runner.
   * - "force-alive": forceId must still exist on the map
   * - "officer-alive": officerId must not be 'dead'
   * - "officer-active": officerId must be 'idle' or 'active'
   * - "flag-set" / "flag-unset": eventFlags[key] is true/false
   */
  requires?: Array<
    | { kind: 'force-alive'; forceId: EntityId }
    | { kind: 'officer-alive'; officerId: EntityId }
    | { kind: 'officer-active'; officerId: EntityId }
    | { kind: 'flag-set'; key: string }
    | { kind: 'flag-unset'; key: string }
  >;
  /** Narrative description shown in the event modal. */
  description: string;
  descriptionZh?: string;
  description: string;
  descriptionZh?: string;
  effects: EventEffect[];
}
