import { useCallback } from 'react';
import { useGameStore } from '../../game/state/store';
import { useLanguage } from '../i18n';
import { formatEraYear, eraOffsetFor } from '../../game/data/era';

/**
 * 紀年 — format an internal game year the way the player should read it.
 *
 * The engine runs every board on one shared positive timeline (see
 * `game/data/era.ts` for why), so a Warring States campaign's internal year is
 * 178 and printing it raw says "178 AD" over a board set in 260 BC. This hook
 * looks up the running scenario's era offset and hands back a formatter.
 *
 * Returns a stable callback so it can sit in JSX without re-rendering the
 * caller on every store tick.
 */
export function useEraYear(): (internalYear: number) => string {
  const scenarioId = useGameStore((s) => s.scenarioId);
  const lang = useLanguage();
  const offset = eraOffsetFor(scenarioId);
  const l: 'zh' | 'en' = lang === 'en' ? 'en' : 'zh';
  return useCallback((y: number) => formatEraYear(y, offset, l), [offset, l]);
}

/** 中/英兩種都要時(季節轉場那類雙語並列的版面)。 */
export function useEraYearBoth(): { zh: (y: number) => string; en: (y: number) => string } {
  const scenarioId = useGameStore((s) => s.scenarioId);
  const offset = eraOffsetFor(scenarioId);
  return {
    zh: useCallback((y: number) => formatEraYear(y, offset, 'zh'), [offset]),
    en: useCallback((y: number) => formatEraYear(y, offset, 'en'), [offset]),
  };
}
