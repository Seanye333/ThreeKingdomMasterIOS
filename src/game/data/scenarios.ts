import type { Force, Scenario } from '../types';
import { buildInitialCities } from './cities';
import { buildInitialOfficers } from './officers';

// ──────────────────────────────────────────────────────────────────────
// Scenario 0 — 184 AD The Yellow Turban Rebellion
// ──────────────────────────────────────────────────────────────────────

const FORCES_184: Force[] = [
  { id: 'han',         name: { en: 'Han Court',       zh: '漢室'     }, rulerOfficerId: 'lu-zhi',      capitalCityId: 'luoyang',  color: '#d4a84a', isPlayer: false },
  { id: 'yellow-turban',name:{ en: 'Yellow Turbans',  zh: '黃巾'     }, rulerOfficerId: 'zhang-jiao',  capitalCityId: 'ye',       color: '#c19a3b', isPlayer: false },
  { id: 'huangfu',     name: { en: 'Huangfu Song',    zh: '皇甫嵩軍' }, rulerOfficerId: 'huangfu-song',capitalCityId: 'chenliu',  color: '#3a7dd9', isPlayer: false },
  { id: 'zhujun',      name: { en: 'Zhu Jun',         zh: '朱儁軍'   }, rulerOfficerId: 'zhu-jun',     capitalCityId: 'wancheng', color: '#5a9bb8', isPlayer: false },
  { id: 'dong-184',    name: { en: 'Dong Zhuo',       zh: '董卓軍'   }, rulerOfficerId: 'dong-zhuo',   capitalCityId: 'changan',  color: '#6b4a8a', isPlayer: false },
];

const CITY_OWNERSHIP_184: Record<string, string> = {
  luoyang:   'han',
  // Yellow Turbans control the troubled provinces.
  ye:        'yellow-turban',
  pingyuan:  'yellow-turban',
  beihai:    'yellow-turban',
  bohai:     'yellow-turban',
  // Loyalists hold the rest.
  chenliu:   'huangfu',
  pengcheng: 'huangfu',
  xiapi:     'huangfu',
  wancheng:  'zhujun',
  xiangyang: 'zhujun',
  // Dong Zhuo in the west.
  changan:   'dong-184',
  wuwei:     'dong-184',
  jincheng:  'dong-184',
  anding:    'dong-184',
  // Han loyalist outposts.
  xuchang:   'han',
  taiyuan:   'han',
  beiping:   'han',
  yanmen:    'han',
  shouchun:  'han',
  hefei:     'han',
  jianye:    'han',
  wu:        'han',
  changsha:  'han',
  chengdu:   'han',
  jiangxia:  'han',
  // Misc unowned cities default to null in buildInitialCities.
};

const OFFICER_ASSIGNMENTS_184: Record<string, { forceId: string; cityId: string }> = {
  // Han court loyalists
  'lu-zhi':       { forceId: 'han',          cityId: 'luoyang' },
  'wang-yun':     { forceId: 'han',          cityId: 'luoyang' },
  'huangfu-song': { forceId: 'huangfu',      cityId: 'chenliu' },
  'zhu-jun':      { forceId: 'zhujun',       cityId: 'wancheng' },
  // Yellow Turban core
  'zhang-jiao':   { forceId: 'yellow-turban',cityId: 'ye' },
  'zhang-bao-yt': { forceId: 'yellow-turban',cityId: 'pingyuan' },
  'zhang-liang-yt':{forceId: 'yellow-turban',cityId: 'ye' },
  'guan-hai':     { forceId: 'yellow-turban',cityId: 'beihai' },
  'pei-yuanshao': { forceId: 'yellow-turban',cityId: 'bohai' },
  'sun-zhong':    { forceId: 'yellow-turban',cityId: 'pingyuan' },
  'bo-cai':       { forceId: 'yellow-turban',cityId: 'ye' },
  'ma-yuanyi':    { forceId: 'yellow-turban',cityId: 'ye' },
  // Dong Zhuo (still a general at this point)
  'dong-zhuo':    { forceId: 'dong-184',     cityId: 'changan' },
  'li-jue':       { forceId: 'dong-184',     cityId: 'changan' },
  'guo-si':       { forceId: 'dong-184',     cityId: 'wuwei' },
  'ma-teng':      { forceId: 'dong-184',     cityId: 'jincheng' },
  // Future giants serving the Han at the start of their careers
  'cao-cao':      { forceId: 'huangfu',      cityId: 'chenliu' },
  'liu-bei':      { forceId: 'zhujun',       cityId: 'wancheng' },
  'guan-yu':      { forceId: 'zhujun',       cityId: 'wancheng' },
  'zhang-fei':    { forceId: 'zhujun',       cityId: 'wancheng' },
  'sun-jian':     { forceId: 'zhujun',       cityId: 'wancheng' },
  'yuan-shao':    { forceId: 'han',          cityId: 'luoyang' },
  'yuan-shu':     { forceId: 'han',          cityId: 'luoyang' },
};

const DEAD_BY_184: string[] = [];

export const SCENARIO_184_YELLOW_TURBAN: Scenario = {
  id: 'scn-184-yellow-turban',
  name: { en: 'The Yellow Turban Rebellion', zh: '黃巾之亂' },
  description:
    'Spring 184 AD. The Yellow Turbans rise across five provinces under Zhang Jiao\'s Way of Great Peace. ' +
    'The Han court rallies Huangfu Song, Lu Zhi, and Zhu Jun. Among their volunteers: a young Cao Cao, ' +
    'a sworn band of three brothers from Zhuo, and a tiger of Jiangdong named Sun Jian. The age of heroes begins.',
  descriptionZh: "公元184年春。張角創立太平道，黃巾之亂蜂起於五州。漢室急召皇甫嵩、盧植、朱儁三將平亂。投身義軍者中，有少年曹操、桃園結義之劉關張三兄弟、以及江東猛虎孫堅。英雄輩出之時代，自此而始。",
  startDate: { year: 184, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_184),
  forces: FORCES_184,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_184, DEAD_BY_184, 184),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario 1 — 190 AD Anti-Dong Zhuo Coalition (30 cities, 11 forces)
// ──────────────────────────────────────────────────────────────────────

const FORCES_190: Force[] = [
  { id: 'cao',       name: { en: 'Cao Cao',     zh: '曹操軍'   }, rulerOfficerId: 'cao-cao',     capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'yuan-shao', name: { en: 'Yuan Shao',   zh: '袁紹軍'   }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'ye',       color: '#b8442e', isPlayer: false },
  { id: 'yuan-shu',  name: { en: 'Yuan Shu',    zh: '袁術軍'   }, rulerOfficerId: 'yuan-shu',    capitalCityId: 'shouchun', color: '#a85d8a', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Jian',    zh: '孫堅軍'   }, rulerOfficerId: 'sun-jian',    capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'dong',      name: { en: 'Dong Zhuo',   zh: '董卓軍'   }, rulerOfficerId: 'dong-zhuo',   capitalCityId: 'luoyang',  color: '#6b4a8a', isPlayer: false },
  { id: 'liu-biao',  name: { en: 'Liu Biao',    zh: '劉表軍'   }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#c19a3b', isPlayer: false },
  { id: 'liu-yan',   name: { en: 'Liu Yan',     zh: '劉焉軍'   }, rulerOfficerId: 'liu-yan',     capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
  { id: 'gongsun',   name: { en: 'Gongsun Zan', zh: '公孫瓚軍' }, rulerOfficerId: 'gongsun-zan', capitalCityId: 'beiping',  color: '#5a9bb8', isPlayer: false },
  { id: 'tao',       name: { en: 'Tao Qian',    zh: '陶謙軍'   }, rulerOfficerId: 'tao-qian',    capitalCityId: 'pengcheng',color: '#8a8a3a', isPlayer: false },
  { id: 'kong-rong', name: { en: 'Kong Rong',   zh: '孔融軍'   }, rulerOfficerId: 'kong-rong',   capitalCityId: 'beihai',   color: '#d97a3a', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍'   }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#a8703a', isPlayer: false },
];

const CITY_OWNERSHIP_190: Record<string, string> = {
  // Cao Cao
  xuchang:   'cao',
  // Yuan Shao
  ye:        'yuan-shao',
  bohai:     'yuan-shao',
  // Yuan Shu (Nanyang + Huainan)
  shouchun:  'yuan-shu',
  wancheng:  'yuan-shu',
  runan:     'yuan-shu',
  hefei:     'yuan-shu',
  // Sun Jian
  jianye:    'sun',
  changsha:  'sun',
  yuzhang:   'sun',
  // Dong Zhuo
  luoyang:   'dong',
  changan:   'dong',
  // Liu Biao
  xiangyang: 'liu-biao',
  jiangxia:  'liu-biao',
  lingling:  'liu-biao',
  xinye:     'liu-biao',
  // Liu Yan
  chengdu:   'liu-yan',
  yongan:    'liu-yan',
  // Gongsun Zan
  beiping:   'gongsun',
  liaodong:  'gongsun',
  // Tao Qian
  pengcheng: 'tao',
  xiapi:     'tao',
  // Kong Rong
  beihai:    'kong-rong',
  // Ma Teng
  wuwei:     'ma-teng',
  // Cao Cao historical home base (Phase 12 addition)
  chenliu:   'cao',
  // Gongsun Zan / Liu Bei historical seat
  pingyuan:  'gongsun',
  // Liu Biao southern Jing
  wuling:    'liu-biao',
  // Liu Yan's east Sichuan
  jiangzhou: 'liu-yan',
  // Neutral: taiyuan, yanmen, jincheng, hanzhong, wu, jiaozhi,
  //          anding, shangdang, guiyang, nanhai, hepu, wudu
};

const OFFICER_ASSIGNMENTS_190: Record<string, { forceId: string; cityId: string }> = {
  // Cao
  'cao-cao':     { forceId: 'cao',       cityId: 'xuchang' },
  'xiahou-dun':  { forceId: 'cao',       cityId: 'xuchang' },
  'xiahou-yuan': { forceId: 'cao',       cityId: 'xuchang' },
  'cao-ren':     { forceId: 'cao',       cityId: 'xuchang' },
  'cao-hong':    { forceId: 'cao',       cityId: 'xuchang' },
  'yu-jin':      { forceId: 'cao',       cityId: 'xuchang' },
  'le-jin':      { forceId: 'cao',       cityId: 'xuchang' },
  'xun-yu':      { forceId: 'cao',       cityId: 'xuchang' },
  'guo-jia':     { forceId: 'cao',       cityId: 'xuchang' },
  // Gongsun (Liu Bei serves him in 190)
  'liu-bei':     { forceId: 'gongsun',   cityId: 'beiping' },
  'guan-yu':     { forceId: 'gongsun',   cityId: 'beiping' },
  'zhang-fei':   { forceId: 'gongsun',   cityId: 'beiping' },
  'gongsun-zan': { forceId: 'gongsun',   cityId: 'beiping' },
  // Yuan Shao
  'yuan-shao':   { forceId: 'yuan-shao', cityId: 'ye' },
  'yan-liang':   { forceId: 'yuan-shao', cityId: 'ye' },
  'wen-chou':    { forceId: 'yuan-shao', cityId: 'ye' },
  'zhang-he':    { forceId: 'yuan-shao', cityId: 'bohai' },
  'tian-feng':   { forceId: 'yuan-shao', cityId: 'ye' },
  // Yuan Shu
  'yuan-shu':    { forceId: 'yuan-shu',  cityId: 'shouchun' },
  'ji-ling':     { forceId: 'yuan-shu',  cityId: 'wancheng' },
  // Sun
  'sun-jian':    { forceId: 'sun',       cityId: 'jianye' },
  'cheng-pu':    { forceId: 'sun',       cityId: 'jianye' },
  'huang-gai':   { forceId: 'sun',       cityId: 'changsha' },
  'zhou-tai':    { forceId: 'sun',       cityId: 'jianye' },
  'han-dang':    { forceId: 'sun',       cityId: 'yuzhang' },
  // Dong
  'dong-zhuo':   { forceId: 'dong',      cityId: 'luoyang' },
  'lu-bu':       { forceId: 'dong',      cityId: 'luoyang' },
  'li-ru':       { forceId: 'dong',      cityId: 'changan' },
  // Liu Biao
  'liu-biao':    { forceId: 'liu-biao',  cityId: 'xiangyang' },
  // Liu Yan
  'liu-yan':     { forceId: 'liu-yan',   cityId: 'chengdu' },
  // Tao
  'tao-qian':    { forceId: 'tao',       cityId: 'pengcheng' },
  // Kong Rong
  'kong-rong':   { forceId: 'kong-rong', cityId: 'beihai' },
  // Ma Teng
  'ma-teng':     { forceId: 'ma-teng',   cityId: 'wuwei' },
};

export const SCENARIO_190_ANTI_DONG_ZHUO: Scenario = {
  id: 'scn-190-anti-dong-zhuo',
  name: { en: 'Anti-Dong Zhuo Coalition', zh: '反董卓聯軍' },
  description:
    'Spring 190 AD. Dong Zhuo controls the Han court at Luoyang and rules through terror. ' +
    'A coalition of regional lords assembles to depose him. 30 cities, 11 warlords vie for the empire.',
  descriptionZh: "公元190年春。董卓挾持漢室於洛陽，以暴虐震懾天下。各路州牧諸侯歃血為盟，誓討此賊。三十座城池，十一路群雄，逐鹿中原。",
  startDate: { year: 190, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_190),
  forces: FORCES_190,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_190),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario 2 — 200 AD Battle of Guandu (30 cities, 7 forces)
// ──────────────────────────────────────────────────────────────────────

const FORCES_200: Force[] = [
  { id: 'cao',       name: { en: 'Cao Cao',     zh: '曹操軍' }, rulerOfficerId: 'cao-cao',  capitalCityId: 'xuchang',   color: '#3a7dd9', isPlayer: false },
  { id: 'yuan-shao', name: { en: 'Yuan Shao',   zh: '袁紹軍' }, rulerOfficerId: 'yuan-shao',capitalCityId: 'ye',        color: '#b8442e', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Ce',      zh: '孫策軍' }, rulerOfficerId: 'sun-ce',   capitalCityId: 'jianye',    color: '#2f8e6f', isPlayer: false },
  { id: 'liu-bei',   name: { en: 'Liu Bei',     zh: '劉備軍' }, rulerOfficerId: 'liu-bei',  capitalCityId: 'pengcheng', color: '#a85d8a', isPlayer: false },
  { id: 'liu-biao',  name: { en: 'Liu Biao',    zh: '劉表軍' }, rulerOfficerId: 'liu-biao', capitalCityId: 'xiangyang', color: '#c19a3b', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',   zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang',capitalCityId: 'chengdu',   color: '#d9803a', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍' }, rulerOfficerId: 'ma-teng',  capitalCityId: 'wuwei',     color: '#a8703a', isPlayer: false },
  { id: 'wuhuan',    name: { en: 'Wuhuan',      zh: '烏丸'   }, rulerOfficerId: 'tadun',    capitalCityId: 'wuhuan',    color: '#7a5a3a', isPlayer: false },
];

const CITY_OWNERSHIP_200: Record<string, string> = {
  // Cao Cao (consolidated)
  xuchang:   'cao',
  luoyang:   'cao',
  wancheng:  'cao',
  runan:     'cao',
  xinye:     'cao',
  // Yuan Shao (absorbed Gongsun Zan + Kong Rong + Han north)
  ye:        'yuan-shao',
  beiping:   'yuan-shao',
  taiyuan:   'yuan-shao',
  bohai:     'yuan-shao',
  yanmen:    'yuan-shao',
  beihai:    'yuan-shao',
  // Sun Ce (Yuan Shu's south + Jiangdong)
  jianye:    'sun',
  shouchun:  'sun',
  wu:        'sun',
  changsha:  'sun',
  hefei:     'sun',
  yuzhang:   'sun',
  // Liu Bei
  pengcheng: 'liu-bei',
  xiapi:     'liu-bei',
  // Liu Biao
  xiangyang: 'liu-biao',
  jiangxia:  'liu-biao',
  lingling:  'liu-biao',
  // Liu Zhang
  chengdu:   'liu-zhang',
  yongan:    'liu-zhang',
  // Ma Teng
  wuwei:     'ma-teng',
  jincheng:  'ma-teng',
  anding:    'ma-teng',
  // Cao gained Chenliu / Pingyuan area
  chenliu:   'cao',
  pingyuan:  'yuan-shao', // Yuan Shao took it from Gongsun Zan
  shangdang: 'yuan-shao',
  // Liu Biao consolidated southern Jing
  wuling:    'liu-biao',
  // Liu Zhang's east Sichuan
  jiangzhou: 'liu-zhang',
  // Sun Ce expanded south
  guiyang:   'sun',
  // Wuhuan — Tadun's tribe on the northeast frontier
  wuhuan:    'wuhuan',
  // Neutral: liaodong, changan, hanzhong, jiaozhi, nanhai, hepu, wudu
};

const OFFICER_ASSIGNMENTS_200: Record<string, { forceId: string; cityId: string }> = {
  // Cao
  'cao-cao':     { forceId: 'cao',       cityId: 'xuchang' },
  'xiahou-dun':  { forceId: 'cao',       cityId: 'xuchang' },
  'xiahou-yuan': { forceId: 'cao',       cityId: 'luoyang' },
  'cao-ren':     { forceId: 'cao',       cityId: 'wancheng' },
  'cao-hong':    { forceId: 'cao',       cityId: 'xuchang' },
  'yu-jin':      { forceId: 'cao',       cityId: 'runan' },
  'le-jin':      { forceId: 'cao',       cityId: 'xuchang' },
  'xun-yu':      { forceId: 'cao',       cityId: 'xuchang' },
  'guo-jia':     { forceId: 'cao',       cityId: 'xuchang' },
  // Yuan Shao
  'yuan-shao':   { forceId: 'yuan-shao', cityId: 'ye' },
  'yan-liang':   { forceId: 'yuan-shao', cityId: 'ye' },
  'wen-chou':    { forceId: 'yuan-shao', cityId: 'ye' },
  'zhang-he':    { forceId: 'yuan-shao', cityId: 'bohai' },
  'tian-feng':   { forceId: 'yuan-shao', cityId: 'ye' },
  // Sun
  'sun-ce':      { forceId: 'sun',       cityId: 'jianye' },
  'sun-quan':    { forceId: 'sun',       cityId: 'jianye' },
  'cheng-pu':    { forceId: 'sun',       cityId: 'jianye' },
  'huang-gai':   { forceId: 'sun',       cityId: 'shouchun' },
  'zhou-tai':    { forceId: 'sun',       cityId: 'jianye' },
  'han-dang':    { forceId: 'sun',       cityId: 'changsha' },
  // Liu Bei
  'liu-bei':     { forceId: 'liu-bei',   cityId: 'pengcheng' },
  'guan-yu':     { forceId: 'liu-bei',   cityId: 'pengcheng' },
  'zhang-fei':   { forceId: 'liu-bei',   cityId: 'xiapi' },
  // Liu Biao
  'liu-biao':    { forceId: 'liu-biao',  cityId: 'xiangyang' },
  // Liu Zhang
  'liu-zhang':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  // Ma Teng
  'ma-teng':     { forceId: 'ma-teng',   cityId: 'wuwei' },
  // Wuhuan
  'tadun':       { forceId: 'wuhuan',    cityId: 'wuhuan' },
};

const DEAD_BY_200 = [
  'yuan-shu',
  'ji-ling',
  'sun-jian',
  'dong-zhuo',
  'lu-bu',
  'li-ru',
  'liu-yan',
  'gongsun-zan',
  'tao-qian',
  'kong-rong', // historically alive until 208 but force is absorbed by 200
];

export const SCENARIO_200_GUANDU: Scenario = {
  id: 'scn-200-guandu',
  name: { en: 'Battle of Guandu', zh: '官渡之戰' },
  description:
    'Autumn 200 AD. Yuan Shao musters 100,000 troops at Ye to crush the upstart Cao Cao. ' +
    'In the south, Sun Ce holds the Jiangdong; Liu Bei has fled to Xuzhou. ' +
    'Dong Zhuo and Lu Bu are long dead. Ma Teng watches from Liang.',
  descriptionZh: "公元200年秋。袁紹於鄴城聚兵十萬，欲一舉殲滅崛起之曹操。江南之地，孫策已定江東；劉備兵敗投奔徐州。董卓、呂布皆已身死多年，馬騰於涼州冷眼觀變。",
  startDate: { year: 200, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_200),
  forces: FORCES_200,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_200, DEAD_BY_200),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario 3 — Gathering of Heroes 英雄集結 (RTK XIV PK what-if)
// Every warlord alive, every iconic ruler in their canonical seat.
// Matches RTK XIV PK's 17-force layout.
// ──────────────────────────────────────────────────────────────────────

const FORCES_GATHERING: Force[] = [
  { id: 'cao',         name: { en: 'Cao Cao',     zh: '曹操軍'   }, rulerOfficerId: 'cao-cao',     capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei',     name: { en: 'Liu Bei',     zh: '劉備軍'   }, rulerOfficerId: 'liu-bei',     capitalCityId: 'pingyuan', color: '#a85d8a', isPlayer: false },
  { id: 'sun',         name: { en: 'Sun Ce',      zh: '孫策軍'   }, rulerOfficerId: 'sun-ce',      capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'yuan-shao',   name: { en: 'Yuan Shao',   zh: '袁紹軍'   }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'ye',       color: '#b8442e', isPlayer: false },
  { id: 'yuan-shu',    name: { en: 'Yuan Shu',    zh: '袁術軍'   }, rulerOfficerId: 'yuan-shu',    capitalCityId: 'shouchun', color: '#a85d8a', isPlayer: false },
  { id: 'dong',        name: { en: 'Dong Zhuo',   zh: '董卓軍'   }, rulerOfficerId: 'dong-zhuo',   capitalCityId: 'changan',  color: '#6b4a8a', isPlayer: false },
  { id: 'lubu',        name: { en: 'Lu Bu',       zh: '呂布軍'   }, rulerOfficerId: 'lu-bu',       capitalCityId: 'xiapi',    color: '#9b3a3a', isPlayer: false },
  { id: 'liu-biao',    name: { en: 'Liu Biao',    zh: '劉表軍'   }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#c19a3b', isPlayer: false },
  { id: 'liu-yan',     name: { en: 'Liu Yan',     zh: '劉焉軍'   }, rulerOfficerId: 'liu-yan',     capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
  { id: 'zhang-lu',    name: { en: 'Zhang Lu',    zh: '張魯軍'   }, rulerOfficerId: 'zhang-lu',    capitalCityId: 'hanzhong', color: '#6b8a6b', isPlayer: false },
  { id: 'gongsun',     name: { en: 'Gongsun Zan', zh: '公孫瓚軍' }, rulerOfficerId: 'gongsun-zan', capitalCityId: 'beiping',  color: '#5a9bb8', isPlayer: false },
  { id: 'gongsun-du',  name: { en: 'Gongsun Du',  zh: '公孫度軍' }, rulerOfficerId: 'gongsun-du',  capitalCityId: 'liaodong', color: '#3a7d9b', isPlayer: false },
  { id: 'ma-teng',     name: { en: 'Ma Teng',     zh: '馬騰軍'   }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#a8703a', isPlayer: false },
  { id: 'han-sui',     name: { en: 'Han Sui',     zh: '韓遂軍'   }, rulerOfficerId: 'han-sui',     capitalCityId: 'jincheng', color: '#8a503a', isPlayer: false },
  { id: 'kong-rong',   name: { en: 'Kong Rong',   zh: '孔融軍'   }, rulerOfficerId: 'kong-rong',   capitalCityId: 'beihai',   color: '#d97a3a', isPlayer: false },
  { id: 'tao',         name: { en: 'Tao Qian',    zh: '陶謙軍'   }, rulerOfficerId: 'tao-qian',    capitalCityId: 'pengcheng',color: '#8a8a3a', isPlayer: false },
  { id: 'shi-xie',     name: { en: 'Shi Xie',     zh: '士燮軍'   }, rulerOfficerId: 'shi-xie',     capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
];

const CITY_OWNERSHIP_GATHERING: Record<string, string> = {
  // ── Cao Cao (5): central plain ──
  xuchang:   'cao',
  luoyang:   'cao',
  wancheng:  'cao',
  chenliu:   'cao',
  runan:     'cao',
  // ── Liu Bei (2): refugee warlord ──
  pingyuan:  'liu-bei',
  xinye:     'liu-bei',
  // ── Sun Ce (5): Jiangdong ──
  jianye:    'sun',
  wu:        'sun',
  yuzhang:   'sun',
  changsha:  'sun',
  hefei:     'sun',
  // ── Yuan Shao (5): northern overlord ──
  ye:        'yuan-shao',
  bohai:     'yuan-shao',
  yanmen:    'yuan-shao',
  shangdang: 'yuan-shao',
  taiyuan:   'yuan-shao',
  // ── Yuan Shu (1): Shouchun ──
  shouchun:  'yuan-shu',
  // ── Dong Zhuo (1): Han west ──
  changan:   'dong',
  // ── Lü Bu (1): Xiapi ──
  xiapi:     'lubu',
  // ── Liu Biao (4): Jing ──
  xiangyang: 'liu-biao',
  jiangxia:  'liu-biao',
  wuling:    'liu-biao',
  lingling:  'liu-biao',
  // ── Liu Yan (3): Yi province (his son Liu Zhang serves him) ──
  chengdu:   'liu-yan',
  yongan:    'liu-yan',
  jiangzhou: 'liu-yan',
  // ── Zhang Lu (1): Hanzhong (Daoist theocracy) ──
  hanzhong:  'zhang-lu',
  // ── Gongsun Zan (1): Beiping ──
  beiping:   'gongsun',
  // ── Gongsun Du (1): Liaodong ──
  liaodong:  'gongsun-du',
  // ── Ma Teng (2): Liang ──
  wuwei:     'ma-teng',
  anding:    'ma-teng',
  // ── Han Sui (2): also Liang, west of Ma Teng ──
  jincheng:  'han-sui',
  wudu:      'han-sui',
  // ── Kong Rong (1): Beihai ──
  beihai:    'kong-rong',
  // ── Tao Qian (1): Xu province ──
  pengcheng: 'tao',
  // ── Shi Xie (3): Jiao province ──
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
  // ── Neutral (1): Guiyang (between Sun and Liu Biao) ──
};

const OFFICER_ASSIGNMENTS_GATHERING: Record<string, { forceId: string; cityId: string }> = {
  // ── Gongsun Du (Liaodong, newly added force) ──
  'gongsun-du':  { forceId: 'gongsun-du', cityId: 'liaodong' },
  'gongsun-kang':{ forceId: 'gongsun-du', cityId: 'liaodong' },

  // ── Zhang Lu (Hanzhong Daoist theocracy) ──
  'zhang-lu':    { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'yang-song':   { forceId: 'zhang-lu', cityId: 'hanzhong' },

  // ── Shi Xie (Jiaozhi) ──
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },

  // ── Tao Qian (Xu, revived) ──
  'tao-qian':    { forceId: 'tao', cityId: 'pengcheng' },
  'cao-bao':     { forceId: 'tao', cityId: 'pengcheng' },

  // ── Kong Rong (Beihai, revived) ──
  'kong-rong':   { forceId: 'kong-rong', cityId: 'beihai' },

  // ── Han Sui (split from Ma Teng into own force) ──
  'han-sui':     { forceId: 'han-sui', cityId: 'jincheng' },
  'cheng-yi':    { forceId: 'han-sui', cityId: 'jincheng' },
  'hou-xuan':    { forceId: 'han-sui', cityId: 'jincheng' },
  'liang-xing':  { forceId: 'han-sui', cityId: 'wudu' },
  'yang-qiu':    { forceId: 'han-sui', cityId: 'wudu' },

  // ── Cao Cao force ──
  'cao-cao':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-pi':      { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhi':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhang':   { forceId: 'cao', cityId: 'luoyang' },
  'cao-ang':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-anmin':   { forceId: 'cao', cityId: 'xuchang' },
  'cao-chun':    { forceId: 'cao', cityId: 'chenliu' },
  'cao-ren':     { forceId: 'cao', cityId: 'wancheng' },
  'cao-hong':    { forceId: 'cao', cityId: 'xuchang' },
  'cao-xiu':     { forceId: 'cao', cityId: 'chenliu' },
  'cao-zhen':    { forceId: 'cao', cityId: 'luoyang' },
  'cao-rui':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-shuang':  { forceId: 'cao', cityId: 'xuchang' },
  'cao-yu':      { forceId: 'cao', cityId: 'runan' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'xuchang' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'chenliu' },
  'xiahou-ba':   { forceId: 'cao', cityId: 'luoyang' },
  'xiahou-shang':{ forceId: 'cao', cityId: 'wancheng' },
  'xun-yu':      { forceId: 'cao', cityId: 'xuchang' },
  'xun-you':     { forceId: 'cao', cityId: 'xuchang' },
  'guo-jia':     { forceId: 'cao', cityId: 'xuchang' },
  'cheng-yu':    { forceId: 'cao', cityId: 'xuchang' },
  'liu-ye':      { forceId: 'cao', cityId: 'xuchang' },
  'jia-xu':      { forceId: 'cao', cityId: 'wancheng' },
  'xi-zhicai':   { forceId: 'cao', cityId: 'chenliu' },
  'sima-yi':     { forceId: 'cao', cityId: 'luoyang' },
  'sima-shi':    { forceId: 'cao', cityId: 'luoyang' },
  'sima-zhao':   { forceId: 'cao', cityId: 'luoyang' },
  'sima-lang':   { forceId: 'cao', cityId: 'xuchang' },
  'deng-ai':     { forceId: 'cao', cityId: 'luoyang' },
  'zhong-hui':   { forceId: 'cao', cityId: 'runan' },
  'xu-huang':    { forceId: 'cao', cityId: 'wancheng' },
  'yu-jin':      { forceId: 'cao', cityId: 'runan' },
  'le-jin':      { forceId: 'cao', cityId: 'xuchang' },
  'li-dian':     { forceId: 'cao', cityId: 'runan' },
  'zhang-liao':  { forceId: 'cao', cityId: 'luoyang' },
  'dian-wei':    { forceId: 'cao', cityId: 'xuchang' },
  'xu-chu':      { forceId: 'cao', cityId: 'xuchang' },
  'pang-de':     { forceId: 'cao', cityId: 'wancheng' },
  'man-chong':   { forceId: 'cao', cityId: 'runan' },
  'hao-zhao':    { forceId: 'cao', cityId: 'chenliu' },
  'zang-ba':     { forceId: 'cao', cityId: 'chenliu' },
  'wen-pin':     { forceId: 'cao', cityId: 'wancheng' },
  'guo-huai':    { forceId: 'cao', cityId: 'luoyang' },
  'chen-tai':    { forceId: 'cao', cityId: 'luoyang' },
  'chen-qun':    { forceId: 'cao', cityId: 'xuchang' },
  'hua-xin':     { forceId: 'cao', cityId: 'xuchang' },
  'wang-lang':   { forceId: 'cao', cityId: 'xuchang' },
  'mao-jie':     { forceId: 'cao', cityId: 'xuchang' },
  'han-hao':     { forceId: 'cao', cityId: 'wancheng' },
  'shi-huan':    { forceId: 'cao', cityId: 'chenliu' },
  'yang-hu':     { forceId: 'cao', cityId: 'luoyang' },
  'jia-kui':     { forceId: 'cao', cityId: 'runan' },
  'yang-fu':     { forceId: 'cao', cityId: 'chenliu' },
  'tian-yu':     { forceId: 'cao', cityId: 'runan' },
  'zhao-yan':    { forceId: 'cao', cityId: 'wancheng' },
  'du-xi':       { forceId: 'cao', cityId: 'runan' },
  'chen-jiao':   { forceId: 'cao', cityId: 'xuchang' },
  'wang-bi':     { forceId: 'cao', cityId: 'xuchang' },

  // ── Liu Bei force (small, at Pingyuan + Xinye) ──
  'liu-bei':     { forceId: 'liu-bei', cityId: 'pingyuan' },
  'guan-yu':     { forceId: 'liu-bei', cityId: 'pingyuan' },
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'pingyuan' },
  'liu-shan':    { forceId: 'liu-bei', cityId: 'pingyuan' },
  'liu-feng':    { forceId: 'liu-bei', cityId: 'xinye' },
  'liu-yong':    { forceId: 'liu-bei', cityId: 'pingyuan' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'xinye' },
  'pang-tong':   { forceId: 'liu-bei', cityId: 'xinye' },
  'fa-zheng':    { forceId: 'liu-bei', cityId: 'xinye' },
  'ma-liang':    { forceId: 'liu-bei', cityId: 'xinye' },
  'ma-su':       { forceId: 'liu-bei', cityId: 'xinye' },
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'pingyuan' },
  'huang-zhong': { forceId: 'liu-bei', cityId: 'xinye' },
  'wei-yan':     { forceId: 'liu-bei', cityId: 'xinye' },
  'liao-hua':    { forceId: 'liu-bei', cityId: 'pingyuan' },
  'guan-ping':   { forceId: 'liu-bei', cityId: 'pingyuan' },
  'guan-xing':   { forceId: 'liu-bei', cityId: 'pingyuan' },
  'zhang-bao':   { forceId: 'liu-bei', cityId: 'pingyuan' },
  'zhou-cang':   { forceId: 'liu-bei', cityId: 'pingyuan' },
  'jian-yong':   { forceId: 'liu-bei', cityId: 'pingyuan' },
  'sun-qian':    { forceId: 'liu-bei', cityId: 'pingyuan' },
  'mi-zhu':      { forceId: 'liu-bei', cityId: 'pingyuan' },
  'mi-fang':     { forceId: 'liu-bei', cityId: 'pingyuan' },
  'fu-shi-ren':  { forceId: 'liu-bei', cityId: 'xinye' },
  'liu-ba':      { forceId: 'liu-bei', cityId: 'xinye' },
  'jiang-wei':   { forceId: 'liu-bei', cityId: 'pingyuan' },
  'deng-zhi':    { forceId: 'liu-bei', cityId: 'xinye' },
  'fei-yi':      { forceId: 'liu-bei', cityId: 'xinye' },
  'jiang-wan':   { forceId: 'liu-bei', cityId: 'xinye' },
  'dong-yun':    { forceId: 'liu-bei', cityId: 'xinye' },
  'wang-ping':   { forceId: 'liu-bei', cityId: 'pingyuan' },
  'ma-zhong':    { forceId: 'liu-bei', cityId: 'pingyuan' },
  'zhang-yi':    { forceId: 'liu-bei', cityId: 'pingyuan' },
  'yang-yi':     { forceId: 'liu-bei', cityId: 'xinye' },
  'li-yan':      { forceId: 'liu-bei', cityId: 'xinye' },
  'huo-yi':      { forceId: 'liu-bei', cityId: 'pingyuan' },
  'lady-sun':    { forceId: 'liu-bei', cityId: 'pingyuan' },
  'lady-gan':    { forceId: 'liu-bei', cityId: 'pingyuan' },
  'lady-mi':     { forceId: 'liu-bei', cityId: 'pingyuan' },

  // ── Sun Quan force ──
  'sun-jian':    { forceId: 'sun', cityId: 'jianye' },
  'sun-ce':      { forceId: 'sun', cityId: 'jianye' },
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'sun-yi':      { forceId: 'sun', cityId: 'wu' },
  'sun-kuang':   { forceId: 'sun', cityId: 'jianye' },
  'zhou-yu':     { forceId: 'sun', cityId: 'jianye' },
  'lu-su':       { forceId: 'sun', cityId: 'jianye' },
  'lu-meng':     { forceId: 'sun', cityId: 'hefei' },
  'lu-xun':      { forceId: 'sun', cityId: 'wu' },
  'lu-kang':     { forceId: 'sun', cityId: 'wu' },
  'cheng-pu':    { forceId: 'sun', cityId: 'jianye' },
  'huang-gai':   { forceId: 'sun', cityId: 'changsha' },
  'han-dang':    { forceId: 'sun', cityId: 'yuzhang' },
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'taishi-ci':   { forceId: 'sun', cityId: 'jianye' },
  'gan-ning':    { forceId: 'sun', cityId: 'changsha' },
  'ling-tong'   : { forceId: 'sun', cityId: 'changsha' }, // Ling Tong (legacy id)
  'jiang-qin':   { forceId: 'sun', cityId: 'wu' },
  'zhu-ran':     { forceId: 'sun', cityId: 'jianye' },
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },
  'pan-zhang':   { forceId: 'sun', cityId: 'hefei' },
  'xu-sheng-wu':     { forceId: 'sun', cityId: 'jianye' }, // Xu Sheng (legacy id)
  'zhu-zhi':     { forceId: 'sun', cityId: 'wu' },
  'zhu-huan':    { forceId: 'sun', cityId: 'yuzhang' },
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },
  'zhang-hong':  { forceId: 'sun', cityId: 'jianye' },
  'gu-yong':     { forceId: 'sun', cityId: 'wu' },
  'bu-zhi':      { forceId: 'sun', cityId: 'yuzhang' },
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'zhuge-ke':    { forceId: 'sun', cityId: 'jianye' },
  'da-qiao':     { forceId: 'sun', cityId: 'jianye' },
  'xiao-qiao':   { forceId: 'sun', cityId: 'jianye' },
  'pan-jun':     { forceId: 'sun', cityId: 'changsha' },
  'he-qi':       { forceId: 'sun', cityId: 'wu' },
  'lu-dai':      { forceId: 'sun', cityId: 'yuzhang' },
  'zhuge-dan':   { forceId: 'sun', cityId: 'hefei' },
  'pan-lin':     { forceId: 'sun', cityId: 'changsha' },
  'quan-cong':   { forceId: 'sun', cityId: 'jianye' },
  'quan-yi':     { forceId: 'sun', cityId: 'jianye' },
  'yu-fan':      { forceId: 'sun', cityId: 'jianye' },
  'hu-zong':     { forceId: 'sun', cityId: 'wu' },
  'chen-wu':     { forceId: 'sun', cityId: 'jianye' },
  'dong-xi':     { forceId: 'sun', cityId: 'hefei' },
  'lu-fan':      { forceId: 'sun', cityId: 'jianye' },
  'su-fei':      { forceId: 'sun', cityId: 'changsha' },
  'zhang-wen':   { forceId: 'sun', cityId: 'jianye' },

  // ── Yuan Shao force ──
  'yuan-shao':   { forceId: 'yuan-shao', cityId: 'ye' },
  'yuan-tan':    { forceId: 'yuan-shao', cityId: 'bohai' },
  'yuan-shang':  { forceId: 'yuan-shao', cityId: 'ye' },
  'yuan-xi':     { forceId: 'yuan-shao', cityId: 'shangdang' },
  'yan-liang':   { forceId: 'yuan-shao', cityId: 'ye' },
  'wen-chou':    { forceId: 'yuan-shao', cityId: 'ye' },
  'zhang-he':    { forceId: 'yuan-shao', cityId: 'bohai' },
  'gao-lan':     { forceId: 'yuan-shao', cityId: 'taiyuan' },
  'tian-feng':   { forceId: 'yuan-shao', cityId: 'ye' },
  'ju-shou':     { forceId: 'yuan-shao', cityId: 'ye' },
  'shen-pei':    { forceId: 'yuan-shao', cityId: 'bohai' },
  'guo-tu':      { forceId: 'yuan-shao', cityId: 'ye' },
  'feng-ji':     { forceId: 'yuan-shao', cityId: 'ye' },

  // ── Yuan Shu ──
  'yuan-shu':    { forceId: 'yuan-shu', cityId: 'shouchun' },
  'ji-ling':     { forceId: 'yuan-shu', cityId: 'shouchun' },

  // ── Dong Zhuo force ──
  'dong-zhuo':   { forceId: 'dong', cityId: 'changan' },
  'li-ru':       { forceId: 'dong', cityId: 'changan' },
  'hua-xiong':   { forceId: 'dong', cityId: 'changan' },
  'xu-rong':     { forceId: 'dong', cityId: 'changan' },
  'niu-fu':      { forceId: 'dong', cityId: 'changan' },
  'wang-yun':    { forceId: 'dong', cityId: 'changan' },
  'diaochan':    { forceId: 'dong', cityId: 'changan' },

  // ── Lu Bu force ──
  'lu-bu':       { forceId: 'lubu', cityId: 'xiapi' },
  'chen-gong':   { forceId: 'lubu', cityId: 'xiapi' },
  'gao-shun':    { forceId: 'lubu', cityId: 'xiapi' },
  'cao-xing':    { forceId: 'lubu', cityId: 'xiapi' },
  'song-xian':   { forceId: 'lubu', cityId: 'xiapi' },
  'hou-cheng':   { forceId: 'lubu', cityId: 'xiapi' },

  // ── Liu Biao force ──
  'liu-biao':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'liu-qi':      { forceId: 'liu-biao', cityId: 'jiangxia' },
  'cai-mao':     { forceId: 'liu-biao', cityId: 'xiangyang' },
  'zhang-yun':   { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-liang':  { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-yue':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'huang-zu':    { forceId: 'liu-biao', cityId: 'jiangxia' },
  'yi-ji'      :  { forceId: 'liu-biao', cityId: 'wuling' }, // Yi Ji (legacy id)
  'han-xuan':    { forceId: 'liu-biao', cityId: 'wuling' },
  'liu-du':      { forceId: 'liu-biao', cityId: 'lingling' },
  'zhao-fan':    { forceId: 'liu-biao', cityId: 'wuling' },
  'jin-xuan':    { forceId: 'liu-biao', cityId: 'wuling' },

  // ── Liu Yan force (Yi province; Liu Zhang serves as his son) ──
  'liu-yan':     { forceId: 'liu-yan', cityId: 'chengdu' },
  'liu-zhang':   { forceId: 'liu-yan', cityId: 'chengdu' },
  'zhang-ren':   { forceId: 'liu-yan', cityId: 'chengdu' },
  'yan-yan':     { forceId: 'liu-yan', cityId: 'jiangzhou' },
  'meng-da':     { forceId: 'liu-yan', cityId: 'yongan' },
  'wu-yi':       { forceId: 'liu-yan', cityId: 'chengdu' },
  'wu-lan':      { forceId: 'liu-yan', cityId: 'yongan' },
  'leigh-tong':  { forceId: 'liu-yan', cityId: 'jiangzhou' }, // Lei Tong
  'wu-ban':      { forceId: 'liu-yan', cityId: 'chengdu' },

  // ── Gongsun Zan force ──
  'gongsun-zan': { forceId: 'gongsun', cityId: 'beiping' },
  'tian-kai':    { forceId: 'gongsun', cityId: 'beiping' },

  // ── Ma Teng force (Wuwei + Anding only — Han Sui split off) ──
  'ma-teng':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-chao':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-dai':      { forceId: 'ma-teng', cityId: 'wuwei' },
  'pang-de-ye':  { forceId: 'ma-teng', cityId: 'anding' }, // Yan Xing
  'wang-yi':     { forceId: 'ma-teng', cityId: 'wuwei' },
};

export const SCENARIO_GATHERING_OF_HEROES: Scenario = {
  id: 'scn-gathering-of-heroes',
  name: { en: 'Gathering of Heroes', zh: '英雄集結' },
  kind: 'whatif',
  description:
    'The RTK XIV PK fantasy convergence. Seventeen warlords stand simultaneously across the realm — ' +
    'Cao Cao at Xuchang, Sun Ce on the Yangtze, Dong Zhuo holding Chang\'an, Lu Bu at Xiapi, Zhang Lu in Hanzhong, ' +
    'Liu Yan ruling Yi, Han Sui in Liang, Gongsun Du in Liaodong, Shi Xie at Jiao. ' +
    'Time is unmoored; every officer who ever drew breath now serves a banner. The realm awaits a single conqueror.',
  descriptionZh: "群雄並起之夢幻時局。十七路諸侯同立於天下——曹操據許昌，孫策橫江東，董卓守長安，呂布踞下邳，張魯擁漢中，劉焉領益州，韓遂雄涼地，公孫度割遼東，士燮鎮交趾。歲月錯亂，凡曾在世之將相皆執旗列陣。天下蒼茫，唯待一人問鼎。",
  startDate: { year: 200, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_GATHERING),
  forces: FORCES_GATHERING,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_GATHERING),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario 4 — 208 Battle of Red Cliffs / Chibi 赤壁之戰
// Cao Cao has crushed the north and marches south. Liu Biao dies; his
// son surrenders. Liu Bei flees with Zhuge Liang. Sun Quan and Liu Bei
// must ally or perish.
// ──────────────────────────────────────────────────────────────────────

const FORCES_208: Force[] = [
  { id: 'cao',       name: { en: 'Cao Cao',     zh: '曹操軍' }, rulerOfficerId: 'cao-cao',   capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei',   name: { en: 'Liu Bei',     zh: '劉備軍' }, rulerOfficerId: 'liu-bei',   capitalCityId: 'jiangxia', color: '#a85d8a', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Quan',    zh: '孫權軍' }, rulerOfficerId: 'sun-quan',  capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-biao',  name: { en: 'Liu Cong',    zh: '劉琮軍' }, rulerOfficerId: 'liu-biao',  capitalCityId: 'xiangyang',color: '#c19a3b', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',   zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang', capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',    zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6b8a6b', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍' }, rulerOfficerId: 'ma-teng',   capitalCityId: 'wuwei',    color: '#a8703a', isPlayer: false },
  { id: 'shi-xie',   name: { en: 'Shi Xie',     zh: '士燮軍' }, rulerOfficerId: 'shi-xie',   capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
];

const CITY_OWNERSHIP_208: Record<string, string> = {
  // ── Cao Cao — colossal northern empire ──
  xuchang:   'cao',
  luoyang:   'cao',
  wancheng:  'cao',
  chenliu:   'cao',
  runan:     'cao',
  pingyuan:  'cao',
  ye:        'cao',
  bohai:     'cao',
  beihai:    'cao',
  beiping:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  shouchun:  'cao',
  changan:   'cao',
  liaodong:  'cao',
  xinye:     'cao',
  guandu:    'cao',
  hulao:     'cao',
  tongguan:  'cao',
  linzi:     'cao',
  lujiang:   'cao',
  // ── Liu Bei — refugee on the Yangtze ──
  jiangxia:  'liu-bei',
  // ── Sun Quan — Jiangdong ──
  jianye:    'sun',
  wu:        'sun',
  hefei:     'sun',
  yuzhang:   'sun',
  changsha:  'sun',
  wuxi:      'sun',
  // ── Liu Cong (succeeded Liu Biao) — about to fold ──
  xiangyang: 'liu-biao',
  jiangling: 'liu-biao',
  wuling:    'liu-biao',
  lingling:  'liu-biao',
  // ── Liu Zhang — Yi province ──
  chengdu:   'liu-zhang',
  yongan:    'liu-zhang',
  jiangzhou: 'liu-zhang',
  // ── Zhang Lu — Hanzhong ──
  hanzhong:  'zhang-lu',
  // ── Ma Teng — Liang ──
  wuwei:     'ma-teng',
  jincheng:  'ma-teng',
  anding:    'ma-teng',
  wudu:      'ma-teng',
  mei:       'ma-teng',
  // ── Shi Xie — Jiao ──
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
  // Neutral: guiyang
};

const OFFICER_ASSIGNMENTS_208: Record<string, { forceId: string; cityId: string }> = {
  // Cao Cao at peak power
  'cao-cao':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-pi':      { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhi':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhang':   { forceId: 'cao', cityId: 'ye' },
  'cao-ren':     { forceId: 'cao', cityId: 'wancheng' },
  'cao-hong':    { forceId: 'cao', cityId: 'luoyang' },
  'cao-chun':    { forceId: 'cao', cityId: 'chenliu' },
  'cao-xiu':     { forceId: 'cao', cityId: 'pengcheng' },
  'cao-zhen':    { forceId: 'cao', cityId: 'changan' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'xuchang' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'changan' },
  'xun-yu':      { forceId: 'cao', cityId: 'xuchang' },
  'xun-you':     { forceId: 'cao', cityId: 'xuchang' },
  'guo-jia':     { forceId: 'cao', cityId: 'luoyang' }, // dies 207 historically but we keep alive
  'cheng-yu':    { forceId: 'cao', cityId: 'xuchang' },
  'jia-xu':      { forceId: 'cao', cityId: 'wancheng' },
  'sima-yi':     { forceId: 'cao', cityId: 'luoyang' },
  'xu-huang':    { forceId: 'cao', cityId: 'wancheng' },
  'zhang-liao':  { forceId: 'cao', cityId: 'shouchun' },
  'yu-jin':      { forceId: 'cao', cityId: 'wancheng' },
  'le-jin':      { forceId: 'cao', cityId: 'shouchun' },
  'li-dian':     { forceId: 'cao', cityId: 'shouchun' },
  'zhang-he':    { forceId: 'cao', cityId: 'ye' },
  'xu-chu':      { forceId: 'cao', cityId: 'xuchang' },
  'pang-de':     { forceId: 'cao', cityId: 'changan' },
  'man-chong':   { forceId: 'cao', cityId: 'shouchun' },
  'zang-ba':     { forceId: 'cao', cityId: 'pengcheng' },
  'liu-ye':      { forceId: 'cao', cityId: 'xuchang' },
  'chen-qun':    { forceId: 'cao', cityId: 'xuchang' },

  // Liu Bei
  'liu-bei':     { forceId: 'liu-bei', cityId: 'jiangxia' },
  'guan-yu':     { forceId: 'liu-bei', cityId: 'jiangxia' },
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'jiangxia' },
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'jiangxia' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'jiangxia' },
  'mi-zhu':      { forceId: 'liu-bei', cityId: 'jiangxia' },
  'mi-fang':     { forceId: 'liu-bei', cityId: 'jiangxia' },
  'sun-qian':    { forceId: 'liu-bei', cityId: 'jiangxia' },
  'jian-yong':   { forceId: 'liu-bei', cityId: 'jiangxia' },
  'liu-feng':    { forceId: 'liu-bei', cityId: 'jiangxia' },
  'liu-shan':    { forceId: 'liu-bei', cityId: 'jiangxia' },
  'liu-qi':      { forceId: 'liu-bei', cityId: 'jiangxia' }, // Liu Biao's son joins Liu Bei

  // Sun Quan
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'zhou-yu':     { forceId: 'sun', cityId: 'jianye' },
  'lu-su':       { forceId: 'sun', cityId: 'jianye' },
  'cheng-pu':    { forceId: 'sun', cityId: 'jianye' },
  'huang-gai':   { forceId: 'sun', cityId: 'changsha' },
  'han-dang':    { forceId: 'sun', cityId: 'yuzhang' },
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'taishi-ci':   { forceId: 'sun', cityId: 'wu' },
  'gan-ning':    { forceId: 'sun', cityId: 'jianye' },
  'ling-tong'   : { forceId: 'sun', cityId: 'wu' }, // Ling Tong (legacy id)
  'jiang-qin':   { forceId: 'sun', cityId: 'wu' },
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },
  'zhang-hong':  { forceId: 'sun', cityId: 'jianye' },
  'lu-meng':     { forceId: 'sun', cityId: 'hefei' },
  'lu-xun':      { forceId: 'sun', cityId: 'wu' },
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'sun-yi':      { forceId: 'sun', cityId: 'wuxi' },

  // Liu Biao (Liu Cong succeeded)
  'liu-biao':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'cai-mao':     { forceId: 'liu-biao', cityId: 'xiangyang' },
  'zhang-yun':   { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-liang':  { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-yue':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'wen-pin':     { forceId: 'liu-biao', cityId: 'jiangling' },
  'han-xuan':    { forceId: 'liu-biao', cityId: 'wuling' },
  'liu-du':      { forceId: 'liu-biao', cityId: 'lingling' },

  // Liu Zhang
  'liu-zhang':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'zhang-ren':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'yan-yan':     { forceId: 'liu-zhang', cityId: 'jiangzhou' },
  'meng-da':     { forceId: 'liu-zhang', cityId: 'yongan' },
  'wu-yi':       { forceId: 'liu-zhang', cityId: 'chengdu' },
  'fa-zheng':    { forceId: 'liu-zhang', cityId: 'chengdu' }, // serves Liu Zhang before defecting

  // Zhang Lu
  'zhang-lu':    { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'yang-song':   { forceId: 'zhang-lu', cityId: 'hanzhong' },

  // Ma Teng
  'ma-teng':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-chao':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-dai':      { forceId: 'ma-teng', cityId: 'jincheng' },
  'han-sui':     { forceId: 'ma-teng', cityId: 'jincheng' },
  'wang-yi':     { forceId: 'ma-teng', cityId: 'wuwei' },

  // Shi Xie
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },
};

const DEAD_BY_208 = [
  'sun-jian',    // d. 191
  'sun-ce',      // d. 200
  'dong-zhuo',   // d. 192
  'lu-bu',       // d. 198
  'li-ru',       // d. 192
  'yuan-shao',   // d. 202
  'yuan-shu',    // d. 199
  'ji-ling',     // d. ~196
  'yan-liang',   // d. 200
  'wen-chou',    // d. 200
  'tian-feng',   // d. 200
  'yuan-tan',    // d. 205
  'yuan-shang',  // d. 207
  'yuan-xi',     // d. 207
  'gongsun-zan', // d. 199
  'gongsun-du',  // d. 204
  'kong-rong',   // d. 208 (executed by Cao Cao)
  'tao-qian',    // d. 194
  'liu-yan',     // d. 194
  'cao-bao',     // d. ~196
  'cao-ang',     // d. 197 (Wancheng)
  'cao-anmin',   // d. 197
  'dian-wei',    // d. 197
  'hua-xiong',   // d. 191
  'xu-rong',     // d. 192
  'niu-fu',      // d. 192
  'gao-shun',    // d. 198
  'cao-xing',    // d. 198
  'song-xian',   // d. 200
  'hou-cheng',   // d. 200
  'wang-yun',    // d. 192
  'chen-gong',   // d. 198
  'han-fu',      // d. 191
  'bo-cai',      // d. 184
  'zhang-mancheng', // d. 184
  'zhang-jiao',  // d. 184
  'zhang-bao-yt',// d. 184
  'zhang-liang-yt', // d. 184
  'yang-feng',   // d. 197
  'han-xian',    // d. 197
  'sun-xia',     // d. 184
  'liu-he',      // d. 195
  'bao-xin',     // d. 192
];

export const SCENARIO_208_CHIBI: Scenario = {
  id: 'scn-208-chibi',
  name: { en: 'Battle of Red Cliffs', zh: '赤壁之戰' },
  description:
    'Autumn 208 AD. Cao Cao has crushed every northern rival and now marches south with 800,000 men. ' +
    'Liu Biao is dead; his son Liu Cong surrendered Jing without a fight. Liu Bei has fled to Jiangxia ' +
    'with Zhuge Liang. Sun Quan must decide: surrender, or join Liu Bei at the Red Cliffs.',
  descriptionZh: "公元208年秋。曹操盡掃北方群雄，率八十萬大軍南下。劉表病故，其子劉琮不戰而獻荊州。劉備偕諸葛亮敗走江夏。孫權面臨抉擇——降曹，或聯劉抗敵於赤壁。",
  startDate: { year: 208, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_208),
  forces: FORCES_208,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_208, DEAD_BY_208),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario 5 — 234 Wuzhang Plains 五丈原 (Zhuge Liang's last campaign)
// Three Kingdoms era proper: Wei (Cao Rui), Shu Han (Liu Shan), Wu
// (Sun Quan). Zhuge Liang marches north for the final time; Sima Yi
// defends the Wei frontier.
// ──────────────────────────────────────────────────────────────────────

const FORCES_234: Force[] = [
  { id: 'cao',     name: { en: 'Wei',     zh: '魏'   }, rulerOfficerId: 'cao-rui',   capitalCityId: 'luoyang', color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han', zh: '蜀漢' }, rulerOfficerId: 'liu-shan',  capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',      zh: '吳'   }, rulerOfficerId: 'sun-quan',  capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
];

const CITY_OWNERSHIP_234: Record<string, string> = {
  // Wei — most of the realm
  xuchang:   'cao',
  luoyang:   'cao',
  wancheng:  'cao',
  chenliu:   'cao',
  runan:     'cao',
  pingyuan:  'cao',
  ye:        'cao',
  bohai:     'cao',
  beihai:    'cao',
  beiping:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  shouchun:  'cao',
  changan:   'cao',
  liaodong:  'cao',
  xinye:     'cao',
  guandu:    'cao',
  hulao:     'cao',
  tongguan:  'cao',
  linzi:     'cao',
  lujiang:   'cao',
  jincheng:  'cao',
  wuwei:     'cao',
  anding:    'cao',
  mei:       'cao',
  wudu:      'cao',
  // Shu Han — Yi province + Hanzhong
  chengdu:   'liu-bei',
  yongan:    'liu-bei',
  jiangzhou: 'liu-bei',
  hanzhong:  'liu-bei',
  // Wu — Jiangdong + Jing south
  jianye:    'sun',
  wu:        'sun',
  wuxi:      'sun',
  hefei:     'sun', // Wu held Hefei briefly — for game purposes
  yuzhang:   'sun',
  changsha:  'sun',
  jiangling: 'sun',
  jiangxia:  'sun',
  wuling:    'sun',
  lingling:  'sun',
  xiangyang: 'cao',
  // Far south Shi Xie's lands — neutral by 234 (Shi Xie d. 226)
  // jiaozhi, nanhai, hepu, guiyang stay neutral
};

const OFFICER_ASSIGNMENTS_234: Record<string, { forceId: string; cityId: string }> = {
  // ── Wei ──
  'cao-rui':     { forceId: 'cao', cityId: 'luoyang' },
  'sima-yi':     { forceId: 'cao', cityId: 'changan' }, // commanding the west
  'sima-shi':    { forceId: 'cao', cityId: 'luoyang' },
  'sima-zhao':   { forceId: 'cao', cityId: 'luoyang' },
  'cao-zhen':    { forceId: 'cao', cityId: 'luoyang' },
  'cao-xiu':     { forceId: 'cao', cityId: 'shouchun' },
  'cao-shuang':  { forceId: 'cao', cityId: 'luoyang' },
  'cao-yu':      { forceId: 'cao', cityId: 'xuchang' },
  'xiahou-shang':{ forceId: 'cao', cityId: 'xiangyang' },
  'xiahou-ba':   { forceId: 'cao', cityId: 'changan' },
  'xiahou-mao':  { forceId: 'cao', cityId: 'xuchang' },
  'xu-huang':    { forceId: 'cao', cityId: 'wancheng' },
  'zhang-liao':  { forceId: 'cao', cityId: 'shouchun' },
  'man-chong':   { forceId: 'cao', cityId: 'shouchun' },
  'hao-zhao':    { forceId: 'cao', cityId: 'tongguan' },
  'guo-huai':    { forceId: 'cao', cityId: 'changan' },
  'sun-li':      { forceId: 'cao', cityId: 'tongguan' },
  'wang-ling':   { forceId: 'cao', cityId: 'shouchun' },
  'guanqiu-jian':{ forceId: 'cao', cityId: 'liaodong' },
  'jia-kui':     { forceId: 'cao', cityId: 'xiangyang' },
  'tian-yu':     { forceId: 'cao', cityId: 'beiping' },
  'liu-ye':      { forceId: 'cao', cityId: 'luoyang' },
  'chen-qun':    { forceId: 'cao', cityId: 'luoyang' },
  'liu-fang':    { forceId: 'cao', cityId: 'luoyang' },
  'sun-zi':      { forceId: 'cao', cityId: 'luoyang' },
  'cai-wenji':   { forceId: 'cao', cityId: 'xuchang' },
  'chen-jiao':   { forceId: 'cao', cityId: 'xuchang' },
  'du-xi':       { forceId: 'cao', cityId: 'wancheng' },
  'zhao-yan':    { forceId: 'cao', cityId: 'xuchang' },
  'wang-su':     { forceId: 'cao', cityId: 'luoyang' },
  'hu-zhi':      { forceId: 'cao', cityId: 'pingyuan' },
  'cao-lin':     { forceId: 'cao', cityId: 'luoyang' },
  'yang-fu':     { forceId: 'cao', cityId: 'changan' },
  'wang-mai':    { forceId: 'cao', cityId: 'wuwei' },

  // ── Shu Han ──
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'hanzhong' }, // at the front
  'jiang-wei':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wei-yan':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wang-ping':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'ma-dai':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'liao-hua':    { forceId: 'liu-bei', cityId: 'yongan' },
  'zhang-yi':    { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'ma-zhong':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'guan-xing':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhang-bao':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'fei-yi':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'jiang-wan':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'dong-yun':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'yang-yi':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'deng-zhi':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhou-cang':   { forceId: 'liu-bei', cityId: 'yongan' },
  'liu-yong':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'du-qiong':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'qiao-zhou':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'yang-hong':   { forceId: 'liu-bei', cityId: 'jiangzhou' },

  // ── Wu ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'lu-xun':      { forceId: 'sun', cityId: 'jianye' },
  'lu-kang':     { forceId: 'sun', cityId: 'jiangling' },
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'zhuge-ke':    { forceId: 'sun', cityId: 'jianye' },
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },
  'zhu-ran':     { forceId: 'sun', cityId: 'jiangxia' },
  'zhu-huan':    { forceId: 'sun', cityId: 'yuzhang' },
  'pan-zhang':   { forceId: 'sun', cityId: 'hefei' },
  'xu-sheng-wu':     { forceId: 'sun', cityId: 'wu' }, // Xu Sheng (legacy id)
  'gu-yong':     { forceId: 'sun', cityId: 'jianye' },
  'bu-zhi':      { forceId: 'sun', cityId: 'jianye' },
  'he-qi':       { forceId: 'sun', cityId: 'changsha' },
  'lu-dai':      { forceId: 'sun', cityId: 'jiaozhi' }, // pacifying the south
  'quan-cong':   { forceId: 'sun', cityId: 'jianye' },
  'pan-jun':     { forceId: 'sun', cityId: 'changsha' },
  'zhang-wen':   { forceId: 'sun', cityId: 'jianye' },
};

export const SCENARIO_234_WUZHANG: Scenario = {
  id: 'scn-234-wuzhang',
  name: { en: 'Wuzhang Plains', zh: '五丈原' },
  description:
    'Summer 234 AD. Zhuge Liang launches his fifth and final northern expedition, ' +
    'encamped on the Wuzhang Plains opposite Sima Yi. Cao Rui rules Wei from Luoyang; ' +
    'Liu Shan from Chengdu; Sun Quan from Jianye. The realm has settled into three kingdoms — ' +
    'but Zhuge Liang seeks one last chance to restore the Han.',
  descriptionZh: "公元234年夏。諸葛亮第五次北伐，屯兵於五丈原，與司馬懿隔渭水對峙。曹叡於洛陽稱帝統魏，劉禪於成都繼漢，孫權於建業治吳。天下三分之勢已定，然諸葛丞相猶欲鞠躬盡瘁，以圖匡復漢室。",
  startDate: { year: 234, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_234),
  forces: FORCES_234,
  // Auto-compute dead officers by year (anyone whose deathYear < 234).
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_234, [], 234),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario 6 — 220 AD Three Kingdoms Declaration 三國鼎立
// Cao Cao has just died; Cao Pi succeeds him and declares the Wei
// dynasty. Liu Bei holds Yi + Hanzhong. Sun Quan has just taken
// Jingzhou from Liu Bei (Guan Yu killed in 220).
// ──────────────────────────────────────────────────────────────────────

const FORCES_220: Force[] = [
  { id: 'cao',     name: { en: 'Wei',     zh: '魏'    }, rulerOfficerId: 'cao-pi',   capitalCityId: 'luoyang',  color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han', zh: '蜀漢'  }, rulerOfficerId: 'liu-bei',  capitalCityId: 'chengdu',  color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',      zh: '吳'    }, rulerOfficerId: 'sun-quan', capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'shi-xie', name: { en: 'Shi Xie', zh: '士燮'  }, rulerOfficerId: 'shi-xie',  capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
  { id: 'xianbei', name: { en: 'Xianbei', zh: '鮮卑'  }, rulerOfficerId: 'kebi-neng',capitalCityId: 'wuhuan',   color: '#7a5a3a', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',  zh: '南蛮'  }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning', color: '#6e8a2a', isPlayer: false },
];

const CITY_OWNERSHIP_220: Record<string, string> = {
  // Wei — sprawling northern + central + Liang empire
  xuchang:   'cao',
  luoyang:   'cao',
  wancheng:  'cao',
  chenliu:   'cao',
  runan:     'cao',
  pingyuan:  'cao',
  ye:        'cao',
  bohai:     'cao',
  beihai:    'cao',
  beiping:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  shouchun:  'cao',
  changan:   'cao',
  liaodong:  'cao',
  xinye:     'cao',
  guandu:    'cao',
  hulao:     'cao',
  tongguan:  'cao',
  linzi:     'cao',
  lujiang:   'cao',
  jincheng:  'cao',
  wuwei:     'cao',
  anding:    'cao',
  mei:       'cao',
  xiangyang: 'cao',
  hefei:     'cao',
  // Shu Han — Yi province + Hanzhong
  chengdu:   'liu-bei',
  yongan:    'liu-bei',
  jiangzhou: 'liu-bei',
  hanzhong:  'liu-bei',
  wudu:      'liu-bei',
  // Wu — Jiangdong + freshly taken Jingzhou
  jianye:    'sun',
  wu:        'sun',
  wuxi:      'sun',
  yuzhang:   'sun',
  changsha:  'sun',
  jiangling: 'sun', // taken from Liu Bei by Lu Meng 219
  jiangxia:  'sun',
  wuling:    'sun',
  lingling:  'sun',
  // Shi Xie — Jiao
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
  // Xianbei — Kebi Neng's confederacy
  wuhuan:    'xianbei',
  // Nanman — Meng Huo's tribes
  jianning:  'nanman',
  yunnan:    'nanman',
  yongchang: 'nanman',
  yuexi:     'nanman',
  // Neutral: guiyang
};

const OFFICER_ASSIGNMENTS_220: Record<string, { forceId: string; cityId: string }> = {
  // ── Wei (Cao Pi succeeds Cao Cao) ──
  'cao-pi':      { forceId: 'cao', cityId: 'luoyang' },
  'cao-zhi':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhang':   { forceId: 'cao', cityId: 'ye' },
  'cao-ren':     { forceId: 'cao', cityId: 'wancheng' }, // alive until 223
  'cao-xiu':     { forceId: 'cao', cityId: 'shouchun' },
  'cao-zhen':    { forceId: 'cao', cityId: 'changan' },
  'cao-chun':    { forceId: 'cao', cityId: 'chenliu' }, // d. 210 actually, but kept
  'xiahou-dun':  { forceId: 'cao', cityId: 'luoyang' }, // d. 220 — included
  'xiahou-shang':{ forceId: 'cao', cityId: 'xiangyang' },
  'xiahou-ba':   { forceId: 'cao', cityId: 'changan' },
  'xiahou-mao':  { forceId: 'cao', cityId: 'mei' },
  'xu-huang':    { forceId: 'cao', cityId: 'wancheng' },
  'zhang-liao':  { forceId: 'cao', cityId: 'hefei' },
  'zhang-he':    { forceId: 'cao', cityId: 'ye' },
  'yu-jin':      { forceId: 'cao', cityId: 'wancheng' }, // captured & shamed but alive
  'le-jin':      { forceId: 'cao', cityId: 'shouchun' },
  'li-dian':     { forceId: 'cao', cityId: 'shouchun' },
  'man-chong':   { forceId: 'cao', cityId: 'shouchun' },
  'hao-zhao':    { forceId: 'cao', cityId: 'tongguan' },
  'zang-ba':     { forceId: 'cao', cityId: 'pengcheng' },
  'wen-pin':     { forceId: 'cao', cityId: 'wancheng' },
  'guo-huai':    { forceId: 'cao', cityId: 'changan' },
  'sun-li':      { forceId: 'cao', cityId: 'tongguan' },
  'tian-yu':     { forceId: 'cao', cityId: 'beiping' },
  'sima-yi':     { forceId: 'cao', cityId: 'luoyang' },
  'sima-shi':    { forceId: 'cao', cityId: 'luoyang' },
  'sima-zhao':   { forceId: 'cao', cityId: 'luoyang' },
  'jia-xu':      { forceId: 'cao', cityId: 'luoyang' }, // d. 223
  'liu-ye':      { forceId: 'cao', cityId: 'luoyang' },
  'chen-qun':    { forceId: 'cao', cityId: 'xuchang' },
  'liu-fang':    { forceId: 'cao', cityId: 'luoyang' },
  'sun-zi':      { forceId: 'cao', cityId: 'luoyang' },
  'jia-kui':     { forceId: 'cao', cityId: 'xiangyang' },
  'yang-fu':     { forceId: 'cao', cityId: 'changan' },
  'wang-su':     { forceId: 'cao', cityId: 'luoyang' },
  'hu-zhi':      { forceId: 'cao', cityId: 'pingyuan' },
  'cai-wenji':   { forceId: 'cao', cityId: 'xuchang' },
  'wang-ling':   { forceId: 'cao', cityId: 'shouchun' },

  // ── Shu Han ──
  'liu-bei':     { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-feng':    { forceId: 'liu-bei', cityId: 'yongan' }, // d. 220 — included
  'liu-yong':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'yongan' }, // d. 221
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'ma-chao':     { forceId: 'liu-bei', cityId: 'jiangzhou' }, // d. 222 — included
  'ma-dai':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wei-yan':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wang-ping':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'liao-hua':    { forceId: 'liu-bei', cityId: 'yongan' },
  'guan-xing':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhang-bao':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhou-cang':   { forceId: 'liu-bei', cityId: 'yongan' }, // d. 219 — but in 220 included as recent
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'chengdu' },
  'fa-zheng':    { forceId: 'liu-bei', cityId: 'chengdu' }, // d. 220 — included
  'ma-liang':    { forceId: 'liu-bei', cityId: 'chengdu' }, // d. 222
  'ma-su':       { forceId: 'liu-bei', cityId: 'hanzhong' },
  'jiang-wan':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'fei-yi':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'dong-yun':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'jian-yong':   { forceId: 'liu-bei', cityId: 'chengdu' }, // d. 222
  'sun-qian':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'mi-zhu':      { forceId: 'liu-bei', cityId: 'chengdu' }, // d. 220 (mi-fang's defection)
  'liu-ba':      { forceId: 'liu-bei', cityId: 'chengdu' }, // d. 222
  'li-yan':      { forceId: 'liu-bei', cityId: 'yongan' },
  'yang-yi':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'deng-zhi':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'huo-yi':      { forceId: 'liu-bei', cityId: 'yongan' },
  'yan-yan':     { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'wu-yi':       { forceId: 'liu-bei', cityId: 'chengdu' },
  'wu-ban':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'yang-hong':   { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'lady-sun':    { forceId: 'liu-bei', cityId: 'chengdu' }, // hmm she went back to Wu actually
  // Liu Bei's wives are dead, lady-mi died 208 already

  // ── Wu (Sun Quan just took Jingzhou) ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'lu-xun':      { forceId: 'sun', cityId: 'jiangling' },
  'lu-meng':     { forceId: 'sun', cityId: 'jiangling' }, // d. 220 — included as just-captured-Jingzhou
  'lu-su':       { forceId: 'sun', cityId: 'jianye' }, // d. 217 — will be marked dead
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'cheng-pu':    { forceId: 'sun', cityId: 'jianye' }, // d. 215 — will be dead
  'huang-gai':   { forceId: 'sun', cityId: 'changsha' }, // d. 215
  'han-dang':    { forceId: 'sun', cityId: 'wu' },
  'gan-ning':    { forceId: 'sun', cityId: 'jiangxia' }, // d. 220 — included
  'taishi-ci':   { forceId: 'sun', cityId: 'jianye' }, // d. 206 — will be dead
  'ling-tong'   : { forceId: 'sun', cityId: 'wu' }, // Ling Tong d. 217
  'jiang-qin':   { forceId: 'sun', cityId: 'wu' }, // d. 219
  'pan-zhang':   { forceId: 'sun', cityId: 'wuling' },
  'zhu-ran':     { forceId: 'sun', cityId: 'jianye' },
  'zhu-huan':    { forceId: 'sun', cityId: 'yuzhang' },
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },
  'xu-sheng-wu':     { forceId: 'sun', cityId: 'jianye' }, // Xu Sheng
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },
  'gu-yong':     { forceId: 'sun', cityId: 'jianye' },
  'bu-zhi':      { forceId: 'sun', cityId: 'wuxi' },
  'he-qi':       { forceId: 'sun', cityId: 'changsha' },
  'lu-dai':      { forceId: 'sun', cityId: 'yuzhang' },
  'quan-cong':   { forceId: 'sun', cityId: 'jianye' },
  'pan-jun':     { forceId: 'sun', cityId: 'changsha' },
  'yu-fan':      { forceId: 'sun', cityId: 'jianye' },

  // ── Shi Xie ──
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },

  // ── Xianbei (Kebi Neng's confederacy) ──
  'kebi-neng':   { forceId: 'xianbei', cityId: 'wuhuan' },
  'budugen':     { forceId: 'xianbei', cityId: 'wuhuan' },

  // ── Nanman (Meng Huo's host) ──
  'meng-huo':    { forceId: 'nanman', cityId: 'jianning' },
  'meng-you':    { forceId: 'nanman', cityId: 'yongchang' },
  'mangya-chang':{ forceId: 'nanman', cityId: 'jianning' },
  'jinhuan-sanjie':{forceId:'nanman', cityId: 'yongchang' },
  'dongtu-na':   { forceId: 'nanman', cityId: 'yunnan' },
  'ahui-nan':    { forceId: 'nanman', cityId: 'yunnan' },
  'wutugu':      { forceId: 'nanman', cityId: 'yuexi' },
  'zhu-rong':    { forceId: 'nanman', cityId: 'jianning' },
};

export const SCENARIO_220_DECLARATION: Scenario = {
  id: 'scn-220-declaration',
  name: { en: 'Three Kingdoms Declared', zh: '三國鼎立' },
  description:
    'Spring 220 AD. Cao Cao has died; his son Cao Pi prepares to receive the abdication from ' +
    "Emperor Xian and declare the Wei dynasty. Liu Bei holds Yi and Hanzhong but Jingzhou is lost — " +
    'Guan Yu fell, and Lu Meng captured the south for Sun Quan. The realm is split between three rivals.',
  descriptionZh: "公元220年春。曹操薨逝，其子曹丕將受漢獻帝禪讓，建立大魏。劉備據益州、漢中，然荊州已失——關羽兵敗身死，呂蒙白衣渡江盡取江南。天下遂成三足鼎立之勢。",
  startDate: { year: 220, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_220),
  forces: FORCES_220,
  // Auto-compute dead officers by year — anything dying before 220 gets marked dead.
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_220, [], 220),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario 7 — 215 AD Battle of Hefei 合肥之戰
// Liu Bei has taken Yi province from Liu Zhang. Sun Quan attacks Hefei
// with 100,000 men against Zhang Liao's 7,000. Cao Cao is at Hanzhong
// dealing with Zhang Lu.
// ──────────────────────────────────────────────────────────────────────

const FORCES_215: Force[] = [
  { id: 'cao',       name: { en: 'Cao Cao',    zh: '曹操軍' }, rulerOfficerId: 'cao-cao',   capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei',   name: { en: 'Liu Bei',    zh: '劉備軍' }, rulerOfficerId: 'liu-bei',   capitalCityId: 'chengdu',  color: '#a85d8a', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Quan',   zh: '孫權軍' }, rulerOfficerId: 'sun-quan',  capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',   zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6b8a6b', isPlayer: false },
  { id: 'shi-xie',   name: { en: 'Shi Xie',    zh: '士燮軍' }, rulerOfficerId: 'shi-xie',   capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
  { id: 'xianbei',   name: { en: 'Xianbei',    zh: '鮮卑'   }, rulerOfficerId: 'kebi-neng', capitalCityId: 'wuhuan',   color: '#7a5a3a', isPlayer: false },
  { id: 'nanman',    name: { en: 'Nanman',     zh: '南蛮'   }, rulerOfficerId: 'meng-huo',  capitalCityId: 'jianning', color: '#6e8a2a', isPlayer: false },
];

const CITY_OWNERSHIP_215: Record<string, string> = {
  // Cao Cao — northern empire
  xuchang:   'cao',
  luoyang:   'cao',
  wancheng:  'cao',
  chenliu:   'cao',
  runan:     'cao',
  pingyuan:  'cao',
  ye:        'cao',
  bohai:     'cao',
  beihai:    'cao',
  beiping:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  changan:   'cao',
  liaodong:  'cao',
  xinye:     'cao',
  guandu:    'cao',
  hulao:     'cao',
  tongguan:  'cao',
  linzi:     'cao',
  hefei:     'cao',          // Defended by Zhang Liao!
  shouchun:  'cao',
  lujiang:   'cao',
  xiangyang: 'cao',          // From Liu Cong's 208 surrender
  jincheng:  'cao',
  wuwei:     'cao',
  anding:    'cao',
  mei:       'cao',
  // Liu Bei — Yi + Hanzhong's western part
  chengdu:   'liu-bei',
  yongan:    'liu-bei',
  jiangzhou: 'liu-bei',
  yangping:  'liu-bei',
  jiangling: 'liu-bei',      // Borrowed Jingzhou
  changsha:  'liu-bei',
  lingling:  'liu-bei',
  wuling:    'liu-bei',
  // Sun Quan — Jiangdong
  jianye:    'sun',
  wu:        'sun',
  wuxi:      'sun',
  yuzhang:   'sun',
  jiangxia:  'sun',
  // Zhang Lu — Hanzhong (about to fall to Cao Cao late 215)
  hanzhong:  'zhang-lu',
  wudu:      'zhang-lu',
  // Shi Xie — Jiao
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
  // Xianbei — Kebi Neng's confederacy on the northern frontier
  wuhuan:    'xianbei',
  // Nanman — Meng Huo's tribes on the southern frontier
  jianning:  'nanman',
  yunnan:    'nanman',
  yongchang: 'nanman',
  yuexi:     'nanman',
};

const OFFICER_ASSIGNMENTS_215: Record<string, { forceId: string; cityId: string }> = {
  // Cao Cao
  'cao-cao':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-pi':      { forceId: 'cao', cityId: 'xuchang' },
  'cao-ren':     { forceId: 'cao', cityId: 'wancheng' },
  'cao-zhang':   { forceId: 'cao', cityId: 'ye' },
  'cao-xiu':     { forceId: 'cao', cityId: 'shouchun' },
  'cao-zhen':    { forceId: 'cao', cityId: 'changan' },
  'cao-hong':    { forceId: 'cao', cityId: 'luoyang' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'xuchang' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'changan' },
  'xiahou-shang':{ forceId: 'cao', cityId: 'xiangyang' },
  'xun-yu':      { forceId: 'cao', cityId: 'xuchang' }, // d. 212 actually; this scenario keeps him alive
  'xun-you':     { forceId: 'cao', cityId: 'xuchang' },
  'guo-jia':     { forceId: 'cao', cityId: 'luoyang' }, // d. 207 actually
  'cheng-yu':    { forceId: 'cao', cityId: 'xuchang' },
  'jia-xu':      { forceId: 'cao', cityId: 'wancheng' },
  'sima-yi':     { forceId: 'cao', cityId: 'luoyang' },
  'liu-ye':      { forceId: 'cao', cityId: 'luoyang' },
  'zhang-liao':  { forceId: 'cao', cityId: 'hefei' }, // The hero of this scenario
  'le-jin':      { forceId: 'cao', cityId: 'hefei' },
  'li-dian':     { forceId: 'cao', cityId: 'hefei' },
  'xu-huang':    { forceId: 'cao', cityId: 'wancheng' },
  'yu-jin':      { forceId: 'cao', cityId: 'wancheng' },
  'xu-chu':      { forceId: 'cao', cityId: 'xuchang' },
  'pang-de':     { forceId: 'cao', cityId: 'changan' },
  'zhang-he':    { forceId: 'cao', cityId: 'ye' },
  'hao-zhao':    { forceId: 'cao', cityId: 'tongguan' },
  'man-chong':   { forceId: 'cao', cityId: 'shouchun' },
  'wen-pin':     { forceId: 'cao', cityId: 'xiangyang' },
  'zang-ba':     { forceId: 'cao', cityId: 'pengcheng' },

  // Liu Bei
  'liu-bei':     { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'guan-yu':     { forceId: 'liu-bei', cityId: 'jiangling' }, // Guarding Jingzhou
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'ma-chao':     { forceId: 'liu-bei', cityId: 'yangping' },
  'huang-zhong': { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'wei-yan':     { forceId: 'liu-bei', cityId: 'yangping' },
  'liao-hua':    { forceId: 'liu-bei', cityId: 'jiangling' },
  'guan-ping':   { forceId: 'liu-bei', cityId: 'jiangling' },
  'zhou-cang':   { forceId: 'liu-bei', cityId: 'jiangling' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'chengdu' },
  'pang-tong':   { forceId: 'liu-bei', cityId: 'yangping' }, // d. 214 actually
  'fa-zheng':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'ma-liang':    { forceId: 'liu-bei', cityId: 'jiangling' },
  'jian-yong':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'sun-qian':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'mi-zhu':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-feng':    { forceId: 'liu-bei', cityId: 'yongan' },

  // Sun Quan
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'lu-meng':     { forceId: 'sun', cityId: 'jianye' },
  'lu-su':       { forceId: 'sun', cityId: 'jianye' },
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'huang-gai':   { forceId: 'sun', cityId: 'jiangxia' },
  'cheng-pu':    { forceId: 'sun', cityId: 'jianye' }, // d. 215 — borderline
  'han-dang':    { forceId: 'sun', cityId: 'wu' },
  'gan-ning':    { forceId: 'sun', cityId: 'jiangxia' },
  'taishi-ci':   { forceId: 'sun', cityId: 'jianye' }, // d. 206 — would be marked dead
  'jiang-qin':   { forceId: 'sun', cityId: 'wu' },
  'pan-zhang':   { forceId: 'sun', cityId: 'yuzhang' },
  'lu-xun':      { forceId: 'sun', cityId: 'jianye' },
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },
  'ling-tong'   : { forceId: 'sun', cityId: 'wu' }, // Ling Tong
  'xu-sheng-wu':     { forceId: 'sun', cityId: 'jianye' }, // Xu Sheng
  'zhu-ran':     { forceId: 'sun', cityId: 'jianye' },

  // Zhang Lu
  'zhang-lu':    { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'yang-song':   { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'zhang-wei':   { forceId: 'zhang-lu', cityId: 'hanzhong' },

  // Shi Xie
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },

  // Xianbei — northern frontier confederacy
  'kebi-neng':   { forceId: 'xianbei', cityId: 'wuhuan' },
  'budugen':     { forceId: 'xianbei', cityId: 'wuhuan' },

  // Nanman — Meng Huo's host (early form)
  'meng-huo':    { forceId: 'nanman', cityId: 'jianning' },
  'meng-you':    { forceId: 'nanman', cityId: 'yongchang' },
  'mangya-chang':{ forceId: 'nanman', cityId: 'jianning' },
  'jinhuan-sanjie':{forceId:'nanman', cityId: 'yongchang' },
  'dongtu-na':   { forceId: 'nanman', cityId: 'yunnan' },
  'ahui-nan':    { forceId: 'nanman', cityId: 'yunnan' },
  'wutugu':      { forceId: 'nanman', cityId: 'yuexi' },
  'zhu-rong':    { forceId: 'nanman', cityId: 'jianning' },
};

export const SCENARIO_215_HEFEI: Scenario = {
  id: 'scn-215-hefei',
  name: { en: 'Battle of Hefei', zh: '合肥之戰' },
  description:
    'Summer 215 AD. Liu Bei has just taken Yi province from Liu Zhang. Cao Cao marches on Zhang Lu at Hanzhong. ' +
    'Sun Quan seizes the moment to attack Hefei with 100,000 men — defended by Zhang Liao\'s 7,000 ' +
    'in the most legendary defensive stand of the era.',
  descriptionZh: "公元215年夏。劉備方取益州於劉璋之手，曹操親征漢中張魯。孫權趁勢起兵十萬攻打合肥——城中張遼僅率七千將士死守，遂演成本朝最為傳奇之守城血戰。",
  startDate: { year: 215, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_215),
  forces: FORCES_215,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_215, [], 215),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 197 AD Bohai Front (Cao vs Yuan early friction)
// ──────────────────────────────────────────────────────────────────────

const FORCES_197: Force[] = [
  { id: 'cao',       name: { en: 'Cao Cao',     zh: '曹操軍'   }, rulerOfficerId: 'cao-cao',     capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'yuan-shao', name: { en: 'Yuan Shao',   zh: '袁紹軍'   }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'ye',       color: '#b8442e', isPlayer: false },
  { id: 'yuan-shu',  name: { en: 'Yuan Shu',    zh: '袁術軍'   }, rulerOfficerId: 'yuan-shu',    capitalCityId: 'shouchun', color: '#a85d8a', isPlayer: false },
  { id: 'lu-bu',     name: { en: 'Lü Bu',       zh: '呂布軍'   }, rulerOfficerId: 'lu-bu',       capitalCityId: 'xiapi',    color: '#c19a3b', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Ce',      zh: '孫策軍'   }, rulerOfficerId: 'sun-ce',      capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-biao',  name: { en: 'Liu Biao',    zh: '劉表軍'   }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#d9803a', isPlayer: false },
  { id: 'liu-yan',   name: { en: 'Liu Zhang',   zh: '劉璋軍'   }, rulerOfficerId: 'liu-zhang',   capitalCityId: 'chengdu',  color: '#a8703a', isPlayer: false },
  { id: 'gongsun',   name: { en: 'Gongsun Zan', zh: '公孫瓚軍' }, rulerOfficerId: 'gongsun-zan', capitalCityId: 'beiping',  color: '#5a9bb8', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍'   }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#8a5d3a', isPlayer: false },
];

const CITY_OWNERSHIP_197: Record<string, string> = {
  // Cao's central plain
  xuchang:   'cao',
  luoyang:   'cao',
  chenliu:   'cao',
  runan:     'cao',
  pengcheng: 'cao',
  // Yuan Shao's north
  ye:        'yuan-shao',
  bohai:     'yuan-shao',
  pingyuan:  'yuan-shao',
  beihai:    'yuan-shao',
  // Yuan Shu's south-east
  shouchun:  'yuan-shu',
  hefei:     'yuan-shu',
  wancheng:  'yuan-shu',
  // Lü Bu — wedged in Xuzhou
  xiapi:     'lu-bu',
  // Sun Ce — Jiangdong base
  jianye:    'sun',
  wu:        'sun',
  yuzhang:   'sun',
  changsha:  'sun',
  // Liu Biao
  xiangyang: 'liu-biao',
  jiangxia:  'liu-biao',
  wuling:    'liu-biao',
  lingling:  'liu-biao',
  // Liu Yan — Yi province
  chengdu:   'liu-yan',
  yongan:    'liu-yan',
  jiangzhou: 'liu-yan',
  // Gongsun Zan — northeast
  beiping:   'gongsun',
  yuyang:    'gongsun',
  // Ma Teng — northwest
  wuwei:     'ma-teng',
  jincheng:  'ma-teng',
  anding:    'ma-teng',
  // Han imperial city
  changan:   'cao',
  taiyuan:   'yuan-shao',
  yanmen:    'yuan-shao',
  shangdang: 'yuan-shao',
};

const OFFICER_ASSIGNMENTS_197: Record<string, { forceId: string; cityId: string }> = {
  // Cao force
  'cao-cao':     { forceId: 'cao',       cityId: 'xuchang' },
  'xiahou-dun':  { forceId: 'cao',       cityId: 'xuchang' },
  'xiahou-yuan': { forceId: 'cao',       cityId: 'luoyang' },
  'cao-ren':     { forceId: 'cao',       cityId: 'chenliu' },
  'cao-hong':    { forceId: 'cao',       cityId: 'xuchang' },
  'cao-pi':      { forceId: 'cao',       cityId: 'xuchang' },
  'yu-jin':      { forceId: 'cao',       cityId: 'runan' },
  'le-jin':      { forceId: 'cao',       cityId: 'xuchang' },
  'dian-wei':    { forceId: 'cao',       cityId: 'wancheng' }, // Dies at Wancheng 197 — historical
  'xun-yu':      { forceId: 'cao',       cityId: 'xuchang' },
  'guo-jia':     { forceId: 'cao',       cityId: 'xuchang' },
  'jia-xu':      { forceId: 'cao',       cityId: 'wancheng' },
  // Yuan Shao
  'yuan-shao':   { forceId: 'yuan-shao', cityId: 'ye' },
  'yan-liang':   { forceId: 'yuan-shao', cityId: 'ye' },
  'wen-chou':    { forceId: 'yuan-shao', cityId: 'ye' },
  'zhang-he':    { forceId: 'yuan-shao', cityId: 'bohai' },
  'tian-feng':   { forceId: 'yuan-shao', cityId: 'ye' },
  // Yuan Shu
  'yuan-shu':    { forceId: 'yuan-shu',  cityId: 'shouchun' },
  'ji-ling':     { forceId: 'yuan-shu',  cityId: 'shouchun' },
  // Lü Bu
  'lu-bu':       { forceId: 'lu-bu',     cityId: 'xiapi' },
  'diaochan':    { forceId: 'lu-bu',     cityId: 'xiapi' },
  // Sun
  'sun-ce':      { forceId: 'sun',       cityId: 'jianye' },
  'sun-quan':    { forceId: 'sun',       cityId: 'jianye' },
  'zhou-yu':     { forceId: 'sun',       cityId: 'jianye' },
  'cheng-pu':    { forceId: 'sun',       cityId: 'wu' },
  'huang-gai':   { forceId: 'sun',       cityId: 'changsha' },
  // Liu Biao
  'liu-biao':    { forceId: 'liu-biao',  cityId: 'xiangyang' },
  // Liu Zhang (succeeded his father Liu Yan, d.194)
  'liu-zhang':   { forceId: 'liu-yan',   cityId: 'chengdu' },
  // Gongsun
  'gongsun-zan': { forceId: 'gongsun',   cityId: 'beiping' },
  // Ma Teng
  'ma-teng':     { forceId: 'ma-teng',   cityId: 'wuwei' },
  'ma-chao':     { forceId: 'ma-teng',   cityId: 'jincheng' },
};

const DEAD_BY_197 = ['sun-jian', 'dong-zhuo', 'li-ru', 'tao-qian', 'kong-rong'];

export const SCENARIO_197_BOHAI: Scenario = {
  id: 'scn-197-bohai',
  name: { en: 'Cao vs Yuan — The Northern Front', zh: '渤海戰線' },
  description:
    'Spring 197 AD. Cao Cao has just escorted Emperor Xian to Xuchang; ' +
    'Yuan Shao broods to the north with twice his strength. ' +
    'Lü Bu holds Xiapi after fleeing Chang\'an; Sun Ce rises in the south. ' +
    'The chessboard is set for the next decade.',
  descriptionZh: "公元197年春。曹操方迎漢獻帝駐蹕許昌，袁紹於河北擁兵倍於曹氏，虎視中原。呂布兵敗長安後據守下邳，孫策亦於江東崛起。天下棋局，已為此後十年之爭埋下伏線。",
  startDate: { year: 197, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_197),
  forces: FORCES_197,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_197, DEAD_BY_197, 197),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 219 AD The Hanzhong Campaign
// ──────────────────────────────────────────────────────────────────────

const FORCES_219: Force[] = [
  { id: 'cao',     name: { en: 'Cao Cao',  zh: '曹操軍' }, rulerOfficerId: 'cao-cao', capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Liu Bei',  zh: '劉備軍' }, rulerOfficerId: 'liu-bei', capitalCityId: 'chengdu',  color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Sun Quan', zh: '孫權軍' }, rulerOfficerId: 'sun-quan', capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
  { id: 'xianbei', name: { en: 'Xianbei',  zh: '鮮卑'   }, rulerOfficerId: 'kebi-neng', capitalCityId: 'wuhuan', color: '#7a5a3a', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',   zh: '南蛮'   }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning', color: '#6e8a2a', isPlayer: false },
];

const CITY_OWNERSHIP_219: Record<string, string> = {
  // Cao Cao consolidated the north
  xuchang: 'cao', luoyang: 'cao', changan: 'cao', ye: 'cao',
  chenliu: 'cao', wancheng: 'cao', runan: 'cao', xinye: 'cao',
  pengcheng: 'cao', xiapi: 'cao', shouchun: 'cao', hefei: 'cao',
  pingyuan: 'cao', taiyuan: 'cao', yanmen: 'cao', shangdang: 'cao',
  beiping: 'cao', yuyang: 'cao', bohai: 'cao', beihai: 'cao',
  wuwei: 'cao', jincheng: 'cao', anding: 'cao',
  // Liu Bei — Shu + Jingzhou portion
  chengdu: 'liu-bei', yongan: 'liu-bei', jiangzhou: 'liu-bei',
  hanzhong: 'liu-bei',         // The 219 campaign just resolved in Liu's favor
  // Jingzhou — Guan Yu still in Jiangling; Cao holds Xiangyang/Fan
  xiangyang: 'cao',
  jiangling: 'liu-bei',
  changsha: 'sun', wuling: 'liu-bei',
  lingling: 'liu-bei',
  // Sun Quan — Jiangdong + recent gains
  jianye: 'sun', wu: 'sun', yuzhang: 'sun', kuaiji: 'sun',
  jiangxia: 'sun',
  // Xianbei — Kebi Neng's confederacy
  wuhuan: 'xianbei',
  // Nanman — Meng Huo's tribes
  jianning: 'nanman', yunnan: 'nanman', yongchang: 'nanman', yuexi: 'nanman',
};

const OFFICER_ASSIGNMENTS_219: Record<string, { forceId: string; cityId: string }> = {
  // Cao
  'cao-cao':     { forceId: 'cao',     cityId: 'xuchang' },
  'cao-pi':      { forceId: 'cao',     cityId: 'xuchang' },
  'cao-ren':     { forceId: 'cao',     cityId: 'xiangyang' },
  'cao-hong':    { forceId: 'cao',     cityId: 'changan' },
  'xiahou-dun':  { forceId: 'cao',     cityId: 'shouchun' },
  'zhang-liao':  { forceId: 'cao',     cityId: 'hefei' },
  'xu-chu':      { forceId: 'cao',     cityId: 'xuchang' },
  'zhang-he':    { forceId: 'cao',     cityId: 'changan' },
  'xu-huang':    { forceId: 'cao',     cityId: 'xiangyang' },
  'yu-jin':      { forceId: 'cao',     cityId: 'xiangyang' },
  'pang-de':     { forceId: 'cao',     cityId: 'xiangyang' },
  'sima-yi':     { forceId: 'cao',     cityId: 'xuchang' },
  'jia-xu':      { forceId: 'cao',     cityId: 'xuchang' },
  // Liu Bei
  'liu-bei':     { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'chengdu' },
  'guan-yu':     { forceId: 'liu-bei', cityId: 'jiangling' },
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'ma-chao':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'huang-zhong': { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wei-yan':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'fa-zheng':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-feng':    { forceId: 'liu-bei', cityId: 'jiangling' },
  // Sun
  'sun-quan':    { forceId: 'sun',     cityId: 'jianye' },
  'lu-meng':     { forceId: 'sun',     cityId: 'jiangxia' },
  'lu-xun':      { forceId: 'sun',     cityId: 'jianye' },
  'gan-ning':    { forceId: 'sun',     cityId: 'jianye' },
  'taishi-ci':   { forceId: 'sun',     cityId: 'wu' },
  'zhou-tai':    { forceId: 'sun',     cityId: 'jianye' },
  'han-dang':    { forceId: 'sun',     cityId: 'changsha' },

  // Xianbei
  'kebi-neng':   { forceId: 'xianbei', cityId: 'wuhuan' },
  'budugen':     { forceId: 'xianbei', cityId: 'wuhuan' },

  // Nanman — Meng Huo's host
  'meng-huo':    { forceId: 'nanman', cityId: 'jianning' },
  'meng-you':    { forceId: 'nanman', cityId: 'yongchang' },
  'mangya-chang':{ forceId: 'nanman', cityId: 'jianning' },
  'jinhuan-sanjie':{forceId:'nanman', cityId: 'yongchang' },
  'dongtu-na':   { forceId: 'nanman', cityId: 'yunnan' },
  'ahui-nan':    { forceId: 'nanman', cityId: 'yunnan' },
  'wutugu':      { forceId: 'nanman', cityId: 'yuexi' },
  'zhu-rong':    { forceId: 'nanman', cityId: 'jianning' },
};

const DEAD_BY_219 = [
  'sun-jian', 'dong-zhuo', 'li-ru', 'lu-bu', 'cao-ang', 'dian-wei',
  'sun-ce', 'zhou-yu', 'lu-su', 'guo-jia', 'pang-tong', 'ma-teng',
  'yuan-shao', 'yuan-shu', 'tao-qian', 'gongsun-zan',
];

export const SCENARIO_219_HANZHONG: Scenario = {
  id: 'scn-219-hanzhong',
  name: { en: 'The Hanzhong Campaign', zh: '漢中王' },
  description:
    'Autumn 219 AD. Liu Bei has just defeated Cao Cao at Hanzhong and proclaimed himself King. ' +
    'Guan Yu is moving to lay siege to Fancheng — the high tide of Shu. ' +
    'But Sun Quan watches Jingzhou, and Lü Meng has a plan involving white robes.',
  descriptionZh: "公元219年秋。劉備於漢中大破曹操，自立為漢中王。關雲長兵發樊城，蜀漢國勢一時鼎盛。然孫權窺伺荊州，呂蒙密謀白衣渡江之計。",
  startDate: { year: 219, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_219),
  forces: FORCES_219,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_219, DEAD_BY_219, 219),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 222 AD The Battle of Yiling
// ──────────────────────────────────────────────────────────────────────

const FORCES_222: Force[] = [
  { id: 'cao',     name: { en: 'Cao Pi',   zh: '魏'    }, rulerOfficerId: 'cao-pi',   capitalCityId: 'luoyang',  color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Liu Bei',  zh: '蜀漢'  }, rulerOfficerId: 'liu-bei',  capitalCityId: 'chengdu',  color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Sun Quan', zh: '吳'    }, rulerOfficerId: 'sun-quan', capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'xianbei', name: { en: 'Xianbei',  zh: '鮮卑'  }, rulerOfficerId: 'kebi-neng',capitalCityId: 'wuhuan',   color: '#7a5a3a', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',   zh: '南蛮'  }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning', color: '#6e8a2a', isPlayer: false },
];

const CITY_OWNERSHIP_222: Record<string, string> = {
  // Wei holds the north and Jingzhou's north
  luoyang: 'cao', xuchang: 'cao', changan: 'cao', ye: 'cao',
  chenliu: 'cao', wancheng: 'cao', runan: 'cao', xinye: 'cao',
  pengcheng: 'cao', xiapi: 'cao', shouchun: 'cao', hefei: 'cao',
  pingyuan: 'cao', taiyuan: 'cao', yanmen: 'cao', shangdang: 'cao',
  beiping: 'cao', yuyang: 'cao', bohai: 'cao', beihai: 'cao',
  wuwei: 'cao', jincheng: 'cao', anding: 'cao', xiangyang: 'cao',
  // Shu — Yi province + the Baidi gateway
  chengdu: 'liu-bei', yongan: 'liu-bei', jiangzhou: 'liu-bei',
  hanzhong: 'liu-bei',
  // Wu — just took Jingzhou from Liu, killing Guan Yu in 220
  jianye: 'sun', wu: 'sun', yuzhang: 'sun', kuaiji: 'sun',
  jiangxia: 'sun', jiangling: 'sun', changsha: 'sun',
  wuling: 'sun', lingling: 'sun',
  // Xianbei — Kebi Neng on the northern frontier
  wuhuan: 'xianbei',
  // Nanman — Meng Huo's tribes
  jianning: 'nanman', yunnan: 'nanman', yongchang: 'nanman', yuexi: 'nanman',
};

const OFFICER_ASSIGNMENTS_222: Record<string, { forceId: string; cityId: string }> = {
  // Wei (Cao Pi's young state)
  'cao-pi':      { forceId: 'cao',     cityId: 'luoyang' },
  'cao-ren':     { forceId: 'cao',     cityId: 'xiangyang' },
  'cao-zhen':    { forceId: 'cao',     cityId: 'changan' },
  'cao-xiu':     { forceId: 'cao',     cityId: 'shouchun' },
  'zhang-liao':  { forceId: 'cao',     cityId: 'hefei' },
  'xu-huang':    { forceId: 'cao',     cityId: 'xiangyang' },
  'zhang-he':    { forceId: 'cao',     cityId: 'changan' },
  'sima-yi':     { forceId: 'cao',     cityId: 'luoyang' },
  'jia-xu':      { forceId: 'cao',     cityId: 'luoyang' },
  // Shu (revenge campaign)
  'liu-bei':     { forceId: 'liu-bei', cityId: 'yongan' },
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'yongan' }, // Murdered 221 historically; this scenario "keeps him alive a season".
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'huang-zhong': { forceId: 'liu-bei', cityId: 'yongan' },
  'ma-chao':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wei-yan':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  // Wu (defending Jingzhou)
  'sun-quan':    { forceId: 'sun',     cityId: 'jianye' },
  'lu-xun':      { forceId: 'sun',     cityId: 'jiangling' },
  'lu-meng':     { forceId: 'sun',     cityId: 'jiangxia' },
  'gan-ning':    { forceId: 'sun',     cityId: 'wu' },
  'zhou-tai':    { forceId: 'sun',     cityId: 'jiangling' },
  'pan-zhang':   { forceId: 'sun',     cityId: 'jiangling' },

  // Xianbei
  'kebi-neng':   { forceId: 'xianbei', cityId: 'wuhuan' },
  'budugen':     { forceId: 'xianbei', cityId: 'wuhuan' },

  // Nanman — Meng Huo's host (about to rebel two years later)
  'meng-huo':    { forceId: 'nanman', cityId: 'jianning' },
  'meng-you':    { forceId: 'nanman', cityId: 'yongchang' },
  'mangya-chang':{ forceId: 'nanman', cityId: 'jianning' },
  'jinhuan-sanjie':{forceId:'nanman', cityId: 'yongchang' },
  'dongtu-na':   { forceId: 'nanman', cityId: 'yunnan' },
  'ahui-nan':    { forceId: 'nanman', cityId: 'yunnan' },
  'wutugu':      { forceId: 'nanman', cityId: 'yuexi' },
  'zhu-rong':    { forceId: 'nanman', cityId: 'jianning' },
};

const DEAD_BY_222 = [
  'sun-jian', 'dong-zhuo', 'li-ru', 'lu-bu', 'cao-ang', 'dian-wei',
  'sun-ce', 'zhou-yu', 'lu-su', 'guo-jia', 'pang-tong', 'ma-teng',
  'yuan-shao', 'yuan-shu', 'tao-qian', 'gongsun-zan',
  'cao-cao', 'guan-yu', 'huang-zhong', // historically — slight artistic license
  'huangfu-song', 'lu-zhi', 'zhu-jun',
];

export const SCENARIO_222_YILING: Scenario = {
  id: 'scn-222-yiling',
  name: { en: 'The Battle of Yiling', zh: '夷陵之戰' },
  description:
    'Summer 222 AD. Liu Bei, mad with grief over Guan Yu\'s death, marches east with 70,000 men to crush Wu. ' +
    'Sun Quan sends Lu Xun — a fresh-faced commander none had heard of — to meet him. ' +
    'A burning camp 700 li long awaits.',
  descriptionZh: "公元222年夏。劉備為報雲長之仇，怒髮衝冠，率七十萬大軍東征伐吳。孫權拜陸遜為帥——此人名不見經傳，卻臨危受命。連營七百里，烈火焚天之劫即將降臨。",
  startDate: { year: 222, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_222),
  forces: FORCES_222,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_222, DEAD_BY_222, 222),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 225 AD The Southern Campaign (Zhuge Liang vs Meng Huo)
// ──────────────────────────────────────────────────────────────────────

const FORCES_225: Force[] = [
  { id: 'liu-bei', name: { en: 'Shu',     zh: '蜀漢'  }, rulerOfficerId: 'liu-shan', capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'cao',     name: { en: 'Wei',     zh: '魏'    }, rulerOfficerId: 'cao-pi',   capitalCityId: 'luoyang', color: '#3a7dd9', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',      zh: '吳'    }, rulerOfficerId: 'sun-quan', capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',  zh: '南蛮'  }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning',color: '#6e8a2a', isPlayer: false },
];

const CITY_OWNERSHIP_225: Record<string, string> = {
  // Wei holds the north
  luoyang: 'cao', xuchang: 'cao', changan: 'cao', ye: 'cao',
  chenliu: 'cao', wancheng: 'cao', runan: 'cao', xinye: 'cao',
  pengcheng: 'cao', xiapi: 'cao', shouchun: 'cao', hefei: 'cao',
  pingyuan: 'cao', taiyuan: 'cao', yanmen: 'cao', shangdang: 'cao',
  beiping: 'cao', yuyang: 'cao', bohai: 'cao', beihai: 'cao',
  wuwei: 'cao', jincheng: 'cao', anding: 'cao', xiangyang: 'cao',
  // Shu (Liu Shan now — Liu Bei died at Baidi in 223)
  chengdu: 'liu-bei', yongan: 'liu-bei', jiangzhou: 'liu-bei',
  hanzhong: 'liu-bei',
  // Wu
  jianye: 'sun', wu: 'sun', yuzhang: 'sun', kuaiji: 'sun',
  jiangxia: 'sun', jiangling: 'sun', changsha: 'sun',
  wuling: 'sun', lingling: 'sun',
  // Nanman — rebelled across the southern frontier
  jianning: 'nanman',
  yongchang: 'nanman',
  yunnan: 'nanman',
  yuexi: 'nanman',
};

const OFFICER_ASSIGNMENTS_225: Record<string, { forceId: string; cityId: string }> = {
  // Shu — the campaign army
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'ma-chao':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'ma-dai':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'wei-yan':     { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'wang-ping':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'jiang-wan':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'fei-yi':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'deng-zhi':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'guan-xing':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'liao-hua':    { forceId: 'liu-bei', cityId: 'hanzhong' },
  'jiang-wei':   { forceId: 'liu-bei', cityId: 'chengdu' },
  // Wei
  'cao-pi':      { forceId: 'cao',     cityId: 'luoyang' },
  'sima-yi':     { forceId: 'cao',     cityId: 'luoyang' },
  'cao-zhen':    { forceId: 'cao',     cityId: 'changan' },
  'cao-xiu':     { forceId: 'cao',     cityId: 'shouchun' },
  'zhang-liao':  { forceId: 'cao',     cityId: 'hefei' },
  'zhang-he':    { forceId: 'cao',     cityId: 'changan' },
  'jia-xu':      { forceId: 'cao',     cityId: 'luoyang' },
  'zhong-yao':   { forceId: 'cao',     cityId: 'luoyang' },
  // Wu
  'sun-quan':    { forceId: 'sun',     cityId: 'jianye' },
  'lu-xun':      { forceId: 'sun',     cityId: 'jiangling' },
  'lu-meng':     { forceId: 'sun',     cityId: 'jiangxia' },
  'zhou-tai':    { forceId: 'sun',     cityId: 'jianling' },
  'zhuge-jin':   { forceId: 'sun',     cityId: 'jianye' },
  // Nanman — Meng Huo's host
  'meng-huo':    { forceId: 'nanman',  cityId: 'jianning' },
  'meng-you':    { forceId: 'nanman',  cityId: 'yongchang' },
  'mangya-chang':{ forceId: 'nanman',  cityId: 'jianning' },
  'jinhuan-sanjie':{forceId: 'nanman', cityId: 'yongchang' },
  'dongtu-na':   { forceId: 'nanman',  cityId: 'yunnan' },
  'ahui-nan':    { forceId: 'nanman',  cityId: 'yunnan' },
  'wutugu':      { forceId: 'nanman',  cityId: 'yuexi' },
  'dailai-dongzhu':{forceId: 'nanman', cityId: 'jianning' },
  'zhu-rong':    { forceId: 'nanman',  cityId: 'jianning' },
};

const DEAD_BY_225 = [
  'sun-jian', 'dong-zhuo', 'li-ru', 'lu-bu', 'cao-ang', 'dian-wei',
  'sun-ce', 'zhou-yu', 'lu-su', 'guo-jia', 'pang-tong', 'ma-teng',
  'yuan-shao', 'yuan-shu', 'tao-qian', 'gongsun-zan',
  'cao-cao', 'guan-yu', 'huang-zhong', 'liu-bei', 'zhang-fei',
  'huangfu-song', 'lu-zhi', 'zhu-jun', 'fa-zheng',
];

export const SCENARIO_225_SOUTHERN: Scenario = {
  id: 'scn-225-southern',
  name: { en: 'The Southern Campaign', zh: '南征之役' },
  description:
    'Spring 225 AD. With Liu Bei gone, the southern tribes under Meng Huo have raised the war banner. ' +
    'Zhuge Liang marches south himself, vowing to win not by force but by surrender of the heart. ' +
    'Seven captures of the tiger-king lie ahead.',
  descriptionZh: "公元225年春。先主既崩，南中孟獲糾合蠻夷舉旗作亂。諸葛亮親率大軍南征，誓以攻心為上，不以力屈。七擒孟獲之傳奇，自此展開。",
  startDate: { year: 225, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_225),
  forces: FORCES_225,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_225, DEAD_BY_225, 225),
};


// ──────────────────────────────────────────────────────────────────────
// Scenario — 198 AD The Siege of Xiapi 下邳之圍
// Cao Cao and Liu Bei besiege Lü Bu's last redoubt in Xu province.
// Yuan Shao dominates Hebei; Sun Ce is rising in Jiangdong; Liu Biao
// holds Jing; Liu Zhang holds Yi. Chen Gong and Gao Shun fight to the
// last beside Lü Bu.
// ──────────────────────────────────────────────────────────────────────

const FORCES_198: Force[] = [
  { id: 'cao',       name: { en: 'Cao Cao',     zh: '曹操軍' }, rulerOfficerId: 'cao-cao',     capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'lubu',      name: { en: 'Lü Bu',       zh: '呂布軍' }, rulerOfficerId: 'lu-bu',       capitalCityId: 'xiapi',    color: '#9b3a3a', isPlayer: false },
  { id: 'yuan-shao', name: { en: 'Yuan Shao',   zh: '袁紹軍' }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'ye',       color: '#b8442e', isPlayer: false },
  { id: 'yuan-shu',  name: { en: 'Yuan Shu',    zh: '袁術軍' }, rulerOfficerId: 'yuan-shu',    capitalCityId: 'shouchun', color: '#a85d8a', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Ce',      zh: '孫策軍' }, rulerOfficerId: 'sun-ce',      capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-biao',  name: { en: 'Liu Biao',    zh: '劉表軍' }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#c19a3b', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',   zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang',   capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
  { id: 'gongsun',   name: { en: 'Gongsun Zan', zh: '公孫瓚軍' }, rulerOfficerId: 'gongsun-zan', capitalCityId: 'beiping', color: '#5a9bb8', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍' }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#a8703a', isPlayer: false },
];

const CITY_OWNERSHIP_198: Record<string, string> = {
  // ── Cao Cao — central plain, controlling the Emperor ──
  xuchang:   'cao',
  luoyang:   'cao',
  chenliu:   'cao',
  runan:     'cao',
  wancheng:  'cao',
  pengcheng: 'cao', // Liu Bei's old seat — Cao now holds it
  guandu:    'cao',
  hulao:     'cao',
  // ── Lü Bu — last stand at Xiapi ──
  xiapi:     'lubu',
  // ── Yuan Shao — Hebei colossus ──
  ye:        'yuan-shao',
  bohai:     'yuan-shao',
  pingyuan:  'yuan-shao',
  taiyuan:   'yuan-shao',
  yanmen:    'yuan-shao',
  shangdang: 'yuan-shao',
  beihai:    'yuan-shao',
  // ── Yuan Shu — failing emperor of Zhongjia ──
  shouchun:  'yuan-shu',
  lujiang:   'yuan-shu',
  // ── Sun Ce — rising tiger of Jiangdong ──
  jianye:    'sun',
  wu:        'sun',
  yuzhang:   'sun',
  // ── Liu Biao — Jing province ──
  xiangyang: 'liu-biao',
  jiangxia:  'liu-biao',
  jiangling: 'liu-biao',
  lingling:  'liu-biao',
  wuling:    'liu-biao',
  changsha:  'liu-biao',
  xinye:     'liu-biao',
  // ── Liu Zhang — Yi province ──
  chengdu:   'liu-zhang',
  yongan:    'liu-zhang',
  jiangzhou: 'liu-zhang',
  // ── Gongsun Zan — clinging to Yi (about to fall) ──
  beiping:   'gongsun',
  liaodong:  'gongsun',
  // ── Ma Teng / Liang ──
  wuwei:     'ma-teng',
  jincheng:  'ma-teng',
  anding:    'ma-teng',
  // Neutrals: changan (warlord aftermath), hanzhong (Zhang Lu), jiaozhi, nanhai, hepu
};

const OFFICER_ASSIGNMENTS_198: Record<string, { forceId: string; cityId: string }> = {
  // ── Cao Cao (besieging Xiapi) ──
  'cao-cao':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-ren':     { forceId: 'cao', cityId: 'pengcheng' },
  'cao-hong':    { forceId: 'cao', cityId: 'xuchang' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'pengcheng' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'chenliu' },
  'yu-jin':      { forceId: 'cao', cityId: 'runan' },
  'le-jin':      { forceId: 'cao', cityId: 'wancheng' },
  'xun-yu':      { forceId: 'cao', cityId: 'xuchang' },
  'xun-you':     { forceId: 'cao', cityId: 'xuchang' },
  'guo-jia':     { forceId: 'cao', cityId: 'xuchang' },
  'cheng-yu':    { forceId: 'cao', cityId: 'xuchang' },
  'liu-bei':     { forceId: 'cao', cityId: 'pengcheng' }, // serving Cao after losing Xu
  'guan-yu':     { forceId: 'cao', cityId: 'pengcheng' },
  'zhang-fei':   { forceId: 'cao', cityId: 'pengcheng' },
  'mi-zhu':      { forceId: 'cao', cityId: 'pengcheng' },
  'mi-fang':     { forceId: 'cao', cityId: 'pengcheng' },
  'sun-qian':    { forceId: 'cao', cityId: 'pengcheng' },
  'jian-yong':   { forceId: 'cao', cityId: 'pengcheng' },

  // ── Lü Bu (cornered at Xiapi) ──
  'lu-bu':       { forceId: 'lubu', cityId: 'xiapi' },
  'chen-gong':   { forceId: 'lubu', cityId: 'xiapi' },
  'gao-shun':    { forceId: 'lubu', cityId: 'xiapi' },
  'cao-xing':    { forceId: 'lubu', cityId: 'xiapi' },
  'song-xian':   { forceId: 'lubu', cityId: 'xiapi' },
  'hou-cheng':   { forceId: 'lubu', cityId: 'xiapi' },
  'wei-xu':      { forceId: 'lubu', cityId: 'xiapi' },
  'diaochan':    { forceId: 'lubu', cityId: 'xiapi' },
  'chen-deng':   { forceId: 'lubu', cityId: 'xiapi' }, // betrays Lü Bu in this scenario
  'chen-gui':    { forceId: 'lubu', cityId: 'xiapi' },

  // ── Yuan Shao (peak power) ──
  'yuan-shao':   { forceId: 'yuan-shao', cityId: 'ye' },
  'yan-liang':   { forceId: 'yuan-shao', cityId: 'ye' },
  'wen-chou':    { forceId: 'yuan-shao', cityId: 'ye' },
  'zhang-he':    { forceId: 'yuan-shao', cityId: 'ye' },
  'tian-feng':   { forceId: 'yuan-shao', cityId: 'ye' },
  'ju-shou':     { forceId: 'yuan-shao', cityId: 'ye' },
  'guo-tu':      { forceId: 'yuan-shao', cityId: 'ye' },
  'yuan-tan':    { forceId: 'yuan-shao', cityId: 'pingyuan' },
  'yuan-shang':  { forceId: 'yuan-shao', cityId: 'ye' },

  // ── Yuan Shu (collapsing) ──
  'yuan-shu':    { forceId: 'yuan-shu', cityId: 'shouchun' },
  'ji-ling':     { forceId: 'yuan-shu', cityId: 'lujiang' },

  // ── Sun Ce (Jiangdong) ──
  'sun-ce':      { forceId: 'sun', cityId: 'jianye' },
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'zhou-yu':     { forceId: 'sun', cityId: 'jianye' },
  'cheng-pu':    { forceId: 'sun', cityId: 'wu' },
  'huang-gai':   { forceId: 'sun', cityId: 'wu' },
  'han-dang':    { forceId: 'sun', cityId: 'yuzhang' },
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'taishi-ci':   { forceId: 'sun', cityId: 'wu' },

  // ── Liu Biao ──
  'liu-biao':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'cai-mao':     { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-liang':  { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-yue':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'huang-zu':    { forceId: 'liu-biao', cityId: 'jiangxia' },
  'wen-pin':     { forceId: 'liu-biao', cityId: 'jiangling' },

  // ── Liu Zhang ──
  'liu-zhang':   { forceId: 'liu-zhang', cityId: 'chengdu' },

  // ── Gongsun Zan ──
  'gongsun-zan': { forceId: 'gongsun', cityId: 'beiping' },

  // ── Ma Teng ──
  'ma-teng':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-chao':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'han-sui':     { forceId: 'ma-teng', cityId: 'jincheng' },
};

const DEAD_BY_198 = [
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi',
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong',
  'wang-yun', 'han-fu', 'bao-xin',
  'sun-jian',
  'yang-feng', 'han-xian',
  'tao-qian',
];

export const SCENARIO_198_XIAPI: Scenario = {
  id: 'scn-198-xiapi',
  name: { en: 'The Siege of Xiapi', zh: '下邳之圍' },
  description:
    'Winter 198 AD. Cao Cao, with the Emperor at Xuchang, marches east in alliance with Liu Bei to ' +
    'crush Lü Bu at Xiapi. Yuan Shao watches from Ye with twice their strength; Sun Ce sweeps the ' +
    'Yangtze; Liu Biao guards Jing. Chen Gong and Gao Shun stand last beside the Flying General.',
  descriptionZh: "公元198年冬。曹操挾天子以令諸侯，會同劉備東征下邳，欲擒呂布。袁紹於鄴擁兵倍於曹氏，虎視中原；孫策席捲江東；劉表據荊州自守。陳宮、高順誓死隨飛將軍，困守孤城。",
  startDate: { year: 198, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_198),
  forces: FORCES_198,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_198, DEAD_BY_198, 198),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 207 AD Three Visits to the Thatched Cottage 三顧茅廬
// Liu Bei at Xinye seeks the Sleeping Dragon at Longzhong. Cao Cao has
// just smashed the last of the Yuan brothers at White Wolf Mountain.
// Sun Quan steadies Jiangdong. Red Cliffs lies one year away.
// ──────────────────────────────────────────────────────────────────────

const FORCES_207: Force[] = [
  { id: 'cao',         name: { en: 'Cao Cao',     zh: '曹操軍' }, rulerOfficerId: 'cao-cao',     capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'sun',         name: { en: 'Sun Quan',    zh: '孫權軍' }, rulerOfficerId: 'sun-quan',    capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-biao',    name: { en: 'Liu Biao',    zh: '劉表軍' }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#c19a3b', isPlayer: false },
  { id: 'liu-zhang',   name: { en: 'Liu Zhang',   zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang',   capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
  { id: 'zhang-lu',    name: { en: 'Zhang Lu',    zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',    capitalCityId: 'hanzhong', color: '#6b8a6b', isPlayer: false },
  { id: 'ma-teng',     name: { en: 'Ma Teng',     zh: '馬騰軍' }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#a8703a', isPlayer: false },
  { id: 'gongsun-du',  name: { en: 'Gongsun Kang',zh: '公孫康軍'}, rulerOfficerId: 'gongsun-kang',capitalCityId: 'liaodong', color: '#3a7d9b', isPlayer: false },
  { id: 'shi-xie',     name: { en: 'Shi Xie',     zh: '士燮軍' }, rulerOfficerId: 'shi-xie',     capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
];

const CITY_OWNERSHIP_207: Record<string, string> = {
  // ── Cao Cao — north reunified ──
  xuchang:   'cao',
  luoyang:   'cao',
  chenliu:   'cao',
  runan:     'cao',
  wancheng:  'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  guandu:    'cao',
  hulao:     'cao',
  ye:        'cao',
  bohai:     'cao',
  pingyuan:  'cao',
  taiyuan:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  beihai:    'cao',
  beiping:   'cao',
  changan:   'cao',
  shouchun:  'cao',
  lujiang:   'cao',
  linzi:     'cao',
  // ── Liu Biao (Liu Bei resident at Xinye under him) ──
  xiangyang: 'liu-biao',
  xinye:     'liu-biao',
  jiangxia:  'liu-biao',
  jiangling: 'liu-biao',
  lingling:  'liu-biao',
  wuling:    'liu-biao',
  changsha:  'liu-biao',
  // ── Sun Quan — Jiangdong consolidating ──
  jianye:    'sun',
  wu:        'sun',
  yuzhang:   'sun',
  // ── Liu Zhang — Yi province ──
  chengdu:   'liu-zhang',
  yongan:    'liu-zhang',
  jiangzhou: 'liu-zhang',
  // ── Zhang Lu — Hanzhong theocracy ──
  hanzhong:  'zhang-lu',
  // ── Ma Teng — Liang ──
  wuwei:     'ma-teng',
  jincheng:  'ma-teng',
  anding:    'ma-teng',
  // ── Gongsun Kang — Liaodong (just inherited from father) ──
  liaodong:  'gongsun-du',
  // ── Shi Xie — Jiao ──
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
};

const OFFICER_ASSIGNMENTS_207: Record<string, { forceId: string; cityId: string }> = {
  // ── Cao Cao (returning south after White Wolf Mountain) ──
  'cao-cao':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-pi':      { forceId: 'cao', cityId: 'xuchang' },
  'cao-ren':     { forceId: 'cao', cityId: 'wancheng' },
  'cao-hong':    { forceId: 'cao', cityId: 'luoyang' },
  'cao-chun':    { forceId: 'cao', cityId: 'ye' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'xuchang' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'changan' },
  'xun-yu':      { forceId: 'cao', cityId: 'xuchang' },
  'xun-you':     { forceId: 'cao', cityId: 'xuchang' },
  'guo-jia':     { forceId: 'cao', cityId: 'ye' }, // ill — dies later this year
  'cheng-yu':    { forceId: 'cao', cityId: 'xuchang' },
  'jia-xu':      { forceId: 'cao', cityId: 'wancheng' },
  'sima-yi':     { forceId: 'cao', cityId: 'luoyang' }, // newly recruited
  'zhang-liao':  { forceId: 'cao', cityId: 'shouchun' },
  'xu-huang':    { forceId: 'cao', cityId: 'wancheng' },
  'yu-jin':      { forceId: 'cao', cityId: 'wancheng' },
  'le-jin':      { forceId: 'cao', cityId: 'shouchun' },
  'li-dian':     { forceId: 'cao', cityId: 'shouchun' },
  'zhang-he':    { forceId: 'cao', cityId: 'ye' },
  'xu-chu':      { forceId: 'cao', cityId: 'xuchang' },
  'man-chong':   { forceId: 'cao', cityId: 'runan' },
  'zang-ba':     { forceId: 'cao', cityId: 'pengcheng' },

  // ── Liu Biao (Liu Bei serves him at Xinye) ──
  'liu-biao':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'liu-qi':      { forceId: 'liu-biao', cityId: 'jiangxia' },
  'liu-cong':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'cai-mao':     { forceId: 'liu-biao', cityId: 'xiangyang' },
  'zhang-yun':   { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-liang':  { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-yue':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'huang-zu':    { forceId: 'liu-biao', cityId: 'jiangxia' },
  'wen-pin':     { forceId: 'liu-biao', cityId: 'jiangling' },
  'han-xuan':    { forceId: 'liu-biao', cityId: 'changsha' },
  'liu-du':      { forceId: 'liu-biao', cityId: 'lingling' },
  // Liu Bei's band — guests of Liu Biao at Xinye
  'liu-bei':     { forceId: 'liu-biao', cityId: 'xinye' },
  'guan-yu':     { forceId: 'liu-biao', cityId: 'xinye' },
  'zhang-fei':   { forceId: 'liu-biao', cityId: 'xinye' },
  'zhao-yun':    { forceId: 'liu-biao', cityId: 'xinye' },
  'mi-zhu':      { forceId: 'liu-biao', cityId: 'xinye' },
  'mi-fang':     { forceId: 'liu-biao', cityId: 'xinye' },
  'sun-qian':    { forceId: 'liu-biao', cityId: 'xinye' },
  'jian-yong':   { forceId: 'liu-biao', cityId: 'xinye' },
  'xu-shu':      { forceId: 'liu-biao', cityId: 'xinye' }, // about to be lured to Cao Cao
  // Hermits of Longzhong — present at Xiangyang sphere
  'sima-hui':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'cui-zhouping':{ forceId: 'liu-biao', cityId: 'xiangyang' },
  'huang-chengyan':{forceId: 'liu-biao', cityId: 'xiangyang' },
  // Zhuge Liang, Pang Tong — unsearched recluses at Xiangyang/Longzhong area
  'zhuge-liang': { forceId: 'liu-biao', cityId: 'xiangyang' },
  'pang-tong':   { forceId: 'liu-biao', cityId: 'xiangyang' },

  // ── Sun Quan ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'zhou-yu':     { forceId: 'sun', cityId: 'jianye' },
  'lu-su':       { forceId: 'sun', cityId: 'jianye' },
  'cheng-pu':    { forceId: 'sun', cityId: 'jianye' },
  'huang-gai':   { forceId: 'sun', cityId: 'wu' },
  'han-dang':    { forceId: 'sun', cityId: 'yuzhang' },
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'taishi-ci':   { forceId: 'sun', cityId: 'wu' },
  'gan-ning':    { forceId: 'sun', cityId: 'jianye' }, // just defected from Huang Zu
  'lu-meng':     { forceId: 'sun', cityId: 'jianye' },
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },
  'zhang-hong':  { forceId: 'sun', cityId: 'jianye' },

  // ── Liu Zhang ──
  'liu-zhang':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'zhang-ren':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'yan-yan':     { forceId: 'liu-zhang', cityId: 'jiangzhou' },
  'wu-yi':       { forceId: 'liu-zhang', cityId: 'chengdu' },
  'fa-zheng':    { forceId: 'liu-zhang', cityId: 'chengdu' },
  'huang-quan':  { forceId: 'liu-zhang', cityId: 'chengdu' },

  // ── Zhang Lu ──
  'zhang-lu':    { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'yang-song':   { forceId: 'zhang-lu', cityId: 'hanzhong' },

  // ── Ma Teng ──
  'ma-teng':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-chao':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-dai':      { forceId: 'ma-teng', cityId: 'jincheng' },
  'han-sui':     { forceId: 'ma-teng', cityId: 'jincheng' },

  // ── Gongsun Kang (Liaodong, just inherited from father Gongsun Du) ──
  'gongsun-kang':{ forceId: 'gongsun-du', cityId: 'liaodong' },

  // ── Shi Xie ──
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },
};

const DEAD_BY_207 = [
  // 184 generation
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi',
  // Dong Zhuo crew
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong',
  'wang-yun', 'han-fu', 'bao-xin', 'yang-feng', 'han-xian',
  // Lü Bu crew
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'li-jue', 'guo-si',
  // Yuan Shao crew (defeated 202–207)
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  // Other warlords
  'sun-jian', 'sun-ce', 'tao-qian', 'kong-rong', 'gongsun-zan', 'gongsun-du',
  'yuan-shu', 'ji-ling', 'liu-yan', 'cao-bao', 'tadun',
  // Cao early casualties
  'cao-ang', 'cao-anmin', 'dian-wei', 'xi-zhicai',
];

export const SCENARIO_207_THREE_VISITS: Scenario = {
  id: 'scn-207-three-visits',
  name: { en: 'Three Visits to the Thatched Cottage', zh: '三顧茅廬' },
  description:
    'Spring 207 AD. Cao Cao has crushed the last Yuan heirs and Wuhuan at White Wolf Mountain; ' +
    'the north is his. Liu Bei, a guest of Liu Biao at Xinye, hears tell of a Sleeping Dragon in ' +
    'Longzhong. Three times he will ride out to that thatched cottage. The age of the strategists begins.',
  descriptionZh: "公元207年春。曹操北征烏桓，白狼山一戰盡掃袁氏餘孽，河北遂定。劉備寄寓新野，仰仗劉表庇護，聞隆中有臥龍之名，三顧茅廬以求賢。軍師之世，自此而開。",
  startDate: { year: 207, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_207),
  forces: FORCES_207,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_207, DEAD_BY_207, 207),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 211 AD The Battle of Weinan 渭南之戰
// Cao Cao marches west against the coalition of Ma Chao and Han Sui.
// Liu Bei has just been invited into Yi by Liu Zhang; Sun Quan holds
// Jiangdong; Zhang Lu watches from Hanzhong.
// ──────────────────────────────────────────────────────────────────────

const FORCES_211: Force[] = [
  { id: 'cao',       name: { en: 'Cao Cao',    zh: '曹操軍' }, rulerOfficerId: 'cao-cao',   capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'ma-chao',   name: { en: 'Ma Chao',    zh: '馬超軍' }, rulerOfficerId: 'ma-chao',   capitalCityId: 'wuwei',    color: '#a8703a', isPlayer: false },
  { id: 'han-sui',   name: { en: 'Han Sui',    zh: '韓遂軍' }, rulerOfficerId: 'han-sui',   capitalCityId: 'jincheng', color: '#8a503a', isPlayer: false },
  { id: 'liu-bei',   name: { en: 'Liu Bei',    zh: '劉備軍' }, rulerOfficerId: 'liu-bei',   capitalCityId: 'jiangling',color: '#a85d8a', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Quan',   zh: '孫權軍' }, rulerOfficerId: 'sun-quan',  capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',  zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang', capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',   zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6b8a6b', isPlayer: false },
  { id: 'shi-xie',   name: { en: 'Shi Xie',    zh: '士燮軍' }, rulerOfficerId: 'shi-xie',   capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
];

const CITY_OWNERSHIP_211: Record<string, string> = {
  // ── Cao Cao — the empire north of the Yangtze ──
  xuchang:   'cao',
  luoyang:   'cao',
  chenliu:   'cao',
  runan:     'cao',
  wancheng:  'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  guandu:    'cao',
  hulao:     'cao',
  ye:        'cao',
  bohai:     'cao',
  pingyuan:  'cao',
  taiyuan:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  beihai:    'cao',
  beiping:   'cao',
  liaodong:  'cao',
  changan:   'cao',
  tongguan:  'cao',
  shouchun:  'cao',
  hefei:     'cao',
  lujiang:   'cao',
  xinye:     'cao',
  xiangyang: 'cao', // from Liu Cong's surrender in 208
  linzi:     'cao',
  // ── Ma Chao coalition ──
  wuwei:     'ma-chao',
  anding:    'ma-chao',
  mei:       'ma-chao',
  // ── Han Sui (Ma Chao's nominal ally, his own base) ──
  jincheng:  'han-sui',
  wudu:      'han-sui',
  // ── Liu Bei (just took southern Jingzhou) ──
  jiangling: 'liu-bei',
  changsha:  'liu-bei',
  wuling:    'liu-bei',
  lingling:  'liu-bei',
  // ── Sun Quan — Jiangdong ──
  jianye:    'sun',
  wu:        'sun',
  yuzhang:   'sun',
  jiangxia:  'sun',
  // ── Liu Zhang — Yi province (about to invite Liu Bei in) ──
  chengdu:   'liu-zhang',
  yongan:    'liu-zhang',
  jiangzhou: 'liu-zhang',
  // ── Zhang Lu — Hanzhong ──
  hanzhong:  'zhang-lu',
  // ── Shi Xie — Jiao ──
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
};

const OFFICER_ASSIGNMENTS_211: Record<string, { forceId: string; cityId: string }> = {
  // ── Cao Cao (marching west to Tong Pass) ──
  'cao-cao':     { forceId: 'cao', cityId: 'changan' },
  'cao-pi':      { forceId: 'cao', cityId: 'xuchang' },
  'cao-ren':     { forceId: 'cao', cityId: 'xiangyang' },
  'cao-hong':    { forceId: 'cao', cityId: 'tongguan' },
  'cao-zhi':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhang':   { forceId: 'cao', cityId: 'ye' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'xuchang' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'changan' },
  'xun-yu':      { forceId: 'cao', cityId: 'xuchang' },
  'xun-you':     { forceId: 'cao', cityId: 'xuchang' },
  'jia-xu':      { forceId: 'cao', cityId: 'changan' }, // architect of the Wei-Han split
  'cheng-yu':    { forceId: 'cao', cityId: 'xuchang' },
  'sima-yi':     { forceId: 'cao', cityId: 'luoyang' },
  'xu-huang':    { forceId: 'cao', cityId: 'changan' },
  'zhang-liao':  { forceId: 'cao', cityId: 'hefei' },
  'yu-jin':      { forceId: 'cao', cityId: 'wancheng' },
  'le-jin':      { forceId: 'cao', cityId: 'hefei' },
  'li-dian':     { forceId: 'cao', cityId: 'hefei' },
  'zhang-he':    { forceId: 'cao', cityId: 'tongguan' },
  'xu-chu':      { forceId: 'cao', cityId: 'changan' }, // duels Ma Chao
  'pang-de':     { forceId: 'cao', cityId: 'wuwei' }, // initially with Ma Chao, surrenders to Cao later
  'man-chong':   { forceId: 'cao', cityId: 'shouchun' },
  'zang-ba':     { forceId: 'cao', cityId: 'pengcheng' },
  'wen-pin':     { forceId: 'cao', cityId: 'xiangyang' },

  // ── Ma Chao (the avenging son) ──
  'ma-chao':     { forceId: 'ma-chao', cityId: 'wuwei' },
  'ma-dai':      { forceId: 'ma-chao', cityId: 'anding' },
  'ma-tie':      { forceId: 'ma-chao', cityId: 'wuwei' },
  'ma-xiu':      { forceId: 'ma-chao', cityId: 'wuwei' },

  // ── Han Sui (and the ten Liang warlords) ──
  'han-sui':     { forceId: 'han-sui', cityId: 'jincheng' },
  'cheng-yi':    { forceId: 'han-sui', cityId: 'jincheng' },
  'hou-xuan':    { forceId: 'han-sui', cityId: 'jincheng' },
  'liang-xing':  { forceId: 'han-sui', cityId: 'wudu' },
  'yang-qiu':    { forceId: 'han-sui', cityId: 'wudu' },
  'ma-wan':      { forceId: 'han-sui', cityId: 'jincheng' },
  'cheng-yin':   { forceId: 'han-sui', cityId: 'jincheng' },
  'li-kan':      { forceId: 'han-sui', cityId: 'wudu' },

  // ── Liu Bei (Jingzhou seat at Jiangling) ──
  'liu-bei':     { forceId: 'liu-bei', cityId: 'jiangling' },
  'guan-yu':     { forceId: 'liu-bei', cityId: 'jiangling' },
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'jiangling' },
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'changsha' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'jiangling' },
  'pang-tong':   { forceId: 'liu-bei', cityId: 'jiangling' },
  'huang-zhong': { forceId: 'liu-bei', cityId: 'changsha' }, // just won at Changsha
  'wei-yan':     { forceId: 'liu-bei', cityId: 'changsha' },
  'mi-zhu':      { forceId: 'liu-bei', cityId: 'jiangling' },
  'sun-qian':    { forceId: 'liu-bei', cityId: 'jiangling' },
  'jian-yong':   { forceId: 'liu-bei', cityId: 'jiangling' },
  'liu-feng':    { forceId: 'liu-bei', cityId: 'wuling' },
  'guan-ping':   { forceId: 'liu-bei', cityId: 'jiangling' },
  'liu-shan':    { forceId: 'liu-bei', cityId: 'jiangling' },
  'yi-ji':       { forceId: 'liu-bei', cityId: 'jiangling' },

  // ── Sun Quan ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'zhou-yu':     { forceId: 'sun', cityId: 'jianye' }, // d. 210; if dead by year, auto handled
  'lu-su':       { forceId: 'sun', cityId: 'jianye' },
  'lu-meng':     { forceId: 'sun', cityId: 'jiangxia' },
  'cheng-pu':    { forceId: 'sun', cityId: 'jianye' },
  'huang-gai':   { forceId: 'sun', cityId: 'wu' },
  'han-dang':    { forceId: 'sun', cityId: 'yuzhang' },
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'gan-ning':    { forceId: 'sun', cityId: 'jiangxia' },
  'ling-tong':   { forceId: 'sun', cityId: 'wu' },
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },

  // ── Liu Zhang ──
  'liu-zhang':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'zhang-ren':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'yan-yan':     { forceId: 'liu-zhang', cityId: 'jiangzhou' },
  'wu-yi':       { forceId: 'liu-zhang', cityId: 'chengdu' },
  'fa-zheng':    { forceId: 'liu-zhang', cityId: 'chengdu' }, // about to defect
  'zhang-song':  { forceId: 'liu-zhang', cityId: 'chengdu' }, // about to defect
  'huang-quan':  { forceId: 'liu-zhang', cityId: 'chengdu' },
  'meng-da':     { forceId: 'liu-zhang', cityId: 'yongan' },

  // ── Zhang Lu ──
  'zhang-lu':    { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'yang-song':   { forceId: 'zhang-lu', cityId: 'hanzhong' },

  // ── Shi Xie ──
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },
};

const DEAD_BY_211 = [
  // 184 generation
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi',
  // Dong Zhuo crew
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong',
  'wang-yun', 'han-fu', 'bao-xin', 'yang-feng', 'han-xian',
  // Lü Bu crew
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'li-jue', 'guo-si',
  // Yuan crew
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'yuan-shu', 'ji-ling',
  // Other warlords
  'sun-jian', 'sun-ce', 'tao-qian', 'kong-rong', 'gongsun-zan', 'gongsun-du',
  'liu-yan', 'cao-bao', 'tadun',
  'liu-biao', 'liu-cong', // Liu Cong executed after surrender, Liu Biao d. 208
  'cai-mao', 'zhang-yun', // executed after Chibi
  'huang-zu', 'han-xuan', 'liu-du',
  // Cao early casualties
  'cao-ang', 'cao-anmin', 'dian-wei', 'xi-zhicai', 'guo-jia',
  // Other
  'kuai-liang', 'liu-qi',
];

export const SCENARIO_211_WEINAN: Scenario = {
  id: 'scn-211-weinan',
  name: { en: 'Battle of Weinan', zh: '渭南之戰' },
  description:
    'Autumn 211 AD. To avenge his father Ma Teng, Ma Chao raises the banner of vengeance with Han Sui ' +
    'and ten warlords of Liang. Cao Cao marches west to Tong Pass with Cao Ren, Xu Chu, and the ' +
    'flower of his armies. Liu Bei consolidates Jingzhou; Liu Zhang ponders inviting him into Yi.',
  descriptionZh: "公元211年秋。馬騰為曹操所害，馬超舉哀興兵，會同韓遂及涼州十路諸侯，誓報父仇。曹操親率大軍西征潼關，許褚、曹仁皆隨。劉備據荊州，劉璋方議迎之入蜀。",
  startDate: { year: 211, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_211),
  forces: FORCES_211,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_211, DEAD_BY_211, 211),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 228 AD The Battle of Jieting 街亭之戰
// Zhuge Liang's first northern expedition. Three commanderies of Wei
// defect. Sima Yi is recalled; Zhang He marches west. Ma Su will lose
// the high pass — and his head.
// ──────────────────────────────────────────────────────────────────────

const FORCES_228: Force[] = [
  { id: 'cao',     name: { en: 'Wei',     zh: '魏'    }, rulerOfficerId: 'cao-rui',   capitalCityId: 'luoyang', color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han', zh: '蜀漢'  }, rulerOfficerId: 'liu-shan',  capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',      zh: '吳'    }, rulerOfficerId: 'sun-quan',  capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
  { id: 'xianbei', name: { en: 'Xianbei', zh: '鮮卑'  }, rulerOfficerId: 'kebi-neng', capitalCityId: 'wuhuan',  color: '#7a5a3a', isPlayer: false },
];

const CITY_OWNERSHIP_228: Record<string, string> = {
  // Wei holds the entire north
  luoyang:   'cao',
  xuchang:   'cao',
  changan:   'cao',
  ye:        'cao',
  chenliu:   'cao',
  wancheng:  'cao',
  runan:     'cao',
  xinye:     'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  shouchun:  'cao',
  hefei:     'cao',
  pingyuan:  'cao',
  taiyuan:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  beiping:   'cao',
  bohai:     'cao',
  beihai:    'cao',
  liaodong:  'cao',
  wuwei:     'cao',
  jincheng:  'cao',
  anding:    'cao',
  mei:       'cao',
  xiangyang: 'cao',
  tongguan:  'cao',
  hulao:     'cao',
  guandu:    'cao',
  linzi:     'cao',
  // Shu — Yi + Hanzhong (the spearhead)
  chengdu:   'liu-bei',
  yongan:    'liu-bei',
  jiangzhou: 'liu-bei',
  hanzhong:  'liu-bei',
  wudu:      'liu-bei', // contested borderland
  // Wu — Jiangdong + Jingzhou south
  jianye:    'sun',
  wu:        'sun',
  yuzhang:   'sun',
  changsha:  'sun',
  jiangling: 'sun',
  jiangxia:  'sun',
  wuling:    'sun',
  lingling:  'sun',
  // Xianbei
  wuhuan:    'xianbei',
};

const OFFICER_ASSIGNMENTS_228: Record<string, { forceId: string; cityId: string }> = {
  // ── Wei (Cao Rui's court; Sima Yi recalled to face Zhuge Liang) ──
  'cao-rui':     { forceId: 'cao', cityId: 'luoyang' },
  'cao-zhen':    { forceId: 'cao', cityId: 'changan' }, // initial commander of the western front
  'cao-xiu':     { forceId: 'cao', cityId: 'shouchun' }, // dies later 228 at Shiting
  'cao-shuang':  { forceId: 'cao', cityId: 'luoyang' },
  'sima-yi':     { forceId: 'cao', cityId: 'wancheng' }, // recalled from Wancheng
  'sima-shi':    { forceId: 'cao', cityId: 'luoyang' },
  'sima-zhao':   { forceId: 'cao', cityId: 'luoyang' },
  'xiahou-mao':  { forceId: 'cao', cityId: 'changan' }, // disgraced in this campaign
  'xiahou-ba':   { forceId: 'cao', cityId: 'changan' },
  'zhang-he':    { forceId: 'cao', cityId: 'changan' }, // wins Jieting
  'guo-huai':    { forceId: 'cao', cityId: 'changan' },
  'sun-li':      { forceId: 'cao', cityId: 'tongguan' },
  'hao-zhao':    { forceId: 'cao', cityId: 'mei' }, // will hold Chencang
  'wang-shuang': { forceId: 'cao', cityId: 'changan' },
  'man-chong':   { forceId: 'cao', cityId: 'shouchun' },
  'wang-ling':   { forceId: 'cao', cityId: 'shouchun' },
  'jia-kui':     { forceId: 'cao', cityId: 'xiangyang' },
  'tian-yu':     { forceId: 'cao', cityId: 'beiping' },
  'qin-lang':    { forceId: 'cao', cityId: 'luoyang' },
  'yang-fu':     { forceId: 'cao', cityId: 'jincheng' },
  'chen-qun':    { forceId: 'cao', cityId: 'luoyang' },
  'chen-tai':    { forceId: 'cao', cityId: 'changan' },
  'liu-ye':      { forceId: 'cao', cityId: 'luoyang' },
  'zhong-yao':   { forceId: 'cao', cityId: 'luoyang' },
  'hua-xin':     { forceId: 'cao', cityId: 'luoyang' },
  'wang-lang':   { forceId: 'cao', cityId: 'luoyang' }, // dies in 228 historically — debated by Zhuge Liang
  'cai-wenji':   { forceId: 'cao', cityId: 'xuchang' },

  // ── Shu (Zhuge Liang's expedition) ──
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'hanzhong' }, // at the front
  'ma-su':       { forceId: 'liu-bei', cityId: 'hanzhong' }, // marches to Jieting
  'wang-ping':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wei-yan':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'hanzhong' }, // last campaign — dies 229
  'ma-dai':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'jiang-wan':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'fei-yi':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'dong-yun':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'guan-xing':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'zhang-bao':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'liao-hua':    { forceId: 'liu-bei', cityId: 'hanzhong' },
  'zhang-yi':    { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'ma-zhong':    { forceId: 'liu-bei', cityId: 'yongan' },
  'huo-yi':      { forceId: 'liu-bei', cityId: 'yongan' },
  'li-yan':      { forceId: 'liu-bei', cityId: 'yongan' },
  'yang-yi':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'deng-zhi':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'wu-yi':       { forceId: 'liu-bei', cityId: 'chengdu' },
  'wu-ban':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'jiang-wei':   { forceId: 'liu-bei', cityId: 'hanzhong' }, // defected during this very campaign

  // ── Wu ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'lu-xun':      { forceId: 'sun', cityId: 'jiangling' }, // about to win Shiting
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'zhu-ran':     { forceId: 'sun', cityId: 'jiangling' },
  'zhu-huan':    { forceId: 'sun', cityId: 'yuzhang' },
  'pan-zhang':   { forceId: 'sun', cityId: 'wuling' },
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },
  'xu-sheng-wu': { forceId: 'sun', cityId: 'jianye' },
  'gu-yong':     { forceId: 'sun', cityId: 'jianye' },
  'bu-zhi':      { forceId: 'sun', cityId: 'wuxi' },
  'lu-dai':      { forceId: 'sun', cityId: 'yuzhang' },
  'quan-cong':   { forceId: 'sun', cityId: 'jianye' },
  'sun-deng':    { forceId: 'sun', cityId: 'jianye' },
  'han-dang':    { forceId: 'sun', cityId: 'wu' },
  'zhou-fang':   { forceId: 'sun', cityId: 'yuzhang' },

  // ── Xianbei ──
  'kebi-neng':   { forceId: 'xianbei', cityId: 'wuhuan' },
  'budugen':     { forceId: 'xianbei', cityId: 'wuhuan' },
};

const DEAD_BY_228 = [
  // 184 generation
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi',
  // Dong Zhuo crew
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong',
  'wang-yun', 'han-fu', 'bao-xin', 'yang-feng', 'han-xian',
  // Lü Bu crew
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'li-jue', 'guo-si',
  'diaochan',
  // Yuan
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'yuan-shu', 'ji-ling',
  // Other warlords
  'sun-jian', 'sun-ce', 'tao-qian', 'kong-rong', 'gongsun-zan', 'gongsun-du', 'gongsun-kang',
  'liu-yan', 'cao-bao', 'tadun',
  'liu-biao', 'liu-cong', 'liu-qi', 'cai-mao', 'zhang-yun', 'huang-zu', 'han-xuan', 'liu-du',
  // The Liang warlords
  'ma-teng', 'ma-tie', 'ma-xiu', 'han-sui', 'cheng-yi', 'hou-xuan', 'liang-xing', 'yang-qiu',
  'ma-wan', 'cheng-yin', 'li-kan',
  // Cao crew d. before 228
  'cao-cao', 'cao-pi', // Cao Pi d. 226
  'cao-ang', 'cao-anmin', 'dian-wei', 'xi-zhicai', 'guo-jia', 'xun-yu', 'xun-you', 'cheng-yu',
  'xiahou-dun', 'xiahou-yuan', 'xiahou-shang', 'cao-chun', 'cao-ren', 'cao-hong',
  'zhang-liao', 'xu-huang', 'yu-jin', 'le-jin', 'li-dian', 'xu-chu', 'pang-de', 'cao-zhang',
  'zang-ba', 'wen-pin', 'jia-xu', 'jia-kui',
  // Liu Bei crew
  'liu-bei', 'guan-yu', 'zhang-fei', 'huang-zhong', 'fa-zheng', 'pang-tong',
  'mi-zhu', 'mi-fang', 'sun-qian', 'jian-yong', 'liu-feng', 'guan-ping',
  'ma-liang', 'liu-ba', 'shamoke',
  'ma-chao', 'ma-tie', 'ma-xiu',
  // Wu d. before 228
  'zhou-yu', 'lu-su', 'lu-meng', 'taishi-ci', 'cheng-pu', 'huang-gai', 'zhou-tai',
  'gan-ning', 'ling-tong', 'jiang-qin', 'sun-yi', 'sun-kuang', 'lady-sun', 'zhang-zhao',
  'zhang-hong', 'sun-shao',
  // Misc
  'shi-xie', // d. 226
  'liu-zhang', 'zhang-ren', 'zhang-song', 'meng-da', // Meng Da d. 228 — keep alive in this scenario actually
  'zhang-lu', 'yang-song',
  'sima-lang',
];

export const SCENARIO_228_JIETING: Scenario = {
  id: 'scn-228-jieting',
  name: { en: 'Battle of Jieting', zh: '街亭之戰' },
  description:
    'Spring 228 AD. Zhuge Liang issues the Chu Shi Biao and marches out of Hanzhong on his first ' +
    'northern expedition. Three Wei commanderies defect; the Wei court is shaken. Cao Rui dispatches ' +
    'Zhang He west and recalls Sima Yi. At Jieting, Ma Su will abandon the road for the heights.',
  descriptionZh: "公元228年春。諸葛亮上《出師表》，自漢中起兵北伐，揮師中原。南安、天水、安定三郡降蜀，魏廷震動。魏明帝曹叡命張郃西進，復召司馬懿出鎮。馬謖違亮節度，舍水上山——街亭之失，自此注定。",
  startDate: { year: 228, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_228),
  forces: FORCES_228,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_228, DEAD_BY_228, 228),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 263 AD The Conquest of Shu 滅蜀之役
// Sima Zhao launches a three-pronged invasion. Deng Ai will sneak
// through Yinping; Zhong Hui will pin Jiang Wei at Jiange. Wu under
// Sun Xiu watches from afar. The Shu dynasty has months to live.
// ──────────────────────────────────────────────────────────────────────

const FORCES_263: Force[] = [
  { id: 'cao',     name: { en: 'Wei',     zh: '魏'   }, rulerOfficerId: 'sima-zhao', capitalCityId: 'luoyang', color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han', zh: '蜀漢' }, rulerOfficerId: 'liu-shan',  capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',      zh: '吳'   }, rulerOfficerId: 'sun-xiu',   capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
];

const CITY_OWNERSHIP_263: Record<string, string> = {
  // Wei (under Sima clan) — the entire north and centre
  luoyang:   'cao',
  xuchang:   'cao',
  changan:   'cao',
  ye:        'cao',
  chenliu:   'cao',
  wancheng:  'cao',
  runan:     'cao',
  xinye:     'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  shouchun:  'cao',
  hefei:     'cao',
  pingyuan:  'cao',
  taiyuan:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  beiping:   'cao',
  bohai:     'cao',
  beihai:    'cao',
  liaodong:  'cao', // Sima Yi crushed Gongsun Yuan 238
  wuwei:     'cao',
  jincheng:  'cao',
  anding:    'cao',
  mei:       'cao',
  xiangyang: 'cao',
  tongguan:  'cao',
  hulao:     'cao',
  guandu:    'cao',
  linzi:     'cao',
  wudu:      'cao',
  // Shu Han — Yi + Hanzhong (about to lose Hanzhong)
  chengdu:   'liu-bei',
  yongan:    'liu-bei',
  jiangzhou: 'liu-bei',
  hanzhong:  'liu-bei', // Wei will take it this campaign
  // Wu — Jiangdong + Jing-south
  jianye:    'sun',
  wu:        'sun',
  yuzhang:   'sun',
  changsha:  'sun',
  jiangling: 'sun',
  jiangxia:  'sun',
  wuling:    'sun',
  lingling:  'sun',
};

const OFFICER_ASSIGNMENTS_263: Record<string, { forceId: string; cityId: string }> = {
  // ── Wei (Sima Zhao the Duke of Jin in all but name) ──
  'sima-zhao':   { forceId: 'cao', cityId: 'luoyang' },
  'sima-yan':    { forceId: 'cao', cityId: 'luoyang' }, // future Jin emperor
  'sima-you':    { forceId: 'cao', cityId: 'luoyang' },
  'sima-fu':     { forceId: 'cao', cityId: 'luoyang' },
  'sima-wang':   { forceId: 'cao', cityId: 'changan' },
  'cao-huan':    { forceId: 'cao', cityId: 'luoyang' }, // puppet emperor
  'jia-chong':   { forceId: 'cao', cityId: 'luoyang' },
  'wang-yuanji': { forceId: 'cao', cityId: 'luoyang' },
  'wang-su':     { forceId: 'cao', cityId: 'luoyang' },
  // The campaign — three columns
  'deng-ai':     { forceId: 'cao', cityId: 'jincheng' }, // sneaks through Yinping
  'zhong-hui':   { forceId: 'cao', cityId: 'changan' }, // marches on Jiange
  'zhuge-xu-wei':{ forceId: 'cao', cityId: 'wudu' }, // pincer column
  'wang-jun':    { forceId: 'cao', cityId: 'xiangyang' }, // future destroyer of Wu
  'du-yu':       { forceId: 'cao', cityId: 'xiangyang' },
  'yang-hu':     { forceId: 'cao', cityId: 'xiangyang' },
  'hu-zhi':      { forceId: 'cao', cityId: 'pingyuan' },
  'hu-fen':      { forceId: 'cao', cityId: 'changan' },
  'hu-lie':      { forceId: 'cao', cityId: 'changan' },
  'chen-tai':    { forceId: 'cao', cityId: 'changan' }, // d. 256 historically
  'wang-jing':   { forceId: 'cao', cityId: 'tongguan' },
  'jiang-shu':   { forceId: 'cao', cityId: 'jincheng' }, // turncoat from Shu
  // Garrison commanders
  'wang-ling':   { forceId: 'cao', cityId: 'shouchun' }, // d. 251 — auto-dead
  'guanqiu-jian':{ forceId: 'cao', cityId: 'shouchun' }, // d. 255 — auto-dead
  'zhuge-dan':   { forceId: 'cao', cityId: 'shouchun' }, // d. 258 — auto-dead

  // ── Shu Han — its final months ──
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-chen':    { forceId: 'liu-bei', cityId: 'chengdu' }, // commits suicide rather than surrender
  'huang-hao':   { forceId: 'liu-bei', cityId: 'chengdu' }, // the eunuch
  'jiang-wei':   { forceId: 'liu-bei', cityId: 'hanzhong' }, // holds Jiange
  'liao-hua':    { forceId: 'liu-bei', cityId: 'hanzhong' },
  'zhang-yi':    { forceId: 'liu-bei', cityId: 'hanzhong' },
  'zhuge-zhan':  { forceId: 'liu-bei', cityId: 'chengdu' }, // dies at Mianzhu
  'zhuge-shang': { forceId: 'liu-bei', cityId: 'chengdu' }, // dies at Mianzhu
  'fu-qian':     { forceId: 'liu-bei', cityId: 'hanzhong' }, // dies defending Yangping
  'huo-yi':      { forceId: 'liu-bei', cityId: 'yongan' },
  'luo-xian':    { forceId: 'liu-bei', cityId: 'yongan' },
  'zhao-guang':  { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhao-tong':   { forceId: 'liu-bei', cityId: 'chengdu' },

  // ── Wu (Sun Xiu, fourth emperor) ──
  'sun-xiu':     { forceId: 'sun', cityId: 'jianye' },
  'sun-hao':     { forceId: 'sun', cityId: 'jianye' }, // next emperor
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },
  'lu-kang':     { forceId: 'sun', cityId: 'jiangling' }, // Lu Xun's son
  'lu-dai':      { forceId: 'sun', cityId: 'yuzhang' }, // d. 256 actually
  'bu-chan':     { forceId: 'sun', cityId: 'wu' },
  'bu-xie':      { forceId: 'sun', cityId: 'wu' },
  'bu-ji':       { forceId: 'sun', cityId: 'wuxi' },
  'sun-deng':    { forceId: 'sun', cityId: 'jianye' }, // d. 241 — auto-dead
  'zhuge-ke':    { forceId: 'sun', cityId: 'jianye' }, // d. 253 — auto-dead
  'zhu-yi-wu':   { forceId: 'sun', cityId: 'jianye' },
  'sun-lin':     { forceId: 'sun', cityId: 'jianye' },
  'sun-jun':     { forceId: 'sun', cityId: 'jianye' }, // d. 256 — auto-dead
};

const DEAD_BY_263: string[] = [
  // 184 generation
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi',
  // Dong Zhuo crew
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong',
  'wang-yun', 'han-fu', 'bao-xin', 'yang-feng', 'han-xian',
  // Lü Bu crew
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'li-jue', 'guo-si',
  'diaochan',
  // Yuan
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'yuan-shu', 'ji-ling',
  // Other early warlords
  'sun-jian', 'sun-ce', 'tao-qian', 'kong-rong', 'gongsun-zan', 'gongsun-du', 'gongsun-kang', 'gongsun-yuan',
  'liu-yan', 'cao-bao', 'tadun',
  'liu-biao', 'liu-cong', 'liu-qi', 'cai-mao', 'zhang-yun', 'huang-zu', 'han-xuan', 'liu-du',
  // Liang
  'ma-teng', 'ma-chao', 'ma-tie', 'ma-xiu', 'han-sui', 'cheng-yi', 'hou-xuan', 'liang-xing',
  'yang-qiu', 'ma-wan', 'cheng-yin', 'li-kan',
  // Wei crew d. before 263
  'cao-cao', 'cao-pi', 'cao-rui', 'cao-fang', 'cao-mao', // emperors before Cao Huan
  'cao-ang', 'cao-anmin', 'cao-zhang', 'cao-zhi', 'cao-zhen', 'cao-xiu', 'cao-chun',
  'cao-ren', 'cao-hong', 'cao-shuang', 'cao-yu',
  'xiahou-dun', 'xiahou-yuan', 'xiahou-shang', 'xiahou-ba', 'xiahou-mao',
  'dian-wei', 'xi-zhicai', 'guo-jia', 'xun-yu', 'xun-you', 'cheng-yu',
  'zhang-liao', 'xu-huang', 'yu-jin', 'le-jin', 'li-dian', 'xu-chu', 'pang-de',
  'zang-ba', 'wen-pin', 'jia-xu', 'jia-kui', 'hao-zhao', 'wang-shuang', 'sun-li',
  'man-chong', 'tian-yu', 'qin-lang', 'yang-fu', 'guo-huai',
  'sima-yi', 'sima-shi', 'sima-lang', // Sima Yi d. 251, Shi d. 255, Lang earlier
  'chen-qun', 'chen-jiao', 'liu-ye', 'zhong-yao', 'hua-xin', 'wang-lang', 'cai-wenji',
  'liu-fang', 'sun-zi',
  // Shu crew d. before 263
  'liu-bei', 'guan-yu', 'zhang-fei', 'zhao-yun', 'huang-zhong', 'fa-zheng', 'pang-tong',
  'zhuge-liang', 'ma-su', 'wei-yan', 'wang-ping', 'ma-dai', 'ma-zhong',
  'mi-zhu', 'mi-fang', 'sun-qian', 'jian-yong', 'liu-feng', 'guan-ping', 'guan-xing', 'zhang-bao',
  'ma-liang', 'liu-ba', 'shamoke',
  'jiang-wan', 'fei-yi', 'dong-yun', 'deng-zhi', 'yang-yi', 'li-yan',
  'wu-yi', 'wu-ban', 'yan-yan', 'huang-quan', 'meng-da',
  'liu-yong', 'liu-li',
  // Wu crew d. before 263
  'sun-quan', 'sun-liang', 'sun-deng', 'sun-shao', 'sun-yi', 'sun-kuang', 'lady-sun',
  'zhou-yu', 'lu-su', 'lu-meng', 'lu-xun', 'taishi-ci', 'cheng-pu', 'huang-gai', 'zhou-tai', 'han-dang',
  'gan-ning', 'ling-tong', 'jiang-qin', 'pan-zhang', 'zhu-ran', 'zhu-huan',
  'xu-sheng-wu', 'zhang-zhao', 'zhang-hong', 'gu-yong', 'bu-zhi', 'he-qi', 'quan-cong',
  'pan-jun', 'yu-fan', 'zhuge-jin', 'zhou-fang',
  'zhuge-ke', // d. 253
  // Misc
  'shi-xie',
  'liu-zhang', 'zhang-ren', 'zhang-song',
  'zhang-lu', 'yang-song',
  'kebi-neng', 'budugen',
  // Wei mid-era
  'wang-ling', 'guanqiu-jian', 'zhuge-dan',
];

export const SCENARIO_263_SHU_FALL: Scenario = {
  id: 'scn-263-shu-fall',
  name: { en: 'The Conquest of Shu', zh: '滅蜀之役' },
  description:
    'Autumn 263 AD. Sima Zhao, Duke of Jin in all but name, launches a three-column invasion of Shu Han. ' +
    'Zhong Hui marches on Hanzhong with the main army; Deng Ai will steal through the unguarded ' +
    'Yinping path; Zhuge Xu pins Jiang Wei. In Chengdu, Liu Shan listens to the eunuch Huang Hao. ' +
    'Wu under Sun Xiu watches from afar, knowing its own hour is near.',
  descriptionZh: "公元263年秋。司馬昭實為晉公，挾魏帝以伐蜀。鍾會率主力出斜谷直指漢中；鄧艾偷渡陰平小道；諸葛緒牽制姜維於沓中。成都之內，後主劉禪沉湎黃皓之言。吳主孫休隔江坐觀，深知唇亡齒寒之理。",
  startDate: { year: 263, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_263),
  forces: FORCES_263,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_263, DEAD_BY_263, 263),
};



// ──────────────────────────────────────────────────────────────────────
// Scenario — 189 AD The Ten Attendants 十常侍之亂
// He Jin summons outside warlords against the eunuchs; the Ten murder
// him in the palace, Yuan Shao slaughters them in retaliation, and Dong
// Zhuo enters Luoyang to seize the puppet emperor. The Han collapses.
// ──────────────────────────────────────────────────────────────────────

const FORCES_189: Force[] = [
  { id: 'han',         name: { en: 'He Jin (Regent)', zh: '何進'     }, rulerOfficerId: 'he-jin',      capitalCityId: 'luoyang',  color: '#d4a84a', isPlayer: false },
  { id: 'eunuchs',     name: { en: 'Ten Attendants',  zh: '十常侍'   }, rulerOfficerId: 'zhang-rang',  capitalCityId: 'hulao',    color: '#6b3a6b', isPlayer: false },
  { id: 'dong',        name: { en: 'Dong Zhuo',       zh: '董卓軍'   }, rulerOfficerId: 'dong-zhuo',   capitalCityId: 'changan',  color: '#6b4a8a', isPlayer: false },
  { id: 'cao',         name: { en: 'Cao Cao',         zh: '曹操'     }, rulerOfficerId: 'cao-cao',     capitalCityId: 'chenliu',  color: '#3a7dd9', isPlayer: false },
  { id: 'yuan-shao',   name: { en: 'Yuan Shao',       zh: '袁紹'     }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'bohai',    color: '#b8442e', isPlayer: false },
  { id: 'sun',         name: { en: 'Sun Jian',        zh: '孫堅軍'   }, rulerOfficerId: 'sun-jian',    capitalCityId: 'changsha', color: '#2f8e6f', isPlayer: false },
  { id: 'liu-biao',    name: { en: 'Liu Biao',        zh: '劉表軍'   }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#c19a3b', isPlayer: false },
  { id: 'liu-yan',     name: { en: 'Liu Yan',         zh: '劉焉軍'   }, rulerOfficerId: 'liu-yan',     capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
];

const CITY_OWNERSHIP_189: Record<string, string> = {
  // ── He Jin / Han court — Luoyang itself ──
  luoyang:   'han',
  xuchang:   'han',
  runan:     'han',
  // ── Ten Attendants — the palace fortress and the route east ──
  hulao:     'eunuchs',
  guandu:    'eunuchs',
  // ── Dong Zhuo — marching east from Liang ──
  changan:   'dong',
  wuwei:     'dong',
  jincheng:  'dong',
  anding:    'dong',
  mei:       'dong',
  tongguan:  'dong',
  // ── Cao Cao — raising volunteers at Chenliu ──
  chenliu:   'cao',
  pengcheng: 'cao',
  // ── Yuan Shao — General of the Household ──
  bohai:     'yuan-shao',
  ye:        'yuan-shao',
  taiyuan:   'yuan-shao',
  shangdang: 'yuan-shao',
  pingyuan:  'yuan-shao',
  // ── Sun Jian — Grand Administrator of Changsha ──
  changsha:  'sun',
  // ── Liu Biao — newly appointed to Jing ──
  xiangyang: 'liu-biao',
  jiangxia:  'liu-biao',
  jiangling: 'liu-biao',
  wancheng:  'liu-biao',
  xinye:     'liu-biao',
  // ── Liu Yan — withdrawn to Yi ──
  chengdu:   'liu-yan',
  yongan:    'liu-yan',
  jiangzhou: 'liu-yan',
  // Neutrals: beiping (Liu Yu / Gongsun Zan), beihai (Kong Rong), xiapi (Tao Qian),
  //           liaodong, yanmen, jianye, wu, jiaozhi, hanzhong, etc.
};

const OFFICER_ASSIGNMENTS_189: Record<string, { forceId: string; cityId: string }> = {
  // ── He Jin (still alive at start; the eunuchs will murder him) ──
  'he-jin':      { forceId: 'han',     cityId: 'luoyang' },
  'he-miao':     { forceId: 'han',     cityId: 'luoyang' },
  'liu-bian':    { forceId: 'han',     cityId: 'luoyang' }, // Young Emperor Shao
  'liu-xie':     { forceId: 'han',     cityId: 'luoyang' }, // Prince of Chenliu — soon Emperor Xian
  'lu-zhi':      { forceId: 'han',     cityId: 'luoyang' },
  'huangfu-song':{ forceId: 'han',     cityId: 'changan' },
  'zhu-jun':     { forceId: 'han',     cityId: 'runan' },
  'wang-yun':    { forceId: 'han',     cityId: 'luoyang' },
  'yang-biao':   { forceId: 'han',     cityId: 'luoyang' },
  'fu-wan':      { forceId: 'han',     cityId: 'luoyang' },
  'cai-yong':    { forceId: 'han',     cityId: 'luoyang' },

  // ── The Ten Attendants ──
  'zhang-rang':  { forceId: 'eunuchs', cityId: 'hulao' },
  'jian-shuo':   { forceId: 'eunuchs', cityId: 'hulao' },

  // ── Dong Zhuo (marching from Liang at He Jin's summons) ──
  'dong-zhuo':   { forceId: 'dong',    cityId: 'changan' },
  'li-ru':       { forceId: 'dong',    cityId: 'changan' },
  'lu-bu':       { forceId: 'dong',    cityId: 'changan' }, // still serving Ding Yuan historically — placed with Dong for playability
  'li-jue':      { forceId: 'dong',    cityId: 'mei' },
  'guo-si':      { forceId: 'dong',    cityId: 'mei' },
  'fan-chou':    { forceId: 'dong',    cityId: 'tongguan' },
  'zhang-ji':    { forceId: 'dong',    cityId: 'wuwei' },
  'hua-xiong':   { forceId: 'dong',    cityId: 'tongguan' },
  'xu-rong':     { forceId: 'dong',    cityId: 'changan' },
  'niu-fu':      { forceId: 'dong',    cityId: 'anding' },

  // ── Cao Cao (Han colonel raising volunteers) ──
  'cao-cao':     { forceId: 'cao',     cityId: 'chenliu' },
  'cao-ren':     { forceId: 'cao',     cityId: 'chenliu' },
  'cao-hong':    { forceId: 'cao',     cityId: 'chenliu' },
  'xiahou-dun':  { forceId: 'cao',     cityId: 'chenliu' },
  'xiahou-yuan': { forceId: 'cao',     cityId: 'chenliu' },

  // ── Yuan Shao (Han General; will lead the coalition next year) ──
  'yuan-shao':   { forceId: 'yuan-shao', cityId: 'bohai' },
  'yuan-shu':    { forceId: 'yuan-shao', cityId: 'ye' }, // brothers cooperating briefly
  'yan-liang':   { forceId: 'yuan-shao', cityId: 'ye' },
  'wen-chou':    { forceId: 'yuan-shao', cityId: 'ye' },
  'han-fu':      { forceId: 'yuan-shao', cityId: 'ye' }, // governor of Ji at this moment
  'qiao-mao':    { forceId: 'yuan-shao', cityId: 'pingyuan' },
  'zhang-miao':  { forceId: 'yuan-shao', cityId: 'shangdang' },
  'zhang-chao':  { forceId: 'yuan-shao', cityId: 'shangdang' },
  'wang-kuang':  { forceId: 'yuan-shao', cityId: 'taiyuan' },
  'bao-xin':     { forceId: 'yuan-shao', cityId: 'pingyuan' },

  // ── Sun Jian (Changsha) ──
  'sun-jian':    { forceId: 'sun', cityId: 'changsha' },
  'sun-ce':      { forceId: 'sun', cityId: 'changsha' },

  // ── Liu Biao (newly arrived in Jing) ──
  'liu-biao':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-liang':  { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-yue':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'cai-mao':     { forceId: 'liu-biao', cityId: 'xiangyang' },
  'huang-zu':    { forceId: 'liu-biao', cityId: 'jiangxia' },

  // ── Liu Yan (Yi) ──
  'liu-yan':     { forceId: 'liu-yan', cityId: 'chengdu' },
  'zhang-ren':   { forceId: 'liu-yan', cityId: 'chengdu' },
  'yan-yan':     { forceId: 'liu-yan', cityId: 'jiangzhou' },
};

const DEAD_BY_189: string[] = [
  // The 184 generation of Yellow Turban leaders has been crushed five years prior.
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
];

export const SCENARIO_189_EUNUCHS: Scenario = {
  id: 'scn-189-eunuchs',
  name: { en: 'The Ten Attendants', zh: '十常侍之亂' },
  description:
    'Autumn 189 AD. Emperor Ling is dead. General-in-Chief He Jin, regent for the boy emperor Shao, ' +
    'plots with Yuan Shao to summon Dong Zhuo and exterminate the eunuch faction. The Ten Attendants ' +
    'lure He Jin into the palace and behead him. Yuan Shao storms the gates, sword in hand. By the ' +
    'time Dong Zhuo\'s army reaches Luoyang, the boy emperor is in his grasp — and the Han is doomed.',
  descriptionZh: "公元189年秋。靈帝駕崩，大將軍何進攝政，與袁紹密謀召董卓進京誅除宦官。十常侍先發制人，於宮中斬何進首級。袁紹引兵入宮，盡誅宦黨。董卓抵洛陽，少帝已落其手——四百年漢室，自此名存實亡。",
  startDate: { year: 189, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_189),
  forces: FORCES_189,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_189, DEAD_BY_189, 189),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 194 AD Lord of Xu 徐州牧
// Cao Cao avenges his slain father by sacking Xu province; Tao Qian
// summons Liu Bei from Beihai and names him successor. Lü Bu attacks
// Cao's home base of Yan. Yuan Shao consolidates Hebei. Sun Ce remains
// caged under Yuan Shu in Huainan.
// ──────────────────────────────────────────────────────────────────────

const FORCES_194: Force[] = [
  { id: 'cao',         name: { en: 'Cao Cao',     zh: '曹操軍'   }, rulerOfficerId: 'cao-cao',     capitalCityId: 'puyang',   color: '#3a7dd9', isPlayer: false },
  { id: 'tao',         name: { en: 'Tao Qian',    zh: '陶謙軍'   }, rulerOfficerId: 'tao-qian',    capitalCityId: 'xiapi',    color: '#8a8a3a', isPlayer: false },
  { id: 'lubu',        name: { en: 'Lü Bu',       zh: '呂布軍'   }, rulerOfficerId: 'lu-bu',       capitalCityId: 'puyang',   color: '#9b3a3a', isPlayer: false },
  { id: 'yuan-shao',   name: { en: 'Yuan Shao',   zh: '袁紹軍'   }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'ye',       color: '#b8442e', isPlayer: false },
  { id: 'yuan-shu',    name: { en: 'Yuan Shu',    zh: '袁術軍'   }, rulerOfficerId: 'yuan-shu',    capitalCityId: 'shouchun', color: '#a85d8a', isPlayer: false },
  { id: 'gongsun',     name: { en: 'Gongsun Zan', zh: '公孫瓚軍' }, rulerOfficerId: 'gongsun-zan', capitalCityId: 'beiping',  color: '#5a9bb8', isPlayer: false },
  { id: 'liu-biao',    name: { en: 'Liu Biao',    zh: '劉表軍'   }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#c19a3b', isPlayer: false },
  { id: 'liu-yan',     name: { en: 'Liu Yan',     zh: '劉焉軍'   }, rulerOfficerId: 'liu-yan',     capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
  { id: 'kong-rong',   name: { en: 'Kong Rong',   zh: '孔融軍'   }, rulerOfficerId: 'kong-rong',   capitalCityId: 'beihai',   color: '#d97a3a', isPlayer: false },
  { id: 'ma-teng',     name: { en: 'Ma Teng',     zh: '馬騰軍'   }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#a8703a', isPlayer: false },
];

const CITY_OWNERSHIP_194: Record<string, string> = {
  // ── Cao Cao — Yan province (home base, but Lü Bu is overrunning it) ──
  chenliu:   'cao',
  xuchang:   'cao',
  runan:     'cao',
  // puyang held by Lü Bu in this scenario — Cao must retake it
  // ── Lü Bu — invaded Yan with Chen Gong's help ──
  puyang:    'lubu',
  // ── Tao Qian — Xu province under siege (Cao Cao's punitive march) ──
  xiapi:     'tao',
  pengcheng: 'tao',
  xiaopei:   'tao',
  // ── Yuan Shao — Hebei consolidating ──
  ye:        'yuan-shao',
  taiyuan:   'yuan-shao',
  shangdang: 'yuan-shao',
  yanmen:    'yuan-shao',
  // ── Yuan Shu — Huainan with the captive Sun family ──
  shouchun:  'yuan-shu',
  wancheng:  'yuan-shu',
  lujiang:   'yuan-shu',
  hefei:     'yuan-shu',
  // ── Gongsun Zan — Youzhou ──
  beiping:   'gongsun',
  liaodong:  'gongsun',
  pingyuan:  'gongsun',
  bohai:     'gongsun',
  // ── Liu Biao — Jing ──
  xiangyang: 'liu-biao',
  jiangxia:  'liu-biao',
  jiangling: 'liu-biao',
  changsha:  'liu-biao',
  wuling:    'liu-biao',
  lingling:  'liu-biao',
  xinye:     'liu-biao',
  // ── Liu Yan — Yi (dying this very year) ──
  chengdu:   'liu-yan',
  yongan:    'liu-yan',
  jiangzhou: 'liu-yan',
  hanzhong:  'liu-yan', // nominally still subordinate (Zhang Lu)
  // ── Kong Rong — Beihai (besieged by Yellow Turban remnants) ──
  beihai:    'kong-rong',
  // ── Ma Teng / Han Sui — Liang ──
  wuwei:     'ma-teng',
  jincheng:  'ma-teng',
  anding:    'ma-teng',
  // ── Li Jue / Guo Si still hold Chang'an in name but ungoverned;
  //     keep changan, mei, tongguan, luoyang as neutral ruins
};

const OFFICER_ASSIGNMENTS_194: Record<string, { forceId: string; cityId: string }> = {
  // ── Cao Cao (marching into Xu after father's murder) ──
  'cao-cao':     { forceId: 'cao', cityId: 'chenliu' },
  'cao-ren':     { forceId: 'cao', cityId: 'chenliu' },
  'cao-hong':    { forceId: 'cao', cityId: 'chenliu' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'chenliu' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'chenliu' },
  'yu-jin':      { forceId: 'cao', cityId: 'chenliu' },
  'le-jin':      { forceId: 'cao', cityId: 'chenliu' },
  'dian-wei':    { forceId: 'cao', cityId: 'chenliu' },
  'xun-yu':      { forceId: 'cao', cityId: 'chenliu' },
  'xun-you':     { forceId: 'cao', cityId: 'xuchang' },
  'cheng-yu':    { forceId: 'cao', cityId: 'xuchang' },
  'guo-jia':     { forceId: 'cao', cityId: 'chenliu' }, // newly recruited
  'cao-ang':     { forceId: 'cao', cityId: 'chenliu' },
  'cao-pi':      { forceId: 'cao', cityId: 'chenliu' },

  // ── Tao Qian (failing, dying — Liu Bei marches from Beihai) ──
  'tao-qian':    { forceId: 'tao', cityId: 'xiapi' },
  'tao-shang':   { forceId: 'tao', cityId: 'pengcheng' },
  'tao-ying':    { forceId: 'tao', cityId: 'xiapi' },
  'cao-bao':     { forceId: 'tao', cityId: 'xiapi' },
  'chen-deng':   { forceId: 'tao', cityId: 'xiapi' },
  'chen-gui':    { forceId: 'tao', cityId: 'pengcheng' },
  // Liu Bei marching to relieve Xu (en route from Beihai → Xiaopei)
  'liu-bei':     { forceId: 'tao', cityId: 'xiaopei' },
  'guan-yu':     { forceId: 'tao', cityId: 'xiaopei' },
  'zhang-fei':   { forceId: 'tao', cityId: 'xiaopei' },
  'mi-zhu':      { forceId: 'tao', cityId: 'xiapi' },
  'mi-fang':     { forceId: 'tao', cityId: 'xiapi' },
  'sun-qian':    { forceId: 'tao', cityId: 'xiapi' },
  'jian-yong':   { forceId: 'tao', cityId: 'xiaopei' },

  // ── Lü Bu (driven from Chang'an, now ravaging Yan) ──
  'lu-bu':       { forceId: 'lubu', cityId: 'puyang' },
  'chen-gong':   { forceId: 'lubu', cityId: 'puyang' },
  'gao-shun':    { forceId: 'lubu', cityId: 'puyang' },
  'cao-xing':    { forceId: 'lubu', cityId: 'puyang' },
  'diaochan':    { forceId: 'lubu', cityId: 'puyang' },
  'zhang-miao':  { forceId: 'lubu', cityId: 'puyang' }, // defected from Cao Cao
  'zhang-chao':  { forceId: 'lubu', cityId: 'puyang' },

  // ── Yuan Shao (consolidating Hebei) ──
  'yuan-shao':   { forceId: 'yuan-shao', cityId: 'ye' },
  'yan-liang':   { forceId: 'yuan-shao', cityId: 'ye' },
  'wen-chou':    { forceId: 'yuan-shao', cityId: 'ye' },
  'tian-feng':   { forceId: 'yuan-shao', cityId: 'ye' },
  'ju-shou':     { forceId: 'yuan-shao', cityId: 'ye' },
  'shen-pei':    { forceId: 'yuan-shao', cityId: 'ye' },
  'guo-tu':      { forceId: 'yuan-shao', cityId: 'ye' },
  'gao-lan':     { forceId: 'yuan-shao', cityId: 'taiyuan' },
  'chen-lin':    { forceId: 'yuan-shao', cityId: 'ye' },

  // ── Yuan Shu (holding the Sun family hostage) ──
  'yuan-shu':    { forceId: 'yuan-shu', cityId: 'shouchun' },
  'ji-ling':     { forceId: 'yuan-shu', cityId: 'wancheng' },
  'sun-ce':      { forceId: 'yuan-shu', cityId: 'shouchun' }, // not yet broken free
  'sun-quan':    { forceId: 'yuan-shu', cityId: 'shouchun' },
  'cheng-pu':    { forceId: 'yuan-shu', cityId: 'shouchun' },
  'huang-gai':   { forceId: 'yuan-shu', cityId: 'shouchun' },
  'han-dang':    { forceId: 'yuan-shu', cityId: 'shouchun' },
  'zhou-yu':     { forceId: 'yuan-shu', cityId: 'shouchun' }, // boyhood friend, in the south

  // ── Gongsun Zan (still mighty in Youzhou; Liu Bei was his subordinate till now) ──
  'gongsun-zan': { forceId: 'gongsun', cityId: 'beiping' },
  'gongsun-yue': { forceId: 'gongsun', cityId: 'liaodong' },
  'tian-kai':    { forceId: 'gongsun', cityId: 'pingyuan' },
  'zhao-yun':    { forceId: 'gongsun', cityId: 'beiping' }, // still with Gongsun in 194

  // ── Liu Biao (Jing) ──
  'liu-biao':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-liang':  { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-yue':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'cai-mao':     { forceId: 'liu-biao', cityId: 'xiangyang' },
  'huang-zu':    { forceId: 'liu-biao', cityId: 'jiangxia' },
  'wen-pin':     { forceId: 'liu-biao', cityId: 'jiangling' },

  // ── Liu Yan (in his last year) ──
  'liu-yan':     { forceId: 'liu-yan', cityId: 'chengdu' },
  'liu-zhang':   { forceId: 'liu-yan', cityId: 'chengdu' },
  'zhang-ren':   { forceId: 'liu-yan', cityId: 'chengdu' },
  'yan-yan':     { forceId: 'liu-yan', cityId: 'jiangzhou' },
  'wu-yi':       { forceId: 'liu-yan', cityId: 'chengdu' },
  'huang-quan':  { forceId: 'liu-yan', cityId: 'chengdu' },

  // ── Kong Rong (Beihai under Yellow Turban remnant pressure) ──
  'kong-rong':   { forceId: 'kong-rong', cityId: 'beihai' },
  'taishi-ci':   { forceId: 'kong-rong', cityId: 'beihai' },

  // ── Ma Teng (Liang) ──
  'ma-teng':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-chao':     { forceId: 'ma-teng', cityId: 'wuwei' }, // already a young general at 18
  'han-sui':     { forceId: 'ma-teng', cityId: 'jincheng' },
  'pang-de':     { forceId: 'ma-teng', cityId: 'wuwei' },
};

const DEAD_BY_194: string[] = [
  // Yellow Turban first generation
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  // Han veterans gone before 194
  'huangfu-song', 'zhu-jun', 'lu-zhi', 'cai-yong',
  // Dong Zhuo crew (Dong dead 192; Wang Yun dead 192)
  'dong-zhuo', 'li-ru', 'wang-yun',
  // Eunuchs (slaughtered 189)
  'zhang-rang', 'jian-shuo',
  // He Jin and brother
  'he-jin', 'he-miao', 'liu-bian',
  // Sun Jian (d. 191 at Xiangyang)
  'sun-jian',
];

export const SCENARIO_194_XUZHOU: Scenario = {
  id: 'scn-194-xuzhou',
  name: { en: 'Lord of Xu', zh: '徐州牧' },
  description:
    'Summer 194 AD. Cao Cao\'s father Cao Song has been murdered by Tao Qian\'s officers on the road to ' +
    'Yan. Mengde marches into Xu province with vengeance in his heart, and the streets of Pengcheng ' +
    'run red. Behind him, Lü Bu and Chen Gong storm Yan itself. Tao Qian, dying, sends to Beihai ' +
    'for the young Liu Bei to take Xu in his stead. Yuan Shao consolidates Hebei; Sun Ce paces in ' +
    'Yuan Shu\'s cage at Shouchun, his father\'s sword unsheathed.',
  descriptionZh: "公元194年夏。曹操之父曹嵩為陶謙部將所殺，孟德舉哀興兵，血洗徐州，彭城屍積如山。其後方，呂布、陳宮乘虛襲取兗州。陶謙病篤，遣使北海請劉備來代守徐州。袁紹整合河北；孫策困於壽春袁術之側，懷父劍而未發。亂世群雄並起，徐州一州，幾為天下樞紐。",
  startDate: { year: 194, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_194),
  forces: FORCES_194,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_194, DEAD_BY_194, 194),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 214 AD The Conquest of Yi 入主西川
// Liu Bei besieges Chengdu; Liu Zhang prepares to surrender. Pang Tong
// has fallen at Luofeng. Zhuge Liang and Zhang Fei have already swept
// up from the east. Cao Cao threatens Sun Quan at Ruxu; Zhang Lu still
// holds Hanzhong but is about to fold before Cao.
// ──────────────────────────────────────────────────────────────────────

const FORCES_214: Force[] = [
  { id: 'cao',       name: { en: 'Cao Cao',    zh: '曹操軍' }, rulerOfficerId: 'cao-cao',   capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Quan',   zh: '孫權軍' }, rulerOfficerId: 'sun-quan',  capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-bei',   name: { en: 'Liu Bei',    zh: '劉備軍' }, rulerOfficerId: 'liu-bei',   capitalCityId: 'jiangzhou',color: '#a85d8a', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',  zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang', capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',   zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6b8a6b', isPlayer: false },
  { id: 'shi-xie',   name: { en: 'Shi Xie',    zh: '士燮軍' }, rulerOfficerId: 'shi-xie',   capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
];

const CITY_OWNERSHIP_214: Record<string, string> = {
  // ── Cao Cao — almost the whole north ──
  xuchang:   'cao',
  luoyang:   'cao',
  chenliu:   'cao',
  runan:     'cao',
  wancheng:  'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  guandu:    'cao',
  hulao:     'cao',
  ye:        'cao',
  bohai:     'cao',
  pingyuan:  'cao',
  taiyuan:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  beihai:    'cao',
  beiping:   'cao',
  liaodong:  'cao',
  changan:   'cao',
  tongguan:  'cao',
  mei:       'cao',
  wuwei:     'cao', // Ma Chao crushed at Weinan; Liang now Cao's
  jincheng:  'cao',
  anding:    'cao',
  hefei:     'cao',
  shouchun:  'cao',
  lujiang:   'cao',
  xinye:     'cao',
  xiangyang: 'cao',
  linzi:     'cao',
  // ── Sun Quan — Jiangdong + most of Jing south (post-Chibi settlement) ──
  jianye:    'sun',
  wu:        'sun',
  yuzhang:   'sun',
  jiangxia:  'sun',
  changsha:  'sun', // Sun took it after Lu Su brokered the loan
  // ── Liu Bei — has crossed into Yi, holding the east and centre ──
  jiangzhou: 'liu-bei', // taken by Zhang Fei
  jiangling: 'liu-bei', // his Jing capital
  wuling:    'liu-bei',
  lingling:  'liu-bei',
  yongan:    'liu-bei', // entry gate, taken on the way in
  // ── Liu Zhang — last stand at Chengdu ──
  chengdu:   'liu-zhang',
  // ── Zhang Lu — Hanzhong (Cao will take it next year) ──
  hanzhong:  'zhang-lu',
  // ── Shi Xie — Jiao ──
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
};

const OFFICER_ASSIGNMENTS_214: Record<string, { forceId: string; cityId: string }> = {
  // ── Cao Cao (just stalemated Sun Quan at Ruxu; eyes on Hanzhong) ──
  'cao-cao':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-pi':      { forceId: 'cao', cityId: 'ye' },
  'cao-zhi':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhang':   { forceId: 'cao', cityId: 'ye' },
  'cao-ren':     { forceId: 'cao', cityId: 'wancheng' },
  'cao-hong':    { forceId: 'cao', cityId: 'changan' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'xuchang' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'changan' }, // garrisoning the west
  'zhang-liao':  { forceId: 'cao', cityId: 'hefei' },
  'le-jin':      { forceId: 'cao', cityId: 'hefei' },
  'li-dian':     { forceId: 'cao', cityId: 'hefei' },
  'xu-huang':    { forceId: 'cao', cityId: 'changan' },
  'yu-jin':      { forceId: 'cao', cityId: 'wancheng' },
  'zhang-he':    { forceId: 'cao', cityId: 'changan' },
  'xu-chu':      { forceId: 'cao', cityId: 'xuchang' },
  'pang-de':     { forceId: 'cao', cityId: 'wancheng' }, // surrendered with Zhang Lu's brother
  'zang-ba':     { forceId: 'cao', cityId: 'pengcheng' },
  'wen-pin':     { forceId: 'cao', cityId: 'xiangyang' },
  'hao-zhao':    { forceId: 'cao', cityId: 'mei' },
  'xun-you':     { forceId: 'cao', cityId: 'xuchang' }, // d. 214 historically
  'jia-xu':      { forceId: 'cao', cityId: 'xuchang' },
  'cheng-yu':    { forceId: 'cao', cityId: 'xuchang' },
  'sima-yi':     { forceId: 'cao', cityId: 'ye' },
  'chen-qun':    { forceId: 'cao', cityId: 'xuchang' },
  'liu-ye':      { forceId: 'cao', cityId: 'xuchang' },
  'man-chong':   { forceId: 'cao', cityId: 'runan' },
  'guo-huai':    { forceId: 'cao', cityId: 'changan' },
  'wang-lang':   { forceId: 'cao', cityId: 'xuchang' },
  'hua-xin':     { forceId: 'cao', cityId: 'xuchang' },
  'zhong-yao':   { forceId: 'cao', cityId: 'changan' },
  'cai-wenji':   { forceId: 'cao', cityId: 'xuchang' },

  // ── Sun Quan (eyeing Jing — and Hefei) ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'lu-su':       { forceId: 'sun', cityId: 'jianye' },
  'lu-meng':     { forceId: 'sun', cityId: 'jiangxia' },
  'gan-ning':    { forceId: 'sun', cityId: 'jiangxia' },
  'ling-tong':   { forceId: 'sun', cityId: 'wu' },
  'cheng-pu':    { forceId: 'sun', cityId: 'jianye' },
  'huang-gai':   { forceId: 'sun', cityId: 'wu' },
  'han-dang':    { forceId: 'sun', cityId: 'yuzhang' },
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'jiang-qin':   { forceId: 'sun', cityId: 'jianye' },
  'chen-wu':     { forceId: 'sun', cityId: 'jianye' },
  'dong-xi':     { forceId: 'sun', cityId: 'jianye' },
  'lu-xun':      { forceId: 'sun', cityId: 'jianye' }, // rising young general
  'zhu-ran':     { forceId: 'sun', cityId: 'jianye' },
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },
  'zhang-hong':  { forceId: 'sun', cityId: 'jianye' },
  'gu-yong':     { forceId: 'sun', cityId: 'jianye' },
  'yu-fan':      { forceId: 'sun', cityId: 'jianye' },
  'bu-zhi':      { forceId: 'sun', cityId: 'jianye' },

  // ── Liu Bei (besieging Chengdu) ──
  'liu-bei':     { forceId: 'liu-bei', cityId: 'jiangzhou' }, // moving up the Min River to Chengdu
  'guan-yu':     { forceId: 'liu-bei', cityId: 'jiangling' }, // left in Jing
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'jiangzhou' }, // just took it; spared Yan Yan
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'jiangzhou' }, // marching with Zhuge Liang
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'jiangzhou' }, // marching west
  'huang-zhong': { forceId: 'liu-bei', cityId: 'jiangzhou' }, // marched in with Liu Bei
  'wei-yan':     { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'liu-feng':    { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'guan-ping':   { forceId: 'liu-bei', cityId: 'jiangling' },
  'mi-zhu':      { forceId: 'liu-bei', cityId: 'jiangling' },
  'mi-fang':     { forceId: 'liu-bei', cityId: 'jiangling' },
  'jian-yong':   { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'sun-qian':    { forceId: 'liu-bei', cityId: 'jiangling' },
  'yi-ji':       { forceId: 'liu-bei', cityId: 'jiangling' },
  'liu-shan':    { forceId: 'liu-bei', cityId: 'jiangling' },
  // Defectors from Liu Zhang already with Liu Bei
  'fa-zheng':    { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'meng-da':     { forceId: 'liu-bei', cityId: 'yongan' },
  'huo-jun':     { forceId: 'liu-bei', cityId: 'yongan' },

  // ── Liu Zhang (his last weeks) ──
  'liu-zhang':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'zhang-ren':   { forceId: 'liu-zhang', cityId: 'chengdu' }, // dies refusing to surrender
  'yan-yan':     { forceId: 'liu-zhang', cityId: 'chengdu' }, // captured by Zhang Fei, soon defects
  'huang-quan':  { forceId: 'liu-zhang', cityId: 'chengdu' },
  'wu-yi':       { forceId: 'liu-zhang', cityId: 'chengdu' },
  'liu-mao':     { forceId: 'liu-zhang', cityId: 'chengdu' },
  'liu-pan':     { forceId: 'liu-zhang', cityId: 'chengdu' },
  'gao-pei':     { forceId: 'liu-zhang', cityId: 'chengdu' },
  'wang-lei':    { forceId: 'liu-zhang', cityId: 'chengdu' },

  // ── Zhang Lu (Hanzhong) ──
  'zhang-lu':    { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'yang-song':   { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'ma-chao':     { forceId: 'zhang-lu', cityId: 'hanzhong' }, // refugee, about to defect to Liu Bei
  'ma-dai':      { forceId: 'zhang-lu', cityId: 'hanzhong' },

  // ── Shi Xie ──
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },
};

const DEAD_BY_214: string[] = [
  // 184 generation
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi', 'cai-yong',
  // Eunuchs / Han court
  'zhang-rang', 'jian-shuo', 'he-jin', 'he-miao', 'liu-bian',
  // Dong Zhuo crew
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong', 'wang-yun', 'fan-chou', 'zhang-ji',
  'han-fu', 'bao-xin', 'yang-feng', 'han-xian', 'li-jue', 'guo-si',
  // Lü Bu crew
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'diaochan',
  // Yuan / early warlords
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'yuan-shu', 'ji-ling',
  'sun-jian', 'sun-ce', 'tao-qian', 'tao-shang', 'tao-ying', 'cao-bao',
  'kong-rong', 'gongsun-zan', 'gongsun-du', 'liu-yan', 'liu-yu', 'tian-kai',
  'liu-biao', 'liu-cong', 'liu-qi', 'cai-mao', 'zhang-yun', 'huang-zu', 'han-xuan', 'liu-du',
  // Liang
  'ma-teng', 'ma-tie', 'ma-xiu', 'han-sui', 'cheng-yi', 'hou-xuan', 'liang-xing', 'yang-qiu',
  'ma-wan', 'cheng-yin', 'li-kan',
  // Cao crew
  'cao-ang', 'cao-anmin', 'dian-wei', 'xi-zhicai', 'guo-jia', 'xun-yu',
  // Sun crew (Zhou Yu d. 210, Taishi Ci d. 206)
  'zhou-yu', 'taishi-ci',
  // Misc
  'zhang-miao', 'zhang-chao', 'qiao-mao', 'wang-kuang', 'kuai-liang',
];

export const SCENARIO_214_XICHUAN: Scenario = {
  id: 'scn-214-xichuan',
  name: { en: 'The Conquest of Yi', zh: '入主西川' },
  description:
    'Summer 214 AD. Liu Bei besieges Chengdu. Pang Tong has fallen at Luofeng; Zhuge Liang and ' +
    'Zhang Fei have swept up the Yangtze from the east, sparing Yan Yan and taking Jiangzhou. ' +
    'Liu Zhang shuts his gates and waits. To the north, Cao Cao has just stalemated Sun Quan at ' +
    'Ruxu and now eyes Zhang Lu in Hanzhong. To the east, Sun Quan watches Jing — Lu Su\'s loan, ' +
    'he believes, is overdue.',
  descriptionZh: "公元214年夏。劉備圍成都。龐統殞落雒城；孔明、翼德溯江而上，義釋嚴顏，已取江州。劉璋閉門以待，西川人心離散。北方曹操濡須相持纔退，遂謀漢中張魯。江東孫權虎視荊州——魯子敬之借，自言已逾期矣。",
  startDate: { year: 214, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_214),
  forces: FORCES_214,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_214, DEAD_BY_214, 214),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 249 AD The Gaoping Coup 高平陵之變
// Sima Yi feigns illness, then strikes while Cao Shuang escorts Emperor
// Cao Fang to the Gaoping tombs. The Sima clan seizes Luoyang and the
// realm of Wei. Shu under Liu Shan and Jiang Wei watches; Wu under an
// aging Sun Quan grows brittle.
// ──────────────────────────────────────────────────────────────────────

const FORCES_249: Force[] = [
  { id: 'sima',    name: { en: 'Sima Faction',  zh: '司馬黨' }, rulerOfficerId: 'sima-yi',    capitalCityId: 'luoyang', color: '#3a4d8a', isPlayer: false },
  { id: 'cao',     name: { en: 'Cao Shuang',    zh: '曹爽軍' }, rulerOfficerId: 'cao-shuang', capitalCityId: 'changan', color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han',       zh: '蜀漢'   }, rulerOfficerId: 'liu-shan',   capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',            zh: '吳'     }, rulerOfficerId: 'sun-quan',   capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
];

const CITY_OWNERSHIP_249: Record<string, string> = {
  // ── Sima faction — holds Luoyang itself, the eastern frontier (Wang Ling, Guanqiu Jian) ──
  luoyang:   'sima',
  xuchang:   'sima',
  ye:        'sima',
  shouchun:  'sima', // Wang Ling, still loyal to Wei but pro-Sima for now
  hefei:     'sima',
  pengcheng: 'sima',
  xiapi:     'sima',
  chenliu:   'sima',
  runan:     'sima',
  guandu:    'sima',
  hulao:     'sima',
  pingyuan:  'sima',
  bohai:     'sima',
  beihai:    'sima',
  taiyuan:   'sima',
  yanmen:    'sima',
  shangdang: 'sima',
  beiping:   'sima',
  liaodong:  'sima', // crushed by Sima Yi in 238
  linzi:     'sima',
  // ── Cao Shuang faction — holds the western frontier and several Cao kinsmen garrisons ──
  changan:   'cao',
  tongguan:  'cao',
  mei:       'cao',
  wuwei:     'cao',
  jincheng:  'cao',
  anding:    'cao',
  wudu:      'cao', // contested with Shu
  wancheng:  'cao',
  xinye:     'cao',
  xiangyang: 'cao',
  // ── Shu Han — Yi + Hanzhong ──
  chengdu:   'liu-bei',
  yongan:    'liu-bei',
  jiangzhou: 'liu-bei',
  hanzhong:  'liu-bei',
  // ── Wu — Jiangdong + Jing south ──
  jianye:    'sun',
  wu:        'sun',
  yuzhang:   'sun',
  changsha:  'sun',
  jiangling: 'sun',
  jiangxia:  'sun',
  wuling:    'sun',
  lingling:  'sun',
};

const OFFICER_ASSIGNMENTS_249: Record<string, { forceId: string; cityId: string }> = {
  // ── Sima Faction (the coup, spring of 249) ──
  'sima-yi':     { forceId: 'sima', cityId: 'luoyang' }, // feigning illness then striking
  'sima-shi':    { forceId: 'sima', cityId: 'luoyang' }, // commands the assault on the gates
  'sima-zhao':   { forceId: 'sima', cityId: 'luoyang' },
  'sima-fu':     { forceId: 'sima', cityId: 'luoyang' },
  'sima-yan':    { forceId: 'sima', cityId: 'luoyang' }, // child, future Emperor Wu of Jin
  'jia-chong':   { forceId: 'sima', cityId: 'luoyang' },
  'wang-su':     { forceId: 'sima', cityId: 'luoyang' },
  'wang-yuanji': { forceId: 'sima', cityId: 'luoyang' },
  'guo-huai':    { forceId: 'sima', cityId: 'changan' }, // technically with Cao Shuang command but Sima-aligned
  'chen-tai':    { forceId: 'sima', cityId: 'luoyang' },
  'deng-ai':     { forceId: 'sima', cityId: 'shouchun' }, // rising Sima protégé
  'zhong-hui':   { forceId: 'sima', cityId: 'luoyang' }, // still young, attached to Sima Shi
  'wang-ling':   { forceId: 'sima', cityId: 'shouchun' }, // will rebel 251
  'guanqiu-jian':{ forceId: 'sima', cityId: 'pengcheng' }, // will rebel 255
  'zhuge-dan':   { forceId: 'sima', cityId: 'xiapi' }, // will rebel 257
  'hu-zhi':      { forceId: 'sima', cityId: 'pingyuan' },
  'hu-fen':      { forceId: 'sima', cityId: 'luoyang' },
  'sima-lang':   { forceId: 'sima', cityId: 'luoyang' }, // d. 217 — auto-dead, listed for completeness

  // ── Cao Shuang Faction (at the tombs with Emperor Cao Fang) ──
  'cao-shuang':  { forceId: 'cao', cityId: 'changan' }, // marching as regent
  'cao-fang':    { forceId: 'cao', cityId: 'changan' }, // the puppet emperor, brought along
  'cao-xun':     { forceId: 'cao', cityId: 'changan' }, // brother
  'he-yan':      { forceId: 'cao', cityId: 'changan' },
  'deng-yang':   { forceId: 'cao', cityId: 'changan' },
  'ding-mi':     { forceId: 'cao', cityId: 'changan' },
  'li-feng':     { forceId: 'cao', cityId: 'changan' },
  'xiahou-xuan': { forceId: 'cao', cityId: 'wuwei' }, // Cao Shuang's cousin, governor of the west
  'xiahou-ba':   { forceId: 'cao', cityId: 'jincheng' }, // soon defects to Shu

  // ── Shu Han (Liu Shan + Jiang Wei chief general) ──
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-yong':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-li':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'fei-yi':      { forceId: 'liu-bei', cityId: 'chengdu' }, // chancellor, assassinated 253
  'dong-yun':    { forceId: 'liu-bei', cityId: 'chengdu' }, // d. 246 — auto-dead, kept for completeness
  'jiang-wei':   { forceId: 'liu-bei', cityId: 'hanzhong' }, // new chief general after Fei Yi limits him
  'liao-hua':    { forceId: 'liu-bei', cityId: 'hanzhong' },
  'zhang-yi':    { forceId: 'liu-bei', cityId: 'hanzhong' },
  'zhuge-zhan':  { forceId: 'liu-bei', cityId: 'chengdu' }, // Zhuge Liang's son, now an officer
  'huo-yi':      { forceId: 'liu-bei', cityId: 'yongan' },
  'luo-xian':    { forceId: 'liu-bei', cityId: 'yongan' },
  'fu-qian':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'qiao-zhou':   { forceId: 'liu-bei', cityId: 'chengdu' }, // the surrenderist scholar
  'huang-hao':   { forceId: 'liu-bei', cityId: 'chengdu' }, // the eunuch, rising influence
  'chen-zhen':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'fan-jian':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'dong-jue':    { forceId: 'liu-bei', cityId: 'chengdu' },

  // ── Wu (Sun Quan, old, near death — succession crisis brewing) ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'sun-he':      { forceId: 'sun', cityId: 'jianye' }, // crown prince, soon deposed
  'sun-liang':   { forceId: 'sun', cityId: 'jianye' }, // future child emperor
  'lu-xun':      { forceId: 'sun', cityId: 'jiangling' }, // d. 245 — auto-dead, kept
  'lu-kang':     { forceId: 'sun', cityId: 'jiangling' }, // Lu Xun's son, rising
  'zhuge-ke':    { forceId: 'sun', cityId: 'jianye' }, // future regent
  'sun-jun':     { forceId: 'sun', cityId: 'jianye' }, // future regent and tyrant
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },
  'lu-dai':      { forceId: 'sun', cityId: 'yuzhang' },
  'quan-cong':   { forceId: 'sun', cityId: 'jianye' },
  'zhu-ran':     { forceId: 'sun', cityId: 'jiangling' }, // d. 249 historically
  'zhu-huan':    { forceId: 'sun', cityId: 'yuzhang' }, // d. 238 — auto-dead, kept
  'gu-yong':     { forceId: 'sun', cityId: 'jianye' }, // d. 243 — auto-dead, kept
  'bu-zhi':      { forceId: 'sun', cityId: 'yuzhang' }, // d. 247 — auto-dead, kept
  'sun-deng':    { forceId: 'sun', cityId: 'jianye' }, // d. 241 — auto-dead, kept
};

const DEAD_BY_249: string[] = [
  // The first generation — all gone by 249
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi', 'cai-yong',
  'zhang-rang', 'jian-shuo', 'he-jin', 'he-miao', 'liu-bian', 'liu-xie',
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong', 'wang-yun', 'fan-chou', 'zhang-ji',
  'han-fu', 'bao-xin', 'yang-feng', 'han-xian', 'li-jue', 'guo-si',
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'diaochan',
  'chen-deng', 'chen-gui',
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'yuan-shu', 'ji-ling',
  'sun-jian', 'sun-ce', 'tao-qian', 'tao-shang', 'tao-ying', 'cao-bao',
  'kong-rong', 'gongsun-zan', 'gongsun-du', 'gongsun-kang', 'gongsun-yuan',
  'liu-yan', 'liu-yu', 'tian-kai',
  'liu-biao', 'liu-cong', 'liu-qi', 'cai-mao', 'zhang-yun', 'huang-zu', 'han-xuan', 'liu-du',
  // Liang
  'ma-teng', 'ma-chao', 'ma-tie', 'ma-xiu', 'ma-dai', 'han-sui', 'cheng-yi', 'hou-xuan', 'liang-xing',
  'yang-qiu', 'ma-wan', 'cheng-yin', 'li-kan',
  // Wei crew (d. before 249)
  'cao-cao', 'cao-pi', 'cao-rui', 'cao-mao', // emperors before Cao Fang
  'cao-ang', 'cao-anmin', 'cao-zhang', 'cao-zhi', 'cao-zhen', 'cao-xiu', 'cao-chun',
  'cao-ren', 'cao-hong', 'cao-yu',
  'xiahou-dun', 'xiahou-yuan', 'xiahou-shang', 'xiahou-mao',
  'dian-wei', 'xi-zhicai', 'guo-jia', 'xun-yu', 'xun-you', 'cheng-yu',
  'zhang-liao', 'xu-huang', 'yu-jin', 'le-jin', 'li-dian', 'xu-chu', 'pang-de',
  'zang-ba', 'wen-pin', 'jia-xu', 'jia-kui', 'hao-zhao', 'wang-shuang', 'sun-li',
  'man-chong', 'tian-yu', 'qin-lang', 'yang-fu', 'zhang-he',
  'chen-qun', 'liu-ye', 'zhong-yao', 'hua-xin', 'wang-lang', 'cai-wenji',
  // Shu crew d. before 249
  'liu-bei', 'guan-yu', 'zhang-fei', 'zhao-yun', 'huang-zhong', 'fa-zheng', 'pang-tong',
  'zhuge-liang', 'ma-su', 'wei-yan', 'wang-ping', 'ma-zhong',
  'mi-zhu', 'mi-fang', 'sun-qian', 'jian-yong', 'liu-feng', 'guan-ping', 'guan-xing', 'zhang-bao',
  'ma-liang', 'liu-ba', 'shamoke',
  'jiang-wan', 'deng-zhi', 'yang-yi', 'li-yan',
  'wu-yi', 'wu-ban', 'yan-yan', 'huang-quan', 'meng-da',
  // Wu crew d. before 249
  'sun-shao', 'sun-yi', 'sun-kuang', 'lady-sun',
  'zhou-yu', 'lu-su', 'lu-meng', 'taishi-ci', 'cheng-pu', 'huang-gai', 'zhou-tai', 'han-dang',
  'gan-ning', 'ling-tong', 'jiang-qin', 'pan-zhang', 'chen-wu', 'dong-xi',
  'xu-sheng-wu', 'zhang-zhao', 'zhang-hong', 'he-qi',
  'pan-jun', 'yu-fan', 'zhuge-jin', 'zhou-fang', 'zhu-zhi',
  // Misc
  'shi-xie',
  'liu-zhang', 'zhang-ren', 'zhang-song',
  'zhang-lu', 'yang-song',
  'kebi-neng', 'budugen',
];

export const SCENARIO_249_GAOPINGLING: Scenario = {
  id: 'scn-249-gaopingling',
  name: { en: 'The Gaoping Coup', zh: '高平陵之變' },
  description:
    'Spring 249 AD. The old fox Sima Yi has spent two years feigning illness while the regent ' +
    'Cao Shuang grows arrogant. On the day Cao Shuang escorts the boy emperor Cao Fang to sweep the ' +
    'Gaoping tombs, Sima Yi rises from his sickbed, seizes the gates of Luoyang, and seals the city. ' +
    'Cao Shuang surrenders, trusting the Empress Dowager\'s pledge — and is executed with his entire ' +
    'clan. From this day, the Cao emperor reigns but the Sima clan rules.',
  descriptionZh: "公元249年春。司馬仲達詐病兩年，大將軍曹爽驕橫日盛。是日曹爽奉幼帝曹芳謁高平陵，司馬懿病榻一躍而起，部勒禁軍，閉洛陽諸門，盡奪武庫。曹爽信郭太后詔書出降，旋與三族並誅於市。自此曹氏雖坐龍床，天下實歸司馬。",
  startDate: { year: 249, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_249),
  forces: FORCES_249,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_249, DEAD_BY_249, 249),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 280 AD Jin Unifies the Realm 晉滅吳
// Sima Yan, now Emperor Wu of Jin, launches a six-army campaign south.
// Wang Jun's fleet of warships sails down the Yangtze. Sun Hao, last
// emperor of Wu, locks the river with iron chains — which the Jin
// burn through. Three Kingdoms ends. Three hundred years of division
// begin to close.
// ──────────────────────────────────────────────────────────────────────

const FORCES_280: Force[] = [
  { id: 'sima', name: { en: 'Great Jin',    zh: '大晉' }, rulerOfficerId: 'sima-yan', capitalCityId: 'luoyang', color: '#3a4d8a', isPlayer: false },
  { id: 'sun',  name: { en: 'Wu (Sun Hao)', zh: '吳'   }, rulerOfficerId: 'sun-hao',  capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
];

const CITY_OWNERSHIP_280: Record<string, string> = {
  // ── Jin — everything north of the Yangtze, all of former Wei + Shu ──
  luoyang:   'sima',
  xuchang:   'sima',
  changan:   'sima',
  ye:        'sima',
  chenliu:   'sima',
  wancheng:  'sima',
  runan:     'sima',
  xinye:     'sima',
  pengcheng: 'sima',
  xiapi:     'sima',
  shouchun:  'sima',
  hefei:     'sima',
  pingyuan:  'sima',
  taiyuan:   'sima',
  yanmen:    'sima',
  shangdang: 'sima',
  beiping:   'sima',
  bohai:     'sima',
  beihai:    'sima',
  liaodong:  'sima',
  wuwei:     'sima',
  jincheng:  'sima',
  anding:    'sima',
  mei:       'sima',
  xiangyang: 'sima', // Yang Hu's old command, now Du Yu's
  tongguan:  'sima',
  hulao:     'sima',
  guandu:    'sima',
  linzi:     'sima',
  wudu:      'sima',
  // Former Shu
  chengdu:   'sima',
  yongan:    'sima',
  jiangzhou: 'sima',
  hanzhong:  'sima',
  // ── Wu (its last spring) ──
  jianye:    'sun',
  wu:        'sun',
  yuzhang:   'sun',
  changsha:  'sun',
  jiangling: 'sun',
  jiangxia:  'sun',
  wuling:    'sun',
  lingling:  'sun',
  jiaozhi:   'sun', // reconquered from Jin in 271 by Tao Huang
  nanhai:    'sun',
  hepu:      'sun',
};

const OFFICER_ASSIGNMENTS_280: Record<string, { forceId: string; cityId: string }> = {
  // ── Great Jin — Sima Yan and the six armies ──
  'sima-yan':    { forceId: 'sima', cityId: 'luoyang' }, // Emperor Wu of Jin
  'sima-you':    { forceId: 'sima', cityId: 'luoyang' }, // Prince of Qi, brother
  'sima-zhou':   { forceId: 'sima', cityId: 'xuchang' }, // commands the Tushan column
  'sima-zhong':  { forceId: 'sima', cityId: 'luoyang' }, // the future inept Emperor Hui
  'jia-chong':   { forceId: 'sima', cityId: 'luoyang' }, // nominally supreme commander
  'jia-mi-jin':  { forceId: 'sima', cityId: 'luoyang' },
  'wang-yuanji': { forceId: 'sima', cityId: 'luoyang' }, // empress dowager
  // The six columns
  'du-yu':       { forceId: 'sima', cityId: 'xiangyang' }, // strategist of the campaign, marches on Jiangling
  'wang-jun':    { forceId: 'sima', cityId: 'chengdu' },   // builds the great fleet upriver in Yi
  'tang-bin':    { forceId: 'sima', cityId: 'chengdu' },   // sails with Wang Jun
  'wang-hun':    { forceId: 'sima', cityId: 'shouchun' },  // crosses at Hengjiang
  'wang-rong':   { forceId: 'sima', cityId: 'wancheng' },  // marches on Wuchang
  'hu-fen':      { forceId: 'sima', cityId: 'xiapi' },
  'wang-ji':     { forceId: 'sima', cityId: 'pengcheng' },
  // The high command and Jin court
  'yang-hu':     { forceId: 'sima', cityId: 'xiangyang' }, // d. 278 — auto-dead, listed for completeness
  'zhang-hua':   { forceId: 'sima', cityId: 'luoyang' },   // statesman pushing the campaign through
  'wei-guan':    { forceId: 'sima', cityId: 'luoyang' },
  'pei-xiu':     { forceId: 'sima', cityId: 'luoyang' },   // d. 271 — auto-dead, kept
  'xun-xu':      { forceId: 'sima', cityId: 'luoyang' },
  'shi-bao':     { forceId: 'sima', cityId: 'shouchun' },  // d. 273 — auto-dead, kept
  'hu-lie':      { forceId: 'sima', cityId: 'changan' },
  'sima-fu':     { forceId: 'sima', cityId: 'luoyang' },   // d. 272 — auto-dead, kept
  'sima-jiong':  { forceId: 'sima', cityId: 'luoyang' },   // young prince
  'sima-yong':   { forceId: 'sima', cityId: 'changan' },
  'sima-lun':    { forceId: 'sima', cityId: 'luoyang' },
  'sima-tai':    { forceId: 'sima', cityId: 'luoyang' },
  // Former Shu officials, now Jin
  'li-mi-shu':   { forceId: 'sima', cityId: 'chengdu' },   // famous for the Memorial on Retiring
  'luo-xian':    { forceId: 'sima', cityId: 'yongan' },    // d. 270 — kept for completeness
  'zhou-chu':    { forceId: 'sima', cityId: 'changan' },   // the tiger-slayer

  // ── Wu — the last court at Jianye under the tyrant Sun Hao ──
  'sun-hao':     { forceId: 'sun', cityId: 'jianye' },     // last emperor of Wu
  'zhang-ti':    { forceId: 'sun', cityId: 'jianye' },     // prime minister, dies leading the defence
  'lu-kang':     { forceId: 'sun', cityId: 'jiangling' },  // d. 274 — auto-dead, kept (his sons fight on)
  'lu-yi-wu':    { forceId: 'sun', cityId: 'jiangling' },  // Lu Kang's son
  'tao-huang':   { forceId: 'sun', cityId: 'jiaozhi' },    // governor who held Jiao for Wu
  'tao-jun':     { forceId: 'sun', cityId: 'nanhai' },
  'lu-kai':      { forceId: 'sun', cityId: 'jianye' },     // d. 269 — kept
  'teng-xiu':    { forceId: 'sun', cityId: 'jianye' },
  'teng-yin':    { forceId: 'sun', cityId: 'jianye' },     // d. 256 — kept
  'sun-fen':     { forceId: 'sun', cityId: 'changsha' },
  'gu-shao':     { forceId: 'sun', cityId: 'jianye' },     // d. 253 — kept
  'fan-jian':    { forceId: 'sun', cityId: 'changsha' },   // surrenders to Wang Hun
  'xue-ying':    { forceId: 'sun', cityId: 'jianye' },
  'hu-zong':     { forceId: 'sun', cityId: 'jianye' },     // d. 243 — kept
  'sun-jun':     { forceId: 'sun', cityId: 'jianye' },     // d. 256 — kept
  'sun-lin':     { forceId: 'sun', cityId: 'jianye' },     // d. 258 — kept
  'sun-liang':   { forceId: 'sun', cityId: 'jianye' },     // d. 260 — kept
  'sun-xiu':     { forceId: 'sun', cityId: 'jianye' },     // d. 264 — kept
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },     // d. 271 — kept
  'zhuge-ke':    { forceId: 'sun', cityId: 'jianye' },     // d. 253 — kept
};

const DEAD_BY_280: string[] = [
  // The entire first generation — all gone for half a century
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi', 'cai-yong',
  'zhang-rang', 'jian-shuo', 'he-jin', 'he-miao', 'liu-bian', 'liu-xie',
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong', 'wang-yun', 'fan-chou', 'zhang-ji',
  'han-fu', 'bao-xin', 'yang-feng', 'han-xian', 'li-jue', 'guo-si',
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'diaochan',
  'chen-deng', 'chen-gui',
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'yuan-shu', 'ji-ling',
  'sun-jian', 'sun-ce', 'tao-qian', 'tao-shang', 'tao-ying', 'cao-bao',
  'kong-rong', 'gongsun-zan', 'gongsun-du', 'gongsun-kang', 'gongsun-yuan',
  'liu-yan', 'liu-yu', 'tian-kai',
  'liu-biao', 'liu-cong', 'liu-qi', 'cai-mao', 'zhang-yun', 'huang-zu', 'han-xuan', 'liu-du',
  // Liang
  'ma-teng', 'ma-chao', 'ma-tie', 'ma-xiu', 'ma-dai', 'han-sui', 'cheng-yi', 'hou-xuan', 'liang-xing',
  'yang-qiu', 'ma-wan', 'cheng-yin', 'li-kan',
  // Wei (all gone)
  'cao-cao', 'cao-pi', 'cao-rui', 'cao-fang', 'cao-mao', 'cao-huan', // last Wei emperor abdicated 266
  'cao-ang', 'cao-anmin', 'cao-zhang', 'cao-zhi', 'cao-zhen', 'cao-xiu', 'cao-chun',
  'cao-ren', 'cao-hong', 'cao-shuang', 'cao-xun', 'cao-yu',
  'xiahou-dun', 'xiahou-yuan', 'xiahou-shang', 'xiahou-ba', 'xiahou-mao', 'xiahou-xuan',
  'dian-wei', 'xi-zhicai', 'guo-jia', 'xun-yu', 'xun-you', 'cheng-yu',
  'zhang-liao', 'xu-huang', 'yu-jin', 'le-jin', 'li-dian', 'xu-chu', 'pang-de',
  'zang-ba', 'wen-pin', 'jia-xu', 'jia-kui', 'hao-zhao', 'wang-shuang', 'sun-li',
  'man-chong', 'tian-yu', 'qin-lang', 'yang-fu', 'guo-huai', 'zhang-he',
  'sima-yi', 'sima-shi', 'sima-zhao', 'sima-lang',
  'chen-qun', 'liu-ye', 'zhong-yao', 'hua-xin', 'wang-lang', 'wang-su', 'cai-wenji',
  'he-yan', 'deng-yang', 'ding-mi', 'li-feng',
  'wang-ling', 'guanqiu-jian', 'zhuge-dan', 'wen-qin',
  'deng-ai', 'zhong-hui', 'chen-tai',
  // Shu — all gone
  'liu-bei', 'guan-yu', 'zhang-fei', 'zhao-yun', 'huang-zhong', 'fa-zheng', 'pang-tong',
  'zhuge-liang', 'ma-su', 'wei-yan', 'wang-ping', 'ma-zhong',
  'mi-zhu', 'mi-fang', 'sun-qian', 'jian-yong', 'liu-feng', 'guan-ping', 'guan-xing', 'zhang-bao',
  'ma-liang', 'liu-ba', 'shamoke',
  'jiang-wan', 'fei-yi', 'dong-yun', 'deng-zhi', 'yang-yi', 'li-yan',
  'wu-yi', 'wu-ban', 'yan-yan', 'huang-quan', 'meng-da',
  'jiang-wei', 'liao-hua', 'zhang-yi', 'zhuge-zhan', 'zhuge-shang', 'fu-qian',
  'liu-shan', 'liu-chen', 'liu-yong', 'liu-li', 'huang-hao', 'qiao-zhou',
  // Wu — all the old guard
  'sun-quan', 'sun-deng', 'sun-he', 'sun-shao', 'sun-yi', 'sun-kuang', 'lady-sun',
  'zhou-yu', 'lu-su', 'lu-meng', 'lu-xun', 'taishi-ci', 'cheng-pu', 'huang-gai', 'zhou-tai', 'han-dang',
  'gan-ning', 'ling-tong', 'jiang-qin', 'pan-zhang', 'zhu-ran', 'zhu-huan', 'chen-wu', 'dong-xi',
  'xu-sheng-wu', 'zhang-zhao', 'zhang-hong', 'gu-yong', 'bu-zhi', 'he-qi', 'quan-cong',
  'pan-jun', 'yu-fan', 'zhuge-jin', 'zhou-fang', 'zhu-zhi', 'lu-dai',
  // Misc
  'shi-xie',
  'liu-zhang', 'zhang-ren', 'zhang-song',
  'zhang-lu', 'yang-song',
  'kebi-neng', 'budugen',
];

export const SCENARIO_280_JIN_UNITE: Scenario = {
  id: 'scn-280-jin-unite',
  name: { en: 'Jin Unifies the Realm', zh: '晉滅吳' },
  description:
    'Spring 280 AD. Sima Yan, Emperor Wu of Jin, has ordered the final southern campaign. Six armies ' +
    'march on Wu in concert: Du Yu strikes from Xiangyang, Wang Hun crosses the river at Hengjiang, ' +
    'and Wang Jun\'s great fleet — built years before in Yi — sails down the Yangtze through the iron ' +
    'chains and burning poles of Wu\'s defences. In Jianye the tyrant Sun Hao prepares a banquet. ' +
    'In four months, three centuries of division will end, and the realm be one.',
  descriptionZh: "公元280年春。晉武帝司馬炎下詔大舉伐吳，六路齊發。杜元凱由襄陽南下；王渾自橫江渡江；王濬樓船下益州，沿江而東，焚鐵索、燒鐵錐，浩浩無敵。建業之內，吳主孫晧猶歌舞為樂。不過四月，三百年分裂之局將終，天下歸於一統。",
  startDate: { year: 280, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_280),
  forces: FORCES_280,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_280, DEAD_BY_280, 280),
};


// ──────────────────────────────────────────────────────────────────────
// Additional historical scenarios — Phase 51
// 8 scenarios spanning 192 (Wang Yun's chain plot) → 265 (Sima Yan founds Jin).
// All entries follow the existing scenarios.ts pattern.
// ──────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────
// Scenario — 192 AD Wang Yun's Chain Plot 王允連環計
// Wang Yun stages the beauty trap. Diao Chan turns the Flying General
// against his foster father. Lu Bu cuts down Dong Zhuo at the palace
// gates of Chang'an. Days later, Li Jue and Guo Si march back from
// Shaanxi to avenge their lord — and the capital burns again.
// ──────────────────────────────────────────────────────────────────────

const FORCES_192: Force[] = [
  { id: 'han',         name: { en: 'Han Court',    zh: '漢室'    }, rulerOfficerId: 'wang-yun',     capitalCityId: 'changan',  color: '#c19a3b', isPlayer: false },
  { id: 'lubu',        name: { en: 'Lü Bu',        zh: '呂布軍'  }, rulerOfficerId: 'lu-bu',        capitalCityId: 'luoyang',  color: '#9b3a3a', isPlayer: false },
  { id: 'lijue',       name: { en: 'Li Jue',       zh: '李傕軍'  }, rulerOfficerId: 'li-jue',       capitalCityId: 'mei',      color: '#7a3a3a', isPlayer: false },
  { id: 'yuan-shao',   name: { en: 'Yuan Shao',    zh: '袁紹軍'  }, rulerOfficerId: 'yuan-shao',    capitalCityId: 'ye',       color: '#b8442e', isPlayer: false },
  { id: 'yuan-shu',    name: { en: 'Yuan Shu',     zh: '袁術軍'  }, rulerOfficerId: 'yuan-shu',     capitalCityId: 'shouchun', color: '#a85d8a', isPlayer: false },
  { id: 'gongsun',     name: { en: 'Gongsun Zan',  zh: '公孫瓚軍'}, rulerOfficerId: 'gongsun-zan',  capitalCityId: 'beiping',  color: '#5a9bb8', isPlayer: false },
  { id: 'cao',         name: { en: 'Cao Cao',      zh: '曹操軍'  }, rulerOfficerId: 'cao-cao',      capitalCityId: 'chenliu',  color: '#3a7dd9', isPlayer: false },
  { id: 'liu-biao',    name: { en: 'Liu Biao',     zh: '劉表軍'  }, rulerOfficerId: 'liu-biao',     capitalCityId: 'xiangyang',color: '#a85d3a', isPlayer: false },
  { id: 'tao-qian',    name: { en: 'Tao Qian',     zh: '陶謙軍'  }, rulerOfficerId: 'tao-qian',     capitalCityId: 'xiapi',    color: '#7a8a3a', isPlayer: false },
  { id: 'liu-yan',     name: { en: 'Liu Yan',      zh: '劉焉軍'  }, rulerOfficerId: 'liu-yan',      capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
];

const CITY_OWNERSHIP_192: Record<string, string> = {
  // Han court at Chang'an — Wang Yun's brief restoration
  changan:   'han',
  tongguan:  'han',
  anding:    'han',
  jincheng:  'han',
  wuwei:     'han',
  // Lu Bu — given Luoyang region after killing Dong Zhuo
  luoyang:   'lubu',
  hulao:     'lubu',
  // Li Jue / Guo Si — marching back from Shaanxi to avenge Dong Zhuo
  mei:       'lijue',
  hanzhong:  'lijue', // Zhang Lu not yet established; treat as Liang remnant
  // Yuan Shao — Hebei colossus, fresh from crushing Gongsun Zan at Jieqiao
  ye:        'yuan-shao',
  bohai:     'yuan-shao',
  pingyuan:  'yuan-shao',
  taiyuan:   'yuan-shao',
  yanmen:    'yuan-shao',
  shangdang: 'yuan-shao',
  // Yuan Shu — Huainan
  shouchun:  'yuan-shu',
  lujiang:   'yuan-shu',
  runan:     'yuan-shu',
  // Gongsun Zan — clinging to the north
  beiping:   'gongsun',
  liaodong:  'gongsun',
  yuyang:    'gongsun',
  'yi-county': 'gongsun',
  // Cao Cao — small in Yan, just made Governor after Bao Xin's death
  chenliu:   'cao',
  puyang:    'cao',
  guandu:    'cao',
  // Liu Biao — Jing province
  xiangyang: 'liu-biao',
  jiangling: 'liu-biao',
  jiangxia:  'liu-biao',
  changsha:  'liu-biao',
  lingling:  'liu-biao',
  wuling:    'liu-biao',
  // Tao Qian — Xu province
  xiapi:     'tao-qian',
  pengcheng: 'tao-qian',
  langya:    'tao-qian',
  // Liu Yan — Yi province
  chengdu:   'liu-yan',
  yongan:    'liu-yan',
  jiangzhou: 'liu-yan',
};

const OFFICER_ASSIGNMENTS_192: Record<string, { forceId: string; cityId: string }> = {
  // ── Han Court at Chang'an (Wang Yun's restoration) ──
  'wang-yun':    { forceId: 'han', cityId: 'changan' },
  'liu-xie':     { forceId: 'han', cityId: 'changan' }, // Emperor Xian, 11 years old
  'huangfu-song':{ forceId: 'han', cityId: 'changan' },
  'zhu-jun':     { forceId: 'han', cityId: 'changan' },
  'yang-biao':   { forceId: 'han', cityId: 'changan' },
  'fu-wan':      { forceId: 'han', cityId: 'changan' },
  'ma-teng':     { forceId: 'han', cityId: 'wuwei' },
  'ma-chao':     { forceId: 'han', cityId: 'wuwei' }, // 16 years old
  'han-sui':     { forceId: 'han', cityId: 'jincheng' },

  // ── Lü Bu — given Wen Hou rank, regent of Luoyang ──
  'lu-bu':       { forceId: 'lubu', cityId: 'luoyang' },
  'diaochan':    { forceId: 'lubu', cityId: 'luoyang' },
  'gao-shun':    { forceId: 'lubu', cityId: 'luoyang' },
  'chen-gong':   { forceId: 'lubu', cityId: 'hulao' }, // about to attach himself to Lu Bu
  'zhang-yang':  { forceId: 'lubu', cityId: 'luoyang' }, // friendly

  // ── Li Jue / Guo Si (marching east from Mei) ──
  'li-jue':      { forceId: 'lijue', cityId: 'mei' },
  'guo-si':      { forceId: 'lijue', cityId: 'mei' },
  'fan-chou':    { forceId: 'lijue', cityId: 'mei' },
  'zhang-ji':    { forceId: 'lijue', cityId: 'mei' },
  'jia-xu':      { forceId: 'lijue', cityId: 'mei' }, // the man with the deadly counsel
  'duan-wei':    { forceId: 'lijue', cityId: 'hanzhong' },
  'hu-zhen':     { forceId: 'lijue', cityId: 'mei' },

  // ── Yuan Shao (just crushed Gongsun Zan at Jieqiao) ──
  'yuan-shao':   { forceId: 'yuan-shao', cityId: 'ye' },
  'yan-liang':   { forceId: 'yuan-shao', cityId: 'ye' },
  'wen-chou':    { forceId: 'yuan-shao', cityId: 'pingyuan' },
  'zhang-he':    { forceId: 'yuan-shao', cityId: 'taiyuan' },
  'gao-lan':     { forceId: 'yuan-shao', cityId: 'ye' },
  'ju-shou':     { forceId: 'yuan-shao', cityId: 'ye' },
  'tian-feng':   { forceId: 'yuan-shao', cityId: 'ye' },
  'shen-pei':    { forceId: 'yuan-shao', cityId: 'ye' },
  'feng-ji':     { forceId: 'yuan-shao', cityId: 'ye' },
  'guo-tu':      { forceId: 'yuan-shao', cityId: 'ye' },
  'xun-chen':    { forceId: 'yuan-shao', cityId: 'ye' },
  'ju-yi':       { forceId: 'yuan-shao', cityId: 'pingyuan' }, // hero of Jieqiao
  'yuan-tan':    { forceId: 'yuan-shao', cityId: 'pingyuan' },

  // ── Yuan Shu (Huainan) ──
  'yuan-shu':    { forceId: 'yuan-shu', cityId: 'shouchun' },
  'ji-ling':     { forceId: 'yuan-shu', cityId: 'lujiang' },
  'zhang-xun':   { forceId: 'yuan-shu', cityId: 'shouchun' },
  'yang-hong-ys':{ forceId: 'yuan-shu', cityId: 'shouchun' },

  // ── Gongsun Zan (still standing in the north despite Jieqiao) ──
  'gongsun-zan': { forceId: 'gongsun', cityId: 'beiping' },
  'tian-kai':    { forceId: 'gongsun', cityId: 'pingyuan' }, // pressed under siege
  'liu-bei':     { forceId: 'gongsun', cityId: 'pingyuan' }, // serving Gongsun
  'guan-yu':     { forceId: 'gongsun', cityId: 'pingyuan' },
  'zhang-fei':   { forceId: 'gongsun', cityId: 'pingyuan' },
  'zhao-yun':    { forceId: 'gongsun', cityId: 'beiping' }, // soon to leave
  'liu-yu':      { forceId: 'gongsun', cityId: 'beiping' }, // rival within You province
  'liu-he':      { forceId: 'gongsun', cityId: 'yuyang' },
  'xianyu-fu':   { forceId: 'gongsun', cityId: 'yuyang' },
  'yan-rou':     { forceId: 'gongsun', cityId: 'yi-county' },

  // ── Cao Cao (just made Governor of Yan after Bao Xin's death at Shouzhang) ──
  'cao-cao':     { forceId: 'cao', cityId: 'chenliu' },
  'cao-ren':     { forceId: 'cao', cityId: 'chenliu' },
  'cao-hong':    { forceId: 'cao', cityId: 'chenliu' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'puyang' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'chenliu' },
  'le-jin':      { forceId: 'cao', cityId: 'chenliu' },
  'li-dian':     { forceId: 'cao', cityId: 'chenliu' },
  'xun-yu':      { forceId: 'cao', cityId: 'chenliu' },
  'cheng-yu':    { forceId: 'cao', cityId: 'puyang' },
  'xi-zhicai':   { forceId: 'cao', cityId: 'chenliu' },
  'dian-wei':    { forceId: 'cao', cityId: 'chenliu' },
  'ren-jun':     { forceId: 'cao', cityId: 'chenliu' },

  // ── Liu Biao (Jing province) ──
  'liu-biao':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-liang':  { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-yue':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'cai-mao':     { forceId: 'liu-biao', cityId: 'xiangyang' },
  'huang-zu':    { forceId: 'liu-biao', cityId: 'jiangxia' },
  'wen-pin':     { forceId: 'liu-biao', cityId: 'jiangling' },
  'zhang-yun':   { forceId: 'liu-biao', cityId: 'xiangyang' },

  // ── Tao Qian (Xu province) ──
  'tao-qian':    { forceId: 'tao-qian', cityId: 'xiapi' },
  'cao-bao':     { forceId: 'tao-qian', cityId: 'xiapi' },
  'tao-shang':   { forceId: 'tao-qian', cityId: 'pengcheng' },
  'tao-ying':    { forceId: 'tao-qian', cityId: 'langya' },

  // ── Liu Yan (Yi province) ──
  'liu-yan':     { forceId: 'liu-yan', cityId: 'chengdu' },
  'liu-zhang':   { forceId: 'liu-yan', cityId: 'chengdu' },
  'liu-mao':     { forceId: 'liu-yan', cityId: 'jiangzhou' },
  'liu-fan':     { forceId: 'liu-yan', cityId: 'chengdu' }, // dies 194
  'zhang-ren':   { forceId: 'liu-yan', cityId: 'chengdu' },
  'yan-yan':     { forceId: 'liu-yan', cityId: 'jiangzhou' },
};

const DEAD_BY_192: string[] = [
  // Yellow Turban dead at 184
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'tang-zhou', 'cheng-yuanzhi', 'deng-mao', 'bu-ji', 'gao-sheng', 'huang-rang',
  'han-zhong-yt', 'zhao-hong-yt',
  // Han court figures dead before 192
  'liu-hong-em', 'wang-meiren', 'dong-taihou', 'he-jin', 'he-miao', 'zhang-rang',
  'jian-shuo', 'liu-bian', 'he-hou', 'dong-bai', 'wang-rui',
  // Anti-Dong coalition early dead
  'qiao-mao', 'he-yong', 'zou-jing',
  // Sun Jian just died at Xiangyang (191)
  'sun-jian', 'hua-xiong', 'bao-tao', 'gongsun-yue',
  // Liang frontier early
  'bian-zhang', 'beigong-boyu', 'fu-xie', 'huangfu-li', 'cheng-yi-lq',
  // Other early
  'kong-zhou', 'yuan-yi-yh', 'han-fu',
];

export const SCENARIO_192_WANGYUN: Scenario = {
  id: 'scn-192-wangyun',
  name: { en: "Wang Yun's Chain Plot", zh: '王允連環計' },
  kind: 'historical',
  description:
    'Spring 192 AD. Wang Yun, Minister of Works, has woven the most beautiful trap of the age — the ' +
    'dancer Diao Chan promised in turn to Dong Zhuo and to his foster son Lü Bu. The Flying General ' +
    "draws his halberd in the palace courtyard, and the tyrant of Mei falls in blood. Yet vengeance " +
    "rides hard from Shaanxi: Li Jue and Guo Si gather Dong's old army. Yuan Shao smashes Gongsun Zan at " +
    'Jieqiao; Cao Cao, newly Governor of Yan, gathers Yellow Turban remnants into the Qingzhou Corps; ' +
    'Sun Jian lies just slain at Xiangyang. The hour of the Han is brief, and dark.',
  descriptionZh: "公元192年春。司徒王允布連環之計，以歌伎貂蟬周旋於董卓、呂布父子之間。是日呂布於未央宮提戟而上，斬虐主於閤下。然西涼之兵未散——李傕、郭汜糾合舊部，欲為太師復仇，將再焚長安。河北界橋公孫瓚大敗於袁紹；曹操新領兗州牧，收青州黃巾為己用；江東猛虎孫堅方殞於襄陽。漢家氣數，將盡於此年。",
  startDate: { year: 192, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_192),
  forces: FORCES_192,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_192, DEAD_BY_192, 192),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 204 AD The Fall of Ye 鄴城陷落
// Cao Cao crowns three years of Hebei campaigning by taking Ye, the
// Yuan capital. Yuan Shao is two years dead; his sons tear at each
// other while Cao's wall closes. Sun Quan steadies Wu after his
// brother's death. Liu Bei, sheltering with Liu Biao at Xinye, still
// waits for the sleeping dragon.
// ──────────────────────────────────────────────────────────────────────

const FORCES_204: Force[] = [
  { id: 'cao',       name: { en: 'Cao Cao',      zh: '曹操軍'  }, rulerOfficerId: 'cao-cao',      capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'yuan-shang',name: { en: 'Yuan Shang',   zh: '袁尚軍'  }, rulerOfficerId: 'yuan-shang',   capitalCityId: 'ye',       color: '#b8442e', isPlayer: false },
  { id: 'yuan-tan',  name: { en: 'Yuan Tan',     zh: '袁譚軍'  }, rulerOfficerId: 'yuan-tan',     capitalCityId: 'pingyuan', color: '#c66442', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Quan',     zh: '孫權軍'  }, rulerOfficerId: 'sun-quan',     capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-biao',  name: { en: 'Liu Biao',     zh: '劉表軍'  }, rulerOfficerId: 'liu-biao',     capitalCityId: 'xiangyang',color: '#c19a3b', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',    zh: '劉璋軍'  }, rulerOfficerId: 'liu-zhang',    capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',      zh: '馬騰軍'  }, rulerOfficerId: 'ma-teng',      capitalCityId: 'wuwei',    color: '#a8703a', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',     zh: '張魯軍'  }, rulerOfficerId: 'zhang-lu',     capitalCityId: 'hanzhong', color: '#6b8a6b', isPlayer: false },
  { id: 'gongsun',   name: { en: 'Gongsun Kang', zh: '公孫康軍'}, rulerOfficerId: 'gongsun-kang', capitalCityId: 'liaodong', color: '#5a9bb8', isPlayer: false },
  { id: 'shi-xie',   name: { en: 'Shi Xie',      zh: '士燮軍'  }, rulerOfficerId: 'shi-xie',      capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
];

const CITY_OWNERSHIP_204: Record<string, string> = {
  // Cao Cao — central plain and most of Hebei after Ye
  xuchang:   'cao',
  luoyang:   'cao',
  chenliu:   'cao',
  runan:     'cao',
  guandu:    'cao',
  hulao:     'cao',
  puyang:    'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  xiaopei:   'cao',
  langya:    'cao',
  shouchun:  'cao',
  hefei:     'cao',
  lujiang:   'cao',
  wancheng:  'cao',
  bohai:     'cao',
  tongguan:  'cao',
  changan:   'cao',
  mei:       'cao',
  anding:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao', // Cao took during Gao Gan revolt year
  guangling: 'cao',
  // Yuan Shang — still holds Ye and the heart of Hebei (until summer)
  ye:        'yuan-shang',
  nanpi:     'yuan-shang',
  beihai:    'yuan-shang',
  yanmen:    'yuan-shang',
  // Yuan Tan — Pingyuan, openly at war with his brother
  pingyuan:  'yuan-tan',
  linzi:     'yuan-tan',
  // Gongsun Kang — Liaodong, succeeded Gongsun Du this year
  liaodong:  'gongsun',
  xiangping: 'gongsun',
  beiping:   'gongsun',
  'yi-county': 'gongsun',
  yuyang:    'gongsun',
  // Sun Quan — Jiangdong
  jianye:    'sun',
  wu:        'sun',
  wuxi:      'sun',
  kuaiji:    'sun',
  yuzhang:   'sun',
  // Liu Biao — Jing province
  xiangyang: 'liu-biao',
  xinye:     'liu-biao',
  jiangling: 'liu-biao',
  jiangxia:  'liu-biao',
  changsha:  'liu-biao',
  lingling:  'liu-biao',
  wuling:    'liu-biao',
  // Liu Zhang — Yi province
  chengdu:   'liu-zhang',
  yongan:    'liu-zhang',
  jiangzhou: 'liu-zhang',
  // Ma Teng / Han Sui — Liang
  wuwei:     'ma-teng',
  jincheng:  'ma-teng',
  // Zhang Lu — Hanzhong
  hanzhong:  'zhang-lu',
  // Shi Xie — Jiao
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
};

const OFFICER_ASSIGNMENTS_204: Record<string, { forceId: string; cityId: string }> = {
  // ── Cao Cao (closing the trench at Ye) ──
  'cao-cao':     { forceId: 'cao', cityId: 'ye' }, // present at the siege
  'cao-pi':      { forceId: 'cao', cityId: 'xuchang' }, // about to claim Lady Zhen
  'cao-ren':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-hong':    { forceId: 'cao', cityId: 'wancheng' },
  'cao-chun':    { forceId: 'cao', cityId: 'ye' }, // commander of the Tigers and Leopards
  'xiahou-dun':  { forceId: 'cao', cityId: 'puyang' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'changan' },
  'zhang-liao':  { forceId: 'cao', cityId: 'ye' },
  'yu-jin':      { forceId: 'cao', cityId: 'ye' },
  'le-jin':      { forceId: 'cao', cityId: 'ye' },
  'xu-huang':    { forceId: 'cao', cityId: 'ye' },
  'li-dian':     { forceId: 'cao', cityId: 'puyang' },
  'xu-chu':      { forceId: 'cao', cityId: 'xuchang' },
  'dian-wei':    { forceId: 'cao', cityId: 'xuchang' }, // d. 197 — auto-dead
  'zhang-he':    { forceId: 'cao', cityId: 'ye' }, // defected from Yuan at Guandu
  'gao-lan':     { forceId: 'cao', cityId: 'ye' }, // defected with Zhang He
  'pang-de':     { forceId: 'cao', cityId: 'changan' }, // still nominally Liang
  'man-chong':   { forceId: 'cao', cityId: 'xuchang' },
  'xun-yu':      { forceId: 'cao', cityId: 'xuchang' },
  'xun-you':     { forceId: 'cao', cityId: 'xuchang' },
  'guo-jia':     { forceId: 'cao', cityId: 'ye' },
  'cheng-yu':    { forceId: 'cao', cityId: 'xuchang' },
  'jia-xu':      { forceId: 'cao', cityId: 'xuchang' },
  'liu-ye':      { forceId: 'cao', cityId: 'xuchang' },
  'mao-jie':     { forceId: 'cao', cityId: 'xuchang' },
  'zhong-yao':   { forceId: 'cao', cityId: 'changan' }, // securing the west
  'chen-qun':    { forceId: 'cao', cityId: 'xuchang' },
  'sima-lang':   { forceId: 'cao', cityId: 'xuchang' },
  'cui-yan':     { forceId: 'cao', cityId: 'ye' }, // formerly Yuan, soon joins
  'liu-xie':     { forceId: 'cao', cityId: 'xuchang' }, // puppet emperor
  'dong-zhao':   { forceId: 'cao', cityId: 'xuchang' },

  // ── Yuan Shang (clinging to Ye against Cao's wall) ──
  'yuan-shang':  { forceId: 'yuan-shang', cityId: 'ye' },
  'shen-pei':    { forceId: 'yuan-shang', cityId: 'ye' }, // dies at Ye this year
  'feng-ji':     { forceId: 'yuan-shang', cityId: 'ye' }, // dies 202 actually — auto-dead
  'su-fei':      { forceId: 'yuan-shang', cityId: 'nanpi' }, // not yet — keep for atmosphere

  // ── Yuan Tan (splitting Hebei north of Bohai) ──
  'yuan-tan':    { forceId: 'yuan-tan', cityId: 'pingyuan' },
  'guo-tu':      { forceId: 'yuan-tan', cityId: 'pingyuan' },
  'xin-ping':    { forceId: 'yuan-tan', cityId: 'pingyuan' },
  'yuan-xi':     { forceId: 'yuan-tan', cityId: 'linzi' }, // governor of Youzhou, neutral leaning to Shang

  // ── Gongsun Kang (just took over Liaodong) ──
  'gongsun-kang':{ forceId: 'gongsun', cityId: 'liaodong' },
  'gongsun-gong':{ forceId: 'gongsun', cityId: 'xiangping' },

  // ── Sun Quan (Jiangdong, four years into rule) ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'sun-yi':      { forceId: 'sun', cityId: 'wu' }, // assassinated this year
  'sun-kuang':   { forceId: 'sun', cityId: 'wu' },
  'zhou-yu':     { forceId: 'sun', cityId: 'jianye' },
  'cheng-pu':    { forceId: 'sun', cityId: 'wu' },
  'huang-gai':   { forceId: 'sun', cityId: 'wu' },
  'han-dang':    { forceId: 'sun', cityId: 'yuzhang' },
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'taishi-ci':   { forceId: 'sun', cityId: 'wu' },
  'jiang-qin':   { forceId: 'sun', cityId: 'jianye' },
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },
  'zhang-hong':  { forceId: 'sun', cityId: 'jianye' },
  'gu-yong':     { forceId: 'sun', cityId: 'wu' },
  'lu-su':       { forceId: 'sun', cityId: 'jianye' }, // newly arrived
  'lu-meng':     { forceId: 'sun', cityId: 'jianye' },
  'ling-cao':    { forceId: 'sun', cityId: 'jianye' }, // d. 203 — auto-dead
  'ling-tong':   { forceId: 'sun', cityId: 'jianye' },
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'yu-fan':      { forceId: 'sun', cityId: 'jianye' },
  'wu-jing':     { forceId: 'sun', cityId: 'kuaiji' },

  // ── Liu Biao (Jing) ──
  'liu-biao':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'cai-mao':     { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-liang':  { forceId: 'liu-biao', cityId: 'xiangyang' },
  'kuai-yue':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'huang-zu':    { forceId: 'liu-biao', cityId: 'jiangxia' },
  'liu-qi':      { forceId: 'liu-biao', cityId: 'jiangxia' },
  'liu-cong':    { forceId: 'liu-biao', cityId: 'xiangyang' },
  'wen-pin':     { forceId: 'liu-biao', cityId: 'jiangling' },
  'huang-zhong': { forceId: 'liu-biao', cityId: 'changsha' },
  'wei-yan':     { forceId: 'liu-biao', cityId: 'xiangyang' },
  'liu-pan':     { forceId: 'liu-biao', cityId: 'changsha' },
  // Liu Bei sheltering at Xinye
  'liu-bei':     { forceId: 'liu-biao', cityId: 'xinye' },
  'guan-yu':     { forceId: 'liu-biao', cityId: 'xinye' },
  'zhang-fei':   { forceId: 'liu-biao', cityId: 'xinye' },
  'zhao-yun':    { forceId: 'liu-biao', cityId: 'xinye' },
  'mi-zhu':      { forceId: 'liu-biao', cityId: 'xinye' },
  'sun-qian':    { forceId: 'liu-biao', cityId: 'xinye' },
  'jian-yong':   { forceId: 'liu-biao', cityId: 'xinye' },

  // ── Liu Zhang (Yi) ──
  'liu-zhang':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'zhang-ren':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'yan-yan':     { forceId: 'liu-zhang', cityId: 'jiangzhou' },
  'huang-quan':  { forceId: 'liu-zhang', cityId: 'chengdu' },
  'wang-lei':    { forceId: 'liu-zhang', cityId: 'chengdu' },
  'liu-mao':     { forceId: 'liu-zhang', cityId: 'chengdu' },

  // ── Ma Teng / Han Sui ──
  'ma-teng':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-chao':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-dai':      { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-tie':      { forceId: 'ma-teng', cityId: 'wuwei' },
  'han-sui':     { forceId: 'ma-teng', cityId: 'jincheng' },

  // ── Zhang Lu ──
  'zhang-lu':    { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'yang-song':   { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'zhang-wei':   { forceId: 'zhang-lu', cityId: 'hanzhong' },

  // ── Shi Xie ──
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },
};

const DEAD_BY_204: string[] = [
  // 184 generation
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi', 'cai-yong',
  // Han eunuchs / court
  'zhang-rang', 'jian-shuo', 'he-jin', 'he-miao', 'liu-bian',
  // Dong Zhuo crew
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong', 'wang-yun', 'fan-chou', 'zhang-ji',
  'li-jue', 'guo-si', 'han-fu', 'bao-xin', 'yang-feng', 'han-xian',
  // Lü Bu crew
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'diaochan',
  // Sun Jian, Sun Ce
  'sun-jian', 'sun-ce',
  // Tao Qian
  'tao-qian', 'tao-shang', 'tao-ying', 'cao-bao',
  // Yuan Shao patriarch
  'yuan-shao', 'tian-feng', 'ju-shou', 'feng-ji',
  // Yuan Shu
  'yuan-shu', 'ji-ling',
  // Old Han ministers
  'liu-yu', 'liu-yan', 'gongsun-zan', 'gongsun-du', 'tian-kai',
  // Early warlords
  'zhang-yang', 'zhang-miao', 'zhang-chao', 'yan-baihu',
  // Cao early dead
  'cao-ang', 'cao-anmin', 'xi-zhicai', 'dian-wei',
];

export const SCENARIO_204_YECHENG: Scenario = {
  id: 'scn-204-yecheng',
  name: { en: 'The Fall of Ye', zh: '鄴城陷落' },
  kind: 'historical',
  description:
    'Summer 204 AD. Cao Cao has diverted the Zhang River around Ye, and the walls of the Yuan capital ' +
    "are crumbling. Yuan Shao has been two years in the grave; his sons Tan and Shang grind their teeth " +
    'at one another while the central army closes in. Cao Pi will find Lady Zhen in the burning house ' +
    'and take her for his own. In the south Sun Quan steadies the heir-stool his brother left him; in ' +
    "Jing province Liu Bei sleeps under Liu Biao's wing at Xinye, still without a strategist worthy of him.",
  descriptionZh: "公元204年夏。曹操決漳水以灌鄴城，袁氏故都垣牆既圮。袁本初崩於官渡之後二年，諸子譚、尚鬩牆於外，中軍合圍於內。曹丕將於焚宅中得甄氏而納之。江東孫權承兄業已四載；荊州劉備寄食劉景升之新野，臥龍未顯，求賢正切。",
  startDate: { year: 204, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_204),
  forces: FORCES_204,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_204, DEAD_BY_204, 204),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 213 AD Phoenix Falls at Luofeng 落鳳坡
// Liu Bei has crossed into Yi province. Pang Tong rides his master's
// White-Hooved horse to draw the arrows away — and dies pierced full
// at Luofeng Slope. Liu Bei calls for Zhuge Liang and Zhang Fei to
// march west from Jingzhou. Cao Cao battles Sun Quan at Ruxukou.
// Liu Zhang still holds Chengdu but every road bends against him.
// ──────────────────────────────────────────────────────────────────────

const FORCES_213: Force[] = [
  { id: 'cao',       name: { en: 'Cao Cao',    zh: '曹操軍' }, rulerOfficerId: 'cao-cao',   capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Quan',   zh: '孫權軍' }, rulerOfficerId: 'sun-quan',  capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-bei',   name: { en: 'Liu Bei',    zh: '劉備軍' }, rulerOfficerId: 'liu-bei',   capitalCityId: 'jiangling',color: '#a85d8a', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',  zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang', capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',   zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6b8a6b', isPlayer: false },
  { id: 'shi-xie',   name: { en: 'Shi Xie',    zh: '士燮軍' }, rulerOfficerId: 'shi-xie',   capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
];

const CITY_OWNERSHIP_213: Record<string, string> = {
  // Cao Cao — the north entire, plus Liang after Weinan, holding the Ruxu line
  xuchang:   'cao',
  luoyang:   'cao',
  chenliu:   'cao',
  runan:     'cao',
  wancheng:  'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  xiaopei:   'cao',
  guandu:    'cao',
  hulao:     'cao',
  puyang:    'cao',
  langya:    'cao',
  ye:        'cao',
  bohai:     'cao',
  beihai:    'cao',
  pingyuan:  'cao',
  linzi:     'cao',
  beiping:   'cao',
  liaodong:  'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  changan:   'cao',
  tongguan:  'cao',
  mei:       'cao',
  wuwei:     'cao',
  jincheng:  'cao',
  anding:    'cao',
  shouchun:  'cao',
  hefei:     'cao',
  lujiang:   'cao',
  guangling: 'cao',
  xinye:     'cao',
  xiangyang: 'cao',
  fancheng:  'cao',
  // Sun Quan — Jiangdong + east-of-Yangtze frontier
  jianye:    'sun',
  wu:        'sun',
  wuxi:      'sun',
  yuzhang:   'sun',
  jiangxia:  'sun',
  kuaiji:    'sun',
  changsha:  'sun', // Lu Su loan
  // Liu Bei — Jing (south four counties) + foothold in Yi
  jiangling: 'liu-bei',
  wuling:    'liu-bei',
  lingling:  'liu-bei',
  baqiu:     'liu-bei',
  yongan:    'liu-bei', // entry to Yi
  // Liu Zhang — Yi province, contracting
  chengdu:   'liu-zhang',
  jiangzhou: 'liu-zhang',
  baxi:      'liu-zhang',
  yinping:   'liu-zhang',
  // Zhang Lu — Hanzhong
  hanzhong:  'zhang-lu',
  wudu:      'zhang-lu',
  // Shi Xie — Jiao
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
};

const OFFICER_ASSIGNMENTS_213: Record<string, { forceId: string; cityId: string }> = {
  // ── Cao Cao (massing on the Yangtze) ──
  'cao-cao':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-pi':      { forceId: 'cao', cityId: 'ye' },
  'cao-zhi':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhang':   { forceId: 'cao', cityId: 'ye' },
  'cao-ren':     { forceId: 'cao', cityId: 'fancheng' },
  'cao-hong':    { forceId: 'cao', cityId: 'changan' },
  'cao-xiu':     { forceId: 'cao', cityId: 'hefei' },
  'cao-zhen':    { forceId: 'cao', cityId: 'changan' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'xuchang' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'changan' },
  'zhang-liao':  { forceId: 'cao', cityId: 'hefei' },
  'le-jin':      { forceId: 'cao', cityId: 'hefei' },
  'li-dian':     { forceId: 'cao', cityId: 'hefei' },
  'yu-jin':      { forceId: 'cao', cityId: 'wancheng' },
  'xu-huang':    { forceId: 'cao', cityId: 'changan' },
  'zhang-he':    { forceId: 'cao', cityId: 'changan' },
  'xu-chu':      { forceId: 'cao', cityId: 'xuchang' },
  'pang-de':     { forceId: 'cao', cityId: 'changan' },
  'zang-ba':     { forceId: 'cao', cityId: 'pengcheng' },
  'wen-pin':     { forceId: 'cao', cityId: 'xiangyang' },
  'man-chong':   { forceId: 'cao', cityId: 'runan' },
  'xun-you':     { forceId: 'cao', cityId: 'xuchang' },
  'jia-xu':      { forceId: 'cao', cityId: 'xuchang' },
  'cheng-yu':    { forceId: 'cao', cityId: 'xuchang' },
  'liu-ye':      { forceId: 'cao', cityId: 'xuchang' },
  'sima-yi':     { forceId: 'cao', cityId: 'ye' },
  'chen-qun':    { forceId: 'cao', cityId: 'xuchang' },
  'zhong-yao':   { forceId: 'cao', cityId: 'changan' },
  'hua-xin':     { forceId: 'cao', cityId: 'xuchang' },
  'wang-lang':   { forceId: 'cao', cityId: 'xuchang' },
  'hao-zhao':    { forceId: 'cao', cityId: 'mei' },
  'guo-huai':    { forceId: 'cao', cityId: 'changan' },
  'cai-wenji':   { forceId: 'cao', cityId: 'xuchang' },
  'liu-xie':     { forceId: 'cao', cityId: 'xuchang' },

  // ── Sun Quan ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'zhou-yu':     { forceId: 'sun', cityId: 'jianye' }, // d. 210, auto-dead
  'lu-su':       { forceId: 'sun', cityId: 'jianye' },
  'lu-meng':     { forceId: 'sun', cityId: 'jiangxia' },
  'gan-ning':    { forceId: 'sun', cityId: 'jiangxia' }, // hero of Ruxukou night raid this year
  'ling-tong':   { forceId: 'sun', cityId: 'wu' },
  'cheng-pu':    { forceId: 'sun', cityId: 'jianye' },
  'huang-gai':   { forceId: 'sun', cityId: 'wu' },
  'han-dang':    { forceId: 'sun', cityId: 'yuzhang' },
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'jiang-qin':   { forceId: 'sun', cityId: 'jianye' },
  'chen-wu':     { forceId: 'sun', cityId: 'jianye' },
  'dong-xi':     { forceId: 'sun', cityId: 'jianye' }, // d. 213 — drowned at Ruxukou
  'lu-xun':      { forceId: 'sun', cityId: 'jianye' },
  'zhu-ran':     { forceId: 'sun', cityId: 'jianye' },
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },
  'zhang-hong':  { forceId: 'sun', cityId: 'jianye' },
  'gu-yong':     { forceId: 'sun', cityId: 'jianye' },
  'yu-fan':      { forceId: 'sun', cityId: 'jianye' },
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'bu-zhi':      { forceId: 'sun', cityId: 'jianye' },

  // ── Liu Bei (split: leader in Yi, family in Jing) ──
  'liu-bei':     { forceId: 'liu-bei', cityId: 'yongan' }, // marching west; Pang Tong just died at Luofeng
  'huang-zhong': { forceId: 'liu-bei', cityId: 'yongan' },
  'wei-yan':     { forceId: 'liu-bei', cityId: 'yongan' },
  'pang-tong':   { forceId: 'liu-bei', cityId: 'yongan' }, // dies this season at Luofeng Slope
  'fa-zheng':    { forceId: 'liu-bei', cityId: 'yongan' }, // defector
  'meng-da':     { forceId: 'liu-bei', cityId: 'yongan' }, // defector
  'huo-jun':     { forceId: 'liu-bei', cityId: 'yongan' },
  // Marching reinforcements from Jingzhou
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'jiangling' }, // about to depart west
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'jiangling' },
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'jiangling' },
  // Garrisoning Jing
  'guan-yu':     { forceId: 'liu-bei', cityId: 'jiangling' },
  'guan-ping':   { forceId: 'liu-bei', cityId: 'jiangling' },
  'liu-feng':    { forceId: 'liu-bei', cityId: 'jiangling' },
  'mi-zhu':      { forceId: 'liu-bei', cityId: 'jiangling' },
  'mi-fang':     { forceId: 'liu-bei', cityId: 'jiangling' },
  'sun-qian':    { forceId: 'liu-bei', cityId: 'jiangling' },
  'jian-yong':   { forceId: 'liu-bei', cityId: 'jiangling' },
  'yi-ji':       { forceId: 'liu-bei', cityId: 'jiangling' },
  'liu-shan':    { forceId: 'liu-bei', cityId: 'jiangling' }, // 7 years old
  'liu-ba':      { forceId: 'liu-bei', cityId: 'jiangling' },
  'ma-liang':    { forceId: 'liu-bei', cityId: 'jiangling' },

  // ── Liu Zhang ──
  'liu-zhang':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'zhang-ren':   { forceId: 'liu-zhang', cityId: 'chengdu' }, // dies this year at Luocheng
  'yan-yan':     { forceId: 'liu-zhang', cityId: 'jiangzhou' },
  'huang-quan':  { forceId: 'liu-zhang', cityId: 'chengdu' },
  'wu-yi':       { forceId: 'liu-zhang', cityId: 'chengdu' },
  'liu-mao':     { forceId: 'liu-zhang', cityId: 'chengdu' },
  'gao-pei':     { forceId: 'liu-zhang', cityId: 'baxi' },
  'wang-lei':    { forceId: 'liu-zhang', cityId: 'chengdu' },
  'zhang-song':  { forceId: 'liu-zhang', cityId: 'chengdu' }, // just executed
  'liu-pan':     { forceId: 'liu-zhang', cityId: 'chengdu' },

  // ── Zhang Lu (Hanzhong) ──
  'zhang-lu':    { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'yang-song':   { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'zhang-wei':   { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'ma-chao':     { forceId: 'zhang-lu', cityId: 'hanzhong' }, // refugee
  'ma-dai':      { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'pang-de-ye':  { forceId: 'zhang-lu', cityId: 'hanzhong' },

  // ── Shi Xie ──
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },
};

const DEAD_BY_213: string[] = [
  // 184 era
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi', 'cai-yong',
  // Eunuchs / Han early
  'zhang-rang', 'jian-shuo', 'he-jin', 'he-miao', 'liu-bian',
  // Dong Zhuo crew
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong', 'wang-yun', 'fan-chou', 'zhang-ji',
  'han-fu', 'bao-xin', 'yang-feng', 'han-xian', 'li-jue', 'guo-si',
  // Lü Bu crew
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'diaochan',
  'chen-deng', 'chen-gui',
  // Yuan / early warlords
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'shen-pei', 'feng-ji', 'guo-tu', 'gao-lan',
  'yuan-shu', 'ji-ling',
  'sun-jian', 'sun-ce', 'tao-qian', 'tao-shang', 'tao-ying', 'cao-bao', 'sun-yi', 'sun-kuang',
  'kong-rong', 'gongsun-zan', 'gongsun-du', 'tian-kai', 'liu-yan', 'liu-yu',
  // Liang frontier rebels of 211 (Weinan)
  'cheng-yi', 'hou-xuan', 'liang-xing', 'yang-qiu', 'ma-wan', 'cheng-yin', 'li-kan',
  'zhang-heng-lw', 'ma-tie', 'ma-xiu',
  // Cao early dead
  'cao-ang', 'cao-anmin', 'dian-wei', 'xi-zhicai', 'guo-jia', 'xun-yu', 'cao-chun',
  // Sun early dead
  'sun-ce', 'taishi-ci', 'zhou-yu', 'ling-cao',
  // Misc
  'ma-teng', 'lady-gan', 'lady-mi',
];

export const SCENARIO_213_FENGPO: Scenario = {
  id: 'scn-213-fengpo',
  name: { en: 'Phoenix Falls', zh: '落鳳坡' },
  kind: 'historical',
  description:
    'Summer 213 AD. Liu Bei has marched up the Min River into Yi, his banner riding upon the back of ' +
    "Pang Tong's counsel. At Luofeng Slope the Phoenix Fledgling falls beneath a hail of arrows, " +
    "his master's white-hooved Hex Mark mistaken for the warlord himself. Liu Bei sends to Jingzhou for " +
    'Zhuge Liang, Zhang Fei, and Zhao Yun. To the east Cao Cao smashes at Sun Quan along the Ruxu lines; ' +
    'Gan Ning leads his hundred horsemen on a night raid that will be sung for centuries.',
  descriptionZh: "公元213年夏。劉備溯岷江入蜀，鳳雛龐統運籌帷幄。是日落鳳坡，伏兵齊發；張任之卒見的盧白馬，誤以為劉郎，亂箭如雨——士元殞落於斯。玄德傳檄荊州，召孔明、翼德、子龍引兵入川。江東濡須口風緊，曹孟德百萬南臨；甘興霸夜引百騎劫魏寨，名動千秋。",
  startDate: { year: 213, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_213),
  forces: FORCES_213,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_213, DEAD_BY_213, 213),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 221 AD Han Restored in Shu 蜀漢建國
// Cao Pi has accepted the abdication and declared Wei (220). In answer
// Liu Bei dons the imperial yellow at Wudan and proclaims himself Han.
// Three emperors now stand — but the eldest of them readies a great
// fleet for revenge on Wu. Zhang Fei lies dead at Langzhong, murdered
// by his own subordinates the night before they should have marched.
// ──────────────────────────────────────────────────────────────────────

const FORCES_221: Force[] = [
  { id: 'cao',     name: { en: 'Wei',          zh: '魏'      }, rulerOfficerId: 'cao-pi',   capitalCityId: 'luoyang', color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Han (Shu)',    zh: '漢(蜀)'  }, rulerOfficerId: 'liu-bei',  capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',           zh: '吳'      }, rulerOfficerId: 'sun-quan', capitalCityId: 'wuchang', color: '#2f8e6f', isPlayer: false },
  { id: 'shi-xie', name: { en: 'Shi Xie',      zh: '士燮'    }, rulerOfficerId: 'shi-xie',  capitalCityId: 'jiaozhi', color: '#5a8a3a', isPlayer: false },
  { id: 'xianbei', name: { en: 'Xianbei',      zh: '鮮卑'    }, rulerOfficerId: 'kebi-neng',capitalCityId: 'wuhuan',  color: '#7a5a3a', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',       zh: '南蛮'    }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning',color: '#6e8a2a', isPlayer: false },
];

const CITY_OWNERSHIP_221: Record<string, string> = {
  // Wei
  luoyang:   'cao',
  xuchang:   'cao',
  changan:   'cao',
  ye:        'cao',
  chenliu:   'cao',
  runan:     'cao',
  wancheng:  'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  xiaopei:   'cao',
  guandu:    'cao',
  hulao:     'cao',
  puyang:    'cao',
  langya:    'cao',
  bohai:     'cao',
  beihai:    'cao',
  pingyuan:  'cao',
  linzi:     'cao',
  beiping:   'cao',
  liaodong:  'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  tongguan:  'cao',
  mei:       'cao',
  wuwei:     'cao',
  jincheng:  'cao',
  anding:    'cao',
  tianshui:  'cao',
  shouchun:  'cao',
  hefei:     'cao',
  lujiang:   'cao',
  guangling: 'cao',
  xinye:     'cao',
  xiangyang: 'cao',
  fancheng:  'cao',
  // Han (Shu) — Yi + Hanzhong
  chengdu:   'liu-bei',
  yongan:    'liu-bei',
  jiangzhou: 'liu-bei',
  hanzhong:  'liu-bei',
  baxi:      'liu-bei',
  yinping:   'liu-bei',
  wudu:      'liu-bei',
  yangping:  'liu-bei',
  nanzhong:  'liu-bei',
  // Wu — Jiangdong + south of Jing
  jianye:    'sun',
  wuchang:   'sun', // capital just moved here under Sun Quan
  wu:        'sun',
  wuxi:      'sun',
  yuzhang:   'sun',
  jiangling: 'sun',
  jiangxia:  'sun',
  changsha:  'sun',
  wuling:    'sun',
  lingling:  'sun',
  guiyang:   'sun',
  // Shi Xie — Jiao
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
  // Xianbei
  wuhuan:    'xianbei',
  // Nanman
  jianning:  'nanman',
  yunnan:    'nanman',
  yongchang: 'nanman',
  yuexi:     'nanman',
};

const OFFICER_ASSIGNMENTS_221: Record<string, { forceId: string; cityId: string }> = {
  // ── Wei (Cao Pi as Emperor Wen) ──
  'cao-pi':      { forceId: 'cao', cityId: 'luoyang' },
  'cao-rui':     { forceId: 'cao', cityId: 'luoyang' }, // 17 years old, crown prince
  'cao-zhi':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhang':   { forceId: 'cao', cityId: 'ye' },
  'cao-ren':     { forceId: 'cao', cityId: 'wancheng' },
  'cao-xiu':     { forceId: 'cao', cityId: 'shouchun' },
  'cao-zhen':    { forceId: 'cao', cityId: 'changan' },
  'xiahou-shang':{ forceId: 'cao', cityId: 'xiangyang' },
  'xiahou-ba':   { forceId: 'cao', cityId: 'changan' },
  'xiahou-mao':  { forceId: 'cao', cityId: 'mei' },
  'xu-huang':    { forceId: 'cao', cityId: 'wancheng' },
  'zhang-liao':  { forceId: 'cao', cityId: 'hefei' },
  'zhang-he':    { forceId: 'cao', cityId: 'changan' },
  'yu-jin':      { forceId: 'cao', cityId: 'luoyang' }, // returned in shame, dies 221
  'man-chong':   { forceId: 'cao', cityId: 'shouchun' },
  'wen-pin':     { forceId: 'cao', cityId: 'wancheng' },
  'hao-zhao':    { forceId: 'cao', cityId: 'tongguan' },
  'zang-ba':     { forceId: 'cao', cityId: 'pengcheng' },
  'guo-huai':    { forceId: 'cao', cityId: 'changan' },
  'tian-yu':     { forceId: 'cao', cityId: 'beiping' },
  'sun-li':      { forceId: 'cao', cityId: 'tongguan' },
  'sima-yi':     { forceId: 'cao', cityId: 'luoyang' },
  'sima-shi':    { forceId: 'cao', cityId: 'luoyang' },
  'sima-zhao':   { forceId: 'cao', cityId: 'luoyang' },
  'jia-xu':      { forceId: 'cao', cityId: 'luoyang' },
  'liu-ye':      { forceId: 'cao', cityId: 'luoyang' },
  'chen-qun':    { forceId: 'cao', cityId: 'xuchang' },
  'liu-fang':    { forceId: 'cao', cityId: 'luoyang' },
  'sun-zi':      { forceId: 'cao', cityId: 'luoyang' },
  'jia-kui':     { forceId: 'cao', cityId: 'xiangyang' },
  'yang-fu':     { forceId: 'cao', cityId: 'changan' },
  'wang-su':     { forceId: 'cao', cityId: 'luoyang' },
  'hu-zhi':      { forceId: 'cao', cityId: 'pingyuan' },
  'hua-xin':     { forceId: 'cao', cityId: 'luoyang' },
  'wang-lang':   { forceId: 'cao', cityId: 'xuchang' },
  'zhong-yao':   { forceId: 'cao', cityId: 'luoyang' },
  'cai-wenji':   { forceId: 'cao', cityId: 'xuchang' },
  'liu-xie':     { forceId: 'cao', cityId: 'xuchang' }, // demoted to Duke of Shanyang
  'cao-shuang':  { forceId: 'cao', cityId: 'luoyang' },
  'wang-ling':   { forceId: 'cao', cityId: 'shouchun' },
  'guanqiu-jian':{ forceId: 'cao', cityId: 'luoyang' },

  // ── Han (Shu) — Liu Bei readies the eastern campaign ──
  'liu-bei':     { forceId: 'liu-bei', cityId: 'chengdu' }, // declared Emperor at Wudan
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-yong':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-li':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'chengdu' }, // Chancellor
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'yongan' }, // about to die at Langzhong, murdered
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'jiangzhou' }, // protests the campaign
  'ma-chao':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'ma-dai':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wei-yan':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wang-ping':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'liao-hua':    { forceId: 'liu-bei', cityId: 'yongan' },
  'guan-xing':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhang-bao':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'ma-liang':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'jian-yong':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'sun-qian':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'jiang-wan':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'fei-yi':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'dong-yun':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'li-yan':      { forceId: 'liu-bei', cityId: 'yongan' },
  'liu-ba':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'yang-yi':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'deng-zhi':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'huo-yi':      { forceId: 'liu-bei', cityId: 'yongan' },
  'yan-yan':     { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'wu-yi':       { forceId: 'liu-bei', cityId: 'chengdu' },
  'wu-ban':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'feng-xi':     { forceId: 'liu-bei', cityId: 'yongan' },
  'zhang-nan':   { forceId: 'liu-bei', cityId: 'yongan' },
  'fu-rong':     { forceId: 'liu-bei', cityId: 'yongan' },
  'cheng-ji-sh': { forceId: 'liu-bei', cityId: 'yongan' },
  'shamoke':     { forceId: 'liu-bei', cityId: 'wudu' }, // Wuxi tribesman ally
  'huang-quan':  { forceId: 'liu-bei', cityId: 'yongan' },
  'yi-ji':       { forceId: 'liu-bei', cityId: 'chengdu' },
  'qiao-zhou':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'chen-zhen':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'fan-jiang':   { forceId: 'liu-bei', cityId: 'yongan' }, // murderer of Zhang Fei
  'zhang-da-zf': { forceId: 'liu-bei', cityId: 'yongan' }, // murderer of Zhang Fei

  // ── Wu (Sun Quan, capital moved to Wuchang to face Liu Bei) ──
  'sun-quan':    { forceId: 'sun', cityId: 'wuchang' },
  'lu-xun':      { forceId: 'sun', cityId: 'jiangling' },
  'zhu-ran':     { forceId: 'sun', cityId: 'jiangling' },
  'pan-zhang':   { forceId: 'sun', cityId: 'wuling' },
  'han-dang':    { forceId: 'sun', cityId: 'wuchang' },
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },
  'xu-sheng-wu': { forceId: 'sun', cityId: 'jianye' },
  'sun-huan':    { forceId: 'sun', cityId: 'yiling' }, // tiger of Yiling, soon to fight Liu Bei
  'zhu-huan':    { forceId: 'sun', cityId: 'yuzhang' },
  'zhu-zhi':     { forceId: 'sun', cityId: 'wuxi' },
  'zhuge-jin':   { forceId: 'sun', cityId: 'wuchang' },
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },
  'gu-yong':     { forceId: 'sun', cityId: 'jianye' },
  'bu-zhi':      { forceId: 'sun', cityId: 'jianye' },
  'lu-dai':      { forceId: 'sun', cityId: 'yuzhang' },
  'he-qi':       { forceId: 'sun', cityId: 'changsha' },
  'quan-cong':   { forceId: 'sun', cityId: 'jianye' },
  'pan-jun':     { forceId: 'sun', cityId: 'wuling' },
  'yu-fan':      { forceId: 'sun', cityId: 'jianye' },
  'mi-fang':     { forceId: 'sun', cityId: 'jiangling' }, // defected last year
  'fu-shi-ren':  { forceId: 'sun', cityId: 'jiangling' },
  'sun-deng':    { forceId: 'sun', cityId: 'wuchang' }, // crown prince

  // ── Shi Xie ──
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },

  // ── Xianbei ──
  'kebi-neng':   { forceId: 'xianbei', cityId: 'wuhuan' },
  'budugen':     { forceId: 'xianbei', cityId: 'wuhuan' },

  // ── Nanman (Meng Huo just rising) ──
  'meng-huo':    { forceId: 'nanman', cityId: 'jianning' },
  'meng-you':    { forceId: 'nanman', cityId: 'yongchang' },
  'mangya-chang':{ forceId: 'nanman', cityId: 'jianning' },
  'zhu-rong':    { forceId: 'nanman', cityId: 'jianning' },
  'jinhuan-sanjie':{forceId: 'nanman', cityId: 'yongchang' },
};

const DEAD_BY_221: string[] = [
  // 184 wave
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi', 'cai-yong',
  // Han eunuchs / court
  'zhang-rang', 'jian-shuo', 'he-jin', 'he-miao', 'liu-bian',
  // Dong Zhuo crew
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong', 'wang-yun', 'fan-chou', 'zhang-ji',
  'han-fu', 'bao-xin', 'yang-feng', 'han-xian', 'li-jue', 'guo-si',
  // Lü Bu crew
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'diaochan',
  // Yuan family
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'yuan-shu', 'ji-ling',
  // Sun family early
  'sun-jian', 'sun-ce', 'tao-qian', 'cao-bao', 'sun-yi', 'sun-kuang',
  // Old warlords
  'kong-rong', 'gongsun-zan', 'gongsun-du', 'tian-kai', 'liu-yan', 'liu-yu',
  'liu-biao', 'liu-cong', 'liu-qi', 'cai-mao', 'zhang-yun', 'huang-zu', 'han-xuan', 'liu-du',
  // Liang
  'ma-teng', 'ma-tie', 'ma-xiu', 'han-sui', 'cheng-yi', 'hou-xuan', 'liang-xing', 'yang-qiu',
  'ma-wan', 'cheng-yin', 'li-kan',
  // Cao kin & strategists dead before 221
  'cao-cao', 'cao-ang', 'cao-anmin', 'dian-wei', 'xi-zhicai', 'guo-jia', 'xun-yu', 'xun-you',
  'cao-chun', 'le-jin', 'xiahou-yuan', 'xiahou-dun', 'cao-hong-dummy', 'pang-de',
  'yang-xiu', 'cheng-yu',
  // Sun crew dead before 221
  'zhou-yu', 'taishi-ci', 'lu-su', 'lu-meng', 'gan-ning', 'ling-tong', 'jiang-qin', 'cheng-pu',
  'huang-gai', 'zhou-tai-dummy', 'chen-wu', 'dong-xi', 'sun-shao',
  'zhou-fang-dummy',
  // Shu crew dead before 221
  'guan-yu', 'guan-ping', 'zhou-cang', 'pang-tong', 'fa-zheng', 'huang-zhong', 'liu-feng',
  'mi-zhu', 'lady-gan', 'lady-mi', 'lady-sun',
  // Liu Zhang & Hanzhong
  'liu-zhang', 'zhang-ren', 'zhang-song', 'wang-lei', 'liu-mao', 'liu-pan',
  'zhang-lu', 'yang-song', 'zhang-wei', 'pang-de-ye',
];

export const SCENARIO_221_SHU_EMPEROR: Scenario = {
  id: 'scn-221-shu-emperor',
  name: { en: 'Han Restored in Shu', zh: '蜀漢建國' },
  kind: 'historical',
  description:
    'Summer 221 AD. Cao Pi has taken the imperial yellow at Luoyang; in answer Liu Bei dons the same ' +
    'and proclaims the Han restored at Wudan in Chengdu. Three emperors now stand the realm at once — ' +
    "Wei in the north, Han-in-Shu in the west, and Sun Quan in Wu still styled King but the master of " +
    'the Yangtze. The Han Emperor readies the great fleet for vengeance: Guan Yu lies unavenged, ' +
    'Jingzhou lost. And then word comes from Langzhong — Zhang Fei is dead, slain in his sleep by ' +
    'two subordinates who fled east with his head.',
  descriptionZh: "公元221年夏。曹丕受漢禪稱魏帝；劉備不甘北望，遂於武擔之南即皇帝位，國號漢，是為昭烈帝。普天之下，三帝並立——魏據北方，漢承蜀地，吳王孫權雖未稱尊而坐擁江東。昭烈帝大集舟師，欲為雲長復仇、復取荊州。然閬中急報至：張翼德為帳下范疆、張達所弒，提首東奔。國仇家恨，盡聚此年。",
  startDate: { year: 221, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_221),
  forces: FORCES_221,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_221, DEAD_BY_221, 221),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 229 AD Three Emperors 三帝鼎立
// Sun Quan ascends to the imperial dignity at Wuchang, then moves his
// capital to Jianye. The three Han successors now all wear yellow.
// Cao Rui rules Wei from Luoyang. Liu Shan rules Shu with Zhuge Liang
// as the man behind the throne. The third Northern Expedition has just
// ended — Hanzhong holds, Chencang holds, the war goes on.
// ──────────────────────────────────────────────────────────────────────

const FORCES_229: Force[] = [
  { id: 'cao',     name: { en: 'Wei',       zh: '魏'    }, rulerOfficerId: 'cao-rui',   capitalCityId: 'luoyang', color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han',   zh: '蜀漢'  }, rulerOfficerId: 'liu-shan',  capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',        zh: '吳'    }, rulerOfficerId: 'sun-quan',  capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
  { id: 'xianbei', name: { en: 'Xianbei',   zh: '鮮卑'  }, rulerOfficerId: 'kebi-neng', capitalCityId: 'wuhuan',  color: '#7a5a3a', isPlayer: false },
  { id: 'gongsun', name: { en: 'Gongsun',   zh: '公孫'  }, rulerOfficerId: 'gongsun-yuan',capitalCityId: 'liaodong',color: '#5a9bb8', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',    zh: '南蛮'  }, rulerOfficerId: 'meng-huo',  capitalCityId: 'jianning',color: '#6e8a2a', isPlayer: false },
];

const CITY_OWNERSHIP_229: Record<string, string> = {
  // Wei
  luoyang:   'cao',
  xuchang:   'cao',
  changan:   'cao',
  ye:        'cao',
  chenliu:   'cao',
  runan:     'cao',
  wancheng:  'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  xiaopei:   'cao',
  guandu:    'cao',
  hulao:     'cao',
  puyang:    'cao',
  langya:    'cao',
  bohai:     'cao',
  beihai:    'cao',
  pingyuan:  'cao',
  linzi:     'cao',
  beiping:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  tongguan:  'cao',
  mei:       'cao',
  wuwei:     'cao',
  jincheng:  'cao',
  anding:    'cao',
  tianshui:  'cao', // recaptured after Jieting
  chencang:  'cao',
  shouchun:  'cao',
  hefei:     'cao',
  lujiang:   'cao',
  guangling: 'cao',
  xinye:     'cao',
  xiangyang: 'cao',
  fancheng:  'cao',
  yuyang:    'cao',
  'yi-county': 'cao',
  // Shu Han
  chengdu:   'liu-bei',
  yongan:    'liu-bei',
  jiangzhou: 'liu-bei',
  hanzhong:  'liu-bei',
  baxi:      'liu-bei',
  yinping:   'liu-bei',
  wudu:      'liu-bei', // taken in 3rd Northern Expedition this year
  yangping:  'liu-bei',
  nanzhong:  'liu-bei',
  yuexi:     'liu-bei',
  // Wu
  jianye:    'sun', // newly the capital
  wuchang:   'sun',
  wu:        'sun',
  wuxi:      'sun',
  yuzhang:   'sun',
  jiangling: 'sun',
  jiangxia:  'sun',
  changsha:  'sun',
  wuling:    'sun',
  lingling:  'sun',
  guiyang:   'sun',
  kuaiji:    'sun',
  jiaozhi:   'sun', // Shi Xie's son already brought to Jianye
  nanhai:    'sun',
  hepu:      'sun',
  // Xianbei
  wuhuan:    'xianbei',
  // Gongsun in Liaodong
  liaodong:  'gongsun',
  xiangping: 'gongsun',
  // Nanman residual
  jianning:  'nanman', // Meng Huo formally surrendered but tribal authority remains
  yunnan:    'nanman',
  yongchang: 'nanman',
};

const OFFICER_ASSIGNMENTS_229: Record<string, { forceId: string; cityId: string }> = {
  // ── Wei (Emperor Ming, Cao Rui) ──
  'cao-rui':     { forceId: 'cao', cityId: 'luoyang' },
  'cao-zhen':    { forceId: 'cao', cityId: 'changan' },
  'cao-yu':      { forceId: 'cao', cityId: 'luoyang' },
  'xiahou-ba':   { forceId: 'cao', cityId: 'changan' },
  'xiahou-mao':  { forceId: 'cao', cityId: 'mei' },
  'sima-yi':     { forceId: 'cao', cityId: 'wancheng' }, // commands Jingzhou front
  'sima-shi':    { forceId: 'cao', cityId: 'luoyang' },
  'sima-zhao':   { forceId: 'cao', cityId: 'luoyang' },
  'zhang-he':    { forceId: 'cao', cityId: 'changan' },
  'guo-huai':    { forceId: 'cao', cityId: 'changan' },
  'sun-li':      { forceId: 'cao', cityId: 'changan' },
  'man-chong':   { forceId: 'cao', cityId: 'shouchun' },
  'wen-pin':     { forceId: 'cao', cityId: 'jiangxia' }, // border-defender (actually no, Jiangxia is Wu post 222; keep Wen Pin in Wancheng)
  'hao-zhao':    { forceId: 'cao', cityId: 'chencang' }, // d. 229 — the man who held Chencang against Zhuge Liang
  'tian-yu':     { forceId: 'cao', cityId: 'beiping' },
  'qin-lang':    { forceId: 'cao', cityId: 'luoyang' },
  'liu-ye':      { forceId: 'cao', cityId: 'luoyang' },
  'chen-qun':    { forceId: 'cao', cityId: 'luoyang' },
  'liu-fang':    { forceId: 'cao', cityId: 'luoyang' },
  'sun-zi':      { forceId: 'cao', cityId: 'luoyang' },
  'jiang-ji':    { forceId: 'cao', cityId: 'luoyang' },
  'yang-fu':     { forceId: 'cao', cityId: 'changan' },
  'wang-su':     { forceId: 'cao', cityId: 'luoyang' },
  'hua-xin':     { forceId: 'cao', cityId: 'luoyang' },
  'zhong-yao':   { forceId: 'cao', cityId: 'luoyang' }, // d. 230, alive
  'cao-shuang':  { forceId: 'cao', cityId: 'luoyang' },
  'wang-ling':   { forceId: 'cao', cityId: 'shouchun' },
  'guanqiu-jian':{ forceId: 'cao', cityId: 'pengcheng' },
  'zhuge-dan':   { forceId: 'cao', cityId: 'luoyang' },
  'deng-ai':     { forceId: 'cao', cityId: 'xuchang' }, // young, just starting
  'zhong-hui':   { forceId: 'cao', cityId: 'luoyang' }, // child, born 225
  'chen-tai':    { forceId: 'cao', cityId: 'luoyang' },
  'fei-yao':     { forceId: 'cao', cityId: 'changan' },

  // ── Shu Han (the Northern Expeditions) ──
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-yong':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-li':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'hanzhong' }, // Chancellor at the front
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'hanzhong' }, // d. 229 — present at scenario start
  'wei-yan':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wang-ping':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'ma-dai':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'liao-hua':    { forceId: 'liu-bei', cityId: 'hanzhong' },
  'zhang-yi':    { forceId: 'liu-bei', cityId: 'hanzhong' },
  'ma-zhong':    { forceId: 'liu-bei', cityId: 'hanzhong' },
  'guan-xing':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhang-bao':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'jiang-wei':   { forceId: 'liu-bei', cityId: 'hanzhong' }, // defector in 228, now Zhuge Liang's prize student
  'jiang-wan':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'fei-yi':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'dong-yun':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'yang-yi':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'li-yan':      { forceId: 'liu-bei', cityId: 'yongan' },
  'deng-zhi':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'chen-zhen':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'huo-yi':      { forceId: 'liu-bei', cityId: 'yongan' },
  'yang-hong':   { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'wu-yi':       { forceId: 'liu-bei', cityId: 'chengdu' },
  'wu-ban':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'gou-fu':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'qiao-zhou':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'li-hui':      { forceId: 'liu-bei', cityId: 'nanzhong' }, // governor of Jianning post-Nanman pacification

  // ── Wu (Sun Quan declared Emperor at Wuchang, then moved to Jianye) ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'sun-deng':    { forceId: 'sun', cityId: 'jianye' }, // crown prince
  'lu-xun':      { forceId: 'sun', cityId: 'wuchang' }, // Grand Marshal, holds the west
  'zhuge-jin':   { forceId: 'sun', cityId: 'jiangling' },
  'lu-dai':      { forceId: 'sun', cityId: 'jiaozhi' }, // suppressed Shi clan
  'pan-zhang':   { forceId: 'sun', cityId: 'wuling' },
  'zhu-ran':     { forceId: 'sun', cityId: 'jiangling' },
  'zhu-huan':    { forceId: 'sun', cityId: 'lujiang' },
  'quan-cong':   { forceId: 'sun', cityId: 'jianye' },
  'sun-shao':    { forceId: 'sun', cityId: 'guangling' },
  'han-dang':    { forceId: 'sun', cityId: 'jianye' }, // d. 226 — auto-dead
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },
  'xu-sheng-wu': { forceId: 'sun', cityId: 'jianye' }, // d. 230, still alive
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },
  'gu-yong':     { forceId: 'sun', cityId: 'jianye' },
  'bu-zhi':      { forceId: 'sun', cityId: 'yuzhang' },
  'he-qi':       { forceId: 'sun', cityId: 'jianye' }, // d. 227 — auto-dead
  'pan-jun':     { forceId: 'sun', cityId: 'changsha' },
  'yu-fan':      { forceId: 'sun', cityId: 'jianye' },
  'zhuge-ke':    { forceId: 'sun', cityId: 'jianye' }, // young, brilliant
  'shi-yi':      { forceId: 'sun', cityId: 'jianye' },
  'zhang-cheng': { forceId: 'sun', cityId: 'jianye' },

  // ── Xianbei ──
  'kebi-neng':   { forceId: 'xianbei', cityId: 'wuhuan' },
  'budugen':     { forceId: 'xianbei', cityId: 'wuhuan' },

  // ── Gongsun Yuan (Liaodong) ──
  'gongsun-yuan':{ forceId: 'gongsun', cityId: 'liaodong' },
  'gongsun-gong':{ forceId: 'gongsun', cityId: 'xiangping' },

  // ── Nanman residual ──
  'meng-huo':    { forceId: 'nanman', cityId: 'jianning' },
  'meng-you':    { forceId: 'nanman', cityId: 'yongchang' },
  'zhu-rong':    { forceId: 'nanman', cityId: 'jianning' },
  'mangya-chang':{ forceId: 'nanman', cityId: 'jianning' },
};

const DEAD_BY_229: string[] = [
  // 184 wave — all gone
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi', 'cai-yong',
  // Han eunuchs / court
  'zhang-rang', 'jian-shuo', 'he-jin', 'he-miao', 'liu-bian',
  // Dong Zhuo crew
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong', 'wang-yun', 'fan-chou', 'zhang-ji',
  'han-fu', 'bao-xin', 'yang-feng', 'han-xian', 'li-jue', 'guo-si',
  // Lü Bu crew
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'diaochan',
  // Yuan family
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'yuan-shu', 'ji-ling',
  // Early Sun
  'sun-jian', 'sun-ce', 'sun-yi', 'sun-kuang', 'tao-qian',
  // Late-Han governors
  'kong-rong', 'gongsun-zan', 'gongsun-du', 'gongsun-kang', 'liu-yan', 'liu-yu',
  'liu-biao', 'liu-cong', 'liu-qi', 'cai-mao', 'zhang-yun', 'huang-zu',
  // Liang
  'ma-teng', 'ma-tie', 'ma-xiu', 'han-sui', 'cheng-yi', 'hou-xuan', 'liang-xing', 'yang-qiu',
  'ma-wan', 'cheng-yin', 'li-kan',
  // Wei era pre-229 deceased
  'cao-cao', 'cao-pi', 'cao-ang', 'dian-wei', 'xi-zhicai', 'guo-jia', 'xun-yu', 'xun-you',
  'xiahou-dun', 'xiahou-yuan', 'cao-ren', 'cao-zhang', 'cao-hong-dummy', 'cao-chun',
  'zhang-liao', 'xu-huang', 'yu-jin', 'le-jin', 'li-dian', 'pang-de',
  'jia-xu', 'jia-kui', 'cheng-yu', 'cao-xiu', 'wang-lang', 'wang-shuang',
  // Shu era pre-229 deceased
  'liu-bei', 'guan-yu', 'guan-ping', 'zhang-fei', 'huang-zhong', 'ma-chao', 'pang-tong',
  'fa-zheng', 'liu-feng', 'mi-zhu', 'mi-fang', 'sun-qian', 'jian-yong', 'ma-liang',
  'lady-gan', 'lady-mi', 'lady-sun', 'meng-da', 'shamoke', 'zhang-nan', 'feng-xi', 'fu-rong',
  'cheng-ji-sh', 'liu-ba',
  // Wu era pre-229 deceased
  'zhou-yu', 'taishi-ci', 'lu-su', 'lu-meng', 'gan-ning', 'ling-tong', 'jiang-qin',
  'cheng-pu', 'huang-gai', 'zhou-tai', 'chen-wu', 'dong-xi', 'han-dang', 'su-fei',
  'zhang-hong', 'zhou-fang-dummy',
  // Liu Zhang / Zhang Lu
  'liu-zhang', 'zhang-ren', 'zhang-song', 'wang-lei', 'liu-mao', 'liu-pan',
  'zhang-lu', 'yang-song', 'zhang-wei', 'pang-de-ye',
  // Shi Xie (d. 226)
  'shi-xie', 'shi-hui',
  // Yellow Turban remnants & Black Mountain
  'liu-pi', 'gong-du', 'pei-yuanshao', 'zhang-yan',
];

export const SCENARIO_229_THREE_EMPERORS: Scenario = {
  id: 'scn-229-three-emperors',
  name: { en: 'Three Emperors', zh: '三帝鼎立' },
  kind: 'historical',
  description:
    'Summer 229 AD. Sun Quan dons the imperial yellow at Wuchang, sacrifices to Heaven and Earth, ' +
    'and proclaims the Wu dynasty — then moves his capital downriver to Jianye. From this season the ' +
    "realm holds three sons of Han: Wei in Luoyang, Han-in-Shu in Chengdu, and Wu by the Yangtze. " +
    "Zhuge Liang's third northward campaign has just ended — Wudu and Yinping are his, but Chencang " +
    'held against him last winter. Zhao Yun, last of the Five Tiger Generals, is dying at Hanzhong.',
  descriptionZh: "公元229年夏。孫權於武昌設壇祭天，正位稱帝，國號吳，遂遷都建業。漢家三系並立——魏據洛京，蜀漢守成都，吳臨大江。諸葛丞相三出祁山方歸，雖取武都、陰平二郡，然郝伯道死守陳倉，蜀軍不能進。漢中營中老將子龍臥病，五虎之餘暉將熄。",
  startDate: { year: 229, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_229),
  forces: FORCES_229,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_229, DEAD_BY_229, 229),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 252 AD The Battle of Dongxing 東興之戰
// Sun Quan has died at last after fifty-two years of rule. The boy
// emperor Sun Liang sits the throne; the regent Zhuge Ke marches on
// the Wei dam at Dongxing and crushes a winter army of Sima Shi.
// Sima Yi is one year in his grave. Jiang Wei carries the war north
// each year, unable to break Wei but unable to stop trying.
// ──────────────────────────────────────────────────────────────────────

const FORCES_252: Force[] = [
  { id: 'cao',     name: { en: 'Wei',      zh: '魏'    }, rulerOfficerId: 'cao-fang',  capitalCityId: 'luoyang', color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han',  zh: '蜀漢'  }, rulerOfficerId: 'liu-shan',  capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',       zh: '吳'    }, rulerOfficerId: 'sun-liang', capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
];

const CITY_OWNERSHIP_252: Record<string, string> = {
  // Wei
  luoyang:   'cao',
  xuchang:   'cao',
  changan:   'cao',
  ye:        'cao',
  chenliu:   'cao',
  runan:     'cao',
  wancheng:  'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  xiaopei:   'cao',
  guandu:    'cao',
  hulao:     'cao',
  puyang:    'cao',
  langya:    'cao',
  bohai:     'cao',
  beihai:    'cao',
  pingyuan:  'cao',
  linzi:     'cao',
  beiping:   'cao',
  liaodong:  'cao', // taken from Gongsun Yuan 238
  xiangping: 'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  tongguan:  'cao',
  mei:       'cao',
  wuwei:     'cao',
  jincheng:  'cao',
  anding:    'cao',
  tianshui:  'cao',
  chencang:  'cao',
  longxi:    'cao',
  shouchun:  'cao',
  hefei:     'cao',
  lujiang:   'cao',
  guangling: 'cao',
  xinye:     'cao',
  xiangyang: 'cao',
  fancheng:  'cao',
  yuyang:    'cao',
  // Shu Han
  chengdu:   'liu-bei',
  yongan:    'liu-bei',
  jiangzhou: 'liu-bei',
  hanzhong:  'liu-bei',
  baxi:      'liu-bei',
  yinping:   'liu-bei',
  wudu:      'liu-bei',
  yangping:  'liu-bei',
  nanzhong:  'liu-bei',
  jianning:  'liu-bei', // pacified
  yunnan:    'liu-bei',
  yongchang: 'liu-bei',
  yuexi:     'liu-bei',
  // Wu
  jianye:    'sun',
  wuchang:   'sun',
  wu:        'sun',
  wuxi:      'sun',
  yuzhang:   'sun',
  jiangling: 'sun',
  jiangxia:  'sun',
  changsha:  'sun',
  wuling:    'sun',
  lingling:  'sun',
  guiyang:   'sun',
  kuaiji:    'sun',
  jiaozhi:   'sun',
  nanhai:    'sun',
  hepu:      'sun',
};

const OFFICER_ASSIGNMENTS_252: Record<string, { forceId: string; cityId: string }> = {
  // ── Wei (Cao Fang, with Sima Shi as the power) ──
  'cao-fang':    { forceId: 'cao', cityId: 'luoyang' },
  'cao-mao':     { forceId: 'cao', cityId: 'luoyang' }, // 11 years old
  'cao-huan':    { forceId: 'cao', cityId: 'luoyang' }, // 6 years old
  'sima-shi':    { forceId: 'cao', cityId: 'luoyang' }, // de facto ruler since 251
  'sima-zhao':   { forceId: 'cao', cityId: 'luoyang' },
  'sima-yan':    { forceId: 'cao', cityId: 'luoyang' }, // child
  'sima-fu':     { forceId: 'cao', cityId: 'luoyang' },
  'sima-wang':   { forceId: 'cao', cityId: 'luoyang' },
  'jia-chong':   { forceId: 'cao', cityId: 'luoyang' },
  'wang-su':     { forceId: 'cao', cityId: 'luoyang' },
  'wang-yuanji': { forceId: 'cao', cityId: 'luoyang' },
  'chen-tai':    { forceId: 'cao', cityId: 'longxi' }, // managing the western front
  'guo-huai':    { forceId: 'cao', cityId: 'changan' },
  'deng-ai':     { forceId: 'cao', cityId: 'tianshui' }, // rising
  'zhong-hui':   { forceId: 'cao', cityId: 'luoyang' }, // 27 years old
  'wang-ji':     { forceId: 'cao', cityId: 'xiangyang' },
  'wang-jing':   { forceId: 'cao', cityId: 'longxi' },
  'guanqiu-jian':{ forceId: 'cao', cityId: 'shouchun' }, // governor of Yangzhou; will rebel 255
  'zhuge-dan':   { forceId: 'cao', cityId: 'xiapi' }, // will rebel 257
  'wen-qin':     { forceId: 'cao', cityId: 'shouchun' },
  'wen-yang':    { forceId: 'cao', cityId: 'shouchun' }, // young, with his father
  'qin-lang':    { forceId: 'cao', cityId: 'luoyang' },
  'tian-yu':     { forceId: 'cao', cityId: 'beiping' }, // d. 252 — present at scenario start
  'xiahou-xuan': { forceId: 'cao', cityId: 'luoyang' },
  'gao-rou':     { forceId: 'cao', cityId: 'luoyang' },
  'lu-yu':       { forceId: 'cao', cityId: 'luoyang' },

  // ── Shu Han (Liu Shan with Jiang Wei chief general) ──
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-yong':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'fei-yi':      { forceId: 'liu-bei', cityId: 'chengdu' }, // Chancellor, assassinated 253
  'jiang-wei':   { forceId: 'liu-bei', cityId: 'hanzhong' }, // northern campaigns
  'liao-hua':    { forceId: 'liu-bei', cityId: 'hanzhong' },
  'zhang-yi':    { forceId: 'liu-bei', cityId: 'hanzhong' },
  'ma-zhong':    { forceId: 'liu-bei', cityId: 'nanzhong' },
  'zhuge-zhan':  { forceId: 'liu-bei', cityId: 'chengdu' }, // 25 years old
  'fan-jian':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'dong-jue':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'chen-zhi':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'huang-hao':   { forceId: 'liu-bei', cityId: 'chengdu' }, // eunuch favorite
  'huo-yi':      { forceId: 'liu-bei', cityId: 'nanzhong' },
  'luo-xian':    { forceId: 'liu-bei', cityId: 'yongan' },
  'fu-qian':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'qiao-zhou':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'xiahou-ba':   { forceId: 'liu-bei', cityId: 'hanzhong' }, // defected to Shu 249
  'fu-shi':      { forceId: 'liu-bei', cityId: 'hanzhong' }, // late Shu officer
  'meng-guang':  { forceId: 'liu-bei', cityId: 'chengdu' },

  // ── Wu (Sun Liang child emperor, Zhuge Ke regent) ──
  'sun-liang':   { forceId: 'sun', cityId: 'jianye' }, // child, 9 years old
  'sun-he':      { forceId: 'sun', cityId: 'jianye' }, // deposed crown prince
  'sun-xiu':     { forceId: 'sun', cityId: 'jianye' }, // future emperor
  'sun-hao':     { forceId: 'sun', cityId: 'jianye' }, // 10 years old
  'zhuge-ke':    { forceId: 'sun', cityId: 'jianye' }, // Grand Tutor, regent, will lead Dongxing victory
  'sun-jun':     { forceId: 'sun', cityId: 'jianye' }, // will murder Zhuge Ke 253
  'sun-lin':     { forceId: 'sun', cityId: 'jianye' }, // younger brother
  'lu-kang':     { forceId: 'sun', cityId: 'jiangling' }, // Lu Xun's son, the great young general
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' }, // hero of Dongxing
  'lu-mao':      { forceId: 'sun', cityId: 'jianye' },
  'lu-kai':      { forceId: 'sun', cityId: 'wuchang' },
  'liu-zan':     { forceId: 'sun', cityId: 'jianye' },
  'teng-yin':    { forceId: 'sun', cityId: 'jianye' }, // d. 256
  'zhu-yi-wu':   { forceId: 'sun', cityId: 'jianye' }, // d. 257
  'lu-dai':      { forceId: 'sun', cityId: 'jiaozhi' }, // d. 256
};

const DEAD_BY_252: string[] = [
  // 184 / Han eunuchs / Dong Zhuo / Lü Bu / Yuan / Sun Jian — all gone
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi', 'cai-yong',
  'zhang-rang', 'jian-shuo', 'he-jin', 'he-miao', 'liu-bian', 'liu-xie',
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong', 'wang-yun', 'fan-chou', 'zhang-ji',
  'han-fu', 'bao-xin', 'yang-feng', 'han-xian', 'li-jue', 'guo-si',
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'diaochan',
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'yuan-shu', 'ji-ling',
  'sun-jian', 'sun-ce', 'tao-qian', 'cao-bao', 'sun-yi', 'sun-kuang',
  'kong-rong', 'gongsun-zan', 'gongsun-du', 'gongsun-kang', 'gongsun-yuan',
  'liu-yan', 'liu-yu', 'tian-kai',
  'liu-biao', 'liu-cong', 'liu-qi', 'cai-mao', 'zhang-yun', 'huang-zu',
  'ma-teng', 'ma-tie', 'ma-xiu', 'han-sui', 'ma-chao', 'ma-dai',
  // Wei dead before 252
  'cao-cao', 'cao-pi', 'cao-rui', 'cao-ang', 'cao-anmin', 'dian-wei', 'guo-jia', 'xun-yu', 'xun-you',
  'xiahou-dun', 'xiahou-yuan', 'xiahou-shang', 'cao-ren', 'cao-zhang', 'cao-zhi', 'cao-hong-dummy',
  'cao-chun', 'cao-xiu', 'cao-zhen',
  'zhang-liao', 'xu-huang', 'yu-jin', 'le-jin', 'li-dian', 'xu-chu', 'pang-de', 'zhang-he',
  'jia-xu', 'jia-kui', 'cheng-yu', 'wang-lang', 'wang-shuang', 'hao-zhao',
  'cao-shuang', 'he-yan', 'deng-yang', 'ding-mi', 'huan-fan', 'bi-gui',
  'sima-yi', 'sima-lang', 'man-chong', 'tian-yu', 'sun-li', 'zang-ba', 'wen-pin',
  'zhong-yao', 'liu-ye', 'hua-xin',
  // Shu dead before 252
  'liu-bei', 'guan-yu', 'guan-ping', 'zhang-fei', 'huang-zhong', 'pang-tong', 'fa-zheng',
  'zhuge-liang', 'ma-su', 'wei-yan', 'liu-feng', 'mi-zhu', 'mi-fang',
  'lady-gan', 'lady-mi', 'lady-sun', 'meng-da', 'shamoke',
  'jiang-wan', 'deng-zhi', 'yang-yi', 'li-yan', 'wu-yi', 'wu-ban', 'yan-yan', 'huang-quan',
  'wang-ping', 'dong-yun', 'chen-zhen',
  'mi-zhu', 'sun-qian', 'jian-yong', 'ma-liang', 'liu-ba',
  // Wu dead before 252
  'sun-quan', 'sun-deng', 'sun-shao', 'sun-yi',
  'zhou-yu', 'lu-su', 'lu-meng', 'taishi-ci', 'cheng-pu', 'huang-gai', 'zhou-tai', 'han-dang',
  'gan-ning', 'ling-tong', 'jiang-qin', 'chen-wu', 'dong-xi', 'su-fei',
  'lu-xun', 'xu-sheng-wu', 'zhang-zhao', 'zhang-hong', 'he-qi',
  'pan-jun', 'pan-zhang', 'zhu-ran', 'yu-fan', 'zhuge-jin', 'zhou-fang', 'zhu-zhi',
  'gu-yong', 'bu-zhi', 'quan-cong',
  // Liu Zhang / Zhang Lu / Shi Xie / Nanman
  'liu-zhang', 'zhang-ren', 'zhang-song', 'wang-lei', 'liu-mao', 'liu-pan',
  'zhang-lu', 'yang-song', 'zhang-wei', 'pang-de-ye',
  'shi-xie', 'shi-hui',
  'meng-huo', 'meng-you', 'mangya-chang', 'jinhuan-sanjie', 'dongtu-na', 'ahui-nan', 'wutugu',
  'zhu-rong',
  // Xianbei
  'kebi-neng', 'budugen',
];

export const SCENARIO_252_DONGXING: Scenario = {
  id: 'scn-252-dongxing',
  name: { en: 'The Battle of Dongxing', zh: '東興之戰' },
  kind: 'historical',
  description:
    "Winter 252 AD. Sun Quan has died at last, after fifty-two years upon the throne of Wu. His " +
    'child-emperor Sun Liang takes the imperial seal; his Grand Tutor Zhuge Ke takes the army. ' +
    'Sima Yi is one winter in his grave, and Sima Shi rules at Luoyang. The Wei host marches south to ' +
    'breach the new Dongxing dam — and there, in the snow, Ding Feng leads a charge of bare-blade ' +
    'shock troops who shatter the imperial army on the river ice. In the west, Jiang Wei prepares his ' +
    'next northern probe, the war that will not end.',
  descriptionZh: "公元252年冬。江東吳大帝孫權崩，在位五十二年。幼帝孫亮即位，大將軍諸葛恪輔政。司馬仲達一年前已殂，其子司馬子元當權於洛京。是冬魏軍三路南下，欲攻新築之東興大堤。雪夜陣前，丁奉率短兵裸袒突陣，魏軍大潰於堤上冰河。西邊姜伯約整兵漢中，再謀北伐——干戈未息，三國猶在。",
  startDate: { year: 252, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_252),
  forces: FORCES_252,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_252, DEAD_BY_252, 252),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 264 AD Zhong Hui's Rebellion 鍾會之亂
// Shu has fallen the year before. Zhong Hui sits at Chengdu with the
// great army of the conquest. Jiang Wei whispers in his ear: declare
// yourself emperor, and I will restore the Han. Deng Ai, who took the
// realm by climbing a cliff, is held in suspicion. The plot will end
// in a barracks revolt; all three will lie dead by the end of spring.
// ──────────────────────────────────────────────────────────────────────

const FORCES_264: Force[] = [
  { id: 'cao',       name: { en: 'Wei (Sima)', zh: '魏(司馬)'}, rulerOfficerId: 'sima-zhao',  capitalCityId: 'luoyang', color: '#3a4d8a', isPlayer: false },
  { id: 'zhonghui',  name: { en: 'Zhong Hui',  zh: '鍾會軍'  }, rulerOfficerId: 'zhong-hui',  capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'dengai',    name: { en: 'Deng Ai',    zh: '鄧艾軍'  }, rulerOfficerId: 'deng-ai',    capitalCityId: 'jiangzhou',color: '#c19a3b', isPlayer: false },
  { id: 'sun',       name: { en: 'Wu',         zh: '吳'      }, rulerOfficerId: 'sun-hao',    capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
];

const CITY_OWNERSHIP_264: Record<string, string> = {
  // Wei loyalist (Sima Zhao) — heartland and frontiers
  luoyang:   'cao',
  xuchang:   'cao',
  changan:   'cao',
  ye:        'cao',
  chenliu:   'cao',
  runan:     'cao',
  wancheng:  'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  xiaopei:   'cao',
  guandu:    'cao',
  hulao:     'cao',
  puyang:    'cao',
  langya:    'cao',
  bohai:     'cao',
  beihai:    'cao',
  pingyuan:  'cao',
  linzi:     'cao',
  beiping:   'cao',
  liaodong:  'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  tongguan:  'cao',
  mei:       'cao',
  wuwei:     'cao',
  jincheng:  'cao',
  anding:    'cao',
  tianshui:  'cao',
  chencang:  'cao',
  longxi:    'cao',
  shouchun:  'cao',
  hefei:     'cao',
  lujiang:   'cao',
  guangling: 'cao',
  xinye:     'cao',
  xiangyang: 'cao',
  fancheng:  'cao',
  yuyang:    'cao',
  hanzhong:  'cao',
  yangping:  'cao',
  wudu:      'cao',
  yinping:   'cao',
  // Zhong Hui — Chengdu and the Shu basin he just conquered
  chengdu:   'zhonghui',
  yongan:    'zhonghui',
  baxi:      'zhonghui',
  // Deng Ai — at Jiangzhou with his own army, technically under arrest
  jiangzhou: 'dengai',
  nanzhong:  'dengai',
  jianning:  'dengai',
  yunnan:    'dengai',
  yongchang: 'dengai',
  yuexi:     'dengai',
  // Wu
  jianye:    'sun',
  wuchang:   'sun',
  wu:        'sun',
  wuxi:      'sun',
  yuzhang:   'sun',
  jiangling: 'sun',
  jiangxia:  'sun',
  changsha:  'sun',
  wuling:    'sun',
  lingling:  'sun',
  guiyang:   'sun',
  kuaiji:    'sun',
  jiaozhi:   'sun',
  nanhai:    'sun',
  hepu:      'sun',
};

const OFFICER_ASSIGNMENTS_264: Record<string, { forceId: string; cityId: string }> = {
  // ── Wei loyalist (Sima Zhao at Luoyang) ──
  'sima-zhao':   { forceId: 'cao', cityId: 'luoyang' }, // Duke of Jin
  'sima-yan':    { forceId: 'cao', cityId: 'luoyang' }, // heir, will found Jin
  'sima-you':    { forceId: 'cao', cityId: 'luoyang' },
  'sima-fu':     { forceId: 'cao', cityId: 'luoyang' },
  'sima-wang':   { forceId: 'cao', cityId: 'luoyang' },
  'sima-jun':    { forceId: 'cao', cityId: 'luoyang' },
  'sima-zhou':   { forceId: 'cao', cityId: 'xuchang' },
  'cao-huan':    { forceId: 'cao', cityId: 'luoyang' }, // puppet emperor
  'jia-chong':   { forceId: 'cao', cityId: 'luoyang' }, // ordered Cao Mao's murder 260
  'wang-yuanji': { forceId: 'cao', cityId: 'luoyang' },
  'pei-xiu':     { forceId: 'cao', cityId: 'luoyang' },
  'he-zeng':     { forceId: 'cao', cityId: 'luoyang' },
  'shi-bao':     { forceId: 'cao', cityId: 'pengcheng' },
  'wei-guan':    { forceId: 'cao', cityId: 'luoyang' }, // monitor sent to watch Zhong Hui, will kill Deng Ai
  'hu-lie':      { forceId: 'cao', cityId: 'changan' },
  'hu-fen':      { forceId: 'cao', cityId: 'luoyang' },
  'tian-xu':     { forceId: 'cao', cityId: 'changan' }, // sent to murder Deng Ai
  'qian-hong':   { forceId: 'cao', cityId: 'longxi' },
  'yang-hu':     { forceId: 'cao', cityId: 'xiangyang' }, // rising
  'du-yu':       { forceId: 'cao', cityId: 'luoyang' },
  'wang-jun':    { forceId: 'cao', cityId: 'ye' }, // rising fleet-builder
  'wang-rong':   { forceId: 'cao', cityId: 'luoyang' },
  'wang-hun':    { forceId: 'cao', cityId: 'shouchun' },
  'tang-bin':    { forceId: 'cao', cityId: 'luoyang' },
  'zhang-hua':   { forceId: 'cao', cityId: 'luoyang' },
  'wen-yang':    { forceId: 'cao', cityId: 'luoyang' }, // defected back to Wei after Zhuge Dan

  // ── Zhong Hui (at Chengdu, plotting empire) ──
  'zhong-hui':   { forceId: 'zhonghui', cityId: 'chengdu' },
  'jiang-wei':   { forceId: 'zhonghui', cityId: 'chengdu' }, // pretends to surrender, plots restoration
  'liao-hua':    { forceId: 'zhonghui', cityId: 'chengdu' }, // surrendered with Jiang Wei, dies this year
  'zhang-yi':    { forceId: 'zhonghui', cityId: 'chengdu' }, // captured with Jiang Wei, killed in revolt
  'jiang-shu-sh':{ forceId: 'zhonghui', cityId: 'chengdu' },
  'fu-shi':      { forceId: 'zhonghui', cityId: 'chengdu' }, // late Shu surrender
  'dong-jue':    { forceId: 'zhonghui', cityId: 'chengdu' },
  'fan-jian':    { forceId: 'zhonghui', cityId: 'chengdu' },
  'liu-shan':    { forceId: 'zhonghui', cityId: 'chengdu' }, // Shu emperor, surrendered, sent east
  'qiao-zhou':   { forceId: 'zhonghui', cityId: 'chengdu' }, // the surrenderist
  'huang-hao':   { forceId: 'zhonghui', cityId: 'chengdu' }, // dies this year

  // ── Deng Ai (Jiangzhou, accused) ──
  'deng-ai':     { forceId: 'dengai', cityId: 'jiangzhou' },
  'pang-hui':    { forceId: 'dengai', cityId: 'jiangzhou' }, // Pang De's son, with Deng Ai
  'huo-yi':      { forceId: 'dengai', cityId: 'nanzhong' }, // remained after surrender
  'luo-xian':    { forceId: 'dengai', cityId: 'yongan' }, // moved to dengai control nominally

  // ── Wu (Sun Hao, only months on the throne) ──
  'sun-hao':     { forceId: 'sun', cityId: 'jianye' },
  'lu-kang':     { forceId: 'sun', cityId: 'jiangling' },
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },
  'lu-kai':      { forceId: 'sun', cityId: 'wuchang' },
  'tao-huang':   { forceId: 'sun', cityId: 'jiaozhi' },
  'zhang-bu':    { forceId: 'sun', cityId: 'jianye' },
  'wang-fan':    { forceId: 'sun', cityId: 'jianye' },
  'huafu':       { forceId: 'sun', cityId: 'jianye' },
  'zhang-ti':    { forceId: 'sun', cityId: 'jianye' },
  'lu-jing':     { forceId: 'sun', cityId: 'jiangling' },
  'bu-chan':     { forceId: 'sun', cityId: 'jiangling' },
  'shen-ying':   { forceId: 'sun', cityId: 'jianye' },
  'teng-xiu':    { forceId: 'sun', cityId: 'jianye' },
};

const DEAD_BY_264: string[] = [
  // 184 / Han eunuchs / Dong Zhuo / Lü Bu / Yuan / early Sun — all gone long since
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi', 'cai-yong',
  'zhang-rang', 'jian-shuo', 'he-jin', 'he-miao', 'liu-bian', 'liu-xie',
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong', 'wang-yun', 'fan-chou', 'zhang-ji',
  'han-fu', 'bao-xin', 'yang-feng', 'han-xian', 'li-jue', 'guo-si',
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'diaochan',
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'yuan-shu', 'ji-ling',
  'sun-jian', 'sun-ce', 'tao-qian', 'cao-bao', 'sun-yi', 'sun-kuang',
  'kong-rong', 'gongsun-zan', 'gongsun-du', 'gongsun-kang', 'gongsun-yuan',
  'liu-yan', 'liu-yu', 'tian-kai',
  'liu-biao', 'liu-cong', 'liu-qi', 'cai-mao', 'zhang-yun', 'huang-zu',
  'ma-teng', 'ma-tie', 'ma-xiu', 'han-sui', 'ma-chao', 'ma-dai',
  // Wei first generation
  'cao-cao', 'cao-pi', 'cao-rui', 'cao-fang' /* abdicated 254 but alive */, 'cao-mao',
  'cao-ang', 'cao-anmin', 'dian-wei', 'guo-jia', 'xun-yu', 'xun-you',
  'xiahou-dun', 'xiahou-yuan', 'xiahou-shang', 'cao-ren', 'cao-zhang', 'cao-zhi',
  'cao-chun', 'cao-xiu', 'cao-zhen',
  'zhang-liao', 'xu-huang', 'yu-jin', 'le-jin', 'li-dian', 'xu-chu', 'pang-de', 'zhang-he',
  'jia-xu', 'jia-kui', 'cheng-yu', 'wang-lang', 'wang-shuang', 'hao-zhao',
  'cao-shuang', 'he-yan', 'deng-yang', 'ding-mi', 'huan-fan', 'bi-gui',
  'sima-yi', 'sima-shi', 'sima-lang', 'man-chong', 'tian-yu', 'sun-li', 'zang-ba', 'wen-pin',
  'zhong-yao', 'liu-ye', 'hua-xin', 'chen-qun',
  'wang-ling', 'guanqiu-jian', 'zhuge-dan', 'wen-qin',
  'xiahou-xuan', 'li-feng', 'xiahou-mao', 'xiahou-ba', 'guo-huai', 'chen-tai',
  'wang-jing', 'wang-su', 'jiang-ji',
  // Shu — most gone by 263
  'liu-bei', 'guan-yu', 'guan-ping', 'zhang-fei', 'huang-zhong', 'pang-tong', 'fa-zheng',
  'zhuge-liang', 'ma-su', 'wei-yan', 'liu-feng', 'mi-zhu', 'mi-fang',
  'lady-gan', 'lady-mi', 'lady-sun', 'meng-da', 'shamoke',
  'jiang-wan', 'deng-zhi', 'yang-yi', 'li-yan', 'wu-yi', 'wu-ban', 'yan-yan', 'huang-quan',
  'wang-ping', 'dong-yun', 'chen-zhen', 'fei-yi',
  'sun-qian', 'jian-yong', 'ma-liang', 'liu-ba', 'ma-zhong', 'zhuge-zhan', 'zhuge-shang',
  'fu-qian', 'zhang-zun', 'zhao-guang', 'liu-chen', 'lai-min', 'huo-jun',
  // Wu deaths before 264
  'sun-quan', 'sun-deng', 'sun-shao', 'sun-yi', 'sun-he', 'sun-liang',
  'zhou-yu', 'lu-su', 'lu-meng', 'taishi-ci', 'cheng-pu', 'huang-gai', 'zhou-tai', 'han-dang',
  'gan-ning', 'ling-tong', 'jiang-qin', 'chen-wu', 'dong-xi', 'su-fei',
  'lu-xun', 'xu-sheng-wu', 'zhang-zhao', 'zhang-hong', 'he-qi',
  'pan-jun', 'pan-zhang', 'zhu-ran', 'yu-fan', 'zhuge-jin', 'zhou-fang', 'zhu-zhi',
  'gu-yong', 'bu-zhi', 'quan-cong', 'zhuge-ke', 'sun-jun', 'sun-lin',
  'zhu-huan', 'lu-dai', 'teng-yin', 'zhu-yi-wu', 'lu-mao',
  // Liu Zhang / Zhang Lu / Shi Xie / Nanman / Xianbei
  'liu-zhang', 'zhang-ren', 'zhang-song', 'wang-lei', 'liu-mao', 'liu-pan',
  'zhang-lu', 'yang-song', 'zhang-wei', 'pang-de-ye',
  'shi-xie', 'shi-hui',
  'meng-huo', 'meng-you', 'mangya-chang', 'jinhuan-sanjie', 'dongtu-na', 'ahui-nan', 'wutugu',
  'zhu-rong',
  'kebi-neng', 'budugen',
];

export const SCENARIO_264_ZHONGHUI: Scenario = {
  id: 'scn-264-zhonghui',
  name: { en: "Zhong Hui's Rebellion", zh: '鍾會之亂' },
  kind: 'historical',
  description:
    "Spring 264 AD. Shu has fallen — Liu Shan surrendered last winter, his city opened by " +
    "Qiao Zhou's pen. Zhong Hui now sits at Chengdu with the army that took the realm; Jiang Wei, the " +
    "captive general, whispers in his ear that he should declare himself King of Yi and restore the Han. " +
    "Deng Ai, who took the empire by climbing a cliff, is in chains. Sima Zhao at Luoyang has sent Wei Guan " +
    "and a quiet army westward. By spring's end the barracks at Chengdu will mutiny; Zhong Hui, Jiang Wei, " +
    "and Deng Ai will all lie dead. Wu under Sun Hao watches in dread.",
  descriptionZh: "公元264年春。蜀漢已亡——昨冬譙周勸降，後主出城受縛。鍾士季坐成都，握平蜀大軍；姜伯約佯降而懷異志，密勸鍾會稱益州王，曰：「事成則漢家可興」。鄧士載入綿竹之奇，繫於檻車。司馬子上於洛陽復遣衛伯玉提兵入蜀。是春兵變於成都，鍾、姜、鄧三人皆殞於亂軍。江東孫皓初即位，聞之大震。",
  startDate: { year: 264, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_264),
  forces: FORCES_264,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_264, DEAD_BY_264, 264),
};

// ──────────────────────────────────────────────────────────────────────
// Scenario — 265 AD Sima Yan Founds Jin 司馬炎篡魏
// Sima Zhao dies in the autumn. His son Sima Yan compels Cao Huan to
// abdicate; the Wei dynasty ends in December. The Jin dynasty begins.
// Wu under Sun Hao grows ever crueler. On the frontier Du Yu, Wang Jun,
// and Yang Hu are building the ships and the men who will, fifteen
// years later, finally take the south.
// ──────────────────────────────────────────────────────────────────────

const FORCES_265: Force[] = [
  { id: 'sima',    name: { en: 'Jin',       zh: '晉'    }, rulerOfficerId: 'sima-yan',  capitalCityId: 'luoyang', color: '#3a4d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',        zh: '吳'    }, rulerOfficerId: 'sun-hao',   capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
];

const CITY_OWNERSHIP_265: Record<string, string> = {
  // Jin (almost everywhere)
  luoyang:   'sima',
  xuchang:   'sima',
  changan:   'sima',
  ye:        'sima',
  chenliu:   'sima',
  runan:     'sima',
  wancheng:  'sima',
  pengcheng: 'sima',
  xiapi:     'sima',
  xiaopei:   'sima',
  guandu:    'sima',
  hulao:     'sima',
  puyang:    'sima',
  langya:    'sima',
  bohai:     'sima',
  beihai:    'sima',
  pingyuan:  'sima',
  linzi:     'sima',
  beiping:   'sima',
  liaodong:  'sima',
  xiangping: 'sima',
  yanmen:    'sima',
  shangdang: 'sima',
  taiyuan:   'sima',
  tongguan:  'sima',
  mei:       'sima',
  wuwei:     'sima',
  jincheng:  'sima',
  anding:    'sima',
  tianshui:  'sima',
  chencang:  'sima',
  longxi:    'sima',
  shouchun:  'sima',
  hefei:     'sima',
  lujiang:   'sima',
  guangling: 'sima',
  xinye:     'sima',
  xiangyang: 'sima',
  fancheng:  'sima',
  yuyang:    'sima',
  hanzhong:  'sima',
  yangping:  'sima',
  wudu:      'sima',
  yinping:   'sima',
  chengdu:   'sima', // conquered Shu
  yongan:    'sima',
  jiangzhou: 'sima',
  baxi:      'sima',
  nanzhong:  'sima',
  jianning:  'sima',
  yunnan:    'sima',
  yongchang: 'sima',
  yuexi:     'sima',
  // Wu (still holding the south)
  jianye:    'sun',
  wuchang:   'sun',
  wu:        'sun',
  wuxi:      'sun',
  yuzhang:   'sun',
  jiangling: 'sun',
  jiangxia:  'sun',
  changsha:  'sun',
  wuling:    'sun',
  lingling:  'sun',
  guiyang:   'sun',
  kuaiji:    'sun',
  jiaozhi:   'sun',
  nanhai:    'sun',
  hepu:      'sun',
};

const OFFICER_ASSIGNMENTS_265: Record<string, { forceId: string; cityId: string }> = {
  // ── Jin (Sima Yan, just received the abdication) ──
  'sima-yan':    { forceId: 'sima', cityId: 'luoyang' }, // Emperor Wu of Jin
  'sima-you':    { forceId: 'sima', cityId: 'luoyang' },
  'sima-fu':     { forceId: 'sima', cityId: 'luoyang' }, // venerable elder, refused to bow
  'sima-wang':   { forceId: 'sima', cityId: 'luoyang' },
  'sima-jun':    { forceId: 'sima', cityId: 'luoyang' },
  'sima-zhou':   { forceId: 'sima', cityId: 'xiapi' },
  'wang-yuanji': { forceId: 'sima', cityId: 'luoyang' }, // empress dowager
  'jia-chong':   { forceId: 'sima', cityId: 'luoyang' }, // chancellor
  'pei-xiu':     { forceId: 'sima', cityId: 'luoyang' },
  'pei-kai':     { forceId: 'sima', cityId: 'luoyang' },
  'he-zeng':     { forceId: 'sima', cityId: 'luoyang' },
  'shi-bao':     { forceId: 'sima', cityId: 'shouchun' }, // Grand Marshal
  'wei-guan':    { forceId: 'sima', cityId: 'luoyang' },
  'du-yu':       { forceId: 'sima', cityId: 'xiangyang' }, // future conqueror of Wu
  'yang-hu':     { forceId: 'sima', cityId: 'xiangyang' }, // future architect of pacification
  'wang-jun':    { forceId: 'sima', cityId: 'ye' }, // future fleet builder
  'wang-hun':    { forceId: 'sima', cityId: 'shouchun' },
  'wang-rong':   { forceId: 'sima', cityId: 'luoyang' },
  'zhang-hua':   { forceId: 'sima', cityId: 'luoyang' }, // scholar minister
  'tang-bin':    { forceId: 'sima', cityId: 'luoyang' },
  'hu-fen':      { forceId: 'sima', cityId: 'luoyang' },
  'hu-lie':      { forceId: 'sima', cityId: 'changan' },
  'hu-yuan':     { forceId: 'sima', cityId: 'changan' },
  'qian-hong':   { forceId: 'sima', cityId: 'longxi' },
  'wen-yang':    { forceId: 'sima', cityId: 'longxi' },
  'shi-chong':   { forceId: 'sima', cityId: 'luoyang' },
  'wang-kai-jin':{ forceId: 'sima', cityId: 'luoyang' },
  'cao-huan':    { forceId: 'sima', cityId: 'ye' }, // demoted to Prince of Chenliu after abdication
  // Late Shu survivors absorbed
  'liu-shan':    { forceId: 'sima', cityId: 'luoyang' }, // Duke of Anle, comfortable captivity
  'qiao-zhou':   { forceId: 'sima', cityId: 'luoyang' },
  'huo-yi':      { forceId: 'sima', cityId: 'nanzhong' }, // governor of southern Shu
  'luo-xian':    { forceId: 'sima', cityId: 'yongan' }, // held against Wu
  'fan-jian':    { forceId: 'sima', cityId: 'chengdu' },
  'dong-jue':    { forceId: 'sima', cityId: 'chengdu' },
  'chen-shou':   { forceId: 'sima', cityId: 'luoyang' }, // historian of the three kingdoms
  'wang-shen':   { forceId: 'sima', cityId: 'luoyang' },
  // Bamboo Grove sages — survivors only (Ji Kang and Ruan Ji both died 263)
  'shan-tao':    { forceId: 'sima', cityId: 'luoyang' },
  'liu-ling':    { forceId: 'sima', cityId: 'luoyang' },
  'xiang-xiu':   { forceId: 'sima', cityId: 'luoyang' },
  'ruan-xian':   { forceId: 'sima', cityId: 'luoyang' },

  // ── Wu (Sun Hao, two years into his cruel reign) ──
  'sun-hao':     { forceId: 'sun', cityId: 'jianye' },
  'lu-kang':     { forceId: 'sun', cityId: 'jiangling' }, // last shield of Wu
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' }, // d. 271
  'lu-kai':      { forceId: 'sun', cityId: 'wuchang' }, // d. 269
  'tao-huang':   { forceId: 'sun', cityId: 'jiaozhi' },
  'teng-xiu':    { forceId: 'sun', cityId: 'guangling' },
  'wang-fan':    { forceId: 'sun', cityId: 'jianye' },
  'huafu':       { forceId: 'sun', cityId: 'jianye' },
  'he-ding':     { forceId: 'sun', cityId: 'jianye' },
  'zhang-ti':    { forceId: 'sun', cityId: 'jianye' }, // Wu chancellor at the end
  'lu-jing':     { forceId: 'sun', cityId: 'jiangling' },
  'shen-ying':   { forceId: 'sun', cityId: 'jianye' },
  'bu-chan':     { forceId: 'sun', cityId: 'xiling' }, // governor of Xiling, will defect 272
  'xue-xu':      { forceId: 'sun', cityId: 'jiaozhi' },
  'tao-jun':     { forceId: 'sun', cityId: 'wuchang' },
  'sun-xin':     { forceId: 'sun', cityId: 'jiangling' },
  'zhuge-jing-2':{ forceId: 'sun', cityId: 'jianye' },
  'lu-ji':       { forceId: 'sun', cityId: 'wu' }, // child of Lu Kang
  'lu-yun-jin':  { forceId: 'sun', cityId: 'wu' }, // child
};

const DEAD_BY_265: string[] = [
  // 184 and Han wave — all gone long since
  'zhang-jiao', 'zhang-bao-yt', 'zhang-liang-yt', 'bo-cai', 'ma-yuanyi', 'sun-zhong',
  'huangfu-song', 'zhu-jun', 'lu-zhi', 'cai-yong',
  'zhang-rang', 'jian-shuo', 'he-jin', 'he-miao', 'liu-bian', 'liu-xie',
  'dong-zhuo', 'li-ru', 'hua-xiong', 'niu-fu', 'xu-rong', 'wang-yun', 'fan-chou', 'zhang-ji',
  'han-fu', 'bao-xin', 'yang-feng', 'han-xian', 'li-jue', 'guo-si',
  'lu-bu', 'chen-gong', 'gao-shun', 'cao-xing', 'song-xian', 'hou-cheng', 'wei-xu', 'diaochan',
  'yuan-shao', 'yuan-tan', 'yuan-shang', 'yuan-xi', 'yan-liang', 'wen-chou', 'tian-feng', 'ju-shou',
  'yuan-shu', 'ji-ling',
  'sun-jian', 'sun-ce', 'tao-qian', 'cao-bao', 'sun-yi', 'sun-kuang',
  'kong-rong', 'gongsun-zan', 'gongsun-du', 'gongsun-kang', 'gongsun-yuan',
  'liu-yan', 'liu-yu', 'tian-kai',
  'liu-biao', 'liu-cong', 'liu-qi', 'cai-mao', 'zhang-yun', 'huang-zu',
  'ma-teng', 'ma-tie', 'ma-xiu', 'han-sui', 'ma-chao', 'ma-dai',
  // Wei
  'cao-cao', 'cao-pi', 'cao-rui', 'cao-mao',
  'cao-ang', 'cao-anmin', 'dian-wei', 'guo-jia', 'xun-yu', 'xun-you',
  'xiahou-dun', 'xiahou-yuan', 'xiahou-shang', 'cao-ren', 'cao-zhang', 'cao-zhi',
  'cao-chun', 'cao-xiu', 'cao-zhen',
  'zhang-liao', 'xu-huang', 'yu-jin', 'le-jin', 'li-dian', 'xu-chu', 'pang-de', 'zhang-he',
  'jia-xu', 'jia-kui', 'cheng-yu', 'wang-lang', 'wang-shuang', 'hao-zhao',
  'cao-shuang', 'he-yan', 'deng-yang', 'ding-mi', 'huan-fan', 'bi-gui',
  'sima-yi', 'sima-shi', 'sima-zhao', 'sima-lang', 'man-chong', 'tian-yu', 'sun-li', 'zang-ba', 'wen-pin',
  'zhong-yao', 'liu-ye', 'hua-xin', 'chen-qun',
  'wang-ling', 'guanqiu-jian', 'zhuge-dan', 'wen-qin',
  'xiahou-xuan', 'li-feng', 'xiahou-mao', 'xiahou-ba', 'guo-huai', 'chen-tai',
  'wang-jing', 'wang-su', 'jiang-ji', 'gao-rou',
  'deng-ai', 'zhong-hui',
  // Shu
  'liu-bei', 'guan-yu', 'guan-ping', 'zhang-fei', 'huang-zhong', 'pang-tong', 'fa-zheng',
  'zhuge-liang', 'ma-su', 'wei-yan', 'liu-feng', 'mi-zhu', 'mi-fang',
  'lady-gan', 'lady-mi', 'lady-sun', 'meng-da', 'shamoke',
  'jiang-wan', 'deng-zhi', 'yang-yi', 'li-yan', 'wu-yi', 'wu-ban', 'yan-yan', 'huang-quan',
  'wang-ping', 'dong-yun', 'chen-zhen', 'fei-yi',
  'sun-qian', 'jian-yong', 'ma-liang', 'liu-ba', 'ma-zhong',
  'jiang-wei', 'liao-hua', 'zhang-yi', 'zhuge-zhan', 'zhuge-shang',
  'fu-qian', 'zhang-zun', 'zhao-guang', 'liu-chen', 'lai-min',
  'liu-yong', 'liu-li',
  // Wu
  'sun-quan', 'sun-deng', 'sun-shao', 'sun-he', 'sun-liang', 'sun-xiu',
  'zhou-yu', 'lu-su', 'lu-meng', 'taishi-ci', 'cheng-pu', 'huang-gai', 'zhou-tai', 'han-dang',
  'gan-ning', 'ling-tong', 'jiang-qin', 'chen-wu', 'dong-xi', 'su-fei',
  'lu-xun', 'xu-sheng-wu', 'zhang-zhao', 'zhang-hong', 'he-qi',
  'pan-jun', 'pan-zhang', 'zhu-ran', 'yu-fan', 'zhuge-jin', 'zhou-fang', 'zhu-zhi',
  'gu-yong', 'bu-zhi', 'quan-cong', 'zhuge-ke', 'sun-jun', 'sun-lin',
  'zhu-huan', 'lu-dai', 'teng-yin', 'zhu-yi-wu', 'lu-mao',
  // Liu Zhang / Zhang Lu / Shi Xie / Nanman / Xianbei
  'liu-zhang', 'zhang-ren', 'zhang-song', 'wang-lei', 'liu-mao', 'liu-pan',
  'zhang-lu', 'yang-song', 'zhang-wei', 'pang-de-ye',
  'shi-xie', 'shi-hui',
  'meng-huo', 'meng-you', 'mangya-chang', 'jinhuan-sanjie', 'dongtu-na', 'ahui-nan', 'wutugu',
  'zhu-rong',
  'kebi-neng', 'budugen',
  // Bamboo Grove martyrs already
  'ji-kang', 'ruan-ji',
];

export const SCENARIO_265_JIN_FOUNDED: Scenario = {
  id: 'scn-265-jin-founded',
  name: { en: 'Sima Yan Founds Jin', zh: '司馬炎篡魏' },
  kind: 'historical',
  description:
    'Winter 265 AD. Sima Zhao has died in the autumn before fulfilling his ambition. His son Sima Yan ' +
    'completes the work: he compels the boy emperor Cao Huan to abdicate, and on the twelfth month, twelfth ' +
    'day, declares the Jin dynasty at Luoyang. The Wei that Cao Cao built ends forty-five years after it ' +
    'began. To the south Sun Hao grows daily more cruel, his lords whispering of omens. On the Jin frontier ' +
    'Yang Hu and Du Yu are quietly preparing the south-bound army. Wang Jun is already laying the ' +
    'keels of the great river-fleet at Yizhou. Fifteen years of waiting begin.',
  descriptionZh: "公元265年冬。司馬子上薨於秋；其子司馬炎承父志，是年十二月乙卯，逼魏元帝曹奐禪位，定國號曰晉，都洛陽。曹孟德所創之魏，立國四十五年而終。江左孫皓暴戾日甚，群臣震慄，言讖緯者眾。晉之南陲，羊叔子、杜元凱緩兵蓄銳，撫荊襄民心；王士治於益州造船伐木，密謀順流之師。十五年之等待，自此始。",
  startDate: { year: 265, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_265),
  forces: FORCES_265,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_265, DEAD_BY_265, 265),
};

// ──────────────────────────────────────────────────────────────────────
// What-If Scenario A — Autumn 220 AD 「關羽守住荊州」 Guan Yu Holds Jingzhou
// Lü Meng's white-cloak surprise attack failed. Guan Yu still commands
// the full breadth of Jingzhou. The Wei–Wu alliance is broken; Shu Han
// stands at the height of its territorial reach. Sun Quan, humiliated,
// has lost Lü Meng to illness and now stares across the Yangtze at a
// vengeful Liu Bei.
// ──────────────────────────────────────────────────────────────────────

const FORCES_GUANYU_JING: Force[] = [
  { id: 'cao',     name: { en: 'Wei',     zh: '魏'   }, rulerOfficerId: 'cao-pi',   capitalCityId: 'luoyang',  color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han', zh: '蜀漢' }, rulerOfficerId: 'liu-bei',  capitalCityId: 'chengdu',  color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',      zh: '吳'   }, rulerOfficerId: 'sun-quan', capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'shi-xie', name: { en: 'Shi Xie', zh: '士燮' }, rulerOfficerId: 'shi-xie',  capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',  zh: '南蠻' }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning', color: '#6e8a2a', isPlayer: false },
  { id: 'xianbei', name: { en: 'Xianbei', zh: '鮮卑' }, rulerOfficerId: 'kebi-neng',capitalCityId: 'wuhuan',   color: '#7a5a3a', isPlayer: false },
];

const CITY_OWNERSHIP_GUANYU_JING: Record<string, string> = {
  // Wei — sprawling northern + central + Liang empire (no Jing except Xinye/Fancheng border)
  xuchang:   'cao',
  luoyang:   'cao',
  wancheng:  'cao',
  chenliu:   'cao',
  runan:     'cao',
  pingyuan:  'cao',
  ye:        'cao',
  bohai:     'cao',
  beihai:    'cao',
  beiping:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  shouchun:  'cao',
  changan:   'cao',
  hefei:     'cao',
  liaodong:  'cao',
  xinye:     'cao',
  guandu:    'cao',
  hulao:     'cao',
  tongguan:  'cao',
  linzi:     'cao',
  lujiang:   'cao',
  jincheng:  'cao',
  wuwei:     'cao',
  anding:    'cao',
  mei:       'cao',
  fancheng:  'cao',
  // Shu Han — Yi + Hanzhong + full Jingzhou (Guan Yu's domain)
  chengdu:   'liu-bei',
  yongan:    'liu-bei',
  jiangzhou: 'liu-bei',
  hanzhong:  'liu-bei',
  wudu:      'liu-bei',
  yangping:  'liu-bei',
  xiangyang: 'liu-bei', // Guan Yu took it after Fan Castle (in this timeline)
  jiangling: 'liu-bei',
  changsha:  'liu-bei',
  wuling:    'liu-bei',
  lingling:  'liu-bei',
  guiyang:   'liu-bei',
  jiangxia:  'liu-bei',
  maicheng:  'liu-bei', // Where Guan Yu would have died — now his stronghold
  // Wu — Jiangdong only; no Jing province inland
  jianye:    'sun',
  wu:        'sun',
  wuxi:      'sun',
  yuzhang:   'sun',
  kuaiji:    'sun',
  chaisang:  'sun',
  // Shi Xie — Jiao
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
  // Nanman — Meng Huo's tribes
  jianning:  'nanman',
  yunnan:    'nanman',
  yongchang: 'nanman',
  yuexi:     'nanman',
  // Xianbei — Kebi Neng's confederacy
  wuhuan:    'xianbei',
};

const OFFICER_ASSIGNMENTS_GUANYU_JING: Record<string, { forceId: string; cityId: string }> = {
  // ── Wei (Cao Pi just declared the dynasty) ──
  'cao-pi':      { forceId: 'cao', cityId: 'luoyang' },
  'cao-zhi':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhang':   { forceId: 'cao', cityId: 'ye' },
  'cao-ren':     { forceId: 'cao', cityId: 'fancheng' },
  'cao-xiu':     { forceId: 'cao', cityId: 'shouchun' },
  'cao-zhen':    { forceId: 'cao', cityId: 'changan' },
  'cao-hong':    { forceId: 'cao', cityId: 'luoyang' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'luoyang' },
  'xiahou-shang':{ forceId: 'cao', cityId: 'wancheng' },
  'xiahou-ba':   { forceId: 'cao', cityId: 'changan' },
  'xiahou-mao':  { forceId: 'cao', cityId: 'mei' },
  'xu-huang':    { forceId: 'cao', cityId: 'fancheng' },
  'zhang-liao':  { forceId: 'cao', cityId: 'hefei' },
  'zhang-he':    { forceId: 'cao', cityId: 'ye' },
  'yu-jin':      { forceId: 'cao', cityId: 'wancheng' }, // released after Lu Meng's death
  'le-jin':      { forceId: 'cao', cityId: 'shouchun' }, // died 218 — will be auto-dead
  'li-dian':     { forceId: 'cao', cityId: 'shouchun' }, // died 209 — auto-dead
  'man-chong':   { forceId: 'cao', cityId: 'shouchun' },
  'hao-zhao':    { forceId: 'cao', cityId: 'tongguan' },
  'pang-de':     { forceId: 'cao', cityId: 'fancheng' }, // captured by Guan Yu in real history — here he lives
  'zang-ba':     { forceId: 'cao', cityId: 'pengcheng' },
  'wen-pin':     { forceId: 'cao', cityId: 'xinye' },
  'guo-huai':    { forceId: 'cao', cityId: 'changan' },
  'sun-li':      { forceId: 'cao', cityId: 'tongguan' },
  'tian-yu':     { forceId: 'cao', cityId: 'beiping' },
  'sima-yi':     { forceId: 'cao', cityId: 'luoyang' },
  'sima-shi':    { forceId: 'cao', cityId: 'luoyang' },
  'sima-zhao':   { forceId: 'cao', cityId: 'luoyang' },
  'jia-xu':      { forceId: 'cao', cityId: 'luoyang' },
  'liu-ye':      { forceId: 'cao', cityId: 'luoyang' },
  'chen-qun':    { forceId: 'cao', cityId: 'xuchang' },
  'jia-kui':     { forceId: 'cao', cityId: 'wancheng' },
  'yang-fu':     { forceId: 'cao', cityId: 'changan' },
  'cai-wenji':   { forceId: 'cao', cityId: 'xuchang' },
  'wang-ling':   { forceId: 'cao', cityId: 'shouchun' },
  'lady-zhen':   { forceId: 'cao', cityId: 'ye' },
  'empress-bian':{ forceId: 'cao', cityId: 'luoyang' },

  // ── Shu Han (Liu Bei at peak — Guan Yu lives, Zhang Fei lives) ──
  'liu-bei':     { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-feng':    { forceId: 'liu-bei', cityId: 'shangyong' },
  'liu-yong':    { forceId: 'liu-bei', cityId: 'chengdu' },
  // ── Wuhu generals: all alive ──
  'guan-yu':     { forceId: 'liu-bei', cityId: 'jiangling' }, // commanding Jingzhou
  'guan-ping':   { forceId: 'liu-bei', cityId: 'xiangyang' },
  'guan-xing':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'guan-suo':    { forceId: 'liu-bei', cityId: 'maicheng' },
  'zhou-cang':   { forceId: 'liu-bei', cityId: 'maicheng' },
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'yongan' },
  'zhang-bao':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'ma-chao':     { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'ma-dai':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'huang-zhong': { forceId: 'liu-bei', cityId: 'changsha' }, // historically d. 220 — kept since premise is Jing held
  'wei-yan':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wang-ping':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'liao-hua':    { forceId: 'liu-bei', cityId: 'maicheng' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'chengdu' },
  'pang-tong':   { forceId: 'liu-bei', cityId: 'chengdu' }, // d. 214 — will be auto-dead
  'fa-zheng':    { forceId: 'liu-bei', cityId: 'chengdu' }, // d. 220 — kept since description says he died
  'ma-liang':    { forceId: 'liu-bei', cityId: 'jiangling' },
  'ma-su':       { forceId: 'liu-bei', cityId: 'hanzhong' },
  'jiang-wan':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'fei-yi':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'dong-yun':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'jian-yong':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'sun-qian':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'mi-zhu':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'liu-ba':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'li-yan':      { forceId: 'liu-bei', cityId: 'yongan' },
  'yang-yi':     { forceId: 'liu-bei', cityId: 'hanzhong' },
  'deng-zhi':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'huo-yi':      { forceId: 'liu-bei', cityId: 'yongan' },
  'yan-yan':     { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'wu-yi':       { forceId: 'liu-bei', cityId: 'chengdu' },
  'wu-ban':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'yang-hong':   { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'meng-da':     { forceId: 'liu-bei', cityId: 'yongan' }, // still loyal since no Guan Yu defeat to defect over
  'lady-huang':  { forceId: 'liu-bei', cityId: 'chengdu' }, // Huang Yueying

  // ── Wu (Sun Quan thwarted — Lu Meng dead, no Jingzhou gains) ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'lu-xun':      { forceId: 'sun', cityId: 'chaisang' },
  'zhou-tai':    { forceId: 'sun', cityId: 'jianye' },
  'han-dang':    { forceId: 'sun', cityId: 'wu' },
  'gan-ning':    { forceId: 'sun', cityId: 'jianye' }, // d. 220 — kept
  'jiang-qin':   { forceId: 'sun', cityId: 'wu' },     // d. 219 — auto-dead
  'pan-zhang':   { forceId: 'sun', cityId: 'yuzhang' },
  'zhu-ran':     { forceId: 'sun', cityId: 'jianye' },
  'zhu-huan':    { forceId: 'sun', cityId: 'yuzhang' },
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },
  'xu-sheng-wu': { forceId: 'sun', cityId: 'jianye' },
  'he-qi':       { forceId: 'sun', cityId: 'kuaiji' },
  'lu-dai':      { forceId: 'sun', cityId: 'yuzhang' },
  'quan-cong':   { forceId: 'sun', cityId: 'jianye' },
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' },
  'zhang-zhao':  { forceId: 'sun', cityId: 'jianye' },
  'gu-yong':     { forceId: 'sun', cityId: 'jianye' },
  'bu-zhi':      { forceId: 'sun', cityId: 'wuxi' },
  'yu-fan':      { forceId: 'sun', cityId: 'jianye' },
  'lady-sun':    { forceId: 'sun', cityId: 'jianye' }, // returned to Wu when alliance soured

  // ── Shi Xie ──
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },

  // ── Nanman ──
  'meng-huo':    { forceId: 'nanman', cityId: 'jianning' },
  'meng-you':    { forceId: 'nanman', cityId: 'yongchang' },
  'mangya-chang':{ forceId: 'nanman', cityId: 'jianning' },
  'jinhuan-sanjie':{forceId:'nanman', cityId: 'yongchang' },
  'dongtu-na':   { forceId: 'nanman', cityId: 'yunnan' },
  'ahui-nan':    { forceId: 'nanman', cityId: 'yunnan' },
  'wutugu':      { forceId: 'nanman', cityId: 'yuexi' },
  'zhu-rong':    { forceId: 'nanman', cityId: 'jianning' },

  // ── Xianbei ──
  'kebi-neng':   { forceId: 'xianbei', cityId: 'wuhuan' },
  'budugen':     { forceId: 'xianbei', cityId: 'wuhuan' },
};

// In this what-if, Lü Meng STILL died of his illness in 220 (the surprise
// attack failure didn't change his health). Guan Yu and Zhang Fei,
// however, both live. Most other 220-era deaths stand.
const DEAD_BY_GUANYU_JING: string[] = [
  'lu-meng', // illness 220 — dies regardless of the failed attack
  // All standard pre-220 deaths handled by scenarioYear=220 auto-cull.
];

export const SCENARIO_WHATIF_GUANYU_JING: Scenario = {
  id: 'scn-whatif-guanyu-jing',
  name: { en: 'Guan Yu Holds Jingzhou', zh: '關羽守住荊州' },
  kind: 'whatif',
  description:
    'Autumn 220 AD — a world where the white-cloak crossing failed. Guan Yu detected Lü Meng\'s ' +
    'ruse, fortified Jiangling, and held all of Jingzhou. Cao Pi has just received Emperor Xian\'s ' +
    'abdication and declared Wei. Lü Meng, vexed and ill, has died in Jianye. Sun Quan stares west ' +
    'at a vengeful Liu Bei whose Han now stretches unbroken from Hanzhong to the Yangtze.',
  descriptionZh: "公元220年秋——白衣渡江功敗垂成之世。關羽識破呂蒙詭計，固守江陵，盡保荊襄。曹丕受漢獻帝禪讓，方建魏室。呂蒙憂憤成疾，病歿於建業。孫權西望，而劉備之漢自漢中綿延至大江，雲長坐鎮荊州，磨刀以待。",
  startDate: { year: 220, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_GUANYU_JING),
  forces: FORCES_GUANYU_JING,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_GUANYU_JING, DEAD_BY_GUANYU_JING, 220),
};

// ──────────────────────────────────────────────────────────────────────
// What-If Scenario B — Spring 240 AD 「諸葛亮活到八十」 Zhuge Liang Lives
// Zhuge Liang did not fall at Wuzhang in 234. He recovered, took
// Chang'an in 238, and forced Wei to a treaty. Sima Yi finished
// Liaodong but Wei has been broken in the west. Sun Quan still rules
// Wu, aging. Liu Shan reigns under his Prime Minister's iron hand.
// ──────────────────────────────────────────────────────────────────────

const FORCES_ZHUGE_LIVES: Force[] = [
  { id: 'cao',     name: { en: 'Wei',     zh: '魏'   }, rulerOfficerId: 'cao-rui',   capitalCityId: 'ye',      color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han', zh: '蜀漢' }, rulerOfficerId: 'liu-shan',  capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',      zh: '吳'   }, rulerOfficerId: 'sun-quan',  capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
];

const CITY_OWNERSHIP_ZHUGE_LIVES: Record<string, string> = {
  // Shu Han — Yi + Hanzhong + Liang + western Sili (Chang'an taken in 238)
  chengdu:   'liu-bei',
  yongan:    'liu-bei',
  jiangzhou: 'liu-bei',
  hanzhong:  'liu-bei',
  wudu:      'liu-bei',
  yangping:  'liu-bei',
  jincheng:  'liu-bei',
  wuwei:     'liu-bei',
  anding:    'liu-bei',
  tianshui:  'liu-bei',
  chencang:  'liu-bei',
  changan:   'liu-bei', // taken 238
  mei:       'liu-bei',
  tongguan:  'liu-bei',
  // Wei — eastern half (lost Luoyang briefly but recovered; Ye is new capital)
  ye:        'cao',
  luoyang:   'cao',
  xuchang:   'cao',
  chenliu:   'cao',
  wancheng:  'cao',
  runan:     'cao',
  pingyuan:  'cao',
  bohai:     'cao',
  beihai:    'cao',
  beiping:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  shouchun:  'cao',
  hefei:     'cao',
  hulao:     'cao',
  linzi:     'cao',
  lujiang:   'cao',
  liaodong:  'cao', // conquered 238 by Sima Yi (Gongsun Yuan executed)
  xinye:     'cao',
  guandu:    'cao',
  fancheng:  'cao',
  xiangyang: 'cao',
  // Wu — Jiangdong + Jing south
  jianye:    'sun',
  wu:        'sun',
  wuxi:      'sun',
  yuzhang:   'sun',
  changsha:  'sun',
  jiangling: 'sun',
  jiangxia:  'sun',
  wuling:    'sun',
  lingling:  'sun',
  guiyang:   'sun',
  kuaiji:    'sun',
  chaisang:  'sun',
  // Jiao now under Wu's pacification (Lü Dai's campaign post-Shi Xie)
  jiaozhi:   'sun',
  nanhai:    'sun',
  hepu:      'sun',
};

const OFFICER_ASSIGNMENTS_ZHUGE_LIVES: Record<string, { forceId: string; cityId: string }> = {
  // ── Shu Han (Zhuge Liang at the height of victory, age 60) ──
  'liu-shan':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'changan' }, // the new western capital
  'jiang-wei':   { forceId: 'liu-bei', cityId: 'tianshui' },
  'wei-yan':     { forceId: 'liu-bei', cityId: 'hanzhong' }, // d. 234 — but Zhuge's survival means he wasn't purged
  'ma-dai':      { forceId: 'liu-bei', cityId: 'hanzhong' },
  'wang-ping':   { forceId: 'liu-bei', cityId: 'hanzhong' },
  'liao-hua':    { forceId: 'liu-bei', cityId: 'yongan' },
  'zhang-yi':    { forceId: 'liu-bei', cityId: 'jiangzhou' },
  'ma-zhong':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'fei-yi':      { forceId: 'liu-bei', cityId: 'chengdu' },
  'jiang-wan':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'dong-yun':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'yang-yi':     { forceId: 'liu-bei', cityId: 'changan' },
  'deng-zhi':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'qiao-zhou':   { forceId: 'liu-bei', cityId: 'chengdu' },
  'huo-yi':      { forceId: 'liu-bei', cityId: 'yongan' },
  'luo-xian':    { forceId: 'liu-bei', cityId: 'yongan' },
  'lady-huang':  { forceId: 'liu-bei', cityId: 'changan' }, // Huang Yueying, accompanies Kongming
  'liu-yong':    { forceId: 'liu-bei', cityId: 'chengdu' },
  'empress-mu':  { forceId: 'liu-bei', cityId: 'chengdu' },
  'guan-xing':   { forceId: 'liu-bei', cityId: 'chengdu' }, // d. 235 — auto-dead
  // ── Wei (Cao Rui still rules; weakened, lost the west) ──
  'cao-rui':     { forceId: 'cao', cityId: 'ye' },
  'sima-yi':     { forceId: 'cao', cityId: 'luoyang' },
  'sima-shi':    { forceId: 'cao', cityId: 'luoyang' },
  'sima-zhao':   { forceId: 'cao', cityId: 'luoyang' },
  'cao-shuang':  { forceId: 'cao', cityId: 'ye' },
  'cao-yu':      { forceId: 'cao', cityId: 'xuchang' },
  'xiahou-ba':   { forceId: 'cao', cityId: 'fancheng' },
  'xiahou-mao':  { forceId: 'cao', cityId: 'xuchang' },
  'guo-huai':    { forceId: 'cao', cityId: 'hulao' }, // pushed east after Chang'an fell
  'sun-li':      { forceId: 'cao', cityId: 'hulao' },
  'man-chong':   { forceId: 'cao', cityId: 'shouchun' },
  'wang-ling':   { forceId: 'cao', cityId: 'shouchun' },
  'guanqiu-jian':{ forceId: 'cao', cityId: 'liaodong' }, // pacifying after 238
  'tian-yu':     { forceId: 'cao', cityId: 'beiping' },
  'chen-qun':    { forceId: 'cao', cityId: 'ye' }, // d. 237 — auto-dead
  'chen-tai':    { forceId: 'cao', cityId: 'hulao' },
  'deng-ai':     { forceId: 'cao', cityId: 'xuchang' }, // young (age 43)
  'wang-su':     { forceId: 'cao', cityId: 'luoyang' },
  'hu-zhi':      { forceId: 'cao', cityId: 'pingyuan' },
  'liu-fang':    { forceId: 'cao', cityId: 'ye' },
  'sun-zi':      { forceId: 'cao', cityId: 'ye' },
  'jia-chong':   { forceId: 'cao', cityId: 'ye' }, // young (age 23)
  'cai-yan':     { forceId: 'cao', cityId: 'xuchang' },
  'empress-guo': { forceId: 'cao', cityId: 'ye' },
  // ── Wu (Sun Quan in twilight) ──
  'sun-quan':    { forceId: 'sun', cityId: 'jianye' },
  'lu-xun':      { forceId: 'sun', cityId: 'jiangling' },
  'lu-kang':     { forceId: 'sun', cityId: 'jianye' }, // young (age 14)
  'zhuge-jin':   { forceId: 'sun', cityId: 'jianye' }, // d. 241 — alive in 240
  'zhuge-ke':    { forceId: 'sun', cityId: 'jianye' },
  'ding-feng':   { forceId: 'sun', cityId: 'jianye' },
  'zhu-ran':     { forceId: 'sun', cityId: 'jiangxia' },
  'zhu-huan':    { forceId: 'sun', cityId: 'yuzhang' }, // d. 238 — auto-dead
  'gu-yong':     { forceId: 'sun', cityId: 'jianye' },
  'bu-zhi':      { forceId: 'sun', cityId: 'jianye' },
  'he-qi':       { forceId: 'sun', cityId: 'kuaiji' }, // d. 227 — auto-dead
  'lu-dai':      { forceId: 'sun', cityId: 'jiaozhi' },
  'quan-cong':   { forceId: 'sun', cityId: 'jianye' },
  'pan-jun':     { forceId: 'sun', cityId: 'changsha' },
  'sun-shao':    { forceId: 'sun', cityId: 'wu' }, // d. 241 — alive in 240
  'empress-pan': { forceId: 'sun', cityId: 'jianye' },
};

// In this what-if, Zhuge Liang did NOT die in 234. He's the only major
// "historical revert." Pang Tong, Fa Zheng, Guan Yu, Zhang Fei, Liu Bei,
// Zhang He (231), Cao Zhen (231), etc. all still dead per normal history.
const DEAD_BY_ZHUGE_LIVES: string[] = [
  // Everything pre-240 auto-culled by scenarioYear; explicit overrides not needed.
  // The one revert is: zhuge-liang's deathYear is 234, but his assignment
  // entry overrides the auto-cull (per buildInitialOfficers logic).
];

export const SCENARIO_WHATIF_ZHUGE_LIVES: Scenario = {
  id: 'scn-whatif-zhuge-lives',
  name: { en: 'What if Zhuge Liang Lived', zh: '諸葛亮活到八十' },
  kind: 'whatif',
  description:
    'Spring 240 AD. Zhuge Liang did not die at Wuzhang in 234 — he recovered, completed his sixth ' +
    'northern expedition, and seized Chang\'an in 238. Wei has been driven east of Tong Pass; Cao Rui ' +
    'rules a diminished kingdom from Ye while Sima Yi guards Luoyang. Jiang Wei holds Tianshui; ' +
    'the Prime Minister of Han stands at age sixty, weary, ink-stained, and victorious.',
  descriptionZh: "公元240年春。諸葛丞相未殞於五丈原——病癒後再啟六出之師，於戊午（238）光復長安。魏失關中，曹叡退守鄴城，司馬懿勉力護洛。姜維鎮天水，丞相身居長安，年屆耳順之歲，鬢染霜華，案牘勞形，而漢室西半，終復其舊。",
  startDate: { year: 240, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_ZHUGE_LIVES),
  forces: FORCES_ZHUGE_LIVES,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_ZHUGE_LIVES, DEAD_BY_ZHUGE_LIVES, 240),
};

// ──────────────────────────────────────────────────────────────────────
// What-If Scenario C — Winter 208 AD 「曹操贏赤壁」 Cao Cao Wins Red Cliffs
// The southeast wind never came. Huang Gai's fire-ships were spotted
// and repelled; the chained fleet held. Cao Cao routed the allies,
// pursued Sun Quan to Jianye, and shattered Wu. Liu Bei fled west into
// Yi territory. The realm now teeters on the edge of a single empire.
// ──────────────────────────────────────────────────────────────────────

const FORCES_CHIBI_WIN: Force[] = [
  { id: 'cao',       name: { en: 'Cao Cao',     zh: '曹操軍' }, rulerOfficerId: 'cao-cao',   capitalCityId: 'xuchang',  color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei',   name: { en: 'Liu Bei',     zh: '劉備軍' }, rulerOfficerId: 'liu-bei',   capitalCityId: 'xinye',    color: '#a85d8a', isPlayer: false },
  { id: 'sun',       name: { en: 'Wu Remnant',  zh: '吳殘部' }, rulerOfficerId: 'sun-yi',    capitalCityId: 'kuaiji',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',   zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang', capitalCityId: 'chengdu',  color: '#d9803a', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',    zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6b8a6b', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍' }, rulerOfficerId: 'ma-teng',   capitalCityId: 'wuwei',    color: '#a8703a', isPlayer: false },
  { id: 'shi-xie',   name: { en: 'Shi Xie',     zh: '士燮軍' }, rulerOfficerId: 'shi-xie',   capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
];

const CITY_OWNERSHIP_CHIBI_WIN: Record<string, string> = {
  // Cao Cao — has taken nearly everything north of Yi/Liang plus Jingzhou plus Jiangdong
  xuchang:   'cao',
  luoyang:   'cao',
  wancheng:  'cao',
  chenliu:   'cao',
  runan:     'cao',
  pingyuan:  'cao',
  ye:        'cao',
  bohai:     'cao',
  beihai:    'cao',
  beiping:   'cao',
  yanmen:    'cao',
  shangdang: 'cao',
  taiyuan:   'cao',
  pengcheng: 'cao',
  xiapi:     'cao',
  shouchun:  'cao',
  changan:   'cao',
  liaodong:  'cao',
  guandu:    'cao',
  hulao:     'cao',
  tongguan:  'cao',
  linzi:     'cao',
  lujiang:   'cao',
  hefei:     'cao',
  // ── Jingzhou (taken from Liu Cong's surrender + Red Cliffs win) ──
  xiangyang: 'cao',
  jiangling: 'cao',
  jiangxia:  'cao',
  wuling:    'cao',
  lingling:  'cao',
  changsha:  'cao',
  guiyang:   'cao',
  fancheng:  'cao',
  // ── Jiangdong (pursued and broken) ──
  jianye:    'cao',
  wu:        'cao',
  yuzhang:   'cao',
  chaisang:  'cao',
  // Liu Bei — refugee in the west, holding Xinye as forward camp before fleeing further
  xinye:     'liu-bei', // here treated as refugee staging; with Liu Zhang's reluctant permission
  // Wu remnant — Sun Yi (Sun Ce's younger brother) holds Kuaiji and Wuxi by sea
  kuaiji:    'sun',
  wuxi:      'sun',
  // Liu Zhang — Yi (still independent, but Cao Cao at his gates)
  chengdu:   'liu-zhang',
  yongan:    'liu-zhang',
  jiangzhou: 'liu-zhang',
  baxi:      'liu-zhang',
  // Zhang Lu — Hanzhong
  hanzhong:  'zhang-lu',
  wudu:      'zhang-lu',
  yangping:  'zhang-lu',
  // Ma Teng — Liang
  wuwei:     'ma-teng',
  jincheng:  'ma-teng',
  anding:    'ma-teng',
  mei:       'ma-teng',
  // Shi Xie — Jiao (Sun Quan in this timeline is dead/captured; Wu has no Jiao reach)
  jiaozhi:   'shi-xie',
  nanhai:    'shi-xie',
  hepu:      'shi-xie',
};

const OFFICER_ASSIGNMENTS_CHIBI_WIN: Record<string, { forceId: string; cityId: string }> = {
  // ── Cao Cao — at imperial apex ──
  'cao-cao':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-pi':      { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhi':     { forceId: 'cao', cityId: 'xuchang' },
  'cao-zhang':   { forceId: 'cao', cityId: 'ye' },
  'cao-ren':     { forceId: 'cao', cityId: 'jiangling' },
  'cao-hong':    { forceId: 'cao', cityId: 'luoyang' },
  'cao-chun':    { forceId: 'cao', cityId: 'xiangyang' },
  'cao-xiu':     { forceId: 'cao', cityId: 'pengcheng' },
  'cao-zhen':    { forceId: 'cao', cityId: 'changan' },
  'xiahou-dun':  { forceId: 'cao', cityId: 'xuchang' },
  'xiahou-yuan': { forceId: 'cao', cityId: 'changan' },
  'xun-yu':      { forceId: 'cao', cityId: 'xuchang' },
  'xun-you':     { forceId: 'cao', cityId: 'xuchang' },
  'cheng-yu':    { forceId: 'cao', cityId: 'xuchang' },
  'jia-xu':      { forceId: 'cao', cityId: 'wancheng' },
  'sima-yi':     { forceId: 'cao', cityId: 'luoyang' },
  'xu-huang':    { forceId: 'cao', cityId: 'jiangling' },
  'zhang-liao':  { forceId: 'cao', cityId: 'hefei' },
  'yu-jin':      { forceId: 'cao', cityId: 'xiangyang' },
  'le-jin':      { forceId: 'cao', cityId: 'shouchun' },
  'li-dian':     { forceId: 'cao', cityId: 'shouchun' },
  'zhang-he':    { forceId: 'cao', cityId: 'ye' },
  'xu-chu':      { forceId: 'cao', cityId: 'xuchang' },
  'pang-de':     { forceId: 'cao', cityId: 'changan' },
  'man-chong':   { forceId: 'cao', cityId: 'shouchun' },
  'zang-ba':     { forceId: 'cao', cityId: 'pengcheng' },
  'liu-ye':      { forceId: 'cao', cityId: 'xuchang' },
  'chen-qun':    { forceId: 'cao', cityId: 'xuchang' },
  'guo-jia':     { forceId: 'cao', cityId: 'luoyang' }, // d. 207 — auto-dead
  // ── Captured Jingzhou officers absorbed into Wei ──
  'cai-mao':     { forceId: 'cao', cityId: 'xiangyang' },
  'zhang-yun':   { forceId: 'cao', cityId: 'xiangyang' },
  'kuai-liang':  { forceId: 'cao', cityId: 'xiangyang' },
  'kuai-yue':    { forceId: 'cao', cityId: 'xiangyang' },
  'wen-pin':     { forceId: 'cao', cityId: 'jiangling' },
  'han-xuan':    { forceId: 'cao', cityId: 'changsha' },
  'liu-du':      { forceId: 'cao', cityId: 'lingling' },
  'jin-xuan':    { forceId: 'cao', cityId: 'wuling' },
  'zhao-fan':    { forceId: 'cao', cityId: 'guiyang' },
  // ── Captured Wu officers (surrendered or were spared) ──
  'zhang-zhao':  { forceId: 'cao', cityId: 'jianye' }, // historically he urged surrender — in this timeline accepted
  'gu-yong':     { forceId: 'cao', cityId: 'jianye' },
  'yu-fan':      { forceId: 'cao', cityId: 'wu' },
  'da-qiao':     { forceId: 'cao', cityId: 'jianye' },  // taken by Cao Cao (his old desire)
  'xiao-qiao':   { forceId: 'cao', cityId: 'jianye' },

  // ── Liu Bei — refugee remnant ──
  'liu-bei':     { forceId: 'liu-bei', cityId: 'xinye' },
  'guan-yu':     { forceId: 'liu-bei', cityId: 'xinye' },
  'zhang-fei':   { forceId: 'liu-bei', cityId: 'xinye' },
  'zhao-yun':    { forceId: 'liu-bei', cityId: 'xinye' },
  'zhuge-liang': { forceId: 'liu-bei', cityId: 'xinye' },
  'mi-zhu':      { forceId: 'liu-bei', cityId: 'xinye' },
  'mi-fang':     { forceId: 'liu-bei', cityId: 'xinye' },
  'sun-qian':    { forceId: 'liu-bei', cityId: 'xinye' },
  'jian-yong':   { forceId: 'liu-bei', cityId: 'xinye' },
  'liu-feng':    { forceId: 'liu-bei', cityId: 'xinye' },
  'liu-shan':    { forceId: 'liu-bei', cityId: 'xinye' }, // an infant of 2

  // ── Wu remnant under Sun Yi (Sun Ce's younger brother) ──
  // (Sun Quan, in this timeline, fell or was captured during the pursuit)
  'sun-yi':      { forceId: 'sun', cityId: 'kuaiji' },
  'sun-kuang':   { forceId: 'sun', cityId: 'wuxi' },
  'zhou-tai':    { forceId: 'sun', cityId: 'kuaiji' },
  'jiang-qin':   { forceId: 'sun', cityId: 'wuxi' },
  'han-dang':    { forceId: 'sun', cityId: 'kuaiji' },
  'lu-su':       { forceId: 'sun', cityId: 'kuaiji' }, // survived the disaster
  'lu-xun':      { forceId: 'sun', cityId: 'wuxi' },
  'lu-meng':     { forceId: 'sun', cityId: 'kuaiji' },
  'taishi-ci':   { forceId: 'sun', cityId: 'kuaiji' },
  'ling-tong':   { forceId: 'sun', cityId: 'wuxi' },
  'lady-sun':    { forceId: 'sun', cityId: 'kuaiji' },
  'lady-wu':     { forceId: 'sun', cityId: 'kuaiji' },

  // ── Liu Zhang ──
  'liu-zhang':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'zhang-ren':   { forceId: 'liu-zhang', cityId: 'chengdu' },
  'yan-yan':     { forceId: 'liu-zhang', cityId: 'jiangzhou' },
  'meng-da':     { forceId: 'liu-zhang', cityId: 'yongan' },
  'wu-yi':       { forceId: 'liu-zhang', cityId: 'chengdu' },
  'fa-zheng':    { forceId: 'liu-zhang', cityId: 'chengdu' },
  'huang-quan':  { forceId: 'liu-zhang', cityId: 'chengdu' },

  // ── Zhang Lu ──
  'zhang-lu':    { forceId: 'zhang-lu', cityId: 'hanzhong' },
  'yang-song':   { forceId: 'zhang-lu', cityId: 'hanzhong' },

  // ── Ma Teng ──
  'ma-teng':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-chao':     { forceId: 'ma-teng', cityId: 'wuwei' },
  'ma-dai':      { forceId: 'ma-teng', cityId: 'jincheng' },
  'han-sui':     { forceId: 'ma-teng', cityId: 'jincheng' },
  'wang-yi':     { forceId: 'ma-teng', cityId: 'wuwei' },

  // ── Shi Xie ──
  'shi-xie':     { forceId: 'shi-xie', cityId: 'jiaozhi' },
};

// In this what-if, Sun Quan, Zhou Yu, and Huang Gai all died at or
// pursuing Red Cliffs. Lu Su, Lu Meng, Lu Xun survived. Standard
// pre-208 deaths apply as in scn-208-chibi.
const DEAD_BY_CHIBI_WIN: string[] = [
  // Standard pre-208 deaths
  'sun-jian',    // d. 191
  'sun-ce',      // d. 200
  'dong-zhuo',   // d. 192
  'lu-bu',       // d. 198
  'li-ru',       // d. 192
  'yuan-shao',   // d. 202
  'yuan-shu',    // d. 199
  'yan-liang',   // d. 200
  'wen-chou',    // d. 200
  'tian-feng',   // d. 200
  'yuan-tan',    // d. 205
  'yuan-shang',  // d. 207
  'yuan-xi',     // d. 207
  'gongsun-zan', // d. 199
  'gongsun-du',  // d. 204
  'kong-rong',   // d. 208
  'tao-qian',    // d. 194
  'liu-yan',     // d. 194
  'liu-biao',    // d. 208 (Aug)
  'cao-ang',     // d. 197
  'cao-anmin',   // d. 197
  'dian-wei',    // d. 197
  'hua-xiong',   // d. 191
  'gao-shun',    // d. 198
  'wang-yun',    // d. 192
  'chen-gong',   // d. 198
  'han-fu',      // d. 191
  'bo-cai',      // d. 184
  'zhang-jiao',  // d. 184
  // What-if specific casualties of the Red Cliffs catastrophe
  'sun-quan',    // captured/killed in pursuit
  'zhou-yu',     // killed at Red Cliffs (here)
  'huang-gai',   // died in the failed fire-ship attack
  'cheng-pu',    // died defending Sun Quan in retreat
];

export const SCENARIO_WHATIF_CAO_WINS_CHIBI: Scenario = {
  id: 'scn-whatif-cao-wins-chibi',
  name: { en: 'Cao Cao Wins Red Cliffs', zh: '曹操贏赤壁' },
  kind: 'whatif',
  description:
    'Winter 208 AD. The southeast wind never blew. Cao Cao\'s scouts spotted Huang Gai\'s fire-ships ' +
    'in time; the chained fleet held; Zhou Yu fell in the rout. Cao Cao pursued to Jianye, killed ' +
    'Sun Quan, and shattered the Wu host. Liu Bei flees west with Zhuge Liang into the protective ' +
    'shadow of Liu Zhang. The Han\'s last hope sleeps in a refugee\'s cradle.',
  descriptionZh: "公元208年冬。東南風終是不至。曹軍斥候早窺破黃蓋詐降之計，連環鐵索安然無恙，周郎殞於亂軍之中。曹公追擊至建業，斬孫權於江岸，東吳一日而傾。劉備攜諸葛孔明西奔，乞庇於劉璋羽翼之下。漢家最後一線生機，眠於襁褓之中——時阿斗方二歲耳。",
  startDate: { year: 208, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_CHIBI_WIN),
  forces: FORCES_CHIBI_WIN,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_CHIBI_WIN, DEAD_BY_CHIBI_WIN, 208),
};

// ──────────────────────────────────────────────────────────────────────
// What-If Scenario D — Spring 200 AD 「女傑時代」 Age of Heroines
// A fantasy alt-history. The women of the Three Kingdoms era — long
// hidden behind silk screens — have stepped forward to command armies.
// The famous men serve under them. Six female-led powers contest the
// realm. History remembers them not as wives or daughters but as
// generals, governors, sovereigns.
// ──────────────────────────────────────────────────────────────────────

const FORCES_WOMEN: Force[] = [
  { id: 'diaochan-han', name: { en: 'Diao Chan',     zh: '貂蟬軍'   }, rulerOfficerId: 'diaochan',     capitalCityId: 'changan',  color: '#c8417a', isPlayer: false },
  { id: 'lady-sun',     name: { en: 'Lady Sun',      zh: '孫尚香軍' }, rulerOfficerId: 'lady-sun',     capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'yueying',      name: { en: 'Huang Yueying', zh: '黃月英軍' }, rulerOfficerId: 'lady-huang',   capitalCityId: 'xiangyang',color: '#7d9be0', isPlayer: false },
  { id: 'zhurong-nan',  name: { en: 'Zhu Rong',      zh: '祝融軍'   }, rulerOfficerId: 'zhu-rong',     capitalCityId: 'jianning', color: '#6e8a2a', isPlayer: false },
  { id: 'caiyan-ye',    name: { en: 'Cai Yan',       zh: '蔡琰軍'   }, rulerOfficerId: 'cai-yan',      capitalCityId: 'ye',       color: '#a85d8a', isPlayer: false },
  { id: 'qiao',         name: { en: 'Qiao Sisters',  zh: '二喬軍'   }, rulerOfficerId: 'da-qiao',      capitalCityId: 'wancheng', color: '#d96aa0', isPlayer: false },
  { id: 'bian-liang',   name: { en: 'Lady Bian',     zh: '卞夫人軍' }, rulerOfficerId: 'lady-bian',    capitalCityId: 'jincheng', color: '#b8803a', isPlayer: false },
];

const CITY_OWNERSHIP_WOMEN: Record<string, string> = {
  // ── Diao Chan rules the central plains from Chang'an ──
  changan:   'diaochan-han',
  luoyang:   'diaochan-han',
  hulao:     'diaochan-han',
  tongguan:  'diaochan-han',
  mei:       'diaochan-han',
  wuguan:    'diaochan-han',
  xuchang:   'diaochan-han',
  // ── Lady Sun rules Wu from Jianye ──
  jianye:    'lady-sun',
  wu:        'lady-sun',
  wuxi:      'lady-sun',
  yuzhang:   'lady-sun',
  kuaiji:    'lady-sun',
  chaisang:  'lady-sun',
  hefei:     'lady-sun',
  shouchun:  'lady-sun',
  // ── Huang Yueying rules Jing from Xiangyang ──
  xiangyang: 'yueying',
  jiangling: 'yueying',
  jiangxia:  'yueying',
  changsha:  'yueying',
  wuling:    'yueying',
  lingling:  'yueying',
  guiyang:   'yueying',
  xinye:     'yueying',
  fancheng:  'yueying',
  // ── Zhu Rong rules Nanman ──
  jianning:  'zhurong-nan',
  yunnan:    'zhurong-nan',
  yongchang: 'zhurong-nan',
  yuexi:     'zhurong-nan',
  chengdu:   'zhurong-nan', // bold expansion: she's taken Yi province
  yongan:    'zhurong-nan',
  jiangzhou: 'zhurong-nan',
  // ── Cai Yan rules a literary state from Ye ──
  ye:        'caiyan-ye',
  pingyuan:  'caiyan-ye',
  bohai:     'caiyan-ye',
  beihai:    'caiyan-ye',
  beiping:   'caiyan-ye',
  yanmen:    'caiyan-ye',
  shangdang: 'caiyan-ye',
  taiyuan:   'caiyan-ye',
  chenliu:   'caiyan-ye',
  guandu:    'caiyan-ye',
  // ── Qiao Sisters at Wancheng + Lujiang ──
  wancheng:  'qiao',
  lujiang:   'qiao',
  runan:     'qiao',
  pengcheng: 'qiao',
  xiapi:     'qiao',
  linzi:     'qiao',
  // ── Lady Bian rules Liang ──
  jincheng:  'bian-liang',
  wuwei:     'bian-liang',
  anding:    'bian-liang',
  wudu:      'bian-liang',
  hanzhong:  'bian-liang',
};

const OFFICER_ASSIGNMENTS_WOMEN: Record<string, { forceId: string; cityId: string }> = {
  // ── Diao Chan — the seductive sovereign of Chang'an ──
  'diaochan':    { forceId: 'diaochan-han', cityId: 'changan' },
  'lu-bu':       { forceId: 'diaochan-han', cityId: 'changan' }, // her sworn champion
  'hua-xiong':   { forceId: 'diaochan-han', cityId: 'hulao' },   // d. 191 historically — revived for the dream-tale
  'li-jue':      { forceId: 'diaochan-han', cityId: 'tongguan' },
  'guo-si':      { forceId: 'diaochan-han', cityId: 'tongguan' },
  'li-ru':       { forceId: 'diaochan-han', cityId: 'changan' }, // d. 192 — revived
  'jia-xu':      { forceId: 'diaochan-han', cityId: 'changan' },
  'liu-xie':     { forceId: 'diaochan-han', cityId: 'luoyang' }, // Emperor Xian, her puppet
  'tang-ji':     { forceId: 'diaochan-han', cityId: 'luoyang' }, // Empress
  'zhang-xiu':   { forceId: 'diaochan-han', cityId: 'xuchang' },
  'cao-cao':     { forceId: 'diaochan-han', cityId: 'xuchang' }, // serves Diao Chan in this fantasy
  'dian-wei':    { forceId: 'diaochan-han', cityId: 'xuchang' }, // d. 197 — revived

  // ── Lady Sun — the tiger-daughter who rules Wu ──
  'lady-sun':    { forceId: 'lady-sun', cityId: 'jianye' },
  'lady-wu':     { forceId: 'lady-sun', cityId: 'jianye' },
  'sun-ce':      { forceId: 'lady-sun', cityId: 'wu' }, // her elder brother, alive as her champion
  'sun-quan':    { forceId: 'lady-sun', cityId: 'jianye' },
  'sun-yi':      { forceId: 'lady-sun', cityId: 'kuaiji' },
  'sun-kuang':   { forceId: 'lady-sun', cityId: 'wuxi' },
  'taishi-ci':   { forceId: 'lady-sun', cityId: 'wu' },
  'cheng-pu':    { forceId: 'lady-sun', cityId: 'jianye' },
  'huang-gai':   { forceId: 'lady-sun', cityId: 'yuzhang' },
  'han-dang':    { forceId: 'lady-sun', cityId: 'kuaiji' },
  'zhou-tai':    { forceId: 'lady-sun', cityId: 'jianye' },
  'lu-su':       { forceId: 'lady-sun', cityId: 'jianye' },
  'lu-meng':     { forceId: 'lady-sun', cityId: 'chaisang' },

  // ── Huang Yueying — the inventor-queen of Jingzhou ──
  'lady-huang':  { forceId: 'yueying', cityId: 'xiangyang' },
  'zhuge-liang': { forceId: 'yueying', cityId: 'xiangyang' }, // her husband and chancellor
  'liu-bei':     { forceId: 'yueying', cityId: 'xinye' },     // her client lord
  'guan-yu':     { forceId: 'yueying', cityId: 'xinye' },
  'zhang-fei':   { forceId: 'yueying', cityId: 'xinye' },
  'zhao-yun':    { forceId: 'yueying', cityId: 'jiangxia' },
  'huang-zhong': { forceId: 'yueying', cityId: 'changsha' },
  'wei-yan':     { forceId: 'yueying', cityId: 'jiangling' },
  'pang-tong':   { forceId: 'yueying', cityId: 'xiangyang' },
  'liu-biao':    { forceId: 'yueying', cityId: 'xiangyang' }, // serves the new order
  'cai-mao':     { forceId: 'yueying', cityId: 'xiangyang' },
  'lady-cai':    { forceId: 'yueying', cityId: 'xiangyang' },
  'kuai-liang':  { forceId: 'yueying', cityId: 'xiangyang' },
  'kuai-yue':    { forceId: 'yueying', cityId: 'xiangyang' },
  'wen-pin':     { forceId: 'yueying', cityId: 'jiangling' },
  'huang-zu':    { forceId: 'yueying', cityId: 'jiangxia' },
  'mi-zhu':      { forceId: 'yueying', cityId: 'xinye' },
  'sun-qian':    { forceId: 'yueying', cityId: 'xinye' },
  'jian-yong':   { forceId: 'yueying', cityId: 'xinye' },

  // ── Zhu Rong — the warrior queen of the south ──
  'zhu-rong':    { forceId: 'zhurong-nan', cityId: 'jianning' },
  'meng-huo':    { forceId: 'zhurong-nan', cityId: 'jianning' }, // her consort
  'meng-you':    { forceId: 'zhurong-nan', cityId: 'yongchang' },
  'mangya-chang':{ forceId: 'zhurong-nan', cityId: 'jianning' },
  'jinhuan-sanjie':{forceId:'zhurong-nan', cityId: 'yongchang' },
  'dongtu-na':   { forceId: 'zhurong-nan', cityId: 'yunnan' },
  'ahui-nan':    { forceId: 'zhurong-nan', cityId: 'yunnan' },
  'wutugu':      { forceId: 'zhurong-nan', cityId: 'yuexi' },
  'liu-zhang':   { forceId: 'zhurong-nan', cityId: 'chengdu' }, // serves under her
  'zhang-ren':   { forceId: 'zhurong-nan', cityId: 'chengdu' },
  'yan-yan':     { forceId: 'zhurong-nan', cityId: 'jiangzhou' },
  'wu-yi':       { forceId: 'zhurong-nan', cityId: 'chengdu' },
  'fa-zheng':    { forceId: 'zhurong-nan', cityId: 'chengdu' },

  // ── Cai Yan — poet-empress of Ye ──
  'cai-yan':     { forceId: 'caiyan-ye', cityId: 'ye' },
  'yuan-shao':   { forceId: 'caiyan-ye', cityId: 'ye' },        // serves as her chief minister
  'yan-liang':   { forceId: 'caiyan-ye', cityId: 'pingyuan' },
  'wen-chou':    { forceId: 'caiyan-ye', cityId: 'pingyuan' },
  'tian-feng':   { forceId: 'caiyan-ye', cityId: 'ye' },
  'ju-shou':     { forceId: 'caiyan-ye', cityId: 'ye' },
  'shen-pei':    { forceId: 'caiyan-ye', cityId: 'ye' },
  'guo-tu':      { forceId: 'caiyan-ye', cityId: 'ye' },
  'gao-lan':     { forceId: 'caiyan-ye', cityId: 'pingyuan' },
  'zhang-he':    { forceId: 'caiyan-ye', cityId: 'pingyuan' },
  'yuan-tan':    { forceId: 'caiyan-ye', cityId: 'pingyuan' },
  'yuan-shang':  { forceId: 'caiyan-ye', cityId: 'ye' },
  'yuan-xi':     { forceId: 'caiyan-ye', cityId: 'beiping' },
  'gongsun-zan': { forceId: 'caiyan-ye', cityId: 'beiping' }, // tamed and serves
  'liu-yu':      { forceId: 'caiyan-ye', cityId: 'beiping' },
  'cai-yong':    { forceId: 'caiyan-ye', cityId: 'ye' }, // her father — revived
  'lady-zhen':   { forceId: 'caiyan-ye', cityId: 'ye' },

  // ── Qiao Sisters — co-rulers at Wancheng ──
  'da-qiao':     { forceId: 'qiao', cityId: 'wancheng' },
  'xiao-qiao':   { forceId: 'qiao', cityId: 'wancheng' },
  'zhou-yu':     { forceId: 'qiao', cityId: 'wancheng' }, // Xiao Qiao's husband — her champion
  'lu-xun':      { forceId: 'qiao', cityId: 'lujiang' },
  'gan-ning':    { forceId: 'qiao', cityId: 'wancheng' },
  'ling-tong':   { forceId: 'qiao', cityId: 'lujiang' },
  'jiang-qin':   { forceId: 'qiao', cityId: 'lujiang' },
  'yuan-shu':    { forceId: 'qiao', cityId: 'runan' }, // d. 199 — revived
  'ji-ling':     { forceId: 'qiao', cityId: 'runan' },
  'lady-fan':    { forceId: 'qiao', cityId: 'wancheng' },

  // ── Lady Bian — sovereign of Liang ──
  'lady-bian':   { forceId: 'bian-liang', cityId: 'jincheng' },
  'empress-bian':{ forceId: 'bian-liang', cityId: 'jincheng' },
  'wang-yi':     { forceId: 'bian-liang', cityId: 'wuwei' },
  'ma-teng':     { forceId: 'bian-liang', cityId: 'wuwei' },
  'ma-chao':     { forceId: 'bian-liang', cityId: 'wuwei' },
  'ma-dai':      { forceId: 'bian-liang', cityId: 'jincheng' },
  'han-sui':     { forceId: 'bian-liang', cityId: 'jincheng' },
  'pang-de':     { forceId: 'bian-liang', cityId: 'anding' },
  'pang-de-ye':  { forceId: 'bian-liang', cityId: 'wuwei' },
  'zhang-lu':    { forceId: 'bian-liang', cityId: 'hanzhong' }, // submitted
  'yang-song':   { forceId: 'bian-liang', cityId: 'hanzhong' },
};

// Spring 200 — only deaths before this date apply. In this fantasy
// timeline, several pre-200 deaths are EXPLICITLY REVIVED for storytelling:
// Cai Yong (d. 192), Li Ru (d. 192), Hua Xiong (d. 191), Dian Wei (d. 197),
// Yuan Shu (d. 199), Liu Yu (d. 193) — all alive serving women rulers.
// To keep them alive despite scenarioYear auto-cull, they appear in the
// assignment map (which overrides auto-death per buildInitialOfficers).
//
// Standard pre-200 deaths NOT revived — we don't need to explicitly list
// them here because scenarioYear=200 auto-culls anyone with deathYear<200
// who isn't assigned. So DEAD_BY_WOMEN can stay empty.
const DEAD_BY_WOMEN: string[] = [];

export const SCENARIO_WHATIF_WOMEN: Scenario = {
  id: 'scn-whatif-women',
  name: { en: 'Age of Heroines', zh: '女傑時代' },
  kind: 'whatif',
  description:
    'Spring 200 AD — a parallel reality. The women of the Three Kingdoms have stepped from behind ' +
    'silk screens to command armies. Diao Chan rules from Chang\'an with Lü Bu as her sword. Lady Sun ' +
    'reigns over Jiangdong with her brothers as captains. Huang Yueying governs Jing through her ' +
    'inventions. Zhu Rong tames Yi from the southern jungles. Cai Yan composes edicts at Ye. The ' +
    'Qiao sisters hold the Han River basin. Lady Bian rides the Liang frontier. History has been ' +
    're-cast in jade and rouge.',
  descriptionZh: "公元200年春——平行之世。三國女傑撥開帷簾，親執兵符。貂蟬居長安，呂奉先為其劍鋒；孫尚香坐建業，伯符仲謀皆其驍將；黃月英治荊州，機巧造化為其權柄；祝融自南中興兵，益州亦入其轂；蔡琰於鄴城下詔賦詩，本初父子俱拜其階；二喬同領宛城，公瑾為之奔走；卞夫人馳騁涼隴，西涼健兒盡入其麾。青史易脂粉而新撰矣。",
  startDate: { year: 200, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_WOMEN),
  forces: FORCES_WOMEN,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_WOMEN, DEAD_BY_WOMEN, 200),
};

// ── What-if helper ─────────────────────────────────────────────────────
// Reuse a base year's officer-assignment table under altered city ownership:
// any officer whose assigned city is no longer held by their own force is
// pulled back to that force's capital, so nobody is left stranded in what is
// now enemy territory after the map is redrawn.
function whatIfOfficers(
  base: Record<string, { forceId: string; cityId: string }>,
  ownership: Record<string, string>,
  forces: Force[],
): Record<string, { forceId: string; cityId: string }> {
  const capital: Record<string, string> = {};
  for (const f of forces) capital[f.id] = f.capitalCityId;
  const out: Record<string, { forceId: string; cityId: string }> = {};
  for (const [id, a] of Object.entries(base)) {
    const held = ownership[a.cityId] === a.forceId;
    out[id] = { forceId: a.forceId, cityId: held ? a.cityId : (capital[a.forceId] ?? a.cityId) };
  }
  return out;
}

// ── What-if: 若袁紹勝官渡 (201) ─ Yuan Shao breaks through and takes the
//    central plains; Cao Cao is driven back to a southern remnant. ──
const CITY_OWNERSHIP_YUAN_GUANDU: Record<string, string> = {
  ...CITY_OWNERSHIP_200,
  xuchang: 'yuan-shao', luoyang: 'yuan-shao', chenliu: 'yuan-shao', guandu: 'yuan-shao',
};
const FORCES_YUAN_GUANDU: Force[] = FORCES_200.map((f) =>
  f.id === 'cao' ? { ...f, name: { en: 'Cao Cao (Remnant)', zh: '曹操軍（殘）' }, capitalCityId: 'wancheng' } : f,
);
export const SCENARIO_WHATIF_YUAN_GUANDU: Scenario = {
  id: 'scn-whatif-yuan-guandu',
  name: { en: 'If Yuan Shao Had Won Guandu', zh: '若袁紹勝官渡' },
  kind: 'whatif',
  description:
    'Autumn 201. At Guandu, Yuan Shao heeded Tian Feng and ground Cao Cao down by attrition rather than gambling on a single battle. Cao\'s granaries burned, his lines broke, and the lord of the four northern provinces poured south to seize Xuchang and the Emperor. Cao Cao clings to a southern remnant around Wancheng — can he claw his way back, or will the Yuan house unify the realm?',
  descriptionZh: "建安六年秋。官渡之役，袁紹納田豐之諫，持重以耗，不賭一陣之勝負。曹操糧盡，烏巢先焚，戰線終潰。河北四州之主揮軍南下，取許昌、挾天子。曹操僅餘宛城一隅殘部——是絕地反撲，抑或袁氏一統天下？",
  startDate: { year: 201, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_YUAN_GUANDU),
  forces: FORCES_YUAN_GUANDU,
  officers: buildInitialOfficers(whatIfOfficers(OFFICER_ASSIGNMENTS_200, CITY_OWNERSHIP_YUAN_GUANDU, FORCES_YUAN_GUANDU), DEAD_BY_200, 201),
};

// ── What-if: 呂布割據徐州 (198) ─ Lü Bu holds out at Xiapi and welds all
//    of Xuzhou into his own domain instead of falling to Cao Cao. ──
const CITY_OWNERSHIP_LUBU_XUZHOU: Record<string, string> = {
  ...CITY_OWNERSHIP_198,
  pengcheng: 'lubu', xiaopei: 'lubu', langya: 'lubu', guangling: 'lubu',
};
export const SCENARIO_WHATIF_LUBU_XUZHOU: Scenario = {
  id: 'scn-whatif-lubu-xuzhou',
  name: { en: 'If Lü Bu Had Held Xuzhou', zh: '若呂布割據徐州' },
  kind: 'whatif',
  description:
    'Winter 198. The flood-waters never broke Xiapi\'s walls; Chen Gong\'s counsel held, the gates stayed shut, and Cao Cao\'s exhausted host withdrew. The Flying General now commands all of Xuzhou — Xiapi, Pengcheng, Xiaopei, Langya, Guangling — Red Hare and the Sky-Piercer poised between Cao Cao and the sea. The mightiest warrior alive has a base at last. What will he do with it?',
  descriptionZh: "建安三年冬。泗水未潰下邳之牆；陳宮之謀得行，城門緊閉，曹操疲師終退。飛將軍據有全徐州——下邳、彭城、小沛、琅琊、廣陵——赤兔方天，雄踞曹操與東海之間。天下第一猛將，終得一方基業。猛虎得地，將何為哉？",
  startDate: { year: 198, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_LUBU_XUZHOU),
  forces: FORCES_198,
  officers: buildInitialOfficers(whatIfOfficers(OFFICER_ASSIGNMENTS_198, CITY_OWNERSHIP_LUBU_XUZHOU, FORCES_198), DEAD_BY_198, 198),
};

// ── What-if: 馬超盡得關中 (211) ─ Ma Chao storms Tongguan and seizes the
//    Guanzhong heartland instead of being routed by Cao Cao. ──
const CITY_OWNERSHIP_MACHAO_GUANZHONG: Record<string, string> = {
  ...CITY_OWNERSHIP_211,
  changan: 'ma-chao', tongguan: 'ma-chao', xiaoguan: 'ma-chao',
};
const FORCES_MACHAO_GUANZHONG: Force[] = FORCES_211.map((f) =>
  f.id === 'ma-chao' ? { ...f, capitalCityId: 'changan' } : f,
);
export const SCENARIO_WHATIF_MACHAO_GUANZHONG: Scenario = {
  id: 'scn-whatif-machao-guanzhong',
  name: { en: 'If Ma Chao Had Taken Guanzhong', zh: '若馬超盡得關中' },
  kind: 'whatif',
  description:
    'Spring 211. The forged-letter ruse failed; Ma Chao and Han Sui kept their alliance, stormed Tongguan, and drove Cao Cao back across the passes. The Splendid Ma Chao now holds Chang\'an and all the Guanzhong, the warlords of Liang at his back and the road to the central plains open before him. The lance of Xiliang is loosed upon the empire.',
  descriptionZh: "建安十六年春。離間之計未成，馬超與韓遂盟好不疑，強攻潼關，逼退曹操於關隘之東。錦馬超盡得長安與關中之地，涼州群雄為其後盾，中原之路豁然在前。西涼之槍，自此縱橫天下。",
  startDate: { year: 211, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_MACHAO_GUANZHONG),
  forces: FORCES_MACHAO_GUANZHONG,
  officers: buildInitialOfficers(whatIfOfficers(OFFICER_ASSIGNMENTS_211, CITY_OWNERSHIP_MACHAO_GUANZHONG, FORCES_MACHAO_GUANZHONG), DEAD_BY_211, 211),
};

// ── What-if: 若孫策不死 (201) ─ The young conqueror survives the assassins'
//    arrows and drives his Jiangdong tigers north against the central plains. ──
const CITY_OWNERSHIP_SUNCE_LIVES: Record<string, string> = {
  ...CITY_OWNERSHIP_200,
  lujiang: 'sun', guangling: 'sun',
};
export const SCENARIO_WHATIF_SUNCE_LIVES: Scenario = {
  id: 'scn-whatif-sunce-lives',
  name: { en: 'If Sun Ce Had Lived', zh: '若孫策不死' },
  kind: 'whatif',
  description:
    'Spring 201. The assassins of Xu Gong\'s retainers missed; the Little Conqueror healed and lived. While Cao Cao and Yuan Shao bled each other white at Guandu, Sun Ce did what he had always planned — march north on Xuchang to seize the Emperor. The tiger of Jiangdong, age twenty-six and unbeaten, holds the southeast and eyes the throne. Sun Quan must wait; this is his brother\'s war.',
  descriptionZh: "建安六年春。許貢門客之刺未中，小霸王傷愈而生。當曹操與袁紹於官渡相持血戰之際，孫策行其夙志——揮師北上，襲許昌以迎天子。江東之虎，年方二十六而未嘗一敗，據東南而窺神器。仲謀且待，此乃其兄之天下。",
  startDate: { year: 201, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_SUNCE_LIVES),
  forces: FORCES_200,
  officers: buildInitialOfficers(whatIfOfficers(OFFICER_ASSIGNMENTS_200, CITY_OWNERSHIP_SUNCE_LIVES, FORCES_200), DEAD_BY_200, 201),
};

// ── What-if: 若董卓未亡 (192) ─ Wang Yun's chain-plot fails, Lü Bu stays
//    loyal, and the tyrant of Mei crushes the coalition and rules the Han. ──
const CITY_OWNERSHIP_DONG_LIVES: Record<string, string> = {
  ...CITY_OWNERSHIP_190,
  hulao: 'dong', chenliu: 'dong',
};
export const SCENARIO_WHATIF_DONG_LIVES: Scenario = {
  id: 'scn-whatif-dong-lives',
  name: { en: 'If Dong Zhuo Had Not Fallen', zh: '若董卓未亡' },
  kind: 'whatif',
  description:
    'Year 192. Diaochan\'s ploy never turned Lü Bu; Wang Yun\'s plot was uncovered and crushed. With the Flying General still at his side and Hulao held against the eastern lords, Dong Zhuo broke the anti-Dong coalition and rules the Han court by terror from Luoyang to Chang\'an. The tyrant\'s grip tightens — and every warlord east of the passes must decide whether to bow or burn.',
  descriptionZh: "初平三年。連環美人之計未能離間呂布，王允之謀事泄而敗。飛將軍仍在側，虎牢拒東諸侯於關外，董卓遂破反董聯軍，自洛陽至長安，以暴威挾持漢室。暴君之手愈收愈緊——關東群雄，俯首抑或焚身，各自抉擇。",
  startDate: { year: 192, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_DONG_LIVES),
  forces: FORCES_190,
  officers: buildInitialOfficers(whatIfOfficers(OFFICER_ASSIGNMENTS_190, CITY_OWNERSHIP_DONG_LIVES, FORCES_190), [], 192),
};

// ── What-if: 若袁術稱帝成 (198) ─ The Zhongjia emperor's claim does not
//    collapse; Yuan Shu's Huainan empire stands astride the southeast. ──
const CITY_OWNERSHIP_YUANSHU_EMPIRE: Record<string, string> = {
  ...CITY_OWNERSHIP_198,
  runan: 'yuan-shu', guangling: 'yuan-shu',
};
export const SCENARIO_WHATIF_YUANSHU_EMPIRE: Scenario = {
  id: 'scn-whatif-yuanshu-empire',
  name: { en: 'If Yuan Shu\'s Empire Had Stood', zh: '若袁術稱帝成' },
  kind: 'whatif',
  description:
    'Year 198. Holding the Imperial Seal, Yuan Shu proclaimed the Zhongjia dynasty — and this time the harvest did not fail, the generals did not desert, and the Huainan granaries stayed full. The self-made emperor holds Shouchun, Runan and the Huai with a real army at his back, the southeast in his grip and the Han pretenders surrounding him. A false throne, defended at last.',
  descriptionZh: "建安三年。袁術手握傳國玉璽，僭號仲家——而這一回，淮南未逢大旱，部將未叛，府庫充盈如舊。自立之帝據壽春、汝南、淮水之地，麾下實有強兵，雄踞東南，四面皆漢室之臣。一座僭越之龍座，終得守全。",
  startDate: { year: 198, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_YUANSHU_EMPIRE),
  forces: FORCES_198,
  officers: buildInitialOfficers(whatIfOfficers(OFFICER_ASSIGNMENTS_198, CITY_OWNERSHIP_YUANSHU_EMPIRE, FORCES_198), DEAD_BY_198, 198),
};

export const SCENARIOS: Scenario[] = [
  // ── Historical (chronological 184–280 AD) ──
  SCENARIO_184_YELLOW_TURBAN,
  SCENARIO_189_EUNUCHS,
  SCENARIO_190_ANTI_DONG_ZHUO,
  SCENARIO_192_WANGYUN,
  SCENARIO_194_XUZHOU,
  SCENARIO_197_BOHAI,
  SCENARIO_198_XIAPI,
  SCENARIO_200_GUANDU,
  SCENARIO_204_YECHENG,
  SCENARIO_207_THREE_VISITS,
  SCENARIO_208_CHIBI,
  SCENARIO_211_WEINAN,
  SCENARIO_213_FENGPO,
  SCENARIO_214_XICHUAN,
  SCENARIO_215_HEFEI,
  SCENARIO_219_HANZHONG,
  SCENARIO_220_DECLARATION,
  SCENARIO_221_SHU_EMPEROR,
  SCENARIO_222_YILING,
  SCENARIO_225_SOUTHERN,
  SCENARIO_228_JIETING,
  SCENARIO_229_THREE_EMPERORS,
  SCENARIO_234_WUZHANG,
  SCENARIO_249_GAOPINGLING,
  SCENARIO_252_DONGXING,
  SCENARIO_263_SHU_FALL,
  SCENARIO_264_ZHONGHUI,
  SCENARIO_265_JIN_FOUNDED,
  SCENARIO_280_JIN_UNITE,
  // ── What-if (alternate timelines) ──
  SCENARIO_GATHERING_OF_HEROES,
  SCENARIO_WHATIF_GUANYU_JING,
  SCENARIO_WHATIF_ZHUGE_LIVES,
  SCENARIO_WHATIF_CAO_WINS_CHIBI,
  SCENARIO_WHATIF_WOMEN,
  SCENARIO_WHATIF_YUAN_GUANDU,
  SCENARIO_WHATIF_LUBU_XUZHOU,
  SCENARIO_WHATIF_MACHAO_GUANZHONG,
  SCENARIO_WHATIF_SUNCE_LIVES,
  SCENARIO_WHATIF_DONG_LIVES,
  SCENARIO_WHATIF_YUANSHU_EMPIRE,
];

// ── Death-year normalization ───────────────────────────────────────────
// Assignment tables sometimes place officers who were already dead by the
// scenario's year (a stray entry copied between tables), and buildInitial
// Officers keeps assigned officers alive regardless of death year. Sweep
// every historical scenario and lay to rest anyone whose death predates the
// start — so e.g. Guo Jia (d.207) isn't fighting at Red Cliffs (208). What-if
// scenarios are exempt: their cross-era / resurrected rosters are the point.
for (const scenario of SCENARIOS) {
  if (scenario.kind === 'whatif') continue;
  const year = scenario.startDate.year;
  for (const o of scenario.officers) {
    if (o.status !== 'dead' && o.deathYear !== undefined && o.deathYear < year) {
      o.status = 'dead';
      o.forceId = null;
      o.locationCityId = null;
      o.task = null;
      o.loyalty = 0;
    }
  }
}
