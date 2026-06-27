import { describe, it, expect } from 'vitest';
import { SCENIC_SITES, canVisitScenic, rollHermitRecruit } from './scenicSites';
import { buildInitialCities } from './cities';
import { OFFICER_IDS, TALENT_POOL_IDS } from './officers';
import { ITEMS } from './items';
import { geoToPixel, isLand, MAP_W, MAP_H, WORLD_SCALE } from './geography';

const cities = buildInitialCities({ luoyang: 'f1' });
const cityMap = Object.fromEntries(cities.map((c) => [c.id, c]));
const officerIds = new Set([...OFFICER_IDS, ...TALENT_POOL_IDS]);
const itemIds = new Set(ITEMS.map((i) => i.id));

describe('scenic sites', () => {
  it('each site projects onto the map and on land', () => {
    for (const s of SCENIC_SITES) {
      const [x, y] = geoToPixel(s.coords.lon, s.coords.lat);
      expect(x, s.id).toBeGreaterThanOrEqual(0);
      expect(x, s.id).toBeLessThanOrEqual(MAP_W);
      expect(y, s.id).toBeGreaterThanOrEqual(0);
      expect(y, s.id).toBeLessThanOrEqual(MAP_H);
      expect(isLand(x, y, -12 * WORLD_SCALE), `${s.id} on land`).toBe(true);
    }
  });

  it('every referenced hermit / item / guard city exists', () => {
    for (const s of SCENIC_SITES) {
      if (s.hermitId) expect(officerIds.has(s.hermitId), `${s.id} hermit ${s.hermitId}`).toBe(true);
      if (s.itemId) expect(itemIds.has(s.itemId), `${s.id} item ${s.itemId}`).toBe(true);
      for (const g of s.guards) expect(cityMap[g], `${s.id} guard ${g}`).toBeTruthy();
    }
  });

  it('canVisitScenic requires owning or bordering a guard city', () => {
    const longzhong = SCENIC_SITES.find((s) => s.id === 'longzhong')!;
    expect(canVisitScenic(longzhong, cityMap, 'nobody').ok).toBe(false);
    const owned = { ...cityMap };
    owned[longzhong.guards[0]] = { ...owned[longzhong.guards[0]], ownerForceId: 'f1' };
    expect(canVisitScenic(longzhong, owned, 'f1').ok).toBe(true);
  });

  it('rollHermitRecruit favours charisma and is bounded', () => {
    // A silver-tongued envoy + warm ruler almost always wins a modest recluse.
    expect(rollHermitRecruit({ envoyCharisma: 95, rulerCharisma: 95, hermitIntelligence: 70, rng: () => 0.2 })).toBe(true);
    // The loftiest recluse (孔明, INT 100) resists a dull envoy.
    expect(rollHermitRecruit({ envoyCharisma: 30, rulerCharisma: 30, hermitIntelligence: 100, rng: () => 0.5 })).toBe(false);
    // Even the best never exceeds ~90% on a first call (rng 0.92 fails).
    expect(rollHermitRecruit({ envoyCharisma: 100, rulerCharisma: 100, hermitIntelligence: 20, rng: () => 0.92 })).toBe(false);
  });

  it('三顧之誠 — repeated visits draw out even the loftiest recluse', () => {
    const call = (visit: number, rng: number) =>
      rollHermitRecruit({ envoyCharisma: 75, rulerCharisma: 75, hermitIntelligence: 100, visit, rng: () => rng });
    // 孔明 (INT 100) vs a worthy-but-not-dazzling envoy: a first call seldom
    // finds him in, but the third nearly always does — same roll, different fate.
    expect(call(1, 0.7)).toBe(false); // 一訪不遇
    expect(call(3, 0.7)).toBe(true);  // 三顧乃出
    // The third visit can crest past the first-visit 90% ceiling.
    expect(call(3, 0.95)).toBe(true);
  });
});
