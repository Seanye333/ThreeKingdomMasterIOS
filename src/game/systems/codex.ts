/**
 * 武將圖鑑 — the collector's album, and it outlives any single campaign.
 *
 * Three ledgers persist in localStorage across games:
 *  - seen 遇 — they took the stage in one of your campaigns
 *  - recruited 仕 — they served under your banner, however briefly
 *  - slain 斬 — they died at your order
 *
 * Famous sets (五虎將, 五子良將, 臥龍鳳雛…) complete when every member
 * has carried your colors. The album never resets — that's the point.
 */
import type { EntityId } from '../types';

const CODEX_KEY = 'tkm-codex-v1';

/** 巔峰形態 — the strongest version of an officer YOU ever fielded, kept
 *  forever: the album remembers the six-star 呂布 you once raised. */
export interface CodexPeak { bp: number; stars: number; grade: string }

export interface Codex {
  seen: string[];
  recruited: string[];
  slain: string[];
  peak: Record<string, CodexPeak>;
  /** 圖鑑功勳 — ids of completion milestones already claimed (cross-campaign,
   *  once ever). See CODEX_MILESTONES / codexClaimMilestone. */
  milestones: string[];
}

export function loadCodex(): Codex {
  try {
    const raw = localStorage.getItem(CODEX_KEY);
    if (!raw) return { seen: [], recruited: [], slain: [], peak: {}, milestones: [] };
    const p = JSON.parse(raw) as Partial<Codex>;
    return {
      seen: Array.isArray(p.seen) ? p.seen : [],
      recruited: Array.isArray(p.recruited) ? p.recruited : [],
      slain: Array.isArray(p.slain) ? p.slain : [],
      peak: p.peak && typeof p.peak === 'object' ? p.peak : {},
      milestones: Array.isArray(p.milestones) ? p.milestones : [],
    };
  } catch {
    return { seen: [], recruited: [], slain: [], peak: {}, milestones: [] };
  }
}

/** Record the current forms of the player's officers; keeps each id's best BP. */
export function codexRecordPeaks(entries: Array<{ id: string; bp: number; stars: number; grade: string }>): void {
  if (entries.length === 0) return;
  const c = loadCodex();
  let changed = false;
  const peak = { ...c.peak };
  for (const e of entries) {
    if (e.id.startsWith('commoner-')) continue;
    const prev = peak[e.id];
    if (!prev || e.bp > prev.bp) {
      peak[e.id] = { bp: e.bp, stars: e.stars, grade: e.grade };
      changed = true;
    }
  }
  if (changed) save({ ...c, peak });
}

function save(c: Codex): void {
  try {
    localStorage.setItem(CODEX_KEY, JSON.stringify(c));
  } catch { /* quota — the album can wait */ }
}

function addAll(list: string[], ids: Iterable<string>): { list: string[]; changed: boolean } {
  const set = new Set(list);
  let changed = false;
  for (const id of ids) {
    if (id.startsWith('commoner-')) continue; // generated nobodies aren't collectible
    if (!set.has(id)) { set.add(id); changed = true; }
  }
  return { list: [...set], changed };
}

export function codexMarkSeen(ids: Iterable<EntityId>): void {
  const c = loadCodex();
  const r = addAll(c.seen, ids);
  if (r.changed) save({ ...c, seen: r.list });
}

export function codexMarkRecruited(id: EntityId): void {
  const c = loadCodex();
  const r = addAll(c.recruited, [id]);
  const s = addAll(c.seen, [id]);
  if (r.changed || s.changed) save({ ...c, recruited: r.list, seen: s.list });
}

export function codexMarkRecruitedMany(ids: Iterable<EntityId>): void {
  const c = loadCodex();
  const r = addAll(c.recruited, ids);
  const s2 = addAll(c.seen, ids);
  if (r.changed || s2.changed) save({ ...c, recruited: r.list, seen: s2.list });
}

export function codexMarkSlain(id: EntityId): void {
  const c = loadCodex();
  const r = addAll(c.slain, [id]);
  const s = addAll(c.seen, [id]);
  if (r.changed || s.changed) save({ ...c, slain: r.list, seen: s.list });
}

/* ─── 成套 — the famous rosters ─── */
export const CODEX_SETS: Array<{ id: string; zh: string; en: string; members: string[] }> = [
  { id: 'five-tigers', zh: '五虎上將', en: 'Five Tiger Generals', members: ['guan-yu', 'zhang-fei', 'zhao-yun', 'ma-chao', 'huang-zhong'] },
  // 樂進 is `le-jin` in the roster — `yue-jin` never existed, so this set was uncompletable.
  { id: 'five-elites', zh: '五子良將', en: 'Five Elite Generals', members: ['zhang-liao', 'le-jin', 'yu-jin', 'zhang-he', 'xu-huang'] },
  { id: 'dragon-phoenix', zh: '臥龍鳳雛', en: 'Dragon & Phoenix', members: ['zhuge-liang', 'pang-tong'] },
  { id: 'oath-brothers', zh: '桃園三結義', en: 'The Oath Brothers', members: ['liu-bei', 'guan-yu', 'zhang-fei'] },
  // 曹氏八虎騎 — the Cao/Xiahou cavalry commanders.
  { id: 'eight-tiger-cavalry', zh: '八虎騎', en: 'Eight Tiger Cavalry', members: ['xiahou-dun', 'xiahou-yuan', 'cao-ren', 'cao-hong', 'cao-chun', 'cao-zhen', 'cao-xiu', 'xiahou-shang'] },
  // 曹魏五大謀臣.
  { id: 'wei-strategists', zh: '曹魏五謀臣', en: 'Five Wei Strategists', members: ['xun-yu', 'xun-you', 'jia-xu', 'cheng-yu', 'guo-jia'] },
  // 蜀漢四相 — the four successive chancellors who held Shu together.
  { id: 'shu-chancellors', zh: '蜀漢四相', en: 'Four Chancellors of Shu', members: ['zhuge-liang', 'jiang-wan', 'fei-yi', 'dong-yun'] },
  // 江東十二虎臣 — 徐盛 (xu-sheng) isn't in the roster, so eleven of the twelve.
  { id: 'jiangdong-tigers', zh: '江東十二虎臣', en: 'Tiger Officers of Jiangdong', members: ['cheng-pu', 'huang-gai', 'han-dang', 'jiang-qin', 'zhou-tai', 'chen-wu', 'dong-xi', 'gan-ning', 'ling-tong', 'pan-zhang', 'ding-feng'] },
  // 呂布八健將.
  { id: 'lubu-eight', zh: '呂布八健將', en: "Lü Bu's Eight Valiants", members: ['zhang-liao', 'gao-shun', 'song-xian', 'wei-xu', 'hou-cheng', 'cao-xing', 'zang-ba', 'hao-meng'] },
  // 河北四庭柱 — Yuan Shao's four pillars.
  { id: 'hebei-pillars', zh: '河北四庭柱', en: 'Four Pillars of Hebei', members: ['yan-liang', 'wen-chou', 'zhang-he', 'gao-lan'] },
  // 建安七子 — the literary masters of the Jian'an era.
  { id: 'jianan-seven', zh: '建安七子', en: 'Seven Scholars of Jian\'an', members: ['kong-rong', 'chen-lin', 'wang-can', 'xu-gan', 'ruan-yu', 'ying-yang', 'liu-zhen'] },
  // 二喬.
  { id: 'two-qiao', zh: '江東二喬', en: 'The Two Qiao', members: ['da-qiao', 'xiao-qiao'] },
  // 絕代佳人 — the great beauties of the age (the canonical 四大美人 roster is cross-era; this is the TK set).
  { id: 'peerless-beauties', zh: '絕代佳人', en: 'Peerless Beauties', members: ['diaochan', 'da-qiao', 'xiao-qiao', 'lady-zhen', 'cai-yan'] },
  // ─── 歷代名將套 — collectible only with the matching dynasty pack enabled ───
  // 凌煙閣 — Taizong's gallery of merit (the eight the roster carries).
  { id: 'lingyan-gallery', zh: '凌煙閣功臣', en: 'Lingyan Pavilion', members: ['hist-fang-xuanling', 'hist-du-ruhui', 'hist-wei-zheng', 'hist-li-jing', 'hist-hou-junji', 'hist-li-ji', 'hist-qin-qiong', 'hist-yuchi-gong'] },
  // 瓦崗群雄 — the Wagang brotherhood of the Sui collapse.
  { id: 'wagang-heroes', zh: '瓦崗群雄', en: 'Heroes of Wagang', members: ['hist-qin-qiong', 'hist-cheng-yaojin', 'hist-luo-cheng', 'hist-shan-xiongxin', 'hist-li-ji'] },
  // 中興名將 — the marshals who held the Southern Song's line (劉光世 absent
  // from the roster; 牛皋 of the 岳家軍 stands the fourth file).
  { id: 'zhongxing-four', zh: '中興名將', en: 'Restoration Marshals', members: ['hist-yue-fei', 'hist-han-shizhong', 'hist-zhang-jun-song-prime', 'hist-niu-gao'] },
  // 楊家將 — the Yang family wall of the north.
  { id: 'yang-family', zh: '楊家將', en: 'The Yang Family', members: ['hist-yang-ye', 'hist-yang-yanzhao', 'hist-yang-zongbao', 'hist-mu-guiying', 'hist-she-taijun'] },
];

/** How many of a set have ever carried your colors. */
export function codexSetProgress(codex: Codex, setId: string): { have: number; total: number } {
  const def = CODEX_SETS.find((s) => s.id === setId);
  if (!def) return { have: 0, total: 0 };
  const rec = new Set(codex.recruited);
  return { have: def.members.filter((m) => rec.has(m)).length, total: def.members.length };
}

/* ─── 圖鑑功勳 — completion milestones ─── */
export interface CodexMilestone {
  id: string;
  zh: string; en: string;
  /** 遇 (seen) count required across all your campaigns. */
  need: number;
  /** Boons paid into the campaign you claim from. */
  scrolls: number;
  gold: number;
}

/**
 * 圖鑑功勳 — reaching a coverage tier of the album (cross-campaign 遇-count) is
 * a claimable, once-ever boon, paid into the campaign you claim it from: a
 * hoard of 名將殘卷 (feeding the 殘卷煉星 track) plus a treasury grant. The
 * historian rewards the completist, and the reward crosses lives — you claim
 * a lifetime tier once, then it is spent.
 */
export const CODEX_MILESTONES: CodexMilestone[] = [
  { id: 'cm-25', zh: '初識群英', en: 'First Acquaintance', need: 25, scrolls: 3, gold: 400 },
  { id: 'cm-50', zh: '博覽將星', en: 'Widely Read', need: 50, scrolls: 5, gold: 800 },
  { id: 'cm-100', zh: '海納百川', en: 'A Hundred Names', need: 100, scrolls: 8, gold: 1500 },
  { id: 'cm-200', zh: '包羅萬象', en: 'Two Hundred Strong', need: 200, scrolls: 14, gold: 2600 },
  { id: 'cm-300', zh: '圖鑑大成', en: 'The Great Album', need: 300, scrolls: 22, gold: 4000 },
];

export function codexMilestoneReached(codex: Codex, m: CodexMilestone): boolean {
  return codex.seen.length >= m.need;
}

export function codexMilestoneClaimed(codex: Codex, id: string): boolean {
  return codex.milestones.includes(id);
}

/** Mark a milestone claimed (cross-campaign). Returns false if already claimed
 *  or not yet reached — the store still owns paying out the boon. */
export function codexClaimMilestone(id: string): boolean {
  const c = loadCodex();
  const m = CODEX_MILESTONES.find((x) => x.id === id);
  if (!m) return false;
  if (c.milestones.includes(id)) return false;
  if (!codexMilestoneReached(c, m)) return false;
  save({ ...c, milestones: [...c.milestones, id] });
  return true;
}
