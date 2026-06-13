import { describe, it, expect } from 'vitest';
import { resolveSeason } from './resolution';
import { buildInitialCities } from '../data/cities';
import { CITY_GEO_OVERRIDES } from '../data/cityGeo';
import type { WildSite } from '../types';

/** A hostile-held ford sitting on a marching column's launch point should
 *  stall its crossing (mirrors the 防壁 facility stall). */
function setup(fordOwner: string | null) {
  const list = buildInitialCities({});
  const cm = Object.fromEntries(list.map((c) => [c.id, { ...c }]));
  cm['luoyang'] = { ...cm['luoyang'], ownerForceId: 'me', troops: 20000 };
  cm['hanguguan'] = { ...cm['hanguguan'], ownerForceId: 'me', troops: 5000 };
  const officer = {
    id: 'mover', name: { zh: '我將', en: 'Mover' }, skills: [], traits: [], equipment: [],
    stats: { war: 80, leadership: 75, intelligence: 70, politics: 50, charisma: 50 },
    forceId: 'me', locationCityId: 'luoyang', status: 'idle', task: null,
  } as never;
  const [lon, lat] = CITY_GEO_OVERRIDES['luoyang'];
  const ford: WildSite = {
    id: 'ford-test', name: { zh: '測試津', en: 'Test Ford' }, subtype: 'ford',
    coords: { lon, lat }, variant: '', ownerForceId: fordOwner,
    hp: 1500, maxHp: 1500, strength: 1500, guards: ['luoyang'], hostile: false,
  };
  return resolveSeason({
    date: { year: 200, season: 'spring', month: 1, phase: 'upper' } as never,
    cities: cm as never,
    officers: { mover: officer } as never,
    forces: {} as never,
    pendingCommands: {
      mover: { type: 'march', cityId: 'luoyang', targetCityId: 'hanguguan', officerId: 'mover', troops: 6000, seasonsRemaining: 20, totalSeasons: 20 } as never,
    },
    diplomacy: { relations: {} } as never,
    runtimeBonds: [],
    lostItems: [],
    playerForceId: 'me',
    sites: { 'ford-test': ford },
    rng: () => 0.0, // force the 50% stall to fire
  });
}

describe('渡口扼守 — hostile ford stalls a crossing', () => {
  it('a foe-held ford on the route stalls the player column', () => {
    const out = setup('foe');
    expect(out.report.entries.some((e) => (e.textZh ?? '').includes('為敵所扼'))).toBe(true);
  });

  it('an unowned ford does not stall anyone', () => {
    const out = setup(null);
    expect(out.report.entries.some((e) => (e.textZh ?? '').includes('為敵所扼'))).toBe(false);
  });
});
