import { describe, it, expect } from 'vitest';
import { FORGE_RECIPES } from '../data/forging';
import { ITEMS_BY_ID } from '../data/items';
import {
  STARTER_RECIPE_IDS,
  forgeQualityPlus,
  discoverableRecipe,
  dismantleYield,
  smithTier,
} from './forging';

describe('STARTER_RECIPE_IDS', () => {
  it('seeds the lv≤1 recipes plus the curated lv2 pair, all valid', () => {
    expect(STARTER_RECIPE_IDS.length).toBeGreaterThan(0);
    for (const id of STARTER_RECIPE_IDS) {
      const r = FORGE_RECIPES.find((x) => x.id === id);
      expect(r).toBeTruthy();
      // Nothing above lv2 is ever seeded — marquee 神兵 stay locked behind 研發.
      expect(r!.minFoundryLevel).toBeLessThanOrEqual(2);
    }
    const starters = new Set(STARTER_RECIPE_IDS);
    // Every lv≤1 recipe is seeded.
    for (const r of FORGE_RECIPES) {
      if (r.minFoundryLevel <= 1) expect(starters.has(r.id)).toBe(true);
    }
    // The two curated lv2 utility designs are seeded.
    expect(starters.has('recipe-qixing-deng')).toBe(true);
    expect(starters.has('recipe-tiger-talisman')).toBe(true);
    // No lv3 blueprint leaks in.
    for (const r of FORGE_RECIPES) {
      if (r.minFoundryLevel >= 3) expect(starters.has(r.id)).toBe(false);
    }
  });
});

describe('forgeQualityPlus', () => {
  const noLuck = () => 0.99; // never triggers the masterwork roll
  const alwaysLuck = () => 0;

  it('a plain smith with no luck forges +0', () => {
    expect(forgeQualityPlus({ smithIntelligence: 40, inventive: false, refineUpgradeChance: 0, rng: noLuck })).toBe(0);
  });

  it('a capable smith (≥75) earns +1, a master (≥92) +2', () => {
    expect(forgeQualityPlus({ smithIntelligence: 80, inventive: false, refineUpgradeChance: 0, rng: noLuck })).toBe(1);
    expect(forgeQualityPlus({ smithIntelligence: 95, inventive: false, refineUpgradeChance: 0, rng: noLuck })).toBe(2);
  });

  it('an 巧思 tinkerer guarantees at least +1 even when dull', () => {
    expect(forgeQualityPlus({ smithIntelligence: 30, inventive: true, refineUpgradeChance: 0, rng: noLuck })).toBe(1);
  });

  it('a masterwork roll adds one grade (capped at +3 without a crit)', () => {
    // rng 0.5 clears the masterwork roll but not the rare 神品暴擊 (chance ≤ 0.07).
    expect(forgeQualityPlus({ smithIntelligence: 95, inventive: true, refineUpgradeChance: 1, rng: () => 0.5 })).toBe(3);
  });

  it('神品暴擊 — a rare crit tempers a 4th grade beyond the +3 cap', () => {
    expect(forgeQualityPlus({ smithIntelligence: 95, inventive: true, refineUpgradeChance: 1, rng: alwaysLuck })).toBe(4);
  });

  it('名匠監造 — a 神匠 widens the masterwork odds', () => {
    // A roll that misses the plain chance but lands inside a master smith's wider one.
    const rng = () => 0.14; // > 0.06 base, < 0.06+0.10 master
    expect(forgeQualityPlus({ smithIntelligence: 80, inventive: false, refineUpgradeChance: 0, rng })).toBe(1);
    expect(forgeQualityPlus({ smithIntelligence: 80, inventive: false, refineUpgradeChance: 0, masterSmith: true, rng })).toBe(2);
  });
});

describe('名匠監造 — smith tiers', () => {
  it('grades the presiding smith by wit and 巧思', () => {
    expect(smithTier(50, false).tier).toBe(0);   // 匠人
    expect(smithTier(80, false).tier).toBe(1);   // 良匠
    expect(smithTier(95, false).tier).toBe(2);   // 巧匠 (智≥92)
    expect(smithTier(60, true).tier).toBe(2);    // 巧匠 (巧思)
    expect(smithTier(92, true).tier).toBe(3);    // 神匠 (巧思 + 智≥90)
    expect(smithTier(3, true).zh).toBe('巧匠');   // inventive alone caps at 2
  });
});

describe('discoverableRecipe', () => {
  it('returns null when everything in reach is known', () => {
    const all = FORGE_RECIPES.map((r) => r.id);
    expect(discoverableRecipe(all, 3, () => 0)).toBeNull();
  });

  it('only offers recipes the foundry level can build', () => {
    const id = discoverableRecipe([], 1, () => 0);
    expect(id).toBeTruthy();
    expect(FORGE_RECIPES.find((r) => r.id === id)!.minFoundryLevel).toBeLessThanOrEqual(1);
  });

  it('a higher foundry unlocks a wider pool', () => {
    const id = discoverableRecipe(STARTER_RECIPE_IDS, 3, () => 0);
    expect(id).toBeTruthy();
    expect(STARTER_RECIPE_IDS).not.toContain(id);
  });
});

describe('forge-only weapons never duplicate findable arms', () => {
  it('every weapon a recipe produces is flagged forgeOnly', () => {
    const weaponResults = FORGE_RECIPES
      .map((r) => ITEMS_BY_ID[r.resultItemId])
      .filter((it) => it.kind === 'weapon');
    expect(weaponResults.length).toBe(120);
    for (const it of weaponResults) expect(it.forgeOnly).toBe(true);
  });

  it('鍛造甲冑 — forge-only armor exists, is iron-cost, and grants 減傷-worthy stats', () => {
    // Scope to forge-only armor (the utility 玄甲 upgrade reclassifies a *findable*
    // armor and is intentionally a sacrifice recipe, not iron-cost).
    const armor = FORGE_RECIPES
      .map((r) => ({ r, it: ITEMS_BY_ID[r.resultItemId] }))
      .filter(({ it }) => it.kind === 'armor' && it.forgeOnly);
    expect(armor.length).toBeGreaterThanOrEqual(16);
    for (const { r, it } of armor) {
      expect((r.ironCost ?? 0)).toBeGreaterThan(0);
      // armor leans defensive: leadership is its main mitigation stat.
      expect((it.effects.leadership ?? 0)).toBeGreaterThan(0);
    }
  });

  it('repeatable (empty-ingredient) recipes only ever mint forge-only results', () => {
    // The forgeItem uniqueness guard is scoped to empty-ingredient recipes; if one
    // of those produced a *findable* item it would dup it (or block the utility
    // recipes). Every empty-ingredient recipe must therefore yield a forgeOnly item.
    for (const r of FORGE_RECIPES) {
      if (r.ingredients.length === 0) {
        expect(ITEMS_BY_ID[r.resultItemId]?.forgeOnly).toBe(true);
      }
    }
  });

  it('鐵料配方 — iron-cost recipes consume iron and sacrifice no unique items', () => {
    const ironRecipes = FORGE_RECIPES.filter((r) => (r.ironCost ?? 0) > 0);
    expect(ironRecipes.length).toBeGreaterThanOrEqual(20);
    for (const r of ironRecipes) {
      expect(r.ironCost).toBeGreaterThan(0);
      // The whole point: iron is the renewable material, no finite weapons burned.
      expect(r.ingredients.length).toBe(0);
      expect(ITEMS_BY_ID[r.resultItemId]?.forgeOnly).toBe(true);
    }
  });

  it('no forgeOnly item is ever consumed as an ingredient (they only come from the forge)', () => {
    for (const r of FORGE_RECIPES) {
      for (const ing of r.ingredients) {
        expect(ITEMS_BY_ID[ing]?.forgeOnly ?? false).toBe(false);
      }
    }
  });

  it('forgeOnly arms carry a tactic / trait / formation hook (not bare stat sticks), except the entry saber', () => {
    const forgeArms = FORGE_RECIPES
      .map((r) => ITEMS_BY_ID[r.resultItemId])
      .filter((it) => it.kind === 'weapon');
    const withHook = forgeArms.filter((it) => it.grants && Object.keys(it.grants).length > 0);
    // 119 of 120 grant something; only the lv1 entry saber is a plain blade.
    expect(withHook.length).toBe(119);
  });
});

describe('dismantleYield', () => {
  it('rarer items melt into more iron + gold', () => {
    const gold = ITEMS_BY_ID[FORGE_RECIPES.find((r) => r.minFoundryLevel >= 3)!.resultItemId];
    const y0 = dismantleYield(gold, 0);
    expect(y0.iron).toBeGreaterThan(0);
    expect(y0.gold).toBeGreaterThan(0);
  });

  it('refinement scales the recovery up', () => {
    const item = ITEMS_BY_ID['green-dragon'];
    const y0 = dismantleYield(item, 0);
    const y4 = dismantleYield(item, 4);
    expect(y4.iron).toBeGreaterThan(y0.iron);
    expect(y4.gold).toBeGreaterThan(y0.gold);
  });
});
