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
  /** §8.4-deep 宣撫 — standing missions (officerId → posting); a posted
   *  envoy stiffens his city against the contagion. */
  pacifyMissions?: Record<EntityId, PacifyMission>;
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

/** §8.4-deep 宣撫 — an officer posted to a threatened city to steady the
 *  faithful (stacks with the 道觀; decays each season). */
export interface PacifyMission {
  cityId: EntityId;
  seasonsLeft: number;
}

export const PACIFY_MISSION_COST = 200;
export const PACIFY_MISSION_SEASONS = 2;

/** The contagion resistance a posted envoy contributes (rides charisma). */
export function pacifierResist(charisma: number): number {
  return Math.min(0.9, 0.4 + charisma / 300);
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
      let cultResist = buildingBonuses(adjId, input.buildings ?? []).cultResist;
      // 宣撫 — a posted envoy preaches the court's case in the market square.
      let pacified = false;
      for (const [oid, m] of Object.entries(input.pacifyMissions ?? {})) {
        if (m.cityId !== adjId || m.seasonsLeft <= 0) continue;
        const envoy = officers[oid];
        if (envoy && envoy.status !== 'dead') {
          cultResist = Math.min(0.95, cultResist + pacifierResist(envoy.stats.charisma));
          pacified = true;
        }
      }
      const drop = Math.round(baseDrop * (1 - cultResist));
      cities[adjId] = { ...adj, loyalty: Math.max(0, cities[adjId].loyalty - drop) };
      // A city under a pacifier's hand will not rise this season.
      if (!pacified && cities[adjId].loyalty < 22 && cities[adjId].population > 40_000) {
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

// ── §8.4-deep 招安歸正 — the Zhang Lu model ──

export const CULT_PACIFY_GOLD = 800;

/** 招安 odds — an eloquent envoy, a legitimate court, a one-city sect. */
export function cultPacifyChance(args: {
  envoyCharisma: number;
  cultCityCount: number;
  cultTroops: number;
  mandate: number;
}): number {
  let p = 0.22 + args.envoyCharisma / 250;
  p += args.cultCityCount === 1 ? 0.18 : -0.08 * (args.cultCityCount - 1);
  if (args.mandate >= 60) p += 0.08;
  if (args.cultTroops > 15_000) p -= 0.1;
  return Math.max(0.05, Math.min(0.85, p));
}

export interface CultPacifyResult {
  success: boolean;
  /** On failure: the envoy is seized and held in the cult capital. */
  envoySeized: boolean;
  messageZh: string;
}

/** Resolve a 招安 attempt (pure roll; the store applies city/officer flips).
 *  Success: every cult city and every cult officer (the 師君 included) comes
 *  over — 張魯舉漢中而降 in miniature. Failure hardens the sect, and may cost
 *  the envoy his freedom. */
export function resolveCultPacify(args: {
  cultForce: Force;
  envoy: Officer;
  cultCityCount: number;
  cultTroops: number;
  mandate: number;
  rng: () => number;
}): CultPacifyResult {
  const chance = cultPacifyChance({
    envoyCharisma: args.envoy.stats.charisma,
    cultCityCount: args.cultCityCount,
    cultTroops: args.cultTroops,
    mandate: args.mandate,
  });
  if (args.rng() < chance) {
    return {
      success: true,
      envoySeized: false,
      messageZh: `${args.envoy.name.zh}單車入營,陳說禍福 — ${args.cultForce.name.zh}焚符水、開城歸命!信眾編戶,教主拜於階下。`,
    };
  }
  const seized = args.rng() < 0.25;
  return {
    success: false,
    envoySeized: seized,
    messageZh: seized
      ? `${args.cultForce.name.zh}斥為妖言,扣押使者${args.envoy.name.zh}!賊勢愈熾。`
      : `${args.cultForce.name.zh}不納招安,逐使者出營 — 裹脅之眾反增。`,
  };
}

// ── §8.4-deep 黃巾總爆發 — the year 184 ──

export const YELLOW_TURBAN_YEAR = 184;
export const YELLOW_TURBAN_FLAG = 'yellow-turban-risen';
/** The Zhang brothers, if the scenario carries them. */
export const YELLOW_TURBAN_LEADERS = ['zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt'];

/**
 * 蒼天已死,黃天當立 — in the spring of 184 the Way of Great Peace rises in
 * EIGHT provinces at once. Up to four of the realm's most restless great
 * cities flip to a single 太平道 banner under Zhang Jiao (or a synthesized
 * 大賢良師 if the scenario lacks him). Fires once, only in campaigns that
 * begin before the rising.
 */
export function rollYellowTurbanRising(
  input: ReligionInput & { eventFlags: Record<string, boolean> },
): ReligionOutput & { flagSet: boolean } {
  const none = { cities: input.cities, forces: input.forces, officers: input.officers, entries: [], flagSet: false };
  if (input.eventFlags[YELLOW_TURBAN_FLAG]) return none;
  if (input.date.year !== YELLOW_TURBAN_YEAR) return none;
  if (input.date.season !== 'spring' && input.date.season !== 'summer') return none;
  // 黃巾之亂 scenario — Zhang Jiao already leads a playable force at start;
  // the rising has ALREADY happened. Don't conjure a second Great Peace
  // banner (or poach its ruler).
  const zj = input.officers[YELLOW_TURBAN_LEADERS[0]];
  if (zj && zj.forceId) return none;

  const cities = { ...input.cities };
  const forces = { ...input.forces };
  const officers = { ...input.officers };
  const entries: ReportEntry[] = [];

  // The most combustible big cities — low loyalty, many mouths.
  const targets = Object.values(cities)
    .filter((c) => c.ownerForceId !== null && c.population > 60_000 && c.loyalty < 70)
    .sort((a, b) => a.loyalty - b.loyalty)
    .slice(0, 4);
  if (targets.length === 0) return none;

  const label = CULT_LABEL.taiping;
  const forceId = 'cult-taiping-184';

  // 大賢良師 — Zhang Jiao if he walks this scenario, else a stand-in.
  let rulerId = YELLOW_TURBAN_LEADERS[0];
  const zhangJiao = officers[rulerId];
  if (zhangJiao && zhangJiao.status !== 'dead') {
    officers[rulerId] = {
      ...zhangJiao,
      forceId,
      locationCityId: targets[0].id,
      status: 'idle',
      loyalty: 100,
      task: null,
    };
  } else {
    rulerId = 'cult-leader-taiping-184';
    officers[rulerId] = {
      id: rulerId,
      name: { en: 'Great Teacher', zh: '大賢良師' },
      birthYear: input.date.year - 44,
      stats: { leadership: 78, war: 55, intelligence: 85, politics: 70, charisma: 96 },
      loyalty: 100,
      locationCityId: targets[0].id,
      forceId,
      status: 'idle',
      task: null,
      equipment: [],
      skills: [],
      rank: 'general',
    };
  }
  // The brothers ride to the other risen cities.
  for (let i = 1; i < YELLOW_TURBAN_LEADERS.length && i < targets.length; i++) {
    const bro = officers[YELLOW_TURBAN_LEADERS[i]];
    if (bro && bro.status !== 'dead') {
      officers[bro.id] = {
        ...bro,
        forceId,
        locationCityId: targets[i].id,
        status: 'idle',
        loyalty: 100,
        task: null,
      };
    }
  }

  forces[forceId] = {
    id: forceId,
    name: { en: 'Way of Great Peace', zh: label.zh },
    color: label.color,
    capitalCityId: targets[0].id,
    rulerOfficerId: rulerId,
    isPlayer: false,
  };

  for (const t of targets) {
    cities[t.id] = {
      ...cities[t.id],
      ownerForceId: forceId,
      loyalty: 70,
      troops: Math.max(3_000, Math.floor(t.troops * 0.7) + 3_000),
      population: Math.max(20_000, Math.floor(t.population * 0.9)),
    };
  }

  entries.push({
    cityId: targets[0].id,
    kind: 'rebellion',
    text: `"The Azure Sky is dead!" — the Way of Great Peace rises in ${targets.length} cities at once. The Yellow Turban rebellion has begun.`,
    textZh: `「蒼天已死,黃天當立;歲在甲子,天下大吉!」— 太平道八州並起,${targets.map((t) => t.name.zh).join('、')}同日舉義,黃巾之亂爆發!`,
  });

  return { cities, forces, officers, entries, flagSet: true };
}
