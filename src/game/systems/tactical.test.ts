import { describe, it, expect } from 'vitest';
import {
  hexDistance,
  hexNeighbours,
  counterMultiplier,
  terrainDamageMod,
  defenderTerrainShield,
  inferUnitType,
  moveCost,
  canMove,
  canAttack,
  moveUnit,
  breakGate,
  attackUnits,
  endTurn,
  resolveBattleEnd,
  computeSlotPositions,
  findPath,
  moveUnitAlong,
  reachableHexes,
} from './tactical';
import { mkOfficer, mkUnit, mkBattle, mkTiles, officerMap, fixedRng } from '../../test/factories';

describe('hex geometry', () => {
  it('distance to self is 0 and to a neighbour is 1', () => {
    const c = { col: 3, row: 3 };
    expect(hexDistance(c, c)).toBe(0);
    for (const n of hexNeighbours(c)) expect(hexDistance(c, n)).toBe(1);
  });

  it('neighbour relation is symmetric', () => {
    const c = { col: 4, row: 2 };
    for (const n of hexNeighbours(c)) {
      const back = hexNeighbours(n);
      expect(back.some((b) => b.col === c.col && b.row === c.row)).toBe(true);
    }
  });

  it('gives every hex exactly six neighbours', () => {
    expect(hexNeighbours({ col: 5, row: 5 })).toHaveLength(6);
    expect(hexNeighbours({ col: 4, row: 4 })).toHaveLength(6);
  });
});

describe('unit-type counters (RPS)', () => {
  it('spearmen beat cavalry beat archers beat spearmen', () => {
    expect(counterMultiplier('spearmen', 'cavalry')).toBeGreaterThan(1);
    expect(counterMultiplier('cavalry', 'archers')).toBeGreaterThan(1);
    expect(counterMultiplier('archers', 'spearmen')).toBeGreaterThan(1);
    // reverse direction is a penalty
    expect(counterMultiplier('cavalry', 'spearmen')).toBeLessThan(1);
    expect(counterMultiplier('archers', 'cavalry')).toBeLessThan(1);
    expect(counterMultiplier('spearmen', 'archers')).toBeLessThan(1);
  });

  it('infantry is neutral both ways', () => {
    expect(counterMultiplier('infantry', 'cavalry')).toBe(1);
    expect(counterMultiplier('cavalry', 'infantry')).toBe(1);
  });
});

describe('terrain effects', () => {
  it('cavalry are strong on open ground and weak in the mountains', () => {
    expect(terrainDamageMod('cavalry', 'plain')).toBeGreaterThan(1);
    expect(terrainDamageMod('cavalry', 'mountain')).toBeLessThan(1);
  });

  it('archers shoot better from elevation', () => {
    expect(terrainDamageMod('archers', 'hill')).toBeGreaterThan(1);
  });

  it('navy dominate on rivers and flounder on land', () => {
    expect(terrainDamageMod('navy', 'river')).toBeGreaterThan(1);
    expect(terrainDamageMod('navy', 'plain')).toBeLessThan(1);
  });

  it('defensive terrain reduces incoming damage', () => {
    expect(defenderTerrainShield('gate')).toBeLessThan(1);
    expect(defenderTerrainShield('chokepoint')).toBeLessThan(1);
    expect(defenderTerrainShield('plain')).toBe(1);
  });
});

describe('inferUnitType', () => {
  it('reads explicit unit-type skills', () => {
    expect(inferUnitType(mkOfficer({ skills: ['cavalry-master'] }))).toBe('cavalry');
    expect(inferUnitType(mkOfficer({ skills: ['navy-master'] }))).toBe('navy');
    expect(inferUnitType(mkOfficer({ skills: ['siegemaster'] }))).toBe('siege');
  });

  it('falls back to stats', () => {
    expect(inferUnitType(mkOfficer({ stats: { war: 90, leadership: 85, intelligence: 50, politics: 50, charisma: 50 } }))).toBe('spearmen');
    expect(inferUnitType(mkOfficer({ stats: { war: 40, leadership: 50, intelligence: 90, politics: 50, charisma: 50 } }))).toBe('archers');
    expect(inferUnitType(mkOfficer({ stats: { war: 40, leadership: 50, intelligence: 40, politics: 50, charisma: 50 } }))).toBe('infantry');
  });

  it('defaults to infantry when no officer', () => {
    expect(inferUnitType(undefined)).toBe('infantry');
  });
});

describe('movement rules', () => {
  it('move cost reflects terrain', () => {
    const b = mkBattle({ units: [], tiles: mkTiles(5, 5, { '1,0': 'mountain', '2,0': 'road' }) });
    expect(moveCost(b, { col: 0, row: 0 })).toBe(1); // plain
    expect(moveCost(b, { col: 1, row: 0 })).toBe(3); // mountain
  });

  it('canMove blocks occupied hexes, far hexes, and out-of-AP moves', () => {
    const mover = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 0, row: 0 }, ap: 3 });
    const blocker = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 1, row: 0 } });
    const b = mkBattle({ units: [mover, blocker], tiles: mkTiles(5, 5) });
    expect(canMove(b, mover, { col: 1, row: 0 })).toBe(false); // occupied
    expect(canMove(b, mover, { col: 3, row: 3 })).toBe(false); // not adjacent
    expect(canMove(b, { ...mover, ap: 0 }, { col: 0, row: 1 })).toBe(false); // no AP
  });

  it('moveUnit spends AP and reveals an adjacent hidden enemy', () => {
    const mover = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 0, row: 0 }, ap: 3 });
    const ambusher = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 1, row: 1 }, hidden: true });
    const b = mkBattle({ units: [mover, ambusher], tiles: mkTiles(5, 5) });
    const after = moveUnit(b, 'A1', { col: 0, row: 1 });
    const movedTo = after.units.find((u) => u.id === 'A1')!;
    expect(movedTo.coord).toEqual({ col: 0, row: 1 });
    expect(movedTo.ap).toBe(2);
    // (0,1) is adjacent to (1,1) on this grid → ambusher revealed
    expect(after.units.find((u) => u.id === 'D1')!.hidden).toBeFalsy();
  });
});

describe('gate breaking', () => {
  it('only siege units can smash a gate, turning it to plain', () => {
    const gateAt = { col: 2, row: 2 };
    const siege = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', unitType: 'siege', coord: { col: 1, row: 2 } });
    const foot = mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', unitType: 'infantry', coord: { col: 2, row: 1 } });
    const b = mkBattle({ units: [siege, foot], tiles: mkTiles(5, 5, { '2,2': 'gate' }) });
    const blocked = breakGate(b, 'A2', gateAt);
    expect(blocked.tiles.find((t) => t.coord.col === 2 && t.coord.row === 2)!.terrain).toBe('gate');
    const broken = breakGate(b, 'A1', gateAt);
    expect(broken.tiles.find((t) => t.coord.col === 2 && t.coord.row === 2)!.terrain).toBe('plain');
  });
});

describe('attackUnits', () => {
  it('rejects non-adjacent attacks', () => {
    const a = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 0, row: 0 } });
    const d = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 4, row: 4 } });
    expect(canAttack(mkBattle({ units: [a, d] }), a, d)).toBe(false);
  });

  it('deals damage, drops morale, and spends one AP', () => {
    const a = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 0, row: 0 }, troops: 2000, ap: 3 });
    const d = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 0, row: 1 }, troops: 10000 });
    const b = mkBattle({ units: [a, d], tiles: mkTiles(5, 5) });
    const after = attackUnits(b, 'A1', 'D1', officerMap([a, d]), fixedRng(0.5));
    const dAfter = after.units.find((u) => u.id === 'D1')!;
    const aAfter = after.units.find((u) => u.id === 'A1')!;
    expect(dAfter.troops).toBeLessThan(10000);
    expect(dAfter.morale).toBeLessThan(100);
    expect(aAfter.ap).toBe(2);
    expect(after.damagePopups!.length).toBeGreaterThan(0);
  });

  it('defending status reduces damage taken', () => {
    const mkPair = (defending: boolean) => {
      const a = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 0, row: 0 }, troops: 1500 });
      const d = mkUnit({
        id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 0, row: 1 }, troops: 100000,
        effects: defending ? [{ kind: 'defending', turnsLeft: 1 }] : [],
      });
      const b = mkBattle({ units: [a, d], tiles: mkTiles(5, 5) });
      return attackUnits(b, 'A1', 'D1', officerMap([a, d]), fixedRng(0.5)).units.find((u) => u.id === 'D1')!.troops;
    };
    const open = 100000 - mkPair(false);
    const braced = 100000 - mkPair(true);
    expect(braced).toBeLessThan(open);
  });
});

describe('endTurn', () => {
  it('flips the active side and advances the turn counter', () => {
    const a = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true });
    const d = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 5, row: 5 } });
    const b = mkBattle({ units: [a, d], activeSide: 'attacker', turn: 1 });
    const after = endTurn(b);
    expect(after.activeSide).toBe('defender');
    expect(after.turn).toBe(2);
  });

  it('burning units lose troops each turn', () => {
    const a = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true });
    const d = mkUnit({
      id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 5, row: 5 },
      troops: 10000, effects: [{ kind: 'burning', turnsLeft: 3 }],
    });
    const after = endTurn(mkBattle({ units: [a, d] }));
    expect(after.units.find((u) => u.id === 'D1')!.troops).toBeLessThan(10000);
  });

  it('declares the other side the winner when a commander is eliminated', () => {
    const a = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true, troops: 0 });
    const d = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 5, row: 5 } });
    const after = endTurn(mkBattle({ units: [a, d] }));
    expect(after.winner).toBe('defender');
  });

  it('logs a routed unit in the casualty tally (so deaths can be resolved)', () => {
    const a = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true, troops: 0 });
    const d = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 5, row: 5 } });
    const after = endTurn(mkBattle({ units: [a, d] }));
    expect(after.casualties?.attacker ?? []).toContain('oA1'); // the routed attacker fell
    expect(after.units.find((u) => u.id === 'A1')).toBeUndefined(); // and left the field
  });

  it('resolves a capture-supply objective once the dump is held', () => {
    const cmd = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true, coord: { col: 4, row: 4 } });
    const foe = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 9, row: 9 } });
    const after = endTurn(mkBattle({
      units: [cmd, foe],
      attackerObjective: { kind: 'capture-supply', tileCoord: { col: 4, row: 4 }, turnsRequired: 1 },
    }));
    expect(after.attackerObjective?.resolved).toBe('success');
  });

  it('counts damage to surviving units as losses (not only routed ones)', () => {
    // Attacker fielded 10000 and ends the turn bloodied but standing at 7000.
    // The old tally only counted *removed* units, so this damage was invisible.
    const a = mkUnit({
      id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true,
      troops: 7000, maxTroops: 10000,
    });
    const d = mkUnit({
      id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true,
      troops: 10000, maxTroops: 10000, coord: { col: 5, row: 5 },
    });
    const after = endTurn(mkBattle({
      units: [a, d], startTroops: { attacker: 10000, defender: 10000 },
    }));
    expect(after.attackerLosses).toBe(3000); // 10000 − 7000, not 0
  });

  it('lets a siege unit batter down an adjacent city structure (destructible)', () => {
    const siege = mkUnit({
      id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true,
      unitType: 'siege', coord: { col: 6, row: 4 },
    });
    const d = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 8, row: 8 } });
    const tower = { slotIndex: 0, buildingId: 'watchtower' as const, level: 1, coord: { col: 6, row: 5 }, hp: 150 };
    const after = endTurn(mkBattle({ units: [siege, d], cityStructures: [tower], activeSide: 'attacker' }));
    const t = after.cityStructures?.find((s) => s.slotIndex === 0);
    expect(t!.hp).toBe(0); // 200 siege batter > 150 hp → wrecked
  });
});

describe('resolveBattleEnd', () => {
  it('reports no winner while both commanders stand', () => {
    const a = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true });
    const d = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 5, row: 5 } });
    const res = resolveBattleEnd(mkBattle({ units: [a, d] }), officerMap([a, d]));
    expect(res.winner).toBeNull();
  });

  it('awards loot to the victor', () => {
    const a = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true });
    const res = resolveBattleEnd(
      mkBattle({ units: [a], winner: 'attacker', defenderLosses: 8000 }),
      officerMap([a]),
    );
    expect(res.winner).toBe('attacker');
    expect(res.lootGold).toBeGreaterThanOrEqual(0);
  });

  it('marks a fallen loser-side officer dead or captured from the casualty tally', () => {
    // The defender's officer fell during the battle: their unit was removed from
    // the field (so it's NOT in `units`) but logged in `casualties`.
    const a = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true });
    const dGhost = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender' });
    const res = resolveBattleEnd(
      mkBattle({ units: [a], winner: 'attacker', casualties: { attacker: [], defender: ['oD1'] } }),
      officerMap([a, dGhost]),
    );
    expect([...res.defenderDead, ...res.capturedOfficerIds]).toContain('oD1');
    expect(res.attackerSurvivors).toContain('oA1');
  });

  it('does not invent deaths when no casualties were logged', () => {
    const a = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', isCommander: true });
    const d = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 5, row: 5 } });
    const res = resolveBattleEnd(mkBattle({ units: [a, d], winner: 'attacker' }), officerMap([a, d]));
    expect(res.defenderDead).toHaveLength(0);
    expect(res.capturedOfficerIds).toHaveLength(0);
  });
});

describe('computeSlotPositions', () => {
  it('returns the eight compass slots inside the grid', () => {
    const slots = computeSlotPositions(14, 10);
    expect(slots).toHaveLength(8);
    for (const s of slots) {
      expect(s.col).toBeGreaterThanOrEqual(0);
      expect(s.col).toBeLessThan(14);
      expect(s.row).toBeGreaterThanOrEqual(0);
      expect(s.row).toBeLessThan(10);
    }
  });
});

describe('多步命令 — pathfinding & waypoint orders', () => {
  it('findPath returns a contiguous route ending at the destination', () => {
    const u = mkUnit({ id: 'u1', officerId: 'o1', coord: { col: 2, row: 2 } });
    const b = mkBattle({ units: [u], width: 9, height: 6 });
    const dest = { col: 5, row: 2 };
    const path = findPath(b, u, dest);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual(dest);
    let prev = u.coord;
    for (const step of path) {
      expect(hexDistance(prev, step)).toBe(1);
      prev = step;
    }
  });

  it('findPath refuses an occupied destination', () => {
    const u = mkUnit({ id: 'u1', officerId: 'o1', coord: { col: 2, row: 2 } });
    const blocker = mkUnit({ id: 'u2', officerId: 'o2', side: 'defender', coord: { col: 5, row: 2 } });
    const b = mkBattle({ units: [u, blocker], width: 9, height: 6 });
    expect(findPath(b, u, { col: 5, row: 2 })).toEqual([]);
  });

  it('moveUnitAlong walks only as far as AP allows, queuing the rest', () => {
    const u = mkUnit({ id: 'u1', officerId: 'o1', coord: { col: 0, row: 2 }, ap: 2 });
    const b = mkBattle({ units: [u], width: 9, height: 6 });
    const path = findPath(b, u, { col: 5, row: 2 }); // longer than 2 AP on plains
    const { battle, remaining } = moveUnitAlong(b, 'u1', path);
    const moved = battle.units.find((x) => x.id === 'u1')!;
    expect(moved.ap).toBe(0);
    expect(remaining.length).toBeGreaterThan(0);
    expect(remaining[remaining.length - 1]).toEqual({ col: 5, row: 2 });
  });

  it('reachableHexes covers the move range and excludes the unit and far hexes', () => {
    const u = mkUnit({ id: 'u1', officerId: 'o1', coord: { col: 0, row: 2 }, ap: 2 });
    const b = mkBattle({ units: [u], width: 12, height: 6 });
    const r = reachableHexes(b, u);
    expect(r.size).toBeGreaterThan(0);
    expect(r.has('0,2')).toBe(false);   // not its own hex
    expect(r.has('11,2')).toBe(false);  // far beyond 2 AP
  });

  it('a queued path resumes with fresh AP at the start of the side’s turn', () => {
    const startCoord = { col: 0, row: 2 };
    const dest = { col: 3, row: 2 };
    const tmp = mkUnit({ id: 'a-cmd', officerId: 'oa', coord: startCoord });
    const planned = findPath(mkBattle({ units: [tmp], width: 9, height: 6 }), tmp, dest);
    expect(planned.length).toBeGreaterThan(0);

    const cmdA = mkUnit({ id: 'a-cmd', officerId: 'oa', side: 'attacker', isCommander: true, coord: startCoord, ap: 0, path: planned });
    const cmdD = mkUnit({ id: 'd-cmd', officerId: 'od', side: 'defender', isCommander: true, coord: { col: 8, row: 2 } });
    const b = mkBattle({ units: [cmdA, cmdD], width: 9, height: 6, activeSide: 'defender' });

    const after = endTurn(b);
    expect(after.activeSide).toBe('attacker');
    const movedA = after.units.find((x) => x.id === 'a-cmd')!;
    expect(movedA.coord).toEqual(dest);   // marched the full queued route
    expect(movedA.path).toBeUndefined();  // order complete
  });

  it('does not auto-resume a march while pinned in melee', () => {
    const startCoord = { col: 1, row: 2 };
    const dest = { col: 4, row: 2 };
    const tmp = mkUnit({ id: 'a1', officerId: 'oa', coord: startCoord });
    const planned = findPath(mkBattle({ units: [tmp], width: 9, height: 6 }), tmp, dest);
    // an enemy sits adjacent to the mover at the start of its turn
    const foeCoord = hexNeighbours(startCoord)[0];
    const a1 = mkUnit({ id: 'a1', officerId: 'oa', side: 'attacker', isCommander: true, coord: startCoord, ap: 0, path: planned });
    const aCmd = mkUnit({ id: 'a-keep', officerId: 'oa2', side: 'attacker', isCommander: false, coord: { col: 0, row: 0 } });
    const dFoe = mkUnit({ id: 'd1', officerId: 'od', side: 'defender', isCommander: true, coord: foeCoord });
    const b = mkBattle({ units: [a1, aCmd, dFoe], width: 9, height: 6, activeSide: 'defender' });
    const after = endTurn(b);
    const held = after.units.find((x) => x.id === 'a1')!;
    expect(held.coord).toEqual(startCoord); // stayed to fight
    expect(held.path).toEqual(planned);     // order preserved
  });
});

describe('糧車護送 — supply convoy & 燒糧', () => {
  it('destroying a supply unit starves the side that depended on it', () => {
    const cart = mkUnit({ id: 'd-supply', officerId: 'sup', side: 'defender', isSupply: true, coord: { col: 5, row: 2 }, troops: 0 });
    const dCmd = mkUnit({ id: 'd-cmd', officerId: 'od', side: 'defender', isCommander: true, coord: { col: 7, row: 2 }, troops: 5000, morale: 80 });
    const aCmd = mkUnit({ id: 'a-cmd', officerId: 'oa', side: 'attacker', isCommander: true, coord: { col: 0, row: 2 }, troops: 5000 });
    const b = mkBattle({ units: [cart, dCmd, aCmd], width: 9, height: 6, activeSide: 'attacker' });

    const after = endTurn(b);
    expect(after.grainBurned).toBe(true);
    const d = after.units.find((u) => u.id === 'd-cmd')!;
    expect(d.morale).toBeLessThan(80);
    expect(d.effects.some((e) => e.kind === 'starving')).toBe(true);
    // the other side is unaffected
    const a = after.units.find((u) => u.id === 'a-cmd')!;
    expect(a.effects.some((e) => e.kind === 'starving')).toBe(false);
  });

  it('does not re-fire 燒糧 once grain is already burned', () => {
    const cart = mkUnit({ id: 'd-supply', officerId: 'sup', side: 'defender', isSupply: true, coord: { col: 5, row: 2 }, troops: 0 });
    const dCmd = mkUnit({ id: 'd-cmd', officerId: 'od', side: 'defender', isCommander: true, coord: { col: 7, row: 2 }, troops: 5000, morale: 50 });
    const aCmd = mkUnit({ id: 'a-cmd', officerId: 'oa', side: 'attacker', isCommander: true, coord: { col: 0, row: 2 }, troops: 5000 });
    const b = mkBattle({ units: [cart, dCmd, aCmd], width: 9, height: 6, activeSide: 'attacker', grainBurned: true });
    const after = endTurn(b);
    const d = after.units.find((u) => u.id === 'd-cmd')!;
    expect(d.effects.some((e) => e.kind === 'starving')).toBe(false); // already burned — no new penalty
  });
});
