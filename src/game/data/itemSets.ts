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
  // ── 鍛造神兵套 — forge-only weapon sets (集齊全套方共鳴) ──
  {
    id: 'olympus',
    name: { zh: '奧林帕斯', en: 'Olympian Arms' },
    members: ['bosaidun-cha', 'aruisi-mao', 'zhousi-leiting', 'akiliusi-mao'],
    powerBonus: 0.13,
    color: '#e6c473',
  },
  {
    id: 'norse-gods',
    name: { zh: '北歐諸神', en: 'Arms of the Aesir' },
    members: ['leishen-chui', 'yongheng-qiang', 'tier-jian'],
    powerBonus: 0.10,
    color: '#8ee8ff',
  },
  {
    id: 'shanhai-fiends',
    name: { zh: '山海凶獸', en: 'Beasts of the Shanhaijing' },
    members: ['taotie-fu', 'qiongqi-qiang', 'xiangliu-ji'],
    powerBonus: 0.10,
    color: '#b07cd0',
  },
  {
    id: 'gulong-seven',
    name: { zh: '古龍七兵', en: "Gu Long's Seven Weapons" },
    members: ['kong-que-ling', 'chang-sheng-jian', 'li-bie-gou', 'bi-yu-dao2', 'duo-qing-huan'],
    powerBonus: 0.14,
    color: '#7ed68a',
  },
  // ── 武器 + 甲 同源套 — a forged weapon paired with its matching armor ──
  {
    id: 'xuanjia-cavalry',
    name: { zh: '玄甲鐵騎', en: 'Black-Armor Cavalry' },
    members: ['liuxing-zhuifeng-shuo', 'xuanjia'],
    powerBonus: 0.08,
    color: '#6a8fb0',
  },
  // ── 鍛造甲冑套 — forge-only armor sets ──
  {
    id: 'four-symbols-armor',
    name: { zh: '四象神甲', en: 'Four-Symbols Divine Armor' },
    members: ['qinglong-linjia', 'baihu-yinkai', 'zhuque-huojia', 'xuanwu-zhongjia'],
    powerBonus: 0.14,
    color: '#7ed68a',
  },
  {
    id: 'iron-guard',
    name: { zh: '重鎧鐵衛', en: 'Iron Guard' },
    members: ['xuantie-zhongkai', 'luoma-banjia', 'budong-mingwang-jia'],
    powerBonus: 0.10,
    color: '#8896a4',
  },
  // ── 名將全裝套 — a hero's full kit (兵器 + 坐騎 + 甲) resonates strongest ──
  {
    id: 'guan-yu-saint',
    name: { zh: '關羽武聖', en: 'Guan Yu, God of War' },
    members: ['green-dragon', 'red-hare'],
    powerBonus: 0.12,
    color: '#b8442e',
  },
  {
    id: 'zhao-yun-everwin',
    name: { zh: '趙雲常勝', en: 'Zhao Yun the Ever-Victorious' },
    members: ['dragon-gut', 'zhao-yun-yin-jia', 'zhaoye-yushizi'],
    powerBonus: 0.15,
    color: '#cfd8e0',
  },
  {
    id: 'zhang-fei-tenthousand',
    name: { zh: '張飛萬夫', en: 'Zhang Fei, Match for Ten Thousand' },
    members: ['snake-spear', 'zhang-fei-zhuo-jia'],
    powerBonus: 0.12,
    color: '#8896a4',
  },
  {
    id: 'huo-qubing-champion',
    name: { zh: '冠軍封狼', en: 'Champion of Langjuxu' },
    members: ['huo-qubing-jia', 'huo-mobei-jian'],
    powerBonus: 0.12,
    color: '#e6c473',
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
