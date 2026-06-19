/**
 * Academy training system.
 *
 * Officer stationed at a city with an Academy (書院) building can spend a
 * season learning a new policy. The new policy must either be a base policy
 * (no prereqs) or have all its prereqs already in the officer's repertoire.
 *
 * State lives in `gameState.pendingTrainings`. The season-end tick decrements
 * `seasonsLeft`; at zero, the officer's `policies` array gains the new one.
 */
import type { Building, City, EntityId, Officer, PolicyId } from '../types';
import { POLICY_DEFS, POLICY_PREREQ, TACTIC_DEFS, TACTIC_PREREQ, type TacticId } from '../data/officerAttributes';
import type { FamilyRelation } from '../types/family';
import { ITEMS_BY_ID } from '../data/items';

export type PolicyTier = 1 | 2 | 3;

export const TRAINING_BASE_COST = 200;
export const TRAINING_COST_PER_EXTRA = 50;
// No hard cap on how many policies an officer can learn — they can keep
// studying for as long as the player wants to spend gold + seasons on them.
// Cost still grows linearly with each policy already known, so deep
// specialists pay a king's ransom for the 20th policy.

export type TrainingKind = 'policy' | 'tactic';

export interface PendingTraining {
  officerId: EntityId;
  cityId: EntityId;
  /** Kind of training. Defaults to 'policy' when missing (legacy saves). */
  kind?: TrainingKind;
  /** The policy being learned. Only set when kind === 'policy' (or omitted). */
  policyId: PolicyId;
  /** The tactic being learned. Only set when kind === 'tactic'. */
  tacticId?: TacticId;
  seasonsLeft: number;
  goldSpent: number;
  /**
   * When set, this training is being conducted by a mentor (a senior
   * officer who already knows the policy/tactic), not via the academy.
   * Mentor trainings:
   *  - Don't require an academy in the city
   *  - Cost 0 gold (tuition is paid in honor)
   *  - Take +1 season longer than the academy equivalent
   *  - Both mentor and student are considered "busy" — neither can be
   *    assigned other commands or trainings while this is in flight.
   */
  mentorOfficerId?: EntityId;
}

export const TACTIC_TRAINING_BASE_COST = 300;
export const TACTIC_TRAINING_COST_PER_EXTRA = 75;

/** Cost for learning a new tactic — grows with how many tactics the officer
 *  already knows. Heavier than policy because tactics are battle-changing. */
export function tacticTrainingCost(officer: Officer): number {
  const have = officer.tactics?.length ?? 0;
  const base = TACTIC_TRAINING_BASE_COST + TACTIC_TRAINING_COST_PER_EXTRA * have;
  if (hasTrait(officer, LOYAL_TRAITS)) return Math.floor(base * 0.8);
  return base;
}

/** Tactic tier from prereq depth: 1 = base, 2 = advanced, 3 = signature. */
const TACTIC_TIER_CACHE = new Map<TacticId, 1 | 2 | 3>();
export function tacticTier(id: TacticId): 1 | 2 | 3 {
  const cached = TACTIC_TIER_CACHE.get(id);
  if (cached) return cached;
  const walk = (tid: TacticId, seen: Set<TacticId>): 1 | 2 | 3 => {
    if (seen.has(tid)) return 1;
    seen.add(tid);
    const prereqs = TACTIC_PREREQ[tid] ?? [];
    if (prereqs.length === 0) return 1;
    const max = prereqs.reduce<1 | 2 | 3>(
      (m, p) => Math.max(m, walk(p, seen)) as 1 | 2 | 3,
      1,
    );
    if (max >= 2) return 3;
    return 2;
  };
  const t = walk(id, new Set());
  TACTIC_TIER_CACHE.set(id, t);
  return t;
}

/** Duration in seasons to train a tactic — same formula as policy but
 *  reads `tacticTier` instead of `policyTier`. Returns 0 for instant
 *  (academy lv3). */
export function tacticDurationSeasons(
  officer: Officer,
  city: City,
  tacticId: TacticId,
  buildings: Building[],
): number {
  const aLevel = academyLevel(city, buildings);
  if (aLevel >= 3) return 0;
  let dur = tacticTier(tacticId);
  if (aLevel <= 1) dur += 1;
  if (officer.stats.intelligence >= 80) dur -= 1;
  if (hasTrait(officer, STUDIOUS_TRAITS)) dur -= 1;
  if (hasTrait(officer, LAZY_TRAITS)) dur += 1;
  dur -= itemTrainingSpeedup(officer);
  return Math.max(1, dur);
}

/** Mentor mode for tactics. */
export function tacticMentorDurationSeasons(
  student: Officer,
  city: City,
  tacticId: TacticId,
  mentor?: Officer,
  family?: FamilyRelation[],
): number {
  let dur = tacticDurationSeasons(student, city, tacticId, []) + 1;
  if (mentor && family && isParentMentor(mentor, student, family)) dur -= 1;
  dur -= itemTrainingSpeedup(student);
  return Math.max(1, dur);
}

/** Eligible / locked tactics for this officer. Mirrors `eligiblePolicies`. */
export function eligibleTactics(officer: Officer): {
  available: TacticId[];
  locked: Array<{ id: TacticId; missing: TacticId[] }>;
} {
  const have = new Set(officer.tactics ?? []);
  const available: TacticId[] = [];
  const locked: Array<{ id: TacticId; missing: TacticId[] }> = [];
  for (const idStr of Object.keys(TACTIC_DEFS)) {
    const id = idStr as TacticId;
    if (have.has(id)) continue;
    const prereqs = TACTIC_PREREQ[id] ?? [];
    const missing = prereqs.filter((p) => !have.has(p));
    if (missing.length === 0) available.push(id);
    else locked.push({ id, missing });
  }
  return { available, locked };
}

/** Find every officer who could teach `tacticId` to `student` in `city`. */
export function eligibleTacticMentors(
  student: Officer,
  tacticId: TacticId,
  officersById: Record<EntityId, Officer>,
  city: City,
  pendingTrainings: PendingTraining[],
  family: FamilyRelation[] = [],
): Officer[] {
  const busy = busyOfficerIds(pendingTrainings);
  const result: Officer[] = [];
  for (const o of Object.values(officersById)) {
    if (o.id === student.id) continue;
    if (o.status !== 'idle' || o.task) continue;
    if (o.locationCityId !== city.id) continue;
    if (o.forceId !== student.forceId) continue;
    if (busy.has(o.id)) continue;
    if (!(o.tactics ?? []).includes(tacticId)) continue;
    result.push(o);
  }
  result.sort((a, b) => {
    const ap = isParentMentor(a, student, family) ? 0 : 1;
    const bp = isParentMentor(b, student, family) ? 0 : 1;
    return ap - bp;
  });
  return result;
}

/** Validate a tactic training attempt. */
export function canTrainTactic(
  officer: Officer,
  city: City,
  tacticId: TacticId,
  buildings: Building[],
  pendingTrainings: PendingTraining[],
  mentor?: Officer,
): TrainCheck {
  const isMentor = !!mentor;
  if (!isMentor && !cityHasAcademy(city, buildings))
    return { ok: false, reason: 'No academy in this city.', reasonZh: '此城無書院。' };
  if (!isMentor && city.gold < tacticTrainingCost(officer))
    return { ok: false, reason: 'Not enough gold.', reasonZh: '金錢不足。' };
  if (officer.status !== 'idle' || officer.task)
    return { ok: false, reason: 'Officer is busy.', reasonZh: '該武將另有任務。' };
  if (officer.locationCityId !== city.id)
    return { ok: false, reason: 'Officer is not in this city.', reasonZh: '該武將不在此城。' };
  const have = officer.tactics ?? [];
  if (have.includes(tacticId))
    return { ok: false, reason: 'Officer already knows this tactic.', reasonZh: '武將已通此戰法。' };
  const busy = busyOfficerIds(pendingTrainings);
  if (busy.has(officer.id))
    return { ok: false, reason: 'Officer is already training.', reasonZh: '武將正在培訓中。' };
  if (isMentor) {
    if (mentor.id === officer.id) return { ok: false, reason: 'Mentor and student must differ.', reasonZh: '師徒不能為同一人。' };
    if (mentor.status !== 'idle' || mentor.task) return { ok: false, reason: 'Mentor is busy.', reasonZh: '師者另有任務。' };
    if (mentor.locationCityId !== city.id) return { ok: false, reason: 'Mentor not in this city.', reasonZh: '師者不在此城。' };
    if (mentor.forceId !== officer.forceId) return { ok: false, reason: 'Mentor must serve the same force.', reasonZh: '師者非同陣營。' };
    if (busy.has(mentor.id)) return { ok: false, reason: 'Mentor already engaged.', reasonZh: '師者已參與培訓。' };
    if (!(mentor.tactics ?? []).includes(tacticId)) return { ok: false, reason: 'Mentor does not know this tactic.', reasonZh: '師者不通此戰法。' };
  } else {
    const aLvl = academyLevel(city, buildings);
    if (aLvl < 3) {
      const cap = academyCapacity(aLvl);
      const inCity = trainingsInCity(city.id, pendingTrainings);
      if (inCity >= cap)
        return { ok: false, reason: `Academy at capacity (${inCity}/${cap}).`, reasonZh: `書院容量已滿 (${inCity}/${cap})。` };
    }
  }
  // Prereqs
  const prereqs = TACTIC_PREREQ[tacticId] ?? [];
  const missing = prereqs.filter((p) => !have.includes(p));
  if (missing.length > 0) {
    const zhList = missing.map((m) => TACTIC_DEFS[m]?.zh ?? m).join('、');
    const enList = missing.map((m) => TACTIC_DEFS[m]?.en ?? m).join(', ');
    return { ok: false, reason: `Needs prerequisite: ${enList}.`, reasonZh: `需先學:${zhList}。` };
  }
  return { ok: true };
}

/** Traits that speed up training (each one −1 season, floored at 1). */
const STUDIOUS_TRAITS: ReadonlySet<string> = new Set([
  'diligent', 'erudite', 'wise', 'scholar', 'cunning',
]);
/** Traits that slow training. */
const LAZY_TRAITS: ReadonlySet<string> = new Set(['lazy']);
/** Traits that earn a tuition discount (loyal officers serve cheap). */
const LOYAL_TRAITS: ReadonlySet<string> = new Set(['loyal']);

function hasTrait(officer: Officer, set: ReadonlySet<string>): boolean {
  return (officer.traits ?? []).some((id) => set.has(id));
}

/** Cost grows with how many policies the officer already has, so deep
 *  specialists pay more for each new specialty. Loyal officers get a
 *  20% tuition discount — they serve for honor, not coin. */
export function trainingCost(officer: Officer): number {
  const have = officer.policies?.length ?? 0;
  const base = TRAINING_BASE_COST + TRAINING_COST_PER_EXTRA * have;
  if (hasTrait(officer, LOYAL_TRAITS)) return Math.floor(base * 0.8);
  return base;
}

/** Returns the current academy level in this city (0 if none built). */
export function academyLevel(city: City, buildings: Building[]): number {
  const a = buildings.find((b) => b.cityId === city.id && b.id === 'academy');
  return a?.level ?? 0;
}

/** How many officers can simultaneously train in this academy.
 *  lv1 = 5 / lv2 = 10 / lv3+ = unlimited (lv3 is instant anyway). */
export function academyCapacity(level: number): number {
  if (level >= 3) return Infinity;
  if (level === 2) return 10;
  return 5;
}

/** Count active ACADEMY trainings in a city (mentor trainings don't
 *  consume academy slots since they don't use the academy). */
export function trainingsInCity(cityId: EntityId, pendingTrainings: PendingTraining[]): number {
  return pendingTrainings.reduce(
    (n, t) => (t.cityId === cityId && !t.mentorOfficerId ? n + 1 : n),
    0,
  );
}

/** Officers in `pendingTrainings` who are currently either student or
 *  mentor on something — both roles lock the officer out of other commands. */
export function busyOfficerIds(pendingTrainings: PendingTraining[]): Set<EntityId> {
  const s = new Set<EntityId>();
  for (const t of pendingTrainings) {
    s.add(t.officerId);
    if (t.mentorOfficerId) s.add(t.mentorOfficerId);
  }
  return s;
}

/** Find every officer who could teach `policyId` to `student` in `city`.
 *  Parents sort first so the player sees the family bonus prominently. */
export function eligibleMentors(
  student: Officer,
  policyId: PolicyId,
  officersById: Record<EntityId, Officer>,
  city: City,
  pendingTrainings: PendingTraining[],
  family: FamilyRelation[] = [],
): Officer[] {
  const busy = busyOfficerIds(pendingTrainings);
  const result: Officer[] = [];
  for (const o of Object.values(officersById)) {
    if (o.id === student.id) continue;
    if (o.status !== 'idle' || o.task) continue;
    if (o.locationCityId !== city.id) continue;
    if (o.forceId !== student.forceId) continue;
    if (busy.has(o.id)) continue;
    if (!(o.policies ?? []).includes(policyId)) continue;
    result.push(o);
  }
  // Parents first (they have the family bonus + erudite chance).
  result.sort((a, b) => {
    const ap = isParentMentor(a, student, family) ? 0 : 1;
    const bp = isParentMentor(b, student, family) ? 0 : 1;
    return ap - bp;
  });
  return result;
}

/** True if `mentor` is `student`'s biological parent (per family relations). */
export function isParentMentor(
  mentor: Officer,
  student: Officer,
  family: FamilyRelation[],
): boolean {
  return family.some(
    (rel) =>
      rel.kind === 'parent-child' &&
      ((rel.officerA === mentor.id && rel.officerB === student.id) ||
       (rel.officerB === mentor.id && rel.officerA === student.id)),
  );
}

/** Sum of training-relevant speedup from books an officer holds.
 *  Each book = −1 season; capped at −2 to keep things sane. */
export function itemTrainingSpeedup(officer: Officer): number {
  const equipment = officer.equipment ?? [];
  let speedup = 0;
  for (const itemId of equipment) {
    const item = ITEMS_BY_ID[itemId];
    if (item?.kind === 'book') speedup += 1;
  }
  return Math.min(2, speedup);
}

/** Mentor-mode duration: normal academy-less computation + 1 season.
 *  When `mentor` is the student's parent, an extra −1 bonus applies
 *  (family ties make for a better teacher). Item speedup also applies. */
export function mentorDurationSeasons(
  student: Officer,
  city: City,
  policyId: PolicyId,
  mentor?: Officer,
  family?: FamilyRelation[],
): number {
  // Treat as if no academy (empty buildings list) — that already adds +1.
  // Then add another +1 because informal teaching is slower than a school.
  let dur = trainingDurationSeasons(student, city, policyId, []) + 1;
  if (mentor && family && isParentMentor(mentor, student, family)) {
    dur -= 1; // family bond bonus
  }
  dur -= itemTrainingSpeedup(student);
  return Math.max(1, dur);
}

/** Whether `city` has any potential mentor for any policy at all. UI helper
 *  for showing the training button even when no academy exists. */
export function cityHasMentors(
  city: City,
  officersById: Record<EntityId, Officer>,
  pendingTrainings: PendingTraining[],
): boolean {
  const busy = busyOfficerIds(pendingTrainings);
  for (const o of Object.values(officersById)) {
    if (o.status !== 'idle' || o.task) continue;
    if (o.locationCityId !== city.id) continue;
    if (o.forceId !== city.ownerForceId) continue;
    if (busy.has(o.id)) continue;
    if ((o.policies ?? []).length > 0) return true;
  }
  return false;
}

/** Policy tier from the prereq graph — base / advanced / high.
 *  - tier 1 (基礎): no prereqs
 *  - tier 2 (進階): all prereqs are tier 1
 *  - tier 3 (高階): at least one prereq is tier 2+
 *  Memoized so repeated calls don't re-walk the graph. */
const TIER_CACHE = new Map<PolicyId, 1 | 2 | 3>();
export function policyTier(id: PolicyId): 1 | 2 | 3 {
  const cached = TIER_CACHE.get(id);
  if (cached) return cached;
  const walk = (pid: PolicyId, seen: Set<PolicyId>): 1 | 2 | 3 => {
    if (seen.has(pid)) return 1;
    seen.add(pid);
    const prereqs = POLICY_PREREQ[pid] ?? [];
    if (prereqs.length === 0) return 1;
    const maxPrereq = prereqs.reduce<1 | 2 | 3>(
      (m, p) => Math.max(m, walk(p, seen)) as 1 | 2 | 3,
      1,
    );
    if (maxPrereq >= 2) return 3;
    return 2;
  };
  const t = walk(id, new Set());
  TIER_CACHE.set(id, t);
  return t;
}

/**
 * Compute how many seasons this specific training takes.
 *  - Base duration: policy tier (1 / 2 / 3 seasons)
 *  - Academy level: lv1 = +1 (slow), lv2 = +0, lv3 = instant (returns 0)
 *  - Intelligence: ≥ 80 = −1 (clever officers learn faster)
 *  - Studious trait (diligent / erudite / wise / scholar / cunning) = −1
 *  - Lazy trait = +1
 *  - Floor: 1 season (unless lv3 academy makes it instant)
 */
export function trainingDurationSeasons(
  officer: Officer,
  city: City,
  policyId: PolicyId,
  buildings: Building[],
): number {
  const aLevel = academyLevel(city, buildings);
  if (aLevel >= 3) return 0; // Imperial Academy: instant
  let dur = policyTier(policyId);
  if (aLevel <= 1) dur += 1;                       // lv0/lv1 → slow
  if (officer.stats.intelligence >= 80) dur -= 1;  // genius bonus
  if (hasTrait(officer, STUDIOUS_TRAITS)) dur -= 1; // good student
  if (hasTrait(officer, LAZY_TRAITS)) dur += 1;     // procrastinator
  dur -= itemTrainingSpeedup(officer);              // books speed learning
  return Math.max(1, dur);
}

/** Returns a structured breakdown of how the duration was computed —
 *  for the UI tooltip explaining "why does it take this long?". */
export interface DurationBreakdown {
  tier: 1 | 2 | 3;
  academyLevel: number;
  academyModifier: number;     // +1 if academy <= 1, 0 if >= 2
  intelligenceBonus: number;   // -1 if int >= 80
  studiousBonus: number;       // -1 if has studious trait
  lazyPenalty: number;         // +1 if has lazy trait
  bookSpeedup: number;         // -N from holding books
  total: number;               // final seasons (0 if instant)
  instant: boolean;            // academy lv3
}
export function durationBreakdown(
  officer: Officer,
  city: City,
  policyId: PolicyId,
  buildings: Building[],
): DurationBreakdown {
  const aLevel = academyLevel(city, buildings);
  const tier = policyTier(policyId);
  const academyModifier = aLevel <= 1 ? 1 : 0;
  const intelligenceBonus = officer.stats.intelligence >= 80 ? -1 : 0;
  const studiousBonus = hasTrait(officer, STUDIOUS_TRAITS) ? -1 : 0;
  const lazyPenalty = hasTrait(officer, LAZY_TRAITS) ? 1 : 0;
  const bookSpeedup = itemTrainingSpeedup(officer);
  if (aLevel >= 3) {
    return {
      tier, academyLevel: aLevel, academyModifier, intelligenceBonus,
      studiousBonus, lazyPenalty, bookSpeedup, total: 0, instant: true,
    };
  }
  const raw = tier + academyModifier + intelligenceBonus + studiousBonus + lazyPenalty - bookSpeedup;
  return {
    tier, academyLevel: aLevel, academyModifier, intelligenceBonus,
    studiousBonus, lazyPenalty, bookSpeedup, total: Math.max(1, raw), instant: false,
  };
}

/** Does this city have an Academy that can host training? */
export function cityHasAcademy(city: City, buildings: Building[]): boolean {
  return buildings.some(
    (b) => b.cityId === city.id && b.id === 'academy' && (b.level ?? 0) >= 1,
  );
}

/** Result of `canTrain` — either OK, or a reason it can't proceed. */
export type TrainCheck =
  | { ok: true }
  | { ok: false; reason: string; reasonZh: string };

export function canTrain(
  officer: Officer,
  city: City,
  policyId: PolicyId,
  buildings: Building[],
  pendingTrainings: PendingTraining[],
  mentor?: Officer,
): TrainCheck {
  const isMentor = !!mentor;
  if (!isMentor && !cityHasAcademy(city, buildings)) {
    return { ok: false, reason: 'No academy in this city.', reasonZh: '此城無書院。' };
  }
  if (!isMentor && city.gold < trainingCost(officer)) {
    return { ok: false, reason: 'Not enough gold.', reasonZh: '金錢不足。' };
  }
  if (officer.status !== 'idle' || officer.task) {
    return { ok: false, reason: 'Officer is busy.', reasonZh: '該武將另有任務。' };
  }
  if (officer.locationCityId !== city.id) {
    return { ok: false, reason: 'Officer is not in this city.', reasonZh: '該武將不在此城。' };
  }
  const have = officer.policies ?? [];
  if (have.includes(policyId)) {
    return { ok: false, reason: 'Officer already knows this policy.', reasonZh: '武將已通此政策。' };
  }
  const busy = busyOfficerIds(pendingTrainings);
  if (busy.has(officer.id)) {
    return { ok: false, reason: 'Officer is already training.', reasonZh: '武將正在培訓中。' };
  }
  if (isMentor) {
    if (mentor.id === officer.id)
      return { ok: false, reason: 'Mentor and student must differ.', reasonZh: '師徒不能為同一人。' };
    if (mentor.status !== 'idle' || mentor.task)
      return { ok: false, reason: 'Mentor is busy.', reasonZh: '師者另有任務。' };
    if (mentor.locationCityId !== city.id)
      return { ok: false, reason: 'Mentor not in this city.', reasonZh: '師者不在此城。' };
    if (mentor.forceId !== officer.forceId)
      return { ok: false, reason: 'Mentor must serve the same force.', reasonZh: '師者非同陣營。' };
    if (busy.has(mentor.id))
      return { ok: false, reason: 'Mentor already engaged in a training.', reasonZh: '師者已參與培訓。' };
    if (!(mentor.policies ?? []).includes(policyId))
      return { ok: false, reason: 'Mentor does not know this policy.', reasonZh: '師者不通此政策。' };
  } else {
    // Academy capacity check — skip when the new training would be instant
    // (lv3 academy doesn't queue, so capacity is moot there).
    const aLvl = academyLevel(city, buildings);
    if (aLvl < 3) {
      const cap = academyCapacity(aLvl);
      const inCity = trainingsInCity(city.id, pendingTrainings);
      if (inCity >= cap) {
        return {
          ok: false,
          reason: `Academy at capacity (${inCity}/${cap}).`,
          reasonZh: `書院容量已滿 (${inCity}/${cap})。`,
        };
      }
    }
  }
  // Prereqs must already be on the officer.
  const prereqs = POLICY_PREREQ[policyId] ?? [];
  const missing = prereqs.filter((p) => !have.includes(p));
  if (missing.length > 0) {
    const zhList = missing.map((m) => POLICY_DEFS[m]?.zh ?? m).join('、');
    const enList = missing.map((m) => POLICY_DEFS[m]?.en ?? m).join(', ');
    return {
      ok: false,
      reason: `Needs prerequisite: ${enList}.`,
      reasonZh: `需先學:${zhList}。`,
    };
  }
  return { ok: true };
}

/** Which policies the officer is currently eligible to start learning?
 *  Pure UI helper — derives from POLICY_DEFS and the prereq map. */
export function eligiblePolicies(officer: Officer): {
  available: PolicyId[];
  locked: Array<{ id: PolicyId; missing: PolicyId[] }>;
} {
  const have = new Set(officer.policies ?? []);
  const available: PolicyId[] = [];
  const locked: Array<{ id: PolicyId; missing: PolicyId[] }> = [];
  for (const idStr of Object.keys(POLICY_DEFS)) {
    const id = idStr as PolicyId;
    if (have.has(id)) continue;
    const prereqs = POLICY_PREREQ[id] ?? [];
    const missing = prereqs.filter((p) => !have.has(p));
    if (missing.length === 0) available.push(id);
    else locked.push({ id, missing });
  }
  return { available, locked };
}

/** Advance all in-flight trainings by one season. Returns the new list
 *  plus completed entries so the caller can apply policy mutations.
 *  Trainings in `besiegedCityIds` skip the tick (war disrupts study).
 */
export function tickTrainings(
  trainings: PendingTraining[],
  besiegedCityIds?: ReadonlySet<EntityId>,
): { remaining: PendingTraining[]; completed: PendingTraining[]; paused: PendingTraining[] } {
  const remaining: PendingTraining[] = [];
  const completed: PendingTraining[] = [];
  const paused: PendingTraining[] = [];
  for (const t of trainings) {
    if (besiegedCityIds?.has(t.cityId)) {
      remaining.push(t); // keep, no decrement
      paused.push(t);
      continue;
    }
    const next = { ...t, seasonsLeft: t.seasonsLeft - 1 };
    if (next.seasonsLeft <= 0) completed.push(next);
    else remaining.push(next);
  }
  return { remaining, completed, paused };
}

/**
 * Drop trainings whose preconditions are no longer met — used to clean
 * up after deaths, conquests, defections, etc. No refund: the chaos of
 * losing an officer / city is itself the cost.
 *
 * Drops if any of:
 *  - officer no longer exists
 *  - officer is dead
 *  - officer left the training city (relocated, captured, fled)
 *  - city no longer exists
 *  - city's owner changed (force lost the city OR officer changed force)
 */
export function sweepStaleTrainings(
  trainings: PendingTraining[],
  officers: Record<EntityId, Officer>,
  cities: Record<EntityId, City>,
): { remaining: PendingTraining[]; dropped: PendingTraining[] } {
  const remaining: PendingTraining[] = [];
  const dropped: PendingTraining[] = [];
  for (const t of trainings) {
    const o = officers[t.officerId];
    const c = cities[t.cityId];
    let stillValid =
      !!o &&
      !!c &&
      o.status !== 'dead' &&
      o.locationCityId === t.cityId &&
      c.ownerForceId === o.forceId;
    // Mentor must also still be alive, in the same city, same force.
    if (stillValid && t.mentorOfficerId) {
      const m = officers[t.mentorOfficerId];
      if (!m || m.status === 'dead' || m.locationCityId !== t.cityId || m.forceId !== o!.forceId) {
        stillValid = false;
      }
    }
    if (stillValid) remaining.push(t);
    else dropped.push(t);
  }
  return { remaining, dropped };
}
