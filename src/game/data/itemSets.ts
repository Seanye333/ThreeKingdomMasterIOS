import type { Officer } from '../types';

/**
 * 神兵譜 — themed sets of legendary gear. Carry every piece of a set on one
 * officer and the matched arms resonate (套裝共鳴) for a battle-power bonus, on
 * top of each item's own effects. A collection meta layered on the new item
 * rarity: hunting down a full 桃園虎將 or 溫侯之配 set is its own goal.
 */
export interface ItemSet {
  id: string;
  name: { zh: string; en: string };
  /** All member item ids — the bonus applies only when the officer holds them all. */
  members: string[];
  /** Combat power bonus when the full set is equipped (e.g. 0.10 = +10%). */
  powerBonus: number;
  color: string;
}

export const ITEM_SETS: ItemSet[] = [
  {
    id: 'taoyuan-tigers',
    name: { zh: '桃園虎將', en: 'Peach-Garden Tigers' },
    members: ['green-dragon', 'snake-spear', 'dragon-gut'],
    powerBonus: 0.1,
    color: '#e6c473',
  },
  {
    id: 'wenhou',
    name: { zh: '溫侯之配', en: "Lü Bu's Arms" },
    members: ['sky-piercer', 'red-hare'],
    powerBonus: 0.12,
    color: '#8ee8ff',
  },
  {
    id: 'mengde-swords',
    name: { zh: '魏武雙鋒', en: "Cao Cao's Twin Blades" },
    members: ['yitian', 'qing-gang'],
    powerBonus: 0.08,
    color: '#cfd8e0',
  },
  {
    id: 'three-strategies',
    name: { zh: '韜略並修', en: 'Masters of Strategy' },
    members: ['sunzi-bingfa', 'taigong-bingfa', 'liu-tao'],
    powerBonus: 0.08,
    color: '#88b7e8',
  },
  // ── 鍛造神兵套 — forge-only weapon sets (集齊全套方共鳴) ──
  {
    id: 'olympus',
    name: { zh: '奧林帕斯', en: 'Olympian Arms' },
    members: ['bosaidun-cha', 'aruisi-mao', 'zhousi-leiting', 'akiliusi-mao'],
    powerBonus: 0.13,
    color: '#e6c473',
  },
  {
    id: 'norse-gods',
    name: { zh: '北歐諸神', en: 'Arms of the Aesir' },
    members: ['leishen-chui', 'yongheng-qiang', 'tier-jian'],
    powerBonus: 0.10,
    color: '#8ee8ff',
  },
  {
    id: 'shanhai-fiends',
    name: { zh: '山海凶獸', en: 'Beasts of the Shanhaijing' },
    members: ['taotie-fu', 'qiongqi-qiang', 'xiangliu-ji'],
    powerBonus: 0.10,
    color: '#b07cd0',
  },
  {
    id: 'gulong-seven',
    name: { zh: '古龍七兵', en: "Gu Long's Seven Weapons" },
    members: ['kong-que-ling', 'chang-sheng-jian', 'li-bie-gou', 'bi-yu-dao2', 'duo-qing-huan'],
    powerBonus: 0.14,
    color: '#7ed68a',
  },
  // ── 武器 + 甲 同源套 — a forged weapon paired with its matching armor ──
  {
    id: 'xuanjia-cavalry',
    name: { zh: '玄甲鐵騎', en: 'Black-Armor Cavalry' },
    members: ['liuxing-zhuifeng-shuo', 'xuanjia'],
    powerBonus: 0.08,
    color: '#6a8fb0',
  },
  // ── 鍛造甲冑套 — forge-only armor sets ──
  {
    id: 'four-symbols-armor',
    name: { zh: '四象神甲', en: 'Four-Symbols Divine Armor' },
    members: ['qinglong-linjia', 'baihu-yinkai', 'zhuque-huojia', 'xuanwu-zhongjia'],
    powerBonus: 0.14,
    color: '#7ed68a',
  },
  {
    id: 'iron-guard',
    name: { zh: '重鎧鐵衛', en: 'Iron Guard' },
    members: ['xuantie-zhongkai', 'luoma-banjia', 'budong-mingwang-jia'],
    powerBonus: 0.10,
    color: '#8896a4',
  },
  // ── 名將全裝套 — a hero's full kit (兵器 + 坐騎 + 甲) resonates strongest ──
  {
    id: 'guan-yu-saint',
    name: { zh: '關羽武聖', en: 'Guan Yu, God of War' },
    members: ['green-dragon', 'red-hare'],
    powerBonus: 0.12,
    color: '#b8442e',
  },
  {
    id: 'zhao-yun-everwin',
    name: { zh: '趙雲常勝', en: 'Zhao Yun the Ever-Victorious' },
    members: ['dragon-gut', 'zhao-yun-yin-jia', 'zhaoye-yushizi'],
    powerBonus: 0.15,
    color: '#cfd8e0',
  },
  {
    id: 'zhang-fei-tenthousand',
    name: { zh: '張飛萬夫', en: 'Zhang Fei, Match for Ten Thousand' },
    members: ['snake-spear', 'zhang-fei-zhuo-jia'],
    powerBonus: 0.12,
    color: '#8896a4',
  },
  {
    id: 'huo-qubing-champion',
    name: { zh: '冠軍封狼', en: 'Champion of Langjuxu' },
    members: ['huo-qubing-jia', 'huo-mobei-jian'],
    powerBonus: 0.12,
    color: '#e6c473',
  },
  // ── 派系平衡名將套 — built from each hero's CANONICAL gear (mostly auto-active),
  //    so 吳/魏/蜀 all get signature 羁绊, across 猛將/謀士/弓手/水戰 roles. ──
  // 吳
  { id: 'mei-zhoulang',   name: { zh: '美周郎',   en: 'Zhou Yu the Fair' },        members: ['zhou-lang-gu-qu', 'zhou-yu-yu-shan'],            powerBonus: 0.12, color: '#7ec8e8' },
  { id: 'youping-guzhu',  name: { zh: '幼平護主', en: 'Zhou Tai the Bodyguard' },  members: ['zhouqiao-shuangdao', 'zhou-tai-xuan-jia'],       powerBonus: 0.11, color: '#8896a4' },
  { id: 'biyan-er',       name: { zh: '碧眼兒',   en: 'The Blue-Eyed Lord' },      members: ['purple-lightning', 'er-zhang-mou'],              powerBonus: 0.10, color: '#a06ed0' },
  { id: 'kurou-ji',       name: { zh: '苦肉計',   en: "Huang Gai's Ruse" },        members: ['shuang-bian', 'zha-xiang-shu'],                  powerBonus: 0.11, color: '#5aa0c8' },
  { id: 'shibie-sanri',   name: { zh: '士別三日', en: "Lü Meng's Diligence" },     members: ['wu-xia-a-meng', 'lu-meng-jiang-shu'],            powerBonus: 0.10, color: '#7ed6a0' },
  // 魏
  { id: 'huchi',          name: { zh: '虎癡',     en: 'Xu Chu the Tiger-Fool' },   members: ['hu-chi-shuang-ji', 'xu-chu-hong-jin-pao'],       powerBonus: 0.12, color: '#c87850' },
  { id: 'xiaoyaojin',     name: { zh: '逍遙津',   en: 'Hero of Xiaoyao Ford' },    members: ['xiaoyaojin-ji', 'ba-bai-po-shi-wan'],            powerBonus: 0.12, color: '#5a8acb' },
  { id: 'guzhi-elai',     name: { zh: '古之惡來', en: 'Evil Lai Reborn' },         members: ['guzhi-shuang-ji', 'shuang-tie-ji-ba-shi'],       powerBonus: 0.11, color: '#b8442e' },
  { id: 'qiaobian-zhanghe',name: { zh: '巧變張郃', en: 'Zhang He the Adaptable' }, members: ['qiao-bian-bingfa', 'jie-ting-po-ma-su'],         powerBonus: 0.10, color: '#88b7e8' },
  // 蜀
  { id: 'jin-machao',     name: { zh: '錦馬超',   en: 'Ma Chao the Splendid' },    members: ['machao-yinlong-qiang', 'xi-liang-tie-qi', 'ma-chao-shi-zi-kui'], powerBonus: 0.14, color: '#cfd8e0' },
  { id: 'laodang-yizhuang',name: { zh: '老當益壯', en: 'Old but Vigorous' },       members: ['tietai-gong', 'lao-dang-yi-zhuang', 'wu-hu-shang-jiang'],         powerBonus: 0.13, color: '#c9a64e' },
  { id: 'wolong',         name: { zh: '臥龍',     en: 'The Crouching Dragon' },    members: ['bagua-robe', 'wooden-ox', 'zhuge-liang-lun-jin'], powerBonus: 0.13, color: '#7ed68a' },
  { id: 'jizhi-jiangwei', name: { zh: '繼志姜維', en: "Jiang Wei's Inheritance" }, members: ['bingfa-ershisi', 'jiu-fa-zhong-yuan'],           powerBonus: 0.10, color: '#9fd0c0' },
  // ── 群雄 + 歷代英傑套 — 三國諸雄 + 楚漢/隋唐/戰國 名將謀臣(皆其標配) ──
  // 三國群雄
  { id: 'weiwu-hegemony', name: { zh: '魏武霸業', en: "Cao Cao's Hegemony" },      members: ['yitian', 'jue-ying', 'cao-cao-wei-wang-fu'],      powerBonus: 0.14, color: '#cfd8e0' },
  { id: 'han-zhaolie',    name: { zh: '漢昭烈',   en: 'Liu Bei the Glorious' },    members: ['twin-swords', 'bi-rou-fu-sheng', 'liu-bei-shu-ji'], powerBonus: 0.12, color: '#d4a84a' },
  { id: 'jiangdong-tiger',name: { zh: '江東猛虎', en: 'Tiger of Jiangdong' },     members: ['imperial-seal', 'sun-jian-jin-pao'],             powerBonus: 0.12, color: '#c87850' },
  { id: 'baima-yicong',   name: { zh: '白馬義從', en: 'White-Horse Volunteers' },  members: ['bai-ma-yi-cong', 'gongsun-zan-bai-pao'],         powerBonus: 0.11, color: '#dfe6ec' },
  { id: 'xiliang-mateng', name: { zh: '西涼馬騰', en: 'Ma Teng of Xiliang' },      members: ['ma-teng-xi-liang-qiang', 'ma-teng-bao-jian'],    powerBonus: 0.11, color: '#c8884e' },
  { id: 'dangkou-chengpu',name: { zh: '蕩寇程普', en: 'Cheng Pu the Veteran' },    members: ['tiejisha-mao', 'cheng-pu-fu-jie'],               powerBonus: 0.10, color: '#8896a4' },
  { id: 'lingjun-liuxiang',name: { zh: '令君留香', en: "Xun Yu's Fragrance" },     members: ['xun-ling-xiang', 'xun-yu-yu-pei'],               powerBonus: 0.10, color: '#88b7e8' },
  // 楚漢
  { id: 'xichu-bawang',   name: { zh: '西楚霸王', en: 'Hegemon-King of Chu' },     members: ['baqiang', 'ba-wang-bie-ji', 'xiang-yu-bing-fu'], powerBonus: 0.14, color: '#b8442e' },
  { id: 'guoshi-wushuang',name: { zh: '國士無雙', en: 'The Matchless Hero' },      members: ['qixing-jian', 'shi-mian-mai-fu', 'han-xin-huai-yin-yin'], powerBonus: 0.14, color: '#e6c473' },
  { id: 'yunchou-weiwo',  name: { zh: '運籌帷幄', en: 'Master of Strategy' },      members: ['yun-chou-wei-wo', 'zhang-liang-pei-jian'],       powerBonus: 0.12, color: '#88b7e8' },
  { id: 'han-gaozu',      name: { zh: '漢高祖',   en: 'Founder of Han' },          members: ['chixiao-jian', 'da-feng-ge', 'han-gaozu-zhao'],  powerBonus: 0.12, color: '#d4a84a' },
  // 隋唐
  { id: 'tian-kehan',     name: { zh: '天可汗',   en: 'The Heavenly Khan' },       members: ['xuanyuan-jian', 'zhen-guan-zheng-yao', 'tian-ke-han'], powerBonus: 0.14, color: '#e6c473' },
  { id: 'weiguo-gong',    name: { zh: '衛國公',   en: 'Duke of Wey (Li Jing)' },   members: ['mingguang-armor', 'wei-gong-bing-fa', 'li-jing-bing-yin'], powerBonus: 0.13, color: '#6a8fb0' },
  { id: 'yumian-xiaohu',  name: { zh: '玉面虓虎', en: 'Yuchi Gong the Fierce' },   members: ['lion-helm', 'yuchi-gong-bian'],                  powerBonus: 0.11, color: '#8896a4' },
  // 戰國
  { id: 'shangyang-reform',name: { zh: '商鞅變法', en: "Shang Yang's Reforms" },   members: ['shangjun-shu', 'xi-mu-li-xin', 'shang-yang-bian-fa-shi'], powerBonus: 0.11, color: '#a0c8e0' },
  { id: 'bingsheng-sunbin',name: { zh: '兵聖孫臏', en: 'Sun Bin the War-Sage' },   members: ['sunbin-bingfa', 'sun-bin-bin-jiao'],             powerBonus: 0.11, color: '#9fd0c0' },
  // ── 鍛造收集套 — forge a themed batch of 神兵 then assemble them on one general.
  //    Purely aspirational (no auto-active); the reward for the 鍛造 grind. ──
  { id: 'liangshan',      name: { zh: '梁山聚義', en: 'Heroes of Liangshan' },     members: ['huyanzhuo-shuangbian', 'suochao-jinzhan-fu', 'dongping-shuangqiang', 'lujunyi-qiang', 'shijin-baohuan-dao'], powerBonus: 0.15, color: '#7ed68a' },
  { id: 'yuejia-jun',     name: { zh: '岳家軍',   en: 'The Yue Family Army' },     members: ['gaochong-zanjin-qiang', 'yueyun-yinchui', 'niugao-shuangjian', 'yangzaixing-qiang'], powerBonus: 0.13, color: '#c9a64e' },
  { id: 'tianxia-mingren',name: { zh: '天下名刃', en: 'Famed Blades of Japan' },   members: ['tongzieqie', 'guiwan-guogang', 'qingling-qie', 'riben-hao'], powerBonus: 0.13, color: '#cfd8e0' },
  { id: 'zhuxian-array',  name: { zh: '誅仙劍陣', en: 'Zhuxian Sword Formation' }, members: ['zhuxian-fumo-jian', 'lu-xian-jian', 'xianxian-jian', 'juexian-jian'], powerBonus: 0.15, color: '#b07cd0' },
  { id: 'yiyu-qibing',    name: { zh: '異域奇兵', en: 'Arms of Distant Lands' },   members: ['damashige-dao', 'bosi-wandao', 'luoma-duanjian', 'weijing-zhanfu'], powerBonus: 0.12, color: '#8ee8ff' },
  { id: 'shanggu-shenshou',name: { zh: '上古神獸', en: 'The Primordial Beasts' },  members: ['yinglong-mao', 'kunpeng-shuo', 'fenghuang-gong', 'kuiniu-chui'], powerBonus: 0.13, color: '#e0623a' },
  // 鍛造甲冑收集套
  { id: 'bailian-jingjia',name: { zh: '百鍊精甲', en: 'Hundred-Temper Plate' },    members: ['bailian-tiejia', 'wujin-lianhuan-kai', 'saitangni-kai'], powerBonus: 0.11, color: '#8896a4' },
  { id: 'ruishou-baojia', name: { zh: '瑞獸寶甲', en: 'Auspicious-Beast Armor' },  members: ['qilin-baojia', 'fengchi-zijin-kui', 'huangjin-suozi-jia'], powerBonus: 0.12, color: '#c9a64e' },
  // ── 諸子百家 + 歷代名士套 — 補齊知名文臣/謀士/名士(皆其標配,多自動激活)──
  // 三國補遺
  { id: 'luxun-inferno',  name: { zh: '陸遜燒營', en: "Lu Xun's Inferno" },        members: ['yue-jue-shu', 'lu-xun-du-du-yin'],               powerBonus: 0.12, color: '#e0623a' },
  { id: 'yibo-yuntian',   name: { zh: '義薄雲天', en: "Guan Yu's Righteousness" },  members: ['spring-autumn', 'han-shou-ting-hou-yin'],        powerBonus: 0.11, color: '#b8442e' },
  // 戰國諸子
  { id: 'quyuan-lisao',   name: { zh: '屈原離騷', en: "Qu Yuan's Lament" },         members: ['li-sao', 'tian-wen', 'jiu-ge'],                  powerBonus: 0.11, color: '#7ec8a0' },
  { id: 'hanfei-fashu',   name: { zh: '韓非法術', en: "Han Fei's Legalism" },       members: ['hanfeizi', 'shuo-nan', 'wu-du'],                 powerBonus: 0.11, color: '#a0c8e0' },
  { id: 'mojia-jianai',   name: { zh: '墨家兼愛', en: 'The Mohist School' },        members: ['mojing', 'mo-zi-shou-cheng-qi', 'mo-zi-tong-ren'], powerBonus: 0.12, color: '#8896a4' },
  { id: 'yasheng-mengzi', name: { zh: '亞聖孟子', en: 'Mencius the Second Sage' },  members: ['meng-zi', 'mengzi-shu-jian'],                    powerBonus: 0.10, color: '#7ed68a' },
  { id: 'xunzi-xinge',    name: { zh: '荀子勸學', en: "Xunzi's Teaching" },         members: ['xun-zi', 'xun-zi-jian'],                         powerBonus: 0.10, color: '#9fd0c0' },
  { id: 'wanbi-guizhao',  name: { zh: '完璧歸趙', en: 'The Returned Jade' },        members: ['wan-bi-gui-zhao', 'mian-chi-hui'],               powerBonus: 0.11, color: '#cfd8e0' },
  { id: 'yueyi-faqi',     name: { zh: '樂毅伐齊', en: "Yue Yi's Campaign" },        members: ['yueyi-lun', 'bao-yan-hui-wang-shu'],             powerBonus: 0.11, color: '#c9a64e' },
  // 唐代名士
  { id: 'shixian-libai',  name: { zh: '詩仙李白', en: 'Li Bai the Banished Immortal' }, members: ['jiang-jin-jiu', 'shu-dao-nan', 'li-bai-bao-jian'], powerBonus: 0.12, color: '#88b7e8' },
  { id: 'shisheng-dufu',  name: { zh: '詩聖杜甫', en: 'Du Fu the Poet-Sage' },      members: ['chun-wang', 'bing-che-xing', 'du-fu-zhu-bi'],    powerBonus: 0.10, color: '#a0b0bf' },
  { id: 'wuzhao-stele',   name: { zh: '武曌稱帝', en: "Wu Zetian's Reign" },        members: ['wuzi-bei', 'wu-zetian-jin-ce', 'shang-guan-wan-er'], powerBonus: 0.12, color: '#c178c7' },
  { id: 'yanjin-liugu',   name: { zh: '顏筋柳骨', en: 'Yan Zhenqing the Loyal' },   members: ['ji-zhi-wen-gao', 'duo-bao-ta-bei', 'yan-zhenqing-yin'], powerBonus: 0.11, color: '#d4a84a' },
  { id: 'shifo-wangwei',  name: { zh: '詩佛王維', en: 'Wang Wei the Poet-Buddha' }, members: ['wang-chuan-tu', 'shan-ju-qiu-ming'],             powerBonus: 0.10, color: '#7ed6a0' },
];

/** The sets an officer has fully assembled in their equipment. */
export function activeItemSets(officer: Officer): ItemSet[] {
  const owned = new Set(officer.equipment);
  return ITEM_SETS.filter((s) => s.members.every((m) => owned.has(m)));
}

/** 套裝共鳴 — combined combat-power multiplier from every full set an officer holds. */
export function itemSetPowerMul(officer: Officer): number {
  let mul = 1;
  for (const s of activeItemSets(officer)) mul *= 1 + s.powerBonus;
  return mul;
}
