import type {
  Building,
  BuildingId,
  City,
  EntityId,
  ReportEntry,
} from '../types';
import { BUILDING_DEFS_BY_ID } from '../data/buildings';

export interface AutoBuildContext {
  cities: Record<EntityId, City>;
  buildings: Building[];
  queues: Record<EntityId, BuildingId[]>;
  playerForceId: EntityId | null;
}

export interface AutoBuildOutput {
  cities: Record<EntityId, City>;
  buildings: Building[];
  queues: Record<EntityId, BuildingId[]>;
  entries: ReportEntry[];
}

/**
 * Each season, for every player-owned city with an auto-build queue:
 *   - If no building currently in-progress in that city, dequeue head + start it.
 *   - Skip if gold insufficient or no head.
 */
export function applyAutoBuild(ctx: AutoBuildContext): AutoBuildOutput {
  const cities = { ...ctx.cities };
  const queues = { ...ctx.queues };
  let buildings = [...ctx.buildings];
  const entries: ReportEntry[] = [];

  for (const [cityId, queue] of Object.entries(queues)) {
    if (queue.length === 0) continue;
    const city = cities[cityId];
    if (!city || city.ownerForceId !== ctx.playerForceId) continue;
    // Skip if anything in-progress in this city.
    const inProgress = buildings.some((b) => b.cityId === cityId && b.progress > 0);
    if (inProgress) continue;
    const headId = queue[0];
    const def = BUILDING_DEFS_BY_ID[headId];
    if (!def) {
      queues[cityId] = queue.slice(1);
      continue;
    }
    // Check existing building's level — skip if already maxed.
    const existing = buildings.find((b) => b.cityId === cityId && b.id === headId);
    if (existing && existing.level >= def.maxLevel) {
      queues[cityId] = queue.slice(1);
      continue;
    }
    if (city.gold < def.goldPerLevel) {
      // Not enough gold this season — leave queue, try again next time.
      continue;
    }
    // Start a new project.
    cities[cityId] = { ...city, gold: city.gold - def.goldPerLevel };
    if (existing) {
      buildings = buildings.map((b) =>
        b.id === headId && b.cityId === cityId ? { ...b, progress: 1 } : b,
      );
    } else {
      buildings = [
        ...buildings,
        { id: headId, cityId, level: 0, progress: 1 },
      ];
    }
    queues[cityId] = queue.slice(1);
    entries.push({
      cityId,
      kind: 'command-success',
      text: `Auto-build queue at ${city.name.en}: started ${def.name.en}.`,
      textZh: `${city.name.zh}自動建造：始興${def.name.zh}。`,
    });
  }
  return { cities, buildings, queues, entries };
}
