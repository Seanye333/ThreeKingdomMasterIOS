import { describe, expect, it } from 'vitest';
import { mulberry32, hashSeed, newCampaignSeed, campaignRng, subRng } from './campaignRng';
import type { GameState } from './gameState';

/**
 * 戰役隨機源 — the seam that makes a season replayable. See campaignRng.ts for
 * why player-triggered rolls deliberately stay outside it.
 */

const at = (over: Partial<GameState['date']> = {}, seed = 12345): Pick<GameState, 'rngSeed' | 'date'> => ({
  rngSeed: seed,
  date: { year: 190, season: 'spring', month: 1, phase: 'upper', ...over } as GameState['date'],
});

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(99), b = mulberry32(99);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('stays inside [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 2000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('does not immediately repeat itself', () => {
    const r = mulberry32(3);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(r());
    expect(seen.size).toBeGreaterThan(490);
  });

  it('different seeds give different streams', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('hashSeed', () => {
  it('is stable across calls', () => {
    expect(hashSeed('190|spring|1|upper')).toBe(hashSeed('190|spring|1|upper'));
  });

  it('separates keys that differ by one character', () => {
    expect(hashSeed('190|spring')).not.toBe(hashSeed('190|sprinh'));
  });

  it('returns an unsigned 32-bit value', () => {
    for (const k of ['', 'a', 'a very long composite key |1|2|3|4']) {
      const h = hashSeed(k);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
      expect(Number.isInteger(h)).toBe(true);
    }
  });
});

describe('newCampaignSeed', () => {
  it('never returns 0 — a zero seed would collapse the stream', () => {
    for (let i = 0; i < 200; i++) expect(newCampaignSeed()).not.toBe(0);
  });
});

describe('campaignRng — 同一季必須重播一致', () => {
  it('the same state yields the same stream', () => {
    const s = at();
    const a = campaignRng(s), b = campaignRng(s);
    expect(Array.from({ length: 20 }, a)).toEqual(Array.from({ length: 20 }, b));
  });

  it('advancing the season yields a different stream', () => {
    // Without this every season of a campaign would roll identically.
    const spring = campaignRng(at({ season: 'spring' }))();
    const summer = campaignRng(at({ season: 'summer' }))();
    expect(spring).not.toBe(summer);
  });

  it('advancing the month or phase also re-rolls', () => {
    expect(campaignRng(at({ month: 1 }))()).not.toBe(campaignRng(at({ month: 2 }))());
    expect(campaignRng(at({ phase: 'upper' }))()).not.toBe(campaignRng(at({ phase: 'lower' }))());
  });

  it('two campaigns with different seeds diverge on the same date', () => {
    expect(campaignRng(at({}, 111))()).not.toBe(campaignRng(at({}, 222))());
  });

  it('a seedless (pre-seeding) save still behaves deterministically', () => {
    const legacy = { rngSeed: undefined, date: at().date };
    expect(campaignRng(legacy)()).toBe(campaignRng(legacy)());
  });
});

describe('subRng — 子系統各走各的流', () => {
  it('different channels do not share a stream', () => {
    const s = at();
    expect(subRng(s, 'plague')()).not.toBe(subRng(s, 'rebellion')());
  });

  it('the same channel replays identically', () => {
    const s = at();
    expect(subRng(s, 'plague')()).toBe(subRng(s, 'plague')());
  });

  it('a channel is independent of the base stream', () => {
    const s = at();
    expect(subRng(s, 'plague')()).not.toBe(campaignRng(s)());
  });
});
