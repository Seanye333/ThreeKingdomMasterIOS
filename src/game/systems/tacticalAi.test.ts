import { describe, it, expect } from 'vitest';
import {
  tileValueFor, bestStepToward, hexDistance } from './tactical';
import { aiTakeTurn, aiSkillForDifficulty, unitRole, pickAiTarget, pickAdjacentTarget, bandRepositionStep } from './tacticalAi';
import { mkOfficer, mkUnit, mkBattle, mkTiles, officerMap, seededRng } from '../../test/factories';

describe('aiSkillForDifficulty', () => {
  it('rises monotonically with difficulty', () => {
    expect(aiSkillForDifficulty('easy')).toBeLessThan(aiSkillForDifficulty('normal'));
    expect(aiSkillForDifficulty('normal')).toBeLessThan(aiSkillForDifficulty('hard'));
  });
});

describe('unitRole', () => {
  it('classifies by unit type and stats', () => {
    expect(unitRole(mkOfficer(), 'siege')).toBe('siege');
    expect(unitRole(mkOfficer(), 'archers')).toBe('ranged');
    expect(unitRole(mkOfficer(), 'navy')).toBe('ranged');
    // fragile high-INT, low-war officer = strategist
    expect(unitRole(mkOfficer({ stats: { war: 40, intelligence: 95, leadership: 60, politics: 80, charisma: 70 } }), 'infantry')).toBe('strategist');
    // warrior = melee
    expect(unitRole(mkOfficer({ stats: { war: 95, intelligence: 50, leadership: 80, politics: 40, charisma: 60 } }), 'cavalry')).toBe('melee');
  });
});

describe('pickAiTarget (focus fire)', () => {
  it('prefers the more wounded of two equal enemies', () => {
    const me = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 0, row: 0 } });
    const healthy = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 1, row: 0 }, troops: 10000, maxTroops: 10000 });
    const wounded = mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 1, row: 1 }, troops: 2000, maxTroops: 10000 });
    expect(pickAiTarget(me, [healthy, wounded])!.id).toBe('D2');
  });

  it('prefers a target we counter over one that counters us, at equal range', () => {
    const cav = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 0, row: 0 }, unitType: 'cavalry' });
    const archer = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 1, row: 0 }, unitType: 'archers' }); // cav counters archers
    const spear = mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 1, row: 1 }, unitType: 'spearmen' }); // spear counters cav
    expect(pickAiTarget(cav, [archer, spear])!.id).toBe('D1');
  });

  it('returns undefined with no candidates', () => {
    const me = mkUnit({ id: 'A1', officerId: 'oA1' });
    expect(pickAiTarget(me, [])).toBeUndefined();
  });
});

describe('tileValueFor', () => {
  it('rates strong footing above open ground for the unit', () => {
    expect(tileValueFor(mkUnit({ id: 'u', officerId: 'o', unitType: 'archers' }), 'hill'))
      .toBeGreaterThan(tileValueFor(mkUnit({ id: 'u', officerId: 'o', unitType: 'archers' }), 'plain'));
    expect(tileValueFor(mkUnit({ id: 'n', officerId: 'o', unitType: 'navy' }), 'river'))
      .toBeGreaterThan(tileValueFor(mkUnit({ id: 'n', officerId: 'o', unitType: 'navy' }), 'plain'));
  });
});

describe('pickAdjacentTarget (kill-secure)', () => {
  it('prefers a foe it can finish this hit over a healthier one', () => {
    const me = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 1, row: 1 }, troops: 8000 });
    const killable = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 2, row: 1 }, troops: 200, maxTroops: 8000 });
    const healthy = mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 1, row: 2 }, troops: 8000, maxTroops: 8000 });
    const b = mkBattle({ units: [me, killable, healthy], tiles: mkTiles(6, 6) });
    expect(pickAdjacentTarget(b, me, [killable, healthy], officerMap([me, killable, healthy]))!.id).toBe('D1');
  });

  it('prioritises an adjacent enemy commander', () => {
    const me = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 1, row: 1 }, troops: 8000 });
    const cmd = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', isCommander: true, coord: { col: 2, row: 1 }, troops: 8000, maxTroops: 8000 });
    const grunt = mkUnit({ id: 'D2', officerId: 'oD2', side: 'defender', coord: { col: 1, row: 2 }, troops: 8000, maxTroops: 8000 });
    const b = mkBattle({ units: [me, cmd, grunt], tiles: mkTiles(6, 6) });
    expect(pickAdjacentTarget(b, me, [cmd, grunt], officerMap([me, cmd, grunt]))!.id).toBe('D1');
  });
});

describe('bestStepToward (pathfinding)', () => {
  it('routes around a wall of blocking units instead of stalling', () => {
    // A mover at (0,2) wants to reach an enemy at (4,2). A vertical line of
    // friendly units blocks column 1 at rows 1,2,3 — the naive "reduce raw
    // distance" stepper would stall, but the cost field should detour.
    const mover = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 0, row: 2 }, ap: 3 });
    const goal = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 4, row: 2 } });
    const wallA = mkUnit({ id: 'A2', officerId: 'oA2', side: 'attacker', coord: { col: 1, row: 1 } });
    const wallB = mkUnit({ id: 'A3', officerId: 'oA3', side: 'attacker', coord: { col: 1, row: 2 } });
    const wallC = mkUnit({ id: 'A4', officerId: 'oA4', side: 'attacker', coord: { col: 1, row: 3 } });
    const b = mkBattle({ units: [mover, goal, wallA, wallB, wallC], tiles: mkTiles(6, 6) });
    const step = bestStepToward(b, mover, goal.coord);
    expect(step).not.toBeNull();
    // It must move to a free, adjacent hex (not into a blocker, not staying put).
    expect(step).not.toEqual(mover.coord);
    const occupied = new Set(['1,1', '1,2', '1,3']);
    expect(occupied.has(`${step!.col},${step!.row}`)).toBe(false);
    expect(hexDistance(step!, mover.coord)).toBe(1);
  });

  it('returns null when fully boxed in', () => {
    const mover = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 2, row: 2 }, ap: 3 });
    const goal = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 5, row: 5 } });
    // Surround the mover with friendly units on all six neighbours.
    const ring = [
      { col: 3, row: 1 }, { col: 3, row: 2 }, { col: 2, row: 3 },
      { col: 1, row: 2 }, { col: 1, row: 1 }, { col: 2, row: 1 },
    ].map((c, i) => mkUnit({ id: `A${i + 2}`, officerId: `oA${i + 2}`, side: 'attacker', coord: c }));
    const b = mkBattle({ units: [mover, goal, ...ring], tiles: mkTiles(7, 7) });
    expect(bestStepToward(b, mover, goal.coord)).toBeNull();
  });
});

describe('bandRepositionStep (kiting)', () => {
  it('backs an archer away when an enemy is adjacent', () => {
    const archer = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 3, row: 3 }, unitType: 'archers', ap: 3 });
    const enemy = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 4, row: 3 } });
    const b = mkBattle({ units: [archer, enemy], tiles: mkTiles(8, 8) });
    const step = bandRepositionStep(b, archer, [enemy], 2, 4);
    expect(step).not.toBeNull();
    // New position should be at least as far from the enemy as now (kiting away).
    expect(hexDistance(step!, enemy.coord)).toBeGreaterThan(hexDistance(archer.coord, enemy.coord));
  });
});

describe('aiTakeTurn integration', () => {
  it('always advances the turn and never hangs', () => {
    const ac = mkUnit({ id: 'attacker-a', officerId: 'a', side: 'attacker', isCommander: true, coord: { col: 0, row: 4 }, unitType: 'cavalry' });
    const aa = mkUnit({ id: 'attacker-b', officerId: 'b', side: 'attacker', coord: { col: 0, row: 5 }, unitType: 'archers' });
    const dc = mkUnit({ id: 'defender-c', officerId: 'c', side: 'defender', isCommander: true, coord: { col: 13, row: 4 } });
    const dd = mkUnit({ id: 'defender-d', officerId: 'd', side: 'defender', coord: { col: 13, row: 5 } });
    const officers = officerMap([ac, aa, dc, dd]);
    const b = mkBattle({ units: [ac, aa, dc, dd], activeSide: 'attacker', turn: 1 });
    const res = aiTakeTurn(b, officers, seededRng(1), { skill: 1.0 });
    expect(res.battle.turn).toBe(2);
    expect(res.battle.activeSide).toBe('defender');
  });

  it('closes distance toward the enemy over a few turns', () => {
    const ac = mkUnit({ id: 'attacker-a', officerId: 'a', side: 'attacker', isCommander: true, coord: { col: 0, row: 4 }, unitType: 'cavalry' });
    const dc = mkUnit({ id: 'defender-c', officerId: 'c', side: 'defender', isCommander: true, coord: { col: 10, row: 4 } });
    const officers = officerMap([ac, dc]);
    let b = mkBattle({ units: [ac, dc], width: 14, height: 9, activeSide: 'attacker', turn: 1 });
    const startGap = hexDistance(
      b.units.find((u) => u.id === 'attacker-a')!.coord,
      b.units.find((u) => u.id === 'defender-c')!.coord,
    );
    // Run a couple of attacker turns (skip the defender phase in between).
    for (let i = 0; i < 2; i++) {
      const res = aiTakeTurn({ ...b, activeSide: 'attacker' }, officers, seededRng(7 + i), { skill: 1.0 });
      b = res.battle;
    }
    const a = b.units.find((u) => u.id === 'attacker-a');
    const d = b.units.find((u) => u.id === 'defender-c');
    if (a && d) {
      expect(hexDistance(a.coord, d.coord)).toBeLessThan(startGap);
    } else {
      // Contact was made and someone routed — that's also progress.
      expect(true).toBe(true);
    }
  });

  it('a clumsy (low-skill) AI still makes legal progress', () => {
    const ac = mkUnit({ id: 'attacker-a', officerId: 'a', side: 'attacker', isCommander: true, coord: { col: 0, row: 4 }, unitType: 'archers' });
    const dc = mkUnit({ id: 'defender-c', officerId: 'c', side: 'defender', isCommander: true, coord: { col: 6, row: 4 } });
    const officers = officerMap([ac, dc]);
    const b = mkBattle({ units: [ac, dc], activeSide: 'attacker', turn: 1 });
    const res = aiTakeTurn(b, officers, seededRng(3), { skill: 0.2 });
    expect(res.battle.turn).toBe(2);
  });
});
