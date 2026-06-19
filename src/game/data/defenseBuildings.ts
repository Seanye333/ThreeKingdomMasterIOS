/**
 * Outer-perimeter defense buildings.
 *
 * Each city has 8 build slots positioned around its walls (N, NE, E, SE,
 * S, SW, W, NW). Structures placed in slots provide siege bonuses during
 * resolveBattle (city defense, attacker damage reduction, ranged damage,
 * naval/cavalry/mountain bonuses).
 *
 * Inspired by the RTK series' city-outskirts buildings.
 */

export type DefenseBuildingId =
  // ── Basic (available from start) ──
  | 'watchtower'      // 箭樓 — perimeter archers, ranged damage
  | 'beacon'          // 烽火台 — early warning, attacker loses 1st-strike
  | 'caltrops'        // 拒馬 — cavalry / heavy unit penalty
  | 'lookout'         // 瞭望塔 — see further, +intel
  | 'barracks-out'    // 外營 — extra garrison capacity
  | 'granary-out'     // 外倉 — extra food storage, siege endurance
  // ── Advanced (require terrain or research) ──
  | 'iron-chains'     // 鐵索 — block ships in river/port cities
  | 'rockfall'        // 落石 — mountain damage trap
  | 'arrow-platform'; // 箭台 — mountain area damage

export type BuildSlotPosition = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

/** Where on the perimeter — used for visual layout. */
export const SLOT_POSITIONS: BuildSlotPosition[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export interface DefenseBuildingDef {
  id: DefenseBuildingId;
  name: { zh: string; en: string };
  description: string;
  /** Color used for the icon background. */
  color: string;
  /** Cost to build at level 1. Each upgrade doubles the cost. */
  goldCost: number;
  /** Build/upgrade duration in periods (3 periods = 1 season). */
  buildSeasons: number;
  /** Combat effect generator — returns adjustments at the given level. */
  effect: (level: number) => DefenseBuildingEffect;
  /** Terrain requirement, if any. 'river' = river/port; 'mountain' = mountain city. */
  requiresTerrain?: 'river' | 'mountain';
  /** Maximum upgrade level. */
  maxLevel: number;
}

export interface DefenseBuildingEffect {
  /** Flat defense bonus added to city.defense at siege. */
  defenseBonus: number;
  /** Multiplier on attacker damage (0.95 = attacker hits 5% softer). */
  attackerDamageMul: number;
  /** Flat ranged damage applied at start of siege (e.g., archers fire from towers). */
  rangedPrestrike: number;
  /** Extra troops the city can garrison (above tier cap). */
  extraGarrison: number;
  /** Extra food (granary) — flat. */
  extraFood: number;
  /** Naval defense vs incoming naval (iron-chains). */
  navalDefense: number;
  /** Mountain attack bonus (落石/箭台). */
  mountainBonus: number;
  /** Cavalry penalty (caltrops) — slows down enemy cavalry. */
  cavalryPenalty: number;
}

const zeroEffect: DefenseBuildingEffect = {
  defenseBonus: 0, attackerDamageMul: 1, rangedPrestrike: 0,
  extraGarrison: 0, extraFood: 0, navalDefense: 0,
  mountainBonus: 0, cavalryPenalty: 0,
};

export const DEFENSE_BUILDINGS: Record<DefenseBuildingId, DefenseBuildingDef> = {
  watchtower: {
    id: 'watchtower',
    name: { zh: '箭樓', en: 'Watchtower' },
    description: '箭樓 — 城外箭塔。每等級在攻城時 +8 守備，並有 200 預射傷害。',
    color: '#d4a84a',
    goldCost: 400,
    buildSeasons: 2,
    maxLevel: 3,
    effect: (lv) => ({ ...zeroEffect, defenseBonus: 8 * lv, rangedPrestrike: 200 * lv }),
  },
  beacon: {
    id: 'beacon',
    name: { zh: '烽火台', en: 'Beacon Tower' },
    description: '烽火台 — 預警烽燧。等級越高，攻方失去更多奇襲優勢。',
    color: '#b8442e',
    goldCost: 300,
    buildSeasons: 1,
    maxLevel: 3,
    effect: (lv) => ({ ...zeroEffect, attackerDamageMul: 1 - 0.04 * lv }),
  },
  caltrops: {
    id: 'caltrops',
    name: { zh: '拒馬', en: 'Caltrops' },
    description: '拒馬 — 反騎兵障礙。等級越高，敵騎兵減速減傷越多。',
    color: '#7a6750',
    goldCost: 250,
    buildSeasons: 1,
    maxLevel: 3,
    effect: (lv) => ({ ...zeroEffect, cavalryPenalty: 0.10 * lv, defenseBonus: 3 * lv }),
  },
  lookout: {
    id: 'lookout',
    name: { zh: '瞭望塔', en: 'Lookout' },
    description: '瞭望塔 — 偵察平台。提供周邊敵情，加成偵察與奇襲。',
    color: '#88b7e8',
    goldCost: 200,
    buildSeasons: 1,
    maxLevel: 2,
    effect: (lv) => ({ ...zeroEffect, defenseBonus: 2 * lv, attackerDamageMul: 1 - 0.02 * lv }),
  },
  'barracks-out': {
    id: 'barracks-out',
    name: { zh: '外營', en: 'Outer Barracks' },
    description: '外營 — 城外駐軍。每級增加 +1000 駐軍上限。',
    color: '#a87858',
    goldCost: 500,
    buildSeasons: 2,
    maxLevel: 3,
    effect: (lv) => ({ ...zeroEffect, extraGarrison: 1000 * lv }),
  },
  'granary-out': {
    id: 'granary-out',
    name: { zh: '外倉', en: 'Outer Granary' },
    description: '外倉 — 城外糧倉。每級 +5000 糧儲，圍城時不易餓死。',
    color: '#b8c87a',
    goldCost: 350,
    buildSeasons: 2,
    maxLevel: 3,
    effect: (lv) => ({ ...zeroEffect, extraFood: 5000 * lv }),
  },
  'iron-chains': {
    id: 'iron-chains',
    name: { zh: '鐵索', en: 'Iron Chains' },
    description: '鐵索 — 江上橫索。阻擋水師船隻，水戰防禦極強。需臨水城市。',
    color: '#5a4530',
    goldCost: 700,
    buildSeasons: 3,
    maxLevel: 2,
    requiresTerrain: 'river',
    effect: (lv) => ({ ...zeroEffect, navalDefense: 25 * lv, defenseBonus: 5 * lv }),
  },
  rockfall: {
    id: 'rockfall',
    name: { zh: '落石', en: 'Rockfall Trap' },
    description: '落石 — 山地落石陷阱。等級越高，山地攻擊傷害越大。需山地城市。',
    color: '#4a3a30',
    goldCost: 600,
    buildSeasons: 2,
    maxLevel: 2,
    requiresTerrain: 'mountain',
    effect: (lv) => ({ ...zeroEffect, mountainBonus: 0.15 * lv, rangedPrestrike: 150 * lv }),
  },
  'arrow-platform': {
    id: 'arrow-platform',
    name: { zh: '箭台', en: 'Arrow Platform' },
    description: '箭台 — 山地高射台。範圍殺傷大。需山地城市。',
    color: '#c19a3b',
    goldCost: 650,
    buildSeasons: 2,
    maxLevel: 3,
    requiresTerrain: 'mountain',
    effect: (lv) => ({ ...zeroEffect, rangedPrestrike: 300 * lv, mountainBonus: 0.10 * lv }),
  },
};

/** Aggregate all slot effects in a city into a single DefenseBuildingEffect. */
export function aggregateSlotEffects(
  slots: ReadonlyArray<{ buildingId?: DefenseBuildingId; level: number }>,
): DefenseBuildingEffect {
  const total: DefenseBuildingEffect = { ...zeroEffect };
  let damageMul = 1;
  for (const slot of slots) {
    if (!slot.buildingId) continue;
    const def = DEFENSE_BUILDINGS[slot.buildingId];
    if (!def) continue;
    const eff = def.effect(slot.level);
    total.defenseBonus += eff.defenseBonus;
    total.rangedPrestrike += eff.rangedPrestrike;
    total.extraGarrison += eff.extraGarrison;
    total.extraFood += eff.extraFood;
    total.navalDefense += eff.navalDefense;
    total.mountainBonus += eff.mountainBonus;
    total.cavalryPenalty += eff.cavalryPenalty;
    damageMul *= eff.attackerDamageMul; // compound
  }
  total.attackerDamageMul = damageMul;
  return total;
}
