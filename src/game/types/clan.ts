import type { EntityId } from './common';

/**
 * 家門聲望 — the accrued standing of a clan house, layered on top of the curated
 * clan *identity* in data/clans.ts (keyed by the same clan id; emergent player
 * bloodlines use a `house-<founderId>` key). Prestige accrues across generations
 * from a house's living members (their 品階, 爵位, 戰功威望) plus a decayed memory
 * of famous ancestors, so a name you build over a campaign — or 司馬/袁 from the
 * start — rises through 寒門 → 士族 → 世家. A `peakPrestige` high-water keeps a
 * fallen 名門 standing. Feeds court politics, recruitment and loyalty without
 * those systems importing clans.ts. See systems/clans.ts. §2.5.
 */
export interface ClanStanding {
  /** Clan id — a curated id ('sima') or an emergent house ('house-<id>'). */
  id: string;
  /** Display name. */
  nameZh: string;
  nameEn?: string;
  /** 聲望 — eased toward the yearly target; 0..PRESTIGE_MAX. */
  prestige: number;
  /** 寒門 / 士族 / 世家 — derived from prestige (with a peak floor) each tick. */
  tier: 'humble' | 'gentry' | 'great';
  /** High-water mark — a 名門 keeps standing even after decline. */
  peakPrestige?: number;
  /** Earliest-born known member (lineage anchor). */
  founderId?: EntityId;
}
