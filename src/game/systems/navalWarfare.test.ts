import { describe, it, expect } from 'vitest';
import {
  navalDrill, drillTier, seasickness, assignFleetShipClasses, fleetSize,
  groundingMul, isGrounded, landingShock, navalContextFor, isWaterTerrain,
} from './navalWarfare';
import { assignShipClass } from './tactical';

const inland = (n: number) => Array.from({ length: n }, () => ({ terrain: 'plain' }));
const riverine = (n: number) => Array.from({ length: n }, () => ({ terrain: 'water' }));

describe('水軍熟練度', () => {
  it('a landlocked northern host can barely crew a raft', () => {
    const d = navalDrill({ ownedCities: inland(12), ownedPorts: [] });
    expect(d).toBeLessThan(25);
    expect(drillTier(d)).toBe('landlubber');
  });

  it('a realm of river cities with good yards is a master fleet', () => {
    const d = navalDrill({
      ownedCities: riverine(8),
      ownedPorts: [{ navalTier: 3 }, { navalTier: 2 }, { navalTier: 3 }],
      navalAcademy: true,
      commanderIsAdmiral: true,
    });
    expect(d).toBeGreaterThanOrEqual(85);
    expect(drillTier(d)).toBe('master');
  });

  it('an admiral and an academy lift a middling force', () => {
    const base = { ownedCities: [...inland(6), ...riverine(2)], ownedPorts: [{ navalTier: 1 }] };
    const plain = navalDrill(base);
    const led = navalDrill({ ...base, commanderIsAdmiral: true, navalAcademy: true });
    expect(led - plain).toBe(26);
  });

  it('never leaves the 0–100 band', () => {
    expect(navalDrill({ ownedCities: [], ownedPorts: [] })).toBeGreaterThanOrEqual(0);
    expect(navalDrill({
      ownedCities: riverine(30),
      ownedPorts: Array.from({ length: 20 }, () => ({ navalTier: 3 })),
      navalAcademy: true, commanderIsAdmiral: true,
    })).toBeLessThanOrEqual(100);
  });
});

describe('暈船', () => {
  it('costs a landlubber power, morale and an action point', () => {
    const s = seasickness(10);
    expect(s.powerMul).toBeLessThan(0.8);
    expect(s.moraleDelta).toBeLessThan(0);
    expect(s.apPenalty).toBe(1);
    expect(s.noteZh).toContain('不習水戰');
  });

  it('leaves a seasoned fleet better than neutral', () => {
    const s = seasickness(90);
    expect(s.powerMul).toBeGreaterThan(1);
    expect(s.moraleDelta).toBe(0);
    expect(s.apPenalty).toBe(0);
  });

  it('連環 steadies a green crew to the neutral line — the whole point of 龐統的計', () => {
    const sick = seasickness(10);
    const chained = seasickness(10, true);
    expect(chained.powerMul).toBeGreaterThan(sick.powerMul);
    expect(chained.moraleDelta).toBe(0);
    expect(chained.apPenalty).toBe(0);
  });

  it('連環 never drags a good fleet down to the line', () => {
    expect(seasickness(90, true).powerMul).toBe(seasickness(90).powerMul);
  });
});

describe('艦隊編成', () => {
  it('hands the heaviest hull to the commander, then down by size', () => {
    const hulls = assignFleetShipClasses(
      [{ troops: 1000, isCommander: true }, { troops: 5000 }, { troops: 800 }],
      { flagship: 1, 'da-yi': 1, 'zou-ge': 1 },
      assignShipClass,
    );
    expect(hulls[0]).toBe('flagship');   // commander gets first pick
    expect(hulls[1]).toBe('da-yi');      // then the biggest command
    expect(hulls[2]).toBe('zou-ge');
  });

  it('improvises from troop count once the fleet runs dry', () => {
    const hulls = assignFleetShipClasses(
      [{ troops: 3000, isCommander: true }, { troops: 3000 }],
      { flagship: 1 },
      assignShipClass,
    );
    expect(hulls[0]).toBe('flagship');
    expect(hulls[1]).toBe(assignShipClass(3000, false));
  });

  it('with no ports at all, behaves exactly as before', () => {
    const contingents = [{ troops: 5000, isCommander: true }, { troops: 700 }];
    const hulls = assignFleetShipClasses(contingents, undefined, assignShipClass);
    expect(hulls).toEqual([assignShipClass(5000, true), assignShipClass(700, false)]);
  });

  it('does not mutate the dock map it was handed', () => {
    const docked = { warship: 2 };
    assignFleetShipClasses([{ troops: 100 }, { troops: 100 }], docked, assignShipClass);
    expect(docked).toEqual({ warship: 2 });
    expect(fleetSize(docked)).toBe(2);
  });
});

describe('淺灘擱淺', () => {
  it('grounds a tower-ship but not a skiff', () => {
    expect(groundingMul('flagship', 'shallows')).toBeLessThan(0.6);
    expect(isGrounded('flagship', 'shallows')).toBe(true);
    expect(groundingMul('zou-ge', 'shallows')).toBe(1);
    expect(isGrounded('zou-ge', 'shallows')).toBe(false);
  });

  it('open channel is safe for every hull', () => {
    expect(groundingMul('da-yi', 'river')).toBe(1);
    expect(groundingMul('da-yi', 'reeds')).toBe(1);
  });

  it('counts shoals and reeds as water', () => {
    expect(isWaterTerrain('shallows')).toBe(true);
    expect(isWaterTerrain('reeds')).toBe(true);
    expect(isWaterTerrain('river')).toBe(true);
    expect(isWaterTerrain('plain')).toBe(false);
  });
});

describe('搶灘登陸', () => {
  it('disorders a green crew that wades ashore', () => {
    const s = landingShock({ fromTerrain: 'river', toTerrain: 'plain', isShip: true, drill: 20 });
    expect(s.disorderTurns).toBe(2);
    expect(s.moraleDelta).toBeLessThan(0);
  });

  it('drilled marines re-form in one turn', () => {
    expect(landingShock({ fromTerrain: 'river', toTerrain: 'plain', isShip: true, drill: 80 }).disorderTurns).toBe(1);
  });

  it('a built landing (bridge) and staying afloat cost nothing', () => {
    expect(landingShock({ fromTerrain: 'river', toTerrain: 'bridge', isShip: true }).disorderTurns).toBe(0);
    expect(landingShock({ fromTerrain: 'river', toTerrain: 'shallows', isShip: true }).disorderTurns).toBe(0);
  });

  it('land units are never "landing"', () => {
    expect(landingShock({ fromTerrain: 'river', toTerrain: 'plain', isShip: false }).disorderTurns).toBe(0);
  });
});

describe('navalContextFor', () => {
  const cities = [
    { ownerForceId: 'wu', terrain: 'water' },
    { ownerForceId: 'wu', terrain: 'water', port: true },
    { ownerForceId: 'wei', terrain: 'plain' },
  ];
  const ports = [
    { ownerForceId: 'wu', linkedCityId: 'jianye', navalTier: 3, dockedShips: { flagship: 1, warship: 2 } },
    { ownerForceId: 'wu', linkedCityId: 'chaisang', navalTier: 2, dockedShips: { 'zou-ge': 4 } },
    { ownerForceId: 'wei', linkedCityId: 'jianye', dockedShips: { warship: 9 } },
  ];

  it('only counts hulls docked at the contested city, owned by that force', () => {
    const ctx = navalContextFor({ forceId: 'wu', cityId: 'jianye', cities, ports, officers: [] });
    expect(ctx.fleet).toEqual({ flagship: 1, warship: 2 });
    expect(ctx.drill).toBeGreaterThan(50);
  });

  it('a force with no cities on the water is a landlubber even holding a harbour', () => {
    const ctx = navalContextFor({ forceId: 'wei', cityId: 'jianye', cities, ports, officers: [] });
    expect(drillTier(ctx.drill)).not.toBe('master');
    expect(ctx.fleet).toEqual({ warship: 9 });
  });

  it('a null force is neutral (no naval reckoning at all)', () => {
    expect(navalContextFor({ forceId: null, cityId: 'x', cities, ports, officers: [] }))
      .toEqual({ drill: 50, fleet: {} });
  });
});
