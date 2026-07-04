import type { BilingualName, EntityId } from './common';

/**
 * City building types. Each city can host buildings up to a per-type max level.
 * Buildings give multiplicative bonuses to local production / capacity.
 */
export type BuildingId =
  | 'barracks'   // 兵營 — boosts troop training (recruit) and troop cap
  | 'market'     // 市場 — boosts commerce gold per season
  | 'foundry'    // 鉄工坊 — boosts equipment quality, slight commerce
  | 'academy'    // 書院 — boosts officer XP and recruit chance
  | 'temple'     // 寺院 — boosts loyalty per season and resistance to instigate
  | 'farm'       // 屯田 — boosts agriculture food yield
  | 'wall'       // 城壁 — increases city defense
  | 'shipyard'   // 船渠 — required to build ships; only on river-adjacent cities
  | 'granary'    // 義倉 — famine insurance: rarer famines, smaller losses
  | 'infirmary'  // 醫館 — plague control: rarer outbreaks, fewer dead
  | 'levee'      // 堤防 — flood works: a L3 levee stops the river cold
  | 'stable'     // 馬廄 — breeds warhorses: boosts recruit + troop cap (cavalry)
  | 'workshop'   // 工房 — arms & siege works: city defense + slight recruit
  | 'mint'       // 錢莊 — coin minting: strong commerce gold boost
  | 'arsenal'    // 武庫 — armoury: city defense + troop cap
  | 'relay'      // 驛站 — post roads: commerce + troop cap (logistics)
  | 'grandacademy' // 太學 — grand academy: strong officer XP + loyalty
  | 'barbican'   // 甕城 — fortified gatework: heavy defense + instigate resistance
  | 'evernormal' // 常平倉 — ever-normal granary: agriculture + commerce
  | 'drillground' // 演武場 — drill ground: recruit + officer XP
  | 'irrigation' // 水利 — irrigation works: agriculture + drought mitigation
  | 'recruithall' // 招賢館 — hall of worthies: officer-recruit chance + XP
  | 'spyoffice'  // 諜報司 — intelligence bureau: counter-scheme + instigate resistance
  | 'supplydepot' // 驛傳 — supply depot: convoy capacity + troop cap
  | 'civicoffice' // 安民坊 — civic office: population growth + loyalty
  | 'tradeoffice' // 市舶司 — maritime trade office: foreign-trade income + commerce
  | 'warschool'  // 武學堂 — military academy: heavy officer XP
  | 'quartermaster' // 糧倉署 — quartermaster: troop cap + recruit
  | 'signaltower' // 譙樓 — signal tower: city defense + watch (instigate resistance)
  | 'fieldhospital' // 傷兵營 — field hospital: speeds officer wound recovery + loyalty
  | 'daotemple'  // 道觀 — Daoist temple: resists cult contagion + loyalty
  | 'lingtai'    // 靈台 — star terrace: disaster loyalty shield + ill-omen deflection
  | 'worksbureau' // 將作監 — works bureau: cheaper & faster construction of other buildings
  | 'tavern'     // 酒肆 — tavern: faster officer rapport growth + loyalty + commerce
  | 'prison'     // 牢城 — prison/court: defection resistance + instigate resistance
  | 'pasture'    // 牧苑 — horse pasture: troop cap + recruit (cavalry)
  | 'library'    // 藏書閣 — library: officer XP + instigate resistance
  | 'beacon'     // 烽燧 — beacon line: city defense + counter-scheme (early warning)
  | 'armsbureau' // 軍器監 — arms bureau: cheaper & better forging/refining
  | 'pricebureau' // 平準署 — price bureau: eases inflation + commerce
  | 'heraldhall' // 鴻臚館 — herald hall: stronger diplomacy + commerce
  | 'navalyard'  // 樓船署 — naval yard: water-battle defense + recruit
  | 'scoutcamp'; // 斥候營 — scout camp: own espionage success + instigate resist

/**
 * 建築群 — every building belongs to one category. Clustering same-category
 * buildings in a city compounds that category's output (a "district" set bonus),
 * rewarding specialised cities (an economic 都, a military 重鎮…).
 */
export type BuildingCategory =
  | 'economy'      // 經濟
  | 'agriculture'  // 農政
  | 'military'     // 軍務
  | 'defense'      // 城防
  | 'culture'      // 文教
  | 'civic'        // 民政
  | 'intel';       // 諜報

export interface BuildingDef {
  id: BuildingId;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  /** Gold cost per level. */
  goldPerLevel: number;
  /** Seasons to build one level. */
  seasonsPerLevel: number;
  /** Maximum level. */
  maxLevel: number;
  /** Effect description by level. */
  effect: string;
}

/**
 * A built structure in a city, with its current level and progress
 * (0 → seasonsPerLevel; when full, level increments).
 */
export interface Building {
  id: BuildingId;
  cityId: EntityId;
  level: number;
  /** Progress in seasons toward the next level. */
  progress: number;
  /** Which city-view foundation plot this building sits on (index into the
   *  city's build-plot grid). Optional — legacy/AI buildings without one fall
   *  back to deterministic order placement in the 3D city view. */
  plot?: number;
  /** 山長 — an officer assigned to head a school building (書院/太學/武學堂/招賢館).
   *  Their relevant stat boosts the school's XP multiplier and tilts which 圍 the
   *  schooling trains. Ignored for non-school buildings. See buildings.buildingBonuses. */
  headmasterId?: EntityId;
  /** 戰損 — wrecked in a siege: gives NO bonus until repaired (修繕, a gold
   *  cost via repairBuilding). Fire-heavy assaults wreck more of the town. */
  damaged?: boolean;
}
