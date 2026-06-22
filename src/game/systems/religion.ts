import type {
  City,
  EntityId,
  Force,
  GameDate,
  Officer,
  ReportEntry,
} from '../types';
import { buildingBonuses } from './buildings';

/**
 * 邪教叛乱 — Cult rebellion. Models late-Han religious uprisings:
 *  五斗米道 (Way of the Five Pecks of Rice) — Hanzhong, Zhang Lu's stronghold
 *  太平道 (Way of Great Peace) — Yellow Turban, Zhang Jue's movement
 *
 * Trigger: city loyalty < 35 for 4+ seasons in a row → 8% chance per season
 * to spawn a cult force. The cult force takes the city and acts as a hostile
 * neutral (no diplomacy, just defends).
 */

export type CultKind = 'wudou' | 'taiping' | 'huangtian';

export const CULT_LABEL: Record<CultKind, { en: string; zh: string; color: string }> = {
  wudou:     { en: 'Way of Five Pecks',   zh: '五斗米道', color: '#d4a84a' },
  taiping:   { en: 'Way of Great Peace',  zh: '太平道',   color: '#88b7e8' },
  huangtian: { en: 'Yellow Heaven',       zh: '黃天教',   color: '#e8c060' },
};

export interface ReligionInput {
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  date: GameDate;
  rng: () => number;
  /** City buildings — a 道觀 blunts cult-contagion loyalty erosion. */
  buildings?: import('../types').Building[];
}

export interface ReligionOutput {
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  entries: ReportEntry[];
}

/** A cult banner (spawned by rollReligiousRebellion) carries a `cult-` id. */
export function isCultForce(forceId: EntityId | null | undefined): boolean {
  return typeof forceId === 'string' && forceId.startsWith('cult-');
}

/**
 * 流民四起 — faith contagion. Each season every cult-held city erodes the
 * loyalty of its non-cult neighbours (the 太平道 spread along the roads). A
 * neighbour already on the brink can itself rise and join the *adjacent* cult
 * banner — turning one rebellion into the cascading 黃巾之亂 rather than a
 * single containable flip. At most one city converts per season so a player
 * who responds promptly can stem the tide; ignore it and a province burns.
 */
export function spreadCultUnrest(input: ReligionInput): ReligionOutput {
  const cities = { ...input.cities };
  const forces = input.forces;
  const officers = input.officers;
  const entries: ReportEntry[] = [];

  const cultCities = Object.values(cities).filter((c) => isCultForce(c.ownerForceId));
  if (cultCities.length === 0) return { cities, forces, officers, entries };

  // Erode loyalty in every non-cult neighbour of a cult city.
  const flipCandidates: Array<{ city: City; cultForceId: EntityId }> = [];
  for (const cc of cultCities) {
    for (const adjId of cc.adjacentCityIds ?? []) {
      const adj = cities[adjId];
      if (!adj || isCultForce(adj.ownerForceId) || adj.ownerForceId === null) continue;
      const baseDrop = adj.loyalty < 40 ? 4 : 2; // shakier cities slip faster
      // 道觀 — a Daoist temple steadies the faithful against the contagion.
      const cultResist = buildingBonuses(adjId, input.buildings ?? []).cultResist;
      const drop = Math.round(baseDrop * (1 - cultResist));
      cities[adjId] = { ...adj, loyalty: Math.max(0, cities[adjId].loyalty - drop) };
      if (cities[adjId].loyalty < 22 && cities[adjId].population > 40_000) {
        flipCandidates.push({ city: cities[adjId], cultForceId: cc.ownerForceId as EntityId });
      }
    }
  }

  // At most one neighbour actually rises this season.
  if (flipCandidates.length > 0 && input.rng() < 0.5) {
    const pick = flipCandidates[Math.floor(input.rng() * flipCandidates.length)];
    const target = cities[pick.city.id];
    const label = forces[pick.cultForceId]?.name ?? { zh: '亂民', en: 'Rebels' };
    cities[target.id] = {
      ...target,
      ownerForceId: pick.cultForceId,
      loyalty: 60,
      troops: Math.max(1_500, Math.floor(target.troops * 0.55)),
      population: Math.max(15_000, Math.floor(target.population * 0.9)),
    };
    entries.push({
      cityId: target.id,
      kind: 'rebellion',
      text: `The faith spreads — ${target.name.zh} rises and joins the ${label.zh}（${label.en}）.`,
      textZh: `信眾蔓延 — ${target.name.zh}響應${label.zh}，舉城而附。`,
    });
  }

  return { cities, forces, officers, entries };
}

export function rollReligiousRebellion(input: ReligionInput): ReligionOutput {
  const cities = { ...input.cities };
  const forces = { ...input.forces };
  const officers = { ...input.officers };
  const entries: ReportEntry[] = [];

  // Pick at most one cult per season.
  const ripe = Object.values(cities).filter(
    (c) => c.ownerForceId !== null && c.loyalty < 35 && c.population > 50_000,
  );
  if (ripe.length === 0) return { cities, forces, officers, entries };

  if (input.rng() > 0.06) return { cities, forces, officers, entries };

  const target = ripe[Math.floor(input.rng() * ripe.length)];

  // Pick cult flavor based on location heuristic.
  let cult: CultKind;
  if (target.terrain === 'mountain' || target.name.zh.includes('漢中')) cult = 'wudou';
  else if (input.date.year < 195) cult = 'huangtian';
  else cult = 'taiping';

  const label = CULT_LABEL[cult];
  const forceId = `cult-${cult}-${target.id}-${input.date.year}-${input.date.season}`;
  const leaderId = `cult-leader-${forceId}`;

  // Spawn synthesized cult leader officer.
  const leaderNameZh = cult === 'wudou' ? '師君' : cult === 'huangtian' ? '黃天大師' : '太平道師';
  const leaderNameEn = cult === 'wudou' ? 'Shijun' : cult === 'huangtian' ? 'Yellow-Heaven Master' : 'Great-Peace Master';
  officers[leaderId] = {
    id: leaderId,
    name: { en: leaderNameEn, zh: leaderNameZh },
    birthYear: input.date.year - 40,
    stats: { leadership: 65, war: 55, intelligence: 75, politics: 50, charisma: 88 },
    loyalty: 100,
    locationCityId: target.id,
    forceId,
    status: 'idle',
    task: null,
    equipment: [],
    skills: [],
    rank: 'general',
  };

  const cultForce: Force = {
    id: forceId,
    name: { en: label.en, zh: label.zh },
    color: label.color,
    capitalCityId: target.id,
    rulerOfficerId: leaderId,
    isPlayer: false,
  };
  forces[forceId] = cultForce;

  // City switches to cult ownership.
  cities[target.id] = {
    ...target,
    ownerForceId: forceId,
    loyalty: 65, // believers
    troops: Math.max(2_000, Math.floor(target.troops * 0.6)),
    population: Math.max(20_000, Math.floor(target.population * 0.85)),
  };

  entries.push({
    cityId: target.id,
    kind: 'rebellion',
    text: `${label.zh}起義 — ${target.name.zh} falls to the ${label.zh}（${label.en}）movement. The faithful rally; ${cities[target.id].troops.toLocaleString()} soldiers under arms.`,
    textZh: `${label.zh}起義 — ${target.name.zh}為${label.zh}所據，信眾雲集，揭竿者${cities[target.id].troops.toLocaleString()}人。`,
  });

  return { cities, forces, officers, entries };
}
