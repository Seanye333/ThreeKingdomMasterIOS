import { describe, it, expect } from 'vitest';
import { gradeCombatBonus, itemMasteryMul, gradeAuraPowerMul, enemyMoraleShock, holdsTheLine, duelFirstStrike } from './gradeCombat';
import { setLoreRegistry, type Item } from '../data/items';
import type { Officer, OfficerStats } from '../types';

function makeOfficer(stats: Partial<OfficerStats> = {}): Officer {
  const base: OfficerStats = { leadership: 50, war: 50, intelligence: 50, politics: 50, charisma: 50, ...stats };
  return {
    id: 't', name: { zh: '測', en: 'T' }, forceId: 'p',
    stats: base, skills: [], traits: [], equipment: [], xp: 0,
    loyalty: 100, status: 'idle', task: null, locationCityId: 'c1',
  } as unknown as Officer;
}

const goldItem = { id: 'x', name: { en: '', zh: '' }, kind: 'weapon', description: '', effects: { war: 10 }, rarity: 'gold' } as Item;

describe('gradeCombatBonus', () => {
  it('scales the passive with the tier, top to bottom', () => {
    const diamond = makeOfficer({ leadership: 112, war: 120, intelligence: 110, politics: 105, charisma: 110 });
    const iron = makeOfficer({ leadership: 45, war: 50, intelligence: 40, politics: 48, charisma: 42 });
    expect(gradeCombatBonus(diamond).powerMul).toBeGreaterThan(gradeCombatBonus(iron).powerMul);
    expect(gradeCombatBonus(iron).powerMul).toBe(1); // iron grants nothing
  });
});

describe('兵器駕馭 itemMasteryMul', () => {
  it('gives an elite the full effect and shortchanges an unworthy wielder', () => {
    const elite = makeOfficer({ leadership: 95, war: 97, intelligence: 90, politics: 88, charisma: 92 });
    const green = makeOfficer({ leadership: 45, war: 50, intelligence: 40, politics: 48, charisma: 42 });
    expect(itemMasteryMul(elite, goldItem)).toBe(1);
    expect(itemMasteryMul(green, goldItem)).toBeLessThan(1);
    expect(itemMasteryMul(green, goldItem)).toBeGreaterThanOrEqual(0.64);
  });
});

describe('gradeAuraPowerMul', () => {
  it('takes the best grade present and damps supporting officers', () => {
    const elite = makeOfficer({ leadership: 95, war: 97, intelligence: 90, politics: 88, charisma: 92 });
    const green = makeOfficer({ leadership: 45, war: 50, intelligence: 40, politics: 48, charisma: 42 });
    const solo = gradeAuraPowerMul([elite]);
    const pair = gradeAuraPowerMul([elite, green]);
    // The lead grade sets the floor; a green companion can't drag it below that.
    expect(pair).toBeGreaterThanOrEqual(solo);
    expect(gradeAuraPowerMul([green])).toBe(1);
  });
});

describe('人器合一 — 名器威名 eases 兵器駕馭', () => {
  it('a storied weapon performs better in a lesser hand (and never exceeds full)', () => {
    const green = makeOfficer({ leadership: 45, war: 50, intelligence: 40, politics: 48, charisma: 42 });
    setLoreRegistry({});
    const cold = itemMasteryMul(green, goldItem);
    setLoreRegistry({ x: 40 }); // 40 battles → a full grade-step of familiarity
    const storied = itemMasteryMul(green, goldItem);
    setLoreRegistry({});        // cleanup so item-id 'x' doesn't leak into other tests
    expect(storied).toBeGreaterThan(cold);
    expect(storied).toBeLessThanOrEqual(1);
  });
});

describe('品階招牌 — signature perks', () => {
  const diamond = makeOfficer({ leadership: 112, war: 120, intelligence: 110, politics: 105, charisma: 110 });
  const gold = makeOfficer({ leadership: 95, war: 97, intelligence: 90, politics: 92, charisma: 93 });
  const green = makeOfficer({ leadership: 45, war: 50, intelligence: 40, politics: 48, charisma: 42 });
  it('萬軍辟易: a 金牌+ pool shocks enemy morale, scaling with the best grade', () => {
    expect(enemyMoraleShock([green])).toBe(0);
    expect(enemyMoraleShock([gold])).toBe(4);
    expect(enemyMoraleShock([diamond, green])).toBe(8);
  });
  it('不動如山: only a 白金+ pool holds the line', () => {
    expect(holdsTheLine([gold])).toBe(false);  // 金牌 is rank 3; 白金 is 4
    expect(holdsTheLine([diamond])).toBe(true);
  });
  it('萬人敵: only 鑽石 presses a duel first-strike', () => {
    expect(duelFirstStrike(diamond)).toBe(8);
    expect(duelFirstStrike(gold)).toBe(0);
  });
  it('失威: a disgraced officer projects no 招牌 until recovered', () => {
    const shamed = { ...diamond, disgrace: 2 } as Officer;
    expect(enemyMoraleShock([shamed])).toBe(0);
    expect(holdsTheLine([shamed])).toBe(false);
    expect(duelFirstStrike(shamed)).toBe(0);
    expect(duelFirstStrike(diamond)).toBe(8); // un-disgraced still projects it
  });
});
