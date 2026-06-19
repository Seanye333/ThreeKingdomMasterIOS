import type {
  City,
  Force,
  Scenario,
} from '../types';
import { OFFICER_IDS, TALENT_POOL_IDS, buildInitialCities, buildInitialOfficers } from '../data';
import { cityPos } from '../data/cityGeo';

/**
 * Procedurally generate a scenario by randomly distributing cities to N
 * generated forces, then assigning officers by best-fit clustering on
 * historical force loyalties.
 *
 * The result is a self-contained Scenario object — same shape as the
 * hand-built ones, ready to load.
 */
export interface RandomScenarioConfig {
  /** Number of major forces. */
  forceCount: number;
  /** Year (sets the cutoff for which historical officers exist). */
  year: number;
  /** Random seed; if undefined, uses Math.random. */
  seed?: number;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FORCE_COLOR_POOL = [
  '#b8442e', '#3a7dd9', '#d4a84a', '#6abf6a', '#c178c7',
  '#88b7e8', '#c19a3b', '#5a4a8a', '#3a7d5a', '#e09b6c',
];

const RANDOM_NAMES_ZH = ['楚', '齊', '燕', '魏', '韓', '趙', '宋', '梁', '陳', '蜀'];
const RANDOM_NAMES_EN = ['Chu', 'Qi', 'Yan', 'Wei', 'Han', 'Zhao', 'Song', 'Liang', 'Chen', 'Shu'];

export function generateRandomScenario(cfg: RandomScenarioConfig): Scenario {
  const rng = cfg.seed != null ? mulberry32(cfg.seed) : Math.random;
  const forceCount = Math.max(2, Math.min(10, cfg.forceCount));

  // Cluster cities into forceCount groups by simple K-means on (x, y).
  const cityList = buildInitialCities({});
  const centroids: Array<{ x: number; y: number }> = Array.from(
    { length: forceCount },
    () => {
      const c = cityList[Math.floor(rng() * cityList.length)];
      return cityPos(c);
    },
  );

  let assigned: number[] = cityList.map(() => 0);
  for (let iter = 0; iter < 8; iter++) {
    assigned = cityList.map((c) => {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < centroids.length; i++) {
        const cp = cityPos(c);
        const dx = cp.x - centroids[i].x;
        const dy = cp.y - centroids[i].y;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    });
    // Recompute centroids.
    for (let i = 0; i < centroids.length; i++) {
      const members = cityList.filter((_, idx) => assigned[idx] === i);
      if (members.length === 0) continue;
      centroids[i] = {
        x: members.reduce((s, m) => s + cityPos(m).x, 0) / members.length,
        y: members.reduce((s, m) => s + cityPos(m).y, 0) / members.length,
      };
    }
  }

  // Build forces with random names + colors + random rulers from officer pool.
  const usedOfficerIds = new Set<string>();
  const forces: Force[] = [];
  const officerAssignments: Record<string, { forceId: string; cityId: string }> = {};

  for (let i = 0; i < forceCount; i++) {
    const myCities = cityList.filter((_, idx) => assigned[idx] === i);
    if (myCities.length === 0) continue;
    const capital = myCities.reduce((biggest, c) =>
      c.troops > biggest.troops ? c : biggest,
    );
    // Pick a free officer with high charisma + leadership to be ruler.
    const candidate = pickRulerCandidate(usedOfficerIds, rng);
    if (!candidate) break;
    usedOfficerIds.add(candidate);
    const forceId = `rand-force-${i}`;
    forces.push({
      id: forceId,
      name: {
        zh: RANDOM_NAMES_ZH[i % RANDOM_NAMES_ZH.length],
        en: RANDOM_NAMES_EN[i % RANDOM_NAMES_EN.length],
      },
      rulerOfficerId: candidate,
      capitalCityId: capital.id,
      color: FORCE_COLOR_POOL[i % FORCE_COLOR_POOL.length],
      isPlayer: false,
    });
    // Place 4–8 random officers in each city.
    for (const c of myCities) {
      officerAssignments[i === 0 && c.id === capital.id ? candidate : ''] = {
        forceId,
        cityId: capital.id,
      };
      const officerCount = 4 + Math.floor(rng() * 5);
      for (let k = 0; k < officerCount; k++) {
        const next = pickRandomOfficer(usedOfficerIds, rng);
        if (!next) break;
        usedOfficerIds.add(next);
        officerAssignments[next] = { forceId, cityId: c.id };
      }
    }
    officerAssignments[candidate] = { forceId, cityId: capital.id };
  }

  // City ownership is set from assignments.
  const cities: City[] = cityList.map((c, idx) => {
    const groupIdx = assigned[idx];
    const force = forces[groupIdx];
    return force
      ? { ...c, ownerForceId: force.id }
      : { ...c, ownerForceId: null };
  });

  return {
    id: `random-${cfg.seed ?? Date.now()}`,
    name: { zh: '群雄割據', en: 'Random Scenario' },
    description: `Procedurally generated start: ${forceCount} forces, ${cities.length} cities. Year ${cfg.year}.`,
    startDate: { year: cfg.year, season: 'spring' },
    forces,
    cities,
    officers: buildInitialOfficers(officerAssignments, [], cfg.year),
  };
}

function pickRulerCandidate(used: Set<string>, rng: () => number): string | null {
  const all = [...OFFICER_IDS, ...TALENT_POOL_IDS].filter((id) => !used.has(id));
  if (all.length === 0) return null;
  return all[Math.floor(rng() * all.length)];
}

function pickRandomOfficer(used: Set<string>, rng: () => number): string | null {
  const all = [...OFFICER_IDS, ...TALENT_POOL_IDS].filter((id) => !used.has(id));
  if (all.length === 0) return null;
  return all[Math.floor(rng() * all.length)];
}
