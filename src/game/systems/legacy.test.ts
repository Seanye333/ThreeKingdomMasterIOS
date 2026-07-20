import { describe, it, expect, beforeEach } from 'vitest';
import {
  emptyLegacy, legacyEarned, armBoon, disarmBoon, bankRun, LEGACY_BOONS, BOONS_BY_ID, MAX_ARMED,
  loadLegacy, saveLegacy,
} from './legacy';

beforeEach(() => {
  const g = globalThis as unknown as { localStorage?: Storage };
  if (!g.localStorage) {
    const mem = new Map<string, string>();
    g.localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() { return mem.size; },
    } as unknown as Storage;
  }
  localStorage.clear();
});

describe('遺澤幾何', () => {
  it('a long, wide, victorious run banks far more than a short one', () => {
    const great = legacyEarned({ cities: 30, years: 40, ending: 'unify', achievements: 12 });
    const brief = legacyEarned({ cities: 1, years: 1, ending: 'defeat' });
    expect(great).toBeGreaterThan(brief * 5);
  });

  it('an honourable collapse still leaves something — that is the point', () => {
    expect(legacyEarned({ cities: 4, years: 12, ending: 'defeat' })).toBeGreaterThan(15);
  });

  it('cannot be farmed by restarting immediately', () => {
    expect(legacyEarned({ cities: 1, years: 0, ending: 'defeat' })).toBeLessThan(12);
  });

  it('caps reach, span and deeds so one monster run does not fund everything', () => {
    const huge = legacyEarned({ cities: 200, years: 300, ending: 'unify', achievements: 200 });
    expect(huge).toBeLessThanOrEqual(60 + 25 + 60 + 20);
  });
});

describe('備澤', () => {
  it('spends points and lists the boon', () => {
    const r = armBoon({ ...emptyLegacy(), points: 100 }, 'family-silver');
    expect(r.ok).toBe(true);
    expect(r.ledger.points).toBe(100 - BOONS_BY_ID['family-silver'].cost);
    expect(r.ledger.armed).toEqual(['family-silver']);
  });

  it('refuses what you cannot afford', () => {
    const r = armBoon({ ...emptyLegacy(), points: 5 }, 'old-retainer');
    expect(r.ok).toBe(false);
    expect(r.ledger.points).toBe(5);
  });

  it('refuses the same boon twice, and more than the per-run cap', () => {
    let l = { ...emptyLegacy(), points: 500 };
    for (const b of LEGACY_BOONS.slice(0, MAX_ARMED)) l = armBoon(l, b.id).ledger;
    expect(l.armed).toHaveLength(MAX_ARMED);
    expect(armBoon(l, LEGACY_BOONS[0].id).ok).toBe(false);          // duplicate
    expect(armBoon(l, LEGACY_BOONS[MAX_ARMED].id).ok).toBe(false);  // over the cap
  });

  it('disarming refunds exactly what it cost', () => {
    const armed = armBoon({ ...emptyLegacy(), points: 100 }, 'heirloom-blade').ledger;
    const back = disarmBoon(armed, 'heirloom-blade');
    expect(back.points).toBe(100);
    expect(back.armed).toEqual([]);
  });
});

describe('銀庫', () => {
  it('banking a run adds to both counters and clears the armed list', () => {
    const after = bankRun({ points: 10, earned: 10, armed: ['family-silver'], runs: 2 }, 45);
    expect(after.points).toBe(55);
    expect(after.earned).toBe(55);
    expect(after.armed).toEqual([]);
    expect(after.runs).toBe(3);
  });

  it('round-trips through storage, and a corrupt ledger degrades to empty', () => {
    saveLegacy({ points: 33, earned: 90, armed: ['granary-store'], runs: 4 });
    expect(loadLegacy()).toEqual({ points: 33, earned: 90, armed: ['granary-store'], runs: 4 });
    localStorage.setItem('tkm-legacy-v1', '{not json');
    expect(loadLegacy()).toEqual(emptyLegacy());
  });

  it('sanitises nonsense fields rather than trusting them', () => {
    localStorage.setItem('tkm-legacy-v1', JSON.stringify({ points: -50, armed: [1, 'family-silver'], runs: 2.7 }));
    const l = loadLegacy();
    expect(l.points).toBe(0);
    expect(l.armed).toEqual(['family-silver']);
    expect(l.runs).toBe(2);
  });
});
