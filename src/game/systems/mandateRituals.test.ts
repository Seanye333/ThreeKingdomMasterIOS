/** §8.5 祭天禮 — 郊祀 & 祈雨. */
import { describe, expect, it } from 'vitest';
import type { Officer } from '../types';
import {
  performSuburbanRite,
  performRainRite,
  bestRitePresider,
} from './mandateRituals';

describe('performSuburbanRite', () => {
  it('lifts the mandate, louder with the Son of Heaven in hand', () => {
    const plain = performSuburbanRite({ mandate: 50, holdsEmperor: false, lastRiteYear: null, year: 200, rng: () => 0 });
    const imperial = performSuburbanRite({ mandate: 50, holdsEmperor: true, lastRiteYear: null, year: 200, rng: () => 0 });
    expect(plain.ok).toBe(true);
    expect(plain.mandateDelta).toBe(6);
    expect(imperial.mandateDelta).toBe(10);
  });
  it('runs once a year', () => {
    const r = performSuburbanRite({ mandate: 50, holdsEmperor: false, lastRiteYear: 200, year: 200, rng: () => 0 });
    expect(r.ok).toBe(false);
  });
  it('is empty theater at 95+ mandate', () => {
    const r = performSuburbanRite({ mandate: 96, holdsEmperor: true, lastRiteYear: null, year: 200, rng: () => 0 });
    expect(r.ok).toBe(false);
  });
});

describe('performRainRite', () => {
  it('refuses outside a drought', () => {
    expect(performRainRite({ weatherKind: 'clear', presiderPolitics: 90, rng: () => 0 }).ok).toBe(false);
  });
  it('a skilled presider can break the drought', () => {
    const r = performRainRite({ weatherKind: 'drought', presiderPolitics: 90, rng: () => 0.01 });
    expect(r.ok).toBe(true);
    expect(r.success).toBe(true);
    expect(r.loyaltyDelta).toBeGreaterThan(0);
  });
  it('the sky may stay brass', () => {
    const r = performRainRite({ weatherKind: 'drought', presiderPolitics: 50, rng: () => 0.99 });
    expect(r.ok).toBe(true);
    expect(r.success).toBe(false);
    expect(r.mandateDelta).toBe(0);
  });
});

describe('bestRitePresider', () => {
  const officer = (id: string, forceId: string | null, politics: number, status = 'idle'): Officer =>
    ({ id, forceId, status, name: { zh: id, en: id }, stats: { leadership: 50, war: 50, intelligence: 50, politics, charisma: 50 } } as unknown as Officer);
  it('picks the realm\'s best civil mind, skipping the dead and jailed', () => {
    const officers = {
      a: officer('a', 'p', 80),
      b: officer('b', 'p', 95, 'dead'),
      c: officer('c', 'p', 90),
      d: officer('d', 'other', 99),
    };
    expect(bestRitePresider(officers, 'p')?.id).toBe('c');
  });
});
