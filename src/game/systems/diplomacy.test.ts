import { describe, it, expect } from 'vitest';
import { proposeNonAggression, type DiplomaticContext } from './diplomacy';
import type { Force } from '../types';

const force = (id: string): Force => ({
  id,
  name: { zh: id, en: id },
  rulerOfficerId: `${id}-ruler`,
  capitalCityId: `${id}-cap`,
  color: '#888',
  isPlayer: id === 'me',
});

// Neutral start (empty relations) ⇒ NAP chance = 0.55 + credibilityMod.
//   credibility 100 → 0.55 ; credibility 0 → 0.15.  A roll of 0.3 sits between.
const ctx = (cred: number | undefined, roll: number): DiplomaticContext => ({
  player: force('me'),
  playerRulerCharisma: 0,
  target: force('rival'),
  targetTotalTroops: 10_000,
  playerTotalTroops: 10_000,
  diplomacy: { relations: {} },
  date: { year: 200, season: 'spring' },
  rng: () => roll,
  proposerCredibility: cred,
});

describe('信譽 — credibility gates pact acceptance', () => {
  it('full credibility accepts a NAP that a tarnished name cannot', () => {
    expect(proposeNonAggression(ctx(100, 0.3)).accepted).toBe(true);
    expect(proposeNonAggression(ctx(0, 0.3)).accepted).toBe(false);
  });

  it('omitting credibility behaves as full repute (back-compat)', () => {
    expect(proposeNonAggression(ctx(undefined, 0.3)).accepted).toBe(true);
  });
});
