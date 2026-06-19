import { describe, it, expect } from 'vitest';
import { TRIBES, TRIBES_BY_ID } from './tribes';
import { buildInitialCities } from './cities';
import { geoToPixel, isLand, MAP_W, MAP_H, WORLD_SCALE } from './geography';
import {
  canCampaignTribe,
  resolveTribePunitive,
  createInitialTribeState,
  tickTribeMercenaries,
  TRIBE_VASSAL_AGGRESSION,
} from '../systems/tribes';
import { OFFICER_IDS, TALENT_POOL_IDS } from './officers';

const cities = buildInitialCities({ luoyang: 'f1' });
const cityMap = Object.fromEntries(cities.map((c) => [c.id, c]));

describe('tribe homelands on the map', () => {
  it('every tribe has a homeland that projects inside the map', () => {
    for (const tb of TRIBES) {
      const [x, y] = geoToPixel(tb.homeland.lon, tb.homeland.lat);
      expect(x, tb.id).toBeGreaterThanOrEqual(0);
      expect(x, tb.id).toBeLessThanOrEqual(MAP_W);
      expect(y, tb.id).toBeGreaterThanOrEqual(0);
      expect(y, tb.id).toBeLessThanOrEqual(MAP_H);
    }
  });

  it('homelands sit on (or hug) land, not adrift in deep sea', () => {
    for (const tb of TRIBES) {
      const [x, y] = geoToPixel(tb.homeland.lon, tb.homeland.lat);
      // generous coastal margin — frontier tribes may camp near the shoreline
      expect(
        isLand(x, y, -10 * WORLD_SCALE),
        `${tb.id} at ${x.toFixed(0)},${y.toFixed(0)} should be near land`,
      ).toBe(true);
    }
  });

  it("every tribe's raidable cities exist in the catalog", () => {
    for (const tb of TRIBES) {
      for (const cid of tb.raidableCityIds) {
        expect(cityMap[cid], `${tb.id} → ${cid}`).toBeTruthy();
      }
    }
  });
});

describe('tribe campaigns', () => {
  it('canCampaignTribe needs an owned or bordering raidable city', () => {
    const qiang = TRIBES_BY_ID['qiang'];
    // No cities owned by f1 near the Qiang → cannot reach.
    const none = canCampaignTribe(qiang, cityMap, 'nobody');
    expect(none.ok).toBe(false);
    // Own a raidable city → reachable.
    const owned = { ...cityMap };
    owned[qiang.raidableCityIds[0]] = { ...owned[qiang.raidableCityIds[0]], ownerForceId: 'f1' };
    expect(canCampaignTribe(qiang, owned, 'f1').ok).toBe(true);
  });

  it('a crushing punitive expedition collapses aggression and yields tribute', () => {
    const tb = TRIBES_BY_ID['shanyue']; // low strengthMul → easy to crush
    const r = resolveTribePunitive({
      tribe: tb,
      aggression: 0.2,
      troops: 30000,
      officerWar: 95,
      officerLeadership: 95,
      rng: () => 0.0, // weakest defenders
    });
    expect(r.win).toBe(true);
    expect(r.aggressionDelta).toBeLessThan(0);
    expect(r.tributeGold).toBeGreaterThan(0);
    expect(r.auxTroops).toBeGreaterThan(0);
  });

  it('a doomed expedition still dents aggression but pays nothing', () => {
    const tb = TRIBES_BY_ID['wuhuan'];
    const r = resolveTribePunitive({
      tribe: tb,
      aggression: 0.2,
      troops: 200,
      officerWar: 20,
      officerLeadership: 20,
      rng: () => 0.99, // strongest defenders
    });
    expect(r.win).toBe(false);
    expect(r.tributeGold).toBe(0);
    expect(r.auxTroops).toBe(0);
    expect(r.aggressionDelta).toBeLessThan(0);
  });

  it('createInitialTribeState seeds every tribe at base aggression', () => {
    const st = createInitialTribeState();
    for (const tb of TRIBES) {
      expect(st.aggression[tb.id]).toBe(tb.baseAggression);
    }
  });
});

describe('tribe vassalage', () => {
  const rosterIds = new Set([...OFFICER_IDS, ...TALENT_POOL_IDS]);

  it('every named chieftain exists in the roster', () => {
    for (const tb of TRIBES) {
      if (tb.chieftainId) expect(rosterIds.has(tb.chieftainId), `${tb.id} chief ${tb.chieftainId}`).toBe(true);
    }
  });

  it('a subdued tribe sends auxiliaries to its owned border city', () => {
    const cm = Object.fromEntries(buildInitialCities({}).map((c) => [c.id, { ...c }]));
    const nanban = TRIBES_BY_ID['nanban'];
    const border = nanban.raidableCityIds[0];
    cm[border] = { ...cm[border], ownerForceId: 'f1' };
    const before = cm[border].troops;
    const out = tickTribeMercenaries({
      aggression: { nanban: TRIBE_VASSAL_AGGRESSION - 0.01 },
      cities: cm,
      rng: () => 0.5,
    });
    expect(out.cities[border].troops).toBeGreaterThan(before);
    expect(out.entries.some((e) => e.kind === 'income')).toBe(true);
  });

  it('a restless tribe sends nothing', () => {
    const cm = Object.fromEntries(buildInitialCities({}).map((c) => [c.id, { ...c }]));
    const nanban = TRIBES_BY_ID['nanban'];
    cm[nanban.raidableCityIds[0]] = { ...cm[nanban.raidableCityIds[0]], ownerForceId: 'f1' };
    const out = tickTribeMercenaries({
      aggression: { nanban: 0.25 },
      cities: cm,
      rng: () => 0.5,
    });
    expect(out.entries.length).toBe(0);
  });
});
