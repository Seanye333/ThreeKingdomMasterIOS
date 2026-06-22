import type { EntityId, Officer } from '../types';
import { pairKey } from '../types/diplomacy';
import type { OathBond } from '../data/bonds';
import { buildingBonuses } from './buildings';

/**
 * Rapport (好感) — a pairwise 0–100 affinity the player grows through social
 * actions (結交/宴請/贈禮). When a pair reaches the threshold they swear a bond
 * (義結金蘭), which the rest of the game already understands (loyalty floor,
 * battle synergy, no defection). This is the RTK13 "rapport → bond" loop.
 */
export const RAPPORT_BOND_THRESHOLD = 100;

export function getRapport(rapport: Record<string, number>, a: EntityId, b: EntityId): number {
  return rapport[pairKey(a, b)] ?? 0;
}

/**
 * Raise the rapport between two officers. If it reaches the threshold and they
 * aren't already bonded, return a freshly-forged 義結 bond to push into
 * runtimeBonds. Rapport is capped at the threshold.
 */
export function addRapport(
  rapport: Record<string, number>,
  a: EntityId,
  b: EntityId,
  amount: number,
  alreadyBonded: boolean,
  label = '義結金蘭 Sworn Bond',
): { rapport: Record<string, number>; forged: OathBond | null } {
  if (a === b) return { rapport, forged: null };
  const key = pairKey(a, b);
  const next = Math.min(RAPPORT_BOND_THRESHOLD, (rapport[key] ?? 0) + amount);
  const out = { ...rapport, [key]: next };
  const forged: OathBond | null =
    next >= RAPPORT_BOND_THRESHOLD && !alreadyBonded
      ? { officerA: a, officerB: b, floor: 75, kind: 'oath', label }
      : null;
  return { rapport: out, forged };
}

/** Pairwise rapport bump across a set of officers (e.g. everyone at a banquet). */
export function mingleRapport(
  rapport: Record<string, number>,
  officerIds: EntityId[],
  amount: number,
): Record<string, number> {
  let out = rapport;
  for (let i = 0; i < officerIds.length; i++) {
    for (let j = i + 1; j < officerIds.length; j++) {
      const key = pairKey(officerIds[i], officerIds[j]);
      out = { ...out, [key]: Math.min(RAPPORT_BOND_THRESHOLD, (out[key] ?? 0) + amount) };
    }
  }
  return out;
}

export interface ProximityRapportInput {
  rapport: Record<string, number>;
  officers: Record<EntityId, Officer>;
  /** pairKeys that already hold a bond — won't re-forge. */
  bondedPairs: Set<string>;
  /** Rapport gained per season by officers serving together (default 2). */
  amount?: number;
  /** City buildings — a 酒肆 (tavern) speeds rapport growth in that city. */
  buildings?: import('../types').Building[];
}

/**
 * Organic rapport (同袍之誼) — officers of the same force serving together in
 * the same city slowly warm to one another each season. When a pair crosses
 * the threshold they swear a bond of their own accord. Runs for every force,
 * so ties (and eventually sworn brotherhoods) form naturally on both sides
 * without anyone spending gold. Pure.
 */
export function growRapportFromProximity(
  input: ProximityRapportInput,
): { rapport: Record<string, number>; forged: OathBond[] } {
  const amount = input.amount ?? 2;
  // Group living, placed officers by force + city.
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
  for (const [gk, ids] of groups.entries()) {
    if (ids.length < 2) continue;
    // 酒肆 — a tavern in this city quickens the bonding (gk = `${forceId}@${cityId}`).
    const cityId = gk.slice(gk.indexOf('@') + 1);
    const cityAmount = amount * buildingBonuses(cityId, input.buildings ?? []).rapportMul;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = pairKey(ids[i], ids[j]);
        const next = Math.min(RAPPORT_BOND_THRESHOLD, (rapport[key] ?? 0) + cityAmount);
        rapport = { ...rapport, [key]: next };
        if (next >= RAPPORT_BOND_THRESHOLD && !input.bondedPairs.has(key) && !justForged.has(key)) {
          justForged.add(key);
          forged.push({ officerA: ids[i], officerB: ids[j], floor: 75, kind: 'oath', label: '同袍之誼 Comrades-in-arms' });
        }
      }
    }
  }
  return { rapport, forged };
}
