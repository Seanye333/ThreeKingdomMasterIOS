import type { City, DiplomaticState, EntityId, Port, ReportEntry, TradeRoute } from '../types';
import { citySpecialty, producerWeight, specialtyClass, SPECIALTY_CLASS, CITY_SPECIALTY, type SpecialtyId, type SpecialtyClass } from '../data/specialties';
import { getRelation } from '../types/diplomacy';

/** A good's "rarity weight" — its trade premium, so rarer goods ride richer. */
function rarityWeight(s: { goldMul: number; foodMul: number }): number {
  return 1 + 3 * ((s.goldMul - 1) + (s.foodMul - 1));
}

/** Below this, a disaffected district turns lawless and bandits prey on the road. */
const BANDIT_LOYALTY = 40;
/** A neighbouring force this sour (or worse) is a war risk that throttles the road. */
const HOSTILE_SCORE = -25;

/** 兵燹 — does an enemy stronghold sit by this city's roads? (war-soured neighbour) */
function bordersHostile(
  city: City,
  cities: Record<EntityId, City>,
  diplomacy: DiplomaticState,
): boolean {
  const owner = city.ownerForceId;
  if (!owner) return false;
  for (const adjId of city.adjacentCityIds ?? []) {
    const n = cities[adjId];
    if (!n || !n.ownerForceId || n.ownerForceId === owner) continue;
    if (getRelation(diplomacy, owner, n.ownerForceId).score <= HOSTILE_SCORE) return true;
  }
  return false;
}

/**
 * 名產商路 — goods only earn a merchant his margin once they MOVE. Two
 * same-owner cities trade when they are **land-adjacent** OR **sea-linked**
 * (one hop in the port graph, 漕運 — coastal cities trade by sea) and at least
 * one makes a famous product. Carrying *complementary* goods — two specialties
 * of DIFFERENT class (兵甲 ⇄ 糧, 藥材 ⇄ anything) — is the richest route of all
 * (互通有無 / 遠物為貴); two goods of the same class still trade but compete as
 * much as they complement.
 *
 * A road is not safe by default: a war-soured neighbour by either end (兵燹) or a
 * lawless, disaffected district (盜匪) throttles or stalls the caravans — a route
 * worth defending, not free money. A **驛傳 supply depot** at either end patrols
 * the road and largely keeps the takings flowing (護商). Pass `diplomacy` to
 * enable the war risk; `opts.ports` to add sea routes; `opts.securedCityIds` for
 * the depot mitigation.
 */
export function buildSpecialtyTradeRoutes(
  cities: Record<EntityId, City>,
  diplomacy?: DiplomaticState,
  opts?: { ports?: Record<string, Port>; securedCityIds?: ReadonlySet<EntityId> },
): TradeRoute[] {
  const out: TradeRoute[] = [];
  const seen = new Set<string>();
  const secured = opts?.securedCityIds;

  const addRoute = (a: City, b: City, naval: boolean) => {
    if (!a.ownerForceId || a.ruined || b.ownerForceId !== a.ownerForceId || b.ruined) return;
    const sa = citySpecialty(a.id);
    const sb = citySpecialty(b.id);
    if (!sa && !sb) return;   // nothing famous to carry → no premium route
    const key = [a.id, b.id].sort().join('::');
    if (seen.has(key)) return;
    seen.add(key);
    // 互通有無 — cross-class complementarity trades richest; same-class goods
    // (兩種糧/兩種名品) compete, so they ride at a lesser premium; a lone
    // producer selling to a plain neighbour, less still.
    let base: number;
    if (sa && sb) {
      if (sa.id === sb.id) base = 35;
      else base = specialtyClass(a.id) === specialtyClass(b.id) ? 55 : 85;
    } else base = 40;
    const fa = sa ? rarityWeight(sa) * producerWeight(a.specialtyDev ?? 0) : 1;
    const fb = sb ? rarityWeight(sb) * producerWeight(b.specialtyDev ?? 0) : 1;
    let income = base * ((fa + fb) / 2);
    if (naval) income *= 1.15; // 漕運遠販,遠物為貴
    // 商路風險 — war and banditry skim the road's takings (兵燹害商); a 驛傳 depot
    // at either end patrols the road and largely keeps it open (護商).
    const guarded = !!secured && (secured.has(a.id) || secured.has(b.id));
    let threatened = false;
    if (diplomacy && (bordersHostile(a, cities, diplomacy) || bordersHostile(b, cities, diplomacy))) {
      income *= guarded ? 0.8 : 0.45; threatened = true;
    }
    if (Math.min(a.loyalty, b.loyalty) < BANDIT_LOYALTY) {
      income *= guarded ? 0.85 : 0.7; threatened = true;
    }
    out.push({
      id: `spec-${key}`, cityAId: a.id, cityBId: b.id,
      baseIncome: Math.max(0, Math.round(income)),
      ...(threatened ? { threatened: true } : {}),
    });
  };

  // 陸路 — land-adjacent same-owner pairs.
  for (const c of Object.values(cities)) {
    if (!c.ownerForceId || c.ruined) continue;
    for (const adjId of c.adjacentCityIds ?? []) {
      const b = cities[adjId];
      if (b) addRoute(c, b, false);
    }
  }
  // 水路 — sea-linked same-owner ports (one hop in the port graph), skipping any
  // pair already joined overland.
  if (opts?.ports) {
    for (const p of Object.values(opts.ports)) {
      const a = cities[p.linkedCityId];
      if (!a) continue;
      for (const qId of p.connectedPortIds) {
        const q = opts.ports[qId];
        const b = q ? cities[q.linkedCityId] : undefined;
        if (b && b.id !== a.id) addRoute(a, b, true);
      }
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
  let threatened = 0;
  for (const r of args.routes) {
    const a = cities[r.cityAId];
    const b = cities[r.cityBId];
    if (!a || !b || a.ownerForceId == null || a.ownerForceId !== b.ownerForceId) continue;
    cities[a.id] = { ...a, gold: a.gold + r.baseIncome };
    cities[b.id] = { ...cities[b.id], gold: cities[b.id].gold + r.baseIncome };
    if (a.ownerForceId === args.playerForceId) {
      playerGold += r.baseIncome * 2;
      if (r.threatened) threatened += 1;
    }
  }
  const entries: ReportEntry[] = [];
  if (playerGold > 0) {
    // 兵燹害商 — note when war/banditry is skimming the roads, so the player feels it.
    const warn = threatened > 0 ? `(${threatened} 條因兵燹盜匪減收)` : '';
    entries.push({
      cityId: null,
      kind: 'income',
      text: `Specialty trade routes earned ${playerGold} gold${threatened > 0 ? ` (${threatened} throttled by war/banditry)` : ''}.`,
      textZh: `名產商路通商,獲利 ${playerGold} 金${warn}。`,
    });
  }
  return { cities, entries };
}

/**
 * 名物萃京 — the demand side. Famous goods are worth most carried far and sold
 * at a great market, so the more DISTINCT signature goods a realm funnels to its
 * seat (互通有無 + 遠物為貴), the richer the capital's central trade each season.
 * Scales super-linearly in variety (rewards a broad empire), linearly in raw
 * producers and with their development, and rewards **breadth of class** (a
 * 百貨萃集 market stocking all of 兵甲/糧鹽/工巧/藥石 is worth most). Returns gold
 * to credit to the capital.
 */
export function specialtyEntrepotIncome(
  cities: Record<EntityId, City>,
  forceId: EntityId | null,
): number {
  if (!forceId) return 0;
  const kinds = new Set<SpecialtyId>();
  const classes = new Set<SpecialtyClass>();
  let producerScore = 0;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== forceId || c.ruined) continue;
    const sid = CITY_SPECIALTY[c.id];
    if (!sid) continue;
    kinds.add(sid);
    classes.add(SPECIALTY_CLASS[sid]);
    producerScore += producerWeight(c.specialtyDev ?? 0);
  }
  const d = kinds.size;
  if (d === 0) return 0;
  const cd = classes.size; // 互通有無 — breadth of class (1..4)
  return Math.round(d * 40 + d * d * 6 + producerScore * 8 + cd * cd * 12);
}
