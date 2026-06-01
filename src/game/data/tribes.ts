import type { Tribe } from '../types';

/**
 * Foreign tribes pressing the Han frontiers. Raidable city IDs reference
 * existing scenario cities — adjust as the city catalog grows.
 */
export const TRIBES: Tribe[] = [
  {
    id: 'nanban',
    name: { en: 'Nanman', zh: '南蛮' },
    description:
      'The southern barbarian tribes of Meng Huo, riding war elephants and venomous beasts out of the jungle.',
    descriptionZh: "孟獲所統的南蠻諸部,駕馭戰象與毒獸出沒於叢林之中。",
    color: '#6e8a2a',
    raidableCityIds: ['jianning', 'yongchang', 'yunnan', 'jiaozhi'],
    baseAggression: 0.18,
    strengthMul: 1.0,
  },
  {
    id: 'wuhuan',
    name: { en: 'Wuhuan', zh: '烏桓' },
    description:
      'Horse-lords of the north-eastern steppe. Their cavalry pours through the Liaoxi corridor when the empire weakens.',
    descriptionZh: "東北草原的馬上君主。每逢中原衰微,其騎兵便自遼西走廊湧入。",
    color: '#8a6a3a',
    raidableCityIds: ['liaodong', 'beiping', 'yuyang', 'liucheng', 'ji'],
    baseAggression: 0.22,
    strengthMul: 1.2,
  },
  {
    id: 'xianbei',
    name: { en: 'Xianbei', zh: '鮮卑' },
    description:
      'Far-northern tribes — Tan Shihuai\'s heirs — who descend on the frontier in winter and vanish before spring.',
    descriptionZh: "極北諸部——檀石槐之後裔——冬日席捲邊塞,春至前無影無蹤。",
    color: '#5a4a8a',
    raidableCityIds: ['shuofang', 'yunzhong', 'wuyuan', 'yanmen', 'taiyuan'],
    baseAggression: 0.20,
    strengthMul: 1.1,
  },
  {
    id: 'qiang',
    name: { en: 'Qiang', zh: '羌' },
    description:
      'Tibetan-related highlanders of the north-west. The Han have never truly subdued them; Ma Teng and Ma Chao know their ways.',
    descriptionZh: "西北高原之藏系族群。漢室從未真正臣服之,唯馬騰、馬超深諳其道。",
    color: '#b8442e',
    raidableCityIds: ['jincheng', 'tianshui', 'anding', 'wuwei', 'longxi'],
    baseAggression: 0.25,
    strengthMul: 1.1,
  },
  {
    id: 'shanyue',
    name: { en: 'Shan Yue', zh: '山越' },
    description:
      'Mountain peoples of Wu — perpetual thorn in Sun Quan\'s side. Lu Xun and Zhuge Ke fought them for decades.',
    descriptionZh: "吳地山中民族——孫權永恆之心腹大患。陸遜、諸葛恪曾與之周旋數十年。",
    color: '#3a7d5a',
    raidableCityIds: ['jianye', 'wu', 'kuaiji', 'yuzhang', 'danyang'],
    baseAggression: 0.16,
    strengthMul: 0.85,
  },

  // ── D-set: 5 new frontier tribes ──
  {
    id: 'di',
    name: { en: 'Di', zh: '氐' },
    description:
      'Highland 氐 of the Wei-river headwaters — 楊千萬 of 白馬氐 the most famous chieftain. Allied with Han or Qiang depending on the season.',
    descriptionZh: "渭水源頭之氐族,白馬氐楊千萬最為知名。視時局與漢、羌結盟。",
    color: '#a85a3a',
    raidableCityIds: ['wudu', 'hanzhong', 'longxi', 'tianshui', 'baishuiguan'],
    baseAggression: 0.18,
    strengthMul: 0.95,
  },
  {
    id: 'xiongnu',
    name: { en: 'Xiongnu', zh: '匈奴' },
    description:
      'The 南匈奴 — once-mighty steppe empire reduced to vassal tribes in Bingzhou. 於夫羅 and 呼廚泉 lead in this era.',
    descriptionZh: "南匈奴——昔日草原帝國之餘部,寄居并州。於夫羅、呼廚泉為當代之主。",
    color: '#4a4a7a',
    raidableCityIds: ['wuyuan', 'yunzhong', 'shuofang', 'yanmen', 'taiyuan'],
    baseAggression: 0.17,
    strengthMul: 1.05,
  },
  {
    id: 'goguryeo',
    name: { en: 'Goguryeo', zh: '高句麗' },
    description:
      'Korean-peninsula kingdom of 高句麗. Often clashes with Liaodong forces; sacked 樂浪 commandery several times in the era.',
    descriptionZh: "朝鮮半島高句麗王國。時與遼東諸雄交鋒,屢次襲掠樂浪郡。",
    color: '#3a6a8a',
    raidableCityIds: ['lelang', 'daifang', 'xiangping', 'liaodong'],
    baseAggression: 0.14,
    strengthMul: 0.9,
  },
  {
    id: 'buyeo',
    name: { en: 'Buyeo', zh: '扶餘' },
    description:
      'Manchurian kingdom north of 遼東. Trades horses and hides to the Han; raids when grain prices spike.',
    descriptionZh: "遼東以北之滿洲王國。與漢通馬皮之貿,糧價飆漲則寇邊。",
    color: '#6a5a3a',
    raidableCityIds: ['xiangping', 'liaodong', 'lelang'],
    baseAggression: 0.10,
    strengthMul: 0.8,
  },
  {
    id: 'linyi',
    name: { en: 'Linyi', zh: '林邑' },
    description:
      'Southern Champa kingdom on the coast of modern Vietnam — established 192 AD when 區連 killed the Han 縣令. Raids 日南 and 九真 commanderies.',
    descriptionZh: "今越南海岸之林邑(占婆)王國——192年區連殺漢縣令而立國。襲擾日南、九真。",
    color: '#5a8a4a',
    raidableCityIds: ['rinan', 'jiuzhen', 'jiaozhi'],
    baseAggression: 0.13,
    strengthMul: 0.75,
  },
];

export const TRIBES_BY_ID: Record<string, Tribe> = Object.fromEntries(
  TRIBES.map((t) => [t.id, t]),
);
