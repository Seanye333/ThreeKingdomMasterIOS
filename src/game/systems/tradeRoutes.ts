import type { City, EntityId, ReportEntry, TradeRoute } from '../types';
import { citySpecialty, producerWeight, CITY_SPECIALTY, type SpecialtyId } from '../data/specialties';

/** A good's "rarity weight" — its trade premium, so rarer goods ride richer. */
function rarityWeight(s: { goldMul: number; foodMul: number }): number {
  return 1 + 3 * ((s.goldMul - 1) + (s.foodMul - 1));
}

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
      // Complementary goods (two different specialties) trade richest; rarer and
      // better-developed goods ride richer still (遠物為貴 / 名產作坊).
      const base = sa && sb ? (sa.id === sb.id ? 35 : 75) : 40;
      const fa = sa ? rarityWeight(sa) * producerWeight(c.specialtyDev ?? 0) : 1;
      const fb = sb ? rarityWeight(sb) * producerWeight(b.specialtyDev ?? 0) : 1;
      const income = Math.round(base * ((fa + fb) / 2));
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

/**
 * 名物萃京 — the demand side. Famous goods are worth most carried far and sold
 * at a great market, so the more DISTINCT signature goods a realm funnels to its
 * seat (互通有無 + 遠物為貴), the richer the capital's central trade each season.
 * Scales super-linearly in variety (rewards a broad empire), linearly in raw
 * producers, and with their development. Returns gold to credit to the capital.
 */
export function specialtyEntrepotIncome(
  cities: Record<EntityId, City>,
  forceId: EntityId | null,
): number {
  if (!forceId) return 0;
  const kinds = new Set<SpecialtyId>();
  let producerScore = 0;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== forceId || c.ruined) continue;
    const sid = CITY_SPECIALTY[c.id];
    if (!sid) continue;
    kinds.add(sid);
    producerScore += producerWeight(c.specialtyDev ?? 0);
  }
  const d = kinds.size;
  if (d === 0) return 0;
  return Math.round(d * 40 + d * d * 6 + producerScore * 8);
}
