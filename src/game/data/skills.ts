import type { Skill } from '../types';

/**
 * RTK-style innate skills. Each officer carries 0–4 of these and the combat
 * system reads them off the (commander + companions) side to apply bonuses.
 *
 * Naming follows RTK14 conventions; effects are tuned so a single elite skill
 * is worth roughly +10 raw stat points in the blended battle score.
 */
export const SKILLS: Skill[] = [
  // ─────────── Tier-S combat (defining skills of legendary warriors) ───────────
  {
    id: 'god-of-war',
    name: { en: 'God of War', zh: '武神' },
    category: 'combat',
    description:
      'A peerless warrior. +15 war in melee, +20% chance to win a duel.',
    descriptionZh: '蓋世猛將。近戰武力 +15，一騎打勝率 +20%。',
    combat: { warBonus: 15, duelChanceBonus: 0.2 },
  },
  {
    id: 'flying-general',
    name: { en: 'Flying General', zh: '飛将' },
    category: 'combat',
    description:
      'No mortal can stand against them. +18 war and a 15% chance to triple losses inflicted on the enemy.',
    descriptionZh: '凡人莫敵。武力 +18,15% 機率對敵造成三倍損失。',
    combat: { warBonus: 18, enemyLossMultiplier: 1.15 },
  },
  {
    id: 'sage-of-war',
    name: { en: 'Sage of War', zh: '兵聖' },
    category: 'combat',
    description: 'Mastery of every battlefield. +12 war, +8 leadership.',
    descriptionZh: '通曉萬般戰陣。武力 +12,統率 +8。',
    combat: { warBonus: 12, leadershipBonus: 8 },
  },
  {
    id: 'tiger-vanguard',
    name: { en: 'Tiger Vanguard', zh: '虎臣' },
    category: 'combat',
    description: 'Spearhead of any host. +10 war and a 10% boost to attack power.',
    descriptionZh: '三軍之先鋒。武力 +10,攻擊力 +10%。',
    combat: { warBonus: 10, powerMultiplier: 1.1 },
  },
  {
    id: 'iron-vow',
    name: { en: 'Iron Vow', zh: '鉄誓' },
    category: 'combat',
    description: 'Sworn to victory or death. +8 war and 10% lower own losses.',
    descriptionZh: '誓不勝即死。武力 +8,我方損失 −10%。',
    combat: { warBonus: 8, ownLossMultiplier: 0.9 },
  },

  // ─────────── Command (formation, troop discipline) ───────────
  {
    id: 'celestial-tactician',
    name: { en: 'Celestial Tactician', zh: '神算' },
    category: 'wisdom',
    description:
      'Reads every move before it is made. +12 leadership and +10% power on this side.',
    descriptionZh: '料敵於先機。統率 +12,我方戰力 +10%。',
    combat: { leadershipBonus: 12, powerMultiplier: 1.1 },
  },
  {
    id: 'crouching-dragon',
    name: { en: 'Crouching Dragon', zh: '臥龍' },
    category: 'wisdom',
    description:
      'Strategies that move heaven. +15 leadership; enemy stratagem effects halved.',
    descriptionZh: '計謀感天動地。統率 +15,敵方計策效果減半。',
    combat: { leadershipBonus: 15, defenseMultiplier: 1.1 },
  },
  {
    id: 'young-phoenix',
    name: { en: 'Young Phoenix', zh: '鳳雛' },
    category: 'wisdom',
    description: 'Genius equal to the Dragon. +13 leadership and +10% power.',
    descriptionZh: '才智與臥龍齊名。統率 +13,戰力 +10%。',
    combat: { leadershipBonus: 13, powerMultiplier: 1.1 },
  },
  {
    id: 'iron-formation',
    name: { en: 'Iron Formation', zh: '鉄壁' },
    category: 'command',
    description: 'Defensive lines unbreakable. +10 leadership and 15% less own losses.',
    descriptionZh: '陣列堅不可破。統率 +10,我方損失 −15%。',
    combat: { leadershipBonus: 10, ownLossMultiplier: 0.85 },
  },
  {
    id: 'imposing-host',
    name: { en: 'Imposing Host', zh: '威風' },
    category: 'command',
    description: 'Sheer presence shakes the enemy. +8 leadership and +5% power.',
    descriptionZh: '威勢震敵膽。統率 +8,戰力 +5%。',
    combat: { leadershipBonus: 8, powerMultiplier: 1.05 },
  },
  {
    id: 'siegemaster',
    name: { en: 'Siegemaster', zh: '攻城' },
    category: 'command',
    description: 'City walls hold no fear. +20% power when attacking a city.',
    descriptionZh: '不畏堅城。攻城時戰力 +20%。',
    combat: { powerMultiplier: 1.2 },
  },
  {
    id: 'wallwarden',
    name: { en: 'Wallwarden', zh: '守城' },
    category: 'command',
    description: 'A garrison commander without peer. Defending city defense ×1.3.',
    descriptionZh: '守將之翹楚。守城時城防 ×1.3。',
    combat: { defenseMultiplier: 1.3 },
  },

  // ─────────── Wisdom / stratagems ───────────
  {
    id: 'fire-master',
    name: { en: 'Fire Master', zh: '火神' },
    category: 'wisdom',
    description: 'Master of fire attacks. Enemy losses ×1.2.',
    descriptionZh: '精於火攻。敵方損失 ×1.2。',
    combat: { enemyLossMultiplier: 1.2 },
  },
  {
    id: 'ambush-master',
    name: { en: 'Ambush Master', zh: '伏兵' },
    category: 'wisdom',
    description: 'Sets impossible traps. Enemy losses ×1.15 and +5 leadership.',
    descriptionZh: '布下絕命陷阱。敵方損失 ×1.15,統率 +5。',
    combat: { enemyLossMultiplier: 1.15, leadershipBonus: 5 },
  },
  {
    id: 'iron-will',
    name: { en: 'Iron Will', zh: '剛胆' },
    category: 'wisdom',
    description: 'Immune to enemy stratagems. Defense ×1.15.',
    descriptionZh: '不受敵計所惑。防禦 ×1.15。',
    combat: { defenseMultiplier: 1.15 },
  },

  // ─────────── Civil & charismatic ───────────
  {
    id: 'benevolent',
    name: { en: 'Benevolent', zh: '仁徳' },
    category: 'civil',
    description: 'Beloved of the people. +5 city loyalty per season; +15% recruit success.',
    descriptionZh: '深得民心。所在城每季民忠 +5,徵兵成功率 +15%。',
    civil: { loyaltyAura: 5, recruitBonus: 0.15 },
  },
  {
    id: 'silver-tongue',
    name: { en: 'Silver Tongue', zh: '弁舌' },
    category: 'civil',
    description: 'Persuasion is power. +20% recruit success.',
    descriptionZh: '舌辯為力。徵兵成功率 +20%。',
    civil: { recruitBonus: 0.2 },
  },
  {
    id: 'eye-for-talent',
    name: { en: 'Eye for Talent', zh: '識才' },
    category: 'civil',
    description: 'Knows every gem. +15% recruit success, +5 loyalty aura.',
    descriptionZh: '慧眼識珠。徵兵成功率 +15%,民忠光環 +5。',
    civil: { recruitBonus: 0.15, loyaltyAura: 5 },
  },
  {
    id: 'administrator',
    name: { en: 'Administrator', zh: '内政' },
    category: 'civil',
    description: 'A master of the granaries. Internal affairs effects ×1.3.',
    descriptionZh: '倉廩司之能臣。內政效果 ×1.3。',
    civil: { internalMultiplier: 1.3 },
  },
  {
    id: 'tax-genius',
    name: { en: 'Tax Genius', zh: '財政' },
    category: 'civil',
    description: 'Coin flows wherever they walk. Commerce effects ×1.4.',
    descriptionZh: '金流隨之而至。商業效果 ×1.4。',
    civil: { internalMultiplier: 1.25 },
  },
  {
    id: 'farmer',
    name: { en: 'Farmer', zh: '農政' },
    category: 'civil',
    description: 'Knows every grain. Agriculture effects ×1.35.',
    descriptionZh: '通曉穀粒之理。農業效果 ×1.35。',
    civil: { internalMultiplier: 1.2 },
  },

  // ─────────── Special / unique ───────────
  {
    id: 'archer-master',
    name: { en: 'Archer Master', zh: '弓神' },
    category: 'combat',
    description: 'A bow that does not miss. +10 war, enemy losses ×1.1.',
    descriptionZh: '箭無虛發。武力 +10,敵方損失 ×1.1。',
    combat: { warBonus: 10, enemyLossMultiplier: 1.1 },
  },
  {
    id: 'cavalry-master',
    name: { en: 'Cavalry Master', zh: '騎神' },
    category: 'combat',
    description: 'Born in the saddle. +10 war and +10% power on field battles.',
    descriptionZh: '馬背生長之人。武力 +10,野戰戰力 +10%。',
    combat: { warBonus: 10, powerMultiplier: 1.1 },
  },
  {
    id: 'navy-master',
    name: { en: 'Navy Master', zh: '水神' },
    category: 'combat',
    description: 'Lord of the rivers. +12 leadership on water; +5% power.',
    descriptionZh: '江河之主宰。水戰統率 +12,戰力 +5%。',
    combat: { leadershipBonus: 12, powerMultiplier: 1.05 },
  },
  {
    id: 'brave',
    name: { en: 'Brave', zh: '勇猛' },
    category: 'combat',
    description: 'Courage that inspires. +6 war.',
    descriptionZh: '勇氣激勵全軍。武力 +6。',
    combat: { warBonus: 6 },
  },
  {
    id: 'tireless',
    name: { en: 'Tireless', zh: '不屈' },
    category: 'combat',
    description: 'Cannot be ground down. Own losses ×0.92.',
    descriptionZh: '不可磨滅之意志。我方損失 ×0.92。',
    combat: { ownLossMultiplier: 0.92 },
  },
  {
    id: 'pursuit',
    name: { en: 'Pursuit', zh: '追撃' },
    category: 'combat',
    description: 'Routed enemies are finished. Enemy losses ×1.12.',
    descriptionZh: '潰兵無處可逃。敵方損失 ×1.12。',
    combat: { enemyLossMultiplier: 1.12 },
  },
  {
    id: 'rear-guard',
    name: { en: 'Rear Guard', zh: '殿軍' },
    category: 'combat',
    description: 'Steady in defeat. Own losses ×0.85.',
    descriptionZh: '敗中不亂。我方損失 ×0.85。',
    combat: { ownLossMultiplier: 0.85 },
  },
  {
    id: 'tiger-of-jiangdong',
    name: { en: 'Tiger of Jiangdong', zh: '江東之虎' },
    category: 'combat',
    description: 'The tiger who founded a dynasty. +12 war, +5 leadership.',
    descriptionZh: '開朝立國之虎。武力 +12,統率 +5。',
    combat: { warBonus: 12, leadershipBonus: 5 },
  },
  {
    id: 'little-conqueror',
    name: { en: 'Little Conqueror', zh: '小覇王' },
    category: 'combat',
    description: 'A conqueror in his youth. +14 war.',
    descriptionZh: '少年霸主。武力 +14。',
    combat: { warBonus: 14 },
  },
];

export const SKILLS_BY_ID: Record<string, Skill> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
);
