import type { Officer } from '../types';

/**
 * 神兵譜 — themed sets of legendary gear. Carry every piece of a set on one
 * officer and the matched arms resonate (套裝共鳴) for a battle-power bonus, on
 * top of each item's own effects. A collection meta layered on the new item
 * rarity: hunting down a full 桃園虎將 or 溫侯之配 set is its own goal.
 */
export interface ItemSet {
  id: string;
  name: { zh: string; en: string };
  /** All member item ids — the bonus applies only when the officer holds them all. */
  members: string[];
  /** Combat power bonus when the full set is equipped (e.g. 0.10 = +10%). */
  powerBonus: number;
  color: string;
}

export const ITEM_SETS: ItemSet[] = [
  {
    id: 'taoyuan-tigers',
    name: { zh: '桃園虎將', en: 'Peach-Garden Tigers' },
    members: ['green-dragon', 'snake-spear', 'dragon-gut'],
    powerBonus: 0.1,
    color: '#e6c473',
  },
  {
    id: 'wenhou',
    name: { zh: '溫侯之配', en: "Lü Bu's Arms" },
    members: ['sky-piercer', 'red-hare'],
    powerBonus: 0.12,
    color: '#8ee8ff',
  },
  {
    id: 'mengde-swords',
    name: { zh: '魏武雙鋒', en: "Cao Cao's Twin Blades" },
    members: ['yitian', 'qing-gang'],
    powerBonus: 0.08,
    color: '#cfd8e0',
  },
  {
    id: 'three-strategies',
    name: { zh: '韜略並修', en: 'Masters of Strategy' },
    members: ['sunzi-bingfa', 'taigong-bingfa', 'liu-tao'],
    powerBonus: 0.08,
    color: '#88b7e8',
  },
];

/** The sets an officer has fully assembled in their equipment. */
export function activeItemSets(officer: Officer): ItemSet[] {
  const owned = new Set(officer.equipment);
  return ITEM_SETS.filter((s) => s.members.every((m) => owned.has(m)));
}

/** 套裝共鳴 — combined combat-power multiplier from every full set an officer holds. */
export function itemSetPowerMul(officer: Officer): number {
  let mul = 1;
  for (const s of activeItemSets(officer)) mul *= 1 + s.powerBonus;
  return mul;
}
