/**
 * Integration test for 富商借餉 (merchant war-loan) through the REAL store:
 * borrowing grants a lump to the capital and records the debt; a second loan is
 * refused while one is outstanding; a season-end draws the instalment down.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

// endSeason's autosave touches localStorage; stub it for the node env.
beforeAll(() => {
  const g = globalThis as unknown as { localStorage?: unknown };
  if (!g.localStorage) {
    const mem = new Map<string, string>();
    g.localStorage = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() { return mem.size; },
    };
  }
});

import { useGameStore } from './store';
import { SCENARIOS } from '../data/scenarios';

describe('富商借餉 — store integration', () => {
  beforeEach(() => {
    useGameStore.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  });

  const capital = () => {
    const s = useGameStore.getState();
    return s.cities[s.forces[s.playerForceId!]!.capitalCityId];
  };

  it('grants a lump to the capital and records owed/perSeason', () => {
    const goldBefore = capital().gold;
    const r = useGameStore.getState().borrowWarFunds();
    expect(r.ok).toBe(true);
    expect(r.gold).toBeGreaterThan(0);
    expect(capital().gold).toBe(goldBefore + r.gold);
    const loan = useGameStore.getState().merchantLoan!;
    expect(loan.owed).toBe(Math.round(r.gold * 1.25));   // 25% interest baked in
    expect(loan.perSeason).toBe(Math.ceil(loan.owed / 8)); // repaid over 8 seasons
  });

  it('refuses a second loan while one is outstanding', () => {
    expect(useGameStore.getState().borrowWarFunds().ok).toBe(true);
    const r2 = useGameStore.getState().borrowWarFunds();
    expect(r2.ok).toBe(false);
    expect(r2.message).toBeTruthy();
  });

  it('draws an instalment from the treasury at season-end', () => {
    const r = useGameStore.getState().borrowWarFunds();
    const owedBefore = useGameStore.getState().merchantLoan!.owed;
    const per = useGameStore.getState().merchantLoan!.perSeason;
    // Make sure the capital can cover the instalment so it isn't a partial pay,
    // and park the calendar on a season boundary (month 3 / lower phase) so one
    // endSeason() actually crosses it and triggers repayment.
    const cap = capital();
    useGameStore.setState({
      cities: { ...useGameStore.getState().cities, [cap.id]: { ...cap, gold: 999_999 } },
      date: { ...useGameStore.getState().date, month: 3, phase: 'lower' },
    });
    useGameStore.getState().endSeason();
    const loan = useGameStore.getState().merchantLoan;
    // Either the debt shrank by one instalment, or it cleared (owed ≤ per).
    if (loan) expect(loan.owed).toBe(owedBefore - per);
    else expect(owedBefore).toBeLessThanOrEqual(per);
    expect(r.ok).toBe(true);
  });
});
