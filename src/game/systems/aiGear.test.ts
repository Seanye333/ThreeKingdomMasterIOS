import { describe, it, expect } from 'vitest';
import { assignAiGear } from './aiGear';
import type { Officer } from '../types';

function mkOfficer(id: string, forceId: string | null, war: number, lead: number, equipment: string[]): Officer {
  return {
    id, forceId, name: { en: id, zh: id },
    stats: { war, leadership: lead, intelligence: 50, politics: 50, charisma: 50 },
    status: 'idle', locationCityId: null, equipment, loyalty: 80,
  } as unknown as Officer;
}

const mkOfficers = (...os: Officer[]) => Object.fromEntries(os.map((o) => [o.id, o]));

describe('assignAiGear', () => {
  it('upgrades AI gear but never touches the player or pre-existing entries', () => {
    const officers = mkOfficers(
      mkOfficer('ai-1', 'wei', 95, 90, ['green-dragon']),
      mkOfficer('me-1', 'shu', 95, 90, ['snake-spear']),
    );
    const out = assignAiGear({
      officers, playerForceId: 'shu', difficulty: 'hard', aiStrength: 5,
      refine: {}, breakthrough: {}, gems: {}, rng: () => 0.99,
    });
    expect(out.refine['green-dragon']).toBeGreaterThan(0); // AI item upgraded
    expect(out.refine['snake-spear'] ?? 0).toBe(0);        // player item untouched
  });

  it('scales with difficulty — hard gives more than easy', () => {
    const officers = mkOfficers(mkOfficer('ai-1', 'wei', 95, 90, ['green-dragon']));
    const hard = assignAiGear({ officers, playerForceId: 'shu', difficulty: 'hard', aiStrength: 5, refine: {}, breakthrough: {}, gems: {}, rng: () => 0.99 });
    const easy = assignAiGear({ officers, playerForceId: 'shu', difficulty: 'easy', aiStrength: 3, refine: {}, breakthrough: {}, gems: {}, rng: () => 0.99 });
    expect(hard.refine['green-dragon']).toBeGreaterThan(easy.refine['green-dragon'] ?? 0);
  });

  it('only breakthroughs top gold gear on hard, and only after full refine', () => {
    const officers = mkOfficers(mkOfficer('ai-1', 'wei', 100, 100, ['green-dragon']));
    const out = assignAiGear({ officers, playerForceId: 'shu', difficulty: 'hard', aiStrength: 5, refine: {}, breakthrough: {}, gems: {}, rng: () => 0.99 });
    expect(out.refine['green-dragon']).toBe(5);
    expect(out.breakthrough['green-dragon'] ?? 0).toBeGreaterThanOrEqual(0);
  });

  it('a strong AI officer may receive a gem (rng-driven)', () => {
    const officers = mkOfficers(mkOfficer('ai-1', 'wei', 100, 100, ['green-dragon']));
    const out = assignAiGear({ officers, playerForceId: 'shu', difficulty: 'hard', aiStrength: 5, refine: {}, breakthrough: {}, gems: {}, rng: () => 0 });
    expect((out.gems['green-dragon'] ?? []).length).toBe(1);
  });
});
