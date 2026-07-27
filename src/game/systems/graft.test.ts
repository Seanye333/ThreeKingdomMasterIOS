import { describe, expect, it } from 'vitest';
import {
  graftIncomeMul, graftAccrual, graftClawback, graftCleared, graftTier, graftReading,
  GRAFT_INCOME_DIVISOR, GRAFT_RESENTMENT_AT,
} from './graft';

/**
 * 貪腐 was the one city stat with no number anywhere in the UI — 138 engine
 * reads against four UI hits, and all four were the command id string. These
 * tests pin the shape of what the player is now shown, and in particular that
 * the panel's figures are the SAME ones the ledger applies: the formulas moved
 * here out of economy.ts / commands.ts / resolution.ts precisely so a view-layer
 * copy could not drift away from the engine.
 */

describe('貪腐蝕利 — what graft costs', () => {
  it('a clean city loses nothing and a rotten one loses 40%', () => {
    expect(graftIncomeMul(0)).toBe(1);
    expect(graftIncomeMul(undefined)).toBe(1);
    expect(graftIncomeMul(100)).toBeCloseTo(0.6, 10);
    expect(100 / GRAFT_INCOME_DIVISOR).toBeCloseTo(0.4, 10);
  });

  it('clamps rather than letting an out-of-range value invert the ledger', () => {
    expect(graftIncomeMul(-50)).toBe(1);
    expect(graftIncomeMul(999)).toBeCloseTo(0.6, 10);
  });
});

describe('貪腐滋長 — who rots fastest', () => {
  const base = { commerce: 600, bestPolitics: 60 };

  it('a richer city tempts more', () => {
    expect(graftAccrual({ ...base, commerce: 900 }))
      .toBeGreaterThan(graftAccrual({ ...base, commerce: 300 }));
  });

  it('an abler administrator restrains it', () => {
    expect(graftAccrual({ ...base, bestPolitics: 95 }))
      .toBeLessThan(graftAccrual({ ...base, bestPolitics: 30 }));
  });

  it('but even the ablest official cannot hold a wealthy city level alone', () => {
    // The politics term is capped at 0.6 — that cap is the whole reason a rich
    // city still needs periodic sweeps.
    expect(graftAccrual({ commerce: 900, bestPolitics: 100 })).toBeGreaterThan(0);
  });

  it('never goes negative — graft is not un-accrued by good governance alone', () => {
    expect(graftAccrual({ commerce: 0, bestPolitics: 100 })).toBe(0);
  });

  it('the caller\'s modifiers all bite', () => {
    const plain = graftAccrual(base);
    expect(graftAccrual({ ...base, cultureMul: 0.5 })).toBeCloseTo(plain * 0.5, 10);
    expect(graftAccrual({ ...base, lawMul: 0.8, relayMul: 0.5 })).toBeCloseTo(plain * 0.4, 10);
  });
});

describe('巡查肅貪 — the audit is a timing decision', () => {
  it('the clawback grows with the hoard, which is why waiting pays', () => {
    const early = graftClawback(600, 70, 10);
    const late = graftClawback(600, 70, 80);
    expect(late).toBeGreaterThan(early * 2);
  });

  it('a richer city yields more from the same sweep', () => {
    expect(graftClawback(900, 70, 40)).toBeGreaterThan(graftClawback(300, 70, 40));
  });

  it('one pass never clears an entrenched hoard', () => {
    expect(graftCleared(70, 90)).toBeLessThan(90);
    // An abler inspector clears more...
    expect(graftCleared(96, 90)).toBeGreaterThan(graftCleared(30, 90));
    // ...and nobody clears more than is there.
    expect(graftCleared(96, 5)).toBe(5);
  });
});

describe('graftTier / graftReading — what the panel says', () => {
  it('names the four bands', () => {
    expect(graftTier(0).zh).toBe('吏治清明');
    expect(graftTier(30).zh).toBe('吏胥漸墨');
    expect(graftTier(GRAFT_RESENTMENT_AT).zh).toBe('貪墨生怨');
    expect(graftTier(85).zh).toBe('蠹吏盈庭');
    expect(graftTier(undefined).zh).toBe('吏治清明');
  });

  it('reports the skim as a share and, when the clean figure is known, as gold', () => {
    const r = graftReading({ corruption: 50, commerce: 600, politics: 70, cleanGold: 1000 });
    expect(r.skim).toBeCloseTo(0.2, 10);
    expect(r.goldLost).toBe(200);
    expect(r.resented).toBe(false);
  });

  it('flags resentment at the threshold the engine uses for the loyalty bite', () => {
    expect(graftReading({ corruption: GRAFT_RESENTMENT_AT - 1, commerce: 600, politics: 70 }).resented).toBe(false);
    expect(graftReading({ corruption: GRAFT_RESENTMENT_AT, commerce: 600, politics: 70 }).resented).toBe(true);
  });

  it('quotes a clawback and a clear that match the command\'s own maths', () => {
    const r = graftReading({ corruption: 44, commerce: 700, politics: 82 });
    expect(r.clawback).toBe(graftClawback(700, 82, 44));
    expect(r.cleared).toBe(graftCleared(82, 44));
  });

  it('omits the gold figure rather than inventing one when income is unknown', () => {
    expect(graftReading({ corruption: 50, commerce: 600, politics: 70 }).goldLost).toBe(0);
  });
});
