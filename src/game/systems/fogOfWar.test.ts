/**
 * 戰爭迷霧 — locks the visibility rules: own + adjacent cities in view,
 * marching columns scout, everything else stays dark.
 */
import { describe, it, expect } from 'vitest';
import type { Army, City, EntityId } from '../types';
import type { Officer } from '../types';
import { mkOfficer } from '../../test/factories';
import { computeFog, FOG_ARMY_RADIUS, FOG_CITY_RADIUS } from './fogOfWar';

const mkCity = (over: Partial<City> & { id: string; x: number; y: number }): City =>
  ({
    ownerForceId: null,
    troops: 5000,
    adjacentCityIds: [],
    coords: { x: over.x, y: over.y },
    name: { zh: over.id, en: over.id },
    ...over,
  } as unknown as City);

const mkArmy = (over: Partial<Army> & { id: string; x: number; y: number; forceId: string }): Army =>
  ({
    commanderId: over.id,
    companionIds: [],
    troops: 5000,
    fromCityId: 'home',
    targetCityId: 'away',
    progress: 0.5,
    totalSeasons: 2,
    ...over,
  } as Army);

// home(wei) ↔ nextdoor(wu) — adjacent; faraway(wu) at the far corner.
function world() {
  const cities: Record<EntityId, City> = {
    home: mkCity({ id: 'home', x: 200, y: 200, ownerForceId: 'wei', adjacentCityIds: ['nextdoor'] }),
    nextdoor: mkCity({ id: 'nextdoor', x: 380, y: 200, ownerForceId: 'wu', adjacentCityIds: ['home', 'faraway'] }),
    faraway: mkCity({ id: 'faraway', x: 900, y: 650, ownerForceId: 'wu', adjacentCityIds: ['nextdoor'] }),
  };
  return cities;
}

describe('computeFog', () => {
  it('sees own cities and their one-march neighbours, not the far realm', () => {
    const fog = computeFog(world(), {}, 'wei');
    expect(fog.visibleCityIds.has('home')).toBe(true);
    expect(fog.visibleCityIds.has('nextdoor')).toBe(true);
    expect(fog.visibleCityIds.has('faraway')).toBe(false);
  });

  it('spots enemy columns near an own city, loses them in the dark', () => {
    const fog = computeFog(world(), {}, 'wei');
    expect(fog.isVisiblePx(200 + FOG_CITY_RADIUS - 5, 200)).toBe(true);
    expect(fog.isVisiblePx(900, 650)).toBe(false);
  });

  it('marching columns scout — cities and ground near them come into view', () => {
    const armies = {
      scout: mkArmy({ id: 'scout', forceId: 'wei', x: 880, y: 640 }),
    };
    const fog = computeFog(world(), armies, 'wei');
    expect(fog.visibleCityIds.has('faraway')).toBe(true);
    expect(fog.isVisiblePx(880 + FOG_ARMY_RADIUS - 5, 640)).toBe(true);
  });

  it('細作開眼 — an espionage reveal lights the city and its surroundings', () => {
    const fog = computeFog(world(), {}, 'wei', ['faraway']);
    expect(fog.visibleCityIds.has('faraway')).toBe(true);
    expect(fog.isVisiblePx(900 + FOG_CITY_RADIUS - 5, 650)).toBe(true);
  });

  it("enemy columns don't scout for you", () => {
    const armies = {
      theirs: mkArmy({ id: 'theirs', forceId: 'wu', x: 880, y: 640 }),
    };
    const fog = computeFog(world(), armies, 'wei');
    expect(fog.visibleCityIds.has('faraway')).toBe(false);
    expect(fog.isVisiblePx(900, 650)).toBe(false);
  });

  it('斥候之明 — a keen mind in the city sees further than a dullard', () => {
    const justBeyond = 200 + FOG_CITY_RADIUS + 15; // outside the flat radius
    const dull: Record<EntityId, Officer> = { d: mkOfficer({ id: 'd', forceId: 'wei', locationCityId: 'home', stats: { intelligence: 60 } as never }) };
    const keen: Record<EntityId, Officer> = { k: mkOfficer({ id: 'k', forceId: 'wei', locationCityId: 'home', stats: { intelligence: 100 } as never }) };
    expect(computeFog(world(), {}, 'wei', undefined, dull).isVisiblePx(justBeyond, 200)).toBe(false);
    expect(computeFog(world(), {}, 'wei', undefined, keen).isVisiblePx(justBeyond, 200)).toBe(true);
  });

  it('a keen column commander scouts further ahead', () => {
    const officers: Record<EntityId, Officer> = { sage: mkOfficer({ id: 'sage', forceId: 'wei', stats: { intelligence: 100 } as never }) };
    const armies = { sage: mkArmy({ id: 'sage', forceId: 'wei', x: 880, y: 640, commanderId: 'sage' }) };
    const justBeyond = 880 + FOG_ARMY_RADIUS + 15;
    expect(computeFog(world(), armies, 'wei').isVisiblePx(justBeyond, 640)).toBe(false); // base radius
    expect(computeFog(world(), armies, 'wei', undefined, officers).isVisiblePx(justBeyond, 640)).toBe(true);
  });
});
