import type {
  City,
  CommandType,
  EntityId,
  InternalAffairsType,
  Officer,
  ReportEntry,
} from '../types';
import { ITEMS_BY_ID } from '../data/items';
import { cityStatCap, citySize } from './citySize';

export interface CommandDef {
  type: CommandType;
  label: { en: string; zh: string };
  stat: keyof Officer['stats'];
  goldCost: number;
  description: string;
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
    goldCost: 250,
    description:
      'Send the officer to scour the city for unknown talent. Charisma decides success. Discovered officers appear as free agents in this city.',
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
  }>;
  message: string;
}

export function resolveInternalAffairs(
  type: Exclude<InternalAffairsType, 'search'>,
  officer: Officer,
  city: City,
  rng: () => number,
): CommandResult {
  const def = COMMAND_DEFS[type];
  const statValue = officer.stats[def.stat];

  const size = citySize(city);
  const cap = cityStatCap(city);

  switch (type) {
    case 'develop-agriculture': {
      const gain = applyDevelopment(city.agriculture, statValue, rng, cap);
      const capHit = city.agriculture + gain >= cap && gain === 0;
      return {
        success: gain > 0,
        delta: { agriculture: gain },
        message: capHit
          ? `${officer.name.en}: Agriculture already at ${size.name.zh}'s cap (${cap}). Promote the city first.`
          : `${officer.name.en} raised Agriculture by ${gain} (now ${city.agriculture + gain}/${cap}).`,
      };
    }
    case 'develop-commerce': {
      const gain = applyDevelopment(city.commerce, statValue, rng, cap);
      const capHit = city.commerce + gain >= cap && gain === 0;
      return {
        success: gain > 0,
        delta: { commerce: gain },
        message: capHit
          ? `${officer.name.en}: Commerce already at ${size.name.zh}'s cap (${cap}).`
          : `${officer.name.en} raised Commerce by ${gain} (now ${city.commerce + gain}/${cap}).`,
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
      };
    }
    case 'recruit-troops': {
      const max = Math.floor(statValue * 20) + 200;
      // City size also limits the per-action max so a Hamlet can't recruit huge armies.
      const sizeMax = Math.floor(size.troopCap / 10);
      const fromPop = Math.min(max, sizeMax, Math.floor(city.population / 100));
      return {
        success: fromPop > 0,
        delta: { troops: fromPop, population: -fromPop * 2 },
        message: `${officer.name.en} recruited ${fromPop} troops (${size.name.zh} cap ${sizeMax}/turn; population −${fromPop * 2}).`,
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
}

export interface SearchOutput {
  officers: Record<EntityId, Officer>;
  lostItems: LostItemRef[];
  entry: ReportEntry;
}

export function handleSearch(input: SearchInput): SearchOutput {
  const { officer, city, officers, lostItems, rng } = input;
  const successChance = Math.min(0.85, officer.stats.charisma / 100);
  const succeeded = rng() < successChance;

  if (!succeeded) {
    return {
      officers,
      lostItems,
      entry: {
        cityId: city.id,
        kind: 'command-failure',
        text: `${officer.name.en} found nothing of note in ${city.name.en}.`,
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
    if (item && officer.forceId !== null) {
      // No slot cap — the searcher simply keeps anything they find.
      updatedOfficers[officer.id] = {
        ...officer,
        equipment: [...officer.equipment, found.itemId],
      };
      equippedNote = ` ${officer.name.en} keeps it for themselves.`;
    }
    return {
      officers: updatedOfficers,
      lostItems: lostItems.filter((li) => li.itemId !== found.itemId),
      entry: {
        cityId: city.id,
        kind: 'talent',
        text: `${officer.name.en} unearthed ${item?.name.en ?? found.itemId} (${item?.name.zh ?? ''}) in ${city.name.en}!${equippedNote}`,
      },
    };
  }

  const unsearched = Object.values(officers).filter(
    (o) => o.status === 'unsearched',
  );
  if (unsearched.length === 0) {
    return {
      officers,
      lostItems,
      entry: {
        cityId: city.id,
        kind: 'command-failure',
        text: `${officer.name.en} searched ${city.name.en} but no hidden talent remains in the realm.`,
      },
    };
  }

  const discovered = unsearched[Math.floor(rng() * unsearched.length)];
  const updated: Officer = {
    ...discovered,
    status: 'idle',
    locationCityId: city.id,
    forceId: null,
    loyalty: 0,
  };
  return {
    officers: { ...officers, [discovered.id]: updated },
    lostItems,
    entry: {
      cityId: city.id,
      kind: 'talent',
      text: `${officer.name.en} discovered ${discovered.name.en} (${discovered.name.zh}) in ${city.name.en}!`,
    },
  };
}
