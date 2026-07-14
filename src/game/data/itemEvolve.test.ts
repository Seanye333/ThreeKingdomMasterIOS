import { describe, it, expect, afterEach } from 'vitest';
import {
  liveItem, canEvolveItem, setEvolvedRegistry, itemIsEvolved,
  setBreakthroughRegistry, setLoreRegistry, ITEMS_BY_ID, EVOLVE_LORE_REQ, EVOLVE_EFFECT_BOOST,
  itemWearPenaltyMul, whetCost, WEAR_BITE,
  type Item,
} from './items';

const GOLD_ID = 'imperial-seal'; // a gold-rarity treasure

afterEach(() => { setEvolvedRegistry([]); setBreakthroughRegistry({}); setLoreRegistry({}); });

describe('器魂進化 — evolved live item', () => {
  it('an awakened spirit surges every effect and appends ·神 to the name', () => {
    const item: Item = { id: 't', name: { zh: '青龍偃月刀', en: 'Green Dragon' }, kind: 'weapon', effects: { war: 20 } } as Item;
    const plain = liveItem(item, 0, 0, [], 0, [], false);
    const evolved = liveItem(item, 0, 0, [], 0, [], true);
    expect(evolved.name.zh).toBe('青龍偃月刀·神');
    expect(evolved.name.en).toContain('Ascended');
    expect(evolved.effects.war).toBe(20 + Math.round(20 * EVOLVE_EFFECT_BOOST));
    expect(plain.effects.war).toBe(20);
  });
});

describe('耗損保養 — wear', () => {
  it('nothing bites below the threshold; past it, down to −6% at 100', () => {
    expect(itemWearPenaltyMul(0)).toBe(1);
    expect(itemWearPenaltyMul(WEAR_BITE)).toBe(1);
    expect(itemWearPenaltyMul(80)).toBeCloseTo(1 - (80 - WEAR_BITE) * 0.0015, 5);
    expect(itemWearPenaltyMul(100)).toBeCloseTo(0.94, 5); // capped at −6%
    expect(itemWearPenaltyMul(1000)).toBeCloseTo(0.94, 5);
  });

  it('a worn blade in liveItem bites softer; a keen one is untouched', () => {
    const item: Item = { id: 't', name: { zh: 'x', en: 'x' }, kind: 'weapon', effects: { war: 40 } } as Item;
    expect(liveItem(item, 0, 0, [], 0, [], false, 0).effects.war).toBe(40); // keen
    const worn = liveItem(item, 0, 0, [], 0, [], false, 100);
    expect(worn.effects.war).toBe(Math.round(40 * 0.94));
  });

  it('whet cost scales with the wear undone', () => {
    expect(whetCost(0)).toBe(0);
    expect(whetCost(100)).toBe(800);
    expect(whetCost(50)).toBe(400);
  });
});

describe('器魂進化 — the gate', () => {
  it('needs a gold ★5 名器, and only once', () => {
    // Fresh gold item — not yet at the bar.
    expect(canEvolveItem(GOLD_ID).ok).toBe(false);
    setBreakthroughRegistry({ [GOLD_ID]: 5 });
    expect(canEvolveItem(GOLD_ID).ok).toBe(false); // still needs 名器 renown
    setLoreRegistry({ [GOLD_ID]: EVOLVE_LORE_REQ });
    expect(canEvolveItem(GOLD_ID).ok).toBe(true);
    // Once awakened, the gate closes.
    setEvolvedRegistry([GOLD_ID]);
    expect(itemIsEvolved(GOLD_ID)).toBe(true);
    expect(canEvolveItem(GOLD_ID).ok).toBe(false);
  });

  it('a non-gold item can never awaken', () => {
    const notGold = Object.values(ITEMS_BY_ID).find((i) => i.id !== GOLD_ID);
    // Pick any non-gold piece by not meeting rarity — most commons are bronze/silver.
    const bronzeId = Object.values(ITEMS_BY_ID).find((i) => canEvolveItem(i.id).reasonZh === '唯神兵可醒器魂')?.id;
    expect(bronzeId).toBeTruthy();
    expect(canEvolveItem(bronzeId!).ok).toBe(false);
    void notGold;
  });
});
