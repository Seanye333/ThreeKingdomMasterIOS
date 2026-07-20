/**
 * 戶籍・徭役 (§1.12) — who is on the books, and what you can make them carry.
 *
 * A Han census was not a headcount; it was a *tax base*, and the gap between it
 * and the actual population is the entire political economy of the era. Peasants
 * who could not bear the levies commended themselves to a great house and
 * vanished from the registers (蔭戶): the land still farmed, the family still
 * ate, but the state saw nothing and taxed nothing. 曹魏's 屯田 and every
 * dynasty's 括戶 campaigns were attempts to claw them back — always at the cost
 * of a quarrel with the clans who were sheltering them.
 *
 * Three pieces that close a loop with 律法 (§1.11) and 門閥 (§7.8):
 *
 *   隱戶 (City.hiddenHouseholds) — the share of the population off the books.
 *       Grows under heavy corvée and harsh law; shrinks under light levies, a
 *       lenient code, and a capable administrator.
 *   徭役 (per-force 無役/薄役/重役) — labour drafted for public works. Heavy
 *       levies build fast and cheap and drive people off the registers, ruin the
 *       farming year, and cost loyalty.
 *   括戶 (a city command) — audit the registers, drag the sheltered households
 *       back onto them. Real, permanent tax base; a real quarrel with the clans.
 *
 * Pure functions; the civic tick, the 括戶 command and the buildings tick read
 * from here.
 */

export type CorveeLevel = 'none' | 'light' | 'heavy';

export const CORVEE_LEVELS: CorveeLevel[] = ['none', 'light', 'heavy'];

export const CORVEE_NAMES: Record<CorveeLevel, { zh: string; en: string }> = {
  none:  { zh: '息役', en: 'No Levy' },
  light: { zh: '薄役', en: 'Light Corvée' },
  heavy: { zh: '重役', en: 'Heavy Corvée' },
};

export interface CorveeEffects {
  /** Extra building-construction progress per season, per city. */
  buildSpeed: number;
  /** Per-season loyalty drift in every city of the realm. */
  loyaltyDelta: number;
  /** Multiplier on the season's agricultural income (誤農時). */
  farmMul: number;
  /** Added drift (percentage points per season) of households off the books. */
  hidingPressure: number;
  badgeZh: string;
  badgeEn: string;
}

const CORVEE: Record<CorveeLevel, CorveeEffects> = {
  none: {
    buildSpeed: 0, loyaltyDelta: 1, farmMul: 1.02, hidingPressure: -0.4,
    badgeZh: '民得休息 · 民心 +1/季 · 農 +2% · 隱戶漸歸',
    badgeEn: 'The people rest · loyalty +1/season · farms +2% · households return',
  },
  light: {
    buildSpeed: 1, loyaltyDelta: 0, farmMul: 1, hidingPressure: 0.2,
    badgeZh: '工程 +1 進度/季 · 民心不動',
    badgeEn: '+1 build progress/season · loyalty steady',
  },
  heavy: {
    buildSpeed: 2, loyaltyDelta: -2, farmMul: 0.9, hidingPressure: 1.1,
    badgeZh: '工程 +2 進度/季 · 民心 −2/季 · 農 −10% · 逃戶大增',
    badgeEn: '+2 build progress/season · loyalty −2/season · farms −10% · flight from the registers',
  },
};

export function corveeEffects(level: CorveeLevel | undefined): CorveeEffects {
  return CORVEE[level ?? 'none'];
}

// ─── 隱戶 ─────────────────────────────────────────────────────────────

/** A realm never sees quite everyone; and it never loses quite everyone. */
export const HIDDEN_FLOOR = 2;
export const HIDDEN_CEILING = 45;

/**
 * How the sheltered share (percent of population, 0–45) moves in one season.
 *
 * Pressure to hide comes from what the state demands: heavy corvée above all,
 * then a harsh code (a man who cannot answer a summons has every reason to stop
 * existing on paper). Against it: a resident administrator who knows the
 * villages (政治), and the simple pull of a well-governed city where being on
 * the books is not a disaster.
 */
export function hiddenDrift(args: {
  current: number;
  corvee: CorveeLevel | undefined;
  /** 'strict' | 'standard' | 'lenient' — see law.ts. */
  lawSeverity?: string;
  /** Best 政治 among officers stationed here (0 if unattended). */
  bestPolitics: number;
  loyalty: number;
}): number {
  const law = args.lawSeverity === 'strict' ? 0.5 : args.lawSeverity === 'lenient' ? -0.3 : 0;
  const audit = args.bestPolitics / 90;             // a present官 keeps the rolls honest
  const content = args.loyalty >= 70 ? -0.3 : args.loyalty < 40 ? 0.4 : 0;
  const drift = corveeEffects(args.corvee).hidingPressure + law + content - audit;
  const next = args.current + drift;
  return Math.max(HIDDEN_FLOOR, Math.min(HIDDEN_CEILING, Math.round(next * 10) / 10));
}

/**
 * 稅基 — the multiplier the hidden share puts on a city's gold and food income.
 * Households off the books still farm and still trade; they just do it for the
 * clan that shelters them. Not quite 1:1 — a little of their produce reaches
 * the market anyway.
 */
export function registryYieldMul(hiddenPercent: number): number {
  return 1 - Math.max(0, Math.min(HIDDEN_CEILING, hiddenPercent)) / 100 * 0.8;
}

export function hiddenTier(hiddenPercent: number): { zh: string; en: string } {
  if (hiddenPercent >= 30) return { zh: '編戶大壞', en: 'Registers Gutted' };
  if (hiddenPercent >= 18) return { zh: '蔭戶眾多', en: 'Widely Sheltered' };
  if (hiddenPercent >= 8) return { zh: '略有隱漏', en: 'Some Concealment' };
  return { zh: '編戶齊民', en: 'Fully Registered' };
}

// ─── 括戶 ─────────────────────────────────────────────────────────────

/**
 * 括戶檢地 — send an official through the villages with the registers in hand.
 * What he recovers scales with his 政治 and with how much there is to find; the
 * households come back onto the books permanently (tax base), and the great
 * houses whose fields they were tilling do not forget it.
 */
export function householdAudit(args: {
  hiddenPercent: number;
  politics: number;
  population: number;
}): {
  /** Percentage points of population dragged back onto the registers. */
  recovered: number;
  /** Actual heads recovered (for the report line). */
  households: number;
  /** 門閥不悅 — clan standing lost with the sheltering houses. */
  clanAnger: number;
} {
  const available = Math.max(0, args.hiddenPercent - HIDDEN_FLOOR);
  const recovered = Math.round(Math.min(available, 2 + args.politics / 14) * 10) / 10;
  return {
    recovered,
    households: Math.round(args.population * recovered / 100),
    // Digging out a lot of shielded tenants is what actually angers a great
    // house; a token audit is a formality everyone tolerates.
    clanAnger: Math.round(recovered * 1.8),
  };
}
