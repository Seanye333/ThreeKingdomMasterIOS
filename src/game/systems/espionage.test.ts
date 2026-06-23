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
