import type { Officer, City, Building, EntityId } from '../types';
import { FORGE_RECIPES } from '../data/forging';
import { ITEMS_BY_ID } from '../data/items';

export interface AiForgeAction {
  forceId: EntityId;
  cityId: EntityId;
  officerId: EntityId;
  itemId: EntityId;
  goldCost: number;
  ironCost: number;
}

const MIN_FOUNDRY_LEVEL = 2;

/** Iron-cost (repeatable, no-sacrifice) forge recipes — the AI's renewable pool.
 *  Each result is still globally unique, so a recipe is only usable while its
 *  result is not already in play. */
const IRON_RECIPES = FORGE_RECIPES.filter((r) => (r.ironCost ?? 0) > 0 && r.ingredients.length === 0);

/**
 * 敵國鑄兵 — plan one forge per AI force per call: a foundry city with the gold +
 * iron to spare arms its strongest still-unforged commander with a fresh 神兵 (a
 * weapon for a fighter, armor for a marshal). Pure — the caller applies the
 * actions (deducts resources, appends to equipment). Bounded to one per force so
 * it can run every season without runaway cost, and it respects item uniqueness
 * (never forges a result already held or lying in any city).
 */
export function planAiForging(input: {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  buildings: Building[];
  lostItems: Array<{ itemId: EntityId; cityId: EntityId }>;
  playerForceId: EntityId | null;
  rng?: () => number;
}): AiForgeAction[] {
  const rng = input.rng ?? Math.random;

  // Every item id already in play (equipped or lying loose) — uniqueness guard.
  const inPlay = new Set<EntityId>();
  for (const o of Object.values(input.officers)) for (const id of o.equipment) inPlay.add(id);
  for (const li of input.lostItems) inPlay.add(li.itemId);

  // Foundry level per city (≥ MIN_FOUNDRY_LEVEL only).
  const foundryLevel: Record<EntityId, number> = {};
  for (const b of input.buildings) {
    if (b.id === 'foundry' && b.level >= MIN_FOUNDRY_LEVEL) {
      foundryLevel[b.cityId] = Math.max(foundryLevel[b.cityId] ?? 0, b.level);
    }
  }

  const actions: AiForgeAction[] = [];
  // Group AI forces by the cities they own that have a foundry.
  const forceForges: Record<EntityId, EntityId[]> = {};
  for (const c of Object.values(input.cities)) {
    if (!c.ownerForceId || c.ownerForceId === input.playerForceId) continue;
    if (!foundryLevel[c.id]) continue;
    (forceForges[c.ownerForceId] ??= []).push(c.id);
  }

  for (const [forceId, cityIds] of Object.entries(forceForges)) {
    if (rng() > 0.5) continue; // not every force every season
    // Pick the richest foundry city this force owns.
    const cityId = cityIds
      .map((id) => input.cities[id])
      .sort((a, b) => (b.gold + (b.iron ?? 0)) - (a.gold + (a.iron ?? 0)))[0]?.id;
    if (!cityId) continue;
    const city = input.cities[cityId];
    const level = foundryLevel[cityId];

    // The force's strongest officer stationed here who holds no forged 神兵 yet.
    const officer = Object.values(input.officers)
      .filter((o) => o.forceId === forceId && o.locationCityId === cityId && o.status !== 'dead'
        && !o.equipment.some((id) => ITEMS_BY_ID[id]?.forgeOnly))
      .sort((a, b) => (b.stats.war + b.stats.leadership) - (a.stats.war + a.stats.leadership))[0];
    if (!officer) continue;

    // A marshal (lead-leaning) gets armor; a fighter gets a weapon.
    const wantArmor = officer.stats.leadership > officer.stats.war;
    const candidates = IRON_RECIPES.filter((r) => {
      if (r.minFoundryLevel > level) return false;
      if (inPlay.has(r.resultItemId)) return false;
      const it = ITEMS_BY_ID[r.resultItemId];
      return wantArmor ? it.kind === 'armor' : it.kind === 'weapon';
    });
    // Fall back to any affordable, available recipe if the preferred kind is taken.
    const pool = candidates.length > 0 ? candidates
      : IRON_RECIPES.filter((r) => r.minFoundryLevel <= level && !inPlay.has(r.resultItemId));
    const recipe = pool.sort((a, b) => b.goldCost - a.goldCost)[0]; // their best affordable
    if (!recipe) continue;
    const ironCost = recipe.ironCost ?? 0;
    if (city.gold < recipe.goldCost || (city.iron ?? 0) < ironCost) continue;

    actions.push({ forceId, cityId, officerId: officer.id, itemId: recipe.resultItemId, goldCost: recipe.goldCost, ironCost });
    inPlay.add(recipe.resultItemId); // reserve so two forces don't claim the same id
  }
  return actions;
}
