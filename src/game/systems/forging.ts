import { FORGE_RECIPES } from '../data/forging';
import { itemRarity, type Item } from '../data/items';
import type { EntityId } from '../types';

/* ─── 鍛造之術 — the smithing layer beyond the raw recipe table ──────────────
 *
 * Three pieces sit here as pure functions so they stay testable and the store
 * just wires them in:
 *   • forgeQualityPlus — how fine a piece a given smith turns out (born +N 精煉)
 *   • discoverableRecipe — 研發圖譜: which blueprint a foundry may learn next
 *   • dismantleYield — 熔毀: iron + gold recovered from melting an item down
 */

/** A couple of modest lv2 designs (the 七星燈 ritual array + the 斑馬符 tally —
 *  utility, not marquee 神兵) are seeded too, so a freshly-built lv2 foundry has
 *  something to make before an 巧思 tinkerer arrives to research the rest. The
 *  headline weapons (八卦戟 / 青龍 / 方天畫戟) stay locked behind 研發. */
const SEEDED_LV2_RECIPE_IDS: EntityId[] = ['recipe-qixing-deng', 'recipe-tiger-talisman'];

/** Recipes every smith knows from the outset — the cheap, low-level designs
 *  (any foundry, lv ≤1) plus the seeded lv2 pair. Higher 神兵 blueprints must be
 *  researched/discovered via 研發. */
export const STARTER_RECIPE_IDS: EntityId[] = [
  ...FORGE_RECIPES.filter((r) => r.minFoundryLevel <= 1).map((r) => r.id),
  ...SEEDED_LV2_RECIPE_IDS,
];

/**
 * 工匠手藝 — the initial refinement (+N 神品) a forged item is born with, set by
 * the smith presiding over the forge. A sharp mind (高智) turns out finer work;
 * an 巧思 tinkerer guarantees at least a fine piece; an arms bureau
 * (refineUpgradeChance) widens the odds of a masterwork. Capped at +3 so a fresh
 * forge can't outrun hand-refining (REFINE_MAX 5). Returns 0..3.
 */
export function forgeQualityPlus(input: {
  smithIntelligence: number;
  inventive: boolean;
  refineUpgradeChance: number;
  rng?: () => number;
}): number {
  const rng = input.rng ?? Math.random;
  let plus = 0;
  // Skilled hands: +1 from a capable smith, +1 more from a true master.
  if (input.smithIntelligence >= 75) plus += 1;
  if (input.smithIntelligence >= 92) plus += 1;
  // 巧思 — a born tinkerer never turns out a plain piece.
  if (input.inventive) plus = Math.max(plus, 1);
  // 神品 — a masterwork roll can temper one extra grade in.
  const chance = (input.inventive ? 0.18 : 0.06) + input.refineUpgradeChance;
  if (rng() < chance) plus += 1;
  plus = Math.min(3, plus);
  // 神品暴擊 — a rare flash of inspiration at the anvil tempers a 4th grade in,
  // beyond the normal cap (capped at REFINE_MAX). The forge is no longer a sure
  // thing — every heat carries a small chance of an exceptional piece.
  if (rng() < (input.inventive ? 0.07 : 0.04)) plus = Math.min(5, plus + 1);
  return plus;
}

/**
 * 研發圖譜 — pick one not-yet-known recipe that a foundry of the given level can
 * actually build, for a smith to puzzle out this season. You only research what
 * you could forge: candidates are gated to minFoundryLevel ≤ the foundry level.
 * Returns null when everything in reach is already known.
 */
export function discoverableRecipe(
  knownRecipes: Iterable<EntityId>,
  maxFoundryLevel: number,
  rng: () => number = Math.random,
): EntityId | null {
  const known = new Set(knownRecipes);
  const candidates = FORGE_RECIPES.filter(
    (r) => !known.has(r.id) && r.minFoundryLevel <= maxFoundryLevel,
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)].id;
}

/**
 * 熔毀 — melting a (possibly refined) item back down at a foundry recovers iron
 * and a fraction of its worth in gold, both scaled by rarity and refinement.
 * The recovered iron feeds the 鐵料自給 forging discount loop, so junk名品 stop
 * being dead weight in the藏寶池.
 */
export function dismantleYield(item: Item, plus: number): { iron: number; gold: number } {
  const r = itemRarity(item);
  const ironBase = r === 'gold' ? 320 : r === 'silver' ? 200 : 120;
  const goldBase = r === 'gold' ? 500 : r === 'silver' ? 280 : 140;
  const refineMul = 1 + 0.25 * Math.max(0, plus);
  return {
    iron: Math.round(ironBase * refineMul),
    gold: Math.round(goldBase * refineMul),
  };
}
