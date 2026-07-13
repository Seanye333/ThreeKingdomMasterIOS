import { describe, it, expect } from 'vitest';
import { rollBounties, fulfilledBounties } from './bounty';
import { festivalPool, festivalDraw, FESTIVAL_PITY } from './festival';
import type { City, Officer } from '../types';

const mk = (id: string, over: Partial<Officer> = {}): Officer => ({
  id, name: { zh: id, en: id }, birthYear: 160,
  stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
  loyalty: 80, locationCityId: 'c1', forceId: 'enemy', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general',
  ...over,
} as Officer);

const ACE = { leadership: 96, war: 99, intelligence: 92, politics: 85, charisma: 90 }; // score ≥92 → gold

describe('天下懸賞榜', () => {
  it('rolls up to three notices from gold+ enemies and free agents', () => {
    const officers = Object.fromEntries([
      mk('e1', { stats: ACE }), mk('e2', { stats: ACE }),
      mk('f1', { stats: ACE, forceId: null }),
      mk('weak'), // below gold — never posted
      mk('mine', { stats: ACE, forceId: 'player' }),
    ].map((o) => [o.id, o]));
    const bs = rollBounties(officers, 'player', 190, () => 0.5, []);
    expect(bs.length).toBeGreaterThanOrEqual(2);
    expect(bs.length).toBeLessThanOrEqual(3);
    expect(bs.every((b) => ['e1', 'e2', 'f1'].includes(b.officerId))).toBe(true);
    expect(bs.every((b) => b.expiresYear === 191)).toBe(true);
  });

  it('settles a capture only when the mark sits in a player city', () => {
    const officers = {
      e1: mk('e1', { stats: ACE, status: 'imprisoned', locationCityId: 'pc' }),
      f1: mk('f1', { stats: ACE, forceId: 'player' }),
    };
    const cities = {
      pc: { id: 'pc', ownerForceId: 'player' } as City,
    };
    const bounties = [
      { officerId: 'e1', kind: 'capture' as const, gold: 1000, renown: 15, expiresYear: 195 },
      { officerId: 'f1', kind: 'recruit' as const, gold: 600, renown: 10, expiresYear: 195 },
    ];
    const done = fulfilledBounties(bounties, officers, cities, 'player');
    expect(done.map((b) => b.officerId).sort()).toEqual(['e1', 'f1']);
    // Mark held in an ENEMY jail is not yours to claim.
    const elsewhere = { ...officers, e1: mk('e1', { stats: ACE, status: 'imprisoned', locationCityId: 'ec' }) };
    expect(fulfilledBounties(bounties, elsewhere, cities, 'player').map((b) => b.officerId)).toEqual(['f1']);
  });
});

describe('求賢祭', () => {
  it('pool = the undiscovered; pity forces a gold+ reveal', () => {
    const officers = Object.fromEntries([
      mk('h1', { status: 'unsearched', forceId: null }),
      mk('h2', { status: 'unsearched', forceId: null, stats: ACE }),
      mk('open', { forceId: null }), // already revealed — not in pool
    ].map((o) => [o.id, o]));
    const pool = festivalPool(officers);
    expect(pool.all.map((o) => o.id).sort()).toEqual(['h1', 'h2']);
    expect(pool.goldPlus.map((o) => o.id)).toEqual(['h2']);
    // rng 0 → first of pool without pity; with pity, forced to the gold list.
    expect(festivalDraw(pool, 0, () => 0)?.id).toBe('h1');
    expect(festivalDraw(pool, FESTIVAL_PITY, () => 0)?.id).toBe('h2');
    expect(festivalDraw(festivalPool({}), 0, () => 0)).toBeNull();
  });
});
