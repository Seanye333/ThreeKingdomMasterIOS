/**
 * 贖俘 — the ransom market. A captured officer used to sit imprisoned forever
 * unless the captor chose to execute, free, or recruit him. Now his former
 * lord (故主), if still standing and able to pay, may buy him back each season:
 *
 *   • The home force's capital pays gold to the captor's capital.
 *   • The officer returns home — idle, at his lord's capital, loyalty restored.
 *   • If the CAPTOR is the player, the player pockets the ransom (a real reason
 *     to take prisoners rather than execute them). If the home force is the
 *     player, nothing happens here — the player spends their own gold through
 *     the normal prison UI, never automatically.
 *
 * Only AI home forces initiate, so the player's coffers are never auto-spent.
 * Background, deterministic-friendly (caller's rng); recirculates talent so the
 * realm never quietly drains its officers into permanent captivity.
 */
import type { City, EntityId, Force, Officer, ReportEntry } from '../types';

export interface AIRansomContext {
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  playerForceId: EntityId | null | undefined;
  rng: () => number;
}

export interface AIRansomOutput {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  entries: ReportEntry[];
}

/** Rough worth of an officer as a ransom — abler captives cost more to recover. */
function ransomPrice(o: Officer): number {
  const best = Math.max(o.stats.war, o.stats.leadership, o.stats.intelligence, o.stats.politics);
  return Math.round(300 + best * 12); // ~660 for a 30-stat, ~1500 for a 96-stat
}

export function resolveAIRansoms(ctx: AIRansomContext): AIRansomOutput {
  const officers = { ...ctx.officers };
  const cities = { ...ctx.cities };
  const entries: ReportEntry[] = [];

  const liveForce = (id: EntityId | null | undefined): boolean =>
    !!id && Object.values(cities).some((c) => c.ownerForceId === id);

  for (const o of Object.values(ctx.officers)) {
    if (o.status !== 'imprisoned') continue;
    const home = o.capturedFromForceId;
    if (!home || !liveForce(home)) continue;          // no lord left to pay
    if (home === ctx.playerForceId) continue;          // never auto-spend player's gold
    const where = o.locationCityId ? cities[o.locationCityId] : null;
    const captor = where?.ownerForceId;
    if (!captor || captor === home) continue;          // not actually held by an enemy

    // The home force pays from its richest city; the captor banks it at the
    // city that holds the prisoner.
    const homeCities = Object.values(cities).filter((c) => c.ownerForceId === home).sort((a, b) => b.gold - a.gold);
    const purse = homeCities[0];
    if (!purse) continue;
    const price = ransomPrice(o);
    if (purse.gold < price) continue;                  // can't afford him this season

    // A lord ransoms back his abler men eagerly, lets lesser ones languish.
    const best = Math.max(o.stats.war, o.stats.leadership, o.stats.intelligence, o.stats.politics);
    const eagerness = 0.08 + Math.max(0, best - 60) * 0.006; // ~8% for mediocre, ~30% for a star
    if (ctx.rng() >= eagerness) continue;

    // Transfer the silver and bring the officer home.
    cities[purse.id] = { ...purse, gold: purse.gold - price };
    cities[where!.id] = { ...cities[where!.id], gold: cities[where!.id].gold + price };
    const homeForce = ctx.forces[home];
    officers[o.id] = {
      ...o,
      status: 'idle',
      forceId: home,
      locationCityId: homeForce?.capitalCityId ?? purse.id,
      loyalty: Math.max(o.loyalty, 70),
      capturedFromForceId: undefined,
      task: null,
    };

    // Surface it to the player only when they're the beneficiary captor.
    if (captor === ctx.playerForceId) {
      entries.push({
        cityId: where!.id,
        kind: 'income',
        text: `${homeForce?.name.en ?? 'A rival'} ransoms ${o.name.en} back for ${price} gold.`,
        textZh: `${homeForce?.name.zh ?? '敵國'}以 ${price} 金贖回${o.name.zh}。`,
      });
    }
  }

  return { officers, cities, entries };
}
