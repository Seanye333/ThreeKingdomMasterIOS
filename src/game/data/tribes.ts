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
    raidableCityIds: ['city-jianning', 'city-yongchang', 'city-yunnan', 'city-jiaozhou'],
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
    raidableCityIds: ['city-liaodong', 'city-youbeiping', 'city-yuyang', 'city-zhuojun'],
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
    raidableCityIds: ['city-shuofang', 'city-yunzhong', 'city-bingzhou', 'city-dingxiang'],
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
    raidableCityIds: ['city-jincheng', 'city-tianshui', 'city-anding', 'city-wuwei'],
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
    raidableCityIds: ['city-jianye', 'city-wujun', 'city-kuaiji', 'city-yuzhang'],
    baseAggression: 0.16,
    strengthMul: 0.85,
  },
];

export const TRIBES_BY_ID: Record<string, Tribe> = Object.fromEntries(
  TRIBES.map((t) => [t.id, t]),
);
