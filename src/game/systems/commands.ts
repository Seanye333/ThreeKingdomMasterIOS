import type {
  City,
  CommandType,
  EntityId,
  InternalAffairsType,
  Officer,
  ReportEntry,
} from '../types';
import { ITEMS_BY_ID } from '../data/items';
import { cityStatCap, cityEconCap, citySize, CITY_SIZES, type CitySize } from './citySize';
import { internalAffairsMultiplier } from './traitEffects';

export interface CommandDef {
  type: CommandType;
  label: { en: string; zh: string };
  stat: keyof Officer['stats'];
  goldCost: number;
  description: string;
  /** Minimum city size tier required to issue this command. Default: hamlet (all). */
  minSize?: CitySize;
}

/** Index of city sizes (邑=0 ... 都=4) for tier comparisons. */
const SIZE_RANK: Record<CitySize, number> = Object.fromEntries(
  CITY_SIZES.map((s, i) => [s.id, i]),
) as Record<CitySize, number>;
export function meetsMinSize(citySizeId: CitySize, minSize?: CitySize): boolean {
  if (!minSize) return true;
  return SIZE_RANK[citySizeId] >= SIZE_RANK[minSize];
}

export const COMMAND_DEFS: Record<CommandType, CommandDef> = {
  'develop-agriculture': {
    type: 'develop-agriculture',
    label: { en: 'Develop Agriculture', zh: '農業開発' },
    stat: 'politics',
    goldCost: 300,
    description:
      'Raise the agriculture rating. Effect scales with the assigned officer’s Politics. Improves food production at autumn harvest.',
  },
  'develop-commerce': {
    type: 'develop-commerce',
    label: { en: 'Develop Commerce', zh: '商業開発' },
    stat: 'politics',
    goldCost: 300,
    description:
      'Raise the commerce rating. Effect scales with Politics. Increases seasonal gold income.',
  },
  'build-defense': {
    type: 'build-defense',
    label: { en: 'Build Defense', zh: '城壁修築' },
    stat: 'politics',
    goldCost: 400,
    description:
      'Reinforce city walls. Effect scales with Politics. Reduces casualties when sieged.',
  },
  'recruit-troops': {
    type: 'recruit-troops',
    label: { en: 'Recruit Troops', zh: '徴兵' },
    stat: 'charisma',
    goldCost: 500,
    description:
      'Recruit soldiers from the population. Number scales with Charisma. Reduces population.',
  },
  'improve-loyalty': {
    type: 'improve-loyalty',
    label: { en: 'Pacify People', zh: '民忠安撫' },
    stat: 'charisma',
    goldCost: 200,
    description:
      'Distribute aid to raise public loyalty. Effect scales with Charisma.',
  },
  search: {
    type: 'search',
    label: { en: 'Search for Talent', zh: '人材探訪' },
    stat: 'charisma',
    // Free, per RTK convention — searching costs the officer's season, not
    // the treasury. Encourages talent-hunting even in a cash crunch.
    goldCost: 0,
    description:
      'Send the officer to scour the city for unknown talent. Charisma decides success. Discovered officers appear as free agents in this city.',
  },
  // ── Tier-2 mass development (requires city ≥ 城 City) ──
  'major-agriculture': {
    type: 'major-agriculture',
    label: { en: 'Mass Agriculture', zh: '大農政' },
    stat: 'politics',
    goldCost: 800,
    minSize: 'city',
    description:
      '大農政 — Triple-strength agriculture push. Costs 800g but gains 3× over basic. Requires 城 (City) tier.',
  },
  'major-commerce': {
    type: 'major-commerce',
    label: { en: 'Mass Commerce', zh: '大商政' },
    stat: 'politics',
    goldCost: 800,
    minSize: 'city',
    description:
      '大商政 — Triple-strength commerce drive. Costs 800g, +3× over basic. Requires 城 tier.',
  },
  'major-defense': {
    type: 'major-defense',
    label: { en: 'Mass Fortification', zh: '大築城' },
    stat: 'politics',
    goldCost: 1000,
    minSize: 'city',
    description:
      '大築城 — Massive fortification project. 1000g, +3× defense over basic. Requires 城 tier.',
  },
  'encourage-migration': {
    type: 'encourage-migration',
    label: { en: 'Encourage Migration', zh: '招撫流民' },
    stat: 'charisma',
    goldCost: 400,
    description:
      '招撫流民 — Welcome refugees and migrants. Boosts population, which advances the city size tier when thresholds are crossed.',
  },
  'upgrade-wall': {
    type: 'upgrade-wall',
    label: { en: 'Upgrade Walls', zh: '城壁強化' },
    stat: 'politics',
    goldCost: 1500,
    minSize: 'city',
    description:
      '城壁強化 — Upgrade fortification tier (1→2→3). Tier 2 = inner wall +18% def; Tier 3 = citadel like 合肥/長安/洛陽 +40% def. Massive gold cost, can only be done at 城 tier+.',
  },
  garrison: {
    type: 'garrison',
    label: { en: 'Garrison', zh: '鎮守' },
    stat: 'leadership',
    goldCost: 150,
    description:
      '鎮守 — Drive enemy raiders out of the territory cells surrounding this city and reinforce its defense. Effect scales with Leadership. Useful when an enemy column has captured nearby ground.',
  },
  march: {
    type: 'march',
    label: { en: 'March', zh: '出陣' },
    stat: 'leadership',
    goldCost: 100,
    description:
      'March troops to an adjacent city. If enemy-held, battle ensues. Leadership commands the army; War wins the fight.',
  },
};

export interface CommandResult {
  success: boolean;
  delta: Partial<{
    agriculture: number;
    commerce: number;
    defense: number;
    troops: number;
    population: number;
    loyalty: number;
    wallTier: 1 | 2 | 3;
  }>;
  message: string;
  messageZh: string;
}

export function resolveInternalAffairs(
  type: Exclude<InternalAffairsType, 'search' | 'garrison'>,
  officer: Officer,
  city: City,
  rng: () => number,
  bonus?: { internalMultiplier?: number; recruitBonus?: number },
): CommandResult {
  const def = COMMAND_DEFS[type];
  // Trait multiplier (diligent +20%, lazy −20%, specialist +20% for matching
  // category, etc.) scales the effective stat so the output gain reflects it.
  const traitMul = internalAffairsMultiplier(officer, type);
  // Civic-title force bonus: 太守/丞相/司徒 multiply the effective stat for
  // internal-affairs commands; 刺史/丞相 add a flat recruit bonus.
  const titleMul = type === 'recruit-troops'
    ? 1 + (bonus?.recruitBonus ?? 0)
    : (bonus?.internalMultiplier ?? 1);
  const statValue = Math.round(officer.stats[def.stat] * traitMul * titleMul);

  const size = citySize(city);
  const cap = cityStatCap(city);      // defense ceiling
  const econCap = cityEconCap(city); // agriculture & commerce ceiling

  switch (type) {
    case 'develop-agriculture': {
      const gain = applyDevelopment(city.agriculture, statValue, rng, econCap);
      const econCapHit = city.agriculture + gain >= econCap && gain === 0;
      return {
        success: gain > 0,
        delta: { agriculture: gain },
        message: econCapHit
          ? `${officer.name.en}: Agriculture already at ${size.name.zh}'s cap (${econCap}). Promote the city first.`
          : `${officer.name.en} raised Agriculture by ${gain} (now ${city.agriculture + gain}/${econCap}).`,
        messageZh: econCapHit
          ? `${officer.name.zh}:農業已達${size.name.zh}上限 (${econCap}),需先升城。`
          : `${officer.name.zh}勸農 +${gain} (現 ${city.agriculture + gain}/${econCap})。`,
      };
    }
    case 'develop-commerce': {
      const gain = applyDevelopment(city.commerce, statValue, rng, econCap);
      const econCapHit = city.commerce + gain >= econCap && gain === 0;
      return {
        success: gain > 0,
        delta: { commerce: gain },
        message: econCapHit
          ? `${officer.name.en}: Commerce already at ${size.name.zh}'s cap (${econCap}).`
          : `${officer.name.en} raised Commerce by ${gain} (now ${city.commerce + gain}/${econCap}).`,
        messageZh: econCapHit
          ? `${officer.name.zh}:商業已達${size.name.zh}上限 (${econCap})。`
          : `${officer.name.zh}興商 +${gain} (現 ${city.commerce + gain}/${econCap})。`,
      };
    }
    case 'build-defense': {
      const gain = applyDevelopment(city.defense, statValue, rng, cap);
      const capHit = city.defense + gain >= cap && gain === 0;
      return {
        success: gain > 0,
        delta: { defense: gain },
        message: capHit
          ? `${officer.name.en}: Defense already at ${size.name.zh}'s cap (${cap}).`
          : `${officer.name.en} reinforced Defense by ${gain} (now ${city.defense + gain}/${cap}).`,
        messageZh: capHit
          ? `${officer.name.zh}:城防已達${size.name.zh}上限 (${cap})。`
          : `${officer.name.zh}築城 +${gain} (現 ${city.defense + gain}/${cap})。`,
      };
    }
    case 'recruit-troops': {
      const max = Math.floor(statValue * 20) + 200;
      // City size also limits the per-action max so a Hamlet can't recruit huge armies.
      const sizeMax = Math.floor(size.troopCap / 10);
      const fromPop = Math.min(max, sizeMax, Math.floor(city.population / 100));
      const popDrawn = fromPop * 2;
      // 民怨 — conscription pulls men from the fields and breeds resentment, the
      // harder you levy relative to the populace the worse. Sustained recruiting
      // must be balanced with 撫民 or the city turns restive.
      const loyaltyHit = fromPop > 0
        ? Math.min(8, 1 + Math.round((popDrawn / Math.max(1, city.population)) * 250))
        : 0;
      return {
        success: fromPop > 0,
        delta: { troops: fromPop, population: -popDrawn, loyalty: loyaltyHit ? -loyaltyHit : 0 },
        message: `${officer.name.en} recruited ${fromPop} troops (${size.name.zh} cap ${sizeMax}/turn; population −${popDrawn}, loyalty −${loyaltyHit}).`,
        messageZh: `${officer.name.zh}徵兵 ${fromPop} 卒 (${size.name.zh}每季上限 ${sizeMax};民減 ${popDrawn},民忠 −${loyaltyHit})。`,
      };
    }
    case 'improve-loyalty': {
      const gain = Math.min(
        100 - city.loyalty,
        Math.max(1, Math.floor(statValue / 20) + Math.floor(rng() * 3)),
      );
      return {
        success: gain > 0,
        delta: { loyalty: gain },
        message: `${officer.name.en} raised Loyalty by ${gain} (now ${city.loyalty + gain}).`,
        messageZh: `${officer.name.zh}撫民,民忠 +${gain} (現 ${city.loyalty + gain})。`,
      };
    }
    case 'major-agriculture': {
      const gain = Math.min(econCap - city.agriculture, applyDevelopment(city.agriculture, statValue, rng, econCap) * 3);
      return {
        success: gain > 0,
        delta: { agriculture: gain },
        message: `${officer.name.en} 大農政: Agriculture +${gain} (now ${city.agriculture + gain}/${econCap}).`,
        messageZh: `${officer.name.zh}大農政:農業 +${gain} (現 ${city.agriculture + gain}/${econCap})。`,
      };
    }
    case 'major-commerce': {
      const gain = Math.min(econCap - city.commerce, applyDevelopment(city.commerce, statValue, rng, econCap) * 3);
      return {
        success: gain > 0,
        delta: { commerce: gain },
        message: `${officer.name.en} 大商政: Commerce +${gain} (now ${city.commerce + gain}/${econCap}).`,
        messageZh: `${officer.name.zh}大商政:商業 +${gain} (現 ${city.commerce + gain}/${econCap})。`,
      };
    }
    case 'major-defense': {
      const gain = Math.min(cap - city.defense, applyDevelopment(city.defense, statValue, rng, cap) * 3);
      return {
        success: gain > 0,
        delta: { defense: gain },
        message: `${officer.name.en} 大築城: Defense +${gain} (now ${city.defense + gain}/${cap}).`,
        messageZh: `${officer.name.zh}大築城:城防 +${gain} (現 ${city.defense + gain}/${cap})。`,
      };
    }
    case 'encourage-migration': {
      // Population boost proportional to charisma + small random.
      const base = Math.floor(statValue * 80) + 2000;
      const variance = Math.floor(rng() * 1500);
      const popGain = base + variance;
      return {
        success: true,
        delta: { population: popGain, loyalty: 1 },
        message: `${officer.name.en} 招撫流民: +${popGain.toLocaleString()} population (loyalty +1).`,
        messageZh: `${officer.name.zh}招撫流民:民眾 +${popGain.toLocaleString()} (民忠 +1)。`,
      };
    }
    case 'upgrade-wall': {
      const cur = city.wallTier ?? 1;
      if (cur >= 3) {
        return {
          success: false,
          delta: {},
          message: `${officer.name.en}: 城壁已達最高等級 (Tier 3 citadel).`,
          messageZh: `${officer.name.zh}:城壁已達最高等級 (堅城)。`,
        };
      }
      const next = (cur + 1) as 1 | 2 | 3;
      return {
        success: true,
        delta: { wallTier: next, defense: 5 },
        message: `${officer.name.en} 城壁強化: Wall tier ${cur} → ${next}. (+50% effective defense in siege).`,
        messageZh: `${officer.name.zh}城壁強化:城壁 ${cur} → ${next} 級 (圍城時防禦 +50%)。`,
      };
    }
  }
}

function applyDevelopment(current: number, stat: number, rng: () => number, cap: number): number {
  if (current >= cap) return 0;
  const base = Math.floor(stat / 20);
  const variance = Math.floor(rng() * 3);
  return Math.min(cap - current, base + variance + 1);
}

export interface LostItemRef {
  itemId: EntityId;
  cityId: EntityId;
}

export interface SearchInput {
  officer: Officer;
  city: City;
  officers: Record<EntityId, Officer>;
  lostItems: LostItemRef[];
  rng: () => number;
  /** Current year — talent below recruiting age (or not yet born) can't be
   *  found. As the campaign advances, more officers come of age naturally. */
  year?: number;
  /** 在野登場 — multiplier on the search success chance. Default 1. */
  successMul?: number;
}

/** Officers younger than this (in the current year) aren't discoverable yet. */
const MIN_RECRUIT_AGE = 15;

export interface SearchOutput {
  officers: Record<EntityId, Officer>;
  lostItems: LostItemRef[];
  entry: ReportEntry;
}

export function handleSearch(input: SearchInput): SearchOutput {
  const { officer, city, officers, lostItems, rng } = input;
  const successChance = Math.min(0.95, (officer.stats.charisma / 100) * (input.successMul ?? 1));
  const succeeded = rng() < successChance;

  if (!succeeded) {
    return {
      officers,
      lostItems,
      entry: {
        cityId: city.id,
        kind: 'command-failure',
        text: `${officer.name.en} found nothing of note in ${city.name.en}.`,
        textZh: `${officer.name.zh}於${city.name.zh}遍尋無獲。`,
      },
    };
  }

  // Items hidden in *this* city — 35% chance to find one when search succeeds.
  // Intelligence bumps the find rate.
  const itemsHere = lostItems.filter((li) => li.cityId === city.id);
  const itemFindRoll = rng();
  const itemFindChance = 0.35 + Math.max(0, (officer.stats.intelligence - 60) * 0.005);
  if (itemsHere.length > 0 && itemFindRoll < itemFindChance) {
    const found = itemsHere[Math.floor(rng() * itemsHere.length)];
    // Equip to the searching officer in the right slot if free; otherwise
    // it stays in the city as a free find (player can assign via Armoury).
    const item = ITEMS_BY_ID[found.itemId];
    const updatedOfficers = { ...officers };
    let equippedNote = '';
    let equippedNoteZh = '';
    if (item && officer.forceId !== null) {
      // No slot cap — the searcher simply keeps anything they find.
      updatedOfficers[officer.id] = {
        ...officer,
        equipment: [...officer.equipment, found.itemId],
      };
      equippedNote = ` ${officer.name.en} keeps it for themselves.`;
      equippedNoteZh = `${officer.name.zh}遂自珍藏之。`;
    }
    return {
      officers: updatedOfficers,
      lostItems: lostItems.filter((li) => li.itemId !== found.itemId),
      entry: {
        cityId: city.id,
        kind: 'talent',
        text: `${officer.name.en} unearthed ${item?.name.en ?? found.itemId} (${item?.name.zh ?? ''}) in ${city.name.en}!${equippedNote}`,
        textZh: `${officer.name.zh}於${city.name.zh}得${item?.name.zh ?? found.itemId}！${equippedNoteZh}`,
      },
    };
  }

  // Prefer officers whose historical hometown matches this city.
  // Officers without a hometown (locationCityId === null) form the fallback
  // pool — they can be discovered anywhere as before.
  const allUnsearched = Object.values(officers).filter(
    (o) => o.status === 'unsearched' &&
      // Not yet of age (or not yet born) this year — undiscoverable for now.
      (input.year === undefined || input.year - o.birthYear >= MIN_RECRUIT_AGE),
  );
  const localUnsearched = allUnsearched.filter((o) => o.locationCityId === city.id);
  const rootlessUnsearched = allUnsearched.filter((o) => o.locationCityId === null);

  // Pick from local hometown pool first; fall back to rootless wanderers.
  // If both empty, we may be in a fully-known region — give up gracefully.
  const pool = localUnsearched.length > 0 ? localUnsearched : rootlessUnsearched;
  if (pool.length === 0) {
    return {
      officers,
      lostItems,
      entry: {
        cityId: city.id,
        kind: 'command-failure',
        text: `${officer.name.en} searched ${city.name.en} but found no hidden talent here.`,
        textZh: `${officer.name.zh}於${city.name.zh}訪查，未得隱才。`,
      },
    };
  }

  const discovered = pool[Math.floor(rng() * pool.length)];
  const updated: Officer = {
    ...discovered,
    status: 'idle',
    locationCityId: city.id,
    forceId: null,
    loyalty: 0,
  };
  const localFlavor = discovered.locationCityId === city.id
    ? ` ${discovered.name.en} hails from ${city.name.en}!`
    : '';
  const localFlavorZh = discovered.locationCityId === city.id
    ? `${discovered.name.zh}本${city.name.zh}人士也！`
    : '';
  return {
    officers: { ...officers, [discovered.id]: updated },
    lostItems,
    entry: {
      cityId: city.id,
      kind: 'talent',
      text: `${officer.name.en} discovered ${discovered.name.en} (${discovered.name.zh}) in ${city.name.en}!${localFlavor}`,
      textZh: `${officer.name.zh}於${city.name.zh}訪得賢才${discovered.name.zh}！${localFlavorZh}`,
    },
  };
}
