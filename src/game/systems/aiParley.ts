import type { Officer, City, Force, EntityId, GameDate } from '../types';
import { getRelation, type DiplomaticState } from '../types';
import { moonScore, canOrate, pickMoonChallenger } from './scholarRank';
import { pickCourtVoice, canPersuadeCity, PERSUADE_MAX_GARRISON, pickGateKeeper } from './debateDiplomacy';

/**
 * AI 折衝樽俎 (§6.16 對稱) — the debate-diplomacy tables turned back on the
 * player: an enemy realm's famous tongue may ride to YOUR weakly-held wall and
 * argue for its gates (舌戰說降來使), and while the player's champion holds the
 * 月旦評 laurel, rival scholars send writs demanding a bout (月旦來辯).
 * Pure tick logic; the store stores the pending affairs and the player answers
 * them interactively (or lets them lapse, at a cost).
 */

// ─── AI 舌戰說降 — an enemy envoy argues at your wall ─────────────────────────

export interface PendingPersuasion {
  /** The realm that sent the tongue. */
  fromForceId: EntityId;
  /** The AI envoy at the wall. */
  envoyId: EntityId;
  /** Your city being argued at. */
  cityId: EntityId;
  /** Your best voice present (the defender the bout will field). */
  defenderId: EntityId;
  /** Season the unanswered envoy gives up and the affair auto-resolves. */
  expiresAt: GameDate;
}

export const AI_PERSUADE_CHANCE = 0.12; // per season, at most one standing affair
/** A tongue worth sending — no realm wastes an envoy on a mumbling clerk. */
export const AI_PERSUADE_MIN_SCORE = 75;

/**
 * Scan for an AI realm that would send a persuading envoy to a weakly-held
 * player wall this season. At most one affair stands at a time. Pure.
 */
export function tickAIPersuasions(input: {
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  diplomacy: DiplomaticState;
  playerForceId: EntityId | null | undefined;
  existing: PendingPersuasion[];
  expiresAt: GameDate;
  rng?: () => number;
}): PendingPersuasion | null {
  const { forces, cities, officers, diplomacy, playerForceId, existing, expiresAt } = input;
  if (!playerForceId || !forces[playerForceId]) return null;
  if (existing.length > 0) return null; // one envoy at the walls at a time
  const rng = input.rng ?? Math.random;
  if (rng() >= AI_PERSUADE_CHANCE) return null;
  const player = forces[playerForceId];

  // Your weakly-held, non-capital walls — the ones an argument could open.
  const targets = Object.values(cities).filter((c) =>
    c.ownerForceId === playerForceId && canPersuadeCity(c, player.capitalCityId === c.id).ok);
  if (!targets.length) return null;

  // A rival realm with a famous tongue and no pact staying its hand.
  const senders = Object.values(forces).filter((f) => {
    if (f.id === playerForceId || f.vassalOfForceId === playerForceId) return false;
    const rel = getRelation(diplomacy, f.id, playerForceId);
    if (rel.status !== 'neutral') return false; // pacts stay the tongue like the sword
    const voice = pickCourtVoice(officers, f.id);
    return !!voice && moonScore(voice) >= AI_PERSUADE_MIN_SCORE;
  });
  if (!senders.length) return null;

  const from = senders[Math.floor(rng() * senders.length)];
  const envoy = pickCourtVoice(officers, from.id);
  if (!envoy) return null;
  const city = targets[Math.floor(rng() * targets.length)];
  const defender = pickGateKeeper(officers, city.id, playerForceId);
  if (!defender) return null;
  return { fromForceId: from.id, envoyId: envoy.id, cityId: city.id, defenderId: defender.id, expiresAt };
}

/** 拒之門外 — turning the envoy away unheard still stings the wall's pride. */
export const PERSUASION_REFUSE_LOYALTY = 6;

// ─── 月旦來辯 — a rival scholar sends a writ for the laurel ──────────────────

export interface PendingMoonWrit {
  /** The rival tongue demanding a bout for the 魁首. */
  challengerId: EntityId;
  /** Season the unanswered writ lapses — ducking it costs face. */
  expiresAt: GameDate;
}

export const MOON_WRIT_CHANCE = 0.3; // per season while the player holds the laurel
/** 避辯之損 — renown the holder forfeits (and the scorner gains) on a duck. */
export const MOON_WRIT_DUCK_RENOWN = 3;

/**
 * While the PLAYER's officer holds the 月旦評 laurel, a rival scholar may send
 * word demanding a bout. Returns the writ, or null. Pure.
 */
export function tickMoonWrit(input: {
  officers: Record<EntityId, Officer>;
  holderId: EntityId | undefined;
  playerForceId: EntityId | null | undefined;
  existing: PendingMoonWrit | undefined;
  expiresAt: GameDate;
  rng?: () => number;
}): PendingMoonWrit | null {
  const { officers, holderId, playerForceId, existing, expiresAt } = input;
  if (!holderId || !playerForceId || existing) return null;
  const holder = officers[holderId];
  if (!holder || holder.forceId !== playerForceId || !canOrate(holder)) return null;
  const rng = input.rng ?? Math.random;
  if (rng() >= MOON_WRIT_CHANCE) return null;
  const challenger = pickMoonChallenger(officers, holderId, rng);
  if (!challenger || challenger.forceId === playerForceId) return null; // a housemate spars, not writs
  return { challengerId: challenger.id, expiresAt };
}

export { PERSUADE_MAX_GARRISON };
