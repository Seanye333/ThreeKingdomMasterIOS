import { describe, it, expect } from 'vitest';
import { proposeNonAggression, applyCoalitionPressure, type DiplomaticContext } from './diplomacy';
import { getRelation } from '../types';
import type { City, DiplomaticState, Force } from '../types';

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

describe('積怨 — grudge gates pact acceptance', () => {
  const ctxG = (grudge: number, roll: number): DiplomaticContext => ({
    player: force('me'),
    playerRulerCharisma: 0,
    target: force('rival'),
    targetTotalTroops: 10_000,
    playerTotalTroops: 10_000,
    diplomacy: { relations: {} },
    date: { year: 200, season: 'spring' },
    rng: () => roll,
    targetGrudge: grudge,
  });

  it('a bitter foe (high grudge) refuses a NAP an unresentful one accepts', () => {
    // base NAP chance 0.55; grudge 100 → −0.5 → 0.10. A roll of 0.3 splits them.
    expect(proposeNonAggression(ctxG(0, 0.3)).accepted).toBe(true);
    expect(proposeNonAggression(ctxG(100, 0.3)).accepted).toBe(false);
  });

  it('omitting grudge behaves as no resentment', () => {
    expect(proposeNonAggression(ctxG(undefined as unknown as number, 0.3)).accepted).toBe(true);
  });
});

// ── 動態聯盟 — coalitions against a runaway power ──────────────────────
const mkCities = (counts: Record<string, number>): Record<string, City> => {
  const cities: Record<string, City> = {};
  let i = 0;
  for (const [fid, n] of Object.entries(counts)) {
    for (let k = 0; k < n; k++) cities[`c${i}`] = ({ id: `c${i++}`, ownerForceId: fid } as unknown as City);
  }
  return cities;
};
const mkForces = (ids: string[]): Record<string, Force> =>
  Object.fromEntries(ids.map((id) => [id, force(id)]));
const coalition = (counts: Record<string, number>, player: string | null, dip?: DiplomaticState) =>
  applyCoalitionPressure({
    diplomacy: dip ?? { relations: {} },
    cities: mkCities(counts),
    forces: mkForces(Object.keys(counts)),
    playerForceId: player,
    date: { year: 200, season: 'summer' },
  });

describe('動態聯盟 — coalitions vs a hegemon', () => {
  it('no runaway leader → no coalition forms', () => {
    const res = coalition({ a: 2, b: 2, c: 2, d: 2 }, null);
    expect(res.hegemonId).toBeNull();
    expect(Object.keys(res.diplomacy.relations)).toHaveLength(0);
  });

  it('a hegemon cools rivals toward it and warms them to each other', () => {
    const res = coalition({ big: 5, a: 1, b: 1, c: 1 }, null);
    expect(res.hegemonId).toBe('big');
    expect(getRelation(res.diplomacy, 'a', 'big').score).toBeLessThan(0);
    expect(getRelation(res.diplomacy, 'a', 'b').score).toBeGreaterThan(0);
  });

  it('sustained pressure forges a coalition alliance and sours it on the hegemon', () => {
    let dip: DiplomaticState = { relations: {} };
    for (let s = 0; s < 20; s++) dip = coalition({ big: 6, a: 1, b: 1, c: 1 }, null, dip).diplomacy;
    expect(getRelation(dip, 'a', 'b').status).toBe('allied');
    expect(getRelation(dip, 'a', 'big').score).toBeLessThanOrEqual(-50);
  });

  it('a non-hegemon player keeps its own diplomacy (AIs still coalesce)', () => {
    const res = coalition({ big: 5, me: 1, b: 1, c: 1 }, 'me');
    expect(getRelation(res.diplomacy, 'me', 'big').score).toBe(0); // untouched
    expect(getRelation(res.diplomacy, 'me', 'b').score).toBe(0);   // untouched
    expect(getRelation(res.diplomacy, 'b', 'c').score).toBeGreaterThan(0); // AIs warm
  });

  it('a player hegemon faces the coalition — AIs cool toward the player', () => {
    const res = coalition({ me: 5, a: 1, b: 1, c: 1 }, 'me');
    expect(res.hegemonId).toBe('me');
    expect(getRelation(res.diplomacy, 'a', 'me').score).toBeLessThan(0);
  });
});
