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
];

export const SHIP_CLASSES_BY_ID: Record<ShipClass, ShipClassDef> =
  Object.fromEntries(SHIP_CLASSES.map((s) => [s.id, s])) as Record<ShipClass, ShipClassDef>;
