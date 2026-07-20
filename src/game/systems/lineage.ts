import type { Officer, EntityId } from '../types';

/**
 * 師承譜系 (§6.18) — who taught whom. 傳藝 (§6.10) and 傳道 (§6.14) used to be
 * one-off transactions: the 修為 moved and the act vanished. Here the teaching
 * leaves a record, so a great master's craft becomes a visible LINEAGE that
 * outlives him — and 同門 (fellow students of one master) fight and argue
 * better shoulder to shoulder than strangers do.
 *
 * Stored as a flat ledger of edges (pupil → master, per art) so it survives
 * officers dying, defecting and being poached without any tree surgery.
 */

/** Which craft an edge records. A master may teach a pupil both. */
export type LineageArt = 'martial' | 'debate';

export interface LineageEdge {
  masterId: EntityId;
  pupilId: EntityId;
  art: LineageArt;
  /** Year the teaching was given — lets the UI order a school's generations. */
  year: number;
}

export type LineageLedger = LineageEdge[];

/** How many edges the ledger keeps; a long campaign's teaching is bounded. */
export const LINEAGE_CAP = 400;

/** Record a teaching. Re-teaching the same pair/art refreshes rather than dupes. */
export function recordTeaching(ledger: LineageLedger, edge: LineageEdge): LineageLedger {
  const rest = ledger.filter((e) => !(e.masterId === edge.masterId && e.pupilId === edge.pupilId && e.art === edge.art));
  return [edge, ...rest].slice(0, LINEAGE_CAP);
}

/** The master(s) an officer studied a given art under. */
export function mastersOf(ledger: LineageLedger, pupilId: EntityId, art?: LineageArt): EntityId[] {
  return ledger.filter((e) => e.pupilId === pupilId && (!art || e.art === art)).map((e) => e.masterId);
}

/** Everyone a master taught (their 門下). */
export function pupilsOf(ledger: LineageLedger, masterId: EntityId, art?: LineageArt): EntityId[] {
  return ledger.filter((e) => e.masterId === masterId && (!art || e.art === art)).map((e) => e.pupilId);
}

/**
 * 同門 — did these two study the same art under the same master? (A master and
 * their own pupil are 師徒, not 同門; that bond is handled by mentorId.)
 */
export function areFellowStudents(ledger: LineageLedger, aId: EntityId, bId: EntityId, art?: LineageArt): boolean {
  if (aId === bId) return false;
  const aMasters = new Set(mastersOf(ledger, aId, art));
  if (!aMasters.size) return false;
  return mastersOf(ledger, bId, art).some((m) => aMasters.has(m));
}

/** 師徒 — is one the other's recorded teacher in this art (either direction)? */
export function areMasterAndPupil(ledger: LineageLedger, aId: EntityId, bId: EntityId, art?: LineageArt): boolean {
  return mastersOf(ledger, aId, art).includes(bId) || mastersOf(ledger, bId, art).includes(aId);
}

/** 同門之誼 / 師徒同心 — the bond two officers bring to a joint fight, if any. */
export function lineageBond(ledger: LineageLedger, aId: EntityId, bId: EntityId, art?: LineageArt): 'master-pupil' | 'fellow' | null {
  if (areMasterAndPupil(ledger, aId, bId, art)) return 'master-pupil';
  if (areFellowStudents(ledger, aId, bId, art)) return 'fellow';
  return null;
}

/**
 * 一門 — a master's whole school in one art: the master plus everyone they
 * taught, filtered to officers still in the world. For the lineage readout.
 */
export function schoolOf(ledger: LineageLedger, masterId: EntityId, officers: Record<EntityId, Officer>, art?: LineageArt): { master: Officer | undefined; pupils: Officer[] } {
  const pupils = [...new Set(pupilsOf(ledger, masterId, art))]
    .map((id) => officers[id])
    .filter((o): o is Officer => !!o && o.status !== 'dead');
  return { master: officers[masterId], pupils };
}

/**
 * 名門 — the masters with the most surviving students, for the hall's readout.
 * A school whose master is gone still counts: that is what a lineage is for.
 */
export function greatSchools(ledger: LineageLedger, officers: Record<EntityId, Officer>, limit = 8): Array<{ masterId: EntityId; art: LineageArt; pupils: number }> {
  const tally = new Map<string, { masterId: EntityId; art: LineageArt; pupils: Set<EntityId> }>();
  for (const e of ledger) {
    const pupil = officers[e.pupilId];
    if (!pupil || pupil.status === 'dead') continue;
    const key = `${e.masterId}|${e.art}`;
    let row = tally.get(key);
    if (!row) { row = { masterId: e.masterId, art: e.art, pupils: new Set() }; tally.set(key, row); }
    row.pupils.add(e.pupilId);
  }
  return [...tally.values()]
    .map((r) => ({ masterId: r.masterId, art: r.art, pupils: r.pupils.size }))
    .sort((a, b) => b.pupils - a.pupils)
    .slice(0, limit);
}

// ─── 衣缽傳人 — a master names who carries the craft on ──────────────────────
// 遺譜 (§6.10) leaves a book for whoever stumbles on it. This is the deliberate
// version: a living 宗師/名士 names an heir, and when the master dies the heir
// inherits a real share of the craft — the difference between a library and an
// apprenticeship.

/** Share of the master's 修為 an heir is lifted TOWARD on the master's death. */
export const HEIR_INHERIT_SHARE = 0.7;

/**
 * The 修為 an heir ends at when their master dies. They are lifted toward a
 * share of the master's mastery — never demoted if they already stood higher.
 */
export function inheritedXiuwei(heirXiuwei: number, masterXiuwei: number): number {
  return Math.max(heirXiuwei, Math.round(masterXiuwei * HEIR_INHERIT_SHARE));
}
