import { describe, it, expect } from 'vitest';
import { planAIFrontierExploits } from './aiBuild';
import { buildInitialCities } from '../data/cities';
import { SCENIC_SITES } from '../data/scenicSites';
import { TRIBES, TRIBES_BY_ID } from '../data/tribes';
import { buildInitialPorts } from '../data/ports';

/** All tribes pacified → the AI tribe-campaign branch never fires. */
const CALM = Object.fromEntries(TRIBES.map((t) => [t.id, 0]));

function cityMap() {
  return Object.fromEntries(buildInitialCities({}).map((c) => [c.id, { ...c }]));
}
const forces = {
  ai: { id: 'ai', name: { zh: '敵', en: 'Foe' }, color: '#fff', rulerOfficerId: 'ai-ruler', capitalCityId: 'xiangyang' },
  me: { id: 'me', name: { zh: '我', en: 'Me' }, color: '#0f0', rulerOfficerId: 'me-ruler', capitalCityId: 'chengdu' },
} as never;

const mkOff = (id: string, forceId: string | null, loc: string, stats: Partial<Record<string, number>> = {}) => ({
  id, name: { zh: id, en: id }, skills: [], traits: [], equipment: [],
  stats: { war: 80, leadership: 75, intelligence: 70, politics: 50, charisma: 85, ...stats },
  forceId, locationCityId: loc, status: 'idle', task: null, loyalty: 70,
}) as never;

describe('planAIFrontierExploits', () => {
  it('AI courts a free recluse at a reachable 名所', () => {
    const longzhong = SCENIC_SITES.find((s) => s.id === 'longzhong')!;
    const hermitId = longzhong.hermitId!;
    const cm = cityMap();
    const guard = longzhong.guards[0];
    cm[guard] = { ...cm[guard], ownerForceId: 'ai' };
    const officers = {
      'ai-ruler': mkOff('ai-ruler', 'ai', guard, { charisma: 95 }),
      envoy: mkOff('envoy', 'ai', guard, { charisma: 95 }),
      [hermitId]: mkOff(hermitId, null, guard, { intelligence: 40 }), // easy to win
    };
    const out = planAIFrontierExploits({
      cities: cm, officers, forces, ports: {}, aggression: {}, scenicLooted: {},
      playerForceId: 'me', rng: () => 0.0, // chance gate passes + recruit succeeds
    });
    expect(out.officers[hermitId].forceId).toBe('ai');
    expect(out.scenicLooted[longzhong.id]).toBe('ai');
  });

  it('AI campaigns a restless border tribe, beating its aggression down', () => {
    const tribe = TRIBES_BY_ID['nanban'];
    const cm = cityMap();
    const border = tribe.raidableCityIds[0];
    cm[border] = { ...cm[border], ownerForceId: 'ai', troops: 20000 };
    const officers = {
      'ai-ruler': mkOff('ai-ruler', 'ai', border),
      gen: mkOff('gen', 'ai', border, { war: 95, leadership: 95 }),
    };
    const out = planAIFrontierExploits({
      cities: cm, officers, forces, ports: {},
      aggression: { nanban: tribe.baseAggression },
      scenicLooted: {}, playerForceId: 'me', rng: () => 0.0,
    });
    expect(out.aggression.nanban).toBeLessThan(tribe.baseAggression);
  });

  it('AI upgrades an owned port when its capital can pay', () => {
    const cm = cityMap();
    cm['xiangyang'] = { ...cm['xiangyang'], ownerForceId: 'ai', gold: 5000 };
    const ports = buildInitialPorts({ jianye: 'ai' });
    // Force one port owned by ai.
    const portId = Object.keys(ports)[0];
    ports[portId] = { ...ports[portId], ownerForceId: 'ai', navalTier: 1 };
    const officers = { 'ai-ruler': mkOff('ai-ruler', 'ai', 'xiangyang') };
    const out = planAIFrontierExploits({
      cities: cm, officers, forces, ports,
      aggression: CALM, scenicLooted: {}, playerForceId: 'me', rng: () => 0.0,
    });
    expect(out.ports[portId].navalTier).toBe(2);
    expect(out.cities['xiangyang'].gold).toBeLessThan(5000);
  });

  it('the player force is never driven by this planner', () => {
    const longzhong = SCENIC_SITES.find((s) => s.id === 'longzhong')!;
    const hermitId = longzhong.hermitId!;
    const cm = cityMap();
    cm[longzhong.guards[0]] = { ...cm[longzhong.guards[0]], ownerForceId: 'me' };
    const officers = {
      'me-ruler': mkOff('me-ruler', 'me', longzhong.guards[0], { charisma: 95 }),
      [hermitId]: mkOff(hermitId, null, longzhong.guards[0]),
    };
    const out = planAIFrontierExploits({
      cities: cm, officers, forces, ports: {}, aggression: {}, scenicLooted: {},
      playerForceId: 'me', rng: () => 0.0,
    });
    expect(out.officers[hermitId].forceId).toBeNull(); // player must do it themselves
  });
});
