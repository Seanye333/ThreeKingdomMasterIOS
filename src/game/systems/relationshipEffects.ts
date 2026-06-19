/**
 * Mechanical effects of inter-officer relationships. Mirrors the
 * `traitEffects.ts` pattern: a central module that other systems consult
 * to derive bonuses / penalties from FAMILY_LINEAGE + OFFICER_RELATIONSHIPS
 * (+ runtime FamilyRelation entries).
 *
 * Until now the 因緣 panel was pure flavor. This module wires each
 * relationship kind into concrete gameplay effects:
 *   - sworn-brothers : combat bonus when on same side; grief on death
 *   - rival          : combat bonus when fighting each other; XP on win
 *   - mentor-student : student gains policies/tactics by exposure
 *   - master-servant : servant loyalty floor; suicide on master's death
 *   - romantic       : spouse grief on death
 *   - enemy          : refuses recruit; aggressive duel
 *   - family ties    : same-force bond; grief on death
 */
import type { EntityId, Officer } from '../types';
import type { FamilyRelation } from '../types/family';
import type { OathBond } from '../data/bonds';
import { OFFICER_RELATIONSHIPS, type OfficerRelationship } from '../data/relationships';
import { FAMILY_LINEAGE } from '../data/familyLineage';

/** Runtime bond kinds that count as a sworn-brother tie (義兄弟): the 結拜
 *  ceremony forges 'sibling', rapport milestones forge 'oath'. Both grant the
 *  same-side combat synergy and loyalty floor a hard-coded sworn pair would. */
function isSwornBondKind(kind: OathBond['kind']): boolean {
  return kind === 'sibling' || kind === 'oath';
}

/** True if a runtime bond list ties A and B as sworn brothers. */
export function runtimeSwornPair(a: EntityId, b: EntityId, bonds: OathBond[] = []): boolean {
  return bonds.some(
    (bd) =>
      isSwornBondKind(bd.kind) &&
      ((bd.officerA === a && bd.officerB === b) || (bd.officerA === b && bd.officerB === a)),
  );
}

/** Build a map of {officerId → all relationships involving them}. Memoized
 *  on first call; OFFICER_RELATIONSHIPS is static so this is safe. */
let _relIndexCache: Map<EntityId, OfficerRelationship[]> | null = null;
function relIndex(): Map<EntityId, OfficerRelationship[]> {
  if (_relIndexCache) return _relIndexCache;
  const m = new Map<EntityId, OfficerRelationship[]>();
  for (const r of OFFICER_RELATIONSHIPS) {
    if (!m.has(r.a)) m.set(r.a, []);
    if (!m.has(r.b)) m.set(r.b, []);
    m.get(r.a)!.push(r);
    m.get(r.b)!.push(r);
  }
  _relIndexCache = m;
  return m;
}

/** All relationships involving an officer (both directions). */
export function relationsOf(officerId: EntityId): OfficerRelationship[] {
  return relIndex().get(officerId) ?? [];
}

/** Get all sworn brothers of an officer (other officer ids). */
export function swornBrothersOf(officerId: EntityId): EntityId[] {
  return relationsOf(officerId)
    .filter((r) => r.kind === 'sworn-brothers')
    .map((r) => (r.a === officerId ? r.b : r.a));
}

/** Get all rivals (mutual relationship). */
export function rivalsOf(officerId: EntityId): EntityId[] {
  return relationsOf(officerId)
    .filter((r) => r.kind === 'rival')
    .map((r) => (r.a === officerId ? r.b : r.a));
}

/** Personal enemies — won't be recruited by them, duel aggressively. */
export function personalEnemiesOf(officerId: EntityId): EntityId[] {
  return relationsOf(officerId)
    .filter((r) => r.kind === 'enemy')
    .map((r) => (r.a === officerId ? r.b : r.a));
}

/** All this officer's "masters" — they serve them faithfully. */
export function mastersOf(officerId: EntityId): EntityId[] {
  // In OFFICER_RELATIONSHIPS, `a` is the master, `b` is the servant.
  return relationsOf(officerId)
    .filter((r) => r.kind === 'master-servant' && r.b === officerId)
    .map((r) => r.a);
}

/** All this officer's "servants" — sworn followers. */
export function servantsOf(officerId: EntityId): EntityId[] {
  return relationsOf(officerId)
    .filter((r) => r.kind === 'master-servant' && r.a === officerId)
    .map((r) => r.b);
}

/** Mentors of this officer (other = mentor). */
export function mentorsOf(officerId: EntityId): EntityId[] {
  // `a` is the mentor, `b` is the student.
  return relationsOf(officerId)
    .filter((r) => r.kind === 'mentor-student' && r.b === officerId)
    .map((r) => r.a);
}

/** Students of this officer. */
export function studentsOf(officerId: EntityId): EntityId[] {
  return relationsOf(officerId)
    .filter((r) => r.kind === 'mentor-student' && r.a === officerId)
    .map((r) => r.b);
}

/** Romantic partner(s) — usually 1, often equals spouse but not always. */
export function romanticPartnersOf(officerId: EntityId): EntityId[] {
  return relationsOf(officerId)
    .filter((r) => r.kind === 'romantic')
    .map((r) => (r.a === officerId ? r.b : r.a));
}

// ─────────────────────────────────────────────────────────────────────
// Family helpers — combine FAMILY_LINEAGE + runtime state.family
// ─────────────────────────────────────────────────────────────────────

/** All family relations (static + runtime) involving an officer. */
export function familyOf(
  officerId: EntityId,
  runtimeFamily: FamilyRelation[],
): FamilyRelation[] {
  const seen = new Set<string>();
  const out: FamilyRelation[] = [];
  for (const f of [...runtimeFamily, ...FAMILY_LINEAGE]) {
    if (f.officerA !== officerId && f.officerB !== officerId) continue;
    const key = `${f.officerA}|${f.officerB}|${f.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

export function parentsOf(officerId: EntityId, family: FamilyRelation[]): EntityId[] {
  return familyOf(officerId, family)
    .filter((f) => f.kind === 'parent-child' && f.officerB === officerId)
    .map((f) => f.officerA);
}
export function childrenOf(officerId: EntityId, family: FamilyRelation[]): EntityId[] {
  return familyOf(officerId, family)
    .filter((f) => f.kind === 'parent-child' && f.officerA === officerId)
    .map((f) => f.officerB);
}
export function spousesOf(officerId: EntityId, family: FamilyRelation[]): EntityId[] {
  return familyOf(officerId, family)
    .filter((f) => f.kind === 'spouse')
    .map((f) => (f.officerA === officerId ? f.officerB : f.officerA));
}
export function siblingsOf(officerId: EntityId, family: FamilyRelation[]): EntityId[] {
  return familyOf(officerId, family)
    .filter((f) => f.kind === 'sibling')
    .map((f) => (f.officerA === officerId ? f.officerB : f.officerA));
}

/** True if A and B are family in any direction. */
export function areFamily(a: EntityId, b: EntityId, family: FamilyRelation[]): boolean {
  return [...family, ...FAMILY_LINEAGE].some(
    (f) =>
      (f.officerA === a && f.officerB === b) ||
      (f.officerA === b && f.officerB === a),
  );
}

/** True if A and B sworn brothers — by static lore OR a runtime 結拜 bond. */
export function areSwornBrothers(a: EntityId, b: EntityId, runtimeBonds: OathBond[] = []): boolean {
  if (runtimeSwornPair(a, b, runtimeBonds)) return true;
  return OFFICER_RELATIONSHIPS.some(
    (r) =>
      r.kind === 'sworn-brothers' &&
      ((r.a === a && r.b === b) || (r.a === b && r.b === a)),
  );
}

/** True if A and B are rivals. */
export function areRivals(a: EntityId, b: EntityId): boolean {
  return OFFICER_RELATIONSHIPS.some(
    (r) =>
      r.kind === 'rival' &&
      ((r.a === a && r.b === b) || (r.a === b && r.b === a)),
  );
}

/** True if A and B are personal enemies. */
export function arePersonalEnemies(a: EntityId, b: EntityId): boolean {
  return OFFICER_RELATIONSHIPS.some(
    (r) =>
      r.kind === 'enemy' &&
      ((r.a === a && r.b === b) || (r.a === b && r.b === a)),
  );
}

// ─────────────────────────────────────────────────────────────────────
// Combat bonus aggregator
// ─────────────────────────────────────────────────────────────────────

export interface RelationshipCombatBonus {
  /** Power multiplier for the SIDE (averaged across pool). */
  powerMul: number;
  /** Bonus morale floor when fighting alongside someone (sworn/family). */
  moraleResist: number;
}

/**
 * Compute side-level combat bonuses from inter-officer relationships
 * within a pool. Family + sworn brothers boost the side; rivals on
 * opposite sides boost BOTH sides slightly (chivalric duel energy).
 */
export function sidePoolRelationshipBonus(
  pool: Officer[],
  family: FamilyRelation[],
  runtimeBonds: OathBond[] = [],
): RelationshipCombatBonus {
  if (pool.length < 2) return { powerMul: 1.0, moraleResist: 0 };
  let powerMul = 1.0;
  let moraleResist = 0;
  // Count distinct relationship pairs within pool
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i].id, b = pool[j].id;
      if (areSwornBrothers(a, b, runtimeBonds)) {
        powerMul *= 1.06;
        moraleResist += 0.10;
      }
      if (areFamily(a, b, family)) {
        powerMul *= 1.04;
        moraleResist += 0.05;
      }
    }
  }
  // Compress
  powerMul = 1 + (powerMul - 1) * 0.75;
  moraleResist = Math.min(0.5, moraleResist);
  return { powerMul, moraleResist };
}

/** Cross-side rival bonus — when commanders of opposing sides are rivals,
 *  BOTH sides get attack +10% (matched-rival fervor). */
export function rivalShowdownMultiplier(commanderA: Officer | null, commanderB: Officer | null): number {
  if (!commanderA || !commanderB) return 1.0;
  if (areRivals(commanderA.id, commanderB.id)) return 1.10;
  return 1.0;
}

// ─────────────────────────────────────────────────────────────────────
// Loyalty floor + grief
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns the minimum loyalty floor this officer should never fall below
 * while their bonded counterpart is alive and serves the same force.
 * Folds in what the old OATH_BONDS system used to do (loyalty floor for
 * sworn brothers, family ties, master-servant) — now driven entirely by
 * FAMILY_LINEAGE + OFFICER_RELATIONSHIPS.
 *
 * Tiers:
 *   95 — sworn-brothers, parent/child, spouse
 *   90 — siblings, master-servant (servant side), mentor-student
 *   80 — sworn-brother passively (kept for backward compat)
 */
export function loyaltyFloor(
  officer: Officer,
  officersById: Record<EntityId, Officer>,
  family: FamilyRelation[] = [],
  runtimeBonds: OathBond[] = [],
): number {
  let floor = 0;
  const sameForceAlive = (id: EntityId) => {
    const o = officersById[id];
    return !!o && o.status !== 'dead' && o.forceId === officer.forceId;
  };
  // Strongest: sworn brothers — 95 (桃園 / 江東小霸王 etc.)
  for (const id of swornBrothersOf(officer.id)) {
    if (sameForceAlive(id)) floor = Math.max(floor, 95);
  }
  // Runtime 結拜 sworn brothers (義兄弟 forged in-game) — 90.
  for (const bd of runtimeBonds) {
    if (!isSwornBondKind(bd.kind)) continue;
    const otherId = bd.officerA === officer.id ? bd.officerB
      : bd.officerB === officer.id ? bd.officerA : null;
    if (otherId && sameForceAlive(otherId)) floor = Math.max(floor, 90);
  }
  // Family ties — close kin keep loyalty high
  for (const f of [...family, ...FAMILY_LINEAGE]) {
    if (f.officerA !== officer.id && f.officerB !== officer.id) continue;
    const otherId = f.officerA === officer.id ? f.officerB : f.officerA;
    if (!sameForceAlive(otherId)) continue;
    if (f.kind === 'spouse' || f.kind === 'parent-child') {
      floor = Math.max(floor, 95);
    } else if (f.kind === 'sibling') {
      floor = Math.max(floor, 90);
    }
  }
  // Master-servant — servant side gets 90
  for (const masterId of mastersOf(officer.id)) {
    if (sameForceAlive(masterId)) floor = Math.max(floor, 90);
  }
  // Mentor-student — student loyalty floor
  for (const mentorId of mentorsOf(officer.id)) {
    if (sameForceAlive(mentorId)) floor = Math.max(floor, 90);
  }
  return floor;
}

/** When an officer dies, every officer they had a deep bond with (sworn
 *  brother, family, master, romantic partner) takes a loyalty hit.
 *  Returns array of {targetId, delta, reasonZh, reasonEn}. */
export interface GriefEffect {
  targetId: EntityId;
  delta: number;          // negative
  reasonZh: string;
  reasonEn: string;
}
export function griefOnDeath(
  deceasedId: EntityId,
  deceasedNameZh: string,
  deceasedNameEn: string,
  family: FamilyRelation[],
): GriefEffect[] {
  const out: GriefEffect[] = [];
  const seen = new Set<EntityId>();
  const add = (id: EntityId, delta: number, zh: string, en: string) => {
    if (seen.has(id)) return; // avoid double-dipping
    seen.add(id);
    out.push({ targetId: id, delta, reasonZh: zh, reasonEn: en });
  };
  // Sworn brothers — biggest loyalty hit, may rage
  for (const id of swornBrothersOf(deceasedId)) {
    add(id, -20, `義兄弟${deceasedNameZh}陣亡 — 悲憤難當`, `Sworn brother ${deceasedNameEn} fell — grief and rage`);
  }
  // Romantic partner — heart-rending
  for (const id of romanticPartnersOf(deceasedId)) {
    add(id, -15, `${deceasedNameZh}逝 — 心痛欲絕`, `${deceasedNameEn} passed — heartbroken`);
  }
  // Masters dying causes servant chaos
  for (const id of servantsOf(deceasedId)) {
    add(id, -25, `主公${deceasedNameZh}駕崩 — 痛失依歸`, `Master ${deceasedNameEn} died — bereft of cause`);
  }
  // Family
  for (const f of FAMILY_LINEAGE.concat(family)) {
    if (f.officerA !== deceasedId && f.officerB !== deceasedId) continue;
    const other = f.officerA === deceasedId ? f.officerB : f.officerA;
    if (f.kind === 'spouse') add(other, -18, `配偶${deceasedNameZh}辭世`, `Spouse ${deceasedNameEn} died`);
    if (f.kind === 'parent-child') {
      const isParent = f.officerA === deceasedId; // deceased was parent
      if (isParent) add(other, -12, `${deceasedNameZh}逝 — 父逝失怙`, `${deceasedNameEn} died — bereft of parent`);
      else add(other, -15, `${deceasedNameZh}亡 — 白髮人送黑髮人`, `${deceasedNameEn} died — outliving one's child`);
    }
    if (f.kind === 'sibling') add(other, -10, `${deceasedNameZh}陣亡 — 兄弟之痛`, `Sibling ${deceasedNameEn} died`);
  }
  // Mentor's death is a quieter grief
  for (const id of mentorsOf(deceasedId)) {
    add(id, -8, `學生${deceasedNameZh}先去 — 後繼無人`, `Student ${deceasedNameEn} died first — sad legacy`);
  }
  for (const id of studentsOf(deceasedId)) {
    add(id, -10, `恩師${deceasedNameZh}辭世`, `Mentor ${deceasedNameEn} died`);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Recruit modifiers
// ─────────────────────────────────────────────────────────────────────

/** Negative bonus when the recruiting ruler is a personal enemy of the
 *  prospect — they'd never serve. */
export function recruitRefusalPenalty(
  prospectId: EntityId,
  rulerId: EntityId,
): number {
  if (arePersonalEnemies(prospectId, rulerId)) return -0.8; // near-impossible
  return 0;
}

/** Positive bonus when the recruiting ruler is a sworn brother or family
 *  to the prospect — they'd join eagerly. */
export function recruitKinshipBonus(
  prospectId: EntityId,
  rulerId: EntityId,
  family: FamilyRelation[],
): number {
  if (areSwornBrothers(prospectId, rulerId)) return 0.40;
  if (areFamily(prospectId, rulerId, family)) return 0.30;
  // Master is loyal — easy if you ARE the master
  if (mastersOf(prospectId).includes(rulerId)) return 0.30;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────
// Mentor-student passive transfer
// ─────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────
// X1 — AI awareness: deter from kin-led forces, prefer to recruit kin
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns an attack deterrence factor against a target force based on
 * relationships between the attacker's ruler and the target's ruler.
 *  - 1.0  = no deterrence (attack normally)
 *  - 0.5  = strong hesitation (sworn brothers, family ties)
 *  - 0.2  = nearly forbidden (parent/child or close family)
 *  - 1.2  = aggression boost (personal enemy / blood feud)
 *
 * The caller multiplies their attack-readiness by this — values < 1
 * make AI hesitate, > 1 make them eager.
 */
export function attackDeterrence(
  attackerRulerId: EntityId | undefined,
  defenderRulerId: EntityId | undefined,
  family: FamilyRelation[],
): number {
  if (!attackerRulerId || !defenderRulerId) return 1.0;
  if (attackerRulerId === defenderRulerId) return 1.0;
  // Parent / child / spouse — extreme hesitation
  const directFamily = [...family, ...FAMILY_LINEAGE].some(
    (f) =>
      (f.officerA === attackerRulerId && f.officerB === defenderRulerId) ||
      (f.officerA === defenderRulerId && f.officerB === attackerRulerId),
  );
  if (directFamily) return 0.2;
  // Sworn brothers — strong hesitation
  if (areSwornBrothers(attackerRulerId, defenderRulerId)) return 0.35;
  // Mentor-student bond
  const mentorBond = OFFICER_RELATIONSHIPS.some(
    (r) =>
      r.kind === 'mentor-student' &&
      ((r.a === attackerRulerId && r.b === defenderRulerId) ||
       (r.b === attackerRulerId && r.a === defenderRulerId)),
  );
  if (mentorBond) return 0.5;
  // Personal enemies — extra aggression
  if (arePersonalEnemies(attackerRulerId, defenderRulerId)) return 1.30;
  // Rivals — slight aggression (they want to fight)
  if (areRivals(attackerRulerId, defenderRulerId)) return 1.10;
  return 1.0;
}

/**
 * Per-officer preference score for AI recruiting. Higher = AI will
 * prioritize trying to recruit this officer for the given recruiter.
 *  - +50 if sworn brothers / family / former master of recruiter
 *  - +30 if mentor of recruiter
 *  - −9999 if personal enemy (skip entirely)
 */
export function recruitPreferenceScore(
  prospectId: EntityId,
  recruiterRulerId: EntityId,
  family: FamilyRelation[],
): number {
  if (arePersonalEnemies(prospectId, recruiterRulerId)) return -9999;
  let score = 0;
  if (areSwornBrothers(prospectId, recruiterRulerId)) score += 50;
  if (areFamily(prospectId, recruiterRulerId, family)) score += 50;
  if (mastersOf(prospectId).includes(recruiterRulerId)) score += 40;
  if (mentorsOf(prospectId).includes(recruiterRulerId)) score += 30;
  if (studentsOf(prospectId).includes(recruiterRulerId)) score += 30;
  return score;
}

/** Each season, a student in the same city/force as their mentor has a
 *  small chance to pick up one of the mentor's policies. Returns the
 *  policy to add (or null). */
export function rollMentorPolicyTransfer(
  student: Officer,
  mentor: Officer,
  rng: () => number,
): import('../data/officerAttributes').PolicyId | null {
  if (mentor.forceId !== student.forceId) return null;
  if (mentor.locationCityId !== student.locationCityId) return null;
  if (mentor.status === 'dead' || student.status === 'dead') return null;
  if (rng() > 0.025) return null; // ~2.5% per season per mentor-pair
  const have = new Set(student.policies ?? []);
  const mentorPolicies = mentor.policies ?? [];
  const candidates = mentorPolicies.filter((p) => !have.has(p));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)];
}
