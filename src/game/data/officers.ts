import type { Equipment, Officer } from '../types';
import type { Dynasty } from './dynasties';
import { HISTORICAL_OFFICER_TEMPLATES } from './historicalOfficers';
import { ITEMS_BY_ID } from './items';
import {
  OFFICER_SKILLS,
  deriveDefaultSkills,
  deriveInitialRank,
} from './officerSkills';
import { OFFICER_TRAITS, deriveTraitsFromStats } from './personality';
import {
  deriveDoctrine,
  deriveFormations,
  deriveTactics,
  derivePolicies,
  deriveLevel,
} from './officerAttributes';

const resolveSkillsAndRank = (t: OfficerTemplate) => {
  const skills = OFFICER_SKILLS[t.id] ?? deriveDefaultSkills(t.stats);
  const rank = deriveInitialRank(t.stats);
  const traits = OFFICER_TRAITS[t.id] ?? deriveTraitsFromStats(t.stats);
  const doctrine = deriveDoctrine(t.stats, t.id);
  const formations = deriveFormations(t.stats, t.id);
  const tactics = deriveTactics(t.stats, t.id);
  const policies = derivePolicies(t.stats, t.id);
  const level = deriveLevel(t.stats);
  return { skills, rank, traits, doctrine, formations, tactics, policies, level };
};

interface OfficerTemplate {
  id: string;
  name: { en: string; zh: string };
  courtesyName?: { en: string; zh: string };
  birthYear: number;
  deathYear?: number;
  /** Historical home/origin city — used to seed `unsearched` officers so
   *  the "Search for Talent" command finds them in the right place. */
  hometownCityId?: string;
  stats: {
    leadership: number;
    war: number;
    intelligence: number;
    politics: number;
    charisma: number;
  };
}

// ── Officers placed in scenarios (active or referenced explicitly) ─────
const OFFICER_TEMPLATES: OfficerTemplate[] = [
  // Cao Cao force — high command
  { id: 'cao-cao',     name: { en: 'Cao Cao',     zh: '曹操'   }, courtesyName: { en: 'Mengde',    zh: '孟德' }, birthYear: 155, deathYear: 220, hometownCityId: 'xiaopei', stats: { leadership: 95, war: 87,  intelligence: 96, politics: 96, charisma: 98 } },
  { id: 'xiahou-dun',  name: { en: 'Xiahou Dun',  zh: '夏侯惇' }, courtesyName: { en: 'Yuanrang',  zh: '元讓' }, birthYear: 157, deathYear: 220, hometownCityId: 'xiaopei', stats: { leadership: 88, war: 90,  intelligence: 70, politics: 70, charisma: 85 } },
  { id: 'xiahou-yuan', name: { en: 'Xiahou Yuan', zh: '夏侯淵' }, courtesyName: { en: 'Miaocai',   zh: '妙才' }, birthYear: 161, deathYear: 219, hometownCityId: 'xiaopei', stats: { leadership: 84, war: 89,  intelligence: 76, politics: 60, charisma: 75 } },
  { id: 'cao-ren',     name: { en: 'Cao Ren',     zh: '曹仁'   }, courtesyName: { en: 'Zixiao',    zh: '子孝' }, birthYear: 168, deathYear: 223, hometownCityId: 'xiaopei', stats: { leadership: 90, war: 88,  intelligence: 78, politics: 75, charisma: 78 } },
  { id: 'cao-hong',    name: { en: 'Cao Hong',    zh: '曹洪'   }, courtesyName: { en: 'Zilian',    zh: '子廉' }, birthYear: 165, deathYear: 232, hometownCityId: 'xiaopei', stats: { leadership: 75, war: 80,  intelligence: 50, politics: 60, charisma: 65 } },
  { id: 'yu-jin',      name: { en: 'Yu Jin',      zh: '于禁'   }, courtesyName: { en: 'Wenze',     zh: '文則' }, birthYear: 160, deathYear: 221, hometownCityId: 'pengcheng', stats: { leadership: 85, war: 80,  intelligence: 65, politics: 60, charisma: 70 } },
  { id: 'le-jin',      name: { en: 'Le Jin',      zh: '樂進'   }, courtesyName: { en: 'Wenqian',   zh: '文謙' }, birthYear: 162, deathYear: 218, hometownCityId: 'puyang', stats: { leadership: 80, war: 84,  intelligence: 55, politics: 50, charisma: 70 } },
  { id: 'xun-yu',      name: { en: 'Xun Yu',      zh: '荀彧'   }, courtesyName: { en: 'Wenruo',    zh: '文若' }, birthYear: 163, deathYear: 212, hometownCityId: 'xuchang', stats: { leadership: 70, war: 25,  intelligence: 97, politics: 95, charisma: 90 } },
  { id: 'guo-jia',     name: { en: 'Guo Jia',     zh: '郭嘉'   }, courtesyName: { en: 'Fengxiao',  zh: '奉孝' }, birthYear: 170, deathYear: 207, hometownCityId: 'xuchang', stats: { leadership: 60, war: 30,  intelligence: 99, politics: 75, charisma: 78 } },

  // Liu Bei + brothers
  { id: 'liu-bei',     name: { en: 'Liu Bei',     zh: '劉備'   }, courtesyName: { en: 'Xuande',    zh: '玄德' }, birthYear: 161, deathYear: 223, hometownCityId: 'beiping', stats: { leadership: 88, war: 75,  intelligence: 77, politics: 81, charisma: 99 } },
  { id: 'guan-yu',     name: { en: 'Guan Yu',     zh: '關羽'   }, courtesyName: { en: 'Yunchang',  zh: '雲長' }, birthYear: 160, deathYear: 220, hometownCityId: 'puyang', stats: { leadership: 95, war: 97,  intelligence: 75, politics: 64, charisma: 92 } },
  { id: 'zhang-fei',   name: { en: 'Zhang Fei',   zh: '張飛'   }, courtesyName: { en: 'Yide',      zh: '翼德' }, birthYear: 167, deathYear: 221, hometownCityId: 'beiping', stats: { leadership: 80, war: 98,  intelligence: 47, politics: 36, charisma: 60 } },

  // Yuan Shao force
  { id: 'yuan-shao',   name: { en: 'Yuan Shao',   zh: '袁紹'   }, courtesyName: { en: 'Benchu',    zh: '本初' }, birthYear: 154, deathYear: 202, hometownCityId: 'runan', stats: { leadership: 80, war: 79,  intelligence: 75, politics: 71, charisma: 86 } },
  { id: 'yan-liang',   name: { en: 'Yan Liang',   zh: '顏良'   },                                                                                          birthYear: 165, deathYear: 200, hometownCityId: 'ye', stats: { leadership: 65, war: 95,  intelligence: 30, politics: 25, charisma: 60 } },
  { id: 'wen-chou',    name: { en: 'Wen Chou',    zh: '文丑'   },                                                                                          birthYear: 165, deathYear: 200, hometownCityId: 'ye', stats: { leadership: 70, war: 94,  intelligence: 32, politics: 28, charisma: 55 } },
  { id: 'zhang-he',    name: { en: 'Zhang He',    zh: '張郃'   }, courtesyName: { en: 'Junyi',     zh: '儁乂' }, birthYear: 167, deathYear: 231, hometownCityId: 'ye', stats: { leadership: 88, war: 92,  intelligence: 80, politics: 65, charisma: 75 } },
  { id: 'tian-feng',   name: { en: 'Tian Feng',   zh: '田豐'   }, courtesyName: { en: 'Yuanhao',   zh: '元皓' }, birthYear: 152, deathYear: 200, hometownCityId: 'ye', stats: { leadership: 60, war: 30,  intelligence: 95, politics: 88, charisma: 75 } },

  // Yuan Shu force
  { id: 'yuan-shu',    name: { en: 'Yuan Shu',    zh: '袁術'   }, courtesyName: { en: 'Gonglu',    zh: '公路' }, birthYear: 155, deathYear: 199, hometownCityId: 'runan', stats: { leadership: 60, war: 67,  intelligence: 60, politics: 50, charisma: 60 } },
  { id: 'ji-ling',     name: { en: 'Ji Ling',     zh: '紀靈'   },                                                                                          birthYear: 160,                  hometownCityId: 'runan', stats: { leadership: 70, war: 78,  intelligence: 50, politics: 40, charisma: 50 } },

  // Sun force
  { id: 'sun-jian',    name: { en: 'Sun Jian',    zh: '孫堅'   }, courtesyName: { en: 'Wentai',    zh: '文台' }, birthYear: 155, deathYear: 191, hometownCityId: 'wu', stats: { leadership: 88, war: 92,  intelligence: 80, politics: 78, charisma: 88 } },
  { id: 'sun-ce',      name: { en: 'Sun Ce',      zh: '孫策'   }, courtesyName: { en: 'Bofu',      zh: '伯符' }, birthYear: 175, deathYear: 200, hometownCityId: 'wu', stats: { leadership: 90, war: 92,  intelligence: 75, politics: 70, charisma: 92 } },
  { id: 'sun-quan',    name: { en: 'Sun Quan',    zh: '孫權'   }, courtesyName: { en: 'Zhongmou',  zh: '仲謀' }, birthYear: 182, deathYear: 252, hometownCityId: 'wu', stats: { leadership: 88, war: 75,  intelligence: 88, politics: 92, charisma: 95 } },
  { id: 'cheng-pu',    name: { en: 'Cheng Pu',    zh: '程普'   }, courtesyName: { en: 'Demou',     zh: '德謀' }, birthYear: 153, deathYear: 215, hometownCityId: 'beiping', stats: { leadership: 80, war: 82,  intelligence: 76, politics: 65, charisma: 75 } },
  { id: 'huang-gai',   name: { en: 'Huang Gai',   zh: '黃蓋'   }, courtesyName: { en: 'Gongfu',    zh: '公覆' }, birthYear: 152, deathYear: 215, hometownCityId: 'lingling', stats: { leadership: 82, war: 87,  intelligence: 72, politics: 50, charisma: 72 } },
  { id: 'zhou-tai',    name: { en: 'Zhou Tai',    zh: '周泰'   }, courtesyName: { en: 'Youping',   zh: '幼平' }, birthYear: 165, deathYear: 215, hometownCityId: 'shouchun', stats: { leadership: 85, war: 88,  intelligence: 60, politics: 50, charisma: 65 } },
  { id: 'han-dang',    name: { en: 'Han Dang',    zh: '韓當'   }, courtesyName: { en: 'Yigong',    zh: '義公' }, birthYear: 160, deathYear: 226, hometownCityId: 'liaodong', stats: { leadership: 78, war: 80,  intelligence: 55, politics: 45, charisma: 60 } },

  // Dong Zhuo force
  { id: 'dong-zhuo',   name: { en: 'Dong Zhuo',   zh: '董卓'   }, courtesyName: { en: 'Zhongying', zh: '仲穎' }, birthYear: 138, deathYear: 192, hometownCityId: 'longxi', stats: { leadership: 75, war: 86,  intelligence: 53, politics: 30, charisma: 24 } },
  { id: 'lu-bu',       name: { en: 'Lu Bu',       zh: '呂布'   }, courtesyName: { en: 'Fengxian',  zh: '奉先' }, birthYear: 158, deathYear: 198, hometownCityId: 'yanmen', stats: { leadership: 85, war: 100, intelligence: 26, politics: 18, charisma: 30 } },
  { id: 'li-ru',       name: { en: 'Li Ru',       zh: '李儒'   },                                                                                          birthYear: 150, deathYear: 192, hometownCityId: 'longxi', stats: { leadership: 50, war: 30,  intelligence: 88, politics: 75, charisma: 60 } },

  // Other major lords
  { id: 'liu-biao',    name: { en: 'Liu Biao',    zh: '劉表'   }, courtesyName: { en: 'Jingsheng', zh: '景升' }, birthYear: 142, deathYear: 208, stats: { leadership: 60, war: 50,  intelligence: 75, politics: 76, charisma: 80 } },
  { id: 'liu-yan',     name: { en: 'Liu Yan',     zh: '劉焉'   }, courtesyName: { en: 'Junlang',   zh: '君郎' }, birthYear: 140, deathYear: 194, hometownCityId: 'jiangxia', stats: { leadership: 60, war: 52,  intelligence: 76, politics: 80, charisma: 75 } },
  { id: 'liu-zhang',   name: { en: 'Liu Zhang',   zh: '劉璋'   }, courtesyName: { en: 'Jiyu',      zh: '季玉' }, birthYear: 162, deathYear: 219, hometownCityId: 'jiangxia', stats: { leadership: 40, war: 35,  intelligence: 50, politics: 60, charisma: 65 } },
  { id: 'gongsun-zan', name: { en: 'Gongsun Zan', zh: '公孫瓚' }, courtesyName: { en: 'Bogui',     zh: '伯珪' }, birthYear: 155, deathYear: 199, hometownCityId: 'beiping', stats: { leadership: 80, war: 87,  intelligence: 60, politics: 55, charisma: 70 } },
  { id: 'tao-qian',    name: { en: 'Tao Qian',    zh: '陶謙'   }, courtesyName: { en: 'Gongzu',    zh: '恭祖' }, birthYear: 132, deathYear: 194, hometownCityId: 'danyang', stats: { leadership: 55, war: 50,  intelligence: 70, politics: 65, charisma: 70 } },
  { id: 'kong-rong',   name: { en: 'Kong Rong',   zh: '孔融'   }, courtesyName: { en: 'Wenju',     zh: '文舉' }, birthYear: 153, deathYear: 208, hometownCityId: 'pengcheng', stats: { leadership: 50, war: 30,  intelligence: 75, politics: 80, charisma: 88 } },
  { id: 'ma-teng',     name: { en: 'Ma Teng',     zh: '馬騰'   }, courtesyName: { en: 'Shoucheng', zh: '壽成' }, birthYear: 156, deathYear: 212, hometownCityId: 'mei', stats: { leadership: 78, war: 84,  intelligence: 60, politics: 55, charisma: 78 } },
];

// ── Talent pool — discovered via wandering events or Search command ──
const TALENT_POOL_TEMPLATES: OfficerTemplate[] = [
  // Liu Bei circle (Shu)
  { id: 'zhuge-liang', name: { en: 'Zhuge Liang', zh: '諸葛亮' }, courtesyName: { en: 'Kongming',  zh: '孔明' }, birthYear: 181, deathYear: 234, hometownCityId: 'langya', stats: { leadership: 92, war: 75, intelligence: 100, politics: 95, charisma: 92 } },
  { id: 'zhao-yun',    name: { en: 'Zhao Yun',    zh: '趙雲'   }, courtesyName: { en: 'Zilong',    zh: '子龍' }, birthYear: 168, deathYear: 229, hometownCityId: 'ye', stats: { leadership: 88, war: 96, intelligence: 80,  politics: 70, charisma: 90 } },
  { id: 'huang-zhong', name: { en: 'Huang Zhong', zh: '黃忠'   }, courtesyName: { en: 'Hansheng',  zh: '漢升' }, birthYear: 148, deathYear: 220, hometownCityId: 'wancheng', stats: { leadership: 82, war: 95, intelligence: 60,  politics: 50, charisma: 75 } },
  { id: 'ma-chao',     name: { en: 'Ma Chao',     zh: '馬超'   }, courtesyName: { en: 'Mengqi',    zh: '孟起' }, birthYear: 176, deathYear: 222, hometownCityId: 'mei', stats: { leadership: 88, war: 96, intelligence: 60,  politics: 50, charisma: 88 } },
  { id: 'wei-yan',     name: { en: 'Wei Yan',     zh: '魏延'   }, courtesyName: { en: 'Wenchang',  zh: '文長' }, birthYear: 175, deathYear: 234, hometownCityId: 'xinye', stats: { leadership: 86, war: 90, intelligence: 65,  politics: 50, charisma: 60 } },
  { id: 'pang-tong',   name: { en: 'Pang Tong',   zh: '龐統'   }, courtesyName: { en: 'Shiyuan',   zh: '士元' }, birthYear: 179, deathYear: 214, hometownCityId: 'xiangyang', stats: { leadership: 75, war: 35, intelligence: 95,  politics: 80, charisma: 70 } },
  { id: 'fa-zheng',    name: { en: 'Fa Zheng',    zh: '法正'   }, courtesyName: { en: 'Xiaozhi',   zh: '孝直' }, birthYear: 176, deathYear: 220, hometownCityId: 'mei', stats: { leadership: 75, war: 50, intelligence: 92,  politics: 80, charisma: 78 } },
  { id: 'jiang-wei',   name: { en: 'Jiang Wei',   zh: '姜維'   }, courtesyName: { en: 'Boyue',     zh: '伯約' }, birthYear: 202, deathYear: 264, hometownCityId: 'tianshui', stats: { leadership: 90, war: 92, intelligence: 92,  politics: 78, charisma: 82 } },
  { id: 'ma-liang',    name: { en: 'Ma Liang',    zh: '馬良'   }, courtesyName: { en: 'Jichang',   zh: '季常' }, birthYear: 187, deathYear: 222, hometownCityId: 'xiangyang', stats: { leadership: 65, war: 50, intelligence: 88,  politics: 85, charisma: 80 } },
  { id: 'ma-su',       name: { en: 'Ma Su',       zh: '馬謖'   }, courtesyName: { en: 'Youchang',  zh: '幼常' }, birthYear: 190, deathYear: 228, hometownCityId: 'xiangyang', stats: { leadership: 60, war: 55, intelligence: 88,  politics: 70, charisma: 70 } },
  { id: 'jian-yong',   name: { en: 'Jian Yong',   zh: '簡雍'   }, courtesyName: { en: 'Xianhe',    zh: '憲和' }, birthYear: 158, deathYear: 222, hometownCityId: 'beiping', stats: { leadership: 40, war: 35, intelligence: 78,  politics: 75, charisma: 80 } },
  { id: 'sun-qian',    name: { en: 'Sun Qian',    zh: '孫乾'   }, courtesyName: { en: 'Gongyou',   zh: '公祐' }, birthYear: 160, deathYear: 215, hometownCityId: 'beihai', stats: { leadership: 50, war: 40, intelligence: 78,  politics: 80, charisma: 80 } },
  { id: 'mi-zhu',      name: { en: 'Mi Zhu',      zh: '麋竺'   }, courtesyName: { en: 'Zizhong',   zh: '子仲' }, birthYear: 165, deathYear: 220, hometownCityId: 'xiapi', stats: { leadership: 30, war: 25, intelligence: 70,  politics: 85, charisma: 80 } },
  { id: 'liao-hua',    name: { en: 'Liao Hua',    zh: '廖化'   }, courtesyName: { en: 'Yuanjian',  zh: '元儉' }, birthYear: 180, deathYear: 264, hometownCityId: 'xiangyang', stats: { leadership: 75, war: 78, intelligence: 65,  politics: 60, charisma: 65 } },
  { id: 'guan-ping',   name: { en: 'Guan Ping',   zh: '關平'   },                                                                                          birthYear: 178, deathYear: 220, hometownCityId: 'puyang', stats: { leadership: 80, war: 88, intelligence: 70,  politics: 65, charisma: 75 } },
  { id: 'guan-xing',   name: { en: 'Guan Xing',   zh: '關興'   }, courtesyName: { en: 'Anguo',     zh: '安國' }, birthYear: 198, deathYear: 235, hometownCityId: 'puyang', stats: { leadership: 80, war: 85, intelligence: 70,  politics: 65, charisma: 75 } },
  { id: 'zhang-bao',   name: { en: 'Zhang Bao',   zh: '張苞'   },                                                                                          birthYear: 197, deathYear: 230, hometownCityId: 'beiping', stats: { leadership: 78, war: 88, intelligence: 50,  politics: 40, charisma: 60 } },
  { id: 'liu-shan',    name: { en: 'Liu Shan',    zh: '劉禪'   }, courtesyName: { en: 'Gongsi',    zh: '公嗣' }, birthYear: 207, deathYear: 271, hometownCityId: 'chengdu', stats: { leadership: 30, war: 25, intelligence: 50,  politics: 45, charisma: 60 } },

  // Cao Wei circle
  { id: 'xun-you',     name: { en: 'Xun You',     zh: '荀攸'   }, courtesyName: { en: 'Gongda',    zh: '公達' }, birthYear: 157, deathYear: 214, hometownCityId: 'xuchang', stats: { leadership: 65, war: 30, intelligence: 95,  politics: 90, charisma: 80 } },
  { id: 'cheng-yu',    name: { en: 'Cheng Yu',    zh: '程昱'   }, courtesyName: { en: 'Zhongde',   zh: '仲德' }, birthYear: 141, deathYear: 220, hometownCityId: 'puyang', stats: { leadership: 78, war: 50, intelligence: 92,  politics: 85, charisma: 75 } },
  { id: 'li-dian',     name: { en: 'Li Dian',     zh: '李典'   }, courtesyName: { en: 'Manchang',  zh: '曼成' }, birthYear: 174, deathYear: 209, hometownCityId: 'xuchang', stats: { leadership: 78, war: 78, intelligence: 75,  politics: 70, charisma: 75 } },
  { id: 'man-chong',   name: { en: 'Man Chong',   zh: '滿寵'   }, courtesyName: { en: 'Boning',    zh: '伯寧' }, birthYear: 162, deathYear: 242, hometownCityId: 'xuchang', stats: { leadership: 80, war: 65, intelligence: 87,  politics: 88, charisma: 70 } },
  { id: 'xu-huang',    name: { en: 'Xu Huang',    zh: '徐晃'   }, courtesyName: { en: 'Gongming',  zh: '公明' }, birthYear: 170, deathYear: 227, hometownCityId: 'puyang', stats: { leadership: 87, war: 92, intelligence: 80,  politics: 65, charisma: 75 } },
  { id: 'pang-de',     name: { en: 'Pang De',     zh: '龐德'   }, courtesyName: { en: 'Lingming',  zh: '令明' }, birthYear: 170, deathYear: 219, hometownCityId: 'tianshui', stats: { leadership: 84, war: 90, intelligence: 70,  politics: 50, charisma: 70 } },
  { id: 'hao-zhao',    name: { en: 'Hao Zhao',    zh: '郝昭'   }, courtesyName: { en: 'Bodao',     zh: '伯道' }, birthYear: 175, deathYear: 229, hometownCityId: 'taiyuan', stats: { leadership: 90, war: 80, intelligence: 85,  politics: 70, charisma: 65 } },
  { id: 'zang-ba',     name: { en: 'Zang Ba',     zh: '臧霸'   }, courtesyName: { en: 'Xuangao',   zh: '宣高' }, birthYear: 170, deathYear: 230, hometownCityId: 'pengcheng', stats: { leadership: 80, war: 85, intelligence: 70,  politics: 65, charisma: 70 } },
  { id: 'cao-pi',      name: { en: 'Cao Pi',      zh: '曹丕'   }, courtesyName: { en: 'Zihuan',    zh: '子桓' }, birthYear: 187, deathYear: 226, hometownCityId: 'xiaopei', stats: { leadership: 80, war: 70, intelligence: 88,  politics: 90, charisma: 78 } },
  { id: 'cao-zhi',     name: { en: 'Cao Zhi',     zh: '曹植'   }, courtesyName: { en: 'Zijian',    zh: '子建' }, birthYear: 192, deathYear: 232, hometownCityId: 'xiaopei', stats: { leadership: 50, war: 35, intelligence: 95,  politics: 75, charisma: 92 } },
  { id: 'cao-zhang',   name: { en: 'Cao Zhang',   zh: '曹彰'   }, courtesyName: { en: 'Ziwen',     zh: '子文' }, birthYear: 188, deathYear: 223, hometownCityId: 'xiaopei', stats: { leadership: 85, war: 92, intelligence: 55,  politics: 50, charisma: 65 } },
  { id: 'cao-xiu',     name: { en: 'Cao Xiu',     zh: '曹休'   }, courtesyName: { en: 'Wenlie',    zh: '文烈' }, birthYear: 175, deathYear: 228, hometownCityId: 'xiaopei', stats: { leadership: 84, war: 80, intelligence: 75,  politics: 65, charisma: 70 } },
  { id: 'cao-zhen',    name: { en: 'Cao Zhen',    zh: '曹真'   }, courtesyName: { en: 'Zidan',     zh: '子丹' }, birthYear: 180, deathYear: 231, hometownCityId: 'xiaopei', stats: { leadership: 85, war: 80, intelligence: 78,  politics: 70, charisma: 72 } },
  { id: 'cao-chun',    name: { en: 'Cao Chun',    zh: '曹純'   }, courtesyName: { en: 'Zihe',      zh: '子和' }, birthYear: 170, deathYear: 210, stats: { leadership: 82, war: 78, intelligence: 75,  politics: 65, charisma: 70 } },
  { id: 'dian-wei',    name: { en: 'Dian Wei',    zh: '典韋'   },                                                                                          birthYear: 167, deathYear: 197, hometownCityId: 'chenliu', stats: { leadership: 70, war: 96, intelligence: 38,  politics: 30, charisma: 65 } },
  { id: 'xu-chu',      name: { en: 'Xu Chu',      zh: '許褚'   }, courtesyName: { en: 'Zhongkang', zh: '仲康' }, birthYear: 170, deathYear: 230, hometownCityId: 'xiaopei', stats: { leadership: 70, war: 95, intelligence: 32,  politics: 30, charisma: 60 } },
  { id: 'xu-shu',      name: { en: 'Xu Shu',      zh: '徐庶'   }, courtesyName: { en: 'Yuanzhi',   zh: '元直' }, birthYear: 170, deathYear: 230, hometownCityId: 'xuchang', stats: { leadership: 70, war: 60, intelligence: 92,  politics: 80, charisma: 75 } },
  { id: 'chen-gong',   name: { en: 'Chen Gong',   zh: '陳宮'   }, courtesyName: { en: 'Gongtai',   zh: '公台' }, birthYear: 158, deathYear: 198, hometownCityId: 'puyang', stats: { leadership: 60, war: 40, intelligence: 88,  politics: 75, charisma: 75 } },
  { id: 'chen-qun',    name: { en: 'Chen Qun',    zh: '陳群'   }, courtesyName: { en: 'Changwen',  zh: '長文' }, birthYear: 170, deathYear: 237, hometownCityId: 'xuchang', stats: { leadership: 60, war: 30, intelligence: 88,  politics: 92, charisma: 80 } },
  { id: 'liu-ye',      name: { en: 'Liu Ye',      zh: '劉曄'   }, courtesyName: { en: 'Ziyang',    zh: '子揚' }, birthYear: 165, deathYear: 234, hometownCityId: 'shouchun', stats: { leadership: 60, war: 40, intelligence: 90,  politics: 80, charisma: 75 } },
  { id: 'hua-xin',     name: { en: 'Hua Xin',     zh: '華歆'   }, courtesyName: { en: 'Ziyu',      zh: '子魚' }, birthYear: 157, deathYear: 231, hometownCityId: 'pingyuan', stats: { leadership: 50, war: 30, intelligence: 80,  politics: 88, charisma: 75 } },
  { id: 'wang-lang',   name: { en: 'Wang Lang',   zh: '王朗'   }, courtesyName: { en: 'Jingxing',  zh: '景興' }, birthYear: 155, deathYear: 228, hometownCityId: 'xiapi', stats: { leadership: 50, war: 45, intelligence: 80,  politics: 82, charisma: 75 } },
  { id: 'mao-jie',     name: { en: 'Mao Jie',     zh: '毛玠'   }, courtesyName: { en: 'Xiaoxian',  zh: '孝先' }, birthYear: 165, deathYear: 216, hometownCityId: 'chenliu', stats: { leadership: 55, war: 40, intelligence: 82,  politics: 85, charisma: 72 } },
  { id: 'yang-xiu',    name: { en: 'Yang Xiu',    zh: '楊修'   }, courtesyName: { en: 'Dezu',      zh: '德祖' }, birthYear: 175, deathYear: 219, hometownCityId: 'xuchang', stats: { leadership: 40, war: 30, intelligence: 95,  politics: 70, charisma: 80 } },
  { id: 'sima-yi',     name: { en: 'Sima Yi',     zh: '司馬懿' }, courtesyName: { en: 'Zhongda',   zh: '仲達' }, birthYear: 179, deathYear: 251, hometownCityId: 'luoyang', stats: { leadership: 92, war: 70, intelligence: 98,  politics: 92, charisma: 75 } },
  { id: 'sima-shi',    name: { en: 'Sima Shi',    zh: '司馬師' }, courtesyName: { en: 'Ziyuan',    zh: '子元' }, birthYear: 208, deathYear: 255, hometownCityId: 'luoyang', stats: { leadership: 88, war: 80, intelligence: 92,  politics: 88, charisma: 80 } },
  { id: 'sima-zhao',   name: { en: 'Sima Zhao',   zh: '司馬昭' }, courtesyName: { en: 'Zishang',   zh: '子上' }, birthYear: 211, deathYear: 265, hometownCityId: 'luoyang', stats: { leadership: 85, war: 75, intelligence: 92,  politics: 90, charisma: 78 } },
  { id: 'deng-ai',     name: { en: 'Deng Ai',     zh: '鄧艾'   }, courtesyName: { en: 'Shizai',    zh: '士載' }, birthYear: 197, deathYear: 264, hometownCityId: 'xinye', stats: { leadership: 92, war: 88, intelligence: 92,  politics: 78, charisma: 70 } },
  { id: 'zhong-hui',   name: { en: 'Zhong Hui',   zh: '鍾會'   }, courtesyName: { en: 'Shiji',     zh: '士季' }, birthYear: 225, deathYear: 264, hometownCityId: 'xuchang', stats: { leadership: 85, war: 75, intelligence: 92,  politics: 70, charisma: 78 } },
  { id: 'guo-huai',    name: { en: 'Guo Huai',    zh: '郭淮'   }, courtesyName: { en: 'Boji',      zh: '伯濟' }, birthYear: 187, deathYear: 255, hometownCityId: 'taiyuan', stats: { leadership: 85, war: 80, intelligence: 85,  politics: 75, charisma: 72 } },
  { id: 'wen-pin',     name: { en: 'Wen Pin',     zh: '文聘'   }, courtesyName: { en: 'Zhongye',   zh: '仲業' }, birthYear: 165, deathYear: 230, hometownCityId: 'wancheng', stats: { leadership: 82, war: 80, intelligence: 75,  politics: 70, charisma: 72 } },
  { id: 'tian-yu',     name: { en: 'Tian Yu',     zh: '田豫'   }, courtesyName: { en: 'Guorang',   zh: '國讓' }, birthYear: 171, deathYear: 252, stats: { leadership: 80, war: 72, intelligence: 78,  politics: 75, charisma: 75 } },
  { id: 'jia-xu',      name: { en: 'Jia Xu',      zh: '賈詡'   }, courtesyName: { en: 'Wenhe',     zh: '文和' }, birthYear: 147, deathYear: 223, hometownCityId: 'wuwei', stats: { leadership: 70, war: 50, intelligence: 95,  politics: 80, charisma: 70 } },
  { id: 'zhang-liao',  name: { en: 'Zhang Liao',  zh: '張遼'   }, courtesyName: { en: 'Wenyuan',   zh: '文遠' }, birthYear: 169, deathYear: 222, hometownCityId: 'yanmen', stats: { leadership: 92, war: 95, intelligence: 80,  politics: 65, charisma: 78 } },
  { id: 'xiahou-ba',   name: { en: 'Xiahou Ba',   zh: '夏侯霸' }, courtesyName: { en: 'Zhongquan', zh: '仲權' }, birthYear: 180, deathYear: 255, hometownCityId: 'xiaopei', stats: { leadership: 78, war: 82, intelligence: 70,  politics: 60, charisma: 70 } },
  { id: 'xiahou-shang',name: { en: 'Xiahou Shang',zh: '夏侯尚' }, courtesyName: { en: 'Boren',     zh: '伯仁' }, birthYear: 175, deathYear: 225, hometownCityId: 'xiaopei', stats: { leadership: 80, war: 80, intelligence: 75,  politics: 70, charisma: 75 } },

  // Sun Wu circle
  { id: 'zhou-yu',     name: { en: 'Zhou Yu',     zh: '周瑜'   }, courtesyName: { en: 'Gongjin',   zh: '公瑾' }, birthYear: 175, deathYear: 210, hometownCityId: 'lujiang', stats: { leadership: 96, war: 80, intelligence: 96,  politics: 85, charisma: 95 } },
  { id: 'lu-su',       name: { en: 'Lu Su',       zh: '魯肅'   }, courtesyName: { en: 'Zijing',    zh: '子敬' }, birthYear: 172, deathYear: 217, hometownCityId: 'xiapi', stats: { leadership: 80, war: 50, intelligence: 90,  politics: 88, charisma: 85 } },
  { id: 'lu-meng',     name: { en: 'Lu Meng',     zh: '呂蒙'   }, courtesyName: { en: 'Ziming',    zh: '子明' }, birthYear: 178, deathYear: 220, hometownCityId: 'runan', stats: { leadership: 92, war: 88, intelligence: 88,  politics: 75, charisma: 80 } },
  { id: 'lu-xun',      name: { en: 'Lu Xun',      zh: '陸遜'   }, courtesyName: { en: 'Boyan',     zh: '伯言' }, birthYear: 183, deathYear: 245, hometownCityId: 'wu', stats: { leadership: 90, war: 75, intelligence: 95,  politics: 88, charisma: 80 } },
  { id: 'gan-ning',    name: { en: 'Gan Ning',    zh: '甘寧'   }, courtesyName: { en: 'Xingba',    zh: '興霸' }, birthYear: 174, deathYear: 220, hometownCityId: 'jiangzhou', stats: { leadership: 82, war: 92, intelligence: 70,  politics: 50, charisma: 70 } },
  { id: 'taishi-ci',   name: { en: 'Taishi Ci',   zh: '太史慈' }, courtesyName: { en: 'Ziyi',      zh: '子義' }, birthYear: 166, deathYear: 206, hometownCityId: 'beihai', stats: { leadership: 82, war: 92, intelligence: 75,  politics: 60, charisma: 80 } },
  { id: 'jiang-qin',   name: { en: 'Jiang Qin',   zh: '蔣欽'   }, courtesyName: { en: 'Gongyi',    zh: '公奕' }, birthYear: 170, deathYear: 219, hometownCityId: 'shouchun', stats: { leadership: 78, war: 80, intelligence: 65,  politics: 55, charisma: 65 } },
  { id: 'zhu-ran',     name: { en: 'Zhu Ran',     zh: '朱然'   }, courtesyName: { en: 'Yifeng',    zh: '義封' }, birthYear: 182, deathYear: 249, hometownCityId: 'danyang', stats: { leadership: 85, war: 80, intelligence: 78,  politics: 70, charisma: 75 } },
  { id: 'ding-feng',   name: { en: 'Ding Feng',   zh: '丁奉'   }, courtesyName: { en: 'Chengyuan', zh: '承淵' }, birthYear: 188, deathYear: 271, hometownCityId: 'lujiang', stats: { leadership: 80, war: 85, intelligence: 72,  politics: 60, charisma: 70 } },
  { id: 'pan-zhang',   name: { en: 'Pan Zhang',   zh: '潘璋'   }, courtesyName: { en: 'Wengui',    zh: '文珪' }, birthYear: 180, deathYear: 234, stats: { leadership: 76, war: 84, intelligence: 60,  politics: 50, charisma: 60 } },
  { id: 'zhu-zhi',     name: { en: 'Zhu Zhi',     zh: '朱治'   }, courtesyName: { en: 'Junli',     zh: '君理' }, birthYear: 156, deathYear: 224, hometownCityId: 'danyang', stats: { leadership: 75, war: 70, intelligence: 75,  politics: 78, charisma: 75 } },
  { id: 'zhu-huan',    name: { en: 'Zhu Huan',    zh: '朱桓'   }, courtesyName: { en: 'Xiumu',     zh: '休穆' }, birthYear: 177, deathYear: 238, hometownCityId: 'wu', stats: { leadership: 82, war: 82, intelligence: 75,  politics: 65, charisma: 70 } },
  { id: 'zhang-zhao',  name: { en: 'Zhang Zhao',  zh: '張昭'   }, courtesyName: { en: 'Zibu',      zh: '子布' }, birthYear: 156, deathYear: 236, hometownCityId: 'pengcheng', stats: { leadership: 50, war: 30, intelligence: 88,  politics: 92, charisma: 85 } },
  { id: 'zhang-hong',  name: { en: 'Zhang Hong',  zh: '張紘'   }, courtesyName: { en: 'Zigang',    zh: '子綱' }, birthYear: 153, deathYear: 212, hometownCityId: 'guangling', stats: { leadership: 50, war: 35, intelligence: 85,  politics: 88, charisma: 80 } },
  { id: 'gu-yong',     name: { en: 'Gu Yong',     zh: '顧雍'   }, courtesyName: { en: 'Yuantan',   zh: '元嘆' }, birthYear: 168, deathYear: 243, hometownCityId: 'wu', stats: { leadership: 55, war: 30, intelligence: 85,  politics: 92, charisma: 80 } },
  { id: 'bu-zhi',      name: { en: 'Bu Zhi',      zh: '步騭'   }, courtesyName: { en: 'Zishan',    zh: '子山' }, birthYear: 174, deathYear: 247, hometownCityId: 'xiapi', stats: { leadership: 60, war: 50, intelligence: 82,  politics: 85, charisma: 75 } },
  { id: 'zhuge-jin',   name: { en: 'Zhuge Jin',   zh: '諸葛瑾' }, courtesyName: { en: 'Ziyu',      zh: '子瑜' }, birthYear: 174, deathYear: 241, hometownCityId: 'langya', stats: { leadership: 65, war: 50, intelligence: 88,  politics: 85, charisma: 82 } },
  { id: 'zhuge-ke',    name: { en: 'Zhuge Ke',    zh: '諸葛恪' }, courtesyName: { en: 'Yuanxun',   zh: '元遜' }, birthYear: 203, deathYear: 253, hometownCityId: 'langya', stats: { leadership: 75, war: 70, intelligence: 90,  politics: 75, charisma: 75 } },
  { id: 'sun-jun',     name: { en: 'Sun Jun',     zh: '孫峻'   }, courtesyName: { en: 'Ziyuan',    zh: '子遠' }, birthYear: 219, deathYear: 256, stats: { leadership: 70, war: 78, intelligence: 65,  politics: 55, charisma: 60 } },
  { id: 'sun-shao',    name: { en: 'Sun Shao',    zh: '孫韶'   }, courtesyName: { en: 'Gongli',    zh: '公禮' }, birthYear: 188, deathYear: 241, hometownCityId: 'wu', stats: { leadership: 78, war: 80, intelligence: 70,  politics: 65, charisma: 70 } },

  // Yuan Shao circle
  { id: 'ju-shou',     name: { en: 'Ju Shou',     zh: '沮授'   },                                                                                          birthYear: 152, deathYear: 200, hometownCityId: 'ye', stats: { leadership: 65, war: 35, intelligence: 92,  politics: 85, charisma: 78 } },
  { id: 'shen-pei',    name: { en: 'Shen Pei',    zh: '審配'   }, courtesyName: { en: 'Zhengnan',  zh: '正南' }, birthYear: 160, deathYear: 204, hometownCityId: 'ye', stats: { leadership: 70, war: 60, intelligence: 80,  politics: 80, charisma: 70 } },
  { id: 'guo-tu',      name: { en: 'Guo Tu',      zh: '郭圖'   }, courtesyName: { en: 'Gongze',    zh: '公則' }, birthYear: 160, deathYear: 205, hometownCityId: 'xuchang', stats: { leadership: 50, war: 35, intelligence: 78,  politics: 70, charisma: 60 } },
  { id: 'feng-ji',     name: { en: 'Feng Ji',     zh: '逢紀'   }, courtesyName: { en: 'Yuantu',    zh: '元圖' }, birthYear: 158, deathYear: 202, hometownCityId: 'ye', stats: { leadership: 50, war: 40, intelligence: 78,  politics: 75, charisma: 65 } },
  { id: 'gao-lan',     name: { en: 'Gao Lan',     zh: '高覽'   },                                                                                          birthYear: 165, deathYear: 207, hometownCityId: 'ye', stats: { leadership: 75, war: 85, intelligence: 60,  politics: 55, charisma: 65 } },
  { id: 'yuan-tan',    name: { en: 'Yuan Tan',    zh: '袁譚'   }, courtesyName: { en: 'Xiansi',    zh: '顯思' }, birthYear: 174, deathYear: 205, hometownCityId: 'runan', stats: { leadership: 65, war: 70, intelligence: 60,  politics: 55, charisma: 65 } },
  { id: 'yuan-shang',  name: { en: 'Yuan Shang',  zh: '袁尚'   }, courtesyName: { en: 'Xianfu',    zh: '顯甫' }, birthYear: 180, deathYear: 207, hometownCityId: 'runan', stats: { leadership: 60, war: 75, intelligence: 65,  politics: 50, charisma: 70 } },
  { id: 'yuan-xi',     name: { en: 'Yuan Xi',     zh: '袁熙'   }, courtesyName: { en: 'Xianyi',    zh: '顯奕' }, birthYear: 178, deathYear: 207, hometownCityId: 'runan', stats: { leadership: 55, war: 65, intelligence: 60,  politics: 50, charisma: 65 } },

  // Dong Zhuo / Lu Bu circle
  { id: 'hua-xiong',   name: { en: 'Hua Xiong',   zh: '華雄'   },                                                                                          birthYear: 165, deathYear: 191, hometownCityId: 'wuwei', stats: { leadership: 70, war: 90, intelligence: 35,  politics: 25, charisma: 50 } },
  { id: 'xu-rong',     name: { en: 'Xu Rong',     zh: '徐榮'   },                                                                                          birthYear: 162, deathYear: 192, stats: { leadership: 75, war: 84, intelligence: 70,  politics: 55, charisma: 60 } },
  { id: 'niu-fu',      name: { en: 'Niu Fu',      zh: '牛輔'   },                                                                                          birthYear: 158, deathYear: 192, stats: { leadership: 60, war: 75, intelligence: 50,  politics: 40, charisma: 50 } },
  { id: 'gao-shun',    name: { en: 'Gao Shun',    zh: '高順'   },                                                                                          birthYear: 165, deathYear: 198, hometownCityId: 'yanmen', stats: { leadership: 88, war: 88, intelligence: 70,  politics: 55, charisma: 70 } },
  { id: 'cao-xing',    name: { en: 'Cao Xing',    zh: '曹性'   },                                                                                          birthYear: 168, deathYear: 198, stats: { leadership: 60, war: 78, intelligence: 45,  politics: 35, charisma: 50 } },
  { id: 'song-xian',   name: { en: 'Song Xian',   zh: '宋憲'   },                                                                                          birthYear: 168, deathYear: 200, stats: { leadership: 55, war: 70, intelligence: 40,  politics: 35, charisma: 45 } },
  { id: 'hou-cheng',   name: { en: 'Hou Cheng',   zh: '侯成'   },                                                                                          birthYear: 168, deathYear: 200, stats: { leadership: 55, war: 70, intelligence: 40,  politics: 35, charisma: 45 } },
  { id: 'wang-yun',    name: { en: 'Wang Yun',    zh: '王允'   }, courtesyName: { en: 'Zishi',     zh: '子師' }, birthYear: 137, deathYear: 192, hometownCityId: 'taiyuan', stats: { leadership: 45, war: 30, intelligence: 85,  politics: 88, charisma: 80 } },
  { id: 'diaochan',    name: { en: 'Diaochan',    zh: '貂蟬'   },                                                                                          birthYear: 170,                  hometownCityId: 'changan', stats: { leadership: 30, war: 30, intelligence: 85,  politics: 60, charisma: 99 } },

  // Liang / Ma Teng / Han Sui
  { id: 'han-sui',     name: { en: 'Han Sui',     zh: '韓遂'   }, courtesyName: { en: 'Wenyue',    zh: '文約' }, birthYear: 142, deathYear: 215, hometownCityId: 'jincheng', stats: { leadership: 78, war: 80, intelligence: 75,  politics: 65, charisma: 75 } },
  { id: 'ma-dai',      name: { en: 'Ma Dai',      zh: '馬岱'   }, courtesyName: { en: 'Bozhan',    zh: '伯瞻' }, birthYear: 180, deathYear: 252, hometownCityId: 'mei', stats: { leadership: 80, war: 85, intelligence: 70,  politics: 60, charisma: 70 } },
  { id: 'pang-de-ye',  name: { en: 'Yan Xing',    zh: '閻行'   }, courtesyName: { en: 'Yanming',   zh: '彥明' }, birthYear: 170, deathYear: 220, stats: { leadership: 78, war: 85, intelligence: 65,  politics: 55, charisma: 65 } },
  { id: 'cheng-yi',    name: { en: 'Cheng Yi',    zh: '成宜'   },                                                                                          birthYear: 168, deathYear: 211, stats: { leadership: 65, war: 75, intelligence: 50,  politics: 40, charisma: 50 } },
  { id: 'hou-xuan',    name: { en: 'Hou Xuan',    zh: '侯選'   },                                                                                          birthYear: 168, deathYear: 215, stats: { leadership: 60, war: 72, intelligence: 50,  politics: 40, charisma: 50 } },

  // Yellow Turban / scholars / outsiders
  { id: 'zhang-jiao',  name: { en: 'Zhang Jiao',  zh: '張角'   },                                                                                          birthYear: 145, deathYear: 184, hometownCityId: 'ye', stats: { leadership: 80, war: 60, intelligence: 90,  politics: 75, charisma: 95 } },
  { id: 'zhang-bao-yt',name: { en: 'Zhang Bao',   zh: '張寶'   },                                                                                          birthYear: 150, deathYear: 184, hometownCityId: 'ye', stats: { leadership: 70, war: 75, intelligence: 70,  politics: 55, charisma: 70 } },
  { id: 'zhang-liang-yt',name:{ en: 'Zhang Liang',zh: '張梁'   },                                                                                          birthYear: 152, deathYear: 184, hometownCityId: 'ye', stats: { leadership: 65, war: 70, intelligence: 68,  politics: 50, charisma: 65 } },
  { id: 'hua-tuo',     name: { en: 'Hua Tuo',     zh: '華佗'   }, courtesyName: { en: 'Yuanhua',   zh: '元化' }, birthYear: 140, deathYear: 208, hometownCityId: 'xiaopei', stats: { leadership: 20, war: 20, intelligence: 92,  politics: 60, charisma: 88 } },
  { id: 'zhang-zhongjing',name:{en: 'Zhang Zhongjing', zh: '張仲景' }, courtesyName: { en: 'Ji', zh: '機' }, birthYear: 150, deathYear: 219, hometownCityId: 'wancheng', stats: { leadership: 20, war: 15, intelligence: 90, politics: 60, charisma: 80 } },
  { id: 'zuo-ci',      name: { en: 'Zuo Ci',      zh: '左慈'   }, courtesyName: { en: 'Yuanfang',  zh: '元放' }, birthYear: 156, deathYear: 289, stats: { leadership: 25, war: 30, intelligence: 88,  politics: 50, charisma: 95 } },
  { id: 'yu-ji',       name: { en: 'Yu Ji',       zh: '于吉'   },                                                                                          birthYear: 130, deathYear: 200, stats: { leadership: 25, war: 25, intelligence: 85,  politics: 50, charisma: 92 } },
  { id: 'lu-zhi',      name: { en: 'Lu Zhi',      zh: '盧植'   }, courtesyName: { en: 'Zigan',     zh: '子幹' }, birthYear: 139, deathYear: 192, hometownCityId: 'beiping', stats: { leadership: 78, war: 65, intelligence: 88,  politics: 85, charisma: 80 } },
  { id: 'huangfu-song',name: { en: 'Huangfu Song',zh: '皇甫嵩' }, courtesyName: { en: 'Yizhen',    zh: '義真' }, birthYear: 137, deathYear: 195, hometownCityId: 'xuchang', stats: { leadership: 85, war: 82, intelligence: 80,  politics: 78, charisma: 80 } },
  { id: 'zhu-jun',     name: { en: 'Zhu Jun',     zh: '朱儁'   }, courtesyName: { en: 'Gongwei',   zh: '公偉' }, birthYear: 135, deathYear: 195, stats: { leadership: 80, war: 78, intelligence: 75,  politics: 75, charisma: 78 } },
  { id: 'cai-yong',    name: { en: 'Cai Yong',    zh: '蔡邕'   }, courtesyName: { en: 'Bojie',     zh: '伯喈' }, birthYear: 133, deathYear: 192, stats: { leadership: 25, war: 20, intelligence: 90,  politics: 80, charisma: 85 } },
  { id: 'cai-wenji',   name: { en: 'Cai Wenji',   zh: '蔡文姬' },                                                                                          birthYear: 177, deathYear: 250, hometownCityId: 'chenliu', stats: { leadership: 20, war: 15, intelligence: 88,  politics: 60, charisma: 92 } },

  // Liu Biao / Liu Zhang region
  { id: 'kuai-liang',  name: { en: 'Kuai Liang',  zh: '蒯良'   }, courtesyName: { en: 'Zirou',     zh: '子柔' }, birthYear: 155, deathYear: 214, hometownCityId: 'xiangyang', stats: { leadership: 55, war: 50, intelligence: 85,  politics: 82, charisma: 75 } },
  { id: 'kuai-yue',    name: { en: 'Kuai Yue',    zh: '蒯越'   }, courtesyName: { en: 'Yidu',      zh: '異度' }, birthYear: 156, deathYear: 214, hometownCityId: 'xiangyang', stats: { leadership: 60, war: 55, intelligence: 85,  politics: 80, charisma: 75 } },
  { id: 'cai-mao',     name: { en: 'Cai Mao',     zh: '蔡瑁'   }, courtesyName: { en: 'Degui',     zh: '德珪' }, birthYear: 160, deathYear: 215, hometownCityId: 'xiangyang', stats: { leadership: 70, war: 65, intelligence: 70,  politics: 65, charisma: 60 } },
  { id: 'zhang-yun',   name: { en: 'Zhang Yun',   zh: '張允'   },                                                                                          birthYear: 165, deathYear: 208, hometownCityId: 'xiangyang', stats: { leadership: 60, war: 60, intelligence: 60,  politics: 55, charisma: 55 } },
  { id: 'liu-qi',      name: { en: 'Liu Qi',      zh: '劉琦'   },                                                                                          birthYear: 184, deathYear: 209, hometownCityId: 'xiangyang', stats: { leadership: 45, war: 50, intelligence: 60,  politics: 55, charisma: 70 } },
  { id: 'huang-zu',    name: { en: 'Huang Zu',    zh: '黃祖'   },                                                                                          birthYear: 145, deathYear: 208, hometownCityId: 'jiangxia', stats: { leadership: 60, war: 70, intelligence: 55,  politics: 50, charisma: 55 } },
  { id: 'zhang-ren',   name: { en: 'Zhang Ren',   zh: '張任'   },                                                                                          birthYear: 165, deathYear: 213, hometownCityId: 'chengdu', stats: { leadership: 85, war: 88, intelligence: 80,  politics: 70, charisma: 75 } },
  { id: 'yan-yan',     name: { en: 'Yan Yan',     zh: '嚴顏'   },                                                                                          birthYear: 142, deathYear: 220, hometownCityId: 'jiangzhou', stats: { leadership: 80, war: 82, intelligence: 70,  politics: 60, charisma: 75 } },
  { id: 'meng-da',     name: { en: 'Meng Da',     zh: '孟達'   }, courtesyName: { en: 'Zijing',    zh: '子敬' }, birthYear: 170, deathYear: 228, hometownCityId: 'mei', stats: { leadership: 72, war: 70, intelligence: 78,  politics: 65, charisma: 70 } },
  { id: 'wu-yi',       name: { en: 'Wu Yi',       zh: '吳懿'   }, courtesyName: { en: 'Ziyuan',    zh: '子遠' }, birthYear: 172, deathYear: 237, hometownCityId: 'chenliu', stats: { leadership: 78, war: 78, intelligence: 70,  politics: 65, charisma: 70 } },
  { id: 'wu-lan',      name: { en: 'Wu Lan',      zh: '吳蘭'   },                                                                                          birthYear: 168, deathYear: 218, hometownCityId: 'chenliu', stats: { leadership: 65, war: 72, intelligence: 55,  politics: 50, charisma: 55 } },
  { id: 'leigh-tong',  name: { en: 'Lei Tong',    zh: '雷銅'   },                                                                                          birthYear: 170, deathYear: 218, hometownCityId: 'chengdu', stats: { leadership: 60, war: 70, intelligence: 50,  politics: 45, charisma: 55 } },
  { id: 'liu-feng',    name: { en: 'Liu Feng',    zh: '劉封'   },                                                                                          birthYear: 195, deathYear: 220, hometownCityId: 'changsha', stats: { leadership: 70, war: 80, intelligence: 60,  politics: 55, charisma: 60 } },

  // ── Phase 13 additions ──
  // Cao Wei extras
  { id: 'cao-ang',     name: { en: 'Cao Ang',     zh: '曹昂'   }, courtesyName: { en: 'Zixiu',     zh: '子修' }, birthYear: 177, deathYear: 197, hometownCityId: 'xiaopei', stats: { leadership: 75, war: 70, intelligence: 75, politics: 70, charisma: 75 } },
  { id: 'cao-anmin',   name: { en: 'Cao Anmin',   zh: '曹安民' },                                                                                          birthYear: 175, deathYear: 197, stats: { leadership: 55, war: 65, intelligence: 50, politics: 45, charisma: 55 } },
  { id: 'cao-mao',     name: { en: 'Cao Mao',     zh: '曹髦'   }, courtesyName: { en: 'Yanshi',    zh: '彥士' }, birthYear: 241, deathYear: 260, hometownCityId: 'xiaopei', stats: { leadership: 50, war: 60, intelligence: 78, politics: 60, charisma: 75 } },
  { id: 'niu-jin',     name: { en: 'Niu Jin',     zh: '牛金'   },                                                                                          birthYear: 165, deathYear: 251, stats: { leadership: 72, war: 75, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'yue-chen',    name: { en: 'Yue Chen',    zh: '樂綝'   }, courtesyName: { en: 'Wenzai',    zh: '文載' }, birthYear: 200, deathYear: 257, stats: { leadership: 75, war: 78, intelligence: 65, politics: 60, charisma: 65 } },
  { id: 'du-yu',       name: { en: 'Du Yu',       zh: '杜預'   }, courtesyName: { en: 'Yuankai',   zh: '元凱' }, birthYear: 222, deathYear: 285, hometownCityId: 'changan', stats: { leadership: 85, war: 75, intelligence: 92, politics: 88, charisma: 80 } },
  { id: 'wang-jun',    name: { en: 'Wang Jun',    zh: '王濬'   }, courtesyName: { en: 'Shizhi',    zh: '士治' }, birthYear: 206, deathYear: 286, stats: { leadership: 82, war: 80, intelligence: 80, politics: 75, charisma: 75 } },
  { id: 'jia-chong',   name: { en: 'Jia Chong',   zh: '賈充'   }, courtesyName: { en: 'Gonglu',    zh: '公閭' }, birthYear: 217, deathYear: 282, hometownCityId: 'puyang', stats: { leadership: 55, war: 50, intelligence: 80, politics: 85, charisma: 70 } },

  // Cao early enemies who joined
  { id: 'zhang-xiu',   name: { en: 'Zhang Xiu',   zh: '張繡'   },                                                                                          birthYear: 165, deathYear: 207, hometownCityId: 'wuwei', stats: { leadership: 78, war: 85, intelligence: 65, politics: 55, charisma: 65 } },
  { id: 'hu-cheer',    name: { en: "Hu Che'er",   zh: '胡車兒' },                                                                                          birthYear: 168, deathYear: 210, stats: { leadership: 50, war: 78, intelligence: 40, politics: 30, charisma: 45 } },
  { id: 'bao-xin',     name: { en: 'Bao Xin',     zh: '鮑信'   }, courtesyName: { en: 'Yunlu',     zh: '允祿' }, birthYear: 152, deathYear: 192, stats: { leadership: 70, war: 70, intelligence: 75, politics: 70, charisma: 75 } },
  { id: 'cao-bao',     name: { en: 'Cao Bao',     zh: '曹豹'   },                                                                                          birthYear: 158, deathYear: 196, hometownCityId: 'danyang', stats: { leadership: 55, war: 65, intelligence: 50, politics: 45, charisma: 50 } },

  // Liu Bei extras
  { id: 'mi-fang',     name: { en: 'Mi Fang',     zh: '麋芳'   }, courtesyName: { en: 'Zifang',    zh: '子方' }, birthYear: 170, deathYear: 226, hometownCityId: 'xiapi', stats: { leadership: 55, war: 60, intelligence: 60, politics: 65, charisma: 60 } },
  { id: 'fu-shi-ren',  name: { en: 'Fu Shiren',   zh: '傅士仁' },                                                                                          birthYear: 175, deathYear: 222, hometownCityId: 'xiapi', stats: { leadership: 55, war: 65, intelligence: 50, politics: 50, charisma: 55 } },
  { id: 'lady-sun',    name: { en: 'Lady Sun',    zh: '孫尚香' },                                                                                          birthYear: 190, deathYear: 220, hometownCityId: 'wu', stats: { leadership: 60, war: 78, intelligence: 70, politics: 60, charisma: 92 } },

  // Liu Biao region governors
  { id: 'han-xuan',    name: { en: 'Han Xuan',    zh: '韓玄'   },                                                                                          birthYear: 158, deathYear: 209, hometownCityId: 'changsha', stats: { leadership: 50, war: 60, intelligence: 55, politics: 60, charisma: 55 } },
  { id: 'liu-du',      name: { en: 'Liu Du',      zh: '劉度'   },                                                                                          birthYear: 156, deathYear: 215, hometownCityId: 'lingling', stats: { leadership: 40, war: 50, intelligence: 50, politics: 55, charisma: 55 } },
  { id: 'zhao-fan',    name: { en: 'Zhao Fan',    zh: '趙範'   },                                                                                          birthYear: 162, deathYear: 215, hometownCityId: 'guiyang', stats: { leadership: 45, war: 55, intelligence: 55, politics: 60, charisma: 60 } },
  { id: 'jin-xuan',    name: { en: 'Jin Xuan',    zh: '金旋'   }, courtesyName: { en: 'Yuanji',    zh: '元機' }, birthYear: 156, deathYear: 209, hometownCityId: 'wuling', stats: { leadership: 50, war: 65, intelligence: 50, politics: 55, charisma: 55 } },

  // Sun extras
  { id: 'sun-yi',      name: { en: 'Sun Yi',      zh: '孫翊'   }, courtesyName: { en: 'Shubi',     zh: '叔弼' }, birthYear: 184, deathYear: 204, hometownCityId: 'wu', stats: { leadership: 78, war: 85, intelligence: 68, politics: 60, charisma: 75 } },
  { id: 'sun-kuang',   name: { en: 'Sun Kuang',   zh: '孫匡'   }, courtesyName: { en: 'Jizou',     zh: '季佐' }, birthYear: 186, deathYear: 205, hometownCityId: 'wu', stats: { leadership: 60, war: 70, intelligence: 65, politics: 55, charisma: 70 } },
  { id: 'da-qiao',     name: { en: 'Da Qiao',     zh: '大喬'   },                                                                                          birthYear: 178, deathYear: 222, hometownCityId: 'lujiang', stats: { leadership: 25, war: 20, intelligence: 75, politics: 55, charisma: 95 } },
  { id: 'xiao-qiao',   name: { en: 'Xiao Qiao',   zh: '小喬'   },                                                                                          birthYear: 180, deathYear: 222, hometownCityId: 'lujiang', stats: { leadership: 25, war: 20, intelligence: 78, politics: 55, charisma: 95 } },
  { id: 'pan-jun',     name: { en: 'Pan Jun',     zh: '潘濬'   }, courtesyName: { en: 'Chengming', zh: '承明' }, birthYear: 175, deathYear: 239, hometownCityId: 'wuling', stats: { leadership: 70, war: 60, intelligence: 82, politics: 80, charisma: 70 } },
  { id: 'lu-kang',     name: { en: 'Lu Kang',     zh: '陸抗'   }, courtesyName: { en: 'Youjie',    zh: '幼節' }, birthYear: 226, deathYear: 274, hometownCityId: 'wu', stats: { leadership: 92, war: 80, intelligence: 92, politics: 85, charisma: 80 } },

  // Various warlords / scholars
  { id: 'yan-baihu',   name: { en: 'Yan Baihu',   zh: '嚴白虎' },                                                                                          birthYear: 158, deathYear: 196, hometownCityId: 'wu', stats: { leadership: 55, war: 70, intelligence: 50, politics: 45, charisma: 50 } },
  { id: 'wang-yi',     name: { en: 'Wang Yi',     zh: '王異'   },                                                                                          birthYear: 178, deathYear: 230, stats: { leadership: 70, war: 75, intelligence: 78, politics: 70, charisma: 85 } },
  { id: 'fu-wan',      name: { en: 'Fu Wan',      zh: '伏完'   },                                                                                          birthYear: 145, deathYear: 209, stats: { leadership: 30, war: 25, intelligence: 70, politics: 78, charisma: 70 } },
  { id: 'lady-bian',   name: { en: 'Lady Bian',   zh: '卞夫人' },                                                                                          birthYear: 161, deathYear: 230, hometownCityId: 'xiaopei', stats: { leadership: 30, war: 25, intelligence: 78, politics: 75, charisma: 88 } },
  { id: 'lady-gan',    name: { en: 'Lady Gan',    zh: '甘夫人' },                                                                                          birthYear: 175, deathYear: 209, hometownCityId: 'xiaopei', stats: { leadership: 25, war: 20, intelligence: 65, politics: 60, charisma: 88 } },

  // ── Phase 14 additions: deep bench ──
  // Wei deep bench
  { id: 'han-hao',     name: { en: 'Han Hao',     zh: '韓浩'   }, courtesyName: { en: 'Yuansi',    zh: '元嗣' }, birthYear: 160, deathYear: 217, stats: { leadership: 75, war: 75, intelligence: 70, politics: 75, charisma: 70 } },
  { id: 'shi-huan',    name: { en: 'Shi Huan',    zh: '史渙'   }, courtesyName: { en: 'Gongliu',   zh: '公劉' }, birthYear: 165, deathYear: 209, stats: { leadership: 72, war: 75, intelligence: 65, politics: 60, charisma: 65 } },
  { id: 'yang-hu',     name: { en: 'Yang Hu',     zh: '羊祜'   }, courtesyName: { en: 'Shuzi',     zh: '叔子' }, birthYear: 221, deathYear: 278, stats: { leadership: 88, war: 75, intelligence: 92, politics: 90, charisma: 85 } },
  { id: 'hu-zhi',      name: { en: 'Hu Zhi',      zh: '胡質'   }, courtesyName: { en: 'Wende',     zh: '文德' }, birthYear: 178, deathYear: 250, stats: { leadership: 70, war: 60, intelligence: 80, politics: 82, charisma: 75 } },
  { id: 'jia-kui',     name: { en: 'Jia Kui',     zh: '賈逵'   }, courtesyName: { en: 'Liangdao',  zh: '梁道' }, birthYear: 174, deathYear: 228, hometownCityId: 'puyang', stats: { leadership: 75, war: 65, intelligence: 80, politics: 80, charisma: 75 } },
  { id: 'yang-fu',     name: { en: 'Yang Fu',     zh: '楊阜'   }, courtesyName: { en: 'Yishan',    zh: '義山' }, birthYear: 170, deathYear: 244, hometownCityId: 'tianshui', stats: { leadership: 65, war: 50, intelligence: 82, politics: 82, charisma: 75 } },
  { id: 'cao-rui',     name: { en: 'Cao Rui',     zh: '曹叡'   }, courtesyName: { en: 'Yuanzhong', zh: '元仲' }, birthYear: 204, deathYear: 239, hometownCityId: 'xiaopei', stats: { leadership: 70, war: 65, intelligence: 82, politics: 85, charisma: 78 } },
  { id: 'cao-shuang',  name: { en: 'Cao Shuang',  zh: '曹爽'   }, courtesyName: { en: 'Zhaobo',    zh: '昭伯' }, birthYear: 200, deathYear: 249, hometownCityId: 'xiaopei', stats: { leadership: 55, war: 60, intelligence: 50, politics: 60, charisma: 65 } },
  { id: 'chen-tai',    name: { en: 'Chen Tai',    zh: '陳泰'   }, courtesyName: { en: 'Xuanbo',    zh: '玄伯' }, birthYear: 200, deathYear: 260, hometownCityId: 'xuchang', stats: { leadership: 80, war: 75, intelligence: 85, politics: 80, charisma: 75 } },

  // Wu deep bench
  { id: 'quan-cong',   name: { en: 'Quan Cong',   zh: '全琮'   }, courtesyName: { en: 'Zihuang',   zh: '子璜' }, birthYear: 198, deathYear: 249, hometownCityId: 'wu', stats: { leadership: 82, war: 78, intelligence: 80, politics: 75, charisma: 78 } },
  { id: 'he-qi',       name: { en: 'He Qi',       zh: '賀齊'   }, courtesyName: { en: 'Gongmiao',  zh: '公苗' }, birthYear: 175, deathYear: 227, hometownCityId: 'kuaiji', stats: { leadership: 82, war: 80, intelligence: 75, politics: 70, charisma: 75 } },
  { id: 'lu-dai',      name: { en: 'Lu Dai',      zh: '呂岱'   }, courtesyName: { en: 'Dinggong',  zh: '定公' }, birthYear: 161, deathYear: 256, hometownCityId: 'guangling', stats: { leadership: 80, war: 75, intelligence: 78, politics: 78, charisma: 75 } },
  { id: 'zhuge-dan',   name: { en: 'Zhuge Dan',   zh: '諸葛誕' }, courtesyName: { en: 'Gongxiu',   zh: '公休' }, birthYear: 200, deathYear: 258, hometownCityId: 'langya', stats: { leadership: 78, war: 75, intelligence: 82, politics: 75, charisma: 75 } },
  { id: 'pan-lin',     name: { en: 'Pan Lin',     zh: '潘臨'   },                                                                                          birthYear: 195, deathYear: 234, stats: { leadership: 70, war: 75, intelligence: 65, politics: 60, charisma: 65 } },

  // Shu late-game pillars
  { id: 'deng-zhi',    name: { en: 'Deng Zhi',    zh: '鄧芝'   }, courtesyName: { en: 'Bomiao',    zh: '伯苗' }, birthYear: 178, deathYear: 251, hometownCityId: 'wancheng', stats: { leadership: 80, war: 75, intelligence: 85, politics: 82, charisma: 85 } },
  { id: 'fei-yi',      name: { en: 'Fei Yi',      zh: '費禕'   }, courtesyName: { en: 'Wenwei',    zh: '文偉' }, birthYear: 195, deathYear: 253, hometownCityId: 'jiangxia', stats: { leadership: 70, war: 55, intelligence: 88, politics: 92, charisma: 85 } },
  { id: 'jiang-wan',   name: { en: 'Jiang Wan',   zh: '蔣琬'   }, courtesyName: { en: 'Gongyan',   zh: '公琰' }, birthYear: 178, deathYear: 246, hometownCityId: 'lingling', stats: { leadership: 75, war: 60, intelligence: 88, politics: 92, charisma: 85 } },
  { id: 'dong-yun',    name: { en: 'Dong Yun',    zh: '董允'   }, courtesyName: { en: 'Xiuzhao',   zh: '休昭' }, birthYear: 196, deathYear: 246, hometownCityId: 'jiangling', stats: { leadership: 50, war: 40, intelligence: 80, politics: 85, charisma: 78 } },
  { id: 'wang-ping',   name: { en: 'Wang Ping',   zh: '王平'   }, courtesyName: { en: 'Zijun',     zh: '子均' }, birthYear: 179, deathYear: 248, hometownCityId: 'baxi', stats: { leadership: 85, war: 82, intelligence: 75, politics: 65, charisma: 72 } },
  { id: 'ma-zhong',    name: { en: 'Ma Zhong',    zh: '馬忠'   }, courtesyName: { en: 'Dexin',     zh: '德信' }, birthYear: 185, deathYear: 249, hometownCityId: 'baxi', stats: { leadership: 80, war: 78, intelligence: 75, politics: 75, charisma: 75 } },
  { id: 'zhang-yi',    name: { en: 'Zhang Yi',    zh: '張嶷'   }, courtesyName: { en: 'Boqi',      zh: '伯岐' }, birthYear: 195, deathYear: 254, hometownCityId: 'baxi', stats: { leadership: 80, war: 78, intelligence: 78, politics: 70, charisma: 75 } },
  { id: 'zhou-cang',   name: { en: 'Zhou Cang',   zh: '周倉'   },                                                                                          birthYear: 168, deathYear: 219, hometownCityId: 'wancheng', stats: { leadership: 72, war: 80, intelligence: 50, politics: 40, charisma: 60 } },
  { id: 'wu-ban',      name: { en: 'Wu Ban',      zh: '吳班'   }, courtesyName: { en: 'Yuanxiong', zh: '元雄' }, birthYear: 175, deathYear: 235, hometownCityId: 'chenliu', stats: { leadership: 70, war: 75, intelligence: 65, politics: 60, charisma: 68 } },
  { id: 'liao-li',     name: { en: 'Liao Li',     zh: '廖立'   }, courtesyName: { en: 'Gongyuan',  zh: '公淵' }, birthYear: 180, deathYear: 245, hometownCityId: 'wuling', stats: { leadership: 50, war: 45, intelligence: 80, politics: 70, charisma: 65 } },

  // Various / misc
  { id: 'mi-heng',     name: { en: 'Mi Heng',     zh: '禰衡'   }, courtesyName: { en: 'Zhengping', zh: '正平' }, birthYear: 173, deathYear: 198, hometownCityId: 'pingyuan', stats: { leadership: 25, war: 30, intelligence: 92, politics: 50, charisma: 75 } },
  { id: 'liu-yao',     name: { en: 'Liu Yao',     zh: '劉繇'   }, courtesyName: { en: 'Zhengli',   zh: '正禮' }, birthYear: 156, deathYear: 198, hometownCityId: 'beihai', stats: { leadership: 60, war: 55, intelligence: 70, politics: 70, charisma: 75 } },
  { id: 'liu-yu',      name: { en: 'Liu Yu',      zh: '劉虞'   }, courtesyName: { en: "Bo'an",     zh: '伯安' }, birthYear: 142, deathYear: 193, hometownCityId: 'xiapi', stats: { leadership: 55, war: 45, intelligence: 80, politics: 88, charisma: 88 } },
  { id: 'tian-kai',    name: { en: 'Tian Kai',    zh: '田楷'   },                                                                                          birthYear: 158, deathYear: 199, stats: { leadership: 65, war: 70, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'sun-hao',     name: { en: 'Sun Hao',     zh: '孫皓'   }, courtesyName: { en: 'Yuanzong',  zh: '元宗' }, birthYear: 242, deathYear: 284, hometownCityId: 'wu', stats: { leadership: 40, war: 55, intelligence: 60, politics: 50, charisma: 50 } },
  { id: 'wang-su',     name: { en: 'Wang Su',     zh: '王肅'   }, courtesyName: { en: 'Ziyong',    zh: '子雍' }, birthYear: 195, deathYear: 256, stats: { leadership: 45, war: 30, intelligence: 85, politics: 85, charisma: 75 } },

  // ── Phase 15: closing the gap to ~240 officers ──
  // Wei
  { id: 'liu-fang',    name: { en: 'Liu Fang',    zh: '劉放'   }, courtesyName: { en: 'Zigi',      zh: '子棄' }, birthYear: 175, deathYear: 250, stats: { leadership: 45, war: 35, intelligence: 80, politics: 82, charisma: 72 } },
  { id: 'sun-zi',      name: { en: 'Sun Zi',      zh: '孫資'   }, courtesyName: { en: 'Yanlong',   zh: '彥龍' }, birthYear: 178, deathYear: 251, stats: { leadership: 50, war: 40, intelligence: 80, politics: 82, charisma: 75 } },
  { id: 'wang-ling',   name: { en: 'Wang Ling',   zh: '王凌'   }, courtesyName: { en: 'Yanyun',    zh: '彥雲' }, birthYear: 172, deathYear: 251, hometownCityId: 'taiyuan', stats: { leadership: 75, war: 75, intelligence: 75, politics: 70, charisma: 70 } },
  { id: 'guanqiu-jian',name: { en: 'Guanqiu Jian',zh: '毌丘儉' }, courtesyName: { en: 'Zhonggong', zh: '仲恭' }, birthYear: 195, deathYear: 255, stats: { leadership: 80, war: 78, intelligence: 78, politics: 70, charisma: 72 } },
  { id: 'xi-zhicai',   name: { en: 'Xi Zhicai',   zh: '戲志才' },                                                                                          birthYear: 153, deathYear: 196, hometownCityId: 'xuchang', stats: { leadership: 50, war: 35, intelligence: 92, politics: 75, charisma: 72 } },
  { id: 'lou-gui',     name: { en: 'Lou Gui',     zh: '婁圭'   }, courtesyName: { en: 'Zibo',      zh: '子伯' }, birthYear: 155, deathYear: 213, stats: { leadership: 55, war: 50, intelligence: 82, politics: 70, charisma: 70 } },
  { id: 'sima-yan',    name: { en: 'Sima Yan',    zh: '司馬炎' }, courtesyName: { en: 'Anshi',     zh: '安世' }, birthYear: 236, deathYear: 290, hometownCityId: 'luoyang', stats: { leadership: 75, war: 65, intelligence: 80, politics: 85, charisma: 80 } },
  { id: 'wang-xiang',  name: { en: 'Wang Xiang',  zh: '王祥'   }, courtesyName: { en: 'Xiuzheng',  zh: '休徵' }, birthYear: 184, deathYear: 268, stats: { leadership: 40, war: 30, intelligence: 75, politics: 80, charisma: 80 } },
  { id: 'liu-xie',     name: { en: 'Liu Xie',     zh: '劉協'   }, courtesyName: { en: 'Bohe',      zh: '伯和' }, birthYear: 181, deathYear: 234, hometownCityId: 'luoyang', stats: { leadership: 50, war: 30, intelligence: 65, politics: 60, charisma: 80 } },
  { id: 'he-jin',      name: { en: 'He Jin',      zh: '何進'   }, courtesyName: { en: 'Suigao',    zh: '遂高' }, birthYear: 140, deathYear: 189, hometownCityId: 'wancheng', stats: { leadership: 55, war: 60, intelligence: 45, politics: 50, charisma: 65 } },

  // Wu
  { id: 'yu-fan',      name: { en: 'Yu Fan',      zh: '虞翻'   }, courtesyName: { en: 'Zhongxiang',zh: '仲翔' }, birthYear: 164, deathYear: 233, hometownCityId: 'kuaiji', stats: { leadership: 50, war: 50, intelligence: 88, politics: 75, charisma: 70 } },
  { id: 'hu-zong',     name: { en: 'Hu Zong',     zh: '胡綜'   }, courtesyName: { en: 'Weize',     zh: '偉則' }, birthYear: 183, deathYear: 243, stats: { leadership: 55, war: 50, intelligence: 80, politics: 78, charisma: 75 } },
  { id: 'chen-wu',     name: { en: 'Chen Wu',     zh: '陳武'   }, courtesyName: { en: 'Zilie',     zh: '子烈' }, birthYear: 178, deathYear: 215, stats: { leadership: 80, war: 84, intelligence: 65, politics: 55, charisma: 70 } },
  { id: 'dong-xi',     name: { en: 'Dong Xi',     zh: '董襲'   }, courtesyName: { en: 'Yuandai',   zh: '元代' }, birthYear: 178, deathYear: 213, hometownCityId: 'kuaiji', stats: { leadership: 78, war: 82, intelligence: 65, politics: 55, charisma: 68 } },
  { id: 'lu-fan',      name: { en: 'Lü Fan',      zh: '呂範'   }, courtesyName: { en: 'Ziheng',    zh: '子衡' }, birthYear: 170, deathYear: 228, hometownCityId: 'runan', stats: { leadership: 75, war: 70, intelligence: 78, politics: 75, charisma: 75 } },
  { id: 'su-fei',      name: { en: 'Su Fei',      zh: '蘇飛'   },                                                                                          birthYear: 170, deathYear: 215, hometownCityId: 'jiangxia', stats: { leadership: 70, war: 78, intelligence: 65, politics: 55, charisma: 68 } },
  { id: 'quan-yi',     name: { en: 'Quan Yi',     zh: '全懌'   },                                                                                          birthYear: 220, deathYear: 257, stats: { leadership: 70, war: 72, intelligence: 65, politics: 60, charisma: 65 } },

  // Shu
  { id: 'liu-ba',      name: { en: 'Liu Ba',      zh: '劉巴'   }, courtesyName: { en: 'Zichu',     zh: '子初' }, birthYear: 176, deathYear: 222, hometownCityId: 'lingling', stats: { leadership: 40, war: 30, intelligence: 88, politics: 95, charisma: 70 } },
  { id: 'huo-yi',      name: { en: 'Huo Yi',      zh: '霍弋'   }, courtesyName: { en: 'Shaoxian',  zh: '紹先' }, birthYear: 205, deathYear: 270, hometownCityId: 'jiangling', stats: { leadership: 78, war: 75, intelligence: 78, politics: 72, charisma: 75 } },
  { id: 'luo-xian',    name: { en: 'Luo Xian',    zh: '羅憲'   }, courtesyName: { en: 'Lingze',    zh: '令則' }, birthYear: 218, deathYear: 270, hometownCityId: 'xiangyang', stats: { leadership: 82, war: 80, intelligence: 75, politics: 70, charisma: 72 } },
  { id: 'yang-hong',   name: { en: 'Yang Hong',   zh: '楊洪'   }, courtesyName: { en: 'Jixiu',     zh: '季休' }, birthYear: 170, deathYear: 229, hometownCityId: 'chengdu', stats: { leadership: 55, war: 45, intelligence: 78, politics: 82, charisma: 75 } },
  { id: 'fan-jian',    name: { en: 'Fan Jian',    zh: '樊建'   }, courtesyName: { en: 'Changyuan', zh: '長元' }, birthYear: 200, deathYear: 270, stats: { leadership: 45, war: 40, intelligence: 75, politics: 78, charisma: 72 } },
  { id: 'dong-jue',    name: { en: 'Dong Jue',    zh: '董厥'   }, courtesyName: { en: 'Gongxi',    zh: '龔襲' }, birthYear: 195, deathYear: 263, stats: { leadership: 55, war: 45, intelligence: 78, politics: 78, charisma: 72 } },
  { id: 'yang-yi',     name: { en: 'Yang Yi',     zh: '楊儀'   }, courtesyName: { en: 'Weigong',   zh: '威公' }, birthYear: 180, deathYear: 235, hometownCityId: 'xiangyang', stats: { leadership: 50, war: 40, intelligence: 80, politics: 78, charisma: 60 } },
  { id: 'li-yan',      name: { en: 'Li Yan',      zh: '李嚴'   }, courtesyName: { en: 'Zhengfang', zh: '正方' }, birthYear: 170, deathYear: 234, hometownCityId: 'wancheng', stats: { leadership: 75, war: 70, intelligence: 78, politics: 75, charisma: 70 } },
  { id: 'lady-mi',     name: { en: 'Lady Mi',     zh: '糜夫人' },                                                                                          birthYear: 175, deathYear: 208, hometownCityId: 'xiapi', stats: { leadership: 25, war: 20, intelligence: 65, politics: 60, charisma: 85 } },
  { id: 'pang-hui',    name: { en: 'Pang Hui',    zh: '龐會'   },                                                                                          birthYear: 195, deathYear: 263, stats: { leadership: 78, war: 85, intelligence: 65, politics: 55, charisma: 68 } },

  // Yellow Turban remnants / minor warlords
  { id: 'pei-yuanshao',name: { en: 'Pei Yuanshao',zh: '裴元紹' },                                                                                          birthYear: 162, deathYear: 200, stats: { leadership: 55, war: 70, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'liu-pi',      name: { en: 'Liu Pi',      zh: '劉辟'   },                                                                                          birthYear: 160, deathYear: 201, stats: { leadership: 50, war: 65, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'gong-du',     name: { en: 'Gong Du',     zh: '龔都'   },                                                                                          birthYear: 158, deathYear: 201, stats: { leadership: 50, war: 65, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'liang-xing',  name: { en: 'Liang Xing',  zh: '梁興'   },                                                                                          birthYear: 165, deathYear: 212, stats: { leadership: 55, war: 70, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'yang-qiu',    name: { en: 'Yang Qiu',    zh: '楊秋'   },                                                                                          birthYear: 165, deathYear: 215, stats: { leadership: 55, war: 65, intelligence: 50, politics: 45, charisma: 55 } },
  { id: 'lu-kuang',    name: { en: 'Lü Kuang',    zh: '呂曠'   },                                                                                          birthYear: 168, deathYear: 207, hometownCityId: 'ye', stats: { leadership: 55, war: 70, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'lu-xiang',    name: { en: 'Lü Xiang',    zh: '呂翔'   },                                                                                          birthYear: 168, deathYear: 207, hometownCityId: 'ye', stats: { leadership: 55, war: 70, intelligence: 48, politics: 40, charisma: 55 } },
  { id: 'bo-cai',      name: { en: 'Bo Cai',      zh: '波才'   },                                                                                          birthYear: 150, deathYear: 184, hometownCityId: 'runan', stats: { leadership: 70, war: 75, intelligence: 65, politics: 55, charisma: 60 } },
  { id: 'zhang-mancheng',name:{ en: 'Zhang Mancheng', zh: '張曼成' },                                                                                       birthYear: 145, deathYear: 184, hometownCityId: 'chenliu', stats: { leadership: 60, war: 70, intelligence: 55, politics: 50, charisma: 58 } },

  // Han / Misc
  { id: 'yang-biao',   name: { en: 'Yang Biao',   zh: '楊彪'   }, courtesyName: { en: 'Wenxian',   zh: '文先' }, birthYear: 142, deathYear: 225, stats: { leadership: 40, war: 30, intelligence: 80, politics: 85, charisma: 80 } },
  { id: 'sima-hui',    name: { en: 'Sima Hui',    zh: '司馬徽' }, courtesyName: { en: 'Decao',     zh: '德操' }, birthYear: 145, deathYear: 208, hometownCityId: 'xiangyang', stats: { leadership: 25, war: 20, intelligence: 92, politics: 70, charisma: 88 } },
  { id: 'chen-deng',   name: { en: 'Chen Deng',   zh: '陳登'   }, courtesyName: { en: 'Yuanlong',  zh: '元龍' }, birthYear: 168, deathYear: 207, hometownCityId: 'xiapi', stats: { leadership: 75, war: 70, intelligence: 88, politics: 82, charisma: 80 } },
  { id: 'xu-shao',     name: { en: 'Xu Shao',     zh: '許劭'   }, courtesyName: { en: 'Zijiang',   zh: '子將' }, birthYear: 150, deathYear: 195, stats: { leadership: 30, war: 25, intelligence: 85, politics: 75, charisma: 85 } },

  // ── Phase 16 additions: rounding out the roster ──
  { id: 'han-fu',      name: { en: 'Han Fu',      zh: '韓馥'   }, courtesyName: { en: 'Wenjie',    zh: '文節' }, birthYear: 150, deathYear: 191, hometownCityId: 'xuchang', stats: { leadership: 45, war: 40, intelligence: 65, politics: 70, charisma: 60 } },
  { id: 'chen-zhen',   name: { en: 'Chen Zhen',   zh: '陳震'   }, courtesyName: { en: 'Xiaoqi',    zh: '孝起' }, birthYear: 175, deathYear: 235, stats: { leadership: 45, war: 35, intelligence: 78, politics: 82, charisma: 80 } },
  { id: 'zhang-wen',   name: { en: 'Zhang Wen',   zh: '張溫'   }, courtesyName: { en: 'Huishu',    zh: '惠恕' }, birthYear: 193, deathYear: 230, stats: { leadership: 50, war: 40, intelligence: 80, politics: 82, charisma: 82 } },
  { id: 'wang-bi',     name: { en: 'Wang Bi',     zh: '王必'   },                                                                                          birthYear: 165, deathYear: 218, stats: { leadership: 55, war: 50, intelligence: 70, politics: 75, charisma: 65 } },
  { id: 'cao-yu',      name: { en: 'Cao Yu',      zh: '曹宇'   }, courtesyName: { en: 'Pengzu',    zh: '彭祖' }, birthYear: 198, deathYear: 278, hometownCityId: 'xiaopei', stats: { leadership: 55, war: 55, intelligence: 70, politics: 75, charisma: 75 } },
  { id: 'meng-huo',    name: { en: 'Meng Huo',    zh: '孟獲'   },                                                                                          birthYear: 190, deathYear: 260, hometownCityId: 'nanzhong', stats: { leadership: 75, war: 85, intelligence: 50, politics: 60, charisma: 88 } },
  { id: 'zhu-rong',    name: { en: 'Zhu Rong',    zh: '祝融'   },                                                                                          birthYear: 195, deathYear: 260, hometownCityId: 'nanzhong', stats: { leadership: 70, war: 88, intelligence: 50, politics: 50, charisma: 85 } },
  { id: 'yang-feng',   name: { en: 'Yang Feng',   zh: '楊奉'   },                                                                                          birthYear: 160, deathYear: 197, hometownCityId: 'anding', stats: { leadership: 60, war: 70, intelligence: 55, politics: 50, charisma: 60 } },
  { id: 'han-xian',    name: { en: 'Han Xian',    zh: '韓暹'   },                                                                                          birthYear: 160, deathYear: 197, hometownCityId: 'anding', stats: { leadership: 55, war: 65, intelligence: 50, politics: 45, charisma: 55 } },
  { id: 'chen-jiao',   name: { en: 'Chen Jiao',   zh: '陳矯'   }, courtesyName: { en: 'Jibi',      zh: '季弼' }, birthYear: 170, deathYear: 237, stats: { leadership: 55, war: 45, intelligence: 80, politics: 82, charisma: 75 } },
  { id: 'du-xi',       name: { en: 'Du Xi',       zh: '杜襲'   }, courtesyName: { en: 'Zixu',      zh: '子緒' }, birthYear: 168, deathYear: 224, stats: { leadership: 55, war: 50, intelligence: 80, politics: 80, charisma: 75 } },
  { id: 'zhao-yan',    name: { en: 'Zhao Yan',    zh: '趙儼'   }, courtesyName: { en: 'Boran',     zh: '伯然' }, birthYear: 171, deathYear: 245, stats: { leadership: 65, war: 55, intelligence: 80, politics: 80, charisma: 78 } },
  { id: 'sun-lin',     name: { en: 'Sun Lin',     zh: '孫綝'   }, courtesyName: { en: 'Zitong',    zh: '子通' }, birthYear: 231, deathYear: 258, stats: { leadership: 55, war: 70, intelligence: 60, politics: 50, charisma: 55 } },
  { id: 'liu-yong',    name: { en: 'Liu Yong',    zh: '劉永'   }, courtesyName: { en: 'Gongshou',  zh: '公壽' }, birthYear: 210, deathYear: 264, hometownCityId: 'chengdu', stats: { leadership: 35, war: 30, intelligence: 55, politics: 50, charisma: 60 } },

  // ── Phase 17 additions: frontier warlords for Gathering of Heroes ──
  { id: 'gongsun-du',  name: { en: 'Gongsun Du',  zh: '公孫度' }, courtesyName: { en: 'Shengji',   zh: '升濟' }, birthYear: 150, deathYear: 204, hometownCityId: 'liaodong', stats: { leadership: 72, war: 78, intelligence: 70, politics: 72, charisma: 75 } },
  { id: 'gongsun-kang',name: { en: 'Gongsun Kang',zh: '公孫康' },                                                                                          birthYear: 175, deathYear: 221, hometownCityId: 'liaodong', stats: { leadership: 75, war: 78, intelligence: 72, politics: 70, charisma: 72 } },
  { id: 'zhang-lu',    name: { en: 'Zhang Lu',    zh: '張魯'   }, courtesyName: { en: 'Gongqi',    zh: '公祺' }, birthYear: 155, deathYear: 216, stats: { leadership: 60, war: 60, intelligence: 70, politics: 70, charisma: 85 } },
  { id: 'yang-song',   name: { en: 'Yang Song',   zh: '楊松'   },                                                                                          birthYear: 158, deathYear: 215, stats: { leadership: 40, war: 35, intelligence: 65, politics: 55, charisma: 45 } },
  { id: 'shi-xie',     name: { en: 'Shi Xie',     zh: '士燮'   }, courtesyName: { en: 'Weiyan',    zh: '威彥' }, birthYear: 137, deathYear: 226, stats: { leadership: 65, war: 50, intelligence: 78, politics: 82, charisma: 80 } },

  // ── Phase 18 additions ──
  // Nanman tribes (Meng Huo allies)
  { id: 'mu-lu',       name: { en: 'Mu Lu',       zh: '木鹿大王' },                                                                                        birthYear: 180, deathYear: 230, stats: { leadership: 70, war: 80, intelligence: 60, politics: 40, charisma: 70 } },
  { id: 'duosi',       name: { en: 'Duosi',       zh: '朵思大王' },                                                                                        birthYear: 185, deathYear: 230, stats: { leadership: 68, war: 72, intelligence: 75, politics: 45, charisma: 65 } },
  { id: 'daolaidong',  name: { en: 'Daolaidong',  zh: '帶來洞主' },                                                                                        birthYear: 190, deathYear: 225, stats: { leadership: 60, war: 75, intelligence: 40, politics: 30, charisma: 55 } },

  // Wei extras
  { id: 'chen-lin',    name: { en: 'Chen Lin',    zh: '陳琳'   }, courtesyName: { en: 'Kongzhang', zh: '孔璋' }, birthYear: 160, deathYear: 217, hometownCityId: 'guangling', stats: { leadership: 30, war: 25, intelligence: 88, politics: 75, charisma: 80 } },
  { id: 'ruan-yu',     name: { en: 'Ruan Yu',     zh: '阮瑀'   }, courtesyName: { en: 'Yuanyu',    zh: '元瑜' }, birthYear: 165, deathYear: 212, stats: { leadership: 25, war: 20, intelligence: 82, politics: 70, charisma: 80 } },
  { id: 'wang-can',    name: { en: 'Wang Can',    zh: '王粲'   }, courtesyName: { en: 'Zhongxuan', zh: '仲宣' }, birthYear: 177, deathYear: 217, hometownCityId: 'xuchang', stats: { leadership: 30, war: 25, intelligence: 88, politics: 80, charisma: 85 } },
  { id: 'hu-lie',      name: { en: 'Hu Lie',      zh: '胡烈'   }, courtesyName: { en: 'Xuanwu',    zh: '玄武' }, birthYear: 215, deathYear: 270, stats: { leadership: 72, war: 78, intelligence: 65, politics: 55, charisma: 65 } },
  { id: 'cao-lin',     name: { en: 'Cao Lin',     zh: '曹霖'   },                                                                                          birthYear: 220, deathYear: 250, stats: { leadership: 50, war: 50, intelligence: 60, politics: 60, charisma: 60 } },
  { id: 'wang-mai',    name: { en: 'Wang Mai',    zh: '王邁'   },                                                                                          birthYear: 175, deathYear: 230, stats: { leadership: 50, war: 50, intelligence: 65, politics: 65, charisma: 55 } },
  { id: 'chen-gui',    name: { en: 'Chen Gui',    zh: '陳珪'   }, courtesyName: { en: 'Hanyu',     zh: '漢瑜' }, birthYear: 145, deathYear: 210, stats: { leadership: 50, war: 35, intelligence: 82, politics: 80, charisma: 75 } },
  { id: 'sun-li',      name: { en: 'Sun Li',      zh: '孫禮'   }, courtesyName: { en: 'Deda',      zh: '德達' }, birthYear: 175, deathYear: 250, stats: { leadership: 78, war: 78, intelligence: 75, politics: 75, charisma: 70 } },

  // Wu extras
  { id: 'sun-yu',      name: { en: 'Sun Yu',      zh: '孫瑜'   }, courtesyName: { en: 'Zhongyi',   zh: '仲異' }, birthYear: 177, deathYear: 215, stats: { leadership: 75, war: 70, intelligence: 75, politics: 70, charisma: 75 } },
  { id: 'ling-cao',    name: { en: 'Ling Cao',    zh: '凌操'   },                                                                                          birthYear: 170, deathYear: 203, hometownCityId: 'kuaiji', stats: { leadership: 75, war: 82, intelligence: 60, politics: 50, charisma: 65 } },
  { id: 'han-zong',    name: { en: 'Han Zong',    zh: '韓綜'   },                                                                                          birthYear: 195, deathYear: 252, stats: { leadership: 60, war: 70, intelligence: 55, politics: 50, charisma: 55 } },
  { id: 'quan-duan',   name: { en: 'Quan Duan',   zh: '全端'   },                                                                                          birthYear: 215, deathYear: 257, stats: { leadership: 70, war: 70, intelligence: 65, politics: 60, charisma: 65 } },
  { id: 'jiao-chu',    name: { en: 'Jiao Chu',    zh: '焦觸'   },                                                                                          birthYear: 175, deathYear: 215, hometownCityId: 'ye', stats: { leadership: 60, war: 70, intelligence: 60, politics: 50, charisma: 60 } },

  // Shu / Liu Zhang
  { id: 'wang-lei',    name: { en: 'Wang Lei',    zh: '王累'   },                                                                                          birthYear: 168, deathYear: 211, hometownCityId: 'chengdu', stats: { leadership: 40, war: 30, intelligence: 78, politics: 75, charisma: 70 } },
  { id: 'zhang-song',  name: { en: 'Zhang Song',  zh: '張松'   }, courtesyName: { en: 'Yongnian',  zh: '永年' }, birthYear: 170, deathYear: 213, hometownCityId: 'chengdu', stats: { leadership: 35, war: 30, intelligence: 90, politics: 70, charisma: 65 } },
  { id: 'liu-mao',     name: { en: 'Liu Mao',     zh: '劉瑁'   },                                                                                          birthYear: 165, deathYear: 211, stats: { leadership: 45, war: 50, intelligence: 60, politics: 60, charisma: 65 } },
  { id: 'du-qiong',    name: { en: 'Du Qiong',    zh: '杜瓊'   }, courtesyName: { en: 'Boyu',      zh: '伯瑜' }, birthYear: 175, deathYear: 250, hometownCityId: 'chengdu', stats: { leadership: 40, war: 30, intelligence: 80, politics: 78, charisma: 70 } },
  { id: 'qiao-zhou',   name: { en: 'Qiao Zhou',   zh: '譙周'   }, courtesyName: { en: 'Yunnan',    zh: '允南' }, birthYear: 199, deathYear: 270, hometownCityId: 'baxi', stats: { leadership: 35, war: 25, intelligence: 85, politics: 80, charisma: 70 } },

  // Liu Biao extras
  { id: 'liu-pan',     name: { en: 'Liu Pan',     zh: '劉磐'   },                                                                                          birthYear: 165, deathYear: 215, stats: { leadership: 70, war: 78, intelligence: 60, politics: 55, charisma: 65 } },
  { id: 'lady-cai',    name: { en: 'Lady Cai',    zh: '蔡夫人' },                                                                                          birthYear: 170, deathYear: 220, hometownCityId: 'xiangyang', stats: { leadership: 35, war: 25, intelligence: 75, politics: 70, charisma: 80 } },
  { id: 'han-song',    name: { en: 'Han Song',    zh: '韓嵩'   }, courtesyName: { en: 'Deyao',     zh: '德高' }, birthYear: 160, deathYear: 220, stats: { leadership: 45, war: 35, intelligence: 78, politics: 80, charisma: 72 } },

  // Han / misc
  { id: 'liu-he',      name: { en: 'Liu He',      zh: '劉和'   },                                                                                          birthYear: 168, deathYear: 195, stats: { leadership: 50, war: 50, intelligence: 65, politics: 60, charisma: 70 } },
  { id: 'lu-fu',       name: { en: 'Lu Fu',       zh: '路粹'   }, courtesyName: { en: 'Wenwei',    zh: '文蔚' }, birthYear: 158, deathYear: 214, stats: { leadership: 25, war: 25, intelligence: 80, politics: 65, charisma: 70 } },
  { id: 'he-yi',       name: { en: 'He Yi',       zh: '何儀'   },                                                                                          birthYear: 152, deathYear: 196, stats: { leadership: 55, war: 65, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'sun-xia',     name: { en: 'Sun Xia',     zh: '孫夏'   },                                                                                          birthYear: 150, deathYear: 184, stats: { leadership: 55, war: 65, intelligence: 50, politics: 40, charisma: 55 } },

  // ── Phase 22 additions ──
  // Sun heirs and consorts
  { id: 'sun-luban',   name: { en: 'Sun Luban',   zh: '孫魯班' }, courtesyName: { en: 'Dahu',      zh: '大虎' }, birthYear: 205, deathYear: 258, hometownCityId: 'wu', stats: { leadership: 40, war: 35, intelligence: 80, politics: 75, charisma: 80 } },
  { id: 'sun-luyu',    name: { en: 'Sun Luyu',    zh: '孫魯育' }, courtesyName: { en: 'Xiaohu',    zh: '小虎' }, birthYear: 215, deathYear: 255, stats: { leadership: 35, war: 30, intelligence: 70, politics: 65, charisma: 75 } },
  { id: 'bu-lianshi',  name: { en: 'Bu Lianshi',  zh: '步練師' },                                                                                          birthYear: 195, deathYear: 238, stats: { leadership: 30, war: 25, intelligence: 75, politics: 80, charisma: 88 } },
  { id: 'sun-deng',    name: { en: 'Sun Deng',    zh: '孫登'   }, courtesyName: { en: 'Zigao',     zh: '子高' }, birthYear: 209, deathYear: 241, stats: { leadership: 70, war: 60, intelligence: 80, politics: 85, charisma: 88 } },
  { id: 'sun-he',      name: { en: 'Sun He',      zh: '孫和'   }, courtesyName: { en: 'Zixiao',    zh: '子孝' }, birthYear: 224, deathYear: 253, hometownCityId: 'wu', stats: { leadership: 55, war: 50, intelligence: 75, politics: 75, charisma: 80 } },
  { id: 'sun-liang',   name: { en: 'Sun Liang',   zh: '孫亮'   }, courtesyName: { en: 'Ziming',    zh: '子明' }, birthYear: 243, deathYear: 260, hometownCityId: 'wu', stats: { leadership: 40, war: 35, intelligence: 65, politics: 55, charisma: 60 } },
  { id: 'sun-xiu',     name: { en: 'Sun Xiu',     zh: '孫休'   }, courtesyName: { en: 'Ziliang',   zh: '子烈' }, birthYear: 235, deathYear: 264, hometownCityId: 'wu', stats: { leadership: 55, war: 50, intelligence: 78, politics: 75, charisma: 75 } },

  // Wei consorts and family
  { id: 'empress-guo', name: { en: 'Empress Guo', zh: '郭皇后' },                                                                                          birthYear: 184, deathYear: 235, stats: { leadership: 40, war: 30, intelligence: 85, politics: 78, charisma: 80 } },
  { id: 'cao-yi',      name: { en: 'Cao Yi',      zh: '曹羲'   },                                                                                          birthYear: 205, deathYear: 249, stats: { leadership: 60, war: 65, intelligence: 65, politics: 65, charisma: 65 } },

  // Shu next generation
  { id: 'zhuge-zhan',  name: { en: 'Zhuge Zhan',  zh: '諸葛瞻' }, courtesyName: { en: 'Siyuan',    zh: '思遠' }, birthYear: 227, deathYear: 263, hometownCityId: 'langya', stats: { leadership: 75, war: 78, intelligence: 80, politics: 80, charisma: 82 } },
  { id: 'zhuge-shang', name: { en: 'Zhuge Shang', zh: '諸葛尚' },                                                                                          birthYear: 244, deathYear: 263, hometownCityId: 'langya', stats: { leadership: 70, war: 80, intelligence: 70, politics: 65, charisma: 75 } },
  { id: 'zhao-tong',   name: { en: 'Zhao Tong',   zh: '趙統'   },                                                                                          birthYear: 215, deathYear: 270, hometownCityId: 'ye', stats: { leadership: 75, war: 80, intelligence: 65, politics: 60, charisma: 75 } },
  { id: 'zhao-guang',  name: { en: 'Zhao Guang',  zh: '趙廣'   },                                                                                          birthYear: 218, deathYear: 264, hometownCityId: 'ye', stats: { leadership: 70, war: 80, intelligence: 60, politics: 55, charisma: 70 } },
  { id: 'liu-li',      name: { en: 'Liu Li',      zh: '劉理'   }, courtesyName: { en: 'Fengxiao',  zh: '奉孝' }, birthYear: 215, deathYear: 244, hometownCityId: 'chengdu', stats: { leadership: 35, war: 30, intelligence: 50, politics: 50, charisma: 60 } },

  // Wu next generation
  { id: 'lu-jing',     name: { en: 'Lu Jing',     zh: '陸景'   }, courtesyName: { en: 'Shiren',    zh: '士仁' }, birthYear: 250, deathYear: 280, stats: { leadership: 75, war: 65, intelligence: 80, politics: 75, charisma: 70 } },

  // Zhang Lu's family
  { id: 'zhang-wei',   name: { en: 'Zhang Wei',   zh: '張衛'   },                                                                                          birthYear: 162, deathYear: 220, stats: { leadership: 65, war: 75, intelligence: 65, politics: 60, charisma: 60 } },

  // Misc warlord
  { id: 'zhang-yang',  name: { en: 'Zhang Yang',  zh: '張楊'   }, courtesyName: { en: 'Zhishu',    zh: '稚叔' }, birthYear: 155, deathYear: 198, hometownCityId: 'yanmen', stats: { leadership: 60, war: 70, intelligence: 60, politics: 55, charisma: 65 } },

  // Liu Du's son
  { id: 'liu-xian',    name: { en: 'Liu Xian',    zh: '劉賢'   },                                                                                          birthYear: 178, deathYear: 215, stats: { leadership: 50, war: 55, intelligence: 55, politics: 55, charisma: 55 } },

  // Hu Lie's son
  { id: 'hu-yuan',     name: { en: 'Hu Yuan',     zh: '胡淵'   }, courtesyName: { en: 'Shihong',   zh: '世弘' }, birthYear: 235, deathYear: 275, stats: { leadership: 65, war: 72, intelligence: 65, politics: 60, charisma: 60 } },

  // ── Phase 23 additions ──
  // Jin Dynasty princes (War of the Eight Princes)
  { id: 'sima-lun',    name: { en: 'Sima Lun',    zh: '司馬倫' }, courtesyName: { en: 'Zihong',    zh: '子彝' }, birthYear: 248, deathYear: 301, stats: { leadership: 55, war: 55, intelligence: 60, politics: 60, charisma: 50 } },
  { id: 'sima-yong',   name: { en: 'Sima Yong',   zh: '司馬顒' }, courtesyName: { en: 'Wenzai',    zh: '文載' }, birthYear: 250, deathYear: 306, stats: { leadership: 60, war: 65, intelligence: 62, politics: 60, charisma: 55 } },
  { id: 'sima-ying',   name: { en: 'Sima Ying',   zh: '司馬穎' }, courtesyName: { en: 'Zhangdu',   zh: '章度' }, birthYear: 279, deathYear: 306, stats: { leadership: 55, war: 60, intelligence: 65, politics: 60, charisma: 60 } },
  { id: 'sima-ai',     name: { en: 'Sima Ai',     zh: '司馬乂' }, courtesyName: { en: 'Shidu',     zh: '士度' }, birthYear: 277, deathYear: 304, stats: { leadership: 65, war: 75, intelligence: 68, politics: 60, charisma: 70 } },

  // Shu late-game
  { id: 'liu-chen',    name: { en: 'Liu Chen',    zh: '劉諶' },                                                                                           birthYear: 240, deathYear: 263, stats: { leadership: 60, war: 75, intelligence: 65, politics: 60, charisma: 78 } },
  { id: 'lai-min',     name: { en: 'Lai Min',     zh: '來敏'   }, courtesyName: { en: 'Jingda',    zh: '敬達' }, birthYear: 165, deathYear: 261, stats: { leadership: 30, war: 30, intelligence: 75, politics: 70, charisma: 60 } },
  { id: 'chen-shi',    name: { en: 'Chen Shi',    zh: '陳式' },                                                                                           birthYear: 195, deathYear: 235, stats: { leadership: 65, war: 72, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'wang-lian',   name: { en: 'Wang Lian',   zh: '王連'   }, courtesyName: { en: 'Wenyi',     zh: '文儀' }, birthYear: 170, deathYear: 223, stats: { leadership: 45, war: 35, intelligence: 75, politics: 80, charisma: 70 } },
  { id: 'zhuge-qiao',  name: { en: 'Zhuge Qiao',  zh: '諸葛喬' }, courtesyName: { en: 'Boxiu',     zh: '伯松' }, birthYear: 204, deathYear: 228, stats: { leadership: 60, war: 65, intelligence: 75, politics: 70, charisma: 75 } },
  { id: 'pang-lin',    name: { en: 'Pang Lin',    zh: '龐林' },                                                                                           birthYear: 180, deathYear: 230, hometownCityId: 'xiangyang', stats: { leadership: 55, war: 60, intelligence: 75, politics: 65, charisma: 65 } },

  // Wei late-game
  { id: 'cao-fang',    name: { en: 'Cao Fang',    zh: '曹芳'   }, courtesyName: { en: 'Lanqing',   zh: '蘭卿' }, birthYear: 232, deathYear: 274, hometownCityId: 'xiaopei', stats: { leadership: 30, war: 35, intelligence: 55, politics: 50, charisma: 55 } },
  { id: 'empress-mao', name: { en: 'Empress Mao', zh: '毛皇后' },                                                                                         birthYear: 215, deathYear: 237, stats: { leadership: 25, war: 20, intelligence: 70, politics: 60, charisma: 85 } },
  { id: 'liang-xi',    name: { en: 'Liang Xi',    zh: '梁習'   }, courtesyName: { en: 'Zidu',      zh: '子虞' }, birthYear: 170, deathYear: 230, stats: { leadership: 60, war: 50, intelligence: 75, politics: 80, charisma: 72 } },
  { id: 'su-ze',       name: { en: 'Su Ze',       zh: '蘇則'   }, courtesyName: { en: 'Wenshi',    zh: '文師' }, birthYear: 175, deathYear: 223, stats: { leadership: 55, war: 50, intelligence: 78, politics: 75, charisma: 70 } },
  { id: 'bian-bing',   name: { en: 'Bian Bing',   zh: '卞秉' },                                                                                           birthYear: 160, deathYear: 220, stats: { leadership: 50, war: 55, intelligence: 60, politics: 60, charisma: 65 } },
  { id: 'wang-yan',    name: { en: 'Wang Yan',    zh: '王衍'   }, courtesyName: { en: 'Yifu',      zh: '夷甫' }, birthYear: 256, deathYear: 311, stats: { leadership: 30, war: 25, intelligence: 88, politics: 60, charisma: 80 } },

  // Misc
  { id: 'bao-sanniang',name: { en: 'Bao Sanniang',zh: '鮑三娘' },                                                                                         birthYear: 185, deathYear: 225, stats: { leadership: 75, war: 88, intelligence: 60, politics: 50, charisma: 85 } },
  { id: 'bian-rang',   name: { en: 'Bian Rang',   zh: '邊讓'   }, courtesyName: { en: 'Wenli',     zh: '文禮' }, birthYear: 145, deathYear: 193, stats: { leadership: 30, war: 25, intelligence: 80, politics: 70, charisma: 75 } },
  { id: 'han-de',      name: { en: 'Han De',      zh: '韓德' },                                                                                           birthYear: 175, deathYear: 228, stats: { leadership: 60, war: 75, intelligence: 55, politics: 50, charisma: 55 } },
  { id: 'shi-hui',     name: { en: 'Shi Hui',     zh: '士徽' },                                                                                           birthYear: 180, deathYear: 226, stats: { leadership: 50, war: 60, intelligence: 50, politics: 55, charisma: 50 } },

  // ── Phase 25 additions ──
  // Sima clan extras
  { id: 'sima-fu',     name: { en: 'Sima Fu',     zh: '司馬孚' }, courtesyName: { en: 'Shuda',     zh: '叔達' }, birthYear: 180, deathYear: 272, hometownCityId: 'luoyang', stats: { leadership: 60, war: 50, intelligence: 80, politics: 85, charisma: 78 } },
  { id: 'sima-zhong',  name: { en: 'Sima Zhong',  zh: '司馬衷' }, courtesyName: { en: 'Zhengdu',   zh: '正度' }, birthYear: 259, deathYear: 307, stats: { leadership: 25, war: 25, intelligence: 30, politics: 35, charisma: 45 } },
  // Cao clan extras
  { id: 'cao-de',      name: { en: 'Cao De',      zh: '曹德' },                                                                                            birthYear: 158, deathYear: 193, stats: { leadership: 55, war: 60, intelligence: 60, politics: 60, charisma: 65 } },
  { id: 'cao-gun',     name: { en: 'Cao Gun',     zh: '曹袞' },                                                                                            birthYear: 200, deathYear: 235, stats: { leadership: 45, war: 45, intelligence: 75, politics: 65, charisma: 70 } },
  { id: 'cao-jie',     name: { en: 'Cao Jie',     zh: '曹節' },                                                                                            birthYear: 197, deathYear: 260, hometownCityId: 'xiaopei', stats: { leadership: 25, war: 20, intelligence: 70, politics: 65, charisma: 85 } },
  { id: 'lady-ding',   name: { en: 'Lady Ding',   zh: '丁夫人' },                                                                                          birthYear: 160, deathYear: 220, stats: { leadership: 30, war: 25, intelligence: 75, politics: 70, charisma: 80 } },
  { id: 'cao-tai',     name: { en: 'Cao Tai',     zh: '曹泰' },                                                                                            birthYear: 195, deathYear: 250, stats: { leadership: 55, war: 60, intelligence: 60, politics: 60, charisma: 60 } },
  { id: 'xiahou-he',   name: { en: 'Xiahou He',   zh: '夏侯和' }, courtesyName: { en: 'Yiquan',    zh: '義權' }, birthYear: 195, deathYear: 265, hometownCityId: 'xiaopei', stats: { leadership: 60, war: 65, intelligence: 70, politics: 65, charisma: 65 } },
  { id: 'yu-quan',     name: { en: 'Yu Quan',     zh: '于圈' },                                                                                            birthYear: 195, deathYear: 240, stats: { leadership: 60, war: 65, intelligence: 60, politics: 55, charisma: 60 } },

  // Sun extras
  { id: 'sun-jiao',    name: { en: 'Sun Jiao',    zh: '孫皎' }, courtesyName: { en: 'Shuming',    zh: '叔明' }, birthYear: 180, deathYear: 219, stats: { leadership: 78, war: 80, intelligence: 70, politics: 65, charisma: 75 } },
  { id: 'sun-lang',    name: { en: 'Sun Lang',    zh: '孫朗' },                                                                                            birthYear: 188, deathYear: 230, hometownCityId: 'wu', stats: { leadership: 60, war: 70, intelligence: 60, politics: 55, charisma: 65 } },
  { id: 'sun-ba',      name: { en: 'Sun Ba',      zh: '孫霸' }, courtesyName: { en: 'Ziwei',      zh: '子威' }, birthYear: 225, deathYear: 250, hometownCityId: 'wu', stats: { leadership: 50, war: 60, intelligence: 60, politics: 55, charisma: 65 } },
  { id: 'sun-fen',     name: { en: 'Sun Fen',     zh: '孫奮' }, courtesyName: { en: 'Ziyang',     zh: '子揚' }, birthYear: 230, deathYear: 270, stats: { leadership: 45, war: 55, intelligence: 55, politics: 50, charisma: 55 } },
  { id: 'lu-shu',      name: { en: 'Lu Shu',      zh: '魯淑' }, courtesyName: { en: 'Chuncai',    zh: '純才' }, birthYear: 195, deathYear: 260, stats: { leadership: 70, war: 65, intelligence: 75, politics: 70, charisma: 70 } },
  { id: 'lu-ji',       name: { en: 'Lu Ji',       zh: '陸機' }, courtesyName: { en: 'Shiheng',    zh: '士衡' }, birthYear: 261, deathYear: 303, hometownCityId: 'wu', stats: { leadership: 60, war: 50, intelligence: 90, politics: 75, charisma: 82 } },

  // Liu Biao son
  { id: 'liu-cong',    name: { en: 'Liu Cong',    zh: '劉琮' },                                                                                            birthYear: 192, deathYear: 220, hometownCityId: 'xiangyang', stats: { leadership: 35, war: 35, intelligence: 55, politics: 50, charisma: 60 } },

  // Misc
  { id: 'wu-pu',       name: { en: 'Wu Pu',       zh: '吳普' },                                                                                            birthYear: 165, deathYear: 220, stats: { leadership: 20, war: 25, intelligence: 78, politics: 55, charisma: 70 } },
  { id: 'cheng-wu',    name: { en: 'Cheng Wu',    zh: '程武' },                                                                                            birthYear: 175, deathYear: 240, stats: { leadership: 50, war: 50, intelligence: 75, politics: 70, charisma: 65 } },
  { id: 'yan-yu',      name: { en: 'Yan Yu',      zh: '嚴輿' },                                                                                            birthYear: 162, deathYear: 196, stats: { leadership: 45, war: 60, intelligence: 50, politics: 40, charisma: 50 } },

  // ── Phase 26 additions ──
  // Cao children + family
  { id: 'cao-hua',     name: { en: 'Cao Hua',     zh: '曹華' },                                                                                            birthYear: 199, deathYear: 250, stats: { leadership: 25, war: 20, intelligence: 70, politics: 65, charisma: 85 } },
  { id: 'cao-ju',      name: { en: 'Cao Ju',      zh: '曹據' },                                                                                            birthYear: 195, deathYear: 245, stats: { leadership: 45, war: 50, intelligence: 65, politics: 60, charisma: 65 } },
  { id: 'cao-hui',     name: { en: 'Cao Hui',     zh: '曹徽' },                                                                                            birthYear: 198, deathYear: 242, stats: { leadership: 40, war: 45, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'cao-yan',     name: { en: 'Cao Yan',     zh: '曹儼' },                                                                                            birthYear: 201, deathYear: 245, stats: { leadership: 40, war: 45, intelligence: 60, politics: 60, charisma: 65 } },

  // Sima clan extras
  { id: 'sima-liang',  name: { en: 'Sima Liang',  zh: '司馬亮' }, courtesyName: { en: 'Ziyi',      zh: '子翼' }, birthYear: 219, deathYear: 291, stats: { leadership: 55, war: 50, intelligence: 75, politics: 70, charisma: 70 } },
  { id: 'sima-wang',   name: { en: 'Sima Wang',   zh: '司馬望' }, courtesyName: { en: 'Zichu',     zh: '子初' }, birthYear: 205, deathYear: 271, stats: { leadership: 70, war: 70, intelligence: 78, politics: 75, charisma: 70 } },

  // Sun clan extras
  { id: 'sun-jing',    name: { en: 'Sun Jing',    zh: '孫靜' }, courtesyName: { en: 'Yutai',      zh: '幼台' }, birthYear: 158, deathYear: 219, hometownCityId: 'wu', stats: { leadership: 70, war: 70, intelligence: 75, politics: 75, charisma: 75 } },
  { id: 'sun-lu',      name: { en: 'Sun Lü',      zh: '孫慮' }, courtesyName: { en: 'Zizhi',      zh: '子智' }, birthYear: 213, deathYear: 232, stats: { leadership: 65, war: 60, intelligence: 75, politics: 70, charisma: 78 } },
  { id: 'lady-wu',     name: { en: 'Lady Wu',     zh: '吳國太' },                                                                                          birthYear: 145, deathYear: 207, stats: { leadership: 35, war: 25, intelligence: 78, politics: 80, charisma: 85 } },
  { id: 'empress-pan', name: { en: 'Empress Pan', zh: '潘皇后' },                                                                                          birthYear: 215, deathYear: 252, stats: { leadership: 25, war: 20, intelligence: 65, politics: 55, charisma: 82 } },

  // Cheng Pu's son
  { id: 'cheng-zi',    name: { en: 'Cheng Zi',    zh: '程咨' },                                                                                            birthYear: 180, deathYear: 240, stats: { leadership: 65, war: 70, intelligence: 65, politics: 60, charisma: 65 } },

  // Shu family
  { id: 'empress-zhang',name:{ en: 'Empress Zhang',zh: '張皇后' },                                                                                         birthYear: 215, deathYear: 263, hometownCityId: 'chengdu', stats: { leadership: 30, war: 35, intelligence: 65, politics: 60, charisma: 78 } },
  { id: 'zhang-yu',    name: { en: 'Zhang Yu',    zh: '張裕' }, courtesyName: { en: 'Nanhe',      zh: '南和' }, birthYear: 160, deathYear: 218, hometownCityId: 'chengdu', stats: { leadership: 30, war: 25, intelligence: 80, politics: 60, charisma: 65 } },

  // Misc
  { id: 'hu-ban',      name: { en: 'Hu Ban',      zh: '胡班' },                                                                                            birthYear: 165, deathYear: 215, stats: { leadership: 55, war: 60, intelligence: 60, politics: 55, charisma: 65 } },
  { id: 'lady-yan',    name: { en: "Lady Yan",    zh: '嚴氏' },                                                                                            birthYear: 165, deathYear: 200, stats: { leadership: 30, war: 30, intelligence: 65, politics: 60, charisma: 78 } },

  // ─── Phase 30 expansion: more famous officers ────────────────────

  // Wei — later generation and frontier commanders
  { id: 'zhong-yao',   name: { en: 'Zhong Yao',   zh: '鍾繇'   }, courtesyName: { en: 'Yuanchang', zh: '元常' }, birthYear: 151, deathYear: 230, hometownCityId: 'xuchang', stats: { leadership: 70, war: 35, intelligence: 88, politics: 92, charisma: 80 } },

  // Shu — later generation
  { id: 'guan-suo',    name: { en: 'Guan Suo',    zh: '關索' },                                                                                              birthYear: 205, deathYear: 240, hometownCityId: 'puyang', stats: { leadership: 75, war: 84, intelligence: 60, politics: 45, charisma: 70 } },

  // Wu — later generation
  { id: 'lu-ji-wu',    name: { en: 'Lu Ji',       zh: '陸績'   }, courtesyName: { en: 'Gongji',    zh: '公紀' }, birthYear: 188, deathYear: 219, hometownCityId: 'wu', stats: { leadership: 55, war: 30, intelligence: 80, politics: 75, charisma: 70 } },
  { id: 'ma-zhong-wu', name: { en: 'Ma Zhong',    zh: '馬忠'   },                                                                                            birthYear: 180, deathYear: 222, stats: { leadership: 70, war: 78, intelligence: 55, politics: 45, charisma: 55 } },
  { id: 'ling-tong',   name: { en: 'Ling Tong',   zh: '凌統'   }, courtesyName: { en: 'Gongji',    zh: '公績' }, birthYear: 189, deathYear: 217, hometownCityId: 'kuaiji', stats: { leadership: 80, war: 85, intelligence: 65, politics: 50, charisma: 70 } },

  // Jin precursor / late Wei

  // Han loyalists & misc
  { id: 'dong-cheng',  name: { en: 'Dong Cheng',  zh: '董承'   },                                                                                            birthYear: 155, deathYear: 200, stats: { leadership: 60, war: 60, intelligence: 65, politics: 70, charisma: 65 } },

  // ─── Phase 30b expansion ─────────────────────────────────────

  // Dong Zhuo aftermath warlords
  { id: 'li-jue',      name: { en: 'Li Jue',      zh: '李傕'   }, courtesyName: { en: 'Zhiran',    zh: '稚然' }, birthYear: 155, deathYear: 198, hometownCityId: 'anding', stats: { leadership: 72, war: 78, intelligence: 60, politics: 40, charisma: 45 } },
  { id: 'guo-si',      name: { en: 'Guo Si',      zh: '郭汜'   },                                                                                            birthYear: 157, deathYear: 197, hometownCityId: 'wuwei', stats: { leadership: 70, war: 76, intelligence: 50, politics: 35, charisma: 40 } },
  { id: 'fan-chou',    name: { en: 'Fan Chou',    zh: '樊稠'   },                                                                                            birthYear: 160, deathYear: 195, hometownCityId: 'wuwei', stats: { leadership: 68, war: 75, intelligence: 45, politics: 35, charisma: 50 } },
  { id: 'zhang-ji',    name: { en: 'Zhang Ji',    zh: '張濟' },                                                                                              birthYear: 158, deathYear: 196, hometownCityId: 'wuwei', stats: { leadership: 68, war: 70, intelligence: 55, politics: 50, charisma: 55 } },
  { id: 'hu-zhen',     name: { en: 'Hu Zhen',     zh: '胡軫'   },                                                                                            birthYear: 158, deathYear: 195, stats: { leadership: 60, war: 65, intelligence: 50, politics: 45, charisma: 50 } },

  // Yellow Turban remnants
  { id: 'guan-hai',    name: { en: 'Guan Hai',    zh: '管亥'   },                                                                                            birthYear: 158, deathYear: 196, stats: { leadership: 65, war: 78, intelligence: 50, politics: 40, charisma: 50 } },
  { id: 'sun-zhong',   name: { en: 'Sun Zhong',   zh: '孫仲'   },                                                                                            birthYear: 160, deathYear: 192, stats: { leadership: 55, war: 65, intelligence: 50, politics: 40, charisma: 55 } },

  // Northwestern (Qiang frontier) / Liu Yao circle
  { id: 'ma-wan',      name: { en: 'Ma Wan',      zh: '馬玩'   },                                                                                            birthYear: 168, deathYear: 215, stats: { leadership: 62, war: 70, intelligence: 50, politics: 40, charisma: 50 } },

  // Wu additions
  { id: 'xu-sheng-wu', name: { en: 'Xu Sheng',    zh: '徐盛'   }, courtesyName: { en: 'Wenxiang',  zh: '文嚮' }, birthYear: 175, deathYear: 230, hometownCityId: 'langya', stats: { leadership: 82, war: 82, intelligence: 70, politics: 60, charisma: 70 } },
  { id: 'wu-jing',     name: { en: 'Wu Jing',     zh: '吳景'   },                                                                                            birthYear: 155, deathYear: 203, stats: { leadership: 70, war: 70, intelligence: 65, politics: 60, charisma: 65 } },
  { id: 'sun-huan',    name: { en: 'Sun Huan',    zh: '孫桓'   }, courtesyName: { en: 'Shuwu',     zh: '叔武' }, birthYear: 198, deathYear: 222, hometownCityId: 'wu', stats: { leadership: 78, war: 78, intelligence: 70, politics: 60, charisma: 70 } },

  // Wei additions
  { id: 'ren-jun',     name: { en: 'Ren Jun',     zh: '任峻'   }, courtesyName: { en: 'Boda',      zh: '伯達' }, birthYear: 158, deathYear: 204, stats: { leadership: 70, war: 60, intelligence: 75, politics: 80, charisma: 70 } },
  { id: 'wei-xu',      name: { en: 'Wei Xu',      zh: '魏續'   },                                                                                            birthYear: 165, deathYear: 200, stats: { leadership: 60, war: 75, intelligence: 50, politics: 40, charisma: 50 } },

  // Shu additions
  { id: 'yi-ji',       name: { en: 'Yi Ji',       zh: '伊籍'   }, courtesyName: { en: 'Jibo',      zh: '機伯' }, birthYear: 167, deathYear: 222, stats: { leadership: 50, war: 35, intelligence: 80, politics: 78, charisma: 82 } },
  { id: 'xiang-lang',  name: { en: 'Xiang Lang',  zh: '向朗'   }, courtesyName: { en: 'Juda',      zh: '巨達' }, birthYear: 168, deathYear: 247, hometownCityId: 'xiangyang', stats: { leadership: 55, war: 40, intelligence: 80, politics: 78, charisma: 70 } },
  { id: 'huo-jun',     name: { en: 'Huo Jun',     zh: '霍峻'   }, courtesyName: { en: 'Zhongmiao', zh: '仲邈' }, birthYear: 178, deathYear: 217, hometownCityId: 'jiangling', stats: { leadership: 80, war: 78, intelligence: 70, politics: 60, charisma: 65 } },
  { id: 'zhang-ni',    name: { en: 'Zhang Ni',    zh: '張翼'   }, courtesyName: { en: 'Bogong',    zh: '伯恭' }, birthYear: 196, deathYear: 264, hometownCityId: 'chengdu', stats: { leadership: 80, war: 78, intelligence: 70, politics: 65, charisma: 65 } },

  // Late Han / women / misc
  { id: 'empress-cao', name:{ en: 'Empress Cao',  zh: '曹皇后' },                                                                                            birthYear: 197, deathYear: 260, hometownCityId: 'xiaopei', stats: { leadership: 35, war: 25, intelligence: 75, politics: 78, charisma: 88 } },
  { id: 'lady-zhen',   name: { en: 'Lady Zhen',   zh: '甄夫人' },                                                                                            birthYear: 183, deathYear: 221, hometownCityId: 'ye', stats: { leadership: 30, war: 25, intelligence: 78, politics: 65, charisma: 95 } },

  // ─── Phase 30c expansion ───────────────────────────────

  // Famous scholars & poets
  { id: 'cai-yan',     name: { en: 'Cai Yan',     zh: '蔡琰'   }, courtesyName: { en: 'Wenji',     zh: '文姬' }, birthYear: 177, deathYear: 239, stats: { leadership: 25, war: 25, intelligence: 92, politics: 80, charisma: 95 } },
  { id: 'zheng-xuan',  name: { en: 'Zheng Xuan',  zh: '鄭玄'   }, courtesyName: { en: 'Kangcheng', zh: '康成' }, birthYear: 127, deathYear: 200, stats: { leadership: 40, war: 25, intelligence: 95, politics: 80, charisma: 85 } },
  { id: 'kong-zhou',   name: { en: 'Kong Zhou',   zh: '孔伷'   }, courtesyName: { en: 'Gongxu',    zh: '公緒' }, birthYear: 155, deathYear: 191, hometownCityId: 'xuchang', stats: { leadership: 50, war: 30, intelligence: 75, politics: 70, charisma: 75 } },

  // Wei late-era / Jin precursors
  { id: 'wei-guan',    name: { en: 'Wei Guan',    zh: '衛瓘'   }, courtesyName: { en: 'Boyu',      zh: '伯玉' }, birthYear: 220, deathYear: 291, stats: { leadership: 80, war: 65, intelligence: 88, politics: 88, charisma: 78 } },
  { id: 'he-yan',      name: { en: 'He Yan',      zh: '何晏'   }, courtesyName: { en: 'Pingshu',   zh: '平叔' }, birthYear: 195, deathYear: 249, stats: { leadership: 35, war: 30, intelligence: 90, politics: 70, charisma: 82 } },
  { id: 'cao-huan',    name: { en: 'Cao Huan',    zh: '曹奐'   },                                                                                            birthYear: 246, deathYear: 302, hometownCityId: 'xiaopei', stats: { leadership: 30, war: 30, intelligence: 65, politics: 55, charisma: 60 } },
  { id: 'gao-rou',     name: { en: 'Gao Rou',     zh: '高柔'   }, courtesyName: { en: 'Wenhui',    zh: '文惠' }, birthYear: 174, deathYear: 263, stats: { leadership: 55, war: 45, intelligence: 80, politics: 85, charisma: 75 } },

  // Shu late-era
  { id: 'shi-tao',     name: { en: 'Shi Tao',     zh: '石韜'   }, courtesyName: { en: 'Guangyuan', zh: '廣元' }, birthYear: 170, deathYear: 230, hometownCityId: 'xuchang', stats: { leadership: 50, war: 35, intelligence: 80, politics: 75, charisma: 70 } },
  { id: 'cui-zhou-ping',name:{ en: 'Cui Zhouping',zh: '崔州平' },                                                                                            birthYear: 170, deathYear: 215, stats: { leadership: 45, war: 30, intelligence: 85, politics: 75, charisma: 80 } },
  { id: 'meng-jian',   name: { en: 'Meng Jian',   zh: '孟建'   }, courtesyName: { en: 'Gongwei',   zh: '公威' }, birthYear: 175, deathYear: 230, hometownCityId: 'xuchang', stats: { leadership: 55, war: 40, intelligence: 80, politics: 75, charisma: 72 } },

  // Wu late-era
  { id: 'lu-kai',      name: { en: 'Lu Kai',      zh: '陸凱'   }, courtesyName: { en: 'Jingfeng',  zh: '敬風' }, birthYear: 198, deathYear: 269, hometownCityId: 'wu', stats: { leadership: 70, war: 60, intelligence: 82, politics: 88, charisma: 80 } },
  { id: 'zhang-ti',    name: { en: 'Zhang Ti',    zh: '張悌'   }, courtesyName: { en: 'Juxian',    zh: '巨先' }, birthYear: 236, deathYear: 280, stats: { leadership: 80, war: 70, intelligence: 84, politics: 80, charisma: 78 } },
  { id: 'lu-jun-wu',   name: { en: 'Lu Jun',      zh: '陸鈞'   },                                                                                            birthYear: 215, deathYear: 270, stats: { leadership: 70, war: 70, intelligence: 75, politics: 70, charisma: 70 } },
  { id: 'sun-xin',     name: { en: 'Sun Xin',     zh: '孫歆'   },                                                                                            birthYear: 232, deathYear: 280, stats: { leadership: 70, war: 68, intelligence: 65, politics: 60, charisma: 65 } },

  // Yellow Turban core
  { id: 'ma-yuanyi',   name: { en: 'Ma Yuanyi',   zh: '馬元義' },                                                                                            birthYear: 155, deathYear: 184, stats: { leadership: 60, war: 60, intelligence: 78, politics: 60, charisma: 65 } },

  // Black Mountain bandits / Hebei warlords
  { id: 'zhang-yan',   name: { en: 'Zhang Yan',   zh: '張燕'   },                                                                                            birthYear: 160, deathYear: 220, hometownCityId: 'shangdang', stats: { leadership: 78, war: 80, intelligence: 70, politics: 50, charisma: 70 } },
  { id: 'liu-yu-yzs',  name: { en: 'Liu Yu (Hubei)',zh: '劉繇州' }, courtesyName: { en: 'Borong',  zh: '伯戎' }, birthYear: 142, deathYear: 193, stats: { leadership: 70, war: 50, intelligence: 75, politics: 80, charisma: 78 } },

  // More ladies
  { id: 'lady-bian-younger',name:{ en: 'Lady Wang',zh:'王夫人' },                                                                                            birthYear: 175, deathYear: 213, stats: { leadership: 25, war: 20, intelligence: 70, politics: 60, charisma: 80 } },
  { id: 'empress-mu',  name: { en: 'Empress Mu',  zh: '穆皇后' },                                                                                            birthYear: 186, deathYear: 245, stats: { leadership: 30, war: 22, intelligence: 72, politics: 68, charisma: 85 } },

  // ─── Phase 35 — female warriors ────────────────────────────
  { id: 'lady-fan',    name: { en: 'Lady Fan',    zh: '樊氏'   },                                                                                            birthYear: 175, deathYear: 220, stats: { leadership: 35, war: 30, intelligence: 70, politics: 60, charisma: 88 } },
  { id: 'empress-bian',name: { en: 'Empress Bian',zh: '卞皇后' },                                                                                             birthYear: 159, deathYear: 230, hometownCityId: 'xiaopei', stats: { leadership: 40, war: 25, intelligence: 80, politics: 82, charisma: 90 } },
  { id: 'lady-xiahou', name: { en: 'Lady Xiahou', zh: '夏侯氏' },                                                                                            birthYear: 195, deathYear: 245, hometownCityId: 'xiaopei', stats: { leadership: 30, war: 25, intelligence: 70, politics: 60, charisma: 80 } },

  // ─── Phase 35 — Nanman (Meng Huo's host) ───────────────────
  { id: 'meng-you',    name: { en: 'Meng You',    zh: '孟優'   },                                                                                            birthYear: 185, deathYear: 240, hometownCityId: 'nanzhong', stats: { leadership: 60, war: 70, intelligence: 60, politics: 50, charisma: 65 } },
  { id: 'mangya-chang',name: { en: 'Mangya Chang',zh: '忙牙長' },                                                                                            birthYear: 185, deathYear: 225, hometownCityId: 'nanzhong', stats: { leadership: 70, war: 82, intelligence: 40, politics: 35, charisma: 60 } },
  { id: 'jinhuan-sanjie',name:{ en: 'Jinhuan Sanjie',zh:'金環三結' },                                                                                       birthYear: 175, deathYear: 225, hometownCityId: 'nanzhong', stats: { leadership: 72, war: 80, intelligence: 45, politics: 40, charisma: 65 } },
  { id: 'dongtu-na',   name: { en: 'Dongtu Na',  zh: '董荼那' },                                                                                             birthYear: 180, deathYear: 230, stats: { leadership: 68, war: 75, intelligence: 50, politics: 45, charisma: 60 } },
  { id: 'ahui-nan',    name: { en: 'Ahui Nan',   zh: '阿會喃' },                                                                                             birthYear: 180, deathYear: 230, hometownCityId: 'nanzhong', stats: { leadership: 68, war: 75, intelligence: 50, politics: 45, charisma: 60 } },
  { id: 'wutugu',      name: { en: 'Wutugu',     zh: '兀突骨' },                                                                                             birthYear: 190, deathYear: 225, hometownCityId: 'yongchang', stats: { leadership: 75, war: 92, intelligence: 30, politics: 25, charisma: 65 } },
  { id: 'dailai-dongzhu',name:{ en: 'Dailai',    zh: '帶來洞主' },                                                                                          birthYear: 185, deathYear: 240, hometownCityId: 'nanzhong', stats: { leadership: 65, war: 70, intelligence: 60, politics: 55, charisma: 70 } },
  { id: 'shamoke',     name: { en: 'Shamoke',    zh: '沙摩柯' },                                                                                             birthYear: 185, deathYear: 222, hometownCityId: 'wuling', stats: { leadership: 72, war: 84, intelligence: 50, politics: 40, charisma: 65 } },

  // ─── Phase 35 — Wuhuan / Xianbei / Liaodong ───────────────
  { id: 'tadun',       name: { en: 'Tadun',      zh: '蹋頓'   },                                                                                            birthYear: 165, deathYear: 207, hometownCityId: 'wuhuan', stats: { leadership: 78, war: 80, intelligence: 60, politics: 55, charisma: 70 } },
  { id: 'kebi-neng',   name: { en: 'Kebi Neng',  zh: '軻比能' },                                                                                             birthYear: 175, deathYear: 235, stats: { leadership: 82, war: 85, intelligence: 70, politics: 60, charisma: 75 } },
  { id: 'budugen',     name: { en: 'Budugen',    zh: '步度根' },                                                                                             birthYear: 178, deathYear: 233, stats: { leadership: 75, war: 78, intelligence: 60, politics: 55, charisma: 68 } },
  { id: 'gongsun-yuan',name: { en: 'Gongsun Yuan',zh: '公孫淵' }, courtesyName: { en: 'Wenyi',  zh: '文懿' }, birthYear: 200, deathYear: 238, hometownCityId: 'liaodong', stats: { leadership: 70, war: 65, intelligence: 70, politics: 60, charisma: 65 } },

  // ─── Phase 37 — Additional historical officers ──────────────
  // Wei strategists & officials
  { id: 'jiang-ji',    name: { en: 'Jiang Ji',     zh: '蔣濟'   }, courtesyName: { en: 'Ziton',     zh: '子通' }, birthYear: 170, deathYear: 249, hometownCityId: 'shouchun', stats: { leadership: 70, war: 55, intelligence: 88, politics: 85, charisma: 78 } },
  { id: 'fu-jia',      name: { en: 'Fu Jia',       zh: '傅嘏'   }, courtesyName: { en: 'Lanshi',    zh: '蘭石' }, birthYear: 209, deathYear: 255, stats: { leadership: 60, war: 45, intelligence: 87, politics: 85, charisma: 75 } },
  { id: 'liu-fu',      name: { en: 'Liu Fu',       zh: '劉馥'   }, courtesyName: { en: 'Yuanying',  zh: '元穎' }, birthYear: 162, deathYear: 208, stats: { leadership: 70, war: 50, intelligence: 80, politics: 90, charisma: 78 } },
  { id: 'cui-yan',     name: { en: 'Cui Yan',      zh: '崔琰'   }, courtesyName: { en: 'Jigui',     zh: '季珪' }, birthYear: 163, deathYear: 216, hometownCityId: 'ye', stats: { leadership: 60, war: 40, intelligence: 80, politics: 90, charisma: 88 } },
  { id: 'xun-chen',    name: { en: 'Xun Chen',     zh: '荀諶'   }, courtesyName: { en: 'Youruo',    zh: '友若' }, birthYear: 165, deathYear: 200, stats: { leadership: 55, war: 35, intelligence: 85, politics: 78, charisma: 70 } },
  { id: 'xiahou-xuan', name: { en: 'Xiahou Xuan',  zh: '夏侯玄' }, courtesyName: { en: 'Taichu',    zh: '泰初' }, birthYear: 209, deathYear: 254, hometownCityId: 'xiaopei', stats: { leadership: 75, war: 70, intelligence: 80, politics: 75, charisma: 88 } },
  { id: 'li-feng',     name: { en: 'Li Feng',      zh: '李豐'   }, courtesyName: { en: 'Xuanguo',   zh: '宣國' }, birthYear: 196, deathYear: 254, stats: { leadership: 55, war: 45, intelligence: 75, politics: 78, charisma: 70 } },
  { id: 'wen-qin',     name: { en: 'Wen Qin',      zh: '文欽'   }, courtesyName: { en: 'Zhongruo',  zh: '仲若' }, birthYear: 190, deathYear: 258, hometownCityId: 'xiaopei', stats: { leadership: 78, war: 88, intelligence: 60, politics: 55, charisma: 65 } },
  { id: 'wen-yang',    name: { en: 'Wen Yang',     zh: '文鴦'   }, courtesyName: { en: 'Ciqian',    zh: '次騫' }, birthYear: 238, deathYear: 291, hometownCityId: 'xiaopei', stats: { leadership: 78, war: 95, intelligence: 65, politics: 50, charisma: 72 } },

  // Shu — defectors, sons, and late-era loyalists
  { id: 'huang-quan',  name: { en: 'Huang Quan',   zh: '黃權'   }, courtesyName: { en: 'Gongheng',  zh: '公衡' }, birthYear: 175, deathYear: 240, hometownCityId: 'chengdu', stats: { leadership: 80, war: 70, intelligence: 86, politics: 80, charisma: 78 } },
  { id: 'yang-xi',     name: { en: 'Yang Xi',      zh: '楊戲'   }, courtesyName: { en: 'Wenran',    zh: '文然' }, birthYear: 199, deathYear: 261, stats: { leadership: 55, war: 45, intelligence: 75, politics: 78, charisma: 72 } },
  { id: 'fu-qian',     name: { en: 'Fu Qian',      zh: '傅僉'   }, courtesyName: { en: 'Gongxiu',   zh: '公休' }, birthYear: 225, deathYear: 263, hometownCityId: 'xinye', stats: { leadership: 75, war: 86, intelligence: 65, politics: 55, charisma: 70 } },
  { id: 'zhang-shao',  name: { en: 'Zhang Shao',   zh: '張紹'   },                                                                                            birthYear: 200, deathYear: 270, hometownCityId: 'beiping', stats: { leadership: 65, war: 75, intelligence: 60, politics: 60, charisma: 65 } },
  { id: 'guan-yi',     name: { en: 'Guan Yi',      zh: '關彝'   },                                                                                            birthYear: 220, deathYear: 264, stats: { leadership: 65, war: 78, intelligence: 60, politics: 55, charisma: 68 } },

  // Wu — extra civil & military
  { id: 'shi-yi',      name: { en: 'Shi Yi',       zh: '是儀'   }, courtesyName: { en: 'Ziyu',      zh: '子羽' }, birthYear: 158, deathYear: 250, stats: { leadership: 55, war: 35, intelligence: 80, politics: 86, charisma: 72 } },
  { id: 'kan-ze',      name: { en: 'Kan Ze',       zh: '闞澤'   }, courtesyName: { en: 'Derun',     zh: '德潤' }, birthYear: 170, deathYear: 243, stats: { leadership: 55, war: 35, intelligence: 86, politics: 80, charisma: 78 } },
  { id: 'xue-zong',    name: { en: 'Xue Zong',     zh: '薛綜'   }, courtesyName: { en: 'Jingwen',   zh: '敬文' }, birthYear: 176, deathYear: 243, hometownCityId: 'xiapi', stats: { leadership: 50, war: 30, intelligence: 82, politics: 80, charisma: 70 } },
  { id: 'teng-yin',    name: { en: 'Teng Yin',     zh: '滕胤'   }, courtesyName: { en: 'Chengsi',   zh: '承嗣' }, birthYear: 203, deathYear: 256, hometownCityId: 'wu', stats: { leadership: 65, war: 50, intelligence: 78, politics: 78, charisma: 80 } },

  // Jin-era bridge (after the 280 unification)
  { id: 'hu-fen',      name: { en: 'Hu Fen',       zh: '胡奮'   }, courtesyName: { en: 'Xuanwei',   zh: '玄威' }, birthYear: 215, deathYear: 288, stats: { leadership: 75, war: 78, intelligence: 70, politics: 65, charisma: 65 } },

  // ─── Phase 38 — More officers ───────────────────────────────
  // Han loyalists & late-Han figures
  { id: 'ji-ping',     name: { en: 'Ji Ping',      zh: '吉平'   }, courtesyName: { en: 'Chengping', zh: '稱平' }, birthYear: 155, deathYear: 200, stats: { leadership: 45, war: 35, intelligence: 70, politics: 65, charisma: 80 } },
  { id: 'sima-fang',   name: { en: 'Sima Fang',    zh: '司馬防' }, courtesyName: { en: 'Jiangong',  zh: '建公' }, birthYear: 149, deathYear: 219, stats: { leadership: 55, war: 35, intelligence: 78, politics: 85, charisma: 70 } },
  { id: 'cui-zhouping',name: { en: 'Cui Zhouping', zh: '崔州平' }, courtesyName: { en: 'Zhouping',  zh: '州平' }, birthYear: 175, deathYear: 230, stats: { leadership: 50, war: 35, intelligence: 86, politics: 70, charisma: 78 } },

  // Yuan Shao's circle
  { id: 'ju-yi',       name: { en: 'Qu Yi',        zh: '麴義'   },                                                                                            birthYear: 160, deathYear: 199, stats: { leadership: 85, war: 86, intelligence: 70, politics: 50, charisma: 60 } },
  { id: 'xin-ping',    name: { en: 'Xin Ping',     zh: '辛評'   }, courtesyName: { en: 'Zhongzhi',  zh: '仲治' }, birthYear: 165, deathYear: 204, hometownCityId: 'xuchang', stats: { leadership: 50, war: 40, intelligence: 78, politics: 70, charisma: 65 } },
  { id: 'guo-yuan',    name: { en: 'Guo Yuan',     zh: '郭援'   },                                                                                            birthYear: 168, deathYear: 202, stats: { leadership: 70, war: 75, intelligence: 60, politics: 55, charisma: 60 } },

  // Wei — extra
  { id: 'xin-pi',      name: { en: 'Xin Pi',       zh: '辛毗'   }, courtesyName: { en: 'Zuozhi',    zh: '佐治' }, birthYear: 170, deathYear: 235, hometownCityId: 'xuchang', stats: { leadership: 60, war: 45, intelligence: 86, politics: 82, charisma: 78 } },
  { id: 'zhu-ling',    name: { en: 'Zhu Ling',     zh: '朱靈'   }, courtesyName: { en: 'Wenbo',     zh: '文博' }, birthYear: 165, deathYear: 230, stats: { leadership: 78, war: 80, intelligence: 65, politics: 60, charisma: 65 } },
  { id: 'fei-yao',     name: { en: 'Fei Yao',      zh: '費曜'   },                                                                                            birthYear: 175, deathYear: 240, stats: { leadership: 72, war: 75, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'qian-zhao',   name: { en: 'Qian Zhao',    zh: '牽招'   }, courtesyName: { en: 'Zijing',    zh: '子經' }, birthYear: 170, deathYear: 231, stats: { leadership: 82, war: 80, intelligence: 75, politics: 70, charisma: 75 } },
  { id: 'shi-bao',     name: { en: 'Shi Bao',      zh: '石苞'   }, courtesyName: { en: 'Zhongrong', zh: '仲容' }, birthYear: 200, deathYear: 273, stats: { leadership: 82, war: 78, intelligence: 75, politics: 78, charisma: 78 } },
  { id: 'wang-rong',   name: { en: 'Wang Rong',    zh: '王戎'   }, courtesyName: { en: 'Junchong',  zh: '濬沖' }, birthYear: 234, deathYear: 305, stats: { leadership: 55, war: 35, intelligence: 88, politics: 78, charisma: 85 } },

  // Shen brothers — Shangyong defenders
  { id: 'shen-dan',    name: { en: 'Shen Dan',     zh: '申耽'   }, courtesyName: { en: 'Yiju',      zh: '義舉' }, birthYear: 175, deathYear: 240, stats: { leadership: 70, war: 72, intelligence: 60, politics: 60, charisma: 60 } },
  { id: 'shen-yi',     name: { en: 'Shen Yi',      zh: '申儀'   },                                                                                            birthYear: 177, deathYear: 240, stats: { leadership: 65, war: 65, intelligence: 60, politics: 60, charisma: 55 } },

  // Shu — extra
  { id: 'xu-jing',     name: { en: 'Xu Jing',      zh: '許靖'   }, courtesyName: { en: 'Wenxiu',    zh: '文休' }, birthYear: 150, deathYear: 222, hometownCityId: 'runan', stats: { leadership: 45, war: 30, intelligence: 78, politics: 80, charisma: 88 } },
  { id: 'peng-yang',   name: { en: 'Peng Yang',    zh: '彭羕'   }, courtesyName: { en: 'Yongnian',  zh: '永年' }, birthYear: 178, deathYear: 220, stats: { leadership: 55, war: 45, intelligence: 82, politics: 60, charisma: 65 } },
  { id: 'feng-xi',     name: { en: 'Feng Xi',      zh: '馮習'   }, courtesyName: { en: 'Xiuyuan',   zh: '休元' }, birthYear: 180, deathYear: 222, stats: { leadership: 70, war: 78, intelligence: 55, politics: 50, charisma: 60 } },
  { id: 'fan-jiang',   name: { en: 'Fan Jiang',    zh: '范疆'   },                                                                                            birthYear: 180, deathYear: 240, stats: { leadership: 40, war: 60, intelligence: 30, politics: 25, charisma: 25 } },
  { id: 'zhang-da-zf', name: { en: 'Zhang Da',     zh: '張達'   },                                                                                            birthYear: 180, deathYear: 240, stats: { leadership: 38, war: 58, intelligence: 30, politics: 25, charisma: 25 } },

  // Wu — extra
  { id: 'gu-shao',     name: { en: 'Gu Shao',      zh: '顧邵'   }, courtesyName: { en: 'Xiaoze',    zh: '孝則' }, birthYear: 184, deathYear: 214, stats: { leadership: 55, war: 35, intelligence: 80, politics: 80, charisma: 80 } },
  { id: 'zhang-bu',    name: { en: 'Zhang Bu',     zh: '張布'   },                                                                                            birthYear: 200, deathYear: 264, stats: { leadership: 55, war: 45, intelligence: 65, politics: 65, charisma: 60 } },
  { id: 'gongsun-gong',name: { en: 'Gongsun Gong', zh: '公孫恭' },                                                                                            birthYear: 175, deathYear: 240, hometownCityId: 'liaodong', stats: { leadership: 55, war: 50, intelligence: 60, politics: 60, charisma: 55 } },

  // Frontier / rebels
  { id: 'zhang-ying',  name: { en: 'Zhang Ying',   zh: '張英'   },                                                                                            birthYear: 165, deathYear: 195, stats: { leadership: 60, war: 70, intelligence: 55, politics: 50, charisma: 55 } },
  { id: 'jiang-shu',   name: { en: 'Jiang Xu',     zh: '姜敘'   }, courtesyName: { en: 'Boyi',      zh: '伯奕' }, birthYear: 168, deathYear: 220, hometownCityId: 'tianshui', stats: { leadership: 70, war: 75, intelligence: 70, politics: 65, charisma: 70 } },
  { id: 'dou-mao',     name: { en: 'Dou Mao',      zh: '竇茂'   },                                                                                            birthYear: 170, deathYear: 215, stats: { leadership: 60, war: 70, intelligence: 45, politics: 40, charisma: 55 } },

  // ─── Phase 39 — Another batch ───────────────────────────────
  // Dong Zhuo's circle
  { id: 'duan-wei',    name: { en: 'Duan Wei',     zh: '段煨'   }, courtesyName: { en: 'Zhongming',  zh: '忠明' }, birthYear: 145, deathYear: 209, stats: { leadership: 72, war: 75, intelligence: 65, politics: 60, charisma: 60 } },
  { id: 'li-mi-dz',    name: { en: 'Li Meng',      zh: '李蒙'   },                                                                                            birthYear: 150, deathYear: 195, stats: { leadership: 60, war: 70, intelligence: 50, politics: 40, charisma: 50 } },
  { id: 'wang-fang',   name: { en: 'Wang Fang',    zh: '王方'   },                                                                                            birthYear: 155, deathYear: 195, stats: { leadership: 55, war: 65, intelligence: 50, politics: 40, charisma: 50 } },
  { id: 'zou-jing',    name: { en: 'Zou Jing',     zh: '鄒靖'   },                                                                                            birthYear: 145, deathYear: 190, stats: { leadership: 70, war: 70, intelligence: 60, politics: 65, charisma: 65 } },

  // Wei — Sima clan kin & elder generation
  { id: 'sima-lang',   name: { en: 'Sima Lang',    zh: '司馬朗' }, courtesyName: { en: 'Boda',       zh: '伯達' }, birthYear: 171, deathYear: 217, hometownCityId: 'luoyang', stats: { leadership: 60, war: 40, intelligence: 80, politics: 86, charisma: 78 } },
  { id: 'xun-yi',      name: { en: 'Xun Yi',       zh: '荀顗'   }, courtesyName: { en: 'Jingqian',   zh: '景倩' }, birthYear: 205, deathYear: 274, stats: { leadership: 55, war: 35, intelligence: 82, politics: 82, charisma: 78 } },
  { id: 'xun-can',     name: { en: 'Xun Can',      zh: '荀粲'   }, courtesyName: { en: 'Fengqian',   zh: '奉倩' }, birthYear: 209, deathYear: 238, stats: { leadership: 40, war: 30, intelligence: 88, politics: 60, charisma: 82 } },
  { id: 'du-ji',       name: { en: 'Du Ji',        zh: '杜畿'   }, courtesyName: { en: 'Boyou',      zh: '伯侯' }, birthYear: 163, deathYear: 224, hometownCityId: 'changan', stats: { leadership: 68, war: 50, intelligence: 80, politics: 88, charisma: 75 } },
  { id: 'du-shu',      name: { en: 'Du Shu',       zh: '杜恕'   }, courtesyName: { en: 'Wubo',       zh: '務伯' }, birthYear: 198, deathYear: 252, hometownCityId: 'changan', stats: { leadership: 55, war: 40, intelligence: 78, politics: 82, charisma: 72 } },
  { id: 'lu-yu',       name: { en: 'Lu Yu',        zh: '盧毓'   }, courtesyName: { en: 'Ziqia',      zh: '子家' }, birthYear: 183, deathYear: 257, stats: { leadership: 55, war: 40, intelligence: 80, politics: 82, charisma: 75 } },

  // Wu — Sun kin & extra officials
  { id: 'sun-ben',     name: { en: 'Sun Ben',      zh: '孫賁'   }, courtesyName: { en: 'Boyang',     zh: '伯陽' }, birthYear: 165, deathYear: 210, hometownCityId: 'wu', stats: { leadership: 70, war: 75, intelligence: 60, politics: 60, charisma: 65 } },
  { id: 'sun-fu',      name: { en: 'Sun Fu',       zh: '孫輔'   }, courtesyName: { en: 'Guoyi',      zh: '國儀' }, birthYear: 170, deathYear: 213, hometownCityId: 'wu', stats: { leadership: 65, war: 70, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'chen-biao',   name: { en: 'Chen Biao',    zh: '陳表'   }, courtesyName: { en: 'Wen\'ao',    zh: '文奧' }, birthYear: 204, deathYear: 237, stats: { leadership: 75, war: 78, intelligence: 65, politics: 60, charisma: 70 } },
  { id: 'xue-ying',    name: { en: 'Xue Ying',     zh: '薛瑩'   }, courtesyName: { en: 'Daoyan',     zh: '道言' }, birthYear: 215, deathYear: 282, stats: { leadership: 50, war: 35, intelligence: 78, politics: 75, charisma: 70 } },
  { id: 'zhao-zi',     name: { en: 'Zhao Zi',      zh: '趙咨'   }, courtesyName: { en: 'Dedu',       zh: '德度' }, birthYear: 165, deathYear: 230, stats: { leadership: 50, war: 35, intelligence: 78, politics: 75, charisma: 82 } },

  // Yellow Turban era / late Han others
  { id: 'tao-shang',   name: { en: 'Tao Shang',    zh: '陶商'   },                                                                                            birthYear: 175, deathYear: 200, stats: { leadership: 50, war: 50, intelligence: 55, politics: 55, charisma: 55 } },
  { id: 'tao-ying',    name: { en: 'Tao Ying',     zh: '陶應'   },                                                                                            birthYear: 178, deathYear: 200, stats: { leadership: 48, war: 48, intelligence: 55, politics: 55, charisma: 55 } },
  { id: 'wu-can',      name: { en: 'Wu Can',       zh: '吳粲'   }, courtesyName: { en: 'Konghuan',   zh: '孔休' }, birthYear: 175, deathYear: 245, stats: { leadership: 55, war: 45, intelligence: 70, politics: 72, charisma: 65 } },

  // Late-Han Confucian ministers
  { id: 'yang-zhen',   name: { en: 'Yang Zhen',    zh: '楊震'   }, courtesyName: { en: 'Boqi',       zh: '伯起' }, birthYear: 154, deathYear: 220, stats: { leadership: 50, war: 30, intelligence: 80, politics: 88, charisma: 88 } },

  // Ladies of note
  { id: 'lady-zou',    name: { en: 'Lady Zou',     zh: '鄒氏'   },                                                                                            birthYear: 170, deathYear: 230, stats: { leadership: 30, war: 25, intelligence: 65, politics: 55, charisma: 90 } },
  { id: 'lady-xu',     name: { en: 'Lady Xu',      zh: '徐氏'   },                                                                                            birthYear: 178, deathYear: 250, stats: { leadership: 40, war: 30, intelligence: 75, politics: 60, charisma: 85 } },

  // Frontier / minor warlords
  { id: 'bian-zhang',  name: { en: 'Bian Zhang',   zh: '邊章'   },                                                                                            birthYear: 145, deathYear: 187, stats: { leadership: 70, war: 75, intelligence: 65, politics: 55, charisma: 65 } },
  { id: 'cheng-yi-lq', name: { en: 'Cheng Yi',     zh: '程儀'   },                                                                                            birthYear: 150, deathYear: 195, stats: { leadership: 60, war: 60, intelligence: 65, politics: 60, charisma: 55 } },

  // ─── Phase 40 — Yet more officers ────────────────────────────
  // Wei strategists & officials
  { id: 'dong-zhao',   name: { en: 'Dong Zhao',    zh: '董昭'   }, courtesyName: { en: 'Gongren',    zh: '公仁' }, birthYear: 156, deathYear: 236, stats: { leadership: 65, war: 45, intelligence: 88, politics: 86, charisma: 75 } },
  { id: 'qin-lang',    name: { en: 'Qin Lang',     zh: '秦朗'   }, courtesyName: { en: 'Yuanming',   zh: '元明' }, birthYear: 195, deathYear: 245, stats: { leadership: 70, war: 72, intelligence: 65, politics: 60, charisma: 70 } },
  { id: 'wei-feng',    name: { en: 'Wei Feng',     zh: '魏諷'   }, courtesyName: { en: 'Zijing',     zh: '子京' }, birthYear: 178, deathYear: 219, stats: { leadership: 55, war: 45, intelligence: 78, politics: 65, charisma: 80 } },
  { id: 'cui-lin',     name: { en: 'Cui Lin',      zh: '崔林'   }, courtesyName: { en: 'Deru',       zh: '德儒' }, birthYear: 165, deathYear: 244, stats: { leadership: 55, war: 35, intelligence: 80, politics: 85, charisma: 75 } },
  { id: 'he-fu',       name: { en: 'He Kui',       zh: '何夔'   }, courtesyName: { en: 'Shulong',    zh: '叔龍' }, birthYear: 166, deathYear: 224, stats: { leadership: 55, war: 35, intelligence: 76, politics: 82, charisma: 72 } },
  { id: 'yang-ji',     name: { en: 'Yang Ji',      zh: '楊濟'   }, courtesyName: { en: 'Wentong',    zh: '文通' }, birthYear: 200, deathYear: 270, stats: { leadership: 65, war: 60, intelligence: 78, politics: 75, charisma: 72 } },
  { id: 'du-qi',       name: { en: 'Du Qi',        zh: '杜祺'   },                                                                                            birthYear: 180, deathYear: 245, stats: { leadership: 55, war: 50, intelligence: 72, politics: 75, charisma: 65 } },

  // Wu — late-era officials & generals
  { id: 'zhu-ju',      name: { en: 'Zhu Ju',       zh: '朱據'   }, courtesyName: { en: 'Zifan',      zh: '子範' }, birthYear: 194, deathYear: 250, hometownCityId: 'wu', stats: { leadership: 75, war: 78, intelligence: 75, politics: 75, charisma: 80 } },
  { id: 'zhu-yi-wu',   name: { en: 'Zhu Yi',       zh: '朱異'   }, courtesyName: { en: 'Jiwen',      zh: '季文' }, birthYear: 207, deathYear: 257, hometownCityId: 'wu', stats: { leadership: 80, war: 82, intelligence: 75, politics: 65, charisma: 72 } },
  { id: 'gu-tan',      name: { en: 'Gu Tan',       zh: '顧譚'   }, courtesyName: { en: 'Zimo',       zh: '子默' }, birthYear: 205, deathYear: 246, stats: { leadership: 55, war: 40, intelligence: 80, politics: 78, charisma: 72 } },
  { id: 'gu-cheng',    name: { en: 'Gu Cheng',     zh: '顧承'   }, courtesyName: { en: 'Zizhi',      zh: '子直' }, birthYear: 208, deathYear: 245, stats: { leadership: 60, war: 55, intelligence: 75, politics: 70, charisma: 72 } },
  { id: 'luo-tong',    name: { en: 'Luo Tong',     zh: '駱統'   }, courtesyName: { en: 'Gongxu',     zh: '公緒' }, birthYear: 193, deathYear: 228, stats: { leadership: 70, war: 65, intelligence: 80, politics: 78, charisma: 78 } },
  { id: 'yan-jun',     name: { en: 'Yan Jun',      zh: '嚴畯'   }, courtesyName: { en: 'Manca',      zh: '曼才' }, birthYear: 178, deathYear: 245, stats: { leadership: 45, war: 30, intelligence: 82, politics: 75, charisma: 75 } },
  { id: 'xie-jing',    name: { en: 'Xie Jing',     zh: '謝旌'   },                                                                                            birthYear: 195, deathYear: 245, stats: { leadership: 70, war: 78, intelligence: 60, politics: 55, charisma: 60 } },

  // Shu — civilian officials
  { id: 'fei-shi',     name: { en: 'Fei Shi',      zh: '費詩'   }, courtesyName: { en: 'Gongju',     zh: '公舉' }, birthYear: 175, deathYear: 240, stats: { leadership: 50, war: 45, intelligence: 75, politics: 75, charisma: 70 } },
  { id: 'lei-xu',      name: { en: 'Lei Xu',       zh: '雷敘'   },                                                                                            birthYear: 175, deathYear: 220, stats: { leadership: 65, war: 72, intelligence: 55, politics: 50, charisma: 55 } },

  // Liu Zhang's Yi province — pre-Liu Bei
  { id: 'gao-pei',     name: { en: 'Gao Pei',      zh: '高沛'   },                                                                                            birthYear: 165, deathYear: 212, stats: { leadership: 70, war: 75, intelligence: 60, politics: 55, charisma: 60 } },

  // Late Han / Anti-Dong coalition
  { id: 'yuan-yi-yh',  name: { en: 'Yuan Yi',      zh: '袁遺'   }, courtesyName: { en: 'Boye',       zh: '伯業' }, birthYear: 155, deathYear: 192, stats: { leadership: 60, war: 55, intelligence: 75, politics: 75, charisma: 65 } },
  { id: 'huangfu-li',  name: { en: 'Huangfu Li',   zh: '皇甫酈' },                                                                                            birthYear: 160, deathYear: 200, stats: { leadership: 55, war: 60, intelligence: 70, politics: 70, charisma: 65 } },
  { id: 'xun-shu',     name: { en: 'Xun Shu',      zh: '荀淑'   }, courtesyName: { en: 'Jihe',       zh: '季和' }, birthYear: 83,  deathYear: 149, stats: { leadership: 50, war: 30, intelligence: 88, politics: 88, charisma: 90 } },

  // Frontier
  { id: 'liu-bao',     name: { en: 'Liu Bao',      zh: '劉豹'   },                                                                                            birthYear: 195, deathYear: 279, stats: { leadership: 78, war: 80, intelligence: 65, politics: 60, charisma: 68 } },

  // Famous ladies
  { id: 'lady-huang',  name: { en: 'Lady Huang',   zh: '黃月英' },                                                                                            birthYear: 187, deathYear: 240, hometownCityId: 'xiangyang', stats: { leadership: 40, war: 30, intelligence: 92, politics: 70, charisma: 60 } },
  { id: 'lady-cao',    name: { en: 'Lady Cao',     zh: '曹節'   },                                                                                            birthYear: 195, deathYear: 260, hometownCityId: 'xiaopei', stats: { leadership: 35, war: 25, intelligence: 70, politics: 70, charisma: 88 } },
  { id: 'guan-yinping',name: { en: 'Guan Yinping', zh: '關銀屏' },                                                                                            birthYear: 200, deathYear: 280, hometownCityId: 'puyang', stats: { leadership: 65, war: 82, intelligence: 60, politics: 55, charisma: 78 } },

  // ─── Phase 41 — Historians, prodigies, anti-Dong & frontier rebels ───
  // Historians — the men who wrote the period itself
  { id: 'chen-shou',   name: { en: 'Chen Shou',    zh: '陳壽'   }, courtesyName: { en: 'Chengzuo',   zh: '承祚' }, birthYear: 233, deathYear: 297, stats: { leadership: 30, war: 20, intelligence: 92, politics: 75, charisma: 75 } },
  { id: 'yu-huan',     name: { en: 'Yu Huan',      zh: '魚豢'   },                                                                                            birthYear: 200, deathYear: 270, stats: { leadership: 30, war: 20, intelligence: 88, politics: 70, charisma: 70 } },
  { id: 'wei-zhao',    name: { en: 'Wei Zhao',     zh: '韋昭'   }, courtesyName: { en: 'Hongsi',     zh: '弘嗣' }, birthYear: 204, deathYear: 273, stats: { leadership: 30, war: 20, intelligence: 88, politics: 78, charisma: 75 } },

  // Anti-Dong Zhuo coalition warlords
  { id: 'wang-kuang',  name: { en: 'Wang Kuang',   zh: '王匡'   }, courtesyName: { en: 'Gongjie',    zh: '公節' }, birthYear: 150, deathYear: 192, hometownCityId: 'taiyuan', stats: { leadership: 65, war: 65, intelligence: 60, politics: 55, charisma: 65 } },
  { id: 'qiao-mao',    name: { en: 'Qiao Mao',     zh: '橋瑁'   }, courtesyName: { en: 'Yuanwei',    zh: '元偉' }, birthYear: 152, deathYear: 190, hometownCityId: 'chenliu', stats: { leadership: 60, war: 55, intelligence: 65, politics: 65, charisma: 60 } },
  { id: 'he-yong',     name: { en: 'He Yong',      zh: '何顒'   }, courtesyName: { en: 'Boqiu',      zh: '伯求' }, birthYear: 145, deathYear: 190, stats: { leadership: 50, war: 35, intelligence: 80, politics: 78, charisma: 80 } },

  // Wei — prodigies, kin, and martyrs
  { id: 'cao-chong',   name: { en: 'Cao Chong',    zh: '曹沖'   }, courtesyName: { en: 'Cangshu',    zh: '倉舒' }, birthYear: 196, deathYear: 208, hometownCityId: 'xiaopei', stats: { leadership: 50, war: 30, intelligence: 95, politics: 80, charisma: 90 } },
  { id: 'xiahou-en',   name: { en: 'Xiahou En',    zh: '夏侯恩' },                                                                                            birthYear: 178, deathYear: 208, hometownCityId: 'xiaopei', stats: { leadership: 50, war: 70, intelligence: 45, politics: 40, charisma: 50 } },
  { id: 'xiahou-de',   name: { en: 'Xiahou De',    zh: '夏侯德' },                                                                                            birthYear: 175, deathYear: 219, hometownCityId: 'xiaopei', stats: { leadership: 65, war: 72, intelligence: 55, politics: 50, charisma: 55 } },

  // Shu — late-era loyalists & Yiling martyrs
  { id: 'fu-rong',     name: { en: 'Fu Tong',      zh: '傅彤'   },                                                                                            birthYear: 180, deathYear: 222, stats: { leadership: 75, war: 80, intelligence: 60, politics: 55, charisma: 70 } },
  { id: 'xi-zhi',      name: { en: 'Xi Zheng',     zh: '郤正'   }, courtesyName: { en: 'Lingxian',   zh: '令先' }, birthYear: 213, deathYear: 278, stats: { leadership: 35, war: 25, intelligence: 82, politics: 80, charisma: 78 } },
  { id: 'liu-fan',     name: { en: 'Liu Fan',      zh: '劉範'   },                                                                                            birthYear: 165, deathYear: 194, stats: { leadership: 55, war: 50, intelligence: 65, politics: 60, charisma: 60 } },
  { id: 'zhang-yong',  name: { en: 'Zhang Yong',   zh: '張永'   },                                                                                            birthYear: 195, deathYear: 263, stats: { leadership: 60, war: 65, intelligence: 60, politics: 60, charisma: 60 } },

  // Wu — extra
  { id: 'lu-mao',      name: { en: 'Lu Mao',       zh: '陸瑁'   }, courtesyName: { en: 'Ziqi',       zh: '子璋' }, birthYear: 195, deathYear: 240, hometownCityId: 'wu', stats: { leadership: 50, war: 35, intelligence: 80, politics: 78, charisma: 75 } },

  // Frontier — Nanman rebels who preceded Meng Huo's rise
  { id: 'yong-kai',    name: { en: 'Yong Kai',     zh: '雍闓'   },                                                                                            birthYear: 175, deathYear: 225, stats: { leadership: 70, war: 70, intelligence: 65, politics: 55, charisma: 65 } },
  { id: 'gao-ding',    name: { en: 'Gao Ding',     zh: '高定'   },                                                                                            birthYear: 180, deathYear: 225, stats: { leadership: 72, war: 75, intelligence: 55, politics: 50, charisma: 60 } },
  { id: 'zhu-bao',     name: { en: 'Zhu Bao',      zh: '朱褒'   },                                                                                            birthYear: 178, deathYear: 225, stats: { leadership: 65, war: 68, intelligence: 60, politics: 55, charisma: 60 } },

  // Late-Han / Eastern Han remnants
  { id: 'huangfu-jia', name: { en: 'Huangfu Jia',  zh: '皇甫嘉' },                                                                                            birthYear: 158, deathYear: 215, stats: { leadership: 65, war: 65, intelligence: 70, politics: 65, charisma: 70 } },

  // ─── Phase 42 — Court intrigue, Yellow Turban, sages & oddments ───
  // Ten Attendants & Late Han court
  { id: 'zhang-rang',   name: { en: 'Zhang Rang',    zh: '張讓'   },                                                                                            birthYear: 135, deathYear: 189, stats: { leadership: 35, war: 25, intelligence: 75, politics: 78, charisma: 60 } },
  { id: 'jian-shuo',    name: { en: 'Jian Shuo',     zh: '蹇碩'   },                                                                                            birthYear: 145, deathYear: 189, stats: { leadership: 55, war: 40, intelligence: 65, politics: 60, charisma: 55 } },
  { id: 'he-hou',       name: { en: 'Empress He',    zh: '何皇后' },                                                                                            birthYear: 158, deathYear: 189, stats: { leadership: 35, war: 25, intelligence: 60, politics: 70, charisma: 80 } },
  { id: 'wang-meiren',  name: { en: 'Lady Wang',     zh: '王美人' },                                                                                            birthYear: 165, deathYear: 181, stats: { leadership: 25, war: 20, intelligence: 60, politics: 50, charisma: 82 } },
  { id: 'dong-taihou',  name: { en: 'Dowager Dong',  zh: '董太后' },                                                                                            birthYear: 140, deathYear: 189, stats: { leadership: 35, war: 25, intelligence: 65, politics: 72, charisma: 65 } },
  { id: 'liu-bian',     name: { en: 'Liu Bian',      zh: '劉辯'   }, courtesyName: { en: 'Lord of Hongnong', zh: '弘農王' }, birthYear: 176, deathYear: 190, hometownCityId: 'luoyang', stats: { leadership: 25, war: 20, intelligence: 50, politics: 45, charisma: 70 } },

  // Yellow Turban officers (novel & history)
  { id: 'tang-zhou',    name: { en: 'Tang Zhou',     zh: '唐周'   },                                                                                            birthYear: 155, deathYear: 184, stats: { leadership: 40, war: 35, intelligence: 60, politics: 50, charisma: 50 } },
  { id: 'cheng-yuanzhi',name: { en: 'Cheng Yuanzhi', zh: '程遠志' },                                                                                            birthYear: 155, deathYear: 184, stats: { leadership: 55, war: 65, intelligence: 45, politics: 35, charisma: 50 } },
  { id: 'deng-mao',     name: { en: 'Deng Mao',      zh: '鄧茂'   },                                                                                            birthYear: 158, deathYear: 184, stats: { leadership: 50, war: 62, intelligence: 40, politics: 30, charisma: 45 } },
  { id: 'bu-ji',        name: { en: 'Bu Ji',         zh: '卜己'   },                                                                                            birthYear: 150, deathYear: 184, stats: { leadership: 60, war: 65, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'gao-sheng',    name: { en: 'Gao Sheng',     zh: '高升'   },                                                                                            birthYear: 155, deathYear: 184, stats: { leadership: 50, war: 60, intelligence: 40, politics: 30, charisma: 45 } },

  // Anti-Dong coalition / late-Han warlords
  { id: 'zhang-miao',   name: { en: 'Zhang Miao',    zh: '張邈'   }, courtesyName: { en: 'Mengzhuo',    zh: '孟卓' }, birthYear: 150, deathYear: 195, stats: { leadership: 65, war: 60, intelligence: 70, politics: 70, charisma: 72 } },
  { id: 'zhang-chao',   name: { en: 'Zhang Chao',    zh: '張超'   },                                                                                            birthYear: 152, deathYear: 195, stats: { leadership: 60, war: 55, intelligence: 65, politics: 65, charisma: 65 } },
  { id: 'bi-chen',      name: { en: 'Bi Chen',       zh: '畢諶'   },                                                                                            birthYear: 160, deathYear: 220, stats: { leadership: 50, war: 40, intelligence: 70, politics: 70, charisma: 72 } },
  { id: 'wei-kang',     name: { en: 'Wei Kang',      zh: '韋康'   }, courtesyName: { en: 'Yuanjiang',   zh: '元將' }, birthYear: 168, deathYear: 213, hometownCityId: 'changan', stats: { leadership: 55, war: 50, intelligence: 70, politics: 75, charisma: 72 } },

  // Sages, recluses, in-laws of the famous
  { id: 'pang-degong',  name: { en: 'Pang Degong',   zh: '龐德公' },                                                                                            birthYear: 145, deathYear: 210, hometownCityId: 'xiangyang', stats: { leadership: 30, war: 20, intelligence: 90, politics: 60, charisma: 88 } },
  { id: 'huang-chengyan',name:{ en: 'Huang Chengyan',zh: '黃承彥' },                                                                                            birthYear: 148, deathYear: 215, hometownCityId: 'xiangyang', stats: { leadership: 35, war: 25, intelligence: 88, politics: 70, charisma: 80 } },
  { id: 'zhuge-xuan',   name: { en: 'Zhuge Xuan',    zh: '諸葛玄' },                                                                                            birthYear: 150, deathYear: 197, stats: { leadership: 55, war: 40, intelligence: 78, politics: 78, charisma: 75 } },
  { id: 'guan-lu',      name: { en: 'Guan Lu',       zh: '管輅'   }, courtesyName: { en: 'Gongming',    zh: '公明' }, birthYear: 209, deathYear: 256, hometownCityId: 'pingyuan', stats: { leadership: 25, war: 15, intelligence: 92, politics: 50, charisma: 80 } },
  { id: 'nanhua-laoxian',name:{ en: 'Sage of Nanhua', zh: '南華老仙' },                                                                                          birthYear: 50,  deathYear: 200, stats: { leadership: 30, war: 20, intelligence: 95, politics: 50, charisma: 88 } },

  // Liu Yao's officers (vs. Sun Ce)
  { id: 'fan-neng',     name: { en: 'Fan Neng',      zh: '樊能'   },                                                                                            birthYear: 162, deathYear: 195, stats: { leadership: 60, war: 70, intelligence: 50, politics: 45, charisma: 55 } },
  { id: 'yu-mi',        name: { en: 'Yu Mi',         zh: '于糜'   },                                                                                            birthYear: 165, deathYear: 195, stats: { leadership: 55, war: 65, intelligence: 50, politics: 45, charisma: 55 } },

  // Xiahou kin — early Wei losses
  { id: 'xiahou-cheng', name: { en: 'Xiahou Cheng',  zh: '夏侯稱' }, courtesyName: { en: 'Shuquan',     zh: '叔權' }, birthYear: 196, deathYear: 215, hometownCityId: 'xiaopei', stats: { leadership: 60, war: 75, intelligence: 65, politics: 55, charisma: 70 } },
  { id: 'xiahou-rong',  name: { en: 'Xiahou Rong',   zh: '夏侯榮' }, courtesyName: { en: 'Youquan',     zh: '幼權' }, birthYear: 206, deathYear: 219, hometownCityId: 'xiaopei', stats: { leadership: 55, war: 60, intelligence: 75, politics: 60, charisma: 72 } },

  // Wu Shan-Yue rebels & extras
  { id: 'fei-zhan',     name: { en: 'Fei Zhan',      zh: '費棧'   },                                                                                            birthYear: 175, deathYear: 217, stats: { leadership: 65, war: 75, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'shang-sheng',  name: { en: 'Shang Sheng',   zh: '尚升'   },                                                                                            birthYear: 178, deathYear: 220, stats: { leadership: 55, war: 60, intelligence: 50, politics: 40, charisma: 55 } },

  // Final ones — assorted historical
  { id: 'xun-shen',     name: { en: 'Xun Shen',      zh: '荀詵'   }, courtesyName: { en: 'Mancian',     zh: '曼倩' }, birthYear: 208, deathYear: 274, stats: { leadership: 55, war: 40, intelligence: 80, politics: 75, charisma: 70 } },
  { id: 'cui-jun',      name: { en: 'Cui Jun',       zh: '崔均'   }, courtesyName: { en: 'Yuanping',    zh: '元平' }, birthYear: 168, deathYear: 215, stats: { leadership: 50, war: 35, intelligence: 78, politics: 72, charisma: 75 } },
  { id: 'shi-shuo',     name: { en: 'Shi Yi',        zh: '士壹'   },                                                                                            birthYear: 170, deathYear: 240, stats: { leadership: 60, war: 50, intelligence: 65, politics: 70, charisma: 65 } },

  // ─── Phase 43 — Merchants, plotters, Hanzhong & Wu shores ───
  // Liu Bei's two merchant patrons (sworn-brotherhood chapter)
  { id: 'zhang-shiping',name: { en: 'Zhang Shiping', zh: '張世平' },                                                                                            birthYear: 145, deathYear: 200, stats: { leadership: 35, war: 30, intelligence: 65, politics: 70, charisma: 80 } },
  { id: 'su-shuang',    name: { en: 'Su Shuang',     zh: '蘇雙'   },                                                                                            birthYear: 148, deathYear: 200, stats: { leadership: 35, war: 30, intelligence: 60, politics: 68, charisma: 75 } },

  // The Imperial Decree-in-the-Belt conspiracy (against Cao Cao)
  { id: 'wang-zifu',    name: { en: 'Wang Zifu',     zh: '王子服' },                                                                                            birthYear: 158, deathYear: 200, stats: { leadership: 50, war: 40, intelligence: 65, politics: 65, charisma: 65 } },
  { id: 'zhong-ji',     name: { en: 'Zhong Ji',      zh: '種輯'   },                                                                                            birthYear: 160, deathYear: 200, stats: { leadership: 50, war: 40, intelligence: 65, politics: 65, charisma: 65 } },
  { id: 'mu-shun',      name: { en: 'Mu Shun',       zh: '穆順'   },                                                                                            birthYear: 162, deathYear: 200, stats: { leadership: 45, war: 35, intelligence: 60, politics: 60, charisma: 65 } },

  // Dong Zhuo's emissary who turned Lü Bu against Ding Yuan
  { id: 'li-su-dz',     name: { en: 'Li Su',         zh: '李肅'   },                                                                                            birthYear: 150, deathYear: 192, stats: { leadership: 55, war: 65, intelligence: 75, politics: 60, charisma: 78 } },

  // Zhang Lu of Hanzhong — Five-Pecks-of-Rice Way
  { id: 'yan-pu',       name: { en: 'Yan Pu',        zh: '閻圃'   },                                                                                            birthYear: 160, deathYear: 230, stats: { leadership: 50, war: 35, intelligence: 82, politics: 78, charisma: 72 } },
  { id: 'yang-ang',     name: { en: 'Yang Ang',      zh: '楊昂'   },                                                                                            birthYear: 170, deathYear: 215, stats: { leadership: 65, war: 72, intelligence: 50, politics: 45, charisma: 55 } },
  { id: 'yang-bo-zl',   name: { en: 'Yang Bo',       zh: '楊柏'   },                                                                                            birthYear: 172, deathYear: 215, stats: { leadership: 60, war: 65, intelligence: 50, politics: 45, charisma: 55 } },
  { id: 'yang-ren',     name: { en: 'Yang Ren',      zh: '楊任'   },                                                                                            birthYear: 168, deathYear: 215, stats: { leadership: 65, war: 70, intelligence: 60, politics: 50, charisma: 60 } },

  // Yangzhou warlords pre-Sun Ce
  { id: 'xue-li',       name: { en: 'Xue Li',        zh: '薛禮'   },                                                                                            birthYear: 158, deathYear: 195, stats: { leadership: 60, war: 55, intelligence: 60, politics: 65, charisma: 60 } },
  { id: 'ze-rong',      name: { en: 'Ze Rong',       zh: '笮融'   },                                                                                            birthYear: 158, deathYear: 196, stats: { leadership: 65, war: 60, intelligence: 60, politics: 55, charisma: 75 } },

  // Wu — Shan-Yue rebels and other Yangzhou troublemakers
  { id: 'chen-lan',     name: { en: 'Chen Lan',      zh: '陳蘭'   },                                                                                            birthYear: 170, deathYear: 209, stats: { leadership: 65, war: 72, intelligence: 55, politics: 45, charisma: 55 } },
  { id: 'mei-cheng',    name: { en: 'Mei Cheng',     zh: '梅成'   },                                                                                            birthYear: 172, deathYear: 209, stats: { leadership: 60, war: 70, intelligence: 55, politics: 45, charisma: 55 } },

  // Ma family extras (Ma Teng's sons)
  { id: 'ma-tie',       name: { en: 'Ma Tie',        zh: '馬鐵'   },                                                                                            birthYear: 188, deathYear: 212, hometownCityId: 'mei', stats: { leadership: 65, war: 78, intelligence: 55, politics: 45, charisma: 65 } },
  { id: 'ma-xiu',       name: { en: 'Ma Xiu',        zh: '馬休'   },                                                                                            birthYear: 185, deathYear: 212, hometownCityId: 'mei', stats: { leadership: 68, war: 76, intelligence: 55, politics: 50, charisma: 65 } },

  // Pre-Liu Biao Jingzhou inspector
  { id: 'wang-rui',     name: { en: 'Wang Rui',      zh: '王叡'   }, courtesyName: { en: 'Tongyao',     zh: '通耀' }, birthYear: 145, deathYear: 190, stats: { leadership: 55, war: 50, intelligence: 70, politics: 75, charisma: 65 } },

  // Wu strategists & generals
  { id: 'zhou-fang',    name: { en: 'Zhou Fang',     zh: '周魴'   }, courtesyName: { en: 'Ziyu',        zh: '子魚' }, birthYear: 195, deathYear: 240, hometownCityId: 'wu', stats: { leadership: 80, war: 70, intelligence: 88, politics: 75, charisma: 75 } },
  { id: 'tao-huang',    name: { en: 'Tao Huang',     zh: '陶璜'   }, courtesyName: { en: 'Shiying',     zh: '世英' }, birthYear: 210, deathYear: 285, stats: { leadership: 82, war: 78, intelligence: 80, politics: 75, charisma: 75 } },
  { id: 'teng-xiu',     name: { en: 'Teng Xiu',      zh: '滕脩'   }, courtesyName: { en: 'Xianxian',    zh: '顯先' }, birthYear: 218, deathYear: 288, stats: { leadership: 75, war: 70, intelligence: 75, politics: 78, charisma: 75 } },

  // Jin commanders who took Wu in 280
  { id: 'sima-zhou',    name: { en: 'Sima Zhou',     zh: '司馬伷' }, courtesyName: { en: 'Ziqiang',     zh: '子將' }, birthYear: 227, deathYear: 283, stats: { leadership: 78, war: 72, intelligence: 78, politics: 75, charisma: 75 } },
  { id: 'wang-hun',     name: { en: 'Wang Hun',      zh: '王渾'   }, courtesyName: { en: 'Xuanchong',   zh: '玄沖' }, birthYear: 223, deathYear: 297, stats: { leadership: 80, war: 75, intelligence: 78, politics: 80, charisma: 75 } },

  // Shu — late defenders & legacy
  { id: 'liu-shi-yin',  name: { en: 'Liu Shi',       zh: '柳隱'   }, courtesyName: { en: 'Xiuran',      zh: '休然' }, birthYear: 190, deathYear: 269, stats: { leadership: 78, war: 75, intelligence: 70, politics: 65, charisma: 70 } },
  { id: 'chen-zhi',     name: { en: 'Chen Zhi',      zh: '陳袛'   }, courtesyName: { en: 'Fengzong',    zh: '奉宗' }, birthYear: 215, deathYear: 258, hometownCityId: 'runan', stats: { leadership: 50, war: 40, intelligence: 80, politics: 78, charisma: 78 } },
  { id: 'jiang-shu-sh', name: { en: 'Jiang Shu',     zh: '蔣舒'   },                                                                                            birthYear: 215, deathYear: 270, stats: { leadership: 65, war: 70, intelligence: 60, politics: 55, charisma: 55 } },

  // Late-Han sages — last fragments
  { id: 'chen-ji-sg',   name: { en: 'Chen Ji',       zh: '陳紀'   }, courtesyName: { en: 'Yuanfang',    zh: '元方' }, birthYear: 129, deathYear: 199, stats: { leadership: 40, war: 25, intelligence: 86, politics: 85, charisma: 85 } },
  { id: 'xun-shuang',   name: { en: 'Xun Shuang',    zh: '荀爽'   }, courtesyName: { en: 'Ciming',      zh: '慈明' }, birthYear: 128, deathYear: 190, stats: { leadership: 40, war: 25, intelligence: 90, politics: 82, charisma: 88 } },

  // Yuan family extras (Yuan Shu / Yuan Shao kin)
  { id: 'yuan-yin',     name: { en: 'Yuan Yin',      zh: '袁胤'   },                                                                                            birthYear: 170, deathYear: 205, stats: { leadership: 55, war: 50, intelligence: 65, politics: 60, charisma: 60 } },

  // ─── Phase 44 — Jin founders, Bamboo Grove, Cao Shuang clique & more ───
  // Jin dynasty founders (Wei → Jin transition)
  { id: 'zhang-hua',    name: { en: 'Zhang Hua',     zh: '張華'   }, courtesyName: { en: 'Maoxian',     zh: '茂先' }, birthYear: 232, deathYear: 300, stats: { leadership: 60, war: 30, intelligence: 92, politics: 88, charisma: 85 } },
  { id: 'he-zeng',      name: { en: 'He Zeng',       zh: '何曾'   }, courtesyName: { en: 'Yingkao',     zh: '穎考' }, birthYear: 199, deathYear: 278, stats: { leadership: 45, war: 30, intelligence: 78, politics: 82, charisma: 70 } },
  { id: 'pei-xiu',      name: { en: 'Pei Xiu',       zh: '裴秀'   }, courtesyName: { en: 'Jiyan',       zh: '季彥' }, birthYear: 224, deathYear: 271, stats: { leadership: 50, war: 30, intelligence: 90, politics: 82, charisma: 78 } },
  { id: 'pei-kai',      name: { en: 'Pei Kai',       zh: '裴楷'   }, courtesyName: { en: 'Shuze',       zh: '叔則' }, birthYear: 237, deathYear: 291, stats: { leadership: 45, war: 25, intelligence: 82, politics: 78, charisma: 88 } },
  { id: 'sima-jun',     name: { en: 'Sima Jun',      zh: '司馬駿' }, courtesyName: { en: 'Zizang',      zh: '子臧' }, birthYear: 232, deathYear: 286, stats: { leadership: 75, war: 70, intelligence: 75, politics: 75, charisma: 78 } },

  // The Seven Sages of the Bamboo Grove (竹林七賢)
  { id: 'ji-kang',      name: { en: 'Ji Kang',       zh: '嵇康'   }, courtesyName: { en: 'Shuye',       zh: '叔夜' }, birthYear: 223, deathYear: 263, stats: { leadership: 40, war: 60, intelligence: 92, politics: 50, charisma: 95 } },
  { id: 'ruan-ji',      name: { en: 'Ruan Ji',       zh: '阮籍'   }, courtesyName: { en: 'Sizong',      zh: '嗣宗' }, birthYear: 210, deathYear: 263, stats: { leadership: 30, war: 25, intelligence: 88, politics: 55, charisma: 92 } },
  { id: 'shan-tao',     name: { en: 'Shan Tao',      zh: '山濤'   }, courtesyName: { en: 'Juyuan',      zh: '巨源' }, birthYear: 205, deathYear: 283, stats: { leadership: 55, war: 30, intelligence: 85, politics: 85, charisma: 88 } },
  { id: 'ruan-xian',    name: { en: 'Ruan Xian',     zh: '阮咸'   }, courtesyName: { en: 'Zhongrong',   zh: '仲容' }, birthYear: 235, deathYear: 280, stats: { leadership: 25, war: 20, intelligence: 80, politics: 50, charisma: 88 } },
  { id: 'liu-ling',     name: { en: 'Liu Ling',      zh: '劉伶'   }, courtesyName: { en: 'Bolun',       zh: '伯倫' }, birthYear: 221, deathYear: 300, stats: { leadership: 20, war: 20, intelligence: 82, politics: 30, charisma: 90 } },
  { id: 'xiang-xiu',    name: { en: 'Xiang Xiu',     zh: '向秀'   }, courtesyName: { en: 'Ziqi',        zh: '子期' }, birthYear: 227, deathYear: 272, stats: { leadership: 30, war: 20, intelligence: 88, politics: 60, charisma: 82 } },

  // Cao Shuang's faction — purged in the Gaopingling coup
  { id: 'deng-yang',    name: { en: 'Deng Yang',     zh: '鄧颺'   }, courtesyName: { en: 'Xuanmao',     zh: '玄茂' }, birthYear: 200, deathYear: 249, stats: { leadership: 55, war: 45, intelligence: 70, politics: 65, charisma: 70 } },
  { id: 'ding-mi',      name: { en: 'Ding Mi',       zh: '丁謐'   }, courtesyName: { en: 'Yanjing',     zh: '彥靖' }, birthYear: 202, deathYear: 249, stats: { leadership: 50, war: 40, intelligence: 78, politics: 70, charisma: 68 } },
  { id: 'bi-gui',       name: { en: 'Bi Gui',        zh: '畢軌'   }, courtesyName: { en: 'Zhaoxian',    zh: '昭先' }, birthYear: 200, deathYear: 249, stats: { leadership: 55, war: 45, intelligence: 68, politics: 65, charisma: 70 } },
  { id: 'huan-fan',     name: { en: 'Huan Fan',      zh: '桓範'   }, courtesyName: { en: 'Yuanze',      zh: '元則' }, birthYear: 180, deathYear: 249, stats: { leadership: 60, war: 50, intelligence: 86, politics: 78, charisma: 70 } },

  // Mid-Wei generals & administrators
  { id: 'wang-ji-wei',  name: { en: 'Wang Ji',       zh: '王基'   }, courtesyName: { en: 'Boyu',        zh: '伯輿' }, birthYear: 190, deathYear: 261, stats: { leadership: 82, war: 75, intelligence: 80, politics: 78, charisma: 75 } },
  { id: 'wei-dan',      name: { en: 'Wei Dan',       zh: '韋誕'   }, courtesyName: { en: 'Zhongjiang',  zh: '仲將' }, birthYear: 179, deathYear: 253, stats: { leadership: 35, war: 25, intelligence: 78, politics: 70, charisma: 80 } },
  { id: 'zhong-yu',     name: { en: 'Zhong Yu',      zh: '鍾毓'   }, courtesyName: { en: 'Zhishu',      zh: '稚叔' }, birthYear: 209, deathYear: 263, stats: { leadership: 55, war: 40, intelligence: 80, politics: 78, charisma: 72 } },
  { id: 'zhuge-xu-wei', name: { en: 'Zhuge Xu',      zh: '諸葛緒' },                                                                                            birthYear: 210, deathYear: 270, stats: { leadership: 70, war: 65, intelligence: 70, politics: 60, charisma: 65 } },
  { id: 'tian-xu',      name: { en: 'Tian Xu',       zh: '田續'   },                                                                                            birthYear: 215, deathYear: 280, stats: { leadership: 65, war: 72, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'qian-hong',    name: { en: 'Qian Hong',     zh: '牽弘'   },                                                                                            birthYear: 205, deathYear: 271, stats: { leadership: 72, war: 78, intelligence: 65, politics: 60, charisma: 65 } },

  // Liang province frontier rebels (pre-Han Sui era)
  { id: 'beigong-boyu', name: { en: 'Beigong Boyu',  zh: '北宮伯玉' },                                                                                          birthYear: 145, deathYear: 187, stats: { leadership: 70, war: 78, intelligence: 50, politics: 40, charisma: 60 } },
  { id: 'song-jian',    name: { en: 'Song Jian',     zh: '宋建'   },                                                                                            birthYear: 155, deathYear: 214, stats: { leadership: 70, war: 70, intelligence: 60, politics: 55, charisma: 60 } },

  // Yi province rebel chief under Gao Ding
  { id: 'e-huan',       name: { en: 'E Huan',        zh: '鄂煥'   },                                                                                            birthYear: 185, deathYear: 225, stats: { leadership: 65, war: 82, intelligence: 45, politics: 35, charisma: 55 } },

  // Han loyalists, scholars, historians
  { id: 'ying-shao',    name: { en: 'Ying Shao',     zh: '應劭'   }, courtesyName: { en: 'Zhongyuan',   zh: '仲遠' }, birthYear: 153, deathYear: 196, stats: { leadership: 45, war: 30, intelligence: 86, politics: 80, charisma: 75 } },
  { id: 'fu-xie',       name: { en: 'Fu Xie',        zh: '傅燮'   }, courtesyName: { en: 'Nanrong',     zh: '南容' }, birthYear: 145, deathYear: 187, stats: { leadership: 75, war: 75, intelligence: 80, politics: 78, charisma: 88 } },
  { id: 'xun-yue',      name: { en: 'Xun Yue',       zh: '荀悅'   }, courtesyName: { en: 'Zhongyu',     zh: '仲豫' }, birthYear: 148, deathYear: 209, stats: { leadership: 35, war: 25, intelligence: 88, politics: 78, charisma: 78 } },

  // Wu — Sun Hao's reign favorites & late officials
  { id: 'he-ding',      name: { en: 'He Ding',       zh: '何定'   },                                                                                            birthYear: 220, deathYear: 273, stats: { leadership: 35, war: 30, intelligence: 60, politics: 55, charisma: 50 } },
  { id: 'tao-ji',       name: { en: 'Tao Ji',        zh: '陶基'   },                                                                                            birthYear: 180, deathYear: 257, stats: { leadership: 65, war: 60, intelligence: 70, politics: 75, charisma: 65 } },

  // Wu officer who served Jin after the unification
  { id: 'zhuge-jing-2', name: { en: 'Zhuge Jing',    zh: '諸葛靚' }, courtesyName: { en: 'Zhongsi',     zh: '仲思' }, birthYear: 240, deathYear: 290, stats: { leadership: 65, war: 60, intelligence: 80, politics: 75, charisma: 78 } },

  // ─── Phase 45 — Eunuchs, surrender-advisers, frontier captains, Jin scions ───
  // Shu — late-era civilian & military
  { id: 'huang-hao',    name: { en: 'Huang Hao',     zh: '黃皓'   },                                                                                            birthYear: 215, deathYear: 264, stats: { leadership: 25, war: 20, intelligence: 65, politics: 50, charisma: 70 } },
  { id: 'huang-chong',  name: { en: 'Huang Chong',   zh: '黃崇'   },                                                                                            birthYear: 215, deathYear: 263, stats: { leadership: 65, war: 70, intelligence: 78, politics: 70, charisma: 70 } },
  { id: 'li-fu',        name: { en: 'Li Fu',         zh: '李福'   }, courtesyName: { en: 'Sunde',       zh: '孫德' }, birthYear: 180, deathYear: 238, stats: { leadership: 50, war: 35, intelligence: 75, politics: 75, charisma: 72 } },
  { id: 'li-hui',       name: { en: 'Li Hui',        zh: '李恢'   }, courtesyName: { en: 'Deang',       zh: '德昂' }, birthYear: 178, deathYear: 231, stats: { leadership: 80, war: 75, intelligence: 78, politics: 75, charisma: 75 } },
  { id: 'chen-dao',     name: { en: 'Chen Dao',      zh: '陳到'   }, courtesyName: { en: 'Shuzhi',      zh: '叔至' }, birthYear: 168, deathYear: 230, stats: { leadership: 85, war: 86, intelligence: 70, politics: 60, charisma: 75 } },
  { id: 'wei-ji',       name: { en: 'Wei Ji',        zh: '衛繼'   }, courtesyName: { en: 'Wenjing',     zh: '文經' }, birthYear: 215, deathYear: 263, stats: { leadership: 50, war: 45, intelligence: 72, politics: 70, charisma: 70 } },
  { id: 'wang-si',      name: { en: 'Wang Si',       zh: '王嗣'   }, courtesyName: { en: 'Chengzong',   zh: '承宗' }, birthYear: 200, deathYear: 257, stats: { leadership: 65, war: 60, intelligence: 70, politics: 70, charisma: 78 } },

  // Wu — late officials & generals
  { id: 'zhuge-rong',   name: { en: 'Zhuge Rong',    zh: '諸葛融' }, courtesyName: { en: 'Shuchang',    zh: '叔長' }, birthYear: 208, deathYear: 253, stats: { leadership: 60, war: 55, intelligence: 70, politics: 65, charisma: 68 } },
  { id: 'liu-zan',      name: { en: 'Liu Zan',       zh: '留贊'   }, courtesyName: { en: 'Zhengming',   zh: '正明' }, birthYear: 180, deathYear: 255, stats: { leadership: 78, war: 80, intelligence: 65, politics: 60, charisma: 70 } },
  { id: 'liu-lue',      name: { en: 'Liu Lue',       zh: '留略'   },                                                                                            birthYear: 210, deathYear: 270, stats: { leadership: 65, war: 70, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'liu-ping',     name: { en: 'Liu Ping',      zh: '留平'   },                                                                                            birthYear: 212, deathYear: 272, stats: { leadership: 65, war: 70, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'sun-feng-wu',  name: { en: 'Sun Feng',      zh: '孫奉'   },                                                                                            birthYear: 235, deathYear: 270, stats: { leadership: 55, war: 50, intelligence: 60, politics: 55, charisma: 65 } },

  // Wei — official, Liang frontier & late
  { id: 'wang-jing',    name: { en: 'Wang Jing',     zh: '王經'   }, courtesyName: { en: 'Yanwei',      zh: '彥緯' }, birthYear: 205, deathYear: 260, stats: { leadership: 70, war: 60, intelligence: 75, politics: 78, charisma: 85 } },
  { id: 'ma-zun',       name: { en: 'Ma Zun',        zh: '馬遵'   },                                                                                            birthYear: 195, deathYear: 250, stats: { leadership: 55, war: 50, intelligence: 65, politics: 60, charisma: 60 } },
  { id: 'xiahou-zhan',  name: { en: 'Xiahou Zhan',   zh: '夏侯湛' }, courtesyName: { en: 'Xiaoruo',     zh: '孝若' }, birthYear: 243, deathYear: 291, stats: { leadership: 35, war: 30, intelligence: 80, politics: 70, charisma: 88 } },

  // Yuan Shu's camp — generals & strategist
  { id: 'zhang-xun',    name: { en: 'Zhang Xun',     zh: '張勳'   },                                                                                            birthYear: 158, deathYear: 199, stats: { leadership: 72, war: 70, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'yang-hong-ys', name: { en: 'Yang Hong',     zh: '楊弘'   },                                                                                            birthYear: 165, deathYear: 200, stats: { leadership: 50, war: 40, intelligence: 75, politics: 70, charisma: 65 } },

  // Lü Bu's officer who betrayed him
  { id: 'hao-meng',     name: { en: 'Hao Meng',      zh: '郝萌'   },                                                                                            birthYear: 165, deathYear: 196, stats: { leadership: 65, war: 75, intelligence: 50, politics: 40, charisma: 55 } },

  // Han loyalists, frontier captains
  { id: 'zhu-hao',      name: { en: 'Zhu Hao',       zh: '朱皓'   },                                                                                            birthYear: 158, deathYear: 196, stats: { leadership: 60, war: 55, intelligence: 70, politics: 70, charisma: 68 } },
  { id: 'xianyu-fu',    name: { en: 'Xianyu Fu',     zh: '鮮于輔' },                                                                                            birthYear: 160, deathYear: 220, stats: { leadership: 75, war: 75, intelligence: 70, politics: 65, charisma: 75 } },
  { id: 'xianyu-yin',   name: { en: 'Xianyu Yin',    zh: '鮮于銀' },                                                                                            birthYear: 165, deathYear: 215, stats: { leadership: 65, war: 70, intelligence: 60, politics: 55, charisma: 65 } },
  { id: 'yan-rou',      name: { en: 'Yan Rou',       zh: '閻柔'   },                                                                                            birthYear: 158, deathYear: 230, stats: { leadership: 78, war: 75, intelligence: 70, politics: 65, charisma: 78 } },

  // Jin scions & royal women
  { id: 'sima-you',     name: { en: 'Sima You',      zh: '司馬攸' }, courtesyName: { en: 'Dayou',       zh: '大猷' }, birthYear: 248, deathYear: 283, hometownCityId: 'luoyang', stats: { leadership: 70, war: 60, intelligence: 88, politics: 85, charisma: 88 } },
  { id: 'wang-yuanji',  name: { en: 'Wang Yuanji',   zh: '王元姬' },                                                                                            birthYear: 217, deathYear: 268, hometownCityId: 'luoyang', stats: { leadership: 40, war: 25, intelligence: 88, politics: 80, charisma: 90 } },
  { id: 'tang-bin',     name: { en: 'Tang Bin',      zh: '唐彬'   }, courtesyName: { en: 'Rumian',      zh: '儒宗' }, birthYear: 235, deathYear: 294, stats: { leadership: 75, war: 75, intelligence: 70, politics: 70, charisma: 70 } },

  // Famous as son-of-famous
  { id: 'ji-shao',      name: { en: 'Ji Shao',       zh: '嵇紹'   }, courtesyName: { en: 'Yanzu',       zh: '延祖' }, birthYear: 253, deathYear: 304, stats: { leadership: 55, war: 50, intelligence: 80, politics: 75, charisma: 88 } },

  // The Former Liang founder (born late-Han Wei period, lived past 280)
  { id: 'zhang-gui',    name: { en: 'Zhang Gui',     zh: '張軌'   }, courtesyName: { en: 'Shiyan',      zh: '士彥' }, birthYear: 255, deathYear: 314, stats: { leadership: 80, war: 72, intelligence: 80, politics: 82, charisma: 78 } },

  // ─── Phase 46 — Jian'an Seven, Yellow Turban chiefs, Bu/Cheng clans, scholars ───
  // Jian'an Seven Masters (建安七子) — not yet in the roster
  { id: 'ying-yang',    name: { en: 'Ying Yang',     zh: '應瑒'   }, courtesyName: { en: 'Delian',      zh: '德璉' }, birthYear: 170, deathYear: 217, stats: { leadership: 30, war: 20, intelligence: 80, politics: 65, charisma: 88 } },
  { id: 'liu-zhen-jian',name: { en: 'Liu Zhen',      zh: '劉楨'   }, courtesyName: { en: 'Gonggan',     zh: '公幹' }, birthYear: 180, deathYear: 217, stats: { leadership: 30, war: 20, intelligence: 80, politics: 60, charisma: 90 } },
  { id: 'xu-gan',       name: { en: 'Xu Gan',        zh: '徐幹'   }, courtesyName: { en: 'Weichang',    zh: '偉長' }, birthYear: 171, deathYear: 218, stats: { leadership: 30, war: 20, intelligence: 86, politics: 70, charisma: 80 } },

  // Cao Cao — early stewards
  { id: 'zao-zhi',      name: { en: 'Zao Zhi',       zh: '棗祗'   },                                                                                            birthYear: 150, deathYear: 200, stats: { leadership: 60, war: 45, intelligence: 80, politics: 88, charisma: 70 } },
  { id: 'cao-xun',      name: { en: 'Cao Xun',       zh: '曹訓'   },                                                                                            birthYear: 205, deathYear: 249, stats: { leadership: 50, war: 55, intelligence: 50, politics: 50, charisma: 60 } },
  { id: 'wei-ji-wei',   name: { en: 'Wei Ji',        zh: '衛覬'   }, courtesyName: { en: 'Boru',        zh: '伯儒' }, birthYear: 155, deathYear: 229, stats: { leadership: 45, war: 30, intelligence: 80, politics: 82, charisma: 75 } },
  { id: 'yang-jun',     name: { en: 'Yang Jun',      zh: '楊俊'   }, courtesyName: { en: 'Jicai',       zh: '季才' }, birthYear: 165, deathYear: 222, stats: { leadership: 55, war: 40, intelligence: 78, politics: 78, charisma: 78 } },
  { id: 'huan-jie',     name: { en: 'Huan Jie',      zh: '桓階'   }, courtesyName: { en: 'Boxu',        zh: '伯緒' }, birthYear: 158, deathYear: 221, stats: { leadership: 60, war: 50, intelligence: 80, politics: 82, charisma: 80 } },
  { id: 'huan-jia',     name: { en: 'Huan Jia',      zh: '桓嘉'   }, courtesyName: { en: 'Yiquan',      zh: '宜權' }, birthYear: 200, deathYear: 253, stats: { leadership: 65, war: 70, intelligence: 65, politics: 65, charisma: 65 } },

  // Wei — Chen Cang heroes & mid-tier
  { id: 'wang-shuang-wei',name:{ en: 'Wang Shuang',  zh: '王雙'   },                                                                                            birthYear: 195, deathYear: 228, stats: { leadership: 72, war: 86, intelligence: 50, politics: 40, charisma: 60 } },
  { id: 'dai-ling',     name: { en: 'Dai Ling',      zh: '戴陵'   },                                                                                            birthYear: 185, deathYear: 240, stats: { leadership: 60, war: 70, intelligence: 55, politics: 50, charisma: 55 } },
  { id: 'zhou-xuan',    name: { en: 'Zhou Xuan',     zh: '周宣'   }, courtesyName: { en: 'Kongru',      zh: '孔和' }, birthYear: 175, deathYear: 240, stats: { leadership: 25, war: 15, intelligence: 88, politics: 50, charisma: 70 } },

  // Yellow Turban — provincial commanders
  { id: 'han-zhong-yt', name: { en: 'Han Zhong',     zh: '韓忠'   },                                                                                            birthYear: 150, deathYear: 184, stats: { leadership: 70, war: 75, intelligence: 55, politics: 45, charisma: 60 } },
  { id: 'zhao-hong-yt', name: { en: 'Zhao Hong',     zh: '趙弘'   },                                                                                            birthYear: 152, deathYear: 184, stats: { leadership: 65, war: 70, intelligence: 55, politics: 45, charisma: 55 } },

  // Late-Han court — He Jin's faction
  { id: 'he-miao',      name: { en: 'He Miao',       zh: '何苗'   }, courtesyName: { en: 'Shuda',       zh: '叔達' }, birthYear: 158, deathYear: 189, hometownCityId: 'wancheng', stats: { leadership: 55, war: 50, intelligence: 50, politics: 55, charisma: 55 } },

  // Shu — Yiling martyr, late officials
  { id: 'cheng-ji-sh',  name: { en: 'Cheng Ji',      zh: '程畿'   }, courtesyName: { en: 'Jiran',       zh: '季然' }, birthYear: 170, deathYear: 222, stats: { leadership: 60, war: 60, intelligence: 75, politics: 72, charisma: 78 } },
  { id: 'ma-bing',      name: { en: 'Ma Bing',       zh: '馬秉'   },                                                                                            birthYear: 205, deathYear: 270, stats: { leadership: 50, war: 45, intelligence: 70, politics: 70, charisma: 65 } },

  // Wu — Bu family, late officers
  { id: 'cheng-bing',   name: { en: 'Cheng Bing',    zh: '程秉'   }, courtesyName: { en: 'Dezhu',       zh: '德樞' }, birthYear: 170, deathYear: 242, stats: { leadership: 40, war: 30, intelligence: 80, politics: 75, charisma: 75 } },
  { id: 'bu-xie',       name: { en: 'Bu Xie',        zh: '步協'   },                                                                                            birthYear: 200, deathYear: 270, stats: { leadership: 65, war: 60, intelligence: 65, politics: 60, charisma: 60 } },
  { id: 'bu-chan',      name: { en: 'Bu Chan',       zh: '步闡'   }, courtesyName: { en: 'Zhongsi',     zh: '仲思' }, birthYear: 215, deathYear: 272, hometownCityId: 'xiapi', stats: { leadership: 70, war: 65, intelligence: 65, politics: 60, charisma: 60 } },
  { id: 'xue-xu',       name: { en: 'Xue Xu',        zh: '薛珝'   },                                                                                            birthYear: 200, deathYear: 271, stats: { leadership: 75, war: 70, intelligence: 70, politics: 70, charisma: 70 } },
  { id: 'tao-jun',      name: { en: 'Tao Jun',       zh: '陶濬'   },                                                                                            birthYear: 215, deathYear: 280, stats: { leadership: 65, war: 60, intelligence: 60, politics: 60, charisma: 60 } },
  { id: 'zhongli-mu',   name: { en: 'Zhongli Mu',    zh: '鍾離牧' }, courtesyName: { en: 'Ziqi',        zh: '子幹' }, birthYear: 195, deathYear: 270, stats: { leadership: 75, war: 70, intelligence: 75, politics: 75, charisma: 75 } },

  // Hua Tuo's prized student
  { id: 'fan-a',        name: { en: 'Fan A',         zh: '樊阿'   },                                                                                            birthYear: 170, deathYear: 235, stats: { leadership: 25, war: 25, intelligence: 80, politics: 50, charisma: 70 } },

  // Late-Han envoys & sages
  { id: 'zhao-qi',      name: { en: 'Zhao Qi',       zh: '趙岐'   }, courtesyName: { en: 'Binqing',     zh: '邠卿' }, birthYear: 108, deathYear: 201, stats: { leadership: 40, war: 25, intelligence: 86, politics: 80, charisma: 88 } },
  { id: 'zhou-buyi',    name: { en: 'Zhou Buyi',     zh: '周不疑' }, courtesyName: { en: 'Yuanzhi',     zh: '元直' }, birthYear: 192, deathYear: 209, stats: { leadership: 35, war: 25, intelligence: 95, politics: 70, charisma: 88 } },

  // Anti-Cao Cao plotter — Yiling
  { id: 'zhang-nan',    name: { en: 'Zhang Nan',     zh: '張南'   },                                                                                            birthYear: 180, deathYear: 222, stats: { leadership: 65, war: 75, intelligence: 55, politics: 50, charisma: 60 } },

  // Xun family senior
  { id: 'xun-jin',      name: { en: 'Xun Gun',       zh: '荀緄'   },                                                                                            birthYear: 125, deathYear: 190, stats: { leadership: 50, war: 30, intelligence: 80, politics: 82, charisma: 78 } },

  // ─── Phase 47 — Big roster expansion ───────────────────────
  // Cao Cao's early officers
  { id: 'wang-zhong',   name: { en: 'Wang Zhong',    zh: '王忠'   },                                                                                            birthYear: 165, deathYear: 215, stats: { leadership: 65, war: 70, intelligence: 55, politics: 50, charisma: 55 } },
  { id: 'bian-lan',     name: { en: 'Bian Lan',      zh: '卞蘭'   },                                                                                            birthYear: 195, deathYear: 250, stats: { leadership: 50, war: 50, intelligence: 65, politics: 65, charisma: 70 } },
  { id: 'sima-zhi',     name: { en: 'Sima Zhi',      zh: '司馬芝' }, courtesyName: { en: 'Ziwen',       zh: '子華' }, birthYear: 175, deathYear: 247, hometownCityId: 'luoyang', stats: { leadership: 55, war: 35, intelligence: 80, politics: 85, charisma: 75 } },

  // Liu Bei / Guan Yu's officers
  { id: 'zhao-lei',     name: { en: 'Zhao Lei',      zh: '趙累'   },                                                                                            birthYear: 175, deathYear: 219, stats: { leadership: 65, war: 60, intelligence: 70, politics: 65, charisma: 65 } },
  { id: 'wang-fu',      name: { en: 'Wang Fu',       zh: '王甫'   }, courtesyName: { en: 'Guoshan',     zh: '國山' }, birthYear: 170, deathYear: 222, stats: { leadership: 55, war: 50, intelligence: 75, politics: 75, charisma: 72 } },
  { id: 'li-mi-shu',    name: { en: 'Li Mi',         zh: '李密'   }, courtesyName: { en: 'Lingbo',      zh: '令伯' }, birthYear: 224, deathYear: 287, stats: { leadership: 35, war: 25, intelligence: 88, politics: 80, charisma: 92 } },

  // Wu corrupt minister & late commander
  { id: 'lu-yi-wu',     name: { en: 'Lu Yi',         zh: '呂壹'   },                                                                                            birthYear: 195, deathYear: 238, stats: { leadership: 35, war: 25, intelligence: 65, politics: 55, charisma: 50 } },
  { id: 'shen-ying',    name: { en: 'Shen Ying',     zh: '沈瑩'   },                                                                                            birthYear: 235, deathYear: 280, stats: { leadership: 78, war: 80, intelligence: 70, politics: 65, charisma: 70 } },
  { id: 'quan-ji',      name: { en: 'Quan Ji',       zh: '全紀'   },                                                                                            birthYear: 215, deathYear: 260, stats: { leadership: 60, war: 65, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'zhu-cai',      name: { en: 'Zhu Cai',       zh: '朱才'   },                                                                                            birthYear: 195, deathYear: 230, stats: { leadership: 65, war: 65, intelligence: 60, politics: 60, charisma: 65 } },

  // Wei mid-late
  { id: 'yang-xin',     name: { en: 'Yang Xin',      zh: '楊欣'   },                                                                                            birthYear: 215, deathYear: 280, stats: { leadership: 70, war: 75, intelligence: 65, politics: 60, charisma: 65 } },
  { id: 'wang-ye',      name: { en: 'Wang Ye',       zh: '王業'   },                                                                                            birthYear: 205, deathYear: 268, stats: { leadership: 50, war: 45, intelligence: 72, politics: 72, charisma: 68 } },

  // Jin scholars and wealthy figures
  { id: 'xun-xu',       name: { en: 'Xun Xu',        zh: '荀勖'   }, courtesyName: { en: 'Gongceng',    zh: '公曾' }, birthYear: 218, deathYear: 289, stats: { leadership: 35, war: 25, intelligence: 88, politics: 78, charisma: 75 } },
  { id: 'shi-chong',    name: { en: 'Shi Chong',     zh: '石崇'   }, courtesyName: { en: 'Jilun',       zh: '季倫' }, birthYear: 249, deathYear: 300, stats: { leadership: 40, war: 30, intelligence: 78, politics: 65, charisma: 88 } },
  { id: 'wang-kai-jin', name: { en: 'Wang Kai',      zh: '王愷'   }, courtesyName: { en: 'Junfu',       zh: '君夫' }, birthYear: 232, deathYear: 305, stats: { leadership: 35, war: 25, intelligence: 70, politics: 65, charisma: 80 } },
  { id: 'lu-wan',       name: { en: 'Lu Wan',        zh: '陸玩'   }, courtesyName: { en: 'Shihuan',     zh: '士瑤' }, birthYear: 278, deathYear: 342, stats: { leadership: 45, war: 30, intelligence: 78, politics: 78, charisma: 78 } },

  // Jin princes (War of Eight Princes)
  { id: 'sima-jiong',   name: { en: 'Sima Jiong',    zh: '司馬冏' }, courtesyName: { en: 'Jingzhi',     zh: '景治' }, birthYear: 275, deathYear: 302, stats: { leadership: 60, war: 65, intelligence: 60, politics: 55, charisma: 70 } },
  { id: 'sima-yu',      name: { en: 'Sima Yu',       zh: '司馬遹' }, courtesyName: { en: 'Xizu',        zh: '熙祖' }, birthYear: 278, deathYear: 300, stats: { leadership: 45, war: 50, intelligence: 65, politics: 50, charisma: 65 } },

  // Liu Yu's frontier — northeast loyalists
  { id: 'zou-dan',      name: { en: 'Zou Dan',       zh: '鄒丹'   },                                                                                            birthYear: 160, deathYear: 198, stats: { leadership: 60, war: 65, intelligence: 55, politics: 50, charisma: 55 } },

  // Liu Biao's nephew
  { id: 'wang-kai-jx',  name: { en: 'Wang Kai',      zh: '王凱'   },                                                                                            birthYear: 168, deathYear: 215, stats: { leadership: 50, war: 45, intelligence: 70, politics: 65, charisma: 65 } },

  // Wu Shan-Yue and frontier rebels
  { id: 'zhang-cheng',  name: { en: 'Zhang Cheng',   zh: '張承'   }, courtesyName: { en: 'Zhongsi',     zh: '仲嗣' }, birthYear: 178, deathYear: 244, stats: { leadership: 60, war: 50, intelligence: 78, politics: 75, charisma: 70 } },

  // Cao Wei's Jingzhou frontline
  { id: 'jia-fan',      name: { en: 'Jia Fan',       zh: '賈範'   },                                                                                            birthYear: 180, deathYear: 228, stats: { leadership: 60, war: 65, intelligence: 65, politics: 60, charisma: 60 } },
  { id: 'su-yu',        name: { en: 'Su Yu',         zh: '蘇愉'   },                                                                                            birthYear: 175, deathYear: 230, stats: { leadership: 55, war: 50, intelligence: 70, politics: 70, charisma: 65 } },

  // Shu — extra
  { id: 'chen-shu',     name: { en: 'Chen Shu',      zh: '陳術'   }, courtesyName: { en: 'Shenbo',      zh: '申伯' }, birthYear: 195, deathYear: 260, stats: { leadership: 40, war: 30, intelligence: 78, politics: 70, charisma: 75 } },
  { id: 'liao-chun',    name: { en: 'Liao Chun',     zh: '廖淳'   },                                                                                            birthYear: 215, deathYear: 280, stats: { leadership: 60, war: 65, intelligence: 60, politics: 55, charisma: 60 } },

  // Famed Wei diplomats and officials
  { id: 'jian-yi',      name: { en: 'Jian Yi',       zh: '蹇義'   }, courtesyName: { en: 'Yifu',        zh: '宜父' }, birthYear: 170, deathYear: 240, stats: { leadership: 45, war: 30, intelligence: 78, politics: 80, charisma: 78 } },

  // Late Han historians and scholars
  { id: 'sima-biao',    name: { en: 'Sima Biao',     zh: '司馬彪' }, courtesyName: { en: 'Shaotong',    zh: '紹統' }, birthYear: 240, deathYear: 306, stats: { leadership: 35, war: 25, intelligence: 88, politics: 75, charisma: 75 } },
  { id: 'huafu',        name: { en: 'Hua Fu',        zh: '華覈'   }, courtesyName: { en: 'Yongxian',    zh: '永先' }, birthYear: 218, deathYear: 278, stats: { leadership: 40, war: 25, intelligence: 80, politics: 78, charisma: 75 } },
  { id: 'yang-xian',    name: { en: 'Yang Xian',     zh: '楊獻'   },                                                                                            birthYear: 195, deathYear: 260, stats: { leadership: 60, war: 60, intelligence: 70, politics: 65, charisma: 60 } },

  // Yuan family kin
  { id: 'yuan-cheng',   name: { en: 'Yuan Cheng',    zh: '袁成'   },                                                                                            birthYear: 130, deathYear: 175, stats: { leadership: 55, war: 50, intelligence: 70, politics: 70, charisma: 70 } },
  { id: 'yuan-feng',    name: { en: 'Yuan Feng',     zh: '袁逢'   },                                                                                            birthYear: 132, deathYear: 187, stats: { leadership: 55, war: 40, intelligence: 75, politics: 80, charisma: 72 } },

  // Wei-Jin transition extras
  { id: 'liu-shi',      name: { en: 'Liu Shi',       zh: '劉寔'   }, courtesyName: { en: 'Ziohen',      zh: '子真' }, birthYear: 220, deathYear: 310, stats: { leadership: 40, war: 25, intelligence: 80, politics: 80, charisma: 80 } },
  { id: 'zhang-mao-jin',name: { en: 'Zhang Mao',     zh: '張茂'   },                                                                                            birthYear: 277, deathYear: 324, stats: { leadership: 70, war: 65, intelligence: 75, politics: 75, charisma: 70 } },

  // Cao clan extras
  { id: 'cao-zhao',     name: { en: 'Cao Zhao',      zh: '曹肇'   }, courtesyName: { en: 'Changsi',     zh: '長思' }, birthYear: 200, deathYear: 244, stats: { leadership: 65, war: 65, intelligence: 70, politics: 65, charisma: 70 } },

  // Northern frontier
  { id: 'wuhuan-tuli',  name: { en: 'Wuhuan Tuli',   zh: '塌頓部' },                                                                                            birthYear: 170, deathYear: 207, stats: { leadership: 65, war: 75, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'wuyan',        name: { en: 'Wu Yan',        zh: '烏延'   },                                                                                            birthYear: 165, deathYear: 207, stats: { leadership: 60, war: 72, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'nan-lou',      name: { en: 'Nan Lou',       zh: '難樓'   },                                                                                            birthYear: 168, deathYear: 215, stats: { leadership: 60, war: 70, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'supuyan',      name: { en: 'Subuyan',       zh: '蘇仆延' },                                                                                            birthYear: 170, deathYear: 207, stats: { leadership: 65, war: 72, intelligence: 50, politics: 40, charisma: 55 } },

  // Wei generals at the Wu front
  { id: 'man-wei',      name: { en: 'Man Wei',       zh: '滿偉'   },                                                                                            birthYear: 195, deathYear: 255, stats: { leadership: 60, war: 60, intelligence: 65, politics: 65, charisma: 65 } },
  { id: 'shi-miao',     name: { en: 'Shi Miao',      zh: '時苗'   }, courtesyName: { en: 'Deji',        zh: '德胄' }, birthYear: 165, deathYear: 230, stats: { leadership: 40, war: 30, intelligence: 78, politics: 82, charisma: 78 } },

  // Wu — Sun Yi's wife and avengers (after his assassination)
  { id: 'sun-shao-wu',  name: { en: 'Sun Shao',      zh: '孫紹'   },                                                                                            birthYear: 198, deathYear: 247, stats: { leadership: 60, war: 60, intelligence: 65, politics: 65, charisma: 65 } },

  // ─── Phase 48 — Massive expansion: Jin literati, frontier rebels, Shu obscurities ───
  // Shu — late-era officers
  { id: 'gou-fu',       name: { en: 'Gou Fu',        zh: '句扶'   }, courtesyName: { en: 'Xiaoxing',    zh: '孝興' }, birthYear: 185, deathYear: 250, stats: { leadership: 75, war: 80, intelligence: 65, politics: 60, charisma: 65 } },
  { id: 'wang-kang',    name: { en: 'Wang Kang',     zh: '王伉'   },                                                                                            birthYear: 190, deathYear: 245, stats: { leadership: 70, war: 65, intelligence: 70, politics: 70, charisma: 65 } },
  { id: 'he-zhi',       name: { en: 'He Zhi',        zh: '何祗'   }, courtesyName: { en: 'Junsu',       zh: '君肅' }, birthYear: 195, deathYear: 250, stats: { leadership: 45, war: 40, intelligence: 78, politics: 75, charisma: 75 } },
  { id: 'du-wei',       name: { en: 'Du Wei',        zh: '杜微'   }, courtesyName: { en: 'Guofu',       zh: '國輔' }, birthYear: 168, deathYear: 240, hometownCityId: 'chengdu', stats: { leadership: 30, war: 20, intelligence: 78, politics: 70, charisma: 72 } },
  { id: 'ma-qi',        name: { en: 'Ma Qi',         zh: '馬齊'   }, courtesyName: { en: 'Chengbo',     zh: '承伯' }, birthYear: 185, deathYear: 240, stats: { leadership: 50, war: 45, intelligence: 75, politics: 75, charisma: 70 } },

  // Wu prodigies & sons
  { id: 'shen-you',     name: { en: 'Shen You',      zh: '沈友'   }, courtesyName: { en: 'Zizheng',     zh: '子正' }, birthYear: 176, deathYear: 204, stats: { leadership: 55, war: 65, intelligence: 88, politics: 70, charisma: 82 } },
  { id: 'zhu-ji-wu',    name: { en: 'Zhu Ji',        zh: '朱績'   }, courtesyName: { en: 'Gongxu',      zh: '公緒' }, birthYear: 202, deathYear: 270, stats: { leadership: 78, war: 78, intelligence: 70, politics: 70, charisma: 72 } },
  { id: 'zhou-chu',     name: { en: 'Zhou Chu',      zh: '周處'   }, courtesyName: { en: 'Ziyin',       zh: '子隱' }, birthYear: 236, deathYear: 297, stats: { leadership: 80, war: 88, intelligence: 75, politics: 70, charisma: 80 } },
  { id: 'dai-yuan',     name: { en: 'Dai Yuan',      zh: '戴員'   },                                                                                            birthYear: 175, deathYear: 204, stats: { leadership: 50, war: 50, intelligence: 60, politics: 55, charisma: 55 } },
  { id: 'bian-hong',    name: { en: 'Bian Hong',     zh: '邊洪'   },                                                                                            birthYear: 175, deathYear: 204, stats: { leadership: 45, war: 65, intelligence: 50, politics: 40, charisma: 50 } },

  // Imperial family / late Han court
  { id: 'liu-hong-em',  name: { en: 'Emperor Ling',  zh: '漢靈帝' },                                                                                            birthYear: 156, deathYear: 189, stats: { leadership: 30, war: 25, intelligence: 50, politics: 35, charisma: 60 } },
  { id: 'tang-ji',      name: { en: 'Lady Tang',     zh: '唐姬'   },                                                                                            birthYear: 176, deathYear: 220, stats: { leadership: 25, war: 15, intelligence: 60, politics: 55, charisma: 85 } },
  { id: 'dong-bai',     name: { en: 'Dong Bai',      zh: '董白'   },                                                                                            birthYear: 183, deathYear: 192, stats: { leadership: 20, war: 15, intelligence: 50, politics: 30, charisma: 75 } },

  // Huang Zu's officers
  { id: 'chen-jiu-hz',  name: { en: 'Chen Jiu',      zh: '陳就'   },                                                                                            birthYear: 168, deathYear: 208, hometownCityId: 'jiangxia', stats: { leadership: 60, war: 70, intelligence: 50, politics: 45, charisma: 55 } },
  { id: 'deng-long',    name: { en: 'Deng Long',     zh: '鄧龍'   },                                                                                            birthYear: 170, deathYear: 208, hometownCityId: 'jiangxia', stats: { leadership: 60, war: 68, intelligence: 50, politics: 45, charisma: 55 } },

  // Liang Province generals (under Han Sui / Ma Chao)
  { id: 'cheng-yin',    name: { en: 'Cheng Yin',     zh: '程銀'   },                                                                                            birthYear: 168, deathYear: 215, stats: { leadership: 65, war: 72, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'li-kan',       name: { en: 'Li Kan',        zh: '李堪'   },                                                                                            birthYear: 165, deathYear: 211, stats: { leadership: 60, war: 70, intelligence: 50, politics: 40, charisma: 55 } },
  { id: 'zhang-heng-lw',name: { en: 'Zhang Heng',    zh: '張橫'   },                                                                                            birthYear: 165, deathYear: 215, stats: { leadership: 60, war: 70, intelligence: 50, politics: 40, charisma: 55 } },

  // Black Mountain bandits
  { id: 'sui-gu',       name: { en: 'Sui Gu',        zh: '眭固'   }, courtesyName: { en: 'Baitu',       zh: '白兔' }, birthYear: 165, deathYear: 199, stats: { leadership: 65, war: 72, intelligence: 55, politics: 45, charisma: 55 } },
  { id: 'zhang-baiqi',  name: { en: 'Zhang Baiqi',   zh: '張白騎' },                                                                                            birthYear: 168, deathYear: 210, stats: { leadership: 60, war: 70, intelligence: 55, politics: 40, charisma: 55 } },
  { id: 'yu-digen',     name: { en: 'Yu Digen',      zh: '于氐根' },                                                                                            birthYear: 170, deathYear: 210, stats: { leadership: 58, war: 65, intelligence: 50, politics: 40, charisma: 50 } },

  // Gongsun / Bao brothers
  { id: 'gongsun-yue',  name: { en: 'Gongsun Yue',   zh: '公孫越' },                                                                                            birthYear: 158, deathYear: 191, hometownCityId: 'beiping', stats: { leadership: 65, war: 70, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'bao-tao',      name: { en: 'Bao Tao',       zh: '鮑韜'   },                                                                                            birthYear: 156, deathYear: 192, stats: { leadership: 60, war: 65, intelligence: 60, politics: 55, charisma: 60 } },

  // Cao Wei mid-tier officers (Hanzhong / Wu fronts)
  { id: 'lu-zhao-cw',   name: { en: 'Lu Zhao',       zh: '路招'   },                                                                                            birthYear: 175, deathYear: 230, stats: { leadership: 65, war: 65, intelligence: 60, politics: 55, charisma: 60 } },
  { id: 'zhu-gai',      name: { en: 'Zhu Gai',       zh: '朱蓋'   },                                                                                            birthYear: 178, deathYear: 238, stats: { leadership: 65, war: 68, intelligence: 55, politics: 50, charisma: 55 } },
  { id: 'yin-shu',      name: { en: 'Yin Shu',       zh: '殷署'   },                                                                                            birthYear: 175, deathYear: 235, stats: { leadership: 60, war: 65, intelligence: 60, politics: 55, charisma: 55 } },

  // Western Jin literati (the Sanguo's literary inheritors)
  { id: 'lu-yun-jin',   name: { en: 'Lu Yun',        zh: '陸雲'   }, courtesyName: { en: 'Shilong',     zh: '士龍' }, birthYear: 262, deathYear: 303, hometownCityId: 'wu', stats: { leadership: 45, war: 30, intelligence: 88, politics: 72, charisma: 82 } },
  { id: 'pan-yue',      name: { en: 'Pan Yue',       zh: '潘岳'   }, courtesyName: { en: 'Anren',       zh: '安仁' }, birthYear: 247, deathYear: 300, stats: { leadership: 35, war: 30, intelligence: 86, politics: 65, charisma: 95 } },
  { id: 'zuo-si',       name: { en: 'Zuo Si',        zh: '左思'   }, courtesyName: { en: 'Taichong',    zh: '太沖' }, birthYear: 250, deathYear: 305, stats: { leadership: 30, war: 25, intelligence: 90, politics: 65, charisma: 65 } },
  { id: 'liu-kun',      name: { en: 'Liu Kun',       zh: '劉琨'   }, courtesyName: { en: 'Yueshi',      zh: '越石' }, birthYear: 271, deathYear: 318, stats: { leadership: 78, war: 70, intelligence: 82, politics: 72, charisma: 88 } },
  { id: 'zhi-yu',       name: { en: 'Zhi Yu',        zh: '摯虞'   }, courtesyName: { en: 'Zhongqia',    zh: '仲洽' }, birthYear: 250, deathYear: 311, stats: { leadership: 30, war: 20, intelligence: 86, politics: 75, charisma: 75 } },
  { id: 'duan-zhuo',    name: { en: 'Duan Zhuo',     zh: '段灼'   }, courtesyName: { en: 'Xiuran',      zh: '休然' }, birthYear: 215, deathYear: 285, stats: { leadership: 60, war: 50, intelligence: 78, politics: 75, charisma: 72 } },
  { id: 'jia-mi-jin',   name: { en: 'Jia Mi',        zh: '賈謐'   },                                                                                            birthYear: 270, deathYear: 300, stats: { leadership: 40, war: 30, intelligence: 65, politics: 50, charisma: 70 } },

  // Han ministers
  { id: 'zhang-fan-wei',name: { en: 'Zhang Fan',     zh: '張範'   }, courtesyName: { en: 'Gongyi',      zh: '公儀' }, birthYear: 158, deathYear: 212, stats: { leadership: 40, war: 30, intelligence: 80, politics: 78, charisma: 82 } },
  { id: 'zhang-cheng-wei',name:{ en: 'Zhang Cheng',  zh: '張承'   },                                                                                            birthYear: 160, deathYear: 214, stats: { leadership: 50, war: 40, intelligence: 75, politics: 75, charisma: 72 } },

  // Han loyalists & late officials
  { id: 'liu-zhen-han', name: { en: 'Liu Chen',      zh: '劉陳'   },                                                                                            birthYear: 158, deathYear: 200, stats: { leadership: 60, war: 60, intelligence: 70, politics: 70, charisma: 70 } },
  { id: 'jin-shang',    name: { en: 'Jin Shang',     zh: '金尚'   }, courtesyName: { en: 'Yuanxiu',     zh: '元休' }, birthYear: 150, deathYear: 197, stats: { leadership: 50, war: 40, intelligence: 70, politics: 72, charisma: 70 } },

  // Wu Shan-Yue and frontier
  { id: 'huang-rang',   name: { en: 'Huang Rang',    zh: '黃穰'   },                                                                                            birthYear: 145, deathYear: 184, stats: { leadership: 65, war: 70, intelligence: 55, politics: 45, charisma: 60 } },

  // Sima clan extras
  { id: 'sima-quan',    name: { en: 'Sima Quan',     zh: '司馬權' }, courtesyName: { en: 'Ziyu',        zh: '子輿' }, birthYear: 205, deathYear: 273, stats: { leadership: 60, war: 50, intelligence: 75, politics: 70, charisma: 68 } },
  { id: 'sima-tai',     name: { en: 'Sima Tai',      zh: '司馬泰' },                                                                                            birthYear: 210, deathYear: 283, stats: { leadership: 55, war: 45, intelligence: 72, politics: 70, charisma: 65 } },

  // Cao Wei strategic
  { id: 'gao-tang-long',name: { en: 'Gao Tanglong',  zh: '高堂隆' }, courtesyName: { en: 'Shengping',   zh: '升平' }, birthYear: 175, deathYear: 237, stats: { leadership: 45, war: 30, intelligence: 80, politics: 82, charisma: 78 } },

  // Famous handsome poet & late tribute
  { id: 'cao-shu',      name: { en: 'Cao Shu',       zh: '曹叔'   },                                                                                            birthYear: 200, deathYear: 268, stats: { leadership: 55, war: 60, intelligence: 65, politics: 60, charisma: 65 } },

  // Wu — Sun He's son (later Emperor Hao's brother)
  { id: 'sun-de-er',    name: { en: 'Sun De',        zh: '孫德'   },                                                                                            birthYear: 240, deathYear: 280, stats: { leadership: 50, war: 50, intelligence: 60, politics: 55, charisma: 60 } },

  // ── Phase 49 — Additional historical figures ──
  // Wei kinsmen and frontier commanders
  { id: 'xiahou-wei',   name: { en: 'Xiahou Wei',    zh: '夏侯威' }, courtesyName: { en: 'Jiquan',    zh: '季權' }, birthYear: 196, deathYear: 249, hometownCityId: 'xiaopei', stats: { leadership: 76, war: 72, intelligence: 70, politics: 68, charisma: 70 } },
  { id: 'xiahou-mao',   name: { en: 'Xiahou Mao',    zh: '夏侯楙' }, courtesyName: { en: 'Zilin',     zh: '子林' }, birthYear: 190, deathYear: 245, hometownCityId: 'xiaopei', stats: { leadership: 38, war: 42, intelligence: 50, politics: 45, charisma: 55 } },
  { id: 'xiahou-hui',   name: { en: 'Xiahou Hui',    zh: '夏侯徽' }, courtesyName: { en: 'Yuanrong',  zh: '媛容' }, birthYear: 211, deathYear: 234, hometownCityId: 'xiaopei', stats: { leadership: 35, war: 25, intelligence: 80, politics: 75, charisma: 85 } },
  { id: 'wang-shuang',  name: { en: 'Wang Shuang',   zh: '王雙'   },                                                                                            birthYear: 195, deathYear: 229, stats: { leadership: 72, war: 86, intelligence: 50, politics: 40, charisma: 60 } },
  { id: 'wang-ji',      name: { en: 'Wang Ji',       zh: '王基'   }, courtesyName: { en: 'Boyu',      zh: '伯輿' }, birthYear: 190, deathYear: 261, stats: { leadership: 86, war: 75, intelligence: 84, politics: 78, charisma: 72 } },
  { id: 'fu-shi',       name: { en: 'Fu Shi',        zh: '傅嘏'   }, courtesyName: { en: 'Lanshi',    zh: '蘭石' }, birthYear: 209, deathYear: 255, stats: { leadership: 55, war: 35, intelligence: 88, politics: 85, charisma: 72 } },
  { id: 'tian-chou',    name: { en: 'Tian Chou',     zh: '田疇'   }, courtesyName: { en: 'Zitai',     zh: '子泰' }, birthYear: 169, deathYear: 214, stats: { leadership: 78, war: 70, intelligence: 84, politics: 80, charisma: 85 } },
  { id: 'cao-jiong',    name: { en: 'Cao Jiong',     zh: '曹冏'   }, courtesyName: { en: 'Yuanshou',  zh: '元首' }, birthYear: 215, deathYear: 275, stats: { leadership: 45, war: 30, intelligence: 85, politics: 78, charisma: 75 } },
  { id: 'wang-shen',    name: { en: 'Wang Shen',     zh: '王沈'   }, courtesyName: { en: 'Chudao',    zh: '處道' }, birthYear: 213, deathYear: 266, stats: { leadership: 55, war: 35, intelligence: 86, politics: 82, charisma: 70 } },
  { id: 'liu-zhen',     name: { en: 'Liu Zhen',      zh: '劉楨'   }, courtesyName: { en: 'Gonggan',   zh: '公幹' }, birthYear: 186, deathYear: 217, stats: { leadership: 30, war: 25, intelligence: 88, politics: 60, charisma: 88 } },

  // Shu late-era successors and scholars
  { id: 'zhang-zun',    name: { en: 'Zhang Zun',     zh: '張遵'   },                                                                                            birthYear: 230, deathYear: 263, stats: { leadership: 70, war: 78, intelligence: 60, politics: 55, charisma: 65 } },
  { id: 'fu-qi',        name: { en: 'Fu Qian',       zh: '傅僉'   },                                                                                            birthYear: 230, deathYear: 263, hometownCityId: 'xinye', stats: { leadership: 82, war: 84, intelligence: 70, politics: 60, charisma: 75 } },
  { id: 'fa-miao',      name: { en: 'Fa Miao',       zh: '法邈'   },                                                                                            birthYear: 210, deathYear: 263, stats: { leadership: 55, war: 45, intelligence: 78, politics: 72, charisma: 70 } },
  { id: 'meng-guang',   name: { en: 'Meng Guang',    zh: '孟光'   }, courtesyName: { en: 'Xiaoyu',    zh: '孝裕' }, birthYear: 155, deathYear: 264, stats: { leadership: 30, war: 20, intelligence: 88, politics: 75, charisma: 78 } },
  { id: 'xing-cai',     name: { en: 'Xing Cai',      zh: '星彩'   },                                                                                            birthYear: 207, deathYear: 261, stats: { leadership: 60, war: 76, intelligence: 65, politics: 60, charisma: 85 } },

  // Wu late-era figures and scholars
  { id: 'wang-fan',     name: { en: 'Wang Fan',      zh: '王蕃'   }, courtesyName: { en: 'Yongyuan',  zh: '永元' }, birthYear: 228, deathYear: 266, stats: { leadership: 25, war: 20, intelligence: 95, politics: 60, charisma: 70 } },

  // Nanman tribal leaders and figures
  { id: 'zhurong',      name: { en: 'Lady Zhurong',  zh: '祝融夫人' },                                                                                          birthYear: 200, deathYear: 250, hometownCityId: 'nanzhong', stats: { leadership: 70, war: 88, intelligence: 55, politics: 45, charisma: 80 } },
  { id: 'mulu-da',      name: { en: 'King Mulu',     zh: '木鹿大王' },                                                                                          birthYear: 190, deathYear: 225, stats: { leadership: 65, war: 80, intelligence: 70, politics: 45, charisma: 70 } },
  { id: 'jin-huan',     name: { en: 'Jinhuan Sanjie',zh: '金環三結' },                                                                                          birthYear: 195, deathYear: 225, hometownCityId: 'nanzhong', stats: { leadership: 60, war: 78, intelligence: 35, politics: 30, charisma: 55 } },
  { id: 'dong-tu-na',   name: { en: 'Dong Tuna',     zh: '董荼那' },                                                                                            birthYear: 195, deathYear: 225, stats: { leadership: 62, war: 75, intelligence: 50, politics: 40, charisma: 55 } },
];

// Canonical item ownership across all scenarios. Each item can have
// only one bearer at a time; inheritance is resolved by who's alive.
const CANONICAL_ITEMS_PRIMARY: Record<string, string> = {
  'lu-bu':       'sky-piercer',
  'guan-yu':     'green-dragon',
  'zhang-fei':   'snake-spear',
  'cao-cao':     'yitian',
  'zhao-yun':    'dragon-gut',
  'liu-bei':     'twin-swords',
  'zhuge-liang': 'meng-de-xinshu',
  'zhang-jiao':  'taiping',
  // Phase 30 additions
  'ji-ling':     'sanjian-liangren',
  'pang-de':     'fengzui-dao',
  'cheng-pu':    'tiejisha-mao',
  'wang-shuang': 'liuxing-chui',
  'dian-wei':    'guzhi-shuang-ji',
  'jiang-wei':   'bingfa-ershisi',
  'zhong-yao':   'lanting-xu',
  'deng-ai':     'sushu',
  'zhong-hui':   'sunzi-bingfa',
  'chen-qun':    'zuozhuan',
  'sima-shi':    'taigong-bingfa',
  // Phase 30b — only new (non-conflicting) officer-to-item assignments.
  'sun-ce':      'liang-yin-ji',
  'huang-gai':   'shuang-bian',
  'zhang-xiu':   'wujin-gong',
  'cao-zhang':   'huolong-ju',
  'pang-tong':   'san-lue',
  'fa-zheng':    'wei-liaozi',
  'lu-su':       'dao-de-jing',
  'sima-yi':     'shi-ji',
  'huo-jun':     'longlin-kai',
  'zhuge-jin':   'hechang-yuyi',
  // Phase 30c — owners of new items
  'huang-zhong': 'tietai-gong',         // Iron-Body Bow
  'hua-xiong':   'datu-jian',           // Great Bone Sabre
  'cao-pi':      'qibao-dao',           // Seven-Treasure Saber
  'cai-yan':     'lienv-zhuan',         // Biographies of Exemplary Women
  'zheng-xuan':  'han-shu',             // Book of Han
  'xu-shu':      'zhanguo-ce',          // Stratagems of the Warring States
  'lu-xun':      'yue-jue-shu',         // Lost Annals of Yue
  'lu-kai':      'houhan-ji',           // Annals of the Later Han
  'wei-guan':    'banma-fu',            // Tiger Tally
  // ─── 歷代名將 — historically-canonical items ───
  // 春秋戰國
  'hist-jiang-ziya':  'taigong-liutao',     // 太公兵法 / 六韜 (he wrote it)
  'hist-laozi':       'dao-de-jing',        // 道德經 — author owns it
  'hist-guiguzi':     'guiguzi',            // 鬼谷子 book
  'hist-han-fei':     'hanfeizi',           // 韓非子 — author
  'hist-shang-yang':  'shangjun-shu',       // 商君書 — author
  'hist-sun-bin':     'sunbin-bingfa',      // 孫臏兵法 — author
  'hist-zhuan-zhu':   'yuchang-jian',       // 魚腸劍 — 專諸藏魚腹刺王僚
  'hist-helu':        'ganjiang-jian',      // 干將莫邪為闔閭鑄劍
  'hist-fuchai':      'moye-jian',          // 莫邪雌劍 — 夫差
  'hist-goujian':     'zhanlu-jian',        // 越王勾踐劍
  'hist-yang-youji':  'vermilion-bow',      // 彤弓 — 神射手養由基
  // 秦楚漢
  'hist-qin-shihuang':'taiya-jian',         // 太阿劍 — 秦皇佩劍
  'hist-xiang-yu':    'baqiang',            // 霸王槍
  'hist-han-xin':     'qixing-jian',        // 七星龍泉劍
  // 兩漢
  'hist-sima-qian':   'shi-ji',             // 史記 — author
  'hist-wang-chong':  'lunheng',            // 論衡 — author (override Confucius placeholder above)
  'hist-ban-gu':      'han-shu',            // 漢書 — author
  // 兩晉 / 南北朝
  'hist-wang-xizhi':  'lanting-xu',         // 蘭亭集序 — author (overriding zhong-yao TKM)
  'hist-liu-yiqing':  'shi-shuo-xinyu',     // 世說新語 — author
  // 唐
  'hist-tang-taizong':'xuanyuan-jian',      // 軒轅劍 — 天子佩 (legendary)
  'hist-li-jing':     'mingguang-armor',    // 明光鎧 — 唐將
  'hist-yuchi-gong':  'lion-helm',          // 獅頭盔 — 唐將
  // 五代/遼/西夏
  // (canonical chains for these can be added later if needed)
  // 宋
  'hist-yue-fei':     'liquan-qiang',       // 瀝泉槍
  'hist-han-shizhong':'shuang-jian',        // 雙鐧
  'hist-yang-ye':     'jin-dao',            // 金刀
  'hist-yang-zongbao':'yangjia-qiang',      // 楊家槍
  'hist-mu-guiying':  'jianglong-mu',       // 降龍木
  // 明
  'hist-zheng-he':    'baochuan',           // 寶船
  'hist-qi-jiguang':  'qijia-dao',          // 戚家刀 (and 紀效新書 via chain)
  'hist-yu-dayou':    'jixiao-xinshu',      // 紀效新書 — 戚繼光 主, 但俞大猷亦兵書家
  'hist-zheng-chenggong': 'guoxing-jian',   // 國姓爺寶劍
  // 清
  'hist-zeng-guofan': 'zeng-jiaxun',        // 曾文正公家書
  'hist-lin-zexu':    'fenglu-shen-shou',   // 銷煙劍
};

// Sun family sword passes Sun Jian → Sun Ce → Sun Quan.
// Imperial seal passes Sun Jian (192) → Yuan Shu → Cao Cao → ...
// Red Hare goes Dong Zhuo/Lu Bu → Guan Yu.
// We resolve each by picking the oldest alive owner from the chain.
const ITEM_CHAINS: Array<{ itemId: string; ownerChain: string[] }> = [
  { itemId: 'gu-ding',       ownerChain: ['sun-jian', 'sun-ce', 'sun-quan'] },
  { itemId: 'imperial-seal', ownerChain: ['sun-jian', 'yuan-shu', 'cao-cao', 'sun-quan'] },
  { itemId: 'red-hare',      ownerChain: ['lu-bu', 'guan-yu'] },
  { itemId: 'dilu',          ownerChain: ['liu-bei'] },
  // ─── 歷代名將 chains — classics get the historical author first ───
  // 烏騅 — 項羽 first, then unowned across history
  { itemId: 'wuzhui',        ownerChain: ['hist-xiang-yu'] },
  // 孫子兵法 — 孫武 (春秋) first then 韓信 then Tang 李靖 then 鍾會 (TKM)
  { itemId: 'sunzi-bingfa',  ownerChain: ['hist-sun-wu', 'hist-han-xin', 'hist-li-jing', 'zhong-hui'] },
  // 太公兵法 — 姜子牙 (already CANONICAL) → fallback chain 張良 → 司馬師
  { itemId: 'taigong-bingfa',ownerChain: ['hist-jiang-ziya', 'hist-zhang-liang', 'sima-shi'] },
  // 道德經 — 老子 → 莊周 → 嵇康 → 陶弘景 → 魯肅
  { itemId: 'dao-de-jing',   ownerChain: ['hist-laozi', 'hist-zhuangzi', 'hist-ji-kang', 'hist-tao-hongjing', 'lu-su'] },
  // 史記 — 司馬遷 (author) → 班固 → 司馬懿
  { itemId: 'shi-ji',        ownerChain: ['hist-sima-qian', 'hist-ban-gu', 'sima-yi'] },
  // 漢書 — 班固 (author) → 班昭 → 鄭玄
  { itemId: 'han-shu',       ownerChain: ['hist-ban-gu', 'hist-ban-zhao', 'zheng-xuan'] },
  // 戰國策 — 蘇秦 → 張儀 → 徐庶
  { itemId: 'zhanguo-ce',    ownerChain: ['hist-su-qin', 'hist-zhang-yi', 'xu-shu'] },
  // 左傳 — 春秋史 → 子產 → 陳群
  { itemId: 'zuozhuan',      ownerChain: ['hist-zi-chan', 'hist-confucius', 'chen-qun'] },
  // 韓非子 — already primary for hist-han-fei
  // 鬼谷子 — already primary
  // 商君書 — already primary
  // 蘭亭集序 — already primary for hist-wang-xizhi (overrides zhong-yao)
];

// Pre-220 canonical items reassign on death. We'll keep this simple
// by just listing item ownership snapshots per officer.
// (Sun family sword is inherited Sun Jian → Sun Ce → Sun Quan; we
//  resolve by picking the alive owner.)

export function buildInitialOfficers(
  assignments: Record<string, { forceId: string; cityId: string }>,
  deadIds: string[] = [],
  scenarioYear?: number,
): Officer[] {
  const dead = new Set(deadIds);
  const isDead = (t: OfficerTemplate) =>
    dead.has(t.id) ||
    (scenarioYear !== undefined &&
      t.deathYear !== undefined &&
      t.deathYear < scenarioYear &&
      !assignments[t.id]);
  // Build all-officer template index for chain lookups.
  const allTemplates = [...OFFICER_TEMPLATES, ...TALENT_POOL_TEMPLATES];
  const templateById = new Map(allTemplates.map((t) => [t.id, t]));
  const officerIsDead = (id: string): boolean => {
    const tpl = templateById.get(id);
    return tpl ? isDead(tpl) : true;
  };
  // Resolve inheritance chains: each chain's item goes to the first alive
  // officer who doesn't already have a primary item.
  const chainAssignments: Record<string, string> = {};
  for (const chain of ITEM_CHAINS) {
    for (const ownerId of chain.ownerChain) {
      if (CANONICAL_ITEMS_PRIMARY[ownerId]) continue;
      if (officerIsDead(ownerId)) continue;
      chainAssignments[ownerId] = chain.itemId;
      break;
    }
  }
  const resolveEquipment = (officerId: string): Equipment => {
    const eq: Equipment = [];
    const addItem = (itemId: string | null | undefined) => {
      if (!itemId) return;
      const item = ITEMS_BY_ID[itemId];
      if (!item) return;
      if (eq.includes(itemId)) return;
      eq.push(itemId);
    };
    addItem(CANONICAL_ITEMS_PRIMARY[officerId]);
    addItem(chainAssignments[officerId]);
    return eq;
  };
  const assigned = OFFICER_TEMPLATES.map((t) => {
    const { skills, rank, traits, doctrine, formations, tactics, policies, level } = resolveSkillsAndRank(t);
    if (isDead(t)) {
      return {
        id: t.id,
        name: t.name,
        courtesyName: t.courtesyName,
        birthYear: t.birthYear,
        deathYear: t.deathYear,
        stats: t.stats,
        loyalty: 0,
        locationCityId: null,
        forceId: null,
        status: 'dead',
        task: null,
        equipment: [],
        skills,
        traits,
        rank,
        doctrine,
        formations,
        tactics,
        policies,
        level,
      } satisfies Officer;
    }
    const a = assignments[t.id];
    return {
      id: t.id,
      name: t.name,
      courtesyName: t.courtesyName,
      birthYear: t.birthYear,
      deathYear: t.deathYear,
      hometownCityId: t.hometownCityId,
      stats: t.stats,
      loyalty: a ? 90 : 0,
      // If assigned in scenario → use that city. Otherwise plant the
      // unsearched officer at their historical hometown if known, so
      // "Search for Talent" only finds them in the right place.
      locationCityId: a?.cityId ?? t.hometownCityId ?? null,
      forceId: a?.forceId ?? null,
      status: (a ? 'idle' : 'unsearched') as Officer['status'],
      task: null,
      equipment: resolveEquipment(t.id),
      skills,
      traits,
      rank,
      doctrine,
      formations,
      tactics,
      policies,
      level,
    } satisfies Officer;
  });

  const talents = TALENT_POOL_TEMPLATES.map<Officer>((t) => {
    const { skills, rank, traits, doctrine, formations, tactics, policies, level } = resolveSkillsAndRank(t);
    const a = assignments[t.id];
    if (isDead(t)) {
      return {
        id: t.id,
        name: t.name,
        courtesyName: t.courtesyName,
        birthYear: t.birthYear,
        deathYear: t.deathYear,
        stats: t.stats,
        loyalty: 0,
        locationCityId: null,
        forceId: null,
        status: 'dead',
        task: null,
        equipment: [],
        skills,
        traits,
        rank,
        doctrine,
        formations,
        tactics,
        policies,
        level,
      };
    }
    return {
      id: t.id,
      name: t.name,
      courtesyName: t.courtesyName,
      birthYear: t.birthYear,
      deathYear: t.deathYear,
      hometownCityId: t.hometownCityId,
      stats: t.stats,
      loyalty: a ? 90 : 0,
      locationCityId: a?.cityId ?? t.hometownCityId ?? null,
      forceId: a?.forceId ?? null,
      status: a ? 'idle' : 'unsearched',
      task: null,
      equipment: resolveEquipment(t.id),
      skills,
      traits,
      rank,
      doctrine,
      formations,
      tactics,
      policies,
      level,
    };
  });

  return [...assigned, ...talents];
}

export const OFFICER_IDS = OFFICER_TEMPLATES.map((t) => t.id);
export const TALENT_POOL_IDS = TALENT_POOL_TEMPLATES.map((t) => t.id);

/**
 * Build historical officers (from dynasties other than the Three Kingdoms)
 * as unsearched free agents waiting at their hometown for "Search for Talent".
 *
 * Filtered to the dynasties the player opted into on the title screen — if
 * the set is empty the result is `[]` (default behaviour: no cross-era roster).
 */
export function buildHistoricalOfficers(enabledDynasties: ReadonlyArray<Dynasty>): Officer[] {
  if (enabledDynasties.length === 0) return [];
  const set = new Set(enabledDynasties);
  return HISTORICAL_OFFICER_TEMPLATES
    .filter((t) => set.has(t.dynasty))
    .map<Officer>((t) => {
      // Mirror the TKM pattern: prefer curated lookups by id, fall back to
      // stat-derived defaults. Historical officers can now share the same
      // OFFICER_TRAITS / OFFICER_SKILLS maps as their Three Kingdoms cousins.
      const skills = OFFICER_SKILLS[t.id] ?? deriveDefaultSkills(t.stats);
      const rank = deriveInitialRank(t.stats);
      const traits = OFFICER_TRAITS[t.id] ?? deriveTraitsFromStats(t.stats);
      const doctrine = deriveDoctrine(t.stats, t.id);
      const formations = deriveFormations(t.stats, t.id);
      const tactics = deriveTactics(t.stats, t.id);
      const policies = derivePolicies(t.stats, t.id);
      const level = deriveLevel(t.stats);
      return {
        id: t.id,
        name: t.name,
        courtesyName: t.courtesyName,
        birthYear: t.birthYear,
        hometownCityId: t.hometownCityId,
        stats: t.stats,
        loyalty: 0,
        locationCityId: t.hometownCityId,
        forceId: null,
        status: 'unsearched',
        task: null,
        equipment: [],
        skills,
        rank,
        traits,
        doctrine,
        formations,
        tactics,
        policies,
        level,
        dynasty: t.dynasty,
        female: t.female,
      };
    });
}
