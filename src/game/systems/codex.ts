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

export interface Codex {
  seen: string[];
  recruited: string[];
  slain: string[];
}

export function loadCodex(): Codex {
  try {
    const raw = localStorage.getItem(CODEX_KEY);
    if (!raw) return { seen: [], recruited: [], slain: [] };
    const p = JSON.parse(raw) as Partial<Codex>;
    return {
      seen: Array.isArray(p.seen) ? p.seen : [],
      recruited: Array.isArray(p.recruited) ? p.recruited : [],
      slain: Array.isArray(p.slain) ? p.slain : [],
    };
  } catch {
    return { seen: [], recruited: [], slain: [] };
  }
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
];

/** How many of a set have ever carried your colors. */
export function codexSetProgress(codex: Codex, setId: string): { have: number; total: number } {
  const def = CODEX_SETS.find((s) => s.id === setId);
  if (!def) return { have: 0, total: 0 };
  const rec = new Set(codex.recruited);
  return { have: def.members.filter((m) => rec.has(m)).length, total: def.members.length };
}
