import type { Officer } from '../types';
import type { Force } from '../types';

/**
 * Canonical retinues, keyed by a force's **ruler** officer id (stable across
 * scenarios). Many secondary warlords historically commanded a dozen officers
 * but shipped in scenarios as lone rulers (or with one or two), leaving their
 * subordinates sitting in the free-agent pool. `fillRetinues` (below) enlists
 * each ruler's listed subordinates into that force at scenario start, provided
 * the officer exists in that scenario, is alive that year, and isn't already
 * serving someone else.
 *
 * Officers who historically changed lords (e.g. 趙雲: 公孫瓚→劉備, 張遼: 呂布→曹操,
 * 馬超/法正: 劉璋/馬騰→劉備) can appear under more than one ruler — the
 * already-assigned guard + per-scenario assignments resolve who actually gets
 * them, so the *later* owner (already hand-assigned) always wins.
 */
/**
 * 一條從屬。字串 = 一開局就在;物件可加 `since` —— **那一年之後才算他的人**。
 *
 * 需要 `since` 是因為主公們的班底是**一個一個來的**:張遼 198 年下邳城破才歸曹操,
 * 賈詡 199 年隨張繡來降,太史慈 199 年為孫策所擒而後降。沒有年份的話,
 * 190 年的反董卓聯軍盤上曹操帳下就會冒出張遼 —— 那時他還在丁原、董卓那邊。
 */
export type RetinueEntry = string | { id: string; since: number };

export const RETINUE: Record<string, RetinueEntry[]> = {
  /*
   * ── 三國主角三家 ────────────────────────────────────────────────
   *
   * 這三家原本**一條都沒有**,理由是「他們每張盤都手寫」。可是手寫的份量遠遠
   * 不夠:200 年官渡盤上曹操九將、袁紹五將、孫策六將,而周瑜、張昭、太史慈、
   * 荀攸、程昱、許褚、張遼、徐晃、賈詡、李典、沮授、審配、郭圖、逢紀、高覽、
   * 袁譚袁尚袁熙、趙雲、孫乾、簡雍 —— 那個時代的整個幕府,全躺在 unsearched
   * 的人才池裡。而次要諸侯(劉璋十二將、劉表七將)反而是滿的,因為他們有
   * RETINUE。主角比配角還空,是這張表的覆蓋面問題,不是設計。
   *
   * 手寫指派永遠優先(fillRetinues 只填「無主且在池裡」的人),所以補這三家
   * 不會覆蓋任何一張盤已經寫好的編制。
   */
  'cao-cao':    ['xiahou-dun', 'xiahou-yuan', 'cao-ren', 'cao-hong', 'le-jin', 'li-dian', 'cao-chun',
                 { id: 'xun-yu', since: 191 }, { id: 'yu-jin', since: 192 }, { id: 'cheng-yu', since: 192 },
                 { id: 'man-chong', since: 194 }, { id: 'guo-jia', since: 196 }, { id: 'xun-you', since: 196 },
                 { id: 'xu-huang', since: 196 }, { id: 'liu-ye', since: 196 }, { id: 'xu-chu', since: 197 },
                 { id: 'zhang-liao', since: 198 }, { id: 'jia-xu', since: 199 }],
  'yuan-shao':  ['yan-liang', 'wen-chou', 'zhang-he', 'gao-lan', 'tian-feng', 'ju-shou', 'shen-pei',
                 'guo-tu', 'feng-ji', 'yuan-tan', 'yuan-xi', 'yuan-shang'],
  'sun-ce':     ['cheng-pu', 'huang-gai', 'han-dang', 'zhu-zhi', 'sun-quan',
                 { id: 'zhou-yu', since: 195 }, { id: 'zhang-zhao', since: 195 }, { id: 'lu-fan', since: 195 },
                 { id: 'jiang-qin', since: 195 }, { id: 'zhou-tai', since: 195 }, { id: 'chen-wu', since: 196 },
                 { id: 'lu-meng', since: 198 }, { id: 'taishi-ci', since: 199 }],
  'liu-bei':    ['guan-yu', 'zhang-fei', { id: 'jian-yong', since: 190 }, { id: 'sun-qian', since: 194 },
                 { id: 'zhao-yun', since: 200 }],

  // ── Three Kingdoms secondary warlords ──────────────────────────────
  'liu-biao':   ['cai-mao', 'kuai-yue', 'kuai-liang', 'huang-zu', 'wen-pin', 'liu-qi', 'liu-cong'],
  'ma-teng':    ['ma-chao', 'ma-dai', 'pang-de', 'han-sui', 'ma-xiu', 'ma-tie'],
  'liu-zhang':  ['zhang-ren', 'yan-yan', 'fa-zheng', 'huang-quan', 'li-yan', 'liu-ba', 'wu-yi', 'zhang-song', 'meng-da', 'wu-lan', 'leigh-tong'],
  'liu-yan':    ['zhang-ren', 'yan-yan', 'huang-quan', 'liu-ba', 'wu-yi'],
  'gongsun-zan':['zhao-yun', 'tian-kai', 'zhang-yan'],
  'tao-qian':   ['cao-bao', 'chen-deng', 'chen-gui', 'mi-zhu', 'ze-rong'],
  'kong-rong':  ['taishi-ci', 'wu-anguo', 'wang-xiu'],
  'zhang-lu':   ['yang-song', 'yang-bo-zl', 'yan-pu', 'zhang-wei'],
  'huangfu-song':['zhu-jun', 'lu-zhi'],
  'shi-xie':    ['shi-shuo', 'shi-hui'],
  'tadun':      ['lou-ban', 'nan-lou', 'su-puyan'],
  'kebi-neng':  ['budugen', 'suli', 'mijia'],
  'gongsun-yuan':['bei-yan', 'yang-zuo'],
  'zhang-rang': ['jian-shuo', 'zhao-zhong', 'duan-gui', 'guo-sheng'],
  'yuan-shu':   ['ji-ling', 'yang-hong-ys', 'zhang-xun', 'chen-lan'],
  'lu-bu':      ['chen-gong', 'gao-shun', 'zhang-liao', 'zang-ba', 'hou-cheng', 'wei-xu', 'song-xian', 'hao-meng', 'cao-xing'],
  'yan-baihu':  ['yan-yu'],
  'liu-yao':    ['zhang-ying', 'fan-neng', 'xue-li'],
  'gongsun-kang':['gongsun-gong'],
  'gongsun-du': ['gongsun-kang', 'gongsun-gong'],
  'sun-jian':   ['cheng-pu', 'huang-gai', 'han-dang', 'sun-ce', 'zhu-zhi'],
  'han-xuan':   ['huang-zhong', 'wei-yan'],
  'jin-xuan':   ['gong-zhi'],
  'wang-lang':  ['yu-fan'],

  // ── Cross-era warlords ───────────────────────────────────────────────
  // Sui-end contenders (隋末群雄)
  'hist-dou-jiande': ['hist-liu-heita', 'hist-su-dingfang'],
  'hist-liu-wuzhou': ['hist-yuchi-gong', 'hist-song-jingang', 'hist-xun-xiang'],
  'hist-du-fuwei':   ['hist-fu-gongshi', 'hist-kan-leng', 'hist-wang-xiongdan'],
  'hist-xue-ju':     ['hist-xue-rengao', 'hist-zong-luohou'],
  // An Lushan rebellion (安史之亂)
  'hist-an-lushan':  ['hist-shi-siming', 'hist-tian-chengsi'],
  // Chu-Han contention (楚漢)
  'hist-chen-yu':    ['hist-li-zuoche'],
  'hist-wei-bao':    ['hist-bai-zhi'],
  'hist-ying-bu':    ['hist-ben-he'],
};

/**
 * Enlist each force's canonical retinue into that force at scenario start.
 * Non-destructive: only fills officers who are present in this scenario,
 * unassigned, alive, and old enough — hand-authored assignments always win.
 */
export function fillRetinues(officers: Officer[], forces: Force[], year: number): Officer[] {
  const result = officers.map((o) => ({ ...o }));
  const byId = new Map(result.map((o) => [o.id, o]));
  const assigned = new Set(result.filter((o) => o.forceId).map((o) => o.id));

  for (const force of forces) {
    const retinue = RETINUE[force.rulerOfficerId];
    if (!retinue) continue;
    for (const entry of retinue) {
      const oid = typeof entry === 'string' ? entry : entry.id;
      // 「那一年之後才算他的人」—— 張遼 198 才歸曹操,在 190 盤上不該出現在他帳下。
      if (typeof entry !== 'string' && year < entry.since) continue;
      if (assigned.has(oid)) continue;          // already serving a lord
      const o = byId.get(oid);
      if (!o || o.forceId || o.status === 'dead') continue;
      if (o.birthYear && o.birthYear > year) continue;       // not born yet
      if (o.birthYear && year - o.birthYear < 15) continue;  // still a child
      if (o.deathYear && o.deathYear < year) continue;       // already dead
      o.forceId = force.id;
      o.locationCityId = force.capitalCityId;
      o.status = 'idle';
      o.loyalty = 90;
      o.retinueOfLordId = force.rulerOfficerId; // 部曲故主 — loyalty floor / grief / re-recruit
      assigned.add(oid);
    }
  }
  return result;
}
