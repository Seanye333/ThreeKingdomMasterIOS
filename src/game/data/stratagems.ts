import type { Stratagem } from '../types';

export const STRATAGEMS: Stratagem[] = [
  {
    id: 'fire-attack',
    name: { en: 'Fire Attack', zh: '火計' },
    description:
      'Set the enemy unit alight. Burning units lose 8% troops per turn for 3 turns. Doubled in wind, halved in rain.',
    descriptionZh: "藉風縱火，焚敵營寨。中計者每回合損兵八分，持續三回合；風起倍之，雨中減半。",
    minIntelligence: 70,
    range: 3,
    cooldown: 0,
  },
  {
    id: 'confusion',
    name: { en: 'Confusion', zh: '計略' },
    description:
      'Mislead an enemy commander. Confused units have AP halved for 2 turns.',
    descriptionZh: "計略惑敵將心智。中計之敵，行動力減半，持續兩回合。",
    minIntelligence: 75,
    range: 4,
    cooldown: 0,
  },
  {
    id: 'charge',
    name: { en: 'Charge', zh: '突撃' },
    description:
      'A devastating melee attack: +50% damage on this strike, but spends all remaining AP.',
    descriptionZh: "猛突敵陣，傷害增五成，惟耗盡所餘行動力。",
    minIntelligence: 0,
    minWar: 70,
    requiresUnitType: ['infantry', 'spearmen', 'cavalry'],
    range: 1,
    cooldown: 2,
  },
  {
    id: 'defend',
    name: { en: 'Defend', zh: '防御' },
    description:
      'Brace for impact. Incoming damage halved until your next turn.',
    descriptionZh: "嚴陣以待，至下回合前所受傷害減半。",
    minIntelligence: 0,
    range: 0,
    cooldown: 0,
  },
  {
    id: 'rally',
    name: { en: 'Rally', zh: '鼓舞' },
    description:
      'Inspire troops in an adjacent friendly unit, restoring 5% morale and 15% troops (capped at max).',
    descriptionZh: "鼓舞鄰近友軍，恢復士氣百分之五、兵力百分之十五（不超上限）。",
    minIntelligence: 60,
    range: 2,
    cooldown: 2,
  },
  {
    id: 'rain-of-arrows',
    name: { en: 'Rain of Arrows', zh: '矢雨齊發' },
    description:
      'A volley at range 2–4 dealing 12% damage to one enemy unit. Range halved at night.',
    descriptionZh: "於二至四格之外齊射，使敵一隊損兵一成二。夜間射程減半。",
    minIntelligence: 0,
    requiresUnitType: ['archers', 'siege'],
    range: 4,
    cooldown: 1,
  },
  {
    id: 'chain-ships',
    name: { en: 'Chain Ships', zh: '連環' },
    description:
      "Pang Tong's masterstroke. Link the target and its neighbors with chains for 4 turns. Damage to any chained enemy spreads 50% to the others. Devastating with fire.",
    descriptionZh: "龐統妙計。以鐵索連環，將敵目標與其鄰隊縛繫四回合，凡受傷者皆波及他者半數。若以火攻之，威力倍增。",
    minIntelligence: 80,
    signatureOf: ['pang-tong'],
    range: 3,
    cooldown: 0,
  },
  {
    id: 'false-retreat',
    name: { en: 'False Retreat', zh: '偽計' },
    description:
      'Pretend to break and flee. Closest enemy pursues — and arrives confused, losing AP next turn.',
    descriptionZh: "佯敗誘敵。最近之敵追擊而至，反陷混亂，下回合行動力盡失。",
    minIntelligence: 70,
    requiresUnitType: ['infantry', 'spearmen', 'cavalry'],
    range: 0,
    cooldown: 0,
  },
  {
    id: 'precognition',
    name: { en: 'Precognition', zh: '神算' },
    description:
      "Zhuge Liang & Sima Yi's mastery. See all enemy AP, status, and cooldowns for 2 turns. Reveals their next move intent.",
    descriptionZh: "諸葛、仲達之妙算。透視敵之行動力、狀態與冷卻，並預知其下一步，持續兩回合。",
    minIntelligence: 90,
    signatureOf: ['zhuge-liang', 'sima-yi', 'pang-tong', 'guo-jia'],
    range: 0,
    cooldown: 0,
  },
  {
    id: 'lightning',
    name: { en: "Heaven's Lightning", zh: '落雷' },
    description:
      'A bolt strikes a tile within 4 hexes for 15% damage. 30% chance to confuse the struck unit.',
    descriptionZh: "落雷自天而降，擊中四格內一地，造成一成五傷害，並有三成機率使中者心神昏亂。",
    minIntelligence: 85,
    range: 4,
    cooldown: 0,
  },
  {
    id: 'supply-strike',
    name: { en: 'Supply Strike', zh: '兵糧攻' },
    description:
      'Burn the enemy supply train. Every enemy unit on the map becomes demoralized: −20% damage dealt for 3 turns.',
    descriptionZh: "焚敵糧草輜重，使全場敵軍士氣低落，傷害減兩成，持續三回合。",
    minIntelligence: 75,
    range: 0,
    cooldown: 0,
  },
  {
    id: 'gallop',
    name: { en: "Flying General's Gallop", zh: '飛将' },
    description:
      "Lü Bu's signature. Charge up to 3 hexes in a straight line, attacking the first enemy you reach for +75% damage.",
    descriptionZh: "呂布飛將之姿。直線突進三格，迎面之敵受七成五重創。",
    minIntelligence: 0,
    signatureOf: ['lu-bu'],
    requiresUnitType: ['cavalry'],
    range: 3,
    cooldown: 3,
  },
  {
    id: 'dragon-veil',
    name: { en: "Zilong's Dragon Veil", zh: '龍威' },
    description:
      "Zhao Yun's signature. Make a free attack on every adjacent enemy with no AP cost.",
    descriptionZh: "趙子龍之龍威。免費對所有鄰敵各擊一次，不耗行動力。",
    minIntelligence: 0,
    signatureOf: ['zhao-yun'],
    range: 0,
    cooldown: 3,
  },
];

export const STRATAGEMS_BY_ID: Record<string, Stratagem> = Object.fromEntries(
  STRATAGEMS.map((s) => [s.id, s]),
);
