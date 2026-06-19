/** 訪賢招攬 — locks free invite, bribe bonus and the debate edge. */
import { describe, expect, it } from 'vitest';
import type { City, Force } from '../types';
import { mkOfficer } from '../../test/factories';
import { attemptFreeAgentRecruit } from './officerFate';

const ruler = mkOfficer({ id: 'liu-bei', stats: { charisma: 80 } });
const force = { id: 'shu', name: { zh: '蜀', en: 'Shu' }, rulerOfficerId: 'liu-bei', capitalCityId: 'c' } as Force;
const agent = () => mkOfficer({ id: 'x', status: 'idle', forceId: null, stats: { charisma: 50 } });

const run = (over: Partial<Parameters<typeof attemptFreeAgentRecruit>[0]>, roll: number) =>
  attemptFreeAgentRecruit({
    officer: agent(), recruiterForce: force, recruiterRuler: ruler,
    rng: () => roll, ...over,
  } as Parameters<typeof attemptFreeAgentRecruit>[0]);

describe('attemptFreeAgentRecruit', () => {
  it('a free invite ignores an empty treasury', () => {
    // city.gold 0 but free:true → no cost gate, the roll decides.
    const r = run({ city: { id: 'c', gold: 0 } as City, free: true }, 0.01);
    expect(r.ok).toBe(true);
  });

  it('without free, an empty treasury blocks the offer (AI path)', () => {
    const r = run({ city: { id: 'c', gold: 0 } as City }, 0.01);
    expect(r.ok).toBe(false);
  });

  it('a won debate and a bribe each lift the odds', () => {
    const city = { id: 'c', gold: 9999 } as City;
    const midRuler = mkOfficer({ id: 'r2', stats: { charisma: 50 } }); // base ~0.70
    // A roll that fails plain but clears after the +0.28 debate edge.
    const plain = run({ city, free: true, recruiterRuler: midRuler }, 0.90);
    const debated = run({ city, free: true, recruiterRuler: midRuler, debateWon: true }, 0.90);
    expect(plain.ok).toBe(false);
    expect(debated.ok).toBe(true);
    const bribed = run({ city, free: true, recruiterRuler: midRuler, bribeBonus: 0.35 }, 0.90);
    expect(bribed.ok).toBe(true);
  });
});
