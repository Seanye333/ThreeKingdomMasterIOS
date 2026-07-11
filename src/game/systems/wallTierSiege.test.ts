import { describe, it, expect } from 'vitest';
import { setupTacticalBattle } from './tacticalSetup';
import { buildInitialCities } from '../data/cities';
import type { Officer } from '../types';

const byId = Object.fromEntries(buildInitialCities({}).map((c) => [c.id, c]));

function officer(id: string, war = 70): Officer {
  return {
    id, name: { zh: id, en: id }, birthYear: 160,
    stats: { leadership: 70, war, intelligence: 60, politics: 50, charisma: 50 },
    loyalty: 90, locationCityId: null, forceId: 'f1', status: 'active',
    skills: [], traits: [], equipment: [],
  } as unknown as Officer;
}

function siege(wallTier: 1 | 2 | 3) {
  return setupTacticalBattle({
    cityId: 'chenliu',
    width: 18, height: 12,
    attackerForceId: 'f1', defenderForceId: 'f2',
    attackers: [{ officer: officer('a1'), troops: 8000 }],
    defenders: [{ officer: { ...officer('d1'), forceId: 'f2' }, troops: 6000 }],
    wallTier,
    terrainHint: { terrain: byId['chenliu'].terrain, x: byId['chenliu'].coords.x, y: byId['chenliu'].coords.y },
  });
}

describe('城壁強化入戰場 — wallTier shapes the siege enclosure', () => {
  it('tier 1 raises a single rampart (one gate line on the west face)', () => {
    const b = siege(1);
    const westCol = 18 - 4;
    const innerCol = westCol + 2;
    const innerWalls = b.tiles.filter((t) => t.coord.col === innerCol && t.terrain === 'wall');
    expect(innerWalls.length).toBe(0);
  });

  it('tier 2 raises an inner wall ring with its own (weaker) gate', () => {
    const b = siege(2);
    const westCol = 18 - 4;
    const innerCol = westCol + 2;
    const gateRow = 6;
    const innerWalls = b.tiles.filter((t) => t.coord.col === innerCol && t.terrain === 'wall');
    expect(innerWalls.length).toBeGreaterThan(2);
    const innerGate = b.tiles.find((t) => t.coord.col === innerCol && t.coord.row === gateRow);
    expect(innerGate?.terrain).toBe('gate');
    expect(b.wallHp?.[`${innerCol},${gateRow}`]).toBe(600);
  });

  it('tier 3 digs a moat along the west face with a causeway bridge at the gate', () => {
    const b = siege(3);
    const westCol = 18 - 4;
    const moatCol = westCol - 1;
    const gateRow = 6;
    const moat = b.tiles.filter((t) => t.coord.col === moatCol && t.terrain === 'river');
    expect(moat.length).toBeGreaterThan(3);
    const causeway = b.tiles.find((t) => t.coord.col === moatCol && t.coord.row === gateRow);
    expect(causeway?.terrain).toBe('bridge');
  });
});
