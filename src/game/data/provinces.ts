import type { Province } from '../types';

/**
 * The 13 provinces of late Han / Three Kingdoms. cityIds reference the
 * real city catalog (see cities.ts) — bare ids, no 'city-' prefix.
 * Cities not in any province fall into a "frontier" group at lookup time.
 *
 * ⚠ 2026-08-05:補進 35 座**原本不屬於任何州**的城。它們不是無關緊要的關隘
 * —— 常山、信都、中山、黎陽全在冀州,白馬、延津是東郡(兗州),薊是幽州治所,
 * 譙是沛國(豫州),梓潼涪城綿竹雒城葭萌全在益州。漏掉的後果是
 * `control-province` 這一類目標**數不到它們**:兗州因此只有濮陽一座城、
 * 冀州只有五座 —— 袁紹的「盡取冀州」字面是一州,實際只要五座城。
 * 由 `scripts/content-audit.ts` 掃出來的。
 */
export const PROVINCES: Province[] = [
  {
    id: 'sili',
    name: { en: 'Sili', zh: '司隸' },
    description: 'The capital province, holding Luoyang and Chang\'an. The seat of the Han Court.',
    descriptionZh: '京畿之州,轄洛陽、長安。漢室朝廷所在。',
    color: '#d4a84a',
    // 郿(右扶風,董卓郿塢)與武關(弘農商縣,關中南門)自益州移回 —— 見益州條的說明。
    cityIds: ['luoyang', 'changan', 'hulao', 'tongguan', 'mei', 'wuguan', 'hanguguan', 'sanguan'],
  },
  {
    id: 'yu',
    name: { en: 'Yu', zh: '豫州' },
    description: 'The central plain — fertile, populous, the heart of the empire.',
    descriptionZh: '中原沃野——地肥民眾,帝國之心臟。',
    color: '#c19a3b',
    cityIds: ['xuchang', 'runan', 'chenliu', 'guandu', 'qiao'],
  },
  {
    id: 'ji',
    name: { en: 'Ji', zh: '冀州' },
    description: 'The richest province of the north. Yuan Shao\'s power base.',
    descriptionZh: '北方最富庶之州。袁紹之根基。',
    color: '#3a5a8a',
    cityIds: ['ye', 'pingyuan', 'nanpi', 'bohai', 'boling', 'changshan', 'xindu', 'zhongshan', 'liyang'],
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
    cityIds: ['puyang', 'baima', 'yanjin'],
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
    cityIds: ['jianye', 'wu', 'kuaiji', 'yuzhang', 'lujiang', 'shouchun', 'hefei', 'wuxi', 'linhai', 'chaisang', 'wuchang', 'poyang', 'luling', 'danyang', 'ruxu', 'wan'],
  },
  {
    id: 'jing',
    name: { en: 'Jing', zh: '荊州' },
    description: 'The strategic middle. Where Liu Biao ruled and Liu Bei rose. The pivot of the realm.',
    descriptionZh: '兵家必爭之中樞。劉表治此,劉備崛起於斯。天下之樞紐。',
    color: '#7a4a8a',
    cityIds: ['xiangyang', 'jiangling', 'changsha', 'wuling', 'guiyang', 'lingling', 'jiangxia', 'xinye', 'wancheng', 'maicheng', 'fancheng', 'baqiu', 'xiling', 'yiling', 'xiaoting', 'bowang', 'gongan', 'chibi', 'changban'],
  },
  {
    id: 'liang',
    name: { en: 'Liang', zh: '涼州' },
    description: 'The northwest marches. Ma Teng, Ma Chao, and the Qiang tribes.',
    descriptionZh: '西北邊陲。馬騰、馬超與羌族之地。',
    color: '#b8442e',
    cityIds: ['jincheng', 'tianshui', 'wuwei', 'anding', 'jiuquan', 'dunhuang', 'longxi', 'shanggui', 'chencang', 'jieting', 'xiaoguan', 'zhangye'],
  },
  {
    id: 'bing',
    name: { en: 'Bing', zh: '并州' },
    description: 'The northern frontier — Lü Bu\'s homeland, exposed to Xianbei raids.',
    descriptionZh: '北方邊塞——呂布故鄉,鮮卑屢屢來襲。',
    color: '#5a4a8a',
    cityIds: ['taiyuan', 'shangdang', 'shuofang', 'yanmen', 'hukou', 'yunzhong', 'wuyuan'],
  },
  {
    id: 'you',
    name: { en: 'You', zh: '幽州' },
    description: 'Far northeast. Gongsun Zan\'s domain, exposed to Wuhuan and Xianbei.',
    descriptionZh: '東北極遠。公孫瓚之領土,常受烏桓、鮮卑威脅。',
    color: '#3a5a3a',
    cityIds: ['yuyang', 'beiping', 'liaodong', 'xiangping', 'yi-county', 'wuhuan', 'ji', 'liucheng', 'juyongguan', 'lelang', 'daifang'],
  },
  {
    id: 'yi',
    name: { en: 'Yi', zh: '益州' },
    description: 'The basin of Shu — fenced by mountains, the heart of Liu Bei\'s realm.',
    descriptionZh: '蜀地盆地——群山環抱,劉備霸業之心。',
    color: '#3a7d4a',
    /*
     * 郿與武關**不在益州**,已移入司隸(2026-08-05)。
     *
     * 郿縣屬右扶風,去長安三十里 —— 董卓築郿塢之處;武關在弘農郡商縣,
     * 是關中通南陽的門戶。兩座都在關中,而它們被掛在益州底下,於是
     * 「盡取益州」這條目標**必須從據有長安的那一家手裡打下兩座關中城**。
     *
     * 190 盤實測:劉焉終局十七城(全盤最大),而主目標 0/12 —— 差的正是
     * 董卓手上的郿與武關。這條錯掛影響每一張有益州目標的盤,不只 190。
     */
    cityIds: ['chengdu', 'hanzhong', 'yongan', 'jiangzhou', 'baxi', 'yinping', 'xincheng', 'wudu', 'shangyong', 'yangping', 'nanzhong', 'jianning', 'yongchang', 'yunnan', 'yuexi', 'jiameng', 'zitong', 'fucheng', 'mianzhu', 'luocheng', 'baishuiguan', 'jianmen', 'qianwei'],
  },
  {
    id: 'jiao',
    name: { en: 'Jiao', zh: '交州' },
    description: 'The far southern coast — jungles, monsoons, and Shi Xie.',
    descriptionZh: '極南海濱——叢林、季風與士燮之地。',
    color: '#5a8a4a',
    cityIds: ['jiaozhi', 'nanhai', 'hepu', 'cangwu', 'guilin', 'zhuyai', 'jiuzhen', 'rinan'],
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
