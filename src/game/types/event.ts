import type { BilingualName, EntityId } from './common';

/**
 * A historical event is a scripted narrative beat that fires when its
 * conditions are met (typically a date threshold + game-state predicates).
 * Effects mutate state via a typed payload that the event runner applies.
 */
export type EventEffect =
  | { kind: 'force-troops-multiplier'; forceId: EntityId; multiplier: number }
  /** 斷糧 — strip a force's ENTIRE hex-paint (its supply ribbons grass over
   *  at once): deep columns start starving until they re-walk a corridor. */
  | { kind: 'strip-force-paint'; forceId: EntityId }
  | { kind: 'force-gold'; forceId: EntityId; delta: number }
  | { kind: 'city-loyalty'; cityId: EntityId; delta: number }
  | { kind: 'officer-loyalty'; officerId: EntityId; delta: number }
  | { kind: 'officer-status'; officerId: EntityId; status: 'dead' | 'idle' | 'imprisoned' }
  | { kind: 'officer-join'; officerId: EntityId; forceId: EntityId }
  | { kind: 'officer-join-ruler'; officerId: EntityId; rulerOfficerId: EntityId } // join the force whose ruler is rulerOfficerId (resolved at runtime — scenario-agnostic)
  // Ruler-resolved force effects (scenario-agnostic, like officer-join-ruler):
  | { kind: 'mandate-ruler'; rulerOfficerId: EntityId; delta: number }            // §8.5 — shift the 天命 of the force this officer rules
  | { kind: 'force-troops-multiplier-ruler'; rulerOfficerId: EntityId; multiplier: number }
  | { kind: 'force-gold-ruler'; rulerOfficerId: EntityId; delta: number }
  | { kind: 'spawn-rebel-force'; cityId: EntityId; troops: number; label: BilingualName }
  | { kind: 'grant-title'; officerId: EntityId; titleId: import('./title').CivicTitleId; cityId?: EntityId }
  | { kind: 'force-wish'; officerId: EntityId; wishKind: import('./family').WishKind; text: BilingualName; rejectPenalty?: number; grantBonus?: number }
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
    // The force ruled by officerId owns at least `count` cities — a dynamic,
    // scenario-agnostic state predicate (resolves the force by its ruler).
    | { kind: 'officer-rules-cities-min'; officerId: EntityId; count: number }
    // The officer serves no force (在野/未仕) — gate for recruitment chains.
    | { kind: 'officer-unaffiliated'; officerId: EntityId }
  >;
  /** Narrative description shown in the event modal. */
  description: string;
  descriptionZh?: string;
  effects: EventEffect[];
  /** 抉擇 — when present the event poses a decision. If the player rules
   *  the force led by `chooserRulerId`, the modal offers the choices and
   *  the picked effects apply on resolution; otherwise the FIRST choice
   *  (the historical path) applies automatically at fire time. Chains are
   *  built by choices setting flags that later events require. */
  chooserRulerId?: EntityId;
  choices?: EventChoice[];
  /** Optional explicit mood for the event card's accent/seal + audio cue.
   *  When omitted, the mood is inferred from the effects. Set it for events
   *  whose top-level effects are empty (e.g. choice-only dynamic events). */
  mood?: 'auspicious' | 'somber' | 'mystic' | 'martial' | 'ominous';
}

export interface EventChoice {
  id: string;
  label: BilingualName;
  effects: EventEffect[];
}

/** §8.1-deep 事件簿(本朝災異志)— one line of the running annals the
 *  player can browse: history beats, omens, disasters, frontier alarms,
 *  risings and rites, in the order they befell the realm. (Distinct from
 *  the victory-recap `chronicle`, which tracks conquests/works.) */
export interface AnnalsEntry {
  year: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  kind: 'event' | 'omen' | 'disaster' | 'frontier' | 'unrest' | 'rite';
  titleZh: string;
  textZh: string;
  cityId?: EntityId | null;
}
