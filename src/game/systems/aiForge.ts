import type { Officer, City, Building, EntityId } from '../types';
import { FORGE_RECIPES } from '../data/forging';
import { ITEMS_BY_ID } from '../data/items';
import { ITEM_SETS } from '../data/itemSets';

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
const IRON_RECIPE_BY_RESULT: Record<string, typeof IRON_RECIPES[number]> = Object.fromEntries(
  IRON_RECIPES.map((r) => [r.resultItemId, r]),
);
const IRON_RESULTS = new Set(IRON_RECIPES.map((r) => r.resultItemId));
/** Collection sets the AI can fully forge itself — every member is an iron recipe
 *  (四象神甲 / 重鎧鐵衛 / 奧林帕斯 / 異域奇兵 …). The AI assembles these on a champion. */
const AI_FORGE_SETS = ITEM_SETS.filter((s) => s.members.every((m) => IRON_RESULTS.has(m)));

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
    const forgeable = (id: string) => {
      const r = IRON_RECIPE_BY_RESULT[id];
      return !!r && r.minFoundryLevel <= level && !inPlay.has(id);
    };

    // Candidate champions: the force's officers stationed here, strongest first.
    const roster = Object.values(input.officers)
      .filter((o) => o.forceId === forceId && o.locationCityId === cityId && o.status !== 'dead')
      .sort((a, b) => (b.stats.war + b.stats.leadership) - (a.stats.war + a.stats.leadership));

    // Pick the first champion that yields a forgeable item, biasing toward
    // COMPLETING (or starting) an iron collection set on that one officer.
    let chosen: { officer: Officer; itemId: string } | undefined;
    for (const o of roster) {
      const owned = new Set(o.equipment);
      // (a) 補全在鑄之套 — a set this officer already has ≥1 member of, incomplete.
      const inProgress = AI_FORGE_SETS
        .map((s) => ({ s, have: s.members.filter((m) => owned.has(m)).length }))
        .filter((x) => x.have > 0 && x.have < x.s.members.length
          && x.s.members.some((m) => !owned.has(m) && forgeable(m)))
        .sort((a, b) => b.have - a.have)[0];
      if (inProgress) {
        const next = inProgress.s.members.find((m) => !owned.has(m) && forgeable(m))!;
        chosen = { officer: o, itemId: next };
        break;
      }
      // (b) 開鑄新套 — only for an officer with no forged piece yet: start a
      //     role-matched set (armor set for a marshal, weapon set for a fighter).
      if (!o.equipment.some((id) => ITEMS_BY_ID[id]?.forgeOnly)) {
        const wantArmor = o.stats.leadership > o.stats.war;
        const startSet = AI_FORGE_SETS.find((s) => {
          const first = s.members.find((m) => forgeable(m));
          if (!first) return false;
          return wantArmor ? ITEMS_BY_ID[first].kind === 'armor' : ITEMS_BY_ID[first].kind === 'weapon';
        });
        const member = startSet?.members.find((m) => forgeable(m));
        // (c) Fall back to any standalone iron piece of the right kind.
        const standalone = IRON_RECIPES.filter((r) => forgeable(r.resultItemId)
          && (wantArmor ? ITEMS_BY_ID[r.resultItemId].kind === 'armor' : ITEMS_BY_ID[r.resultItemId].kind === 'weapon'))
          .sort((x, y) => y.goldCost - x.goldCost)[0];
        const itemId = member ?? standalone?.resultItemId;
        if (itemId) { chosen = { officer: o, itemId }; break; }
      }
    }
    if (!chosen) continue;

    const recipe = IRON_RECIPE_BY_RESULT[chosen.itemId];
    const ironCost = recipe.ironCost ?? 0;
    if (city.gold < recipe.goldCost || (city.iron ?? 0) < ironCost) continue;
    actions.push({ forceId, cityId, officerId: chosen.officer.id, itemId: chosen.itemId, goldCost: recipe.goldCost, ironCost });
    inPlay.add(chosen.itemId); // reserve so two forces don't claim the same id
  }
  return actions;
}
