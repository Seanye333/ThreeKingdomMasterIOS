import { describe, it, expect } from 'vitest';
import { resolveBattle, siegeBuildingModifiers, foreignAuxDefenseMultiplier, cityDrillDefenseMultiplier, cityDrillLossMultiplier, honorificThemeMul, type BattleSide } from './combat';
import { aggregateSlotEffects, type DefenseBuildingId } from '../data/defenseBuildings';
import type { City } from '../types';
import { mkOfficer, fixedRng, seededRng } from '../../test/factories';

const side = (troops: number, commander = mkOfficer()): BattleSide => ({ troops, commander });

const cityOf = (over: Partial<City>): City =>
  ({ id: 'c', name: { zh: '城', en: 'City' }, ...over } as unknown as City);

describe('名號各司其職 — honorificThemeMul', () => {
  const navy = mkOfficer({ honorificId: 'fubo' as never });      // naval
  const valor = mkOfficer({ honorificId: 'huwei' as never });    // valor
  const steward = mkOfficer({ honorificId: 'jianwei' as never });// steward
  const siege = mkOfficer({ honorificId: 'polu' as never });     // siege

  it('a naval honorific only helps on water', () => {
    expect(honorificThemeMul([navy], { water: true, siege: false, defending: false })).toBeGreaterThan(1);
    expect(honorificThemeMul([navy], { water: false, siege: false, defending: false })).toBe(1);
  });
  it('valor helps in an open field clash, not on water', () => {
    expect(honorificThemeMul([valor], { water: false, siege: false, defending: false })).toBeGreaterThan(1);
    expect(honorificThemeMul([valor], { water: true, siege: false, defending: false })).toBe(1);
  });
  it('siege helps the attacker storming a city; steward helps its defender', () => {
    expect(honorificThemeMul([siege], { water: false, siege: true, defending: false })).toBeGreaterThan(1);
    expect(honorificThemeMul([siege], { water: false, siege: true, defending: true })).toBe(1);
    expect(honorificThemeMul([steward], { water: false, siege: true, defending: true })).toBeGreaterThan(1);
    expect(honorificThemeMul([steward], { water: false, siege: true, defending: false })).toBe(1);
  });
  it('no honorific is neutral', () => {
    expect(honorificThemeMul([mkOfficer()], { water: true, siege: false, defending: false })).toBe(1);
  });
});

describe('異域義從 — foreign aux defence multiplier', () => {
  it('is 1 with no aux and rises with aux, capped at +15%', () => {
    expect(foreignAuxDefenseMultiplier(0)).toBe(1);
    expect(foreignAuxDefenseMultiplier(undefined)).toBe(1);
    expect(foreignAuxDefenseMultiplier(2000)).toBeGreaterThan(1);
    expect(foreignAuxDefenseMultiplier(2000)).toBeLessThan(foreignAuxDefenseMultiplier(8000));
    expect(foreignAuxDefenseMultiplier(10_000_000)).toBeCloseTo(1.15, 5);
  });
});

describe('練度 — drill defence multiplier', () => {
  it('is 1 for raw levies and rises with drill, capped at +25%', () => {
    expect(cityDrillDefenseMultiplier(0)).toBe(1);
    expect(cityDrillDefenseMultiplier(undefined)).toBe(1);
    expect(cityDrillDefenseMultiplier(40)).toBeGreaterThan(1);
    expect(cityDrillDefenseMultiplier(40)).toBeLessThan(cityDrillDefenseMultiplier(80));
    expect(cityDrillDefenseMultiplier(100)).toBeCloseTo(1.25, 5);
  });
});

describe('練度減損 — drill cuts defender casualties', () => {
  it('is 1 for raw levies and falls with drill, down to −15%', () => {
    expect(cityDrillLossMultiplier(0)).toBe(1);
    expect(cityDrillLossMultiplier(undefined)).toBe(1);
    expect(cityDrillLossMultiplier(40)).toBeLessThan(1);
    expect(cityDrillLossMultiplier(80)).toBeLessThan(cityDrillLossMultiplier(40));
    expect(cityDrillLossMultiplier(100)).toBeCloseTo(0.85, 5);
  });
});

describe('resolveBattle — basics', () => {
  it('is deterministic for a fixed RNG', () => {
    const a = side(20000, mkOfficer({ id: 'a', stats: { war: 85, leadership: 80, intelligence: 70, politics: 50, charisma: 60 } }));
    const d = side(8000, mkOfficer({ id: 'd', stats: { war: 70, leadership: 70, intelligence: 70, politics: 50, charisma: 60 } }));
    const r1 = resolveBattle(a, d, 30, seededRng(42));
    const r2 = resolveBattle(a, d, 30, seededRng(42));
    expect(r1.attackerWins).toBe(r2.attackerWins);
    expect(r1.aPower).toBeCloseTo(r2.aPower, 5);
    expect(r1.attackerLosses).toBe(r2.attackerLosses);
  });

  it('a crushing attacker reliably wins', () => {
    const a = side(60000, mkOfficer({ id: 'a', stats: { war: 95, leadership: 95, intelligence: 80, politics: 50, charisma: 70 } }));
    const d = side(3000, mkOfficer({ id: 'd', stats: { war: 55, leadership: 55, intelligence: 55, politics: 50, charisma: 50 } }));
    let wins = 0;
    for (let s = 0; s < 20; s++) {
      if (resolveBattle(a, d, 20, seededRng(s * 9 + 1)).attackerWins) wins++;
    }
    expect(wins).toBeGreaterThan(17);
  });

  it('reports symmetric power fields and casualties', () => {
    const a = side(20000, mkOfficer({ id: 'a' }));
    const d = side(15000, mkOfficer({ id: 'd' }));
    const r = resolveBattle(a, d, 25, seededRng(7));
    expect(r.aPower).toBeGreaterThan(0);
    expect(r.dPower).toBeGreaterThan(0);
    expect(r.attackerLosses).toBeGreaterThanOrEqual(0);
    expect(r.defenderLosses).toBeGreaterThanOrEqual(0);
  });
});

describe('resolveBattle — 空城計 empty fort', () => {
  it('turns a lesser attacker away from a genius holding an empty city', () => {
    const a = side(5000, mkOfficer({ id: 'a', stats: { war: 80, leadership: 70, intelligence: 60, politics: 50, charisma: 60 } }));
    const d = side(100, mkOfficer({ id: 'kongming', stats: { war: 40, leadership: 80, intelligence: 100, politics: 95, charisma: 95 } }));
    // First rng() < 0.55 triggers the bluff.
    const r = resolveBattle(a, d, 30, fixedRng(0.1));
    expect(r.attackerWins).toBe(false);
    expect(r.cityFalls).toBe(false);
    expect(r.attackerLosses).toBe(0);
  });

  it('a genius attacker is not fooled', () => {
    const a = side(5000, mkOfficer({ id: 'a', stats: { war: 80, leadership: 70, intelligence: 95, politics: 50, charisma: 60 } }));
    const d = side(100, mkOfficer({ id: 'kongming', stats: { war: 40, leadership: 80, intelligence: 100, politics: 95, charisma: 95 } }));
    const r = resolveBattle(a, d, 30, fixedRng(0.1));
    expect(r.attackerWins).toBe(true); // overwhelming force takes the empty city
  });
});

describe('resolveBattle — naval prowess', () => {
  it('a navy specialist fights stronger on the water than on land', () => {
    const navy = mkOfficer({ id: 'zhou-yu', skills: ['navy-master'], stats: { war: 80, leadership: 90, intelligence: 95, politics: 70, charisma: 85 } });
    const foe = mkOfficer({ id: 'foe', stats: { war: 80, leadership: 80, intelligence: 70, politics: 50, charisma: 60 } });

    const onWater = resolveBattle(side(20000, navy), side(20000, foe), 20, seededRng(5), { city: cityOf({ terrain: 'water', name: { zh: '赤壁', en: 'Chibi' } }) });
    const onLand = resolveBattle(side(20000, navy), side(20000, foe), 20, seededRng(5), { city: cityOf({ terrain: 'plain', name: { zh: '許都', en: 'Xuchang' } }) });

    expect(onWater.aPower).toBeGreaterThan(onLand.aPower);
  });

  it('gives no edge to a side without navy specialists', () => {
    const plain = mkOfficer({ id: 'p', stats: { war: 80, leadership: 80, intelligence: 70, politics: 50, charisma: 60 } });
    const foe = mkOfficer({ id: 'foe', stats: { war: 80, leadership: 80, intelligence: 70, politics: 50, charisma: 60 } });
    const onWater = resolveBattle(side(20000, plain), side(20000, foe), 20, seededRng(5), { city: cityOf({ terrain: 'water', name: { zh: '赤壁', en: 'Chibi' } }) });
    const onLand = resolveBattle(side(20000, plain), side(20000, foe), 20, seededRng(5), { city: cityOf({ terrain: 'plain', name: { zh: '許都', en: 'Xuchang' } }) });
    expect(onWater.aPower).toBeCloseTo(onLand.aPower, 5);
  });

  it('grants navy-master no edge on land (water-only skill)', () => {
    const stats = { war: 80, leadership: 80, intelligence: 70, politics: 50, charisma: 60 };
    const navy = mkOfficer({ id: 'a', skills: ['navy-master'], stats });
    const plain = mkOfficer({ id: 'a', skills: [], stats });
    const foe = () => side(20000, mkOfficer({ id: 'foe', stats }));
    const land = { city: cityOf({ terrain: 'plain', name: { zh: '許都', en: 'Xuchang' } }) };
    const withNavy = resolveBattle(side(20000, navy), foe(), 20, seededRng(5), land);
    const noNavy = resolveBattle(side(20000, plain), foe(), 20, seededRng(5), land);
    expect(withNavy.aPower).toBeCloseTo(noNavy.aPower, 5);
  });
});

describe('siegeBuildingModifiers — conditional defence buildings', () => {
  const eff = (id: DefenseBuildingId, level = 3) =>
    aggregateSlotEffects([{ slot: 0, buildingId: id, level }]);
  const base = { water: false, mountain: false, attackerCavalry: false };

  it('鐵索 naval defence applies on water only', () => {
    const chains = eff('iron-chains');
    expect(siegeBuildingModifiers(chains, { ...base, water: true }).defenseBonus).toBeGreaterThan(0);
    expect(siegeBuildingModifiers(chains, base).defenseBonus).toBe(0);
  });

  it('兵舍 adds a standing garrison', () => {
    expect(siegeBuildingModifiers(eff('barracks-out'), base).garrisonBonus).toBeGreaterThan(0);
  });

  it('拒馬 blunts a cavalry-led assault only', () => {
    const caltrops = eff('caltrops');
    expect(siegeBuildingModifiers(caltrops, { ...base, attackerCavalry: true }).attackerPowerMul).toBeLessThan(1);
    expect(siegeBuildingModifiers(caltrops, base).attackerPowerMul).toBe(1);
  });

  it('落石/箭台 power up the defender in the passes only', () => {
    const rock = eff('rockfall');
    expect(siegeBuildingModifiers(rock, { ...base, mountain: true }).defenderPowerMul).toBeGreaterThan(1);
    expect(siegeBuildingModifiers(rock, base).defenderPowerMul).toBe(1);
  });
});
