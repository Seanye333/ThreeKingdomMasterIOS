/**
 * 君主性格 — force-level AI personality knobs.
 *
 * RulerPersonalityDef already carries marchWeight/diplomacyWeight/etc., but those
 * were largely unplugged. These small, bounded multipliers give the 8 personalities
 * a visibly distinct strategic temperament without touching save state (all are
 * read-only lookups keyed off `force.personality`, defaulting to 'opportunist').
 */
import type { RulerPersonality } from '../types';

/** Multiplier on a force's attack-feasibility threshold — higher = attacks on
 *  thinner margins (more aggressive); lower = only very safe strikes. */
export const PERSONALITY_ATTACK_MUL: Record<RulerPersonality, number> = {
  aggressive: 1.25,
  tyrant: 1.35,
  expansionist: 1.15,
  opportunist: 1.10,
  scholar: 0.90,
  hesitant: 0.85,
  defensive: 0.75,
  cautious: 0.65,
};

/** Appetite for seeking diplomacy (NAP/alliance). >1 = courts peace readily;
 *  <1 = scorns it (warmongers). */
export const PERSONALITY_DIPLOMACY_APPETITE: Record<RulerPersonality, number> = {
  cautious: 1.4,
  defensive: 1.3,
  opportunist: 1.2,
  hesitant: 1.1,
  scholar: 1.0,
  expansionist: 0.6,
  aggressive: 0.5,
  tyrant: 0.3,
};

export function personalityAttackMul(p: RulerPersonality | undefined): number {
  return PERSONALITY_ATTACK_MUL[p ?? 'opportunist'] ?? 1.0;
}

export function personalityDiplomacyAppetite(p: RulerPersonality | undefined): number {
  return PERSONALITY_DIPLOMACY_APPETITE[p ?? 'opportunist'] ?? 1.0;
}
