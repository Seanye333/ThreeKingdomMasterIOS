import type { ShipClass, ShipClassDef } from '../types';

/** Three Kingdoms-era ship classes. Cost/build-time tuned so that a small
 *  port can field a useful flotilla in ~1 year of game time. */
export const SHIP_CLASSES: ShipClassDef[] = [
  {
    id: 'transport',
    name: { zh: '運船', en: 'Transport' },
    description: 'Cargo junk — moves troops + supplies between ports. Modest combat strength.',
    descriptionZh: "貨運舟船——於港口間運送兵員與糧秣。戰力中庸。",
    goldCost: 300,
    seasonsToBuild: 2,
    combatStrength: 50,
    capacity: 800,
  },
  {
    id: 'warship',
    name: { zh: '艨艟', en: 'Warship' },
    description: '蒙衝, oar-driven war junk with ram. Strong frontline ship at moderate cost.',
    descriptionZh: "蒙衝戰艦,槳力驅動且配有衝角。中等造價之強力前線戰船。",
    goldCost: 800,
    seasonsToBuild: 3,
    combatStrength: 200,
    capacity: 300,
  },
  {
    id: 'flagship',
    name: { zh: '樓船', en: 'Flagship Tower-Ship' },
    description: '楼船, three-deck command ship — slow to build, dominates naval battles.',
    descriptionZh: "樓船三層之指揮巨艦——建造耗時甚久,可主宰水戰。",
    goldCost: 2200,
    seasonsToBuild: 5,
    combatStrength: 600,
    capacity: 500,
  },

  // ── D-set: classic Three Kingdoms ship types ──
  {
    id: 'dou-jian',
    name: { zh: '鬥艦', en: 'Battle-Junk' },
    description: '鬥艦, mid-tier oared warship with raised fighting deck. Mainstay of the Chibi-era Wu fleet.',
    descriptionZh: "鬥艦,中型槳帆戰船,設高臺以利接舷。赤壁時東吳水師之主力。",
    goldCost: 600,
    seasonsToBuild: 2,
    combatStrength: 150,
    capacity: 250,
  },
  {
    id: 'zou-ge',
    name: { zh: '走舸', en: 'Fast Skiff' },
    description: '走舸, small fast skiff. Cheap, low capacity — used for boarding raids and river patrol.',
    descriptionZh: "走舸,輕便小艇。造價低、載量小——用於登舷夜襲與江面巡邏。",
    goldCost: 200,
    seasonsToBuild: 1,
    combatStrength: 60,
    capacity: 100,
  },
  {
    id: 'hai-hu',
    name: { zh: '海鶻', en: 'Sea-Hawk' },
    description: '海鶻, hull built like a sea-hawk: stable on open water, less effective on rivers.',
    descriptionZh: "海鶻,船型仿海鳥,於外洋極穩,於江河之中反不及它船。",
    goldCost: 1000,
    seasonsToBuild: 3,
    combatStrength: 220,
    capacity: 350,
  },
  {
    id: 'ge-chuan',
    name: { zh: '戈船', en: 'Halberd-Ship' },
    description: '戈船, deck mounted with long halberds — marine assault platform. Strong against boarders.',
    descriptionZh: "戈船,船上立長戈以拒登船——水戰肉搏之利器。對登舷者壓制力極強。",
    goldCost: 750,
    seasonsToBuild: 3,
    combatStrength: 180,
    capacity: 200,
  },
  {
    id: 'da-yi',
    name: { zh: '大翼', en: 'Great-Wing' },
    description: '大翼, Wu super-warship descended from Yue-state designs. Largest broadside in the era.',
    descriptionZh: "大翼,東吳承越國古制之超級戰艦。其舷側兵裝為三國之冠。",
    goldCost: 2800,
    seasonsToBuild: 6,
    combatStrength: 750,
    capacity: 600,
  },
];

export const SHIP_CLASSES_BY_ID: Record<ShipClass, ShipClassDef> =
  Object.fromEntries(SHIP_CLASSES.map((s) => [s.id, s])) as Record<ShipClass, ShipClassDef>;
