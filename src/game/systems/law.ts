/**
 * 律法・刑獄 (§1.11) — the third leg of internal affairs, next to 貪腐 and 文教.
 *
 * A realm is governed by a code, and the code is a *choice with a cost*:
 *
 *   寬 (lenient)  — 約法三章. The people love you and talent comes to you, but
 *                   the strong take what they like: taxes leak, banditry grows.
 *   平 (standard) — 蕭規曹隨. No edge either way.
 *   嚴 (strict)   — 刑法峻急 (諸葛亮治蜀). Taxes come in whole, clerks daren't
 *                   skim, bandits keep off the roads — and the people are afraid
 *                   of you, the gentry resent you, and every prison fills.
 *
 * Under any code the courts fill with unheard cases (訟獄積案). Backlog is the
 * real mechanic: it eats loyalty, breeds unrest, and — under a harsh code and a
 * careless judge — produces 冤獄, a wrongful execution that costs you an
 * officer's faith and your own name. 決獄 (a city command) clears it; a capable
 * 廷尉 keeps it from piling up at all; 大赦 empties every court in the realm at
 * once, and the price is paid in bandits and in the throne's dignity.
 *
 * Pure functions only — the civic tick (resolution.ts), the 決獄 command
 * (commands.ts) and the store's 大赦 all read from here.
 */

export type LawSeverity = 'lenient' | 'standard' | 'strict';

export const LAW_SEVERITIES: LawSeverity[] = ['lenient', 'standard', 'strict'];

export const LAW_NAMES: Record<LawSeverity, { zh: string; en: string; motto: string }> = {
  lenient:  { zh: '寬刑', en: 'Lenient Code',  motto: '約法三章' },
  standard: { zh: '平律', en: 'Standard Code', motto: '蕭規曹隨' },
  strict:   { zh: '峻法', en: 'Strict Code',   motto: '刑法峻急' },
};

export interface LawEffects {
  /** Per-season loyalty drift added to every city of the realm. */
  loyaltyDelta: number;
  /** Multiplier on 貪腐 accrual (a harsh code frightens the clerks straight). */
  corruptionMul: number;
  /** Multiplier on gold tax yield (a lenient code leaks; a harsh one collects). */
  taxYieldMul: number;
  /** Multiplier on how fast unheard cases pile up. */
  caseloadMul: number;
  /** Added weight on banditry/unrest rolls (0 = none). */
  banditRisk: number;
  /** Per-season loyalty drift on officers of 仁厚/寬和 temperament (see notes). */
  gentryFavour: number;
  badgeZh: string;
  badgeEn: string;
}

const EFFECTS: Record<LawSeverity, LawEffects> = {
  lenient: {
    loyaltyDelta: 1, corruptionMul: 1.25, taxYieldMul: 0.93, caseloadMul: 0.8,
    banditRisk: 0.06, gentryFavour: 1,
    badgeZh: '民心 +1/季 · 稅 −7% · 貪腐 +25% · 盜賊漸起',
    badgeEn: 'Loyalty +1/season · tax −7% · graft +25% · banditry rises',
  },
  standard: {
    loyaltyDelta: 0, corruptionMul: 1, taxYieldMul: 1, caseloadMul: 1,
    banditRisk: 0, gentryFavour: 0,
    badgeZh: '無偏無倚',
    badgeEn: 'No bias either way',
  },
  strict: {
    loyaltyDelta: -1, corruptionMul: 0.7, taxYieldMul: 1.07, caseloadMul: 1.35,
    banditRisk: -0.05, gentryFavour: -1,
    badgeZh: '民心 −1/季 · 稅 +7% · 貪腐 −30% · 盜賊斂跡 · 獄訟大增',
    badgeEn: 'Loyalty −1/season · tax +7% · graft −30% · banditry curbed · courts fill',
  },
};

export function lawEffects(severity: LawSeverity | undefined): LawEffects {
  return EFFECTS[severity ?? 'standard'];
}

// ─── 訟獄積案 ─────────────────────────────────────────────────────────

export const CASELOAD_MAX = 100;
/** Above this the backlog is a visible grievance (民有冤). */
export const CASELOAD_HEAVY = 55;

/**
 * How the backlog moves in one season.
 *
 * Cases arrive in proportion to how many people there are to quarrel (a great
 * city generates far more litigation than a frontier fort) and to how much the
 * code criminalises. Against that, whoever holds the city hears cases: a
 * capable administrator (政治) disposes of a great many, and a 官府/太守府 gives
 * them a court to sit in.
 */
export function caseloadTick(args: {
  current: number;
  population: number;
  severity: LawSeverity | undefined;
  /** Best 政治 among officers stationed here (0 if the city is unattended). */
  judgePolitics: number;
  /** The city has a civic hall (官府/太守府/…) — somewhere to hold court. */
  hasCourt?: boolean;
}): number {
  const arrivals = (2 + Math.min(6, args.population / 90_000)) * lawEffects(args.severity).caseloadMul;
  const heard = args.judgePolitics > 0
    ? 1.5 + args.judgePolitics / 22 + (args.hasCourt ? 2 : 0)
    : 0;                                       // 無人視事 — nobody is hearing anything
  const next = args.current + arrivals - heard;
  return Math.max(0, Math.min(CASELOAD_MAX, Math.round(next * 10) / 10));
}

/** What an unheard docket costs the city each season. */
export function caseloadPenalty(caseload: number): {
  loyaltyDelta: number;
  /** Extra weight on civic unrest / banditry rolls. */
  unrestRisk: number;
} {
  if (caseload < 25) return { loyaltyDelta: 0, unrestRisk: 0 };
  if (caseload < CASELOAD_HEAVY) return { loyaltyDelta: -1, unrestRisk: 0.03 };
  if (caseload < 80) return { loyaltyDelta: -2, unrestRisk: 0.08 };
  return { loyaltyDelta: -3, unrestRisk: 0.15 };
}

export function caseloadTier(caseload: number): { zh: string; en: string } {
  if (caseload >= 80) return { zh: '獄訟山積', en: 'Courts Overwhelmed' };
  if (caseload >= CASELOAD_HEAVY) return { zh: '民有冤滯', en: 'Grievances Unheard' };
  if (caseload >= 25) return { zh: '案牘漸積', en: 'Docket Filling' };
  return { zh: '訟簡刑清', en: 'Courts Clear' };
}

/** 決獄 — cases an official disposes of in one dedicated season. */
export function adjudicateClear(politics: number, hasCourt: boolean): number {
  return Math.round(12 + politics * 0.55 + (hasCourt ? 8 : 0));
}

// ─── 冤獄 ─────────────────────────────────────────────────────────────

/**
 * 冤獄 — the chance that a season's judgments include one that should never
 * have been passed. Harsh law plus a full docket plus a careless judge is how
 * an innocent man is executed; a great administrator almost never lets it
 * happen, and a lenient code errs on the side of release.
 */
export function wrongfulConvictionChance(args: {
  caseload: number;
  severity: LawSeverity | undefined;
  judgePolitics: number;
}): number {
  if (args.caseload < 30) return 0;
  const base = (args.caseload - 30) / 100 * 0.22;
  const codeMul = args.severity === 'strict' ? 1.7 : args.severity === 'lenient' ? 0.5 : 1;
  const skill = Math.max(0.35, 1 - args.judgePolitics / 130);
  return Math.max(0, Math.min(0.35, base * codeMul * skill));
}

// ─── 大赦 ─────────────────────────────────────────────────────────────

/**
 * 大赦天下 — empty the courts, open the gaols. Loyalty everywhere, and the
 * docket goes to nothing; but the men you released go back to what they did,
 * and a throne that pardons freely is a throne that is not feared. Traditionally
 * proclaimed on an accession or a great victory, which is exactly when a ruler
 * can afford the dignity.
 */
export function amnestyEffect(args: {
  /** Number of cities in the realm — a wide realm gains more total goodwill. */
  cityCount: number;
  /** Mean backlog across the realm before the pardon. */
  meanCaseload: number;
}): {
  loyaltyGain: number;
  /** Gold cost of the clerks, criers and remissions. */
  goldCost: number;
  /** Fame/prestige spent — pardons cheapen the throne. */
  fameCost: number;
  /** Added banditry weight for the following season. */
  banditSpike: number;
} {
  const relief = Math.min(12, 4 + args.meanCaseload / 10);
  return {
    loyaltyGain: Math.round(relief),
    goldCost: 300 + args.cityCount * 40,
    fameCost: 3,
    banditSpike: 0.12,
  };
}

/** Seasons that must pass before another 大赦 means anything. */
export const AMNESTY_COOLDOWN_SEASONS = 8;

// ─── AI ───────────────────────────────────────────────────────────────

/**
 * 各國自有其法 — which code an AI lord governs by. A tyrant rules by terror, a
 * scholar by lenience, and the middling sort keep to the standard code. Read
 * once when a force first appears (or a lord is succeeded) so the whole map
 * isn't uniformly neutral: 曹操's realm collects its taxes whole while 劉表's
 * leaks, and the difference shows up in their treasuries over a decade.
 */
export function aiLawCode(personality: string | undefined): LawSeverity {
  switch (personality) {
    case 'tyrant':
    case 'aggressive':
      return 'strict';
    case 'scholar':
    case 'hesitant':
      return 'lenient';
    default:
      return 'standard';
  }
}
