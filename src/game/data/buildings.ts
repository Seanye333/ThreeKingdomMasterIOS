import type { BuildingDef } from '../types';

export const BUILDING_DEFS: BuildingDef[] = [
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
