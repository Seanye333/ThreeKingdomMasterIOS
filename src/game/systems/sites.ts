import type { City, EntityId, ReportEntry, WildSite } from '../types';
import { RESOURCE_SITE_DEFS } from '../data/sites';

export interface SiteTickInput {
  sites: Record<EntityId, WildSite>;
  cities: Record<EntityId, City>;
  rng: () => number;
}

export interface SiteTickOutput {
  cities: Record<EntityId, City>;
  entries: ReportEntry[];
}

/** Pick the guard city owned by `forceId`, else any guard city, else null. */
function routeCity(
  site: WildSite,
  cities: Record<EntityId, City>,
  forceId: EntityId | null,
): City | null {
  let fallback: City | null = null;
  for (const gid of site.guards) {
    const c = cities[gid];
    if (!c) continue;
    if (forceId && c.ownerForceId === forceId) return c;
    if (!fallback) fallback = c;
  }
  return fallback;
}

/**
 * 野外據點歲入與寇掠 — once per season:
 *  - a held resource deposit pays gold (or remounts) into its holder's
 *    nearest owned guard city;
 *  - a still-hostile bandit nest may sack one of its neighbouring owned
 *    cities, costing gold + troops.
 * Pure: returns patched cities + report entries; the caller commits them.
 */
export function tickWildSites(input: SiteTickInput): SiteTickOutput {
  const cities = { ...input.cities };
  const entries: ReportEntry[] = [];

  for (const site of Object.values(input.sites)) {
    // ── Resource income ──
    if (site.subtype === 'resource' && site.ownerForceId) {
      const def = RESOURCE_SITE_DEFS[site.variant];
      if (!def) continue;
      const target = routeCity(site, cities, site.ownerForceId);
      if (!target || target.ownerForceId !== site.ownerForceId) continue;
      cities[target.id] = {
        ...target,
        gold: target.gold + def.goldPerSeason,
        troops: target.troops + def.troopsPerSeason,
      };
      entries.push({
        cityId: target.id,
        kind: 'income',
        text: `${site.name.en} yields ${def.goldPerSeason}g${def.troopsPerSeason ? ` + ${def.troopsPerSeason} troops` : ''} to ${target.name.en}.`,
        textZh: `${site.name.zh}歲入 ${def.goldPerSeason} 金${def.troopsPerSeason ? `、${def.troopsPerSeason} 兵` : ''}入${target.name.zh}。`,
      });
      continue;
    }

    // ── Bandit raids ──
    if (site.subtype === 'bandit' && site.hostile && !site.ownerForceId) {
      // Restless nests strike roughly every 2–3 seasons.
      if (input.rng() > 0.4) continue;
      const owned = site.guards
        .map((gid) => cities[gid])
        .filter((c): c is City => !!c && c.ownerForceId !== null);
      if (owned.length === 0) continue;
      const victim = owned[Math.floor(input.rng() * owned.length)];
      const goldLoot = Math.min(victim.gold, Math.floor(site.strength * 0.05 + input.rng() * 120));
      const troopLoss = Math.min(victim.troops, Math.floor(site.strength * 0.08 + input.rng() * 200));
      cities[victim.id] = {
        ...victim,
        gold: victim.gold - goldLoot,
        troops: victim.troops - troopLoss,
      };
      entries.push({
        cityId: victim.id,
        kind: 'tribe-raid',
        text: `${site.name.en} raided ${victim.name.en}: −${goldLoot}g, −${troopLoss} troops.`,
        textZh: `${site.name.zh}出寨劫掠${victim.name.zh}:損 ${goldLoot} 金、${troopLoss} 兵。`,
      });
    }
  }

  return { cities, entries };
}
