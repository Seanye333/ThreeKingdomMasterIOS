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
export const RETINUE: Record<string, string[]> = {
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
    for (const oid of retinue) {
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
