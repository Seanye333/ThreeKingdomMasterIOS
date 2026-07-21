import { describe, it, expect } from 'vitest';
import {
  splitCasualties, recoverWounded, woundedTier,
  BASE_WOUNDED_SHARE, MEDICINE_PER_WOUNDED,
} from './veterans';

describe('傷亡之分', () => {
  it('nothing from nothing', () => {
    expect(splitCasualties(0)).toEqual({ dead: 0, wounded: 0 });
    expect(splitCasualties(-50)).toEqual({ dead: 0, wounded: 0 });
  });

  it('roughly a third of a beaten force is wounded, not dead', () => {
    const s = splitCasualties(10000);
    expect(s.wounded).toBe(Math.round(10000 * BASE_WOUNDED_SHARE));
    expect(s.dead + s.wounded).toBe(10000);
  });

  it('holding the field means carrying your own off', () => {
    expect(splitCasualties(10000, { heldField: true }).wounded)
      .toBeGreaterThan(splitCasualties(10000).wounded);
  });

  it('never counts more than half the casualties as recoverable', () => {
    const s = splitCasualties(10000, { heldField: true, hasHospital: true });
    expect(s.wounded).toBeLessThanOrEqual(5500);
    expect(s.dead).toBeGreaterThan(0);
  });
});

describe('療傷', () => {
  const w = 1000;

  it('accounts for every man, every season', () => {
    const r = recoverWounded({ wounded: w });
    expect(r.recovered + r.died + r.invalided + r.remaining).toBe(w);
  });

  it('untended, a third come back and a fifth die', () => {
    const r = recoverWounded({ wounded: w });
    expect(r.recovered).toBeGreaterThan(300);
    expect(r.recovered).toBeLessThan(400);
    expect(r.died).toBeGreaterThan(150);
  });

  it('a field hospital with medicine and a physician turns it around', () => {
    const bare = recoverWounded({ wounded: w });
    const tended = recoverWounded({
      wounded: w, hospitalLevel: 2, physicianIntellect: 95, medicine: 9999,
    });
    expect(tended.recovered).toBeGreaterThan(bare.recovered * 1.5);
    expect(tended.died).toBeLessThan(bare.died / 2);
  });

  it('medicine only helps as far as it goes round', () => {
    const full = recoverWounded({ wounded: w, medicine: w * MEDICINE_PER_WOUNDED });
    const half = recoverWounded({ wounded: w, medicine: w * MEDICINE_PER_WOUNDED / 2 });
    const none = recoverWounded({ wounded: w, medicine: 0 });
    expect(full.recovered).toBeGreaterThan(half.recovered);
    expect(half.recovered).toBeGreaterThan(none.recovered);
    expect(full.medicineUsed).toBe(Math.round(w * MEDICINE_PER_WOUNDED));
  });

  it('never draws more medicine than the wounded need', () => {
    const r = recoverWounded({ wounded: 10, medicine: 100000 });
    expect(r.medicineUsed).toBeLessThanOrEqual(Math.ceil(10 * MEDICINE_PER_WOUNDED));
  });

  it('an empty infirmary is a no-op', () => {
    expect(recoverWounded({ wounded: 0, hospitalLevel: 3, medicine: 500 }))
      .toEqual({ recovered: 0, invalided: 0, died: 0, remaining: 0, medicineUsed: 0 });
  });

  it('even the best care never returns everyone', () => {
    const r = recoverWounded({ wounded: w, hospitalLevel: 3, physicianIntellect: 100, medicine: 99999 });
    expect(r.recovered).toBeLessThan(w);
    expect(r.died).toBeGreaterThan(0);
  });
});

describe('傷兵營之況', () => {
  it('reads against the garrison it belongs to', () => {
    expect(woundedTier(0, 10000).zh).toBe('營中無傷');
    expect(woundedTier(500, 10000).zh).toBe('略有傷卒');
    expect(woundedTier(1500, 10000).zh).toBe('傷者頗眾');
    expect(woundedTier(4000, 10000).zh).toBe('傷卒滿營');
  });
});
