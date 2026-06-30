import { describe, it, expect } from 'vitest';
import { resolveEspionage } from './espionage';
import type { Officer } from '../types';

/** Minimal officer carrying just what the resolver reads. */
const officer = (id: string, over: Partial<Officer> = {}): Officer => ({
  id,
  name: { zh: id, en: id },
  forceId: 'enemy',
  status: 'idle',
  stats: { war: 50, leadership: 50, intelligence: 50, politics: 50, charisma: 50 },
  loyalty: 80,
} as unknown as Officer);

describe('行刺敗露 — botched assassination blowback', () => {
  const setup = (rng: () => number) =>
    resolveEspionage({
      ops: [{
        id: 'op1', kind: 'assassinate',
        agentOfficerId: 'spy', targetForceId: 'enemy', targetOfficerId: 'lord',
        issuedYear: 200, issuedSeason: 'spring',
      }],
      cities: {},
      officers: {
        spy: officer('spy', { forceId: 'me', stats: { war: 50, leadership: 50, intelligence: 70, politics: 50, charisma: 50 } as Officer['stats'] }),
        lord: officer('lord', { forceId: 'enemy' }),
      },
      playerForceId: 'me',
      rng,
      buildings: [],
    });

  it('a failed assassination breeds a grudge in the target realm', () => {
    const out = setup(() => 0.99); // roll 0.99 > max chance 0.95 → certain failure
    expect(out.results[0].success).toBe(false);
    expect(out.grudgeDelta['enemy']).toBe(14);
  });

  it('a successful assassination carries no traced-back grudge', () => {
    const out = setup(() => 0.0); // roll 0 < chance → success
    expect(out.results[0].success).toBe(true);
    expect(out.grudgeDelta['enemy']).toBeUndefined();
    expect(out.officers['lord'].status).toBe('dead');
  });
});

describe('new ops (§7.3 ③)', () => {
  // Local builders that actually apply overrides (the shared `officer` ignores them).
  const mk = (id: string, over: Partial<Officer> = {}): Officer => ({
    id, name: { zh: id, en: id }, forceId: 'enemy', status: 'idle',
    stats: { war: 50, leadership: 50, intelligence: 80, politics: 50, charisma: 50 },
    loyalty: 80, traits: [], ...over,
  } as unknown as Officer);
  const cityFix = (id: string, over: Record<string, unknown> = {}) =>
    ({ id, name: { zh: id, en: id }, ownerForceId: 'enemy', troops: 3000, gold: 4000, food: 6000, loyalty: 60, ...over } as unknown as import('../types').City);

  it('盜竊金庫 moves gold from the enemy city to the agent’s home', () => {
    const out = resolveEspionage({
      ops: [{ id: 'op', kind: 'steal-gold', agentOfficerId: 'spy', targetForceId: 'enemy', targetCityId: 'ec', issuedYear: 200, issuedSeason: 'spring' }],
      cities: { ec: cityFix('ec'), home: cityFix('home', { ownerForceId: 'me', gold: 1000 }) },
      officers: { spy: mk('spy', { forceId: 'me', locationCityId: 'home', stats: { war: 50, leadership: 50, intelligence: 95, politics: 50, charisma: 50 } as Officer['stats'] }) },
      playerForceId: 'me', rng: () => 0.0,
    });
    expect(out.results[0].success).toBe(true);
    expect(out.cities['ec'].gold).toBeLessThan(4000);
    expect(out.cities['home'].gold).toBeGreaterThan(1000); // loot landed home
  });

  it('美人計 turns a lustful mark far more readily than a chaste one', () => {
    const run = (lustful: boolean) => resolveEspionage({
      ops: [{ id: 'op', kind: 'seduce', agentOfficerId: 'spy', targetForceId: 'enemy', targetOfficerId: 't', issuedYear: 200, issuedSeason: 'spring' }],
      cities: {},
      officers: {
        spy: mk('spy', { forceId: 'me' }),
        t: mk('t', { forceId: 'enemy', loyalty: 70, traits: lustful ? ['lustful'] : [] } as Partial<Officer>),
      },
      playerForceId: 'me', rng: () => 0.8, // a high roll: lustful (~.95) succeeds, chaste (~.62) fails
    });
    expect(run(true).officers['t'].forceId).toBe('me');
    expect(run(false).officers['t'].forceId).toBe('enemy');
  });

  it('偽書反間 can have the enemy lord jail his own general', () => {
    const out = resolveEspionage({
      ops: [{ id: 'op', kind: 'false-intel', agentOfficerId: 'spy', targetForceId: 'enemy', targetOfficerId: 'g', issuedYear: 200, issuedSeason: 'spring' }],
      cities: {},
      officers: {
        spy: mk('spy', { forceId: 'me', stats: { war: 50, leadership: 50, intelligence: 99, politics: 50, charisma: 50 } as Officer['stats'] }),
        g: mk('g', { forceId: 'enemy', loyalty: 70 }),
      },
      playerForceId: 'me', rng: () => 0.0, // success + jail roll (0.0 < 0.4)
    });
    expect(out.results[0].success).toBe(true);
    expect(out.officers['g'].status).toBe('imprisoned');
    expect(out.officers['g'].capturedFromForceId).toBe('enemy');
  });
});

describe('§7.3 round 2 (intel / assassination / spymaster)', () => {
  const mk = (id: string, over: Partial<Officer> = {}): Officer => ({
    id, name: { zh: id, en: id }, forceId: 'enemy', status: 'idle',
    stats: { war: 50, leadership: 50, intelligence: 60, politics: 50, charisma: 50 },
    loyalty: 80, traits: [], ...over,
  } as unknown as Officer);

  it('① gather-intel reports the target’s treaties and intent', () => {
    const out = resolveEspionage({
      ops: [{ id: 'op', kind: 'gather-intel', agentOfficerId: 'spy', targetForceId: 'enemy', targetCityId: 'ec', issuedYear: 200, issuedSeason: 'spring' }],
      cities: {
        ec: ({ id: 'ec', name: { zh: '敵城', en: 'EC' }, ownerForceId: 'enemy', troops: 5000, gold: 1000, food: 2000, defense: 50, adjacentCityIds: ['mc'] } as unknown as import('../types').City),
        mc: ({ id: 'mc', name: { zh: '我城', en: 'MC' }, ownerForceId: 'me', troops: 1000, defense: 20, adjacentCityIds: ['ec'] } as unknown as import('../types').City),
      },
      officers: { spy: mk('spy', { forceId: 'me', stats: { war: 50, leadership: 50, intelligence: 90, politics: 50, charisma: 50 } as Officer['stats'] }) },
      playerForceId: 'me', rng: () => 0.0,
      diplomacy: { relations: { enemy__ally: { forceA: 'ally', forceB: 'enemy', score: 60, status: 'allied' } } },
      forces: { ally: ({ id: 'ally', name: { zh: '盟', en: 'Ally' } } as import('../types').Force) },
    });
    expect(out.results[0].success).toBe(true);
    // Treaty (ally) + intent (eyeing our city) surfaced in the report text.
    expect(out.entries[0].textZh).toContain('盟約');
    expect(out.entries[0].textZh).toContain('兵鋒似指');
  });

  it('③ an attempt on a lord’s life breeds far deeper resentment when it fails', () => {
    const run = (ruler: boolean) => resolveEspionage({
      ops: [{ id: 'op', kind: 'assassinate', agentOfficerId: 'spy', targetForceId: 'enemy', targetOfficerId: 't', issuedYear: 200, issuedSeason: 'spring' }],
      cities: {},
      officers: { spy: mk('spy', { forceId: 'me' }), t: mk('t', { forceId: 'enemy' }) },
      playerForceId: 'me', rng: () => 0.99, // certain failure
      forces: { enemy: ({ id: 'enemy', name: { zh: 'e', en: 'e' }, rulerOfficerId: ruler ? 't' : 'someone-else' } as import('../types').Force) },
    });
    expect(run(false).grudgeDelta['enemy']).toBe(14);
    expect(run(true).grudgeDelta['enemy']).toBe(26);
  });

  it('② 校事 — a sharper realm spymaster lifts op odds', () => {
    const base = (extraOfficer: Officer | null) => resolveEspionage({
      ops: [{ id: 'op', kind: 'instigate', agentOfficerId: 'spy', targetForceId: 'enemy', targetCityId: 'ec', issuedYear: 200, issuedSeason: 'spring' }],
      cities: { ec: ({ id: 'ec', name: { zh: 'e', en: 'e' }, ownerForceId: 'enemy', loyalty: 60, troops: 1000 } as unknown as import('../types').City) },
      officers: {
        spy: mk('spy', { forceId: 'me', stats: { war: 50, leadership: 50, intelligence: 60, politics: 50, charisma: 50 } as Officer['stats'] }),
        ...(extraOfficer ? { sage: extraOfficer } : {}),
      },
      // A roll that lands between the two odds: with a 95-INT spymaster present it succeeds, without it fails.
      playerForceId: 'me', rng: () => 0.32,
    });
    const withSage = base(mk('sage', { forceId: 'me', stats: { war: 50, leadership: 50, intelligence: 95, politics: 50, charisma: 50 } as Officer['stats'] }));
    const without = base(null);
    expect(withSage.results[0].success).toBe(true);
    expect(without.results[0].success).toBe(false);
  });
});

describe('心腹 — a confidant can never be turned', () => {
  const out = resolveEspionage({
    ops: [{
      id: 'op', kind: 'defect', agentOfficerId: 'spy', targetForceId: 'enemy',
      targetOfficerId: 'loyalist', issuedYear: 200, issuedSeason: 'spring',
    }],
    cities: {},
    officers: {
      spy: officer('spy', { forceId: 'me', stats: { war: 50, leadership: 50, intelligence: 99, politics: 50, charisma: 50 } as Officer['stats'] }),
      loyalist: officer('loyalist', { forceId: 'enemy', loyalty: 10 }), // low loyalty, but a confidant
    },
    playerForceId: 'me',
    rng: () => 0.0, // would succeed if allowed
    lordRapport: { loyalist: 90 }, // ≥80 → 心腹
  });

  it('refuses the bribe regardless of low loyalty', () => {
    expect(out.results[0].success).toBe(false);
    expect(out.officers['loyalist'].forceId).toBe('enemy');
  });
});

describe('離間計 — sow discord between two enemy officers', () => {
  const run = (rapportSeed: Record<string, number>, bonds: import('../data/bonds').OathBond[], rng: () => number) =>
    resolveEspionage({
      ops: [{
        id: 'op', kind: 'sow-discord', agentOfficerId: 'spy', targetForceId: 'enemy',
        targetOfficerId: 'x', targetOfficerId2: 'y', issuedYear: 200, issuedSeason: 'spring',
      }],
      cities: {},
      officers: {
        spy: officer('spy', { forceId: 'me', stats: { war: 50, leadership: 50, intelligence: 99, politics: 50, charisma: 50 } as Officer['stats'] }),
        x: officer('x', { forceId: 'enemy' }),
        y: officer('y', { forceId: 'enemy' }),
      },
      playerForceId: 'me',
      rng,
      rapport: rapportSeed,
      runtimeBonds: bonds,
    });

  it('poisons rapport between the pair on success', () => {
    const out = run({ x__y: 30 }, [], () => 0.0);
    expect(out.results[0].success).toBe(true);
    expect(out.rapport).toBeDefined();
    expect(out.rapport!['x__y']).toBeLessThan(30);
  });

  it('shatters a shallow (depth-1) 義結', () => {
    const bond = { officerA: 'x', officerB: 'y', floor: 90, kind: 'sibling' as const, label: 'x-y', depth: 1 as const, sharedSeasons: 0 };
    const out = run({ x__y: 100 }, [bond], () => 0.0);
    expect(out.results[0].success).toBe(true);
    expect((out.runtimeBonds ?? []).some((b) => b.kind === 'sibling')).toBe(false);
  });

  it('a deep (depth-2) bond resists estrangement', () => {
    const bond = { officerA: 'x', officerB: 'y', floor: 92, kind: 'sibling' as const, label: 'x-y', depth: 2 as const, sharedSeasons: 20 };
    // chance is multiplied by 0.3 then clamped to ≥0.02; a high roll fails.
    const out = run({ x__y: 100 }, [bond], () => 0.9);
    expect(out.results[0].success).toBe(false);
    expect((out.runtimeBonds ?? [bond]).some((b) => b.kind === 'sibling')).toBe(true);
  });
});
