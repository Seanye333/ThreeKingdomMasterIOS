import type {
  Building,
  BuildingId,
  City,
  EntityId,
  ReportEntry,
  TradeRoute,
} from '../types';
import { BUILDING_DEFS_BY_ID, BUILDING_CATEGORY, buildingGroupSynergy, statecraftCategoryMul } from '../data/buildings';
import { cityAffinity } from '../data/specialties';
import { PROVINCE_BY_CITY } from '../data/provinces';

/**
 * Per-season building progression: each in-progress building accrues 1
 * season of progress, and any that fill complete one level.
 */
export interface BuildingTickContext {
  buildings: Building[];
  cities: Record<EntityId, City>;
}

export interface BuildingTickOutput {
  buildings: Building[];
  entries: ReportEntry[];
}

export function tickBuildings(ctx: BuildingTickContext): BuildingTickOutput {
  const entries: ReportEntry[] = [];
  const updated = ctx.buildings.map((b) => {
    const def = BUILDING_DEFS_BY_ID[b.id];
    if (!def) return b;
    if (b.level >= def.maxLevel) return b;
    // 將作監 — a works bureau speeds buildings actively under construction in its
    // city (the base +1/season is unchanged so existing pacing is preserved).
    const speed = b.progress > 0 ? buildingBonuses(b.cityId, ctx.buildings).buildSpeed : 0;
    const nextProgress = b.progress + 1 + speed;
    if (nextProgress >= def.seasonsPerLevel) {
      const city = ctx.cities[b.cityId];
      entries.push({
        cityId: b.cityId,
        kind: 'command-success',
        text: `${def.name.en} in ${city?.name.en ?? '?'} reached level ${b.level + 1}.`,
        textZh: `${city?.name.zh ?? '?'}的${def.name.zh}達到 ${b.level + 1} 級。`,
      });
      return { ...b, level: b.level + 1, progress: 0 };
    }
    return { ...b, progress: nextProgress };
  });
  return { buildings: updated, entries };
}

/**
 * Aggregate building bonuses for a city. Returns multiplicative bonuses
 * indexed by effect category.
 */
export function buildingBonuses(
  cityId: EntityId,
  buildings: Building[],
  opts?: { statecraft?: string | null },
): {
  recruitMul: number;
  commerceMul: number;
  agricultureMul: number;
  loyaltyPerSeason: number;
  defenseAdd: number;
  xpMul: number;
  instigateResistance: number;
  troopCapMul: number;
  shipyardLevel: number;
  /** 0..~0.75 — fraction of the drought harvest penalty that is cancelled. */
  droughtMitigation: number;
  /** Additive bonus to a city's per-season population growth rate. */
  popGrowthAdd: number;
  /** Additive bonus to officer-recruit (招攬) success chance. */
  recruitOfficerBonus: number;
  /** 0..~0.6 — fraction by which enemy schemes against this city are blunted. */
  schemeResist: number;
  /** Multiplier (1+...) on convoys dispatched from this city. */
  convoyMul: number;
  /** Multiplier (1+...) on this city's foreign-trade / treaty income. */
  tradeMul: number;
  /** Extra seasons knocked off officer 養傷 each tick (field hospital). */
  woundRecovery: number;
  /** 0..~0.75 — fraction of cult-contagion loyalty erosion cancelled. */
  cultResist: number;
  /** 0..~0.4 — fraction off the gold cost of building here (works bureau). */
  buildDiscount: number;
  /** Extra construction progress per season for buildings here (works bureau). */
  buildSpeed: number;
  /** Multiplier (1+...) on rapport growth between co-stationed officers (tavern). */
  rapportMul: number;
  /** 0..~0.6 — fraction by which officer loyalty-drain / defection here is blunted. */
  defectionResist: number;
  /** 0..~0.5 — extra discount on refining items in this city (arms bureau). */
  refineDiscount: number;
  /** 0..~0.6 — chance a refine here jumps +2 levels for the price of +1. */
  refineUpgradeChance: number;
  /** Extra inflation eased per season when this is the force's capital. */
  inflationRelief: number;
  /** Additive bonus to the force's diplomacy relation-delta multiplier. */
  diploRelMul: number;
  /** Extra city defense in WATER battles fought at this city (naval yard). */
  navalPower: number;
  /** Additive bonus to espionage ops launched from this city (scout camp). */
  espionagePower: number;
  /** 0..0.6 — 常平倉/平準署 平糴平糶: flattens grain-price swings, tightens the
   *  市易 spread, and blunts large-order slippage (see market.ts MarketContext). */
  priceStability: number;
} {
  const inCity = buildings.filter((b) => b.cityId === cityId);
  // 建築群方略 — count built (level≥1) buildings per category so a cluster of
  // same-category works compounds that category's output (district set-bonus).
  const catCount: Partial<Record<string, number>> = {};
  for (const b of inCity) {
    if (b.level < 1) continue;
    const cat = BUILDING_CATEGORY[b.id];
    if (cat) catCount[cat] = (catCount[cat] ?? 0) + 1;
  }
  let recruitMul = 1;
  let commerceMul = 1;
  let agricultureMul = 1;
  let loyaltyPerSeason = 0;
  let defenseAdd = 0;
  let xpMul = 1;
  let instigateResistance = 0;
  let troopCapMul = 1;
  let shipyardLevel = 0;
  let droughtMitigation = 0;
  let popGrowthAdd = 0;
  let recruitOfficerBonus = 0;
  let schemeResist = 0;
  let convoyMul = 1;
  let tradeMul = 1;
  let woundRecovery = 0;
  let cultResist = 0;
  let buildDiscount = 0;
  let buildSpeed = 0;
  let rapportMul = 1;
  let defectionResist = 0;
  let refineDiscount = 0;
  let refineUpgradeChance = 0;
  let inflationRelief = 0;
  let diploRelMul = 0;
  let navalPower = 0;
  let espionagePower = 0;
  let priceStability = 0;
  const affinity = cityAffinity(cityId);          // 地利 — specialty-favoured category
  const school = opts?.statecraft;                 // 理念 — realm's school of statecraft
  for (const b of inCity) {
    if (b.level === 0) continue;
    const cat = BUILDING_CATEGORY[b.id];
    // Output multipliers stack: same-category synergy (建築群) × specialty
    // affinity (地利, +10%) × statecraft favour (理念, +10%). Shipyard excluded
    // (its "level" gates ship build time, not a magnitude to inflate).
    const mul = b.id === 'shipyard'
      ? 1
      : buildingGroupSynergy(catCount[cat] ?? 1)
        * (cat === affinity ? 1.1 : 1)
        * statecraftCategoryMul(school, cat);
    const l = b.level * mul;
    switch (b.id) {
      case 'barracks':
        recruitMul *= 1 + 0.1 * l;
        troopCapMul *= 1 + 0.05 * l;
        break;
      case 'market':
        commerceMul *= 1 + 0.12 * l;
        break;
      case 'foundry':
        recruitMul *= 1 + 0.08 * l;
        commerceMul *= 1 + 0.03 * l;
        break;
      case 'academy':
        xpMul *= 1 + 0.15 * l;
        break;
      case 'temple':
        loyaltyPerSeason += 2 * l;
        instigateResistance += 0.3 * l;
        break;
      case 'farm':
        agricultureMul *= 1 + 0.15 * l;
        break;
      case 'wall':
        defenseAdd += 10 * l;
        break;
      case 'shipyard':
        shipyardLevel = Math.max(shipyardLevel, l);
        break;
      case 'stable':
        recruitMul *= 1 + 0.08 * l;
        troopCapMul *= 1 + 0.08 * l;
        break;
      case 'workshop':
        defenseAdd += 6 * l;
        recruitMul *= 1 + 0.04 * l;
        break;
      case 'mint':
        commerceMul *= 1 + 0.15 * l;
        break;
      case 'arsenal':
        defenseAdd += 8 * l;
        troopCapMul *= 1 + 0.04 * l;
        break;
      case 'relay':
        commerceMul *= 1 + 0.08 * l;
        troopCapMul *= 1 + 0.04 * l;
        break;
      case 'grandacademy':
        xpMul *= 1 + 0.12 * l;
        loyaltyPerSeason += 1 * l;
        break;
      case 'barbican':
        defenseAdd += 12 * l;
        instigateResistance += 0.2 * l;
        break;
      case 'evernormal':
        agricultureMul *= 1 + 0.1 * l;
        commerceMul *= 1 + 0.05 * l;
        priceStability += 0.12 * l; // 平糴平糶 — the granary that stabilises grain prices
        break;
      case 'drillground':
        recruitMul *= 1 + 0.06 * l;
        xpMul *= 1 + 0.08 * l;
        break;
      case 'irrigation':
        agricultureMul *= 1 + 0.08 * l;
        droughtMitigation += 0.25 * l;
        break;
      case 'recruithall':
        recruitOfficerBonus += 0.08 * l;
        xpMul *= 1 + 0.06 * l;
        break;
      case 'spyoffice':
        schemeResist += 0.15 * l;
        instigateResistance += 0.2 * l;
        break;
      case 'supplydepot':
        convoyMul *= 1 + 0.15 * l;
        troopCapMul *= 1 + 0.03 * l;
        break;
      case 'civicoffice':
        popGrowthAdd += 0.004 * l;
        loyaltyPerSeason += 1 * l;
        break;
      case 'tradeoffice':
        tradeMul *= 1 + 0.1 * l;
        commerceMul *= 1 + 0.04 * l;
        break;
      case 'warschool':
        xpMul *= 1 + 0.15 * l;
        break;
      case 'quartermaster':
        troopCapMul *= 1 + 0.06 * l;
        recruitMul *= 1 + 0.03 * l;
        break;
      case 'signaltower':
        defenseAdd += 10 * l;
        instigateResistance += 0.15 * l;
        break;
      case 'fieldhospital':
        woundRecovery += 1 * l;
        loyaltyPerSeason += 1 * l;
        break;
      case 'daotemple':
        cultResist += 0.3 * l;
        loyaltyPerSeason += 1 * l;
        break;
      case 'worksbureau':
        buildDiscount += 0.1 * l;
        buildSpeed += 1 * l;
        break;
      case 'tavern':
        rapportMul *= 1 + 0.5 * l;
        loyaltyPerSeason += 1 * l;
        commerceMul *= 1 + 0.03 * l;
        break;
      case 'prison':
        defectionResist += 0.2 * l;
        instigateResistance += 0.1 * l;
        break;
      case 'pasture':
        troopCapMul *= 1 + 0.05 * l;
        recruitMul *= 1 + 0.05 * l;
        break;
      case 'library':
        xpMul *= 1 + 0.1 * l;
        instigateResistance += 0.1 * l;
        break;
      case 'beacon':
        defenseAdd += 8 * l;
        schemeResist += 0.1 * l;
        break;
      case 'armsbureau':
        refineDiscount += 0.1 * l;
        refineUpgradeChance += 0.12 * l;
        break;
      case 'pricebureau':
        inflationRelief += 2 * l;
        commerceMul *= 1 + 0.03 * l;
        priceStability += 0.08 * l; // 平準 — levels market prices alongside easing inflation
        break;
      case 'heraldhall':
        diploRelMul += 0.15 * l;
        commerceMul *= 1 + 0.03 * l;
        break;
      case 'navalyard':
        navalPower += 10 * l;
        recruitMul *= 1 + 0.03 * l;
        break;
      case 'scoutcamp':
        espionagePower += 0.1 * l;
        instigateResistance += 0.1 * l;
        break;
    }
  }
  return {
    recruitMul,
    commerceMul,
    agricultureMul,
    loyaltyPerSeason,
    defenseAdd,
    xpMul,
    instigateResistance,
    troopCapMul,
    shipyardLevel,
    droughtMitigation: Math.min(0.75, droughtMitigation),
    popGrowthAdd,
    recruitOfficerBonus,
    schemeResist: Math.min(0.6, schemeResist),
    convoyMul,
    tradeMul,
    woundRecovery,
    cultResist: Math.min(0.75, cultResist),
    buildDiscount: Math.min(0.4, buildDiscount),
    buildSpeed,
    rapportMul,
    defectionResist: Math.min(0.6, defectionResist),
    refineDiscount: Math.min(0.5, refineDiscount),
    refineUpgradeChance: Math.min(0.6, refineUpgradeChance),
    inflationRelief,
    diploRelMul,
    navalPower,
    espionagePower,
    priceStability: Math.min(0.6, priceStability),
  };
}

/**
 * Per-season trade route income. Each route generates income for both ends
 * when same-owner (or in alliance — caller decides).
 */
export function tradeRouteIncome(
  routes: TradeRoute[],
  cities: Record<EntityId, City>,
  sameSide: (a: EntityId | null, b: EntityId | null) => boolean,
): Array<{ cityId: EntityId; income: number }> {
  const out: Array<{ cityId: EntityId; income: number }> = [];
  for (const r of routes) {
    const a = cities[r.cityAId];
    const b = cities[r.cityBId];
    if (!a || !b) continue;
    if (sameSide(a.ownerForceId, b.ownerForceId)) {
      out.push({ cityId: a.id, income: r.baseIncome });
      out.push({ cityId: b.id, income: r.baseIncome });
    }
  }
  return out;
}

/**
 * Auto-create trade routes within each province for cities that share a
 * province AND are adjacent.
 */
export function generateProvincialTradeRoutes(
  cities: Record<EntityId, City>,
): TradeRoute[] {
  const out: TradeRoute[] = [];
  const seen = new Set<string>();
  for (const c of Object.values(cities)) {
    const prov = PROVINCE_BY_CITY[c.id];
    if (!prov) continue;
    for (const adj of c.adjacentCityIds) {
      if (PROVINCE_BY_CITY[adj] !== prov) continue;
      const key = [c.id, adj].sort().join('::');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        id: `route-${key}`,
        cityAId: c.id,
        cityBId: adj,
        baseIncome: 30,
      });
    }
  }
  return out;
}

/**
 * Cost to start a new building project.
 */
export function buildingCost(id: BuildingId): number {
  return BUILDING_DEFS_BY_ID[id]?.goldPerLevel ?? 0;
}
