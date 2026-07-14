/**
 * 名品圖鑑 — the treasures' album, the item-side twin of the 武將圖鑑.
 *
 * One ledger persists in localStorage across campaigns:
 *  - carried 藏 — an item one of your officers has equipped, however briefly.
 *
 * Famous sets (神兵譜, 寶馬譜…) complete when every member has been in your
 * armoury at some point. Like the officer codex, it never resets.
 */
import type { EntityId } from '../types';

const ITEM_CODEX_KEY = 'tkm-item-codex-v1';

export interface ItemCodex {
  carried: string[];
  /** 藏珍功勳 — collection milestones already claimed (cross-campaign, once). */
  milestones: string[];
}

export function loadItemCodex(): ItemCodex {
  try {
    const raw = localStorage.getItem(ITEM_CODEX_KEY);
    if (!raw) return { carried: [], milestones: [] };
    const p = JSON.parse(raw) as Partial<ItemCodex>;
    return {
      carried: Array.isArray(p.carried) ? p.carried : [],
      milestones: Array.isArray(p.milestones) ? p.milestones : [],
    };
  } catch {
    return { carried: [], milestones: [] };
  }
}

function save(c: ItemCodex): void {
  try {
    localStorage.setItem(ITEM_CODEX_KEY, JSON.stringify(c));
  } catch { /* quota — the album can wait */ }
}

export function itemCodexMarkCarried(id: EntityId): void {
  const c = loadItemCodex();
  if (c.carried.includes(id)) return;
  save({ ...c, carried: [...c.carried, id] });
}

export function itemCodexMarkCarriedMany(ids: Iterable<EntityId>): void {
  const c = loadItemCodex();
  const set = new Set(c.carried);
  let changed = false;
  for (const id of ids) {
    if (!set.has(id)) { set.add(id); changed = true; }
  }
  if (changed) save({ ...c, carried: [...set] });
}

/* ─── 成套 — the famous treasures ─── */
export const ITEM_CODEX_SETS: Array<{ id: string; zh: string; en: string; members: string[] }> = [
  // 神兵譜 — the legendary arms of the Three Kingdoms.
  { id: 'divine-arms', zh: '神兵譜', en: 'Legendary Arms', members: ['green-dragon', 'sky-piercer', 'snake-spear', 'twin-swords', 'gu-ding', 'seven-star', 'yitian'] },
  // 寶馬譜 — the famous war-horses.
  { id: 'famous-steeds', zh: '寶馬譜', en: 'Famous Steeds', members: ['red-hare', 'dilu', 'jue-ying', 'zhuahuang-feidian', 'dawan'] },
];

/** How many of a set have ever entered your armoury. */
export function itemCodexSetProgress(codex: ItemCodex, setId: string): { have: number; total: number } {
  const def = ITEM_CODEX_SETS.find((s) => s.id === setId);
  if (!def) return { have: 0, total: 0 };
  const have = new Set(codex.carried);
  return { have: def.members.filter((m) => have.has(m)).length, total: def.members.length };
}

/* ─── 藏珍功勳 — collection milestones (item-side twin of 圖鑑功勳) ─── */
export interface ItemCodexMilestone {
  id: string;
  zh: string; en: string;
  /** 藏 (carried) count required across all your campaigns. */
  need: number;
  /** Boons paid into the campaign you claim from — a smith's hoard. */
  iron: number;
  gold: number;
}

/**
 * 藏珍功勳 — reaching a coverage tier of the treasure album is a claimable,
 * once-ever boon paid into the campaign you claim from: 鐵 for the forge plus
 * treasury gold. The item-side mirror of the officer codex's 圖鑑功勳.
 */
export const ITEM_CODEX_MILESTONES: ItemCodexMilestone[] = [
  { id: 'im-20', zh: '初蓄名器', en: 'A First Hoard', need: 20, iron: 200, gold: 400 },
  { id: 'im-50', zh: '藏鋒斂鍔', en: 'A Growing Trove', need: 50, iron: 400, gold: 800 },
  { id: 'im-100', zh: '琳琅滿目', en: 'A Hundred Treasures', need: 100, iron: 800, gold: 1500 },
  { id: 'im-200', zh: '寶藏充盈', en: 'Two Hundred Strong', need: 200, iron: 1400, gold: 2600 },
  { id: 'im-350', zh: '富埒王侯', en: 'A King\'s Ransom', need: 350, iron: 2400, gold: 4000 },
];

export function itemCodexMilestoneReached(codex: ItemCodex, m: ItemCodexMilestone): boolean {
  return codex.carried.length >= m.need;
}

export function itemCodexMilestoneClaimed(codex: ItemCodex, id: string): boolean {
  return codex.milestones.includes(id);
}

/** Mark a milestone claimed (cross-campaign). Returns false if already claimed
 *  or not yet reached — the store owns paying out the boon. */
export function itemCodexClaimMilestone(id: string): boolean {
  const c = loadItemCodex();
  const m = ITEM_CODEX_MILESTONES.find((x) => x.id === id);
  if (!m) return false;
  if (c.milestones.includes(id)) return false;
  if (!itemCodexMilestoneReached(c, m)) return false;
  save({ ...c, milestones: [...c.milestones, id] });
  return true;
}
