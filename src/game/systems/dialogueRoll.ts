import type { DialogueEvent, EntityId, Officer } from '../types';
import { DIALOGUE_EVENTS } from '../data/dialogues';

const DIALOGUE_CHANCE_PER_SEASON = 0.08;

export interface DialogueRollContext {
  year: number;
  officers: Record<EntityId, Officer>;
  eventFlags: Record<string, boolean>;
  rng: () => number;
}

/**
 * Roll for a dialogue event this season. Returns one if rolled, else null.
 * Filters by year ranges and officer-alive / flag conditions.
 */
export function rollDialogue(ctx: DialogueRollContext): DialogueEvent | null {
  if (ctx.rng() > DIALOGUE_CHANCE_PER_SEASON) return null;
  const eligible = DIALOGUE_EVENTS.filter((d) => {
    const c = d.conditions;
    if (!c) return true;
    if (c.minYear !== undefined && ctx.year < c.minYear) return false;
    if (c.maxYear !== undefined && ctx.year > c.maxYear) return false;
    if (c.requiresOfficerActive) {
      const o = ctx.officers[c.requiresOfficerActive];
      if (!o || o.status === 'dead' || o.status === 'imprisoned') return false;
    }
    if (c.requiresFlag && !ctx.eventFlags[c.requiresFlag]) return false;
    return true;
  });
  if (eligible.length === 0) return null;
  return eligible[Math.floor(ctx.rng() * eligible.length)];
}
