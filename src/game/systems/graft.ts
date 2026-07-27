/**
 * 貪腐 — the one city stat the player was never shown a number for.
 *
 * `City.corruption` is read in 138 places under `src/game` and in exactly four
 * under `src/ui` — and all four are the string `'anti-corruption'`, the command
 * id. The VALUE has never appeared on screen. Yet it:
 *
 *   - accrues every season, faster the richer the city and the worse its
 *     administrator (see `graftAccrual`);
 *   - skims up to **40%** off that city's gold income (`graftIncomeMul`);
 *   - costs up to 16 points of 鄉論 and, past 60, starts bleeding loyalty;
 *   - bars 天命 (which wants ≤2) and feeds 囤積居奇;
 *   - is what the AI governor watches before ordering a sweep.
 *
 * And 巡查肅貪's clawback SCALES with how much has piled up, while a single
 * sweep clears only a slice of it. So "when do I audit this city" is a real
 * timing decision — wait and the payout grows, but you bleed income the whole
 * time — played entirely blind, across twenty cities, with no way to tell which
 * one had rotted.
 *
 * This module exists so the panel and the engine read the SAME numbers. Every
 * formula here was lifted out of its original site (resolution.ts, economy.ts,
 * commands.ts) and those sites now call in, rather than the view keeping a copy
 * that drifts. Same contract as `wallDamage.ts` and the terrain badge.
 */

/** Full graft (100) skims this share of a city's gold: 100/250 = 40%. */
export const GRAFT_INCOME_DIVISOR = 250;
/** At/above this, entrenched graft also starts costing loyalty (貪墨生怨). */
export const GRAFT_RESENTMENT_AT = 60;

/** 貪腐蝕利 — multiplier on a city's gold income. 1 at clean, 0.6 at 100. */
export function graftIncomeMul(corruption: number | undefined): number {
  return 1 - Math.max(0, Math.min(100, corruption ?? 0)) / GRAFT_INCOME_DIVISOR;
}

/**
 * 貪腐滋長 — points of graft a city accrues in one season.
 *
 * The base term is the interesting one: a rich city tempts, a capable
 * administrator restrains. `commerce / 120` against `min(0.6, politics / 130)`
 * means a wealthy city needs a genuinely able official just to hold level.
 * The multipliers are supplied by the caller (traits, 文教, 律法, 驛傳).
 */
export function graftAccrual(args: {
  commerce: number;
  bestPolitics: number;
  traitMul?: number;
  cultureMul?: number;
  lawMul?: number;
  relayMul?: number;
}): number {
  const base = Math.max(0, 0.6 + args.commerce / 120 - Math.min(0.6, args.bestPolitics / 130));
  return base * (args.traitMul ?? 1) * (args.cultureMul ?? 1) * (args.lawMul ?? 1) * (args.relayMul ?? 1);
}

/** 追贓 — gold a sweep claws back. Grows with both the city's wealth and the
 *  hoard that has piled up, which is why timing the audit matters. */
export function graftClawback(commerce: number, politics: number, corruption: number): number {
  const graft = Math.max(0, corruption);
  return Math.floor(commerce * 1.5 + politics * 2 + graft * 8 + graft * commerce * 0.15);
}

/** Points of graft one sweep removes — never all of it in a single pass. */
export function graftCleared(politics: number, corruption: number): number {
  return Math.min(Math.max(0, corruption), Math.max(8, Math.round(politics / 6)));
}

/** How far gone this city is. Mirrors `caseloadTier`'s shape. */
export function graftTier(corruption: number | undefined): { zh: string; en: string } {
  const c = corruption ?? 0;
  if (c >= 80) return { zh: '蠹吏盈庭', en: 'Rotten Through' };
  if (c >= GRAFT_RESENTMENT_AT) return { zh: '貪墨生怨', en: 'Graft Resented' };
  if (c >= 25) return { zh: '吏胥漸墨', en: 'Clerks Skimming' };
  return { zh: '吏治清明', en: 'Clean Administration' };
}

/** Everything the city panel needs to make the audit a decision rather than a
 *  guess: what it is costing now, and what a sweep would return. */
export interface GraftReading {
  corruption: number;
  tier: { zh: string; en: string };
  /** Share of gold income currently being skimmed, 0..0.4. */
  skim: number;
  /** Gold this season's income loses to graft, given the clean figure. */
  goldLost: number;
  clawback: number;
  cleared: number;
  resented: boolean;
}

export function graftReading(args: {
  corruption: number | undefined;
  commerce: number;
  /** Politics of the best official available to sweep (0 = nobody). */
  politics: number;
  /** The city's gold income BEFORE graft is applied, if known. */
  cleanGold?: number;
}): GraftReading {
  const corruption = Math.max(0, Math.min(100, args.corruption ?? 0));
  const skim = 1 - graftIncomeMul(corruption);
  return {
    corruption,
    tier: graftTier(corruption),
    skim,
    goldLost: args.cleanGold ? Math.round(args.cleanGold * skim) : 0,
    clawback: graftClawback(args.commerce, args.politics, corruption),
    cleared: graftCleared(args.politics, corruption),
    resented: corruption >= GRAFT_RESENTMENT_AT,
  };
}
