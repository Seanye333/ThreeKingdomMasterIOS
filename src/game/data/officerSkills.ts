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
  { minStat: 92, rank: 'grand-general' },
  { minStat: 85, rank: 'general' },
  { minStat: 75, rank: 'lt-general' },
  { minStat: 65, rank: 'colonel' },
  { minStat: 55, rank: 'captain' },
];

export function deriveInitialRank(stats: OfficerStats): MilitaryRankId {
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
