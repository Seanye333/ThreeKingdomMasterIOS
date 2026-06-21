import type { MilitaryRankId, OfficerStats } from '../types';
import { HISTORICAL_SKILLS } from './historicalAttributes';

/**
 * Mapping of officer ID → their innate skill IDs.
 * 0–4 skills per officer; defining warlords get 3–4, journeymen 1–2.
 *
 * Officers not in this map default to a single low-tier skill derived from
 * their highest stat at runtime (in deriveDefaultSkills below).
 */
export const OFFICER_SKILLS: Record<string, string[]> = {
  // ─── Wei (Cao Cao) ───────────────────────────────────────
  'cao-cao':      ['sage-of-war', 'celestial-tactician', 'eye-for-talent', 'imposing-host'],
  'xiahou-dun':   ['tiger-vanguard', 'iron-vow', 'brave'],
  'xiahou-yuan':  ['cavalry-master', 'pursuit', 'brave'],
  'cao-ren':      ['wallwarden', 'iron-formation', 'iron-vow'],
  'cao-hong':     ['brave', 'rear-guard'],
  'yu-jin':       ['iron-formation', 'imposing-host'],
  'le-jin':       ['tiger-vanguard', 'brave'],
  'xun-yu':       ['celestial-tactician', 'administrator', 'eye-for-talent'],
  'guo-jia':      ['celestial-tactician', 'fire-master', 'ambush-master'],
  'sima-yi':      ['crouching-dragon', 'celestial-tactician', 'iron-will'],
  'zhang-liao':   ['god-of-war', 'tiger-vanguard', 'pursuit'],
  'xu-chu':       ['god-of-war', 'iron-vow', 'brave'],
  'dian-wei':     ['god-of-war', 'iron-vow'],
  'xu-huang':     ['tiger-vanguard', 'ambush-master', 'iron-vow'],
  'zhang-he':     ['tiger-vanguard', 'cavalry-master'],
  'pang-de':      ['tiger-vanguard', 'iron-vow', 'archer-master'],
  'jia-xu':       ['celestial-tactician', 'fire-master', 'iron-will'],
  'cheng-yu':     ['ambush-master', 'administrator'],
  'man-chong':    ['iron-formation', 'administrator'],
  'cao-pi':       ['imposing-host', 'administrator'],
  'cao-zhi':      ['administrator'],
  'cao-zhang':    ['cavalry-master', 'brave'],

  // ─── Shu (Liu Bei) ───────────────────────────────────────
  'liu-bei':      ['benevolent', 'silver-tongue', 'eye-for-talent'],
  'guan-yu':      ['god-of-war', 'tiger-vanguard', 'iron-vow', 'archer-master'],
  'zhang-fei':    ['flying-general', 'tiger-vanguard', 'brave'],
  'zhao-yun':     ['god-of-war', 'cavalry-master', 'rear-guard', 'iron-vow'],
  'ma-chao':      ['flying-general', 'cavalry-master', 'brave'],
  'huang-zhong':  ['archer-master', 'tiger-vanguard', 'iron-vow'],
  'wei-yan':      ['tiger-vanguard', 'pursuit', 'brave'],
  'zhuge-liang':  ['crouching-dragon', 'fire-master', 'ambush-master', 'administrator'],
  'pang-tong':    ['young-phoenix', 'fire-master', 'ambush-master'],
  'fa-zheng':     ['celestial-tactician', 'ambush-master', 'administrator'],
  'jiang-wei':    ['sage-of-war', 'celestial-tactician', 'cavalry-master'],
  'ma-su':        ['ambush-master', 'administrator'],
  'wang-ping':    ['iron-formation', 'rear-guard'],
  'huang-yueying':['administrator', 'eye-for-talent'],

  // ─── Wu (Sun family) ─────────────────────────────────────
  'sun-jian':     ['tiger-of-jiangdong', 'tiger-vanguard', 'iron-vow'],
  'sun-ce':       ['little-conqueror', 'tiger-vanguard', 'brave'],
  'sun-quan':     ['imposing-host', 'eye-for-talent', 'administrator'],
  'zhou-yu':      ['fire-master', 'celestial-tactician', 'navy-master', 'young-phoenix'],
  'lu-su':        ['administrator', 'silver-tongue', 'eye-for-talent'],
  'lu-meng':      ['sage-of-war', 'navy-master', 'ambush-master'],
  'lu-xun':       ['fire-master', 'crouching-dragon', 'ambush-master'],
  'gan-ning':     ['god-of-war', 'navy-master', 'pursuit'],
  'taishi-ci':    ['archer-master', 'tiger-vanguard', 'brave'],
  'huang-gai':    ['fire-master', 'iron-vow', 'navy-master'],
  'cheng-pu':     ['iron-formation', 'navy-master'],
  'zhou-tai':     ['iron-vow', 'rear-guard', 'brave'],
  'han-dang':     ['navy-master', 'archer-master'],
  'ding-feng':    ['archer-master', 'rear-guard'],
  'zhu-ran':      ['navy-master', 'wallwarden'],

  // ─── Independents & others ───────────────────────────────
  'lu-bu':        ['flying-general', 'god-of-war', 'cavalry-master', 'tiger-vanguard'],
  'diaochan':     ['silver-tongue'],
  'dong-zhuo':    ['imposing-host', 'iron-vow'],
  'li-ru':        ['fire-master', 'ambush-master'],
  'hua-xiong':    ['tiger-vanguard', 'brave'],
  'yuan-shao':    ['eye-for-talent', 'imposing-host'],
  'yuan-shu':     ['imposing-host'],
  'yan-liang':    ['god-of-war', 'brave'],
  'wen-chou':     ['god-of-war', 'brave'],
  'ju-shou':      ['celestial-tactician', 'iron-will'],
  'tian-feng':    ['ambush-master', 'iron-will'],
  'gongsun-zan':  ['cavalry-master', 'tiger-vanguard'],
  'liu-biao':     ['eye-for-talent'],
  'liu-yan':      ['administrator'],
  'liu-zhang':    [],
  'ma-teng':      ['tiger-vanguard', 'cavalry-master'],
  'kong-rong':    ['silver-tongue', 'eye-for-talent'],
  'tao-qian':     ['benevolent'],
  'zhang-jiao':   ['ambush-master', 'silver-tongue', 'fire-master'],
  'zhang-bao-yt': ['ambush-master'],
  'zhang-liang-yt': ['ambush-master'],
  'hua-tuo':      ['benevolent', 'eye-for-talent'],
  'wang-yun':     ['silver-tongue', 'administrator'],

  // ─── Phase 30 expansion: late-era officers ──────────────────────
  // Wei late
  'deng-ai':      ['sage-of-war', 'celestial-tactician', 'cavalry-master', 'ambush-master'],
  'zhong-hui':    ['celestial-tactician', 'crouching-dragon', 'ambush-master'],
  'guo-huai':     ['iron-formation', 'ambush-master', 'cavalry-master'],
  'hao-zhao':     ['wallwarden', 'iron-formation', 'iron-vow'],
  'chen-tai':     ['celestial-tactician', 'iron-formation'],
  'cao-zhen':     ['imposing-host', 'iron-formation', 'cavalry-master'],
  'cao-xiu':      ['tiger-vanguard', 'cavalry-master'],
  'cao-shuang':   [],
  'wen-pin':      ['wallwarden', 'iron-vow', 'iron-formation'],
  'zhong-yao':    ['administrator', 'eye-for-talent'],
  'hua-xin':      ['administrator', 'silver-tongue'],
  'wang-lang':    ['silver-tongue', 'administrator'],
  'chen-qun':     ['administrator', 'eye-for-talent', 'silver-tongue'],

  // Shu late
  'liao-hua':     ['iron-vow', 'rear-guard', 'tireless'],
  'guan-xing':    ['tiger-vanguard', 'iron-vow', 'cavalry-master'],
  'guan-suo':     ['tiger-vanguard', 'brave'],
  'zhang-bao':    ['flying-general', 'brave', 'tiger-vanguard'],
  'ma-dai':       ['cavalry-master', 'pursuit', 'ambush-master'],
  'yan-yan':      ['iron-vow', 'tiger-vanguard', 'rear-guard'],
  'mi-zhu':       ['administrator', 'tax-genius', 'silver-tongue'],
  'sun-qian':     ['silver-tongue', 'administrator'],
  'jian-yong':    ['silver-tongue', 'eye-for-talent'],
  'liu-feng':     ['tiger-vanguard', 'brave'],

  // Wu late
  'lu-ji-wu':     ['administrator', 'eye-for-talent'],
  'zhuge-jin':    ['silver-tongue', 'administrator', 'eye-for-talent'],
  'zhuge-ke':     ['celestial-tactician', 'imposing-host'],
  'bu-zhi':       ['administrator', 'silver-tongue', 'eye-for-talent'],
  'pan-zhang':    ['tiger-vanguard', 'pursuit'],
  'ma-zhong-wu':  ['ambush-master', 'pursuit'],
  'ling-tong':    ['tiger-vanguard', 'brave', 'iron-vow'],
  'sun-jun':      ['tiger-vanguard', 'iron-vow'],
  'quan-cong':    ['cavalry-master', 'navy-master'],

  // Jin precursors
  'sima-shi':     ['celestial-tactician', 'crouching-dragon', 'iron-will'],
  'sima-zhao':    ['crouching-dragon', 'eye-for-talent', 'iron-will'],

  // Han loyalists & misc
  'yang-biao':    ['administrator', 'silver-tongue'],
  'dong-cheng':   ['iron-vow', 'silver-tongue'],
  'yang-xiu':     ['ambush-master', 'celestial-tactician'],

  // ─── Phase 30b additions ────────────────────────────────────
  // Dong Zhuo aftermath
  'li-jue':       ['imposing-host', 'tireless'],
  'guo-si':       ['cavalry-master', 'tireless'],
  'fan-chou':     ['brave'],
  'zhang-ji':     ['cavalry-master', 'brave'],
  'zhang-xiu':    ['cavalry-master', 'tiger-vanguard', 'iron-vow'],
  'hu-zhen':      ['brave'],
  'niu-fu':       [],

  // Yellow Turban remnants
  'guan-hai':     ['brave', 'tiger-vanguard'],
  'pei-yuanshao': ['brave'],
  'sun-zhong':    ['brave'],

  // Northwest (Qiang frontier)
  'cheng-yi':     ['cavalry-master', 'brave'],
  'liang-xing':   ['cavalry-master'],
  'hou-xuan':     ['cavalry-master'],
  'ma-wan':       ['cavalry-master'],
  'yang-qiu'   :  ['cavalry-master', 'silver-tongue'],

  // Wu late additions
  'xu-sheng-wu':  ['navy-master', 'tiger-vanguard', 'iron-vow'],
  'wu-jing':      ['administrator'],
  'sun-huan':     ['tiger-vanguard', 'brave', 'iron-vow'],
  'zhu-zhi':      ['administrator', 'iron-formation'],
  'zhu-huan':     ['iron-formation', 'tiger-vanguard', 'iron-vow'],
  'lu-fan':       ['administrator', 'silver-tongue', 'eye-for-talent'],

  // Wei additions
  'ren-jun':      ['administrator', 'farmer'],
  'shi-huan':     ['cavalry-master', 'ambush-master'],
  'niu-jin':      ['brave'],
  'song-xian':    ['brave'],
  'wei-xu':       ['brave'],
  'wang-jun':     ['navy-master', 'sage-of-war', 'celestial-tactician'],

  // Shu additions
  'yi-ji':        ['silver-tongue', 'administrator'],
  'xiang-lang':   ['administrator', 'eye-for-talent'],
  'huo-jun':      ['wallwarden', 'iron-vow', 'iron-formation'],
  'huo-yi':       ['wallwarden', 'iron-formation', 'administrator'],
  'zhang-yi'    : ['tiger-vanguard', 'iron-vow', 'ambush-master'],
  'zhang-ni':     ['iron-formation', 'iron-vow'],

  // Ladies
  'empress-cao':  ['silver-tongue'],
  'empress-guo':  ['silver-tongue', 'eye-for-talent'],
  'lady-zhen':    ['silver-tongue'],

  // ─── Phase 30c additions ────────────────────────────────────
  // Scholars
  'cai-yan':      ['silver-tongue', 'eye-for-talent'],
  'zheng-xuan':   ['administrator', 'eye-for-talent', 'silver-tongue'],
  'kong-zhou':    ['silver-tongue'],

  // Wei late-era / Jin precursors
  'wei-guan':     ['celestial-tactician', 'administrator', 'iron-will'],
  'he-yan':       ['silver-tongue', 'celestial-tactician'],
  'wang-bi':      ['celestial-tactician', 'eye-for-talent'],
  'cao-huan':     [],
  'liu-fang':     ['administrator', 'silver-tongue'],
  'sun-zi':       ['administrator', 'silver-tongue'],
  'gao-rou':      ['administrator', 'eye-for-talent'],

  // Shu late & "Sleeping Dragon's circle"
  'zhuge-shang':  ['tiger-vanguard', 'iron-vow', 'brave'],
  'wang-lian':    ['administrator', 'tax-genius'],
  'xu-shu':       ['celestial-tactician', 'ambush-master', 'eye-for-talent'],
  'shi-tao':      ['administrator', 'silver-tongue'],
  'cui-zhou-ping':['celestial-tactician', 'silver-tongue'],
  'meng-jian':    ['administrator', 'silver-tongue'],

  // Wu late-era
  'lu-kai':       ['administrator', 'silver-tongue', 'eye-for-talent'],
  'zhang-ti':     ['iron-formation', 'celestial-tactician', 'iron-vow'],
  'lu-jun-wu':    ['navy-master'],
  'sun-jiao':     ['tiger-vanguard', 'navy-master'],
  'sun-xin':      ['navy-master'],

  // Yellow Turban core
  'ma-yuanyi':    ['silver-tongue', 'ambush-master'],

  // Bandits / regional
  'zhang-yan':    ['ambush-master', 'tiger-vanguard'],
  'liu-yu-yzs':   ['benevolent', 'administrator'],

  // More ladies
  'lady-bian-younger':['silver-tongue'],
  'lady-ding':    [],
  'empress-mu':   ['silver-tongue'],

  // ─── Phase 35 ──────────────────────────────────────────────
  'zhu-rong':     ['tiger-vanguard', 'cavalry-master', 'brave'],
  'lady-fan':     ['silver-tongue'],
  'empress-bian': ['silver-tongue', 'eye-for-talent'],
  'sun-luban':    ['silver-tongue', 'eye-for-talent'],
  'meng-huo':     ['imposing-host', 'tiger-vanguard', 'iron-vow'],
  'meng-you':     ['administrator'],
  'mangya-chang': ['tiger-vanguard', 'brave'],
  'jinhuan-sanjie':['brave'],
  'dongtu-na':    ['brave'],
  'ahui-nan':     ['brave'],
  'wutugu':       ['god-of-war', 'iron-vow', 'imposing-host'],
  'dailai-dongzhu':['administrator', 'silver-tongue'],
  'shamoke':      ['cavalry-master', 'archer-master'],
  'tadun':        ['cavalry-master', 'pursuit'],
  'kebi-neng':    ['cavalry-master', 'celestial-tactician', 'ambush-master'],
  'budugen':      ['cavalry-master'],
  'gongsun-yuan': ['wallwarden'],
  // ─── 歷代名將 ───
  ...HISTORICAL_SKILLS,
};

/**
 * Promotion ladder by stat threshold. Used to assign starting ranks based on
 * an officer's best of war/leadership.
 */
const RANK_THRESHOLDS: Array<{ minStat: number; rank: MilitaryRankId }> = [
  { minStat: 95, rank: 'grand-general' },
  { minStat: 93, rank: 'cavalry-general' },
  { minStat: 91, rank: 'chariot-general' },
  { minStat: 89, rank: 'guard-general' },
  { minStat: 87, rank: 'cardinal-general' },
  { minStat: 84, rank: 'campaign-general' },
  { minStat: 81, rank: 'frontier-general' },
  { minStat: 77, rank: 'general' },
  { minStat: 72, rank: 'vice-general' },
  { minStat: 68, rank: 'lt-general' },
  { minStat: 63, rank: 'palace-general' },
  { minStat: 58, rank: 'colonel' },
  { minStat: 52, rank: 'captain' },
];

/**
 * Curated rank overrides for famous historical figures whose actual historical
 * title is well above what max(war, leadership) would derive — chancellors,
 * grand chancellors, founding emperors who held the highest civilian post.
 * Looked up by `deriveInitialRank` with id; falls back to stat-derived rank.
 */
export const OFFICER_RANKS: Record<string, MilitaryRankId> = {
  // ─── 三國 — chancellors who'd otherwise rank as general ───
  'cao-cao':       'chancellor',     // 漢丞相
  'zhuge-liang':   'chancellor',     // 蜀漢丞相
  'sima-yi':       'chancellor',     // 西晉宣帝
  'sima-shi':      'chancellor',
  'sima-zhao':     'chancellor',
  'cao-pi':        'chancellor',     // 魏文帝
  'jiang-wan':     'chancellor',     // 蜀漢
  'lu-su':         'chancellor',     // 大都督
  // ─── 歷代名將 — chancellors / 丞相 / 太宰 ───
  'hist-jiang-ziya':   'chancellor',
  'hist-zhou-gong':    'chancellor',
  'hist-yi-yin':       'chancellor',
  'hist-guan-zhong':   'chancellor',
  'hist-zi-chan':      'chancellor',
  'hist-yan-ying':     'chancellor',
  'hist-confucius':    'chancellor',  // honorary — 至聖
  'hist-shang-yang':   'chancellor',  // 大良造 → chancellor-equivalent
  'hist-su-qin':       'chancellor',  // 六國相印
  'hist-zhang-yi':     'chancellor',  // 秦相
  'hist-fan-ju':       'chancellor',
  'hist-lu-buwei':     'chancellor',
  'hist-xinling-jun':  'chancellor',
  'hist-pingyuan-jun': 'chancellor',
  'hist-chunshen-jun': 'chancellor',
  'hist-mengchang-jun':'chancellor',
  'hist-li-si':        'chancellor',  // 秦丞相
  'hist-feng-quji':    'chancellor',
  'hist-xiao-he':      'chancellor',  // 漢相
  'hist-cao-can':      'chancellor',  // 漢相
  'hist-chen-ping':    'chancellor',  // 漢相
  'hist-wang-ling':    'chancellor',
  'hist-zhou-bo':      'chancellor',
  'hist-shentu-jia':   'chancellor',
  'hist-gongsun-hong': 'chancellor',
  'hist-huo-guang':    'chancellor',  // 大將軍輔政
  'hist-zhai-fangjin': 'chancellor',
  'hist-xiao-wangzhi': 'chancellor',
  'hist-wang-jia':     'chancellor',
  'hist-deng-yu':      'chancellor',
  'hist-han-xin':      'grand-general',
  'hist-wei-qing':     'grand-general',
  'hist-huo-qubing':   'grand-general',
  'hist-zhou-yafu':    'chancellor',
  'hist-zhang-liang':  'chancellor',  // 留侯 — 國師等同
  'hist-bai-qi':       'grand-general',
  'hist-wang-jian':    'grand-general',
  'hist-meng-tian':    'grand-general',
  'hist-li-mu':        'grand-general',
  'hist-lian-po':      'grand-general',
  'hist-yue-yi':       'chancellor',
  'hist-tian-dan':     'chancellor',
  'hist-wang-meng':    'chancellor',  // 前秦丞相
  'hist-xie-an':       'chancellor',  // 東晉太傅
  'hist-wang-dao':     'chancellor',
  'hist-yu-liang':     'chancellor',
  'hist-yang-yin':     'chancellor',
  'hist-su-chuo':      'chancellor',
  'hist-fang-xuanling':'chancellor',  // 唐相
  'hist-du-ruhui':     'chancellor',
  'hist-wei-zheng':    'chancellor',
  'hist-changsun-wuji':'chancellor',
  'hist-zhang-jiuling':'chancellor',
  'hist-yao-chong':    'chancellor',
  'hist-song-jing':    'chancellor',
  'hist-di-renjie':    'chancellor',
  'hist-li-linfu':     'chancellor',
  'hist-yang-guozhong':'chancellor',
  'hist-li-deyu':      'chancellor',
  'hist-niu-sengru':   'chancellor',
  'hist-li-bi':        'chancellor',
  'hist-lu-zhi-tang':  'chancellor',
  'hist-yang-yan':     'chancellor',
  'hist-zhang-jianzhi':'chancellor',
  'hist-li-jing':      'grand-general',
  'hist-li-ji':        'grand-general',
  'hist-su-dingfang':  'grand-general',
  'hist-xue-rengui':   'grand-general',
  'hist-guo-ziyi':     'grand-general',
  'hist-li-guangbi':   'grand-general',
  'hist-gao-xianzhi':  'grand-general',
  'hist-geshu-han':    'grand-general',
  'hist-feng-dao':     'chancellor',  // 五代五朝元老
  'hist-zhao-pu':      'chancellor',  // 宋初宰相
  'hist-kou-zhun':     'chancellor',
  'hist-han-qi':       'chancellor',
  'hist-fu-bi':        'chancellor',
  'hist-fan-zhongyan': 'chancellor',
  'hist-wen-yanbo':    'chancellor',
  'hist-sima-guang':   'chancellor',
  'hist-wang-anshi':   'chancellor',
  'hist-zhang-dun':    'chancellor',
  'hist-cai-jing':     'chancellor',  // 北宋奸相
  'hist-qin-hui':      'chancellor',  // 南宋奸相
  'hist-zhao-ding':    'chancellor',
  'hist-zhang-jun-song-prime':'chancellor',
  'hist-shi-miyuan':   'chancellor',
  'hist-han-tuozhou':  'chancellor',
  'hist-jia-sidao':    'chancellor',
  'hist-yu-yunwen':    'chancellor',
  'hist-yue-fei':      'grand-general',
  'hist-han-shizhong': 'grand-general',
  'hist-wen-tianxiang':'chancellor',
  'hist-lu-yijian':    'chancellor',
  'hist-du-yan':       'chancellor',
  'hist-zhao-ruyu':    'chancellor',
  'hist-chen-kangbo':  'chancellor',
  'hist-yelu-chucai':  'chancellor',
  'hist-toghto':       'chancellor',
  'hist-li-meng':      'chancellor',
  'hist-bayan':        'grand-general',
  'hist-muqali':       'grand-general',
  'hist-subutai':      'grand-general',
  'hist-jebe':         'grand-general',
  'hist-tolui':        'grand-general',
  'hist-hulagu':       'grand-general',
  'hist-batu':         'grand-general',
  'hist-liu-bowen':    'chancellor',
  'hist-yao-guangxiao':'chancellor',
  'hist-yang-shiqi':   'chancellor',  // 三楊
  'hist-yang-rong':    'chancellor',
  'hist-yang-pu':      'chancellor',
  'hist-yan-song':     'chancellor',  // 嘉靖朝首輔
  'hist-xu-jie':       'chancellor',
  'hist-gao-gong':     'chancellor',
  'hist-shen-shixing': 'chancellor',
  'hist-zhang-juzheng':'chancellor',  // 萬曆首輔
  'hist-shi-kefa':     'chancellor',
  'hist-ye-xianggao':  'chancellor',
  'hist-li-tingji':    'chancellor',
  'hist-xu-da':        'grand-general',
  'hist-chang-yuchun': 'grand-general',
  'hist-qi-jiguang':   'grand-general',
  'hist-yu-dayou':     'grand-general',
  'hist-lan-yu':       'grand-general',
  'hist-fan-wencheng': 'chancellor',
  'hist-zhang-tingyu': 'chancellor',  // 雍正首輔
  'hist-ortai':        'chancellor',
  'hist-chen-tingjing':'chancellor',
  'hist-heshen':       'chancellor',  // 乾隆朝權相
  'hist-fukanggan':    'grand-general',
  'hist-agui':         'grand-general',
  'hist-zhaohui':      'grand-general',
  'hist-zeng-guofan':  'chancellor',  // 武英殿大學士
  'hist-zuo-zongtang': 'chancellor',
  'hist-li-hongzhang': 'chancellor',  // 文華殿大學士
  'hist-lin-zexu':     'chancellor',
  'hist-hu-linyi':     'general',
  'hist-yixin':        'chancellor',  // 議政王
  'hist-wenxiang':     'chancellor',
  'hist-weng-tonghe':  'chancellor',
  'hist-yuan-shikai':  'chancellor',
};

export function deriveInitialRank(stats: OfficerStats, id?: string): MilitaryRankId {
  if (id && OFFICER_RANKS[id]) return OFFICER_RANKS[id];
  const best = Math.max(stats.war, stats.leadership);
  for (const { minStat, rank } of RANK_THRESHOLDS) {
    if (best >= minStat) return rank;
  }
  return 'soldier';
}

/**
 * Officers without a hand-assigned skill list get a single low-tier skill
 * derived from their highest stat. Keeps the dataset alive without forcing
 * us to list every minor general.
 */
export function deriveDefaultSkills(stats: OfficerStats): string[] {
  const best = Math.max(stats.war, stats.leadership, stats.intelligence, stats.politics);
  if (best < 60) return [];
  if (stats.war >= 85) return ['brave'];
  if (stats.intelligence >= 85) return ['ambush-master'];
  if (stats.politics >= 85) return ['administrator'];
  if (stats.leadership >= 80) return ['iron-formation'];
  if (stats.war >= 75) return ['brave'];
  if (stats.intelligence >= 75) return ['administrator'];
  return [];
}
