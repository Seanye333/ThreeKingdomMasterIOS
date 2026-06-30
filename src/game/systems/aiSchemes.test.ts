/** AI 大局計略 — rival courts plot against each other and the player. */
import { describe, expect, it } from 'vitest';
import type { City, Force } from '../types';
import { mkOfficer } from '../../test/factories';
import { resolveAISchemes } from './aiSchemes';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wei', troops: 8000, gold: 5000, food: 40000,
    loyalty: 70, agriculture: 50, commerce: 50, defense: 60,
    adjacentCityIds: [], name: { zh: over.id, en: over.id },
    ...over,
  } as unknown as City);

const mkForce = (over: Partial<Force> & { id: string }): Force =>
  ({
    name: { zh: over.id, en: over.id }, rulerOfficerId: `${over.id}-lord`,
    capitalCityId: `${over.id}-cap`, color: '#888', isPlayer: false,
    personality: 'opportunist',
    ...over,
  } as Force);

// Four forces in a row: wei — shu — wu — qun, each bordering its neighbours.
function fixture() {
  const cities: Record<string, City> = {
    'wei-cap': mkCity({ id: 'wei-cap', ownerForceId: 'wei', adjacentCityIds: ['shu-cap'] }),
    'shu-cap': mkCity({ id: 'shu-cap', ownerForceId: 'shu', adjacentCityIds: ['wei-cap', 'wu-cap'], troops: 12000 }),
    'wu-cap': mkCity({ id: 'wu-cap', ownerForceId: 'wu', adjacentCityIds: ['shu-cap', 'qun-cap'] }),
    'qun-cap': mkCity({ id: 'qun-cap', ownerForceId: 'qun', adjacentCityIds: ['wu-cap'] }),
  };
  const forces: Record<string, Force> = {
    wei: mkForce({ id: 'wei', personality: 'opportunist' }),
    shu: mkForce({ id: 'shu' }),
    wu: mkForce({ id: 'wu' }),
    qun: mkForce({ id: 'qun' }),
  };
  const officers = {
    'wei-lord': mkOfficer({ id: 'wei-lord', forceId: 'wei', locationCityId: 'wei-cap', stats: { intelligence: 95, war: 60, leadership: 70, politics: 80, charisma: 80 } }),
    'shu-lord': mkOfficer({ id: 'shu-lord', forceId: 'shu', locationCityId: 'shu-cap' }),
    'wu-lord': mkOfficer({ id: 'wu-lord', forceId: 'wu', locationCityId: 'wu-cap' }),
    'qun-lord': mkOfficer({ id: 'qun-lord', forceId: 'qun', locationCityId: 'qun-cap' }),
  };
  return { cities, forces, officers };
}

describe('resolveAISchemes', () => {
  it('never schemes on behalf of (or charges gold to) the player force', () => {
    for (let i = 0; i < 50; i++) {
      const { cities, forces, officers } = fixture();
      const before = cities['wei-cap'].gold;
      const out = resolveAISchemes({
        forces, officers, cities, diplomacy: { relations: {} },
        playerForceId: 'wei', date: { year: 200, season: 'spring' }, rng: Math.random,
      });
      // Player capital gold is never spent by the AI scheme system.
      expect(out.cities['wei-cap'].gold).toBe(before);
      // No entry credits the player as the schemer.
      for (const e of out.entries) expect(e.textZh.startsWith(forces.wei.name.zh)).toBe(false);
    }
  });

  it('an AI court eventually plots — souring a relation and/or laying a casus belli', () => {
    let plotted = false;
    for (let i = 0; i < 300 && !plotted; i++) {
      const { cities, forces, officers } = fixture();
      const out = resolveAISchemes({
        forces, officers, cities, diplomacy: { relations: {} },
        playerForceId: 'qun', // a non-scheming bystander so wei/shu/wu all plot
        date: { year: 200, season: 'summer' }, rng: Math.random,
      });
      if (out.entries.length > 0) {
        plotted = true;
        const movedRel = Object.keys(out.diplomacy.relations).length > 0;
        // A plot's bite is a soured relation, a casus belli, OR — for 流言亂政
        // (sow-chaos, §7.2) — a city's loyalty dropped below its starting 70.
        const loyaltyDropped = Object.values(out.cities).some((c) => c.loyalty < 70);
        expect(movedRel || out.marks.length > 0 || loyaltyDropped).toBe(true);
      }
    }
    expect(plotted).toBe(true);
  });
});
