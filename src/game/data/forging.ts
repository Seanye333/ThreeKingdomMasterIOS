import type { EntityId } from '../types';

/**
 * Forging recipes — combine gold + sacrificed items at a foundry-equipped
 * city to produce a target item. The cost in gold and required input items
 * is consumed; the new item is placed into the player's inventory (the
 * "lost items" pool at the foundry city, where any officer can equip it).
 */
export interface ForgeRecipe {
  id: EntityId;
  resultItemId: EntityId;
  goldCost: number;
  /** Required Foundry building level (0 = any foundry). */
  minFoundryLevel: number;
  /** Item IDs that must be in the same city's "lost items" pool to be sacrificed. */
  ingredients: EntityId[];
  description: string;
  descriptionZh?: string;
}

export const FORGE_RECIPES: ForgeRecipe[] = [
  {
    id: 'recipe-bagua-ji',
    resultItemId: 'bagua-ji',
    goldCost: 800,
    minFoundryLevel: 2,
    ingredients: ['hanyue-dao', 'panlong-gun'],
    description: 'Combine a moon-blade and a coiled-dragon staff into the legendary Eight-Trigrams Halberd.',
    descriptionZh: "以漢月刀與蟠龍棍合鑄，煉成傳奇神兵「八卦戟」。",
  },
  {
    id: 'recipe-fengchi',
    resultItemId: 'fengchi-jin-tang',
    goldCost: 1000,
    minFoundryLevel: 2,
    ingredients: ['liujin-chui', 'sanjian-liangren'],
    description: 'Forge the imperial Phoenix-Wing Gilt Trident from twin maces and a three-pointed blade.',
    descriptionZh: "以流金鎚與三尖兩刃刀鍛成御用「鳳翅金鏜」。",
  },
  {
    id: 'recipe-zhuge-crossbow',
    resultItemId: 'zhuge-crossbow',
    goldCost: 1200,
    minFoundryLevel: 3,
    ingredients: ['lian-nu', 'wujin-gong'],
    description: "Master Zhuge's repeating crossbow design — needs a repeating crossbow and a black-gold bow as base.",
    descriptionZh: "依諸葛先生連弩之制，以連弩與烏金弓為基，鑄成「諸葛連弩」。",
  },
  {
    id: 'recipe-xuanjia',
    resultItemId: 'xuanjia',
    goldCost: 600,
    minFoundryLevel: 1,
    ingredients: ['chain-mail'],
    description: 'Lacquer chain mail into the Tiger-and-Leopard Cavalry\'s signature black armor.',
    descriptionZh: "將鎖子甲漆塗烏黑，鑄成虎豹騎專屬「玄甲」。",
  },
  {
    id: 'recipe-qixing-deng',
    resultItemId: 'qixing-deng',
    goldCost: 900,
    minFoundryLevel: 2,
    ingredients: ['taichi-diagram', 'yu-bi'],
    description: "Construct Zhuge Liang's life-extending Seven-Star Lamp ritual array.",
    descriptionZh: "築起諸葛亮續命之「七星燈」法陣。",
  },
  {
    id: 'recipe-tiger-talisman',
    resultItemId: 'banma-fu',
    goldCost: 700,
    minFoundryLevel: 2,
    ingredients: ['tiger-talisman'],
    description: 'Refine a tiger talisman into the imperial Tiger Tally that commands troops.',
    descriptionZh: "提煉虎符，精製成可號令三軍之御用「斑馬符」。",
  },
  // ── Phase 2: more reachable recipes ──
  {
    id: 'recipe-green-dragon',
    resultItemId: 'green-dragon',
    goldCost: 2000,
    minFoundryLevel: 3,
    ingredients: ['fengzui-dao', 'kaishan-fu'],
    description: "Reforge the Crescent-Moon Blade — Guan Yu's 82-catty halberd.",
    descriptionZh: "重鑄青龍偃月刀——關羽八十二斤之神兵。",
  },
  {
    id: 'recipe-snake-spear',
    resultItemId: 'snake-spear',
    goldCost: 1500,
    minFoundryLevel: 3,
    ingredients: ['panlong-gun', 'tiejisha-mao'],
    description: "Forge the Eight-Foot Snake Spear from a coiled-dragon staff and an iron lance.",
    descriptionZh: "以蟠龍棍與鐵脊蛇矛合鑄丈八蛇矛。",
  },
  {
    id: 'recipe-qing-gang',
    resultItemId: 'qing-gang',
    goldCost: 1800,
    minFoundryLevel: 3,
    ingredients: ['twin-swords', 'yi-jing'],
    description: 'Temper the Blue Steel sword — Cao Cao\'s armor-cleaving blade.',
    descriptionZh: "煉成青釭劍——曹操之削鐵神刃。",
  },
  {
    id: 'recipe-meng-de',
    resultItemId: 'meng-de-xinshu',
    goldCost: 600,
    minFoundryLevel: 1,
    ingredients: ['sunzi-art'],
    description: "Annotate Sun-Tzu into Mengde's New Manual — a heretical commentary.",
    descriptionZh: "註孫子兵法成「孟德新書」。",
  },
  {
    id: 'recipe-sky-piercer',
    resultItemId: 'sky-piercer',
    goldCost: 2500,
    minFoundryLevel: 3,
    ingredients: ['guzhi-shuang-ji', 'twin-halberds'],
    description: "Cast Lu Bu's Sky-Piercer Halberd from twin halberds and double-edged crescents.",
    descriptionZh: "以孤直雙戟與雙鋒戟鑄方天畫戟。",
  },
  {
    id: 'recipe-purple-lightning',
    resultItemId: 'purple-lightning',
    goldCost: 1600,
    minFoundryLevel: 3,
    ingredients: ['twin-swords'],
    description: "Refine a twin-sword pair into the imperial Purple Lightning blade.",
    descriptionZh: "以雙股劍精煉成紫電御劍。",
  },
  {
    id: 'recipe-yu-pendant',
    resultItemId: 'feicui-yupei',
    goldCost: 500,
    minFoundryLevel: 1,
    ingredients: ['yu-pendant'],
    description: 'Polish a jade pendant into the Kingfisher Jade — finer court courtesy.',
    descriptionZh: "打磨玉珮成翡翠玉珮——朝廷風範愈彰。",
  },
  {
    id: 'recipe-zhaohuang',
    resultItemId: 'zhuahuang-feidian',
    goldCost: 1400,
    minFoundryLevel: 2,
    ingredients: ['zhaohuang', 'huangbiao'],
    description: "Combine Zhaohuang and Huangbiao steeds into the Yellow-Lightning warhorse.",
    descriptionZh: "合爪黃與黃驃成爪黃飛電寶馬。",
  },
];

export const FORGE_RECIPES_BY_ID: Record<string, ForgeRecipe> = Object.fromEntries(
  FORGE_RECIPES.map((r) => [r.id, r]),
);
