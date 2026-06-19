/** 軍師錦囊 — locks the advisor's priorities and one-tap payloads. */
import { describe, expect, it } from 'vitest';
import type { Army, City, EntityId, Officer } from '../types';
import { mkOfficer } from '../../test/factories';
import { adviseTips, pickAdvisor, type AdvisorInput } from './advisor';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wei', troops: 8000, gold: 2000, food: 40000,
    loyalty: 75, agriculture: 50, commerce: 50, defense: 60,
    adjacentCityIds: [], name: { zh: over.id, en: over.id },
    ...over,
  } as unknown as City);

function base(over: Partial<AdvisorInput> = {}): AdvisorInput {
  return {
    cities: { ye: mkCity({ id: 'ye' }) },
    officers: { a: mkOfficer({ id: 'a', forceId: 'wei', locationCityId: 'ye' }) },
    armies: {},
    busyOfficerIds: new Set<EntityId>(),
    playerForceId: 'wei',
    season: 'summer',
    ...over,
  };
}

describe('adviseTips', () => {
  it('a city about to fall outranks everything; the tip recruits', () => {
    const armies: Record<string, Army> = {
      x: { id: 'x', forceId: 'wu', targetCityId: 'ye', troops: 20000, x: 0, y: 0 } as Army,
    };
    const input = base({
      armies,
      cities: { ye: mkCity({ id: 'ye', loyalty: 40, food: 100 }) }, // unrest + hunger also fire
    });
    const tips = adviseTips(input);
    expect(tips[0].id).toBe('threat-ye');
    expect(tips[0].action).toMatchObject({ kind: 'command', type: 'recruit-troops', officerId: 'a' });
  });

  it('hunger buys grain; an officerless city still warns but cannot act', () => {
    const tips = adviseTips(base({
      cities: { ye: mkCity({ id: 'ye', food: 1000, loyalty: 30 }) },
      officers: {}, // nobody home
    }));
    const unrest = tips.find((t) => t.id === 'unrest-ye')!;
    expect(unrest.action.kind).toBe('none');
    const hunger = tips.find((t) => t.id === 'hunger-ye')!;
    expect(hunger.action).toMatchObject({ kind: 'trade', trade: 'buy' });
  });

  it('spots the thin neighbour and caps at three tips', () => {
    const input = base({
      cities: {
        ye: mkCity({ id: 'ye', troops: 16000, adjacentCityIds: ['puyang'], loyalty: 30, food: 100 }),
        puyang: mkCity({ id: 'puyang', ownerForceId: 'wu', troops: 2000 }),
      },
    });
    const tips = adviseTips(input);
    expect(tips.length).toBeLessThanOrEqual(3);
    expect(tips.some((t) => t.id === 'weak-puyang')).toBe(true);
  });
});

describe('pickAdvisor', () => {
  it('the sharpest serving mind speaks', () => {
    const officers: Record<string, Officer> = {
      a: mkOfficer({ id: 'a', forceId: 'wei', stats: { intelligence: 70 } }),
      b: mkOfficer({ id: 'b', forceId: 'wei', stats: { intelligence: 98 } }),
      c: mkOfficer({ id: 'c', forceId: 'wu', stats: { intelligence: 100 } }),
    };
    expect(pickAdvisor(officers, 'wei')?.id).toBe('b');
  });
});
