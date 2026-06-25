import type { EntityId, Officer } from '../types';
import { pairKey } from '../types/diplomacy';
import type { OathBond } from '../data/bonds';
import { buildingBonuses } from './buildings';

/**
 * Rapport (好感) — a pairwise BIPOLAR −100..100 affinity. The positive half is
 * grown through social actions (結交/宴請/贈禮) and co-service; the negative half
 * (嫌隙) accrues from friction (see friction.ts) and 離間計. When a pair reaches
 * +100 they swear a bond (義結金蘭); at −100 they forge a 宿怨 (feud). Either way
 * the rest of the game understands the outcome (loyalty floor, battle synergy,
 * defection). This is the RTK "rapport → bond" loop, now two-sided.
 */
export const RAPPORT_BOND_THRESHOLD = 100;
export const RAPPORT_FEUD_THRESHOLD = -100;
export const RAPPORT_MAX = 100;
export const RAPPORT_MIN = -100;

/** Clamp a rapport value to the bipolar range. */
export function clampRapport(v: number): number {
  return Math.max(RAPPORT_MIN, Math.min(RAPPORT_MAX, v));
}

export function getRapport(rapport: Record<string, number>, a: EntityId, b: EntityId): number {
  return rapport[pairKey(a, b)] ?? 0;
}

// ─────────────────────────────────────────────────────────────────────
// 君臣好感 (lord rapport) — an officer's feeling toward their CURRENT lord,
// distinct from raw loyalty. Keyed by officerId (−100..100). High → 心腹
// (defection-proof, pre-warns of plots); low/negative → feeds ambition and
// eases an enemy's 策反. Built by attention (banquets, granted wishes, 結交
// with the lord); decays toward 0 and resets when an officer changes lord.
// ─────────────────────────────────────────────────────────────────────

/** 好感 ≥ this and the officer is a 心腹 (confidant): will never defect, and
 *  warns the lord of brewing plots. */
export const CONFIDANT_THRESHOLD = 80;

export function getLordRapport(lordRapport: Record<EntityId, number>, officerId: EntityId): number {
  return lordRapport[officerId] ?? 0;
}

export function addLordRapport(
  lordRapport: Record<EntityId, number>,
  officerId: EntityId,
  amount: number,
): Record<EntityId, number> {
  return { ...lordRapport, [officerId]: clampRapport((lordRapport[officerId] ?? 0) + amount) };
}

export function isConfidant(lordRapport: Record<EntityId, number>, officerId: EntityId): boolean {
  return getLordRapport(lordRapport, officerId) >= CONFIDANT_THRESHOLD;
}

/** Season upkeep — lord rapport eases toward 0 (the lord must keep earning it)
 *  and entries for the dead are dropped. Sparse: 0 entries removed. */
export function decayLordRapport(
  lordRapport: Record<EntityId, number>,
  officers: Record<EntityId, Officer>,
  amount = 1,
): Record<EntityId, number> {
  const out: Record<EntityId, number> = {};
  for (const [id, value] of Object.entries(lordRapport)) {
    const o = officers[id];
    if (!o || o.status === 'dead') continue; // drop the departed
    const next = value > 0 ? Math.max(0, value - amount) : Math.min(0, value + amount);
    if (next !== 0) out[id] = next;
  }
  return out;
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
  const next = clampRapport((rapport[key] ?? 0) + amount);
  const out = { ...rapport, [key]: next };
  const forged: OathBond | null =
    next >= RAPPORT_BOND_THRESHOLD && !alreadyBonded
      ? { officerA: a, officerB: b, floor: 75, kind: 'oath', label, depth: 1, sharedSeasons: 0 }
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
      out = { ...out, [key]: clampRapport((out[key] ?? 0) + amount) };
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
        // A sworn bond / 宿怨 locks the pair's rapport at its pole — warmth no
        // longer nudges it, so we leave already-bonded/feuding pairs untouched.
        if (input.bondedPairs.has(key)) continue;
        const next = clampRapport((rapport[key] ?? 0) + cityAmount);
        rapport = { ...rapport, [key]: next };
        if (next >= RAPPORT_BOND_THRESHOLD && !justForged.has(key)) {
          justForged.add(key);
          forged.push({ officerA: ids[i], officerB: ids[j], floor: 75, kind: 'oath', label: '同袍之誼 Comrades-in-arms', depth: 1, sharedSeasons: 0 });
        }
      }
    }
  }
  return { rapport, forged };
}

export interface DecayRapportInput {
  rapport: Record<string, number>;
  officers: Record<EntityId, Officer>;
  /** pairKeys holding a bond OR feud — these never silently dissolve. */
  bondedPairs: Set<string>;
  /** Magnitude pulled toward 0 per season for out-of-contact pairs (default 1). */
  amount?: number;
}

/**
 * Rapport upkeep — pairs NOT currently serving together (different city or
 * force, or one is gone) slowly cool toward 0 each season. Bonded/feuding pairs
 * are skipped: a sworn brotherhood or blood feud does not fade just because the
 * two are posted apart. This gives 結交/宴請 an ongoing reason to exist — warmth
 * (and enmity) must be maintained, not banked once. Sparse: zero entries are
 * dropped from the map. Pure.
 */
export function decayRapport(input: DecayRapportInput): Record<string, number> {
  const amount = input.amount ?? 1;
  // Co-located pairKeys (same force + city, both placed & not dead/imprisoned).
  const groups = new Map<string, EntityId[]>();
  for (const o of Object.values(input.officers)) {
    if (!o.forceId || !o.locationCityId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned' || o.status === 'unsearched') continue;
    const gk = `${o.forceId}@${o.locationCityId}`;
    const arr = groups.get(gk) ?? [];
    arr.push(o.id);
    groups.set(gk, arr);
  }
  const coLocated = new Set<string>();
  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) coLocated.add(pairKey(ids[i], ids[j]));
    }
  }

  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(input.rapport)) {
    if (coLocated.has(key) || input.bondedPairs.has(key)) {
      out[key] = value; // maintained by contact, or locked by a bond/feud
      continue;
    }
    // Pull toward 0; drop entries that reach (near) 0 to keep the map sparse.
    const next = value > 0 ? Math.max(0, value - amount) : Math.min(0, value + amount);
    if (next !== 0) out[key] = next;
  }
  return out;
}
