import type { BilingualName, EntityId } from './common';

/**
 * Random dialogue / court events. Triggers each season with low probability;
 * the player picks a response that has a small mechanical effect.
 */
export type DialogueChoiceEffect =
  | { kind: 'gold'; delta: number }
  | { kind: 'loyalty'; officerId: EntityId; delta: number }
  | { kind: 'city-loyalty'; cityId: EntityId; delta: number }
  | { kind: 'food'; cityId: EntityId; delta: number }
  | { kind: 'troops'; cityId: EntityId; delta: number }
  | { kind: 'recruit'; officerId: EntityId }
  | { kind: 'set-flag'; flag: string }
  | { kind: 'none' };

export interface DialogueChoice {
  label: BilingualName;
  effects: DialogueChoiceEffect[];
  /** Optional one-line outcome text shown after choosing. */
  outcome?: { zh: string; en: string };
  /** Optional follow-up dialogue id queued to fire on a future season. */
  followupEventId?: EntityId;
}

export interface DialogueEvent {
  id: EntityId;
  /** Speaker shown at the top — if officerId resolves, use that officer's portrait. */
  speakerOfficerId?: EntityId;
  /** Fallback speaker label if no officer attached. */
  speaker?: BilingualName;
  /** The body of the event. */
  text: { zh: string; en: string };
  /** 2–4 choices. */
  choices: DialogueChoice[];
  /** Predicate: only fire when satisfied. */
  conditions?: {
    minYear?: number;
    maxYear?: number;
    requiresOfficerActive?: EntityId;
    requiresFlag?: string;
  };
}
