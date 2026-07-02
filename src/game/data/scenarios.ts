import type { Force, Scenario, Officer } from '../types';
import { loadMods, modScenariosForStart } from '../systems/mods';
import { buildInitialCities } from './cities';
import { buildInitialOfficers, buildHistoricalOfficers } from './officers';
import { fillRetinues } from './retinues';
import type { Dynasty } from './dynasties';

// ──────────────────────────────────────────────────────────────────────
// Scenario 0 — 184 AD The Yellow Turban Rebellion
// ──────────────────────────────────────────────────────────────────────

const FORCES_184: Force[] = [
  { id: 'han',         name: { en: 'Han Court',       zh: '漢室'     }, rulerOfficerId: 'lu-zhi',      capitalCityId: 'luoyang',  color: '#f0d878', isPlayer: false },
  { id: 'yellow-turban',name:{ en: 'Yellow Turbans',  zh: '黃巾'     }, rulerOfficerId: 'zhang-jiao',  capitalCityId: 'ye',       color: '#a88a2a', isPlayer: false },
  { id: 'huangfu',     name: { en: 'Huangfu Song',    zh: '皇甫嵩軍' }, rulerOfficerId: 'huangfu-song',capitalCityId: 'chenliu',  color: '#3a7dd9', isPlayer: false },
  { id: 'zhujun',      name: { en: 'Zhu Jun',         zh: '朱儁軍'   }, rulerOfficerId: 'zhu-jun',     capitalCityId: 'wancheng', color: '#2a9b8a', isPlayer: false },
  { id: 'dong-184',    name: { en: 'Dong Zhuo',       zh: '董卓軍'   }, rulerOfficerId: 'dong-zhuo',   capitalCityId: 'changan',  color: '#6a3d8a', isPlayer: false },
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
  { id: 'yuan-shao', name: { en: 'Yuan Shao',   zh: '袁紹軍'   }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'ye',       color: '#c0392b', isPlayer: false },
  { id: 'yuan-shu',  name: { en: 'Yuan Shu',    zh: '袁術軍'   }, rulerOfficerId: 'yuan-shu',    capitalCityId: 'shouchun', color: '#c03a6a', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Jian',    zh: '孫堅軍'   }, rulerOfficerId: 'sun-jian',    capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'dong',      name: { en: 'Dong Zhuo',   zh: '董卓軍'   }, rulerOfficerId: 'dong-zhuo',   capitalCityId: 'luoyang',  color: '#6a3d8a', isPlayer: false },
  { id: 'liu-biao',  name: { en: 'Liu Biao',    zh: '劉表軍'   }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#d4af37', isPlayer: false },
  { id: 'liu-yan',   name: { en: 'Liu Yan',     zh: '劉焉軍'   }, rulerOfficerId: 'liu-yan',     capitalCityId: 'chengdu',  color: '#c8692a', isPlayer: false },
  { id: 'gongsun',   name: { en: 'Gongsun Zan', zh: '公孫瓚軍' }, rulerOfficerId: 'gongsun-zan', capitalCityId: 'beiping',  color: '#2aa8c0', isPlayer: false },
  { id: 'tao',       name: { en: 'Tao Qian',    zh: '陶謙軍'   }, rulerOfficerId: 'tao-qian',    capitalCityId: 'pengcheng',color: '#7a8a5a', isPlayer: false },
  { id: 'kong-rong', name: { en: 'Kong Rong',   zh: '孔融軍'   }, rulerOfficerId: 'kong-rong',   capitalCityId: 'beihai',   color: '#8aaa3a', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍'   }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#9a6b3a', isPlayer: false },
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
  { id: 'yuan-shao', name: { en: 'Yuan Shao',   zh: '袁紹軍' }, rulerOfficerId: 'yuan-shao',capitalCityId: 'ye',        color: '#c0392b', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Ce',      zh: '孫策軍' }, rulerOfficerId: 'sun-ce',   capitalCityId: 'jianye',    color: '#2f8e6f', isPlayer: false },
  { id: 'liu-bei',   name: { en: 'Liu Bei',     zh: '劉備軍' }, rulerOfficerId: 'liu-bei',  capitalCityId: 'pengcheng', color: '#a85d8a', isPlayer: false },
  { id: 'liu-biao',  name: { en: 'Liu Biao',    zh: '劉表軍' }, rulerOfficerId: 'liu-biao', capitalCityId: 'xiangyang', color: '#d4af37', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',   zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang',capitalCityId: 'chengdu',   color: '#e07b39', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍' }, rulerOfficerId: 'ma-teng',  capitalCityId: 'wuwei',     color: '#9a6b3a', isPlayer: false },
  { id: 'wuhuan',    name: { en: 'Wuhuan',      zh: '烏丸'   }, rulerOfficerId: 'tadun',    capitalCityId: 'wuhuan',    color: '#7a6a9a', isPlayer: false },
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
  { id: 'yuan-shao',   name: { en: 'Yuan Shao',   zh: '袁紹軍'   }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'ye',       color: '#c0392b', isPlayer: false },
  { id: 'yuan-shu',    name: { en: 'Yuan Shu',    zh: '袁術軍'   }, rulerOfficerId: 'yuan-shu',    capitalCityId: 'shouchun', color: '#c03a6a', isPlayer: false },
  { id: 'dong',        name: { en: 'Dong Zhuo',   zh: '董卓軍'   }, rulerOfficerId: 'dong-zhuo',   capitalCityId: 'changan',  color: '#6a3d8a', isPlayer: false },
  { id: 'lubu',        name: { en: 'Lu Bu',       zh: '呂布軍'   }, rulerOfficerId: 'lu-bu',       capitalCityId: 'xiapi',    color: '#7a2e5a', isPlayer: false },
  { id: 'liu-biao',    name: { en: 'Liu Biao',    zh: '劉表軍'   }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#d4af37', isPlayer: false },
  { id: 'liu-yan',     name: { en: 'Liu Yan',     zh: '劉焉軍'   }, rulerOfficerId: 'liu-yan',     capitalCityId: 'chengdu',  color: '#c8692a', isPlayer: false },
  { id: 'zhang-lu',    name: { en: 'Zhang Lu',    zh: '張魯軍'   }, rulerOfficerId: 'zhang-lu',    capitalCityId: 'hanzhong', color: '#6a9a8a', isPlayer: false },
  { id: 'gongsun',     name: { en: 'Gongsun Zan', zh: '公孫瓚軍' }, rulerOfficerId: 'gongsun-zan', capitalCityId: 'beiping',  color: '#2aa8c0', isPlayer: false },
  { id: 'gongsun-du',  name: { en: 'Gongsun Du',  zh: '公孫度軍' }, rulerOfficerId: 'gongsun-du',  capitalCityId: 'liaodong', color: '#1f7a9a', isPlayer: false },
  { id: 'ma-teng',     name: { en: 'Ma Teng',     zh: '馬騰軍'   }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#9a6b3a', isPlayer: false },
  { id: 'han-sui',     name: { en: 'Han Sui',     zh: '韓遂軍'   }, rulerOfficerId: 'han-sui',     capitalCityId: 'jincheng', color: '#c8b06a', isPlayer: false },
  { id: 'kong-rong',   name: { en: 'Kong Rong',   zh: '孔融軍'   }, rulerOfficerId: 'kong-rong',   capitalCityId: 'beihai',   color: '#8aaa3a', isPlayer: false },
  { id: 'tao',         name: { en: 'Tao Qian',    zh: '陶謙軍'   }, rulerOfficerId: 'tao-qian',    capitalCityId: 'pengcheng',color: '#7a8a5a', isPlayer: false },
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
  { id: 'liu-biao',  name: { en: 'Liu Cong',    zh: '劉琮軍' }, rulerOfficerId: 'liu-biao',  capitalCityId: 'xiangyang',color: '#d4af37', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',   zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang', capitalCityId: 'chengdu',  color: '#e07b39', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',    zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6a9a8a', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍' }, rulerOfficerId: 'ma-teng',   capitalCityId: 'wuwei',    color: '#9a6b3a', isPlayer: false },
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
  fancheng:  'liu-biao', // 就近填充在細格下會翻給新野的曹 — 顯式錨定

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
  wudu:      'liu-bei',   // 229年諸葛亮取武都
  yinping:   'liu-bei',   // 同役取陰平
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
  { id: 'xianbei', name: { en: 'Xianbei', zh: '鮮卑'  }, rulerOfficerId: 'kebi-neng',capitalCityId: 'wuhuan',   color: '#4a6aaa', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',  zh: '南蛮'  }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning', color: '#b5651d', isPlayer: false },
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
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',   zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6a9a8a', isPlayer: false },
  { id: 'shi-xie',   name: { en: 'Shi Xie',    zh: '士燮軍' }, rulerOfficerId: 'shi-xie',   capitalCityId: 'jiaozhi',  color: '#5a8a3a', isPlayer: false },
  { id: 'xianbei',   name: { en: 'Xianbei',    zh: '鮮卑'   }, rulerOfficerId: 'kebi-neng', capitalCityId: 'wuhuan',   color: '#4a6aaa', isPlayer: false },
  { id: 'nanman',    name: { en: 'Nanman',     zh: '南蛮'   }, rulerOfficerId: 'meng-huo',  capitalCityId: 'jianning', color: '#b5651d', isPlayer: false },
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
  { id: 'yuan-shao', name: { en: 'Yuan Shao',   zh: '袁紹軍'   }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'ye',       color: '#c0392b', isPlayer: false },
  { id: 'yuan-shu',  name: { en: 'Yuan Shu',    zh: '袁術軍'   }, rulerOfficerId: 'yuan-shu',    capitalCityId: 'shouchun', color: '#c03a6a', isPlayer: false },
  { id: 'lu-bu',     name: { en: 'Lü Bu',       zh: '呂布軍'   }, rulerOfficerId: 'lu-bu',       capitalCityId: 'xiapi',    color: '#7a2e5a', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Ce',      zh: '孫策軍'   }, rulerOfficerId: 'sun-ce',      capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-biao',  name: { en: 'Liu Biao',    zh: '劉表軍'   }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#d4af37', isPlayer: false },
  { id: 'liu-yan',   name: { en: 'Liu Zhang',   zh: '劉璋軍'   }, rulerOfficerId: 'liu-zhang',   capitalCityId: 'chengdu',  color: '#c8692a', isPlayer: false },
  { id: 'gongsun',   name: { en: 'Gongsun Zan', zh: '公孫瓚軍' }, rulerOfficerId: 'gongsun-zan', capitalCityId: 'beiping',  color: '#2aa8c0', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍'   }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#9a6b3a', isPlayer: false },
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
  { id: 'xianbei', name: { en: 'Xianbei',  zh: '鮮卑'   }, rulerOfficerId: 'kebi-neng', capitalCityId: 'wuhuan', color: '#4a6aaa', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',   zh: '南蛮'   }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning', color: '#b5651d', isPlayer: false },
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
  { id: 'xianbei', name: { en: 'Xianbei',  zh: '鮮卑'  }, rulerOfficerId: 'kebi-neng',capitalCityId: 'wuhuan',   color: '#4a6aaa', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',   zh: '南蛮'  }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning', color: '#b5651d', isPlayer: false },
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
  { id: 'nanman',  name: { en: 'Nanman',  zh: '南蛮'  }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning',color: '#b5651d', isPlayer: false },
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
  { id: 'lubu',      name: { en: 'Lü Bu',       zh: '呂布軍' }, rulerOfficerId: 'lu-bu',       capitalCityId: 'xiapi',    color: '#7a2e5a', isPlayer: false },
  { id: 'yuan-shao', name: { en: 'Yuan Shao',   zh: '袁紹軍' }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'ye',       color: '#c0392b', isPlayer: false },
  { id: 'yuan-shu',  name: { en: 'Yuan Shu',    zh: '袁術軍' }, rulerOfficerId: 'yuan-shu',    capitalCityId: 'shouchun', color: '#c03a6a', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Ce',      zh: '孫策軍' }, rulerOfficerId: 'sun-ce',      capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-biao',  name: { en: 'Liu Biao',    zh: '劉表軍' }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#d4af37', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',   zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang',   capitalCityId: 'chengdu',  color: '#e07b39', isPlayer: false },
  { id: 'gongsun',   name: { en: 'Gongsun Zan', zh: '公孫瓚軍' }, rulerOfficerId: 'gongsun-zan', capitalCityId: 'beiping', color: '#2aa8c0', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍' }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#9a6b3a', isPlayer: false },
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
  { id: 'liu-biao',    name: { en: 'Liu Biao',    zh: '劉表軍' }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#d4af37', isPlayer: false },
  { id: 'liu-zhang',   name: { en: 'Liu Zhang',   zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang',   capitalCityId: 'chengdu',  color: '#e07b39', isPlayer: false },
  { id: 'zhang-lu',    name: { en: 'Zhang Lu',    zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',    capitalCityId: 'hanzhong', color: '#6a9a8a', isPlayer: false },
  { id: 'ma-teng',     name: { en: 'Ma Teng',     zh: '馬騰軍' }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#9a6b3a', isPlayer: false },
  { id: 'gongsun-du',  name: { en: 'Gongsun Kang',zh: '公孫康軍'}, rulerOfficerId: 'gongsun-kang',capitalCityId: 'liaodong', color: '#1f7a9a', isPlayer: false },
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
  { id: 'ma-chao',   name: { en: 'Ma Chao',    zh: '馬超軍' }, rulerOfficerId: 'ma-chao',   capitalCityId: 'wuwei',    color: '#9a6b3a', isPlayer: false },
  { id: 'han-sui',   name: { en: 'Han Sui',    zh: '韓遂軍' }, rulerOfficerId: 'han-sui',   capitalCityId: 'jincheng', color: '#c8b06a', isPlayer: false },
  { id: 'liu-bei',   name: { en: 'Liu Bei',    zh: '劉備軍' }, rulerOfficerId: 'liu-bei',   capitalCityId: 'jiangling',color: '#a85d8a', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Quan',   zh: '孫權軍' }, rulerOfficerId: 'sun-quan',  capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',  zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang', capitalCityId: 'chengdu',  color: '#e07b39', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',   zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6a9a8a', isPlayer: false },
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
  { id: 'xianbei', name: { en: 'Xianbei', zh: '鮮卑'  }, rulerOfficerId: 'kebi-neng', capitalCityId: 'wuhuan',  color: '#4a6aaa', isPlayer: false },
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
  { id: 'han',         name: { en: 'He Jin (Regent)', zh: '何進'     }, rulerOfficerId: 'he-jin',      capitalCityId: 'luoyang',  color: '#f0d878', isPlayer: false },
  { id: 'eunuchs',     name: { en: 'Ten Attendants',  zh: '十常侍'   }, rulerOfficerId: 'zhang-rang',  capitalCityId: 'hulao',    color: '#9a5a9a', isPlayer: false },
  { id: 'dong',        name: { en: 'Dong Zhuo',       zh: '董卓軍'   }, rulerOfficerId: 'dong-zhuo',   capitalCityId: 'changan',  color: '#6a3d8a', isPlayer: false },
  { id: 'cao',         name: { en: 'Cao Cao',         zh: '曹操'     }, rulerOfficerId: 'cao-cao',     capitalCityId: 'chenliu',  color: '#3a7dd9', isPlayer: false },
  { id: 'yuan-shao',   name: { en: 'Yuan Shao',       zh: '袁紹'     }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'bohai',    color: '#c0392b', isPlayer: false },
  { id: 'sun',         name: { en: 'Sun Jian',        zh: '孫堅軍'   }, rulerOfficerId: 'sun-jian',    capitalCityId: 'changsha', color: '#2f8e6f', isPlayer: false },
  { id: 'liu-biao',    name: { en: 'Liu Biao',        zh: '劉表軍'   }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#d4af37', isPlayer: false },
  { id: 'liu-yan',     name: { en: 'Liu Yan',         zh: '劉焉軍'   }, rulerOfficerId: 'liu-yan',     capitalCityId: 'chengdu',  color: '#c8692a', isPlayer: false },
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
  { id: 'tao',         name: { en: 'Tao Qian',    zh: '陶謙軍'   }, rulerOfficerId: 'tao-qian',    capitalCityId: 'xiapi',    color: '#7a8a5a', isPlayer: false },
  { id: 'lubu',        name: { en: 'Lü Bu',       zh: '呂布軍'   }, rulerOfficerId: 'lu-bu',       capitalCityId: 'puyang',   color: '#7a2e5a', isPlayer: false },
  { id: 'yuan-shao',   name: { en: 'Yuan Shao',   zh: '袁紹軍'   }, rulerOfficerId: 'yuan-shao',   capitalCityId: 'ye',       color: '#c0392b', isPlayer: false },
  { id: 'yuan-shu',    name: { en: 'Yuan Shu',    zh: '袁術軍'   }, rulerOfficerId: 'yuan-shu',    capitalCityId: 'shouchun', color: '#c03a6a', isPlayer: false },
  { id: 'gongsun',     name: { en: 'Gongsun Zan', zh: '公孫瓚軍' }, rulerOfficerId: 'gongsun-zan', capitalCityId: 'beiping',  color: '#2aa8c0', isPlayer: false },
  { id: 'liu-biao',    name: { en: 'Liu Biao',    zh: '劉表軍'   }, rulerOfficerId: 'liu-biao',    capitalCityId: 'xiangyang',color: '#d4af37', isPlayer: false },
  { id: 'liu-yan',     name: { en: 'Liu Yan',     zh: '劉焉軍'   }, rulerOfficerId: 'liu-yan',     capitalCityId: 'chengdu',  color: '#c8692a', isPlayer: false },
  { id: 'kong-rong',   name: { en: 'Kong Rong',   zh: '孔融軍'   }, rulerOfficerId: 'kong-rong',   capitalCityId: 'beihai',   color: '#8aaa3a', isPlayer: false },
  { id: 'ma-teng',     name: { en: 'Ma Teng',     zh: '馬騰軍'   }, rulerOfficerId: 'ma-teng',     capitalCityId: 'wuwei',    color: '#9a6b3a', isPlayer: false },
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
  { id: 'liu-zhang', name: { en: 'Liu Zhang',  zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang', capitalCityId: 'chengdu',  color: '#e07b39', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',   zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6a9a8a', isPlayer: false },
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
  { id: 'han',         name: { en: 'Han Court',    zh: '漢室'    }, rulerOfficerId: 'wang-yun',     capitalCityId: 'changan',  color: '#f0d878', isPlayer: false },
  { id: 'lubu',        name: { en: 'Lü Bu',        zh: '呂布軍'  }, rulerOfficerId: 'lu-bu',        capitalCityId: 'luoyang',  color: '#7a2e5a', isPlayer: false },
  { id: 'lijue',       name: { en: 'Li Jue',       zh: '李傕軍'  }, rulerOfficerId: 'li-jue',       capitalCityId: 'mei',      color: '#6a3a2a', isPlayer: false },
  { id: 'yuan-shao',   name: { en: 'Yuan Shao',    zh: '袁紹軍'  }, rulerOfficerId: 'yuan-shao',    capitalCityId: 'ye',       color: '#c0392b', isPlayer: false },
  { id: 'yuan-shu',    name: { en: 'Yuan Shu',     zh: '袁術軍'  }, rulerOfficerId: 'yuan-shu',     capitalCityId: 'shouchun', color: '#c03a6a', isPlayer: false },
  { id: 'gongsun',     name: { en: 'Gongsun Zan',  zh: '公孫瓚軍'}, rulerOfficerId: 'gongsun-zan',  capitalCityId: 'beiping',  color: '#2aa8c0', isPlayer: false },
  { id: 'cao',         name: { en: 'Cao Cao',      zh: '曹操軍'  }, rulerOfficerId: 'cao-cao',      capitalCityId: 'chenliu',  color: '#3a7dd9', isPlayer: false },
  { id: 'liu-biao',    name: { en: 'Liu Biao',     zh: '劉表軍'  }, rulerOfficerId: 'liu-biao',     capitalCityId: 'xiangyang',color: '#d4af37', isPlayer: false },
  { id: 'tao-qian',    name: { en: 'Tao Qian',     zh: '陶謙軍'  }, rulerOfficerId: 'tao-qian',     capitalCityId: 'xiapi',    color: '#7a8a5a', isPlayer: false },
  { id: 'liu-yan',     name: { en: 'Liu Yan',      zh: '劉焉軍'  }, rulerOfficerId: 'liu-yan',      capitalCityId: 'chengdu',  color: '#c8692a', isPlayer: false },
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
  { id: 'yuan-shang',name: { en: 'Yuan Shang',   zh: '袁尚軍'  }, rulerOfficerId: 'yuan-shang',   capitalCityId: 'ye',       color: '#c0392b', isPlayer: false },
  { id: 'yuan-tan',  name: { en: 'Yuan Tan',     zh: '袁譚軍'  }, rulerOfficerId: 'yuan-tan',     capitalCityId: 'pingyuan', color: '#8a3a2a', isPlayer: false },
  { id: 'sun',       name: { en: 'Sun Quan',     zh: '孫權軍'  }, rulerOfficerId: 'sun-quan',     capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
  { id: 'liu-biao',  name: { en: 'Liu Biao',     zh: '劉表軍'  }, rulerOfficerId: 'liu-biao',     capitalCityId: 'xiangyang',color: '#d4af37', isPlayer: false },
  { id: 'liu-zhang', name: { en: 'Liu Zhang',    zh: '劉璋軍'  }, rulerOfficerId: 'liu-zhang',    capitalCityId: 'chengdu',  color: '#e07b39', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',      zh: '馬騰軍'  }, rulerOfficerId: 'ma-teng',      capitalCityId: 'wuwei',    color: '#9a6b3a', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',     zh: '張魯軍'  }, rulerOfficerId: 'zhang-lu',     capitalCityId: 'hanzhong', color: '#6a9a8a', isPlayer: false },
  { id: 'gongsun',   name: { en: 'Gongsun Kang', zh: '公孫康軍'}, rulerOfficerId: 'gongsun-kang', capitalCityId: 'liaodong', color: '#2aa8c0', isPlayer: false },
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
  { id: 'liu-zhang', name: { en: 'Liu Zhang',  zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang', capitalCityId: 'chengdu',  color: '#e07b39', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',   zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6a9a8a', isPlayer: false },
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
  { id: 'xianbei', name: { en: 'Xianbei',      zh: '鮮卑'    }, rulerOfficerId: 'kebi-neng',capitalCityId: 'wuhuan',  color: '#4a6aaa', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',       zh: '南蛮'    }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning',color: '#b5651d', isPlayer: false },
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
  { id: 'xianbei', name: { en: 'Xianbei',   zh: '鮮卑'  }, rulerOfficerId: 'kebi-neng', capitalCityId: 'wuhuan',  color: '#4a6aaa', isPlayer: false },
  { id: 'gongsun', name: { en: 'Gongsun',   zh: '公孫'  }, rulerOfficerId: 'gongsun-yuan',capitalCityId: 'liaodong',color: '#2aa8c0', isPlayer: false },
  { id: 'nanman',  name: { en: 'Nanman',    zh: '南蛮'  }, rulerOfficerId: 'meng-huo',  capitalCityId: 'jianning',color: '#b5651d', isPlayer: false },
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
  { id: 'zhonghui',  name: { en: 'Zhong Hui',  zh: '鍾會軍'  }, rulerOfficerId: 'zhong-hui',  capitalCityId: 'chengdu', color: '#c03a6a', isPlayer: false },
  { id: 'dengai',    name: { en: 'Deng Ai',    zh: '鄧艾軍'  }, rulerOfficerId: 'deng-ai',    capitalCityId: 'jiangzhou',color: '#2aa8c0', isPlayer: false },
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
  { id: 'nanman',  name: { en: 'Nanman',  zh: '南蠻' }, rulerOfficerId: 'meng-huo', capitalCityId: 'jianning', color: '#b5651d', isPlayer: false },
  { id: 'xianbei', name: { en: 'Xianbei', zh: '鮮卑' }, rulerOfficerId: 'kebi-neng',capitalCityId: 'wuhuan',   color: '#4a6aaa', isPlayer: false },
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
  { id: 'liu-zhang', name: { en: 'Liu Zhang',   zh: '劉璋軍' }, rulerOfficerId: 'liu-zhang', capitalCityId: 'chengdu',  color: '#e07b39', isPlayer: false },
  { id: 'zhang-lu',  name: { en: 'Zhang Lu',    zh: '張魯軍' }, rulerOfficerId: 'zhang-lu',  capitalCityId: 'hanzhong', color: '#6a9a8a', isPlayer: false },
  { id: 'ma-teng',   name: { en: 'Ma Teng',     zh: '馬騰軍' }, rulerOfficerId: 'ma-teng',   capitalCityId: 'wuwei',    color: '#9a6b3a', isPlayer: false },
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
  { id: 'lady-sun',     name: { en: 'Lady Sun',      zh: '孫尚香軍' }, rulerOfficerId: 'lady-sun',     capitalCityId: 'jianye',   color: '#3aa8a8', isPlayer: false },
  { id: 'yueying',      name: { en: 'Huang Yueying', zh: '黃月英軍' }, rulerOfficerId: 'lady-huang',   capitalCityId: 'xiangyang',color: '#7d9be0', isPlayer: false },
  { id: 'zhurong-nan',  name: { en: 'Zhu Rong',      zh: '祝融軍'   }, rulerOfficerId: 'zhu-rong',     capitalCityId: 'jianning', color: '#b5651d', isPlayer: false },
  { id: 'caiyan-ye',    name: { en: 'Cai Yan',       zh: '蔡琰軍'   }, rulerOfficerId: 'cai-yan',      capitalCityId: 'ye',       color: '#9a6ab0', isPlayer: false },
  { id: 'qiao',         name: { en: 'Qiao Sisters',  zh: '二喬軍'   }, rulerOfficerId: 'da-qiao',      capitalCityId: 'wancheng', color: '#d96aa0', isPlayer: false },
  { id: 'bian-liang',   name: { en: 'Lady Bian',     zh: '卞夫人軍' }, rulerOfficerId: 'lady-bian',    capitalCityId: 'jincheng', color: '#c8a85a', isPlayer: false },
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

// ── What-if: 若郭嘉不死 (208) ─ The Cao host marches on Jingzhou with its
//    sharpest mind still alive to read the river and the southern wind. ──
export const SCENARIO_WHATIF_GUOJIA_LIVES: Scenario = {
  id: 'scn-whatif-guojia-lives',
  name: { en: 'If Guo Jia Had Lived', zh: '若郭嘉不死' },
  kind: 'whatif',
  description:
    'Autumn 208. The fever of the northern campaign never took Guo Jia; Cao Cao\'s finest strategist rides south with the great host toward the Yangtze. "Had Fengxiao lived," Cao Cao would later sigh at Red Cliffs — but here he lives, and the fire-ships and chained fleets are still to come. With the Ghost Master at his side, will Cao Cao still walk into the flames?',
  descriptionZh: "建安十三年秋。北征之疾未奪郭嘉之命；曹操麾下第一謀主，隨大軍南下，直指長江。日後赤壁火起，曹操長嘆「若奉孝在，不使孤至此」——而此世奉孝尚在，連環火攻猶未發。鬼才在側，曹孟德可仍會自投火海？",
  startDate: { year: 208, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_208),
  forces: FORCES_208,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_208, DEAD_BY_208, 208),
};

// ── What-if: 若周瑜不死 (211) ─ The Grand Marshal of Wu survives Baqiu and
//    presses his bold design — take Shu before Liu Bei can. ──
export const SCENARIO_WHATIF_ZHOUYU_LIVES: Scenario = {
  id: 'scn-whatif-zhouyu-lives',
  name: { en: 'If Zhou Yu Had Lived', zh: '若周瑜不死' },
  kind: 'whatif',
  description:
    'Spring 211. Zhou Yu did not sicken and die at Baqiu; the Grand Marshal lives to press the plan he begged of Sun Quan — march west, take Yi province before Liu Bei can, and split the realm in two against Cao Cao. With Gongjin alive, the alliance that won Red Cliffs need not curdle into the rivalry over Jing, and Wu eyes the conquest of Shu itself.',
  descriptionZh: "建安十六年春。周瑜未病歿於巴丘；大都督尚在，得行其向孫權力請之策——西取益州，搶在劉備之前，與曹操二分天下。公瑾既在，赤壁之盟不必為荊州之爭所裂，江東之志，直指全蜀。",
  startDate: { year: 211, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_211),
  forces: FORCES_211,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_211, DEAD_BY_211, 211),
};

// ── What-if: 若龐統不死 (215) ─ The Fledgling Phoenix is not shot at Luofeng;
//    he holds Shu so the Sleeping Dragon need never leave Jingzhou. ──
export const SCENARIO_WHATIF_PANGTONG_LIVES: Scenario = {
  id: 'scn-whatif-pangtong-lives',
  name: { en: 'If Pang Tong Had Lived', zh: '若龐統不死' },
  kind: 'whatif',
  description:
    'Year 215. The arrows of Luofeng Slope found another rider; Pang Tong lived to finish the conquest of Shu at Liu Bei\'s side. With the Fledgling Phoenix to govern Yi province, Zhuge Liang never had to leave Jingzhou — and the fatal split of Shu\'s strength between two fronts is undone. Both Dragon and Phoenix serve a single lord, exactly as the prophecy promised. The realm trembles.',
  descriptionZh: "建安二十年。落鳳坡之箭射中他騎；龐統得生，佐劉備竟取西蜀之功。鳳雛既在以治益州，諸葛亮便無須西去入川——蜀漢兩線分兵之致命隱患，自此化解。臥龍鳳雛同事一主，正如水鏡之讖。天下為之震動。",
  startDate: { year: 215, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_215),
  forces: FORCES_215,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_215, [], 215),
};

// ── Historical: 第四次北伐 — 鹵城之戰 (231). Zhuge Liang's fourth sortie;
//    reuses the stable 228-234 three-kingdoms board with Cao Zhen and Zhang
//    He still in the field (both fall this year). ──
export const SCENARIO_231_LUCHENG: Scenario = {
  id: 'scn-231-lucheng',
  name: { en: 'The Battle of Lucheng', zh: '鹵城之戰' },
  description:
    'Spring 231. Zhuge Liang marches out of Hanzhong a fourth time, this season reaping the wheat of Shanggui under Sima Yi\'s nose and crushing the Wei vanguard at Lucheng. Cao Zhen lies dying, Sima Yi holds the line at last, and the veteran Zhang He still rides — though the road through Mumen Gorge awaits him. The Han revival presses against the passes once more.',
  descriptionZh: "太和五年春。諸葛亮第四次出漢中，本季於上邽司馬懿眼皮下搶割隴麥，又破魏軍前鋒於鹵城。曹真病篤，司馬懿終得拒守，老將張郃猶在馳驅——然木門道之伏，正待其行。漢室之興，再叩關隴。",
  startDate: { year: 231, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_234),
  forces: FORCES_234,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_234, [], 231),
};

// ── Historical: the decade after Zhuge Liang — 吳攻魏·芍陂之戰 (241) &
//    興勢之戰 (244). The three realms are stable, Cao Rui is dead, and the
//    boy-emperor Cao Fang holds the Wei throne under his regents Cao Shuang
//    and Sima Yi. Both reuse the 234 map with Wei's crown passed to Cao Fang. ──
const FORCES_POST_CAORUI: Force[] = [
  { id: 'cao',     name: { en: 'Wei',     zh: '魏'   }, rulerOfficerId: 'cao-fang',  capitalCityId: 'luoyang', color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han', zh: '蜀漢' }, rulerOfficerId: 'liu-shan',  capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',      zh: '吳'   }, rulerOfficerId: 'sun-quan',  capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
];
const OFFICER_ASSIGNMENTS_POST_CAORUI = {
  ...OFFICER_ASSIGNMENTS_234,
  'cao-fang': { forceId: 'cao', cityId: 'luoyang' },
};
export const SCENARIO_241_SHAOPI: Scenario = {
  id: 'scn-241-shaopi',
  name: { en: 'Wu Strikes North: Shaobei', zh: '吳攻魏·芍陂之戰' },
  description:
    'Summer 241. Cao Rui is three years dead and the boy-emperor Cao Fang reigns under his regents, and the aged Sun Quan throws his last great war northward: Quan Cong drives on the Shaobei dykes of the Huai, Zhu Ran lays siege to Fan, and Zhuge Jin strikes at Zuzhong. The Wei line under Wang Ling and Sun Li holds the frontier — but this is the final roar of the founder of Wu, who will not march again.',
  descriptionZh: "赤烏四年夏。曹叡崩已三載，幼帝曹芳受制於輔政諸公；老邁的孫權發動其畢生最後一次大舉北伐——全琮進逼淮南芍陂，朱然圍樊城，諸葛瑾攻柤中。魏軍賴王凌、孫禮拒守而得全。然此乃吳之開國者最後的咆哮，自此他再未能親征。",
  startDate: { year: 241, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_234),
  forces: FORCES_POST_CAORUI,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_POST_CAORUI, [], 241),
};
export const SCENARIO_244_XINGSHI: Scenario = {
  id: 'scn-244-xingshi',
  name: { en: 'The Battle of Xingshi', zh: '興勢之戰' },
  description:
    'Spring 244. The regent Cao Shuang, hungry for the martial glory that would cement his grip on Wei, pours a hundred thousand men up the Luo Valley into Hanzhong. But Wang Ping holds the heights of Xingshi with a few thousand, Fei Yi races north from Chengdu, and the Wei host starves on the broken mountain roads. The retreat becomes a rout — and Cao Shuang\'s prestige never recovers, paving the road that ends at the Gaoping Tombs.',
  descriptionZh: "正始五年春。大將軍曹爽急於立武功以固其權柄，驅十萬之眾溯駱谷而入漢中。然鎮北大將軍王平以數千之卒拒守興勢之嶺，費禕自成都疾馳來援，魏軍困於崎嶇山道，糧盡而士卒死傷枕藉。其退也如潰——曹爽威望自此一蹶不振，通往高平陵之變的道路，由是而鋪。",
  startDate: { year: 244, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_234),
  forces: FORCES_POST_CAORUI,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_POST_CAORUI, [], 244),
};

// ── Historical: 合肥新城之戰 (253). Zhuge Ke, drunk on the Dongxing victory of
//    the winter before, throws the whole strength of Wu against the Wei fortress
//    of Hefei and bleeds it white — the disaster that will cost him his life. ──
export const SCENARIO_253_HEFEI: Scenario = {
  id: 'scn-253-hefei',
  name: { en: 'The Siege of Hefei New City', zh: '合肥新城之戰' },
  description:
    'Summer 253. Drunk on his victory at Dongxing the winter before, the Grand Tutor Zhuge Ke throws two hundred thousand men — the whole strength of Wu — against the little Wei fortress of Hefei New City. Zhang Te holds the walls against all odds; the summer brings plague; the besiegers die in their thousands of disease and Wei arrows. Zhuge Ke\'s army melts away and his prestige with it — and within months Sun Jun\'s assassins will cut him down at a palace banquet.',
  descriptionZh: "建興二年夏。前歲東興大捷之威猶在，太傅諸葛恪盡發吳國之眾二十萬，圍攻魏之合肥新城。守將張特力守孤城，魏援司馬孚、毌丘儉繼至；時值盛暑，疫癘大作，圍城之卒病死、中矢者以萬計。諸葛恪頓兵堅城而師徒喪敗，威望盡失——數月之後，孫峻之刃，便將於宮宴之上取其性命。",
  startDate: { year: 253, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_252),
  forces: FORCES_252,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_252, DEAD_BY_252, 253),
};

// ── Historical: 西陵之戰 (272). Bu Chan surrenders Xiling to Jin; Lu Kang — son
//    of Lu Xun and the last great general Wu will produce — walls in the traitor,
//    smashes Yang Hu's relief columns one by one, then takes the fortress. ──
const CITY_OWNERSHIP_272: Record<string, string> = {
  ...CITY_OWNERSHIP_265,
  xiling: 'sima', // Bu Chan defects, opening the western gorge to Jin
};
const OFFICER_ASSIGNMENTS_272 = {
  ...OFFICER_ASSIGNMENTS_265,
  'bu-chan': { forceId: 'sima', cityId: 'xiling' }, // turned coat, holds Xiling for Jin
};
export const SCENARIO_272_XILING: Scenario = {
  id: 'scn-272-xiling',
  name: { en: 'The Battle of Xiling', zh: '西陵之戰' },
  description:
    'Autumn 272. Bu Chan, commander of Xiling, throws open the gorge that guards Wu\'s western door and surrenders it to Jin. Lu Kang — son of Lu Xun, and the last great general the dynasty will produce — rushes upriver and does the unthinkable: he walls in the traitor\'s fortress without storming it, smashes the three Jin relief columns of Yang Hu, Yang Zhao and Xu Yin one by one, then takes Xiling and puts the Bu clan to the sword. It is the final masterpiece of Wu\'s art of war, and it buys the doomed kingdom one last decade.',
  descriptionZh: "鳳凰元年秋。西陵督步闡盡獻扼守吳國西門之峽口，叛降於晉。鎮軍大將軍陸抗——陸遜之子、吳國所能孕育的最後一員名將——溯江疾進，行常人所不敢為：圍叛城而不急攻，先逐一擊破羊祜、楊肇、徐胤三路晉援，再下西陵，盡誅步氏。此乃吳國兵法之最後傑作，為這氣數將盡的王朝，再續十年之命。",
  startDate: { year: 272, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_272),
  forces: FORCES_265,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_272, DEAD_BY_265, 272),
};

// ── Historical: 遼東·襄平之戰 (238). Gongsun Yuan, third of his line to rule
//    Liaodong as a private kingdom, has thrown off Wei and styled himself King
//    of Yan. Cao Rui still reigns; he sends Sima Yi four thousand li to erase
//    the upstart realm at Xiangping. (New 'yan' force on the 234 board.) ──
const CITY_OWNERSHIP_238: Record<string, string> = {
  ...CITY_OWNERSHIP_234,
  liaodong: 'yan',
  xiangping: 'yan',
  lelang: 'yan',
  daifang: 'yan',
};
const FORCES_238: Force[] = [
  { id: 'cao',     name: { en: 'Wei',     zh: '魏'   }, rulerOfficerId: 'cao-rui',      capitalCityId: 'luoyang',   color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han', zh: '蜀漢' }, rulerOfficerId: 'liu-shan',     capitalCityId: 'chengdu',   color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',      zh: '吳'   }, rulerOfficerId: 'sun-quan',     capitalCityId: 'jianye',    color: '#2f8e6f', isPlayer: false },
  { id: 'yan',     name: { en: 'Yan',     zh: '燕'   }, rulerOfficerId: 'gongsun-yuan', capitalCityId: 'xiangping', color: '#b87a3a', isPlayer: false },
];
const OFFICER_ASSIGNMENTS_238 = {
  ...OFFICER_ASSIGNMENTS_234,
  'sima-yi': { forceId: 'cao', cityId: 'beiping' }, // marching the long road on Liaodong
  'gongsun-yuan': { forceId: 'yan', cityId: 'xiangping' },
};
export const SCENARIO_238_LIAODONG: Scenario = {
  id: 'scn-238-liaodong',
  name: { en: 'The Liaodong Campaign', zh: '遼東·襄平之戰' },
  description:
    'Spring 238. Far in the northeast, Gongsun Yuan — third of his line to rule Liaodong as a private kingdom — has thrown off Wei, taken the title King of Yan, and even courted Wu for an alliance. The Emperor Cao Rui sends his deadliest weapon: Sima Yi, with forty thousand, marches four thousand li to the walls of Xiangping. The autumn rains will flood the siege lines, the city will fall, and the house of Gongsun will be wiped from the earth.',
  descriptionZh: "景初二年春。極北之地，公孫淵——割據遼東、世代自立者三世——叛魏自王，僭號燕王，更遣使通吳以為奧援。魏帝曹叡乃遣其最鋒利之兵刃：司馬懿提四萬之眾，行四千里而臨襄平城下。秋雨將漲其圍塹，孤城終破，公孫一族，自此族滅於天壤之間。",
  startDate: { year: 238, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_238),
  forces: FORCES_238,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_238, [], 238),
};

// ── Historical: 淮南二叛·毌丘儉文欽之亂 (255). Sima Shi has deposed the emperor
//    Cao Fang and rules Wei in all but name. Guanqiu Jian and Wen Qin raise the
//    Huai to avenge the throne; the dying Sima Shi rides out to crush them.
//    (252 board: Shouchun + Lujiang split off as the loyalist 'guanqiu' force.) ──
const CITY_OWNERSHIP_255: Record<string, string> = {
  ...CITY_OWNERSHIP_252,
  shouchun: 'guanqiu',
  lujiang: 'guanqiu',
};
const FORCES_255: Force[] = [
  { id: 'cao',     name: { en: 'Sima Shi',     zh: '司馬師' }, rulerOfficerId: 'sima-shi',     capitalCityId: 'luoyang',  color: '#3a4d8a', isPlayer: false },
  { id: 'guanqiu', name: { en: 'Guanqiu Jian', zh: '毌丘儉' }, rulerOfficerId: 'guanqiu-jian', capitalCityId: 'shouchun', color: '#c0392b', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han',      zh: '蜀漢'  }, rulerOfficerId: 'liu-shan',     capitalCityId: 'chengdu',  color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',           zh: '吳'    }, rulerOfficerId: 'sun-liang',    capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
];
const OFFICER_ASSIGNMENTS_255 = {
  ...OFFICER_ASSIGNMENTS_252,
  'guanqiu-jian': { forceId: 'guanqiu', cityId: 'shouchun' },
  'wen-qin': { forceId: 'guanqiu', cityId: 'shouchun' },
  'wen-yang': { forceId: 'guanqiu', cityId: 'shouchun' },
};
export const SCENARIO_255_HUAINAN2: Scenario = {
  id: 'scn-255-huainan2',
  name: { en: 'Second Huainan Revolt', zh: '淮南二叛·毌丘儉文欽之亂' },
  description:
    'Spring 255. Sima Shi has deposed the emperor Cao Fang and rules Wei in all but name. In the Huai, the veteran Guanqiu Jian and the fierce Wen Qin raise the standard of revolt to avenge the insulted throne, forging the dowager\'s edict and marching on Xuchang. The half-blind Sima Shi, a tumour bursting behind his eye, rides out to meet them — and at Le\'jia, Wen Qin\'s teenage son Wen Yang charges the imperial camp again and again, alone, and very nearly ends the house of Sima then and there.',
  descriptionZh: "正元二年春。司馬師既廢曹芳，魏室名存而實亡。淮南之地，宿將毌丘儉與驍將文欽舉義旗以雪君辱，矯太后之詔，進兵許昌。目疾方劇、目瘤迸裂的司馬師強起親征——樂嘉之戰，文欽之子文鴦，年方十八，單騎數入魏營，往返衝突，幾乎當場傾覆司馬之基業。",
  startDate: { year: 255, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_255),
  forces: FORCES_255,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_255, DEAD_BY_252, 255),
};

// ── Historical: 淮南三叛·諸葛誕之亂 (257). The greatest and last of the three
//    Huai revolts. Zhuge Dan seizes Shouchun, sends his son hostage to Wu for
//    aid, and defies Sima Zhao; the regent rings the city with a quarter-million
//    men. (252 board: Shouchun + Lujiang split off as the 'huainan' force.) ──
const CITY_OWNERSHIP_257: Record<string, string> = {
  ...CITY_OWNERSHIP_252,
  shouchun: 'huainan',
  lujiang: 'huainan',
};
const FORCES_257: Force[] = [
  { id: 'cao',     name: { en: 'Sima Zhao', zh: '司馬昭' }, rulerOfficerId: 'sima-zhao',  capitalCityId: 'luoyang',  color: '#3a4d8a', isPlayer: false },
  { id: 'huainan', name: { en: 'Zhuge Dan', zh: '諸葛誕' }, rulerOfficerId: 'zhuge-dan',  capitalCityId: 'shouchun', color: '#c0392b', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han',   zh: '蜀漢'  }, rulerOfficerId: 'liu-shan',   capitalCityId: 'chengdu',  color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',        zh: '吳'    }, rulerOfficerId: 'sun-liang',  capitalCityId: 'jianye',   color: '#2f8e6f', isPlayer: false },
];
const OFFICER_ASSIGNMENTS_257 = {
  ...OFFICER_ASSIGNMENTS_252,
  'zhuge-dan': { forceId: 'huainan', cityId: 'shouchun' },
  'wen-qin': { forceId: 'huainan', cityId: 'shouchun' }, // fled to Wu in 255, returns with its relief
  'wen-yang': { forceId: 'huainan', cityId: 'shouchun' },
};
export const SCENARIO_257_HUAINAN3: Scenario = {
  id: 'scn-257-huainan3',
  name: { en: 'Third Huainan Revolt', zh: '淮南三叛·諸葛誕之亂' },
  description:
    'Summer 257. The greatest and last of the three Huai revolts. Zhuge Dan — kinsman to Zhuge Liang and Zhuge Ke, and the last of the loyalist generals — seizes Shouchun, kills Sima Zhao\'s inspector, sends his own son hostage to Wu, and defies the regent who now openly reaches for the throne. Wu pours in relief under Wen Qin, Tang Zi and Quan Yi; Sima Zhao marches the boy-emperor and a quarter-million men east to ring the city in siege walls. Within those walls, the alliance of rebels and Wu will curdle into mutual slaughter before the year is out.',
  descriptionZh: "甘露二年夏。淮南三叛之最大者，亦其終局。諸葛誕——諸葛亮、諸葛恪之族親，忠魏諸將之碩果——據壽春，斬司馬昭之刺史，遣子質於吳，公然抗拒這位已露篡心的權臣。吳發大軍，以文欽、唐咨、全懌入援；司馬昭挾幼帝、提二十六萬之眾東出，築壘環城而圍之。然城中叛軍與吳援，未及歲終，便將在猜忌中自相屠戮。",
  startDate: { year: 257, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_257),
  forces: FORCES_257,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_257, DEAD_BY_252, 257),
};

// ── Historical: 易京之戰 (199). Lü Bu lies strangled at the White Gate and
//    Xuzhou has fallen to Cao Cao; Yuan Shao turns north to finish his last
//    rival, Gongsun Zan, walled into the iron towers of Yijing. The battle that
//    hands Yuan Shao all four provinces. (198 board, Lü Bu's Xiapi gone to Cao.) ──
const CITY_OWNERSHIP_199: Record<string, string> = {
  ...CITY_OWNERSHIP_198,
  xiapi: 'cao', // Lü Bu strangled at the White Gate Tower; Xuzhou passes to Cao Cao
};
const FORCES_199: Force[] = FORCES_198.filter((f) => f.id !== 'lubu');
const OFFICER_ASSIGNMENTS_199 = {
  ...OFFICER_ASSIGNMENTS_198,
  // Lü Bu's faction is broken: the dead (Lü Bu, Chen Gong, Gao Shun) are swept
  // out by date; the survivors and the turncoat Chens go over to Cao Cao.
  'lu-bu': { forceId: 'cao', cityId: 'xiapi' },
  'chen-gong': { forceId: 'cao', cityId: 'xiapi' },
  'gao-shun': { forceId: 'cao', cityId: 'xiapi' },
  'cao-xing': { forceId: 'cao', cityId: 'xiapi' },
  'song-xian': { forceId: 'cao', cityId: 'xiapi' },
  'hou-cheng': { forceId: 'cao', cityId: 'xiapi' },
  'wei-xu': { forceId: 'cao', cityId: 'xiapi' },
  'diaochan': { forceId: 'cao', cityId: 'xiapi' },
  'chen-deng': { forceId: 'cao', cityId: 'xiapi' },
  'chen-gui': { forceId: 'cao', cityId: 'xiapi' },
};
export const SCENARIO_199_YIJING: Scenario = {
  id: 'scn-199-yijing',
  name: { en: 'The Siege of Yijing', zh: '易京之戰' },
  description:
    'Spring 199. Lü Bu lies strangled at the White Gate Tower and Xuzhou has passed to Cao Cao — but in the north, Yuan Shao turns to finish the last rival barring his path to the four provinces: Gongsun Zan, the White Horse General, sealed inside the iron towers of Yijing with a mountain of grain and ten years\' resolve. Yuan Shao\'s host rings the walls and tunnels beneath them. When the towers fall, Gongsun Zan will burn his own household and himself — and all the north will be Yuan Shao\'s, save one man at Xuchang.',
  descriptionZh: "建安四年春。呂布既縊死於白門樓，徐州歸於曹操——而河北之地，袁紹回師以了結其取四州路上最後之勁敵：白馬將軍公孫瓚，自閉於易京鐵壘，積穀如山、誓守十年。袁紹大軍環其城而穿地道以攻之。樓壘既破，公孫瓚將自焚妻孥而後自盡——河北自此盡歸袁紹，唯許昌一人尚為其敵。",
  startDate: { year: 199, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_199),
  forces: FORCES_199,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_199, DEAD_BY_198, 199),
};

// ── Historical: 白狼山·北征烏桓 (207). The Yuan brothers have fled to the
//    Wuhuan chieftain Tadun on the steppe; Cao Cao gambles on a waterless forced
//    march to fall on them at White Wolf Mountain, where Zhang Liao's charge cuts
//    down Tadun and makes the north whole. (207 board + new 'wuhuan' force.) ──
const CITY_OWNERSHIP_207_WUHUAN: Record<string, string> = {
  ...CITY_OWNERSHIP_207,
  liucheng: 'wuhuan',
  wuhuan: 'wuhuan',
};
const FORCES_207_WUHUAN: Force[] = [
  ...FORCES_207,
  { id: 'wuhuan', name: { en: 'Wuhuan', zh: '烏桓' }, rulerOfficerId: 'tadun', capitalCityId: 'liucheng', color: '#7a6a9a', isPlayer: false },
];
const OFFICER_ASSIGNMENTS_207_WUHUAN = {
  ...OFFICER_ASSIGNMENTS_207,
  'tadun': { forceId: 'wuhuan', cityId: 'liucheng' },
  'yuan-shang': { forceId: 'wuhuan', cityId: 'liucheng' }, // fled to the steppe
  'yuan-xi': { forceId: 'wuhuan', cityId: 'liucheng' },
};
export const SCENARIO_207_BAILANG: Scenario = {
  id: 'scn-207-bailang',
  name: { en: 'White Wolf Mountain', zh: '白狼山·北征烏桓' },
  description:
    'Autumn 207. The brothers Yuan Shang and Yuan Xi, beaten out of Hebei, have fled to the Wuhuan chieftain Tadun on the steppe, and the northern frontier festers. Against every counsel, Cao Cao leaves his baggage and drives his army on a desperate forced march through three hundred li of waterless waste — guided by Tian Chou over the abandoned Lulong passes — to burst upon the Wuhuan host at White Wolf Mountain. Zhang Liao leads the charge that cuts down Tadun himself. With this stroke the last embers of the house of Yuan are stamped out and the north made whole.',
  descriptionZh: "建安十二年秋。袁尚、袁熙兄弟為河北所敗，亡奔塞外烏桓單于蹋頓，北疆遂成腹心之患。曹操不顧眾諫，棄輜重而驅軍疾行，穿三百里無水之荒，賴田疇引由廢棄之盧龍故道——驟臨白狼山，掩殺烏桓之眾。張遼率鋒陷陣，臨陣斬蹋頓於馬下。此一擊既出，袁氏最後之餘燼盡熄，北方自此混一。",
  startDate: { year: 207, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_207_WUHUAN),
  forces: FORCES_207_WUHUAN,
  // The base 207 death-list buries Tadun and the Yuan brothers (they perish in
  // this very campaign); here they must start alive to fight it.
  officers: buildInitialOfficers(
    OFFICER_ASSIGNMENTS_207_WUHUAN,
    DEAD_BY_207.filter((id) => id !== 'tadun' && id !== 'yuan-shang' && id !== 'yuan-xi'),
    207,
  ),
};

// ── Historical: 石亭之戰 (228). The same year as Jieting, but in the east: Zhou
//    Fang's feigned surrender lures Cao Xiu deep into Wu at Wan, where Lu Xun
//    springs the trap at Shiting and shatters the Wei army — the wound that kills
//    Cao Xiu and crowns Lu Xun supreme commander. (228 board, eastern front.) ──
const CITY_OWNERSHIP_228_SHITING: Record<string, string> = {
  ...CITY_OWNERSHIP_228,
  wan: 'cao', // Cao Xiu, gulled by Zhou Fang, has pushed deep into Wu and taken Wan
};
const OFFICER_ASSIGNMENTS_228_SHITING = {
  ...OFFICER_ASSIGNMENTS_228,
  'cao-xiu': { forceId: 'cao', cityId: 'wan' }, // lured deep into Wu
  'lu-xun': { forceId: 'sun', cityId: 'yuzhang' }, // grand commander, about to spring Shiting
};
export const SCENARIO_228_SHITING: Scenario = {
  id: 'scn-228-shiting',
  name: { en: 'The Battle of Shiting', zh: '石亭之戰' },
  description:
    'Summer 228. The same season Ma Su lost Jieting in the west, the war blazes in the east. Zhou Fang, governor of Poyang, shaves his own head to make his feigned surrender ring true, and lures the Wei general Cao Xiu with a hundred thousand men deep into Wu at Wan. There the Grand Commander Lu Xun lies waiting: at Shiting he springs three armies upon the trapped Cao Xiu and routs him utterly. The Wei general flees, his back broken with shame, and is dead within months — while Lu Xun stands unrivalled as the sword of Wu.',
  descriptionZh: "建興六年夏（魏太和二年）。正當馬謖失街亭於西陲之際，戰火亦熾於東。鄱陽太守周魴斷髮以堅其詐降，誘魏將曹休提十萬之眾深入吳境至皖。大都督陸遜伏候於此：石亭一役，縱三軍掩擊困頓之曹休，大破之。魏將狼狽而遁，憤恚成疾，數月而卒——陸遜遂為東吳之利劍，一時無兩。",
  startDate: { year: 228, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_228_SHITING),
  forces: FORCES_228,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_228_SHITING, DEAD_BY_228, 228),
};

// ── Historical: 孫策定江東 (195). With a thousand borrowed troops and his
//    father's veterans, the twenty-year-old Sun Ce crosses the Yangtze to carve
//    a kingdom from the lords of the southeast — Liu Yao, Yan Baihu, Wang Lang,
//    Hua Xin. (197 board, the southeast shattered back into its rival lords.) ──
const CITY_OWNERSHIP_195_JIANGDONG: Record<string, string> = {
  ...CITY_OWNERSHIP_197,
  danyang: 'sun',       // Sun Ce's bridgehead, his uncle Wu Jing's ground
  jianye: 'liu-yao',    // Liu Yao, Inspector of Yang, holds Moling / Qu'a
  wu: 'yan-baihu',      // Yan Baihu, the "Lord of Dongye", in Wu commandery
  kuaiji: 'wang-lang',  // Wang Lang, Grand Administrator of Kuaiji
  yuzhang: 'hua-xin',   // Hua Xin in Yuzhang
  changsha: 'liu-biao', // Sun Ce has not yet reached the south
};
const FORCES_195_JIANGDONG: Force[] = [
  ...FORCES_197.filter((f) => f.id !== 'sun'),
  { id: 'sun',       name: { en: 'Sun Ce',    zh: '孫策軍' }, rulerOfficerId: 'sun-ce',    capitalCityId: 'danyang', color: '#2f8e6f', isPlayer: false },
  { id: 'liu-yao',   name: { en: 'Liu Yao',   zh: '劉繇'   }, rulerOfficerId: 'liu-yao',   capitalCityId: 'jianye',  color: '#6a4c93', isPlayer: false },
  { id: 'yan-baihu', name: { en: 'Yan Baihu', zh: '嚴白虎' }, rulerOfficerId: 'yan-baihu', capitalCityId: 'wu',      color: '#8b2e2e', isPlayer: false },
  { id: 'wang-lang', name: { en: 'Wang Lang', zh: '王朗'   }, rulerOfficerId: 'wang-lang', capitalCityId: 'kuaiji',  color: '#5a7aa8', isPlayer: false },
  { id: 'hua-xin',   name: { en: 'Hua Xin',   zh: '華歆'   }, rulerOfficerId: 'hua-xin',   capitalCityId: 'yuzhang', color: '#7f8c2a', isPlayer: false },
];
const OFFICER_ASSIGNMENTS_195_JIANGDONG = {
  ...OFFICER_ASSIGNMENTS_197,
  'sun-ce': { forceId: 'sun', cityId: 'danyang' },
  'sun-quan': { forceId: 'sun', cityId: 'danyang' },
  'zhou-yu': { forceId: 'sun', cityId: 'danyang' },
  'cheng-pu': { forceId: 'sun', cityId: 'danyang' },
  'huang-gai': { forceId: 'sun', cityId: 'danyang' },
  'liu-yao': { forceId: 'liu-yao', cityId: 'jianye' },
  'taishi-ci': { forceId: 'liu-yao', cityId: 'jianye' }, // Liu Yao's champion; the duel at Shenting
  'yan-baihu': { forceId: 'yan-baihu', cityId: 'wu' },
  'wang-lang': { forceId: 'wang-lang', cityId: 'kuaiji' },
  'hua-xin': { forceId: 'hua-xin', cityId: 'yuzhang' },
};
export const SCENARIO_195_JIANGDONG: Scenario = {
  id: 'scn-195-jiangdong',
  name: { en: 'Sun Ce Conquers the Southeast', zh: '孫策定江東' },
  description:
    'Winter 195. With barely a thousand troops borrowed from Yuan Shu and his late father\'s hardened veterans, the twenty-year-old Sun Ce crosses the Great River to make his own destiny in the southeast. Arrayed against the Little Conqueror are the lords of the Wu country: Liu Yao, the court-appointed Inspector of Yang province, at Moling; the bandit-magnate Yan Baihu in Wu; Wang Lang, the scholar-governor of Kuaiji; and Hua Xin in Yuzhang. Within three years Sun Ce will break them all and lay the foundation of a kingdom — if the assassin\'s arrow does not find him first.',
  descriptionZh: "興平二年冬。孫策年方二十，僅以借自袁術之千餘兵卒、並其亡父之百戰舊部，渡大江而自立基業於東南。與這位小霸王為敵者，乃江東群雄：朝廷所命之揚州刺史劉繇，據秣陵曲阿；吳郡豪強「東冶之主」嚴白虎；會稽儒宗太守王朗；及豫章華歆。三年之內，孫策將盡破之，奠一國之基——倘若刺客之矢不先尋上他。",
  startDate: { year: 195, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_195_JIANGDONG),
  forces: FORCES_195_JIANGDONG,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_195_JIANGDONG, [], 195),
};

// ── Historical: 定軍山·漢中之戰 (218). Zhang Lu's theocracy has fallen to Cao
//    Cao and Xiahou Yuan holds Hanzhong; now Liu Bei, urged on by Fa Zheng,
//    hurls his new realm of Yi against the Qinling passes. At Mount Dingjun the
//    old tiger Huang Zhong will take Xiahou Yuan's head. (215 board, Hanzhong
//    flipped to Cao, Zhang Lu's faction dissolved.) ──
const CITY_OWNERSHIP_218_DINGJUN: Record<string, string> = {
  ...CITY_OWNERSHIP_215,
  hanzhong: 'cao', // Zhang Lu subdued 215; Hanzhong now Cao's, held by Xiahou Yuan
  wudu: 'cao',
  yangping: 'cao', // the Yangping passes — the gate Liu Bei must force
};
const FORCES_218_DINGJUN: Force[] = FORCES_215.filter((f) => f.id !== 'zhang-lu');
const OFFICER_ASSIGNMENTS_218_DINGJUN = {
  ...OFFICER_ASSIGNMENTS_215,
  // Hanzhong's defence under Xiahou Yuan; Zhang Lu's men gone over to Cao (Zhang
  // Lu himself, dead by 216, is swept out by date).
  'xiahou-yuan': { forceId: 'cao', cityId: 'hanzhong' },
  'zhang-he': { forceId: 'cao', cityId: 'hanzhong' },
  'yang-song': { forceId: 'cao', cityId: 'hanzhong' },
  'zhang-wei': { forceId: 'cao', cityId: 'hanzhong' },
  // Liu Bei's army gathered at Jiameng, the springboard up the Jinniu road.
  'liu-bei': { forceId: 'liu-bei', cityId: 'jiameng' },
  'huang-zhong': { forceId: 'liu-bei', cityId: 'jiameng' },
  'fa-zheng': { forceId: 'liu-bei', cityId: 'jiameng' },
  'zhao-yun': { forceId: 'liu-bei', cityId: 'jiameng' },
};
export const SCENARIO_218_DINGJUN: Scenario = {
  id: 'scn-218-dingjun',
  name: { en: 'Mount Dingjun', zh: '定軍山·漢中之戰' },
  description:
    'Winter 218. Zhang Lu\'s theocracy has fallen and Hanzhong is Cao Cao\'s, held by the fierce Xiahou Yuan and Zhang He. Now Liu Bei, master of Yi province and pressed hard by his strategist Fa Zheng, hurls his army north against the Qinling passes for the prize that will make him a king. The campaign grinds for a year in the gorges — until, on the slopes of Mount Dingjun, the old tiger Huang Zhong charges downhill and takes Xiahou Yuan\'s head, and the gate to Hanzhong swings open.',
  descriptionZh: "建安二十三年冬。張魯之政教既亡，漢中歸於曹操，以驍將夏侯淵、張郃守之。今劉備既得益州，又為謀主法正所激，遂揮師北出，仰攻秦嶺諸隘，以爭此使他得王天下之地。是役於峽谷間鏖戰經年——直至定軍山之坡，老虎黃忠居高馳下，斬夏侯淵之首，漢中之門遂為之洞開。",
  startDate: { year: 218, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_218_DINGJUN),
  forces: FORCES_218_DINGJUN,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_218_DINGJUN, [], 218),
};

// ── What-if: 水淹七軍·威震華夏 (219). Guan Yu's drowning of Yu Jin's seven
//    armies is pressed to the hilt: Fan and Xiangyang fall, and the corridor
//    up the Han River — Xiangyang, Xinye, Wancheng — becomes a dagger aimed at
//    Xuchang. Cao Cao speaks aloud of moving the capital north. ──
const CITY_OWNERSHIP_WHATIF_GUANYU_NORTH: Record<string, string> = {
  ...CITY_OWNERSHIP_219,
  xiangyang: 'liu-bei',
  xinye: 'liu-bei',
  wancheng: 'liu-bei',
};
export const SCENARIO_WHATIF_GUANYU_NORTH: Scenario = {
  id: 'scn-whatif-guanyu-north',
  name: { en: 'If Guan Yu Had Taken Fan', zh: '若關羽威震華夏' },
  kind: 'whatif',
  description:
    'Autumn 219. The autumn rains came, the Han burst its banks, and Guan Yu drowned Yu Jin\'s seven armies — but this time the Marquis of Hanshou did not stop. Fan fell, Xiangyang opened its gates, and the Lord of Changsheng drove north up the river road through Xinye to Wancheng, until his banners were a hundred li from Xuchang. Cao Cao, his court in uproar, debates moving the Emperor beyond the Yellow River. Whether Jiangling holds at his back is another question — but for now, all China trembles at the name of Guan Yunchang.',
  descriptionZh: "建安二十四年秋。秋雨大至，漢水暴溢，關羽水淹于禁七軍——然此番漢壽亭侯不止於此。樊城既破，襄陽開門，雲長沿漢北上，經新野直趨宛城，旌旗距許昌不過百里。曹操朝野震動，竟議遷天子於河北以避其鋒。江陵之後路能否守得，尚在未定之天——然此刻舉華夏皆為關雲長之名而戰栗。",
  startDate: { year: 219, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_WHATIF_GUANYU_NORTH),
  forces: FORCES_219,
  officers: buildInitialOfficers(
    whatIfOfficers(
      { ...OFFICER_ASSIGNMENTS_219, 'guan-yu': { forceId: 'liu-bei', cityId: 'xiangyang' } },
      CITY_OWNERSHIP_WHATIF_GUANYU_NORTH,
      FORCES_219,
    ),
    DEAD_BY_219,
    219,
  ),
};

// ── What-if: 高平陵之變·曹爽先發制人 (249). Warned in time, Cao Shuang does
//    not surrender — he races back to hold Luoyang and the Emperor, and Sima
//    Yi's coup miscarries. The old fox falls back on his Hebei power-base at
//    Ye, and the realm of Wei splits in two along the Yellow River. ──
const CITY_OWNERSHIP_WHATIF_GAOPINGLING: Record<string, string> = {
  ...CITY_OWNERSHIP_249,
  luoyang: 'cao',
  xuchang: 'cao',
  chenliu: 'cao',
  hulao: 'cao',
  guandu: 'cao',
  runan: 'cao',
  shouchun: 'cao',
  hefei: 'cao',
};
const FORCES_WHATIF_GAOPINGLING: Force[] = [
  { id: 'sima',    name: { en: 'Sima Faction', zh: '司馬黨' }, rulerOfficerId: 'sima-yi',    capitalCityId: 'ye',      color: '#3a4d8a', isPlayer: false },
  { id: 'cao',     name: { en: 'Cao Shuang',   zh: '曹爽軍' }, rulerOfficerId: 'cao-shuang', capitalCityId: 'luoyang', color: '#3a7dd9', isPlayer: false },
  { id: 'liu-bei', name: { en: 'Shu Han',      zh: '蜀漢'   }, rulerOfficerId: 'liu-shan',   capitalCityId: 'chengdu', color: '#a85d8a', isPlayer: false },
  { id: 'sun',     name: { en: 'Wu',           zh: '吳'     }, rulerOfficerId: 'sun-quan',   capitalCityId: 'jianye',  color: '#2f8e6f', isPlayer: false },
];
export const SCENARIO_WHATIF_GAOPINGLING: Scenario = {
  id: 'scn-whatif-gaopingling',
  name: { en: 'If Cao Shuang Had Struck First', zh: '若曹爽先發制人' },
  kind: 'whatif',
  description:
    'Spring 249. As Sima Yi seizes the gates of Luoyang behind his back, the regent Cao Shuang — escorting the young Emperor home from the Gaoping Tombs — does not falter. Huan Fan\'s counsel wins out: rather than lay down his seals, Cao Shuang gallops the Emperor to safety, raises the Guanzhong armies, and proclaims the Simas rebels. The capital, Xuchang, and the rich Huai frontier rally to the man who holds the Son of Heaven; Sima Yi, his lightning coup turned to open war, falls back on the family\'s old strength in Hebei. Wei is cloven in two, and the empire holds its breath.',
  descriptionZh: "正始十年春。司馬懿閉洛陽城門於其後，而大將軍曹爽——方自高平陵奉幼帝還京——竟不自亂。桓範之謀得行：曹爽不肯解印就縛，反挾天子疾走，發關中之兵，傳檄討司馬為叛逆。京畿、許昌、淮南膏腴之地，皆歸於挾天子者；司馬懿閃電之變化為明火戰爭，退保河北司馬氏之舊基。魏室自此一分為二，天下屏息。",
  startDate: { year: 249, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_WHATIF_GAOPINGLING),
  forces: FORCES_WHATIF_GAOPINGLING,
  officers: buildInitialOfficers(
    whatIfOfficers(
      { ...OFFICER_ASSIGNMENTS_249, 'cao-shuang': { forceId: 'cao', cityId: 'luoyang' } },
      CITY_OWNERSHIP_WHATIF_GAOPINGLING,
      FORCES_WHATIF_GAOPINGLING,
    ),
    DEAD_BY_249,
    249,
  ),
};

// ── What-if: 若陸遜不冤死 (249). The poison of the Two-Palaces succession feud
//    never reached him; Lu Xun, victor of Xiaoting and Shiting, lives on as the
//    pillar of Wu into the age of the boy-emperor and the regents. ──
export const SCENARIO_WHATIF_LUXUN_LIVES: Scenario = {
  id: 'scn-whatif-luxun-lives',
  name: { en: 'If Lu Xun Had Not Been Hounded to Death', zh: '若陸遜不冤死' },
  kind: 'whatif',
  description:
    'Year 249. The Two-Palaces feud — Sun Quan\'s ruinous quarrel between crown prince and rival son — broke many great men of Wu with grief and disgrace; chief among them Lu Xun, the burner of Liu Bei\'s camps at Xiaoting and the breaker of Cao Xiu at Shiting, hounded into his grave by royal reproaches in 245. Here he weathered the storm. As Wei tears itself apart at the Gaoping Tombs and Shu drills for new northern campaigns, the aged Grand Marshal still stands at the head of Wu\'s armies on the Great River — the last of the founding generation, and worth a province to Sun Quan\'s failing house.',
  descriptionZh: "赤烏十二年。二宮之爭——孫權於太子與魯王之間釀成的毀滅性內鬩——以憂憤與屈辱折損吳國無數棟梁；其首者，便是夷陵焚劉備連營、石亭破曹休的陸遜，竟於赤烏八年為君上詰責，憤恚而亡。此世他撐過了這場風暴。當魏室於高平陵自相撕裂、蜀漢整軍再圖北伐之際，這位老邁的上大將軍，仍立於大江之上、吳軍之首——開國一代之碩果僅存者，於孫權衰朽之家，一人可抵一州。",
  startDate: { year: 249, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_249),
  forces: FORCES_249,
  officers: buildInitialOfficers(OFFICER_ASSIGNMENTS_249, DEAD_BY_249, 249),
};

// ════════════════════════════════════════════════════════════════════════
// 戰國七雄 — Warring States (parallel timeline on the AD engine). The 歷代名將
// Warring-States roster already carries playable birthYears ~140–158 AD, so the
// seven kingdoms field on a Three-Kingdoms map mapped onto the old states at a
// 178 AD datum (the great names are then ~20–45). Generals not enfeoffed to a
// state stay as unsearched free agents — the wandering persuaders (Su Qin, Zhang
// Yi), philosophers (Mencius, Xunzi, Mozi) and assassins drift between courts.
// ════════════════════════════════════════════════════════════════════════
function buildWarringStatesOfficers(
  assignments: Record<string, { forceId: string; cityId: string }>,
  dynasties: Dynasty[] = ['warring-states'],
): Officer[] {
  return buildHistoricalOfficers(dynasties).map((o) => {
    const a = assignments[o.id];
    return a
      ? { ...o, forceId: a.forceId, locationCityId: a.cityId, status: 'idle' as const, loyalty: 100 }
      : o;
  });
}

const FORCES_WS_SEVEN: Force[] = [
  { id: 'qin',  name: { en: 'Qin',  zh: '秦' }, rulerOfficerId: 'hist-qin-zhaoxiang', capitalCityId: 'changan',   color: '#4a4a6a', isPlayer: false },
  { id: 'chu',  name: { en: 'Chu',  zh: '楚' }, rulerOfficerId: 'hist-chu-huaiwang',  capitalCityId: 'jiangling', color: '#c0392b', isPlayer: false },
  { id: 'qi',   name: { en: 'Qi',   zh: '齊' }, rulerOfficerId: 'hist-qi-xuanwang',   capitalCityId: 'linzi',     color: '#2aa8c0', isPlayer: false },
  { id: 'yan',  name: { en: 'Yan',  zh: '燕' }, rulerOfficerId: 'hist-yan-zhaowang',  capitalCityId: 'ji',        color: '#5a7a8a', isPlayer: false },
  { id: 'zhao', name: { en: 'Zhao', zh: '趙' }, rulerOfficerId: 'hist-zhao-wuling',   capitalCityId: 'ye',        color: '#e07b39', isPlayer: false },
  { id: 'wei',  name: { en: 'Wei',  zh: '魏' }, rulerOfficerId: 'hist-wei-huiwang',   capitalCityId: 'chenliu',   color: '#2f8e6f', isPlayer: false },
  { id: 'han',  name: { en: 'Han',  zh: '韓' }, rulerOfficerId: 'hist-han-zhaohou',   capitalCityId: 'xuchang',   color: '#d4af37', isPlayer: false },
];

const CITY_OWNERSHIP_WS_SEVEN: Record<string, string> = {
  // 秦 — Guanzhong, the Long corridor, Hanzhong and the conquered Ba-Shu.
  changan: 'qin', mei: 'qin', chencang: 'qin', tongguan: 'qin', wuguan: 'qin',
  sanguan: 'qin', xiaoguan: 'qin', baishuiguan: 'qin', jianmen: 'qin', jieting: 'qin',
  hanzhong: 'qin', yangping: 'qin', xincheng: 'qin', wudu: 'qin', shangyong: 'qin',
  anding: 'qin', tianshui: 'qin', longxi: 'qin', shanggui: 'qin', jincheng: 'qin',
  wuwei: 'qin', jiuquan: 'qin', dunhuang: 'qin', chengdu: 'qin', jiangzhou: 'qin',
  yongan: 'qin', zitong: 'qin', fucheng: 'qin', mianzhu: 'qin', luocheng: 'qin',
  jiameng: 'qin', baxi: 'qin', yinping: 'qin', nanzhong: 'qin', jianning: 'qin',
  yunnan: 'qin', yongchang: 'qin', yuexi: 'qin',
  // 趙 — Jin highlands, Yanmen, the northern frontier and Handan (Ye).
  taiyuan: 'zhao', yanmen: 'zhao', shangdang: 'zhao', yunzhong: 'zhao', wuyuan: 'zhao',
  shuofang: 'zhao', ye: 'zhao', boling: 'zhao', bohai: 'zhao', pingyuan: 'zhao',
  nanpi: 'zhao',
  // 燕 — the cold northeast out to Liaodong.
  ji: 'yan', beiping: 'yan', yuyang: 'yan', liaodong: 'yan', xiangping: 'yan',
  liucheng: 'yan', wuhuan: 'yan', lelang: 'yan', daifang: 'yan',
  // 齊 — the Shandong peninsula around Linzi.
  linzi: 'qi', beihai: 'qi', langya: 'qi', pengcheng: 'qi', xiapi: 'qi', xiaopei: 'qi',
  // 魏 — Daliang and the central plain.
  chenliu: 'wei', puyang: 'wei', guandu: 'wei', hulao: 'wei', baima: 'wei',
  yanjin: 'wei', liyang: 'wei',
  // 韓 — Xinzheng, Yiyang and the smith-cities of the centre.
  xuchang: 'han', luoyang: 'han', runan: 'han', xinye: 'han',
  // 楚 — the vast south, from Ying to the Yangtze, Huai and Lingnan.
  jiangling: 'chu', wancheng: 'chu', wan: 'chu', xiangyang: 'chu', fancheng: 'chu',
  shouchun: 'chu', hefei: 'chu', lujiang: 'chu', ruxu: 'chu', jiangxia: 'chu',
  jianye: 'chu', wu: 'chu', wuxi: 'chu', kuaiji: 'chu', danyang: 'chu',
  yuzhang: 'chu', chaisang: 'chu', poyang: 'chu', hukou: 'chu', changsha: 'chu',
  lingling: 'chu', wuling: 'chu', guiyang: 'chu', luling: 'chu', baqiu: 'chu',
  wuchang: 'chu', xiling: 'chu', yiling: 'chu', xiaoting: 'chu', maicheng: 'chu',
  gongan: 'chu', bowang: 'chu', guangling: 'chu', nanhai: 'chu', hepu: 'chu',
  jiaozhi: 'chu', guilin: 'chu', cangwu: 'chu', jiuzhen: 'chu', rinan: 'chu',
  zhuyai: 'chu', linhai: 'chu', 'yi-county': 'chu', chibi: 'chu', changban: 'chu',
};

const ASSIGN_WS_SEVEN: Record<string, { forceId: string; cityId: string }> = {
  // 秦 — king, the spear (Bai Qi, Wang Jian, Sima Cuo, Meng Ao), the law (Shang
  //     Yang, Fan Ju, Zhang Yi, Lü Buwei, Cai Ze, Gan Mao, Chuli Ji).
  'hist-qin-zhaoxiang': { forceId: 'qin', cityId: 'changan' },
  'hist-bai-qi':        { forceId: 'qin', cityId: 'changan' },
  'hist-wang-jian':     { forceId: 'qin', cityId: 'mei' },
  'hist-sima-cuo':      { forceId: 'qin', cityId: 'hanzhong' },
  'hist-meng-ao':       { forceId: 'qin', cityId: 'chencang' },
  'hist-shang-yang':    { forceId: 'qin', cityId: 'changan' },
  'hist-fan-ju':        { forceId: 'qin', cityId: 'changan' },
  'hist-zhang-yi':      { forceId: 'qin', cityId: 'changan' },
  'hist-lu-buwei':      { forceId: 'qin', cityId: 'changan' },
  'hist-cai-ze':        { forceId: 'qin', cityId: 'changan' },
  'hist-gan-mao':       { forceId: 'qin', cityId: 'chengdu' },
  'hist-chuli-ji':      { forceId: 'qin', cityId: 'changan' },
  // 趙 — Wuling Wang, the four generals (Lian Po, Zhao She, Li Mu, Pang Xuan,
  //     Yue Cheng, Zhao Kuo) and Lin Xiangru / Pingyuan Jun / Mao Sui.
  'hist-zhao-wuling':   { forceId: 'zhao', cityId: 'ye' },
  'hist-lian-po':       { forceId: 'zhao', cityId: 'ye' },
  'hist-zhao-she':      { forceId: 'zhao', cityId: 'ye' },
  'hist-li-mu':         { forceId: 'zhao', cityId: 'yanmen' },
  'hist-pang-xuan':     { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-yue-cheng':     { forceId: 'zhao', cityId: 'ye' },
  'hist-zhao-kuo':      { forceId: 'zhao', cityId: 'ye' },
  'hist-lin-xiangru':   { forceId: 'zhao', cityId: 'ye' },
  'hist-pingyuan-jun':  { forceId: 'zhao', cityId: 'ye' },
  'hist-mao-sui':       { forceId: 'zhao', cityId: 'ye' },
  // 齊 — Xuan Wang, Tian Dan & Sun Bin & Kuang Zhang, and the Jixia court
  //     (Mengchang Jun, Zou Ji, Feng Xuan, Zou Yan).
  'hist-qi-xuanwang':   { forceId: 'qi', cityId: 'linzi' },
  'hist-tian-dan':      { forceId: 'qi', cityId: 'linzi' },
  'hist-sun-bin':       { forceId: 'qi', cityId: 'linzi' },
  'hist-kuang-zhang':   { forceId: 'qi', cityId: 'langya' },
  'hist-mengchang-jun': { forceId: 'qi', cityId: 'linzi' },
  'hist-zou-ji':        { forceId: 'qi', cityId: 'linzi' },
  'hist-feng-xuan':     { forceId: 'qi', cityId: 'linzi' },
  'hist-zou-yan':       { forceId: 'qi', cityId: 'linzi' },
  // 楚 — Huai Wang, Chunshen Jun, Qu Yuan, Zhuang Qiao, Zhuang Xin, Zheng Xiu.
  'hist-chu-huaiwang':  { forceId: 'chu', cityId: 'jiangling' },
  'hist-chunshen-jun':  { forceId: 'chu', cityId: 'jiangling' },
  'hist-qu-yuan':       { forceId: 'chu', cityId: 'jiangling' },
  'hist-zhuang-qiao':   { forceId: 'chu', cityId: 'shouchun' },
  'hist-zhuang-xin':    { forceId: 'chu', cityId: 'jiangling' },
  'hist-zheng-xiu':     { forceId: 'chu', cityId: 'jiangling' },
  // 燕 — Zhao Wang and his golden terrace: Yue Yi, Ju Xin, Su Dai, and the
  //     assassins around Crown Prince Dan (Jing Ke, Gao Jianli).
  'hist-yan-zhaowang':  { forceId: 'yan', cityId: 'ji' },
  'hist-yue-yi':        { forceId: 'yan', cityId: 'ji' },
  'hist-ju-xin':        { forceId: 'yan', cityId: 'ji' },
  'hist-su-dai':        { forceId: 'yan', cityId: 'ji' },
  'hist-taizi-dan':     { forceId: 'yan', cityId: 'beiping' },
  'hist-jing-ke':       { forceId: 'yan', cityId: 'beiping' },
  'hist-gao-jianli':    { forceId: 'yan', cityId: 'beiping' },
  // 魏 — Hui Wang, the generals it squandered (Pang Juan, Wu Qi, Yue Yang) and
  //     Lord Xinling with Zhu Hai / Hou Ying / Gongshu Cuo.
  'hist-wei-huiwang':   { forceId: 'wei', cityId: 'chenliu' },
  'hist-pang-juan':     { forceId: 'wei', cityId: 'chenliu' },
  'hist-wu-qi':         { forceId: 'wei', cityId: 'puyang' },
  'hist-yue-yang':      { forceId: 'wei', cityId: 'chenliu' },
  'hist-xinling-jun':   { forceId: 'wei', cityId: 'chenliu' },
  'hist-zhu-hai':       { forceId: 'wei', cityId: 'chenliu' },
  'hist-hou-ying':      { forceId: 'wei', cityId: 'chenliu' },
  'hist-gongshu-cuo':   { forceId: 'wei', cityId: 'puyang' },
  // 韓 — Zhao Hou and the Legalists (Shen Buhai, Han Fei), plus Nie Zheng.
  'hist-han-zhaohou':   { forceId: 'han', cityId: 'xuchang' },
  'hist-shen-buhai':    { forceId: 'han', cityId: 'xuchang' },
  'hist-han-fei':       { forceId: 'han', cityId: 'xuchang' },
  'hist-nie-zheng':     { forceId: 'han', cityId: 'xuchang' },
  'hist-gong-zhong':    { forceId: 'han', cityId: 'luoyang' },
};

export const SCENARIO_WS_SEVEN: Scenario = {
  id: 'scn-ws-seven',
  name: { en: 'The Seven Warring States', zh: '戰國七雄·逐鹿' },
  description:
    'A parallel age of iron and intrigue. The house of Zhou is a shadow, and seven kingdoms contend for all under heaven: Qin rising in the west behind Shang Yang\'s laws and Bai Qi\'s spear; Zhao with its hu-fu cavalry and the generals Lian Po and Li Mu; wealthy Qi at Linzi with its Jixia academy; the vast southern Chu; Yan of the cold north and its avenger Yue Yi; Wei that was first to power and squandered it; and Han, smith of the realm\'s finest iron. The persuaders Su Qin and Zhang Yi wander between the courts, selling alliance and betrayal. Whoever masters the others will forge the first empire under heaven.',
  descriptionZh: "鐵與謀的並世之局。周室如影，七雄爭天下：秦據西陲，恃商鞅之法、白起之矛而崛起；趙有胡服騎射、廉頗李牧之師；臨淄之齊富甲東方，稷下學宮冠絕諸侯；南方之楚廣袤無垠；北地之燕與其復仇者樂毅；魏為最先稱霸而又自棄之者；韓鑄天下之利兵。蘇秦張儀縱橫於列國之間，售合縱連橫、賣背盟負約。能制群雄者，將鑄天下第一帝國。",
  startDate: { year: 178, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_SEVEN),
  forces: FORCES_WS_SEVEN,
  officers: buildWarringStatesOfficers(ASSIGN_WS_SEVEN),
};

// ── 長平之戰 (Warring States). Qin has seized the Shangdang plateau and Bai Qi
//    stands upon it; Lian Po digs in and will not be drawn. In Handan the
//    impatient boy-king listens to slander and to the book-general Zhao Kuo. ──
const FORCES_WS_CHANGPING: Force[] = FORCES_WS_SEVEN.map((f) =>
  f.id === 'zhao' ? { ...f, rulerOfficerId: 'hist-zhao-xiaocheng' } : f,
);
const CITY_OWNERSHIP_WS_CHANGPING: Record<string, string> = {
  ...CITY_OWNERSHIP_WS_SEVEN,
  shangdang: 'qin', // Qin has taken the Shangdang plateau — the war's spark
};
const ASSIGN_WS_CHANGPING: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  'hist-zhao-xiaocheng': { forceId: 'zhao', cityId: 'ye' },       // the impatient king
  'hist-bai-qi':    { forceId: 'qin',  cityId: 'shangdang' },     // poised to encircle
  'hist-wang-jian': { forceId: 'qin',  cityId: 'shangdang' },
  'hist-lian-po':   { forceId: 'zhao', cityId: 'taiyuan' },       // dug in, holds the line
  'hist-zhao-kuo':  { forceId: 'zhao', cityId: 'taiyuan' },       // the book-general at the front
};
export const SCENARIO_WS_CHANGPING: Scenario = {
  id: 'scn-ws-changping',
  name: { en: 'The Battle of Changping', zh: '戰國·長平之戰' },
  description:
    'The great bloodletting. Qin has seized the Shangdang plateau and Bai Qi\'s army stands upon it; across the line the aged Lian Po digs in behind deep walls and will not be drawn, trading ground for time. In Handan the impatient King Xiaocheng listens to slander and to Zhao Kuo — son of Zhao She, who has read every book of war and fought no battle. Replace Lian Po and march out, and Bai Qi waits to encircle four hundred thousand men and bury them in the earth. The other five kingdoms watch, and do not move.',
  descriptionZh: "長平之殤。秦已取上黨高地，白起之軍臨之；隔陣相望，老將廉頗深溝高壘、堅守不出，以地易時。邯鄲城中，性急的孝成王聽信讒言，又信趙奢之子趙括——此人讀盡兵書而未嘗一戰。若以括代頗、出壘決戰，白起正待圍而坑之，四十萬眾將埋骨於此。其餘五國，作壁上觀，按兵不動。",
  startDate: { year: 178, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_CHANGPING),
  forces: FORCES_WS_CHANGPING,
  officers: buildWarringStatesOfficers(ASSIGN_WS_CHANGPING),
};

// ── 樂毅伐齊 / 五國伐齊 (Warring States). Yan's avenger has taken seventy cities
//    of Qi and burned Linzi; the mighty east survives only at Ju and Jimo, where
//    Tian Dan readies a thousand oxen with blades on their horns. ──
const FORCES_WS_YUEYI: Force[] = FORCES_WS_SEVEN.map((f) =>
  f.id === 'qi' ? { ...f, rulerOfficerId: 'hist-tian-fazhang', capitalCityId: 'langya' } : f,
);
const CITY_OWNERSHIP_WS_YUEYI: Record<string, string> = {
  ...CITY_OWNERSHIP_WS_SEVEN,
  linzi: 'yan', pengcheng: 'yan', xiapi: 'yan', xiaopei: 'yan', // Yan overruns Qi
  // Qi clings to two towns: Ju (langya) and Jimo (beihai)
};
const ASSIGN_WS_YUEYI: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  // Yan's host holds the burned capital of Linzi
  'hist-yue-yi': { forceId: 'yan', cityId: 'linzi' },
  'hist-qi-jie': { forceId: 'yan', cityId: 'linzi' },
  // Qi's last stand — King Xiang and the court in exile at Ju, Tian Dan at Jimo
  'hist-tian-fazhang':  { forceId: 'qi', cityId: 'langya' },
  'hist-tian-dan':      { forceId: 'qi', cityId: 'beihai' },
  'hist-qi-xuanwang':   { forceId: 'qi', cityId: 'langya' },
  'hist-sun-bin':       { forceId: 'qi', cityId: 'langya' },
  'hist-mengchang-jun': { forceId: 'qi', cityId: 'langya' },
  'hist-zou-ji':        { forceId: 'qi', cityId: 'langya' },
  'hist-feng-xuan':     { forceId: 'qi', cityId: 'beihai' },
  'hist-zou-yan':       { forceId: 'qi', cityId: 'langya' },
  'hist-kuang-zhang':   { forceId: 'qi', cityId: 'beihai' },
};
export const SCENARIO_WS_YUEYI: Scenario = {
  id: 'scn-ws-yueyi',
  name: { en: 'Yue Yi Shatters Qi', zh: '戰國·樂毅伐齊' },
  description:
    'The avenger has come. King Zhao of Yan, who raised a golden terrace to gather the talent of the realm, has unleashed Yue Yi at the head of a five-kingdom host; in half a year they have taken seventy cities of Qi and burned Linzi to the ground. The mighty east is reduced to two towns — Ju, where King Xiang hides, and Jimo, where Tian Dan readies a thousand oxen with blades lashed to their horns and fire to their tails. Whoever holds this last line decides whether Qi dies, or rises from the ash to reclaim it all.',
  descriptionZh: "復仇者已至。燕昭王築黃金台以攬天下之士，遂遣樂毅統五國之師伐齊；半歲之間，下齊七十餘城，焚臨淄為墟。煌煌東方之強齊，僅餘二城——莒，齊襄王潛匿之地；即墨，田單束千牛、縛刃於角、繫火於尾以待。守得此最後一線者，將決齊之亡，抑或自灰燼中復起而盡復其地。",
  startDate: { year: 178, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_YUEYI),
  forces: FORCES_WS_YUEYI,
  officers: buildWarringStatesOfficers(ASSIGN_WS_YUEYI),
};

// ── 圍魏救趙·桂陵馬陵 (Warring States). Wei is at its zenith — Pang Juan has
//    stormed Handan and Zhao reels back to Jinyang; but Sun Bin sits in Qi's
//    war-chariot, and the road to Daliang lies open behind the Wei host. ──
const FORCES_WS_GUILING: Force[] = FORCES_WS_SEVEN.map((f) => {
  if (f.id === 'qi') return { ...f, rulerOfficerId: 'hist-qi-weiwang' };
  if (f.id === 'zhao') return { ...f, capitalCityId: 'taiyuan' }; // Handan fallen, court at Jinyang
  return f;
});
const CITY_OWNERSHIP_WS_GUILING: Record<string, string> = {
  ...CITY_OWNERSHIP_WS_SEVEN,
  ye: 'wei', // Pang Juan has stormed Handan
};
const ASSIGN_WS_GUILING: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  'hist-qi-weiwang': { forceId: 'qi', cityId: 'linzi' },
  'hist-pang-juan':  { forceId: 'wei',  cityId: 'ye' },      // holds taken Handan, far from home
  'hist-sun-bin':    { forceId: 'qi',   cityId: 'linzi' },   // the crippled strategist
  'hist-tian-ji':    { forceId: 'qi',   cityId: 'linzi' },   // Qi's commander, Sun Bin's general
  'hist-kuang-zhang':{ forceId: 'qi',   cityId: 'linzi' },
  // Zhao, thrown out of Handan, regroups at Jinyang (Taiyuan)
  'hist-zhao-wuling': { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-lian-po':     { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-zhao-she':    { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-lin-xiangru': { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-pingyuan-jun':{ forceId: 'zhao', cityId: 'taiyuan' },
  'hist-zhao-kuo':    { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-mao-sui':     { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-pang-xuan':   { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-yue-cheng':   { forceId: 'zhao', cityId: 'taiyuan' },
};
export const SCENARIO_WS_GUILING: Scenario = {
  id: 'scn-ws-guiling',
  name: { en: 'Save Zhao by Besieging Wei', zh: '戰國·圍魏救趙' },
  description:
    'Wei stands at its zenith under King Hui, first hegemon of the age. Pang Juan has stormed the Zhao capital of Handan and the house of Zhao reels back to Jinyang. But Zhao\'s cry for help has reached Linzi, and in the war-chariot of Qi sits Pang Juan\'s old schoolmate — Sun Bin, crippled and disgraced by him years ago, now waiting with a cold patience. Strike not at the relieving army but at undefended Daliang, and the Wei host must race home into the ambush. The road runs to Guiling, and one day to Maling, where Pang Juan will read his own name carved on a tree by torchlight.',
  descriptionZh: "魏當極盛，惠王為一世之雄。龐涓既拔趙都邯鄲，趙氏退保晉陽。然趙之求救已達臨淄——齊之戎車上，正坐著龐涓的同窗：孫臏，昔年為其所刖、所辱，今以冷酷之耐心待之。不擊救兵而擊空虛之大梁，魏師必回師自投伏中。其路通桂陵，他日通馬陵——龐涓將於火光下，讀到刻於樹上的自己之名。",
  startDate: { year: 178, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_GUILING),
  forces: FORCES_WS_GUILING,
  officers: buildWarringStatesOfficers(ASSIGN_WS_GUILING),
};

// ── 合縱·邯鄲之戰 (Warring States). After Changping, Qin lays siege to Handan;
//    Lord Pingyuan holds the walls, Lord Xinling steals the tally to bring the
//    Wei army, and Lord Chunshen marches up from Chu. The vertical alliance. ──
const FORCES_WS_HANDAN: Force[] = FORCES_WS_SEVEN.map((f) =>
  f.id === 'zhao' ? { ...f, rulerOfficerId: 'hist-zhao-xiaocheng' } : f,
);
const CITY_OWNERSHIP_WS_HANDAN: Record<string, string> = {
  ...CITY_OWNERSHIP_WS_SEVEN,
  shangdang: 'qin', // taken at Changping; the noose around Handan
};
const ASSIGN_WS_HANDAN: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  'hist-zhao-xiaocheng': { forceId: 'zhao', cityId: 'ye' },
  // Qin's siege army pressing down from Shangdang
  'hist-bai-qi':    { forceId: 'qin',  cityId: 'shangdang' },
  'hist-wang-jian': { forceId: 'qin',  cityId: 'shangdang' },
  // Zhao holds Handan to the last
  'hist-pingyuan-jun': { forceId: 'zhao', cityId: 'ye' },
  'hist-lian-po':      { forceId: 'zhao', cityId: 'ye' },
  // The alliance rides in: Xinling (with Zhu Hai's hammer) and Chunshen reach Handan
  'hist-xinling-jun': { forceId: 'wei', cityId: 'ye' },
  'hist-zhu-hai':     { forceId: 'wei', cityId: 'ye' },
  'hist-chunshen-jun':{ forceId: 'chu', cityId: 'ye' },
};
export const SCENARIO_WS_HANDAN: Scenario = {
  id: 'scn-ws-handan',
  name: { en: 'The Siege of Handan', zh: '戰國·邯鄲之戰' },
  description:
    'The year after Changping, where four hundred thousand of Zhao were buried, Qin comes for the kill: its army grinds down from Shangdang to ring the Zhao capital of Handan. Within, Lord Pingyuan strips his household to man the walls and sends his desperate plea across the realm. The answer is the vertical alliance made flesh — Lord Xinling of Wei murders the general Jin Bi with Zhu Hai\'s forty-pound hammer to seize his army by a stolen tally, and Lord Chunshen marches the men of Chu north. If the three armies hold, Qin\'s tide breaks on Handan\'s walls; if not, the first empire comes a generation early.',
  descriptionZh: "長平坑趙四十萬之次年，秦來取命：其軍自上黨碾壓而下，環圍趙都邯鄲。城中，平原君散盡家財以守，遣使泣血求援於天下。而回應者，乃合縱之化身——魏公子信陵君以朱亥四十斤鐵椎擊殺晉鄙，竊符奪其軍；楚春申君亦提江東之眾北上。三軍若能拒守，秦之大潮將碎於邯鄲城下；若其不能，天下第一帝國，將早一世而至。",
  startDate: { year: 178, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_HANDAN),
  forces: FORCES_WS_HANDAN,
  officers: buildWarringStatesOfficers(ASSIGN_WS_HANDAN),
};

// ── 秦滅六國 (Warring States → Qin). The First Emperor's generation: Ying Zheng
//    on the throne, Wang Jian & Wang Ben & Li Xin in the field, Li Si & Wei Liao
//    in the cabinet. The six kingdoms hold their cores; Jing Ke sharpens a dagger.
//    Pulls in both the Warring-States roster and the Qin dynasty. ──
const FORCES_WS_QIN_UNIFY: Force[] = FORCES_WS_SEVEN.map((f) =>
  f.id === 'qin' ? { ...f, rulerOfficerId: 'hist-qin-shihuang' } : f,
);
const CITY_OWNERSHIP_WS_QIN_UNIFY: Record<string, string> = {
  ...CITY_OWNERSHIP_WS_SEVEN,
  shangdang: 'qin', // the eastern marches already swallowed
  luoyang: 'qin',   // Yiyang and the Zhou heartland taken
};
const ASSIGN_WS_QIN_UNIFY: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  // The conquest cabinet
  'hist-qin-shihuang': { forceId: 'qin', cityId: 'changan' },
  'hist-wang-jian':    { forceId: 'qin', cityId: 'changan' }, // takes Zhao and Chu
  'hist-wang-ben':     { forceId: 'qin', cityId: 'mei' },     // takes Wei, Yan, Qi
  'hist-li-xin':       { forceId: 'qin', cityId: 'changan' },
  'hist-meng-tian':    { forceId: 'qin', cityId: 'shangdang' },
  'hist-li-si':        { forceId: 'qin', cityId: 'changan' }, // chancellor
  'hist-wei-liao':     { forceId: 'qin', cityId: 'changan' }, // grand commandant
  // The last defenders of the six: Li Mu for Zhao, Xiang Yan for Chu, the
  // assassins of Yan
  'hist-li-mu':     { forceId: 'zhao', cityId: 'yanmen' },
  'hist-xiang-yan': { forceId: 'chu',  cityId: 'shouchun' }, // Chu's last great general
  'hist-taizi-dan': { forceId: 'yan',  cityId: 'ji' },
  'hist-jing-ke':   { forceId: 'yan',  cityId: 'beiping' }, // the dagger in the map-scroll
  'hist-gao-jianli':{ forceId: 'yan',  cityId: 'beiping' },
};
export const SCENARIO_WS_QIN_UNIFY: Scenario = {
  id: 'scn-ws-qin-unify',
  name: { en: 'Qin Devours the Six', zh: '戰國·秦滅六國' },
  description:
    'The endgame. Ying Zheng, King of Qin, sits behind the laws of Shang Yang and the cabinet of Li Si and Wei Liao, and his generals — old Wang Jian, his son Wang Ben, the bold Li Xin, Meng Tian of the frontier — are loosed to swallow all under heaven one kingdom at a time. The six hold only their hearts now: Zhao behind Li Mu, the last great shield of the north; Chu behind Xiang Yan; and in Yan, Crown Prince Dan whispers with Jing Ke over a map of Dukang with a poisoned dagger rolled inside. Within a decade the realm is one, or the dagger finds the king first.',
  descriptionZh: "終局。秦王嬴政恃商鞅之法、李斯尉繚之謀，縱其諸將——老將王翦、其子王賁、驍勇李信、戍邊蒙恬——以逐一吞滅天下。六國今所守者，唯其腹心：趙有李牧，北方最後之盾；楚有項燕；而燕之太子丹，正與荊軻密語於督亢之圖前，圖窮而匕首藏焉。十年之內，天下歸一——或匕首先尋上秦王。",
  startDate: { year: 178, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_QIN_UNIFY),
  forces: FORCES_WS_QIN_UNIFY,
  officers: buildWarringStatesOfficers(ASSIGN_WS_QIN_UNIFY, ['warring-states', 'qin']),
};

// ── 商鞅變法·秦之崛起 (Warring States). The west before it was a wolf. Qin is a
//    backward border state holding only Guanzhong; Ba-Shu, the Long corridor and
//    Hexi are not yet its own. Duke Xiao gives Shang Yang a free hand to forge a
//    war-machine out of law. (Qin's outer lands revert to neutral.) ──
const WS_SHANGYANG_NEUTRAL = new Set([
  'chengdu', 'jiangzhou', 'yongan', 'zitong', 'fucheng', 'mianzhu', 'luocheng',
  'jiameng', 'jianmen', 'baishuiguan', 'baxi', 'yinping', 'nanzhong', 'jianning',
  'yunnan', 'yongchang', 'yuexi', 'hanzhong', 'yangping', 'xincheng', 'shangyong',
  'wudu', 'shanggui', 'jincheng', 'wuwei', 'jiuquan', 'dunhuang', 'jieting',
]);
const FORCES_WS_SHANGYANG: Force[] = FORCES_WS_SEVEN.map((f) =>
  f.id === 'qin' ? { ...f, rulerOfficerId: 'hist-qin-xiaogong' } : f,
);
const CITY_OWNERSHIP_WS_SHANGYANG: Record<string, string> = Object.fromEntries(
  Object.entries(CITY_OWNERSHIP_WS_SEVEN).filter(([c]) => !WS_SHANGYANG_NEUTRAL.has(c)),
);
const ASSIGN_WS_SHANGYANG: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  'hist-qin-xiaogong': { forceId: 'qin', cityId: 'changan' }, // Duke Xiao
  'hist-shang-yang':   { forceId: 'qin', cityId: 'changan' }, // the architect of the law
  'hist-sima-cuo':     { forceId: 'qin', cityId: 'changan' }, // (Ba-Shu not yet his)
  'hist-gan-mao':      { forceId: 'qin', cityId: 'changan' },
};
export const SCENARIO_WS_SHANGYANG: Scenario = {
  id: 'scn-ws-shangyang',
  name: { en: 'Shang Yang\'s Reforms', zh: '戰國·商鞅變法' },
  description:
    'The west, before it was a wolf. Qin is a backward marcher state, mocked at the conferences of the central plain, holding only the Guanzhong basin — Ba-Shu is still its own kingdoms, the Long corridor and the Hexi lands beyond Qin\'s reach, while in the east Wei stands first among the powers. Duke Xiao, burning to lift his house, gives the Wey exile Shang Yang an absolutely free hand: to abolish the old aristocracy of blood, reward only farming and war, and forge from cold law the most terrible military machine the age will know. The reforms will cost Shang Yang his life and remake the world.',
  descriptionZh: "西陲未為狼時。秦乃僻處邊鄙之國，為中原會盟所輕，僅守關中盆地——巴蜀尚為其國，隴右、河西之地皆非秦有，而東方魏為諸侯之首。孝公切於振作其室，授衛人商鞅以全權：廢世卿世祿之舊貴，獎耕戰，以冷酷之法，鑄就此世所未見之可怖戰爭機器。此變法將以商鞅之命為代價，而重塑天下。",
  startDate: { year: 178, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_SHANGYANG),
  forces: FORCES_WS_SHANGYANG,
  officers: buildWarringStatesOfficers(ASSIGN_WS_SHANGYANG),
};

// ── 鄢郢之戰·白起破楚 (Warring States). Bai Qi floods Yan and storms the Chu
//    capital of Ying; Qu Yuan drowns himself in grief, and Chu flees east to
//    Shouchun, never to recover the Yangzi heartland it loses here. ──
const FORCES_WS_YANYING: Force[] = FORCES_WS_SEVEN.map((f) =>
  f.id === 'chu' ? { ...f, rulerOfficerId: 'hist-chu-qingxiang', capitalCityId: 'shouchun' } : f,
);
const CITY_OWNERSHIP_WS_YANYING: Record<string, string> = {
  ...CITY_OWNERSHIP_WS_SEVEN,
  // Bai Qi takes the Chu heartland of the Jianghan — Ying and the western towns
  jiangling: 'qin', wancheng: 'qin', xiangyang: 'qin', fancheng: 'qin',
  yiling: 'qin', xiling: 'qin', maicheng: 'qin', gongan: 'qin', wan: 'qin',
};
const ASSIGN_WS_YANYING: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  'hist-bai-qi':    { forceId: 'qin', cityId: 'jiangling' }, // stands in the burned Ying
  'hist-wang-jian': { forceId: 'qin', cityId: 'wancheng' },
  // Chu, gutted, flees its court east to Shouchun
  'hist-chu-qingxiang': { forceId: 'chu', cityId: 'shouchun' },
  'hist-chunshen-jun':  { forceId: 'chu', cityId: 'shouchun' },
  'hist-qu-yuan':       { forceId: 'chu', cityId: 'shouchun' }, // the poet in despair
  'hist-zhuang-qiao':   { forceId: 'chu', cityId: 'shouchun' },
  'hist-zhuang-xin':    { forceId: 'chu', cityId: 'shouchun' },
  'hist-zheng-xiu':     { forceId: 'chu', cityId: 'shouchun' },
};
export const SCENARIO_WS_YANYING: Scenario = {
  id: 'scn-ws-yanying',
  name: { en: 'Bai Qi Shatters Chu', zh: '戰國·鄢郢之戰' },
  description:
    'The God of War turns south. Bai Qi drives into Chu, dams a river to drown the city of Yan with hundreds of thousands within, and storms Ying, the ancient capital, putting the royal tombs to the torch. The court of King Qingxiang flees east in ruin to Shouchun and will never reclaim the Jianghan heartland it loses here; the poet-minister Qu Yuan, watching his world end, fills his robes with stones and walks into the Miluo. Vast Chu, the largest realm under heaven, is broken in a single campaign — and Qin\'s shadow lengthens over all the south.',
  descriptionZh: "戰神南向。白起深入楚境，壅水以灌鄢城，溺數十萬於其中，又拔故都郢，焚其先王之陵。頃襄王之朝廷崩潰東奔壽春，自此永失江漢腹心；三閭大夫屈原，目睹其世之傾覆，懷石自沉於汨羅。煌煌大楚，天下之最廣者，一役而折——秦之陰影，自此長籠南天。",
  startDate: { year: 178, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_YANYING),
  forces: FORCES_WS_YANYING,
  officers: buildWarringStatesOfficers(ASSIGN_WS_YANYING),
};

// ── 五國攻秦·函谷關 (Warring States). Su Qin binds the six kingdoms with a single
//    seal of alliance and hurls them west at the gate of Hangu; behind it Zhang Yi
//    works to split them apart again. The eternal contest of vertical and horizontal. ──
const ASSIGN_WS_HANGU: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  'hist-su-qin':  { forceId: 'zhao', cityId: 'ye' },      // chancellor of the alliance, six seals
  'hist-zhang-yi':{ forceId: 'qin',  cityId: 'changan' }, // the horizontal counter, in Qin
  // the allied vanguards gathered toward the Qin gate
  'hist-pang-juan':   { forceId: 'wei',  cityId: 'hulao' },
  'hist-lian-po':     { forceId: 'zhao', cityId: 'shangdang' },
  'hist-chunshen-jun':{ forceId: 'chu',  cityId: 'wancheng' },
};
export const SCENARIO_WS_HANGU: Scenario = {
  id: 'scn-ws-hangu',
  name: { en: 'Six Kingdoms Storm Hangu Pass', zh: '戰國·五國攻秦' },
  description:
    'The vertical alliance made manifest. Su Qin, a starving scholar who once could not borrow a coin from his own family, has talked his way into the chancellorships of all six kingdoms at once and wears their six seals on one sash, binding them north-to-south against the wolf of the west. Now the armies of the alliance roll toward the great gate of Hangu, the only road into Guanzhong. But inside, Su Qin\'s fellow-student Zhang Yi sells Qin the counter — the horizontal: buy off one ally, frighten another, and the great coalition rots from within before it can force the pass.',
  descriptionZh: "合縱之成形。蘇秦，昔日向親族借錢而不得的窮士，竟一舌而並佩六國相印於一身，合天下南北之眾以抗西方之狼。今合縱之師滾滾西向函谷大關——入關中之唯一通道。然關內，蘇秦之同門張儀，正為秦售其反制之策連橫：賂一國、懼一國，使這龐大的聯盟未及叩關，先自內潰。",
  startDate: { year: 178, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_SEVEN),
  forces: FORCES_WS_SEVEN,
  officers: buildWarringStatesOfficers(ASSIGN_WS_HANGU),
};

// ── 伊闕之戰·白起破韓魏 (Warring States). Bai Qi's first masterpiece: he reads
//    the distrust between the joint Han-Wei host at the Yi gorges, feints and
//    falls on each in turn, and takes the road into the central plain. ──
const CITY_OWNERSHIP_WS_YIQUE: Record<string, string> = {
  ...CITY_OWNERSHIP_WS_SEVEN,
  luoyang: 'qin', // Yiyang and the Yi gorges broken open
  hulao: 'qin',
};
const ASSIGN_WS_YIQUE: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  'hist-bai-qi':    { forceId: 'qin', cityId: 'luoyang' }, // standing on the broken pass
  'hist-wang-jian': { forceId: 'qin', cityId: 'luoyang' },
  // the joint Han-Wei commanders Bai Qi outwitted at the Yi gorges
  'hist-gongsun-xi':{ forceId: 'wei', cityId: 'chenliu' }, // Wei's commander in the joint host
  'hist-bao-yuan':  { forceId: 'han', cityId: 'xuchang' }, // Han's general
};
export const SCENARIO_WS_YIQUE: Scenario = {
  id: 'scn-ws-yique',
  name: { en: 'Bai Qi Breaks Han and Wei', zh: '戰國·伊闕之戰' },
  description:
    'The God of War\'s first masterpiece. Han and Wei, the two heirs of Jin, throw a joint army across the Yi River gorges to bar Qin\'s road east — but their commanders distrust each other and neither will lead. Bai Qi, reading the seam between them, feints at one and falls upon the other, then wheels and destroys the first: two hundred and forty thousand heads taken in a day. The gate to the central plain stands open, Yiyang and the Zhou heartland are in Qin\'s hand, and a young general has announced his name to history.',
  descriptionZh: "戰神之初篇傑作。韓魏二晉之裔，合師於伊水之闕以拒秦東出——然二帥相疑，莫肯先進。白起察其罅隙，佯攻其一而襲其一，復回師滅其先者：一日之間，斬首二十四萬。中原之門洞開，宜陽與周室腹地入於秦手，而一位年輕的將軍，自此向歷史報出了自己的名姓。",
  startDate: { year: 178, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_YIQUE),
  forces: FORCES_WS_SEVEN,
  officers: buildWarringStatesOfficers(ASSIGN_WS_YIQUE),
};

// ── 閼與之戰·趙奢破秦 (Warring States). Before Changping, the day Zhao could
//    still beat Qin in the field: Qin has seized Yuyu in the Shangdang hills,
//    and only Zhao She dares the narrow road — "the braver rat wins the hole." ──
const FORCES_WS_YUYU: Force[] = FORCES_WS_SEVEN.map((f) =>
  f.id === 'zhao' ? { ...f, rulerOfficerId: 'hist-zhao-huiwen' } : f,
);
const CITY_OWNERSHIP_WS_YUYU: Record<string, string> = {
  ...CITY_OWNERSHIP_WS_SEVEN,
  shangdang: 'qin', // Qin holds Yuyu deep in the hills
};
const ASSIGN_WS_YUYU: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  'hist-zhao-huiwen': { forceId: 'zhao', cityId: 'ye' },
  'hist-bai-qi':      { forceId: 'qin',  cityId: 'shangdang' }, // the Qin army holding Yuyu
  'hist-zhao-she':    { forceId: 'zhao', cityId: 'taiyuan' },   // the relief march, "Lord Mafu"
  'hist-zhao-kuo':    { forceId: 'zhao', cityId: 'taiyuan' },   // the son who watches, learns wrong
  'hist-lian-po':     { forceId: 'zhao', cityId: 'taiyuan' },
};
export const SCENARIO_WS_YUYU: Scenario = {
  id: 'scn-ws-yuyu',
  name: { en: 'The Battle of Yuyu', zh: '戰國·閼與之戰' },
  description:
    'Before Changping, before the burying, there was a day when Zhao could still beat Qin in open field. The Qin army has driven deep into the Shangdang hills and seized Yuyu, and the council at Handan calls the road too far and too narrow to save it. Only Zhao She says otherwise: "On a road this cramped, two rats fighting in a hole — the braver wins." He marches in secret, feigns timidity to lull the enemy, then covers fifty li in a day and a night, seizes the heights, and shatters the Qin host. For this King Huiwen makes him Lord Mafu — while his son Zhao Kuo, who reads every book of war, watches and learns all the wrong lessons.',
  descriptionZh: "在長平之前，在坑殺之前，曾有一日趙尚能於野戰勝秦。秦軍已深入上黨山中，取閼與；邯鄲之廷皆言道遠險狹、不可救。獨趙奢曰：『其道甚狹，譬兩鼠鬥於穴中，將勇者勝。』乃潛師急進，先示怯以驕敵，後一日一夜行五十里，據北山而大破秦軍。惠文王為此封其馬服君——而其子趙括，讀盡兵書，旁觀此役，所學盡是錯處。",
  startDate: { year: 178, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_YUYU),
  forces: FORCES_WS_YUYU,
  officers: buildWarringStatesOfficers(ASSIGN_WS_YUYU),
};

// ── 田單復國·火牛破燕 (Warring States). The ash stirs: King Hui of Yan recalls
//    the brilliant Yue Yi and sends the lesser Qi Jie before Qi's last two towns,
//    and in Jimo Tian Dan readies the fire-oxen for the turn of the tide. ──
const FORCES_WS_TIANDAN: Force[] = FORCES_WS_SEVEN.map((f) => {
  if (f.id === 'yan') return { ...f, rulerOfficerId: 'hist-yan-huiwang' };
  if (f.id === 'qi') return { ...f, rulerOfficerId: 'hist-tian-fazhang', capitalCityId: 'beihai' };
  return f;
});
const CITY_OWNERSHIP_WS_TIANDAN: Record<string, string> = {
  ...CITY_OWNERSHIP_WS_SEVEN,
  linzi: 'yan', pengcheng: 'yan', xiapi: 'yan', xiaopei: 'yan', // Yan still holds conquered Qi
};
const ASSIGN_WS_TIANDAN: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  // The suspicious new king who recalled Yue Yi
  'hist-yan-huiwang': { forceId: 'yan', cityId: 'ji' },
  // Yue Yi recalled home in disgrace; the lesser Qi Jie left holding the line
  'hist-yue-yi': { forceId: 'yan', cityId: 'ji' },
  'hist-qi-jie': { forceId: 'yan', cityId: 'linzi' },
  // Qi's last stand, now poised to strike back — Tian Dan and the fire-oxen at Jimo
  'hist-tian-dan':      { forceId: 'qi', cityId: 'beihai' },
  'hist-tian-fazhang':  { forceId: 'qi', cityId: 'langya' },
  'hist-qi-xuanwang':   { forceId: 'qi', cityId: 'langya' },
  'hist-sun-bin':       { forceId: 'qi', cityId: 'beihai' },
  'hist-mengchang-jun': { forceId: 'qi', cityId: 'langya' },
  'hist-zou-ji':        { forceId: 'qi', cityId: 'langya' },
  'hist-feng-xuan':     { forceId: 'qi', cityId: 'beihai' },
  'hist-zou-yan':       { forceId: 'qi', cityId: 'langya' },
  'hist-kuang-zhang':   { forceId: 'qi', cityId: 'beihai' },
};
export const SCENARIO_WS_TIANDAN: Scenario = {
  id: 'scn-ws-tiandan',
  name: { en: 'Tian Dan\'s Fire-Oxen', zh: '戰國·田單復國' },
  description:
    'The ash stirs. King Hui, new on the throne of Yan, mistrusts the brilliant Yue Yi who has all but ended Qi, and recalls him — replacing the conqueror with the lesser Qi Jie before the last two towns of the east. In Jimo, Tian Dan has been waiting for exactly this. He has spread the rumor that drove Yue Yi out; he feigns surrender to make the Yan army careless; and now he lashes blades to the horns of a thousand oxen and fire to their tails, and waits for the night to drive them into the Yan camp. From two cities, in a single season, Qi will reclaim seventy.',
  descriptionZh: "灰燼復動。燕新君惠王，疑那幾乎滅齊的天才樂毅，召之還——以庸劣的騎劫代此征服者於齊最後之二城前。即墨城中，田單正等的便是此刻。他已縱反間以去樂毅；他詐降以驕燕師；今束刃於千牛之角、繫火於其尾，只待夜色，驅之衝燕營。自二城之地，一季之間，齊將盡復七十城。",
  startDate: { year: 178, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_TIANDAN),
  forces: FORCES_WS_TIANDAN,
  officers: buildWarringStatesOfficers(ASSIGN_WS_TIANDAN),
};

// ── 魏文侯·戰國首霸 (Warring States). The dawn of the age: Jin freshly carved in
//    three, and Wei rises first under the model lord Marquis Wen — Li Kui's law,
//    Wu Qi's armoured foot, Ximen Bao taming Ye, Yue Yang swallowing Zhongshan. ──
const FORCES_WS_WEIWEN: Force[] = FORCES_WS_SEVEN.map((f) => {
  if (f.id === 'wei') return { ...f, rulerOfficerId: 'hist-wei-wenhou' };
  if (f.id === 'zhao') return { ...f, rulerOfficerId: 'hist-zhao-liehou', capitalCityId: 'taiyuan' };
  if (f.id === 'qin') return { ...f, rulerOfficerId: 'hist-qin-xiaogong' }; // a weak, pre-reform Qin
  return f;
});
const CITY_OWNERSHIP_WS_WEIWEN: Record<string, string> = {
  ...CITY_OWNERSHIP_WS_SEVEN,
  ye: 'wei',     // Ye is Wei's, where Ximen Bao tames the Zhang and its witches
  boling: 'wei', // Yue Yang has swallowed Zhongshan
};
const ASSIGN_WS_WEIWEN: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  'hist-wei-wenhou':  { forceId: 'wei', cityId: 'chenliu' },
  'hist-li-kui-ws':   { forceId: 'wei', cityId: 'chenliu' }, // the first Legalist reformer
  'hist-ximen-bao':   { forceId: 'wei', cityId: 'ye' },      // governor of Ye
  // (Wu Qi @ puyang and Yue Yang @ chenliu already serve Wei in the base)
  'hist-qin-xiaogong':{ forceId: 'qin', cityId: 'changan' }, // weak Qin, reforms yet to come
  // Zhao under Marquis Lie regroups at Jinyang, Handan being Wei's
  'hist-zhao-liehou':  { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-zhao-wuling':  { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-lian-po':      { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-zhao-she':     { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-lin-xiangru':  { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-pingyuan-jun': { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-zhao-kuo':     { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-mao-sui':      { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-pang-xuan':    { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-yue-cheng':    { forceId: 'zhao', cityId: 'taiyuan' },
};
export const SCENARIO_WS_WEIWEN: Scenario = {
  id: 'scn-ws-weiwen',
  name: { en: 'Marquis Wen, First Hegemon', zh: '戰國·魏文侯首霸' },
  description:
    'The dawn of the warring age. The house of Jin has been carved in three, and of the three heirs Wei rises first and fastest. Marquis Wen, the model lord of the era, gathers a court no rival can match: Li Kui writes the first code of Legalist reform and "wrings the earth dry" to fill the granaries; Wu Qi forges the armoured foot-soldiers of Wei who do not lose; Ximen Bao tames the Zhang River and breaks the witch-cult of Ye; Yue Yang marches out and swallows the kingdom of Zhongshan. For one generation Wei is the first power under heaven, and a still-feudal Qin cowers behind the passes — before Wei\'s heirs throw the whole inheritance away.',
  descriptionZh: "大爭之世的黎明。晉室既三分，三晉之中魏興最先、最速。文侯，一世之賢君，聚天下無雙之朝：李悝著法家變法之首典，盡地力之教以實倉廩；吳起鑄魏之重甲武卒，戰而不敗；西門豹治漳水、破鄴之巫風；樂羊出師，吞中山之國。魏為天下首強者，凡一世，而尚行封建之秦瑟縮於關隘之後——直至文侯之子孫，將此基業盡棄。",
  startDate: { year: 178, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_WEIWEN),
  forces: FORCES_WS_WEIWEN,
  officers: buildWarringStatesOfficers(ASSIGN_WS_WEIWEN),
};

// ── 齊湣王·稱東帝 (Warring States). Qi at its zenith and its hubris: King Min has
//    devoured Song, styled himself Emperor of the East to match Qin's West, while
//    Su Qin whispers him toward ever more war as a secret agent of Yan. ──
const FORCES_WS_QIMIN: Force[] = FORCES_WS_SEVEN.map((f) =>
  f.id === 'qi' ? { ...f, rulerOfficerId: 'hist-qi-minwang' } : f,
);
const CITY_OWNERSHIP_WS_QIMIN: Record<string, string> = {
  ...CITY_OWNERSHIP_WS_SEVEN,
  lujiang: 'qi', // Qi has pushed into the Huai, beyond swallowed Song
};
const ASSIGN_WS_QIMIN: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_WS_SEVEN,
  'hist-qi-minwang': { forceId: 'qi', cityId: 'linzi' }, // Emperor of the East
  'hist-tian-ji':    { forceId: 'qi', cityId: 'linzi' },
  'hist-su-qin':     { forceId: 'qi', cityId: 'linzi' }, // Yan's agent, urging Qi to overreach
};
export const SCENARIO_WS_QIMIN: Scenario = {
  id: 'scn-ws-qimin',
  name: { en: 'King Min, Emperor of the East', zh: '戰國·齊湣王稱帝' },
  description:
    'Qi at the noon of its power, and its pride. King Min has swallowed the rich state of Song, humbled Chu and battered Qin, and now takes the title Di — Emperor of the East — to stand level with Qin\'s Emperor of the West. Linzi is the wealthiest city under heaven and its Jixia academy the brightest gathering of minds in the age. But at his court sits the persuader Su Qin, secretly an agent of Yan, forever urging him into one more war to bleed Qi white; and beyond the horizon five kingdoms are quietly agreeing that the East has grown too proud to be borne. This is the high noon before the avalanche of Yue Yi.',
  descriptionZh: "齊之日中，與其驕。湣王既吞富宋，辱楚摧秦，遂取帝號，稱東帝，以與秦之西帝並立。臨淄為天下最富之城，稷下學宮為當世最盛之士林。然其朝中坐著說客蘇秦，實為燕之間者，日誘之於再一場兵戈以疲齊；而天際之外，五國正悄然議定：東方已驕橫得不可復容。此乃樂毅之雪崩前，最盛的正午。",
  startDate: { year: 178, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_WS_QIMIN),
  forces: FORCES_WS_QIMIN,
  officers: buildWarringStatesOfficers(ASSIGN_WS_QIMIN),
};

// ════════════════════════════════════════════════════════════════════════
// 楚漢爭霸 — Chu-Han Contention (parallel timeline on the AD engine). The same
// buildWarringStatesOfficers machinery, fed the Chu-Han + Qin rosters: after
// Xiang Yu carved the realm into eighteen fiefs, the Hegemon-King of Western Chu
// against the King of Han, with the Three Qin (the surrendered Qin generals) and
// the restored eastern kingdoms (Qi, Zhao, Wei, Jiujiang) between them.
// ════════════════════════════════════════════════════════════════════════
const FORCES_CHUHAN: Force[] = [
  { id: 'chu',      name: { en: 'Western Chu', zh: '西楚'   }, rulerOfficerId: 'hist-xiang-yu',  capitalCityId: 'pengcheng', color: '#c0392b', isPlayer: false },
  { id: 'han',      name: { en: 'Han',         zh: '漢'     }, rulerOfficerId: 'hist-liu-bang',  capitalCityId: 'hanzhong',  color: '#3a7dd9', isPlayer: false },
  { id: 'yong',     name: { en: 'Three Qin',   zh: '三秦'   }, rulerOfficerId: 'hist-zhang-han', capitalCityId: 'changan',   color: '#8a6d3b', isPlayer: false },
  { id: 'qi',       name: { en: 'Qi',          zh: '齊'     }, rulerOfficerId: 'hist-tian-rong', capitalCityId: 'linzi',     color: '#2aa8c0', isPlayer: false },
  { id: 'zhao',     name: { en: 'Zhao',        zh: '趙'     }, rulerOfficerId: 'hist-chen-yu',   capitalCityId: 'ye',        color: '#e07b39', isPlayer: false },
  { id: 'wei',      name: { en: 'Wei',         zh: '魏'     }, rulerOfficerId: 'hist-wei-bao',   capitalCityId: 'puyang',    color: '#2f8e6f', isPlayer: false },
  { id: 'jiujiang', name: { en: 'Jiujiang',    zh: '九江'   }, rulerOfficerId: 'hist-ying-bu',   capitalCityId: 'shouchun',  color: '#9a5a9a', isPlayer: false },
];
const CITY_OWNERSHIP_CHUHAN: Record<string, string> = {
  // 漢 — Liu Bang, banished to Hanzhong and the Ba-Shu basin
  hanzhong: 'han', yangping: 'han', xincheng: 'han', shangyong: 'han', wudu: 'han',
  chengdu: 'han', jiangzhou: 'han', yongan: 'han', zitong: 'han', fucheng: 'han',
  mianzhu: 'han', luocheng: 'han', jiameng: 'han', jianmen: 'han', baishuiguan: 'han',
  baxi: 'han', yinping: 'han', nanzhong: 'han', jianning: 'han', yunnan: 'han',
  yongchang: 'han', yuexi: 'han',
  // 三秦 — the surrendered Qin generals walling Liu Bang into the west
  changan: 'yong', mei: 'yong', chencang: 'yong', tongguan: 'yong', wuguan: 'yong',
  sanguan: 'yong', xiaoguan: 'yong', anding: 'yong', tianshui: 'yong', longxi: 'yong',
  shanggui: 'yong', jincheng: 'yong', wuwei: 'yong', jiuquan: 'yong', dunhuang: 'yong',
  jieting: 'yong',
  // 齊 — Tian Rong's Qi on the Shandong peninsula
  linzi: 'qi', beihai: 'qi', langya: 'qi',
  // 趙 — Chen Yu's Zhao, the north and the old Yan lands
  ye: 'zhao', taiyuan: 'zhao', shangdang: 'zhao', yanmen: 'zhao', yunzhong: 'zhao',
  wuyuan: 'zhao', shuofang: 'zhao', bohai: 'zhao', pingyuan: 'zhao', nanpi: 'zhao',
  boling: 'zhao', ji: 'zhao', beiping: 'zhao', yuyang: 'zhao', liaodong: 'zhao',
  xiangping: 'zhao', liucheng: 'zhao', wuhuan: 'zhao', lelang: 'zhao', daifang: 'zhao',
  // 魏 — Wei Bao's Wei in the Hedong / old Wei heartland
  puyang: 'wei', luoyang: 'wei', baima: 'wei', yanjin: 'wei', liyang: 'wei',
  // 九江 — Ying Bu's Jiujiang on the Huai
  shouchun: 'jiujiang', hefei: 'jiujiang', lujiang: 'jiujiang', ruxu: 'jiujiang',
  // 西楚 — Xiang Yu's Western Chu: Pengcheng, the Jiangdong homeland and the south
  pengcheng: 'chu', xiapi: 'chu', xiaopei: 'chu', xuchang: 'chu', chenliu: 'chu',
  runan: 'chu', hulao: 'chu', guandu: 'chu', jianye: 'chu', wu: 'chu', wuxi: 'chu',
  kuaiji: 'chu', danyang: 'chu', yuzhang: 'chu', chaisang: 'chu', poyang: 'chu',
  hukou: 'chu', jiangling: 'chu', wancheng: 'chu', wan: 'chu', xinye: 'chu',
  xiangyang: 'chu', fancheng: 'chu', jiangxia: 'chu', yiling: 'chu', xiling: 'chu',
  xiaoting: 'chu', maicheng: 'chu', gongan: 'chu', bowang: 'chu', guangling: 'chu',
  changsha: 'chu', lingling: 'chu', wuling: 'chu', guiyang: 'chu', baqiu: 'chu',
  wuchang: 'chu', luling: 'chu', nanhai: 'chu', hepu: 'chu', jiaozhi: 'chu',
  guilin: 'chu', cangwu: 'chu', jiuzhen: 'chu', rinan: 'chu', zhuyai: 'chu',
  linhai: 'chu', 'yi-county': 'chu', chibi: 'chu', changban: 'chu',
};
const ASSIGN_CHUHAN: Record<string, { forceId: string; cityId: string }> = {
  // 西楚 — the Hegemon-King and his marshals
  'hist-xiang-yu':    { forceId: 'chu', cityId: 'pengcheng' },
  'hist-fan-zeng':    { forceId: 'chu', cityId: 'pengcheng' }, // the one adviser he ignores
  'hist-long-qu':     { forceId: 'chu', cityId: 'pengcheng' },
  'hist-zhongli-mei': { forceId: 'chu', cityId: 'pengcheng' },
  'hist-ji-bu':       { forceId: 'chu', cityId: 'xiapi' },
  'hist-xiang-bo':    { forceId: 'chu', cityId: 'xiapi' },
  'hist-huan-chu':    { forceId: 'chu', cityId: 'jianye' },
  'hist-pu-jiangjun': { forceId: 'chu', cityId: 'jianye' },
  'hist-cao-jiu':     { forceId: 'chu', cityId: 'chenliu' },
  'hist-yu-ji':       { forceId: 'chu', cityId: 'pengcheng' },
  // 漢 — the King of Han and the three heroes of the early Han
  'hist-liu-bang':    { forceId: 'han', cityId: 'hanzhong' },
  'hist-han-xin':     { forceId: 'han', cityId: 'hanzhong' }, // the marshal who will turn the war
  'hist-zhang-liang': { forceId: 'han', cityId: 'hanzhong' },
  'hist-xiao-he':     { forceId: 'han', cityId: 'hanzhong' },
  'hist-chen-ping':   { forceId: 'han', cityId: 'hanzhong' },
  'hist-fan-kuai':    { forceId: 'han', cityId: 'hanzhong' },
  'hist-cao-can':     { forceId: 'han', cityId: 'hanzhong' },
  'hist-zhou-bo':     { forceId: 'han', cityId: 'hanzhong' },
  'hist-guan-ying':   { forceId: 'han', cityId: 'chengdu' },
  'hist-xiahou-ying': { forceId: 'han', cityId: 'hanzhong' },
  'hist-wang-ling':   { forceId: 'han', cityId: 'chengdu' },
  'hist-lu-wan':      { forceId: 'han', cityId: 'hanzhong' },
  // 三秦 — the surrendered Qin generals
  'hist-zhang-han':   { forceId: 'yong', cityId: 'changan' },
  'hist-sima-xin':    { forceId: 'yong', cityId: 'tongguan' },
  'hist-dong-yi':     { forceId: 'yong', cityId: 'mei' },
  // 齊 — the Tian clan
  'hist-tian-rong':   { forceId: 'qi', cityId: 'linzi' },
  'hist-tian-heng':   { forceId: 'qi', cityId: 'linzi' },
  'hist-tian-guang':  { forceId: 'qi', cityId: 'beihai' },
  // 趙 — Chen Yu and Zhang Er (soon to fall out), with Li Zuoche
  'hist-chen-yu':     { forceId: 'zhao', cityId: 'ye' },
  'hist-zhang-er':    { forceId: 'zhao', cityId: 'taiyuan' },
  'hist-li-zuoche':   { forceId: 'zhao', cityId: 'ye' },
  // 魏 — Wei Bao
  'hist-wei-bao':     { forceId: 'wei', cityId: 'puyang' },
  'hist-wei-jiu':     { forceId: 'wei', cityId: 'luoyang' },
  // 九江 — Ying Bu, the tattooed king
  'hist-ying-bu':     { forceId: 'jiujiang', cityId: 'shouchun' },
};
export const SCENARIO_CH_CHUHAN: Scenario = {
  id: 'scn-ch-chuhan',
  name: { en: 'Chu-Han Contention', zh: '楚漢爭霸' },
  description:
    'The empire of Qin is ash, and Xiang Yu — Hegemon-King of Western Chu, the strongest man of the age — has carved all under heaven into eighteen fiefs to suit himself. He has banished his rival Liu Bang to the dead end of Hanzhong behind the Three Qin, the surrendered Qin generals set to wall him in. But Liu Bang has the three greatest talents of the era — Han Xin to command, Zhang Liang to plan, Xiao He to supply — and means to burn his retreat-galleries as a lie, march out of the west, and contend for it all. Qi already rebels in the east, the restored kingdoms eye each other, and Fan Zeng warns a Hegemon who will not listen. The four years that decide a dynasty begin now.',
  descriptionZh: "秦之帝國已成灰燼，而項羽——西楚霸王、當世第一之人——已按己意裂天下為十八國。他將勁敵劉邦逐於漢中之絕地，以三秦降將圍堵之。然劉邦握有當世三傑——韓信將兵、張良運籌、蕭何足食——意欲明燒棧道以為餌，暗度而出，爭奪天下。齊已叛於東，諸復國者彼此相窺，而范增之諫，霸王不聽。決定一代王朝的四年，自此刻始。",
  startDate: { year: 178, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_CHUHAN),
  forces: FORCES_CHUHAN,
  officers: buildWarringStatesOfficers(ASSIGN_CHUHAN, ['chu-han', 'qin']),
};

// ── 還定三秦 (Chu-Han). Han Xin makes the burned plank-roads a feint and slips
//    the army through Chencang to fall on the Three Qin — Liu Bang breaks out
//    of the western dead-end to win a base for the world. ──
const CITY_OWNERSHIP_CH_SANQIN: Record<string, string> = {
  ...CITY_OWNERSHIP_CHUHAN,
  chencang: 'han', // Han Xin slips out the back road and takes Chencang
};
const ASSIGN_CH_SANQIN: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_CHUHAN,
  'hist-han-xin':  { forceId: 'han', cityId: 'chencang' }, // the secret march
  'hist-fan-kuai': { forceId: 'han', cityId: 'chencang' },
};
export const SCENARIO_CH_SANQIN: Scenario = {
  id: 'scn-ch-sanqin',
  name: { en: 'Han Xin Retakes the Three Qin', zh: '楚漢·還定三秦' },
  description:
    'The feint that won an empire. Marching into Hanzhong, Liu Bang burned the plank-roads behind him to convince Xiang Yu he would never come out — and now his new marshal Han Xin turns the ashes into a ruse. He sends men to make a show of "repairing" the galleries while the army slips through the back road of Chencang, bursting into Guanzhong to fall on Zhang Han\'s Three Qin before they can react. Take the Wei river basin, and the King of Han has at last a base from which to contend for all under heaven.',
  descriptionZh: "贏得天下的疑兵。劉邦入漢中時，燒絕棧道於身後，使項羽信其永不復出——今其新拜大將韓信，化此灰燼為詭計。遣人佯作『修復』棧道，而大軍暗出陳倉故道，驟入關中，趁三秦章邯未及反應而擊之。得渭水盆地，漢王便終有爭天下之基。",
  startDate: { year: 178, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_CH_SANQIN),
  forces: FORCES_CHUHAN,
  officers: buildWarringStatesOfficers(ASSIGN_CH_SANQIN, ['chu-han', 'qin']),
};

// ── 彭城之戰 (Chu-Han). With Xiang Yu away crushing Qi, Liu Bang's grand
//    coalition walks into Pengcheng to feast — and the Hegemon turns, takes
//    thirty thousand horse, and shatters the drunken host at dawn. ──
const CITY_OWNERSHIP_CH_PENGCHENG: Record<string, string> = {
  ...CITY_OWNERSHIP_CHUHAN,
  // the coalition has rolled east and seized the Hegemon's own capital
  pengcheng: 'han', xiapi: 'han', xuchang: 'han', chenliu: 'han', runan: 'han',
};
const ASSIGN_CH_PENGCHENG: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_CHUHAN,
  'hist-liu-bang': { forceId: 'han', cityId: 'pengcheng' }, // feasting in the taken capital
  'hist-zhang-liang': { forceId: 'han', cityId: 'pengcheng' },
  'hist-xiang-yu': { forceId: 'chu', cityId: 'linzi' },     // away in the north, crushing Qi
  'hist-fan-zeng': { forceId: 'chu', cityId: 'linzi' },
  'hist-long-qu':  { forceId: 'chu', cityId: 'linzi' },
};
export const SCENARIO_CH_PENGCHENG: Scenario = {
  id: 'scn-ch-pengcheng',
  name: { en: 'The Battle of Pengcheng', zh: '楚漢·彭城之戰' },
  description:
    'The high tide of folly. While Xiang Yu is away in the north crushing Qi\'s revolt, Liu Bang gathers a grand coalition of five kingdoms — five hundred and sixty thousand men — and walks into Pengcheng, the Hegemon\'s own capital, to feast in his halls. Then Xiang Yu turns. Leaving the siege of Qi, he takes thirty thousand cavalry, rides through the night, and falls on the drunken coalition at dawn; by dusk the Si and Sui rivers run choked with Han dead and Liu Bang flees for his life. It is the most crushing defeat of his career — and he will still, somehow, win the war.',
  descriptionZh: "得意之巔，亦愚妄之巔。當項羽北上平齊之叛，劉邦糾合五國之眾——五十六萬——徑入彭城，霸王之都，宴於其殿。然後項羽回師。棄平齊之圍，提三萬精騎，連夜奔襲，黎明掩殺沉醉之聯軍；至暮，泗水睢水為漢屍所塞，劉邦亡命而逃。此其生涯最慘之敗——而他終將，竟然，贏得此戰爭。",
  startDate: { year: 178, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_CH_PENGCHENG),
  forces: FORCES_CHUHAN,
  officers: buildWarringStatesOfficers(ASSIGN_CH_PENGCHENG, ['chu-han', 'qin']),
};

// ── 垓下之戰 (Chu-Han). The endgame. Han Xin has conquered the whole north and
//    east, Peng Yue has bled Chu's supply white; the Hegemon, starving, is ringed
//    at Gaixia and the night fills with the songs of Chu on every side. ──
const GAIXIA_CHU_CITIES = [
  'pengcheng', 'xiapi', 'xiaopei', 'jianye', 'wu', 'wuxi', 'kuaiji', 'danyang',
  'yuzhang', 'chaisang', 'poyang', 'hukou', 'jiangling', 'wancheng', 'xiangyang',
];
const CITY_OWNERSHIP_CH_GAIXIA: Record<string, string> = Object.fromEntries(
  Object.keys(CITY_OWNERSHIP_CHUHAN).map((c) => [c, GAIXIA_CHU_CITIES.includes(c) ? 'chu' : 'han']),
);
const FORCES_CH_GAIXIA: Force[] = FORCES_CHUHAN.filter((f) => f.id === 'chu' || f.id === 'han');
const ASSIGN_CH_GAIXIA: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_CHUHAN,
  // the former lords, all crushed or gone over to Han by now
  'hist-tian-rong': { forceId: 'han', cityId: 'linzi' },
  'hist-tian-heng': { forceId: 'han', cityId: 'linzi' },
  'hist-tian-guang':{ forceId: 'han', cityId: 'beihai' },
  'hist-chen-yu':   { forceId: 'han', cityId: 'ye' },
  'hist-zhang-er':  { forceId: 'han', cityId: 'taiyuan' },
  'hist-li-zuoche': { forceId: 'han', cityId: 'ye' },   // Han Xin's captured strategist, now serving
  'hist-wei-bao':   { forceId: 'han', cityId: 'puyang' },
  'hist-wei-jiu':   { forceId: 'han', cityId: 'luoyang' },
  'hist-ying-bu':   { forceId: 'han', cityId: 'shouchun' }, // the tattooed king, defected to Han
  'hist-zhang-han': { forceId: 'han', cityId: 'changan' },
  'hist-sima-xin':  { forceId: 'han', cityId: 'tongguan' },
  'hist-dong-yi':   { forceId: 'han', cityId: 'mei' },
  // the encirclement
  'hist-xiang-yu':  { forceId: 'chu', cityId: 'pengcheng' }, // ringed at Gaixia
  'hist-cao-jiu':   { forceId: 'chu', cityId: 'pengcheng' },
  'hist-han-xin':   { forceId: 'han', cityId: 'xuchang' },   // the ten-sided ambush
  'hist-peng-yue':  { forceId: 'han', cityId: 'chenliu' },   // joined the kill
};
export const SCENARIO_CH_GAIXIA: Scenario = {
  id: 'scn-ch-gaixia',
  name: { en: 'The Battle of Gaixia', zh: '楚漢·垓下之戰' },
  description:
    'Four sides of Chu songs. The four years are almost run. Han Xin has conquered the whole north and east for Han — Wei, Zhao, Qi all fallen — and Peng Yue has bled Chu\'s supply lines white; now the Hegemon, his army starving, is ringed at Gaixia by a host many times his size. In the night the Han camps raise the songs of Chu on every side, and Xiang Yu, believing his homeland wholly lost, rises to drink and sing his last with Lady Yu: the strength to uproot mountains, and an age that would not go his way. From a hundred thousand he will cut his way to twenty-eight riders at the Wu River — and there, refusing the ferry home, make his end.',
  descriptionZh: "四面楚歌。四年之期將盡。韓信已為漢盡取北方與東土——魏、趙、齊皆下——彭越又斷楚糧道殆盡；今霸王之軍饑餒，為數倍於己之眾圍於垓下。是夜，漢營四面皆起楚歌，項羽以為江東盡失，乃起飲，與虞姬作其最後之歌：力拔山兮氣蓋世，時不利兮騅不逝。自十萬之眾，他將殺至烏江僅餘二十八騎——而於彼處，辭舟不渡，了此一生。",
  startDate: { year: 178, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_CH_GAIXIA),
  forces: FORCES_CH_GAIXIA,
  officers: buildWarringStatesOfficers(ASSIGN_CH_GAIXIA, ['chu-han', 'qin']),
};

// ── 井陘之戰 (Chu-Han). Han Xin, sent north with a few green thousands, has
//    already swallowed Wei; now he arrays his men with a river at their backs
//    against Chen Yu's two hundred thousand — and wins the impossible. ──
const FORCES_CH_JINGXING: Force[] = FORCES_CHUHAN.filter((f) => f.id !== 'wei');
const CITY_OWNERSHIP_CH_JINGXING: Record<string, string> = {
  ...CITY_OWNERSHIP_CHUHAN,
  // Han Xin has already conquered Wei on his way north
  puyang: 'han', luoyang: 'han', baima: 'han', yanjin: 'han', liyang: 'han',
};
const ASSIGN_CH_JINGXING: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_CHUHAN,
  'hist-han-xin':   { forceId: 'han', cityId: 'taiyuan' }, // backed against the river
  'hist-zhang-er':  { forceId: 'han', cityId: 'taiyuan' }, // turned on Chen Yu, marches with Han
  'hist-wei-bao':   { forceId: 'han', cityId: 'puyang' },  // Wei conquered, its king taken
  'hist-wei-jiu':   { forceId: 'han', cityId: 'luoyang' },
  'hist-chen-yu':   { forceId: 'zhao', cityId: 'ye' },     // 200,000 holding the pass
  'hist-li-zuoche': { forceId: 'zhao', cityId: 'ye' },     // his counsel to hold, scorned
};
export const SCENARIO_CH_JINGXING: Scenario = {
  id: 'scn-ch-jingxing',
  name: { en: 'The Battle of Jingxing', zh: '楚漢·井陘之戰' },
  description:
    'Han Xin\'s impossible victory. Sent north with a few tens of thousands of raw troops to open a second front, he has already swallowed Wei; now he faces Chen Yu\'s two hundred thousand at the mouth of the Jingxing pass. He does the thing every manual forbids — drawing up his men with a river at their backs and no line of retreat — so that, with nowhere to run, they fight like cornered demons; meanwhile two thousand light horse slip round and tear the Zhao banners from their emptied camp. Chen Yu, who scorned Li Zuoche\'s plea to simply hold the pass, dies in the rout. "Throw them onto dead ground, and they live."',
  descriptionZh: "韓信不可能之勝。受命北出，將數萬新卒以開第二戰場，他已並魏；今於井陘口面對陳餘二十萬之眾。他行兵家所禁——背水列陣、無退路可走——使士卒無所逃而人人死戰；同時遣輕騎二千繞出，拔趙幟於空壁。陳餘輕李左車守關之策，死於亂軍。「陷之死地而後生。」",
  startDate: { year: 178, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_CH_JINGXING),
  forces: FORCES_CH_JINGXING,
  officers: buildWarringStatesOfficers(ASSIGN_CH_JINGXING, ['chu-han', 'qin']),
};

// ── 鉅鹿之戰 (Qin's end). The empire's last armies have the rebellion by the
//    throat: Wang Li rings Zhao in Julu, Zhang Han guards the supply road. Then
//    Xiang Yu smashes the cauldrons, sinks the boats, and annihilates them. ──
const JULU_ZHAO = ['ye', 'bohai', 'pingyuan', 'nanpi', 'boling'];
const JULU_QI = ['linzi', 'beihai', 'langya'];
const JULU_CHU = [
  'pengcheng', 'xiapi', 'xiaopei', 'jianye', 'wu', 'wuxi', 'kuaiji', 'danyang',
  'yuzhang', 'chaisang', 'poyang', 'hukou', 'shouchun', 'hefei', 'lujiang', 'ruxu',
  'jiangling', 'wancheng', 'wan', 'xinye', 'xiangyang', 'fancheng', 'jiangxia',
  'yiling', 'xiling', 'xiaoting', 'maicheng', 'gongan', 'bowang', 'guangling',
  'changsha', 'lingling', 'wuling', 'guiyang', 'baqiu', 'wuchang', 'luling',
  'nanhai', 'hepu', 'jiaozhi', 'guilin', 'cangwu', 'jiuzhen', 'rinan', 'zhuyai',
  'linhai', 'yi-county', 'chibi', 'changban',
];
const CITY_OWNERSHIP_CH_JULU: Record<string, string> = Object.fromEntries(
  Object.keys(CITY_OWNERSHIP_CHUHAN).map((c) => {
    if (JULU_ZHAO.includes(c)) return [c, 'zhao'];
    if (JULU_QI.includes(c)) return [c, 'qi'];
    if (JULU_CHU.includes(c)) return [c, 'chu'];
    if (c === 'puyang') return [c, 'wei'];
    return [c, 'qin']; // the empire still holds Guanzhong, Ba-Shu and the central plain
  }),
);
const FORCES_CH_JULU: Force[] = [
  { id: 'qin',  name: { en: 'Qin Empire', zh: '秦' }, rulerOfficerId: 'hist-zhang-han',     capitalCityId: 'changan',   color: '#3a3a4a', isPlayer: false },
  { id: 'chu',  name: { en: 'Chu',        zh: '楚' }, rulerOfficerId: 'hist-xiang-yu',      capitalCityId: 'pengcheng', color: '#c0392b', isPlayer: false },
  { id: 'zhao', name: { en: 'Zhao',       zh: '趙' }, rulerOfficerId: 'hist-zhao-xie',      capitalCityId: 'ye',        color: '#e07b39', isPlayer: false },
  { id: 'qi',   name: { en: 'Qi',         zh: '齊' }, rulerOfficerId: 'hist-tian-dan-chu',  capitalCityId: 'linzi',     color: '#2aa8c0', isPlayer: false },
  { id: 'wei',  name: { en: 'Wei',        zh: '魏' }, rulerOfficerId: 'hist-wei-bao',       capitalCityId: 'puyang',    color: '#2f8e6f', isPlayer: false },
];
const ASSIGN_CH_JULU: Record<string, { forceId: string; cityId: string }> = {
  // 秦 — the boy-emperor in Xianyang and the empire's two great armies
  'hist-qin-ershi':   { forceId: 'qin', cityId: 'changan' }, // the Second Emperor, Zhao Gao's puppet
  'hist-zhang-han':   { forceId: 'qin', cityId: 'changan' }, // guarding the supply road
  'hist-wang-li':     { forceId: 'qin', cityId: 'ye' },      // the Great Wall corps ringing Julu
  'hist-she-jian':    { forceId: 'qin', cityId: 'ye' },
  'hist-su-jiao':     { forceId: 'qin', cityId: 'ye' },
  'hist-sima-xin':    { forceId: 'qin', cityId: 'changan' },
  'hist-dong-yi':     { forceId: 'qin', cityId: 'mei' },
  // 楚 — Xiang Yu's host, with the western column under Liu Bang (also Huai-king's man)
  'hist-xiang-yu':    { forceId: 'chu', cityId: 'pengcheng' },
  'hist-song-yi':     { forceId: 'chu', cityId: 'pengcheng' }, // the dithering Qingzi commander Xiang Yu will kill
  'hist-fan-zeng':    { forceId: 'chu', cityId: 'pengcheng' },
  'hist-ying-bu':     { forceId: 'chu', cityId: 'pengcheng' }, // the vanguard across the river
  'hist-long-qu':     { forceId: 'chu', cityId: 'pengcheng' },
  'hist-zhongli-mei': { forceId: 'chu', cityId: 'pengcheng' },
  'hist-ji-bu':       { forceId: 'chu', cityId: 'xiapi' },
  'hist-liu-bang':    { forceId: 'chu', cityId: 'xiaopei' }, // the Lord of Pei, on the western road
  'hist-xiao-he':     { forceId: 'chu', cityId: 'xiaopei' },
  'hist-cao-can':     { forceId: 'chu', cityId: 'xiaopei' },
  'hist-fan-kuai':    { forceId: 'chu', cityId: 'xiaopei' },
  // 趙 — King Zhao Xie and Zhang Er besieged in Julu, Chen Yu frozen outside
  'hist-zhao-xie':    { forceId: 'zhao', cityId: 'ye' },     // the King of Zhao, ringed
  'hist-zhang-er':    { forceId: 'zhao', cityId: 'ye' },     // trapped within the walls with him
  'hist-chen-yu':     { forceId: 'zhao', cityId: 'bohai' },  // his army outside, frozen
  'hist-li-zuoche':   { forceId: 'zhao', cityId: 'ye' },
  // 齊
  'hist-tian-dan-chu':{ forceId: 'qi', cityId: 'linzi' },
  'hist-tian-rong':   { forceId: 'qi', cityId: 'linzi' },
  'hist-tian-heng':   { forceId: 'qi', cityId: 'beihai' },
  // 魏
  'hist-wei-bao':     { forceId: 'wei', cityId: 'puyang' },
  'hist-wei-jiu':     { forceId: 'wei', cityId: 'puyang' },
};
export const SCENARIO_CH_JULU: Scenario = {
  id: 'scn-ch-julu',
  name: { en: 'The Battle of Julu', zh: '鉅鹿之戰' },
  description:
    'Break the cauldrons, sink the boats. The Qin empire\'s last great armies have the rebellion by the throat: Wang Li\'s Great Wall corps rings the King of Zhao inside Julu while Zhang Han\'s host guards the supply road, and Zhang Er within the walls screams for a rescue no one dares give — Chen Yu sits outside with his whole army and will not move. Then Xiang Yu murders the dithering Song Yi, seizes command, crosses the river, and orders every cauldron smashed and every boat sunk: three days\' rations and no way back, win or die. In nine furious charges he annihilates the Qin host before a dozen frozen lords too afraid to leave their walls — and walks out, at twenty-six, the master of them all.',
  descriptionZh: "破釜沉舟。秦帝國最後之大軍扼住了起義之咽喉：王離之長城軍圍趙王於鉅鹿，章邯之眾守其甬道糧路，城中張耳呼救而無人敢應——陳餘擁兵於外，按兵不動。於是項羽斬猶豫之宋義，奪其軍，渡河，下令盡破釜甑、盡沉舟船：持三日糧、無還之路，非勝即死。九戰之間，他於十餘壁上諸侯目瞪口呆之注視下，殲秦軍主力——而後步出轅門，年方二十六，諸侯膝行，莫敢仰視。",
  startDate: { year: 178, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_CH_JULU),
  forces: FORCES_CH_JULU,
  officers: buildWarringStatesOfficers(ASSIGN_CH_JULU, ['chu-han', 'qin']),
};

// ── 大澤鄉起義 (Qin's end, the first spark). Chen Sheng and Wu Guang, conscripts
//    halted by floods and facing death for lateness, raise the first revolt against
//    Qin — "are kings and nobles born to their blood?" — while the empire is still
//    vast under the fool Er Shi. ──
const DAZE_ZHANGCHU = ['runan', 'chenliu', 'xuchang', 'guandu'];
const DAZE_CHU = ['jianye', 'wu', 'wuxi', 'kuaiji', 'danyang'];
const DAZE_QI = ['linzi', 'beihai', 'langya'];
const CITY_OWNERSHIP_CH_DAZE: Record<string, string> = Object.fromEntries(
  Object.keys(CITY_OWNERSHIP_CHUHAN).map((c) => {
    if (DAZE_ZHANGCHU.includes(c)) return [c, 'zhangchu'];
    if (DAZE_CHU.includes(c)) return [c, 'chu'];
    if (DAZE_QI.includes(c)) return [c, 'qi'];
    return [c, 'qin']; // the empire still holds everything else
  }),
);
const FORCES_CH_DAZE: Force[] = [
  { id: 'qin',      name: { en: 'Qin Empire', zh: '秦'   }, rulerOfficerId: 'hist-qin-ershi',    capitalCityId: 'changan',   color: '#3a3a4a', isPlayer: false },
  { id: 'zhangchu', name: { en: 'Zhang Chu',  zh: '張楚' }, rulerOfficerId: 'hist-chen-sheng',   capitalCityId: 'runan',     color: '#c0392b', isPlayer: false },
  { id: 'chu',      name: { en: 'Chu (Xiang)', zh: '楚' }, rulerOfficerId: 'hist-xiang-liang',  capitalCityId: 'jianye',    color: '#e07b39', isPlayer: false },
  { id: 'qi',       name: { en: 'Qi',         zh: '齊'   }, rulerOfficerId: 'hist-tian-dan-chu', capitalCityId: 'linzi',     color: '#2aa8c0', isPlayer: false },
];
const ASSIGN_CH_DAZE: Record<string, { forceId: string; cityId: string }> = {
  // 秦 — the empire, vast but rotting under Er Shi and Zhao Gao
  'hist-qin-ershi': { forceId: 'qin', cityId: 'changan' },
  'hist-zhao-gao':  { forceId: 'qin', cityId: 'changan' },
  'hist-li-si':     { forceId: 'qin', cityId: 'changan' },
  'hist-zhang-han': { forceId: 'qin', cityId: 'changan' }, // soon to take the field
  'hist-wang-li':   { forceId: 'qin', cityId: 'beiping' },
  'hist-li-you':    { forceId: 'qin', cityId: 'luoyang' }, // guarding the Sanchuan approaches
  // 張楚 — Chen Sheng's risen conscripts, blazing west
  'hist-chen-sheng':{ forceId: 'zhangchu', cityId: 'runan' },
  'hist-wu-guang':  { forceId: 'zhangchu', cityId: 'xuchang' },
  'hist-zhou-wen':  { forceId: 'zhangchu', cityId: 'guandu' }, // the column driving for the passes
  'hist-wu-chen':   { forceId: 'zhangchu', cityId: 'chenliu' },
  'hist-ge-ying':   { forceId: 'zhangchu', cityId: 'runan' },
  // 楚 — Xiang Liang and the young Xiang Yu, just risen at Kuaiji
  'hist-xiang-liang':{ forceId: 'chu', cityId: 'jianye' },
  'hist-xiang-yu':  { forceId: 'chu', cityId: 'jianye' },
  'hist-ji-bu':     { forceId: 'chu', cityId: 'wu' },
  'hist-huan-chu':  { forceId: 'chu', cityId: 'jianye' },
  // 齊 — the Tian clan restoring Qi
  'hist-tian-dan-chu':{ forceId: 'qi', cityId: 'linzi' },
  'hist-tian-rong': { forceId: 'qi', cityId: 'linzi' },
  'hist-tian-heng': { forceId: 'qi', cityId: 'beihai' },
};
export const SCENARIO_CH_DAZE: Scenario = {
  id: 'scn-ch-daze',
  name: { en: 'The Dazexiang Uprising', zh: '大澤鄉起義' },
  description:
    'Where there is no seed of kings. In the seventh month of rain, nine hundred conscripts bound for the northern garrisons are halted by floods at Dazexiang — and Qin law says a man late to his post dies. So Chen Sheng and Wu Guang reason it out: death for desertion, death for revolt, the same death — better to die for a kingdom. They kill the escort officers, raise the cry "Are kings and nobles born to their blood?", and the first fire of rebellion against Qin catches and roars across the realm. Within weeks the old six kingdoms stir — Xiang Liang in the south, the Tian clan in Qi — while the empire of the First Emperor, still vast and terrible under the fool Er Shi and the eunuch Zhao Gao, gathers its armies to stamp out the spark.',
  descriptionZh: "王侯將相，寧有種乎。七月霖雨，九百戍卒赴漁陽，為大水阻於大澤鄉——而秦法，失期當斬。陳勝吳廣乃謀：亡亦死，舉大計亦死，等死，死國可乎？遂殺尉，舉「王侯將相寧有種乎」之號，反秦之第一把火，燃而怒捲天下。旬月之間，六國舊地皆動——項梁起於江東，田氏王於齊——而始皇之帝國，在愚主二世與閹宦趙高之下，雖暴虐猶廣且強，正集其兵以撲滅此星火。",
  startDate: { year: 178, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_CH_DAZE),
  forces: FORCES_CH_DAZE,
  officers: buildWarringStatesOfficers(ASSIGN_CH_DAZE, ['chu-han', 'qin']),
};

// ── 濰水之戰 (Chu-Han). Han Xin, having swept the north into Liu Bang's hand,
//    falls on Qi; Xiang Yu sends Long Ju with 200,000 to save it, and Han Xin
//    dams the Wei river and breaks the dam on the half-crossed Chu host. ──
const CITY_OWNERSHIP_CH_WEISHUI: Record<string, string> = Object.fromEntries(
  Object.entries(CITY_OWNERSHIP_CHUHAN).map(([c, f]) =>
    [c, f === 'chu' ? 'chu' : f === 'qi' ? 'qi' : 'han'],
  ),
);
const FORCES_CH_WEISHUI: Force[] = [
  { id: 'chu', name: { en: 'Chu', zh: '楚' }, rulerOfficerId: 'hist-xiang-yu',   capitalCityId: 'pengcheng', color: '#c0392b', isPlayer: false },
  { id: 'han', name: { en: 'Han', zh: '漢' }, rulerOfficerId: 'hist-liu-bang',   capitalCityId: 'changan',   color: '#3a7dd9', isPlayer: false },
  { id: 'qi',  name: { en: 'Qi',  zh: '齊' }, rulerOfficerId: 'hist-tian-guang', capitalCityId: 'linzi',     color: '#2aa8c0', isPlayer: false },
];
const ASSIGN_CH_WEISHUI: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_CHUHAN,
  // the north all swept into Han's hand; the old lords folded in
  'hist-zhang-han':  { forceId: 'han', cityId: 'changan' },
  'hist-sima-xin':   { forceId: 'han', cityId: 'tongguan' },
  'hist-dong-yi':    { forceId: 'han', cityId: 'mei' },
  'hist-chen-yu':    { forceId: 'han', cityId: 'ye' },
  'hist-zhang-er':   { forceId: 'han', cityId: 'taiyuan' },
  'hist-li-zuoche':  { forceId: 'han', cityId: 'ye' },     // captured at Jingxing, now advising Han
  'hist-wei-bao':    { forceId: 'han', cityId: 'puyang' },
  'hist-wei-jiu':    { forceId: 'han', cityId: 'luoyang' },
  'hist-ying-bu':    { forceId: 'han', cityId: 'shouchun' },
  // Han Xin's drive on Qi
  'hist-han-xin':    { forceId: 'han', cityId: 'pengcheng' }, // poised on the Qi border
  'hist-guan-ying':  { forceId: 'han', cityId: 'pengcheng' },
  // Qi, taken by surprise, the Tian clan at bay
  'hist-tian-guang': { forceId: 'qi', cityId: 'linzi' },
  'hist-tian-heng':  { forceId: 'qi', cityId: 'beihai' },
  'hist-tian-rong':  { forceId: 'qi', cityId: 'linzi' },
  // Chu's rescue: Long Ju with 200,000
  'hist-xiang-yu':   { forceId: 'chu', cityId: 'pengcheng' },
  'hist-long-qu':    { forceId: 'chu', cityId: 'linzi' },   // marched to save Qi, into the trap
  'hist-fan-zeng':   { forceId: 'chu', cityId: 'pengcheng' },
};
export const SCENARIO_CH_WEISHUI: Scenario = {
  id: 'scn-ch-weishui',
  name: { en: 'The Battle of the Wei River', zh: '楚漢·濰水之戰' },
  description:
    'The water-trick that ended a kingdom. Han Xin, having swept Wei, Dai, Zhao and Yan into Liu Bang\'s hand, turns on Qi — and storms Linzi in a rush before the persuader Li Yiji\'s peace can take hold. Xiang Yu, alarmed at last, sends his finest general Long Ju with two hundred thousand to save it. Long Ju scorns his enemy and will not wait. So in the night Han Xin dams the Wei river upstream with ten thousand sandbags, lures Long Ju half across the dry bed, then breaks the dam — and the flood takes half the Chu host as it struggles in the water. Long Ju dies on the far bank, Qi falls, and the balance of the whole war tips toward Han.',
  descriptionZh: "水淹一國之計。韓信既掃魏、代、趙、燕入於劉邦之手，遂轉兵向齊——趁說客酈食其之和未定，急襲破臨淄。項羽至此始驚，遣其第一名將龍且，提二十萬以救之。龍且輕敵，不肯持重。韓信乃夜以萬囊壅濰水上流，誘龍且半渡涸床，決囊放水——洪流挾去半數楚師於水中掙扎之際。龍且死於彼岸，齊遂平，而舉世戰局之勢，自此傾於漢矣。",
  startDate: { year: 178, season: 'autumn' },
  cities: buildInitialCities(CITY_OWNERSHIP_CH_WEISHUI),
  forces: FORCES_CH_WEISHUI,
  officers: buildWarringStatesOfficers(ASSIGN_CH_WEISHUI, ['chu-han', 'qin']),
};

// ════════════════════════════════════════════════════════════════════════
// 隋末群雄 — Sui-end Warlords (parallel timeline). buildWarringStatesOfficers
// fed the Sui + Tang rosters: Emperor Yang dead, the realm aflame, the seven
// great contenders carve up the north while the south stays unclaimed — and the
// captains who will found the Tang are scattered among the rebels to be won.
// ════════════════════════════════════════════════════════════════════════
const FORCES_ST_SUIEND: Force[] = [
  { id: 'tang',     name: { en: 'Tang',      zh: '唐'   }, rulerOfficerId: 'hist-li-yuan',      capitalCityId: 'changan',  color: '#d4af37', isPlayer: false },
  { id: 'wagang',   name: { en: 'Wagang',    zh: '瓦崗' }, rulerOfficerId: 'hist-li-mi-sui',    capitalCityId: 'puyang',   color: '#c0392b', isPlayer: false },
  { id: 'zheng',    name: { en: 'Zheng',     zh: '鄭'   }, rulerOfficerId: 'hist-wang-shichong',capitalCityId: 'luoyang',  color: '#9a5a9a', isPlayer: false },
  { id: 'xia',      name: { en: 'Xia',       zh: '夏'   }, rulerOfficerId: 'hist-dou-jiande',   capitalCityId: 'ye',       color: '#2aa8c0', isPlayer: false },
  { id: 'xiqin',    name: { en: 'Western Qin', zh: '西秦' }, rulerOfficerId: 'hist-xue-ju',     capitalCityId: 'tianshui', color: '#8a6d3b', isPlayer: false },
  { id: 'dingyang', name: { en: 'Dingyang',  zh: '定楊' }, rulerOfficerId: 'hist-liu-wuzhou',   capitalCityId: 'beiping',  color: '#5a7a8a', isPlayer: false },
  { id: 'wu',       name: { en: 'Wu (Du)',   zh: '杜伏威' }, rulerOfficerId: 'hist-du-fuwei',   capitalCityId: 'shouchun', color: '#2f8e6f', isPlayer: false },
];
const CITY_OWNERSHIP_ST_SUIEND: Record<string, string> = {
  // 唐 — the Tang, risen from Taiyuan and holding Guanzhong
  changan: 'tang', mei: 'tang', chencang: 'tang', tongguan: 'tang', wuguan: 'tang',
  sanguan: 'tang', xiaoguan: 'tang', baishuiguan: 'tang', jianmen: 'tang',
  hanzhong: 'tang', yangping: 'tang', xincheng: 'tang', wudu: 'tang', taiyuan: 'tang',
  yanmen: 'tang', shangdang: 'tang',
  // 西秦 — Xue Ju on the Long passes
  tianshui: 'xiqin', anding: 'xiqin', longxi: 'xiqin', shanggui: 'xiqin',
  jincheng: 'xiqin', wuwei: 'xiqin', jiuquan: 'xiqin', dunhuang: 'xiqin',
  // 瓦崗 — Li Mi's army, gorged on the Luokou granaries, astride the central plain
  puyang: 'wagang', chenliu: 'wagang', xuchang: 'wagang', runan: 'wagang',
  guandu: 'wagang', hulao: 'wagang', baima: 'wagang', yanjin: 'wagang', liyang: 'wagang',
  // 鄭 — Wang Shichong in Luoyang
  luoyang: 'zheng',
  // 夏 — Dou Jiande's Hebei, reaching into Shandong
  ye: 'xia', bohai: 'xia', pingyuan: 'xia', nanpi: 'xia', boling: 'xia',
  linzi: 'xia', beihai: 'xia', langya: 'xia',
  // 定楊 — Liu Wuzhou in the north under Turkic patronage
  beiping: 'dingyang', yuyang: 'dingyang', yunzhong: 'dingyang', wuyuan: 'dingyang',
  shuofang: 'dingyang',
  // 杜伏威 — the Huai and the Jiangdong shore
  shouchun: 'wu', hefei: 'wu', lujiang: 'wu', ruxu: 'wu', guangling: 'wu',
  jianye: 'wu', wu: 'wu', wuxi: 'wu', kuaiji: 'wu', danyang: 'wu',
  // (the south — Jing, Shu, Lingnan — and the far frontier stay unclaimed:
  //  Xiao Xian, Lin Shihong, Feng Ang and the rest are not yet on this board)
};
const ASSIGN_ST_SUIEND: Record<string, { forceId: string; cityId: string }> = {
  // 唐 — Li Yuan and the future Taizong; the great Tang generals are NOT here yet
  'hist-li-yuan':      { forceId: 'tang', cityId: 'changan' },
  'hist-tang-taizong': { forceId: 'tang', cityId: 'changan' }, // Li Shimin, age 19
  'hist-li-jing':      { forceId: 'tang', cityId: 'changan' },
  'hist-qutu-tong':    { forceId: 'tang', cityId: 'tongguan' }, // the Sui general gone to Tang
  // 瓦崗 — Li Mi, mightiest in the land, with the captains Tang will later win
  'hist-li-mi-sui':    { forceId: 'wagang', cityId: 'puyang' },
  'hist-zhai-rang':    { forceId: 'wagang', cityId: 'puyang' },
  'hist-shan-xiongxin':{ forceId: 'wagang', cityId: 'hulao' },
  'hist-wang-bodang':  { forceId: 'wagang', cityId: 'puyang' },
  'hist-qin-qiong':    { forceId: 'wagang', cityId: 'xuchang' }, // Qin Shubao, still under Li Mi
  'hist-cheng-yaojin': { forceId: 'wagang', cityId: 'xuchang' }, // Cheng Zhijie, still under Li Mi
  'hist-li-ji':        { forceId: 'wagang', cityId: 'liyang' },  // Xu Shiji, holds Liyang for Wagang
  // 鄭 — Wang Shichong, with the puppet Sui prince Yang Tong
  'hist-wang-shichong':{ forceId: 'zheng', cityId: 'luoyang' },
  'hist-yang-tong':    { forceId: 'zheng', cityId: 'luoyang' }, // the Sui prince he holds
  'hist-duan-da':      { forceId: 'zheng', cityId: 'luoyang' },
  // 夏 — Dou Jiande and Liu Heita
  'hist-dou-jiande':   { forceId: 'xia', cityId: 'ye' },
  'hist-liu-heita':    { forceId: 'xia', cityId: 'bohai' },
  // 西秦 — Xue Ju
  'hist-xue-ju':       { forceId: 'xiqin', cityId: 'tianshui' },
  // 定楊 — Liu Wuzhou, and Yuchi Gong who fights for him (and will go to Tang)
  'hist-liu-wuzhou':   { forceId: 'dingyang', cityId: 'beiping' },
  'hist-yuchi-gong':   { forceId: 'dingyang', cityId: 'yanmen' }, // Yuchi Jingde, under Liu Wuzhou
  // 杜伏威 — and his lieutenant Fu Gongshi
  'hist-du-fuwei':     { forceId: 'wu', cityId: 'shouchun' },
  'hist-fu-gongshi':   { forceId: 'wu', cityId: 'jianye' },
};
export const SCENARIO_ST_SUIEND: Scenario = {
  id: 'scn-st-suiend',
  name: { en: 'Warlords of the Sui Collapse', zh: '隋末群雄逐鹿' },
  description:
    'The Sui have burned themselves out. Emperor Yang lies dead at Jiangdu, the canal-digging and the Korean wars have broken the realm, and rebellion blazes from every province. In the heartland Li Mi\'s Wagang army is the mightiest force in the land, gorged on the granaries of Luokou; Wang Shichong holds Luoyang with a puppet Sui prince, Dou Jiande the Hebei plain, Xue Ju the Long passes, Liu Wuzhou the north under Turkic patronage, Du Fuwei the Huai. And in Guanzhong, the Duke of Tang Li Yuan and his second son — a youth of nineteen named Li Shimin who has not yet shown the world what he is — hold Chang\'an. The greatest captains of the age are scattered among the rebels: Qin Qiong and Cheng Yaojin under Li Mi, Yuchi Gong under Liu Wuzhou. Whoever gathers them gathers the empire.',
  descriptionZh: "隋室已自焚殆盡。煬帝橫死江都，鑿河與征遼之役耗盡天下，叛火燃於每一州郡。中原之地，李密之瓦崗軍為當世最強，飽掠洛口之倉；王世充挾隋室幼主據洛陽，竇建德有河北之野，薛舉扼隴關，劉武周恃突厥而王於北，杜伏威據淮。而於關中，唐國公李淵與其次子——年方十九、尚未向世人顯露其為何物的李世民——已據長安。當世名將散於群雄之間：秦瓊、程咬金在李密麾下，尉遲恭在劉武周帳中。能聚之者，即聚天下。",
  startDate: { year: 178, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_ST_SUIEND),
  forces: FORCES_ST_SUIEND,
  officers: buildWarringStatesOfficers(ASSIGN_ST_SUIEND, ['sui', 'tang']),
};

// ── 淺水原之戰 (Sui-Tang). Xue Ju's Western Qin cavalry drives east out of the
//    Long passes for Chang'an; Li Shimin's first great campaign, and his first
//    taste of defeat before he comes again and takes the whole Qin army. ──
const CITY_OWNERSHIP_ST_QIANSHUI: Record<string, string> = {
  ...CITY_OWNERSHIP_ST_SUIEND,
  chencang: 'xiqin', // Xue Ju has driven east through the Long passes toward Chang'an
};
const ASSIGN_ST_QIANSHUI: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_ST_SUIEND,
  'hist-tang-taizong': { forceId: 'tang', cityId: 'mei' },      // out to meet the Qin horse
  'hist-li-jing':      { forceId: 'tang', cityId: 'mei' },
  'hist-xue-ju':       { forceId: 'xiqin', cityId: 'chencang' }, // pressing on the capital
};
export const SCENARIO_ST_QIANSHUI: Scenario = {
  id: 'scn-st-qianshui',
  name: { en: 'The Battle of Qianshuiyuan', zh: '隋唐·淺水原之戰' },
  description:
    'The young commander\'s first great campaign — and his first lesson in defeat. Xue Ju\'s Western Qin cavalry, the finest horse in the realm, drives east out of the Long passes straight for Chang\'an. Li Shimin\'s plan is to wait behind walls until their supply fails; but while he lies ill in camp, his deputies are goaded into the open at Qianshuiyuan and shattered. He will have to come a second time — and the second time, run Xue Rengao\'s army to exhaustion and take it whole, the first of the rivals he will swallow on his road to the throne.',
  descriptionZh: "少年統帥之初戰——亦其敗績之初課。薛舉西秦之騎，天下之精，東出隴關，直趨長安。李世民之策，乃堅壁以待其糧盡；然當其臥病軍中，部將為敵所激，出戰於淺水原而大敗。他將再來——第二次，他將拖垮薛仁杲之軍而全取之，此乃其登基之路上所吞群雄之第一個。",
  startDate: { year: 178, season: 'summer' },
  cities: buildInitialCities(CITY_OWNERSHIP_ST_QIANSHUI),
  forces: FORCES_ST_SUIEND,
  officers: buildWarringStatesOfficers(ASSIGN_ST_QIANSHUI, ['sui', 'tang']),
};

// ── 柏壁之戰 (Sui-Tang). Liu Wuzhou, Turk-backed, has stormed down and taken
//    Taiyuan, the cradle of the Tang rising; Li Shimin digs in at Bobi, waits him
//    out, and out of the wreck comes the great prize — Yuchi Gong, kneeling. ──
const CITY_OWNERSHIP_ST_BOBI: Record<string, string> = {
  ...CITY_OWNERSHIP_ST_SUIEND,
  taiyuan: 'dingyang',  // Liu Wuzhou has stormed down and taken Taiyuan
  shangdang: 'dingyang',
};
const ASSIGN_ST_BOBI: Record<string, { forceId: string; cityId: string }> = {
  ...ASSIGN_ST_SUIEND,
  'hist-liu-wuzhou':   { forceId: 'dingyang', cityId: 'taiyuan' }, // in the captured cradle
  'hist-yuchi-gong':   { forceId: 'dingyang', cityId: 'taiyuan' }, // Song Jingang's spearhead
  'hist-tang-taizong': { forceId: 'tang', cityId: 'tongguan' },    // dug in at Bobi to the south
  'hist-li-jing':      { forceId: 'tang', cityId: 'tongguan' },
};
export const SCENARIO_ST_BOBI: Scenario = {
  id: 'scn-st-bobi',
  name: { en: 'The Battle of Bobi', zh: '隋唐·柏壁之戰' },
  description:
    'Liu Wuzhou, backed by the Turks and led by the fierce Song Jingang, has stormed down out of Mayi and taken Taiyuan — the very cradle of the Tang rising — and the court cries to abandon all the land east of the passes. Li Shimin refuses. He digs in at Bobi through the winter, refusing battle, letting the enemy\'s supply rot; then, when they break and run, he pursues two days and a night without rest and destroys them at Que\'shu Valley. And out of the wreck of the beaten army comes the greatest prize of the war: the unstoppable Yuchi Gong, who kneels to Tang.',
  descriptionZh: "劉武周恃突厥，以驍將宋金剛為鋒，自馬邑南下，拔太原——唐興之搖籃——朝廷皆議棄關以東之地。李世民不可。乃深壁柏壁，經冬不戰，坐視敵糧自潰；及其敗走，晝夜兼程追之二日一夜，殲之於雀鼠谷。而自敗軍之中，得此役最大之獲：萬人不當的尉遲恭，跪降於唐。",
  startDate: { year: 178, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_ST_BOBI),
  forces: FORCES_ST_SUIEND,
  officers: buildWarringStatesOfficers(ASSIGN_ST_BOBI, ['sui', 'tang']),
};

// ── 虎牢之戰 (Sui-Tang). One battle, two kings. Li Shimin has broken all the
//    western rivals and their captains now ride for Tang; he pens Wang Shichong
//    in Luoyang, seizes the Hulao pass, and breaks Dou Jiande's relief host. ──
const FORCES_ST_HULAO: Force[] = [
  { id: 'tang',  name: { en: 'Tang', zh: '唐' }, rulerOfficerId: 'hist-li-yuan',       capitalCityId: 'changan', color: '#d4af37', isPlayer: false },
  { id: 'zheng', name: { en: 'Zheng', zh: '鄭' }, rulerOfficerId: 'hist-wang-shichong', capitalCityId: 'luoyang', color: '#9a5a9a', isPlayer: false },
  { id: 'xia',   name: { en: 'Xia',  zh: '夏' }, rulerOfficerId: 'hist-dou-jiande',    capitalCityId: 'ye',      color: '#2aa8c0', isPlayer: false },
];
const CITY_OWNERSHIP_ST_HULAO: Record<string, string> = Object.fromEntries(
  Object.entries(CITY_OWNERSHIP_ST_SUIEND).map(([c, f]) => {
    if (f === 'zheng') return [c, 'zheng']; // Luoyang
    if (f === 'xia') return [c, 'xia'];     // Dou Jiande's Hebei and Shandong
    return [c, 'tang'];                     // Tang has swallowed Wagang/Xiqin/Dingyang/Wu
  }),
);
const ASSIGN_ST_HULAO: Record<string, { forceId: string; cityId: string }> = {
  // 唐 — the captains all gathered now, the siege of Luoyang and the race to Hulao
  'hist-li-yuan':      { forceId: 'tang', cityId: 'changan' },
  'hist-tang-taizong': { forceId: 'tang', cityId: 'hulao' },   // racing to seize the pass
  'hist-li-jing':      { forceId: 'tang', cityId: 'changan' },
  'hist-li-ji':        { forceId: 'tang', cityId: 'hulao' },
  'hist-qin-qiong':    { forceId: 'tang', cityId: 'hulao' },    // won from Wagang, now Tang's
  'hist-cheng-yaojin': { forceId: 'tang', cityId: 'hulao' },
  'hist-yuchi-gong':   { forceId: 'tang', cityId: 'hulao' },    // won at Bobi, now Tang's
  'hist-qutu-tong':    { forceId: 'tang', cityId: 'tongguan' },
  // 鄭 — Wang Shichong penned in Luoyang, with Shan Xiongxin gone over to him
  'hist-wang-shichong':{ forceId: 'zheng', cityId: 'luoyang' },
  'hist-shan-xiongxin':{ forceId: 'zheng', cityId: 'luoyang' }, // Wagang's old tiger, now Zheng's
  'hist-duan-da':      { forceId: 'zheng', cityId: 'luoyang' },
  'hist-yang-tong':    { forceId: 'zheng', cityId: 'luoyang' },
  // 夏 — Dou Jiande's whole host marching to break the siege
  'hist-dou-jiande':   { forceId: 'xia', cityId: 'ye' },
  'hist-liu-heita':    { forceId: 'xia', cityId: 'bohai' },
};
export const SCENARIO_ST_HULAO: Scenario = {
  id: 'scn-st-hulao',
  name: { en: 'The Battle of Hulao', zh: '隋唐·虎牢之戰' },
  description:
    'One battle, two kings. Li Shimin has run the table — Xue Ju\'s Qin, Liu Wuzhou\'s north and Li Mi\'s Wagang all broken, their captains (Qin Qiong, Cheng Yaojin, Yuchi Gong) now riding under Tang banners. He has Wang Shichong\'s Zheng penned starving inside Luoyang. Then Dou Jiande marches his whole Hebei host — a hundred thousand — to save his rival, knowing that if Luoyang falls he is next. Li Shimin does the audacious thing: he leaves a screen to hold the siege and races a small picked force to seize the Hulao pass, the one gate Dou Jiande must force. Hold the pass and shatter the relief, and the two greatest rivals of the age fall on a single day.',
  descriptionZh: "一戰擒兩王。李世民已席捲群雄——薛舉之秦、劉武周之北、李密之瓦崗皆破，其將(秦瓊、程咬金、尉遲恭)今皆隸唐旗之下。他已將王世充之鄭困於洛陽，城中食盡。於是竇建德盡發河北之眾——十萬——以救其敵，蓋知洛陽若破，己為下一個。李世民乃行險著：留偏師續圍，自將精銳疾趨虎牢，扼竇建德必爭之關。守關而破援，則當世兩大勁敵，一日俱擒。",
  startDate: { year: 178, season: 'spring' },
  cities: buildInitialCities(CITY_OWNERSHIP_ST_HULAO),
  forces: FORCES_ST_HULAO,
  officers: buildWarringStatesOfficers(ASSIGN_ST_HULAO, ['sui', 'tang']),
};

// ── 安史之亂 (Tang, the golden age ending). An Lushan raises 150,000 at Fanyang
//    and the unblooded heartland folds — Luoyang, the Tong pass, Chang'an. Against
//    him: Guo Ziyi and Li Guangbi from Shuofang, Yan Zhenqing in Hebei, Zhang Xun
//    holding the door to the south at Suiyang. (Tang roster.) ──
const ANSHI_YAN = [
  'beiping', 'yuyang', 'ye', 'bohai', 'nanpi', 'boling',
  'luoyang', 'chenliu', 'xuchang', 'guandu', 'hulao', 'baima', 'yanjin', 'liyang',
];
const CITY_OWNERSHIP_ST_ANSHI: Record<string, string> = Object.fromEntries(
  Object.keys(CITY_OWNERSHIP_CHUHAN).map((c) => [c, ANSHI_YAN.includes(c) ? 'yan' : 'tang']),
);
const FORCES_ST_ANSHI: Force[] = [
  { id: 'tang', name: { en: 'Tang',     zh: '唐'   }, rulerOfficerId: 'hist-li-longji', capitalCityId: 'changan', color: '#d4af37', isPlayer: false },
  { id: 'yan',  name: { en: 'Great Yan', zh: '大燕' }, rulerOfficerId: 'hist-an-lushan', capitalCityId: 'beiping', color: '#8b2e2e', isPlayer: false },
];
const ASSIGN_ST_ANSHI: Record<string, { forceId: string; cityId: string }> = {
  // 唐 — the dozing emperor, and the loyal commanders who must save the dynasty
  'hist-li-longji':     { forceId: 'tang', cityId: 'changan' },  // Xuanzong, soon fleeing to Shu
  'hist-yang-guifei':   { forceId: 'tang', cityId: 'changan' },  // doomed at Mawei
  'hist-guo-ziyi':      { forceId: 'tang', cityId: 'anding' },   // Shuofang's saviour-general
  'hist-li-guangbi':    { forceId: 'tang', cityId: 'taiyuan' },  // his equal in the field
  'hist-yan-zhenqing':  { forceId: 'tang', cityId: 'pingyuan' }, // Hebei's commanderies rise
  'hist-yan-gaoqing':   { forceId: 'tang', cityId: 'pingyuan' }, // his cousin, martyred at Changshan
  'hist-geshu-han':     { forceId: 'tang', cityId: 'tongguan' }, // holding the Tong pass
  'hist-gao-xianzhi':   { forceId: 'tang', cityId: 'tongguan' },
  'hist-feng-changqing':{ forceId: 'tang', cityId: 'tongguan' },
  'hist-zhang-xun':     { forceId: 'tang', cityId: 'runan' },    // the door to the south, Suiyang
  'hist-li-bai':        { forceId: 'tang', cityId: 'jianye' },   // the poet, adrift in the south
  // 大燕 — the rebel emperor and his marshal
  'hist-an-lushan':     { forceId: 'yan', cityId: 'beiping' },   // 150,000 risen at Fanyang
  'hist-shi-siming':    { forceId: 'yan', cityId: 'ye' },        // who will outlast him
};
export const SCENARIO_ST_ANSHI: Scenario = {
  id: 'scn-st-anshi',
  name: { en: 'The An Lushan Rebellion', zh: '安史之亂' },
  description:
    'The mountains break. For forty years Emperor Xuanzong has reigned over the most brilliant court the world had ever seen — then drowsed into the arms of Yang Guifei while real power slid to the frontier. Now An Lushan, the vast general who commands three border armies, raises a hundred and fifty thousand at Fanyang and marches south crying treason against the chief minister. The unblooded heartland folds: Luoyang falls, then the Tong pass, then Chang\'an itself, as Xuanzong flees toward Shu and his own guards strangle Yang Guifei at Mawei. But in Hebei the commanderies of Yan Zhenqing rise behind the rebels; in the passes Guo Ziyi and Li Guangbi gather the Shuofang veterans; and at Suiyang one man named Zhang Xun prepares to hold the door to the south with his life. The eight years that end the golden age begin.',
  descriptionZh: "山河崩裂。玄宗御宇四十年，開元天寶之盛曠古未有——而後醉臥於楊貴妃之懷，實權旁落於邊鎮。今安祿山，統三鎮之胡將，擁兵十五萬起於范陽，以討權相為名，長驅南下。承平已久的中原望風而潰：洛陽陷，潼關破，長安亦失，玄宗西奔入蜀，禁軍縊殺楊貴妃於馬嵬。然河北顏真卿之諸郡並起於賊後，關塞間郭子儀、李光弼聚朔方之勁卒，睢陽城中一人名張巡者，將以性命守住通往江南之門。終結盛世的八年，自此而始。",
  startDate: { year: 178, season: 'winter' },
  cities: buildInitialCities(CITY_OWNERSHIP_ST_ANSHI),
  forces: FORCES_ST_ANSHI,
  officers: buildWarringStatesOfficers(ASSIGN_ST_ANSHI, ['tang']),
};

const RAW_SCENARIOS: Scenario[] = [
  // ── Sui-end Warlords (parallel timeline) ──
  SCENARIO_ST_SUIEND,
  SCENARIO_ST_QIANSHUI,
  SCENARIO_ST_BOBI,
  SCENARIO_ST_HULAO,
  SCENARIO_ST_ANSHI,
  // ── Chu-Han Contention (parallel timeline) ──
  SCENARIO_CH_DAZE,
  SCENARIO_CH_JULU,
  SCENARIO_CH_CHUHAN,
  SCENARIO_CH_SANQIN,
  SCENARIO_CH_PENGCHENG,
  SCENARIO_CH_WEISHUI,
  SCENARIO_CH_JINGXING,
  SCENARIO_CH_GAIXIA,
  // ── Warring States (parallel timeline) ──
  SCENARIO_WS_SEVEN,
  SCENARIO_WS_WEIWEN,
  SCENARIO_WS_SHANGYANG,
  SCENARIO_WS_GUILING,
  SCENARIO_WS_HANGU,
  SCENARIO_WS_YIQUE,
  SCENARIO_WS_YANYING,
  SCENARIO_WS_YUYU,
  SCENARIO_WS_QIMIN,
  SCENARIO_WS_YUEYI,
  SCENARIO_WS_CHANGPING,
  SCENARIO_WS_HANDAN,
  SCENARIO_WS_TIANDAN,
  SCENARIO_WS_QIN_UNIFY,
  // ── Historical (chronological 184–280 AD) ──
  SCENARIO_184_YELLOW_TURBAN,
  SCENARIO_189_EUNUCHS,
  SCENARIO_190_ANTI_DONG_ZHUO,
  SCENARIO_192_WANGYUN,
  SCENARIO_194_XUZHOU,
  SCENARIO_195_JIANGDONG,
  SCENARIO_197_BOHAI,
  SCENARIO_198_XIAPI,
  SCENARIO_199_YIJING,
  SCENARIO_200_GUANDU,
  SCENARIO_204_YECHENG,
  SCENARIO_207_THREE_VISITS,
  SCENARIO_207_BAILANG,
  SCENARIO_208_CHIBI,
  SCENARIO_211_WEINAN,
  SCENARIO_213_FENGPO,
  SCENARIO_214_XICHUAN,
  SCENARIO_215_HEFEI,
  SCENARIO_218_DINGJUN,
  SCENARIO_219_HANZHONG,
  SCENARIO_220_DECLARATION,
  SCENARIO_221_SHU_EMPEROR,
  SCENARIO_222_YILING,
  SCENARIO_225_SOUTHERN,
  SCENARIO_228_JIETING,
  SCENARIO_228_SHITING,
  SCENARIO_229_THREE_EMPERORS,
  SCENARIO_231_LUCHENG,
  SCENARIO_234_WUZHANG,
  SCENARIO_238_LIAODONG,
  SCENARIO_241_SHAOPI,
  SCENARIO_244_XINGSHI,
  SCENARIO_249_GAOPINGLING,
  SCENARIO_252_DONGXING,
  SCENARIO_253_HEFEI,
  SCENARIO_255_HUAINAN2,
  SCENARIO_257_HUAINAN3,
  SCENARIO_263_SHU_FALL,
  SCENARIO_264_ZHONGHUI,
  SCENARIO_265_JIN_FOUNDED,
  SCENARIO_272_XILING,
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
  SCENARIO_WHATIF_GUOJIA_LIVES,
  SCENARIO_WHATIF_ZHOUYU_LIVES,
  SCENARIO_WHATIF_PANGTONG_LIVES,
  SCENARIO_WHATIF_GUANYU_NORTH,
  SCENARIO_WHATIF_GAOPINGLING,
  SCENARIO_WHATIF_LUXUN_LIVES,
];

// Enlist each force's canonical retinue (historical subordinates who otherwise
// shipped as free agents), so secondary warlords field a proper officer corps
// instead of standing alone. Applied once to every scenario.
export const SCENARIOS: Scenario[] = RAW_SCENARIOS.map((s) => ({
  ...s,
  officers: fillRetinues(s.officers, s.forces, s.startDate.year),
}));

export const SCENARIOS_BY_ID: Record<string, Scenario> = Object.fromEntries(
  RAW_SCENARIOS.map((s) => [s.id, s]),
);


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


/** Built-in scenarios plus any the installed Mod packs contribute.
 *  (mods.ts imports only types, so this static import is cycle-free.) */
export function allScenarios(): Scenario[] {
  try {
    const baseById: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
    const mod = modScenariosForStart(loadMods(), baseById);
    return mod.length > 0 ? [...SCENARIOS, ...mod] : SCENARIOS;
  } catch {
    return SCENARIOS;
  }
}
