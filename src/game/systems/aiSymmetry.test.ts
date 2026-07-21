/**
 * AI 對稱審計 — every institution added for the player must have a defined
 * answer for an AI lord, or the player quietly gets a free advantage that
 * compounds over a 60-year campaign. (This has bitten this project before:
 * the AI was blind to half the internal-affairs commands for months.)
 *
 * These are contract tests over the *fallback* functions, not over ai.ts's
 * behaviour: the rule is that a missing per-force setting must resolve to
 * something sensible for every temperament, never to undefined or NaN.
 */
import { describe, it, expect } from 'vitest';
import { aiGrainPolicy, grainPolicyEffects, GRAIN_POLICIES } from './grainTrade';
import { aiCoinStandard, coinEffects, COIN_STANDARDS } from './coinage';
import { aiServiceSystem, serviceEffects, SERVICE_SYSTEMS } from './conscription';
import { aiRefugeePolicy, refugeePolicyEffects, REFUGEE_POLICIES } from './refugees';
import { aiLawCode } from './law';
import { aiCorvee } from './household';
import { aiSelection } from './officialSelection';

/** Every 君主 AI personality the game ships, plus the unknown case. */
const PERSONALITIES = [
  'aggressive', 'defensive', 'balanced', 'tyrant', 'benevolent',
  'merchant', 'diplomat', 'opportunist', undefined, 'not-a-real-personality',
];

describe('AI 對稱 — 每一項新制度都有 AI 的答案', () => {
  it('糴政 (§1.16): every temperament resolves to a real policy', () => {
    for (const p of PERSONALITIES) {
      const choice = aiGrainPolicy(p);
      expect(GRAIN_POLICIES).toContain(choice);
      expect(Number.isFinite(grainPolicyEffects(choice).commerceDelta)).toBe(true);
    }
  });

  it('錢法 (§1.17): resolves whether the treasury is full or empty', () => {
    for (const p of PERSONALITIES) {
      for (const tight of [true, false]) {
        const choice = aiCoinStandard(p, tight);
        expect(COIN_STANDARDS).toContain(choice);
        expect(coinEffects(choice).goldYieldMul).toBeGreaterThan(0);
      }
    }
  });

  it('兵制 (§4.8): resolves at every level of wealth', () => {
    for (const p of PERSONALITIES) {
      for (const gold of [0, 500, 1500, 5000, 100000]) {
        const choice = aiServiceSystem(p, gold);
        expect(SERVICE_SYSTEMS).toContain(choice);
        expect(serviceEffects(choice).foodUpkeepMul).toBeGreaterThan(0);
      }
    }
  });

  it('流民之政 (§8.6): resolves for every temperament', () => {
    for (const p of PERSONALITIES) {
      const choice = aiRefugeePolicy(p);
      expect(REFUGEE_POLICIES).toContain(choice);
      expect(refugeePolicyEffects(choice).intakeMul).toBeGreaterThanOrEqual(0);
    }
  });

  it('the older institutions still answer too (律令 / 徭役 / 選官)', () => {
    for (const p of PERSONALITIES) {
      expect(aiLawCode(p)).toBeTruthy();
      expect(aiCorvee(p)).toBeTruthy();
      // 選官 reads the court itself rather than the temperament alone; an empty
      // court must still resolve to the historical default.
      expect(aiSelection({ personality: p, officers: [], cityCount: 0 })).toBe('chaju');
    }
  });

  it('no institution collapses to a single answer for every lord', () => {
    // If a fallback ignores temperament entirely the map goes uniform, which is
    // the failure mode that makes AI realms feel identical.
    const spread = (f: (p?: string) => string) => new Set(PERSONALITIES.map((p) => f(p))).size;
    expect(spread(aiGrainPolicy)).toBeGreaterThan(1);
    expect(spread(aiRefugeePolicy)).toBeGreaterThan(1);
    expect(spread((p) => aiCoinStandard(p, true))).toBeGreaterThan(1);
    expect(spread((p) => aiServiceSystem(p, 300))).toBeGreaterThan(1);
  });
});
