import type {
  City,
  CommandType,
  EntityId,
  InternalAffairsType,
  Officer,
  ReportEntry,
} from '../types';
import { ITEMS_BY_ID } from '../data/items';
import { itemSetBonuses } from '../data/itemSets';
import { cityStatCap, cityEconCap, citySize, CITY_SIZES, type CitySize } from './citySize';
import { internalAffairsMultiplier } from './traitEffects';
import { adjudicateClear } from './law';
import { householdAudit } from './household';
import { crackdownResult } from './hoarding';
import { pairKey } from '../types/diplomacy';
import type { WeatherKind } from './weather';

/** 同心／嫌隙 — how well an assistant's season meshes with the lead officer's,
 *  by their rapport (好感). A warm 搭檔 pulls in the same direction (up to ×1.5);
 *  a soured/feuding one barely helps (down to ×0.4). */
function assistSynergy(rapport: Record<string, number> | undefined, leadId: EntityId, assistId: EntityId): number {
  const r = rapport?.[pairKey(leadId, assistId)] ?? 0;
  return 1 + (r >= 0 ? 0.5 * (r / 100) : 0.6 * (r / 100));
}

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
  relief: {
    type: 'relief',
    label: { en: 'Famine Relief', zh: '賑濟' },
    stat: 'charisma',
    // Costs FOOD, not gold — opening the granaries to feed the people. A second
    // loyalty lever that bites in a different resource than 撫民 (gold).
    goldCost: 0,
    description:
      '賑濟 — Open the granaries to feed the populace. Spends city FOOD (scaling with population) to win a strong loyalty boost. Unaffected by the near-cap taper that limits 撫民, so it can top a city off — but a starving city has nothing to give.',
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
    goldCost: 1100,
    minSize: 'city',
    description:
      '大農政 — Triple-strength agriculture push. 1100g (a premium over 3× basic) but does it in one officer-season instead of three. Requires 城 (City) tier.',
  },
  'major-commerce': {
    type: 'major-commerce',
    label: { en: 'Mass Commerce', zh: '大商政' },
    stat: 'politics',
    goldCost: 1100,
    minSize: 'city',
    description:
      '大商政 — Triple-strength commerce drive. 1100g (a premium over 3× basic) but done in one officer-season. Requires 城 tier.',
  },
  'major-defense': {
    type: 'major-defense',
    label: { en: 'Mass Fortification', zh: '大築城' },
    stat: 'politics',
    goldCost: 1400,
    minSize: 'city',
    description:
      '大築城 — Massive fortification project. 1400g (a premium over 3× basic) but done in one officer-season. Requires 城 tier.',
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
  'promote-learning': {
    type: 'promote-learning',
    label: { en: 'Promote Learning', zh: '興学' },
    stat: 'intelligence',
    goldCost: 300,
    description:
      '興学 — Hold lectures and endow the schools. Grants an XP burst to every officer stationed in this city (amplified by a 書院/太學), and lifts public morale. Your stable of talent grows faster where learning is honoured.',
  },
  'anti-corruption': {
    type: 'anti-corruption',
    label: { en: 'Root Out Graft', zh: '巡查肅貪' },
    stat: 'politics',
    goldCost: 200,
    description:
      '巡查肅貪 — Audit the clerks and claw back embezzled funds. Recovers gold (scaling with the city’s commerce — the richer the city, the more graft) and restores public faith (loyalty), unaffected by the 撫民 near-cap taper.',
  },
  adjudicate: {
    type: 'adjudicate',
    label: { en: 'Hear Cases', zh: '決獄' },
    stat: 'politics',
    goldCost: 120,
    description:
      '決獄 — Sit in court for a season and work through the backlog of unheard cases (訟獄積案). Clears cases in proportion to Politics (a gaol or civic hall to hold court in helps), and the relief shows in public faith. A city whose docket is never heard bleeds loyalty and, under a harsh code, condemns innocent men.',
  },
  'household-audit': {
    type: 'household-audit',
    label: { en: 'Audit Registers', zh: '括戶' },
    stat: 'politics',
    goldCost: 200,
    description:
      '括戶檢地 — Walk the villages with the tax registers in hand and drag the households the great houses have been sheltering (隱戶) back onto the books. A permanent widening of this city\'s tax base, scaling with Politics — and a standing grievance with the clans whose tenants you just took.',
  },
  'curb-hoarding': {
    type: 'curb-hoarding',
    label: { en: 'Curb Hoarding', zh: '抑兼併' },
    stat: 'politics',
    goldCost: 180,
    description:
      '抑兼併 — Break open the private warehouses where the merchant houses have cornered the city\'s grain (囤積). Grain floods back into the public granary and the people are grateful; trade takes fright (commerce falls) and the great houses behind those merchants remember it. A harsh legal code (峻法) gives the magistrate the authority to do it properly.',
  },
  'flood-control': {
    type: 'flood-control',
    label: { en: 'Flood Control', zh: '治水' },
    stat: 'politics',
    goldCost: 400,
    description:
      '治水 — Dredge channels and raise dikes by hand. Builds flood works that stack with the 堤防 levee toward flood immunity (cap 3), and the irrigation lifts agriculture a little. The labour path to taming the rivers when you lack a levee.',
  },
  'military-farming': {
    type: 'military-farming',
    label: { en: 'Military Farms', zh: '屯田' },
    stat: 'leadership',
    goldCost: 250,
    description:
      '屯田 — Settle the garrison on state land to till it between campaigns (曹操 of Xuchang’s grain engine). Yields a block of FOOD without drawing a single civilian from the population, and the cleared fields nudge agriculture up. Output scales with Leadership (you are organising soldiers, not peasants) and the size of the standing garrison — an empty city has no hands to farm.',
  },
  'drill-troops': {
    type: 'drill-troops',
    label: { en: 'Drill Troops', zh: '練兵' },
    stat: 'leadership',
    goldCost: 300,
    description:
      '練兵 — Put the garrison through formation drills and weapons practice, raising the city’s 練度 (drill level). Well-drilled defenders fight harder on the walls (a defensive power bonus when besieged, up to +25% at full drill). Gain scales with Leadership; 練度 decays slowly if left to lapse. Complements the hands-on 演習 sparring battles, which also build 練度.',
  },
  garrison: {
    type: 'garrison',
    label: { en: 'Garrison', zh: '鎮守' },
    stat: 'leadership',
    goldCost: 150,
    description:
      '鎮守 — Drive enemy raiders out of the territory cells surrounding this city and reinforce its defense. Effect scales with Leadership. Useful when an enemy column has captured nearby ground.',
  },
  'special-training': {
    type: 'special-training',
    label: { en: 'Special Training', zh: '特訓' },
    stat: 'war',
    goldCost: 400,
    description:
      '特訓 — Spend a whole season drilling ONE officer hard along the track that fits their 練兵 focus (閉關/演武/遊學/狩獵/論道). Far more 歷練 than ordinary duties, with real chances to learn a skill, forge a 性格, or deepen a 圍’s 潛能 — but the martial tracks (演武/狩獵) risk a 養傷 wound. The drill steers growth toward the officer’s focus stat.',
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
    food: number;
    gold: number;
    floodWorks: number;
    wallTier: 1 | 2 | 3;
    corruption: number;
    drill: number;
    caseload: number;
    hiddenHouseholds: number;
    hoardedGrain: number;
  }>;
  message: string;
  messageZh: string;
}

/** 協同施政 — diminishing weights for the 1st and 2nd assistant officer. */
export const ASSIST_WEIGHTS = [0.5, 0.3] as const;

export function resolveInternalAffairs(
  type: Exclude<InternalAffairsType, 'search' | 'garrison' | 'promote-learning' | 'special-training'>,
  officer: Officer,
  city: City,
  rng: () => number,
  bonus?: { internalMultiplier?: number; recruitBonus?: number; troopCapMul?: number },
  weather?: WeatherKind,
  /** 協同施政 — assistants pouring their season into this command (max 2 counted). */
  assistants?: Officer[],
  /** Pairwise officer rapport (好感) — scales each assistant's協同 by 搭檔情誼. */
  rapport?: Record<string, number>,
  /** 聽訟之所 — this city has a 牢城/安民坊 to hold court in (§1.11, 決獄). */
  hasCourt?: boolean,
  /** 律令 — the realm's legal code (§1.11); 抑兼併 leans on it for authority. */
  lawSeverity?: string,
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
  // 協同施政 — each assistant adds a diminishing fraction of their own trait-
  // adjusted stat for this command, so a strong second hand meaningfully lifts
  // the result without making "stack everyone on one task" strictly optimal.
  let assistBonus = 0;
  (assistants ?? []).slice(0, ASSIST_WEIGHTS.length).forEach((a, i) => {
    // 搭檔情誼 — a well-liked second hand meshes with the lead; a feuding one
    // works at cross-purposes and the協同 barely helps.
    const synergy = assistSynergy(rapport, officer.id, a.id);
    assistBonus += a.stats[def.stat] * internalAffairsMultiplier(a, type) * ASSIST_WEIGHTS[i] * synergy;
  });
  // 治國套裝 — a 文臣/諸子 set (商鞅變法/臥龍... effect:'civil') lifts the lead
  // officer's internal-affairs output, the non-combat counterpart to 戰陣共鳴.
  const civilMul = itemSetBonuses(officer).civilMul;
  const statValue = Math.round(officer.stats[def.stat] * traitMul * titleMul * civilMul + assistBonus);

  const size = citySize(city);
  const cap = cityStatCap(city);      // defense ceiling
  const econCap = cityEconCap(city); // agriculture & commerce ceiling

  switch (type) {
    case 'develop-agriculture': {
      const mishap = civicMishap(city, statValue, rng, weather);
      if (mishap !== null) {
        const setback = Math.max(-city.agriculture, mishap);
        return {
          success: false,
          delta: { agriculture: setback },
          message: `${officer.name.en}: a locust/drought blight struck the fields — Agriculture ${setback}.`,
          messageZh: `${officer.name.zh}勸農遇蝗旱之災,農業 ${setback}。`,
        };
      }
      const gain = applyDevelopment(city.agriculture, statValue, rng, econCap);
      // 倉廩既盈 — agriculture already maxed for this tier: the officer's season
      // isn't wasted, the surplus harvest is laid up as FOOD instead of left to
      // rot. A reason to keep a top administrator on the land past the cap.
      if (city.agriculture + gain >= econCap && gain === 0) {
        const surplus = (developmentGain(statValue, rng) + 1) * 30;
        return {
          success: true,
          delta: { food: surplus },
          message: `${officer.name.en}: Agriculture at ${size.name.zh}'s cap (${econCap}); banked the surplus harvest (+${surplus} food).`,
          messageZh: `${officer.name.zh}:農業已達${size.name.zh}上限 (${econCap}),積餘糧入倉(糧 +${surplus})。`,
        };
      }
      return {
        success: gain > 0,
        delta: { agriculture: gain },
        message: `${officer.name.en} raised Agriculture by ${gain} (now ${city.agriculture + gain}/${econCap}).`,
        messageZh: `${officer.name.zh}勸農 +${gain} (現 ${city.agriculture + gain}/${econCap})。`,
      };
    }
    case 'develop-commerce': {
      const mishap = civicMishap(city, statValue, rng, weather);
      if (mishap !== null) {
        const setback = Math.max(-city.commerce, mishap);
        return {
          success: false,
          delta: { commerce: setback },
          message: `${officer.name.en}: a market panic/fire hit the wards — Commerce ${setback}.`,
          messageZh: `${officer.name.zh}興商遇市亂火患,商業 ${setback}。`,
        };
      }
      const gain = applyDevelopment(city.commerce, statValue, rng, econCap);
      // 市集既盛 — commerce maxed for this tier: the officer works the markets for
      // a one-off windfall of GOLD instead of a wasted season.
      if (city.commerce + gain >= econCap && gain === 0) {
        const windfall = (developmentGain(statValue, rng) + 1) * 25;
        return {
          success: true,
          delta: { gold: windfall },
          message: `${officer.name.en}: Commerce at ${size.name.zh}'s cap (${econCap}); worked the markets for +${windfall}g.`,
          messageZh: `${officer.name.zh}:商業已達${size.name.zh}上限 (${econCap}),經市得利(金 +${windfall})。`,
        };
      }
      return {
        success: gain > 0,
        delta: { commerce: gain },
        message: `${officer.name.en} raised Commerce by ${gain} (now ${city.commerce + gain}/${econCap}).`,
        messageZh: `${officer.name.zh}興商 +${gain} (現 ${city.commerce + gain}/${econCap})。`,
      };
    }
    case 'build-defense': {
      const mishap = civicMishap(city, statValue, rng, weather);
      if (mishap !== null) {
        const setback = Math.max(-city.defense, mishap);
        return {
          success: false,
          delta: { defense: setback },
          message: `${officer.name.en}: scaffolding collapsed / a fire gutted the works — Defense ${setback}.`,
          messageZh: `${officer.name.zh}築城遇失火坍塌,城防 ${setback}。`,
        };
      }
      const gain = applyDevelopment(city.defense, statValue, rng, cap);
      // 城堅而閱武 — walls maxed for this tier: the work turns to drilling the
      // garrison on the ramparts, a touch of 練度 instead of a wasted season.
      if (city.defense + gain >= cap && gain === 0) {
        const drillGain = Math.max(1, Math.floor(statValue / 25));
        return {
          success: true,
          delta: { drill: drillGain },
          message: `${officer.name.en}: Defense at ${size.name.zh}'s cap (${cap}); drilled the garrison on the walls (+${drillGain} drill).`,
          messageZh: `${officer.name.zh}:城防已達${size.name.zh}上限 (${cap}),轉而閱武練兵(練度 +${drillGain})。`,
        };
      }
      return {
        success: gain > 0,
        delta: { defense: gain },
        message: `${officer.name.en} reinforced Defense by ${gain} (now ${city.defense + gain}/${cap}).`,
        messageZh: `${officer.name.zh}築城 +${gain} (現 ${city.defense + gain}/${cap})。`,
      };
    }
    case 'recruit-troops': {
      // Per-action throughput raised so big standing armies can actually be
      // raised and replaced — without this a long war demilitarises the whole
      // map (cities can't rebuild spent armies fast enough).
      const max = Math.floor(statValue * 50) + 800;
      // City size also limits the per-action max so a Hamlet can't recruit huge armies.
      // 兵營/馬廄/武庫/糧倉署/驛站 raise the per-season ceiling (troopCapMul).
      // 馬政 — a standing warhorse herd lets a frontier muster cavalry beyond its size.
      const sizeMax = Math.floor((size.troopCap * (bonus?.troopCapMul ?? 1)) / 8) + Math.floor(city.warhorses ?? 0);
      const fromPop = Math.min(max, sizeMax, Math.floor(city.population / 60));
      // Each soldier costs ~1.4 civilians — keeps the (unchanged) population from
      // being gutted as armies grow larger, so big garrisons are sustainable.
      const popDrawn = Math.round(fromPop * 1.4);
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
      // Diminishing near the cap — winning over the last restive holdouts is
      // far harder than calming a merely-unsettled town. Full value while
      // loyalty ≤ 60 (room ≥ 40), then it tapers: 撫民 alone can't hold a city
      // at 100, leaving room for 賑濟 / policies / titles to do the topping-off.
      const room = 100 - city.loyalty;
      const taper = Math.min(1, room / 40);
      const gain = room > 0
        ? Math.min(room, Math.max(1, Math.round(developmentGain(statValue, rng) * taper)))
        : 0;
      return {
        success: gain > 0,
        delta: { loyalty: gain },
        message: `${officer.name.en} raised Loyalty by ${gain} (now ${city.loyalty + gain}).`,
        messageZh: `${officer.name.zh}撫民,民忠 +${gain} (現 ${city.loyalty + gain})。`,
      };
    }
    case 'relief': {
      // 賑濟 — feed the people from the granary. Cost scales with population
      // (more mouths → more grain); a starving city (can't cover it) can't
      // relieve. The loyalty win is strong and ignores the 撫民 near-cap taper,
      // so it's the way to top a city off — but you pay it in food, not gold.
      const foodNeeded = Math.max(500, Math.round(city.population * 0.02));
      if (city.food < foodNeeded) {
        return {
          success: false,
          delta: {},
          message: `${officer.name.en}: granaries too bare to relieve ${city.name.en} (need ${foodNeeded} food).`,
          messageZh: `${officer.name.zh}:倉廩空虛,無糧可賑(需 ${foodNeeded} 糧)。`,
        };
      }
      // 旱年賑濟,民感尤深 — relief during a drought (when famine bites hardest)
      // earns markedly more goodwill for the same grain.
      const droughtMul = weather === 'drought' ? 1.5 : 1;
      const gain = Math.min(100 - city.loyalty, Math.round((developmentGain(statValue, rng) + 3) * droughtMul));
      const droughtNote = weather === 'drought' ? ' (旱年民感尤深)' : '';
      return {
        success: gain > 0,
        delta: { loyalty: gain, food: -foodNeeded },
        message: `${officer.name.en} 賑濟: opened the granaries (−${foodNeeded} food), Loyalty +${gain} (now ${city.loyalty + gain}).${droughtNote}`,
        messageZh: `${officer.name.zh}賑濟:開倉放糧(糧 −${foodNeeded}),民忠 +${gain} (現 ${city.loyalty + gain})。${droughtNote}`,
      };
    }
    case 'anti-corruption': {
      // 巡查肅貪 — audit the clerks and claw back the embezzled hoard. The longer
      // a wealthy city goes unaudited the more 貪腐 piles up (see City.corruption,
      // accrued each season in resolution.ts), and the bigger the clawback when
      // you finally sweep it. A capable inspector also drives corruption back
      // down toward zero. The loyalty win ignores the 撫民 taper, so it tops a
      // rich city off; the gold recovered repays the inspection many times over.
      const graft = city.corruption ?? 0;
      const recovered = Math.floor(city.commerce * 1.5 + statValue * 2 + graft * 8 + graft * city.commerce * 0.15);
      const loyaltyGain = Math.min(100 - city.loyalty, developmentGain(statValue, rng));
      // A sweep never fully eradicates entrenched graft in one pass — an able
      // official (high 政治) clears more of it.
      const cleared = Math.min(graft, Math.max(8, Math.round(statValue / 6)));
      const graftNote = graft > 0 ? ` (貪腐 −${cleared})` : '';
      return {
        success: true,
        delta: { gold: recovered, loyalty: loyaltyGain, corruption: -cleared },
        message: `${officer.name.en} 巡查肅貪: clawed back ${recovered}g of graft${graft > 0 ? ` (corruption −${cleared})` : ''}, Loyalty +${loyaltyGain} (now ${city.loyalty + loyaltyGain}).`,
        messageZh: `${officer.name.zh}巡查肅貪:追贓 ${recovered} 金${graftNote},民心大快,民忠 +${loyaltyGain} (現 ${city.loyalty + loyaltyGain})。`,
      };
    }
    case 'adjudicate': {
      // 決獄 (§1.11) — a season spent hearing the docket. What an official can
      // dispose of scales with 政治 and whether the city has a court to sit in;
      // the relief of a heard grievance shows up as public faith. Clearing an
      // empty docket is honest work with little to show for it.
      const docket = city.caseload ?? 0;
      const cleared = Math.min(docket, adjudicateClear(statValue, !!hasCourt));
      const loyaltyGain = Math.min(100 - city.loyalty, Math.round(cleared / 6));
      if (docket <= 0) {
        return {
          success: true,
          delta: { loyalty: Math.min(100 - city.loyalty, 1) },
          message: `${officer.name.en} 決獄: the docket was already clear — a quiet season on the bench.`,
          messageZh: `${officer.name.zh}決獄:獄無滯訟,終日無事而還。`,
        };
      }
      return {
        success: true,
        delta: { caseload: -cleared, loyalty: loyaltyGain },
        message: `${officer.name.en} 決獄: heard ${cleared} cases (backlog ${Math.round(docket)} → ${Math.round(docket - cleared)}), Loyalty +${loyaltyGain}.`,
        messageZh: `${officer.name.zh}決獄:平反聽斷,積案 ${Math.round(docket)} → ${Math.round(docket - cleared)},民忠 +${loyaltyGain}。`,
      };
    }
    case 'household-audit': {
      // 括戶 (§1.12) — what an official recovers scales with his 政治 and with how
      // much there is to find. The households come back permanently; the great
      // houses remember (clan standing is docked by the store).
      const hidden = city.hiddenHouseholds ?? 0;
      const audit = householdAudit({ hiddenPercent: hidden, politics: statValue, population: city.population });
      if (audit.recovered <= 0) {
        return {
          success: false,
          delta: {},
          message: `${officer.name.en} 括戶: the registers here are already honest — nothing to recover.`,
          messageZh: `${officer.name.zh}括戶:此城編戶齊民,無隱可括。`,
        };
      }
      return {
        success: true,
        delta: { hiddenHouseholds: -audit.recovered, loyalty: -2 },
        message: `${officer.name.en} 括戶: recovered ${audit.households.toLocaleString()} households onto the registers (hidden ${hidden.toFixed(1)}% → ${(hidden - audit.recovered).toFixed(1)}%). The clans are displeased.`,
        messageZh: `${officer.name.zh}括戶檢地:括出隱戶 ${audit.households.toLocaleString()} 口入籍(隱戶 ${hidden.toFixed(1)}% → ${(hidden - audit.recovered).toFixed(1)}%),稅基大廣;然豪右側目,門第不悅。`,
      };
    }
    case 'curb-hoarding': {
      // 抑兼併 (§1.14) — how much comes out of the warehouses scales with the
      // magistrate and with the authority his code gives him.
      const hoarded = city.hoardedGrain ?? 0;
      if (hoarded < 5) {
        return {
          success: false,
          delta: {},
          message: `${officer.name.en} 抑兼併: the granaries here are honest — nothing cornered worth breaking open.`,
          messageZh: `${officer.name.zh}抑兼併:市易如常,無囤可抑。`,
        };
      }
      const res = crackdownResult({ hoarded, cityFood: city.food, politics: statValue, lawSeverity });
      return {
        success: true,
        delta: {
          hoardedGrain: -res.cleared,
          food: res.foodRecovered,
          loyalty: Math.min(100 - city.loyalty, res.loyaltyGain),
          commerce: -res.commerceLoss,
        },
        message: `${officer.name.en} 抑兼併: opened the warehouses — ${res.foodRecovered} food to the public granary, Loyalty +${res.loyaltyGain}, Commerce −${res.commerceLoss}.`,
        messageZh: `${officer.name.zh}抑兼併:破豪商之囤 —— 入公廩糧 ${res.foodRecovered},民忠 +${res.loyaltyGain},然商賈斂跡(商業 −${res.commerceLoss})。`,
      };
    }
    case 'military-farming': {
      // 屯田 — settle the garrison on state land to till it. Food yield scales
      // with the standing garrison (more soldier-farmers) and Leadership
      // (organising them), and draws NO civilians from the population. The
      // cleared fields also nudge agriculture up a touch.
      const hands = Math.sqrt(Math.max(0, city.troops));
      const foodGain = Math.round(hands * (8 + statValue * 0.15));
      if (foodGain <= 0) {
        return {
          success: false,
          delta: {},
          message: `${officer.name.en} 屯田: no garrison here to work the land.`,
          messageZh: `${officer.name.zh}屯田:城中無兵可耕。`,
        };
      }
      // 兵怨逃屯 — forcing a near-mutinous garrison (loyalty < 35) to farm breeds
      // resentment; some desert the drudgery and the harvest comes in thin.
      if (city.loyalty < 35 && rng() < 0.2) {
        const deserters = Math.min(city.troops, Math.round(hands * 2));
        const thinFood = Math.round(foodGain * 0.5);
        return {
          success: false,
          delta: { food: thinFood, troops: -deserters },
          message: `${officer.name.en} 屯田: the restive garrison balked at the drudgery — ${deserters} deserted, only ${thinFood} food gathered.`,
          messageZh: `${officer.name.zh}屯田:軍心不穩,士卒怨耕逃散 ${deserters} 人,僅得糧 ${thinFood}。`,
        };
      }
      const irrigation = Math.min(Math.max(0, econCap - city.agriculture), Math.floor(statValue / 30));
      return {
        success: true,
        delta: { food: foodGain, agriculture: irrigation },
        message: `${officer.name.en} 屯田: the garrison tilled state land (+${foodGain} food${irrigation ? `, Agriculture +${irrigation}` : ''}; no population drawn).`,
        messageZh: `${officer.name.zh}屯田:軍士耕屯(糧 +${foodGain}${irrigation ? `,農業 +${irrigation}` : ''};不耗民口)。`,
      };
    }
    case 'drill-troops': {
      // 練兵 — formation drills raise the city's 練度 toward 100, tapering near
      // the top (the last increments of discipline come hardest). 練度 lifts
      // defensive power in a siege (see cityDrillDefenseMultiplier in combat.ts)
      // and decays slowly each season if left to lapse.
      const cur = city.drill ?? 0;
      const room = 100 - cur;
      if (room <= 0) {
        return {
          success: false,
          delta: {},
          message: `${officer.name.en} 練兵: the garrison is already at peak drill (練度 100).`,
          messageZh: `${officer.name.zh}練兵:守軍練度已臻極致 (100)。`,
        };
      }
      const taper = Math.min(1, room / 50);
      const gain = Math.min(room, Math.max(1, Math.round((Math.floor(statValue / 8) + 2) * taper)));
      return {
        success: true,
        delta: { drill: gain },
        message: `${officer.name.en} 練兵: drilled the garrison, 練度 ${cur} → ${cur + gain}.`,
        messageZh: `${officer.name.zh}練兵:操演守軍,練度 ${cur} → ${cur + gain}。`,
      };
    }
    case 'flood-control': {
      // 治水 — raise flood works by hand. Stacks with the 堤防 levee toward the
      // immunity cap (3, applied in events.ts); the irrigation also nudges
      // agriculture. No-op once works are already maxed.
      const cur = city.floodWorks ?? 0;
      const irrigation = Math.min(econCap - city.agriculture, Math.floor(statValue / 25) + 1);
      if (cur >= 3) {
        return {
          success: irrigation > 0,
          delta: { agriculture: irrigation },
          message: `${officer.name.en} 治水: works already at their peak; irrigation lifted Agriculture +${irrigation}.`,
          messageZh: `${officer.name.zh}治水:堤工已固,水利惠農,農業 +${irrigation}。`,
        };
      }
      const next = cur + 1;
      return {
        success: true,
        delta: { floodWorks: next, agriculture: irrigation },
        message: `${officer.name.en} 治水: flood works ${cur} → ${next} (cuts flood odds), Agriculture +${irrigation}.`,
        messageZh: `${officer.name.zh}治水:堤工 ${cur} → ${next} 級(洪災機率降),水利惠農 +${irrigation}。`,
      };
    }
    case 'major-agriculture': {
      const mishap = civicMishap(city, statValue, rng, weather, 0.35);
      if (mishap !== null) {
        const setback = Math.max(-city.agriculture, mishap * 2);
        return {
          success: false,
          delta: { agriculture: setback },
          message: `${officer.name.en} 大農政: the great works were undone by blight/flood — Agriculture ${setback}.`,
          messageZh: `${officer.name.zh}大農政遇蝗澇之災,功虧一簣,農業 ${setback}。`,
        };
      }
      const gain = Math.min(econCap - city.agriculture, applyDevelopment(city.agriculture, statValue, rng, econCap) * 3);
      return {
        success: gain > 0,
        delta: { agriculture: gain },
        message: `${officer.name.en} 大農政: Agriculture +${gain} (now ${city.agriculture + gain}/${econCap}).`,
        messageZh: `${officer.name.zh}大農政:農業 +${gain} (現 ${city.agriculture + gain}/${econCap})。`,
      };
    }
    case 'major-commerce': {
      const mishap = civicMishap(city, statValue, rng, weather, 0.35);
      if (mishap !== null) {
        const setback = Math.max(-city.commerce, mishap * 2);
        return {
          success: false,
          delta: { commerce: setback },
          message: `${officer.name.en} 大商政: a market crash / great fire gutted the wards — Commerce ${setback}.`,
          messageZh: `${officer.name.zh}大商政遇市崩火患,商業 ${setback}。`,
        };
      }
      const gain = Math.min(econCap - city.commerce, applyDevelopment(city.commerce, statValue, rng, econCap) * 3);
      return {
        success: gain > 0,
        delta: { commerce: gain },
        message: `${officer.name.en} 大商政: Commerce +${gain} (now ${city.commerce + gain}/${econCap}).`,
        messageZh: `${officer.name.zh}大商政:商業 +${gain} (現 ${city.commerce + gain}/${econCap})。`,
      };
    }
    case 'major-defense': {
      const mishap = civicMishap(city, statValue, rng, weather, 0.35);
      if (mishap !== null) {
        const setback = Math.max(-city.defense, mishap * 2);
        return {
          success: false,
          delta: { defense: setback },
          message: `${officer.name.en} 大築城: the great works collapsed / burned — Defense ${setback}.`,
          messageZh: `${officer.name.zh}大築城遇坍塌失火,城防 ${setback}。`,
        };
      }
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
      // Diminishing pull — the larger (more crowded) the city, the fewer extra
      // refugees one drive attracts, so migration can't be spammed to balloon a
      // metropolis. 邑 ×1.0 → 都 ×0.4.
      const pullMul = 1 - SIZE_RANK[size.id] * 0.15;
      const popGain = Math.round((base + variance) * pullMul);
      // Newcomers strain food and housing before they settle — a small loyalty
      // dip (replacing the old free +1) that a charismatic governor (≥80) avoids.
      const loyaltyHit = statValue >= 80 ? 0 : -1;
      return {
        success: true,
        delta: { population: popGain, loyalty: loyaltyHit },
        message: `${officer.name.en} 招撫流民: +${popGain.toLocaleString()} population (${size.name.zh} pull ×${pullMul.toFixed(2)}, loyalty ${loyaltyHit}).`,
        messageZh: `${officer.name.zh}招撫流民:民眾 +${popGain.toLocaleString()} (${size.name.zh}吸引 ×${pullMul.toFixed(2)},民忠 ${loyaltyHit})。`,
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

/**
 * Per-action raw increment for an internal-affairs push (勸農/興商/築城/撫民).
 *
 * Replaces the old ⌊stat/20⌋ band, where 政治 60 and 79 produced the same base
 * and the 0–2 noise drowned out talent ("頂級文官優勢有限"). Now:
 *  - finer base (÷14) so every ~14 points reads,
 *  - an elite tail (+1 per 10 points above 70) so a 95-politics 名臣 clearly
 *    out-administers a 60 journeyman,
 *  - tight 0–1 noise so high stat is both high AND reliable,
 *  - 良吏豐政: a small crit (chance rising with stat) yields an exceptional
 *    season (×1.5). Surfaces naturally as a bigger +N in the report.
 */
function developmentGain(stat: number, rng: () => number): number {
  const base = Math.floor(stat / 14);
  const elite = Math.floor(Math.max(0, stat - 70) / 10);
  const variance = Math.floor(rng() * 2);
  let raw = base + elite + variance + 1;
  const critChance = 0.06 + Math.max(0, stat - 70) * 0.003;
  if (rng() < critChance) raw = Math.floor(raw * 1.5);
  return raw;
}

function applyDevelopment(current: number, stat: number, rng: () => number, cap: number): number {
  if (current >= cap) return 0;
  return Math.min(cap - current, developmentGain(stat, rng));
}

/** Expected (mean) development gain — the deterministic, no-RNG companion to
 *  developmentGain, for pre-dispatch previews. Mirrors its base+elite tail,
 *  folds in the mean of the 0–1 variance roll and the crit chance, ≥1. */
function expectedDevGain(stat: number): number {
  const base = Math.floor(stat / 14);
  const elite = Math.floor(Math.max(0, stat - 70) / 10);
  const mean = base + elite + 1 + 0.5; // +0.5 = E[⌊rng×2⌋]
  const crit = 0.06 + Math.max(0, stat - 70) * 0.003;
  return Math.max(1, Math.round(mean * (1 + crit * 0.5)));
}

/** 施政預覽 — a deterministic, no-mishap, expected-value estimate of a command's
 *  primary-metric gain for one officer, for the pre-dispatch UI (the 3D building
 *  card and the officer picker). Returns the metric label + estimated delta, or
 *  null for commands whose effect isn't a single previewable number (賑濟/治水/
 *  招撫流民/興学/巡查肅貪/鎮守/城壁強化/屯田/人材探訪). `bonus` folds in civic-title
 *  / building multipliers when the caller has them; omit for a trait-only estimate. */
export function previewCommandGain(
  type: InternalAffairsType,
  officer: Officer,
  city: City,
  bonus?: { internalMultiplier?: number; recruitBonus?: number; troopCapMul?: number },
): { zh: string; en: string; delta: number } | null {
  const def = COMMAND_DEFS[type];
  const traitMul = internalAffairsMultiplier(officer, type);
  const titleMul = type === 'recruit-troops'
    ? 1 + (bonus?.recruitBonus ?? 0)
    : (bonus?.internalMultiplier ?? 1);
  const statValue = Math.round(officer.stats[def.stat] * traitMul * titleMul);
  const econCap = cityEconCap(city);
  const cap = cityStatCap(city);
  const exp = expectedDevGain(statValue);

  switch (type) {
    case 'develop-agriculture':
      return { zh: '農業', en: 'Agri', delta: Math.max(0, Math.min(econCap - city.agriculture, exp)) };
    case 'major-agriculture':
      return { zh: '農業', en: 'Agri', delta: Math.max(0, Math.min(econCap - city.agriculture, exp * 3)) };
    case 'develop-commerce':
      return { zh: '商業', en: 'Comm', delta: Math.max(0, Math.min(econCap - city.commerce, exp)) };
    case 'major-commerce':
      return { zh: '商業', en: 'Comm', delta: Math.max(0, Math.min(econCap - city.commerce, exp * 3)) };
    case 'build-defense':
      return { zh: '城防', en: 'Def', delta: Math.max(0, Math.min(cap - city.defense, exp)) };
    case 'major-defense':
      return { zh: '城防', en: 'Def', delta: Math.max(0, Math.min(cap - city.defense, exp * 3)) };
    case 'improve-loyalty': {
      const room = 100 - city.loyalty;
      const taper = Math.min(1, room / 40);
      return { zh: '民忠', en: 'Loy', delta: room > 0 ? Math.max(1, Math.round(exp * taper)) : 0 };
    }
    case 'drill-troops': {
      const room = 100 - (city.drill ?? 0);
      const taper = Math.min(1, room / 50);
      return { zh: '練度', en: 'Drill', delta: room > 0 ? Math.max(1, Math.round((Math.floor(statValue / 8) + 2) * taper)) : 0 };
    }
    case 'recruit-troops': {
      const size = citySize(city);
      const max = Math.floor(statValue * 50) + 800;
      const sizeMax = Math.floor((size.troopCap * (bonus?.troopCapMul ?? 1)) / 8) + Math.floor(city.warhorses ?? 0);
      return { zh: '兵', en: 'Troops', delta: Math.max(0, Math.min(max, sizeMax, Math.floor(city.population / 60))) };
    }
    default:
      return null;
  }
}

/**
 * 災異 — the downside that mirrors 良吏豐政. A restive, poorly-run city can
 * suffer a setback instead of progress (蝗災/旱 on the fields, 失火 on the
 * works). Risk is ~4% in a contented city, climbing toward ~14% as loyalty
 * falls below 60; a capable official (政治/魅力 > 70) manages it back down.
 * The deliberate, hands-on basic pushes carry the full risk; the costly 大政
 * projects run with more oversight (riskMul ≈ 0.35) but are NOT immune — a big
 * project that goes wrong fails spectacularly.
 * Returns a negative setback (−1..−3), or null for "no disaster".
 */
function civicMishap(
  city: City,
  stat: number,
  rng: () => number,
  weather?: WeatherKind,
  riskMul = 1,
): number | null {
  // 旱 — drought parches the fields and dries the timber: blight/fire are more
  // likely. Rain, by contrast, dampens fire risk slightly.
  const weatherRisk = weather === 'drought' ? 0.06 : weather === 'rain' ? -0.01 : 0;
  const risk = (0.04
    + Math.max(0, 60 - city.loyalty) * 0.0016
    - Math.max(0, stat - 70) * 0.0008
    + weatherRisk) * riskMul;
  if (rng() >= Math.max(0.005, risk)) return null;
  return -(1 + Math.floor(rng() * 3));
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
