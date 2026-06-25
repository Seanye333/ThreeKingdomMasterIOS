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
