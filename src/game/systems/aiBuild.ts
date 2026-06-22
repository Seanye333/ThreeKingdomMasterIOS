import type {
  Building,
  BuildingId,
  City,
  DiplomaticState,
  EntityId,
  FacilityKind,
  Force,
  Fort,
  Officer,
  Port,
  ReportEntry,
  RulerPersonality,
  WildSite,
} from '../types';
import { BUILDING_DEFS_BY_ID, BUILDING_PREREQ, BUILDING_MIN_SIZE } from '../data/buildings';
import { citySize, cityMeetsSize } from './citySize';
import { FACILITY_DEFS, isHostilePermitted } from '../types';
import { CITY_GEO_OVERRIDES, cityPos } from '../data/cityGeo';
import { geoToPixel, WORLD_SCALE } from '../data/geography';
import { TRIBES } from '../data/tribes';
import { resolveTribePunitive } from './tribes';
import { SCENIC_SITES, rollHermitRecruit } from '../data/scenicSites';
import { portUpgradeCost, PORT_MAX_NAVAL_TIER } from '../data/ships';

/**
 * AI building priorities per ruler personality. The list is consulted top-down;
 * the first building that isn't already at max level (and that the city can
 * afford) is started.
 */
const BUILD_PRIORITIES: Record<RulerPersonality, BuildingId[]> = {
  aggressive:   ['barracks', 'drillground', 'quartermaster', 'pasture', 'stable',  'foundry',  'arsenal', 'warschool', 'barbican', 'signaltower', 'beacon', 'wall',    'workshop', 'supplydepot', 'navalyard', 'armsbureau', 'farm',    'irrigation', 'evernormal', 'market', 'relay', 'mint',    'academy', 'grandacademy', 'recruithall', 'fieldhospital', 'prison', 'worksbureau', 'library', 'scoutcamp', 'civicoffice', 'daotemple', 'tavern', 'spyoffice', 'tradeoffice', 'heraldhall', 'pricebureau', 'temple'],
  defensive:    ['wall',     'barbican', 'signaltower', 'beacon', 'arsenal', 'spyoffice', 'scoutcamp', 'prison', 'farm',     'irrigation', 'evernormal', 'workshop','temple',  'daotemple', 'civicoffice', 'fieldhospital', 'barracks', 'drillground', 'quartermaster', 'pasture', 'navalyard', 'market',  'relay', 'mint',   'supplydepot', 'armsbureau', 'worksbureau', 'library', 'academy', 'grandacademy', 'warschool', 'recruithall', 'tavern', 'tradeoffice', 'heraldhall', 'pricebureau', 'foundry', 'stable'],
  opportunist:  ['market',   'relay', 'tradeoffice', 'mint',    'pricebureau', 'tavern', 'evernormal', 'irrigation', 'worksbureau', 'heraldhall', 'barracks', 'farm',    'civicoffice', 'stable',  'drillground', 'quartermaster', 'pasture', 'foundry',  'armsbureau', 'workshop','temple', 'academy', 'grandacademy', 'library', 'recruithall', 'warschool', 'supplydepot', 'navalyard', 'fieldhospital', 'daotemple', 'prison', 'scoutcamp', 'spyoffice', 'wall',    'barbican', 'signaltower', 'beacon', 'arsenal'],
  hesitant:     ['market',   'mint',    'relay', 'tradeoffice', 'pricebureau', 'tavern', 'farm',     'irrigation', 'evernormal', 'civicoffice', 'worksbureau', 'heraldhall', 'academy', 'grandacademy', 'library', 'recruithall', 'temple',  'daotemple', 'warschool', 'fieldhospital', 'armsbureau', 'wall',     'barbican', 'signaltower', 'beacon', 'arsenal', 'prison', 'scoutcamp', 'spyoffice', 'barracks','drillground', 'quartermaster', 'pasture', 'supplydepot', 'navalyard', 'foundry','workshop','stable'],
  tyrant:       ['barracks', 'drillground', 'quartermaster', 'pasture', 'stable',  'foundry',  'arsenal', 'warschool', 'barbican', 'signaltower', 'beacon', 'prison', 'wall',    'workshop', 'supplydepot', 'navalyard', 'armsbureau', 'farm',    'irrigation', 'evernormal', 'market',  'relay', 'mint',   'academy', 'grandacademy', 'recruithall', 'fieldhospital', 'worksbureau', 'library', 'scoutcamp', 'civicoffice', 'daotemple', 'tavern', 'spyoffice', 'tradeoffice', 'heraldhall', 'pricebureau', 'temple'],
  scholar:      ['academy',  'grandacademy', 'warschool', 'recruithall', 'library', 'heraldhall', 'market',  'relay', 'tradeoffice', 'mint',     'pricebureau', 'daotemple', 'farm',    'irrigation', 'evernormal', 'civicoffice', 'worksbureau', 'temple',  'fieldhospital', 'tavern', 'armsbureau', 'wall',     'barbican', 'signaltower', 'beacon', 'spyoffice', 'scoutcamp', 'arsenal', 'barracks','drillground', 'quartermaster', 'pasture', 'navalyard', 'prison', 'workshop','supplydepot', 'foundry','stable'],
  expansionist: ['barracks', 'drillground', 'quartermaster', 'pasture', 'stable',  'market',   'relay', 'tradeoffice', 'mint',    'pricebureau', 'farm',    'irrigation', 'evernormal', 'civicoffice', 'worksbureau', 'heraldhall', 'foundry',  'workshop','supplydepot', 'navalyard', 'armsbureau', 'arsenal', 'barbican', 'signaltower', 'beacon', 'temple', 'academy', 'grandacademy', 'recruithall', 'library', 'fieldhospital', 'tavern', 'warschool', 'daotemple', 'prison', 'scoutcamp', 'spyoffice', 'wall'],
  cautious:     ['wall',     'barbican', 'signaltower', 'beacon', 'arsenal', 'spyoffice', 'scoutcamp', 'prison', 'farm',     'irrigation', 'evernormal', 'daotemple', 'market',  'relay', 'tradeoffice', 'mint',    'pricebureau', 'civicoffice', 'fieldhospital', 'temple',   'workshop','worksbureau', 'navalyard', 'academy', 'grandacademy', 'library', 'recruithall', 'warschool', 'armsbureau', 'tavern', 'heraldhall', 'barracks','drillground', 'quartermaster', 'pasture', 'supplydepot', 'foundry','stable'],
};

export interface AIBuildContext {
  cities: Record<EntityId, City>;
  buildings: Building[];
  forces: Record<EntityId, Force>;
  playerForceId: EntityId | null;
}

export interface AIBuildOutput {
  cities: Record<EntityId, City>;
  buildings: Building[];
  entries: ReportEntry[];
}

/**
 * Each season, every AI-controlled city with no building in progress starts
 * one based on its force's personality.
 */
export function planAIBuildOrders(ctx: AIBuildContext): AIBuildOutput {
  const cities = { ...ctx.cities };
  let buildings = [...ctx.buildings];
  const entries: ReportEntry[] = [];

  for (const city of Object.values(cities)) {
    if (!city.ownerForceId) continue;
    if (city.ownerForceId === ctx.playerForceId) continue;
    // Skip if anything in-progress in this city.
    if (buildings.some((b) => b.cityId === city.id && b.progress > 0)) continue;

    const force = ctx.forces[city.ownerForceId];
    const personality = force?.personality ?? 'opportunist';
    const priorities = BUILD_PRIORITIES[personality];

    // Build-slot cap mirrors the player's: only as many distinct buildings as
    // the city's size allows. At the cap the AI may still upgrade what it has.
    const slotsUsed = buildings.filter((b) => b.cityId === city.id).length;
    const atSlotCap = slotsUsed >= citySize(city).buildingSlots;

    // Pick the first building they can afford that isn't maxed.
    for (const bid of priorities) {
      const def = BUILDING_DEFS_BY_ID[bid];
      if (!def) continue;
      const existing = buildings.find((b) => b.cityId === city.id && b.id === bid);
      if (existing && existing.level >= def.maxLevel) continue;
      if (!existing && atSlotCap) continue; // no free slot for a new building
      // 建築前置 — a new tier-2 work needs its foundation built first.
      if (!existing) {
        const prereq = BUILDING_PREREQ[bid];
        if (prereq && !buildings.some((b) => b.cityId === city.id && b.id === prereq && b.level >= 1)) continue;
        // 城格解鎖 — grand works need a city of sufficient size.
        const minSize = BUILDING_MIN_SIZE[bid];
        if (minSize && !cityMeetsSize(city, minSize)) continue;
      }
      // Don't spend the city dry — keep at least 200 gold reserve.
      if (city.gold < def.goldPerLevel + 200) continue;
      // Start it.
      cities[city.id] = { ...city, gold: city.gold - def.goldPerLevel };
      if (existing) {
        buildings = buildings.map((b) =>
          b.id === bid && b.cityId === city.id ? { ...b, progress: 1 } : b,
        );
      } else {
        buildings = [...buildings, { id: bid, cityId: city.id, level: 0, progress: 1 }];
      }
      entries.push({
        cityId: city.id,
        kind: 'note',
        text: `${force?.name.en ?? 'AI'} begins building a ${def.name.en} at ${city.name.en}.`,
        textZh: `${force?.name.zh ?? '電腦'}於${city.name.zh}興建${def.name.zh}。`,
      });
      break;
    }
  }
  return { cities, buildings, entries };
}

// ─── AI 施設 — strategic facilities ──────────────────────────────────────
export interface AIFacilityContext {
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  forts: Record<EntityId, Fort>;
  diplomacy: DiplomaticState;
  playerForceId: EntityId | null;
  rng: () => number;
}
export interface AIFacilityOutput {
  cities: Record<EntityId, City>;
  newForts: Record<EntityId, Fort>;
  entries: ReportEntry[];
}

const AI_FACILITY_CAP = 3;      // facilities a force keeps standing at once
const AI_BUILD_CHANCE = 0.14;   // per eligible force per season

/**
 * AI forces fortify their frontier with strategic facilities — a force that
 * borders a hostile neighbour occasionally raises a 箭樓/投石臺/防壁 near a
 * contested city (paid from its capital), capped so the map can't fill up.
 */
export function planAIFacilities(ctx: AIFacilityContext): AIFacilityOutput {
  const cities = { ...ctx.cities };
  const newForts: Record<EntityId, Fort> = {};
  const entries: ReportEntry[] = [];

  const countByForce: Record<EntityId, number> = {};
  for (const f of Object.values(ctx.forts)) {
    if (f.facility && f.ownerForceId) countByForce[f.ownerForceId] = (countByForce[f.ownerForceId] ?? 0) + 1;
  }

  for (const force of Object.values(ctx.forces)) {
    if (force.id === ctx.playerForceId) continue;
    if ((countByForce[force.id] ?? 0) >= AI_FACILITY_CAP) continue;
    if (ctx.rng() > AI_BUILD_CHANCE) continue;

    // Frontier cities: owned by this force, bordering a hostile-owned city.
    const frontier = Object.values(cities).filter((c) =>
      c.ownerForceId === force.id
      && (c.adjacentCityIds ?? []).some((aid) => {
        const adj = cities[aid];
        return !!adj?.ownerForceId && adj.ownerForceId !== force.id
          && isHostilePermitted(ctx.diplomacy, force.id, adj.ownerForceId);
      }));
    if (frontier.length === 0) continue;

    const capital = cities[force.capitalCityId];
    if (!capital) continue;

    // Pick a kind by temperament + budget, falling back to the cheap 箭樓.
    let kind: FacilityKind = 'tower';
    const pers = force.personality;
    if ((pers === 'aggressive' || pers === 'tyrant' || pers === 'expansionist') && capital.gold > 900) kind = 'catapult';
    else if ((pers === 'defensive' || pers === 'cautious') && ctx.rng() < 0.4) kind = 'wall';
    if (capital.gold < FACILITY_DEFS[kind].cost) kind = 'tower';
    const def = FACILITY_DEFS[kind];
    if (capital.gold < def.cost) continue;

    // Build near the most contested (most-garrisoned) frontier city.
    const host = [...frontier].sort((a, b) => b.troops - a.troops)[0];
    const geo = CITY_GEO_OVERRIDES[host.id];
    const cityLon = geo ? geo[0] : 96 + (host.coords.x / 1000) * 29;
    const cityLat = geo ? geo[1] : 43 - (host.coords.y / 720) * 26;
    const angle = ctx.rng() * Math.PI * 2;
    const id = `ai-fac-${host.id}-${Math.floor(ctx.rng() * 1e9)}`;
    newForts[id] = {
      id,
      name: { zh: def.name.zh, en: def.name.en },
      subtype: 'stockade',
      facility: kind,
      coords: { lon: cityLon + Math.cos(angle) * 0.4, lat: cityLat + Math.sin(angle) * 0.4 },
      ownerForceId: force.id,
      hp: def.hp,
      maxHp: def.hp,
      guards: [host.id],
      seasonsRemaining: def.seasons,
    };
    cities[capital.id] = { ...capital, gold: capital.gold - def.cost };
    countByForce[force.id] = (countByForce[force.id] ?? 0) + 1;

    // Warn the player only when the new work sits on their doorstep.
    const nearPlayer = (host.adjacentCityIds ?? []).some((aid) => cities[aid]?.ownerForceId === ctx.playerForceId);
    if (nearPlayer) {
      entries.push({
        cityId: host.id, kind: 'battle',
        text: `${force.name.en} raised a ${def.name.en} near ${host.name.en}.`,
        textZh: `${force.name.zh}於${host.name.zh}近郊築起${def.name.zh}。`,
      });
    }
  }

  return { cities, newForts, entries };
}

// ─── AI 拔點 — assaulting the player's forts & facilities ────────────────
const ASSAULT_RANGE = 50 * WORLD_SCALE;   // strategic px (scaled with the world) from an AI city to a target fort
const ASSAULT_CHANCE = 0.22;    // per hostile force per season

export interface AIFortAssaultOutput {
  cities: Record<EntityId, City>;
  forts: Record<EntityId, Fort>;
  entries: ReportEntry[];
}

/**
 * The player's forts were untouchable — the AI just marched around towers
 * shelling its columns. Now a hostile force with a garrisoned city near a
 * player fort occasionally storms it: the fort loses HP (razed at 0), the
 * assaulting city bleeds troops (ranged facilities bite back harder).
 */
export function planAIFortAssaults(ctx: AIFacilityContext): AIFortAssaultOutput {
  const cities = { ...ctx.cities };
  const forts = { ...ctx.forts };
  const entries: ReportEntry[] = [];
  if (!ctx.playerForceId) return { cities, forts, entries };

  // Only player-BUILT works (stockades & facilities) are assault targets —
  // permanent historical forts (街亭/定軍山…) are landmarks and must never be
  // deleted from the map, even when player-held.
  const playerForts = Object.values(forts).filter(
    (f) => f.ownerForceId === ctx.playerForceId && f.subtype === 'stockade',
  );
  if (playerForts.length === 0) return { cities, forts, entries };

  for (const force of Object.values(ctx.forces)) {
    if (force.id === ctx.playerForceId) continue;
    if (!isHostilePermitted(ctx.diplomacy, force.id, ctx.playerForceId)) continue;
    if (ctx.rng() > ASSAULT_CHANCE) continue;
    // Nearest player fort within reach of one of this force's garrisons.
    let best: { fort: Fort; city: City; d: number } | null = null;
    for (const fort of playerForts) {
      if (!forts[fort.id]) continue; // already razed this season
      const [fx, fy] = geoToPixel(fort.coords.lon, fort.coords.lat);
      for (const c of Object.values(cities)) {
        if (c.ownerForceId !== force.id || c.troops < 4000) continue;
        const cp = cityPos(c);
        const d = Math.hypot(cp.x - fx, cp.y - fy);
        if (d < ASSAULT_RANGE && (!best || d < best.d)) best = { fort, city: c, d };
      }
    }
    if (!best) continue;
    const { fort, city } = best;
    const commitment = Math.min(3000, Math.floor(city.troops * 0.2));
    const damage = 150 + Math.floor(commitment * 0.08);
    // Ranged facilities bite back hard; plain palisades less so. (×1.2 of the
    // per-tick power ≈ a couple of point-blank volleys during the storm.)
    const fac = fort.facility ? FACILITY_DEFS[fort.facility] : null;
    const casualties = Math.min(commitment, fac && fac.effect === 'ranged' ? Math.floor(fac.power * 1.2) : 150);
    cities[city.id] = { ...cities[city.id], troops: Math.max(0, cities[city.id].troops - casualties) };
    const hpLeft = fort.hp - damage;
    const fortLabel = fac ? fac.name : fort.name;
    if (hpLeft <= 0) {
      delete forts[fort.id];
      entries.push({
        cityId: fort.guards[0] ?? null, kind: 'battle',
        text: `${force.name.en} stormed and razed your ${fortLabel.en} (they lost ${casualties}).`,
        textZh: `${force.name.zh}強攻拔除我方${fortLabel.zh}!(敵折兵 ${casualties})`,
      });
    } else {
      forts[fort.id] = { ...fort, hp: hpLeft };
      entries.push({
        cityId: fort.guards[0] ?? null, kind: 'battle',
        text: `${force.name.en} assaulted your ${fortLabel.en} — ${hpLeft}/${fort.maxHp} HP left (they lost ${casualties}).`,
        textZh: `${force.name.zh}強攻我方${fortLabel.zh},尚餘 ${hpLeft}/${fort.maxHp} 耐久(敵折兵 ${casualties})。`,
      });
    }
  }

  return { cities, forts, entries };
}

// ─── AI 拓野 — seizing neutral wild sites (mines, fords, bandit nests) ──────
const SITE_SEIZE_RANGE = 50 * WORLD_SCALE;   // strategic px from an AI city to a neutral site
const SITE_SEIZE_CHANCE = 0.25;              // per AI force per season

export interface AISiteSeizureOutput {
  cities: Record<EntityId, City>;
  sites: Record<EntityId, WildSite>;
  entries: ReportEntry[];
}

/**
 * Symmetry with the player: an AI force with a strong garrison near a NEUTRAL
 * wild site grabs it — mines & fords for the income/control, bandit nests to
 * end the raids on its own lands. Single-season seizure (the AI doesn't
 * HP-grind like the player), but the committing garrison bleeds for it.
 */
export function planAISiteSeizures(ctx: {
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  sites: Record<EntityId, WildSite>;
  playerForceId: EntityId | null;
  rng: () => number;
}): AISiteSeizureOutput {
  const cities = { ...ctx.cities };
  const sites = { ...ctx.sites };
  const entries: ReportEntry[] = [];
  const neutral = Object.values(sites).filter((s) => !s.ownerForceId);
  if (neutral.length === 0) return { cities, sites, entries };

  for (const force of Object.values(ctx.forces)) {
    if (force.id === ctx.playerForceId) continue;
    if (ctx.rng() > SITE_SEIZE_CHANCE) continue;
    // Nearest still-neutral site within reach of one of this force's garrisons.
    let best: { site: WildSite; city: City; d: number } | null = null;
    for (const site of neutral) {
      if (sites[site.id].ownerForceId) continue; // taken earlier this pass
      const [sx, sy] = geoToPixel(site.coords.lon, site.coords.lat);
      for (const c of Object.values(cities)) {
        if (c.ownerForceId !== force.id || c.troops < 6000) continue;
        const cp = cityPos(c);
        const d = Math.hypot(cp.x - sx, cp.y - sy);
        if (d < SITE_SEIZE_RANGE && (!best || d < best.d)) best = { site, city: c, d };
      }
    }
    if (!best) continue;
    const { site, city } = best;
    const commit = Math.min(5000, Math.floor(city.troops * 0.3));
    if (commit < site.strength * 0.5) continue;   // not worth the bloodshed
    const losses = Math.floor(site.strength * (0.12 + ctx.rng() * 0.14));
    cities[city.id] = { ...cities[city.id], troops: Math.max(0, cities[city.id].troops - losses) };
    sites[site.id] = { ...site, ownerForceId: force.id, hostile: false, hp: site.maxHp };

    // Surface only what touches the player's neighbourhood (a rival grabbing a
    // resource at your border, or a bandit nest near you finally cleared).
    const nearPlayer = site.guards.some((g) => {
      const gc = cities[g];
      if (!gc) return false;
      if (gc.ownerForceId === ctx.playerForceId) return true;
      return (gc.adjacentCityIds ?? []).some((a) => cities[a]?.ownerForceId === ctx.playerForceId);
    });
    if (nearPlayer) {
      const what = site.subtype === 'bandit' ? 'cleared the' : 'seized the';
      const whatZh = site.subtype === 'bandit' ? '蕩平' : '據有';
      entries.push({
        cityId: site.guards[0] ?? null, kind: 'battle',
        text: `${force.name.en} ${what} ${site.name.en} (lost ${losses}).`,
        textZh: `${force.name.zh}${whatZh}${site.name.zh}(折兵 ${losses})。`,
      });
    }
  }

  return { cities, sites, entries };
}

// ─── AI 邊功 — frontier exploits: 訪賢 / 征討異族 / 擴建船塢 ─────────────────
// Parity with the player's new tools. Each AI force may, once per season:
//   訪賢 — court a reclusive worthy at a reachable 名所;
//   征討 — punish a restless border tribe (and maybe win its chief);
//   擴建船塢 — raise an owned port's naval tier toward bigger ships.
// Returns patched cities/officers/ports + aggression & scenic-loot deltas.
const AI_SCENIC_CHANCE = 0.3;
const AI_TRIBE_CHANCE = 0.25;
const AI_PORT_CHANCE = 0.3;

export interface AIFrontierOutput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  ports: Record<EntityId, Port>;
  aggression: Record<string, number>;
  scenicLooted: Record<string, EntityId>;
  entries: ReportEntry[];
}

export function planAIFrontierExploits(ctx: {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  ports: Record<EntityId, Port>;
  aggression: Record<string, number>;
  scenicLooted: Record<string, EntityId>;
  playerForceId: EntityId | null;
  rng: () => number;
}): AIFrontierOutput {
  const cities = { ...ctx.cities };
  const officers = { ...ctx.officers };
  const ports = { ...ctx.ports };
  const aggression = { ...ctx.aggression };
  const scenicLooted = { ...ctx.scenicLooted };
  const entries: ReportEntry[] = [];

  // Helper: does this force own / border a guard city?
  const reaches = (forceId: string, guards: readonly string[]): boolean => {
    for (const gid of guards) {
      const g = cities[gid];
      if (!g) continue;
      if (g.ownerForceId === forceId) return true;
      for (const adj of g.adjacentCityIds ?? []) {
        if (cities[adj]?.ownerForceId === forceId) return true;
      }
    }
    return false;
  };
  // Helper: an available officer of a force in a city near `guards`, by stat.
  const pickEnvoy = (forceId: string, guards: readonly string[], by: (o: Officer) => number): Officer | null => {
    const valid = new Set<string>();
    for (const gid of guards) {
      const g = cities[gid];
      if (!g) continue;
      if (g.ownerForceId === forceId) valid.add(g.id);
      for (const adj of g.adjacentCityIds ?? []) {
        if (cities[adj]?.ownerForceId === forceId) valid.add(adj);
      }
    }
    let best: Officer | null = null;
    for (const o of Object.values(officers)) {
      if (o.forceId !== forceId || (o.status !== 'idle' && o.status !== 'active')) continue;
      if (!o.locationCityId || !valid.has(o.locationCityId)) continue;
      if (!best || by(o) > by(best)) best = o;
    }
    return best;
  };

  for (const force of Object.values(ctx.forces)) {
    if (force.id === ctx.playerForceId) continue;
    const ruler = officers[force.rulerOfficerId];

    // ── 訪賢 — recruit a still-free reclusive worthy ──
    if (ctx.rng() < AI_SCENIC_CHANCE) {
      for (const site of SCENIC_SITES) {
        if (!site.hermitId) continue;
        const hermit = officers[site.hermitId];
        if (!hermit || hermit.forceId !== null) continue;
        if (!(hermit.status === 'idle' || hermit.status === 'unsearched')) continue;
        if (!reaches(force.id, site.guards)) continue;
        const envoy = pickEnvoy(force.id, site.guards, (o) => o.stats.charisma);
        if (!envoy) continue;
        const won = rollHermitRecruit({
          envoyCharisma: envoy.stats.charisma,
          rulerCharisma: ruler?.stats.charisma ?? 50,
          hermitIntelligence: hermit.stats.intelligence,
          rng: ctx.rng,
        });
        if (won) {
          officers[hermit.id] = {
            ...hermit, forceId: force.id, locationCityId: envoy.locationCityId, status: 'idle', loyalty: 70,
          };
          if (!scenicLooted[site.id]) scenicLooted[site.id] = force.id;
          // Only the player cares if a rival just bagged a famous worthy.
          entries.push({
            cityId: null, kind: 'talent',
            text: `${force.name.en} won over ${hermit.name.en} at ${site.name.en}.`,
            textZh: `${force.name.zh}於${site.name.zh}延攬${hermit.name.zh}入幕。`,
          });
        }
        break; // one 訪賢 attempt per force per season
      }
    }

    // ── 征討異族 — punish a restless border tribe ──
    if (ctx.rng() < AI_TRIBE_CHANCE) {
      for (const tribe of TRIBES) {
        const agg = aggression[tribe.id] ?? tribe.baseAggression;
        if (agg < tribe.baseAggression * 0.8) continue;   // already cowed — leave it
        if (!reaches(force.id, tribe.raidableCityIds)) continue;
        const general = pickEnvoy(force.id, tribe.raidableCityIds, (o) => o.stats.war);
        if (!general || !general.locationCityId) continue;
        const src = cities[general.locationCityId];
        if (!src || src.troops < 8000) continue;
        const troops = Math.min(12000, Math.floor(src.troops * 0.5));
        const r = resolveTribePunitive({
          tribe, aggression: agg, troops,
          officerWar: general.stats.war, officerLeadership: general.stats.leadership, rng: ctx.rng,
        });
        aggression[tribe.id] = Math.max(0, agg + r.aggressionDelta);
        cities[src.id] = {
          ...src,
          troops: src.troops - troops + Math.max(0, troops - r.attackerLosses) + r.auxTroops,
          gold: src.gold + r.tributeGold,
        };
        // 招降 — a crushing win may bring the chief over if still free.
        if (r.win && tribe.chieftainId) {
          const chief = officers[tribe.chieftainId];
          if (chief && chief.forceId === null && (chief.status === 'idle' || chief.status === 'unsearched') && ctx.rng() < 0.45) {
            officers[chief.id] = { ...chief, forceId: force.id, locationCityId: src.id, status: 'idle', loyalty: 70 };
          }
        }
        break; // one campaign per force per season
      }
    }

    // ── 擴建船塢 — raise an owned port's naval tier ──
    if (ctx.rng() < AI_PORT_CHANCE) {
      const capital = cities[force.capitalCityId];
      const owned = Object.values(ports)
        .filter((p) => p.ownerForceId === force.id && (p.navalTier ?? 1) < PORT_MAX_NAVAL_TIER)
        .sort((a, b) => (a.navalTier ?? 1) - (b.navalTier ?? 1));
      const port = owned[0];
      if (port && capital && capital.ownerForceId === force.id) {
        const tier = port.navalTier ?? 1;
        const cost = portUpgradeCost(tier);
        if (capital.gold >= cost) {
          const mult = (tt: number) => (tt === 3 ? 1.8 : tt === 2 ? 1.4 : 1);
          const nextTier = (tier + 1) as 1 | 2 | 3;
          const newMaxHp = Math.round(port.maxHp * (mult(nextTier) / mult(tier)));
          ports[port.id] = { ...port, navalTier: nextTier, maxHp: newMaxHp, hp: port.hp + (newMaxHp - port.maxHp) };
          cities[capital.id] = { ...cities[capital.id], gold: cities[capital.id].gold - cost };
        }
      }
    }
  }

  return { cities, officers, ports, aggression, scenicLooted, entries };
}
