import type { BuildingDef, BuildingId, BuildingCategory } from '../types';
import type { CitySize } from '../systems/citySize';

export const BUILDING_DEFS: BuildingDef[] = [
  {
    id: 'stable',
    name: { en: 'Stable', zh: '馬廄' },
    description: 'Breeds warhorses. +8% troop training and +8% troop cap per level.',
    descriptionZh: "牧養戰馬之所。每等級徵兵速度 +8%、兵力上限 +8%(利騎兵)。",
    goldPerLevel: 500,
    seasonsPerLevel: 3,
    maxLevel: 4,
    effect: '+8% recruit / +8% troop cap per level',
  },
  {
    id: 'workshop',
    name: { en: 'Workshop', zh: '工房' },
    description: 'Crafts arms and siege engines. +6 city defense and +4% recruit per level.',
    descriptionZh: "造兵器與攻城器械。每等級城防 +6、徵兵 +4%。",
    goldPerLevel: 550,
    seasonsPerLevel: 3,
    maxLevel: 4,
    effect: '+6 defense / +4% recruit per level',
  },
  {
    id: 'mint',
    name: { en: 'Mint', zh: '錢莊' },
    description: 'Mints copper cash. +15% commerce gold per season per level.',
    descriptionZh: "鑄錢通貨之地。每等級每季商業金收 +15%。",
    goldPerLevel: 450,
    seasonsPerLevel: 2,
    maxLevel: 4,
    effect: '+15% commerce per level',
  },
  {
    id: 'arsenal',
    name: { en: 'Arsenal', zh: '武庫' },
    description: 'Stores and distributes arms. +8 city defense and +4% troop cap per level.',
    descriptionZh: "藏甲兵之府。每等級城防 +8、兵力上限 +4%。",
    goldPerLevel: 500,
    seasonsPerLevel: 3,
    maxLevel: 4,
    effect: '+8 defense / +4% troop cap per level',
  },
  {
    id: 'relay',
    name: { en: 'Relay Station', zh: '驛站' },
    description: 'Post roads speed couriers and convoys. +8% commerce and +4% troop cap per level.',
    descriptionZh: "傳驛通衢、轉運糧秣之所。每等級商業 +8%、兵力上限 +4%。",
    goldPerLevel: 450,
    seasonsPerLevel: 2,
    maxLevel: 4,
    effect: '+8% commerce / +4% troop cap per level',
  },
  {
    id: 'grandacademy',
    name: { en: 'Grand Academy', zh: '太學' },
    description: 'The realm\'s seat of learning. +12% officer XP and +1 loyalty per season per level.',
    descriptionZh: "天下文宗、教化萬民之太學。每等級武將經驗 +12%、每季民忠 +1。",
    goldPerLevel: 700,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: '+12% officer XP / +1 loyalty per season per level',
  },
  {
    id: 'barbican',
    name: { en: 'Barbican', zh: '甕城' },
    description: 'A fortified outer gate. +12 city defense and instigate ops 20% less effective per level.',
    descriptionZh: "甕城重門,固若金湯。每等級城防 +12、煽動類謀略效果降低 20%。",
    goldPerLevel: 650,
    seasonsPerLevel: 4,
    maxLevel: 4,
    effect: '+12 defense / instigate resistance per level',
  },
  {
    id: 'evernormal',
    name: { en: 'Ever-Normal Granary', zh: '常平倉' },
    description: 'Buys grain cheap and sells dear to steady prices. +10% agriculture and +5% commerce per level.',
    descriptionZh: "平糴平糶、豐歉相濟之倉。每等級農業 +10%、商業 +5%。",
    goldPerLevel: 400,
    seasonsPerLevel: 2,
    maxLevel: 4,
    effect: '+10% food / +5% commerce per level',
  },
  {
    id: 'drillground',
    name: { en: 'Drill Ground', zh: '演武場' },
    description: 'Where soldiers and officers hone their craft. +6% troop training and +8% officer XP per level.',
    descriptionZh: "操練士卒、演武較技之場。每等級徵兵 +6%、武將經驗 +8%。",
    goldPerLevel: 500,
    seasonsPerLevel: 3,
    maxLevel: 4,
    effect: '+6% recruit / +8% officer XP per level',
  },
  {
    id: 'irrigation',
    name: { en: 'Irrigation Works', zh: '水利' },
    description: 'Canals and tanks against drought. +8% agriculture per level; blunts the drought harvest penalty.',
    descriptionZh: "陂塘溝渠、引水抗旱。每等級農業 +8%;削弱旱災減產(三級約抵 3/4)。",
    goldPerLevel: 450,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: '+8% food / drought mitigation per level',
  },
  {
    id: 'recruithall',
    name: { en: 'Hall of Worthies', zh: '招賢館' },
    description: 'Courts roving talent. +8% officer-recruit chance and +6% officer XP per level.',
    descriptionZh: "禮賢下士、廣納游俊。每等級招攬在野武將成功率 +8%、武將經驗 +6%。",
    goldPerLevel: 500,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: '+8% recruit-officer chance / +6% XP per level',
  },
  {
    id: 'spyoffice',
    name: { en: 'Intelligence Bureau', zh: '諜報司' },
    description: 'Counter-intelligence. Enemy schemes against this city −15% effective and instigate ops resisted per level.',
    descriptionZh: "緝奸防諜之司。每等級敵方對本城謀略成功率 −15%、煽動類抵抗提升。",
    goldPerLevel: 550,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: 'enemy scheme −15% / instigate resistance per level',
  },
  {
    id: 'supplydepot',
    name: { en: 'Supply Depot', zh: '驛傳' },
    description: 'Forwards grain and arms to the front. +15% convoy capacity and +3% troop cap per level.',
    descriptionZh: "轉運糧秣軍械至前線。每等級出征補給運量 +15%、兵力上限 +3%。",
    goldPerLevel: 500,
    seasonsPerLevel: 3,
    maxLevel: 4,
    effect: '+15% convoy capacity / +3% troop cap per level',
  },
  {
    id: 'civicoffice',
    name: { en: 'Civic Office', zh: '安民坊' },
    description: 'Settles migrants and registers households. Faster population growth and +1 loyalty/season per level.',
    descriptionZh: "安置流民、編戶齊民。每等級人口成長加快、每季民忠 +1。",
    goldPerLevel: 450,
    seasonsPerLevel: 3,
    maxLevel: 4,
    effect: '+population growth / +1 loyalty per season per level',
  },
  {
    id: 'tradeoffice',
    name: { en: 'Maritime Trade Office', zh: '市舶司' },
    description: 'Taxes foreign and river trade. +10% trade/treaty income and +4% commerce per level.',
    descriptionZh: "掌外蕃與江海通商之稅。每等級對外/盟約貿易收入 +10%、商業 +4%。",
    goldPerLevel: 600,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: '+10% trade income / +4% commerce per level',
  },
  {
    id: 'warschool',
    name: { en: 'Military Academy', zh: '武學堂' },
    description: 'Schools officers in the art of war. +15% officer XP per level.',
    descriptionZh: "教習韜略弓馬之武學。每等級武將經驗 +15%。",
    goldPerLevel: 600,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: '+15% officer XP per level',
  },
  {
    id: 'quartermaster',
    name: { en: 'Quartermaster', zh: '糧倉署' },
    description: 'Stockpiles to field larger armies. +6% troop cap and +3% recruit per level.',
    descriptionZh: "屯儲以養大軍。每等級兵力上限 +6%、徵兵 +3%。",
    goldPerLevel: 500,
    seasonsPerLevel: 3,
    maxLevel: 4,
    effect: '+6% troop cap / +3% recruit per level',
  },
  {
    id: 'signaltower',
    name: { en: 'Signal Tower', zh: '譙樓' },
    description: 'Watch and beacon over the walls. +10 city defense and instigate resistance per level.',
    descriptionZh: "譙樓烽燧、瞭望禦敵。每等級城防 +10、抗滲透(煽動抵抗)提升。",
    goldPerLevel: 550,
    seasonsPerLevel: 4,
    maxLevel: 4,
    effect: '+10 defense / instigate resistance per level',
  },
  {
    id: 'fieldhospital',
    name: { en: 'Field Hospital', zh: '傷兵營' },
    description: 'Tends the wounded. Officers stationed here shake off duel/battle wounds faster; +1 loyalty/season per level.',
    descriptionZh: "療治傷卒之所。駐城武將養傷恢復加快;每等級每季民忠 +1。",
    goldPerLevel: 450,
    seasonsPerLevel: 3,
    maxLevel: 2,
    effect: 'faster wound recovery / +1 loyalty per season per level',
  },
  {
    id: 'daotemple',
    name: { en: 'Daoist Temple', zh: '道觀' },
    description: 'Steadies the faithful. Cult contagion erodes this city 30% less per level; +1 loyalty/season per level.',
    descriptionZh: "清靜安民之觀。每等級邪教蔓延對本城民心侵蝕 −30%;每季民忠 +1。",
    goldPerLevel: 400,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: 'cult contagion resist / +1 loyalty per season per level',
  },
  {
    id: 'lingtai',
    name: { en: 'Star Terrace', zh: '靈台' },
    description: 'Observatory of the court astronomers. Disaster loyalty hits in this city −25% per level; realm-wide, ill omens may be ritually deflected (20% per best level).',
    descriptionZh: "太史觀星之台。本城天災民忠損失每等級 −25%;且太史令可禳解凶兆 — 凶兆襲主公時,每最高等級 20% 機率移禍他國。",
    goldPerLevel: 700,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: 'disaster loyalty shield / ill-omen deflection per level',
  },
  {
    id: 'worksbureau',
    name: { en: 'Works Bureau', zh: '將作監' },
    description: 'Directs construction. Other buildings here cost 10% less and build faster per level.',
    descriptionZh: "掌營造之署。每等級本城其他建築造價 −10%、工期加快。",
    goldPerLevel: 600,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: '-10% build cost / faster builds per level',
  },
  {
    id: 'tavern',
    name: { en: 'Tavern', zh: '酒肆' },
    description: 'Where officers carouse and bond. +50% rapport growth between co-stationed officers, +1 loyalty/season and +3% commerce per level.',
    descriptionZh: "把酒言歡之所。同城武將情誼成長 +50%/級;每季民忠 +1、商業 +3%。",
    goldPerLevel: 350,
    seasonsPerLevel: 2,
    maxLevel: 3,
    effect: '+50% rapport growth / +1 loyalty / +3% commerce per level',
  },
  {
    id: 'prison',
    name: { en: 'Prison', zh: '牢城' },
    description: 'Enforces order. Officers here are less prone to defect or secede; instigate ops resisted per level.',
    descriptionZh: "彈壓不軌之牢城。駐城武將離反/割據傾向降低;每等級抗煽動提升。",
    goldPerLevel: 450,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: 'defection resistance / instigate resistance per level',
  },
  {
    id: 'pasture',
    name: { en: 'Horse Pasture', zh: '牧苑' },
    description: 'Breeds remounts. +5% troop cap and +5% recruit per level (cavalry).',
    descriptionZh: "牧養軍馬之苑。每等級兵力上限 +5%、徵兵 +5%(利騎兵)。",
    goldPerLevel: 500,
    seasonsPerLevel: 3,
    maxLevel: 4,
    effect: '+5% troop cap / +5% recruit per level',
  },
  {
    id: 'library',
    name: { en: 'Library', zh: '藏書閣' },
    description: 'A hall of books. +10% officer XP and instigate resistance per level.',
    descriptionZh: "藏典籍之閣。每等級武將經驗 +10%、抗離間提升。",
    goldPerLevel: 500,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: '+10% officer XP / instigate resistance per level',
  },
  {
    id: 'beacon',
    name: { en: 'Beacon Line', zh: '烽燧' },
    description: 'Long-range warning fires. +8 city defense and counters enemy schemes per level.',
    descriptionZh: "烽火傳警之線。每等級城防 +8、敵方謀略成功率降低。",
    goldPerLevel: 500,
    seasonsPerLevel: 4,
    maxLevel: 4,
    effect: '+8 defense / counter-scheme per level',
  },
  {
    id: 'armsbureau',
    name: { en: 'Arms Bureau', zh: '軍器監' },
    description: 'Master armourers. Refining items here is cheaper and may jump two grades at once per level.',
    descriptionZh: "良工巧匠之署。每等級精煉折價,且有機率一次精煉 +2 階。",
    goldPerLevel: 600,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: 'cheaper refine / chance of +2 refine per level',
  },
  {
    id: 'pricebureau',
    name: { en: 'Price Bureau', zh: '平準署' },
    description: 'Stabilises the coinage. Eases inflation faster (at the capital) and +3% commerce per level.',
    descriptionZh: "平準物價、穩定錢法。設於都城時通脹回落加快;每等級商業 +3%。",
    goldPerLevel: 550,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: 'eases inflation / +3% commerce per level',
  },
  {
    id: 'heraldhall',
    name: { en: 'Herald Hall', zh: '鴻臚館' },
    description: 'Receives envoys. Your diplomatic overtures land stronger and +3% commerce per level.',
    descriptionZh: "接待四方使節。每等級外交關係變動加成、商業 +3%。",
    goldPerLevel: 550,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: 'stronger diplomacy / +3% commerce per level',
  },
  {
    id: 'navalyard',
    name: { en: 'Naval Yard', zh: '樓船署' },
    description: 'War-junk works. +10 defense in water battles and +3% recruit per level.',
    descriptionZh: "造樓船戰艦之署。水戰每等級城防 +10、徵兵 +3%。",
    goldPerLevel: 600,
    seasonsPerLevel: 3,
    maxLevel: 4,
    effect: '+10 water-battle defense / +3% recruit per level',
  },
  {
    id: 'scoutcamp',
    name: { en: 'Scout Camp', zh: '斥候營' },
    description: 'Ranging spies and scouts. Espionage ops launched here succeed more often; instigate resistance per level.',
    descriptionZh: "斥候細作之營。每等級本城發動的諜報成功率提升、抗煽動。",
    goldPerLevel: 450,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: '+own espionage success / instigate resistance per level',
  },
  {
    id: 'barracks',
    name: { en: 'Barracks', zh: '兵營' },
    description: 'Trains soldiers. +10% troop training per level; +5% troop cap per level.',
    descriptionZh: "訓練士兵之所。每等級徵兵速度 +10%，兵力上限 +5%。",
    goldPerLevel: 400,
    seasonsPerLevel: 2,
    maxLevel: 5,
    effect: '+10% recruit / +5% troop cap per level',
  },
  {
    id: 'market',
    name: { en: 'Market', zh: '市場' },
    description: 'Stimulates commerce. +12% commerce gold per season per level.',
    descriptionZh: "繁榮商賈之地。每等級每季商業金收入 +12%。",
    goldPerLevel: 350,
    seasonsPerLevel: 2,
    maxLevel: 5,
    effect: '+12% commerce per level',
  },
  {
    id: 'foundry',
    name: { en: 'Foundry', zh: '鉄工坊' },
    description: 'Forges arms and tools. +8% troop training and +3% commerce per level.',
    descriptionZh: "鍛造兵器與工具。每等級徵兵速度 +8%，商業 +3%。",
    goldPerLevel: 500,
    seasonsPerLevel: 3,
    maxLevel: 4,
    effect: '+8% troop / +3% commerce per level',
  },
  {
    id: 'academy',
    name: { en: 'Academy', zh: '書院' },
    description: 'A school of letters. +15% officer XP, +5% recruit-officer chance per level.',
    descriptionZh: "文翰學府。每等級武將經驗 +15%，登庸成功率 +5%。",
    goldPerLevel: 600,
    seasonsPerLevel: 3,
    maxLevel: 4,
    effect: '+15% officer XP / +5% recruit per level',
  },
  {
    id: 'temple',
    name: { en: 'Temple', zh: '寺院' },
    description: 'A shrine for the people. +2 loyalty per season; instigate ops 30% less effective.',
    descriptionZh: "黎民祈福之所。每季民忠 +2；煽動類謀略效果降低 30%。",
    goldPerLevel: 300,
    seasonsPerLevel: 2,
    maxLevel: 3,
    effect: '+2 loyalty / season; instigate resistance per level',
  },
  {
    id: 'farm',
    name: { en: 'Farm Colony', zh: '屯田' },
    description: 'Military farmland. +15% agriculture food yield per level.',
    descriptionZh: "屯田軍墾。每等級農業糧產 +15%。",
    goldPerLevel: 250,
    seasonsPerLevel: 2,
    maxLevel: 5,
    effect: '+15% food per level',
  },
  {
    id: 'wall',
    name: { en: 'City Wall', zh: '城壁' },
    description: 'Reinforces the perimeter. +10 city defense per level.',
    descriptionZh: "加固城防。每等級城防 +10。",
    goldPerLevel: 700,
    seasonsPerLevel: 4,
    maxLevel: 4,
    effect: '+10 city defense per level',
  },
  {
    id: 'shipyard',
    name: { en: 'Shipyard', zh: '船渠' },
    description: 'Enables ship construction. Each level halves ship build time.',
    descriptionZh: "建造船艦之所。每升一級，造船時間減半。",
    goldPerLevel: 800,
    seasonsPerLevel: 3,
    maxLevel: 3,
    effect: 'Required to build ships; faster builds per level',
  },
];

/* 防災工程 — disasters stop being pure dice once you can build against
   them. Each protects only its own city; levels stack the mitigation. */
const DISASTER_WORKS: BuildingDef[] = [
  {
    id: 'granary',
    name: { en: 'Charity Granary', zh: '義倉' },
    description: 'Famine insurance. Each level: famine 20% rarer, losses 25% smaller.',
    descriptionZh: '荒年之備。每等級:饑荒發生 −20%,糧損 −25%。',
    goldPerLevel: 300,
    seasonsPerLevel: 2,
    maxLevel: 3,
    effect: '-20% famine odds / -25% famine loss per level',
  },
  {
    id: 'infirmary',
    name: { en: 'Infirmary', zh: '醫館' },
    description: 'Plague control. Each level: outbreaks 25% rarer, casualties 25% fewer.',
    descriptionZh: '疫病之防。每等級:瘟疫發生 −25%,死傷 −25%。',
    goldPerLevel: 350,
    seasonsPerLevel: 2,
    maxLevel: 3,
    effect: '-25% plague odds & losses per level',
  },
  {
    id: 'levee',
    name: { en: 'River Levee', zh: '堤防' },
    description: 'Flood works. Each level cuts flood odds by a third — level 3 stops the river cold.',
    descriptionZh: '治水之功。每等級洪災機率 −1/3,三級堤防水患絕跡。',
    goldPerLevel: 400,
    seasonsPerLevel: 2,
    maxLevel: 3,
    effect: 'flood odds -1/3 per level; immune at L3',
  },
];
BUILDING_DEFS.push(...DISASTER_WORKS);

export const BUILDING_DEFS_BY_ID: Record<string, BuildingDef> = Object.fromEntries(
  BUILDING_DEFS.map((b) => [b.id, b]),
);

/** 建築群 — each building's category (drives the same-city set-bonus synergy). */
export const BUILDING_CATEGORY: Record<BuildingId, BuildingCategory> = {
  // 經濟
  market: 'economy', mint: 'economy', relay: 'economy', tradeoffice: 'economy',
  pricebureau: 'economy', heraldhall: 'economy', worksbureau: 'economy',
  // 農政
  farm: 'agriculture', granary: 'agriculture', evernormal: 'agriculture', irrigation: 'agriculture',
  // 軍務
  barracks: 'military', foundry: 'military', stable: 'military', workshop: 'military',
  drillground: 'military', quartermaster: 'military', pasture: 'military',
  armsbureau: 'military', supplydepot: 'military',
  // 城防
  wall: 'defense', shipyard: 'defense', arsenal: 'defense', barbican: 'defense',
  signaltower: 'defense', beacon: 'defense', navalyard: 'defense',
  // 文教
  academy: 'culture', grandacademy: 'culture', recruithall: 'culture',
  warschool: 'culture', library: 'culture',
  // 民政
  temple: 'civic', infirmary: 'civic', levee: 'civic', civicoffice: 'civic',
  fieldhospital: 'civic', daotemple: 'civic', tavern: 'civic', prison: 'civic',
  lingtai: 'civic',
  // 諜報
  spyoffice: 'intel', scoutcamp: 'intel',
};

/**
 * 建築前置 — tier-2 works need their foundation built first (level ≥1 in the
 * same city). Gives construction a sensible order; only meaningful upgrades are
 * gated (most buildings have no prerequisite). Enforced for player AND AI.
 */
export const BUILDING_PREREQ: Partial<Record<BuildingId, BuildingId>> = {
  grandacademy: 'academy',    // 太學 ← 書院
  warschool: 'academy',       // 武學堂 ← 書院
  library: 'academy',         // 藏書閣 ← 書院
  evernormal: 'granary',      // 常平倉 ← 義倉
  armsbureau: 'foundry',      // 軍器監 ← 鐵工坊
  navalyard: 'shipyard',      // 樓船署 ← 船渠
  tradeoffice: 'market',      // 市舶司 ← 市場
  pricebureau: 'mint',        // 平準署 ← 錢莊
  heraldhall: 'market',       // 鴻臚館 ← 市場
  barbican: 'wall',           // 甕城 ← 城壁
  signaltower: 'wall',        // 譙樓 ← 城壁
  beacon: 'signaltower',      // 烽燧 ← 譙樓
  quartermaster: 'barracks',  // 糧倉署 ← 兵營
  drillground: 'barracks',    // 演武場 ← 兵營
  daotemple: 'temple',        // 道觀 ← 寺院
  fieldhospital: 'infirmary', // 傷兵營 ← 醫館
  scoutcamp: 'spyoffice',     // 斥候營 ← 諜報司
  worksbureau: 'foundry',     // 將作監 ← 鐵工坊
};

/**
 * 城格解鎖 — the realm's grandest works only rise in a city of sufficient size.
 * Growing a city up a tier (人口) is what unlocks these — turning 升城 into a
 * qualitative reward, not just bigger numbers. Enforced for player AND AI.
 * Buildings absent from this map have no size requirement.
 */
export const BUILDING_MIN_SIZE: Partial<Record<BuildingId, CitySize>> = {
  // 城 City (8 萬) — the four tier-2 civil/military works the GUIDE calls 二級內政.
  tradeoffice: 'city',   // 市舶司
  heraldhall:  'city',   // 鴻臚館
  armsbureau:  'city',   // 軍器監
  barbican:    'city',   // 甕城
  library:     'city',   // 藏書閣
  navalyard:   'city',   // 樓船署
  // 都 Metropolis (16 萬) — capital-scale institutions.
  grandacademy: 'large', // 太學
  pricebureau:  'large', // 平準署
  beacon:       'large', // 烽燧
  // 都 Capital (28 萬) — only a true metropolis seats these.
  warschool:    'capital', // 武學堂
};

/** Display labels for the building categories. */
export const BUILDING_CATEGORY_LABEL: Record<BuildingCategory, { zh: string; en: string }> = {
  economy:     { zh: '經濟', en: 'Economy' },
  agriculture: { zh: '農政', en: 'Agriculture' },
  military:    { zh: '軍務', en: 'Military' },
  defense:     { zh: '城防', en: 'Defense' },
  culture:     { zh: '文教', en: 'Culture' },
  civic:       { zh: '民政', en: 'Civic' },
  intel:       { zh: '諜報', en: 'Intelligence' },
};

/** Set-bonus multiplier for a category given how many of it a city has built.
 *  +6% per same-category building beyond the first, capped at +36% (7+). */
export function buildingGroupSynergy(count: number): number {
  return 1 + 0.06 * Math.min(6, Math.max(0, count - 1));
}

/** 理念 × 建築群 — each school of statecraft favours two building categories;
 *  buildings in a favoured category run +10% stronger for that realm. */
export const STATECRAFT_FAVORED_CATEGORIES: Record<string, BuildingCategory[]> = {
  legalist:   ['economy', 'defense'],      // 法家 富國強兵・信賞必罰
  confucian:  ['culture', 'civic'],        // 儒家 仁政教化
  daoist:     ['agriculture', 'civic'],    // 道家 與民休息
  militarist: ['military', 'agriculture'], // 兵家 耕戰立國
};

/** Per-building multiplier from a realm's statecraft school (1.0 if none/unmatched). */
export function statecraftCategoryMul(
  school: string | undefined | null,
  category: BuildingCategory,
): number {
  if (!school) return 1;
  return (STATECRAFT_FAVORED_CATEGORIES[school] ?? []).includes(category) ? 1.1 : 1;
}
