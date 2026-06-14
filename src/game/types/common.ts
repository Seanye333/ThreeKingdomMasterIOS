export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export const SEASON_LABEL: Record<Season, { en: string; zh: string }> = {
  spring: { en: 'Spring', zh: '春' },
  summer: { en: 'Summer', zh: '夏' },
  autumn: { en: 'Autumn', zh: '秋' },
  winter: { en: 'Winter', zh: '冬' },
};

/** 上/中/下 — first / middle / last third of a calendar month. */
export type MonthPhase = 'upper' | 'middle' | 'lower';

export const MONTH_PHASES: MonthPhase[] = ['upper', 'middle', 'lower'];

export const MONTH_PHASE_LABEL: Record<MonthPhase, { en: string; zh: string }> = {
  upper:  { en: 'early', zh: '上' },
  middle: { en: 'mid',   zh: '中' },
  lower:  { en: 'late',  zh: '下' },
};

export interface GameDate {
  year: number;
  season: Season;
  /** 1-12. Optional for backward compat with legacy saves. */
  month?: number;
  /** 上/中/下. Optional for backward compat. */
  phase?: MonthPhase;
}

/** Derive season from month (1-12). */
export function seasonFromMonth(month: number): Season {
  if (month >= 1 && month <= 3) return 'spring';
  if (month >= 4 && month <= 6) return 'summer';
  if (month >= 7 && month <= 9) return 'autumn';
  return 'winter';
}

/** First month of a season — for advancing from a season-only date. */
export function firstMonthOfSeason(season: Season): number {
  switch (season) {
    case 'spring': return 1;
    case 'summer': return 4;
    case 'autumn': return 7;
    case 'winter': return 10;
  }
}

export interface BilingualName {
  en: string;
  zh: string;
}

export type EntityId = string;

/** 稅率 — light/normal/heavy taxation, trading gold income against loyalty. */
export type TaxRate = 'light' | 'normal' | 'heavy';
