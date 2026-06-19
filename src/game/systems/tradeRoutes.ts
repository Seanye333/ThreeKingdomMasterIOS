import type { City, EntityId, ReportEntry, TradeRoute } from '../types';
import { citySpecialty } from '../data/specialties';

/**
 * 名產商路 — goods only earn a merchant his margin once they MOVE. Two
 * same-owner adjacent cities trade when at least one makes a famous product;
 * carrying *different* specialties between them (鹽 ⇄ 馬, 蜀錦 ⇄ 稻米) is the
 * richest route of all (互通有無). Dormant `tradeRoutes` state finally lives.
 */
export function buildSpecialtyTradeRoutes(
  cities: Record<EntityId, City>,
): TradeRoute[] {
  const out: TradeRoute[] = [];
  const seen = new Set<string>();
  for (const c of Object.values(cities)) {
    if (!c.ownerForceId || c.ruined) continue;
    const sa = citySpecialty(c.id);
    for (const adjId of c.adjacentCityIds ?? []) {
      const b = cities[adjId];
      if (!b || b.ownerForceId !== c.ownerForceId || b.ruined) continue;
      const sb = citySpecialty(b.id);
      if (!sa && !sb) continue;   // nothing famous to carry → no premium route
      const key = [c.id, adjId].sort().join('::');
      if (seen.has(key)) continue;
      seen.add(key);
      // Complementary goods (two different specialties) trade richest.
      const income = sa && sb ? (sa.id === sb.id ? 35 : 75) : 40;
      out.push({ id: `spec-${key}`, cityAId: c.id, cityBId: adjId, baseIncome: income });
    }
  }
  return out;
}

/**
 * Credit each live route's margin to BOTH of its (same-owner) endpoints, once
 * per season. Returns patched cities + a single summary entry for the player.
 */
export function tickSpecialtyTrade(args: {
  cities: Record<EntityId, City>;
  routes: TradeRoute[];
  playerForceId: EntityId | null;
}): { cities: Record<EntityId, City>; entries: ReportEntry[] } {
  const cities = { ...args.cities };
  let playerGold = 0;
  for (const r of args.routes) {
    const a = cities[r.cityAId];
    const b = cities[r.cityBId];
    if (!a || !b || a.ownerForceId == null || a.ownerForceId !== b.ownerForceId) continue;
    cities[a.id] = { ...a, gold: a.gold + r.baseIncome };
    cities[b.id] = { ...cities[b.id], gold: cities[b.id].gold + r.baseIncome };
    if (a.ownerForceId === args.playerForceId) playerGold += r.baseIncome * 2;
  }
  const entries: ReportEntry[] = [];
  if (playerGold > 0) {
    entries.push({
      cityId: null,
      kind: 'income',
      text: `Specialty trade routes earned ${playerGold} gold.`,
      textZh: `名產商路通商,獲利 ${playerGold} 金。`,
    });
  }
  return { cities, entries };
}
