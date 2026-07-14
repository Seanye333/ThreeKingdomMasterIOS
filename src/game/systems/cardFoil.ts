/**
 * 開包閃度 — a foil tier rolled the first time a card is revealed through a
 * pull. Like a TCG "hit," it is pure collectible variance stamped on the
 * officer forever (officer.foil) — no combat weight. Most reveals are plain;
 * a lucky few shimmer silver, gold, or the rare rainbow. Awakening (六星) is a
 * guaranteed occasion, so it never rolls below gold.
 */
/** Every rolled result — 'plain' is a real, locked-in outcome (no re-roll). */
export type FoilRoll = 'plain' | 'silver' | 'gold' | 'rainbow';
/** The shiny tiers that actually render a sheen. */
export type Foil = 'silver' | 'gold' | 'rainbow';

export interface FoilMeta {
  zh: string; en: string;
  /** Sheen gradient colours. */
  colors: string[];
  /** Tag accent. */
  accent: string;
}

export const FOIL_META: Record<Foil, FoilMeta> = {
  silver: { zh: '銀輝', en: 'Silver Foil', colors: ['#e8eef4', '#9fb3c0', '#f6fbff'], accent: '#cfd8e0' },
  gold: { zh: '金輝', en: 'Gold Foil', colors: ['#fff4c8', '#e6c473', '#a8842e'], accent: '#e6c473' },
  rainbow: { zh: '虹光', en: 'Rainbow Foil', colors: ['#ff8f8f', '#ffe08f', '#8fff9f', '#8fd0ff', '#c98fff'], accent: '#ffb0e0' },
};

/** Meta for a stored foil value, or null for 'plain'/undefined. */
export function foilMeta(foil: FoilRoll | undefined): FoilMeta | null {
  return foil && foil !== 'plain' ? FOIL_META[foil] : null;
}

/**
 * Roll the foil for a reveal. `minGold` (used by 覺醒) guarantees at least
 * gold. Odds: rainbow 3% · gold 12% · silver 30% · plain 55%. Always returns a
 * concrete result — 'plain' is stored so the card never re-rolls.
 */
export function rollFoil(rng: () => number, opts?: { minGold?: boolean }): FoilRoll {
  const r = rng();
  if (opts?.minGold) return r < 0.25 ? 'rainbow' : 'gold';
  if (r < 0.03) return 'rainbow';
  if (r < 0.15) return 'gold';
  if (r < 0.45) return 'silver';
  return 'plain';
}
