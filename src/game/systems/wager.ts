import type { Officer } from '../types';
import { staticProwess } from './duel';

/**
 * 賭鬥 — side-wagers on a duel. Odds come from the fighters' static prowess gap:
 * back a heavy favourite and the house pays little; stake on an underdog and a
 * win pays out richly. A duel always turns on the dice, so the win chance is
 * clamped away from certainty either way.
 */

/** Win probability for `me` against `foe`, from the static prowess gap. */
export function duelWinChance(me: Officer, foe: Officer): number {
  const gap = staticProwess(me) - staticProwess(foe);
  const p = 1 / (1 + Math.pow(10, -gap / 28));
  return Math.max(0.12, Math.min(0.88, p));
}

/** Payout multiplier on a winning stake (total returned = stake × multiplier).
 *  Fair odds (1/p) are trimmed by a house margin and floored so even a clear
 *  favourite pays something. */
export function wagerMultiplier(me: Officer, foe: Officer): number {
  const p = duelWinChance(me, foe);
  return Math.max(1.2, Math.round((1 / p) * 0.9 * 10) / 10);
}

/** Total gold returned on a winning stake (the stake back plus the profit). */
export function wagerPayout(stake: number, multiplier: number): number {
  return Math.round(stake * multiplier);
}

/** Profit on a winning stake (payout minus the stake itself). */
export function wagerProfit(stake: number, multiplier: number): number {
  return wagerPayout(stake, multiplier) - stake;
}
