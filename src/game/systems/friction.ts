import type { EntityId, Officer, Building } from '../types';
import { pairKey } from '../types/diplomacy';
import type { OathBond } from '../data/bonds';
import { clampRapport, RAPPORT_FEUD_THRESHOLD } from './rapport';
import { areRivals, arePersonalEnemies } from './relationshipEffects';

/**
 * 嫌隙與宿怨 (friction → feud) — the negative half of the rapport axis.
 *
 * Where rapport.ts grows warmth between co-serving officers, this accrues the
 * cold half: abrasive personalities chafing, static rivals/enemies heating up,
 * the resentment of the aggrieved. It writes the SAME `state.rapport` record
 * (now bipolar −100..100), pushing pairs negative. When a pair sinks to
 * −100 they forge a 宿怨 (a `kind:'feud'` OathBond) — the mirror of 義結.
 *
 * Pure. Bonded/feuding pairs are skipped: sworn brothers don't drift into
 * enmity by mere proximity, and an existing feud is already at its pole.
 */

/** Traits that breed friction with peers (abrasive / prickly / grasping). */
const ABRASIVE = new Set<string>([
  'arrogant', 'haughty', 'aloof', 'vainglorious', 'jealous', 'envious',
  'wrathful', 'vengeful', 'cruel', 'hot-tempered', 'oath-breaker', 'greedy',
]);

function abrasiveCount(o: Officer): number {
  const ts = (o.traits as string[] | undefined) ?? [];
  let n = 0;
  for (const t of ts) if (ABRASIVE.has(t)) n++;
  return n;
}

export interface ProximityFrictionInput {
  rapport: Record<string, number>;
  officers: Record<EntityId, Officer>;
  /** pairKeys already holding ANY bond or feud — skipped (locked at a pole). */
  bondedPairs: Set<string>;
  /** Base friction magnitude per season (default 2). */
  amount?: number;
  /** City buildings — a 酒肆 (tavern) eases friction the way it speeds warmth. */
  buildings?: Building[];
}

/** How much friction a co-serving pair generates this season (a positive
 *  magnitude; the caller subtracts it). 0 = they get along fine. */
export function frictionDriversFor(a: Officer, b: Officer, base: number): number {
  let f = 0;
  const aAbr = abrasiveCount(a);
  const bAbr = abrasiveCount(b);
  // Two prickly egos clash hardest; one abrasive officer still rubs the other.
  if (aAbr > 0 && bAbr > 0) f += base * 1.5;
  else if (aAbr > 0 || bAbr > 0) f += base * 0.5;
  // Lore rivals / personal enemies forced to share a roof grate worse.
  if (arePersonalEnemies(a.id, b.id)) f += 4;
  else if (areRivals(a.id, b.id)) f += 3;
  // Grudge-holders sour the room.
  if ((a.grievanceCount ?? 0) >= 2) f += 1;
  if ((b.grievanceCount ?? 0) >= 2) f += 1;
  return f;
}

export function growFrictionFromProximity(
  input: ProximityFrictionInput,
): { rapport: Record<string, number>; forged: OathBond[] } {
  const base = input.amount ?? 2;
  // Group living, placed officers by force + city (same shape as rapport.ts).
  const groups = new Map<string, EntityId[]>();
  for (const o of Object.values(input.officers)) {
    if (!o.forceId || !o.locationCityId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned' || o.status === 'unsearched') continue;
    const gk = `${o.forceId}@${o.locationCityId}`;
    const arr = groups.get(gk) ?? [];
    arr.push(o.id);
    groups.set(gk, arr);
  }

  let rapport = input.rapport;
  const forged: OathBond[] = [];
  const justForged = new Set<string>();
  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = input.officers[ids[i]], b = input.officers[ids[j]];
        const key = pairKey(ids[i], ids[j]);
        if (input.bondedPairs.has(key)) continue; // locked at a pole
        const drivers = frictionDriversFor(a, b, base);
        if (drivers <= 0) continue;
        const next = clampRapport((rapport[key] ?? 0) - drivers);
        rapport = { ...rapport, [key]: next };
        if (next <= RAPPORT_FEUD_THRESHOLD && !justForged.has(key)) {
          justForged.add(key);
          forged.push({
            officerA: ids[i], officerB: ids[j], floor: 0, kind: 'feud',
            label: '宿怨 Blood Feud', depth: 1, sharedSeasons: 0,
          });
        }
      }
    }
  }
  return { rapport, forged };
}

/**
 * Apply a one-off friction hit to a single pair (e.g. losing face in a 演武
 * duel, or a successful 離間計). Mirror of addRapport with a negative amount,
 * but forges a `feud` (not a bond) at the negative threshold. `alreadyFeuding`
 * suppresses re-forging.
 */
export function addFriction(
  rapport: Record<string, number>,
  a: EntityId,
  b: EntityId,
  amount: number,
  alreadyFeuding: boolean,
  label = '宿怨 Blood Feud',
): { rapport: Record<string, number>; forged: OathBond | null } {
  if (a === b) return { rapport, forged: null };
  const key = pairKey(a, b);
  const next = clampRapport((rapport[key] ?? 0) - Math.abs(amount));
  const out = { ...rapport, [key]: next };
  const forged: OathBond | null =
    next <= RAPPORT_FEUD_THRESHOLD && !alreadyFeuding
      ? { officerA: a, officerB: b, floor: 0, kind: 'feud', label, depth: 1, sharedSeasons: 0 }
      : null;
  return { rapport: out, forged };
}

/** Rapport at or above which a formal 宿怨 (feud bond) is considered mended. */
export const FEUD_MEND_THRESHOLD = -50;

/**
 * 化解 — warm a soured pair back toward neutrality (the only exit a feud has).
 * Raises their rapport by `amount`; if a 宿怨 (feud bond) exists and the rapport
 * climbs to FEUD_MEND_THRESHOLD or above, the formal feud dissolves (mere 嫌隙
 * may linger). Used by the 調解 command and by 演武 sparring between rivals. Pure.
 */
export function reconcilePair(
  rapport: Record<string, number>,
  runtimeBonds: OathBond[],
  a: EntityId,
  b: EntityId,
  amount: number,
): { rapport: Record<string, number>; runtimeBonds: OathBond[]; dissolved: boolean } {
  if (a === b) return { rapport, runtimeBonds, dissolved: false };
  const key = pairKey(a, b);
  const next = clampRapport((rapport[key] ?? 0) + Math.abs(amount));
  const outRapport = { ...rapport, [key]: next };
  let outBonds = runtimeBonds;
  let dissolved = false;
  if (next >= FEUD_MEND_THRESHOLD) {
    const before = runtimeBonds.length;
    outBonds = runtimeBonds.filter((bd) =>
      !(bd.kind === 'feud' &&
        ((bd.officerA === a && bd.officerB === b) || (bd.officerA === b && bd.officerB === a))));
    dissolved = outBonds.length < before;
  }
  return { rapport: outRapport, runtimeBonds: outBonds, dissolved };
}
