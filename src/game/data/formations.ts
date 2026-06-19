import type { FormationDef } from '../types';

export const FORMATIONS: FormationDef[] = [
  {
    id: 'none',
    name: { en: 'No Formation', zh: '無陣' },
    description: 'Standard loose deployment. No bonuses, no penalties.',
    descriptionZh: '散兵列陣,無加成亦無懲罰。',
    minIntelligence: 0,
  },
  {
    id: 'fish-scale',
    name: { en: 'Fish Scale', zh: '魚鱗' },
    description:
      'Tight overlapping ranks. Adjacent friendly units share +15% defense. Cao Cao\'s favored formation.',
    descriptionZh: '層疊密列如魚鱗。相鄰友軍防禦 +15%。曹操之愛陣。',
    minIntelligence: 60,
  },
  {
    id: 'eight-trigrams',
    name: { en: 'Eight Trigrams', zh: '八陣' },
    description:
      'Zhuge Liang\'s masterwork. Allies in formation heal 4% troops per turn; enemies adjacent to two formation units lose 1 AP.',
    descriptionZh: '諸葛亮畢生之傑作。陣中友軍每回合回兵 4%;鄰接兩個陣中單位的敵軍每回合行動點 −1。',
    minIntelligence: 90,
  },
  {
    id: 'arrow-tip',
    name: { en: 'Arrow Tip', zh: '鋒矢' },
    description:
      'Spearhead deployment. Charge stratagem deals +25% damage; cavalry get +1 movement.',
    descriptionZh: '銳矢突陣。突擊計策傷害 +25%;騎兵移動 +1。',
    minIntelligence: 65,
  },
  {
    id: 'crane-wing',
    name: { en: 'Crane Wing', zh: '鶴翼' },
    description:
      'Wide encircling deployment. Archers and rain-of-arrows gain +1 range.',
    descriptionZh: '左右翼大張如鶴展翅。弓兵與箭雨射程 +1。',
    minIntelligence: 70,
  },
  {
    id: 'spread-out',
    name: { en: 'Loose Order', zh: '散開' },
    description:
      'Wide spacing. −40% damage from fire-attack, lightning, and arrow volleys; −10% damage dealt.',
    descriptionZh: '兵員疏散。火攻、雷擊、箭雨傷害 −40%;己方傷害 −10%。',
    minIntelligence: 50,
  },
  // ── Attack ──
  {
    id: 'awl',
    name: { en: 'Awl', zh: '錐行' },
    description:
      'V-shaped piercing spearhead. First-turn melee strikes deal +35% damage. Best for ambush opens; loses edge after sustained combat.',
    descriptionZh: '錐形突進陣。首回合近戰傷害 +35%。適於奇襲開局,持久戰則銳氣漸消。',
    minIntelligence: 65,
  },
  {
    id: 'wheel',
    name: { en: 'Cart-Wheel', zh: '車懸' },
    description:
      'Front rank rotates back after each charge. Each turn, own losses reduced by an additional 5% (compounding) as fresh ranks engage.',
    descriptionZh: '前列衝鋒後輪換至後。每回合我方損失再減 5%(複利),前列輪換不息。',
    minIntelligence: 75,
  },
  // ── Defense ──
  {
    id: 'square',
    name: { en: 'Hollow Square', zh: '方圓' },
    description:
      'Defensive box facing all four sides. +20% defense from any direction, but movement −20%. Cannot be flanked.',
    descriptionZh: '四面結方陣。各方向防禦 +20%,移動 −20%。免疫包夾。',
    minIntelligence: 55,
  },
  {
    id: 'crescent-moon',
    name: { en: 'Crescent Moon', zh: '偃月' },
    description:
      'Crescent arc, wings curving back. Immune to encirclement; flank defense +15%. Guan Yu\'s namesake blade.',
    descriptionZh: '弧形月陣,兩翼後彎。免疫包圍,側翼防禦 +15%。關羽佩刀之名所自。',
    minIntelligence: 70,
  },
  // ── Balance ──
  {
    id: 'wild-goose',
    name: { en: 'Wild Goose', zh: '雁行' },
    description:
      'V-formation of mixed archers and cavalry. Archers +15% damage, all units +10% morale.',
    descriptionZh: '弓騎並列如雁行。弓兵傷害 +15%,全體士氣 +10%。',
    minIntelligence: 65,
  },
  {
    id: 'trinity',
    name: { en: 'Heaven-Earth-Human', zh: '三才' },
    description:
      'Three coordinated detachments — sky, ground, man. When 3+ allied officers fight together on this side, all stats +10%.',
    descriptionZh: '天、地、人三隊聯動。我方上場武將達三人以上時,全屬性 +10%。',
    minIntelligence: 70,
  },
  // ── High-INT exclusive ──
  {
    id: 'back-to-water',
    name: { en: 'Back to the Water', zh: '背水陣' },
    description:
      'Han Xin\'s death-or-victory deployment at Jingxing. +30% morale, +20% damage, −30% own losses. CANNOT retreat — must win or fall.',
    descriptionZh: '韓信井陘背水之陣。士氣 +30%、傷害 +20%、我方損失 −30%。然不可撤退——勝則生,敗則死。',
    minIntelligence: 80,
  },
  {
    id: 'ten-ambush',
    name: { en: 'Ten-Sided Ambush', zh: '十面埋伏' },
    description:
      'Han Xin\'s masterpiece at Gaixia. Multi-axis simultaneous strike. +25% surprise damage. Each enemy unit has 20% chance to lose 1 AP per turn (panic).',
    descriptionZh: '韓信垓下之絕筆。十路同擊,奇襲傷害 +25%。敵每單位每回合 20% 機率慌亂(行動點 −1)。',
    minIntelligence: 95,
  },
  // ── Historical specialty ──
  {
    id: 'long-snake',
    name: { en: 'Long Snake', zh: '長蛇' },
    description:
      'Single-file column for narrow passes and mountain roads. Front damage +25% in mountain/pass terrain, but side attacks deal +20% extra losses.',
    descriptionZh: '單列縱隊,專行山徑關隘。山地關口正面傷害 +25%,然側翼受擊損失 +20%。',
    minIntelligence: 60,
  },
  {
    id: 'crescent-withdraw',
    name: { en: 'Crescent Withdrawal', zh: '却月陣' },
    description:
      'Liu Yu\'s riverside formation: armored carts ring a crossbow corps. Archer range +1, archer damage +25%. Movement halved.',
    descriptionZh: '劉裕之沿江陣:鐵車環抱弩兵。弓兵射程 +1、傷害 +25%。移動減半。',
    minIntelligence: 85,
  },
  // ── Anti-cavalry / specialist ──
  {
    id: 'yoke',
    name: { en: 'Yoke', zh: '衡軛' },
    description:
      'V-shaped pikes locked at the joint. +50% damage vs cavalry; no effect vs infantry/archers.',
    descriptionZh: '長戟交叉如衡軛。對騎兵傷害 +50%,對步兵、弓兵無效。',
    minIntelligence: 65,
  },
  {
    id: 'armored-cart',
    name: { en: 'Armored Cart Line', zh: '武剛車' },
    description:
      "Han Wudi's anti-Xiongnu deployment — iron-plated war carts linked in line. +50% defense vs cavalry; movement halved.",
    descriptionZh: '漢武帝抗匈奴之陣——鐵甲戰車連環成列。對騎兵防禦 +50%,移動減半。',
    minIntelligence: 70,
  },
  // ── Daoist / mystical ──
  {
    id: 'seven-star',
    name: { en: 'Seven Star', zh: '七星' },
    description:
      "Beidou ritual deployment after the Northern Dipper. Stratagem range +1 and stratagem success rate +20%. Zhuge Liang's altar layout.",
    descriptionZh: '依北斗七星布陣。計策射程 +1、成功率 +20%。諸葛亮七星壇之佈局。',
    minIntelligence: 88,
  },
  {
    id: 'five-elements',
    name: { en: 'Five Elements', zh: '五行' },
    description:
      "Metal / wood / water / fire / earth rotation. Each turn a different element auto-buffs your side: weapons / defense / move / archers / loss-reduction.",
    descriptionZh: '金木水火土輪替之陣。每回合不同元素自動加成:武器 / 防禦 / 移動 / 弓兵 / 減損。',
    minIntelligence: 85,
  },
  {
    id: 'four-symbols',
    name: { en: 'Four Symbols', zh: '四象' },
    description:
      "Azure Dragon east attack + White Tiger west defense + Vermilion Bird south fire + Black Tortoise north water. +15% in all directions, capped.",
    descriptionZh: '青龍主東攻、白虎主西守、朱雀主南火、玄武主北水。四方各 +15%(上限封頂)。',
    minIntelligence: 80,
  },
  // ── Special / regional ──
  {
    id: 'rattan-armor',
    name: { en: 'Rattan-Armor Line', zh: '藤甲' },
    description:
      "Wuge tribesmen in oil-cured rattan. Arrows skid off (−60% archer damage taken), but fire deals 2× damage. Wutugu's signature.",
    descriptionZh: '烏戈藤甲油浸而成。箭矢滑落(受弓兵傷害 −60%),然遇火傷害 ×2。兀突骨之招牌。',
    minIntelligence: 50,
  },
  {
    id: 'stacked',
    name: { en: 'Layered Shield-Wall', zh: '疊陣' },
    description:
      "Song-era anti-cavalry: front shields, middle pikes, rear crossbows. −40% frontal damage taken; movement −1.",
    descriptionZh: '宋代抗騎之陣:前盾、中槍、後弩。正面受擊 −40%,移動 −1。',
    minIntelligence: 70,
  },
  {
    id: 'mandarin-duck',
    name: { en: 'Mandarin Duck', zh: '鴛鴦' },
    description:
      "Qi Jiguang's 11-man anti-pirate squad — shield, langxian, pike, fork in one unit. Melee damage +25%, but requires close coordination.",
    descriptionZh: '戚繼光抗倭十一人之陣——盾、狼筅、長槍、鈀同伍。近戰傷害 +25%,然需密切配合。',
    minIntelligence: 75,
  },
];

export const FORMATIONS_BY_ID: Record<string, FormationDef> =
  Object.fromEntries(FORMATIONS.map((f) => [f.id, f]));
