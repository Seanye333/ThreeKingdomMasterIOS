import type { Building, City, EntityId, ReportEntry } from '../types';
import { BUILDING_DEFS_BY_ID } from '../data/buildings';

/**
 * 城建興廢 — once a season a city's works can suffer a mishap (火災/坍塌/兵災
 * 破壞) that knocks a building down a level, or enjoy a boon (名匠投奔/豐功)
 * that advances one for free. Watch & maintenance works (譙樓/烽燧/將作監) cut
 * the mishap odds. Keeps a built-out city living rather than fire-and-forget.
 */
export interface BuildingEventInput {
  buildings: Building[];
  cities: Record<EntityId, City>;
  playerForceId: EntityId | null;
  rng: () => number;
}
export interface BuildingEventOutput {
  buildings: Building[];
  entries: ReportEntry[];
}

const MISHAP_CHANCE = 0.04; // per owned city per season, before mitigation
const BOON_CHANCE = 0.02;
/** Works that watch for fire / keep the works in repair. */
const WATCH = new Set<string>(['signaltower', 'beacon', 'worksbureau']);

export function tickBuildingEvents(input: BuildingEventInput): BuildingEventOutput {
  let buildings = input.buildings;
  const entries: ReportEntry[] = [];

  // Group built (level≥1) buildings by city.
  const byCity = new Map<EntityId, Building[]>();
  for (const b of buildings) {
    if (b.level < 1) continue;
    const arr = byCity.get(b.cityId) ?? [];
    arr.push(b);
    byCity.set(b.cityId, arr);
  }

  const patch = (target: Building, next: Partial<Building>) => {
    buildings = buildings.map((b) =>
      b.cityId === target.cityId && b.id === target.id ? { ...b, ...next } : b,
    );
  };

  for (const [cityId, built] of byCity.entries()) {
    const city = input.cities[cityId];
    if (!city || !city.ownerForceId) continue;
    const isPlayer = city.ownerForceId === input.playerForceId;
    const watch = built.some((b) => WATCH.has(b.id));
    const mishap = MISHAP_CHANCE * (watch ? 0.4 : 1) * (1 + built.length * 0.03);

    if (input.rng() < mishap) {
      const victim = built[Math.floor(input.rng() * built.length)];
      const def = BUILDING_DEFS_BY_ID[victim.id];
      // Drop a level (a level-1 building is gutted back to an empty foundation).
      patch(victim, victim.level <= 1 ? { level: 0, progress: 0 } : { level: victim.level - 1, progress: 0 });
      if (isPlayer) {
        entries.push({
          cityId, kind: 'note',
          text: `Fire swept the ${def?.name.en ?? victim.id} in ${city.name.en} — it lost a level.`,
          textZh: `${city.name.zh}的${def?.name.zh ?? victim.id}遭祝融,毀去一級。`,
        });
      }
      continue; // at most one event per city per season
    }

    if (input.rng() < BOON_CHANCE) {
      const upgradable = built.filter((b) => {
        const d = BUILDING_DEFS_BY_ID[b.id];
        return d && b.level < d.maxLevel && b.progress === 0;
      });
      if (upgradable.length === 0) continue;
      const lucky = upgradable[Math.floor(input.rng() * upgradable.length)];
      const def = BUILDING_DEFS_BY_ID[lucky.id];
      patch(lucky, { level: lucky.level + 1 });
      if (isPlayer) {
        entries.push({
          cityId, kind: 'command-success',
          text: `A master craftsman raised the ${def?.name.en ?? lucky.id} in ${city.name.en} a level, free of charge.`,
          textZh: `名匠投效,${city.name.zh}的${def?.name.zh ?? lucky.id}白得一級。`,
        });
      }
    }
  }

  return { buildings, entries };
}
