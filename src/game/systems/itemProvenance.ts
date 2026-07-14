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

/**
 * 傳世名器 — a lineage long and bloody enough earns a heirloom title. Tier 0 =
 * ordinary; a storied piece climbs 名器譜系 → 傳世名器 → 神兵譜系 as it passes
 * through more hands and fells more foes. Crossing into a new tier lends a
 * one-off 威名 surge (its fame spreads); see store's accrual. Purely
 * lineage-driven, on top of the 威名 counter.
 */
export interface HeirloomTier { tier: 0 | 1 | 2 | 3; zh: string; en: string }

export function heirloomTier(prov: ItemChronicle | undefined | null): HeirloomTier {
  if (!prov) return { tier: 0, zh: '', en: '' };
  const { owners, kills } = prov;
  if (owners.length >= 8 || kills >= 400) return { tier: 3, zh: '神兵譜系', en: 'Divine Lineage' };
  if (owners.length >= 5 || kills >= 150) return { tier: 2, zh: '傳世名器', en: 'Storied Heirloom' };
  if (owners.length >= 3 || kills >= 50) return { tier: 1, zh: '名器譜系', en: 'A Noted Lineage' };
  return { tier: 0, zh: '', en: '' };
}

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
