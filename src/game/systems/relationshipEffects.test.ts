import { describe, it, expect } from 'vitest';
import {
  sidePoolRelationshipBonus,
  griefOnDeath,
  deepenBonds,
  camaraderieLoyaltyDelta,
  swornAcrossLinesPenalty,
  runtimeFeudPair,
  swornDepth,
  cliqueBackingBoost,
  loyaltyFloor,
} from './relationshipEffects';
import type { OathBond } from '../data/bonds';
import { mkOfficer } from '../../test/factories';
import { pairKey } from '../types/diplomacy';

const off = (id: string, over = {}) => mkOfficer({ id, forceId: 'F', status: 'idle', ...over });

const sworn = (a: string, b: string, depth: 1 | 2 | 3 = 1): OathBond =>
  ({ officerA: a, officerB: b, floor: 90, kind: 'sibling', label: `${a}-${b}`, depth, sharedSeasons: 0 });
const feud = (a: string, b: string): OathBond =>
  ({ officerA: a, officerB: b, floor: 0, kind: 'feud', label: `${a}⚔${b}`, depth: 1, sharedSeasons: 0 });

describe('sidePoolRelationshipBonus — graded rapport + feud', () => {
  it('graded warmth lifts power; graded coldness drops it — but never below the AI-safe floor', () => {
    const pool = [off('a'), off('b')];
    const warm = sidePoolRelationshipBonus(pool, [], [], { [pairKey('a', 'b')]: 100 });
    const cold = sidePoolRelationshipBonus(pool, [], [], { [pairKey('a', 'b')]: -100 });
    expect(warm.powerMul).toBeGreaterThan(1.0);
    expect(cold.powerMul).toBeLessThan(1.0);
    expect(cold.powerMul).toBeGreaterThanOrEqual(0.95); // never cripples a side
  });

  it('a 宿怨 in the pool penalises power and morale', () => {
    const pool = [off('a'), off('b')];
    const out = sidePoolRelationshipBonus(pool, [], [feud('a', 'b')]);
    expect(out.powerMul).toBeLessThan(1.0);
    expect(out.moraleResist).toBeLessThan(0);
  });

  it('a deeper sworn bond gives a bigger synergy than a shallow one', () => {
    const pool = [off('a'), off('b')];
    const shallow = sidePoolRelationshipBonus(pool, [], [sworn('a', 'b', 1)]);
    const deep = sidePoolRelationshipBonus(pool, [], [sworn('a', 'b', 3)]);
    expect(deep.powerMul).toBeGreaterThan(shallow.powerMul);
  });

  it('does not double-count: a bonded pair ignores its (maxed) graded rapport', () => {
    const pool = [off('a'), off('b')];
    const bondOnly = sidePoolRelationshipBonus(pool, [], [sworn('a', 'b', 2)]);
    const bondPlusRapport = sidePoolRelationshipBonus(pool, [], [sworn('a', 'b', 2)], { [pairKey('a', 'b')]: 100 });
    expect(bondPlusRapport.powerMul).toBe(bondOnly.powerMul);
  });
});

describe('griefOnDeath — runtime bonds & feud relief', () => {
  it('a fallen runtime sworn brother grieves the survivor and flags 殉義 by depth', () => {
    const grief = griefOnDeath('dead', '亡', 'Dead', [], [sworn('dead', 'x', 3)]);
    const g = grief.find((e) => e.targetId === 'x');
    expect(g).toBeDefined();
    expect(g!.delta).toBeLessThan(0);
    expect(g!.mournDepth).toBe(3);
  });

  it("a feud counterpart's death brings relief, not grief", () => {
    const grief = griefOnDeath('dead', '亡', 'Dead', [], [feud('dead', 'y')]);
    const g = grief.find((e) => e.targetId === 'y');
    expect(g).toBeDefined();
    expect(g!.delta).toBeGreaterThan(0);
  });

  it("a fallen lord's surviving 部曲 mourn when allOfficers is supplied", () => {
    const retainer = off('r', { retinueOfLordId: 'lord' });
    const grief = griefOnDeath('lord', '主', 'Lord', [], [], { r: retainer });
    const g = grief.find((e) => e.targetId === 'r');
    expect(g).toBeDefined();
    expect(g!.delta).toBeLessThan(0);
  });
});

describe('部曲 loyaltyFloor', () => {
  it('a retainer under their living original lord keeps a high floor', () => {
    const lord = off('lord');
    const retainer = off('r', { retinueOfLordId: 'lord' });
    expect(loyaltyFloor(retainer, { lord, r: retainer }, [], [])).toBeGreaterThanOrEqual(90);
  });

  it('the floor lifts once the original lord is gone', () => {
    const lord = off('lord', { status: 'dead' });
    const retainer = off('r', { retinueOfLordId: 'lord' });
    expect(loyaltyFloor(retainer, { lord, r: retainer }, [], [])).toBe(0);
  });
});

describe('deepenBonds (義結深化)', () => {
  it('advances 義交 → 義結金蘭 after enough shared seasons', () => {
    const bond = { ...sworn('a', 'b', 1), sharedSeasons: 7 };
    const officers = { a: off('a'), b: off('b') };
    const { bonds, deepened } = deepenBonds([bond], officers);
    expect(bonds[0].depth).toBe(2);
    expect(bonds[0].sharedSeasons).toBe(8);
    expect(deepened).toHaveLength(1);
  });

  it('does not deepen when the pair serve different forces', () => {
    const bond = { ...sworn('a', 'b', 1), sharedSeasons: 30 };
    const officers = { a: off('a', { forceId: 'F' }), b: off('b', { forceId: 'G' }) };
    const { bonds } = deepenBonds([bond], officers);
    expect(bonds[0].depth).toBe(1);
  });
});

describe('camaraderie loyalty + cross-line penalty', () => {
  it('warmth among peers nudges loyalty up, friction down — bounded to ±3', () => {
    const me = off('me');
    const peers = [off('p1'), off('p2')];
    const warm = camaraderieLoyaltyDelta(me, peers, { [pairKey('me', 'p1')]: 100, [pairKey('me', 'p2')]: 100 });
    const cold = camaraderieLoyaltyDelta(me, peers, { [pairKey('me', 'p1')]: -100, [pairKey('me', 'p2')]: -100 });
    expect(warm).toBeGreaterThan(0);
    expect(warm).toBeLessThanOrEqual(3);
    expect(cold).toBeLessThan(0);
    expect(cold).toBeGreaterThanOrEqual(-3);
  });

  it('facing a sworn brother across the line carries a morale penalty', () => {
    const side = [off('a')];
    const enemy = [off('b')];
    const pen = swornAcrossLinesPenalty(side, enemy, [sworn('a', 'b', 2)]);
    expect(pen).toBeLessThan(0);
  });
});

describe('cliqueBackingBoost (朋黨)', () => {
  it('high-rapport allies embolden; feuds isolate and cancel them out', () => {
    const me = off('me');
    const peers = [off('p1'), off('p2'), off('p3')];
    const allyHeavy = cliqueBackingBoost('me', peers, {
      [pairKey('me', 'p1')]: 80, [pairKey('me', 'p2')]: 70,
    });
    const isolated = cliqueBackingBoost('me', peers, {
      [pairKey('me', 'p1')]: 80, [pairKey('me', 'p2')]: -80, [pairKey('me', 'p3')]: -80,
    });
    expect(allyHeavy).toBeGreaterThan(0);
    expect(allyHeavy).toBeLessThanOrEqual(0.04);
    expect(isolated).toBe(0); // 1 ally − 2 foes → net 0
  });
});

describe('feud/depth helpers', () => {
  it('runtimeFeudPair and swornDepth read the bond list', () => {
    expect(runtimeFeudPair('a', 'b', [feud('a', 'b')])).toBe(true);
    expect(runtimeFeudPair('a', 'b', [sworn('a', 'b')])).toBe(false);
    expect(swornDepth('a', 'b', [sworn('a', 'b', 3)])).toBe(3);
    expect(swornDepth('a', 'b', [])).toBe(0);
  });
});
