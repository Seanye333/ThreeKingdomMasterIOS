import { describe, it, expect } from 'vitest';
import {
  SITE_TEMPLATES,
  buildInitialSites,
  migrateSites,
  canPlayerSeizeSite,
  RESOURCE_SITE_DEFS,
} from './sites';
import { buildInitialCities } from './cities';
import { geoToPixel, isLand, MAP_W, MAP_H, WORLD_SCALE } from './geography';

const cities = buildInitialCities({ luoyang: 'f1' });
const cityMap = Object.fromEntries(cities.map((c) => [c.id, c]));

describe('wild sites', () => {
  it('every site projects inside the map and hugs land', () => {
    for (const t of SITE_TEMPLATES) {
      const [x, y] = geoToPixel(t.coords.lon, t.coords.lat);
      expect(x, t.id).toBeGreaterThanOrEqual(0);
      expect(x, t.id).toBeLessThanOrEqual(MAP_W);
      expect(y, t.id).toBeGreaterThanOrEqual(0);
      expect(y, t.id).toBeLessThanOrEqual(MAP_H);
      // fords sit on the water's edge → allow a wider coastal margin
      const margin = t.subtype === 'ford' ? -22 : -12;
      expect(isLand(x, y, margin * WORLD_SCALE), `${t.id} at ${x.toFixed(0)},${y.toFixed(0)}`).toBe(true);
    }
  });

  it("every site's guard cities exist", () => {
    for (const t of SITE_TEMPLATES) {
      for (const g of t.guards) {
        expect(cityMap[g], `${t.id} → ${g}`).toBeTruthy();
      }
    }
  });

  it('bandit nests start neutral + hostile; fords/deposits neutral + calm', () => {
    const sites = buildInitialSites();
    for (const s of Object.values(sites)) {
      expect(s.ownerForceId).toBeNull();
      expect(s.hostile).toBe(s.subtype === 'bandit');
      expect(s.hp).toBe(s.maxHp);
    }
  });

  it('every resource site has a defined yield', () => {
    for (const t of SITE_TEMPLATES) {
      if (t.subtype !== 'resource') continue;
      const def = RESOURCE_SITE_DEFS[t.variant ?? ''];
      expect(def, t.id).toBeTruthy();
      expect(def.goldPerSeason + def.troopsPerSeason).toBeGreaterThan(0);
    }
  });

  it('migrateSites refreshes design data but preserves owner/hostile', () => {
    const sites = buildInitialSites();
    const first = Object.keys(sites)[0];
    const saved = { ...sites, [first]: { ...sites[first], ownerForceId: 'f1', hostile: false, hp: 10 } };
    const migrated = migrateSites(saved);
    expect(migrated[first].ownerForceId).toBe('f1');
    expect(migrated[first].hostile).toBe(false);
    // name/strength come from the template (design data refreshed)
    expect(migrated[first].name).toEqual(sites[first].name);
  });

  it('canPlayerSeizeSite requires owning or bordering a guard city', () => {
    const site = SITE_TEMPLATES.find((s) => s.id === 'bandit-heishan')!;
    const ws = buildInitialSites()[site.id];
    expect(canPlayerSeizeSite(ws, cityMap, 'nobody').ok).toBe(false);
    const owned = { ...cityMap };
    owned[site.guards[0]] = { ...owned[site.guards[0]], ownerForceId: 'f1' };
    expect(canPlayerSeizeSite(ws, owned, 'f1').ok).toBe(true);
  });
});
