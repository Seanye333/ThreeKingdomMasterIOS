import type {
  City,
  EntityId,
  Officer,
  ReportEntry,
  Season,
} from '../types';

export interface EventsInput {
  season: Season;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  /** 防災工程 — granary/infirmary/levee levels mitigate disasters. */
  buildings?: import('../types').Building[];
  rng: () => number;
  /** 天災頻率 — multiplier on famine/plague/flood chances. Default 1. */
  disasterMul?: number;
  /** §8.2-deep 賑災 — disasters in this force's cities queue relief prompts;
   *  AI-owned cities self-relieve when their granaries allow. */
  playerForceId?: EntityId | null;
  /** §8.2-deep 大災之後必有大疫 — cities struck by flood/famine/quake LAST
   *  season carry 3× plague odds this season. */
  plagueRiskCityIds?: EntityId[];
}

/** §8.2-deep — a disaster the player may still answer (開倉賑濟/徙民/坐視). */
export interface ReliefPrompt {
  cityId: EntityId;
  kind: 'famine' | 'plague' | 'flood' | 'quake';
}

export interface EventsOutput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  entries: ReportEntry[];
  /** §8.2-deep 賑災 — player cities awaiting a relief decision this season. */
  reliefPrompts: ReliefPrompt[];
  /** §8.2-deep 地動 — buildings toppled a level by this season's earthquakes. */
  buildingLevelDrops: Array<{ cityId: EntityId; buildingId: string }>;
  /** §8.2-deep — every city struck by flood/famine/quake this season (any
   *  owner); they carry elevated plague odds NEXT season. */
  struckCityIds: EntityId[];
}

const REBELLION_CHANCE = 0.12; // when loyalty < 30
const HARVEST_BOON_CHANCE = 0.12; // autumn only
const FAMINE_CHANCE = 0.02;
const PLAGUE_CHANCE = 0.01;
const FLOOD_CHANCE = 0.02; // summer only — the rivers rise
const QUAKE_CHANCE = 0.008; // 地動 — rare, terrain-biased (mountains ×2.5)
const WANDERING_TALENT_CHANCE = 0.18; // overall, per season

export function rollEvents(input: EventsInput): EventsOutput {
  const cities = { ...input.cities };
  let officers = { ...input.officers };
  // 防災工程 — building levels per city (granary/infirmary/levee).
  const worksLevel = (cityId: EntityId, id: string): number =>
    input.buildings?.find((b) => b.cityId === cityId && b.id === id)?.level ?? 0;
  const entries: ReportEntry[] = [];
  const reliefPrompts: ReliefPrompt[] = [];
  const buildingLevelDrops: Array<{ cityId: EntityId; buildingId: string }> = [];
  const struckCityIds: EntityId[] = [];
  const plagueRisk = new Set(input.plagueRiskCityIds ?? []);
  // 天災頻率 — scales famine/plague/flood likelihood (after works mitigation).
  const dm = input.disasterMul ?? 1;
  // 靈台 — the astronomers' warnings steady the populace: disaster LOYALTY
  // hits in a 靈台 city shrink 25% per level (the physical loss stands).
  const loyaltyHit = (cityId: EntityId, base: number): number =>
    Math.round(base * (1 - 0.25 * Math.min(3, worksLevel(cityId, 'lingtai'))));
  // §8.2-deep — the aftermath: player cities queue a relief decision; a
  // provisioned AI court opens its own granaries on the spot (half the
  // loyalty hit, at a price in food). Returns the loyalty delta to apply.
  const afterDisaster = (
    c: City,
    kind: ReliefPrompt['kind'],
    baseLoyaltyLoss: number,
  ): { loyaltyLoss: number; foodSpent: number } => {
    // 大災之後必有大疫 — a struck city breeds next season's pestilence.
    if (kind !== 'plague') struckCityIds.push(c.id);
    const shielded = loyaltyHit(c.id, baseLoyaltyLoss);
    if (c.ownerForceId && c.ownerForceId === input.playerForceId) {
      reliefPrompts.push({ cityId: c.id, kind });
      return { loyaltyLoss: shielded, foodSpent: 0 };
    }
    const cost = Math.max(300, Math.floor(c.population / 40));
    if (c.ownerForceId && c.food > c.population / 20 && input.rng() < 0.6) {
      return { loyaltyLoss: Math.floor(shielded / 2), foodSpent: cost };
    }
    return { loyaltyLoss: shielded, foodSpent: 0 };
  };

  // Per-city rolls.
  for (const c of Object.values(cities)) {
    // Rebellion: unrest pushes the city to neutrality.
    if (c.ownerForceId && c.loyalty < 30 && input.rng() < REBELLION_CHANCE) {
      cities[c.id] = {
        ...c,
        ownerForceId: null,
        loyalty: 20,
        troops: Math.floor(c.troops * 0.5),
      };
      entries.push({
        cityId: c.id,
        kind: 'rebellion',
        text: `${c.name.en} rises in revolt! The city throws off its ruler and becomes independent.`,
        textZh: `${c.name.zh}揭竿而起，民眾驅逐其主，城遂自立。`,
      });
      continue; // skip other events this turn
    }

    // Bumper harvest: autumn only.
    if (
      input.season === 'autumn' &&
      c.agriculture > 0 &&
      input.rng() < HARVEST_BOON_CHANCE
    ) {
      const bonus = Math.floor((c.agriculture * c.population) / 1500);
      cities[c.id] = { ...cities[c.id], food: cities[c.id].food + bonus };
      entries.push({
        cityId: c.id,
        kind: 'harvest',
        text: `Bumper harvest at ${c.name.en}! +${bonus} bonus food.`,
        textZh: `${c.name.zh}大豐收！額外糧食 +${bonus}。`,
      });
      continue;
    }

    // Flood: summer only — the river takes grain and walls alike.
    // Levees cut the odds by a third per level; a L3 levee is immune.
    {
      // 堤防 levee building + 治水 hand-built flood works both count toward the
      // immunity cap (3): each "level" cuts the odds by a third.
      const levee = Math.min(3, worksLevel(c.id, 'levee') + (c.floodWorks ?? 0));
      if (
        input.season === 'summer' &&
        levee < 3 &&
        input.rng() < FLOOD_CHANCE * dm * (1 - levee / 3)
      ) {
        const lost = Math.floor(cities[c.id].food * 0.3);
        const relief = afterDisaster(cities[c.id], 'flood', 4);
        cities[c.id] = {
          ...cities[c.id],
          food: Math.max(0, cities[c.id].food - lost - relief.foodSpent),
          defense: Math.max(0, cities[c.id].defense - 8),
          loyalty: Math.max(0, cities[c.id].loyalty - relief.loyaltyLoss),
        };
        entries.push({
          cityId: c.id,
          kind: 'flood',
          text: `The river floods ${c.name.en}. ${lost.toLocaleString()} food washed away; defenses damaged.`,
          textZh: `${c.name.zh}河水決堤,糧食損失 ${lost.toLocaleString()},城防受創。`,
        });
        continue;
      }
    }

    // 地動 — the earth shakes. Walls crack, roofs fall, works topple a level;
    // mountain cities sit closest to the fault. 靈台 steadies the people.
    {
      const quakeChance =
        QUAKE_CHANCE * dm * (c.terrain === 'mountain' ? 2.5 : 1);
      if (input.rng() < quakeChance) {
        const cur = cities[c.id];
        const defLost = 10 + Math.floor(input.rng() * 10);
        const troopLost = Math.floor(cur.troops * 0.02);
        const foodLost = Math.floor(cur.food * 0.05);
        const relief = afterDisaster(cur, 'quake', 6);
        cities[c.id] = {
          ...cur,
          defense: Math.max(0, cur.defense - defLost),
          troops: Math.max(0, cur.troops - troopLost),
          food: Math.max(0, cur.food - foodLost - relief.foodSpent),
          loyalty: Math.max(0, cur.loyalty - relief.loyaltyLoss),
        };
        // Up to two built structures each lose a level in the rubble.
        const built = (input.buildings ?? []).filter(
          (b) => b.cityId === c.id && b.level > 0,
        );
        const toppleCount = Math.min(built.length, 1 + (input.rng() < 0.5 ? 1 : 0));
        for (let i = 0; i < toppleCount; i++) {
          const idx = Math.floor(input.rng() * built.length);
          const [hit] = built.splice(idx, 1);
          if (hit) buildingLevelDrops.push({ cityId: c.id, buildingId: hit.id });
        }
        entries.push({
          cityId: c.id,
          kind: 'quake',
          text: `The earth shakes at ${c.name.en}! Walls crack (−${defLost} defense)${toppleCount ? `, ${toppleCount} structure(s) damaged` : ''}.`,
          textZh: `${c.name.zh}地動山搖!城垣崩裂(城防 −${defLost})${toppleCount ? `,${toppleCount} 處工事傾頹` : ''},民情惶惶。`,
        });
        continue;
      }
    }

    // Famine: spoiled stores / drought. Granaries blunt both odds and loss.
    const granary = worksLevel(c.id, 'granary');
    if (cities[c.id].food > 0 && input.rng() < FAMINE_CHANCE * dm * (1 - 0.2 * granary)) {
      const lost = Math.floor(cities[c.id].food * 0.4 * (1 - 0.25 * granary));
      const relief = afterDisaster(cities[c.id], 'famine', 5);
      cities[c.id] = {
        ...cities[c.id],
        food: Math.max(0, cities[c.id].food - lost - relief.foodSpent),
        loyalty: Math.max(0, cities[c.id].loyalty - relief.loyaltyLoss),
      };
      entries.push({
        cityId: c.id,
        kind: 'famine',
        text: `Famine strikes ${c.name.en}. ${lost.toLocaleString()} food lost; loyalty −5.`,
        textZh: `${c.name.zh}饑荒肆虐，損失糧食 ${lost.toLocaleString()}，民忠 −5。`,
      });
      continue;
    }

    // Plague: hits population & troops. Infirmaries quarantine and treat.
    const infirmary = worksLevel(c.id, 'infirmary');
    if (
      cities[c.id].population > 50_000 &&
      input.rng() < PLAGUE_CHANCE * dm * (1 - 0.25 * infirmary) * (plagueRisk.has(c.id) ? 3 : 1)
    ) {
      const popLost = Math.floor(cities[c.id].population * 0.1 * (1 - 0.25 * infirmary));
      const troopLost = Math.floor(cities[c.id].troops * 0.05 * (1 - 0.25 * infirmary));
      const relief = afterDisaster(cities[c.id], 'plague', 5);
      cities[c.id] = {
        ...cities[c.id],
        population: cities[c.id].population - popLost,
        troops: Math.max(0, cities[c.id].troops - troopLost),
        food: Math.max(0, cities[c.id].food - relief.foodSpent),
        loyalty: Math.max(0, cities[c.id].loyalty - relief.loyaltyLoss),
      };
      entries.push({
        cityId: c.id,
        kind: 'plague',
        text: `Plague at ${c.name.en}. −${popLost.toLocaleString()} population, −${troopLost.toLocaleString()} troops.`,
        textZh: `${c.name.zh}瘟疫橫行，人口 −${popLost.toLocaleString()}，兵員 −${troopLost.toLocaleString()}。`,
      });
    }
  }

  // Global event: wandering talent appears at an inn / tavern / market.
  if (input.rng() < WANDERING_TALENT_CHANCE) {
    const unsearched = Object.values(officers).filter(
      (o) => o.status === 'unsearched',
    );
    const occupiedCities = Object.values(cities).filter(
      (c) => c.ownerForceId !== null,
    );
    if (unsearched.length > 0 && occupiedCities.length > 0) {
      const officer = unsearched[Math.floor(input.rng() * unsearched.length)];
      const city =
        occupiedCities[Math.floor(input.rng() * occupiedCities.length)];
      officers = {
        ...officers,
        [officer.id]: {
          ...officer,
          status: 'idle',
          locationCityId: city.id,
          forceId: null,
          loyalty: 0,
        },
      };
      const encounter = rollInnEncounter(officer, city, input.rng);
      entries.push({
        cityId: city.id,
        kind: 'talent',
        text: encounter.en,
        textZh: encounter.zh,
      });
    }
  }

  return { cities, officers, entries, reliefPrompts, buildingLevelDrops, struckCityIds };
}

// ── §8.2-deep 建安大疫 — the Great Plague of 217 ──

export const GREAT_PLAGUE_YEAR = 217;
export const GREAT_PLAGUE_FLAG = 'jianan-plague';
/** 建安七子 taken by the winter of 217 (孔融/阮瑀 were already gone). */
export const GREAT_PLAGUE_VICTIMS = ['wang-can', 'chen-lin', 'xu-gan', 'ying-yang', 'liu-zhen'];

/**
 * 建安二十二年,大疫 — the empire-wide pestilence of 217. Every city bleeds
 * population, troops and heart (醫館/靈台 blunt their shares); the surviving
 * masters of the Jian'an literary age die in a single winter. Fires once,
 * winter 217 only.
 */
export function rollGreatPlague(input: {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  date: { year: number; season: Season };
  buildings?: import('../types').Building[];
  eventFlags: Record<string, boolean>;
  rng: () => number;
}): {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  entries: ReportEntry[];
  flagSet: boolean;
} {
  const none = { cities: input.cities, officers: input.officers, entries: [], flagSet: false };
  if (input.eventFlags[GREAT_PLAGUE_FLAG]) return none;
  if (input.date.year !== GREAT_PLAGUE_YEAR || input.date.season !== 'winter') return none;

  const worksLevel = (cityId: EntityId, id: string): number =>
    input.buildings?.find((b) => b.cityId === cityId && b.id === id)?.level ?? 0;

  const cities = { ...input.cities };
  const officers = { ...input.officers };
  const entries: ReportEntry[] = [];

  for (const c of Object.values(cities)) {
    const infirmary = worksLevel(c.id, 'infirmary');
    const keep = 1 - 0.2 * infirmary;
    const lingtai = Math.min(3, worksLevel(c.id, 'lingtai'));
    cities[c.id] = {
      ...c,
      population: Math.max(0, c.population - Math.floor(c.population * (0.05 + input.rng() * 0.03) * keep)),
      troops: Math.max(0, c.troops - Math.floor(c.troops * 0.04 * keep)),
      loyalty: Math.max(0, c.loyalty - Math.round(4 * (1 - 0.25 * lingtai))),
    };
  }

  const fallen: string[] = [];
  for (const oid of GREAT_PLAGUE_VICTIMS) {
    const o = officers[oid];
    if (o && o.status !== 'dead') {
      officers[oid] = { ...o, status: 'dead', forceId: null, task: null };
      fallen.push(o.name.zh);
    }
  }

  entries.push({
    cityId: null,
    kind: 'plague',
    text: `The Great Plague of 217 sweeps every province. ${fallen.length ? `The Jian'an masters — ${fallen.join(', ')} — die within the season.` : ''}`,
    textZh: `建安二十二年,大疫 — 家家有僵屍之痛,室室有號泣之哀。${fallen.length ? `${fallen.join('、')}相繼殞於斯疫,建安風骨,一冬凋零。` : ''}`,
  });

  return { cities, officers, entries, flagSet: true };
}

// ── §8.2-deep 賑災 — answering a disaster ──
export const RELIEF_LOYALTY_BONUS = 9;
export const RELIEF_IGNORE_LOYALTY_LOSS = 5;
export const RELIEF_MIGRATE_SHARE = 0.08;

/** 開倉賑濟 food cost for a city (scaled to mouths to feed). */
export function reliefFoodCost(city: City): number {
  return Math.max(500, Math.floor(city.population / 40));
}

// ── Inn / tavern / wandering-swordsman flavor variations ──
// Picks a vignette based on the officer's stat profile so a strategist gets
// a teahouse meeting and a warrior gets a tavern brawl.
function rollInnEncounter(
  officer: Officer,
  city: City,
  rng: () => number,
): { en: string; zh: string } {
  const w = officer.stats.war;
  const i = officer.stats.intelligence;
  const c = officer.stats.charisma;
  const profile: 'warrior' | 'strategist' | 'gentry' | 'wanderer' =
    w >= 80 ? 'warrior' :
    i >= 80 ? 'strategist' :
    c >= 80 ? 'gentry' : 'wanderer';

  const cityZh = city.name.zh;
  const oZh = officer.name.zh;
  const oEn = officer.name.en;

  const variants: Record<typeof profile, Array<{ en: string; zh: string }>> = {
    warrior: [
      {
        en: `酒家相鬥 — A brawl at a ${cityZh} tavern catches your eye; ${oZh}（${oEn}） stands over three felled bandits. He's now waiting in the city for a patron.`,
        zh: `酒家相鬥 — ${cityZh}酒肆之中起一場群鬥，${oZh}獨立於三名倒地賊寇之上，現於城中靜候明主。`,
      },
      {
        en: `市井遊俠 — A masked sword-stranger ${oZh}（${oEn}） has appeared in ${cityZh}'s market, looking for service.`,
        zh: `市井遊俠 — 蒙面劍客${oZh}現身${cityZh}市集，欲尋主效命。`,
      },
      {
        en: `校場試武 — Word reaches ${cityZh} that a wandering swordsman ${oZh}（${oEn}） has bested every challenger at the parade ground. He awaits a recruiter.`,
        zh: `校場試武 — ${cityZh}傳來消息，遊俠${oZh}於校場連敗群雄，正待人延攬。`,
      },
    ],
    strategist: [
      {
        en: `茶肆論策 — At a quiet teahouse in ${cityZh}, a young scholar ${oZh}（${oEn}） debates the classics. His arguments draw a crowd.`,
        zh: `茶肆論策 — ${cityZh}靜謐茶肆之內，少年儒生${oZh}縱論經史，引眾人駐足。`,
      },
      {
        en: `客棧夜談 — A traveler ${oZh}（${oEn}） staying at a ${cityZh} inn shares uncanny insight on border affairs.`,
        zh: `客棧夜談 — 旅人${oZh}夜宿${cityZh}客棧，論及邊事見解非凡。`,
      },
      {
        en: `書院偶遇 — At the ${cityZh} academy, a recluse ${oZh}（${oEn}） has been quietly tutoring students. He may be persuaded to serve.`,
        zh: `書院偶遇 — ${cityZh}書院之中，隱士${oZh}默授生徒，或可勸其出仕。`,
      },
    ],
    gentry: [
      {
        en: `名士來訪 — Local elders introduce ${oZh}（${oEn}） — a young man of refinement and family — now lodging in ${cityZh}.`,
        zh: `名士來訪 — 鄉中父老引見${oZh}，乃名門之後、風雅之士，現寓居${cityZh}。`,
      },
      {
        en: `酒席投帖 — At a ${cityZh} banquet, ${oZh}（${oEn}） presents his card. The host is impressed.`,
        zh: `酒席投帖 — ${cityZh}宴席之上，${oZh}遞上名帖，主人甚為傾倒。`,
      },
    ],
    wanderer: [
      {
        en: `客棧偶遇 — A traveler ${oZh}（${oEn}） has put up at an inn in ${cityZh}, seeking employment.`,
        zh: `客棧偶遇 — 旅人${oZh}投宿${cityZh}客棧，欲謀一職。`,
      },
      {
        en: `渡頭逢人 — At the ${cityZh} ferry-landing, you meet ${oZh}（${oEn}）, a wanderer of curious bearing.`,
        zh: `渡頭逢人 — ${cityZh}渡口之畔，偶遇${oZh}，行止不凡。`,
      },
      {
        en: `市集打聽 — Rumors in the ${cityZh} market speak of a stranger ${oZh}（${oEn}） looking for a lord.`,
        zh: `市集打聽 — ${cityZh}市集傳言，異客${oZh}正尋訪明主。`,
      },
    ],
  };
  const pool = variants[profile];
  return pool[Math.floor(rng() * pool.length)];
}
