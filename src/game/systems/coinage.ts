/**
 * 錢法・物價 (§1.17) — what your money is worth, and who decides.
 *
 * 鑄錢 already existed as a one-off button: press it, get a windfall, take some
 * inflation. That is the *act*; this is the *institution* behind it, and the
 * institution is one of the sharpest choices the period actually offers.
 *
 *   五銖錢 (wuzhu)      — the Han standard. Boring, sound, and the reason the
 *                         Han economy worked for two centuries.
 *   大錢 (daqian)       — 董卓壞五銖錢,更鑄小錢 · 孫權鑄大泉當千. Declare that
 *                         your coin is worth more than its metal. The treasury
 *                         fills at once; prices climb every season after, and
 *                         the merchants price your coin at what it weighs.
 *                         穀石數萬錢 — grain at tens of thousands a picul.
 *   穀帛為市 (grainCloth) — 魏文帝罷五銖錢,使百姓以穀帛為市. Give up on coin
 *                         entirely. Prices stop moving because there is no
 *                         currency left to debase; commerce shrivels because
 *                         nobody can carry a warehouse of silk to market.
 *
 * Inflation is no longer the player's private problem either: every realm keeps
 * its own number, and a lord who debases his way through a war is poorer for it
 * five years later. Pure functions; the store drifts the numbers each season
 * and resolution.ts spends them.
 */

export type CoinStandard = 'wuzhu' | 'daqian' | 'grainCloth';

export const COIN_STANDARDS: CoinStandard[] = ['wuzhu', 'daqian', 'grainCloth'];

export const COIN_NAMES: Record<CoinStandard, { zh: string; en: string; motto: string }> = {
  wuzhu:      { zh: '五銖錢', en: 'Wuzhu Cash',   motto: '漢家舊制' },
  daqian:     { zh: '大錢',   en: 'Debased Cash', motto: '大泉當千' },
  grainCloth: { zh: '穀帛為市', en: 'Grain & Silk', motto: '罷錢不用' },
};

export interface CoinEffects {
  /** Multiplier on every city's gold income in this realm. */
  goldYieldMul: number;
  /** Per-season commerce drift in every city. */
  commerceDelta: number;
  /** Inflation added each season simply by running this standard. */
  inflationPerSeason: number;
  /** Multiplier on how fast inflation eases (relief and natural decay). */
  inflationDecayMul: number;
  /** Multiplier on the windfall a single 鑄錢 raises. */
  mintYieldMul: number;
  /** Extra inflation each 鑄錢 costs, multiplied. */
  mintInflationMul: number;
  badgeZh: string;
  badgeEn: string;
}

const EFFECTS: Record<CoinStandard, CoinEffects> = {
  wuzhu: {
    goldYieldMul: 1, commerceDelta: 0, inflationPerSeason: 0, inflationDecayMul: 1,
    mintYieldMul: 1, mintInflationMul: 1,
    badgeZh: '漢家舊制 —— 無得無失,物價自平',
    badgeEn: 'The Han standard — no edge either way, prices settle',
  },
  daqian: {
    goldYieldMul: 1.22, commerceDelta: -0.5, inflationPerSeason: 3.5, inflationDecayMul: 0.4,
    mintYieldMul: 1.6, mintInflationMul: 0.7,
    badgeZh: '金收 +22% · 商業 −0.5/季 · 通脹 +3.5/季且難消 · 鑄錢所得 ×1.6',
    badgeEn: 'Gold +22% · commerce −0.5/season · inflation +3.5/season, slow to ease · minting ×1.6',
  },
  grainCloth: {
    goldYieldMul: 0.85, commerceDelta: -0.2, inflationPerSeason: 0, inflationDecayMul: 2.4,
    mintYieldMul: 0.35, mintInflationMul: 1.5,
    badgeZh: '金收 −15% · 商業 −0.2/季 · 通脹速消(×2.4)· 鑄錢幾乎無利',
    badgeEn: 'Gold −15% · commerce −0.2/season · inflation eases fast (×2.4) · minting barely pays',
  },
};

export function coinEffects(standard: CoinStandard | undefined): CoinEffects {
  return EFFECTS[standard ?? 'wuzhu'];
}

/**
 * 物價 — the multiplier inflation puts on everything bought with coin.
 * 0 → 1.00, 50 → 1.31, 100 → 1.63. Feeds the grain price (§1.16), so a debased
 * realm watches its own caravans, granaries and hoarders all react at once.
 */
export function priceMultiplier(inflation: number): number {
  return 1 + Math.max(0, Math.min(100, inflation)) / 160;
}

/** Natural per-season easing before the standard's multiplier. */
export const INFLATION_BASE_EASE = 3;

/** Move one realm's inflation a season. */
export function inflationDrift(args: {
  current: number;
  standard?: CoinStandard;
  /** 平準署/名物 relief already accumulated for this realm. */
  relief?: number;
}): number {
  const eff = coinEffects(args.standard);
  const ease = (INFLATION_BASE_EASE + Math.max(0, args.relief ?? 0)) * eff.inflationDecayMul;
  const next = args.current + eff.inflationPerSeason - ease;
  return Math.max(0, Math.min(100, Math.round(next * 10) / 10));
}

export function inflationTier(inflation: number): { zh: string; en: string } {
  if (inflation >= 70) return { zh: '穀石數萬', en: 'Runaway Prices' };
  if (inflation >= 40) return { zh: '物價騰踊', en: 'Prices Climbing' };
  if (inflation >= 18) return { zh: '錢輕物重', en: 'Coin Light' };
  return { zh: '物價平準', en: 'Prices Steady' };
}

/**
 * An AI lord's standard. A war chest that has run dry turns even a careful lord
 * to the mint; a merchant-minded one never leaves the Han standard.
 */
export function aiCoinStandard(personality: string | undefined, treasuryTight: boolean): CoinStandard {
  if (personality === 'merchant' || personality === 'diplomat') return 'wuzhu';
  if (treasuryTight) return (personality === 'tyrant' || personality === 'aggressive') ? 'daqian' : 'grainCloth';
  return 'wuzhu';
}
