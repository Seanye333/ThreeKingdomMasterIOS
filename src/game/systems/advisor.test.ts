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

  it('the appointed 軍師 speaks first, even over a sharper aide', () => {
    const officers: Record<string, Officer> = {
      a: mkOfficer({ id: 'a', forceId: 'wei', stats: { intelligence: 80 } }),
      b: mkOfficer({ id: 'b', forceId: 'wei', stats: { intelligence: 99 } }),
    };
    const appts = [{ officerId: 'a', forceId: 'wei', titleId: 'strategist' }];
    expect(pickAdvisor(officers, 'wei', appts)?.id).toBe('a');
    // …but a sharper aide reclaims the ear once the 軍師 is gone.
    officers.a.status = 'dead';
    expect(pickAdvisor(officers, 'wei', appts)?.id).toBe('b');
  });
});

describe('軍師做活 — 智 drives slots, foresight, and deeper counsel', () => {
  const sage = (intelligence: number) => mkOfficer({ id: 'sg', forceId: 'wei', stats: { intelligence } });

  it('a sharper mind hands over more than three reads', () => {
    // Five distinct problems in one city: threat, unrest, hunger, talent, idle.
    const officers: Record<string, Officer> = {
      g: mkOfficer({ id: 'g', forceId: 'wei', locationCityId: 'ye' }),
      h: mkOfficer({ id: 'h', forceId: 'wei', locationCityId: 'ye' }),
      k: mkOfficer({ id: 'k', forceId: 'wei', locationCityId: 'ye' }),
      hid: mkOfficer({ id: 'hid', forceId: 'wei', locationCityId: 'ye', status: 'unsearched' }),
    };
    const armies: Record<string, Army> = {
      x: { id: 'x', forceId: 'wu', targetCityId: 'ye', troops: 20000, x: 0, y: 0 } as Army,
    };
    const over = {
      armies, officers,
      cities: { ye: mkCity({ id: 'ye', loyalty: 30, food: 100, agriculture: 20, gold: 5000 }) },
    };
    const dull = adviseTips(base({ ...over, advisor: sage(60) }));
    const bright = adviseTips(base({ ...over, advisor: sage(99) }));
    expect(dull.length).toBe(3);
    expect(bright.length).toBeGreaterThan(3);
  });

  it('a sharp advisor warns of an approaching column before it outnumbers the walls', () => {
    const armies: Record<string, Army> = {
      x: { id: 'x', forceId: 'wu', targetCityId: 'ye', troops: 9000, x: 0, y: 0 } as Army,
    };
    const over = { armies, cities: { ye: mkCity({ id: 'ye', troops: 10000 }) } }; // inbound < garrison
    expect(adviseTips(base({ ...over, advisor: sage(60) })).some((t) => t.id === 'threat-ye')).toBe(false);
    expect(adviseTips(base({ ...over, advisor: sage(99) })).some((t) => t.id === 'threat-ye')).toBe(true);
  });
});

describe('忠誠告警 — a slipping officer can be feasted back', () => {
  it('flags the wavering officer and offers a banquet; the lord is never flagged', () => {
    const officers: Record<string, Officer> = {
      lord: mkOfficer({ id: 'lord', forceId: 'wei', locationCityId: 'ye', loyalty: 20 }),
      wob: mkOfficer({ id: 'wob', forceId: 'wei', locationCityId: 'ye', loyalty: 25 }),
    };
    const tips = adviseTips(base({ officers, rulerOfficerId: 'lord' }));
    const warn = tips.find((t) => t.id === 'loyalty-wob');
    expect(warn).toBeTruthy();
    expect(warn!.action).toMatchObject({ kind: 'banquet', cityId: 'ye' });
    expect(tips.some((t) => t.id === 'loyalty-lord')).toBe(false);
  });
});

describe('謀略獻策 — a capable strategist proposes a scheme', () => {
  it('points two bordering rivals at each other when the capital can fund it', () => {
    const cities = {
      ye: mkCity({ id: 'ye', ownerForceId: 'wei', gold: 5000, adjacentCityIds: ['xu', 'jian'] }),
      xu: mkCity({ id: 'xu', ownerForceId: 'wu', troops: 9000, adjacentCityIds: ['jian'] }),
      jian: mkCity({ id: 'jian', ownerForceId: 'shu', troops: 9000, adjacentCityIds: ['xu'] }),
    };
    const forces = {
      wu: { id: 'wu', name: { zh: '吳', en: 'Wu' } },
      shu: { id: 'shu', name: { zh: '蜀', en: 'Shu' } },
    } as never;
    const tips = adviseTips(base({
      cities, forces, advisor: mkOfficer({ id: 's', forceId: 'wei', stats: { intelligence: 90 } }),
      playerCapitalId: 'ye',
    }));
    const scheme = tips.find((t) => t.id.startsWith('scheme-2t'));
    expect(scheme).toBeTruthy();
    expect(scheme!.action).toMatchObject({ kind: 'scheme', schemeId: 'two-tigers' });
  });

  it('a dull mind keeps its own counsel — no scheme tip', () => {
    const cities = {
      ye: mkCity({ id: 'ye', ownerForceId: 'wei', gold: 5000, adjacentCityIds: ['xu', 'jian'] }),
      xu: mkCity({ id: 'xu', ownerForceId: 'wu', troops: 9000, adjacentCityIds: ['jian'] }),
      jian: mkCity({ id: 'jian', ownerForceId: 'shu', troops: 9000, adjacentCityIds: ['xu'] }),
    };
    const forces = { wu: { id: 'wu', name: { zh: '吳', en: 'Wu' } }, shu: { id: 'shu', name: { zh: '蜀', en: 'Shu' } } } as never;
    const tips = adviseTips(base({
      cities, forces, advisor: mkOfficer({ id: 's', forceId: 'wei', stats: { intelligence: 55 } }),
      playerCapitalId: 'ye',
    }));
    expect(tips.some((t) => t.id.startsWith('scheme-'))).toBe(false);
  });
});

describe('名士奇策 — the great strategists counsel in their own hand', () => {
  it('Zhuge Liang offers his signature husbandry tip when he holds your ear', () => {
    const officers: Record<string, Officer> = {
      zg: mkOfficer({ id: 'zhuge-liang', forceId: 'wei', locationCityId: 'ye', stats: { intelligence: 100 } }),
      w: mkOfficer({ id: 'w', forceId: 'wei', locationCityId: 'ye' }),
    };
    const tips = adviseTips(base({
      officers,
      cities: { ye: mkCity({ id: 'ye', agriculture: 20, gold: 5000 }) },
      advisor: officers.zg,
    }));
    expect(tips.some((t) => t.id === 'sage-zhuge-liang')).toBe(true);
  });
});
