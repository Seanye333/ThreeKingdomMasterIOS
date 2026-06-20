/**
 * 系列賽 (best-of series) — wraps a run of single duels into a 三局兩勝 / 五局三勝
 * match. Between bouts both fighters carry fatigue (a 車輪戰): both tire, the
 * loser of a bout more than the winner, so a long series wears down the body
 * even when the spirit holds. The match ends the moment a side clinches the
 * majority, or when every scheduled bout has been fought.
 */
export type DuelSide = 'attacker' | 'defender';

export interface DuelSeriesState {
  bestOf: number;   // 1 | 3 | 5 — total scheduled bouts
  aWins: number;
  dWins: number;
  draws: number;
  aFatigue: number; // stamina penalty carried into the next bout (車輪戰)
  dFatigue: number;
  bout: number;     // 1-based index of the NEXT bout to fight
}

/** Bouts a side must win to clinch the series (majority of bestOf). */
export function seriesTarget(bestOf: number): number {
  return Math.floor(bestOf / 2) + 1;
}

export function initDuelSeries(bestOf: number): DuelSeriesState {
  return { bestOf, aWins: 0, dWins: 0, draws: 0, aFatigue: 0, dFatigue: 0, bout: 1 };
}

// Fatigue each bout adds to a fighter's carried penalty. The loser flags harder
// than the winner; a draw leaves both well-winded. Capped so even the loser of
// a long series can still raise their guard in the decider.
const WIN_FATIGUE = 12;
const LOSE_FATIGUE = 22;
const DRAW_FATIGUE = 18;
const FATIGUE_CAP = 55;

/** Fold a finished bout's result into the series: tally the win and carry fatigue. */
export function advanceDuelSeries(s: DuelSeriesState, winner: DuelSide | 'draw'): DuelSeriesState {
  const add = (winning: boolean, drawn: boolean) =>
    drawn ? DRAW_FATIGUE : winning ? WIN_FATIGUE : LOSE_FATIGUE;
  const drawn = winner === 'draw';
  return {
    ...s,
    aWins: s.aWins + (winner === 'attacker' ? 1 : 0),
    dWins: s.dWins + (winner === 'defender' ? 1 : 0),
    draws: s.draws + (drawn ? 1 : 0),
    aFatigue: Math.min(FATIGUE_CAP, s.aFatigue + add(winner === 'attacker', drawn)),
    dFatigue: Math.min(FATIGUE_CAP, s.dFatigue + add(winner === 'defender', drawn)),
    bout: s.bout + 1,
  };
}

/** Total bouts already fought in the series. */
export function seriesBoutsPlayed(s: DuelSeriesState): number {
  return s.aWins + s.dWins + s.draws;
}

/** True once the match is decided (a side clinched, or all bouts are fought). */
export function seriesOver(s: DuelSeriesState): boolean {
  const target = seriesTarget(s.bestOf);
  return s.aWins >= target || s.dWins >= target || seriesBoutsPlayed(s) >= s.bestOf;
}

/** The match winner once {@link seriesOver}; a tie on wins is a 'draw'. */
export function seriesWinner(s: DuelSeriesState): DuelSide | 'draw' {
  if (s.aWins > s.dWins) return 'attacker';
  if (s.dWins > s.aWins) return 'defender';
  return 'draw';
}
