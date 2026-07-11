import { describe, it, expect } from 'vitest';
import { assignShipClass, shipPowerMul, attackUnits, endTurn } from './tactical';
import { setupTacticalBattle } from './tacticalSetup';
import { applyStratagem } from './tacticalSchemes';
import { mkOfficer, mkUnit, mkBattle, officerMap, fixedRng } from '../../test/factories';

describe('assignShipClass', () => {
  it('gives the commander the flagship and scales others by size', () => {
    expect(assignShipClass(5000, true)).toBe('flagship');
    expect(assignShipClass(7000, false)).toBe('da-yi');
    expect(assignShipClass(500, false)).toBe('zou-ge');
    expect(assignShipClass(3000, false)).toBe('warship');
    expect(assignShipClass(2000, false)).toBe('ge-chuan');
  });
});

describe('shipPowerMul', () => {
  it('rewards bigger hulls and is bounded', () => {
    expect(shipPowerMul('flagship')).toBeGreaterThan(shipPowerMul('warship'));
    expect(shipPowerMul('warship')).toBeGreaterThan(shipPowerMul('zou-ge'));
    expect(shipPowerMul('da-yi')).toBeLessThanOrEqual(1.6);
    expect(shipPowerMul('zou-ge')).toBeGreaterThanOrEqual(0.85);
    expect(shipPowerMul(undefined)).toBe(1);
  });
});

describe('setupTacticalBattle — naval detection', () => {
  const battle = setupTacticalBattle({
    cityId: 'test-open-water-xyz',
    width: 12,
    height: 8,
    attackerForceId: 'A',
    defenderForceId: 'D',
    attackers: [
      { officer: mkOfficer({ id: 'a1' }), troops: 8000 },
      { officer: mkOfficer({ id: 'a2' }), troops: 1000 },
    ],
    defenders: [{ officer: mkOfficer({ id: 'd1' }), troops: 6000 }],
    terrainHint: { terrain: 'water' },
  });

  it('flags the battle naval and crews every unit as a ship', () => {
    expect(battle.naval).toBe(true);
    for (const u of battle.units) {
      expect(u.unitType).toBe('navy');
      expect(u.shipClass).toBeTruthy();
    }
    const commander = battle.units.find((u) => u.isCommander && u.side === 'attacker');
    expect(commander!.shipClass).toBe('flagship');
  });

  it('generates an open-water board (mostly river)', () => {
    const river = battle.tiles.filter((t) => t.terrain === 'river').length;
    expect(river).toBeGreaterThan(battle.tiles.length * 0.6);
  });

  it('does NOT go naval on a land (plain) city', () => {
    const land = setupTacticalBattle({
      cityId: 'test-dry-plain-xyz',
      width: 10,
      height: 8,
      attackerForceId: 'A',
      defenderForceId: 'D',
      attackers: [{ officer: mkOfficer({ id: 'la1' }), troops: 5000 }],
      defenders: [{ officer: mkOfficer({ id: 'ld1' }), troops: 5000 }],
      terrainHint: { terrain: 'plain' },
    });
    expect(land.naval).toBeUndefined();
    expect(land.units.every((u) => u.shipClass === undefined)).toBe(true);
  });
});

function navalPair(stratagemReady = true) {
  const a = mkUnit({
    id: 'attacker-a', officerId: 'oa', side: 'attacker', coord: { col: 2, row: 2 },
    unitType: 'navy', shipClass: 'warship', troops: 5000, maxTroops: 5000,
  });
  const d = mkUnit({
    id: 'defender-d', officerId: 'od', side: 'defender', coord: { col: 3, row: 2 },
    unitType: 'navy', shipClass: 'warship', troops: 8000, maxTroops: 8000,
  });
  const officers = officerMap([a, d], [
    mkOfficer({ id: 'oa', stats: { war: 85, intelligence: stratagemReady ? 80 : 40, leadership: 70, politics: 50, charisma: 60 } }),
    mkOfficer({ id: 'od', stats: { war: 70, intelligence: 60, leadership: 70, politics: 50, charisma: 60 } }),
  ]);
  const b = mkBattle({ units: [a, d], naval: true, width: 8, height: 6 });
  return { a, d, officers, b };
}

describe('naval stratagems', () => {
  it('ram damages an adjacent ship and spends all AP', () => {
    const { officers, b } = navalPair();
    const r = applyStratagem(b, 'attacker-a', 'ram', { col: 3, row: 2 }, officers);
    expect(r.ok).toBe(true);
    expect(r.battle.units.find((u) => u.id === 'defender-d')!.troops).toBeLessThan(8000);
    expect(r.battle.units.find((u) => u.id === 'attacker-a')!.ap).toBe(0);
  });

  it('board crashes enemy morale and costs the boarder some troops', () => {
    const { officers, b } = navalPair();
    const r = applyStratagem(b, 'attacker-a', 'board', { col: 3, row: 2 }, officers);
    expect(r.ok).toBe(true);
    const def = r.battle.units.find((u) => u.id === 'defender-d')!;
    const atk = r.battle.units.find((u) => u.id === 'attacker-a')!;
    expect(def.morale).toBeLessThanOrEqual(100 - 35);
    expect(def.troops).toBeLessThan(8000);
    expect(atk.troops).toBeLessThan(5000); // took some casualties storming the deck
  });

  it('fireships set a fire and need INT 65', () => {
    const ok = navalPair(true);
    const r = applyStratagem(ok.b, 'attacker-a', 'fire-ship', { col: 3, row: 2 }, ok.officers);
    expect(r.ok).toBe(true);
    expect(r.battle.units.find((u) => u.id === 'defender-d')!.effects.some((e) => e.kind === 'burning')).toBe(true);

    const dim = navalPair(false); // INT 40 commander
    const r2 = applyStratagem(dim.b, 'attacker-a', 'fire-ship', { col: 3, row: 2 }, dim.officers);
    expect(r2.ok).toBe(false);
  });
});

describe('fire is death on the water (赤壁)', () => {
  it('a burning ship loses far more than a burning land unit', () => {
    const cmdA = mkUnit({ id: 'attacker-cmd', officerId: 'ca', side: 'attacker', isCommander: true, coord: { col: 0, row: 0 } });
    const cmdD = mkUnit({ id: 'defender-cmd', officerId: 'cd', side: 'defender', isCommander: true, coord: { col: 7, row: 5 } });
    const ship = mkUnit({
      id: 'defender-ship', officerId: 'ds', side: 'defender', coord: { col: 7, row: 0 },
      unitType: 'navy', shipClass: 'warship', troops: 10000, maxTroops: 10000,
      effects: [{ kind: 'burning', turnsLeft: 3 }],
    });
    const foot = mkUnit({
      id: 'defender-foot', officerId: 'df', side: 'defender', coord: { col: 0, row: 5 },
      unitType: 'infantry', troops: 10000, maxTroops: 10000,
      effects: [{ kind: 'burning', turnsLeft: 3 }],
    });
    const b = mkBattle({ units: [cmdA, cmdD, ship, foot], width: 9, height: 7, naval: true });
    const after = endTurn(b);
    const shipLoss = 10000 - after.units.find((u) => u.id === 'defender-ship')!.troops;
    const footLoss = 10000 - after.units.find((u) => u.id === 'defender-foot')!.troops;
    expect(shipLoss).toBeGreaterThan(footLoss);
  });
});

describe('hull strength feeds melee damage', () => {
  it('a flagship out-hits a skiff with the same crew', () => {
    const target = () =>
      mkUnit({ id: 'defender-t', officerId: 'ot', side: 'defender', coord: { col: 1, row: 0 }, troops: 100000, maxTroops: 100000, unitType: 'navy' });
    const hit = (shipClass: 'flagship' | 'zou-ge') => {
      const a = mkUnit({ id: 'attacker-a', officerId: 'oa', side: 'attacker', coord: { col: 0, row: 0 }, troops: 4000, unitType: 'navy', shipClass });
      const d = target();
      const b = mkBattle({ units: [a, d], naval: true, width: 6, height: 4 });
      const after = attackUnits(b, 'attacker-a', 'defender-t', officerMap([a, d]), fixedRng(0.5));
      return 100000 - after.units.find((u) => u.id === 'defender-t')!.troops;
    };
    expect(hit('flagship')).toBeGreaterThan(hit('zou-ge'));
  });
});

describe('借東風 — borrow-wind turns the sky', () => {
  it('on a successful rite, sets weather to wind blowing from the caster toward the enemy', () => {
    const caster = mkUnit({ id: 'me', side: 'attacker', coord: { col: 1, row: 3 }, officerId: 'zhuge' });
    const foe = mkUnit({ id: 'them', side: 'defender', coord: { col: 4, row: 3 }, officerId: 'cao' });
    const b = mkBattle({ units: [caster, foe], naval: true, width: 8, height: 6 });
    const officers = officerMap([caster, foe], [mkOfficer({ id: 'zhuge', stats: { intelligence: 100 } })]);
    // 祭風 is now a roll (§5.4) — force success to assert the *direction* logic.
    const orig = Math.random;
    Math.random = () => 0; // always answers the prayer
    try {
      const r = applyStratagem(b, 'me', 'fire-attack', { col: 4, row: 3 }, officers, 'borrow-wind');
      expect(r.ok).toBe(true);
      expect(r.battle.weather).toBe('wind');
      expect(r.battle.windDirection).toBe('east'); // enemy sits east of the caster
    } finally {
      Math.random = orig;
    }
  });

  it('a plain fire-attack leaves the sky alone', () => {
    const caster = mkUnit({ id: 'me', side: 'attacker', coord: { col: 1, row: 3 }, officerId: 'zhuge' });
    const foe = mkUnit({ id: 'them', side: 'defender', coord: { col: 4, row: 3 }, officerId: 'cao' });
    const b = mkBattle({ units: [caster, foe], naval: true, width: 8, height: 6 });
    const officers = officerMap([caster, foe], [mkOfficer({ id: 'zhuge', stats: { intelligence: 100 } })]);
    const r = applyStratagem(b, 'me', 'fire-attack', { col: 4, row: 3 }, officers);
    expect(r.battle.windDirection).toBe('calm');
  });
});
