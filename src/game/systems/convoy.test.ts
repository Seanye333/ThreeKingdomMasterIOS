import { describe, it, expect } from 'vitest';
import { stepConvoys, resolveConvoyRaids, type Convoy } from './convoy';
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

  it('forfeits the cargo if the destination is no longer the force’s', () => {
    const convoys = { cv1: mkConvoy({ seasonsRemaining: 1 }) };
    const cities = { a: mkCity('a'), b: mkCity('b', { ownerForceId: 'enemy', food: 5000 }) };
    const r = stepConvoys(convoys, cities);
    expect(r.convoys.cv1).toBeUndefined();       // convoy gone
    expect(r.cities.b.food).toBe(5000);          // nothing delivered
    expect(r.arrivals).toHaveLength(0);
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
