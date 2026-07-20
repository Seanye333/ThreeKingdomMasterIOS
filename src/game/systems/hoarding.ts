/**
 * 囤積居奇 (§1.14) — the grain that exists but cannot be bought.
 *
 * Every famine in the record has the same second act: the price rises, the
 * great merchant houses and the local strongmen buy the granaries out and sit
 * on them, and the price rises again. The state's answers were the 常平倉
 * (buy cheap, sell dear, flatten the curve) and, failing that, a magistrate
 * with troops (抑兼併). Both are in this file's arithmetic.
 *
 * The loop this closes: dear grain + weak law + graft → hoarding → dearer grain
 * and angrier people → either you build the ever-normal granary, tighten the
 * code (§1.11), or send someone to break the warehouses open and accept that
 * the merchant families will remember it.
 *
 * Pure. City.hoardedGrain (percent of stores, 0–40) is the state it drives.
 */

export const HOARD_CEILING = 40;
/** Above this the city visibly suffers (糧價騰貴,民有饑色). */
export const HOARD_SEVERE = 20;

/**
 * How hard the merchants are pressing this season, 0–1.
 *
 * Hoarding is a bet on tomorrow's price: dear grain invites it, a full
 * ever-normal granary kills the bet outright (the state can always undercut
 * you), a lenient code leaves nobody to stop it, graft means the magistrate is
 * a partner rather than a threat, and a resentful city has no informers.
 */
export function hoardingPressure(args: {
  /** Grain is presently 'dear' | 'fair' | 'cheap' — see market.marketOutlook. */
  priceLevel: 'cheap' | 'fair' | 'dear';
  /** 常平倉/平準署 stabilisation weight, 0–0.6. */
  stability?: number;
  /** 律令 (§1.11). */
  lawSeverity?: string;
  corruption?: number;
  loyalty: number;
}): number {
  const price = args.priceLevel === 'dear' ? 0.55 : args.priceLevel === 'fair' ? 0.2 : 0.05;
  const law = args.lawSeverity === 'strict' ? -0.18 : args.lawSeverity === 'lenient' ? 0.12 : 0;
  const graft = Math.max(0, Math.min(100, args.corruption ?? 0)) / 100 * 0.25;
  const anger = args.loyalty < 40 ? 0.1 : args.loyalty >= 75 ? -0.08 : 0;
  const granary = Math.max(0, Math.min(0.6, args.stability ?? 0)) * 0.9;
  return Math.max(0, Math.min(1, price + law + graft + anger - granary));
}

/** Move the hoard one season. Falls back toward nothing when nobody is buying. */
export function hoardTick(current: number, pressure: number): number {
  const drift = pressure >= 0.5 ? 4 + pressure * 6
    : pressure >= 0.25 ? 1.5
      : -3;                                   // the bet is off; warehouses open
  return Math.max(0, Math.min(HOARD_CEILING, Math.round((current + drift) * 10) / 10));
}

/** What a standing hoard does to the city each season. */
export function hoardEffects(hoarded: number): {
  /** Multiplier on the grain market rate (worse quotes — the good stuff is off-market). */
  marketRateMul: number;
  loyaltyDelta: number;
  /** Multiplier on the city's own food income reaching the public granary. */
  foodMul: number;
} {
  const h = Math.max(0, Math.min(HOARD_CEILING, hoarded)) / 100;
  return {
    marketRateMul: 1 - h * 1.2,          // 40% hoarded → quotes at ~0.52×
    loyaltyDelta: hoarded >= HOARD_SEVERE ? -2 : hoarded >= 8 ? -1 : 0,
    foodMul: 1 - h * 0.5,
  };
}

export function hoardTier(hoarded: number): { zh: string; en: string } {
  if (hoarded >= 30) return { zh: '米珠薪桂', en: 'Grain Worth Its Weight' };
  if (hoarded >= HOARD_SEVERE) return { zh: '囤積居奇', en: 'Hoarding' };
  if (hoarded >= 8) return { zh: '商賈觀望', en: 'Merchants Holding Back' };
  return { zh: '市易如常', en: 'Markets Normal' };
}

/**
 * 抑兼併 — open the warehouses by force. What comes out scales with the
 * magistrate's competence and with how much was hidden; a harsh code gives him
 * the authority to do it properly. The merchant families and the great houses
 * behind them do not forget.
 */
export function crackdownResult(args: {
  hoarded: number;
  cityFood: number;
  politics: number;
  lawSeverity?: string;
}): {
  /** Percentage points of hoard broken open. */
  cleared: number;
  /** Grain that reaches the public granary. */
  foodRecovered: number;
  loyaltyGain: number;
  /** 商賈凋敝 — the trade this scares off. */
  commerceLoss: number;
  /** Great-house resentment (loyalty hit on clan officers in the city). */
  clanAnger: number;
} {
  const authority = args.lawSeverity === 'strict' ? 1.25 : args.lawSeverity === 'lenient' ? 0.75 : 1;
  const cleared = Math.round(Math.min(args.hoarded, (6 + args.politics / 8) * authority) * 10) / 10;
  return {
    cleared,
    foodRecovered: Math.round(args.cityFood * cleared / 100),
    loyaltyGain: Math.min(8, Math.round(cleared / 2)),
    commerceLoss: Math.round(cleared / 3),
    clanAnger: Math.round(cleared / 4),
  };
}
