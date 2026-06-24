import { describe, it, expect } from 'vitest';
import { planAiForging } from './aiForge';
import { ITEMS_BY_ID } from '../data/items';
import { ITEM_SETS } from '../data/itemSets';
import type { Officer, City, Building } from '../types';

function off(id: string, forceId: string | null, war: number, lead: number, cityId: string, equipment: string[] = []): Officer {
  return { id, forceId, name: { en: id, zh: id }, stats: { war, leadership: lead, intelligence: 50, politics: 50, charisma: 50 }, status: 'idle', locationCityId: cityId, equipment } as unknown as Officer;
}
function city(id: string, owner: string | null, gold: number, iron: number): City {
  return { id, name: { en: id, zh: id }, ownerForceId: owner, gold, iron } as unknown as City;
}
const foundry = (cityId: string, level = 3): Building => ({ id: 'foundry', cityId, level } as unknown as Building);
const rec = (...o: Officer[]) => Object.fromEntries(o.map((x) => [x.id, x]));
const rcc = (...c: City[]) => Object.fromEntries(c.map((x) => [x.id, x]));
const always = () => 0; // rng < 0.5 → always forge

describe('planAiForging', () => {
  it('arms a strong AI officer in a resource-rich foundry city with a fresh 神兵', () => {
    const actions = planAiForging({
      officers: rec(off('ai-1', 'wei', 95, 80, 'ye')),
      cities: rcc(city('ye', 'wei', 5000, 1000)),
      buildings: [foundry('ye')], lostItems: [], playerForceId: 'shu', rng: always,
    });
    expect(actions.length).toBe(1);
    const it = ITEMS_BY_ID[actions[0].itemId];
    expect(it.forgeOnly).toBe(true);
    expect(actions[0].forceId).toBe('wei');
  });

  it('never forges for the player force', () => {
    const actions = planAiForging({
      officers: rec(off('me-1', 'shu', 95, 80, 'cd')),
      cities: rcc(city('cd', 'shu', 5000, 1000)),
      buildings: [foundry('cd')], lostItems: [], playerForceId: 'shu', rng: always,
    });
    expect(actions.length).toBe(0);
  });

  it('respects item uniqueness — will not forge a result already in play', () => {
    // Pre-place every iron-cost forge result so nothing is available.
    const allForgeOnly = Object.values(ITEMS_BY_ID).filter((i) => i.forgeOnly).map((i) => i.id);
    const actions = planAiForging({
      officers: rec(off('ai-1', 'wei', 95, 80, 'ye')),
      cities: rcc(city('ye', 'wei', 5000, 1000)),
      buildings: [foundry('ye')],
      lostItems: allForgeOnly.map((itemId) => ({ itemId, cityId: 'ye' })),
      playerForceId: 'shu', rng: always,
    });
    expect(actions.length).toBe(0);
  });

  it('skips when the foundry city cannot afford the forge', () => {
    const actions = planAiForging({
      officers: rec(off('ai-1', 'wei', 95, 80, 'ye')),
      cities: rcc(city('ye', 'wei', 100, 0)), // no gold, no iron
      buildings: [foundry('ye')], lostItems: [], playerForceId: 'shu', rng: always,
    });
    expect(actions.length).toBe(0);
  });

  it('completes a forge set — an officer holding 1 member gets the next forged for them', () => {
    // Find an iron-only collection set (every member is an empty-ingredient iron recipe).
    const ironResults = new Set(
      // re-derive via items: forgeOnly armor/weapon that are iron recipes is hard here,
      // so just pick the 四象神甲 set whose members are all forge-only armor.
      ITEM_SETS.find((s) => s.id === 'four-symbols-armor')!.members,
    );
    const set = ITEM_SETS.find((s) => s.id === 'four-symbols-armor')!;
    const [first, ...rest] = set.members;
    const actions = planAiForging({
      officers: rec(off('ai-1', 'wei', 80, 95, 'ye', [first])), // already holds 1 member
      cities: rcc(city('ye', 'wei', 9000, 3000)),
      buildings: [foundry('ye')], lostItems: [], playerForceId: 'shu', rng: always,
    });
    expect(actions.length).toBe(1);
    // The forged item should be another (missing) member of the same set.
    expect(rest).toContain(actions[0].itemId);
    void ironResults;
  });

  it('gives a marshal armor and a fighter a weapon', () => {
    const marshal = planAiForging({
      officers: rec(off('m', 'wei', 60, 95, 'ye')),
      cities: rcc(city('ye', 'wei', 5000, 1000)), buildings: [foundry('ye')], lostItems: [], playerForceId: 'shu', rng: always,
    });
    expect(ITEMS_BY_ID[marshal[0].itemId].kind).toBe('armor');
    const fighter = planAiForging({
      officers: rec(off('f', 'wei', 98, 60, 'ye')),
      cities: rcc(city('ye', 'wei', 5000, 1000)), buildings: [foundry('ye')], lostItems: [], playerForceId: 'shu', rng: always,
    });
    expect(ITEMS_BY_ID[fighter[0].itemId].kind).toBe('weapon');
  });
});
