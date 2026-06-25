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
import { isFeudKind } from '../data/bonds';
import { pairKey } from '../types/diplomacy';
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

/** True if a runtime bond list ties A and B as 宿怨/私仇 (a feud). */
export function runtimeFeudPair(a: EntityId, b: EntityId, bonds: OathBond[] = []): boolean {
  return bonds.some(
    (bd) =>
      isFeudKind(bd.kind) &&
      ((bd.officerA === a && bd.officerB === b) || (bd.officerA === b && bd.officerB === a)),
  );
}

/** Depth (1..3) of the sworn tie between A and B. Runtime bonds carry their own
 *  depth; a static-lore sworn brotherhood is treated as 義結金蘭 (2). 0 if none. */
export function swornDepth(a: EntityId, b: EntityId, bonds: OathBond[] = []): number {
  const bd = bonds.find(
    (x) =>
      isSwornBondKind(x.kind) &&
      ((x.officerA === a && x.officerB === b) || (x.officerA === b && x.officerB === a)),
  );
  if (bd) return bd.depth ?? 1;
  return areStaticSworn(a, b) ? 2 : 0;
}

function areStaticSworn(a: EntityId, b: EntityId): boolean {
  return OFFICER_RELATIONSHIPS.some(
    (r) =>
      r.kind === 'sworn-brothers' &&
      ((r.a === a && r.b === b) || (r.a === b && r.b === a)),
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

/** Get all sworn brothers of an officer (other officer ids) from STATIC lore. */
export function swornBrothersOf(officerId: EntityId): EntityId[] {
  return relationsOf(officerId)
    .filter((r) => r.kind === 'sworn-brothers')
    .map((r) => (r.a === officerId ? r.b : r.a));
}

/** All sworn brothers — static lore + runtime 結拜/義結 bonds — deduped. */
export function allSwornBrothersOf(officerId: EntityId, runtimeBonds: OathBond[] = []): EntityId[] {
  const out = new Set<EntityId>(swornBrothersOf(officerId));
  for (const bd of runtimeBonds) {
    if (!isSwornBondKind(bd.kind)) continue;
    if (bd.officerA === officerId) out.add(bd.officerB);
    else if (bd.officerB === officerId) out.add(bd.officerA);
  }
  return [...out];
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

/** 仁孝 — true if a `filial` officer currently has a blood relative
 *  (parent / child / sibling) alive and serving in the SAME force. Such an
 *  officer will not abandon their kin, so callers treat them as undefectable. */
export function hasBloodKinInForce(
  officer: Officer,
  officersById: Record<EntityId, Officer>,
  family: FamilyRelation[],
): boolean {
  if (!(officer.traits as string[] | undefined ?? []).includes('filial')) return false;
  const kin = [
    ...parentsOf(officer.id, family),
    ...childrenOf(officer.id, family),
    ...siblingsOf(officer.id, family),
  ];
  return kin.some((id) => {
    const k = officersById[id];
    return k && k.status !== 'dead' && k.forceId === officer.forceId;
  });
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
  rapport: Record<string, number> = {},
): RelationshipCombatBonus {
  if (pool.length < 2) return { powerMul: 1.0, moraleResist: 0 };
  let powerMul = 1.0;
  let moraleResist = 0;
  // Count distinct relationship pairs within pool
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i].id, b = pool[j].id;
      const sworn = areSwornBrothers(a, b, runtimeBonds);
      const feud = runtimeFeudPair(a, b, runtimeBonds);
      if (sworn) {
        // Depth-scaled: 義交 1.05 / 義結金蘭 1.06 / 生死之交 1.08.
        const depth = swornDepth(a, b, runtimeBonds);
        powerMul *= depth >= 3 ? 1.08 : depth === 1 ? 1.05 : 1.06;
        moraleResist += depth >= 3 ? 0.12 : 0.10;
      } else if (feud) {
        // 宿怨 — generals who loathe each other fight worse shoulder to shoulder.
        powerMul *= 0.95;
        moraleResist -= 0.06;
      }
      if (areFamily(a, b, family)) {
        powerMul *= 1.04;
        moraleResist += 0.05;
      }
      // Graded rapport — warmth/coldness short of a forged bond still counts.
      // Skipped when a bond/feud already exists (the multipliers above already
      // represent the maxed-out relationship — avoids double-counting).
      if (!sworn && !feud) {
        const r = rapport[pairKey(a, b)] ?? 0;
        if (r > 0) {
          powerMul *= 1 + 0.04 * (r / 100);
          moraleResist += 0.06 * (r / 100);
        } else if (r < 0) {
          powerMul *= 1 + 0.05 * (r / 100); // r<0 → <1
          moraleResist += 0.06 * (r / 100); // r<0 → negative
        }
      }
    }
  }
  // Compress
  powerMul = 1 + (powerMul - 1) * 0.75;
  moraleResist = Math.max(-0.5, Math.min(0.5, moraleResist));
  return { powerMul, moraleResist };
}

/** Cross-side rival bonus — when commanders of opposing sides are rivals,
 *  BOTH sides get attack +10% (matched-rival fervor). */
export function rivalShowdownMultiplier(commanderA: Officer | null, commanderB: Officer | null): number {
  if (!commanderA || !commanderB) return 1.0;
  if (areRivals(commanderA.id, commanderB.id)) return 1.10;
  return 1.0;
}

/** Cross-line morale bite — when a sworn brother stands in the ENEMY ranks, a
 *  general fights with a divided heart. Returns a morale penalty (≤0) to apply
 *  to the side, scaled by how many sworn brothers face them. */
export function swornAcrossLinesPenalty(
  side: Officer[],
  enemy: Officer[],
  runtimeBonds: OathBond[] = [],
): number {
  if (side.length === 0 || enemy.length === 0) return 0;
  let pairs = 0;
  for (const a of side) {
    for (const b of enemy) {
      if (areSwornBrothers(a.id, b.id, runtimeBonds)) pairs++;
    }
  }
  return Math.max(-0.2, -0.05 * pairs);
}

// ─────────────────────────────────────────────────────────────────────
// 義結深化 — sworn bonds deepen with shared service
// ─────────────────────────────────────────────────────────────────────

export interface BondDeepenResult {
  bonds: OathBond[];
  /** Pairs whose depth advanced this tick (for player-facing notes). */
  deepened: Array<{ a: EntityId; b: EntityId; depth: number; label: string }>;
}

/**
 * Each season, sworn bonds whose members serve the same force grow stronger.
 * 義交 (1) → 義結金蘭 (2) after 8 seasons together → 生死之交 (3) after 24.
 * Deeper bonds raise the loyalty floor (88/92/96) and battle synergy. Pure.
 */
export function deepenBonds(
  bonds: OathBond[],
  officersById: Record<EntityId, Officer>,
): BondDeepenResult {
  const deepened: BondDeepenResult['deepened'] = [];
  const out = bonds.map((bd) => {
    if (!isSwornBondKind(bd.kind)) return bd;
    const a = officersById[bd.officerA], b = officersById[bd.officerB];
    const together =
      !!a && !!b && a.status !== 'dead' && b.status !== 'dead' &&
      !!a.forceId && a.forceId === b.forceId;
    if (!together) return bd;
    const shared = (bd.sharedSeasons ?? 0) + 1;
    const depth = bd.depth ?? 1;
    let newDepth: 1 | 2 | 3 = depth as 1 | 2 | 3;
    if (depth < 2 && shared >= 8) newDepth = 2;
    if (depth < 3 && shared >= 24) newDepth = 3;
    if (newDepth !== depth) deepened.push({ a: bd.officerA, b: bd.officerB, depth: newDepth, label: bd.label });
    return { ...bd, sharedSeasons: shared, depth: newDepth };
  });
  return { bonds: out, deepened };
}

/**
 * 同袍／嫌隙 loyalty nudge — an officer's average rapport with their same-force
 * peers gives a small per-season loyalty drift: warmth (camaraderie) steadies
 * them, friction (嫌隙) gnaws. Bounded to ±3 so it nudges without overriding the
 * floor. Pure; reads rapport directly via pairKey (no rapport.ts dependency).
 */
export function camaraderieLoyaltyDelta(
  officer: Officer,
  forceOfficers: Officer[],
  rapport: Record<string, number>,
): number {
  let sum = 0, n = 0;
  for (const o of forceOfficers) {
    if (o.id === officer.id || o.status === 'dead') continue;
    sum += rapport[pairKey(officer.id, o.id)] ?? 0;
    n++;
  }
  if (n === 0) return 0;
  const avg = sum / n; // −100..100
  return Math.max(-3, Math.min(3, avg * 0.03));
}

/**
 * 朋黨 — an ambitious general with a tight clique of high-rapport allies in the
 * same force has co-conspirators at his back, and moves the bolder for it; a man
 * isolated by feuds has no one to follow him. Returns a small additive boost to
 * his betrayal odds (0..~0.04), fed into the ambition factionBoost. Pure.
 */
export function cliqueBackingBoost(
  officerId: EntityId,
  forceOfficers: Officer[],
  rapport: Record<string, number>,
  runtimeBonds: OathBond[] = [],
): number {
  let allies = 0;
  let foes = 0;
  for (const o of forceOfficers) {
    if (o.id === officerId || o.status === 'dead') continue;
    const r = rapport[pairKey(officerId, o.id)] ?? 0;
    if (r >= 60 || runtimeSwornPair(officerId, o.id, runtimeBonds)) allies++;
    else if (r <= -60 || runtimeFeudPair(officerId, o.id, runtimeBonds)) foes++;
  }
  const net = Math.max(0, allies - foes);
  return Math.min(0.04, net * 0.015);
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
  // Runtime 結拜 sworn brothers (義兄弟 forged in-game) — depth-scaled:
  // 義交 88 / 義結金蘭 92 / 生死之交 96.
  for (const bd of runtimeBonds) {
    if (!isSwornBondKind(bd.kind)) continue;
    const otherId = bd.officerA === officer.id ? bd.officerB
      : bd.officerB === officer.id ? bd.officerA : null;
    if (otherId && sameForceAlive(otherId)) {
      const d = bd.depth ?? 1;
      floor = Math.max(floor, d >= 3 ? 96 : d === 2 ? 92 : 88);
    }
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
  // 部曲 — a retainer serving under their original lord keeps a high floor.
  if (officer.retinueOfLordId && sameForceAlive(officer.retinueOfLordId)) {
    floor = Math.max(floor, 90);
  }
  return floor;
}

/** When an officer dies, every officer they had a deep bond with (sworn
 *  brother, family, master, romantic partner) takes a loyalty hit.
 *  Returns array of {targetId, delta, reasonZh, reasonEn}. */
export interface GriefEffect {
  targetId: EntityId;
  delta: number;          // negative (grief) or positive (relief over a fallen foe)
  reasonZh: string;
  reasonEn: string;
  /** Depth of a lost sworn bond (1..3) — depth ≥2 may trigger 殉義 (the survivor
   *  follows their brother in death/retirement). Set only for deep sworn losses. */
  mournDepth?: number;
}
export function griefOnDeath(
  deceasedId: EntityId,
  deceasedNameZh: string,
  deceasedNameEn: string,
  family: FamilyRelation[],
  runtimeBonds: OathBond[] = [],
  /** When supplied, a fallen lord's scattered 部曲 also mourn (retinueOfLordId). */
  allOfficers?: Record<EntityId, Officer>,
): GriefEffect[] {
  const out: GriefEffect[] = [];
  const seen = new Set<EntityId>();
  const add = (id: EntityId, delta: number, zh: string, en: string, mournDepth?: number) => {
    if (seen.has(id)) return; // avoid double-dipping
    seen.add(id);
    out.push({ targetId: id, delta, reasonZh: zh, reasonEn: en, mournDepth });
  };
  // Sworn brothers — biggest loyalty hit, may rage
  for (const id of swornBrothersOf(deceasedId)) {
    add(id, -20, `義兄弟${deceasedNameZh}陣亡 — 悲憤難當`, `Sworn brother ${deceasedNameEn} fell — grief and rage`, 2);
  }
  // Runtime 義結 brothers (forged in-game) — grief scales with bond depth.
  for (const bd of runtimeBonds) {
    const otherId = bd.officerA === deceasedId ? bd.officerB
      : bd.officerB === deceasedId ? bd.officerA : null;
    if (!otherId) continue;
    if (isSwornBondKind(bd.kind)) {
      const d = bd.depth ?? 1;
      add(otherId, d >= 3 ? -25 : d === 2 ? -20 : -15,
        `義兄弟${deceasedNameZh}逝 — 悲憤難當`, `Sworn brother ${deceasedNameEn} fell — grief and rage`, d);
    } else if (isFeudKind(bd.kind)) {
      // 宿怨 — a hated rival's death brings cold relief, not grief.
      add(otherId, 5, `宿敵${deceasedNameZh}伏誅 — 心結頓解`, `Foe ${deceasedNameEn} is gone — an old grudge lifts`);
    }
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
  // 部曲喪志 — a fallen lord's surviving retainers mourn their old master.
  // The `seen` set keeps anyone already grieving (e.g. as a sworn brother) from
  // double-dipping, so this only adds the rank-and-file retinue.
  if (allOfficers) {
    for (const o of Object.values(allOfficers)) {
      if (o.retinueOfLordId === deceasedId && o.status !== 'dead') {
        add(o.id, -18, `故主${deceasedNameZh}殞落 — 部曲喪志`, `Their old lord ${deceasedNameEn} has fallen`);
      }
    }
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
  rapport: Record<string, number> = {},
): number {
  if (arePersonalEnemies(prospectId, recruiterRulerId)) return -9999;
  let score = 0;
  if (areSwornBrothers(prospectId, recruiterRulerId)) score += 50;
  if (areFamily(prospectId, recruiterRulerId, family)) score += 50;
  if (mastersOf(prospectId).includes(recruiterRulerId)) score += 40;
  if (mentorsOf(prospectId).includes(recruiterRulerId)) score += 30;
  if (studentsOf(prospectId).includes(recruiterRulerId)) score += 30;
  // 舊好 — prior warmth (or coldness) with the lord nudges the priority.
  score += (rapport[pairKey(prospectId, recruiterRulerId)] ?? 0) * 0.3;
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
