import { describe, it, expect } from 'vitest';
import { planLegionOrders, type Legion } from './legion';
import { resolveSeason } from './resolution';
import { buildInitialCities } from '../data/cities';
import { cityPos } from '../data/cityGeo';
import { terrainMarchCost } from '../data/geography';

/** A 批對稱掃尾 — 軍團迎伏(智將對來犯縱隊設伏)與圍點打援(圍城軍對
 *  敵援軍以逸待勞)。 */

const mkOfficer = (id: string, forceId: string, intelligence = 60, locationCityId = 'luoyang') => ({
  id, name: { zh: id, en: id }, skills: [], traits: [], equipment: [],
  stats: { war: 80, leadership: 75, intelligence, politics: 50, charisma: 50 },
  forceId, locationCityId, status: 'idle', task: null,
}) as never;

function fixtures() {
  const list = buildInitialCities({});
  const cities = Object.fromEntries(list.map((c) => [c.id, { ...c }]));
  return { cities };
}

describe('軍團迎伏 — a clever marshal answers a threat with an ambush', () => {
  const scene = (marshalIntel: number) => {
    const { cities } = fixtures();
    cities['hanzhong'] = { ...cities['hanzhong'], ownerForceId: 'me', troops: 6000, gold: 2000, food: 50000 };
    const legion: Legion = { id: 'L1', name: '漢中軍團', commanderId: 'marshal', cityIds: ['hanzhong'], directive: { kind: 'defend' } };
    const ap = cityPos(cities['changan'] as never);
    return {
      cities,
      legion,
      officers: {
        marshal: mkOfficer('marshal', 'me', marshalIntel, 'hanzhong'),
        guard: mkOfficer('guard', 'me', 60, 'hanzhong'),
      },
      // A hostile column at 長安, bearing down on 漢中 — the straight approach
      // crosses 秦嶺 (plenty of cover for a trap).
      threatColumns: [{ x: ap.x, y: ap.y, toCityId: 'hanzhong' }],
    };
  };

  it('intel ≥75 lays an ambush-camp on the approach road, in cover', () => {
    const { cities, legion, officers, threatColumns } = scene(80);
    const { orders } = planLegionOrders({
      cities: cities as never,
      officers: officers as never,
      busyOfficerIds: new Set(),
      playerForceId: 'me',
      legion,
      threatenedCityIds: new Set(['hanzhong']),
      threatColumns,
    });
    const trap = orders.find((o) => o.kind === 'ambush-camp') as { troops: number; x: number; y: number } | undefined;
    expect(trap).toBeTruthy();
    expect(trap!.troops).toBe(2400); // 40% of 6000, garrison floor kept
    expect(terrainMarchCost(trap!.x, trap!.y)).toBeGreaterThanOrEqual(0.3); // real cover
  });

  it('a dull marshal (intel <75) does not think of it', () => {
    const { cities, legion, officers, threatColumns } = scene(60);
    const { orders } = planLegionOrders({
      cities: cities as never,
      officers: officers as never,
      busyOfficerIds: new Set(),
      playerForceId: 'me',
      legion,
      threatenedCityIds: new Set(['hanzhong']),
      threatColumns,
    });
    expect(orders.some((o) => o.kind === 'ambush-camp')).toBe(false);
  });
});

describe('圍點打援 — a besieger meets relief columns from prepared lines', () => {
  const reliefScene = (besieging: boolean) => {
    const { cities } = fixtures();
    cities['luoyang'] = { ...cities['luoyang'], ownerForceId: 'me', troops: 3800, food: 90000, gold: 5000 };
    cities['changan'] = { ...cities['changan'], ownerForceId: 'foe', troops: 500, food: 90000, gold: 5000 };
    cities['chengdu'] = { ...cities['chengdu'], ownerForceId: 'foe', troops: 30000, food: 90000, gold: 5000 };
    const ap = cityPos(cities['changan'] as never);
    const camp = { x: ap.x + 15, y: ap.y };
    // Pick relief numbers exactly BETWEEN the plain-camp threshold (×1.3+cover)
    // and the prepared-lines threshold (×1.45+cover), so the boost decides it.
    const cover = Math.min(0.55, terrainMarchCost(camp.x, camp.y) * 0.45);
    const reliefTroops = Math.round(6000 * Math.pow(1.375 + cover, 2));
    return {
      cities,
      officers: { besieger: mkOfficer('besieger', 'f1'), relief: mkOfficer('relief', 'foe') },
      pendingCommands: {
        besieger: {
          type: 'march', cityId: 'luoyang', targetCityId: 'luoyang', officerId: 'besieger',
          troops: 6000, holding: true, ...(besieging ? { besieging: 'changan' } : {}),
          targetX: camp.x, targetY: camp.y, totalSeasons: 5, seasonsRemaining: 5,
        },
        relief: {
          type: 'march', cityId: 'chengdu', targetCityId: 'changan', officerId: 'relief',
          troops: reliefTroops, totalSeasons: 3, seasonsRemaining: 1,
        },
      },
    };
  };

  it('the besieger springs on the relief like a laid ambush and holds', () => {
    const { cities, officers, pendingCommands } = reliefScene(true);
    const out = resolveSeason({
      date: { year: 200, season: 'spring', month: 1, phase: 'upper' },
      cities, officers, forces: {}, pendingCommands,
      diplomacy: { relations: {} }, runtimeBonds: [], lostItems: [],
      playerForceId: 'me', rng: () => 0.0,
    } as never);
    const clash = out.report.entries.find((e) => e.battle?.field);
    expect(clash).toBeTruthy();
    expect(clash!.battle!.attacker.commanderId).toBe('besieger');
  });

  it('the same camp WITHOUT a siege underway is overrun by the same column', () => {
    const { cities, officers, pendingCommands } = reliefScene(false);
    const out = resolveSeason({
      date: { year: 200, season: 'spring', month: 1, phase: 'upper' },
      cities, officers, forces: {}, pendingCommands,
      diplomacy: { relations: {} }, runtimeBonds: [], lostItems: [],
      playerForceId: 'me', rng: () => 0.0,
    } as never);
    const clash = out.report.entries.find((e) => e.battle?.field);
    expect(clash).toBeTruthy();
    expect(clash!.battle!.attacker.commanderId).toBe('relief');
  });
});
