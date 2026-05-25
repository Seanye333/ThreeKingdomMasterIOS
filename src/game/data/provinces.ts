import type { Province } from '../types';

/**
 * The 13 provinces of late Han / Three Kingdoms. cityIds reference the
 * real city catalog (see cities.ts) — bare ids, no 'city-' prefix.
 * Cities not in any province fall into a "frontier" group at lookup time.
 */
export const PROVINCES: Province[] = [
  {
    id: 'sili',
    name: { en: 'Sili', zh: '司隷' },
    description: 'The capital province, holding Luoyang and Chang\'an. The seat of the Han Court.',
    descriptionZh: '京畿之州,轄洛陽、長安。漢室朝廷所在。',
    color: '#d4a84a',
    cityIds: ['luoyang', 'changan', 'hulao', 'tongguan'],
  },
  {
    id: 'yu',
    name: { en: 'Yu', zh: '豫州' },
    description: 'The central plain — fertile, populous, the heart of the empire.',
    descriptionZh: '中原沃野——地肥民眾,帝國之心臟。',
    color: '#c19a3b',
    cityIds: ['xuchang', 'runan', 'chenliu', 'guandu'],
  },
  {
    id: 'ji',
    name: { en: 'Ji', zh: '冀州' },
    description: 'The richest province of the north. Yuan Shao\'s power base.',
    descriptionZh: '北方最富庶之州。袁紹之根基。',
    color: '#3a5a8a',
    cityIds: ['ye', 'pingyuan', 'nanpi', 'bohai', 'boling'],
  },
  {
    id: 'qing',
    name: { en: 'Qing', zh: '青州' },
    description: 'East-coast province, beset by Yellow Turban remnants.',
    descriptionZh: '東海濱之州,黃巾餘黨為禍。',
    color: '#5a8a8a',
    cityIds: ['beihai', 'linzi'],
  },
  {
    id: 'yan',
    name: { en: 'Yan', zh: '兗州' },
    description: 'Cao Cao\'s early base. Position straddles the central front.',
    descriptionZh: '曹操早年根基。橫據中原戰線。',
    color: '#8a5a3a',
    cityIds: ['puyang'],
  },
  {
    id: 'xu',
    name: { en: 'Xu', zh: '徐州' },
    description: 'Fertile coastal province east of Yan; contested between Tao Qian, Lü Bu, and Liu Bei.',
    descriptionZh: '兗州以東之沃土沿海。陶謙、呂布、劉備皆曾爭奪。',
    color: '#6a8a3a',
    cityIds: ['xiapi', 'pengcheng', 'langya', 'guangling', 'xiaopei'],
  },
  {
    id: 'yang',
    name: { en: 'Yang', zh: '揚州' },
    description: 'The lower Yangtze. Sun family\'s home; the southern half of the realm.',
    descriptionZh: '長江下游。孫氏故鄉,天下之南。',
    color: '#2a7a4a',
    cityIds: ['jianye', 'wu', 'kuaiji', 'yuzhang', 'lujiang', 'shouchun', 'hefei', 'wuxi', 'linhai', 'chaisang', 'wuchang', 'poyang', 'luling', 'danyang'],
  },
  {
    id: 'jing',
    name: { en: 'Jing', zh: '荊州' },
    description: 'The strategic middle. Where Liu Biao ruled and Liu Bei rose. The pivot of the realm.',
    descriptionZh: '兵家必爭之中樞。劉表治此,劉備崛起於斯。天下之樞紐。',
    color: '#7a4a8a',
    cityIds: ['xiangyang', 'jiangling', 'changsha', 'wuling', 'guiyang', 'lingling', 'jiangxia', 'xinye', 'wancheng', 'maicheng', 'fancheng', 'baqiu', 'xiling', 'yiling', 'xiaoting', 'bowang'],
  },
  {
    id: 'liang',
    name: { en: 'Liang', zh: '涼州' },
    description: 'The northwest marches. Ma Teng, Ma Chao, and the Qiang tribes.',
    descriptionZh: '西北邊陲。馬騰、馬超與羌族之地。',
    color: '#b8442e',
    cityIds: ['jincheng', 'tianshui', 'wuwei', 'anding', 'jiuquan', 'dunhuang', 'longxi', 'shanggui', 'chencang'],
  },
  {
    id: 'bing',
    name: { en: 'Bing', zh: '并州' },
    description: 'The northern frontier — Lü Bu\'s homeland, exposed to Xianbei raids.',
    descriptionZh: '北方邊塞——呂布故鄉,鮮卑屢屢來襲。',
    color: '#5a4a8a',
    cityIds: ['taiyuan', 'shangdang', 'shuofang', 'yanmen', 'hukou'],
  },
  {
    id: 'you',
    name: { en: 'You', zh: '幽州' },
    description: 'Far northeast. Gongsun Zan\'s domain, exposed to Wuhuan and Xianbei.',
    descriptionZh: '東北極遠。公孫瓚之領土,常受烏桓、鮮卑威脅。',
    color: '#3a5a3a',
    cityIds: ['yuyang', 'beiping', 'liaodong', 'xiangping', 'yi-county', 'wuhuan'],
  },
  {
    id: 'yi',
    name: { en: 'Yi', zh: '益州' },
    description: 'The basin of Shu — fenced by mountains, the heart of Liu Bei\'s realm.',
    descriptionZh: '蜀地盆地——群山環抱,劉備霸業之心。',
    color: '#3a7d4a',
    cityIds: ['chengdu', 'hanzhong', 'yongan', 'jiangzhou', 'baxi', 'yinping', 'xincheng', 'wudu', 'shangyong', 'yangping', 'mei', 'wuguan', 'nanzhong', 'jianning', 'yongchang', 'yunnan', 'yuexi'],
  },
  {
    id: 'jiao',
    name: { en: 'Jiao', zh: '交州' },
    description: 'The far southern coast — jungles, monsoons, and Shi Xie.',
    descriptionZh: '極南海濱——叢林、季風與士燮之地。',
    color: '#5a8a4a',
    cityIds: ['jiaozhi', 'nanhai', 'hepu', 'cangwu', 'guilin'],
  },
];

export const PROVINCES_BY_ID: Record<string, Province> = Object.fromEntries(
  PROVINCES.map((p) => [p.id, p]),
);

/** Reverse index: city → province */
export const PROVINCE_BY_CITY: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const p of PROVINCES) {
    for (const cid of p.cityIds) map[cid] = p.id;
  }
  return map;
})();
