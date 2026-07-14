/**
 * 名器譜系 — a storied weapon's provenance. 名器威名 (itemLore) counts a blade's
 * battles as a number; this remembers the *story*: the chain of heroes who bore
 * it into the field, and a tally of the battles it saw and the foes felled
 * under it. Passing a legendary arm to a new champion adds a chapter. Pure
 * flavour — shown on the item card — with no combat weight.
 */

export interface ItemChronicle {
  /** Wielders who carried this piece into battle, in order (deduped runs). */
  owners: string[];
  /** Battles the piece has been fielded in. */
  battles: number;
  /** Foes felled while it was borne (best-effort share). */
  kills: number;
}

/** How many wielders a lineage keeps (the earliest bearers roll off the scroll). */
export const PROVENANCE_MAX_OWNERS = 12;

export function accrueItemProvenance(
  prov: Record<string, ItemChronicle>,
  entries: Array<{ itemId: string; ownerId: string; kills: number }>,
): Record<string, ItemChronicle> {
  if (entries.length === 0) return prov;
  const out = { ...prov };
  for (const e of entries) {
    const rec = out[e.itemId] ?? { owners: [], battles: 0, kills: 0 };
    const owners = rec.owners.length && rec.owners[rec.owners.length - 1] === e.ownerId
      ? rec.owners // same hand carries it on — no new chapter
      : [...rec.owners, e.ownerId].slice(-PROVENANCE_MAX_OWNERS);
    out[e.itemId] = {
      owners,
      battles: rec.battles + 1,
      kills: rec.kills + Math.max(0, e.kills),
    };
  }
  return out;
}
