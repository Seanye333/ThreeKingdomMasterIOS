import { describe, it, expect } from 'vitest';
import { stepConvoys, resolveConvoyRaids, resolveRaidStrike, provisionNeeded, consumeRations, convoyCapacity, convoySpeedMul, type Convoy } from './convoy';
import { mkOfficer } from '../../test/factories';
import type { City } from '../types';

const mkCity = (id: string, over: Partial<City> = {}): City => ({
  id, name: { zh: id, en: id }, coords: { x: 0, y: 0 }, adjacentCityIds: [],
  ownerForceId: 'me', population: 100_000, gold: 1000, food: 5000, troops: 2000,
  agriculture: 50, commerce: 50, defense: 50, loyalty: 60, ...over,
});

const mkConvoy = (over: Partial<Convoy> = {}): Convoy => ({
  id: 'cv1', forceId: 'me', fromCityId: 'a', toCityId: 'b',
  food: 1000, gold: 200, troops: 0, seasonsRemaining: 1, totalSeasons: 1, ...over,
});

describe('輜重 — convoy stepping', () => {
  it('an in-transit convoy advances one season and keeps its cargo', () => {
    const convoys = { cv1: mkConvoy({ seasonsRemaining: 3, totalSeasons: 3 }) };
    const cities = { a: mkCity('a'), b: mkCity('b') };
    const r = stepConvoys(convoys, cities);
    expect(r.convoys.cv1.seasonsRemaining).toBe(2);
    expect(r.cities.b.food).toBe(5000); // not delivered yet
    expect(r.arrivals).toHaveLength(0);
  });

  it('a convoy arriving this season empties its cargo (grain/gold/troops) into the destination', () => {
    const convoys = { cv1: mkConvoy({ seasonsRemaining: 1, food: 1000, gold: 200, troops: 500 }) };
    const cities = { a: mkCity('a'), b: mkCity('b', { food: 5000, gold: 300, troops: 2000 }) };
    const r = stepConvoys(convoys, cities);
    expect(r.convoys.cv1).toBeUndefined();       // retired
    expect(r.cities.b.food).toBe(6000);          // +1000
    expect(r.cities.b.gold).toBe(500);           // +200
    expect(r.cities.b.troops).toBe(2500);        // +500
    expect(r.arrivals).toHaveLength(1);
  });

  it('delivers warhorses on arrival, capped at the city herd ceiling', () => {
    const convoys = { cv1: mkConvoy({ seasonsRemaining: 1, food: 0, gold: 0, warhorses: 1500 }) };
    const cities = { a: mkCity('a'), b: mkCity('b', { warhorses: 200 }) };
    const r = stepConvoys(convoys, cities);
    expect(r.cities.b.warhorses).toBe(1700); // 200 + 1500
    // A delivery that would overflow the 6000 cap is clamped.
    const big = { cv1: mkConvoy({ seasonsRemaining: 1, food: 0, gold: 0, warhorses: 5000 }) };
    const r2 = stepConvoys(big, { a: mkCity('a'), b: mkCity('b', { warhorses: 5500 }) });
    expect(r2.cities.b.warhorses).toBe(6000); // clamped, not 10500
  });

  it('delivers iron on arrival, capped at the city smelting ceiling', () => {
    const convoys = { cv1: mkConvoy({ seasonsRemaining: 1, food: 0, gold: 0, iron: 2000 }) };
    const cities = { a: mkCity('a'), b: mkCity('b', { iron: 500 }) };
    const r = stepConvoys(convoys, cities);
    expect(r.cities.b.iron).toBe(2500);
    const big = { cv1: mkConvoy({ seasonsRemaining: 1, food: 0, gold: 0, iron: 6000 }) };
    const r2 = stepConvoys(big, { a: mkCity('a'), b: mkCity('b', { iron: 7500 }) });
    expect(r2.cities.b.iron).toBe(8000); // clamped to IRON_CITY_CAP
  });

  it('forfeits the cargo if the destination is no longer the force’s', () => {
    const convoys = { cv1: mkConvoy({ seasonsRemaining: 1 }) };
    const cities = { a: mkCity('a'), b: mkCity('b', { ownerForceId: 'enemy', food: 5000 }) };
    const r = stepConvoys(convoys, cities);
    expect(r.convoys.cv1).toBeUndefined();       // convoy gone
    expect(r.cities.b.food).toBe(5000);          // nothing delivered
    expect(r.arrivals).toHaveLength(0);
  });
});

describe('直供前線 — convoy delivering to a field army', () => {
  const mkArmy = (over: Partial<import('../types').Army> = {}): import('../types').Army => ({
    id: 'gen1', forceId: 'me', commanderId: 'gen1', companionIds: [], troops: 3000,
    fromCityId: 'a', targetCityId: 'b', x: 0, y: 0, progress: 0.5, totalSeasons: 2, food: 400, ...over,
  });

  it('empties grain + reinforcements into the army, not the city', () => {
    const convoys = { cv1: mkConvoy({ seasonsRemaining: 1, food: 1200, gold: 0, troops: 800, toArmyId: 'gen1' }) };
    const cities = { a: mkCity('a'), b: mkCity('b', { ownerForceId: 'rival', food: 5000 }) }; // besieged enemy city
    const armies = { gen1: mkArmy({ food: 400, troops: 3000 }) };
    const r = stepConvoys(convoys, cities, armies);
    expect(r.convoys.cv1).toBeUndefined();
    expect(r.armies.gen1.food).toBe(1600);   // 400 + 1200
    expect(r.armies.gen1.troops).toBe(3800); // 3000 + 800
    expect(r.cities.b.food).toBe(5000);      // enemy city untouched
    expect(r.arrivals[0].toArmy).toBe(true);
    expect(r.forfeited).toHaveLength(0);
  });

  it('falls back to the objective city if the army has dispersed and we hold it', () => {
    const convoys = { cv1: mkConvoy({ seasonsRemaining: 1, food: 1000, gold: 0, troops: 0, toArmyId: 'gen1' }) };
    const cities = { a: mkCity('a'), b: mkCity('b', { ownerForceId: 'me', food: 5000 }) }; // we now hold it
    const r = stepConvoys(convoys, cities, {}); // army gone
    expect(r.cities.b.food).toBe(6000);
    expect(r.forfeited).toHaveLength(0);
  });

  it('forfeits if both the army and the objective city are gone', () => {
    const convoys = { cv1: mkConvoy({ seasonsRemaining: 1, food: 1000, toArmyId: 'gen1' }) };
    const cities = { a: mkCity('a'), b: mkCity('b', { ownerForceId: 'rival' }) };
    const r = stepConvoys(convoys, cities, {});
    expect(r.forfeited).toHaveLength(1);
    expect(r.arrivals).toHaveLength(0);
  });
});

describe('主動劫糧 — raiding an enemy supply column (烏巢)', () => {
  it('an equal-or-stronger column is overrun: grain burned, coin looted, escort taken', () => {
    const target = mkConvoy({ troops: 1000, food: 3000, gold: 500, officerId: 'esc' });
    const o = resolveRaidStrike({ troops: 1200 }, target);
    expect(o.found).toBe(true);
    expect(o.success).toBe(true);
    expect(o.burnedFood).toBe(3000);
    expect(o.loot).toBe(500);
    expect(o.capturedEscortId).toBe('esc');
    expect(o.raiderSurvivors).toBe(1000); // −20%×(1000/1200 resistance) = −200
  });

  it('overrunning an unescorted baggage train costs the raiders nothing', () => {
    const o = resolveRaidStrike({ troops: 800 }, mkConvoy({ troops: 0, food: 2000 }));
    expect(o.success).toBe(true);
    expect(o.raiderSurvivors).toBe(800); // no escort → no losses
    expect(o.burnedFood).toBe(2000);
  });

  it('a heavier escort beats the raiders off (−35%, no loot)', () => {
    const o = resolveRaidStrike({ troops: 1000 }, mkConvoy({ troops: 2000, gold: 500 }));
    expect(o.success).toBe(false);
    expect(o.loot).toBe(0);
    expect(o.raiderSurvivors).toBe(650);
  });

  it('a quarry already delivered/destroyed is a dry hole — raiders return whole', () => {
    const o = resolveRaidStrike({ troops: 1000 }, undefined);
    expect(o.found).toBe(false);
    expect(o.success).toBe(false);
    expect(o.raiderSurvivors).toBe(1000);
  });
});

describe('劫糧道 — convoy raids & escort', () => {
  const cities = { a: mkCity('a'), b: mkCity('b') };

  it('an unescorted convoy is overrun and lost', () => {
    const convoys = { cv1: mkConvoy({ troops: 0, food: 2000 }) };
    const r = resolveConvoyRaids(convoys, { cv1: 1200 }, cities);
    expect(r.convoys.cv1).toBeUndefined();
    expect(r.raids[0].repelled).toBe(false);
  });

  it('a strong-enough escort beats the raid off (bloodied)', () => {
    const convoys = { cv1: mkConvoy({ troops: 2000, food: 2000 }) };
    const r = resolveConvoyRaids(convoys, { cv1: 1200 }, cities);
    expect(r.convoys.cv1).toBeDefined();
    expect(r.convoys.cv1.troops).toBe(1600); // −20% escort
    expect(r.raids[0].repelled).toBe(true);
  });

  it('leaves safe convoys (no danger) untouched', () => {
    const convoys = { cv1: mkConvoy({ troops: 0 }) };
    const r = resolveConvoyRaids(convoys, {}, cities);
    expect(r.convoys.cv1).toEqual(convoys.cv1);
    expect(r.raids).toHaveLength(0);
  });
});

describe('隨軍糧 — march provisions & rationing', () => {
  it('provisions a column for its whole planned journey', () => {
    // 5000 troops × 0.25 ration × 4 seasons = 5000
    expect(provisionNeeded(5000, 4)).toBe(5000);
    expect(provisionNeeded(5000, 0)).toBe(provisionNeeded(5000, 1)); // floors at 1 season
  });

  it('eats a season of rations when supplied', () => {
    const r = consumeRations(5000, 4000); // consume 1000
    expect(r.food).toBe(4000);
    expect(r.troops).toBe(4000);
    expect(r.starved).toBe(false);
  });

  it('sheds ~10% to desertion and empties when out of grain', () => {
    const r = consumeRations(0, 5000);
    expect(r.starved).toBe(true);
    expect(r.food).toBe(0);
    expect(r.troops).toBe(4500); // −10%
  });
});

describe('押運武将 — capacity & pace set by the officer', () => {
  it('capacity scales with 政治', () => {
    const able = mkOfficer({ id: 'able', stats: { politics: 90 } });
    const plain = mkOfficer({ id: 'plain', stats: { politics: 30 } });
    expect(convoyCapacity(able)).toBeGreaterThan(convoyCapacity(plain));
  });

  it('an able, diligent quartermaster outpaces a poor, lazy one', () => {
    const good = mkOfficer({ id: 'g', stats: { politics: 90 }, traits: ['diligent'] as never });
    const bad = mkOfficer({ id: 'b', stats: { politics: 30 }, traits: ['lazy'] as never });
    expect(convoySpeedMul(good)).toBeLessThan(convoySpeedMul(bad));
    expect(convoySpeedMul(good)).toBeGreaterThanOrEqual(0.65);
    expect(convoySpeedMul(bad)).toBeLessThanOrEqual(1.4);
  });

  it('a column whose destination fell mid-haul is reported forfeited', () => {
    const convoys = { cv1: mkConvoy({ id: 'cv1', officerId: 'esc', toCityId: 'b', seasonsRemaining: 1 }) };
    const cities = { a: mkCity('a'), b: mkCity('b', { ownerForceId: 'enemy' }) };
    const r = stepConvoys(convoys, cities);
    expect(r.arrivals).toHaveLength(0);
    expect(r.forfeited.map((c) => c.id)).toContain('cv1');
  });
});

describe('劫糧道 — raider attribution (for loot & capture)', () => {
  it('reports which stronghold overran a column', () => {
    const cities = { a: mkCity('a'), b: mkCity('b'), fort: mkCity('fort', { ownerForceId: 'me', troops: 9000 }) };
    const convoys = { cv1: mkConvoy({ id: 'cv1', forceId: 'enemy', troops: 0, gold: 500 }) };
    const r = resolveConvoyRaids(convoys, { cv1: 1500 }, cities, { cv1: 'fort' });
    expect(r.raids[0].repelled).toBe(false);
    expect(r.raids[0].raiderCityId).toBe('fort');
  });
});
