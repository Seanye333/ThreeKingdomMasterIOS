/**
 * Locks down the strategic-facility systems (箭樓/投石臺/陣/防壁), the AI's
 * fort assaults, and the named-battlefield bindings — all shipped in the same
 * overnight batch, all previously untested.
 */
import { describe, it, expect } from 'vitest';
import type { City, Force, Fort } from '../types';
import type { DiplomaticState } from '../types/diplomacy';
import { FACILITY_DEFS } from '../types';
import { planAIFacilities, planAIFortAssaults } from './aiBuild';
import { setupTacticalBattle, endTurn } from './tactical';
import { mkOfficer, mkUnit, mkBattle, mkTiles } from '../../test/factories';
import { NAMED_BATTLE_MAPS, NAMED_MAPS_BY_CITY, NAMED_MAPS_BY_ID } from '../data/namedMaps';
import { CITY_IDS } from '../data/cities';
import { geoToPixel, MAP_W, MAP_H } from '../data/geography';

const NO_DIPLO = { relations: {} } as DiplomaticState; // neutral = hostilities permitted

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: null,
    troops: 8000,
    gold: 2000,
    defense: 20,
    population: 100_000,
    adjacentCityIds: [],
    coords: { x: 500, y: 360 },
    name: { zh: over.id, en: over.id },
    ...over,
  } as unknown as City);

const mkForce = (over: Partial<Force> & { id: string }): Force =>
  ({
    name: { zh: over.id, en: over.id },
    color: '#abcdef',
    capitalCityId: 'cap',
    personality: 'defensive',
    ...over,
  } as unknown as Force);

// A fort at given strategic-pixel coords (inverse of geoToPixel for lon/lat).
const fortAtPx = (over: Partial<Fort> & { id: string; px: number; py: number }): Fort => {
  // Inverse of the CURRENT (scaled) geoToPixel so a fort lands at over.px/py.
  const lon = 96 + (over.px / MAP_W) * 29;
  const lat = 43 - (over.py / MAP_H) * 26;
  const { px: _px, py: _py, ...rest } = over;
  return {
    name: { zh: over.id, en: over.id },
    subtype: 'stockade',
    coords: { lon, lat },
    ownerForceId: null,
    hp: 300,
    maxHp: 300,
    guards: [],
    ...rest,
  } as Fort;
};

describe('named-battlefield bindings (the dead-content regression)', () => {
  it('every NAMED_MAPS_BY_CITY key is a real city id', () => {
    for (const cityId of Object.keys(NAMED_MAPS_BY_CITY)) {
      expect(CITY_IDS, `city '${cityId}' missing from catalog`).toContain(cityId);
    }
  });
  it('every NAMED_MAPS_BY_CITY value is a real map id', () => {
    for (const mapId of Object.values(NAMED_MAPS_BY_CITY)) {
      expect(NAMED_MAPS_BY_ID[mapId], `map '${mapId}' missing`).toBeTruthy();
    }
  });
  it('every named map keeps its terrain overrides inside its own bounds', () => {
    for (const m of NAMED_BATTLE_MAPS) {
      for (const key of Object.keys(m.terrainOverrides ?? {})) {
        const [c, r] = key.split(',').map(Number);
        expect(c, `${m.id} override col ${key}`).toBeLessThan(m.width);
        expect(r, `${m.id} override row ${key}`).toBeLessThan(m.height);
      }
    }
  });
});

describe('planAIFacilities — frontier forces fortify', () => {
  const base = () => {
    const cap = mkCity({ id: 'cap', ownerForceId: 'AI', gold: 5000 });
    const front = mkCity({ id: 'front', ownerForceId: 'AI', troops: 9000, adjacentCityIds: ['mine'] });
    const mine = mkCity({ id: 'mine', ownerForceId: 'P' });
    return {
      cities: { cap, front, mine },
      forces: { AI: mkForce({ id: 'AI' }), P: mkForce({ id: 'P', capitalCityId: 'mine' }) },
      forts: {} as Record<string, Fort>,
      diplomacy: NO_DIPLO,
      playerForceId: 'P',
    };
  };

  it('builds a facility near the contested frontier city when the dice land', () => {
    const out = planAIFacilities({ ...base(), rng: () => 0.01 });
    const built = Object.values(out.newForts);
    expect(built).toHaveLength(1);
    expect(built[0].facility).toBeTruthy();
    expect(built[0].guards).toContain('front');
    // Paid from the capital.
    expect(out.cities['cap'].gold).toBeLessThan(5000);
  });

  it('respects the per-force standing cap', () => {
    const ctx = base();
    ctx.forts = {
      a: fortAtPx({ id: 'a', px: 100, py: 100, facility: 'tower', ownerForceId: 'AI' }),
      b: fortAtPx({ id: 'b', px: 120, py: 100, facility: 'tower', ownerForceId: 'AI' }),
      c: fortAtPx({ id: 'c', px: 140, py: 100, facility: 'tower', ownerForceId: 'AI' }),
    };
    const out = planAIFacilities({ ...ctx, rng: () => 0.01 });
    expect(Object.keys(out.newForts)).toHaveLength(0);
  });
});

describe('planAIFortAssaults — the AI razes player works', () => {
  const base = (fortHp: number) => {
    const hostileCity = mkCity({ id: 'h', ownerForceId: 'AI', troops: 10_000, coords: { x: 500, y: 360 } });
    const fort = fortAtPx({ id: 'pf', px: 510, py: 360, facility: 'tower', ownerForceId: 'P', hp: fortHp, maxHp: 600, guards: ['mine'] });
    return {
      cities: { h: hostileCity, mine: mkCity({ id: 'mine', ownerForceId: 'P' }) },
      forces: { AI: mkForce({ id: 'AI', capitalCityId: 'h' }), P: mkForce({ id: 'P', capitalCityId: 'mine' }) },
      forts: { pf: fort },
      diplomacy: NO_DIPLO,
      playerForceId: 'P',
    };
  };

  it('damages a player fort in range and bleeds the assaulting garrison', () => {
    const out = planAIFortAssaults({ ...base(600), rng: () => 0.01 });
    expect(out.forts['pf']).toBeTruthy();
    expect(out.forts['pf'].hp).toBeLessThan(600);
    expect(out.cities['h'].troops).toBeLessThan(10_000);
    expect(out.entries.length).toBe(1);
  });

  it('razes the fort outright when damage exceeds remaining HP', () => {
    const out = planAIFortAssaults({ ...base(50), rng: () => 0.01 });
    expect(out.forts['pf']).toBeUndefined();
    expect(out.entries[0].textZh).toContain('拔除');
  });

  it('stays home when the dice say so', () => {
    const out = planAIFortAssaults({ ...base(600), rng: () => 0.99 });
    expect(out.forts['pf'].hp).toBe(600);
    expect(out.entries).toHaveLength(0);
  });

  it('never touches permanent historical forts, even player-held ones', () => {
    const ctx = base(600);
    ctx.forts = {
      pf: { ...ctx.forts['pf'], subtype: 'fort' as const, seasonsRemaining: undefined },
    };
    const out = planAIFortAssaults({ ...ctx, rng: () => 0.01 });
    expect(out.forts['pf'].hp).toBe(600);
    expect(out.entries).toHaveLength(0);
  });
});

describe('陣 (camp → barracks-out) rallies defenders in battle', () => {
  it('gives +4 morale to defender units within 2 hexes at the end of the attacker turn', () => {
    const defender = mkUnit({ id: 'd1', officerId: 'od', side: 'defender', coord: { col: 10, row: 5 }, morale: 50 });
    const attacker = mkUnit({ id: 'a1', officerId: 'oa', side: 'attacker', coord: { col: 0, row: 5 }, morale: 50 });
    const battle = mkBattle({
      units: [attacker, defender],
      tiles: mkTiles(18, 12),
      width: 18,
      height: 12,
      activeSide: 'attacker',
      cityStructures: [
        { slotIndex: 0, buildingId: 'barracks-out', level: 1, coord: { col: 11, row: 5 }, hp: 200 },
      ],
    });
    const next = endTurn(battle);
    const d = next.units.find((u) => u.id === 'd1')!;
    const a = next.units.find((u) => u.id === 'a1')!;
    expect(d.morale).toBe(54);
    expect(a.morale).toBeLessThanOrEqual(50); // attackers get no rally
  });
});

describe('防壁 throws a battlefield wall line via setupTacticalBattle', () => {
  it('injects destructible wall tiles with 400 HP when a barricade is in range', () => {
    const anchor = geoToPixel(110, 30);
    const battle = setupTacticalBattle({
      cityId: 'nowhere-special',
      width: 18,
      height: 12,
      attackerForceId: 'A',
      defenderForceId: 'B',
      attackers: [{ officer: mkOfficer({ id: 'atk' }), troops: 1000 }],
      defenders: [{ officer: mkOfficer({ id: 'def' }), troops: 1000 }],
      battleGeo: { x: anchor[0], y: anchor[1], bearing: 0, season: 'spring' },
      forts: {
        w1: fortAtPx({ id: 'w1', px: anchor[0], py: anchor[1], facility: 'wall', ownerForceId: 'B', hp: 520, maxHp: 520 }),
      },
      field: true,
    });
    const wallTiles = battle.tiles.filter((t) => t.terrain === 'wall');
    expect(wallTiles.length).toBeGreaterThanOrEqual(1);
    const hp400 = Object.values(battle.wallHp ?? {}).filter((hp) => hp === 400);
    expect(hp400.length).toBe(wallTiles.length);
    expect((battle.log ?? []).some((l) => l.text.includes('防壁'))).toBe(true);
  });

  it('ranged facilities in range join as auto-firing emplacements', () => {
    const anchor = geoToPixel(110, 30);
    const battle = setupTacticalBattle({
      cityId: 'nowhere-special',
      width: 18,
      height: 12,
      attackerForceId: 'A',
      defenderForceId: 'B',
      attackers: [{ officer: mkOfficer({ id: 'atk2' }), troops: 1000 }],
      defenders: [{ officer: mkOfficer({ id: 'def2' }), troops: 1000 }],
      battleGeo: { x: anchor[0], y: anchor[1], bearing: 0, season: 'spring' },
      forts: {
        t1: fortAtPx({ id: 't1', px: anchor[0], py: anchor[1], facility: 'tower', ownerForceId: 'B' }),
        // An ATTACKER-owned tower must NOT join the defender's line.
        t2: fortAtPx({ id: 't2', px: anchor[0], py: anchor[1], facility: 'tower', ownerForceId: 'A' }),
      },
      field: true,
    });
    const towers = (battle.cityStructures ?? []).filter((s) => s.buildingId === 'watchtower');
    expect(towers).toHaveLength(1);
  });
});

describe('named-map regressions (review findings)', () => {
  it('圍困 starves defenders on scripted battlefields too (hefei)', () => {
    const battle = setupTacticalBattle({
      cityId: 'hefei', // resolves to map-hefei now that the keys are fixed
      width: 18, height: 12,
      attackerForceId: 'A', defenderForceId: 'B',
      attackers: [{ officer: mkOfficer({ id: 'ia' }), troops: 5000 }],
      defenders: [{ officer: mkOfficer({ id: 'id' }), troops: 5000 }],
      siegeWorks: 'invest',
    });
    const defender = battle.units.find((u) => u.side === 'defender')!;
    expect(defender.effects.some((e) => e.kind === 'starving')).toBe(true);
  });

  it('no land unit ever spawns in a river/wall hex (ruxukou mid-field river)', () => {
    const battle = setupTacticalBattle({
      cityId: 'ruxu', // map-ruxukou: river crosses rows 4-5 full width
      width: 18, height: 12,
      attackerForceId: 'A', defenderForceId: 'B',
      attackers: [
        { officer: mkOfficer({ id: 'ra1' }), troops: 3000 },
        { officer: mkOfficer({ id: 'ra2' }), troops: 3000 },
        { officer: mkOfficer({ id: 'ra3' }), troops: 3000 },
      ],
      defenders: [
        { officer: mkOfficer({ id: 'rd1' }), troops: 3000 },
        { officer: mkOfficer({ id: 'rd2' }), troops: 3000 },
        { officer: mkOfficer({ id: 'rd3' }), troops: 3000 },
      ],
    });
    const terrain = new Map(battle.tiles.map((t) => [`${t.coord.col},${t.coord.row}`, t.terrain]));
    for (const u of battle.units) {
      const g = terrain.get(`${u.coord.col},${u.coord.row}`);
      expect(['river', 'wall', 'gate'], `${u.id} spawned on ${g}`).not.toContain(g);
    }
  });
});
